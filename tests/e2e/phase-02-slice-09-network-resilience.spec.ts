import { resolve } from 'node:path';

import { expect, test, type Page, type Route } from '@playwright/test';
import { CONTENT_SCHEMA_REGISTRY_RETRYABLE_HEADER } from '../../packages/contracts/src/content-schema-registry/route-policy-base';

import {
  fixtureDocument,
  REQUEST_ID,
  renderWorkbench,
  setRegistryFixture,
} from './phase-02-slice-09-content-schema-registry.fixture';

const REGISTRY_ROUTE = '/app/cms-content-modeling';
const CHANNEL_NAME = 'wejammin-content-schema-registry';
const REFRESHED_MARKUP = fixtureDocument(renderWorkbench());
const RATE_LIMITED_MARKUP = fixtureDocument(
  renderWorkbench({
    initialList: {
      status: 'error',
      error: {
        code: 'RATE_LIMITED',
        message: 'provider detail must never reach the browser',
        requestId: REQUEST_ID,
      },
      retryable: true,
      httpStatus: 429,
      retryAfterSeconds: 1,
    },
    initialDetail: null,
  }),
);
const RUNTIME_REFETCH_URL = `/@fs/${resolve(
  process.cwd(),
  'apps/web/src/components/content-schema-registry/content-schema-registry-runtime-dom-refetch.ts',
).replaceAll('\\', '/')}`;
const RUNTIME_MUTATIONS_URL = `/@fs/${resolve(
  process.cwd(),
  'apps/web/src/components/content-schema-registry/content-schema-registry-runtime-dom-mutations.ts',
).replaceAll('\\', '/')}`;

const installRefetchBridge = async (page: Page): Promise<void> => {
  await page.evaluate(async (moduleUrl) => {
    const module = (await import(moduleUrl)) as {
      readonly installContentSchemaRegistryCanonicalRefetch: (
        document: Document,
        canonicalUrl: string,
        onRefetch: (reason: 'list-read' | 'detail-read' | 'reconnect') => void,
      ) => () => void;
      readonly refetchContentSchemaRegistryCanonical: (options: {
        readonly document: Document;
        readonly canonicalUrl: string;
        readonly reason: 'list-read' | 'detail-read' | 'reconnect';
      }) => Promise<void>;
    };
    const reasons: string[] = [];
    const cleanup = module.installContentSchemaRegistryCanonicalRefetch(
      document,
      '/app/cms-content-modeling',
      (reason) => {
        reasons.push(reason);
        void module
          .refetchContentSchemaRegistryCanonical({
            document,
            canonicalUrl: '/app/cms-content-modeling',
            reason,
          })
          .catch((error: unknown) => {
            Reflect.set(
              globalThis,
              '__s09RefetchError',
              error instanceof Error ? error.message : String(error),
            );
          });
      },
    );
    Reflect.set(globalThis, '__s09RefetchReasons', reasons);
    Reflect.set(globalThis, '__s09RefetchCleanup', cleanup);
  }, RUNTIME_REFETCH_URL);
};

const sendInvalidationFromOtherTab = async (page: Page): Promise<void> => {
  await page.evaluate((channelName) => {
    const publisherKey = '__s09InvalidationPublisher';
    const existing = Reflect.get(globalThis, publisherKey);
    const channel =
      existing instanceof BroadcastChannel
        ? existing
        : new BroadcastChannel(channelName);
    Reflect.set(globalThis, publisherKey, channel);
    channel.postMessage({ type: 'content-schema-registry.invalidate' });
    // Let Chromium dispatch the queued message before the next assertion.
    return new Promise<void>((resolve) => setTimeout(resolve, 50));
  }, CHANNEL_NAME);
};

const appendMutationForm = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const form = document.createElement('form');
    form.id = 's09-network-mutation-form';
    form.dataset.cmsCommandForm = 'true';
    form.dataset.operationId = 'CMS-03A-01';
    form.action = '/app/cms-content-modeling';
    form.method = 'post';
    form.innerHTML = `
      <fieldset>
        <input type="hidden" name="operationId" value="CMS-03A-01" />
        <input type="hidden" name="csrf" value="csrf-token" />
        <input type="hidden" name="idempotency-key" value="s09-network-idempotency" />
        <input name="typeKey" value="article" />
        <button type="submit">Save</button>
      </fieldset>`;
    document.querySelector('main')?.append(form);
  });
};

const installMutationBridge = async (page: Page): Promise<void> => {
  await page.evaluate(async (moduleUrl) => {
    const module = (await import(moduleUrl)) as {
      readonly installContentSchemaRegistryCommandEnhancement: (
        document: Document,
        options: { readonly reconciliationUrl: string },
      ) => () => void;
    };
    const cleanup = module.installContentSchemaRegistryCommandEnhancement(
      document,
      { reconciliationUrl: '/app/cms-content-modeling' },
    );
    Reflect.set(globalThis, '__s09MutationCleanup', cleanup);
  }, RUNTIME_MUTATIONS_URL);
};

