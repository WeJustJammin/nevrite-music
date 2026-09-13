import {
  failAc266Evidence,
  isAc266Record,
  parseAc266Timestamp,
  requestAc266GitHubApi,
} from './ac266-manual-accessibility-github-api.ts';
import type { Ac266ManualEvidenceEnvironment } from './ac266-manual-accessibility-evidence-environment.ts';

const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const SHA_PATTERN = /^[a-f0-9]{40}$/u;
const INERT_STATUS_STATES = new Set(['queued', 'waiting']);
const STATUS_STATES = new Set([
  'error',
  'failure',
  'inactive',
  'in_progress',
  'pending',
  'queued',
  'success',
  'waiting',
]);

export interface Ac266ReportWindow {
  readonly startedAt: string;
  readonly completedAt: string;
}

interface Deployment {
  readonly id: string;
  readonly sha: string;
  readonly createdAt: number;
}

interface DeploymentStatus {
  readonly deploymentId: string;
  readonly state: string;
  readonly createdAt: number;
}

const parseDeployment = (value: unknown): Deployment => {
  if (
    !isAc266Record(value) ||
    typeof value.id !== 'number' ||
    !Number.isSafeInteger(value.id) ||
    value.id < 1 ||
    value.environment !== 'staging' ||
    typeof value.sha !== 'string' ||
    !SHA_PATTERN.test(value.sha)
  )
    return failAc266Evidence();
  return {
    id: String(value.id),
    sha: value.sha,
    createdAt: parseAc266Timestamp(value.created_at),
  };
};

const parseStatus = (
  value: unknown,
  deploymentId: string,
  origin: string,
  deploymentCreatedAt: number,
  evidenceCutoff: number,
): DeploymentStatus => {
  if (
    !isAc266Record(value) ||
    typeof value.id !== 'number' ||
    !Number.isSafeInteger(value.id) ||
    value.id < 1 ||
    typeof value.state !== 'string' ||
    !STATUS_STATES.has(value.state) ||
    typeof value.environment_url !== 'string' ||
    value.environment !== 'staging'
  )
    return failAc266Evidence();
  const createdAt = parseAc266Timestamp(value.created_at);
  if (
    createdAt < deploymentCreatedAt ||
    (value.state === 'success' &&
      createdAt <= evidenceCutoff &&
      value.environment_url !== origin)
  )
    return failAc266Evidence();
  return { deploymentId, state: value.state as string, createdAt };
};

const collectPages = async (
  path: string,
  fetchImpl: typeof fetch,
  token: string,
): Promise<unknown[]> => {
  const values: unknown[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const result = await requestAc266GitHubApi(
      `${path}${separator}per_page=${PAGE_SIZE}&page=${page}`,
      fetchImpl,
      token,
    );
    if (!Array.isArray(result) || result.length > PAGE_SIZE)
      return failAc266Evidence();
    values.push(...result);
    if (result.length < PAGE_SIZE) return values;
  }
  return failAc266Evidence();
};

const latestAt = (
  statuses: readonly DeploymentStatus[],
  cutoff: number,
  state?: string,
): DeploymentStatus | undefined => {
  const events = statuses.filter(
    (status) =>
      status.createdAt <= cutoff &&
      (state === undefined || status.state === state),
  );
  if (events.length === 0) return undefined;
  const latestTime = Math.max(...events.map((event) => event.createdAt));
  const latest = events.filter((event) => event.createdAt === latestTime);
  if (
    latest.some(
      (event) =>
        event.deploymentId !== latest[0]?.deploymentId ||
        event.state !== latest[0]?.state,
    )
  )
    return failAc266Evidence();
  return latest[0];
};

const hasNewerDeploymentActivity = (
  statuses: readonly DeploymentStatus[],
  selectedDeploymentId: string,
  cutoff: number,
): boolean =>
  statuses.some(
    (status) =>
      status.deploymentId !== selectedDeploymentId &&
      status.createdAt <= cutoff &&
      !INERT_STATUS_STATES.has(status.state),
  );

export const verifyAc266StagingDeploymentTimeline = async (
  inputs: Ac266ManualEvidenceEnvironment,
  fetchImpl: typeof fetch,
  stagingRunWindow: {
    readonly startedAt: string;
    readonly completedAt: string;
  },
  reportWindows: readonly Ac266ReportWindow[],
): Promise<string> => {
  if (reportWindows.length !== 2) return failAc266Evidence();
  const prefix = `/repos/${inputs.repository}/deployments`;
  const deploymentValues = await collectPages(
    `${prefix}?environment=staging`,
    fetchImpl,
    inputs.token,
  );
  const deployments = deploymentValues.map(parseDeployment);
  const deploymentIds = new Set<string>();
  for (const deployment of deployments) {
    if (deploymentIds.has(deployment.id)) return failAc266Evidence();
    deploymentIds.add(deployment.id);
  }
  const selected = deployments.find(
    (deployment) => deployment.id === inputs.deploymentId,
  );
  const runStartedAt = parseAc266Timestamp(stagingRunWindow.startedAt);
  const runCompletedAt = parseAc266Timestamp(stagingRunWindow.completedAt);
  if (
    selected === undefined ||
    selected.sha !== inputs.sourceSha ||
    selected.createdAt < runStartedAt ||
    selected.createdAt > runCompletedAt
  )
    return failAc266Evidence();

  const reportBounds = reportWindows.map((report) => ({
    startedAt: parseAc266Timestamp(report.startedAt),
    completedAt: parseAc266Timestamp(report.completedAt),
  }));
  const latestCompletion = Math.max(
    ...reportBounds.map((report) => report.completedAt),
  );
  const timeline: DeploymentStatus[] = [];
  for (const deployment of deployments) {
    if (
      deployment.createdAt > latestCompletion ||
      (deployment.id !== selected.id &&
        deployment.createdAt < selected.createdAt)
    )
      continue;
    const statuses = await collectPages(
      `${prefix}/${deployment.id}/statuses`,
      fetchImpl,
      inputs.token,
    );
    timeline.push(
      ...statuses.map((status) =>
        parseStatus(
          status,
          deployment.id,
          inputs.origin,
          deployment.createdAt,
          latestCompletion,
        ),
      ),
    );
  }
  const selectedStatuses = timeline.filter(
    (status) => status.deploymentId === selected.id,
  );
  const earliestReportStart = Math.min(
    ...reportBounds.map((report) => report.startedAt),
  );
  const selectedAtStart = latestAt(selectedStatuses, earliestReportStart);
  const deployedStatus = latestAt(
    selectedStatuses,
    earliestReportStart,
    'success',
  );
  if (
    selectedAtStart?.state !== 'success' ||
    deployedStatus === undefined ||
    deployedStatus.createdAt > runCompletedAt
  )
    return failAc266Evidence();

  for (const report of reportBounds) {
    for (const cutoff of [report.startedAt, report.completedAt]) {
      const selectedLatest = latestAt(selectedStatuses, cutoff);
      const latestSuccess = latestAt(timeline, cutoff, 'success');
      if (
        hasNewerDeploymentActivity(timeline, selected.id, cutoff) ||
        selectedLatest?.state !== 'success' ||
        latestSuccess?.deploymentId !== selected.id
      )
        return failAc266Evidence();
    }
  }
  return new Date(deployedStatus.createdAt).toISOString();
};
