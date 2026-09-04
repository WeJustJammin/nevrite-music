import { expect, test, type Page } from '@playwright/test';

const RELATIONSHIPS_ROUTE = '/app/identity-authority?tab=relationships';

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

const openRelationships = async (
  page: Page,
  width = 1280,
  height = 900,
): Promise<void> => {
  await page.setViewportSize({ width, height });
  await page.goto(RELATIONSHIPS_ROUTE, { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Identity authority',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Relationships authority governance',
    }),
  ).toBeVisible();
};

test.describe('Phase 2 Slice 04 relationships authority browser evidence', () => {
  test('P2-S04-AC-148..154 mounts the relationships tab with native JSON command forms', async ({
    page,
  }) => {
    await openRelationships(page);

    const workbench = page.locator(
      'div.relationships-authority-governance-workbench',
    );
    await expect(workbench).toBeVisible();
    await expect(
      workbench.getByRole('region', {
        name: 'Organizations, types, and membership tenure',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Relationships' }),
    ).toHaveAttribute('aria-current', 'page');

    const mutationForms = page.locator('form[data-json-body="true"]');
    await expect(mutationForms).toHaveCount(8);
    await expect(mutationForms.first()).toHaveAttribute(
      'data-idempotency',
      'required',
    );
    await expect(mutationForms.nth(1)).toHaveAttribute('data-method', 'POST');
    await expect(mutationForms.nth(2)).toHaveAttribute('data-method', 'DELETE');
    await expect(
      page.getByText('Server-selected acting party: public.'),
    ).toBeVisible();
  });

  test('P2-S04-AC-148..154 keeps relationship controls keyboard reachable and at least 44 CSS px on mobile', async ({
    page,
  }) => {
    await openRelationships(page, 320, 800);

    const undersizedControls = await page
      .locator(
        '[data-workbench] a, [data-workbench] button, [data-workbench] input, [data-workbench] select',
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

    const firstInput = page.locator('[data-workbench] input').first();
    await firstInput.focus();
    await expect(firstInput).toBeFocused();
    await page.keyboard.press('Tab');
    const activeInsideWorkbench = await page.evaluate(
      () => document.activeElement?.closest('[data-workbench]') !== null,
    );
    expect(activeInsideWorkbench).toBe(true);
  });

  test('P2-S04-AC-148 preserves URL navigation from the relationships section link', async ({
    page,
  }) => {
    await page.goto('/app/identity-authority?tab=people', {
      waitUntil: 'domcontentloaded',
    });
    await page.getByRole('link', { name: 'Relationships' }).click();
    await expect(page).toHaveURL(
      /\/app\/identity-authority\?tab=relationships$/u,
    );
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'Relationships authority governance',
      }),
    ).toBeVisible();
  });
});
