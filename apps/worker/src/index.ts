import {
  ApiErrorSchema,
  createRequestId,
  HealthResponseSchema,
  type RequestId,
} from '@wejammin/contracts';
import { Hono } from 'hono';

type Variables = {
  requestId: RequestId;
};

const app = new Hono<{ Variables: Variables }>();

app.use('*', async (context, next) => {
  const requestId = createRequestId(context.req.header('x-request-id'));
  context.set('requestId', requestId);

  await next();

  context.header('x-request-id', requestId);
});

app.get('/api/v1/health', (context) => {
  const payload = HealthResponseSchema.parse({
    requestId: context.get('requestId'),
    service: 'wejammin-api',
    status: 'ok',
    version: 'v1',
  });

  return context.json(payload);
});

app.notFound((context) => {
  const payload = ApiErrorSchema.parse({
    code: 'route_not_found',
    details: { path: context.req.path },
    message: 'The requested API route does not exist.',
    requestId: context.get('requestId'),
  });

  return context.json(payload, 404);
});

export default app;
