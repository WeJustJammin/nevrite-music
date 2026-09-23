import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runRegisterAc265ApprovedRegistry } from '../infra/workflows/register-ac265-approved-registry.ts';
import { makeContract } from './contracts/ac265-hosted-test-fixtures.ts';

const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = 'synthetic_service_key_ac265-approved-registry-entrypoint-fixture';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/72000000-0000-4000-8000-000000000001';
const SAFE_RESOURCE_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001';
const MAPPING_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000002';
const LOCATOR_SHA256 = 'b'.repeat(64);
const RESOURCE_REF =
  'ac265-resource://content_schema/74000000-0000-4000-8000-000000000001';
const MAPPING_ID = '76000000-0000-4000-8000-000000000007';
const APPROVED_AT = '2026-09-21T13:00:00.000Z';
const FAILURE = 'AC265 registry registration failed';

const contract = makeContract();
const entrypointPath = fileURLToPath(
  new URL(
    '../infra/workflows/register-ac265-approved-registry.ts',
    import.meta.url,
  ),
);

const safeResourceRequest = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  resourceKind: 'content_schema',
  locatorSha256: LOCATOR_SHA256,
  idempotencyRef: SAFE_RESOURCE_IDEMPOTENCY_REF,
} as const;

const safeResourceResult = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  idempotencyRef: SAFE_RESOURCE_IDEMPOTENCY_REF,
  resource: {
    kind: 'content_schema',
    ref: RESOURCE_REF,
    sha256: 'c'.repeat(64),
  },
  locatorSha256: LOCATOR_SHA256,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  approvedAt: APPROVED_AT,
  redacted: true,
});

const mappingRequest = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  idempotencyRef: MAPPING_IDEMPOTENCY_REF,
  roleResourceBindings: contract.roleResourceBindings,
  scenarioRoleBindings: contract.scenarioRoleBindings,
} as const;

const mappingResult = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-registry-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  idempotencyRef: MAPPING_IDEMPOTENCY_REF,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  redacted: true,
  mapping: {
    schemaVersion: 'ac265-approved-runner-mappings-v1',
    source: 'protected-ac265-runner-mapping-control-plane',
    mappingId: MAPPING_ID,
    approvedAt: APPROVED_AT,
    runId: contract.runId,
    identity: contract.identity,
    roleResourceBindings: contract.roleResourceBindings,
    scenarioRoleBindings: contract.scenarioRoleBindings,
  },
  resources: contract.resourceRefs,
});

let runnerTemp: string;

beforeEach(() => {
  runnerTemp = mkdtempSync(join(tmpdir(), 'ac265-registry-registration-test-'));
});

afterEach(() => {
  rmSync(runnerTemp, { recursive: true, force: true });
});

const requestPath = () =>
  join(runnerTemp, 'ac265-registry-registration-request.json');

