import type { DomainVariant } from '../../../../../packages/ui/src/infrastructure/presentation-types';

export interface IdentityAuthorityRouteProps {
  readonly children?: never;
  readonly variant: DomainVariant;
  readonly actorId: string | null;
  readonly actingPartyId: string | null;
  readonly capabilitySnapshot: readonly string[];
  readonly canonicalUrl: string;
  readonly initialQuery: Readonly<Record<string, string>>;
  readonly requestId: string;
}

const tabs = [
  ['people', 'People'],
  ['auth', 'Authentication'],
  ['aliases', 'Aliases'],
  ['relationships', 'Relationships'],
  ['identifiers', 'Identifiers'],
] as const;

const safeTab = (value: string | undefined): string =>
  tabs.some(([tab]) => tab === value) ? (value ?? 'people') : 'people';

export function IdentityAuthorityRoute({
  variant,
  actorId,
  actingPartyId,
  capabilitySnapshot,
  canonicalUrl,
  initialQuery,
  requestId,
}: IdentityAuthorityRouteProps) {
  const selectedTab = safeTab(initialQuery.tab);
  return (
    <>
      <nav aria-label="Skip navigation">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
      </nav>
      <header aria-label="Application navigation">
        <nav aria-label="Primary navigation">
          <a href="/app/identity-authority" aria-current="page">
            Identity authority
          </a>
          <ul>
            {tabs.map(([tab, label]) => (
              <li key={tab}>
                <a
                  href={`/app/identity-authority?tab=${tab}`}
                  aria-current={selectedTab === tab ? 'page' : undefined}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="identity-authority-route"
        data-variant={variant}
        data-canonical-url={canonicalUrl}
      >
        <header>
          <p className="identity-eyebrow">WeJammin identity authority</p>
          <h1 id="page-title" tabIndex={-1}>
            Identity authority
          </h1>
          <p>
            Current server-authorized identity, alias, relationship, and
            identifier records.
          </p>
          <dl>
            <div>
              <dt>Actor</dt>
              <dd>{actorId ?? 'Not signed in'}</dd>
            </div>
            <div>
              <dt>Acting party</dt>
              <dd>{actingPartyId ?? 'No acting context'}</dd>
            </div>
            <div>
              <dt>Route variant</dt>
              <dd>
                <code>{variant}</code>
              </dd>
            </div>
            <div>
              <dt>canonicalUrl</dt>
              <dd>
                <code>{canonicalUrl}</code>
              </dd>
            </div>
          </dl>
        </header>
        <section aria-labelledby="identity-authority-context-heading">
          <h2 id="identity-authority-context-heading">Acting context</h2>
          <p>
            The server selected the acting context for this tab. URL state can
            refine a view but never grants authority.
          </p>
          <p>Verified capabilities: {capabilitySnapshot.length}.</p>
        </section>
        <section aria-labelledby="identity-authority-list-heading">
          <h2 id="identity-authority-list-heading">Identity records</h2>
          <a
            href={`${canonicalUrl}#identity-authority-detail-heading`}
            aria-selected="true"
          >
            Review selected identity
          </a>
        </section>
        <section aria-labelledby="identity-authority-detail-heading">
          <a href={canonicalUrl}>Back to identity records</a>
          <h2 id="identity-authority-detail-heading">Selected identity</h2>
          <p>Server-authorized detail is loaded from the canonical route.</p>
        </section>
        <section
          aria-label="Identity media alternatives"
          data-reduced-motion="supported"
        >
          <p>
            Metadata and transcript alternatives accompany any media preview.
          </p>
          <style>
            {
              '@media (prefers-reduced-motion: reduce) { .identity-authority-route { scroll-behavior: auto; } }'
            }
          </style>
        </section>
        <p className="identity-request-id" role="status" aria-live="polite">
          Request ID: <code>{requestId}</code>. Canonical route:{' '}
          <code>{canonicalUrl}</code>.
        </p>
      </main>
    </>
  );
}

export default IdentityAuthorityRoute;
