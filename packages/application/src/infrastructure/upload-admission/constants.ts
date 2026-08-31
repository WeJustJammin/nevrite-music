export const UPLOAD_INTENT_OPERATION = 'upload-intent.create' as const;
export const MAX_INTENT_AGE_MS = 15 * 60 * 1000;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
