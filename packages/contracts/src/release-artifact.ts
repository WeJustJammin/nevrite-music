import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from './release-recovery-common.ts';

const ARTIFACT_DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const SOURCE_REVISION_PATTERN = /^[a-f0-9]{40,64}$/;
const MIGRATION_VERSION_PATTERN = /^[0-9]{14,20}$/;

export const RELEASE_BUNDLE_BUDGET_THRESHOLDS = Object.freeze({
  workbenchGzipBytes: 35 * 1024,
  initialRouteGzipBytes: 90 * 1024,
  lazyChunkGzipBytes: 80 * 1024,
});

export const RELEASE_API_P95_THRESHOLDS = Object.freeze({ p95Ms: 500 });

export const ReleaseArtifactIdentitySchema = z
  .object({
    artifactDigest: z.string().regex(ARTIFACT_DIGEST_PATTERN),
    sourceRevision: z.string().regex(SOURCE_REVISION_PATTERN),
    buildId: SafeReleaseIdSchema,
    migrationVersion: z.string().regex(MIGRATION_VERSION_PATTERN),
  })
  .strict()
  .readonly();

export const ReleaseGateSetSchema = z
  .object({
    contracts: z.boolean(),
    tests: z.boolean(),
    security: z.boolean(),
    accessibility: z.boolean(),
    build: z.boolean(),
    migrationCompatibility: z.boolean(),
    registry: z.boolean(),
    sloRunbook: z.boolean(),
    infrastructure: z.boolean(),
    artifactIdentity: z.boolean(),
  })
  .strict()
  .readonly();

export const ReleaseMigrationEvidenceSchema = z
  .object({
    state: z.enum([
      'not_started',
      'expanded',
      'switched',
      'failed_after_expansion',
    ]),
    forwardFixOnly: z.boolean(),
    destructiveRollbackAttempted: z.boolean(),
  })
  .strict()
  .readonly();

const ReleasePerformanceSourceRevisionSchema = z
  .string()
  .regex(SOURCE_REVISION_PATTERN);

const ReleaseBundleBudgetThresholdsSchema = z
  .object({
    workbenchGzipBytes: z.literal(
      RELEASE_BUNDLE_BUDGET_THRESHOLDS.workbenchGzipBytes,
    ),
    initialRouteGzipBytes: z.literal(
      RELEASE_BUNDLE_BUDGET_THRESHOLDS.initialRouteGzipBytes,
    ),
    lazyChunkGzipBytes: z.literal(
      RELEASE_BUNDLE_BUDGET_THRESHOLDS.lazyChunkGzipBytes,
    ),
  })
  .strict()
  .readonly();

export const ReleaseBundleBudgetEvidenceSchema = z
  .object({
    sourceRevision: ReleasePerformanceSourceRevisionSchema,
    thresholds: ReleaseBundleBudgetThresholdsSchema,
    passed: z.literal(true),
    workbenchGzipBytes: z.number().int().nonnegative(),
    initialRouteGzipBytes: z.number().int().nonnegative(),
    lazyChunkGzipBytes: z.array(z.number().int().nonnegative()).readonly(),
  })
  .passthrough()
  .readonly();

const ReleaseApiP95ThresholdsSchema = z
  .object({
    p95Ms: z.literal(RELEASE_API_P95_THRESHOLDS.p95Ms),
  })
  .strict()
  .readonly();

export const ReleaseApiP95EvidenceSchema = z
  .object({
    sourceRevision: ReleasePerformanceSourceRevisionSchema,
    thresholds: ReleaseApiP95ThresholdsSchema,
    passed: z.literal(true),
    errors: z.literal(0),
    p50Ms: z.number().nonnegative(),
    p95Ms: z.number().nonnegative(),
    p99Ms: z.number().nonnegative(),
    samples: z.literal(20),
    thresholdFailures: z.array(z.string()).length(0).readonly(),
    iterations: z.literal(20),
    retries: z.literal(0),
    virtualUsers: z.literal(1),
    profile: z.literal('phase-1-api-p95-smoke'),
    fixtureVersion: z.string().min(1),
    mode: z.enum(['local', 'staging']),
  })
  .passthrough()
  .readonly();

export const ReleasePerformanceEvidenceSchema = z
  .object({
    bundleBudget: ReleaseBundleBudgetEvidenceSchema,
    apiP95: ReleaseApiP95EvidenceSchema,
  })
  .strict()
  .readonly();

export type ReleaseBundleBudgetEvidence = z.infer<
  typeof ReleaseBundleBudgetEvidenceSchema
>;
export type ReleaseApiP95Evidence = z.infer<typeof ReleaseApiP95EvidenceSchema>;
export type ReleasePerformanceEvidence = z.infer<
  typeof ReleasePerformanceEvidenceSchema
>;

export const ReleasePromotionEvidenceSchema = z
  .object({
    artifact: ReleaseArtifactIdentitySchema,
    environment: z.enum(['preview', 'staging', 'production']),
    gates: ReleaseGateSetSchema,
    migration: ReleaseMigrationEvidenceSchema,
    performance: ReleasePerformanceEvidenceSchema,
    verifiedAt: SafeReleaseTimestampSchema,
  })
  .strict()
  .readonly();

export type ReleaseArtifactIdentity = z.infer<
  typeof ReleaseArtifactIdentitySchema
>;
export type ReleaseGateSet = z.infer<typeof ReleaseGateSetSchema>;
export type ReleaseMigrationEvidence = z.infer<
  typeof ReleaseMigrationEvidenceSchema
>;
export type ReleasePromotionEvidence = z.infer<
  typeof ReleasePromotionEvidenceSchema
>;
