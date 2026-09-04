import {
  AliasResponseSchema,
  ChangeHandleRequestSchema,
  CreateAliasRequestSchema,
  CreateTransferOfferRequestSchema,
  IdentityAliasPathSchema,
  IdentityStrictEmptySchema,
  PatchAliasRequestSchema,
  TransferOfferResponseSchema,
} from '@wejammin/contracts';

import type { WorkerContext, WorkerDependencies } from '../index';
import { responseForAuthError } from '../authentication/boundary';
import type { AuthenticationSession } from '../authentication/types';
import {
  configureIdentityRoute,
  parseIdentityCommandHeaders,
  parseIdentityJsonBody,
  requireIdentityCsrf,
} from './route-support';
import { execute, pathError, rate, resolve } from './handler-support';
import type { RecoveryState } from './recovery';

type Prepared<T> = Readonly<{
  body: T;
  session: AuthenticationSession;
  idempotencyKey: string;
  ifMatch: string | null;
}>;

const prepare = async <T>(
  context: WorkerContext,
  dependencies: WorkerDependencies,
  operationId: Parameters<typeof configureIdentityRoute>[1],
  schema: Parameters<typeof parseIdentityJsonBody<T>>[1],
  ifMatch: boolean,
): Promise<
  | Readonly<{ ok: true; value: Prepared<T> }>
  | Readonly<{ ok: false; response: Response }>
> => {
  const body = await parseIdentityJsonBody(context.req.raw, schema);
  if (!body.ok)
    return { ok: false, response: responseForAuthError(context, body) };
  const headers = parseIdentityCommandHeaders(context.req.raw, ifMatch);
  if (!headers.ok)
    return { ok: false, response: responseForAuthError(context, headers) };
  const csrf = await requireIdentityCsrf(context);
  if (csrf !== null) return { ok: false, response: csrf };
  const resolved = await resolve(context, dependencies);
  if (!resolved.ok)
    return { ok: false, response: responseForAuthError(context, resolved) };
  const limited = await rate(
    context,
    dependencies,
    operationId,
    resolved.value,
  );
  if (limited !== null) return { ok: false, response: limited };
  return {
    ok: true,
    value: {
      body: body.value,
      session: resolved.value,
      idempotencyKey: headers.value.idempotencyKey,
      ifMatch: ifMatch ? headers.value.ifMatch! : null,
    },
  };
};

const aliasPath = (context: WorkerContext) =>
  IdentityAliasPathSchema.safeParse({ aliasId: context.req.param('aliasId') });

export const createAlias = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureIdentityRoute(context, 'BE01b-05');
  const prepared = await prepare(
    context,
    dependencies,
    'BE01b-05',
    CreateAliasRequestSchema,
    false,
  );
  if (!prepared.ok) return prepared.response;
  const input = {
    ...prepared.value.body,
    request: context.req.raw,
    session: prepared.value.session,
    idempotencyKey: prepared.value.idempotencyKey,
    ifMatch: null,
  };
  const port = dependencies.identityAuthority?.createAlias;
  return execute(
    context,
    dependencies,
    state,
    'BE01b-05',
    { ...prepared.value, mutation: true },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    AliasResponseSchema,
    201,
  );
};

export const patchAlias = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureIdentityRoute(context, 'BE01b-06');
  const path = aliasPath(context);
  if (!path.success)
    return responseForAuthError(
      context,
      pathError('The alias identifier is invalid.'),
    );
  const prepared = await prepare(
    context,
    dependencies,
    'BE01b-06',
    PatchAliasRequestSchema,
    true,
  );
  if (!prepared.ok) return prepared.response;
  const input = {
    aliasId: path.data.aliasId,
    request: context.req.raw,
    session: prepared.value.session,
    idempotencyKey: prepared.value.idempotencyKey,
    ifMatch: prepared.value.ifMatch!,
    ...(prepared.value.body.displayName === undefined
      ? {}
      : { displayName: prepared.value.body.displayName }),
    ...(prepared.value.body.publicLinkState === undefined
      ? {}
      : { publicLinkState: prepared.value.body.publicLinkState }),
  };
  const port = dependencies.identityAuthority?.patchAlias;
  return execute(
    context,
    dependencies,
    state,
    'BE01b-06',
    { ...prepared.value, mutation: true },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    AliasResponseSchema,
    200,
  );
};

export const changeHandle = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureIdentityRoute(context, 'BE01b-07');
  const path = aliasPath(context);
  if (!path.success)
    return responseForAuthError(
      context,
      pathError('The alias identifier is invalid.'),
    );
  const prepared = await prepare(
    context,
    dependencies,
    'BE01b-07',
    ChangeHandleRequestSchema,
    true,
  );
  if (!prepared.ok) return prepared.response;
  const input = {
    ...prepared.value.body,
    aliasId: path.data.aliasId,
    request: context.req.raw,
    session: prepared.value.session,
    idempotencyKey: prepared.value.idempotencyKey,
    ifMatch: prepared.value.ifMatch!,
  };
  const port = dependencies.identityAuthority?.changeHandle;
  return execute(
    context,
    dependencies,
    state,
    'BE01b-07',
    { ...prepared.value, mutation: true },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    AliasResponseSchema,
    200,
  );
};

export const retireAlias = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureIdentityRoute(context, 'BE01b-08');
  const path = aliasPath(context);
  if (!path.success)
    return responseForAuthError(
      context,
      pathError('The alias identifier is invalid.'),
    );
  const prepared = await prepare(
    context,
    dependencies,
    'BE01b-08',
    IdentityStrictEmptySchema,
    true,
  );
  if (!prepared.ok) return prepared.response;
  const input = {
    aliasId: path.data.aliasId,
    request: context.req.raw,
    session: prepared.value.session,
    idempotencyKey: prepared.value.idempotencyKey,
    ifMatch: prepared.value.ifMatch!,
  };
  const port = dependencies.identityAuthority?.retireAlias;
  return execute(
    context,
    dependencies,
    state,
    'BE01b-08',
    { ...prepared.value, mutation: true },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    AliasResponseSchema,
    200,
  );
};

export const createTransferOffer = async (
  context: WorkerContext,
  dependencies: WorkerDependencies,
  state: RecoveryState,
): Promise<Response> => {
  configureIdentityRoute(context, 'BE01b-09');
  const path = aliasPath(context);
  if (!path.success)
    return responseForAuthError(
      context,
      pathError('The alias identifier is invalid.'),
    );
  const prepared = await prepare(
    context,
    dependencies,
    'BE01b-09',
    CreateTransferOfferRequestSchema,
    false,
  );
  if (!prepared.ok) return prepared.response;
  const input = {
    ...prepared.value.body,
    aliasId: path.data.aliasId,
    request: context.req.raw,
    session: prepared.value.session,
    idempotencyKey: prepared.value.idempotencyKey,
    ifMatch: null,
  };
  const port = dependencies.identityAuthority?.createTransferOffer;
  return execute(
    context,
    dependencies,
    state,
    'BE01b-09',
    { ...prepared.value, mutation: true },
    port === undefined
      ? undefined
      : (signal) => port(input, context.env, signal),
    TransferOfferResponseSchema,
    201,
  );
};
