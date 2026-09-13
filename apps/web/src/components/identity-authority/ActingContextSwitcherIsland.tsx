import type { ActingContextListResource } from '@wejammin/contracts';
import { useCallback, useEffect, useState } from 'react';

import ActingContextSwitcher from './ActingContextSwitcher';
import { bindActingContext } from './acting-context-api-bind';
import {
  readActingContexts,
  readCurrentTabContext,
} from './acting-context-api-read';

export interface ActingContextSwitcherIslandProps {
  readonly initial: ActingContextListResource;
  readonly selectedContextId: string;
  readonly selectedPartyId: string;
  readonly invalidationChannel: string;
}

export default function ActingContextSwitcherIsland(
  props: ActingContextSwitcherIslandProps,
) {
  const onBindContext = useCallback(
    (contextId: string) => bindActingContext(contextId),
    [],
  );
  const onCanonicalRefetch = useCallback(() => readActingContexts(), []);
  const [initial, setInitial] = useState(props.initial);
  const [selectedContextId, setSelectedContextId] = useState(
    props.selectedContextId,
  );
  const [selectedPartyId, setSelectedPartyId] = useState(props.selectedPartyId);
  const [tabContextStatus, setTabContextStatus] = useState<
    'checking' | 'verified' | 'unavailable'
  >('checking');
  const [contextReverted, setContextReverted] = useState(false);
  const [tabContextRevision, setTabContextRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refreshTabContext = (): void => {
      setTabContextStatus('checking');
      void readCurrentTabContext()
        .then((resolved) => {
          if (cancelled) return;
          setInitial(resolved.resource);
          setSelectedContextId(resolved.active.contextId);
          setSelectedPartyId(resolved.active.partyId);
          setContextReverted(resolved.revertedToSelf);
          setTabContextStatus('verified');
          setTabContextRevision((revision) => revision + 1);
        })
        .catch(() => {
          if (!cancelled) setTabContextStatus('unavailable');
        });
    };
    const onPageShow = (event: PageTransitionEvent): void => {
      if (event.persisted) refreshTabContext();
    };
    refreshTabContext();
    window.addEventListener('pageshow', onPageShow);
    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  return (
    <ActingContextSwitcher
      key={tabContextRevision}
      {...props}
      initial={initial}
      selectedContextId={selectedContextId}
      selectedPartyId={selectedPartyId}
      tabContextStatus={tabContextStatus}
      contextReverted={contextReverted}
      onBindContext={onBindContext}
      onCanonicalRefetch={onCanonicalRefetch}
    />
  );
}
