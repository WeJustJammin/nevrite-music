import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogger } from '@wejammin/observability/logging';

import { createWorkerApp, type WorkerDependencies } from '../index';
import { createJobReadRateLimiter } from './job-status-rate-limit';
import { authorizeJobStatus, currentTimeMs } from './job-status-access';
import {
  JobStatusDependencyError,
  JobStatusInternalError,
  type JobRateLimitInput,
} from './job-status';
import { readJobStatus } from './job-status-read';
import {
  invalidPathError,
  parseJobPath,
  parsePrincipal,
  parseRateDecision,
} from './job-status-support';
import {
  bindings,
  createJobDependencies,
  createTestApp,
  JOB_ID,
  PARTY_ID,
  record,
  request,
  USER_ID,
} from './job-status-test-support';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Worker job-status branch protection', () => {
  it('covers the process-local limiter user and party windows', () => {
    const limiter = createJobReadRateLimiter();
    const base: JobRateLimitInput = {
      actingPartyId: null,
      nowMs: 1_000,
      partyLimit: 600,
      signal: new AbortController().signal,
      userId: USER_ID,
      userLimit: 300,
    };

    expect(limiter(base).allowed).toBe(true);
    expect(limiter({ ...base, nowMs: 1_001 }).allowed).toBe(true);
    expect(
      limiter({ ...base, actingPartyId: PARTY_ID, nowMs: 1_002 }).scope,
    ).toBe('user');

    const limited = createJobReadRateLimiter();
    const oneRead = { ...base, userLimit: 1 };
    expect(limited(oneRead).allowed).toBe(true);
    expect(limited({ ...oneRead, nowMs: 1_003 }).allowed).toBe(false);
    expect(limited({ ...oneRead, nowMs: 61_000 }).allowed).toBe(true);

    const partyWins = createJobReadRateLimiter();
    const partyInput = {
      ...base,
      actingPartyId: PARTY_ID,
      partyLimit: 1,
      userLimit: 300,
    };
    expect(partyWins(partyInput)).toMatchObject({
      allowed: true,
      limit: 1,
      remaining: 0,
      scope: 'party',
    });
  });

  it('parses all principal classes and rejects malformed authority snapshots', () => {
    expect(parsePrincipal(null)).toBeNull();
    expect(parsePrincipal(undefined)).toBeNull();
    expect(parsePrincipal('anonymous')).toBe('invalid');
    expect(parsePrincipal({})).toBe('invalid');
    expect(parsePrincipal({ kind: 'anonymous', extra: true })).toBe('invalid');
    expect(parsePrincipal({ kind: 'anonymous' })).toEqual({
      kind: 'anonymous',
    });
    expect(parsePrincipal({ kind: 'user', userId: USER_ID })).toEqual({
      kind: 'user',
      userId: USER_ID,
    });
    expect(parsePrincipal({ kind: 'user', userId: 'wrong' })).toBe('invalid');
    expect(parsePrincipal({ kind: 'user', userId: USER_ID, extra: true })).toBe(
      'invalid',
    );
    expect(
      parsePrincipal({
        kind: 'acting_party',
        userId: USER_ID,
        actingPartyId: PARTY_ID,
        capabilities: ['jobs.read'],
      }),
    ).not.toBe('invalid');
    expect(
      parsePrincipal({
        kind: 'acting_party',
        userId: 'wrong',
        actingPartyId: PARTY_ID,
        capabilities: [],
      }),
    ).toBe('invalid');
    expect(
      parsePrincipal({
        kind: 'acting_party',
        userId: USER_ID,
        actingPartyId: 'wrong',
        capabilities: [],
      }),
    ).toBe('invalid');
    expect(
      parsePrincipal({
        kind: 'acting_party',
        userId: USER_ID,
        actingPartyId: PARTY_ID,
        capabilities: 'jobs.read',
      }),
    ).toBe('invalid');
    expect(
      parsePrincipal({
        kind: 'acting_party',
        userId: USER_ID,
        actingPartyId: PARTY_ID,
        capabilities: ['x'],
      }),
    ).toBe('invalid');
    expect(
      parsePrincipal({
        kind: 'acting_party',
        userId: USER_ID,
        actingPartyId: PARTY_ID,
        capabilities: Array.from({ length: 65 }, (_, index) => `cap${index}`),
      }),
    ).toBe('invalid');
    expect(
      parsePrincipal({
        kind: 'acting_party',
        userId: USER_ID,
        actingPartyId: PARTY_ID,
        capabilities: ['jobs.read', 'jobs.read'],
      }),
    ).toBe('invalid');
    expect(
      parsePrincipal({
        kind: 'operator',
        userId: USER_ID,
        actingPartyId: null,
        capabilities: ['jobs.read:any'],
        stepUpVerified: true,
        reason: 'review',
      }),
    ).not.toBe('invalid');
    const operator = {
      kind: 'operator',
      userId: USER_ID,
      actingPartyId: PARTY_ID,
      capabilities: ['jobs.read:any'],
      stepUpVerified: true,
      reason: 'review',
    };
    expect(parsePrincipal({ ...operator, userId: 'wrong' })).toBe('invalid');
    expect(parsePrincipal({ ...operator, actingPartyId: 'wrong' })).toBe(
      'invalid',
    );
    expect(parsePrincipal({ ...operator, capabilities: 'jobs.read:any' })).toBe(
      'invalid',
    );
    expect(parsePrincipal({ ...operator, stepUpVerified: 'yes' })).toBe(
      'invalid',
    );
    expect(parsePrincipal({ ...operator, reason: '' })).toBe('invalid');
    expect(parsePrincipal({ ...operator, reason: null })).not.toBe('invalid');
    expect(parsePrincipal({ ...operator, reason: 'x'.repeat(241) })).toBe(
      'invalid',
    );
    expect(parsePrincipal({ ...operator, extra: true })).toBe('invalid');
    for (const kind of ['queue', 'webhook', 'deployment', 'service']) {
      expect(parsePrincipal({ kind })).toEqual({ kind });
      expect(parsePrincipal({ kind, extra: true })).toBe('invalid');
    }
    expect(parsePrincipal({ kind: 'other' })).toBe('invalid');
  });

  it('validates rate decisions and paths without trusting raw input', () => {
    const valid = {
      allowed: true,
      limit: 300,
      remaining: 299,
      resetAt: 1_756_530_000,
      scope: 'user' as const,
    };
    expect(parseRateDecision(valid)).toEqual(valid);
    expect(parseRateDecision(null)).toBeNull();
    const invalid = [
      { allowed: 'yes' },
      { ...valid, limit: '300' },
      { ...valid, limit: 1.5 },
      { ...valid, limit: 0 },
      { ...valid, remaining: '299' },
      { ...valid, remaining: 1.5 },
      { ...valid, remaining: -1 },
      { ...valid, remaining: 301 },
      { ...valid, resetAt: 'now' },
      { ...valid, resetAt: 1.5 },
      { ...valid, resetAt: -1 },
      { ...valid, scope: 'other' },
    ];
    for (const candidate of invalid)
      expect(parseRateDecision(candidate)).toBeNull();

    expect(parseJobPath(request('/api/v1/jobs/'))).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(parseJobPath(request('/not-jobs'))).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(parseJobPath(request('/api/v1/jobs'))).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(invalidPathError()).toMatchObject({ status: 400 });
  });

  it('fails safely for dependency, authority, record, and route edge cases', async () => {
    const resolverFailure = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => {
          throw new Error('session provider down');
        }),
      }),
    );
    expect((await resolverFailure.fetch(request(), bindings)).status).toBe(503);

    const malformedPrincipal = createTestApp(
      createJobDependencies({ resolvePrincipal: vi.fn(async () => ({})) }),
    );
    expect((await malformedPrincipal.fetch(request(), bindings)).status).toBe(
      500,
    );

    const invalidClock = createTestApp(
      createJobDependencies({ now: () => -1 }),
    );
    expect((await invalidClock.fetch(request(), bindings)).status).toBe(503);

    const malformedRate = createTestApp(
      createJobDependencies({
        rateLimit: vi.fn(async () => undefined as never),
      }),
    );
    expect((await malformedRate.fetch(request(), bindings)).status).toBe(500);

    const rateFailure = createTestApp(
      createJobDependencies({
        rateLimit: vi.fn(async () => {
          throw new Error('limiter down');
        }),
      }),
    );
    expect((await rateFailure.fetch(request(), bindings)).status).toBe(503);

    const invalidData = createTestApp(
      createJobDependencies({
        loadJobStatus: vi.fn(async () => ({
          ...record,
          data: {} as never,
        })),
      }),
    );
    expect((await invalidData.fetch(request(), bindings)).status).toBe(500);
    const invalidActor = createTestApp(
      createJobDependencies({
        loadJobStatus: vi.fn(async () => ({ ...record, actorId: 'wrong' })),
      }),
    );
    expect((await invalidActor.fetch(request(), bindings)).status).toBe(500);
    const invalidParty = createTestApp(
      createJobDependencies({
        loadJobStatus: vi.fn(async () => ({
          ...record,
          actingPartyId: 'wrong',
        })),
      }),
    );
    expect((await invalidParty.fetch(request(), bindings)).status).toBe(500);

    const noJobsDependencies: WorkerDependencies = {
      captureException: vi.fn(),
      createLogger: () =>
        createLogger({
          environment: 'staging',
          release: 'slice03-test',
          service: 'wejammin-api',
        }),
      now: () => 1_756_530_000_000,
    };
    const noJobsApp = createWorkerApp(noJobsDependencies);
    expect((await noJobsApp.fetch(request(), bindings)).status).toBe(503);

    const fallbackDependencies = { ...createJobDependencies() };
    delete (fallbackDependencies as { rateLimit?: unknown }).rateLimit;
    const fallbackApp = createTestApp(fallbackDependencies);
    expect((await fallbackApp.fetch(request(), bindings)).status).toBe(503);

    expect(new JobStatusDependencyError().message).toContain('unavailable');
    expect(new JobStatusInternalError().message).toContain('failure');
  });

  it('short-circuits malformed paths and maps missing operator audit ports', async () => {
    const dependency = createJobDependencies();
    const malformed = await readJobStatus(
      request('/api/v1/jobs/not-a-uuid'),
      '11111111-1111-4111-8111-111111111111',
      dependency,
      async () => ({
        allowed: true,
        limit: 300,
        remaining: 299,
        resetAt: 1_756_530_000,
        scope: 'user' as const,
      }),
    );
    expect(malformed).toMatchObject({
      kind: 'error',
      error: { code: 'INVALID_REQUEST' },
    });

    const operator = {
      kind: 'operator' as const,
      userId: USER_ID,
      actingPartyId: null,
      capabilities: ['jobs.read:any'],
      stepUpVerified: true,
      reason: 'review',
    };
    const authorization = await authorizeJobStatus(
      dependency,
      operator,
      record,
      JOB_ID,
      '11111111-1111-4111-8111-111111111111',
    );
    expect(authorization).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });

    expect(
      await authorizeJobStatus(
        dependency,
        { kind: 'anonymous' },
        record,
        JOB_ID,
        '11111111-1111-4111-8111-111111111111',
      ),
    ).toMatchObject({ code: 'UNAUTHENTICATED' });
    for (const kind of ['queue', 'webhook', 'deployment', 'service'] as const) {
      expect(
        await authorizeJobStatus(
          dependency,
          { kind },
          record,
          JOB_ID,
          '11111111-1111-4111-8111-111111111111',
        ),
      ).toMatchObject({ code: 'NOT_FOUND' });
    }
    expect(
      await authorizeJobStatus(
        dependency,
        { ...operator, capabilities: [], stepUpVerified: false, reason: null },
        record,
        JOB_ID,
        '11111111-1111-4111-8111-111111111111',
      ),
    ).toMatchObject({ code: 'DEPENDENCY_UNAVAILABLE' });

    const dependencyWithoutClock = { ...dependency };
    delete (dependencyWithoutClock as { now?: unknown }).now;
    expect(currentTimeMs(dependencyWithoutClock)).toBeTypeOf('number');
  });
});
