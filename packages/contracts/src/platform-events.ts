import { z } from 'zod';

const CanonicalUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
const RegistryKeySchema = z.string().regex(/^[a-z][a-z0-9_.:-]{0,127}$/);

export const PositiveBigintDecimalSchema = z
  .string()
  .regex(/^[1-9]\d{0,18}$/)
  .refine((value) => BigInt(value) <= 9_223_372_036_854_775_807n, {
    message: 'Version exceeds the positive bigint range',
  });

export const PlatformEventTypeSchema = z.enum([
  'job.requested',
  'object.uploaded',
  'provider.operation.requested',
  'webhook.accepted',
]);

const EventBaseSchema = z
  .object({
    eventId: CanonicalUuidSchema,
    schemaVersion: z.literal(1),
    aggregateType: RegistryKeySchema,
    aggregateId: CanonicalUuidSchema,
    aggregateVersion: PositiveBigintDecimalSchema,
    correlationId: CanonicalUuidSchema,
    causationId: CanonicalUuidSchema.nullable(),
    actorId: CanonicalUuidSchema.nullable(),
    actingPartyId: CanonicalUuidSchema.nullable(),
    occurredAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const PlatformEventSchema = z.discriminatedUnion('eventType', [
  EventBaseSchema.extend({
    eventType: z.literal('job.requested'),
    payload: z
      .object({ jobId: CanonicalUuidSchema, jobType: RegistryKeySchema })
      .strict()
      .readonly(),
  }).strict(),
  EventBaseSchema.extend({
    eventType: z.literal('object.uploaded'),
    payload: z.object({ objectId: CanonicalUuidSchema }).strict().readonly(),
  }).strict(),
  EventBaseSchema.extend({
    eventType: z.literal('provider.operation.requested'),
    payload: z.object({ operationId: CanonicalUuidSchema }).strict().readonly(),
  }).strict(),
  EventBaseSchema.extend({
    eventType: z.literal('webhook.accepted'),
    payload: z.object({ receiptId: CanonicalUuidSchema }).strict().readonly(),
  }).strict(),
]);

export const QueueEnvelopeSchema = z
  .object({
    eventId: CanonicalUuidSchema,
    eventType: PlatformEventTypeSchema,
    schemaVersion: z.literal(1),
    aggregateType: RegistryKeySchema,
    aggregateId: CanonicalUuidSchema,
    aggregateVersion: PositiveBigintDecimalSchema,
    correlationId: CanonicalUuidSchema,
    causationId: CanonicalUuidSchema.nullable(),
  })
  .strict()
  .readonly();

export type PlatformEvent = z.infer<typeof PlatformEventSchema>;
export type QueueEnvelope = z.infer<typeof QueueEnvelopeSchema>;
