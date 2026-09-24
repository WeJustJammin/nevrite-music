import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AC209_EMAIL_PRESENCE_SCHEMA_VERSION } from '../infra/workflows/ac209-email-presence-contract.ts';
import { formatAc209EmailPresenceSummary } from '../infra/workflows/probe-production-ac209-email-presence.ts';

const report = (
  overrides: Readonly<Record<string, unknown>> = {},
): Parameters<typeof formatAc209EmailPresenceSummary>[0] =>
  ({
    schemaVersion: AC209_EMAIL_PRESENCE_SCHEMA_VERSION,
    diagnosticOnly: true,
    environment: 'production',
    sourceRevision: 'c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2',
    probedAt: '2026-09-24T12:00:00.000Z',
    windows: {
      last24Hours: {
        status: 'available',
        start: '2026-09-23T12:00:00.000Z',
        end: '2026-09-24T12:00:00.000Z',
        rowsReturned: 0,
        present: false,
      },
      last30Days: {
        status: 'available',
        start: '2026-08-25T12:00:00.000Z',
        end: '2026-09-24T12:00:00.000Z',
        rowsReturned: 0,
        present: false,
      },
    },
    alternateCandidate: { status: 'not_configured' },
    classification: 'zone_wide_missing',
    ...overrides,
  }) as Parameters<typeof formatAc209EmailPresenceSummary>[0];

describe('AC209 email presence probe entrypoint', () => {
  const entrypointUrl = new URL(
    '../infra/workflows/probe-production-ac209-email-presence.ts',
    import.meta.url,
  );

  it('logs only the closed classification and counts', () => {
    expect(formatAc209EmailPresenceSummary(report())).toBe(
      'AC209_EMAIL_PRESENCE_PROBE classification=zone_wide_missing recent24h=0 wide30d=0 alternate=not_configured',
    );
    expect(
      formatAc209EmailPresenceSummary(
        report({
          classification: 'provider_unavailable',
          windows: {
            last24Hours: {
              status: 'unavailable',
              code: 'provider_permission_denied',
            },
            last30Days: {
              status: 'unavailable',
              code: 'provider_request_failed',
            },
          },
        }),
      ),
    ).toBe(
      'AC209_EMAIL_PRESENCE_PROBE classification=provider_unavailable recent24h=unavailable(provider_permission_denied) wide30d=unavailable(provider_request_failed) alternate=not_configured',
    );
  });

  it('surfaces the optional alternate inventory as a closed value', () => {
    expect(
      formatAc209EmailPresenceSummary(
        report({
          alternateCandidate: {
            status: 'available',
            start: '2026-09-23T12:00:00.000Z',
            end: '2026-09-24T12:00:00.000Z',
            rowsReturned: 1,
            present: true,
          },
        }),
      ),
    ).toBe(
      'AC209_EMAIL_PRESENCE_PROBE classification=zone_wide_missing recent24h=0 wide30d=0 alternate=1',
    );
    expect(
      formatAc209EmailPresenceSummary(
        report({
          alternateCandidate: {
            status: 'unavailable',
            code: 'provider_resource_unavailable',
          },
        }),
      ),
    ).toBe(
      'AC209_EMAIL_PRESENCE_PROBE classification=zone_wide_missing recent24h=0 wide30d=0 alternate=unavailable(provider_resource_unavailable)',
    );
  });

  it('exits non-zero with a bounded code when required input is missing', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-presence-'));
    try {
      const probeRun = spawnSync(
        process.execPath,
        ['--experimental-strip-types', entrypointUrl.pathname],
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
        'AC209_EMAIL_PRESENCE_PROBE failed code=invalid_configuration',
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
        `await import(${JSON.stringify(entrypointUrl.href)}); process.stdout.write('AC209_PRESENCE_STRIP_IMPORT_OK\\n');`,
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
      stdout: 'AC209_PRESENCE_STRIP_IMPORT_OK\n',
    });
    expect(probeRun.stderr).not.toContain('ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX');
  });

  it('writes provider evidence only inside the workspace', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-presence-'));
    try {
      const probeRun = spawnSync(
        process.execPath,
        ['--experimental-strip-types', entrypointUrl.pathname],
        {
          cwd: workspace,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            AC209_PRESENCE_OUTPUT_PATH: '../../escaped.json',
          },
        },
      );

      expect(probeRun.status).toBe(1);
      expect(probeRun.stderr).toContain('AC209_EMAIL_PRESENCE_PROBE failed');
      expect(readdirSync(workspace)).toEqual([]);
      expect(existsSync(join(workspace, '..', '..', 'escaped.json'))).toBe(
        false,
      );
    } finally {
      rmSync(workspace, { force: true, recursive: true });
    }
  });

  it('maps an unset or empty alternate tag to not_configured without a request', () => {
    // The entrypoint is the boundary that turns an absent environment value
    // into "not supplied"; the schema itself still rejects a malformed tag.
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-presence-'));
    try {
      const probeRun = spawnSync(
        process.execPath,
        ['--experimental-strip-types', entrypointUrl.pathname],
        {
          cwd: workspace,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            CLOUDFLARE_EMAIL_ZONE_ID: '',
            CLOUDFLARE_OBSERVABILITY_API_TOKEN: '',
            SOURCE_REVISION: '',
            AC209_PRESENCE_ALTERNATE_ZONE_TAG: '',
          },
        },
      );

      // An empty tag is not treated as a malformed tag: the run still fails only
      // on the genuinely missing configuration, and no provider call happens.
      expect(probeRun.status).toBe(1);
      expect(probeRun.stderr).toContain('code=invalid_configuration');
      expect(probeRun.stderr).not.toContain('alternateZoneTag');
      expect(readdirSync(workspace)).toEqual([]);
    } finally {
      rmSync(workspace, { force: true, recursive: true });
    }
  });
});
