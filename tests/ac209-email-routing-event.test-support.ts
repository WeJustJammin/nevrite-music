import { createHash } from 'node:crypto';

import { vi } from 'vitest';

/**
 * Shared fixtures for the AC209 Email Routing per-event diagnostic suites.
 *
 * Split out because `extensibility.md` caps a test file at 400 lines; the
 * fixtures are identical across the collection and failure suites, so they live
 * here once rather than being restated per file. The `.test-support.ts` suffix is
 * the repository's convention for a non-spec helper and is excluded from coverage.
 */

export const zoneId = '5bfba340525c623584c47d631116804c';
export const sourceRevision = '20338c72ef9f5924f5f2a7ce82c12122aa84c46a';
export const token = 'observability-token-that-must-never-be-emitted';
export const probedAtMs = Date.parse('2026-09-24T12:00:00Z');
export const windowStart = '2026-09-22T20:00:00.000Z';
export const windowEnd = '2026-09-22T20:59:59.000Z';

export const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const eventsPayload = (rows: readonly unknown[]) => ({
  data: { viewer: { zones: [{ emailRoutingAdaptive: rows }] } },
  errors: null,
});

export const eventRow = (
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  datetime: '2026-09-22T20:22:30.000Z',
  status: 'delivered',
  action: 'forward',
  isLastEvent: 1,
  messageId: 'cloudflare-email-message-0001',
  ...overrides,
});

export const input = (fetchImpl: typeof fetch) => ({
  zoneId,
  token,
  sourceRevision,
  start: windowStart,
  end: windowEnd,
  fetchImpl,
  now: () => probedAtMs,
});

export const digestOf = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const stub = (rows: readonly unknown[]) => {
  const fetchImpl = vi.fn<typeof fetch>();
  fetchImpl.mockResolvedValueOnce(response(eventsPayload(rows)));
  return fetchImpl;
};
