import type { UploadIntentResource as CanonicalUploadIntentResource } from '@wejammin/contracts';

import type {
  SignedUpload,
  UploadStorageAdapter,
} from '../storage/upload-storage';

export type UploadIntentRequest = Readonly<{
  byteSize: number;
  checksum: Readonly<{ algorithm: 'sha256'; value: string }>;
  mediaType: string;
  purpose: string;
  targetId: string;
  targetType: string;
}>;

/** The response is the shared wire contract, never a worker-local shape. */
export type UploadIntentResource = CanonicalUploadIntentResource;

export type UploadTargetPolicy = Readonly<{
  allowedMediaTypes: readonly string[];
  immutable: boolean;
  maxBytes: number;
  purposes: readonly string[];
}>;

export type UploadPrincipal = Readonly<{
  actingPartyId: string | null;
  actorId: string;
  capabilities: readonly string[];
  kind: 'acting_party' | 'operator' | 'user';
  reason: string | null;
  stepUpVerified: boolean;
}>;

export type TargetAuthorization =
  'allow' | 'forbidden' | 'not_found' | 'step_up_required';

export type UploadIntentCreateInput = Readonly<{
  actorId: string;
  actingPartyId: string | null;
  byteSize: number;
  checksum: Readonly<{ algorithm: 'sha256'; value: string }>;
  idempotencyKeyHash: string;
  ifMatch: string | null;
  mediaType: string;
  objectId: string;
  objectKey: string;
  purpose: string;
  requestHash: string;
  signedUpload: SignedUpload;
  targetId: string;
  targetType: string;
}>;

export type UploadIntentCreateResult =
  | Readonly<{ kind: 'created'; resource: UploadIntentResource }>
  | Readonly<{ kind: 'replay'; resource: UploadIntentResource }>
  | Readonly<{ kind: 'conflict' }>;

export type UploadAdmissionRepository = Readonly<{
  createIntent: (
    input: UploadIntentCreateInput,
    signal: AbortSignal,
  ) => Promise<UploadIntentCreateResult>;
  /**
   * Atomically fences an ambiguous canonical attempt after its request
   * deadline. Implementations must make a pending create impossible to commit
   * after this fence and must honor the fence if a create resolves later. The
   * command invokes this with a fresh bounded signal, never the aborted
   * request signal.
   */
  cancelIntent?: (
    input: Readonly<{
      actorId: string;
      objectId: string;
      objectKey: string;
      signedUpload: SignedUpload;
      targetId: string;
      targetType: string;
    }>,
    signal: AbortSignal,
  ) => Promise<void>;
}>;

export type UploadRateDecision = Readonly<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}>;

export type UploadIntentHandlerOptions = Readonly<{
  authorizeTarget: (
    input: Readonly<{
      policy: UploadTargetPolicy;
      principal: UploadPrincipal;
      request: UploadIntentRequest;
    }>,
    signal: AbortSignal,
  ) => Promise<TargetAuthorization>;
  deadlineMs?: number;
  environment?: 'local' | 'production' | 'staging';
  maxBodyBytes?: number;
  now?: () => number;
  policies: Readonly<Record<string, UploadTargetPolicy>>;
  randomUUID?: () => string;
  rateLimit: (
    principal: UploadPrincipal,
    signal: AbortSignal,
  ) => Promise<UploadRateDecision>;
  repository: UploadAdmissionRepository;
  resolvePrincipal: (
    request: Request,
    signal: AbortSignal,
  ) => Promise<UploadPrincipal | null>;
  storage?: UploadStorageAdapter;
}>;

export type UploadIntentDependencies = Readonly<{
  principal: UploadPrincipal;
  request: UploadIntentRequest;
  policy: UploadTargetPolicy;
}>;
