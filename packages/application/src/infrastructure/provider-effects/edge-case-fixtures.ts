/* c8 ignore file -- shared test fixture factories are not production paths. */
import { vi } from 'vitest';

import type {
  ProviderEffectIntent,
  ProviderEffectRegistry,
  ProviderExecutionInput,
  ProviderOperation,
  ProviderPlanInput,
} from './types.ts';

export const OPERATION_ID = '11111111-1111-4111-8111-111111111111';
export const OTHER_OPERATION_ID = '55555555-5555-4555-8555-555555555555';
export const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
export const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
export const CAUSATION_ID = '44444444-4444-4444-8444-444444444444';
export const HASH = 'a'.repeat(64);
export const PROVIDER = 'local.fake';
export const TIMESTAMP = '2026-08-30T13:00:00.000Z';

export const registry: ProviderEffectRegistry = {
  [PROVIDER]: {
    provider: PROVIDER,
    enabled: true,
    adapterKind: 'fake',
    operationTypes: ['notification.send', 'asset.publish'],
    allowedPayloadKeys: ['recipient', 'template', 'assetId'],
  },
};

export const intent: ProviderEffectIntent = {
  operationId: OPERATION_ID,
  provider: PROVIDER,
  operationType: 'notification.send',
  actorId: ACTOR_ID,
  intentHash: HASH,
  idempotencyKey: 'provider-key-01',
  payload: { recipient: 'artist@example.test', template: 'ready' },
  correlationId: CORRELATION_ID,
  causationId: CAUSATION_ID,
};

export const operation: ProviderOperation = {
  id: OPERATION_ID,
  provider: PROVIDER,
  operationType: intent.operationType,
  actorId: ACTOR_ID,
  state: 'planned',
  intentHash: HASH,
  payloadDigest: HASH,
  providerRef: null,
  lastAttemptAt: null,
  reconciliationAt: null,
  version: '1',
  correlationId: CORRELATION_ID,
  causationId: CAUSATION_ID,
  providerIdempotencyKeyHash: HASH,
  attempts: [],
  payload: intent.payload as Record<string, unknown>,
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const makePersistence = (
  canonical: unknown = operation,
): ProviderExecutionInput['persistence'] => {
  const claimed = isRecord(canonical)
    ? ({
        ...operation,
        ...canonical,
        state: 'pending' as const,
      } as ProviderOperation)
    : { ...operation, state: 'pending' as const };
  return {
    commitPlanned: vi.fn(async () => ({ kind: 'created' as const, operation })),
    readCanonical: vi.fn(async () => canonical as ProviderOperation | null),
    markPending: vi.fn(async () => ({
      kind: 'claimed' as const,
      operation: claimed,
    })),
    recordAttempt: vi.fn(async () => 'recorded' as const),
    reconcile: vi.fn(async () => 'reconciled' as const),
  };
};

export const makeExecution = (
  canonical: unknown = operation,
  overrides: Partial<ProviderExecutionInput> = {},
): ProviderExecutionInput => ({
  operationId: OPERATION_ID,
  principal: { kind: 'queue', id: 'platform.provider.effect' },
  restoreFenceOpen: true,
  registry,
  persistence: makePersistence(canonical),
  adapter: {
    kind: 'fake',
    provider: PROVIDER,
    send: vi.fn(async () => ({
      accepted: true,
      status: 'accepted' as const,
      externalEventId: 'evt-1',
    })),
  },
  clock: { now: vi.fn(() => TIMESTAMP) },
  sleep: vi.fn(async () => undefined),
  ...overrides,
});

export const makePlan = (
  intentValue: unknown = intent,
  operationValue: unknown = operation,
  overrides: Partial<ProviderPlanInput> = {},
): ProviderPlanInput => ({
  intent: intentValue as ProviderEffectIntent,
  registry,
  digest: { digest: vi.fn(async () => HASH) },
  persistence: {
    ...makePersistence(operationValue),
    commitPlanned: vi.fn(async () => ({
      kind: 'created' as const,
      operation: operationValue as ProviderOperation,
    })),
  },
  ...overrides,
});
