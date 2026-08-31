import { describe, expect, it } from 'vitest';

import {
  ProductionWebhookProviderRegistrySchema,
  WebhookAcknowledgementSchema,
  WebhookAdmissionRequestSchema,
  WebhookAdmissionResultSchema,
  WebhookEventSchema,
  WebhookManualReviewSchema,
  WebhookProviderConfigSchema,
  WebhookProviderRegistrySchema,
  WebhookRawRequestSchema,
  WebhookReceiptInputSchema,
  WebhookReceiptResolutionSchema,
  WebhookReceiptSchema,
  WebhookSignatureContextSchema,
  WEBHOOK_GLOBAL_BODY_MAX_BYTES,
  createWebhookAdmissionSchema,
  createWebhookRouteSchema,
  isWebhookTimestampFresh,
} from './webhook-admission.ts';

const provider = 'local.fake';
const receiptId = '11111111-1111-4111-8111-111111111111';
const operationId = '22222222-2222-4222-8222-222222222222';
const body = new TextEncoder().encode('{"event":"ok"}');
const digest = 'a'.repeat(64);

const config = {
  providerId: provider,
  maxBodyBytes: 1_024,
  replayWindowSeconds: 300,
  signatureHeader: 'x-fake-signature',
  timestampHeader: 'x-fake-timestamp',
  enabled: true,
} as const;

const rawRequest = {
  rawBody: body,
  signature: 'signed-value',
  timestamp: 1_756_560_000,
  contentType: 'application/json',
} as const;

const event = {
  externalEventId: 'evt_123',
  eventType: 'provider.event.completed',
  schemaVersion: 1,
  payloadDigest: digest,
} as const;

