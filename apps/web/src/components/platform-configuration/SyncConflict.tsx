import * as React from 'react';

export interface SyncConflictProps {
  readonly serverVersion: string;
  readonly localVersion: string;
  readonly retainedInput: Readonly<Record<string, unknown>>;
  readonly onReview?: () => void;
  readonly onReapply?: () => void;
  readonly onDiscard?: () => void;
}

export function SyncConflict({
  serverVersion,
  localVersion,
  retainedInput,
  onReview,
  onReapply,
  onDiscard,
}: SyncConflictProps): React.ReactElement {
  return (
    <section
      className="platform-configuration-sync-conflict"
      role="alert"
      aria-labelledby="platform-configuration-sync-conflict-heading"
    >
      <h2 id="platform-configuration-sync-conflict-heading" tabIndex={-1}>
        Review the current version
      </h2>
      <p>
        No local draft was overwritten. Review before reapplying the retained
        input.
      </p>
      <p>
        Server version: <code>{serverVersion}</code>. Local version:{' '}
        <code>{localVersion}</code>. Retained fields:{' '}
        {Object.keys(retainedInput).length}.
      </p>
      <div className="platform-configuration-actions">
        <button type="button" onClick={onReview}>
          Review differences
        </button>
        <button type="button" onClick={onReapply}>
          Reapply retained draft
        </button>
        <button type="button" className="secondary-action" onClick={onDiscard}>
          Discard draft
        </button>
      </div>
    </section>
  );
}

export default SyncConflict;
