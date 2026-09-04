import { describe, expect, it } from 'vitest';

import { resolveProfilePortfolioPage } from '../../server/profile-portfolio-context';

const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const REQUEST_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dc';

const jsonResponse = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', etag: '"7"' },
  });

const publicProjection = {
  partyId: PARTY_ID,
  projectionVersion: '7',
  cacheKey: 'profile:7',
  layers: [
    { code: 'header', state: 'ready' },
    { code: 'now', state: 'empty' },
    { code: 'record', state: 'denied' },
    { code: 'detail', state: 'unavailable' },
  ],
  portfolio: [
    {
      id: 'portfolio-1',
      creditRef: 'credit-1',
      roleCodes: ['producer'],
      rightsBasis: 'ownership',
      listingState: 'listed',
    },
  ],
  reel: [],
};

const identity = {
  personId: PARTY_ID,
  partyKind: 'person' as const,
  accountState: 'active' as const,
  version: '7',
  facets: [],
  aliases: [],
};

const contexts = {
  projectionVersion: '7',
  items: [
    {
      contextId: PARTY_ID,
      partyId: PARTY_ID,
      kind: 'person' as const,
      label: 'Self',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2026-09-01T19:00:00Z',
    },
  ],
  nextCursor: null,
  hasMore: false,
};

describe('P2-S06 profile portfolio Astro SSR context', () => {
  it('[P2-S06-AC-001, P2-S06-AC-003..008, P2-S06-AC-027..038, P2-S06-AC-111..113] composes an anonymous viewer-safe public page without private reads', async () => {
    const paths: string[] = [];
    const result = await resolveProfilePortfolioPage({
      request: new Request(`https://wejamm.in/profiles/${PARTY_ID}`),
      binding: {
        fetch: async (input: RequestInfo | URL) => {
          const request = new Request(input);
          paths.push(new URL(request.url).pathname);
          return jsonResponse(publicProjection);
        },
      },
      partyId: PARTY_ID,
      requestId: REQUEST_ID,
      surface: 'public',
    });
    expect(result).toMatchObject({
      kind: 'ready',
      page: {
        state: 'ready',
        access: 'read-only',
        actorId: null,
        actingPartyId: null,
        projection: publicProjection,
      },
    });
    expect(paths).toEqual([`/api/v1/profiles/${PARTY_ID}`]);
    expect(JSON.stringify(result)).not.toContain('legalIdentity');
    expect(JSON.stringify(result)).not.toContain('traderAddress');
  });

  it('[P2-S06-AC-001, P2-S06-AC-005, P2-S06-AC-029, P2-S06-AC-035, P2-S06-AC-110] conceals an unclaimed or unreadable public target as disclosure-safe not-found', async () => {
    for (const status of [404, 403]) {
      const result = await resolveProfilePortfolioPage({
        request: new Request(`https://wejamm.in/profiles/${PARTY_ID}`),
        binding: {
          fetch: async () => jsonResponse({ code: 'NOT_FOUND' }, status),
        },
        partyId: PARTY_ID,
        requestId: REQUEST_ID,
        surface: 'public',
      });
      expect(result).toMatchObject({ kind: 'not_found' });
      expect(JSON.stringify(result)).not.toContain(PARTY_ID);
    }
  });

  it('[P2-S06-AC-005, P2-S06-AC-011, P2-S06-AC-017, P2-S06-AC-023, P2-S06-AC-029, P2-S06-AC-035, P2-S06-AC-041] refuses protected SSR reads before identity when session is absent', async () => {
    let reads = 0;
    const result = await resolveProfilePortfolioPage({
      request: new Request(
        `https://wejamm.in/app/profiles-verification?party=${PARTY_ID}`,
      ),
      binding: {
        fetch: async () => {
          reads += 1;
          return jsonResponse(publicProjection);
        },
      },
      partyId: PARTY_ID,
      requestId: REQUEST_ID,
      surface: 'app',
    });
    expect(result).toEqual({ kind: 'unauthenticated' });
    expect(reads).toBe(0);
  });

  it('[P2-S06-AC-015..026, P2-S06-AC-039..079, P2-S06-AC-114..119] derives actor, acting context, CSRF, and capabilities server-side for protected SSR', async () => {
    const paths: string[] = [];
    const result = await resolveProfilePortfolioPage({
      request: new Request(
        `https://wejamm.in/app/profiles-verification?party=${PARTY_ID}`,
        {
          headers: {
            cookie: 'wj_session_ref=session; wj_csrf=csrf; role=admin',
          },
        },
      ),
      binding: {
        fetch: async (input: RequestInfo | URL) => {
          const request = new Request(input);
          const path = new URL(request.url).pathname;
          paths.push(path);
          if (path.endsWith('/me/identity')) return jsonResponse(identity);
          if (path.endsWith('/me/acting-contexts'))
            return jsonResponse(contexts);
          return jsonResponse(publicProjection);
        },
      },
      partyId: PARTY_ID,
      requestId: REQUEST_ID,
      surface: 'app',
    });
    expect(result).toMatchObject({
      kind: 'ready',
      page: {
        state: 'ready',
        actorId: PARTY_ID,
        actingPartyId: PARTY_ID,
        csrfToken: 'csrf',
        projection: publicProjection,
      },
    });
    expect(paths).toEqual([
      '/api/v1/me/identity',
      '/api/v1/me/acting-contexts',
      `/api/v1/profiles/${PARTY_ID}`,
    ]);
    expect(JSON.stringify(result)).not.toContain('role=admin');
  });

  it('[P2-S06-AC-007, P2-S06-AC-013, P2-S06-AC-019, P2-S06-AC-025, P2-S06-AC-031, P2-S06-AC-037, P2-S06-AC-043, P2-S06-AC-049, P2-S06-AC-055, P2-S06-AC-061, P2-S06-AC-067, P2-S06-AC-073, P2-S06-AC-079, P2-S06-AC-103..110] fails closed to a degraded disabled page when the canonical projection is unavailable', async () => {
    const result = await resolveProfilePortfolioPage({
      request: new Request(`https://wejamm.in/profiles/${PARTY_ID}`),
      binding: {
        fetch: async () =>
          jsonResponse({ code: 'DEPENDENCY_UNAVAILABLE' }, 503),
      },
      partyId: PARTY_ID,
      requestId: REQUEST_ID,
      surface: 'public',
    });
    expect(result).toMatchObject({
      kind: 'ready',
      page: { state: 'degraded', access: 'disabled', projection: null },
    });
    expect(JSON.stringify(result)).toContain(REQUEST_ID);
  });
});
