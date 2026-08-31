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
export const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
export const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
export const CAUSATION_ID = '44444444-4444-4444-8444-444444444444';
export const HASH = 'a'.repeat(64);
export const PROVIDER = 'local.fake';

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
  payload: intent.payload as Readonly<Record<string, unknown>>,
};

export const makePlanInput = (
  overrides: Partial<ProviderPlanInput> = {},
): ProviderPlanInput => ({
  intent,
  registry,
  digest: { digest: vi.fn(async () => HASH) },
  persistence: {
    commitPlanned: vi.fn(async () => ({
      kind: 'created' as const,
      operation,
    })),
    readCanonical: vi.fn(async () => operation),
    markPending: vi.fn(async () => ({
      kind: 'claimed' as const,
      operation: { ...operation, state: 'pending' as const },
    })),
    recordAttempt: vi.fn(async () => 'recorded' as const),
    reconcile: vi.fn(async () => 'reconciled' as const),
  },
  ...overrides,
});

export const makeExecutionInput = (
  overrides: Partial<ProviderExecutionInput> = {},
): ProviderExecutionInput => ({
  operationId: OPERATION_ID,
  principal: { kind: 'queue', id: 'platform.provider.effect' },
  restoreFenceOpen: true,
  registry,
  persistence: {
    commitPlanned: vi.fn(async () => ({ kind: 'created' as const, operation })),
    readCanonical: vi.fn(async () => operation),
    markPending: vi.fn(async () => ({
      kind: 'claimed' as const,
      operation: { ...operation, state: 'pending' as const },
    })),
    recordAttempt: vi.fn(async () => 'recorded' as const),
    reconcile: vi.fn(async () => 'reconciled' as const),
  },
  adapter: {
    kind: 'fake',
    provider: PROVIDER,
    send: vi.fn(async () => ({
      accepted: true,
      status: 'accepted' as const,
      externalEventId: 'evt-1',
    })),
  },
  clock: { now: vi.fn(() => '2026-08-30T13:00:00.000Z') },
  sleep: vi.fn(async () => undefined),
  ...overrides,
});
