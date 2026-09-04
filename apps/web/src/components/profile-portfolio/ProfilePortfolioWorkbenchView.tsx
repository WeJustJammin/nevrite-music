import * as React from 'react';

import type { ProfilePortfolioProjection } from '../../server/profile-portfolio-projection.ts';
import {
  profilePortfolioFacts,
  profilePortfolioLayerViews,
  profilePortfolioPartyId,
  profilePortfolioRequestId,
  profilePortfolioVersion,
} from './profile-portfolio-workbench-helpers';
import {
  DeferredProfilePortfolioCopy,
  ProfilePortfolioCuration,
  ProfilePortfolioFactsSection,
  ProfilePortfolioHeader,
  ProfilePortfolioLayerSection,
} from './ProfilePortfolioWorkbenchParts';
import { ProfilePortfolioEditor } from './ProfilePortfolioEditor';
import ProfilePortfolioFilter from './ProfilePortfolioFilter';
import { ProfilePortfolioStatus } from './ProfilePortfolioStatus';
import type {
  ProfilePortfolioAccess,
  ProfilePortfolioAsyncState,
  ProfilePortfolioContractFields,
  ProfilePortfolioVariant,
} from './profile-portfolio-workbench-types';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export type ProfilePortfolioWorkbenchViewProps = Readonly<{
  contractFields: ProfilePortfolioContractFields;
  variant: ProfilePortfolioVariant;
  access: ProfilePortfolioAccess;
  initial: ProfilePortfolioAsyncState;
  projection: ProfilePortfolioProjection | null;
  actorId: string | null;
  actingPartyId: string | null;
  expectedVersion: string | null;
  csrfToken: string;
  breakpoint: Breakpoint;
  selectionUrl: string;
  filter: string;
  mutationBusy: boolean;
  idempotencyKey: string;
  statusMessage: string | undefined;
  onFilterSubmit: (value: string) => void;
  onMutationSubmit: React.FormEventHandler<HTMLFormElement>;
  onRetry: () => void;
  onSelection: (id: string) => string;
}>;

const ProfilePortfolioWorkbenchView = (
  props: ProfilePortfolioWorkbenchViewProps,
): React.ReactElement => {
  const {
    contractFields,
    variant,
    access,
    initial,
    projection,
    actorId,
    actingPartyId,
    expectedVersion,
    csrfToken,
    breakpoint,
    selectionUrl,
    filter,
    mutationBusy,
    idempotencyKey,
    statusMessage,
    onFilterSubmit,
    onMutationSubmit,
    onRetry,
    onSelection,
  } = props;
  const layers = profilePortfolioLayerViews(projection);
  const version = profilePortfolioVersion(initial, expectedVersion);
  const partyId = profilePortfolioPartyId(projection);
  const requestId = profilePortfolioRequestId(initial);
  const canEdit = access === 'full';
  const canFilter =
    canEdit || variant === 'publicRead' || variant === 'entitledRead';
  const showData = access !== 'not-rendered' && access !== 'disabled';

  return (
    <section
      id="profile-portfolio"
      data-workbench="profile-portfolio-epk"
      data-variant={variant}
      data-state={initial.status}
      data-access={access}
      data-breakpoint={breakpoint}
      data-composition={
        breakpoint === 'mobile'
          ? 'stacked'
          : breakpoint === 'tablet'
            ? 'inspector'
            : 'list-detail-action-rail'
      }
      data-selection-url={selectionUrl}
      data-no-horizontal-scroll="true"
      data-target-size="min-inline-size: 44px"
      data-reduced-motion="prefers-reduced-motion; transition: none"
      data-contract-source={contractFields.source}
      data-version={version}
      {...(actorId === null ? {} : { 'data-actor-id': actorId })}
      {...(actingPartyId === null
        ? {}
        : { 'data-acting-party-id': actingPartyId })}
      aria-label="Profile portfolio and EPK workbench"
    >
      <a className="profile-portfolio-skip-link" href="#profile-portfolio">
        Skip to profile portfolio
      </a>
      {showData ? (
        <>
          <a
            className="profile-portfolio-back"
            href="/app/profiles-verification"
          >
            Back to profile verification
          </a>
          <ProfilePortfolioHeader projection={projection} />
          <ProfilePortfolioStatus
            initial={initial}
            requestId={requestId}
            statusMessage={statusMessage}
            onRetry={onRetry}
          />
          {canEdit ? (
            <ProfilePortfolioEditor
              contractFields={contractFields}
              partyId={partyId}
              projection={projection}
              version={version}
              csrfToken={csrfToken}
              idempotencyKey={idempotencyKey}
              mutationBusy={mutationBusy}
              errorField={initial.error?.code === 'VALIDATION_FAILED'}
              onMutationSubmit={onMutationSubmit}
            />
          ) : null}
          {canFilter ? (
            <ProfilePortfolioFilter
              canEdit={canEdit}
              filter={filter}
              onFilterSubmit={onFilterSubmit}
            />
          ) : null}
          <nav aria-label="Profile sections">
            <ul>
              {layers.map((layer) => (
                <li key={`nav-${layer.code}`}>
                  <a href={onSelection(layer.code)}>{layer.code}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="profile-portfolio-layer-list">
            {layers.map((layer) => (
              <ProfilePortfolioLayerSection key={layer.code} layer={layer} />
            ))}
          </div>
          <ProfilePortfolioFactsSection
            id="profile-portfolio-facts"
            title="Credit-backed portfolio"
            items={profilePortfolioFacts(projection, 'portfolio')}
          />
          <ProfilePortfolioFactsSection
            id="profile-portfolio-reel"
            title="Rights-bearing reel"
            items={profilePortfolioFacts(projection, 'reel')}
          />
          {canEdit ? <ProfilePortfolioCuration onRetry={onRetry} /> : null}
          <p data-contract-version={version}>
            Contract: {contractFields.source}. Version {version || 'unknown'}.
          </p>
        </>
      ) : (
        <DeferredProfilePortfolioCopy access={access} />
      )}
    </section>
  );
};

export default ProfilePortfolioWorkbenchView;
