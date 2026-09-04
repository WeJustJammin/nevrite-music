export interface IdentityActionBarProps {
  readonly primary: string;
  readonly secondary: string;
  readonly destructive: string;
  readonly state: 'idle' | 'pending' | 'success' | 'error' | string;
  readonly expectedVersion: string;
  readonly operationId: string;
}

export interface IdentityCapabilityGateProps {
  readonly variant:
    'full' | 'read-only' | 'partial-hidden' | 'disabled' | 'not-rendered';
  readonly reasonCode: string;
  readonly recoveryHref: string;
  readonly disclosure: string;
}

export interface IdentityFilterBarProps {
  readonly schema: string;
  readonly values: Readonly<Record<string, string>>;
  readonly resultCount: number;
  readonly resetHref: string;
  readonly validationError?: string;
  readonly requestId?: string;
}

export interface IdentityDataTableProps {
  readonly columns: readonly string[];
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly sort: string;
  readonly selection: readonly string[];
  readonly density: string;
}

export interface IdentityConfirmationStepProps {
  readonly consequence: string;
  readonly affectedScope: string;
  readonly expectedVersion: string;
  readonly stepUpState: 'required' | 'verified' | string;
  readonly idempotencyKey: string;
}

export interface IdentityOfflineStatusProps {
  readonly connectivity: 'online' | 'offline';
  readonly intents: readonly Readonly<{
    id: string;
    state: string;
    reason: string;
  }>[];
  readonly serverVersion: string;
  readonly localVersion: string;
}

export interface IdentityAuthorityPrimitivesProps {
  readonly children?: never;
  readonly actionBar: IdentityActionBarProps;
  readonly capabilityGate: IdentityCapabilityGateProps;
  readonly filterBar: IdentityFilterBarProps;
  readonly dataTable: IdentityDataTableProps;
  readonly confirmationStep: IdentityConfirmationStepProps;
  readonly offlineStatus?: IdentityOfflineStatusProps;
}
