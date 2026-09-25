import { createHash } from 'node:crypto';

import { vi } from 'vitest';

export const ZONE_ID = '5bfba340525c623584c47d631116804c';
export const SOURCE_REVISION = 'cb211a78dcf7fa55a253f614106ad31077f51f37';
export const TOKEN = 'observability-token-that-must-never-be-emitted';
export const PROBED_AT_MS = Date.parse('2026-09-24T12:00:00Z');
export const WINDOW_START = '2026-09-22T20:00:00.000Z';
export const WINDOW_END = '2026-09-22T21:00:00.000Z';
/** A sub-hour window, the shape a real exercise uses. */
export const SUB_HOUR_START = '2026-09-22T20:10:00.000Z';
export const SUB_HOUR_END = '2026-09-22T20:50:00.000Z';

export const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** The aggregated dataset returns a count plus its two grouped dimensions. */
export const groupsPayload = (rows: unknown[]) => ({
  data: { viewer: { zones: [{ emailSendingAdaptiveGroups: rows }] } },
  errors: null,
});

export const groupedRow = (
  datetimeHour: string,
  status: string,
  count: number,
) => ({ count, dimensions: { datetimeHour, status } });

export const input = (fetchImpl: typeof fetch) => ({
  zoneId: ZONE_ID,
  token: TOKEN,
  sourceRevision: SOURCE_REVISION,
  start: WINDOW_START,
  end: WINDOW_END,
  fetchImpl,
  now: () => PROBED_AT_MS,
});

export const stub = (rows: readonly unknown[]) => {
  const fetchImpl = vi.fn<typeof fetch>();
  fetchImpl.mockResolvedValueOnce(response(groupsPayload([...rows])));
  return fetchImpl;
};

export const digestOf = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

/** Lowercase aliases keep the split suites reading as they did before the split. */
export const zoneId = ZONE_ID;
export const token = TOKEN;
export const windowStart = WINDOW_START;
export const windowEnd = WINDOW_END;
export const sourceRevision = SOURCE_REVISION;
export const subHourStart = SUB_HOUR_START;
export const subHourEnd = SUB_HOUR_END;
export const probedAtMs = PROBED_AT_MS;
