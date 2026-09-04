import { z } from 'zod';

import { JsonValueSchema } from '../api-error.ts';
import {
  CmsEd25519SignatureSchema,
  CmsFieldKeySchema,
  CmsReleaseKeyIdSchema,
} from './primitives.ts';

export const PropsSchemaFieldSchema = z
  .strictObject({
    name: CmsFieldKeySchema,
    kind: z.string().min(1).max(64),
    required: z.boolean(),
    constraints: z.record(z.string().max(128), JsonValueSchema).optional(),
  })
  .readonly();
export const PropsSchemaSnapshotSchema = z
  .strictObject({
    schemaVersion: z.string().min(1).max(32),
    fields: z.array(PropsSchemaFieldSchema).max(128).readonly(),
    additionalProperties: z.literal(false),
  })
  .readonly();
export const PropsSnapshotAttestationSchema = z
  .strictObject({
    algorithm: z.literal('Ed25519'),
    keyId: CmsReleaseKeyIdSchema,
    signature: CmsEd25519SignatureSchema,
  })
  .readonly();
export const BlockAccessibilitySchema = z
  .strictObject({
    nameRequired: z.boolean(),
    keyboard: z.literal(true),
    focusOrder: z.enum(['document', 'managed']),
    statusAnnouncement: z.boolean(),
  })
  .readonly();
export const BlockCompatibilitySchema = z
  .strictObject({
    minSchemaCompiler: z.string().min(1).max(32),
    maxSchemaCompiler: z.string().min(1).max(32),
  })
  .readonly();
export const BlockSlotRulesSchema = z
  .strictObject({
    maxDepth: z.number().int().min(1).max(16),
    maxNodes: z.number().int().min(1).max(512),
  })
  .readonly();
