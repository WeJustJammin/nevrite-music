import { describe, expect, it, vi } from 'vitest';

import {
  verifyProductionJob,
  verifyProductionJobReference,
} from '../infra/workflows/content-schema-registry-slo-deployment-provenance';
import { verifyContentSchemaRegistrySloSource } from '../infra/workflows/verify-content-schema-registry-slo-source';

const owner = 'WeJustJammin';
const name = 'wejammin';
const repository = `${owner}/${name}`;
// The repository was renamed from the historical slug below. GitHub keeps the
// immutable repository identity across the rename, so deployment statuses
// recorded before the rename still carry the historical slug.
const historicalSlug = `${owner}/nevrite-music`;
const runId = '34734646414';
const jobId = '103663753152';
const runAttempt = 1;
const workflowId = 346315225;
const sourceRevision = 'c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2';
const jobCompletedAt = '2026-09-13T03:07:54Z';
const canonicalJobUrl = `https://github.com/${repository}/actions/runs/${runId}/job/${jobId}`;
const historicalJobUrl = `https://github.com/${historicalSlug}/actions/runs/${runId}/job/${jobId}`;

const expectedJobReference = {
  runId,
  jobId,
  canonicalUrl: canonicalJobUrl,
};

const statusFor = (url: string): Record<string, unknown> => ({
  id: 18279133704,
  state: 'success',
  environment: 'production',
  created_at: jobCompletedAt,
  updated_at: jobCompletedAt,
  target_url: url,
  log_url: url,
});

const jobFor = (overrides: Record<string, unknown> = {}) => ({
  id: Number(jobId),
  run_id: Number(runId),
  run_attempt: runAttempt,
  workflow_name: 'Deploy production',
  name: 'deploy',
  status: 'completed',
  conclusion: 'success',
  head_sha: sourceRevision,
  head_branch: 'main',
  created_at: '2026-09-13T03:06:10Z',
  started_at: '2026-09-13T03:06:12Z',
  completed_at: jobCompletedAt,
  html_url: canonicalJobUrl,
  ...overrides,
});

describe('AC211 production deployment job reference', () => {
  it('accepts the canonical production job URL and derives the canonical URL', () => {
    expect(
      verifyProductionJobReference(statusFor(canonicalJobUrl), owner, name),
    ).toEqual(expectedJobReference);
  });

  it('accepts the verified historical repository alias recorded at deploy time', () => {
    expect(
      verifyProductionJobReference(statusFor(historicalJobUrl), owner, name),
    ).toEqual(expectedJobReference);
  });

  it.each([
    [
      'a renamed fork',
      `https://github.com/${owner}/nevrite-music-fork/actions/runs/${runId}/job/${jobId}`,
    ],
    [
      'an archived successor name',
      `https://github.com/${owner}/wejammin-archive/actions/runs/${runId}/job/${jobId}`,
    ],
    [
      'a truncated repository name',
      `https://github.com/${owner}/nevrite/actions/runs/${runId}/job/${jobId}`,
    ],
    [
      'a hostile owner reusing the repository name',
      `https://github.com/AnotherOwner/${name}/actions/runs/${runId}/job/${jobId}`,
    ],
    [
      'a hostile owner reusing the historical name',
      `https://github.com/AnotherOwner/nevrite-music/actions/runs/${runId}/job/${jobId}`,
    ],
  ])('rejects an unrelated repository alias: %s', (_label, url) => {
    expect(() =>
      verifyProductionJobReference(statusFor(url), owner, name),
    ).toThrow(/Deploy production/u);
  });

  it('rejects a repository that has no verified historical alias', () => {
    expect(() =>
      verifyProductionJobReference(
        statusFor(
          `https://github.com/owner/legacy/actions/runs/${runId}/job/${jobId}`,
        ),
        'owner',
        'repo',
      ),
    ).toThrow(/Deploy production/u);
  });

  it('rejects status links that disagree on the bound job', () => {
    const mismatched = {
      ...statusFor(historicalJobUrl),
      log_url: `https://github.com/${repository}/actions/runs/${runId}/job/103663753153`,
    };
    expect(() => verifyProductionJobReference(mismatched, owner, name)).toThrow(
      /Deploy production/u,
    );
  });
});

describe('AC211 API job binding across the repository rename', () => {
  it('binds the canonical API job URL to historical status URLs', () => {
    expect(
      verifyProductionJob(jobFor(), expectedJobReference, sourceRevision),
    ).toEqual({
      runId,
      runAttempt,
      createdAt: Date.parse('2026-09-13T03:06:10Z'),
      startedAt: Date.parse('2026-09-13T03:06:12Z'),
      completedAt: Date.parse(jobCompletedAt),
    });
  });

  it('rejects a job whose API URL does not bind to the canonical repository', () => {
    expect(() =>
      verifyProductionJob(
        jobFor({ html_url: historicalJobUrl }),
        expectedJobReference,
        sourceRevision,
      ),
    ).toThrow(/Deploy production/u);
  });
});

