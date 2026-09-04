import * as React from 'react';

import {
  configurationStatusMessage,
  PLATFORM_CONFIGURATION_LOADING_DELAY_MS,
} from './platform-configuration-state';
import type { PlatformConfigurationAsyncState } from './platform-configuration-workbench-types';

export interface PlatformConfigurationAsyncProps {
  readonly state: PlatformConfigurationAsyncState;
  readonly requestId: string;
  readonly onRetry?: () => void;
}

/** Render explicit async outcomes without stealing focus during refetch. */
export function PlatformConfigurationAsync({
  state,
  requestId,
  onRetry,
}: PlatformConfigurationAsyncProps): React.ReactElement {
  const message = configurationStatusMessage(state);
  const retryable = state.retryable === true || state.status === 'degraded';
  return (
    <section
      className="platform-configuration-status"
      data-async-state={state.status}
      role={
        state.status === 'error' || state.status === 'conflict'
          ? 'alert'
          : 'status'
      }
      aria-live="polite"
      aria-atomic="true"
      aria-busy={state.status === 'loading' ? 'true' : undefined}
      aria-labelledby="platform-configuration-status-heading"
    >
      <h2 id="platform-configuration-status-heading" tabIndex={-1}>
        {state.status === 'loading'
          ? 'Loading current configuration'
          : state.status === 'degraded'
            ? 'Platform configuration is degraded'
            : state.status === 'error'
              ? 'Platform configuration request failed'
              : state.status === 'conflict'
                ? 'Review the current version'
                : 'Platform configuration status'}
      </h2>
      {state.status === 'loading' ? (
        <div className="platform-configuration-skeleton" data-skeleton="true">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <p>
            Loading current records after{' '}
            {PLATFORM_CONFIGURATION_LOADING_DELAY_MS}ms.
          </p>
        </div>
      ) : null}
      <p>{message}</p>
      {state.status === 'empty' ? (
        <p>
          {state.reason === 'filter-miss' ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={onRetry === undefined}
            >
              Reset filters
            </button>
          ) : (
            'Create or import records through the approved release service.'
          )}
        </p>
      ) : null}
      {state.status === 'error' ||
      state.status === 'degraded' ||
      state.status === 'conflict' ? (
        <p>
          Request ID:{' '}
          <code>{state.error?.requestId ?? state.requestId ?? requestId}</code>
        </p>
      ) : null}
      {state.status === 'degraded' && state.lastVerifiedAt !== undefined ? (
        <p>
          Last-known-good freshness:{' '}
          <time dateTime={state.lastVerifiedAt ?? undefined}>
            {state.lastVerifiedAt ?? 'not verified'}
          </time>
        </p>
      ) : null}
      {retryable ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={onRetry === undefined}
        >
          Retry safe read
        </button>
      ) : null}
    </section>
  );
}

export default PlatformConfigurationAsync;
