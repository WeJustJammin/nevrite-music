import { z } from 'zod';

import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../release-recovery-common.ts';
import {
  CmsEd25519SignatureSchema,
  CmsReleaseKeyIdSchema,
} from './primitives.ts';
import {
  ReleaseEvidenceDigestSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from './operational-release-evidence-common.ts';
import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from './operational-release-evidence-hosted-control-plane.ts';

export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_SCHEMA_VERSION =
  'ac265-hosted-artifact-source-manifest-v1' as const;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_DOMAIN =
  'WEJAMMIN-AC265-HOSTED-ARTIFACT-SOURCE-MANIFEST-V1' as const;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_ALGORITHM =
  'Ed25519' as const;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CRITERION =
  'P2-S09-AC-265' as const;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_ENVIRONMENT =
  'staging' as const;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_SOURCE =
  'protected-upstream-artifact-authority' as const;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_SOURCES = 256;

const ARTIFACT_UUID_V4 =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

export const HostedArtifactSourceManifestReferenceSchema = z
  .string()
  .regex(
    new RegExp(`^ac265-artifact-manifest://staging/${ARTIFACT_UUID_V4}$`, 'u'),
  );
export const HostedArtifactSourceManifestAuthorizationReferenceSchema = z
  .string()
  .regex(
    new RegExp(`^ac265-authorization://staging/${ARTIFACT_UUID_V4}$`, 'u'),
  );

const HostedServerReceiptReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-receipt://server/${ARTIFACT_UUID_V4}$`, 'u'));
const HostedExecutionEvidenceReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-evidence://blob/${ARTIFACT_UUID_V4}$`, 'u'));
const HostedArtifactSourceManifestEntryShape = {
  artifactSha256: ReleaseEvidenceDigestSchema,
  attestationSha256: ReleaseEvidenceDigestSchema,
  attestationKeyId: CmsReleaseKeyIdSchema,
  subjectSha256: ReleaseEvidenceDigestSchema,
} as const;

export const HostedArtifactSourceManifestEntrySchema = z
  .discriminatedUnion('kind', [
    z
      .object({
        ...HostedArtifactSourceManifestEntryShape,
        kind: z.literal('server_receipt'),
        artifactRef: HostedServerReceiptReferenceSchema,
      })
      .strict()
      .readonly(),
    z
      .object({
        ...HostedArtifactSourceManifestEntryShape,
        kind: z.literal('execution_evidence'),
        artifactRef: HostedExecutionEvidenceReferenceSchema,
      })
      .strict()
      .readonly(),
  ])
  .readonly();

const HostedArtifactSourceManifestSourcesSchema = z
  .array(HostedArtifactSourceManifestEntrySchema)
  .min(1)
  .max(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_SOURCES)
  .superRefine((value, context) => {
    const references = value.map((entry) => entry.artifactRef);
    if (new Set(references).size !== references.length)
      context.addIssue({
        code: 'custom',
        path: ['sources'],
        message: 'Artifact-source manifest references must be unique',
      });
    for (let index = 1; index < references.length; index++) {
      if (references[index - 1]! >= references[index]!)
        context.addIssue({
          code: 'custom',
          path: ['sources', index, 'artifactRef'],
          message:
            'Artifact-source manifest references must be sorted by code point',
        });
    }
  })
  .readonly();

export const HostedArtifactSourceManifestV1Schema = z
  .object({
    schemaVersion: z.literal(
      AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_SCHEMA_VERSION,
    ),
    domain: z.literal(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_DOMAIN),
    algorithm: z.literal(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_ALGORITHM),
    criterion: z.literal(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CRITERION),
    environment: z.literal(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_ENVIRONMENT),
    source: z.literal(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_SOURCE),
    authorityId: SafeReleaseIdSchema,
    authorityKeyId: CmsReleaseKeyIdSchema,
    manifestRef: HostedArtifactSourceManifestReferenceSchema,
    authorizationRef: HostedArtifactSourceManifestAuthorizationReferenceSchema,
    runId: z.string().regex(new RegExp(`^${ARTIFACT_UUID_V4}$`, 'u')),
    candidateIdentitySha256: ReleaseEvidenceDigestSchema,
    sourceRevision: ReleaseEvidenceSourceRevisionSchema,
    deploymentId: SafeReleaseIdSchema,
    runnerContractSha256: ReleaseEvidenceDigestSchema,
    sources: HostedArtifactSourceManifestSourcesSchema,
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
          'Artifact-source manifest must have a positive lifetime of at most five minutes',
      });
  })
  .readonly();

export type HostedArtifactSourceManifestEntry = z.infer<
  typeof HostedArtifactSourceManifestEntrySchema
>;
export type HostedArtifactSourceManifestV1 = z.infer<
  typeof HostedArtifactSourceManifestV1Schema
>;
