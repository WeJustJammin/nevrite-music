import { describe, expect, it } from 'vitest';

import {
  AC209_EMAIL_ROUTING_EVENT_DATASET,
  AC209_EMAIL_ROUTING_EVENT_FIELDS,
  AC209_EMAIL_ROUTING_EVENT_MAX_ROWS,
  AC209_EMAIL_ROUTING_EVENT_MAX_WINDOW_MS,
  AC209_EMAIL_ROUTING_EVENT_QUERY,
  AC209_EMAIL_ROUTING_EVENT_REQUIRED_FIELDS,
  AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
  Ac209EmailRoutingEventInputSchema,
  Ac209EmailRoutingEventLabelCountSchema,
  Ac209EmailRoutingEventReportSchema,
  isVisibleAsciiStatus,
} from '../infra/workflows/ac209-email-routing-event-contract.ts';

const sourceRevision = '20338c72ef9f5924f5f2a7ce82c12122aa84c46a';
const zoneId = '5bfba340525c623584c47d631116804c';

const availableOutcome = {
  status: 'available',
  rowsReturned: 0,
  withinWindowRows: 0,
  outsideWindowRows: 0,
  uniqueMessageIds: 0,
  messageIdsMissing: 0,
  finalEventRows: 0,
  statusCounts: [],
  actionCounts: [],
  messageIdDigests: [],
  messageIdDigestCoverage: 'complete',
} as const;

const baseReport = {
  schemaVersion: AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
  diagnosticOnly: true,
  environment: 'production',
  sourceRevision,
  probedAt: '2026-09-24T12:00:00.000Z',
  zoneTagSha256: 'b'.repeat(64),
  dataset: AC209_EMAIL_ROUTING_EVENT_DATASET,
  window: {
    start: '2026-09-22T20:00:00.000Z',
    end: '2026-09-22T20:59:59.000Z',
  },
  outcome: availableOutcome,
  sampling: 'provider_may_sample_adaptive_dataset',
  observation: 'provider_reported_per_event_rows',
  underlyingEventAbsence: 'not_established',
} as const;

/**
 * Schema-level guards for the per-event diagnostic. The report shape is the whole
 * safety story: it may only ever carry bounded counts, closed non-PII provider
 * labels, and one-way digests of provider message identifiers.
 */
