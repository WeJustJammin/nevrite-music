import { z } from 'zod';

import {
  InvalidationHintSchema,
  QuotedVersionSchema,
} from './request-navigation-security.ts';

const CanonicalUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
const EventTypeSchema = z.string().regex(/^[a-z][a-z0-9_.:-]{0,127}$/);

export const JobInvalidationHintSchema = z
  .object({
    entityId: CanonicalUuidSchema,
    entityType: z.literal('job'),
    hintedVersion: QuotedVersionSchema,
  })
  .strict()
  .readonly();

export const EventInvalidationHintSchema = z
  .object({
    eventId: CanonicalUuidSchema,
    eventType: EventTypeSchema,
    schemaVersion: z.number().int().positive().max(2_147_483_647),
  })
  .strict()
  .readonly();

export const RealtimeInvalidationHintSchema = z.union([
  InvalidationHintSchema,
  JobInvalidationHintSchema,
  EventInvalidationHintSchema,
]);

export type JobInvalidationHint = z.infer<typeof JobInvalidationHintSchema>;
export type EventInvalidationHint = z.infer<typeof EventInvalidationHintSchema>;
export type RealtimeInvalidationHint = z.infer<
  typeof RealtimeInvalidationHintSchema
>;
