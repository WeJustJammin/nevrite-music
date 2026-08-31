import { useState } from 'react';
import type { JobStatus } from '@wejammin/contracts';

import JobProgress from './JobProgress';
import JobStatusFields from './JobStatusFields';
import RetryAfterCountdown, {
  normalizeRetryAfterSeconds,
} from './RetryAfterCountdown';
import type { JobAsyncState } from './job-state';
import '../../../styles/infrastructure-jobs.css';

export interface JobStatusPanelProps {
  readonly state: JobAsyncState;
  readonly requestId: string;
  readonly retryAfterSeconds?: number | null;
  readonly onRetry?: (() => void) | undefined;
}

const stateMessage = (state: JobAsyncState, requestId: string): string => {
  switch (state.status) {
    case 'idle':
      return 'Job status is ready to load.';
    case 'loading':
      return 'Loading job status.';
    case 'error':
      return `${state.error.message} Request ID: ${state.error.requestId || requestId}.`;
    case 'empty':
      return 'No job status was returned.';
    case 'success':
      return `Job status: ${state.data.state}.`;
    case 'optimistic-pending':
      return 'Job update is pending server confirmation.';
    case 'optimistic-rollback':
      return 'The job update was rolled back after server reconciliation.';
    case 'disabled':
      return `Job status is unavailable: ${state.reason}.`;
    case 'degraded':
      return state.data === null
        ? 'Job status is temporarily unavailable.'
        : 'Showing the last verified job status.';
  }
};

function JobDetails({
  job,
  version,
}: {
  readonly job: JobStatus;
  readonly version: string;
}) {
  return (
    <>
      <JobStatusFields job={job} />
      <JobProgress progress={job.progress} />
      <p className="infra-job-version">
        Server version: <code>{version}</code>
      </p>
    </>
  );
}

function RetryControl({
  retry,
  retryAfterSeconds,
  onRetry,
}: {
  readonly retry: boolean;
  readonly retryAfterSeconds: number | null | undefined;
  readonly onRetry?: (() => void) | undefined;
}) {
  const [retryAvailable, setRetryAvailable] = useState(
    () => normalizeRetryAfterSeconds(retryAfterSeconds ?? null) === 0,
  );
  const retryAllowed = retry && retryAvailable;
  return (
    <>
      {retryAfterSeconds !== undefined && (
        <RetryAfterCountdown
          retryAfterSeconds={retryAfterSeconds}
          onReady={() => setRetryAvailable(true)}
        />
      )}
      {retryAllowed && (
        <button type="button" onClick={onRetry}>
          Retry job status
        </button>
      )}
    </>
  );
}

export function JobStatusPanel({
  state,
  requestId,
  retryAfterSeconds,
  onRetry,
}: JobStatusPanelProps) {
  const stateRetryAfterSeconds =
    state.status === 'error' ? state.retryAfterSeconds : undefined;
  const effectiveRetryAfterSeconds =
    retryAfterSeconds === undefined
      ? stateRetryAfterSeconds
      : retryAfterSeconds;
  const retry =
    state.status === 'error' &&
    (state.retryable ||
      (effectiveRetryAfterSeconds !== undefined &&
        effectiveRetryAfterSeconds !== null)) &&
    onRetry !== undefined;
  const dataState = state.status;
  return (
    <section
      className="infra-job-panel"
      data-state={dataState}
      aria-labelledby="job-status-heading"
      aria-busy={state.status === 'loading'}
    >
      <header className="infra-job-panel__header">
        <p className="infra-eyebrow">Infrastructure job</p>
        <h2 id="job-status-heading">Job status</h2>
      </header>

      <div
        className="infra-job-live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {stateMessage(state, requestId)}
      </div>

      {state.status === 'success' && (
        <JobDetails job={state.data} version={state.version} />
      )}
      {state.status === 'degraded' && state.data !== null && (
        <JobDetails job={state.data} version="last-verified" />
      )}
      {state.status === 'optimistic-pending' && (
        <>
          <JobDetails job={state.data} version={state.version} />
          <p className="infra-job-pending">
            Operation {state.operationId} is awaiting canonical confirmation.
          </p>
        </>
      )}
      {state.status === 'optimistic-rollback' && (
        <>
          <JobDetails job={state.data} version={state.version} />
          <p className="infra-job-error">
            {state.error.message} Request ID:{' '}
            <code>{state.error.requestId}</code>
          </p>
        </>
      )}
      {state.status === 'loading' && (
        <p className="infra-job-loading">
          Loading job status. Safe prior content is preserved when available.
        </p>
      )}
      {state.status === 'error' && (
        <div className="infra-job-error" role="alert">
          <p>
            Error code: <code>{state.error.code}</code>
          </p>
          <p>{state.error.message}</p>
          <p>Request ID: {state.error.requestId || requestId}</p>
          <RetryControl
            key={effectiveRetryAfterSeconds ?? 'none'}
            retry={retry}
            retryAfterSeconds={effectiveRetryAfterSeconds}
            onRetry={onRetry}
          />
        </div>
      )}
      {state.status === 'empty' && (
        <p className="infra-job-empty">
          No job status was returned by the server.
        </p>
      )}
      {state.status === 'disabled' && (
        <p className="infra-job-disabled">{state.reason}</p>
      )}
      {state.status === 'degraded' && (
        <p className="infra-job-degraded">
          Last verified: {state.lastVerifiedAt ?? 'not available'}. Request ID:{' '}
          <code>{state.requestId || requestId}</code>
        </p>
      )}

      <p className="infra-job-request-id">
        Request ID: <code>{requestId}</code>
      </p>
    </section>
  );
}

export default JobStatusPanel;
