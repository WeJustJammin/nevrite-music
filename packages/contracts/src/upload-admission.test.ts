import { describe, expect, it } from 'vitest';

import {
  CreateUploadIntentRequestSchema,
  IdempotencyKeySchema,
  ObjectKeySchema,
  QuotedVersionSchema,
  Sha256ChecksumSchema,
  UploadAdmissionHeadersSchema,
  UploadAdmissionRequestSchema,
  UploadIntentResourceSchema,
  UploadMediaTypeSchema,
  UploadTargetPolicySchema,
  UploadTargetRegistrySchema,
  createUploadAdmissionSchema,
} from './upload-admission.ts';

const targetId = '11111111-1111-4111-8111-111111111111';
const objectId = '22222222-2222-4222-8222-222222222222';
const intentId = '33333333-3333-4333-8333-333333333333';
const digest = 'a'.repeat(64);

const mutablePolicy = {
  targetType: 'release.asset',
  purposes: ['cover_art', 'audio_master'],
  maxBytes: 10_000_000,
  allowedMediaTypes: ['image/png', 'audio/mpeg'],
  immutable: false,
} as const;

const immutablePolicy = {
  targetType: 'profile.avatar',
  purposes: ['avatar'],
  maxBytes: 1_000_000,
  allowedMediaTypes: ['image/jpeg'],
  immutable: true,
} as const;

const validBody = {
  targetType: mutablePolicy.targetType,
  targetId,
  purpose: 'cover_art',
  mediaType: 'IMAGE/PNG',
  byteSize: 2048,
  checksum: { algorithm: 'sha256', value: digest },
} as const;

const validHeaders = {
  idempotencyKey: 'upload-2026-01',
  ifMatch: '"7"',
} as const;

