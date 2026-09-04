import {
  failure,
  hasExactKeys,
  isRecord,
  isUuid,
  isVersion,
  schema,
  validateNullableUuid,
  withinJsonBudget,
  type RuntimeSchema,
} from './migration-worker-schema-core';

export type SchemaMigrationJobPayload = Readonly<{
  schemaVersionId: string;
  migrationPlanId: string;
  expectedVersion: string;
  correlationId: string;
  causationId: string | null;
}>;

export const SchemaMigrationJobPayloadSchema: RuntimeSchema<SchemaMigrationJobPayload> =
  schema<SchemaMigrationJobPayload>((value) => {
    if (!isRecord(value)) return failure([], 'job must be an object');
    if (
      !hasExactKeys(value, [
        'schemaVersionId',
        'migrationPlanId',
        'expectedVersion',
        'correlationId',
        'causationId',
      ])
    )
      return failure([], 'job keys are not allowed');
    if (!withinJsonBudget(value)) return failure([], 'job exceeds size limit');
    if (!isUuid(value.schemaVersionId))
      return failure(['schemaVersionId'], 'schemaVersionId is invalid');
    if (!isUuid(value.migrationPlanId))
      return failure(['migrationPlanId'], 'migrationPlanId is invalid');
    if (!isVersion(value.expectedVersion))
      return failure(['expectedVersion'], 'expectedVersion is invalid');
    if (!isUuid(value.correlationId))
      return failure(['correlationId'], 'correlationId is invalid');
    if (!validateNullableUuid(value.causationId))
      return failure(['causationId'], 'causationId is invalid');
    return {
      success: true,
      data: {
        schemaVersionId: value.schemaVersionId,
        migrationPlanId: value.migrationPlanId,
        expectedVersion: value.expectedVersion,
        correlationId: value.correlationId,
        causationId: value.causationId,
      },
    };
  });
