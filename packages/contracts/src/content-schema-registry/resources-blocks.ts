import { z } from 'zod';

import {
  CmsBlockLifecycleSchema,
  PropsSchemaSnapshotSchema,
  PropsSnapshotAttestationSchema,
} from './models.ts';
import {
  CmsArtifactRefSchema,
  CmsBlockKeySchema,
  CmsHashSchema,
  CmsInstantSchema,
  CmsReleaseKeyIdSchema,
  CmsRendererRefSchema,
  CmsUuidSchema,
  CmsVersionSchema,
} from './primitives.ts';
import { resourceMetaShape } from './resources-meta.ts';

export const BlockDefinitionVersionResourceSchema = z
  .strictObject({
    ...resourceMetaShape,
    resourceKind: z.literal('block_definition_version'),
    blockKey: CmsBlockKeySchema,
    blockVersion: z.number().int().positive().max(2_147_483_647),
    propsSchemaRef: CmsArtifactRefSchema,
    propsSchemaHash: CmsHashSchema,
    propsSchemaSnapshot: PropsSchemaSnapshotSchema,
    propsSnapshotHash: CmsHashSchema,
    propsSnapshotAttestation: PropsSnapshotAttestationSchema,
    rendererRef: CmsRendererRefSchema,
    releaseDigest: CmsHashSchema,
    releaseKeyId: CmsReleaseKeyIdSchema,
    releaseRawBodyHash: CmsHashSchema,
    releaseSignatureHash: CmsHashSchema,
    releaseNonceHash: CmsHashSchema,
    releaseVerifiedAt: CmsInstantSchema,
    lifecycle: CmsBlockLifecycleSchema,
  })
  .readonly();

export const BlockDefinitionRegistryRecordSchema = z
  .strictObject({
    resourceKind: z.literal('block_definition_registry_record'),
    id: CmsUuidSchema,
    version: CmsVersionSchema,
    blockKey: CmsBlockKeySchema,
    blockVersion: z.number().int().positive().max(2_147_483_647),
    propsSchemaRef: CmsArtifactRefSchema,
    propsSchemaHash: CmsHashSchema,
    rendererRef: CmsRendererRefSchema,
    releaseDigest: CmsHashSchema,
    lifecycle: CmsBlockLifecycleSchema,
  })
  .readonly();

export const BlockLifecycleEventResourceSchema = z
  .strictObject({
    resourceKind: z.literal('block_definition_lifecycle_event'),
    id: CmsUuidSchema,
    version: CmsVersionSchema,
    blockDefinitionVersionId: CmsUuidSchema,
    blockKey: CmsBlockKeySchema,
    blockVersion: z.number().int().positive().max(2_147_483_647),
    fromLifecycle: z.enum(['supported', 'deprecated']),
    toLifecycle: z.enum(['deprecated', 'withdrawn']),
    lifecycle: z.enum(['deprecated', 'withdrawn']),
    releaseDigest: CmsHashSchema,
    releaseKeyId: CmsReleaseKeyIdSchema,
    releaseNonceHash: CmsHashSchema,
    releaseVerifiedAt: CmsInstantSchema,
    eventType: z.literal('cms.block.lifecycle.changed.v1'),
    createdAt: CmsInstantSchema,
  })
  .superRefine((value, context) => {
    if (value.toLifecycle !== value.lifecycle)
      context.addIssue({
        code: 'custom',
        path: ['lifecycle'],
        message: 'lifecycle_event_state_mismatch',
      });
  })
  .readonly();

/** Capability-safe receipt used for generated API documentation and clients. */
export const BlockLifecycleEventReceiptSchema = z
  .strictObject({
    resourceKind: z.literal('block_definition_lifecycle_event'),
    id: CmsUuidSchema,
    version: CmsVersionSchema,
    blockDefinitionVersionId: CmsUuidSchema,
    blockKey: CmsBlockKeySchema,
    blockVersion: z.number().int().positive().max(2_147_483_647),
    fromLifecycle: z.enum(['supported', 'deprecated']),
    toLifecycle: z.enum(['deprecated', 'withdrawn']),
    lifecycle: z.enum(['deprecated', 'withdrawn']),
    releaseDigest: CmsHashSchema,
    eventType: z.literal('cms.block.lifecycle.changed.v1'),
    createdAt: CmsInstantSchema,
  })
  .readonly();
