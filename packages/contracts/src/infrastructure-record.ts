import { z } from 'zod';

import { JsonValueSchema } from './api-error.ts';
import { QuotedVersionSchema } from './request-navigation-security.ts';

export const SafeFieldMapSchema = z
  .record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/), JsonValueSchema)
  .superRefine((value, context) => {
    if (Object.keys(value).length > 32) {
      context.addIssue({
        code: 'custom',
        message: 'At most 32 retained fields are allowed',
      });
    }
  })
  .readonly();

export const ProvenanceItemSchema = z
  .object({
    label: z.string().min(1).max(160),
    sourceType: z.enum(['public', 'owned', 'mandated', 'case', 'internal']),
    recordedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .readonly();

export const InfrastructureRecordSchema = z
  .object({
    id: z.uuid(),
    label: z.string().min(1).max(160),
    summary: z.string().min(1).max(500),
    version: QuotedVersionSchema,
    modifiedAt: z.iso.datetime({ offset: true }),
    facts: SafeFieldMapSchema,
    provenance: z.array(ProvenanceItemSchema).max(32).readonly(),
  })
  .strict()
  .readonly();

export type InfrastructureRecord = z.infer<typeof InfrastructureRecordSchema>;
