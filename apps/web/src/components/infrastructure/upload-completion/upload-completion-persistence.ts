import type { JobStatus } from '@wejammin/contracts';

import { normalizeUploadCompletionErrorCode } from './upload-completion-errors';
import type {
  UploadCompletionProjection,
  UploadCompletionState,
} from './upload-completion-state';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const VERSION_PATTERN = /^"[1-9][0-9]{0,18}"$/u;
const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/u;

const safeUuid = (value: string): string =>
  UUID_PATTERN.test(value) ? value : '';

const safeVersion = (value: string): string | null =>
  VERSION_PATTERN.test(value) ? value : null;

const safeTimestamp = (value: string | null): string | null =>
  value !== null &&
  ISO_TIMESTAMP_PATTERN.test(value) &&
  Number.isFinite(Date.parse(value))
    ? value
    : null;

const safeMessage = (value: string): string =>
  value.length >= 1 &&
  value.length <= 160 &&
  [...value].every((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && codePoint >= 0x20 && codePoint !== 0x7f;
  })
    ? value
    : '';

const persistedJob = (job: JobStatus) => ({
  id: job.id,
  type: job.type,
  state: job.state,
  progress: job.progress,
  resultRef: job.resultRef,
  error: job.error,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
});

const persistedCompletion = (completion: UploadCompletionProjection) => ({
  status: completion.status,
  location: completion.location,
  etag: completion.etag,
  job: persistedJob(completion.job),
  objectId: completion.objectId,
  objectState: completion.objectState,
  replayed: completion.replayed,
  dispatch: completion.dispatch,
});

/** Deliberately omits the draft, signed URLs, payloads, and provider detail. */
export const serializeUploadCompletionState = (
  state: UploadCompletionState,
): string => {
  switch (state.status) {
    case 'success':
      return JSON.stringify({
        status: state.status,
        completion: persistedCompletion(state.completion),
      });
    case 'degraded':
      return JSON.stringify({
        status: state.status,
        requestId: safeUuid(state.requestId),
        lastVerifiedAt: safeTimestamp(state.lastVerifiedAt),
        ...(state.completion === null
          ? {}
          : { completion: persistedCompletion(state.completion) }),
      });
    case 'conflict':
      return JSON.stringify({
        status: state.status,
        currentVersion: safeVersion(state.currentVersion),
        requestId: safeUuid(state.requestId),
      });
    case 'error': {
      const retryAfterSeconds = state.retryAfterSeconds;
      const serialized = JSON.stringify({
        status: state.status,
        code: normalizeUploadCompletionErrorCode(state.code),
        requestId: safeUuid(state.requestId),
        ...(Number.isSafeInteger(retryAfterSeconds) &&
        Number(retryAfterSeconds) >= 0
          ? { retryAfterSeconds }
          : {}),
        ...(state.retryAt === undefined || safeTimestamp(state.retryAt) === null
          ? {}
          : { retryAt: state.retryAt }),
        retryable: state.retryable,
        attempt:
          Number.isInteger(state.attempt) && state.attempt >= 0
            ? Math.min(state.attempt, 2)
            : 0,
      });
      return serialized;
    }
    case 'validation_error':
      return JSON.stringify({
        status: state.status,
        violations: state.violations.map(({ field, code }) => ({
          field,
          code: safeMessage(code),
        })),
      });
    case 'loading':
      return JSON.stringify({
        status: state.status,
        startedAt: safeTimestamp(state.startedAt),
        preserveDraft: true,
      });
    case 'idle':
      return JSON.stringify({ status: state.status });
    case 'pending':
    case 'offline':
      return JSON.stringify({
        status: state.status,
        message: safeMessage(state.message),
      });
    case 'disabled':
      return JSON.stringify({
        status: state.status,
        reason: safeMessage(state.reason),
      });
  }
};
