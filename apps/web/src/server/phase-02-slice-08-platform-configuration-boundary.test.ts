import { describe, expect, it, vi } from 'vitest';

import {
  forwardPlatformConfigurationRequest,
  PLATFORM_CONFIGURATION_BROWSER_ROUTES,
  type PlatformConfigurationPlatformApiBinding,
} from './platform-configuration-platform-api';

const ACTIVE_ROUTES = [
  {
    operationId: 'CFG-05B-01',
    method: 'GET',
    path: '/api/v1/admin/inbox',
  },
  {
    operationId: 'CFG-05B-04',
    method: 'POST',
    path: '/api/v1/admin/capability-grants/actions',
  },
  {
    operationId: 'CFG-05B-05',
    method: 'POST',
    path: '/api/v1/admin/audit-diagnostics/actions',
  },
] as const;

const DEFERRED_ROUTES = [
  { operationId: 'CFG-05B-02', method: 'POST', path: '/api/v1/admin/search' },
  {
    operationId: 'CFG-05B-03',
    method: 'POST',
    path: '/api/v1/admin/bulk-operations',
  },
] as const;

type BoundaryBinding = Readonly<{
  fetch: PlatformConfigurationPlatformApiBinding['fetch'];
  forwardedRequest: () => Request | null;
}>;

const makeBinding = (): BoundaryBinding => {
  let forwardedRequest: Request | null = null;
  const fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      forwardedRequest =
        input instanceof Request ? input : new Request(input, init);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  );
  return { fetch, forwardedRequest: () => forwardedRequest };
};

describe('Phase 2 Slice 08 browser boundary', () => {
  it('[P2-S08-AC-004, P2-S08-AC-032, P2-S08-AC-033] allowlists only inbox, capability, and audit/notification operations', () => {
    const routes = PLATFORM_CONFIGURATION_BROWSER_ROUTES.map(
      ({ operationId, method, path }) => ({ operationId, method, path }),
    );

    for (const expected of ACTIVE_ROUTES) {
      expect(routes).toContainEqual(expected);
    }
    for (const deferred of DEFERRED_ROUTES) {
      expect(routes).not.toContainEqual(deferred);
    }
    expect(
      routes.filter(({ operationId }) => operationId.startsWith('CFG-05B')),
    ).toEqual(ACTIVE_ROUTES);
  });

  it('[P2-S08-AC-001, P2-S08-AC-004, P2-S08-AC-032, P2-S08-AC-033] forwards active routes while refusing deferred search and bulk paths', async () => {
    for (const route of ACTIVE_ROUTES) {
      const binding = makeBinding();
      const response = await forwardPlatformConfigurationRequest(
        new Request(`https://web.example${route.path}`, {
          method: route.method,
          headers: {
            cookie: 'wj_access=verified; tracking=discard',
            origin: 'https://web.example',
            'x-provider-role': 'admin',
            'x-configuration-capability': 'admin.wildcard',
          },
          ...(route.method === 'POST'
            ? {
                body: JSON.stringify({
                  operationId: route.operationId,
                  reason: 'bounded test request',
                }),
              }
            : {}),
        }),
        binding,
        route.path,
        route.method,
      );
      expect(response.status).toBe(200);
      expect(binding.fetch).toHaveBeenCalledOnce();
      const forwarded = binding.forwardedRequest();
      expect(forwarded).toBeInstanceOf(Request);
      if (forwarded === null) continue;
      expect(forwarded.headers.get('x-provider-role')).toBeNull();
      expect(forwarded.headers.get('x-configuration-capability')).toBeNull();
      expect(forwarded.headers.get('cookie')).toBe('wj_access=verified');
    }

    for (const route of DEFERRED_ROUTES) {
      const binding = makeBinding();
      const response = await forwardPlatformConfigurationRequest(
        new Request(`https://web.example${route.path}`, {
          method: route.method,
          headers: {
            cookie: 'wj_access=verified',
            origin: 'https://web.example',
          },
          body: JSON.stringify({ operationId: route.operationId }),
        }),
        binding,
        route.path,
        route.method,
      );
      expect(response.status).toBe(404);
      expect(binding.fetch).not.toHaveBeenCalled();
    }
  });
});
