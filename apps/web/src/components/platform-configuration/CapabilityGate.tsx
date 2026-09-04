import * as React from 'react';

export type CapabilityGateVariant =
  'full' | 'read-only' | 'partial-hidden' | 'disabled' | 'not-rendered';

export interface CapabilityGateProps {
  readonly variant: CapabilityGateVariant;
  readonly reasonCode: string;
  readonly recoveryHref?: string | undefined;
  readonly disclosure?: string | undefined;
}

/** Server-authoritative capability presentation; hidden emits no protected label. */
export function CapabilityGate({
  variant,
  reasonCode,
  recoveryHref,
  disclosure,
}: CapabilityGateProps): React.ReactElement | null {
  if (variant === 'not-rendered') return null;
  const disabled = variant === 'disabled';
  return (
    <section
      className="platform-configuration-capability-gate"
      role="status"
      aria-live="polite"
      aria-labelledby="platform-configuration-capability-heading"
      data-reason-code={reasonCode}
      data-variant={variant}
    >
      <h2
        id="platform-configuration-capability-heading"
        tabIndex={disabled ? -1 : undefined}
      >
        {disabled ? 'Action unavailable' : 'Access is limited'}
      </h2>
      <p>
        {disclosure ??
          (disabled
            ? 'A server capability prerequisite is not satisfied.'
            : 'This context can read only the disclosed configuration projection.')}
      </p>
      <p className="platform-configuration-help">
        Reason code: <code>{reasonCode}</code>
      </p>
      {recoveryHref === undefined ? null : (
        <a href={recoveryHref}>Review access</a>
      )}
    </section>
  );
}

export default CapabilityGate;
