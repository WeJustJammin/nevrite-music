import * as React from 'react';

export interface ContentSchemaRegistryCapabilityGateProps {
  readonly variant: 'full' | 'read-only' | 'disabled' | 'not-rendered';
  readonly reasonCode: string;
  readonly recoveryHref?: string | undefined;
  readonly disclosure?: string | undefined;
}

/** Server-authoritative capability presentation; hidden emits no protected label. */
export function ContentSchemaRegistryCapabilityGate({
  variant,
  reasonCode,
  recoveryHref,
  disclosure,
}: ContentSchemaRegistryCapabilityGateProps): React.ReactElement | null {
  if (variant === 'not-rendered') return null;
  if (variant === 'full') return null;
  const disabled = variant === 'disabled';
  return (
    <section
      className="content-schema-registry-capability-gate"
      role="status"
      aria-live="polite"
      aria-labelledby="content-schema-registry-capability-heading"
      data-variant={variant}
      data-reason-code={reasonCode}
    >
      <h3
        id="content-schema-registry-capability-heading"
        tabIndex={disabled ? -1 : undefined}
      >
        {disabled ? 'Schema changes unavailable' : 'Read-only registry access'}
      </h3>
      <p>
        {disclosure ??
          (disabled
            ? 'A server capability prerequisite is not satisfied.'
            : 'This context can inspect the disclosed registry projection but cannot change schemas.')}
      </p>
      <p>
        Reason: <code>{reasonCode}</code>
      </p>
      {recoveryHref === undefined ? null : (
        <a href={recoveryHref}>Review access</a>
      )}
    </section>
  );
}

export default ContentSchemaRegistryCapabilityGate;
