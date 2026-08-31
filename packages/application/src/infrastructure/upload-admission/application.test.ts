import { describe, expect, it, vi } from 'vitest';

import {
  createUploadIntent,
  type UploadAdmissionUseCaseInput,
  type UploadIntentResource,
} from './index.ts';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const PARTY_ID = '22222222-2222-4222-8222-222222222222';
const TARGET_ID = '33333333-3333-4333-8333-333333333333';
const INTENT_ID = '44444444-4444-4444-8444-444444444444';
const OBJECT_ID = '55555555-5555-4555-8555-555555555555';
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

const metadata = {
  intentId: INTENT_ID,
  objectId: OBJECT_ID,
  objectKey: `uploads/${PARTY_ID}/${OBJECT_ID}`,
  objectVersion: '1',
  expiresAt: '2026-08-30T13:15:00.000Z',
  maxBytes: 10_000,
  allowedMediaTypes: ['image/png', 'audio/mpeg'],
} as const;

const resource = (
  signedUrl = `https://storage.example/upload/${OBJECT_ID}?token=one`,
): UploadIntentResource => ({
  id: INTENT_ID,
  object: {
    id: OBJECT_ID,
    objectKey: metadata.objectKey,
    state: 'pending_upload',
    version: metadata.objectVersion,
  },
  upload: {
    method: 'PUT',
    signedUrl,
    expiresAt: metadata.expiresAt,
    maxBytes: metadata.maxBytes,
    allowedMediaTypes: metadata.allowedMediaTypes,
  },
});

const makeInput = (
  overrides: Partial<UploadAdmissionUseCaseInput> = {},
): UploadAdmissionUseCaseInput => ({
  request: baseRequest,
  session: { userId: ACTOR_ID },
  policies: policy,
  authorization: {
    authorize: vi.fn(async () => ({
      kind: 'allow' as const,
      actorId: ACTOR_ID,
      actingPartyId: PARTY_ID,
      targetVersion: '"2"',
    })),
  },
  digest: {
    digest: vi.fn(async (value: string) =>
      value === KEY ? 'b'.repeat(64) : 'c'.repeat(64),
    ),
  },
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
  objectKeys: {
    create: vi.fn(() => metadata.objectKey),
  },
  clock: {
    now: vi.fn(() => '2026-08-30T13:00:00.000Z'),
  },
  ...overrides,
});

