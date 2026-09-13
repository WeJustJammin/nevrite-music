import {
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS,
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_SCHEMA_VERSION,
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH,
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION,
  type ContentSchemaRegistryManualAccessibilityReport,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-manual-accessibility-report.ts';

type ManualAccessibilityPlatform =
  ContentSchemaRegistryManualAccessibilityReport['platform'];
type ManualAccessibilityCheck =
  (typeof CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS)[number];

const observations: Record<
  ManualAccessibilityCheck,
  Readonly<Record<string, unknown>>
> = {
  contrast_and_non_color_cues: {
    minimumNormalTextContrastRatio: 4.5,
    minimumLargeTextContrastRatio: 3,
    minimumNonTextContrastRatio: 3,
    colorCodedStateCount: 3,
    statesWithNonColorCueCount: 3,
  },
  keyboard: {
    availableActionCount: 4,
    tabReachableActionCount: 4,
    shiftTabReachableActionCount: 4,
    nativeKeyboardOperableActionCount: 4,
  },
  landmarks_and_live_regions: {
    headingCount: 2,
    headingNavigationMethod: 'next_heading_command',
    headingNavigationVisitedCount: 2,
    announcedLandmarkNames: [
      'skip_navigation',
      'application_navigation',
      'primary_navigation',
      'content_schema_registry_workbench',
    ],
    statusChangeKind: 'success',
    statusAnnouncementObserved: true,
    sanitizedStatusIdentifier: 'cms_save_success',
  },
  zoom_200: {
    zoomPercent: 200,
    visibleControlCount: 4,
    totalControlCount: 4,
    clippedContentCount: 0,
    overlappedContentCount: 0,
    lostControlCount: 0,
    unreadableStatusCount: 0,
  },
  zoom_400: {
    zoomPercent: 400,
    visibleControlCount: 4,
    totalControlCount: 4,
    clippedContentCount: 0,
    overlappedContentCount: 0,
    lostControlCount: 0,
    unreadableStatusCount: 0,
    restoredNormalZoom: true,
  },
  forced_colors: {
    contrastThemeEnabled: true,
    controlsPerceivable: true,
    focusIndicatorsPerceivable: true,
    stateInformationPerceivable: true,
    originalThemeRestored: true,
  },
  reduced_motion: {
    reducedMotionPreferenceDetected: true,
    spatialTransitionsSuppressed: true,
    maximumRemainingTransitionDurationMs: 100,
    originalMotionSettingRestored: true,
  },
  target_size: {
    eligibleTargetCount: 12,
    allEligibleTargetsMeasured: true,
    targetMeasurements: Array.from({ length: 12 }, (_, index) => ({
      targetId: `tgt_${(index + 1).toString(16).padStart(16, '0')}`,
      widthCssPx: index === 11 ? 20 : 48,
      heightCssPx: index === 11 ? 20 : 48,
      exceptionKind: index === 11 ? 'spacing' : null,
    })),
  },
  focus: {
    focusStopsInspected: 7,
    visibleFocusIndicatorCount: 7,
    unobscuredFocusIndicatorCount: 7,
    logicalFocusOrderVerified: true,
    overlayCount: 1,
    overlaysClosedCount: 1,
    focusReturnedToTriggerCount: 1,
  },
  no_trap: {
    interactiveRegionCount: 3,
    regionsEnteredCount: 3,
    regionsExitedCount: 3,
    dialogCount: 1,
    dismissibleDialogCount: 1,
    inaccessibleTrapCount: 0,
    focusReturnedAfterDismissal: true,
  },
  error_and_status_announcements: {
    safeValidationErrorCount: 2,
    announcedValidationErrorCount: 2,
    statusChangeCount: 1,
    announcedStatusChangeCount: 1,
    focusMovementForAnnouncementsCount: 0,
  },
};

export const createManualAccessibilityReport = (
  platform: ManualAccessibilityPlatform = 'mac_safari_voiceover',
): ContentSchemaRegistryManualAccessibilityReport => ({
  criterion: 'P2-S09-AC-266',
  schemaVersion:
    CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_SCHEMA_VERSION,
  platform,
  sourceRevision: 'a'.repeat(40),
  environment: 'staging',
  deploymentId: 'staging-deployment-20260913',
  webOrigin: 'https://staging.wejamm.in',
  testedPath: CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH,
  workbenchState:
    CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION,
  operatorId:
    platform === 'mac_safari_voiceover'
      ? 'op_0123456789abcdef0123456789abcdef'
      : 'op_abcdef0123456789abcdef0123456789',
  osVersion:
    platform === 'mac_safari_voiceover' ? 'macos-15.6' : 'windows-11.24h2',
  browserVersion:
    platform === 'mac_safari_voiceover' ? 'safari-18.6' : 'firefox-142.0',
  screenReaderVersion:
    platform === 'mac_safari_voiceover' ? 'voiceover-15.6' : 'nvda-2025.2',
  startedAt: '2026-09-13T11:00:00.000Z',
  completedAt: '2026-09-13T11:45:00.000Z',
  outcome: 'passed',
  redacted: true,
  screenReaderSmoke: 'passed',
  checks: CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS.map(
    (check) => ({ check, outcome: 'passed', observation: observations[check] }),
  ),
});
