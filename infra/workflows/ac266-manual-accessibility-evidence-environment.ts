import { isAbsolute, join, resolve } from 'node:path';

const FAILURE = 'AC266 manual accessibility evidence verification failed';
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const SHA_PATTERN = /^[a-f0-9]{40}$/u;
const FIXED_CANDIDATE_PATH = 'candidate/staging-artifact-identity.json';
const FIXED_INTAKE_MANIFEST_PATH = 'manual-intake/intake-manifest.json';

export interface Ac266ManualEvidenceEnvironment {
  readonly workspaceRoot: string;
  readonly repository: string;
  readonly token: string;
  readonly sourceSha: string;
  readonly stagingRunId: string;
  readonly deploymentId: string;
  readonly manualRunId: string;
  readonly origin: string;
  readonly runnerTemp: string;
  readonly currentRunId: string;
  readonly currentRunAttempt: string;
  readonly privateEvidenceDir: string;
}

const fail = (): never => {
  throw new Error(FAILURE);
};

const required = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => {
  const value = env[name];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim())
    return fail();
  return value;
};

const safeRunId = (value: string): string => {
  if (
    !/^[1-9][0-9]{0,18}$/u.test(value) ||
    !Number.isSafeInteger(Number(value))
  )
    return fail();
  return value;
};

const safeAbsolutePath = (value: string): string => {
  if (!isAbsolute(value) || resolve(value) !== value || value.includes('\0'))
    return fail();
  return value;
};

const safeOrigin = (value: string): string => {
  try {
    const origin = new URL(value);
    if (
      origin.protocol !== 'https:' ||
      origin.username !== '' ||
      origin.password !== '' ||
      origin.pathname !== '/' ||
      origin.search !== '' ||
      origin.hash !== '' ||
      origin.origin !== value
    )
      return fail();
    return origin.origin;
  } catch {
    return fail();
  }
};

export const parseAc266ManualEvidenceEnvironment = (
  env: Readonly<Record<string, string | undefined>>,
  suppliedWorkspaceRoot: string,
): Ac266ManualEvidenceEnvironment => {
  const workspaceRoot = safeAbsolutePath(required(env, 'GITHUB_WORKSPACE'));
  if (
    typeof suppliedWorkspaceRoot !== 'string' ||
    safeAbsolutePath(suppliedWorkspaceRoot) !== workspaceRoot
  )
    return fail();
  const repository = required(env, 'GITHUB_REPOSITORY');
  const token = required(env, 'GITHUB_TOKEN');
  const sourceSha = required(env, 'DEPLOY_SHA');
  const stagingRunId = safeRunId(required(env, 'STAGING_RUN_ID'));
  const deploymentId = safeRunId(required(env, 'STAGING_DEPLOYMENT_ID'));
  const manualRunId = safeRunId(required(env, 'MANUAL_REPORT_RUN_ID'));
  const origin = safeOrigin(required(env, 'STAGING_WEB_ORIGIN'));
  const currentRunId = safeRunId(required(env, 'GITHUB_RUN_ID'));
  const currentRunAttempt = required(env, 'GITHUB_RUN_ATTEMPT');
  if (
    !REPOSITORY_PATTERN.test(repository) ||
    repository
      .split('/')
      .some((segment) => segment === '.' || segment === '..') ||
    token.length > 4096 ||
    /\s/u.test(token) ||
    !SHA_PATTERN.test(sourceSha) ||
    !/^[1-9][0-9]{0,5}$/u.test(currentRunAttempt) ||
    Number(currentRunAttempt) > 100000
  )
    return fail();

  const runnerTemp = safeAbsolutePath(required(env, 'RUNNER_TEMP'));
  const privateEvidenceDir = safeAbsolutePath(
    required(env, 'AC266_PRIVATE_EVIDENCE_DIR'),
  );
  const expectedPrivateEvidenceDir = join(
    runnerTemp,
    `ac266-private-evidence-${currentRunId}-${currentRunAttempt}`,
  );
  if (
    privateEvidenceDir !== expectedPrivateEvidenceDir ||
    required(env, 'AC266_MANUAL_REPORT_DIRECTORY') !== privateEvidenceDir ||
    required(env, 'AC266_MANUAL_CANDIDATE_PATH') !== FIXED_CANDIDATE_PATH ||
    required(env, 'AC266_MANUAL_INTAKE_MANIFEST_PATH') !==
      FIXED_INTAKE_MANIFEST_PATH
  )
    return fail();

  return {
    workspaceRoot,
    repository,
    token,
    sourceSha,
    stagingRunId,
    deploymentId,
    manualRunId,
    origin,
    runnerTemp,
    currentRunId,
    currentRunAttempt,
    privateEvidenceDir,
  };
};
