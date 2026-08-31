import { describe, expect, it, vi } from 'vitest';

import {
  createUploadIntent,
  type UploadAdmissionUseCaseInput,
} from './index.ts';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const PARTY_ID = '22222222-2222-4222-8222-222222222222';
const TARGET_ID = '33333333-3333-4333-8333-333333333333';
const INTENT_ID = '44444444-4444-4444-8444-444444444444';
const OBJECT_ID = '55555555-5555-4555-8555-555555555555';
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

const metadata = {
  intentId: INTENT_ID,
  objectId: OBJECT_ID,
  objectKey: `uploads/${OBJECT_ID}`,
  objectVersion: '1',
  expiresAt: '2026-08-30T13:15:00.000Z',
  maxBytes: 10_000,
  allowedMediaTypes: ['image/png'],
} as const;

const resource = {
  id: INTENT_ID,
  object: {
    id: OBJECT_ID,
    objectKey: metadata.objectKey,
    state: 'pending_upload' as const,
    version: '1',
  },
  upload: {
    method: 'PUT' as const,
    signedUrl: `https://storage.example/upload/${OBJECT_ID}`,
    expiresAt: metadata.expiresAt,
    maxBytes: metadata.maxBytes,
    allowedMediaTypes: metadata.allowedMediaTypes,
  },
};

const makeInput = (
  overrides: Partial<UploadAdmissionUseCaseInput> = {},
): UploadAdmissionUseCaseInput => ({
  request,
  session: { userId: ACTOR_ID },
  policies,
  authorization: {
    authorize: vi.fn(async () => ({
      kind: 'allow' as const,
      actorId: ACTOR_ID,
      actingPartyId: PARTY_ID,
      targetVersion: '"2"',
    })),
  },
  digest: { digest: vi.fn(async () => HASH) },
  persistence: {
    readIdempotency: vi.fn(async () => null),
    commitUploadIntent: vi.fn(async () => ({
      kind: 'committed' as const,
      metadata,
    })),
  },
  signer: {
    sign: vi.fn(async () => ({
      signedUrl: `https://storage.example/upload/${OBJECT_ID}`,
    })),
    revoke: vi.fn(async () => undefined),
  },
  ids: {
    next: vi.fn((kind: 'upload_intent' | 'object_record') =>
      kind === 'upload_intent' ? INTENT_ID : OBJECT_ID,
    ),
  },
  objectKeys: { create: vi.fn(() => metadata.objectKey) },
  clock: { now: vi.fn(() => '2026-08-30T13:00:00.000Z') },
  ...overrides,
});

