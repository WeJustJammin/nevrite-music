import { describe, expect, it, vi } from 'vitest';

import { verifyContentSchemaRegistrySloSource } from '../infra/workflows/verify-content-schema-registry-slo-source';

const apiUrl = 'https://api.github.com/';
const repository = 'owner/repo';
const sourceRevision = 'a'.repeat(40);
const deploymentId = '123456789';
const runId = '700100';
const jobId = '5001';
const workflowId = 346315225;
const jobUrl = `https://github.com/${repository}/actions/runs/${runId}/job/${jobId}`;
const runStartedAt = '2026-09-04T22:00:00.000Z';
const jobCreatedAt = '2026-09-04T22:00:00.000Z';
const jobStartedAt = '2026-09-04T22:00:01.000Z';
const jobCompletedAt = '2026-09-04T23:00:00.000Z';
const deploymentCreatedAt = jobCreatedAt;
const statusAt = jobCompletedAt;

const baseDeployment = {
  id: Number(deploymentId),
  environment: 'production',
  sha: sourceRevision,
  ref: 'main',
  task: 'deploy',
  created_at: deploymentCreatedAt,
  updated_at: statusAt,
};

const baseStatus = {
  id: 987,
  state: 'success',
  environment: 'production',
  created_at: statusAt,
  updated_at: statusAt,
  target_url: jobUrl,
  log_url: jobUrl,
};

const baseJob = {
  id: Number(jobId),
  run_id: Number(runId),
  run_attempt: 1,
  workflow_name: 'Deploy production',
  name: 'deploy',
  status: 'completed',
  conclusion: 'success',
  head_sha: sourceRevision,
  head_branch: 'main',
  created_at: jobCreatedAt,
  started_at: jobStartedAt,
  completed_at: jobCompletedAt,
  html_url: jobUrl,
};

const baseRun = {
  id: Number(runId),
  run_attempt: 1,
  workflow_id: workflowId,
  name: 'Deploy production',
  path: '.github/workflows/deploy-production.yml',
  event: 'workflow_dispatch',
  status: 'completed',
  conclusion: 'success',
  head_sha: sourceRevision,
  head_branch: 'main',
  created_at: '2026-09-04T21:55:00.000Z',
  run_started_at: runStartedAt,
  updated_at: statusAt,
  repository: { id: 123, full_name: repository },
  head_repository: { id: 123, full_name: repository },
};

const baseWorkflow = {
  id: workflowId,
  name: 'Deploy production',
  path: '.github/workflows/deploy-production.yml',
  state: 'active',
};

type FixtureOverrides = Readonly<{
  deployment?: Record<string, unknown>;
  status?: Record<string, unknown>;
  statuses?: readonly Record<string, unknown>[];
  job?: Record<string, unknown>;
  run?: Record<string, unknown>;
}>;

const response = (value: unknown): Response =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const fetchFor = (overrides: FixtureOverrides = {}) =>
  vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith(`/deployments/${deploymentId}`))
      return response({ ...baseDeployment, ...overrides.deployment });
    if (url.pathname.endsWith(`/deployments/${deploymentId}/statuses`))
      return response(
        overrides.statuses ?? [{ ...baseStatus, ...overrides.status }],
      );
    if (url.pathname.endsWith(`/actions/jobs/${jobId}`))
      return response({ ...baseJob, ...overrides.job });
    if (url.pathname.endsWith('/actions/workflows/deploy-production.yml'))
      return response(baseWorkflow);
    if (url.pathname.endsWith(`/actions/runs/${runId}/attempts/1`))
      return response({ ...baseRun, ...overrides.run });
    throw new Error('Unexpected test URL.');
  });

const verify = (overrides: FixtureOverrides = {}) =>
  verifyContentSchemaRegistrySloSource(
    {
      apiUrl,
      repository,
      token: 'synthetic-bearer-token',
      productionDeploymentId: deploymentId,
      sourceRevision,
      utcDay: '2026-09-05',
      now: () => Date.parse('2026-09-06T00:00:01.000Z'),
    },
    fetchFor(overrides),
  );

