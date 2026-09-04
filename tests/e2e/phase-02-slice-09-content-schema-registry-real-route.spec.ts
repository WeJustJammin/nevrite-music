import { webcrypto } from 'node:crypto';

import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const APP_ROUTE = '/app/cms-content-modeling';
const USER_ID = '10000000-0000-4000-8000-000000000001';
const SESSION_ID = '80000000-0000-4000-8000-000000000008';
const SUPABASE_ORIGIN = 'http://127.0.0.1:8790';
const AUTH_SECRET = 'sb_secret_local_only';
const SESSION_SIGNING_SECRET = 's09-real-route-session-secret';

const base64Url = (value: Uint8Array | string): string =>
  typeof value === 'string'
    ? Buffer.from(value).toString('base64url')
    : Buffer.from(value).toString('base64url');

const accessToken = async ({
  sessionId = SESSION_ID,
  expiresAt = Math.floor(Date.now() / 1000) + 3_600,
  forged = false,
}: Readonly<{
  sessionId?: string;
  expiresAt?: number;
  forged?: boolean;
}> = {}): Promise<string> => {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      aud: 'authenticated',
      exp: expiresAt,
      iss: `${SUPABASE_ORIGIN}/auth/v1`,
      session_id: sessionId,
      sub: USER_ID,
    }),
  );
  const signature = forged
    ? 'forged-signature'
    : base64Url(
        new Uint8Array(
          await webcrypto.subtle.sign(
            'HMAC',
            await webcrypto.subtle.importKey(
              'raw',
              new TextEncoder().encode(SESSION_SIGNING_SECRET),
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['sign'],
            ),
            new TextEncoder().encode(`${header}.${payload}`),
          ),
        ),
      );
  return `${header}.${payload}.${signature}`;
};

