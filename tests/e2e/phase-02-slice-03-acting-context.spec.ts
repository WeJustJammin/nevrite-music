import { expect, test, type Page } from '@playwright/test';

const SELF_CONTEXT_ID = '11111111-1111-4111-8111-111111111111';
const SELF_PARTY_ID = '22222222-2222-4222-8222-222222222222';
const ALIAS_CONTEXT_ID = '33333333-3333-4333-8333-333333333333';
const ALIAS_PARTY_ID = '44444444-4444-4444-8444-444444444444';
const RELATIONSHIP_ID = '55555555-5555-4555-8555-555555555555';
const ACTING_CONTEXT_INVALIDATION_CHANNEL = 'wejammin:identity-invalidation';
const AUTHORITY_FRESH_UNTIL = '2026-09-01T12:00:00.000Z';

const contexts = [
  {
    contextId: SELF_CONTEXT_ID,
    partyId: SELF_PARTY_ID,
    kind: 'person',
    label: 'My profile',
    avatarRef: null,
    selectable: true,
    authorityFreshUntil: AUTHORITY_FRESH_UNTIL,
  },
  {
    contextId: ALIAS_CONTEXT_ID,
    partyId: ALIAS_PARTY_ID,
    kind: 'alias',
    label: 'Neon Harbor',
    avatarRef: null,
    selectable: true,
    authorityFreshUntil: AUTHORITY_FRESH_UNTIL,
  },
] as const;

type MountOptions = Readonly<{
  initialContextId?: string;
  suggestedContextId?: string | null;
}>;

const mountActingContextSwitcher = async (
  page: Page,
  options: MountOptions = {},
): Promise<void> => {
  const initialContextId = options.initialContextId ?? SELF_CONTEXT_ID;
  const suggestedContextId = options.suggestedContextId ?? null;

  await page.goto(
    `/system/degraded?context=${encodeURIComponent(suggestedContextId ?? '')}`,
    { waitUntil: 'domcontentloaded' },
  );
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>Acting context fixture</title></head><body><main id="acting-context-fixture"><div id="acting-context-root"></div></main></body></html>',
  );
  await page.evaluate(
    async ({
      contexts: initialItems,
      initialContextId: selectedContextId,
      suggestedContextId: linkSuggestion,
    }) => {
      const ReactModule = await import('/node_modules/.vite/deps/react.js');
      const React = ReactModule.default ?? ReactModule;
      const ReactDomModule =
        await import('/node_modules/.vite/deps/react-dom_client.js');
      const createRoot =
        ReactDomModule.createRoot ?? ReactDomModule.default?.createRoot;
      if (typeof createRoot !== 'function')
        throw new Error('React DOM createRoot is unavailable');

      const componentModule =
        await import('/src/components/identity-authority/ActingContextSwitcher.tsx');
      const ActingContextSwitcher =
        componentModule.ActingContextSwitcher ?? componentModule.default;
      if (typeof ActingContextSwitcher !== 'function')
        throw new Error('ActingContextSwitcher is unavailable');

      const state = globalThis as unknown as Record<string, unknown>;
      state.__wejamminActingContextBindingCount = 0;
      state.__wejamminActingContextRefetchCount = 0;
      state.__wejamminActingContextRevoked = false;

      const canonicalResource = () => ({
        projectionVersion: '2',
        items: state.__wejamminActingContextRevoked
          ? initialItems.filter(
              (item) =>
                item.contextId === '11111111-1111-4111-8111-111111111111',
            )
          : initialItems,
        nextCursor: null,
        hasMore: false,
      });
      const onCanonicalRefetch = async () => {
        state.__wejamminActingContextRefetchCount =
          Number(state.__wejamminActingContextRefetchCount ?? 0) + 1;
        return canonicalResource();
      };
      const onBindContext = async (contextId: string) => {
        state.__wejamminActingContextBindingCount =
          Number(state.__wejamminActingContextBindingCount ?? 0) + 1;
        return {
          bindingId: '66666666-6666-4666-8666-666666666666',
          selectedPartyId:
            initialItems.find((item) => item.contextId === contextId)
              ?.partyId ?? '22222222-2222-4222-8222-222222222222',
          expiresAt: '2026-09-01T12:00:00.000Z',
          projectionVersion: '2',
          version: '2',
        };
      };
      const rootElement = document.querySelector('#acting-context-root');
      if (!(rootElement instanceof HTMLElement))
        throw new Error('Acting context fixture root is unavailable');

      createRoot(rootElement).render(
        React.createElement(ActingContextSwitcher, {
          contexts: initialItems,
          items: initialItems,
          initial: {
            projectionVersion: '2',
            items: initialItems,
            nextCursor: null,
            hasMore: false,
          },
          selectedContextId,
          selectedPartyId:
            initialItems.find((item) => item.contextId === selectedContextId)
              ?.partyId ?? selectedContextId,
          suggestedContextId: linkSuggestion,
          onBindContext,
          onCanonicalRefetch,
          invalidationChannel: 'wejammin:identity-invalidation',
        }),
      );
    },
    { contexts, initialContextId, suggestedContextId },
  );
  await expect(
    page.locator('[data-testid="acting-context-indicator"]'),
  ).toBeVisible();
};

