import { z } from 'zod';

import {
  UniqueMediaTypeListSchema,
  UniquePurposeListSchema,
  UploadTargetTypeSchema,
} from './base.ts';

/** A target policy is the closed, server-owned admission registry entry. */
export const UploadTargetPolicySchema = z
  .object({
    targetType: UploadTargetTypeSchema,
    purposes: UniquePurposeListSchema,
    maxBytes: z.number().int().positive().safe(),
    allowedMediaTypes: UniqueMediaTypeListSchema,
    immutable: z.boolean(),
  })
  .strict()
  .readonly();

export const UploadTargetRegistrySchema = z
  .array(UploadTargetPolicySchema)
  .max(128)
  .superRefine((policies, context) => {
    const seen = new Set<string>();
    for (const [index, policy] of policies.entries()) {
      if (seen.has(policy.targetType)) {
        context.addIssue({
          code: 'custom',
          message: 'Target types must be unique',
          path: [index, 'targetType'],
        });
      }
      seen.add(policy.targetType);
    }
  })
  .readonly();

export type UploadTargetPolicy = z.infer<typeof UploadTargetPolicySchema>;
export type UploadTargetRegistry = z.infer<typeof UploadTargetRegistrySchema>;
