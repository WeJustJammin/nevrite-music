import type { AccessVariant } from '../../../../../packages/ui/src/infrastructure/presentation-types';

import { RelationshipCommandForms } from './RelationshipCommandForms';
import type {
  IdentityAuthorityAsyncState,
  IdentityAuthorityError,
  IdentityAuthorityRecord,
} from './identity-authority-workbench-types';

type RelationshipState = IdentityAuthorityAsyncState<
  readonly IdentityAuthorityRecord[]
>;

interface RelationshipCommandsProps {
  readonly access: AccessVariant;
  readonly actingPartyId: string;
  readonly organizationId: string | null;
  readonly expectedVersion: string | null;
  readonly initial: RelationshipState;
  readonly onCanonicalRefetch?: () => Promise<void>;
}

const errorForState = (
  state: RelationshipState,
): IdentityAuthorityError | null =>
  state.status === 'error' || state.status === 'optimistic-rollback'
    ? state.error
    : null;

const stateNotice = (state: RelationshipState): string => {
  switch (state.status) {
    case 'loading':
      return 'Loading current relationship records.';
    case 'degraded':
      return `Degraded read-only mode. Request ID: ${state.requestId}.`;
    case 'optimistic-pending':
      return `Reconciliation pending for ${state.operationId}.`;
    case 'optimistic-rollback':
      return `Reconciliation restored the prior state after ${state.error.code}.`;
    case 'disabled':
      return `Commands unavailable: ${state.reason}.`;
    case 'error':
      return state.error.code === 'RATE_LIMITED'
        ? 'Rate limited. Retry after the server cooldown.'
        : `Request failed: ${state.error.code}.`;
    case 'empty':
      return 'No relationship records are available.';
    case 'idle':
      return 'Ready for a canonical relationship command.';
    case 'success':
      return 'Canonical relationship records loaded.';
  }
};

export function RelationshipsAuthorityGovernanceCommands({
  access,
  actingPartyId,
  organizationId,
  expectedVersion,
  initial,
  onCanonicalRefetch,
}: RelationshipCommandsProps) {
  if (access === 'not-rendered') return null;

  const error = errorForState(initial);
  const invalid = error !== null;
  const errorId = invalid ? 'relationship-command-error' : undefined;
  const disabled = access !== 'full' || initial.status === 'loading' || invalid;
  const currentVersion =
    error?.details !== null &&
    error?.details !== undefined &&
    typeof error.details.currentVersion === 'string'
      ? error.details.currentVersion
      : 'not disclosed';

  return (
    <section
      className="relationships-authority-commands"
      aria-labelledby="relationships-authority-commands-heading"
      data-responsive-order="back-first"
    >
      <nav aria-label="Relationship workbench navigation">
        <a href="?tab=relationships">Back to list</a>
      </nav>
      <header>
        <p className="identity-eyebrow">Relationship commands</p>
        <h3 id="relationships-authority-commands-heading">
          Organizations, types, and membership tenure
        </h3>
        <p>
          Server-selected acting party: <code>{actingPartyId}</code>.
        </p>
        <p>
          Canonical states:{' '}
          {initial.status === 'success'
            ? initial.data.map(({ state }) => state).join(', ')
            : 'not loaded'}
          .
        </p>
      </header>
      <div
        className="relationship-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {stateNotice(initial)}
      </div>
      {invalid && error !== null && (
        <section
          id={errorId}
          className="relationship-command-error"
          aria-labelledby="relationship-error-heading"
        >
          <h4 id="relationship-error-heading" tabIndex={-1}>
            Check the highlighted fields.
          </h4>
          <p>{error.message}</p>
          <p>
            Request ID: <code>{error.requestId}</code>.
          </p>
          <p>
            Current server version: <code>{currentVersion}</code>.
          </p>
          <div className="relationship-conflict-actions">
            <button type="button">Review changes</button>
            <button
              type="button"
              disabled={error.code.endsWith('CONFLICT') === false}
            >
              Reapply
            </button>
            <button type="button">Discard</button>
          </div>
        </section>
      )}
      <RelationshipCommandForms
        disabled={disabled}
        errorId={errorId}
        invalid={invalid}
        expectedVersion={expectedVersion}
        organizationId={organizationId}
        readDisabled={access === 'disabled'}
        {...(onCanonicalRefetch === undefined ? {} : { onCanonicalRefetch })}
      />
      <section
        className="relationship-result"
        aria-labelledby="relationship-result-heading"
      >
        <h3 id="relationship-result-heading" tabIndex={-1}>
          Result
        </h3>
        <p>
          Successful commands return canonical state, version, and provenance.
        </p>
      </section>
    </section>
  );
}
