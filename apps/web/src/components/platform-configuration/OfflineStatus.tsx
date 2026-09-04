import * as React from 'react';

export interface OfflineStatusProps {
  readonly connectivity: 'online' | 'offline';
  readonly intents: number;
  readonly serverVersion: string | null;
  readonly localVersion: string | null;
  readonly requestId?: string;
  readonly onRetry?: () => void;
}

/** Offline state retains refused intents and never silently overwrites a version. */
export function OfflineStatus({
  connectivity,
  intents,
  serverVersion,
  localVersion,
  requestId,
  onRetry,
}: OfflineStatusProps): React.ReactElement | null {
  if (connectivity === 'online' && intents === 0) return null;
  return (
    <section
      className="platform-configuration-offline-status"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-labelledby="platform-configuration-offline-heading"
    >
      <h2 id="platform-configuration-offline-heading">
        {connectivity === 'offline' ? 'Working offline' : 'Pending sync review'}
      </h2>
      <p>
        {connectivity === 'offline'
          ? 'Canonical reads are unavailable. Refused intents remain visible until authority is revalidated.'
          : 'Pending intents require a canonical version check before they can be retried.'}
      </p>
      <dl>
        <div>
          <dt>Server version</dt>
          <dd>
            <code>{serverVersion ?? 'unknown'}</code>
          </dd>
        </div>
        <div>
          <dt>Local version</dt>
          <dd>
            <code>{localVersion ?? 'unknown'}</code>
          </dd>
        </div>
        <div>
          <dt>Retained intents</dt>
          <dd>{intents}</dd>
        </div>
      </dl>
      {requestId === undefined ? null : (
        <p>
          Request ID: <code>{requestId}</code>
        </p>
      )}
      <button type="button" onClick={onRetry} disabled={onRetry === undefined}>
        Retry canonical read
      </button>
    </section>
  );
}

export default OfflineStatus;
