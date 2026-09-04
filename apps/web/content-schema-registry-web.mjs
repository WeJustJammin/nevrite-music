import builtWorker from './dist/server/entry.mjs';

const isServiceBinding = (value) =>
  typeof value === 'object' &&
  value !== null &&
  typeof value.fetch === 'function';

/**
 * Probe the same private service binding used by the production route before
 * Playwright starts. This removes Wrangler's local service-discovery race from
 * the route assertions without changing an application route.
 */
export default {
  fetch: async (request, env, context) => {
    const pathname = new URL(request.url).pathname;
    if (pathname !== '/_s09/ready' && pathname !== '/_s09/revoke')
      return builtWorker.fetch(request, env, context);

    if (!isServiceBinding(env.PLATFORM_API))
      return Response.json({ ready: false }, { status: 503 });

    try {
      if (pathname === '/_s09/revoke' && request.method === 'POST') {
        return env.PLATFORM_API.fetch(
          new Request('https://platform-api.internal/_s09/revoke', {
            method: 'POST',
            headers: {
              'content-type':
                request.headers.get('content-type') ?? 'application/json',
            },
            body: await request.text(),
          }),
        );
      }
      const response = await env.PLATFORM_API.fetch(
        new Request('https://platform-api.internal/api/v1/health'),
      );
      return Response.json(
        { ready: response.status === 200 },
        { status: response.status === 200 ? 200 : 503 },
      );
    } catch {
      return Response.json({ ready: false }, { status: 503 });
    }
  },
};
