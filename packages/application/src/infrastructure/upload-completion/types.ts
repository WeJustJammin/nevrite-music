import type {
  CompleteUploadIntentRequest,
  ObjectLifecycleState,
  ObjectUploadedQueueEnvelope,
  StorageObjectMetadata,
} from '../../../../contracts/src/upload-completion.ts';
import type { JobStatus } from '../../../../contracts/src/job-status.ts';

export type UploadCompletionSession = Readonly<{
  userId: string;
}>;

export type UploadCompletionIntent = Readonly<{
  id: string;
  objectId: string;
  objectKey: string;
  actorId: string;
  actingPartyId: string;
  targetType: string;
  targetId: string;
  purpose: string;
  maxBytes: number;
  allowedMediaTypes: readonly string[];
  expiresAt: string;
  objectVersion: string;
  state: 'issued' | 'consumed' | 'expired' | 'cancelled';
  expectedChecksum?: Readonly<{
    algorithm: 'sha256';
    value: string;
  }>;
}>;

export type UploadCompletionAuthorization =
  | Readonly<{ kind: 'unauthenticated' }>
  | Readonly<{ kind: 'not_found' }>
  | Readonly<{ kind: 'forbidden' }>
  | Readonly<{
      kind: 'allow';
      actorId: string;
      actingPartyId: string;
      capabilities: readonly string[];
    }>;

export type UploadCompletionAuthorizationPort = Readonly<{
  authorize(
    input: Readonly<{
      session: UploadCompletionSession;
      intent: UploadCompletionIntent;
      signal: AbortSignal;
    }>,
  ): Promise<UploadCompletionAuthorization>;
}>;

export type UploadCompletionDigestPort = Readonly<{
  digest(value: string, signal: AbortSignal): string | Promise<string>;
}>;

export type UploadCompletionStoragePort = Readonly<{
  observe(
    input: Readonly<{
      objectKey: string;
      signal: AbortSignal;
    }>,
  ): Promise<StorageObjectMetadata | null>;
}>;

export type UploadCompletionCommitInput = Readonly<{
  actorId: string;
  actingPartyId: string;
  idempotencyKeyHash: string;
  ifMatch: string;
  intent: UploadCompletionIntent;
  observed: StorageObjectMetadata;
  request: CompleteUploadIntentRequest;
  requestHash: string;
  signal: AbortSignal;
}>;

/**
 * Durable cancellation/reconciliation input for an ambiguous completion.
 *
 * Implementations must atomically fence a still-pending completion identified
 * by this exact idempotency/request/object binding. Once this operation
 * resolves, a previously started commit must either be visible as the
 * canonical completion or be unable to commit; it may not silently commit a
 * different request.
 */
export type UploadCompletionFenceInput = Omit<
  UploadCompletionCommitInput,
  'signal'
>;

export type UploadCompletionCommitResult =
  | Readonly<{
      kind: 'committed';
      event: ObjectUploadedQueueEnvelope;
      job: JobStatus;
      objectId: string;
      objectVersion: string;
    }>
  | Readonly<{
      kind: 'replay';
      event: ObjectUploadedQueueEnvelope;
      job: JobStatus;
      objectId: string;
      objectVersion: string;
    }>
  | Readonly<{
      kind: 'conflict';
      code: 'IDEMPOTENCY_MISMATCH' | 'VERSION_MISMATCH' | 'INVALID_TRANSITION';
    }>
  | Readonly<{ kind: 'dependency_unavailable' }>;

export type UploadCompletionPersistence = Readonly<{
  readIntent(
    input: Readonly<{
      actorId: string;
      uploadIntentId: string;
      signal: AbortSignal;
    }>,
  ): Promise<UploadCompletionIntent | null>;
  commitCompletion(
    input: UploadCompletionCommitInput,
  ): Promise<UploadCompletionCommitResult>;
  /**
   * Atomically fences an ambiguous canonical completion after its request
   * deadline. The implementation must make a pending commit impossible to
   * commit after this fence and honor the fence if a commit resolves later.
   * The caller supplies a fresh bounded signal, never the aborted request
   * signal.
   */
  cancelCompletion?: (
    input: UploadCompletionFenceInput,
    signal: AbortSignal,
  ) => Promise<void>;
  claimVerification(
    input: Readonly<{
      expectedVersion: string;
      from: 'uploaded';
      objectId: string;
      signal: AbortSignal;
      to: 'verifying';
    }>,
  ): Promise<VerificationClaimResult>;
  finishVerification(
    input: VerificationFinishInput,
  ): Promise<VerificationFinishResult>;
  readVerificationTarget(
    input: Readonly<{
      objectId: string;
      signal: AbortSignal;
    }>,
  ): Promise<VerificationTarget | null>;
  readObject(
    input: Readonly<{
      objectId: string;
      signal: AbortSignal;
    }>,
  ): Promise<Readonly<{
    id: string;
    objectKey: string;
    state: ObjectLifecycleState;
    version: string;
  }> | null>;
}>;

