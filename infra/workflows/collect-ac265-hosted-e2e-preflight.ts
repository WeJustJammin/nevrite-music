import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { verifyAc265CandidateProvenance } from './ac265-candidate-provenance.ts';
import type { Ac265Fetch } from './ac265-candidate-provenance-common.ts';

const FAILURE = 'AC265 hosted E2E candidate preflight failed';

export interface Ac265HostedE2ePreflightOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly cwd: string;
  readonly fetchImpl?: Ac265Fetch;
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

export const runAc265HostedE2ePreflight = async ({
  env,
  cwd,
  fetchImpl = fetch,
  logger = console,
}: Ac265HostedE2ePreflightOptions): Promise<void> => {
  const provenance = await verifyAc265CandidateProvenance(
    {
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
      workspaceRoot: safeWorkspaceRoot(cwd),
    },
    fetchImpl,
  );

  logger.log(
    JSON.stringify({
      event: provenance.status,
      repository: provenance.repository,
      sourceRevision: provenance.sourceRevision,
      ciRunId: provenance.ci.runId,
      ciRunAttempt: provenance.ci.runAttempt,
      stagingRunId: provenance.staging.runId,
      stagingRunAttempt: provenance.staging.runAttempt,
      stagingDeploymentId: provenance.staging.deploymentId,
      stagingWebOrigin: provenance.staging.webOrigin,
    }),
  );
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
    await runAc265HostedE2ePreflight({
      env: process.env,
      cwd: process.cwd(),
    });
  } catch {
    console.error(FAILURE);
    process.exitCode = 1;
  }
}
