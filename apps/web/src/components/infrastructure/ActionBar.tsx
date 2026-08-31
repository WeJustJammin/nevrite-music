import type { RefObject } from 'react';
import type { AccessVariant } from '@wejammin/ui/infrastructure/presentation';

export interface ActionBarProps {
  readonly access: AccessVariant;
  readonly expectedVersion: string | null;
  readonly onReviewArchive: () => void;
  readonly onRetry: () => void;
  readonly isPending: boolean;
  readonly commandAvailable?: boolean;
  readonly prerequisite?: string;
  readonly triggerRef?: RefObject<HTMLButtonElement | null>;
}

export function ActionBar({
  access,
  expectedVersion,
  onReviewArchive,
  onRetry,
  isPending,
  commandAvailable = false,
  prerequisite,
  triggerRef,
}: ActionBarProps) {
  if (access === 'not-rendered') {
    return null;
  }

  if (access === 'read-only' || access === 'partial-hidden') {
    return (
      <div className="infra-action-bar" aria-label="Available actions">
        <p className="infra-help">
          Read-only access. Changes are not available in this view.
        </p>
        <button type="button" onClick={onRetry}>
          Refresh current record
        </button>
      </div>
    );
  }

  if (access === 'disabled') {
    return (
      <div className="infra-action-bar" aria-label="Unavailable actions">
        <button type="button" disabled aria-describedby="action-prerequisite">
          Archive record
        </button>
        <p id="action-prerequisite" className="infra-help">
          {prerequisite ?? 'A server capability prerequisite is not satisfied.'}
        </p>
      </div>
    );
  }

  return (
    <div className="infra-action-bar" aria-label="Record actions">
      <p className="infra-help">
        Expected version: <code>{expectedVersion ?? 'not available'}</code>
      </p>
      <button
        ref={triggerRef}
        type="button"
        onClick={onReviewArchive}
        disabled={isPending || !commandAvailable}
      >
        {isPending ? 'Archive pending review' : 'Review archive'}
      </button>
      {!commandAvailable && (
        <p className="infra-help">
          Archive is disabled until a server command callback is available.
        </p>
      )}
    </div>
  );
}

export default ActionBar;
