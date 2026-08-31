import type { AccessVariant } from '@wejammin/ui/infrastructure/presentation';

import type { ProviderEvidencePanelProps } from '../components/infrastructure/provider-evidence/ProviderEvidencePanel';
import type { ProviderEvidenceState } from '../components/infrastructure/provider-evidence/provider-evidence-types';
import type { UploadAdmissionFormProps } from '../components/infrastructure/upload-admission/UploadAdmissionForm';
import type {
  UploadAdmissionState,
  UploadAdmissionView,
} from '../components/infrastructure/upload-admission/upload-admission-state';
import type { UploadCompletionFormProps } from '../components/infrastructure/upload-completion/UploadCompletionForm';

export const INFRASTRUCTURE_SURFACE_CAPABILITIES = Object.freeze({
  uploadAdmission: 'infrastructure.upload.admit',
  uploadCompletion: 'infrastructure.upload.complete',
  providerEvidence: 'infrastructure.provider.evidence',
  providerEvidenceCase: 'infrastructure.provider.evidence:case',
  providerEvidenceAny: 'infrastructure.provider.evidence:any',
} as const);

export const INFRASTRUCTURE_SURFACE_ENDPOINTS = Object.freeze({
  uploadAdmission: '/api/v1/upload-intents',
  uploadCompletion: '/api/v1/upload-intents/{uploadIntentId}/complete',
  providerEvidence: '/app/infrastructure/provider-operations/{operationId}',
} as const);

type SafeUploadAdmissionState = Exclude<
  UploadAdmissionState,
  { readonly status: 'success'; readonly view: UploadAdmissionView }
>;

export type ServerUploadAdmissionProjection = Omit<
  UploadAdmissionFormProps,
  'onSubmit' | 'onTransfer' | 'initialState'
> & { readonly initialState?: SafeUploadAdmissionState };

export type ServerUploadCompletionProjection = Omit<
  UploadCompletionFormProps,
  | 'onSubmit'
  | 'onCanonicalRefetch'
  | 'onRetry'
  | 'onConflictReview'
  | 'onConflictReapply'
  | 'onConflictDiscard'
>;

export type ServerProviderEvidenceProjection = Omit<
  ProviderEvidencePanelProps,
  'onCanonicalRefetch' | 'onRetry'
>;

export interface InfrastructureSurfaceSeeds {
  readonly uploadAdmission?: ServerUploadAdmissionProjection;
  readonly uploadCompletion?: ServerUploadCompletionProjection;
  readonly providerEvidence?: ServerProviderEvidenceProjection;
}

export interface InfrastructureSurfaceProjection {
  readonly access: AccessVariant;
  readonly endpoints: typeof INFRASTRUCTURE_SURFACE_ENDPOINTS;
  readonly uploadAdmission?: UploadAdmissionFormProps;
  readonly uploadCompletion?: UploadCompletionFormProps;
  readonly providerEvidence?: ProviderEvidencePanelProps;
}

export interface InfrastructureSurfaceProjectionInput {
  readonly capabilities: readonly string[];
  readonly seeds?: InfrastructureSurfaceSeeds | null;
}

const hasCapability = (
  capabilities: readonly string[],
  capability: string,
): boolean => capabilities.includes(capability);

const hasAnyCapability = (
  capabilities: readonly string[],
  values: readonly string[],
): boolean => values.some((value) => hasCapability(capabilities, value));

const readAccess = (capabilities: readonly string[]): AccessVariant => {
  if (!hasCapability(capabilities, 'infrastructure.read'))
    return 'not-rendered';
  return hasAnyCapability(capabilities, [
    'infrastructure.write',
    'infrastructure.write:case',
    'infrastructure.write:any',
  ])
    ? 'full'
    : 'read-only';
};

const featureAccess = (
  capabilities: readonly string[],
  base: string,
): AccessVariant | null => {
  if (hasCapability(capabilities, `${base}:partial`)) return 'partial-hidden';
  return hasAnyCapability(capabilities, [base, `${base}:case`, `${base}:any`])
    ? 'full'
    : null;
};

const evidenceAccess = (
  capabilities: readonly string[],
): ProviderEvidencePanelProps['access'] | null => {
  if (
    hasCapability(
      capabilities,
      INFRASTRUCTURE_SURFACE_CAPABILITIES.providerEvidenceCase,
    )
  )
    return 'staff-case-scoped';
  if (
    hasCapability(
      capabilities,
      INFRASTRUCTURE_SURFACE_CAPABILITIES.providerEvidenceAny,
    )
  )
    return 'admin-capability-scoped';
  return hasCapability(
    capabilities,
    INFRASTRUCTURE_SURFACE_CAPABILITIES.providerEvidence,
  )
    ? 'read-only'
    : null;
};

