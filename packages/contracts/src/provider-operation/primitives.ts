import { z } from 'zod';

import { JsonValueSchema } from '../api-error.ts';
import { PositiveBigintDecimalSchema } from '../platform-events.ts';

const OPERATION_TYPE_PATTERN = /^[a-z][a-z0-9_.:-]{0,127}$/;
const PROVIDER_REFERENCE_PATTERN = /^[A-Za-z0-9._:-]+$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PAYLOAD_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

export const SafeTimestampSchema = z.iso.datetime({ offset: true });

export const ProviderOperationVersionSchema = PositiveBigintDecimalSchema;

export const ProviderOperationTypeSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(OPERATION_TYPE_PATTERN);

export const ProviderOperationStateSchema = z.enum([
  'planned',
  'pending',
  'confirmed',
  'failed',
  'manual_review',
]);

export const ProviderIntentHashSchema = z.string().regex(SHA256_PATTERN);

export const ProviderReferenceSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(PROVIDER_REFERENCE_PATTERN);

export const ProviderEffectPayloadSchema = z
  .record(z.string().regex(PAYLOAD_KEY_PATTERN), JsonValueSchema)
  .superRefine((payload, context) => {
    if (Object.keys(payload).length > 32) {
      context.addIssue({
        code: 'custom',
        message: 'Provider effect payload may contain at most 32 fields',
      });
    }
    if (new TextEncoder().encode(JSON.stringify(payload)).byteLength > 32_768) {
      context.addIssue({
        code: 'custom',
        message:
          'Provider effect payload may contain at most 32768 UTF-8 bytes',
      });
    }
  })
  .readonly();

export const ProviderExternalEventIdSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(PROVIDER_REFERENCE_PATTERN);
