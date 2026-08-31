import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createProductionJobStatusDependencies,
  JobStatusProductionConfigurationError,
  JobStatusProductionInternalError,
  JobStatusProductionUnavailableError,
  type JobStatusProductionFetch,
  type JobStatusProductionOptions,
} from './job-status-production';

const URL = 'https://staging.example.supabase.co';
const SECRET = 'server-secret-test-only';
const USER = '22222222-2222-4222-8222-222222222222';
const PARTY = '44444444-4444-4444-8444-444444444444';
const JOB = '66666666-6666-4666-8666-666666666666';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.test-token.signature';
const environment = { SUPABASE_SECRET_KEY: SECRET, SUPABASE_URL: URL } as const;

const row = {
  job_id: JOB,
  actor_id: USER,
  acting_party_id: PARTY,
  job_type: 'object.verify',
  state: 'running',
  progress: { completed: 2, total: 4, unit: 'items' },
  result_ref: null,
  error_code: null,
  created_at: '2026-08-30T06:00:00.000Z',
  updated_at: '2026-08-30T06:01:00.000Z',
  version: '7',
  lease_until: null,
} as const;

const json = (value: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json', ...init.headers },
    ...init,
  });

const request = (headers: Record<string, string> = {}) =>
  new Request(`https://api.example.test/api/v1/jobs/${JOB}`, {
    headers: { authorization: `Bearer ${TOKEN}`, ...headers },
  });

const make = (
  fetchImpl: JobStatusProductionFetch,
  options: Partial<JobStatusProductionOptions> = {},
) =>
  createProductionJobStatusDependencies({ environment, fetchImpl, ...options });

const authorizeAndLoad = async (
  options: Partial<JobStatusProductionOptions> = {},
  headers: Record<string, string> = {},
  authPayload: unknown = {
    app_metadata: {
      actingPartyId: PARTY,
      capabilities: ['jobs.read:any'],
      role: 'admin',
      stepUpVerified: true,
    },
    id: USER,
    user_metadata: {
      actingPartyId: PARTY,
      capabilities: ['jobs.read:any'],
      stepUpVerified: true,
    },
  },
) => {
  const fetchImpl = vi
    .fn<JobStatusProductionFetch>()
    .mockResolvedValueOnce(json(authPayload))
    .mockResolvedValueOnce(json([row]));
  const dependencies = make(fetchImpl, options);
  const signal = new AbortController().signal;
  const principal = await dependencies.resolvePrincipal(
    request(headers),
    signal,
  );
  const loaded = await dependencies.loadJobStatus({ jobId: JOB, signal });
  return { fetchImpl, loaded, principal };
};

afterEach(() => vi.restoreAllMocks());

