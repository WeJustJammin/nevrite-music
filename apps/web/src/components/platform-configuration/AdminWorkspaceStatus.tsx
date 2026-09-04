import * as React from 'react';

import type { AdminWorkspaceAsyncState } from './admin-workspace-types';

export interface AdminWorkspaceStatusProps {
  readonly state: AdminWorkspaceAsyncState;
  readonly requestId: string;
  readonly onRetry: () => void;
}

export const AdminWorkspaceStatus = ({
  state,
  requestId,
  onRetry,
}: AdminWorkspaceStatusProps): React.ReactElement | null => {
  const status = state.status.toLowerCase();
  if (status === 'success' && state.data !== null && state.data !== undefined)
    return null;
  if (status === 'empty')
    return (
      <p
        className="platform-configuration-help"
        role="status"
        aria-live="polite"
      >
        No authorized records are available for this view.
      </p>
    );
  if (status === 'loading' || status === 'idle')
    return (
      <p
        className="platform-configuration-help"
        role="status"
        aria-live="polite"
      >
        Loading authorized workspace data…
      </p>
    );
  if (status === 'error') {
    const error = state.error;
    const errorRequestId = error?.requestId ?? state.requestId ?? requestId;
    return (
      <div
        className="platform-configuration-help"
        role="alert"
        aria-live="polite"
      >
        <strong>{error?.code ?? 'REQUEST_FAILED'}</strong>
        <span>{error?.message ?? 'The workspace request failed.'}</span>
        <span>Request ID: {errorRequestId}</span>
        {error?.code === 'UNAUTHENTICATED' ? (
          <a href="/auth/sign-in">Sign in again</a>
        ) : state.retryable ? (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    );
  }
  if (status === 'degraded' || state.data === null)
    return (
      <div
        className="platform-configuration-help"
        role="status"
        aria-live="polite"
      >
        <strong>Freshness unknown</strong>
        <span>Current workspace data is unavailable.</span>
        <span>Request ID: {state.requestId ?? requestId}</span>
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  return null;
};

export default AdminWorkspaceStatus;
