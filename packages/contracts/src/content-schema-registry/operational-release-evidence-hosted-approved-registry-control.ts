import { z } from 'zod';

import { SafeReleaseTimestampSchema } from '../release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS,
  ContentSchemaRegistryHostedResourceReferenceSchema,
  HostedResourceReferencesSchema,
} from './operational-release-evidence-hosted-input-references.ts';
import {
  HostedRoleResourceBindingsSchema,
  HostedScenarioRoleBindingsSchema,
} from './operational-release-evidence-hosted-input-scenarios.ts';
import { ApprovedRunnerMappingsV1Schema } from './operational-release-evidence-hosted-approved-runner-mappings.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  ReleaseEvidenceDigestSchema,
} from './operational-release-evidence-common.ts';

export const AC265_APPROVED_REGISTRY_CONTROL_SCHEMA_VERSION =
  'ac265-hosted-approved-registry-control-v1' as const;
export const AC265_APPROVED_REGISTRY_CRITERION = 'P2-S09-AC-265' as const;
export const AC265_APPROVED_REGISTRY_ENVIRONMENT = 'staging' as const;
export const AC265_APPROVED_REGISTRY_HOSTING_PROJECT_ID =
  'wejammin-staging' as const;

const AC265_UUID_V4 =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

const Ac265AuthorizationReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-authorization://staging/${AC265_UUID_V4}$`, 'u'));

const Ac265IdempotencyReferenceSchema = z
  .string()
  .regex(new RegExp(`^ac265-idempotency://staging/${AC265_UUID_V4}$`, 'u'));

export const Ac265ApprovedMappingIdSchema = z
  .string()
  .regex(new RegExp(`^${AC265_UUID_V4}$`, 'u'));

const Ac265SupabaseProjectReferenceSchema = z.string().regex(/^[a-z0-9]{20}$/u);

const Ac265ApprovedRegistryRequestBaseShape = {
  criterion: z.literal(AC265_APPROVED_REGISTRY_CRITERION),
  schemaVersion: z.literal(AC265_APPROVED_REGISTRY_CONTROL_SCHEMA_VERSION),
  authorizationRef: Ac265AuthorizationReferenceSchema,
} as const;

const Ac265ApprovedRegistryResultBaseShape = {
  ...Ac265ApprovedRegistryRequestBaseShape,
  environment: z.literal(AC265_APPROVED_REGISTRY_ENVIRONMENT),
  hostingProjectId: z.literal(AC265_APPROVED_REGISTRY_HOSTING_PROJECT_ID),
  supabaseProjectRef: Ac265SupabaseProjectReferenceSchema,
  redacted: z.literal(true),
} as const;

export const ContentSchemaRegistryAc265ApprovedRegistryConflictSchema = z
  .object({ status: z.literal('conflict') })
  .strict()
  .readonly();

export const ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema =
  z
    .object({
      ...Ac265ApprovedRegistryRequestBaseShape,
      resourceKind: z.enum(CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS),
      locatorSha256: ReleaseEvidenceDigestSchema,
      idempotencyRef: Ac265IdempotencyReferenceSchema,
    })
    .strict()
    .readonly();

export const ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema =
  z
    .object({
      ...Ac265ApprovedRegistryResultBaseShape,
      idempotencyRef: Ac265IdempotencyReferenceSchema,
      resource: ContentSchemaRegistryHostedResourceReferenceSchema,
      locatorSha256: ReleaseEvidenceDigestSchema,
      approvedAt: SafeReleaseTimestampSchema,
    })
    .strict()
    .readonly();

export const ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema =
  z
    .object({
      ...Ac265ApprovedRegistryRequestBaseShape,
      idempotencyRef: Ac265IdempotencyReferenceSchema,
      roleResourceBindings: HostedRoleResourceBindingsSchema,
      scenarioRoleBindings: HostedScenarioRoleBindingsSchema,
    })
    .strict()
    .superRefine((value, context) => {
      const references = new Set<string>();
      const resourceKinds = new Set<string>();

      for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)
        for (const reference of value.roleResourceBindings[role]!) {
          references.add(reference);
          const resourceKind = reference.split('/')[2]!;
          resourceKinds.add(resourceKind);
        }

      if (
        references.size !== CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length
      )
        context.addIssue({
          code: 'custom',
          path: ['roleResourceBindings'],
          message:
            'Approved mapping requests must bind exactly four distinct safe resources',
        });

      if (
        resourceKinds.size !==
        CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length
      )
        context.addIssue({
          code: 'custom',
          path: ['roleResourceBindings'],
          message:
            'Approved mapping requests must bind exactly one resource of every locked kind',
        });
    })
    .readonly();

