import ProviderEvidenceFeedback, {
  type ProviderEvidenceRetryRequest,
} from './ProviderEvidenceFeedback';
import {
  providerEvidenceBackHref,
  type EvidenceInvalidationReason,
} from './provider-evidence-navigation';
import type {
  ProviderEvidenceAccess,
  ProviderEvidenceState,
} from './provider-evidence-types';
import '../../../styles/infrastructure.css';
import './provider-evidence.css';

export type { ProviderEvidenceRetryRequest } from './ProviderEvidenceFeedback';

export interface ProviderEvidencePanelProps {
  readonly access: ProviderEvidenceAccess;
  readonly state: ProviderEvidenceState;
  readonly backHref?: string;
  readonly onCanonicalRefetch?: (
    reason: EvidenceInvalidationReason,
  ) => void | Promise<void>;
  readonly onRetry?: (
    request: ProviderEvidenceRetryRequest,
  ) => void | Promise<void>;
}

type RenderedAccess = Exclude<
  ProviderEvidenceAccess,
  'disabled' | 'not-rendered'
>;

const accessLabel = (access: RenderedAccess): string =>
  access === 'staff-case-scoped'
    ? 'Staff case-scoped read-only evidence'
    : access === 'admin-capability-scoped'
      ? 'Admin capability-scoped read-only evidence; protected actions require the named capability and recent step-up.'
      : 'Read-only canonical evidence';

export function ProviderEvidencePanel({
  access,
  state,
  backHref,
  onCanonicalRefetch,
  onRetry,
}: ProviderEvidencePanelProps) {
  if (access === 'not-rendered') return null;
  if (access === 'disabled' || state.status === 'disabled') {
    const reason =
      state.status === 'disabled'
        ? state.reason
        : 'An explicit evidence capability is required.';
    return (
      <section
        className="provider-evidence"
        aria-labelledby="provider-evidence-heading"
        data-access-variant={access === 'disabled' ? 'disabled' : access}
      >
        <h2 id="provider-evidence-heading">Provider evidence</h2>
        <p className="provider-evidence-disabled" role="status">
          Action unavailable: {reason}
        </p>
      </section>
    );
  }
  const listHref = providerEvidenceBackHref(backHref, state.filters);
  return (
    <section
      className="provider-evidence"
      aria-labelledby="provider-evidence-heading"
      data-access-variant={access}
      aria-busy={state.status === 'loading'}
    >
      <nav aria-label="Provider evidence navigation">
        <a href={listHref}>Back to evidence list</a>
      </nav>
      <header className="provider-evidence-header">
        <p className="infra-eyebrow">Provider reconciliation</p>
        <h2 id="provider-evidence-heading">Provider operation evidence</h2>
        <p>{accessLabel(access)}</p>
      </header>
      <ProviderEvidenceFeedback
        access={access}
        state={state}
        {...(onCanonicalRefetch === undefined ? {} : { onCanonicalRefetch })}
        {...(onRetry === undefined ? {} : { onRetry })}
      />
    </section>
  );
}

export default ProviderEvidencePanel;
