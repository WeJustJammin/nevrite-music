import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

delete process.env.NO_COLOR;
process.env.ASTRO_DEV_BACKGROUND = '0';

const port = (name: string, fallback: number): number => {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (!/^[1-9][0-9]{2,4}$/u.test(value))
    throw new TypeError(`${name} must be a TCP port`);
  return Number(value);
};

const webPort = port('S09_WEB_PORT', 4324);
const webOrigin = `http://127.0.0.1:${webPort}`;
const serverLauncher = fileURLToPath(
  new URL('./tests/e2e/support/run-s09-real-servers.mjs', import.meta.url),
);

export default defineConfig({
  forbidOnly: true,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  retries: 0,
  testDir: './tests/e2e',
  testMatch: 'phase-02-slice-09-content-schema-registry-real-route.spec.ts',
  use: {
    baseURL: webOrigin,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `node ${JSON.stringify(serverLauncher)}`,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    reuseExistingServer: false,
    timeout: 120_000,
    url: webOrigin,
  },
});
