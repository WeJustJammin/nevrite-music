import type {
  AccessVariant,
  Breakpoint,
  DomainVariant,
} from '@wejammin/ui/infrastructure/presentation';

export type PlatformConfigurationVariant = DomainVariant;
export type PlatformConfigurationAccess = AccessVariant;
export type PlatformConfigurationBreakpoint = Breakpoint;

export type PlatformConfigurationProvenance = Readonly<{
  source: string;
  evidence: string;
  at: string;
  visibility: string;
}>;

export type PlatformConfigurationRecord = Readonly<{
  id: string;
  version: string;
  state: string;
  provenance: readonly PlatformConfigurationProvenance[];
  projection: Readonly<Record<string, unknown>>;
}>;

export type PlatformConfigurationError = Readonly<{
  code: string;
  message: string;
  requestId: string;
  details?: Readonly<{
    violations?: readonly Readonly<{
      path: string;
      code?: string;
      message: string;
    }>[];
    retryAfterSeconds?: number;
  }>;
}>;

export type PlatformConfigurationAsyncStatus =
  | 'idle'
  | 'loading'
  | 'error'
  | 'empty'
  | 'success'
  | 'optimistic-pending'
  | 'optimistic-rollback'
  | 'conflict'
  | 'disabled'
  | 'degraded';

/**
 * Async state is intentionally permissive at the island boundary: Astro can
 * emit the minimal idle/loading/empty shape while the controller enriches it
 * with timing, ETag, optimistic operation, or degraded freshness metadata.
 */
export type PlatformConfigurationAsyncState = Readonly<{
  status: PlatformConfigurationAsyncStatus;
  data?: readonly PlatformConfigurationRecord[] | null;
  version?: string | undefined;
  stale?: boolean | undefined;
  lastVerifiedAt?: string | null | undefined;
  startedAt?: string | undefined;
  preserveSafePriorContent?: boolean | undefined;
  operationId?: string | undefined;
  requestId?: string | undefined;
  error?: PlatformConfigurationError | undefined;
  retryable?: boolean | undefined;
  reason?: 'no-records' | 'filter-miss' | 'not-disclosed' | undefined;
  disabledReason?: string | undefined;
}>;

export type PlatformConfigurationContractFields = Readonly<{
  source: string;
  fields: Readonly<Record<string, readonly string[]>>;
}>;

export type PlatformConfigurationWorkbenchProps = Readonly<{
  contractFields: PlatformConfigurationContractFields;
  children?: never;
  variant: PlatformConfigurationVariant;
  initial: PlatformConfigurationAsyncState;
  actorId: string | null;
  actingPartyId: string | null;
  access: PlatformConfigurationAccess;
  query: Readonly<Record<string, string | null | undefined>>;
  selectedId: string | null;
  expectedVersion: string | null;
  csrfToken?: string;
  requestId?: string;
  canonicalUrl?: string;
  onCanonicalRefetch?: (
    reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect',
  ) => Promise<void> | void;
}>;

export type SettingsFlagsRuntimeWorkbenchProps =
  PlatformConfigurationWorkbenchProps;
