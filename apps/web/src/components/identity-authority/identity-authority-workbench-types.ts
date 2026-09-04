import type {
  AccessVariant,
  DomainVariant,
} from '../../../../../packages/ui/src/infrastructure/presentation-types';

export interface IdentityAuthorityRecord {
  readonly id: string;
  readonly version: string;
  readonly state: string;
  readonly provenance: readonly Readonly<{
    source: string;
    evidence: string;
    at: string;
    visibility: string;
  }>[];
  readonly projection: Readonly<Record<string, unknown>>;
}

export interface IdentityAuthorityError {
  readonly code: string;
  readonly message: string;
  readonly requestId: string;
  readonly details: Readonly<Record<string, unknown>> | null;
}

export type IdentityAuthorityAsyncState<T> =
  | Readonly<{ status: 'idle' }>
  | Readonly<{
      status: 'loading';
      startedAt: string;
      preserveSafePriorContent: boolean;
    }>
  | Readonly<{
      status: 'error';
      error: IdentityAuthorityError;
      retryable: boolean;
    }>
  | Readonly<{
      status: 'empty';
      reason: 'no-records' | 'filter-miss' | 'not-disclosed';
    }>
  | Readonly<{ status: 'success'; data: T; version: string; stale: false }>
  | Readonly<{
      status: 'optimistic-pending';
      data: T;
      operationId: string;
      version: string;
    }>
  | Readonly<{
      status: 'optimistic-rollback';
      data: T;
      error: IdentityAuthorityError;
      version: string;
    }>
  | Readonly<{ status: 'disabled'; reason: string }>
  | Readonly<{
      status: 'degraded';
      data: T | null;
      requestId: string;
      lastVerifiedAt: string | null;
    }>;

export interface IdentityAuthorityContractFields {
  readonly source: string;
  readonly fields: Readonly<Record<string, unknown>>;
}

export type IdentityAuthorityRefetchReason =
  'navigation' | 'realtime-hint' | 'mutation' | 'reconnect';

export interface IdentityAuthorityWorkbenchProps {
  readonly children?: never;
  readonly contractFields: IdentityAuthorityContractFields;
  readonly variant: DomainVariant;
  readonly initial: IdentityAuthorityAsyncState<
    readonly IdentityAuthorityRecord[]
  >;
  readonly actorId: string;
  readonly actingPartyId: string;
  readonly access: AccessVariant;
  readonly query: Readonly<Record<string, string>>;
  readonly selectedId: string | null;
  readonly expectedVersion: string | null;
  readonly onCanonicalRefetch: (
    reason: IdentityAuthorityRefetchReason,
  ) => Promise<void>;
}
