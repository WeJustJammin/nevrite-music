import { z } from 'zod';

import { QuotedVersionSchema } from '../request-navigation-security.ts';
import {
  ProviderOperationStateSchema,
  ProviderOperationTypeSchema,
} from './primitives.ts';
import { ProviderOperationSchema } from './records.ts';

export const ProviderOperationTransitionSchema = z
  .object({
    from: ProviderOperationStateSchema,
    to: ProviderOperationStateSchema,
  })
  .strict()
  .superRefine((transition, context) => {
    const allowed =
      transition.from === 'planned'
        ? transition.to === 'pending'
        : transition.from === 'pending' &&
          ['confirmed', 'failed', 'manual_review'].includes(transition.to);
    if (!allowed) {
      context.addIssue({
        code: 'custom',
        message: 'Provider operation transition is not allowed',
        path: ['to'],
      });
    }
  })
  .readonly();

export const ProviderOperationTypeRegistrySchema = z
  .array(ProviderOperationTypeSchema)
  .min(1)
  .max(64)
  .superRefine((types, context) => {
    const seen = new Set<string>();
    for (const [index, type] of types.entries()) {
      if (seen.has(type)) {
        context.addIssue({
          code: 'custom',
          message: 'Provider operation types must be unique',
          path: [index],
        });
      }
      seen.add(type);
    }
  })
  .readonly();

export const createProviderOperationSchema = (
  operationTypes: readonly string[],
) => {
  const allowedTypes =
    ProviderOperationTypeRegistrySchema.parse(operationTypes);
  return ProviderOperationSchema.superRefine((operation, context) => {
    if (!allowedTypes.includes(operation.operationType)) {
      context.addIssue({
        code: 'custom',
        message: 'operationType is not registered',
        path: ['operationType'],
      });
    }
  });
};

export type ProviderOperationTransition = z.infer<
  typeof ProviderOperationTransitionSchema
>;

export const ProviderOperationETagSchema = QuotedVersionSchema;
