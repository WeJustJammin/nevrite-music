import { describe, expect, it, vi } from 'vitest';

import { forwardAuthRequest } from './auth-platform-api';

describe('authentication platform API forwarding', () => {
  it('forwards the optional per-tab context selector to the verified session read', async () => {
    let forwardedRequest: Request | undefined;
    const binding = {
      fetch: vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        forwardedRequest = new Request(input, init);
        return Promise.resolve(Response.json({ authenticated: true }));
      }),
    };

    await forwardAuthRequest(
      new Request('https://app.example.test/api/v1/auth/session', {
        headers: {
          cookie: 'wj_session_ref=session-reference',
          'x-client-binding-id': 'tab:auth-session-01',
        },
      }),
      binding,
      '/api/v1/auth/session',
      'GET',
    );

    expect(forwardedRequest?.headers.get('x-client-binding-id')).toBe(
      'tab:auth-session-01',
    );
  });

  it('preserves callback redirects for the browser instead of following them inside the API Worker', async () => {
    let forwardedRequest: Request | undefined;
    const binding = {
      fetch: vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        forwardedRequest = new Request(input, init);
        return Promise.resolve(
          new Response(null, {
            status: 303,
            headers: {
              location: '/app/cms-content-modeling',
              'set-cookie':
                'wj_session_ref=session-reference; HttpOnly; Secure; SameSite=Lax',
            },
          }),
        );
      }),
    };

    const response = await forwardAuthRequest(
      new Request(
        'https://staging.example.test/auth/callback?code=provider-code&state=application-state',
        { headers: { cookie: 'wj_auth_flow=sealed-flow' } },
      ),
      binding,
      '/auth/callback',
      'GET',
    );

    expect(forwardedRequest?.redirect).toBe('manual');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/app/cms-content-modeling');
    expect(response.headers.get('set-cookie')).toContain('wj_session_ref=');
  });

  it('uses the Cloudflare Headers getAll API to preserve each callback cookie', async () => {
    const allowedCookies = [
      'wj_access=access; HttpOnly; Secure; SameSite=Lax; Path=/',
      'wj_refresh=refresh; HttpOnly; Secure; SameSite=Strict; Path=/',
      'wj_session_ref=reference; HttpOnly; Secure; SameSite=Lax; Path=/',
      'wj_csrf=csrf; Secure; SameSite=Lax; Path=/',
      'wj_auth_flow=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/',
    ];
    const upstreamCookies = [
      ...allowedCookies,
      'provider_token=must-not-reach-browser; HttpOnly; Secure; Path=/',
    ];
    const rawHeaders = new Headers({
      location: '/app/cms-content-modeling',
    });
    for (const cookie of upstreamCookies)
      rawHeaders.append('set-cookie', cookie);
    const upstreamHeaders = {
      get: rawHeaders.get.bind(rawHeaders),
      getAll: (name: string) =>
        name.toLowerCase() === 'set-cookie' ? upstreamCookies : [],
      getSetCookie: () => [upstreamCookies.at(-1)!],
      forEach: (
        callback: (value: string, key: string, parent: Headers) => void,
      ) => {
        callback('/app/cms-content-modeling', 'location', rawHeaders);
        callback(upstreamCookies.join(', '), 'set-cookie', rawHeaders);
      },
    } as unknown as Headers;
    const binding = {
      fetch: vi.fn(() =>
        Promise.resolve({
          body: null,
          headers: upstreamHeaders,
          status: 303,
        } as unknown as Response),
      ),
    };

    const response = await forwardAuthRequest(
      new Request(
        'https://staging.example.test/auth/callback?code=provider-code&state=application-state',
        { headers: { cookie: 'wj_auth_flow=sealed-flow' } },
      ),
      binding,
      '/auth/callback',
      'GET',
    );
    const returned = response.headers as Headers & {
      getSetCookie: () => string[];
    };

    expect(returned.getSetCookie()).toEqual(allowedCookies);
  });

  it('fails closed when Set-Cookie values are available only as a folded header', async () => {
    const folded =
      'wj_access=access; HttpOnly; Secure; Path=/, provider_token=must-not-reach-browser; HttpOnly; Secure; Path=/';
    const upstreamHeaders = {
      get: (name: string) =>
        name.toLowerCase() === 'set-cookie'
          ? folded
          : name.toLowerCase() === 'location'
            ? '/app/cms-content-modeling'
            : null,
      forEach: (
        callback: (value: string, key: string, parent: Headers) => void,
      ) => {
        callback(
          '/app/cms-content-modeling',
          'location',
          upstreamHeaders as unknown as Headers,
        );
        callback(folded, 'set-cookie', upstreamHeaders as unknown as Headers);
      },
    } as unknown as Headers;
    const response = await forwardAuthRequest(
      new Request(
        'https://staging.example.test/auth/callback?code=provider-code&state=application-state',
      ),
      {
        fetch: vi.fn(() =>
          Promise.resolve({
            body: null,
            headers: upstreamHeaders,
            status: 303,
          } as unknown as Response),
        ),
      },
      '/auth/callback',
      'GET',
    );
    const returned = response.headers as Headers & {
      getSetCookie: () => string[];
    };

    expect(returned.getSetCookie()).toEqual([]);
  });
});
