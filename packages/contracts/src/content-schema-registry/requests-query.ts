import { z } from 'zod';

import { CmsBlockLifecycleSchema } from './models.ts';
import {
  CmsEd25519SignatureSchema,
  CmsInstantSchema,
  CmsOpaqueCursorSchema,
  CmsReleaseKeyIdSchema,
  CmsUuidSchema,
} from './primitives.ts';

export const ContentSchemaRegistryResourceKindSchema = z.enum([
  'content_type',
  'content_type_version',
  'field_definition_version',
  'relation_definition',
  'schema_artifact',
  'block_definition_registry_record',
  'template_binding',
  'capability_binding',
]);

export const ContentSchemaRegistryListQuerySchema = z
  .strictObject({
    resourceKind: ContentSchemaRegistryResourceKindSchema.optional(),
    keyPrefix: z
      .string()
      .regex(/^[a-z][a-z0-9._-]{0,63}$/u, 'key_prefix_invalid')
      .optional(),
    lifecycle: z
      .enum(['active', 'retired', 'deprecated', 'supported', 'withdrawn'])
      .optional(),
    state: z
      .enum([
        'draft',
        'review',
        'approved',
        'scheduled',
        'active',
        'superseded',
        'retired',
        'blocked',
        'compiled',
      ])
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: CmsOpaqueCursorSchema.optional(),
    sort: z.enum(['key', 'createdAt', 'updatedAt', 'version']).default('key'),
    direction: z.enum(['asc', 'desc']).default('asc'),
  })
  .superRefine((value, context) => {
    const lifecycleKinds = new Set([
      'content_type',
      'field_definition_version',
      'block_definition_registry_record',
    ]);
    if (
      value.resourceKind &&
      value.lifecycle &&
      !lifecycleKinds.has(value.resourceKind)
    )
      context.addIssue({
        code: 'custom',
        path: ['lifecycle'],
        message: 'lifecycle_filter_incompatible',
      });
    if (
      value.resourceKind &&
      value.state &&
      lifecycleKinds.has(value.resourceKind)
    )
      context.addIssue({
        code: 'custom',
        path: ['state'],
        message: 'state_filter_incompatible',
      });
    if (
      value.resourceKind === 'content_type' &&
      value.lifecycle &&
      !['active', 'retired'].includes(value.lifecycle)
    )
      context.addIssue({
        code: 'custom',
        path: ['lifecycle'],
        message: 'content_type_lifecycle_invalid',
      });
    if (
      value.resourceKind === 'field_definition_version' &&
      value.lifecycle &&
      !['active', 'deprecated', 'retired'].includes(value.lifecycle)
    )
      context.addIssue({
        code: 'custom',
        path: ['lifecycle'],
        message: 'field_lifecycle_invalid',
      });
    if (
      value.resourceKind === 'block_definition_registry_record' &&
      value.lifecycle &&
      !CmsBlockLifecycleSchema.options.includes(value.lifecycle as never)
    )
      context.addIssue({
        code: 'custom',
        path: ['lifecycle'],
        message: 'block_lifecycle_invalid',
      });
  })
  .readonly();

export const ContentSchemaRegistryDetailParamsSchema = z
  .strictObject({
    contentTypeId: CmsUuidSchema,
    versionId: CmsUuidSchema,
  })
  .readonly();

export const ReleaseEnvelopeHeadersSchema = z
  .strictObject({
    keyId: CmsReleaseKeyIdSchema,
    issuedAt: CmsInstantSchema,
    nonce: CmsUuidSchema,
    signature: CmsEd25519SignatureSchema,
  })
  .readonly();

export type ContentSchemaRegistryListQuery = z.infer<
  typeof ContentSchemaRegistryListQuerySchema
>;
