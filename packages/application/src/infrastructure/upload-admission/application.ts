import { validateUploadAdmission } from './validation.ts';
import { buildUploadRequestHashInput } from './request-hash.ts';
import { isSession, mapAuthorization } from './authorization.ts';
import { error, authorizationError, validationError } from './errors.ts';
import { compensate, failedCommit } from './compensation.ts';
import { mapExisting } from './idempotency.ts';
import {
  buildResource,
  etagFor,
  signedUrlBindsGeneratedObject,
  validCommitMetadata,
  validResource,
} from './resource.ts';
import {
  DIGEST_PATTERN,
  MAX_INTENT_AGE_MS,
  UPLOAD_INTENT_OPERATION,
} from './constants.ts';
import type {
  UploadAdmissionDecision,
  UploadAdmissionUseCaseInput,
  UploadAuthorization,
  ExistingUploadIdempotency,
  UploadCommitResult,
  UploadIntentMetadata,
} from './types.ts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwnRecord = (value: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key) && isRecord(value[key]);

/**
 * Commit results cross an injected persistence boundary at runtime. Keep the
 * union type honest by checking its discriminant and payload before any
 * orchestration branch dereferences it.
 */
const isUploadCommitResult = (value: unknown): value is UploadCommitResult => {
  try {
    if (
      !isRecord(value) ||
      !Object.prototype.hasOwnProperty.call(value, 'kind') ||
      typeof value.kind !== 'string'
    ) {
      return false;
    }
    if (value.kind === 'conflict' || value.kind === 'dependency_unavailable')
      return true;
    if (value.kind === 'committed') return hasOwnRecord(value, 'metadata');
    if (value.kind === 'replay') return hasOwnRecord(value, 'resource');
    return false;
  } catch {
    // Treat throwing getters and proxy traps as malformed boundary results.
  }
  return false;
};

/**
 * Admits one direct-to-Storage upload. The signer is called only after all
 * boundary, authority, idempotency, and version checks; canonical writes are
 * delegated to one atomic persistence operation after signing.
 */
