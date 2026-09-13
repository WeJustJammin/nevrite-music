import { z } from 'zod';

import { SafeReleaseIdSchema } from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS,
  ReleaseEvidenceHostedOriginSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from './operational-release-evidence-common.ts';
import { ContentSchemaRegistryManualAccessibilityReportCheckSchema } from './operational-release-evidence-manual-accessibility-check-schema.ts';
import {
  ManualAccessibilityUtcTimestampSchema,
  manualAccessibilityPlatformVersionsMatch,
} from './operational-release-evidence-manual-accessibility-runtime.ts';

export * from './operational-release-evidence-manual-accessibility-check-schema.ts';

export const CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_SCHEMA_VERSION =
  'ac266-manual-a11y-v1' as const;

export const CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS =
  CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS;

export const CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH =
  '/app/cms-content-modeling' as const;

export const CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION =
  Object.freeze({
    authentication: 'authenticated',
    authorization: 'authorized',
    surface: 'cms_content_modeling_workbench',
    signInPageObserved: false,
    accessDeniedPageObserved: false,
  });

const ManualAccessibilityWorkbenchStateSchema = z
  .object({
    authentication: z.literal(
      CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION.authentication,
    ),
    authorization: z.literal(
      CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION.authorization,
    ),
    surface: z.literal(
      CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION.surface,
    ),
    signInPageObserved: z.literal(
      CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION.signInPageObserved,
    ),
    accessDeniedPageObserved: z.literal(
      CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION.accessDeniedPageObserved,
    ),
  })
  .strict()
  .readonly();

const hasExactMembers = (
  actual: readonly string[],
  expected: readonly string[],
): boolean => {
  const unique = new Set(actual);
  return (
    actual.length === expected.length &&
    unique.size === expected.length &&
    expected.every((member) => unique.has(member))
  );
};

export const ContentSchemaRegistryManualAccessibilityReportSchema = z
  .object({
    criterion: z.literal('P2-S09-AC-266'),
    schemaVersion: z.literal(
      CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_SCHEMA_VERSION,
    ),
    platform: z.enum(['mac_safari_voiceover', 'windows_firefox_nvda']),
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    environment: z.enum(['staging', 'production']),
    deploymentId: SafeReleaseIdSchema,
    webOrigin: ReleaseEvidenceHostedOriginSchema,
    testedPath: z.literal(
      CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH,
    ),
    workbenchState: ManualAccessibilityWorkbenchStateSchema,
    operatorId: z.string().regex(/^op_[a-f0-9]{32}$/u),
    osVersion: z.string().max(24),
    browserVersion: z.string().max(24),
    screenReaderVersion: z.string().max(24),
    startedAt: ManualAccessibilityUtcTimestampSchema,
    completedAt: ManualAccessibilityUtcTimestampSchema,
    outcome: z.literal('passed'),
    redacted: z.literal(true),
    screenReaderSmoke: z.literal('passed'),
    checks: z
      .array(ContentSchemaRegistryManualAccessibilityReportCheckSchema)
      .readonly(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      !manualAccessibilityPlatformVersionsMatch(
        value.platform,
        value.osVersion,
        value.browserVersion,
        value.screenReaderVersion,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['platform'],
        message:
          'OS, browser, and screen-reader version families must match the declared platform',
      });

    if (Date.parse(value.completedAt) <= Date.parse(value.startedAt))
      context.addIssue({
        code: 'custom',
        path: ['completedAt'],
        message: 'Manual accessibility report must complete after it starts',
      });

    if (
      !hasExactMembers(
        value.checks.map(({ check }) => check),
        CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS,
      )
    )
      context.addIssue({
        code: 'custom',
        path: ['checks'],
        message:
          'Manual accessibility report must include every locked check exactly once',
      });
  })
  .readonly();

export type ContentSchemaRegistryManualAccessibilityReport = z.infer<
  typeof ContentSchemaRegistryManualAccessibilityReportSchema
>;
