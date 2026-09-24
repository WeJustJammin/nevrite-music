import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_ROUTING_EVENT_MAX_ROWS,
  AC209_EMAIL_ROUTING_EVENT_MAX_WINDOW_MS,
  AC209_EMAIL_ROUTING_EVENT_QUERY,
  AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
  Ac209EmailRoutingEventReportSchema,
} from '../infra/workflows/ac209-email-routing-event-contract.ts';
import { collectAc209EmailRoutingEvents } from '../infra/workflows/ac209-email-routing-event.ts';

const zoneId = '5bfba340525c623584c47d631116804c';
const sourceRevision = '20338c72ef9f5924f5f2a7ce82c12122aa84c46a';
const token = 'observability-token-that-must-never-be-emitted';
const probedAtMs = Date.parse('2026-09-24T12:00:00Z');
const windowStart = '2026-09-22T20:00:00.000Z';
const windowEnd = '2026-09-22T20:59:59.000Z';

const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const eventsPayload = (rows: readonly unknown[]) => ({
  data: { viewer: { zones: [{ emailRoutingAdaptive: rows }] } },
  errors: null,
});

const eventRow = (
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  datetime: '2026-09-22T20:22:30.000Z',
  status: 'delivered',
  action: 'forward',
  isLastEvent: 1,
  messageId: 'cloudflare-email-message-0001',
  ...overrides,
});

const input = (fetchImpl: typeof fetch) => ({
  zoneId,
  token,
  sourceRevision,
  start: windowStart,
  end: windowEnd,
  fetchImpl,
  now: () => probedAtMs,
});

const digestOf = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const stub = (rows: readonly unknown[]) => {
  const fetchImpl = vi.fn<typeof fetch>();
  fetchImpl.mockResolvedValueOnce(response(eventsPayload(rows)));
  return fetchImpl;
};

describe('AC209 routing event query shape', () => {
  it('uses the documented events dataset over Time filters on one hour', () => {
    expect(AC209_EMAIL_ROUTING_EVENT_QUERY).toContain('emailRoutingAdaptive(');
    expect(AC209_EMAIL_ROUTING_EVENT_QUERY).toContain('datetime_geq: $start');
    expect(AC209_EMAIL_ROUTING_EVENT_QUERY).toContain('datetime_leq: $end');
    // Event datasets take Time filters, never the aggregated Date filters.
    expect(AC209_EMAIL_ROUTING_EVENT_QUERY).not.toContain('date_geq');
    expect(AC209_EMAIL_ROUTING_EVENT_QUERY).toContain('limit: 50');
    expect(AC209_EMAIL_ROUTING_EVENT_MAX_ROWS).toBe(50);
  });

  it('selects only the bounded labels, the final-event flag, and the identifier', () => {
    for (const field of [
      'datetime',
      'status',
      'action',
      'isLastEvent',
      'messageId',
    ])
      expect(AC209_EMAIL_ROUTING_EVENT_QUERY).toMatch(
        new RegExp(`^\\s+${field}\\s*$`, 'mu'),
      );
    // No address, subject, session, routing-rule, or provider error detail is
    // selected, so none of them can be retained or published.
    for (const field of [
      'from',
      'to',
      'subject',
      'sessionId',
      'ruleMatched',
      'errorDetail',
      'eventType',
    ])
      expect(AC209_EMAIL_ROUTING_EVENT_QUERY).not.toMatch(
        new RegExp(`^\\s+${field}\\s*$`, 'mu'),
      );
  });

  it('bounds the window to the widest span a single events request may serve', () => {
    expect(AC209_EMAIL_ROUTING_EVENT_MAX_WINDOW_MS).toBe(3_600_000);
  });
});

