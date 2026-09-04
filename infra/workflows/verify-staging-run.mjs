import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const FULL_SHA = /^[a-f0-9]{40}$/;
const NUMERIC_ID = /^\d+$/;

const requiredEnvironment = (environment, name) => {
  const value = environment[name];
  if (typeof value !== 'string' || value === '')
    throw new Error(`${name} is required`);
  return value;
};

const apiRequest = async (fetchImpl, url, token) => {
  const response = await fetchImpl(url, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!response.ok)
    throw new Error(`GitHub Actions API returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload || typeof payload !== 'object')
    throw new Error('GitHub Actions API returned invalid JSON');
  return payload;
};

const runIdOf = (run) =>
  run && typeof run === 'object' && typeof run.id === 'number' ? run.id : null;

/**
 * Ensure a workflow_run event still names the newest successful main-branch
 * CI run before staging mutates shared hosted state. A newer active run also
 * blocks the older event, avoiding a stale deployment while CI is in flight.
 */
export const verifyStagingRun = async ({
  environment = process.env,
  fetchImpl = globalThis.fetch,
} = {}) => {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const runId = requiredEnvironment(environment, 'CI_RUN_ID');
  const sourceSha = requiredEnvironment(environment, 'DEPLOY_SHA');
  const token = requiredEnvironment(environment, 'GITHUB_TOKEN');
  const repository = requiredEnvironment(environment, 'GITHUB_REPOSITORY');
  const workflowId = requiredEnvironment(environment, 'CI_WORKFLOW_ID');
  if (!NUMERIC_ID.test(runId) || !NUMERIC_ID.test(workflowId))
    throw new Error('CI run and workflow IDs must be numeric');
  if (!FULL_SHA.test(sourceSha))
    throw new Error('DEPLOY_SHA must be a full lowercase commit SHA');

  const apiOrigin = environment.GITHUB_API_URL || 'https://api.github.com';
  const baseUrl = `${apiOrigin.replace(/\/$/u, '')}/repos/${repository}`;
  const current = await apiRequest(
    fetchImpl,
    `${baseUrl}/actions/runs/${runId}`,
    token,
  );
  if (
    runIdOf(current) !== Number(runId) ||
    current.workflow_id !== Number(workflowId) ||
    current.head_sha !== sourceSha ||
    current.head_branch !== 'main' ||
    current.status !== 'completed' ||
    current.conclusion !== 'success'
  ) {
    throw new Error('CI workflow run identity or conclusion is not promotable');
  }

  const runsPayload = await apiRequest(
    fetchImpl,
    `${baseUrl}/actions/workflows/${workflowId}/runs?branch=main&per_page=100`,
    token,
  );
  const runs = Array.isArray(runsPayload.workflow_runs)
    ? runsPayload.workflow_runs
    : [];
  const matchingRuns = runs.filter(
    (run) =>
      run &&
      typeof run === 'object' &&
      run.workflow_id === Number(workflowId) &&
      run.head_branch === 'main',
  );
  const newestSuccessful = matchingRuns
    .filter((run) => run.status === 'completed' && run.conclusion === 'success')
    .sort((left, right) => (runIdOf(right) ?? 0) - (runIdOf(left) ?? 0))[0];
  if (runIdOf(newestSuccessful) !== Number(runId)) {
    throw new Error('CI workflow run has been superseded by a newer success');
  }
  const newerActive = matchingRuns.some(
    (run) => (runIdOf(run) ?? 0) > Number(runId) && run.status !== 'completed',
  );
  if (newerActive) throw new Error('A newer CI workflow run is still active');
  return Object.freeze({ ciRunId: runId, sourceRevision: sourceSha });
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(entrypoint)).href
) {
  verifyStagingRun().then(
    () => console.log('staging_ci_run=latest_success'),
    (error) => {
      console.error(
        error instanceof Error ? error.message : 'CI run guard failed',
      );
      process.exitCode = 1;
    },
  );
}
