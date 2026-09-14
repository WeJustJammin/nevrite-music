import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  type ContentSchemaRegistryAc265PrepareRunRequest,
  type ContentSchemaRegistryAc265RunnerAuthorization,
} from '@wejammin/contracts';

import { requestAc265HostedRunAuthorization } from '../infra/workflows/ac265-github-oidc-client.ts';
import {
  runAc265HostedRunnerAuthorization,
  type RunAc265HostedRunnerAuthorizationOptions,
} from '../infra/workflows/run-ac265-hosted-runner-authorization.ts';

const CANDIDATE_REF =
  'ac265-candidate://staging/550e8400-e29b-41d4-a716-446655440000';
const FIRST_RUN_ID = '10000000-0000-4000-8000-000000000001';
const SECOND_RUN_ID = '10000000-0000-4000-8000-000000000002';
const OIDC_REQUEST_URL =
  'https://pipelines.actions.githubusercontent.com/runner/_apis/idtoken';
const OIDC_REQUEST_TOKEN = 'runner-request-secret-credential';
const RAW_GITHUB_OIDC_JWT = 'header.payload.raw-github-oidc-token';
const SOURCE_REVISION = 'a'.repeat(40);
const IDENTITY_SHA256 = 'b'.repeat(64);
const FAILURE = 'AC265 hosted-runner authorization failed';
const ENTRYPOINT_PATH = fileURLToPath(
  new URL(
    '../infra/workflows/run-ac265-hosted-runner-authorization.ts',
    import.meta.url,
  ),
);

let scratchDirectory = '';

beforeEach(() => {
  scratchDirectory = mkdtempSync(join(tmpdir(), 'ac265-runner-authorization-'));
});

afterEach(() => {
  rmSync(scratchDirectory, { recursive: true, force: true });
});

const authorizationFor = (
  runId: string,
): ContentSchemaRegistryAc265RunnerAuthorization => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  authorizationRef:
    'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  runId,
  identitySha256: IDENTITY_SHA256,
  sourceRevision: SOURCE_REVISION,
  deploymentId: '6428523608',
  githubRunId: '34796668543',
  githubRunAttempt: 1,
  workflowSha: SOURCE_REVISION,
  authorizedAt: '2026-09-14T01:45:00.000Z',
  expiresAt: '2026-09-14T01:50:00.000Z',
  state: 'authorized',
  redacted: true,
});

const createFixture = (): Readonly<{
  env: Readonly<Record<string, string | undefined>>;
  summaryPath: string;
}> => {
  const summaryPath = join(scratchDirectory, 'step-summary.md');
  writeFileSync(summaryPath, '', 'utf8');
  return {
    env: {
      AC265_CANDIDATE_REF: CANDIDATE_REF,
      ACTIONS_ID_TOKEN_REQUEST_URL: OIDC_REQUEST_URL,
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: OIDC_REQUEST_TOKEN,
      GITHUB_STEP_SUMMARY: summaryPath,
      GITHUB_RUN_ID: '34796668543',
      AC265_RUN_ID: 'caller-controlled-run-id',
    },
    summaryPath,
  };
};

const authorizationOptions = (
  values: Pick<RunAc265HostedRunnerAuthorizationOptions, 'env'> &
    Partial<Omit<RunAc265HostedRunnerAuthorizationOptions, 'env'>>,
): RunAc265HostedRunnerAuthorizationOptions => ({
  env: values.env,
  ...(values.createRunId ? { createRunId: values.createRunId } : {}),
  ...(values.requestAuthorization
    ? { requestAuthorization: values.requestAuthorization }
    : {}),
  ...(values.fetcher ? { fetcher: values.fetcher } : {}),
});

