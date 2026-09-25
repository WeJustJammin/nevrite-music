import { describe, expect, it, vi } from 'vitest';

import { Ac209EmailRoutingEventReportSchema } from '../infra/workflows/ac209-email-routing-event-contract.ts';
import { collectAc209EmailRoutingEvents } from '../infra/workflows/ac209-email-routing-event.ts';
import {
  digestOf,
  eventRow,
  input,
  response,
  sourceRevision,
  stub,
  windowEnd,
  windowStart,
  zoneId,
} from './ac209-email-routing-event.test-support.ts';

describe('AC209 routing event failure paths', () => {
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
      // One millisecond wider than the span the sibling diagnostic asks for.
      { start: '2026-09-22T19:00:00.000Z', end: windowEnd },
    ]) {
      const fetchImpl = stub([]);

      await expect(
        collectAc209EmailRoutingEvents({ ...input(fetchImpl), ...window }),
      ).rejects.toMatchObject({ code: 'invalid_configuration' });
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it('accepts a window exactly as wide as the sibling span', async () => {
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
