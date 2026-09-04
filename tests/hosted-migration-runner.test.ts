import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const migrationRunner = fileURLToPath(
  new URL('../infra/workflows/apply-hosted-migrations.sh', import.meta.url),
);
const evidenceVerifier = fileURLToPath(
  new URL(
    '../infra/workflows/verify-staging-migration-evidence.mjs',
    import.meta.url,
  ),
);
const temporaryRoots: string[] = [];

const createSandbox = (versions = ['20260903120000', '20260904120000']) => {
  const root = mkdtempSync(join(tmpdir(), 'wejammin-hosted-migration-'));
  const bin = join(root, 'bin');
  const calls = join(root, 'calls.log');
  const evidence = join(root, 'staging-migration-evidence.json');
  mkdirSync(join(root, 'supabase/migrations'), { recursive: true });
  mkdirSync(bin);
  for (const version of versions) {
    writeFileSync(
      join(root, `supabase/migrations/${version}_authority.sql`),
      '-- migration',
    );
  }
  temporaryRoots.push(root);
  return { bin, calls, evidence, root, versions };
};

const writeFakePnpm = (
  bin: string,
  calls: string,
  remoteVersions: readonly string[],
  failPush = false,
  format: 'json' | 'unicode' | 'ascii' = 'json',
): void => {
  const separator = format === 'unicode' ? '│' : '|';
  const rows = remoteVersions
    .map(
      (version) =>
        ` ${version} ${separator} ${version} ${separator} 2026-09-04`,
    )
    .join('\n');
  const output =
    format === 'json'
      ? JSON.stringify({
          message: 'Migrations listed',
          migrations: remoteVersions.map((version) => ({
            local: version,
            remote: version,
            time: '2026-09-04 12:00:00',
          })),
        })
      : ` Local ${separator} Remote ${separator} Time\n${rows}`;
  const script = join(bin, 'pnpm');
  writeFileSync(
    script,
    `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$CALL_LOG"
if [[ "$*" == *"db push"* && "${failPush ? 'yes' : 'no'}" == "yes" ]]; then
  exit 17
fi
if [[ "$*" == *"migration list"* ]]; then
  printf '%s\\n' '${output}'
fi
`,
  );
  chmodSync(script, 0o700);
};

const run = (
  sandbox: ReturnType<typeof createSandbox>,
  overrides: Record<string, string | undefined> = {},
) => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CALL_LOG: sandbox.calls,
    PATH: `${sandbox.bin}:${process.env.PATH ?? ''}`,
    CI_RUN_ID: '12345',
    DEPLOY_SHA: 'a'.repeat(40),
    STAGING_MIGRATION_EVIDENCE_PATH: sandbox.evidence,
    SUPABASE_ACCESS_TOKEN: 'test-only-token',
    SUPABASE_DB_PASSWORD: 'test-only-password',
    SUPABASE_PROJECT_REF: 'test-project',
    ...overrides,
  };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key];
  }
  return spawnSync('bash', [migrationRunner], {
    cwd: sandbox.root,
    encoding: 'utf8',
    env,
  });
};

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('hosted migration runner', () => {
  it.each([
    'SUPABASE_PROJECT_REF',
    'SUPABASE_DB_PASSWORD',
    'SUPABASE_ACCESS_TOKEN',
  ])('fails before provider access when %s is absent', (missing) => {
    const sandbox = createSandbox();
    writeFakePnpm(sandbox.bin, sandbox.calls, sandbox.versions);

    const result = run(sandbox, { [missing]: undefined });

    expect(result.status).not.toBe(0);
    expect(existsSync(sandbox.calls)).toBe(false);
    expect(existsSync(sandbox.evidence)).toBe(false);
  });

  it.each(['json', 'unicode'] as const)(
    'parses %s output, verifies full parity, and writes bound evidence',
    (format) => {
      const sandbox = createSandbox();
      writeFakePnpm(
        sandbox.bin,
        sandbox.calls,
        sandbox.versions,
        false,
        format,
      );

      const result = run(sandbox);

      expect(result.status).toBe(0);
      const calls = readFileSync(sandbox.calls, 'utf8').trim().split('\n');
      expect(calls).toEqual([
        'exec supabase db push --project-ref test-project --yes --skip-vault',
        'exec supabase migration list --project-ref test-project',
      ]);
      expect(calls.join('\n')).not.toMatch(
        /test-only-password|test-only-token|--password|db reset|migration repair|supabase link/u,
      );
      const evidence = JSON.parse(readFileSync(sandbox.evidence, 'utf8')) as {
        appliedVersions: string[];
        ciRunId: string;
        migrationVersion: string;
        projectRef: string;
        remoteHistorySha256: string;
        sourceRevision: string;
        state: string;
        forwardFixOnly: boolean;
        destructiveRollbackAttempted: boolean;
      };
      expect(evidence).toMatchObject({
        appliedVersions: sandbox.versions,
        ciRunId: '12345',
        destructiveRollbackAttempted: false,
        forwardFixOnly: true,
        migrationVersion: sandbox.versions.at(-1),
        projectRef: 'test-project',
        sourceRevision: 'a'.repeat(40),
        state: 'expanded',
      });
      expect(evidence.remoteHistorySha256).toMatch(/^[0-9a-f]{64}$/u);
      expect(
        spawnSync(
          'node',
          [
            evidenceVerifier,
            sandbox.evidence,
            'a'.repeat(40),
            '12345',
            'test-project',
          ],
          { cwd: sandbox.root, encoding: 'utf8' },
        ).status,
      ).toBe(0);
    },
  );

  it('rejects incomplete remote parity without leaving evidence or a temp file', () => {
    const sandbox = createSandbox();
    writeFakePnpm(sandbox.bin, sandbox.calls, sandbox.versions.slice(0, 1));

    const result = run(sandbox);

    expect(result.status).not.toBe(0);
    expect(existsSync(sandbox.evidence)).toBe(false);
    expect(readdirSync(sandbox.root)).not.toContain(
      'staging-migration-evidence.json.tmp',
    );
  });

  it('leaves no success evidence when the provider push fails', () => {
    const sandbox = createSandbox();
    writeFakePnpm(sandbox.bin, sandbox.calls, sandbox.versions, true);

    const result = run(sandbox);

    expect(result.status).toBe(17);
    expect(existsSync(sandbox.evidence)).toBe(false);
    expect(readFileSync(sandbox.calls, 'utf8')).not.toContain('migration list');
  });
});
