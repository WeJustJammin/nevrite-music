import { z } from 'zod';

import { RequestIdSchema } from './identifiers.ts';

const OperationalBaseSchema = z.object({
  requestId: RequestIdSchema,
  service: z.literal('wejammin-api'),
  version: z.literal('v1'),
});

export const HealthResponseSchema = OperationalBaseSchema.extend({
  status: z.literal('ok'),
})
  .strict()
  .readonly();

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ReadinessResponseSchema = OperationalBaseSchema.extend({
  status: z.enum(['ready', 'not_ready']),
})
  .strict()
  .readonly();

export type ReadinessResponse = z.infer<typeof ReadinessResponseSchema>;

export const DiagnosticResponseSchema = z
  .object({
    requestId: RequestIdSchema,
    checkedAt: z.iso.datetime({ offset: true }),
    state: z.enum(['healthy', 'degraded']),
    checks: z
      .array(
        z
          .object({
            name: z.string().regex(/^[a-z][a-z0-9_.-]{0,63}$/),
            status: z.enum(['ok', 'unavailable']),
          })
          .strict()
          .readonly(),
      )
      .max(16)
      .readonly(),
  })
  .strict()
  .readonly();

export type DiagnosticResponse = z.infer<typeof DiagnosticResponseSchema>;
