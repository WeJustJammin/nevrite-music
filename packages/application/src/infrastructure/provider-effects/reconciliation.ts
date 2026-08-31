import { PositiveBigintDecimalSchema } from '@wejammin/contracts';

import type {
  ProviderEvidence,
  ProviderOperationPersistence,
  ProviderReconciliationDecision,
} from './types.ts';
import { isProviderOperation } from './execution-support.ts';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const PROVIDER_PATTERN = /^[a-z][a-z0-9_.:-]{0,127}$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_REF_PATTERN = /^[\x20-\x7e]{1,256}$/;

type ReconciliationInput = Readonly<{
  operationId: string;
  expectedVersion: string;
  evidence: ProviderEvidence;
  persistence: ProviderOperationPersistence;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEvidence = (value: unknown): value is ProviderEvidence => {
  if (!isRecord(value)) return false;
  return (
    typeof value.operationId === 'string' &&
    UUID_PATTERN.test(value.operationId) &&
    typeof value.provider === 'string' &&
    PROVIDER_PATTERN.test(value.provider) &&
    typeof value.payloadDigest === 'string' &&
    DIGEST_PATTERN.test(value.payloadDigest) &&
    (value.externalEventId === null ||
      (typeof value.externalEventId === 'string' &&
        SAFE_REF_PATTERN.test(value.externalEventId))) &&
    (value.state === 'confirmed' ||
      value.state === 'failed' ||
      value.state === 'manual_review') &&
    (value.source === 'webhook' || value.source === 'poll') &&
    (value.providerRef === null ||
      (typeof value.providerRef === 'string' &&
        SAFE_REF_PATTERN.test(value.providerRef))) &&
    value.providerRef === value.externalEventId &&
    typeof value.reconciledAt === 'string' &&
    value.reconciledAt.length <= 64 &&
    Number.isFinite(Date.parse(value.reconciledAt))
  );
};

const invalid = (): Extract<
  ProviderReconciliationDecision,
  { kind: 'error' }
> => ({
  kind: 'error',
  code: 'INVALID_REQUEST',
  noCanonicalWrite: true,
});

const unavailable = (): Extract<
  ProviderReconciliationDecision,
  { kind: 'error' }
> => ({
  kind: 'error',
  code: 'DEPENDENCY_UNAVAILABLE',
  noCanonicalWrite: true,
});

export const reconcileProviderOperation = async (
  input: ReconciliationInput,
): Promise<ProviderReconciliationDecision> => {
  if (
    !isRecord(input) ||
    typeof input.operationId !== 'string' ||
    !UUID_PATTERN.test(input.operationId) ||
    typeof input.expectedVersion !== 'string' ||
    !PositiveBigintDecimalSchema.safeParse(input.expectedVersion).success ||
    !isEvidence(input.evidence) ||
    !isRecord(input.persistence) ||
    typeof input.persistence.readCanonical !== 'function' ||
    typeof input.persistence.reconcile !== 'function'
  ) {
    return invalid();
  }
  let canonical;
  try {
    canonical = await input.persistence.readCanonical(input.operationId);
  } catch {
    return unavailable();
  }
  if (canonical === null) return { kind: 'not_found', noCanonicalWrite: true };
  if (!isProviderOperation(canonical)) return unavailable();
  if (
    canonical.id !== input.operationId ||
    canonical.version !== input.expectedVersion ||
    canonical.provider !== input.evidence.provider ||
    canonical.payloadDigest !== input.evidence.payloadDigest ||
    input.evidence.operationId !== canonical.id
  ) {
    return {
      kind: 'conflict',
      operationId: input.operationId,
      noCanonicalWrite: true,
    };
  }
  let result: 'reconciled' | 'conflict' | 'not_found';
  try {
    result = await input.persistence.reconcile({
      operationId: input.operationId,
      expectedVersion: input.expectedVersion,
      evidence: input.evidence,
    });
  } catch {
    return unavailable();
  }
  if (result === 'reconciled') {
    return {
      kind: 'reconciled',
      operationId: input.operationId,
      state: input.evidence.state,
    };
  }
  if (result === 'conflict') {
    return {
      kind: 'conflict',
      operationId: input.operationId,
      noCanonicalWrite: true,
    };
  }
  if (result === 'not_found') {
    return { kind: 'not_found', noCanonicalWrite: true };
  }
  return unavailable();
};
