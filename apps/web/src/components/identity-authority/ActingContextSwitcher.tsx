import { useEffect, useMemo, useState } from 'react';

export interface ActingContextItem {
  readonly contextId: string;
  readonly partyId: string;
  readonly kind: 'person' | 'alias' | 'organization' | 'representation';
  readonly label: string;
  readonly avatarRef: string | null;
  readonly selectable: boolean;
  readonly authorityFreshUntil: string;
}

interface ActingContextResource {
  readonly projectionVersion: string;
  readonly items: readonly ActingContextItem[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface ActingContextSwitcherProps {
  readonly contexts?: readonly ActingContextItem[];
  readonly items?: readonly ActingContextItem[];
  readonly initial: ActingContextResource;
  readonly selectedContextId: string;
  readonly selectedPartyId: string;
  readonly suggestedContextId?: string | null;
  readonly onBindContext: (contextId: string) => Promise<unknown>;
  readonly onCanonicalRefetch: () => Promise<ActingContextResource>;
  readonly invalidationChannel: string;
}

export function ActingContextSwitcher({
  contexts,
  items,
  initial,
  selectedContextId,
  suggestedContextId = null,
  onBindContext,
  onCanonicalRefetch,
  invalidationChannel,
}: ActingContextSwitcherProps) {
  const supplied = contexts ?? items ?? initial.items;
  const [canonicalItems, setCanonicalItems] = useState(supplied);
  const [selected, setSelected] = useState(selectedContextId);
  const [draft, setDraft] = useState(selectedContextId);
  const [revoked, setRevoked] = useState(false);
  const current = useMemo(
    () => canonicalItems.find(({ contextId }) => contextId === selected),
    [canonicalItems, selected],
  );
  const suggestion = canonicalItems.find(
    ({ contextId }) => contextId === suggestedContextId,
  );

  useEffect(() => {
    const channel = new BroadcastChannel(invalidationChannel);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const payload = event.data;
      if (
        typeof payload !== 'object' ||
        payload === null ||
        !('eventType' in payload) ||
        payload.eventType !== 'identity.acting-context.revoked.v1'
      ) {
        return;
      }
      void onCanonicalRefetch().then((resource) => {
        setCanonicalItems(resource.items);
        const fallback =
          resource.items.find(({ kind }) => kind === 'person') ??
          resource.items[0];
        if (fallback !== undefined) {
          setSelected(fallback.contextId);
          setDraft(fallback.contextId);
        }
        setRevoked(true);
      });
    };
    return () => channel.close();
  }, [invalidationChannel, onCanonicalRefetch]);

  const confirmSelection = async (): Promise<void> => {
    const candidate = canonicalItems.find(
      ({ contextId }) => contextId === draft,
    );
    if (candidate === undefined || !candidate.selectable || draft === selected)
      return;
    await onBindContext(draft);
    setSelected(draft);
    setRevoked(false);
  };

  return (
    <section aria-labelledby="acting-context-heading">
      <h1 id="acting-context-heading">Acting context</h1>
      <p
        data-testid="acting-context-indicator"
        data-context-id={current?.contextId ?? selected}
        aria-live="polite"
        aria-atomic="true"
      >
        Current context: {current?.label ?? 'My profile'}
      </p>
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
        onChange={(event) => setDraft(event.currentTarget.value)}
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
      <button type="button" onClick={() => void confirmSelection()}>
        Confirm context switch
      </button>
    </section>
  );
}

export default ActingContextSwitcher;
