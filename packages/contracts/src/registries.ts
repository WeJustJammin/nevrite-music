import { z } from 'zod';

import {
  ConsumerRegistryEntrySchema,
  ProviderRegistryEntrySchema,
  RetentionRegistryEntrySchema,
  RouteRegistryEntrySchema,
  SloRegistryEntrySchema,
} from './registry-contracts.ts';

const duplicateIssue = (
  context: z.RefinementCtx,
  keys: readonly string[],
  label: string,
): void => {
  const seen = new Set<string>();
  for (const [index, key] of keys.entries()) {
    if (seen.has(key)) {
      context.addIssue({
        code: 'custom',
        message: `Duplicate ${label}: ${key}`,
        path: [index],
      });
    }
    seen.add(key);
  }
};

const RouteRegistrySchema = z
  .array(RouteRegistryEntrySchema)
  .superRefine((entries, context) => {
    duplicateIssue(
      context,
      entries.map(({ method, path }) => `${method} ${path}`),
      'route',
    );
    duplicateIssue(
      context,
      entries.map(({ operationId }) => operationId),
      'operation ID',
    );
  })
  .readonly();

const keyedRegistry = <T extends z.ZodTypeAny>(
  entry: T,
  keyOf: (value: z.infer<T>) => string,
  label: string,
) =>
  z
    .array(entry)
    .superRefine((values, context) => {
      duplicateIssue(context, values.map(keyOf), label);
    })
    .readonly();

const validateSloReferences = (
  registry: {
    routes: readonly { sloTier: string }[];
    consumers: readonly { sloTier: string }[];
    slos: readonly { tier: string }[];
  },
  context: z.RefinementCtx,
): void => {
  const tiers = new Set(registry.slos.map(({ tier }) => tier));
  for (const [index, route] of registry.routes.entries()) {
    if (!tiers.has(route.sloTier)) {
      context.addIssue({
        code: 'custom',
        message: `Unknown SLO tier: ${route.sloTier}`,
        path: ['routes', index, 'sloTier'],
      });
    }
  }
  for (const [index, consumer] of registry.consumers.entries()) {
    if (!tiers.has(consumer.sloTier)) {
      context.addIssue({
        code: 'custom',
        message: `Unknown SLO tier: ${consumer.sloTier}`,
        path: ['consumers', index, 'sloTier'],
      });
    }
  }
};

export const RegistrySetSchema = z
  .object({
    routes: RouteRegistrySchema,
    consumers: keyedRegistry(
      ConsumerRegistryEntrySchema,
      (entry) => entry.consumerId,
      'consumer',
    ),
    providers: keyedRegistry(
      ProviderRegistryEntrySchema,
      (entry) => entry.providerId,
      'provider',
    ),
    retention: keyedRegistry(
      RetentionRegistryEntrySchema,
      (entry) => entry.dataClass,
      'retention class',
    ),
    slos: keyedRegistry(
      SloRegistryEntrySchema,
      (entry) => entry.tier,
      'SLO tier',
    ),
  })
  .strict()
  .superRefine(validateSloReferences)
  .readonly();

export type RegistrySet = z.infer<typeof RegistrySetSchema>;

export const createRegistrySet = (input: unknown): RegistrySet =>
  RegistrySetSchema.parse(input);
