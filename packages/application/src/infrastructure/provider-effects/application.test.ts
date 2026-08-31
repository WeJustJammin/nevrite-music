import { describe, expect, it, vi } from 'vitest';

import { planProviderOperation } from './planning.ts';
import {
  ACTOR_ID,
  CAUSATION_ID,
  CORRELATION_ID,
  HASH,
  intent,
  makePlanInput,
  OPERATION_ID,
  operation,
  PROVIDER,
  registry,
} from './application-fixtures.ts';

describe('provider operation planning', () => {
  it('commits a minimum local intent before any provider effect', async () => {
    const input = makePlanInput();
    const result = await planProviderOperation(input);
    expect(result).toEqual({ kind: 'planned', operation });
    expect(input.digest.digest).toHaveBeenCalledWith(intent.idempotencyKey);
    expect(input.persistence.commitPlanned).toHaveBeenCalledWith({
      actorId: ACTOR_ID,
      causationId: CAUSATION_ID,
      correlationId: CORRELATION_ID,
      intentHash: HASH,
      operationId: OPERATION_ID,
      operationType: 'notification.send',
      payload: intent.payload,
      provider: PROVIDER,
      providerIdempotencyKeyHash: HASH,
      payloadDigest: HASH,
    });
  });

  it('returns deterministic replay or conflict from the atomic idempotency write', async () => {
    const replay = makePlanInput({
      persistence: {
        ...makePlanInput().persistence,
        commitPlanned: vi.fn(async () => ({
          kind: 'replayed' as const,
          operation,
        })),
      },
    });
    expect(await planProviderOperation(replay)).toEqual({
      kind: 'replayed',
      operation,
    });
    const conflict = makePlanInput({
      persistence: {
        ...makePlanInput().persistence,
        commitPlanned: vi.fn(async () => ({ kind: 'conflict' as const })),
      },
    });
    expect(await planProviderOperation(conflict)).toEqual({ kind: 'conflict' });
  });

  it('refuses unregistered, disabled, external, and malformed plans before persistence', async () => {
    const cases: readonly Parameters<typeof makePlanInput>[0][] = [
      { intent: { ...intent, provider: 'unknown' } },
      {
        registry: {
          [PROVIDER]: { ...registry[PROVIDER], enabled: false },
        },
      },
      {
        registry: {
          [PROVIDER]: {
            ...registry[PROVIDER],
            adapterKind: 'external' as const,
          },
        },
      },
      { intent: { ...intent, operationType: 'unknown.effect' } },
      { intent: { ...intent, intentHash: 'bad' } },
      { intent: { ...intent, operationId: 'bad' } },
      { intent: { ...intent, actorId: 'bad' } },
      { intent: { ...intent, correlationId: 'bad' } },
      { intent: { ...intent, idempotencyKey: 'short' } },
      { intent: { ...intent, payload: { forbidden: true } } },
    ];
    for (const overrides of cases) {
      const input = makePlanInput(overrides);
      const result = await planProviderOperation(input);
      expect(result).toMatchObject({ kind: 'error' });
      expect(input.persistence.commitPlanned).not.toHaveBeenCalled();
    }
  });

  it('fails closed on digest, persistence, and malformed canonical responses', async () => {
    const badDigest = makePlanInput({
      digest: { digest: vi.fn(async () => 'bad') },
    });
    expect(await planProviderOperation(badDigest)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    const digestThrow = makePlanInput({
      digest: {
        digest: vi.fn(async () => {
          throw new Error('down');
        }),
      },
    });
    expect(await planProviderOperation(digestThrow)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    const persistenceThrow = makePlanInput({
      persistence: {
        ...makePlanInput().persistence,
        commitPlanned: vi.fn(async () => {
          throw new Error('down');
        }),
      },
    });
    expect(await planProviderOperation(persistenceThrow)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    const malformed = makePlanInput({
      persistence: {
        ...makePlanInput().persistence,
        commitPlanned: vi.fn(async () => ({
          kind: 'created' as const,
          operation: { ...operation, id: 'bad' },
        })),
      },
    });
    expect(await planProviderOperation(malformed)).toMatchObject({
      kind: 'error',
      code: 'INTERNAL_ERROR',
    });
  });
});
