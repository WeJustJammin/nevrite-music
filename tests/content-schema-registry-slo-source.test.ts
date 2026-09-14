import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  verifyContentSchemaRegistrySloSource,
  writeContentSchemaRegistrySloSourceOutput,
} from '../infra/workflows/verify-content-schema-registry-slo-source';

const sourceRevision = 'a'.repeat(40);
const deploymentId = '123456789';
const apiUrl = 'https://api.github.com/';
const repository = 'owner/repo';
const token = 'synthetic-token';
const utcDay = '2026-09-05';
const successfulDeploymentAt = '2026-09-04T23:00:00.000Z';
const productionRunId = '700100';
const productionJobId = '5001';
const productionWorkflowId = 346315225;
const productionJobUrl = `https://github.com/${repository}/actions/runs/${productionRunId}/job/${productionJobId}`;

const deployment = (overrides: Record<string, unknown> = {}) => ({
  id: Number(deploymentId),
  environment: 'production',
  sha: sourceRevision,
  ref: 'main',
  task: 'deploy',
  created_at: '2026-09-04T22:00:00.000Z',
  updated_at: successfulDeploymentAt,
  ...overrides,
});

const statuses = [
  {
    id: 987,
    state: 'success',
    environment: 'production',
    created_at: successfulDeploymentAt,
    updated_at: successfulDeploymentAt,
    target_url: productionJobUrl,
    log_url: productionJobUrl,
  },
];

const productionWorkflow = (overrides: Record<string, unknown> = {}) => ({
  id: productionWorkflowId,
  name: 'Deploy production',
  path: '.github/workflows/deploy-production.yml',
  state: 'active',
  ...overrides,
});

const productionJob = (overrides: Record<string, unknown> = {}) => ({
  id: Number(productionJobId),
  run_id: Number(productionRunId),
  run_attempt: 1,
  workflow_name: 'Deploy production',
  name: 'deploy',
  status: 'completed',
  conclusion: 'success',
  head_sha: sourceRevision,
  head_branch: 'main',
  created_at: '2026-09-04T22:00:00.000Z',
  started_at: '2026-09-04T22:00:01.000Z',
  completed_at: successfulDeploymentAt,
  html_url: productionJobUrl,
  ...overrides,
});

const productionRun = (overrides: Record<string, unknown> = {}) => ({
  id: Number(productionRunId),
  run_attempt: 1,
  workflow_id: productionWorkflowId,
  name: 'Deploy production',
  path: '.github/workflows/deploy-production.yml',
  event: 'workflow_dispatch',
  status: 'completed',
  conclusion: 'success',
  head_sha: sourceRevision,
  head_branch: 'main',
  created_at: '2026-09-04T21:55:00.000Z',
  run_started_at: '2026-09-04T22:00:00.000Z',
  updated_at: successfulDeploymentAt,
  repository: { id: 123, full_name: repository },
  head_repository: { id: 123, full_name: repository },
  ...overrides,
});

const response = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const options = (overrides: Record<string, unknown> = {}) => ({
  apiUrl,
  repository,
  token,
  productionDeploymentId: deploymentId,
  sourceRevision,
  utcDay,
  now: () => Date.parse('2026-09-06T00:00:01.000Z'),
  ...overrides,
});

const fetchFor = (
  deploymentResponse: unknown = deployment(),
  statusResponse: unknown = statuses,
  jobResponse: unknown = productionJob(),
  workflowResponse: unknown = productionWorkflow(),
  runResponse: unknown = productionRun(),
) =>
  vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith(`/deployments/${deploymentId}`))
      return response(deploymentResponse);
    if (url.pathname.endsWith(`/deployments/${deploymentId}/statuses`))
      return response(statusResponse);
    if (url.pathname.endsWith(`/actions/jobs/${productionJobId}`))
      return response(jobResponse);
    if (url.pathname.endsWith('/actions/workflows/deploy-production.yml'))
      return response(workflowResponse);
    if (url.pathname.endsWith(`/actions/runs/${productionRunId}/attempts/1`))
      return response(runResponse);
    throw new Error('Unexpected test URL.');
  });

