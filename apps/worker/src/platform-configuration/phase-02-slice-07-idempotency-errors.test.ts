import { describe, expect, it, vi } from 'vitest';

import type { AuthenticationResult } from '../authentication/types';
import type { ConfigurationPort } from './types';
import {
  REQUEST_ID,
  action,
  actionRequest,
  actionResponse,
  definitionRequest,
  effectiveRequest,
  expectError,
  makeHarness,
  proposal,
  proposalRequest,
  proposalResponse,
  releaseRequest,
} from './phase-02-slice-07.test-support';

describe('Phase 2 Slice 07 Worker route behavioral acceptance', () => {
  it('[P2-S07-AC-008,P2-S07-AC-020,P2-S07-AC-026,P2-S07-AC-053,P2-S07-AC-056,P2-S07-AC-059,P2-S07-AC-062] replays an identical mutation once and emits the response ETag', async () => {
    const port = vi.fn<ConfigurationPort>(async () => ({
      ok: true as const,
      value: proposalResponse,
    }));
    const harness = makeHarness({ port });
    const key = 'slice07-replay-identical';
    const first = await harness.app.request(
      proposalRequest(proposal, { 'idempotency-key': key }),
    );
    const replay = await harness.app.request(
      proposalRequest(proposal, { 'idempotency-key': key }),
    );

    expect(first.status).toBe(201);
    expect(replay.status).toBe(201);
    await expect(first.clone().json()).resolves.toEqual(proposalResponse);
    await expect(replay.clone().json()).resolves.toEqual(proposalResponse);
    expect(first.headers.get('etag')).toBe('"1"');
    expect(replay.headers.get('etag')).toBe('"1"');
    expect(port).toHaveBeenCalledOnce();
  });

  it('[P2-S07-AC-008,P2-S07-AC-020,P2-S07-AC-026,P2-S07-AC-053,P2-S07-AC-056,P2-S07-AC-059,P2-S07-AC-062] rejects an idempotency-key replay with changed content without a second port call', async () => {
    const port = vi.fn<ConfigurationPort>(async () => ({
      ok: true as const,
      value: proposalResponse,
    }));
    const harness = makeHarness({ port });
    const key = 'slice07-replay-conflict';

    await harness.app.request(
      proposalRequest(proposal, { 'idempotency-key': key }),
    );
    const conflict = await harness.app.request(
      proposalRequest(
        { ...proposal, typedValue: false },
        { 'idempotency-key': key },
      ),
    );

    await expectError(
      conflict,
      409,
      'IDEMPOTENCY_CONFLICT',
      'The idempotency key was used for another request.',
    );
    expect(port).toHaveBeenCalledOnce();
  });

  it('[P2-S07-AC-008,P2-S07-AC-020,P2-S07-AC-026] forwards a valid If-Match value to the port while retaining the response version ETag', async () => {
    let received: Parameters<ConfigurationPort>[0] | undefined;
    const port = vi.fn<ConfigurationPort>(async (input) => {
      received = input;
      return { ok: true as const, value: actionResponse };
    });
    const harness = makeHarness({ port });

    const response = await harness.app.request(
      actionRequest(action, { 'if-match': '"7"' }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('etag')).toBe('"2"');
    expect(received?.ifMatch).toBe('7');
    expect(port).toHaveBeenCalledOnce();
  });

  it.each([
    {
      criterion: 'P2-S07-AC-008',
      makeRequest: () => releaseRequest(definitionRequest),
      limit: 30,
    },
    {
      criterion: 'P2-S07-AC-014',
      makeRequest: effectiveRequest,
      limit: 300,
    },
    {
      criterion: 'P2-S07-AC-020',
      makeRequest: proposalRequest,
      limit: 60,
    },
    {
      criterion: 'P2-S07-AC-026',
      makeRequest: actionRequest,
      limit: 30,
    },
  ])(
    '[$criterion] maps a denied rate decision to 429 with rate-limit headers and no port call',
    async ({ makeRequest, limit }) => {
      const dateNow = vi
        .spyOn(Date, 'now')
        .mockReturnValue(Date.parse('2026-09-03T12:00:00.000Z'));
      try {
        const resetAt = Math.floor(Date.now() / 1000) + 60;
        const harness = makeHarness({
          rateLimit: {
            ok: true,
            value: { allowed: false, limit, remaining: 0, resetAt },
          },
        });

        const response = await harness.app.request(makeRequest());

        expect(response.status).toBe(429);
        await expect(response.json()).resolves.toMatchObject({
          code: 'RATE_LIMITED',
          message: 'Too many requests.',
          requestId: REQUEST_ID,
        });
        expect(response.headers.get('ratelimit-limit')).toBe(String(limit));
        expect(response.headers.get('ratelimit-remaining')).toBe('0');
        expect(response.headers.get('ratelimit-reset')).toBe(String(resetAt));
        expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
        expect(harness.port).not.toHaveBeenCalled();
      } finally {
        dateNow.mockRestore();
      }
    },
  );

  it('[P2-S07-AC-009,P2-S07-AC-015,P2-S07-AC-021,P2-S07-AC-027] maps a rate-limiter outage to a typed dependency error before the port', async () => {
    const harness = makeHarness({ rateLimitThrows: true });

    const response = await harness.app.request(proposalRequest());

    await expectError(
      response,
      503,
      'DEPENDENCY_UNAVAILABLE',
      'Rate limiting is temporarily unavailable.',
      { dependencyClass: 'rate_limiter', retryable: true },
    );
    expect(harness.port).not.toHaveBeenCalled();
  });

  it.each([
    {
      criterion: 'P2-S07-AC-009,P2-S07-AC-052',
      makeRequest: () => releaseRequest(definitionRequest),
      error: {
        ok: false as const,
        status: 409 as const,
        code: 'DEFINITION_KEY_REUSED',
        message: 'The definition key has already been used.',
      },
    },
    {
      criterion: 'P2-S07-AC-015,P2-S07-AC-055',
      makeRequest: effectiveRequest,
      error: {
        ok: false as const,
        status: 503 as const,
        code: 'VALUE_UNAVAILABLE',
        message: 'The effective value is temporarily unavailable.',
      },
    },
    {
      criterion: 'P2-S07-AC-021,P2-S07-AC-058',
      makeRequest: proposalRequest,
      error: {
        ok: false as const,
        status: 422 as const,
        code: 'VALUE_INVALID',
        message: 'The setting value is invalid.',
      },
    },
    {
      criterion: 'P2-S07-AC-027,P2-S07-AC-061',
      makeRequest: actionRequest,
      error: {
        ok: false as const,
        status: 503 as const,
        code: 'SNAPSHOT_UNAVAILABLE',
        message: 'The runtime snapshot is not available.',
      },
    },
  ] as const)(
    '[$criterion] preserves the typed domain/dependency failure and does not fabricate success',
    async ({ makeRequest, error }) => {
      const port = vi.fn<ConfigurationPort>(async () => error);
      const harness = makeHarness({ port });

      const response = await harness.app.request(makeRequest());

      await expectError(response, error.status, error.code, error.message);
      expect(port).toHaveBeenCalledOnce();
    },
  );

  it.each([
    {
      criterion: 'P2-S07-AC-005,P2-S07-AC-008,P2-S07-AC-009,P2-S07-AC-010',
      operationId: 'CFG-05A-01' as const,
      deadline: 15_000,
      makeRequest: () =>
        releaseRequest(definitionRequest, {
          'idempotency-key': 'slice07-deadline-register',
        }),
    },
    {
      criterion: 'P2-S07-AC-011,P2-S07-AC-014,P2-S07-AC-015,P2-S07-AC-016',
      operationId: 'CFG-05A-02' as const,
      deadline: 8_000,
      makeRequest: effectiveRequest,
    },
    {
      criterion: 'P2-S07-AC-017,P2-S07-AC-020,P2-S07-AC-021,P2-S07-AC-022',
      operationId: 'CFG-05A-03' as const,
      deadline: 15_000,
      makeRequest: () =>
        proposalRequest(proposal, {
          'idempotency-key': 'slice07-deadline-propose',
        }),
    },
    {
      criterion: 'P2-S07-AC-023,P2-S07-AC-026,P2-S07-AC-027,P2-S07-AC-028',
      operationId: 'CFG-05A-04' as const,
      deadline: 15_000,
      makeRequest: () =>
        actionRequest(action, { 'idempotency-key': 'slice07-deadline-action' }),
    },
  ])(
    '[$criterion] maps the declared $operationId route deadline to UPSTREAM_TIMEOUT',
    async ({ operationId, deadline, makeRequest }) => {
      vi.useFakeTimers();
      try {
        const port = vi.fn<ConfigurationPort>(
          () => new Promise<AuthenticationResult<unknown>>(() => undefined),
        );
        const harness = makeHarness({ port });
        const responsePromise = harness.app.request(makeRequest());
        await vi.advanceTimersByTimeAsync(0);
        expect(port).toHaveBeenCalledOnce();
        expect(port.mock.calls[0]?.[0].operationId).toBe(operationId);
        await vi.advanceTimersByTimeAsync(deadline);
        const response = await responsePromise;

        await expectError(
          response,
          504,
          'UPSTREAM_TIMEOUT',
          'Configuration persistence timed out.',
        );
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it('[P2-S07-AC-009,P2-S07-AC-015,P2-S07-AC-021,P2-S07-AC-027,P2-S07-AC-052,P2-S07-AC-055,P2-S07-AC-058,P2-S07-AC-061] maps a thrown port dependency to VALUE_UNAVAILABLE', async () => {
    const port = vi.fn<ConfigurationPort>(async () => {
      throw new Error('database connection failed');
    });
    const harness = makeHarness({ port });

    const response = await harness.app.request(effectiveRequest());

    await expectError(
      response,
      503,
      'VALUE_UNAVAILABLE',
      'Configuration persistence is temporarily unavailable.',
    );
    expect(port).toHaveBeenCalledOnce();
  });

  it('[P2-S07-AC-009,P2-S07-AC-015,P2-S07-AC-021,P2-S07-AC-027] rejects an invalid successful port projection as UPSTREAM_FAILURE', async () => {
    const port = vi.fn<ConfigurationPort>(async () => ({
      ok: true as const,
      value: { notAConfigurationProjection: true },
    }));
    const harness = makeHarness({ port });

    const response = await harness.app.request(effectiveRequest());

    await expectError(
      response,
      502,
      'UPSTREAM_FAILURE',
      'The configuration dependency returned an invalid response.',
    );
    expect(port).toHaveBeenCalledOnce();
  });
});
