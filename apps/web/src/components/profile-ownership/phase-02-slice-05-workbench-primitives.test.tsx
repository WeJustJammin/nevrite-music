import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ShadowClaimOwnershipWorkbench, {
  type ShadowClaimOwnershipWorkbenchProps,
} from './ShadowClaimOwnershipWorkbench';

const ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const REQUEST_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dc';
const record = {
  id: ID,
  version: '7',
  state: 'proving',
  provenance: [
    {
      source: 'profile-ownership',
      evidence: 'server-authorized',
      at: '2026-09-01T00:00:00.000Z',
      visibility: 'authorized',
    },
  ],
  projection: { targetPartyId: ID, controlLevel: 'none' },
} as const;
const base = {
  contractFields: {
    source: '02a-shadow-claim-ownership.md',
    fields: { claim: ['id', 'state', 'version'] },
  },
  variant: 'ownerFull',
  initial: { status: 'success', data: [record], version: '7', stale: false },
  actorId: ID,
  actingPartyId: ID,
  access: 'full',
  query: { tab: 'ownership', selected: ID },
  selectedId: ID,
  expectedVersion: '"7"',
} satisfies ShadowClaimOwnershipWorkbenchProps;

const render = (
  overrides: Partial<ShadowClaimOwnershipWorkbenchProps> = {},
): string =>
  renderToStaticMarkup(
    React.createElement(ShadowClaimOwnershipWorkbench, {
      ...base,
      ...overrides,
    }),
  );

describe('P2-S05 profile ownership workbench primitives', () => {
  it('[P2-S05-AC-150] commits labelled filter and sort values through the URL with count and reset recovery', () => {
    const markup = render();
    expect(markup).toContain('data-filter-bar="true"');
    expect(markup).toContain('Filter ownership records');
    expect(markup).toContain('Sort ownership records');
    expect(markup).toContain('Apply filters');
    expect(markup).toContain('Reset filters');
    expect(markup).toContain('1 ownership records');
    expect(markup).toContain('role="status"');
  });

  it('[P2-S05-AC-151] renders stable selected rows as a semantic table and a bounded mobile priority list', () => {
    const markup = render();
    expect(markup).toContain('data-ownership-table="true"');
    expect(markup).toContain('<caption>Shadow ownership records</caption>');
    expect(markup).toMatch(/<th scope="col" aria-sort="ascending">/u);
    expect(markup).toContain('<tr aria-selected="true">');
    expect(markup).toContain('data-ownership-priority-list="true"');
    expect(markup).toContain('aria-current="page"');
  });

  it('[P2-S05-AC-153] preserves refused intent in canonical offline and version-conflict recovery without automatic overwrite', () => {
    const degraded = render({
      initial: {
        status: 'degraded',
        data: [record],
        version: '7',
        stale: true,
        error: {
          code: 'DEPENDENCY_UNAVAILABLE',
          message: 'Temporarily unavailable.',
          requestId: REQUEST_ID,
        },
      },
    });
    expect(degraded).toContain('Working offline');
    expect(degraded).toContain(REQUEST_ID);
    expect(degraded).toContain('Retry canonical read');

    const conflict = render({
      initial: {
        status: 'error',
        data: [record],
        version: '7',
        error: {
          code: 'VERSION_MISMATCH',
          message: 'Review current server version.',
          requestId: REQUEST_ID,
        },
      },
    });
    expect(conflict).toContain('Review current version');
    expect(conflict).toContain('Reapply retained draft');
    expect(conflict).toContain('Discard draft');
    expect(conflict).not.toMatch(
      /automatic(?:ally)? overwrite|last-write-wins/iu,
    );
  });
});
