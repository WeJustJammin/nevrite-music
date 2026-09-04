import { normalizeSafeReturnPath } from '@wejammin/ui/infrastructure/navigation';

import { isSafeConfigurationKey } from './platform-configuration-presentation-security';
export {
  isSafeConfigurationKey,
  sanitizeConfigurationValue,
} from './platform-configuration-presentation-security';

/**
 * Browser presentation is a text binding only.  No component uses
 * dangerouslySetInnerHTML, URL scheme interpolation, or untrusted markup.
 */
export const PLATFORM_CONFIGURATION_SECURITY_POLICY = Object.freeze({
  csrf: 'same-site token required for mutations',
  origin: 'same-origin Origin or Referer checked at the server boundary',
  cookies: 'Secure; HttpOnly; SameSite cookies are server-managed',
  unknown: 'strict Zod safeParse rejects unknown fields',
  output: 'text binding with explicit encoding',
  secrets:
    'secret and PII values are redacted from HTML, analytics, and Realtime',
  uploads:
    'not applicable; short-lived checksum and canonical-key quarantine remain server-only',
} as const);

/** Only same-origin relative paths are valid authentication return targets. */
export const normalizePlatformConfigurationReturnTo = (
  candidate: string | null | undefined,
): string => normalizeSafeReturnPath(candidate);

export const isSafePlatformConfigurationReturnTo = (
  candidate: string | null | undefined,
): boolean => normalizePlatformConfigurationReturnTo(candidate) === candidate;

/** Strip values that could become a log, telemetry, or URL disclosure. */
export const redactPlatformConfigurationDiagnostics = (
  details: Readonly<Record<string, unknown>> | null | undefined,
): Readonly<Record<string, string | number | boolean>> => {
  if (details === null || details === undefined) return {};
  const output: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(details)) {
    if (!isSafeConfigurationKey(key)) continue;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      output[key] = value;
    }
  }
  return output;
};

export const isSameOriginMutation = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  const requestOrigin = new URL(request.url).origin;
  if (origin !== null) return origin === requestOrigin;
  const referer = request.headers.get('referer');
  if (referer === null) return false;
  try {
    return new URL(referer).origin === requestOrigin;
  } catch {
    return false;
  }
};
