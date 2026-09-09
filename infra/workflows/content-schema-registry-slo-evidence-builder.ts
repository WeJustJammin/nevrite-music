import {
  CONTENT_SCHEMA_REGISTRY_AC211_CRITERION,
  CONTENT_SCHEMA_REGISTRY_AC211_PROVIDER_PROVENANCE,
  CONTENT_SCHEMA_REGISTRY_AC211_SCHEMA_VERSION,
  CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS,
  ContentSchemaRegistryAc211CollectorOutputSchema,
  ContentSchemaRegistryAc211WindowSchema,
  type ContentSchemaRegistryAc211CollectorOutput,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import {
  DATASET_PATH,
  MEASUREMENT_PATH,
  type BuildContentSchemaRegistrySloEvidenceInput,
  serializeContentSchemaRegistrySloReport,
  sha256,
} from './content-schema-registry-slo-evidence-shared.ts';
import {
  assertApiEvidenceGroups,
  assertEventIdentityAndWindow,
  assertProviderCompleteness,
  duration,
  percentile,
  strictQueueCounts,
} from './content-schema-registry-slo-evidence-validation.ts';

export const buildContentSchemaRegistrySloEvidence = (
  input: BuildContentSchemaRegistrySloEvidenceInput,
): ContentSchemaRegistryAc211CollectorOutput => {
  const parsedWindow = ContentSchemaRegistryAc211WindowSchema.safeParse(
    input.window,
  );
  if (!parsedWindow.success)
    throw new Error('AC211 evidence window is invalid.');
  const windowStart = Date.parse(parsedWindow.data.startedAt);
  const windowEnd = Date.parse(parsedWindow.data.endedAt);
  const deployedAt = Date.parse(input.productionDeployedAt);
  const createdAt = Date.parse(input.createdAt);
  if (!Number.isFinite(deployedAt) || deployedAt > windowStart)
    throw new Error('AC211 window predates the production deployment.');
  if (!Number.isFinite(createdAt) || createdAt < windowEnd)
    throw new Error('AC211 evidence collection timestamp is invalid.');

  assertProviderCompleteness(input.telemetry);
  const command: number[] = [];
  const protectedRpc: number[] = [];
  const acceptance: number[] = [];
  const queueFirstAttempt: number[] = [];
  let errorCount = 0;

  for (const observed of input.telemetry.events) {
    assertEventIdentityAndWindow(
      observed,
      input.sourceRevision,
      windowStart,
      windowEnd,
    );
    if (
      (observed.eventName === 'cms.registry.request' ||
        observed.eventName === 'cms.registry.queue_attempt') &&
      observed.outcome !== 'success'
    )
      errorCount += 1;
    if (observed.eventName === 'cms.registry.command')
      command.push(duration(observed));
    else if (observed.eventName === 'cms.registry.rpc')
      protectedRpc.push(duration(observed));
    else if (observed.eventName === 'cms.registry.acceptance')
      acceptance.push(duration(observed));
    else if (observed.eventName === 'cms.registry.queue_attempt') {
      if (
        !Number.isSafeInteger(observed.attempt) ||
        (observed.attempt ?? 0) < 1
      )
        throw new Error('Workers Observability queue sample is invalid.');
      if (observed.attempt === 1) queueFirstAttempt.push(duration(observed));
    }
  }

  if (
    command.length < 200 ||
    protectedRpc.length < 200 ||
    acceptance.length < 200 ||
    queueFirstAttempt.length === 0
  )
    throw new Error(
      `AC211 production samples are insufficient (commands=${command.length}, protectedRpcs=${protectedRpc.length}, acceptances=${acceptance.length}, queueFirstAttempts=${queueFirstAttempt.length}).`,
    );
  const apiEvidenceGroups = assertApiEvidenceGroups(input.telemetry.events);

  const queue = strictQueueCounts(
    input.queue,
    input.queryId,
    parsedWindow.data,
  );
  if (queue.queueAttempts < queueFirstAttempt.length)
    throw new Error('AC211 Queue Analytics collection is inconsistent.');

  const observed = {
    commandP95Ms: percentile(command, 0.95),
    protectedRpcP95Ms: percentile(protectedRpc, 0.95),
    acceptanceP99Ms: percentile(acceptance, 0.99),
    queueFirstAttemptP95Ms: percentile(queueFirstAttempt, 0.95),
    dailyDlqRate: queue.dlqMessages / queue.queueAttempts,
  };
  const thresholds = { ...CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS };
  if (
    observed.commandP95Ms >= thresholds.commandP95Ms ||
    observed.protectedRpcP95Ms >= thresholds.protectedRpcP95Ms ||
    observed.acceptanceP99Ms >= thresholds.acceptanceP99Ms ||
    observed.queueFirstAttemptP95Ms >= thresholds.queueFirstAttemptP95Ms ||
    observed.dailyDlqRate >= thresholds.dailyDlqRate
  )
    throw new Error('AC211 production SLO thresholds were not met.');

  const createdAtIso = new Date(createdAt).toISOString();
  const completeness = {
    pageCount: input.telemetry.pageCount,
    eventsRead: input.telemetry.events.length,
    providerEventCount: input.telemetry.providerEventCount,
    apiEvidenceGroups,
    complete: true as const,
  };
  const samples = {
    commands: command.length,
    protectedRpcs: protectedRpc.length,
    acceptances: acceptance.length,
    queueAttempts: queue.queueAttempts,
    dlqMessages: queue.dlqMessages,
    errorCount,
  };
  const dataset = {
    criterion: CONTENT_SCHEMA_REGISTRY_AC211_CRITERION,
    schemaVersion: CONTENT_SCHEMA_REGISTRY_AC211_SCHEMA_VERSION,
    sourceRevision: input.sourceRevision,
    environment: 'production' as const,
    deploymentId: input.deploymentId,
    queryId: input.queryId,
    window: parsedWindow.data,
    providerProvenance: [...CONTENT_SCHEMA_REGISTRY_AC211_PROVIDER_PROVENANCE],
    queueAnalytics: {
      date: queue.date,
      queueId: queue.queueId,
      queryId: queue.queryId,
      queueAttempts: queue.queueAttempts,
      dlqMessages: queue.dlqMessages,
    },
    durationsMs: { command, protectedRpc, acceptance, queueFirstAttempt },
    counts: {
      queueAttempts: queue.queueAttempts,
      dlqMessages: queue.dlqMessages,
      errorCount,
    },
    completeness,
    createdAt: createdAtIso,
  };
  const datasetDigest = sha256(
    serializeContentSchemaRegistrySloReport(dataset),
  );
  const measurement = {
    criterion: CONTENT_SCHEMA_REGISTRY_AC211_CRITERION,
    schemaVersion: CONTENT_SCHEMA_REGISTRY_AC211_SCHEMA_VERSION,
    sourceRevision: input.sourceRevision,
    environment: 'production' as const,
    deploymentId: input.deploymentId,
    queryId: input.queryId,
    window: parsedWindow.data,
    datasetDigest,
    samples,
    thresholds,
    observed,
    completeness,
    createdAt: createdAtIso,
  };
  const measurementDigest = sha256(
    serializeContentSchemaRegistrySloReport(measurement),
  );
  const output = {
    dataset,
    measurement,
    slo: {
      sourceRevision: input.sourceRevision,
      environment: 'production' as const,
      deploymentId: input.deploymentId,
      queryId: input.queryId,
      measurementReport: {
        path: MEASUREMENT_PATH,
        sha256: measurementDigest,
      },
      datasetReport: { path: DATASET_PATH, sha256: datasetDigest },
      window: parsedWindow.data,
      samples,
      thresholds,
      observed,
    },
  };
  const parsed =
    ContentSchemaRegistryAc211CollectorOutputSchema.safeParse(output);
  if (!parsed.success) throw new Error('AC211 collector output is invalid.');
  return parsed.data;
};

export type { BuildContentSchemaRegistrySloEvidenceInput };
