import { z } from 'zod';

import {
  AdminCursorSchema,
  AdminFreshnessSchema,
  AdminRegistryCodeSchema,
  AdminTaskClassSchema,
  AdminTaskStateSchema,
} from './admin-common.ts';
import {
  ConfigurationInstantSchema,
  ConfigurationKeySchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

export const Cfg05b01InboxQuerySchema = z.strictObject({
  cursor: AdminCursorSchema.optional(),
  limit: z.number().int().min(1).max(50).default(25),
  taskClasses: z.array(AdminTaskClassSchema).max(8).optional(),
  states: z.array(AdminTaskStateSchema).max(5).optional(),
  staleAfter: ConfigurationInstantSchema.optional(),
});

const AdminTaskProjectionSchema = z.strictObject({
  taskId: ConfigurationUuidSchema,
  sourceType: AdminRegistryCodeSchema,
  sourceId: ConfigurationUuidSchema,
  sourceVersion: ConfigurationVersionSchema,
  taskClass: AdminTaskClassSchema,
  requiredCapability: ConfigurationKeySchema,
  assigneePersonId: ConfigurationUuidSchema.nullable(),
  dueAt: ConfigurationInstantSchema.nullable(),
  severity: z.enum(['info', 'warning', 'high', 'critical']),
  freshnessAt: ConfigurationInstantSchema,
  freshness: AdminFreshnessSchema,
  state: AdminTaskStateSchema,
  sourceStatus: z.string().max(64),
  canAct: z.boolean(),
});

export const Cfg05b01InboxResponseSchema = z.strictObject({
  items: z.array(AdminTaskProjectionSchema).max(50),
  nextCursor: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,256}$/u)
    .nullable(),
  aggregateFreshness: AdminFreshnessSchema,
  partialSources: z.array(z.string().max(64)).max(16),
  generatedAt: ConfigurationInstantSchema,
});

export type Cfg05b01InboxQuery = z.infer<typeof Cfg05b01InboxQuerySchema>;
export type Cfg05b01InboxResponse = z.infer<typeof Cfg05b01InboxResponseSchema>;
