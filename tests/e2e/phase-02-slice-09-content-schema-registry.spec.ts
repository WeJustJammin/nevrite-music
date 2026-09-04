import AxeBuilder from '@axe-core/playwright';

import { expect, test } from '@playwright/test';

import {
  APP_ROUTE,
  expectNoHorizontalOverflow,
  setRegistryFixture,
} from './phase-02-slice-09-content-schema-registry.fixture';

test.describe('Phase 2 Slice 09 content schema registry browser contract', () => {
  test('[P2-S09-AC-219, P2-S09-AC-242, P2-S09-AC-243] redirects unauthenticated requests with a normalized same-origin return target', async ({
    page,
  }) => {
    await page.goto(
      `${APP_ROUTE}?returnTo=${encodeURIComponent('https://evil.example/')}`,
      { waitUntil: 'domcontentloaded' },
    );
    await expect(page).toHaveURL(/\/auth\/sign-in\?returnTo=/u);
    const returnTo = new URL(page.url()).searchParams.get('returnTo');
    expect(returnTo).toBe(
      `${APP_ROUTE}?returnTo=https%3A%2F%2Fevil.example%2F`,
    );
    expect(returnTo?.startsWith('/')).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
    await expect(page.locator('body')).not.toContainText(
      'Content schema registry',
    );
  });

  test('[P2-S09-AC-219, P2-S09-AC-247, P2-S09-AC-249, P2-S09-AC-266] keeps the SSR projection semantic, keyboard-addressable, and axe-clean', async ({
    page,
  }) => {
    await setRegistryFixture(page);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Content schema registry' }),
    ).toBeVisible();
    await expect(page.getByRole('main')).toHaveAttribute(
      'id',
      'content-schema-registry-main',
    );
    await expect(page.getByRole('table')).toBeVisible();
    await expect(
      page
        .getByRole('table')
        .getByText('Server-verified content schema registry records'),
    ).toBeVisible();
    await expect(page.getByRole('status').first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'View details' }),
    ).toHaveAttribute('href', /\/versions\//u);

    for (const control of [
      page.getByRole('button', { name: 'Apply filters' }),
      page.getByLabel('Resource kind'),
      page.getByLabel('Key prefix'),
      page.getByLabel('Lifecycle'),
      page.getByLabel('State'),
      page.getByLabel('Results per page'),
    ]) {
      await control.focus();
      await expect(control).toBeFocused();
    }
    await page.getByRole('button', { name: 'Apply filters' }).focus();
    const outline = await page
      .getByRole('button', { name: 'Apply filters' })
      .evaluate((element) => {
        const style = window.getComputedStyle(element);
        return { style: style.outlineStyle, width: style.outlineWidth };
      });
    expect(outline.style).toBe('solid');
    expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2);

    const axe = await new AxeBuilder({ page }).analyze();
    expect(
      axe.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical',
      ),
    ).toEqual([]);
  });

  test('[P2-S09-AC-244, P2-S09-AC-245, P2-S09-AC-246] preserves list-before-detail order, target sizes, and no document overflow at 320/768/1024/1280 CSS px', async ({
    page,
  }) => {
    await setRegistryFixture(page);
    const list = page.locator('.content-schema-registry-list');
    const detail = page.locator('.content-schema-registry-detail');
    const layout = page.locator('.content-schema-registry-grid');

    for (const width of [320, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await expectNoHorizontalOverflow(page, true);
      const listBox = await list.boundingBox();
      const detailBox = await detail.boundingBox();
      const layoutBox = await layout.boundingBox();
      expect.soft(listBox, `${width}px list`).not.toBeNull();
      expect.soft(detailBox, `${width}px detail`).not.toBeNull();
      expect.soft(layoutBox, `${width}px layout`).not.toBeNull();
      if (listBox === null || detailBox === null || layoutBox === null)
        continue;

      expect
        .soft(layoutBox.width, `${width}px layout width`)
        .toBeLessThanOrEqual(width);
      if (width <= 768) {
        expect
          .soft(detailBox.y, `${width}px stacked detail`)
          .toBeGreaterThanOrEqual(listBox.y + listBox.height - 1);
      } else {
        expect
          .soft(detailBox.x, `${width}px side-by-side detail`)
          .toBeGreaterThan(listBox.x);
      }

      const undersizedControls = await page
        .locator('main a, main button, main input, main select, main textarea')
        .evaluateAll((elements) =>
          elements
            .filter((element) => {
              const style = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                rect.height > 0
              );
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
            .filter(
              ({ width: controlWidth, height }) =>
                controlWidth < 44 || height < 44,
            ),
        );
      expect.soft(undersizedControls, `${width}px controls`).toEqual([]);
    }
  });

  test('[P2-S09-AC-219, P2-S09-AC-244, P2-S09-AC-245, P2-S09-AC-246] preserves the route at 200 percent zoom without horizontal scroll', async ({
    page,
  }) => {
    await setRegistryFixture(page);
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    await expect(
      page.getByRole('heading', { level: 1, name: 'Content schema registry' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
