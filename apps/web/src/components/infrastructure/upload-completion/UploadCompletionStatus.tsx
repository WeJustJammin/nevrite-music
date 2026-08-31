import type { ReactNode } from 'react';

import UploadCompletionError from './UploadCompletionError';
import UploadCompletionResult from './UploadCompletionResult';
import type {
  UploadCompletionInvalidationReason,
  UploadCompletionRetryRequest,
  UploadCompletionState,
} from './upload-completion-state';

export interface UploadCompletionStatusProps {
  readonly state: Exclude<
    UploadCompletionState,
    { status: 'validation_error' }
  >;
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

const Announcement = ({ children }: { readonly children: ReactNode }) => (
  <p
    className="upload-completion-announcement"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {children}
  </p>
);

const safeTimestamp = (value: string | null): string | null =>
  value !== null &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) &&
  Number.isFinite(Date.parse(value))
    ? value
    : null;

const safeRequestId = (value: string): string =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
    value,
  )
    ? value
    : '';

export function UploadCompletionStatus({
  state,
  onCanonicalRefetch,
  onRetry,
  onConflictReview,
  onConflictReapply,
  onConflictDiscard,
}: UploadCompletionStatusProps) {
  const refresh = (): void => {
    if (onCanonicalRefetch !== undefined) void onCanonicalRefetch('reconnect');
  };

  switch (state.status) {
    case 'idle':
      return <Announcement>Completion is ready to submit.</Announcement>;
    case 'loading':
      return <Announcement>Loading upload verification.</Announcement>;
    case 'pending':
      return (
        <Announcement>
          <strong>Verification pending.</strong> {state.message}
        </Announcement>
      );
    case 'offline':
      return (
        <section className="upload-completion-offline" role="status">
          <Announcement>{state.message}</Announcement>
          <p>
            Draft remains local and not canonical until identity, authority,
            content, and version are revalidated.
          </p>
        </section>
      );
    case 'error':
      return (
        <UploadCompletionError
          state={state}
          {...(onRetry === undefined ? {} : { onRetry })}
        />
      );
    case 'conflict':
      return (
        <section
          className="upload-completion-conflict"
          role="alert"
          aria-labelledby="upload-completion-conflict-heading"
        >
          <h3 id="upload-completion-conflict-heading">
            Review current upload version
          </h3>
          <p>
            Server version: <code>{state.currentVersion}</code>
          </p>
          <p>Your preserved completion draft remains available for review.</p>
          <div className="upload-completion-actions">
            <button type="button" onClick={onConflictReview}>
              Review changes
            </button>
            <button type="button" onClick={onConflictReapply}>
              Reapply preserved completion
            </button>
            <button type="button" onClick={onConflictDiscard}>
              Discard preserved completion
            </button>
          </div>
        </section>
      );
    case 'degraded': {
      const lastVerifiedAt = safeTimestamp(state.lastVerifiedAt);
      const requestId = safeRequestId(state.requestId);
      return (
        <section
          className="upload-completion-degraded"
          role="status"
          aria-labelledby="upload-completion-degraded-heading"
        >
          <h3 id="upload-completion-degraded-heading">
            Verification status degraded
          </h3>
          <Announcement>{state.message}</Announcement>
          {lastVerifiedAt !== null && (
            <p>
              Last verified:{' '}
              <time dateTime={lastVerifiedAt}>{lastVerifiedAt}</time>
            </p>
          )}
          {requestId !== '' && (
            <p>
              Request ID: <code>{requestId}</code>
            </p>
          )}
          {state.completion !== null && (
            <UploadCompletionResult completion={state.completion} />
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={onCanonicalRefetch === undefined}
          >
            Reconcile verification status
          </button>
        </section>
      );
    }
    case 'success':
      return <UploadCompletionResult completion={state.completion} announce />;
    case 'disabled':
      return (
        <p className="upload-completion-disabled" role="status">
          Action unavailable: {state.reason}
        </p>
      );
  }
}

export default UploadCompletionStatus;