const writeRequest = (request: unknown): string => {
  const path = requestPath();
  writeFileSync(path, `${JSON.stringify(request)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  return path;
};

const environmentFor = (path: string) => {
  const githubOutput = join(runnerTemp, 'github-output');
  const githubSummary = join(runnerTemp, 'github-summary');
  writeFileSync(githubOutput, '');
  writeFileSync(githubSummary, '');
  return {
    RUNNER_TEMP: runnerTemp,
    AC265_REGISTRY_REGISTRATION_REQUEST_PATH: path,
    SUPABASE_URL,
    SUPABASE_PROJECT_REF,
    SUPABASE_SECRET_KEY: SERVICE_ROLE_KEY,
    GITHUB_OUTPUT: githubOutput,
    GITHUB_STEP_SUMMARY: githubSummary,
  };
};

const responseFor = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('AC265 registry registration transport step (plumbing only)', () => {
  it('registers a safe resource and persists only the server-derived reference and kind', async () => {
    const env = environmentFor(writeRequest(safeResourceRequest));
    let body = '';
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      body = String(init?.body);
      return responseFor(safeResourceResult());
    });

    const result = await runRegisterAc265ApprovedRegistry({ env, fetchImpl });

    expect(result).toEqual({
      outcome: 'safe_resource_registered',
      resourceRef: RESOURCE_REF,
      resourceKind: 'content_schema',
    });
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).toBe(
      `registration_outcome=safe_resource_registered\nresource_ref=${RESOURCE_REF}\nresource_kind=content_schema\n`,
    );
    const summary = readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8');
    expect(summary).toContain('AC265 registry safe-resource row registered');
    expect(summary).toContain(RESOURCE_REF);
    expect(body).not.toContain(SERVICE_ROLE_KEY);
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).not.toContain(
      SERVICE_ROLE_KEY,
    );
    expect(summary).not.toContain(SERVICE_ROLE_KEY);
    expect(summary).not.toContain(LOCATOR_SHA256);
  });

  it('registers an approved runner mapping and persists only the server-derived mapping id', async () => {
    const env = environmentFor(writeRequest(mappingRequest));
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(mappingResult()),
    );

    const result = await runRegisterAc265ApprovedRegistry({ env, fetchImpl });

    expect(result).toEqual({
      outcome: 'runner_mapping_registered',
      mappingId: MAPPING_ID,
    });
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).toBe(
      `registration_outcome=runner_mapping_registered\nmapping_id=${MAPPING_ID}\n`,
    );
    expect(readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8')).toContain(MAPPING_ID);
  });

  it('rejects request paths outside the exact runner-temp request file before RPC', async () => {
    writeRequest(safeResourceRequest);
    const env = {
      ...environmentFor(requestPath()),
      AC265_REGISTRY_REGISTRATION_REQUEST_PATH: join(runnerTemp, 'other.json'),
    };
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      runRegisterAc265ApprovedRegistry({ env, fetchImpl }),
    ).rejects.toThrow(FAILURE);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).toBe('');
  });

  it('requires the full registration environment before RPC', async () => {
    const path = writeRequest(safeResourceRequest);
    for (const name of [
      'RUNNER_TEMP',
      'AC265_REGISTRY_REGISTRATION_REQUEST_PATH',
      'SUPABASE_URL',
      'SUPABASE_PROJECT_REF',
      'SUPABASE_SECRET_KEY',
      'GITHUB_OUTPUT',
      'GITHUB_STEP_SUMMARY',
    ] as const) {
      const env = { ...environmentFor(path) };
      delete (env as Record<string, string | undefined>)[name];
      const fetchImpl = vi.fn<typeof fetch>();
      await expect(
        runRegisterAc265ApprovedRegistry({ env, fetchImpl }),
      ).rejects.toThrow(FAILURE);
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it('rejects an oversized or schema-invalid request file before RPC', async () => {
    const oversized = writeRequest({
      ...safeResourceRequest,
      padding: 'x'.repeat(33 * 1024),
    });
    const oversizedEnv = environmentFor(oversized);
    const oversizedFetch = vi.fn<typeof fetch>();
    await expect(
      runRegisterAc265ApprovedRegistry({
        env: oversizedEnv,
        fetchImpl: oversizedFetch,
      }),
    ).rejects.toThrow(FAILURE);
    expect(oversizedFetch).not.toHaveBeenCalled();
    expect(readFileSync(oversizedEnv.GITHUB_OUTPUT, 'utf8')).toBe('');

    const invalid = writeRequest({ ...safeResourceRequest, resourceKind: 'x' });
    const invalidEnv = environmentFor(invalid);
    const invalidFetch = vi.fn<typeof fetch>();
    await expect(
      runRegisterAc265ApprovedRegistry({
        env: invalidEnv,
        fetchImpl: invalidFetch,
      }),
    ).rejects.toThrow(FAILURE);
    expect(invalidFetch).not.toHaveBeenCalled();
    expect(readFileSync(invalidEnv.GITHUB_OUTPUT, 'utf8')).toBe('');
  });

  it('does not persist a reference when the database returns a conflict', async () => {
    const env = environmentFor(writeRequest(safeResourceRequest));
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor({ status: 'conflict' }),
    );

    await expect(
      runRegisterAc265ApprovedRegistry({ env, fetchImpl }),
    ).rejects.toThrow(FAILURE);
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).toBe('');
    expect(readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8')).toBe('');
  });

  it('fails closed when the output and summary paths are identical', async () => {
    const env = environmentFor(writeRequest(safeResourceRequest));
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      runRegisterAc265ApprovedRegistry({
        env: { ...env, GITHUB_STEP_SUMMARY: env.GITHUB_OUTPUT },
        fetchImpl,
      }),
    ).rejects.toThrow(FAILURE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('emits only a generic CLI error when configuration is invalid', () => {
    const sentinel = 'synthetic_service_key_do-not-print';
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', entrypointPath],
      {
        cwd: runnerTemp,
        env: {
          PATH: process.env.PATH ?? '/usr/bin:/bin',
          RUNNER_TEMP: runnerTemp,
          SUPABASE_SECRET_KEY: sentinel,
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
  });
});
