import { z } from 'zod';

import {
  ConfigurationTelemetryBaseSchema,
  ConfigurationTelemetryCodeSchema,
  ConfigurationTelemetryCountSchema,
  ConfigurationTelemetryLatencySchema,
} from './telemetry-common.ts';
import {
  ConfigurationHashSchema,
  ConfigurationRiskClassSchema,
  ConfigurationScopeTypeSchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

export const ConfigDefinitionRegisteredTelemetrySchema =
  ConfigurationTelemetryBaseSchema.extend({
    eventName: z.literal('cfg.definition.registered'),
    operationId: z.literal('CFG-05A-01'),
    definitionId: ConfigurationUuidSchema.nullable(),
    version: ConfigurationVersionSchema.nullable(),
    keyHash: ConfigurationHashSchema.nullable(),
    risk: ConfigurationRiskClassSchema.nullable(),
    releaseId: ConfigurationTelemetryCodeSchema.nullable(),
    releasePrincipalHash: ConfigurationHashSchema.nullable(),
    metrics: z.strictObject({
      latencyMs: ConfigurationTelemetryLatencySchema,
      rejectedProtectedDefinitions: ConfigurationTelemetryCountSchema,
    }),
    traceSteps: z.array(z.enum(['release_principal', 'rpc', 'outbox'])).max(3),
  }).strict();

export const ConfigValueResolvedTelemetrySchema =
  ConfigurationTelemetryBaseSchema.extend({
    eventName: z.literal('cfg.value.resolved'),
    operationId: z.literal('CFG-05A-02'),
    definitionId: ConfigurationUuidSchema.nullable(),
    version: ConfigurationVersionSchema.nullable(),
    sourceScope: ConfigurationScopeTypeSchema.nullable(),
    isDefault: z.boolean().nullable(),
    compatibility: z
      .enum(['exact', 'last_compatible', 'contract_fallback'])
      .nullable(),
    metrics: z.strictObject({
      resolverLatencyMs: ConfigurationTelemetryLatencySchema,
      fallbackCount: ConfigurationTelemetryCountSchema,
      unknownCount: ConfigurationTelemetryCountSchema,
    }),
    traceSteps: z.array(z.enum(['db_query', 'evaluator'])).max(2),
  }).strict();
