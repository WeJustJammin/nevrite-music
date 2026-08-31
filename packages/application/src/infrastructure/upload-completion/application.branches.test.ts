import { describe, expect, it, vi } from 'vitest';

import {
  completeUpload,
  type UploadCompletionInput,
  type UploadCompletionIntent,
  type UploadCompletionPorts,
} from './index.ts';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const PARTY_ID = '22222222-2222-4222-8222-222222222222';
const TARGET_ID = '33333333-3333-4333-8333-333333333333';
const INTENT_ID = '44444444-4444-4444-8444-444444444444';
const OBJECT_ID = '55555555-5555-4555-8555-555555555555';
const JOB_ID = '66666666-6666-4666-8666-666666666666';
const EVENT_ID = '77777777-7777-4777-8777-777777777777';
const CORRELATION_ID = '88888888-8888-4888-8888-888888888888';
const CHECKSUM = 'a'.repeat(64);

const intent: UploadCompletionIntent = {
  actingPartyId: PARTY_ID,
  actorId: ACTOR_ID,
  allowedMediaTypes: ['audio/mpeg'],
  expiresAt: '2026-08-30T13:15:00.000Z',
  id: INTENT_ID,
  maxBytes: 10_000,
  objectId: OBJECT_ID,
  objectKey: `objects/${OBJECT_ID}`,
  objectVersion: '7',
  purpose: 'recording',
  state: 'issued',
  targetId: TARGET_ID,
  targetType: 'infrastructure.record',
};

const request = {
  body: {
    byteSize: 512,
    checksum: { algorithm: 'sha256' as const, value: CHECKSUM },
    mediaType: 'AUDIO/MPEG',
  },
  headers: {
    contentType: 'application/json' as const,
    idempotencyKey: 'complete-key-1',
    ifMatch: '"7"',
  },
  uploadIntentId: INTENT_ID,
};

const observed = {
  byteSize: 512,
  checksum: { algorithm: 'sha256' as const, value: CHECKSUM },
  mediaType: 'audio/mpeg',
  objectKey: intent.objectKey,
};

const job = {
  createdAt: '2026-08-30T13:00:00.000Z',
  error: null,
  id: JOB_ID,
  progress: null,
  resultRef: null,
  state: 'queued' as const,
  type: 'platform.object.verify',
  updatedAt: '2026-08-30T13:00:00.000Z',
};

const event = {
  aggregateId: OBJECT_ID,
  aggregateType: 'object_record',
  aggregateVersion: '8',
  causationId: null,
  correlationId: CORRELATION_ID,
  eventId: EVENT_ID,
  eventType: 'object.uploaded' as const,
  schemaVersion: 1 as const,
};

const makePorts = (
  overrides: Partial<UploadCompletionPorts> = {},
): UploadCompletionPorts => ({
  authorization: {
    authorize: vi.fn(async () => ({
      actorId: ACTOR_ID,
      actingPartyId: PARTY_ID,
      capabilities: ['upload.complete'],
      kind: 'allow' as const,
    })),
  },
  digest: {
    digest: vi.fn(async (value: string) =>
      value === 'complete-key-1' ? 'b'.repeat(64) : 'c'.repeat(64),
    ),
  },
  persistence: {
    cancelCompletion: vi.fn(async () => undefined),
    claimVerification: vi.fn(async () => ({
      kind: 'claimed' as const,
      expectedVersion: '8',
      version: '9',
    })),
    commitCompletion: vi.fn(async () => ({
      event,
      kind: 'committed' as const,
      job,
      objectId: OBJECT_ID,
      objectVersion: '8',
    })),
    finishVerification: vi.fn(async () => ({
      kind: 'applied' as const,
      job,
      objectVersion: '10',
    })),
    readIntent: vi.fn(async () => intent),
    readObject: vi.fn(async () => null),
    readVerificationTarget: vi.fn(async () => null),
  },
  queue: { enqueue: vi.fn(async () => undefined) },
  storage: { observe: vi.fn(async () => observed) },
  ...overrides,
});

const makeInput = (
  overrides: Partial<UploadCompletionInput> = {},
): UploadCompletionInput => {
  const ports = makePorts();
  return {
    authorization: ports.authorization,
    digest: ports.digest,
    persistence: ports.persistence,
    queue: ports.queue,
    request,
    session: { userId: ACTOR_ID },
    storage: ports.storage,
    now: () => '2026-08-30T13:00:00.000Z',
    ...overrides,
  };
};

