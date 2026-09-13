import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryManualAccessibilityReportSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-manual-accessibility-report.ts';
import { createManualAccessibilityReport } from './phase-02-slice-09-manual-accessibility-report-fixture.ts';

type CheckInput = { check: string; observation: Record<string, unknown> };
type ReportInput = Record<string, unknown> & { checks: readonly CheckInput[] };

const reportFor = (
  platform?: 'mac_safari_voiceover' | 'windows_firefox_nvda',
) => createManualAccessibilityReport(platform) as unknown as ReportInput;

const replaceObservation = (
  report: ReportInput,
  name: string,
  observation: Record<string, unknown>,
): ReportInput => ({
  ...report,
  checks: report.checks.map((check) =>
    check.check === name ? { ...check, observation } : check,
  ),
});

const validTargets = Array.from({ length: 12 }, (_, index) => ({
  targetId: `tgt_${index.toString(16).padStart(16, '0')}`,
  widthCssPx: index === 11 ? 20 : 48,
  heightCssPx: index === 11 ? 20 : 48,
  exceptionKind: index === 11 ? 'spacing' : null,
}));

describe('Slice 09 AC266 manual report contract hardening', () => {
  it('binds bounded product-family versions to each declared platform', () => {
    const mac = reportFor('mac_safari_voiceover');
    const windows = reportFor('windows_firefox_nvda');

    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(mac)
        .success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse({
        ...mac,
        osVersion: 'macos-26.0',
      }).success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(windows)
        .success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse({
        ...mac,
        browserVersion: 'firefox-142.0',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse({
        ...windows,
        screenReaderVersion: 'voiceover-15.6',
      }).success,
    ).toBe(false);

    const unsafeVersions = [
      { osVersion: 'macos-15.6-host-rob-laptop' },
      { browserVersion: 'Safari 18.6' },
      { screenReaderVersion: `voiceover-${'9'.repeat(128)}` },
    ];
    for (const change of unsafeVersions)
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse({
          ...mac,
          ...change,
        }).success,
      ).toBe(false);
  });

  it('requires canonical UTC Z timestamps for the full manual run', () => {
    const report = reportFor();
    for (const candidate of [
      { ...report, startedAt: '2026-09-13T07:00:00-04:00' },
      { ...report, completedAt: '2026-09-13T15:45:00+00:00' },
    ])
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
          candidate,
        ).success,
      ).toBe(false);
  });

  it('records screen-reader heading navigation and a bounded sanitized status identifier', () => {
    const report = reportFor();
    const previousObservation = {
      headingCount: 2,
      announcedLandmarkNames: [
        'skip_navigation',
        'application_navigation',
        'primary_navigation',
        'content_schema_registry_workbench',
      ],
      statusChangeKind: 'success',
      statusAnnouncementObserved: true,
    };
    const checkName = 'landmarks_and_live_regions';

    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
        replaceObservation(report, checkName, previousObservation),
      ).success,
    ).toBe(false);

    const observation = {
      ...previousObservation,
      headingNavigationMethod: 'next_heading_command',
      headingNavigationVisitedCount: 2,
      sanitizedStatusIdentifier: 'cms_save_success',
    };
    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
        replaceObservation(report, checkName, observation),
      ).success,
    ).toBe(true);
    for (const invalid of [
      { ...observation, headingNavigationVisitedCount: 1 },
      {
        ...observation,
        sanitizedStatusIdentifier: 'status for rob@example.com',
      },
      { ...observation, sanitizedStatusIdentifier: `cms_${'x'.repeat(128)}` },
    ])
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
          replaceObservation(report, checkName, invalid),
        ).success,
      ).toBe(false);
  });

  it('requires bounded per-target measurements and associates exceptions to each target', () => {
    const report = reportFor();
    const checkName = 'target_size';
    const validObservation = {
      eligibleTargetCount: validTargets.length,
      allEligibleTargetsMeasured: true,
      targetMeasurements: validTargets,
    };

    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
        replaceObservation(report, checkName, validObservation),
      ).success,
    ).toBe(true);

    const oldObservation = {
      interactiveTargetCount: 12,
      minimumNonExemptTargetWidthCssPx: 24,
      minimumNonExemptTargetHeightCssPx: 24,
      targetsAtLeast44CssPxCount: 10,
      exceptionTargetCount: 1,
      targetExceptionKinds: ['spacing'],
    };
    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
        replaceObservation(report, checkName, oldObservation),
      ).success,
    ).toBe(false);

    for (const targets of [
      [
        validTargets[0],
        { ...validTargets[1]!, targetId: validTargets[0]!.targetId },
      ],
      [{ ...validTargets[0]!, widthCssPx: 23 }],
      [{ ...validTargets[11]!, exceptionKind: null }],
      [{ ...validTargets[11]!, targetId: 'target-private@example.com' }],
      [{ ...validTargets[0]!, heightCssPx: 2049 }],
    ])
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
          replaceObservation(report, checkName, {
            eligibleTargetCount: targets.length,
            allEligibleTargetsMeasured: true,
            targetMeasurements: targets,
          }),
        ).success,
      ).toBe(false);

    for (const incomplete of [
      { ...validObservation, eligibleTargetCount: validTargets.length - 1 },
      { ...validObservation, targetMeasurements: validTargets.slice(1) },
      { ...validObservation, allEligibleTargetsMeasured: false },
      {
        eligibleTargetCount: 513,
        allEligibleTargetsMeasured: true,
        targetMeasurements: Array.from({ length: 513 }, (_, index) => ({
          ...validTargets[0]!,
          targetId: `tgt_${index.toString(16).padStart(16, '0')}`,
        })),
      },
    ])
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
          replaceObservation(report, checkName, incomplete),
        ).success,
      ).toBe(false);
  });
});
