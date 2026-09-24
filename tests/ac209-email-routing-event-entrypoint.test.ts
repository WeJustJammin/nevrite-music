import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
  type Ac209EmailRoutingEventReport,
} from '../infra/workflows/ac209-email-routing-event-contract.ts';
import { formatAc209EmailRoutingEventSummary } from '../infra/workflows/probe-production-ac209-routing-events.ts';

const sourceRevision = '20338c72ef9f5924f5f2a7ce82c12122aa84c46a';
const entrypointPath = new URL(
  '../infra/workflows/probe-production-ac209-routing-events.ts',
  import.meta.url,
).pathname;

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

const report = (
  overrides: Readonly<Record<string, unknown>> = {},
): Ac209EmailRoutingEventReport =>
  ({
    schemaVersion: AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
    diagnosticOnly: true,
    environment: 'production',
    sourceRevision,
    probedAt: '2026-09-24T12:00:00.000Z',
    zoneTagSha256: 'b'.repeat(64),
    dataset: 'emailRoutingAdaptive',
    window: {
      start: '2026-09-22T20:00:00.000Z',
      end: '2026-09-22T20:59:59.000Z',
    },
    outcome: availableOutcome,
    sampling: 'provider_may_sample_adaptive_dataset',
    observation: 'provider_reported_per_event_rows',
    underlyingEventAbsence: 'not_established',
    ...overrides,
  }) as Ac209EmailRoutingEventReport;

describe('AC209 routing event entrypoint', () => {
  it('states the provenance, caveat, and bounded counts for an empty hour', () => {
    expect(formatAc209EmailRoutingEventSummary(report())).toBe(
      'AC209_EMAIL_ROUTING_EVENTS observation=provider_reported_per_event_rows ' +
        'sampling=provider_may_sample_adaptive_dataset ' +
        'dataset=emailRoutingAdaptive zoneTagSha256=' +
        'b'.repeat(64) +
        ' window=2026-09-22T20:00:00.000Z..2026-09-22T20:59:59.000Z ' +
        'underlyingEventAbsence=not_established ' +
        'outcome=available rowsReturned=0 withinWindowRows=0 ' +
        'outsideWindowRows=0 uniqueMessageIds=0 messageIdsMissing=0 ' +
        'digestCoverage=complete finalEventRows=0 statusCounts=[] actionCounts=[]',
    );
  });

  it('renders the provider label distributions as bounded pairs', () => {
    const summary = formatAc209EmailRoutingEventSummary(
      report({
        outcome: {
          ...availableOutcome,
          rowsReturned: 4,
          withinWindowRows: 4,
          uniqueMessageIds: 3,
          messageIdsMissing: 1,
          messageIdDigestCoverage: 'partial',
          finalEventRows: 1,
          statusCounts: [
            { label: 'dropped', count: 3 },
            { label: 'delivered', count: 1 },
          ],
          actionCounts: [{ label: 'drop', count: 4 }],
        },
      }),
    );

    expect(summary).toContain('statusCounts=[dropped=3,delivered=1]');
    expect(summary).toContain('actionCounts=[drop=4]');
    expect(summary).toContain('digestCoverage=partial');
    // The line reports an observation of one dataset, never a delivery claim.
    expect(summary).not.toContain('delivered=true');
    expect(summary).not.toContain('exact');
    expect(summary).not.toContain('confirmed');
  });

  it('reports a closed code instead of any provider detail when unavailable', () => {
    const summary = formatAc209EmailRoutingEventSummary(
      report({
        outcome: { status: 'unavailable', code: 'provider_permission_denied' },
      }),
    );

    expect(summary).toContain(
      'outcome=unavailable(provider_permission_denied)',
    );
    expect(summary).not.toContain('rowsReturned');
    expect(summary).not.toContain('statusCounts');
  });

  it('never prints message-identifier digests or any identifier material', () => {
    const digest = 'c'.repeat(64);
    const summary = formatAc209EmailRoutingEventSummary(
      report({
        outcome: {
          ...availableOutcome,
          withinWindowRows: 1,
          rowsReturned: 1,
          uniqueMessageIds: 1,
          messageIdDigests: [digest],
        },
      }),
    );

    // Digests stay in the retained artifact: a CI log line is a weaker boundary
    // than a seven-day artifact, so the identifier material does not go there.
    expect(summary).not.toContain(digest);
    expect(summary).not.toMatch(/messageId=[^D]/u);
  });

  it('exits non-zero with a bounded code when required input is missing', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-routing-events-'));
    try {
      const probeRun = spawnSync(
        process.execPath,
        ['--experimental-strip-types', entrypointPath],
        {
          cwd: workspace,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            CLOUDFLARE_EMAIL_ZONE_ID: '',
            CLOUDFLARE_OBSERVABILITY_API_TOKEN: '',
            SOURCE_REVISION: '',
            AC209_ROUTING_EVENT_WINDOW_START: '',
            AC209_ROUTING_EVENT_WINDOW_END: '',
          },
        },
      );

      expect(probeRun.status).toBe(1);
      expect(probeRun.stdout).toBe('');
      expect(probeRun.stderr).toContain(
        'AC209_EMAIL_ROUTING_EVENTS failed code=invalid_configuration',
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
            '../infra/workflows/probe-production-ac209-routing-events.ts',
            import.meta.url,
          ).href,
        )}); process.stdout.write('AC209_ROUTING_EVENTS_STRIP_IMPORT_OK\\n');`,
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
      stdout: 'AC209_ROUTING_EVENTS_STRIP_IMPORT_OK\n',
    });
    expect(probeRun.stderr).not.toContain('ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX');
  });

  it('writes provider evidence only inside the workspace', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-routing-events-'));
    try {
      const probeRun = spawnSync(
        process.execPath,
        ['--experimental-strip-types', entrypointPath],
        {
          cwd: workspace,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            AC209_ROUTING_EVENT_OUTPUT_PATH: '../../escaped.json',
          },
        },
      );

      expect(probeRun.status).toBe(1);
      expect(probeRun.stderr).toContain('AC209_EMAIL_ROUTING_EVENTS failed');
      expect(readdirSync(workspace)).toEqual([]);
    } finally {
      rmSync(workspace, { force: true, recursive: true });
    }
  });
});