const response = (value: unknown): Response =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const deploymentId = '6417116181';
const deployment = {
  id: Number(deploymentId),
  environment: 'production',
  sha: sourceRevision,
  ref: 'main',
  task: 'deploy',
  created_at: '2026-09-13T03:06:08Z',
  updated_at: jobCompletedAt,
};
const productionJob = jobFor();
const productionWorkflow = {
  id: workflowId,
  name: 'Deploy production',
  path: '.github/workflows/deploy-production.yml',
  state: 'active',
};
const productionRun = {
  id: Number(runId),
  run_attempt: runAttempt,
  workflow_id: workflowId,
  name: 'Deploy production',
  path: '.github/workflows/deploy-production.yml',
  event: 'workflow_dispatch',
  status: 'completed',
  conclusion: 'success',
  head_sha: sourceRevision,
  head_branch: 'main',
  created_at: '2026-09-13T03:05:00Z',
  run_started_at: deployment.created_at,
  updated_at: jobCompletedAt,
  repository: { id: 1297208152, full_name: repository },
  head_repository: { id: 1297208152, full_name: repository },
};

const fetchFor = (
  statusUrl: string,
  runOverrides: Record<string, unknown> = {},
) =>
  vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith(`/deployments/${deploymentId}`))
      return response(deployment);
    if (url.pathname.endsWith(`/deployments/${deploymentId}/statuses`))
      return response([statusFor(statusUrl)]);
    if (url.pathname.endsWith(`/actions/jobs/${jobId}`))
      return response(productionJob);
    if (url.pathname.endsWith('/actions/workflows/deploy-production.yml'))
      return response(productionWorkflow);
    if (url.pathname.endsWith(`/actions/runs/${runId}/attempts/${runAttempt}`))
      return response({ ...productionRun, ...runOverrides });
    throw new Error('Unexpected test URL.');
  });

const runPreflight = (
  statusUrl: string,
  runOverrides: Record<string, unknown> = {},
) =>
  verifyContentSchemaRegistrySloSource(
    {
      apiUrl: 'https://api.github.com/',
      repository,
      token: 'synthetic-token',
      productionDeploymentId: deploymentId,
      sourceRevision,
      utcDay: '2026-09-14',
      now: () => Date.parse('2026-09-15T00:00:01Z'),
    },
    fetchFor(statusUrl, runOverrides),
  );

describe('AC211 production SLO source preflight across the repository rename', () => {
  it('verifies provenance recorded under the historical repository slug', async () => {
    await expect(runPreflight(historicalJobUrl)).resolves.toEqual({
      windowStart: '2026-09-14T00:00:00.000Z',
      windowEnd: '2026-09-15T00:00:00.000Z',
      sourceRevision,
      deploymentId,
      productionDeployedAt: new Date(Date.parse(jobCompletedAt)).toISOString(),
      queryId: 'wejammin-ac211-20260914',
    });
  });

  it('still rejects a deployment status linked to an unrelated repository alias', async () => {
    await expect(
      runPreflight(
        `https://github.com/AnotherOwner/nevrite-music/actions/runs/${runId}/job/${jobId}`,
      ),
    ).rejects.toThrow(/Deploy production/u);
  });
});

// GitHub backfills the workflow-run `run_started_at` from the assigned runner
// slot, so a genuine, successfully completed Deploy production run can record a
// `run_started_at` that precedes its own `created_at`. Observed on real record
// 6400415025 (run 34639861376, job 103396669995), where created_at is
// 2026-09-11T19:37:47Z and run_started_at is 2026-09-11T19:37:46Z. The strict
// `createdAt > startedAt` ordering rejected that genuine deployment.
describe('AC211 production run record timestamp ordering', () => {
  const runOffsets = (createdAt: string, runStartedAt: string) => ({
    created_at: createdAt,
    run_started_at: runStartedAt,
  });

  it('accepts a run whose runner-start timestamp precedes its creation by one second', async () => {
    await expect(
      runPreflight(
        canonicalJobUrl,
        runOffsets('2026-09-13T03:05:01Z', '2026-09-13T03:05:00Z'),
      ),
    ).resolves.toMatchObject({ deploymentId, sourceRevision });
  });

  it.each([1, 2, 3, 4, 5])(
    'accepts a runner-start backfill of %s second(s) within the bound',
    async (seconds) => {
      const createdAt = '2026-09-13T03:05:06Z';
      const runStartedAt = new Date(
        Date.parse(createdAt) - seconds * 1000,
      ).toISOString();
      await expect(
        runPreflight(canonicalJobUrl, runOffsets(createdAt, runStartedAt)),
      ).resolves.toMatchObject({ deploymentId, sourceRevision });
    },
  );

  it.each([6, 60, 3600])(
    'still rejects a runner-start backfill of %s seconds beyond the bound',
    async (seconds) => {
      const createdAt = '2026-09-13T03:05:06Z';
      const runStartedAt = new Date(
        Date.parse(createdAt) - seconds * 1000,
      ).toISOString();
      await expect(
        runPreflight(canonicalJobUrl, runOffsets(createdAt, runStartedAt)),
      ).rejects.toThrow(/Deploy production/u);
    },
  );

  it('still rejects a run whose completion precedes its runner start', async () => {
    await expect(
      runPreflight(canonicalJobUrl, {
        run_started_at: '2026-09-13T03:05:00Z',
        updated_at: '2026-09-13T03:04:59Z',
      }),
    ).rejects.toThrow(/Deploy production/u);
  });

  it('still rejects a run whose creation exceeds the deployment timeline', async () => {
    await expect(
      runPreflight(canonicalJobUrl, {
        created_at: '2026-09-13T04:00:00Z',
        run_started_at: '2026-09-13T03:05:00Z',
      }),
    ).rejects.toThrow(/Deploy production/u);
  });
});
