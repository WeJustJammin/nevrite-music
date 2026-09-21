import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  authenticateAc265ApprovedRunnerMappingsV1,
  canonicalizeAc265ApprovedRunnerMappingsV1,
} from '../infra/workflows/ac265-approved-runner-mapping-attestation.ts';
import { runAttestAc265ApprovedRunnerMapping } from '../infra/workflows/attest-ac265-approved-runner-mapping.ts';
import {
  AC265_TEST_RUNNER_MAPPING_KEY_ID,
  AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM,
  AC265_TEST_RUNNER_MAPPING_PUBLIC_KEY_PEM,
} from './contracts/ac265-hosted-receipt-context-fixtures.ts';
import { makeContract } from './contracts/ac265-hosted-test-fixtures.ts';

const PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_KEY = 'sb_secret_entrypoint_fixture';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const MAPPING_ID = '60000000-0000-4000-8000-000000000006';
const NOW = new Date('2026-09-21T10:01:00.000Z');
const ENTRYPOINT_PATH = fileURLToPath(
  new URL(
    '../infra/workflows/attest-ac265-approved-runner-mapping.ts',
    import.meta.url,
  ),
);
const roots: string[] = [];

const responseResult = () => {
  const contract = makeContract();
  return {
    criterion: 'P2-S09-AC-265',
    schemaVersion: 'ac265-hosted-approved-registry-control-v1',
    authorizationRef: AUTHORIZATION_REF,
    environment: 'staging',
    hostingProjectId: 'wejammin-staging',
    supabaseProjectRef: PROJECT_REF,
    redacted: true,
    mapping: {
      schemaVersion: 'ac265-approved-runner-mappings-v1',
      source: 'protected-ac265-runner-mapping-control-plane',
      mappingId: MAPPING_ID,
      approvedAt: '2026-09-21T10:00:00.000Z',
      runId: contract.runId,
      identity: contract.identity,
      roleResourceBindings: contract.roleResourceBindings,
      scenarioRoleBindings: contract.scenarioRoleBindings,
    },
    resources: contract.resourceRefs,
  };
};

const responseFor = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const harness = () => {
  const runnerTemp = mkdtempSync(join(tmpdir(), 'ac265-attest-entrypoint-'));
  roots.push(runnerTemp);
  const summary = join(runnerTemp, 'summary.md');
  writeFileSync(summary, '', { mode: 0o600 });
  const output = join(runnerTemp, 'ac265-runner-mapping');
  return {
    runnerTemp,
    summary,
    output,
    env: {
      RUNNER_TEMP: runnerTemp,
      GITHUB_STEP_SUMMARY: summary,
      AC265_RUNNER_MAPPING_OUTPUT_DIR: output,
      AC265_AUTHORIZATION_REF: AUTHORIZATION_REF,
      AC265_MAPPING_ID: MAPPING_ID,
      SUPABASE_URL,
      SUPABASE_PROJECT_REF: PROJECT_REF,
      SUPABASE_SECRET_KEY: SERVICE_KEY,
      AC265_RUNNER_MAPPING_SIGNING_PRIVATE_KEY_PEM:
        AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM,
      AC265_RUNNER_MAPPING_SIGNING_KEY_ID: AC265_TEST_RUNNER_MAPPING_KEY_ID,
    },
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true });
});

