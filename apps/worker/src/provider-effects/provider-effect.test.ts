import { describe, expect, it, vi } from 'vitest';

import {
  PROVIDER_EFFECT_TIMEOUT_MS,
  createProductionProviderEffectRegistry,
  createProviderEffectConsumer,
  createProviderOperationIntent,
  defineProviderEffectRegistry,
  type ProviderEffectRepository,
  type ProviderOperationForSend,
} from './provider-effect';

const ACTOR = '11111111-1111-4111-8111-111111111111';
const OPERATION = '22222222-2222-4222-8222-222222222222';
const VERSION = '3';

const operation: ProviderOperationForSend = {
  actorId: ACTOR,
  intentHash: 'a'.repeat(64),
  operationId: OPERATION,
  operationType: 'email.send',
  payload: { template: 'receipt', variables: { reference: 'safe' } },
  payloadDigest: 'b'.repeat(64),
  provider: 'local',
  providerIdempotencyKey: 'provider-key-1',
  state: 'pending',
  version: VERSION,
};

const registry = defineProviderEffectRegistry({
  local: {
    send: vi.fn(async () => ({
      accepted: true,
      externalEventId: 'event-1',
      providerOperationId: 'provider-op-1',
      status: 'accepted' as const,
    })),
  },
});

const repository = (
  overrides: Partial<ProviderEffectRepository> = {},
): ProviderEffectRepository => ({
  claimPlanned: vi.fn(async () => ({ kind: 'claimed' as const, operation })),
  recordOutcome: vi.fn(async () => undefined),
  ...overrides,
});

