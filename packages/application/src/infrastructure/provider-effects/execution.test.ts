import { describe, expect, it, vi } from 'vitest';

import { executeProviderEffect } from './execution.ts';
import {
  HASH,
  intent,
  makeExecutionInput,
  OPERATION_ID,
  operation,
  PROVIDER,
} from './application-fixtures.ts';

describe('provider effect execution', () => {
  it('does not read or call an adapter while restore-fenced or with an invalid principal', async () => {
    const fenced = makeExecutionInput({ restoreFenceOpen: false });
    expect(await executeProviderEffect(fenced)).toEqual({
      kind: 'retry',
      reason: 'restore_fenced',
      acknowledge: false,
    });
    expect(fenced.persistence.readCanonical).not.toHaveBeenCalled();
    const invalidPrincipal = makeExecutionInput({
      principal: { kind: 'queue', id: 'bad' },
    });
    expect(await executeProviderEffect(invalidPrincipal)).toMatchObject({
      kind: 'error',
      code: 'INTERNAL_ERROR',
    });
  });

  it('re-reads canonical operation and skips missing, pending, and terminal work', async () => {
    const missing = makeExecutionInput({
      persistence: {
        ...makeExecutionInput().persistence,
        readCanonical: vi.fn(async () => null),
      },
    });
    expect(await executeProviderEffect(missing)).toEqual({
      kind: 'retry',
      reason: 'canonical_unavailable',
      acknowledge: false,
    });
    for (const state of [
      'pending',
      'confirmed',
      'failed',
      'manual_review',
    ] as const) {
      const input = makeExecutionInput({
        persistence: {
          ...makeExecutionInput().persistence,
          readCanonical: vi.fn(async () => ({ ...operation, state })),
        },
      });
      const result = await executeProviderEffect(input);
      expect(result).toMatchObject({ kind: 'skip', noProviderCall: true });
      expect(input.adapter.send).not.toHaveBeenCalled();
    }
  });

  it('marks planned work pending before one accepted call and records sanitized evidence', async () => {
    const input = makeExecutionInput();
    const result = await executeProviderEffect(input);
    expect(result).toEqual({
      kind: 'pending',
      operationId: OPERATION_ID,
      reason: 'await_reconciliation',
      noBlindResend: true,
      acknowledgement: 'accepted',
    });
    expect(input.persistence.markPending).toHaveBeenCalledWith({
      operationId: OPERATION_ID,
      expectedVersion: '1',
    });
    expect(input.adapter.send).toHaveBeenCalledWith(
      {
        operationId: OPERATION_ID,
        provider: PROVIDER,
        idempotencyKey: OPERATION_ID,
        operationType: 'notification.send',
        payloadDigest: HASH,
        payload: intent.payload,
      },
      expect.any(AbortSignal),
    );
    expect(input.persistence.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: OPERATION_ID,
        nextState: 'pending',
        outcome: 'accepted',
        errorCode: null,
        retryable: false,
        externalEventId: 'evt-1',
        providerRef: 'evt-1',
      }),
    );
  });

  it('never blindly retries timeout or unknown outcomes and keeps them pending', async () => {
    for (const failure of [
      { kind: 'timeout' as const, errorCode: 'PROVIDER_TIMEOUT' },
      new Error('provider response contains secret'),
    ]) {
      const input = makeExecutionInput({
        adapter: {
          kind: 'fake',
          provider: PROVIDER,
          send: vi.fn(async () => {
            throw failure;
          }),
        },
      });
      const result = await executeProviderEffect(input);
      expect(result).toMatchObject({
        kind: 'pending',
        reason: 'ambiguous_provider_outcome',
        noBlindResend: true,
      });
      expect(input.adapter.send).toHaveBeenCalledTimes(1);
      expect(input.persistence.recordAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ nextState: 'pending', retryable: false }),
      );
      expect(JSON.stringify(result)).not.toContain('secret');
    }
  });

  it('uses at most the two bounded safe retries with the same idempotency key', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce({
        kind: 'safe_retryable',
        errorCode: 'UPSTREAM_BUSY',
      })
      .mockResolvedValueOnce({
        accepted: true,
        status: 'accepted',
        externalEventId: 'evt-2',
      });
    const input = makeExecutionInput({
      adapter: { kind: 'fake', provider: PROVIDER, send },
    });
    expect(await executeProviderEffect(input)).toMatchObject({
      kind: 'pending',
      reason: 'await_reconciliation',
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      idempotencyKey: OPERATION_ID,
    });
    expect(send.mock.calls[1]?.[0]).toMatchObject({
      idempotencyKey: OPERATION_ID,
    });
    expect(input.sleep).toHaveBeenCalledWith(250);

    const exhausted = makeExecutionInput({
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(
          async () => ({ kind: 'safe_retryable', errorCode: 'BUSY' }) as never,
        ),
      },
    });
    expect(await executeProviderEffect(exhausted)).toMatchObject({
      kind: 'pending',
      reason: 'retryable_provider_failure',
    });
    expect(exhausted.adapter.send).toHaveBeenCalledTimes(3);
    expect(exhausted.sleep).toHaveBeenCalledWith(250);
    expect(exhausted.sleep).toHaveBeenCalledWith(750);
  });

  it('records explicit rejection as failed and refuses adapter/provider mismatches', async () => {
    const rejected = makeExecutionInput({
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(async () => ({
          accepted: false,
          status: 'rejected' as const,
          externalEventId: null,
        })),
      },
    });
    expect(await executeProviderEffect(rejected)).toEqual({
      kind: 'failed',
      operationId: OPERATION_ID,
      errorCode: 'PROVIDER_REJECTED',
      noBlindResend: true,
    });
    expect(rejected.persistence.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ nextState: 'failed', outcome: 'rejected' }),
    );
    const mismatch = makeExecutionInput({
      adapter: { kind: 'fake', provider: 'other', send: vi.fn() },
    });
    expect(await executeProviderEffect(mismatch)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(mismatch.adapter.send).not.toHaveBeenCalled();
  });

  it('maps CAS races and evidence write failures without repeating effects', async () => {
    for (const mark of [
      { kind: 'conflict' as const },
      {
        kind: 'already_pending' as const,
        operation: { ...operation, state: 'pending' as const },
      },
      {
        kind: 'terminal' as const,
        operation: { ...operation, state: 'confirmed' as const },
      },
    ]) {
      const input = makeExecutionInput({
        persistence: {
          ...makeExecutionInput().persistence,
          markPending: vi.fn(async () => mark),
        },
      });
      const result = await executeProviderEffect(input);
      expect(result).toMatchObject({
        kind: mark.kind === 'conflict' ? 'retry' : 'skip',
      });
      expect(input.adapter.send).not.toHaveBeenCalled();
    }
    const recordConflict = makeExecutionInput({
      persistence: {
        ...makeExecutionInput().persistence,
        recordAttempt: vi.fn(async () => 'conflict' as const),
      },
    });
    expect(await executeProviderEffect(recordConflict)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    const recordThrow = makeExecutionInput({
      persistence: {
        ...makeExecutionInput().persistence,
        recordAttempt: vi.fn(async () => {
          throw new Error('db');
        }),
      },
    });
    expect(await executeProviderEffect(recordThrow)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });
});
