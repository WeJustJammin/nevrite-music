import { describe, expect, it, vi } from 'vitest';

import { createProviderDeadline, runAbortable } from './execution-deadline.ts';
import type { ProviderDeadline } from './execution-deadline.ts';
import { errorCodeForFailure } from './execution-support.ts';
import { isAllowlistedProviderPayload } from './payload-validation.ts';
import { reconcileProviderOperation } from './reconciliation.ts';
import type {
  ProviderOperation,
  ProviderOperationPersistence,
} from './types.ts';

const OPERATION_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
const INTENT_HASH = 'a'.repeat(64);
const PAYLOAD_DIGEST = 'b'.repeat(64);
const NOW = '2026-08-30T13:00:00.000Z';

const operation: ProviderOperation = {
  id: OPERATION_ID,
  provider: 'local.fake',
  operationType: 'notification.send',
  actorId: ACTOR_ID,
  state: 'planned',
  intentHash: INTENT_HASH,
  payloadDigest: PAYLOAD_DIGEST,
  providerRef: null,
  lastAttemptAt: null,
  reconciliationAt: null,
  version: '1',
  correlationId: CORRELATION_ID,
  causationId: null,
  providerIdempotencyKeyHash: 'c'.repeat(64),
  attempts: [],
  payload: { recipient: 'artist@example.test' },
};

describe('provider-effect boundary contracts', () => {
  it('handles pre-aborted and parent-cancelled deadlines', async () => {
    const preAborted = new AbortController();
    preAborted.abort();
    const preAbortedDeadline = createProviderDeadline(preAborted.signal, 1_000);
    expect(preAbortedDeadline.reason()).toBe('cancelled');
    await expect(
      runAbortable(async () => 'not-called', preAbortedDeadline),
    ).resolves.toEqual({ kind: 'aborted', reason: 'cancelled' });
    preAbortedDeadline.dispose();

    const parent = new AbortController();
    const deadline = createProviderDeadline(parent.signal, 5);
    const pending = runAbortable(
      () =>
        new Promise<string>((resolve) => setTimeout(() => resolve('late'), 25)),
      deadline,
    );
    parent.abort();
    await expect(pending).resolves.toEqual({
      kind: 'aborted',
      reason: 'cancelled',
    });
    await new Promise((resolve) => setTimeout(resolve, 15));
    deadline.dispose();
  });

  it('uses cancellation when an aborted signal has no reason', async () => {
    const preAborted = new AbortController();
    preAborted.abort();
    const preAbortedDeadline: ProviderDeadline = {
      signal: preAborted.signal,
      reason: () => null,
      dispose: () => undefined,
    };
    await expect(
      runAbortable(async () => 'not-called', preAbortedDeadline),
    ).resolves.toEqual({ kind: 'aborted', reason: 'cancelled' });

    const controller = new AbortController();
    const deadline: ProviderDeadline = {
      signal: controller.signal,
      reason: () => null,
      dispose: () => undefined,
    };
    const pending = runAbortable(
      () =>
        new Promise<string>((resolve) => setTimeout(() => resolve('late'), 25)),
      deadline,
    );
    controller.abort();
    await expect(pending).resolves.toEqual({
      kind: 'aborted',
      reason: 'cancelled',
    });
  });

  it('returns the safe fallback code for timeout failures', () => {
    expect(
      errorCodeForFailure({
        kind: 'failure',
        failure: 'timeout',
        errorCode: null,
      }),
    ).toBe('PROVIDER_TIMEOUT');
  });

  it('rejects provider payloads that fail serialization', () => {
    const unserializable: Record<string, unknown> = {};
    Object.defineProperty(unserializable, 'toJSON', {
      value: () => {
        throw new Error('cannot serialize');
      },
    });
    expect(isAllowlistedProviderPayload(unserializable, [])).toBe(false);
  });

  it('fails closed when canonical reconciliation reads are unavailable', async () => {
    const reconcile = vi.fn(async () => 'conflict' as const);
    const persistence: ProviderOperationPersistence = {
      commitPlanned: async () => ({ kind: 'dependency_unavailable' as const }),
      readCanonical: async () => {
        throw new Error('database unavailable');
      },
      markPending: async () => ({ kind: 'conflict' as const }),
      recordAttempt: async () => 'conflict' as const,
      reconcile,
    };

    expect(
      await reconcileProviderOperation({
        operationId: OPERATION_ID,
        expectedVersion: '1',
        evidence: {
          operationId: OPERATION_ID,
          provider: operation.provider,
          payloadDigest: PAYLOAD_DIGEST,
          externalEventId: 'evt-security',
          state: 'confirmed',
          providerRef: 'evt-security',
          source: 'webhook',
          reconciledAt: NOW,
        },
        persistence,
      }),
    ).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
      noCanonicalWrite: true,
    });
    expect(reconcile).not.toHaveBeenCalled();
  });

  it('does not write when the canonical operation is missing', async () => {
    const reconcile = vi.fn(async () => 'reconciled' as const);
    const persistence: ProviderOperationPersistence = {
      commitPlanned: async () => ({ kind: 'dependency_unavailable' as const }),
      readCanonical: async () => null,
      markPending: async () => ({ kind: 'conflict' as const }),
      recordAttempt: async () => 'conflict' as const,
      reconcile,
    };

    await expect(
      reconcileProviderOperation({
        operationId: OPERATION_ID,
        expectedVersion: '1',
        evidence: {
          operationId: OPERATION_ID,
          provider: operation.provider,
          payloadDigest: PAYLOAD_DIGEST,
          externalEventId: 'evt-security',
          state: 'confirmed',
          providerRef: 'evt-security',
          source: 'webhook',
          reconciledAt: NOW,
        },
        persistence,
      }),
    ).resolves.toEqual({ kind: 'not_found', noCanonicalWrite: true });
    expect(reconcile).not.toHaveBeenCalled();
  });

  it('fails closed when the canonical operation shape is invalid', async () => {
    const reconcile = vi.fn(async () => 'reconciled' as const);
    const persistence: ProviderOperationPersistence = {
      commitPlanned: async () => ({ kind: 'dependency_unavailable' as const }),
      readCanonical: async () => ({}) as unknown as ProviderOperation,
      markPending: async () => ({ kind: 'conflict' as const }),
      recordAttempt: async () => 'conflict' as const,
      reconcile,
    };

    await expect(
      reconcileProviderOperation({
        operationId: OPERATION_ID,
        expectedVersion: '1',
        evidence: {
          operationId: OPERATION_ID,
          provider: operation.provider,
          payloadDigest: PAYLOAD_DIGEST,
          externalEventId: 'evt-security',
          state: 'confirmed',
          providerRef: 'evt-security',
          source: 'webhook',
          reconciledAt: NOW,
        },
        persistence,
      }),
    ).resolves.toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
      noCanonicalWrite: true,
    });
    expect(reconcile).not.toHaveBeenCalled();
  });
});
