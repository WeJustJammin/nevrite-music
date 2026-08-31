import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4321';
const VALID_REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const RESPONSIVE_WIDTHS = [320, 768, 1024, 1280] as const;

interface BrowserDiagnostics {
  readonly console: string[];
  readonly failedRequests: string[];
}

const diagnosticsByPage = new WeakMap<Page, BrowserDiagnostics>();

test.beforeEach(async ({ page }) => {
  const diagnostics: BrowserDiagnostics = {
    console: [],
    failedRequests: [],
  };
  diagnosticsByPage.set(page, diagnostics);
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.console.push(message.text());
  });
  page.on('requestfailed', (request) => {
    diagnostics.failedRequests.push(
      `${request.method()} ${request.url()} — ${request.failure()?.errorText ?? 'unknown failure'}`,
    );
  });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;

  const diagnostics = diagnosticsByPage.get(page);
  if (diagnostics !== undefined) {
    await testInfo.attach('browser-console-errors', {
      body:
        diagnostics.console.join('\n') || 'No browser console errors captured.',
      contentType: 'text/plain',
    });
    await testInfo.attach('failed-network-requests', {
      body:
        diagnostics.failedRequests.join('\n') ||
        'No failed network requests captured.',
      contentType: 'text/plain',
    });
  }
  await testInfo.attach('failure-screenshot', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.documentScrollWidth).toBeLessThanOrEqual(
    dimensions.documentClientWidth,
  );
  expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(
    dimensions.bodyClientWidth,
  );
}

async function expectDegradedShell(
  page: Page,
  route: '/system/degraded' | '/offline',
  requestId?: string,
): Promise<void> {
  await expect(page).toHaveTitle('Service status | WeJammin');
  await expect(page.locator('title')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('main').locator('h1')).toHaveCount(1);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Service status' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Current state: Degraded' }),
  ).toBeVisible();
  await expect(page.getByText('Affected scope', { exact: true })).toHaveCount(
    1,
  );
  await expect(
    page.getByText('Infrastructure reads and dependent workspace actions', {
      exact: true,
    }),
  ).toHaveCount(1);
  await expect(
    page.getByText('No verified private snapshot available', { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole('link', { name: 'Retry canonical read' }),
  ).toHaveAttribute('href', route);

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain(
    'This page preserves only a safe operational shell and makes no claim about private cached data.',
  );
  if (requestId === undefined) {
    expect(bodyText).toMatch(
      /Request ID: [0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/iu,
    );
  } else {
    expect(bodyText).toContain(`Request ID: ${requestId}`);
  }
  const codeValues = await page.locator('code').allTextContents();
  expect(codeValues.length).toBeGreaterThan(0);
  expect(
    codeValues.some((value) => REQUEST_ID_PATTERN.test(value.trim())),
  ).toBe(true);
}

test('P1-S02-AC-054 protected route redirects with an encoded, safe return target', async ({
  page,
  request,
}) => {
  const returnTarget =
    '/app/infrastructure?selected=11111111-1111-4111-8111-111111111111&tab=facts';
  const response = await request.get(returnTarget, { maxRedirects: 0 });

  expect(response.status()).toBe(303);
  const location = response.headers().location;
  expect(location).toBeDefined();
  expect(location).toContain('/auth/sign-in?returnTo=');

  const redirect = new URL(location ?? '', BASE_URL);
  expect(redirect.pathname).toBe('/auth/sign-in');
  expect(redirect.searchParams.get('returnTo')).toBe(returnTarget);
  expect(location).not.toContain('https://');

  await page.goto(returnTarget);
  await expect(page).toHaveURL(/\/auth\/sign-in\?returnTo=/u);
  await expect(page.locator('input[name="returnTo"]')).toHaveValue(
    returnTarget,
  );
  await expect(
    page.getByRole('heading', { level: 1, name: 'Sign in' }),
  ).toBeVisible();
});

test('P1-S02-AC-054 hostile return targets normalize to the safe app root', async ({
  page,
}) => {
  const hostileTargets = [
    'https://evil.example/steal',
    '//evil.example/steal',
    '/app/../admin',
    '/app/%2e%2e/admin',
    'javascript:alert(1)',
    '%E0%A4%A',
  ];

  for (const hostileTarget of hostileTargets) {
    await page.goto(
      `/auth/sign-in?${new URLSearchParams({ returnTo: hostileTarget })}`,
    );
    await expect(page.locator('input[name="returnTo"]')).toHaveValue('/app');
    await expect(page.locator('.infra-help code')).toHaveText('/app');
    expect(await page.locator('form').getAttribute('action')).toBe(
      '/auth/sign-in',
    );
    expect(await page.locator('body').innerHTML()).not.toContain(
      'evil.example',
    );
  }

  await page.goto(
    `/auth/sign-in?${new URLSearchParams({
      returnTo: '/app/infrastructure?tab=facts',
    })}`,
  );
  await expect(page.locator('input[name="returnTo"]')).toHaveValue(
    '/app/infrastructure?tab=facts',
  );
});

test('P1-S02-AC-055 system/degraded preserves only safe status and freshness messaging', async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ 'x-request-id': VALID_REQUEST_ID });

  for (const route of ['/system/degraded', '/offline'] as const) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expectDegradedShell(page, route);
  }
});