export const createUploadIntent = async (
  input: UploadAdmissionUseCaseInput,
): Promise<UploadAdmissionDecision> => {
  const validated = validateUploadAdmission({
    policies: input.policies,
    request: input.request,
  });
  if (validated.kind === 'invalid') return validationError(validated);
  if (!isSession(input.session)) {
    return error('UNAUTHENTICATED', 401, 'Authentication is required.');
  }
  let authorization: UploadAuthorization;
  try {
    authorization = await input.authorization.authorize({
      purpose: validated.value.body.purpose,
      session: input.session,
      targetId: validated.value.body.targetId,
      targetType: validated.value.body.targetType,
    });
  } catch {
    return error(
      'DEPENDENCY_UNAVAILABLE',
      503,
      'Upload admission is temporarily unavailable.',
    );
  }
  if (authorization.kind !== 'allow') return authorizationError(authorization);
  const authorizationFailure = mapAuthorization(
    authorization,
    input.session.userId,
  );
  if (authorizationFailure !== null) return authorizationFailure;
  let idempotencyKeyHash: string;
  let requestHash: string;
  const requestHashInput = buildUploadRequestHashInput({
    actorId: authorization.actorId,
    actingPartyId: authorization.actingPartyId,
    body: validated.value.body,
    expectedVersion: validated.value.ifMatch,
  });
  try {
    [idempotencyKeyHash, requestHash] = await Promise.all([
      input.digest.digest(validated.value.idempotencyKey),
      input.digest.digest(requestHashInput),
    ]);
  } catch {
    return error(
      'DEPENDENCY_UNAVAILABLE',
      503,
      'Upload admission is temporarily unavailable.',
    );
  }
  if (
    !DIGEST_PATTERN.test(idempotencyKeyHash) ||
    !DIGEST_PATTERN.test(requestHash)
  ) {
    return error(
      'DEPENDENCY_UNAVAILABLE',
      503,
      'Upload admission is temporarily unavailable.',
    );
  }
  let existing: ExistingUploadIdempotency | null;
  try {
    existing = await input.persistence.readIdempotency({
      actorId: authorization.actorId,
      idempotencyKeyHash,
      operation: UPLOAD_INTENT_OPERATION,
    });
  } catch {
    return error(
      'DEPENDENCY_UNAVAILABLE',
      503,
      'Upload admission is temporarily unavailable.',
    );
  }
  if (existing !== null) {
    const replay = mapExisting(existing, authorization.actorId, requestHash);
    if (replay !== null) return replay;
  }
  let now: string;
  let nowMs: number;
  try {
    now = input.clock.now();
    nowMs = Date.parse(now);
  } catch {
    return error(
      'INTERNAL_ERROR',
      500,
      'Upload admission could not be completed.',
    );
  }
  if (!Number.isFinite(nowMs)) {
    return error(
      'INTERNAL_ERROR',
      500,
      'Upload admission could not be completed.',
    );
  }
  const expiresAt = new Date(nowMs + MAX_INTENT_AGE_MS).toISOString();
  let intentId: string;
  let objectId: string;
  let objectKey: string;
  try {
    intentId = input.ids.next('upload_intent');
    objectId = input.ids.next('object_record');
    objectKey = input.objectKeys.create({
      actorId: authorization.actorId,
      intentId,
      objectId,
      targetId: validated.value.body.targetId,
      targetType: validated.value.body.targetType,
    });
  } catch {
    return error(
      'INTERNAL_ERROR',
      500,
      'Upload admission could not be completed.',
    );
  }
  const metadata: UploadIntentMetadata = {
    allowedMediaTypes: validated.value.policy.allowedMediaTypes,
    expiresAt,
    intentId,
    maxBytes: validated.value.policy.maxBytes,
    objectId,
    objectKey,
    objectVersion: '1',
  };
  if (!validCommitMetadata(metadata, now)) {
    return error(
      'INTERNAL_ERROR',
      500,
      'Upload admission could not be completed.',
    );
  }
  let signedUrl: string;
  try {
    const signed = await input.signer.sign({
      actorId: authorization.actorId,
      expiresAt,
      intentId,
      maxBytes: metadata.maxBytes,
      mediaType: validated.value.body.mediaType,
      objectId,
      objectKey,
    });
    signedUrl = signed.signedUrl;
    if (
      typeof signedUrl !== 'string' ||
      !signedUrlBindsGeneratedObject(signedUrl, objectId, objectKey) ||
      !validResource(buildResource(metadata, signedUrl))
    ) {
      if (typeof signedUrl === 'string') {
        await compensate({
          objectId,
          objectKey,
          intentId,
          signedUrl,
          signer: input.signer,
        });
      }
      return error(
        'DEPENDENCY_UNAVAILABLE',
        503,
        'Upload admission is temporarily unavailable.',
      );
    }
  } catch {
    return error(
      'DEPENDENCY_UNAVAILABLE',
      503,
      'Upload admission is temporarily unavailable.',
    );
  }
  let committed: unknown;
  try {
    committed = await input.persistence.commitUploadIntent({
      actingPartyId: authorization.actingPartyId,
      actorId: authorization.actorId,
      expectedVersion: validated.value.ifMatch,
      idempotencyKeyHash,
      metadata,
      operation: UPLOAD_INTENT_OPERATION,
      request: validated.value.body,
      requestHash,
    });
  } catch {
    return failedCommit({
      code: 'DEPENDENCY_UNAVAILABLE',
      metadata,
      signedUrl,
      signer: input.signer,
    });
  }
  if (!isUploadCommitResult(committed)) {
    return failedCommit({
      code: 'DEPENDENCY_UNAVAILABLE',
      metadata,
      signedUrl,
      signer: input.signer,
    });
  }
  if (committed.kind === 'conflict') {
    return failedCommit({
      code: 'CONFLICT',
      metadata,
      signedUrl,
      signer: input.signer,
    });
  }
  if (committed.kind === 'dependency_unavailable') {
    return failedCommit({
      code: 'DEPENDENCY_UNAVAILABLE',
      metadata,
      signedUrl,
      signer: input.signer,
    });
  }
  if (committed.kind === 'replay') {
    const replay = validResource(committed.resource)
      ? {
          cacheControl: 'no-store' as const,
          etag: etagFor(committed.resource.object.version),
          kind: 'replayed' as const,
          location: `/api/v1/upload-intents/${committed.resource.id}`,
          replayed: true as const,
          resource: committed.resource,
          status: 201 as const,
        }
      : null;
    const compensated = await compensate({
      objectId,
      objectKey,
      intentId,
      signedUrl,
      signer: input.signer,
    });
    if (!compensated || replay === null) {
      return error(
        'DEPENDENCY_UNAVAILABLE',
        503,
        'Upload admission is temporarily unavailable.',
      );
    }
    return replay;
  }
  if (!validCommitMetadata(committed.metadata, now)) {
    return failedCommit({
      code: 'DEPENDENCY_UNAVAILABLE',
      metadata,
      signedUrl,
      signer: input.signer,
    });
  }
  const result = {
    cacheControl: 'no-store' as const,
    etag: etagFor(committed.metadata.objectVersion),
    kind: 'created' as const,
    location: `/api/v1/upload-intents/${committed.metadata.intentId}`,
    replayed: false as const,
    resource: buildResource(committed.metadata, signedUrl),
    status: 201 as const,
  };
  if (!validResource(result.resource)) {
    return failedCommit({
      code: 'DEPENDENCY_UNAVAILABLE',
      metadata,
      signedUrl,
      signer: input.signer,
    });
  }
  return result;
};

export const admitUpload = createUploadIntent;
export const createUploadAdmission = createUploadIntent;
