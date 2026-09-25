import {
  isJsonObject,
  parseTimestamp,
  type JsonObject,
} from './content-schema-registry-slo-source-helpers.ts';

const PRODUCTION_WORKFLOW_NAME = 'Deploy production';
const PRODUCTION_WORKFLOW_PATH = '.github/workflows/deploy-production.yml';
const PRODUCTION_JOB_NAME = 'deploy';

// GitHub backfills a workflow run's `run_started_at` from the runner slot that
// picked the run up, so a genuine, successful run can record a runner-start
// timestamp a moment earlier than its own `created_at`. The allowance matches
// the AC265 candidate provenance bound and still rejects any larger inversion,
// which no legitimate run ordering produces.
const GITHUB_RUN_TIMESTAMP_SKEW_MS = 5 * 1000;

type ProductionJobReference = Readonly<{
  runId: string;
  jobId: string;
}>;

type VerifiedProductionJobReference = Readonly<{
  runId: string;
  jobId: string;
  canonicalUrl: string;
}>;

type VerifiedProductionJob = Readonly<{
  runId: string;
  runAttempt: number;
  createdAt: number;
  startedAt: number;
  completedAt: number;
}>;

type VerifiedProductionWorkflowRun = Readonly<{
  createdAt: number;
  startedAt: number;
  completedAt: number;
}>;

const failDeployProductionIdentity = (): never => {
  throw new Error(
    'The production deployment is not linked to a successful Deploy production workflow.',
  );
};

// A GitHub repository rename leaves every historical deployment status and job
// URL address pinned to the slug in effect at the time it was recorded. GitHub
// still serves those aliases for the same immutable repository identity, so the
// production verifier accepts the recorded slug of the repository it already
// binds by owner, name, and numeric ID. The mapping is exact and owner-scoped:
// only the listed historical slug for this exact repository is accepted, and
// every run, job, source, and repository-numeric-ID check is unchanged.
const HISTORICAL_REPOSITORY_SLUGS: Readonly<Record<string, readonly string[]>> =
  {
    'WeJustJammin/wejammin': ['WeJustJammin/nevrite-music'],
  };

const acceptedRepositorySlugs = (
  owner: string,
  name: string,
): readonly string[] => [
  `${owner}/${name}`,
  ...(HISTORICAL_REPOSITORY_SLUGS[`${owner}/${name}`] ?? []),
];

const parseProductionJobUrl = (
  value: unknown,
  acceptedSlugs: readonly string[],
): ProductionJobReference => {
  if (typeof value !== 'string') return failDeployProductionIdentity();
  const match =
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/actions\/runs\/([1-9][0-9]*)\/job\/([1-9][0-9]*)$/u.exec(
      value,
    );
  if (match === null || !acceptedSlugs.includes(`${match[1]}/${match[2]}`))
    return failDeployProductionIdentity();
  return { runId: match[3]!, jobId: match[4]! };
};

export const verifyProductionJobReference = (
  status: JsonObject,
  owner: string,
  name: string,
): VerifiedProductionJobReference => {
  const acceptedSlugs = acceptedRepositorySlugs(owner, name);
  const target = parseProductionJobUrl(status.target_url, acceptedSlugs);
  const log = parseProductionJobUrl(status.log_url, acceptedSlugs);
  if (target.runId !== log.runId || target.jobId !== log.jobId)
    return failDeployProductionIdentity();
  return {
    runId: target.runId,
    jobId: target.jobId,
    canonicalUrl: `https://github.com/${owner}/${name}/actions/runs/${target.runId}/job/${target.jobId}`,
  };
};

const positiveSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export const verifyProductionJob = (
  value: unknown,
  expected: VerifiedProductionJobReference,
  sourceRevision: string,
): VerifiedProductionJob => {
  if (
    !isJsonObject(value) ||
    !positiveSafeInteger(value.id) ||
    String(value.id) !== expected.jobId ||
    !positiveSafeInteger(value.run_id) ||
    String(value.run_id) !== expected.runId ||
    !positiveSafeInteger(value.run_attempt) ||
    value.workflow_name !== PRODUCTION_WORKFLOW_NAME ||
    value.name !== PRODUCTION_JOB_NAME ||
    value.status !== 'completed' ||
    value.conclusion !== 'success' ||
    value.head_sha !== sourceRevision ||
    value.head_branch !== 'main' ||
    value.html_url !== expected.canonicalUrl
  )
    return failDeployProductionIdentity();

  const createdAt = parseTimestamp(value.created_at, 'Deploy production job');
  const startedAt = parseTimestamp(value.started_at, 'Deploy production job');
  const completedAt = parseTimestamp(
    value.completed_at,
    'Deploy production job',
  );
  if (createdAt > startedAt || startedAt > completedAt)
    return failDeployProductionIdentity();
  return {
    runId: expected.runId,
    runAttempt: value.run_attempt,
    createdAt,
    startedAt,
    completedAt,
  };
};

