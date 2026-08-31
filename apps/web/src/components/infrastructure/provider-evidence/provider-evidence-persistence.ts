import type {
  ProviderEvidenceProjection,
  ProviderEvidenceState,
} from './provider-evidence-types';
import { normalizeProviderEvidenceErrorCode } from './provider-evidence-errors';
import {
  KEY_PATTERN,
  PROVIDER_OPERATION_STATES,
} from './provider-evidence-contract';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/u;

const safeProjection = (evidence: ProviderEvidenceProjection) => ({
  operation: {
    id: evidence.operation.id,
    provider: evidence.operation.provider,
    operationType: evidence.operation.operationType,
    state: evidence.operation.state,
    payloadDigest: evidence.operation.payloadDigest,
    version: evidence.operation.version,
  },
  receipt:
    evidence.receipt === null
      ? null
      : {
          id: evidence.receipt.id,
          provider: evidence.receipt.provider,
          state: evidence.receipt.state,
          payloadDigest: evidence.receipt.payloadDigest,
          signatureVerifiedAt: evidence.receipt.signatureVerifiedAt,
          receivedAt: evidence.receipt.receivedAt,
          operationId: evidence.receipt.operationId,
          externalEventPresent: evidence.receipt.externalEventPresent,
        },
  provenance: {
    source: evidence.provenance.source,
    observedAt: evidence.provenance.observedAt,
    lastVerifiedAt: evidence.provenance.lastVerifiedAt,
  },
  scope: {
    kind: evidence.scope.kind,
    label: evidence.scope.label,
  },
});

const safeFilters = (filters: ProviderEvidenceState['filters']) => ({
  provider:
    filters.provider !== null && KEY_PATTERN.test(filters.provider)
      ? filters.provider
      : null,
  state:
    filters.state !== null && PROVIDER_OPERATION_STATES.includes(filters.state)
      ? filters.state
      : null,
});

const safeRequestId = (requestId: string): string =>
  UUID_PATTERN.test(requestId) ? requestId : '';

const safeScope = (scope: string): string =>
  scope.length >= 1 &&
  scope.length <= 128 &&
  [...scope].every((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && codePoint >= 0x20 && codePoint !== 0x7f;
  })
    ? scope
    : 'Evidence scope unavailable.';

const safeTimestamp = (timestamp: string | null): string | null =>
  timestamp !== null &&
  ISO_TIMESTAMP_PATTERN.test(timestamp) &&
  Number.isFinite(Date.parse(timestamp))
    ? timestamp
    : null;

/** Persistence projection intentionally omits raw payloads and provider secrets. */
export const serializeProviderEvidenceState = (
  state: ProviderEvidenceState,
): string => {
  switch (state.status) {
    case 'success':
      return JSON.stringify({
        status: state.status,
        filters: safeFilters(state.filters),
        evidence: safeProjection(state.evidence),
      });
    case 'degraded':
      return JSON.stringify({
        status: state.status,
        filters: safeFilters(state.filters),
        evidence:
          state.evidence === null ? null : safeProjection(state.evidence),
        requestId: safeRequestId(state.requestId),
        lastVerifiedAt: safeTimestamp(state.lastVerifiedAt),
        scope: safeScope(state.scope),
      });
    case 'error':
      return JSON.stringify({
        status: state.status,
        filters: safeFilters(state.filters),
        code: normalizeProviderEvidenceErrorCode(state.code),
        requestId: safeRequestId(state.requestId),
        ...(state.retryAfterSeconds === undefined
          ? {}
          : { retryAfterSeconds: state.retryAfterSeconds }),
        retryable: state.retryable,
        attempt: state.attempt,
      });
    case 'disabled':
      return JSON.stringify({
        status: state.status,
        filters: safeFilters(state.filters),
        reason: safeScope(state.reason),
      });
    case 'idle':
    case 'loading':
      return JSON.stringify({
        status: state.status,
        filters: safeFilters(state.filters),
      });
  }
};
