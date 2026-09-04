import * as React from 'react';

import type { ProfilePortfolioLayerView } from '../../server/profile-portfolio-ssr.ts';
import type { ProfilePortfolioProjection } from '../../server/profile-portfolio-projection.ts';
import {
  profilePortfolioName,
  profilePortfolioTagline,
  type ProfilePortfolioFactView,
} from './profile-portfolio-workbench-helpers';
import type { ProfilePortfolioAccess } from './profile-portfolio-workbench-types';

export const DeferredProfilePortfolioCopy = ({
  access,
}: Readonly<{ access: ProfilePortfolioAccess }>): React.ReactElement => (
  <section
    data-capability-state={access}
    data-deferred="true"
    aria-label="Deferred profile portfolio capabilities"
  >
    <h2>
      {access === 'not-rendered'
        ? 'Capability unavailable'
        : 'Profile portfolio'}
    </h2>
    <p>
      {access === 'not-rendered'
        ? 'This capability is not available in this context.'
        : 'Disabled prerequisite. Complete the required setup first.'}
    </p>
    <p data-feature="epk-share-pdf-controls" aria-disabled="true">
      EPK, share, and PDF controls are deferred and unavailable in this phase.
    </p>
  </section>
);

export const ProfilePortfolioHeader = ({
  projection,
}: Readonly<{
  projection: ProfilePortfolioProjection | null;
}>): React.ReactElement => (
  <header aria-labelledby="profile-portfolio-heading">
    <p>Public profile projection</p>
    <h1 id="profile-portfolio-heading">{profilePortfolioName(projection)}</h1>
    {profilePortfolioTagline(projection) ? (
      <p>{profilePortfolioTagline(projection)}</p>
    ) : null}
  </header>
);

export const ProfilePortfolioLayerSection = ({
  layer,
}: Readonly<{ layer: ProfilePortfolioLayerView }>): React.ReactElement => (
  <section
    data-profile-section
    data-layer={layer.code}
    data-layer-state={layer.state}
    {...(layer.state === 'ready' ? {} : { 'data-state': layer.state })}
    aria-labelledby={`profile-layer-${layer.code}`}
  >
    <h2 id={`profile-layer-${layer.code}`}>{layer.code}</h2>
    <p>{layer.state}</p>
    {layer.values.length > 0 ? (
      <ul data-layer-items>
        {layer.values.map((value) => (
          <li key={`${layer.code}-${value}`}>{value}</li>
        ))}
      </ul>
    ) : null}
  </section>
);

const Fact = ({
  item,
}: Readonly<{ item: ProfilePortfolioFactView }>): React.ReactElement => (
  <li data-fact-id={item.id}>
    {item.title ? <strong>{item.title}</strong> : null}
    {item.creditRef ? <span> Credit: {item.creditRef}.</span> : null}
    {item.rightsBasis ? <span> Rights: {item.rightsBasis}.</span> : null}
    {item.rightsState ? <span> Rights state: {item.rightsState}.</span> : null}
    {item.roleCodes.length > 0 ? (
      <span> Roles: {item.roleCodes.join(', ')}.</span>
    ) : null}
    {item.provenanceState ? (
      <span> Provenance: {item.provenanceState}.</span>
    ) : null}
    {item.mediaState ? <span> Media: {item.mediaState}.</span> : null}
    {item.hasCaptions ? <span> Captions available.</span> : null}
    {item.hasTranscript ? <span> Transcript available.</span> : null}
  </li>
);

export const ProfilePortfolioFactsSection = ({
  title,
  items,
  id,
}: Readonly<{
  title: string;
  items: readonly ProfilePortfolioFactView[];
  id: string;
}>): React.ReactElement => (
  <section aria-labelledby={id}>
    <h2 id={id}>{title}</h2>
    {items.length > 0 ? (
      <ul aria-label={title}>
        {items.map((item) => (
          <Fact key={item.id} item={item} />
        ))}
      </ul>
    ) : (
      <p>No rights-bearing items are available.</p>
    )}
  </section>
);

export const ProfilePortfolioCuration = ({
  onRetry,
}: Readonly<{ onRetry: () => void }>): React.ReactElement => (
  <section aria-labelledby="profile-portfolio-curation">
    <h2 id="profile-portfolio-curation">
      Portfolio emphasis and reel curation
    </h2>
    <p>Only rights-eligible clips with provenance can be curated.</p>
    <button type="button" onClick={onRetry}>
      Unlist
    </button>
    <button type="button" onClick={onRetry}>
      Refresh curation
    </button>
    <button type="button" onClick={onRetry}>
      Review changes
    </button>
    <button type="button" onClick={onRetry}>
      Discard
    </button>
  </section>
);
