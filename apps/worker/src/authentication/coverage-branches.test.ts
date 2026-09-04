import { describe, expect, it, vi } from 'vitest';

import {
  AuthorizationStartSchema,
  AuthEmptyBodySchema,
  isRelativeFirstPartyPath,
} from '@wejammin/contracts';
import {
  parseIdempotencyKey,
  parseJsonBody,
  verifySameOriginCsrf,
} from './boundary';
import {
  base64UrlEncode,
  callAuthJson,
  callRpc,
  mapProductionFailure,
  normalizeAuthProductionOptions,
  openFlowCookie,
  readCookie,
  sealFlowCookie,
  validateReturnPath,
  verifyTokenResponse,
} from './production-support';
import { enforceRate, isStepUpFresh, policyFor } from './route-support';
import type { AuthenticationDependencies } from './types';

const AUTH_USER_ID = '22222222-2222-4222-8222-222222222222';
const SESSION_ID = '33333333-3333-4333-8333-333333333333';
const NOW = Date.parse('2026-09-01T04:00:00Z');
const environment = {
  APP_ENVIRONMENT: 'staging' as const,
  APP_RELEASE: 'coverage-branches',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const json = (value: unknown, status = 200): Response =>
  Response.json(value, { status });

const encode = (value: unknown): string =>
  base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));

const jwt = (overrides: Readonly<Record<string, unknown>> = {}): string =>
  `${encode({ alg: 'RS256' })}.${encode({
    sub: AUTH_USER_ID,
    session_id: SESSION_ID,
    iss: `${environment.SUPABASE_URL}/auth/v1`,
    aud: 'authenticated',
    exp: Math.floor(NOW / 1000) + 3600,
    iat: Math.floor(NOW / 1000),
    aal: 'aal2',
    ...overrides,
  })}.signature`;

const config = (fetchImpl: typeof fetch = vi.fn()) =>
  normalizeAuthProductionOptions({ environment, fetchImpl, now: () => NOW });

