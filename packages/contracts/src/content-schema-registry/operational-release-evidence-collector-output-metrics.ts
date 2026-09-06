import { z } from 'zod';

import { percentile } from './operational-release-evidence-collector-reports.ts';
import {
  issue,
  same,
} from './operational-release-evidence-collector-output-invariants.ts';
import type { CollectorOutputParts } from './operational-release-evidence-collector-output-types.ts';

export const validateOutputMetrics = (
  value: CollectorOutputParts,
  context: z.RefinementCtx,
): void => {
  const { dataset, measurement, slo } = value;
  for (const [field, length] of [
    ['commands', dataset.durationsMs.command.length],
    ['protectedRpcs', dataset.durationsMs.protectedRpc.length],
    ['acceptances', dataset.durationsMs.acceptance.length],
  ] as const)
    same(
      context,
      [length, measurement.samples[field]],
      ['measurement', 'samples', field],
      'Sample counts must equal sanitized duration array lengths',
    );
  if (
    dataset.durationsMs.queueFirstAttempt.length > dataset.counts.queueAttempts
  )
    issue(
      context,
      ['dataset', 'durationsMs', 'queueFirstAttempt'],
      'Queue first-attempt samples must be present and cannot exceed total attempts',
    );
  for (const field of [
    'commands',
    'protectedRpcs',
    'acceptances',
    'queueAttempts',
    'dlqMessages',
    'errorCount',
  ] as const) {
    const datasetValue =
      field === 'commands' ||
      field === 'protectedRpcs' ||
      field === 'acceptances'
        ? measurement.samples[field]
        : dataset.counts[field];
    same(
      context,
      [datasetValue, measurement.samples[field], slo.samples[field]],
      ['measurement', 'samples', field],
      'Dataset, measurement, and SLO counts must match',
    );
  }
  for (const [field, values, quantile] of [
    ['commandP95Ms', dataset.durationsMs.command, 0.95],
    ['protectedRpcP95Ms', dataset.durationsMs.protectedRpc, 0.95],
    ['acceptanceP99Ms', dataset.durationsMs.acceptance, 0.99],
    ['queueFirstAttemptP95Ms', dataset.durationsMs.queueFirstAttempt, 0.95],
  ] as const)
    same(
      context,
      [
        percentile(values, quantile),
        measurement.observed[field],
        slo.observed[field],
      ],
      ['measurement', 'observed', field],
      'Observed percentiles must be recomputed from sanitized durations',
    );
  const dailyDlqRate =
    dataset.counts.dlqMessages / dataset.counts.queueAttempts;
  same(
    context,
    [
      dailyDlqRate,
      measurement.observed.dailyDlqRate,
      slo.observed.dailyDlqRate,
    ],
    ['measurement', 'observed', 'dailyDlqRate'],
    'Daily DLQ rate must be derived from dataset counts',
  );
  for (const field of [
    'commandP95Ms',
    'protectedRpcP95Ms',
    'acceptanceP99Ms',
    'queueFirstAttemptP95Ms',
    'dailyDlqRate',
  ] as const)
    if (measurement.observed[field] >= measurement.thresholds[field])
      issue(
        context,
        ['measurement', 'observed', field],
        'Observed value must remain below the locked SLO threshold',
      );
};
