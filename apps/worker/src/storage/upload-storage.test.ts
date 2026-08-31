import { describe, expect, it, vi } from 'vitest';

import {
  MAX_UPLOAD_INTENT_TTL_MS,
  StorageDependencyUnavailableError,
  UploadStorageInputError,
  createLocalUploadStorage,
  createProductionUploadStorage,
  createProductionUploadStorageRegistry,
  defineUploadStorageRegistry,
  generateServerObjectKey,
  salvageSignedUploadForRevocation,
  type UploadStorageInput,
  validateSignedUpload,
} from './upload-storage';
import {
  UPLOAD_INACTIVITY_TIMEOUT_MS,
  UploadInactivityTimeoutError,
  enforceUploadInactivity,
} from './upload-transfer';

const NOW = Date.parse('2026-08-30T12:00:00.000Z');
const OBJECT_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const TARGET_ID = '33333333-3333-4333-8333-333333333333';

const input = (
  overrides: Partial<UploadStorageInput> = {},
): UploadStorageInput => ({
  actorId: ACTOR_ID,
  allowedMediaTypes: ['audio/mpeg'],
  expiresAt: new Date(NOW + MAX_UPLOAD_INTENT_TTL_MS).toISOString(),
  maxBytes: 10_000,
  objectId: OBJECT_ID,
  objectKey: `objects/${OBJECT_ID}`,
  targetId: TARGET_ID,
  ...overrides,
});

