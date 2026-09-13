import { isAbsolute, normalize, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import type {
  Ac265Fetch,
  Ac265VerifiedCandidateProvenance,
} from './ac265-candidate-provenance-common.ts';
import {
  AC265_CI_ARTIFACT_DIRECTORY,
  AC265_STAGING_ARTIFACT_DIRECTORY,
  safeOrigin,
} from './ac265-candidate-provenance-common.ts';
import { verifyAc265CandidateProvenance } from './ac265-candidate-provenance.ts';

const FAILURE = 'AC265 hosted E2E collection failed';
const OUTPUT_DIRECTORY = 'ac265-output';

export interface Ac265HostedE2eCollectorConfig {
  readonly sessionBrokerOrigin: string;
  readonly evidenceServiceOrigin: string;
  readonly faultControlPlaneOrigin: string;
  readonly workloadIdentityAudience: string;
  readonly workers: 1;
  readonly retries: 0;
  readonly paths: Readonly<{
    candidateDirectory: string;
    ciBuildDirectory: string;
    privateEvidenceDirectory: string;
    sanitizedOutputDirectory: string;
    workspaceRoot: string;
  }>;
}

export type Ac265HostedE2eCollectPort = (
  provenance: Ac265VerifiedCandidateProvenance,
  config: Ac265HostedE2eCollectorConfig,
) => Promise<void>;

export interface Ac265HostedE2eCollectorOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly cwd: string;
  readonly fetchImpl?: Ac265Fetch;
  readonly collect?: Ac265HostedE2eCollectPort;
  readonly logger?: Readonly<Pick<Console, 'log'>>;
}

const required = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string => {
  const value = env[name];
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim())
    throw new Error(FAILURE);
  return value;
};

const safeWorkspaceRoot = (cwd: string): string => {
  if (
    typeof cwd !== 'string' ||
    !isAbsolute(cwd) ||
    resolve(cwd) !== cwd ||
    cwd.includes('\0')
  )
    throw new Error(FAILURE);
  return cwd;
};

const safeRelativeDirectory = (
  value: string,
  expectedName: string,
  workspaceRoot: string,
): string => {
  if (
    isAbsolute(value) ||
    value !== expectedName ||
    normalize(value) !== value ||
    value.includes('\0')
  )
    throw new Error(FAILURE);
  const absolutePath = resolve(workspaceRoot, value);
  const fromWorkspace = relative(workspaceRoot, absolutePath);
  if (
    fromWorkspace === '' ||
    fromWorkspace === '..' ||
    fromWorkspace.startsWith(`..${sep}`) ||
    isAbsolute(fromWorkspace)
  )
    throw new Error(FAILURE);
  return absolutePath;
};

const safePrivateDirectory = (value: string, workspaceRoot: string): string => {
  if (!isAbsolute(value) || resolve(value) !== value || value.includes('\0'))
    throw new Error(FAILURE);
  const fromWorkspace = relative(workspaceRoot, value);
  const isOutsideWorkspace =
    fromWorkspace === '..' ||
    fromWorkspace.startsWith(`..${sep}`) ||
    isAbsolute(fromWorkspace);
  if (fromWorkspace === '' || !isOutsideWorkspace) throw new Error(FAILURE);
  return value;
};

const safeWorkloadIdentityAudience = (value: string): string => {
  if (value.length === 0 || value !== value.trim() || value.includes('\0'))
    throw new Error(FAILURE);
  return value;
};

