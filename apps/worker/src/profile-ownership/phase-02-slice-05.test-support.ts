import { createLogger } from '@wejammin/observability/logging';
import { vi } from 'vitest';

import { createWorkerApp, type WorkerDependencies } from '../index';
import {
  createApp as createAuthenticationApp,
  failure,
  success,
} from '../authentication/phase-02-slice-02.test-support';
import {
  bindings,
  CSRF,
  ORIGIN,
  REQUEST_ID,
  session,
} from '../authentication/phase-02-slice-02.test-fixtures';

export { REQUEST_ID };

export const SHADOW_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const PARTY_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const CONTACT_ROUTE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const CLAIM_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
export const CHALLENGE_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
export const PERSON_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
export const CONTEST_ID = '12121212-1212-4212-8212-121212121212';
export const EVIDENCE_ID = '13131313-1313-4313-8313-131313131313';
export const TRANSFER_ID = '14141414-1414-4414-8414-141414141414';
export const JOB_ID = '15151515-1515-4515-8515-151515151515';
export const REQUEST_TOKEN =
  'rM8p2V6q9Yw4aBcDeFgHiJkLmNoPqRsTuVwXyZ1AbCdEfGhIjKlMn';

export type ProfilePortName =
  | 'matchShadowParty'
  | 'dispatchInvitation'
  | 'submitRemedy'
  | 'startClaim'
  | 'readClaim'
  | 'issueClaimChallenge'
  | 'completeClaimProof'
  | 'convertClaim'
  | 'createOwnershipContest'
  | 'readOwnershipContest'
  | 'addContestEvidence'
  | 'withdrawOwnershipContest'
  | 'offerOwnershipTransfer'
  | 'readOwnershipTransfer'
  | 'decideOwnershipTransfer'
  | 'reverseOwnershipTransfer';

export type ProfileTestPort = Readonly<
  Record<ProfilePortName, ReturnType<typeof vi.fn>> & {
    emitEvent: ReturnType<typeof vi.fn>;
  }
>;

export const responses: Readonly<Record<ProfilePortName, unknown>> = {
  matchShadowParty: { suggestions: [], timedOut: false, continuing: false },
  dispatchInvitation: {
    id: JOB_ID,
    type: 'profile.invitation',
    state: 'queued',
    progress: null,
    resultRef: null,
    error: null,
    createdAt: '2026-09-01T05:00:00.000Z',
    updatedAt: '2026-09-01T05:00:00.000Z',
  },
  submitRemedy: {
    accepted: true,
    action: 'suppress',
    scope: 'both',
    state: 'active',
    version: '1',
  },
  startClaim: {
    id: CLAIM_ID,
    state: 'started',
    targetPartyId: PARTY_ID,
    controlLevel: 'none',
    windowEndsAt: null,
    version: '1',
  },
  readClaim: {
    id: CLAIM_ID,
    state: 'proving',
    targetPartyId: PARTY_ID,
    controlLevel: 'none',
    windowEndsAt: null,
    eligibleMethods: ['domain_challenge'],
    version: '2',
  },
  issueClaimChallenge: {
    id: CHALLENGE_ID,
    method: 'attester_route',
    expiresAt: '2026-09-01T05:15:00Z',
    attemptsRemaining: 5,
  },
  completeClaimProof: {
    id: CLAIM_ID,
    state: 'provisional',
    targetPartyId: PARTY_ID,
    controlLevel: 'provisional',
    windowEndsAt: '2026-09-15T05:00:00Z',
    version: '3',
  },
  convertClaim: {
    id: CLAIM_ID,
    state: 'full',
    targetPartyId: PARTY_ID,
    controlLevel: 'full',
    windowEndsAt: null,
    version: '4',
  },
  createOwnershipContest: {
    id: CONTEST_ID,
    partyId: PARTY_ID,
    state: 'open',
    responseDueAt: '2026-09-15T05:00:00Z',
    resolution: null,
    version: '1',
  },
  readOwnershipContest: {
    id: CONTEST_ID,
    partyId: PARTY_ID,
    state: 'open',
    responseDueAt: '2026-09-15T05:00:00Z',
    resolution: null,
    version: '1',
  },
  addContestEvidence: {
    id: CONTEST_ID,
    partyId: PARTY_ID,
    state: 'open',
    responseDueAt: '2026-09-15T05:00:00Z',
    resolution: null,
    version: '2',
  },
  withdrawOwnershipContest: {
    id: CONTEST_ID,
    partyId: PARTY_ID,
    state: 'withdrawn',
    responseDueAt: '2026-09-15T05:00:00Z',
    resolution: null,
    version: '3',
  },
  offerOwnershipTransfer: {
    id: TRANSFER_ID,
    partyId: PARTY_ID,
    recipientPersonId: PERSON_ID,
    state: 'pending',
    reversalEndsAt: null,
    version: '1',
  },
  readOwnershipTransfer: {
    id: TRANSFER_ID,
    partyId: PARTY_ID,
    recipientPersonId: PERSON_ID,
    state: 'pending',
    reversalEndsAt: null,
    version: '1',
  },
  decideOwnershipTransfer: {
    id: TRANSFER_ID,
    partyId: PARTY_ID,
    recipientPersonId: PERSON_ID,
    state: 'accepted',
    reversalEndsAt: '2026-10-01T05:00:00Z',
    version: '2',
  },
  reverseOwnershipTransfer: {
    partyId: PARTY_ID,
    controlLevel: 'full',
    basis: 'prior_period_restored',
    version: '5',
  },
};

