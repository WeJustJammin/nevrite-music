import { describe, expect, it, vi } from 'vitest';

import {
  PHASE_1_P95_PROFILE,
  createOriginRequester,
  createProductionBuildRequester,
  formatSmokeEvidence,
  percentile,
  runApiP95Smoke,
  type SmokeResponse,
} from '../../infra/performance/api-p95-smoke.mjs';

describe('Phase 1 API p95 smoke contract', () => {
  it('locks the one-user, twenty-iteration, no-retry profile', () => {
    expect(PHASE_1_P95_PROFILE).toMatchObject({
      id: 'phase-1-api-p95-smoke',
      fixtureVersion: 'phase-1-2026-08-31',
      iterations: 20,
      retries: 0,
      virtualUsers: 1,
      route: {
        method: 'GET',
        path: '/api/v1/health',
        expectedStatus: 200,
      },
      thresholds: { p95Ms: 500 },
    });
  });

  it('uses nearest-rank percentiles so every reported value is an observed sample', () => {
    const samples = Array.from({ length: 20 }, (_, index) => index + 1);

    expect(percentile(samples, 50)).toBe(10);
    expect(percentile(samples, 95)).toBe(19);
    expect(percentile(samples, 99)).toBe(20);
  });

  it('runs requests sequentially with no implicit retry and validates every response', async () => {
    const starts: number[] = [];
    let inFlight = 0;
    let maximumInFlight = 0;
    let now = 0;
    const requester = vi.fn(async (): Promise<SmokeResponse> => {
      starts.push(inFlight);
      inFlight += 1;
      maximumInFlight = Math.max(maximumInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      now += 10;
      return new Response(
        JSON.stringify({
          requestId: '11111111-1111-4111-8111-111111111111',
          service: 'wejammin-api',
          status: 'ok',
          version: 'v1',
        }),
        { headers: { 'content-type': 'application/json' }, status: 200 },
      );
    });

    const result = await runApiP95Smoke({
      clock: () => now,
      profile: PHASE_1_P95_PROFILE,
      requester,
    });

    expect(requester).toHaveBeenCalledTimes(20);
    expect(maximumInFlight).toBe(1);
    expect(starts).toEqual(Array.from({ length: 20 }, () => 0));
    expect(result).toMatchObject({
      errors: 0,
      p50Ms: 10,
      p95Ms: 10,
      p99Ms: 10,
      samples: 20,
      passed: true,
    });
  });

  it('counts contract failures and fails the p95 threshold without retrying', async () => {
    let now = 0;
    const requester = vi.fn(async (): Promise<SmokeResponse> => {
      now += 600;
      return new Response(
        JSON.stringify({
          requestId: '11111111-1111-4111-8111-111111111111',
          service: 'wejammin-api',
          status: 'ok',
          version: 'v1',
        }),
        { headers: { 'content-type': 'application/json' }, status: 200 },
      );
    });

    const result = await runApiP95Smoke({
      clock: () => now,
      profile: PHASE_1_P95_PROFILE,
      requester,
    });

    expect(requester).toHaveBeenCalledTimes(20);
    expect(result).toMatchObject({
      errors: 0,
      p95Ms: 600,
      passed: false,
      thresholdFailures: ['p95Ms=600ms must be <500ms'],
    });
  });

  it('fails the strict architecture threshold when p95 equals 500 milliseconds', async () => {
    let now = 0;
    const requester = vi.fn(async (): Promise<SmokeResponse> => {
      now += 500;
      return new Response(
        JSON.stringify(PHASE_1_P95_PROFILE.route.expectedBody),
        { headers: { 'content-type': 'application/json' }, status: 200 },
      );
    });

    const result = await runApiP95Smoke({
      clock: () => now,
      profile: PHASE_1_P95_PROFILE,
      requester,
    });

    expect(requester).toHaveBeenCalledTimes(20);
    expect(result).toMatchObject({
      errors: 0,
      p95Ms: 500,
      passed: false,
      thresholdFailures: ['p95Ms=500ms must be <500ms'],
    });
  });

  it('counts malformed status responses as errors without retrying', async () => {
    let now = 0;
    const requester = vi.fn(async (): Promise<SmokeResponse> => {
      now += 5;
      return new Response(JSON.stringify({ status: 'not_ready' }), {
        headers: { 'content-type': 'application/json' },
        status: 503,
      });
    });

    const result = await runApiP95Smoke({
      clock: () => now,
      profile: PHASE_1_P95_PROFILE,
      requester,
    });

    expect(requester).toHaveBeenCalledTimes(20);
    expect(result).toMatchObject({
      errors: 20,
      p95Ms: 5,
      passed: false,
      samples: 20,
      thresholdFailures: [],
    });
  });

  it('serializes a stable machine-readable evidence line with exact summary keys', async () => {
    const requester = vi.fn(
      async (): Promise<SmokeResponse> =>
        new Response(
          JSON.stringify({
            requestId: '11111111-1111-4111-8111-111111111111',
            service: 'wejammin-api',
            status: 'ok',
            version: 'v1',
          }),
          { headers: { 'content-type': 'application/json' }, status: 200 },
        ),
    );

    const result = await runApiP95Smoke({
      clock: (() => {
        let value = 0;
        return () => value++;
      })(),
      profile: PHASE_1_P95_PROFILE,
      requester,
    });
    const evidence = JSON.parse(
      formatSmokeEvidence(result, {
        sourceRevision: 'a'.repeat(40),
        thresholds: PHASE_1_P95_PROFILE.thresholds,
      }),
    );

    expect(evidence).toMatchObject({
      sourceRevision: 'a'.repeat(40),
      thresholds: { p95Ms: 500 },
      passed: true,
    });
    expect(Object.keys(evidence)).toEqual([
      'sourceRevision',
      'thresholds',
      'errors',
      'p50Ms',
      'p95Ms',
      'p99Ms',
      'passed',
      'samples',
      'thresholdFailures',
    ]);
  });

  it('rejects an unusable production build before a smoke request is attempted', async () => {
    await expect(
      createProductionBuildRequester({
        artifactPath: '/tmp/wejammin-missing-production-build.js',
        environment: {
          APP_ENVIRONMENT: 'development',
          APP_RELEASE: 'phase-1-2026-08-31',
          SUPABASE_SECRET_KEY: 'synthetic-local-secret',
          SUPABASE_URL: 'http://127.0.0.1:54321',
        },
      }),
    ).rejects.toThrow('Production Worker artifact does not exist');
  });

  it('pins staging requests to the supplied HTTPS origin and preserves fixture headers', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify(PHASE_1_P95_PROFILE.route.expectedBody), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
    );
    const requester = createOriginRequester(
      'https://staging.example.test',
      fetchImpl,
    );

    const response = await requester(
      new Request('http://local.test/api/v1/health', {
        headers: PHASE_1_P95_PROFILE.route.headers,
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://staging.example.test/api/v1/health',
      expect.objectContaining({
        redirect: 'error',
      }),
    );
    const [, init] = fetchImpl.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).get('x-request-id')).toBe(
      '11111111-1111-4111-8111-111111111111',
    );
  });
});
