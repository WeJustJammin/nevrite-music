import { describe, expect, it } from 'vitest';

import { runBackfillStage } from './migration-worker-backfill';
import { runMigrationBatches } from './migration-worker-batches';
import { runDryRunStage } from './migration-worker-dry-run';
import { acquireMigrationLease } from './migration-worker-lease';
import { createMigrationWorkerRuntime } from './migration-worker-runtime';
import { SCHEMA_MIGRATION_RPC } from './migration-worker-constants';
import {
  basePlan,
  event,
  job,
  makePort,
  NOW,
} from './migration-worker-test-support';

const signal = new AbortController().signal;
const batch = (overrides: Record<string, unknown> = {}) => ({
  done: true,
  cursor: '100',
  progress: 1,
  sourceCount: '100',
  targetCount: '100',
  rowErrorCount: '0',
  migratedCount: '100',
  failedCount: '0',
  ...overrides,
});
type Handler = (
  request: unknown,
  signal: AbortSignal,
) => unknown | Promise<unknown>;
const runtimeFor = (
  handlers: Partial<Record<keyof typeof SCHEMA_MIGRATION_RPC, Handler>> = {},
) => {
  const rpcHandlers = Object.fromEntries(
    Object.entries({
      acknowledgeEvent: () => ({ accepted: true }),
      deadLetter: () => ({ accepted: true }),
      ...handlers,
    }).map(([name, handler]) => [
      SCHEMA_MIGRATION_RPC[name as keyof typeof SCHEMA_MIGRATION_RPC],
      handler,
    ]),
  ) as Parameters<typeof makePort>[0];
  return createMigrationWorkerRuntime({
    port: makePort(rpcHandlers),
    workerId: 'stage-coverage-worker',
    now: () => NOW,
  });
};
const inputFor = (
  runtime: ReturnType<typeof runtimeFor>,
  plan = basePlan(),
  leaseToken: string | null = 'lease-token',
) => ({ runtime, plan, event, job, leaseToken, signal, attempt: 0 });

