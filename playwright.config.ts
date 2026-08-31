import { defineConfig, devices } from '@playwright/test';

// Playwright forces color in worker and web-server children. Remove NO_COLOR
// before those processes inherit both variables and make Node emit warnings.
delete process.env.NO_COLOR;

// Playwright must own the server lifetime even when Astro detects an agent host.
process.env.ASTRO_DEV_BACKGROUND = '0';

const ciRunId = process.env.GITHUB_RUN_ID;
if (ciRunId !== undefined && !/^\d+$/u.test(ciRunId)) {
  throw new TypeError('GITHUB_RUN_ID must be an unsigned integer');
}
const ciPortSlot =
  ciRunId === undefined ? undefined : Number(BigInt(ciRunId) % 10_000n);
const webPort = ciPortSlot === undefined ? 4321 : 30_000 + ciPortSlot * 2;
const docsPort = webPort + 1;
const webOrigin = `http://127.0.0.1:${webPort}`;
const docsOrigin = `http://127.0.0.1:${docsPort}`;

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  metadata: { docsOrigin },
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './tests/e2e',
  use: {
    baseURL: webOrigin,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `pnpm --filter @wejammin/web dev --host 127.0.0.1 --port ${webPort}`,
      reuseExistingServer: false,
      timeout: 120_000,
      url: webOrigin,
    },
    {
      command: `pnpm --filter @wejammin/docs dev --host 127.0.0.1 --port ${docsPort}`,
      reuseExistingServer: false,
      timeout: 120_000,
      url: docsOrigin,
    },
  ],
});
