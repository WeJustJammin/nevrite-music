import type { ContentSchemaRegistryError } from './types';
import {
  badGateway,
  deadlineExceeded,
  errorResult,
  unavailable,
} from './production-errors';

export const canonicalVerifierFailure = (
  result: ContentSchemaRegistryError,
): ContentSchemaRegistryError => {
  if (result.status === 401)
    return errorResult(
      401,
      'WEBHOOK_REJECTED',
      'The release request could not be authenticated.',
      {},
    );
  if (result.status === 403)
    return errorResult(403, 'FORBIDDEN', 'The action is not allowed.');
  if (result.status === 404)
    return errorResult(
      404,
      'NOT_FOUND',
      'The requested CMS registry resource was not found.',
    );
  if (result.status === 409)
    return errorResult(
      409,
      'CONFLICT',
      'The CMS registry operation conflicts with current state.',
    );
  if (result.status === 415)
    return errorResult(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'The CMS registry request media type is unsupported.',
    );
  if (result.status === 422)
    return errorResult(
      422,
      'VALIDATION_FAILED',
      'The CMS registry request failed validation.',
    );
  if (result.status === 429)
    return errorResult(
      429,
      'RATE_LIMITED',
      'Too many CMS registry requests.',
      {},
      result.retryAfterSeconds,
    );
  if (result.status === 504) return deadlineExceeded('release_verifier');
  if (result.status === 502) return badGateway();
  if (result.status >= 500) return unavailable('release_verifier');
  return errorResult(
    400,
    'INVALID_REQUEST',
    'The CMS registry request is invalid.',
  );
};
