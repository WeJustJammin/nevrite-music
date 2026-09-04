import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { verifyPerformanceEvidence } from '../infra/workflows/verify-performance-evidence.ts';

const sourceRevision = 'a'.repeat(40);

const performanceEvidence = {
  bundleBudget: {
    sourceRevision,
    thresholds: {
      workbenchGzipBytes: 35 * 1024,
      initialRouteGzipBytes: 90 * 1024,
      lazyChunkGzipBytes: 80 * 1024,
    },
    passed: true,
    workbenchGzipBytes: 1024,
    initialRouteGzipBytes: 2048,
    lazyChunkGzipBytes: [512],
  },
  apiP95: {
    sourceRevision,
    thresholds: { p95Ms: 500 },
    passed: true,
    errors: 0,
    p50Ms: 2,
    p95Ms: 4,
    p99Ms: 5,
    samples: 20,
    thresholdFailures: [],
    iterations: 20,
    retries: 0,
    virtualUsers: 1,
    profile: 'phase-1-api-p95-smoke',
    fixtureVersion: 'phase-1-2026-08-31',
    mode: 'staging' as const,
  },
} as const;

describe('promotion performance evidence', () => {
  it('accepts passing bundle and p95 evidence bound to the promoted SHA', () => {
    expect(
      verifyPerformanceEvidence(performanceEvidence, sourceRevision),
    ).toMatchObject({
      bundleBudget: { passed: true, sourceRevision },
      apiP95: { passed: true, sourceRevision },
    });
  });

  it.each([
    ['source SHA drift', { apiP95: { sourceRevision: 'b'.repeat(40) } }],
    [
      'bundle threshold drift',
      { bundleBudget: { thresholds: { workbenchGzipBytes: 1 } } },
    ],
    ['bundle pass flag', { bundleBudget: { passed: false } }],
    ['p95 threshold drift', { apiP95: { thresholds: { p95Ms: 501 } } }],
    ['p95 pass flag', { apiP95: { passed: false } }],
  ])('rejects %s before promotion', (_name, patch) => {
    const candidate = {
      ...performanceEvidence,
      bundleBudget: {
        ...performanceEvidence.bundleBudget,
        ...patch.bundleBudget,
      },
      apiP95: { ...performanceEvidence.apiP95, ...patch.apiP95 },
    };
    expect(() => verifyPerformanceEvidence(candidate, sourceRevision)).toThrow(
      'Performance',
    );
  });

  it('rejects a passing report whose measured p95 exceeds the locked threshold', () => {
    expect(() =>
      verifyPerformanceEvidence(
        {
          ...performanceEvidence,
          apiP95: { ...performanceEvidence.apiP95, p95Ms: 500 },
        },
        sourceRevision,
      ),
    ).toThrow('API p95 evidence exceeds its locked threshold');
  });

  it('executes the performance evidence CLI when invoked through a symlink', () => {
    const sandbox = mkdtempSync(
      join(tmpdir(), 'wejammin-performance-evidence-'),
    );
    try {
      const verifierPath = fileURLToPath(
        new URL(
          '../infra/workflows/verify-performance-evidence.ts',
          import.meta.url,
        ),
      );
      const symlinkedVerifierPath = join(
        sandbox,
        'verify-performance-evidence.ts',
      );
      symlinkSync(verifierPath, symlinkedVerifierPath);
      const result = spawnSync(
        process.execPath,
        ['--experimental-strip-types', symlinkedVerifierPath],
        { encoding: 'utf8' },
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('Usage: verify-performance-evidence.ts');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('can be imported when the importing program is read from stdin', () => {
    const verifierUrl = new URL(
      '../infra/workflows/verify-performance-evidence.ts',
      import.meta.url,
    ).href;
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '-', sourceRevision],
      {
        encoding: 'utf8',
        input: `import ${JSON.stringify(verifierUrl)};\nif (process.argv[2] !== ${JSON.stringify(sourceRevision)}) process.exit(2);\nconsole.log('stdin_import=passed');\n`,
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('stdin_import=passed\n');
    expect(result.stderr).toBe('');
  });
});
