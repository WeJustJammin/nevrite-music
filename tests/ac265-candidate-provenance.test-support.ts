import {
  API_ORIGIN,
  CI_ARTIFACT_ID,
  CI_RUN_ATTEMPT,
  CI_RUN_ID,
  CI_WORKFLOW_ID,
  DEPLOYMENT_ID,
  REPOSITORY,
  REPOSITORY_ID,
  SOURCE_SHA,
  STAGING_ARTIFACT_ID,
  STAGING_RUN_ATTEMPT,
  STAGING_RUN_ID,
  STAGING_WORKFLOW_ID,
  WEB_ORIGIN,
  type createCandidateFixture,
} from './ac265-candidate-artifact-fixture.ts';

export {
  API_ORIGIN,
  CI_ARTIFACT_ID,
  CI_RUN_ATTEMPT,
  CI_RUN_ID,
  CI_WORKFLOW_ID,
  DEPLOYMENT_ID,
  REPOSITORY,
  REPOSITORY_ID,
  SOURCE_SHA,
  STAGING_ARTIFACT_ID,
  STAGING_RUN_ATTEMPT,
  STAGING_RUN_ID,
  STAGING_WORKFLOW_ID,
  TOKEN,
  WEB_ORIGIN,
  candidateFileText,
  createCandidateFixture,
} from './ac265-candidate-artifact-fixture.ts';
import { TOKEN } from './ac265-candidate-artifact-fixture.ts';

const exactArtifactUrl = (artifactId: number, archive = false): string =>
  `https://api.github.com/repos/${REPOSITORY}/actions/artifacts/${artifactId}${archive ? '/zip' : ''}`;

const workflowRun = (
  type: 'ci' | 'staging',
  patch: Record<string, unknown> = {},
) => {
  const id = type === 'ci' ? Number(CI_RUN_ID) : Number(STAGING_RUN_ID);
  const path =
    type === 'ci'
      ? '.github/workflows/ci.yml@main'
      : '.github/workflows/deploy-staging.yml@main';
  return {
    id,
    workflow_id: type === 'ci' ? CI_WORKFLOW_ID : STAGING_WORKFLOW_ID,
    name: type === 'ci' ? 'CI' : 'Deploy staging',
    path,
    event: type === 'ci' ? 'push' : 'workflow_run',
    status: 'completed',
    conclusion: 'success',
    head_branch: 'main',
    head_sha: SOURCE_SHA,
    run_attempt: Number(type === 'ci' ? CI_RUN_ATTEMPT : STAGING_RUN_ATTEMPT),
    created_at:
      type === 'ci' ? '2026-09-08T12:00:00.000Z' : '2026-09-08T13:04:00.000Z',
    run_started_at:
      type === 'ci' ? '2026-09-08T12:01:00.000Z' : '2026-09-08T13:05:00.000Z',
    updated_at:
      type === 'ci' ? '2026-09-08T12:30:00.000Z' : '2026-09-08T13:30:00.000Z',
    repository: { id: REPOSITORY_ID, full_name: REPOSITORY },
    head_repository: { id: REPOSITORY_ID, full_name: REPOSITORY },
    actor: { login: 'release-operator' },
    ...patch,
  };
};

const artifact = (
  type: 'ci' | 'staging',
  patch: Record<string, unknown> = {},
) => {
  const artifactId = type === 'ci' ? CI_ARTIFACT_ID : STAGING_ARTIFACT_ID;
  const runId = Number(type === 'ci' ? CI_RUN_ID : STAGING_RUN_ID);
  return {
    id: artifactId,
    name:
      type === 'ci'
        ? `workspace-build-${SOURCE_SHA}`
        : 'staging-verified-candidate',
    size_in_bytes: 128,
    url: exactArtifactUrl(artifactId),
    archive_download_url: exactArtifactUrl(artifactId, true),
    expired: false,
    created_at:
      type === 'ci' ? '2026-09-08T12:20:00.000Z' : '2026-09-08T13:25:00.000Z',
    digest: `sha256:${(type === 'ci' ? 'b' : 'c').repeat(64)}`,
    workflow_run: {
      id: runId,
      repository_id: REPOSITORY_ID,
      head_repository_id: REPOSITORY_ID,
      head_branch: 'main',
      head_sha: SOURCE_SHA,
    },
    ...patch,
  };
};

const createApiWorkflow = (id: number, name: string, path: string) => ({
  id,
  name,
  path,
  state: 'active',
});

