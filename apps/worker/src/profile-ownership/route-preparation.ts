import type { WorkerContext, WorkerDependencies } from '../index';
import { responseForAuthError } from '../authentication/boundary';
import type { AuthenticationSession } from '../authentication/types';
import {
  enforceProfileRate,
  parseProfileBody,
  parseProfileCommandHeaders,
  parseProfileQuery,
  requireProfileCsrf,
  requireProfileSession,
  type SchemaLike,
} from './route-support';
import type { ProfilePortInput } from './types';
import type { ActiveOperation } from './route-types';

export type PreparedCommand = Readonly<{
  body: Readonly<Record<string, unknown>>;
  idempotencyKey: string;
  ifMatch?: string;
  session: AuthenticationSession | null;
}>;

type Preparation =
  Readonly<{ value: PreparedCommand }> | Readonly<{ response: Response }>;

export const prepare = async <T>(
  context: WorkerContext,
  operationId: ActiveOperation,
  schema: SchemaLike<T>,
  auth: WorkerDependencies['auth'],
  authMode: 'public' | 'session' | 'session_step_up',
  ifMatchRequired: boolean,
): Promise<Preparation> => {
  const queryError = parseProfileQuery(context.req.raw);
  if (queryError !== null)
    return { response: responseForAuthError(context, queryError) };
  const body = await parseProfileBody(context.req.raw, schema);
  if (!body.ok) return { response: responseForAuthError(context, body) };
  const headers = parseProfileCommandHeaders(context.req.raw, ifMatchRequired);
  if (!headers.ok) {
    return { response: responseForAuthError(context, headers) };
  }
  let session: AuthenticationSession | null = null;
  if (authMode !== 'public') {
    const resolved = await requireProfileSession(
      context,
      auth,
      authMode === 'session_step_up',
    );
    if (!resolved.ok)
      return { response: responseForAuthError(context, resolved) };
    session = resolved.value;
    const csrfError = await requireProfileCsrf(context);
    if (csrfError !== null) return { response: csrfError };
  }
  const rateError = await enforceProfileRate(
    context,
    auth,
    operationId,
    session,
  );
  if (rateError !== null) return { response: rateError };
  return {
    value: {
      body: body.value as Readonly<Record<string, unknown>>,
      idempotencyKey: headers.value.idempotencyKey,
      ...(headers.value.ifMatch === undefined
        ? {}
        : { ifMatch: headers.value.ifMatch }),
      session,
    },
  };
};

export const inputFor = (
  context: WorkerContext,
  operationId: ActiveOperation,
  prepared: PreparedCommand,
  path?: Readonly<Record<string, string>>,
): ProfilePortInput => ({
  operationId,
  request: context.req.raw,
  body: prepared.body,
  idempotencyKey: prepared.idempotencyKey,
  ...(prepared.ifMatch === undefined ? {} : { ifMatch: prepared.ifMatch }),
  ...(prepared.session === null ? {} : { session: prepared.session }),
  ...(path === undefined ? {} : { path }),
});
