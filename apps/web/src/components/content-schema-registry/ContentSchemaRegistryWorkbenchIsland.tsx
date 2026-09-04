import * as React from 'react';

import {
  installContentSchemaRegistryCanonicalRefetch,
  installContentSchemaRegistryCommandEnhancement,
  refetchContentSchemaRegistryCanonical,
} from './content-schema-registry-runtime-dom';
import { ContentSchemaRegistryCapabilityGate } from './ContentSchemaRegistryCapabilityGate';
import ContentSchemaRegistryInitialFailureBoundary from './ContentSchemaRegistryInitialFailureBoundary';
import ContentSchemaRegistryWorkbench from './ContentSchemaRegistryWorkbench';
import type { ContentSchemaRegistryWorkbenchProps } from './content-schema-registry-types';

export type ContentSchemaRegistryWorkbenchIslandProps = Omit<
  ContentSchemaRegistryWorkbenchProps,
  'onCanonicalRefetch' | 'actorId' | 'actingPartyId'
> & {
  readonly actorId: string | null;
  readonly actingPartyId: string | null;
  readonly canonicalRefetchUrl: string;
};

type ContentSchemaRegistryRefetchReason = Parameters<
  ContentSchemaRegistryWorkbenchProps['onCanonicalRefetch']
>[0];

/**
 * Serializable Astro island boundary. The server still renders the exact
 * Workbench HTML; the browser constructs the canonical callback after load so
 * no server function or authority state is serialized into the page.
 */
export default function ContentSchemaRegistryWorkbenchIsland(
  props: ContentSchemaRegistryWorkbenchIslandProps,
): React.ReactElement {
  const hasAuthorityIds =
    props.actorId !== null && props.actingPartyId !== null;
  const initialFailure =
    props.initialList.status === 'error' ||
    props.initialList.status === 'degraded'
      ? props.initialList
      : props.initialDetail?.status === 'error' ||
          props.initialDetail?.status === 'degraded'
        ? props.initialDetail
        : null;
  const commandCleanupRef = React.useRef<() => void>(() => undefined);
  const onCanonicalRefetch = React.useCallback(
    async (reason: ContentSchemaRegistryRefetchReason): Promise<void> => {
      if (typeof document === 'undefined' || reason === 'mutation') return;
      await refetchContentSchemaRegistryCanonical({
        document,
        canonicalUrl: props.canonicalRefetchUrl,
        reason,
        onAfterReplace: () => {
          commandCleanupRef.current();
          commandCleanupRef.current =
            installContentSchemaRegistryCommandEnhancement(document);
        },
      });
    },
    [props.canonicalRefetchUrl],
  );

  React.useEffect(() => {
    if (typeof document === 'undefined' || !hasAuthorityIds) return undefined;
    commandCleanupRef.current =
      installContentSchemaRegistryCommandEnhancement(document);
    const canonicalCleanup = installContentSchemaRegistryCanonicalRefetch(
      document,
      props.canonicalRefetchUrl,
      (reason) => onCanonicalRefetch(reason),
    );
    return () => {
      commandCleanupRef.current();
      commandCleanupRef.current = () => undefined;
      canonicalCleanup();
    };
  }, [hasAuthorityIds, onCanonicalRefetch, props.canonicalRefetchUrl]);

  if (props.access === 'not-rendered') {
    return (
      <ContentSchemaRegistryCapabilityGate
        variant="not-rendered"
        reasonCode={props.variant}
      />
    );
  }

  if (
    props.access === 'disabled' &&
    initialFailure !== null &&
    !hasAuthorityIds
  ) {
    return (
      <ContentSchemaRegistryInitialFailureBoundary
        failure={initialFailure}
        access="disabled"
        variant={props.variant}
        requestId={props.requestId}
        retryUrl={props.canonicalRefetchUrl}
      />
    );
  }

  if (props.access === 'disabled' || !hasAuthorityIds) {
    return (
      <ContentSchemaRegistryCapabilityGate
        variant="disabled"
        reasonCode={props.variant}
        recoveryHref={props.canonicalRefetchUrl}
      />
    );
  }

  return (
    <ContentSchemaRegistryWorkbench
      {...props}
      actorId={props.actorId}
      actingPartyId={props.actingPartyId}
      onCanonicalRefetch={onCanonicalRefetch}
    />
  );
}