export type UploadCompletionQueuePort = Readonly<{
  enqueue(
    input: Readonly<{
      envelope: ObjectUploadedQueueEnvelope;
      queue: 'platform-objects';
      signal: AbortSignal;
    }>,
  ): Promise<void>;
}>;

export type UploadCompletionInput = Readonly<{
  request: unknown;
  session: UploadCompletionSession | null;
  authorization: UploadCompletionAuthorizationPort;
  digest: UploadCompletionDigestPort;
  persistence: UploadCompletionPersistence;
  storage: UploadCompletionStoragePort;
  queue: UploadCompletionQueuePort;
  /** Registers bounded recovery invoked when the request deadline aborts. */
  registerDeadlineRecovery?: (recovery: () => Promise<void>) => void;
  signal?: AbortSignal;
  now?: () => string;
}>;

export type UploadCompletionErrorCode =
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

export type UploadCompletionError = Readonly<{
  kind: 'error';
  code: UploadCompletionErrorCode;
  status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 503 | 500;
  message: string;
  details: Readonly<Record<string, unknown>>;
  noCanonicalWrite: true;
}>;

export type UploadCompletionDecision =
  | Readonly<{
      kind: 'accepted';
      status: 202;
      location: string;
      etag: string;
      job: JobStatus;
      objectId: string;
      objectState: 'uploaded';
      replayed: boolean;
      dispatch: 'sent' | 'deferred';
    }>
  | UploadCompletionError;

export type VerificationTarget = Readonly<{
  id: string;
  state: ObjectLifecycleState;
  version: string;
  jobId: string;
  expected: StorageObjectMetadata;
}>;

export type VerificationClaimResult =
  | Readonly<{ kind: 'claimed'; expectedVersion: string; version: string }>
  | Readonly<{ kind: 'conflict' }>
  | Readonly<{ kind: 'dependency_unavailable' }>;

export type VerificationFinishInput = Readonly<{
  expectedVersion: string;
  from: 'verifying';
  jobId: string;
  nextState: 'ready' | 'rejected' | 'quarantined';
  objectId: string;
  signal: AbortSignal;
  errorCode?: 'OBJECT_VERIFICATION_FAILED';
}>;

export type VerificationFinishResult =
  | Readonly<{
      kind: 'applied';
      job: JobStatus;
      objectVersion: string;
    }>
  | Readonly<{ kind: 'noop'; state: ObjectLifecycleState }>
  | Readonly<{ kind: 'conflict' }>
  | Readonly<{ kind: 'dependency_unavailable' }>;

export type VerificationPort = Readonly<{
  verify(
    input: Readonly<{
      objectId: string;
      observed: StorageObjectMetadata;
      signal: AbortSignal;
    }>,
  ): Promise<'pass' | 'reject' | 'quarantine'>;
}>;

export type VerifyUploadedObjectInput = Readonly<{
  objectId: string;
  persistence: UploadCompletionPersistence;
  storage: UploadCompletionStoragePort;
  signal?: AbortSignal;
  policy?: VerificationPort;
}>;

export type VerificationDecision =
  | Readonly<{ kind: 'ready'; objectVersion: string; job: JobStatus }>
  | Readonly<{
      kind: 'rejected' | 'quarantined';
      objectVersion: string;
      job: JobStatus;
    }>
  | Readonly<{ kind: 'noop'; state: ObjectLifecycleState }>
  | Readonly<{
      kind: 'retry';
      reason:
        | 'storage_unavailable'
        | 'persistence_unavailable'
        | 'cas_conflict'
        | 'not_uploaded'
        | 'invalid_canonical_state';
    }>
  | Readonly<{ kind: 'not_found' }>;

export type ReadyObject = Readonly<{
  id: string;
  objectKey: string;
  state: 'ready';
  version: string;
}>;

export type UploadCompletionPorts = Readonly<{
  authorization: UploadCompletionAuthorizationPort;
  digest: UploadCompletionDigestPort;
  persistence: UploadCompletionPersistence;
  storage: UploadCompletionStoragePort;
  queue: UploadCompletionQueuePort;
}>;