export const verifyProductionWorkflow = (value: unknown): number => {
  if (
    !isJsonObject(value) ||
    value.name !== PRODUCTION_WORKFLOW_NAME ||
    value.path !== PRODUCTION_WORKFLOW_PATH ||
    value.state !== 'active' ||
    !positiveSafeInteger(value.id)
  )
    throw new Error('The Deploy production workflow identity is invalid.');
  return value.id;
};

export const verifyProductionWorkflowRun = (
  value: unknown,
  expected: {
    readonly runId: string;
    readonly runAttempt: number;
    readonly workflowId: number;
    readonly repository: string;
    readonly sourceRevision: string;
  },
): VerifiedProductionWorkflowRun => {
  if (!isJsonObject(value)) return failDeployProductionIdentity();
  const repository = isJsonObject(value.repository)
    ? value.repository
    : undefined;
  const headRepository = isJsonObject(value.head_repository)
    ? value.head_repository
    : undefined;
  if (
    !positiveSafeInteger(value.id) ||
    String(value.id) !== expected.runId ||
    value.run_attempt !== expected.runAttempt ||
    value.workflow_id !== expected.workflowId ||
    value.name !== PRODUCTION_WORKFLOW_NAME ||
    value.path !== PRODUCTION_WORKFLOW_PATH ||
    value.event !== 'workflow_dispatch' ||
    value.status !== 'completed' ||
    value.conclusion !== 'success' ||
    value.head_branch !== 'main' ||
    value.head_sha !== expected.sourceRevision ||
    repository?.full_name !== expected.repository ||
    headRepository?.full_name !== expected.repository ||
    !positiveSafeInteger(repository?.id) ||
    repository.id !== headRepository?.id
  )
    return failDeployProductionIdentity();

  const createdAt = parseTimestamp(value.created_at, 'Deploy production run');
  const startedAt = parseTimestamp(
    value.run_started_at,
    'Deploy production run',
  );
  const completedAt = parseTimestamp(value.updated_at, 'Deploy production run');
  if (
    createdAt - startedAt > GITHUB_RUN_TIMESTAMP_SKEW_MS ||
    startedAt > completedAt
  )
    return failDeployProductionIdentity();
  return { createdAt, startedAt, completedAt };
};

export const verifyProductionDeploymentTimeline = (
  deployment: JsonObject,
  status: JsonObject,
  job: VerifiedProductionJob,
  run: VerifiedProductionWorkflowRun,
  statusTimestamp: number,
): number => {
  const deploymentCreatedAt = parseTimestamp(
    deployment.created_at,
    'Production deployment',
  );
  const deploymentUpdatedAt = parseTimestamp(
    deployment.updated_at,
    'Production deployment',
  );
  const statusCreatedAt = parseTimestamp(
    status.created_at ?? status.updated_at,
    'Deployment status',
  );
  const statusUpdatedAt = parseTimestamp(
    status.updated_at ?? status.created_at,
    'Deployment status',
  );
  if (
    run.startedAt > deploymentCreatedAt ||
    deploymentCreatedAt > job.startedAt ||
    job.createdAt > job.startedAt ||
    job.startedAt > job.completedAt ||
    job.completedAt > run.completedAt ||
    deploymentCreatedAt > statusCreatedAt ||
    deploymentUpdatedAt !== statusUpdatedAt ||
    statusCreatedAt > statusUpdatedAt ||
    statusTimestamp !== statusUpdatedAt ||
    statusCreatedAt < job.completedAt ||
    statusUpdatedAt < job.completedAt ||
    statusUpdatedAt > run.completedAt
  )
    return failDeployProductionIdentity();
  return Math.max(job.completedAt, statusTimestamp);
};
