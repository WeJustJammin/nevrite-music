import {
  ApiErrorSchema,
  AuthorizationStartSchema,
  JobStatusSchema,
  LoginMethodsResourceSchema,
  MergeCaseResourceSchema,
} from '@wejammin/contracts';

import {
  type JobStatus,
  type LoginMethodsResource,
  type ProviderCode,
  type SchemaLike,
  type UiError,
  type UnlinkReason,
} from './types';

let idempotencyCounter = 0;

const newIdempotencyKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return `slice02-${crypto.randomUUID()}`;
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return `slice02-${Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')}`;
  }
  idempotencyCounter += 1;
  return `slice02-${Date.now().toString(36)}-${idempotencyCounter.toString(36)}`;
};

const mutationHeaders = (version: string): Headers => {
  const headers = new Headers({
    accept: 'application/json',
    'content-type': 'application/json',
    'idempotency-key': newIdempotencyKey(),
    'if-match': version,
  });
  if (typeof document !== 'undefined') {
    const cookie = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('wj_csrf='));
    const token = cookie?.slice('wj_csrf='.length);
    if (token !== undefined && token !== '') headers.set('x-csrf-token', token);
  }
  return headers;
};

const errorForResponse = async (
  response: Response,
  fallbackRequestId: string,
): Promise<UiError> => {
  const body: unknown = await response.json().catch(() => null);
  const parsed = ApiErrorSchema.safeParse(body);
  const retryAfter = Number(response.headers.get('retry-after'));
  return {
    code: parsed.success ? parsed.data.code : `HTTP_${response.status}`,
    requestId: parsed.success ? parsed.data.requestId : fallbackRequestId,
    retryAfterSeconds:
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  };
};

const schemaResponse = async <T>(
  response: Response,
  schema: SchemaLike<T>,
  fallbackRequestId: string,
): Promise<T> => {
  if (!response.ok) throw await errorForResponse(response, fallbackRequestId);
  const body: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw {
      code: 'INVALID_RESPONSE',
      requestId: fallbackRequestId,
      retryAfterSeconds: null,
    } satisfies UiError;
  }
  return parsed.data;
};

type MutationResult<T> = Readonly<{ data: T; etag: string | null }>;

const mutate = async <T>(
  url: string,
  method: 'DELETE' | 'POST',
  body: unknown,
  version: string,
  schema: SchemaLike<T>,
  requestId: string,
): Promise<MutationResult<T>> => {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: mutationHeaders(version),
    body: JSON.stringify(body),
  });
  return {
    data: await schemaResponse(response, schema, requestId),
    etag: response.headers.get('etag'),
  };
};

export const readLoginMethods = async (
  requestId: string,
): Promise<MutationResult<LoginMethodsResource>> => {
  const response = await fetch('/api/v1/account/login-methods', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
  return {
    data: await schemaResponse(response, LoginMethodsResourceSchema, requestId),
    etag: response.headers.get('etag'),
  };
};

export const startLink = (
  provider: ProviderCode,
  version: string,
  returnTo: string,
  requestId: string,
) =>
  mutate(
    `/api/v1/account/login-methods/${encodeURIComponent(provider)}/link-intents`,
    'POST',
    { returnTo },
    version,
    AuthorizationStartSchema,
    requestId,
  );

export const unlink = (
  identityId: string,
  version: string,
  reason: UnlinkReason,
  requestId: string,
) =>
  mutate(
    `/api/v1/account/login-methods/${encodeURIComponent(identityId)}`,
    'DELETE',
    { reason },
    version,
    LoginMethodsResourceSchema,
    requestId,
  );

export const createMerge = (
  version: string,
  returnTo: string,
  requestId: string,
) =>
  mutate(
    '/api/v1/account-merges',
    'POST',
    { returnTo },
    version,
    MergeCaseResourceSchema,
    requestId,
  );

export const proveMerge = (
  mergeId: string,
  version: string,
  provider: ProviderCode,
  returnTo: string,
  requestId: string,
) =>
  mutate(
    `/api/v1/account-merges/${encodeURIComponent(mergeId)}/prove-duplicate`,
    'POST',
    { provider, returnTo },
    version,
    AuthorizationStartSchema,
    requestId,
  );

export const confirmMerge = (
  mergeId: string,
  version: string,
  conflictPlanVersion: string,
  acknowledgements: readonly string[],
  requestId: string,
) =>
  mutate(
    `/api/v1/account-merges/${encodeURIComponent(mergeId)}/confirm`,
    'POST',
    { conflictPlanVersion, acknowledgements },
    version,
    JobStatusSchema,
    requestId,
  );

export type { JobStatus, MutationResult };
