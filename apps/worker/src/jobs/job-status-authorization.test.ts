import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createJobDependencies,
  createTestApp,
  bindings,
  json,
  record,
  request,
  REQUEST_ID,
  USER_ID,
  OTHER_USER_ID,
  PARTY_ID,
  OTHER_PARTY_ID,
} from './job-status-test-support';
import {
  JOB_STATUS_TIMEOUT_MS,
  PARTY_READ_LIMIT,
  USER_READ_LIMIT,
  type JobRateLimitInput,
  type JobStatusRecord,
} from './job-status';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Slice 03 Worker job-status authorization boundary', () => {
  it('P1-S03-AC-011', async () => {
    const app = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({ kind: 'anonymous' as const })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect(response.status).toBe(401);
  });

  it('P1-S03-AC-012', async () => {
    const app = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({
          kind: 'user' as const,
          userId: USER_ID,
        })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect(response.status).toBe(200);
  });

  it('P1-S03-AC-013', async () => {
    const app = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({
          actingPartyId: PARTY_ID,
          capabilities: ['jobs.read'],
          kind: 'acting_party' as const,
          userId: USER_ID,
        })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect(response.status).toBe(200);
  });

  it('P1-S03-AC-014', async () => {
    const auditOperatorAccess = vi.fn(async () => undefined);
    const app = createTestApp(
      createJobDependencies({
        auditOperatorAccess,
        resolvePrincipal: vi.fn(async () => ({
          actingPartyId: null,
          capabilities: ['jobs.read:any'],
          kind: 'operator' as const,
          reason: 'incident review',
          stepUpVerified: true,
          userId: USER_ID,
        })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect({
      status: response.status,
      auditCalls: auditOperatorAccess.mock.calls.length,
    }).toEqual({ status: 200, auditCalls: 1 });
  });

  it('P1-S03-AC-015', async () => {
    const loadJobStatus = vi.fn(async () => record);
    const app = createTestApp(
      createJobDependencies({
        loadJobStatus,
        resolvePrincipal: vi.fn(async () => ({ kind: 'queue' as const })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect({
      status: response.status,
      lookups: loadJobStatus.mock.calls.length,
    }).toEqual({
      status: 404,
      lookups: 0,
    });
  });

  it('P1-S03-AC-016', async () => {
    const app = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({ kind: 'webhook' as const })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect(response.status).toBe(404);
  });

  it('P1-S03-AC-017', async () => {
    const app = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({ kind: 'deployment' as const })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect(response.status).toBe(404);
  });

  it('P1-S03-AC-018', async () => {
    const app = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({ kind: 'service' as const })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect(response.status).toBe(404);
  });

  it('P1-S03-AC-019', async () => {
    const app = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({
          kind: 'user' as const,
          userId: OTHER_USER_ID,
        })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect(response.status).toBe(404);
  });

  it('P1-S03-AC-020', async () => {
    const app = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({
          actingPartyId: OTHER_PARTY_ID,
          capabilities: [],
          kind: 'acting_party' as const,
          userId: USER_ID,
        })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect(response.status).toBe(404);
  });

  it('P1-S03-AC-021', async () => {
    const auditOperatorAccess = vi.fn(async () => undefined);
    const app = createTestApp(
      createJobDependencies({
        auditOperatorAccess,
        resolvePrincipal: vi.fn(async () => ({
          actingPartyId: null,
          capabilities: [],
          kind: 'operator' as const,
          reason: null,
          stepUpVerified: false,
          userId: USER_ID,
        })),
      }),
    );
    const response = await app.fetch(request(), bindings);

    expect({
      status: response.status,
      auditCalls: auditOperatorAccess.mock.calls.length,
    }).toEqual({ status: 404, auditCalls: 1 });
  });

  it('P1-S03-AC-022', async () => {
    const absentApp = createTestApp(
      createJobDependencies({ loadJobStatus: vi.fn(async () => null) }),
    );
    const unauthorizedApp = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({
          kind: 'user' as const,
          userId: OTHER_USER_ID,
        })),
      }),
    );
    const absent = await absentApp.fetch(request(), bindings);
    const unauthorized = await unauthorizedApp.fetch(request(), bindings);

    expect({
      absent: { status: absent.status, body: await json(absent) },
      unauthorized: {
        status: unauthorized.status,
        body: await json(unauthorized),
      },
    }).toEqual({
      absent: {
        status: 404,
        body: {
          code: 'NOT_FOUND',
          details: {},
          message: 'The requested job was not found.',
          requestId: REQUEST_ID,
        },
      },
      unauthorized: {
        status: 404,
        body: {
          code: 'NOT_FOUND',
          details: {},
          message: 'The requested job was not found.',
          requestId: REQUEST_ID,
        },
      },
    });
  });

  it('P1-S03-AC-023', async () => {
    const loadJobStatus = vi.fn(async (input: { jobId: string }) => {
      expect(input.jobId).toBe('66666666-6666-4666-8666-666666666666');
      expect(input).toHaveProperty('signal');
      return record;
    });
    const app = createTestApp(createJobDependencies({ loadJobStatus }));
    const response = await app.fetch(
      request(undefined, {
        'idempotency-key': 'ignored-key',
        'if-match': '"1"',
      }),
      bindings,
    );

    expect({ status: response.status, reservations: 'none' }).toEqual({
      status: 200,
      reservations: 'none',
    });
  });

  it('P1-S03-AC-028', async () => {
    vi.useFakeTimers();
    const observed: {
      aborted?: boolean;
      userLimit?: number;
      partyLimit?: number;
    } = {};
    const app = createTestApp(
      createJobDependencies({
        rateLimit: vi.fn(async (input: JobRateLimitInput) => {
          observed.userLimit = input.userLimit;
          observed.partyLimit = input.partyLimit;
          return {
            allowed: true,
            limit: USER_READ_LIMIT,
            remaining: USER_READ_LIMIT - 1,
            resetAt: 1_756_530_000,
            scope: 'user' as const,
          };
        }),
        loadJobStatus: vi.fn(
          ({ signal }: { signal: AbortSignal }) =>
            new Promise<JobStatusRecord>((_resolve, reject) => {
              signal.addEventListener(
                'abort',
                () => {
                  observed.aborted = signal.aborted;
                  reject(new DOMException('deadline', 'AbortError'));
                },
                { once: true },
              );
            }),
        ),
      }),
    );
    const pending = app.fetch(request(), bindings);
    await vi.advanceTimersByTimeAsync(JOB_STATUS_TIMEOUT_MS);
    const response = await pending;

    expect({
      status: response.status,
      code: (await json(response)).code,
      limits: observed,
    }).toEqual({
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
      limits: {
        aborted: true,
        userLimit: USER_READ_LIMIT,
        partyLimit: PARTY_READ_LIMIT,
      },
    });
  });

  it('retains the exact ETag and returns an empty 304 body after authorization', async () => {
    const app = createTestApp(createJobDependencies());
    const response = await app.fetch(
      request(undefined, { 'if-none-match': '"7"' }),
      bindings,
    );

    expect({
      status: response.status,
      body: await response.text(),
      etag: response.headers.get('etag'),
    }).toEqual({
      status: 304,
      body: '',
      etag: '"7"',
    });
  });

  it('does not expose an operator reason or identity in the error envelope', async () => {
    const app = createTestApp(
      createJobDependencies({
        resolvePrincipal: vi.fn(async () => ({
          actingPartyId: null,
          capabilities: [],
          kind: 'operator' as const,
          reason: 'private operator incident',
          stepUpVerified: false,
          userId: USER_ID,
        })),
        auditOperatorAccess: vi.fn(async () => undefined),
      }),
    );
    const response = await app.fetch(request(), bindings);
    const body = await response.text();

    expect(body).not.toContain('private operator incident');
    expect(body).not.toContain(USER_ID);
  });
});
