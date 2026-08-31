import { PositiveBigintDecimalSchema } from '@wejammin/contracts';

import type {
  FakeProviderAdapterResult,
  ProviderAdapterFailure,
  ProviderAttemptOutcome,
  ProviderEffectRegistry,
  ProviderEffectRegistryEntry,
  ProviderAttemptWrite,
  ProviderExecutionInput,
  ProviderOperation,
} from './types.ts';
import { PROVIDER_EFFECT_DEADLINE_MS } from './execution-deadline.ts';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const REGISTRY_KEY_PATTERN = /^[a-z][a-z0-9_.:-]{0,127}$/;
const OPERATION_TYPE_PATTERN = /^[a-z][a-z0-9_.-]{0,63}$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_REF_PATTERN = /^[\x20-\x7e]{1,256}$/;
const PRINCIPAL_ID_PATTERN = /^[a-z][a-z0-9_.:-]{7,127}$/;
export const MAX_ATTEMPTS = 3;
export const RETRY_DELAYS = [250, 750] as const;
type RecordValue = Record<string, unknown>;

export type AdapterOutcome =
  | Readonly<{ kind: 'response'; result: FakeProviderAdapterResult }>
  | Readonly<{
      kind: 'failure';
      failure: 'safe_retryable' | 'timeout' | 'unknown';
      errorCode: string | null;
    }>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isJsonValue = (value: unknown, depth = 0): boolean => {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (typeof value === 'number') return Number.isFinite(value);
  if (depth > 4 || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.every((child) => isJsonValue(child, depth + 1));
  }
  return Object.values(value).every((child) => isJsonValue(child, depth + 1));
};

const isTimestamp = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 64 &&
  Number.isFinite(Date.parse(value));

const isProviderRef = (value: unknown): value is string | null =>
  value === null || (typeof value === 'string' && SAFE_REF_PATTERN.test(value));

const isAttemptOutcome = (value: unknown): value is ProviderAttemptOutcome =>
  value === 'accepted' ||
  value === 'rejected' ||
  value === 'pending' ||
  value === 'timeout' ||
  value === 'retryable_error' ||
  value === 'unknown_error';

const isAttempt = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return (
    typeof value.attempt === 'number' &&
    Number.isSafeInteger(value.attempt) &&
    value.attempt > 0 &&
    isTimestamp(value.startedAt) &&
    isTimestamp(value.endedAt) &&
    isAttemptOutcome(value.outcome) &&
    (value.errorCode === null ||
      (typeof value.errorCode === 'string' &&
        SAFE_REF_PATTERN.test(value.errorCode))) &&
    typeof value.retryable === 'boolean'
  );
};

export const isProviderOperation = (
  value: unknown,
): value is ProviderOperation => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    UUID_PATTERN.test(value.id) &&
    typeof value.provider === 'string' &&
    REGISTRY_KEY_PATTERN.test(value.provider) &&
    typeof value.operationType === 'string' &&
    OPERATION_TYPE_PATTERN.test(value.operationType) &&
    typeof value.actorId === 'string' &&
    UUID_PATTERN.test(value.actorId) &&
    (value.state === 'planned' ||
      value.state === 'pending' ||
      value.state === 'confirmed' ||
      value.state === 'failed' ||
      value.state === 'manual_review') &&
    typeof value.intentHash === 'string' &&
    DIGEST_PATTERN.test(value.intentHash) &&
    typeof value.payloadDigest === 'string' &&
    DIGEST_PATTERN.test(value.payloadDigest) &&
    isProviderRef(value.providerRef) &&
    (value.lastAttemptAt === null || isTimestamp(value.lastAttemptAt)) &&
    (value.reconciliationAt === null || isTimestamp(value.reconciliationAt)) &&
    PositiveBigintDecimalSchema.safeParse(value.version).success &&
    typeof value.correlationId === 'string' &&
    UUID_PATTERN.test(value.correlationId) &&
    (value.causationId === null ||
      (typeof value.causationId === 'string' &&
        UUID_PATTERN.test(value.causationId))) &&
    typeof value.providerIdempotencyKeyHash === 'string' &&
    DIGEST_PATTERN.test(value.providerIdempotencyKeyHash) &&
    Array.isArray(value.attempts) &&
    value.attempts.every((attempt) => isAttempt(attempt)) &&
    isRecord(value.payload) &&
    isJsonValue(value.payload)
  );
};

export const readFakeRegistryEntry = (
  registry: ProviderEffectRegistry,
  provider: string,
  operationType: string,
): ProviderEffectRegistryEntry | null => {
  const entry = registry[provider];
  if (
    !isRecord(entry) ||
    entry.provider !== provider ||
    entry.enabled !== true ||
    entry.adapterKind !== 'fake' ||
    !Array.isArray(entry.operationTypes) ||
    !entry.operationTypes.every(
      (type) => typeof type === 'string' && OPERATION_TYPE_PATTERN.test(type),
    ) ||
    !entry.operationTypes.includes(operationType) ||
    !Array.isArray(entry.allowedPayloadKeys) ||
    !entry.allowedPayloadKeys.every((key) => typeof key === 'string')
  ) {
    return null;
  }
  return entry as unknown as ProviderEffectRegistryEntry;
};