const fulfillRead = async (route: Route, status: number): Promise<void> => {
  await route.fulfill({
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...(status === 502 || status === 503 || status === 504
        ? { [CONTENT_SCHEMA_REGISTRY_RETRYABLE_HEADER]: 'true' }
        : {}),
      ...(status === 429 ? { 'retry-after': '1' } : {}),
    },
    body:
      status === 200
        ? REFRESHED_MARKUP
        : status === 429
          ? RATE_LIMITED_MARKUP
          : 'registry unavailable',
  });
};

test('[P2-S09-AC-265] exercises actual browser GET recovery, offline/reconnect, second-tab invalidation, and 429', async ({
  context,
  page,
}) => {
  await setRegistryFixture(page);
  const secondTab = await context.newPage();
  await setRegistryFixture(secondTab);
  const readStatuses = [503, 200, 429, 200, 200];
  const requests: Array<{ method: string; url: string }> = [];
  await context.route(`**${REGISTRY_ROUTE}*`, async (route) => {
    requests.push({
      method: route.request().method(),
      url: route.request().url(),
    });
    const status = readStatuses.shift();
    if (status === undefined)
      return route.fulfill({ status: 500, body: 'unexpected extra read' });
    await fulfillRead(route, status);
  });
  await installRefetchBridge(page);

  await context.setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
  await expect(page.locator('[data-cms-offline-status]')).toBeVisible();
  await context.setOffline(false);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => Reflect.get(globalThis, '__s09RefetchReasons')),
    )
    .toEqual(['reconnect']);
  await expect(page.locator('[data-cms-canonical-status]')).toHaveText(
    'Current server-verified records refreshed.',
  );
  expect(requests).toHaveLength(2);
  expect(readStatuses).toEqual([429, 200, 200]);

  await sendInvalidationFromOtherTab(secondTab);
  await expect(page.locator('[data-cms-canonical-status]')).toHaveText(
    'Registry retry timing refreshed from the server.',
  );
  await expect(page.getByRole('alert')).toContainText(
    'Too many registry requests. Try again shortly.',
  );
  await expect(page.locator('[data-retry-after-seconds]')).toContainText(
    'Retry available in 1 second.',
  );
  await expect(page.getByRole('button', { name: 'Retry' })).toBeDisabled();
  await expect(page.locator('body')).not.toContainText(
    'provider detail must never reach the browser',
  );
  expect(requests).toHaveLength(3);
  expect(readStatuses).toEqual([200, 200]);

  await page.getByRole('link', { name: 'Retry', exact: true }).click();
  await expect(
    page.locator('[data-workbench="content-schema-registry"]'),
  ).toBeVisible();
  await installRefetchBridge(page);
  await sendInvalidationFromOtherTab(secondTab);
  await expect.poll(() => requests.length).toBe(5);
  await expect
    .poll(() =>
      page.evaluate(() => Reflect.get(globalThis, '__s09RefetchReasons')),
    )
    .toEqual(['list-read']);
  await expect(page.locator('[data-cms-canonical-status]')).toHaveText(
    'Current server-verified records refreshed.',
  );
  expect(requests.every(({ method }) => method === 'GET')).toBe(true);
  expect(
    await page.evaluate(() => Reflect.get(globalThis, '__s09RefetchError')),
  ).toBeUndefined();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
  await secondTab.close();
});

test('[P2-S09-AC-265] exercises an actual browser mutation 429 and retains its idempotent form value', async ({
  context,
  page,
}) => {
  await setRegistryFixture(page);
  await appendMutationForm(page);
  const requests: Array<{ method: string; body: string | null }> = [];
  await context.route(`**${REGISTRY_ROUTE}*`, async (route) => {
    requests.push({
      method: route.request().method(),
      body: route.request().postData(),
    });
    if (route.request().method() !== 'POST')
      return route.fulfill({ status: 500, body: 'unexpected read' });
    await route.fulfill({
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': '1',
      },
      body: JSON.stringify({ code: 'RATE_LIMITED', details: {} }),
    });
  });
  await installMutationBridge(page);
  await page.locator('#s09-network-mutation-form').dispatchEvent('submit');
  await expect(
    page.locator('#s09-network-mutation-form [data-cms-command-status]'),
  ).toContainText('Retry in 1 seconds');
  expect(requests).toHaveLength(1);
  expect(requests[0]?.method).toBe('POST');
  expect(requests[0]?.body).toContain('s09-network-idempotency');
  expect(
    await page
      .locator('#s09-network-mutation-form [name="idempotency-key"]')
      .inputValue(),
  ).toBe('s09-network-idempotency');
  await context.setOffline(false);
});
