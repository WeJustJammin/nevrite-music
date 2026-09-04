export interface AdminWorkspaceLegacyProps {
  readonly taskClasses?: readonly string[];
  readonly states?: readonly string[];
  readonly staleAfter?: string | null;
}

export type AdminWorkspaceRecord = Readonly<{
  readonly id?: string;
  readonly version?: string;
  readonly state?: string;
  readonly provenance?: readonly Readonly<{
    readonly source: string;
    readonly evidence: string;
    readonly at: string;
    readonly visibility: string;
  }>[];
  readonly projection?: Readonly<Record<string, unknown>>;
}>;

export type AdminWorkspaceAsyncState = Readonly<{
  readonly status: string;
  readonly data?: readonly AdminWorkspaceRecord[] | null;
  readonly version?: string;
  readonly stale?: boolean;
  readonly lastVerifiedAt?: string | null;
  readonly requestId?: string;
  readonly error?: Readonly<{
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
  }>;
  readonly retryable?: boolean;
  readonly reason?: string;
}>;

export interface AdminWorkspaceActiveProps {
  readonly contractFields: Readonly<{
    readonly source: string;
    readonly fields: Readonly<Record<string, unknown>>;
  }>;
  readonly variant: string;
  readonly initial: AdminWorkspaceAsyncState;
  readonly actorId: string | null;
  readonly actingPartyId: string | null;
  readonly access:
    'full' | 'read-only' | 'partial-hidden' | 'disabled' | 'not-rendered';
  readonly query?: Readonly<Record<string, string | null | undefined>>;
  readonly selectedId?: string | null;
  readonly expectedVersion?: string | null;
  readonly csrfToken?: string;
  readonly requestId?: string;
  readonly canonicalUrl?: string;
  readonly onCanonicalRefetch?: (reason: string) => Promise<void> | void;
}

export type AdminWorkspaceOperationsWorkbenchProps =
  AdminWorkspaceLegacyProps | AdminWorkspaceActiveProps;
