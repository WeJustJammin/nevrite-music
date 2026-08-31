import type {
  ExistingUploadIdempotency,
  UploadAdmissionDecision,
} from './types.ts';
import { UPLOAD_INTENT_OPERATION } from './constants.ts';
import { error } from './errors.ts';
import { etagFor, validResource } from './resource.ts';

const isSameRequest = (
  existing: ExistingUploadIdempotency,
  actorId: string,
  requestHash: string,
): boolean =>
  existing.actorId === actorId &&
  existing.operation === UPLOAD_INTENT_OPERATION &&
  existing.requestHash === requestHash;

export const mapExisting = (
  existing: ExistingUploadIdempotency,
  actorId: string,
  requestHash: string,
): UploadAdmissionDecision | null => {
  if (!isSameRequest(existing, actorId, requestHash)) {
    return error('CONFLICT', 409, 'The idempotency binding conflicts.');
  }
  if (existing.state === 'reserved') {
    return error(
      'DEPENDENCY_UNAVAILABLE',
      503,
      'Upload admission is still being resolved.',
    );
  }
  if (existing.state === 'completed' && existing.resource !== null) {
    if (!validResource(existing.resource)) {
      return error(
        'INTERNAL_ERROR',
        500,
        'The upload admission result is invalid.',
      );
    }
    return {
      cacheControl: 'no-store',
      etag: etagFor(existing.resource.object.version),
      kind: 'replayed',
      location: `/api/v1/upload-intents/${existing.resource.id}`,
      replayed: true,
      resource: existing.resource,
      status: 201,
    };
  }
  return null;
};
