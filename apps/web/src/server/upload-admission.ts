import type {
  UploadAdmissionState,
  UploadAdmissionView,
} from '../components/infrastructure/upload-admission/upload-admission-state';

export interface UploadIntentResourceInput {
  readonly id: unknown;
  readonly object: unknown;
  readonly upload: unknown;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const VERSION_PATTERN = /^[1-9][0-9]{0,18}$/u;
const MEDIA_TYPE_PATTERN = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value).sort();
  return (
    keys.length === expected.length &&
    expected.every((key, index) => keys[index] === key)
  );
};

const isSafeObjectKey = (value: string): boolean =>
  value.length >= 1 &&
  value.length <= 1024 &&
  !value.startsWith('/') &&
  [...value].every((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && codePoint >= 0x21 && codePoint !== 0x7f;
  }) &&
  !value
    .split('/')
    .some((segment) => segment === '' || segment === '.' || segment === '..');

const requiredString = (
  value: unknown,
  predicate: (candidate: string) => boolean,
  label: string,
): string => {
  if (typeof value !== 'string' || !predicate(value)) {
    throw new TypeError(`Invalid upload intent ${label}`);
  }
  return value;
};

const requiredUuid = (value: unknown, label: string): string =>
  requiredString(
    value,
    (candidate) => UUID_PATTERN.test(candidate.toLowerCase()),
    label,
  );

const requiredDate = (value: unknown, label: string): string =>
  requiredString(
    value,
    (candidate) => Number.isFinite(Date.parse(candidate)),
    label,
  );

const requiredPositiveSafeInteger = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`Invalid upload intent ${label}`);
  }
  return value;
};

const safeUrl = (value: unknown): string => {
  const candidate = requiredString(
    value,
    (entry) => entry.length <= 4096,
    'signed URL',
  );
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new TypeError('Invalid upload intent signed URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new TypeError('Upload intent signed URL must use HTTPS');
  }
  return candidate;
};

const mediaTypes = (value: unknown): readonly string[] => {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 64 ||
    value.some(
      (entry) =>
        typeof entry !== 'string' ||
        entry.length < 1 ||
        entry.length > 128 ||
        !MEDIA_TYPE_PATTERN.test(entry),
    )
  ) {
    throw new TypeError('Invalid upload intent media types');
  }
  return Object.freeze(value.map((entry) => entry.toLowerCase()));
};

export function createUploadAdmissionView(
  input: UploadIntentResourceInput | unknown,
): UploadAdmissionView {
  if (
    !isRecord(input) ||
    !isRecord(input.object) ||
    !isRecord(input.upload) ||
    !hasExactKeys(input, ['id', 'object', 'upload']) ||
    !hasExactKeys(input.object, ['id', 'objectKey', 'state', 'version']) ||
    !hasExactKeys(input.upload, [
      'allowedMediaTypes',
      'expiresAt',
      'maxBytes',
      'method',
      'signedUrl',
    ])
  ) {
    throw new TypeError('Invalid upload intent response fields');
  }
  if (input.object.state !== 'pending_upload') {
    throw new TypeError('Invalid upload intent resource');
  }
  const objectKey = requiredString(
    input.object.objectKey,
    isSafeObjectKey,
    'object key',
  );
  const maxBytes = requiredPositiveSafeInteger(
    input.upload.maxBytes,
    'max bytes',
  );
  const allowedMediaTypes = mediaTypes(input.upload.allowedMediaTypes);
  const view: UploadAdmissionView = {
    id: requiredUuid(input.id, 'id'),
    object: {
      id: requiredUuid(input.object.id, 'object id'),
      objectKey,
      state: 'pending_upload',
      version: requiredString(
        input.object.version,
        (value) => VERSION_PATTERN.test(value),
        'version',
      ),
    },
    transfer: {
      method:
        input.upload.method === 'PUT'
          ? 'PUT'
          : (() => {
              throw new TypeError('Invalid upload intent method');
            })(),
      signedUrl: safeUrl(input.upload.signedUrl),
      expiresAt: requiredDate(input.upload.expiresAt, 'expiry'),
      maxBytes,
      allowedMediaTypes,
    },
  };
  return Object.freeze(view);
}

const persistedView = (view: UploadAdmissionView) => ({
  id: view.id,
  object: view.object,
  transfer: {
    method: view.transfer.method,
    expiresAt: view.transfer.expiresAt,
    maxBytes: view.transfer.maxBytes,
    allowedMediaTypes: [...view.transfer.allowedMediaTypes],
  },
});

/**
 * Only this security projection may cross a persistence boundary. The signed
 * URL stays in the request-scoped transfer closure and is intentionally absent.
 */
export const serializeUploadAdmissionState = (
  state: UploadAdmissionState,
): string => {
  if (state.status === 'success') {
    return JSON.stringify({
      status: state.status,
      view: persistedView(state.view),
    });
  }
  if (state.status === 'error') {
    return JSON.stringify({
      status: state.status,
      code: state.code,
      ...(state.requestId === undefined ? {} : { requestId: state.requestId }),
      ...(state.retryAfterSeconds === undefined
        ? {}
        : { retryAfterSeconds: state.retryAfterSeconds }),
      ...(state.violations === undefined
        ? {}
        : {
            violations: state.violations.map(({ field, code }) => ({
              field,
              code,
            })),
          }),
    });
  }
  return JSON.stringify({ status: state.status });
};
