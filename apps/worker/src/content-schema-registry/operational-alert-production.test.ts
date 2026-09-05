import { describe, expect, it, vi } from 'vitest';

import { createProductionOperationalAlertDependencies } from './operational-alert-production';

const environment = {
  APP_ENVIRONMENT: 'production',
  APP_RELEASE: 'release-sha',
  CMS_HUMAN_ORIGINS: 'https://app.wejamm.in',
  CMS_RELEASE_ORIGINS: 'https://release.wejamm.in',
  SUPABASE_SECRET_KEY: 'sb_secret_test',
  SUPABASE_URL: 'https://project.supabase.co',
  CLOUDFLARE_ACCOUNT_ID: 'account-id',
  CLOUDFLARE_OBSERVABILITY_API_TOKEN: 'observability-token',
  CLOUDFLARE_PLATFORM_DLQ_ID: 'dlq-id',
  PLATFORM_ALERT_EMAIL: { send: vi.fn().mockResolvedValue({}) },
} as const;

const runInput = {
  environment: 'production',
  release: 'release-sha',
  scheduledAt: '2026-09-05T12:00:00.000Z',
} as const;

const nativeFetch = (input: {
  database?: unknown;
  logs?: unknown;
  queue?: unknown;
}) =>
  vi.fn<typeof fetch>().mockImplementation((url) => {
    const target = String(url);
    if (target.includes('cms_get_operational_state_snapshot'))
      return Promise.resolve(
        Response.json(input.database === undefined ? {} : input.database),
      );
    if (target.includes('/workers/observability/telemetry/query'))
      return Promise.resolve(
        Response.json(
          input.logs === undefined
            ? { result: { events: { events: [] } } }
            : input.logs,
        ),
      );
    if (target.endsWith('/graphql'))
      return Promise.resolve(
        Response.json(input.queue === undefined ? {} : input.queue),
      );
    throw new Error(`unexpected URL: ${target}`);
  });

