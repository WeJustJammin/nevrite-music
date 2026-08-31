import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from './release-recovery-common.ts';
import { ReleaseArtifactIdentitySchema } from './release-artifact.ts';

export const RecoveryTargetEnvironmentSchema = z.enum([
  'staging',
  'production',
]);

export const RecoveryCheckSetSchema = z
  .object({
    integrity: z.boolean(),
    rls: z.boolean(),
    rpc: z.boolean(),
    idempotency: z.boolean(),
    outbox: z.boolean(),
    jobs: z.boolean(),
    objects: z.boolean(),
    provider: z.boolean(),
    public: z.boolean(),
  })
  .strict()
  .readonly();

export const RecoveryVerificationSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('synthetic_local'),
      fixtureId: SafeReleaseIdSchema,
    })
    .strict()
    .readonly(),
  z
    .object({
      kind: z.literal('staging_verified'),
      deploymentId: SafeReleaseIdSchema,
    })
    .strict()
    .readonly(),
  z
    .object({
      kind: z.literal('production_verified'),
      deploymentId: SafeReleaseIdSchema,
    })
    .strict()
    .readonly(),
]);

export const RecoveryPitrEvidenceSchema = z.discriminatedUnion('available', [
  z
    .object({ available: z.literal(false), retentionDays: z.literal(0) })
    .strict()
    .readonly(),
  z
    .object({
      available: z.literal(true),
      retentionDays: z.number().int().positive().max(3_650),
    })
    .strict()
    .readonly(),
]);

export const RecoveryReadinessEvidenceSchema = z
  .object({
    evidenceId: z.uuid(),
    restoreEpoch: SafeReleaseIdSchema,
    capturedAt: SafeReleaseTimestampSchema,
    expiresAt: SafeReleaseTimestampSchema,
    artifact: ReleaseArtifactIdentitySchema,
    environment: RecoveryTargetEnvironmentSchema,
    pitr: RecoveryPitrEvidenceSchema,
    measuredRpoSeconds: z.number().finite().nonnegative().nullable(),
    measuredRtoSeconds: z.number().finite().nonnegative().nullable(),
    checks: RecoveryCheckSetSchema,
    verification: RecoveryVerificationSchema,
  })
  .strict()
  .superRefine((evidence, context) => {
    if (Date.parse(evidence.expiresAt) <= Date.parse(evidence.capturedAt)) {
      context.addIssue({
        code: 'custom',
        message: 'Recovery evidence must expire after it is captured',
        path: ['expiresAt'],
      });
    }
    const hasBothMeasurements =
      evidence.measuredRpoSeconds !== null &&
      evidence.measuredRtoSeconds !== null;
    const measurementsValid = evidence.pitr.available
      ? hasBothMeasurements
      : !hasBothMeasurements &&
        evidence.measuredRpoSeconds === null &&
        evidence.measuredRtoSeconds === null;
    if (!measurementsValid) {
      context.addIssue({
        code: 'custom',
        message:
          'RPO and RTO measurements exist only when PITR is operationally available',
        path: ['measuredRpoSeconds'],
      });
    }
  })
  .readonly();

export type RecoveryCheckSet = z.infer<typeof RecoveryCheckSetSchema>;
export type RecoveryVerification = z.infer<typeof RecoveryVerificationSchema>;
export type RecoveryPitrEvidence = z.infer<typeof RecoveryPitrEvidenceSchema>;
export type RecoveryTargetEnvironment = z.infer<
  typeof RecoveryTargetEnvironmentSchema
>;
export type RecoveryReadinessEvidence = z.infer<
  typeof RecoveryReadinessEvidenceSchema
>;
