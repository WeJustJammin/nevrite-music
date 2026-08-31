import { describe, expect, it, vi } from 'vitest';

import { planProviderOperation } from './planning.ts';
import { reconcileProviderOperation } from './reconciliation.ts';
import type { ProviderEffectIntent, ProviderEffectRegistry } from './types.ts';
import {
  HASH,
  intent,
  makePersistence,
  makePlan,
  OPERATION_ID,
  operation,
  PROVIDER,
  registry,
  TIMESTAMP,
} from './edge-case-fixtures.ts';

describe('provider operation planning boundary guards', () => {
  it('rejects extra keys, malformed causation, and all invalid payload forms', async () => {
    const extra = { ...intent, extra: true } as unknown as ProviderEffectIntent;
    const malformedCausation = { ...intent, causationId: 'bad' };
    const payloads: readonly unknown[] = [
      null,
      [],
      { recipient: Number.NaN },
      { deep: { a: { b: { c: { d: { e: { f: 'x' } } } } } } },
      Object.fromEntries(
        Array.from({ length: 33 }, (_, index) => [`key${index}`, true]),
      ),
    ];
    for (const value of [extra, malformedCausation]) {
      const input = makePlan(value);
      expect(await planProviderOperation(input)).toMatchObject({
        kind: 'error',
        code: 'INVALID_REQUEST',
      });
      expect(input.persistence.commitPlanned).not.toHaveBeenCalled();
    }
    for (const value of payloads) {
      const input = makePlan({ ...intent, payload: value });
      expect(await planProviderOperation(input)).toMatchObject({
        kind: 'error',
        code: 'INVALID_REQUEST',
      });
      expect(input.persistence.commitPlanned).not.toHaveBeenCalled();
    }
    const arrayIntent = { ...intent, payload: { assetId: ['a', 1, true] } };
    const arrayPayload = makePlan(arrayIntent, {
      ...operation,
      payload: arrayIntent.payload,
    });
    const arrayResult = await planProviderOperation(arrayPayload);
    expect(arrayResult).toMatchObject({ kind: 'planned' });
    const malformedProvider = makePlan({ ...intent, provider: 'BAD' });
    expect(await planProviderOperation(malformedProvider)).toMatchObject({
      kind: 'error',
      code: 'INVALID_REQUEST',
    });
  });

  it('fails closed for malformed provider registries and commit results', async () => {
    const malformedRegistries: readonly ProviderEffectRegistry[] = [
      { BAD: registry[PROVIDER] },
      { [PROVIDER]: undefined as never },
      { [PROVIDER]: { ...registry[PROVIDER], provider: 'other' } },
      { [PROVIDER]: { ...registry[PROVIDER], operationTypes: 'bad' as never } },
      { [PROVIDER]: { ...registry[PROVIDER], operationTypes: ['BAD'] } },
      {
        [PROVIDER]: {
          ...registry[PROVIDER],
          allowedPayloadKeys: 'bad' as never,
        },
      },
      {
        [PROVIDER]: { ...registry[PROVIDER], allowedPayloadKeys: [7] as never },
      },
      { [PROVIDER]: { ...registry[PROVIDER], adapterKind: 'local' } },
    ];
    for (const value of malformedRegistries) {
      const input = makePlan(intent, operation, { registry: value });
      expect(await planProviderOperation(input)).toMatchObject({
        kind: 'error',
      });
      expect(input.persistence.commitPlanned).not.toHaveBeenCalled();
    }
    const dependency = makePlan(intent, operation, {
      persistence: {
        ...makePersistence(),
        commitPlanned: vi.fn(async () => ({
          kind: 'dependency_unavailable' as const,
        })),
      },
    });
    expect(await planProviderOperation(dependency)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    const unknown = makePlan(intent, operation, {
      persistence: {
        ...makePersistence(),
        commitPlanned: vi.fn(async () => ({ kind: 'unexpected' }) as never),
      },
    });
    expect(await planProviderOperation(unknown)).toMatchObject({
      kind: 'error',
      code: 'INTERNAL_ERROR',
    });
  });

  it('rejects every malformed canonical operation returned by the atomic write', async () => {
    const malformed: readonly unknown[] = [
      null,
      { ...operation, provider: 'other' },
      { ...operation, operationType: 'other.effect' },
      { ...operation, actorId: 'other' },
      { ...operation, state: 'unexpected' },
      { ...operation, intentHash: 'bad' },
      { ...operation, providerIdempotencyKeyHash: 'bad' },
      { ...operation, version: '0' },
      { ...operation, correlationId: 'bad' },
      { ...operation, causationId: 'bad' },
      { ...operation, attempts: null },
      { ...operation, payload: null },
      { ...operation, payload: { other: true } },
    ];
    for (const value of malformed) {
      const input = makePlan(intent, value);
      expect(await planProviderOperation(input)).toMatchObject({
        kind: 'error',
        code: 'INTERNAL_ERROR',
      });
    }
    const noCausation = makePlan(
      { ...intent, causationId: undefined },
      operation,
    );
    expect(await planProviderOperation(noCausation)).toMatchObject({
      kind: 'planned',
    });
  });
});

describe('provider operation reconciliation boundary guards', () => {
  it('rejects malformed reconciliation inputs before calling persistence', async () => {
    const persistence = makePersistence();
    const valid = {
      operationId: OPERATION_ID,
      expectedVersion: '1',
      evidence: {
        operationId: OPERATION_ID,
        provider: PROVIDER,
        payloadDigest: HASH,
        externalEventId: null,
        state: 'confirmed' as const,
        providerRef: null,
        source: 'poll' as const,
        reconciledAt: TIMESTAMP,
      },
      persistence,
    };
    const malformed: readonly unknown[] = [
      null,
      [],
      { ...valid, operationId: 7 },
      { ...valid, operationId: 'bad' },
      { ...valid, expectedVersion: 7 },
      { ...valid, expectedVersion: '0' },
      { ...valid, evidence: null },
      { ...valid, evidence: { ...valid.evidence, state: 'unknown' } },
      { ...valid, evidence: { ...valid.evidence, source: 'other' } },
      { ...valid, evidence: { ...valid.evidence, providerRef: '' } },
      { ...valid, evidence: { ...valid.evidence, providerRef: '\nsecret' } },
      { ...valid, evidence: { ...valid.evidence, reconciledAt: 'bad' } },
      { ...valid, persistence: null },
      { ...valid, persistence: {} },
    ];
    for (const value of malformed) {
      expect(await reconcileProviderOperation(value as never)).toEqual({
        kind: 'error',
        code: 'INVALID_REQUEST',
        noCanonicalWrite: true,
      });
    }
    expect(persistence.reconcile).not.toHaveBeenCalled();
  });

  it('maps unknown persistence responses as dependency failures', async () => {
    const input = {
      operationId: OPERATION_ID,
      expectedVersion: '1',
      evidence: {
        operationId: OPERATION_ID,
        provider: PROVIDER,
        payloadDigest: HASH,
        externalEventId: 'evt-1',
        state: 'confirmed' as const,
        providerRef: 'evt-1',
        source: 'webhook' as const,
        reconciledAt: TIMESTAMP,
      },
      persistence: {
        ...makePersistence(),
        reconcile: vi.fn(async () => 'unexpected' as never),
      },
    };
    expect(await reconcileProviderOperation(input)).toEqual({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
      noCanonicalWrite: true,
    });
  });
});
