import type { WorkerContext } from '../index';
import { authError, verifySameOriginCsrf } from '../authentication/boundary';
import type { AuthenticationResult } from '../authentication/types';

export const checkSameOrigin = (
  context: WorkerContext,
): AuthenticationResult<null> => {
  const origin = context.req.header('origin');
  return origin === undefined || origin === new URL(context.req.url).origin
    ? { ok: true, value: null }
    : authError(403, 'FORBIDDEN', 'The request origin is not allowed.');
};

export const producerHeadersValid = (request: Request): boolean => {
  const producer = request.headers.get('x-producer-id');
  const signature = request.headers.get('x-producer-signature');
  return (
    producer !== null &&
    /^[a-z][a-z0-9_]{2,31}$/u.test(producer) &&
    signature !== null &&
    /^[A-Za-z0-9._-]{16,256}$/u.test(signature)
  );
};

const hasOpaqueDoubleSubmitToken = (request: Request): boolean => {
  const token = /(?:^|;\s*)wj_csrf=([^;\s]+)/u.exec(
    request.headers.get('cookie') ?? '',
  )?.[1];
  return (
    token !== undefined &&
    !token.includes('.') &&
    /^[A-Za-z0-9_-]{1,256}$/u.test(token) &&
    token === request.headers.get('x-csrf-token')
  );
};

export const checkProfilePortfolioCsrf = async (
  context: WorkerContext,
): Promise<AuthenticationResult<null>> => {
  const error = await verifySameOriginCsrf(context.req.raw);
  if (error === null) return { ok: true, value: null };
  const request = context.req.raw;
  const origin = request.headers.get('origin');
  return (origin === null || origin === new URL(request.url).origin) &&
    hasOpaqueDoubleSubmitToken(request)
    ? { ok: true, value: null }
    : error;
};
