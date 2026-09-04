import {
  createCorrelationId,
  createRequestId,
  type CorrelationId,
  type DiagnosticResponse,
  type RequestContext,
  type RequestId,
} from '@wejammin/contracts';
import {
  parseServerEnvironment,
  projectServerEnvironment,
  SERVER_ENVIRONMENT_KEYS,
  type ServerEnvironment,
} from '@wejammin/config/environment';
import { type Logger } from '@wejammin/observability/logging';
import { Hono, type Context } from 'hono';

import {
  createAsyncEntrypoint,
  type AsyncWorkerBindings,
} from './async-entrypoint';
import { createAsyncJobDependencies } from './async-runtime';
import type { JobStatusDependencies } from './jobs/job-status';
import type { JobStatusProductionFetch } from './jobs/job-status-production';
import {
  createProductionJobEffectDispatcher,
  type ProductionVerificationDependencies,
} from './production-job-effect-dispatcher';
import type { UploadCompletionRouteDependencies } from './upload-completion/upload-intent-completion';
import type {
  AuthenticationDependencies,
  AuthenticationSession,
} from './authentication/types';
import type { ContentSchemaRegistryDependencies } from './content-schema-registry/types';
import type { IdentityAuthorityDependencies } from './identity-authority/types';
import type { ProfileOwnershipDependencies } from './profile-ownership/types';
import type { ProfilePortfolioDependencies } from './profile-portfolio/types';
import { type PlatformConfigurationProductionOptions } from './platform-configuration/production';
import type {
  AdminWorkspaceDependencies,
  PlatformConfigurationDependencies,
} from './platform-configuration/types';
import {
  createProductionWorkerAppRuntime,
  createProductionSchemaMigrationWorker,
  migrationQueueOutcome,
  createRuntimeDependencies,
  type ProductionSchemaMigrationWorkerOptions,
  type ProductionContentSchemaRegistryOptions,
} from './production-worker-runtime';
import {
  logRequest,
  registerWorkerRoutes,
  routeTemplateFor,
} from './worker-route-composition';
import {
  applySecurityHeaders,
  createHttpsRedirectResponse,
  generateRequestNonce,
  shouldRedirectToHttps,
} from './security-headers';
import type { WorkerBindings } from './worker-bindings';
export { routeTemplateFor } from './worker-route-composition';
export {
  createProductionJobEffectDispatcher,
  createProductionVerificationDispatcher,
} from './production-job-effect-dispatcher';
export type {
  PlatformVerificationDependencies,
  ProductionVerificationDependencies,
} from './production-job-effect-dispatcher';
export type { WorkerBindings };
export type ProductionPlatformConfigurationOptions = Pick<
  PlatformConfigurationProductionOptions,
  | 'resolveReleasePrincipal'
  | 'resolveServiceConsumer'
  | 'resolveRequestContext'
  | 'resolveCapabilities'
