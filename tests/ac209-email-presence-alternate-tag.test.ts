import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS,
  AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
  Ac209EmailPresenceProbeReportSchema,
} from '../infra/workflows/ac209-email-presence-contract.ts';
import { collectAc209EmailPresenceProbe } from '../infra/workflows/ac209-email-presence.ts';

const zoneId = '5bfba340525c623584c47d631116804c';
/** The sending-domain tag visible in the Email Sending dashboard path. */
const alternateTag = 'c82fdacb63fe415d96d71b64ef9bbca1';
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

/** A tag that resolves to no zone at all, the shape a non-zone tag produces. */
const noZone = () => ({ data: { viewer: { zones: [] } }, errors: null });

const withAlternate = (
  calls: readonly (() => Response)[],
): ReturnType<typeof vi.fn<typeof fetch>> => {
  const fetchImpl = vi.fn<typeof fetch>();
  for (const call of calls)
    fetchImpl.mockImplementationOnce(() => Promise.resolve(call()));
  return fetchImpl;
};

const input = (fetchImpl: typeof fetch, alternate?: string) => ({
  zoneId,
  token,
  sourceRevision,
  fetchImpl,
  now: () => probedAtMs,
  ...(alternate === undefined ? {} : { alternateZoneTag: alternate }),
});

const bodies = (fetchImpl: ReturnType<typeof vi.fn<typeof fetch>>) =>
  fetchImpl.mock.calls.map(
    ([, init]) =>
      JSON.parse(String(init?.body)) as {
        readonly variables: Readonly<Record<string, string>>;
      },
  );

describe('AC209 presence alternate candidate tag', () => {
  it('reports not_configured and makes no extra request when no alternate is supplied', async () => {
    const fetchImpl = withAlternate([
      () => response(presence([])),
      () => response(presence([])),
    ]);

    const report = await collectAc209EmailPresenceProbe(input(fetchImpl));

    expect(report.alternateCandidate).toEqual({ status: 'not_configured' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('queries the alternate tag with the bounded recent window only', async () => {
    const fetchImpl = withAlternate([
      () => response(presence([])),
      () => response(presence([])),
      () => response(noZone()),
    ]);

    await collectAc209EmailPresenceProbe(input(fetchImpl, alternateTag));

    const [third] = bodies(fetchImpl).slice(2);
    expect(third?.variables).toEqual({
      zoneTag: alternateTag,
      start: '2026-09-23T12:00:00.000Z',
      end: '2026-09-24T12:00:00.000Z',
    });
    expect(bodies(fetchImpl)).toHaveLength(3);
  });

  it('reports a non-zone alternate tag as an unavailable window, not as absence', async () => {
    const fetchImpl = withAlternate([
      () => response(presence([])),
      () => response(presence([])),
      () => response(noZone()),
    ]);

    const report = await collectAc209EmailPresenceProbe(
      input(fetchImpl, alternateTag),
    );

    expect(report.alternateCandidate).toEqual({
      status: 'unavailable',
      code: 'provider_resource_unavailable',
    });
  });

  it('reports a readable alternate tag with an empty dataset as available and empty', async () => {
    const fetchImpl = withAlternate([
      () => response(presence([])),
      () => response(presence([])),
      () => response(presence([])),
    ]);

    const report = await collectAc209EmailPresenceProbe(
      input(fetchImpl, alternateTag),
    );

    expect(report.alternateCandidate).toEqual({
      status: 'available',
      start: '2026-09-23T12:00:00.000Z',
      end: '2026-09-24T12:00:00.000Z',
      rowsReturned: 0,
      present: false,
    });
    expect(AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS).toBe(86_400_000);
  });

  it('reports an alternate tag that holds events without claiming them as AC209 evidence', async () => {
    const fetchImpl = withAlternate([
      () => response(presence([])),
      () => response(presence([])),
      () => response(presence([{ status: 'delivered' }])),
    ]);

    const report = await collectAc209EmailPresenceProbe(
      input(fetchImpl, alternateTag),
    );

    expect(report.alternateCandidate).toMatchObject({
      status: 'available',
      rowsReturned: 1,
      present: true,
    });
    // The parent-zone classification is the only presence signal that can
    // inform AC209; an alternate inventory must not move it.
    expect(report.classification).toBe('zone_wide_missing');
    expect(report.windows.last24Hours).toMatchObject({ rowsReturned: 0 });
    expect(report.windows.last30Days).toMatchObject({ rowsReturned: 0 });
  });

  it('never retains the alternate tag, the parent tag, or any provider identifier', async () => {
    const fetchImpl = withAlternate([
      () => response(presence([{ status: 'delivered' }])),
      () => response(presence([{ status: 'delivered' }])),
      () => response(presence([{ status: 'delivered' }])),
    ]);

    const report = await collectAc209EmailPresenceProbe(
      input(fetchImpl, alternateTag),
    );
    const serialized = JSON.stringify(report);

    for (const forbidden of [alternateTag, zoneId, token, 'alerts.wejamm.in'])
      expect(serialized).not.toContain(forbidden);
    expect(Ac209EmailPresenceProbeReportSchema.parse(report)).toEqual(report);
  });

  it('rejects a malformed alternate tag before any provider request', async () => {
    for (const bad of [
      'short',
      'C82FDACB63FE415D96D71B64EF9BBCA1',
      // An empty value is a malformed tag at the schema boundary; the
      // entrypoint is what maps an unset or empty environment variable to
      // "not supplied" so a default run stays valid.
      '',
      `${alternateTag}0`,
    ]) {
      const fetchForCase = withAlternate([() => response(presence([]))]);
      await expect(
        collectAc209EmailPresenceProbe(input(fetchForCase, bad)),
      ).rejects.toMatchObject({ code: 'invalid_configuration' });
      expect(fetchForCase).not.toHaveBeenCalled();
    }
  });

  it('keeps the parent windows and classification when the alternate fails', async () => {
    const fetchImpl = withAlternate([
      () => response(presence([])),
      () => response(presence([{ status: 'delivered' }])),
      () =>
        response({ data: null, errors: [{ message: 'authentication error' }] }),
    ]);

    const report = await collectAc209EmailPresenceProbe(
      input(fetchImpl, alternateTag),
    );

    expect(report.alternateCandidate).toEqual({
      status: 'unavailable',
      code: 'provider_permission_denied',
    });
    expect(report.windows.last24Hours).toMatchObject({ rowsReturned: 0 });
    expect(report.windows.last30Days).toMatchObject({ rowsReturned: 1 });
    expect(report.classification).toBe('recent_missing');
    expect(report.schemaVersion).toBe(AC209_EMAIL_PRESENCE_SCHEMA_VERSION);
  });
});
