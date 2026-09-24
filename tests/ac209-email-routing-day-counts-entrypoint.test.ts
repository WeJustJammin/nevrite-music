import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
  type Ac209EmailRoutingDayCountsReport,
} from '../infra/workflows/ac209-email-routing-day-counts-contract.ts';
import { formatAc209EmailRoutingDayCountsSummary } from '../infra/workflows/probe-production-ac209-routing-day-counts.ts';

const sourceRevision = 'bcf609da43ebe756478960c4f99fb93de31207c3';

const report = (
  overrides: Readonly<Record<string, unknown>> = {},
): Ac209EmailRoutingDayCountsReport =>
  ({
    schemaVersion: AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION,
    diagnosticOnly: true,
    environment: 'production',
    sourceRevision,
    probedAt: '2026-09-24T12:00:00.000Z',
    dataset: 'emailRoutingAdaptiveGroups',
    window: { start: '2026-08-25', end: '2026-09-24' },
    groups: [],
    reportedTotalCount: 0,
    distinctDays: 0,
    pageComplete: true,
    sampling: 'provider_may_sample_adaptive_dataset',
    observation: 'provider_reported_grouped_totals',
    zoneTagSha256: 'b'.repeat(64),
    ...overrides,
  }) as Ac209EmailRoutingDayCountsReport;

describe('AC209 routing day-counts entrypoint', () => {
  it('states the provider-reported observation and the bounded counts', () => {
    expect(formatAc209EmailRoutingDayCountsSummary(report())).toBe(
      'AC209_EMAIL_ROUTING_DAY_COUNTS observation=provider_reported_grouped_totals sampling=provider_may_sample_adaptive_dataset pageComplete=true zoneTagSha256=' +
        'b'.repeat(64) +
        ' window=2026-08-25..2026-09-24 distinctDays=0 reportedTotalCount=0 groupCount=0 groups=[]',
    );
  });

  it('renders grouped day/status counts as bounded triples', () => {
    const summary = formatAc209EmailRoutingDayCountsSummary(
      report({
        groups: [
          { date: '2026-09-22', status: 'dropped', count: 1 },
          { date: '2026-08-30', status: 'forwarded', count: 7 },
        ],
        reportedTotalCount: 8,
        distinctDays: 2,
      }),
    );

    expect(summary).toContain('distinctDays=2');
    expect(summary).toContain('reportedTotalCount=8');
    expect(summary).toContain('sampling=provider_may_sample_adaptive_dataset');
    expect(summary).toContain(
      'groups=[2026-09-22/dropped=1,2026-08-30/forwarded=7]',
    );
    // The events probe reports at-least-one; this artifact must never claim it.
    expect(summary).not.toContain('recent24h');
    expect(summary).not.toContain('wide30d');
    // Nor may it claim an unsampled exact total.
    expect(summary).not.toContain('exact');
  });

  it('exits non-zero with a bounded code when required input is missing', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-daycounts-'));
    try {
      const probeRun = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          new URL(
            '../infra/workflows/probe-production-ac209-routing-day-counts.ts',
            import.meta.url,
          ).pathname,
        ],
        {
          cwd: workspace,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            CLOUDFLARE_EMAIL_ZONE_ID: '',
            CLOUDFLARE_OBSERVABILITY_API_TOKEN: '',
            SOURCE_REVISION: '',
          },
        },
      );

      expect(probeRun.status).toBe(1);
      expect(probeRun.stdout).toBe('');
      expect(probeRun.stderr).toContain(
        'AC209_EMAIL_ROUTING_DAY_COUNTS failed code=invalid_configuration',
      );
      expect(readdirSync(workspace)).toEqual([]);
    } finally {
      rmSync(workspace, { force: true, recursive: true });
    }
  });

  it('loads its full import graph under the strip-only Node runtime used in production', () => {
    const probeRun = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '--eval',
        `await import(${JSON.stringify(
          new URL(
            '../infra/workflows/probe-production-ac209-routing-day-counts.ts',
            import.meta.url,
          ).href,
        )}); process.stdout.write('AC209_DAY_COUNTS_STRIP_IMPORT_OK\\n');`,
      ],
      { encoding: 'utf8' },
    );

    expect({
      status: probeRun.status,
      signal: probeRun.signal,
      stdout: probeRun.stdout,
    }).toEqual({
      status: 0,
      signal: null,
      stdout: 'AC209_DAY_COUNTS_STRIP_IMPORT_OK\n',
    });
    expect(probeRun.stderr).not.toContain('ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX');
  });

  it('writes provider evidence only inside the workspace', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-daycounts-'));
    try {
      const probeRun = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          new URL(
            '../infra/workflows/probe-production-ac209-routing-day-counts.ts',
            import.meta.url,
          ).pathname,
        ],
        {
          cwd: workspace,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            AC209_ROUTING_DAY_COUNTS_OUTPUT_PATH: '../../escaped.json',
          },
        },
      );

      expect(probeRun.status).toBe(1);
      expect(probeRun.stderr).toContain(
        'AC209_EMAIL_ROUTING_DAY_COUNTS failed',
      );
      expect(readdirSync(workspace)).toEqual([]);
    } finally {
      rmSync(workspace, { force: true, recursive: true });
    }
  });
});
