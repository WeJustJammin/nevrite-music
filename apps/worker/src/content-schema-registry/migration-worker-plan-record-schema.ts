import { MIGRATION_STATES } from './migration-worker-constants';
import {
  failure,
  hasExactKeys,
  isCounter,
  isHash,
  isInstant,
  isRecord,
  isSafeToken,
  isUuid,
  isVersion,
  schema,
  type RuntimeSchema,
} from './migration-worker-schema-core';
import type { MigrationPlanRecord } from './migration-worker-plan-types';
import { toMigrationPlanRecord } from './migration-worker-plan-record-output';

const migrationStates = new Set<string>(MIGRATION_STATES);

export const MigrationPlanRecordSchema: RuntimeSchema<MigrationPlanRecord> =
  schema<MigrationPlanRecord>((value) => {
    if (!isRecord(value)) return failure([], 'plan must be an object');
    const keys = [
      'id',
      'contentTypeId',
      'fromVersionId',
      'toVersionId',
      'state',
      'version',
      'cursor',
      'progress',
      'sourceCount',
      'targetCount',
      'rowErrorCount',
      'migratedCount',
      'failedCount',
      'classification',
      'transformKey',
      'transformVersion',
      'compilerHash',
      'sourceHash',
      'targetHash',
      'activeVersionId',
      'leaseOwner',
      'leaseToken',
      'leaseExpiresAt',
    ] as const;
    if (!hasExactKeys(value, keys))
      return failure([], 'plan keys are not allowed');
    for (const key of [
      'id',
      'contentTypeId',
      'fromVersionId',
      'toVersionId',
      'activeVersionId',
    ] as const) {
      if (!isUuid(value[key])) return failure([key], `${key} is invalid`);
    }
    if (value.fromVersionId === value.toVersionId)
      return failure(['toVersionId'], 'source and target versions must differ');
    if (typeof value.state !== 'string' || !migrationStates.has(value.state))
      return failure(['state'], 'state is invalid');
    if (
      !isVersion(value.version) ||
      !isCounter(value.cursor) ||
      !isCounter(value.sourceCount) ||
      !isCounter(value.targetCount) ||
      !isCounter(value.rowErrorCount) ||
      !isCounter(value.migratedCount) ||
      !isCounter(value.failedCount)
    )
      return failure([], 'plan counters are invalid');
    if (
      typeof value.progress !== 'number' ||
      !Number.isFinite(value.progress) ||
      value.progress < 0 ||
      value.progress > 1
    )
      return failure(['progress'], 'progress is invalid');
    if (
      value.classification !== 'additive' &&
      value.classification !== 'conditional' &&
      value.classification !== 'breaking'
    )
      return failure(['classification'], 'classification is invalid');
    if (
      (value.classification === 'additive' &&
        (value.transformKey !== null || value.transformVersion !== null)) ||
      (value.classification !== 'additive' &&
        (value.transformKey === null || value.transformVersion === null))
    )
      return failure(['transformKey'], 'transform pair is invalid');
    if (
      value.transformKey !== null &&
      (typeof value.transformKey !== 'string' ||
        (!isSafeToken(value.transformKey) &&
          !/^[a-z][a-z0-9._-]{0,127}$/u.test(value.transformKey)))
    )
      return failure(['transformKey'], 'transformKey is invalid');
    if (value.transformVersion !== null && !isVersion(value.transformVersion))
      return failure(['transformVersion'], 'transformVersion is invalid');
    if (
      !isHash(value.compilerHash) ||
      !isHash(value.sourceHash) ||
      !isHash(value.targetHash)
    )
      return failure([], 'plan hashes are invalid');
    if (value.leaseOwner !== null && !isSafeToken(value.leaseOwner, 200))
      return failure(['leaseOwner'], 'leaseOwner is invalid');
    if (value.leaseToken !== null && !isSafeToken(value.leaseToken, 200))
      return failure(['leaseToken'], 'leaseToken is invalid');
    if (value.leaseExpiresAt !== null && !isInstant(value.leaseExpiresAt))
      return failure(['leaseExpiresAt'], 'leaseExpiresAt is invalid');
    return {
      success: true,
      data: toMigrationPlanRecord(value),
    };
  });
