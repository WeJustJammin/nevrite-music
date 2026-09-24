import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const requireFromTest = createRequire(import.meta.url);

type PlaywrightChannelExecutable = Readonly<{
  executablePath: () => string | undefined;
}>;

type PlaywrightCoreBundle = Readonly<{
  registry: Readonly<{
    registry: Readonly<{
      findExecutable: (name: string) => PlaywrightChannelExecutable;
    }>;
  }>;
}>;

/**
 * Playwright resolves `channel: 'chrome'` at launch time from a hardcoded
 * per-platform table inside playwright-core, so every Chrome guard in this
 * repository has to accept exactly the executable Playwright launches. Reading
 * the resolved path from the installed Playwright build keeps these
 * expectations tied to the launcher instead of a hand-maintained literal.
 */
const playwrightChromeChannelExecutable = (): string => {
  const requireFromPlaywright = createRequire(
    realpathSync(requireFromTest.resolve('@playwright/test')),
  );
  const { registry } = requireFromPlaywright(
    'playwright-core/lib/coreBundle',
  ) as PlaywrightCoreBundle;
  const resolved = registry.registry.findExecutable('chrome').executablePath();
  if (!resolved)
    throw new Error(
      'playwright-core resolved no chrome channel executable on this platform',
    );
  return resolved;
};

const read = (relativePath: string): string =>
  readFileSync(resolve(repositoryRoot, relativePath), 'utf8');

const chromePreflight = 'bash infra/workflows/verify-system-chrome.sh';
const chromePreflightPath = resolve(
  repositoryRoot,
  'infra/workflows/verify-system-chrome.sh',
);

