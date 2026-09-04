import { z } from 'zod';

import { ConfigurationUuidSchema } from './primitives.ts';

export const ConfigurationTelemetryOutcomeSchema = z.enum([
  'success',
  'rejected',
  'failure',
  'fallback',
  'pending',
  'unknown',
]);

export const ConfigurationTelemetryCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u);

export const ConfigurationTelemetryLatencySchema = z
  .number()
  .finite()
  .nonnegative();
export const ConfigurationTelemetryCountSchema = z.number().int().nonnegative();

export const ConfigurationTelemetryBaseSchema = z.strictObject({
  requestId: ConfigurationUuidSchema,
  correlationId: ConfigurationUuidSchema,
  durationMs: ConfigurationTelemetryLatencySchema,
  outcome: ConfigurationTelemetryOutcomeSchema,
});
