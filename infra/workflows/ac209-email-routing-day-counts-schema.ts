import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { PROVIDER_LABEL_SHA256 } from './ac209-email-log-safety.ts';

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
 * UTC day, a one-way digest of the provider's status label, and a non-negative
 * integer count. See the contract module for why sampling makes these
 * provider-reported values rather than guaranteed exact underlying event counts,
 * and `ac209-email-log-safety.ts` for why the label is published as a digest. The
 * retained artifact is public, so the rule is enforced by the schema rather than
 * only by the reader: a row has no field that could carry the raw label.
 */

export const AC209_EMAIL_ROUTING_DAY_COUNTS_SCHEMA_VERSION =
  'ac209-email-routing-day-counts-v2' as const;

export const AC209_EMAIL_ROUTING_DAY_COUNTS_DATASET =
  'emailRoutingAdaptiveGroups' as const;

const ZONE_ID = /^[0-9a-f]{32}$/u;
const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const UTC_DAY = /^\d{4}-\d{2}-\d{2}$/u;
const BOUNDED_PROVIDER_LABEL = /^[\x20-\x7e]{1,256}$/u;
/**
 * Bounds one provider-owned status label before it is digested. Shared by the
 * schema refinement and the collector's own boundary check so the two cannot
 * drift.
 *
 * This test is a shape check, not a safety boundary: `##[`, `::`, and `@` are all
 * visible ASCII, so passing it has never meant the label is safe to publish. What
 * makes the label safe is that the digest, not the label, is what reaches a log
 * line or an artifact. Bounding length keeps a hostile payload small, and no
 * whitelist narrows the provider's actual vocabulary, which is unenumerated.
 */
export const isBoundedProviderLabel = (value: string): boolean =>
  BOUNDED_PROVIDER_LABEL.test(value);

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
 * `status` is a provider-owned opaque label published only as a one-way digest.
 * It is bounded and shape-checked but NOT constrained to a closed vocabulary,
 * because enumerating the values is the diagnostic's purpose and the provider
 * documents no value list; the report therefore draws no conclusion from any
 * particular value, and retains no text an operator did not already hold.
 */
export const Ac209EmailRoutingDayCountGroupSchema = z
  .object({
    date: z.string().regex(UTC_DAY),
    /**
     * One-way digest of the provider's status label, not the label. The raw value
     * exists only inside the reader frame that hashed it, so a workflow-command
     * token such as `##[` or `::`, or any personal data a label might carry, has
     * no field to land in on a public artifact or log line.
     */
    statusSha256: z.string().regex(PROVIDER_LABEL_SHA256),
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
