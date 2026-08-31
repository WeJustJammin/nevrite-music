import { describe, expect, it, vi } from 'vitest';

import {
  createProductionProviderEffectRegistry,
  createProviderEffectConsumer,
  defineProviderEffectRegistry,
  type ProviderEffectRepository,
  type ProviderOperationForSend,
} from './provider-effect';
import { withDeadline } from './provider-support';
import { safelyValidOperation } from './provider-validation';

const OPERATION = '22222222-2222-4222-8222-222222222222';
const operation: ProviderOperationForSend = {
  actorId: '11111111-1111-4111-8111-111111111111',
  intentHash: 'a'.repeat(64),
  operationId: OPERATION,
  operationType: 'email.send',
  payload: { template: 'receipt' },
  payloadDigest: 'b'.repeat(64),
  provider: 'local',
  providerIdempotencyKey: 'provider-key-1',
  state: 'pending',
  version: '3',
};
const adapter = (
  response: unknown = {
    accepted: true,
    externalEventId: null,
    providerOperationId: 'provider-op',
    status: 'accepted',
  },
) => ({ send: vi.fn(async () => response as never) });
const repository = (
  overrides: Partial<ProviderEffectRepository> = {},
): ProviderEffectRepository => ({
  claimPlanned: vi.fn(async () => ({ kind: 'claimed' as const, operation })),
  recordOutcome: vi.fn(async () => undefined),
  ...overrides,
});

describe('provider effect configuration boundary', () => {
  it('rejects invalid registries and deadlines, and keeps production empty', () => {
    expect(() =>
      defineProviderEffectRegistry({ 'Bad Provider': adapter() } as never),
    ).toThrow('Provider effect registry is invalid.');
    expect(() =>
      createProductionProviderEffectRegistry({ local: adapter() }),
    ).toThrow('Provider effect registry must be empty in production.');
    expect(createProductionProviderEffectRegistry()).toEqual({});
    for (const deadlineMs of [0, 15_001, 1.5])
      expect(() =>
        createProviderEffectConsumer('local', {
          deadlineMs,
          registry: defineProviderEffectRegistry({ local: adapter() }),
          repository: repository(),
        }),
      ).toThrow('Provider effect deadline is invalid.');
    expect(() =>
      createProviderEffectConsumer('local', {
        registry: {} as never,
        repository: repository(),
      }),
    ).toThrow('Provider effect adapter is not registered.');
  });

  it('maps identifiers, cancellation, claim failures, timeouts, and production disablement', async () => {
    await expect(
      createProviderEffectConsumer('local', {
        registry: defineProviderEffectRegistry({ local: adapter() }),
        repository: repository(),
      })(OPERATION),
    ).resolves.toEqual({ kind: 'sent', state: 'pending' });
    await expect(
      createProviderEffectConsumer('local', {
        registry: defineProviderEffectRegistry({ local: adapter() }),
        repository: repository(),
      })('not-an-id'),
    ).resolves.toEqual({ kind: 'not_found' });
    const aborted = new AbortController();
    aborted.abort();
    await expect(
      createProviderEffectConsumer('local', {
        registry: defineProviderEffectRegistry({ local: adapter() }),
        repository: repository(),
      })(OPERATION, aborted.signal),
    ).resolves.toEqual({ kind: 'dependency_unavailable' });
    await expect(
      createProviderEffectConsumer('local', {
        registry: defineProviderEffectRegistry({ local: adapter() }),
        repository: repository({
          claimPlanned: vi.fn(async () => {
            throw new Error('claim down');
          }),
        }),
      })(OPERATION),
    ).resolves.toEqual({ kind: 'dependency_unavailable' });
    await expect(
      createProviderEffectConsumer('local', {
        deadlineMs: 1,
        registry: defineProviderEffectRegistry({
          local: adapter(new Promise(() => undefined)),
        }),
        repository: repository(),
      })(OPERATION),
    ).resolves.toEqual({ kind: 'pending', reason: 'ambiguous_timeout' });
    await expect(
      createProviderEffectConsumer('local', {
        deadlineMs: 1,
        registry: defineProviderEffectRegistry({ local: adapter() }),
        repository: repository({
          claimPlanned: vi.fn(() => new Promise<never>(() => undefined)),
        }),
      })(OPERATION),
    ).resolves.toEqual({ kind: 'dependency_unavailable' });
    const cancel = new AbortController();
    await expect(
      createProviderEffectConsumer('local', {
        deadlineMs: 100,
        registry: defineProviderEffectRegistry({ local: adapter() }),
        repository: repository({
          claimPlanned: vi.fn(() => {
            setTimeout(() => cancel.abort(), 1);
            return new Promise<never>(() => undefined);
          }),
        }),
      })(OPERATION, cancel.signal),
    ).resolves.toEqual({ kind: 'dependency_unavailable' });
    await expect(
      createProviderEffectConsumer('local', {
        environment: 'production',
        registry: createProductionProviderEffectRegistry() as never,
        repository: repository(),
      })(OPERATION),
    ).resolves.toEqual({ kind: 'dependency_unavailable' });
  });

  it('honors an already-aborted deadline signal and safely rejects throwing canonical data', async () => {
    const signal = new AbortController();
    signal.abort();
    await expect(
      withDeadline(async () => undefined, 10, signal.signal),
    ).rejects.toThrow('provider-effect-aborted');
    const throwingOperation = new Proxy(operation, {
      get: () => {
        throw new Error('malformed');
      },
    });
    expect(safelyValidOperation(throwingOperation, 'local')).toBe(false);
  });
});
