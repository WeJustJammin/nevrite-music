import type {
  UploadAdmissionDraft,
  UploadAdmissionField,
  UploadAdmissionPolicy,
  UploadAdmissionViolation,
} from './upload-admission-state';

const TARGET_TYPE_PATTERN = /^[a-z][a-z0-9.]{0,63}$/u;
const PURPOSE_PATTERN = /^[a-z][a-z0-9_.-]{0,63}$/u;
const MEDIA_TYPE_PATTERN = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/u;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const POSITIVE_VERSION_PATTERN = /^"[1-9][0-9]{0,18}"$/u;
const PRINTABLE_ASCII_PATTERN = /^[\x20-\x7e]+$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

const violation = (
  field: UploadAdmissionField,
  code: string,
  message: string,
): UploadAdmissionViolation => ({ field, code, message });

const validateIdempotencyKey = (
  value: string,
): UploadAdmissionViolation | null => {
  if (
    value.length < 8 ||
    value.length > 128 ||
    value.trim() !== value ||
    !PRINTABLE_ASCII_PATTERN.test(value)
  ) {
    return violation(
      'idempotencyKey',
      'idempotency_key_invalid',
      'Use 8–128 printable ASCII characters without leading or trailing spaces.',
    );
  }
  return null;
};

export function validateUploadAdmissionDraft(
  draft: UploadAdmissionDraft,
  policy: UploadAdmissionPolicy,
): readonly UploadAdmissionViolation[] {
  const violations: UploadAdmissionViolation[] = [];
  if (
    !TARGET_TYPE_PATTERN.test(draft.targetType) ||
    !policy.targetTypes.includes(draft.targetType)
  ) {
    violations.push(
      violation(
        'targetType',
        'target_type_invalid',
        'Choose a registered target type.',
      ),
    );
  }
  if (!UUID_PATTERN.test(draft.targetId.toLowerCase())) {
    violations.push(
      violation('targetId', 'target_id_invalid', 'Enter a valid target ID.'),
    );
  }
  if (
    !PURPOSE_PATTERN.test(draft.purpose) ||
    !policy.purposes.includes(draft.purpose)
  ) {
    violations.push(
      violation(
        'purpose',
        'purpose_invalid',
        'Choose an allowed upload purpose.',
      ),
    );
  }
  const normalizedMediaType = draft.mediaType.trim().toLowerCase();
  if (
    !MEDIA_TYPE_PATTERN.test(normalizedMediaType) ||
    !policy.allowedMediaTypes
      .map((value) => value.toLowerCase())
      .includes(normalizedMediaType)
  ) {
    violations.push(
      violation(
        'mediaType',
        'media_type_invalid',
        'Choose an allowed media type.',
      ),
    );
  }
  const byteSize = draft.byteSize;
  if (
    typeof byteSize !== 'number' ||
    !Number.isSafeInteger(byteSize) ||
    byteSize < 1
  ) {
    violations.push(
      violation(
        'byteSize',
        'byte_size_invalid',
        'Enter a whole number of at least 1 byte.',
      ),
    );
  } else if (byteSize > policy.maxBytes) {
    violations.push(
      violation(
        'byteSize',
        'byte_size_too_large',
        `Use no more than ${policy.maxBytes} bytes.`,
      ),
    );
  }
  if (draft.checksum.algorithm !== 'sha256') {
    violations.push(
      violation(
        'checksum.algorithm',
        'checksum_algorithm_invalid',
        'Use SHA-256.',
      ),
    );
  }
  if (!SHA256_PATTERN.test(draft.checksum.value)) {
    violations.push(
      violation(
        'checksum.value',
        'checksum_value_invalid',
        'Use 64 lowercase hexadecimal characters.',
      ),
    );
  }
  const idempotencyViolation = validateIdempotencyKey(draft.idempotencyKey);
  if (idempotencyViolation !== null) violations.push(idempotencyViolation);
  if (policy.requiresIfMatch && !POSITIVE_VERSION_PATTERN.test(draft.ifMatch)) {
    violations.push(
      violation(
        'ifMatch',
        'if_match_invalid',
        'Use the expected version in quotes, such as "2".',
      ),
    );
  }
  return violations;
}

export const normalizeUploadAdmissionDraft = (
  draft: UploadAdmissionDraft,
): UploadAdmissionDraft => ({
  ...draft,
  mediaType: draft.mediaType.trim().toLowerCase(),
});
