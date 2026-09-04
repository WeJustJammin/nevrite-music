import { z } from 'zod';

import {
  CmsDefinitionStateSchema,
  CmsDefaultModeSchema,
  CmsFieldKindSchema,
  CmsFieldLifecycleSchema,
  CmsLocalizationModeSchema,
} from './models.ts';
import {
  CmsFieldKeySchema,
  CmsProjectionKeySchema,
  CmsTargetTypeSchema,
  CmsUuidSchema,
  CmsValidatorKeySchema,
  CmsVersionSchema,
} from './primitives.ts';
import { resourceMetaShape } from './resources-meta.ts';

export const FieldDefinitionVersionResourceSchema = z
  .strictObject({
    ...resourceMetaShape,
    resourceKind: z.literal('field_definition_version'),
    contentTypeVersionId: CmsUuidSchema,
    stableFieldId: CmsUuidSchema,
    key: CmsFieldKeySchema,
    kind: CmsFieldKindSchema,
    required: z.boolean(),
    validatorKey: CmsValidatorKeySchema.nullable(),
    validatorVersion: CmsVersionSchema.nullable(),
    defaultMode: CmsDefaultModeSchema,
    localizationMode: CmsLocalizationModeSchema,
    lifecycle: CmsFieldLifecycleSchema,
    migrationPlanId: CmsUuidSchema.nullable(),
  })
  .superRefine((value, context) => {
    if ((value.validatorKey === null) !== (value.validatorVersion === null))
      context.addIssue({
        code: 'custom',
        path: ['validatorKey'],
        message: 'validator_key_version_pair_required',
      });
  })
  .readonly();

export const RelationDefinitionResourceSchema = z
  .strictObject({
    ...resourceMetaShape,
    resourceKind: z.literal('relation_definition'),
    state: CmsDefinitionStateSchema,
    contentTypeVersionId: CmsUuidSchema,
    fieldId: CmsUuidSchema,
    targetKind: z.enum(['content', 'domain']),
    targetType: CmsTargetTypeSchema,
    projectionKey: CmsProjectionKeySchema,
    cardinality: z.enum(['one', 'many']),
    min: z.number().int().finite().min(0).max(128),
    max: z.number().int().finite().min(1).max(128),
    ordered: z.boolean(),
    onUnavailable: z.enum(['omit', 'block', 'placeholder']),
  })
  .superRefine((value, context) => {
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
  })
  .readonly();
