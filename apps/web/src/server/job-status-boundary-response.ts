import {
  ApiErrorSchema,
  createRequestId,
  JobStatusTransportSchema,
  QuotedVersionSchema,
  RequestIdSchema,
  type JobStatusTransport,
} from '@wejammin/contracts';

import {
  JobStatusBoundaryError,
  type JobStatusAuthenticationResult,
  type JobStatusBoundaryErrorCode,
  type JobStatusBoundaryReadResult,
} from './job-status-boundary-types';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const requestIdFor = (request: Request): string => {
  const candidate = request.headers.get('x-request-id');
  return RequestIdSchema.safeParse(candidate).success
    ? RequestIdSchema.parse(candidate)
    : createRequestId(undefined);
};

export const ifNoneMatchFor = (request: Request): string | null => {
  const candidate = request.headers.get('if-none-match');
  return QuotedVersionSchema.safeParse(candidate).success
    ? QuotedVersionSchema.parse(candidate)
    : null;
};

export const errorResponse = (
  requestId: string,
  status: number,
  code: string,
  message: string,
  details: Record<string, unknown> = {},
  retryAfterSeconds: number | null = null,
): Response => {
  const body = ApiErrorSchema.parse({ code, details, message, requestId });
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    vary: 'Cookie',
    'x-request-id': requestId,
  });
  if (retryAfterSeconds !== null) {
    headers.set('retry-after', String(retryAfterSeconds));
  }
  return new Response(JSON.stringify(body), { status, headers });
};

export const dependencyError = (requestId: string): Response =>
  errorResponse(
    requestId,
    503,
    'DEPENDENCY_UNAVAILABLE',
    'The job status service is temporarily unavailable.',
  );

export const boundaryErrorResponse = (
  requestId: string,
  error: JobStatusBoundaryError,
): Response => {
  const responseFor = (
    status: number,
    code: JobStatusBoundaryErrorCode,
    message: string,
    details: Record<string, unknown> = {},
    retryAfterSeconds: number | null = null,
  ): Response =>
    errorResponse(requestId, status, code, message, details, retryAfterSeconds);

  switch (error.code) {
    case 'UNAUTHENTICATED':
      return responseFor(401, error.code, 'Authentication is required.');
    case 'NOT_FOUND':
      return responseFor(404, error.code, 'The requested job was not found.');
    case 'RATE_LIMITED':
      return responseFor(
        429,
        error.code,
        'Too many job status requests.',
        {},
        error.retryAfterSeconds,
      );
    case 'INTERNAL_ERROR':
      return responseFor(500, error.code, 'The job status could not be read.');
    case 'DEPENDENCY_UNAVAILABLE':
      return dependencyError(requestId);
  }
};

export const notModifiedResponse = (
  requestId: string,
  etag: string,
): Response =>
  new Response(null, {
    status: 304,
    headers: {
      'cache-control': 'no-store',
      etag,
      vary: 'Cookie',
      'x-request-id': requestId,
    },
  });

export const successResponse = (
  requestId: string,
  resource: JobStatusTransport,
): Response =>
  new Response(JSON.stringify(resource.data), {
    status: 200,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      etag: resource.etag,
      vary: 'Cookie',
      'x-request-id': requestId,
    },
  });

export const parseAuthentication = (
  value: unknown,
): JobStatusAuthenticationResult | null => {
  if (!isObject(value)) return null;
  if (value.kind === 'unauthenticated') return { kind: 'unauthenticated' };
  if (
    value.kind === 'authenticated' &&
    Object.hasOwn(value, 'session') &&
    value.session !== null &&
    value.session !== undefined
  ) {
    return { kind: 'authenticated', session: value.session };
  }
  return null;
};

export const parseReadResult = (
  value: unknown,
): JobStatusBoundaryReadResult | null => {
  if (value === null) return { kind: 'not_found' };
  const resource = JobStatusTransportSchema.safeParse(value);
  if (resource.success) return { kind: 'resource', resource: resource.data };
  if (!isObject(value) || typeof value.kind !== 'string') return null;
  if (value.kind === 'not_found') return { kind: 'not_found' };
  if (value.kind === 'dependency_error') return { kind: 'dependency_error' };
  if (value.kind === 'resource') {
    const parsed = JobStatusTransportSchema.safeParse(value.resource);
    return parsed.success ? { kind: 'resource', resource: parsed.data } : null;
  }
  if (value.kind === 'not_modified') {
    const etag = value.etag;
    return typeof etag === 'string' &&
      QuotedVersionSchema.safeParse(etag).success
      ? { kind: 'not_modified', etag }
      : null;
  }
  if (value.kind === 'rate_limited') {
    const retryAfterSeconds = value.retryAfterSeconds;
    return typeof retryAfterSeconds === 'number' &&
      Number.isSafeInteger(retryAfterSeconds) &&
      retryAfterSeconds >= 0
      ? { kind: 'rate_limited', retryAfterSeconds }
      : null;
  }
  return null;
};
