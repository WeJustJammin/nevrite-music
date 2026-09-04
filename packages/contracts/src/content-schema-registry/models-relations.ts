import { z } from 'zod';

import {
  CmsCapabilityKeySchema,
  CmsProjectionKeySchema,
  CmsUuidSchema,
  CmsVersionSchema,
} from './primitives.ts';

const relationShape = {
  fieldId: CmsUuidSchema,
  targetKind: z.enum(['content', 'domain']),
  targetType: z
    .string()
    .regex(/^[a-z][a-z0-9._-]{0,95}$/u, 'target_type_invalid'),
  projectionKey: CmsProjectionKeySchema,
  cardinality: z.enum(['one', 'many']),
  min: z.number().int().finite().min(0).max(128),
  max: z.number().int().finite().min(1).max(128),
  ordered: z.boolean(),
  onUnavailable: z.enum(['omit', 'block', 'placeholder']),
} as const;

const refineRelation = (
  value: { cardinality: 'one' | 'many'; min: number; max: number },
  context: z.RefinementCtx,
) => {
  if (value.min > value.max)
    context.addIssue({
      code: 'custom',
      path: ['min'],
      message: 'relation_min_exceeds_max',
    });
  if (value.cardinality === 'one' && value.max !== 1)
    context.addIssue({
      code: 'custom',
      path: ['max'],
      message: 'one_cardinality_requires_max_one',
    });
  if (value.cardinality === 'one' && ![0, 1].includes(value.min))
    context.addIssue({
      code: 'custom',
      path: ['min'],
      message: 'one_cardinality_requires_min_zero_or_one',
    });
};

export const RelationBindingInputSchema = z
  .strictObject(relationShape)
  .superRefine(refineRelation)
  .readonly();
export const RelationBindingRequestSchema = RelationBindingInputSchema;

export const OpaqueRelationPlaceholderSchema = z
  .strictObject({
    status: z.literal('unavailable'),
    reason: z.literal('unavailable'),
  })
  .readonly();

export const TemplateBindingInputSchema = z
  .strictObject({ templateVersionId: CmsUuidSchema })
  .readonly();
export const CapabilityBindingInputSchema = z
  .strictObject({
    capabilityKey: CmsCapabilityKeySchema,
    capabilityVersion: CmsVersionSchema,
  })
  .readonly();
