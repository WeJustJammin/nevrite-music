import { appendFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SOURCE_SHA_PATTERN = /^[0-9a-f]{40}$/u;
const STAGING_RUN_ID_PATTERN = /^[0-9]+$/u;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const STAGING_WORKFLOW_ID = 346315228;
const STAGING_WORKFLOW_PATH = '.github/workflows/deploy-staging.yml';
const CI_WORKFLOW_PATH = '.github/workflows/ci.yml';
const CI_WORKFLOW_FILE = 'ci.yml';
const CI_WORKFLOW_NAME = 'CI';
const PRODUCTION_REVIEW_RULE_ID = 64231612;
const PRODUCTION_REVIEWER_ID = 305953066;
const PRODUCTION_REVIEWER_LOGIN = 'WeJustJammin';

type JsonObject = Record<string, unknown>;

export type ProductionPromotionGuardOptions = Readonly<{
  apiUrl: string;
  confirmProduction: boolean;
  ref: string;
  repository: string;
  sourceSha: string;
  stagingRunId: string;
  token: string;
}>;

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const repositoryParts = (repository: string): readonly [string, string] => {
  if (!REPOSITORY_PATTERN.test(repository)) {
    throw new Error('GITHUB_REPOSITORY must identify an owner and repository.');
  }
  const [owner, name] = repository.split('/');
  if (owner === undefined || name === undefined) {
    throw new Error('GITHUB_REPOSITORY must identify an owner and repository.');
  }
  return [owner, name];
};

const baseApiUrl = (apiUrl: string): URL => {
  let parsed: URL;
  try {
    parsed = new URL(apiUrl);
  } catch {
    throw new Error('GITHUB_API_URL must be a valid HTTPS URL.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('GITHUB_API_URL must be a valid HTTPS URL.');
  }
  parsed.pathname = parsed.pathname.endsWith('/')
    ? parsed.pathname
    : `${parsed.pathname}/`;
  return parsed;
};

const requestJson = async (
  endpoint: URL,
  token: string,
  fetchImpl: typeof fetch,
): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  } catch {
    throw new Error(
      'GitHub production-promotion preflight API request failed.',
    );
  }
  if (!response.ok) {
    throw new Error(
      `GitHub production-promotion preflight API returned HTTP ${response.status}.`,
    );
  }
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new Error(
      'GitHub production-promotion preflight returned invalid JSON.',
    );
  }
};

const validateInputShape = (
  options: ProductionPromotionGuardOptions,
): readonly [URL, string, string] => {
  if (!options.confirmProduction) {
    throw new Error('An explicit production confirmation is required.');
  }
  if (options.ref !== 'refs/heads/main') {
    throw new Error('Production promotion is restricted to the main branch.');
  }
  if (!SOURCE_SHA_PATTERN.test(options.sourceSha)) {
    throw new Error('source SHA must be a full lowercase commit SHA.');
  }
  if (!STAGING_RUN_ID_PATTERN.test(options.stagingRunId)) {
    throw new Error('Staging run ID must be a numeric completed workflow run.');
  }
  if (options.token.length === 0) {
    throw new Error('A GitHub token is required for production preflight.');
  }
  const [owner, name] = repositoryParts(options.repository);
  return [baseApiUrl(options.apiUrl), owner, name];
};

const endpointFor = (
  base: URL,
  owner: string,
  name: string,
  suffix: string,
): URL =>
  new URL(
    `repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/${suffix}`,
    base,
  );

const runTimestamp = (
  run: JsonObject,
  fields: readonly string[],
  label: string,
): number | undefined => {
  for (const field of fields) {
    if (!(field in run)) continue;
    const value = run[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string') {
      throw new Error(`${label} timestamp is invalid.`);
    }
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) {
      throw new Error(`${label} timestamp is invalid.`);
    }
    return timestamp;
  }
  return undefined;
};