const sessionReference = async (sessionId = SESSION_ID): Promise<string> => {
  const keyMaterial = await webcrypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`wejammin-auth-flow-v1\u0000${AUTH_SECRET}`),
  );
  const key = await webcrypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const flow = JSON.stringify({
    state: sessionId,
    nonce: USER_ID,
    verifier: '',
    provider: 'session',
    intent: 'session',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000).toISOString(),
  });
  const ciphertext = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(flow),
  );
  return `${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
};

const authenticate = async (
  context: BrowserContext,
  options: Readonly<{
    sessionId?: string;
    expiresAt?: number;
    forged?: boolean;
  }> = {},
): Promise<void> => {
  const sessionId = options.sessionId ?? SESSION_ID;
  await context.addCookies([
    {
      name: 'wj_access',
      value: await accessToken(options),
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'wj_session_ref',
      value: await sessionReference(sessionId),
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
};

type BrowserVitals = Readonly<{
  lcpMs: number | null;
  cls: number;
  inpMs: number | null;
  longTaskCount: number;
  observers: Readonly<{
    lcp: boolean;
    cls: boolean;
    event: boolean;
    longtask: boolean;
  }>;
}>;

const installVitalsObserver = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const vitals: {
      lcpMs: number | null;
      cls: number;
      inpMs: number | null;
      longTaskCount: number;
      observers: {
        lcp: boolean;
        cls: boolean;
        event: boolean;
        longtask: boolean;
      };
    } = {
      lcpMs: null,
      cls: 0,
      inpMs: null,
      longTaskCount: 0,
      observers: { lcp: false, cls: false, event: false, longtask: false },
    };
    Reflect.set(globalThis, '__s09RealRouteVitals', vitals);

    try {
      new PerformanceObserver((list) => {
        const latest = list.getEntries().at(-1);
        if (latest !== undefined) vitals.lcpMs = latest.startTime;
      }).observe({ buffered: true, type: 'largest-contentful-paint' });
      vitals.observers.lcp = true;
    } catch {
      // Keep unsupported browser capabilities explicit in the test result.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (shift.hadRecentInput !== true && typeof shift.value === 'number')
            vitals.cls += shift.value;
        }
      }).observe({ buffered: true, type: 'layout-shift' });
      vitals.observers.cls = true;
    } catch {
      // Keep unsupported browser capabilities explicit in the test result.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ('interactionId' in entry && entry.duration > 0)
            vitals.inpMs =
              vitals.inpMs === null
                ? entry.duration
                : Math.max(vitals.inpMs, entry.duration);
        }
      }).observe({ buffered: true, durationThreshold: 0, type: 'event' });
      vitals.observers.event = true;
    } catch {
      // Keep unsupported browser capabilities explicit in the test result.
    }

    try {
      new PerformanceObserver((list) => {
        vitals.longTaskCount += list.getEntries().length;
      }).observe({ buffered: true, type: 'longtask' });
      vitals.observers.longtask = true;
    } catch {
      // Keep unsupported browser capabilities explicit in the test result.
    }
  });
};

const gotoRegistry = async (
  page: Page,
  path = APP_ROUTE,
): Promise<import('@playwright/test').Response | null> => {
  let response = await page.goto(path, { waitUntil: 'networkidle' });
  if (response?.status() !== 503) return response;
  await expect
    .poll(
      async () => {
        response = await page.goto(path, { waitUntil: 'networkidle' });
        return response?.status() ?? 0;
      },
      { timeout: 5_000, intervals: [100, 250, 500] },
    )
    .toBe(200);
  return response;
};

test('[P2-S09-AC-262] measures the real production-built route workload', async ({
  context,
  page,
}) => {
  await authenticate(context);
  await installVitalsObserver(page);

  const response = await gotoRegistry(page);
  expect(response).not.toBeNull();
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Content schema registry' }),
  ).toBeVisible();
  await expect(
    page.getByRole('table').getByText('article', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(100);
  await expect(
    page.locator('[data-workbench="content-schema-registry"]'),
  ).toHaveAttribute('data-role-policy', 'server-authoritative');
  await expect(page.locator('body')).not.toContainText(
    'temporarily unavailable',
  );

  await page.getByRole('link', { name: 'Skip to main content' }).click();
  await expect(page.locator('#content-schema-registry-main')).toBeFocused();
  await page.waitForFunction(
    () => {
      const vitals = Reflect.get(
        globalThis,
        '__s09RealRouteVitals',
      ) as BrowserVitals;
      return vitals.lcpMs !== null && vitals.inpMs !== null;
    },
    undefined,
    { timeout: 2_000 },
  );
  const vitals = await page.evaluate(
    () => Reflect.get(globalThis, '__s09RealRouteVitals') as BrowserVitals,
  );
  expect(vitals.observers).toEqual({
    lcp: true,
    cls: true,
    event: true,
    longtask: true,
  });
  expect(vitals.lcpMs).not.toBeNull();
  expect(vitals.inpMs).not.toBeNull();
  if (vitals.lcpMs === null || vitals.inpMs === null)
    throw new Error('LCP and INP observers must report non-null measurements');
  expect(vitals.lcpMs).toBeLessThan(2_500);
  expect(vitals.inpMs).toBeLessThan(200);
  expect(vitals.cls).toBeLessThan(0.1);
  expect(vitals.longTaskCount).toBe(0);
});

test('[P2-S09-AC-265] exercises real server-authorized list, detail, and sign-in flows', async ({
  context,
  page,
}) => {
  const unauthenticated = await page.goto(APP_ROUTE, {
    waitUntil: 'domcontentloaded',
  });
  expect(unauthenticated).not.toBeNull();
  expect(page.url()).toContain(
    '/auth/sign-in?returnTo=%2Fapp%2Fcms-content-modeling',
  );

  await context.clearCookies();
  await authenticate(context);
  const listResponse = await gotoRegistry(page);
  expect(listResponse?.status()).toBe(200);
  const workbench = page.locator('[data-workbench="content-schema-registry"]');
  await expect(workbench).toHaveAttribute('data-variant', 'ownerFull');
  await expect(workbench).toHaveAttribute('data-access', 'full');
  await expect(page.getByRole('table')).toBeVisible();
  const detailLinks = page
    .locator('a[href*="/versions/"]')
    .filter({ hasText: 'View details' });
  await expect(detailLinks).toHaveCount(2);
  const detailLink = detailLinks.first();
  await expect(detailLink).toHaveCount(1);

  const detailPath = await detailLink.getAttribute('href');
  expect(detailPath).toMatch(
    /\/app\/cms-content-modeling\/[^/]+\/versions\/[^/]+$/u,
  );
  const detailResponse = await gotoRegistry(page, detailPath as string);
  expect(detailResponse?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'Article', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('title', { exact: true })).toBeVisible();
  await expect(
    page.locator('[data-workbench="content-schema-registry"]'),
  ).toHaveAttribute('data-role-policy', 'server-authoritative');
  await expect(
    page.locator(
      'section[aria-labelledby="content-schema-registry-fields-heading"] li',
    ),
  ).toHaveCount(128);
});

test('[P2-S09-AC-265] rejects a forged access token on the real route', async ({
  context,
  page,
}) => {
  await authenticate(context, { forged: true });
  await page.goto(APP_ROUTE, { waitUntil: 'domcontentloaded' });
  expect(page.url()).toContain(
    '/auth/sign-in?returnTo=%2Fapp%2Fcms-content-modeling',
  );
  await expect(
    page.locator('[data-workbench="content-schema-registry"]'),
  ).toHaveCount(0);
});

test('[P2-S09-AC-265] rejects an expired signed access token on the real route', async ({
  context,
  page,
}) => {
  await authenticate(context, {
    expiresAt: Math.floor(Date.now() / 1_000) - 1,
  });
  await page.goto(APP_ROUTE, { waitUntil: 'domcontentloaded' });
  expect(page.url()).toContain(
    '/auth/sign-in?returnTo=%2Fapp%2Fcms-content-modeling',
  );
  await expect(
    page.locator('[data-workbench="content-schema-registry"]'),
  ).toHaveCount(0);
});

test('[P2-S09-AC-265] rejects a revoked signed session on the real route', async ({
  context,
  page,
}) => {
  const sessionId = '80000000-0000-4000-8000-000000000099';
  await authenticate(context, { sessionId });
  const revokeResponse = await page.request.post('/_s09/revoke', {
    data: { sessionId },
  });
  expect(revokeResponse.status()).toBe(200);
  await page.goto(APP_ROUTE, { waitUntil: 'domcontentloaded' });
  expect(page.url()).toContain(
    '/auth/sign-in?returnTo=%2Fapp%2Fcms-content-modeling',
  );
  await expect(
    page.locator('[data-workbench="content-schema-registry"]'),
  ).toHaveCount(0);
});
