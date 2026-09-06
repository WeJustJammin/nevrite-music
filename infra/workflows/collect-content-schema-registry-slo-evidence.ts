import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { CONTENT_SCHEMA_REGISTRY_AC211_MAX_PAGES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import {
  queryQueueMessageOperations,
  queryWorkersObservabilityEvents,
} from './content-schema-registry-slo-provider.ts';
import { buildContentSchemaRegistrySloEvidence } from './content-schema-registry-slo-evidence-builder.ts';
import { writeContentSchemaRegistrySloEvidence } from './content-schema-registry-slo-evidence-publisher.ts';

export { buildContentSchemaRegistrySloEvidence } from './content-schema-registry-slo-evidence-builder.ts';
export { serializeContentSchemaRegistrySloReport } from './content-schema-registry-slo-evidence-shared.ts';
export { writeContentSchemaRegistrySloEvidence } from './content-schema-registry-slo-evidence-publisher.ts';
export type {
  BuildContentSchemaRegistrySloEvidenceInput,
  ContentSchemaRegistrySloEvidencePaths,
} from './content-schema-registry-slo-evidence-shared.ts';

const requiredEnvironment = (name: string): string => {
  const value = process.env[name] ?? '';
  if (value.length === 0 || /[\r\n]/u.test(value))
    throw new Error(`AC211 collector configuration is missing: ${name}.`);
  return value;
};

const runFromEnvironment = async (): Promise<void> => {
  const sourceRevision = requiredEnvironment('SOURCE_REVISION');
  const deploymentId = requiredEnvironment('PRODUCTION_DEPLOYMENT_ID');
  const productionDeployedAt = requiredEnvironment('PRODUCTION_DEPLOYED_AT');
  const queryId = requiredEnvironment('QUERY_ID');
  const window = {
    startedAt: requiredEnvironment('WINDOW_START'),
    endedAt: requiredEnvironment('WINDOW_END'),
  };
  const token = requiredEnvironment('CLOUDFLARE_OBSERVABILITY_API_TOKEN');
  const accountId = requiredEnvironment('CLOUDFLARE_ACCOUNT_ID');
  const queueId = requiredEnvironment('CLOUDFLARE_PLATFORM_QUEUE_ID');
  const [telemetry, queue] = await Promise.all([
    queryWorkersObservabilityEvents({
      accountId,
      maxPages: CONTENT_SCHEMA_REGISTRY_AC211_MAX_PAGES,
      queryId,
      sourceSha: sourceRevision,
      timeframe: window,
      token,
    }),
    queryQueueMessageOperations({
      accountId,
      date: window.startedAt.slice(0, 10),
      queryId,
      queueId,
      token,
    }),
  ]);
  const output = buildContentSchemaRegistrySloEvidence({
    createdAt: new Date().toISOString(),
    deploymentId,
    productionDeployedAt,
    queryId,
    queue,
    sourceRevision,
    telemetry,
    window,
  });
  writeContentSchemaRegistrySloEvidence(
    output,
    requiredEnvironment('AC211_REPORT_DIR'),
  );
  process.stdout.write('content_schema_registry_ac211_evidence=collected\n');
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(entrypoint)).href
) {
  try {
    await runFromEnvironment();
  } catch (error: unknown) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'AC211 evidence collection failed.'}\n`,
    );
    process.exitCode = 1;
  }
}
