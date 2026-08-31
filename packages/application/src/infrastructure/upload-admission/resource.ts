import {
  ObjectKeySchema,
  QuotedVersionSchema,
  UploadIntentResourceSchema,
} from '@wejammin/contracts';

import type { UploadIntentMetadata, UploadIntentResource } from './types.ts';
import { MAX_INTENT_AGE_MS, UUID_PATTERN } from './constants.ts';

export const validExpiration = (now: string, expiresAt: string): boolean => {
  const nowMs = Date.parse(now);
  const expiryMs = Date.parse(expiresAt);
  return (
    Number.isFinite(nowMs) &&
    Number.isFinite(expiryMs) &&
    expiryMs > nowMs &&
    expiryMs - nowMs <= MAX_INTENT_AGE_MS
  );
};

export const buildResource = (
  metadata: UploadIntentMetadata,
  signedUrl: string,
): UploadIntentResource => ({
  id: metadata.intentId,
  object: {
    id: metadata.objectId,
    objectKey: metadata.objectKey,
    state: 'pending_upload',
    version: metadata.objectVersion,
  },
  upload: {
    allowedMediaTypes: metadata.allowedMediaTypes,
    expiresAt: metadata.expiresAt,
    maxBytes: metadata.maxBytes,
    method: 'PUT',
    signedUrl,
  },
});

const hasExactPathSuffix = (
  pathSegments: readonly string[],
  expectedSegments: readonly string[],
): boolean =>
  expectedSegments.length > 0 &&
  pathSegments.length >= expectedSegments.length &&
  expectedSegments.every(
    (segment, index) =>
      pathSegments[pathSegments.length - expectedSegments.length + index] ===
      segment,
  );

/** A signer must identify the exact server-generated object in its URL. */
export const signedUrlBindsGeneratedObject = (
  signedUrl: string,
  objectId: string,
  objectKey: string,
): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(signedUrl);
  } catch {
    return false;
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username !== '' ||
    parsed.password !== ''
  )
    return false;
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(parsed.pathname);
  } catch {
    return false;
  }
  const pathSegments = decodedPath.split('/');
  return (
    hasExactPathSuffix(pathSegments, [objectId]) ||
    hasExactPathSuffix(pathSegments, objectKey.split('/'))
  );
};

export const validResource = (
  resource: unknown,
): resource is UploadIntentResource => {
  const parsed = UploadIntentResourceSchema.safeParse(resource);
  return (
    parsed.success &&
    signedUrlBindsGeneratedObject(
      parsed.data.upload.signedUrl,
      parsed.data.object.id,
      parsed.data.object.objectKey,
    )
  );
};

export const validCommitMetadata = (
  metadata: unknown,
  now: string,
): metadata is UploadIntentMetadata => {
  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    Array.isArray(metadata)
  ) {
    return false;
  }
  try {
    const candidate = metadata as Record<string, unknown>;
    const allowedMediaTypes = candidate.allowedMediaTypes;
    if (
      typeof candidate.intentId !== 'string' ||
      typeof candidate.objectId !== 'string' ||
      typeof candidate.objectKey !== 'string' ||
      typeof candidate.objectVersion !== 'string' ||
      typeof candidate.expiresAt !== 'string' ||
      typeof candidate.maxBytes !== 'number' ||
      !Array.isArray(allowedMediaTypes) ||
      allowedMediaTypes.length === 0 ||
      !allowedMediaTypes.every((mediaType) => typeof mediaType === 'string')
    ) {
      return false;
    }
    return (
      UUID_PATTERN.test(candidate.intentId) &&
      UUID_PATTERN.test(candidate.objectId) &&
      QuotedVersionSchema.safeParse(`"${candidate.objectVersion}"`).success &&
      ObjectKeySchema.safeParse(candidate.objectKey).success &&
      Number.isSafeInteger(candidate.maxBytes) &&
      candidate.maxBytes > 0 &&
      validExpiration(now, candidate.expiresAt)
    );
  } catch {
    return false;
  }
};

export const etagFor = (version: string): string => `"${version}"`;
