import type { UploadAdmissionViolation } from './upload-admission-state';

export const uploadAdmissionFieldId = (field: string): string =>
  `upload-${field
    .replaceAll('.', '-')
    .replace(/[A-Z]/gu, (character) => `-${character.toLowerCase()}`)}`;

export const firstInvalidId = (
  violations: readonly UploadAdmissionViolation[],
): string | null => {
  const first = violations[0];
  return first === undefined ? null : uploadAdmissionFieldId(first.field);
};

export interface UploadAdmissionValidationSummaryProps {
  readonly violations: readonly UploadAdmissionViolation[];
}

export function UploadAdmissionValidationSummary({
  violations,
}: UploadAdmissionValidationSummaryProps) {
  return (
    <div
      id="upload-admission-summary"
      className="upload-admission-summary"
      role="alert"
      tabIndex={-1}
    >
      <h3>Check the highlighted fields.</h3>
      <ul>
        {violations.map((item) => (
          <li key={`${item.field}-${item.code}`}>
            <a href={`#${uploadAdmissionFieldId(item.field)}`}>
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UploadAdmissionValidationSummary;
