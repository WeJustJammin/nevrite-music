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
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  authenticateAc265ApprovedOutageTargetV1,
  canonicalizeAc265ApprovedOutageTargetV1,
} from '../infra/workflows/ac265-approved-outage-target-attestation.ts';
import { runAttestAc265ApprovedOutageTarget } from '../infra/workflows/attest-ac265-approved-outage-target.ts';

const PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_KEY = 'sb_secret_outage_target_fixture';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/72000000-0000-4000-8000-000000000001';
const TARGET_ID = '74000000-0000-4000-8000-000000000001';
const TARGET_REF = `ac265-outage-target://staging/${TARGET_ID}`;
const RUN_ID = '73000000-0000-4000-8000-000000000001';
const NOW = new Date('2026-09-21T10:01:00.000Z');
const TEST_KEY_ID = 'ac265-outage-target-v1';
const TEST_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIJ1hsZ3v/VpguoRK9JLsLMREScVpezJpGXA7rAMcrn9g
-----END PRIVATE KEY-----`;
const TEST_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURo=
-----END PUBLIC KEY-----`;
const ENTRYPOINT_PATH = fileURLToPath(
  new URL(
    '../infra/workflows/attest-ac265-approved-outage-target.ts',
    import.meta.url,
  ),
);
const roots: string[] = [];

const targetFixture = () => ({
  schemaVersion: 'ac265-approved-outage-target-v1',
  source: 'protected-staging-fault-control-plane',
  targetId: TARGET_ID,
  targetRef: TARGET_REF,
  approvedAt: '2026-09-21T09:30:00.000Z',
  expiresAt: '2026-09-21T10:30:00.000Z',
  scope: {
    runId: RUN_ID,
    hostingProjectId: 'wejammin-staging',
    supabaseProjectRef: PROJECT_REF,
    deploymentId: '6428523608',
    dependencyId: 'supabase-auth',
    route: {
      operationId: 'CMS-03A-06',
      method: 'GET' as const,
      path: '/api/v1/cms/content-types',
    },
  },
});

const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

const responseResult = () => {
  const target = targetFixture();
  const canonical = canonicalizeAc265ApprovedOutageTargetV1(target);
  return {
    criterion: 'P2-S09-AC-265',
    schemaVersion: 'ac265-hosted-approved-outage-target-control-v1',
    authorizationRef: AUTHORIZATION_REF,
    environment: 'staging',
    hostingProjectId: 'wejammin-staging',
    supabaseProjectRef: PROJECT_REF,
    redacted: true,
    targetSha256: sha256(canonical.bytes),
    target,
  };
};

const responseFor = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const harness = () => {
  const runnerTemp = mkdtempSync(join(tmpdir(), 'ac265-outage-target-'));
  roots.push(runnerTemp);
  const summary = join(runnerTemp, 'summary.md');
  writeFileSync(summary, '', { mode: 0o600 });
  const output = join(runnerTemp, 'ac265-outage-target');
  return {
    runnerTemp,
    summary,
    output,
    env: {
      RUNNER_TEMP: runnerTemp,
      GITHUB_STEP_SUMMARY: summary,
      AC265_OUTAGE_TARGET_OUTPUT_DIR: output,
      AC265_AUTHORIZATION_REF: AUTHORIZATION_REF,
      AC265_TARGET_REF: TARGET_REF,
      SUPABASE_URL,
      SUPABASE_PROJECT_REF: PROJECT_REF,
      SUPABASE_SECRET_KEY: SERVICE_KEY,
      AC265_OUTAGE_TARGET_SIGNING_PRIVATE_KEY_PEM: TEST_PRIVATE_KEY_PEM,
      AC265_OUTAGE_TARGET_SIGNING_KEY_ID: TEST_KEY_ID,
    },
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true });
});

