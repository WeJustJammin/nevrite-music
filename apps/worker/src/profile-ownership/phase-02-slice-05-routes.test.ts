import { describe, expect, it } from 'vitest';

import {
  CLAIM_ID,
  CHALLENGE_ID,
  CONTEST_ID,
  CONTACT_ROUTE_ID,
  EVIDENCE_ID,
  JOB_ID,
  PARTY_ID,
  PERSON_ID,
  REQUEST_ID,
  SHADOW_ID,
  TRANSFER_ID,
  bindings,
  commandRequest,
  createProfileApp,
  readRequest,
  responses,
  type ProfilePortName,
} from './phase-02-slice-05.test-support';

type RouteCase = Readonly<{
  id: `PRF-API-${string}`;
  method: 'GET' | 'POST';
  path: string;
  port: ProfilePortName;
  status: 200 | 201 | 202;
  body?: Readonly<Record<string, unknown>>;
  anonymous?: boolean;
  ifMatch?: string;
}>;

const routeCases: readonly RouteCase[] = [
  {
    id: 'PRF-API-01',
    method: 'POST',
    path: '/api/v1/shadow-party-matches',
    port: 'matchShadowParty',
    status: 200,
    body: {
      partyId: PARTY_ID,
      sourceDomain: 'projects',
      sourceEntityId: 'work-812',
      sourceVersion: '3',
      roleCode: 'performer',
    },
  },
  {
    id: 'PRF-API-02',
    method: 'POST',
    path: `/api/v1/shadow-parties/${SHADOW_ID}/invitations`,
    port: 'dispatchInvitation',
    status: 202,
    ifMatch: '"1"',
    body: { contactRouteId: CONTACT_ROUTE_ID, trigger: 'initial' },
  },
  {
    id: 'PRF-API-03',
    method: 'POST',
    path: '/api/v1/shadow-remedies',
    port: 'submitRemedy',
    status: 200,
    anonymous: true,
    body: {
      pointerToken: 'rM8p2V6q9Yw4aBcDeFgHiJkLmNoPqRsTuVwXyZ1AbCdEfGhIjKlMn',
      action: 'suppress',
      scope: 'both',
      proof: { kind: 'route_code', code: '482901' },
    },
  },
  {
    id: 'PRF-API-04',
    method: 'POST',
    path: '/api/v1/party-claims',
    port: 'startClaim',
    status: 201,
    ifMatch: '"1"',
    body: { targetPartyId: PARTY_ID, claimKind: 'self' },
  },
  {
    id: 'PRF-API-05',
    method: 'GET',
    path: `/api/v1/party-claims/${CLAIM_ID}`,
    port: 'readClaim',
    status: 200,
  },
  {
    id: 'PRF-API-06',
    method: 'POST',
    path: `/api/v1/party-claims/${CLAIM_ID}/challenges`,
    port: 'issueClaimChallenge',
    status: 201,
    ifMatch: '"2"',
    body: {
      method: 'attester_route',
      attesterPersonId: PERSON_ID,
    },
  },
  {
    id: 'PRF-API-07',
    method: 'POST',
    path: `/api/v1/party-claims/${CLAIM_ID}/proofs`,
    port: 'completeClaimProof',
    status: 200,
    ifMatch: '"2"',
    body: {
      kind: 'challenge_code',
      challengeId: CHALLENGE_ID,
      code: '482901',
      reasonCode: 'claim_proof',
    },
  },
  {
    id: 'PRF-API-08',
    method: 'POST',
    path: `/api/v1/party-claims/${CLAIM_ID}/convert`,
    port: 'convertClaim',
    status: 200,
    ifMatch: '"3"',
    body: { reasonCode: 'claim_conversion' },
  },
  {
    id: 'PRF-API-09',
    method: 'POST',
    path: '/api/v1/ownership-contests',
    port: 'createOwnershipContest',
    status: 201,
    ifMatch: '"4"',
    body: {
      partyId: PARTY_ID,
      challengerClaimId: CLAIM_ID,
      reasonCode: 'ownership_contest',
    },
  },
  {
    id: 'PRF-API-10',
    method: 'GET',
    path: `/api/v1/ownership-contests/${CONTEST_ID}`,
    port: 'readOwnershipContest',
    status: 200,
  },
  {
    id: 'PRF-API-11',
    method: 'POST',
    path: `/api/v1/ownership-contests/${CONTEST_ID}/evidence`,
    port: 'addContestEvidence',
    status: 200,
    ifMatch: '"1"',
    body: {
      tier: 'B',
      method: 'attester_route',
      evidenceRef: EVIDENCE_ID,
      attesterPersonIds: [PERSON_ID],
      reasonCode: 'contest_evidence',
    },
  },
  {
    id: 'PRF-API-12',
    method: 'POST',
    path: `/api/v1/ownership-contests/${CONTEST_ID}/withdraw`,
    port: 'withdrawOwnershipContest',
    status: 200,
    ifMatch: '"2"',
    body: { reasonCode: 'contest_withdrawal' },
  },
  {
    id: 'PRF-API-13',
    method: 'POST',
    path: '/api/v1/party-ownership-transfers',
    port: 'offerOwnershipTransfer',
    status: 201,
    ifMatch: '"4"',
    body: {
      partyId: PARTY_ID,
      recipientPersonId: PERSON_ID,
      reasonCode: 'ownership_transfer',
    },
  },
  {
    id: 'PRF-API-14',
    method: 'GET',
    path: `/api/v1/party-ownership-transfers/${TRANSFER_ID}`,
    port: 'readOwnershipTransfer',
    status: 200,
  },
  {
    id: 'PRF-API-15',
    method: 'POST',
    path: `/api/v1/party-ownership-transfers/${TRANSFER_ID}/decision`,
    port: 'decideOwnershipTransfer',
    status: 200,
    ifMatch: '"1"',
    body: { decision: 'accept', reasonCode: 'transfer_acceptance' },
  },
  {
    id: 'PRF-API-16',
    method: 'POST',
    path: `/api/v1/party-ownership-transfers/${TRANSFER_ID}/reverse`,
    port: 'reverseOwnershipTransfer',
    status: 200,
    ifMatch: '"2"',
    body: { reasonCode: 'ownership_correction' },
  },
];