describe('upload storage boundary', () => {
  it('creates a bounded local signed upload without logging or exposing object bytes', async () => {
    const logger = vi.fn();
    const adapter = createLocalUploadStorage({
      now: () => NOW,
      randomUUID: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      logger,
    });

    const result = await adapter.sign(input());

    expect(result).toEqual({
      allowedMediaTypes: ['audio/mpeg'],
      expiresAt: '2026-08-30T12:15:00.000Z',
      maxBytes: 10_000,
      method: 'PUT',
      signedUrl:
        'https://storage.local/upload/11111111-1111-4111-8111-111111111111?token=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
    expect(logger).not.toHaveBeenCalled();
    expect(result.signedUrl).not.toContain('audio/mpeg');
    await adapter.revoke?.(result);
    expect(createLocalUploadStorage()).toBeDefined();
    await expect(
      createLocalUploadStorage({ now: () => NOW }).sign(input()),
    ).resolves.toMatchObject({ method: 'PUT' });
  });

  it('fails closed for invalid signing input and exceeds the fifteen-minute lifetime', async () => {
    const adapter = createLocalUploadStorage({ now: () => NOW });
    const invalidInputs: UploadStorageInput[] = [
      input({ actorId: 'not-a-uuid' }),
      input({ objectKey: '../escape' }),
      input({ objectKey: 'objects/\u0000bad' }),
      input({ objectKey: 'objects/\u007fbad' }),
      input({ objectKey: 'objects/\u0080bad' }),
      input({ maxBytes: 0 }),
      input({ maxBytes: Number.MAX_SAFE_INTEGER + 1 }),
      input({ allowedMediaTypes: [] }),
      input({ expiresAt: new Date(NOW).toISOString() }),
      input({
        expiresAt: new Date(NOW + MAX_UPLOAD_INTENT_TTL_MS + 1).toISOString(),
      }),
    ];
    for (const candidate of invalidInputs) {
      await expect(adapter.sign(candidate)).rejects.toThrow(
        'Upload signing input is invalid',
      );
    }
  });

  it('wraps a configured adapter in production and rejects absent adapters', async () => {
    const configured = {
      sign: vi.fn(async () => ({
        allowedMediaTypes: ['audio/mpeg'],
        expiresAt: '2026-08-30T12:15:00.000Z',
        maxBytes: 10_000,
        method: 'PUT' as const,
        signedUrl: 'https://provider.invalid/signed',
      })),
    };
    await expect(
      createProductionUploadStorage(configured).sign(input()),
    ).resolves.toEqual(expect.objectContaining({ method: 'PUT' }));
    await expect(
      createProductionUploadStorage(undefined).sign(input()),
    ).rejects.toBeInstanceOf(StorageDependencyUnavailableError);
  });

  it('keeps the production storage registry empty and rejects runtime adapters', () => {
    expect(createProductionUploadStorageRegistry()).toEqual({});
    expect(() =>
      createProductionUploadStorageRegistry({
        remote: { sign: vi.fn() },
      }),
    ).toThrow('must be empty in production');
    expect(() =>
      defineUploadStorageRegistry({
        'Invalid Name': { sign: vi.fn() },
      }),
    ).toThrow('registry is invalid');
    expect(
      defineUploadStorageRegistry({ local: { sign: vi.fn() } }),
    ).toMatchObject({ local: { sign: expect.any(Function) } });
  });

  it('rejects malformed signer output, unsafe URLs, and aborted local requests', async () => {
    const candidate = input();
    const valid = {
      allowedMediaTypes: candidate.allowedMediaTypes,
      expiresAt: candidate.expiresAt,
      maxBytes: candidate.maxBytes,
      method: 'PUT' as const,
      signedUrl: 'https://storage.local/upload/token',
    };
    expect(() => validateSignedUpload(null, candidate)).toThrow(
      StorageDependencyUnavailableError,
    );
    expect(() =>
      validateSignedUpload(
        {
          allowedMediaTypes: candidate.allowedMediaTypes,
          expiresAt: candidate.expiresAt,
          maxBytes: candidate.maxBytes,
          method: 'PUT',
          signedUrl: 'not-a-url',
        },
        candidate,
      ),
    ).toThrow(StorageDependencyUnavailableError);
    expect(() => validateSignedUpload(valid, candidate, false)).toThrow(
      StorageDependencyUnavailableError,
    );
    for (const result of [
      { ...valid, method: 'GET' },
      { ...valid, maxBytes: 1 },
      { ...valid, allowedMediaTypes: [] },
      { ...valid, allowedMediaTypes: ['audio/wav'] },
      { ...valid, expiresAt: 'not-a-date' },
      { ...valid, expiresAt: new Date(NOW).toISOString() },
      { ...valid, signedUrl: 'https://user@storage.local/upload/token' },
      { ...valid, signedUrl: 'https://:password@storage.local/upload/token' },
      { ...valid, signedUrl: 'http://provider.invalid/upload/token' },
    ])
      expect(() => validateSignedUpload(result, candidate)).toThrow(
        StorageDependencyUnavailableError,
      );

    const adapter = createLocalUploadStorage({ now: () => NOW });
    const controller = new AbortController();
    controller.abort();
    await expect(adapter.sign(candidate, controller.signal)).rejects.toThrow(
      'Upload signing input is invalid',
    );
    expect(() => generateServerObjectKey('bad-id')).toThrow(
      UploadStorageInputError,
    );
    expect(generateServerObjectKey(OBJECT_ID)).toBe(`objects/${OBJECT_ID}`);
  });

  it('salvages only safe issued URLs with canonical input metadata', () => {
    expect(salvageSignedUploadForRevocation(null, input())).toBeNull();
    expect(
      salvageSignedUploadForRevocation({ signedUrl: 'not-a-url' }, input()),
    ).toBeNull();
    expect(
      salvageSignedUploadForRevocation(
        { signedUrl: 'http://storage.local/upload/token' },
        input(),
      ),
    ).toBeNull();
    expect(
      salvageSignedUploadForRevocation(
        { signedUrl: 'https://user:password@storage.local/upload/token' },
        input(),
      ),
    ).toBeNull();
    expect(
      salvageSignedUploadForRevocation(
        { signedUrl: 'https://storage.local/upload/token' },
        input(),
        false,
      ),
    ).toBeNull();
    expect(
      salvageSignedUploadForRevocation(
        { signedUrl: 'https://storage.local/upload/token' },
        input(),
      ),
    ).toEqual({
      allowedMediaTypes: ['audio/mpeg'],
      expiresAt: '2026-08-30T12:15:00.000Z',
      maxBytes: 10_000,
      method: 'PUT',
      signedUrl: 'https://storage.local/upload/token',
    });
  });

  it('aborts a direct upload after 30 seconds without a byte and resets on each byte', async () => {
    vi.useFakeTimers();
    try {
      let sourceController: ReadableStreamDefaultController<Uint8Array>;
      const source = new ReadableStream<Uint8Array>({
        start(controller) {
          sourceController = controller;
        },
      });
      const reader = enforceUploadInactivity(source).getReader();
      const first = reader.read();
      await vi.advanceTimersByTimeAsync(UPLOAD_INACTIVITY_TIMEOUT_MS - 1);
      sourceController!.enqueue(new Uint8Array([1]));
      await expect(first).resolves.toEqual({
        done: false,
        value: new Uint8Array([1]),
      });
      const second = reader.read();
      await vi.advanceTimersByTimeAsync(UPLOAD_INACTIVITY_TIMEOUT_MS - 1);
      sourceController!.enqueue(new Uint8Array([2]));
      await expect(second).resolves.toEqual({
        done: false,
        value: new Uint8Array([2]),
      });
      const timedOut = reader.read().then(
        () => null,
        (error) => error,
      );
      await vi.advanceTimersByTimeAsync(UPLOAD_INACTIVITY_TIMEOUT_MS);
      await expect(timedOut).resolves.toBeInstanceOf(
        UploadInactivityTimeoutError,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('handles empty/completed/error streams, cancellation, and invalid windows', async () => {
    expect(() =>
      enforceUploadInactivity(new ReadableStream<Uint8Array>(), {
        inactivityMs: 0,
      }),
    ).toThrow('Upload inactivity window is invalid.');

    const completed = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    await expect(
      enforceUploadInactivity(completed).getReader().read(),
    ).resolves.toEqual({
      done: true,
      value: undefined,
    });

    const empty = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array());
        controller.close();
      },
    });
    const emptyReader = enforceUploadInactivity(empty, {
      inactivityMs: 100,
    }).getReader();
    await expect(emptyReader.read()).resolves.toEqual({
      done: false,
      value: new Uint8Array(),
    });
    await expect(emptyReader.read()).resolves.toEqual({
      done: true,
      value: undefined,
    });

    const failed = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('source failed'));
      },
    });
    const failedRead = enforceUploadInactivity(failed)
      .getReader()
      .read()
      .then(
        () => null,
        (error) => error,
      );
    await expect(failedRead).resolves.toMatchObject({
      message: 'source failed',
    });

    const cancellable = new ReadableStream<Uint8Array>({
      start() {
        // Keep the source pending until the output is cancelled.
      },
    });
    const cancellableReader = enforceUploadInactivity(cancellable).getReader();
    await cancellableReader.cancel('consumer stopped');

    const signal = new AbortController();
    signal.abort();
    const abortedReader = enforceUploadInactivity(
      new ReadableStream<Uint8Array>({ start() {} }),
      { signal: signal.signal },
    ).getReader();
    const abortedRead = abortedReader.read().then(
      () => null,
      (error) => error,
    );
    await expect(abortedRead).resolves.toBeInstanceOf(
      UploadInactivityTimeoutError,
    );
  });

  it('handles a rejected source cancellation after the inactivity deadline', async () => {
    vi.useFakeTimers();
    try {
      const signal = new AbortController();
      const reader = {
        cancel: vi.fn(async () => {
          throw new Error('source cancellation failed');
        }),
        read: vi.fn(() => new Promise<never>(() => undefined)),
      };
      const source = {
        getReader: () => reader,
      } as unknown as ReadableStream<Uint8Array>;
      const outputReader = enforceUploadInactivity(source, {
        inactivityMs: 1,
        signal: signal.signal,
      }).getReader();
      const output = outputReader.read().then(
        () => null,
        (error) => error,
      );
      await vi.advanceTimersByTimeAsync(1);
      await expect(output).resolves.toBeInstanceOf(
        UploadInactivityTimeoutError,
      );
      signal.abort();
      await Promise.resolve();
      expect(reader.cancel).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
