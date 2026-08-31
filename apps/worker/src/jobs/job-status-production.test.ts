import { afterEach, describe, expect, it, vi } from 'vitest';

import { JobStatusSchema } from '@wejammin/contracts';

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

const status = JobStatusSchema.parse({
  id: JOB,
  type: 'object.verify',
  state: 'running',
  progress: { completed: 2, total: 4, unit: 'items' },
  resultRef: null,
  error: null,
  createdAt: '2026-08-30T06:00:00.000Z',
  updatedAt: '2026-08-30T06:01:00.000Z',
});

const row = {
  job_id: JOB,
  actor_id: USER,
  acting_party_id: PARTY,
  job_type: status.type,
  state: status.state,
  progress: status.progress,
  result_ref: status.resultRef,
  error_code: null,
  created_at: status.createdAt,
  updated_at: status.updatedAt,
  version: '7',
  lease_until: '2026-08-30T06:10:00.000Z',
} as const;

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

const request = () =>
  new Request(`https://api.example.test/api/v1/jobs/${JOB}`, {
    headers: { authorization: `Bearer ${TOKEN}` },
  });

const authenticate = async (
  dependencies: ReturnType<typeof createProductionJobStatusDependencies>,
  signal: AbortSignal,
) => dependencies.resolvePrincipal(request(), signal);

const loadRow = async (payload: unknown) => {
  const fetchImpl = vi
    .fn<JobStatusProductionFetch>()
    .mockResolvedValueOnce(json({ id: USER }))
    .mockResolvedValueOnce(json(payload));
  const dependencies = make(fetchImpl);
  const signal = new AbortController().signal;
  await authenticate(dependencies, signal);
  return dependencies.loadJobStatus({ jobId: JOB, signal });
};

afterEach(() => vi.restoreAllMocks());

