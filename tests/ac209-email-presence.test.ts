import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_SENDING_MAX_WINDOW_MS,
  AC209_EMAIL_SENDING_QUERY,
} from '../infra/workflows/ac209-email-sending-analytics.ts';
import {
  AC209_EMAIL_PRESENCE_MAX_DURATION_MS,
  AC209_EMAIL_PRESENCE_QUERY,
  AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS,
  AC209_EMAIL_PRESENCE_SAMPLE_LIMIT,
  AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
  AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES,
  AC209_EMAIL_PRESENCE_WINDOWS_FIT_PROVIDER_BUDGET,
  AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS,
  Ac209EmailPresenceProbeReportSchema,
  Ac209EmailPresenceWindowSchema,
} from '../infra/workflows/ac209-email-presence-contract.ts';
import { collectAc209EmailPresenceProbe } from '../infra/workflows/ac209-email-presence.ts';

const zoneId = '5bfba340525c623584c47d631116804c';
const sourceRevision = 'c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2';
const token = 'observability-token-that-must-never-be-emitted';
const probedAtMs = Date.parse('2026-09-24T12:00:00Z');

const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const presence = (rows: unknown[]) => ({
  data: { viewer: { zones: [{ emailSendingAdaptive: rows }] } },
  errors: null,
});

const presenceStub = (rows: readonly (readonly unknown[])[]) => {
  const fetchImpl = vi.fn<typeof fetch>();
  for (const window of rows)
    fetchImpl.mockResolvedValueOnce(response(presence([...window])));
  return fetchImpl;
};

const input = (fetchImpl: typeof fetch) => ({
  zoneId,
  token,
  sourceRevision,
  fetchImpl,
  now: () => probedAtMs,
});

const eventRow = () => ({ status: 'delivered' });

describe('AC209 Email Sending presence probe query', () => {
  it('samples exactly one row of the dataset and selects no event field', () => {
    expect(AC209_EMAIL_PRESENCE_QUERY).toContain('emailSendingAdaptive(');
    expect(AC209_EMAIL_PRESENCE_QUERY).toContain('datetime_geq: $start');
    expect(AC209_EMAIL_PRESENCE_QUERY).toContain('datetime_leq: $end');
    expect(AC209_EMAIL_PRESENCE_QUERY).toContain('limit: 1');
    expect(AC209_EMAIL_PRESENCE_QUERY).toContain('orderBy: [datetime_DESC]');
    expect(AC209_EMAIL_PRESENCE_QUERY).toMatch(
      /emailSendingAdaptive\([\s\S]*?\)\s*\{\s*status\s*\}/u,
    );
    expect(AC209_EMAIL_PRESENCE_QUERY).not.toContain('settings');
    for (const field of [
      'datetime',
      'from',
      'to',
      'subject',
      'messageId',
      'isLastEvent',
    ])
      expect(AC209_EMAIL_PRESENCE_QUERY).not.toMatch(
        new RegExp(`^\\s+${field}\\s*$`, 'mu'),
      );
    expect(AC209_EMAIL_PRESENCE_QUERY).not.toMatch(
      /limit:\s*(?:[2-9]|\d{2,})/u,
    );
  });

  it('keeps both documented windows inside the provider request budgets', () => {
    expect(AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS).toBe(86_400_000);
    expect(AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS).toBe(2_592_000_000);
    expect(AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS).toBeLessThanOrEqual(
      AC209_EMAIL_PRESENCE_MAX_DURATION_MS,
    );
    expect(AC209_EMAIL_PRESENCE_SAMPLE_LIMIT).toBe(1);
  });

  it('enforces the provider duration budget instead of documenting it only', () => {
    // A future edit that widens a window past the provider's own `maxDuration`
    // ceiling must fail here rather than reaching a production request.
    expect(AC209_EMAIL_PRESENCE_WINDOWS_FIT_PROVIDER_BUDGET).toBe(true);
    expect(AC209_EMAIL_PRESENCE_MAX_DURATION_MS).toBe(2_678_400_000);
  });

  it('leaves the hour-bounded correlation gate untouched', () => {
    expect(AC209_EMAIL_SENDING_MAX_WINDOW_MS).toBe(3_600_000);
    expect(AC209_EMAIL_SENDING_QUERY).toContain('limit: 50');
  });
});

