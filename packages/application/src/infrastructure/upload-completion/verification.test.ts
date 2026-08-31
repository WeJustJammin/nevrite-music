import { describe, expect, it, vi } from 'vitest';

import {
  canConsumeObject,
  readReadyObject,
  verifyUploadedObject,
  type UploadCompletionPersistence,
  type UploadCompletionStoragePort,
  type VerificationTarget,
} from './index.ts';

const OBJECT_ID = '55555555-5555-4555-8555-555555555555';
const JOB_ID = '66666666-6666-4666-8666-666666666666';
const OBJECT_KEY = `objects/${OBJECT_ID}`;
const CHECKSUM = 'a'.repeat(64);

const job = (state: 'queued' | 'succeeded' | 'failed' = 'succeeded') => ({
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

const observed = {
  byteSize: 512,
  checksum: { algorithm: 'sha256' as const, value: CHECKSUM },
  mediaType: 'audio/mpeg',
  objectKey: OBJECT_KEY,
};

const target = (
  overrides: Partial<VerificationTarget> = {},
): VerificationTarget => ({
  expected: observed,
  id: OBJECT_ID,
  jobId: JOB_ID,
  state: 'uploaded',
  version: '8',
  ...overrides,
});

const makePersistence = (
  overrides: Partial<UploadCompletionPersistence> = {},
): UploadCompletionPersistence => ({
  claimVerification: vi.fn(async () => ({
    kind: 'claimed' as const,
    expectedVersion: '8',
    version: '9',
  })),
  commitCompletion: vi.fn(async () => {
    throw new Error('not used');
  }),
  finishVerification: vi.fn(async () => ({
    kind: 'applied' as const,
    job: job(),
    objectVersion: '10',
  })),
  readIntent: vi.fn(async () => null),
  readObject: vi.fn(async () => ({
    id: OBJECT_ID,
    objectKey: OBJECT_KEY,
    state: 'ready' as const,
    version: '10',
  })),
  readVerificationTarget: vi.fn(async () => target()),
  ...overrides,
});

const makeStorage = (
  observe: UploadCompletionStoragePort['observe'] = vi.fn(async () => observed),
): UploadCompletionStoragePort => ({ observe });

const verifyInput = (
  persistence: UploadCompletionPersistence,
  storage: UploadCompletionStoragePort = makeStorage(),
  overrides: Partial<Parameters<typeof verifyUploadedObject>[0]> = {},
) => ({
  objectId: OBJECT_ID,
  persistence,
  signal: new AbortController().signal,
  storage,
  ...overrides,
});

describe('object verification lifecycle', () => {
  it('uses CAS for uploaded→verifying→ready and returns a consumable terminal object', async () => {
    const persistence = makePersistence();
    const result = await verifyUploadedObject(verifyInput(persistence));
    expect(result).toMatchObject({ kind: 'ready', objectVersion: '10' });
    expect(persistence.claimVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedVersion: '8',
        from: 'uploaded',
        objectId: OBJECT_ID,
        to: 'verifying',
      }),
    );
    expect(persistence.finishVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedVersion: '9',
        from: 'verifying',
        nextState: 'ready',
        objectId: OBJECT_ID,
      }),
    );
    expect(
      await verifyUploadedObject({
        objectId: OBJECT_ID,
        persistence: makePersistence({
          readVerificationTarget: vi.fn(async () => target({ state: 'ready' })),
        }),
        storage: makeStorage(),
      }),
    ).toEqual({ kind: 'noop', state: 'ready' });
  });

  it('quarantines missing, malformed, or mismatched provider metadata', async () => {
    for (const storage of [
      makeStorage(vi.fn(async () => null)),
      makeStorage(vi.fn(async () => ({ ...observed, secret: 'no' }) as never)),
      makeStorage(vi.fn(async () => ({ ...observed, objectKey: 'other' }))),
      makeStorage(vi.fn(async () => ({ ...observed, byteSize: 513 }))),
    ]) {
      const persistence = makePersistence();
      const result = await verifyUploadedObject(
        verifyInput(persistence, storage),
      );
      expect(result).toMatchObject({
        kind: 'quarantined',
        objectVersion: '10',
      });
      expect(persistence.finishVerification).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'OBJECT_VERIFICATION_FAILED',
          nextState: 'quarantined',
        }),
      );
    }
  });

  it('honors policy rejection and quarantine while allowing a verified pass', async () => {
    for (const expected of ['reject', 'quarantine', 'pass'] as const) {
      const persistence = makePersistence();
      const result = await verifyUploadedObject(
        verifyInput(persistence, makeStorage(), {
          policy: {
            verify: vi.fn(async () => expected),
          },
        }),
      );
      expect(result).toMatchObject({
        kind:
          expected === 'pass'
            ? 'ready'
            : expected === 'reject'
              ? 'rejected'
              : 'quarantined',
      });
    }
    const persistence = makePersistence();
    expect(
      await verifyUploadedObject(
        verifyInput(persistence, makeStorage(), {
          policy: {
            verify: vi.fn(async () => {
              throw new Error('scanner unavailable');
            }),
          },
        }),
      ),
    ).toEqual({ kind: 'retry', reason: 'storage_unavailable' });
    expect(persistence.finishVerification).not.toHaveBeenCalled();
  });

  it('does not regress terminal states, resumes verifying, and waits for upload', async () => {
    for (const state of ['ready', 'rejected', 'quarantined'] as const) {
      const persistence = makePersistence({
        readVerificationTarget: vi.fn(async () => target({ state })),
      });
      expect(await verifyUploadedObject(verifyInput(persistence))).toEqual({
        kind: 'noop',
        state,
      });
      expect(persistence.claimVerification).not.toHaveBeenCalled();
      expect(persistence.finishVerification).not.toHaveBeenCalled();
    }
    const verifying = makePersistence({
      readVerificationTarget: vi.fn(async () => target({ state: 'verifying' })),
    });
    expect(await verifyUploadedObject(verifyInput(verifying))).toMatchObject({
      kind: 'ready',
    });
    expect(verifying.claimVerification).not.toHaveBeenCalled();
    const pending = makePersistence({
      readVerificationTarget: vi.fn(async () =>
        target({ state: 'pending_upload' }),
      ),
    });
    expect(await verifyUploadedObject(verifyInput(pending))).toEqual({
      kind: 'retry',
      reason: 'not_uploaded',
    });
  });

  it('fails closed for missing or invalid canonical targets and persistence failures', async () => {
    expect(
      await verifyUploadedObject(
        verifyInput(makePersistence(), makeStorage(), { objectId: 'bad' }),
      ),
    ).toEqual({ kind: 'not_found' });
    const missing = makePersistence({
      readVerificationTarget: vi.fn(async () => null),
    });
    expect(await verifyUploadedObject(verifyInput(missing))).toEqual({
      kind: 'not_found',
    });
    const invalid = makePersistence({
      readVerificationTarget: vi.fn(async () => target({ id: 'not-a-uuid' })),
    });
    expect(await verifyUploadedObject(verifyInput(invalid))).toEqual({
      kind: 'retry',
      reason: 'invalid_canonical_state',
    });
    const unavailable = makePersistence({
      readVerificationTarget: vi.fn(async () => {
        throw new Error('database unavailable');
      }),
    });
    expect(await verifyUploadedObject(verifyInput(unavailable))).toEqual({
      kind: 'retry',
      reason: 'persistence_unavailable',
    });
  });

  it('maps claim CAS, dependency, thrown, and malformed results to safe retries', async () => {
    const cases: readonly [unknown, string][] = [
      [{ kind: 'conflict' }, 'cas_conflict'],
      [{ kind: 'dependency_unavailable' }, 'persistence_unavailable'],
      [
        { kind: 'claimed', expectedVersion: '7', version: '9' },
        'invalid_canonical_state',
      ],
      [
        { kind: 'claimed', expectedVersion: '8', version: '0' },
        'invalid_canonical_state',
      ],
    ];
    for (const [claim, reason] of cases) {
      const persistence = makePersistence({
        claimVerification: vi.fn(async () => claim as never),
      });
      expect(await verifyUploadedObject(verifyInput(persistence))).toEqual({
        kind: 'retry',
        reason,
      });
    }
    const thrown = makePersistence({
      claimVerification: vi.fn(async () => {
        throw new Error('claim unavailable');
      }),
    });
    expect(await verifyUploadedObject(verifyInput(thrown))).toEqual({
      kind: 'retry',
      reason: 'persistence_unavailable',
    });
  });

  it('maps storage and finish CAS outcomes without regressing canonical state', async () => {
    const storageDown = makePersistence();
    expect(
      await verifyUploadedObject(
        verifyInput(
          storageDown,
          makeStorage(
            vi.fn(async () => {
              throw new Error('storage down');
            }),
          ),
        ),
      ),
    ).toEqual({ kind: 'retry', reason: 'storage_unavailable' });

    for (const finish of [
      { kind: 'conflict' as const },
      { kind: 'dependency_unavailable' as const },
      { kind: 'noop' as const, state: 'ready' as const },
      { kind: 'applied' as const, job: job('failed'), objectVersion: '0' },
      { kind: 'applied' as const, job: { invalid: true }, objectVersion: '10' },
    ]) {
      const persistence = makePersistence({
        finishVerification: vi.fn(async () => finish as never),
      });
      const result = await verifyUploadedObject(verifyInput(persistence));
      if (finish.kind === 'conflict') {
        expect(result).toEqual({ kind: 'retry', reason: 'cas_conflict' });
      } else if (finish.kind === 'dependency_unavailable') {
        expect(result).toEqual({
          kind: 'retry',
          reason: 'persistence_unavailable',
        });
      } else if (finish.kind === 'noop') {
        expect(result).toEqual({ kind: 'noop', state: 'ready' });
      } else {
        expect(result).toEqual({
          kind: 'retry',
          reason: 'invalid_canonical_state',
        });
      }
    }
    const thrown = makePersistence({
      finishVerification: vi.fn(async () => {
        throw new Error('finish unavailable');
      }),
    });
    expect(await verifyUploadedObject(verifyInput(thrown))).toEqual({
      kind: 'retry',
      reason: 'persistence_unavailable',
    });
  });
});

