export interface SyncConflictProps {
  readonly currentVersion: string;
  readonly retainedInput: Readonly<Record<string, unknown>>;
  readonly onReview: () => void;
  readonly onReapply: () => void;
  readonly onDiscard: () => void;
}

export function SyncConflict({
  currentVersion,
  retainedInput,
  onReview,
  onReapply,
  onDiscard,
}: SyncConflictProps) {
  const retainedFieldCount = Object.keys(retainedInput).length;

  return (
    <section
      className="infra-sync-conflict"
      role="alert"
      aria-labelledby="sync-conflict-heading"
    >
      <h2 id="sync-conflict-heading" tabIndex={-1}>
        Review current version
      </h2>
      <p>
        The record changed before this action committed. No local draft was
        overwritten.
      </p>
      <p>
        Server version: <code>{currentVersion}</code>. Retained fields:{' '}
        {retainedFieldCount}.
      </p>
      <div className="infra-actions">
        <button type="button" onClick={onReview}>
          Review differences
        </button>
        <button type="button" onClick={onReapply}>
          Reapply retained draft
        </button>
        <button
          type="button"
          className="infra-secondary-action"
          onClick={onDiscard}
        >
          Discard draft
        </button>
      </div>
    </section>
  );
}

export default SyncConflict;