describe('AC211 production deployment timeline provenance', () => {
  it.each([
    ['wrong deployment ref', { ref: 'release' }],
    ['wrong deployment task', { task: 'collect' }],
  ])('rejects a deployment with %s', async (_label, deployment) => {
    await expect(verify({ deployment })).rejects.toThrow();
  });

  it('rejects a successful deployment status created before job completion', async () => {
    await expect(
      verify({
        job: { completed_at: '2026-09-04T23:00:01.000Z' },
        run: { updated_at: '2026-09-04T23:00:02.000Z' },
      }),
    ).rejects.toThrow(/Deploy production/u);
  });

  it('rejects a status created before job completion even when updated later', async () => {
    await expect(
      verify({
        deployment: { updated_at: '2026-09-04T23:00:02.000Z' },
        status: {
          created_at: '2026-09-04T22:59:59.000Z',
          updated_at: '2026-09-04T23:00:02.000Z',
        },
        run: { updated_at: '2026-09-04T23:00:02.000Z' },
      }),
    ).rejects.toThrow(/Deploy production/u);
  });

  it('rejects an ambiguous latest timestamp across distinct statuses', async () => {
    await expect(
      verify({
        statuses: [baseStatus, { ...baseStatus, id: 988, state: 'failure' }],
      }),
    ).rejects.toThrow(/timestamps are ambiguous/u);
  });

  it.each([
    [
      'deployment predates the run',
      {
        deployment: { created_at: '2026-09-04T21:59:59.000Z' },
        job: { created_at: '2026-09-04T21:59:59.000Z' },
      },
    ],
    [
      'deployment creation follows job start',
      { deployment: { created_at: '2026-09-04T22:00:02.000Z' } },
    ],
    [
      'job completion follows run completion',
      { job: { completed_at: '2026-09-04T23:00:01.000Z' } },
    ],
    [
      'successful status follows run completion',
      {
        deployment: { updated_at: '2026-09-04T23:00:01.000Z' },
        status: {
          created_at: '2026-09-04T23:00:01.000Z',
          updated_at: '2026-09-04T23:00:01.000Z',
        },
      },
    ],
  ])(
    'rejects incompatible deployment/job/run timing: %s',
    async (_label, overrides) => {
      await expect(verify(overrides)).rejects.toThrow(/Deploy production/u);
    },
  );

  it('accepts deployment creation strictly between run start and job start', async () => {
    await expect(
      verify({
        deployment: { created_at: '2026-09-04T22:00:00.500Z' },
      }),
    ).resolves.toMatchObject({ productionDeployedAt: statusAt });
  });

  it('rejects a run attempt different from the linked production job', async () => {
    await expect(verify({ run: { run_attempt: 2 } })).rejects.toThrow(
      /Deploy production/u,
    );
  });

  it('rejects a run whose repository identity differs from the requested repo', async () => {
    await expect(
      verify({ run: { repository: { id: 123, full_name: 'owner/other' } } }),
    ).rejects.toThrow(/Deploy production/u);
  });

  it('uses the later verified job-completion or status timestamp as the SLO boundary', async () => {
    const laterStatusAt = '2026-09-04T23:00:05.000Z';
    await expect(
      verify({
        deployment: { updated_at: laterStatusAt },
        status: { created_at: laterStatusAt, updated_at: laterStatusAt },
        job: { completed_at: '2026-09-04T23:00:03.000Z' },
        run: { updated_at: laterStatusAt },
      }),
    ).resolves.toMatchObject({ productionDeployedAt: laterStatusAt });
  });

  it('rejects a deployment whose effective timestamp is after the UTC window starts', async () => {
    const afterWindowStart = '2026-09-05T00:00:00.001Z';
    await expect(
      verify({
        deployment: { updated_at: afterWindowStart },
        status: { created_at: afterWindowStart, updated_at: afterWindowStart },
        job: { completed_at: '2026-09-05T00:00:00.000Z' },
        run: { updated_at: afterWindowStart },
      }),
    ).rejects.toThrow(/window starts before/u);
  });
});
