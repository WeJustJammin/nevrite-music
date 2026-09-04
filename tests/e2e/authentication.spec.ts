import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('sign-in remains accessible and normalizes hostile return targets', async ({
  page,
}) => {
  await page.goto('/auth/sign-in?returnTo=https://attacker.example/steal');

  await expect(page).toHaveTitle('Sign in | WeJammin');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Sign in' }),
  ).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeEditable();
  await expect(
    page.getByRole('button', { name: 'Email me a sign-in link' }),
  ).toBeEnabled();
  const returnTargets = page.locator('input[name="returnTo"]');
  await expect(returnTargets).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    await expect(returnTargets.nth(index)).toHaveValue('/app');
  }
  await expect(
    page.getByRole('button', { name: 'Continue with Google' }),
  ).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('provider outage and callback tampering fail closed without exposing tokens', async ({
  page,
  request,
}) => {
  await page.goto('/auth/sign-in?outcome=unavailable');
  await expect(page.getByRole('status')).toContainText(
    'Authentication is temporarily unavailable',
  );

  const callback = await request.get('/auth/callback?state=opaque&code=opaque');
  expect(callback.status()).toBe(503);
  const body = (await callback.json()) as Readonly<Record<string, unknown>>;
  expect(body).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
  expect(JSON.stringify(body)).not.toMatch(
    /access_token|refresh_token|pkce|nonce/iu,
  );
});
