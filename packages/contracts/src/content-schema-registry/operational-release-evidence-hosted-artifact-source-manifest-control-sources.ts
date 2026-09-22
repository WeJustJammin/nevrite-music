import { z, type RefinementCtx } from 'zod';

import { CmsReleaseKeyIdSchema } from './primitives.ts';
import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';
import { AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS } from './operational-release-evidence-hosted-control-plane.ts';
import { Ac265HostedArtifactSourceManifestArtifactReferenceSchema } from './operational-release-evidence-hosted-artifact-source-manifest-control-primitives.ts';
import { AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_SOURCES } from './operational-release-evidence-hosted-artifact-source-manifest.ts';

const MAX = AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_MAX_SOURCES;
const WINDOW = AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS;
export const Ac265HostedArtifactSourceManifestTimestampSchema = z.iso.datetime({
  precision: 3,
  offset: false,
});
const SourceShape = {
  kind: z.enum(['server_receipt', 'execution_evidence']),
  artifactRef: Ac265HostedArtifactSourceManifestArtifactReferenceSchema,
  artifactSha256: ReleaseEvidenceDigestSchema,
  attestationSha256: ReleaseEvidenceDigestSchema,
  attestationKeyId: CmsReleaseKeyIdSchema,
  subjectSha256: ReleaseEvidenceDigestSchema,
  issuedAt: Ac265HostedArtifactSourceManifestTimestampSchema,
  expiresAt: Ac265HostedArtifactSourceManifestTimestampSchema,
} as const;
export type Ac265HostedArtifactSourceManifestSource = {
  kind: 'server_receipt' | 'execution_evidence';
  artifactRef: string;
  issuedAt: string;
  expiresAt: string;
};
type EnvelopeSource = Ac265HostedArtifactSourceManifestSource & {
  ordinal: number;
};

export const validateAc265HostedArtifactSourceManifestWindow = (
  start: string,
  end: string,
  path: (string | number)[],
  context: RefinementCtx,
) => {
  const started = Date.parse(start);
  const ended = Date.parse(end);
  if (ended <= started || ended - started > WINDOW)
    context.addIssue({
      code: 'custom',
      path,
      message: 'Time window must be positive and at most five minutes',
    });
};

const checkSource = (
  value: Ac265HostedArtifactSourceManifestSource,
  context: RefinementCtx,
) => {
  const prefix =
    value.kind === 'server_receipt'
      ? 'ac265-receipt://server/'
      : 'ac265-evidence://blob/';
  if (!value.artifactRef.startsWith(prefix))
    context.addIssue({
      code: 'custom',
      path: ['artifactRef'],
      message: 'Artifact reference must match its declared kind',
    });
  validateAc265HostedArtifactSourceManifestWindow(
    value.issuedAt,
    value.expiresAt,
    ['expiresAt'],
    context,
  );
};

export const ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceRequestSchema =
  z.object(SourceShape).strict().superRefine(checkSource);
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceEnvelopeSchema =
  z
    .object({
      ordinal: z.number().int().min(1).max(MAX),
      ...SourceShape,
    })
    .strict()
    .superRefine(checkSource);

const checkSources = (
  value: readonly (Ac265HostedArtifactSourceManifestSource | EnvelopeSource)[],
  context: RefinementCtx,
  ordered: boolean,
) => {
  const seen = new Set<string>();
  value.forEach((source, index) => {
    if (seen.has(source.artifactRef))
      context.addIssue({
        code: 'custom',
        path: [index, 'artifactRef'],
        message: 'Artifact source references must be unique',
      });
    seen.add(source.artifactRef);
    if (ordered) {
      const output = source as EnvelopeSource;
      if (output.ordinal !== index + 1)
        context.addIssue({
          code: 'custom',
          path: [index, 'ordinal'],
          message: 'Artifact source ordinals must be contiguous from one',
        });
      if (index > 0 && value[index - 1]!.artifactRef >= source.artifactRef)
        context.addIssue({
          code: 'custom',
          path: [index, 'artifactRef'],
          message: 'Artifact source references must be code-point sorted',
        });
    }
  });
};

export const ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceRequestListSchema =
  z
    .array(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceRequestSchema,
    )
    .min(1)
    .max(MAX)
    .superRefine((value, context) => checkSources(value, context, false))
    .readonly();
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceEnvelopeListSchema =
  z
    .array(
      ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceEnvelopeSchema,
    )
    .min(1)
    .max(MAX)
    .superRefine((value, context) => checkSources(value, context, true))
    .readonly();

export const ContentSchemaRegistryAc265HostedArtifactSourceManifestAuthorizationWindowSchema =
  z
    .object({
      authorizedAt: Ac265HostedArtifactSourceManifestTimestampSchema,
      expiresAt: Ac265HostedArtifactSourceManifestTimestampSchema,
    })
    .strict()
    .superRefine((value, context) =>
      validateAc265HostedArtifactSourceManifestWindow(
        value.authorizedAt,
        value.expiresAt,
        ['expiresAt'],
        context,
      ),
    )
    .readonly();
