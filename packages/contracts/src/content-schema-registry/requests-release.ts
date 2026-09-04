import { z } from 'zod';

import {
  BlockAccessibilitySchema,
  BlockCompatibilitySchema,
  BlockSlotRulesSchema,
  PropsSchemaSnapshotSchema,
  PropsSnapshotAttestationSchema,
} from './models.ts';
import {
  CmsArtifactRefSchema,
  CmsBlockKeySchema,
  CmsCapabilityKeySchema,
  CmsHashSchema,
  CmsRendererRefSchema,
  CmsVersionSchema,
} from './primitives.ts';

export const BlockRegistrationRequestSchema = z
  .strictObject({
    blockKey: CmsBlockKeySchema,
    blockVersion: z.number().int().positive().max(2_147_483_647),
    propsSchemaRef: CmsArtifactRefSchema,
    propsSchemaHash: CmsHashSchema,
    propsSchemaSnapshot: PropsSchemaSnapshotSchema,
    propsSnapshotHash: CmsHashSchema,
    propsSnapshotAttestation: PropsSnapshotAttestationSchema,
    rendererRef: CmsRendererRefSchema,
    allowedChildren: z.array(CmsBlockKeySchema).max(32).readonly(),
    slotRules: BlockSlotRulesSchema,
    dataSourcePermissions: z.array(CmsCapabilityKeySchema).max(32).readonly(),
    accessibility: BlockAccessibilitySchema,
    compatibility: BlockCompatibilitySchema,
    lifecycle: z.literal('supported'),
    releaseDigest: CmsHashSchema,
  })
  .readonly();

export const BlockLifecycleAdvanceRequestSchema = z
  .strictObject({
    fromLifecycle: z.enum(['supported', 'deprecated']),
    toLifecycle: z.enum(['deprecated', 'withdrawn']),
    expectedVersion: CmsVersionSchema,
    releaseDigest: CmsHashSchema,
  })
  .superRefine((value, context) => {
    const supported =
      value.fromLifecycle === 'supported' && value.toLifecycle === 'deprecated';
    const deprecated =
      value.fromLifecycle === 'deprecated' && value.toLifecycle === 'withdrawn';
    if (!supported && !deprecated)
      context.addIssue({
        code: 'custom',
        path: ['toLifecycle'],
        message: 'lifecycle_transition_invalid',
      });
  })
  .readonly();
