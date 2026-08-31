import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const gateWriter = fileURLToPath(
  new URL('../infra/workflows/write-ci-gate-evidence.sh', import.meta.url),
);
const migrationRunner = fileURLToPath(
  new URL('../infra/workflows/apply-production-migrations.sh', import.meta.url),
);
const temporaryRoots: string[] = [];

const temporaryRoot = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'wejammin-workflow-'));
  temporaryRoots.push(root);
  return root;
};

const execute = (
  script: string,
  cwd: string,
  env: Record<string, string>,
): void => {
  execFileSync('bash', [script], {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'pipe',
  });
};

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('release workflow evidence scripts', () => {
  it('derives every CI gate from successful upstream results and built files', () => {
    const root = temporaryRoot();
    mkdirSync(join(root, 'apps/worker/dist'), { recursive: true });
    mkdirSync(join(root, 'apps/web/dist/server'), { recursive: true });
    mkdirSync(join(root, 'apps/web/dist/client'), { recursive: true });
    mkdirSync(join(root, '.ci-release-gates'));
    writeFileSync(join(root, 'apps/worker/dist/index.js'), 'worker');
    writeFileSync(join(root, 'apps/web/dist/server/entry.mjs'), 'web');
    for (const name of ['contracts', 'registry', 'slo-runbook']) {
      writeFileSync(
        join(root, `.ci-release-gates/${name}.passed`),
        'success\n',
      );
    }

    execute(gateWriter, root, {
      DATABASE_RESULT: 'success',
      QUALITY_RESULT: 'success',
      SOURCE_REVISION: 'a'.repeat(40),
    });

    const evidence = JSON.parse(
      readFileSync(join(root, 'ci-gate-evidence.json'), 'utf8'),
    ) as { gates: Record<string, boolean> };
    expect(evidence.gates.infrastructure).toBe(false);
    expect(
      Object.entries(evidence.gates)
        .filter(([name]) => name !== 'infrastructure')
        .map(([, value]) => value),
    ).not.toContain(false);
    expect(Object.keys(evidence.gates)).toHaveLength(10);
  });

  it('fails closed when an upstream CI result is not successful', () => {
    const root = temporaryRoot();
    mkdirSync(join(root, 'apps/worker/dist'), { recursive: true });
    mkdirSync(join(root, 'apps/web/dist/server'), { recursive: true });
    mkdirSync(join(root, 'apps/web/dist/client'), { recursive: true });
    mkdirSync(join(root, '.ci-release-gates'));
    writeFileSync(join(root, 'apps/worker/dist/index.js'), 'worker');
    writeFileSync(join(root, 'apps/web/dist/server/entry.mjs'), 'web');
    for (const name of ['contracts', 'registry', 'slo-runbook']) {
      writeFileSync(
        join(root, `.ci-release-gates/${name}.passed`),
        'success\n',
      );
    }

    expect(() =>
      execute(gateWriter, root, {
        DATABASE_RESULT: 'success',
        QUALITY_RESULT: 'failure',
        SOURCE_REVISION: 'a'.repeat(40),
      }),
    ).toThrow();
  });

  it('verifies the exact remote migration without making a real provider call', () => {
    const root = temporaryRoot();
    const version = '20260830190000';
    const bin = join(root, 'bin');
    const calls = join(root, 'calls.log');
    const metadataPath = join(root, '.promotion/promotion-metadata.json');
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true });
    mkdirSync(join(root, '.promotion'), { recursive: true });
    mkdirSync(bin);
    writeFileSync(
      join(root, `supabase/migrations/${version}_authority.sql`),
      '-- test migration',
    );
    writeFileSync(
      metadataPath,
      `${JSON.stringify({
        artifact: {
          artifactDigest: 'a'.repeat(64),
          sourceRevision: 'b'.repeat(40),
          buildId: 'ci-123',
          migrationVersion: version,
        },
        environment: 'production',
        gates: {},
        migration: {
          state: 'not_started',
          forwardFixOnly: true,
          destructiveRollbackAttempted: false,
        },
        verifiedAt: '2026-08-30T17:00:00.000Z',
      })}\n`,
    );
    const fakePnpm = join(bin, 'pnpm');
    writeFileSync(
      fakePnpm,
      `#!/usr/bin/env bash\nset -euo pipefail\ntest -n "\${SUPABASE_DB_PASSWORD:-}"\nprintf '%s\\n' "$*" >> "$CALL_LOG"\nif [[ "$*" == *"migration list"* ]]; then\n  printf ' Local | Remote | Time\\n \\x60%s\\x60 | \\x60%s\\x60 | \\x602026-08-30\\x60\\n' "$EXPECTED_VERSION" "$EXPECTED_VERSION"\nfi\n`,
    );
    chmodSync(fakePnpm, 0o700);

    execute(migrationRunner, root, {
      CALL_LOG: calls,
      EXPECTED_VERSION: version,
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      PROMOTION_METADATA_PATH: metadataPath,
      SUPABASE_ACCESS_TOKEN: 'test-only-token',
      SUPABASE_DB_PASSWORD: 'test-only-password',
      SUPABASE_PROJECT_REF: 'test-project',
    });

    const callsMade = readFileSync(calls, 'utf8');
    const evidence = JSON.parse(readFileSync(metadataPath, 'utf8')) as {
      migration: { state: string };
    };
    expect(callsMade).toContain('supabase db push');
    expect(callsMade).toContain('supabase migration list');
    expect(callsMade).not.toContain('--password');
    expect(callsMade).not.toContain('test-only-password');
    expect(evidence.migration.state).toBe('expanded');
  });
});