describe('upload admission orchestration', () => {
  it('authorizes, hashes, signs before commit, and returns no-store metadata', async () => {
    const input = makeInput();
    const result = await createUploadIntent(input);
    expect(result).toEqual({
      kind: 'created',
      status: 201,
      location: `/api/v1/upload-intents/${INTENT_ID}`,
      etag: '"1"',
      resource: resource(`https://storage.example/upload/${OBJECT_ID}`),
      cacheControl: 'no-store',
      replayed: false,
    });
    expect(input.signer.sign).toHaveBeenCalledBefore(
      input.persistence.commitUploadIntent,
    );
    expect(input.persistence.commitUploadIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        actingPartyId: PARTY_ID,
        idempotencyKeyHash: 'b'.repeat(64),
        requestHash: 'c'.repeat(64),
        expectedVersion: '"2"',
      }),
    );
  });

  it('fails closed before signing for every validation/auth/idempotency refusal', async () => {
    const validation = makeInput({
      request: { ...baseRequest, body: { ...body, targetId: 'bad' } },
    });
    expect(await createUploadIntent(validation)).toMatchObject({
      kind: 'error',
      code: 'VALIDATION_FAILED',
    });
    expect(validation.authorization.authorize).not.toHaveBeenCalled();
    expect(validation.signer.sign).not.toHaveBeenCalled();

    for (const kind of ['unauthenticated', 'not_found', 'forbidden'] as const) {
      const auth = makeInput({
        authorization: { authorize: vi.fn(async () => ({ kind })) },
      });
      const result = await createUploadIntent(auth);
      expect(result).toMatchObject({
        kind: 'error',
        code: kind === 'not_found' ? 'NOT_FOUND' : kind.toUpperCase(),
      });
      expect(auth.persistence.readIdempotency).not.toHaveBeenCalled();
      expect(auth.signer.sign).not.toHaveBeenCalled();
    }

    const existing = makeInput({
      persistence: {
        readIdempotency: vi.fn(async () => ({
          actorId: ACTOR_ID,
          operation: 'upload-intent.create' as const,
          requestHash: 'different',
          state: 'completed' as const,
          resource: resource(),
        })),
        commitUploadIntent: vi.fn(),
      },
    });
    expect(await createUploadIntent(existing)).toMatchObject({
      kind: 'error',
      code: 'CONFLICT',
    });
    expect(existing.signer.sign).not.toHaveBeenCalled();
  });

  it('replays a completed binding without signing and keeps a reserved binding pending', async () => {
    const replay = makeInput({
      persistence: {
        readIdempotency: vi.fn(async () => ({
          actorId: ACTOR_ID,
          operation: 'upload-intent.create' as const,
          requestHash: 'c'.repeat(64),
          state: 'completed' as const,
          resource: resource(),
        })),
        commitUploadIntent: vi.fn(),
      },
    });
    expect(await createUploadIntent(replay)).toMatchObject({
      kind: 'replayed',
      replayed: true,
      resource: resource(),
    });
    expect(replay.signer.sign).not.toHaveBeenCalled();

    const reserved = makeInput({
      persistence: {
        readIdempotency: vi.fn(async () => ({
          actorId: ACTOR_ID,
          operation: 'upload-intent.create' as const,
          requestHash: 'c'.repeat(64),
          state: 'reserved' as const,
          resource: null,
        })),
        commitUploadIntent: vi.fn(),
      },
    });
    expect(await createUploadIntent(reserved)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(reserved.signer.sign).not.toHaveBeenCalled();
  });

  it('compensates a signed URL whenever canonical commit loses a race or fails', async () => {
    for (const commitResult of [
      { kind: 'conflict' as const },
      { kind: 'dependency_unavailable' as const },
    ]) {
      const input = makeInput({
        persistence: {
          readIdempotency: vi.fn(async () => null),
          commitUploadIntent: vi.fn(async () => commitResult),
        },
      });
      expect(await createUploadIntent(input)).toMatchObject({
        kind: 'error',
        code:
          commitResult.kind === 'conflict'
            ? 'CONFLICT'
            : 'DEPENDENCY_UNAVAILABLE',
      });
      expect(input.signer.revoke).toHaveBeenCalledWith(
        expect.objectContaining({
          signedUrl: `https://storage.example/upload/${OBJECT_ID}`,
        }),
      );
    }

    const revokeFails = makeInput({
      persistence: {
        readIdempotency: vi.fn(async () => null),
        commitUploadIntent: vi.fn(async () => ({ kind: 'conflict' as const })),
      },
      signer: {
        sign: vi.fn(async () => ({
          signedUrl: `https://storage.example/upload/${OBJECT_ID}`,
        })),
        revoke: vi.fn(async () => {
          throw new Error('cleanup unavailable');
        }),
      },
    });
    expect(await createUploadIntent(revokeFails)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });

  it('compensates exactly once for malformed commit results across every variant', async () => {
    const throwingResultAccess = vi.fn((property: PropertyKey) => {
      if (property === 'kind') throw new Error('malformed commit result');
    });
    const malformedResults: readonly unknown[] = [
      null,
      undefined,
      42,
      { kind: 'unknown' },
      { kind: 'committed' },
      { kind: 'committed', metadata: null },
      { kind: 'replay' },
      { kind: 'replay', resource: null },
      { kind: 'replay', resource: {} },
      new Proxy(
        { kind: 'committed' },
        {
          get: (target, property, receiver) => {
            throwingResultAccess(property);
            return Reflect.get(target, property, receiver);
          },
        },
      ),
    ];

    for (const commitResult of malformedResults) {
      const input = makeInput({
        persistence: {
          readIdempotency: vi.fn(async () => null),
          commitUploadIntent: vi.fn(async () => commitResult as never),
        },
      });

      await expect(createUploadIntent(input)).resolves.toMatchObject({
        kind: 'error',
        code: 'DEPENDENCY_UNAVAILABLE',
        noCanonicalWrite: true,
        status: 503,
      });
      expect(input.signer.revoke).toHaveBeenCalledTimes(1);
    }
    expect(throwingResultAccess).toHaveBeenCalled();
  });

  it('rejects unsafe generated keys, invalid clocks, signer failures, and bad digests', async () => {
    const unsafeKey = makeInput({
      objectKeys: { create: vi.fn(() => '../secret') },
    });
    expect(await createUploadIntent(unsafeKey)).toMatchObject({
      kind: 'error',
      code: 'INTERNAL_ERROR',
    });
    expect(unsafeKey.signer.sign).not.toHaveBeenCalled();

    const invalidClock = makeInput({ clock: { now: vi.fn(() => 'invalid') } });
    expect(await createUploadIntent(invalidClock)).toMatchObject({
      kind: 'error',
      code: 'INTERNAL_ERROR',
    });

    const signerFails = makeInput({
      signer: {
        sign: vi.fn(async () => {
          throw new Error('signer unavailable');
        }),
        revoke: vi.fn(async () => undefined),
      },
    });
    expect(await createUploadIntent(signerFails)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const badDigest = makeInput({
      digest: { digest: vi.fn(async () => 'bad') },
    });
    expect(await createUploadIntent(badDigest)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });

  it('rejects unbound signer URLs and compensates every issued credential', async () => {
    const unbound = makeInput({
      signer: {
        sign: vi.fn(async () => ({
          signedUrl: `https://storage.example/upload/${OBJECT_ID}-suffix`,
        })),
        revoke: vi.fn(async () => undefined),
      },
    });
    expect(await createUploadIntent(unbound)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(unbound.persistence.commitUploadIntent).not.toHaveBeenCalled();
    expect(unbound.signer.revoke).toHaveBeenCalledWith(
      expect.objectContaining({
        objectId: OBJECT_ID,
        signedUrl: `https://storage.example/upload/${OBJECT_ID}-suffix`,
      }),
    );

    const malformedCommitted = makeInput({
      persistence: {
        readIdempotency: vi.fn(async () => null),
        commitUploadIntent: vi.fn(async () => ({
          kind: 'committed' as const,
          metadata: {
            ...metadata,
            allowedMediaTypes: ['image/png', 'image/png'],
          },
        })),
      },
    });
    expect(await createUploadIntent(malformedCommitted)).toMatchObject({
      kind: 'error',
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(malformedCommitted.signer.revoke).toHaveBeenCalledWith(
      expect.objectContaining({
        objectId: OBJECT_ID,
        signedUrl: `https://storage.example/upload/${OBJECT_ID}`,
      }),
    );
  });
});
