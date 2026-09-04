import * as React from 'react';

/** Deferred 05c boundary: no portability or lifecycle command is in Slice 07. */
export interface PortabilityQualityLifecycleWorkbenchProps {
  readonly authorized?: boolean;
}

/** Error copy reserved for the future server-authorized 05c workbench. */
export const PORTABILITY_QUALITY_ERROR_CODES = [
  'FORBIDDEN',
  'HOLD_CONFLICT',
  'IDEMPOTENCY_CONFLICT',
  'INVALID_REQUEST',
  'LIFECYCLE_TARGET_NOT_FOUND',
  'LIFECYCLE_UNAVAILABLE',
  'MANIFEST_CONFLICT',
  'NOT_FOUND',
  'PORTABILITY_TARGET_NOT_FOUND',
  'PORTABILITY_UNAVAILABLE',
  'STEP_UP_REQUIRED',
  'UNAUTHENTICATED',
  'UPSTREAM_TIMEOUT',
  'VERSION_CONFLICT',
] as const;

export function PortabilityQualityLifecycleWorkbench({
  authorized = false,
}: PortabilityQualityLifecycleWorkbenchProps): React.ReactElement {
  return (
    <section
      aria-labelledby="portability-quality-lifecycle-heading"
      data-workbench="portability-quality-lifecycle"
      data-state="deferred"
    >
      <h2 id="portability-quality-lifecycle-heading">
        Portability and quality lifecycle
      </h2>
      <p>
        {authorized
          ? 'The server will select an active lifecycle projection.'
          : 'This authorized workbench is deferred until its contract is active.'}
      </p>
      <p className="platform-configuration-help">
        RecordHeader, ProvenanceFact, ActionBar, and StateLabel are deferred
        with the lifecycle contract.
      </p>
      <p data-error-codes={PORTABILITY_QUALITY_ERROR_CODES.join(' ')} hidden>
        {PORTABILITY_QUALITY_ERROR_CODES.join(', ')}
      </p>
    </section>
  );
}

export default PortabilityQualityLifecycleWorkbench;
