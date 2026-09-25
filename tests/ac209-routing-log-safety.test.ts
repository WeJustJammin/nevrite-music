import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
  Ac209EmailRoutingEventLabelCountSchema,
  Ac209EmailRoutingEventReportSchema,
} from '../infra/workflows/ac209-email-routing-event-contract.ts';
import {
  AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
  Ac209EmailRoutingDayCountGroupSchema,
} from '../infra/workflows/ac209-email-routing-day-counts-contract.ts';
import { boundedFailureCode } from '../infra/workflows/ac209-email-log-safety.ts';
import { collectAc209EmailRoutingEvents } from '../infra/workflows/ac209-email-routing-event.ts';
import { collectAc209EmailRoutingDayCounts } from '../infra/workflows/ac209-email-routing-day-counts.ts';
import { formatAc209EmailRoutingEventSummary } from '../infra/workflows/probe-production-ac209-routing-events.ts';
import { formatAc209EmailRoutingDayCountsSummary } from '../infra/workflows/probe-production-ac209-routing-day-counts.ts';

const zoneId = '5bfba340525c623584c47d631116804c';
const sourceRevision = '20338c72ef9f5924f5f2a7ce82c12122aa84c46a';
const token = 'observability-token-that-must-never-be-emitted';
const probedAtMs = Date.parse('2026-09-24T12:00:00Z');
const windowStart = '2026-09-22T20:00:00.000Z';
const windowEnd = '2026-09-22T20:59:59.000Z';

/** The literal `##[` token is the legacy workflow-command prefix. */
const LEGACY_COMMAND_LABEL = '##[set-output name=leak;]exfiltrated';
const LEGACY_ERROR_LABEL = '##[error]';
const MODERN_COMMAND_LABEL = '::set-output name=leak::exfiltrated';
/** A provider label is not guaranteed free of personal data. */
const PII_LABEL = 'someone@example.invalid';

