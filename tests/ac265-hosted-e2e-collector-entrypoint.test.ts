import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  runAc265HostedE2eCollector,
  type Ac265HostedE2eCollectPort,
} from '../infra/workflows/collect-ac265-hosted-e2e.ts';
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

const FAILURE = 'AC265 hosted E2E collection failed';
const entrypointPath = fileURLToPath(
  new URL('../infra/workflows/collect-ac265-hosted-e2e.ts', import.meta.url),
);

let fixture: CandidateFixture;

const pathsFor = (workspaceRoot: string) => ({
  candidateDirectory: join(workspaceRoot, 'candidate'),
  ciBuildDirectory: join(workspaceRoot, 'ci-build'),
  privateEvidenceDirectory: join(
    dirname(workspaceRoot),
    `${basename(workspaceRoot)}-private-evidence`,
  ),
  sanitizedOutputDirectory: join(workspaceRoot, 'ac265-output'),
  workspaceRoot,
});

const environmentFor = (workspaceRoot: string): TestEnvironment => ({
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
  AC265_SESSION_BROKER_ORIGIN: 'https://session-broker.wejamm.in',
  AC265_EVIDENCE_SERVICE_ORIGIN: 'https://evidence.wejamm.in',
  AC265_FAULT_CONTROL_PLANE_ORIGIN: 'https://fault-control.wejamm.in',
  AC265_WORKLOAD_IDENTITY_AUDIENCE: 'ac265-hosted-e2e',
  AC265_E2E_WORKERS: '1',
  AC265_E2E_RETRIES: '0',
  AC265_CANDIDATE_DIRECTORY: 'candidate',
  AC265_CI_BUILD_DIRECTORY: 'ci-build',
  AC265_PRIVATE_EVIDENCE_DIR: pathsFor(workspaceRoot).privateEvidenceDirectory,
  AC265_SANITIZED_OUTPUT_DIR: 'ac265-output',
});

beforeEach(() => {
  fixture = createCandidateFixture();
});

afterEach(() => {
  fixture.close();
});

