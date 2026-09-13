import { ActingContextBindingResponseSchema } from '@wejammin/contracts';
import type { ActingContextBindingResponse } from '@wejammin/contracts';

import {
  addClientBindingIdHeader,
  getClientBindingId,
} from '../../lib/client-binding';
import { ActingContextRequestError } from './acting-context-errors';
import {
  contextChangeError,
  csrfTokenFromCookie,
  idempotencyKey,
} from './acting-context-request-support';

export const bindActingContext = async (
  contextId: string,
): Promise<ActingContextBindingResponse> => {
  const clientBindingId = await getClientBindingId();
  const csrfToken = csrfTokenFromCookie();
  const key = idempotencyKey();
  if (clientBindingId === null || csrfToken === null || key === null) {
    throw new Error(
      'This tab cannot confirm a context change. Reload the page and try again.',
    );
  }
  const endpoint = '/api/v1/me/acting-context-bindings';
  const init = await addClientBindingIdHeader(endpoint, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': key,
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify({
      contextId,
      deliberateConfirmation: true,
      clientBindingId,
    }),
  });
  if (
    new Headers(init.headers).get('x-client-binding-id') !== clientBindingId
  ) {
    throw new Error(
      'This tab could not confirm a context change. Your current selection was not changed.',
    );
  }
  let response: Response;
  try {
    response = await fetch(endpoint, init);
  } catch {
    throw new ActingContextRequestError(
      'The context change may have reached the server, but its result could not be verified. Reload before continuing.',
      true,
    );
  }
  if (!response.ok) throw contextChangeError(response.status);
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw contextChangeError(502);
  }
  const parsed = ActingContextBindingResponseSchema.safeParse(value);
  if (!parsed.success)
    throw new ActingContextRequestError(
      'The context change may have reached the server, but its result could not be verified. Reload before continuing.',
      true,
    );
  return parsed.data;
};
