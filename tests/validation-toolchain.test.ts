import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createE2EFixture } from '@wejammin/test-support';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const readRepositoryFile = (relativePath: string): string =>
  readFileSync(resolve(repositoryRoot, relativePath), 'utf8');

const readRepositoryJson = (relativePath: string): Record<string, unknown> =>
  JSON.parse(readRepositoryFile(relativePath)) as Record<string, unknown>;

const runNode = (relativePath: string, ...arguments_: string[]): string =>
  execFileSync(process.execPath, [relativePath, ...arguments_], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

describe('validation toolchain contracts', () => {
  it('removes the color-environment conflict before Playwright launches children', async () => {
    const previousNoColor = process.env.NO_COLOR;
    const previousAstroBackground = process.env.ASTRO_DEV_BACKGROUND;

    try {
      process.env.NO_COLOR = '1';
      await import('../playwright.config');

      expect(process.env.NO_COLOR).toBeUndefined();
    } finally {
      if (previousNoColor === undefined) {
        delete process.env.NO_COLOR;
      } else {
        process.env.NO_COLOR = previousNoColor;
      }

      if (previousAstroBackground === undefined) {
        delete process.env.ASTRO_DEV_BACKGROUND;
      } else {
        process.env.ASTRO_DEV_BACKGROUND = previousAstroBackground;
      }
    }
  });

  it('declares each local test project and the managed E2E server boundary', () => {
    const vitest = readRepositoryFile('vitest.config.ts');
    const playwright = readRepositoryFile('playwright.config.ts');
    const webAstro = readRepositoryFile('apps/web/astro.config.mjs');
    const e2e = readRepositoryFile('tests/e2e/scaffold.spec.ts');
    const fixture = createE2EFixture();

    for (const projectPath of [
      'tests/contracts',
      'tests/integration',
      'tests/accessibility',
      'tests/performance',
      'tests/security',
    ]) {
      expect(existsSync(resolve(repositoryRoot, projectPath))).toBe(true);
    }
    for (const unitTest of [
      'packages/contracts/src/core-contracts.test.ts',
      'packages/observability/src/logging.test.ts',
    ]) {
      expect(existsSync(resolve(repositoryRoot, unitTest))).toBe(true);
    }

    expect(vitest).toContain("'tests/contracts/**/*.test.ts'");
    expect(vitest).toContain("'tests/integration/**/*.test.ts'");
    expect(vitest).toContain("'tests/accessibility/**/*.test.ts'");
    expect(vitest).toContain("'tests/performance/**/*.test.ts'");
    expect(vitest).toContain("'tests/security/**/*.test.ts'");
    expect(playwright).toContain("testDir: './tests/e2e'");
    expect(playwright).toContain("name: 'chromium'");
    expect(playwright).toContain('const ciRunId = process.env.GITHUB_RUN_ID;');
    expect(playwright).toContain('BigInt(ciRunId) % 10_000n');
    expect(playwright).toContain('30_000 + ciPortSlot * 2');
    expect(playwright).toContain('--port ${webPort}');
    expect(playwright).toContain('--port ${docsPort}');
    expect(playwright).toContain('metadata: { docsOrigin }');
    expect(playwright).toContain('baseURL: webOrigin');
    expect(playwright).toContain(
      `const webPort = ciPortSlot === undefined ? ${new URL(fixture.baseUrl).port}`,
    );
    expect(e2e).toContain("metadata['docsOrigin']");
    expect(e2e).not.toContain('http://127.0.0.1:4322');
    expect(webAstro).toContain("'GITHUB_RUN_ID' in runtimeProcess.env");
    expect(webAstro).toContain('inspectorPort: false');
    expect(webAstro).toContain('persistState: false');
    expect(e2e).toContain(fixture.title);
    expect(e2e).toContain(fixture.heading);
    expect(e2e).toContain(fixture.statusText);
  });

  it('keeps OpenAPI output generated from the contract authority', () => {
    expect(() =>
      runNode('infra/generate-openapi.mjs', '--check'),
    ).not.toThrow();

    const document = readRepositoryJson('docs/openapi/openapi.json');
    const paths = document.paths;
    const components = document.components;

    expect(document.openapi).toBe('3.1.0');
    expect(paths).toMatchObject({
      '/api/v1/health': expect.any(Object),
      '/api/v1/ready': expect.any(Object),
      '/api/v1/internal/diagnostics': expect.any(Object),
    });
    expect(components).toMatchObject({
      schemas: expect.objectContaining({
        ApiError: expect.any(Object),
        HealthResponse: expect.any(Object),
        ReadinessResponse: expect.any(Object),
        RequestContext: expect.any(Object),
      }),
    });
    expect(JSON.stringify(document)).not.toMatch(/\{\{[^}]+\}\}/);
  });

  it('keeps database type drift and generated artifact checks reviewable', () => {
    const syncTypes = readRepositoryFile('infra/sync-database-types.mjs');
    const databaseTypes = readRepositoryFile(
      'packages/data-access/src/database.types.ts',
    );
    const packageJson = readRepositoryJson('package.json');
    const scripts = packageJson.scripts as Record<string, string>;
    const ciWorkflow = readRepositoryFile('.github/workflows/ci.yml');
    const stagingWorkflow = readRepositoryFile(
      '.github/workflows/deploy-staging.yml',
    );
    const sliceProgress = readRepositoryFile(
      '.memory/pipeline/progress/slices/phase-01-slice-01.md',
    );

    expect(syncTypes).toContain('packages/data-access/src/database.types.ts');
    expect(syncTypes).toContain("process.argv.includes('--check')");
    expect(syncTypes).toContain('Generated database types are stale');
    expect(databaseTypes).toContain('export type Database');
    expect(
      existsSync(resolve(repositoryRoot, 'docs/openapi/openapi.json')),
    ).toBe(true);
    expect(
      existsSync(
        resolve(repositoryRoot, 'packages/data-access/src/database.types.ts'),
      ),
    ).toBe(true);
    expect(scripts).toMatchObject({
      'contracts:check': 'node infra/generate-openapi.mjs --check',
      'db:types:check': 'node infra/sync-database-types.mjs --check',
      'bundle:check': 'node scripts/verify-bundle-budget.mjs',
      'performance:smoke':
        'node infra/performance/api-p95-smoke.mjs --mode local',
    });
    expect(typeof scripts.validate).toBe('string');
    expect(scripts.validate).toContain('contracts:check');
    expect(scripts.validate).toContain('db:types:check');
    expect(scripts.validate).toContain('pnpm bundle:check');
    expect(scripts.validate).toContain('pnpm performance:smoke');
    expect(scripts.validate.indexOf('pnpm build')).toBeLessThan(
      scripts.validate.indexOf('pnpm bundle:check'),
    );
    expect(ciWorkflow).toContain('pnpm bundle:check');
    expect(ciWorkflow).toContain('pnpm performance:smoke');
    expect(stagingWorkflow).toContain('pnpm performance:smoke:staging');

    const acceptanceIds = [...sliceProgress.matchAll(/P1-S01-AC-\d{3}/g)].map(
      (match) => match[0],
    );
    expect(new Set(acceptanceIds).size).toBe(24);
    expect(sliceProgress).toContain('**Spec depth floor**: 0');
    expect(sliceProgress).not.toMatch(/\{\{[^}]+\}\}/);
  });
});
