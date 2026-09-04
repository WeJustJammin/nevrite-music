import { describe, expect, it, vi } from 'vitest';

import { createProductionWorkerApp } from '../index';
import { createProductionProfilePortfolioDependencies } from './production';
import {
  PARTY_ID,
  PROFILE_PERSON_ID,
  bindings,
  createProfilePortfolioApp,
  readRequest,
  responses,
} from './phase-02-slice-06.test-support';

const profilePath = `/api/v1/profiles/${PARTY_ID}`;
const request = readRequest(profilePath);
const input = {
  operationId: 'PRF-PROF-01',
  request,
  path: { partyId: PARTY_ID },
} as const;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('Phase 2 Slice 06 Worker production adapter RED acceptance', () => {
  it('[P2-S06-AC-003,007,008,084,086] sends a server-owned profile read through the production RPC adapter', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      json(responses.publicProfile),
    );
    const dependencies = createProductionProfilePortfolioDependencies({
      environment: bindings,
      fetchImpl,
    });

    const result = await dependencies.readPublicProfile(
      input,
      bindings,
      new AbortController().signal,
    );

    expect(result).toEqual({ ok: true, value: responses.publicProfile });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toMatch(/\/rest\/v1\/rpc\//);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      Accept: 'application/json',
      'Accept-Profile': 'platform_api',
      apikey: bindings.SUPABASE_SECRET_KEY,
      'X-Operation-Id': 'PRF-PROF-01',
    });
    expect(new Headers(init?.headers).has('authorization')).toBe(false);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).toHaveProperty('p_request');
    expect(JSON.stringify(body)).not.toContain(PROFILE_PERSON_ID);
  });

  it('[P2-S06-AC-007,013,019,025,031,037,043,049,055,061,067] fails closed when the production adapter is absent', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error('supabase adapter unavailable');
    });
    const dependencies = createProductionProfilePortfolioDependencies({
      environment: bindings,
      fetchImpl,
    });

    await expect(
      dependencies.readPublicProfile(
        input,
        bindings,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('[P2-S06-AC-007,013,019,025,031,037,043,049,055,061,067] maps adapter aborts to TIMEOUT without claiming success', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new DOMException('deadline exceeded', 'AbortError');
    });
    const dependencies = createProductionProfilePortfolioDependencies({
      environment: bindings,
      fetchImpl,
    });

    await expect(
      dependencies.readPublicProfile(
        input,
        bindings,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, status: 504, code: 'TIMEOUT' });
  });

  it('[P2-S06-AC-003,007,009,013,019,025,031,037,043,049,055,061,067] rejects malformed provider response through the typed gateway error', async () => {
    const dependencies = createProductionProfilePortfolioDependencies({
      environment: bindings,
      fetchImpl: vi.fn<typeof fetch>(async () => json({ unexpected: true })),
    });

    await expect(
      dependencies.readPublicProfile(
        input,
        bindings,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_BAD_GATEWAY',
    });
  });

  it('[P2-S06-AC-007,013,019,025,031,037,043,049,055,061,067] preserves provider typed failures without leaking SQL details', async () => {
    const dependencies = createProductionProfilePortfolioDependencies({
      environment: bindings,
      fetchImpl: vi.fn<typeof fetch>(async () =>
        json(
          {
            code: 'VERSION_CONFLICT',
            message: 'Profile projection changed.',
            details: { currentVersion: '4' },
            sql: 'select private_evidence from profile_fact_projections',
          },
          409,
        ),
      ),
    });

    const result = await dependencies.readPublicProfile(
      input,
      bindings,
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      ok: false,
      status: 409,
      code: 'VERSION_CONFLICT',
    });
    expect(JSON.stringify(result)).not.toContain('private_evidence');
  });

  it('[P2-S06-AC-064,065] keeps producer observations bounded to the signed local adapter seam', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      json(responses.observation),
    );
    const dependencies = createProductionProfilePortfolioDependencies({
      environment: bindings,
      fetchImpl,
    });
    const observation = {
      ...input,
      operationId: 'PRF-PROF-10',
      body: {
        messageId: '15151515-1515-4515-8515-151515151515',
        producer: 'shard04',
        partyId: PARTY_ID,
        fact: {
          sourceType: 'credit',
          sourceId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          sourceVersion: '3',
        },
        provenanceState: 'attested',
        evidenceClass: 'governed_credit',
        evidenceCount: 1,
        visibility: 'public',
        embargoUntil: null,
        listingState: 'listed',
        disputeState: 'clear',
        occurredOn: null,
        roleCodes: ['performer'],
        payload: { title: 'bounded observation' },
        observedAt: '2026-09-01T05:00:00.000Z',
      },
      idempotencyKey: 'producer-key-01',
    } as const;

    await dependencies.ingestProfileFactObservation(
      observation,
      bindings,
      new AbortController().signal,
    );
    const body = JSON.stringify(fetchImpl.mock.calls[0]?.[1]?.body);
    expect(body).toContain('producer-key-01');
    expect(body).toContain('PRF-PROF-10');
    expect(body).not.toContain('title');
  });

  it('[P2-S06-AC-008,020,026,032,038,044,050,056,062,068] emits one versioned invalidation event only after a successful command', async () => {
    const harness = createProfilePortfolioApp();
    const response = await harness.app.fetch(
      new Request(`${request.url}/emphasis`, {
        method: 'PUT',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'idempotency-key': 'slice06-event-key',
          'if-match': '"1"',
          cookie: 'wj_session_ref=slice02-session-ref; wj_csrf=test',
          'x-csrf-token': 'test',
        },
        body: JSON.stringify({
          surface: 'public',
          defaultFilter: null,
          orderedRefs: [],
        }),
      }),
      bindings,
    );

    expect(response.status).toBe(200);
    expect(harness.profilePortfolio.emitEvent).toHaveBeenCalledTimes(1);
    expect(harness.profilePortfolio.emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'profile.projection.invalidated.v1',
        aggregateId: PARTY_ID,
        eventVersion: 1,
      }),
      expect.anything(),
      expect.any(AbortSignal),
    );
  });

  it('[P2-S06-AC-003,084,086] keeps createProductionWorkerApp on the profile route, never a test fallback', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      json(responses.publicProfile),
    );
    const app = createProductionWorkerApp(bindings, fetchImpl as never);
    const response = await app.fetch(readRequest(profilePath), bindings);

    expect(response.status).not.toBe(404);
    expect(fetchImpl).toHaveBeenCalled();
  });
});
