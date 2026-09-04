import { describe, expect, it, vi } from 'vitest';

import { forwardIdentityAuthorityRequest } from './identity-authority-platform-api.ts';

const requestId = '11111111-1111-4111-8111-111111111111';

interface RouteContract {
  readonly method: 'DELETE' | 'GET' | 'POST';
  readonly path: string;
  readonly anonymous?: boolean;
}

const routeContracts: readonly RouteContract[] = [
  {
    method: 'POST',
    path: '/api/v1/organizations',
  },
  {
    method: 'GET',
    path: '/api/v1/organizations/organization-04',
    anonymous: true,
  },
  {
    method: 'POST',
    path: '/api/v1/organizations/organization-04/type-assignments',
  },
  {
    method: 'DELETE',
    path: '/api/v1/organizations/organization-04/type-assignments/assignment-04',
  },
  {
    method: 'POST',
    path: '/api/v1/organizations/organization-04/membership-invitations',
  },
  {
    method: 'POST',
    path: '/api/v1/organizations/organization-04/membership-assertions',
  },
  {
    method: 'GET',
    path: '/api/v1/organizations/organization-04/memberships',
  },
  {
    method: 'POST',
    path: '/api/v1/membership-tenures/tenure-04/accept',
  },
  {
    method: 'POST',
    path: '/api/v1/membership-tenures/tenure-04/end',
  },
  {
    method: 'POST',
    path: '/api/v1/membership-tenures/tenure-04/capacity-periods',
  },
];

describe('P2-S04 same-origin API proxies', () => {
  it('covers every active ORG, TYPE, and MEM route contract', () => {
    expect(routeContracts).toHaveLength(10);
    expect(routeContracts.map(({ method }) => method)).toEqual([
      'POST',
      'GET',
      'POST',
      'DELETE',
      'POST',
      'POST',
      'GET',
      'POST',
      'POST',
      'POST',
    ]);
  });

  it('forwards methods, JSON bodies, safe cookies, and CAS headers while filtering response headers', async () => {
    for (const route of routeContracts.filter(({ anonymous }) => !anonymous)) {
      const upstream = vi.fn(async (input: RequestInfo | URL) => {
        const forwarded = input as Request;
        expect(forwarded.method).toBe(route.method);
        expect(new URL(forwarded.url).pathname).toBe(route.path);
        expect(forwarded.headers.get('cookie')).toBe(
          'wj_session_ref=session; wj_csrf=csrf',
        );
        expect(forwarded.headers.get('if-match')).toBe('"7"');
        expect(forwarded.headers.get('idempotency-key')).toBe('key-s04');
        expect(forwarded.headers.get('authorization')).toBeNull();
        expect(forwarded.headers.get('x-acting-party-id')).toBeNull();
        if (route.method !== 'GET') {
          await expect(forwarded.json()).resolves.toEqual({
            command: route.method,
          });
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: {
            'content-type': 'application/json',
            etag: '"8"',
            'x-request-id': requestId,
            'x-private-upstream': 'never-expose',
          },
        });
      });
      const response = await forwardIdentityAuthorityRequest(
        new Request(`https://web.example${route.path}?tab=relationships`, {
          method: route.method,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            cookie: 'wj_session_ref=session; wj_csrf=csrf; analytics=secret',
            'if-match': '"7"',
            'idempotency-key': 'key-s04',
            authorization: 'Bearer attacker-controlled',
            'x-acting-party-id': 'attacker-controlled',
          },
          ...(route.method === 'GET'
            ? {}
            : { body: JSON.stringify({ command: route.method }) }),
        }),
        { fetch: upstream },
        route.path,
        route.method,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('etag')).toBe('"8"');
      expect(response.headers.get('x-private-upstream')).toBeNull();
    }
  });

  it('keeps ORG-02 anonymous even when the browser supplies session material', async () => {
    const upstream = vi.fn(async (input: RequestInfo | URL) => {
      const forwarded = input as Request;
      expect(forwarded.headers.get('cookie')).toBeNull();
      expect(forwarded.headers.get('x-csrf-token')).toBeNull();
      expect(forwarded.headers.get('if-match')).toBeNull();
      expect(forwarded.headers.get('idempotency-key')).toBeNull();
      return Response.json({ lifecycle: 'active' });
    });
    const response = await forwardIdentityAuthorityRequest(
      new Request('https://web.example/app/identity-authority', {
        headers: {
          cookie: 'wj_access=secret; wj_csrf=csrf',
          'x-csrf-token': 'csrf',
          'if-match': '"7"',
          'idempotency-key': 'key-s04',
        },
      }),
      { fetch: upstream },
      '/api/v1/organizations/organization-04',
      'GET',
      { credentials: 'omit' },
    );
    expect(response.status).toBe(200);
  });

  it('returns typed no-store 503 dependency errors for unavailable or non-JSON upstreams', async () => {
    const request = new Request('https://web.example/api/v1/organizations', {
      method: 'POST',
      headers: {
        'x-request-id': requestId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ mode: 'self_member', typeCodes: ['band'] }),
    });
    for (const binding of [
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
        '/api/v1/organizations',
        'POST',
      );
      expect(response.status).toBe(503);
      expect(response.headers.get('cache-control')).toBe('no-store');
      await expect(response.json()).resolves.toMatchObject({
        code: 'DEPENDENCY_UNAVAILABLE',
        requestId,
      });
    }
  });
});
