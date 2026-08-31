import { describe, expect, it, vi } from 'vitest';

import { executeProviderEffect } from './execution.ts';
import { planProviderOperation } from './planning.ts';
import { reconcileProviderOperation } from './reconciliation.ts';
import type {
  ProviderEffectIntent,
  ProviderEffectRegistry,
  ProviderExecutionInput,
  ProviderOperation,
  ProviderPlanInput,
} from './types.ts';

const OPERATION_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
const CAUSATION_ID = '44444444-4444-4444-8444-444444444444';
const INTENT_HASH = 'a'.repeat(64);
const IDEMPOTENCY_HASH = 'c'.repeat(64);
const PAYLOAD_DIGEST = 'b'.repeat(64);
const PROVIDER = 'local.fake';
const NOW = '2026-08-30T13:00:00.000Z';

const registry: ProviderEffectRegistry = {
  [PROVIDER]: {
    provider: PROVIDER,
    enabled: true,
    adapterKind: 'fake',
    operationTypes: ['notification.send'],
    allowedPayloadKeys: ['recipient', 'template'],
  },
};

const intent: ProviderEffectIntent = {
  operationId: OPERATION_ID,
  provider: PROVIDER,
  operationType: 'notification.send',
  actorId: ACTOR_ID,
  intentHash: INTENT_HASH,
  idempotencyKey: 'provider-key-security',
  payload: { recipient: 'artist@example.test', template: 'ready' },
  correlationId: CORRELATION_ID,
  causationId: CAUSATION_ID,
};

const operation: ProviderOperation = {
  id: OPERATION_ID,
  provider: PROVIDER,
  operationType: intent.operationType,
  actorId: ACTOR_ID,
  state: 'planned',
  intentHash: INTENT_HASH,
  payloadDigest: PAYLOAD_DIGEST,
  providerRef: null,
  lastAttemptAt: null,
  reconciliationAt: null,
  version: '1',
  correlationId: CORRELATION_ID,
  causationId: CAUSATION_ID,
  providerIdempotencyKeyHash: IDEMPOTENCY_HASH,
  attempts: [],
  payload: intent.payload,
};

const makePersistence = (
  canonical: ProviderOperation = operation,
): ProviderExecutionInput['persistence'] => ({
  commitPlanned: vi.fn(async () => ({ kind: 'created' as const, operation })),
  readCanonical: vi.fn(async () => canonical),
  markPending: vi.fn(async () => ({
    kind: 'claimed' as const,
    operation: { ...canonical, state: 'pending' as const },
  })),
  recordAttempt: vi.fn(async () => 'recorded' as const),
  reconcile: vi.fn(async () => 'reconciled' as const),
});

const makeExecution = (
  overrides: Partial<ProviderExecutionInput> = {},
): ProviderExecutionInput => ({
  operationId: OPERATION_ID,
  principal: { kind: 'queue', id: 'platform.provider.effect' },
  restoreFenceOpen: true,
  registry,
  persistence: makePersistence(),
  adapter: {
    kind: 'fake',
    provider: PROVIDER,
    send: vi.fn(async () => ({
      accepted: true,
      status: 'accepted' as const,
      externalEventId: 'evt-security',
    })),
  },
  clock: { now: vi.fn(() => NOW) },
  sleep: vi.fn(async () => undefined),
  ...overrides,
});

