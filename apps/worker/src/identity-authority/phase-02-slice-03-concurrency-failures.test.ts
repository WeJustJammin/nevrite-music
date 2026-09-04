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

type Case = Readonly<{
  concurrencyCriterion: string;
  failureCriterion: string;
  port: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: Readonly<Record<string, unknown>>;
  ifMatch?: boolean;
}>;

const cases: readonly Case[] = [
  {
    concurrencyCriterion: 'P2-S03-AC-006 BE01b-01 requires idempotency',
    failureCriterion: 'P2-S03-AC-007 BE01b-01 maps dependency failure',
    port: 'createPerson',
    method: 'POST',
    path: '/api/v1/me/identity',
    body: {},
  },
  {
    concurrencyCriterion: 'P2-S03-AC-012 BE01b-02 rejects pagination',
    failureCriterion: 'P2-S03-AC-013 BE01b-02 maps dependency failure',
    port: 'readPerson',
    method: 'GET',
    path: '/api/v1/me/identity',
  },
  {
    concurrencyCriterion: 'P2-S03-AC-018 BE01b-03 requires idempotency',
    failureCriterion: 'P2-S03-AC-019 BE01b-03 maps dependency failure',
    port: 'addFacet',
    method: 'POST',
    path: '/api/v1/me/facets',
    body: { facetCode: 'performer', source: 'self_asserted' },
  },
  {
    concurrencyCriterion: 'P2-S03-AC-024 BE01b-04 requires CAS headers',
    failureCriterion: 'P2-S03-AC-025 BE01b-04 maps dependency failure',
    port: 'removeFacet',
    method: 'DELETE',
    path: '/api/v1/me/facets/performer',
    body: {},
    ifMatch: true,
  },
  {
    concurrencyCriterion: 'P2-S03-AC-030 BE01b-05 serializes handle claims',
    failureCriterion: 'P2-S03-AC-031 BE01b-05 maps dependency failure',
    port: 'createAlias',
    method: 'POST',
    path: '/api/v1/aliases',
    body: {
      displayName: 'Neon Harbor',
      handle: 'neon.harbor',
      publicLinkState: 'private',
    },
  },
  {
    concurrencyCriterion: 'P2-S03-AC-036 BE01b-06 requires version CAS',
    failureCriterion: 'P2-S03-AC-037 BE01b-06 maps dependency failure',
    port: 'patchAlias',
    method: 'PATCH',
    path: `/api/v1/aliases/${ALIAS_ID}`,
    body: { displayName: 'Neon Harbor Live' },
    ifMatch: true,
  },
  {
    concurrencyCriterion: 'P2-S03-AC-042 BE01b-07 locks handle changes',
    failureCriterion: 'P2-S03-AC-043 BE01b-07 maps dependency failure',
    port: 'changeHandle',
    method: 'POST',
    path: `/api/v1/aliases/${ALIAS_ID}/handle-changes`,
    body: { handle: 'neon-harbor' },
    ifMatch: true,
  },
  {
    concurrencyCriterion: 'P2-S03-AC-048 BE01b-08 terminally CAS retires',
    failureCriterion: 'P2-S03-AC-049 BE01b-08 maps dependency failure',
    port: 'retireAlias',
    method: 'POST',
    path: `/api/v1/aliases/${ALIAS_ID}/retire`,
    body: {},
    ifMatch: true,
  },
  {
    concurrencyCriterion: 'P2-S03-AC-054 BE01b-09 allows one pending offer',
    failureCriterion: 'P2-S03-AC-055 BE01b-09 maps dependency failure',
    port: 'createTransferOffer',
    method: 'POST',
    path: `/api/v1/aliases/${ALIAS_ID}/transfer-offers`,
    body: { recipientPersonId: PARTY_ID },
  },
  {
    concurrencyCriterion: 'P2-S03-AC-060 BE01b-10 locks offer ownership',
    failureCriterion: 'P2-S03-AC-061 BE01b-10 maps dependency failure',
    port: 'acceptTransferOffer',
    method: 'POST',
    path: `/api/v1/alias-transfer-offers/${OFFER_ID}/accept`,
    body: {},
    ifMatch: true,
  },
  {
    concurrencyCriterion: 'P2-S03-AC-066 BE01b-11 CAS declines once',
    failureCriterion: 'P2-S03-AC-067 BE01b-11 maps dependency failure',
    port: 'declineTransferOffer',
    method: 'POST',
    path: `/api/v1/alias-transfer-offers/${OFFER_ID}/decline`,
    body: {},
    ifMatch: true,
  },
  {
    concurrencyCriterion: 'P2-S03-AC-072 BE01b-12 bounds pagination',
    failureCriterion: 'P2-S03-AC-073 BE01b-12 maps dependency failure',
    port: 'readActingContexts',
    method: 'GET',
    path: '/api/v1/me/acting-contexts',
  },
  {
    concurrencyCriterion: 'P2-S03-AC-078 BE01b-13 rechecks binding source',
    failureCriterion: 'P2-S03-AC-079 BE01b-13 maps dependency failure',
    port: 'bindActingContext',
    method: 'POST',
    path: '/api/v1/me/acting-context-bindings',
    body: {
      contextId: CONTEXT_ID,
      deliberateConfirmation: true,
      clientBindingId: 'tab-a',
    },
  },
  {
    concurrencyCriterion: 'P2-S03-AC-084 BE01b-18 rejects pagination',
    failureCriterion: 'P2-S03-AC-085 BE01b-18 maps dependency failure',
    port: 'readPublicProjection',
    method: 'GET',
    path: `/api/v1/identity/parties/${PARTY_ID}/projection`,
  },
];

const requestFor = (testCase: Case, mode: 'concurrency' | 'failure') => {
  const read = testCase.method === 'GET';
  const path =
    read && mode === 'concurrency'
      ? `${testCase.path}?offset=1`
      : testCase.path;
  const headers = new Headers({
    origin: ORIGIN,
    cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    'x-csrf-token': CSRF,
    'x-request-id': REQUEST_ID,
  });
  if (!read) {
    headers.set('content-type', 'application/json');
    if (mode === 'failure') headers.set('idempotency-key', 'slice03-failure');
    if (testCase.ifMatch) headers.set('if-match', '"1"');
  }
  return new Request(`${ORIGIN}${path}`, {
    method: testCase.method,
    headers,
    ...(read ? {} : { body: JSON.stringify(testCase.body ?? {}) }),
  });
};

const errorCode = async (response: Response): Promise<string | undefined> =>
  ((await response.json()) as { code?: string }).code;

describe('Phase 2 Slice 03 concurrency boundaries', () => {
  it.each(cases)('$concurrencyCriterion', async (testCase) => {
    const { app } = createApp();
    const response = await app.request(requestFor(testCase, 'concurrency'));

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('INVALID_REQUEST');
  });
});

describe('Phase 2 Slice 03 unavailable dependency mapping', () => {
  it.each(cases)('$failureCriterion', async (testCase) => {
    const created = createApp();
    const identity = (
      created as unknown as { identity?: Record<string, unknown> }
    ).identity;
    if (identity !== undefined) delete identity[testCase.port];
    const response = await created.app.request(requestFor(testCase, 'failure'));

    expect(response.status).toBe(503);
    expect(await errorCode(response)).toBe('DEPENDENCY_UNAVAILABLE');
  });
});
