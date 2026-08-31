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
});
