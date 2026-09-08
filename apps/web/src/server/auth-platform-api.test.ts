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
});
