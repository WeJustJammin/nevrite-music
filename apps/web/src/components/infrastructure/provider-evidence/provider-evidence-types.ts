export type ProviderEvidenceAccess =
  | 'read-only'
  | 'staff-case-scoped'
  | 'admin-capability-scoped'
  | 'disabled'
  | 'not-rendered';

export type ProviderOperationState =
  'planned' | 'pending' | 'confirmed' | 'failed' | 'manual_review';

export type WebhookReceiptState =
  | 'received'
  | 'accepted'
  | 'duplicate'
  | 'rejected'
  | 'processed'
  | 'failed'
  | 'manual_review';

export interface ProviderEvidenceFilters {
  readonly provider: string | null;
  readonly state: ProviderOperationState | null;
}

export interface ProviderEvidenceProjection {
  readonly operation: Readonly<{
    readonly id: string;
    readonly provider: string;
    readonly operationType: string;
    readonly state: ProviderOperationState;
    readonly payloadDigest: string;
    readonly version: string;
  }>;
  readonly receipt: Readonly<{
    readonly id: string;
    readonly provider: string;
    readonly state: WebhookReceiptState;
    readonly payloadDigest: string;
    readonly signatureVerifiedAt: string;
    readonly receivedAt: string;
    readonly operationId: string | null;
    readonly externalEventPresent: boolean;
  }> | null;
  readonly provenance: Readonly<{
    readonly source: string;
    readonly observedAt: string;
    readonly lastVerifiedAt: string;
  }>;
  readonly scope: Readonly<{
    readonly kind: 'case' | 'capability';
    readonly label: string;
  }>;
}

export type ProviderEvidenceState =
  | Readonly<{ status: 'idle'; filters: ProviderEvidenceFilters }>
  | Readonly<{ status: 'loading'; filters: ProviderEvidenceFilters }>
  | Readonly<{
      status: 'success';
      filters: ProviderEvidenceFilters;
      evidence: ProviderEvidenceProjection;
    }>
  | Readonly<{
      status: 'error';
      filters: ProviderEvidenceFilters;
      code: string;
      requestId: string;
      retryAfterSeconds?: number;
      retryable: boolean;
      attempt: number;
    }>
  | Readonly<{
      status: 'degraded';
      filters: ProviderEvidenceFilters;
      evidence: ProviderEvidenceProjection | null;
      requestId: string;
      lastVerifiedAt: string | null;
      scope: string;
    }>
  | Readonly<{
      status: 'disabled';
      filters: ProviderEvidenceFilters;
      reason: string;
    }>;
