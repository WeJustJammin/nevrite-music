import type { ChangeEvent } from 'react';
import type { AccessVariant } from '@wejammin/ui/infrastructure/presentation';

import type {
  UploadCompletionDraft,
  UploadCompletionViolation,
} from './upload-completion-state';

export interface UploadCompletionFieldsProps {
  readonly access: AccessVariant;
  readonly draft: UploadCompletionDraft;
  readonly violations: readonly UploadCompletionViolation[];
  readonly disabled: boolean;
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const fieldId = (field: string): string =>
  `upload-completion-${field
    .replaceAll('.', '-')
    .replace(/[A-Z]/gu, (character) => `-${character.toLowerCase()}`)}`;

const violationFor = (
  violations: readonly UploadCompletionViolation[],
  field: string,
): UploadCompletionViolation | undefined =>
  violations.find((violation) => violation.field === field);

const FieldError = ({
  field,
  violation,
}: {
  readonly field: string;
  readonly violation: UploadCompletionViolation | undefined;
}) =>
  violation === undefined ? null : (
    <p id={`${fieldId(field)}-error`}>{violation.message}</p>
  );

export function UploadCompletionFields({
  access,
  draft,
  violations,
  disabled,
  onChange,
}: UploadCompletionFieldsProps) {
  const errorFor = (field: string) => violationFor(violations, field);
  return (
    <>
      <label htmlFor={fieldId('uploadIntentId')}>Upload intent ID</label>
      <input
        id={fieldId('uploadIntentId')}
        name="uploadIntentId"
        value={draft.uploadIntentId}
        onChange={onChange}
        readOnly
        disabled={disabled}
        aria-invalid={errorFor('uploadIntentId') !== undefined}
        aria-describedby={
          errorFor('uploadIntentId') === undefined
            ? undefined
            : `${fieldId('uploadIntentId')}-error`
        }
      />
      <FieldError
        field="uploadIntentId"
        violation={errorFor('uploadIntentId')}
      />

      <label htmlFor={fieldId('byteSize')}>Byte size</label>
      <input
        id={fieldId('byteSize')}
        name="byteSize"
        type="number"
        min="1"
        value={draft.byteSize}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={errorFor('byteSize') !== undefined}
        aria-describedby={
          errorFor('byteSize') === undefined
            ? undefined
            : `${fieldId('byteSize')}-error`
        }
      />
      <FieldError field="byteSize" violation={errorFor('byteSize')} />

      <label htmlFor={fieldId('mediaType')}>Media type</label>
      <input
        id={fieldId('mediaType')}
        name="mediaType"
        value={draft.mediaType}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={errorFor('mediaType') !== undefined}
        aria-describedby={
          errorFor('mediaType') === undefined
            ? undefined
            : `${fieldId('mediaType')}-error`
        }
      />
      <FieldError field="mediaType" violation={errorFor('mediaType')} />

      {access !== 'partial-hidden' ? (
        <fieldset id={fieldId('checksum')}>
          <legend>Checksum</legend>
          <label htmlFor={fieldId('checksum.algorithm')}>
            Checksum algorithm
          </label>
          <input
            id={fieldId('checksum.algorithm')}
            name="checksum.algorithm"
            value={draft.checksum.algorithm}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={errorFor('checksum.algorithm') !== undefined}
            aria-describedby={
              errorFor('checksum.algorithm') === undefined
                ? undefined
                : `${fieldId('checksum.algorithm')}-error`
            }
          />
          <FieldError
            field="checksum.algorithm"
            violation={errorFor('checksum.algorithm')}
          />
          <label htmlFor={fieldId('checksum.value')}>Checksum value</label>
          <input
            id={fieldId('checksum.value')}
            name="checksum.value"
            value={draft.checksum.value}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={errorFor('checksum.value') !== undefined}
            aria-describedby={
              errorFor('checksum.value') === undefined
                ? undefined
                : `${fieldId('checksum.value')}-error`
            }
          />
          <FieldError
            field="checksum.value"
            violation={errorFor('checksum.value')}
          />
        </fieldset>
      ) : (
        <p>
          Checksum fields are retained in the server-projected draft and hidden
          by policy.
        </p>
      )}

      <label htmlFor={fieldId('idempotencyKey')}>Idempotency key</label>
      <input
        id={fieldId('idempotencyKey')}
        name="idempotencyKey"
        value={draft.idempotencyKey}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={errorFor('idempotencyKey') !== undefined}
        aria-describedby={
          errorFor('idempotencyKey') === undefined
            ? undefined
            : `${fieldId('idempotencyKey')}-error`
        }
      />
      <FieldError
        field="idempotencyKey"
        violation={errorFor('idempotencyKey')}
      />

      <label htmlFor={fieldId('ifMatch')}>If-Match object version</label>
      <input
        id={fieldId('ifMatch')}
        name="ifMatch"
        value={draft.ifMatch}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={errorFor('ifMatch') !== undefined}
        aria-describedby={
          errorFor('ifMatch') === undefined
            ? undefined
            : `${fieldId('ifMatch')}-error`
        }
      />
      <FieldError field="ifMatch" violation={errorFor('ifMatch')} />
    </>
  );
}

export default UploadCompletionFields;
