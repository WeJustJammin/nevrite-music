import { describe, expect, it, vi } from 'vitest';

import { Ac209EmailPresenceInputSchema } from '../infra/workflows/ac209-email-presence-contract.ts';
import {
  Ac209EmailDatasetsProbeReportSchema,
  Ac209EmailRoutingPresenceInputSchema,
  Ac209EmailRoutingPresenceReportSchema,
} from '../infra/workflows/ac209-email-routing-presence-contract.ts';
import {
  collectAc209EmailDatasetsProbe,
  collectAc209EmailRoutingPresence,
} from '../infra/workflows/ac209-email-routing-presence.ts';

const zoneId = '5bfba340525c623584c47d631116804c';
const sourceRevision = '5a23155a2296562cd3e3edf5b3b66f8a49c35a17';
const token = 'observability-token-that-must-never-be-emitted';

const response = (payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const emptyDatasets = () =>
  vi.fn<typeof fetch>().mockImplementation(() =>
    Promise.resolve(
      response({
        data: {
          viewer: {
            zones: [{ emailSendingAdaptive: [], emailRoutingAdaptive: [] }],
          },
        },
        errors: null,
      }),
    ),
  );

/**
 * A probe instant must fail closed into the closed `invalid_configuration` code.
 * Before this guard the outer combined probe called `Date.prototype.toISOString`
 * on the raw value, so `NaN`, `Infinity`, and an out-of-range instant escaped as
 * an unclassified `RangeError` instead of a closed provider code.
 */
const UNUSABLE_INSTANTS = [
  ['NaN', Number.NaN],
  ['Infinity', Number.POSITIVE_INFINITY],
  ['negative Infinity', Number.NEGATIVE_INFINITY],
  ['beyond the maximum safe instant', 8_640_000_000_000_001],
  ['only representable as an extended-year timestamp', 8_640_000_000_000_000],
  ['a two-fold maximum-safe integer', Number.MAX_SAFE_INTEGER * 2],
] as const;

describe('AC209 email datasets probe instant closure', () => {
  for (const [label, instant] of UNUSABLE_INSTANTS) {
    it(`fails both probes closed on ${label} without a provider request`, async () => {
      const fetchImpl = emptyDatasets();

      await expect(
        collectAc209EmailRoutingPresence({
          zoneId,
          token,
          sourceRevision,
          fetchImpl,
          now: () => instant,
        }),
      ).rejects.toMatchObject({ code: 'invalid_configuration' });
      await expect(
        collectAc209EmailDatasetsProbe({
          zoneId,
          token,
          sourceRevision,
          fetchImpl,
          now: () => instant,
        }),
      ).rejects.toMatchObject({ code: 'invalid_configuration' });
      expect(fetchImpl).not.toHaveBeenCalled();
    });
  }

  it('still accepts an ordinary instant and reports it on both datasets', async () => {
    const fetchImpl = emptyDatasets();

    const report = await collectAc209EmailDatasetsProbe({
      zoneId,
      token,
      sourceRevision,
      fetchImpl,
      now: () => Date.parse('2026-09-24T12:00:00Z'),
    });

    expect(report.probedAt).toBe('2026-09-24T12:00:00.000Z');
    expect(report.sending.probedAt).toBe('2026-09-24T12:00:00.000Z');
    expect(report.routing.probedAt).toBe('2026-09-24T12:00:00.000Z');
  });

  it('rejects an invalid configuration before any provider request', async () => {
    const fetchImpl = emptyDatasets();

    await expect(
      collectAc209EmailDatasetsProbe({
        zoneId: 'short',
        token,
        sourceRevision,
        fetchImpl,
        now: () => Date.parse('2026-09-24T12:00:00Z'),
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

/**
 * The routing probe must carry the same instant rules as the Email Sending
 * presence probe it sits beside, so both halves of one dispatch agree about
 * which instants are expressible as a safe release timestamp.
 */
describe('AC209 routing probe instant parity with the sending probe', () => {
  it('constrains the routing artifact instant to a safe release timestamp', () => {
    const rejected = Ac209EmailRoutingPresenceReportSchema.safeParse({
      schemaVersion: 'ac209-email-routing-presence-v1',
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision,
      probedAt: '+275760-09-13T00:00:00.000Z',
      dataset: 'emailRoutingAdaptive',
      windows: {
        last24Hours: { status: 'unavailable', code: 'provider_request_failed' },
        last30Days: { status: 'unavailable', code: 'provider_request_failed' },
      },
      classification: 'provider_unavailable',
    });

    expect(rejected.success).toBe(false);
  });

  it('derives the routing input schema from the sibling contract', () => {
    // Derivation is proved behaviourally: the routing schema accepts exactly the
    // sibling's shared fields and rejects the sibling-only alternate tag, which
    // a hand-copied schema with its own regexes would not do.
    expect(
      Ac209EmailRoutingPresenceInputSchema.safeParse({
        zoneId,
        token,
        sourceRevision,
      }).success,
    ).toBe(true);
    expect(
      Ac209EmailRoutingPresenceInputSchema.safeParse({
        zoneId,
        token,
        sourceRevision,
        alternateZoneTag: zoneId,
      }).success,
    ).toBe(false);
    expect(
      Ac209EmailRoutingPresenceInputSchema.safeParse({
        zoneId: 'short',
        token,
        sourceRevision,
      }).success,
    ).toBe(false);
    // The shared fields are the sibling's own, not a restatement.
    expect(new Set(Object.keys(Ac209EmailPresenceInputSchema.shape))).toEqual(
      new Set(['zoneId', 'token', 'sourceRevision', 'alternateZoneTag']),
    );
  });

  it('rejects an unsafe combined-report instant at the schema boundary too', () => {
    const sending = {
      schemaVersion: 'ac209-email-presence-v1',
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision,
      probedAt: '+275760-09-13T00:00:00.000Z',
      windows: {
        last24Hours: { status: 'unavailable', code: 'provider_request_failed' },
        last30Days: { status: 'unavailable', code: 'provider_request_failed' },
      },
      alternateCandidate: { status: 'not_configured' },
      classification: 'provider_unavailable',
    };
    const routing = {
      schemaVersion: 'ac209-email-routing-presence-v1',
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision,
      probedAt: '+275760-09-13T00:00:00.000Z',
      dataset: 'emailRoutingAdaptive',
      windows: {
        last24Hours: { status: 'unavailable', code: 'provider_request_failed' },
        last30Days: { status: 'unavailable', code: 'provider_request_failed' },
      },
      classification: 'provider_unavailable',
    };

    expect(
      Ac209EmailDatasetsProbeReportSchema.safeParse({
        schemaVersion: 'ac209-email-datasets-presence-v1',
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        probedAt: '+275760-09-13T00:00:00.000Z',
        sending,
        routing,
      }).success,
    ).toBe(false);
    // A safe instant on the same shape must still parse, so the rejection above
    // is the instant rule and not a malformed fixture.
    expect(
      Ac209EmailDatasetsProbeReportSchema.safeParse({
        schemaVersion: 'ac209-email-datasets-presence-v1',
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        probedAt: '2026-09-24T12:00:00.000Z',
        sending: { ...sending, probedAt: '2026-09-24T12:00:00.000Z' },
        routing: { ...routing, probedAt: '2026-09-24T12:00:00.000Z' },
      }).success,
    ).toBe(true);
  });
});
