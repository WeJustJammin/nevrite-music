import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import IdentityAuthorityRoute, {
  type IdentityAuthorityRouteProps,
} from '../../apps/web/src/components/identity-authority/IdentityAuthorityRoute';
import { IdentityAuthorityPrimitives } from '../../apps/web/src/components/identity-authority/IdentityAuthorityPrimitives';

const ROUTE_PATH = '/app/identity-authority';

const routeProps = {
  variant: 'appPage',
  actorId: 'human-s03',
  actingPartyId: 'party-s03',
  capabilitySnapshot: ['identity.read'],
  canonicalUrl: `${ROUTE_PATH}?tab=people`,
  initialQuery: { tab: 'people' },
  requestId: 'request-s03-a11y',
} satisfies IdentityAuthorityRouteProps;

const primitiveProps = {
  actionBar: {
    primary: 'Save identity',
    secondary: 'Cancel',
    destructive: 'Remove identity',
    state: 'idle',
    expectedVersion: '"1"',
    operationId: 'operation-s03',
  },
  capabilityGate: {
    variant: 'disabled',
    reasonCode: 'STEP_UP_REQUIRED',
    recoveryHref: ROUTE_PATH,
    disclosure: 'Step-up verification is required.',
  },
  filterBar: {
    schema: 'IdentityAuthorityFilterSchema',
    values: { q: 'Neon' },
    resultCount: 1,
    resetHref: ROUTE_PATH,
    validationError: 'The query needs review.',
    requestId: 'request-s03-a11y',
  },
  dataTable: {
    columns: ['displayName', 'state', 'version'],
    rows: [{ id: 'person-s03', displayName: 'Neon Harbor', state: 'active' }],
    sort: 'displayName',
    selection: ['person-s03'],
    density: 'compact',
  },
  confirmationStep: {
    consequence: 'Remove the role facet from this person',
    affectedScope: 'person-s03',
    expectedVersion: '"1"',
    stepUpState: 'required',
    idempotencyKey: 'idempotency-s03',
  },
} as const;

const renderRoute = (): string =>
  renderToStaticMarkup(React.createElement(IdentityAuthorityRoute, routeProps));

const renderPrimitives = (): string =>
  renderToStaticMarkup(
    React.createElement(IdentityAuthorityPrimitives, primitiveProps),
  );

describe('Phase 2 Slice 03 identity-authority accessibility', () => {
  it('[P2-S03-AC-225] route shell has skip navigation, one named main, focused h1, and current navigation', () => {
    const markup = renderRoute();

    expect(markup).toContain('href="#main-content"');
    expect(markup).toContain('Skip to main content');
    expect(markup).toMatch(/<main\b[^>]*id="main-content"[^>]*tabindex="-1"/u);
    expect(markup).toMatch(/<h1\b[^>]*id="page-title"[^>]*tabindex="-1"/u);
    expect(markup.match(/<main\b/gu)).toHaveLength(1);
    expect(markup.match(/<h1\b/gu)).toHaveLength(1);
    expect(markup).toContain('aria-label="Application navigation"');
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain(ROUTE_PATH);
  });

  it('[P2-S03-AC-226] workbench selection uses named list/detail regions, native controls, and a return target', () => {
    const markup = renderRoute();

    expect(markup).toMatch(
      /aria-labelledby="identity-authority-list-heading"/u,
    );
    expect(markup).toMatch(
      /aria-labelledby="identity-authority-detail-heading"/u,
    );
    expect(markup).toContain('id="identity-authority-list-heading"');
    expect(markup).toContain('id="identity-authority-detail-heading"');
    expect(markup).toMatch(/<(?:a|button)\b[^>]*>/u);
    expect(markup).toContain('aria-selected="true"');
    expect(markup).toContain('Back to identity records');
  });

  it('[P2-S03-AC-227] forms expose persistent labels, first-invalid links, descriptions, and polite validation status', () => {
    const markup = renderPrimitives();

    expect(markup).toMatch(/<form\b/u);
    expect(markup).toMatch(/<label\b[^>]*for="[^"]+"/u);
    expect(markup).toMatch(/aria-invalid="true"/u);
    expect(markup).toMatch(/aria-describedby="[^"]+"/u);
    expect(markup).toMatch(/href="#[^"]*(?:error|invalid)[^"]*"/iu);
    expect(markup).toMatch(/role="(?:status|alert)"/u);
    expect(markup).toContain('aria-live="polite"');
  });

  it('[P2-S03-AC-228] async and conflict feedback is atomic, polite, and keeps a retry action', () => {
    const markup = renderPrimitives();

    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toMatch(/stale|pending|failed|conflict/iu);
    expect(markup).toMatch(/<(?:button|a)\b[^>]*>[^<]*(?:Retry|Review)/iu);
    expect(markup).toMatch(/request(?:\s|-)?id/iu);
  });

  it('[P2-S03-AC-229] filters and tables retain labels, caption, headers, sort, count, and 44px targets', () => {
    const markup = renderPrimitives();

    expect(markup).toContain('IdentityAuthorityFilterSchema');
    expect(markup).toMatch(/>Apply<|>Reset</u);
    expect(markup).toMatch(/<table\b/u);
    expect(markup).toMatch(/<caption\b/u);
    expect(markup).toMatch(/<th\b[^>]*scope="col"/u);
    expect(markup).toMatch(/aria-sort="(?:ascending|descending|none)"/u);
    expect(markup).toMatch(/result|record|count/iu);
    expect(markup).toMatch(/data-responsive="mobile-tablet-desktop"/u);
    expect(markup).toMatch(/min-inline-size:\s*44px/u);
  });

  it('[P2-S03-AC-230] high-risk confirmation names consequence, scope, version, context, step-up, and irreversible action', () => {
    const markup = renderPrimitives();

    expect(markup).toMatch(/role="dialog"/u);
    expect(markup).toMatch(/aria-modal="true"/u);
    expect(markup).toMatch(/aria-labelledby="[^"]+"/u);
    expect(markup).toContain('Remove the role facet from this person');
    expect(markup).toContain('person-s03');
    expect(markup).toContain('&quot;1&quot;');
    expect(markup).toContain('Step-up');
    expect(markup).toContain('operation-s03');
    expect(markup).toMatch(/Cancel|Escape|Discard/iu);
  });

  it('[P2-S03-AC-231] media remains keyboard-operable and reduced-motion safe', () => {
    const route = renderRoute();
    const primitives = renderPrimitives();
    const markup = `${route}${primitives}`;

    expect(markup).not.toMatch(/waveform[^<]*(?:only|sole)/iu);
    expect(markup).toMatch(/(?:caption|transcript|metadata)/iu);
    if (/(?:audio|video|waveform)/iu.test(markup)) {
      expect(markup).toMatch(/(?:pause|stop)/iu);
    }
    expect(markup).toMatch(/data-reduced-motion="(?:supported|safe)"/iu);
    expect(markup).toMatch(/prefers-reduced-motion/iu);
    expect(markup).not.toMatch(/essential[^<]*timed/iu);
  });
});
