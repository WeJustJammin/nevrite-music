type ProviderAwaitable<T> = T | Promise<T>;

export type ProviderOperationState =
  'planned' | 'pending' | 'confirmed' | 'failed' | 'manual_review';

export type ProviderAttemptOutcome =
  | 'accepted'
  | 'rejected'
  | 'pending'
  | 'timeout'
  | 'retryable_error'
  | 'unknown_error';

export type ProviderAttemptSummary = Readonly<{
  attempt: number;
  startedAt: string;
  endedAt: string;
  outcome: ProviderAttemptOutcome;
  errorCode: string | null;
  retryable: boolean;
}>;

export type ProviderOperation = Readonly<{
  id: string;
  provider: string;
  operationType: string;
  actorId: string;
  state: ProviderOperationState;
  intentHash: string;
  payloadDigest: string;
  providerRef: string | null;
  lastAttemptAt: string | null;
  reconciliationAt: string | null;
  version: string;
  correlationId: string;
  causationId: string | null;
  providerIdempotencyKeyHash: string;
  attempts: readonly ProviderAttemptSummary[];
  payload: Readonly<Record<string, unknown>>;
}>;

export type ProviderEffectRegistryEntry = Readonly<{
  provider: string;
  enabled: boolean;
  adapterKind: 'fake' | 'external' | 'local';
  operationTypes: readonly string[];
  allowedPayloadKeys: readonly string[];
}>;

export type ProviderEffectRegistry = Readonly<
  Record<string, ProviderEffectRegistryEntry>
>;

export type ProviderEffectIntent = Readonly<{
  operationId: string;
  provider: string;
  operationType: string;
  actorId: string;
  intentHash: string;
  idempotencyKey: string;
  payload: unknown;
  correlationId: string;
  causationId?: string | null;
}>;

export type ProviderPlanInput = Readonly<{
  intent: ProviderEffectIntent;
  registry: ProviderEffectRegistry;
  digest: Readonly<{ digest(value: string): ProviderAwaitable<string> }>;
  persistence: ProviderOperationPersistence;
}>;

export type ProviderPlanWrite = Readonly<{
  operationId: string;
  provider: string;
  operationType: string;
  actorId: string;
  intentHash: string;
  providerIdempotencyKeyHash: string;
  payloadDigest: string;
  payload: Readonly<Record<string, unknown>>;
  correlationId: string;
  causationId: string | null;
}>;

export type ProviderPlanResult =
  | Readonly<{ kind: 'created'; operation: ProviderOperation }>
  | Readonly<{ kind: 'replayed'; operation: ProviderOperation }>
  | Readonly<{ kind: 'conflict' }>
  | Readonly<{ kind: 'dependency_unavailable' }>;

export type ProviderPlanDecision =
  | Readonly<{ kind: 'planned'; operation: ProviderOperation }>
  | Readonly<{ kind: 'replayed'; operation: ProviderOperation }>
  | Readonly<{ kind: 'conflict' }>
  | Readonly<{
      kind: 'error';
      code: 'INVALID_REQUEST' | 'DEPENDENCY_UNAVAILABLE' | 'INTERNAL_ERROR';
      noCanonicalWrite: true;
    }>;

export type ProviderAttemptWrite = Readonly<{
  operationId: string;
  expectedVersion: string;
  nextState: 'pending' | 'failed';
  outcome: ProviderAttemptOutcome;
  errorCode: string | null;
  retryable: boolean;
  providerRef: string | null;
  externalEventId: string | null;
  startedAt: string;
  endedAt: string;
  attempt: number;
}>;

export type ProviderEvidence = Readonly<{
  operationId: string;
  provider: string;
  payloadDigest: string;
  externalEventId: string | null;
  state: 'confirmed' | 'failed' | 'manual_review';
  providerRef: string | null;
  source: 'webhook' | 'poll';
  reconciledAt: string;
}>;

