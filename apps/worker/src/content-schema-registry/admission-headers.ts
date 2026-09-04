import {
  CmsStrongEtagSchema,
  ContentSchemaRegistryListQuerySchema,
  type ContentSchemaRegistryListQuery,
} from './contracts';
import type {
  ContentSchemaRegistryError,
  ContentSchemaRegistryOperationId,
  ContentSchemaRegistryResult,
} from './types';
import { IDEMPOTENCY_PATTERN, invalid, issues } from './admission-common';

export const parseMutationHeaders = (
  request: Request,
  operationId: ContentSchemaRegistryOperationId,
): ContentSchemaRegistryResult<
  Readonly<{ idempotencyKey: string; ifMatch?: string }>
> => {
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey === null || !IDEMPOTENCY_PATTERN.test(idempotencyKey))
    return invalid('A valid Idempotency-Key is required.');
  const rawIfMatch = request.headers.get('if-match');
  const needsIfMatch = new Set([
    'CMS-03A-02',
    'CMS-03A-03',
    'CMS-03A-04',
    'CMS-03A-08',
  ]).has(operationId);
  if (
    needsIfMatch &&
    (rawIfMatch === null || !CmsStrongEtagSchema.safeParse(rawIfMatch).success)
  )
    return invalid('A valid strong If-Match version is required.');
  if (!needsIfMatch && rawIfMatch !== null)
    return invalid('If-Match is not accepted for this operation.');
  return {
    ok: true,
    value: {
      idempotencyKey,
      ...(rawIfMatch === null ? {} : { ifMatch: rawIfMatch.slice(1, -1) }),
    },
  };
};

export const parseQuery = (
  request: Request,
): ContentSchemaRegistryResult<ContentSchemaRegistryListQuery> => {
  const params = new URL(request.url).searchParams;
  const allowed = new Set([
    'resourceKind',
    'keyPrefix',
    'lifecycle',
    'state',
    'limit',
    'cursor',
    'sort',
    'direction',
  ]);
  const value: Record<string, unknown> = {};
  for (const key of new Set(params.keys())) {
    if (!allowed.has(key) || params.getAll(key).length !== 1)
      return invalid('The query parameters are invalid.');
    const raw = params.get(key);
    if (raw === null) return invalid('The query parameters are invalid.');
    value[key] = raw;
  }
  const parsed = ContentSchemaRegistryListQuerySchema.safeParse(value);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : invalid('The query parameters are invalid.', issues(parsed.error));
};

export const rejectReadMutationHeadersOrBody = async (
  request: Request,
): Promise<ContentSchemaRegistryError | null> => {
  if (request.headers.has('idempotency-key') || request.headers.has('if-match'))
    return invalid('Mutation headers are not accepted on protected reads.');
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 0)
    return invalid('Protected reads do not accept a request body.');
  try {
    const bytes = new Uint8Array(await request.clone().arrayBuffer());
    return bytes.byteLength === 0
      ? null
      : invalid('Protected reads do not accept a request body.');
  } catch {
    return invalid('Protected reads do not accept a request body.');
  }
};

export const rejectDetailQuery = (
  request: Request,
): ContentSchemaRegistryError | null =>
  new URL(request.url).searchParams.size === 0
    ? null
    : invalid('The detail route does not accept query parameters.');

export const checkOrigin = (
  request: Request,
  allowedOrigins: readonly string[],
): ContentSchemaRegistryError | null => {
  const origin = request.headers.get('origin');
  return origin === null || allowedOrigins.includes(origin)
    ? null
    : {
        ok: false,
        status: 403,
        code: 'FORBIDDEN',
        message: 'The request origin is not allowed.',
        details: {},
      };
};

export const csrfErrorIfCookie = (
  request: Request,
): ContentSchemaRegistryError | null => {
  const cookie = request.headers.get('cookie');
  if (cookie === null) return null;
  const parts = cookie.split(';').map((part) => part.trim());
  if (!parts.some((part) => part.startsWith('wj_session_ref='))) return null;
  const token = parts
    .find((part) => part.startsWith('wj_csrf='))
    ?.slice('wj_csrf='.length);
  return token !== undefined &&
    token !== '' &&
    token === request.headers.get('x-csrf-token')
    ? null
    : {
        ok: false,
        status: 403,
        code: 'FORBIDDEN',
        message: 'A valid CSRF token is required.',
        details: {},
      };
};
