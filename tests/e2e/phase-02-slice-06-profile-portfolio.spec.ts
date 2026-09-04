import { expect, test, type Page } from '@playwright/test';

const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const PUBLIC_PATH = `/profiles/${PARTY_ID}`;
const APP_PATH = `/app/profiles-verification?party=${PARTY_ID}`;

const seedProtectedSession = async (page: Page) => {
  await page.context().addCookies([
    {
      name: 'wj_session_ref',
      value: 'slice06-session',
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      secure: false,
    },
    {
      name: 'wj_csrf',
      value: 'slice06-csrf',
      domain: '127.0.0.1',
      path: '/',
      secure: false,
    },
  ]);
};

test.describe('P2-S06 public profile and credit-backed portfolio discovery', () => {
  test('[P2-S06-AC-001..002, P2-S06-AC-111..113] composes the public projection in fixed layers with no private leakage', async ({
    page,
  }) => {
    await page.goto(PUBLIC_PATH);
    await expect(page.locator('main')).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('heading', {
        level: 1,
        name: 'Ada Example',
      }),
    ).toBeVisible();
    await expect(page.locator('[data-layer="header"]')).toBeVisible();
    await expect(page.locator('[data-layer="now"]')).toBeVisible();
    await expect(page.locator('[data-layer="record"]')).toBeVisible();
    await expect(page.locator('[data-layer="detail"]')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(
      'PRIVATE LEGAL IDENTITY',
    );
    await expect(page.locator('body')).not.toContainText(
      'PRIVATE TRADER ADDRESS',
    );
    await expect(page.locator('body')).not.toContainText('PRIVATE ALIAS');
    await expect(page.locator('body')).not.toContainText('Generate EPK');
    await expect(page.locator('body')).not.toContainText('Share EPK');
  });

  test('[P2-S06-AC-003..008, P2-S06-AC-027..038] distinguishes loading, denied, unavailable, empty, and success sections', async ({
    page,
  }) => {
    await page.goto(PUBLIC_PATH);
    const sections = page.locator('[data-profile-section]');
    await expect(sections).toHaveCount(4);
    await expect(page.locator('[data-state="success"]')).toHaveCount(1);
    await expect(page.locator('[data-state="empty"]')).toHaveCount(1);
    await expect(
      page.locator('[data-state="denied"], [data-state="unavailable"]'),
    ).toHaveCount(0);
    await page.goto(`${PUBLIC_PATH}?source=denied`);
    await expect(page.locator('[data-state="denied"]')).toBeVisible();
    await expect(page.locator('[data-state="empty"]')).not.toContainText(
      'denied',
    );
  });

  test('[P2-S06-AC-009..014, P2-S06-AC-039..044, P2-S06-AC-080..110] keeps deferred EPK/share controls unmounted across public and app surfaces', async ({
    page,
  }) => {
    await page.goto(PUBLIC_PATH);
    await expect(page.locator('[data-operation^="PRF-EPK-"]')).toHaveCount(0);
    await expect(page.locator('[href*="/epk/"]')).toHaveCount(0);
    await seedProtectedSession(page);
    await page.goto(APP_PATH);
    await expect(page.locator('[data-operation^="PRF-EPK-"]')).toHaveCount(0);
    await expect(page.locator('input[name="shareToken"]')).toHaveCount(0);
  });

  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 900, height: 900 },
    { name: 'desktop', width: 1440, height: 1000 },
  ]) {
    test(`[P2-S06-AC-080..088, P2-S06-AC-111..113] preserves ${viewport.name} reading and action order`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto(PUBLIC_PATH);
      const workbench = page.locator(
        '[data-workbench="profile-portfolio-epk"]',
      );
      await expect(workbench).toHaveAttribute('data-breakpoint', viewport.name);
      await expect(workbench).toHaveAttribute(
        'data-no-horizontal-scroll',
        'true',
      );
      if (viewport.name === 'mobile') {
        await expect(workbench).toHaveAttribute('data-composition', 'stacked');
        await expect(page.getByRole('link', { name: /back/i })).toBeVisible();
      }
      if (viewport.name === 'tablet')
        await expect(workbench).toHaveAttribute(
          'data-composition',
          'inspector',
        );
      if (viewport.name === 'desktop')
        await expect(workbench).toHaveAttribute(
          'data-composition',
          'list-detail-action-rail',
        );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width);
    });
  }

  test('[P2-S06-AC-015..026, P2-S06-AC-039..079, P2-S06-AC-114..119] exposes owner editing and reel curation as native forms with server version context', async ({
    page,
  }) => {
    await seedProtectedSession(page);
    await page.goto(APP_PATH);
    await expect(
      page.locator('[data-workbench="profile-portfolio-epk"]'),
    ).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
    await expect(
      page.locator(
        'input[name="expectedVersion"], input[name="expected-version"]',
      ),
    ).toHaveValue('7');
    await expect(
      page.locator(
        'input[name="idempotencyKey"], input[name="idempotency-key"]',
      ),
    ).toHaveValue(/.+/u);
    await expect(
      page.getByRole('button', { name: /save|unlist|emphasis/i }).first(),
    ).toBeVisible();
    await expect(page.locator('[data-actor-id]')).toHaveAttribute(
      'data-actor-id',
      PARTY_ID,
    );
    await expect(page.locator('[data-acting-party-id]')).toHaveAttribute(
      'data-acting-party-id',
      PARTY_ID,
    );
  });

  test('[P2-S06-AC-016, P2-S06-AC-022, P2-S06-AC-028, P2-S06-AC-034, P2-S06-AC-040, P2-S06-AC-046, P2-S06-AC-103..110] retains invalid form input and focuses linked field errors', async ({
    page,
  }) => {
    await seedProtectedSession(page);
    await page.goto(APP_PATH);
    const form = page.locator('form').first();
    await form.locator('input, textarea').first().fill('<invalid>');
    await form.getByRole('button', { name: /save|submit|publish/i }).click();
    await expect(
      page.locator('[role="alert"], [data-form-error]'),
    ).toContainText(/check|invalid|review/i);
    await expect(
      form.locator('input[aria-invalid="true"], textarea[aria-invalid="true"]'),
    ).toHaveCount(1);
    await expect(page.locator('[aria-live="polite"]')).toContainText(
      /check|invalid/i,
    );
  });

  test('[P2-S06-AC-006, P2-S06-AC-012, P2-S06-AC-018, P2-S06-AC-024, P2-S06-AC-030, P2-S06-AC-036, P2-S06-AC-042, P2-S06-AC-048, P2-S06-AC-054, P2-S06-AC-060, P2-S06-AC-066, P2-S06-AC-072, P2-S06-AC-078] prevents duplicate mutation activation and reconciles a version conflict', async ({
    page,
  }) => {
    await seedProtectedSession(page);
    await page.goto(APP_PATH);
    const form = page.locator('form').first();
    const submit = form.getByRole('button', { name: /save|publish|unlist/i });
    await expect(submit).toHaveCount(1);
    await submit.dblclick();
    await expect(submit).toHaveAttribute('aria-busy', 'true');
    await expect(
      page.locator('[data-sync-conflict], [role="alert"]'),
    ).toContainText(/version|review|current/i);
    await expect(
      page.getByRole('button', { name: /review changes/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /discard/i })).toBeVisible();
    await expect(form).toContainText(/7|current version/i);
  });

  test('[P2-S06-AC-007, P2-S06-AC-013, P2-S06-AC-019, P2-S06-AC-025, P2-S06-AC-031, P2-S06-AC-037, P2-S06-AC-043, P2-S06-AC-049, P2-S06-AC-055, P2-S06-AC-061, P2-S06-AC-067, P2-S06-AC-073, P2-S06-AC-079, P2-S06-AC-103..110] maps outage, rate, and timeout failures to request-id recovery', async ({
    page,
  }) => {
    await seedProtectedSession(page);
    await page.goto(APP_PATH);
    await page.route('**/api/v1/profiles/**', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'DEPENDENCY_UNAVAILABLE',
          message: 'Current profile data is temporarily unavailable.',
          requestId: 'slice06-outage',
        }),
      }),
    );
    await page.reload();
    await expect(
      page.locator('[data-state="degraded"], [data-system="degraded"]'),
    ).toContainText(/temporarily unavailable|slice06-outage/i);
    await expect(
      page.getByRole('button', { name: /retry|status/i }),
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText('providerSecret');
  });

  test('[P2-S06-AC-004, P2-S06-AC-010, P2-S06-AC-016, P2-S06-AC-028, P2-S06-AC-034, P2-S06-AC-040, P2-S06-AC-046, P2-S06-AC-103..110] honors a 429 wait without clearing the draft', async ({
    page,
  }) => {
    await seedProtectedSession(page);
    await page.goto(APP_PATH);
    const form = page.locator('form').first();
    const field = form.locator('input, textarea').first();
    await field.fill('draft survives rate wait');
    await page.route('**/api/v1/profiles/**', (route) =>
      route.fulfill({
        status: 429,
        headers: { 'retry-after': '12' },
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'RATE_LIMITED',
          message: 'Try again later.',
          requestId: 'slice06-rate',
        }),
      }),
    );
    await form.getByRole('button', { name: /save|publish|unlist/i }).click();
    await expect(
      page.locator('[data-rate-wait], [role="status"]'),
    ).toContainText(/12|try again/i);
    await expect(field).toHaveValue('draft survives rate wait');
  });

  test('[P2-S06-AC-080..088, P2-S06-AC-111..113] keeps focus and URL selection stable through keyboard filtering and browser back', async ({
    page,
  }) => {
    await page.goto(PUBLIC_PATH);
    const filter = page
      .getByRole('searchbox')
      .or(page.getByRole('combobox'))
      .first();
    await filter.fill('producer');
    await page.getByRole('button', { name: /apply|filter/i }).click();
    await expect(page).toHaveURL(/producer/u);
    await expect(page.locator('[aria-live="polite"]')).toContainText(
      /result|producer/i,
    );
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/selected=/u);
    await page.goBack();
    await expect(page).toHaveURL(/producer/u);
    await expect(filter).toHaveValue('producer');
  });

  test('[P2-S06-AC-080..088, P2-S06-AC-111..113] preserves safe last-known data while offline and reconciles after reconnect', async ({
    context,
    page,
  }) => {
    await page.goto(PUBLIC_PATH);
    await expect(page.locator('[data-state="success"]')).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('[data-state="degraded"]')).toContainText(
      /offline|last verified|unavailable/i,
    );
    await expect(page.locator('[data-last-verified]')).toBeVisible();
    await context.setOffline(false);
    await page.reload();
    await expect(page.locator('[data-state="success"]')).toBeVisible();
  });

  test('[P2-S06-AC-006, P2-S06-AC-012, P2-S06-AC-018, P2-S06-AC-024, P2-S06-AC-030, P2-S06-AC-036, P2-S06-AC-042, P2-S06-AC-048, P2-S06-AC-054, P2-S06-AC-060, P2-S06-AC-066, P2-S06-AC-072, P2-S06-AC-078] treats another tab as invalidation only and opens a sync conflict', async ({
    context,
    page,
  }) => {
    await seedProtectedSession(page);
    await page.goto(APP_PATH);
    const otherTab = await context.newPage();
    await otherTab.goto(APP_PATH);
    await otherTab.evaluate(() => {
      const channel = new BroadcastChannel('profile-portfolio');
      channel.postMessage({
        type: 'profile.projection.invalidated.v1',
        partyId: '018f0c45-73fe-7dc2-9c09-68f7ecf132d4',
      });
      channel.close();
    });
    await expect(
      page.locator('[data-sync-conflict], [data-state="conflict"]'),
    ).toContainText(/version|review|current/i);
    await expect(page.locator('[data-draft]')).toBeVisible();
    await otherTab.close();
  });
});