const verifyCiWorkflow = async (
  base: URL,
  owner: string,
  name: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<JsonObject> => {
  const workflow = await requestJson(
    endpointFor(base, owner, name, `actions/workflows/${CI_WORKFLOW_FILE}`),
    token,
    fetchImpl,
  );
  if (
    !isJsonObject(workflow) ||
    typeof workflow.id !== 'number' ||
    !Number.isSafeInteger(workflow.id) ||
    workflow.id <= 0 ||
    workflow.name !== CI_WORKFLOW_NAME ||
    workflow.path !== CI_WORKFLOW_PATH
  ) {
    throw new Error('The CI workflow identity is invalid.');
  }
  return workflow;
};

const verifyCiWorkflowRun = (
  run: JsonObject,
  workflow: JsonObject,
  options: ProductionPromotionGuardOptions,
): string => {
  if (
    typeof run.id !== 'number' ||
    !Number.isSafeInteger(run.id) ||
    run.id <= 0 ||
    run.workflow_id !== workflow.id ||
    run.name !== CI_WORKFLOW_NAME ||
    (run.path !== undefined && run.path !== CI_WORKFLOW_PATH) ||
    (run.event !== 'push' && run.event !== 'workflow_dispatch') ||
    run.status !== 'completed' ||
    run.conclusion !== 'success' ||
    run.head_branch !== 'main' ||
    run.head_sha !== options.sourceSha
  ) {
    throw new Error('The selected CI run has the wrong identity or result.');
  }
  return String(run.id);
};

const resolveCiRunId = async (
  base: URL,
  owner: string,
  name: string,
  options: ProductionPromotionGuardOptions,
  stagingRun: JsonObject,
  fetchImpl: typeof fetch,
): Promise<string> => {
  const workflow = await verifyCiWorkflow(
    base,
    owner,
    name,
    options.token,
    fetchImpl,
  );
  const runsEndpoint = endpointFor(
    base,
    owner,
    name,
    `actions/workflows/${workflow.id}/runs`,
  );
  runsEndpoint.search = new URLSearchParams({
    branch: 'main',
    status: 'success',
    head_sha: options.sourceSha,
    per_page: '100',
  }).toString();
  const runsResponse = await requestJson(
    runsEndpoint,
    options.token,
    fetchImpl,
  );
  if (!isJsonObject(runsResponse)) {
    throw new Error('The CI workflow run response is invalid.');
  }
  const workflowRuns = runsResponse.workflow_runs;
  if (
    runsResponse.total_count !== 1 ||
    !Array.isArray(workflowRuns) ||
    workflowRuns.length !== 1 ||
    !isJsonObject(workflowRuns[0])
  ) {
    throw new Error(
      'exactly one successful CI run is required for the selected source SHA.',
    );
  }
  const ciRun = workflowRuns[0];
  const ciRunId = verifyCiWorkflowRun(ciRun, workflow, options);
  const ciCompletedAt = runTimestamp(
    ciRun,
    ['completed_at', 'updated_at'],
    'CI completion',
  );
  const stagingStartedAt = runTimestamp(
    stagingRun,
    ['run_started_at', 'created_at'],
    'Staging start',
  );
  if (
    ciCompletedAt !== undefined &&
    stagingStartedAt !== undefined &&
    ciCompletedAt > stagingStartedAt
  ) {
    throw new Error(
      'The verified CI run must complete before the selected staging run starts.',
    );
  }
  return ciRunId;
};

export const verifyStagingWorkflowRun = async (
  options: ProductionPromotionGuardOptions,
  fetchImpl: typeof fetch = fetch,
): Promise<JsonObject> => {
  const [base, owner, name] = validateInputShape(options);
  const run = await requestJson(
    endpointFor(base, owner, name, `actions/runs/${options.stagingRunId}`),
    options.token,
    fetchImpl,
  );
  if (!isJsonObject(run)) {
    throw new Error('Staging workflow run response is invalid.');
  }
  if (
    run.id !== Number(options.stagingRunId) ||
    run.workflow_id !== STAGING_WORKFLOW_ID ||
    run.path !== STAGING_WORKFLOW_PATH ||
    run.name !== 'Deploy staging' ||
    run.event !== 'workflow_run'
  ) {
    throw new Error('Selected staging run has the wrong workflow identity.');
  }
  if (run.status !== 'completed' || run.conclusion !== 'success') {
    throw new Error('Selected staging run did not complete successfully.');
  }
  if (run.head_branch !== 'main') {
    throw new Error(
      'Selected staging run is not sourced from the main branch.',
    );
  }
  if (run.head_sha !== options.sourceSha) {
    throw new Error(
      'Selected staging run source SHA does not match source SHA.',
    );
  }
  return run;
};

export const verifyProductionEnvironment = async (
  options: ProductionPromotionGuardOptions,
  fetchImpl: typeof fetch = fetch,
): Promise<void> => {
  const [base, owner, name] = validateInputShape(options);
  const environment = await requestJson(
    endpointFor(base, owner, name, 'environments/production'),
    options.token,
    fetchImpl,
  );
  if (!isJsonObject(environment) || environment.name !== 'production') {
    throw new Error('The production environment is not configured.');
  }
  const protectionRules = environment.protection_rules;
  const requiredReviewerRules = Array.isArray(protectionRules)
    ? protectionRules.filter(
        (rule): rule is JsonObject =>
          isJsonObject(rule) && rule.type === 'required_reviewers',
      )
    : [];
  const requiredReviewerRule =
    requiredReviewerRules.length === 1 ? requiredReviewerRules[0] : null;
  const reviewerEntries = requiredReviewerRule?.reviewers;
  const soleReviewer =
    Array.isArray(reviewerEntries) && reviewerEntries.length === 1
      ? reviewerEntries[0]
      : null;
  const reviewerIdentity = isJsonObject(soleReviewer)
    ? soleReviewer.reviewer
    : null;
  const hasRequiredReviewers =
    requiredReviewerRule !== null &&
    requiredReviewerRule.id === PRODUCTION_REVIEW_RULE_ID &&
    requiredReviewerRule.prevent_self_review === false &&
    isJsonObject(soleReviewer) &&
    soleReviewer.type === 'User' &&
    isJsonObject(reviewerIdentity) &&
    reviewerIdentity.id === PRODUCTION_REVIEWER_ID &&
    reviewerIdentity.login === PRODUCTION_REVIEWER_LOGIN;
  if (!hasRequiredReviewers) {
    throw new Error(
      'The production environment requires production reviewers with the exact configured production reviewer and owner self-review enabled.',
    );
  }
  if (environment.can_admins_bypass !== false) {
    throw new Error(
      'The production environment must disable administrator bypass.',
    );
  }
  const deploymentBranchPolicy = environment.deployment_branch_policy;
  if (!isJsonObject(deploymentBranchPolicy)) {
    throw new Error(
      'The production environment requires a protected branch policy.',
    );
  }
  const usesProtectedBranches =
    deploymentBranchPolicy.protected_branches === true &&
    deploymentBranchPolicy.custom_branch_policies === false;
  const usesCustomBranches =
    deploymentBranchPolicy.protected_branches === false &&
    deploymentBranchPolicy.custom_branch_policies === true;
  if (!usesProtectedBranches && !usesCustomBranches) {
    throw new Error(
      'The production environment requires a protected branch policy.',
    );
  }
  if (usesCustomBranches) {
    const policies = await requestJson(
      endpointFor(
        base,
        owner,
        name,
        'environments/production/deployment-branch-policies',
      ),
      options.token,
      fetchImpl,
    );
    if (!isJsonObject(policies)) {
      throw new Error(
        'The production environment requires one exact main branch policy.',
      );
    }
    const branchPolicies = policies.branch_policies;
    const solePolicy =
      Array.isArray(branchPolicies) && branchPolicies.length === 1
        ? branchPolicies[0]
        : null;
    if (
      policies.total_count !== 1 ||
      !isJsonObject(solePolicy) ||
      solePolicy.name !== 'main' ||
      solePolicy.type !== 'branch'
    ) {
      throw new Error(
        'The production environment requires one exact main branch policy.',
      );
    }
  }
};

export const verifyProductionPromotionInputs = async (
  options: ProductionPromotionGuardOptions,
  fetchImpl: typeof fetch = fetch,
): Promise<Readonly<{ ciRunId: string }>> => {
  const [base, owner, name] = validateInputShape(options);
  const stagingRun = await verifyStagingWorkflowRun(options, fetchImpl);
  const ciRunId = await resolveCiRunId(
    base,
    owner,
    name,
    options,
    stagingRun,
    fetchImpl,
  );
  await verifyProductionEnvironment(options, fetchImpl);
  return { ciRunId };
};

export const writeCiRunOutput = (
  ciRunId: string,
  outputPath: string | undefined,
): void => {
  if (!/^[0-9]+$/u.test(ciRunId)) {
    throw new Error('CI run ID must be numeric.');
  }
  if (!outputPath) return;
  appendFileSync(outputPath, `ci_run_id=${ciRunId}\n`, 'utf8');
};

const runFromEnvironment = async (): Promise<void> => {
  const options: ProductionPromotionGuardOptions = {
    apiUrl: process.env.GITHUB_API_URL ?? '',
    confirmProduction: process.env.CONFIRM_PRODUCTION === 'true',
    ref: process.env.GITHUB_REF ?? '',
    repository: process.env.GITHUB_REPOSITORY ?? '',
    sourceSha: process.env.DEPLOY_SHA ?? '',
    stagingRunId: process.env.STAGING_RUN_ID ?? '',
    token: process.env.GITHUB_TOKEN ?? '',
  };
  const { ciRunId } = await verifyProductionPromotionInputs(options);
  writeCiRunOutput(ciRunId, process.env.GITHUB_OUTPUT);
  console.log('production_promotion_preflight=passed');
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(entrypoint)).href
) {
  try {
    await runFromEnvironment();
  } catch (error: unknown) {
    console.error(
      error instanceof Error
        ? error.message
        : 'Production promotion preflight failed.',
    );
    process.exitCode = 1;
  }
}