describe('webhook-admission contract', () => {
  it('accepts untouched raw bytes and the exact content type, while rejecting runtime authority fields', () => {
    expect(WebhookRawRequestSchema.parse(rawRequest)).toEqual(rawRequest);
    expect(
      WebhookAdmissionRequestSchema.parse({ ...rawRequest, provider }),
    ).toEqual({ ...rawRequest, provider });
    expect(() =>
      WebhookRawRequestSchema.parse({
        ...rawRequest,
        rawBody: new Uint8Array(0),
      }),
    ).not.toThrow();
    expect(() =>
      WebhookRawRequestSchema.parse({
        ...rawRequest,
        rawBody: new Uint8Array(WEBHOOK_GLOBAL_BODY_MAX_BYTES + 1),
      }),
    ).toThrow();
    expect(() =>
      WebhookRawRequestSchema.parse({
        ...rawRequest,
        adapter: 'runtime-selected',
      }),
    ).toThrow();
    expect(() =>
      WebhookAdmissionRequestSchema.parse({
        ...rawRequest,
        provider,
        credentialBinding: 'SECRET_FROM_REQUEST',
      }),
    ).toThrow();
    expect(() =>
      WebhookRawRequestSchema.parse({
        ...rawRequest,
        contentType: 'text/plain',
      }),
    ).toThrow();
    expect(() =>
      WebhookRawRequestSchema.parse({ ...rawRequest, signature: '' }),
    ).toThrow();
    expect(() =>
      WebhookRawRequestSchema.parse({ ...rawRequest, timestamp: 1.5 }),
    ).toThrow();
  });

  it('binds a provider route to a compile-time literal and validates provider limits and headers', () => {
    expect(createWebhookRouteSchema(provider).parse(provider)).toBe(provider);
    expect(() =>
      createWebhookRouteSchema(provider).parse('other.provider'),
    ).toThrow();
    expect(WebhookProviderConfigSchema.parse(config)).toEqual(config);
    expect(() =>
      WebhookProviderConfigSchema.parse({
        ...config,
        providerId: 'Bad Provider',
      }),
    ).toThrow();
    expect(() =>
      WebhookProviderConfigSchema.parse({ ...config, maxBodyBytes: 0 }),
    ).toThrow();
    expect(() =>
      WebhookProviderConfigSchema.parse({
        ...config,
        maxBodyBytes: 256 * 1024 + 1,
      }),
    ).toThrow();
    expect(() =>
      WebhookProviderConfigSchema.parse({ ...config, replayWindowSeconds: 0 }),
    ).toThrow();
    expect(() =>
      WebhookProviderConfigSchema.parse({
        ...config,
        signatureHeader: 'bad header',
      }),
    ).toThrow();
    expect(() =>
      WebhookProviderConfigSchema.parse({
        ...config,
        signatureHeader: config.timestampHeader,
      }),
    ).toThrow();
    expect(() =>
      WebhookProviderConfigSchema.parse({ ...config, extra: true }),
    ).toThrow();
  });

  it('keeps local registries closed and production provider registration empty', () => {
    expect(WebhookProviderRegistrySchema.parse([])).toEqual([]);
    expect(WebhookProviderRegistrySchema.parse([config])).toEqual([config]);
    expect(() =>
      WebhookProviderRegistrySchema.parse([config, config]),
    ).toThrow();
    expect(() =>
      WebhookProviderRegistrySchema.parse([{ ...config, enabled: false }]),
    ).not.toThrow();
    expect(ProductionWebhookProviderRegistrySchema.parse([])).toEqual([]);
    expect(() =>
      ProductionWebhookProviderRegistrySchema.parse([config]),
    ).toThrow();
  });

  it('enforces the provider body ceiling and disabled-provider fail-closed boundary', () => {
    const schema = createWebhookAdmissionSchema(config);
    expect(schema.parse(rawRequest)).toEqual(rawRequest);
    expect(() =>
      schema.parse({
        ...rawRequest,
        rawBody: new Uint8Array(config.maxBodyBytes + 1),
      }),
    ).toThrow();
    expect(() =>
      createWebhookAdmissionSchema({ ...config, enabled: false }).parse(
        rawRequest,
      ),
    ).toThrow();
  });

  it('checks timestamp replay windows and rejects unsafe or non-positive windows', () => {
    expect(isWebhookTimestampFresh(1_000, 1_000, 300)).toBe(true);
    expect(isWebhookTimestampFresh(700, 1_000, 300)).toBe(true);
    expect(isWebhookTimestampFresh(699, 1_000, 300)).toBe(false);
    expect(isWebhookTimestampFresh(1_301, 1_000, 300)).toBe(false);
    expect(isWebhookTimestampFresh(Number.NaN, 1_000, 300)).toBe(false);
    expect(
      isWebhookTimestampFresh(1_000, Number.MAX_SAFE_INTEGER + 1, 300),
    ).toBe(false);
    expect(isWebhookTimestampFresh(1_000, 1_000, 0)).toBe(false);
  });

  it('requires signature context fields before any parse or trusted receipt', () => {
    const context = {
      rawBody: body,
      signature: 'signed-value',
      timestamp: 1_756_560_000,
      contentType: 'application/json',
      signatureHeader: config.signatureHeader,
      timestampHeader: config.timestampHeader,
    } as const;
    expect(WebhookSignatureContextSchema.parse(context)).toEqual(context);
    expect(() =>
      WebhookSignatureContextSchema.parse({ ...context, signature: '' }),
    ).toThrow();
    expect(() =>
      WebhookSignatureContextSchema.parse({ ...context, signatureHeader: '' }),
    ).toThrow();
    expect(() =>
      WebhookSignatureContextSchema.parse({
        ...context,
        timestampHeader: 'bad header',
      }),
    ).toThrow();
    expect(() =>
      WebhookSignatureContextSchema.parse({
        ...context,
        timestampHeader: context.signatureHeader,
      }),
    ).toThrow();
    expect(() =>
      WebhookSignatureContextSchema.parse({
        ...context,
        secret: 'must-not-enter',
      }),
    ).toThrow();
  });

  it('accepts strict post-signature event identity and fixed lowercase SHA-256 digest', () => {
    expect(WebhookEventSchema.parse(event)).toEqual(event);
    for (const invalid of [
      { ...event, externalEventId: '' },
      { ...event, eventType: 'Bad Event' },
      { ...event, schemaVersion: 0 },
      { ...event, schemaVersion: 1.1 },
      { ...event, payloadDigest: 'A'.repeat(64) },
      { ...event, payloadDigest: 'a'.repeat(63) },
      { ...event, extra: true },
    ]) {
      expect(() => WebhookEventSchema.parse(invalid)).toThrow();
    }
  });

  it('models safe acknowledgement, receipt identity, duplicate replay, and conflicting-digest review', () => {
    expect(WebhookAcknowledgementSchema.parse({ received: true })).toEqual({
      received: true,
    });
    expect(() =>
      WebhookAcknowledgementSchema.parse({ received: false }),
    ).toThrow();
    expect(() =>
      WebhookAcknowledgementSchema.parse({ received: true, provider }),
    ).toThrow();

    const receiptInput = {
      provider,
      externalEventId: event.externalEventId,
      payloadDigest: digest,
      eventType: event.eventType,
      schemaVersion: event.schemaVersion,
      signatureVerifiedAt: '2026-08-30T12:00:00.000Z',
    } as const;
    expect(WebhookReceiptInputSchema.parse(receiptInput)).toEqual(receiptInput);
    expect(() =>
      WebhookReceiptInputSchema.parse({
        ...receiptInput,
        payloadDigest: 'bad',
      }),
    ).toThrow();
    expect(() =>
      WebhookReceiptInputSchema.parse({ ...receiptInput, rawBody: body }),
    ).toThrow();

    const receipt = {
      id: receiptId,
      provider,
      externalEventId: event.externalEventId,
      payloadDigest: digest,
      signatureVerifiedAt: '2026-08-30T12:00:00.000Z',
      receivedAt: '2026-08-30T12:00:00.000Z',
      state: 'accepted',
      operationId,
    } as const;
    expect(WebhookReceiptSchema.parse(receipt)).toEqual(receipt);
    expect(
      WebhookReceiptSchema.parse({ ...receipt, state: 'manual_review' }),
    ).toMatchObject({ state: 'manual_review' });
    expect(() =>
      WebhookReceiptSchema.parse({ ...receipt, state: 'unknown' }),
    ).toThrow();
    expect(() =>
      WebhookReceiptSchema.parse({ ...receipt, signatureVerifiedAt: null }),
    ).toThrow();

    const resolution = { kind: 'duplicate', receiptId } as const;
    expect(WebhookReceiptResolutionSchema.parse(resolution)).toEqual(
      resolution,
    );
    expect(() =>
      WebhookReceiptResolutionSchema.parse({ kind: 'accepted', receiptId }),
    ).not.toThrow();
    expect(() =>
      WebhookReceiptResolutionSchema.parse({
        kind: 'conflict',
        receiptId,
        payloadDigest: 'bad',
      }),
    ).toThrow();

    const manualReview = {
      kind: 'manual_review',
      reason: 'conflicting_digest',
      receiptId,
      provider,
      externalEventId: event.externalEventId,
      existingPayloadDigest: digest,
      conflictingPayloadDigest: 'b'.repeat(64),
    } as const;
    expect(WebhookManualReviewSchema.parse(manualReview)).toEqual(manualReview);
    expect(() =>
      WebhookManualReviewSchema.parse({ ...manualReview, rawBody: body }),
    ).toThrow();

    const outcome = {
      receiptId,
      accepted: true,
      duplicate: true,
      eventType: event.eventType,
      schemaVersion: 1,
    } as const;
    expect(WebhookAdmissionResultSchema.parse(outcome)).toEqual(outcome);
    expect(() =>
      WebhookAdmissionResultSchema.parse({ ...outcome, rawPayload: '{}' }),
    ).toThrow();
  });
});
