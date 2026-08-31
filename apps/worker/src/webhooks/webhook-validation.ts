import {
  type WebhookEvent,
  type WebhookProviderRegistry,
  type WebhookRateDecision,
  type WebhookReceiptResult,
} from './webhook-types';

const PROVIDER_KEY = /^[a-z][a-z0-9_.:-]{0,127}$/;
const HEADER_NAME = /^[A-Za-z0-9-]{1,128}$/;
const EVENT_TYPE = /^[a-z][a-z0-9_.:-]{0,127}$/;
const EXTERNAL_EVENT_ID = /^[A-Za-z0-9._:-]+$/;
const SIGNATURE = /^[\x20-\x7e]{1,4096}$/u;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DIGEST = /^[a-f0-9]{64}$/;

export const isProviderKey = (value: string): boolean =>
  PROVIDER_KEY.test(value);

export const isHeaderName = (value: string): boolean => HEADER_NAME.test(value);

export const isSignature = (value: string): boolean => SIGNATURE.test(value);

export const isSupportedSchemaVersions = (
  value: unknown,
): value is readonly number[] => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 32)
    return false;
  const seen = new Set<number>();
  for (const version of value) {
    if (
      typeof version !== 'number' ||
      !Number.isSafeInteger(version) ||
      version < 1 ||
      seen.has(version)
    )
      return false;
    seen.add(version);
  }
  return true;
};

export const isStrictEvent = (value: unknown): value is WebhookEvent => {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('eventType' in value) ||
    !('externalEventId' in value) ||
    !('schemaVersion' in value)
  ) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(value).sort();
  return (
    keys.length === 3 &&
    keys[0] === 'eventType' &&
    keys[1] === 'externalEventId' &&
    keys[2] === 'schemaVersion' &&
    typeof candidate.eventType === 'string' &&
    EVENT_TYPE.test(candidate.eventType) &&
    typeof candidate.externalEventId === 'string' &&
    candidate.externalEventId.length <= 256 &&
    EXTERNAL_EVENT_ID.test(candidate.externalEventId) &&
    typeof candidate.schemaVersion === 'number' &&
    Number.isSafeInteger(candidate.schemaVersion) &&
    candidate.schemaVersion > 0
  );
};

export const isReceiptResult = (
  value: unknown,
): value is WebhookReceiptResult => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  if (
    !('kind' in value) ||
    !('receiptId' in value) ||
    (value.kind !== 'accepted' &&
      value.kind !== 'duplicate' &&
      value.kind !== 'conflict') ||
    typeof value.receiptId !== 'string' ||
    !UUID.test(value.receiptId)
  )
    return false;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(value).sort();
  if (value.kind !== 'conflict')
    return keys.length === 2 && keys[0] === 'kind' && keys[1] === 'receiptId';
  return (
    keys.length === 3 &&
    keys[0] === 'kind' &&
    keys[1] === 'payloadDigest' &&
    keys[2] === 'receiptId' &&
    typeof candidate.payloadDigest === 'string' &&
    DIGEST.test(candidate.payloadDigest)
  );
};

export const isRateDecision = (
  value: unknown,
): value is WebhookRateDecision => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(value).sort();
  if (!(
    (keys.length === 4 &&
      keys[0] === 'allowed' &&
      keys[1] === 'limit' &&
      keys[2] === 'remaining' &&
      keys[3] === 'resetAt') ||
    (keys.length === 5 &&
      keys[0] === 'allowed' &&
      keys[1] === 'limit' &&
      keys[2] === 'remaining' &&
      keys[3] === 'resetAt' &&
      keys[4] === 'retryAfterSeconds')
  ))
    return false;
  if (
    !('allowed' in value) ||
    !('limit' in value) ||
    !('remaining' in value) ||
    !('resetAt' in value) ||
    typeof candidate.allowed !== 'boolean' ||
    typeof candidate.limit !== 'number' ||
    !Number.isSafeInteger(candidate.limit) ||
    candidate.limit < 1 ||
    typeof candidate.remaining !== 'number' ||
    !Number.isSafeInteger(candidate.remaining) ||
    candidate.remaining < 0 ||
    candidate.remaining > candidate.limit ||
    typeof candidate.resetAt !== 'number' ||
    !Number.isSafeInteger(candidate.resetAt) ||
    candidate.resetAt < 0
  )
    return false;
  if (!('retryAfterSeconds' in value)) return true;
  return (
    candidate.retryAfterSeconds === undefined ||
    (typeof candidate.retryAfterSeconds === 'number' &&
      Number.isSafeInteger(candidate.retryAfterSeconds) &&
      candidate.retryAfterSeconds >= 0)
  );
};

export const digest = async (body: Uint8Array): Promise<string> => {
  const bytes = await crypto.subtle.digest('SHA-256', body);
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const constantTimeEqual = (
  left: Uint8Array,
  right: Uint8Array,
): boolean => {
  const length = Math.max(left.byteLength, right.byteLength);
  let difference = left.byteLength ^ right.byteLength;
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
};

export const validateRegistry = (registry: WebhookProviderRegistry): void => {
  if (
    Object.keys(registry).some(
      (provider) =>
        !isProviderKey(provider) || registry[provider] === undefined,
    )
  )
    throw new Error('Webhook provider registry is invalid.');
  for (const definition of Object.values(registry)) {
    if (
      typeof definition.enabled !== 'boolean' ||
      !isSupportedSchemaVersions(definition.supportedSchemaVersions)
    )
      throw new Error('Webhook provider registry is invalid.');
  }
};
