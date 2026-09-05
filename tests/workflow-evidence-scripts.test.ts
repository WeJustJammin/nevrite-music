import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const gateWriter = fileURLToPath(
  new URL('../infra/workflows/write-ci-gate-evidence.sh', import.meta.url),
);
const migrationRunner = fileURLToPath(
  new URL('../infra/workflows/apply-hosted-migrations.sh', import.meta.url),
);
const stagingCandidatePreparer = fileURLToPath(
  new URL('../infra/workflows/prepare-staging-candidate.sh', import.meta.url),
);
const productionCandidateVerifier = fileURLToPath(
  new URL('../infra/workflows/verify-production-candidate.sh', import.meta.url),
);
const apiWorkerDeployer = fileURLToPath(
  new URL('../infra/workflows/deploy-api-worker.sh', import.meta.url),
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
  args: readonly string[] = [],
): void => {
  execFileSync('bash', [script, ...args], {
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
  it('derives an independent staging artifact identity from the immutable manifest', () => {
    const root = temporaryRoot();
    const sourceRevision = 'a'.repeat(40);
    const migrationVersion = '20260902080000';
    const manifest = `${'b'.repeat(64)}  ./artifact.js\n`;
    mkdirSync(join(root, '.artifacts'));
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true });
    writeFileSync(join(root, '.artifacts/artifact.js'), 'artifact');
    writeFileSync(join(root, 'deployment-manifest.sha256'), manifest);
    writeFileSync(
      join(root, `supabase/migrations/${migrationVersion}_authority.sql`),
      '-- migration',
    );

    execute(stagingCandidatePreparer, root, {
      CI_RUN_ID: '33915048658',
      DEPLOY_SHA: sourceRevision,
    });

    expect(
      JSON.parse(
        readFileSync(
          join(root, 'promotion-candidate/staging-artifact-identity.json'),
          'utf8',
        ),
      ),
    ).toEqual({
      artifactDigest: createHash('sha256').update(manifest).digest('hex'),
      sourceRevision,
      buildId: 'ci-33915048658',
      migrationVersion,
    });
  });

  it('deploys API artifacts with a temporary permission-bounded secret file', () => {
    const root = temporaryRoot();
    const bin = join(root, 'bin');
    const runnerTemp = join(root, 'runner-temp');
    const artifact = join(root, 'worker.js');
    const calls = join(root, 'calls.log');
    mkdirSync(bin);
    mkdirSync(runnerTemp);
    writeFileSync(artifact, 'worker');
    const fakePnpm = join(bin, 'pnpm');
    writeFileSync(
      fakePnpm,
      `#!/usr/bin/env bash
set -euo pipefail
test -z "\${SUPABASE_SECRET_KEY:-}"
task_secrets_file=""
task_previous=""
for task_argument in "$@"; do
  if [[ "$task_previous" == "--secrets-file" ]]; then
    task_secrets_file="$task_argument"
    break
  fi
  task_previous="$task_argument"
done
[[ "$task_secrets_file" == "$RUNNER_TEMP"/wejammin-api-staging-secrets.*.env ]]
test -f "$task_secrets_file"
test "$(stat -c '%a' "$task_secrets_file")" = "600"
grep -Fx 'SUPABASE_SECRET_KEY=synthetic-staging-secret' "$task_secrets_file" >/dev/null
printf '%s\n' "$*" > "$CALL_LOG"
`,
    );
    chmodSync(fakePnpm, 0o700);

    execute(
      apiWorkerDeployer,
      root,
      {
        CALL_LOG: calls,
        CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32),
        DEPLOY_SHA: 'a'.repeat(40),
        PATH: `${bin}:${process.env.PATH ?? ''}`,
        RUNNER_TEMP: runnerTemp,
        SUPABASE_SECRET_KEY: 'synthetic-staging-secret',
        SUPABASE_URL: 'https://staging.example.supabase.co',
      },
      ['staging', artifact],
    );

    const command = readFileSync(calls, 'utf8');
    expect(command).toContain(`wrangler deploy ${artifact}`);
    expect(command).toContain('--env staging');
    expect(command).toContain('--var APP_ENVIRONMENT:staging');
    const secretsFile = command.match(/--secrets-file (\S+)/u)?.[1];
    expect(secretsFile).toMatch(
      new RegExp(
        `^${runnerTemp}/wejammin-api-staging-secrets\\.[A-Za-z0-9]+\\.env$`,
        'u',
      ),
    );
    expect(command).not.toContain('synthetic-staging-secret');
    expect(() => readFileSync(secretsFile ?? '', 'utf8')).toThrow();
  });

  it('rejects non-canonical Supabase origins before invoking Wrangler', () => {
    const root = temporaryRoot();
    const bin = join(root, 'bin');
    const runnerTemp = join(root, 'runner-temp');
    const artifact = join(root, 'worker.js');
    const calls = join(root, 'calls.log');
    mkdirSync(bin);
    mkdirSync(runnerTemp);
    writeFileSync(artifact, 'worker');
    const fakePnpm = join(bin, 'pnpm');
    writeFileSync(
      fakePnpm,
      `#!/usr/bin/env bash
set -euo pipefail
printf 'called\n' > "$CALL_LOG"
`,
    );
    chmodSync(fakePnpm, 0o700);

    for (const SUPABASE_URL of [
      'https://user:password@staging.example.supabase.co',
      'https://staging.example.supabase.co ',
    ]) {
      expect(() =>
        execute(
          apiWorkerDeployer,
          root,
          {
            CALL_LOG: calls,
            DEPLOY_SHA: 'a'.repeat(40),
            PATH: `${bin}:${process.env.PATH ?? ''}`,
            RUNNER_TEMP: runnerTemp,
            SUPABASE_SECRET_KEY: 'synthetic-staging-secret',
            SUPABASE_URL,
          },
          ['staging', artifact],
        ),
      ).toThrow();
    }
    expect(() => readFileSync(calls, 'utf8')).toThrow();
  });

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

  it('derives an independent production predecessor identity after manifest checks', () => {
    const root = temporaryRoot();
    const bin = join(root, 'bin');
    const githubEnv = join(root, 'github.env');
    const sourceRevision = 'a'.repeat(40);
    mkdirSync(bin);
    mkdirSync(join(root, '.promotion/artifacts/apps/web/dist/server'), {
      recursive: true,
    });
    mkdirSync(join(root, '.promotion/artifacts/apps/web/dist/client'));
    mkdirSync(join(root, '.promotion/artifacts/apps/worker/dist'), {
      recursive: true,
    });
    mkdirSync(join(root, '.promotion/artifacts/performance-evidence'));
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true });
    writeFileSync(
      join(root, '.promotion/artifacts/apps/web/dist/server/entry.mjs'),
      'web',
    );
    writeFileSync(
      join(
        root,
        '.promotion/artifacts/apps/web/dist/server/wrangler.production.json',
      ),
      '{}',
    );
    writeFileSync(
      join(root, '.promotion/artifacts/apps/web/dist/client/index.html'),
      'client',
    );
    writeFileSync(
      join(root, '.promotion/artifacts/apps/worker/dist/index.js'),
      'worker',
    );
    writeFileSync(
      join(
        root,
        '.promotion/artifacts/performance-evidence/bundle-budget.json',
      ),
      '{}',
    );
    writeFileSync(join(root, '.promotion/artifacts/api-p95-smoke.json'), '{}');
    writeFileSync(
      join(root, 'supabase/migrations/20260903120000_authority.sql'),
      '-- migration',
    );
    execFileSync(
      'bash',
      [
        '-c',
        '(cd .promotion/artifacts && find . -type f -print0 | sort -z | xargs -0 sha256sum) > .promotion/deployment-manifest.sha256',
      ],
      { cwd: root, stdio: 'pipe' },
    );
    const artifactDigest = execFileSync(
      'sha256sum',
      ['.promotion/deployment-manifest.sha256'],
      { cwd: root, encoding: 'utf8' },
    ).split(/\s+/u)[0];
    writeFileSync(
      join(root, '.promotion/promotion-metadata.json'),
      `${JSON.stringify({
        artifact: {
          artifactDigest,
          sourceRevision,
          buildId: 'ci-123',
          migrationVersion: '20260903120000',
        },
      })}\n`,
    );
    const migrationVersions = ['20260903120000'];
    writeFileSync(
      join(root, '.promotion/staging-migration-evidence.json'),
      `${JSON.stringify({
        appliedVersions: migrationVersions,
        ciRunId: '123',
        destructiveRollbackAttempted: false,
        environment: 'staging',
        forwardFixOnly: true,
        migrationVersion: migrationVersions[0],
        projectRef: 'test-project',
        remoteHistorySha256: createHash('sha256')
          .update(JSON.stringify(migrationVersions))
          .digest('hex'),
        sourceRevision,
        state: 'expanded',
        verifiedAt: '2026-09-04T18:00:00.000Z',
      })}\n`,
    );
    const fakeGit = join(bin, 'git');
    writeFileSync(
      fakeGit,
      [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        '[[ "$*" == "rev-parse HEAD" ]]',
        'printf "%s\\n" "$DEPLOY_SHA"',
      ].join('\n'),
    );
    chmodSync(fakeGit, 0o700);
    const fakeNode = join(bin, 'node');
    writeFileSync(
      fakeNode,
      [
        '#!/usr/bin/env bash',
        'set -euo pipefail',
        'if [[ "$*" == *verify-performance-evidence.ts* ]]; then exit 0; fi',
        `exec ${JSON.stringify(process.execPath)} "$@"`,
      ].join('\n'),
    );
    chmodSync(fakeNode, 0o700);

    execute(productionCandidateVerifier, root, {
      CI_RUN_ID: '123',
      DEPLOY_SHA: sourceRevision,
      EXPECTED_STAGING_SUPABASE_PROJECT_REF: 'test-project',
      GITHUB_ENV: githubEnv,
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      PRODUCTION_WEB_ORIGIN: 'https://production.example.com',
      STAGING_RUN_ID: '456',
    });

    expect(
      JSON.parse(
        readFileSync(
          join(root, '.promotion/staging-artifact-identity.json'),
          'utf8',
        ),
      ),
    ).toEqual({
      artifactDigest,
      sourceRevision,
      buildId: 'ci-123',
      migrationVersion: '20260903120000',
    });
  });
});
