import type { OfflineIntent } from '@wejammin/contracts';

export interface OfflineIntentQueueProps {
  readonly intents: readonly OfflineIntent[];
  readonly connectivity: 'online' | 'offline';
  readonly requestId: string;
  readonly onRetry?: (intentId: string) => void | Promise<void>;
}

const intentMessage = (intent: OfflineIntent): string => {
  switch (intent.state) {
    case 'queued':
      return 'Queued locally; waiting for server revalidation.';
    case 'replaying':
      return 'Revalidating with the server.';
    case 'accepted':
      return 'Accepted after server revalidation.';
    case 'refused':
      return 'Refused by the server.';
    case 'pending_manual_review':
      return 'Manual review required; outcome is unknown.';
  }
};

export function OfflineIntentQueue({
  intents,
  connectivity,
  requestId,
  onRetry,
}: OfflineIntentQueueProps) {
  return (
    <section
      className="infra-offline-intents"
      aria-labelledby="offline-intents-heading"
    >
      <header>
        <p className="infra-eyebrow">Offline work</p>
        <h2 id="offline-intents-heading">Offline intents</h2>
        <p role="status" aria-live="polite" aria-atomic="true">
          Connectivity: {connectivity}. Local intents are not canonical until
          revalidated.
        </p>
      </header>

      {intents.length === 0 ? (
        <p>No offline intents.</p>
      ) : (
        <ul className="infra-offline-intents__list">
          {intents.map((intent) => {
            const refusal = intent.state === 'refused' ? intent.refusal : null;
            const canRetry =
              refusal?.retryable === true && onRetry !== undefined;
            return (
              <li
                className="infra-offline-intent"
                key={intent.intentId}
                data-state={intent.state}
              >
                <div>
                  <strong>{intent.operation}</strong>
                  <p>{intentMessage(intent)}</p>
                  {intent.targetId !== null && <code>{intent.targetId}</code>}
                </div>
                {refusal !== null && (
                  <p className="infra-offline-intent__refusal">
                    Refused: <code>{refusal.code}</code>
                    {refusal.requestId !== null && (
                      <>
                        {' '}
                        Request ID: <code>{refusal.requestId}</code>
                      </>
                    )}
                  </p>
                )}
                {canRetry && (
                  <button
                    type="button"
                    onClick={() => void onRetry(intent.intentId)}
                  >
                    Retry intent
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="infra-offline-intents__request-id">
        Request ID: <code>{requestId}</code>
      </p>
    </section>
  );
}

export default OfflineIntentQueue;
