import {
  ApiErrorSchema,
  createRequestId,
  JobStatusTransportSchema,
  RequestIdSchema,
  type ApiError,
  type JobStatusTransport,
} from '@wejammin/contracts';
import type { UiError } from '@wejammin/ui/infrastructure/presentation';

import {
  canApplyJobStatus,
  jobStateFromTransport,
  type JobAsyncState,
} from './job-state';
import { isRfc3339Timestamp } from './job-time';

export const JOB_READ_DEADLINE_MS = 8_000;
export const SAFE_READ_RETRY_DELAYS_MS = [250, 750] as const;

export type JobStatusReader = (
  signal: AbortSignal,
) => Promise<JobStatusTransport>;
export type Sleep = (delayMs: number, signal: AbortSignal) => Promise<void>;

export interface JobStatusRequestErrorInput {
  readonly apiError: ApiError;
  readonly httpStatus: number;
  readonly retryAt?: string | null;
  readonly retryAfterSeconds?: number | null;
}

export class JobStatusRequestError extends Error {
  readonly apiError: ApiError;
  readonly httpStatus: number;
  readonly retryAt: string | null;
  readonly retryAfterSeconds: number | null;
  readonly retryable: boolean;

  constructor(input: JobStatusRequestErrorInput) {
    super(input.apiError.message);
    this.name = 'JobStatusRequestError';
    this.apiError = input.apiError;
    this.httpStatus = input.httpStatus;
    this.retryAt =
      input.retryAt !== undefined &&
      input.retryAt !== null &&
      isRfc3339Timestamp(input.retryAt)
        ? input.retryAt
        : null;
    this.retryAfterSeconds =
      input.retryAfterSeconds !== undefined &&
      input.retryAfterSeconds !== null &&
      Number.isSafeInteger(input.retryAfterSeconds) &&
      input.retryAfterSeconds >= 0
        ? input.retryAfterSeconds
        : null;
    this.retryable =
      input.apiError.code === 'DEPENDENCY_UNAVAILABLE' &&
      input.apiError.details.retryable === true;
  }
}

