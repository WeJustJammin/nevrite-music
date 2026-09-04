import * as React from 'react';

export type ProfilesVerificationRouteProps = Readonly<{
  variant: 'appPage' | 'detail' | 'publicProjection';
  actorId: string | null;
  actingPartyId: string | null;
  capabilitySnapshot: readonly string[];
  canonicalUrl: string;
  initialQuery: Readonly<{ tab?: string; selected?: string | null }>;
  requestId: string;
  children?: never;
}>;

const ProfilesVerificationRoute = ({
  variant,
  capabilitySnapshot,
  actorId,
  actingPartyId,
  canonicalUrl,
  initialQuery,
  requestId,
}: ProfilesVerificationRouteProps): React.ReactElement => (
  <div
    data-route="profiles-verification"
    data-route-variant={variant}
    data-server-first="true"
    data-request-id={requestId}
    data-canonical-url={canonicalUrl}
    data-query-tab={initialQuery.tab ?? 'ownership'}
    data-server-actor={actorId === null ? 'absent' : 'present'}
    data-server-acting-context={actingPartyId === null ? 'absent' : 'present'}
  >
    <nav aria-label="Skip navigation">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
    </nav>
    <header aria-label="Application navigation">
      <a href="/">WeJammin</a>
      <nav aria-label="Primary navigation">
        <a href="/app/profiles-verification" aria-current="page">
          Profiles, claiming and qualifications
        </a>
        <a href="/settings/security">Account security</a>
        <a href="/system/degraded">System status</a>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      <header>
        <p>Profiles and party ownership</p>
        <h1 id="page-title" tabIndex={-1}>
          Profiles, claiming and qualifications
        </h1>
        <p>
          Review shadow-party references and complete a bounded claim proof.
        </p>
        <p data-capability-count={capabilitySnapshot.length}>
          {actingPartyId === null
            ? 'No acting context is available; actions remain disabled.'
            : 'Acting context is server-authorized.'}
        </p>
      </header>
      <div id="profile-ownership-slot" />
    </main>
  </div>
);

export default ProfilesVerificationRoute;
