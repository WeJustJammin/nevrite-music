import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';
import {
  Ac265ApprovedOutageTargetAuthorizationReferenceSchema,
  Ac265ApprovedOutageTargetReferenceSchema,
} from './operational-release-evidence-hosted-approved-outage-target-control.ts';

export const AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_SCHEMA_VERSION =
  'ac265-hosted-approved-outage-target-registration-v1' as const;
export const AC265_APPROVED_OUTAGE_TARGET_POLICY_REFERENCE =
  'ac265-outage-policy://staging/v1' as const;
export const AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_CRITERION =
  'P2-S09-AC-265' as const;
export const AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_ENVIRONMENT =
  'staging' as const;
export const AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HOSTING_PROJECT_ID =
  'wejammin-staging' as const;

const AC265_UUID_V4 =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

export const Ac265ApprovedOutageTargetIdempotencyReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-idempotency://staging/${AC265_UUID_V4}$`, 'u'));

const Ac265ApprovedOutageTargetRegisterRequestShape = {
  criterion: z.literal(AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_CRITERION),
  schemaVersion: z.literal(
    AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_SCHEMA_VERSION,
  ),
  authorizationRef: Ac265ApprovedOutageTargetAuthorizationReferenceSchema,
  policyRef: z.literal(AC265_APPROVED_OUTAGE_TARGET_POLICY_REFERENCE),
  idempotencyRef: Ac265ApprovedOutageTargetIdempotencyReferenceSchema,
} as const;

export const ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequestSchema =
  z.object(Ac265ApprovedOutageTargetRegisterRequestShape).strict().readonly();

export const ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResultSchema =
  z
    .object({
      ...Ac265ApprovedOutageTargetRegisterRequestShape,
      targetRef: Ac265ApprovedOutageTargetReferenceSchema,
      targetSha256: ReleaseEvidenceDigestSchema,
      approvedAt: SafeReleaseTimestampSchema,
      expiresAt: SafeReleaseTimestampSchema,
      environment: z.literal(
        AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_ENVIRONMENT,
      ),
      hostingProjectId: z.literal(
        AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_HOSTING_PROJECT_ID,
      ),
      supabaseProjectRef: z.string().regex(/^[a-z0-9]{20}$/u),
      status: z.literal('registered'),
      redacted: z.literal(true),
    })
    .strict()
    .superRefine((value, context) => {
      if (Date.parse(value.expiresAt) <= Date.parse(value.approvedAt))
        context.addIssue({
          code: 'custom',
          path: ['expiresAt'],
          message: 'Approved outage target expiry must follow approval time',
        });
    })
    .readonly();

export const ContentSchemaRegistryAc265ApprovedOutageTargetRegisterConflictSchema =
  z
    .object({ status: z.literal('conflict') })
    .strict()
    .readonly();

export const ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResponseSchema =
  z
    .union([
      ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResultSchema,
      ContentSchemaRegistryAc265ApprovedOutageTargetRegisterConflictSchema,
    ])
    .readonly();

export type ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequest =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequestSchema
  >;
export type ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResult =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResultSchema
  >;
export type ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResponse =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResponseSchema
  >;
