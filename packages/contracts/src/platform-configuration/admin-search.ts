import { z } from 'zod';

import {
  AdminCursorSchema,
  AdminFreshnessSchema,
  AdminRegistryCodeSchema,
} from './admin-common.ts';
import {
  ConfigurationUuidSchema,
  ConfigurationVersionSchema,
} from './primitives.ts';

const SearchEntitySchema = z.enum([
  'content',
  'media',
  'navigation',
  'setting',
  'job',
  'audit_ref',
  'diagnostic',
  'capability',
]);
const SearchFilterSchema = z.strictObject({
  field: AdminRegistryCodeSchema,
  operator: z.enum(['equals', 'prefix', 'contains', 'before', 'after', 'in']),
  value: z.union([z.string().max(256), z.array(z.string().max(256)).max(32)]),
});
const SearchSortSchema = z.strictObject({
  field: AdminRegistryCodeSchema,
  direction: z.enum(['asc', 'desc']),
});

export const Cfg05b02SearchRequestSchema = z.strictObject({
  entityType: SearchEntitySchema,
  fields: z.array(AdminRegistryCodeSchema).min(1).max(24),
  filters: z.array(SearchFilterSchema).max(16),
  sort: z.array(SearchSortSchema).max(4),
  snippet: z.boolean().default(false),
  minCount: z.number().int().min(0).max(20).default(0),
  cursor: AdminCursorSchema.optional(),
  limit: z.number().int().min(1).max(50).default(25),
});

const SearchFieldValueSchema = z.union([
  z.string().max(512),
  z.number(),
  z.boolean(),
  z.null(),
]);
const SearchResultSchema = z.strictObject({
  entityId: ConfigurationUuidSchema,
  entityVersion: ConfigurationVersionSchema,
  fields: z.record(z.string().max(64), SearchFieldValueSchema),
  snippet: z.string().max(512).nullable(),
  authorized: z.literal(true),
});

export const Cfg05b02SearchResponseSchema = z.strictObject({
  entityType: SearchEntitySchema,
  results: z.array(SearchResultSchema).max(50),
  count: z.number().int().min(0).max(1_000_000).nullable(),
  countState: z.enum(['exact', 'suppressed', 'unknown']),
  nextCursor: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,256}$/u)
    .nullable(),
  freshnessAt: z.string().datetime({ offset: true }),
  freshness: AdminFreshnessSchema,
});

export type Cfg05b02SearchRequest = z.infer<typeof Cfg05b02SearchRequestSchema>;
export type Cfg05b02SearchResponse = z.infer<
  typeof Cfg05b02SearchResponseSchema
>;
