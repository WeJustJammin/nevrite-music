import { z } from 'zod';

import { ConfigurationUuidSchema } from './primitives.ts';

export const AdminCursorSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,256}$/u)
  .nullable();

export const AdminRegistryCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9._-]{1,63}$/u);

export const AdminFreshnessSchema = z.enum([
  'healthy',
  'stale',
  'partial',
  'unknown',
  'failed',
]);

export const AdminTaskClassSchema = z.enum([
  'approval',
  'failed_job',
  'schedule',
  'expiring_right',
  'expiring_flag',
  'hold',
  'diagnostic',
  'incident',
]);

export const AdminTaskStateSchema = z.enum([
  'open',
  'assigned',
  'blocked',
  'completed',
  'unknown',
]);

export const AdminGrantScopeSchema = z
  .strictObject({
    actingPartyId: ConfigurationUuidSchema,
  })
  .readonly();

export const AdminPurposeResourceTypeSchema = z.enum([
  'case',
  'order',
  'request',
  'record',
]);

export const AdminPurposeRecoveryActionSchema = z
  .string()
  .regex(
    /^support\.(?:case|order|request|record)\.(?:recover|replay|retry|restore|reissue|redrive)$/u,
  );