describe('upload-admission contract', () => {
  it('normalizes a valid request media type and preserves the other canonical fields', () => {
    expect(CreateUploadIntentRequestSchema.parse(validBody)).toEqual({
      ...validBody,
      mediaType: 'image/png',
    });
  });

  it('enforces the shared idempotency-key character, length, and byte-identity rules', () => {
    expect(IdempotencyKeySchema.parse('12345678')).toBe('12345678');
    expect(IdempotencyKeySchema.parse('key with spaces')).toBe(
      'key with spaces',
    );
    expect(() => IdempotencyKeySchema.parse('1234567')).toThrow();
    expect(() => IdempotencyKeySchema.parse('a'.repeat(129))).toThrow();
    expect(() => IdempotencyKeySchema.parse(' key12345')).toThrow();
    expect(() => IdempotencyKeySchema.parse('key12345 ')).toThrow();
    expect(() => IdempotencyKeySchema.parse('key\n12345')).toThrow();
    expect(() => IdempotencyKeySchema.parse('ékey1234')).toThrow();
  });

  it('enforces exact strong quoted positive bigint versions', () => {
    expect(QuotedVersionSchema.parse('"1"')).toBe('"1"');
    expect(QuotedVersionSchema.parse('"9223372036854775807"')).toBe(
      '"9223372036854775807"',
    );
    for (const value of [
      '1',
      '"0"',
      '"01"',
      'W/"1"',
      '"1", "2"',
      '"1" ',
      '"9223372036854775808"',
    ]) {
      expect(() => QuotedVersionSchema.parse(value)).toThrow();
    }
  });

  it('keeps the header boundary strict and makes If-Match optional only at this structural layer', () => {
    expect(
      UploadAdmissionHeadersSchema.parse({ idempotencyKey: '12345678' }),
    ).toEqual({
      idempotencyKey: '12345678',
    });
    expect(UploadAdmissionHeadersSchema.parse(validHeaders)).toEqual(
      validHeaders,
    );
    expect(() =>
      UploadAdmissionHeadersSchema.parse({
        ...validHeaders,
        'Idempotency-Key': validHeaders.idempotencyKey,
      }),
    ).toThrow();
    expect(() =>
      UploadAdmissionHeadersSchema.parse({
        idempotencyKey: '12345678',
        ifMatch: '*',
      }),
    ).toThrow();
  });

  it('rejects malformed target, identifier, purpose, media, size, checksum, and unknown fields', () => {
    const invalidInputs: ReadonlyArray<Record<string, unknown>> = [
      { ...validBody, targetType: 'Release.Asset' },
      { ...validBody, targetType: 'release_asset' },
      { ...validBody, targetType: 'a'.repeat(65) },
      { ...validBody, targetId: 'not-a-uuid' },
      { ...validBody, purpose: 'unknown purpose' },
      { ...validBody, mediaType: 'not-media' },
      { ...validBody, mediaType: 'image/png; charset=utf-8' },
      { ...validBody, byteSize: 0 },
      { ...validBody, byteSize: Number.MAX_SAFE_INTEGER + 1 },
      { ...validBody, byteSize: 1.5 },
      { ...validBody, checksum: { algorithm: 'sha1', value: digest } },
      {
        ...validBody,
        checksum: { algorithm: 'sha256', value: 'A'.repeat(64) },
      },
      { ...validBody, extra: true },
    ];

    for (const input of invalidInputs) {
      expect(() => CreateUploadIntentRequestSchema.parse(input)).toThrow();
    }
  });

  it('keeps the checksum algorithm closed and digest exactly lowercase SHA-256', () => {
    expect(
      Sha256ChecksumSchema.parse({ algorithm: 'sha256', value: digest }),
    ).toEqual({
      algorithm: 'sha256',
      value: digest,
    });
    expect(() =>
      Sha256ChecksumSchema.parse({
        algorithm: 'sha256',
        value: digest,
        extra: true,
      }),
    ).toThrow();
    expect(() =>
      Sha256ChecksumSchema.parse({ algorithm: 'SHA256', value: digest }),
    ).toThrow();
    expect(() =>
      Sha256ChecksumSchema.parse({
        algorithm: 'sha256',
        value: 'f'.repeat(63),
      }),
    ).toThrow();
    expect(() =>
      Sha256ChecksumSchema.parse({
        algorithm: 'sha256',
        value: 'g'.repeat(64),
      }),
    ).toThrow();
  });

  it('normalizes only valid MIME tokens and rejects whitespace or control characters', () => {
    expect(UploadMediaTypeSchema.parse('Audio/MPEG')).toBe('audio/mpeg');
    for (const value of [' image/png', 'image/png ', 'image', 'image/PNG\n']) {
      expect(() => UploadMediaTypeSchema.parse(value)).toThrow();
    }
  });

  it('requires target policies to be strict, bounded, and duplicate-free', () => {
    expect(UploadTargetPolicySchema.parse(mutablePolicy)).toEqual({
      ...mutablePolicy,
      allowedMediaTypes: ['image/png', 'audio/mpeg'],
    });
    expect(
      UploadTargetRegistrySchema.parse([mutablePolicy, immutablePolicy]),
    ).toHaveLength(2);
    expect(() =>
      UploadTargetPolicySchema.parse({
        ...mutablePolicy,
        targetType: 'release_asset',
      }),
    ).toThrow();
    expect(() =>
      UploadTargetPolicySchema.parse({ ...mutablePolicy, purposes: [] }),
    ).toThrow();
    expect(() =>
      UploadTargetPolicySchema.parse({
        ...mutablePolicy,
        allowedMediaTypes: [],
      }),
    ).toThrow();
    expect(() =>
      UploadTargetPolicySchema.parse({ ...mutablePolicy, maxBytes: 0 }),
    ).toThrow();
    expect(() =>
      UploadTargetPolicySchema.parse({ ...mutablePolicy, extra: true }),
    ).toThrow();
    expect(() =>
      UploadTargetRegistrySchema.parse([mutablePolicy, mutablePolicy]),
    ).toThrow();
    expect(() =>
      UploadTargetPolicySchema.parse({
        ...mutablePolicy,
        purposes: ['cover_art', 'cover_art'],
      }),
    ).toThrow();
    expect(() =>
      UploadTargetPolicySchema.parse({
        ...mutablePolicy,
        allowedMediaTypes: ['image/png', 'image/png'],
      }),
    ).toThrow();
  });

  it('requires exact target policy membership, media allowlisting, byte limits, and mutable If-Match', () => {
    const schema = createUploadAdmissionSchema([
      mutablePolicy,
      immutablePolicy,
    ]);

    expect(schema.parse({ headers: validHeaders, body: validBody })).toEqual({
      headers: validHeaders,
      body: { ...validBody, mediaType: 'image/png' },
    });
    expect(
      schema.parse({
        headers: { idempotencyKey: '12345678' },
        body: {
          ...validBody,
          targetType: immutablePolicy.targetType,
          purpose: 'avatar',
          mediaType: 'IMAGE/JPEG',
        },
      }),
    ).toEqual({
      headers: { idempotencyKey: '12345678' },
      body: {
        ...validBody,
        targetType: immutablePolicy.targetType,
        purpose: 'avatar',
        mediaType: 'image/jpeg',
      },
    });

    const invalidRequests = [
      { headers: { idempotencyKey: '12345678' }, body: validBody },
      {
        headers: validHeaders,
        body: { ...validBody, targetType: 'unknown.target' },
      },
      { headers: validHeaders, body: { ...validBody, purpose: 'avatar' } },
      {
        headers: validHeaders,
        body: { ...validBody, mediaType: 'image/jpeg' },
      },
      { headers: validHeaders, body: { ...validBody, byteSize: 10_000_001 } },
    ];
    for (const request of invalidRequests) {
      expect(() => schema.parse(request)).toThrow();
    }
  });

  it('rejects a request envelope with unknown keys', () => {
    expect(
      UploadAdmissionRequestSchema.parse({
        headers: validHeaders,
        body: validBody,
      }),
    ).toEqual({
      headers: validHeaders,
      body: { ...validBody, mediaType: 'image/png' },
    });
    expect(() =>
      UploadAdmissionRequestSchema.parse({
        headers: validHeaders,
        body: validBody,
        extra: true,
      }),
    ).toThrow();
  });

  it('rejects traversal/control object keys before they can become signed targets', () => {
    expect(ObjectKeySchema.parse('objects/2026/asset.bin')).toBe(
      'objects/2026/asset.bin',
    );
    for (const value of [
      '../asset.bin',
      'objects/../asset.bin',
      'objects\\asset.bin',
      '/absolute/asset.bin',
      'objects/asset\n.bin',
      'objects/asset\x7f.bin',
      'objects/asset\x80.bin',
      '',
    ]) {
      expect(() => ObjectKeySchema.parse(value)).toThrow();
    }
  });

  it('validates the complete intent resource and excludes unknown response fields', () => {
    const resource = {
      id: intentId,
      object: {
        id: objectId,
        objectKey: 'objects/2026/asset.bin',
        state: 'pending_upload',
        version: '7',
      },
      upload: {
        method: 'PUT',
        signedUrl: 'https://storage.example.test/upload/once',
        expiresAt: '2026-08-30T12:00:00.000Z',
        maxBytes: 10_000_000,
        allowedMediaTypes: ['image/png', 'audio/mpeg'],
      },
    } as const;
    expect(UploadIntentResourceSchema.parse(resource)).toEqual(resource);
    expect(() =>
      UploadIntentResourceSchema.parse({
        ...resource,
        secret: 'must-not-serialize',
      }),
    ).toThrow();
    expect(() =>
      UploadIntentResourceSchema.parse({
        ...resource,
        object: { ...resource.object, state: 'ready' },
      }),
    ).toThrow();
  });
});
