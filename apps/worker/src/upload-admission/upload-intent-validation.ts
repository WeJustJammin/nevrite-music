import {
  UploadIntentResourceSchema,
  type UploadIntentResource as CanonicalUploadIntentResource,
} from '@wejammin/contracts';

import {
  MAX_UPLOAD_INTENT_TTL_MS,
  type SignedUpload,
} from '../storage/upload-storage';
import {
  invalid,
  UploadAdmissionError,
  validation,
} from './upload-intent-support';
import type {
  UploadIntentRequest,
  UploadIntentResource,
  UploadRateDecision,
  UploadTargetPolicy,
} from './upload-intent-types';

export const MAX_BODY_BYTES = 256 * 1024;
export const OPERATION = 'INF-API-02';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TARGET_TYPE = /^[a-z][a-z0-9.]{0,63}$/;
const MIME = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/;
const PRINTABLE_ASCII = /^[\u0020-\u007e]+$/u;
const CHECKSUM = /^[a-f0-9]{64}$/;
const VERSION = /^[1-9][0-9]{0,18}$/;
const MAX_VERSION = 9_223_372_036_854_775_807n;

export const isUuid = (value: string): boolean => UUID.test(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const keys = [...expected].sort();
  return (
    actual.length === keys.length &&
    actual.every((key, index) => key === keys[index])
  );
};

export const parseVersion = (
  value: string | null,
  required: boolean,
): string | null => {
  if (value === null) {
    if (required) throw invalid('If-Match is required.');
    return null;
  }
  if (!/^"[^"]+"$/.test(value))
    throw invalid('If-Match must be one quoted version.');
  const version = value.slice(1, -1);
  if (!VERSION.test(version) || BigInt(version) > MAX_VERSION)
    throw invalid('If-Match must be one quoted version.');
  return value;
};

export const parseIdempotencyKey = (value: string | null): string => {
  if (
    value === null ||
    value.length < 8 ||
    value.length > 128 ||
    !PRINTABLE_ASCII.test(value) ||
    value.trim() !== value
  )
    throw invalid('Idempotency-Key is invalid.');
  return value;
};

export const parseRequest = (
  value: unknown,
  policies: Readonly<Record<string, UploadTargetPolicy>>,
): Readonly<{ policy: UploadTargetPolicy; request: UploadIntentRequest }> => {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      'byteSize',
      'checksum',
      'mediaType',
      'purpose',
      'targetId',
      'targetType',
    ])
  )
    throw invalid('The upload-intent request is invalid.');
  const targetType = value.targetType;
  if (typeof targetType !== 'string' || !TARGET_TYPE.test(targetType))
    throw validation('The upload-intent request is invalid.', '/targetType');
  const policy = policies[targetType];
  if (policy === undefined)
    throw validation('The upload-intent request is invalid.', '/targetType');
  const targetId = value.targetId;
  if (typeof targetId !== 'string' || !UUID.test(targetId))
    throw validation('The upload-intent request is invalid.', '/targetId');
  const purpose = value.purpose;
  if (typeof purpose !== 'string' || !policy.purposes.includes(purpose))
    throw validation('The upload-intent request is invalid.', '/purpose');
  const mediaType = value.mediaType;
  if (typeof mediaType !== 'string' || !MIME.test(mediaType))
    throw validation('The upload-intent request is invalid.', '/mediaType');
  const normalizedMediaType = mediaType.toLowerCase();
  if (!policy.allowedMediaTypes.includes(normalizedMediaType))
    throw validation('The upload-intent request is invalid.', '/mediaType');
  const byteSize = value.byteSize;
  if (
    typeof byteSize !== 'number' ||
    !Number.isSafeInteger(byteSize) ||
    byteSize < 1
  )
    throw validation('The upload-intent request is invalid.', '/byteSize');
  if (byteSize > policy.maxBytes)
    throw new UploadAdmissionError(
      'PAYLOAD_TOO_LARGE',
      413,
      'The declared upload exceeds the target limit.',
      { maxBytes: policy.maxBytes },
    );
  const checksum = value.checksum;
  if (!isRecord(checksum) || !exactKeys(checksum, ['algorithm', 'value']))
    throw validation('The upload-intent request is invalid.', '/checksum');
  if (checksum.algorithm !== 'sha256')
    throw validation(
      'The upload-intent request is invalid.',
      '/checksum/algorithm',
    );
  if (typeof checksum.value !== 'string' || !CHECKSUM.test(checksum.value))
    throw validation(
      'The upload-intent request is invalid.',
      '/checksum/value',
    );
  return {
    policy,
    request: {
      byteSize,
      checksum: { algorithm: 'sha256', value: checksum.value },
      mediaType: normalizedMediaType,
      purpose,
      targetId,
      targetType,
    },
  };
};

