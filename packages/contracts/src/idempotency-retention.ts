import { z } from 'zod';

export const IdempotencyExpirySweepResultSchema = z
  .object({
    deletedCount: z.number().int().nonnegative(),
    hasMore: z.boolean(),
  })
  .strict()
  .readonly();

export type IdempotencyExpirySweepResult = z.infer<
  typeof IdempotencyExpirySweepResultSchema
>;
