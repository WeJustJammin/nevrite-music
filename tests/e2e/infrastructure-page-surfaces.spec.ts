import { expect, test } from '@playwright/test';

const PROTECTED_ROUTES = [
  '/app/infrastructure',
  '/app/infrastructure/11111111-1111-4111-8111-111111111111',
] as const;

test.describe('protected infrastructure surface mounting', () => {
  test('keeps every feature hidden when the browser has no server session', async ({
    page,
    request,
  }) => {
    for (const route of PROTECTED_ROUTES) {
      const response = await request.get(route, { maxRedirects: 0 });
      expect(response.status()).toBe(303);
      const location = response.headers()['location'];
      expect(location).toBeDefined();
      expect(new URL(location ?? '', 'http://127.0.0.1:4321').pathname).toBe(
        '/auth/sign-in',
      );
      expect(location).not.toContain('signedUrl');

      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/auth\/sign-in\?returnTo=/u);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Sign in' }),
      ).toBeVisible();
      await expect(
        page.getByText('Upload admission', { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText('Upload completion', { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText('Provider operation evidence', { exact: true }),
      ).toHaveCount(0);
    }
  });
});
