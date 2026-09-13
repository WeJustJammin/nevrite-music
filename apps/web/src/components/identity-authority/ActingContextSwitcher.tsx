import type { ActingContextSwitcherProps } from './acting-context-model';
import { useActingContextSwitcher } from './use-acting-context-switcher';

export type {
  ActingContextItem,
  ActingContextResource,
  ActingContextSwitcherProps,
} from './acting-context-model';

export function ActingContextSwitcher(props: ActingContextSwitcherProps) {
  const { tabContextStatus = 'verified', contextReverted = false } = props;
  const {
    canonicalItems,
    selected,
    draft,
    revoked,
    error,
    pending,
    contextVerified,
    indicatorLabel,
    current,
    suggestion,
    errorRef,
    changeDraft,
    confirmSelection,
  } = useActingContextSwitcher(props);

  return (
    <section aria-labelledby="acting-context-heading">
      <h2 id="acting-context-heading">Acting context</h2>
      <p
        data-testid="acting-context-indicator"
        data-context-id={
          contextVerified ? (current?.contextId ?? selected) : 'unverified'
        }
        aria-live="polite"
        aria-atomic="true"
      >
        Current context: {indicatorLabel}
      </p>
      {tabContextStatus === 'checking' ? (
        <p role="status" aria-live="polite">
          Checking the server-selected context for this tab.
        </p>
      ) : null}
      {tabContextStatus === 'unavailable' ? (
        <p role="alert" aria-live="assertive">
          This tab’s current context could not be verified. Reload before
          continuing.
        </p>
      ) : null}
      {contextReverted ? (
        <p
          data-testid="acting-context-reverted"
          role="status"
          aria-live="polite"
        >
          The previous acting context was unavailable. The server confirmed My
          profile for this tab.
        </p>
      ) : null}
      {suggestion === undefined ? null : (
        <p
          data-testid="acting-context-suggestion"
          data-context-id={suggestion.contextId}
        >
          Suggested by this link
        </p>
      )}
      {revoked ? (
        <p
          data-testid="acting-context-revoked"
          role="status"
          aria-live="polite"
        >
          Previous authority was revoked. Switched to My profile.
        </p>
      ) : null}
      <label htmlFor="acting-context-select">Choose acting context</label>
      <select
        id="acting-context-select"
        value={draft}
        aria-invalid={error !== null}
        aria-describedby={error === null ? undefined : 'acting-context-error'}
        disabled={pending || !contextVerified}
        onChange={(event) => {
          changeDraft(event.currentTarget.value);
        }}
      >
        {canonicalItems.map((item) => (
          <option
            key={item.contextId}
            value={item.contextId}
            disabled={!item.selectable}
          >
            {item.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || !contextVerified || draft === selected}
        onClick={() => void confirmSelection()}
      >
        {pending ? 'Changing context…' : 'Confirm context switch'}
      </button>
      {error === null ? null : (
        <p
          ref={errorRef}
          id="acting-context-error"
          data-testid="acting-context-error"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
        >
          {error}
        </p>
      )}
    </section>
  );
}

export default ActingContextSwitcher;
