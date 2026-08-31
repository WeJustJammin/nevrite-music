export interface OfflineStatusProps {
  readonly connectivity: 'online' | 'offline';
  readonly requestId: string;
  readonly lastKnownGoodAt: string | null;
  readonly onRetry: () => void;
}

export function OfflineStatus({
  connectivity,
  requestId,
  lastKnownGoodAt,
  onRetry,
}: OfflineStatusProps) {
  if (connectivity === 'online') {
    return null;
  }

  return (
    <div
      className="infra-offline-status"
      role="status"
      aria-labelledby="offline-status-heading"
      aria-live="polite"
      aria-atomic="true"
    >
      <h2 id="offline-status-heading">Working offline</h2>
      <p>
        Canonical reads are unavailable. Unsaved actions remain local until
        identity, authority, and version are revalidated.
      </p>
      {lastKnownGoodAt !== null && (
        <p>
          Last verified:{' '}
          <time dateTime={lastKnownGoodAt}>{lastKnownGoodAt}</time>
        </p>
      )}
      <p>
        Request ID: <code>{requestId}</code>
      </p>
      <button type="button" onClick={onRetry}>
        Retry canonical read
      </button>
    </div>
  );
}

export default OfflineStatus;
