import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp } from '../index';
import { ReelItemPathSchema, emphasisBodySchema } from './route-registration';
import {
  checkProfilePortfolioCsrf,
  parseProfileCommandHeaders,
  profilePortfolioPolicy,
} from './route-support';
import {
  CREDIT_ID,
  PARTY_ID,
  REEL_ITEM_ID,
  bindings,
  createProfilePortfolioApp,
  expectApiError,
  jsonRequest,
  readRequest,
} from './phase-02-slice-06.test-support';

const profilePath = `/api/v1/profiles/${PARTY_ID}`;
const factRef = {
  sourceType: 'credit',
  sourceId: CREDIT_ID,
  sourceVersion: '3',
} as const;
const emphasisBody = {
  surface: 'public',
  defaultFilter: null,
  orderedRefs: [],
} as const;
const appWithAuth = (auth: unknown) => {
  const harness = createProfilePortfolioApp();
  return {
    ...harness,
    app: createWorkerApp({ ...harness.dependencies, auth } as never),
  };
};

describe('Phase 2 Slice 06 admission, registration, and support coverage', () => {
  it('fails closed when an operation has no active route policy', () => {
    expect(() => profilePortfolioPolicy('PRF-EPK-01')).toThrow(
      'Missing profile portfolio policy PRF-EPK-01',
    );
  });

  it('covers strict reel path and duplicate emphasis compatibility parsing', () => {
    expect(ReelItemPathSchema.safeParse(null).success).toBe(false);
    expect(ReelItemPathSchema.safeParse({ reelItemId: 7 }).success).toBe(false);
    expect(
      ReelItemPathSchema.safeParse({ reelItemId: REEL_ITEM_ID }).success,
    ).toBe(true);
    expect(emphasisBodySchema.safeParse(null).success).toBe(false);
    expect(
      emphasisBodySchema.safeParse({ ...emphasisBody, orderedRefs: [null] })
        .success,
    ).toBe(false);
    expect(
      emphasisBodySchema.safeParse({
        ...emphasisBody,
        orderedRefs: [factRef, factRef],
      }).success,
    ).toBe(true);
    expect(
      emphasisBodySchema.safeParse({
        ...emphasisBody,
        surface: 'invalid',
        orderedRefs: [factRef, factRef],
      }).success,
    ).toBe(false);
  });

  it('covers command header admission branches including parser disagreement', () => {
    const noVersion = new Request('https://api.example.test/coverage', {
      headers: { 'idempotency-key': 'coverage-header-key' },
    });
    expect(parseProfileCommandHeaders(noVersion, false)).toMatchObject({
      ok: true,
    });
    expect(parseProfileCommandHeaders(noVersion, true)).toMatchObject({
      ok: false,
      code: 'INVALID_REQUEST',
    });

    const unexpectedVersion = new Request('https://api.example.test/coverage', {
      headers: {
        'idempotency-key': 'coverage-header-key',
        'if-match': '"1"',
      },
    });
    expect(parseProfileCommandHeaders(unexpectedVersion, false)).toMatchObject({
      ok: false,
      code: 'INVALID_REQUEST',
    });

    const changingHeaders = new Request('https://api.example.test/coverage', {
      headers: {
        'idempotency-key': 'coverage-header-key',
        'if-match': '"1"',
      },
    });
    const originalGet = changingHeaders.headers.get.bind(
      changingHeaders.headers,
    );
    let ifMatchReads = 0;
    vi.spyOn(changingHeaders.headers, 'get').mockImplementation((name) => {
      if (name.toLowerCase() !== 'if-match') return originalGet(name);
      ifMatchReads += 1;
      return ifMatchReads === 1 ? '"1"' : null;
    });
    expect(parseProfileCommandHeaders(changingHeaders, true)).toMatchObject({
      ok: false,
    });
  });

  it('returns disclosure-safe not found for a valid unmatched reel item path', async () => {
    const harness = createProfilePortfolioApp();
    await expectApiError(
      await harness.app.fetch(
        readRequest(`/api/v1/reel-items/${REEL_ITEM_ID}`),
        bindings,
      ),
      404,
      'NOT_FOUND',
    );
  });

  it('accepts bearer session credentials for protected reads', async () => {
    const harness = createProfilePortfolioApp();
    const request = readRequest(`${profilePath}/emphasis`, 'surface=public');
    request.headers.set('authorization', 'Bearer opaque-session-token');
    expect((await harness.app.fetch(request, bindings)).status).toBe(200);
  });

  it('fails closed when session authority is unavailable', async () => {
    const harness = appWithAuth(undefined);
    await expectApiError(
      await harness.app.fetch(
        readRequest(`${profilePath}/emphasis`, 'surface=public', true),
        bindings,
      ),
      503,
      'DEPENDENCY_UNAVAILABLE',
    );
    await expectApiError(
      await harness.app.fetch(readRequest(profilePath), bindings),
      503,
      'DEPENDENCY_UNAVAILABLE',
    );
  });

  it('preserves typed session failures and requires a complete acting session', async () => {
    const base = createProfilePortfolioApp();
    const typed = appWithAuth({
      ...base.dependencies.auth,
      resolveSession: vi.fn(async () => ({
        ok: false,
        status: 401,
        code: 'UNAUTHENTICATED',
        message: 'Session expired.',
        details: {},
      })),
    });
    await expectApiError(
      await typed.app.fetch(
        readRequest(`${profilePath}/emphasis`, 'surface=public', true),
        bindings,
      ),
      401,
      'UNAUTHENTICATED',
    );

    const incomplete = appWithAuth({
      ...base.dependencies.auth,
      resolveSession: vi.fn(async () => ({
        ok: true,
        value: {
          authUserId: 'auth-user-06',
          personId: null,
          actingPartyId: null,
        },
      })),
    });
    await expectApiError(
      await incomplete.app.fetch(
        readRequest(`${profilePath}/emphasis`, 'surface=public', true),
        bindings,
      ),
      403,
      'FORBIDDEN',
    );
  });

  it('maps thrown session and rate dependencies to retryable unavailability', async () => {
    const base = createProfilePortfolioApp();
    const brokenSession = appWithAuth({
      ...base.dependencies.auth,
      resolveSession: vi.fn(async () => {
        throw new Error('session dependency unavailable');
      }),
    });
    await expectApiError(
      await brokenSession.app.fetch(
        readRequest(`${profilePath}/emphasis`, 'surface=public', true),
        bindings,
      ),
      503,
      'DEPENDENCY_UNAVAILABLE',
    );

    const brokenRate = appWithAuth({
      ...base.dependencies.auth,
      rateLimit: vi.fn(async () => {
        throw new Error('rate dependency unavailable');
      }),
    });
    await expectApiError(
      await brokenRate.app.fetch(readRequest(profilePath), bindings),
      503,
      'DEPENDENCY_UNAVAILABLE',
    );
  });

  it('preserves a typed rate-limit dependency failure', async () => {
    const base = createProfilePortfolioApp();
    const harness = appWithAuth({
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
      await harness.app.fetch(readRequest(profilePath), bindings),
      503,
      'DEPENDENCY_UNAVAILABLE',
    );
  });

  it('accepts same-origin opaque double-submit CSRF without an Origin header', async () => {
    const harness = createProfilePortfolioApp();
    const request = jsonRequest(
      'PUT',
      `${profilePath}/emphasis`,
      emphasisBody,
      { ifMatch: '"1"' },
    );
    request.headers.delete('origin');
    request.headers.set(
      'cookie',
      'wj_session_ref=session; wj_csrf=opaque_csrf_token_06',
    );
    request.headers.set('x-csrf-token', 'opaque_csrf_token_06');
    expect((await harness.app.fetch(request, bindings)).status).toBe(200);
  });

  it('rejects malformed fallback CSRF and producer admission variants', async () => {
    const harness = createProfilePortfolioApp();
    const malformedCsrf = jsonRequest(
      'PUT',
      `${profilePath}/emphasis`,
      emphasisBody,
      { ifMatch: '"1"' },
    );
    malformedCsrf.headers.delete('origin');
    malformedCsrf.headers.set(
      'cookie',
      'wj_session_ref=session; wj_csrf=not.opaque',
    );
    malformedCsrf.headers.set('x-csrf-token', 'not.opaque');
    await expectApiError(
      await harness.app.fetch(malformedCsrf, bindings),
      403,
      'FORBIDDEN',
    );

    const producer = jsonRequest(
      'POST',
      '/internal/v1/profile-fact-observations',
      {},
      { authenticated: false, internal: true },
    );
    producer.headers.set('x-producer-id', '1bad');
    producer.headers.set('x-producer-signature', 'short');
    await expectApiError(
      await harness.app.fetch(producer, bindings),
      401,
      'PRODUCER_AUTH_FAILED',
    );
  });

  it('fails direct CSRF admission without a token or with a foreign origin', async () => {
    const noToken = jsonRequest(
      'PUT',
      `${profilePath}/emphasis`,
      emphasisBody,
      { authenticated: false, ifMatch: '"1"' },
    );
    const context = (request: Request) =>
      ({
        req: {
          raw: request,
          url: request.url,
          header: (name: string) => request.headers.get(name) ?? undefined,
        },
      }) as never;
    await expect(
      checkProfilePortfolioCsrf(context(noToken)),
    ).resolves.toMatchObject({ ok: false });

    const foreign = noToken.clone();
    foreign.headers.set('origin', 'https://evil.example.test');
    await expect(
      checkProfilePortfolioCsrf(context(foreign)),
    ).resolves.toMatchObject({ ok: false });
  });

  it('short-circuits command origin, session, and rate failures', async () => {
    const crossOrigin = createProfilePortfolioApp();
    const crossOriginRequest = jsonRequest(
      'PUT',
      `${profilePath}/emphasis`,
      emphasisBody,
      { ifMatch: '"1"' },
    );
    crossOriginRequest.headers.set('origin', 'https://evil.example.test');
    await expectApiError(
      await crossOrigin.app.fetch(crossOriginRequest, bindings),
      403,
      'FORBIDDEN',
    );

    const noSessionAuthority = appWithAuth(undefined);
    await expectApiError(
      await noSessionAuthority.app.fetch(
        jsonRequest('PUT', `${profilePath}/emphasis`, emphasisBody, {
          ifMatch: '"1"',
        }),
        bindings,
      ),
      503,
      'DEPENDENCY_UNAVAILABLE',
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
      await noRateAuthority.app.fetch(
        jsonRequest('PUT', `${profilePath}/emphasis`, emphasisBody, {
          ifMatch: '"1"',
        }),
        bindings,
      ),
      503,
      'DEPENDENCY_UNAVAILABLE',
    );
  });
});
