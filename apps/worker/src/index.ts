import {
  ApiErrorSchema,
  createRequestId,
  HealthResponseSchema,
  type RequestId,
} from '@wejammin/contracts';
import {
  createLogger,
  type Logger,
  type LogEventDetails,
} from '@wejammin/observability/logging';
import { Hono } from 'hono';

export type WorkerBindings = {
  APP_ENVIRONMENT: string;
  APP_RELEASE: string;
};

export type ErrorCaptureContext = {
  correlationId: string;
  operation: string;
  requestId: string;
  routeTemplate: string;
};

type Variables = {
  captureAttempted: boolean;
  correlationId: RequestId;
  errorCode?: string;
  errorHandled: boolean;
  logger: Logger;
  operation: string;
  requestId: RequestId;
  startedAt: number;
};

type WorkerDependencies = {
  captureException: (error: unknown, context: ErrorCaptureContext) => void;
  createLogger: (bindings: WorkerBindings) => Logger;
  now: () => number;
};

export const routeTemplateFor = (routePath: string): string =>
  routePath.startsWith('/') ? routePath : '/_unmatched';

const logRequest = (
  logger: Logger,
  details: LogEventDetails,
  status: number,
): void => {
  if (status >= 500) {
    logger.error(details);
  } else if (status >= 400) {
    logger.warn(details);
  } else {
    logger.info(details, { samplingClass: 'public_success' });
  }
};

export const createWorkerApp = (dependencies: WorkerDependencies) => {
  const app = new Hono<{
    Bindings: WorkerBindings;
    Variables: Variables;
  }>();

  app.use('*', async (context, next) => {
    const requestId = createRequestId(context.req.header('x-request-id'));
    const correlationId = createRequestId(
      context.req.header('x-correlation-id') ?? requestId,
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
      logRequest(
        context.get('logger'),
        {
          correlationId,
          durationMs: dependencies.now() - context.get('startedAt'),
          ...(errorCode === undefined ? {} : { errorCode }),
          eventName: 'http.request.completed',
          operation: context.get('operation'),
          outcome: status >= 400 ? 'rejected' : 'success',
          requestId,
          retryable: false,
          routeTemplate: routeTemplateFor(context.req.routePath),
        },
        status,
      );
    }
  });

  app.get('/api/v1/health', (context) => {
    context.set('operation', 'health.read');
    const payload = HealthResponseSchema.parse({
      requestId: context.get('requestId'),
      service: 'wejammin-api',
      status: 'ok',
      version: 'v1',
    });

    return context.json(payload);
  });

  app.notFound((context) => {
    context.set('errorCode', 'route_not_found');
    context.set('operation', 'route.lookup');
    const payload = ApiErrorSchema.parse({
      code: 'route_not_found',
      details: {},
      message: 'The requested API route does not exist.',
      requestId: context.get('requestId'),
    });

    return context.json(payload, 404);
  });

  app.onError((error, context) => {
    context.set('errorHandled', true);
    const requestId = context.get('requestId');
    const correlationId = context.get('correlationId');
    const operation = context.get('operation');
    const routeTemplate = routeTemplateFor(context.req.routePath);
    if (!context.get('captureAttempted')) {
      context.set('captureAttempted', true);
      try {
        dependencies.captureException(error, {
          correlationId,
          operation,
          requestId,
          routeTemplate,
        });
      } catch {
        // Telemetry transport failure must not replace the canonical response.
      }
    }
    context.header('x-correlation-id', correlationId);
    context.header('x-request-id', requestId);
    logRequest(
      context.get('logger'),
      {
        correlationId,
        durationMs: dependencies.now() - context.get('startedAt'),
        errorCode: 'internal_error',
        eventName: 'http.request.completed',
        operation,
        outcome: 'failure',
        requestId,
        retryable: false,
        routeTemplate,
      },
      500,
    );

    const payload = ApiErrorSchema.parse({
      code: 'internal_error',
      details: {},
      message: 'An unexpected error occurred.',
      requestId,
    });
    return context.json(payload, 500);
  });

  return app;
};

export const app = createWorkerApp({
  captureException: () => {},
  createLogger: (bindings) =>
    createLogger({
      environment: bindings.APP_ENVIRONMENT,
      release: bindings.APP_RELEASE,
      service: 'wejammin-api',
    }),
  now: Date.now,
});

const handler = { fetch: app.fetch } satisfies ExportedHandler<WorkerBindings>;

export default handler;
