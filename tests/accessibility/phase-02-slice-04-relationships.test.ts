import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import RelationshipsAuthorityGovernanceWorkbench, {
  type RelationshipsAuthorityGovernanceWorkbenchProps,
} from '../../apps/web/src/components/identity-authority/RelationshipsAuthorityGovernanceWorkbench';

const props = {
  contractFields: {
    source: '01c-relationships-authority-governance.md',
    fields: {},
  },
  variant: 'ownerFull',
  initial: {
    status: 'success',
    data: [
      {
        id: 'organization-s04',
        version: '7',
        state: 'active',
        provenance: [
          {
            source: 'canonical',
            evidence: 'organization-read',
            at: '2026-09-01T00:00:00.000Z',
            visibility: 'authorized',
          },
        ],
        projection: { organizationId: 'organization-s04' },
      },
    ],
    version: '7',
    stale: false,
  },
  actorId: 'human-s04',
  actingPartyId: 'person-s04',
  access: 'full',
  query: { tab: 'relationships' },
  selectedId: 'organization-s04',
  expectedVersion: '"7"',
  organizationId: 'organization-s04',
  onCanonicalRefetch: async () => undefined,
} satisfies RelationshipsAuthorityGovernanceWorkbenchProps;

const render = (
  input: RelationshipsAuthorityGovernanceWorkbenchProps = props,
): string =>
  renderToStaticMarkup(
    React.createElement(RelationshipsAuthorityGovernanceWorkbench, input),
  );

describe('Phase 2 Slice 04 relationship accessibility contract', () => {
  it('[P2-S04-AC-148] exposes a named workbench, command region, persistent labels, and native controls', () => {
    const markup = render();

    expect(markup).toContain(
      'data-workbench="relationships-authority-governance"',
    );
    expect(markup).toContain(
      'aria-labelledby="relationships-authority-commands-heading"',
    );
    expect(markup).toMatch(/<form\b/gu);
    expect(markup).toMatch(/<label\b[^>]*for="relationship-/u);
    expect(markup).toMatch(/<(?:input|select)\b[^>]*name="mode"/u);
    expect(markup).toContain('Self-member');
    expect(markup).toContain('Shadow or custodial');
    expect(markup).toContain('External reference');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
  });

  it('[P2-S04-AC-151, AC-154] exposes canonical action previews, JSON intent metadata, and separate target IDs', () => {
    const markup = render();

    expect(markup).toContain(
      'action="/api/v1/organizations/organization-s04/type-assignments/:assignmentId"',
    );
    expect(markup).toContain(
      'action="/api/v1/membership-tenures/:tenureId/accept"',
    );
    expect(markup).toMatch(/data-json-body="true"/gu);
    expect(markup).toMatch(/data-idempotency="required"/gu);
    expect(markup).toMatch(/data-method="DELETE"/u);
    expect(markup).toContain('Expected version for commands');
    expect(markup).not.toContain('organization-s04" organizationId');
  });

  it('[P2-S04-AC-147, AC-150, AC-153] links invalid fields to typed recovery feedback without rendering protected evidence', () => {
    const markup = render({
      ...props,
      initial: {
        status: 'error',
        error: {
          code: 'ORGANIZATION_VERSION_CONFLICT',
          message: 'Review the current organization version.',
          requestId: 'request-s04-conflict',
          details: { currentVersion: '8' },
        },
        retryable: false,
      },
    });

    expect(markup).toContain('Check the highlighted fields.');
    expect(markup).toContain('request-s04-conflict');
    expect(markup).toMatch(/aria-invalid="true"/u);
    expect(markup).toMatch(/aria-describedby="relationship-command-error"/u);
    expect(markup).toContain('Review changes');
    expect(markup).toContain('Current server version');
    expect(markup).not.toContain('protected');
  });
});
