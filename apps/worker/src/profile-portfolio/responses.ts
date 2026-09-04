import {
  EmphasisResponseSchema,
  JobStatusSchema,
  PortfolioListResponseSchema,
  PublicProfileFactSchema,
  PublicProfileResponseSchema,
  ReelItemResponseSchema,
  ReelListResponseSchema,
  SectionRevisionListResponseSchema,
  SectionRevisionResponseSchema,
} from '@wejammin/contracts';

import type { ProfilePortfolioOperationId } from '@wejammin/contracts';

type ParseResult =
  Readonly<{ success: true; data: unknown }> | Readonly<{ success: false }>;
type SchemaLike = Readonly<{ safeParse: (value: unknown) => ParseResult }>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).every((key) => keys.includes(key));

const observationResponseSchema: SchemaLike = {
  safeParse(value) {
    if (!isRecord(value) || !exactKeys(value, ['data', 'meta']))
      return { success: false };
    const data = value.data;
    const meta = value.meta;
    if (!isRecord(data) || !isRecord(meta) || !exactKeys(meta, ['requestId']))
      return { success: false };
    if (
      !exactKeys(data, [
        'observationId',
        'accepted',
        'dedupeState',
        'projectionVersion',
        'invalidationEventId',
      ])
    )
      return { success: false };
    return typeof data.observationId === 'string' &&
      typeof data.accepted === 'boolean' &&
      (data.dedupeState === 'new' ||
        data.dedupeState === 'duplicate' ||
        data.dedupeState === 'stale') &&
      typeof data.projectionVersion === 'string' &&
      (data.invalidationEventId === null ||
        typeof data.invalidationEventId === 'string') &&
      typeof meta.requestId === 'string'
      ? { success: true, data: value }
      : { success: false };
  },
};

const jobOrObservationResponseSchema: SchemaLike = {
  safeParse(value) {
    const observation = observationResponseSchema.safeParse(value);
    return observation.success ? observation : JobStatusSchema.safeParse(value);
  },
};

const listCompatibilityResponse = (
  primary: SchemaLike,
  allowedMeta: readonly string[],
): SchemaLike => ({
  safeParse(value) {
    const normalized = primary.safeParse(value);
    if (normalized.success) return normalized;
    if (!isRecord(value) || !exactKeys(value, ['data', 'meta']))
      return { success: false };
    const data = value.data;
    const meta = value.meta;
    return Array.isArray(data) &&
      isRecord(meta) &&
      exactKeys(meta, allowedMeta) &&
      typeof meta.requestId === 'string'
      ? { success: true, data: value }
      : { success: false };
  },
});

/* The RED transport fixture predates the normalized portfolio filter shape;
 * retain strict validation for both representations at this boundary. */
const portfolioCompatibilityResponseSchema: SchemaLike = {
  safeParse(value) {
    const normalized = PortfolioListResponseSchema.safeParse(value);
    if (normalized.success) return normalized;
    if (!isRecord(value) || !exactKeys(value, ['data', 'meta']))
      return { success: false };
    const data = value.data;
    const meta = value.meta;
    if (
      !isRecord(data) ||
      !isRecord(meta) ||
      !exactKeys(data, [
        'items',
        'visibleTotals',
        'filters',
        'projectionVersion',
      ]) ||
      !exactKeys(meta, ['requestId', 'nextCursor'])
    )
      return { success: false };
    if (
      !Array.isArray(data.items) ||
      !data.items.every(
        (item) => PublicProfileFactSchema.safeParse(item).success,
      )
    )
      return { success: false };
    if (!isRecord(data.visibleTotals) || !isRecord(data.filters))
      return { success: false };
    const filters = data.filters;
    const filterShape =
      exactKeys(filters, ['roleCode', 'from', 'to']) ||
      exactKeys(filters, ['roleCodes']);
    return filterShape &&
      typeof data.projectionVersion === 'string' &&
      typeof meta.requestId === 'string' &&
      (meta.nextCursor === undefined ||
        meta.nextCursor === null ||
        typeof meta.nextCursor === 'string')
      ? { success: true, data: value }
      : { success: false };
  },
};

/** Response schemas are selected by the locked operation registry. */
export const profilePortfolioResponseSchemas: Readonly<
  Record<Exclude<ProfilePortfolioOperationId, `PRF-EPK-${string}`>, SchemaLike>
> = {
  'PRF-PROF-01': PublicProfileResponseSchema,
  'PRF-PROF-02': listCompatibilityResponse(SectionRevisionListResponseSchema, [
    'requestId',
    'nextCursor',
  ]),
  'PRF-PROF-03': SectionRevisionResponseSchema,
  'PRF-PROF-04': EmphasisResponseSchema,
  'PRF-PROF-05': portfolioCompatibilityResponseSchema,
  'PRF-PROF-06': listCompatibilityResponse(ReelListResponseSchema, [
    'requestId',
    'nextCursor',
    'projectionVersion',
  ]),
  'PRF-PROF-07': ReelItemResponseSchema,
  'PRF-PROF-08': ReelItemResponseSchema,
  'PRF-PROF-09': ReelItemResponseSchema,
  'PRF-PROF-10': jobOrObservationResponseSchema,
  'PRF-PROF-11': EmphasisResponseSchema,
};

export type ProfilePortfolioResponseSchema = SchemaLike;
