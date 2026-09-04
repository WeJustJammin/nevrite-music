import * as React from 'react';

import type {
  ProfilePortfolioAsyncState,
  ProfilePortfolioError,
} from './profile-portfolio-workbench-types';

const statusCopy = (
  initial: ProfilePortfolioAsyncState,
  statusMessage: string | undefined,
): string => {
  if (statusMessage !== undefined) return statusMessage;
  if (initial.status === 'degraded')
    return 'Current data is temporarily unavailable. Last verified data is shown when safe.';
  if (initial.status === 'loading') return 'Loading profile portfolio.';
  if (initial.status === 'empty')
    return 'No profile portfolio data is available.';
  if (initial.status === 'optimistic-pending') return 'Saving profile changes.';
  if (initial.status === 'disabled') return 'Profile portfolio is disabled.';
  if (initial.status === 'conflict')
    return 'The current profile version changed. Review the current changes.';
  if (initial.status === 'error' || initial.status === 'optimistic-rollback')
    return initial.error?.message ?? 'Review the highlighted request.';
  return 'Profile portfolio ready.';
};

export const ProfilePortfolioStatus = ({
  initial,
  requestId,
  statusMessage,
  onRetry,
}: Readonly<{
  initial: ProfilePortfolioAsyncState;
  requestId: string;
  statusMessage: string | undefined;
  onRetry?: () => void;
}>): React.ReactElement => {
  const error: ProfilePortfolioError | undefined = initial.error;
  const retryAfter = error?.details?.retryAfterSeconds;
  const conflict = initial.status === 'conflict';
  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        {...(retryAfter === undefined ? {} : { 'data-rate-wait': retryAfter })}
      >
        {statusCopy(initial, statusMessage)}
        {requestId ? <span> Request ID: {requestId}</span> : null}
        {initial.stale ? <span> Last verified data may be stale.</span> : null}
        {initial.lastVerifiedAt ? (
          <time dateTime={initial.lastVerifiedAt} data-last-verified>
            Last verified {initial.lastVerifiedAt}
          </time>
        ) : null}
        {initial.retryable && onRetry ? (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
      {error || conflict ? (
        <div role="alert" data-form-error>
          <p id="profile-portfolio-error-summary">
            {error?.code ?? 'VERSION_CONFLICT'}:{' '}
            {error?.message ?? 'Review the current profile version.'}
          </p>
          {requestId ? <p>Request ID: {requestId}</p> : null}
        </div>
      ) : null}
    </>
  );
};
