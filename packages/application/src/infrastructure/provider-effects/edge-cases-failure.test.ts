import { describe, expect, it, vi } from 'vitest';

import { executeProviderEffect } from './execution.ts';
import type { ProviderOperation } from './types.ts';
import {
  makeExecution,
  makePersistence,
  operation,
  PROVIDER,
  TIMESTAMP,
} from './edge-case-fixtures.ts';

describe('provider effect execution failure boundaries', () => {
  it('maps claim failure and malformed claim results without a provider call', async () => {
    const claimFailure = makeExecution(operation, {
      persistence: {
        ...makePersistence(),
        markPending: vi.fn(async () => {
          throw new Error('database unavailable');
        }),
      },
    });
    expect(await executeProviderEffect(claimFailure)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const malformedClaim = makeExecution(operation, {
      persistence: {
        ...makePersistence(),
        markPending: vi.fn(async () => ({ kind: 'unexpected' }) as never),
      },
    });
    expect(await executeProviderEffect(malformedClaim)).toMatchObject({
      kind: 'error',
      code: 'INTERNAL_ERROR',
    });

    const badClaimedOperation = { ...operation, id: 'bad' };
    const badClaim = makeExecution(operation, {
      persistence: {
        ...makePersistence(),
        markPending: vi.fn(async () => ({
          kind: 'claimed' as const,
          operation: badClaimedOperation as ProviderOperation,
        })),
      },
    });
    expect(await executeProviderEffect(badClaim)).toMatchObject({
      kind: 'error',
      code: 'INTERNAL_ERROR',
    });

    const mismatchedClaim = makeExecution(operation, {
      persistence: {
        ...makePersistence(),
        markPending: vi.fn(async () => ({
          kind: 'claimed' as const,
          operation: {
            ...operation,
            provider: 'other.provider',
            state: 'pending' as const,
          },
        })),
      },
    });
    expect(await executeProviderEffect(mismatchedClaim)).toMatchObject({
      kind: 'error',
      code: 'INTERNAL_ERROR',
    });
  });

  it('fails closed when the clock or retry wait is unavailable', async () => {
    const badClock = makeExecution(operation, {
      clock: { now: vi.fn(() => 'bad') },
      persistence: makePersistence(),
    });
    expect(await executeProviderEffect(badClock)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    const throwingClock = makeExecution(operation, {
      clock: {
        now: vi.fn(() => {
          throw new Error('clock');
        }),
      },
      persistence: makePersistence(),
    });
    expect(await executeProviderEffect(throwingClock)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    let clockCalls = 0;
    const lateClock = makeExecution(operation, {
      clock: {
        now: vi.fn(() => {
          clockCalls += 1;
          return clockCalls === 1 ? TIMESTAMP : 'bad';
        }),
      },
      persistence: makePersistence(),
    });
    expect(await executeProviderEffect(lateClock)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const sleepFailure = makeExecution(operation, {
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(async () => {
          throw { kind: 'safe_retryable' };
        }),
      },
      sleep: vi.fn(async () => {
        throw new Error('wait');
      }),
      persistence: makePersistence(),
    });
    expect(await executeProviderEffect(sleepFailure)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(sleepFailure.adapter.send).toHaveBeenCalledTimes(1);
    const sleepRecordConflict = makeExecution(operation, {
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(async () => {
          throw { kind: 'safe_retryable' };
        }),
      },
      sleep: vi.fn(async () => {
        throw new Error('wait');
      }),
      persistence: {
        ...makePersistence(),
        recordAttempt: vi.fn(async () => 'conflict' as const),
      },
    });
    expect(await executeProviderEffect(sleepRecordConflict)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });

  it('supports pending responses, unknown failure objects, and an omitted sleep port', async () => {
    const pending = makeExecution(operation, {
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(async () => ({
          accepted: true,
          status: 'pending' as const,
          externalEventId: null,
        })),
      },
      persistence: makePersistence(),
    });
    expect(await executeProviderEffect(pending)).toMatchObject({
      kind: 'pending',
      reason: 'await_reconciliation',
    });

    const unknown = makeExecution(operation, {
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(async () => ({ kind: 'unknown' }) as never),
      },
      persistence: makePersistence(),
    });
    expect(await executeProviderEffect(unknown)).toMatchObject({
      kind: 'pending',
      reason: 'ambiguous_provider_outcome',
    });

    const omittedSleep = makeExecution();
    delete (omittedSleep as unknown as { sleep?: unknown }).sleep;
    expect(await executeProviderEffect(omittedSleep)).toMatchObject({
      kind: 'pending',
      reason: 'await_reconciliation',
    });
  });

  it('keeps malformed provider responses pending and never exposes provider text', async () => {
    const responses: readonly unknown[] = [
      null,
      { accepted: false, status: 'accepted', externalEventId: null },
      { accepted: true, status: 'rejected', externalEventId: null },
      { accepted: true, status: 'accepted', externalEventId: '\nsecret' },
    ];
    for (const response of responses) {
      const input = makeExecution(operation, {
        adapter: {
          kind: 'fake',
          provider: PROVIDER,
          send: vi.fn(async () => response as never),
        },
        persistence: makePersistence(),
      });
      const result = await executeProviderEffect(input);
      expect(result).toMatchObject({
        kind: 'pending',
        reason: 'ambiguous_provider_outcome',
      });
      expect(JSON.stringify(result)).not.toContain('secret');
    }
    const recordConflict = makeExecution(operation, {
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(async () => {
          throw new Error('provider secret');
        }),
      },
      persistence: {
        ...makePersistence(),
        recordAttempt: vi.fn(async () => 'conflict' as const),
      },
    });
    expect(await executeProviderEffect(recordConflict)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    const exhaustedRecordConflict = makeExecution(operation, {
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(
          async () =>
            ({
              kind: 'safe_retryable',
            }) as never,
        ),
      },
      persistence: {
        ...makePersistence(),
        recordAttempt: vi.fn(async () => 'conflict' as const),
      },
    });
    expect(await executeProviderEffect(exhaustedRecordConflict)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(exhaustedRecordConflict.adapter.send).toHaveBeenCalledTimes(3);
  });
});
