import { z } from 'zod';

import {
  PositiveSafeIntegerSchema,
  WebhookEventTypeSchema,
  WebhookExternalEventIdSchema,
  WebhookPayloadDigestSchema,
  WebhookProviderIdSchema,
} from './identity.ts';

export const WebhookReceiptInputSchema = z
  .object({
    provider: WebhookProviderIdSchema,
    externalEventId: WebhookExternalEventIdSchema,
    payloadDigest: WebhookPayloadDigestSchema,
    eventType: WebhookEventTypeSchema,
    schemaVersion: PositiveSafeIntegerSchema,
    signatureVerifiedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .readonly();

export const WebhookReceiptStateSchema = z.enum([
  'received',
  'accepted',
  'duplicate',
  'rejected',
  'processed',
  'failed',
  'manual_review',
]);

export const WebhookReceiptSchema = z
  .object({
    id: z.uuid(),
    provider: WebhookProviderIdSchema,
    externalEventId: WebhookExternalEventIdSchema,
    payloadDigest: WebhookPayloadDigestSchema,
    signatureVerifiedAt: z.iso.datetime({ offset: true }),
    receivedAt: z.iso.datetime({ offset: true }),
    state: WebhookReceiptStateSchema,
    operationId: z.uuid().nullable(),
  })
  .strict()
  .readonly();

export const WebhookReceiptResolutionSchema = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.literal('accepted'), receiptId: z.uuid() })
    .strict()
    .readonly(),
  z
    .object({ kind: z.literal('duplicate'), receiptId: z.uuid() })
    .strict()
    .readonly(),
  z
    .object({
      kind: z.literal('conflict'),
      receiptId: z.uuid(),
      payloadDigest: WebhookPayloadDigestSchema,
    })
    .strict()
    .readonly(),
]);

export const WebhookAdmissionResultSchema = z
  .object({
    receiptId: z.uuid(),
    accepted: z.boolean(),
    duplicate: z.boolean(),
    eventType: WebhookEventTypeSchema,
    schemaVersion: PositiveSafeIntegerSchema,
  })
  .strict()
  .readonly();

export const WebhookAcknowledgementSchema = z
  .object({ received: z.literal(true) })
  .strict()
  .readonly();

/** Security review evidence for a verified event ID reused with a new digest. */
export const WebhookManualReviewSchema = z
  .object({
    kind: z.literal('manual_review'),
    reason: z.literal('conflicting_digest'),
    receiptId: z.uuid(),
    provider: WebhookProviderIdSchema,
    externalEventId: WebhookExternalEventIdSchema,
    existingPayloadDigest: WebhookPayloadDigestSchema,
    conflictingPayloadDigest: WebhookPayloadDigestSchema,
  })
  .strict()
  .readonly();

export type WebhookManualReview = z.infer<typeof WebhookManualReviewSchema>;
export type WebhookReceiptInput = z.infer<typeof WebhookReceiptInputSchema>;
export type WebhookReceipt = z.infer<typeof WebhookReceiptSchema>;
export type WebhookReceiptResolution = z.infer<
  typeof WebhookReceiptResolutionSchema
>;
export type WebhookAdmissionResult = z.infer<
  typeof WebhookAdmissionResultSchema
>;
export type WebhookAcknowledgement = z.infer<
  typeof WebhookAcknowledgementSchema
>;
