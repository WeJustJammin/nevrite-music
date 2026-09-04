import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp, type WorkerContext } from '../index';
import { ClaimPathSchema } from '@wejammin/contracts';
import {
  claimEvent,
  fingerprint,
  replayKey,
  send,
  validateResponse,
} from './route-outcome';
import {
  parseProfileCommandHeaders,
  parseProfilePath,
  profilePolicy,
} from './route-support';
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
  session,
} from './phase-02-slice-05.test-support';

const stubContext = (
  correlationId: unknown = '11111111-1111-4111-8111-111111111111',
  raw = new Request('https://api.example.test/profile'),
) =>
  ({
    env: bindings,
    req: { raw },
    get: vi.fn((name: string) => {
      if (name === 'correlationId') return correlationId;
      if (name === 'requestId') return '11111111-1111-4111-8111-111111111111';
      return undefined;
    }),
    set: vi.fn(),
    header: vi.fn(),
    json: vi.fn(
      (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status }),
    ),
  }) as unknown as WorkerContext;

describe('Phase 2 Slice 05 worker route defensive coverage', () => {
  it('covers stable fingerprints, invalid event/response values, and job locations', () => {
    expect(
      fingerprint({
        operationId: 'PRF-API-01',
        request: new Request('https://api.example.test'),
        body: { values: ['b', 'a'] },
      }),
    ).toContain('values');
    expect(
      fingerprint({
        operationId: 'PRF-API-01',
        request: new Request('https://api.example.test'),
      }),
    ).toBeTypeOf('string');
    expect(
      replayKey({
        operationId: 'PRF-API-01',
        request: new Request('https://api.example.test'),
      }),
    ).toBe('PRF-API-01|anonymous|');
    expect(validateResponse('PRF-API-01', null)).toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(claimEvent(stubContext(), null, session)).toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(
      claimEvent(
        stubContext(null),
        { id: CLAIM_ID, targetPartyId: PARTY_ID, version: '1' },
        { ...session, personId: null },
      ),
    ).toMatchObject({ ok: false, status: 502 });

    const jobContext = stubContext();
    send(
      jobContext,
      { ok: true, value: { jobId: 'job-123' }, status: 202 },
      'PRF-API-02',
    );
    expect(jobContext.header).toHaveBeenCalledWith(
      'location',
      '/api/v1/jobs/job-123',
    );
    const primitiveContext = stubContext();
    send(primitiveContext, { ok: true, value: 'ok', status: 200 });
    expect(primitiveContext.json).toHaveBeenCalledOnce();
  });

  it('rejects malformed shadow and claim path identifiers before runtime dispatch', async () => {
    const requests = [
      commandRequest(
        '/api/v1/shadow-parties/not-a-uuid/invitations',
        {
          contactRouteId: CHALLENGE_ID,
          trigger: 'initial',
        },
        { ifMatch: '"1"' },
      ),
      readRequest('/api/v1/party-claims/not-a-uuid'),
      commandRequest(
        '/api/v1/party-claims/not-a-uuid/challenges',
        {
          method: 'attester_route',
          attesterPersonId: PERSON_ID,
        },
        { ifMatch: '"1"' },
      ),
      commandRequest(
        '/api/v1/party-claims/not-a-uuid/proofs',
        {
          kind: 'challenge_code',
          challengeId: CHALLENGE_ID,
          code: '482901',
          reasonCode: 'claim_proof',
        },
        { ifMatch: '"1"' },
      ),
      commandRequest(
        '/api/v1/party-claims/not-a-uuid/convert',
        {
          reasonCode: 'claim_conversion',
        },
        { ifMatch: '"1"' },
      ),
    ];
    for (const request of requests) {
      const harness = createProfileApp();
      await expect(harness.app.fetch(request, bindings)).resolves.toMatchObject(
        {
          status: 422,
        },
      );
    }
    expect(parseProfilePath(ClaimPathSchema, { claimId: 'bad' })).toMatchObject(
      {
        ok: false,
        status: 422,
      },
    );
  });

  it('covers command header policies and profile preparation CSRF rejection', async () => {
    const request = commandRequest(
      '/api/v1/party-claims',
      {},
      { ifMatch: '"1"' },
    );
    expect(parseProfileCommandHeaders(request, false)).toMatchObject({
      ok: false,
      status: 400,
      code: 'INVALID_REQUEST',
    });
    expect(parseProfileCommandHeaders(request, true)).toMatchObject({
      ok: true,
    });
    const outOfRange = commandRequest(
      '/api/v1/party-claims',
      {},
      { ifMatch: '"9223372036854775808"' },
    );
    expect(parseProfileCommandHeaders(outOfRange, true)).toMatchObject({
      ok: false,
      status: 400,
      code: 'INVALID_REQUEST',
    });
    expect(
      parseProfileCommandHeaders(
        commandRequest('/api/v1/party-claims', {}),
        true,
      ),
    ).toMatchObject({
      ok: false,
      status: 400,
      code: 'INVALID_REQUEST',
    });
    expect(() => profilePolicy('PRF-API-99' as never)).toThrow(
      'Missing profile route policy PRF-API-99',
    );

    const harness = createProfileApp();
    const csrfMissing = commandRequest(
      '/api/v1/party-claims',
      { targetPartyId: PARTY_ID, claimKind: 'self' },
      { ifMatch: '"1"' },
    );
    csrfMissing.headers.delete('x-csrf-token');
    const response = await harness.app.fetch(csrfMissing, bindings);
    expect(response.status).toBe(403);
  });

  it('handles unavailable, failed, incomplete, stale, and throwing sessions', async () => {
    const unavailable = createProfileApp();
    const { auth, ...dependenciesWithoutAuth } = unavailable.dependencies;
    expect(auth).toBeDefined();
    const unavailableApp = createWorkerApp(dependenciesWithoutAuth);
    await expect(
      unavailableApp.fetch(
        readRequest(`/api/v1/party-claims/${CLAIM_ID}`),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 503 });

    const failed = createProfileApp();
    vi.mocked(failed.auth.resolveSession).mockResolvedValueOnce(
      failure(401, 'UNAUTHENTICATED', 'invalid session'),
    );
    await expect(
      failed.app.fetch(
        readRequest(`/api/v1/party-claims/${CLAIM_ID}`),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 401 });

    const incomplete = createProfileApp();
    vi.mocked(incomplete.auth.resolveSession).mockResolvedValueOnce({
      ok: true,
      value: { ...session, actingPartyId: null },
    });
    await expect(
      incomplete.app.fetch(
        readRequest(`/api/v1/party-claims/${CLAIM_ID}`),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 403 });

    const stale = createProfileApp();
    vi.mocked(stale.auth.resolveSession).mockResolvedValueOnce({
      ok: true,
      value: { ...session, stepUpAt: null },
    });
    await expect(
      stale.app.fetch(
        commandRequest(
          `/api/v1/party-claims/${CLAIM_ID}/proofs`,
          {
            kind: 'challenge_code',
            challengeId: CHALLENGE_ID,
            code: '482901',
            reasonCode: 'claim_proof',
          },
          { ifMatch: '"1"' },
        ),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 401 });

    const throwing = createProfileApp();
    vi.mocked(throwing.auth.resolveSession).mockRejectedValueOnce(
      new Error('auth down'),
    );
    await expect(
      throwing.app.fetch(
        readRequest(`/api/v1/party-claims/${CLAIM_ID}`),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 503 });
  });

  it('maps unavailable, throwing, and failed rate-limit dependencies', async () => {
    const unavailable = createProfileApp();
    const { auth, ...dependenciesWithoutAuth } = unavailable.dependencies;
    expect(auth).toBeDefined();
    const unavailableApp = createWorkerApp(dependenciesWithoutAuth);
    await expect(
      unavailableApp.fetch(
        commandRequest(
          '/api/v1/shadow-remedies',
          {
            pointerToken:
              'rM8p2V6q9Yw4aBcDeFgHiJkLmNoPqRsTuVwXyZ1AbCdEfGhIjKlMn',
            action: 'suppress',
            scope: 'both',
            proof: { kind: 'route_code', code: '482901' },
          },
          { authenticated: false },
        ),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 503 });

    const throwing = createProfileApp();
    vi.mocked(throwing.auth.rateLimit).mockRejectedValueOnce(
      new Error('rate down'),
    );
    await expect(
      throwing.app.fetch(
        readRequest(`/api/v1/party-claims/${CLAIM_ID}`),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 503 });

    const failed = createProfileApp();
    vi.mocked(failed.auth.rateLimit).mockResolvedValueOnce(
      failure(503, 'DEPENDENCY_UNAVAILABLE', 'rate limiter unavailable'),
    );
    await expect(
      failed.app.fetch(
        readRequest(`/api/v1/party-claims/${CLAIM_ID}`),
        bindings,
      ),
    ).resolves.toMatchObject({ status: 503 });
  });
});
