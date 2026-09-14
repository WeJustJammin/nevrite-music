import { randomUUID } from 'node:crypto';
import { appendFileSync, lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  ContentSchemaRegistryAc265PrepareRunRequestSchema,
  ContentSchemaRegistryAc265RunnerAuthorizationSchema,
  type ContentSchemaRegistryAc265PrepareRunRequest,
  type ContentSchemaRegistryAc265RunnerAuthorization,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';

import { requestAc265HostedRunAuthorization } from './ac265-github-oidc-client.ts';

const FAILURE = 'AC265 hosted-runner authorization failed';
const SAFE_FAILURE_PHASES = new Map<string, string>([
  ['AC265 hosted-run destination validation failed', 'destination_validation'],
  ['AC265 GitHub OIDC token request failed', 'oidc_request'],
  ['AC265 hosted-run preparation request failed', 'staging_prepare'],
]);

const safeFailureMessage = (error: unknown): string => {
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : undefined;
  const phase =
    message === undefined ? undefined : SAFE_FAILURE_PHASES.get(message);
  return phase === undefined ? FAILURE : `${FAILURE} [${phase}]`;
};

export type Ac265HostedRunnerAuthorizationSummary = Pick<
  ContentSchemaRegistryAc265RunnerAuthorization,
  'authorizationRef' | 'runId' | 'expiresAt' | 'state'
>;

export interface RunAc265HostedRunnerAuthorizationOptions {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly createRunId?: () => string;
  readonly requestAuthorization?: typeof requestAc265HostedRunAuthorization;
  readonly fetcher?: typeof fetch;
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

const safeSummaryPath = (path: string): string => {
  try {
    if (
      !isAbsolute(path) ||
      resolve(path) !== path ||
      path.includes('\0') ||
      path.includes('\n') ||
      path.includes('\r') ||
      realpathSync(path) !== path
    )
      throw new Error(FAILURE);
    const file = lstatSync(path);
    if (!file.isFile() || file.isSymbolicLink()) throw new Error(FAILURE);
    return path;
  } catch {
    throw new Error(FAILURE);
  }
};

const writeSummary = (
  path: string,
  authorization: Ac265HostedRunnerAuthorizationSummary,
): void => {
  const summary = [
    '## AC265 hosted-runner authorization foundation',
    '',
    'Authorization foundation only. Hosted browser acceptance was not run.',
    '',
    `- State: \`${authorization.state}\``,
    `- Run ID: \`${authorization.runId}\``,
    `- Expires at: \`${authorization.expiresAt}\``,
    '',
  ].join('\n');
  appendFileSync(path, summary, { encoding: 'utf8' });
};

export const runAc265HostedRunnerAuthorization = async ({
  env,
  createRunId = randomUUID,
  requestAuthorization = requestAc265HostedRunAuthorization,
  fetcher,
}: RunAc265HostedRunnerAuthorizationOptions): Promise<Ac265HostedRunnerAuthorizationSummary> => {
  try {
    const summaryPath = safeSummaryPath(required(env, 'GITHUB_STEP_SUMMARY'));
    const request: ContentSchemaRegistryAc265PrepareRunRequest =
      ContentSchemaRegistryAc265PrepareRunRequestSchema.parse({
        criterion: 'P2-S09-AC-265',
        schemaVersion:
          CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
        runId: createRunId(),
        candidateRef: required(env, 'AC265_CANDIDATE_REF'),
      });
    const authorization =
      ContentSchemaRegistryAc265RunnerAuthorizationSchema.parse(
        await requestAuthorization(request, {
          environment: {
            ACTIONS_ID_TOKEN_REQUEST_URL: required(
              env,
              'ACTIONS_ID_TOKEN_REQUEST_URL',
            ),
            ACTIONS_ID_TOKEN_REQUEST_TOKEN: required(
              env,
              'ACTIONS_ID_TOKEN_REQUEST_TOKEN',
            ),
          },
          ...(fetcher === undefined ? {} : { fetcher }),
        }),
      );
    if (authorization.runId !== request.runId) throw new Error(FAILURE);

    const summary: Ac265HostedRunnerAuthorizationSummary = {
      authorizationRef: authorization.authorizationRef,
      runId: authorization.runId,
      expiresAt: authorization.expiresAt,
      state: authorization.state,
    };
    writeSummary(summaryPath, summary);
    return summary;
  } catch (error: unknown) {
    const message = safeFailureMessage(error);
    // eslint-disable-next-line preserve-caught-error -- Provider errors can contain bearer material or response bodies.
    throw new Error(message);
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
    await runAc265HostedRunnerAuthorization({ env: process.env });
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : FAILURE);
    process.exitCode = 1;
  }
}
