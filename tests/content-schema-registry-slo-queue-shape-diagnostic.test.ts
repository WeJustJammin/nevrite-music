import { spawnSync } from 'node:child_process';

import { describe, expect, it, vi } from 'vitest';

import { diagnoseQueueAnalyticsShape } from '../infra/workflows/content-schema-registry-slo-queue-shape-diagnostic.ts';
import {
  queryQueueMessageOperations,
  queueMessageOperationsQuery,
} from '../infra/workflows/content-schema-registry-slo-provider-queue.ts';

const accountId = 'b1c05c00f04130a0d100adbca6696e6e';
const queueId = 'c'.repeat(32);
const queryId = 'wejammin-ac211-20260902';
const token = 'private-cloudflare-token';

const window = {
  endedAt: '2026-09-03T00:00:00.000Z',
  startedAt: '2026-09-02T00:00:00.000Z',
};

const input = (fetchImpl: typeof fetch) => ({
  accountId,
  fetchImpl,
  queryId,
  queueId,
  token,
  window,
});

const queueResponse = (rows: readonly unknown[]): Response =>
  Response.json({
    data: {
      viewer: { accounts: [{ queueMessageOperationsAdaptiveGroups: rows }] },
    },
    errors: null,
  });

const row = (
  actionType: unknown,
  date: unknown,
  count: unknown,
  outcome?: unknown,
): Record<string, unknown> => ({
  count,
  dimensions: {
    actionType,
    date,
    ...(outcome === undefined ? {} : { outcome }),
  },
});

