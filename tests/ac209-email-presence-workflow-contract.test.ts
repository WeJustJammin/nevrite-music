import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AC209_EMAIL_PRESENCE_SCHEMA_VERSION } from '../infra/workflows/ac209-email-presence-contract.ts';
import { formatAc209EmailPresenceSummary } from '../infra/workflows/probe-production-ac209-email-presence.ts';

const workflow = readFileSync(
  new URL(
    '../.github/workflows/probe-production-ac209-email-presence.yml',
    import.meta.url,
  ),
  'utf8',
);

const header = workflow.slice(0, workflow.indexOf('\njobs:'));
const probe = workflow.match(/\n\s{2}probe:\n[\s\S]*$/u)?.[0] ?? '';

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
    classification: 'zone_wide_missing',
    ...overrides,
  }) as Parameters<typeof formatAc209EmailPresenceSummary>[0];

describe('production AC209 email presence probe workflow contract', () => {
  it('is an explicit confirmed main-only manual probe', () => {
    expect(header).toContain('workflow_dispatch:');
    expect(header).not.toMatch(
      /\n\s+(schedule|push|pull_request|workflow_run|release):/u,
    );
    expect(header).toMatch(
      /source_revision:\n\s+description:[\s\S]*?required: true\n\s+type: string/u,
    );
    expect(header).toMatch(
      /confirm_presence_probe:\n\s+description:[\s\S]*?required: true\n\s+type: boolean\n\s+default: false/u,
    );
    expect(workflow).toMatch(
      /if: inputs\.confirm_presence_probe == true && github\.ref == 'refs\/heads\/main'/u,
    );
    expect(workflow).toContain(
      'concurrency:\n  group: probe-production-ac209-email-presence\n  cancel-in-progress: false',
    );
    expect(workflow).toContain('permissions: { contents: read }');
    expect(workflow).not.toMatch(/id-token:\s*write/u);
    expect(workflow).not.toMatch(/actions:\s*write/u);
  });

  it('verifies the dispatched revision before any protected secret is read', () => {
    expect(workflow).toMatch(/actions\/checkout@[0-9a-f]{40}/u);
    expect(workflow).toContain('ref: ${{ inputs.source_revision }}');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain(
      'test "$SOURCE_REVISION" = "$DISPATCHED_SOURCE_SHA"',
    );
    expect(workflow).toContain('checked_out_sha="$(git rev-parse HEAD)"');
    expect(workflow).toContain(
      'test "$checked_out_sha" = "$EXPECTED_SOURCE_REVISION"',
    );
    expect(workflow).toContain('git diff --quiet');
    expect(workflow).toContain('git diff --cached --quiet');
    expect(workflow).toContain(
      'test -z "$(git status --porcelain --untracked-files=all)"',
    );
    const secretIndex = workflow.indexOf('CLOUDFLARE_OBSERVABILITY_API_TOKEN:');
    expect(
      workflow.indexOf('Set up pinned workspace dependencies'),
    ).toBeLessThan(
      workflow.indexOf('Reverify immutable workspace before secret use'),
    );
    expect(
      workflow.indexOf('Reverify immutable workspace before secret use'),
    ).toBeLessThan(secretIndex);
  });

  it('uses only the protected production environment and its read-only credentials', () => {
    expect(workflow).toContain('environment: { name: production }');
    expect(workflow).toContain('runs-on: [self-hosted, wejammin]');
    expect(workflow).toMatch(/\n\s{2}probe:\n\s+needs: preflight/u);
    expect(probe).toContain(
      "CLOUDFLARE_EMAIL_ZONE_ID: '${{ vars.CLOUDFLARE_EMAIL_ZONE_ID }}'",
    );
    expect(probe).toContain(
      "CLOUDFLARE_OBSERVABILITY_API_TOKEN: '${{ secrets.CLOUDFLARE_OBSERVABILITY_API_TOKEN }}'",
    );
    expect(
      workflow.match(
        /\$\{\{ secrets\.CLOUDFLARE_OBSERVABILITY_API_TOKEN \}\}/gu,
      ),
    ).toHaveLength(1);
    expect(workflow).not.toMatch(/secrets\.CLOUDFLARE_API_TOKEN/u);
    expect(workflow).not.toMatch(/secrets\.CLOUDFLARE_QUEUE_EXERCISE_TOKEN/u);
    expect(workflow).not.toMatch(/SUPABASE_/u);
    expect(header).not.toMatch(/secrets\./u);
  });

  it('runs only the bounded read-only presence entrypoint', () => {
    expect(workflow).toContain(
      'run: node --experimental-strip-types infra/workflows/probe-production-ac209-email-presence.ts',
    );
    expect(workflow).not.toMatch(/exercise-production-ac209/u);
    expect(workflow).not.toMatch(/cleanup-production-ac209/u);
    expect(workflow).not.toMatch(/diagnose-production-ac209-email\.ts/u);
    expect(workflow).not.toMatch(/wrangler deploy/u);
    expect(workflow).not.toMatch(/apply-hosted-migrations/u);
    expect(workflow).not.toMatch(/deploy-api-worker/u);
    expect(workflow).not.toMatch(/gh workflow run/u);
    expect(workflow).not.toMatch(/queue/iu);
  });

  it('retains only the bounded redacted presence artifact', () => {
    expect(workflow).toContain(
      'AC209_PRESENCE_OUTPUT_PATH: ac209-presence/presence.json',
    );
    const upload = workflow.match(
      /- name: Upload redacted AC209 email presence probe[\s\S]*$/u,
    )?.[0];
    expect(upload).toBeDefined();
    expect(upload).toContain('if: always()');
    expect(upload).toMatch(/uses: actions\/upload-artifact@[0-9a-f]{40}/u);
    expect(upload).toContain('path: ac209-presence/presence.json');
    expect(upload).toContain('if-no-files-found: warn');
    expect(upload).toContain('retention-days: 7');
    expect(upload).not.toMatch(/path:\s+ac209-presence\s*$/mu);
  });

  it('never claims AC209 acceptance from a presence probe', () => {
    for (const source of [workflow, header, probe]) {
      expect(source).not.toMatch(/acceptance/u);
      expect(source).not.toMatch(
        /(?:marks?|closes?)\s+(?:AC209|the criterion)/iu,
      );
      expect(source).not.toMatch(/verified|waived|simulated/iu);
    }
  });
});

describe('AC209 email presence probe entrypoint', () => {
  const entrypointUrl = new URL(
    '../infra/workflows/probe-production-ac209-email-presence.ts',
    import.meta.url,
  );

  it('logs only the closed classification and counts', () => {
    expect(formatAc209EmailPresenceSummary(report())).toBe(
      'AC209_EMAIL_PRESENCE_PROBE classification=zone_wide_missing recent24h=0 wide30d=0',
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
      'AC209_EMAIL_PRESENCE_PROBE classification=provider_unavailable recent24h=unavailable(provider_permission_denied) wide30d=unavailable(provider_request_failed)',
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
});
