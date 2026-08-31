import {
  UploadCompletionRequestSchema,
  type UploadCompletionRequest,
} from '@wejammin/contracts';

import type {
  UploadCompletionDraft,
  UploadCompletionPolicy,
  UploadCompletionViolation,
} from './upload-completion-state';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const VERSION_PATTERN = /^"[1-9][0-9]{0,18}"$/u;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/u;
const MEDIA_TYPE_PATTERN = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/u;
const IDEMPOTENCY_PATTERN = /^[\x20-\x7e]{8,128}$/u;

const safeUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

const safeVersion = (value: unknown): value is string =>
  typeof value === 'string' && VERSION_PATTERN.test(value);

export const normalizeUploadCompletionDraft = (
  draft: UploadCompletionDraft,
): UploadCompletionDraft => ({
  ...draft,
  mediaType: draft.mediaType.trim().toLowerCase(),
});

export const validateUploadCompletionDraft = (
  draft: UploadCompletionDraft,
  policy: UploadCompletionPolicy,
): readonly UploadCompletionViolation[] => {
  const violations: UploadCompletionViolation[] = [];
  if (!safeUuid(draft.uploadIntentId))
    violations.push({
      field: 'uploadIntentId',
      code: 'uuid',
      message: 'Enter a valid upload intent ID.',
    });
  if (
    typeof draft.byteSize !== 'number' ||
    !Number.isSafeInteger(draft.byteSize) ||
    draft.byteSize <= 0
  )
    violations.push({
      field: 'byteSize',
      code: 'positive',
      message: 'Enter a positive byte size.',
    });
  else if (draft.byteSize > policy.maxBytes)
    violations.push({
      field: 'byteSize',
      code: 'maximum',
      message: 'The byte size exceeds the intent maximum.',
    });
  const mediaType = draft.mediaType.trim().toLowerCase();
  if (!MEDIA_TYPE_PATTERN.test(mediaType))
    violations.push({
      field: 'mediaType',
      code: 'format',
      message: 'Enter a normalized media type.',
    });
  else if (
    !policy.allowedMediaTypes.some(
      (allowed) => allowed.trim().toLowerCase() === mediaType,
    )
  )
    violations.push({
      field: 'mediaType',
      code: 'allowlist',
      message: 'Choose an allowed media type.',
    });
  if (draft.checksum.algorithm !== 'sha256')
    violations.push({
      field: 'checksum.algorithm',
      code: 'algorithm',
      message: 'Checksum algorithm must be SHA-256.',
    });
  if (!DIGEST_PATTERN.test(draft.checksum.value))
    violations.push({
      field: 'checksum.value',
      code: 'format',
      message: 'Enter a lowercase SHA-256 checksum.',
    });
  if (
    !IDEMPOTENCY_PATTERN.test(draft.idempotencyKey) ||
    draft.idempotencyKey.trim() !== draft.idempotencyKey
  )
    violations.push({
      field: 'idempotencyKey',
      code: 'format',
      message: 'Enter an 8–128 character printable idempotency key.',
    });
  if (!safeVersion(draft.ifMatch))
    violations.push({
      field: 'ifMatch',
      code: 'version',
      message: 'Enter the exact current object version.',
    });
  return violations;
};

export const createUploadCompletionRequest = (
  draft: UploadCompletionDraft,
): UploadCompletionRequest => {
  try {
    return UploadCompletionRequestSchema.parse({
      body: {
        byteSize: draft.byteSize,
        checksum: draft.checksum,
        mediaType: draft.mediaType,
      },
      headers: {
        contentType: 'application/json',
        idempotencyKey: draft.idempotencyKey,
        ifMatch: draft.ifMatch,
      },
      uploadIntentId: draft.uploadIntentId,
    });
  } catch {
    throw new TypeError('Invalid upload completion request');
  }
};
