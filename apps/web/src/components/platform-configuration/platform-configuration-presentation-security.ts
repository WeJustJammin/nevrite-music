import type { JsonValue } from '@wejammin/contracts';

const SENSITIVE_KEY =
  /(?:secret|token|password|credential|private|pii|email|phone|address|signed.?url|authorization)/iu;

/** Values that can be rendered in a public or protected projection. */
export const isSafeConfigurationKey = (key: string): boolean =>
  !SENSITIVE_KEY.test(key);

const MAX_RENDERED_STRING_LENGTH = 2_048;
const MAX_RENDERED_ARRAY_ITEMS = 64;
const MAX_RENDERED_OBJECT_KEYS = 64;
const MAX_RENDERED_DEPTH = 8;

type SanitizedNode =
  Readonly<{ ok: true; value: JsonValue }> | Readonly<{ ok: false }>;

const sanitizeNode = (value: unknown, depth: number): SanitizedNode => {
  if (depth > MAX_RENDERED_DEPTH) return { ok: false };
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return { ok: true, value };
  }
  if (typeof value === 'string') {
    return {
      ok: true,
      value:
        value.length > MAX_RENDERED_STRING_LENGTH
          ? `${value.slice(0, MAX_RENDERED_STRING_LENGTH)}…`
          : value,
    };
  }
  if (Array.isArray(value)) {
    const output: JsonValue[] = [];
    for (const item of value.slice(0, MAX_RENDERED_ARRAY_ITEMS)) {
      const sanitized = sanitizeNode(item, depth + 1);
      if (sanitized.ok) output.push(sanitized.value);
    }
    return { ok: true, value: output };
  }
  if (typeof value !== 'object') return { ok: false };
  const output: Record<string, JsonValue> = {};
  for (const [key, item] of Object.entries(value).slice(
    0,
    MAX_RENDERED_OBJECT_KEYS,
  )) {
    if (!isSafeConfigurationKey(key) || key.length > 128) continue;
    const sanitized = sanitizeNode(item, depth + 1);
    if (sanitized.ok) output[key] = sanitized.value;
  }
  return { ok: true, value: output };
};

/** Recursively redact sensitive fields and bound JSON before React renders it. */
export const sanitizeConfigurationValue = (
  value: unknown,
): JsonValue | null => {
  const sanitized = sanitizeNode(value, 0);
  return sanitized.ok ? sanitized.value : null;
};
