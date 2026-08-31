import { createRequestId, type RequestId } from '@wejammin/contracts';

import {
  MAX_JSON_BODY_BYTES,
  type RequestBoundaryResult,
} from './request-boundary-types';

export type IssueLike = Readonly<{
  path: readonly PropertyKey[];
  code: string;
  message: string;
}>;

export const requestIdFor = (request: Request): RequestId =>
  createRequestId(request.headers.get('x-request-id') ?? undefined);

export const jsonPointer = (path: readonly PropertyKey[]): string => {
  if (path.length === 0) return '/';
  return `/${path
    .map((segment) =>
      String(segment).replaceAll('~', '~0').replaceAll('/', '~1'),
    )
    .join('/')}`;
};

export const issueDetails = (
  issues: readonly IssueLike[],
): Readonly<Record<string, import('@wejammin/contracts').JsonValue>> => ({
  violations: issues.slice(0, 50).map((issue) => ({
    code: issue.code.slice(0, 64),
    message: issue.message.slice(0, 300),
    path: jsonPointer(issue.path),
  })),
});

export const invalid = <T>(
  requestId: RequestId,
  message: string,
  details: Readonly<
    Record<string, import('@wejammin/contracts').JsonValue>
  > = {},
  status: 400 | 422 = 400,
): RequestBoundaryResult<T> => ({
  error: {
    code: status === 422 ? 'VALIDATION_FAILED' : 'INVALID_REQUEST',
    details,
    message,
    status,
  },
  ok: false,
  requestId,
});

export const unsupportedMediaType = <T>(
  requestId: RequestId,
): RequestBoundaryResult<T> => ({
  error: {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    details: { allowedMediaTypes: ['application/json'] },
    message: 'The request must use application/json.',
    status: 415,
  },
  ok: false,
  requestId,
});

export const payloadTooLarge = <T>(
  requestId: RequestId,
): RequestBoundaryResult<T> => ({
  error: {
    code: 'PAYLOAD_TOO_LARGE',
    details: { maxBytes: MAX_JSON_BODY_BYTES },
    message: 'The request body is too large.',
    status: 413,
  },
  ok: false,
  requestId,
});

export const parseQueryValues = (
  request: Request,
): RequestBoundaryResult<Record<string, string>> => {
  const url = new URL(request.url);
  const values: Record<string, string> = {};
  const seen = new Set<string>();
  url.searchParams.forEach((value, key) => {
    if (seen.has(key)) return;
    seen.add(key);
    values[key] = value;
  });

  const duplicate = [...url.searchParams.keys()].find(
    (key, index, keys) => keys.indexOf(key) !== index,
  );
  if (duplicate !== undefined) {
    return invalid(
      requestIdFor(request),
      'The request contains a repeated query parameter.',
      {
        violations: [
          {
            code: 'duplicate',
            message: 'A query parameter may appear only once.',
            path: `/query/${duplicate}`,
          },
        ],
      },
    );
  }
  return { ok: true, requestId: requestIdFor(request), value: values };
};

export const isJsonContentType = (value: string | null): boolean => {
  if (value === null) return false;
  const mediaType = value.split(';', 1)[0]?.trim().toLowerCase();
  return mediaType === 'application/json';
};

export const contentLengthExceedsLimit = (request: Request): boolean => {
  const raw = request.headers.get('content-length');
  if (raw === null || !/^[0-9]+$/.test(raw)) return false;
  return Number(raw) > MAX_JSON_BODY_BYTES;
};

export const normalizedHeaderValue = (
  value: string | null,
): string | undefined => {
  if (value === null) return undefined;
  // Preserve noncanonical whitespace so the strict header schema rejects it.
  return value;
};
