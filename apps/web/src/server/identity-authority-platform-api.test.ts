import { describe, expect, it, vi } from 'vitest';

import {
  copyIdentityAuthorityCookies,
  filterIdentityAuthorityCookies,
  forwardIdentityAuthorityRequest,
} from './identity-authority-platform-api.ts';

const requestId = '11111111-1111-4111-8111-111111111111';

describe('identity authority web service boundary', () => {
  it('keeps only authentication cookies and preserves values', () => {
    expect(
      filterIdentityAuthorityCookies(
        'analytics=do-not-forward; wj_session_ref=session; wj_csrf=csrf; wj_access=access',
      ),
    ).toBe('wj_session_ref=session; wj_csrf=csrf; wj_access=access');
    expect(filterIdentityAuthorityCookies('analytics=only')).toBeNull();
    expect(filterIdentityAuthorityCookies(null)).toBeNull();
  });

  it('forwards PATCH and approved headers without authority injection', async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const forwarded = input as Request;
      expect(forwarded.method).toBe('PATCH');
      expect(forwarded.url).toBe(
        'https://web.example/api/v1/aliases/22222222-2222-4222-8222-222222222222?tab=aliases',
      );
      expect(forwarded.headers.get('cookie')).toBe(
        'wj_session_ref=session; wj_csrf=csrf',
      );
      expect(forwarded.headers.get('if-match')).toBe('"7"');
      expect(forwarded.headers.get('idempotency-key')).toBe('key-03');
      expect(forwarded.headers.get('authorization')).toBeNull();
      expect(forwarded.headers.get('x-acting-party-id')).toBeNull();
      await expect(forwarded.json()).resolves.toEqual({
        displayName: 'Neon Harbor Live',
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          'content-type': 'application/json',
          etag: '"8"',
          'x-request-id': requestId,
          'x-internal-secret': 'never-forward',
        },
      });
    });

    const response = await forwardIdentityAuthorityRequest(
      new Request(
        'https://web.example/api/v1/aliases/22222222-2222-4222-8222-222222222222?tab=aliases',
        {
          method: 'PATCH',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            cookie: 'wj_session_ref=session; wj_csrf=csrf; analytics=secret',
            'if-match': '"7"',
            'idempotency-key': 'key-03',
            authorization: 'Bearer must-not-forward',
            'x-acting-party-id': 'attacker-controlled',
          },
          body: JSON.stringify({ displayName: 'Neon Harbor Live' }),
        },
      ),
      { fetch },
      '/api/v1/aliases/22222222-2222-4222-8222-222222222222',
      'PATCH',
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toBe('"8"');
    expect(response.headers.get('x-internal-secret')).toBeNull();
  });

  it('omits credentials for the anonymous public projection', async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const forwarded = input as Request;
      expect(forwarded.headers.get('cookie')).toBeNull();
      expect(forwarded.headers.get('x-csrf-token')).toBeNull();
      expect(forwarded.headers.get('if-match')).toBeNull();
      expect(forwarded.headers.get('idempotency-key')).toBeNull();
      return Response.json({ public: true });
    });

    await expect(
      forwardIdentityAuthorityRequest(
        new Request('https://web.example/public', {
          headers: {
            cookie: 'wj_access=secret; wj_csrf=csrf',
            'x-csrf-token': 'csrf',
            'if-match': '"1"',
            'idempotency-key': 'key',
          },
        }),
        { fetch },
        '/api/v1/identity/parties/11111111-1111-4111-8111-111111111111/projection',
        'GET',
        { credentials: 'omit' },
      ),
    ).resolves.toMatchObject({ status: 200 });
  });

  it('returns a typed no-store 503 for missing, throwing, unsafe, or invalid paths', async () => {
    const request = new Request('https://web.example/identity', {
      headers: { 'x-request-id': requestId },
    });
    for (const binding of [
      undefined,
      { fetch: vi.fn(async () => Promise.reject(new Error('offline'))) },
      {
        fetch: vi.fn(
          async () => new Response('upstream text', { status: 503 }),
        ),
      },
    ]) {
      const response = await forwardIdentityAuthorityRequest(
        request,
        binding,
        '/api/v1/me/identity',
        'GET',
      );
      expect(response.status).toBe(503);
      expect(response.headers.get('cache-control')).toBe('no-store');
      await expect(response.json()).resolves.toMatchObject({
        code: 'DEPENDENCY_UNAVAILABLE',
        requestId,
      });
    }
    await expect(
      forwardIdentityAuthorityRequest(
        request,
        { fetch: vi.fn() },
        '/api/v1/me/identity%0d%0aSet-Cookie: leak',
        'GET',
      ),
    ).resolves.toMatchObject({ status: 503 });
  });

  it('copies only approved authentication Set-Cookie values', () => {
    const source = new Response(null, {
      headers: [
        ['set-cookie', 'wj_session_ref=session; HttpOnly; Secure'],
        ['set-cookie', 'provider_token=secret; HttpOnly; Secure'],
      ],
    });
    const target = new Headers();
    copyIdentityAuthorityCookies(source, target);
    expect(target.get('set-cookie')).toContain('wj_session_ref=session');
    expect(target.get('set-cookie')).not.toContain('provider_token');
  });
});
