import { z, type RefinementCtx } from 'zod';

import { SafeReleaseIdSchema } from '../release-recovery-common.ts';
import {
  ReleaseEvidenceDigestSchema,
  ReleaseEvidenceSourceRevisionSchema,
} from './operational-release-evidence-common.ts';
import {
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_CRITERION,
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_ENVIRONMENT,
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_HOSTING_PROJECT_ID,
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_SCHEMA_VERSION,
  Ac265HostedArtifactSourceManifestFinalizationReferenceSchema,
  Ac265HostedArtifactSourceManifestIdSchema,
  Ac265HostedArtifactSourceManifestIdempotencyReferenceSchema,
  HostedArtifactSourceManifestAuthorizationReferenceSchema,
  HostedArtifactSourceManifestReferenceSchema,
} from './operational-release-evidence-hosted-artifact-source-manifest-control-primitives.ts';
import {
  Ac265HostedArtifactSourceManifestTimestampSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestAuthorizationWindowSchema,
  ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceEnvelopeListSchema,
} from './operational-release-evidence-hosted-artifact-source-manifest-control-sources.ts';

const EnvelopeBaseShape = {
  criterion: z.literal(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_CRITERION),
  schemaVersion: z.literal(
    AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_SCHEMA_VERSION,
  ),
  manifestId: Ac265HostedArtifactSourceManifestIdSchema,
  manifestRef: HostedArtifactSourceManifestReferenceSchema,
  authorizationRef: HostedArtifactSourceManifestAuthorizationReferenceSchema,
  authorization:
    ContentSchemaRegistryAc265HostedArtifactSourceManifestAuthorizationWindowSchema,
  idempotencyRef: Ac265HostedArtifactSourceManifestIdempotencyReferenceSchema,
  candidateId: Ac265HostedArtifactSourceManifestIdSchema,
  runId: Ac265HostedArtifactSourceManifestIdSchema,
  identitySha256: ReleaseEvidenceDigestSchema,
  environment: z.literal(
    AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_ENVIRONMENT,
  ),
  sourceRevision: ReleaseEvidenceSourceRevisionSchema,
  deploymentId: SafeReleaseIdSchema,
  hostingProjectId: z.literal(
    AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_HOSTING_PROJECT_ID,
  ),
  supabaseProjectRef: z.string().regex(/^[a-z0-9]{20}$/u),
  sourceCount: z.number().int().min(1).max(256),
  sourceSetComplete: z.literal(true),
  kindComplete: z.boolean(),
  registeredAt: Ac265HostedArtifactSourceManifestTimestampSchema,
  sources:
    ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceEnvelopeListSchema,
  redacted: z.literal(true),
} as const;
type EnvelopeSource = {
  kind: 'server_receipt' | 'execution_evidence';
  artifactRef: string;
  ordinal: number;
  issuedAt: string;
  expiresAt: string;
};
type Envelope = {
  sourceCount: number;
  sources: readonly EnvelopeSource[];
  kindComplete: boolean;
  authorization: { authorizedAt: string; expiresAt: string };
};

const checkEnvelope = (value: Envelope, context: RefinementCtx) => {
  if (value.sourceCount !== value.sources.length)
    context.addIssue({
      code: 'custom',
      path: ['sourceCount'],
      message: 'sourceCount must equal the source list length',
    });
  const kinds = new Set(value.sources.map((source) => source.kind));
  if (
    value.kindComplete !==
    (kinds.has('server_receipt') && kinds.has('execution_evidence'))
  )
    context.addIssue({
      code: 'custom',
      path: ['kindComplete'],
      message: 'kindComplete must reflect both required source kinds',
    });
  const authorizedAt = Date.parse(value.authorization.authorizedAt);
  const expiresAt = Date.parse(value.authorization.expiresAt);
  value.sources.forEach((source, index) => {
    if (
      Date.parse(source.issuedAt) < authorizedAt ||
      Date.parse(source.expiresAt) > expiresAt
    )
      context.addIssue({
        code: 'custom',
        path: ['sources', index],
        message: 'Source window must be inside the authorization window',
      });
  });
};

export const Ac265HostedArtifactSourceManifestRegisteredEnvelopeSchema = z
  .object({
    ...EnvelopeBaseShape,
    lifecycle: z.literal('registered'),
    manifestSha256: z.null(),
    finalizationRef: z.null(),
    finalizedAt: z.null(),
  })
  .strict()
  .superRefine(checkEnvelope)
  .readonly();
export const Ac265HostedArtifactSourceManifestFinalizedEnvelopeSchema = z
  .object({
    ...EnvelopeBaseShape,
    lifecycle: z.literal('finalized'),
    manifestSha256: ReleaseEvidenceDigestSchema,
    finalizationRef:
      Ac265HostedArtifactSourceManifestFinalizationReferenceSchema,
    finalizedAt: Ac265HostedArtifactSourceManifestTimestampSchema,
  })
  .strict()
  .superRefine(checkEnvelope)
  .readonly();
const SuccessfulEnvelopeSchema = z
  .discriminatedUnion('lifecycle', [
    Ac265HostedArtifactSourceManifestRegisteredEnvelopeSchema,
    Ac265HostedArtifactSourceManifestFinalizedEnvelopeSchema,
  ])
  .readonly();

export { SuccessfulEnvelopeSchema };
