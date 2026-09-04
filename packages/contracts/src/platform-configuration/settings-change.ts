import { z } from 'zod';

import {
  ConfigurationHashSchema,
  ConfigurationInstantSchema,
  ConfigurationIntervalSchema,
  ConfigurationJsonObjectSchema,
  ConfigurationJsonValueSchema,
  ConfigurationKeySchema,
  ConfigurationScopeTypeSchema,
  ConfigurationTextSchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

export const Cfg05a03ProposeChangeRequestSchema = z.strictObject({
  scopeType: ConfigurationScopeTypeSchema,
  scopeId: ConfigurationUuidSchema.nullable(),
  environment: z.string().trim().min(1).max(64).nullable(),
  typedValue: ConfigurationJsonValueSchema,
  interval: ConfigurationIntervalSchema,
  expectedDefinitionVersion: ConfigurationVersionSchema,
  impactManifest: ConfigurationJsonObjectSchema,
  rollbackCandidate: ConfigurationJsonValueSchema.nullable(),
  reason: ConfigurationTextSchema,
  consumerKeys: z.array(ConfigurationKeySchema).min(1).max(64),
});

export const Cfg05a03ChangeResponseSchema = z.strictObject({
  reviewId: ConfigurationUuidSchema,
  candidateValueVersionId: ConfigurationUuidSchema,
  definitionId: ConfigurationUuidSchema,
  definitionVersion: ConfigurationVersionSchema,
  state: z.literal('draft'),
  valueHash: ConfigurationHashSchema,
  impactManifestHash: ConfigurationHashSchema,
  effectivePreview: ConfigurationJsonValueSchema,
  rollbackAvailable: z.boolean(),
  submittedAt: ConfigurationInstantSchema,
});

export const Cfg05a04ChangeActionRequestSchema = z
  .strictObject({
    action: z.enum(['approve', 'schedule', 'activate', 'rollback']),
    expectedReviewVersion: ConfigurationVersionSchema,
    candidateHash: ConfigurationHashSchema,
    approvalReason: ConfigurationTextSchema,
    stepUpToken: z.string().min(20).max(4_096).optional(),
    scheduledFor: ConfigurationInstantSchema.nullable().optional(),
    rollbackValue: ConfigurationJsonValueSchema.optional(),
    canaryPercent: z.number().min(0).max(100).optional(),
  })
  .superRefine((value, context) => {
    if (value.action === 'schedule' && value.scheduledFor === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledFor'],
        message: 'schedule_time_required',
      });
    }
    if (value.action === 'rollback' && value.rollbackValue === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['rollbackValue'],
        message: 'rollback_value_required',
      });
    }
  });

export const Cfg05a04ChangeActionResponseSchema = z.strictObject({
  reviewId: ConfigurationUuidSchema,
  resultingValueVersionId: ConfigurationUuidSchema,
  resultingState: z.enum([
    'draft',
    'review',
    'approved',
    'scheduled',
    'active',
    'superseded',
    'rolled_back',
  ]),
  resultingVersion: ConfigurationVersionSchema,
  candidateHash: ConfigurationHashSchema,
  approvalCount: z.number().int().min(0).max(5),
  snapshotIntentId: ConfigurationUuidSchema.nullable(),
  outboxEventId: ConfigurationUuidSchema,
  effectiveAt: ConfigurationInstantSchema.nullable(),
});

export type Cfg05a03ProposeChangeRequest = z.infer<
  typeof Cfg05a03ProposeChangeRequestSchema
>;
export type Cfg05a04ChangeActionRequest = z.infer<
  typeof Cfg05a04ChangeActionRequestSchema
>;