describe('production JobStatus dependency adapter', () => {
  it('authenticates only a valid bearer session and ignores untrusted metadata', async () => {
    const fetchImpl = vi.fn<JobStatusProductionFetch>(async () =>
      json({
        aud: 'authenticated',
        email: 'must-not-escape@example.test',
        id: USER,
        user_metadata: { actingPartyId: PARTY, capabilities: ['jobs.read'] },
      }),
    );
    const dependencies = make(fetchImpl);
    const signal = new AbortController().signal;
    await expect(authenticate(dependencies, signal)).resolves.toEqual({
      kind: 'user',
      userId: USER,
    });
    expect(fetchImpl).toHaveBeenCalledWith(`${URL}/auth/v1/user`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        apikey: SECRET,
      },
      method: 'GET',
      signal,
    });
  });

  it('fails closed for absent, malformed, oversized, expired, and aborted Auth sessions', async () => {
    for (const authorization of [
      undefined,
      'Bearer token with spaces',
      `Bearer ${'x'.repeat(4_100)}`,
    ]) {
      const fetchImpl = vi.fn<JobStatusProductionFetch>();
      const dependencies = make(fetchImpl);
      const input = new Request(`https://api.example.test/api/v1/jobs/${JOB}`, {
        ...(authorization === undefined ? {} : { headers: { authorization } }),
      });
      await expect(
        dependencies.resolvePrincipal(input, new AbortController().signal),
      ).resolves.toBeNull();
      expect(fetchImpl).not.toHaveBeenCalled();
    }
    for (const statusCode of [401, 403, 499]) {
      const dependencies = make(
        vi.fn<JobStatusProductionFetch>(async () =>
          json({ error: 'safe' }, { status: statusCode }),
        ),
      );
      await expect(
        authenticate(dependencies, new AbortController().signal),
      ).resolves.toBeNull();
    }
    const controller = new AbortController();
    controller.abort();
    await expect(
      authenticate(make(vi.fn<JobStatusProductionFetch>()), controller.signal),
    ).rejects.toBeInstanceOf(JobStatusProductionUnavailableError);
  });

  it('sanitizes Auth transport and bounded-body failures', async () => {
    const unavailable: JobStatusProductionFetch[] = [
      vi.fn<JobStatusProductionFetch>(async () => {
        throw new Error(`secret ${SECRET}`);
      }),
      vi.fn<JobStatusProductionFetch>(
        async () => new Response('{}', { status: 503 }),
      ),
      vi.fn<JobStatusProductionFetch>(
        async () => new Response('{}', { status: 302 }),
      ),
      vi.fn<JobStatusProductionFetch>(
        async () => new Response('x'.repeat(2_000)),
      ),
      vi.fn<JobStatusProductionFetch>(
        async () =>
          new Response('{}', { headers: { 'content-length': 'nope' } }),
      ),
      vi.fn<JobStatusProductionFetch>(
        async () => new Response('{}', { headers: { 'content-length': '-1' } }),
      ),
      vi.fn<JobStatusProductionFetch>(
        async () =>
          new Response('{}', { headers: { 'content-length': '999999' } }),
      ),
      vi.fn<JobStatusProductionFetch>(
        async () =>
          ({
            headers: new Headers(),
            status: 200,
            text: async () => {
              throw new Error('body');
            },
          }) as unknown as Response,
      ),
    ];
    for (const fetchImpl of unavailable) {
      await expect(
        authenticate(
          make(fetchImpl, { maxResponseBytes: 1_024 }),
          new AbortController().signal,
        ),
      ).rejects.toBeInstanceOf(JobStatusProductionUnavailableError);
    }
    await expect(
      authenticate(
        make(
          vi.fn<JobStatusProductionFetch>(async () => new Response('not-json')),
        ),
        new AbortController().signal,
      ),
    ).rejects.toBeInstanceOf(JobStatusProductionInternalError);
    await expect(
      authenticate(
        make(
          vi.fn<JobStatusProductionFetch>(async () =>
            json({ id: 'not-a-uuid' }),
          ),
        ),
        new AbortController().signal,
      ),
    ).rejects.toBeInstanceOf(JobStatusProductionInternalError);
    await expect(
      authenticate(
        make(
          vi.fn<JobStatusProductionFetch>(async () =>
            json({ id: USER }, { headers: { 'content-length': '999' } }),
          ),
        ),
        new AbortController().signal,
      ),
    ).resolves.toEqual({ kind: 'user', userId: USER });
  });

  it('rejects unsafe composition and accepts explicit bounded runtime options', () => {
    const fetchImpl = vi.fn<JobStatusProductionFetch>();
    const invalid: unknown[] = [
      undefined,
      { environment: undefined, fetchImpl },
      { environment, fetchImpl: undefined },
      { environment: { ...environment, SUPABASE_SECRET_KEY: '' }, fetchImpl },
      {
        environment: { ...environment, SUPABASE_SECRET_KEY: '\u0080' },
        fetchImpl,
      },
      {
        environment: { ...environment, SUPABASE_SECRET_KEY: 'x'.repeat(513) },
        fetchImpl,
      },
      { environment: { ...environment, SUPABASE_URL: 42 }, fetchImpl },
      { environment: { ...environment, SUPABASE_URL: 'not-a-url' }, fetchImpl },
      {
        environment: { ...environment, SUPABASE_URL: 'ftp://example.test' },
        fetchImpl,
      },
      {
        environment: {
          ...environment,
          SUPABASE_URL: 'https://user@example.test',
        },
        fetchImpl,
      },
      {
        environment: {
          ...environment,
          SUPABASE_URL: 'https://:password@example.test',
        },
        fetchImpl,
      },
      { environment, fetchImpl, maxResponseBytes: 1_023 },
      { environment, fetchImpl, jobStatusRpc: 'read/evil' },
      { environment, fetchImpl, rateLimitRpc: 'read/evil' },
      { environment, fetchImpl: null as unknown as JobStatusProductionFetch },
    ];
    for (const options of invalid) {
      expect(() =>
        createProductionJobStatusDependencies(
          options as JobStatusProductionOptions,
        ),
      ).toThrow(JobStatusProductionConfigurationError);
    }
    const dependencies = make(fetchImpl, {
      environment: { ...environment, SUPABASE_URL: `${URL}/` },
      maxResponseBytes: 1_024,
      now: () => 123,
    });
    expect(dependencies.now?.()).toBe(123);
  });

  it('loads one Auth-authorized projection through the named platform API RPC', async () => {
    const fetchImpl = vi.fn<JobStatusProductionFetch>(async (input) =>
      String(input).endsWith('/auth/v1/user')
        ? json({ id: USER })
        : json([row]),
    );
    const dependencies = make(fetchImpl);
    const signal = new AbortController().signal;
    await authenticate(dependencies, signal);
    await expect(
      dependencies.loadJobStatus({ jobId: JOB, signal }),
    ).resolves.toEqual({
      actorId: USER,
      actingPartyId: PARTY,
      data: status,
      etag: '"7"',
    });
    expect(fetchImpl.mock.calls[1]).toEqual([
      `${URL}/rest/v1/rpc/read_authorized_job`,
      expect.objectContaining({
        body: JSON.stringify({
          p_acting_party_id: null,
          p_actor_id: USER,
          p_capability: null,
          p_job_id: JOB,
          p_reason: null,
          p_step_up_verified: false,
        }),
        headers: expect.objectContaining({
          'Accept-Profile': 'platform_api',
          'Content-Profile': 'platform_api',
          Authorization: `Bearer ${SECRET}`,
          apikey: SECRET,
        }),
        method: 'POST',
        signal,
      }),
    ]);
  });

  it('conceals absence and rejects malformed projection authority or payload', async () => {
    await expect(loadRow([])).resolves.toBeNull();
    await expect(loadRow([row])).resolves.toMatchObject({ etag: '"7"' });
    await expect(loadRow([42])).rejects.toBeInstanceOf(
      JobStatusProductionInternalError,
    );
    await expect(loadRow({ error: 'not-an-array' })).rejects.toBeInstanceOf(
      JobStatusProductionInternalError,
    );
    await expect(loadRow([row, row])).rejects.toBeInstanceOf(
      JobStatusProductionInternalError,
    );
    const invalidRows: unknown[] = [
      { ...row, extra: true },
      { ...row, actor_id: PARTY },
      { ...row, actor_id: 'not-a-uuid' },
      { ...row, job_id: PARTY },
      { ...row, acting_party_id: 'not-a-uuid' },
      { ...row, lease_until: 42 },
      { ...row, version: '0' },
      { ...row, version: '9223372036854775808' },
      { ...row, version: {} },
      { ...row, job_type: 'INVALID TYPE' },
      { ...row, progress: { completed: 5, total: 4, unit: 'items' } },
      { ...row, created_at: 'not-a-date' },
      { ...row, error_code: 42 },
    ];
    for (const invalidRow of invalidRows) {
      await expect(loadRow([invalidRow])).rejects.toBeInstanceOf(
        JobStatusProductionInternalError,
      );
    }
    await expect(
      loadRow([{ ...row, acting_party_id: null, version: 7 }]),
    ).resolves.toMatchObject({
      actingPartyId: null,
      etag: '"7"',
    });
  });

  it('maps terminal error projections safely and requires Auth context before reading', async () => {
    await expect(
      loadRow([
        {
          ...row,
          error_code: 'VERIFY_FAILED',
          progress: null,
          state: 'failed',
        },
      ]),
    ).resolves.toMatchObject({
      data: {
        error: { code: 'VERIFY_FAILED', retryable: false },
        state: 'failed',
      },
    });
    const dependencies = make(vi.fn<JobStatusProductionFetch>());
    await expect(
      dependencies.loadJobStatus({
        jobId: JOB,
        signal: new AbortController().signal,
      }),
    ).rejects.toBeInstanceOf(JobStatusProductionInternalError);
  });

  it('maps projection RPC transport failures to sanitized unavailable errors', async () => {
    for (const fetchImpl of [
      vi
        .fn<JobStatusProductionFetch>()
        .mockResolvedValueOnce(json({ id: USER }))
        .mockRejectedValueOnce(new Error(SECRET)),
      vi
        .fn<JobStatusProductionFetch>()
        .mockResolvedValueOnce(json({ id: USER }))
        .mockResolvedValueOnce(new Response('{}', { status: 503 })),
    ]) {
      const dependencies = make(fetchImpl);
      const signal = new AbortController().signal;
      await authenticate(dependencies, signal);
      await expect(
        dependencies.loadJobStatus({ jobId: JOB, signal }),
      ).rejects.toBeInstanceOf(JobStatusProductionUnavailableError);
    }
  });
});
