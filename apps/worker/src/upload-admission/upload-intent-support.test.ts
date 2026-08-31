import { createRequestId } from '@wejammin/contracts';
import { describe, expect, it, vi } from 'vitest';

import { StorageDependencyUnavailableError } from '../storage/upload-storage';
import {
  UploadAdmissionError,
  assertDeadlineActive,
  cancelCanonicalIntent,
  cleanupSignedUpload,
  markCommitStarted,
  rateLimited,
  responseForError,
  withDeadline,
} from './upload-intent-support';

const requestId = createRequestId(undefined);
const signedUpload = {
  allowedMediaTypes: ['audio/mpeg'],
  expiresAt: '2026-08-30T12:15:00.000Z',
  maxBytes: 100_000,
  method: 'PUT' as const,
  signedUrl: 'https://storage.local/upload/token',
};

describe('upload-intent support boundary', () => {
  it('sanitizes safe errors and exposes only rate metadata in headers', async () => {
    const error = new UploadAdmissionError(
      'RATE_LIMITED',
      429,
      'bad\u0000message',
      {},
      4,
      { limit: 10, remaining: 0, resetAt: 100 },
    );
    const response = responseForError(requestId, error);
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('4');
    expect(response.headers.get('rate-limit-limit')).toBe('10');
    expect(response.headers.get('rate-limit-remaining')).toBe('0');
    expect(response.headers.get('rate-limit-reset')).toBe('100');
    await expect(response.json()).resolves.toMatchObject({
      message: 'bad message',
    });
    const noRetry = responseForError(
      requestId,
      rateLimited({ limit: 10, remaining: 0, resetAt: 100 }),
    );
    expect(noRetry.headers.get('retry-after')).toBeNull();
  });

  it('supports successful deadlines and skips or absorbs unavailable cleanup', async () => {
    await expect(withDeadline(async () => 'ok', 100)).resolves.toBe('ok');
    await expect(
      cleanupSignedUpload({ sign: vi.fn() }, signedUpload, 100),
    ).resolves.toBe(undefined);
    const revoke = vi.fn(async () => {
      throw new Error('cleanup down');
    });
    await expect(
      cleanupSignedUpload({ revoke, sign: vi.fn() }, signedUpload, 100),
    ).resolves.toBeUndefined();
    expect(revoke).toHaveBeenCalledOnce();
  });

  it('fails closed for an aborted deadline and optional cancellation seams', async () => {
    const controller = new AbortController();
    expect(() => assertDeadlineActive(controller.signal)).not.toThrow();
    controller.abort();
    expect(() => assertDeadlineActive(controller.signal)).toThrow(
      StorageDependencyUnavailableError,
    );

    // A signal that was not created by withDeadline has no tracked state.
    expect(() => markCommitStarted(new AbortController().signal)).not.toThrow();

    const input = {
      actorId: '11111111-1111-4111-8111-111111111111',
      objectId: '22222222-2222-4222-8222-222222222222',
      objectKey: 'objects/22222222-2222-4222-8222-222222222222',
      signedUpload,
      targetId: '33333333-3333-4333-8333-333333333333',
      targetType: 'recording',
    } as const;
    const repository = {
      createIntent: vi.fn(async () => ({ kind: 'conflict' as const })),
    };
    await expect(cancelCanonicalIntent(repository, input)).resolves.toBe(false);

    const cancelIntent = vi.fn(async () => {
      throw new Error('cancellation unavailable');
    });
    await expect(
      cancelCanonicalIntent({ ...repository, cancelIntent }, input),
    ).resolves.toBe(false);
    expect(cancelIntent).toHaveBeenCalledWith(input, expect.any(AbortSignal));
  });

  it('maps both late resolution and late rejection after timeout to dependency errors', async () => {
    let resolveLate!: () => void;
    const lateResolution = new Promise<string>((resolve) => {
      resolveLate = () => resolve('late');
    });
    const resolution = withDeadline(async () => lateResolution, 1);
    const resolutionOutcome = expect(resolution).rejects.toBeInstanceOf(
      StorageDependencyUnavailableError,
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    await resolutionOutcome;
    resolveLate();
    await new Promise((resolve) => setTimeout(resolve, 0));

    let rejectLate!: (error: Error) => void;
    const lateRejection = new Promise<never>((_, reject) => {
      rejectLate = reject;
    });
    const rejection = withDeadline(async () => lateRejection, 1);
    const rejectionOutcome = expect(rejection).rejects.toBeInstanceOf(
      StorageDependencyUnavailableError,
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    await rejectionOutcome;
    rejectLate(new Error('late failure'));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('cleans up even when the host timer does not return a handle', async () => {
    const timer = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementationOnce((callback) => {
        if (typeof callback === 'function') callback();
        return undefined as never;
      });
    try {
      await expect(withDeadline(async () => 'late', 1)).rejects.toBeInstanceOf(
        StorageDependencyUnavailableError,
      );
    } finally {
      timer.mockRestore();
    }
  });

  it('contains synchronous and asynchronous timeout-recovery failures', async () => {
    const asyncFailure = withDeadline(async (signal) => {
      markCommitStarted(signal, async () => {
        throw new Error('async recovery failure');
      });
      return new Promise<never>(() => undefined);
    }, 10);
    await expect(asyncFailure).rejects.toBeInstanceOf(
      StorageDependencyUnavailableError,
    );

    const syncFailure = withDeadline(async (signal) => {
      markCommitStarted(signal, () => {
        throw new Error('sync recovery failure');
      });
      return new Promise<never>(() => undefined);
    }, 10);
    await expect(syncFailure).rejects.toBeInstanceOf(
      StorageDependencyUnavailableError,
    );
  });
});
