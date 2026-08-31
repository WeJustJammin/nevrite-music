import {
  ApiErrorSchema,
  createRequestId,
  type JsonValue,
} from '@wejammin/contracts';

import {
  StorageDependencyUnavailableError,
  type SignedUpload,
  type UploadStorageAdapter,
} from '../storage/upload-storage';
import type { UploadAdmissionRepository } from './upload-intent-types';

export class UploadAdmissionError extends Error {
  readonly code: string;
  readonly details: Readonly<Record<string, JsonValue>>;
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;
  readonly rateLimit:
    Readonly<{ limit: number; remaining: number; resetAt: number }> | undefined;

  constructor(
    code: string,
    status: number,
    message: string,
    details: Readonly<Record<string, JsonValue>> = {},
    retryAfterSeconds?: number,
    rateLimit?: Readonly<{
      limit: number;
      remaining: number;
      resetAt: number;
    }>,
  ) {
    super(message);
    this.name = 'UploadAdmissionError';
    this.code = code;
    this.details = details;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.rateLimit = rateLimit;
  }
}

const safeMessage = (message: string): string =>
  [...message]
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 0x1f || code === 0x7f ? ' ' : character;
    })
    .join('')
    .slice(0, 500);

export const responseForError = (
  requestId: ReturnType<typeof createRequestId>,
  error: UploadAdmissionError,
): Response => {
  const payload = ApiErrorSchema.parse({
    code: error.code,
    details: error.details,
    message: safeMessage(error.message),
    requestId,
  });
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': 'application/json',
    'x-request-id': requestId,
  });
  if (error.retryAfterSeconds !== undefined)
    headers.set('retry-after', String(error.retryAfterSeconds));
  if (error.rateLimit !== undefined) {
    headers.set('rate-limit-limit', String(error.rateLimit.limit));
    headers.set('rate-limit-remaining', String(error.rateLimit.remaining));
    headers.set('rate-limit-reset', String(error.rateLimit.resetAt));
  }
  return new Response(JSON.stringify(payload), {
    headers,
    status: error.status,
  });
};

export const invalid = (
  message: string,
  details: Readonly<Record<string, JsonValue>> = {},
) => new UploadAdmissionError('INVALID_REQUEST', 400, message, details);

export const validation = (message: string, path: string) =>
  new UploadAdmissionError('VALIDATION_FAILED', 422, message, {
    violations: [{ code: 'invalid', message: 'The value is invalid.', path }],
  });

export const unsupportedMediaType = () =>
  new UploadAdmissionError(
    'UNSUPPORTED_MEDIA_TYPE',
    415,
    'The request must use application/json.',
    { allowedMediaTypes: ['application/json'] },
  );

export const tooLarge = (maxBytes: number) =>
  new UploadAdmissionError(
    'PAYLOAD_TOO_LARGE',
    413,
    'The request body is too large.',
    { maxBytes },
  );

export const rateLimited = (
  rate: Readonly<{
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterSeconds?: number;
  }>,
) =>
  new UploadAdmissionError(
    'RATE_LIMITED',
    429,
    'Too many upload requests.',
    { limit: rate.limit, remaining: rate.remaining, resetAt: rate.resetAt },
    rate.retryAfterSeconds,
    rate,
  );

export const authorityError = () =>
  new UploadAdmissionError(
    'FORBIDDEN',
    403,
    'The upload target is not available.',
  );

export const dependencyError = () =>
  new UploadAdmissionError(
    'DEPENDENCY_UNAVAILABLE',
    503,
    'The upload dependency is unavailable.',
  );

/**
 * Every awaited admission dependency must re-check this boundary before it
 * can issue a credential or enter the canonical commit path. A dependency
 * may ignore AbortSignal, so cancellation is enforced by the command too.
 */
export const assertDeadlineActive = (signal: AbortSignal): void => {
  if (signal.aborted) throw new StorageDependencyUnavailableError();
};

type DeadlineState = {
  timedOut: boolean;
  timeoutRecovery: (() => Promise<void> | void) | undefined;
};

const deadlineStates = new WeakMap<AbortSignal, DeadlineState>();

/** Registers bounded recovery for an irreversible repository call. */
export const markCommitStarted = (
  signal: AbortSignal,
  timeoutRecovery?: () => Promise<void> | void,
): void => {
  const state = deadlineStates.get(signal);
  if (state !== undefined) {
    state.timeoutRecovery = timeoutRecovery;
  }
};

/** Reconciles a canonical attempt that crossed the deadline before returning. */
export const cancelCanonicalIntent = async (
  repository: UploadAdmissionRepository,
  input: Readonly<{
    actorId: string;
    objectId: string;
    objectKey: string;
    signedUpload: SignedUpload;
    targetId: string;
    targetType: string;
  }>,
): Promise<boolean> => {
  if (repository.cancelIntent === undefined) return false;
  try {
    await withDeadline(
      (signal) => repository.cancelIntent!(input, signal),
      1_000,
    );
    return true;
  } catch {
    return false;
  }
};

export const withDeadline = async <T>(
  operation: (signal: AbortSignal) => Promise<T>,
  deadlineMs: number,
): Promise<T> => {
  const controller = new AbortController();
  const state: DeadlineState = { timedOut: false, timeoutRecovery: undefined };
  deadlineStates.set(controller.signal, state);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timeoutRecovery = Promise.resolve();
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      state.timedOut = true;
      controller.abort();
      try {
        timeoutRecovery = Promise.resolve(state.timeoutRecovery?.()).catch(
          () => undefined,
        );
      } catch {
        timeoutRecovery = Promise.resolve();
      }
      void timeoutRecovery.then(() =>
        reject(new StorageDependencyUnavailableError()),
      );
    }, deadlineMs);
  });
  const operationResult = Promise.resolve()
    .then(() => operation(controller.signal))
    .then(
      (value) => {
        if (state.timedOut)
          return timeoutRecovery.then(() => {
            throw new StorageDependencyUnavailableError();
          });
        return value;
      },
      (error: unknown) => {
        if (state.timedOut)
          return timeoutRecovery.then(() => {
            throw new StorageDependencyUnavailableError();
          });
        throw error;
      },
    );
  try {
    return await Promise.race([operationResult, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    deadlineStates.delete(controller.signal);
  }
};

/** Best-effort invalidation prevents a failed commit from leaving a live URL. */
export const cleanupSignedUpload = async (
  storage: UploadStorageAdapter,
  signedUpload: SignedUpload,
  deadlineMs: number,
): Promise<void> => {
  const revoke = storage.revoke;
  if (revoke === undefined) return;
  try {
    await withDeadline(
      (signal) => revoke(signedUpload, signal),
      Math.min(deadlineMs, 1_000),
    );
  } catch {
    // The original failure remains authoritative; cleanup is best effort.
  }
};
