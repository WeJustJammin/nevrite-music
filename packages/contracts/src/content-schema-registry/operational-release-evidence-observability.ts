import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS,
  ReleaseEvidenceReportReferenceSchema,
  ReleaseEvidenceSourceRevisionSchema,
  ReleaseEvidenceWindowSchema,
} from './operational-release-evidence-common.ts';

export const ContentSchemaRegistryAlertingEvidenceSchema = z
  .object({
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    environment: z.literal('production'),
    provider: z.enum([
      'cloudflare_native',
      'supabase_native',
      'approved_scheduled_boundary',
    ]),
    deploymentId: SafeReleaseIdSchema,
    configurationId: SafeReleaseIdSchema,
    configurationReport: ReleaseEvidenceReportReferenceSchema,
    configuredConditions: z
      .array(z.enum(CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS))
      .min(1)
      .readonly(),
    capturedAt: SafeReleaseTimestampSchema,
    deliveryReceipt: z
      .object({
        condition: z.enum(CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS),
        route: z.literal('platform.on_call'),
        receiptId: SafeReleaseIdSchema,
        deliveredAt: SafeReleaseTimestampSchema,
        report: ReleaseEvidenceReportReferenceSchema,
        redacted: z.literal(true),
      })
      .strict()
      .readonly(),
  })
  .strict()
  .readonly();

export const ContentSchemaRegistrySloEvidenceSchema = z
  .object({
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    environment: z.literal('production'),
    deploymentId: SafeReleaseIdSchema,
    queryId: SafeReleaseIdSchema,
    measurementReport: ReleaseEvidenceReportReferenceSchema,
    datasetReport: ReleaseEvidenceReportReferenceSchema,
    window: ReleaseEvidenceWindowSchema,
    samples: z
      .object({
        commands: z.number().int().min(200),
        protectedRpcs: z.number().int().min(200),
        acceptances: z.number().int().min(200),
        queueAttempts: z.number().int().positive(),
        dlqMessages: z.number().int().nonnegative(),
        errorCount: z.number().int().nonnegative(),
      })
      .strict()
      .readonly(),
    thresholds: z
      .object({
        commandP95Ms: z.literal(1_200),
        protectedRpcP95Ms: z.literal(300),
        acceptanceP99Ms: z.literal(1_000),
        queueFirstAttemptP95Ms: z.literal(60_000),
        dailyDlqRate: z.literal(0.001),
      })
      .strict()
      .readonly(),
    observed: z
      .object({
        commandP95Ms: z.number().finite().nonnegative(),
        protectedRpcP95Ms: z.number().finite().nonnegative(),
        acceptanceP99Ms: z.number().finite().nonnegative(),
        queueFirstAttemptP95Ms: z.number().finite().nonnegative(),
        dailyDlqRate: z.number().finite().nonnegative(),
      })
      .strict()
      .readonly(),
  })
  .strict()
  .readonly();
