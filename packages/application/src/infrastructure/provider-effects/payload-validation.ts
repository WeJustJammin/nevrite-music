const MAX_PAYLOAD_KEYS = 32;
const MAX_PAYLOAD_BYTES = 32 * 1024;

type PayloadRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is PayloadRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isJsonValue = (value: unknown, depth = 0): boolean => {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (typeof value === 'number') return Number.isFinite(value);
  if (depth > 4 || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.every((child) => isJsonValue(child, depth + 1));
  }
  return Object.values(value).every((child) => isJsonValue(child, depth + 1));
};

/** Validates persisted payloads again immediately before an adapter call. */
export const isAllowlistedProviderPayload = (
  value: unknown,
  allowedPayloadKeys: readonly string[],
): value is Readonly<Record<string, unknown>> => {
  if (!isRecord(value) || !isJsonValue(value)) return false;
  const keys = Object.keys(value);
  if (
    keys.length > MAX_PAYLOAD_KEYS ||
    keys.some((key) => !allowedPayloadKeys.includes(key))
  ) {
    return false;
  }
  try {
    const serialized = JSON.stringify(value);
    return (
      serialized !== undefined &&
      new TextEncoder().encode(serialized).byteLength <= MAX_PAYLOAD_BYTES
    );
  } catch {
    return false;
  }
};
