import type { ChangeEvent, ComponentProps } from 'react';

import UploadAdmissionField from './UploadAdmissionField';
import type {
  UploadAdmissionDraft,
  UploadAdmissionPolicy,
  UploadAdmissionViolation,
} from './upload-admission-state';

export interface UploadAdmissionFieldsProps {
  readonly draft: UploadAdmissionDraft;
  readonly policy: UploadAdmissionPolicy;
  readonly violations: readonly UploadAdmissionViolation[];
  readonly onChange: (draft: UploadAdmissionDraft) => void;
  readonly disabled: boolean;
}

const errorFor = (
  violations: readonly UploadAdmissionViolation[],
  field: UploadAdmissionViolation['field'],
): string | null =>
  violations.find((item) => item.field === field)?.message ?? null;

export function UploadAdmissionFields({
  draft,
  policy,
  violations,
  onChange,
  disabled,
}: UploadAdmissionFieldsProps) {
  const update = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    if (name === 'byteSize') {
      onChange({ ...draft, byteSize: value === '' ? '' : Number(value) });
      return;
    }
    if (name === 'checksum.algorithm' || name === 'checksum.value') {
      onChange({
        ...draft,
        checksum: {
          ...draft.checksum,
          ...(name === 'checksum.algorithm' ? { algorithm: value } : { value }),
        },
      });
      return;
    }
    onChange({ ...draft, [name]: value });
  };
  const field = (
    props: Omit<
      ComponentProps<typeof UploadAdmissionField>,
      'disabled' | 'onChange'
    >,
  ) => (
    <UploadAdmissionField {...props} disabled={disabled} onChange={update} />
  );
  return (
    <div className="upload-admission-fields">
      {field({
        id: 'upload-target-type',
        name: 'targetType',
        label: 'Target type',
        value: draft.targetType,
        help: 'Choose the server-registered target family.',
        error: errorFor(violations, 'targetType'),
        required: true,
        kind: 'select',
        options: ['Choose a target type', ...policy.targetTypes],
      })}
      {field({
        id: 'upload-target-id',
        name: 'targetId',
        label: 'Target ID',
        value: draft.targetId,
        help: 'Use the canonical UUID supplied by the server.',
        error: errorFor(violations, 'targetId'),
        required: true,
        inputMode: 'text',
      })}
      {field({
        id: 'upload-purpose',
        name: 'purpose',
        label: 'Purpose',
        value: draft.purpose,
        help: 'The selected purpose determines the target policy.',
        error: errorFor(violations, 'purpose'),
        required: true,
        kind: 'select',
        options: ['Choose a purpose', ...policy.purposes],
      })}
      {field({
        id: 'upload-media-type',
        name: 'mediaType',
        label: 'Media type',
        value: draft.mediaType,
        help: 'Use one type from the target allowlist.',
        error: errorFor(violations, 'mediaType'),
        required: true,
      })}
      {field({
        id: 'upload-byte-size',
        name: 'byteSize',
        label: 'Byte size',
        value: draft.byteSize,
        help: `Maximum ${policy.maxBytes} bytes.`,
        error: errorFor(violations, 'byteSize'),
        required: true,
        kind: 'number',
        max: policy.maxBytes,
        inputMode: 'numeric',
      })}
      {field({
        id: 'upload-checksum-algorithm',
        name: 'checksum.algorithm',
        label: 'Checksum algorithm',
        value: draft.checksum.algorithm,
        help: 'Only SHA-256 is accepted.',
        error: errorFor(violations, 'checksum.algorithm'),
        required: true,
        kind: 'select',
        options: ['sha256'],
      })}
      {field({
        id: 'upload-checksum-value',
        name: 'checksum.value',
        label: 'Checksum value',
        value: draft.checksum.value,
        help: 'Enter 64 lowercase hexadecimal characters.',
        error: errorFor(violations, 'checksum.value'),
        required: true,
      })}
      {field({
        id: 'upload-idempotency-key',
        name: 'idempotencyKey',
        label: 'Idempotency key',
        value: draft.idempotencyKey,
        help: 'Use 8–128 printable ASCII characters. It is never echoed.',
        error: errorFor(violations, 'idempotencyKey'),
        required: true,
        autoComplete: 'off',
      })}
      {field({
        id: 'upload-if-match',
        name: 'ifMatch',
        label: 'Expected version',
        value: draft.ifMatch,
        help: 'Use the exact quoted version, such as "2".',
        error: errorFor(violations, 'ifMatch'),
        required: policy.requiresIfMatch,
        autoComplete: 'off',
      })}
    </div>
  );
}

export default UploadAdmissionFields;