test.describe('Phase 2 Slice 03 acting context', () => {
  test('P2-S03-AC-001 deep-link context is a suggestion, never authority', async ({
    page,
  }) => {
    await mountActingContextSwitcher(page, {
      suggestedContextId: ALIAS_CONTEXT_ID,
    });

    await expect(
      page.locator('[data-testid="acting-context-indicator"]'),
    ).toHaveAttribute('data-context-id', SELF_CONTEXT_ID);
    await expect(
      page.locator('[data-testid="acting-context-suggestion"]'),
    ).toHaveAttribute('data-context-id', ALIAS_CONTEXT_ID);
    await expect(
      page.getByText('Suggested by this link', { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (globalThis as unknown as Record<string, unknown>)
            .__wejamminActingContextBindingCount,
      ),
    ).toBe(0);
  });

  test('P2-S03-AC-002 revocation broadcasts invalidation and refetches to self', async ({
    context,
  }) => {
    const firstTab = await context.newPage();
    const secondTab = await context.newPage();
    await Promise.all([
      mountActingContextSwitcher(firstTab, {
        initialContextId: ALIAS_CONTEXT_ID,
      }),
      mountActingContextSwitcher(secondTab, {
        initialContextId: ALIAS_CONTEXT_ID,
      }),
    ]);

    await firstTab.evaluate(() => {
      (
        globalThis as unknown as Record<string, unknown>
      ).__wejamminActingContextRevoked = true;
    });
    await secondTab.evaluate(
      ({ channelName, personId, partyId, relationshipId }) => {
        const state = globalThis as unknown as Record<string, unknown>;
        state.__wejamminActingContextRevoked = true;
        const channel = new BroadcastChannel(channelName);
        channel.postMessage({
          kind: 'invalidate',
          eventType: 'identity.acting-context.revoked.v1',
          personId,
          partyId,
          relationshipId,
        });
        channel.close();
      },
      {
        channelName: ACTING_CONTEXT_INVALIDATION_CHANNEL,
        personId: SELF_CONTEXT_ID,
        partyId: ALIAS_PARTY_ID,
        relationshipId: RELATIONSHIP_ID,
      },
    );

    await expect
      .poll(() =>
        firstTab.evaluate(() =>
          Number(
            (globalThis as unknown as Record<string, unknown>)
              .__wejamminActingContextRefetchCount,
          ),
        ),
      )
      .toBeGreaterThan(0);
    await expect(
      firstTab.locator('[data-testid="acting-context-indicator"]'),
    ).toHaveAttribute('data-context-id', SELF_CONTEXT_ID);
    await expect(
      firstTab.locator('[data-testid="acting-context-revoked"]'),
    ).toContainText('Switched to My profile');

    await firstTab.close();
    await secondTab.close();
  });
});
