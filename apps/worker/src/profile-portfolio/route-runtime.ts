import type { WorkerContext, WorkerDependencies } from '../index';
import { authError, responseForAuthError } from '../authentication/boundary';
import type { AuthenticationSession } from '../authentication/types';
import { responseVersion } from './events';
import {
  cacheFor,
  cloneableErrorResponse,
  statusFor,
  type ActiveProfilePortfolioOperation,
  type Outcome,
  type ProfilePortfolioPortName,
} from './runtime-helpers';
import { createProfilePortfolioPortRunner } from './runtime-port';
import {
  checkProfilePortfolioCsrf,
  checkSameOrigin,
  configureProfilePortfolioRoute,
  enforceProfilePortfolioRate,
  parseProfileBody,
  parseProfileCommandHeaders,
  parseProfileQuery,
  producerHeadersValid,
  requireProfilePortfolioSession,
  type SchemaLike,
} from './route-support';

export type {
  ActiveProfilePortfolioOperation,
  ProfilePortfolioPortName,
} from './runtime-helpers';

export type ProfilePortfolioRouteRuntime = Readonly<{
  read: <T>(
    context: WorkerContext,
    operationId: ActiveProfilePortfolioOperation,
    portName: ProfilePortfolioPortName,
    path: Readonly<Record<string, string>>,
    schema: SchemaLike<T>,
    allowedQuery: readonly string[],
    defaults?: Readonly<Record<string, string>>,
    protectedRead?: boolean,
  ) => Promise<Response>;
  command: <T>(
    context: WorkerContext,
    operationId: ActiveProfilePortfolioOperation,
    portName: ProfilePortfolioPortName,
    path: Readonly<Record<string, string>>,
    schema: SchemaLike<T>,
    ifMatchRequired?: boolean,
  ) => Promise<Response>;
  producer: <T>(
    context: WorkerContext,
    operationId: 'PRF-PROF-10',
    portName: 'ingestProfileFactObservation',
    schema: SchemaLike<T>,
  ) => Promise<Response>;
}>;

export const createProfilePortfolioRouteRuntime = (
  dependencies: WorkerDependencies,
): ProfilePortfolioRouteRuntime => {
  const run = createProfilePortfolioPortRunner(dependencies);
  const send = (
    context: WorkerContext,
    outcome: Outcome,
    operationId: ActiveProfilePortfolioOperation,
  ): Response => {
    if (!outcome.ok) {
      const response = cloneableErrorResponse(
        responseForAuthError(context, {
          ...outcome,
          ...(outcome.code === 'DEPENDENCY_UNAVAILABLE' &&
          outcome.retryAfterSeconds === undefined
            ? { retryAfterSeconds: 5 }
            : {}),
        }),
      );
      context.res = response;
      return response;
    }
    context.header('cache-control', cacheFor(operationId));
    const version = responseVersion(outcome.value);
    if (version !== null) context.header('etag', `"${version}"`);
    return context.json(
      outcome.value as Record<string, unknown>,
      statusFor(operationId),
    );
  };

  const read: ProfilePortfolioRouteRuntime['read'] = async (
    context,
    operationId,
    portName,
    path,
    schema,
    allowedQuery,
    defaults = {},
    protectedRead = false,
  ) => {
    configureProfilePortfolioRoute(context, operationId);
    const origin = checkSameOrigin(context);
    if (!origin.ok) return responseForAuthError(context, origin);
    const query = parseProfileQuery(
      context.req.raw,
      schema,
      allowedQuery,
      defaults,
    );
    if (!query.ok) return responseForAuthError(context, query);
    let session: AuthenticationSession | undefined;
    if (protectedRead) {
      const resolved = await requireProfilePortfolioSession(
        context,
        dependencies.auth,
      );
      if (!resolved.ok) return responseForAuthError(context, resolved);
      session = resolved.value;
    }
    const rate = await enforceProfilePortfolioRate(
      context,
      operationId,
      dependencies.auth,
      session ?? null,
    );
    if (rate !== null) return rate;
    return send(
      context,
      await run(context, operationId, portName, {
        operationId,
        request: context.req.raw,
        path,
        query: query.value as Readonly<Record<string, unknown>>,
        ...(session === undefined ? {} : { session }),
      }),
      operationId,
    );
  };

  const command: ProfilePortfolioRouteRuntime['command'] = async (
    context,
    operationId,
    portName,
    path,
    schema,
    ifMatchRequired = true,
  ) => {
    configureProfilePortfolioRoute(context, operationId);
    const origin = checkSameOrigin(context);
    if (!origin.ok) return responseForAuthError(context, origin);
    const body = await parseProfileBody(context.req.raw, schema);
    if (!body.ok) return responseForAuthError(context, body);
    const headers = parseProfileCommandHeaders(
      context.req.raw,
      ifMatchRequired,
    );
    if (!headers.ok) return responseForAuthError(context, headers);
    const resolved = await requireProfilePortfolioSession(
      context,
      dependencies.auth,
    );
    if (!resolved.ok) return responseForAuthError(context, resolved);
    const csrf = await checkProfilePortfolioCsrf(context);
    if (!csrf.ok) return responseForAuthError(context, csrf);
    const rate = await enforceProfilePortfolioRate(
      context,
      operationId,
      dependencies.auth,
      resolved.value,
    );
    if (rate !== null) return rate;
    return send(
      context,
      await run(context, operationId, portName, {
        operationId,
        request: context.req.raw,
        path,
        body: body.value as Readonly<Record<string, unknown>>,
        idempotencyKey: headers.value.idempotencyKey,
        ...(headers.value.ifMatch === undefined
          ? {}
          : { ifMatch: headers.value.ifMatch }),
        session: resolved.value,
      }),
      operationId,
    );
  };

  const producer: ProfilePortfolioRouteRuntime['producer'] = async (
    context,
    operationId,
    portName,
    schema,
  ) => {
    configureProfilePortfolioRoute(context, operationId);
    if (!producerHeadersValid(context.req.raw))
      return responseForAuthError(
        context,
        authError(
          401,
          'PRODUCER_AUTH_FAILED',
          'Producer authentication failed.',
        ),
      );
    const origin = checkSameOrigin(context);
    if (!origin.ok) return responseForAuthError(context, origin);
    if (new URL(context.req.url).searchParams.size !== 0)
      return responseForAuthError(
        context,
        authError(400, 'INVALID_REQUEST', 'Query parameters are not accepted.'),
      );
    const body = await parseProfileBody(context.req.raw, schema);
    if (!body.ok) return responseForAuthError(context, body);
    const headers = parseProfileCommandHeaders(context.req.raw, false);
    if (!headers.ok) return responseForAuthError(context, headers);
    const rate = await enforceProfilePortfolioRate(
      context,
      operationId,
      dependencies.auth,
      null,
    );
    if (rate !== null) return rate;
    return send(
      context,
      await run(context, operationId, portName, {
        operationId,
        request: context.req.raw,
        body: body.value as Readonly<Record<string, unknown>>,
        idempotencyKey: headers.value.idempotencyKey,
      }),
      operationId,
    );
  };

  return { read, command, producer };
};
