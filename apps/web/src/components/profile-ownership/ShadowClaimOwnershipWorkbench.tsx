import * as React from 'react';

import type { ProfileOwnershipOperation } from './ProfileOwnershipCommandForms';
import ProfileOwnershipLayout from './ProfileOwnershipLayout';

export type ProfileOwnershipVariant =
  | 'publicRead'
  | 'entitledRead'
  | 'ownerFull'
  | 'guardianMandate'
  | 'juniorRestricted'
  | 'businessMandate'
  | 'staffCaseScoped'
  | 'adminStepUp'
  | 'forbiddenHidden'
  | 'disabledPrerequisite';

export type ProfileOwnershipAccess =
  'full' | 'read-only' | 'not-rendered' | 'disabled';

export type OwnershipProvenance = Readonly<{
  source: string;
  evidence: string;
  at: string;
  visibility: string;
}>;

export type OwnershipRecord = Readonly<{
  id: string;
  version: string;
  state: string;
  provenance: readonly OwnershipProvenance[];
  projection: Readonly<Record<string, unknown>>;
}>;

export type OwnershipError = Readonly<{
  code: string;
  message: string;
  requestId: string;
  details?: Readonly<{
    violations?: readonly Readonly<{
      path: string;
      code: string;
      message: string;
    }>[];
    retryAfterSeconds?: number;
  }>;
}>;

export type OwnershipAsyncState = Readonly<{
  status:
    | 'idle'
    | 'loading'
    | 'error'
    | 'empty'
    | 'success'
    | 'optimistic-pending'
    | 'optimistic-rollback'
    | 'disabled'
    | 'degraded';
  data?: readonly OwnershipRecord[];
  version?: string;
  stale?: boolean;
  error?: OwnershipError;
  retryable?: boolean;
}>;

export type ShadowClaimOwnershipWorkbenchProps = Readonly<{
  contractFields: Readonly<{
    source: string;
    fields: Readonly<Record<string, readonly string[]>>;
  }>;
  variant: ProfileOwnershipVariant;
  initial: OwnershipAsyncState;
  actorId: string | null;
  actingPartyId: string | null;
  access: ProfileOwnershipAccess;
  query: Readonly<{ tab?: string; selected?: string | null }>;
  selectedId: string | null;
  expectedVersion: string;
  csrfToken?: string;
  onCanonicalRefetch?: (reason: string) => Promise<void> | void;
  onResult?: (operation: ProfileOwnershipOperation, payload: unknown) => void;
  children?: never;
}>;

const ShadowClaimOwnershipWorkbench = (
  props: ShadowClaimOwnershipWorkbenchProps,
): React.ReactElement => {
  const { initial, selectedId, query, onCanonicalRefetch } = props;
  const [records, setRecords] = React.useState<readonly OwnershipRecord[]>(
    initial.data ?? [],
  );
  const [currentVersion, setCurrentVersion] = React.useState(
    props.expectedVersion,
  );
  const selected = records.find((record) => record.id === selectedId);
  const recordId = selected?.id ?? selectedId ?? '';
  const version = selected?.version ?? initial.version ?? '';
  const [status, setStatus] = React.useState(
    initial.status === 'error'
      ? (initial.error?.message ?? 'Request failed.')
      : 'Ready.',
  );
  const onSuccess = (
    operation: ProfileOwnershipOperation,
    payload: unknown,
  ): void => {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('id' in payload) ||
      !('state' in payload) ||
      !('version' in payload) ||
      typeof payload.id !== 'string' ||
      typeof payload.state !== 'string' ||
      typeof payload.version !== 'string'
    ) {
      props.onResult?.(operation, payload);
      return;
    }
    const next: OwnershipRecord = {
      id: payload.id,
      version: payload.version,
      state: payload.state,
      provenance: [
        {
          source: 'profile-ownership',
          evidence: operation,
          at: new Date().toISOString(),
          visibility: 'authorized',
        },
      ],
      projection:
        'targetPartyId' in payload && typeof payload.targetPartyId === 'string'
          ? {
              targetPartyId: payload.targetPartyId,
              controlLevel:
                'controlLevel' in payload ? payload.controlLevel : 'none',
              windowEndsAt:
                'windowEndsAt' in payload ? payload.windowEndsAt : null,
            }
          : {},
    };
    setRecords((current) => {
      const found = current.some((record) => record.id === next.id);
      return found
        ? current.map((record) => (record.id === next.id ? next : record))
        : [...current, next];
    });
    setCurrentVersion(`"${next.version}"`);
    props.onResult?.(operation, payload);
  };

  return (
    <ProfileOwnershipLayout
      contractSource={props.contractFields.source}
      variant={props.variant}
      initial={initial}
      records={records}
      selected={selected}
      recordId={recordId}
      version={version}
      access={props.access}
      query={query}
      expectedVersion={currentVersion}
      csrfToken={props.csrfToken ?? ''}
      status={status}
      hasError={initial.status === 'error'}
      onStatus={setStatus}
      onSuccess={onSuccess}
      {...(onCanonicalRefetch === undefined ? {} : { onCanonicalRefetch })}
    />
  );
};

export default ShadowClaimOwnershipWorkbench;
