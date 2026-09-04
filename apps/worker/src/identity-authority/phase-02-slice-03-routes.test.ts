import { describe, expect, it } from 'vitest';

import {
  CSRF,
  ORIGIN,
  REQUEST_ID,
} from '../authentication/phase-02-slice-02.test-fixtures';
import { createApp } from '../authentication/phase-02-slice-02.test-support';

const ALIAS_ID = '66666666-6666-4666-8666-666666666666';
const OFFER_ID = '77777777-7777-4777-8777-777777777777';
const PARTY_ID = '88888888-8888-4888-8888-888888888888';
const CONTEXT_ID = '99999999-9999-4999-8999-999999999999';

type RouteCase = Readonly<{
  criterion: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  status: number;
  body?: Readonly<Record<string, unknown>>;
}>;

const routeCases: readonly RouteCase[] = [
  {
    criterion: 'P2-S03-AC-003 BE01b-01 creates a person identity',
    method: 'POST',
    path: '/api/v1/me/identity',
    status: 201,
    body: {},
  },
  {
    criterion: 'P2-S03-AC-009 BE01b-02 reads the own identity',
    method: 'GET',
    path: '/api/v1/me/identity',
    status: 200,
  },
  {
    criterion: 'P2-S03-AC-015 BE01b-03 adds one self-asserted facet',
    method: 'POST',
    path: '/api/v1/me/facets',
    status: 201,
    body: { facetCode: 'performer', source: 'self_asserted' },
  },
  {
    criterion: 'P2-S03-AC-021 BE01b-04 removes one active facet',
    method: 'DELETE',
    path: '/api/v1/me/facets/performer',
    status: 200,
    body: {},
  },
  {
    criterion: 'P2-S03-AC-027 BE01b-05 creates an alias',
    method: 'POST',
    path: '/api/v1/aliases',
    status: 201,
    body: {
      displayName: 'Neon Harbor',
      handle: 'neon.harbor',
      publicLinkState: 'public',
    },
  },
  {
    criterion: 'P2-S03-AC-033 BE01b-06 patches an owned alias',
    method: 'PATCH',
    path: `/api/v1/aliases/${ALIAS_ID}`,
    status: 200,
    body: { displayName: 'Neon Harbor Live' },
  },
  {
    criterion: 'P2-S03-AC-039 BE01b-07 changes an alias handle',
    method: 'POST',
    path: `/api/v1/aliases/${ALIAS_ID}/handle-changes`,
    status: 200,
    body: { handle: 'neon-harbor' },
  },
  {
    criterion: 'P2-S03-AC-045 BE01b-08 retires an alias',
    method: 'POST',
    path: `/api/v1/aliases/${ALIAS_ID}/retire`,
    status: 200,
    body: {},
  },
  {
    criterion: 'P2-S03-AC-051 BE01b-09 creates a transfer offer',
    method: 'POST',
    path: `/api/v1/aliases/${ALIAS_ID}/transfer-offers`,
    status: 201,
    body: { recipientPersonId: PARTY_ID },
  },
  {
    criterion: 'P2-S03-AC-057 BE01b-10 accepts a transfer offer',
    method: 'POST',
    path: `/api/v1/alias-transfer-offers/${OFFER_ID}/accept`,
    status: 200,
    body: {},
  },
  {
    criterion: 'P2-S03-AC-063 BE01b-11 declines a transfer offer',
    method: 'POST',
    path: `/api/v1/alias-transfer-offers/${OFFER_ID}/decline`,
    status: 200,
    body: {},
  },
  {
    criterion: 'P2-S03-AC-069 BE01b-12 lists acting contexts',
    method: 'GET',
    path: '/api/v1/me/acting-contexts',
    status: 200,
  },
  {
    criterion: 'P2-S03-AC-075 BE01b-13 binds a context deliberately',
    method: 'POST',
    path: '/api/v1/me/acting-context-bindings',
    status: 201,
    body: {
      contextId: CONTEXT_ID,
      deliberateConfirmation: true,
      clientBindingId: 'tab-a',
    },
  },
  {
    criterion: 'P2-S03-AC-081 BE01b-18 returns a public projection',
    method: 'GET',
    path: `/api/v1/identity/parties/${PARTY_ID}/projection`,
    status: 200,
  },
];

const requestFor = (testCase: RouteCase): Request => {
  const headers = new Headers({
    origin: ORIGIN,
    cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    'x-csrf-token': CSRF,
    'idempotency-key': `slice03-${testCase.criterion.slice(10, 13)}`,
    'if-match': '"1"',
    'x-request-id': REQUEST_ID,
  });
  if (testCase.body !== undefined)
    headers.set('content-type', 'application/json');
  return new Request(`${ORIGIN}${testCase.path}`, {
    method: testCase.method,
    headers,
    ...(testCase.body === undefined
      ? {}
      : { body: JSON.stringify(testCase.body) }),
  });
};

describe('Phase 2 Slice 03 BE01b route happy paths', () => {
  it.each(routeCases)('$criterion', async (testCase) => {
    const { app } = createApp();
    const response = await app.request(requestFor(testCase));

    expect(response.status).toBe(testCase.status);
    expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
  });
});
