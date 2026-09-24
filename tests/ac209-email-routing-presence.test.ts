import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS,
  AC209_EMAIL_PRESENCE_SAMPLE_LIMIT,
  AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES,
  AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS,
} from '../infra/workflows/ac209-email-presence-contract.ts';
import {
  AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
  AC209_EMAIL_ROUTING_PRESENCE_QUERY,
  AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION,
  Ac209EmailDatasetsProbeReportSchema,
} from '../infra/workflows/ac209-email-routing-presence-contract.ts';
import {
  collectAc209EmailDatasetsProbe,
  collectAc209EmailRoutingPresence,
} from '../infra/workflows/ac209-email-routing-presence.ts';

const zoneId = '5bfba340525c623584c47d631116804c';
const sourceRevision = '5a23155a2296562cd3e3edf5b3b66f8a49c35a17';
const token = 'observability-token-that-must-never-be-emitted';
const probedAtMs = Date.parse('2026-09-24T12:00:00Z');

const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** One zone record carrying a dataset key, matching the shared envelope. */
const zonePayload = (dataset: string, rows: unknown[]) => ({
  data: { viewer: { zones: [{ [dataset]: rows }] } },
  errors: null,
});

const routing = (rows: unknown[]) => zonePayload('emailRoutingAdaptive', rows);
const sending = (rows: unknown[]) => zonePayload('emailSendingAdaptive', rows);

const routingRow = () => ({ status: 'dropped' });
const sendingRow = () => ({ status: 'delivered' });

const routingInput = (fetchImpl: typeof fetch) => ({
  zoneId,
  token,
  sourceRevision,
  fetchImpl,
  now: () => probedAtMs,
});

describe('AC209 Email Routing presence query', () => {
  it('samples exactly one row of the routing dataset and selects no event field', () => {
    expect(AC209_EMAIL_ROUTING_PRESENCE_QUERY).toContain(
      'emailRoutingAdaptive(',
    );
    expect(AC209_EMAIL_ROUTING_PRESENCE_QUERY).toContain(
      'datetime_geq: $start',
    );
    expect(AC209_EMAIL_ROUTING_PRESENCE_QUERY).toContain('datetime_leq: $end');
    expect(AC209_EMAIL_ROUTING_PRESENCE_QUERY).toContain('limit: 1');
    expect(AC209_EMAIL_ROUTING_PRESENCE_QUERY).toContain(
      'orderBy: [datetime_DESC]',
    );
    expect(AC209_EMAIL_ROUTING_PRESENCE_QUERY).toMatch(
      /emailRoutingAdaptive\([\s\S]*?\)\s*\{\s*status\s*\}/u,
    );
    for (const field of [
      'from',
      'to',
      'subject',
      'messageId',
      'sessionId',
      'ruleMatched',
      'errorDetail',
      'envelopeTo',
    ])
      expect(AC209_EMAIL_ROUTING_PRESENCE_QUERY).not.toMatch(
        new RegExp(`^\\s+${field}\\s*$`, 'mu'),
      );
    expect(AC209_EMAIL_ROUTING_PRESENCE_QUERY).not.toMatch(
      /limit:\s*(?:[2-9]|\d{2,})/u,
    );
  });

  it('reuses the sibling windows and one-row sample rather than restating them', () => {
    expect(AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS).toBe(86_400_000);
    expect(AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS).toBe(2_592_000_000);
    expect(AC209_EMAIL_PRESENCE_SAMPLE_LIMIT).toBe(1);
  });
});

