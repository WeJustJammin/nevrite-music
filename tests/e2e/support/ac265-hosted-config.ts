import { devices, type PlaywrightTestConfig } from '@playwright/test';

export const createAc265HostedPlaywrightConfig = (
  webOrigin: string,
): PlaywrightTestConfig => ({
  forbidOnly: true,
  fullyParallel: false,
  globalSetup: './tests/e2e/support/ac265-hosted-global-setup.ts',
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  reporter: 'list',
  retries: 0,
  testDir: './tests/e2e',
  testMatch: ['**/*.ac265-hosted.spec.ts'],
  use: {
    baseURL: webOrigin,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  workers: 1,
});
