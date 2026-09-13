import { authError } from '../authentication/boundary';
import { parseClientBindingIdHeader } from '../authentication/client-binding-header';
import { traceFor } from '../authentication/production-configuration';
import { ACCESS_COOKIE, readCookie } from '../authentication/production-cookie';
import type { AuthenticationSession } from '../authentication/types';

export type IdentityRpcRequestContext = Readonly<{
  request: Request;
  session: AuthenticationSession | null;
  idempotencyKey?: string;
}>;

export const identityRpcRequestHeaders = (
  context: IdentityRpcRequestContext,
): Readonly<Record<string, string>> => {
  const bindingId = parseClientBindingIdHeader(context.request);
  if (!bindingId.ok) throw bindingId;

  let authorization: Readonly<Record<string, string>> = {};
  if (context.session !== null) {
    const accessToken = readCookie(context.request, ACCESS_COOKIE);
    if (accessToken === null || accessToken.length === 0) {
      throw authError(
        401,
        'UNAUTHENTICATED',
        'The authentication session is invalid.',
      );
    }
    authorization = { authorization: `Bearer ${accessToken}` };
  }

  const trace = traceFor(context.request);
  return {
    ...authorization,
    ...(context.idempotencyKey === undefined
      ? {}
      : { 'idempotency-key': context.idempotencyKey }),
    'x-request-id': trace.requestId,
    'x-correlation-id': trace.correlationId,
    ...(bindingId.value === null
      ? {}
      : { 'x-client-binding-id': bindingId.value }),
  };
};
