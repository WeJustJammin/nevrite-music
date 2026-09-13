import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runAc265HostedE2ePreflight } from '../infra/workflows/collect-ac265-hosted-e2e-preflight.ts';
import {
  API_ORIGIN,
  CI_RUN_ATTEMPT,
  CI_RUN_ID,
  DEPLOYMENT_ID,
  REPOSITORY,
  SOURCE_SHA,
  STAGING_RUN_ATTEMPT,
  STAGING_RUN_ID,
  TOKEN,
  WEB_ORIGIN,
  createCandidateFixture,
  createMockGitHubApi,
} from './ac265-candidate-provenance.test-support.ts';

type CandidateFixture = ReturnType<typeof createCandidateFixture>;
type TestEnvironment = Record<string, string | undefined>;

const requiredEnvironmentKeys = [
  'GITHUB_REPOSITORY',
  'GITHUB_TOKEN',
  'AC265_SOURCE_SHA',
  'AC265_STAGING_RUN_ID',
  'AC265_STAGING_RUN_ATTEMPT',
  'AC265_CI_RUN_ID',
  'AC265_CI_RUN_ATTEMPT',
  'AC265_STAGING_DEPLOYMENT_ID',
  'AC265_STAGING_WEB_ORIGIN',
  'AC265_STAGING_API_ORIGIN',
] as const;

const entrypointPath = fileURLToPath(
  new URL(
    '../infra/workflows/collect-ac265-hosted-e2e-preflight.ts',
    import.meta.url,
  ),
);

const environmentFor = (): TestEnvironment => ({
  GITHUB_REPOSITORY: REPOSITORY,
  GITHUB_TOKEN: TOKEN,
  AC265_SOURCE_SHA: SOURCE_SHA,
  AC265_STAGING_RUN_ID: STAGING_RUN_ID,
  AC265_STAGING_RUN_ATTEMPT: STAGING_RUN_ATTEMPT,
  AC265_CI_RUN_ID: CI_RUN_ID,
  AC265_CI_RUN_ATTEMPT: CI_RUN_ATTEMPT,
  AC265_STAGING_DEPLOYMENT_ID: DEPLOYMENT_ID,
  AC265_STAGING_WEB_ORIGIN: WEB_ORIGIN,
  AC265_STAGING_API_ORIGIN: API_ORIGIN,
});

const artifactTreeDigest = (root: string): string => {
  const entries: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const relativePath = path.slice(root.length);
      if (entry.isDirectory()) {
        entries.push(`${relativePath}:directory`);
        visit(path);
      } else if (entry.isFile()) {
        entries.push(
          `${relativePath}:${createHash('sha256').update(readFileSync(path)).digest('hex')}`,
        );
      } else entries.push(`${relativePath}:non-file`);
    }
  };
  visit(root);
  return entries.sort().join('\n');
};

let fixture: CandidateFixture;

beforeEach(() => {
  fixture = createCandidateFixture();
});

afterEach(() => {
  fixture.close();
});

describe('AC265 hosted E2E candidate provenance preflight entrypoint', () => {
  it('verifies the exact candidate, logs only sanitized identities, and leaves evidence files untouched', async () => {
    const api = createMockGitHubApi();
    const messages: string[] = [];
    const before = artifactTreeDigest(fixture.workspaceRoot);

    await runAc265HostedE2ePreflight({
      env: {
        ...environmentFor(),
        SOURCE_SHA: 'e'.repeat(40),
        STAGING_RUN_ID: '999999999999',
        UNRELATED_GITHUB_ENV: 'workflow metadata',
      },
      cwd: fixture.workspaceRoot,
      fetchImpl: api.fetchImpl,
      logger: { log: (message: string) => messages.push(message) },
    });

    expect(messages).toHaveLength(1);
    expect(JSON.parse(messages[0]!)).toEqual({
      event: 'candidate_provenance_verified',
      repository: REPOSITORY,
      sourceRevision: SOURCE_SHA,
      ciRunId: CI_RUN_ID,
      ciRunAttempt: CI_RUN_ATTEMPT,
      stagingRunId: STAGING_RUN_ID,
      stagingRunAttempt: STAGING_RUN_ATTEMPT,
      stagingDeploymentId: DEPLOYMENT_ID,
      stagingWebOrigin: WEB_ORIGIN,
    });
    expect(messages.join('\n')).not.toContain(TOKEN);
    expect(messages.join('\n')).not.toMatch(
      /acceptance|report|receipt|evidence/iu,
    );
    expect(api.requests.length).toBeGreaterThan(0);
    expect(
      api.requests.every(
        ({ init }) =>
          new Headers(init.headers).get('authorization') === `Bearer ${TOKEN}`,
      ),
    ).toBe(true);
    expect(artifactTreeDigest(fixture.workspaceRoot)).toBe(before);
  });

  it('rejects each missing or empty required environment value before GitHub access or logging', async () => {
    for (const key of requiredEnvironmentKeys) {
      for (const value of [undefined, '']) {
        const env = environmentFor();
        env[key] = value;
        const fetchImpl = vi.fn<typeof fetch>();
        const messages: string[] = [];

        await expect(
          runAc265HostedE2ePreflight({
            env,
            cwd: fixture.workspaceRoot,
            fetchImpl,
            logger: { log: (message: string) => messages.push(message) },
          }),
        ).rejects.toThrow();

        expect(fetchImpl).not.toHaveBeenCalled();
        expect(messages).toHaveLength(0);
      }
    }
  });

  it('rejects whitespace-only or padded values without disclosing them', async () => {
    const secretLikeValue = '  private-token-value  ';
    for (const [key, value] of [
      ['GITHUB_TOKEN', secretLikeValue],
      ['GITHUB_REPOSITORY', '   '],
      ['AC265_STAGING_API_ORIGIN', ` ${API_ORIGIN}`],
    ] as const) {
      const env = { ...environmentFor(), [key]: value };
      const fetchImpl = vi.fn<typeof fetch>();
      const messages: string[] = [];

      await expect(
        runAc265HostedE2ePreflight({
          env,
          cwd: fixture.workspaceRoot,
          fetchImpl,
          logger: { log: (message: string) => messages.push(message) },
        }),
      ).rejects.toThrow();

      expect(fetchImpl).not.toHaveBeenCalled();
      expect(messages.join('\n')).not.toContain(secretLikeValue);
    }
  });

  it('requires cwd to be an absolute canonical workspace root before GitHub access', async () => {
    for (const cwd of ['relative-workspace', `${fixture.workspaceRoot}/..`]) {
      const fetchImpl = vi.fn<typeof fetch>();

      await expect(
        runAc265HostedE2ePreflight({
          env: environmentFor(),
          cwd,
          fetchImpl,
          logger: { log: vi.fn() },
        }),
      ).rejects.toThrow();

      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it('sets a nonzero exit code and emits only a generic message when run directly with invalid inputs', () => {
    const sentinel = 'do-not-print-this-token';
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', entrypointPath],
      {
        cwd: fixture.workspaceRoot,
        env: {
          PATH: process.env.PATH ?? '/usr/bin:/bin',
          GITHUB_TOKEN: sentinel,
        },
        encoding: 'utf8',
      },
    );
    const output = `${result.stdout}${result.stderr}`;

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(output).toContain('AC265 hosted E2E candidate preflight failed');
    expect(output).not.toContain(sentinel);
    expect(output).not.toContain('Error:');
  });
});
