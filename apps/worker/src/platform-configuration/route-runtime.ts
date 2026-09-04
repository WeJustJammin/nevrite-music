import {
  Cfg05a01DefinitionResponseSchema,
  Cfg05a02EffectiveValueResponseSchema,
  Cfg05a03ChangeResponseSchema,
  Cfg05a04ChangeActionResponseSchema,
} from '@wejammin/contracts';

import type { WorkerApp, WorkerContext, WorkerDependencies } from '../index';
import { registerAdminWorkspaceRoutes } from './admin-route-runtime';
import { authError, responseForAuthError } from '../authentication/boundary';
import type { AuthenticationSession } from '../authentication/types';
import { createPlatformConfigurationPortRunner } from './runtime-port';
import {
  checkConfigurationSameOrigin,
  configurationBodySchemas,
  configurationOperation,
  configurationPathSchemas,
  bindEffectiveQueryScope,
  bindMutationScope,
  csrfIfCookie,
  enforceConfigurationRate,
  hasServiceConsumerHeaders,
  parseConfigurationBody,
  parseConfigurationCommandHeaders,
  parseEffectiveQuery,
  resolveReleasePrincipal,
  resolveServiceConsumer,
} from './route-support';
import { parseRoutePath, send, sessionWithRate } from './route-runtime-support';
import type { ConfigurationServiceConsumer } from './types';

export type PlatformConfigurationRouteRuntime = Readonly<{
  register: (context: WorkerContext) => Promise<Response>;
  effective: (context: WorkerContext) => Promise<Response>;
  propose: (context: WorkerContext) => Promise<Response>;
  action: (context: WorkerContext) => Promise<Response>;
}>;

