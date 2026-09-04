import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const APP_ROUTE = '/app/platform-configuration-admin';
const SESSION_COOKIE = {
  name: 'wj_access',
  value: 'slice-08-e2e-session',
  domain: '127.0.0.1',
  path: '/',
  httpOnly: true,
  secure: false,
  sameSite: 'Lax' as const,
};

const authenticate = async (context: BrowserContext): Promise<void> => {
  await context.addCookies([SESSION_COOKIE]);
};

const openAdminWorkspace = async (page: Page, suffix = ''): Promise<void> => {
  await page.goto(`${APP_ROUTE}${suffix}`);
  await expect(page).toHaveURL(
    new RegExp(`${APP_ROUTE.replaceAll('/', '\\/')}`),
  );
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Platform configuration',
    }),
  ).toBeVisible();
};

test.describe('Phase 2 Slice 08 admin workspace browser behavior', () => {
  test.beforeEach(async ({ context }) => authenticate(context));

  test('[P2-S08-AC-001, P2-S08-AC-002, P2-S08-AC-006, P2-S08-AC-041, P2-S08-AC-043] renders the capability-filtered inbox with truthful freshness and ownership', async ({
    page,
  }) => {
    await openAdminWorkspace(page, '?tab=inbox&states=open,assigned');

    const workbench = page.locator(
      '[data-workbench="admin-workspace-operations"]',
    );
    await expect(workbench).toHaveAttribute('data-access', 'full');
    await expect(workbench).toHaveAttribute(
      'data-contract-source',
      '05b-admin-workspace-operations.md',
    );
    await expect(
      page.getByRole('region', { name: 'Admin task inbox' }),
    ).toBeVisible();
    await expect(
      page.getByText('Source version', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Freshness', { exact: true })).toBeVisible();
    await expect(page.getByText('Assigned to', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /approval|task/u }).first(),
    ).toHaveAttribute('href', /tab=inbox.*selected=/u);
    await expect(
      page.getByText(/healthy|stale|partial|unknown/u).first(),
    ).toBeVisible();
    await expect(page.locator('[data-operation-id="CFG-05B-02"]')).toHaveCount(
      0,
    );
    await expect(page.locator('[data-operation-id="CFG-05B-03"]')).toHaveCount(
      0,
    );
  });

  test('[P2-S08-AC-003, P2-S08-AC-004, P2-S08-AC-044, P2-S08-AC-046, P2-S08-AC-047, P2-S08-AC-049] exposes bounded grant/revoke and audit notification actions only', async ({
    page,
  }) => {
    await openAdminWorkspace(page, '?tab=capabilities');

    await expect(
      page.getByRole('form', { name: 'Grant or revoke capability' }),
    ).toBeVisible();
    for (const field of [
      'subjectPersonId',
      'capabilityKey',
      'resourceType',
      'resourceId',
      'actions',
      'startsAt',
      'endsAt',
      'reason',
      'approverPersonId',
      'purposeGrant',
      'stepUpToken',
    ]) {
      await expect(page.locator(`[name="${field}"]`)).toBeVisible();
    }
    await expect(
      page.getByRole('button', { name: 'Grant capability' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Revoke capability' }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Audit and security activity' }),
    ).toBeVisible();
    await expect(
      page.getByText(/site health|repair|run diagnostic/iu),
    ).toHaveCount(0);
    await expect(page.getByText(/global search|bulk operation/iu)).toHaveCount(
      0,
    );
  });

  test('[P2-S08-AC-001, P2-S08-AC-004] role query text cannot reveal protected operations', async ({
    page,
  }) => {
    await openAdminWorkspace(page, '?role=admin&tab=inbox');
    await expect(
      page.getByRole('button', { name: 'Grant capability' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Revoke capability' }),
    ).toHaveCount(0);
    await expect(page.locator('[data-access="not-rendered"]')).toHaveCount(1);
    await expect(
      page.getByText('configuration.approver', { exact: true }),
    ).toHaveCount(0);
  });

  test('[P2-S08-AC-002, P2-S08-AC-006, P2-S08-AC-043] preserves safe no-JavaScript HTML and action semantics', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    await authenticate(context);
    const page = await context.newPage();
    await openAdminWorkspace(page, '?tab=inbox');
    await expect(
      page.getByRole('region', { name: 'Admin task inbox' }),
    ).toBeVisible();
    await expect(page.locator('form[action*="capability-grants"]')).toHaveCount(
      0,
    );
    await expect(page.locator('[data-operation-id="CFG-05B-02"]')).toHaveCount(
      0,
    );
    await expect(page.locator('[data-operation-id="CFG-05B-03"]')).toHaveCount(
      0,
    );
    await expect(page.locator('a[href*="selected="]')).toHaveCount(1);
    await context.close();
  });

  test('[P2-S08-AC-002, P2-S08-AC-010, P2-S08-AC-042] expires auth without leaking the requested admin state', async ({
    page,
    context,
  }) => {
    await openAdminWorkspace(
      page,
      '?tab=inbox&selected=018f0c45-73fe-7dc2-9c09-68f7ecf132da',
    );
    await context.clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/\/auth\/sign-in\?returnTo=/u);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Sign in',
    );
    await expect(page.locator('body')).not.toContainText('Admin task inbox');
    await expect(page.locator('body')).not.toContainText(
      'configuration.approver',
    );
  });

  test('[P2-S08-AC-002, P2-S08-AC-043] keeps the task list/detail composition usable at locked widths and zoom', async ({
    page,
  }) => {
    await openAdminWorkspace(page, '?tab=inbox');
    const workbench = page.locator(
      '[data-workbench="admin-workspace-operations"]',
    );
    await expect(workbench).toHaveAttribute(
      'data-composition',
      'list-detail-action-rail',
    );
    await expect(page.getByRole('region', { name: 'Task list' })).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Task detail' }),
    ).toBeVisible();

    for (const width of [320, 800, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const listBox = await page
        .getByRole('region', { name: 'Task list' })
        .boundingBox();
      const detailBox = await page
        .getByRole('region', { name: 'Task detail' })
        .boundingBox();
      expect(listBox).not.toBeNull();
      expect(detailBox).not.toBeNull();
      if (listBox === null || detailBox === null) continue;
      if (width <= 768)
        expect(detailBox.y).toBeGreaterThanOrEqual(
          listBox.y + listBox.height - 1,
        );
    }
    await page.setViewportSize({ width: 640, height: 800 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test('[P2-S08-AC-002] keeps settings version and source facts visible at tablet width', async ({
    page,
  }) => {
    await openAdminWorkspace(page, '?tab=settings&key=web.theme');
    await page.setViewportSize({ width: 800, height: 800 });

    const table = page.locator(
      '[data-workbench="settings-flags-runtime"] .platform-configuration-data-table',
    );
    await expect(
      table.getByRole('columnheader', { name: 'Version' }),
    ).toBeVisible();
    await expect(
      table.getByRole('columnheader', { name: 'Source' }),
    ).toBeVisible();
    await expect(
      table.locator('tbody td[data-label="Version"]').first(),
    ).toBeVisible();
    await expect(
      table.locator('tbody td[data-label="Source"]').first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test('[P2-S08-AC-002] keeps native selection and route heading focus stable', async ({
    page,
  }) => {
    await openAdminWorkspace(page, '?tab=inbox');
    const taskLink = page.getByRole('link', { name: 'approval task' });
    await taskLink.focus();
    await expect(taskLink).toBeFocused();
    await taskLink.click();
    await expect(page).toHaveURL(/tab=inbox.*selected=/u);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Platform configuration' }),
    ).toBeFocused();
  });

  test('[P2-S08-AC-002] exposes supported provenance navigation and native reset without JavaScript', async ({
    browser,
    page,
  }) => {
    await openAdminWorkspace(page, '?key=web.theme&tab=settings');
    const provenance = page.getByRole('link', { name: 'Provenance' });
    await expect(provenance).toHaveAttribute('href', /tab=settings/u);
    await expect(provenance).not.toHaveAttribute('href', /tab=provenance/u);

    const noJsContext = await browser.newContext({ javaScriptEnabled: false });
    await authenticate(noJsContext);
    const noJsPage = await noJsContext.newPage();
    await noJsPage.goto(`${APP_ROUTE}?key=web.theme&tab=settings&query=theme`);
    await expect(
      noJsPage.getByRole('link', { name: 'Reset filters' }),
    ).toHaveAttribute('href', /tab=settings/u);
    await noJsContext.close();
  });

  test('[P2-S08-AC-002] normalizes invalid tab and sort values on the real route', async ({
    page,
  }) => {
    await openAdminWorkspace(page, '?tab=not-a-tab&sort=not-a-sort');

    await expect(page).toHaveURL(/tab=settings/u);
    await expect(page).not.toHaveURL(/tab=not-a-tab|sort=not-a-sort/u);
    await expect(
      page.getByRole('link', { name: 'Settings and flags', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
  });

  test('[P2-S08-AC-002] exposes an SSR Back-to-settings-list link for mobile no-JavaScript detail', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
    });
    await authenticate(context);
    const page = await context.newPage();
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(
      `${APP_ROUTE}?tab=settings&key=web.theme&view=runtime&query=theme&sort=key_desc&selected=018f0c45-73fe-7dc2-9c09-68f7ecf132d8`,
    );

    await expect(
      page.getByRole('heading', { name: 'Selected configuration detail' }),
    ).toBeVisible();
    const backLink = page.getByRole('link', {
      name: 'Back to settings records',
    });
    await expect(backLink).toBeVisible();
    const backUrl = new URL(
      (await backLink.getAttribute('href')) ?? '',
      page.url(),
    );
    expect(backUrl.searchParams.get('selected')).toBeNull();
    for (const [name, value] of [
      ['tab', 'settings'],
      ['key', 'web.theme'],
      ['view', 'runtime'],
      ['query', 'theme'],
      ['sort', 'key_desc'],
    ] as const) {
      expect(backUrl.searchParams.get(name), `missing ${name}`).toBe(value);
    }
    await context.close();
  });
});
