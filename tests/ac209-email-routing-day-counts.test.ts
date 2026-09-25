import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_ROUTING_DAY_COUNTS_MAX_ROWS,
  AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY,
  AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
  AC209_EMAIL_ROUTING_DAY_COUNTS_WINDOW_DAYS,
  Ac209EmailRoutingDayCountsReportSchema,
} from '../infra/workflows/ac209-email-routing-day-counts-contract.ts';
import { collectAc209EmailRoutingDayCounts } from '../infra/workflows/ac209-email-routing-day-counts.ts';

const zoneId = '5bfba340525c623584c47d631116804c';
const sourceRevision = 'bcf609da43ebe756478960c4f99fb93de31207c3';
const token = 'observability-token-that-must-never-be-emitted';
const probedAtMs = Date.parse('2026-09-24T12:00:00Z');

const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** The aggregated dataset returns a count plus two grouped dimensions. */
const groupsPayload = (rows: unknown[]) => ({
  data: { viewer: { zones: [{ emailRoutingAdaptiveGroups: rows }] } },
  errors: null,
});

const groupedRow = (date: string, status: string, count: number) => ({
  count,
  dimensions: { date, status },
});

const input = (fetchImpl: typeof fetch) => ({
  zoneId,
  token,
  sourceRevision,
  fetchImpl,
  now: () => probedAtMs,
});

const stub = (rows: readonly unknown[]) => {
  const fetchImpl = vi.fn<typeof fetch>();
  fetchImpl.mockResolvedValueOnce(response(groupsPayload([...rows])));
  return fetchImpl;
};

const digestOf = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

describe('AC209 routing day-counts query shape', () => {
  it('uses the documented aggregated dataset with day-level date filters', () => {
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY).toContain(
      'emailRoutingAdaptiveGroups(',
    );
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY).toContain('date_geq: $start');
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY).toContain('date_leq: $end');
    // Aggregated datasets take Date filters, never the event Time filters.
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY).not.toContain('datetime_geq');
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY).toContain('count');
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY).toMatch(
      /dimensions\s*\{\s*date\s*status\s*\}/u,
    );
  });

  it('keeps the row bound low and selects no PII-bearing dimension', () => {
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY).toContain('limit: 100');
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_MAX_ROWS).toBe(100);
    for (const field of [
      'from',
      'to',
      'subject',
      'messageId',
      'sessionId',
      'ruleMatched',
      'errorDetail',
      'envelopeTo',
      'action',
    ])
      expect(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY).not.toMatch(
        new RegExp(`^\\s+${field}\\s*$`, 'mu'),
      );
  });

  it('bounds the window to the provider duration budget', () => {
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_WINDOW_DAYS).toBe(31);
  });
});