describe('AC209 routing event collection', () => {
  it('issues exactly one bounded request with the caller-supplied hour', async () => {
    const fetchImpl = stub([]);

    await collectAc209EmailRoutingEvents(input(fetchImpl));

    const bodies = fetchImpl.mock.calls.map(
      ([, init]) =>
        JSON.parse(String(init?.body)) as {
          readonly query: string;
          readonly variables: Readonly<Record<string, string>>;
        },
    );
    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.query).toBe(AC209_EMAIL_ROUTING_EVENT_QUERY);
    expect(bodies[0]?.variables).toEqual({
      zoneTag: zoneId,
      start: windowStart,
      end: windowEnd,
    });
  });

  it('reports the status and action distributions the provider returned', async () => {
    const fetchImpl = stub([
      eventRow({ status: 'dropped', action: 'drop', messageId: 'a' }),
      eventRow({ status: 'dropped', action: 'drop', messageId: 'b' }),
      eventRow({ status: 'delivered', action: 'forward', messageId: 'c' }),
      eventRow({
        status: 'delivered',
        action: 'forward',
        messageId: 'd',
        isLastEvent: 0,
      }),
    ]);

    const report = await collectAc209EmailRoutingEvents(input(fetchImpl));

    expect(report.outcome.status).toBe('available');
    if (report.outcome.status !== 'available') throw new Error('unreachable');
    expect(report.outcome.rowsReturned).toBe(4);
    expect(report.outcome.withinWindowRows).toBe(4);
    expect(report.outcome.outsideWindowRows).toBe(0);
    expect(report.outcome.uniqueMessageIds).toBe(4);
    expect(report.outcome.messageIdsMissing).toBe(0);
    expect(report.outcome.messageIdDigestCoverage).toBe('complete');
    expect(report.outcome.finalEventRows).toBe(3);
    // Ordered by descending count, then label, so the artifact is deterministic.
    expect(report.outcome.statusCounts).toEqual([
      { label: 'delivered', count: 2 },
      { label: 'dropped', count: 2 },
    ]);
    expect(report.outcome.actionCounts).toEqual([
      { label: 'drop', count: 2 },
      { label: 'forward', count: 2 },
    ]);
  });

  it('records an empty hour without claiming no send occurred', async () => {
    const report = await collectAc209EmailRoutingEvents(input(stub([])));

    expect(report.outcome.status).toBe('available');
    if (report.outcome.status !== 'available') throw new Error('unreachable');
    expect(report.outcome.withinWindowRows).toBe(0);
    expect(report.outcome.statusCounts).toEqual([]);
    // The sampling caveat is what stops a zero-row reading from reading as proof.
    expect(report.sampling).toBe('provider_may_sample_adaptive_dataset');
    expect(report.observation).toBe('provider_reported_per_event_rows');
    // An empty hour never asserts that the underlying events were absent.
    expect(report.underlyingEventAbsence).toBe('not_established');
    expect(report.schemaVersion).toBe(AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION);
  });

  it('keeps one-way digests only, never the identifier itself', async () => {
    const messageId = 'cloudflare-email-message-private-0001';
    const fetchImpl = stub([eventRow({ messageId })]);

    const report = await collectAc209EmailRoutingEvents(input(fetchImpl));
    const serialized = JSON.stringify(report);

    if (report.outcome.status !== 'available') throw new Error('unreachable');
    expect(report.outcome.messageIdDigests).toEqual([digestOf(messageId)]);
    expect(serialized).not.toContain(messageId);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain(zoneId);
  });

  it('keeps one digest when two events share one provider identifier', async () => {
    // A forward and its later delivery can carry the same provider message
    // identifier, so a set smaller than the row count is still FULL coverage.
    const fetchImpl = stub([
      eventRow({ messageId: 'shared-identifier', isLastEvent: 0 }),
      eventRow({ messageId: 'shared-identifier', isLastEvent: 1 }),
    ]);

    const report = await collectAc209EmailRoutingEvents(input(fetchImpl));

    if (report.outcome.status !== 'available') throw new Error('unreachable');
    expect(report.outcome.withinWindowRows).toBe(2);
    expect(report.outcome.uniqueMessageIds).toBe(1);
    expect(report.outcome.messageIdsMissing).toBe(0);
    expect(report.outcome.messageIdDigestCoverage).toBe('complete');
  });

  it('marks digest coverage partial when a row carries no identifier', async () => {
    const unusableIdentifiers: readonly unknown[] = [
      undefined,
      '',
      'has space',
      'multi\u00e9byte',
      null,
      42,
    ];

    for (const messageId of unusableIdentifiers) {
      const fetchImpl = stub([
        eventRow({ messageId: 'present-identifier' }),
        eventRow({ messageId }),
      ]);

      const report = await collectAc209EmailRoutingEvents(input(fetchImpl));

      if (report.outcome.status !== 'available') throw new Error('unreachable');
      expect(report.outcome.withinWindowRows).toBe(2);
      expect(report.outcome.messageIdsMissing).toBe(1);
      // A partial set MUST NOT be read as absence, so the report says so.
      expect(report.outcome.messageIdDigestCoverage).toBe('partial');
      expect(report.outcome.messageIdDigests).toEqual([
        digestOf('present-identifier'),
      ]);
    }
  });

  it('excludes out-of-window rows from every distribution and digest set', async () => {
    const fetchImpl = stub([
      eventRow({ messageId: 'inside' }),
      eventRow({
        messageId: 'before-window',
        datetime: '2026-09-22T19:59:59.000Z',
        status: 'rejected',
        action: 'reject',
      }),
      eventRow({
        messageId: 'after-window',
        datetime: '2026-09-22T21:00:00.000Z',
        status: 'rejected',
        action: 'reject',
      }),
    ]);

    const report = await collectAc209EmailRoutingEvents(input(fetchImpl));

    if (report.outcome.status !== 'available') throw new Error('unreachable');
    expect(report.outcome.rowsReturned).toBe(3);
    expect(report.outcome.withinWindowRows).toBe(1);
    expect(report.outcome.outsideWindowRows).toBe(2);
    expect(report.outcome.uniqueMessageIds).toBe(1);
    expect(report.outcome.statusCounts).toEqual([
      { label: 'delivered', count: 1 },
    ]);
    expect(report.outcome.messageIdDigests).toEqual([digestOf('inside')]);
  });

  it('counts an event exactly on either window bound as in-window', async () => {
    const fetchImpl = stub([
      eventRow({ datetime: windowStart, messageId: 'at-start' }),
      eventRow({ datetime: windowEnd, messageId: 'at-end' }),
    ]);

    const report = await collectAc209EmailRoutingEvents(input(fetchImpl));

    if (report.outcome.status !== 'available') throw new Error('unreachable');
    expect(report.outcome.withinWindowRows).toBe(2);
    expect(report.outcome.outsideWindowRows).toBe(0);
  });

  it('fails closed on a full page instead of publishing a partial distribution', async () => {
    const fetchImpl = stub(
      Array.from({ length: AC209_EMAIL_ROUTING_EVENT_MAX_ROWS }, (_, index) =>
        eventRow({ messageId: `identifier-${index}` }),
      ),
    );

    const report = await collectAc209EmailRoutingEvents(input(fetchImpl));

    expect(report.outcome).toEqual({
      status: 'unavailable',
      code: 'provider_result_truncated',
    });
  });

  it('reports a closed non-PII code when the query fails', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    fetchImpl.mockResolvedValueOnce(
      response({ data: null, errors: [{ message: 'Permission denied' }] }),
    );

    const report = await collectAc209EmailRoutingEvents(input(fetchImpl));

    expect(report.outcome).toEqual({
      status: 'unavailable',
      code: 'provider_permission_denied',
    });
  });

  it('fails closed on a malformed row rather than interpreting it', async () => {
    const cases: readonly Readonly<Record<string, unknown>>[] = [
      {
        datetime: 'not-a-time',
        status: 'dropped',
        action: 'drop',
        isLastEvent: 1,
        messageId: 'a',
      },
      {
        datetime: '2026-09-22T20:22:30.000Z',
        status: '',
        action: 'drop',
        isLastEvent: 1,
        messageId: 'a',
      },
      {
        datetime: '2026-09-22T20:22:30.000Z',
        status: 'dropped\nnl',
        action: 'drop',
        isLastEvent: 1,
        messageId: 'a',
      },
      {
        datetime: '2026-09-22T20:22:30.000Z',
        status: 'dropped',
        action: 'dr\u001bop',
        isLastEvent: 1,
        messageId: 'a',
      },
      {
        datetime: '2026-09-22T20:22:30.000Z',
        status: 'dropped',
        action: 'drop',
        isLastEvent: 2,
        messageId: 'a',
      },
      {
        datetime: '2026-09-22T20:22:30.000Z',
        status: 'dropped',
        action: 'drop',
        isLastEvent: '1',
        messageId: 'a',
      },
    ];

    for (const row of cases) {
      const fetchImpl = stub([row]);
      const report = await collectAc209EmailRoutingEvents(input(fetchImpl));
      expect(report.outcome).toEqual({
        status: 'unavailable',
        code: 'provider_response_invalid',
      });
    }
  });

  it('rejects a row carrying an extra or missing field', async () => {
    const extraField = {
      ...eventRow(),
      errorDetail: 'provider-private-detail',
    };
    const missingField = eventRow();
    delete missingField['action'];

    for (const row of [extraField, missingField]) {
      const fetchImpl = stub([row]);
      const report = await collectAc209EmailRoutingEvents(input(fetchImpl));

      expect(report.outcome).toEqual({
        status: 'unavailable',
        code: 'provider_response_invalid',
      });
    }
  });

  it('rejects a dataset that is not an array', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    fetchImpl.mockResolvedValueOnce(
      response({
        data: { viewer: { zones: [{ emailRoutingAdaptive: 'not-an-array' }] } },
        errors: null,
      }),
    );

    const report = await collectAc209EmailRoutingEvents(input(fetchImpl));

    expect(report.outcome).toEqual({
      status: 'unavailable',
      code: 'provider_response_invalid',
    });
  });

  it('rejects an unusable window before any provider call', async () => {
    for (const window of [
      { start: windowEnd, end: windowStart },
      { start: windowStart, end: windowStart },
      { start: 'not-a-time', end: windowEnd },
      // One millisecond wider than the documented single-request span.
      { start: '2026-09-22T19:00:00.000Z', end: windowEnd },
    ]) {
      const fetchImpl = stub([]);

      await expect(
        collectAc209EmailRoutingEvents({ ...input(fetchImpl), ...window }),
      ).rejects.toMatchObject({ code: 'invalid_configuration' });
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it('accepts a window exactly as wide as the documented span', async () => {
    const fetchImpl = stub([]);

    const report = await collectAc209EmailRoutingEvents({
      ...input(fetchImpl),
      start: '2026-09-22T20:00:00.000Z',
      end: '2026-09-22T21:00:00.000Z',
    });

    expect(report.window).toEqual({
      start: '2026-09-22T20:00:00.000Z',
      end: '2026-09-22T21:00:00.000Z',
    });
  });

  it('rejects invalid configuration with a closed code', async () => {
    const fetchImpl = stub([]);

    for (const overrides of [
      { zoneId: 'not-a-zone' },
      { sourceRevision: 'main' },
      { token: 'short' },
      { token: 'has whitespace in it' },
      { start: '' },
    ]) {
      await expect(
        collectAc209EmailRoutingEvents({ ...input(fetchImpl), ...overrides }),
      ).rejects.toMatchObject({ code: 'invalid_configuration' });
      await expect(
        collectAc209EmailRoutingEvents({ ...input(fetchImpl), ...overrides }),
      ).rejects.toBeInstanceOf(Error);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('validates the probe instant through the shared reader', async () => {
    const fetchImpl = stub([]);

    for (const now of [Number.NaN, Number.POSITIVE_INFINITY, 1e18])
      await expect(
        collectAc209EmailRoutingEvents({ ...input(fetchImpl), now: () => now }),
      ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('binds the artifact to the zone by digest without retaining the zone id', async () => {
    const report = await collectAc209EmailRoutingEvents(input(stub([])));

    expect(report.zoneTagSha256).toBe(digestOf(zoneId));
    expect(report.environment).toBe('production');
    expect(report.diagnosticOnly).toBe(true);
    expect(report.dataset).toBe('emailRoutingAdaptive');
    expect(report.sourceRevision).toBe(sourceRevision);
    expect(Ac209EmailRoutingEventReportSchema.safeParse(report).success).toBe(
      true,
    );
  });
});
