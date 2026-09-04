import { PublicProfileResponseSchema } from '@wejammin/contracts';

export type ProfilePortfolioProjection = Readonly<Record<string, unknown>>;

const PRIVATE_FIELD =
  /(?:legalidentity|traderaddress|privatealias|providersecret|providertoken|secret|token|contactvalue|evidencebody|rawpayload|password|credential)/iu;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Clone JSON-like projection data while removing known private/security fields. */
export const sanitizeProfilePortfolioValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeProfilePortfolioValue);
  if (!isRecord(value)) return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_FIELD.test(key)) continue;
    result[key] = sanitizeProfilePortfolioValue(child);
  }
  return result;
};

/** Parse the contract envelope, accepting the historical direct fixture shape used by SSR tests. */
export const parseProfilePortfolioProjection = (
  value: unknown,
): ProfilePortfolioProjection | null => {
  const response = PublicProfileResponseSchema.safeParse(value);
  if (response.success) return response.data.data;
  if (!isRecord(value)) return null;
  const sanitized = sanitizeProfilePortfolioValue(value);
  if (!isRecord(sanitized)) return null;
  if (
    typeof sanitized.partyId !== 'string' ||
    typeof sanitized.projectionVersion !== 'string'
  )
    return null;
  return sanitized;
};

export const projectionVersion = (
  projection: ProfilePortfolioProjection,
  fallback: string | null = null,
): string | null => {
  const value = projection.projectionVersion;
  return typeof value === 'string' ? value : fallback;
};

export const projectionGeneratedAt = (
  projection: ProfilePortfolioProjection,
): string | null => {
  const value = projection.generatedAt;
  return typeof value === 'string' ? value : null;
};

export const projectionPartyId = (
  projection: ProfilePortfolioProjection,
): string | null => {
  const value = projection.partyId;
  return typeof value === 'string' ? value : null;
};
