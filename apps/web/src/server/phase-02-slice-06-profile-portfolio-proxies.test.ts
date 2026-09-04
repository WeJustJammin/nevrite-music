import { describe, expect, it, vi } from 'vitest';

import {
  filterProfilePortfolioCookies,
  forwardProfilePortfolioRequest,
  hasProfilePortfolioSession,
  PROFILE_PORTFOLIO_COOKIE_NAMES,
  PROFILE_PORTFOLIO_REQUEST_HEADERS,
  PROFILE_PORTFOLIO_RESPONSE_HEADERS,
  PROFILE_PORTFOLIO_ROUTE_CONTRACTS,
} from './profile-portfolio-platform-api';

const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const REQUEST_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dc';

const json = (value: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

describe('P2-S06 profile portfolio same-origin platform façade', () => {
  it('[P2-S06-AC-003..008, P2-S06-AC-015..020, P2-S06-AC-021..026] registers active profile, section, emphasis, portfolio, and reel routes', () => {
    const active = PROFILE_PORTFOLIO_ROUTE_CONTRACTS.filter(
      (route) => route.deferred === false,
    ).map(({ operationId, method, path }) => ({ operationId, method, path }));
    expect(active).toEqual([
      {
        operationId: 'PRF-PROF-01',
        method: 'GET',
        path: '/api/v1/profiles/:partyId',
      },
      {
        operationId: 'PRF-PROF-02',
        method: 'GET',
        path: '/api/v1/profiles/:partyId/sections/:sectionCode/revisions',
      },
      {
        operationId: 'PRF-PROF-03',
        method: 'PUT',
        path: '/api/v1/profiles/:partyId/sections/:sectionCode',
      },
      {
        operationId: 'PRF-PROF-04',
        method: 'PUT',
        path: '/api/v1/profiles/:partyId/emphasis',
      },
      {
        operationId: 'PRF-PROF-05',
        method: 'GET',
        path: '/api/v1/profiles/:partyId/portfolio',
      },
      {
        operationId: 'PRF-PROF-06',
        method: 'GET',
        path: '/api/v1/profiles/:partyId/reel',
      },
      {
        operationId: 'PRF-PROF-07',
        method: 'POST',
        path: '/api/v1/profiles/:partyId/reel-items',
      },
      {
        operationId: 'PRF-PROF-08',
        method: 'PUT',
        path: '/api/v1/reel-items/:reelItemId',
      },
      {
        operationId: 'PRF-PROF-09',
        method: 'DELETE',
        path: '/api/v1/reel-items/:reelItemId',
      },
      {
        operationId: 'PRF-PROF-10',
        method: 'POST',
        path: '/internal/v1/profile-fact-observations',
      },
      {
        operationId: 'PRF-PROF-11',
        method: 'GET',
        path: '/api/v1/profiles/:partyId/emphasis',
      },
    ]);
    expect(
      PROFILE_PORTFOLIO_ROUTE_CONTRACTS.filter((route) => route.deferred).every(
        (route) => route.operationId.startsWith('PRF-EPK-'),
      ),
    ).toBe(true);
  });

  it('[P2-S06-AC-080..088, P2-S06-AC-095..102] keeps EPK/share route controls explicitly deferred', () => {
    const paths = PROFILE_PORTFOLIO_ROUTE_CONTRACTS.filter((route) =>
      route.operationId.startsWith('PRF-EPK-'),
    );
    expect(paths.every((route) => Boolean(route.deferred))).toBe(true);
    expect(paths.every((route) => route.path.includes('epk'))).toBe(true);
    expect(
      PROFILE_PORTFOLIO_ROUTE_CONTRACTS.filter(
        (route) => route.deferred === false,
      ).some((route) => route.path.includes('epk')),
    ).toBe(false);
  });

  it('[P2-S06-AC-004, P2-S06-AC-016, P2-S06-AC-022, P2-S06-AC-028, P2-S06-AC-034, P2-S06-AC-040, P2-S06-AC-046] allowlists session cookies and browser transport headers', () => {
    expect(PROFILE_PORTFOLIO_COOKIE_NAMES).toEqual([
      'wj_access',
      'wj_refresh',
      'wj_session_ref',
      'wj_csrf',
      'wj_auth_flow',
    ]);
    expect(filterProfilePortfolioCookies(null)).toBeNull();
    expect(
      filterProfilePortfolioCookies(
        'wj_access=a; private=secret; wj_csrf=c; malformed; wj_session_ref=s',
      ),
    ).toBe('wj_access=a; wj_csrf=c; wj_session_ref=s');
    expect(filterProfilePortfolioCookies('private=secret')).toBeNull();
    expect(PROFILE_PORTFOLIO_REQUEST_HEADERS).toContain('if-match');
    expect(PROFILE_PORTFOLIO_REQUEST_HEADERS).toContain('idempotency-key');
    expect(PROFILE_PORTFOLIO_REQUEST_HEADERS).not.toContain('authorization');
    expect(PROFILE_PORTFOLIO_RESPONSE_HEADERS.has('content-type')).toBe(true);
    expect(PROFILE_PORTFOLIO_RESPONSE_HEADERS.has('set-cookie')).toBe(false);
  });

  it('[P2-S06-AC-005, P2-S06-AC-011, P2-S06-AC-017, P2-S06-AC-023, P2-S06-AC-029, P2-S06-AC-035, P2-S06-AC-041] detects a session without trusting caller role/context labels', () => {
    expect(
      hasProfilePortfolioSession(
        new Request('https://wejamm.in/app/profiles-verification'),
      ),
    ).toBe(false);
    expect(
      hasProfilePortfolioSession(
        new Request('https://wejamm.in/app/profiles-verification', {
          headers: { cookie: 'role=admin; wj_csrf=csrf' },
        }),
      ),
    ).toBe(false);
    expect(
      hasProfilePortfolioSession(
        new Request('https://wejamm.in/app/profiles-verification', {
          headers: { cookie: 'wj_session_ref=session; role=anonymous' },
        }),
      ),
    ).toBe(true);
  });

  it('[P2-S06-AC-006, P2-S06-AC-012, P2-S06-AC-018, P2-S06-AC-024, P2-S06-AC-030, P2-S06-AC-036, P2-S06-AC-042, P2-S06-AC-048, P2-S06-AC-054, P2-S06-AC-060, P2-S06-AC-066, P2-S06-AC-072, P2-S06-AC-078] forwards a same-origin request with its version/idempotency binding intact', async () => {
    const calls: Request[] = [];
    const binding = {
      fetch: vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const upstream = new Request(input, init);
        calls.push(upstream);
        return json({ ok: true }, 200, {
          etag: '"8"',
          'x-provider-secret': 'must-not-forward',
          'x-request-id': REQUEST_ID,
        });
      }),
    };
    const request = new Request(
      `https://wejamm.in/api/v1/profiles/${PARTY_ID}/sections/about`,
      {
        method: 'PUT',
        headers: {
          origin: 'https://wejamm.in',
          cookie: 'wj_session_ref=session; secret=not-forwarded',
          'content-type': 'application/json',
          'if-match': '"7"',
          'idempotency-key': 'profile-edit-1',
          authorization: 'Bearer should-not-forward',
          'x-request-id': REQUEST_ID,
        },
        body: JSON.stringify({ label: 'About' }),
      },
    );
    const response = await forwardProfilePortfolioRequest(
      request,
      binding,
      `/api/v1/profiles/${PARTY_ID}/sections/about`,
      'PUT',
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.headers.get('if-match')).toBe('"7"');
    expect(calls[0]?.headers.get('idempotency-key')).toBe('profile-edit-1');
    expect(calls[0]?.headers.get('cookie')).toBe('wj_session_ref=session');
    expect(calls[0]?.headers.get('authorization')).toBeNull();
    expect(calls[0]?.headers.get('origin')).toBe(
      'https://profile-portfolio.internal',
    );
  });

  it('[P2-S06-AC-007, P2-S06-AC-013, P2-S06-AC-019, P2-S06-AC-025, P2-S06-AC-031, P2-S06-AC-037, P2-S06-AC-043, P2-S06-AC-049, P2-S06-AC-055, P2-S06-AC-061, P2-S06-AC-067, P2-S06-AC-073, P2-S06-AC-079, P2-S06-AC-103..110] fails closed for origin, binding, upstream, and content-type errors', async () => {
    const request = new Request(
      `https://wejamm.in/api/v1/profiles/${PARTY_ID}`,
      {
        headers: { origin: 'https://evil.invalid', 'x-request-id': REQUEST_ID },
      },
    );
    const forbidden = await forwardProfilePortfolioRequest(
      request,
      { fetch: async () => json({ ok: true }) },
      `/api/v1/profiles/${PARTY_ID}`,
      'GET',
    );
    expect(forbidden.status).toBe(403);
    expect(((await forbidden.json()) as { code?: string }).code).toBe(
      'FORBIDDEN',
    );

    const unavailable = await forwardProfilePortfolioRequest(
      new Request(`https://wejamm.in/api/v1/profiles/${PARTY_ID}`),
      null,
      `/api/v1/profiles/${PARTY_ID}`,
      'GET',
    );
    expect(unavailable.status).toBe(503);
    expect(((await unavailable.json()) as { code?: string }).code).toBe(
      'DEPENDENCY_UNAVAILABLE',
    );

    const badContentType = await forwardProfilePortfolioRequest(
      new Request(`https://wejamm.in/api/v1/profiles/${PARTY_ID}`),
      { fetch: async () => new Response('oops', { status: 200 }) },
      `/api/v1/profiles/${PARTY_ID}`,
      'GET',
    );
    expect(badContentType.status).toBe(503);
    expect(
      typeof ((await badContentType.json()) as { requestId?: unknown })
        .requestId,
    ).toBe('string');
  });
});
