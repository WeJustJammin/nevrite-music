import { z } from 'zod';

import { AdminRegistryCodeSchema } from './admin-common.ts';
import {
  ConfigurationHashSchema,
  ConfigurationKeySchema,
  ConfigurationTextSchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

const BulkTargetSchema = z.strictObject({
  targetType: AdminRegistryCodeSchema,
  targetId: ConfigurationUuidSchema,
  expectedVersion: ConfigurationVersionSchema,
});
const BulkActionSchema = z.enum(['preview', 'run', 'cancel']);

export const Cfg05b03BulkActionRequestSchema = z
  .strictObject({
    action: BulkActionSchema,
    commandKey: ConfigurationKeySchema,
    commandVersion: ConfigurationVersionSchema,
    targets: z.array(BulkTargetSchema).min(1).max(500),
    manifestHash: ConfigurationHashSchema,
    dryRunId: ConfigurationUuidSchema.nullable(),
    reason: ConfigurationTextSchema,
    stepUpToken: z.string().min(20).max(4_096).optional(),
  })
  .superRefine((value, context) => {
    const targetKeys = value.targets.map(
      ({ targetType, targetId }) => `${targetType}:${targetId}`,
    );
    if (new Set(targetKeys).size !== targetKeys.length) {
      context.addIssue({
        code: 'custom',
        path: ['targets'],
        message: 'duplicate_target',
      });
    }
    if (value.action === 'run' && value.dryRunId === null) {
      context.addIssue({
        code: 'custom',
        path: ['dryRunId'],
        message: 'run_requires_dry_run',
      });
    }
    if (value.action === 'preview' && value.dryRunId !== null) {
      context.addIssue({
        code: 'custom',
        path: ['dryRunId'],
        message: 'preview_forbids_dry_run',
      });
    }
  });

const BulkItemResultSchema = z.strictObject({
  targetId: ConfigurationUuidSchema,
  targetType: AdminRegistryCodeSchema,
  expectedVersion: ConfigurationVersionSchema,
  state: z.enum(['pending', 'succeeded', 'failed', 'skipped', 'cancelled']),
  attemptCount: z.number().int().min(0).max(3),
  errorCode: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]{2,63}$/u)
    .nullable(),
});

export const Cfg05b03BulkActionResponseSchema = z.strictObject({
  bulkOperationId: ConfigurationUuidSchema,
  commandKey: ConfigurationKeySchema,
  commandVersion: ConfigurationVersionSchema,
  manifestHash: ConfigurationHashSchema,
  state: z.enum([
    'draft',
    'dry_run',
    'approved',
    'running',
    'completed',
    'partial',
    'failed',
    'cancelled',
  ]),
  targetCount: z.number().int().min(1).max(500),
  successCount: z.number().int().min(0).max(500),
  failureCount: z.number().int().min(0).max(500),
  skippedCount: z.number().int().min(0).max(500),
  cursor: z.number().int().min(0).max(500),
  itemResults: z.array(BulkItemResultSchema).max(500),
  outboxEventId: ConfigurationUuidSchema.nullable(),
});

export type Cfg05b03BulkActionRequest = z.infer<
  typeof Cfg05b03BulkActionRequestSchema
>;
export type Cfg05b03BulkActionResponse = z.infer<
  typeof Cfg05b03BulkActionResponseSchema
>;
