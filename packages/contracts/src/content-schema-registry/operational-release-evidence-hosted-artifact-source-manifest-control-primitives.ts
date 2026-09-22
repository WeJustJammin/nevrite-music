import { z } from 'zod';

import {
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CRITERION,
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_ENVIRONMENT,
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_SCHEMA_VERSION,
  HostedArtifactSourceManifestAuthorizationReferenceSchema,
  HostedArtifactSourceManifestReferenceSchema,
} from './operational-release-evidence-hosted-artifact-source-manifest.ts';

export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_SCHEMA_VERSION =
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_SCHEMA_VERSION;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_CRITERION =
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CRITERION;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_ENVIRONMENT =
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_ENVIRONMENT;
export const AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_HOSTING_PROJECT_ID =
  'wejammin-staging' as const;
export const CONTENT_SCHEMA_REGISTRY_AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_SCHEMA_VERSION =
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_CONTROL_SCHEMA_VERSION;

const UUID_V4 =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
export const Ac265HostedArtifactSourceManifestIdSchema = z
  .string()
  .regex(new RegExp(`^${UUID_V4}$`, 'u'));
export const Ac265HostedArtifactSourceManifestArtifactReferenceSchema = z
  .string()
  .regex(
    new RegExp(`^ac265-(receipt://server|evidence://blob)/${UUID_V4}$`, 'u'),
  );
export const Ac265HostedArtifactSourceManifestFinalizationReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-finalization://staging/${UUID_V4}$`, 'u'));
export const Ac265HostedArtifactSourceManifestIdempotencyReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-idempotency://staging/${UUID_V4}$`, 'u'));
export const Ac265HostedArtifactSourceManifestSupabaseProjectReferenceSchema = z
  .string()
  .regex(/^[a-z0-9]{20}$/u);

export {
  HostedArtifactSourceManifestAuthorizationReferenceSchema,
  HostedArtifactSourceManifestReferenceSchema,
};
