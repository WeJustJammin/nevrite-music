import type {
  UploadCompletionDecision,
  UploadCompletionError,
  UploadCompletionPorts,
  UploadCompletionSession,
} from '@wejammin/application';

export const UPLOAD_COMPLETION_PATH =
  '/api/v1/upload-intents/:uploadIntentId/complete' as const;
export const UPLOAD_COMPLETION_MAX_BODY_BYTES = 256 * 1024;
export const UPLOAD_COMPLETION_DEADLINE_MS = 15_000;
export const UPLOAD_COMPLETION_USER_LIMIT = 60;
export const UPLOAD_COMPLETION_PARTY_LIMIT = 120;
export const UPLOAD_COMPLETION_CONCURRENT_LIMIT = 3;

export const UPLOAD_COMPLETION_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type MaybePromise<T> = T | Promise<T>;

export type UploadCompletionRateLimitInput = Readonly<{
  nowMs: number;
  request: Request;
  session: UploadCompletionSession;
  signal: AbortSignal;
  concurrentLimit: 3;
  partyLimit: 120;
  userLimit: 60;
}>;

export type UploadCompletionRateLimitDecision = Readonly<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  scope: 'user' | 'party';
  retryAfterSeconds?: number;
}>;

export type UploadCompletionPortsFactoryInput = Readonly<{
  request: Request;
  session: UploadCompletionSession;
  signal: AbortSignal;
}>;

export type UploadCompletionRouteDependencies = Readonly<{
  ports:
    | UploadCompletionPorts
    | ((
        input: UploadCompletionPortsFactoryInput,
      ) => MaybePromise<UploadCompletionPorts>);
  rateLimit: (
    input: UploadCompletionRateLimitInput,
  ) => MaybePromise<UploadCompletionRateLimitDecision>;
  resolveSession: (
    input: Readonly<{
      request: Request;
      signal: AbortSignal;
    }>,
  ) => MaybePromise<UploadCompletionSession | null>;
  deadlineMs?: number;
  maxBodyBytes?: number;
  now?: () => number;
}>;

export type UploadCompletionRouteError = Readonly<{
  kind: 'error';
  code: UploadCompletionError['code'] | 'RATE_LIMITED';
  details: Readonly<Record<string, unknown>>;
  message: string;
  noCanonicalWrite: true;
  rate?: Readonly<{
    limit: number;
    remaining: number;
    resetAt: number;
  }>;
  retryAfterSeconds?: number;
  status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 429 | 503 | 500;
}>;

export type UploadCompletionRouteResult =
  UploadCompletionDecision | UploadCompletionRouteError;

export type UploadCompletionBodyResult =
  | Readonly<{ kind: 'body'; value: unknown }>
  | Readonly<{ kind: 'error'; error: UploadCompletionRouteError }>;

export const routeError = (
  code: UploadCompletionRouteError['code'],
  status: UploadCompletionRouteError['status'],
  message: string,
  details: Readonly<Record<string, unknown>> = {},
  retryAfterSeconds?: number,
): UploadCompletionRouteError => ({
  code,
  details,
  kind: 'error',
  message,
  noCanonicalWrite: true,
  ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
  status,
});

export const dependencyError = (): UploadCompletionRouteError =>
  routeError(
    'DEPENDENCY_UNAVAILABLE',
    503,
    'Upload completion is temporarily unavailable.',
    { dependencyClass: 'upload-completion', retryable: true },
    5,
  );

export const invalidError = (
  message = 'The upload completion request is invalid.',
  details: Readonly<Record<string, unknown>> = {},
): UploadCompletionRouteError =>
  routeError('INVALID_REQUEST', 400, message, details);

export const validSession = (
  value: UploadCompletionSession | null,
): value is UploadCompletionSession | null =>
  value === null ||
  (typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 1 &&
    typeof value.userId === 'string' &&
    UPLOAD_COMPLETION_UUID.test(value.userId));

export const validRateDecision = (
  value: UploadCompletionRateLimitDecision,
): boolean =>
  typeof value.allowed === 'boolean' &&
  Number.isSafeInteger(value.limit) &&
  value.limit > 0 &&
  Number.isSafeInteger(value.remaining) &&
  value.remaining >= 0 &&
  value.remaining <= value.limit &&
  Number.isSafeInteger(value.resetAt) &&
  value.resetAt >= 0 &&
  ((value.scope === 'user' && value.limit === UPLOAD_COMPLETION_USER_LIMIT) ||
    (value.scope === 'party' &&
      value.limit === UPLOAD_COMPLETION_PARTY_LIMIT)) &&
  (value.retryAfterSeconds === undefined ||
    (Number.isSafeInteger(value.retryAfterSeconds) &&
      value.retryAfterSeconds >= 1));

export const rateLimited = (
  decision: UploadCompletionRateLimitDecision,
): UploadCompletionRouteError => ({
  ...routeError(
    'RATE_LIMITED',
    429,
    'Too many upload completion requests.',
    { remaining: decision.remaining, resetAt: decision.resetAt },
    decision.retryAfterSeconds ?? 1,
  ),
  rate: decision,
});
