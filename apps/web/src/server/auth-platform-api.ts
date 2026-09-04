import { ApiErrorSchema, createRequestId } from '@wejammin/contracts';

export type AuthPlatformApiBinding = Readonly<{
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}>;

const requestHeaders = [
  'accept',
  'content-type',
  'cookie',
  'if-match',
  'idempotency-key',
  'origin',
  'x-correlation-id',
  'x-csrf-token',
  'x-request-id',
] as const;

const responseHeaders = new Set([
  'cache-control',
  'content-type',
  'etag',
  'location',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
  'retry-after',
  'set-cookie',
  'vary',
  'x-correlation-id',
  'x-request-id',
]);

const isBinding = (value: unknown): value is AuthPlatformApiBinding =>
  typeof value === 'object' &&
  value !== null &&
  'fetch' in value &&
  typeof value.fetch === 'function';

const unavailable = (request: Request): Response => {
  const requestId = createRequestId(
    request.headers.get('x-request-id') ?? undefined,
  );
  return Response.json(
    ApiErrorSchema.parse({
      code: 'DEPENDENCY_UNAVAILABLE',
      details: {},
      message: 'Authentication is temporarily unavailable.',
      requestId,
    }),
    {
      status: 503,
      headers: { 'cache-control': 'no-store', 'retry-after': '5' },
    },
  );
};

export const forwardAuthRequest = async (
  request: Request,
  binding: unknown,
  path: string,
  method: 'DELETE' | 'GET' | 'POST',
): Promise<Response> => {
  if (!isBinding(binding) || request.method !== method)
    return unavailable(request);
  const target = new URL(request.url);
  target.pathname = path;
  target.search = new URL(request.url).search;
  const headers = new Headers();
  for (const name of requestHeaders) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  let response: Response;
  try {
    response = await binding.fetch(
      new Request(target, {
        method,
        headers,
        ...(method === 'GET' ? {} : { body: await request.arrayBuffer() }),
      }),
    );
  } catch {
    return unavailable(request);
  }
  if (
    response.status >= 400 &&
    !response.headers.get('content-type')?.includes('application/json')
  ) {
    return unavailable(request);
  }
  const returnedHeaders = new Headers();
  response.headers.forEach((value, name) => {
    if (responseHeaders.has(name.toLowerCase()))
      returnedHeaders.append(name, value);
  });
  return new Response(response.body, {
    status: response.status,
    headers: returnedHeaders,
  });
};

export const copyAuthCookies = (source: Response, target: Headers): void => {
  const headers = source.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    for (const cookie of cookies) target.append('set-cookie', cookie);
    return;
  }
  const cookie = source.headers.get('set-cookie');
  if (cookie !== null) target.append('set-cookie', cookie);
};
