import { z } from 'zod';

/** Strip provider event contents; missing counts are not evidence of zero. */
export const SloDiagnosticCountResponseSchema = z.object({
  success: z.literal(true),
  errors: z.array(z.never()).nullable().optional(),
  result: z.object({
    run: z.object({ status: z.literal('COMPLETED') }),
    events: z
      .object({
        count: z
          .number()
          .int()
          .nonnegative()
          .max(Number.MAX_SAFE_INTEGER)
          .optional(),
      })
      .optional(),
  }),
});
