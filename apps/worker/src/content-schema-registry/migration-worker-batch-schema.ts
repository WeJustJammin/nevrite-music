import {
  failure,
  hasExactKeys,
  isCounter,
  isRecord,
  schema,
  type RuntimeSchema,
} from './migration-worker-schema-core';
import type { SchemaMigrationBatchResult } from './migration-worker-plan-types';

export const SchemaMigrationBatchResultSchema: RuntimeSchema<SchemaMigrationBatchResult> =
  schema<SchemaMigrationBatchResult>((value) => {
    if (!isRecord(value)) return failure([], 'batch result must be an object');
    const keys = [
      'done',
      'cursor',
      'progress',
      'sourceCount',
      'targetCount',
      'rowErrorCount',
      'migratedCount',
      'failedCount',
    ] as const;
    if (!hasExactKeys(value, keys))
      return failure([], 'batch result keys are not allowed');
    if (typeof value.done !== 'boolean')
      return failure(['done'], 'done is invalid');
    if (!isCounter(value.cursor))
      return failure(['cursor'], 'cursor is invalid');
    if (
      typeof value.progress !== 'number' ||
      !Number.isFinite(value.progress) ||
      value.progress < 0 ||
      value.progress > 1
    )
      return failure(['progress'], 'progress is invalid');
    for (const key of [
      'sourceCount',
      'targetCount',
      'rowErrorCount',
      'migratedCount',
      'failedCount',
    ] as const) {
      if (!isCounter(value[key])) return failure([key], `${key} is invalid`);
    }
    const cursor = value.cursor as string;
    const sourceCount = value.sourceCount as string;
    const targetCount = value.targetCount as string;
    const rowErrorCount = value.rowErrorCount as string;
    const migratedCount = value.migratedCount as string;
    const failedCount = value.failedCount as string;
    return {
      success: true,
      data: {
        done: value.done,
        cursor,
        progress: value.progress,
        sourceCount,
        targetCount,
        rowErrorCount,
        migratedCount,
        failedCount,
      },
    };
  });
