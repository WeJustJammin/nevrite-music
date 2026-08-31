import { describe, expect, it } from 'vitest';

import {
  MAX_BODY_BYTES,
  OPERATION,
  digest,
  exactKeys,
  isUploadRateDecision,
  isUuid,
  parseIdempotencyKey,
  parseRequest,
  parseVersion,
  signedUrlBindsGeneratedObject,
  validatePrincipal,
  validateResource,
} from './upload-intent-validation';
import type {
  UploadIntentResource,
  UploadPrincipal,
  UploadTargetPolicy,
} from './upload-intent-types';

const TARGET = '33333333-3333-4333-8333-333333333333';
const OBJECT = '55555555-5555-4555-8555-555555555555';
const INTENT = '44444444-4444-4444-8444-444444444444';

const policy: UploadTargetPolicy = {
  allowedMediaTypes: ['audio/mpeg'],
  immutable: false,
  maxBytes: 100_000,
  purposes: ['demo'],
};

const request = {
  byteSize: 12_345,
  checksum: { algorithm: 'sha256' as const, value: 'a'.repeat(64) },
  mediaType: 'audio/mpeg',
  purpose: 'demo',
  targetId: TARGET,
  targetType: 'recording',
};

const resource: UploadIntentResource = {
  id: INTENT,
  object: {
    id: OBJECT,
    objectKey: `objects/${OBJECT}`,
    state: 'pending_upload',
    version: '1',
  },
  upload: {
    allowedMediaTypes: ['audio/mpeg'],
    expiresAt: '2026-08-30T12:15:00.000Z',
    maxBytes: 100_000,
    method: 'PUT',
    signedUrl: 'https://storage.local/upload/token',
  },
};

const principal: UploadPrincipal = {
  actingPartyId: null,
  actorId: '11111111-1111-4111-8111-111111111111',
  capabilities: [],
  kind: 'user',
  reason: null,
  stepUpVerified: false,
};

