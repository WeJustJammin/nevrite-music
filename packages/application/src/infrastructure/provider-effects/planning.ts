import {
  IdempotencyKeySchema,
  PositiveBigintDecimalSchema,
} from '@wejammin/contracts';

import type {
  ProviderEffectIntent,
  ProviderEffectRegistry,
  ProviderOperation,
  ProviderPlanDecision,
  ProviderPlanInput,
} from './types.ts';
import { isAllowlistedProviderPayload } from './payload-validation.ts';

const UuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const RegistryKeyPattern = /^[a-z][a-z0-9_.:-]{0,127}$/;
const OperationTypePattern = /^[a-z][a-z0-9_.-]{0,63}$/;
const DigestPattern = /^[a-f0-9]{64}$/;
const IntentKeys = [
  'operationId',
  'provider',
  'operationType',
  'actorId',
  'intentHash',
  'idempotencyKey',
  'payload',
  'correlationId',
  'causationId',
] as const;

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const invalid = (): Extract<ProviderPlanDecision, { kind: 'error' }> => ({
  code: 'INVALID_REQUEST',
  kind: 'error',
  noCanonicalWrite: true,
});

const dependencyUnavailable = (): Extract<
  ProviderPlanDecision,
  { kind: 'error' }
> => ({
  code: 'DEPENDENCY_UNAVAILABLE',
  kind: 'error',
  noCanonicalWrite: true,
});

const internalError = (): Extract<ProviderPlanDecision, { kind: 'error' }> => ({
  code: 'INTERNAL_ERROR',
  kind: 'error',
  noCanonicalWrite: true,
});

const hasExactKeys = (
  value: RecordValue,
  allowed: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return keys.every((key) => allowed.includes(key));
};

const cloneJson = (value: RecordValue): RecordValue =>
  JSON.parse(JSON.stringify(value)) as RecordValue;

const readRegistryEntry = (
  registry: ProviderEffectRegistry,
  provider: unknown,
): ProviderEffectRegistryEntryLike | null => {
  if (typeof provider !== 'string' || !RegistryKeyPattern.test(provider))
    return null;
  const entry = registry[provider];
  if (!isRecord(entry)) return null;
  const operationTypes = entry.operationTypes;
  const allowedPayloadKeys = entry.allowedPayloadKeys;
  if (
    entry.provider !== provider ||
    typeof entry.enabled !== 'boolean' ||
    !Array.isArray(operationTypes) ||
    !operationTypes.every(
      (type) => typeof type === 'string' && OperationTypePattern.test(type),
    ) ||
    !Array.isArray(allowedPayloadKeys) ||
    !allowedPayloadKeys.every((key) => typeof key === 'string') ||
    (entry.adapterKind !== 'fake' &&
      entry.adapterKind !== 'external' &&
      entry.adapterKind !== 'local')
  ) {
    return null;
  }
  return entry as unknown as ProviderEffectRegistryEntryLike;
};

type ProviderEffectRegistryEntryLike = Readonly<{
  provider: string;
  enabled: boolean;
  adapterKind: 'fake' | 'external' | 'local';
  operationTypes: readonly string[];
  allowedPayloadKeys: readonly string[];
}>;

const validateIntent = (
  intent: ProviderEffectIntent,
  registry: ProviderEffectRegistry,
):
  | Readonly<{
      intent: ProviderEffectIntent;
      entry: ProviderEffectRegistryEntryLike;
      payload: RecordValue;
      causationId: string | null;
    }>
  | Extract<ProviderPlanDecision, { kind: 'error' }> => {
  if (!isRecord(intent) || !hasExactKeys(intent, IntentKeys)) return invalid();
  if (
    typeof intent.operationId !== 'string' ||
    !UuidPattern.test(intent.operationId) ||
    typeof intent.actorId !== 'string' ||
    !UuidPattern.test(intent.actorId) ||
    typeof intent.correlationId !== 'string' ||
    !UuidPattern.test(intent.correlationId) ||
    typeof intent.intentHash !== 'string' ||
    !DigestPattern.test(intent.intentHash) ||
    typeof intent.operationType !== 'string' ||
    !OperationTypePattern.test(intent.operationType) ||
    typeof intent.idempotencyKey !== 'string' ||
    !IdempotencyKeySchema.safeParse(intent.idempotencyKey).success
  ) {
    return invalid();
  }
  if (
    intent.causationId !== undefined &&
    intent.causationId !== null &&
    (typeof intent.causationId !== 'string' ||
      !UuidPattern.test(intent.causationId))
  ) {
    return invalid();
  }
  const entry = readRegistryEntry(registry, intent.provider);
  if (entry === null || !entry.operationTypes.includes(intent.operationType)) {
    return invalid();
  }
  if (!entry.enabled || entry.adapterKind !== 'fake')
    return dependencyUnavailable();
  if (!isAllowlistedProviderPayload(intent.payload, entry.allowedPayloadKeys))
    return invalid();
  return {
    causationId: intent.causationId ?? null,
    entry,
    intent,
    payload: cloneJson(intent.payload),
  };
};

