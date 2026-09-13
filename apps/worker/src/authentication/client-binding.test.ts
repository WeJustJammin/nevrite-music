import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';
import { createProductionAuthenticationDependencies } from './production';
import { callRpc } from './production-http';
import {
  base64UrlEncode,
  normalizeAuthProductionOptions,
  sealFlowCookie,
} from './production-support';
import {
  bindings as routeBindings,
  ORIGIN,
} from './phase-02-slice-02.test-fixtures';
import {
  createApp,
  operations,
  requestFor,
} from './phase-02-slice-02.test-support';

const AUTH_USER_ID = '22222222-2222-4222-8222-222222222222';
const SESSION_ID = '33333333-3333-4333-8333-333333333333';
const PERSON_ID = '44444444-4444-4444-8444-444444444444';
const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const NOW = Date.parse('2026-09-01T04:00:00Z');

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'client-binding-test',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const json = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const encodeJson = (value: unknown): string =>
  base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));

const jwt = (): string =>
  `${encodeJson({ alg: 'RS256', typ: 'JWT' })}.${encodeJson({
    sub: AUTH_USER_ID,
    session_id: SESSION_ID,
    iss: `${environment.SUPABASE_URL}/auth/v1`,
    aud: 'authenticated',
    exp: Math.floor(NOW / 1000) + 3600,
    iat: Math.floor(NOW / 1000),
    aal: 'aal2',
  })}.signature`;

const request = (path: string, init: RequestInit = {}): Request =>
  new Request(`${ORIGIN}${path}`, {
    ...init,
    headers: {
      'x-request-id': REQUEST_ID,
      'x-correlation-id': REQUEST_ID,
      ...(init.headers ?? {}),
    },
  });

const productionConfig = (fetchImpl: typeof fetch = vi.fn()) =>
  normalizeAuthProductionOptions({
    environment,
    fetchImpl,
    now: () => NOW,
    randomBytes: (length) => new Uint8Array(length).fill(7),
  });

const sessionReference = () =>
  sealFlowCookie(
    {
      state: SESSION_ID,
      nonce: AUTH_USER_ID,
      verifier: '',
      provider: 'session',
      intent: 'session',
      expiresAt: '2026-10-01T04:00:00Z',
    },
    productionConfig(),
  );

const productionAuth = (fetchImpl: typeof fetch) =>
  createProductionAuthenticationDependencies({
    environment,
    fetchImpl,
    now: () => NOW,
  });

const signal = new AbortController().signal;
const projection = {
  accountState: 'active',
  bootstrapState: 'complete',
  personId: PERSON_ID,
  actingPartyId: PERSON_ID,
};

describe('client-binding authentication coverage', () => {
  it('rejects a malformed selector during access-session resolution before fetching', async () => {
    const fetchImpl = vi.fn(async () => json({ id: AUTH_USER_ID }));
    const auth = productionAuth(fetchImpl as typeof fetch);

    const result = await auth.resolveSession(
      request('/api/v1/auth/session', {
        headers: { 'x-client-binding-id': 'tab selector with spaces' },
      }),
      environment,
      signal,
    );

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      code: 'INVALID_REQUEST',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects a malformed selector during refresh before fetching', async () => {
    const fetchImpl = vi.fn(async () => json({}));
    const auth = productionAuth(fetchImpl as typeof fetch);

    const result = await auth.refreshSession(
      request('/api/v1/auth/session/refresh', {
        headers: { 'x-client-binding-id': 'tab selector with spaces' },
      }),
      environment,
      signal,
    );

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      code: 'INVALID_REQUEST',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('forwards a valid selector to auth_session_read and preserves missing-header self reads', async () => {
    const reference = await sessionReference();
    const sessionReadHeaders: HeadersInit[] = [];
    const fetchImpl = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        if (String(input).endsWith('/auth/v1/user'))
          return json({ id: AUTH_USER_ID });
        if (String(input).endsWith('/rpc/auth_session_read'))
          sessionReadHeaders.push(init?.headers ?? {});
        return json(projection);
      },
    ) as typeof fetch;
    const auth = productionAuth(fetchImpl);
    const cookie = `wj_access=${jwt()}; wj_session_ref=${reference}`;

    await expect(
      auth.resolveSession(
        request('/api/v1/auth/session', {
          headers: { cookie, 'x-client-binding-id': 'tab-7:production' },
        }),
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      auth.resolveSession(
        request('/api/v1/auth/session', { headers: { cookie } }),
        environment,
        signal,
      ),
    ).resolves.toMatchObject({ ok: true });

    expect(sessionReadHeaders).toHaveLength(2);
    expect(new Headers(sessionReadHeaders[0]).get('x-client-binding-id')).toBe(
      'tab-7:production',
    );
    expect(new Headers(sessionReadHeaders[1]).get('x-client-binding-id')).toBe(
      null,
    );
  });

  it.each([
    ['CONTEXT_NOT_FOUND', 404],
    ['CONTEXT_REVOKED', 403],
    ['CONTEXT_RECONFIRM_REQUIRED', 403],
  ] as const)(
    'maps %s from auth_session_read to a typed API error',
    async (message, status) => {
      await expect(
        callRpc(
          productionConfig(
            vi.fn(async () => json({ message }, 400)) as typeof fetch,
          ),
          'auth_session_read',
          { p_auth_user_id: AUTH_USER_ID, p_session_id: SESSION_ID },
          signal,
        ),
      ).rejects.toMatchObject({ status, code: message });
    },
  );

  it('rejects a malformed selector before the route resolves its session', async () => {
    const { app, auth, slice } = createApp();
    const loginMethods = operations.find(({ id }) => id === 'AUTH-API-09');
    if (loginMethods === undefined)
      throw new Error('Missing AUTH-API-09 test route.');
    const original = requestFor(loginMethods);
    const headers = new Headers(original.headers);
    headers.set('x-client-binding-id', 'tab selector with spaces');

    const response = await app.request(
      new Request(original, { headers }),
      undefined,
      routeBindings,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(auth.resolveSession).not.toHaveBeenCalled();
    expect(slice.readLoginMethods).not.toHaveBeenCalled();
  });
});