describe('AC209 Email Sending presence probe', () => {
  it('probes the exact trailing 24-hour and 30-day windows from one instant', async () => {
    const fetchImpl = presenceStub([[eventRow()], [eventRow()]]);

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));

    const bodies = fetchImpl.mock.calls.map(
      ([, init]) =>
        JSON.parse(String(init?.body)) as {
          readonly query: string;
          readonly variables: Readonly<Record<string, string>>;
        },
    );
    expect(bodies).toHaveLength(2);
    expect(bodies.map(({ query }) => query)).toEqual([
      AC209_EMAIL_PRESENCE_QUERY,
      AC209_EMAIL_PRESENCE_QUERY,
    ]);
    expect(bodies[0]?.variables).toEqual({
      zoneTag: zoneId,
      start: '2026-09-23T12:00:00.000Z',
      end: '2026-09-24T12:00:00.000Z',
    });
    expect(bodies[1]?.variables).toEqual({
      zoneTag: zoneId,
      start: '2026-08-25T12:00:00.000Z',
      end: '2026-09-24T12:00:00.000Z',
    });
    expect(report.probedAt).toBe('2026-09-24T12:00:00.000Z');
    expect(report.windows.last24Hours).toEqual({
      status: 'available',
      start: '2026-09-23T12:00:00.000Z',
      end: '2026-09-24T12:00:00.000Z',
      rowsReturned: 1,
      present: true,
    });
    expect(report.classification).toBe('recent_present');
  });

  it('classifies an empty recent window over a populated wide window as recent_missing', async () => {
    const fetchImpl = presenceStub([[], [eventRow()]]);

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));

    expect(report.windows.last24Hours).toMatchObject({
      status: 'available',
      rowsReturned: 0,
      present: false,
    });
    expect(report.windows.last30Days).toMatchObject({
      status: 'available',
      rowsReturned: 1,
      present: true,
    });
    expect(report.classification).toBe('recent_missing');
  });

  it('classifies a seventeen-day-old dataset as recent_missing', async () => {
    const fetchImpl = presenceStub([[], [eventRow()]]);
    const report = await collectAc209EmailPresenceProbe({
      ...input(fetchImpl),
      now: () => Date.parse('2026-09-23T12:00:00Z'),
    });

    expect(report.classification).toBe('recent_missing');
  });

  it('classifies an empty wide window as zone_wide_missing', async () => {
    const fetchImpl = presenceStub([[], []]);

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));

    expect(report.windows.last24Hours).toMatchObject({
      rowsReturned: 0,
      present: false,
    });
    expect(report.windows.last30Days).toMatchObject({
      rowsReturned: 0,
      present: false,
    });
    expect(report.classification).toBe('zone_wide_missing');
  });

  it('reports only the count and never an event field or the token', async () => {
    const fetchImpl = presenceStub([[eventRow()], [eventRow()]]);

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));
    const serialized = JSON.stringify(report);

    expect(serialized).toContain(AC209_EMAIL_PRESENCE_SCHEMA_VERSION);
    for (const forbidden of [
      token,
      'platform.on-call',
      'admin.wejammin@gmail.com',
      'dlq_nonempty',
      'messageId',
      'alerts.wejamm.in',
    ])
      expect(serialized).not.toContain(forbidden);
    expect(
      Ac209EmailPresenceProbeReportSchema.parse(
        JSON.parse(serialized) as unknown,
      ),
    ).toEqual(report);
  });

  it('fails closed on a provider GraphQL error envelope instead of reporting absence', async () => {
    const fetchImpl = presenceStub([[eventRow()], [eventRow()]]);
    fetchImpl.mockReset();
    fetchImpl
      .mockResolvedValueOnce(
        response({ data: null, errors: [{ message: 'authentication error' }] }),
      )
      .mockResolvedValueOnce(response(presence([eventRow()])));

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));

    expect(report.windows.last24Hours).toEqual({
      status: 'unavailable',
      code: 'provider_permission_denied',
    });
    expect(report.windows.last30Days).toMatchObject({ rowsReturned: 1 });
    expect(report.classification).toBe('provider_unavailable');
  });

  it('never maps an unusable exact zone to an empty dataset', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() =>
        Promise.resolve(
          response({ data: { viewer: { zones: [] } }, errors: null }),
        ),
      );

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));

    expect(report.windows.last24Hours).toEqual({
      status: 'unavailable',
      code: 'provider_resource_unavailable',
    });
    expect(report.windows.last30Days).toEqual({
      status: 'unavailable',
      code: 'provider_resource_unavailable',
    });
    expect(report.classification).toBe('provider_unavailable');
  });

  it('rejects a provider page larger than the one-row sample', async () => {
    const fetchImpl = presenceStub([[eventRow(), eventRow()], [eventRow()]]);

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));

    expect(report.windows.last24Hours).toEqual({
      status: 'unavailable',
      code: 'provider_response_invalid',
    });
    expect(report.classification).toBe('provider_unavailable');
  });

  it('rejects a malformed presence row', async () => {
    const fetchImpl = presenceStub([
      [{ status: 'delivered', subject: 'leak' }],
      [eventRow()],
    ]);

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));

    expect(report.windows.last24Hours).toEqual({
      status: 'unavailable',
      code: 'provider_response_invalid',
    });
  });

  it('classifies a non-provider failure as unexpected_failure', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(null as unknown as Response);

    await expect(
      collectAc209EmailPresenceProbe(input(fetchImpl)),
    ).rejects.toMatchObject({ code: 'unexpected_failure' });
  });

  it('rejects an invalid configuration before any provider request', async () => {
    const fetchImpl = presenceStub([[eventRow()], [eventRow()]]);

    await expect(
      collectAc209EmailPresenceProbe({ ...input(fetchImpl), zoneId: 'short' }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    await expect(
      collectAc209EmailPresenceProbe({
        ...input(fetchImpl),
        token: 'bad token',
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    await expect(
      collectAc209EmailPresenceProbe({
        ...input(fetchImpl),
        sourceRevision: 'not-a-revision',
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    await expect(
      collectAc209EmailPresenceProbe({ ...input(fetchImpl), now: () => 9e15 }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects an unknown report field', () => {
    expect(() =>
      Ac209EmailPresenceProbeReportSchema.parse({
        schemaVersion: AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        probedAt: '2026-09-24T12:00:00.000Z',
        windows: {
          last24Hours: {
            status: 'unavailable',
            code: 'provider_request_failed',
          },
          last30Days: {
            status: 'unavailable',
            code: 'provider_request_failed',
          },
        },
        classification: 'provider_unavailable',
        unexpected: 'nope',
      }),
    ).toThrow();
  });

  it('rejects an available window whose presence flag disagrees with its count', () => {
    expect(() =>
      Ac209EmailPresenceProbeReportSchema.parse({
        schemaVersion: AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        probedAt: '2026-09-24T12:00:00.000Z',
        windows: {
          last24Hours: {
            status: 'available',
            start: '2026-09-23T12:00:00.000Z',
            end: '2026-09-24T12:00:00.000Z',
            rowsReturned: 0,
            present: true,
          },
          last30Days: {
            status: 'unavailable',
            code: 'provider_request_failed',
          },
        },
        classification: 'recent_present',
      }),
    ).toThrow();
  });

  it('requires both windows to share one probe instant', async () => {
    const fetchImpl = presenceStub([[], [eventRow()]]);

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));

    const available = [report.windows.last24Hours, report.windows.last30Days];
    for (const window of available)
      if (window.status === 'available')
        expect(window.end).toBe(report.probedAt);
  });

  it('fails closed when the recent window has a row but the wide window is empty', async () => {
    // The windows are nested and sampled from one instant, so a populated
    // recent window over an empty wide window is a provider contradiction: the
    // probe must never publish it as a coherent presence report.
    const fetchImpl = presenceStub([[eventRow()], []]);

    await expect(
      collectAc209EmailPresenceProbe(input(fetchImpl)),
    ).rejects.toMatchObject({
      code: 'provider_response_invalid',
      name: 'Ac209EmailSendingAnalyticsError',
    });
  });
});

describe('AC209 Email Sending presence unavailable codes', () => {
  it('accepts every closed provider failure code the artifact can carry', () => {
    expect(AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES.length).toBeGreaterThan(0);
    for (const code of AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES)
      expect(
        Ac209EmailPresenceWindowSchema.parse({ status: 'unavailable', code }),
      ).toEqual({ status: 'unavailable', code });
  });

  it('rejects an out-of-vocabulary code so the retained artifact stays closed', () => {
    for (const code of [
      '',
      'graphql_error',
      'provider_unknown',
      'AC209 Email Sending analytics query failed.',
      'provider_response_invalid ',
    ])
      expect(
        Ac209EmailPresenceWindowSchema.safeParse({
          status: 'unavailable',
          code,
        }).success,
      ).toBe(false);
  });

  it('rejects a report that smuggles a free-text code', () => {
    expect(() =>
      Ac209EmailPresenceProbeReportSchema.parse({
        schemaVersion: AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        probedAt: '2026-09-24T12:00:00.000Z',
        windows: {
          last24Hours: {
            status: 'unavailable',
            code: 'provider_response_invalid: leaked detail',
          },
          last30Days: {
            status: 'unavailable',
            code: 'provider_request_failed',
          },
        },
        classification: 'provider_unavailable',
      }),
    ).toThrow();
  });
});
