import {
  KEY_PATTERN,
  PROVIDER_OPERATION_STATES,
} from './provider-evidence-contract';
import type { ProviderEvidenceFilters } from './provider-evidence-types';

export const PROVIDER_EVIDENCE_LIST_HREF =
  '/app/infrastructure/provider-operations';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export const providerOperationHref = (operationId: string): string => {
  if (!UUID_PATTERN.test(operationId))
    throw new TypeError('Provider operation ID must be a UUID');
  return `${PROVIDER_EVIDENCE_LIST_HREF}/${encodeURIComponent(operationId)}`;
};

export const providerEvidenceListHref = (
  filters: ProviderEvidenceFilters,
): string => {
  const params = new URLSearchParams();
  if (filters.provider !== null && KEY_PATTERN.test(filters.provider))
    params.set('provider', filters.provider);
  if (
    filters.state !== null &&
    PROVIDER_OPERATION_STATES.includes(filters.state)
  )
    params.set('state', filters.state);
  const query = params.toString();
  return query === ''
    ? PROVIDER_EVIDENCE_LIST_HREF
    : `${PROVIDER_EVIDENCE_LIST_HREF}?${query}`;
};

export const providerEvidenceBackHref = (
  href: string | undefined,
  filters: ProviderEvidenceFilters,
): string => {
  const fallback = providerEvidenceListHref(filters);
  if (href === undefined) return fallback;
  try {
    const parsed = new URL(href, 'https://wejammin.invalid');
    if (
      parsed.origin !== 'https://wejammin.invalid' ||
      parsed.pathname !== PROVIDER_EVIDENCE_LIST_HREF ||
      parsed.hash !== '' ||
      parsed.search.length > 512
    )
      return fallback;
    let provider: string | null = null;
    let state: ProviderEvidenceFilters['state'] = null;
    for (const [key, value] of parsed.searchParams) {
      if (key === 'provider' && provider === null) provider = value;
      else if (key === 'state' && state === null) {
        state = value as ProviderEvidenceFilters['state'];
      } else return fallback;
    }
    return providerEvidenceListHref({ provider, state });
  } catch {
    return fallback;
  }
};

export type EvidenceInvalidationReason =
  'multi-tab' | 'realtime-hint' | 'reconnect';

export const createCanonicalEvidenceInvalidationHandler =
  (
    onCanonicalRefetch: (
      reason: EvidenceInvalidationReason,
    ) => void | Promise<void>,
  ): ((reason: EvidenceInvalidationReason) => Promise<void>) =>
  async (reason) => {
    await onCanonicalRefetch(reason);
  };

export const EVIDENCE_RETRY_DELAYS_MS = [250, 750] as const;

export const evidenceRetryDelayForAttempt = (attempt: number): number | null =>
  Number.isInteger(attempt) && attempt >= 0
    ? (EVIDENCE_RETRY_DELAYS_MS[attempt] ?? null)
    : null;
