import type {
  UploadAdmissionError,
  UploadAuthorization,
  UploadValidationResult,
} from './types.ts';

export const error = (
  code: UploadAdmissionError['code'],
  status: UploadAdmissionError['status'],
  message: string,
  details: Readonly<Record<string, unknown>> = {},
): UploadAdmissionError => ({
  code,
  details,
  kind: 'error',
  message,
  noCanonicalWrite: true,
  status,
});

export const validationError = (
  result: Extract<UploadValidationResult, { kind: 'invalid' }>,
): UploadAdmissionError => {
  let status: UploadAdmissionError['status'];
  if (result.code === 'PAYLOAD_TOO_LARGE') status = 413;
  else if (result.code === 'UNSUPPORTED_MEDIA_TYPE') status = 415;
  else if (result.code === 'VALIDATION_FAILED') status = 422;
  else status = 400;
  return error(result.code, status, result.message, result.details);
};

export const authorizationError = (
  decision: Exclude<UploadAuthorization, { kind: 'allow' }>,
): UploadAdmissionError => {
  if (decision.kind === 'unauthenticated') {
    return error('UNAUTHENTICATED', 401, 'Authentication is required.');
  }
  if (decision.kind === 'not_found') {
    return error('NOT_FOUND', 404, 'The requested resource was not found.');
  }
  return error('FORBIDDEN', 403, 'You are not authorized for this resource.');
};
