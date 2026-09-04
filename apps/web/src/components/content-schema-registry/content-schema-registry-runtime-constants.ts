export const CONTENT_SCHEMA_REGISTRY_LOADING_DELAY_MS = 250 as const;
export const CONTENT_SCHEMA_REGISTRY_MAX_RETRIES = 2 as const;
export const CONTENT_SCHEMA_REGISTRY_RETRY_DELAYS_MS = [250, 750] as const;

const MAX_RETRY_AFTER_SECONDS = 3_600;

/** Parse Retry-After seconds or an HTTP date, bounded for safe UI waits. */
export const parseContentSchemaRegistryRetryAfter = (
  value: string | null,
  now = Date.now(),
): number | null => {
  if (value === null) return null;
  const trimmed = value.trim();
  if (/^\d+$/u.test(trimmed))
    return Math.min(MAX_RETRY_AFTER_SECONDS, Number(trimmed));
  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp)) return null;
  return Math.min(
    MAX_RETRY_AFTER_SECONDS,
    Math.max(0, Math.ceil((timestamp - now) / 1_000)),
  );
};
