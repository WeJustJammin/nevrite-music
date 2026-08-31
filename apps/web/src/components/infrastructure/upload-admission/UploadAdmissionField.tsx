import type { ChangeEvent } from 'react';

export interface UploadAdmissionFieldProps {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly value: string | number;
  readonly help: string;
  readonly error: string | null;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly kind?: 'text' | 'number' | 'select';
  readonly options?: readonly string[];
  readonly max?: number;
  readonly inputMode?: 'numeric' | 'text';
  readonly autoComplete?: string;
  readonly onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}

export function UploadAdmissionField({
  id,
  name,
  label,
  value,
  help,
  error,
  disabled,
  required,
  kind = 'text',
  options = [],
  max,
  inputMode = 'text',
  autoComplete,
  onChange,
}: UploadAdmissionFieldProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = error === null ? helpId : `${helpId} ${errorId}`;
  const common = {
    id,
    name,
    value,
    disabled,
    required,
    onChange,
    'aria-describedby': describedBy,
    ...(error === null ? {} : { 'aria-invalid': true }),
  } as const;
  return (
    <div className="upload-admission-field">
      <label htmlFor={id}>{label}</label>
      {kind === 'select' ? (
        <select {...common}>
          {options.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          type={kind}
          max={kind === 'number' ? max : undefined}
          inputMode={inputMode}
          autoComplete={autoComplete}
        />
      )}
      <p id={helpId}>{help}</p>
      {error !== null && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default UploadAdmissionField;
