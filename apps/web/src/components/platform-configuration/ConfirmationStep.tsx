import * as React from 'react';

export type StepUpState = 'required' | 'pending' | 'verified';

export interface ConfirmationStepProps {
  readonly consequence: string;
  readonly affectedScope: string;
  readonly expectedVersion: string;
  readonly stepUpState: StepUpState;
  readonly idempotencyKey: string;
  readonly actingContext?: string;
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
  readonly triggerRef?: React.RefObject<HTMLElement | null>;
}

/** Inline-first confirmation with a bounded focus loop and pre-commit Escape. */
export function ConfirmationStep({
  consequence,
  affectedScope,
  expectedVersion,
  stepUpState,
  idempotencyKey,
  actingContext = 'Server-selected acting context',
  onConfirm,
  onCancel,
  triggerRef,
}: ConfirmationStepProps): React.ReactElement {
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);
  React.useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setConfirmed(false);
      onCancel?.();
      triggerRef?.current?.focus({ preventScroll: true });
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (first === undefined || last === undefined) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const stepUpVerified = stepUpState === 'verified';
  return (
    <div
      className="platform-configuration-confirmation"
      role="dialog"
      aria-modal="true"
      aria-labelledby="platform-configuration-confirmation-heading"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (confirmed && stepUpVerified) onConfirm?.();
        }}
      >
        <h3
          id="platform-configuration-confirmation-heading"
          ref={headingRef}
          tabIndex={-1}
        >
          Confirm irreversible configuration action
        </h3>
        <dl>
          <div>
            <dt>Consequence</dt>
            <dd>{consequence}</dd>
          </div>
          <div>
            <dt>Affected scope</dt>
            <dd>{affectedScope}</dd>
          </div>
          <div>
            <dt>Expected version</dt>
            <dd>
              <code>{expectedVersion}</code>
            </dd>
          </div>
          <div>
            <dt>Acting context</dt>
            <dd>{actingContext}</dd>
          </div>
          <div>
            <dt>Step-up</dt>
            <dd>{stepUpVerified ? 'Verified' : 'Required before commit'}</dd>
          </div>
          <div>
            <dt>Idempotency key</dt>
            <dd>
              <code>{idempotencyKey}</code>
            </dd>
          </div>
        </dl>
        <label htmlFor="platform-configuration-confirmed">
          <input
            id="platform-configuration-confirmed"
            name="confirmation"
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />{' '}
          I understand the consequence and affected scope.
        </label>
        <div className="platform-configuration-actions">
          <button type="submit" disabled={!confirmed || !stepUpVerified}>
            {stepUpState === 'pending' ? 'Verifying step-up…' : 'Commit action'}
          </button>
          <button type="button" className="secondary-action" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConfirmationStep;
