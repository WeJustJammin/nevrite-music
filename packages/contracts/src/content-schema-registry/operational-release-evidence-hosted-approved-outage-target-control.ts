import { z } from 'zod';

import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';
import { ApprovedOutageTargetV1Schema } from './operational-release-evidence-hosted-approved-outage-target.ts';

export const AC265_APPROVED_OUTAGE_TARGET_CONTROL_SCHEMA_VERSION =
  'ac265-hosted-approved-outage-target-control-v1' as const;
export const AC265_APPROVED_OUTAGE_TARGET_CONTROL_CRITERION =
  'P2-S09-AC-265' as const;
export const AC265_APPROVED_OUTAGE_TARGET_CONTROL_ENVIRONMENT =
  'staging' as const;
export const AC265_APPROVED_OUTAGE_TARGET_CONTROL_HOSTING_PROJECT_ID =
  'wejammin-staging' as const;

const AC265_UUID_V4 =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

export const Ac265ApprovedOutageTargetAuthorizationReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-authorization://staging/${AC265_UUID_V4}$`, 'u'));

export const Ac265ApprovedOutageTargetReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-outage-target://staging/${AC265_UUID_V4}$`, 'u'));

const Ac265ApprovedOutageTargetControlRequestBaseShape = {
  criterion: z.literal(AC265_APPROVED_OUTAGE_TARGET_CONTROL_CRITERION),
  schemaVersion: z.literal(AC265_APPROVED_OUTAGE_TARGET_CONTROL_SCHEMA_VERSION),
  authorizationRef: Ac265ApprovedOutageTargetAuthorizationReferenceSchema,
} as const;

const Ac265ApprovedOutageTargetControlResultBaseShape = {
  ...Ac265ApprovedOutageTargetControlRequestBaseShape,
  environment: z.literal(AC265_APPROVED_OUTAGE_TARGET_CONTROL_ENVIRONMENT),
  hostingProjectId: z.literal(
    AC265_APPROVED_OUTAGE_TARGET_CONTROL_HOSTING_PROJECT_ID,
  ),
  supabaseProjectRef: z.string().regex(/^[a-z0-9]{20}$/u),
  redacted: z.literal(true),
} as const;

export const ContentSchemaRegistryAc265ApprovedOutageTargetReadRequestSchema = z
  .object({
    ...Ac265ApprovedOutageTargetControlRequestBaseShape,
    targetRef: Ac265ApprovedOutageTargetReferenceSchema,
  })
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265ApprovedOutageTargetReadResultSchema = z
  .object({
    ...Ac265ApprovedOutageTargetControlResultBaseShape,
    targetSha256: ReleaseEvidenceDigestSchema,
    target: ApprovedOutageTargetV1Schema,
  })
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265ApprovedOutageTargetConflictSchema = z
  .object({ status: z.literal('conflict') })
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265ApprovedOutageTargetReadResponseSchema =
  z
    .union([
      ContentSchemaRegistryAc265ApprovedOutageTargetReadResultSchema,
      ContentSchemaRegistryAc265ApprovedOutageTargetConflictSchema,
    ])
    .readonly();

export type ContentSchemaRegistryAc265ApprovedOutageTargetReadRequest = z.infer<
  typeof ContentSchemaRegistryAc265ApprovedOutageTargetReadRequestSchema
>;
export type ContentSchemaRegistryAc265ApprovedOutageTargetReadResult = z.infer<
  typeof ContentSchemaRegistryAc265ApprovedOutageTargetReadResultSchema
>;
export type ContentSchemaRegistryAc265ApprovedOutageTargetReadResponse =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedOutageTargetReadResponseSchema
  >;
