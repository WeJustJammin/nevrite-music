import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';

interface FormSubmitLike {
  readonly preventDefault: () => void;
}

export interface ConfirmationStepProps {
  readonly consequence: string;
  readonly scope: string;
  readonly expectedVersion: string;
  readonly actingContext: string;
  readonly stepUpVerified: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly headingRef?: RefObject<HTMLHeadingElement | null>;
}

export function ConfirmationStep({
  consequence,
  scope,
  expectedVersion,
  actingContext,
  stepUpVerified,
  onConfirm,
  onCancel,
  headingRef,
}: ConfirmationStepProps) {
  const [confirmed, setConfirmed] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    headingRef?.current?.focus();
  }, [headingRef]);

  const submit = (event: FormSubmitLike): void => {
    event.preventDefault();
    if (confirmed && stepUpVerified) {
      onConfirm();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setConfirmed(false);
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getAttribute('aria-hidden') !== 'true');
    if (focusable.length === 0) {
      event.preventDefault();
      formRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first === undefined || last === undefined) {
      event.preventDefault();
      formRef.current?.focus();
      return;
    }
    const active = document.activeElement;
    if (
      (event.shiftKey &&
        (active === first || !focusable.includes(active as HTMLElement))) ||
      (!event.shiftKey &&
        (active === last || !focusable.includes(active as HTMLElement)))
    ) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };

  return (
    <div
      className="infra-confirmation-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-heading"
      tabIndex={-1}
    >
      <form
        className="infra-confirmation-step"
        onSubmit={submit}
        onKeyDown={handleKeyDown}
        aria-labelledby="confirmation-heading"
        ref={formRef}
      >
        <h3 ref={headingRef} id="confirmation-heading" tabIndex={-1}>
          Review before commit
        </h3>
        <dl>
          <div>
            <dt>Consequence</dt>
            <dd>{consequence}</dd>
          </div>
          <div>
            <dt>Affected scope</dt>
            <dd>{scope}</dd>
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
            <dt>Step-up verification</dt>
            <dd>{stepUpVerified ? 'Verified' : 'Required before commit'}</dd>
          </div>
          <div>
            <dt>Irreversible effects</dt>
            <dd>
              Archive is not reversible until the server confirms recovery.
            </dd>
          </div>
        </dl>
        <label className="infra-checkbox-label" htmlFor="confirm-archive">
          <input
            id="confirm-archive"
            name="confirmArchive"
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          I understand the consequence and affected scope.
        </label>
        {!stepUpVerified && (
          <p id="step-up-help" className="infra-help">
            Complete the named step-up verification before committing this
            action.
          </p>
        )}
        <div className="infra-actions">
          <button type="submit" disabled={!confirmed || !stepUpVerified}>
            Confirm archive
          </button>
          <button
            type="button"
            className="infra-secondary-action"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConfirmationStep;