export type ProviderOperationPersistence = Readonly<{
  /** Commits operation, idempotency, audit, and outbox in one transaction. */
  commitPlanned(input: ProviderPlanWrite): Promise<ProviderPlanResult>;
  readCanonical(operationId: string): Promise<ProviderOperation | null>;
  /** CAS planned -> pending; this lock is taken before any adapter call. */
  markPending(
    input: Readonly<{
      operationId: string;
      expectedVersion: string;
    }>,
  ): Promise<
    | Readonly<{ kind: 'claimed'; operation: ProviderOperation }>
    | Readonly<{ kind: 'already_pending'; operation: ProviderOperation }>
    | Readonly<{ kind: 'terminal'; operation: ProviderOperation }>
    | Readonly<{ kind: 'conflict' }>
  >;
  /** Appends sanitized attempt evidence and CAS-updates state. */
  recordAttempt(input: ProviderAttemptWrite): Promise<'recorded' | 'conflict'>;
  reconcile(
    input: Readonly<{
      operationId: string;
      expectedVersion: string;
      evidence: ProviderEvidence;
    }>,
  ): Promise<'reconciled' | 'conflict' | 'not_found'>;
}>;

export type ProviderAdapterRequest = Readonly<{
  operationId: string;
  provider: string;
  idempotencyKey: string;
  operationType: string;
  payloadDigest: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type FakeProviderAdapterResult = Readonly<{
  accepted: boolean;
  status: 'accepted' | 'rejected' | 'pending';
  externalEventId: string | null;
}>;

export type FakeProviderAdapter = Readonly<{
  kind: 'fake';
  provider: string;
  send(
    input: ProviderAdapterRequest,
    signal: AbortSignal,
  ): Promise<FakeProviderAdapterResult>;
}>;

export type ProviderAdapterFailure = Readonly<{
  kind: 'safe_retryable' | 'timeout' | 'unknown';
  errorCode?: string;
}>;

export type ProviderExecutionInput = Readonly<{
  operationId: string;
  principal: Readonly<{ kind: 'queue' | 'schedule'; id: string }>;
  restoreFenceOpen: boolean;
  registry: ProviderEffectRegistry;
  persistence: ProviderOperationPersistence;
  adapter: FakeProviderAdapter;
  clock: Readonly<{ now(): string }>;
  sleep?: (milliseconds: 250 | 750) => ProviderAwaitable<void>;
  deadlineMs?: number;
  signal?: AbortSignal;
}>;

export type ProviderExecutionDecision =
  | Readonly<{
      kind: 'pending';
      operationId: string;
      reason:
        | 'await_reconciliation'
        | 'ambiguous_provider_outcome'
        | 'retryable_provider_failure';
      noBlindResend: true;
      acknowledgement: 'accepted';
    }>
  | Readonly<{
      kind: 'failed';
      operationId: string;
      errorCode: 'PROVIDER_REJECTED';
      noBlindResend: true;
    }>
  | Readonly<{
      kind: 'skip';
      operationId: string;
      reason: 'already_pending' | 'terminal';
      noProviderCall: true;
    }>
  | Readonly<{
      kind: 'retry';
      reason: 'restore_fenced' | 'canonical_unavailable' | 'lease_conflict';
      acknowledge: false;
    }>
  | Readonly<{
      kind: 'error';
      code: 'DEPENDENCY_UNAVAILABLE' | 'INTERNAL_ERROR';
      noBlindResend: true;
    }>;

export type ProviderReconciliationDecision =
  | Readonly<{
      kind: 'reconciled';
      operationId: string;
      state: ProviderOperationState;
    }>
  | Readonly<{ kind: 'conflict'; operationId: string; noCanonicalWrite: true }>
  | Readonly<{ kind: 'not_found'; noCanonicalWrite: true }>
  | Readonly<{
      kind: 'error';
      code: 'INVALID_REQUEST' | 'DEPENDENCY_UNAVAILABLE';
      noCanonicalWrite: true;
    }>;
