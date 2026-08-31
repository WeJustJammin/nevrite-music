import type { ReactNode } from 'react';

import ProviderEvidenceDetails from './ProviderEvidenceDetails';
import ProviderEvidenceError from './ProviderEvidenceError';
import {
  isProductionProviderEnabled,
  providerOperationHref,
  type EvidenceInvalidationReason,
} from './provider-evidence-state';
import type {
  ProviderEvidenceAccess,
  ProviderEvidenceProjection,
  ProviderEvidenceState,
} from './provider-evidence-types';

export interface ProviderEvidenceFeedbackProps {
  readonly access: Exclude<ProviderEvidenceAccess, 'disabled' | 'not-rendered'>;
  readonly state: Exclude<ProviderEvidenceState, { status: 'disabled' }>;
  readonly onCanonicalRefetch?: (
    reason: EvidenceInvalidationReason,
  ) => void | Promise<void>;
  readonly onRetry?: (
    request: ProviderEvidenceRetryRequest,
  ) => void | Promise<void>;
}

export interface ProviderEvidenceRetryRequest {
  readonly action: 'canonical-refetch';
  readonly attempt: number;
  readonly delayMs: number;
}

const scopeMatchesAccess = (
  access: ProviderEvidenceAccess,
  evidence: ProviderEvidenceProjection,
): boolean =>
  access === 'staff-case-scoped'
    ? evidence.scope.kind === 'case'
    : access === 'admin-capability-scoped'
      ? evidence.scope.kind === 'capability'
      : access === 'read-only';

const safeRequestId = (requestId: string): string =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
    requestId,
  )
    ? requestId
    : '';

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
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/u.test(
    timestamp,
  ) &&
  Number.isFinite(Date.parse(timestamp))
    ? timestamp
    : null;

const Announcement = ({ children }: { readonly children: ReactNode }) => (
  <p
    className="provider-evidence-announcement"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {children}
  </p>
);

const DisabledNotice = ({ enabled }: { readonly enabled: boolean }) => (
  <p className="provider-evidence-disabled" role="status" aria-live="polite">
    {enabled
      ? 'Provider effects are configured outside this read-only evidence view.'
      : 'Production provider effects are disabled. This view is read-only canonical evidence; no provider action is available.'}
  </p>
);

export function ProviderEvidenceFeedback({
  access,
  state,
  onCanonicalRefetch,
  onRetry,
}: ProviderEvidenceFeedbackProps) {
  const refresh = (): void => {
    if (onCanonicalRefetch !== undefined) void onCanonicalRefetch('reconnect');
  };
  if (state.status === 'idle')
    return <Announcement>Evidence is ready to load.</Announcement>;
  if (state.status === 'loading')
    return <Announcement>Loading canonical provider evidence.</Announcement>;
  if (state.status === 'error')
    return (
      <ProviderEvidenceError
        state={state}
        {...(onRetry === undefined ? {} : { onRetry })}
      />
    );
  if (state.status === 'degraded') {
    const requestId = safeRequestId(state.requestId);
    const lastVerifiedAt = safeTimestamp(state.lastVerifiedAt);
    const matches =
      state.evidence !== null && scopeMatchesAccess(access, state.evidence);
    return (
      <section
        className="provider-evidence-degraded"
        aria-labelledby="provider-evidence-degraded-heading"
      >
        <h3 id="provider-evidence-degraded-heading">Degraded evidence view</h3>
        <Announcement>
          Canonical evidence is unavailable. The last verified evidence is shown
          without claiming freshness.
        </Announcement>
        <p>{safeScope(state.scope)}</p>
        {requestId !== '' && (
          <p>
            Request ID: <code>{requestId}</code>
          </p>
        )}
        {lastVerifiedAt !== null && (
          <p>
            Last verified:{' '}
            <time dateTime={lastVerifiedAt}>{lastVerifiedAt}</time>
          </p>
        )}
        <button
          type="button"
          onClick={refresh}
          disabled={onCanonicalRefetch === undefined}
        >
          Refresh canonical evidence
        </button>
        {matches ? (
          <ProviderEvidenceDetails evidence={state.evidence!} />
        ) : state.evidence !== null ? (
          <p role="alert">
            Last verified evidence scope could not be confirmed.
          </p>
        ) : null}
      </section>
    );
  }
  if (!scopeMatchesAccess(access, state.evidence))
    return <p role="alert">Evidence scope could not be confirmed.</p>;
  const operationState = state.evidence.operation.state;
  const operationMessage =
    operationState === 'pending'
      ? 'Provider operation is pending reconciliation.'
      : operationState === 'manual_review'
        ? 'Provider operation requires manual review.'
        : `Provider operation is ${operationState.toLowerCase()}.`;
  return (
    <>
      <Announcement>{operationMessage}</Announcement>
      <DisabledNotice
        enabled={isProductionProviderEnabled(state.evidence.operation.provider)}
      />
      <ProviderEvidenceDetails evidence={state.evidence} />
      <p>
        <a href={providerOperationHref(state.evidence.operation.id)}>
          Open canonical operation evidence
        </a>
      </p>
    </>
  );
}

export default ProviderEvidenceFeedback;
