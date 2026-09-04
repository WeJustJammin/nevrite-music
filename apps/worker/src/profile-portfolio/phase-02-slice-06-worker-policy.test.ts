import { describe, expect, it } from 'vitest';

import {
  CREDIT_ID,
  PARTY_ID,
  bindings,
  createProfilePortfolioApp,
  expectApiError,
  failure,
  jsonRequest,
  readRequest,
} from './phase-02-slice-06.test-support';

const profilePath = `/api/v1/profiles/${PARTY_ID}`;
const factRef = {
  sourceType: 'credit',
  sourceId: CREDIT_ID,
  sourceVersion: '3',
} as const;
const observationBody = {
  messageId: '15151515-1515-4515-8515-151515151515',
  producer: 'shard04',
  partyId: PARTY_ID,
  fact: factRef,
  provenanceState: 'attested',
  evidenceClass: 'governed_credit',
  evidenceCount: 1,
  visibility: 'public',
  embargoUntil: null,
  listingState: 'listed',
  disputeState: 'clear',
  occurredOn: null,
  roleCodes: ['performer'],
  payload: {},
  observedAt: '2026-09-01T05:00:00.000Z',
} as const;

describe('Phase 2 Slice 06 Worker policy RED acceptance', () => {
  it('[P2-S06-AC-084,085,086,087,088,089,090,091,092,093,094] rejects reflected cross-origin credentials', async () => {
    const harness = createProfilePortfolioApp();
    const request = readRequest(profilePath);
    request.headers.set('origin', 'https://evil.example.test');
    const response = await harness.app.fetch(request, bindings);

    expect(response.status).toBe(403);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(harness.profilePortfolio.readPublicProfile).not.toHaveBeenCalled();
  });

  it('[P2-S06-AC-064,065] authenticates the internal producer boundary before parsing observations', async () => {
    const harness = createProfilePortfolioApp();
    const request = jsonRequest(
      'POST',
      '/internal/v1/profile-fact-observations',
      observationBody,
      { authenticated: false },
    );

    await expectApiError(
      await harness.app.fetch(request, bindings),
      401,
      'PRODUCER_AUTH_FAILED',
    );
    expect(
      harness.profilePortfolio.ingestProfileFactObservation,
    ).not.toHaveBeenCalled();
  });

  it('[P2-S06-AC-064,065] rejects unknown observation keys and arbitrary query parameters', async () => {
    const harness = createProfilePortfolioApp();
    const request = jsonRequest(
      'POST',
      '/internal/v1/profile-fact-observations',
      { ...observationBody, privateEvidence: 'must-not-cross-boundary' },
      { authenticated: false, internal: true, query: 'limit=999' },
    );

    await expectApiError(
      await harness.app.fetch(request, bindings),
      400,
      'INVALID_REQUEST',
    );
    expect(
      harness.profilePortfolio.ingestProfileFactObservation,
    ).not.toHaveBeenCalled();
  });

  it('[P2-S06-AC-073,074] rejects invalid emphasis references and tampered cursors with typed errors', async () => {
    const harness = createProfilePortfolioApp({
      putEmphasis: async () => failure(422, 'INVALID_EMPHASIS'),
      readPortfolio: async () => failure(400, 'INVALID_REQUEST'),
    });

    await expectApiError(
      await harness.app.fetch(
        jsonRequest(
          'PUT',
          `${profilePath}/emphasis`,
          {
            surface: 'public',
            defaultFilter: { roleCodes: ['performer'] },
            orderedRefs: [factRef, factRef],
          },
          { ifMatch: '"1"' },
        ),
        bindings,
      ),
      422,
      'INVALID_EMPHASIS',
    );
    await expectApiError(
      await harness.app.fetch(
        readRequest(
          `${profilePath}/portfolio`,
          'cursor=tampered-cursor&limit=25',
        ),
        bindings,
      ),
      400,
      'INVALID_REQUEST',
    );
  });

  it('[P2-S06-AC-074] reports a projection version change as CURSOR_STALE', async () => {
    const harness = createProfilePortfolioApp({
      readPortfolio: async () => failure(409, 'CURSOR_STALE'),
    });
    await expectApiError(
      await harness.app.fetch(
        readRequest(
          `${profilePath}/portfolio`,
          'cursor=signed-cursor-0123456789',
        ),
        bindings,
      ),
      409,
      'CURSOR_STALE',
    );
  });

  it('[P2-S06-AC-001,003,027,033,084,086] applies public ETag/cache policy and protects the response schema', async () => {
    const harness = createProfilePortfolioApp();
    const response = await harness.app.fetch(
      readRequest(profilePath),
      bindings,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toMatch(/^"[1-9][0-9]*"$/);
    expect(response.headers.get('cache-control')).toContain('public');
    expect(response.headers.get('cache-control')).toContain(
      'stale-if-error=300',
    );
    const payload = (await response.json()) as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['data', 'meta']);
    expect(JSON.stringify(payload)).not.toMatch(
      /tokenHash|legalIdentity|traderAddress|attester/i,
    );
  });

  it('[P2-S06-AC-009,021,063,094] applies private no-store policy to protected ETag responses', async () => {
    const harness = createProfilePortfolioApp();
    const response = await harness.app.fetch(
      readRequest(`${profilePath}/emphasis`, 'surface=public', true),
      bindings,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('etag')).toMatch(/^"[1-9][0-9]*"$/);
  });

  it('[P2-S06-AC-064,065] forwards idempotency and request metadata only after producer authentication', async () => {
    const harness = createProfilePortfolioApp();
    const request = jsonRequest(
      'POST',
      '/internal/v1/profile-fact-observations',
      observationBody,
      {
        authenticated: false,
        internal: true,
        idempotencyKey: 'producer-key-01',
      },
    );
    const response = await harness.app.fetch(request, bindings);

    expect(response.status).toBe(202);
    expect(
      harness.profilePortfolio.ingestProfileFactObservation,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: 'PRF-PROF-10',
        idempotencyKey: 'producer-key-01',
      }),
      expect.anything(),
      expect.any(AbortSignal),
    );
  });

  it('[P2-S06-AC-008,020,026,032,038,044,050,056,062,068] does not emit projection invalidation on a rejected mutation', async () => {
    const harness = createProfilePortfolioApp({
      putEmphasis: async () => failure(409, 'VERSION_CONFLICT'),
    });
    await expectApiError(
      await harness.app.fetch(
        jsonRequest(
          'PUT',
          `${profilePath}/emphasis`,
          {
            surface: 'public',
            defaultFilter: null,
            orderedRefs: [],
          },
          { ifMatch: '"1"' },
        ),
        bindings,
      ),
      409,
      'VERSION_CONFLICT',
    );
    expect(harness.profilePortfolio.emitEvent).not.toHaveBeenCalled();
  });
});
