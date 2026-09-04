import * as React from 'react';

import type { PlatformConfigurationError } from './platform-configuration-workbench-types';
import {
  fieldViolation,
  normalizeValidationPath,
} from './platform-configuration-form-validation';

export interface ValidationSummaryProps {
  readonly error?: PlatformConfigurationError | undefined;
}

/** Linked summary and field messages keep validation keyboard reachable. */
export function ValidationSummary({
  error,
}: ValidationSummaryProps): React.ReactElement | null {
  if (error === undefined) return null;
  const violations = error.details?.violations ?? [];
  return (
    <section
      id="platform-configuration-validation-summary"
      role="status"
      aria-live="polite"
      aria-labelledby="platform-configuration-validation-heading"
      className="platform-configuration-validation-summary"
    >
      <h3 id="platform-configuration-validation-heading">
        Check the highlighted fields.
      </h3>
      <p>{error.message}</p>
      {violations.length > 0 ? (
        <ul>
          {violations.map((violation) => (
            <li key={`${violation.path}-${violation.message}`}>
              <a
                href={`#${normalizeValidationPath(violation.path) ?? 'platform-configuration-validation-summary'}`}
              >
                {violation.path}: {violation.message}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export const FieldError = ({
  field,
  error,
}: {
  readonly field: string;
  readonly error?: PlatformConfigurationError | undefined;
}): React.ReactElement | null => {
  const violation = fieldViolation(field, error);
  return violation === undefined ? null : (
    <p
      id={`${field}-error`}
      className="platform-configuration-field-error"
      role="alert"
    >
      {violation.message}
    </p>
  );
};
