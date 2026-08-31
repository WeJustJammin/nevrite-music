import type { InfrastructureRecord as ContractInfrastructureRecord } from '@wejammin/contracts';

export type InfrastructureRecord = ContractInfrastructureRecord;

export type AccessVariant =
  'full' | 'read-only' | 'partial-hidden' | 'disabled' | 'not-rendered';

export type DomainVariant =
  | 'publicPage'
  | 'appPage'
  | 'adminPage'
  | 'authPage'
  | 'degradedPage'
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

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export type UiError = Readonly<{
  code: string;
  message: string;
  requestId: string;
  details: Readonly<Record<string, unknown>> | null;
}>;

export type AsyncState<T> =
  | Readonly<{ status: 'idle' }>
  | Readonly<{
      status: 'loading';
      startedAt: string;
      preserveSafePriorContent: boolean;
    }>
  | Readonly<{ status: 'error'; error: UiError; retryable: boolean }>
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
      error: UiError;
      version: string;
    }>
  | Readonly<{ status: 'disabled'; reason: string }>
  | Readonly<{
      status: 'degraded';
      data: T | null;
      requestId: string;
      lastVerifiedAt: string | null;
    }>;

export type InfrastructureContractField =
  | 'Allow'
  | 'ApiError'
  | 'AuditEvent'
  | 'Deny'
  | 'ETag'
  | 'IdempotencyRecord'
  | 'Job'
  | 'JobStatus'
  | 'Location'
  | 'ObjectRecord'
  | 'OutboxEvent'
  | 'ProviderOperation'
  | 'RequestContext'
  | 'UploadIntent'
  | 'WebhookReceipt'
  | 'acting_party_id'
  | 'actor_id'
  | 'aggregateVersion'
  | 'anon'
  | 'audit_events'
  | 'audit_private'
  | 'authenticated'
  | 'bigint'
  | 'blocked'
  | 'byteSize'
  | 'checksum'
  | 'completed'
  | 'created_at'
  | 'decision'
  | 'detail'
  | 'dispatched_at'
  | 'error'
  | 'expires_at'
  | 'failed_retryable'
  | 'idempotency_records'
  | 'instance'
  | 'issued'
  | 'jobId'
  | 'jobs'
  | 'limit'
  | 'mediaType'
  | 'object_records'
  | 'operationId'
  | 'outbox_events'
  | 'platform'
  | 'platform_private'
  | 'provider_operations'
  | 'purpose'
  | 'queued'
  | 'ready'
  | 'receipt_id'
  | 'rejected'
  | 'request_hash'
  | 'reserved'
  | 'restoreEpoch'
  | 'retryable'
  | 'schemaVersion'
  | 'search_path'
  | 'security_invoker'
  | 'signedUrl'
  | 'targetId'
  | 'targetType'
  | 'timestamp'
  | 'title'
  | 'type'
  | 'uploadIntentId'
  | 'upload_intents'
  | 'uploaded'
  | 'webhook_receipts';

export interface InfrastructureWorkbenchContractFields {
  readonly source: '00-infrastructure.md';
  readonly fields: Readonly<Record<InfrastructureContractField, unknown>>;
}

export interface InfrastructureRouteProps {
  readonly children?: never;
  readonly variant: DomainVariant;
  readonly actorId: string | null;
  readonly actingPartyId: string | null;
  readonly capabilitySnapshot: readonly string[];
  readonly canonicalUrl: string;
  readonly initialQuery: Readonly<Record<string, string>>;
  readonly requestId: string;
}

export interface InfrastructureWorkbenchProps {
  readonly contractFields: InfrastructureWorkbenchContractFields;
  readonly children?: never;
  readonly variant: DomainVariant;
  readonly initial: AsyncState<readonly InfrastructureRecord[]>;
  readonly actorId: string;
  readonly actingPartyId: string;
  readonly access: AccessVariant;
  readonly query: Readonly<Record<string, string>>;
  readonly selectedId: string | null;
  readonly expectedVersion: string | null;
  readonly onCanonicalRefetch: (
    reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect',
  ) => Promise<void>;
}

export interface InfrastructureStatePresentation {
  readonly status: import('@wejammin/contracts').InfrastructureViewState['status'];
  readonly [key: string]: unknown;
}
