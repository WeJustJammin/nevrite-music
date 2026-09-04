import { useMemo } from 'react';

import { presentIdentityAuthorityState } from './identity-authority-state';
import { useIdentityAuthorityInvalidation } from './identity-authority-invalidation';
import type { IdentityAuthorityTab } from './identity-authority-routes';
import type {
  IdentityAuthorityAsyncState,
  IdentityAuthorityRecord,
  IdentityAuthorityRefetchReason,
  IdentityAuthorityWorkbenchProps,
} from './identity-authority-workbench-types';

export interface IdentityAuthorityWorkbenchConfig {
  readonly id: string;
  readonly tab: IdentityAuthorityTab;
  readonly title: string;
}

const recordsFromState = (
  state: IdentityAuthorityAsyncState<readonly IdentityAuthorityRecord[]>,
): readonly IdentityAuthorityRecord[] => {
  if (
    state.status === 'success' ||
    state.status === 'optimistic-pending' ||
    state.status === 'optimistic-rollback'
  )
    return state.data;
  if (state.status === 'degraded' && state.data !== null) return state.data;
  return [];
};

const safeRefetch = (
  callback: (reason: IdentityAuthorityRefetchReason) => Promise<void>,
  reason: IdentityAuthorityRefetchReason,
): void => {
  void callback(reason).catch(() => undefined);
};

const stateCopy = (
  state: IdentityAuthorityAsyncState<readonly IdentityAuthorityRecord[]>,
): string => {
  switch (state.status) {
    case 'idle':
      return 'Ready for a canonical read.';
    case 'loading':
      return 'Loading current records';
    case 'error':
      return `Unable to load this view. Recovery: ${state.error.code}.`;
    case 'empty':
      return state.reason === 'filter-miss'
        ? 'No records match the active filter.'
        : state.reason === 'not-disclosed'
          ? 'No records are disclosed in this view.'
          : 'No records are available.';
    case 'success':
      return state.stale
        ? 'Current records are stale.'
        : 'Current records loaded.';
    case 'optimistic-pending':
      return `Change pending confirmation: ${state.operationId}.`;
    case 'optimistic-rollback':
      return `Change was refused: ${state.error.code}.`;
    case 'disabled':
      return `Action unavailable: ${state.reason}`;
    case 'degraded':
      return `Showing last verified records. Request ID: ${state.requestId}.`;
  }
};

const safeProvenance = (record: IdentityAuthorityRecord): string =>
  record.provenance
    .map((entry) => `${entry.source} (${entry.visibility})`)
    .join(', ');

export function IdentityAuthorityWorkbench(
  {
    contractFields,
    variant,
    initial,
    actorId,
    actingPartyId,
    access,
    query,
    selectedId,
    expectedVersion,
    onCanonicalRefetch,
  }: IdentityAuthorityWorkbenchProps,
  config: IdentityAuthorityWorkbenchConfig,
) {
  useIdentityAuthorityInvalidation(config.tab, onCanonicalRefetch);
  const records = useMemo(() => recordsFromState(initial), [initial]);
  const selected =
    records.find((record) => record.id === selectedId) ?? records[0] ?? null;
  const presentation = presentIdentityAuthorityState(
    initial as unknown as Readonly<Record<string, unknown>>,
  );
  if (access === 'not-rendered') return null;

  return (
    <section
      className="identity-authority-workbench"
      data-workbench={config.id}
      data-layout="list-detail"
      aria-labelledby={`${config.id}-heading`}
    >
      <header>
        <p className="identity-eyebrow">Identity authority workbench</p>
        <h2 id={`${config.id}-heading`}>{config.title}</h2>
        <p>
          Acting party: <code>{actingPartyId}</code>. Actor:{' '}
          <code>{actorId}</code>.
        </p>
        <p>
          Server-selected presentation: <code>{variant}</code>. Contract:{' '}
          <code>{contractFields.source}</code>.
        </p>
        <p>
          View tab: <code>{query.tab ?? config.tab}</code>. URL state refines
          the view only.
        </p>
      </header>
      <div
        className="identity-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {stateCopy(initial)}
        {presentation.status === 'loading' && presentation.showSkeleton
          ? ' Loading skeleton available.'
          : ''}
      </div>
      {initial.status === 'error' && (
        <p role="alert">
          {initial.error.message} Retained valid input is available for
          recovery.
        </p>
      )}
      {initial.status === 'empty' && initial.reason === 'filter-miss' && (
        <a href="?tab=people">Reset filters</a>
      )}
      <div className="identity-workbench-grid">
        <section
          className="identity-record-list"
          aria-labelledby={`${config.id}-list-heading`}
        >
          <h3 id={`${config.id}-list-heading`}>Record list</h3>
          <p>
            {records.length} record{records.length === 1 ? '' : 's'} in the
            canonical projection.
          </p>
          <ul>
            {records.map((record) => (
              <li
                key={record.id}
                aria-current={record.id === selected?.id ? 'true' : undefined}
              >
                <a
                  href={`?tab=${config.tab}&selected=${encodeURIComponent(record.id)}`}
                >
                  {record.id}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => safeRefetch(onCanonicalRefetch, 'navigation')}
          >
            Refresh canonical list
          </button>
        </section>
        <section
          className="identity-record-detail"
          aria-labelledby={`${config.id}-detail-heading`}
          data-record-version={selected?.version.replaceAll('"', '')}
        >
          <h3 id={`${config.id}-detail-heading`}>Record detail</h3>
          <button
            type="button"
            className="identity-back"
            onClick={() => undefined}
          >
            Back to list
          </button>
          {selected === null ? (
            <p>Select a record to review its disclosure-safe facts.</p>
          ) : (
            <>
              <p>
                Record: <strong>{selected.id}</strong>
              </p>
              <p>
                State: {selected.state}. Version:{' '}
                <code>{selected.version}</code>.
              </p>
              <p>Provenance: {safeProvenance(selected)}</p>
              {expectedVersion !== null && (
                <p>
                  Expected version for commands: <code>{expectedVersion}</code>.
                </p>
              )}
              <button
                type="button"
                onClick={() => safeRefetch(onCanonicalRefetch, 'mutation')}
              >
                Request current version
              </button>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
