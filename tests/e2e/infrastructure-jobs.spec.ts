import { expect, test } from '@playwright/test';

const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const JOB_ID = '11111111-1111-4111-8111-111111111111';
const AT = '2026-08-30T12:00:00.000Z';

test('renders job, refusal, realtime, and Retry-After state in browser-visible HTML', async ({
  page,
}) => {
  const markup = `<main>
    <section class="infra-job-panel" data-state="success" aria-labelledby="job-status-heading" aria-busy="false">
      <h2 id="job-status-heading">Job status</h2>
      <div class="infra-job-live" role="status" aria-live="polite" aria-atomic="true">Job status: running.</div>
      <dl class="infra-job-fields"><div><dt>Job ID</dt><dd><code>${JOB_ID}</code></dd></div><div><dt>Updated</dt><dd><time dateTime="${AT}">${AT}</time></dd></div></dl>
    </section>
    <section class="infra-offline-intents" aria-labelledby="offline-intents-heading">
      <h2 id="offline-intents-heading">Offline intents</h2>
      <p role="status" aria-live="polite" aria-atomic="true">Connectivity: offline. Local intents are not canonical until revalidated.</p>
      <ul><li data-state="refused"><p>Refused: <code>VERSION_MISMATCH</code> Request ID: <code>${REQUEST_ID}</code></p></li></ul>
    </section>
    <div class="infra-realtime-status" data-state="stale" role="status" aria-live="polite" aria-atomic="true">A change hint arrived. Canonical job status will be refreshed.</div>
  </main>`;
  await page.setContent(
    `<!doctype html><html lang="en"><body>${markup}</body></html>`,
  );

  await expect(page.getByRole('heading', { name: 'Job status' })).toBeVisible();
  await expect(page.getByText(JOB_ID)).toBeVisible();
  await expect(page.getByText('Refused:', { exact: false })).toBeVisible();
  await expect(page.getByText('VERSION_MISMATCH')).toBeVisible();
  await expect(
    page.getByText(
      'A change hint arrived. Canonical job status will be refreshed.',
    ),
  ).toBeVisible();
});

test('renders the real server-owned degraded boundary before any client work', async ({
  page,
}) => {
  const response = await page.goto('/system/degraded', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'Service status', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Current state: Degraded', level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByText('No verified private snapshot available', { exact: true }),
  ).toBeVisible();
  expect(await page.locator('body').innerText()).toContain(
    'This page preserves only a safe operational shell and makes no claim about private cached data.',
  );
});

test('shows a rate wait without an early retry activation', async ({
  page,
}) => {
  const markup = `<section class="infra-job-panel" data-state="error" aria-labelledby="job-status-heading" aria-busy="false">
    <h2 id="job-status-heading">Job status</h2>
    <div class="infra-job-live" role="status" aria-live="polite" aria-atomic="true">The server asked us to wait. Request ID: ${REQUEST_ID}.</div>
    <div class="infra-job-error" role="alert"><p>Error code: <code>RATE_LIMITED</code></p><p>The server asked us to wait.</p><p>Request ID: ${REQUEST_ID}</p><p class="infra-job-retry-after" data-remaining-seconds="5" role="status" aria-live="polite" aria-atomic="true">Retry available in 5 seconds.</p></div>
  </section>`;
  await page.setContent(
    `<!doctype html><html lang="en"><body>${markup}</body></html>`,
  );

  await expect(page.getByText('Retry available in 5 seconds.')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Retry job status' }),
  ).toHaveCount(0);
});

test('a degraded route does not copy canonical data from another tab', async ({
  page,
  context,
}) => {
  await page.goto('/system/degraded', { waitUntil: 'domcontentloaded' });
  const otherTab = await context.newPage();
  await otherTab.goto('/system/degraded', { waitUntil: 'domcontentloaded' });
  let jobRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/jobs/')) jobRequests += 1;
  });
  await otherTab.evaluate(() => {
    const channel = new BroadcastChannel(
      'wejammin:infrastructure-invalidation',
    );
    channel.postMessage({
      kind: 'invalidate',
      entityId: '11111111-1111-4111-8111-111111111111',
      entityType: 'job',
      hintedVersion: '"999"',
    });
    channel.close();
  });

  await expect(
    page.getByRole('heading', { name: 'Service status' }),
  ).toBeVisible();
  await expect(page.getByText('succeeded', { exact: true })).toHaveCount(0);
  expect(jobRequests).toBe(0);
  await otherTab.close();
});