describe('AC265 hosted E2E protected collector entrypoint', () => {
  it('reverifies the exact candidate before passing only verified provenance and sanitized config to the injected adapter', async () => {
    const api = createMockGitHubApi();
    const env = environmentFor(fixture.workspaceRoot);
    const messages: string[] = [];
    let requestsBeforeCollect = 0;
    const collect = vi.fn<Ac265HostedE2eCollectPort>(async () => {
      requestsBeforeCollect = api.requests.length;
    });

    await runAc265HostedE2eCollector({
      env,
      cwd: fixture.workspaceRoot,
      fetchImpl: api.fetchImpl,
      collect,
      logger: { log: (message: string) => messages.push(message) },
    });

    expect(requestsBeforeCollect).toBeGreaterThan(0);
    expect(collect).toHaveBeenCalledOnce();
    const [provenance, config] = collect.mock.calls[0]!;
    expect(provenance).toMatchObject({
      status: 'candidate_provenance_verified',
      repository: REPOSITORY,
      sourceRevision: SOURCE_SHA,
      ci: { runId: CI_RUN_ID, runAttempt: CI_RUN_ATTEMPT },
      staging: {
        runId: STAGING_RUN_ID,
        runAttempt: STAGING_RUN_ATTEMPT,
        deploymentId: DEPLOYMENT_ID,
        webOrigin: WEB_ORIGIN,
        apiOrigin: API_ORIGIN,
      },
    });
    expect(config).toEqual({
      sessionBrokerOrigin: 'https://session-broker.wejamm.in',
      evidenceServiceOrigin: 'https://evidence.wejamm.in',
      faultControlPlaneOrigin: 'https://fault-control.wejamm.in',
      workloadIdentityAudience: 'ac265-hosted-e2e',
      workers: 1,
      retries: 0,
      paths: pathsFor(fixture.workspaceRoot),
    });
    expect(JSON.stringify([provenance, config])).not.toContain(TOKEN);
    expect(messages).toEqual([]);
    expect(
      existsSync(pathsFor(fixture.workspaceRoot).sanitizedOutputDirectory),
    ).toBe(false);
  });

  it('rejects a candidate provenance mismatch without invoking the adapter or creating output', async () => {
    const api = createMockGitHubApi();
    const collect = vi.fn<Ac265HostedE2eCollectPort>();
    const outputDirectory = pathsFor(
      fixture.workspaceRoot,
    ).sanitizedOutputDirectory;
    const messages: string[] = [];

    await expect(
      runAc265HostedE2eCollector({
        env: {
          ...environmentFor(fixture.workspaceRoot),
          AC265_SOURCE_SHA: 'f'.repeat(40),
        },
        cwd: fixture.workspaceRoot,
        fetchImpl: api.fetchImpl,
        collect,
        logger: { log: (message: string) => messages.push(message) },
      }),
    ).rejects.toThrow(FAILURE);

    expect(api.requests.length).toBeGreaterThan(0);
    expect(collect).not.toHaveBeenCalled();
    expect(existsSync(outputDirectory)).toBe(false);
    expect(messages).toEqual([]);
  });

  it('reverifies the candidate and then fails closed when no adapter is supplied', async () => {
    const api = createMockGitHubApi();
    const outputDirectory = pathsFor(
      fixture.workspaceRoot,
    ).sanitizedOutputDirectory;

    await expect(
      runAc265HostedE2eCollector({
        env: environmentFor(fixture.workspaceRoot),
        cwd: fixture.workspaceRoot,
        fetchImpl: api.fetchImpl,
      }),
    ).rejects.toThrow(FAILURE);

    expect(api.requests.length).toBeGreaterThan(0);
    expect(existsSync(outputDirectory)).toBe(false);
  });

  it('normalizes adapter errors and never logs the token or creates acceptance output', async () => {
    const api = createMockGitHubApi();
    const secretError = `private adapter details ${TOKEN}`;
    const messages: string[] = [];
    const outputDirectory = pathsFor(
      fixture.workspaceRoot,
    ).sanitizedOutputDirectory;
    const collect = vi.fn<Ac265HostedE2eCollectPort>(async () => {
      throw new Error(secretError);
    });

    let thrown: unknown;
    try {
      await runAc265HostedE2eCollector({
        env: environmentFor(fixture.workspaceRoot),
        cwd: fixture.workspaceRoot,
        fetchImpl: api.fetchImpl,
        collect,
        logger: { log: (message: string) => messages.push(message) },
      });
    } catch (error: unknown) {
      thrown = error;
    }

    expect(collect).toHaveBeenCalledOnce();
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe(FAILURE);
    expect(String(thrown)).not.toContain(secretError);
    expect(messages.join('\n')).not.toContain(TOKEN);
    expect(messages).toEqual([]);
    expect(existsSync(outputDirectory)).toBe(false);
  });

  it('rejects noncanonical origins, worker settings, and paths before GitHub access', async () => {
    const valid = environmentFor(fixture.workspaceRoot);
    const invalidEnvironments: TestEnvironment[] = [
      {
        ...valid,
        AC265_SESSION_BROKER_ORIGIN: 'http://session-broker.wejamm.in',
      },
      {
        ...valid,
        AC265_EVIDENCE_SERVICE_ORIGIN: 'https://evidence.wejamm.in/v1',
      },
      {
        ...valid,
        AC265_FAULT_CONTROL_PLANE_ORIGIN:
          'https://user:pass@fault-control.wejamm.in',
      },
      { ...valid, AC265_E2E_WORKERS: '2' },
      { ...valid, AC265_E2E_RETRIES: '1' },
      { ...valid, AC265_CANDIDATE_DIRECTORY: './candidate' },
      { ...valid, AC265_CI_BUILD_DIRECTORY: 'ci-build/../ci-build' },
      {
        ...valid,
        AC265_PRIVATE_EVIDENCE_DIR: join(fixture.workspaceRoot, 'private'),
      },
      { ...valid, AC265_SANITIZED_OUTPUT_DIR: '../escaped-output' },
    ];

    for (const env of invalidEnvironments) {
      const fetchImpl = vi.fn<typeof fetch>();
      const collect = vi.fn<Ac265HostedE2eCollectPort>();
      await expect(
        runAc265HostedE2eCollector({
          env,
          cwd: fixture.workspaceRoot,
          fetchImpl,
          collect,
        }),
      ).rejects.toThrow(FAILURE);
      expect(fetchImpl).not.toHaveBeenCalled();
      expect(collect).not.toHaveBeenCalled();
    }
  });

  it('prints one fixed generic message and exits nonzero when executed directly without protected inputs', () => {
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
    expect(output).toContain(FAILURE);
    expect(output).not.toContain(sentinel);
    expect(output).not.toContain('Error:');
    expect(output).not.toMatch(/acceptance|report|receipt/iu);
  });
});