export const digest = async (value: string): Promise<string> => {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const validateResource = (
  resource: unknown,
  expected?: Readonly<{
    objectId: string;
    objectKey: string;
    signedUpload: SignedUpload;
  }>,
): UploadIntentResource => {
  const parsed = UploadIntentResourceSchema.safeParse(resource);
  if (!parsed.success)
    throw new UploadAdmissionError(
      'INTERNAL_ERROR',
      500,
      'The upload-intent response was invalid.',
    );
  const canonical = parsed.data as CanonicalUploadIntentResource;
  if (
    expected !== undefined &&
    (canonical.object.id !== expected.objectId ||
      canonical.object.objectKey !== expected.objectKey ||
      canonical.upload.method !== expected.signedUpload.method ||
      canonical.upload.signedUrl !== expected.signedUpload.signedUrl ||
      canonical.upload.expiresAt !== expected.signedUpload.expiresAt ||
      canonical.upload.maxBytes !== expected.signedUpload.maxBytes ||
      canonical.upload.allowedMediaTypes.length !==
        expected.signedUpload.allowedMediaTypes.length ||
      canonical.upload.allowedMediaTypes.some(
        (mediaType, index) =>
          mediaType !== expected.signedUpload.allowedMediaTypes[index],
      ))
  )
    throw new UploadAdmissionError(
      'INTERNAL_ERROR',
      500,
      'The upload-intent response was invalid.',
    );
  return canonical;
};

const hasExactPathSuffix = (
  pathSegments: readonly string[],
  expectedSegments: readonly string[],
): boolean =>
  expectedSegments.length > 0 &&
  pathSegments.length >= expectedSegments.length &&
  expectedSegments.every(
    (segment, index) =>
      pathSegments[pathSegments.length - expectedSegments.length + index] ===
      segment,
  );

/** A signer must identify the exact server-generated object in its URL. */
export const signedUrlBindsGeneratedObject = (
  signedUrl: string,
  objectId: string,
  objectKey: string,
): boolean => {
  if (
    typeof signedUrl !== 'string' ||
    typeof objectId !== 'string' ||
    typeof objectKey !== 'string' ||
    !UUID.test(objectId)
  )
    return false;
  try {
    const url = new URL(signedUrl);
    if (url.protocol !== 'https:' || url.username !== '' || url.password !== '')
      return false;
    const path = decodeURIComponent(url.pathname);
    const segments = path.split('/');
    return (
      hasExactPathSuffix(segments, [objectId]) ||
      hasExactPathSuffix(segments, objectKey.split('/'))
    );
  } catch {
    return false;
  }
};

export const isUploadRateDecision = (
  value: unknown,
): value is UploadRateDecision => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  const exact =
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
      keys[4] === 'retryAfterSeconds');
  return (
    exact &&
    typeof candidate.allowed === 'boolean' &&
    typeof candidate.limit === 'number' &&
    Number.isSafeInteger(candidate.limit) &&
    candidate.limit > 0 &&
    typeof candidate.remaining === 'number' &&
    Number.isSafeInteger(candidate.remaining) &&
    candidate.remaining >= 0 &&
    candidate.remaining <= candidate.limit &&
    typeof candidate.resetAt === 'number' &&
    Number.isSafeInteger(candidate.resetAt) &&
    candidate.resetAt >= 0 &&
    (!('retryAfterSeconds' in candidate) ||
      (typeof candidate.retryAfterSeconds === 'number' &&
        Number.isSafeInteger(candidate.retryAfterSeconds) &&
        candidate.retryAfterSeconds >= 0))
  );
};

export const validatePrincipal = (principal: unknown): void => {
  if (
    !isRecord(principal) ||
    !exactKeys(principal, [
      'actingPartyId',
      'actorId',
      'capabilities',
      'kind',
      'reason',
      'stepUpVerified',
    ]) ||
    typeof principal.actorId !== 'string' ||
    !UUID.test(principal.actorId) ||
    (principal.actingPartyId !== null &&
      (typeof principal.actingPartyId !== 'string' ||
        !UUID.test(principal.actingPartyId))) ||
    !Array.isArray(principal.capabilities) ||
    principal.capabilities.some(
      (capability) =>
        typeof capability !== 'string' ||
        capability.length === 0 ||
        capability.length > 128 ||
        !PRINTABLE_ASCII.test(capability) ||
        capability.trim() !== capability,
    ) ||
    (principal.kind !== 'acting_party' &&
      principal.kind !== 'operator' &&
      principal.kind !== 'user') ||
    (principal.reason !== null &&
      (typeof principal.reason !== 'string' ||
        principal.reason.length > 512 ||
        !PRINTABLE_ASCII.test(principal.reason))) ||
    typeof principal.stepUpVerified !== 'boolean'
  )
    throw new UploadAdmissionError(
      'INTERNAL_ERROR',
      500,
      'The upload authority is invalid.',
    );
};

export const maxUploadLifetime = MAX_UPLOAD_INTENT_TTL_MS;