describe('AC265 protected runner authorization entrypoint', () => {
  it('loads under the raw Node runtime used by the protected workflow', () => {
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', ENTRYPOINT_PATH],
      {
        encoding: 'utf8',
        env: {},
      },
    );

    expect(result.status).toBe(1);
    expect(result.signal).toBeNull();
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain(FAILURE);
    expect(result.stderr).not.toContain('ERR_MODULE_NOT_FOUND');
    expect(result.stderr).not.toContain('@wejammin/contracts');
  });

  it('generates its own run ID, sends only the opaque candidate reference, and writes filtered metadata', async () => {
    const { env, summaryPath } = createFixture();
    const requestAuthorization = vi.fn<
      typeof requestAc265HostedRunAuthorization
    >(async (request: ContentSchemaRegistryAc265PrepareRunRequest) =>
      authorizationFor(request.runId),
    );
    const createRunId = vi.fn(() => FIRST_RUN_ID);

    await expect(
      runAc265HostedRunnerAuthorization(
        authorizationOptions({ env, createRunId, requestAuthorization }),
      ),
    ).resolves.toEqual({
      authorizationRef:
        'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
      runId: FIRST_RUN_ID,
      expiresAt: '2026-09-14T01:50:00.000Z',
      state: 'authorized',
    });

    expect(createRunId).toHaveBeenCalledOnce();
    const [request, options] = requestAuthorization.mock.calls[0]!;
    expect(request).toEqual({
      criterion: 'P2-S09-AC-265',
      schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
      runId: FIRST_RUN_ID,
      candidateRef: CANDIDATE_REF,
    });
    expect(Object.keys(request).sort()).toEqual([
      'candidateRef',
      'criterion',
      'runId',
      'schemaVersion',
    ]);
    expect(options.environment).toEqual({
      ACTIONS_ID_TOKEN_REQUEST_URL: OIDC_REQUEST_URL,
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: OIDC_REQUEST_TOKEN,
    });

    const summary = readFileSync(summaryPath, 'utf8');
    expect(summary).toContain(
      'Authorization foundation only. Hosted browser acceptance was not run.',
    );
    expect(summary).not.toContain('ac265-authorization://staging/');
    expect(summary).toContain(FIRST_RUN_ID);
    expect(summary).toContain('2026-09-14T01:50:00.000Z');
    for (const privateOrUnneededValue of [
      OIDC_REQUEST_TOKEN,
      RAW_GITHUB_OIDC_JWT,
      CANDIDATE_REF,
      IDENTITY_SHA256,
      SOURCE_REVISION,
      '6428523608',
    ])
      expect(summary).not.toContain(privateOrUnneededValue);
  });

  it('creates a new UUID for each invocation instead of reusing caller or GitHub run IDs', async () => {
    const { env } = createFixture();
    const requestAuthorization = vi.fn<
      typeof requestAc265HostedRunAuthorization
    >(async (request: ContentSchemaRegistryAc265PrepareRunRequest) =>
      authorizationFor(request.runId),
    );
    const createRunId = vi
      .fn<() => string>()
      .mockReturnValueOnce(FIRST_RUN_ID)
      .mockReturnValueOnce(SECOND_RUN_ID);

    await runAc265HostedRunnerAuthorization(
      authorizationOptions({ env, createRunId, requestAuthorization }),
    );
    await runAc265HostedRunnerAuthorization(
      authorizationOptions({ env, createRunId, requestAuthorization }),
    );

    expect(
      requestAuthorization.mock.calls.map(([request]) => request.runId),
    ).toEqual([FIRST_RUN_ID, SECOND_RUN_ID]);
    expect(requestAuthorization.mock.calls[0]?.[0].runId).not.toBe(
      env.GITHUB_RUN_ID,
    );
    expect(requestAuthorization.mock.calls[0]?.[0].runId).not.toBe(
      env.AC265_RUN_ID,
    );
  });

  it('rejects invalid candidate references before requesting OIDC authorization', async () => {
    const fixture = createFixture();
    const requestAuthorization =
      vi.fn<typeof requestAc265HostedRunAuthorization>();

    await expect(
      runAc265HostedRunnerAuthorization(
        authorizationOptions({
          env: {
            ...fixture.env,
            AC265_CANDIDATE_REF: 'https://attacker.example',
          },
          requestAuthorization,
        }),
      ),
    ).rejects.toThrow(FAILURE);
    expect(requestAuthorization).not.toHaveBeenCalled();
    expect(readFileSync(fixture.summaryPath, 'utf8')).toBe('');
  });

  it('rejects mismatched database authorization and redacts provider failures', async () => {
    const { env, summaryPath } = createFixture();
    const mismatched = vi.fn<typeof requestAc265HostedRunAuthorization>(
      async () => authorizationFor(SECOND_RUN_ID),
    );
    const createRunId = vi.fn(() => FIRST_RUN_ID);

    await expect(
      runAc265HostedRunnerAuthorization(
        authorizationOptions({
          env,
          createRunId,
          requestAuthorization: mismatched,
        }),
      ),
    ).rejects.toThrow(FAILURE);
    expect(readFileSync(summaryPath, 'utf8')).toBe('');

    const providerSecret = 'provider-error-containing-private-token';
    const failed = vi.fn<typeof requestAc265HostedRunAuthorization>(
      async () => {
        throw new Error(providerSecret);
      },
    );
    let captured: unknown;
    try {
      await runAc265HostedRunnerAuthorization(
        authorizationOptions({
          env,
          createRunId,
          requestAuthorization: failed,
        }),
      );
    } catch (error: unknown) {
      captured = error;
    }
    expect(String(captured)).toBe(`Error: ${FAILURE}`);
    expect(String(captured)).not.toContain(providerSecret);
    expect(readFileSync(summaryPath, 'utf8')).toBe('');
  });
});