describe('upload-intent validation boundary', () => {
  it('validates identifiers, exact keys, versions, and idempotency keys', async () => {
    expect(OPERATION).toBe('INF-API-02');
    expect(MAX_BODY_BYTES).toBe(256 * 1024);
    expect(isUuid('11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(exactKeys({ a: 1, b: 2 }, ['b', 'a'])).toBe(true);
    expect(exactKeys({ a: 1 }, ['a', 'b'])).toBe(false);
    expect(parseVersion(null, false)).toBeNull();
    expect(() => parseVersion(null, true)).toThrow('If-Match is required.');
    for (const value of ['7', '"0"', '"9223372036854775808"', '"abc"'])
      expect(() => parseVersion(value, false)).toThrow(
        'If-Match must be one quoted version.',
      );
    expect(parseVersion('"7"', true)).toBe('"7"');
    expect(parseIdempotencyKey('valid-key')).toBe('valid-key');
    for (const value of [
      null,
      '',
      'short',
      'x'.repeat(129),
      ' leading',
      'trailing ',
      'bad\u0000key',
    ])
      expect(() => parseIdempotencyKey(value)).toThrow(
        'Idempotency-Key is invalid.',
      );
    await expect(digest('upload')).resolves.toMatch(/^[a-f0-9]{64}$/);
  });

  it('accepts a policy-bound request and rejects each unsafe request field', () => {
    expect(parseRequest(request, { recording: policy })).toMatchObject({
      request: { mediaType: 'audio/mpeg', targetId: TARGET },
    });
    const invalidRequests: unknown[] = [
      null,
      [],
      { ...request, extra: true },
      { ...request, targetType: 'Recording' },
      { ...request, targetType: 'unknown' },
      { ...request, targetId: 'not-a-uuid' },
      { ...request, purpose: 'other' },
      { ...request, mediaType: 'audio' },
      { ...request, mediaType: 'audio/wav' },
      { ...request, byteSize: 0 },
      { ...request, byteSize: 1.5 },
      { ...request, byteSize: policy.maxBytes + 1 },
      { ...request, checksum: null },
      { ...request, checksum: { algorithm: 'md5', value: 'a'.repeat(64) } },
      { ...request, checksum: { algorithm: 'sha256', value: 'bad' } },
      {
        ...request,
        checksum: {
          algorithm: 'sha256',
          value: 'a'.repeat(64),
          extra: true,
        },
      },
    ];
    for (const candidate of invalidRequests)
      expect(() => parseRequest(candidate, { recording: policy })).toThrow();
  });

  it('validates resources and strict rate decisions', () => {
    expect(validateResource(resource)).toEqual(resource);
    for (const candidate of [
      { ...resource, id: 'bad' },
      { ...resource, object: { ...resource.object, id: 'bad' } },
      { ...resource, object: { ...resource.object, objectKey: 1 } },
      { ...resource, object: { ...resource.object, state: 'confirmed' } },
      { ...resource, object: { ...resource.object, version: '0' } },
      { ...resource, upload: { ...resource.upload, method: 'GET' } },
      { ...resource, upload: { ...resource.upload, signedUrl: 1 } },
      { ...resource, upload: { ...resource.upload, expiresAt: 1 } },
      { ...resource, upload: { ...resource.upload, maxBytes: 0 } },
      { ...resource, upload: { ...resource.upload, allowedMediaTypes: [] } },
      {
        ...resource,
        upload: { ...resource.upload, allowedMediaTypes: [1] },
      },
    ])
      expect(() => validateResource(candidate as never)).toThrow(
        'The upload-intent response was invalid.',
      );

    const valid = { allowed: true, limit: 10, remaining: 9, resetAt: 100 };
    expect(isUploadRateDecision(valid)).toBe(true);
    expect(isUploadRateDecision({ ...valid, retryAfterSeconds: 1 })).toBe(true);
    for (const candidate of [
      null,
      [],
      { ...valid, extra: true },
      { ...valid, allowed: 'yes' },
      { ...valid, limit: 0 },
      { ...valid, remaining: 11 },
      { ...valid, resetAt: -1 },
      { ...valid, retryAfterSeconds: -1 },
      { ...valid, retryAfterSeconds: '1' },
    ])
      expect(isUploadRateDecision(candidate)).toBe(false);
  });

  it('fails closed for malformed principals', () => {
    expect(() => validatePrincipal(principal)).not.toThrow();
    expect(() => validatePrincipal({ ...principal, actorId: 'bad' })).toThrow(
      'The upload authority is invalid.',
    );
    expect(() =>
      validatePrincipal({ ...principal, actingPartyId: 'bad' }),
    ).toThrow('The upload authority is invalid.');
  });

  it('fails closed when a signer returns a malformed URL', () => {
    expect(
      signedUrlBindsGeneratedObject('not-a-url', OBJECT, `objects/${OBJECT}`),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        'https://storage.local/upload/not-a-uuid',
        'not-a-uuid',
        'objects/not-a-uuid',
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.local/upload/${OBJECT}-other`,
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.local/upload/${OBJECT}/other`,
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.local/upload/${OBJECT}/66666666-6666-4666-8666-666666666666`,
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.local/upload/${OBJECT}`,
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(true);
    const hexadecimalVersionUuid = 'aa14bdae-4482-4aef-8fd9-b3be4c3cc383';
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.local/upload/${hexadecimalVersionUuid}`,
        hexadecimalVersionUuid,
        `objects/${hexadecimalVersionUuid}`,
      ),
    ).toBe(true);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.local/upload/objects%2F${OBJECT}`,
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(true);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.local/upload/objects%2F${OBJECT}`,
        OBJECT,
        `/objects/${OBJECT}`,
      ),
    ).toBe(true);
    expect(
      signedUrlBindsGeneratedObject(
        'https://storage.local/upload/objects/canonical-name',
        OBJECT,
        'objects/canonical-name',
      ),
    ).toBe(true);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.local/upload?object=${OBJECT}`,
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.local/upload/prefix-objects/${OBJECT}-suffix`,
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        'https://storage.local/upload/%E0%A4%A',
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        'https://storage.local/',
        OBJECT,
        'objects/canonical-name/with-prefix',
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        'https://storage.local/upload/other',
        OBJECT,
        '',
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `http://storage.local/upload/${OBJECT}`,
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://user:password@storage.local/upload/${OBJECT}`,
        OBJECT,
        `objects/${OBJECT}`,
      ),
    ).toBe(false);
  });
});
