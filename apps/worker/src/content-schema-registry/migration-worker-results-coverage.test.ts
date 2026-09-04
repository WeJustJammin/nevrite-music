import { describe, expect, it, vi } from 'vitest';

import {
  decimalAtLeast,
  deadLetterPersistenceError,
  errorCode,
  eventClaimStatus,
  failureRetryable,
  isDurableDeadLetterAcknowledgement,
  isEventEnvelopeCandidate,
  parseBatchResult,
  parsePlanResult,
  planWithBatch,
  readAcquired,
  resultPlan,
  resultStatus,
  resultWith,
  retryAfter,
  safeEventIdentity,
  toNormalizedInput,
} from './migration-worker';
import {
  basePlan,
  event,
  job,
  NOW,
  PLAN_ID,
} from './migration-worker-test-support';
import { SCHEMA_MIGRATION_RPC } from './migration-worker-constants';

describe('migration worker result helper coverage', () => {
  it('covers RPC result parsing, normalization, retry, and identity helpers', () => {
    const plan = basePlan();
    expect(errorCode(null, 'FALLBACK')).toBe('FALLBACK');
    expect(errorCode({ code: 'VALID_CODE' }, 'FALLBACK')).toBe('VALID_CODE');
    expect(errorCode({ code: 'bad code' }, 'FALLBACK')).toBe('FALLBACK');
    expect(failureRetryable(null)).toBe(true);
    expect(failureRetryable({ retryable: false })).toBe(false);
    expect(failureRetryable({ status: 500 })).toBe(true);
    expect(failureRetryable({ status: 400 })).toBe(false);
    expect(failureRetryable({ status: 'bad' })).toBe(true);
    expect(isDurableDeadLetterAcknowledgement({ accepted: true })).toBe(true);
    expect(isDurableDeadLetterAcknowledgement({ accepted: false })).toBe(false);
    expect(
      isDurableDeadLetterAcknowledgement({ accepted: true, extra: 1 }),
    ).toBe(false);
    expect(deadLetterPersistenceError('X').message).toContain('X');
    expect(resultPlan({ plan })).toBe(plan);
    expect(resultPlan(plan)).toBe(plan);
    expect(resultStatus({ status: 'ok' })).toBe('ok');
    expect(resultStatus({ status: 1 })).toBe(null);
    expect(parsePlanResult({ plan })).toEqual(plan);
    expect(() => parsePlanResult({ bad: true })).toThrow();
    expect(
      parseBatchResult({
        plan: {
          done: false,
          cursor: '1',
          progress: 0,
          sourceCount: '0',
          targetCount: '0',
          rowErrorCount: '0',
          migratedCount: '0',
          failedCount: '0',
        },
      }),
    ).toMatchObject({ cursor: '1' });
    expect(() => parseBatchResult({ bad: true })).toThrow();
    expect(
      readAcquired({ acquired: false, reasonCode: 'LEASE_HELD' }),
    ).toMatchObject({ acquired: false, reasonCode: 'LEASE_HELD' });
    expect(
      readAcquired({ acquired: false, reasonCode: 'bad token' }),
    ).toMatchObject({ reasonCode: 'LEASE_UNAVAILABLE' });
    expect(readAcquired({ acquired: true, leaseToken: 'token' })).toMatchObject(
      { acquired: true, leaseToken: 'token', plan: null },
    );
    expect(() =>
      readAcquired({ acquired: true, leaseToken: 'bad token' }),
    ).toThrow();
    expect(() => readAcquired({ acquired: true })).toThrow();
    expect(() => readAcquired({ status: 'bad' })).toThrow();
    for (const status of [
      'new',
      'replayable',
      'duplicate',
      'stale',
      'in_progress',
    ])
      expect(eventClaimStatus({ status })).toBe(status);
    expect(() => eventClaimStatus({ status: 'bad' })).toThrow();
    expect(resultWith('retry')).toMatchObject({
      outcome: 'retry',
      reasonCode: null,
    });
    expect(retryAfter(-1)).toBeGreaterThan(0);
    expect(retryAfter(999)).toBeGreaterThan(0);
    expect(safeEventIdentity(1)).toMatchObject({ eventId: null });
    expect(
      safeEventIdentity({
        eventId: event.eventId,
        eventType: event.eventType,
        schemaVersion: 1,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        aggregateVersion: event.aggregateVersion,
        payload: { migrationPlanId: event.payload.migrationPlanId },
      }),
    ).toEqual({
      eventId: event.eventId,
      eventType: event.eventType,
      schemaVersion: 1,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      aggregateVersion: event.aggregateVersion,
      migrationPlanId: event.payload.migrationPlanId,
    });
    expect(
      safeEventIdentity({
        ...event,
        payload: { ...event.payload, migrationPlanId: null },
      }),
    ).toMatchObject({
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      aggregateVersion: event.aggregateVersion,
      migrationPlanId: null,
    });
    expect(
      safeEventIdentity({
        ...event,
        payload: { ...event.payload, migrationPlanId: 'not-a-uuid' },
      }),
    ).not.toHaveProperty('migrationPlanId');
    expect(
      safeEventIdentity({
        ...event,
        payload: { contentTypeId: event.payload.contentTypeId },
        migrationPlanId: PLAN_ID,
      }),
    ).not.toHaveProperty('migrationPlanId');
    expect(isEventEnvelopeCandidate({ eventType: 'cms.schema.x' })).toBe(true);
    expect(isEventEnvelopeCandidate({})).toBe(false);
    expect(toNormalizedInput(job)).toMatchObject({ event: null, job });
    const eventWithoutPlan = {
      ...event,
      payload: { ...event.payload, migrationPlanId: null },
    };
    expect(toNormalizedInput(eventWithoutPlan)).toMatchObject({
      event: eventWithoutPlan,
      job: null,
    });
    const eventWithPlan = {
      ...event,
      payload: { ...event.payload, migrationPlanId: PLAN_ID },
    };
    expect(toNormalizedInput(eventWithPlan)).toMatchObject({
      event: eventWithPlan,
      job: { migrationPlanId: PLAN_ID },
    });
    expect(toNormalizedInput({ bad: true })).toBe(null);
    expect(
      planWithBatch(basePlan(), {
        done: false,
        cursor: '2',
        progress: 0.5,
        sourceCount: '3',
        targetCount: '3',
        rowErrorCount: '0',
        migratedCount: '3',
        failedCount: '0',
      }),
    ).toMatchObject({ cursor: '2', progress: 0.5 });
    expect(decimalAtLeast('10', '2')).toBe(true);
    expect(decimalAtLeast('bad', '2')).toBe(false);
  });

  it('covers durable result helpers and telemetry-loss/error paths', async () => {
    const emit = vi.fn(async () => undefined);
    const now = () => NOW;
    const completed = await import('./migration-worker-results');
    const plan = basePlan({ state: 'completed', progress: 1 });
    await expect(
      completed.completedResult(plan, null, false, 0, now, emit),
    ).resolves.toMatchObject({
      outcome: 'completed',
      activationSwitched: false,
    });
    await expect(
      completed.completedResult(plan, event, true, 1, now, emit),
    ).resolves.toMatchObject({
      eventId: event.eventId,
      activationSwitched: true,
    });
    await expect(
      completed.workerResultFromBatch(
        plan,
        null,
        {
          outcome: 'progress',
          done: false,
          version: '7',
          cursor: '1',
          progress: 0.1,
          sourceCount: '1',
          targetCount: '1',
          rowErrorCount: '0',
          migratedCount: '1',
          failedCount: '0',
          reasonCode: null,
        },
        0,
        now,
        emit,
      ),
    ).resolves.toMatchObject({ outcome: 'progress' });
    await expect(
      completed.leaseRetry(plan, null, 'LEASE_HELD', 0, now, emit),
    ).resolves.toMatchObject({ outcome: 'retry', reasonCode: 'LEASE_HELD' });
    await expect(
      completed.failureResult(
        plan,
        null,
        { code: 'ERR', retryable: true },
        0,
        now,
        emit,
      ),
    ).resolves.toMatchObject({ outcome: 'retry' });
    await expect(
      completed.failureResult(
        plan,
        null,
        { code: 'ERR', retryable: false },
        0,
        now,
        emit,
      ),
    ).resolves.toMatchObject({ outcome: 'failed_terminal' });
    const call = vi.fn(async () => ({
      ok: true as const,
      value: { plan: basePlan({ state: 'failed_terminal' }) },
    }));
    await expect(
      completed.failAndRollback(
        plan,
        null,
        job,
        'token',
        'ERR',
        false,
        0,
        new AbortController().signal,
        now,
        emit,
        call,
      ),
    ).resolves.toMatchObject({ outcome: 'failed_terminal' });
    expect(call).toHaveBeenCalled();
    const rollbackFailure = vi.fn(async () => ({
      ok: false as const,
      failure: { code: 'ROLLBACK_FAILED', retryable: true },
    }));
    await expect(
      completed.failAndRollback(
        plan,
        null,
        job,
        'token',
        'ERR',
        false,
        0,
        new AbortController().signal,
        now,
        emit,
        rollbackFailure,
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'ROLLBACK_FAILED',
    });
    const malformedRollback = vi.fn(async () => ({
      ok: true as const,
      value: { plan: { invalid: true } },
    }));
    await expect(
      completed.failAndRollback(
        plan,
        null,
        job,
        'token',
        'ERR',
        false,
        0,
        new AbortController().signal,
        now,
        emit,
        malformedRollback,
      ),
    ).resolves.toMatchObject({ outcome: 'failed_terminal' });
  });

  it('does not return terminal when failure acknowledgement cannot be persisted', async () => {
    const completed = await import('./migration-worker-results');
    const plan = basePlan();
    const emit = vi.fn(async () => undefined);
    const now = () => NOW;
    let callCount = 0;
    const call = vi.fn(async (...args: unknown[]) => {
      void args;
      callCount += 1;
      if (callCount === 1)
        return {
          ok: true as const,
          value: { plan: basePlan({ state: 'failed_terminal' }) },
        };
      if (callCount === 2)
        return {
          ok: false as const,
          failure: { code: 'ACK_REJECTED', retryable: false },
        };
      return { ok: true as const, value: { accepted: true } };
    });

    await expect(
      completed.failAndRollback(
        plan,
        event,
        job,
        'token',
        'ERR',
        false,
        0,
        new AbortController().signal,
        now,
        emit,
        call,
        {
          signal: new AbortController().signal,
          call,
          deadLetter: async (_input, reasonCode, deadLetterSignal) => {
            await call(
              SCHEMA_MIGRATION_RPC.deadLetter,
              {
                eventId: event.eventId,
                eventType: event.eventType,
                schemaVersion: event.schemaVersion,
                reasonCode,
              },
              deadLetterSignal,
            );
          },
        },
      ),
    ).resolves.toMatchObject({
      outcome: 'dead_letter',
      reasonCode: 'ACK_REJECTED',
    });
    expect(call).toHaveBeenNthCalledWith(
      3,
      SCHEMA_MIGRATION_RPC.deadLetter,
      {
        eventId: event.eventId,
        eventType: event.eventType,
        schemaVersion: event.schemaVersion,
        reasonCode: 'ACK_REJECTED',
      },
      expect.any(AbortSignal),
    );
  });

  it('does not return terminal for a claimed event when failure acknowledgement cannot be persisted', async () => {
    const completed = await import('./migration-worker-results');
    const plan = basePlan();
    const emit = vi.fn(async () => undefined);
    let callCount = 0;
    const call = vi.fn(async (...args: unknown[]) => {
      void args;
      callCount += 1;
      return callCount === 1
        ? {
            ok: false as const,
            failure: { code: 'ACK_REJECTED', retryable: false },
          }
        : { ok: true as const, value: { accepted: true } };
    });
    const signal = new AbortController().signal;

    await expect(
      completed.failureResult(
        plan,
        event,
        { code: 'VALIDATION_FAILED', retryable: false },
        0,
        () => NOW,
        emit,
        {
          signal,
          call,
          deadLetter: async (_input, reasonCode, deadLetterSignal) => {
            await call(
              SCHEMA_MIGRATION_RPC.deadLetter,
              {
                eventId: event.eventId,
                eventType: event.eventType,
                schemaVersion: event.schemaVersion,
                reasonCode,
              },
              deadLetterSignal,
            );
          },
        },
      ),
    ).resolves.toMatchObject({
      outcome: 'dead_letter',
      reasonCode: 'ACK_REJECTED',
    });
  });

  it('fails closed when terminal failure recovery dependencies are absent', async () => {
    const completed = await import('./migration-worker-results');
    await expect(
      completed.failureResult(
        basePlan(),
        event,
        { code: 'VALIDATION_FAILED', retryable: false },
        0,
        () => NOW,
        vi.fn(async () => undefined),
      ),
    ).rejects.toMatchObject({
      code: 'ACK_RECOVERY_UNAVAILABLE',
      retryable: true,
    });
  });

  it('retries when a terminal failure acknowledgement is temporarily unavailable', async () => {
    const completed = await import('./migration-worker-results');
    const plan = basePlan();
    const emit = vi.fn(async () => undefined);
    let callCount = 0;
    const call = vi.fn(async (...args: unknown[]) => {
      void args;
      callCount += 1;
      return callCount === 1
        ? {
            ok: true as const,
            value: { plan: basePlan({ state: 'failed_terminal' }) },
          }
        : {
            ok: false as const,
            failure: { code: 'ACK_UNAVAILABLE', retryable: true },
          };
    });
    const deadLetter = vi.fn(async () => undefined);

    await expect(
      completed.failAndRollback(
        plan,
        event,
        job,
        'token',
        'ERR',
        false,
        0,
        new AbortController().signal,
        () => NOW,
        emit,
        call,
        { signal: new AbortController().signal, call, deadLetter },
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'ACK_UNAVAILABLE',
    });
    expect(deadLetter).not.toHaveBeenCalled();
  });

  it('returns the terminal failure after a claimed event is acknowledged', async () => {
    const completed = await import('./migration-worker-results');
    const plan = basePlan();
    const emit = vi.fn(async () => undefined);
    const call = vi.fn(async () => ({
      ok: true as const,
      value: { accepted: true },
    }));
    const deadLetter = vi.fn(async () => undefined);

    await expect(
      completed.failureResult(
        plan,
        event,
        { code: 'VALIDATION_FAILED', retryable: false },
        0,
        () => NOW,
        emit,
        {
          signal: new AbortController().signal,
          call,
          deadLetter,
        },
      ),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'VALIDATION_FAILED',
    });
    expect(deadLetter).not.toHaveBeenCalled();
  });

  it('dead-letters invalid terminal failure acknowledgement responses', async () => {
    const completed = await import('./migration-worker-results');
    for (const value of [null, { accepted: false }]) {
      const emit = vi.fn(async () => undefined);
      const call = vi.fn(async () => ({
        ok: true as const,
        value,
      }));
      const deadLetter = vi.fn(async () => undefined);

      await expect(
        completed.failureResult(
          basePlan(),
          event,
          { code: 'VALIDATION_FAILED', retryable: false },
          0,
          () => NOW,
          emit,
          {
            signal: new AbortController().signal,
            call,
            deadLetter,
          },
        ),
      ).resolves.toMatchObject({
        outcome: 'dead_letter',
        reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
      });
      expect(deadLetter).toHaveBeenCalledOnce();
    }
  });

  it('throws a retryable error when acknowledgement dead-letter persistence fails', async () => {
    const completed = await import('./migration-worker-results');
    const plan = basePlan();
    const emit = vi.fn(async () => undefined);
    let callCount = 0;
    const call = vi.fn(async (...args: unknown[]) => {
      void args;
      callCount += 1;
      if (callCount === 1)
        return {
          ok: true as const,
          value: { plan: basePlan({ state: 'failed_terminal' }) },
        };
      if (callCount === 2)
        return {
          ok: false as const,
          failure: { code: 'ACK_REJECTED', retryable: false },
        };
      return {
        ok: false as const,
        failure: { code: 'DLQ_UNAVAILABLE', retryable: true },
      };
    });
    const signal = new AbortController().signal;

    await expect(
      completed.failAndRollback(
        plan,
        event,
        job,
        'token',
        'ERR',
        false,
        0,
        signal,
        () => NOW,
        emit,
        call,
        {
          signal,
          call,
          deadLetter: async (_input, reasonCode, deadLetterSignal) => {
            const deadLetterResult = await call(
              SCHEMA_MIGRATION_RPC.deadLetter,
              {
                eventId: event.eventId,
                eventType: event.eventType,
                schemaVersion: event.schemaVersion,
                reasonCode,
              },
              deadLetterSignal,
            );
            if (!deadLetterResult.ok)
              throw deadLetterPersistenceError(deadLetterResult.failure.code);
          },
        },
      ),
    ).rejects.toMatchObject({
      code: 'DLQ_UNAVAILABLE',
      retryable: true,
    });
  });

  it('fails closed when rollback acknowledgement recovery dependencies are absent', async () => {
    const completed = await import('./migration-worker-results');
    const call = vi.fn(async () => ({
      ok: true as const,
      value: { plan: basePlan({ state: 'failed_terminal' }) },
    }));

    await expect(
      completed.failAndRollback(
        basePlan(),
        event,
        job,
        'token',
        'ERR',
        false,
        0,
        new AbortController().signal,
        () => NOW,
        vi.fn(async () => undefined),
        call,
      ),
    ).rejects.toMatchObject({
      code: 'ACK_RECOVERY_UNAVAILABLE',
      retryable: true,
    });
  });

  it('anchors batch and recovery durations to the injected event clock', async () => {
    const durations: number[] = [];
    const emit = vi.fn(async ({ durationMs }: { durationMs: number }) => {
      durations.push(durationMs);
    });
    const completed = await import('./migration-worker-results');
    const plan = basePlan({ state: 'running', progress: 0.5 });
    const batch = {
      outcome: 'progress' as const,
      done: false,
      version: plan.version,
      cursor: '50',
      progress: 0.5,
      sourceCount: '100',
      targetCount: '50',
      rowErrorCount: '0',
      migratedCount: '50',
      failedCount: '0',
      reasonCode: null,
    };
    const now = () => Date.parse(event.occurredAt) + 60_000;

    await completed.workerResultFromBatch(plan, event, batch, 0, now, emit);
    await completed.failureResult(
      plan,
      event,
      { code: 'DEPENDENCY_UNAVAILABLE', retryable: true },
      0,
      now,
      emit,
    );

    expect(durations).toEqual([60_000, 60_000]);
  });
});