>;
export type { ProductionContentSchemaRegistryOptions } from './production-worker-runtime';
export {
  createProductionSchemaMigrationWorker,
  migrationQueueOutcome,
} from './production-worker-runtime';
export type { ProductionSchemaMigrationWorkerOptions } from './production-worker-runtime';
export type ErrorCaptureContext = {
  correlationId: CorrelationId;
  operation: string;
  requestId: RequestId;
  routeTemplate: string;
};
export const DIAGNOSTICS_CAPABILITY = 'diagnostics.read' as const;
type MaybePromise<T> = T | Promise<T>;
export type DiagnosticCheck = DiagnosticResponse['checks'][number];
export type DiagnosticAuditEvent = Readonly<{
  action: typeof DIAGNOSTICS_CAPABILITY;
  actorId: string | null;
  actingPartyId: string | null;
  correlationId: CorrelationId;
  decision: 'allow' | 'deny';
  reason: string | null;
  requestId: RequestId;
  target: 'worker-diagnostics';
}>;
type Variables = {
  captureAttempted: boolean;
  correlationId: CorrelationId;
  errorCode?: string;
  errorHandled: boolean;
  identityAuth?: AuthenticationDependencies;
  logger: Logger;
  operation: string;
  requestId: RequestId;
  startedAt: number;
};
export type WorkerContext = Context<{
  Bindings: WorkerBindings;
  Variables: Variables;
}>;
export type WorkerApp = Hono<{
  Bindings: WorkerBindings;
  Variables: Variables;
}>;
export type WebhookRouteRegistration = Readonly<{
  path: `/api/v1/webhooks/${string}`;
  handler: (request: Request) => MaybePromise<Response>;
}>;
export type WorkerDependencies = {
  auth?: AuthenticationDependencies;
  contentSchemaRegistry?: ContentSchemaRegistryDependencies;
  identityAuthority?: IdentityAuthorityDependencies;
  profileOwnership?: ProfileOwnershipDependencies;
  profilePortfolio?: ProfilePortfolioDependencies;
  platformConfiguration?: PlatformConfigurationDependencies;
  adminWorkspace?: AdminWorkspaceDependencies;
  auditDiagnosticAccess?: (event: DiagnosticAuditEvent) => MaybePromise<void>;
  checkReadiness?: (
    request: Request,
    env: WorkerBindings,
  ) => MaybePromise<boolean | Readonly<{ ready: boolean }>>;
  captureException: (error: unknown, context: ErrorCaptureContext) => void;
  composeDiagnostics?: (
    requestContext: RequestContext,
    request: Request,
    env: WorkerBindings,
  ) => MaybePromise<readonly DiagnosticCheck[]>;
  createLogger: (bindings: WorkerBindings) => Logger;
  isStepUpFresh?: (
    requestContext: RequestContext,
    request: Request,
    env: WorkerBindings,
  ) => MaybePromise<boolean>;
  now: () => number;
  nowDate?: () => Date;
  jobs?: JobStatusDependencies;
  uploadCompletion?: UploadCompletionRouteDependencies;
  uploadIntent?: (request: Request) => MaybePromise<Response>;
  webhookRoutes?: readonly WebhookRouteRegistration[];
  resolveRequestContext?: (
    request: Request,
    env: WorkerBindings,
    signal?: AbortSignal,
    session?: AuthenticationSession,
  ) => MaybePromise<unknown>;
};
export const createWorkerApp = (dependencies: WorkerDependencies) => {
  const app: WorkerApp = new Hono();

  app.use('*', async (context, next) => {
    const requestNonce = generateRequestNonce();
    const requestId = createRequestId(context.req.header('x-request-id'));
    const correlationId = createCorrelationId(
      context.req.header('x-correlation-id') ?? requestId,
      requestId,
    );
    context.set('correlationId', correlationId);
    context.set('captureAttempted', false);
    context.set('errorHandled', false);
    context.set('logger', dependencies.createLogger(context.env));
    context.set('operation', 'http.request');
    context.set('requestId', requestId);
    context.set('startedAt', dependencies.now());

    if (shouldRedirectToHttps(context.req.raw)) {
      const response = applySecurityHeaders(
        createHttpsRedirectResponse(context.req.raw),
        requestNonce,
      );
      response.headers.set('x-correlation-id', correlationId);
      response.headers.set('x-request-id', requestId);
      context.res = response;
      return response;
    }

    await next();

    const responseWithSecurityHeaders = applySecurityHeaders(
      context.res,
      requestNonce,
    );
    for (const [name, value] of responseWithSecurityHeaders.headers) {
      context.res.headers.set(name, value);
    }
    context.res.headers.set('x-correlation-id', correlationId);
    context.res.headers.set('x-request-id', requestId);
    if (!context.get('errorHandled')) {
      const status = context.res.status;
      const errorCode = context.get('errorCode');
      const retryableDependency =
        status === 503 && errorCode === 'DEPENDENCY_UNAVAILABLE';
      logRequest(
        context.get('logger'),
        {
          correlationId,
          durationMs: dependencies.now() - context.get('startedAt'),
          ...(errorCode === undefined ? {} : { errorCode }),
          eventName: 'http.request.completed',
          operation: context.get('operation'),
          outcome: retryableDependency
            ? 'failure'
            : status >= 400
              ? 'rejected'
              : 'success',
          requestId,
          retryable: retryableDependency,
          routeTemplate: routeTemplateFor(context.req.routePath),
        },
        status,
      );
    }
  });

  registerWorkerRoutes(app, dependencies);

  return app;
};
export const app = createWorkerApp(createRuntimeDependencies());