describe('production JobStatus verified authority boundary', () => {
  it('allows owner identity while ignoring auth metadata and forged client authority', async () => {
    const { fetchImpl, loaded, principal } = await authorizeAndLoad(
      {},
      {
        'x-acting-party-id': PARTY,
        'x-capability': 'jobs.read:any',
        'x-role': 'admin',
        'x-step-up': 'true',
      },
    );

    expect(principal).toEqual({ kind: 'user', userId: USER });
    expect(loaded).toMatchObject({ actingPartyId: PARTY, actorId: USER });
    expect(fetchImpl.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({
          p_acting_party_id: null,
          p_actor_id: USER,
          p_capability: null,
          p_job_id: JOB,
          p_reason: null,
          p_step_up_verified: false,
        }),
      }),
    );
  });

  it('derives an acting-party principal and exact capability only through the server resolver', async () => {
    const { fetchImpl, principal } = await authorizeAndLoad({
      resolveServerAuthority: async ({ session }) => {
        expect(session).toEqual({ userId: USER });
        return {
          actingPartyId: PARTY,
          capabilities: ['jobs.read'],
          stepUpVerified: false,
        };
      },
    });

    expect(principal).toEqual({
      actingPartyId: PARTY,
      capabilities: ['jobs.read'],
      kind: 'acting_party',
      userId: USER,
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body))).toEqual({
      p_acting_party_id: PARTY,
      p_actor_id: USER,
      p_capability: 'jobs.read',
      p_job_id: JOB,
      p_reason: null,
      p_step_up_verified: false,
    });
  });

  it('derives an audited operator from the canonical resolver and passes its bounded reason', async () => {
    const { fetchImpl, principal } = await authorizeAndLoad(
      {
        resolveServerAuthority: async () => ({
          actingPartyId: PARTY,
          capabilities: ['jobs.read:any'],
          reason: 'incident review',
          stepUpVerified: true,
        }),
      },
      { 'x-role': 'operator', 'x-step-up': 'true' },
    );

    expect(principal).toEqual({
      actingPartyId: PARTY,
      capabilities: ['jobs.read:any'],
      kind: 'operator',
      reason: 'incident review',
      stepUpVerified: true,
      userId: USER,
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body))).toEqual({
      p_acting_party_id: PARTY,
      p_actor_id: USER,
      p_capability: 'jobs.read:any',
      p_job_id: JOB,
      p_reason: 'incident review',
      p_step_up_verified: true,
    });
  });

  it('binds the injected resolver to the verified Auth actor and ignores auth claims', async () => {
    const signal = new AbortController().signal;
    const resolveServerAuthority = vi.fn(async (input) => {
      expect(input.session).toEqual({ userId: USER });
      expect(input.request.url).toContain(`/api/v1/jobs/${JOB}`);
      expect(input.signal).toBe(signal);
      return {
        actingPartyId: PARTY,
        capabilities: ['jobs.read'],
        stepUpVerified: false,
      };
    });
    const fetchImpl = vi
      .fn<JobStatusProductionFetch>()
      .mockResolvedValueOnce(
        json({
          app_metadata: {
            actingPartyId: '88888888-8888-4888-8888-888888888888',
            capabilities: ['jobs.read:any'],
            stepUpVerified: true,
          },
          id: USER,
        }),
      )
      .mockResolvedValueOnce(json([row]));
    const dependencies = make(fetchImpl, { resolveServerAuthority });

    await expect(
      dependencies.resolvePrincipal(request(), signal),
    ).resolves.toEqual({
      actingPartyId: PARTY,
      capabilities: ['jobs.read'],
      kind: 'acting_party',
      userId: USER,
    });
    await dependencies.loadJobStatus({ jobId: JOB, signal });
    expect(resolveServerAuthority).toHaveBeenCalledOnce();
    expect(
      JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body)),
    ).toMatchObject({
      p_acting_party_id: PARTY,
      p_capability: 'jobs.read',
    });
  });

  it('never promotes roles or app/claims metadata without a resolver', async () => {
    for (const authPayload of [
      {
        app_metadata: {
          acting_party_id: PARTY,
          capabilities: ['jobs.read:any'],
          step_up_verified: true,
        },
        id: USER,
      },
      {
        claims: {
          actingPartyId: PARTY,
          capabilities: ['jobs.read:any'],
          role: 'operator',
          stepUpVerified: true,
        },
        id: USER,
      },
      {
        app_metadata: { role: 'service_role' },
        id: USER,
        user_metadata: { actingPartyId: PARTY, capabilities: ['jobs.read'] },
      },
    ]) {
      const { principal } = await authorizeAndLoad({}, {}, authPayload);
      expect(principal).toEqual({ kind: 'user', userId: USER });
    }
  });

  it('keeps operator authority fail-closed for malformed resolver reasons and ignores query authority', async () => {
    const invalidReasons = [
      undefined,
      '',
      'ok',
      'bad\u0001reason',
      'bad\u0085reason',
      'é'.repeat(121),
      'x'.repeat(241),
    ];
    for (const reason of invalidReasons) {
      const fetchImpl = vi
        .fn<JobStatusProductionFetch>()
        .mockResolvedValueOnce(json({ id: USER }))
        .mockResolvedValueOnce(json([row]));
      const dependencies = make(fetchImpl, {
        resolveServerAuthority: async () => ({
          capabilities: ['jobs.read:any'],
          reason,
          stepUpVerified: true,
        }),
      });
      const signal = new AbortController().signal;
      const principal = await dependencies.resolvePrincipal(
        new Request(
          `https://api.example.test/api/v1/jobs/${JOB}?reason=query-reason`,
          {
            headers: {
              authorization: `Bearer ${TOKEN}`,
              'x-capability': 'jobs.read:any',
              'x-step-up': 'true',
            },
          },
        ),
        signal,
      );
      expect(principal).toMatchObject({
        capabilities: ['jobs.read:any'],
        kind: 'operator',
        reason: null,
        stepUpVerified: true,
      });
      await dependencies.loadJobStatus({ jobId: JOB, signal });
      expect(
        JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body)),
      ).toMatchObject({ p_reason: null });
    }
  });

  it('rejects invalid resolver output, including actor identity, without trusting it', async () => {
    for (const authority of [
      { actingPartyId: 'not-a-uuid', capabilities: ['jobs.read'] },
      { actingPartyId: PARTY, capabilities: ['not a capability'] },
      { actingPartyId: PARTY, capabilities: ['jobs.read', 'jobs.read'] },
      {
        actingPartyId: PARTY,
        capabilities: Array.from({ length: 65 }, (_, index) => `cap${index}`),
      },
      { actorId: USER, actingPartyId: PARTY, capabilities: ['jobs.read'] },
      { userId: USER, actingPartyId: PARTY, capabilities: ['jobs.read'] },
      {},
      { role: 'operator', actingPartyId: PARTY, capabilities: ['jobs.read'] },
    ]) {
      const dependencies = make(
        vi.fn<JobStatusProductionFetch>(async () => json({ id: USER })),
        { resolveServerAuthority: async () => authority },
      );
      await expect(
        dependencies.resolvePrincipal(request(), new AbortController().signal),
      ).rejects.toBeInstanceOf(JobStatusProductionInternalError);
    }
    const dependencies = make(
      vi.fn<JobStatusProductionFetch>(async () => json({ id: USER })),
      {
        resolveServerAuthority: async () => {
          throw new Error(`resolver leaked ${SECRET}`);
        },
      },
    );
    await expect(
      dependencies.resolvePrincipal(request(), new AbortController().signal),
    ).rejects.toBeInstanceOf(JobStatusProductionUnavailableError);
  });

  it('requires a callable canonical resolver option and preserves abort propagation', async () => {
    const fetchImpl = vi.fn<JobStatusProductionFetch>();
    expect(() =>
      make(fetchImpl, {
        resolveServerAuthority: null as never,
      }),
    ).toThrow(JobStatusProductionConfigurationError);

    const controller = new AbortController();
    const dependencies = make(
      vi.fn<JobStatusProductionFetch>(async (_input, init) => {
        expect(init?.signal).toBe(controller.signal);
        return json({ id: USER });
      }),
      { resolveServerAuthority: async () => null },
    );
    await expect(
      dependencies.resolvePrincipal(request(), controller.signal),
    ).resolves.toEqual({ kind: 'user', userId: USER });
  });

  it('fails closed when Auth or the canonical resolver completes after abort', async () => {
    const beforeBody = new AbortController();
    const authAfterAbort = make(
      vi.fn<JobStatusProductionFetch>(async () => {
        beforeBody.abort();
        return json({ id: USER });
      }),
    );
    await expect(
      authAfterAbort.resolvePrincipal(request(), beforeBody.signal),
    ).rejects.toBeInstanceOf(JobStatusProductionUnavailableError);

    const afterBody = new AbortController();
    const delayedBody = {
      headers: new Headers({ 'content-type': 'application/json' }),
      status: 200,
      text: async () => {
        afterBody.abort();
        return JSON.stringify({ id: USER });
      },
    } as unknown as Response;
    const authBodyAfterAbort = make(
      vi.fn<JobStatusProductionFetch>(async () => delayedBody),
    );
    await expect(
      authBodyAfterAbort.resolvePrincipal(request(), afterBody.signal),
    ).rejects.toBeInstanceOf(JobStatusProductionUnavailableError);

    const resolverAbort = new AbortController();
    const resolverAfterAbort = make(
      vi.fn<JobStatusProductionFetch>(async () => json({ id: USER })),
      {
        resolveServerAuthority: async () => {
          resolverAbort.abort();
          return null;
        },
      },
    );
    await expect(
      resolverAfterAbort.resolvePrincipal(request(), resolverAbort.signal),
    ).rejects.toBeInstanceOf(JobStatusProductionUnavailableError);
  });
});
