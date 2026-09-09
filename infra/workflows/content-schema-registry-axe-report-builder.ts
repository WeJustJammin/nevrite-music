import { CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-automated-a11y.ts';
import {
  CONTENT_SCHEMA_REGISTRY_AUTOMATED_AXE_REPORT_SCHEMA_VERSION,
  type ContentSchemaRegistryAutomatedAxeReport,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-axe-report.ts';

import {
  assertExpectedAxeNavigation,
  targetForRequestedPath,
} from './content-schema-registry-axe-navigation.ts';
import type { AutomatedAxeBrowser } from './content-schema-registry-axe-browser.ts';

type AxeViolation = Readonly<{
  id: string;
  impact: string | null;
  nodes: readonly unknown[];
}>;

export type AxeAnalysisResult = Readonly<{
  violations: readonly AxeViolation[];
  incomplete: readonly unknown[];
  passes: readonly unknown[];
}>;

export type AxePageInput = Readonly<{
  requestedPath: string;
  finalPath: string;
  httpStatus: number | null;
  coverage: (typeof CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS)[number]['coverage'];
  axe: AxeAnalysisResult;
}>;

const AXE_IMPACTS = new Set(['minor', 'moderate', 'serious', 'critical']);

const normalizeImpact = (impact: string | null): string =>
  impact !== null && AXE_IMPACTS.has(impact) ? impact : 'unknown';

export const summarizeAxeResult = (result: AxeAnalysisResult) => {
  const violations = [...result.violations]
    .map((violation) => ({
      id: violation.id,
      impact: normalizeImpact(violation.impact),
      nodeCount: violation.nodes.length,
    }))
    .sort(
      (left, right) =>
        left.id.localeCompare(right.id) ||
        left.impact.localeCompare(right.impact),
    );
  return {
    violationCount: violations.length,
    seriousCount: violations.filter(({ impact }) => impact === 'serious')
      .length,
    criticalCount: violations.filter(({ impact }) => impact === 'critical')
      .length,
    incompleteCount: result.incomplete.length,
    passCount: result.passes.length,
    violations,
  } as const;
};

export const buildContentSchemaRegistryAutomatedAxeReport = (input: {
  sourceRevision: string;
  environment: 'staging' | 'production';
  deploymentId: string;
  webOrigin: string;
  browser: AutomatedAxeBrowser;
  startedAt: string;
  completedAt: string;
  pages: readonly AxePageInput[];
}): ContentSchemaRegistryAutomatedAxeReport => {
  for (const page of input.pages) {
    const target = targetForRequestedPath(page.requestedPath);
    assertExpectedAxeNavigation({
      requestedPath: page.requestedPath,
      finalPath: page.finalPath,
      httpStatus: page.httpStatus,
    });
    if (page.coverage !== target.coverage)
      throw new Error(
        `Automated axe path ${page.requestedPath} recorded ${page.coverage} coverage; expected ${target.coverage}.`,
      );
  }
  const pages = input.pages.map((page) => ({
    requestedPath: page.requestedPath,
    finalPath: page.finalPath,
    httpStatus: page.httpStatus,
    coverage: page.coverage,
    ...summarizeAxeResult(page.axe),
  }));
  const axeSerious = pages.reduce(
    (total, page) => total + page.seriousCount,
    0,
  );
  const axeCritical = pages.reduce(
    (total, page) => total + page.criticalCount,
    0,
  );
  return {
    criterion: 'P2-S09-AC-266',
    schemaVersion: CONTENT_SCHEMA_REGISTRY_AUTOMATED_AXE_REPORT_SCHEMA_VERSION,
    sourceRevision: input.sourceRevision,
    environment: input.environment,
    deploymentId: input.deploymentId,
    webOrigin: input.webOrigin,
    browser: input.browser,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    outcome: axeSerious === 0 && axeCritical === 0 ? 'passed' : 'failed',
    redacted: true,
    axeSerious,
    axeCritical,
    pages,
  } as ContentSchemaRegistryAutomatedAxeReport;
};
