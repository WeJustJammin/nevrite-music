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

export type RelationshipSchema<T> = Readonly<{
  safeParse: (
    value: unknown,
  ) => { success: true; data: T } | { success: false };
}>;

export type RelationshipReplay = Readonly<{
  rpc: string;
  idField: string;
  idParameter: string;
  baseInput: Readonly<Record<string, unknown>>;
  headers: Readonly<Record<string, string>>;
}>;

const rpcFailureStatus: Readonly<
  Record<string, AuthenticationError['status']>
> = {
  IDEMPOTENCY_MISMATCH: 409,
  VERSION_MISMATCH: 409,
  ORGANIZATION_VERSION_CONFLICT: 409,
  MEMBERSHIP_VERSION_CONFLICT: 409,
  CONFLICT: 409,
  TYPE_ASSIGNMENT_EXISTS: 409,
  MEMBERSHIP_EXISTS: 409,
  MEMBERSHIP_NOT_CONFIRMED: 409,
  TERMS_VERSION_MISMATCH: 409,
  TERMS_HASH_MISMATCH: 409,
  COUNTERPART_CONFIRMATION_REQUIRED: 409,
  CAPACITY_OVERLAP: 409,
  GOVERNANCE_MEMBER_SET_STALE: 409,
  INVALID_REQUEST: 400,
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  CONTEXT_NOT_FOUND: 401,
  CONTEXT_REVOKED: 401,
  CONTEXT_RECONFIRM_REQUIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TYPE_ASSIGNMENT_NOT_FOUND: 404,
  PERSON_NOT_FOUND: 404,
  ORGANIZATION_TYPE_UNKNOWN: 422,
  ORGANIZATION_MODE_REQUIRED: 422,
  TERMS_ACCEPTANCE_REQUIRED: 422,
  GOVERNANCE_TERMS_INCOMPLETE: 422,
  MEMBERSHIP_STATE_INVALID: 422,
  MEMBERSHIP_ASSERTION_REJECTED: 422,
  MEMBERSHIP_NOT_INVITABLE: 422,
  RETROACTIVE_END_CONFIRMATION_REQUIRED: 422,
  PERIOD_INVALID: 422,
  DATE_INVALID: 422,
  TERM_INVALID: 422,
  HASH_INVALID: 422,
  EVIDENCE_REFERENCE_INVALID: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  DEPENDENCY_UNAVAILABLE: 503,
  DEPENDENCY_TIMEOUT: 504,
};

const rpcFailureMessage: Readonly<Record<string, string>> = {
  IDEMPOTENCY_MISMATCH: 'The idempotency key was used for another request.',
  VERSION_MISMATCH: 'The resource changed; reload and try again.',
  ORGANIZATION_VERSION_CONFLICT:
    'The organization changed; reload and try again.',
  MEMBERSHIP_VERSION_CONFLICT: 'The membership changed; reload and try again.',
  TYPE_ASSIGNMENT_EXISTS: 'The organization type is already active.',
  MEMBERSHIP_EXISTS: 'The membership already exists.',
  MEMBERSHIP_NOT_CONFIRMED: 'The membership is not confirmed.',
  TERMS_VERSION_MISMATCH: 'The membership terms changed; reload and try again.',
  TERMS_HASH_MISMATCH: 'The membership terms changed; reload and try again.',
  COUNTERPART_CONFIRMATION_REQUIRED: 'A counterpart confirmation is required.',
  GOVERNANCE_TERMS_INCOMPLETE: 'Current governance terms are required.',
  ORGANIZATION_TYPE_UNKNOWN: 'The organization type is not registered.',
  TYPE_ASSIGNMENT_NOT_FOUND: 'The organization type assignment was not found.',
  PERSON_NOT_FOUND: 'The person was not found.',
  NOT_FOUND: 'The requested resource was not found.',
  FORBIDDEN: 'The action is not allowed.',
  UNAUTHENTICATED: 'The authentication session is invalid.',
  RATE_LIMITED: 'Too many requests.',
};

const rpcFailureCodes = Object.keys(rpcFailureStatus).sort(
  (left, right) => right.length - left.length,
);

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
    nested?.message,
  ].filter((candidate): candidate is string => typeof candidate === 'string');
};

const withRetryAfter = (
  error: AuthenticationError,
  retryAfterSeconds: number | undefined,
): AuthenticationError =>
  retryAfterSeconds === undefined ? error : { ...error, retryAfterSeconds };

const retryAfterValue = (value: string | null): number | undefined => {
  if (value === null || !/^\d+$/u.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 86_400 ? parsed : undefined;
};

export const rpcFailure = (
  value: unknown,
  status: number,
  retryAfterSeconds: number | undefined,
): AuthenticationError => {
  const match = rpcFailureCodes.find((code) =>
    errorCandidates(value).some((candidate) =>
      candidate.toUpperCase().includes(code),
    ),
  );
  if (match !== undefined) {
    return withRetryAfter(
      authError(
        rpcFailureStatus[match]!,
        match,
        rpcFailureMessage[match] ?? 'The relationship request was rejected.',
      ),
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
            ? authError(
                409,
                'CONFLICT',
                'The resource changed; reload and try again.',
              )
            : status === 429
              ? authError(429, 'RATE_LIMITED', 'Too many requests.')
              : authError(
                  503,
                  'DEPENDENCY_UNAVAILABLE',
                  'Identity persistence is unavailable.',
                );
  return withRetryAfter(fallback, retryAfterSeconds);
};

export const mapRelationshipFailure = (error: unknown): AuthenticationError => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'ok' in error &&
    error.ok === false
  )
    return error as AuthenticationError;
  if (error instanceof DOMException && error.name === 'AbortError') {
    return authError(
      504,
      'DEPENDENCY_TIMEOUT',
      'Identity persistence timed out.',
    );
  }
  return authError(
    503,
    'DEPENDENCY_UNAVAILABLE',
    'Identity persistence is temporarily unavailable.',
  );
};

export const relationshipHeaders = (
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

export const readBoundedJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (authEncoder.encode(text).byteLength > MAX_RESPONSE_BYTES) {
    throw authError(
      502,
      'DEPENDENCY_INVALID_RESPONSE',
      'Identity persistence returned an invalid response.',
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw authError(
      502,
      'DEPENDENCY_INVALID_RESPONSE',
      'Identity persistence returned an invalid response.',
    );
  }
};

const normalizeRpcPayload = (value: unknown): unknown =>
  Array.isArray(value) && value.length === 1 ? value[0] : value;

export const canonicalPayload = (value: unknown): unknown => {
  const normalized = normalizeRpcPayload(value);
  const record = asRecord(normalized);
  if (record === null || !('replayed' in record)) return normalized;
  const canonical = { ...record };
  delete canonical.replayed;
  return canonical;
};

export const replayId = (value: unknown, field: string): string | null => {
  const record = asRecord(normalizeRpcPayload(value));
  return record?.replayed === true && typeof record[field] === 'string'
    ? record[field]
    : null;
};

export const retryAfterFromResponse = (
  response: Response,
): number | undefined => retryAfterValue(response.headers.get('retry-after'));

export const invalidRelationshipResponse = (): AuthenticationError =>
  authError(
    502,
    'DEPENDENCY_INVALID_RESPONSE',
    'Identity persistence returned an invalid response.',
  );

export type RelationshipResult<T> = AuthenticationResult<T>;
