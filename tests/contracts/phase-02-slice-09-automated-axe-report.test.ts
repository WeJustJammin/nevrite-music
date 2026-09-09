import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_PATHS,
  CONTENT_SCHEMA_REGISTRY_AUTOMATED_AXE_REPORT_SCHEMA_VERSION,
  ContentSchemaRegistryAutomatedAxeReportSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-automated-a11y.ts';
import {
  validateContentSchemaRegistryAutomatedAxeReport,
  validateContentSchemaRegistryAutomatedAxeReportBytes,
} from '../../infra/workflows/content-schema-registry-axe-report-verifier.ts';
import {
  deploymentId,
  expectedIdentity,
  report,
  sourceRevision,
  startedAt,
  webOrigin,
} from './phase-02-slice-09-automated-axe-report.test-support.ts';

describe('Slice 09 AC266 automated axe report contract', () => {
  it('builds the strict redacted report for every canonical hosted path', () => {
    expect(report).toMatchObject({
      criterion: 'P2-S09-AC-266',
      schemaVersion:
        CONTENT_SCHEMA_REGISTRY_AUTOMATED_AXE_REPORT_SCHEMA_VERSION,
      sourceRevision,
      environment: 'staging',
      deploymentId,
      webOrigin,
      browser: { name: 'chromium', version: '123.0.0.0' },
      outcome: 'passed',
      redacted: true,
      axeSerious: 0,
      axeCritical: 0,
      pages: CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_PATHS.map((path) =>
        expect.objectContaining({
          requestedPath: path,
          finalPath: CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS.find(
            (target) => target.requestedPath === path,
          )?.expectedFinalPath,
          httpStatus: 200,
          coverage: CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_TARGETS.find(
            (target) => target.requestedPath === path,
          )?.coverage,
          seriousCount: 0,
          criticalCount: 0,
          violationCount: 0,
          incompleteCount: 1,
          passCount: 1,
        }),
      ),
    });
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(report).success,
    ).toBe(true);
  });

  it('persists a bounded pinned Chromium identity', () => {
    expect(report.browser).toEqual({
      name: 'chromium',
      version: '123.0.0.0',
    });
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse({
        ...report,
        browser: { name: 'webkit', version: '123.0.0.0' },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse({
        ...report,
        browser: { name: 'chromium', version: 'unbounded version' },
      }).success,
    ).toBe(false);
  });

  it('schema rejects redirect, error, null-status, and coverage-mismatch pages', () => {
    const replacePage = (
      requestedPath: string,
      replacement: Record<string, unknown>,
    ) => ({
      ...report,
      pages: report.pages.map((page) =>
        page.requestedPath === requestedPath
          ? { ...page, ...replacement }
          : page,
      ),
    });

    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(
        replacePage('/app/cms-content-modeling', {
          finalPath: '/app/cms-content-modeling',
        }),
      ).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(
        replacePage('/auth/sign-in', { httpStatus: 404 }),
      ).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(
        replacePage('/auth/sign-in', { httpStatus: 500 }),
      ).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(
        replacePage('/auth/sign-in', { httpStatus: null }),
      ).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(
        replacePage('/app/cms-content-modeling', { coverage: 'page' }),
      ).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(
        replacePage('/', { requestedPath: '/not-a-canonical-target' }),
      ).success,
    ).toBe(false);
  });

  it('rejects missing, duplicate, or mismatched canonical paths', () => {
    const missing = {
      ...report,
      pages: report.pages.slice(1),
    };
    const duplicate = {
      ...report,
      pages: report.pages.map((page) => ({
        ...page,
        requestedPath: CONTENT_SCHEMA_REGISTRY_AUTOMATED_A11Y_PATHS[0],
      })),
    };
    const mismatchedCounts = {
      ...report,
      axeSerious: 1,
    };

    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(missing).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(duplicate)
        .success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(mismatchedCounts)
        .success,
    ).toBe(false);
  });

  it('rejects inconsistent page counts, critical totals, outcomes, and chronology', () => {
    const validFailure = {
      ...report,
      outcome: 'failed' as const,
      axeSerious: 1,
      axeCritical: 1,
      pages: report.pages.map((page, index) =>
        index === 0
          ? {
              ...page,
              violationCount: 2,
              seriousCount: 1,
              criticalCount: 1,
              violations: [
                {
                  id: 'color-contrast',
                  impact: 'serious' as const,
                  nodeCount: 1,
                },
                { id: 'aria-roles', impact: 'critical' as const, nodeCount: 1 },
              ],
            }
          : page,
      ),
    };
    const inconsistentPage = {
      ...report,
      pages: report.pages.map((page, index) =>
        index === 0
          ? {
              ...page,
              violationCount: 1,
              seriousCount: 1,
              criticalCount: 1,
            }
          : page,
      ),
    };
    const completedBeforeStarted = {
      ...report,
      completedAt: startedAt,
    };

    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(validFailure)
        .success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(inconsistentPage)
        .success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(
        completedBeforeStarted,
      ).success,
    ).toBe(false);
  });

  it('binds retained bytes to the exact hosted identity and sidecar counts', () => {
    const accessibility = {
      environment: 'staging' as const,
      deploymentId,
      webOrigin,
      axeSerious: 0 as const,
      axeCritical: 0 as const,
    };
    const bytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
    const digest = createHash('sha256').update(bytes).digest('hex');

    expect(
      validateContentSchemaRegistryAutomatedAxeReportBytes(
        bytes,
        digest,
        accessibility,
        expectedIdentity,
      ),
    ).toEqual(report);
    expect(() =>
      validateContentSchemaRegistryAutomatedAxeReport(
        { ...report, deploymentId: 'different-deployment' },
        accessibility,
        expectedIdentity,
      ),
    ).toThrow('Automated axe report does not match the expected deployment');
    expect(() =>
      validateContentSchemaRegistryAutomatedAxeReportBytes(
        bytes,
        'b'.repeat(64),
        accessibility,
        expectedIdentity,
      ),
    ).toThrow('Retained report digest does not match: automated accessibility');
  });

  it('enforces hosted deployment and trusted cutoff chronology', () => {
    expect(() =>
      validateContentSchemaRegistryAutomatedAxeReport(
        {
          ...report,
          startedAt: '2026-09-08T12:59:59.000Z',
          completedAt: '2026-09-08T13:00:01.000Z',
        },
        undefined,
        expectedIdentity,
      ),
    ).toThrow('Automated axe report predates the expected hosted deployment');
    expect(() =>
      validateContentSchemaRegistryAutomatedAxeReport(
        {
          ...report,
          completedAt: '2026-09-08T13:11:01.000Z',
        },
        undefined,
        expectedIdentity,
      ),
    ).toThrow('Automated axe report exceeds the trusted cutoff');
    expect(() =>
      validateContentSchemaRegistryAutomatedAxeReport(report, undefined, {
        ...expectedIdentity,
        hostedDeployedAt: '2026-09-08T13:12:00.000Z',
      }),
    ).toThrow('Automated axe expected identity time bounds are invalid');
  });

  it('retains the report at the fixed accessibility path without writing manual evidence', () => {
    const root = mkdtempSync(join(tmpdir(), 'wejammin-ac266-axe-'));
    try {
      const reportPath = join(root, 'accessibility/axe.json');
      mkdirSync(join(root, 'accessibility'), { recursive: true });
      writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      expect(readFileSync(reportPath, 'utf8')).toContain(
        'ac266-automated-axe-v1',
      );
      expect(readFileSync(reportPath, 'utf8')).not.toContain('voiceover');
      expect(readFileSync(reportPath, 'utf8')).not.toContain('nvda');
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});
