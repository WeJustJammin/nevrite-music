import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import {
  CmsEd25519SignatureSchema,
  CmsReleaseKeyIdSchema,
} from './primitives.ts';
import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from './operational-release-evidence-hosted-control-plane.ts';
import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';

export const AC265_HOSTED_ARTIFACT_ATTESTATION_SCHEMA_VERSION =
  'ac265-hosted-artifact-attestation-v1' as const;
export const AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN =
  'WEJAMMIN-AC265-HOSTED-ARTIFACT-V1' as const;
export const AC265_HOSTED_ARTIFACT_ATTESTATION_ALGORITHM = 'Ed25519' as const;

export const HostedArtifactAttestationKindSchema = z.enum([
  'server_receipt',
  'execution_evidence',
]);

const ARTIFACT_UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const HostedServerReceiptReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-receipt://server/${ARTIFACT_UUID}$`, 'u'));
const HostedExecutionEvidenceReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-evidence://blob/${ARTIFACT_UUID}$`, 'u'));

const HostedArtifactAttestationShape = {
  schemaVersion: z.literal(AC265_HOSTED_ARTIFACT_ATTESTATION_SCHEMA_VERSION),
  domain: z.literal(AC265_HOSTED_ARTIFACT_ATTESTATION_DOMAIN),
  algorithm: z.literal(AC265_HOSTED_ARTIFACT_ATTESTATION_ALGORITHM),
  keyId: CmsReleaseKeyIdSchema,
  artifactSha256: ReleaseEvidenceDigestSchema,
  runId: z.string().regex(new RegExp(`^${ARTIFACT_UUID}$`, 'u')),
  candidateIdentitySha256: ReleaseEvidenceDigestSchema,
  runnerContractSha256: ReleaseEvidenceDigestSchema,
  subjectSha256: ReleaseEvidenceDigestSchema,
  issuedAt: SafeReleaseTimestampSchema,
  expiresAt: SafeReleaseTimestampSchema,
  signature: CmsEd25519SignatureSchema,
};

/**
 * Detached authentication for exact hosted receipt or execution-evidence
 * bytes. The signed bindings prevent a valid artifact from being replayed for
 * another candidate, runner contract, subject, run, kind, or reference.
 */
export const HostedArtifactAttestationV1Schema = z
  .discriminatedUnion('kind', [
    z
      .object({
        ...HostedArtifactAttestationShape,
        kind: z.literal('server_receipt'),
        artifactRef: HostedServerReceiptReferenceSchema,
      })
      .strict(),
    z
      .object({
        ...HostedArtifactAttestationShape,
        kind: z.literal('execution_evidence'),
        artifactRef: HostedExecutionEvidenceReferenceSchema,
      })
      .strict(),
  ])
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
          'AC265 hosted artifact attestation must have a positive lifetime of at most five minutes',
      });
  })
  .readonly();

export type HostedArtifactAttestationKind = z.infer<
  typeof HostedArtifactAttestationKindSchema
>;
export type HostedArtifactAttestationV1 = z.infer<
  typeof HostedArtifactAttestationV1Schema
>;
