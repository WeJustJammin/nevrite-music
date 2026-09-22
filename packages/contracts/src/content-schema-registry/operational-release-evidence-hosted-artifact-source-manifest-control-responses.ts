import { z } from 'zod';

import {
  Ac265HostedArtifactSourceManifestFinalizedEnvelopeSchema,
  Ac265HostedArtifactSourceManifestRegisteredEnvelopeSchema,
  SuccessfulEnvelopeSchema,
} from './operational-release-evidence-hosted-artifact-source-manifest-control-projections.ts';

export const ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisteredResultSchema =
  Ac265HostedArtifactSourceManifestRegisteredEnvelopeSchema;
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizedResultSchema =
  Ac265HostedArtifactSourceManifestFinalizedEnvelopeSchema;
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResultSchema =
  SuccessfulEnvelopeSchema;
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResultSchema =
  Ac265HostedArtifactSourceManifestFinalizedEnvelopeSchema;
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResultSchema =
  Ac265HostedArtifactSourceManifestFinalizedEnvelopeSchema;
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestConflictSchema =
  z
    .object({ status: z.literal('conflict') })
    .strict()
    .readonly();

export const ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema =
  z
    .union([
      SuccessfulEnvelopeSchema,
      ContentSchemaRegistryAc265HostedArtifactSourceManifestConflictSchema,
    ])
    .readonly();
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema =
  z
    .union([
      Ac265HostedArtifactSourceManifestFinalizedEnvelopeSchema,
      ContentSchemaRegistryAc265HostedArtifactSourceManifestConflictSchema,
    ])
    .readonly();
export const ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema =
  z
    .union([
      Ac265HostedArtifactSourceManifestFinalizedEnvelopeSchema,
      ContentSchemaRegistryAc265HostedArtifactSourceManifestConflictSchema,
    ])
    .readonly();

export type ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisteredResult =
  z.infer<
    typeof ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisteredResultSchema
  >;
export type ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizedResult =
  z.infer<
    typeof ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizedResultSchema
  >;
export type ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponse =
  z.infer<
    typeof ContentSchemaRegistryAc265HostedArtifactSourceManifestRegisterResponseSchema
  >;
export type ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponse =
  z.infer<
    typeof ContentSchemaRegistryAc265HostedArtifactSourceManifestFinalizeResponseSchema
  >;
export type ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponse =
  z.infer<
    typeof ContentSchemaRegistryAc265HostedArtifactSourceManifestReadResponseSchema
  >;
