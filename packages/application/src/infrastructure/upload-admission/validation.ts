import { IdempotencyKeySchema, QuotedVersionSchema } from '@wejammin/contracts';

import type {
  TargetUploadPolicy,
  UploadAdmissionBody,
  UploadAdmissionRequest,
  UploadPolicyRegistry,
  UploadValidationResult,
} from './types.ts';

const TargetTypePattern = /^[a-z][a-z0-9.]{0,63}$/;
const MediaTypePattern = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/;
const UuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ChecksumPattern = /^[a-f0-9]{64}$/;
const BodyKeys = [
  'targetType',
  'targetId',
  'purpose',
  'mediaType',
  'byteSize',
  'checksum',
] as const;
const ChecksumKeys = ['algorithm', 'value'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return (
    keys.length === expected.length &&
    expected.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
};

const invalid = (
  code: Extract<UploadValidationResult, { kind: 'invalid' }>['code'],
  field?: string,
): Extract<UploadValidationResult, { kind: 'invalid' }> => ({
  code,
  details: field === undefined ? {} : { field },
  kind: 'invalid',
  message:
    code === 'INVALID_REQUEST'
      ? 'Request is invalid.'
      : code === 'PAYLOAD_TOO_LARGE'
        ? 'Declared upload exceeds the target limit.'
        : code === 'UNSUPPORTED_MEDIA_TYPE'
          ? 'Media type is not allowed for this target.'
          : 'One or more upload fields are invalid.',
});

const readHeaders = (
  value: unknown,
):
  | { kind: 'valid'; idempotencyKey: string; ifMatch: string | null }
  | { kind: 'invalid' } => {
  if (!isRecord(value)) return { kind: 'invalid' };
  const allowed = ['contentType', 'idempotencyKey', 'ifMatch'];
  if (Object.keys(value).some((key) => !allowed.includes(key))) {
    return { kind: 'invalid' };
  }
  if (
    value.contentType !== undefined &&
    value.contentType !== 'application/json'
  ) {
    return { kind: 'invalid' };
  }
  const idempotency = IdempotencyKeySchema.safeParse(value.idempotencyKey);
  if (!idempotency.success) return { kind: 'invalid' };
  const ifMatch = value.ifMatch;
  if (
    ifMatch !== undefined &&
    !QuotedVersionSchema.safeParse(ifMatch).success
  ) {
    return { kind: 'invalid' };
  }
  return {
    ifMatch: typeof ifMatch === 'string' ? ifMatch : null,
    idempotencyKey: idempotency.data,
    kind: 'valid',
  };
};

const readPolicy = (
  policies: UploadPolicyRegistry,
  targetType: string,
): TargetUploadPolicy | null => {
  const policy = policies[targetType];
  if (!isRecord(policy)) return null;
  const purposes = policy.purposes;
  const allowedMediaTypes = policy.allowedMediaTypes;
  if (
    policy.targetType !== targetType ||
    !Array.isArray(purposes) ||
    purposes.length === 0 ||
    !purposes.every((purpose) => typeof purpose === 'string') ||
    !Array.isArray(allowedMediaTypes) ||
    allowedMediaTypes.length === 0 ||
    !allowedMediaTypes.every((mediaType) => typeof mediaType === 'string') ||
    !Number.isSafeInteger(policy.maxBytes) ||
    policy.maxBytes < 1 ||
    typeof policy.immutable !== 'boolean'
  ) {
    return null;
  }
  return {
    allowedMediaTypes,
    maxBytes: policy.maxBytes,
    immutable: policy.immutable,
    purposes,
    targetType,
  };
};

const normalizeBody = (
  body: Record<string, unknown>,
  policy: TargetUploadPolicy,
  targetType: string,
):
  | { kind: 'valid'; value: UploadAdmissionBody }
  | {
      kind: 'invalid';
      result: Extract<UploadValidationResult, { kind: 'invalid' }>;
    } => {
  if (!exactKeys(body, BodyKeys) || !isRecord(body.checksum)) {
    return { kind: 'invalid', result: invalid('INVALID_REQUEST') };
  }
  if (!exactKeys(body.checksum, ChecksumKeys)) {
    return { kind: 'invalid', result: invalid('INVALID_REQUEST') };
  }
  if (typeof body.targetId !== 'string' || !UuidPattern.test(body.targetId)) {
    return {
      kind: 'invalid',
      result: invalid('VALIDATION_FAILED', 'targetId'),
    };
  }
  if (
    typeof body.purpose !== 'string' ||
    !policy.purposes.includes(body.purpose)
  ) {
    return { kind: 'invalid', result: invalid('VALIDATION_FAILED', 'purpose') };
  }
  if (
    typeof body.mediaType !== 'string' ||
    !MediaTypePattern.test(body.mediaType)
  ) {
    return {
      kind: 'invalid',
      result: invalid('VALIDATION_FAILED', 'mediaType'),
    };
  }
  const mediaType = body.mediaType.toLowerCase();
  if (!policy.allowedMediaTypes.includes(mediaType)) {
    return {
      kind: 'invalid',
      result: invalid('UNSUPPORTED_MEDIA_TYPE', 'mediaType'),
    };
  }
  if (
    typeof body.byteSize !== 'number' ||
    !Number.isSafeInteger(body.byteSize)
  ) {
    return {
      kind: 'invalid',
      result: invalid('VALIDATION_FAILED', 'byteSize'),
    };
  }
  if (body.byteSize < 1) {
    return {
      kind: 'invalid',
      result: invalid('VALIDATION_FAILED', 'byteSize'),
    };
  }
  if (body.byteSize > policy.maxBytes) {
    return {
      kind: 'invalid',
      result: invalid('PAYLOAD_TOO_LARGE', 'byteSize'),
    };
  }
  if (body.checksum.algorithm !== 'sha256') {
    return {
      kind: 'invalid',
      result: invalid('VALIDATION_FAILED', 'checksum.algorithm'),
    };
  }
  if (
    typeof body.checksum.value !== 'string' ||
    !ChecksumPattern.test(body.checksum.value)
  ) {
    return {
      kind: 'invalid',
      result: invalid('VALIDATION_FAILED', 'checksum.value'),
    };
  }
  return {
    kind: 'valid',
    value: {
      byteSize: body.byteSize,
      checksum: { algorithm: 'sha256', value: body.checksum.value },
      mediaType,
      purpose: body.purpose,
      targetId: body.targetId,
      targetType,
    },
  };
};

export const validateUploadAdmission = (
  input: Readonly<{
    request: UploadAdmissionRequest;
    policies: UploadPolicyRegistry;
  }>,
): UploadValidationResult => {
  if (!isRecord(input.request)) return invalid('INVALID_REQUEST');
  if (!isRecord(input.policies)) return invalid('INVALID_REQUEST');
  const headers = readHeaders(input.request.headers);
  if (headers.kind === 'invalid') return invalid('INVALID_REQUEST');
  if (!isRecord(input.request.body)) return invalid('INVALID_REQUEST');
  const targetType = input.request.body.targetType;
  if (typeof targetType !== 'string' || !TargetTypePattern.test(targetType)) {
    return invalid('VALIDATION_FAILED', 'targetType');
  }
  const policy = readPolicy(input.policies, targetType);
  if (policy === null) return invalid('VALIDATION_FAILED', 'targetType');
  if (!policy.immutable && headers.ifMatch === null) {
    return invalid('INVALID_REQUEST');
  }
  const normalized = normalizeBody(input.request.body, policy, targetType);
  if (normalized.kind === 'invalid') return normalized.result;
  const normalizedRequest = JSON.stringify({
    targetType: normalized.value.targetType,
    targetId: normalized.value.targetId,
    purpose: normalized.value.purpose,
    mediaType: normalized.value.mediaType,
    byteSize: normalized.value.byteSize,
    checksum: normalized.value.checksum,
  });
  return {
    kind: 'valid',
    value: {
      body: normalized.value,
      idempotencyKey: headers.idempotencyKey,
      ifMatch: headers.ifMatch,
      normalizedRequest,
      policy,
    },
  };
};

export const isSafeObjectKey = (value: string): boolean => {
  if (value.length < 1 || value.length > 1024 || value.startsWith('/'))
    return false;
  if (
    ![...value].every((character) => {
      const code = character.charCodeAt(0);
      return code >= 0x21 && code <= 0x7e && character !== '\\';
    })
  ) {
    return false;
  }
  const segments = value.split('/');
  return !segments.some(
    (segment) => segment === '' || segment === '.' || segment === '..',
  );
};
