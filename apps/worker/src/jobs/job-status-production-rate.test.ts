import { afterEach, describe, expect, it, vi } from 'vitest';

import type { JobRateLimitInput } from './job-status-types';
import {
  createProductionJobStatusDependencies,
  JobStatusProductionInternalError,
  JobStatusProductionUnavailableError,
  type JobStatusProductionFetch,
  type JobStatusProductionOptions,
} from './job-status-production';

const URL = 'https://staging.example.supabase.co';
const SECRET = 'server-secret-test-only';
const USER = '22222222-2222-4222-8222-222222222222';
const PARTY = '44444444-4444-4444-8444-444444444444';
const environment = { SUPABASE_SECRET_KEY: SECRET, SUPABASE_URL: URL } as const;

const json = (value: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json', ...init.headers },
    ...init,
  });

const make = (
  fetchImpl: JobStatusProductionFetch,
  options: Partial<JobStatusProductionOptions> = {},
) =>
  createProductionJobStatusDependencies({ environment, fetchImpl, ...options });

afterEach(() => vi.restoreAllMocks());

describe('production JobStatus rate adapter', () => {
  it('uses the atomic user/party rate RPC and validates every boundary', async () => {
    const fetchImpl = vi.fn<JobStatusProductionFetch>(async () =>
      json([
        {
          allowed: true,
          limit_value: 600,
          remaining: 599,
          reset_at: '2026-08-30T06:02:00.000Z',
          scope: 'party',
        },
      ]),
    );
    const dependencies = make(fetchImpl);
    const signal = new AbortController().signal;
    await expect(
      dependencies.rateLimit({
        actingPartyId: PARTY,
        nowMs: 1_756_530_000_000,
        partyLimit: 600,
        signal,
        userId: USER,
        userLimit: 300,
      }),
    ).resolves.toEqual({
      allowed: true,
      limit: 600,
      remaining: 599,
      resetAt: Date.parse('2026-08-30T06:02:00.000Z') / 1_000,
      scope: 'party',
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      `${URL}/rest/v1/rpc/consume_job_read_rate_limit`,
    );
    expect(fetchImpl.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ p_acting_party_id: PARTY, p_user_id: USER }),
        headers: expect.objectContaining({
          'Accept-Profile': 'platform_api',
          'Content-Profile': 'platform_api',
        }),
        signal,
      }),
    );
    const base: JobRateLimitInput = {
      actingPartyId: null,
      nowMs: 1_756_530_000_000,
      partyLimit: 600,
      signal: new AbortController().signal,
      userId: USER,
      userLimit: 300,
    };
    for (const input of [
      { ...base, userId: 'bad' },
      { ...base, actingPartyId: 'bad' },
      { ...base, userLimit: 301 },
      { ...base, partyLimit: 601 },
      { ...base, nowMs: Number.MAX_SAFE_INTEGER + 1 },
      { ...base, nowMs: -1 },
    ]) {
      await expect(
        make(vi.fn<JobStatusProductionFetch>()).rateLimit(input),
      ).rejects.toBeInstanceOf(JobStatusProductionInternalError);
    }
  });

  it('rejects malformed rate results, RPC bodies, and aborted limiter calls', async () => {
    const payloads: unknown[] = [
      [],
      {},
      [{ allowed: true }],
      [
        {
          allowed: true,
          limit_value: 600,
          remaining: 599,
          reset_at: 'bad',
          scope: 'party',
        },
      ],
      [
        {
          allowed: true,
          limit_value: 600,
          remaining: 599,
          reset_at: '1969-12-31T23:59:59Z',
          scope: 'party',
        },
      ],
      [
        {
          allowed: true,
          limit_value: 600,
          remaining: 601,
          reset_at: '2026-08-30T06:02:00Z',
          scope: 'party',
        },
      ],
      [
        {
          allowed: true,
          limit_value: 0,
          remaining: 0,
          reset_at: '2026-08-30T06:02:00Z',
          scope: 'party',
        },
      ],
      [
        {
          allowed: 'yes',
          limit_value: 600,
          remaining: 599,
          reset_at: '2026-08-30T06:02:00Z',
          scope: 'party',
        },
      ],
      [
        {
          allowed: true,
          limit_value: '600',
          remaining: 599,
          reset_at: '2026-08-30T06:02:00Z',
          scope: 'party',
        },
      ],
      [
        {
          allowed: true,
          limit_value: 600,
          remaining: -1,
          reset_at: '2026-08-30T06:02:00Z',
          scope: 'party',
        },
      ],
      [
        {
          allowed: true,
          limit_value: 600,
          remaining: 599,
          reset_at: '2026-08-30T06:02:00Z',
          scope: 'other',
        },
      ],
      [
        {
          allowed: true,
          limit_value: 600,
          remaining: 599,
          reset_at: '2026-08-30T06:02:00Z',
          scope: 'party',
          extra: true,
        },
      ],
    ];
    for (const payload of payloads) {
      await expect(
        make(
          vi.fn<JobStatusProductionFetch>(async () => json(payload)),
        ).rateLimit({
          actingPartyId: PARTY,
          nowMs: 1_756_530_000_000,
          partyLimit: 600,
          signal: new AbortController().signal,
          userId: USER,
          userLimit: 300,
        }),
      ).rejects.toBeInstanceOf(JobStatusProductionInternalError);
    }
    const controller = new AbortController();
    controller.abort();
    await expect(
      make(vi.fn<JobStatusProductionFetch>()).rateLimit({
        actingPartyId: null,
        nowMs: 1_756_530_000_000,
        partyLimit: 600,
        signal: controller.signal,
        userId: USER,
        userLimit: 300,
      }),
    ).rejects.toBeInstanceOf(JobStatusProductionUnavailableError);
  });
});
