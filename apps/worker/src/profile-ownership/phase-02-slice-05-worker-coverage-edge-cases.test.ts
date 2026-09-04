import { describe, expect, it, vi } from 'vitest';

import { createProductionProfileOwnershipDependencies } from './production';
import {
  profileApplicationFailure,
  profileRpcConflictFailure,
} from './profile-conflicts';
import {
  CLAIM_ID,
  CHALLENGE_ID,
  PARTY_ID,
  PERSON_ID,
  REQUEST_ID,
  bindings,
  responses,
  session,
} from './phase-02-slice-05.test-support';

const request = new Request('https://api.example.test/profile', {
  headers: {
    'x-request-id': REQUEST_ID,
    'x-correlation-id': '21212121-2121-4212-8212-212121212121',
  },
});

const rpcName = (input: string | URL | Request): string =>
  new URL(String(input)).pathname.split('/').at(-1) ?? '';

const json = (value: unknown): Response =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
  });

describe('Phase 2 Slice 05 worker optional-field and conflict coverage', () => {
  it('covers optional RPC fields, absent versions, absent proof bodies, and nullable attesters', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const value: Readonly<Record<string, unknown>> = {
        rpc_match_shadow: responses.matchShadowParty,
        rpc_dispatch_invitation: responses.dispatchInvitation,
        rpc_issue_claim_challenge: responses.issueClaimChallenge,
        rpc_submit_claim_proof: responses.completeClaimProof,
      };
      return json(value[rpcName(input)] ?? responses.startClaim);
    });
    const dependencies = createProductionProfileOwnershipDependencies({
      environment: bindings,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const signal = new AbortController().signal;

    await expect(
      dependencies.matchShadowParty(
        {
          request,
          session,
          operationId: 'PRF-API-01',
          idempotencyKey: 'optional-fields-match',
          body: {
            partyId: PARTY_ID,
            sourceDomain: 'projects',
            sourceEntityId: 'work-812',
            sourceVersion: '3',
            roleCode: null,
            instrumentCode: 'guitar',
          },
        },
        bindings,
        signal,
      ),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      dependencies.dispatchInvitation(
        {
          request,
          session,
          operationId: 'PRF-API-02',
          idempotencyKey: 'optional-fields-invitation',
          path: { shadowId: PARTY_ID },
          body: { contactRouteId: CHALLENGE_ID, trigger: 'initial' },
        },
        bindings,
        signal,
      ),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      dependencies.issueClaimChallenge(
        {
          request,
          session,
          operationId: 'PRF-API-06',
          idempotencyKey: 'optional-fields-challenge',
          ifMatch: '"2"',
          path: { claimId: CLAIM_ID },
          body: { method: 'attester_route' },
        },
        bindings,
        signal,
      ),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      dependencies.completeClaimProof(
        {
          request,
          session,
          operationId: 'PRF-API-07',
          idempotencyKey: 'optional-fields-proof',
          ifMatch: '"2"',
          path: { claimId: CLAIM_ID },
        },
        bindings,
        signal,
      ),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      dependencies.emitEvent(
        {
          eventId: '31313131-3131-4313-8313-313131313131',
          schemaVersion: 1,
          aggregateType: 'claim_case',
          aggregateId: CLAIM_ID,
          aggregateVersion: '2',
          correlationId: '21212121-2121-4212-8212-212121212121',
          causationId: null,
          actorId: PERSON_ID,
          actingPartyId: PARTY_ID,
          occurredAt: '2026-09-01T05:00:00.000Z',
          eventType: 'profile.claim.changed.v1',
          payload: { claimCaseId: CLAIM_ID, partyId: PARTY_ID },
        },
        bindings,
        signal,
      ),
    ).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('normalizes singleton conflict payloads and rejects unknown conflict codes', () => {
    expect(
      profileRpcConflictFailure([
        { errorCode: 'PROOF_REJECTED', attemptsRemaining: 3 },
      ]),
    ).toMatchObject({
      status: 409,
      code: 'CONFLICT',
      details: { conflict: 'PROOF_REJECTED', attemptsRemaining: 3 },
    });
    expect(
      profileRpcConflictFailure({ error: { code: 'CHALLENGE_INVALID' } }),
    ).toMatchObject({ status: 409, code: 'CONFLICT' });
    expect(
      profileRpcConflictFailure({ errorCode: 'NOT_A_PROFILE_CONFLICT' }),
    ).toBeNull();
    expect(
      profileApplicationFailure([
        { accepted: false, errorCode: 'CHALLENGE_ALREADY_USED' },
      ]),
    ).toMatchObject({ status: 409, code: 'CONFLICT' });
    expect(
      profileApplicationFailure({
        accepted: false,
        errorCode: 'NOT_A_PROFILE_CONFLICT',
      }),
    ).toBeNull();
  });
});
