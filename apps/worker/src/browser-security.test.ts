import { describe, expect, it } from 'vitest';

import {
  verifyBrowserMutationSecurity,
  withOriginVariance,
} from './browser-security';

const TOKEN = 'a'.repeat(32);
const allowedOrigins = new Set(['https://wejamm.in']);

const request = (origin: string | null, token = TOKEN): Request => {
  const headers = new Headers({ 'x-csrf-token': token });
  if (origin !== null) headers.set('origin', origin);
  return new Request('https://api.wejamm.in/api/v1/infrastructure', {
    headers,
    method: 'POST',
  });
};

describe('browser mutation security', () => {
  it('accepts the configured canonical origin and CSRF binding', () => {
    expect(
      verifyBrowserMutationSecurity(request('https://wejamm.in'), {
        allowedOrigins,
        expectedCsrfToken: TOKEN,
      }),
    ).toEqual({ ok: true, origin: 'https://wejamm.in' });
  });

  it.each([
    ['absent', null],
    ['null', 'null'],
    ['foreign', 'https://evil.example'],
    ['malformed', 'not an origin'],
  ])('rejects %s origins indistinguishably', (_name, origin) => {
    expect(
      verifyBrowserMutationSecurity(request(origin), {
        allowedOrigins,
        expectedCsrfToken: TOKEN,
      }),
    ).toEqual({ ok: false, reason: 'BROWSER_SECURITY_REJECTED' });
  });

  it('rejects a mismatched CSRF token', () => {
    expect(
      verifyBrowserMutationSecurity(
        request('https://wejamm.in', 'b'.repeat(32)),
        {
          allowedOrigins,
          expectedCsrfToken: TOKEN,
        },
      ),
    ).toEqual({ ok: false, reason: 'BROWSER_SECURITY_REJECTED' });
  });

  it('marks responses as varying by Origin', () => {
    expect(
      withOriginVariance(new Response(null, { status: 204 })).headers.get(
        'vary',
      ),
    ).toBe('Origin');
  });
});