describe('AC265 protected runner-mapping attestation entrypoint', () => {
  it('loads under the raw Node runtime without executing as an imported module', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '--eval',
        "await import('./infra/workflows/attest-ac265-approved-runner-mapping.ts')",
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  it('executes through a symlinked path and fails closed instead of silently succeeding', () => {
    const root = mkdtempSync(join(tmpdir(), 'ac265-attest-symlink-'));
    roots.push(root);
    const symlinkedEntrypoint = join(root, 'attest.ts');
    symlinkSync(ENTRYPOINT_PATH, symlinkedEntrypoint, 'file');

    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', symlinkedEntrypoint],
      {
        encoding: 'utf8',
        env: { PATH: process.env.PATH ?? '/usr/bin:/bin' },
      },
    );
    const output = `${result.stdout}${result.stderr}`;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(output).toContain(
      'AC265 approved runner mapping attestation failed',
    );
    expect(output).not.toContain('Error:');
  });

  it('reads the protected RPC, writes only canonical signed artifacts, and emits a redacted summary', async () => {
    const run = harness();
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(responseResult()),
    );

    const result = await runAttestAc265ApprovedRunnerMapping({
      env: run.env,
      fetchImpl,
      now: () => NOW,
    });

    expect(result).toEqual({
      mappingId: MAPPING_ID,
      runId: responseResult().mapping.runId,
      keyId: AC265_TEST_RUNNER_MAPPING_KEY_ID,
      expiresAt: '2026-09-21T10:06:00.000Z',
    });
    expect(readdirSync(run.output).sort()).toEqual([
      'canonical-runner-mapping.json',
      'runner-mapping-attestation.json',
    ]);
    expect(lstatSync(run.output).mode & 0o777).toBe(0o700);
    const mappingPath = join(run.output, 'canonical-runner-mapping.json');
    const attestationPath = join(run.output, 'runner-mapping-attestation.json');
    expect(lstatSync(mappingPath).mode & 0o777).toBe(0o600);
    expect(lstatSync(attestationPath).mode & 0o777).toBe(0o600);
    const mappingBytes = readFileSync(mappingPath);
    const attestationBytes = readFileSync(attestationPath);
    expect(mappingBytes).toEqual(
      canonicalizeAc265ApprovedRunnerMappingsV1(responseResult().mapping).bytes,
    );
    expect(() =>
      authenticateAc265ApprovedRunnerMappingsV1({
        mappingBytes,
        attestationBytes,
        trustedKeys: [
          {
            keyId: AC265_TEST_RUNNER_MAPPING_KEY_ID,
            publicKeyPem: AC265_TEST_RUNNER_MAPPING_PUBLIC_KEY_PEM,
            validFrom: '2026-09-01T00:00:00.000Z',
            validUntil: '2026-10-01T00:00:00.000Z',
            status: 'active',
          },
        ],
      }),
    ).not.toThrow();
    const summary = readFileSync(run.summary, 'utf8');
    expect(summary).toContain(MAPPING_ID);
    expect(summary).toContain(AC265_TEST_RUNNER_MAPPING_KEY_ID);
    expect(summary).not.toContain(SERVICE_KEY);
    expect(summary).not.toContain(AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM);
    expect(summary).not.toContain(AUTHORIZATION_REF);
  });

  it('rejects paths outside the exact fresh runner-temp output directory', async () => {
    for (const mutate of [
      (run: ReturnType<typeof harness>) => {
        run.env.AC265_RUNNER_MAPPING_OUTPUT_DIR = join(tmpdir(), 'other');
      },
      (run: ReturnType<typeof harness>) => {
        writeFileSync(run.output, 'not-a-directory');
      },
      (run: ReturnType<typeof harness>) => {
        const target = join(run.runnerTemp, 'target');
        writeFileSync(target, 'target');
        symlinkSync(target, run.output);
      },
    ]) {
      const run = harness();
      mutate(run);
      await expect(
        runAttestAc265ApprovedRunnerMapping({
          env: run.env,
          fetchImpl: vi.fn<typeof fetch>(),
          now: () => NOW,
        }),
      ).rejects.toThrow('AC265 approved runner mapping attestation failed');
    }
  });

  it('fails closed for invalid keys or RPC responses without persisting secret material', async () => {
    for (const failure of [
      {
        key: 'not-a-private-key',
        response: responseResult(),
      },
      {
        key: AC265_TEST_RUNNER_MAPPING_PRIVATE_KEY_PEM,
        response: { status: 'conflict' },
      },
    ]) {
      const run = harness();
      run.env.AC265_RUNNER_MAPPING_SIGNING_PRIVATE_KEY_PEM = failure.key;
      await expect(
        runAttestAc265ApprovedRunnerMapping({
          env: run.env,
          fetchImpl: vi.fn<typeof fetch>(async () =>
            responseFor(failure.response),
          ),
          now: () => NOW,
        }),
      ).rejects.toThrow('AC265 approved runner mapping attestation failed');
      if (existsSync(run.output)) {
        expect(lstatSync(run.output).mode & 0o777).toBe(0o700);
        expect(readdirSync(run.output)).toEqual([]);
      }
      expect(readFileSync(run.summary, 'utf8')).not.toMatch(
        /sb_secret|BEGIN PRIVATE KEY|authorization:\/\/staging/u,
      );
    }
  });

  it('rejects unsafe summary files before network or artifact writes', async () => {
    const run = harness();
    chmodSync(run.summary, 0o600);
    const unsafe = join(run.runnerTemp, 'unsafe-summary');
    symlinkSync(run.summary, unsafe);
    run.env.GITHUB_STEP_SUMMARY = unsafe;
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      runAttestAc265ApprovedRunnerMapping({
        env: run.env,
        fetchImpl,
        now: () => NOW,
      }),
    ).rejects.toThrow('AC265 approved runner mapping attestation failed');
    expect(fetchImpl).not.toHaveBeenCalled();

    const outside = harness();
    const outsideDirectory = mkdtempSync(
      join(tmpdir(), 'ac265-summary-outside-'),
    );
    roots.push(outsideDirectory);
    const outsideSummary = join(outsideDirectory, 'summary.md');
    writeFileSync(outsideSummary, '', { mode: 0o600 });
    outside.env.GITHUB_STEP_SUMMARY = outsideSummary;
    const outsideFetch = vi.fn<typeof fetch>();

    await expect(
      runAttestAc265ApprovedRunnerMapping({
        env: outside.env,
        fetchImpl: outsideFetch,
        now: () => NOW,
      }),
    ).rejects.toThrow('AC265 approved runner mapping attestation failed');
    expect(outsideFetch).not.toHaveBeenCalled();
    expect(readFileSync(outsideSummary, 'utf8')).toBe('');
  });

  it('establishes output writability before RPC access', async () => {
    const run = harness();
    chmodSync(run.runnerTemp, 0o500);
    const fetchImpl = vi.fn<typeof fetch>();

    try {
      await expect(
        runAttestAc265ApprovedRunnerMapping({
          env: run.env,
          fetchImpl,
          now: () => NOW,
        }),
      ).rejects.toThrow('AC265 approved runner mapping attestation failed');
      expect(fetchImpl).not.toHaveBeenCalled();
      expect(readdirSync(run.runnerTemp)).toEqual(['summary.md']);
    } finally {
      chmodSync(run.runnerTemp, 0o700);
    }
  });

  it('leaves only a private empty output directory when the RPC fails', async () => {
    const run = harness();
    let destinationWasReady = false;
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      destinationWasReady =
        lstatSync(run.output).isDirectory() &&
        readdirSync(run.output).length === 0;
      throw new Error(`upstream body contains ${SERVICE_KEY}`);
    });

    await expect(
      runAttestAc265ApprovedRunnerMapping({
        env: run.env,
        fetchImpl,
        now: () => NOW,
      }),
    ).rejects.toThrow('AC265 approved runner mapping attestation failed');

    expect(destinationWasReady).toBe(true);
    expect(lstatSync(run.output).mode & 0o777).toBe(0o700);
    expect(readdirSync(run.output)).toEqual([]);
    expect(readdirSync(run.runnerTemp).sort()).toEqual([
      'ac265-runner-mapping',
      'summary.md',
    ]);
  });
});
