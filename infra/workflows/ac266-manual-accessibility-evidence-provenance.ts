import {
  failAc266Evidence,
  isAc266Record,
  parseAc266Timestamp,
  requestAc266GitHubApi,
} from './ac266-manual-accessibility-github-api.ts';
import type { Ac266ManualEvidenceEnvironment } from './ac266-manual-accessibility-evidence-environment.ts';
import { AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH } from './materialize-ac266-manual-accessibility-intake.ts';
import {
  AC266_STAGING_RUN_IDENTITY_WORKFLOW_PATH,
  type Ac266StagingRunIdentity,
} from './read-ac266-manual-accessibility-local-evidence.ts';
import {
  verifyAc266StagingDeploymentTimeline,
  type Ac266ReportWindow,
} from './ac266-manual-accessibility-staging-deployments.ts';

const SHA_PATTERN = /^[a-f0-9]{40}$/u;
const STAGING_WORKFLOW_PATH = AC266_STAGING_RUN_IDENTITY_WORKFLOW_PATH;

export interface Ac266ManualEvidenceProvenance {
  readonly stagingDeployedAt: string;
  readonly stagingRunAttempt: string;
  readonly stagingRunStartedAt: string;
  readonly stagingRunCompletedAt: string;
  readonly manualRunAttempt: string;
  readonly manualRunHeadSha: string;
  readonly manualRunStartedAt: string;
}

interface ValidatedRun {
  readonly attempt: string;
  readonly headSha: string;
  readonly createdAt: string;
  readonly startedAt: string;
  readonly completedAt: string;
}

const assertRun = (
  value: unknown,
  expected: {
    readonly id: string;
    readonly repository: string;
    readonly workflowPath: string;
    readonly event: string;
    readonly headSha?: string;
    readonly now: number;
  },
): ValidatedRun => {
  if (!isAc266Record(value)) return failAc266Evidence();
  const repository = isAc266Record(value.repository)
    ? value.repository.full_name
    : undefined;
  const headRepository = isAc266Record(value.head_repository)
    ? value.head_repository.full_name
    : undefined;
  if (
    typeof value.id !== 'number' ||
    !Number.isSafeInteger(value.id) ||
    String(value.id) !== expected.id ||
    value.path !== expected.workflowPath ||
    value.event !== expected.event ||
    value.status !== 'completed' ||
    value.conclusion !== 'success' ||
    repository !== expected.repository ||
    headRepository !== expected.repository ||
    value.head_branch !== 'main' ||
    typeof value.head_sha !== 'string' ||
    !SHA_PATTERN.test(value.head_sha) ||
    (expected.headSha !== undefined && value.head_sha !== expected.headSha) ||
    typeof value.run_attempt !== 'number' ||
    !Number.isSafeInteger(value.run_attempt) ||
    value.run_attempt < 1
  )
    return failAc266Evidence();

  const createdAt = parseAc266Timestamp(value.created_at);
  const startedAt = parseAc266Timestamp(value.run_started_at);
  const completedAt = parseAc266Timestamp(value.updated_at);
  if (
    createdAt > startedAt ||
    startedAt > completedAt ||
    completedAt > expected.now
  )
    return failAc266Evidence();
  return {
    attempt: String(value.run_attempt),
    headSha: value.head_sha,
    createdAt: value.created_at as string,
    startedAt: value.run_started_at as string,
    completedAt: value.updated_at as string,
  };
};

export const verifyAc266ManualEvidenceProvenance = async (
  inputs: Ac266ManualEvidenceEnvironment,
  fetchImpl: typeof fetch,
  cutoff: Date,
  stagingIdentity: Ac266StagingRunIdentity,
  reportWindows: readonly Ac266ReportWindow[],
): Promise<Ac266ManualEvidenceProvenance> => {
  const now = cutoff.getTime();
  if (!Number.isFinite(now)) return failAc266Evidence();
  const prefix = `/repos/${inputs.repository}`;
  const staging = assertRun(
    await requestAc266GitHubApi(
      `${prefix}/actions/runs/${inputs.stagingRunId}`,
      fetchImpl,
      inputs.token,
    ),
    {
      id: inputs.stagingRunId,
      repository: inputs.repository,
      workflowPath: STAGING_WORKFLOW_PATH,
      event: 'workflow_run',
      headSha: inputs.sourceSha,
      now,
    },
  );
  if (
    stagingIdentity.repository !== inputs.repository ||
    stagingIdentity.workflowPath !== STAGING_WORKFLOW_PATH ||
    stagingIdentity.runId !== inputs.stagingRunId ||
    stagingIdentity.runAttempt !== staging.attempt ||
    stagingIdentity.headSha !== staging.headSha
  )
    return failAc266Evidence();

  const stagingDeployedAt = await verifyAc266StagingDeploymentTimeline(
    inputs,
    fetchImpl,
    { startedAt: staging.startedAt, completedAt: staging.completedAt },
    reportWindows,
  );
  const intake = assertRun(
    await requestAc266GitHubApi(
      `${prefix}/actions/runs/${inputs.manualRunId}`,
      fetchImpl,
      inputs.token,
    ),
    {
      id: inputs.manualRunId,
      repository: inputs.repository,
      workflowPath: AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH,
      event: 'workflow_dispatch',
      now,
    },
  );
  return {
    stagingDeployedAt,
    stagingRunAttempt: staging.attempt,
    stagingRunStartedAt: staging.startedAt,
    stagingRunCompletedAt: staging.completedAt,
    manualRunAttempt: intake.attempt,
    manualRunHeadSha: intake.headSha,
    manualRunStartedAt: intake.startedAt,
  };
};
