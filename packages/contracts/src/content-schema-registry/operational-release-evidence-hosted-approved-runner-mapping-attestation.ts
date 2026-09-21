import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import {
  CmsEd25519SignatureSchema,
  CmsReleaseKeyIdSchema,
} from './primitives.ts';
import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from './operational-release-evidence-hosted-control-plane.ts';
import { Ac265ApprovedMappingIdSchema } from './operational-release-evidence-hosted-approved-registry-control.ts';
import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';

export const AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_SCHEMA_VERSION =
  'ac265-approved-runner-mapping-attestation-v1' as const;
export const AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN =
  'WEJAMMIN-AC265-APPROVED-RUNNER-MAPPING-V1' as const;
export const AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_ALGORITHM =
  'Ed25519' as const;

/**
 * A protected source signs the deterministic mapping fields in this envelope
 * using the domain separator above. The signature is intentionally kept
 * alongside, rather than inside, the signed fields so the verifier can build
 * one canonical preimage without trusting caller-provided bytes.
 */
export const ApprovedRunnerMappingAttestationV1Schema = z
  .object({
    schemaVersion: z.literal(
      AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_SCHEMA_VERSION,
    ),
    domain: z.literal(AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_DOMAIN),
    algorithm: z.literal(AC265_APPROVED_RUNNER_MAPPING_ATTESTATION_ALGORITHM),
    keyId: CmsReleaseKeyIdSchema,
    mappingId: Ac265ApprovedMappingIdSchema,
    runId: z.string().uuid(),
    mappingSha256: ReleaseEvidenceDigestSchema,
    issuedAt: SafeReleaseTimestampSchema,
    expiresAt: SafeReleaseTimestampSchema,
    signature: CmsEd25519SignatureSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const issuedAt = Date.parse(value.issuedAt);
    const expiresAt = Date.parse(value.expiresAt);
    if (
      expiresAt <= issuedAt ||
      expiresAt - issuedAt > AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS
    )
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message:
          'AC265 runner mapping attestation must have a positive lifetime of at most five minutes',
      });
  })
  .readonly();

export type ApprovedRunnerMappingAttestationV1 = z.infer<
  typeof ApprovedRunnerMappingAttestationV1Schema
>;
