import { appendFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  endpointFor,
  requestJson,
  validateOptions,
  verifyDeployment,
  verifySuccessfulStatus,
} from './content-schema-registry-slo-source-helpers.ts';
import { collectDeploymentStatuses } from './content-schema-registry-slo-deployment-statuses.ts';
import {
  verifyProductionJob,
  verifyProductionJobReference,
  verifyProductionDeploymentTimeline,
  verifyProductionWorkflow,
  verifyProductionWorkflowRun,
} from './content-schema-registry-slo-deployment-provenance.ts';
import type {
  ContentSchemaRegistrySloSourceOptions,
  ContentSchemaRegistrySloSourceResult,
} from './content-schema-registry-slo-source-helpers.ts';

export type {
  ContentSchemaRegistrySloSourceOptions,
  ContentSchemaRegistrySloSourceResult,
} from './content-schema-registry-slo-source-helpers.ts';

export const verifyContentSchemaRegistrySloSource = async (
  options: ContentSchemaRegistrySloSourceOptions,
  fetchImpl: typeof fetch = fetch,
): Promise<ContentSchemaRegistrySloSourceResult> => {
  const validated = validateOptions(options);
  const deploymentEndpoint = endpointFor(
    validated.base,
    validated.owner,
    validated.name,
    `deployments/${options.productionDeploymentId}`,
  );
  const deployment = verifyDeployment(
    await requestJson(
      deploymentEndpoint,
      options.token,
      fetchImpl,
      validated.timeoutMs,
      'deployment',
    ),
    validated.deploymentNumber,
    options.sourceRevision,
  );
  const successfulStatus = verifySuccessfulStatus(
    await collectDeploymentStatuses({
      base: validated.base,
      owner: validated.owner,
      name: validated.name,
      deploymentId: options.productionDeploymentId,
      token: options.token,
      fetchImpl,
      timeoutMs: validated.timeoutMs,
    }),
  );
  const jobReference = verifyProductionJobReference(
    successfulStatus.status,
    validated.owner,
    validated.name,
  );
  const job = verifyProductionJob(
    await requestJson(
      endpointFor(
        validated.base,
        validated.owner,
        validated.name,
        `actions/jobs/${jobReference.jobId}`,
      ),
      options.token,
      fetchImpl,
      validated.timeoutMs,
      'Deploy production job',
    ),
    jobReference,
    options.sourceRevision,
    successfulStatus.status,
  );
  const workflowId = verifyProductionWorkflow(
    await requestJson(
      endpointFor(
        validated.base,
        validated.owner,
        validated.name,
        'actions/workflows/deploy-production.yml',
      ),
      options.token,
      fetchImpl,
      validated.timeoutMs,
      'Deploy production workflow',
    ),
  );
  const run = verifyProductionWorkflowRun(
    await requestJson(
      endpointFor(
        validated.base,
        validated.owner,
        validated.name,
        `actions/runs/${job.runId}/attempts/${job.runAttempt}`,
      ),
      options.token,
      fetchImpl,
      validated.timeoutMs,
      'Deploy production run',
    ),
    {
      runId: job.runId,
      runAttempt: job.runAttempt,
      workflowId,
      repository: options.repository,
      sourceRevision: options.sourceRevision,
    },
  );
  const productionDeployedAt = verifyProductionDeploymentTimeline(
    deployment,
    successfulStatus.status,
    job,
    run,
    successfulStatus.timestamp,
  );
  if (validated.windowStart < productionDeployedAt)
    throw new Error('The SLO window starts before the successful deployment.');

  return {
    windowStart: new Date(validated.windowStart).toISOString(),
    windowEnd: new Date(validated.windowEnd).toISOString(),
    sourceRevision: options.sourceRevision,
    deploymentId: options.productionDeploymentId,
    productionDeployedAt: new Date(productionDeployedAt).toISOString(),
    queryId: `wejammin-ac211-${options.utcDay.replaceAll('-', '')}`,
  };
};

const OUTPUTS = [
  ['window_start', 'windowStart'],
  ['window_end', 'windowEnd'],
  ['source_revision', 'sourceRevision'],
  ['production_deployment_id', 'deploymentId'],
  ['production_deployed_at', 'productionDeployedAt'],
  ['query_id', 'queryId'],
] as const;

export const writeContentSchemaRegistrySloSourceOutput = (
  result: ContentSchemaRegistrySloSourceResult,
  outputPath: string | undefined,
): void => {
  const lines = OUTPUTS.map(([key, field]) => {
    const value = result[field];
    if (value.length === 0 || /[\r\n]/u.test(value))
      throw new Error(`SLO source output ${key} is unsafe.`);
    return `${key}=${value}`;
  });
  if (outputPath !== undefined)
    appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
};

const runFromEnvironment = async (): Promise<void> => {
  const sourceRevision =
    process.env.DEPLOYED_SOURCE_SHA ??
    process.env.SOURCE_REVISION ??
    process.env.DEPLOY_SHA ??
    '';
  const result = await verifyContentSchemaRegistrySloSource({
    apiUrl: process.env.GITHUB_API_URL ?? '',
    repository: process.env.GITHUB_REPOSITORY ?? '',
    token: process.env.GITHUB_TOKEN ?? '',
    productionDeploymentId: process.env.PRODUCTION_DEPLOYMENT_ID ?? '',
    sourceRevision,
    utcDay: process.env.UTC_DAY ?? '',
  });
  writeContentSchemaRegistrySloSourceOutput(result, process.env.GITHUB_OUTPUT);
  console.log('content_schema_registry_slo_source=passed');
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
        : 'Content schema registry SLO source preflight failed.',
    );
    process.exitCode = 1;
  }
}
