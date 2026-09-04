import { z } from 'zod';

import {
  OwnerSchema,
  RegistryKeySchema,
  RunbookSchema,
} from './registry-primitives.ts';

export {
  RouteRegistryEntrySchema,
  type RouteRegistryEntry,
} from './route-registry-contract.ts';

export const EventTypeVersionPairSchema = z
  .object({
    eventType: RegistryKeySchema,
    schemaVersion: z.number().int().positive(),
  })
  .strict()
  .readonly();

const AcceptedEventsSchema = z
  .array(EventTypeVersionPairSchema)
  .min(1)
  .max(16)
  .superRefine((pairs, context) => {
    const seen = new Set<string>();
    for (const [index, pair] of pairs.entries()) {
      const key = `${pair.eventType}/${pair.schemaVersion}`;
      if (seen.has(key)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate accepted event pair: ${key}`,
          path: [index],
        });
      }
      seen.add(key);
    }
  })
  .readonly();

export const ConsumerRegistryEntrySchema = z
  .object({
    consumerId: RegistryKeySchema,
    owner: OwnerSchema,
    messageSchema: z.string().min(1).max(128),
    queueName: RegistryKeySchema,
    leaseSeconds: z.number().int().min(60).max(840),
    heartbeatSeconds: z.literal(60),
    maxLeaseSeconds: z.literal(840),
    maxDeliveries: z.literal(4),
    retryClass: RegistryKeySchema,
    retryDelaysSeconds: z
      .tuple([z.literal(15), z.literal(60), z.literal(300)])
      .readonly(),
    deadLetterClass: RegistryKeySchema,
    acceptedEvents: AcceptedEventsSchema,
    sloTier: RegistryKeySchema,
    runbook: RunbookSchema,
  })
  .strict()
  .readonly();

export const ProviderRegistryEntrySchema = z
  .object({
    providerId: RegistryKeySchema,
    owner: OwnerSchema,
    adapter: RegistryKeySchema,
    credentialBinding: z.string().regex(/^[A-Z][A-Z0-9_]{2,127}$/),
    replayWindowSeconds: z.number().int().positive().max(86_400),
    sloTier: RegistryKeySchema,
    runbook: RunbookSchema,
  })
  .strict()
  .readonly();

export const RetentionRegistryEntrySchema = z
  .object({
    dataClass: RegistryKeySchema,
    owner: OwnerSchema,
    retentionDays: z.number().int().positive().max(36_500),
    deletionMode: z.enum(['hard_delete', 'redact', 'tombstone']),
    legalHoldSupported: z.boolean(),
    runbook: RunbookSchema,
  })
  .strict()
  .readonly();

export const SloRegistryEntrySchema = z
  .object({
    tier: RegistryKeySchema,
    owner: OwnerSchema,
    targetBasisPoints: z.number().int().min(1).max(10_000),
    measurementLabel: RegistryKeySchema,
    alertRoute: RegistryKeySchema,
    runbook: RunbookSchema,
  })
  .strict()
  .readonly();

export type EventTypeVersionPair = z.infer<typeof EventTypeVersionPairSchema>;
export type ConsumerRegistryEntry = z.infer<typeof ConsumerRegistryEntrySchema>;
export type ProviderRegistryEntry = z.infer<typeof ProviderRegistryEntrySchema>;
export type RetentionRegistryEntry = z.infer<
  typeof RetentionRegistryEntrySchema
>;
export type SloRegistryEntry = z.infer<typeof SloRegistryEntrySchema>;