const Ac265ApprovedRunnerMappingResultBaseShape = {
  ...Ac265ApprovedRegistryResultBaseShape,
  mapping: ApprovedRunnerMappingsV1Schema,
  resources: HostedResourceReferencesSchema,
} as const;

const validateMappingResourceBindings = (
  value: {
    readonly mapping: {
      readonly roleResourceBindings: Readonly<
        Record<string, readonly string[]>
      >;
    };
    readonly resources: readonly { readonly ref: string }[];
  },
  context: z.RefinementCtx,
): void => {
  const declaredReferences = new Set(
    value.resources.map((resource) => resource.ref),
  );
  const boundReferences = new Set<string>();

  for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) {
    for (const reference of value.mapping.roleResourceBindings[role]!) {
      boundReferences.add(reference);
      if (!declaredReferences.has(reference))
        context.addIssue({
          code: 'custom',
          path: ['mapping', 'roleResourceBindings', role],
          message:
            'Approved mapping role bindings must reference declared safe resources',
        });
    }
  }

  if (
    [...declaredReferences].some((reference) => !boundReferences.has(reference))
  )
    context.addIssue({
      code: 'custom',
      path: ['mapping', 'roleResourceBindings'],
      message: 'Approved mappings must bind every declared safe resource',
    });
};

export const ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema =
  z
    .object({
      ...Ac265ApprovedRunnerMappingResultBaseShape,
      idempotencyRef: Ac265IdempotencyReferenceSchema,
    })
    .strict()
    .superRefine(validateMappingResourceBindings)
    .readonly();

export const ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema =
  z
    .object({
      ...Ac265ApprovedRegistryRequestBaseShape,
      mappingId: Ac265ApprovedMappingIdSchema,
    })
    .strict()
    .readonly();

export const ContentSchemaRegistryAc265ApprovedRunnerMappingReadResultSchema = z
  .object(Ac265ApprovedRunnerMappingResultBaseShape)
  .strict()
  .superRefine(validateMappingResourceBindings)
  .readonly();

export const ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResponseSchema =
  z
    .union([
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema,
      ContentSchemaRegistryAc265ApprovedRegistryConflictSchema,
    ])
    .readonly();

export const ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResponseSchema =
  z
    .union([
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema,
      ContentSchemaRegistryAc265ApprovedRegistryConflictSchema,
    ])
    .readonly();

export const ContentSchemaRegistryAc265ApprovedRunnerMappingReadResponseSchema =
  z
    .union([
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadResultSchema,
      ContentSchemaRegistryAc265ApprovedRegistryConflictSchema,
    ])
    .readonly();

export type ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequest =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema
  >;
export type ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResult =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema
  >;
export type ContentSchemaRegistryAc265ApprovedRegistryConflict = z.infer<
  typeof ContentSchemaRegistryAc265ApprovedRegistryConflictSchema
>;
export type ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResponse =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResponseSchema
  >;
export type ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequest =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema
  >;
export type ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResult =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema
  >;
export type ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResponse =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResponseSchema
  >;
export type ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequest =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema
  >;
export type ContentSchemaRegistryAc265ApprovedRunnerMappingReadResult = z.infer<
  typeof ContentSchemaRegistryAc265ApprovedRunnerMappingReadResultSchema
>;
export type ContentSchemaRegistryAc265ApprovedRunnerMappingReadResponse =
  z.infer<
    typeof ContentSchemaRegistryAc265ApprovedRunnerMappingReadResponseSchema
  >;

export type Ac265ApprovedSafeResourceManifestEntry = z.infer<
  typeof ContentSchemaRegistryHostedResourceReferenceSchema
>;
