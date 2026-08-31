import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('web scaffold renders useful server HTML without accessibility violations', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page).toHaveTitle('WeJammin | Operational foundation');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'WeJammin operational foundation',
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Workspace status: ready for local development'),
  ).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('component catalog remains local and identifies its purpose', async ({
  request,
}, testInfo) => {
  const docsOrigin = testInfo.config.metadata['docsOrigin'];
  if (typeof docsOrigin !== 'string') {
    throw new TypeError('Playwright docs origin metadata is required');
  }
  const response = await request.get(docsOrigin);
  const body = await response.text();

  expect(response.ok()).toBe(true);
  expect(body).toContain('<title>WeJammin component catalog</title>');
  expect(body).toContain('Local and CI verification only');
});
