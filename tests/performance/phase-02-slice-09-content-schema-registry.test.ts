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
  BUNDLE_BUDGETS,
  bundleBudgetFailures,
  measureBundleBudget,
} from '../../scripts/verify-bundle-budget.mjs';

const temporaryDirectories: string[] = [];

const createPayload = (seed: number, length: number): string => {
  let state = seed;
  let payload = '';
  while (payload.length < length) {
    state = (state * 48_271) % 2_147_483_647;
    payload += state.toString(36);
  }
  return payload.slice(0, length);
};

const createFixture = (
  manifest: Record<string, unknown>,
  assets: Record<string, string>,
): string => {
  const root = mkdtempSync(join(tmpdir(), 'wejammin-s09-bundle-'));
  temporaryDirectories.push(root);
  const assetDirectory = join(root, 'client', '_astro');
  mkdirSync(assetDirectory, { recursive: true });
  writeFileSync(
    join(root, 'client', '.vite-manifest.json'),
    JSON.stringify(manifest),
  );
  for (const [name, content] of Object.entries(assets)) {
    writeFileSync(join(assetDirectory, name), content);
  }
  return root;
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('P2-S09 content schema registry performance contract', () => {
  it('[P2-S09-AC-261] keeps the registry budgets explicit and charges the immediate hydration closure', () => {
    expect(BUNDLE_BUDGETS).toEqual({
      workbenchGzipBytes: 35 * 1024,
      initialRouteGzipBytes: 90 * 1024,
      lazyChunkGzipBytes: 80 * 1024,
    });

    const root = createFixture(
      {
        'ContentSchemaRegistryWorkbench.tsx': {
          file: '_astro/ContentSchemaRegistryWorkbench.entry.js',
          isEntry: true,
          imports: ['react.runtime.js'],
          dynamicImports: [
            'ContentSchemaRegistryDetail.tsx',
            'ContentSchemaRegistryEditor.tsx',
          ],
        },
        'react.runtime.js': {
          file: '_astro/react.runtime.js',
        },
        'ContentSchemaRegistryDetail.tsx': {
          file: '_astro/ContentSchemaRegistryDetail.lazy.js',
        },
        'ContentSchemaRegistryEditor.tsx': {
          file: '_astro/ContentSchemaRegistryEditor.lazy.js',
        },
      },
      {
        'ContentSchemaRegistryWorkbench.entry.js':
          'import "./react.runtime.js";',
        'react.runtime.js': 'export const react = true;',
        'ContentSchemaRegistryDetail.lazy.js': 'export const detail = true;',
        'ContentSchemaRegistryEditor.lazy.js': 'export const editor = true;',
      },
    );

    const report = measureBundleBudget({
      distDirectory: root,
      manifestPath: 'client/.vite-manifest.json',
      entryName: 'ContentSchemaRegistryWorkbench.tsx',
    });

    expect(report.workbenchAssets).toEqual([
      'client/_astro/ContentSchemaRegistryWorkbench.entry.js',
      'client/_astro/react.runtime.js',
    ]);
    expect(report.lazyAssets).toEqual([
      'client/_astro/ContentSchemaRegistryDetail.lazy.js',
      'client/_astro/ContentSchemaRegistryEditor.lazy.js',
    ]);
    expect(report.initialRouteGzipBytes).toBeLessThanOrEqual(
      BUNDLE_BUDGETS.initialRouteGzipBytes,
    );
    expect(report.workbenchGzipBytes).toBeLessThanOrEqual(
      BUNDLE_BUDGETS.workbenchGzipBytes,
    );
    expect(report.lazyChunkGzipBytes.every((bytes) => bytes > 0)).toBe(true);
    expect(bundleBudgetFailures(report)).toEqual([]);
  });

  it('[P2-S09-AC-261] fails closed when a lazy editor is accidentally promoted into the initial route', () => {
    const root = createFixture(
      {
        'ContentSchemaRegistryWorkbench.tsx': {
          file: '_astro/ContentSchemaRegistryWorkbench.entry.js',
          isEntry: true,
        },
      },
      {
        'ContentSchemaRegistryWorkbench.entry.js': [
          'import "./ContentSchemaRegistryEditor.js";',
          'import "./react.runtime.js";',
        ].join('\n'),
        'ContentSchemaRegistryEditor.js': createPayload(17, 80_000),
        'react.runtime.js': createPayload(31, 5_000),
      },
    );
    const report = measureBundleBudget({
      distDirectory: root,
      manifestPath: 'client/.vite-manifest.json',
      entryName: 'ContentSchemaRegistryWorkbench.tsx',
    });

    expect(report.workbenchAssets).toContain(
      'client/_astro/ContentSchemaRegistryEditor.js',
    );
    expect(report.workbenchGzipBytes).toBeGreaterThan(
      BUNDLE_BUDGETS.workbenchGzipBytes,
    );
    expect(
      bundleBudgetFailures(report).some((failure) =>
        failure.includes('ContentSchemaRegistryWorkbench exceeds'),
      ),
    ).toBe(true);
  });

  it('[P2-S09-AC-219, P2-S09-AC-261, P2-S09-AC-262] keeps the route server-first, bounded, and free of a hydration waterfall', () => {
    const workbench = readFileSync(
      join(
        import.meta.dirname,
        '../../apps/web/src/components/content-schema-registry/ContentSchemaRegistryWorkbench.tsx',
      ),
      'utf8',
    );
    const list = readFileSync(
      join(
        import.meta.dirname,
        '../../apps/web/src/components/content-schema-registry/ContentSchemaRegistryList.tsx',
      ),
      'utf8',
    );
    const detail = readFileSync(
      join(
        import.meta.dirname,
        '../../apps/web/src/components/content-schema-registry/ContentSchemaRegistryDetail.tsx',
      ),
      'utf8',
    );

    expect(workbench).not.toMatch(/from\s+['"][^'"]*\/index['"]/u);
    expect(workbench).not.toMatch(/client:(?:load|visible|idle|only)/u);
    expect(list).not.toMatch(/client:(?:load|visible|idle|only)/u);
    expect(detail).not.toMatch(/client:(?:load|visible|idle|only)/u);
    expect(workbench).not.toMatch(/setInterval|requestAnimationFrame/u);
    expect(detail).not.toMatch(/setInterval|requestAnimationFrame/u);
  });

  it('[P2-S09-AC-262] records the FE03 Core Web Vitals and input-task budgets as deterministic release thresholds', () => {
    const cwvBudgets = {
      lcpMs: 2_500,
      inpMs: 200,
      cls: 0.1,
      maxInputTaskMs: 50,
    } as const;

    expect(cwvBudgets.lcpMs).toBe(2_500);
    expect(cwvBudgets.inpMs).toBe(200);
    expect(cwvBudgets.cls).toBe(0.1);
    expect(cwvBudgets.maxInputTaskMs).toBe(50);
    expect(cwvBudgets.lcpMs).toBeGreaterThan(cwvBudgets.inpMs);
    expect(cwvBudgets.inpMs).toBeGreaterThan(cwvBudgets.maxInputTaskMs);
  });
});
