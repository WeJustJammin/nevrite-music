import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyCloudflareObservabilityToken } from '../verify-cloudflare-observability.ts';
import { writeProviderReleaseEvidenceFile } from './provider-release-evidence-files.ts';
import {
  AC209_ALERT_CONDITION_THRESHOLDS,
  AC209_ALERT_ROUTE,
  AC209_DEFAULT_ARTIFACT_PATH,
  AC209_REQUIRED_BINDINGS,
  AC209_RUNBOOK,
  AC209_WORKER_NAME,
  Ac209AlertConfigurationReportSchema,
  type Ac209AlertConfigurationReport,
  type Ac209ProviderState,
} from './ac209-alert-configuration-contract.ts';
import { assertAc209ProviderState } from './ac209-collector-validation.ts';
import { readAc209ProviderStateFromCloudflare } from './ac209-provider-client.ts';
import { collectAc209WranglerVersionAttestation } from './ac209-wrangler-version-attestation.ts';
import { CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS } from '../../packages/observability/src/content-schema-registry-alert-thresholds.ts';
export * from './ac209-alert-configuration-contract.ts';
export { readAc209ProviderStateFromCloudflare } from './ac209-provider-client.ts';
const CLOUDFLARE_ACCOUNT_ID = /^[0-9a-f]{32}$/u;
const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const SAFE_REFERENCE = /^[A-Za-z0-9][A-Za-z0-9._:/#?=&%+@-]{0,255}$/u;
const SAFE_ARTIFACT_PATH = /^[A-Za-z0-9._/-]{1,256}$/u;
type FetchImplementation = typeof fetch;
type VerifyObservability = typeof verifyCloudflareObservabilityToken;
export type CollectAc209AlertConfigurationInput = {
  accountId: string;
  observabilityToken: string;
  providerToken: string;
  sourceRevision: string;
  productionVersionId: string;
  expectedDlqId: string;
  expectedSupabaseUrl: string;
  expectedAlertEmailSha256: string;
  configurationId: string;
  configurationReference: string;
  execution: { environment: string; ref: string; checkedOutSha: string };
  readProviderState: () => Promise<unknown>;
  verifyObservability?: VerifyObservability;
  fetchImpl?: FetchImplementation;
  capturedAt?: string;
  artifactPath?: string;
  outputPath?: string;
  workspaceRoot?: string;
};
export type CollectAc209AlertConfigurationResult = {
  report: Ac209AlertConfigurationReport;
  outputPath?: string;
  sha256: string;
};
const fail = (message: string): never => {
  throw new Error(`AC209 configuration check failed: ${message}`);
};
const requireSecret = (value: string, name: string): void => {
  if (typeof value !== 'string' || value.length === 0)
    fail(`${name} is unavailable`);
};
const assertSafeId = (value: string, name: string): void => {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) || value.length > 128)
    fail(`${name} is invalid`);
};
const assertExact = (
  actual: unknown,
  expected: unknown,
  message: string,
): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(message);
};
const assertInput = (input: CollectAc209AlertConfigurationInput): void => {
  if (!CLOUDFLARE_ACCOUNT_ID.test(input.accountId))
    fail('Cloudflare account ID is invalid');
  if (!SOURCE_REVISION.test(input.sourceRevision))
    fail('source revision is invalid');
  for (const [value, name] of [
    [input.productionVersionId, 'production version ID'],
    [input.expectedDlqId, 'expected DLQ ID'],
    [input.configurationId, 'configuration ID'],
  ] as const)
    assertSafeId(value, name);
  if (!SAFE_REFERENCE.test(input.configurationReference))
    fail('configuration reference is invalid');
  if (!SHA256.test(input.expectedAlertEmailSha256))
    fail('approved alert destination digest is invalid');
  let supabaseOrigin: URL;
  try {
    supabaseOrigin = new URL(input.expectedSupabaseUrl);
  } catch {
    fail('approved Supabase URL is invalid');
  }
  if (
    supabaseOrigin.protocol !== 'https:' ||
    !supabaseOrigin.hostname.endsWith('.supabase.co') ||
    supabaseOrigin.pathname !== '/'
  )
    fail('approved Supabase URL is invalid');
  if (
    input.execution.environment !== 'production' ||
    input.execution.ref !== 'refs/heads/main' ||
    input.execution.checkedOutSha !== input.sourceRevision
  )
    fail(
      'protected production execution is not exact main at the requested SHA',
    );
  requireSecret(input.observabilityToken, 'CLOUDFLARE_OBSERVABILITY_API_TOKEN');
  requireSecret(input.providerToken, 'CLOUDFLARE_API_TOKEN');
  const artifactPath = input.artifactPath ?? AC209_DEFAULT_ARTIFACT_PATH;
  if (
    !SAFE_ARTIFACT_PATH.test(artifactPath) ||
    artifactPath.includes('..') ||
    artifactPath.startsWith('/')
  )
    fail('artifact path is unsafe');
};
const buildReport = (
  input: CollectAc209AlertConfigurationInput,
  state: Ac209ProviderState,
  deployment: Ac209ProviderState['deployments'][number],
): Ac209AlertConfigurationReport => {
  const report = {
    schemaVersion: 'ac209-alert-configuration-v1',
    artifactPath: input.artifactPath ?? AC209_DEFAULT_ARTIFACT_PATH,
    sourceRevision: input.sourceRevision,
    environment: 'production',
    provider: 'approved_scheduled_boundary',
    configurationId: input.configurationId,
    configurationReference: input.configurationReference,
    worker: {
      name: AC209_WORKER_NAME,
      deploymentId: deployment.id,
      versionId: input.productionVersionId,
      trafficPercent: 100,
      sourceRevision: input.sourceRevision,
      deployedAt: deployment.createdAt,
      deploymentSource: deployment.source,
      deploymentTriggeredBy: deployment.annotations['workers/triggered_by'],
      versionTriggeredBy: state.settings.versionAnnotations.triggeredBy,
      versionTag: state.settings.versionAnnotations.tag,
      versionMessage: state.settings.versionAnnotations.message,
    },
    schedule: { cron: '* * * * *' },
    bindings: AC209_REQUIRED_BINDINGS.map((binding) => ({ ...binding })),
    verifiedSettings: {
      versionId: state.settings.versionId,
      versionSource: state.settings.versionSource,
      versionCreatedAt: state.settings.versionCreatedAt,
      appEnvironment: state.settings.appEnvironment,
      appRelease: state.settings.appRelease,
      cloudflareAccountId: state.settings.cloudflareAccountId,
      dlqId: state.settings.dlqId,
      supabaseUrl: state.settings.supabaseUrl,
      queueName: state.settings.queueName,
      alertEmailSha256: state.settings.alertEmailSha256,
    },
    observability: state.observability,
    configuredConditions: [...CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS],
    thresholds: { ...CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS },
    conditionThresholds: [...AC209_ALERT_CONDITION_THRESHOLDS],
    route: AC209_ALERT_ROUTE,
    runbook: AC209_RUNBOOK,
    permissionChecks: {
      observabilityLogs: true,
      queueAnalytics: true,
      workerSettings: true,
      workerSchedules: true,
      workerDeployments: true,
    },
    capturedAt: input.capturedAt ?? new Date().toISOString(),
  };
  const parsed = Ac209AlertConfigurationReportSchema.safeParse(report);
  if (!parsed.success || parsed.data === undefined)
    fail('redacted configuration report is malformed');
  assertExact(
    parsed.data.configuredConditions,
    [...CONTENT_SCHEMA_REGISTRY_ALERT_CONDITIONS],
    'locked alert condition set changed',
  );
  assertExact(
    parsed.data.thresholds,
    { ...CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS },
    'locked alert thresholds changed',
  );
  assertExact(
    parsed.data.conditionThresholds,
    [...AC209_ALERT_CONDITION_THRESHOLDS],
    'locked condition threshold rules changed',
  );
  assertExact(
    parsed.data.bindings,
    [...AC209_REQUIRED_BINDINGS],
    'required binding set changed',
  );
  return parsed.data;
};
export const collectContentSchemaRegistryAlertConfiguration = async (
  input: CollectAc209AlertConfigurationInput,
): Promise<CollectAc209AlertConfigurationResult> => {
  assertInput(input);
  const verify =
    input.verifyObservability ?? verifyCloudflareObservabilityToken;
  if (input.fetchImpl === undefined)
    await verify({
      accountId: input.accountId,
      token: input.observabilityToken,
    });
  else
    await verify(
      { accountId: input.accountId, token: input.observabilityToken },
      input.fetchImpl,
    );
  const { state, activeDeployment } = assertAc209ProviderState(
    await input.readProviderState(),
    input,
  );
  const report = buildReport(input, state, activeDeployment);
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const sha256 = createHash('sha256').update(serialized).digest('hex');
  if (input.outputPath !== undefined) {
    const workspaceRoot = input.workspaceRoot;
    if (workspaceRoot === undefined)
      fail('workspace root is required when writing an artifact');
    if (existsSync(input.outputPath)) fail('artifact already exists');
    writeProviderReleaseEvidenceFile(
      serialized,
      input.outputPath,
      workspaceRoot,
    );
  }
  return { report, outputPath: input.outputPath, sha256 };
};
const run = async (): Promise<void> => {
  const workspaceRoot = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const artifactPath =
    process.env['AC209_OUTPUT_PATH'] ?? AC209_DEFAULT_ARTIFACT_PATH;
  const outputPath = resolve(workspaceRoot, artifactPath);
  const accountId = process.env['CLOUDFLARE_ACCOUNT_ID'] ?? '';
  const providerToken = process.env['CLOUDFLARE_API_TOKEN'] ?? '';
  const sourceRevision = process.env['SOURCE_REVISION'] ?? '';
  const result = await collectContentSchemaRegistryAlertConfiguration({
    accountId,
    observabilityToken: process.env['CLOUDFLARE_OBSERVABILITY_API_TOKEN'] ?? '',
    providerToken,
    sourceRevision,
    productionVersionId: process.env['PRODUCTION_VERSION_ID'] ?? '',
    expectedDlqId: process.env['EXPECTED_DLQ_ID'] ?? '',
    expectedSupabaseUrl: process.env['EXPECTED_SUPABASE_URL'] ?? '',
    expectedAlertEmailSha256: process.env['EXPECTED_ALERT_EMAIL_SHA256'] ?? '',
    configurationId: process.env['CONFIGURATION_ID'] ?? '',
    configurationReference: process.env['CONFIGURATION_REFERENCE'] ?? '',
    execution: {
      environment: process.env['GITHUB_ENVIRONMENT'] ?? '',
      ref: process.env['GITHUB_REF'] ?? '',
      checkedOutSha: process.env['CHECKED_OUT_SHA'] ?? '',
    },
    readProviderState: () => {
      const versionId = process.env['PRODUCTION_VERSION_ID'] ?? '';
      const versionAttestation = collectAc209WranglerVersionAttestation({
        workspaceRoot,
        versionId,
        sourceRevision,
      });
      return readAc209ProviderStateFromCloudflare({
        accountId,
        providerToken,
        versionId,
        versionAttestation,
      });
    },
    outputPath,
    workspaceRoot,
    artifactPath: artifactPath.split(sep).join('/'),
  });
  console.log(
    `AC209 redacted alert configuration captured (${relative(workspaceRoot, result.outputPath ?? '')}).`,
  );
};
const entrypoint = process.argv[1];
if (entrypoint && resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  run().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Collection failed';
    console.error(`::error::${message}`);
    process.exitCode = 1;
  });
}
