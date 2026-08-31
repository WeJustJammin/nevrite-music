import { describe, expect, it } from 'vitest';

import { isSafeObjectKey, validateUploadAdmission } from './index.ts';

const TARGET_ID = '33333333-3333-4333-8333-333333333333';
const HASH = 'a'.repeat(64);
const request = {
  headers: {
    contentType: 'application/json',
    idempotencyKey: 'upload-key-01',
    ifMatch: '"2"',
  },
  body: {
    targetType: 'infrastructure.record',
    targetId: TARGET_ID,
    purpose: 'cover-art',
    mediaType: 'image/png',
    byteSize: 512,
    checksum: { algorithm: 'sha256', value: HASH },
  },
};
const policies = {
  'infrastructure.record': {
    targetType: 'infrastructure.record',
    purposes: ['cover-art'],
    allowedMediaTypes: ['image/png'],
    maxBytes: 10_000,
    immutable: false,
  },
};

describe('upload admission validation branch coverage', () => {
  it('fails closed for non-record requests, headers, bodies, checksums, and registries', () => {
    expect(
      validateUploadAdmission({ request: null as never, policies }),
    ).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(
      validateUploadAdmission({ request, policies: null as never }),
    ).toMatchObject({ code: 'INVALID_REQUEST' });
    expect(
      validateUploadAdmission({
        request: { headers: null, body: request.body },
        policies,
      }),
    ).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(
      validateUploadAdmission({
        request: {
          headers: { idempotencyKey: 'upload-key-01', nope: true },
          body: request.body,
        },
        policies,
      }),
    ).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(
      validateUploadAdmission({
        request: { headers: { idempotencyKey: 'upload-key-01' }, body: null },
        policies,
      }),
    ).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(
      validateUploadAdmission({
        request: { ...request, body: { ...request.body, checksum: null } },
        policies,
      }),
    ).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(
      validateUploadAdmission({
        request: {
          ...request,
          body: {
            ...request.body,
            checksum: { algorithm: 'sha256', value: HASH, extra: true },
          },
        },
        policies,
      }),
    ).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(validateUploadAdmission({ request, policies: {} })).toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(
      validateUploadAdmission({
        request,
        policies: {
          'infrastructure.record': {
            ...policies['infrastructure.record'],
            targetType: 'wrong',
          },
        },
      }),
    ).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(
      validateUploadAdmission({
        request,
        policies: {
          'infrastructure.record': {
            ...policies['infrastructure.record'],
            purposes: [],
          },
        },
      }),
    ).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(
      validateUploadAdmission({
        request,
        policies: { 'infrastructure.record': null as never },
      }),
    ).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(
      validateUploadAdmission({
        request,
        policies: {
          'infrastructure.record': {
            ...policies['infrastructure.record'],
            purposes: [1] as never,
          },
        },
      }),
    ).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(
      validateUploadAdmission({
        request,
        policies: {
          'infrastructure.record': {
            ...policies['infrastructure.record'],
            allowedMediaTypes: [],
          },
        },
      }),
    ).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(
      validateUploadAdmission({
        request,
        policies: {
          'infrastructure.record': {
            ...policies['infrastructure.record'],
            allowedMediaTypes: [1] as never,
          },
        },
      }),
    ).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(
      validateUploadAdmission({
        request,
        policies: {
          'infrastructure.record': {
            ...policies['infrastructure.record'],
            maxBytes: 0,
          },
        },
      }),
    ).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(
      validateUploadAdmission({
        request,
        policies: {
          'infrastructure.record': {
            ...policies['infrastructure.record'],
            immutable: 'yes' as never,
          },
        },
      }),
    ).toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('covers non-number, syntax, and checksum validation branches', () => {
    const candidates: readonly [unknown, string][] = [
      [{ ...request.body, targetType: 'bad type' }, 'targetType'],
      [{ ...request.body, targetId: 1 }, 'targetId'],
      [{ ...request.body, purpose: 1 }, 'purpose'],
      [{ ...request.body, mediaType: 1 }, 'mediaType'],
      [{ ...request.body, byteSize: '512' }, 'byteSize'],
      [
        { ...request.body, checksum: { algorithm: 'md5', value: HASH } },
        'checksum.algorithm',
      ],
      [
        { ...request.body, checksum: { algorithm: 'sha256', value: 'bad' } },
        'checksum.value',
      ],
    ];
    for (const [body, field] of candidates) {
      const result = validateUploadAdmission({
        request: { ...request, body },
        policies,
      });
      expect(result).toMatchObject({ kind: 'invalid' });
      if (field !== '' && result.kind === 'invalid')
        expect(result.details).toEqual({ field });
    }
  });

  it('rejects every unsafe generated key shape', () => {
    expect(isSafeObjectKey('')).toBe(false);
    expect(isSafeObjectKey('/leading')).toBe(false);
    expect(isSafeObjectKey('double//slash')).toBe(false);
    expect(isSafeObjectKey('dot/.')).toBe(false);
    expect(isSafeObjectKey('dot/..')).toBe(false);
    expect(isSafeObjectKey(`a${'x'.repeat(1024)}`)).toBe(false);
    expect(isSafeObjectKey('control\nvalue')).toBe(false);
    expect(isSafeObjectKey('back\\slash')).toBe(false);
    expect(isSafeObjectKey('safe/path-1')).toBe(true);
  });
});
