import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS,
  ReleaseEvidenceDigestSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from './operational-release-evidence-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_AC211_CRITERION,
  CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT,
  CONTENT_SCHEMA_REGISTRY_AC211_SCHEMA_VERSION,
  ContentSchemaRegistryAc211WindowSchema,
  completeness,
  count,
  datasetCounts,
  datasetDurations,
  provenance,
  queueAnalytics,
} from './operational-release-evidence-collector-common.ts';

export const ContentSchemaRegistryAc211DatasetReportSchema = z
  .object({
    criterion: z.literal(CONTENT_SCHEMA_REGISTRY_AC211_CRITERION),
    schemaVersion: z.literal(CONTENT_SCHEMA_REGISTRY_AC211_SCHEMA_VERSION),
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    environment: z.literal('production'),
    deploymentId: SafeReleaseIdSchema,
    queryId: SafeReleaseIdSchema,
    window: ContentSchemaRegistryAc211WindowSchema,
    providerProvenance: provenance,
    queueAnalytics,
    durationsMs: datasetDurations,
    counts: datasetCounts,
    completeness,
    createdAt: SafeReleaseTimestampSchema,
  })
  .strict()
  .readonly();

const samples = z
  .object({
    commands: z
      .number()
      .int()
      .min(200)
      .max(CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT),
    protectedRpcs: z
      .number()
      .int()
      .min(200)
      .max(CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT),
    acceptances: z
      .number()
      .int()
      .min(200)
      .max(CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT),
    queueAttempts: z
      .number()
      .int()
      .positive()
      .max(CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT),
    dlqMessages: count,
    errorCount: count,
  })
  .strict()
  .readonly();
const thresholds = z
  .object({
    commandP95Ms: z.literal(
      CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS.commandP95Ms,
    ),
    protectedRpcP95Ms: z.literal(
      CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS.protectedRpcP95Ms,
    ),
    acceptanceP99Ms: z.literal(
      CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS.acceptanceP99Ms,
    ),
    queueFirstAttemptP95Ms: z.literal(
      CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS.queueFirstAttemptP95Ms,
    ),
    dailyDlqRate: z.literal(
      CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS.dailyDlqRate,
    ),
  })
  .strict()
  .readonly();
const observed = z
  .object({
    commandP95Ms: z.number().finite().nonnegative(),
    protectedRpcP95Ms: z.number().finite().nonnegative(),
    acceptanceP99Ms: z.number().finite().nonnegative(),
    queueFirstAttemptP95Ms: z.number().finite().nonnegative(),
    dailyDlqRate: z.number().finite().nonnegative(),
  })
  .strict()
  .readonly();

export const percentile = (
  values: readonly number[],
  quantile: number,
): number => {
  const sorted = [...values].sort((left, right) => left - right);
  return Number(
    sorted[
      Math.max(
        0,
        Math.min(Math.ceil(sorted.length * quantile) - 1, sorted.length - 1),
      )
    ],
  );
};

export const ContentSchemaRegistryAc211MeasurementReportSchema = z
  .object({
    criterion: z.literal(CONTENT_SCHEMA_REGISTRY_AC211_CRITERION),
    schemaVersion: z.literal(CONTENT_SCHEMA_REGISTRY_AC211_SCHEMA_VERSION),
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    environment: z.literal('production'),
    deploymentId: SafeReleaseIdSchema,
    queryId: SafeReleaseIdSchema,
    window: ContentSchemaRegistryAc211WindowSchema,
    datasetDigest: ReleaseEvidenceDigestSchema,
    samples,
    thresholds,
    observed,
    completeness,
    createdAt: SafeReleaseTimestampSchema,
  })
  .strict()
  .readonly();

export type ContentSchemaRegistryAc211DatasetReport = z.infer<
  typeof ContentSchemaRegistryAc211DatasetReportSchema
>;
export type ContentSchemaRegistryAc211MeasurementReport = z.infer<
  typeof ContentSchemaRegistryAc211MeasurementReportSchema
>;
