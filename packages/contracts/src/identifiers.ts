import { z } from 'zod';

const UuidSchema = z.uuid();

export const RequestIdSchema = UuidSchema.brand<'RequestId'>();
export type RequestId = z.infer<typeof RequestIdSchema>;

export const CorrelationIdSchema = UuidSchema.brand<'CorrelationId'>();
export type CorrelationId = z.infer<typeof CorrelationIdSchema>;

export function createRequestId(candidate: string | undefined): RequestId {
  const parsed = RequestIdSchema.safeParse(candidate);
  return parsed.success
    ? parsed.data
    : RequestIdSchema.parse(crypto.randomUUID());
}

export function createCorrelationId(
  candidate: string | undefined,
  fallback: RequestId,
): CorrelationId {
  const parsed = CorrelationIdSchema.safeParse(candidate);
  return parsed.success ? parsed.data : CorrelationIdSchema.parse(fallback);
}
