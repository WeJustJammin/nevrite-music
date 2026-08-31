import { z } from 'zod';

import {
  PositiveSafeIntegerSchema,
  WebhookEventTypeSchema,
  WebhookExternalEventIdSchema,
  WebhookHeaderNameSchema,
  WebhookPayloadDigestSchema,
  WebhookProviderIdSchema,
  WebhookRawBodySchema,
  WebhookSignatureSchema,
} from './identity.ts';

export const WebhookRawRequestSchema = z
  .object({
    rawBody: WebhookRawBodySchema,
    signature: WebhookSignatureSchema,
    timestamp: PositiveSafeIntegerSchema,
    contentType: z.literal('application/json'),
  })
  .strict()
  .readonly();

export const WebhookAdmissionRequestSchema = z
  .object({
    provider: WebhookProviderIdSchema,
    rawBody: WebhookRawBodySchema,
    signature: WebhookSignatureSchema,
    timestamp: PositiveSafeIntegerSchema,
    contentType: z.literal('application/json'),
  })
  .strict()
  .readonly();

export const WebhookSignatureContextSchema = z
  .object({
    rawBody: WebhookRawBodySchema,
    signature: WebhookSignatureSchema,
    timestamp: PositiveSafeIntegerSchema,
    contentType: z.literal('application/json'),
    signatureHeader: WebhookHeaderNameSchema,
    timestampHeader: WebhookHeaderNameSchema,
  })
  .strict()
  .superRefine((context, refinementContext) => {
    if (
      context.signatureHeader.toLowerCase() ===
      context.timestampHeader.toLowerCase()
    ) {
      refinementContext.addIssue({
        code: 'custom',
        message: 'Signature and timestamp headers must be distinct',
        path: ['timestampHeader'],
      });
    }
  })
  .readonly();

export const WebhookEventSchema = z
  .object({
    externalEventId: WebhookExternalEventIdSchema,
    eventType: WebhookEventTypeSchema,
    schemaVersion: PositiveSafeIntegerSchema,
    payloadDigest: WebhookPayloadDigestSchema,
  })
  .strict()
  .readonly();

export type WebhookRawRequest = z.infer<typeof WebhookRawRequestSchema>;
export type WebhookAdmissionRequest = z.infer<
  typeof WebhookAdmissionRequestSchema
>;
export type WebhookSignatureContext = z.infer<
  typeof WebhookSignatureContextSchema
>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