describe('upload admission application branch coverage', () => {
  it('fails closed for malformed sessions, resolver failures, and resolver facts', async () => {
    expect(
      await createUploadIntent(
        makeInput({
          request: { ...request, body: { ...request.body, unexpected: true } },
        }),
      ),
    ).toMatchObject({ code: 'INVALID_REQUEST', status: 400 });
    expect(
      await createUploadIntent(
        makeInput({
          request: { ...request, body: { ...request.body, byteSize: 10_001 } },
        }),
      ),
    ).toMatchObject({ code: 'PAYLOAD_TOO_LARGE', status: 413 });
    expect(
      await createUploadIntent(
        makeInput({
          request: {
            ...request,
            body: { ...request.body, mediaType: 'audio/mpeg' },
          },
        }),
      ),
    ).toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE', status: 415 });
    expect(
      await createUploadIntent(makeInput({ session: null })),
    ).toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(
      await createUploadIntent(makeInput({ session: { userId: 'bad' } })),
    ).toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(
      await createUploadIntent(
        makeInput({
          authorization: {
            authorize: vi.fn(async () => {
              throw new Error('down');
            }),
          },
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    for (const bad of [
      {
        kind: 'allow' as const,
        actorId: 'bad',
        actingPartyId: PARTY_ID,
        targetVersion: '"2"',
      },
      {
        kind: 'allow' as const,
        actorId: '99999999-9999-4999-8999-999999999999',
        actingPartyId: PARTY_ID,
        targetVersion: '"2"',
      },
      {
        kind: 'allow' as const,
        actorId: ACTOR_ID,
        actingPartyId: 'bad',
        targetVersion: '"2"',
      },
      {
        kind: 'allow' as const,
        actorId: ACTOR_ID,
        actingPartyId: PARTY_ID,
        targetVersion: '2',
      },
    ]) {
      expect(
        await createUploadIntent(
          makeInput({
            authorization: { authorize: vi.fn(async () => bad) },
          }),
        ),
      ).toMatchObject({ code: 'INTERNAL_ERROR' });
    }
  });

  it('covers digest/read/id/key/signer failure branches without signing twice', async () => {
    expect(
      await createUploadIntent(
        makeInput({
          digest: {
            digest: vi.fn(async () => {
              throw new Error('hash down');
            }),
          },
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(
      await createUploadIntent(
        makeInput({
          persistence: {
            readIdempotency: vi.fn(async () => {
              throw new Error('db down');
            }),
            commitUploadIntent: vi.fn(),
          },
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(
      await createUploadIntent(
        makeInput({
          clock: {
            now: vi.fn(() => {
              throw new Error('clock down');
            }),
          },
        }),
      ),
    ).toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(
      await createUploadIntent(
        makeInput({
          ids: {
            next: vi.fn(() => {
              throw new Error('id down');
            }),
          },
        }),
      ),
    ).toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(
      await createUploadIntent(
        makeInput({
          signer: {
            sign: vi.fn(async () => ({ signedUrl: undefined as never })),
            revoke: vi.fn(async () => undefined),
          },
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(
      await createUploadIntent(
        makeInput({
          persistence: {
            readIdempotency: vi.fn(async () => null),
            commitUploadIntent: vi.fn(async () => {
              throw new Error('commit down');
            }),
          },
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(
      await createUploadIntent(
        makeInput({
          signer: {
            sign: vi.fn(async () => ({
              signedUrl: 'http://storage.example/upload',
            })),
            revoke: vi.fn(async () => undefined),
          },
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(
      await createUploadIntent(
        makeInput({
          signer: {
            sign: vi.fn(async () => ({ signedUrl: 'not a url' })),
            revoke: vi.fn(async () => undefined),
          },
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
  });

  it('handles incomplete existing records, malformed replay resources, and commit races', async () => {
    for (const state of ['completed', 'failed_retryable'] as const) {
      const result = await createUploadIntent(
        makeInput({
          persistence: {
            readIdempotency: vi.fn(async () => ({
              actorId: ACTOR_ID,
              operation: 'upload-intent.create' as const,
              requestHash: HASH,
              state,
              resource: state === 'completed' ? null : null,
            })),
            commitUploadIntent: vi.fn(async () => ({
              kind: 'committed' as const,
              metadata,
            })),
          },
        }),
      );
      expect(result.kind).toBe('created');
    }
    const malformedReplay = await createUploadIntent(
      makeInput({
        persistence: {
          readIdempotency: vi.fn(async () => ({
            actorId: ACTOR_ID,
            operation: 'upload-intent.create' as const,
            requestHash: HASH,
            state: 'completed' as const,
            resource: {
              ...resource,
              upload: { ...resource.upload, signedUrl: 'bad' },
            },
          })),
          commitUploadIntent: vi.fn(),
        },
      }),
    );
    expect(malformedReplay).toMatchObject({ code: 'INTERNAL_ERROR' });

    const commitReplay = await createUploadIntent(
      makeInput({
        persistence: {
          readIdempotency: vi.fn(async () => null),
          commitUploadIntent: vi.fn(async () => ({
            kind: 'replay' as const,
            resource,
          })),
        },
      }),
    );
    expect(commitReplay).toMatchObject({ kind: 'replayed' });
  });

  it('fails closed when committed metadata or race replay is malformed', async () => {
    const malformedMetadata = await createUploadIntent(
      makeInput({
        persistence: {
          readIdempotency: vi.fn(async () => null),
          commitUploadIntent: vi.fn(async () => ({
            kind: 'committed' as const,
            metadata: { ...metadata, objectKey: '../unsafe' },
          })),
        },
      }),
    );
    expect(malformedMetadata).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
    expect(makeInput().signer.revoke).not.toHaveBeenCalled();

    const malformedRace = await createUploadIntent(
      makeInput({
        persistence: {
          readIdempotency: vi.fn(async () => null),
          commitUploadIntent: vi.fn(async () => ({
            kind: 'replay' as const,
            resource: {
              ...resource,
              object: { ...resource.object, version: '0' },
            },
          })),
        },
      }),
    );
    expect(malformedRace).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });
  });
});
