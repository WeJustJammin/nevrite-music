import { z } from 'zod';

import { QuotedVersionSchema } from './request-navigation-security.ts';

const CanonicalUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
const JobTypeSchema = z.string().regex(/^[a-z][a-z0-9_.-]{0,63}$/);

export const JobStateSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
]);

export const JobProgressSchema = z
  .object({
    completed: z.number().int().nonnegative().max(1_000_000_000),
    total: z.number().int().positive().max(1_000_000_000),
    unit: JobTypeSchema,
  })
  .strict()
  .refine(({ completed, total }) => completed <= total, {
    message: 'Completed progress cannot exceed total progress',
    path: ['completed'],
  })
  .readonly();

export const JobStatusSchema = z
  .object({
    id: CanonicalUuidSchema,
    type: JobTypeSchema,
    state: JobStateSchema,
    progress: JobProgressSchema.nullable(),
    resultRef: z
      .object({ type: JobTypeSchema, id: CanonicalUuidSchema })
      .strict()
      .readonly()
      .nullable(),
    error: z
      .object({
        code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
        retryable: z.boolean(),
      })
      .strict()
      .readonly()
      .nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine(({ createdAt, updatedAt }) => updatedAt >= createdAt, {
    message: 'Job update cannot predate creation',
    path: ['updatedAt'],
  })
  .readonly();

export const JobStatusTransportSchema = z
  .object({ data: JobStatusSchema, etag: QuotedVersionSchema })
  .strict()
  .readonly();

export const JobIdPathSchema = z
  .object({ jobId: CanonicalUuidSchema })
  .strict()
  .readonly();

export type JobState = z.infer<typeof JobStateSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type JobStatusTransport = z.infer<typeof JobStatusTransportSchema>;