describe('upload completion authorization and validation branches', () => {
  it('maps every authorization refusal and rejects mismatched server identity', async () => {
    for (const [decision, code, status] of [
      [{ kind: 'unauthenticated' as const }, 'UNAUTHENTICATED', 401],
      [{ kind: 'not_found' as const }, 'NOT_FOUND', 404],
      [{ kind: 'forbidden' as const }, 'FORBIDDEN', 403],
    ] as const) {
      const ports = makePorts({
        authorization: { authorize: vi.fn(async () => decision) },
      });
      expect(
        await completeUpload(
          makeInput({
            authorization: ports.authorization,
            digest: ports.digest,
            persistence: ports.persistence,
            queue: ports.queue,
            storage: ports.storage,
          }),
        ),
      ).toMatchObject({ code, status });
    }
    const unknown = makePorts({
      authorization: {
        authorize: vi.fn(async () => ({ kind: 'unknown' }) as never),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: unknown.authorization,
          digest: unknown.digest,
          persistence: unknown.persistence,
          queue: unknown.queue,
          storage: unknown.storage,
        }),
      ),
    ).toMatchObject({ code: 'FORBIDDEN', status: 403 });

    const mismatch = makePorts({
      authorization: {
        authorize: vi.fn(async () => ({
          actorId: '99999999-9999-4999-8999-999999999999',
          actingPartyId: PARTY_ID,
          capabilities: [],
          kind: 'allow' as const,
        })),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: mismatch.authorization,
          digest: mismatch.digest,
          persistence: mismatch.persistence,
          queue: mismatch.queue,
          storage: mismatch.storage,
        }),
      ),
    ).toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('fails closed for every malformed canonical intent field', async () => {
    const candidates: readonly Partial<UploadCompletionIntent>[] = [
      { id: 'bad' },
      { objectId: 'bad' },
      { actorId: 'bad' },
      { actingPartyId: 'bad' },
      { targetId: 'bad' },
      { state: 'expired' },
      { maxBytes: 0 },
      { allowedMediaTypes: [] },
      { allowedMediaTypes: ['AUDIO/MPEG'] },
      { objectVersion: '0' },
      { expiresAt: 'not-a-date' },
    ];
    for (const candidate of candidates) {
      const ports = makePorts({
        persistence: {
          ...makePorts().persistence,
          readIntent: vi.fn(async () => ({ ...intent, ...candidate }) as never),
        },
      });
      expect(
        await completeUpload(
          makeInput({
            authorization: ports.authorization,
            digest: ports.digest,
            persistence: ports.persistence,
            queue: ports.queue,
            storage: ports.storage,
          }),
        ),
      ).toMatchObject({ code: 'INTERNAL_ERROR', status: 500 });
    }
    const consumed = makePorts({
      persistence: {
        ...makePorts().persistence,
        readIntent: vi.fn(async () => ({ ...intent, state: 'consumed' })),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: consumed.authorization,
          digest: consumed.digest,
          persistence: consumed.persistence,
          queue: consumed.queue,
          storage: consumed.storage,
        }),
      ),
    ).toMatchObject({ kind: 'accepted', status: 202 });
  });

  it('maps version, size, media, and checksum validation failures', async () => {
    const cases: readonly [Partial<typeof request>, string, number][] = [
      [{ headers: { ...request.headers, ifMatch: '"6"' } }, 'CONFLICT', 409],
      [
        { body: { ...request.body, byteSize: 20_000 } },
        'PAYLOAD_TOO_LARGE',
        413,
      ],
      [
        { body: { ...request.body, mediaType: 'VIDEO/MP4' } },
        'UNSUPPORTED_MEDIA_TYPE',
        415,
      ],
    ];
    for (const [patch, code, status] of cases) {
      const ports = makePorts();
      expect(
        await completeUpload(
          makeInput({
            authorization: ports.authorization,
            digest: ports.digest,
            persistence: ports.persistence,
            queue: ports.queue,
            request: {
              ...request,
              ...patch,
              body: { ...request.body, ...patch.body },
              headers: { ...request.headers, ...patch.headers },
            },
            storage: ports.storage,
          }),
        ),
      ).toMatchObject({ code, status });
    }
    const checksum = makePorts({
      persistence: {
        ...makePorts().persistence,
        readIntent: vi.fn(async () => ({
          ...intent,
          expectedChecksum: {
            algorithm: 'sha256' as const,
            value: 'b'.repeat(64),
          },
        })),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: checksum.authorization,
          digest: checksum.digest,
          persistence: checksum.persistence,
          queue: checksum.queue,
          storage: checksum.storage,
        }),
      ),
    ).toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
  });

  it('maps absent intents, malformed observed metadata, and the default clock path', async () => {
    const absent = makePorts({
      persistence: {
        ...makePorts().persistence,
        readIntent: vi.fn(async () => null),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: absent.authorization,
          digest: absent.digest,
          persistence: absent.persistence,
          queue: absent.queue,
          storage: absent.storage,
        }),
      ),
    ).toMatchObject({ code: 'NOT_FOUND', status: 404 });

    for (const storage of [
      { observe: vi.fn(async () => ({ ...observed, byteSize: 0 }) as never) },
      {
        observe: vi.fn(async () => ({ ...observed, objectKey: 'other' })),
      },
    ]) {
      const ports = makePorts({ storage });
      expect(
        await completeUpload(
          makeInput({
            authorization: ports.authorization,
            digest: ports.digest,
            persistence: ports.persistence,
            queue: ports.queue,
            storage: ports.storage,
          }),
        ),
      ).toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    }
    const defaultClock = makePorts();
    expect(
      await completeUpload({
        authorization: defaultClock.authorization,
        digest: defaultClock.digest,
        persistence: defaultClock.persistence,
        queue: defaultClock.queue,
        request,
        session: { userId: ACTOR_ID },
        storage: defaultClock.storage,
      }),
    ).toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
  });
});