describe('provider-effect security contracts', () => {
  it('persists a payload digest separately from the immutable intent hash', async () => {
    const digestInputs: string[] = [];
    const committed = vi.fn(async () => ({
      kind: 'created' as const,
      operation,
    }));
    const input: ProviderPlanInput = {
      intent,
      registry,
      digest: {
        digest: vi.fn(async (value: string) => {
          digestInputs.push(value);
          return value === intent.idempotencyKey
            ? IDEMPOTENCY_HASH
            : PAYLOAD_DIGEST;
        }),
      },
      persistence: {
        ...makePersistence(),
        commitPlanned: committed,
      },
    };

    expect(await planProviderOperation(input)).toMatchObject({
      kind: 'planned',
    });
    expect(committed).toHaveBeenCalledWith(
      expect.objectContaining({
        intentHash: INTENT_HASH,
        payloadDigest: PAYLOAD_DIGEST,
      }),
    );
    expect(digestInputs).toEqual([
      intent.idempotencyKey,
      JSON.stringify(intent.payload),
    ]);
  });

  it('rejects persisted payload keys that the provider registry does not allow', async () => {
    const persistence = makePersistence({
      ...operation,
      payload: { recipient: 'artist@example.test', forbidden: true },
    });
    const input = makeExecution({ persistence });

    expect(await executeProviderEffect(input)).toMatchObject({ kind: 'error' });
    expect(input.adapter.send).not.toHaveBeenCalled();
    expect(persistence.markPending).not.toHaveBeenCalled();
  });

  it('sends the persisted payload digest, never the intent hash', async () => {
    const send = vi.fn(async () => ({
      accepted: true,
      status: 'accepted' as const,
      externalEventId: 'evt-security',
    }));
    const input = makeExecution({
      adapter: { kind: 'fake', provider: PROVIDER, send },
    });

    await executeProviderEffect(input);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      payloadDigest: PAYLOAD_DIGEST,
    });
    expect(send.mock.calls[0]?.[0]).not.toMatchObject({
      payloadDigest: INTENT_HASH,
    });
  });

  it('passes an abort signal and records an ambiguous timeout at the deadline', async () => {
    const send = vi.fn(async (_request: unknown, signal?: AbortSignal) => {
      await new Promise((resolve) => setTimeout(resolve, 25));
      return signal?.aborted
        ? {
            accepted: true,
            status: 'accepted' as const,
            externalEventId: 'evt-too-late',
          }
        : {
            accepted: true,
            status: 'accepted' as const,
            externalEventId: 'evt-too-late',
          };
    });
    const input = makeExecution({
      deadlineMs: 5,
      adapter: { kind: 'fake', provider: PROVIDER, send },
    });

    expect(await executeProviderEffect(input)).toMatchObject({
      kind: 'pending',
      reason: 'ambiguous_provider_outcome',
      noBlindResend: true,
    });
    expect(send.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
    expect(input.persistence.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'timeout',
        errorCode: 'PROVIDER_TIMEOUT',
      }),
    );
  });

  it('does not claim or call a provider after caller cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    const input = makeExecution({ signal: controller.signal });

    expect(await executeProviderEffect(input)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(input.persistence.markPending).not.toHaveBeenCalled();
    expect(input.adapter.send).not.toHaveBeenCalled();
  });

  it('propagates cancellation through an in-flight provider call', async () => {
    const controller = new AbortController();
    let resolveSend!: (value: {
      accepted: true;
      status: 'accepted';
      externalEventId: string;
    }) => void;
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const send = vi.fn(
      async () =>
        new Promise<{
          accepted: true;
          status: 'accepted';
          externalEventId: string;
        }>((resolve) => {
          resolveSend = resolve;
          markStarted();
        }),
    );
    const input = makeExecution({
      signal: controller.signal,
      adapter: { kind: 'fake', provider: PROVIDER, send },
    });

    const execution = executeProviderEffect(input);
    await started;
    controller.abort();
    const result = await execution;
    resolveSend({
      accepted: true,
      status: 'accepted',
      externalEventId: 'evt-cancelled',
    });

    expect(result).toMatchObject({
      kind: 'pending',
      reason: 'ambiguous_provider_outcome',
      noBlindResend: true,
    });
    expect(input.persistence.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'PROVIDER_CANCELLED',
        outcome: 'timeout',
      }),
    );
  });

  it('propagates cancellation through retry backoff without resending', async () => {
    const controller = new AbortController();
    let resolveSleep!: () => void;
    let markSleepStarted!: () => void;
    const sleepStarted = new Promise<void>((resolve) => {
      markSleepStarted = resolve;
    });
    const input = makeExecution({
      deadlineMs: 1_000,
      signal: controller.signal,
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(async () => ({
          kind: 'safe_retryable' as const,
          errorCode: 'RATE_LIMITED',
        })),
      },
      sleep: vi.fn(
        async () =>
          new Promise<void>((resolve) => {
            resolveSleep = resolve;
            markSleepStarted();
          }),
      ),
    });

    const execution = executeProviderEffect(input);
    await sleepStarted;
    controller.abort();
    const result = await execution;
    resolveSleep();

    expect(result).toMatchObject({
      kind: 'pending',
      reason: 'ambiguous_provider_outcome',
      noBlindResend: true,
    });
    expect(input.adapter.send).toHaveBeenCalledTimes(1);
    expect(input.persistence.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'PROVIDER_CANCELLED',
        outcome: 'timeout',
      }),
    );
  });

  it('records a timeout when retry backoff reaches the deadline', async () => {
    const input = makeExecution({
      deadlineMs: 5,
      adapter: {
        kind: 'fake',
        provider: PROVIDER,
        send: vi.fn(async () => ({
          kind: 'safe_retryable' as const,
          errorCode: 'RATE_LIMITED',
        })),
      },
      sleep: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }),
    });

    expect(await executeProviderEffect(input)).toMatchObject({
      kind: 'pending',
      reason: 'ambiguous_provider_outcome',
    });
    expect(input.persistence.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'PROVIDER_TIMEOUT',
        outcome: 'timeout',
      }),
    );
  });

  it('rejects reconciliation evidence bound to another provider or payload', async () => {
    const persistence = makePersistence();
    const evidence = {
      operationId: OPERATION_ID,
      provider: 'other.provider',
      payloadDigest: INTENT_HASH,
      externalEventId: 'evt-security',
      state: 'confirmed' as const,
      providerRef: 'evt-security',
      source: 'webhook' as const,
      reconciledAt: NOW,
    };

    expect(
      await reconcileProviderOperation({
        operationId: OPERATION_ID,
        expectedVersion: '1',
        evidence,
        persistence,
      }),
    ).toMatchObject({ kind: 'conflict', noCanonicalWrite: true });
    expect(persistence.reconcile).not.toHaveBeenCalled();
  });
});
