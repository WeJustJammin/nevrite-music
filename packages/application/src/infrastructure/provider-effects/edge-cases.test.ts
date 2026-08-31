import { describe, expect, it, vi } from 'vitest';

import { executeProviderEffect } from './execution.ts';
import type {
  ProviderEffectRegistry,
  ProviderExecutionInput,
  ProviderOperation,
} from './types.ts';
import {
  makeExecution,
  makePersistence,
  operation,
  OTHER_OPERATION_ID,
  PROVIDER,
  registry,
  TIMESTAMP,
} from './edge-case-fixtures.ts';

describe('provider effect execution boundary guards', () => {
  it('fails closed for malformed execution dependencies before reading canonical state', async () => {
    const valid = makeExecution();
    const malformed: readonly unknown[] = [
      null,
      { ...valid, operationId: 'bad' },
      { ...valid, principal: null },
      { ...valid, principal: [] },
      {
        ...valid,
        principal: { kind: 'other', id: 'platform.provider.effect' },
      },
      { ...valid, principal: { kind: 'queue', id: 7 } },
      { ...valid, restoreFenceOpen: 'true' },
      { ...valid, registry: null },
      { ...valid, persistence: null },
      { ...valid, persistence: { readCanonical: vi.fn() } },
      { ...valid, adapter: null },
      {
        ...valid,
        adapter: { kind: 'external', provider: PROVIDER, send: vi.fn() },
      },
      { ...valid, adapter: { kind: 'fake', provider: 7, send: vi.fn() } },
      { ...valid, adapter: { kind: 'fake', provider: 'BAD', send: vi.fn() } },
      { ...valid, adapter: { kind: 'fake', provider: PROVIDER, send: 'nope' } },
      { ...valid, clock: null },
      { ...valid, clock: { now: 'nope' } },
      { ...valid, sleep: 7 },
    ];
    for (const value of malformed) {
      expect(
        await executeProviderEffect(value as ProviderExecutionInput),
      ).toEqual({
        kind: 'error',
        code: 'INTERNAL_ERROR',
        noBlindResend: true,
      });
    }
  });

  it('maps canonical read failure and rejects malformed canonical records', async () => {
    const readFailure = makeExecution(operation, {
      persistence: {
        ...makePersistence(),
        readCanonical: vi.fn(async () => {
          throw new Error('database unavailable');
        }),
      },
    });
    expect(await executeProviderEffect(readFailure)).toEqual({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
      noBlindResend: true,
    });

    const malformed: readonly unknown[] = [
      7,
      [],
      { ...operation, id: 'bad' },
      { ...operation, provider: 'BAD' },
      { ...operation, operationType: 'BAD' },
      { ...operation, actorId: 'bad' },
      { ...operation, state: 'unknown' },
      { ...operation, intentHash: 'bad' },
      { ...operation, providerRef: '\n' },
      { ...operation, lastAttemptAt: 'bad' },
      { ...operation, reconciliationAt: 'bad' },
      { ...operation, version: '0' },
      { ...operation, correlationId: 'bad' },
      { ...operation, causationId: 'bad' },
      { ...operation, providerIdempotencyKeyHash: 'bad' },
      { ...operation, attempts: null },
      { ...operation, attempts: [null] },
      { ...operation, payload: null },
      { ...operation, payload: { invalid: undefined } },
      {
        ...operation,
        payload: { deep: { a: { b: { c: { d: { e: { f: 'x' } } } } } } },
      },
    ];
    for (const value of malformed) {
      const input = makeExecution(value, {
        persistence: makePersistence(value),
      });
      expect(await executeProviderEffect(input)).toEqual({
        kind: 'error',
        code: 'INTERNAL_ERROR',
        noBlindResend: true,
      });
    }
    const idMismatch = makeExecution(
      { ...operation, id: OTHER_OPERATION_ID },
      {
        persistence: makePersistence({ ...operation, id: OTHER_OPERATION_ID }),
      },
    );
    expect(await executeProviderEffect(idMismatch)).toMatchObject({
      kind: 'error',
      code: 'INTERNAL_ERROR',
    });
  });

  it('accepts complete canonical attempt evidence and JSON payload values', async () => {
    const canonical: ProviderOperation = {
      ...operation,
      providerRef: 'evt-old',
      lastAttemptAt: TIMESTAMP,
      reconciliationAt: TIMESTAMP,
      attempts: [
        {
          attempt: 1,
          startedAt: TIMESTAMP,
          endedAt: TIMESTAMP,
          outcome: 'accepted',
          errorCode: null,
          retryable: false,
        },
        {
          attempt: 2,
          startedAt: TIMESTAMP,
          endedAt: TIMESTAMP,
          outcome: 'rejected',
          errorCode: 'PROVIDER_REJECTED',
          retryable: false,
        },
        {
          attempt: 3,
          startedAt: TIMESTAMP,
          endedAt: TIMESTAMP,
          outcome: 'pending',
          errorCode: 'PROVIDER_PENDING',
          retryable: false,
        },
        {
          attempt: 4,
          startedAt: TIMESTAMP,
          endedAt: TIMESTAMP,
          outcome: 'timeout',
          errorCode: 'PROVIDER_TIMEOUT',
          retryable: false,
        },
        {
          attempt: 5,
          startedAt: TIMESTAMP,
          endedAt: TIMESTAMP,
          outcome: 'retryable_error',
          errorCode: 'PROVIDER_RETRYABLE',
          retryable: true,
        },
        {
          attempt: 6,
          startedAt: TIMESTAMP,
          endedAt: TIMESTAMP,
          outcome: 'unknown_error',
          errorCode: 'PROVIDER_UNKNOWN',
          retryable: false,
        },
      ],
      payload: { recipient: ['artist@example.test', 7, { ready: true }] },
    };
    const input = makeExecution(canonical, {
      persistence: makePersistence(canonical),
    });
    expect(await executeProviderEffect(input)).toMatchObject({
      kind: 'pending',
      reason: 'await_reconciliation',
    });
  });

  it('rejects malformed registry entries before claiming or calling a provider', async () => {
    const variants: readonly ProviderEffectRegistry[] = [
      { [PROVIDER]: undefined as never },
      { [PROVIDER]: { ...registry[PROVIDER], provider: 'other' } },
      { [PROVIDER]: { ...registry[PROVIDER], enabled: false } },
      { [PROVIDER]: { ...registry[PROVIDER], adapterKind: 'external' } },
      { [PROVIDER]: { ...registry[PROVIDER], operationTypes: 'bad' as never } },
      { [PROVIDER]: { ...registry[PROVIDER], operationTypes: ['BAD'] } },
      {
        [PROVIDER]: {
          ...registry[PROVIDER],
          operationTypes: ['asset.publish'],
        },
      },
      {
        [PROVIDER]: {
          ...registry[PROVIDER],
          allowedPayloadKeys: 'bad' as never,
        },
      },
      {
        [PROVIDER]: { ...registry[PROVIDER], allowedPayloadKeys: [7] as never },
      },
    ];
    for (const value of variants) {
      const input = makeExecution(operation, {
        registry: value,
        persistence: makePersistence(),
      });
      expect(await executeProviderEffect(input)).toMatchObject({
        kind: 'error',
        code: 'DEPENDENCY_UNAVAILABLE',
      });
      expect(input.adapter.send).not.toHaveBeenCalled();
    }
  });
});
