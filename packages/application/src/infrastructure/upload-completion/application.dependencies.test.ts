import { describe, expect, it, vi } from 'vitest';

import {
  completeUpload,
  createProductionUploadCompletionPorts,
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

describe('upload completion dependency and result branches', () => {
  it('maps thrown/invalid dependencies and malformed committed results safely', async () => {
    const readError = makePorts({
      persistence: {
        ...makePorts().persistence,
        readIntent: vi.fn(async () => {
          throw new Error('db');
        }),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: readError.authorization,
          digest: readError.digest,
          persistence: readError.persistence,
          queue: readError.queue,
          storage: readError.storage,
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', status: 503 });

    const authError = makePorts({
      authorization: {
        authorize: vi.fn(async () => {
          throw new Error('auth');
        }),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: authError.authorization,
          digest: authError.digest,
          persistence: authError.persistence,
          queue: authError.queue,
          storage: authError.storage,
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', status: 503 });

    for (const digest of [
      { digest: vi.fn(async () => 'bad') },
      {
        digest: vi.fn(async () => {
          throw new Error('hash');
        }),
      },
    ]) {
      const ports = makePorts({ digest });
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
      ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', status: 503 });
    }

    const commitCases = [
      { kind: 'dependency_unavailable' as const },
      { kind: 'conflict' as const, code: 'VERSION_MISMATCH' as const },
      { kind: 'conflict' as const, code: 'INVALID_TRANSITION' as const },
      {
        kind: 'committed' as const,
        event,
        job: {},
        objectId: OBJECT_ID,
        objectVersion: '8',
      },
      {
        kind: 'committed' as const,
        event: { bad: true },
        job,
        objectId: OBJECT_ID,
        objectVersion: '8',
      },
      {
        kind: 'committed' as const,
        event,
        job,
        objectId: 'bad',
        objectVersion: '8',
      },
      {
        kind: 'committed' as const,
        event,
        job,
        objectId: OBJECT_ID,
        objectVersion: '0',
      },
    ];
    for (const commit of commitCases) {
      const ports = makePorts({
        persistence: {
          ...makePorts().persistence,
          commitCompletion: vi.fn(async () => commit as never),
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
        code:
          commit.kind === 'conflict'
            ? 'CONFLICT'
            : commit.kind === 'dependency_unavailable'
              ? 'DEPENDENCY_UNAVAILABLE'
              : 'INTERNAL_ERROR',
      });
    }
    const commitError = makePorts({
      persistence: {
        ...makePorts().persistence,
        commitCompletion: vi.fn(async () => {
          throw new Error('commit');
        }),
      },
    });
    expect(
      await completeUpload(
        makeInput({
          authorization: commitError.authorization,
          digest: commitError.digest,
          persistence: commitError.persistence,
          queue: commitError.queue,
          storage: commitError.storage,
        }),
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE', status: 503 });
    expect(commitError.persistence.cancelCompletion).toHaveBeenCalledOnce();
  });

  it('fences malformed canonical results before returning a dependency error', async () => {
    for (const malformed of [null, undefined, {}, { kind: 'unknown' }]) {
      const base = makePorts();
      const cancelCompletion = vi.fn(async () => undefined);
      const persistence = {
        ...base.persistence,
        cancelCompletion,
        commitCompletion: vi.fn(async () => malformed as never),
      };
      const ports = { ...base, persistence };
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
        code: 'DEPENDENCY_UNAVAILABLE',
        status: 503,
      });
      expect(cancelCompletion).toHaveBeenCalledOnce();
    }
  });

  it('reconciles when the request deadline aborts after commit or result validation', async () => {
    const afterCommitController = new AbortController();
    const afterCommit = makePorts({
      persistence: {
        ...makePorts().persistence,
        commitCompletion: vi.fn(async () => {
          afterCommitController.abort();
          return {
            event,
            kind: 'committed' as const,
            job,
            objectId: OBJECT_ID,
            objectVersion: '8',
          };
        }),
      },
    });
    const afterCommitResult = await completeUpload(
      makeInput({
        authorization: afterCommit.authorization,
        digest: afterCommit.digest,
        persistence: afterCommit.persistence,
        queue: afterCommit.queue,
        signal: afterCommitController.signal,
        storage: afterCommit.storage,
      }),
    );
    expect(afterCommitResult).toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      status: 503,
    });
    expect(afterCommit.persistence.cancelCompletion).toHaveBeenCalledOnce();
    expect(afterCommit.queue.enqueue).not.toHaveBeenCalled();

    const afterValidationController = new AbortController();
    const resultWithAbortDuringValidation = {
      event,
      kind: 'committed' as const,
      get job() {
        afterValidationController.abort();
        return job;
      },
      objectId: OBJECT_ID,
      objectVersion: '8',
    };
    const afterValidationPorts = makePorts({
      persistence: {
        ...makePorts().persistence,
        commitCompletion: vi.fn(
          async () => resultWithAbortDuringValidation as never,
        ),
      },
    });
    const afterValidationResult = await completeUpload(
      makeInput({
        authorization: afterValidationPorts.authorization,
        digest: afterValidationPorts.digest,
        persistence: afterValidationPorts.persistence,
        queue: afterValidationPorts.queue,
        signal: afterValidationController.signal,
        storage: afterValidationPorts.storage,
      }),
    );
    expect(afterValidationResult).toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      status: 503,
    });
    expect(
      afterValidationPorts.persistence.cancelCompletion,
    ).toHaveBeenCalledOnce();
    expect(afterValidationPorts.queue.enqueue).not.toHaveBeenCalled();
  });

  it('swallows recovery-port failures after an ambiguous commit', async () => {
    const ports = makePorts({
      persistence: {
        ...makePorts().persistence,
        cancelCompletion: vi.fn(async () => {
          throw new Error('reconciliation unavailable');
        }),
        commitCompletion: vi.fn(async () => null as never),
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
      code: 'DEPENDENCY_UNAVAILABLE',
      status: 503,
    });
    expect(ports.persistence.cancelCompletion).toHaveBeenCalledOnce();
  });

  it('bounds a never-settling recovery port after an ambiguous commit', async () => {
    vi.useFakeTimers();
    let markRecoveryStarted!: () => void;
    let recoverySignal: AbortSignal | undefined;
    const recoveryStarted = new Promise<void>((resolve) => {
      markRecoveryStarted = resolve;
    });
    const base = makePorts();
    const cancelCompletion = vi.fn(
      async (_input: unknown, signal: AbortSignal) => {
        recoverySignal = signal;
        markRecoveryStarted();
        await new Promise<void>(() => undefined);
      },
    );
    const ports = makePorts({
      persistence: {
        ...base.persistence,
        cancelCompletion,
        commitCompletion: vi.fn(async () => null as never),
      },
    });

    try {
      const resultPromise = completeUpload(
        makeInput({
          authorization: ports.authorization,
          digest: ports.digest,
          persistence: ports.persistence,
          queue: ports.queue,
          storage: ports.storage,
        }),
      );
      await recoveryStarted;
      await vi.advanceTimersByTimeAsync(1_000);
      await expect(resultPromise).resolves.toMatchObject({
        code: 'DEPENDENCY_UNAVAILABLE',
        status: 503,
      });
      expect(recoverySignal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('runs bounded recovery before commit when the request is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const ports = makePorts();
    const result = await completeUpload(
      makeInput({
        authorization: ports.authorization,
        digest: ports.digest,
        persistence: ports.persistence,
        queue: ports.queue,
        signal: controller.signal,
        storage: ports.storage,
      }),
    );

    expect(result).toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      status: 503,
    });
    expect(ports.persistence.cancelCompletion).toHaveBeenCalledOnce();
    expect(ports.persistence.commitCompletion).not.toHaveBeenCalled();
  });

  it('fails closed before canonical completion when the fence port is absent', async () => {
    const base = makePorts();
    const persistence = { ...base.persistence };
    delete persistence.cancelCompletion;
    const commitCompletion = vi.fn(base.persistence.commitCompletion);
    const result = await completeUpload(
      makeInput({
        authorization: base.authorization,
        digest: base.digest,
        persistence: { ...persistence, commitCompletion },
        queue: base.queue,
        storage: base.storage,
      }),
    );

    expect(result).toMatchObject({
      code: 'DEPENDENCY_UNAVAILABLE',
      status: 503,
    });
    expect(commitCompletion).not.toHaveBeenCalled();
  });

  it('fails closed when the production factory has no adapters', async () => {
    const ports = createProductionUploadCompletionPorts();
    await expect(
      ports.authorization.authorize({
        intent,
        session: { userId: ACTOR_ID },
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow();
    await expect(
      ports.digest.digest('key', new AbortController().signal),
    ).rejects.toThrow();
    await expect(
      ports.storage.observe({
        objectKey: intent.objectKey,
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow();
    await expect(
      ports.queue.enqueue({
        envelope: event,
        queue: 'platform-objects',
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow();
    await expect(
      ports.persistence.readIntent({
        actorId: ACTOR_ID,
        signal: new AbortController().signal,
        uploadIntentId: INTENT_ID,
      }),
    ).rejects.toThrow();
    await expect(
      ports.persistence.commitCompletion({} as never),
    ).rejects.toThrow();
    expect(ports.persistence.cancelCompletion).toBeTypeOf('function');
    await expect(
      ports.persistence.cancelCompletion!(
        {} as never,
        new AbortController().signal,
      ),
    ).rejects.toThrow();
    await expect(
      ports.persistence.claimVerification({} as never),
    ).rejects.toThrow();
    await expect(
      ports.persistence.finishVerification({} as never),
    ).rejects.toThrow();
    await expect(
      ports.persistence.readVerificationTarget({
        objectId: OBJECT_ID,
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow();
    await expect(
      ports.persistence.readObject({
        objectId: OBJECT_ID,
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow();
    const supplied = makePorts();
    expect(createProductionUploadCompletionPorts(supplied)).toEqual(supplied);
  });
});