describe('protected AC211 queue analytics shape diagnostic', () => {
  it('reproduces the collection query verbatim over the same half-open UTC day', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(queueResponse([row('ReadMessage', '2026-09-02', 1)]));

    await diagnoseQueueAnalyticsShape(input(fetchImpl));

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('https://api.cloudflare.com/client/v4/graphql');
    const body = JSON.parse(String(init?.body)) as {
      query: string;
      variables: Record<string, unknown>;
    };
    expect(body.query).toBe(queueMessageOperationsQuery);
    expect(body.variables).toEqual({
      accountTag: accountId,
      datetimeEnd: '2026-09-03T00:00:00.000Z',
      datetimeStart: '2026-09-02T00:00:00.000Z',
      queueId,
    });
    expect(String(init?.body)).not.toContain(token);
  });

  it('reports a clean verdict as bounded value-free row classes', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        queueResponse([
          row('ReadMessage', '2026-09-02', 4),
          row('DeleteMessage', '2026-09-02T00:00:00Z', 2, 'dlq'),
          row('DeleteMessage', '2026-09-02T00:00:00.000Z', 9, 'success'),
          row('WriteMessage', '2026-09-02', 3),
        ]),
      );

    const result = await diagnoseQueueAnalyticsShape(input(fetchImpl));

    expect(result).toMatchObject({
      collectorVerdict: 'accepted',
      diagnosticOnly: true,
      envelope: 'rows',
      rejectedRowCount: 0,
      rowCount: 4,
    });
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0]).toEqual({
      actionTypeClass: 'ReadMessage',
      countClass: 'nonnegative_safe_integer',
      dateClass: 'bare_day',
      dimensionsKeyCount: 2,
      dimensionsPresent: true,
      outcomeClass: 'missing',
      rejectionGate: null,
      rowType: 'object',
    });
  });

  it('names the exact rejecting gate for drifted rows without echoing provider values', async () => {
    const drifted = '2026-09-02T00:00:00+00:00';
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        queueResponse([
          row('ReadMessage', '2026-09-02', 1),
          row('ReadMessage', drifted, 1),
          row('PurgeMessage', '2026-09-02', 1),
          row('DeleteMessage', '2026-09-02', 1, 'unknown-outcome'),
          { count: 1, dimensions: { actionType: 'ReadMessage' } },
        ]),
      );

    const result = await diagnoseQueueAnalyticsShape(input(fetchImpl));

    expect(result).toMatchObject({
      collectorVerdict: 'rejected',
      rejectedRowCount: 4,
      rowCount: 5,
    });
    expect(result.rows[1]).toMatchObject({
      dateClass: 'day_midnight_offset_z',
      rejectionGate: 'date_format',
    });
    expect(result.rows[2]).toMatchObject({
      actionTypeClass: 'other_string',
      rejectionGate: 'action_type_unknown',
    });
    expect(result.rows[3]).toMatchObject({
      outcomeClass: 'other_string',
      rejectionGate: 'outcome_shape',
    });
    expect(result.rows[4]).toMatchObject({
      dateClass: 'missing',
      rejectionGate: 'date_missing',
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain(queueId);
    expect(serialized).not.toContain(drifted);
    expect(serialized).not.toContain('PurgeMessage');
    expect(serialized).not.toContain('unknown-outcome');
    expect(serialized).not.toMatch(/\d{4}-\d{2}-\d{2}T/u);
  });

  it('bounds emitted rows while still counting every rejected row', async () => {
    const rows = Array.from({ length: 40 }, () =>
      row('ReadMessage', '2026-09-02T00:00:00.001Z', 1),
    );
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(queueResponse(rows));

    const result = await diagnoseQueueAnalyticsShape(input(fetchImpl));

    expect(result.rowCount).toBe(40);
    expect(result.rejectedRowCount).toBe(40);
    expect(result.rows).toHaveLength(12);
    expect(result.rowsTruncated).toBe(true);
  });

  it('reports closed envelope failures instead of raw payloads', async () => {
    const cases: Array<{ payload: unknown; envelope: string }> = [
      {
        envelope: 'missing_queue_analytics_node',
        payload: { data: { viewer: { accounts: [{}] } } },
      },
      {
        envelope: 'missing_account_result',
        payload: { data: { viewer: { accounts: [] } } },
      },
      {
        envelope: 'graphql_error',
        payload: { data: null, errors: [{ message: 'provider detail' }] },
      },
    ];

    for (const testCase of cases) {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json(testCase.payload));
      const result = await diagnoseQueueAnalyticsShape(input(fetchImpl));
      expect(result.envelope).toBe(testCase.envelope);
      expect(result.collectorVerdict).toBe('rejected');
      expect(JSON.stringify(result)).not.toContain('provider detail');
    }
  });

  it('keeps CLI output bounded and redacts every failure detail', () => {
    const script = new URL(
      '../infra/workflows/diagnose-content-schema-registry-queue-shape.mjs',
      import.meta.url,
    );
    const run = (mock: string) =>
      spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          '--import',
          `data:text/javascript,${encodeURIComponent(mock)}`,
          script.pathname,
        ],
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            CLOUDFLARE_ACCOUNT_ID: accountId,
            CLOUDFLARE_OBSERVABILITY_API_TOKEN: token,
            CLOUDFLARE_PLATFORM_QUEUE_ID: queueId,
            QUERY_ID: queryId,
            WINDOW_END: window.endedAt,
            WINDOW_START: window.startedAt,
          },
        },
      );

    const success = run(
      `globalThis.fetch = async () => Response.json({errors:null,data:{viewer:{accounts:[{queueMessageOperationsAdaptiveGroups:[{count:2,dimensions:{actionType:'ReadMessage',date:'2026-09-02T00:00:00+00:00'}}]}]}}});`,
    );
    expect(success.status).toBe(0);
    const parsed = JSON.parse(success.stdout) as {
      collectorVerdict: string;
      diagnosticOnly: boolean;
      rejectedRowCount: number;
    };
    expect(parsed).toMatchObject({
      collectorVerdict: 'rejected',
      diagnosticOnly: true,
      rejectedRowCount: 1,
    });
    expect(success.stdout).not.toMatch(/\d{4}-\d{2}-\d{2}T/u);

    const failure = run(
      `globalThis.fetch = async () => { throw new Error('never-print'); };`,
    );
    expect(failure.status).toBe(1);
    expect(failure.stdout).toBe('');
    expect(failure.stderr).toContain(
      'AC211 queue shape diagnostic unavailable; normal collection still required.',
    );
    expect(success.stdout + success.stderr + failure.stderr).not.toMatch(
      /private-cloudflare-token|never-print/u,
    );
  });
});

