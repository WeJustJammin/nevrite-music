import { JobStatusSchema } from '../../../../contracts/src/job-status.ts';
import {
  ObjectUploadedQueueEnvelopeSchema,
  StorageObjectMetadataSchema,
  UploadCompletionRequestSchema,
  OBJECT_VERIFICATION_QUEUE,
} from '../../../../contracts/src/upload-completion.ts';
import { PositiveBigintDecimalSchema } from '../../../../contracts/src/platform-events.ts';

import {
  UUID,
  error,
  intentIsLive,
  invalid,
  mapAuthorization,
  requestHashInput,
  signalFor,
  unavailable,
  validDigest,
  validIntent,
  versionMatches,
} from './support.ts';

import type {
  UploadCompletionAuthorization,
  UploadCompletionDecision,
  UploadCompletionFenceInput,
  UploadCompletionInput,
  UploadCompletionIntent,
} from './types.ts';

const COMPLETION_RECOVERY_DEADLINE_MS = 1_000;

const runBoundedCompletionRecovery = (
  input: UploadCompletionFenceInput,
  cancelCompletion: NonNullable<
    UploadCompletionInput['persistence']['cancelCompletion']
  >,
): Promise<void> => {
  const controller = new AbortController();
  const cancellation = Promise.resolve()
    .then(() => cancelCompletion(input, controller.signal))
    .then(
      () => undefined,
      () => undefined,
    );
  let resolveTimeout!: () => void;
  const deadline = new Promise<void>((resolve) => {
    resolveTimeout = resolve;
  });
  const timeout = setTimeout(() => {
    controller.abort();
    resolveTimeout();
  }, COMPLETION_RECOVERY_DEADLINE_MS);
  return Promise.race([cancellation, deadline]).finally(() =>
    clearTimeout(timeout),
  );
};

/**
 * Completes an already-issued upload intent. Canonical state, idempotency,
 * audit, and the uploaded event are committed by the injected persistence
 * port; Queue dispatch is best effort after that commit.
 */
