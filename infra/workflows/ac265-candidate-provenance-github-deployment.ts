import {
  failAc265CandidateProvenance,
  isAc265Record,
  timestampMs,
  type Ac265Fetch,
  type Ac265VerifiedDeployment,
  type Ac265VerifiedRun,
} from './ac265-candidate-provenance-common.ts';
import type { Ac265CandidateProvenanceInputs } from './ac265-candidate-provenance-input.ts';
import {
  collectPages,
  repositoryApiPrefix,
  requireSafeInteger,
} from './ac265-candidate-provenance-github-api.ts';

const DEPLOYMENT_STATES = new Set([
  'error',
  'failure',
  'inactive',
  'in_progress',
  'pending',
  'queued',
  'success',
  'waiting',
]);

export const deploymentJobUrl = (runId: string, repository: string): RegExp => {
  const escapedRepository = repository.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(
    `^https://github\\.com/${escapedRepository}/actions/runs/${runId}/job/[1-9][0-9]*$`,
    'u',
  );
};

const parseDeployment = (
  value: unknown,
  input: Ac265CandidateProvenanceInputs,
  stagingRun: Ac265VerifiedRun,
): Ac265VerifiedDeployment | undefined => {
  if (!isAc265Record(value)) return failAc265CandidateProvenance();
  const id = requireSafeInteger(value.id);
  const createdAt = timestampMs(value.created_at);
  if (
    value.environment !== 'staging' ||
    value.production_environment !== false ||
    value.transient_environment !== false ||
    value.sha !== input.sourceSha ||
    value.ref !== 'main' ||
    value.task !== 'deploy' ||
    !isAc265Record(value.creator) ||
    value.creator.login !== stagingRun.actorLogin
  )
    return failAc265CandidateProvenance();
  if (createdAt < stagingRun.startedAt || createdAt > stagingRun.completedAt)
    return undefined;
  return {
    id: String(id),
    environment: 'staging',
    webOrigin: input.stagingWebOrigin,
    createdAt,
  };
};

export const verifyAc265StagingDeployment = async (
  input: Ac265CandidateProvenanceInputs,
  stagingRun: Ac265VerifiedRun,
  fetchImpl: Ac265Fetch,
): Promise<Ac265VerifiedDeployment> => {
  const query = new URLSearchParams({
    environment: 'staging',
    sha: input.sourceSha,
    task: 'deploy',
  });
  const deploymentPath = `${repositoryApiPrefix()}/deployments?${query}`;
  const values = await collectPages(deploymentPath, input.token, fetchImpl);
  const deployments = values
    .map((value) => parseDeployment(value, input, stagingRun))
    .filter((value): value is Ac265VerifiedDeployment => value !== undefined);
  const selected = deployments.filter(
    (deployment) => deployment.id === input.stagingDeploymentId,
  );
  if (selected.length !== 1 || deployments.length !== 1)
    return failAc265CandidateProvenance();
  const deployment = selected[0];
  if (deployment === undefined) return failAc265CandidateProvenance();

  const statuses = await collectPages(
    `${repositoryApiPrefix()}/deployments/${deployment.id}/statuses`,
    input.token,
    fetchImpl,
  );
  const expectedJobUrl = deploymentJobUrl(stagingRun.runId, input.repository);
  const parsedStatuses = statuses.map((value) => {
    if (!isAc265Record(value)) return failAc265CandidateProvenance();
    const id = requireSafeInteger(value.id);
    const createdAt = timestampMs(value.created_at);
    if (
      typeof value.state !== 'string' ||
      !DEPLOYMENT_STATES.has(value.state) ||
      value.environment !== 'staging' ||
      !isAc265Record(value.creator) ||
      value.creator.login !== stagingRun.actorLogin ||
      typeof value.target_url !== 'string' ||
      typeof value.log_url !== 'string' ||
      !expectedJobUrl.test(value.target_url) ||
      !expectedJobUrl.test(value.log_url) ||
      createdAt < deployment.createdAt ||
      createdAt > stagingRun.completedAt
    )
      return failAc265CandidateProvenance();
    if (
      value.state === 'success' &&
      value.environment_url !== input.stagingWebOrigin
    )
      return failAc265CandidateProvenance();
    return { id, state: value.state, createdAt };
  });
  if (parsedStatuses.length === 0) return failAc265CandidateProvenance();
  parsedStatuses.sort((left, right) => right.createdAt - left.createdAt);
  const latest = parsedStatuses[0];
  const tied = parsedStatuses.filter(
    (status) => status.createdAt === latest?.createdAt,
  );
  if (
    latest?.state !== 'success' ||
    tied.length !== 1 ||
    tied.some((status) => status.id !== latest.id)
  )
    return failAc265CandidateProvenance();
  return { ...deployment, webOrigin: input.stagingWebOrigin };
};
