import { describe, expect, it, vi } from 'vitest';

import {
  CLAIM_ID,
  CHALLENGE_ID,
  PARTY_ID,
  PERSON_ID,
  bindings,
  commandRequest,
  createProfileApp,
  failure,
  readRequest,
} from './phase-02-slice-05.test-support';

const expectError = async (
  response: Response,
  status: number,
  code: string,
): Promise<Record<string, unknown>> => {
  expect(response.status).toBe(status);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const body = (await response.json()) as Record<string, unknown>;
  expect(Object.keys(body).sort()).toEqual([
    'code',
    'details',
    'message',
    'requestId',
  ]);
  expect(body).toMatchObject({ code, requestId: expect.any(String) });
  return body;
};

describe('Phase 2 Slice 05 Worker idempotency, CAS, event, and recovery RED acceptance', () => {
  it('[P2-S05-AC-007,009] replays a committed claim start without a second effect', async () => {
    const harness = createProfileApp();
    const request = () =>
      commandRequest(
        '/api/v1/party-claims',
        { targetPartyId: PARTY_ID, claimKind: 'self' },
        { key: 'slice05-claim-replay', ifMatch: '"1"' },
      );

    const first = await harness.app.fetch(request(), bindings);
    const second = await harness.app.fetch(request(), bindings);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    await expect(first.clone().json()).resolves.toEqual(await second.json());
    expect(harness.profile.startClaim).toHaveBeenCalledOnce();
    expect(harness.profile.emitEvent).toHaveBeenCalledOnce();
  });

  it('[P2-S05-AC-007] rejects the same idempotency key when normalized content changes', async () => {
    const harness = createProfileApp();
    const key = 'slice05-claim-mismatch';
    const first = await harness.app.fetch(
      commandRequest(
        '/api/v1/party-claims',
        { targetPartyId: PARTY_ID, claimKind: 'self' },
        { key, ifMatch: '"1"' },
      ),
      bindings,
    );
    expect(first.status).toBe(201);

    const mismatch = await harness.app.fetch(
      commandRequest(
        '/api/v1/party-claims',
        { targetPartyId: PARTY_ID, claimKind: 'representation' },
        { key, ifMatch: '"1"' },
      ),
      bindings,
    );
    const body = await expectError(mismatch, 409, 'CONFLICT');
    expect(body.details).toMatchObject({
      conflict: 'IDEMPOTENCY_MISMATCH',
      recoveryAction: expect.any(String),
    });
    expect(harness.profile.startClaim).toHaveBeenCalledOnce();
    expect(harness.profile.emitEvent).toHaveBeenCalledOnce();
  });

  it('[P2-S05-AC-007,025,055] preserves canonical state on a stale expected version', async () => {
    const startClaim = vi.fn(async () => ({
      ...failure(409, 'CONFLICT', 'The ownership state changed.'),
      details: {
        conflict: 'VERSION_MISMATCH',
        expectedVersion: '9',
        currentVersion: '10',
        recoveryAction: 'refetch_and_retry',
      },
    }));
    const harness = createProfileApp({ startClaim });
    const response = await harness.app.fetch(
      commandRequest(
        '/api/v1/party-claims',
        { targetPartyId: PARTY_ID, claimKind: 'self' },
        { key: 'slice05-stale-version', ifMatch: '"9"' },
      ),
      bindings,
    );
    const body = await expectError(response, 409, 'CONFLICT');
    expect(body.details).toMatchObject({
      conflict: 'VERSION_MISMATCH',
      expectedVersion: '9',
      currentVersion: '10',
    });
    expect(startClaim).toHaveBeenCalledOnce();
    expect(harness.profile.emitEvent).not.toHaveBeenCalled();
  });

  it('[P2-S05-AC-008,044] maps provider failure to a typed dependency error without leaking provider data', async () => {
    const proof = vi.fn(async () => ({
      ...failure(
        503,
        'DEPENDENCY_UNAVAILABLE',
        'Proof verification is temporarily unavailable.',
      ),
      details: {
        dependencyClass: 'proof_adapter',
        retryable: true,
        retryAfterSeconds: 5,
      },
    }));
    const harness = createProfileApp({ completeClaimProof: proof });
    const response = await harness.app.fetch(
      commandRequest(
        `/api/v1/party-claims/${CLAIM_ID}/proofs`,
        {
          kind: 'challenge_code',
          challengeId: CHALLENGE_ID,
          code: '482901',
          reasonCode: 'claim_proof',
        },
        { key: 'slice05-proof-dependency', ifMatch: '"2"' },
      ),
      bindings,
    );
    const body = await expectError(response, 503, 'DEPENDENCY_UNAVAILABLE');
    expect(body.details).toMatchObject({
      dependencyClass: 'proof_adapter',
      retryable: true,
    });
    expect(JSON.stringify(body)).not.toContain('provider-secret');
    expect(JSON.stringify(body)).not.toContain('raw-provider-payload');
    expect(proof).toHaveBeenCalledOnce();
    expect(harness.profile.emitEvent).not.toHaveBeenCalled();
  });

  it('[P2-S05-AC-007,008,044] turns an aborted dependency call into a bounded typed timeout', async () => {
    const match = vi.fn(async () => {
      throw new DOMException('deadline', 'AbortError');
    });
    const harness = createProfileApp({ matchShadowParty: match });
    const response = await harness.app.fetch(
      commandRequest(
        '/api/v1/shadow-party-matches',
        {
          partyId: PARTY_ID,
          sourceDomain: 'projects',
          sourceEntityId: 'work-812',
          sourceVersion: '3',
          roleCode: 'performer',
        },
        { key: 'slice05-match-timeout' },
      ),
      bindings,
    );
    const body = await expectError(response, 504, 'DEPENDENCY_TIMEOUT');
    expect(body.details).toEqual({});
    expect(match).toHaveBeenCalledOnce();
  });

  it('[P2-S05-AC-007,049] emits rate headers and a typed response when the user bucket is exhausted', async () => {
    const harness = createProfileApp();
    const resetAt = Math.floor(Date.now() / 1000) + 60;
    vi.mocked(harness.auth.rateLimit).mockResolvedValue({
      ok: true,
      value: { allowed: false, limit: 10, remaining: 0, resetAt },
    });
    const response = await harness.app.fetch(
      commandRequest(
        '/api/v1/party-claims',
        { targetPartyId: PARTY_ID, claimKind: 'self' },
        { key: 'slice05-rate-limit', ifMatch: '"1"' },
      ),
      bindings,
    );
    await expectError(response, 429, 'RATE_LIMITED');
    expect(response.headers.get('ratelimit-limit')).toBe('10');
    expect(response.headers.get('ratelimit-remaining')).toBe('0');
    expect(response.headers.get('ratelimit-reset')).toBe(String(resetAt));
    const retryAfter = response.headers.get('retry-after');
    expect(retryAfter).toMatch(/^[1-9][0-9]*$/);
    expect(Number(retryAfter)).toBeGreaterThan(0);
    expect(harness.profile.startClaim).not.toHaveBeenCalled();
  });

  it('[P2-S05-AC-009,027] emits a strict claim event with identifier-only payload and no request secrets', async () => {
    const harness = createProfileApp();
    const response = await harness.app.fetch(
      commandRequest(
        '/api/v1/party-claims',
        { targetPartyId: PARTY_ID, claimKind: 'self' },
        { key: 'slice05-event-shape', ifMatch: '"1"' },
      ),
      bindings,
    );
    expect(response.status).toBe(201);

    const event = harness.profile.emitEvent.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(event).toBeDefined();
    expect(Object.keys(event).sort()).toEqual([
      'actingPartyId',
      'actorId',
      'aggregateId',
      'aggregateType',
      'aggregateVersion',
      'causationId',
      'correlationId',
      'eventId',
      'eventType',
      'occurredAt',
      'payload',
      'schemaVersion',
    ]);
    expect(event).toMatchObject({
      eventType: 'profile.claim.changed.v1',
      schemaVersion: 1,
      aggregateType: 'claim_case',
      aggregateId: CLAIM_ID,
      aggregateVersion: '1',
      actorId: PERSON_ID,
      actingPartyId: PERSON_ID,
      causationId: null,
      payload: { claimCaseId: CLAIM_ID, partyId: PARTY_ID },
    });
    expect(JSON.stringify(event)).not.toContain('slice05-event-shape');
    expect(JSON.stringify(event)).not.toContain('482901');
    expect(JSON.stringify(event)).not.toContain('provider-secret');
  });

  it('[P2-S05-AC-007,041] does not reserve idempotency or emit an event for invalid input', async () => {
    const harness = createProfileApp();
    const response = await harness.app.fetch(
      commandRequest(
        `/api/v1/party-claims/${CLAIM_ID}/challenges`,
        {
          method: 'attester_route',
          attesterPersonId: PERSON_ID,
          extra: true,
        },
        { key: 'slice05-invalid-no-effect', ifMatch: '"1"' },
      ),
      bindings,
    );
    await expectError(response, 422, 'VALIDATION_FAILED');
    expect(harness.profile.addContestEvidence).not.toHaveBeenCalled();
    expect(harness.profile.emitEvent).not.toHaveBeenCalled();
  });

  it('[P2-S05-AC-007,029,031] keeps reads free of mutation reservation and rejects query widening', async () => {
    const harness = createProfileApp();
    const response = await harness.app.fetch(
      readRequest(`/api/v1/party-claims/${CLAIM_ID}`, 'cursor=one'),
      bindings,
    );
    await expectError(response, 400, 'INVALID_REQUEST');
    expect(harness.profile.readClaim).not.toHaveBeenCalled();
    expect(harness.profile.emitEvent).not.toHaveBeenCalled();
  });
});
