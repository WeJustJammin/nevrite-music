import { useCallback, useEffect, useRef, useState } from 'react';

import { ACTING_CONTEXT_CHANGED_EVENT } from '../../lib/client-binding';

import RelationshipsAuthorityGovernanceWorkbench, {
  type RelationshipsAuthorityGovernanceWorkbenchProps,
} from './RelationshipsAuthorityGovernanceWorkbench';
import {
  readCurrentRelationshipProjections,
  readPublicRelationshipProjections,
  type RelationshipCanonicalSnapshot,
} from './relationships-api-read';

export type RelationshipsAuthorityGovernanceIslandProps = Omit<
  RelationshipsAuthorityGovernanceWorkbenchProps,
  'onCanonicalRefetch'
>;

export function RelationshipsAuthorityGovernanceIsland(
  props: RelationshipsAuthorityGovernanceIslandProps,
) {
  const requestKey = JSON.stringify([
    props.variant,
    props.actorId,
    props.access,
    props.organizationId ?? null,
    props.selectedId ?? null,
  ]);
  const [snapshot, setSnapshot] = useState<RelationshipCanonicalSnapshot>(
    () => ({
      actingPartyId: props.actingPartyId,
      organizationId: props.organizationId ?? props.selectedId,
      expectedVersion: props.expectedVersion,
      initial: props.initial,
    }),
  );
  const [verifiedRequestKey, setVerifiedRequestKey] = useState<string | null>(
    null,
  );
  const [failedRequestKey, setFailedRequestKey] = useState<string | null>(null);
  const refreshRevision = useRef(0);
  const onCanonicalRefetch = useCallback(async (): Promise<void> => {
    const revision = refreshRevision.current + 1;
    refreshRevision.current = revision;
    setVerifiedRequestKey(null);
    setFailedRequestKey(null);
    try {
      const organizationId = props.organizationId ?? props.selectedId;
      const refreshed =
        props.variant === 'publicRead'
          ? await readPublicRelationshipProjections(organizationId)
          : await readCurrentRelationshipProjections(organizationId);
      if (refreshRevision.current === revision) {
        setSnapshot(refreshed);
        if (props.variant !== 'publicRead') setVerifiedRequestKey(requestKey);
      }
    } catch {
      if (
        refreshRevision.current === revision &&
        props.variant !== 'publicRead'
      )
        setFailedRequestKey(requestKey);
    }
  }, [props.organizationId, props.selectedId, props.variant, requestKey]);

  useEffect(() => {
    if (props.access === 'not-rendered') return;
    const refresh = (): void => {
      void onCanonicalRefetch();
    };
    const onPageShow = (event: PageTransitionEvent): void => {
      if (event.persisted) refresh();
    };
    refresh();
    window.addEventListener(ACTING_CONTEXT_CHANGED_EVENT, refresh);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      refreshRevision.current += 1;
      window.removeEventListener(ACTING_CONTEXT_CHANGED_EVENT, refresh);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [onCanonicalRefetch, props.access]);

  const needsTabVerification =
    props.variant !== 'publicRead' || props.access === 'full';
  const tabContextVerified =
    props.variant !== 'publicRead' && verifiedRequestKey === requestKey;
  const verificationFailed =
    needsTabVerification && failedRequestKey === requestKey;
  const mutationAccess =
    props.access === 'full' && !tabContextVerified ? 'read-only' : props.access;
  const workbenchProps: RelationshipsAuthorityGovernanceWorkbenchProps = {
    ...props,
    access: mutationAccess,
    actingPartyId: snapshot.actingPartyId,
    organizationId: snapshot.organizationId,
    selectedId: snapshot.organizationId,
    expectedVersion: snapshot.expectedVersion,
    initial: snapshot.initial,
    onCanonicalRefetch,
  };

  return (
    <>
      {needsTabVerification &&
        !tabContextVerified &&
        props.access !== 'not-rendered' && (
          <p role="status" aria-live="polite" aria-atomic="true">
            {verificationFailed
              ? 'The active tab context could not be verified; the last displayed relationship data remains read-only.'
              : 'Relationship data is server-rendered and not verified for this tab; commands remain read-only until verification succeeds.'}
          </p>
        )}
      <RelationshipsAuthorityGovernanceWorkbench {...workbenchProps} />
    </>
  );
}

export default RelationshipsAuthorityGovernanceIsland;
