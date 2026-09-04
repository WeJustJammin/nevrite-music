import { describe, expect, it } from 'vitest';

import { resolveProfileOwnershipPage } from '../../server/profile-ownership-context';

const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const CLAIM_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const REQUEST_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dc';

const jsonResponse = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const identity = {
  personId: PARTY_ID,
  partyKind: 'person' as const,
  accountState: 'active' as const,
  version: '2',
  facets: [],
  aliases: [],
};
const contexts = {
  projectionVersion: '2',
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
const claim = {
  id: CLAIM_ID,
  state: 'proving' as const,
  targetPartyId: PARTY_ID,
  controlLevel: 'none' as const,
  windowEndsAt: null,
  eligibleMethods: ['domain_challenge'],
  version: '2',
};

describe('P2-S05 authenticated profile ownership SSR context', () => {
  it('[P2-S05-AC-163] rejects an unauthenticated SSR request before any private read', async () => {
    let reads = 0;
    const result = await resolveProfileOwnershipPage({
      request: new Request('https://wejamm.in/app/profiles-verification'),
      binding: {
        fetch: async () => {
          reads += 1;
          return jsonResponse({});
        },
      },
      selectedId: null,
      requestId: REQUEST_ID,
    });
    expect(result).toEqual({ kind: 'unauthenticated' });
    expect(reads).toBe(0);
  });

  it('[P2-S05-AC-163, P2-S05-AC-158] derives actor/context/claim/CSRF from server responses for authenticated SSR', async () => {
    const paths: string[] = [];
    const result = await resolveProfileOwnershipPage({
      request: new Request(
        `https://wejamm.in/app/profiles-verification?selected=${CLAIM_ID}`,
        {
          headers: {
            cookie: 'wj_session_ref=session; wj_csrf=csrf; private=redacted',
          },
        },
      ),
      binding: {
        fetch: async (input: RequestInfo | URL) => {
          const request = new Request(input);
          paths.push(new URL(request.url).pathname);
          if (request.url.endsWith('/me/identity'))
            return jsonResponse(identity);
          if (request.url.endsWith('/me/acting-contexts'))
            return jsonResponse(contexts);
          return jsonResponse(claim);
        },
      },
      selectedId: CLAIM_ID,
      requestId: REQUEST_ID,
    });
    expect(result).toMatchObject({
      kind: 'ready',
      page: {
        state: 'ready',
        actorId: PARTY_ID,
        actingPartyId: PARTY_ID,
        csrfToken: 'csrf',
        claim,
      },
    });
    expect(paths).toEqual([
      '/api/v1/me/identity',
      '/api/v1/me/acting-contexts',
      `/api/v1/party-claims/${CLAIM_ID}`,
    ]);
  });

  it('[P2-S05-AC-162] fails closed to degraded disabled state when the canonical claim read is unavailable', async () => {
    const result = await resolveProfileOwnershipPage({
      request: new Request(
        `https://wejamm.in/app/profiles-verification?selected=${CLAIM_ID}`,
        { headers: { cookie: 'wj_session_ref=session; wj_csrf=csrf' } },
      ),
      binding: {
        fetch: async (input: RequestInfo | URL) => {
          const path = new URL(new Request(input).url).pathname;
          if (path.endsWith('/me/identity')) return jsonResponse(identity);
          if (path.endsWith('/me/acting-contexts'))
            return jsonResponse(contexts);
          return jsonResponse({ code: 'DEPENDENCY_UNAVAILABLE' }, 503);
        },
      },
      selectedId: CLAIM_ID,
      requestId: REQUEST_ID,
    });
    expect(result).toMatchObject({
      kind: 'ready',
      page: {
        state: 'degraded',
        access: 'disabled',
        claim: null,
        csrfToken: '',
      },
    });
  });
});
