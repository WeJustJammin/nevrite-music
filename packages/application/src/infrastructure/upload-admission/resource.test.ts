import { describe, expect, it } from 'vitest';

import {
  signedUrlBindsGeneratedObject,
  validCommitMetadata,
  validResource,
} from './resource.ts';
import type { UploadIntentResource } from './types.ts';

const OBJECT_ID = '55555555-5555-4555-8555-555555555555';
const OBJECT_KEY = `uploads/objects/${OBJECT_ID}`;
const INTENT_ID = '44444444-4444-4444-8444-444444444444';

const resource: UploadIntentResource = {
  id: INTENT_ID,
  object: {
    id: OBJECT_ID,
    objectKey: OBJECT_KEY,
    state: 'pending_upload',
    version: '1',
  },
  upload: {
    method: 'PUT',
    signedUrl: `https://storage.example/upload/${OBJECT_ID}?token=one`,
    expiresAt: '2026-08-30T13:15:00.000Z',
    maxBytes: 10_000,
    allowedMediaTypes: ['image/png'],
  },
};

const metadata = {
  intentId: INTENT_ID,
  objectId: OBJECT_ID,
  objectKey: OBJECT_KEY,
  objectVersion: '1',
  expiresAt: '2026-08-30T13:15:00.000Z',
  maxBytes: 10_000,
  allowedMediaTypes: ['image/png'],
} as const;

describe('upload admission resource validation', () => {
  it('fails closed for malformed commit metadata without throwing', () => {
    const now = '2026-08-30T13:00:00.000Z';

    expect(validCommitMetadata(1, now)).toBe(false);
    expect(validCommitMetadata(null, now)).toBe(false);
    expect(validCommitMetadata([], now)).toBe(false);
    expect(
      validCommitMetadata({ ...metadata, allowedMediaTypes: undefined }, now),
    ).toBe(false);
    expect(
      validCommitMetadata({ ...metadata, allowedMediaTypes: [] }, now),
    ).toBe(false);
    expect(
      validCommitMetadata(
        { ...metadata, allowedMediaTypes: ['image/png', 7] },
        now,
      ),
    ).toBe(false);
    expect(
      validCommitMetadata(
        new Proxy(
          {},
          {
            get: () => {
              throw new Error('malformed commit metadata');
            },
          },
        ),
        now,
      ),
    ).toBe(false);
    expect(validCommitMetadata(metadata, now)).toBe(true);

    const hexadecimalVersionUuid = 'aa14bdae-4482-4aef-8fd9-b3be4c3cc383';
    expect(
      validCommitMetadata(
        {
          ...metadata,
          intentId: hexadecimalVersionUuid,
          objectId: hexadecimalVersionUuid,
          objectKey: `uploads/objects/${hexadecimalVersionUuid}`,
        },
        now,
      ),
    ).toBe(true);
  });

  it('accepts canonical resources and rejects non-canonical shapes', () => {
    expect(validResource(resource)).toBe(true);
    expect(validResource({ ...resource, extra: true } as unknown)).toBe(false);
    expect(
      validResource({
        ...resource,
        object: { ...resource.object, extra: true },
      }),
    ).toBe(false);
    expect(
      validResource({
        ...resource,
        upload: { ...resource.upload, extra: true },
      }),
    ).toBe(false);
    expect(
      validResource({
        ...resource,
        upload: {
          ...resource.upload,
          allowedMediaTypes: ['image/png', 'image/png'],
        },
      }),
    ).toBe(false);
  });

  it('requires an exact object-id or object-key URL suffix', () => {
    const encodedKey = OBJECT_KEY.split('/').map(encodeURIComponent).join('/');

    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.example/upload/${encodedKey}?token=one`,
        OBJECT_ID,
        OBJECT_KEY,
      ),
    ).toBe(true);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.example/upload/${OBJECT_ID}-suffix`,
        OBJECT_ID,
        OBJECT_KEY,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.example/upload/${OBJECT_KEY}/suffix`,
        OBJECT_ID,
        OBJECT_KEY,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.example/upload?object=${OBJECT_ID}`,
        OBJECT_ID,
        OBJECT_KEY,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.example/upload/prefix-${OBJECT_KEY}-suffix`,
        OBJECT_ID,
        OBJECT_KEY,
      ),
    ).toBe(false);
  });

  it('rejects unsafe URL forms and malformed path escapes', () => {
    expect(
      signedUrlBindsGeneratedObject(
        `http://storage.example/upload/${OBJECT_ID}`,
        OBJECT_ID,
        OBJECT_KEY,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://user:password@storage.example/upload/${OBJECT_ID}`,
        OBJECT_ID,
        OBJECT_KEY,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.example/upload/%E0%A4%A`,
        OBJECT_ID,
        OBJECT_KEY,
      ),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject('not a url', OBJECT_ID, OBJECT_KEY),
    ).toBe(false);
    expect(
      signedUrlBindsGeneratedObject(
        `https://storage.example/upload/${OBJECT_ID}`,
        '',
        '',
      ),
    ).toBe(false);
  });

  it('applies URL binding when validating a resource', () => {
    expect(
      validResource({
        ...resource,
        upload: {
          ...resource.upload,
          signedUrl: `https://storage.example/upload/${OBJECT_ID}-other`,
        },
      }),
    ).toBe(false);
    expect(
      validResource({
        ...resource,
        upload: {
          ...resource.upload,
          signedUrl: `https://storage.example/upload/${OBJECT_KEY}`,
        },
      }),
    ).toBe(true);
  });
});
