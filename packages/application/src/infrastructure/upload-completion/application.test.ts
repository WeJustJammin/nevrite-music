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

const job = (state: 'queued' | 'succeeded' | 'failed' = 'queued') => ({
  createdAt: '2026-08-30T13:00:00.000Z',
  error:
    state === 'failed'
      ? { code: 'OBJECT_VERIFICATION_FAILED', retryable: false }
      : null,
  id: JOB_ID,
  progress: null,
  resultRef:
    state === 'succeeded' ? { type: 'object_record', id: OBJECT_ID } : null,
  state,
  type: 'platform.object.verify',
  updatedAt: '2026-08-30T13:00:00.000Z',
});

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

const observed = {
  byteSize: 512,
  checksum: { algorithm: 'sha256' as const, value: CHECKSUM },
  mediaType: 'audio/mpeg',
  objectKey: intent.objectKey,
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
      job: job(),
      objectId: OBJECT_ID,
      objectVersion: '8',
    })),
    finishVerification: vi.fn(async () => ({
      kind: 'applied' as const,
      job: job('succeeded'),
      objectVersion: '10',
    })),
    readIntent: vi.fn(async () => intent),
    readVerificationTarget: vi.fn(async () => null),
    readObject: vi.fn(async () => ({
      id: OBJECT_ID,
      objectKey: intent.objectKey,
      state: 'ready' as const,
      version: '10',
    })),
  },
  queue: {
    enqueue: vi.fn(async () => undefined),
  },
  storage: {
    observe: vi.fn(async () => observed),
  },
  ...overrides,
});

const makeInput = (
  overrides: Partial<UploadCompletionInput> = {},
): UploadCompletionInput => ({
  authorization: makePorts().authorization,
  digest: makePorts().digest,
  persistence: makePorts().persistence,
  queue: makePorts().queue,
  request,
  session: { userId: ACTOR_ID },
  storage: makePorts().storage,
  now: () => '2026-08-30T13:00:00.000Z',
  ...overrides,
});

describe('upload completion orchestration', () => {
  it('validates, reauthorizes, observes storage, commits once, and enqueues the minimal event', async () => {
    const ports = makePorts();
    const input = makeInput({
      authorization: ports.authorization,
      digest: ports.digest,
      persistence: ports.persistence,
      queue: ports.queue,
      storage: ports.storage,
    });

    await expect(completeUpload(input)).resolves.toEqual({
      dispatch: 'sent',
      etag: '"8"',
      job: job(),
      kind: 'accepted',
      location: `/api/v1/jobs/${JOB_ID}`,
      objectId: OBJECT_ID,
      objectState: 'uploaded',
      replayed: false,
      status: 202,
    });
    expect(ports.persistence.commitCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        actingPartyId: PARTY_ID,
        idempotencyKeyHash: 'b'.repeat(64),
        ifMatch: '"7"',
        observed,
        requestHash: 'c'.repeat(64),
      }),
    );
    expect(ports.queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        envelope: event,
        queue: 'platform-objects',
      }),
    );
  });

  it('returns the same job on an idempotent replay and does not enqueue another verifier', async () => {
    const ports = makePorts({
      persistence: {
        ...makePorts().persistence,
        commitCompletion: vi.fn(async () => ({
          event,
          kind: 'replay' as const,
          job: job(),
          objectId: OBJECT_ID,
          objectVersion: '8',
        })),
      },
    });
    const result = await completeUpload(
      makeInput({
        authorization: ports.authorization,
        digest: ports.digest,
        persistence: ports.persistence,
        queue: ports.queue,
        storage: ports.storage,
      }),
    );
    expect(result).toMatchObject({
      kind: 'accepted',
      replayed: true,
      status: 202,
    });
    expect(ports.queue.enqueue).not.toHaveBeenCalled();
  });

  it('fails before canonical writes for malformed input, missing session, expired intent, authority refusal, and storage absence', async () => {
    const malformed = makePorts();
    expect(
      await completeUpload(
        makeInput({
          ...malformed,
          request: { ...request, body: { ...request.body, unexpected: true } },
        }),
      ),
    ).toMatchObject({ code: 'INVALID_REQUEST', status: 400 });
    expect(malformed.persistence.readIntent).not.toHaveBeenCalled();

    const anonymous = makePorts();
    expect(
      await completeUpload(
        makeInput({
          authorization: anonymous.authorization,
          digest: anonymous.digest,
          persistence: anonymous.persistence,
          queue: anonymous.queue,
          session: null,
          storage: anonymous.storage,
        }),
      ),
    ).toMatchObject({ code: 'UNAUTHENTICATED', status: 401 });

    const expired = makePorts({
      persistence: {
        ...makePorts().persistence,
        readIntent: vi.fn(async () => ({
          ...intent,
          expiresAt: '2026-08-30T12:59:59.000Z',
        })),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: expired.authorization,
          digest: expired.digest,
          persistence: expired.persistence,
          queue: expired.queue,
          storage: expired.storage,
        }),
      ),
    ).toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });

    const forbidden = makePorts({
      authorization: {
        authorize: vi.fn(async () => ({ kind: 'forbidden' as const })),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: forbidden.authorization,
          digest: forbidden.digest,
          persistence: forbidden.persistence,
          queue: forbidden.queue,
          storage: forbidden.storage,
        }),
      ),
    ).toMatchObject({ code: 'FORBIDDEN', status: 403 });

    const absent = makePorts({
      storage: { observe: vi.fn(async () => null) },
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
    ).toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    expect(absent.persistence.commitCompletion).not.toHaveBeenCalled();
  });

  it('maps version, idempotency, and dependency failures without a second effect', async () => {
    const conflict = makePorts({
      persistence: {
        ...makePorts().persistence,
        commitCompletion: vi.fn(async () => ({
          code: 'IDEMPOTENCY_MISMATCH' as const,
          kind: 'conflict' as const,
        })),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: conflict.authorization,
          digest: conflict.digest,
          persistence: conflict.persistence,
          queue: conflict.queue,
          storage: conflict.storage,
        }),
      ),
    ).toMatchObject({ code: 'CONFLICT', status: 409 });

    const unavailable = makePorts({
      storage: {
        observe: vi.fn(async () => {
          throw new Error('storage unavailable');
        }),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: unavailable.authorization,
          digest: unavailable.digest,
          persistence: unavailable.persistence,
          queue: unavailable.queue,
          storage: unavailable.storage,
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', status: 503 });
    expect(unavailable.persistence.commitCompletion).not.toHaveBeenCalled();

    const queueDown = makePorts({
      queue: {
        enqueue: vi.fn(async () => {
          throw new Error('queue unavailable');
        }),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: queueDown.authorization,
          digest: queueDown.digest,
          persistence: queueDown.persistence,
          queue: queueDown.queue,
          storage: queueDown.storage,
        }),
      ),
    ).toMatchObject({ dispatch: 'deferred', kind: 'accepted', status: 202 });
  });
});
