import { ApiErrorSchema } from '@wejammin/contracts';

import { ActingContextRequestError } from './acting-context-errors';

const MAX_API_ERROR_BODY_BYTES = 16_384;

export class ActiveSessionReadError extends Error {
  readonly recoverableContextBinding: boolean;

  constructor(recoverableContextBinding: boolean) {
    super('The current context could not be verified.');
    this.name = 'ActiveSessionReadError';
    this.recoverableContextBinding = recoverableContextBinding;
  }
}

export const readBoundedApiError = async (response: Response) => {
  const contentLength = Number(response.headers.get('content-length'));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_API_ERROR_BODY_BYTES
  )
    return null;
  const reader = response.body?.getReader();
  if (reader === undefined) return null;
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_API_ERROR_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const parsed = ApiErrorSchema.safeParse(body);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const isRecoverableSessionContextError = (
  status: number,
  code: string,
): boolean =>
  (status === 404 && code === 'CONTEXT_NOT_FOUND') ||
  (status === 403 &&
    (code === 'CONTEXT_REVOKED' || code === 'CONTEXT_RECONFIRM_REQUIRED'));

export const csrfTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('wj_csrf='));
  if (cookie === undefined) return null;
  try {
    return decodeURIComponent(cookie.slice('wj_csrf='.length));
  } catch {
    return null;
  }
};

export const idempotencyKey = (): string | null => {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return null;
  }
};

export const contextChangeError = (
  status: number,
): ActingContextRequestError => {
  if (status === 401)
    return new ActingContextRequestError(
      'Your session expired. Sign in before changing context.',
    );
  if (status === 403)
    return new ActingContextRequestError(
      'The server denied this context change. Your current selection was not changed.',
    );
  if (status === 409)
    return new ActingContextRequestError(
      'This context changed. Refresh the list and try again.',
    );
  if (status === 404 || status === 422)
    return new ActingContextRequestError(
      'This context is no longer available. Your current selection was not changed.',
    );
  return new ActingContextRequestError(
    'The context may have changed, but the server could not verify it. Reload before continuing.',
    status >= 500,
  );
};
