import { z } from 'zod';

export const RequestIdSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .brand<'RequestId'>();

export type RequestId = z.infer<typeof RequestIdSchema>;

export const ApiErrorSchema = z
  .object({
    code: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-z][a-z0-9_]*$/),
    details: z.record(z.string(), z.unknown()),
    message: z.string().min(1).max(240),
    requestId: RequestIdSchema,
  })
  .strict();

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const HealthResponseSchema = z
  .object({
    requestId: RequestIdSchema,
    service: z.literal('wejammin-api'),
    status: z.literal('ok'),
    version: z.literal('v1'),
  })
  .strict();

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export function createRequestId(candidate: string | undefined): RequestId {
  const parsed = RequestIdSchema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }

  return RequestIdSchema.parse(`req_${crypto.randomUUID()}`);
}