export const createProductionWorkerApp = (
  environment: WorkerBindings,
  fetchImpl: JobStatusProductionFetch = globalThis.fetch,
  uploadCompletion?: UploadCompletionRouteDependencies,
  checkReadiness?: WorkerDependencies['checkReadiness'],
  platformConfigurationOptions?: ProductionPlatformConfigurationOptions,
  contentSchemaRegistryOptions?: ProductionContentSchemaRegistryOptions,
): WorkerApp => {
  const validatedEnvironment = parseServerEnvironment(environment);
  return createProductionWorkerAppRuntime(
    createWorkerApp,
    validatedEnvironment,
    fetchImpl,
    uploadCompletion,
    checkReadiness,
    platformConfigurationOptions,
    contentSchemaRegistryOptions,
  );
};
export const createProductionAsyncEntrypoint = (
  fetchImpl: typeof fetch = globalThis.fetch,
  verification?: ProductionVerificationDependencies,
  migrationOptions?: ProductionSchemaMigrationWorkerOptions,
) =>
  (() => {
    const dependencies = createAsyncJobDependencies({
      effect: createProductionJobEffectDispatcher(verification),
      fetch: fetchImpl,
    });
    const workers = new WeakMap<
      object,
      ReturnType<typeof createProductionSchemaMigrationWorker>
    >();
    return createAsyncEntrypoint({
      ...dependencies,
      processSchemaMigration: async ({ env, event, message }) => {
        let worker = workers.get(env);
        if (worker === undefined) {
          worker = createProductionSchemaMigrationWorker(
            projectServerEnvironment(env),
            fetchImpl,
            migrationOptions,
          );
          workers.set(env, worker);
        }
        const result = await worker.process(event, {
          attempt: message.attempts,
        });
        return migrationQueueOutcome(result);
      },
    });
  })();

let cachedProductionApp: WorkerApp | undefined;
let cachedProductionEnvironment: ServerEnvironment | undefined;

const sameProductionEnvironment = (
  left: ServerEnvironment | undefined,
  right: ServerEnvironment,
): boolean =>
  left !== undefined &&
  SERVER_ENVIRONMENT_KEYS.every((key) => left[key] === right[key]);

const productionAppFor = (environment: ServerEnvironment): WorkerApp => {
  if (!sameProductionEnvironment(cachedProductionEnvironment, environment)) {
    cachedProductionEnvironment = environment;
    cachedProductionApp = createProductionWorkerApp(environment);
  }
  return cachedProductionApp as WorkerApp;
};

const handler = {
  fetch: (request, env, executionContext) => {
    const validatedEnvironment = projectServerEnvironment(env);
    return productionAppFor(validatedEnvironment).fetch(
      request,
      validatedEnvironment,
      executionContext,
    );
  },
  queue: (batch, env, executionContext) =>
    createProductionAsyncEntrypoint().queue(batch, env, executionContext),
  scheduled: (controller, env, executionContext) =>
    createProductionAsyncEntrypoint().scheduled(
      controller,
      env,
      executionContext,
    ),
} satisfies ExportedHandler<AsyncWorkerBindings>;
export default handler;