describe('production operational alert dependencies', () => {
  it('loads bounded native measurements and keeps tokens out of requests and receipts', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation((url) => {
      const target = String(url);
      if (target.includes('cms_get_operational_state_snapshot'))
        return Promise.resolve(
          Response.json({ activationBlockedMs: 1, outboxAgeMs: 2 }),
        );
      if (target.includes('/workers/observability/telemetry/query'))
        return Promise.resolve(
          Response.json({ result: { events: { events: [] } } }),
        );
      if (target.endsWith('/graphql'))
        return Promise.resolve(
          Response.json({
            data: {
              viewer: {
                accounts: [
                  { queueBacklogAdaptiveGroups: [{ avg: { messages: 0 } }] },
                ],
              },
            },
          }),
        );
      throw new Error(`unexpected URL: ${target}`);
    });
    const dependencies = createProductionOperationalAlertDependencies(
      environment,
      fetchImpl,
    );

    await expect(dependencies.loadSnapshot(runInput)).resolves.toMatchObject({
      activationBlockedMs: 1,
      conflictWindowMs: 300_000,
      dlqDepth: 0,
      outboxAgeMs: 2,
    });

    const requests = fetchImpl.mock.calls.map(([url, init]) => ({
      body: String(init?.body ?? ''),
      headers: JSON.stringify(init?.headers ?? {}),
      url: String(url),
    }));
    expect(
      requests.find((request) => request.url.includes('supabase'))?.headers,
    ).not.toContain('Bearer sb_secret_test');
    expect(
      requests.find((request) => request.url.includes('telemetry/query'))
        ?.headers,
    ).toContain('Bearer observability-token');
    expect(
      JSON.parse(
        requests.find((request) => request.url.includes('telemetry/query'))
          ?.body ?? '{}',
      ),
    ).toMatchObject({ parameters: { limit: 2_000 } });
    expect(JSON.stringify(requests)).not.toContain('admin.wejammin@gmail.com');
  });

  it('reports a safe HTTP status when a provider rejects a request', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation((url) => {
      const target = String(url);
      if (target.includes('cms_get_operational_state_snapshot'))
        return Promise.resolve(Response.json({}));
      if (target.endsWith('/graphql'))
        return Promise.resolve(Response.json({}));
      if (target.includes('/workers/observability/telemetry/query'))
        return Promise.resolve(
          Response.json(
            { errors: [{ message: 'sensitive provider detail' }] },
            { status: 400 },
          ),
        );
      throw new Error(`unexpected URL: ${target}`);
    });
    const dependencies = createProductionOperationalAlertDependencies(
      environment,
      fetchImpl,
    );

    await expect(dependencies.loadSnapshot(runInput)).rejects.toThrow(
      'Operational provider request failed (HTTP 400)',
    );
  });

  it('claims, sends a redacted platform.on_call email, and hashes completion evidence server-side', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          claimId: '019c0000-0000-7000-8000-000000000001',
          claimed: true,
        }),
      )
      .mockResolvedValueOnce(Response.json(true));
    const bindings = {
      ...environment,
      PLATFORM_ALERT_EMAIL: { send: vi.fn().mockResolvedValue({}) },
    };
    const dependencies = createProductionOperationalAlertDependencies(
      bindings,
      fetchImpl,
      { randomUuid: () => '019c0000-0000-7000-8000-000000000002' },
    );
    const alert = {
      code: 'dlq_nonempty',
      observed: 1,
      route: 'platform.on_call',
      runbook: 'content-schema-registry',
      threshold: 0,
    } as const;
    const input = runInput;

    const claim = await dependencies.claim(alert, input);
    expect(claim).toMatchObject({ claimed: true });
    if (!claim.claimed) throw new Error('expected claim');
    const receipt = await dependencies.deliver({
      alert,
      claimId: claim.claimId,
      environment: 'production',
      redacted: true,
      release: 'release-sha',
      scheduledAt: input.scheduledAt,
    });
    await dependencies.complete({
      alert,
      claimId: claim.claimId,
      claimToken: claim.claimToken,
      deliveredAt: '2026-09-05T12:00:01.000Z',
      receiptId: receipt.receiptId,
    });

    const sent = bindings.PLATFORM_ALERT_EMAIL.send.mock.calls[0]?.[0];
    expect(sent).toMatchObject({
      from: 'platform.on-call@alerts.wejamm.in',
      subject: '[WeJammin] dlq_nonempty',
      to: 'admin.wejammin@gmail.com',
    });
    expect(JSON.stringify(sent)).not.toMatch(
      /observability-token|sb_secret_test|authorization|cookie|requestBody/iu,
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.body).not.toContain(
      'admin.wejammin@gmail.com',
    );
  });

  it.each([
    new Response('{}', { status: 503 }),
    new Response('{}', { headers: { 'content-length': '2000001' } }),
    new Response('x'.repeat(2_000_001)),
  ])('rejects failed or oversized provider responses', async (response) => {
    const dependencies = createProductionOperationalAlertDependencies(
      environment,
      vi.fn<typeof fetch>().mockResolvedValue(response),
    );
    await expect(dependencies.loadSnapshot(runInput)).rejects.toThrow(
      /provider request failed|response too large/u,
    );
  });

  it.each([
    null,
    { result: { events: { events: [] } }, success: false },
    { result: { events: { events: [] } }, success: 'true' },
    { success: true, result: null },
    { success: true, result: { events: null } },
    { success: true, result: { events: { events: null } } },
  ])('rejects malformed Workers Logs payloads', async (logs) => {
    const dependencies = createProductionOperationalAlertDependencies(
      environment,
      nativeFetch({
        logs,
        queue: {
          data: {
            viewer: {
              accounts: [
                { queueBacklogAdaptiveGroups: [{ avg: { messages: 0 } }] },
              ],
            },
          },
        },
      }),
    );
    await expect(dependencies.loadSnapshot(runInput)).rejects.toThrow(
      'Invalid Workers Logs response',
    );
  });

  it.each([{ result: {} }, { result: { events: {} } }])(
    'accepts an empty Workers Logs result when optional event fields are omitted',
    async (logs) => {
      const dependencies = createProductionOperationalAlertDependencies(
        environment,
        nativeFetch({
          logs,
          queue: {
            data: {
              viewer: {
                accounts: [
                  { queueBacklogAdaptiveGroups: [{ avg: { messages: 0 } }] },
                ],
              },
            },
          },
        }),
      );

      await expect(dependencies.loadSnapshot(runInput)).resolves.toMatchObject({
        dlqDepth: 0,
      });
    },
  );

  it.each([
    null,
    {},
    { data: {} },
    { data: { viewer: {} } },
    { data: { viewer: { accounts: [] } } },
    { data: { viewer: { accounts: [{}] } } },
    {
      data: {
        viewer: { accounts: [{ queueBacklogAdaptiveGroups: [] }] },
      },
    },
    {
      data: {
        viewer: { accounts: [{ queueBacklogAdaptiveGroups: [{}] }] },
      },
    },
    {
      data: {
        viewer: {
          accounts: [
            { queueBacklogAdaptiveGroups: [{ avg: { messages: 'bad' } }] },
          ],
        },
      },
    },
    {
      data: {
        viewer: {
          accounts: [
            { queueBacklogAdaptiveGroups: [{ avg: { messages: NaN } }] },
          ],
        },
      },
    },
  ])('omits an unavailable Queue backlog measurement', async (queue) => {
    const dependencies = createProductionOperationalAlertDependencies(
      environment,
      nativeFetch({
        logs: {
          result: { events: { events: [null, {}] } },
          success: true,
        },
        queue,
      }),
    );
    await expect(
      dependencies.loadSnapshot(runInput),
    ).resolves.not.toHaveProperty('dlqDepth');
  });

  it('normalizes a negative Queue backlog and omits absent database ages', async () => {
    const dependencies = createProductionOperationalAlertDependencies(
      environment,
      nativeFetch({
        queue: {
          data: {
            viewer: {
              accounts: [
                { queueBacklogAdaptiveGroups: [{ avg: { messages: -1 } }] },
              ],
            },
          },
        },
      }),
    );
    await expect(dependencies.loadSnapshot(runInput)).resolves.toMatchObject({
      dlqDepth: 0,
    });
  });

  it('rejects a non-object database snapshot', async () => {
    const dependencies = createProductionOperationalAlertDependencies(
      environment,
      nativeFetch({ database: [] }),
    );
    await expect(dependencies.loadSnapshot(runInput)).rejects.toThrow(
      'Invalid operational snapshot',
    );
  });

  it('rejects invalid claims and unsuccessful completion acknowledgements', async () => {
    const alert = {
      code: 'dlq_nonempty',
      observed: 1,
      route: 'platform.on_call',
      runbook: 'content-schema-registry',
      threshold: 0,
    } as const;
    const unclaimed = createProductionOperationalAlertDependencies(
      environment,
      vi.fn<typeof fetch>().mockResolvedValue(Response.json(null)),
    );
    await expect(unclaimed.claim(alert, runInput)).resolves.toEqual({
      claimed: false,
    });

    const malformed = createProductionOperationalAlertDependencies(
      environment,
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ claimed: true }))
        .mockResolvedValueOnce(Response.json(false)),
      { randomUuid: () => '019c0000-0000-7000-8000-000000000002' },
    );
    await expect(malformed.claim(alert, runInput)).rejects.toThrow(
      'Invalid operational alert claim',
    );
    await expect(
      malformed.complete({
        alert,
        claimId: '019c0000-0000-7000-8000-000000000001',
        claimToken: '019c0000-0000-7000-8000-000000000002',
        deliveredAt: '2026-09-05T12:00:01.000Z',
        receiptId: '019c0000-0000-7000-8000-000000000003',
      }),
    ).rejects.toThrow('Operational alert completion failed');
  });
});
