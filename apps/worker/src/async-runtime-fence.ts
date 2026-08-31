import { PositiveBigintDecimalSchema } from '@wejammin/contracts';
import type { RestoreFenceInput } from '@wejammin/application';

const FENCE_FIELDS = new Set([
  'expectedEpoch',
  'expected_epoch',
  'consumerEpoch',
  'consumer_epoch',
  'integrityVerified',
  'integrity_verified',
  'reconciliationComplete',
  'reconciliation_complete',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const firstRow = (value: unknown): unknown =>
  Array.isArray(value) ? (value.length === 1 ? value[0] : null) : value;

const field = (
  row: Record<string, unknown>,
  camel: string,
  snake: string,
): unknown => {
  const hasCamel = Object.prototype.hasOwnProperty.call(row, camel);
  const hasSnake = Object.prototype.hasOwnProperty.call(row, snake);
  if (hasCamel && hasSnake && row[camel] !== row[snake]) return undefined;
  return hasCamel ? row[camel] : row[snake];
};

const toEpoch = (value: unknown): string | null => {
  const candidate =
    typeof value === 'number' && Number.isSafeInteger(value) && value > 0
      ? String(value)
      : value;
  const parsed = PositiveBigintDecimalSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
};

export const parseRestoreFence = (value: unknown): RestoreFenceInput => {
  const row = firstRow(value);
  if (
    !isRecord(row) ||
    Object.keys(row).some((key) => !FENCE_FIELDS.has(key))
  ) {
    throw new Error('Invalid restore-fence result');
  }
  const expectedEpoch = toEpoch(field(row, 'expectedEpoch', 'expected_epoch'));
  const consumerEpoch = toEpoch(field(row, 'consumerEpoch', 'consumer_epoch'));
  const integrityVerified = field(
    row,
    'integrityVerified',
    'integrity_verified',
  );
  const reconciliationComplete = field(
    row,
    'reconciliationComplete',
    'reconciliation_complete',
  );
  if (
    expectedEpoch === null ||
    consumerEpoch === null ||
    expectedEpoch !== consumerEpoch ||
    typeof integrityVerified !== 'boolean' ||
    typeof reconciliationComplete !== 'boolean'
  ) {
    throw new Error('Invalid restore-fence result');
  }
  return {
    expectedEpoch,
    consumerEpoch,
    integrityVerified,
    reconciliationComplete,
  };
};
