import type { UploadIntentResource as CanonicalUploadIntentResource } from '@wejammin/contracts';

type UploadAwaitable<T> = T | Promise<T>;

export type UploadAdmissionBody = Readonly<{
  targetType: string;
  targetId: string;
  purpose: string;
  mediaType: string;
  byteSize: number;
  checksum: Readonly<{
    algorithm: string;
    value: string;
  }>;
}>;

export type UploadAdmissionHeaders = Readonly<{
  idempotencyKey?: unknown;
  ifMatch?: unknown;
  contentType?: unknown;
}>;

export type UploadAdmissionRequest = Readonly<{
  headers: unknown;
  body: unknown;
}>;

export type TargetUploadPolicy = Readonly<{
  targetType: string;
  purposes: readonly string[];
  allowedMediaTypes: readonly string[];
  maxBytes: number;
  immutable: boolean;
}>;

export type UploadPolicyRegistry = Readonly<Record<string, TargetUploadPolicy>>;

export type NormalizedUploadAdmission = Readonly<{
  body: UploadAdmissionBody;
  idempotencyKey: string;
  ifMatch: string | null;
  policy: TargetUploadPolicy;
  normalizedRequest: string;
}>;

export type UploadValidationResult =
  | Readonly<{
      kind: 'valid';
      value: NormalizedUploadAdmission;
    }>
  | Readonly<{
      kind: 'invalid';
      code:
        | 'INVALID_REQUEST'
        | 'VALIDATION_FAILED'
        | 'PAYLOAD_TOO_LARGE'
        | 'UNSUPPORTED_MEDIA_TYPE';
      message: string;
      details: Readonly<Record<string, unknown>>;
    }>;

export type UploadSession = Readonly<{
  userId: string;
}>;

export type UploadAuthorization =
  | Readonly<{ kind: 'unauthenticated' }>
  | Readonly<{ kind: 'not_found' }>
  | Readonly<{ kind: 'forbidden' }>
  | Readonly<{
      kind: 'allow';
      actorId: string;
      actingPartyId: string;
      targetVersion: string | null;
    }>;

export type UploadAuthorizationPort = Readonly<{
  authorize(
    input: Readonly<{
      session: UploadSession;
      targetType: string;
      targetId: string;
      purpose: string;
    }>,
  ): Promise<UploadAuthorization>;
}>;

export type UploadDigestPort = Readonly<{
  digest(value: string): UploadAwaitable<string>;
}>;

export type UploadIdFactory = Readonly<{
  next(kind: 'upload_intent' | 'object_record'): string;
}>;

export type UploadObjectKeyFactory = Readonly<{
  create(
    input: Readonly<{
      intentId: string;
      objectId: string;
      actorId: string;
      targetType: string;
      targetId: string;
    }>,
  ): string;
}>;

export type UploadSigner = Readonly<{
  sign(
    input: Readonly<{
      intentId: string;
      objectId: string;
      objectKey: string;
      actorId: string;
      mediaType: string;
      maxBytes: number;
      expiresAt: string;
    }>,
  ): Promise<Readonly<{ signedUrl: string }>>;
  revoke(
    input: Readonly<{
      intentId: string;
      objectId: string;
      objectKey: string;
      signedUrl: string;
    }>,
  ): Promise<void>;
}>;

export type UploadIntentResource = CanonicalUploadIntentResource;

export type UploadIntentMetadata = Readonly<{
  intentId: string;
  objectId: string;
  objectKey: string;
  objectVersion: string;
  expiresAt: string;
  maxBytes: number;
  allowedMediaTypes: readonly string[];
}>;

export type ExistingUploadIdempotency = Readonly<{
  actorId: string;
  operation: 'upload-intent.create';
  requestHash: string;
  state: 'reserved' | 'completed' | 'failed_retryable';
  resource: UploadIntentResource | null;
}>;

export type UploadCommitInput = Readonly<{
  actorId: string;
  actingPartyId: string;
  operation: 'upload-intent.create';
  requestHash: string;
  idempotencyKeyHash: string;
  request: UploadAdmissionBody;
  expectedVersion: string | null;
  metadata: UploadIntentMetadata;
}>;

export type UploadCommitResult =
  | Readonly<{ kind: 'committed'; metadata: UploadIntentMetadata }>
  | Readonly<{
      kind: 'replay';
      resource: UploadIntentResource;
    }>
  | Readonly<{ kind: 'conflict' }>
  | Readonly<{ kind: 'dependency_unavailable' }>;

export type UploadAdmissionPersistence = Readonly<{
  readIdempotency(
    input: Readonly<{
      actorId: string;
      operation: 'upload-intent.create';
      idempotencyKeyHash: string;
    }>,
  ): Promise<ExistingUploadIdempotency | null>;
  /** Performs idempotency, CAS, metadata, intent, and audit writes atomically. */
  commitUploadIntent(input: UploadCommitInput): Promise<UploadCommitResult>;
}>;

export type UploadAdmissionClock = Readonly<{
  now(): string;
}>;

export type UploadAdmissionUseCaseInput = Readonly<{
  request: UploadAdmissionRequest;
  session: UploadSession | null;
  policies: UploadPolicyRegistry;
  authorization: UploadAuthorizationPort;
  digest: UploadDigestPort;
  persistence: UploadAdmissionPersistence;
  signer: UploadSigner;
  ids: UploadIdFactory;
  objectKeys: UploadObjectKeyFactory;
  clock: UploadAdmissionClock;
}>;

export type UploadAdmissionError = Readonly<{
  kind: 'error';
  code:
    | 'INVALID_REQUEST'
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'PAYLOAD_TOO_LARGE'
    | 'UNSUPPORTED_MEDIA_TYPE'
    | 'VALIDATION_FAILED'
    | 'DEPENDENCY_UNAVAILABLE'
    | 'INTERNAL_ERROR';
  status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 503 | 500;
  message: string;
  details: Readonly<Record<string, unknown>>;
  noCanonicalWrite: true;
}>;

export type UploadAdmissionDecision =
  | Readonly<{
      kind: 'created';
      status: 201;
      location: string;
      etag: string;
      resource: UploadIntentResource;
      cacheControl: 'no-store';
      replayed: false;
    }>
  | Readonly<{
      kind: 'replayed';
      status: 201;
      location: string;
      etag: string;
      resource: UploadIntentResource;
      cacheControl: 'no-store';
      replayed: true;
    }>
  | UploadAdmissionError;
