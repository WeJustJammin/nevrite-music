import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import {
  CmsEd25519SignatureSchema,
  CmsReleaseKeyIdSchema,
} from './primitives.ts';
import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from './operational-release-evidence-hosted-control-plane.ts';
import { Ac265OutageLeaseTargetReferenceSchema } from './operational-release-evidence-hosted-outage-lease-control.ts';
import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';

export const AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_SCHEMA_VERSION =
  'ac265-approved-outage-target-attestation-v1' as const;
export const AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN =
  'WEJAMMIN-AC265-APPROVED-OUTAGE-TARGET-V1' as const;
export const AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_ALGORITHM =
  'Ed25519' as const;

/**
 * A protected source signs the canonical outage-target bytes indirectly by
 * signing their SHA-256 digest and the target's stable reference/run binding.
 * The signature is kept separate from the signed fields so the verifier has a
 * single deterministic preimage to reconstruct.
 */
export const ApprovedOutageTargetAttestationV1Schema = z
  .object({
    schemaVersion: z.literal(
      AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_SCHEMA_VERSION,
    ),
    domain: z.literal(AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_DOMAIN),
    algorithm: z.literal(AC265_APPROVED_OUTAGE_TARGET_ATTESTATION_ALGORITHM),
    keyId: CmsReleaseKeyIdSchema,
    targetRef: Ac265OutageLeaseTargetReferenceSchema,
    runId: z.string().uuid(),
    targetSha256: ReleaseEvidenceDigestSchema,
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
          'AC265 outage-target attestation must have a positive lifetime of at most five minutes',
      });
  })
  .readonly();

export type ApprovedOutageTargetAttestationV1 = z.infer<
  typeof ApprovedOutageTargetAttestationV1Schema
>;
