import { describe, expect, it, vi } from 'vitest';

import {
  createMigrationWorkerRuntime,
  SCHEMA_MIGRATION_RPC,
  scopeMigrationWorkerRuntime,
} from './migration-worker';
import { event as queueEvent } from './migration-worker-test-support';

const event = {
  operation: 'migration.consume' as const,
  outcome: 'success' as const,
  migrationPlanId: null,
  schemaVersionId: null,
  eventId: null,
  correlationId: null,
  cursor: null,
  progress: null,
  attempt: 0,
  retryable: false,
  reasonCode: null,
  durationMs: 0,
};

describe('migration worker runtime boundary', () => {
  it('validates bounded worker configuration and applies explicit overrides', () => {
    const port = { call: vi.fn(async () => ({ accepted: true })) };
    const defaults = createMigrationWorkerRuntime({
      port,
      workerId: 'worker-default',
    });
    expect(defaults.leaseDurationMs).toBeGreaterThan(0);
    expect(defaults.maxBatchRows).toBeGreaterThan(0);
    expect(defaults.maxBatches).toBeGreaterThan(0);

    const explicit = createMigrationWorkerRuntime({
      port,
      workerId: 'worker-explicit',
      now: () => 1,
      leaseDurationMs: 1_000,
      maxBatchRows: 1,
      maxBatchesPerInvocation: 2,
    });
    expect(explicit.now()).toBe(1);
    expect(explicit.leaseDurationMs).toBe(1_000);
    expect(explicit.maxBatchRows).toBe(1);
    expect(explicit.maxBatches).toBe(2);

    expect(defaults.eventClaimAcquired()).toBe(false);
    expect(defaults.eventClaimToken).toBeNull();
    expect(defaults.markEventClaimAcquired()).toBeUndefined();
    expect(defaults.markEventClaimReleased()).toBeUndefined();

    expect(() =>
      createMigrationWorkerRuntime({ port, workerId: 'bad token' }),
    ).toThrow();
    expect(() =>
      createMigrationWorkerRuntime({
        port,
        workerId: 'worker',
        leaseDurationMs: 0,
      }),
    ).toThrow();
    expect(() =>
      createMigrationWorkerRuntime({
        port,
        workerId: 'worker',
        maxBatchRows: 0,
      }),
    ).toThrow();
    expect(() =>
      createMigrationWorkerRuntime({
        port,
        workerId: 'worker',
        maxBatchRows: 129,
      }),
    ).toThrow();
    expect(() =>
      createMigrationWorkerRuntime({
        port,
        workerId: 'worker',
        maxBatchesPerInvocation: 0,
      }),
    ).toThrow();
    expect(() =>
      createMigrationWorkerRuntime({
        port,
        workerId: 'worker',
        maxBatchesPerInvocation: 33,
      }),
    ).toThrow();
  });

  it('fails closed for unscoped release and malformed scoped event requests', async () => {
    const runtime = createMigrationWorkerRuntime({
      port: { call: vi.fn(async () => ({ accepted: true })) },
      workerId: 'worker-event-scope',
    });
    const signal = new AbortController().signal;

    await expect(runtime.releaseEventClaim(signal)).resolves.toEqual({
      ok: false,
      failure: { code: 'EVENT_CLAIM_NOT_SCOPED', retryable: false },
    });

    const scoped = scopeMigrationWorkerRuntime(
      runtime,
      queueEvent,
      '81000000-0000-4000-8000-000000000001',
    );
    await expect(
      scoped.call(SCHEMA_MIGRATION_RPC.claimEvent, null, signal),
    ).resolves.toEqual({
      ok: false,
      failure: { code: 'DEPENDENCY_INVALID_REQUEST', retryable: false },
    });
  });

  it('swallows telemetry failure but fails closed on aborted or broken RPC calls', async () => {
    const telemetry = vi.fn(async () => {
      throw new Error('telemetry unavailable');
    });
    const port = { call: vi.fn(async () => ({ accepted: true })) };
    const runtime = createMigrationWorkerRuntime({
      port,
      workerId: 'worker-runtime',
      telemetry,
    });
    await expect(runtime.emit(event)).resolves.toBeUndefined();

    const aborted = new AbortController();
    aborted.abort();
    await expect(
      runtime.call(SCHEMA_MIGRATION_RPC.readPlan, {}, aborted.signal),
    ).resolves.toMatchObject({
      ok: false,
      failure: { code: 'DEPENDENCY_DEADLINE_EXCEEDED', retryable: true },
    });
    await expect(
      runtime.call(
        SCHEMA_MIGRATION_RPC.readPlan,
        {},
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: true, value: { accepted: true } });

    const unavailable = createMigrationWorkerRuntime({
      workerId: 'worker-error',
      port: {
        call: vi.fn(async () => {
          throw { code: 'DEPENDENCY_UNAVAILABLE', retryable: false } as const;
        }),
      },
    });
    await expect(
      unavailable.call(
        SCHEMA_MIGRATION_RPC.readPlan,
        {},
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      failure: { code: 'DEPENDENCY_UNAVAILABLE', retryable: false },
    });
  });

  it('requires an exact durable dead-letter acknowledgment', async () => {
    const acceptedPort = {
      call: vi.fn(async () => ({ accepted: true })),
    };
    const accepted = createMigrationWorkerRuntime({
      port: acceptedPort,
      workerId: 'worker-dlq',
    });
    await expect(
      accepted.deadLetter(
        { eventId: 'bad' },
        'INVALID_QUEUE_PAYLOAD',
        new AbortController().signal,
      ),
    ).resolves.toBeUndefined();
    expect(acceptedPort.call).toHaveBeenCalledWith(
      SCHEMA_MIGRATION_RPC.deadLetter,
      expect.objectContaining({ reasonCode: 'INVALID_QUEUE_PAYLOAD' }),
      expect.any(AbortSignal),
    );

    const rejected = createMigrationWorkerRuntime({
      workerId: 'worker-dlq-rejected',
      port: { call: vi.fn(async () => ({ accepted: false })) },
    });
    await expect(
      rejected.deadLetter(
        {},
        'INVALID_QUEUE_PAYLOAD',
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({
      code: 'DEPENDENCY_INVALID_RESPONSE',
      retryable: true,
    });

    const lostClaim = createMigrationWorkerRuntime({
      workerId: 'worker-dlq-lost-claim',
      port: {
        call: vi.fn(async () => ({
          accepted: false,
          code: 'EVENT_CLAIM_LOST',
          retryable: true,
        })),
      },
    });
    await expect(
      lostClaim.deadLetter(
        {},
        'INVALID_QUEUE_PAYLOAD',
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({
      code: 'EVENT_CLAIM_LOST',
      retryable: true,
    });

    for (const value of [null, { accepted: true, unexpected: true }]) {
      const malformed = createMigrationWorkerRuntime({
        workerId: 'worker-dlq-malformed',
        port: { call: vi.fn(async () => value) },
      });
      await expect(
        malformed.deadLetter(
          {},
          'INVALID_QUEUE_PAYLOAD',
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({
        code: 'DEPENDENCY_INVALID_RESPONSE',
        retryable: true,
      });
    }

    const failed = createMigrationWorkerRuntime({
      workerId: 'worker-dlq-failed',
      port: {
        call: vi.fn(async () => {
          throw { code: 'DEPENDENCY_UNAVAILABLE', retryable: true } as const;
        }),
      },
    });
    await expect(
      failed.deadLetter(
        {},
        'INVALID_QUEUE_PAYLOAD',
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      retryable: true,
    });
  });

  it('forwards the complete canonical event identity to dead-letter persistence', async () => {
    const port = {
      call: vi.fn(async () => ({ accepted: true })),
    };
    const runtime = createMigrationWorkerRuntime({
      port,
      workerId: 'worker-dlq-identity',
    });

    await expect(
      runtime.deadLetter(
        queueEvent,
        'INVALID_QUEUE_PAYLOAD',
        new AbortController().signal,
      ),
    ).resolves.toBeUndefined();
    expect(port.call).toHaveBeenCalledWith(
      SCHEMA_MIGRATION_RPC.deadLetter,
      {
        eventId: queueEvent.eventId,
        eventType: queueEvent.eventType,
        schemaVersion: queueEvent.schemaVersion,
        aggregateType: queueEvent.aggregateType,
        aggregateId: queueEvent.aggregateId,
        aggregateVersion: queueEvent.aggregateVersion,
        migrationPlanId: queueEvent.payload.migrationPlanId,
        claimToken: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
        ),
        reasonCode: 'INVALID_QUEUE_PAYLOAD',
      },
      expect.any(AbortSignal),
    );

    await expect(
      runtime.deadLetter(
        {
          ...queueEvent,
          payload: { ...queueEvent.payload, migrationPlanId: null },
        },
        'INVALID_QUEUE_PAYLOAD',
        new AbortController().signal,
      ),
    ).resolves.toBeUndefined();
    expect(port.call).toHaveBeenNthCalledWith(
      2,
      SCHEMA_MIGRATION_RPC.deadLetter,
      expect.objectContaining({ migrationPlanId: null }),
      expect.any(AbortSignal),
    );

    await expect(
      runtime.deadLetter(
        {
          ...queueEvent,
          payload: { contentTypeId: queueEvent.payload.contentTypeId },
        },
        'INVALID_QUEUE_PAYLOAD',
        new AbortController().signal,
      ),
    ).resolves.toBeUndefined();
    const thirdRequest = (
      port.call.mock.calls as unknown as Array<
        readonly [unknown, unknown, unknown]
      >
    )[2]?.[1];
    expect(thirdRequest).not.toHaveProperty('migrationPlanId');
  });
});
