import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';
import { verifySameOriginCsrf } from './boundary';
import {
  base64UrlEncode,
  normalizeAuthProductionOptions,
  openFlowCookie,
  sealFlowCookie,
  verifyTokenResponse,
} from './production-support';
import { createProductionAuthenticationDependencies } from './production';
import { createAccountControlFlow } from './production-login-methods';

const AUTH_USER_ID = '22222222-2222-4222-8222-222222222222';
const DUPLICATE_USER_ID = '33333333-3333-4333-8333-333333333333';
const SESSION_ID = '44444444-4444-4444-8444-444444444444';
const INTENT_ID = '55555555-5555-4555-8555-555555555555';
const NOW = Date.parse('2026-09-01T04:00:00Z');
const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'phase-02-slice-02-security-test',
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

const jwt = (overrides: Readonly<Record<string, unknown>> = {}): string =>
  `${encodeJson({ alg: 'RS256', typ: 'JWT' })}.${encodeJson({
    sub: AUTH_USER_ID,
    session_id: SESSION_ID,
    iss: `${environment.SUPABASE_URL}/auth/v1`,
    aud: 'authenticated',
    exp: Math.floor(NOW / 1000) + 3600,
    iat: Math.floor(NOW / 1000),
    aal: 'aal2',
    ...overrides,
  })}.signature`;

const options = (fetchImpl: typeof fetch = vi.fn()) => ({
  environment,
  fetchImpl,
  now: () => NOW,
  randomBytes: (length: number) => new Uint8Array(length).fill(9),
});

const session = {
  authUserId: AUTH_USER_ID,
  sessionId: SESSION_ID,
  accountState: 'active' as const,
  personId: '66666666-6666-4666-8666-666666666666',
  actingPartyId: '66666666-6666-4666-8666-666666666666',
  expiresAt: new Date(NOW + 3600_000).toISOString(),
  stepUpAt: new Date(NOW - 60_000).toISOString(),
};

