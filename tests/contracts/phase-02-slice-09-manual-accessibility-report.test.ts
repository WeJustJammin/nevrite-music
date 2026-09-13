import { describe, expect, it } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS,
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_SCHEMA_VERSION,
  ContentSchemaRegistryManualAccessibilityReportSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-manual-accessibility-report.ts';
import { CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { createManualAccessibilityReport } from './phase-02-slice-09-manual-accessibility-report-fixture.ts';

type ManualAccessibilityPlatform =
  'mac_safari_voiceover' | 'windows_firefox_nvda';

type ManualAccessibilityCheck =
  (typeof CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS)[number];

const defaultReport = createManualAccessibilityReport();
const observations = Object.fromEntries(
  defaultReport.checks.map(({ check, observation }) => [check, observation]),
) as Record<ManualAccessibilityCheck, Readonly<Record<string, unknown>>>;

const reportFor = (
  platform: ManualAccessibilityPlatform = 'mac_safari_voiceover',
) => createManualAccessibilityReport(platform);

const replaceObservation = (
  report: ReturnType<typeof reportFor>,
  index: number,
  observation: unknown,
) => ({
  ...report,
  checks: report.checks.map((result, resultIndex) =>
    resultIndex === index ? { ...result, observation } : result,
  ),
});

describe('Slice 09 AC266 manual accessibility report contract', () => {
  it('accepts either exact supported platform with the versioned release identity', () => {
    expect(
      CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_SCHEMA_VERSION,
    ).toBe('ac266-manual-a11y-v1');
    expect(CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS).toEqual(
      CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS,
    );
    expect(CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS).toEqual([
      'contrast_and_non_color_cues',
      'keyboard',
      'landmarks_and_live_regions',
      'zoom_200',
      'zoom_400',
      'forced_colors',
      'reduced_motion',
      'target_size',
      'focus',
      'no_trap',
      'error_and_status_announcements',
    ]);

    for (const report of [
      reportFor('mac_safari_voiceover'),
      reportFor('windows_firefox_nvda'),
    ])
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.parse(report),
      ).toEqual(report);
  });

  it('requires all eleven canonical checks exactly once and passed', () => {
    const report = reportFor();
    expect(report.checks.map(({ check }) => check)).toEqual(
      CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS,
    );

    for (const checks of [
      report.checks.slice(1),
      [report.checks[0], ...report.checks.slice(1, -1), report.checks[0]],
      report.checks.map((result, index) =>
        index === 0 ? { ...result, outcome: 'failed' } : result,
      ),
    ])
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse({
          ...report,
          checks,
        }).success,
      ).toBe(false);
  });

  it('requires structured, bounded, check-specific observations', () => {
    const report = reportFor();

    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.parse(report).checks,
    ).toEqual(report.checks);

    for (const candidate of [
      replaceObservation(
        report,
        0,
        'The text was readable at 200%. Private data: private@example.com.',
      ),
      replaceObservation(report, 0, {
        ...observations.contrast_and_non_color_cues,
        privateNote: 'A user-specific value appeared on screen.',
      }),
      replaceObservation(report, 0, {
        ...observations.contrast_and_non_color_cues,
        minimumNormalTextContrastRatio: 4.49,
      }),
      replaceObservation(report, 0, {
        ...observations.contrast_and_non_color_cues,
        statesWithNonColorCueCount: 2,
      }),
      replaceObservation(report, 1, {
        ...observations.keyboard,
        shiftTabReachableActionCount: 3,
      }),
      replaceObservation(report, 2, {
        ...observations.landmarks_and_live_regions,
        announcedLandmarkNames: [
          'primary_navigation',
          'A private landmark name',
        ],
      }),
      replaceObservation(report, 3, {
        ...observations.zoom_200,
        zoomPercent: 400,
      }),
      replaceObservation(report, 3, {
        ...observations.zoom_200,
        visibleControlCount: 3,
      }),
      replaceObservation(report, 4, {
        ...observations.zoom_400,
        visibleControlCount: 3,
      }),
      replaceObservation(report, 4, {
        ...observations.zoom_400,
        restoredNormalZoom: false,
      }),
      replaceObservation(report, 5, {
        ...observations.forced_colors,
        focusIndicatorsPerceivable: false,
      }),
      replaceObservation(report, 6, {
        ...observations.reduced_motion,
        maximumRemainingTransitionDurationMs: 101,
      }),
      replaceObservation(report, 7, {
        ...observations.target_size,
        minimumNonExemptTargetWidthCssPx: 23,
      }),
      replaceObservation(report, 7, {
        ...observations.target_size,
        exceptionTargetCount: 0,
      }),
      replaceObservation(report, 8, {
        ...observations.focus,
        focusReturnedToTriggerCount: 0,
      }),
      replaceObservation(report, 8, {
        ...observations.focus,
        visibleFocusIndicatorCount: 6,
      }),
      replaceObservation(report, 8, {
        ...observations.focus,
        unobscuredFocusIndicatorCount: 6,
      }),
      replaceObservation(report, 9, {
        ...observations.no_trap,
        inaccessibleTrapCount: 1,
      }),
      replaceObservation(report, 9, {
        ...observations.no_trap,
        regionsExitedCount: 2,
      }),
      replaceObservation(report, 9, {
        ...observations.no_trap,
        dismissibleDialogCount: 2,
      }),
      replaceObservation(report, 10, {
        ...observations.error_and_status_announcements,
        focusMovementForAnnouncementsCount: 1,
      }),
      replaceObservation(report, 10, {
        ...observations.error_and_status_announcements,
        announcedValidationErrorCount: 1,
      }),
      replaceObservation(report, 10, {
        ...observations.error_and_status_announcements,
        announcedStatusChangeCount: 0,
      }),
      {
        ...report,
        checks: [
          { ...report.checks[0], check: 'keyboard' },
          { ...report.checks[1], check: 'contrast_and_non_color_cues' },
          ...report.checks.slice(2),
        ],
      },
    ])
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
          candidate,
        ).success,
      ).toBe(false);

    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse({
        ...report,
        redacted: false,
      }).success,
    ).toBe(false);
  });

  it('requires exact release identity, opaque operator ID, versions, and ordered timestamps', () => {
    const report = reportFor();
    const invalidWorkbenchValues = [
      ['authentication', 'anonymous'],
      ['authorization', 'denied'],
      ['surface', 'sign_in_page'],
      ['signInPageObserved', true],
      ['accessDeniedPageObserved', true],
      ['unexpected', 'unknown'],
    ] as const;
    const invalidReports = [
      { ...report, sourceRevision: 'short' },
      { ...report, schemaVersion: 'ac266-manual-a11y-v2' },
      { ...report, environment: 'local' },
      { ...report, deploymentId: 'deployment with spaces' },
      { ...report, webOrigin: 'http://staging.wejamm.in' },
      { ...report, webOrigin: 'https://staging.wejamm.in/private' },
      { ...report, testedPath: '/auth/sign-in' },
      ...invalidWorkbenchValues.map(([field, value]) => ({
        ...report,
        workbenchState: { ...report.workbenchState, [field]: value },
      })),
      { ...report, operatorId: 'operator@example.com' },
      { ...report, operatorId: 'JaneSmith' },
      { ...report, operatorId: 'op_0123456789abcdef0123456789abcde' },
      { ...report, operatorId: 'op_0123456789ABCDEF0123456789ABCDEF' },
      { ...report, operatorId: `op_${'0'.repeat(33)}` },
      { ...report, osVersion: '' },
      { ...report, browserVersion: 'x'.repeat(129) },
      { ...report, screenReaderVersion: 'nvda 2025.2' },
      { ...report, completedAt: report.startedAt },
      { ...report, completedAt: '2026-09-13T10:59:59.000Z' },
    ];
    for (const candidate of invalidReports)
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
          candidate,
        ).success,
      ).toBe(false);
  });

  it('requires the screen-reader smoke to pass and rejects unknown or signature fields', () => {
    const report = reportFor();

    expect(
      ContentSchemaRegistryManualAccessibilityReportSchema.safeParse({
        ...report,
        screenReaderSmoke: 'blocked',
      }).success,
    ).toBe(false);

    for (const candidate of [
      { ...report, unexpected: true },
      { ...report, signature: 'operator-signed-this' },
      {
        ...report,
        checks: report.checks.map((result, index) =>
          index === 0
            ? {
                ...result,
                observation: {
                  ...result.observation,
                  note: 'unknown field',
                },
              }
            : result,
        ),
      },
    ])
      expect(
        ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(
          candidate,
        ).success,
      ).toBe(false);
  });
});
