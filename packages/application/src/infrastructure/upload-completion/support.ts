import { PositiveBigintDecimalSchema } from '../../../../contracts/src/platform-events.ts';

import type {
  UploadCompletionAuthorization,
  UploadCompletionError,
  UploadCompletionInput,
  UploadCompletionIntent,
} from './types.ts';

export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const signalFor = (input: UploadCompletionInput): AbortSignal =>
  input.signal ?? new AbortController().signal;

export const error = (
  code: UploadCompletionError['code'],
  status: UploadCompletionError['status'],
  message: string,
  details: Readonly<Record<string, unknown>> = {},
): UploadCompletionError => ({
  code,
  details,
  kind: 'error',
  message,
  noCanonicalWrite: true,
  status,
});

export const invalid = (): UploadCompletionError =>
  error('INVALID_REQUEST', 400, 'The upload completion request is invalid.');

export const unavailable = (): UploadCompletionError =>
  error(
    'DEPENDENCY_UNAVAILABLE',
    503,
    'Upload completion is temporarily unavailable.',
    { dependencyClass: 'upload-completion', retryable: true },
  );

export const mapAuthorization = (
  decision: UploadCompletionAuthorization,
): UploadCompletionError | null => {
  if (decision.kind === 'unauthenticated') {
    return error('UNAUTHENTICATED', 401, 'Authentication is required.', {
      recoveryAction: 'reauthenticate',
    });
  }
  if (decision.kind === 'not_found') {
    return error('NOT_FOUND', 404, 'The upload intent was not found.');
  }
  if (decision.kind === 'forbidden') {
    return error('FORBIDDEN', 403, 'The upload completion is not permitted.', {
      reasonCode: 'CAPABILITY_REQUIRED',
    });
  }
  return null;
};

export const validIntent = (intent: UploadCompletionIntent): boolean =>
  UUID.test(intent.id) &&
  UUID.test(intent.objectId) &&
  UUID.test(intent.actorId) &&
  UUID.test(intent.actingPartyId) &&
  UUID.test(intent.targetId) &&
  (intent.state === 'issued' || intent.state === 'consumed') &&
  Number.isSafeInteger(intent.maxBytes) &&
  intent.maxBytes > 0 &&
  intent.allowedMediaTypes.length > 0 &&
  intent.allowedMediaTypes.every(
    (mediaType) =>
      typeof mediaType === 'string' && mediaType === mediaType.toLowerCase(),
  ) &&
  PositiveBigintDecimalSchema.safeParse(intent.objectVersion).success &&
  Number.isFinite(Date.parse(intent.expiresAt));

export const versionMatches = (
  ifMatch: string,
  objectVersion: string,
): boolean => ifMatch === `"${objectVersion}"`;

export const intentIsLive = (
  intent: UploadCompletionIntent,
  now: string,
): boolean => Date.parse(intent.expiresAt) > Date.parse(now);

export const requestHashInput = (
  input: Readonly<{
    actorId: string;
    actingPartyId: string;
    body: unknown;
    ifMatch: string;
    intent: UploadCompletionIntent;
    uploadIntentId: string;
  }>,
): string =>
  JSON.stringify({
    actingPartyId: input.actingPartyId,
    actorId: input.actorId,
    body: input.body,
    contractVersion: '1',
    expectedVersion: input.ifMatch,
    operation: 'upload-intent.complete',
    targetId: input.intent.targetId,
    targetType: input.intent.targetType,
    uploadIntentId: input.uploadIntentId,
  });

export const validDigest = (value: string): boolean =>
  /^[a-f0-9]{64}$/.test(value);