describe('Slice 02 production security regressions', () => {
  it('derives step-up only from an explicit bounded MFA AMR event', async () => {
    const fetchImpl = vi.fn(async () => json({ id: AUTH_USER_ID }));
    const verify = (amr: unknown) =>
      verifyTokenResponse(
        {
          access_token: jwt({ amr }),
          refresh_token: 'refresh-secret',
        },
        normalizeAuthProductionOptions(options(fetchImpl as typeof fetch)),
        new AbortController().signal,
      );

    await expect(verify(undefined)).resolves.toMatchObject({
      ok: true,
      value: { stepUpAt: null },
    });
    await expect(
      verify([
        null,
        'invalid',
        { method: 'password', timestamp: Math.floor(NOW / 1000) },
        { method: 'totp', timestamp: 'invalid' },
        { method: 'totp', timestamp: 1.5 },
        { method: 'totp', timestamp: 0 },
        { method: 'totp', timestamp: Math.floor(NOW / 1000) + 60 },
      ]),
    ).resolves.toMatchObject({ ok: true, value: { stepUpAt: null } });
    await expect(
      verify([
        { method: 'totp', timestamp: Math.floor(NOW / 1000) - 120 },
        { method: 'webauthn', timestamp: Math.floor(NOW / 1000) - 30 },
      ]),
    ).resolves.toMatchObject({
      ok: true,
      value: { stepUpAt: new Date(NOW - 30_000).toISOString() },
    });
  });

  it('requires local OIDC nonce and provider-subject evidence', async () => {
    const verify = (payload: unknown, user: unknown) =>
      verifyTokenResponse(
        payload,
        normalizeAuthProductionOptions(
          options(vi.fn(async () => json(user)) as typeof fetch),
        ),
        new AbortController().signal,
        'expected-nonce',
        'google',
      );
    const access = jwt();
    await expect(
      verify(
        { access_token: access, refresh_token: 'refresh' },
        { id: AUTH_USER_ID },
      ),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    await expect(
      verify(
        { access_token: access, refresh_token: 'refresh', id_token: 'broken' },
        { id: AUTH_USER_ID },
      ),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    await expect(
      verify(
        {
          access_token: access,
          refresh_token: 'refresh',
          id_token: jwt({ nonce: 'expected-nonce' }),
        },
        { id: AUTH_USER_ID, identities: [{ provider: 'apple', id: 'wrong' }] },
      ),
    ).resolves.toMatchObject({ ok: false, status: 502 });
    const valid = await verify(
      {
        access_token: access,
        refresh_token: 'refresh',
        id_token: jwt({ nonce: 'expected-nonce' }),
      },
      {
        id: AUTH_USER_ID,
        identities: [
          { provider: 'google', identity_id: 'raw-provider-subject' },
        ],
      },
    );
    expect(valid).toMatchObject({ ok: true });
    expect(valid.ok && valid.value.providerSubjectDigest).not.toContain(
      'raw-provider-subject',
    );
  });

  it.each([
    ['link', 'auth_login_method_link_callback_complete', AUTH_USER_ID],
    [
      'prove_merge',
      'auth_account_merge_proof_callback_complete',
      DUPLICATE_USER_ID,
    ],
  ] as const)(
    'routes %s callbacks to their bound completion without rotating survivor cookies',
    async (intent, expectedRpc, callbackUserId) => {
      const flow = {
        state: `${intent}-state`,
        nonce: `${intent}-nonce`,
        verifier: `${intent}-verifier`,
        provider: 'google',
        intent,
        expiresAt: new Date(NOW + 600_000).toISOString(),
        authUserId: AUTH_USER_ID,
        sessionId: SESSION_ID,
        ...(intent === 'prove_merge'
          ? { mergeId: '77777777-7777-4777-8777-777777777777' }
          : {}),
      } as const;
      const sealed = await sealFlowCookie(
        flow,
        normalizeAuthProductionOptions(options()),
      );
      const calls: string[] = [];
      const fetchImpl = vi.fn(async (input: string | URL | Request) => {
        const url = String(input);
        calls.push(url);
        if (url.includes('/auth/v1/token'))
          return json({
            access_token: jwt({ sub: callbackUserId }),
            refresh_token: 'candidate-refresh',
            id_token: jwt({ nonce: flow.nonce }),
          });
        if (url.endsWith('/auth/v1/user'))
          return json({
            id: callbackUserId,
            identities: [{ provider: 'google', identity_id: 'subject' }],
          });
        return json({ returnPath: '/settings/security' });
      });
      const auth = createProductionAuthenticationDependencies(
        options(fetchImpl as typeof fetch),
      );
      const result = await auth.completeCallback(
        { state: flow.state, code: 'authorization-code' },
        new Request('https://api.example.test/auth/callback', {
          headers: { cookie: `wj_auth_flow=${sealed}` },
        }),
        environment,
        new AbortController().signal,
      );
      expect(result).toMatchObject({
        ok: true,
        value: { location: '/settings/security' },
      });
      expect(calls.some((url) => url.endsWith(`/${expectedRpc}`))).toBe(true);
      expect(calls.some((url) => url.endsWith('/auth_callback_complete'))).toBe(
        false,
      );
      expect(result.ok && result.value.cookies).toEqual([
        expect.stringMatching(/^wj_auth_flow=; Max-Age=0/u),
      ]);
    },
  );

  it('preserves the original MFA event across token refresh', async () => {
    const originalStepUp = new Date(NOW - 9 * 60_000).toISOString();
    const reference = await sealFlowCookie(
      {
        state: SESSION_ID,
        nonce: AUTH_USER_ID,
        verifier: originalStepUp,
        provider: 'session',
        intent: 'session',
        expiresAt: new Date(NOW + 86_400_000).toISOString(),
      },
      normalizeAuthProductionOptions(options()),
    );
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('grant_type=refresh_token'))
        return json({
          access_token: jwt({
            amr: [{ method: 'totp', timestamp: Math.floor(NOW / 1000) }],
          }),
          refresh_token: 'rotated',
        });
      if (url.endsWith('/auth/v1/user')) return json({ id: AUTH_USER_ID });
      if (url.endsWith('/auth_session_register'))
        return json({ registered: true });
      return json({
        accountState: 'active',
        bootstrapState: 'complete',
        personId: session.personId,
        actingPartyId: session.actingPartyId,
      });
    });
    const auth = createProductionAuthenticationDependencies(
      options(fetchImpl as typeof fetch),
    );
    const result = await auth.refreshSession(
      new Request('https://api.example.test/api/v1/auth/session/refresh', {
        headers: {
          cookie: `wj_refresh=refresh; wj_session_ref=${reference}`,
        },
      }),
      environment,
      new AbortController().signal,
    );
    expect(result.ok).toBe(true);
    const rotated = result.ok
      ? result.value.cookies
          .find((cookie) => cookie.startsWith('wj_session_ref='))
          ?.split(';')[0]
          ?.slice('wj_session_ref='.length)
      : undefined;
    expect(rotated).toBeTruthy();
    expect(
      await openFlowCookie(
        rotated ?? '',
        normalizeAuthProductionOptions(options()),
      ),
    ).toMatchObject({ verifier: originalStepUp });
  });

  it('reuses only the actor-bound flow cookie on idempotent authorization replay', async () => {
    const expiresAt = new Date(NOW + 600_000).toISOString();
    const replayFetch = vi.fn(async () =>
      json({ intentId: INTENT_ID, expiresAt, replayed: true }),
    );
    const production = normalizeAuthProductionOptions(
      options(replayFetch as typeof fetch),
    );
    const input = {
      provider: 'google',
      returnTo: '/settings/security',
      session,
      idempotencyKey: 'replay-key',
      ifMatch: '"1"',
    };
    await expect(
      createAccountControlFlow(
        'auth_login_method_link_intent_create',
        input,
        new Request('https://api.example.test/link'),
        production,
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_REPLAY_UNAVAILABLE' });

    const prior = await sealFlowCookie(
      {
        state: 'original-state',
        nonce: 'original-nonce',
        verifier: 'original-verifier',
        provider: 'google',
        intent: 'link',
        expiresAt,
        authUserId: AUTH_USER_ID,
        sessionId: SESSION_ID,
      },
      production,
    );
    const replay = await createAccountControlFlow(
      'auth_login_method_link_intent_create',
      input,
      new Request('https://api.example.test/link', {
        headers: { cookie: `wj_auth_flow=${prior}` },
      }),
      production,
      new AbortController().signal,
    );
    expect(replay.resource.intentId).toBe(INTENT_ID);
    expect(
      new URL(replay.resource.authorizationUrl).searchParams.get('state'),
    ).toBe('original-state');
  });

  it('rejects a CSRF token replayed with another session reference', async () => {
    const random = 'csrf-random';
    const digest = async (reference: string) => {
      const bytes = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`${reference}\u0000${random}`),
      );
      return [...new Uint8Array(bytes)]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    };
    const token = `${random}.${await digest('session-a')}`;
    const csrfRequest = (reference: string) =>
      new Request('https://api.example.test/api/v1/account-merges', {
        headers: {
          origin: 'https://api.example.test',
          cookie: `wj_session_ref=${reference}; wj_csrf=${token}`,
          'x-csrf-token': token,
        },
      });
    await expect(
      verifySameOriginCsrf(csrfRequest('session-a')),
    ).resolves.toBeNull();
    await expect(
      verifySameOriginCsrf(csrfRequest('session-b')),
    ).resolves.toMatchObject({
      status: 403,
    });
  });
});
