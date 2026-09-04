import { z } from 'zod';

export const CmsFieldKindSchema = z.enum([
  'short_text',
  'long_text',
  'rich_text',
  'boolean',
  'integer',
  'decimal',
  'date',
  'datetime',
  'enum',
  'taxonomy',
  'relation',
  'media',
  'object',
  'list',
]);
export const CmsDefinitionStateSchema = z.enum([
  'draft',
  'review',
  'approved',
  'scheduled',
  'active',
  'superseded',
  'retired',
  'blocked',
]);
export const CmsFieldLifecycleSchema = z.enum([
  'active',
  'deprecated',
  'retired',
]);
export const CmsBlockLifecycleSchema = z.enum([
  'supported',
  'deprecated',
  'withdrawn',
]);
export const CmsCompatibilitySchema = z.enum([
  'additive',
  'conditional',
  'breaking',
  'unknown',
]);
export const CmsDefaultModeSchema = z.enum(['none', 'literal', 'inherited']);
export const CmsLocalizationModeSchema = z.enum([
  'none',
  'localized',
  'no_fallback',
]);

export type CmsFieldKind = z.infer<typeof CmsFieldKindSchema>;
export type CmsDefinitionState = z.infer<typeof CmsDefinitionStateSchema>;
export type CmsBlockLifecycle = z.infer<typeof CmsBlockLifecycleSchema>;
