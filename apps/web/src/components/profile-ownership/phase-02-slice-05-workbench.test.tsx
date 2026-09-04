import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.node';
import { describe, expect, it } from 'vitest';

import ShadowClaimOwnershipWorkbench, {
  type ShadowClaimOwnershipWorkbenchProps,
} from './ShadowClaimOwnershipWorkbench';

const RECORD_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';

const props = {
  contractFields: {
    source: '02a-shadow-claim-ownership.md',
    fields: {
      shadow: ['id', 'partyId', 'state', 'version'],
      claim: ['id', 'state', 'targetPartyId', 'controlLevel', 'version'],
      invitation: ['id', 'state', 'attemptNo', 'version'],
    },
  },
  variant: 'ownerFull',
  initial: {
    status: 'success',
    data: [
      {
        id: RECORD_ID,
        version: '7',
        state: 'invited',
        provenance: [
          {
            source: 'canonical',
            evidence: 'shadow-reference',
            at: '2026-09-01T00:00:00.000Z',
            visibility: 'authorized',
          },
        ],
        projection: { partyId: RECORD_ID, sourceDomain: 'credits' },
      },
    ],
    version: '7',
    stale: false,
  },
  actorId: 'human-s05',
  actingPartyId: 'party-s05',
  access: 'full',
  query: { tab: 'ownership', selected: RECORD_ID },
  selectedId: RECORD_ID,
  expectedVersion: '"7"',
  onCanonicalRefetch: async () => undefined,
} satisfies ShadowClaimOwnershipWorkbenchProps;

const render = (input: ShadowClaimOwnershipWorkbenchProps = props): string =>
  renderToStaticMarkup(
    React.createElement(ShadowClaimOwnershipWorkbench, input),
  );

describe('P2-S05 Slice 05 shadow claim ownership workbench', () => {
  it('[P2-S05-AC-202, P2-S05-AC-209] renders the bounded island contract without accepting arbitrary children', () => {
    const markup = render();
    expect(markup).toContain('data-workbench="shadow-claim-ownership"');
    expect(markup).toContain('data-variant="ownerFull"');
    expect(markup).toContain(
      'data-contract-source="02a-shadow-claim-ownership.md"',
    );
    expect(markup).toContain('data-selection-url=');
    expect(markup).toContain(
      'aria-labelledby="shadow-claim-ownership-list-heading"',
    );
    expect(markup).toContain(
      'aria-labelledby="shadow-claim-ownership-detail-heading"',
    );
  });

  it('[P2-S05-AC-107..127, P2-S05-AC-218..220] renders only active PRF-API-01..08 controls as native, named, JSON-bound forms', () => {
    const markup = render();
    for (const operation of [
      'PRF-API-01',
      'PRF-API-02',
      'PRF-API-03',
      'PRF-API-04',
      'PRF-API-06',
      'PRF-API-07',
      'PRF-API-08',
    ]) {
      expect(markup).toContain(`data-operation="${operation}"`);
    }
    expect(markup).toMatch(/<form\b/u);
    expect(markup).toMatch(/<label\b[^>]*for="[^"]+"/u);
    expect(markup).toContain('data-json-body="true"');
    expect(markup).toContain('data-csrf="required"');
    expect(markup).toContain('data-idempotency="required"');
    expect(markup).toContain('data-if-match="required"');
    expect(markup).not.toContain('email');
    expect(markup).not.toContain('providerToken');
  });

  it('[P2-S05-AC-128..145, P2-S05-AC-208..216] keeps deferred contest and transfer operations typed but disabled', () => {
    const markup = render();
    for (const operation of [
      'PRF-API-09',
      'PRF-API-10',
      'PRF-API-11',
      'PRF-API-12',
      'PRF-API-13',
      'PRF-API-14',
      'PRF-API-15',
      'PRF-API-16',
    ]) {
      expect(markup).toContain(`data-operation="${operation}"`);
      expect(markup).not.toMatch(
        new RegExp(`<form\\b[^>]*data-operation="${operation}"`, 'u'),
      );
    }
    expect(markup).toContain('data-deferred="true"');
    expect(markup).toContain('data-capability-state="disabled"');
  });
});
