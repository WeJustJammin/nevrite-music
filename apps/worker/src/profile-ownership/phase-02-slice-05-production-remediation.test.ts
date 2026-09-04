import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp } from '../index';
import { createProductionProfileOwnershipDependencies } from './production';
import {
  CLAIM_ID,
  CHALLENGE_ID,
  JOB_ID,
  PARTY_ID,
  bindings,
  commandRequest,
  createProfileApp,
  session,
} from './phase-02-slice-05.test-support';

const request = new Request('https://api.example.test/profile', {
  headers: {
    'x-request-id': '11111111-1111-4111-8111-111111111111',
    'x-correlation-id': '21212121-2121-4212-8212-212121212121',
  },
});

const json = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const environment = {
  ...bindings,
  APP_RELEASE: 'phase-02-slice-05-production',
};

const invitationJob = {
  id: JOB_ID,
  type: 'profile.invitation',
  state: 'queued' as const,
  progress: null,
  resultRef: null,
  error: null,
  createdAt: '2026-09-01T05:00:00.000Z',
  updatedAt: '2026-09-01T05:00:00.000Z',
};

describe('profile ownership production remediation', () => {
  it('[P2-S05-AC-010,091..092] validates invitation dispatch as JobStatus and retains its job identity', async () => {
    const fetchImpl = vi.fn(async () => json(invitationJob));
    const dependencies = createProductionProfileOwnershipDependencies({
      environment,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(
      dependencies.dispatchInvitation(
        {
          request,
          session,
          operationId: 'PRF-API-02',
          idempotencyKey: 'profile-job-status',
          ifMatch: '"7"',
          path: { shadowId: PARTY_ID },
          body: { contactRouteId: CHALLENGE_ID, trigger: 'initial' },
        },
        environment,
        new AbortController().signal,
      ),
    ).resolves.toEqual({ ok: true, value: invitationJob });
  });

  it('[P2-S05-AC-044] maps proof rejection, expiry, and attempt exhaustion to typed 409 conflicts', async () => {
    const failureBodies = [
      {
        accepted: false,
        errorCode: 'PROOF_REJECTED',
        state: 'rejected',
        attemptsRemaining: 4,
      },
      {
        accepted: false,
        errorCode: 'CHALLENGE_EXPIRED',
        state: 'expired',
        attemptsRemaining: 0,
      },
      {
        accepted: false,
        errorCode: 'PROOF_ATTEMPTS_EXHAUSTED',
        state: 'rejected',
        attemptsRemaining: 0,
      },
    ] as const;

    for (const [index, body] of failureBodies.entries()) {
      const dependencies = createProductionProfileOwnershipDependencies({
        environment,
        fetchImpl: vi.fn(async () => json(body)) as typeof fetch,
      });
      await expect(
        dependencies.completeClaimProof(
          {
            request,
            session,
            operationId: 'PRF-API-07',
            idempotencyKey: `proof-failure-${index}`,
            ifMatch: '"2"',
            path: { claimId: CLAIM_ID },
            body: {
              kind: 'challenge_code',
              challengeId: CHALLENGE_ID,
              code: '482901',
              reasonCode: 'claim_proof',
            },
          },
          environment,
          new AbortController().signal,
        ),
      ).resolves.toMatchObject({
        ok: false,
        status: 409,
        code: 'CONFLICT',
        details: {
          conflict: body.errorCode,
          recoveryAction:
            body.errorCode === 'PROOF_REJECTED'
              ? 'retry_with_remaining_attempts'
              : 'issue_new_challenge',
          attemptsRemaining: body.attemptsRemaining,
        },
      });
    }
  });

  it('[P2-S05-AC-044] maps a PostgREST proof conflict exception without exposing provider details', async () => {
    const dependencies = createProductionProfileOwnershipDependencies({
      environment,
      fetchImpl: vi.fn(async () =>
        json(
          {
            error: { code: 'CHALLENGE_EXPIRED', detail: 'secret proof state' },
          },
          400,
        ),
      ) as typeof fetch,
    });

    const result = await dependencies.completeClaimProof(
      {
        request,
        session,
        operationId: 'PRF-API-07',
        idempotencyKey: 'proof-expiry-exception',
        ifMatch: '"2"',
        path: { claimId: CLAIM_ID },
        body: {
          kind: 'challenge_code',
          challengeId: CHALLENGE_ID,
          code: '482901',
          reasonCode: 'claim_proof',
        },
      },
      environment,
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      ok: false,
      status: 409,
      code: 'CONFLICT',
      details: {
        conflict: 'CHALLENGE_EXPIRED',
        recoveryAction: 'issue_new_challenge',
      },
    });
    expect(JSON.stringify(result)).not.toContain('secret proof state');
  });

  it('[P2-S05-AC-044] surfaces a committed proof conflict through the HTTP 409 contract', async () => {
    const harness = createProfileApp();
    const profile = createProductionProfileOwnershipDependencies({
      environment,
      fetchImpl: vi.fn(async () =>
        json({
          accepted: false,
          errorCode: 'PROOF_REJECTED',
          state: 'rejected',
          attemptsRemaining: 4,
        }),
      ) as typeof fetch,
    });
    const app = createWorkerApp({
      ...harness.dependencies,
      profileOwnership: profile,
    });

    const response = await app.fetch(
      commandRequest(
        `/api/v1/party-claims/${CLAIM_ID}/proofs`,
        {
          kind: 'challenge_code',
          challengeId: CHALLENGE_ID,
          code: '482901',
          reasonCode: 'claim_proof',
        },
        { key: 'proof-route-conflict', ifMatch: '"2"' },
      ),
      environment,
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'CONFLICT',
      details: {
        conflict: 'PROOF_REJECTED',
        recoveryAction: 'retry_with_remaining_attempts',
        attemptsRemaining: 4,
      },
    });
  });
});