describe('authentication defensive branches', () => {
  it('rejects malformed, oversized, unreadable, and unsupported JSON bodies', async () => {
    const schema = AuthEmptyBodySchema;
    await expect(
      parseJsonBody(
        new Request('https://api.example.test', { method: 'POST' }),
        schema,
      ),
    ).resolves.toMatchObject({ status: 415 });
    await expect(
      parseJsonBody(
        new Request('https://api.example.test', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': '262145',
          },
          body: '{}',
        }),
        schema,
      ),
    ).resolves.toMatchObject({ status: 413 });
    await expect(
      parseJsonBody(
        {
          headers: new Headers({ 'content-type': 'application/json' }),
          text: vi.fn(async () => Promise.reject(new Error('stream failed'))),
        } as unknown as Request,
        schema,
      ),
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      parseJsonBody(
        new Request('https://api.example.test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ value: 'x'.repeat(262_145) }),
        }),
        schema,
      ),
    ).resolves.toMatchObject({ status: 413 });
    await expect(
      parseJsonBody(
        new Request('https://api.example.test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{',
        }),
        schema,
      ),
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      parseJsonBody(
        new Request('https://api.example.test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '',
        }),
        AuthEmptyBodySchema,
      ),
    ).resolves.toMatchObject({ ok: true, value: {} });
  });

  it('rejects invalid idempotency and CSRF boundaries', async () => {
    expect(
      parseIdempotencyKey(new Request('https://api.example.test')),
    ).toMatchObject({
      ok: false,
    });
    expect(
      await verifySameOriginCsrf(
        new Request('https://api.example.test', {
          headers: { origin: 'https://attacker.example' },
        }),
      ),
    ).toMatchObject({ status: 403 });
    expect(
      await verifySameOriginCsrf(
        new Request('https://api.example.test', {
          headers: {
            origin: 'https://api.example.test',
            cookie: 'wj_csrf=one',
          },
        }),
      ),
    ).toMatchObject({ status: 403 });
  });

  it('covers return-path and authorization-origin denial branches', () => {
    expect(isRelativeFirstPartyPath('/')).toBe(true);
    expect(isRelativeFirstPartyPath('/app?next=%E0%A4%A')).toBe(false);
    expect(isRelativeFirstPartyPath('/outside')).toBe(false);
    expect(isRelativeFirstPartyPath('/app?next=javascript:alert(1)')).toBe(
      false,
    );
    expect(validateReturnPath('/settings/security')).toBe('/settings/security');
    expect(validateReturnPath('https://attacker.example')).toBeNull();
    for (const host of [
      'https://appleid.apple.com/auth',
      'https://www.facebook.com/dialog',
      'https://secure.soundcloud.com/connect',
      'https://project.supabase.co/auth/v1/authorize',
      'http://localhost:54321/auth/v1/authorize',
      'http://127.0.0.1:54321/auth/v1/authorize',
    ]) {
      expect(
        AuthorizationStartSchema.safeParse({
          authorizationUrl: host,
          expiresAt: '2026-09-01T04:05:00Z',
        }).success,
      ).toBe(true);
    }
    expect(
      AuthorizationStartSchema.safeParse({
        authorizationUrl: 'http://accounts.google.com/auth',
        expiresAt: '2026-09-01T04:05:00Z',
      }).success,
    ).toBe(false);
  });

  it('maps dependency failures and every provider HTTP class', async () => {
    const known = {
      ok: false as const,
      status: 409 as const,
      code: 'KNOWN',
      message: 'known',
      details: {},
    };
    expect(mapProductionFailure(known)).toBe(known);
    expect(
      mapProductionFailure(new DOMException('aborted', 'AbortError')),
    ).toMatchObject({ status: 504 });
    expect(mapProductionFailure(new Error('offline'))).toMatchObject({
      status: 503,
    });

    for (const [status, expected] of [
      [429, 429],
      [500, 503],
      [400, 401],
    ] as const) {
      await expect(
        callAuthJson(
          config(vi.fn(async () => json({}, status))),
          '/auth/v1/user',
          {},
        ),
      ).rejects.toMatchObject({ status: expected });
    }
    await expect(
      callAuthJson(
        config(vi.fn(async () => new Response(null, { status: 204 }))),
        '/auth/v1/logout',
        {},
      ),
    ).resolves.toEqual({});
    await expect(
      callAuthJson(
        config(vi.fn(async () => new Response('not-json'))),
        '/auth/v1/user',
        {},
      ),
    ).rejects.toMatchObject({ status: 502 });
    await expect(
      callAuthJson(
        config(vi.fn(async () => new Response('x'.repeat(1_048_577)))),
        '/auth/v1/user',
        {},
      ),
    ).rejects.toMatchObject({ status: 502 });
    await expect(
      callAuthJson(
        config(
          vi.fn(async () =>
            Promise.reject(new DOMException('aborted', 'AbortError')),
          ),
        ),
        '/auth/v1/user',
        {},
      ),
    ).rejects.toMatchObject({ status: 504 });
  });

  it('maps protected RPC errors to stable API errors', async () => {
    for (const [message, expected] of [
      ['IDEMPOTENCY_MISMATCH', 409],
      ['ACCOUNT_NOT_ELIGIBLE', 403],
      ['AUTH_CALLBACK_INVALID', 400],
      ['UNAUTHENTICATED', 401],
      ['other', 503],
      [42, 503],
      [null, 503],
    ] as const) {
      const response =
        message === null
          ? new Response('not-json', { status: 400 })
          : json({ message }, 400);
      await expect(
        callRpc(
          config(vi.fn(async () => response)),
          'test_rpc',
          {},
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({ status: expected });
    }
    await expect(
      callRpc(
        config(vi.fn(async () => Promise.reject(new Error('offline')))),
        'test_rpc',
        {},
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('rejects malformed, expired, and structurally invalid encrypted cookies', async () => {
    const production = config();
    const flow = {
      state: 'state',
      nonce: 'nonce',
      verifier: 'verifier',
      provider: 'google',
      intent: 'sign_in',
      expiresAt: '2026-09-01T04:10:00Z',
    } as const;
    const sealed = await sealFlowCookie(flow, production);
    expect(await openFlowCookie('one-part', production)).toBeNull();
    expect(await openFlowCookie(`${sealed}.extra`, production)).toBeNull();
    expect(await openFlowCookie('***.***', production)).toBeNull();
    expect(
      await openFlowCookie(
        await sealFlowCookie(
          { ...flow, expiresAt: '2026-09-01T03:59:59Z' },
          production,
        ),
        production,
      ),
    ).toBeNull();
    expect(
      readCookie(new Request('https://api.example.test'), 'missing'),
    ).toBeNull();
    expect(
      readCookie(
        new Request('https://api.example.test', {
          headers: { cookie: 'a=1; target=value' },
        }),
        'target',
      ),
    ).toBe('value');
  });

  it('rejects malformed token envelopes and every invalid verified claim', async () => {
    const fetchImpl = vi.fn(async () => json({ id: AUTH_USER_ID }));
    const production = config(fetchImpl);
    for (const payload of [null, {}, { access_token: 'x' }]) {
      await expect(
        verifyTokenResponse(payload, production, new AbortController().signal),
      ).resolves.toMatchObject({ ok: false, status: 502 });
    }
    const cases: readonly Readonly<Record<string, unknown>>[] = [
      { sub: 'not-a-uuid' },
      { sub: '44444444-4444-4444-8444-444444444444' },
      { session_id: undefined, sid: undefined },
      { session_id: 'not-a-uuid' },
      { exp: undefined },
      { exp: Math.floor(NOW / 1000) },
      { aud: 'anonymous' },
      { aud: ['anonymous'] },
    ];
    for (const overrides of cases) {
      await expect(
        verifyTokenResponse(
          { access_token: jwt(overrides), refresh_token: 'refresh' },
          production,
          new AbortController().signal,
        ),
      ).resolves.toMatchObject({ ok: false, status: 502 });
    }
    await expect(
      verifyTokenResponse(
        { access_token: 'broken', refresh_token: 'refresh' },
        production,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    await expect(
      verifyTokenResponse(
        {
          access_token: `${encode({})}.${encode('primitive')}.signature`,
          refresh_token: 'refresh',
        },
        production,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    await expect(
      verifyTokenResponse(
        { access_token: 'header.ey.signature', refresh_token: 'refresh' },
        production,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    await expect(
      verifyTokenResponse(
        {
          access_token: jwt({
            aud: ['authenticated'],
            aal: 'aal1',
            iat: undefined,
          }),
          refresh_token: 'refresh',
          id_token: jwt({ nonce: 'expected' }),
        },
        production,
        new AbortController().signal,
        'expected',
      ),
    ).resolves.toMatchObject({ ok: true, value: { stepUpAt: null } });
  });

  it('rejects invalid user verification payloads and verification outages', async () => {
    for (const response of [json(null), json({ id: 'not-a-uuid' })]) {
      await expect(
        verifyTokenResponse(
          { access_token: jwt(), refresh_token: 'refresh' },
          config(vi.fn(async () => response)),
          new AbortController().signal,
        ),
      ).resolves.toMatchObject({ ok: false, status: 502 });
    }
    await expect(
      verifyTokenResponse(
        { access_token: jwt(), refresh_token: 'refresh' },
        config(vi.fn(async () => Promise.reject(new Error('offline')))),
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 503 });
  });

  it('accepts local configuration and exercises production entropy defaults', () => {
    const local = normalizeAuthProductionOptions({
      environment: {
        ...environment,
        SUPABASE_URL: 'http://127.0.0.1:54321',
      },
    });
    expect(local.randomBytes(4)).toHaveLength(4);
    expect(local.fetchImpl).toBe(globalThis.fetch);
  });

  it('covers route-policy failure, rate dependency failure, and stale step-up', async () => {
    expect(() => policyFor('AUTH-API-99' as never)).toThrow(
      'Missing auth policy',
    );
    expect(
      isStepUpFresh(
        {
          authUserId: AUTH_USER_ID,
          sessionId: SESSION_ID,
          accountState: 'active',
          personId: null,
          actingPartyId: null,
          expiresAt: '2026-09-01T05:00:00Z',
          stepUpAt: 'not-a-time',
        },
        NOW,
      ),
    ).toBe(false);
    expect(
      isStepUpFresh(
        {
          authUserId: AUTH_USER_ID,
          sessionId: SESSION_ID,
          accountState: 'active',
          personId: null,
          actingPartyId: null,
          expiresAt: '2026-09-01T05:00:00Z',
          stepUpAt: '2026-09-01T03:00:00Z',
        },
        NOW,
      ),
    ).toBe(false);
    const context = {
      req: {
        raw: new Request('https://api.example.test/api/v1/auth/providers'),
      },
      env: environment,
      header: vi.fn(),
      set: vi.fn(),
      get: vi.fn(() => '11111111-1111-4111-8111-111111111111'),
      json: vi.fn((value: unknown, status: number) =>
        Response.json(value, { status }),
      ),
    } as never;
    const dependencies = {
      rateLimit: vi.fn(async () => ({
        ok: false as const,
        status: 503 as const,
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'offline',
        details: {},
      })),
    } as unknown as AuthenticationDependencies;
    await expect(
      enforceRate(context, dependencies, 'AUTH-API-01', null),
    ).resolves.toMatchObject({ status: 503 });
  });

  it('fails closed if the URL implementation itself rejects a return path', () => {
    const RealUrl = URL;
    vi.stubGlobal(
      'URL',
      class {
        constructor() {
          throw new Error('parser unavailable');
        }
      },
    );
    try {
      expect(isRelativeFirstPartyPath('/app')).toBe(false);
    } finally {
      vi.stubGlobal('URL', RealUrl);
    }
  });
});
