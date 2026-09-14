import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAc265CandidateEnrollment } from '../infra/workflows/ac265-candidate-enrollment.ts';
import { runRegisterAc265CandidateEnrollment } from '../infra/workflows/register-ac265-candidate-enrollment.ts';
import { verifyAc265CandidateProvenance } from '../infra/workflows/ac265-candidate-provenance.ts';
import { AC265_STAGING_API_ORIGIN } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import { createCandidateFixture } from './ac265-candidate-artifact-fixture.ts';
import {
  createInputs,
  createMockGitHubApi,
  SUPABASE_PROJECT_REF,
  WEB_ORIGIN,
} from './ac265-candidate-provenance.test-support.ts';

const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = 'sb_secret_ac265-registration-fixture';
const CANDIDATE_REF =
  'ac265-candidate://staging/550e8400-e29b-41d4-a716-446655440000';
const entrypointPath = fileURLToPath(
  new URL(
    '../infra/workflows/register-ac265-candidate-enrollment.ts',
    import.meta.url,
  ),
);

let fixture: ReturnType<typeof createCandidateFixture>;
let runnerTemp: string;

beforeEach(() => {
  fixture = createCandidateFixture();
  runnerTemp = mkdtempSync(
    join(tmpdir(), 'ac265-enrollment-registration-test-'),
  );
});

afterEach(() => {
  fixture.close();
  rmSync(runnerTemp, { recursive: true, force: true });
});

const prepareRequest = async (): Promise<string> => {
  const api = createMockGitHubApi();
  const candidate = await verifyAc265CandidateProvenance(
    createInputs(fixture, { stagingApiOrigin: AC265_STAGING_API_ORIGIN }),
    api.fetchImpl,
  );
  const request = await buildAc265CandidateEnrollment(candidate, {
    hostingAccountId: 'f'.repeat(32),
    stagingWebOrigin: WEB_ORIGIN,
    stagingApiOrigin: AC265_STAGING_API_ORIGIN,
    supabaseProjectRef: SUPABASE_PROJECT_REF,
    supabaseOrigin: SUPABASE_URL,
  });
  const requestPath = join(
    runnerTemp,
    'ac265-candidate-enrollment-request.json',
  );
  writeFileSync(requestPath, `${JSON.stringify(request)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  return requestPath;
};

const environmentFor = (requestPath: string) => {
  const githubOutput = join(runnerTemp, 'github-output');
  const githubSummary = join(runnerTemp, 'github-summary');
  writeFileSync(githubOutput, '');
  writeFileSync(githubSummary, '');
  return {
    RUNNER_TEMP: runnerTemp,
    AC265_ENROLLMENT_REQUEST_PATH: requestPath,
    SUPABASE_URL,
    SUPABASE_PROJECT_REF,
    SUPABASE_SECRET_KEY: SERVICE_ROLE_KEY,
    GITHUB_OUTPUT: githubOutput,
    GITHUB_STEP_SUMMARY: githubSummary,
  };
};

const resultFor = (identitySha256: string) => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-candidate-enrollment-v1',
  candidateRef: CANDIDATE_REF,
  identitySha256,
  status: 'enrolled',
  redacted: true,
});

describe('AC265 protected candidate enrollment registration step', () => {
  it('persists only the validated server candidateRef to the step output and run summary', async () => {
    const requestPath = await prepareRequest();
    const env = environmentFor(requestPath);
    let body = '';
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      body = String(init?.body);
      const request = JSON.parse(body) as {
        p_request: { identitySha256: string };
      };
      return new Response(
        JSON.stringify(resultFor(request.p_request.identitySha256)),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    });

    const result = await runRegisterAc265CandidateEnrollment({
      env,
      fetchImpl,
    });

    expect(result.candidateRef).toBe(CANDIDATE_REF);
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).toBe(
      `candidate_ref=${CANDIDATE_REF}\n`,
    );
    expect(readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8')).toBe(
      `## AC265 candidate enrolled\n\nCandidate reference: \`${CANDIDATE_REF}\`\n`,
    );
    expect(body).not.toContain(SERVICE_ROLE_KEY);
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).not.toContain(
      SERVICE_ROLE_KEY,
    );
    expect(readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8')).not.toContain(
      SERVICE_ROLE_KEY,
    );
  });

  it('rejects request paths outside the exact runner-temp request file before RPC', async () => {
    const requestPath = await prepareRequest();
    const env = {
      ...environmentFor(requestPath),
      AC265_ENROLLMENT_REQUEST_PATH: join(runnerTemp, 'other.json'),
    };
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      runRegisterAc265CandidateEnrollment({ env, fetchImpl }),
    ).rejects.toThrow('AC265 candidate enrollment failed');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).toBe('');
  });

  it('requires the protected Supabase origin and project reference to match the verified request before RPC', async () => {
    const requestPath = await prepareRequest();
    const env = {
      ...environmentFor(requestPath),
      SUPABASE_URL: 'https://zyxwvutsrqponmlkjihg.supabase.co',
      SUPABASE_PROJECT_REF: 'zyxwvutsrqponmlkjihg',
    };
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      runRegisterAc265CandidateEnrollment({ env, fetchImpl }),
    ).rejects.toThrow('AC265 candidate enrollment failed');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).toBe('');
  });

  it('does not persist a candidateRef when the database returns a conflict or invalid receipt', async () => {
    const requestPath = await prepareRequest();
    const env = environmentFor(requestPath);
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response('{"status":"conflict"}', { status: 200 }),
    );

    await expect(
      runRegisterAc265CandidateEnrollment({ env, fetchImpl }),
    ).rejects.toThrow('AC265 candidate enrollment failed');
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).toBe('');
    expect(readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8')).toBe('');
  });

  it('emits only a generic CLI error when configuration is invalid', () => {
    const sentinel = 'sb_secret_do-not-print';
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', entrypointPath],
      {
        cwd: fixture.workspaceRoot,
        env: {
          PATH: process.env.PATH ?? '/usr/bin:/bin',
          SUPABASE_SECRET_KEY: sentinel,
        },
        encoding: 'utf8',
      },
    );
    const output = `${result.stdout}${result.stderr}`;

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(output).toContain('AC265 candidate enrollment failed');
    expect(output).not.toContain(sentinel);
    expect(output).not.toContain('Error:');
  });
});
