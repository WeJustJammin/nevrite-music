import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
  AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION,
  type Ac209EmailDatasetsProbeReport,
} from '../infra/workflows/ac209-email-routing-presence-contract.ts';
import { formatAc209EmailDatasetsSummary } from '../infra/workflows/probe-production-ac209-datasets.ts';

const sourceRevision = '5a23155a2296562cd3e3edf5b3b66f8a49c35a17';

const window = (rowsReturned: number) => ({
  status: 'available' as const,
  start: '2026-09-23T12:00:00.000Z',
  end: '2026-09-24T12:00:00.000Z',
  rowsReturned,
  present: rowsReturned > 0,
});

const unavailable = (code: string) => ({
  status: 'unavailable' as const,
  code,
});

const report = (
  overrides: Readonly<Record<string, unknown>> = {},
): Ac209EmailDatasetsProbeReport =>
  ({
    schemaVersion: AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION,
    diagnosticOnly: true,
    environment: 'production',
    sourceRevision,
    probedAt: '2026-09-24T12:00:00.000Z',
    sending: {
      schemaVersion: 'ac209-email-presence-v1',
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision,
      probedAt: '2026-09-24T12:00:00.000Z',
      windows: { last24Hours: window(0), last30Days: window(0) },
      alternateCandidate: { status: 'not_configured' },
      classification: 'zone_wide_missing',
    },
    routing: {
      schemaVersion: AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION,
      diagnosticOnly: true,
      environment: 'production',
      sourceRevision,
      probedAt: '2026-09-24T12:00:00.000Z',
      dataset: 'emailRoutingAdaptive',
      windows: { last24Hours: window(0), last30Days: window(0) },
      classification: 'zone_wide_missing',
    },
    ...overrides,
  }) as Ac209EmailDatasetsProbeReport;

describe('AC209 email datasets probe entrypoint', () => {
  it('logs both datasets as closed values', () => {
    expect(formatAc209EmailDatasetsSummary(report())).toBe(
      'AC209_EMAIL_DATASETS_PROBE sending_recent24h=0 sending_wide30d=0 sending=zone_wide_missing routing_recent24h=0 routing_wide30d=0 routing=zone_wide_missing',
    );
  });

  it('renders an unavailable dataset as its closed code, never as a count', () => {
    const summary = formatAc209EmailDatasetsSummary(
      report({
        routing: {
          schemaVersion: AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION,
          diagnosticOnly: true,
          environment: 'production',
          sourceRevision,
          probedAt: '2026-09-24T12:00:00.000Z',
          dataset: 'emailRoutingAdaptive',
          windows: {
            last24Hours: unavailable('provider_query_invalid'),
            last30Days: unavailable('provider_query_invalid'),
          },
          classification: 'provider_unavailable',
        },
      }),
    );

    expect(summary).toContain(
      'routing_recent24h=unavailable(provider_query_invalid)',
    );
    expect(summary).toContain('routing=provider_unavailable');
    // The sending half is untouched by the routing verdict.
    expect(summary).toContain('sending=zone_wide_missing');
  });

  it('exits non-zero with a bounded code when required input is missing', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-datasets-'));
    try {
      const probeRun = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          new URL(
            '../infra/workflows/probe-production-ac209-datasets.ts',
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
        'AC209_EMAIL_DATASETS_PROBE failed code=invalid_configuration',
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
            '../infra/workflows/probe-production-ac209-datasets.ts',
            import.meta.url,
          ).href,
        )}); process.stdout.write('AC209_DATASETS_STRIP_IMPORT_OK\\n');`,
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
      stdout: 'AC209_DATASETS_STRIP_IMPORT_OK\n',
    });
    expect(probeRun.stderr).not.toContain('ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX');
  });

  it('writes provider evidence only inside the workspace', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-datasets-'));
    try {
      const probeRun = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          new URL(
            '../infra/workflows/probe-production-ac209-datasets.ts',
            import.meta.url,
          ).pathname,
        ],
        {
          cwd: workspace,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            AC209_DATASETS_OUTPUT_PATH: '../../escaped.json',
          },
        },
      );

      expect(probeRun.status).toBe(1);
      expect(probeRun.stderr).toContain('AC209_EMAIL_DATASETS_PROBE failed');
      expect(readdirSync(workspace)).toEqual([]);
    } finally {
      rmSync(workspace, { force: true, recursive: true });
    }
  });
});
