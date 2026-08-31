import { defineConfig, devices } from '@playwright/test';

// Playwright forces color in worker and web-server children. Remove NO_COLOR
// before those processes inherit both variables and make Node emit warnings.
delete process.env.NO_COLOR;

// Playwright must own the server lifetime even when Astro detects an agent host.
process.env.ASTRO_DEV_BACKGROUND = '0';

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
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
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter @wejammin/web dev --host 127.0.0.1 --port 4321',
      reuseExistingServer: false,
      timeout: 120_000,
      url: 'http://127.0.0.1:4321',
    },
    {
      command: 'pnpm --filter @wejammin/docs dev --host 127.0.0.1 --port 4322',
      reuseExistingServer: false,
      timeout: 120_000,
      url: 'http://127.0.0.1:4322',
    },
  ],
});