export const createPlatformConfigurationRouteRuntime = (
  dependencies: WorkerDependencies,
): PlatformConfigurationRouteRuntime => {
  const runner = createPlatformConfigurationPortRunner(dependencies);
  const auth = dependencies.auth;
  const configuration = dependencies.platformConfiguration;

  const register = async (context: WorkerContext): Promise<Response> => {
    const operationId = 'CFG-05A-01' as const;
    configurationOperation(context, operationId);
    const origin = checkConfigurationSameOrigin(context);
    if (!origin.ok) return responseForAuthError(context, origin);
    const body = await parseConfigurationBody(
      context.req.raw,
      configurationBodySchemas.register,
    );
    if (!body.ok) return responseForAuthError(context, body);
    const headers = parseConfigurationCommandHeaders(context.req.raw);
    if (!headers.ok) return responseForAuthError(context, headers);
    const principal = await resolveReleasePrincipal(
      context,
      configuration?.resolveReleasePrincipal,
    );
    if (!principal.ok) return responseForAuthError(context, principal);
    const rate = await enforceConfigurationRate(
      context,
      operationId,
      auth,
      null,
      {
        principalId: principal.value.principalId,
        consumerKey: 'registry.release',
      },
    );
    if (rate !== null) return rate;
    return send(
      context,
      await runner.run(
        context,
        operationId,
        'registerDefinition',
        {
          operationId,
          request: context.req.raw,
          body: body.value as Readonly<Record<string, unknown>>,
          idempotencyKey: headers.value.idempotencyKey,
          servicePrincipalId: principal.value.principalId,
        },
        Cfg05a01DefinitionResponseSchema,
      ),
      operationId,
    );
  };

  const effective = async (context: WorkerContext): Promise<Response> => {
    const operationId = 'CFG-05A-02' as const;
    configurationOperation(context, operationId);
    const origin = checkConfigurationSameOrigin(context);
    if (!origin.ok) return responseForAuthError(context, origin);
    const path = parseRoutePath(
      configurationPathSchemas.key,
      context.req.param('key'),
    );
    if (!path.ok) return responseForAuthError(context, path);
    let query = parseEffectiveQuery(context.req.raw, path.value);
    if (!query.ok) return responseForAuthError(context, query);
    const serviceAttempt = hasServiceConsumerHeaders(context.req.raw);
    let session: AuthenticationSession | undefined;
    let serviceConsumer: ConfigurationServiceConsumer | null = null;
    let servicePrincipalId: string | undefined;
    let serviceConsumerKey: string | undefined;
    if (serviceAttempt) {
      const service = await resolveServiceConsumer(
        context,
        configuration?.resolveServiceConsumer,
      );
      if (!service.ok) return responseForAuthError(context, service);
      const queryRecord = query.value as Readonly<Record<string, unknown>>;
      if (queryRecord.consumerKey !== service.value.consumerKey)
        return responseForAuthError(
          context,
          authError(
            403,
            'FORBIDDEN',
            'The service consumer is not allowed for this key.',
          ),
        );
      servicePrincipalId = service.value.principalId;
      serviceConsumerKey = service.value.consumerKey;
      serviceConsumer = service.value;
    } else {
      const resolved = await sessionWithRate(context, operationId, auth, false);
      if (resolved.rate !== null) return resolved.rate;
      session = resolved.session;
      const bound = bindEffectiveQueryScope(
        query.value as Readonly<Record<string, unknown>>,
        session,
      );
      if (!bound.ok) return responseForAuthError(context, bound);
      query = bound;
    }
    if (serviceConsumer !== null) {
      const rate = await enforceConfigurationRate(
        context,
        operationId,
        auth,
        null,
        serviceConsumer,
      );
      if (rate !== null) return rate;
    }
    return send(
      context,
      await runner.run(
        context,
        operationId,
        'resolveEffectiveValue',
        {
          operationId,
          request: context.req.raw,
          path: { key: path.value },
          query: query.value as Readonly<Record<string, unknown>>,
          ...(session === undefined ? {} : { session }),
          ...(servicePrincipalId === undefined ? {} : { servicePrincipalId }),
          ...(serviceConsumerKey === undefined ? {} : { serviceConsumerKey }),
        },
        Cfg05a02EffectiveValueResponseSchema,
      ),
      operationId,
    );
  };

  const propose = async (context: WorkerContext): Promise<Response> => {
    const operationId = 'CFG-05A-03' as const;
    configurationOperation(context, operationId);
    const origin = checkConfigurationSameOrigin(context);
    if (!origin.ok) return responseForAuthError(context, origin);
    const path = parseRoutePath(
      configurationPathSchemas.definitionId,
      context.req.param('definitionId'),
    );
    if (!path.ok) return responseForAuthError(context, path);
    const body = await parseConfigurationBody(
      context.req.raw,
      configurationBodySchemas.propose,
    );
    if (!body.ok) return responseForAuthError(context, body);
    const headers = parseConfigurationCommandHeaders(context.req.raw);
    if (!headers.ok) return responseForAuthError(context, headers);
    const resolved = await sessionWithRate(
      context,
      operationId,
      auth,
      true,
      true,
    );
    if (resolved.rate !== null) return resolved.rate;
    const bound = bindMutationScope(
      body.value as Readonly<Record<string, unknown>>,
      resolved.session,
    );
    if (!bound.ok) return responseForAuthError(context, bound);
    const csrf = await csrfIfCookie(context);
    if (!csrf.ok) return responseForAuthError(context, csrf);
    return send(
      context,
      await runner.run(
        context,
        operationId,
        'proposeChange',
        {
          operationId,
          request: context.req.raw,
          path: { definitionId: path.value },
          body: bound.value,
          idempotencyKey: headers.value.idempotencyKey,
          ...(headers.value.ifMatch === undefined
            ? {}
            : { ifMatch: headers.value.ifMatch }),
          session: resolved.session,
        },
        Cfg05a03ChangeResponseSchema,
      ),
      operationId,
    );
  };

  const action = async (context: WorkerContext): Promise<Response> => {
    const operationId = 'CFG-05A-04' as const;
    configurationOperation(context, operationId);
    const origin = checkConfigurationSameOrigin(context);
    if (!origin.ok) return responseForAuthError(context, origin);
    const path = parseRoutePath(
      configurationPathSchemas.reviewId,
      context.req.param('reviewId'),
    );
    if (!path.ok) return responseForAuthError(context, path);
    const body = await parseConfigurationBody(
      context.req.raw,
      configurationBodySchemas.action,
    );
    if (!body.ok) return responseForAuthError(context, body);
    const headers = parseConfigurationCommandHeaders(context.req.raw);
    if (!headers.ok) return responseForAuthError(context, headers);
    const resolved = await sessionWithRate(
      context,
      operationId,
      auth,
      true,
      true,
    );
    if (resolved.rate !== null) return resolved.rate;
    const csrf = await csrfIfCookie(context);
    if (!csrf.ok) return responseForAuthError(context, csrf);
    return send(
      context,
      await runner.run(
        context,
        operationId,
        'changeAction',
        {
          operationId,
          request: context.req.raw,
          path: { reviewId: path.value },
          body: body.value as Readonly<Record<string, unknown>>,
          idempotencyKey: headers.value.idempotencyKey,
          ...(headers.value.ifMatch === undefined
            ? {}
            : { ifMatch: headers.value.ifMatch }),
          session: resolved.session,
        },
        Cfg05a04ChangeActionResponseSchema,
      ),
      operationId,
    );
  };

  return { register, effective, propose, action };
};

export const registerPlatformConfigurationRoutes = (
  app: WorkerApp,
  dependencies: WorkerDependencies,
): void => {
  const runtime = createPlatformConfigurationRouteRuntime(dependencies);
  app.post('/api/v1/internal/config/definitions', runtime.register);
  app.get('/api/v1/config/:key/effective', runtime.effective);
  app.post('/api/v1/admin/settings/:definitionId/changes', runtime.propose);
  app.post('/api/v1/admin/settings/changes/:reviewId/actions', runtime.action);
  registerAdminWorkspaceRoutes(app, dependencies);
};
