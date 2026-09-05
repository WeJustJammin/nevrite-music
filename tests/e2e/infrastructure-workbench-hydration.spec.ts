import { expect, test } from '@playwright/test';

const isKnownViteStrictCspStyleDiagnostic = (message: string): boolean =>
  /^Applying inline style violates the following Content Security Policy directive 'style-src 'self' 'nonce-[A-Za-z0-9_-]+''\./u.test(
    message,
  );

test('serves the Astro dev modules required for island hydration', async ({
  page,
}) => {
  const devModules = [
    '/@vite/client',
    '/@id/astro:scripts/before-hydration.js',
    '/@id/@astrojs/react/client.js',
  ];

  for (const modulePath of devModules) {
    await expect
      .poll(
        async () => {
          try {
            const response = await page.request.get(modulePath);
            return {
              contentType: response.headers()['content-type'] ?? '',
              status: response.status(),
            };
          } catch {
            return { contentType: '', status: 0 };
          }
        },
        { message: modulePath, timeout: 10_000 },
      )
      .toMatchObject({
        contentType: expect.stringMatching(/javascript/),
        status: 200,
      });
  }
});

test('hydrates the visible degraded Workbench without an unresolved lazy render', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const requestedModules: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    failedRequests.push(
      `${request.method()} ${request.url()} — ${request.failure()?.errorText ?? 'unknown failure'}`,
    );
  });
  page.on('request', (request) => requestedModules.push(request.url()));

  await page.goto('/system/degraded', { waitUntil: 'domcontentloaded' });

  const island = page.locator(
    'astro-island[component-url*="InfrastructureWorkbench"]',
  );
  await page
    .getByRole('heading', {
      level: 2,
      name: 'Current infrastructure records',
    })
    .scrollIntoViewIfNeeded();
  await expect(island).not.toHaveAttribute('ssr', '', { timeout: 10_000 });
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Current infrastructure records',
    }),
  ).toBeVisible();

  await expect
    .poll(() =>
      requestedModules.some((url) =>
        url.includes('InfrastructureWorkbenchRuntime'),
      ),
    )
    .toBe(true);
  expect(
    requestedModules.some((url) => url.includes('InfrastructureJobRegions')),
  ).toBe(false);

  const query = page.getByLabel('Search records');
  await query.focus();
  await query.pressSequentially('hydrated');
  await expect(query).toHaveValue('hydrated');
  await expect(
    page
      .getByLabel('Active filters')
      .getByText('Search: hydrated', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Load live job controls' }).click();
  await expect
    .poll(() =>
      requestedModules.some((url) => url.includes('InfrastructureJobRegions')),
    )
    .toBe(true);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Job status' }),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(
    consoleErrors.filter(
      (message) => !isKnownViteStrictCspStyleDiagnostic(message),
    ),
  ).toEqual([]);
});
