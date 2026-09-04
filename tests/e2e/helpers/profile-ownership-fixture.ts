import type { Page } from '@playwright/test';

export const ROUTE = '/app/profiles-verification';
export const OPAQUE_RECORD_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
export const OPAQUE_PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';

export const viewports = [
  {
    criterion: 'P2-S05-AC-198',
    name: 'mobile',
    width: 320,
    height: 800,
    columns: '4',
    composition: 'stacked',
  },
  {
    criterion: 'P2-S05-AC-199',
    name: 'tablet',
    width: 900,
    height: 900,
    columns: '8',
    composition: 'collapsible-sidebar',
  },
  {
    criterion: 'P2-S05-AC-200',
    name: 'desktop',
    width: 1280,
    height: 900,
    columns: '12',
    composition: 'list-detail-action-rail',
  },
] as const;

export const openOwnership = async (
  page: Page,
  width = 1280,
  height = 900,
): Promise<void> => {
  await page.setViewportSize({ width, height });
  await page.goto('/system/degraded', { waitUntil: 'domcontentloaded' });
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Profile ownership fixture</title></head><body><a href="#main-content">Skip to main content</a><main id="main-content" tabindex="-1"><h1>Profiles, claiming and qualifications</h1><div data-server-first="true" data-request-id="request-s05"><div id="profile-ownership-root"></div></div></main></body></html>`,
  );
  await page.evaluate(
    async ({ recordId, partyId }) => {
      const ReactModule = await import('/node_modules/.vite/deps/react.js');
      const React = ReactModule.default ?? ReactModule;
      const ReactDomModule =
        await import('/node_modules/.vite/deps/react-dom_client.js');
      const createRoot =
        ReactDomModule.createRoot ?? ReactDomModule.default?.createRoot;
      if (typeof createRoot !== 'function')
        throw new Error('React DOM createRoot is unavailable');
      const componentModule =
        await import('/src/components/profile-ownership/ShadowClaimOwnershipWorkbench.tsx');
      const Workbench = componentModule.default;
      if (typeof Workbench !== 'function')
        throw new Error('Profile ownership workbench is unavailable');
      const root = document.querySelector('#profile-ownership-root');
      if (!(root instanceof HTMLElement))
        throw new Error('Profile ownership fixture root is unavailable');

      createRoot(root).render(
        React.createElement(Workbench, {
          contractFields: {
            source: '02a-shadow-claim-ownership.md',
            fields: {
              claim: [
                'id',
                'state',
                'targetPartyId',
                'controlLevel',
                'version',
              ],
            },
          },
          variant: 'ownerFull',
          initial: {
            status: 'success',
            data: [
              {
                id: recordId,
                version: '7',
                state: 'proving',
                provenance: [
                  {
                    source: 'profile-ownership',
                    evidence: 'server-authorized-claim',
                    at: '2026-09-01T00:00:00.000Z',
                    visibility: 'authorized',
                  },
                ],
                projection: {
                  targetPartyId: partyId,
                  controlLevel: 'none',
                  sourceDomain: 'credits',
                  sourceEntityId: 'credit-entity-17',
                },
              },
            ],
            version: '7',
            stale: false,
          },
          actorId: partyId,
          actingPartyId: partyId,
          access: 'full',
          query: { tab: 'ownership', selected: recordId },
          selectedId: recordId,
          expectedVersion: '"7"',
          csrfToken: 'csrf-s05',
          onCanonicalRefetch: () => undefined,
        }),
      );
    },
    { recordId: OPAQUE_RECORD_ID, partyId: OPAQUE_PARTY_ID },
  );
  await page
    .locator('[data-workbench="shadow-claim-ownership"]')
    .waitFor({ state: 'visible' });
};
