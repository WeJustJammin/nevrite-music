import { describe, expect, it, vi } from 'vitest';

import { forwardAuthRequest } from './auth-platform-api';

describe('authentication platform API forwarding', () => {
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

  it('preserves each callback Set-Cookie header independently', async () => {
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
      getSetCookie: () => upstreamCookies,
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
});
