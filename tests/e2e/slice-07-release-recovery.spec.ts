import { expect, test } from '@playwright/test';

test('renders the fail-closed recovery projection and safe last-known-good state', async ({
  page,
}) => {
  await page.goto('/system/degraded', { waitUntil: 'networkidle' });

  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Protected operations remain blocked.',
    }),
  ).toBeVisible();
  await expect(
    page.getByText('PITR unavailable; protected writes remain disabled.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('No verified private snapshot available', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[data-release-recovery-status]').getByText('Request ID:', {
      exact: false,
    }),
  ).toBeVisible();
});

test('consumes a status update event without stealing focus', async ({
  page,
}) => {
  await page.goto('/system/degraded', { waitUntil: 'networkidle' });

  const retry = page.getByRole('link', { name: 'Retry safe status read' });
  await retry.focus();
  await page.evaluate(() => {
    document
      .querySelector<HTMLElement>('[data-release-recovery-status]')
      ?.dispatchEvent(new CustomEvent('wejammin:status-updated'));
  });
  await expect(retry).toBeFocused();

  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.evaluate(() => {
    document.body.focus();
    document
      .querySelector<HTMLElement>('[data-release-recovery-status]')
      ?.dispatchEvent(new CustomEvent('wejammin:status-updated'));
  });
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Protected operations remain blocked.',
    }),
  ).toBeFocused();
});
