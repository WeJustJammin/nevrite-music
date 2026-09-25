import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_SENDING_GROUPS_DATASET,
  AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS,
  AC209_EMAIL_SENDING_GROUPS_QUERY,
  AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION,
  Ac209EmailSendingGroupsReportSchema,
} from '../infra/workflows/ac209-email-sending-groups-contract.ts';
import { collectAc209EmailSendingGroups } from '../infra/workflows/ac209-email-sending-groups.ts';
import {
  digestOf,
  groupedRow,
  input,
  stub,
  subHourEnd,
  subHourStart,
  sourceRevision,
  windowEnd,
  windowStart,
  zoneId,
} from './ac209-email-sending-groups-fixtures.ts';

/**
 * Window and hour-bucket semantics. The provider's hour filter compares bucket
 * labels and is inclusive on both ends, so settling which buckets a requested
 * window maps to is the difference between a true reading and a false zero. The
 * provider's row-shape and failure classification are covered by
 * `./ac209-email-sending-groups-rows.test.ts`.
 */
describe('AC209 Email Sending groups window semantics', () => {
  it('passes the operator window through and reports digested hour groups', async () => {
    const fetchImpl = stub([
      groupedRow('2026-09-22T20:00:00.000Z', 'delivered', 3),
      groupedRow('2026-09-22T20:00:00.000Z', 'bounced', 1),
      groupedRow('2026-09-22T21:00:00.000Z', 'delivered', 2),
    ]);

    const report = await collectAc209EmailSendingGroups(input(fetchImpl));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('https://api.cloudflare.com/client/v4/graphql');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      query: AC209_EMAIL_SENDING_GROUPS_QUERY,
      variables: {
        zoneTag: zoneId,
        start: windowStart,
        end: '2026-09-22T20:00:00.000Z',
      },
    });
    expect(report).toMatchObject({
      schemaVersion: AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision,
      dataset: AC209_EMAIL_SENDING_GROUPS_DATASET,
      window: {
        requestedStart: windowStart,
        requestedEnd: windowEnd,
        queriedStart: windowStart,
        queriedEnd: '2026-09-22T20:00:00.000Z',
      },
      reportedTotalCount: 6,
      distinctHours: 2,
      pageComplete: true,
      sampling: 'provider_may_sample_adaptive_dataset',
      observation: 'provider_reported_grouped_totals',
    });
    expect(report.groups).toEqual([
      {
        datetimeHour: '2026-09-22T20:00:00.000Z',
        statusSha256: digestOf('delivered'),
        count: 3,
      },
      {
        datetimeHour: '2026-09-22T20:00:00.000Z',
        statusSha256: digestOf('bounced'),
        count: 1,
      },
      {
        datetimeHour: '2026-09-22T21:00:00.000Z',
        statusSha256: digestOf('delivered'),
        count: 2,
      },
    ]);
    expect(Ac209EmailSendingGroupsReportSchema.parse(report)).toEqual(report);
  });

  it('accepts the documented provider hour form without fractional seconds', async () => {
    // Cloudflare's documented hourly example renders the bucket as
    // `2026-09-24T14:00:00Z`, with no fractional part. The reader must accept it
    // and normalize, or every genuine provider response would fail closed.
    const fetchImpl = stub([
      {
        count: 2,
        dimensions: {
          datetimeHour: '2026-09-22T20:00:00Z',
          status: 'delivered',
        },
      },
    ]);

    const report = await collectAc209EmailSendingGroups(input(fetchImpl));

    expect(report.groups).toEqual([
      {
        datetimeHour: '2026-09-22T20:00:00.000Z',
        statusSha256: digestOf('delivered'),
        count: 2,
      },
    ]);
    expect(report.distinctHours).toBe(1);
  });

  it('normalizes every accepted hour form to the canonical bucket label', async () => {
    for (const form of [
      '2026-09-22T20:00:00Z',
      '2026-09-22T20:00:00.000Z',
      '2026-09-22T20:00:00+00:00',
    ]) {
      const report = await collectAc209EmailSendingGroups(
        input(
          stub([{ count: 1, dimensions: { datetimeHour: form, status: 'x' } }]),
        ),
      );
      expect(report.groups[0]?.datetimeHour).toBe('2026-09-22T20:00:00.000Z');
    }
  });

  it('fails closed when two rows claim the same hour and status', async () => {
    // Duplicate buckets would double-count the same provider group, so the
    // total would overstate activity while looking well-formed.
    await expect(
      collectAc209EmailSendingGroups(
        input(
          stub([
            groupedRow('2026-09-22T20:00:00.000Z', 'delivered', 3),
            groupedRow('2026-09-22T20:00:00.000Z', 'delivered', 4),
          ]),
        ),
      ),
    ).rejects.toMatchObject({ code: 'provider_response_invalid' });
  });

  it('does not exclude the hour that contains an aligned window end', async () => {
    // A bucket labelled 21:00 covers 21:00-22:00, which is entirely outside a
    // window ending at 21:00, so the query must not ask for it. The aligned
    // window [20:00,21:00) is exactly the single 20:00 bucket, and is NOT
    // reported as rounded.
    const fetchImpl = stub([]);

    const report = await collectAc209EmailSendingGroups(input(fetchImpl));

    const [, init] = fetchImpl.mock.calls[0]!;
    expect(
      (JSON.parse(String(init?.body)) as { variables: Record<string, string> })
        .variables,
    ).toEqual({
      zoneTag: zoneId,
      start: '2026-09-22T20:00:00.000Z',
      end: '2026-09-22T20:00:00.000Z',
    });
    expect(report.hourRounded).toBe(false);
    expect(report.window.queriedEnd).toBe('2026-09-22T20:00:00.000Z');
  });

  it('reports an hour-rounded window when the buckets extend past the request', async () => {
    const fetchImpl = stub([]);

    const report = await collectAc209EmailSendingGroups({
      ...input(fetchImpl),
      start: subHourStart,
      end: subHourEnd,
    });

    expect(report.hourRounded).toBe(true);
    // 20:10-20:50 lies wholly inside the 20:00 bucket, so that one bucket is
    // asked for and its labels describe the wider hour it covers.
    expect(report.window.queriedStart).toBe('2026-09-22T20:00:00.000Z');
    expect(report.window.queriedEnd).toBe('2026-09-22T20:00:00.000Z');
  });

  it('rejects a window wider than the bounded corroboration span before any request', async () => {
    // 30 days is 720 hourly buckets, which cannot fit one page, so a legitimate
    // request of that width would always fail mid-flight. It is rejected up
    // front with the bound the operator must respect instead.
    const fetchImpl = vi.fn<typeof fetch>();
    const end = '2026-09-22T20:00:00.000Z';
    const start = new Date(Date.parse(end) - 8 * 24 * 3_600_000).toISOString();

    await expect(
      collectAc209EmailSendingGroups({ ...input(fetchImpl), start, end }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts a corroboration window at the bounded span', async () => {
    const fetchImpl = stub([]);
    const end = '2026-09-22T20:00:00.000Z';
    const start = new Date(
      Date.parse(end) - AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS,
    ).toISOString();

    await expect(
      collectAc209EmailSendingGroups({ ...input(fetchImpl), start, end }),
    ).resolves.toMatchObject({ reportedTotalCount: 0 });
  });

  it('reports an empty window as zero groups rather than failing closed', async () => {
    // Zero rows is a real corroboration answer: the provider reported no
    // aggregated activity for the requested window.
    const report = await collectAc209EmailSendingGroups(input(stub([])));

    expect(report.groups).toEqual([]);
    expect(report.reportedTotalCount).toBe(0);
    expect(report.distinctHours).toBe(0);
    expect(report.pageComplete).toBe(true);
  });

  it('rounds a sub-hour window outward to whole hour buckets', async () => {
    // A bucket labelled 20:00 covers 20:00-21:00, so asking for
    // datetimeHour_geq 20:10 would EXCLUDE the hour that holds the traffic and
    // report a false zero. The requested span is therefore widened outward to
    // whole hours, and both the requested and the queried window are recorded.
    const fetchImpl = stub([
      groupedRow('2026-09-22T20:00:00.000Z', 'delivered', 4),
    ]);

    const report = await collectAc209EmailSendingGroups({
      ...input(fetchImpl),
      start: subHourStart,
      end: subHourEnd,
    });

    const [, init] = fetchImpl.mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({
      query: AC209_EMAIL_SENDING_GROUPS_QUERY,
      variables: {
        zoneTag: zoneId,
        start: '2026-09-22T20:00:00.000Z',
        end: '2026-09-22T20:00:00.000Z',
      },
    });
    expect(report.window).toEqual({
      requestedStart: subHourStart,
      requestedEnd: subHourEnd,
      queriedStart: '2026-09-22T20:00:00.000Z',
      queriedEnd: '2026-09-22T20:00:00.000Z',
    });
    // The counts cover whole hours, so they may include traffic outside the
    // requested span; the artifact says so rather than implying exactness.
    expect(report.granularity).toBe('utc_hour_bucket');
    expect(report.hourRounded).toBe(true);
    expect(report.reportedTotalCount).toBe(4);
  });

  it('does not widen an already hour-aligned window', async () => {
    const report = await collectAc209EmailSendingGroups(input(stub([])));

    expect(report.window).toEqual({
      requestedStart: windowStart,
      requestedEnd: windowEnd,
      queriedStart: windowStart,
      queriedEnd: '2026-09-22T20:00:00.000Z',
    });
    expect(report.hourRounded).toBe(false);
  });
});