describe('AC265 protected outage-target attestation entrypoint', () => {
  it('loads under raw Node without executing when imported', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '--eval',
        "await import('./infra/workflows/attest-ac265-approved-outage-target.ts')",
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  it('fails closed when invoked through a symlinked path', () => {
    const root = mkdtempSync(join(tmpdir(), 'ac265-outage-target-link-'));
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
    expect(output).toContain('AC265 approved outage-target attestation failed');
    expect(output).not.toContain('Error:');
  });

  it('reads the protected target, verifies the stored digest, and writes exactly two signed artifacts', async () => {
    const run = harness();
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(responseResult()),
    );

    const result = await runAttestAc265ApprovedOutageTarget({
      env: run.env,
      fetchImpl,
      now: () => NOW,
    });

    expect(result).toEqual({
      targetRef: TARGET_REF,
      runId: RUN_ID,
      keyId: TEST_KEY_ID,
      expiresAt: '2026-09-21T10:06:00.000Z',
    });
    expect(readdirSync(run.output).sort()).toEqual([
      'canonical-outage-target.json',
      'outage-target-attestation.json',
    ]);
    expect(lstatSync(run.output).mode & 0o777).toBe(0o700);
    const targetPath = join(run.output, 'canonical-outage-target.json');
    const attestationPath = join(run.output, 'outage-target-attestation.json');
    expect(lstatSync(targetPath).mode & 0o777).toBe(0o600);
    expect(lstatSync(attestationPath).mode & 0o777).toBe(0o600);
    const targetBytes = readFileSync(targetPath);
    const attestationBytes = readFileSync(attestationPath);
    expect(targetBytes).toEqual(
      canonicalizeAc265ApprovedOutageTargetV1(responseResult().target).bytes,
    );
    expect(() =>
      authenticateAc265ApprovedOutageTargetV1({
        targetBytes,
        attestationBytes,
        trustedKeys: [
          {
            keyId: TEST_KEY_ID,
            publicKeyPem: TEST_PUBLIC_KEY_PEM,
            validFrom: '2026-09-01T00:00:00.000Z',
            validUntil: '2026-10-01T00:00:00.000Z',
            status: 'active',
          },
        ],
      }),
    ).not.toThrow();
    const summary = readFileSync(run.summary, 'utf8');
    expect(summary).toContain(TARGET_REF);
    expect(summary).toContain(TEST_KEY_ID);
    expect(summary).not.toContain(SERVICE_KEY);
    expect(summary).not.toContain(TEST_PRIVATE_KEY_PEM);
    expect(summary).not.toContain(AUTHORIZATION_REF);
  });

  it('rejects unsafe or non-fresh output paths before network access', async () => {
    for (const mutate of [
      (run: ReturnType<typeof harness>) => {
        run.env.AC265_OUTAGE_TARGET_OUTPUT_DIR = join(tmpdir(), 'other');
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
      const fetchImpl = vi.fn<typeof fetch>();
      await expect(
        runAttestAc265ApprovedOutageTarget({
          env: run.env,
          fetchImpl,
          now: () => NOW,
        }),
      ).rejects.toThrow('AC265 approved outage-target attestation failed');
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it('rejects malformed target references and digest mismatches before signing', async () => {
    const invalid = harness();
    invalid.env.AC265_TARGET_REF =
      'ac265-outage-target://production/74000000-0000-4000-8000-000000000001';
    const invalidFetch = vi.fn<typeof fetch>();
    await expect(
      runAttestAc265ApprovedOutageTarget({
        env: invalid.env,
        fetchImpl: invalidFetch,
        now: () => NOW,
      }),
    ).rejects.toThrow('AC265 approved outage-target attestation failed');
    expect(invalidFetch).not.toHaveBeenCalled();

    const mismatch = harness();
    const mismatchFetch = vi.fn<typeof fetch>(async () =>
      responseFor({ ...responseResult(), targetSha256: 'a'.repeat(64) }),
    );
    await expect(
      runAttestAc265ApprovedOutageTarget({
        env: mismatch.env,
        fetchImpl: mismatchFetch,
        now: () => NOW,
      }),
    ).rejects.toThrow('AC265 approved outage-target attestation failed');
    expect(existsSync(mismatch.output)).toBe(true);
    expect(readdirSync(mismatch.output)).toEqual([]);
  });

  it('fails closed for invalid signing material or RPC conflicts without leaking secrets', async () => {
    for (const failure of [
      {
        key: 'not-a-private-key',
        response: responseResult(),
      },
      {
        key: TEST_PRIVATE_KEY_PEM,
        response: { status: 'conflict' },
      },
    ]) {
      const run = harness();
      run.env.AC265_OUTAGE_TARGET_SIGNING_PRIVATE_KEY_PEM = failure.key;
      await expect(
        runAttestAc265ApprovedOutageTarget({
          env: run.env,
          fetchImpl: vi.fn<typeof fetch>(async () =>
            responseFor(failure.response),
          ),
          now: () => NOW,
        }),
      ).rejects.toThrow('AC265 approved outage-target attestation failed');
      if (existsSync(run.output)) expect(readdirSync(run.output)).toEqual([]);
      expect(readFileSync(run.summary, 'utf8')).not.toMatch(
        /sb_secret|BEGIN PRIVATE KEY|authorization:\/\/staging/u,
      );
    }
  });

  it('rejects unsafe summary files before RPC access', async () => {
    const run = harness();
    const unsafe = join(run.runnerTemp, 'unsafe-summary');
    symlinkSync(run.summary, unsafe);
    run.env.GITHUB_STEP_SUMMARY = unsafe;
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      runAttestAc265ApprovedOutageTarget({
        env: run.env,
        fetchImpl,
        now: () => NOW,
      }),
    ).rejects.toThrow('AC265 approved outage-target attestation failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('leaves only a private empty output directory when the RPC fails', async () => {
    const run = harness();
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`upstream body contains ${SERVICE_KEY}`);
    });

    await expect(
      runAttestAc265ApprovedOutageTarget({
        env: run.env,
        fetchImpl,
        now: () => NOW,
      }),
    ).rejects.toThrow('AC265 approved outage-target attestation failed');
    expect(lstatSync(run.output).mode & 0o777).toBe(0o700);
    expect(readdirSync(run.output)).toEqual([]);
    expect(readFileSync(run.summary, 'utf8')).not.toContain(SERVICE_KEY);
  });

  it('establishes destination writability before RPC access', async () => {
    const run = harness();
    chmodSync(run.runnerTemp, 0o500);
    const fetchImpl = vi.fn<typeof fetch>();
    try {
      await expect(
        runAttestAc265ApprovedOutageTarget({
          env: run.env,
          fetchImpl,
          now: () => NOW,
        }),
      ).rejects.toThrow('AC265 approved outage-target attestation failed');
      expect(fetchImpl).not.toHaveBeenCalled();
      expect(readdirSync(run.runnerTemp)).toEqual(['summary.md']);
    } finally {
      chmodSync(run.runnerTemp, 0o700);
    }
  });
});
