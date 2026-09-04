import {
  ActingContextBindingResponseSchema,
  ActingContextListResponseSchema,
  BindContextRequestSchema,
  IdentityPartyPathSchema,
} from '@wejammin/contracts';

import type { WorkerContext, WorkerDependencies } from '../index';
import { responseForAuthError } from '../authentication/boundary';
import {
  configureIdentityRoute,
  parseIdentityCommandHeaders,
  parseIdentityJsonBody,
  rejectUnexpectedIdentityQuery,
  requireIdentityCsrf,
} from './route-support';
import {
  execute,
  executePublic,
  pathError,
  rate,
  resolve,
} from './handler-support';
import type { RecoveryState } from './recovery';

export const readActingContexts = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureIdentityRoute(context, 'BE01b-12');
  const query = rejectUnexpectedIdentityQuery(context.req.raw, true);
  if (!query.ok) return responseForAuthError(context, query);
  const resolved = await resolve(context, dependencies);
  if (!resolved.ok) return responseForAuthError(context, resolved);
  const limited = await rate(context, dependencies, 'BE01b-12', resolved.value);
  if (limited !== null) return limited;
  const input = {
    request: context.req.raw,
    session: resolved.value,
    cursor: query.value.cursor,
  };
  const port = dependencies.identityAuthority?.readActingContexts;
  return execute(
    context,
    dependencies,
    state,
    'BE01b-12',
    {
      session: resolved.value,
      idempotencyKey: '',
      ifMatch: null,
      mutation: false,
    },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    ActingContextListResponseSchema,
    200,
  );
};

export const bindActingContext = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureIdentityRoute(context, 'BE01b-13');
  const body = await parseIdentityJsonBody(
    context.req.raw,
    BindContextRequestSchema,
  );
  if (!body.ok) return responseForAuthError(context, body);
  const headers = parseIdentityCommandHeaders(context.req.raw, false);
  if (!headers.ok) return responseForAuthError(context, headers);
  const csrf = await requireIdentityCsrf(context);
  if (csrf !== null) return csrf;
  const resolved = await resolve(context, dependencies);
  if (!resolved.ok) return responseForAuthError(context, resolved);
  const limited = await rate(context, dependencies, 'BE01b-13', resolved.value);
  if (limited !== null) return limited;
  const input = {
    ...body.value,
    request: context.req.raw,
    session: resolved.value,
    idempotencyKey: headers.value.idempotencyKey,
    ifMatch: null,
  };
  const port = dependencies.identityAuthority?.bindActingContext;
  return execute(
    context,
    dependencies,
    state,
    'BE01b-13',
    {
      session: resolved.value,
      idempotencyKey: headers.value.idempotencyKey,
      ifMatch: null,
      mutation: true,
    },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    ActingContextBindingResponseSchema,
    201,
  );
};

export const readPublicProjection = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureIdentityRoute(context, 'BE01b-18');
  const path = IdentityPartyPathSchema.safeParse({
    partyId: context.req.param('partyId'),
  });
  if (!path.success)
    return responseForAuthError(
      context,
      pathError('The party identifier is invalid.'),
    );
  const query = rejectUnexpectedIdentityQuery(context.req.raw);
  if (!query.ok) return responseForAuthError(context, query);
  const limited = await rate(context, dependencies, 'BE01b-18', null);
  if (limited !== null) return limited;
  const input = { request: context.req.raw, partyId: path.data.partyId };
  const port = dependencies.identityAuthority?.readPublicProjection;
  return executePublic(
    context,
    dependencies,
    state,
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
  );
};
