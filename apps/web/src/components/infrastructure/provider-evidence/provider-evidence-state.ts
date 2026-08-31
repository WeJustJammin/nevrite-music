export type {
  ProviderEvidenceAccess,
  ProviderEvidenceFilters,
  ProviderEvidenceProjection,
  ProviderEvidenceState,
  ProviderOperationState,
  WebhookReceiptState,
} from './provider-evidence-types';
export { createProviderEvidenceProjection } from './provider-evidence-contract';
export {
  EVIDENCE_RETRY_DELAYS_MS,
  PROVIDER_EVIDENCE_LIST_HREF,
  createCanonicalEvidenceInvalidationHandler,
  evidenceRetryDelayForAttempt,
  providerEvidenceBackHref,
  providerEvidenceListHref,
  providerOperationHref,
  type EvidenceInvalidationReason,
} from './provider-evidence-navigation';
export {
  getProviderEvidenceErrorPresentation,
  normalizeProviderEvidenceErrorCode,
  type ProviderEvidenceErrorOwner,
  type ProviderEvidenceErrorPresentation,
} from './provider-evidence-errors';
export { serializeProviderEvidenceState } from './provider-evidence-persistence';

export const PRODUCTION_PROVIDER_REGISTRY = [] as const;

export const isProductionProviderEnabled = (provider: string): boolean =>
  PRODUCTION_PROVIDER_REGISTRY.some((registered) => registered === provider);
