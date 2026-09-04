import { expect, test } from '@playwright/test';

import { setRegistryFixture } from './phase-02-slice-09-content-schema-registry.fixture';

test('[P2-S09-AC-266] proves keyboard focus escapes and returns without an unintended trap', async ({
  page,
}) => {
  await setRegistryFixture(page);
  await page.evaluate(() => {
    const focusableSelector =
      'main a, main button, main input, main select, main textarea';
    const isVisibleAndEnabled = (element: Element): boolean => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0 &&
        !(element as HTMLButtonElement).disabled
      );
    };
    const focusables = [...document.querySelectorAll(focusableSelector)].filter(
      isVisibleAndEnabled,
    );
    const lastMainFocusable = focusables.at(-1);
    if (!lastMainFocusable)
      throw new Error('Expected a focusable registry control');
    lastMainFocusable.id = 's09-last-main-focusable';

    const afterMain = document.createElement('button');
    afterMain.id = 's09-after-main';
    afterMain.type = 'button';
    afterMain.textContent = 'After registry';
    afterMain.setAttribute('aria-label', 'After registry');
    document.body.append(afterMain);
  });

  const firstControl = page.getByRole('button', { name: 'Apply filters' });
  await firstControl.focus();
  await expect(firstControl).toBeFocused();

  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement !== null)).toBe(true);
  expect(
    await firstControl.evaluate(
      (element) => document.activeElement === element,
    ),
  ).toBe(false);

  await page.keyboard.press('Shift+Tab');
  await expect(firstControl).toBeFocused();

  const lastMainControl = page.locator('#s09-last-main-focusable');
  const afterMain = page.locator('#s09-after-main');
  await lastMainControl.focus();
  await expect(lastMainControl).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(afterMain).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(lastMainControl).toBeFocused();
});
