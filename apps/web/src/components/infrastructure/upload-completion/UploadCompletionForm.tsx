import type { AccessVariant } from '@wejammin/ui/infrastructure/presentation';
import type { UploadCompletionRequest } from '@wejammin/contracts';

import UploadCompletionFeedback, {
  UploadCompletionPersonaNotice,
  UploadCompletionProductionNotice,
} from './UploadCompletionFeedback';
import UploadCompletionFields from './UploadCompletionFields';
import useUploadCompletionForm from './useUploadCompletionForm';
import {
  isProductionUploadCompletionEnabled,
  type UploadCompletionDraft,
  type UploadCompletionInvalidationReason,
  type UploadCompletionPolicy,
  type UploadCompletionProjection,
  type UploadCompletionRetryRequest,
  type UploadCompletionState,
} from './upload-completion-state';
import { uploadCompletionBackHref } from './upload-completion-navigation';
import '../../../styles/infrastructure.css';
import './upload-completion.css';

export interface UploadCompletionFormProps {
  readonly access: AccessVariant;
  readonly policy: UploadCompletionPolicy;
  readonly initialDraft: UploadCompletionDraft;
  readonly initialState?: UploadCompletionState;
  readonly capabilityReason?: string;
  readonly backHref?: string;
  readonly onSubmit?: (input: {
    readonly draft: UploadCompletionDraft;
    readonly request: UploadCompletionRequest;
  }) => Promise<UploadCompletionProjection>;
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

const ACCESS_LABELS: Readonly<Record<AccessVariant, string>> = {
  full: 'Full server-authorized completion',
  'read-only': 'Read-only completion view',
  'partial-hidden': 'Some completion fields are hidden by server policy',
  disabled: 'Completion is unavailable for this server capability',
  'not-rendered': 'Completion is not available for this request',
};

export function UploadCompletionForm({
  access,
  policy,
  initialDraft,
  initialState,
  capabilityReason = 'A server completion capability is required.',
  backHref,
  onSubmit,
  onCanonicalRefetch,
  onRetry,
  onConflictReview,
  onConflictReapply,
  onConflictDiscard,
}: UploadCompletionFormProps) {
  const controller = useUploadCompletionForm({
    access,
    policy,
    initialDraft,
    ...(initialState === undefined ? {} : { initialState }),
    ...(onSubmit === undefined ? {} : { onSubmit }),
  });
  if (access === 'not-rendered') return null;
  const serverCapabilityMissing =
    policy.persona === 'admin' &&
    (policy.stepUpVerified !== true || policy.auditedReason === undefined);
  const unavailable = access === 'disabled' || serverCapabilityMissing;
  const listHref = uploadCompletionBackHref(
    backHref,
    controller.state.draft.uploadIntentId,
  );

  return (
    <section
      className="upload-completion"
      data-responsive="mobile-tablet-desktop"
      data-access-variant={access}
      aria-labelledby="upload-completion-heading"
      aria-busy={
        controller.state.status === 'loading' ||
        controller.state.status === 'pending'
      }
    >
      <nav aria-label="Upload completion navigation">
        <a href={listHref}>Back to upload details</a>
      </nav>
      <header className="upload-completion-header">
        <p className="infra-eyebrow">Infrastructure upload</p>
        <h2 id="upload-completion-heading">Upload completion</h2>
        <p>{ACCESS_LABELS[access]}</p>
        <UploadCompletionPersonaNotice
          {...(policy.persona === undefined ? {} : { persona: policy.persona })}
          {...(policy.capabilityLabel === undefined
            ? {}
            : { capabilityLabel: policy.capabilityLabel })}
        />
        {!isProductionUploadCompletionEnabled('production') && (
          <UploadCompletionProductionNotice />
        )}
        {unavailable && (
          <p className="upload-completion-disabled" role="status">
            Action unavailable:{' '}
            {serverCapabilityMissing
              ? 'Recent step-up and an audited reason are required.'
              : capabilityReason}
          </p>
        )}
      </header>
      <UploadCompletionFeedback
        state={controller.state}
        {...(onCanonicalRefetch === undefined ? {} : { onCanonicalRefetch })}
        {...(onRetry === undefined ? {} : { onRetry })}
        {...(onConflictReview === undefined ? {} : { onConflictReview })}
        {...(onConflictReapply === undefined ? {} : { onConflictReapply })}
        {...(onConflictDiscard === undefined ? {} : { onConflictDiscard })}
      />
      <form
        onSubmit={controller.submit}
        noValidate
        aria-describedby="upload-completion-form-help"
      >
        <p id="upload-completion-form-help">
          The server verifies the uploaded bytes before the object can become
          ready.
        </p>
        <UploadCompletionFields
          access={access}
          draft={controller.draft}
          violations={controller.violations}
          disabled={controller.controlsDisabled}
          onChange={controller.update}
        />
        <div className="upload-completion-actions">
          <button type="submit" disabled={controller.commitDisabled}>
            Complete upload and start verification
          </button>
        </div>
      </form>
    </section>
  );
}

export default UploadCompletionForm;
