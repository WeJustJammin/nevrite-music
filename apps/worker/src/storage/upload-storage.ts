const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const MAX_UPLOAD_INTENT_TTL_MS = 15 * 60 * 1_000;

export type UploadStorageInput = Readonly<{
  actorId: string;
  allowedMediaTypes: readonly string[];
  expiresAt: string;
  maxBytes: number;
  objectId: string;
  objectKey: string;
  targetId: string;
}>;

export type SignedUpload = Readonly<{
  allowedMediaTypes: readonly string[];
  expiresAt: string;
  maxBytes: number;
  method: 'PUT';
  signedUrl: string;
}>;

export type UploadStorageAdapter = Readonly<{
  sign: (
    input: UploadStorageInput,
    signal?: AbortSignal,
  ) => Promise<SignedUpload>;
  /** Invalidates an issued credential when canonical persistence fails. */
  revoke?: (upload: SignedUpload, signal?: AbortSignal) => Promise<void>;
}>;

export type UploadStorageRegistry = Readonly<
  Record<string, UploadStorageAdapter>
>;

const REGISTRY_KEY = /^[a-z][a-z0-9_.:-]{0,127}$/u;

export const defineUploadStorageRegistry = <
  const Registry extends UploadStorageRegistry,
>(
  registry: Registry,
): Registry => {
  if (
    Object.keys(registry).some(
      (name) =>
        !REGISTRY_KEY.test(name) || typeof registry[name]?.sign !== 'function',
    )
  ) {
    throw new Error('Upload storage registry is invalid.');
  }
  return Object.freeze({ ...registry });
};

/** Production keeps storage integrations disabled until separately approved. */
export const createProductionUploadStorageRegistry = <
  const Registry extends UploadStorageRegistry,
>(
  registry = {} as Registry,
): Registry => {
  if (Object.keys(registry).length !== 0) {
    throw new Error('Upload storage registry must be empty in production.');
  }
  return Object.freeze({ ...registry });
};

export class StorageDependencyUnavailableError extends Error {
  constructor() {
    super('Upload storage dependency is unavailable.');
    this.name = 'StorageDependencyUnavailableError';
  }
}

export class UploadStorageInputError extends Error {
  constructor() {
    super('Upload signing input is invalid.');
    this.name = 'UploadStorageInputError';
  }
}

const isUuid = (value: string): boolean => UUID.test(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const codePoint = character.charCodeAt(0);
    return (
      codePoint <= 0x1f ||
      codePoint === 0x7f ||
      (codePoint >= 0x80 && codePoint <= 0x9f)
    );
  });

const isSafeObjectKey = (value: string): boolean =>
  value.length > 0 &&
  value.length <= 1_024 &&
  !hasControlCharacter(value) &&
  !value.split('/').some((segment) => segment === '..' || segment === '.') &&
  !value.startsWith('/') &&
  !value.endsWith('/');

const isMediaType = (value: string): boolean =>
  value.length > 0 &&
  value.length <= 128 &&
  /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(value);

const isValidInput = (input: UploadStorageInput, now: number): boolean => {
  const expiry = Date.parse(input.expiresAt);
  return (
    isUuid(input.actorId) &&
    isUuid(input.objectId) &&
    isUuid(input.targetId) &&
    isSafeObjectKey(input.objectKey) &&
    Number.isSafeInteger(input.maxBytes) &&
    input.maxBytes > 0 &&
    input.allowedMediaTypes.length > 0 &&
    input.allowedMediaTypes.length <= 64 &&
    input.allowedMediaTypes.every(isMediaType) &&
    Number.isFinite(expiry) &&
    expiry > now &&
    expiry <= now + MAX_UPLOAD_INTENT_TTL_MS
  );
};

