import type { AccessVariant } from '@wejammin/ui/infrastructure/presentation';

export interface CapabilityGateProps {
  readonly access: AccessVariant;
  readonly reason: string;
  readonly recoveryHref?: string;
  readonly recoveryLabel?: string;
}

/**
 * Server-selected capability presentation. A hidden variant intentionally
 * emits no protected resource label or action.
 */
export function CapabilityGate({
  access,
  reason,
  recoveryHref,
  recoveryLabel = 'Review access',
}: CapabilityGateProps) {
  if (access === 'not-rendered') {
    return null;
  }

  return (
    <section
      className="infra-capability-gate"
      aria-labelledby="capability-gate-heading"
      role="status"
    >
      <h2 id="capability-gate-heading">
        {access === 'disabled' ? 'Action unavailable' : 'Access is limited'}
      </h2>
      <p>{reason}</p>
      {recoveryHref !== undefined && <a href={recoveryHref}>{recoveryLabel}</a>}
    </section>
  );
}

export default CapabilityGate;