describe('migration worker stage failure boundaries', () => {
  it('classifies each bounded heartbeat, batch, and cursor outcome', async () => {
    const heartbeatFailure = await runMigrationBatches(
      runtimeFor({
        heartbeatLease: () => {
          throw { code: 'HEARTBEAT_FAILED', retryable: true } as const;
        },
      }),
      basePlan(),
      event,
      job,
      'token',
      false,
      signal,
      0,
      1,
    );
    expect(heartbeatFailure).toMatchObject({
      outcome: 'retry',
      reasonCode: 'HEARTBEAT_FAILED',
    });

    const expired = await runMigrationBatches(
      runtimeFor({ heartbeatLease: () => ({ renewed: false }) }),
      basePlan(),
      event,
      job,
      'token',
      false,
      signal,
      0,
      1,
    );
    expect(expired).toMatchObject({
      outcome: 'retry',
      reasonCode: 'LEASE_EXPIRED',
    });

    for (const retryable of [true, false]) {
      const result = await runMigrationBatches(
        runtimeFor({
          heartbeatLease: () => ({ renewed: true }),
          processBatch: () => {
            throw {
              code: retryable ? 'BATCH_RETRY' : 'BATCH_FAILURE',
              retryable,
            } as const;
          },
        }),
        basePlan(),
        event,
        job,
        'token',
        false,
        signal,
        0,
        1,
      );
      expect(result).toMatchObject({
        outcome: retryable ? 'retry' : 'failure',
        reasonCode: retryable ? 'BATCH_RETRY' : 'BATCH_FAILURE',
      });
    }

    const malformed = await runMigrationBatches(
      runtimeFor({
        heartbeatLease: () => ({ renewed: true }),
        processBatch: () => ({ bad: true }),
      }),
      basePlan(),
      event,
      job,
      'token',
      false,
      signal,
      0,
      1,
    );
    expect(malformed).toMatchObject({
      outcome: 'failure',
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });

    for (const overrides of [{ cursor: '0' }, { progress: 0 }]) {
      const regressed = await runMigrationBatches(
        runtimeFor({
          heartbeatLease: () => ({ renewed: true }),
          processBatch: () => batch({ ...overrides, done: true }),
        }),
        basePlan({ cursor: '1', progress: 0.5 }),
        event,
        job,
        'token',
        false,
        signal,
        0,
        1,
      );
      expect(regressed.outcome).toBe('failure');
    }

    const incomplete = await runMigrationBatches(
      runtimeFor({
        heartbeatLease: () => ({ renewed: true }),
        processBatch: () => batch({ done: false, cursor: '1', progress: 0.5 }),
      }),
      basePlan(),
      event,
      job,
      'token',
      false,
      signal,
      0,
      1,
    );
    expect(incomplete).toMatchObject({
      outcome: 'progress',
      done: false,
      cursor: '1',
    });

    const dryRun = await runMigrationBatches(
      runtimeFor({
        heartbeatLease: () => ({ renewed: true }),
        processDryRunBatch: () => batch({ done: true }),
      }),
      basePlan(),
      event,
      job,
      'token',
      true,
      signal,
      0,
      1,
    );
    expect(dryRun).toMatchObject({ outcome: 'progress', done: true });
  });

  it('handles lease acquisition failures, contention, malformed data, and success', async () => {
    const dependencyFailure = await acquireMigrationLease(
      runtimeFor({
        claimLease: () => {
          throw { code: 'LEASE_DEPENDENCY', retryable: true } as const;
        },
      }),
      basePlan(),
      event,
      job,
      signal,
      0,
    );
    expect(dependencyFailure).toMatchObject({
      kind: 'result',
      result: { outcome: 'retry' },
    });

    const held = await acquireMigrationLease(
      runtimeFor({
        claimLease: () => ({ acquired: false, reasonCode: 'LEASE_HELD' }),
      }),
      basePlan(),
      event,
      job,
      signal,
      0,
    );
    expect(held).toMatchObject({
      kind: 'result',
      result: { reasonCode: 'LEASE_HELD' },
    });

    const malformed = await acquireMigrationLease(
      runtimeFor({
        claimLease: () => ({ acquired: true, leaseToken: 'bad token' }),
      }),
      basePlan(),
      event,
      job,
      signal,
      0,
    );
    expect(malformed).toMatchObject({
      kind: 'result',
      result: { reasonCode: 'DEPENDENCY_INVALID_RESPONSE' },
    });

    const acquired = await acquireMigrationLease(
      runtimeFor({
        claimLease: () => ({
          acquired: true,
          leaseToken: 'token',
          plan: basePlan({ state: 'dry_running' }),
        }),
      }),
      basePlan({ state: 'draft' }),
      event,
      job,
      signal,
      0,
    );
    expect(acquired).toMatchObject({
      kind: 'acquired',
      leaseToken: 'token',
      plan: { state: 'dry_running' },
    });
  });

  it('covers dry-run and backfill stage transitions and rollback boundaries', async () => {
    const untouched = await runDryRunStage(
      inputFor(runtimeFor(), basePlan({ state: 'ready' })),
    );
    expect(untouched).toMatchObject({ plan: { state: 'ready' } });

    const dryRetry = await runDryRunStage(
      inputFor(
        runtimeFor({
          heartbeatLease: () => ({ renewed: true }),
          processDryRunBatch: () => {
            throw { code: 'DRY_RETRY', retryable: true } as const;
          },
        }),
        basePlan({ state: 'dry_running' }),
      ),
    );
    expect(dryRetry).toMatchObject({
      outcome: 'retry',
      reasonCode: 'DRY_RETRY',
    });

    const dryFailure = await runDryRunStage(
      inputFor(
        runtimeFor({
          heartbeatLease: () => ({ renewed: true }),
          processDryRunBatch: () => {
            throw { code: 'DRY_FAILURE', retryable: false } as const;
          },
          rollback: () => ({ plan: basePlan({ state: 'failed_terminal' }) }),
        }),
        basePlan({ state: 'dry_running' }),
      ),
    );
    expect(dryFailure).toMatchObject({ outcome: 'failed_terminal' });

    const dryProgress = await runDryRunStage(
      inputFor(
        runtimeFor({
          heartbeatLease: () => ({ renewed: true }),
          processDryRunBatch: () => batch({ done: false }),
        }),
        basePlan({ state: 'dry_running' }),
      ),
    );
    expect(dryProgress).toMatchObject({ outcome: 'progress' });

    const dryFinalizeFailure = await runDryRunStage(
      inputFor(
        runtimeFor({
          heartbeatLease: () => ({ renewed: true }),
          processDryRunBatch: () => batch(),
          finalizeDryRun: () => {
            throw { code: 'FINALIZE_FAILURE', retryable: false } as const;
          },
        }),
        basePlan({ state: 'dry_running' }),
      ),
    );
    expect(dryFinalizeFailure).toMatchObject({ outcome: 'failed_terminal' });

    const dryFinalizeMalformed = await runDryRunStage(
      inputFor(
        runtimeFor({
          heartbeatLease: () => ({ renewed: true }),
          processDryRunBatch: () => batch(),
          finalizeDryRun: () => ({ bad: true }),
        }),
        basePlan({ state: 'dry_running' }),
      ),
    );
    expect(dryFinalizeMalformed).toMatchObject({
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });

    const dryFinal = await runDryRunStage(
      inputFor(
        runtimeFor({
          heartbeatLease: () => ({ renewed: true }),
          processDryRunBatch: () => batch(),
          finalizeDryRun: () => ({ plan: basePlan({ state: 'ready' }) }),
        }),
        basePlan({ state: 'dry_running' }),
      ),
    );
    expect(dryFinal).toMatchObject({ plan: { state: 'ready' } });

    const claimHeld = await runBackfillStage(
      inputFor(
        runtimeFor({
          claimLease: () => ({ acquired: false, reasonCode: 'LEASE_HELD' }),
        }),
        basePlan({ state: 'ready' }),
        null,
      ),
    );
    expect(claimHeld).toMatchObject({
      outcome: 'retry',
      reasonCode: 'LEASE_HELD',
    });

    const claimMalformed = await runBackfillStage(
      inputFor(
        runtimeFor({
          claimLease: () => ({ acquired: true, leaseToken: 'bad token' }),
        }),
        basePlan({ state: 'ready' }),
        null,
      ),
    );
    expect(claimMalformed).toMatchObject({
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });

    const claimFailure = await runBackfillStage(
      inputFor(
        runtimeFor({
          claimLease: () => {
            throw { code: 'CLAIM_FAILURE', retryable: true } as const;
          },
        }),
        basePlan({ state: 'ready' }),
        null,
      ),
    );
    expect(claimFailure).toMatchObject({
      outcome: 'retry',
      reasonCode: 'CLAIM_FAILURE',
    });
  });
});
