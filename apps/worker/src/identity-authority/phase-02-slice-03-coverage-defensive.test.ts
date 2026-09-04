import { describe, expect, it, vi } from 'vitest';

import {
  CSRF,
  ORIGIN,
  REQUEST_ID,
} from '../authentication/phase-02-slice-02.test-fixtures';
import {
  createApp,
  failure,
  success,
} from '../authentication/phase-02-slice-02.test-support';

const ALIAS_ID = '66666666-6666-4666-8666-666666666666';
const OFFER_ID = '77777777-7777-4777-8777-777777777777';
const PARTY_ID = '88888888-8888-4888-8888-888888888888';
const CONTEXT_ID = '99999999-9999-4999-8999-999999999999';
const WRONG_CSRF = `${CSRF.slice(0, -1)}${CSRF.endsWith('0') ? '1' : '0'}`;

type RouteCase = Readonly<{
  path: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}>;

const cases = {
  createPerson: {
    path: '/api/v1/me/identity',
    method: 'POST',
    body: {},
  },
  readPerson: { path: '/api/v1/me/identity', method: 'GET' },
  addFacet: {
    path: '/api/v1/me/facets',
    method: 'POST',
    body: { facetCode: 'performer', source: 'self_asserted' },
  },
  removeFacet: {
    path: '/api/v1/me/facets/performer',
    method: 'DELETE',
    body: {},
  },
  patchAlias: {
    path: `/api/v1/aliases/${ALIAS_ID}`,
    method: 'PATCH',
    body: { displayName: 'Harbor' },
  },
  actingContexts: {
    path: '/api/v1/me/acting-contexts',
    method: 'GET',
  },
  bindContext: {
    path: '/api/v1/me/acting-context-bindings',
    method: 'POST',
    body: {
      contextId: CONTEXT_ID,
      deliberateConfirmation: true,
      clientBindingId: 'tab-a',
    },
  },
  acceptOffer: {
    path: `/api/v1/alias-transfer-offers/${OFFER_ID}/accept`,
    method: 'POST',
    body: {},
  },
} satisfies Record<string, RouteCase>;

const requestFor = (testCase: RouteCase, csrf = CSRF): Request => {
  const headers = new Headers({
    origin: ORIGIN,
    cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    'x-csrf-token': csrf,
    'idempotency-key': 'slice03-defensive',
    'if-match': '"1"',
    'x-request-id': REQUEST_ID,
  });
  const init: RequestInit = { method: testCase.method, headers };
  if (testCase.body !== undefined) {
    headers.set('content-type', 'application/json');
    init.body = JSON.stringify(testCase.body);
  }
  return new Request(`${ORIGIN}${testCase.path}`, init);
};

const deniedSession = () =>
  createApp({
    resolveSession: vi.fn(async () =>
      failure(401, 'UNAUTHENTICATED', 'Authentication is required.'),
    ),
  });

const limitedSession = () =>
  createApp({
    rateLimit: vi.fn(async () =>
      success({
        allowed: false,
        limit: 1,
        remaining: 0,
        resetAt: 1_788_236_460,
      }),
    ),
  });

describe('Slice 03 handler defensive branches', () => {
  it.each([
    cases.patchAlias,
    cases.createPerson,
    cases.addFacet,
    cases.removeFacet,
    cases.bindContext,
    cases.acceptOffer,
  ])(
    'rejects a command without a valid CSRF token: $path',
    async (testCase) => {
      const { app } = createApp();
      const response = await app.request(requestFor(testCase, WRONG_CSRF));

      expect(response.status).toBe(403);
    },
  );

  it.each([
    cases.patchAlias,
    cases.createPerson,
    cases.readPerson,
    cases.addFacet,
    cases.removeFacet,
    cases.actingContexts,
    cases.bindContext,
    cases.acceptOffer,
  ])('returns the session dependency failure for $path', async (testCase) => {
    const { app } = deniedSession();
    const response = await app.request(requestFor(testCase));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it.each([
    cases.patchAlias,
    cases.createPerson,
    cases.readPerson,
    cases.addFacet,
    cases.removeFacet,
    cases.actingContexts,
    cases.bindContext,
    cases.acceptOffer,
  ])('returns the rate-limit response for $path', async (testCase) => {
    const { app } = limitedSession();
    const response = await app.request(requestFor(testCase));

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toMatch(/^\d+$/u);
  });

  it('rate-limits the public projection route before persistence', async () => {
    const { app } = limitedSession();
    const response = await app.request(
      requestFor({
        path: `/api/v1/identity/parties/${PARTY_ID}/projection`,
        method: 'GET',
      }),
    );

    expect(response.status).toBe(429);
  });

  it.each([
    {
      path: `/api/v1/aliases/not-an-alias`,
      method: 'PATCH' as const,
      body: { displayName: 'Harbor' },
    },
    {
      path: '/api/v1/me/facets/not-a-facet',
      method: 'DELETE' as const,
      body: {},
    },
    {
      path: '/api/v1/identity/parties/not-a-party/projection',
      method: 'GET' as const,
    },
    {
      path: '/api/v1/alias-transfer-offers/not-an-offer/accept',
      method: 'POST' as const,
      body: {},
    },
  ])('rejects malformed resource identifiers: $path', async (testCase) => {
    const { app } = createApp();
    const response = await app.request(requestFor(testCase));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_REQUEST',
    });
  });
});