describe('queue analytics shape diagnostic verdict parity', () => {
  const providerCap = 64_000;

  const diagnosticInput = (fetchImpl: typeof fetch) => ({
    accountId,
    fetchImpl,
    queryId,
    queueId,
    token,
    window: {
      endedAt: '2026-09-03T00:00:00.000Z',
      startedAt: '2026-09-02T00:00:00.000Z',
    },
  });

  const collectorInput = (fetchImpl: typeof fetch) => ({
    accountId,
    date: '2026-09-02',
    fetchImpl,
    queryId,
    queueId,
    token,
  });

  const responseFor = (rows: readonly unknown[]): Response =>
    Response.json({
      data: {
        viewer: { accounts: [{ queueMessageOperationsAdaptiveGroups: rows }] },
      },
      errors: null,
    });

  const collectVerdict = async (rows: readonly unknown[]) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(responseFor(rows));
    try {
      await queryQueueMessageOperations(collectorInput(fetchImpl));
      return 'accepted' as const;
    } catch {
      return 'rejected' as const;
    }
  };

  const diagnose = async (rows: readonly unknown[]) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(responseFor(rows));
    return diagnoseQueueAnalyticsShape(diagnosticInput(fetchImpl));
  };

  const cases: ReadonlyArray<{
    label: string;
    rows: readonly unknown[];
    expectedVerdict: 'accepted' | 'rejected';
    expectedSummaryGate: string | null;
  }> = [
    {
      expectedSummaryGate: null,
      expectedVerdict: 'accepted',
      label: 'two read rows exactly at the provider cap',
      rows: [
        row('ReadMessage', '2026-09-02', providerCap / 2),
        row('ReadMessage', '2026-09-02', providerCap / 2),
      ],
    },
    {
      expectedSummaryGate: 'count_sum_overflow',
      expectedVerdict: 'rejected',
      label: 'two read rows one above the provider cap',
      rows: [
        row('ReadMessage', '2026-09-02', providerCap),
        row('ReadMessage', '2026-09-02', providerCap),
      ],
    },
    {
      expectedSummaryGate: 'count_sum_overflow',
      expectedVerdict: 'rejected',
      label: 'two read rows one above the provider cap by a single message',
      rows: [
        row('ReadMessage', '2026-09-02', providerCap),
        row('ReadMessage', '2026-09-02', 1),
      ],
    },
    {
      expectedSummaryGate: null,
      expectedVerdict: 'accepted',
      label: 'read and delete rows that stay under the cap',
      rows: [
        row('ReadMessage', '2026-09-02', 5),
        row('DeleteMessage', '2026-09-02', 9, 'success'),
      ],
    },
    {
      expectedSummaryGate: 'count_sum_overflow',
      expectedVerdict: 'rejected',
      label: 'two dlq delete rows above the provider cap',
      rows: [
        row('DeleteMessage', '2026-09-02', providerCap, 'dlq'),
        row('DeleteMessage', '2026-09-02', providerCap, 'dlq'),
      ],
    },
    {
      expectedSummaryGate: null,
      expectedVerdict: 'accepted',
      label: 'non-dlq delete rows that sum high without dlq overflow',
      rows: [
        row('DeleteMessage', '2026-09-02', providerCap, 'success'),
        row('DeleteMessage', '2026-09-02', providerCap, 'fail'),
      ],
    },
    {
      expectedSummaryGate: 'outcome_shape',
      expectedVerdict: 'rejected',
      label: 'a drifted later row after overflow-free rows',
      rows: [
        row('ReadMessage', '2026-09-02', 1),
        row('DeleteMessage', '2026-09-02', 1, 'not-a-real-outcome'),
      ],
    },
    {
      expectedSummaryGate: 'date_format',
      expectedVerdict: 'rejected',
      label: 'a drifted first date ahead of an overflowing read total',
      rows: [
        row('ReadMessage', '2026-09-02T00:00:01Z', 1),
        row('ReadMessage', '2026-09-02', providerCap),
        row('ReadMessage', '2026-09-02', providerCap),
      ],
    },
  ];

  it.each(cases)('agrees with the collector on $label', async (testCase) => {
    expect(await collectVerdict(testCase.rows)).toBe(testCase.expectedVerdict);

    const result = await diagnose(testCase.rows);

    expect(result.collectorVerdict).toBe(testCase.expectedVerdict);
    expect(result.summaryGate).toBe(testCase.expectedSummaryGate);
  });

  it('reports the aggregate overflow as classes without raw provider values', async () => {
    const result = await diagnose([
      row('ReadMessage', '2026-09-02', providerCap),
      row('ReadMessage', '2026-09-02', providerCap),
    ]);

    expect(result.collectorVerdict).toBe('rejected');
    expect(result.summaryGate).toBe('count_sum_overflow');
    expect(result.queueAttemptsClass).toBe('above_provider_cap');
    expect(result.dlqMessagesClass).toBe('within_provider_cap');

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(String(providerCap));
    expect(serialized).not.toContain(queueId);
    expect(serialized).not.toMatch(/\d{4}-\d{2}-\d{2}T/u);
  });

  it('keeps the aggregate classes within-cap for an accepted payload', async () => {
    const result = await diagnose([row('ReadMessage', '2026-09-02', 3)]);

    expect(result.collectorVerdict).toBe('accepted');
    expect(result.summaryGate).toBeNull();
    expect(result.queueAttemptsClass).toBe('within_provider_cap');
    expect(result.dlqMessagesClass).toBe('within_provider_cap');
  });
});
