import type { ProviderEvidenceProjection } from './provider-evidence-types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const KEY_PATTERN = /^[a-z][a-z0-9_.:-]{0,127}$/u;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/u;
const OPERATION_TYPE_PATTERN = /^[a-z][a-z0-9_.:-]{0,127}$/u;
const VERSION_PATTERN = /^[1-9][0-9]{0,18}$/u;
const MAX_VERSION = 9_223_372_036_854_775_807n;
const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/u;
const PROVIDER_OPERATION_STATES = [
  'planned',
  'pending',
  'confirmed',
  'failed',
  'manual_review',
] as const;
const WEBHOOK_RECEIPT_STATES = [
  'received',
  'accepted',
  'duplicate',
  'rejected',
  'processed',
  'failed',
  'manual_review',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value).sort();
  return (
    keys.length === expected.length &&
    expected.every((key, index) => keys[index] === key)
  );
};

const requiredString = (
  value: unknown,
  predicate: (candidate: string) => boolean,
  label: string,
): string => {
  if (typeof value !== 'string' || !predicate(value)) {
    throw new TypeError(`Invalid provider evidence ${label}`);
  }
  return value;
};

const requiredUuid = (value: unknown, label: string): string =>
  requiredString(value, (candidate) => UUID_PATTERN.test(candidate), label);

const requiredDigest = (value: unknown, label: string): string =>
  requiredString(value, (candidate) => DIGEST_PATTERN.test(candidate), label);

const requiredTimestamp = (value: unknown, label: string): string =>
  requiredString(
    value,
    (candidate) =>
      ISO_TIMESTAMP_PATTERN.test(candidate) &&
      Number.isFinite(Date.parse(candidate)),
    label,
  );

const requiredVersion = (value: unknown): string =>
  requiredString(
    value,
    (candidate) =>
      VERSION_PATTERN.test(candidate) && BigInt(candidate) <= MAX_VERSION,
    'version',
  );

const requiredKey = (value: unknown, label: string): string =>
  requiredString(value, (candidate) => KEY_PATTERN.test(candidate), label);

const isSafeText = (candidate: string): boolean =>
  candidate.length >= 1 &&
  candidate.length <= 128 &&
  [...candidate].every((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && codePoint >= 0x20 && codePoint !== 0x7f;
  });

const requiredSafeText = (value: unknown, label: string): string =>
  requiredString(value, isSafeText, label);

const requiredEnum = <T extends string>(
  value: unknown,
  values: readonly T[],
  label: string,
): T => {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new TypeError(`Invalid provider evidence ${label}`);
  }
  return value as T;
};

const requiredBoolean = (value: unknown, label: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new TypeError(`Invalid provider evidence ${label}`);
  }
  return value;
};

/** Converts a server disclosure response to the safe evidence projection. */
export function createProviderEvidenceProjection(
  input: unknown,
): ProviderEvidenceProjection {
  if (
    !isRecord(input) ||
    !isRecord(input.operation) ||
    !(input.receipt === null || isRecord(input.receipt)) ||
    !isRecord(input.provenance) ||
    !isRecord(input.scope) ||
    !hasExactKeys(input, ['operation', 'provenance', 'receipt', 'scope']) ||
    !hasExactKeys(input.operation, [
      'id',
      'operationType',
      'payloadDigest',
      'provider',
      'state',
      'version',
    ]) ||
    !hasExactKeys(input.provenance, [
      'lastVerifiedAt',
      'observedAt',
      'source',
    ]) ||
    !hasExactKeys(input.scope, ['kind', 'label'])
  ) {
    throw new TypeError('Invalid provider evidence fields');
  }

  const operation = {
    id: requiredUuid(input.operation.id, 'operation ID'),
    provider: requiredKey(input.operation.provider, 'provider'),
    operationType: requiredString(
      input.operation.operationType,
      (candidate) => OPERATION_TYPE_PATTERN.test(candidate),
      'operation type',
    ),
    state: requiredEnum(
      input.operation.state,
      PROVIDER_OPERATION_STATES,
      'operation state',
    ),
    payloadDigest: requiredDigest(
      input.operation.payloadDigest,
      'operation payload digest',
    ),
    version: requiredVersion(input.operation.version),
  };

  let receipt: ProviderEvidenceProjection['receipt'] = null;
  if (input.receipt !== null) {
    if (
      !hasExactKeys(input.receipt, [
        'externalEventPresent',
        'id',
        'operationId',
        'payloadDigest',
        'provider',
        'receivedAt',
        'signatureVerifiedAt',
        'state',
      ])
    ) {
      throw new TypeError('Invalid provider evidence fields');
    }
    const receiptOperationId =
      input.receipt.operationId === null
        ? null
        : requiredUuid(input.receipt.operationId, 'receipt operation ID');
    receipt = {
      id: requiredUuid(input.receipt.id, 'receipt ID'),
      provider: requiredKey(input.receipt.provider, 'receipt provider'),
      state: requiredEnum(
        input.receipt.state,
        WEBHOOK_RECEIPT_STATES,
        'receipt state',
      ),
      payloadDigest: requiredDigest(
        input.receipt.payloadDigest,
        'receipt payload digest',
      ),
      signatureVerifiedAt: requiredTimestamp(
        input.receipt.signatureVerifiedAt,
        'signature verification timestamp',
      ),
      receivedAt: requiredTimestamp(
        input.receipt.receivedAt,
        'receipt timestamp',
      ),
      operationId: receiptOperationId,
      externalEventPresent: requiredBoolean(
        input.receipt.externalEventPresent,
        'external event presence',
      ),
    };
  }

  const projection: ProviderEvidenceProjection = {
    operation,
    receipt,
    provenance: {
      source: requiredKey(input.provenance.source, 'provenance source'),
      observedAt: requiredTimestamp(
        input.provenance.observedAt,
        'observation timestamp',
      ),
      lastVerifiedAt: requiredTimestamp(
        input.provenance.lastVerifiedAt,
        'last verified timestamp',
      ),
    },
    scope: {
      kind: requiredEnum(input.scope.kind, ['case', 'capability'], 'scope'),
      label: requiredSafeText(input.scope.label, 'scope label'),
    },
  };
  return Object.freeze({
    ...projection,
    operation: Object.freeze(projection.operation),
    receipt:
      projection.receipt === null ? null : Object.freeze(projection.receipt),
    provenance: Object.freeze(projection.provenance),
    scope: Object.freeze(projection.scope),
  });
}

export { KEY_PATTERN, PROVIDER_OPERATION_STATES };
