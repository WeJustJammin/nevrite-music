import { z } from 'zod';

import {
  CmsCapabilityKeySchema,
  CmsLocaleSchema,
  CmsTypeKeySchema,
  CmsUuidSchema,
  CmsWorkflowKeySchema,
  CmsVersionSchema,
  CmsInstantSchema,
} from './primitives.ts';
import {
  CmsCompatibilitySchema,
  WorkflowPolicyEvidenceSchema,
} from './models.ts';
import { resourceMetaShape } from './resources-meta.ts';

export const ContentTypeResourceSchema = z
  .strictObject({
    resourceKind: z.literal('content_type'),
    id: CmsUuidSchema,
    version: CmsVersionSchema,
    typeKey: CmsTypeKeySchema,
    builtIn: z.boolean(),
    lifecycle: z.enum(['active', 'retired']),
    createdAt: CmsInstantSchema,
    updatedAt: CmsInstantSchema,
  })
  .readonly();

export const ContentTypeVersionStateSchema = z.enum([
  'draft',
  'review',
  'approved',
  'scheduled',
  'active',
  'superseded',
  'retired',
  'blocked',
]);

export const ContentTypeVersionResourceSchema = z
  .strictObject({
    ...resourceMetaShape,
    resourceKind: z.literal('content_type_version'),
    state: ContentTypeVersionStateSchema,
    contentTypeId: CmsUuidSchema,
    typeKey: CmsTypeKeySchema,
    label: z.string().trim().min(2).max(120),
    ownerCapability: CmsCapabilityKeySchema,
    sourceLocale: CmsLocaleSchema,
    defaultLocale: CmsLocaleSchema,
    workflowKey: CmsWorkflowKeySchema,
    workflowVersion: CmsVersionSchema,
    defaultTemplateVersionId: CmsUuidSchema.nullable(),
    schemaArtifactId: CmsUuidSchema,
    fieldCount: z.number().int().nonnegative().max(128),
    relationCount: z.number().int().nonnegative().max(128),
    capabilityBindingCount: z.number().int().nonnegative().max(32),
    compatibility: CmsCompatibilitySchema,
    dryRunId: CmsUuidSchema.nullable(),
    activationEvidence: WorkflowPolicyEvidenceSchema.nullable(),
  })
  .superRefine((value, context) => {
    if (
      ['active', 'superseded', 'retired'].includes(value.state) &&
      value.activationEvidence === null
    )
      context.addIssue({
        code: 'custom',
        path: ['activationEvidence'],
        message: 'activation_evidence_required',
      });
  })
  .readonly();
