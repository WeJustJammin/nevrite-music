import { createHash } from 'node:crypto';

import type {
  QueryQueueMessageOperationsResult,
  QueryWorkersObservabilityEventsResult,
} from './content-schema-registry-slo-provider.ts';

export const DATASET_PATH = 'slo/dataset.json' as const;
export const MEASUREMENT_PATH = 'slo/measurement.json' as const;
export const SLO_PATH = 'slo/ac211-slo.json' as const;

export type Ac211Window = Readonly<{
  startedAt: string;
  endedAt: string;
}>;

export type BuildContentSchemaRegistrySloEvidenceInput = Readonly<{
  createdAt: string;
  deploymentId: string;
  productionDeployedAt: string;
  queryId: string;
  queue: QueryQueueMessageOperationsResult;
  sourceRevision: string;
  telemetry: QueryWorkersObservabilityEventsResult;
  window: Ac211Window;
}>;

export type ContentSchemaRegistrySloEvidencePaths = Readonly<{
  dataset: string;
  measurement: string;
  slo: string;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, canonicalize(value[key])]),
  );
};

export const serializeContentSchemaRegistrySloReport = (
  value: unknown,
): string => `${JSON.stringify(canonicalize(value), null, 2)}\n`;

export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
