import { expect, test } from '@playwright/test';

test.describe('Phase 2 Slice 02 account security', () => {
  test('renders a disclosure-safe accessible fallback without a platform binding', async ({
    page,
  }) => {
    await page.goto('/settings/security');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Security settings' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'Security settings are temporarily unavailable',
      }),
    ).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      'No account or provider details are shown',
    );
    await expect(page.locator('body')).not.toContainText(
      /email|provider subject|auth uuid/iu,
    );

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Skip to main content' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
});
