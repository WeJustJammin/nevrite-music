import { z } from 'zod';

import {
  ConfigurationTelemetryBaseSchema,
  ConfigurationTelemetryCountSchema,
  ConfigurationTelemetryLatencySchema,
} from './telemetry-common.ts';
import {
  ConfigurationRiskClassSchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

export const ConfigChangeProposedTelemetrySchema =
  ConfigurationTelemetryBaseSchema.extend({
    eventName: z.literal('cfg.change.proposed'),
    operationId: z.literal('CFG-05A-03'),
    reviewId: ConfigurationUuidSchema.nullable(),
    candidateId: ConfigurationUuidSchema.nullable(),
    candidateVersion: ConfigurationVersionSchema.nullable(),
    risk: z.union([ConfigurationRiskClassSchema, z.literal('unknown')]),
    metrics: z.strictObject({
      draftLatencyMs: ConfigurationTelemetryLatencySchema,
      schemaRejectionCount: ConfigurationTelemetryCountSchema,
    }),
    traceSteps: z
      .array(z.enum(['validation', 'impact_planner', 'rpc', 'outbox']))
      .max(4),
  }).strict();

export const ConfigChangeTransitionedTelemetrySchema =
  ConfigurationTelemetryBaseSchema.extend({
    eventName: z.literal('cfg.change.transitioned'),
    operationId: z.literal('CFG-05A-04'),
    reviewId: ConfigurationUuidSchema.nullable(),
    action: z.enum(['approve', 'schedule', 'activate', 'rollback']).nullable(),
    resultingVersion: ConfigurationVersionSchema.nullable(),
    approvalCount: z.number().int().min(0).max(5).nullable(),
    snapshotIntentId: ConfigurationUuidSchema.nullable(),
    metrics: z.strictObject({
      activationLatencyMs: ConfigurationTelemetryLatencySchema,
      conflictCount: ConfigurationTelemetryCountSchema,
      pendingCount: ConfigurationTelemetryCountSchema,
    }),
    traceSteps: z.array(z.enum(['rpc', 'outbox', 'compiler'])).max(3),
  }).strict();