export const completeUpload = async (
  input: UploadCompletionInput,
): Promise<UploadCompletionDecision> => {
  const parsed = UploadCompletionRequestSchema.safeParse(input.request);
  if (!parsed.success) return invalid();
  const request = parsed.data;
  const signal = signalFor(input);
  if (
    input.session === null ||
    typeof input.session.userId !== 'string' ||
    !UUID.test(input.session.userId)
  ) {
    return error('UNAUTHENTICATED', 401, 'Authentication is required.', {
      recoveryAction: 'reauthenticate',
    });
  }

  let intent: UploadCompletionIntent | null;
  try {
    intent = await input.persistence.readIntent({
      actorId: input.session.userId,
      signal,
      uploadIntentId: request.uploadIntentId,
    });
  } catch {
    return unavailable();
  }
  if (intent === null)
    return error('NOT_FOUND', 404, 'The upload intent was not found.');
  if (!validIntent(intent))
    return error('INTERNAL_ERROR', 500, 'Upload state is unavailable.');

  let authorization: UploadCompletionAuthorization;
  try {
    authorization = await input.authorization.authorize({
      intent,
      session: input.session,
      signal,
    });
  } catch {
    return unavailable();
  }
  const authorizationError = mapAuthorization(authorization);
  if (authorizationError !== null) return authorizationError;
  if (authorization.kind !== 'allow')
    return error('FORBIDDEN', 403, 'The upload completion is not permitted.');
  if (
    authorization.actorId !== input.session.userId ||
    authorization.actorId !== intent.actorId ||
    authorization.actingPartyId !== intent.actingPartyId
  ) {
    return error('FORBIDDEN', 403, 'The upload completion is not permitted.', {
      reasonCode: 'CAPABILITY_REQUIRED',
    });
  }

  const now = input.now?.() ?? new Date().toISOString();
  if (intent.state === 'issued' && !intentIsLive(intent, now)) {
    return error(
      'VALIDATION_FAILED',
      422,
      'The upload intent is no longer valid.',
      {
        violations: [
          {
            code: 'expired',
            message: 'The upload intent is no longer valid.',
            path: '/uploadIntentId',
          },
        ],
      },
    );
  }
  if (!versionMatches(request.headers.ifMatch, intent.objectVersion)) {
    return error('CONFLICT', 409, 'The object version is stale.', {
      conflict: 'VERSION_MISMATCH',
      recoveryAction: 'refresh',
    });
  }
  if (request.body.byteSize > intent.maxBytes) {
    return error(
      'PAYLOAD_TOO_LARGE',
      413,
      'The declared upload exceeds its limit.',
      {
        maxBytes: intent.maxBytes,
      },
    );
  }
  if (!intent.allowedMediaTypes.includes(request.body.mediaType)) {
    return error(
      'UNSUPPORTED_MEDIA_TYPE',
      415,
      'The media type is not allowed.',
      {
        allowedMediaTypes: intent.allowedMediaTypes,
      },
    );
  }
  if (
    intent.expectedChecksum !== undefined &&
    intent.expectedChecksum.value !== request.body.checksum.value
  ) {
    return error('VALIDATION_FAILED', 422, 'The upload checksum is invalid.', {
      violations: [
        {
          code: 'checksum_mismatch',
          message: 'The value is invalid.',
          path: '/body/checksum/value',
        },
      ],
    });
  }

  let observed;
  try {
    observed = await input.storage.observe({
      objectKey: intent.objectKey,
      signal,
    });
  } catch {
    return unavailable();
  }
  if (observed === null) {
    return error(
      'VALIDATION_FAILED',
      422,
      'The uploaded object could not be verified.',
      {
        violations: [
          {
            code: 'object_not_found',
            message: 'The value is invalid.',
            path: '/body',
          },
        ],
      },
    );
  }
  const observedParsed = StorageObjectMetadataSchema.safeParse(observed);
  if (
    !observedParsed.success ||
    observedParsed.data.objectKey !== intent.objectKey
  ) {
    return error(
      'VALIDATION_FAILED',
      422,
      'The uploaded object could not be verified.',
      {
        violations: [
          {
            code: 'metadata_invalid',
            message: 'The value is invalid.',
            path: '/body',
          },
        ],
      },
    );
  }

  let idempotencyKeyHash: string;
  let requestHash: string;
  try {
    idempotencyKeyHash = await input.digest.digest(
      request.headers.idempotencyKey,
      signal,
    );
    requestHash = await input.digest.digest(
      requestHashInput({
        actorId: authorization.actorId,
        actingPartyId: authorization.actingPartyId,
        body: request.body,
        ifMatch: request.headers.ifMatch,
        intent,
        uploadIntentId: request.uploadIntentId,
      }),
      signal,
    );
  } catch {
    return unavailable();
  }
  if (!validDigest(idempotencyKeyHash) || !validDigest(requestHash)) {
    return unavailable();
  }

  const cancelCompletion = input.persistence.cancelCompletion;
  if (typeof cancelCompletion !== 'function') {
    return unavailable();
  }

  const fenceInput: UploadCompletionFenceInput = {
    actorId: authorization.actorId,
    actingPartyId: authorization.actingPartyId,
    idempotencyKeyHash,
    ifMatch: request.headers.ifMatch,
    intent,
    observed: observedParsed.data,
    request: request.body,
    requestHash,
  };
  const commitInput = {
    ...fenceInput,
    signal,
  };
  let recoveryPromise: Promise<void> | undefined;
  const recoverAttempt = (): Promise<void> => {
    if (recoveryPromise !== undefined) return recoveryPromise;
    recoveryPromise = runBoundedCompletionRecovery(
      fenceInput,
      cancelCompletion,
    );
    return recoveryPromise;
  };
  input.registerDeadlineRecovery?.(recoverAttempt);
  if (signal.aborted) {
    await recoverAttempt();
    return unavailable();
  }

  let commit;
  try {
    commit = await input.persistence.commitCompletion(commitInput);
  } catch {
    // A rejected commit can still represent an ambiguous canonical outcome.
    // Reconcile before reporting the dependency failure, even without a
    // request timeout.
    await recoverAttempt();
    return unavailable();
  }
  const commitKind =
    typeof commit === 'object' && commit !== null
      ? (commit as { kind?: unknown }).kind
      : undefined;
  if (
    commitKind !== 'committed' &&
    commitKind !== 'replay' &&
    commitKind !== 'conflict' &&
    commitKind !== 'dependency_unavailable'
  ) {
    await recoverAttempt();
    return unavailable();
  }
  if (signal.aborted) {
    await recoverAttempt();
    return unavailable();
  }
  if (commit.kind === 'dependency_unavailable') return unavailable();
  if (commit.kind === 'conflict') {
    return error(
      'CONFLICT',
      409,
      'The upload completion conflicts with current state.',
      {
        conflict: commit.code,
        recoveryAction: 'refresh',
      },
    );
  }
  const job = JobStatusSchema.safeParse(commit.job);
  const event = ObjectUploadedQueueEnvelopeSchema.safeParse(commit.event);
  if (
    !job.success ||
    !event.success ||
    !UUID.test(commit.objectId) ||
    commit.objectId !== intent.objectId ||
    !PositiveBigintDecimalSchema.safeParse(commit.objectVersion).success ||
    event.data.aggregateId !== commit.objectId ||
    event.data.eventType !== 'object.uploaded'
  ) {
    await recoverAttempt();
    return error(
      'INTERNAL_ERROR',
      500,
      'The upload completion result is invalid.',
    );
  }

  if (signal.aborted) {
    await recoverAttempt();
    return unavailable();
  }

  let dispatch: 'sent' | 'deferred' = 'sent';
  if (commit.kind === 'committed') {
    try {
      await input.queue.enqueue({
        envelope: event.data,
        queue: OBJECT_VERIFICATION_QUEUE,
        signal,
      });
    } catch {
      dispatch = 'deferred';
    }
  }
  return {
    dispatch,
    etag: `"${commit.objectVersion}"`,
    job: job.data,
    kind: 'accepted',
    location: `/api/v1/jobs/${job.data.id}`,
    objectId: commit.objectId,
    objectState: 'uploaded',
    replayed: commit.kind === 'replay',
    status: 202,
  };
};
