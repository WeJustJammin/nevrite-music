import { expect, test, type Page } from '@playwright/test';

const IDENTITY_AUTHORITY_ROUTE = '/app/identity-authority';

const viewports = [
  {
    criterion: 'P2-S03-AC-222',
    name: 'mobile',
    width: 320,
    height: 800,
    columns: 4,
    composition: 'stacked',
  },
  {
    criterion: 'P2-S03-AC-223',
    name: 'tablet',
    width: 900,
    height: 900,
    columns: 8,
    composition: 'collapsible-sidebar',
  },
  {
    criterion: 'P2-S03-AC-224',
    name: 'desktop',
    width: 1280,
    height: 900,
    columns: 12,
    composition: 'list-detail-action-rail',
  },
] as const;

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

const openIdentityAuthority = async (
  page: Page,
  width: number,
  height: number,
): Promise<void> => {
  await page.setViewportSize({ width, height });
  await page.goto(
    `${IDENTITY_AUTHORITY_ROUTE}?tab=people&selected=person-s03`,
    {
      waitUntil: 'domcontentloaded',
    },
  );
  await expect(
    page.getByRole('heading', { level: 1, name: 'Identity authority' }),
  ).toBeVisible();
};

test.describe('Phase 2 Slice 03 identity authority responsive route', () => {
  for (const viewport of viewports) {
    test(`${viewport.criterion} ${viewport.name} layout keeps the route usable`, async ({
      page,
    }) => {
      await openIdentityAuthority(page, viewport.width, viewport.height);

      const layout = page.locator('[data-testid="identity-authority-layout"]');
      await expect(layout).toHaveAttribute('data-breakpoint', viewport.name);
      await expect(layout).toHaveAttribute(
        'data-columns',
        String(viewport.columns),
      );
      await expect(layout).toHaveAttribute(
        'data-composition',
        viewport.composition,
      );

      const mainBox = await page.getByRole('main').boundingBox();
      expect(mainBox).not.toBeNull();
      expect(mainBox?.width).toBeLessThanOrEqual(viewport.width);
      await expectNoHorizontalOverflow(page);
    });
  }

  test('P2-S03-AC-222 mobile reflows the workbench in reading order at 320 CSS px', async ({
    page,
  }) => {
    await openIdentityAuthority(page, 320, 800);

    const list = page.locator('[data-testid="identity-authority-list"]');
    const detail = page.locator('[data-testid="identity-authority-detail"]');
    const actingContext = page.locator(
      '[data-testid="acting-context-indicator"]',
    );
    const writeActions = page.locator(
      '[data-testid="identity-authority-write-actions"]',
    );

    await expect(list).toBeVisible();
    await expect(detail).toBeVisible();
    await expect(
      detail.getByRole('link', { name: 'Back to identity records' }),
    ).toBeVisible();

    const listBox = await list.boundingBox();
    const detailBox = await detail.boundingBox();
    const contextBox = await actingContext.boundingBox();
    const writeBox = await writeActions.boundingBox();
    expect(listBox).not.toBeNull();
    expect(detailBox).not.toBeNull();
    expect(contextBox).not.toBeNull();
    expect(writeBox).not.toBeNull();
    expect(detailBox?.y).toBeGreaterThanOrEqual(listBox?.y ?? 0);
    expect(writeBox?.y).toBeGreaterThanOrEqual(contextBox?.y ?? 0);

    const undersizedControls = await page
      .locator('main a, main button, main input, main select, main textarea')
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
  });

  test('P2-S03-AC-223 tablet keeps the sidebar collapsible and row facts available', async ({
    page,
  }) => {
    await openIdentityAuthority(page, 900, 900);

    const sidebar = page.locator('[data-testid="identity-authority-sidebar"]');
    const rowDetails = page.locator(
      '[data-testid="identity-authority-row-details"]',
    );

    await expect(sidebar).toBeVisible();
    await expect(
      sidebar.getByRole('button', { name: /collapse|expand/i }),
    ).toBeVisible();
    await expect(rowDetails).toBeVisible();
    await expect(rowDetails).toHaveAttribute('aria-expanded', 'true');
    await expectNoHorizontalOverflow(page);
  });

  test('P2-S03-AC-224 desktop keeps the 12-column list/detail split and action rail', async ({
    page,
  }) => {
    await openIdentityAuthority(page, 1280, 900);

    const layout = page.locator('[data-testid="identity-authority-layout"]');
    const list = page.locator('[data-testid="identity-authority-list"]');
    const detail = page.locator('[data-testid="identity-authority-detail"]');
    const actionRail = page.locator(
      '[data-testid="identity-authority-action-rail"]',
    );

    await expect(actionRail).toBeVisible();
    const layoutBox = await layout.boundingBox();
    const listBox = await list.boundingBox();
    const detailBox = await detail.boundingBox();
    expect(layoutBox).not.toBeNull();
    expect(listBox).not.toBeNull();
    expect(detailBox).not.toBeNull();
    expect(layoutBox?.width).toBeLessThanOrEqual(1440);
    expect(detailBox?.x).toBeGreaterThan(listBox?.x ?? 0);
    expect(Math.abs((detailBox?.y ?? 0) - (listBox?.y ?? 0))).toBeLessThan(48);
    await expect(page.getByRole('table')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('P2-S03-AC-222..224 preserves order and actions at 200% zoom', async ({
    page,
  }) => {
    await openIdentityAuthority(page, 640, 900);
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });

    await expect(
      page.getByRole('heading', { level: 1, name: 'Identity authority' }),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="identity-authority-write-actions"]'),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
