import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION,
  Ac209EmailSendingGroupsReportSchema,
  type Ac209EmailSendingGroupsReport,
} from '../infra/workflows/ac209-email-sending-groups-contract.ts';
import { formatAc209EmailSendingGroupsSummary } from '../infra/workflows/probe-production-ac209-sending-groups.ts';

const sourceRevision = 'cb211a78dcf7fa55a253f614106ad31077f51f37';
const windowStart = '2026-09-22T20:00:00.000Z';
const windowEnd = '2026-09-22T21:00:00.000Z';

const digestOf = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const report = (
  overrides: Readonly<Record<string, unknown>> = {},
): Ac209EmailSendingGroupsReport =>
  ({
    schemaVersion: AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION,
    diagnosticOnly: true,
    environment: 'production',
    sourceRevision,
    probedAt: '2026-09-24T12:00:00.000Z',
    zoneTagSha256: 'b'.repeat(64),
    dataset: 'emailSendingAdaptiveGroups',
    window: {
      requestedStart: windowStart,
      requestedEnd: windowEnd,
      queriedStart: windowStart,
      queriedEnd: windowEnd,
    },
    granularity: 'utc_hour_bucket',
    hourRounded: false,
    groups: [],
    reportedTotalCount: 0,
    distinctHours: 0,
    pageComplete: true,
    sampling: 'provider_may_sample_adaptive_dataset',
    observation: 'provider_reported_grouped_totals',
    ...overrides,
  }) as Ac209EmailSendingGroupsReport;

describe('AC209 Email Sending groups entrypoint summary', () => {
  it('states the provenance, the sampling caveat, and the bounded counts', () => {
    expect(formatAc209EmailSendingGroupsSummary(report())).toBe(
      'AC209_EMAIL_SENDING_GROUPS observation=provider_reported_grouped_totals sampling=provider_may_sample_adaptive_dataset pageComplete=true zoneTagSha256=' +
        'b'.repeat(64) +
        ` granularity=utc_hour_bucket hourRounded=false requestedWindow=${windowStart}..${windowEnd} queriedWindow=${windowStart}..${windowEnd} distinctHours=0 reportedTotalCount=0 groupCount=0 groups=[]`,
    );
  });

  it('surfaces that a rounded window covers more than the requested span', () => {
    const summary = formatAc209EmailSendingGroupsSummary(
      report({
        window: {
          requestedStart: '2026-09-22T20:10:00.000Z',
          requestedEnd: '2026-09-22T20:50:00.000Z',
          queriedStart: '2026-09-22T20:00:00.000Z',
          queriedEnd: '2026-09-22T21:00:00.000Z',
        },
        hourRounded: true,
      }),
    );

    expect(summary).toContain('hourRounded=true');
    expect(summary).toContain(
      'requestedWindow=2026-09-22T20:10:00.000Z..2026-09-22T20:50:00.000Z',
    );
    expect(summary).toContain(
      'queriedWindow=2026-09-22T20:00:00.000Z..2026-09-22T21:00:00.000Z',
    );
  });

  it('renders grouped hour/status counts as bounded triples', () => {
    const summary = formatAc209EmailSendingGroupsSummary(
      report({
        groups: [
          {
            datetimeHour: '2026-09-22T20:00:00.000Z',
            statusSha256: digestOf('delivered'),
            count: 3,
          },
          {
            datetimeHour: '2026-09-22T21:00:00.000Z',
            statusSha256: digestOf('bounced'),
            count: 1,
          },
        ],
        reportedTotalCount: 4,
        distinctHours: 2,
      }),
    );

    expect(summary).toContain(
      `groups=[2026-09-22T20:00:00.000Z/${digestOf('delivered')}=3,2026-09-22T21:00:00.000Z/${digestOf('bounced')}=1]`,
    );
    expect(summary).toContain('distinctHours=2');
    expect(summary).toContain('reportedTotalCount=4');
    expect(summary).toContain('groupCount=2');
  });

  it('never renders provider label text, the window zone tag, or a message identifier', () => {
    const summary = formatAc209EmailSendingGroupsSummary(
      report({
        groups: [
          {
            datetimeHour: '2026-09-22T20:00:00.000Z',
            statusSha256: digestOf('##[injected]'),
            count: 1,
          },
        ],
        reportedTotalCount: 1,
        distinctHours: 1,
      }),
    );

    expect(summary).not.toContain('##[');
    expect(summary).not.toContain('injected');
    expect(summary).not.toContain('alerts.wejamm.in');
    expect(summary).not.toContain('@');
  });

  it('caps the rendered group triples so a wide window cannot flood the log', () => {
    const groups = Array.from({ length: 40 }, (_unused, index) => ({
      datetimeHour: '2026-09-22T20:00:00.000Z',
      statusSha256: digestOf(`status_${String(index)}`),
      count: 1,
    }));

    const summary = formatAc209EmailSendingGroupsSummary(
      report({ groups, reportedTotalCount: 40, distinctHours: 1 }),
    );

    expect(summary).toContain('groupCount=40');
    expect(summary).toContain('groups=[');
    expect(summary).toContain(',+16 more]');
    // 24 rendered triples plus the omission marker, not all 40.
    // 24 rendered triples plus the omission marker, not all 40.
    const renderedTriples = summary
      .slice(
        summary.indexOf('groups=[') + 'groups=['.length,
        summary.indexOf(',+16 more]'),
      )
      .split(',');
    expect(renderedTriples).toHaveLength(24);
  });
});

describe('AC209 Email Sending groups entrypoint', () => {
  it('fails closed with a bounded code and no provider text when unconfigured', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-groups-'));
    try {
      const probe = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          'infra/workflows/probe-production-ac209-sending-groups.ts',
        ],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            CLOUDFLARE_EMAIL_ZONE_ID: '',
            CLOUDFLARE_OBSERVABILITY_API_TOKEN: '',
            SOURCE_REVISION: '',
            AC209_DIAGNOSTIC_WINDOW_START: '',
            AC209_DIAGNOSTIC_WINDOW_END: '',
          },
        },
      );

      expect(probe.status).toBe(1);
      expect(probe.stderr).toContain(
        'AC209_EMAIL_SENDING_GROUPS failed code=invalid_configuration',
      );
      expect(probe.stdout).not.toContain('CLOUDFLARE');
    } finally {
      rmSync(workspace, { force: true, recursive: true });
    }
  });

  it('loads its full import graph under the strip-only runtime used in production', () => {
    const probe = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '--eval',
        `await import(${JSON.stringify(
          new URL(
            '../infra/workflows/probe-production-ac209-sending-groups.ts',
            import.meta.url,
          ).href,
        )}); process.stdout.write('AC209_GROUPS_STRIP_IMPORT_OK\\n');`,
      ],
      { encoding: 'utf8' },
    );

    expect({
      status: probe.status,
      stdout: probe.stdout,
    }).toEqual({ status: 0, stdout: 'AC209_GROUPS_STRIP_IMPORT_OK\n' });
  });

  it('rejects a report carrying a raw provider status label', () => {
    expect(
      Ac209EmailSendingGroupsReportSchema.safeParse(
        report({
          groups: [
            {
              datetimeHour: '2026-09-22T20:00:00.000Z',
              status: 'delivered',
              count: 1,
            },
          ],
        }),
      ).success,
    ).toBe(false);
  });
});