const createDeployment = (patch: Record<string, unknown> = {}) => ({
  id: Number(DEPLOYMENT_ID),
  environment: 'staging',
  production_environment: false,
  transient_environment: false,
  sha: SOURCE_SHA,
  ref: 'main',
  task: 'deploy',
  creator: { login: 'release-operator' },
  created_at: '2026-09-08T13:08:00.000Z',
  ...patch,
});

const createDeploymentStatus = (patch: Record<string, unknown> = {}) => ({
  id: 4001,
  state: 'success',
  environment: 'staging',
  environment_url: WEB_ORIGIN,
  target_url: `https://github.com/${REPOSITORY}/actions/runs/${STAGING_RUN_ID}/job/5001`,
  log_url: `https://github.com/${REPOSITORY}/actions/runs/${STAGING_RUN_ID}/job/5001`,
  creator: { login: 'release-operator' },
  created_at: '2026-09-08T13:09:00.000Z',
  ...patch,
});

export interface MockApiOverrides {
  readonly ciWorkflow?: unknown;
  readonly stagingWorkflow?: unknown;
  readonly ciRun?: unknown;
  readonly stagingRun?: unknown;
  readonly ciArtifacts?: readonly unknown[];
  readonly stagingArtifacts?: readonly unknown[];
  readonly deployments?: readonly unknown[];
  readonly deploymentStatuses?: readonly unknown[];
}

export const createMockGitHubApi = (overrides: MockApiOverrides = {}) => {
  const values = {
    ciWorkflow:
      overrides.ciWorkflow ??
      createApiWorkflow(CI_WORKFLOW_ID, 'CI', '.github/workflows/ci.yml'),
    stagingWorkflow:
      overrides.stagingWorkflow ??
      createApiWorkflow(
        STAGING_WORKFLOW_ID,
        'Deploy staging',
        '.github/workflows/deploy-staging.yml',
      ),
    ciRun: overrides.ciRun ?? workflowRun('ci'),
    stagingRun: overrides.stagingRun ?? workflowRun('staging'),
    ciArtifacts: overrides.ciArtifacts ?? [artifact('ci')],
    stagingArtifacts: overrides.stagingArtifacts ?? [artifact('staging')],
    deployments: overrides.deployments ?? [createDeployment()],
    deploymentStatuses: overrides.deploymentStatuses ?? [
      createDeploymentStatus(),
    ],
  };
  const requests: Array<{ readonly url: URL; readonly init: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    requests.push({ url, init });
    let payload: unknown;
    if (url.pathname.endsWith('/actions/workflows/ci.yml')) {
      payload = values.ciWorkflow;
    } else if (url.pathname.endsWith('/actions/workflows/deploy-staging.yml')) {
      payload = values.stagingWorkflow;
    } else if (
      url.pathname.endsWith(
        `/actions/runs/${CI_RUN_ID}/attempts/${CI_RUN_ATTEMPT}`,
      )
    ) {
      payload = values.ciRun;
    } else if (
      url.pathname.endsWith(
        `/actions/runs/${STAGING_RUN_ID}/attempts/${STAGING_RUN_ATTEMPT}`,
      )
    ) {
      payload = values.stagingRun;
    } else if (url.pathname.endsWith(`/actions/runs/${CI_RUN_ID}/artifacts`)) {
      payload = {
        total_count: values.ciArtifacts.length,
        artifacts: values.ciArtifacts,
      };
    } else if (
      url.pathname.endsWith(`/actions/runs/${STAGING_RUN_ID}/artifacts`)
    ) {
      payload = {
        total_count: values.stagingArtifacts.length,
        artifacts: values.stagingArtifacts,
      };
    } else if (url.pathname.endsWith('/deployments')) {
      payload = values.deployments;
    } else if (
      url.pathname.endsWith(`/deployments/${DEPLOYMENT_ID}/statuses`)
    ) {
      payload = values.deploymentStatuses;
    } else {
      return new Response(null, { status: 404 });
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { fetchImpl, requests, values };
};

export const createInputs = (
  fixture: ReturnType<typeof createCandidateFixture>,
  patch: Record<string, unknown> = {},
) => ({
  repository: REPOSITORY,
  token: TOKEN,
  ciRunId: CI_RUN_ID,
  ciRunAttempt: CI_RUN_ATTEMPT,
  stagingRunId: STAGING_RUN_ID,
  stagingRunAttempt: STAGING_RUN_ATTEMPT,
  sourceSha: SOURCE_SHA,
  stagingDeploymentId: DEPLOYMENT_ID,
  stagingWebOrigin: WEB_ORIGIN,
  stagingApiOrigin: API_ORIGIN,
  workspaceRoot: fixture.workspaceRoot,
  ...patch,
});
