import { z } from 'zod';

export const GLOBAL_WEBHOOK_BODY_MAX_BYTES = 256 * 1024;
const PROVIDER_KEY_PATTERN = /^[a-z][a-z0-9_.:-]{0,127}$/;
const HEADER_NAME_PATTERN = /^[A-Za-z0-9-]{1,128}$/;
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_.:-]{0,127}$/;
const EXTERNAL_EVENT_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const PositiveSafeIntegerSchema = z.number().int().positive().safe();

export const WebhookProviderIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(PROVIDER_KEY_PATTERN);

export const WebhookHeaderNameSchema = z.string().regex(HEADER_NAME_PATTERN);

export const WebhookExternalEventIdSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(EXTERNAL_EVENT_ID_PATTERN);

export const WebhookEventTypeSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(EVENT_TYPE_PATTERN);

export const WebhookPayloadDigestSchema = z.string().regex(SHA256_PATTERN);

export const WebhookSignatureSchema = z
  .string()
  .min(1)
  .max(4_096)
  .regex(/^[\x20-\x7E]+$/);

export const WebhookRawBodySchema = z
  .instanceof(Uint8Array)
  .refine((rawBody) => rawBody.byteLength <= GLOBAL_WEBHOOK_BODY_MAX_BYTES, {
    message: 'Webhook body exceeds the global limit',
  });
