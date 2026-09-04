import { z } from 'zod';

import {
  ConfigurationTelemetryBaseSchema,
  ConfigurationTelemetryCountSchema,
  ConfigurationTelemetryLatencySchema,
} from './telemetry-common.ts';
import {
  ConfigurationHashSchema,
  ConfigurationInstantSchema,
  ConfigurationScopeTypeSchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

export const ConfigFlagChangedTelemetrySchema =
  ConfigurationTelemetryBaseSchema.extend({
    eventName: z.literal('cfg.flag.changed'),
    operationId: z.literal('CFG-05A-05'),
    flagId: ConfigurationUuidSchema,
    version: ConfigurationVersionSchema,
    state: z.enum(['draft', 'active', 'paused', 'expired', 'retired']),
    environmentCount: z.number().int().min(1).max(16),
    expiry: ConfigurationInstantSchema,
    metrics: z.strictObject({
      fallbackCount: ConfigurationTelemetryCountSchema,
      staleOwnerCount: ConfigurationTelemetryCountSchema,
    }),
    traceSteps: z.array(z.enum(['policy', 'evaluator'])).max(2),
  }).strict();

export const ConfigExperimentChangedTelemetrySchema =
  ConfigurationTelemetryBaseSchema.extend({
    eventName: z.literal('cfg.experiment.changed'),
    operationId: z.literal('CFG-05A-06'),
    experimentId: ConfigurationUuidSchema,
    version: ConfigurationVersionSchema,
    state: z.enum([
      'draft',
      'approved',
      'running',
      'paused',
      'stopped',
      'completed',
    ]),
    dimensionCount: z.number().int().min(1).max(16),
    consentStatus: z.enum(['verified', 'missing', 'rejected', 'not_required']),
    metrics: z.strictObject({
      protectedDimensionRejects: ConfigurationTelemetryCountSchema,
      assignmentDeterminismFailures: ConfigurationTelemetryCountSchema,
    }),
    traceSteps: z.array(z.literal('consent_registry')).max(1),
  }).strict();

export const ConfigKillSwitchChangedTelemetrySchema =
  ConfigurationTelemetryBaseSchema.extend({
    eventName: z.literal('cfg.kill_switch.changed'),
    operationId: z.literal('CFG-05A-07'),
    switchId: ConfigurationUuidSchema,
    version: ConfigurationVersionSchema,
    activationId: ConfigurationUuidSchema,
    scopeType: ConfigurationScopeTypeSchema,
    runtimeHash: ConfigurationHashSchema,
    state: z.enum(['requested', 'active', 'resolving', 'ended']),
    metrics: z.strictObject({
      activationLatencyMs: ConfigurationTelemetryLatencySchema,
      fallbackCount: ConfigurationTelemetryCountSchema,
      reconciliationLagMs: ConfigurationTelemetryLatencySchema,
    }),
    traceSteps: z
      .array(z.enum(['step_up', 'rpc', 'runtime_verification']))
      .max(3),
  }).strict();
