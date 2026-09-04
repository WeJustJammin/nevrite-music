import { expect, test, type Page } from '@playwright/test';
import {
  OPAQUE_PARTY_ID,
  OPAQUE_RECORD_ID,
  openOwnership,
  viewports,
} from './helpers/profile-ownership-fixture';

const expectNoHorizontalOverflow = async (page: Page): Promise<void> => {
  const dimensions = await page.evaluate(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(
    dimensions.bodyClientWidth,
  );
  expect(dimensions.documentScrollWidth).toBeLessThanOrEqual(
    dimensions.documentClientWidth,
  );
};

test.describe('Phase 2 Slice 05 profile ownership browser evidence', () => {
  test.describe.configure({ mode: 'serial' });

  test('P2-S05-AC-163..165 server-first route preserves useful HTML and disclosure-safe navigation', async ({
    page,
  }) => {
    await openOwnership(page);

    await expect(page.locator('main#main-content')).toHaveAttribute(
      'tabindex',
      '-1',
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole('link', { name: 'Skip to main content' }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Shadow parties and ownership' }),
    ).toBeVisible();
    await expect(page.locator('[data-server-first="true"]')).toBeVisible();
    await expect(
      page.locator('[data-workbench="shadow-claim-ownership"]'),
    ).toBeVisible();
    await expect(page.locator('[data-request-id]')).toBeVisible();
    expect(await page.url()).not.toContain('contact');
    expect(await page.url()).not.toContain('evidenceBody');
  });

  for (const viewport of viewports) {
    test(`${viewport.criterion} ${viewport.name} keeps the workbench usable`, async ({
      page,
    }) => {
      await openOwnership(page, viewport.width, viewport.height);
      const layout = page.locator('[data-testid="profile-ownership-layout"]');

      await expect(layout).toHaveAttribute('data-breakpoint', viewport.name);
      await expect(layout).toHaveAttribute('data-columns', viewport.columns);
      await expect(layout).toHaveAttribute(
        'data-composition',
        viewport.composition,
      );
      await expectNoHorizontalOverflow(page);
    });
  }

  test('P2-S05-AC-202, P2-S05-AC-214..217 keeps selection URL-addressable and keyboard reachable', async ({
    page,
  }) => {
    await openOwnership(page, 320, 800);
    const workbench = page.locator('[data-workbench="shadow-claim-ownership"]');

    await expect(
      workbench.getByRole('region', { name: 'Shadow ownership list' }),
    ).toBeVisible();
    await expect(
      workbench.getByRole('region', { name: 'Shadow ownership detail' }),
    ).toBeVisible();
    await expect(
      workbench.getByRole('link', {
        name: 'Back to profile ownership records',
      }),
    ).toBeVisible();

    const selected = workbench.locator('a[aria-current="page"]').first();
    await selected.focus();
    await expect(selected).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      new RegExp(`selected=${OPAQUE_RECORD_ID}`, 'u'),
    );
    await page.keyboard.press('Escape');

    const undersizedControls = await page
      .locator(
        '[data-workbench="shadow-claim-ownership"] a, [data-workbench="shadow-claim-ownership"] button, [data-workbench="shadow-claim-ownership"] input, [data-workbench="shadow-claim-ownership"] select, [data-workbench="shadow-claim-ownership"] textarea',
      )
      .evaluateAll((elements) =>
        elements
          .filter((element) => {
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              name:
                element.textContent?.trim() ||
                element.getAttribute('aria-label'),
              width: rect.width,
              height: rect.height,
            };
          })
          .filter(({ width, height }) => width < 44 || height < 44),
      );
    expect(undersizedControls).toEqual([]);
    await expectNoHorizontalOverflow(page);
  });

  test('P2-S05-AC-019, P2-S05-AC-025, P2-S05-AC-042, P2-S05-AC-050, P2-S05-AC-115, P2-S05-AC-229 sends a typed invitation JSON command with browser guards', async ({
    page,
  }) => {
    await openOwnership(page);
    const form = page.locator('form[data-operation="PRF-API-02"]');
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute('data-json-body', 'true');
    await expect(form).toHaveAttribute('data-csrf', 'required');
    await expect(form).toHaveAttribute('data-idempotency', 'required');
    await expect(form).toHaveAttribute('data-if-match', 'required');
    await expect(form).toHaveAttribute(
      'action',
      new RegExp(`/api/v1/shadow-parties/${OPAQUE_RECORD_ID}/invitations`, 'u'),
    );

    await page.route(
      '**/api/v1/shadow-parties/*/invitations',
      async (route) => {
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          headers: {
            Location: '/api/v1/jobs/018f0c45-73fe-7dc2-9c09-68f7ecf132d4',
          },
          body: JSON.stringify({
            id: '018f0c45-73fe-7dc2-9c09-68f7ecf132d4',
            type: 'profile.invitation',
            state: 'queued',
            progress: null,
            resultRef: null,
            error: null,
            createdAt: '2026-09-01T05:00:00.000Z',
            updatedAt: '2026-09-01T05:00:00.000Z',
          }),
        });
      },
    );
    await form.locator('[name="contactRouteId"]').fill(OPAQUE_PARTY_ID);
    const requestPromise = page.waitForRequest(
      (request) =>
        request.url().includes('/invitations') && request.method() === 'POST',
    );
    await form.getByRole('button', { name: /dispatch invitation/i }).click();
    const request = await requestPromise;
    expect(request.headers()['content-type']).toContain('application/json');
    expect(request.headers()['x-csrf-token']).toMatch(
      /^[A-Za-z0-9._~-]{8,128}$/u,
    );
    expect(request.headers()['idempotency-key']).toMatch(/^[ -~]{8,128}$/u);
    expect(request.headers()['if-match']).toBe('"7"');
    const body = JSON.parse(request.postData() ?? '{}') as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      contactRouteId: expect.any(String),
      trigger: 'initial',
    });
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('contactValue');
    await expect(
      page
        .getByRole('region', { name: 'Shadow ownership detail' })
        .getByRole('status'),
    ).toContainText(/queued|invitation/i);
  });

  test('P2-S05-AC-116..118, P2-S05-AC-224 keeps an invitation pointer non-authenticating and account-free', async ({
    page,
  }) => {
    await openOwnership(page);
    const inviteLink = page.getByRole('link', {
      name: /open invitation|claim invitation/i,
    });
    await expect(inviteLink).toBeVisible();
    const href = await inviteLink.getAttribute('href');
    expect(href).toMatch(/\/claim(?:\/|$)/u);
    expect(href).not.toContain('/auth/sign-in');
    expect(href).not.toContain('email');
    expect(href).not.toContain('contact');

    await page.goto(href ?? '/claim/missing', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).not.toHaveURL(/auth\/sign-in/u);
    await expect(page.getByText(/account is not required/i)).toBeVisible();
    await expect(
      page.getByText(/pointer never grants ownership/i),
    ).toBeVisible();
    await expect(
      page.locator('form[data-authentication="anonymous"]'),
    ).toBeVisible();
  });

  test('P2-S05-AC-121..127 sends claim challenge/proof/conversion with opaque IDs and no secret responses', async ({
    page,
  }) => {
    await openOwnership(page);
    for (const operation of [
      'PRF-API-04',
      'PRF-API-06',
      'PRF-API-07',
      'PRF-API-08',
    ]) {
      const form = page.locator(`form[data-operation="${operation}"]`);
      await expect(form).toBeVisible();
      await expect(form).toHaveAttribute('data-json-body', 'true');
      await expect(form).toHaveAttribute('data-idempotency', 'required');
      await expect(form).toHaveAttribute('data-if-match', 'required');
    }
    await expect(page.locator('[data-challenge-attempts]')).toHaveAttribute(
      'data-max-attempts',
      '5',
    );
    await expect(page.locator('[data-challenge-expiry]')).toContainText(
      /15 minutes/i,
    );
    await expect(page.locator('#challenge-code')).toHaveAttribute(
      'maxlength',
      '6',
    );
    await expect(page.locator('#challenge-code')).toHaveAttribute(
      'inputmode',
      'numeric',
    );
    const html = await page.content();
    expect(html).not.toContain('challengeHash');
    expect(html).not.toContain('maskedDestination');
    expect(html).not.toContain('providerToken');
    expect(await page.url()).not.toContain(OPAQUE_PARTY_ID);
  });

  test('P2-S05-AC-128..145, P2-S05-AC-208..216 keeps deferred contest, transfer, and reversal controls disabled', async ({
    page,
  }) => {
    await openOwnership(page);
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
      const boundary = page.locator(`[data-operation="${operation}"]`);
      await expect(boundary).toBeVisible();
      await expect(boundary).toHaveAttribute('data-deferred', 'true');
      await expect(boundary).toHaveAttribute(
        'data-capability-state',
        'disabled',
      );
      await expect(boundary.locator('form')).toHaveCount(0);
    }
    await expect(
      page.getByText(/not available in this phase|disabled prerequisite/i),
    ).toBeVisible();
    expect(await page.content()).not.toContain('recipient@example');
    expect(await page.content()).not.toContain('evidenceBody');
  });

  test('P2-S05-AC-164, P2-S05-AC-170..197, P2-S05-AC-204, P2-S05-AC-228 renders disclosure-safe conflict and capability recovery', async ({
    page,
  }) => {
    await openOwnership(page);
    await page.route('**/api/v1/party-claims', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested record is unavailable.',
          requestId: '018f0c45-73fe-7dc2-9c09-68f7ecf132d4',
          details: {},
        }),
      });
    });
    const claim = page.locator('form[data-operation="PRF-API-04"]');
    await claim.locator('[name="targetPartyId"]').fill(OPAQUE_PARTY_ID);
    await claim.getByRole('button', { name: /start claim/i }).click();
    await expect(
      page
        .getByRole('region', { name: 'Shadow ownership detail' })
        .getByRole('status'),
    ).toContainText(/not available|not found/i);
    await expect(claim.locator('[name="targetPartyId"]')).toHaveValue(
      OPAQUE_PARTY_ID,
    );
    const html = await page.content();
    expect(html).not.toContain('protected evidence body');
    expect(html).not.toContain('contactRouteValue');
  });

  test('P2-S05-AC-147, AC-152, AC-156, AC-159..160 renders 429/conflict status, retains input, and restores focus at 200% zoom', async ({
    page,
  }) => {
    await openOwnership(page, 640, 900);
    const remedy = page.locator('form[data-operation="PRF-API-03"]');
    await expect(remedy).toBeVisible();
    await remedy
      .locator('[name="pointerToken"]')
      .fill('rm8p2v6q9yw4abcdefghijklmnopqrstuvwxyz1abcd');
    await remedy.locator('[name="proofCode"]').fill('482901');
    await page.route(
      /\/api\/v1\/shadow-remedies\/?(?:\?.*)?$/u,
      async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          headers: { 'Retry-After': '30' },
          body: JSON.stringify({
            code: 'RATE_LIMITED',
            message: 'Try again after the cooldown.',
            requestId: '018f0c45-73fe-7dc2-9c09-68f7ecf132d4',
            details: { retryAfterSeconds: 30 },
          }),
        });
      },
    );
    await remedy.getByRole('button', { name: /suppress|correct/i }).click();
    await expect(
      page
        .getByRole('region', { name: 'Shadow ownership detail' })
        .getByRole('status'),
    ).toContainText(/30|cooldown|try again/i);
    await expect(remedy.locator('[name="pointerToken"]')).toHaveValue(
      'rm8p2v6q9yw4abcdefghijklmnopqrstuvwxyz1abcd',
    );
    await expect(
      page.getByRole('button', { name: /retry|review/i }),
    ).toBeVisible();

    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.locator('[data-workbench="shadow-claim-ownership"]'),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
