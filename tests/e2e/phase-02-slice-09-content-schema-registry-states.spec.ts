import { expect, test } from '@playwright/test';

import {
  APP_ROUTE,
  REQUEST_ID,
  TYPE_ID,
  VERSION_ID,
  authenticate,
  expectNoHorizontalOverflow,
  renderWorkbench,
  setRegistryFixture,
} from './phase-02-slice-09-content-schema-registry.fixture';

test.describe('Phase 2 Slice 09 content schema registry recovery and persistence states', () => {
  test('[P2-S09-AC-241, P2-S09-AC-253, P2-S09-AC-254] exposes safe 429 and outage recovery states while preserving no sensitive browser storage', async ({
    context,
    page,
  }) => {
    await setRegistryFixture(
      page,
      renderWorkbench({
        initialList: {
          status: 'error',
          error: {
            code: 'RATE_LIMITED',
            message: 'provider detail must never reach the browser',
            requestId: REQUEST_ID,
          },
          retryable: true,
        },
        initialDetail: {
          status: 'degraded',
          data: null,
          code: 'DEPENDENCY_UNAVAILABLE',
          requestId: REQUEST_ID,
          lastVerifiedAt: null,
        },
      }),
    );
    await expect(page.getByRole('alert')).toContainText(
      'Too many registry requests. Try again shortly.',
    );
    await expect(page.getByRole('alert')).toContainText('Retry');
    await expect(page.getByRole('status').last()).toContainText(
      'The registry is temporarily unavailable.',
    );
    await expect(page.locator('body')).not.toContainText(
      'provider detail must never reach the browser',
    );
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
      })),
    ).toEqual({ local: 0, session: 0 });

    await context.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await context.setOffline(false);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
    await expectNoHorizontalOverflow(page);
  });

  test('[P2-S09-AC-241, P2-S09-AC-258, P2-S09-AC-259, P2-S09-AC-260] keeps multi-tab invalidation metadata-only and excludes canonical/private state from client persistence', async ({
    context,
    page,
  }) => {
    await setRegistryFixture(page);
    const second = await context.newPage();
    await setRegistryFixture(second);

    const forbidden = [
      'ownerId',
      'releaseKeyId',
      'releaseRawBodyHash',
      'releaseSignatureHash',
      'releaseNonceHash',
      'releaseVerifiedAt',
      'propsSchemaSnapshot',
      'WEBHOOK_REJECTED',
      'rawBody',
      'signature',
    ];
    for (const tab of [page, second]) {
      const html = await tab.content();
      await expect(
        tab.locator('[data-invalidation="canonical-refetch-only"]'),
      ).toHaveCount(1);
      for (const value of forbidden) expect(html).not.toContain(value);
      expect(
        await tab.evaluate(() => ({
          local: localStorage.length,
          session: sessionStorage.length,
          channels: 'BroadcastChannel' in window,
        })),
      ).toMatchObject({ local: 0, session: 0 });
    }

    await second.close();
  });

  test('[P2-S09-AC-251, P2-S09-AC-266] honors reduced motion and keeps all statuses textual', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setRegistryFixture(page);
    const motion = await page
      .locator('.content-schema-registry')
      .evaluate((element) => {
        const child = element.querySelector('*');
        return child === null
          ? null
          : window.getComputedStyle(child).transitionDuration;
      });
    expect(Number.parseFloat(motion ?? '1')).toBeLessThanOrEqual(0.00001);
    for (const status of await page.getByRole('status').all()) {
      await expect(status).toContainText(/\S/u);
    }
    const colorOnly = await page.locator('[class*="status"]').evaluateAll(
      (elements) =>
        elements.filter((element) => {
          const text = element.textContent?.trim() ?? '';
          return (
            text.length === 0 &&
            window.getComputedStyle(element).borderInlineStartColor !==
              'rgba(0, 0, 0, 0)'
          );
        }).length,
    );
    expect(colorOnly).toBe(0);
  });
});

test('[P2-S09-AC-242, P2-S09-AC-255, P2-S09-AC-256] expires a protected browser session without leaking the requested registry state', async ({
  context,
  page,
}) => {
  await authenticate(context);
  await page.goto(APP_ROUTE, { waitUntil: 'domcontentloaded' });
  await context.clearCookies();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/auth\/sign-in\?returnTo=/u);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
  await expect(page.locator('body')).not.toContainText(
    'Content schema registry',
  );
  await expect(page.locator('body')).not.toContainText(TYPE_ID);
  await expect(page.locator('body')).not.toContainText(VERSION_ID);
});