const defaultSleep: Sleep = (delayMs, signal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('The operation was aborted', 'AbortError'));
      return;
    }
    const abort = (): void => {
      clearTimeout(timer);
      reject(new DOMException('The operation was aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, delayMs);
    signal.addEventListener('abort', abort, { once: true });
  });
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const errorApiError = (value: unknown): ApiError | null => {
  if (!isRecord(value)) return null;
  const candidate = value.apiError ?? value.error ?? value;
  const parsed = ApiErrorSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
};

export const isDependencyFailure = (value: unknown): boolean => {
  const apiError = errorApiError(value);
  if (apiError?.code === 'DEPENDENCY_UNAVAILABLE') return true;
  if (!isRecord(value)) return false;
  return value.code === 'DEPENDENCY_UNAVAILABLE';
};

export const retryAfterSecondsFromError = (value: unknown): number | null => {
  const candidate = isRecord(value) ? value.retryAfterSeconds : null;
  return typeof candidate === 'number' &&
    Number.isSafeInteger(candidate) &&
    candidate >= 0
    ? candidate
    : null;
};
export const isRetryableJobReadFailure = (value: unknown): boolean => {
  if (isDependencyFailure(value)) return true;
  const apiError = errorApiError(value);
  return (
    apiError?.code === 'RATE_LIMITED' &&
    retryAfterSecondsFromError(value) !== null
  );
};

export const isAbortFailure = (value: unknown): boolean =>
  isRecord(value) && value.name === 'AbortError';

const createSafeApiError = (requestId: string): ApiError => ({
  code: 'INTERNAL_ERROR',
  details: {},
  message: 'The job status could not be read.',
  requestId: RequestIdSchema.parse(requestId),
});

export const toJobUiError = (
  value: unknown,
  fallbackRequestId?: string,
): UiError => {
  const parsed = errorApiError(value);
  const requestIdCandidate =
    parsed?.requestId ??
    (isRecord(value) && typeof value.requestId === 'string'
      ? value.requestId
      : fallbackRequestId);
  const requestId = RequestIdSchema.safeParse(requestIdCandidate).success
    ? RequestIdSchema.parse(requestIdCandidate)
    : createRequestId(undefined);
  const safe = parsed ?? createSafeApiError(requestId);
  return {
    code: safe.code,
    details: safe.details,
    message: safe.message,
    requestId,
  };
};

const readWithinDeadline = async (
  read: JobStatusReader,
  parentSignal: AbortSignal,
  deadlineMs: number,
): Promise<JobStatusTransport> => {
  const controller = new AbortController();
  let rejectParentAbort: ((reason?: unknown) => void) | undefined;
  const abortFromParent = (): void => {
    controller.abort();
    rejectParentAbort?.(
      new DOMException('The operation was aborted', 'AbortError'),
    );
  };
  parentSignal.addEventListener('abort', abortFromParent, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const parentAbort = new Promise<never>((_, reject) => {
    rejectParentAbort = reject;
  });
  if (parentSignal.aborted) abortFromParent();
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DOMException('The operation timed out', 'TimeoutError'));
    }, deadlineMs);
  });
  try {
    return await Promise.race([read(controller.signal), parentAbort, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    parentSignal.removeEventListener('abort', abortFromParent);
  }
};

export interface ReadJobStatusWithRetryOptions {
  readonly read: JobStatusReader;
  readonly signal?: AbortSignal;
  readonly sleep?: Sleep;
  readonly safeRetryDeclared?: boolean;
  readonly attempt?: number;
  readonly retryDelaysMs?: readonly number[];
  readonly readDeadlineMs?: number;
  readonly expectedJobId?: string;
}

export async function readJobStatusWithRetry({
  read,
  signal,
  sleep = defaultSleep,
  safeRetryDeclared = false,
  attempt = 0,
  retryDelaysMs = SAFE_READ_RETRY_DELAYS_MS,
  readDeadlineMs = JOB_READ_DEADLINE_MS,
  expectedJobId,
}: ReadJobStatusWithRetryOptions): Promise<JobStatusTransport> {
  const operationController = new AbortController();
  const operationSignal = signal ?? operationController.signal;
  let retryCount = 0;

  while (true) {
    if (operationSignal.aborted) {
      throw new DOMException('The operation was aborted', 'AbortError');
    }
    try {
      const response = await readWithinDeadline(
        read,
        operationSignal,
        readDeadlineMs,
      );
      const parsed = JobStatusTransportSchema.parse(response);
      if (expectedJobId !== undefined && parsed.data.id !== expectedJobId) {
        throw new JobStatusRequestError({
          apiError: createSafeApiError(createRequestId(undefined)),
          httpStatus: 500,
        });
      }
      return parsed;
    } catch (error) {
      if (
        isAbortFailure(error) ||
        !safeRetryDeclared ||
        attempt >= 2 ||
        !isDependencyFailure(error) ||
        retryCount >= retryDelaysMs.length
      ) {
        throw error;
      }
      const delayMs = retryDelaysMs[retryCount];
      retryCount += 1;
      if (delayMs === undefined) throw error;
      await sleep(delayMs, operationSignal);
    }
  }
}

const initialTransport = (
  initial: JobStatusTransport | JobAsyncState | undefined,
): JobStatusTransport | null => {
  if (initial === undefined) return null;
  if ('data' in initial && 'etag' in initial)
    return JobStatusTransportSchema.parse(initial);
  if (initial.status !== 'success') return null;
  return JobStatusTransportSchema.parse({
    data: initial.data,
    etag: initial.version,
  });
};

export interface PollJobStatusOptions extends ReadJobStatusWithRetryOptions {
  readonly initial?: JobStatusTransport | JobAsyncState;
  readonly pollIntervalMs?: number;
  readonly onState?: (state: JobAsyncState) => void;
}

export async function pollJobStatus({
  initial,
  onState,
  pollIntervalMs = 1_000,
  sleep = defaultSleep,
  ...readOptions
}: PollJobStatusOptions): Promise<JobStatusTransport> {
  const operationController = new AbortController();
  const signal = readOptions.signal ?? operationController.signal;
  let current = initialTransport(initial);

  if (
    current !== null &&
    current.data.state !== 'queued' &&
    current.data.state !== 'running'
  ) {
    return current;
  }

  while (true) {
    const next = await readJobStatusWithRetry({
      ...readOptions,
      signal,
      sleep,
    });
    if (
      current === null ||
      canApplyJobStatus(current.data, next.data, current.etag, next.etag)
    ) {
      current = next;
      onState?.(jobStateFromTransport(next));
    }
    if (
      current !== null &&
      current.data.state !== 'queued' &&
      current.data.state !== 'running'
    ) {
      return current;
    }
    await sleep(Math.max(0, pollIntervalMs), signal);
  }
}
