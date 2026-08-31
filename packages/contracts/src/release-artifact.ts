import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from './release-recovery-common.ts';

const ARTIFACT_DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const SOURCE_REVISION_PATTERN = /^[a-f0-9]{40,64}$/;
const MIGRATION_VERSION_PATTERN = /^[0-9]{14,20}$/;

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

export const ReleasePromotionEvidenceSchema = z
  .object({
    artifact: ReleaseArtifactIdentitySchema,
    environment: z.enum(['preview', 'staging', 'production']),
    gates: ReleaseGateSetSchema,
    migration: ReleaseMigrationEvidenceSchema,
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
