import {
  ApiErrorSchema,
  type JsonValue,
  type RequestId,
} from '@wejammin/contracts';

import { type RequestBoundaryResult } from './request-boundary-types';

export const withNoStore = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};

export const createSafeErrorResponse = (
  requestId: RequestId,
  error: Readonly<{
    code: string;
    status: number;
    message: string;
    details: Readonly<Record<string, JsonValue>>;
  }>,
): Response => {
  const safeMessage = [...error.message]
    .map((character) => {
      const codePoint = character.charCodeAt(0);
      return codePoint <= 0x1f || codePoint === 0x7f ? ' ' : character;
    })
    .join('')
    .slice(0, 500);
  const payload = ApiErrorSchema.parse({
    code: error.code,
    details: error.details,
    message: safeMessage,
    requestId,
  });
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-type': 'application/json',
    'x-request-id': requestId,
  });
  return new Response(JSON.stringify(payload), {
    headers,
    status: error.status,
  });
};

export const boundaryErrorResponse = (
  result: Extract<RequestBoundaryResult<unknown>, { ok: false }>,
): Response => createSafeErrorResponse(result.requestId, result.error);
