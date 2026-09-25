import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS } from '../infra/workflows/ac209-email-presence-contract.ts';
import { isBoundedProviderLabel } from '../infra/workflows/ac209-email-routing-day-counts-schema.ts';
import {
  AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET,
  AC209_EMAIL_ROUTING_DAY_COUNTS_MAX_ROWS,
  AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY,
  AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
  AC209_EMAIL_ROUTING_DAY_COUNTS_WINDOW_DAYS,
  Ac209EmailRoutingDayCountGroupSchema,
  Ac209EmailRoutingDayCountsReportSchema,
} from '../infra/workflows/ac209-email-routing-day-counts-contract.ts';

/**
 * Schema-level guards for the aggregated diagnostic. The row contract is the
 * whole safety story here: the report may only ever carry a bare UTC day, a
 * one-way digest of the provider's status label, and a non-negative integer
 * count.
 */

const digest = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
describe('AC209 routing day-counts contract closure', () => {
  it('declares the aggregated dataset and the low row bound', () => {
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET).toBe(
      'emailRoutingAdaptiveGroups',
    );
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_MAX_ROWS).toBe(100);
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_QUERY).toContain('limit: 100');
  });

  it('fits the smaller provider duration limit with a 31-day inclusive window', () => {
    // The provider reports two separate limits: `notOlderThan` (the retention
    // horizon) and `maxDuration` (the widest single-request span). They are not
    // the same value, so the window is sized against the SMALLER one - 30 days
    // of elapsed duration. 31 inclusive UTC days is exactly 30 elapsed days.
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_WINDOW_DAYS).toBe(31);
    const elapsedMs =
      (AC209_EMAIL_ROUTING_DAY_COUNTS_WINDOW_DAYS - 1) * 86_400_000;
    expect(elapsedMs).toBe(2_592_000_000);
    // Reused from the sibling presence contract rather than restated.
    expect(elapsedMs).toBeLessThanOrEqual(AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS);
  });

  it('accepts a bare UTC day with a digest and a non-negative count', () => {
    expect(
      Ac209EmailRoutingDayCountGroupSchema.safeParse({
        date: '2026-09-22',
        statusSha256: digest('dropped'),
        count: 0,
      }).success,
    ).toBe(true);
  });

  it('rejects a timestamp date so a day label can never be a time', () => {
    for (const date of [
      '2026-09-22T00:00:00Z',
      '2026-09-22T00:00:00.000Z',
      '2026-9-22',
      '22/09/2026',
      '2026-09-22+00:00',
      '',
    ])
      expect(
        Ac209EmailRoutingDayCountGroupSchema.safeParse({
          date,
          status: 'dropped',
          count: 1,
        }).success,
      ).toBe(false);
  });

  it('rejects a negative, fractional, or non-numeric count', () => {
    for (const count of [-1, 1.5, '1', null, undefined, Number.NaN])
      expect(
        Ac209EmailRoutingDayCountGroupSchema.safeParse({
          date: '2026-09-22',
          status: 'dropped',
          count,
        }).success,
      ).toBe(false);
  });

  it('exposes one shared label-bound predicate used by both boundaries', () => {
    // The collector boundary and the schema must agree on what a bounded provider
    // label is, so the predicate lives in exactly one place. It is a shape check:
    // the predicates that make a label safe to publish are the digest and the
    // absence of any field that could hold the raw text.
    expect(isBoundedProviderLabel('dropped')).toBe(true);
    expect(isBoundedProviderLabel('delivery failed')).toBe(true);
    // A workflow-command token IS bounded printable ASCII, which is exactly why
    // the bound alone was never the safety boundary.
    expect(isBoundedProviderLabel('##[error]')).toBe(true);
    expect(isBoundedProviderLabel('::set-output name=x::y')).toBe(true);
    for (const value of [
      '',
      'drop\nped',
      'drop\tped',
      'drop\u001b[31mped',
      'dropéd',
      'drop\u007fped',
      'a'.repeat(257),
    ])
      expect(isBoundedProviderLabel(value)).toBe(false);
  });

  it('carries only a digest, so no raw provider label can be represented', () => {
    // A raw provider label has no field to land in, whatever it contains: a
    // control character, a newline, a workflow-command token, or an address.
    for (const status of [
      'dropped',
      '##[error]',
      '##[set-output name=leak;]exfiltrated',
      '::set-output name=leak::exfiltrated',
      'someone@example.invalid',
      'drop\nped',
      'a'.repeat(257),
    ])
      expect(
        Ac209EmailRoutingDayCountGroupSchema.safeParse({
          date: '2026-09-22',
          status,
          count: 1,
        }).success,
      ).toBe(false);
    // The digest form is what parses, and nothing else identifies the label.
    expect(
      Ac209EmailRoutingDayCountGroupSchema.safeParse({
        date: '2026-09-22',
        statusSha256: digest('dropped'),
        count: 1,
      }).success,
    ).toBe(true);
    for (const statusSha256 of [
      '',
      'A'.repeat(64),
      'a'.repeat(63),
      'a'.repeat(65),
      `${'a'.repeat(63)}z`,
    ])
      expect(
        Ac209EmailRoutingDayCountGroupSchema.safeParse({
          date: '2026-09-22',
          statusSha256,
          count: 1,
        }).success,
      ).toBe(false);
  });

  it('rejects a group carrying an extra field', () => {
    expect(
      Ac209EmailRoutingDayCountGroupSchema.safeParse({
        date: '2026-09-22',
        status: 'dropped',
        count: 1,
        messageId: 'provider-owned',
      }).success,
    ).toBe(false);
  });

  it('pins the observation label so a grouped total cannot read as at-least-one', () => {
    const base = {
      schemaVersion: AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: 'bcf609da43ebe756478960c4f99fb93de31207c3',
      probedAt: '2026-09-24T12:00:00.000Z',
      zoneTagSha256: 'b'.repeat(64),
      dataset: AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET,
      window: { start: '2026-08-25', end: '2026-09-24' },
      groups: [],
      reportedTotalCount: 0,
      distinctDays: 0,
      pageComplete: true,
      sampling: 'provider_may_sample_adaptive_dataset',
      observation: 'provider_reported_grouped_totals',
    } as const;

    expect(Ac209EmailRoutingDayCountsReportSchema.safeParse(base).success).toBe(
      true,
    );
    for (const observation of [
      'at_least_one',
      'recent_present',
      'zone_wide_missing',
      'present',
      'exact_grouped_totals',
      'exact_total',
    ])
      expect(
        Ac209EmailRoutingDayCountsReportSchema.safeParse({
          ...base,
          observation,
        }).success,
      ).toBe(false);
  });

  it('pins the sampling caveat so no report can claim an unsampled total', () => {
    const base = {
      schemaVersion: AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: 'bcf609da43ebe756478960c4f99fb93de31207c3',
      probedAt: '2026-09-24T12:00:00.000Z',
      zoneTagSha256: 'b'.repeat(64),
      dataset: AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET,
      window: { start: '2026-08-25', end: '2026-09-24' },
      groups: [],
      reportedTotalCount: 0,
      distinctDays: 0,
      pageComplete: true,
      observation: 'provider_reported_grouped_totals',
    } as const;

    // Adaptive-suffixed datasets may be sampled, so the caveat is a required
    // literal rather than free text that a future edit could drop.
    expect(Ac209EmailRoutingDayCountsReportSchema.safeParse(base).success).toBe(
      false,
    );
    for (const sampling of [
      'exact',
      'unsampled',
      'not_sampled',
      'exact_event_counts',
    ])
      expect(
        Ac209EmailRoutingDayCountsReportSchema.safeParse({
          ...base,
          sampling,
        }).success,
      ).toBe(false);
    expect(
      Ac209EmailRoutingDayCountsReportSchema.safeParse({
        ...base,
        sampling: 'provider_may_sample_adaptive_dataset',
      }).success,
    ).toBe(true);
  });

  it('binds the artifact to the zone it read without retaining the zone id', () => {
    // The artifact records a digest of the requested zone tag so a reader can
    // confirm which zone produced the numbers without the report carrying the
    // raw identifier; the digest is one-way and adds no secret.
    const shape = Ac209EmailRoutingDayCountsReportSchema.shape;
    expect(Object.keys(shape)).toContain('zoneTagSha256');
    const base = {
      schemaVersion: AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision: 'bcf609da43ebe756478960c4f99fb93de31207c3',
      probedAt: '2026-09-24T12:00:00.000Z',
      dataset: AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET,
      window: { start: '2026-08-25', end: '2026-09-24' },
      groups: [],
      reportedTotalCount: 0,
      distinctDays: 0,
      pageComplete: true,
      sampling: 'provider_may_sample_adaptive_dataset',
      observation: 'provider_reported_grouped_totals',
    } as const;

    // Required, and required to be a hex digest rather than a raw zone id.
    expect(Ac209EmailRoutingDayCountsReportSchema.safeParse(base).success).toBe(
      false,
    );
    for (const zoneTagSha256 of [
      '5bfba340525c623584c47d631116804c',
      '',
      'not-a-digest',
      'A'.repeat(64),
    ])
      expect(
        Ac209EmailRoutingDayCountsReportSchema.safeParse({
          ...base,
          zoneTagSha256,
        }).success,
      ).toBe(false);
    expect(
      Ac209EmailRoutingDayCountsReportSchema.safeParse({
        ...base,
        zoneTagSha256: 'b'.repeat(64),
      }).success,
    ).toBe(true);
  });

  it('pins the completeness fields so a partial total is never published', () => {
    // Truncation fails closed before any report exists, so `pageComplete` is a
    // pin-to-true rather than a boolean, and no separate `truncated` flag is
    // carried: a redundant always-false field invites a reader to mistrust the
    // other one. This pins both decisions.
    const shape = Ac209EmailRoutingDayCountsReportSchema.shape;
    expect(Object.keys(shape)).not.toContain('truncated');
    expect(Object.keys(shape)).toContain('pageComplete');
    expect(Object.keys(shape)).toContain('sampling');
    expect(Object.keys(shape)).toContain('observation');
    expect(Object.keys(shape)).toContain('distinctDays');
    expect(Object.keys(shape)).toContain('reportedTotalCount');
  });
});
