import { z } from 'zod';

import { CorrelationIdSchema, RequestIdSchema } from './identifiers.ts';

export const CapabilitySchema = z
  .string()
  .min(3)
  .max(128)
  .regex(/^[a-z][a-z0-9_.:-]*$/);

export const LocaleSchema = z
  .string()
  .min(2)
  .max(35)
  .refine((value) => {
    try {
      return new Intl.Locale(value).toString() === value;
    } catch {
      return false;
    }
  }, 'Locale must be a canonical BCP 47 language tag');

const CapabilitySnapshotSchema = z
  .array(CapabilitySchema)
  .max(64)
  .refine((values) => new Set(values).size === values.length, {
    message: 'Capabilities must be unique',
  })
  .readonly();

export const RequestContextSchema = z
  .object({
    requestId: RequestIdSchema,
    correlationId: CorrelationIdSchema,
    causationId: z.uuid().nullable(),
    traceId: z
      .string()
      .min(16)
      .max(64)
      .regex(/^[A-Za-z0-9._:-]+$/),
    userId: z.uuid().nullable(),
    actingPartyId: z.uuid().nullable(),
    capabilities: CapabilitySnapshotSchema,
    locale: LocaleSchema,
    clientVersion: z.string().min(1).max(64).nullable(),
  })
  .strict()
  .readonly();

export type RequestContext = z.infer<typeof RequestContextSchema>;
