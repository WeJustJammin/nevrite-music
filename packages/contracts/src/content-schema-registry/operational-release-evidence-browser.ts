import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
  CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS,
  ReleaseEvidenceHostedOriginSchema,
  ReleaseEvidenceReportReferenceSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from './operational-release-evidence-common.ts';

export const ContentSchemaRegistryHostedE2eEvidenceSchema = z
  .object({
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    environment: z.enum(['staging', 'production']),
    deploymentId: SafeReleaseIdSchema,
    migrationVersion: z.string().regex(/^[0-9]{14,20}$/),
    webOrigin: ReleaseEvidenceHostedOriginSchema,
    apiOrigin: ReleaseEvidenceHostedOriginSchema,
    supabaseOrigin: ReleaseEvidenceHostedOriginSchema,
    idpProvider: z.literal('google'),
    report: ReleaseEvidenceReportReferenceSchema,
    completedAt: SafeReleaseTimestampSchema,
    roles: z
      .array(z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES))
      .min(1)
      .readonly(),
    scenarios: z
      .array(z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS))
      .min(1)
      .readonly(),
  })
  .strict()
  .readonly();

const ManualA11yRunBaseSchema = z.object({
  operator: SafeReleaseIdSchema,
  osVersion: SafeReleaseIdSchema,
  browserVersion: SafeReleaseIdSchema,
  screenReaderVersion: SafeReleaseIdSchema,
  report: ReleaseEvidenceReportReferenceSchema,
  completedAt: SafeReleaseTimestampSchema,
  outcome: z.literal('passed'),
  checks: z
    .array(z.enum(CONTENT_SCHEMA_REGISTRY_MANUAL_A11Y_CHECKS))
    .min(1)
    .readonly(),
});

export const ContentSchemaRegistryAccessibilityEvidenceSchema = z
  .object({
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    environment: z.enum(['staging', 'production']),
    deploymentId: SafeReleaseIdSchema,
    webOrigin: ReleaseEvidenceHostedOriginSchema,
    automatedReport: ReleaseEvidenceReportReferenceSchema,
    axeSerious: z.literal(0),
    axeCritical: z.literal(0),
    manualRuns: z.tuple([
      ManualA11yRunBaseSchema.extend({
        platform: z.literal('macos_voiceover_safari'),
      })
        .strict()
        .readonly(),
      ManualA11yRunBaseSchema.extend({
        platform: z.literal('windows_nvda_firefox'),
      })
        .strict()
        .readonly(),
    ]),
  })
  .strict()
  .readonly();
