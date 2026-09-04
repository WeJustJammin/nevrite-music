import * as React from 'react';

import OfflineStatus from '../infrastructure/OfflineStatus';
import SyncConflict from '../infrastructure/SyncConflict';

import type {
  OwnershipAsyncState,
  OwnershipRecord,
} from './ShadowClaimOwnershipWorkbench';

type Props = Readonly<{
  initial: OwnershipAsyncState;
  selected: OwnershipRecord | undefined;
  version: string;
  status: string;
  hasError: boolean;
  onStatus: (message: string) => void;
  onCanonicalRefetch?: (reason: string) => Promise<void> | void;
}>;

const initialStateCopy = (initial: OwnershipAsyncState): string => {
  switch (initial.status) {
    case 'idle':
      return 'Ready.';
    case 'loading':
      return 'Loading current records';
    case 'error':
      return initial.error?.message ?? 'Request failed.';
    case 'empty':
      return 'No ownership records are available.';
    case 'success':
      return 'Current records loaded.';
    case 'optimistic-pending':
      return 'Request pending review.';
    case 'optimistic-rollback':
      return initial.error?.message ?? 'Request was not applied.';
    case 'disabled':
      return 'Actions are disabled until the prerequisite is satisfied.';
    case 'degraded':
      return 'Profile ownership records are unavailable.';
  }
};

const ProfileOwnershipDetail = ({
  initial,
  selected,
  version,
  status,
  hasError,
  onStatus,
  onCanonicalRefetch,
}: Props): React.ReactElement => (
  <section
    role="region"
    aria-label="Shadow ownership detail"
    aria-labelledby="shadow-claim-ownership-detail-heading"
    data-async-state={initial.status}
  >
    <h2 id="shadow-claim-ownership-detail-heading">Shadow ownership detail</h2>
    <p>
      Version <strong data-version={version}>{version}</strong>.
      Server-authorized provenance.
    </p>
    <p data-state-copy={initial.status}>{initialStateCopy(initial)}</p>
    <p>{selected?.provenance[0]?.evidence ?? 'No record selected.'}</p>
    <p>
      State <strong>{selected?.state ?? 'No record selected.'}</strong>.
      Provenance source: {selected?.provenance[0]?.source ?? 'none'}.
    </p>
    <p>Allowed actions are limited by the active capability snapshot.</p>
    <table>
      <caption>Canonical ownership projection</caption>
      <thead>
        <tr>
          <th scope="col" aria-sort="none">
            Field
          </th>
          <th scope="col" aria-sort="none">
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Source domain</td>
          <td>
            {String(selected?.projection.sourceDomain ?? 'No record selected.')}
          </td>
        </tr>
        <tr>
          <td>Source entity</td>
          <td>
            {String(
              selected?.projection.sourceEntityId ?? 'No record selected.',
            )}
          </td>
        </tr>
        <tr>
          <td>Target party</td>
          <td>
            {String(
              selected?.projection.targetPartyId ?? 'No record selected.',
            )}
          </td>
        </tr>
        <tr>
          <td>Control level</td>
          <td>
            {String(selected?.projection.controlLevel ?? 'No record selected.')}
          </td>
        </tr>
      </tbody>
    </table>
    <div role="status" aria-live="polite" aria-atomic="true">
      {status}
    </div>
    {hasError && initial.error ? (
      <div role="alert" aria-live="polite" aria-atomic="true">
        <p id="ownership-error">Check the highlighted fields.</p>
        <p>{initial.error.message}</p>
        <p>Request ID: {initial.error.requestId}</p>
        <a href="#ownership-error">Review highlighted fields</a>
      </div>
    ) : null}
    {initial.error &&
    ['CONFLICT', 'IDEMPOTENCY_MISMATCH', 'VERSION_MISMATCH'].includes(
      initial.error.code,
    ) ? (
      <SyncConflict
        currentVersion={version}
        retainedInput={{}}
        onReview={() => onStatus('Review current server version.')}
        onReapply={() => onStatus('Reapply requires explicit confirmation.')}
        onDiscard={() => onStatus('Local input discarded.')}
      />
    ) : null}
    <button
      type="button"
      onClick={() => {
        void onCanonicalRefetch?.('mutation');
        onStatus('Refresh requested.');
      }}
    >
      Retry / Review
    </button>
    <p id="provenance-note">No challenge hash or destination is shown.</p>
    {initial.status === 'degraded' ? (
      <div data-degraded-scope="profile-ownership">
        <OfflineStatus
          connectivity="offline"
          requestId={initial.error?.requestId ?? 'unavailable'}
          lastKnownGoodAt={selected?.provenance[0]?.at ?? null}
          onRetry={() => {
            void onCanonicalRefetch?.('degraded-retry');
            onStatus('Refresh requested.');
          }}
        />
      </div>
    ) : null}
    <a href="/claim">Open invitation remediation</a>
  </section>
);

export default ProfileOwnershipDetail;