const isPrincipal = (
  value: unknown,
): value is Readonly<{ kind: 'queue' | 'schedule'; id: string }> => {
  if (!isRecord(value)) return false;
  return (
    (value.kind === 'queue' || value.kind === 'schedule') &&
    typeof value.id === 'string' &&
    PRINCIPAL_ID_PATTERN.test(value.id)
  );
};

const isFakeAdapter = (
  value: unknown,
): value is ProviderExecutionInput['adapter'] =>
  isRecord(value) &&
  value.kind === 'fake' &&
  typeof value.provider === 'string' &&
  REGISTRY_KEY_PATTERN.test(value.provider) &&
  typeof value.send === 'function';

const isPersistence = (
  value: unknown,
): value is ProviderExecutionInput['persistence'] =>
  isRecord(value) &&
  typeof value.readCanonical === 'function' &&
  typeof value.markPending === 'function' &&
  typeof value.recordAttempt === 'function';

const isClock = (value: unknown): value is ProviderExecutionInput['clock'] =>
  isRecord(value) && typeof value.now === 'function';

const isAbortSignal = (value: unknown): value is AbortSignal =>
  isRecord(value) &&
  typeof value.aborted === 'boolean' &&
  typeof value.addEventListener === 'function' &&
  typeof value.removeEventListener === 'function';

const isDeadline = (value: unknown): boolean =>
  value === undefined ||
  (typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= PROVIDER_EFFECT_DEADLINE_MS);

export const isExecutionShape = (
  value: unknown,
): value is ProviderExecutionInput =>
  isRecord(value) &&
  typeof value.operationId === 'string' &&
  UUID_PATTERN.test(value.operationId) &&
  isPrincipal(value.principal) &&
  typeof value.restoreFenceOpen === 'boolean' &&
  isRecord(value.registry) &&
  isPersistence(value.persistence) &&
  isFakeAdapter(value.adapter) &&
  isClock(value.clock) &&
  (value.sleep === undefined || typeof value.sleep === 'function') &&
  isDeadline(value.deadlineMs) &&
  (value.signal === undefined || isAbortSignal(value.signal));

const isAdapterFailure = (value: unknown): value is ProviderAdapterFailure =>
  isRecord(value) &&
  (value.kind === 'safe_retryable' ||
    value.kind === 'timeout' ||
    value.kind === 'unknown');

export const classifyAdapterOutcome = (value: unknown): AdapterOutcome => {
  if (isAdapterFailure(value)) {
    return {
      kind: 'failure',
      failure: value.kind,
      errorCode: typeof value.errorCode === 'string' ? value.errorCode : null,
    };
  }
  if (!isRecord(value)) {
    return { kind: 'failure', failure: 'unknown', errorCode: null };
  }
  const accepted = value.accepted;
  const status = value.status;
  const externalEventId = value.externalEventId;
  if (
    typeof accepted !== 'boolean' ||
    (status !== 'accepted' && status !== 'rejected' && status !== 'pending') ||
    !isProviderRef(externalEventId) ||
    (status === 'rejected' && accepted) ||
    (status !== 'rejected' && !accepted)
  ) {
    return { kind: 'failure', failure: 'unknown', errorCode: null };
  }
  return {
    kind: 'response',
    result: { accepted, status, externalEventId },
  };
};

export const errorCodeForFailure = (
  failure: AdapterOutcome & { kind: 'failure' },
): string => {
  if (failure.errorCode !== null) {
    return failure.errorCode.startsWith('PROVIDER_')
      ? failure.errorCode
      : 'PROVIDER_' + failure.errorCode;
  }
  if (failure.failure === 'timeout') return 'PROVIDER_TIMEOUT';
  if (failure.failure === 'safe_retryable') return 'PROVIDER_RETRYABLE';
  return 'PROVIDER_UNKNOWN';
};

export const attemptWrite = (
  operation: ProviderOperation,
  attempt: number,
  startedAt: string,
  endedAt: string,
  outcome: ProviderAttemptOutcome,
  errorCode: string | null,
  retryable: boolean,
  providerRef: string | null,
  externalEventId: string | null,
): ProviderAttemptWrite => ({
  operationId: operation.id,
  expectedVersion: operation.version,
  nextState: outcome === 'rejected' ? 'failed' : 'pending',
  outcome,
  errorCode,
  retryable,
  providerRef,
  externalEventId,
  startedAt,
  endedAt,
  attempt,
});

export const saveAttempt = async (
  input: ProviderExecutionInput,
  write: ProviderAttemptWrite,
): Promise<boolean> => {
  try {
    return (await input.persistence.recordAttempt(write)) === 'recorded';
  } catch {
    return false;
  }
};

export const now = (input: ProviderExecutionInput): string | null => {
  try {
    const timestamp = input.clock.now();
    return isTimestamp(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
};