const listFiles = (root: string): string[] =>
  readdirSync(resolve(repositoryRoot, root), {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative(repositoryRoot, join(entry.parentPath, entry.name)),
    );

const scannedSources = [
  ...['tests', 'infra', '.github'].flatMap(listFiles),
  'package.json',
  'playwright.config.ts',
  'playwright.s09-real.config.ts',
]
  .filter((path) => /\.(?:ts|tsx|mts|mjs|js|json|sh|ya?ml)$/u.test(path))
  .filter((path) => !path.endsWith('chrome-only-browser-gate.test.ts'));

/**
 * The AC266 automated accessibility artifact records the render engine family
 * rather than the distributor build. Google Chrome is Chromium-based, so the
 * report keeps its locked `chromium` wire literal while every launcher uses
 * the installer-provided Google Chrome.
 */
const chromiumWireLiteralSources = [
  'infra/workflows/content-schema-registry-axe-browser.ts',
  'packages/contracts/src/content-schema-registry/operational-release-evidence-axe-report.ts',
  'tests/contracts/phase-02-slice-09-automated-axe-report.test-support.ts',
  'tests/contracts/phase-02-slice-09-automated-axe-report.test.ts',
  'tests/contracts/phase-02-slice-09-retained-evidence.test-support.ts',
];

const playwrightConfigs = [
  'playwright.config.ts',
  'playwright.s09-real.config.ts',
];

const browserWorkflows = [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-staging.yml',
  '.github/workflows/run-ac265-hosted-e2e.yml',
];

// Matches an actual download command, not the guard assertions that forbid one.
const bundledBrowserInstall = /playwright install\s+\S/u;

describe('Google Chrome only browser gates', () => {
  it('routes every Playwright project through the Google Chrome channel', () => {
    for (const configPath of [
      'playwright.config.ts',
      'tests/e2e/support/ac265-hosted-config.ts',
    ]) {
      const config = read(configPath);
      expect(config, configPath).toContain("name: 'chrome'");
      expect(config, configPath).toContain("channel: 'chrome'");
      expect(config, configPath).not.toContain("name: 'chromium'");
    }

    // The S09 real-route config declares no named project. It pins the channel
    // after the device descriptor so the Chrome channel always wins.
    const realRouteConfig = read('playwright.s09-real.config.ts');
    expect(realRouteConfig).toContain("channel: 'chrome'");
    expect(
      realRouteConfig.indexOf("...devices['Desktop Chrome']"),
    ).toBeLessThan(realRouteConfig.indexOf("channel: 'chrome'"));
  });

  it('launches automated accessibility evidence through Chrome, never a bundled build', () => {
    const browserModule = read(
      'infra/workflows/content-schema-registry-axe-browser.ts',
    );
    expect(browserModule).toContain("channel: 'chrome'");
    expect(browserModule).not.toContain('executablePath:');

    const collector = read(
      'infra/workflows/collect-content-schema-registry-axe-evidence.ts',
    );
    expect(collector).toContain('launchSystemGoogleChrome');
    expect(collector).not.toContain('launchPinnedPlaywrightChromium');
  });

  it('pins the preflight and the collector to the executable Playwright launches', () => {
    const channelExecutable = playwrightChromeChannelExecutable();
    expect(channelExecutable).toBe('/opt/google/chrome/chrome');

    const preflight = read('infra/workflows/verify-system-chrome.sh');
    const browserModule = read(
      'infra/workflows/content-schema-registry-axe-browser.ts',
    );

    expect(preflight).toContain(`chrome_executable=${channelExecutable}`);
    expect(browserModule).toContain(
      `const PLAYWRIGHT_CHROME_CHANNEL_EXECUTABLE = '${channelExecutable}';`,
    );

    // A distributor wrapper is a different file than the channel target, so
    // accepting one let the preflight pass while Playwright still could not
    // launch Chrome.
    for (const source of [preflight, browserModule])
      expect(source).not.toContain('/usr/bin/google-chrome');
  });

  it('reports the executable Playwright launches and fails closed on wrapper fallbacks', () => {
    const resolved = spawnSync('bash', [chromePreflightPath], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    });
    expect(resolved.stderr).toBe('');
    expect(resolved.status).toBe(0);
    expect(resolved.stdout).toMatch(/Google Chrome \d+\.\d+\.\d+\.\d+/u);

    const reported = /^system_chrome=(.+)$/mu.exec(resolved.stdout)?.[1];
    expect(reported).toBe(playwrightChromeChannelExecutable());

    const preflight = read('infra/workflows/verify-system-chrome.sh');
    for (const rejected of [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/opt/google/chrome-beta/chrome',
      '/opt/google/chrome-unstable/chrome',
    ])
      expect(preflight, rejected).not.toContain(rejected);
    expect(preflight).toContain('bundled Chromium');
  });

  it('verifies system Google Chrome before browser gates in every workflow', () => {
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toContain('run: ' + chromePreflight);
    expect(ci.indexOf('Verify system Google Chrome')).toBeLessThan(
      ci.indexOf('Run browser and accessibility gates'),
    );

    const staging = read('.github/workflows/deploy-staging.yml');
    expect(staging).toContain('run: ' + chromePreflight);
    expect(staging.indexOf('Verify system Google Chrome')).toBeLessThan(
      staging.indexOf(
        'Verify public staging contracts and collect automated accessibility evidence',
      ),
    );
    expect(staging.indexOf('Verify system Google Chrome')).toBeGreaterThan(
      staging.indexOf('Deploy web SSR Worker staging artifact'),
    );

    const hosted = read('.github/workflows/run-ac265-hosted-e2e.yml');
    expect(hosted).toContain('run: ' + chromePreflight);
    expect(hosted.indexOf('Verify system Google Chrome')).toBeLessThan(
      hosted.indexOf('Issue a redacted runner authorization'),
    );

    for (const workflowPath of browserWorkflows)
      expect(read(workflowPath), workflowPath).not.toMatch(
        /playwright install/u,
      );
  });

  it('removes every bundled Chromium install and launch path from the repository', () => {
    const bundledInstall = scannedSources.filter((path) =>
      bundledBrowserInstall.test(read(path)),
    );
    expect(bundledInstall).toEqual([]);

    const chromiumProject = scannedSources.filter((path) =>
      /--project=chromium/u.test(read(path)),
    );
    expect(chromiumProject).toEqual([]);

    const bundledExecutablePath = [
      ...playwrightConfigs,
      ...browserWorkflows,
    ].filter((path) => /\.executablePath\(/u.test(read(path)));
    expect(bundledExecutablePath).toEqual([]);

    const chromiumProjectNames = scannedSources.filter(
      (path) =>
        !chromiumWireLiteralSources.includes(path) &&
        /name: 'chromium',/u.test(read(path)),
    );
    expect(chromiumProjectNames).toEqual([]);
  });

  it('scopes browser evidence commands to the Chrome project', () => {
    const evidenceMap = read(
      'tests/contracts/phase-02-slice-09-evidence-map.test.ts',
    );
    expect(evidenceMap).toContain('--project=chrome');
    expect(evidenceMap).not.toContain('--project=chromium');
  });
});
