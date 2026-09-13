import { describe, expect, it, vi } from 'vitest';

import { forwardPrivateOrganizationRead } from './identity-authority-private-organization-read';

const organizationId = '22222222-2222-4222-8222-222222222221';
const requestId = '11111111-1111-4111-8111-111111111111';
const clientBindingId = 'tab:stable-04';

const privateOrganization = {
  organizationId,
  ownershipState: 'owned',
  lifecycle: 'active',
  typeCodes: ['band'],
  version: '8',
  etag: '"8"',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

const makeRequest = (headers: HeadersInit = {}) =>
  new Request('https://web.example/api/v1/me/organizations/ignored', {
    headers: {
      accept: 'application/json',
      cookie: 'wj_access=access; wj_csrf=csrf; analytics=discard',
      'x-client-binding-id': clientBindingId,
      'x-request-id': requestId,
      authorization: 'Bearer browser-must-not-forward',
      ...Object.fromEntries(new Headers(headers)),
    },
  });

describe('authenticated private organization projection facade', () => {
  it('forwards the authenticated tab binding to the canonical organization read and forces no-store', async () => {
    const upstream = vi.fn(async (input: RequestInfo | URL) => {
      const forwarded = input as Request;
      expect(new URL(forwarded.url).pathname).toBe(
        `/api/v1/organizations/${organizationId}`,
      );
      expect(forwarded.headers.get('cookie')).toBe(
        'wj_access=access; wj_csrf=csrf',
      );
      expect(forwarded.headers.get('x-client-binding-id')).toBe(
        clientBindingId,
      );
      expect(forwarded.headers.get('authorization')).toBeNull();
      const upstreamResponse = Response.json(privateOrganization, {
        headers: { 'cache-control': 'public, max-age=60' },
      });
      upstreamResponse.headers.set('content-encoding', 'gzip');
      upstreamResponse.headers.set('content-length', '1');
      upstreamResponse.headers.set('content-md5', 'stale-digest');
      return upstreamResponse;
    });

    const response = await forwardPrivateOrganizationRead(
      makeRequest(),
      { fetch: upstream },
      organizationId,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-encoding')).toBeNull();
    expect(response.headers.get('content-length')).toBeNull();
    expect(response.headers.get('content-md5')).toBeNull();
    await expect(response.json()).resolves.toEqual(privateOrganization);
  });

  it.each([
    ['missing session', { cookie: 'wj_csrf=csrf' }, 401],
    ['missing client binding', { 'x-client-binding-id': '' }, 400],
  ])(
    'fails closed for %s before calling the Worker',
    async (_label, headers, status) => {
      const upstream = vi.fn(async () => Response.json(privateOrganization));

      const response = await forwardPrivateOrganizationRead(
        makeRequest(headers),
        { fetch: upstream },
        organizationId,
      );

      expect(response.status).toBe(status);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(upstream).not.toHaveBeenCalled();
    },
  );

  it('rejects an anonymous public organization projection on this private facade', async () => {
    const upstream = vi.fn(async () =>
      Response.json({
        organizationId,
        typeDisplay: ['Band'],
        lifecycleLabel: 'Active',
        version: '8',
      }),
    );

    const response = await forwardPrivateOrganizationRead(
      makeRequest(),
      { fetch: upstream },
      organizationId,
    );

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_INVALID_RESPONSE',
      requestId,
    });
  });
});
