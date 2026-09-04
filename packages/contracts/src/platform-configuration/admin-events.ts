import { z } from 'zod';

import {
  ConfigurationInstantSchema,
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

export const AdminWorkspaceEventTypeSchema = z.enum([
  'admin.capability.changed.v1',
  'admin.bulk.changed.v1',
  'quality.diagnostic.changed.v1',
]);

const AdminWorkspaceEventBaseSchema = z.strictObject({
  eventId: ConfigurationUuidSchema,
  eventType: AdminWorkspaceEventTypeSchema,
  occurredAt: ConfigurationInstantSchema,
  requestId: ConfigurationUuidSchema,
  correlationId: ConfigurationUuidSchema,
  actorRef: ConfigurationUuidSchema.nullable(),
  aggregateId: ConfigurationUuidSchema,
  aggregateVersion: ConfigurationVersionSchema,
});

export const AdminCapabilityChangedV1Schema = z
  .strictObject({
    grantId: ConfigurationUuidSchema,
    subjectPersonId: ConfigurationUuidSchema,
  })
  .readonly();

export const AdminBulkChangedV1Schema = z
  .strictObject({ bulkOperationId: ConfigurationUuidSchema })
  .readonly();

export const QualityDiagnosticChangedV1Schema = z
  .strictObject({ diagnosticRunId: ConfigurationUuidSchema })
  .readonly();

const AdminCapabilityChangedEventSchema = AdminWorkspaceEventBaseSchema.extend({
  eventType: z.literal('admin.capability.changed.v1'),
  payload: AdminCapabilityChangedV1Schema,
})
  .strict()
  .readonly();
const AdminBulkChangedEventSchema = AdminWorkspaceEventBaseSchema.extend({
  eventType: z.literal('admin.bulk.changed.v1'),
  payload: AdminBulkChangedV1Schema,
})
  .strict()
  .readonly();
const QualityDiagnosticChangedEventSchema =
  AdminWorkspaceEventBaseSchema.extend({
    eventType: z.literal('quality.diagnostic.changed.v1'),
    payload: QualityDiagnosticChangedV1Schema,
  })
    .strict()
    .readonly();

export const AdminWorkspaceEventSchema = z.discriminatedUnion('eventType', [
  AdminCapabilityChangedEventSchema,
  AdminBulkChangedEventSchema,
  QualityDiagnosticChangedEventSchema,
]);

export const AdminWorkspaceEventEnvelopeSchema = z
  .strictObject({
    ...AdminWorkspaceEventBaseSchema.shape,
    payload: z.json(),
  })
  .readonly();

export type AdminWorkspaceEventType = z.infer<
  typeof AdminWorkspaceEventTypeSchema
>;
export type AdminCapabilityChangedV1 = z.infer<
  typeof AdminCapabilityChangedV1Schema
>;
export type AdminBulkChangedV1 = z.infer<typeof AdminBulkChangedV1Schema>;
export type QualityDiagnosticChangedV1 = z.infer<
  typeof QualityDiagnosticChangedV1Schema
>;
export type AdminWorkspaceEvent = z.infer<typeof AdminWorkspaceEventSchema>;
