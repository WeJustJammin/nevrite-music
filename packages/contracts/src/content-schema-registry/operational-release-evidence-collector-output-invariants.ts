import { z } from 'zod';

import {
  completeUtcDay,
  CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT,
} from './operational-release-evidence-collector-common.ts';
import type { CollectorOutputParts } from './operational-release-evidence-collector-output-types.ts';

export const issue = (
  context: z.RefinementCtx,
  path: readonly (string | number)[],
  message: string,
): void => context.addIssue({ code: 'custom', path: [...path], message });

export const same = (
  context: z.RefinementCtx,
  values: readonly unknown[],
  path: readonly (string | number)[],
  message: string,
): void => {
  if (values.some((value) => value !== values[0]))
    issue(context, path, message);
};

export const validateSlo = (
  value: CollectorOutputParts['slo'],
  context: z.RefinementCtx,
): void => {
  for (const field of [
    'commands',
    'protectedRpcs',
    'acceptances',
    'queueAttempts',
    'dlqMessages',
    'errorCount',
  ] as const)
    if (value.samples[field] > CONTENT_SCHEMA_REGISTRY_AC211_MAX_COUNT)
      issue(context, ['samples', field], 'AC211 count cap exceeded');
  if (!completeUtcDay(value.window))
    issue(
      context,
      ['window'],
      'AC211 evidence must cover one complete UTC day',
    );
};

export const validateOutputIdentity = (
  value: CollectorOutputParts,
  context: z.RefinementCtx,
): void => {
  const { dataset, measurement, slo } = value;
  for (const field of [
    'sourceRevision',
    'environment',
    'deploymentId',
    'queryId',
  ] as const)
    same(
      context,
      [dataset[field], measurement[field], slo[field]],
      ['measurement', field],
      'Dataset, measurement, and SLO identities must match',
    );
  same(
    context,
    [dataset.createdAt, measurement.createdAt],
    ['measurement', 'createdAt'],
    'Dataset and measurement creation timestamps must match',
  );
  same(
    context,
    [measurement.datasetDigest, slo.datasetReport.sha256],
    ['measurement', 'datasetDigest'],
    'Measurement dataset digest must match the SLO dataset report digest',
  );
  if (slo.datasetReport.path !== 'slo/dataset.json')
    issue(
      context,
      ['slo', 'datasetReport', 'path'],
      'SLO dataset report path must be slo/dataset.json',
    );
  if (slo.measurementReport.path !== 'slo/measurement.json')
    issue(
      context,
      ['slo', 'measurementReport', 'path'],
      'SLO measurement report path must be slo/measurement.json',
    );
  for (const field of ['startedAt', 'endedAt'] as const)
    same(
      context,
      [dataset.window[field], measurement.window[field], slo.window[field]],
      ['measurement', 'window', field],
      'Dataset, measurement, and SLO windows must match',
    );
  for (const field of [
    'pageCount',
    'eventsRead',
    'providerEventCount',
    'apiEvidenceGroups',
    'complete',
  ] as const)
    same(
      context,
      [dataset.completeness[field], measurement.completeness[field]],
      ['measurement', 'completeness', field],
      'Dataset and measurement completeness must match',
    );
  same(
    context,
    [dataset.queueAnalytics.queryId, dataset.queryId],
    ['dataset', 'queueAnalytics', 'queryId'],
    'Queue Analytics query identity must match the report query identity',
  );
  if (dataset.queueAnalytics.date !== dataset.window.startedAt.slice(0, 10))
    issue(
      context,
      ['dataset', 'queueAnalytics', 'date'],
      'Queue Analytics date must match the report UTC day',
    );
  for (const field of ['queueAttempts', 'dlqMessages'] as const)
    same(
      context,
      [dataset.queueAnalytics[field], dataset.counts[field]],
      ['dataset', 'queueAnalytics', field],
      'Queue Analytics counts must match the sanitized dataset counts',
    );
};