const disabledAdmission = (): UploadAdmissionFormProps => ({
  access: 'disabled',
  capabilityReason: 'Upload admission is not configured by the server.',
  initialDraft: {
    targetType: '',
    targetId: '',
    purpose: '',
    mediaType: '',
    byteSize: '',
    checksum: { algorithm: 'sha256', value: '' },
    idempotencyKey: '',
    ifMatch: '',
  },
  initialState: {
    status: 'disabled',
    reason: 'Upload admission is not configured by the server.',
  },
  policy: {
    targetTypes: [],
    purposes: [],
    allowedMediaTypes: [],
    maxBytes: 1,
    requiresIfMatch: true,
  },
});

const disabledCompletion = (): UploadCompletionFormProps => ({
  access: 'disabled',
  capabilityReason: 'Upload completion is not configured by the server.',
  initialDraft: {
    uploadIntentId: '',
    byteSize: '',
    mediaType: '',
    checksum: { algorithm: 'sha256', value: '' },
    idempotencyKey: '',
    ifMatch: '',
  },
  initialState: {
    status: 'disabled',
    draft: {
      uploadIntentId: '',
      byteSize: '',
      mediaType: '',
      checksum: { algorithm: 'sha256', value: '' },
      idempotencyKey: '',
      ifMatch: '',
    },
    reason: 'Upload completion is not configured by the server.',
  },
  policy: {
    allowedMediaTypes: [],
    maxBytes: 1,
    requiresIfMatch: true,
  },
});

const disabledEvidence = (): ProviderEvidencePanelProps => ({
  access: 'disabled',
  state: {
    status: 'disabled',
    filters: { provider: null, state: null },
    reason: 'Provider evidence is not configured by the server.',
  },
});

const admissionProjection = (
  access: AccessVariant,
  seed: ServerUploadAdmissionProjection | undefined,
): UploadAdmissionFormProps => {
  if (seed === undefined) return disabledAdmission();
  return { ...seed, access };
};

const completionProjection = (
  access: AccessVariant,
  seed: ServerUploadCompletionProjection | undefined,
): UploadCompletionFormProps =>
  seed === undefined ? disabledCompletion() : { ...seed, access };

const evidenceProjection = (
  access: ProviderEvidencePanelProps['access'],
  seed: ServerProviderEvidenceProjection | undefined,
): ProviderEvidencePanelProps =>
  seed === undefined ? disabledEvidence() : { ...seed, access };

/**
 * Projects only server-approved feature props. Capability strings authorize a
 * surface; seeds provide its already-sanitized data. Missing seeds remain
 * visibly disabled, and a context without infrastructure.read renders nothing.
 */
export function createInfrastructureSurfaceProjection(
  input: InfrastructureSurfaceProjectionInput,
): InfrastructureSurfaceProjection {
  const access = readAccess(input.capabilities);
  if (access === 'not-rendered') {
    return { access, endpoints: INFRASTRUCTURE_SURFACE_ENDPOINTS };
  }

  const admissionCapability = featureAccess(
    input.capabilities,
    INFRASTRUCTURE_SURFACE_CAPABILITIES.uploadAdmission,
  );
  const completionCapability = featureAccess(
    input.capabilities,
    INFRASTRUCTURE_SURFACE_CAPABILITIES.uploadCompletion,
  );
  const providerCapability = evidenceAccess(input.capabilities);
  const projection: InfrastructureSurfaceProjection = {
    access,
    endpoints: INFRASTRUCTURE_SURFACE_ENDPOINTS,
    ...(admissionCapability === null
      ? {}
      : {
          uploadAdmission: admissionProjection(
            admissionCapability,
            input.seeds?.uploadAdmission,
          ),
        }),
    ...(completionCapability === null
      ? {}
      : {
          uploadCompletion: completionProjection(
            completionCapability,
            input.seeds?.uploadCompletion,
          ),
        }),
    ...(providerCapability === null
      ? {}
      : {
          providerEvidence: evidenceProjection(
            providerCapability,
            input.seeds?.providerEvidence,
          ),
        }),
  };
  return projection;
}

export type { ProviderEvidenceState };
