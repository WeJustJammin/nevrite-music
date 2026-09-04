import * as React from 'react';

import ProfileOwnershipActions from './ProfileOwnershipActions';
import ProfileOwnershipDetail from './ProfileOwnershipDetail';
import ProfileOwnershipList from './ProfileOwnershipList';
import type { ProfileOwnershipOperation } from './ProfileOwnershipCommandForms';
import type {
  OwnershipAsyncState,
  OwnershipRecord,
  ProfileOwnershipAccess,
  ProfileOwnershipVariant,
} from './ShadowClaimOwnershipWorkbench';
import { DeferredBoundary } from './profile-ownership-action-helpers';

type Props = Readonly<{
  contractSource: string;
  variant: ProfileOwnershipVariant;
  initial: OwnershipAsyncState;
  records: readonly OwnershipRecord[];
  selected: OwnershipRecord | undefined;
  recordId: string;
  version: string;
  access: ProfileOwnershipAccess;
  query: Readonly<{ tab?: string; selected?: string | null }>;
  expectedVersion: string;
  csrfToken: string;
  status: string;
  hasError: boolean;
  onStatus: (message: string) => void;
  onSuccess: (operation: ProfileOwnershipOperation, payload: unknown) => void;
  onCanonicalRefetch?: (reason: string) => Promise<void> | void;
}>;

const STATES = [
  'idle',
  'loading',
  'error',
  'empty',
  'success',
  'optimistic-pending',
  'optimistic-rollback',
  'conflict',
  'disabled',
  'degraded',
] as const;

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const breakpointSnapshot = (): Breakpoint => {
  const width = window.innerWidth;
  return width < 640 ? 'mobile' : width < 1100 ? 'tablet' : 'desktop';
};

const subscribeToBreakpoint = (notify: () => void): (() => void) => {
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
};

const DEFERRED = [
  'PRF-API-09',
  'PRF-API-10',
  'PRF-API-11',
  'PRF-API-12',
  'PRF-API-13',
  'PRF-API-14',
  'PRF-API-15',
  'PRF-API-16',
] as const;

const ProfileOwnershipLayout = (props: Props): React.ReactElement => {
  const {
    contractSource,
    variant,
    initial,
    records,
    selected,
    recordId,
    version,
    access,
    query,
    expectedVersion,
    csrfToken,
    status,
    hasError,
    onStatus,
    onSuccess,
    onCanonicalRefetch,
  } = props;
  const breakpoint = React.useSyncExternalStore(
    subscribeToBreakpoint,
    breakpointSnapshot,
    () => 'desktop',
  );
  const selectionUrl = `?tab=${encodeURIComponent(query.tab ?? 'ownership')}&selected=${encodeURIComponent(recordId)}`;

  if (access === 'not-rendered' || access === 'disabled') {
    return (
      <section
        data-workbench="shadow-claim-ownership"
        data-variant={variant}
        data-capability-state={
          access === 'not-rendered' ? 'not-rendered' : 'disabled'
        }
        data-deferred={access === 'disabled' ? 'true' : undefined}
        aria-label="Profile ownership capability boundary"
      >
        <h2>
          {access === 'not-rendered'
            ? 'Capability unavailable'
            : 'Profile ownership'}
        </h2>
        <p>
          {access === 'not-rendered'
            ? 'This capability is not available in this context.'
            : 'Disabled prerequisite. Complete the required setup first.'}
        </p>
        {access === 'disabled' ? (
          <a href="/app/profiles-verification">
            Review profile ownership access
          </a>
        ) : null}
        {DEFERRED.map((operation) => (
          <DeferredBoundary key={operation} operation={operation} />
        ))}
      </section>
    );
  }

  return (
    <section
      data-workbench="shadow-claim-ownership"
      data-variant={variant}
      data-layout="mobile-tablet-desktop"
      data-selection-url={selectionUrl}
      data-no-horizontal-scroll="true"
      data-contract-source={contractSource}
      data-version={version}
      data-reduced-motion="safe"
      aria-label="Shadow parties and ownership"
    >
      <style>{`.profile-ownership-controls button,.profile-ownership-controls a,.profile-ownership-controls input,.profile-ownership-controls select,.profile-ownership-controls textarea{min-inline-size: 44px;min-block-size:44px}@media (prefers-reduced-motion: reduce){.profile-ownership-controls *{scroll-behavior:auto;transition:none}}`}</style>
      <div
        id="profile-ownership-layout"
        data-testid="profile-ownership-layout"
        data-breakpoint={breakpoint}
        data-columns={
          breakpoint === 'mobile' ? '4' : breakpoint === 'tablet' ? '8' : '12'
        }
        data-composition={
          breakpoint === 'mobile'
            ? 'stacked'
            : breakpoint === 'tablet'
              ? 'collapsible-sidebar'
              : 'list-detail-action-rail'
        }
        className="profile-ownership-layout profile-ownership-controls"
      >
        <a href="/app/profiles-verification" className="back-link">
          Back to profile ownership records
        </a>
        <ProfileOwnershipList
          records={records}
          recordId={recordId}
          selectionUrl={selectionUrl}
        />
        <ProfileOwnershipDetail
          initial={initial}
          selected={selected}
          version={version}
          status={status}
          hasError={hasError}
          onStatus={onStatus}
          {...(onCanonicalRefetch === undefined ? {} : { onCanonicalRefetch })}
        />
        <ProfileOwnershipActions
          recordId={recordId}
          expectedVersion={expectedVersion}
          access={access}
          hasError={hasError}
          csrfToken={csrfToken}
          onStatus={onStatus}
          onSuccess={onSuccess}
        />
        <div hidden>
          {STATES.map((state) => (
            <span key={state} data-state={state}>
              {state}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfileOwnershipLayout;