describe('AC209 routing day counts collection', () => {
  it('requests exactly one bounded UTC day window ending at the probe day', async () => {
    const fetchImpl = stub([]);

    await collectAc209EmailRoutingDayCounts(input(fetchImpl));

    const bodies = fetchImpl.mock.calls.map(
      ([, init]) =>
        JSON.parse(String(init?.body)) as {
          readonly query: string;
          readonly variables: Readonly<Record<string, string>>;
        },
    );
    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.query).toBe(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY);
    // Date-only variables: a bare UTC day, not a timestamp.
    const variables = bodies[0]?.variables ?? {};
    expect(variables).toEqual({
      zoneTag: zoneId,
      start: '2026-08-25',
      end: '2026-09-24',
    });
    for (const value of Object.values(variables))
      expect(value).not.toContain('T');
  });

  it('reports grouped day/status counts as provider-reported values', async () => {
    const fetchImpl = stub([
      groupedRow('2026-09-22', 'dropped', 1),
      groupedRow('2026-09-22', 'forwarded', 3),
      groupedRow('2026-08-30', 'dropped', 7),
    ]);

    const report = await collectAc209EmailRoutingDayCounts(input(fetchImpl));

    expect(report.groups).toEqual([
      { date: '2026-09-22', statusSha256: digestOf('dropped'), count: 1 },
      { date: '2026-09-22', statusSha256: digestOf('forwarded'), count: 3 },
      { date: '2026-08-30', statusSha256: digestOf('dropped'), count: 7 },
    ]);
    expect(report.distinctDays).toBe(2);
    expect(report.reportedTotalCount).toBe(11);
    expect(report.pageComplete).toBe(true);
    // The provider label itself never leaves the reader frame: only its digest is
    // carried, so no raw provider text reaches the artifact or the log line.
    expect(JSON.stringify(report)).not.toContain('dropped');
    expect(JSON.stringify(report)).not.toContain('forwarded');
  });

  it('distinguishes a complete-page zero total from the sibling at-least-one reading', async () => {
    const fetchImpl = stub([]);

    const report = await collectAc209EmailRoutingDayCounts(input(fetchImpl));

    expect(report.groups).toEqual([]);
    expect(report.reportedTotalCount).toBe(0);
    expect(report.distinctDays).toBe(0);
    // The artifact states its own provenance, so no reader can confuse a
    // complete-page grouped total with the events probe's limit-1 observation,
    // nor read it as an unsampled exact event count.
    expect(report.observation).toBe('provider_reported_grouped_totals');
    expect(report.pageComplete).toBe(true);
    expect(report.sampling).toBe('provider_may_sample_adaptive_dataset');
  });

  it('never claims an exact underlying event total', async () => {
    const fetchImpl = stub([groupedRow('2026-09-22', 'dropped', 5)]);

    const report = await collectAc209EmailRoutingDayCounts(input(fetchImpl));
    const serialized = JSON.stringify(report);

    // The Adaptive suffix means these counts may be estimates derived from a
    // sample, so no exact-total wording may appear anywhere in the artifact.
    for (const forbidden of [
      'exact_grouped_totals',
      'exact_total',
      'exactEventTotal',
      'exact total',
      'unsampled',
    ])
      expect(serialized).not.toContain(forbidden);
  });

  it('fails closed when the page reaches the bound instead of reporting a partial total', async () => {
    const rows = Array.from(
      { length: AC209_EMAIL_ROUTING_DAY_COUNTS_MAX_ROWS },
      (_, i) => groupedRow('2026-09-01', `status-${i}`, 1),
    );
    const fetchImpl = stub(rows);

    await expect(
      collectAc209EmailRoutingDayCounts(input(fetchImpl)),
    ).rejects.toMatchObject({ code: 'provider_result_truncated' });
  });

  it('rejects a row that is not exactly a count plus the two grouped dimensions', async () => {
    const cases: unknown[] = [
      { count: 1, dimensions: { date: '2026-09-22' } },
      { count: 1, dimensions: { status: 'dropped' } },
      {
        count: 1,
        dimensions: { date: '2026-09-22', status: 'dropped', action: 'drop' },
      },
      {
        count: 1,
        dimensions: { date: '2026-09-22', status: 'dropped' },
        extra: 1,
      },
      { dimensions: { date: '2026-09-22', status: 'dropped' } },
      { count: '1', dimensions: { date: '2026-09-22', status: 'dropped' } },
      { count: -1, dimensions: { date: '2026-09-22', status: 'dropped' } },
      { count: 1.5, dimensions: { date: '2026-09-22', status: 'dropped' } },
      { count: 1, dimensions: { date: '22/09/2026', status: 'dropped' } },
      {
        count: 1,
        dimensions: { date: '2026-09-22T00:00:00Z', status: 'dropped' },
      },
      { count: 1, dimensions: { date: '2026-09-22', status: '' } },
      { count: 1, dimensions: { date: '2026-09-22', status: 'a'.repeat(257) } },
      { count: 1, dimensions: { date: '2026-09-22', status: 42 } },
    ];

    for (const row of cases) {
      const fetchImpl = stub([row]);
      await expect(
        collectAc209EmailRoutingDayCounts(input(fetchImpl)),
      ).rejects.toMatchObject({
        name: 'Ac209EmailSendingAnalyticsError',
        code: 'provider_response_invalid',
      });
    }
  });

  it('fails closed on a provider error envelope instead of reporting zero', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() =>
        Promise.resolve(
          response({ data: null, errors: [{ message: 'unknown field' }] }),
        ),
      );

    await expect(
      collectAc209EmailRoutingDayCounts(input(fetchImpl)),
    ).rejects.toMatchObject({ name: 'Ac209EmailSendingAnalyticsError' });
  });

  it('never maps an unusable exact zone to an empty reading', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() =>
        Promise.resolve(
          response({ data: { viewer: { zones: [] } }, errors: null }),
        ),
      );

    await expect(
      collectAc209EmailRoutingDayCounts(input(fetchImpl)),
    ).rejects.toMatchObject({ name: 'Ac209EmailSendingAnalyticsError' });
  });

  it('rejects an invalid configuration before any provider request', async () => {
    const fetchImpl = stub([]);

    await expect(
      collectAc209EmailRoutingDayCounts({
        ...input(fetchImpl),
        zoneId: 'short',
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    await expect(
      collectAc209EmailRoutingDayCounts({
        ...input(fetchImpl),
        now: () => Number.NaN,
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('emits no token, address, subject, or provider message identifier', async () => {
    const fetchImpl = stub([groupedRow('2026-09-22', 'dropped', 1)]);

    const report = await collectAc209EmailRoutingDayCounts(input(fetchImpl));
    const serialized = JSON.stringify(report);

    expect(serialized).toContain(AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION);
    for (const forbidden of [
      token,
      'admin.wejammin@gmail.com',
      'platform.on-call',
      'alerts.wejamm.in',
      'messageId',
      'ruleMatched',
    ])
      expect(serialized).not.toContain(forbidden);
    expect(
      Ac209EmailRoutingDayCountsReportSchema.parse(JSON.parse(serialized)),
    ).toEqual(report);
  });

  it('rejects an unknown report field', () => {
    expect(() =>
      Ac209EmailRoutingDayCountsReportSchema.parse({
        schemaVersion: AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        probedAt: '2026-09-24T12:00:00.000Z',
        dataset: 'emailRoutingAdaptiveGroups',
        window: { start: '2026-08-25', end: '2026-09-24' },
        groups: [],
        reportedTotalCount: 0,
        distinctDays: 0,
        pageComplete: true,
        sampling: 'provider_may_sample_adaptive_dataset',
        observation: 'provider_reported_grouped_totals',
        unexpected: 'nope',
      }),
    ).toThrow();
  });
});
