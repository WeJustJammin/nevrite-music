import { authError } from '../authentication/boundary';
import {
  authEncoder,
  MAX_RESPONSE_BYTES,
  type AuthProductionConfiguration,
} from '../authentication/production-configuration';
import type {
  AuthenticationError,
  AuthenticationResult,
} from '../authentication/types';
import { profileRpcConflictFailure } from './profile-conflicts';

export type ProfileSchema<T> = Readonly<{
  safeParse: (
    value: unknown,
  ) => { success: true; data: T } | { success: false };
}>;

export type ProfileReplay = Readonly<{
  rpc: string;
  idField: string;
  idParameter: string;
  baseInput: Readonly<Record<string, unknown>>;
  headers: Readonly<Record<string, string>>;
}>;

type ProfileFailure = Readonly<{
  match: string;
  status: AuthenticationError['status'];
  message: string;
}>;

const profileFailures: readonly ProfileFailure[] = [
  {
    match: 'IDEMPOTENCY_MISMATCH',
    status: 409,
    message: 'The idempotency key was used for another request.',
  },
  {
    match: 'VERSION_MISMATCH',
    status: 409,
    message: 'The resource changed; reload and try again.',
  },
  {
    match: 'INVALID_TRANSITION',
    status: 409,
    message: 'The requested profile transition is not available.',
  },
  {
    match: 'CONFLICT',
    status: 409,
    message: 'The profile resource is in conflict.',
  },
  {
    match: 'UNAUTHENTICATED',
    status: 401,
    message: 'The authentication session is invalid.',
  },
  {
    match: 'STEP_UP_REQUIRED',
    status: 401,
    message: 'Recent verification is required.',
  },
  { match: 'FORBIDDEN', status: 403, message: 'The action is not allowed.' },
  {
    match: 'NOT_FOUND',
    status: 404,
    message: 'The requested resource was not found.',
  },
  {
    match: 'PAYLOAD_TOO_LARGE',
    status: 413,
    message: 'The request body is too large.',
  },
  {
    match: 'UNSUPPORTED_MEDIA_TYPE',
    status: 415,
    message: 'Use application/json.',
  },
  {
    match: 'VALIDATION_FAILED',
    status: 422,
    message: 'The profile request is invalid.',
  },
  { match: 'RATE_LIMITED', status: 429, message: 'Too many requests.' },
  {
    match: 'DEPENDENCY_BAD_GATEWAY',
    status: 502,
    message: 'The profile dependency returned an invalid response.',
  },
  {
    match: 'DEPENDENCY_TIMEOUT',
    status: 504,
    message: 'Profile persistence timed out.',
  },
  {
    match: 'INTERNAL_ERROR',
    status: 500,
    message: 'The profile request could not be completed.',
  },
  {
    match: 'DEPENDENCY_UNAVAILABLE',
    status: 503,
    message: 'Profile persistence is temporarily unavailable.',
  },
] as const;

const asRecord = (value: unknown): Readonly<Record<string, unknown>> | null =>
  typeof value === 'object' && value !== null
    ? (value as Readonly<Record<string, unknown>>)
    : null;

const errorCandidates = (value: unknown): readonly string[] => {
  const record = asRecord(value);
  const nested = record === null ? null : asRecord(record.error);
  return [
    record?.code,
    record?.errorCode,
    record?.message,
    nested?.code,
    nested?.errorCode,
    nested?.message,
  ].filter((candidate): candidate is string => typeof candidate === 'string');
};

const retryAfterValue = (value: string | null): number | undefined => {
  if (value === null || !/^\d+$/u.test(value)) return undefined;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds <= 86_400
    ? seconds
    : undefined;
};

const withRetryAfter = (
  error: AuthenticationError,
  retryAfterSeconds: number | undefined,
): AuthenticationError =>
  retryAfterSeconds === undefined ? error : { ...error, retryAfterSeconds };

export const profileRpcFailure = (
  value: unknown,
  status: number,
  retryAfterSeconds: number | undefined,
): AuthenticationError => {
  const proofConflict = profileRpcConflictFailure(value);
  if (proofConflict !== null)
    return withRetryAfter(proofConflict, retryAfterSeconds);
  const candidate = errorCandidates(value).map((item) => item.toUpperCase());
  const match = profileFailures.find(({ match: code }) =>
    candidate.some((item) => item.includes(code)),
  );
  if (match !== undefined) {
    return withRetryAfter(
      authError(match.status, match.match, match.message),
      retryAfterSeconds,
    );
  }
  const fallback =
    status === 401
      ? authError(
          401,
          'UNAUTHENTICATED',
          'The authentication session is invalid.',
        )
      : status === 403
        ? authError(403, 'FORBIDDEN', 'The action is not allowed.')
        : status === 404
          ? authError(404, 'NOT_FOUND', 'The requested resource was not found.')
          : status === 409
            ? authError(409, 'CONFLICT', 'The profile resource is in conflict.')
            : status === 429
              ? authError(429, 'RATE_LIMITED', 'Too many requests.')
              : status === 502
                ? authError(
                    502,
                    'DEPENDENCY_BAD_GATEWAY',
                    'The profile dependency is unavailable.',
                  )
                : authError(
                    503,
                    'DEPENDENCY_UNAVAILABLE',
                    'Profile persistence is temporarily unavailable.',
                  );
  return withRetryAfter(fallback, retryAfterSeconds);
};

export const mapProfileFailure = (error: unknown): AuthenticationError => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'ok' in error &&
    error.ok === false
  ) {
    return error as AuthenticationError;
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return authError(
      504,
      'DEPENDENCY_TIMEOUT',
      'Profile persistence timed out.',
    );
  }
  return authError(
    503,
    'DEPENDENCY_UNAVAILABLE',
    'Profile persistence is temporarily unavailable.',
  );
};

export const profileHeaders = (
  config: AuthProductionConfiguration,
  extraHeaders: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> => ({
  Accept: 'application/json',
  'Accept-Profile': 'platform_api',
  apikey: config.secret,
  authorization: `Bearer ${config.secret}`,
  'Content-Profile': 'platform_api',
  'Content-Type': 'application/json',
  ...extraHeaders,
});

export const readProfileJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (authEncoder.encode(text).byteLength > MAX_RESPONSE_BYTES) {
    throw authError(
      502,
      'DEPENDENCY_BAD_GATEWAY',
      'The profile dependency returned an invalid response.',
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw authError(
      502,
      'DEPENDENCY_BAD_GATEWAY',
      'The profile dependency returned an invalid response.',
    );
  }
};

const normalizeRpcPayload = (value: unknown): unknown =>
  Array.isArray(value) && value.length === 1 ? value[0] : value;

export const canonicalProfilePayload = (value: unknown): unknown => {
  const normalized = normalizeRpcPayload(value);
  const record = asRecord(normalized);
  if (record === null || !('replayed' in record)) return normalized;
  const canonical = { ...record };
  delete canonical.replayed;
  return canonical;
};

export const replayProfileId = (
  value: unknown,
  field: string,
): string | null => {
  const record = asRecord(normalizeRpcPayload(value));
  return record?.replayed === true && typeof record[field] === 'string'
    ? record[field]
    : null;
};

export const retryAfterFromProfileResponse = (
  response: Response,
): number | undefined => retryAfterValue(response.headers.get('retry-after'));

export const invalidProfileResponse = (): AuthenticationError =>
  authError(
    502,
    'DEPENDENCY_BAD_GATEWAY',
    'The profile dependency returned an invalid response.',
  );

export type ProfileResult<T> = AuthenticationResult<T>;