describe('provider effect Worker boundary', () => {
  it('commits local planned intent before sending the minimum provider contract', async () => {
    const order: string[] = [];
    const claimPlanned = vi.fn(async () => {
      order.push('claim');
      return { kind: 'claimed' as const, operation };
    });
    const send = vi.fn(async (input) => {
      order.push('send');
      expect(input).toEqual({
        idempotencyKey: 'provider-key-1',
        operationId: OPERATION,
        payload: operation.payload,
        payloadDigest: 'b'.repeat(64),
        provider: 'local',
      });
      return {
        accepted: true,
        externalEventId: 'event-1',
        providerOperationId: 'provider-op-1',
        status: 'accepted' as const,
      };
    });
    const consumer = createProviderEffectConsumer('local', {
      registry: defineProviderEffectRegistry({ local: { send } }),
      repository: repository({ claimPlanned }),
    });
    await expect(consumer(OPERATION)).resolves.toEqual({
      kind: 'sent',
      state: 'pending',
    });
    expect(order).toEqual(['claim', 'send']);
  });

  it('preserves pending state for timeout/ambiguous outcomes and never blindly resends', async () => {
    const send = vi.fn(
      () =>
        new Promise<never>(() => {
          // An accepted network request can be invisible at timeout.
        }),
    );
    const consumer = createProviderEffectConsumer('local', {
      deadlineMs: 1,
      registry: defineProviderEffectRegistry({ local: { send } }),
      repository: repository(),
    });
    await expect(consumer(OPERATION)).resolves.toEqual({
      kind: 'pending',
      reason: 'ambiguous_timeout',
    });
    expect(send).toHaveBeenCalledTimes(1);
    const pending = createProviderEffectConsumer('local', {
      registry,
      repository: repository({
        claimPlanned: vi.fn(async () => ({ kind: 'pending' as const })),
      }),
    });
    await expect(pending(OPERATION)).resolves.toEqual({
      kind: 'pending',
      reason: 'awaiting_reconciliation',
    });
    expect(registry.local.send).not.toHaveBeenCalled();
    const disabled = createProviderEffectConsumer('local', {
      environment: 'production',
      registry: defineProviderEffectRegistry({ local: { send } }),
      repository: repository(),
    });
    await expect(disabled(OPERATION)).resolves.toEqual({
      kind: 'dependency_unavailable',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('records provider rejection, preserves terminal no-op, and maps missing/dependency outcomes', async () => {
    const recordOutcome = vi.fn(async () => undefined);
    const rejected = createProviderEffectConsumer('local', {
      registry: defineProviderEffectRegistry({
        local: {
          send: vi.fn(async () => ({
            accepted: false,
            externalEventId: null,
            providerOperationId: 'provider-op-2',
            status: 'rejected' as const,
          })),
        },
      }),
      repository: repository({ recordOutcome }),
    });
    await expect(rejected(OPERATION)).resolves.toEqual({
      kind: 'rejected',
      state: 'failed',
    });
    expect(recordOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ operationId: OPERATION, state: 'failed' }),
      expect.any(AbortSignal),
    );
    const terminal = createProviderEffectConsumer('local', {
      registry,
      repository: repository({
        claimPlanned: vi.fn(async () => ({
          kind: 'terminal' as const,
          state: 'confirmed' as const,
        })),
      }),
    });
    await expect(terminal(OPERATION)).resolves.toEqual({
      kind: 'noop',
      state: 'confirmed',
    });
    const missing = createProviderEffectConsumer('local', {
      registry,
      repository: repository({
        claimPlanned: vi.fn(async () => ({ kind: 'missing' as const })),
      }),
    });
    await expect(missing(OPERATION)).resolves.toEqual({ kind: 'not_found' });
    await expect(missing('bad')).resolves.toEqual({ kind: 'not_found' });
  });

  it('keeps an explicit provider-pending response in reconciliation state', async () => {
    const send = vi.fn(async () => ({
      accepted: false,
      externalEventId: null,
      providerOperationId: 'provider-op-pending',
      status: 'pending' as const,
    }));
    const consumer = createProviderEffectConsumer('local', {
      registry: defineProviderEffectRegistry({ local: { send } }),
      repository: repository(),
    });
    await expect(consumer(OPERATION)).resolves.toEqual({
      kind: 'pending',
      reason: 'awaiting_reconciliation',
    });
  });

  it('validates the intent, response, production registry, and configured deadline', async () => {
    const intentRepository = {
      createPlanned: vi.fn(async (input) => ({
        kind: 'created' as const,
        operation: input,
      })),
    };
    await expect(
      createProviderOperationIntent(
        {
          actorId: ACTOR,
          intentHash: 'a'.repeat(64),
          operationId: OPERATION,
          operationType: 'email.send',
          payload: { template: 'receipt' },
          payloadDigest: 'b'.repeat(64),
          provider: 'local',
          providerIdempotencyKey: 'provider-key-1',
        },
        intentRepository,
      ),
    ).resolves.toMatchObject({ kind: 'created' });
    await expect(
      createProviderOperationIntent(
        { ...operation, providerIdempotencyKey: 'bad' },
        intentRepository,
      ),
    ).rejects.toThrow('Provider operation intent is invalid.');
    expect(createProductionProviderEffectRegistry()).toEqual({});
    expect(() =>
      createProductionProviderEffectRegistry({ local: registry.local }),
    ).toThrow('Provider effect registry must be empty in production.');
    expect(() =>
      createProviderEffectConsumer('local', {
        deadlineMs: PROVIDER_EFFECT_TIMEOUT_MS + 1,
        registry,
        repository: repository(),
      }),
    ).toThrow('Provider effect deadline is invalid.');
  });

  it('fails closed for malformed canonical operation/response and persistence failure', async () => {
    const malformed = createProviderEffectConsumer('local', {
      registry,
      repository: repository({
        claimPlanned: vi.fn(async () => ({
          kind: 'claimed' as const,
          operation: { ...operation, payloadDigest: 'bad' },
        })),
      }),
    });
    await expect(malformed(OPERATION)).resolves.toEqual({
      kind: 'dependency_unavailable',
    });
    const invalidResponse = createProviderEffectConsumer('local', {
      registry: defineProviderEffectRegistry({
        local: {
          send: vi.fn(async () => ({
            accepted: true,
            externalEventId: null,
            providerOperationId: 'id',
            status: 'accepted' as const,
            extra: true,
          })),
        },
      }),
      repository: repository(),
    });
    await expect(invalidResponse(OPERATION)).resolves.toEqual({
      kind: 'pending',
      reason: 'ambiguous_timeout',
    });
    const failedPersistence = createProviderEffectConsumer('local', {
      registry: defineProviderEffectRegistry({
        local: {
          send: vi.fn(async () => ({
            accepted: false,
            externalEventId: null,
            providerOperationId: 'id',
            status: 'rejected' as const,
          })),
        },
      }),
      repository: repository({
        recordOutcome: vi.fn(async () => {
          throw new Error('database unavailable');
        }),
      }),
    });
    await expect(failedPersistence(OPERATION)).resolves.toEqual({
      kind: 'dependency_unavailable',
    });
    const aborted = new AbortController();
    aborted.abort();
    await expect(
      createProviderEffectConsumer('local', {
        registry,
        repository: repository(),
      })(OPERATION, aborted.signal),
    ).resolves.toEqual({ kind: 'dependency_unavailable' });
  });
});
