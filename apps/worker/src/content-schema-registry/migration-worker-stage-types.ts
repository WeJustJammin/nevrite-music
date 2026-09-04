import type {
  SchemaMigrationJobPayload,
  SchemaMigrationQueueEnvelope,
} from './migration-worker-input-schemas';
import type { MigrationPlanRecord } from './migration-worker-plan-schemas';
import type { MigrationWorkerResult } from './migration-worker-types';
import type { MigrationWorkerRuntime } from './migration-worker-runtime';

export type MigrationExecutionInput = Readonly<{
  runtime: MigrationWorkerRuntime;
  plan: MigrationPlanRecord;
  event: SchemaMigrationQueueEnvelope | null;
  job: SchemaMigrationJobPayload;
  leaseToken: string | null;
  signal: AbortSignal;
  attempt: number;
}>;

export type MigrationStageResult =
  | MigrationWorkerResult
  | Readonly<{ plan: MigrationPlanRecord; leaseToken: string | null }>;

export const isMigrationWorkerResult = (
  value: MigrationStageResult,
): value is MigrationWorkerResult => 'outcome' in value;
