import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  bundleBudgetFailures,
  formatBundleBudgetEvidence,
  measureBundleBudget,
  type BundleBudgetReport,
} from '../../scripts/verify-bundle-budget.mjs';

const temporaryDirectories: string[] = [];

const createFixture = (manifest: string, assets: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), 'wejammin-bundle-budget-'));
  temporaryDirectories.push(root);
  const assetDirectory = join(root, 'client', '_astro');
  mkdirSync(assetDirectory, { recursive: true });
  writeFileSync(join(root, 'client', '.vite-manifest.json'), manifest);
  for (const [name, content] of Object.entries(assets)) {
    writeFileSync(join(assetDirectory, name), content);
  }
  return root;
};

const createPayload = (seed: number, length: number) => {
  let state = seed;
  let payload = '';
  while (payload.length < length) {
    state = (state * 48271) % 2_147_483_647;
    payload += state.toString(36);
  }
  return payload.slice(0, length);
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('built bundle budget measurement', () => {
  it('places every browser lazy entry behind an explicit Suspense boundary', () => {
    const workbench = readFileSync(
      join(
        import.meta.dirname,
        '../../apps/web/src/components/infrastructure/InfrastructureWorkbench.tsx',
      ),
      'utf8',
    );
    const content = readFileSync(
      join(
        import.meta.dirname,
        '../../apps/web/src/components/infrastructure/InfrastructureWorkbenchContent.tsx',
      ),
      'utf8',
    );

    expect(workbench).toContain('<Suspense');
    expect(content).toContain('<Suspense');
  });

  it('promotes the manifest-declared hydration runtime while excluding click-gated imports', () => {
    const root = createFixture(
      JSON.stringify({
        'InfrastructureWorkbench.tsx': {
          file: '_astro/InfrastructureWorkbench.entry.js',
          isEntry: true,
          imports: ['client-runtime.js'],
          dynamicImports: ['InfrastructureWorkbenchRuntime.tsx'],
        },
        'client-runtime.js': {
          file: '_astro/client-runtime.js',
          isEntry: true,
        },
        'InfrastructureWorkbenchRuntime.tsx': {
          file: '_astro/InfrastructureWorkbenchRuntime.runtime.js',
          imports: ['workbench-core.js'],
          dynamicImports: ['InfrastructureWorkbench.jobs.js'],
        },
        'workbench-core.js': {
          file: '_astro/workbench-core.js',
        },
        'InfrastructureWorkbench.jobs.js': {
          file: '_astro/InfrastructureWorkbench.jobs.js',
        },
      }),
      {
        'InfrastructureWorkbench.entry.js':
          'import("./InfrastructureWorkbenchRuntime.runtime.js");',
        'InfrastructureWorkbenchRuntime.runtime.js': [
          'import "./workbench-core.js";',
          'import("./InfrastructureWorkbench.jobs.js");',
        ].join(''),
        'client-runtime.js': 'runtime'.repeat(1_000),
        'workbench-core.js': 'core'.repeat(1_000),
        'InfrastructureWorkbench.jobs.js': 'lazy'.repeat(3_000),
      },
    );

    const report: BundleBudgetReport = measureBundleBudget({
      distDirectory: root,
      manifestPath: 'client/.vite-manifest.json',
      entryName: 'InfrastructureWorkbench.tsx',
    });

    expect(report.initialAssets).toEqual([
      'client/_astro/InfrastructureWorkbench.entry.js',
      'client/_astro/InfrastructureWorkbenchRuntime.runtime.js',
      'client/_astro/client-runtime.js',
      'client/_astro/workbench-core.js',
    ]);
    expect(report.lazyAssets).toEqual([
      'client/_astro/InfrastructureWorkbench.jobs.js',
    ]);
    expect(report.initialRouteGzipBytes).toBeLessThan(
      report.allClientGzipBytes,
    );
    expect(report.lazyChunkGzipBytes).toHaveLength(1);
  });

  it('reports the workbench and route caps without treating lazy chunks as initial', () => {
    const root = createFixture(
      JSON.stringify({
        'InfrastructureWorkbench.tsx': {
          file: '_astro/InfrastructureWorkbench.entry.js',
          isEntry: true,
        },
      }),
      {
        'InfrastructureWorkbench.entry.js': 'entry'.repeat(1_000),
      },
    );

    const report = measureBundleBudget({
      distDirectory: root,
      manifestPath: 'client/.vite-manifest.json',
      entryName: 'InfrastructureWorkbench.tsx',
    });

    expect(report.budgets).toEqual({
      workbenchGzipBytes: 35 * 1024,
      initialRouteGzipBytes: 90 * 1024,
      lazyChunkGzipBytes: 80 * 1024,
    });
    expect(report.workbenchGzipBytes).toBeGreaterThan(0);
    expect(report.initialRouteGzipBytes).toBe(report.workbenchGzipBytes);
  });

  it('emits immutable promotion fields alongside the budget report', () => {
    const root = createFixture(
      JSON.stringify({
        'InfrastructureWorkbench.tsx': {
          file: '_astro/InfrastructureWorkbench.entry.js',
          isEntry: true,
        },
      }),
      {
        'InfrastructureWorkbench.entry.js': 'entry'.repeat(1_000),
      },
    );
    const report = measureBundleBudget({
      distDirectory: root,
      manifestPath: 'client/.vite-manifest.json',
    });
    const evidence = formatBundleBudgetEvidence(report, 'a'.repeat(40));

    expect(evidence).toMatchObject({
      sourceRevision: 'a'.repeat(40),
      thresholds: report.budgets,
      passed: true,
    });
  });

  it('walks the initial static closure, hydration runtime, and route script without counting deferred chunks', () => {
    const root = createFixture('', {
      'InfrastructureWorkbench.entry.js': [
        'import "./react.runtime.js";',
        'import("./InfrastructureWorkbenchRuntime.runtime.js");',
      ].join(''),
      'InfrastructureWorkbenchRuntime.runtime.js': [
        'import "./workbench-core.js";',
        'import("./UploadAdmissionForm.deferred.js");',
      ].join(''),
      '_recordId_.astro_astro_type_script_index_0_lang.route.js':
        'import "./route-heading-focus.js";',
      'client.runtime.js': 'import "./react.runtime.js";',
      'react.runtime.js': 'export const react = true;',
      'route-heading-focus.js': 'export const heading = true;',
      'workbench-core.js': 'export const core = true;',
      'UploadAdmissionForm.deferred.js': 'export const editor = true;',
    });

    const report = measureBundleBudget({ distDirectory: root });

    expect(report.initialAssets).toEqual([
      'client/_astro/InfrastructureWorkbench.entry.js',
      'client/_astro/InfrastructureWorkbenchRuntime.runtime.js',
      'client/_astro/_recordId_.astro_astro_type_script_index_0_lang.route.js',
      'client/_astro/client.runtime.js',
      'client/_astro/react.runtime.js',
      'client/_astro/route-heading-focus.js',
      'client/_astro/workbench-core.js',
    ]);
    expect(report.lazyAssets).toEqual([
      'client/_astro/UploadAdmissionForm.deferred.js',
    ]);
  });

  it('[P2-S07-AC-174] measures the platform-configuration island and its route independently', () => {
    const root = createFixture('', {
      'SettingsFlagsRuntimeWorkbench.entry.js': [
        'import("./SettingsFlagsRuntimeWorkbenchRuntime.runtime.js");',
      ].join(''),
      'SettingsFlagsRuntimeWorkbenchRuntime.runtime.js': [
        'import "./react.runtime.js";',
        'import "./settings-core.js";',
        'const label = `${true ? `nested` : `fallback`}`;',
        'const normalized = (value) => value.trim().replace(/^W\\//u, ``).replace(/^"|"$/gu, ``);',
        'const loadValidation = async () => await import(`./settings-validation.deferred.js`);',
      ].join(''),
      'PlatformConfigurationAdminRoute.astro_astro_type_script_index_0_lang.route.js':
        'import "./route-heading-focus.js";',
      'client.runtime.js': 'import "./react.runtime.js";',
      'react.runtime.js': 'export const react = true;',
      'route-heading-focus.js': 'export const heading = true;',
      'settings-core.js': 'export const settings = true;',
      'settings-validation.deferred.js': 'export const validate = () => true;',
    });

    const report = measureBundleBudget({
      distDirectory: root,
      entryName: 'SettingsFlagsRuntimeWorkbench.tsx',
    });

    expect(report.workbench.path).toBe(
      'client/_astro/SettingsFlagsRuntimeWorkbench.entry.js',
    );
    expect(report.workbenchAssets).toContain(
      'client/_astro/SettingsFlagsRuntimeWorkbenchRuntime.runtime.js',
    );
    expect(report.initialAssets).toContain(
      'client/_astro/PlatformConfigurationAdminRoute.astro_astro_type_script_index_0_lang.route.js',
    );
    expect(report.workbenchGzipBytes).toBeLessThanOrEqual(
      report.budgets.workbenchGzipBytes,
    );
    expect(report.initialRouteGzipBytes).toBeLessThanOrEqual(
      report.budgets.initialRouteGzipBytes,
    );
    expect(report.lazyAssets).toEqual([
      'client/_astro/settings-validation.deferred.js',
    ]);
    expect(report.lazyChunkGzipBytes).toHaveLength(1);
  });

  it('charges the Workbench budget for the complete immediate hydration closure', () => {
    const root = createFixture(
      JSON.stringify({
        'InfrastructureWorkbench.tsx': {
          file: '_astro/InfrastructureWorkbench.entry.js',
          isEntry: true,
        },
      }),
      {
        'InfrastructureWorkbench.entry.js':
          'import("./InfrastructureWorkbenchRuntime.runtime.js");',
        'InfrastructureWorkbenchRuntime.runtime.js': [
          'import "./workbench-core.js";',
          createPayload(17, 30_000),
        ].join(''),
        'workbench-core.js': createPayload(31, 30_000),
      },
    );

    const report = measureBundleBudget({
      distDirectory: root,
      manifestPath: 'client/.vite-manifest.json',
      entryName: 'InfrastructureWorkbench.tsx',
    });

    expect(report.workbenchAssets).toEqual([
      'client/_astro/InfrastructureWorkbench.entry.js',
      'client/_astro/InfrastructureWorkbenchRuntime.runtime.js',
      'client/_astro/workbench-core.js',
    ]);
    expect(report.workbenchGzipBytes).toBeGreaterThan(
      report.workbench.gzipBytes,
    );
    expect(report.workbenchGzipBytes).toBeGreaterThan(
      report.budgets.workbenchGzipBytes,
    );
    expect(bundleBudgetFailures(report)).toContain(
      `InfrastructureWorkbench exceeds ${report.budgets.workbenchGzipBytes} gzip bytes: ${report.workbenchGzipBytes}`,
    );
  });

  it('ignores import-like text inside comments and string literals', () => {
    const root = createFixture(
      JSON.stringify({
        'InfrastructureWorkbench.tsx': {
          file: '_astro/InfrastructureWorkbench.entry.js',
          isEntry: true,
        },
      }),
      {
        'InfrastructureWorkbench.entry.js': [
          '// import "./missing-comment.js";',
          `const marker = 'import("./missing-string.js")';`,
          'import("./InfrastructureWorkbenchRuntime.runtime.js");',
        ].join('\n'),
        'InfrastructureWorkbenchRuntime.runtime.js':
          'export const runtime = true;',
      },
    );

    const report = measureBundleBudget({
      distDirectory: root,
      manifestPath: 'client/.vite-manifest.json',
      entryName: 'InfrastructureWorkbench.tsx',
    });

    expect(report.initialAssets).toEqual([
      'client/_astro/InfrastructureWorkbench.entry.js',
      'client/_astro/InfrastructureWorkbenchRuntime.runtime.js',
    ]);
    expect(report.lazyAssets).toEqual([]);
  });
});