const validOperation = (
  operation: ProviderOperation,
  expected: Readonly<{
    intent: ProviderEffectIntent;
    payload: RecordValue;
    providerIdempotencyKeyHash: string;
    payloadDigest: string;
  }>,
): boolean => {
  if (!isRecord(operation)) return false;
  if (
    operation.id !== expected.intent.operationId ||
    operation.provider !== expected.intent.provider ||
    operation.operationType !== expected.intent.operationType ||
    operation.actorId !== expected.intent.actorId ||
    (operation.state !== 'planned' &&
      operation.state !== 'pending' &&
      operation.state !== 'confirmed' &&
      operation.state !== 'failed' &&
      operation.state !== 'manual_review') ||
    operation.intentHash !== expected.intent.intentHash ||
    operation.payloadDigest !== expected.payloadDigest ||
    operation.providerIdempotencyKeyHash !==
      expected.providerIdempotencyKeyHash ||
    !PositiveBigintDecimalSchema.safeParse(operation.version).success ||
    !UuidPattern.test(operation.correlationId) ||
    (operation.causationId !== null &&
      !UuidPattern.test(operation.causationId)) ||
    !Array.isArray(operation.attempts) ||
    !isRecord(operation.payload)
  ) {
    return false;
  }
  return JSON.stringify(operation.payload) === JSON.stringify(expected.payload);
};

export const planProviderOperation = async (
  input: ProviderPlanInput,
): Promise<ProviderPlanDecision> => {
  const validated = validateIntent(input.intent, input.registry);
  if ('kind' in validated) return validated;
  let providerIdempotencyKeyHash: string;
  let payloadDigest: string;
  try {
    [providerIdempotencyKeyHash, payloadDigest] = await Promise.all([
      input.digest.digest(validated.intent.idempotencyKey),
      input.digest.digest(JSON.stringify(validated.payload)),
    ]);
  } catch {
    return dependencyUnavailable();
  }
  if (
    !DigestPattern.test(providerIdempotencyKeyHash) ||
    !DigestPattern.test(payloadDigest)
  )
    return dependencyUnavailable();
  let result;
  try {
    result = await input.persistence.commitPlanned({
      actorId: validated.intent.actorId,
      causationId: validated.causationId,
      correlationId: validated.intent.correlationId,
      intentHash: validated.intent.intentHash,
      operationId: validated.intent.operationId,
      operationType: validated.intent.operationType,
      payload: validated.payload,
      provider: validated.intent.provider,
      providerIdempotencyKeyHash,
      payloadDigest,
    });
  } catch {
    return dependencyUnavailable();
  }
  if (result.kind === 'conflict') return { kind: 'conflict' };
  if (result.kind === 'dependency_unavailable') return dependencyUnavailable();
  if (
    (result.kind !== 'created' && result.kind !== 'replayed') ||
    !validOperation(result.operation, {
      intent: validated.intent,
      payload: validated.payload,
      providerIdempotencyKeyHash,
      payloadDigest,
    })
  ) {
    return internalError();
  }
  return result.kind === 'created'
    ? { kind: 'planned', operation: result.operation }
    : { kind: 'replayed', operation: result.operation };
};

export const planProviderEffect = planProviderOperation;
