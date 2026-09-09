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

const productionCandidateVerifier = fileURLToPath(
  new URL('../infra/workflows/verify-production-candidate.sh', import.meta.url),
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

describe('production workflow evidence scripts', () => {
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