const activeRouteCases = routeCases.slice(0, 8);

const deferredRouteCases = [
  {
    id: 'PRF-API-09',
    method: 'POST',
    path: '/api/v1/ownership-contests',
  },
  {
    id: 'PRF-API-10',
    method: 'GET',
    path: `/api/v1/ownership-contests/${CONTEST_ID}`,
  },
  {
    id: 'PRF-API-11',
    method: 'POST',
    path: `/api/v1/ownership-contests/${CONTEST_ID}/evidence`,
  },
  {
    id: 'PRF-API-12',
    method: 'POST',
    path: `/api/v1/ownership-contests/${CONTEST_ID}/withdraw`,
  },
  {
    id: 'PRF-API-13',
    method: 'POST',
    path: '/api/v1/party-ownership-transfers',
  },
  {
    id: 'PRF-API-14',
    method: 'GET',
    path: `/api/v1/party-ownership-transfers/${TRANSFER_ID}`,
  },
  {
    id: 'PRF-API-15',
    method: 'POST',
    path: `/api/v1/party-ownership-transfers/${TRANSFER_ID}/decision`,
  },
  {
    id: 'PRF-API-16',
    method: 'POST',
    path: `/api/v1/party-ownership-transfers/${TRANSFER_ID}/reverse`,
  },
] as const;

const requestFor = (testCase: RouteCase): Request =>
  testCase.method === 'GET'
    ? readRequest(testCase.path)
    : commandRequest(testCase.path, testCase.body ?? {}, {
        authenticated: !testCase.anonymous,
        ifMatch: testCase.ifMatch,
      });

describe('Phase 2 Slice 05 Worker route RED acceptance', () => {
  it.each(activeRouteCases)(
    '[P2-S05-AC-004,010,016,022,028,034,040,046] $id registers the exact method/path and returns its strict success resource',
    async (testCase) => {
      const harness = createProfileApp();
      const response = await harness.app.fetch(requestFor(testCase), bindings);

      expect(response.status).toBe(testCase.status);
      expect(response.headers.get('content-type')).toContain(
        'application/json',
      );
      expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
      expect(response.headers.get('cache-control')).toBe('no-store');
      await expect(response.json()).resolves.toEqual(responses[testCase.port]);
      if (testCase.id === 'PRF-API-02') {
        expect(response.headers.get('location')).toBe(`/api/v1/jobs/${JOB_ID}`);
      }
      expect(harness.profile[testCase.port]).toHaveBeenCalledOnce();
    },
  );

  it.each(deferredRouteCases)(
    '[P2-S05-AC-236,237,238,239,240,241,242,243,257,258] $id remains explicitly unmounted until its later slice is authorized',
    async (testCase) => {
      const harness = createProfileApp();
      const response = await harness.app.fetch(
        new Request(`https://api.example.test${testCase.path}`, {
          method: testCase.method,
          headers: {
            accept: 'application/json',
            'x-request-id': '11111111-1111-4111-8111-111111111111',
            'content-type': 'application/json',
          },
          ...(testCase.method === 'POST' ? { body: '{}' } : {}),
        }),
        bindings,
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toMatchObject({
        code: 'NOT_FOUND',
      });
    },
  );

  it('[P2-S05-AC-257,258] does not mount the protected Shard 06 outcome command as an HTTP route', async () => {
    const harness = createProfileApp();
    const response = await harness.app.fetch(
      commandRequest('/api/v1/ownership-case-outcomes', {
        callerShard: '06',
        caseId: CONTEST_ID,
        contestId: CONTEST_ID,
        outcomeCode: 'uphold',
        expectedVersion: '1',
        idempotencyKey: 'protected-command',
      }),
      bindings,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('[P2-S05-AC-003,006,030,257,258] does not mount a public unclaimed-shadow profile or arbitrary lookup route', async () => {
    const harness = createProfileApp();
    for (const path of [
      `/api/v1/shadow-parties/${SHADOW_ID}`,
      `/api/v1/parties/${PARTY_ID}/profile`,
      `/api/v1/shadow-party-matches/${PARTY_ID}`,
    ]) {
      const response = await harness.app.fetch(
        new Request(`${'https://api.example.test'}${path}`, {
          headers: { accept: 'application/json', 'x-request-id': 'invalid' },
        }),
        bindings,
      );
      expect(response.status).toBe(404);
    }
  });
});
