import { z } from 'zod';

import { WorkflowPolicyEvidenceSchema } from './models.ts';
import {
  CmsArtifactRefSchema,
  CmsHashSchema,
  CmsInstantSchema,
  CmsUuidSchema,
  CmsVersionSchema,
} from './primitives.ts';
import { resourceMetaShape } from './resources-meta.ts';

export const SchemaArtifactResourceSchema = z
  .strictObject({
    resourceKind: z.literal('schema_artifact'),
    id: CmsUuidSchema,
    version: CmsVersionSchema,
    state: z.literal('compiled'),
    contentTypeVersionId: CmsUuidSchema,
    compilerVersion: z.string().min(1).max(32),
    zodContractRef: CmsArtifactRefSchema,
    artifactHash: CmsHashSchema,
    createdAt: CmsInstantSchema,
    updatedAt: CmsInstantSchema,
    compiledAt: CmsInstantSchema,
  })
  .readonly();

export const SchemaActivationResourceSchema = z
  .strictObject({
    ...resourceMetaShape,
    state: z.literal('active'),
    contentTypeVersionId: CmsUuidSchema,
    activatedAt: CmsInstantSchema.nullable(),
    migrationPlanId: CmsUuidSchema.nullable(),
    activationEvidence: WorkflowPolicyEvidenceSchema,
    jobId: CmsUuidSchema.nullable(),
    eventType: z.literal('cms.schema.activated.v1'),
  })
  .readonly();
