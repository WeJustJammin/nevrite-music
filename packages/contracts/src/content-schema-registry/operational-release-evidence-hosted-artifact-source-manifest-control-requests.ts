import { z } from 'zod';

import {
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_CRITERION,
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_SCHEMA_VERSION,
  Ac265HostedArtifactSourceManifestFinalizationReferenceSchema,
  Ac265HostedArtifactSourceManifestIdSchema,
  Ac265HostedArtifactSourceManifestIdempotencyReferenceSchema,
  HostedArtifactSourceManifestAuthorizationReferenceSchema,
} from './operational-release-evidence-hosted-artifact-source-manifest-control-primitives.ts';
import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';
import { ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceRequestListSchema } from './operational-release-evidence-hosted-artifact-source-manifest-control-sources.ts';

const RequestBaseShape = {
  criterion: z.literal(AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_CRITERION),
  schemaVersion: z.literal(
    AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_SCHEMA_VERSION,
  ),
  authorizationRef: HostedArtifactSourceManifestAuthorizationReferenceSchema,
} as const;

export const ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema =
  z
    .object({
      ...RequestBaseShape,
      idempotencyRef:
        Ac265HostedArtifactSourceManifestIdempotencyReferenceSchema,
      sources:
        ContentSchemaRegistryAc265HostedArtifactSourceManifestSourceRequestListSchema,
    })
    .strict()
    .readonly();
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeRequestSchema =
  z
    .object({
      ...RequestBaseShape,
      manifestId: Ac265HostedArtifactSourceManifestIdSchema,
      finalizationRef:
        Ac265HostedArtifactSourceManifestFinalizationReferenceSchema,
      manifestSha256: ReleaseEvidenceDigestSchema,
    })
    .strict()
    .readonly();
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestReadRequestSchema =
  z
    .object({
      ...RequestBaseShape,
      manifestId: Ac265HostedArtifactSourceManifestIdSchema,
    })
    .strict()
    .readonly();

export type ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequest =
  z.infer<
    typeof ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterRequestSchema
  >;
export type ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeRequest =
  z.infer<
    typeof ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeRequestSchema
  >;
export type ContentSchemaRegistryAc265HostedArtifactSourceManifestReadRequest =
  z.infer<
    typeof ContentSchemaRegistryAc265HostedArtifactSourceManifestReadRequestSchema
  >;
