import { describe, expect, it } from 'vitest';

import {
  constantTimeEqual,
  digest,
  isHeaderName,
  isProviderKey,
  isRateDecision,
  isReceiptResult,
  isSignature,
  isStrictEvent,
  isSupportedSchemaVersions,
  validateRegistry,
} from './webhook-validation';

const RECEIPT_ID = '11111111-1111-4111-8111-111111111111';

const definition = {
  enabled: true,
  maxBodyBytes: 1024,
  parse: () => ({}),
  replayWindowSeconds: 300,
  signatureHeader: 'x-signature',
  supportedSchemaVersions: [1],
  timestampHeader: 'x-timestamp',
  verifySignature: () => true,
};

describe('webhook validation boundary', () => {
  it('validates provider keys, headers, and signatures', () => {
    expect(isProviderKey('stripe.v1')).toBe(true);
    expect(isProviderKey('Stripe')).toBe(false);
    expect(isProviderKey('')).toBe(false);
    expect(isHeaderName('X-Signature-1')).toBe(true);
    expect(isHeaderName('')).toBe(false);
    expect(isHeaderName('x_underscore')).toBe(false);
    expect(isSignature('signature value')).toBe(true);
    expect(isSignature('')).toBe(false);
    expect(isSignature('\u0000')).toBe(false);
  });

  it('requires a unique positive supported schema-version registry', () => {
    expect(isSupportedSchemaVersions([1, 2, 3])).toBe(true);
    expect(isSupportedSchemaVersions(null)).toBe(false);
    expect(isSupportedSchemaVersions([])).toBe(false);
    expect(
      isSupportedSchemaVersions(Array.from({ length: 33 }, (_, i) => i + 1)),
    ).toBe(false);
    expect(isSupportedSchemaVersions([0])).toBe(false);
    expect(isSupportedSchemaVersions([1, 1])).toBe(false);
    expect(isSupportedSchemaVersions([1.5])).toBe(false);
    expect(isSupportedSchemaVersions(['1'])).toBe(false);
  });

  it('accepts only the exact webhook event shape', () => {
    const valid = {
      eventType: 'payment.completed',
      externalEventId: 'evt_123',
      schemaVersion: 1,
    };
    expect(isStrictEvent(valid)).toBe(true);
    for (const candidate of [
      null,
      [],
      'event',
      {},
      { ...valid, extra: true },
      { ...valid, eventType: 'Payment.completed' },
      { ...valid, eventType: '' },
      { ...valid, eventType: 1 },
      { ...valid, externalEventId: '' },
      { ...valid, externalEventId: 'bad id' },
      { ...valid, externalEventId: 'x'.repeat(257) },
      { ...valid, externalEventId: 1 },
      { ...valid, schemaVersion: 1.5 },
      { ...valid, schemaVersion: 0 },
      { ...valid, schemaVersion: '1' },
    ])
      expect(isStrictEvent(candidate)).toBe(false);
  });

  it('validates accepted, duplicate, and digest-bearing conflict receipt results', () => {
    expect(isReceiptResult({ kind: 'accepted', receiptId: RECEIPT_ID })).toBe(
      true,
    );
    expect(isReceiptResult({ kind: 'duplicate', receiptId: RECEIPT_ID })).toBe(
      true,
    );
    expect(
      isReceiptResult({
        kind: 'conflict',
        payloadDigest: 'a'.repeat(64),
        receiptId: RECEIPT_ID,
      }),
    ).toBe(true);
    for (const candidate of [
      null,
      [],
      {},
      { kind: 'accepted' },
      { kind: 'other', receiptId: RECEIPT_ID },
      { kind: 'accepted', receiptId: 'bad' },
      { kind: 'accepted', receiptId: RECEIPT_ID, extra: true },
      { kind: 'conflict', receiptId: RECEIPT_ID },
      {
        kind: 'conflict',
        payloadDigest: 'bad',
        receiptId: RECEIPT_ID,
      },
      {
        kind: 'conflict',
        payloadDigest: 'a'.repeat(64),
        receiptId: RECEIPT_ID,
        extra: true,
      },
    ])
      expect(isReceiptResult(candidate)).toBe(false);
  });

  it('validates strict rate decisions with optional retry metadata', () => {
    const base = { allowed: true, limit: 10, remaining: 9, resetAt: 100 };
    expect(isRateDecision(base)).toBe(true);
    expect(isRateDecision({ ...base, retryAfterSeconds: undefined })).toBe(
      true,
    );
    expect(isRateDecision({ ...base, retryAfterSeconds: 3 })).toBe(true);
    for (const candidate of [
      null,
      [],
      { ...base, extra: true },
      { ...base, allowed: 'yes' },
      { ...base, limit: 0 },
      { ...base, limit: 1.5 },
      { ...base, remaining: -1 },
      { ...base, remaining: 11 },
      { ...base, resetAt: -1 },
      { ...base, retryAfterSeconds: -1 },
      { ...base, retryAfterSeconds: 1.5 },
      { ...base, retryAfterSeconds: '1' },
    ])
      expect(isRateDecision(candidate)).toBe(false);
  });

  it('hashes raw bytes and compares equal and unequal byte sequences', async () => {
    await expect(digest(new TextEncoder().encode('hello'))).resolves.toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
    expect(
      constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2])),
    ).toBe(true);
    expect(
      constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3])),
    ).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1]), new Uint8Array([1, 0]))).toBe(
      false,
    );
    expect(constantTimeEqual(new Uint8Array([1, 0]), new Uint8Array([1]))).toBe(
      false,
    );
  });

  it('rejects malformed provider registries and accepts validated definitions', () => {
    expect(() =>
      validateRegistry({ 'Bad Provider': definition } as never),
    ).toThrow('Webhook provider registry is invalid.');
    expect(() => validateRegistry({ local: undefined } as never)).toThrow(
      'Webhook provider registry is invalid.',
    );
    expect(() =>
      validateRegistry({ local: { ...definition, enabled: 'yes' } } as never),
    ).toThrow('Webhook provider registry is invalid.');
    expect(() =>
      validateRegistry({
        local: { ...definition, supportedSchemaVersions: [] },
      } as never),
    ).toThrow('Webhook provider registry is invalid.');
    expect(() => validateRegistry({ local: definition })).not.toThrow();
  });
});