const readConfig = (
  env: Readonly<Record<string, string | undefined>>,
  cwd: string,
): Readonly<{
  provenanceInput: Readonly<{
    repository: string;
    token: string;
    sourceSha: string;
    stagingRunId: string;
    stagingRunAttempt: string;
    ciRunId: string;
    ciRunAttempt: string;
    stagingDeploymentId: string;
    stagingWebOrigin: string;
    stagingApiOrigin: string;
    workspaceRoot: string;
  }>;
  collector: Ac265HostedE2eCollectorConfig;
}> => {
  const workspaceRoot = safeWorkspaceRoot(cwd);
  const provenanceInput = {
    repository: required(env, 'GITHUB_REPOSITORY'),
    token: required(env, 'GITHUB_TOKEN'),
    sourceSha: required(env, 'AC265_SOURCE_SHA'),
    stagingRunId: required(env, 'AC265_STAGING_RUN_ID'),
    stagingRunAttempt: required(env, 'AC265_STAGING_RUN_ATTEMPT'),
    ciRunId: required(env, 'AC265_CI_RUN_ID'),
    ciRunAttempt: required(env, 'AC265_CI_RUN_ATTEMPT'),
    stagingDeploymentId: required(env, 'AC265_STAGING_DEPLOYMENT_ID'),
    stagingWebOrigin: required(env, 'AC265_STAGING_WEB_ORIGIN'),
    stagingApiOrigin: required(env, 'AC265_STAGING_API_ORIGIN'),
    workspaceRoot,
  };

  if (
    required(env, 'AC265_E2E_WORKERS') !== '1' ||
    required(env, 'AC265_E2E_RETRIES') !== '0'
  )
    throw new Error(FAILURE);

  const candidateDirectory = safeRelativeDirectory(
    required(env, 'AC265_CANDIDATE_DIRECTORY'),
    AC265_STAGING_ARTIFACT_DIRECTORY,
    workspaceRoot,
  );
  const ciBuildDirectory = safeRelativeDirectory(
    required(env, 'AC265_CI_BUILD_DIRECTORY'),
    AC265_CI_ARTIFACT_DIRECTORY,
    workspaceRoot,
  );
  const sanitizedOutputDirectory = safeRelativeDirectory(
    required(env, 'AC265_SANITIZED_OUTPUT_DIR'),
    OUTPUT_DIRECTORY,
    workspaceRoot,
  );
  const privateEvidenceDirectory = safePrivateDirectory(
    required(env, 'AC265_PRIVATE_EVIDENCE_DIR'),
    workspaceRoot,
  );

  return {
    provenanceInput,
    collector: {
      sessionBrokerOrigin: safeOrigin(
        required(env, 'AC265_SESSION_BROKER_ORIGIN'),
      ),
      evidenceServiceOrigin: safeOrigin(
        required(env, 'AC265_EVIDENCE_SERVICE_ORIGIN'),
      ),
      faultControlPlaneOrigin: safeOrigin(
        required(env, 'AC265_FAULT_CONTROL_PLANE_ORIGIN'),
      ),
      workloadIdentityAudience: safeWorkloadIdentityAudience(
        required(env, 'AC265_WORKLOAD_IDENTITY_AUDIENCE'),
      ),
      workers: 1,
      retries: 0,
      paths: {
        candidateDirectory,
        ciBuildDirectory,
        privateEvidenceDirectory,
        sanitizedOutputDirectory,
        workspaceRoot,
      },
    },
  };
};

export const runAc265HostedE2eCollector = async (
  options: Ac265HostedE2eCollectorOptions,
): Promise<void> => {
  void options.logger;
  try {
    const { provenanceInput, collector } = readConfig(options.env, options.cwd);
    const provenance = await verifyAc265CandidateProvenance(
      provenanceInput,
      options.fetchImpl,
    );
    if (typeof options.collect !== 'function') throw new Error(FAILURE);
    await options.collect(provenance, collector);
  } catch {
    throw new Error(FAILURE);
  }
};

const isDirectExecution = (): boolean => {
  const entrypoint = process.argv[1];
  return (
    typeof entrypoint === 'string' &&
    pathToFileURL(resolve(entrypoint)).href === import.meta.url
  );
};

if (isDirectExecution()) {
  try {
    await runAc265HostedE2eCollector({
      env: process.env,
      cwd: process.cwd(),
    });
  } catch {
    console.error(FAILURE);
    process.exitCode = 1;
  }
}
