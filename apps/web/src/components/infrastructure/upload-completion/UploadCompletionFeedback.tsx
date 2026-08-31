import type { UploadCompletionPersona } from './upload-completion-state';
import type {
  UploadCompletionInvalidationReason,
  UploadCompletionRetryRequest,
  UploadCompletionState,
  UploadCompletionViolation,
} from './upload-completion-state';
import UploadCompletionStatus from './UploadCompletionStatus';

export interface UploadCompletionFeedbackProps {
  readonly state: UploadCompletionState;
  readonly onCanonicalRefetch?: (
    reason: UploadCompletionInvalidationReason,
  ) => void | Promise<void>;
  readonly onRetry?: (
    request: UploadCompletionRetryRequest,
  ) => void | Promise<void>;
  readonly onConflictReview?: () => void;
  readonly onConflictReapply?: () => void;
  readonly onConflictDiscard?: () => void;
}

export const UploadCompletionPersonaNotice = ({
  persona,
  capabilityLabel,
}: {
  readonly persona?: UploadCompletionPersona;
  readonly capabilityLabel?: string;
}) => {
  if (persona === undefined) return null;
  const label =
    persona === 'admin'
      ? `Admin completion requires ${capabilityLabel ?? 'the named capability'}, recent step-up, and an audited reason.`
      : `${persona[0]?.toUpperCase() ?? ''}${persona.slice(1)} completion is server-authorized for this request.`;
  return <p className="upload-completion-persona">{label}</p>;
};

export const UploadCompletionProductionNotice = () => (
  <p className="upload-completion-disabled" role="status">
    Production upload completion is disabled by default; only a server-projected
    completion callback can start verification.
  </p>
);

const fieldId = (field: string): string =>
  `upload-completion-${field
    .replaceAll('.', '-')
    .replace(/[A-Z]/gu, (character) => `-${character.toLowerCase()}`)}`;

const ValidationSummary = ({
  violations,
}: {
  readonly violations: readonly UploadCompletionViolation[];
}) => (
  <div className="upload-completion-summary" role="alert" tabIndex={-1}>
    <h3>Check the highlighted completion fields.</h3>
    <ul>
      {violations.map((violation) => (
        <li key={`${violation.field}-${violation.code}`}>
          <a href={`#${fieldId(violation.field)}`}>{violation.message}</a>
        </li>
      ))}
    </ul>
  </div>
);

export function UploadCompletionFeedback({
  state,
  onCanonicalRefetch,
  onRetry,
  onConflictReview,
  onConflictReapply,
  onConflictDiscard,
}: UploadCompletionFeedbackProps) {
  if (state.status === 'validation_error')
    return <ValidationSummary violations={state.violations} />;
  return (
    <UploadCompletionStatus
      state={state}
      {...(onCanonicalRefetch === undefined ? {} : { onCanonicalRefetch })}
      {...(onRetry === undefined ? {} : { onRetry })}
      {...(onConflictReview === undefined ? {} : { onConflictReview })}
      {...(onConflictReapply === undefined ? {} : { onConflictReapply })}
      {...(onConflictDiscard === undefined ? {} : { onConflictDiscard })}
    />
  );
}

export default UploadCompletionFeedback;