test('P1-S02-AC-055 invalid request IDs are replaced before degraded rendering', async ({
  page,
}) => {
  const hostileRequestId = '<script>alert(1)</script>';
  await page.setExtraHTTPHeaders({ 'x-request-id': hostileRequestId });
  const response = await page.goto('/system/degraded', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  await expectDegradedShell(page, '/system/degraded');
  expect(await page.locator('body').innerHTML()).not.toContain(
    hostileRequestId,
  );
});

test.describe('P1-S02-AC-048..050 responsive degraded shell', () => {
  for (const width of RESPONSIVE_WIDTHS) {
    test(`keeps the ${width}px route usable without page overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/system/degraded', { waitUntil: 'domcontentloaded' });

      await expect(
        page.getByRole('heading', { level: 1, name: 'Service status' }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
      const mainBox = await page.getByRole('main').boundingBox();
      expect(mainBox).not.toBeNull();
      expect(mainBox?.width).toBeLessThanOrEqual(width);
    });
  }

  test('P1-S02-AC-048 retains content and order at 200% zoom without overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto('/system/degraded', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });

    await expect(
      page.getByRole('heading', { level: 1, name: 'Service status' }),
    ).toBeVisible();
    await expect(
      page.getByText('Current state: Degraded', { exact: true }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test('P1-S02-AC-060 skip navigation moves keyboard focus to the named main landmark', async ({
  page,
}) => {
  await page.goto('/system/degraded', { waitUntil: 'domcontentloaded' });

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.locator('#main-content')).toHaveAttribute('tabindex', '-1');
});

test('P1-S02-AC-060 degraded shell passes axe with one title, main, and h1', async ({
  page,
}) => {
  await page.goto('/system/degraded', { waitUntil: 'domcontentloaded' });
  await expectDegradedShell(page, '/system/degraded');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('P1-S02-AC-057 malformed record links stay disclosure-safe at the auth boundary', async ({
  page,
  request,
}) => {
  const malformedPath = '/app/infrastructure/not-a-uuid';
  const response = await request.get(malformedPath, { maxRedirects: 0 });

  expect([303, 400, 404]).toContain(response.status());
  if (response.status() === 303) {
    const location = response.headers().location;
    expect(location).toBeDefined();
    const redirect = new URL(location ?? '', BASE_URL);
    expect(redirect.pathname).toBe('/auth/sign-in');
    expect(redirect.searchParams.get('returnTo')).toBe(malformedPath);
  }

  const browserResponse = await page.goto(malformedPath, {
    waitUntil: 'domcontentloaded',
  });
  expect([200, 400, 404]).toContain(browserResponse?.status());

  const currentUrl = new URL(page.url());
  if (currentUrl.pathname === '/auth/sign-in') {
    await expect(page.locator('input[name="returnTo"]')).toHaveValue(
      malformedPath,
    );
    await expect(
      page.getByRole('heading', { level: 1, name: 'Infrastructure record' }),
    ).toHaveCount(0);
  } else {
    expect([400, 404]).toContain(browserResponse?.status());
  }

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toContain('Infrastructure record details');
});
