import type { UploadAdmissionBody } from './types.ts';

const CONTRACT_MAJOR_VERSION = 1;
const METHOD = 'POST';
const OPERATION_ID = 'upload-intent.create';
const PATH = '/api/v1/upload-intents';

/**
 * Produces the authority-bound, route-bound input for the upload request hash.
 * Idempotency keys stay in their separate hash; this value binds the mutation
 * to the server-resolved principal, target, and expected version.
 */
export const buildUploadRequestHashInput = (
  input: Readonly<{
    actorId: string;
    actingPartyId: string;
    body: UploadAdmissionBody;
    expectedVersion: string | null;
  }>,
): string =>
  JSON.stringify({
    operationId: OPERATION_ID,
    method: METHOD,
    path: PATH,
    actorId: input.actorId,
    actingPartyId: input.actingPartyId,
    expectedVersion: input.expectedVersion,
    contractMajorVersion: CONTRACT_MAJOR_VERSION,
    request: input.body,
  });
