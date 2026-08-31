import type { JsonValue } from '@wejammin/contracts';

export const PROVIDER_EFFECT_TIMEOUT_MS = 15_000;

export type ProviderOperationState =
  'planned' | 'pending' | 'confirmed' | 'failed' | 'manual_review';

export type ProviderEffectPayload = Readonly<Record<string, JsonValue>>;

export type ProviderOperationIntent = Readonly<{
  actorId: string;
  intentHash: string;
  operationId: string;
  operationType: string;
  payload: ProviderEffectPayload;
  payloadDigest: string;
  provider: string;
  providerIdempotencyKey: string;
}>;

export type ProviderOperationForSend = Readonly<
  ProviderOperationIntent & {
    state: 'pending';
    version: string;
  }
>;

export type ProviderEffectResponse = Readonly<{
  accepted: boolean;
  externalEventId: string | null;
  providerOperationId: string;
  status: 'accepted' | 'pending' | 'rejected';
}>;

/** Minimum provider request; actor, intent, version, and raw secrets stay local. */
export type ProviderEffectRequest = Readonly<{
  idempotencyKey: string;
  operationId: string;
  payload: ProviderEffectPayload;
  payloadDigest: string;
  provider: string;
}>;

export type ProviderEffectAdapter = Readonly<{
  send: (
    input: ProviderEffectRequest,
    signal: AbortSignal,
  ) => Promise<ProviderEffectResponse>;
}>;

export type ProviderEffectRegistry = Readonly<
  Record<string, ProviderEffectAdapter>
>;

export type ProviderIntentRepository = Readonly<{
  /** Atomically persists planned operation, idempotency, audit, and outbox. */
  createPlanned: (
    input: ProviderOperationIntent,
    signal: AbortSignal,
  ) => Promise<ProviderIntentResult>;
}>;

export type ProviderIntentResult =
  | Readonly<{ kind: 'created'; operation: ProviderOperationIntent }>
  | Readonly<{ kind: 'replay'; operation: ProviderOperationIntent }>
  | Readonly<{ kind: 'conflict' }>;

export type ProviderEffectRepository = Readonly<{
  /** Claims planned state and marks it pending before any provider call. */
  claimPlanned: (
    input: Readonly<{ operationId: string; provider: string }>,
    signal: AbortSignal,
  ) => Promise<
    | Readonly<{ kind: 'claimed'; operation: ProviderOperationForSend }>
    | Readonly<{ kind: 'missing' }>
    | Readonly<{ kind: 'pending' }>
    | Readonly<{
        kind: 'terminal';
        state: 'confirmed' | 'failed' | 'manual_review';
      }>
  >;
  /** Records only provider response evidence; payloads/secrets never enter this call. */
  recordOutcome: (
    input: Readonly<{
      externalEventId: string | null;
      operationId: string;
      providerOperationId: string;
      state: 'failed';
      version: string;
    }>,
    signal: AbortSignal,
  ) => Promise<void>;
}>;

export type ProviderEffectOutcome =
  | Readonly<{ kind: 'sent'; state: 'pending' }>
  | Readonly<{ kind: 'rejected'; state: 'failed' }>
  | Readonly<{
      kind: 'pending';
      reason: 'ambiguous_timeout' | 'awaiting_reconciliation';
    }>
  | Readonly<{ kind: 'noop'; state: 'confirmed' | 'failed' | 'manual_review' }>
  | Readonly<{ kind: 'not_found' }>
  | Readonly<{ kind: 'dependency_unavailable' }>;