const digestOf = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const response = (payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
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

const eventStub = (rows: readonly unknown[]) => {
  const fetchImpl = vi.fn<typeof fetch>();
  fetchImpl.mockResolvedValueOnce(
    response({
      data: { viewer: { zones: [{ emailRoutingAdaptive: rows }] } },
      errors: null,
    }),
  );
  return fetchImpl;
};

const dayCountStub = (rows: readonly unknown[]) => {
  const fetchImpl = vi.fn<typeof fetch>();
  fetchImpl.mockResolvedValueOnce(
    response({
      data: { viewer: { zones: [{ emailRoutingAdaptiveGroups: rows }] } },
      errors: null,
    }),
  );
  return fetchImpl;
};

const collectEvents = (rows: readonly unknown[]) =>
  collectAc209EmailRoutingEvents({
    zoneId,
    token,
    sourceRevision,
    start: windowStart,
    end: windowEnd,
    fetchImpl: eventStub(rows),
    now: () => probedAtMs,
  });

const collectDayCounts = (rows: readonly unknown[]) =>
  collectAc209EmailRoutingDayCounts({
    zoneId,
    token,
    sourceRevision,
    fetchImpl: dayCountStub(rows),
    now: () => probedAtMs,
  });

const groupedRow = (date: string, status: string, count: number) => ({
  count,
  dimensions: { date, status },
});

/** A workflow log is scanned for commands, so no surface may carry one. */
const expectNoWorkflowCommand = (surface: string): void => {
  expect(surface).not.toContain('##[');
  expect(surface).not.toContain('::');
  expect(surface).not.toContain('set-output');
  expect(surface).toMatch(/^[\x20-\x7e]*$/u);
};

describe('AC209 routing log safety', () => {
  it('keeps a legacy workflow-command label out of the event surfaces', async () => {
    const report = await collectEvents([
      eventRow({ status: LEGACY_ERROR_LABEL, action: LEGACY_COMMAND_LABEL }),
    ]);
    const summary = formatAc209EmailRoutingEventSummary(report);

    for (const surface of [summary, JSON.stringify(report)])
      expectNoWorkflowCommand(surface);
    // The label is bounded rather than dropped: the digest keeps the tally
    // comparable against a report an operator can hash a candidate label for.
    expect(summary).toContain(
      `statusCounts=[${digestOf(LEGACY_ERROR_LABEL)}=1]`,
    );
    expect(summary).toContain(
      `actionCounts=[${digestOf(LEGACY_COMMAND_LABEL)}=1]`,
    );
  });

  it('keeps a modern workflow-command label out of the event surfaces', async () => {
    const report = await collectEvents([
      eventRow({ status: MODERN_COMMAND_LABEL, action: MODERN_COMMAND_LABEL }),
    ]);

    for (const surface of [
      formatAc209EmailRoutingEventSummary(report),
      JSON.stringify(report),
    ])
      expectNoWorkflowCommand(surface);
  });

  it('keeps a personal-data label out of the event surfaces', async () => {
    const report = await collectEvents([
      eventRow({ status: PII_LABEL, action: PII_LABEL }),
    ]);

    for (const surface of [
      formatAc209EmailRoutingEventSummary(report),
      JSON.stringify(report),
    ]) {
      expect(surface).not.toContain(PII_LABEL);
      expect(surface).not.toContain('someone@');
      expect(surface).not.toContain('example.invalid');
    }
  });

  it('keeps a legacy workflow-command label out of the day-counts surfaces', async () => {
    const report = await collectDayCounts([
      groupedRow('2026-09-22', LEGACY_COMMAND_LABEL, 2),
    ]);
    const summary = formatAc209EmailRoutingDayCountsSummary(report);

    for (const surface of [summary, JSON.stringify(report)])
      expectNoWorkflowCommand(surface);
    expect(summary).toContain(
      `groups=[2026-09-22/${digestOf(LEGACY_COMMAND_LABEL)}=2]`,
    );
  });

  it('keeps a personal-data label out of the day-counts surfaces', async () => {
    const report = await collectDayCounts([
      groupedRow('2026-09-22', PII_LABEL, 1),
    ]);

    for (const surface of [
      formatAc209EmailRoutingDayCountsSummary(report),
      JSON.stringify(report),
    ]) {
      expect(surface).not.toContain(PII_LABEL);
      expect(surface).not.toContain('someone@');
    }
  });

  it('preserves label distinctness and reproducibility through the digest', async () => {
    const report = await collectEvents([
      eventRow({ status: 'dropped', messageId: 'a' }),
      eventRow({ status: PII_LABEL, messageId: 'b' }),
      eventRow({ status: 'dropped', messageId: 'c' }),
    ]);
    if (report.outcome.status !== 'available') throw new Error('unreachable');

    // Ordered by descending count, then digest, so the artifact is deterministic.
    expect(report.outcome.statusCounts).toEqual([
      { labelSha256: digestOf('dropped'), count: 2 },
      { labelSha256: digestOf(PII_LABEL), count: 1 },
    ]);
    expect(
      report.outcome.statusCounts.map((entry) => entry.labelSha256),
    ).toEqual([
      ...new Set(report.outcome.statusCounts.map((entry) => entry.labelSha256)),
    ]);

    // The same label produces the same digest in a later report, which is what
    // makes two reports comparable without either one retaining provider text.
    const repeat = await collectDayCounts([
      groupedRow('2026-09-22', PII_LABEL, 1),
    ]);
    expect(repeat.groups[0]?.statusSha256).toBe(digestOf(PII_LABEL));
  });

  it('cannot represent a raw provider label in either artifact schema', () => {
    const digest = digestOf('dropped');

    // A raw label is not "accepted and kept"; it has no field to land in.
    expect(
      Ac209EmailRoutingEventLabelCountSchema.safeParse({
        label: 'dropped',
        count: 1,
      }).success,
    ).toBe(false);
    expect(
      Ac209EmailRoutingDayCountGroupSchema.safeParse({
        date: '2026-09-22',
        status: 'dropped',
        count: 1,
      }).success,
    ).toBe(false);
    expect(
      Ac209EmailRoutingEventLabelCountSchema.safeParse({
        labelSha256: digest,
        count: 1,
      }).success,
    ).toBe(true);
    expect(
      Ac209EmailRoutingDayCountGroupSchema.safeParse({
        date: '2026-09-22',
        statusSha256: digest,
        count: 1,
      }).success,
    ).toBe(true);

    // A report that carries raw provider text anywhere fails as a whole.
    expect(
      Ac209EmailRoutingEventReportSchema.safeParse({
        schemaVersion: AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        probedAt: '2026-09-24T12:00:00.000Z',
        zoneTagSha256: 'b'.repeat(64),
        dataset: 'emailRoutingAdaptive',
        window: { start: windowStart, end: windowEnd },
        outcome: {
          status: 'available',
          rowsReturned: 1,
          withinWindowRows: 1,
          outsideWindowRows: 0,
          uniqueMessageIds: 1,
          messageIdsMissing: 0,
          finalEventRows: 1,
          statusCounts: [{ label: LEGACY_ERROR_LABEL, count: 1 }],
          actionCounts: [],
          messageIdDigests: [],
          messageIdDigestCoverage: 'complete',
        },
        sampling: 'provider_may_sample_adaptive_dataset',
        observation: 'provider_reported_per_event_rows',
        underlyingEventAbsence: 'not_established',
      }).success,
    ).toBe(false);

    // The version moves with the shape, so a reader cannot mistake a digest
    // artifact for the earlier raw-label one.
    expect(AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION).toBe(
      'ac209-email-routing-event-v2',
    );
    expect(AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION).toBe(
      'ac209-email-routing-day-counts-v2',
    );
  });

  it('bounds the failure line to the closed code vocabulary', () => {
    expect(boundedFailureCode({ code: 'invalid_configuration' })).toBe(
      'invalid_configuration',
    );
    expect(boundedFailureCode({ code: LEGACY_ERROR_LABEL })).toBe(
      'unexpected_failure',
    );
    expect(boundedFailureCode({ code: MODERN_COMMAND_LABEL })).toBe(
      'unexpected_failure',
    );
    expect(boundedFailureCode(new Error('boom'))).toBe('unexpected_failure');
    expect(boundedFailureCode({ code: 42 })).toBe('unexpected_failure');
    expect(boundedFailureCode(undefined)).toBe('unexpected_failure');
  });
});
