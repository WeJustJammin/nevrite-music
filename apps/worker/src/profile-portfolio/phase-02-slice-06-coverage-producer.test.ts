import { describe, it, vi } from 'vitest';

import { createWorkerApp } from '../index';
import {
  CREDIT_ID,
  PARTY_ID,
  bindings,
  createProfilePortfolioApp,
  expectApiError,
  jsonRequest,
} from './phase-02-slice-06.test-support';

const observationBody = {
  messageId: '15151515-1515-4515-8515-151515151515',
  producer: 'shard04',
  partyId: PARTY_ID,
  fact: {
    sourceType: 'credit',
    sourceId: CREDIT_ID,
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
  payload: {},
  observedAt: '2026-09-01T05:00:00.000Z',
} as const;

const appWithAuth = (auth: unknown) => {
  const harness = createProfilePortfolioApp();
  return createWorkerApp({ ...harness.dependencies, auth } as never);
};

describe('Phase 2 Slice 06 producer admission coverage', () => {
  it('short-circuits producer origin, body, headers, and rate failures', async () => {
    const harness = createProfilePortfolioApp();
    const crossOrigin = jsonRequest(
      'POST',
      '/internal/v1/profile-fact-observations',
      observationBody,
      { authenticated: false, internal: true },
    );
    crossOrigin.headers.set('origin', 'https://evil.example.test');
    await expectApiError(
      await harness.app.fetch(crossOrigin, bindings),
      403,
      'FORBIDDEN',
    );

    await expectApiError(
      await harness.app.fetch(
        jsonRequest(
          'POST',
          '/internal/v1/profile-fact-observations',
          {},
          { authenticated: false, internal: true },
        ),
        bindings,
      ),
      422,
      'VALIDATION_FAILED',
    );

    await expectApiError(
      await harness.app.fetch(
        jsonRequest(
          'POST',
          '/internal/v1/profile-fact-observations',
          observationBody,
          { authenticated: false, internal: true, ifMatch: '"1"' },
        ),
        bindings,
      ),
      400,
      'INVALID_REQUEST',
    );

    const base = createProfilePortfolioApp();
    const noRateAuthority = appWithAuth({
      ...base.dependencies.auth,
      rateLimit: vi.fn(async () => ({
        ok: false,
        status: 503,
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'Rate authority unavailable.',
        details: {},
      })),
    });
    await expectApiError(
      await noRateAuthority.fetch(
        jsonRequest(
          'POST',
          '/internal/v1/profile-fact-observations',
          observationBody,
          { authenticated: false, internal: true },
        ),
        bindings,
      ),
      503,
      'DEPENDENCY_UNAVAILABLE',
    );
  });
});