export const validateSignedUpload = (
  result: unknown,
  input: UploadStorageInput,
  allowLocalHost = true,
): SignedUpload => {
  if (
    typeof result !== 'object' ||
    result === null ||
    !('method' in result) ||
    !('signedUrl' in result) ||
    !('expiresAt' in result) ||
    !('maxBytes' in result) ||
    !('allowedMediaTypes' in result) ||
    typeof result.method !== 'string' ||
    typeof result.signedUrl !== 'string' ||
    typeof result.expiresAt !== 'string' ||
    typeof result.maxBytes !== 'number' ||
    !Array.isArray(result.allowedMediaTypes) ||
    result.allowedMediaTypes.some((value) => typeof value !== 'string')
  ) {
    throw new StorageDependencyUnavailableError();
  }
  let signedUrl: URL;
  try {
    signedUrl = new URL(result.signedUrl);
  } catch {
    throw new StorageDependencyUnavailableError();
  }
  const expiry = Date.parse(result.expiresAt);
  if (
    result.method !== 'PUT' ||
    !Number.isSafeInteger(result.maxBytes) ||
    result.maxBytes !== input.maxBytes ||
    result.allowedMediaTypes.length !== input.allowedMediaTypes.length ||
    result.allowedMediaTypes.some(
      (value, index) => value !== input.allowedMediaTypes[index],
    ) ||
    !Number.isFinite(expiry) ||
    result.expiresAt !== input.expiresAt ||
    signedUrl.username !== '' ||
    signedUrl.password !== '' ||
    (!allowLocalHost && signedUrl.hostname === 'storage.local') ||
    (signedUrl.protocol !== 'https:' &&
      (!allowLocalHost || signedUrl.hostname !== 'storage.local'))
  ) {
    throw new StorageDependencyUnavailableError();
  }
  return {
    allowedMediaTypes: [...result.allowedMediaTypes],
    expiresAt: result.expiresAt,
    maxBytes: result.maxBytes,
    method: 'PUT',
    signedUrl: signedUrl.toString(),
  };
};

/**
 * Recover only the safe, canonical metadata needed to revoke a credential
 * when a signer returned a URL alongside invalid metadata. The raw metadata
 * is never forwarded to the revocation adapter. URLs with credentials or a
 * non-TLS scheme are not safe to salvage.
 */
export const salvageSignedUploadForRevocation = (
  result: unknown,
  input: UploadStorageInput,
  allowLocalHost = true,
): SignedUpload | null => {
  if (!isRecord(result) || typeof result.signedUrl !== 'string') return null;
  let signedUrl: URL;
  try {
    signedUrl = new URL(result.signedUrl);
  } catch {
    return null;
  }
  if (
    signedUrl.protocol !== 'https:' ||
    signedUrl.username !== '' ||
    signedUrl.password !== '' ||
    (!allowLocalHost && signedUrl.hostname === 'storage.local')
  )
    return null;
  return {
    allowedMediaTypes: [...input.allowedMediaTypes],
    expiresAt: input.expiresAt,
    maxBytes: input.maxBytes,
    method: 'PUT',
    signedUrl: signedUrl.toString(),
  };
};

export const createLocalUploadStorage = (
  options: Readonly<{
    logger?: (message: string) => void;
    now?: () => number;
    randomUUID?: () => string;
  }> = {},
): UploadStorageAdapter => {
  const now = options.now ?? Date.now;
  const randomUUID = options.randomUUID ?? (() => crypto.randomUUID());
  return {
    sign: async (input, signal) => {
      if (signal?.aborted || !isValidInput(input, now())) {
        throw new UploadStorageInputError();
      }
      const result: SignedUpload = {
        allowedMediaTypes: [...input.allowedMediaTypes],
        expiresAt: input.expiresAt,
        maxBytes: input.maxBytes,
        method: 'PUT',
        signedUrl: `https://storage.local/upload/${input.objectId}?token=${encodeURIComponent(randomUUID())}`,
      };
      return validateSignedUpload(result, input);
    },
    revoke: async () => undefined,
  };
};

export const createProductionUploadStorage = (
  adapter: UploadStorageAdapter | undefined,
): UploadStorageAdapter => {
  if (adapter !== undefined) return adapter;
  return {
    sign: async () => {
      throw new StorageDependencyUnavailableError();
    },
  };
};

export const generateServerObjectKey = (objectId: string): string => {
  if (!isUuid(objectId)) throw new UploadStorageInputError();
  return `objects/${objectId}`;
};
