import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_SENDING_GROUPS_MAX_ROWS,
  AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS,
} from '../infra/workflows/ac209-email-sending-groups-contract.ts';
import { collectAc209EmailSendingGroups } from '../infra/workflows/ac209-email-sending-groups.ts';
import {
  digestOf,
  groupedRow,
  input,
  response,
  stub,
  token,
  windowEnd,
  windowStart,
  zoneId,
} from './ac209-email-sending-groups-fixtures.ts';

/**
 * Provider row shape, redaction, and failure classification. A grouped row is
 * the whole contract: `count` plus exactly `datetimeHour` and `status`, with the
 * label reaching an artifact only as a digest. Window semantics live in
 * `./ac209-email-sending-groups-window.test.ts`.
 */
describe('AC209 Email Sending groups row shape and redaction', () => {
  it('never emits the token, the zone tag, or provider label text', async () => {
    const status = '##[injected workflow command]';
    const report = await collectAc209EmailSendingGroups(
      input(stub([groupedRow('2026-09-22T20:00:00.000Z', status, 1)])),
    );

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain(zoneId);
    expect(serialized).not.toContain('##[');
    expect(serialized).not.toContain('injected workflow command');
    expect(report.groups[0]?.statusSha256).toBe(digestOf(status));
    expect(report.zoneTagSha256).toBe(digestOf(zoneId));
  });

  it.each([
    [
      'a row with an extra key',
      [{ ...groupedRow('2026-09-22T20:00:00.000Z', 'delivered', 1), extra: 1 }],
    ],
    [
      'a row with a third grouped dimension',
      [
        {
          count: 1,
          dimensions: {
            datetimeHour: '2026-09-22T20:00:00.000Z',
            status: 'delivered',
            sendingDomain: 'alerts.wejamm.in',
          },
        },
      ],
    ],
    [
      'a row missing the hour dimension',
      [{ count: 1, dimensions: { status: 'delivered' } }],
    ],
    [
      'a row with a non-string status',
      [
        {
          count: 1,
          dimensions: { datetimeHour: '2026-09-22T20:00:00.000Z', status: 7 },
        },
      ],
    ],
    [
      'a row with an unparsable hour',
      [groupedRow('not-a-timestamp', 'delivered', 1)],
    ],
    [
      'a row whose hour is not hour-aligned',
      [groupedRow('2026-09-22T20:30:00.000Z', 'delivered', 1)],
    ],
    [
      'a row with a fractional count',
      [groupedRow('2026-09-22T20:00:00.000Z', 'delivered', 1.5)],
    ],
    [
      'a row with a negative count',
      [groupedRow('2026-09-22T20:00:00.000Z', 'delivered', -1)],
    ],
    [
      'a row with a string count',
      [
        {
          count: '3',
          dimensions: {
            datetimeHour: '2026-09-22T20:00:00.000Z',
            status: 'delivered',
          },
        },
      ],
    ],
    [
      'an over-long provider status',
      [groupedRow('2026-09-22T20:00:00.000Z', 'x'.repeat(300), 1)],
    ],
    [
      'an empty provider status',
      [groupedRow('2026-09-22T20:00:00.000Z', '', 1)],
    ],
  ])('fails closed on %s', async (_label, rows) => {
    await expect(
      collectAc209EmailSendingGroups(input(stub(rows))),
    ).rejects.toMatchObject({ code: 'provider_response_invalid' });
  });

  it('fails closed when the dataset field is not an array', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    fetchImpl.mockResolvedValueOnce(
      response({
        data: { viewer: { zones: [{ emailSendingAdaptiveGroups: null }] } },
        errors: null,
      }),
    );

    await expect(
      collectAc209EmailSendingGroups(input(fetchImpl)),
    ).rejects.toMatchObject({ code: 'provider_response_invalid' });
  });

  it('fails closed rather than publishing a truncated window total', async () => {
    const rows = Array.from(
      { length: AC209_EMAIL_SENDING_GROUPS_MAX_ROWS },
      (_unused, index) =>
        groupedRow('2026-09-22T20:00:00.000Z', `status_${String(index)}`, 1),
    );

    await expect(
      collectAc209EmailSendingGroups(input(stub(rows))),
    ).rejects.toMatchObject({ code: 'provider_result_truncated' });
  });

  it.each([
    [
      'a window whose end is not after its start',
      { start: windowEnd, end: windowStart },
    ],
    [
      'a window wider than the provider duration budget',
      { start: '2026-08-01T00:00:00.000Z', end: windowEnd },
    ],
    ['a window start that is not a timestamp', { start: '2026-09-22' }],
  ])('rejects %s before any provider request', async (_label, window) => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      collectAc209EmailSendingGroups({
        ...input(fetchImpl),
        ...window,
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps the bucket-aligned span inside the provider duration budget', async () => {
    // The queried buckets are always a subset of the requested span's hours, so
    // bucket selection can only ever narrow the span, never widen it past the
    // budget. This pins that property rather than assuming it.
    const fetchImpl = stub([]);
    const end = '2026-09-22T20:30:00.000Z';
    const start = new Date(
      Date.parse(end) - AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS,
    ).toISOString();

    const report = await collectAc209EmailSendingGroups({
      ...input(fetchImpl),
      start,
      end,
    });

    const queriedMs =
      Date.parse(report.window.queriedEnd) -
      Date.parse(report.window.queriedStart);
    expect(queriedMs).toBeLessThanOrEqual(
      AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS,
    );
    expect(queriedMs).toBeGreaterThan(0);
    expect(report.hourRounded).toBe(true);
  });

  it('rejects an invalid zone or token without a provider request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      collectAc209EmailSendingGroups({
        ...input(fetchImpl),
        zoneId: 'not-a-zone',
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    await expect(
      collectAc209EmailSendingGroups({ ...input(fetchImpl), token: 'short' }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a provider permission denial',
      { data: null, errors: [{ message: 'Permission denied' }] },
      'provider_permission_denied',
    ],
    [
      'an unavailable exact zone',
      { data: { viewer: { zones: [] } }, errors: null },
      'provider_resource_unavailable',
    ],
    [
      'a malformed provider envelope',
      { data: null, errors: null },
      'provider_response_invalid',
    ],
  ])('classifies %s into a closed code', async (_label, payload, code) => {
    const fetchImpl = vi.fn<typeof fetch>();
    fetchImpl.mockResolvedValueOnce(response(payload));

    await expect(
      collectAc209EmailSendingGroups(input(fetchImpl)),
    ).rejects.toMatchObject({ code });
  });
});
