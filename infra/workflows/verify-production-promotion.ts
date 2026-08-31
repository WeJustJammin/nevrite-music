import { pathToFileURL } from 'node:url';

const SOURCE_SHA_PATTERN = /^[0-9a-f]{40}$/u;
const STAGING_RUN_ID_PATTERN = /^[0-9]+$/u;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const STAGING_WORKFLOW_ID = 346315228;
const STAGING_WORKFLOW_PATH = '.github/workflows/deploy-staging.yml';

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

export const verifyStagingWorkflowRun = async (
  options: ProductionPromotionGuardOptions,
  fetchImpl: typeof fetch = fetch,
): Promise<void> => {
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
  const hasRequiredReviewers =
    Array.isArray(protectionRules) &&
    protectionRules.some(
      (rule) =>
        isJsonObject(rule) &&
        rule.type === 'required_reviewers' &&
        Array.isArray(rule.reviewers) &&
        rule.reviewers.length > 0,
    );
  if (!hasRequiredReviewers) {
    throw new Error(
      'The production environment requires production reviewers.',
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
): Promise<void> => {
  validateInputShape(options);
  await verifyStagingWorkflowRun(options, fetchImpl);
  await verifyProductionEnvironment(options, fetchImpl);
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
  await verifyProductionPromotionInputs(options);
  console.log('production_promotion_preflight=passed');
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(entrypoint).href
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