describe('AC211 production SLO source preflight', () => {
  it('accepts the exact production deployment and a complete UTC day after success', async () => {
    const fetchImpl = fetchFor();

    await expect(
      verifyContentSchemaRegistrySloSource(options(), fetchImpl),
    ).resolves.toEqual({
      windowStart: '2026-09-05T00:00:00.000Z',
      windowEnd: '2026-09-06T00:00:00.000Z',
      sourceRevision,
      deploymentId,
      productionDeployedAt: successfulDeploymentAt,
      queryId: 'wejammin-ac211-20260905',
    });

    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      `${apiUrl}repos/${repository}/deployments/${deploymentId}`,
    );
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      `${apiUrl}repos/${repository}/deployments/${deploymentId}/statuses?per_page=100&page=1`,
    );
    expect(fetchImpl.mock.calls[2]?.[0]).toBe(fetchImpl.mock.calls[1]?.[0]);
    expect(fetchImpl.mock.calls[3]?.[0]).toBe(
      `${apiUrl}repos/${repository}/actions/jobs/${productionJobId}`,
    );
    expect(fetchImpl.mock.calls[4]?.[0]).toBe(
      `${apiUrl}repos/${repository}/actions/workflows/deploy-production.yml`,
    );
    expect(fetchImpl.mock.calls[5]?.[0]).toBe(
      `${apiUrl}repos/${repository}/actions/runs/${productionRunId}/attempts/1`,
    );
    for (const [, init] of fetchImpl.mock.calls) {
      expect(init?.method).toBe('GET');
      expect(init?.body).toBeUndefined();
      expect(init?.headers).toMatchObject({
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      });
    }
  });

  it.each([
    ['wrong deployment environment', { environment: 'staging' }],
    ['wrong deployment ID', { id: 987654321 }],
    ['wrong deployed source SHA', { sha: 'b'.repeat(40) }],
  ])('rejects %s', async (_label, overrides) => {
    await expect(
      verifyContentSchemaRegistrySloSource(
        options(),
        fetchFor(deployment(overrides)),
      ),
    ).rejects.toThrow();
  });

  it('rejects a successful protected deployment linked to a non-deploy workflow', async () => {
    const collectionJob = productionJob({
      workflow_name: 'Collect production AC211 SLO evidence',
      name: 'collect',
    });
    await expect(
      verifyContentSchemaRegistrySloSource(
        options(),
        fetchFor(deployment(), statuses, collectionJob),
      ),
    ).rejects.toThrow(/Deploy production/u);
  });

  it.each([
    ['wrong run SHA', { head_sha: 'b'.repeat(40) }],
    [
      'wrong workflow path',
      { path: '.github/workflows/collect-production-ac211.yml' },
    ],
    ['wrong workflow ID', { workflow_id: productionWorkflowId + 1 }],
    ['unsuccessful workflow run', { conclusion: 'failure' }],
    ['wrong source branch', { head_branch: 'release' }],
  ])('rejects a Deploy production run with %s', async (_label, overrides) => {
    await expect(
      verifyContentSchemaRegistrySloSource(
        options(),
        fetchFor(
          deployment(),
          statuses,
          productionJob(),
          productionWorkflow(),
          productionRun(overrides),
        ),
      ),
    ).rejects.toThrow(/Deploy production/u);
  });

  it('rejects deployment status links that do not identify one exact GitHub job', async () => {
    const mismatchedStatus = {
      ...statuses[0],
      log_url: `https://github.com/${repository}/actions/runs/700101/job/${productionJobId}`,
    };

    await expect(
      verifyContentSchemaRegistrySloSource(
        options(),
        fetchFor(deployment(), [mismatchedStatus]),
      ),
    ).rejects.toThrow(/Deploy production/u);
  });

  it('requires the latest deployment status to be successful', async () => {
    const failedAfterSuccess = [
      ...statuses,
      {
        id: 988,
        state: 'failure',
        environment: 'production',
        created_at: '2026-09-04T23:30:00.000Z',
        updated_at: '2026-09-04T23:30:00.000Z',
      },
    ];

    await expect(
      verifyContentSchemaRegistrySloSource(
        options(),
        fetchFor(deployment(), failedAfterSuccess),
      ),
    ).rejects.toThrow(/successful production deployment status/u);
  });

  it('requires the latest successful status to prove production identity', async () => {
    const statusWithoutEnvironment = Object.fromEntries(
      Object.entries(statuses[0]!).filter(([key]) => key !== 'environment'),
    );

    await expect(
      verifyContentSchemaRegistrySloSource(
        options(),
        fetchFor(deployment(), [statusWithoutEnvironment]),
      ),
    ).rejects.toThrow(/not production/u);
  });

  it.each([
    ['invalid day shape', '2026-9-05'],
    ['current day', '2026-09-06'],
    ['future day', '2026-09-07'],
  ])('rejects a %s', async (_label, day) => {
    await expect(
      verifyContentSchemaRegistrySloSource(options({ utcDay: day })),
    ).rejects.toThrow();
  });

  it('rejects malformed inputs before making a GitHub request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      verifyContentSchemaRegistrySloSource(
        options({
          apiUrl: 'http://api.github.test/',
          repository: 'owner',
          token: '',
          productionDeploymentId: 'not-a-number',
          sourceRevision: 'A'.repeat(40),
        }),
        fetchImpl,
      ),
    ).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fails safely on HTTP errors without exposing the token or response body', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response(`provider token ${token}`, { status: 403 }),
    );

    const result = verifyContentSchemaRegistrySloSource(options(), fetchImpl);

    await expect(result).rejects.toThrow(/HTTP 403/u);
    await expect(result).rejects.not.toThrow(token);
  });

  it('rejects oversized GitHub responses before parsing them', async () => {
    const oversized = `{"id":${'1'.repeat(1_100_000)}}`;
    const fetchImpl = vi.fn<typeof fetch>(
      async () =>
        new Response(oversized, {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );

    await expect(
      verifyContentSchemaRegistrySloSource(options(), fetchImpl),
    ).rejects.toThrow(/response is too large/u);
  });

  it('maps transport failures to a secret-safe error', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`transport leaked ${token}`);
    });

    const result = verifyContentSchemaRegistrySloSource(options(), fetchImpl);

    await expect(result).rejects.toThrow(/API request failed/u);
    await expect(result).rejects.not.toThrow(token);
  });

  it('aborts a GitHub request after the configured timeout', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise<Response>((resolve, reject) => {
          void resolve;
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('aborted')),
          );
        }),
    );

    await expect(
      verifyContentSchemaRegistrySloSource(
        options({ timeoutMs: 1 }),
        fetchImpl,
      ),
    ).rejects.toThrow(/API request failed/u);
  });

  it('writes only the safe preflight outputs to GITHUB_OUTPUT', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'wejammin-ac211-source-'));
    try {
      const outputPath = join(sandbox, 'github-output');
      writeContentSchemaRegistrySloSourceOutput(
        {
          windowStart: '2026-09-05T00:00:00.000Z',
          windowEnd: '2026-09-06T00:00:00.000Z',
          sourceRevision,
          deploymentId,
          productionDeployedAt: successfulDeploymentAt,
          queryId: 'wejammin-ac211-20260905',
        },
        outputPath,
      );

      expect(readFileSync(outputPath, 'utf8')).toBe(
        [
          'window_start=2026-09-05T00:00:00.000Z',
          'window_end=2026-09-06T00:00:00.000Z',
          `source_revision=${sourceRevision}`,
          `production_deployment_id=${deploymentId}`,
          `production_deployed_at=${successfulDeploymentAt}`,
          'query_id=wejammin-ac211-20260905',
          '',
        ].join('\n'),
      );
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