describe('ready-only object reads', () => {
  it('returns only canonical ready objects and fails closed for all other reads', async () => {
    const persistence = makePersistence();
    expect(await readReadyObject({ objectId: OBJECT_ID, persistence })).toEqual(
      {
        id: OBJECT_ID,
        objectKey: OBJECT_KEY,
        state: 'ready',
        version: '10',
      },
    );
    expect(await readReadyObject({ objectId: 'bad', persistence })).toBeNull();
    for (const object of [
      null,
      { id: OBJECT_ID, objectKey: OBJECT_KEY, state: 'uploaded', version: '8' },
      { id: 'other', objectKey: OBJECT_KEY, state: 'ready', version: '10' },
      { id: OBJECT_ID, objectKey: OBJECT_KEY, state: 'ready', version: '0' },
    ]) {
      const candidate = makePersistence({
        readObject: vi.fn(async () => object as never),
      });
      expect(
        await readReadyObject({ objectId: OBJECT_ID, persistence: candidate }),
      ).toBeNull();
    }
    const unavailable = makePersistence({
      readObject: vi.fn(async () => {
        throw new Error('database unavailable');
      }),
    });
    expect(
      await readReadyObject({ objectId: OBJECT_ID, persistence: unavailable }),
    ).toBeNull();
    expect(canConsumeObject('ready')).toBe(true);
    expect(canConsumeObject('uploaded')).toBe(false);
    expect(canConsumeObject('blocked')).toBe(false);
  });
});
