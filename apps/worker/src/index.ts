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
  type ServerEnvironment,
} from '@wejammin/config/environment';
import { createLogger, type Logger } from '@wejammin/observability/logging';
import { Hono, type Context } from 'hono';

import {
  createAsyncEntrypoint,
  type AsyncWorkerBindings,
} from './async-entrypoint';
import { createAsyncJobDependencies } from './async-runtime';
import type { JobStatusDependencies } from './jobs/job-status';
import {
  createProductionJobStatusDependencies,
  type JobStatusProductionFetch,
} from './jobs/job-status-production';
import {
  createProductionJobEffectDispatcher,
  type ProductionVerificationDependencies,
} from './production-job-effect-dispatcher';
import type { UploadCompletionRouteDependencies } from './upload-completion/upload-intent-completion';
import {
  logRequest,
  registerWorkerRoutes,
  routeTemplateFor,
} from './worker-route-composition';

export { routeTemplateFor } from './worker-route-composition';
export {
  createProductionJobEffectDispatcher,
  createProductionVerificationDispatcher,
} from './production-job-effect-dispatcher';
export type {
  PlatformVerificationDependencies,
  ProductionVerificationDependencies,
} from './production-job-effect-dispatcher';

export type WorkerBindings = ServerEnvironment;

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
  ) => MaybePromise<unknown>;
};

export const createWorkerApp = (dependencies: WorkerDependencies) => {
  const app: WorkerApp = new Hono();

  app.use('*', async (context, next) => {
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

    await next();

    context.header('x-correlation-id', correlationId);
    context.header('x-request-id', requestId);
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

const createRuntimeDependencies = (
  jobs?: JobStatusDependencies,
  uploadCompletion?: UploadCompletionRouteDependencies,
  checkReadiness?: WorkerDependencies['checkReadiness'],
): WorkerDependencies => ({
  captureException: () => {},
  createLogger: (bindings) =>
    createLogger({
      environment: bindings.APP_ENVIRONMENT,
      release: bindings.APP_RELEASE,
      service: 'wejammin-api',
    }),
  ...(checkReadiness === undefined ? {} : { checkReadiness }),
  ...(jobs === undefined ? {} : { jobs }),
  ...(uploadCompletion === undefined ? {} : { uploadCompletion }),
  now: Date.now,
});

export const app = createWorkerApp(createRuntimeDependencies());

export const createProductionWorkerApp = (
  environment: WorkerBindings,
  fetchImpl: JobStatusProductionFetch = globalThis.fetch,
  uploadCompletion?: UploadCompletionRouteDependencies,
  checkReadiness?: WorkerDependencies['checkReadiness'],
): WorkerApp => {
  const validatedEnvironment = parseServerEnvironment(environment);
  return createWorkerApp(
    createRuntimeDependencies(
      createProductionJobStatusDependencies({
        environment: validatedEnvironment,
        fetchImpl,
      }),
      uploadCompletion,
      checkReadiness,
    ),
  );
};

export const createProductionAsyncEntrypoint = (
  fetchImpl: typeof fetch = globalThis.fetch,
  verification?: ProductionVerificationDependencies,
) =>
  createAsyncEntrypoint(
    createAsyncJobDependencies({
      effect: createProductionJobEffectDispatcher(verification),
      fetch: fetchImpl,
    }),
  );

const handler = {
  fetch: (request, env, executionContext) => {
    const validatedEnvironment = projectServerEnvironment(env);
    return createProductionWorkerApp(validatedEnvironment).fetch(
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
