import * as React from 'react';

export interface ContentSchemaRegistryOfflineStatusProps {
  readonly connectivity: 'online' | 'offline';
  readonly intents: number;
  readonly serverVersion: string | null;
  readonly localVersion: string | null;
  readonly onRetry?: () => void;
}

/** Registry data is never retained offline; only the truthful status is shown. */
export function ContentSchemaRegistryOfflineStatus({
  connectivity,
  intents,
  serverVersion,
  localVersion,
  onRetry,
}: ContentSchemaRegistryOfflineStatusProps): React.ReactElement | null {
  if (connectivity === 'online' && intents === 0) return null;
  return (
    <section
      className="content-schema-registry-offline-status"
      role="status"
      aria-live="polite"
      aria-labelledby="content-schema-registry-offline-heading"
    >
      <h3 id="content-schema-registry-offline-heading">
        <span aria-hidden="true">⚠</span>{' '}
        {connectivity === 'offline'
          ? 'Registry is offline'
          : 'Registry needs sync'}
      </h3>
      <p>
        Canonical registry reads are unavailable. No registry intent was
        retained offline.
      </p>
      <dl>
        <dt>Server version</dt>
        <dd>
          <code>{serverVersion ?? 'unknown'}</code>
        </dd>
        <dt>Local version</dt>
        <dd>
          <code>{localVersion ?? 'unknown'}</code>
        </dd>
        <dt>Retained intents</dt>
        <dd>{intents}</dd>
      </dl>
      <button type="button" onClick={onRetry} disabled={onRetry === undefined}>
        Retry canonical read
      </button>
    </section>
  );
}

export default ContentSchemaRegistryOfflineStatus;