export const commandRequest = (
  path: string,
  body: Readonly<Record<string, unknown>>,
  options: Readonly<{
    key?: string | undefined;
    ifMatch?: string | undefined;
    authenticated?: boolean | undefined;
    contentType?: string | undefined;
    query?: string | undefined;
  }> = {},
): Request => {
  const headers = new Headers({
    accept: 'application/json',
    'content-type': options.contentType ?? 'application/json',
    'x-request-id': REQUEST_ID,
    'idempotency-key': options.key ?? 'slice05-red-key',
    origin: ORIGIN,
  });
  if (options.ifMatch !== undefined) headers.set('if-match', options.ifMatch);
  if (options.authenticated !== false) {
    headers.set(
      'cookie',
      `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    );
    headers.set('x-csrf-token', CSRF);
  }
  const suffix = options.query === undefined ? '' : `?${options.query}`;
  return new Request(`${ORIGIN}${path}${suffix}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
};

export const readRequest = (path: string, query?: string): Request => {
  const suffix = query === undefined ? '' : `?${query}`;
  return new Request(`${ORIGIN}${path}${suffix}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      origin: ORIGIN,
      cookie: `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
      'x-request-id': REQUEST_ID,
    },
  });
};

export const createProfileApp = (
  overrides: Partial<Record<ProfilePortName, ReturnType<typeof vi.fn>>> = {},
) => {
  const base = createAuthenticationApp({
    resolveSession: vi.fn(async () =>
      success({
        ...session,
        personId: PERSON_ID,
        actingPartyId: PERSON_ID,
      }),
    ),
  });
  const profile = {
    ...Object.fromEntries(
      (Object.keys(responses) as ProfilePortName[]).map((name) => [
        name,
        overrides[name] ?? vi.fn(async () => success(responses[name])),
      ]),
    ),
    emitEvent: vi.fn(),
  } as unknown as ProfileTestPort;
  const dependencies = {
    auth: base.auth,
    identityAuthority: base.identity,
    profileOwnership: profile,
    captureException: vi.fn(),
    createLogger: () =>
      createLogger({
        environment: 'staging',
        release: 'phase-02-slice-05-red',
        service: 'wejammin-api',
      }),
    now: () => Date.now(),
  } as unknown as WorkerDependencies;
  return {
    app: createWorkerApp(dependencies),
    auth: base.auth,
    identity: base.identity,
    dependencies,
    profile,
  };
};

export { bindings, failure, session };