describe('AC209 routing event contract closure', () => {
  it('declares the events dataset, the low row bound, and the Time-filtered query', () => {
    expect(AC209_EMAIL_ROUTING_EVENT_DATASET).toBe('emailRoutingAdaptive');
    expect(AC209_EMAIL_ROUTING_EVENT_MAX_ROWS).toBe(50);
    expect(AC209_EMAIL_ROUTING_EVENT_QUERY).toContain('emailRoutingAdaptive(');
    expect(AC209_EMAIL_ROUTING_EVENT_QUERY).toContain('limit: 50');
  });

  it('pins the row guard to the query selection set so the two cannot drift', () => {
    // The collector rejects any provider key outside AC209_EMAIL_ROUTING_EVENT_FIELDS,
    // so that list must be exactly the fields the query selects. This is what
    // stops a later edit from widening the selection to a PII-bearing field.
    for (const field of AC209_EMAIL_ROUTING_EVENT_FIELDS)
      expect(AC209_EMAIL_ROUTING_EVENT_QUERY).toMatch(
        new RegExp(`^\\s+${field}\\s*$`, 'mu'),
      );
    expect([...AC209_EMAIL_ROUTING_EVENT_FIELDS]).toEqual([
      'datetime',
      'status',
      'action',
      'isLastEvent',
      'messageId',
    ]);
    // Only `messageId` is optional; every other selected field must be present.
    expect([...AC209_EMAIL_ROUTING_EVENT_REQUIRED_FIELDS]).toEqual([
      'datetime',
      'status',
      'action',
      'isLastEvent',
    ]);
    expect(AC209_EMAIL_ROUTING_EVENT_REQUIRED_FIELDS).not.toContain(
      'messageId',
    );
  });

  it('selects no PII-bearing or attributable field at all', () => {
    for (const field of [
      'from',
      'to',
      'subject',
      'sessionId',
      'ruleMatched',
      'errorDetail',
      'eventType',
      'arc',
      'dkim',
      'dmarc',
      'spf',
      'isSpam',
      'isNDR',
    ])
      expect(AC209_EMAIL_ROUTING_EVENT_QUERY).not.toMatch(
        new RegExp(`^\\s+${field}\\s*$`, 'mu'),
      );
  });

  it('sizes the window against the shared single-request span', () => {
    // One hour: the span the sibling AC209 email diagnostic already asked the
    // Email Sending dataset for, and the documented maximum for these events
    // datasets. Reused rather than restated.
    expect(AC209_EMAIL_ROUTING_EVENT_MAX_WINDOW_MS).toBe(3_600_000);
  });

  it('accepts a valid input and rejects a malformed one', () => {
    const valid = {
      zoneId,
      token: 'observability-token-that-must-never-be-emitted',
      sourceRevision,
      start: '2026-09-22T20:00:00.000Z',
      end: '2026-09-22T20:59:59.000Z',
    };
    expect(Ac209EmailRoutingEventInputSchema.safeParse(valid).success).toBe(
      true,
    );
    for (const overrides of [
      { zoneId: 'not-a-zone' },
      { zoneId: zoneId.toUpperCase() },
      { sourceRevision: 'main' },
      { sourceRevision: 'z'.repeat(40) },
      { token: 'short' },
      { token: 'has whitespace' },
      { start: '2026-09-22 20:00:00' },
      { end: '' },
    ])
      expect(
        Ac209EmailRoutingEventInputSchema.safeParse({
          ...valid,
          ...overrides,
        }).success,
      ).toBe(false);
    // Strict: an unexpected configuration key is rejected, not ignored.
    expect(
      Ac209EmailRoutingEventInputSchema.safeParse({
        ...valid,
        expectedMessageId: 'sneaky',
      }).success,
    ).toBe(false);
  });

  it('accepts a bounded visible-ASCII label and rejects anything unprintable', () => {
    expect(
      Ac209EmailRoutingEventLabelCountSchema.safeParse({
        label: 'dropped',
        count: 3,
      }).success,
    ).toBe(true);
    for (const label of [
      '',
      'drop\nnl',
      'drop\trt',
      'drop\u001bsp',
      'drop\u0000nul',
      'drop\u007fdel',
      'drop\u009bc1',
      'dropéd',
      'a'.repeat(257),
    ])
      expect(
        Ac209EmailRoutingEventLabelCountSchema.safeParse({ label, count: 1 })
          .success,
      ).toBe(false);
    for (const count of [-1, 1.5, '1', null])
      expect(
        Ac209EmailRoutingEventLabelCountSchema.safeParse({
          label: 'dropped',
          count,
        }).success,
      ).toBe(false);
    expect(
      Ac209EmailRoutingEventLabelCountSchema.safeParse({
        label: 'dropped',
        count: 1,
        messageId: 'provider-owned',
      }).success,
    ).toBe(false);
  });

  it('exposes the one shared printable-label predicate', () => {
    expect(isVisibleAsciiStatus('dropped')).toBe(true);
    expect(isVisibleAsciiStatus('delivery failed')).toBe(true);
    for (const value of ['', 'a\nb', 'a\tb', 'a\u001bb', 'aéd'])
      expect(isVisibleAsciiStatus(value)).toBe(false);
  });

  it('carries a digest array rather than any raw identifier field', () => {
    const keys = Object.keys(
      Ac209EmailRoutingEventReportSchema.parse(baseReport).outcome,
    );
    expect(keys).toContain('messageIdDigests');
    expect(keys).toContain('messageIdDigestCoverage');
    expect(keys).not.toContain('messageIds');
    expect(keys).not.toContain('messageId');
    expect(keys).not.toContain('rows');
  });

  it('rejects a digest entry that is not a hex SHA-256', () => {
    for (const messageIdDigests of [
      ['provider-owned-identifier'],
      [''],
      ['A'.repeat(64)],
      ['b'.repeat(63)],
    ])
      expect(
        Ac209EmailRoutingEventReportSchema.safeParse({
          ...baseReport,
          outcome: { ...availableOutcome, messageIdDigests },
        }).success,
      ).toBe(false);
  });

  it('pins the digest coverage vocabulary so a partial set cannot read as absence', () => {
    for (const messageIdDigestCoverage of [
      'missing',
      'incomplete',
      'unknown',
      'complete_unsampled',
    ])
      expect(
        Ac209EmailRoutingEventReportSchema.safeParse({
          ...baseReport,
          outcome: { ...availableOutcome, messageIdDigestCoverage },
        }).success,
      ).toBe(false);
    for (const messageIdDigestCoverage of ['complete', 'partial'])
      expect(
        Ac209EmailRoutingEventReportSchema.safeParse({
          ...baseReport,
          outcome: { ...availableOutcome, messageIdDigestCoverage },
        }).success,
      ).toBe(true);
  });

  it('pins the sampling caveat and the observation provenance', () => {
    expect(
      Ac209EmailRoutingEventReportSchema.safeParse(baseReport).success,
    ).toBe(true);
    for (const sampling of ['exact', 'unsampled', 'not_sampled'])
      expect(
        Ac209EmailRoutingEventReportSchema.safeParse({
          ...baseReport,
          sampling,
        }).success,
      ).toBe(false);
    for (const observation of [
      'exact_per_event_rows',
      'proof_of_delivery',
      'provider_reported_grouped_totals',
    ])
      expect(
        Ac209EmailRoutingEventReportSchema.safeParse({
          ...baseReport,
          observation,
        }).success,
      ).toBe(false);
    // An unavailable outcome must be a closed code, never provider free text.
    for (const code of ['Permission denied', '', 'ok'])
      expect(
        Ac209EmailRoutingEventReportSchema.safeParse({
          ...baseReport,
          outcome: { status: 'unavailable', code },
        }).success,
      ).toBe(false);
  });

  it('pins the absence caveat so no report can assert the events did not occur', () => {
    // The dataset may be sampled and provider retention bounds apply, so even an
    // empty bounded hour is an observation about the returned rows, never proof
    // that the underlying routing events were absent.
    expect(
      Ac209EmailRoutingEventReportSchema.safeParse(baseReport).success,
    ).toBe(true);
    const withoutCaveat: Record<string, unknown> = { ...baseReport };
    delete withoutCaveat['underlyingEventAbsence'];
    expect(
      Ac209EmailRoutingEventReportSchema.safeParse(withoutCaveat).success,
    ).toBe(false);
    for (const underlyingEventAbsence of [
      'established',
      'absent',
      'no_events',
      'zero_events_confirmed',
      'proven_absent',
    ])
      expect(
        Ac209EmailRoutingEventReportSchema.safeParse({
          ...baseReport,
          underlyingEventAbsence,
        }).success,
      ).toBe(false);
  });

  it('carries the documented dataset-level sampling designation, not an invented field', () => {
    // Cloudflare documents sampling as a property of the dataset (the `Adaptive`
    // name plus its description) and documents no per-response numeric sampling
    // field for this dataset, so no such field is invented here.
    const shape = Ac209EmailRoutingEventReportSchema.shape;
    expect(Object.keys(shape)).not.toContain('sampleInterval');
    expect(Object.keys(shape)).not.toContain('samplingRate');
    expect(Object.keys(shape)).not.toContain('sampleRate');
    expect(AC209_EMAIL_ROUTING_EVENT_DATASET).toContain('Adaptive');
    expect(
      shape.sampling.safeParse('provider_may_sample_adaptive_dataset').success,
    ).toBe(true);
  });

  it('binds the artifact to the zone without retaining the zone id', () => {
    const shape = Ac209EmailRoutingEventReportSchema.shape;
    expect(Object.keys(shape)).toContain('zoneTagSha256');
    for (const zoneTagSha256 of [zoneId, '', 'not-a-digest', 'A'.repeat(64)])
      expect(
        Ac209EmailRoutingEventReportSchema.safeParse({
          ...baseReport,
          zoneTagSha256,
        }).success,
      ).toBe(false);
  });

  it('rejects an unexpected report key rather than ignoring it', () => {
    expect(
      Ac209EmailRoutingEventReportSchema.safeParse({
        ...baseReport,
        rawEvents: [],
      }).success,
    ).toBe(false);
    expect(
      Ac209EmailRoutingEventReportSchema.safeParse({
        ...baseReport,
        diagnosticOnly: false,
      }).success,
    ).toBe(false);
  });
});
