import { describe, expect, it } from 'vitest';

import { validateUploadAdmission } from './index.ts';

const TARGET_ID = '33333333-3333-4333-8333-333333333333';
const KEY = 'upload-key-01';
const DIGEST = 'a'.repeat(64);

const policy = {
  'infrastructure.record': {
    targetType: 'infrastructure.record',
    purposes: ['cover-art', 'audio'],
    allowedMediaTypes: ['image/png', 'audio/mpeg'],
    maxBytes: 10_000,
    immutable: false,
  },
  'infrastructure.new': {
    targetType: 'infrastructure.new',
    purposes: ['asset'],
    allowedMediaTypes: ['application/json'],
    maxBytes: 1_000,
    immutable: true,
  },
} as const;

const body = {
  targetType: 'infrastructure.record',
  targetId: TARGET_ID,
  purpose: 'cover-art',
  mediaType: 'IMAGE/PNG',
  byteSize: 512,
  checksum: { algorithm: 'sha256', value: DIGEST },
};

const baseRequest = {
  headers: {
    contentType: 'application/json',
    idempotencyKey: KEY,
    ifMatch: '"2"',
  },
  body,
};

describe('upload admission validation', () => {
  it('normalizes media type and builds a deterministic request', () => {
    expect(
      validateUploadAdmission({ request: baseRequest, policies: policy }),
    ).toEqual({
      kind: 'valid',
      value: {
        body: { ...body, mediaType: 'image/png' },
        idempotencyKey: KEY,
        ifMatch: '"2"',
        policy: policy['infrastructure.record'],
        normalizedRequest: JSON.stringify({
          targetType: 'infrastructure.record',
          targetId: TARGET_ID,
          purpose: 'cover-art',
          mediaType: 'image/png',
          byteSize: 512,
          checksum: { algorithm: 'sha256', value: DIGEST },
        }),
      },
    });
  });

  it('rejects malformed headers and strict body shapes before policy lookup', () => {
    for (const headers of [
      { ...baseRequest.headers, idempotencyKey: 'short' },
      { ...baseRequest.headers, idempotencyKey: ` ${KEY}` },
      { ...baseRequest.headers, idempotencyKey: `${KEY}\n` },
      { ...baseRequest.headers, ifMatch: '2' },
      { ...baseRequest.headers, contentType: 'text/plain' },
    ]) {
      expect(
        validateUploadAdmission({
          request: { ...baseRequest, headers },
          policies: policy,
        }),
      ).toMatchObject({ kind: 'invalid', code: 'INVALID_REQUEST' });
    }
    expect(
      validateUploadAdmission({
        request: {
          ...baseRequest,
          body: { ...body, unexpected: true },
        },
        policies: policy,
      }),
    ).toMatchObject({ kind: 'invalid', code: 'INVALID_REQUEST' });
  });

  it('accepts immutable targets without If-Match and rejects mutable omissions', () => {
    expect(
      validateUploadAdmission({
        policies: policy,
        request: {
          headers: { contentType: 'application/json', idempotencyKey: KEY },
          body: {
            ...body,
            targetType: 'infrastructure.new',
            purpose: 'asset',
            mediaType: 'application/json',
          },
        },
      }),
    ).toMatchObject({ kind: 'valid', value: { ifMatch: null } });
    expect(
      validateUploadAdmission({
        request: {
          ...baseRequest,
          headers: { contentType: 'application/json', idempotencyKey: KEY },
        },
        policies: policy,
      }),
    ).toMatchObject({ kind: 'invalid', code: 'INVALID_REQUEST' });
  });

  it('returns semantic field failures without exposing input values', () => {
    const cases: readonly [unknown, string][] = [
      [{ ...body, targetType: 'Bad Type' }, 'targetType'],
      [{ ...body, targetType: 'unknown.target' }, 'targetType'],
      [{ ...body, targetId: 'not-a-uuid' }, 'targetId'],
      [{ ...body, purpose: 'unknown' }, 'purpose'],
      [{ ...body, mediaType: 'video/mp4' }, 'mediaType'],
      [{ ...body, byteSize: Number.MAX_SAFE_INTEGER + 1 }, 'byteSize'],
      [{ ...body, byteSize: 0 }, 'byteSize'],
      [{ ...body, byteSize: 10_001 }, 'byteSize'],
      [
        { ...body, checksum: { algorithm: 'md5', value: DIGEST } },
        'checksum.algorithm',
      ],
      [
        { ...body, checksum: { algorithm: 'sha256', value: 'A'.repeat(64) } },
        'checksum.value',
      ],
    ];
    for (const [candidate, field] of cases) {
      const result = validateUploadAdmission({
        request: { ...baseRequest, body: candidate },
        policies: policy,
      });
      expect(result).toMatchObject({ kind: 'invalid' });
      if (result.kind === 'invalid') {
        expect(result.details).toEqual({ field });
        expect(JSON.stringify(result)).not.toContain('not-a-uuid');
      }
    }
    expect(
      validateUploadAdmission({
        request: { ...baseRequest, body: { ...body, byteSize: 10_001 } },
        policies: policy,
      }),
    ).toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
    expect(
      validateUploadAdmission({
        request: { ...baseRequest, body: { ...body, mediaType: 'video/mp4' } },
        policies: policy,
      }),
    ).toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE' });
  });
});
