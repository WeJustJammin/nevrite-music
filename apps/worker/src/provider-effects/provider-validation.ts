import type { JsonValue } from '@wejammin/contracts';

import type {
  ProviderEffectPayload,
  ProviderEffectResponse,
  ProviderOperationForSend,
  ProviderOperationIntent,
} from './provider-types';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const REGISTRY_KEY = /^[a-z][a-z0-9_.:-]{0,127}$/;
const PAYLOAD_KEY = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const PROVIDER_REFERENCE = /^[A-Za-z0-9._:-]+$/;
const DIGEST = /^[a-f0-9]{64}$/;
const VERSION = /^[1-9][0-9]{0,18}$/;
const MAX_VERSION = 9_223_372_036_854_775_807n;
const PRINTABLE_ASCII = /^[\u0020-\u007e]+$/u;
const MAX_JSON_DEPTH = 16;
const MAX_OBJECT_KEYS = 256;
const MAX_PAYLOAD_KEYS = 32;
const MAX_PAYLOAD_BYTES = 32_768;

const isSafeJson = (
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): value is JsonValue => {
  if (depth > MAX_JSON_DEPTH) return false;
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    if (
      typeof value === 'string' &&
      new TextEncoder().encode(value).byteLength > 65_536
    )
      return false;
    return true;
  }
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    const valid =
      value.length <= 1_000 &&
      value.every((item) => isSafeJson(item, depth + 1, seen));
    seen.delete(value);
    return valid;
  }
  if (
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  ) {
    seen.delete(value);
    return false;
  }
  const keys = Object.keys(value);
  if (keys.length > MAX_OBJECT_KEYS) {
    seen.delete(value);
    return false;
  }
  const valid = keys.every((key) =>
    isSafeJson((value as Record<string, unknown>)[key], depth + 1, seen),
  );
  seen.delete(value);
  return valid;
};

const isSafePayload = (value: unknown): value is ProviderEffectPayload => {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !isSafeJson(value, 0, new WeakSet())
  )
    return false;
  const keys = Object.keys(value);
  if (
    keys.length > MAX_PAYLOAD_KEYS ||
    !keys.every((key) => PAYLOAD_KEY.test(key))
  )
    return false;
  try {
    return (
      new TextEncoder().encode(JSON.stringify(value)).byteLength <=
      MAX_PAYLOAD_BYTES
    );
  } catch {
    return false;
  }
};

const exactKeys = (value: object, expected: readonly string[]): boolean => {
  const keys = Object.keys(value).sort();
  const expectedKeys = [...expected].sort();
  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index])
  );
};

const validIntent = (input: ProviderOperationIntent): boolean =>
  exactKeys(input, [
    'actorId',
    'intentHash',
    'operationId',
    'operationType',
    'payload',
    'payloadDigest',
    'provider',
    'providerIdempotencyKey',
  ]) &&
  UUID.test(input.actorId) &&
  UUID.test(input.operationId) &&
  REGISTRY_KEY.test(input.provider) &&
  REGISTRY_KEY.test(input.operationType) &&
  DIGEST.test(input.intentHash) &&
  DIGEST.test(input.payloadDigest) &&
  PRINTABLE_ASCII.test(input.providerIdempotencyKey) &&
  input.providerIdempotencyKey.length >= 8 &&
  input.providerIdempotencyKey.length <= 128 &&
  input.providerIdempotencyKey.trim() === input.providerIdempotencyKey &&
  isSafePayload(input.payload);

export const safelyValidIntent = (input: ProviderOperationIntent): boolean => {
  try {
    return validIntent(input);
  } catch {
    return false;
  }
};

export const safelyValidOperation = (
  operation: ProviderOperationForSend,
  provider: string,
): boolean => {
  try {
    if (
      !exactKeys(operation, [
        'actorId',
        'intentHash',
        'operationId',
        'operationType',
        'payload',
        'payloadDigest',
        'provider',
        'providerIdempotencyKey',
        'state',
        'version',
      ]) ||
      operation.provider !== provider ||
      operation.state !== 'pending' ||
      !VERSION.test(operation.version) ||
      BigInt(operation.version) > MAX_VERSION
    )
      return false;
    return validIntent({
      actorId: operation.actorId,
      intentHash: operation.intentHash,
      operationId: operation.operationId,
      operationType: operation.operationType,
      payload: operation.payload,
      payloadDigest: operation.payloadDigest,
      provider: operation.provider,
      providerIdempotencyKey: operation.providerIdempotencyKey,
    });
  } catch {
    return false;
  }
};

export const validateProviderResponse = (
  value: unknown,
): ProviderEffectResponse | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return null;
  if (
    !('accepted' in value) ||
    !('externalEventId' in value) ||
    !('providerOperationId' in value) ||
    !('status' in value)
  )
    return null;
  if (
    typeof value.accepted !== 'boolean' ||
    (value.externalEventId !== null &&
      typeof value.externalEventId !== 'string') ||
    typeof value.providerOperationId !== 'string' ||
    value.providerOperationId.length === 0 ||
    value.providerOperationId.length > 128 ||
    !PROVIDER_REFERENCE.test(value.providerOperationId) ||
    (value.externalEventId !== null &&
      (value.externalEventId.length === 0 ||
        value.externalEventId.length > 256 ||
        !PROVIDER_REFERENCE.test(value.externalEventId))) ||
    (value.status !== 'accepted' &&
      value.status !== 'pending' &&
      value.status !== 'rejected')
  )
    return null;
  const keys = Object.keys(value).sort();
  if (
    keys.length !== 4 ||
    keys[0] !== 'accepted' ||
    keys[1] !== 'externalEventId' ||
    keys[2] !== 'providerOperationId' ||
    keys[3] !== 'status'
  )
    return null;
  if (
    (value.status === 'accepted' && !value.accepted) ||
    (value.status !== 'accepted' && value.accepted) ||
    (value.status === 'pending' && value.externalEventId !== null)
  )
    return null;
  return {
    accepted: value.accepted,
    externalEventId: value.externalEventId,
    providerOperationId: value.providerOperationId,
    status: value.status,
  };
};