describe('AC209 Email Routing presence probe', () => {
  it('probes the exact trailing 24-hour and 30-day windows from one instant', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(routing([routingRow()])))
      .mockResolvedValueOnce(response(routing([routingRow()])));

    const report = await collectAc209EmailRoutingPresence(
      routingInput(fetchImpl),
    );

    const bodies = fetchImpl.mock.calls.map(
      ([, init]) =>
        JSON.parse(String(init?.body)) as {
          readonly query: string;
          readonly variables: Readonly<Record<string, string>>;
        },
    );
    expect(bodies).toHaveLength(2);
    expect(bodies.map(({ query }) => query)).toEqual([
      AC209_EMAIL_ROUTING_PRESENCE_QUERY,
      AC209_EMAIL_ROUTING_PRESENCE_QUERY,
    ]);
    expect(bodies[0]?.variables).toEqual({
      zoneTag: zoneId,
      start: '2026-09-23T12:00:00.000Z',
      end: '2026-09-24T12:00:00.000Z',
    });
    expect(report.windows.last24Hours).toEqual({
      status: 'available',
      start: '2026-09-23T12:00:00.000Z',
      end: '2026-09-24T12:00:00.000Z',
      rowsReturned: 1,
      present: true,
    });
    expect(report.classification).toBe('recent_present');
  });

  it('classifies an empty wide window as zone_wide_missing', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(routing([])))
      .mockResolvedValueOnce(response(routing([])));

    const report = await collectAc209EmailRoutingPresence(
      routingInput(fetchImpl),
    );

    expect(report.classification).toBe('zone_wide_missing');
  });

  it('fails closed when the routing dataset is not served for the zone', async () => {
    // An unavailable routing dataset is the expected signal when Email Routing
    // is not enabled, so it must never be reported as an empty dataset.
    // Each call needs its own Response: a body can be read only once.
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(
        response({
          data: null,
          errors: [{ message: 'unknown field emailRoutingAdaptive' }],
        }),
      ),
    );

    const report = await collectAc209EmailRoutingPresence(
      routingInput(fetchImpl),
    );

    // The exact closed code depends on the provider's wording, so the probe
    // asserts the property that matters: an unreadable dataset is unavailable
    // with a code from the closed vocabulary, never an empty reading.
    for (const window of [
      report.windows.last24Hours,
      report.windows.last30Days,
    ]) {
      expect(window.status).toBe('unavailable');
      if (window.status === 'unavailable')
        expect(AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES).toContain(window.code);
    }
    expect(report.classification).toBe('provider_unavailable');
  });

  it('never maps an unusable exact zone to an empty routing dataset', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() =>
        Promise.resolve(
          response({ data: { viewer: { zones: [] } }, errors: null }),
        ),
      );

    const report = await collectAc209EmailRoutingPresence(
      routingInput(fetchImpl),
    );

    expect(report.windows.last30Days).toEqual({
      status: 'unavailable',
      code: 'provider_resource_unavailable',
    });
    expect(report.classification).toBe('provider_unavailable');
  });

  it('rejects an invalid configuration before any provider request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      collectAc209EmailRoutingPresence({
        ...routingInput(fetchImpl),
        zoneId: 'short',
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('AC209 combined email datasets probe', () => {
  const datasetsStub = (
    sendingRows: readonly (readonly unknown[])[],
    routingRows: readonly (readonly unknown[])[],
  ) => {
    const fetchImpl = vi.fn<typeof fetch>();
    for (const rows of sendingRows)
      fetchImpl.mockResolvedValueOnce(response(sending([...rows])));
    for (const rows of routingRows)
      fetchImpl.mockResolvedValueOnce(response(routing([...rows])));
    return fetchImpl;
  };

  it('reports both datasets from one probe instant without merging them', async () => {
    // The combined probe reads the sending dataset first, then routing. The
    // sending fixture stays inside the nested-window rule: recent_present
    // requires both windows populated.
    const fetchImpl = datasetsStub([[sendingRow()], [sendingRow()]], [[], []]);

    const report = await collectAc209EmailDatasetsProbe(
      routingInput(fetchImpl),
    );

    expect(report.schemaVersion).toBe(
      AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
    );
    expect(report.probedAt).toBe('2026-09-24T12:00:00.000Z');
    expect(report.sending.windows.last24Hours).toMatchObject({
      rowsReturned: 1,
    });
    expect(report.sending.classification).toBe('recent_present');
    expect(report.routing.classification).toBe('zone_wide_missing');
    // Four bounded requests: two windows per dataset, in order.
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('keeps the routing verdict independent of the sending verdict', async () => {
    const fetchImpl = datasetsStub([[], []], [[routingRow()], [routingRow()]]);

    const report = await collectAc209EmailDatasetsProbe(
      routingInput(fetchImpl),
    );

    expect(report.sending.classification).toBe('zone_wide_missing');
    expect(report.routing.classification).toBe('recent_present');
    expect(Ac209EmailDatasetsProbeReportSchema.safeParse(report).success).toBe(
      true,
    );
  });

  it('carries an unavailable routing dataset without altering sending facts', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    fetchImpl
      .mockResolvedValueOnce(response(sending([])))
      .mockResolvedValueOnce(response(sending([])))
      .mockResolvedValueOnce(
        response({ data: null, errors: [{ message: 'unknown field' }] }),
      )
      .mockResolvedValueOnce(
        response({ data: null, errors: [{ message: 'unknown field' }] }),
      );

    const report = await collectAc209EmailDatasetsProbe(
      routingInput(fetchImpl),
    );

    expect(report.sending.classification).toBe('zone_wide_missing');
    expect(report.routing.classification).toBe('provider_unavailable');
  });

  it('never emits the token, an address, or a routing rule identifier', async () => {
    const fetchImpl = datasetsStub([[sendingRow()], [sendingRow()]], [[], []]);

    const report = await collectAc209EmailDatasetsProbe(
      routingInput(fetchImpl),
    );
    const serialized = JSON.stringify(report);

    expect(serialized).toContain(AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION);
    for (const forbidden of [
      token,
      'admin.wejammin@gmail.com',
      'platform.on-call',
      'alerts.wejamm.in',
      'messageId',
      'ruleMatched',
    ])
      expect(serialized).not.toContain(forbidden);
  });

  it('rejects an unknown report field', () => {
    expect(() =>
      Ac209EmailDatasetsProbeReportSchema.parse({
        schemaVersion: AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        probedAt: '2026-09-24T12:00:00.000Z',
        sending: {
          schemaVersion: 'ac209-email-presence-v1',
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
          alternateCandidate: { status: 'not_configured' },
          classification: 'provider_unavailable',
        },
        routing: {
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
        },
        unexpected: 'nope',
      }),
    ).toThrow();
  });
});
