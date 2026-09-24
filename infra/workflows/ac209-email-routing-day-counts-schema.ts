import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';

/**
 * Zod schemas and the two literal identities for the bounded, read-only AC209
 * Email Routing *day-count* diagnostic.
 *
 * Split from `ac209-email-routing-day-counts-contract.ts` so one schema file
 * holds one domain (`extensibility.md` caps schema files at 150 lines). The
 * dependency runs one way only: this module imports nothing from the contract
 * module, which re-exports everything here, so the graph stays a DAG. Existing
 * importers are unaffected and keep importing the contract path.
 *
 * The row shape is the whole safety story: the report may only ever carry a bare
 * UTC day, a visible-ASCII status label, and a non-negative integer count. See
 * the contract module for why sampling makes these provider-reported values
 * rather than guaranteed exact underlying event counts.
 */

export const AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION =
  'ac209-email-routing-day-counts-v1' as const;

export const AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET =
  'emailRoutingAdaptiveGroups' as const;

const ZONE_ID = /^[0-9a-f]{32}$/u;
const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const UTC_DAY = /^\d{4}-\d{2}-\d{2}$/u;
const VISIBLE_ASCII = /^[\x20-\x7e]+$/u;

/**
 * One definition of a printable status label, shared by the schema refinement
 * and the collector's own boundary check so the two cannot drift. The label is
 * provider-owned and is echoed into a CI log line, so control characters, tabs,
 * escape sequences, DEL, C1 bytes, and multi-byte glyphs are all rejected; no
 * arbitrary whitelist narrows the provider's actual vocabulary.
 */
export const isVisibleAsciiStatus = (value: string): boolean =>
  VISIBLE_ASCII.test(value);

export const Ac209EmailRoutingDayCountsInputSchema = z
  .object({
    zoneId: z.string().regex(ZONE_ID),
    token: z
      .string()
      .min(20)
      .max(4096)
      .refine((value) => !/\s/u.test(value)),
    sourceRevision: z.string().regex(SOURCE_REVISION),
  })
  .strict();

export type Ac209EmailRoutingDayCountsInput = z.infer<
  typeof Ac209EmailRoutingDayCountsInputSchema
> & {
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
};

/**
 * `status` is a provider-owned opaque label. It is bounded and shape-checked
 * but NOT constrained to a closed vocabulary, because enumerating the values is
 * the diagnostic's purpose; the report therefore draws no conclusion from any
 * particular value.
 */
export const Ac209EmailRoutingDayCountGroupSchema = z
  .object({
    date: z.string().regex(UTC_DAY),
    /**
     * Visible ASCII only. The label is provider-owned and is echoed into a CI
     * log line, so control characters, tabs, escape sequences, and multi-byte
     * glyphs are rejected rather than emitted.
     */
    status: z
      .string()
      .min(1)
      .max(256)
      .refine((value) => isVisibleAsciiStatus(value)),
    count: z.number().int().min(0),
  })
  .strict();

export const Ac209EmailRoutingDayCountsReportSchema = z
  .object({
    schemaVersion: z.literal(AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION),
    diagnosticOnly: z.literal(true),
    environment: z.literal('production'),
    sourceRevision: z.string().regex(SOURCE_REVISION),
    probedAt: SafeReleaseTimestampSchema,
    /**
     * One-way digest of the requested zone tag. Binds the artifact to the zone
     * that produced it without retaining the raw identifier, and adds no secret.
     */
    zoneTagSha256: z.string().regex(/^[0-9a-f]{64}$/u),
    dataset: z.literal(AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET),
    window: z
      .object({
        start: z.string().regex(UTC_DAY),
        end: z.string().regex(UTC_DAY),
      })
      .strict(),
    groups: z.array(Ac209EmailRoutingDayCountGroupSchema),
    /** Sum of the provider-reported group counts for this window. */
    reportedTotalCount: z.number().int().min(0),
    distinctDays: z.number().int().min(0),
    /**
     * Pinned to true. A page cut short by the row bound fails closed as
     * `provider_result_truncated` and never reaches an artifact, so this field
     * records one fact - the row bound did not truncate the page - and no
     * separate always-false flag is carried alongside it.
     */
    pageComplete: z.literal(true),
    /**
     * Required caveat, not free text: an `*Adaptive` dataset may be
     * served from a sample, so the reported counts are not guaranteed to be
     * exact underlying event totals.
     */
    sampling: z.literal('provider_may_sample_adaptive_dataset'),
    /** Provenance of the numbers, pinned so it cannot be overstated. */
    observation: z.literal('provider_reported_grouped_totals'),
  })
  .strict();

export type Ac209EmailRoutingDayCountsReport = z.infer<
  typeof Ac209EmailRoutingDayCountsReportSchema
>;
