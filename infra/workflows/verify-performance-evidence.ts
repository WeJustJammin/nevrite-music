import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  RELEASE_API_P95_THRESHOLDS,
  RELEASE_BUNDLE_BUDGET_THRESHOLDS,
  ReleasePerformanceEvidenceSchema,
  type ReleasePerformanceEvidence,
} from '../../packages/contracts/src/release-artifact.ts';

const SOURCE_REVISION_PATTERN = /^[a-f0-9]{40}$/;

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, 'utf8')) as unknown;

/**
 * Validate the performance reports that may authorize a promotion. Reports
 * are tied to the exact build revision and the locked Phase 1 thresholds;
 * passing a report with a weakened threshold is therefore impossible.
 */
export const verifyPerformanceEvidence = (
  evidence: unknown,
  expectedSourceRevision: string,
): ReleasePerformanceEvidence => {
  if (!SOURCE_REVISION_PATTERN.test(expectedSourceRevision)) {
    throw new Error('Performance evidence source revision must be a full SHA.');
  }
  const parsed = ReleasePerformanceEvidenceSchema.safeParse(evidence);
  if (!parsed.success) {
    throw new Error('Performance promotion evidence is invalid.');
  }
  const performance = parsed.data;
  const { bundleBudget, apiP95 } = performance;
  if (
    bundleBudget.sourceRevision !== expectedSourceRevision ||
    apiP95.sourceRevision !== expectedSourceRevision
  ) {
    throw new Error('Performance evidence does not match the promoted SHA.');
  }
  if (
    bundleBudget.thresholds.workbenchGzipBytes !==
      RELEASE_BUNDLE_BUDGET_THRESHOLDS.workbenchGzipBytes ||
    bundleBudget.thresholds.initialRouteGzipBytes !==
      RELEASE_BUNDLE_BUDGET_THRESHOLDS.initialRouteGzipBytes ||
    bundleBudget.thresholds.lazyChunkGzipBytes !==
      RELEASE_BUNDLE_BUDGET_THRESHOLDS.lazyChunkGzipBytes ||
    bundleBudget.workbenchGzipBytes >
      RELEASE_BUNDLE_BUDGET_THRESHOLDS.workbenchGzipBytes ||
    bundleBudget.initialRouteGzipBytes >
      RELEASE_BUNDLE_BUDGET_THRESHOLDS.initialRouteGzipBytes ||
    bundleBudget.lazyChunkGzipBytes.some(
      (bytes) => bytes > RELEASE_BUNDLE_BUDGET_THRESHOLDS.lazyChunkGzipBytes,
    )
  ) {
    throw new Error('Bundle budget evidence exceeds its locked thresholds.');
  }
  if (
    apiP95.thresholds.p95Ms !== RELEASE_API_P95_THRESHOLDS.p95Ms ||
    apiP95.p95Ms >= RELEASE_API_P95_THRESHOLDS.p95Ms
  ) {
    throw new Error('API p95 evidence exceeds its locked threshold.');
  }
  return performance;
};

export const verifyPerformanceEvidenceFiles = ({
  bundlePath,
  p95Path,
  expectedSourceRevision,
}: Readonly<{
  bundlePath: string;
  p95Path: string;
  expectedSourceRevision: string;
}>): ReleasePerformanceEvidence =>
  verifyPerformanceEvidence(
    {
      bundleBudget: readJson(bundlePath),
      apiP95: readJson(p95Path),
    },
    expectedSourceRevision,
  );

const run = (): void => {
  const [bundlePath, p95Path, expectedSourceRevision] = process.argv.slice(2);
  if (!bundlePath || !p95Path || !expectedSourceRevision) {
    throw new Error(
      'Usage: verify-performance-evidence.ts <bundle-json> <p95-json> <source-sha>',
    );
  }
  verifyPerformanceEvidenceFiles({
    bundlePath,
    p95Path,
    expectedSourceRevision,
  });
  console.log('performance_promotion_evidence=passed');
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(entrypoint).href
) {
  run();
}
