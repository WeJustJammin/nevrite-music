export type ProfilePortfolioVariant =
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

export type ProfilePortfolioAccess =
  'full' | 'read-only' | 'partial-hidden' | 'not-rendered' | 'disabled';

export type ProfilePortfolioProvenance = Readonly<{
  source: string;
  evidence: string;
  at: string;
  visibility: string;
}>;

export type ProfilePortfolioRecord = Readonly<{
  id: string;
  version: string;
  state: string;
  provenance: readonly ProfilePortfolioProvenance[];
  projection: Readonly<Record<string, unknown>>;
}>;

export type ProfilePortfolioError = Readonly<{
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

export type ProfilePortfolioAsyncStatus =
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

export type ProfilePortfolioAsyncState = Readonly<{
  status: ProfilePortfolioAsyncStatus;
  data?: readonly ProfilePortfolioRecord[];
  version?: string;
  stale?: boolean;
  lastVerifiedAt?: string;
  error?: ProfilePortfolioError;
  retryable?: boolean;
}>;

export type ProfilePortfolioContractFields = Readonly<{
  source: string;
  fields: Readonly<Record<string, unknown>>;
}>;

export type ProfilePortfolioWorkbenchProps = Readonly<{
  contractFields: ProfilePortfolioContractFields;
  children?: never;
  variant: ProfilePortfolioVariant;
  initial: ProfilePortfolioAsyncState;
  actorId: string | null;
  actingPartyId: string | null;
  access: ProfilePortfolioAccess;
  query: Readonly<Record<string, string | null | undefined>>;
  selectedId: string | null;
  expectedVersion: string | null;
  csrfToken?: string;
  onCanonicalRefetch?: (reason: string) => Promise<void> | void;
}>;
