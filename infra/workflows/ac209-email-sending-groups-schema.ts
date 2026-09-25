import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { AC209_EMAIL_SENDING_GROUPS_CANONICAL_HOUR } from './ac209-email-sending-groups-values.ts';

/**
 * Zod schemas and the literal identities for the bounded, read-only AC209 Email
 * Sending *groups* corroboration probe.
 *
 * Split from `ac209-email-sending-groups-contract.ts` so one schema file holds
 * one domain (the file-size rule in `.agents/rules/extensibility.md` caps schema
 * files at 150 lines). The dependency runs one way only: this module imports
 * nothing from the contract module, which re-exports everything here, so the
 * module graph stays a DAG.
 *
 * The row shape is the whole safety story. A group row may carry only a bare
 * UTC hour bucket, a one-way digest of the provider's status label, and a
 * non-negative integer count. See the contract module for why the reported
 * numbers are provider-reported rather than guaranteed exact counts, and
 * `ac209-email-log-safety.ts` for why the label is published as a digest. The
 * artifact is uploaded to CI, so the rule is enforced by the schema rather than
 * only by the reader: a row has no field that could carry provider label text,
 * an address, or a message identifier.
 */

export const AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION =
  'ac209-email-sending-groups-v1' as const;

export const AC209_EMAIL_SENDING_GROUPS_DATASET =
  'emailSendingAdaptiveGroups' as const;

const ZONE_ID = /^[0-9a-f]{32}$/u;
const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const UTC_HOUR = AC209_EMAIL_SENDING_GROUPS_CANONICAL_HOUR;

export const Ac209EmailSendingGroupsInputSchema = z
  .object({
    zoneId: z.string().regex(ZONE_ID),
    token: z
      .string()
      .min(20)
      .max(4096)
      .refine((value) => !/\s/u.test(value)),
    sourceRevision: z.string().regex(SOURCE_REVISION),
    start: SafeReleaseTimestampSchema,
    end: SafeReleaseTimestampSchema,
  })
  .strict();

export type Ac209EmailSendingGroupsInput = z.infer<
  typeof Ac209EmailSendingGroupsInputSchema
> & {
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
};

/**
 * `status` is a provider-owned opaque label published only as a one-way
 * digest. It is shape-checked but NOT constrained to a closed vocabulary,
 * because enumerating the values is part of what this probe is for and the
 * provider documents no value list.
 */
export const Ac209EmailSendingGroupsGroupSchema = z
  .object({
    datetimeHour: z.string().regex(UTC_HOUR),
    /**
     * One-way digest of the provider's status label, not the label. The raw value
     * exists only inside the reader frame that hashed it, so a workflow-command
     * token such as `##[` or `::`, or any personal data a label might carry, has
     * no field to land in on a public artifact or log line.
     */
    statusSha256: z.string().regex(SHA256),
    count: z.number().int().min(0),
  })
  .strict();

export const Ac209EmailSendingGroupsReportSchema = z
  .object({
    schemaVersion: z.literal(AC209_EMAIL_SENDING_GROUPS_SCHEMA_VERSION),
    diagnosticOnly: z.literal(true),
    environment: z.literal('production'),
    sourceRevision: z.string().regex(SOURCE_REVISION),
    probedAt: SafeReleaseTimestampSchema,
    /**
     * One-way digest of the requested zone tag. Binds the artifact to the zone
     * that produced it without retaining the raw identifier.
     */
    zoneTagSha256: z.string().regex(SHA256),
    dataset: z.literal(AC209_EMAIL_SENDING_GROUPS_DATASET),
    /** The operator-supplied UTC window, echoed unchanged. */
    window: z
      .object({
        requestedStart: SafeReleaseTimestampSchema,
        requestedEnd: SafeReleaseTimestampSchema,
        /** The span actually sent: equal when hour-aligned, else outward-rounded. */
        queriedStart: SafeReleaseTimestampSchema,
        queriedEnd: SafeReleaseTimestampSchema,
      })
      .strict(),
    /**
     * Required, not free text: this dataset groups by UTC hour, so a count is
     * scoped to whole hour buckets and never to an arbitrary sub-hour span.
     */
    granularity: z.literal('utc_hour_bucket'),
    /**
     * True when the requested window did not align to hour boundaries and was
     * therefore widened outward. When true, the reported counts cover whole
     * hours and may include activity outside the requested span.
     */
    hourRounded: z.boolean(),
    groups: z.array(Ac209EmailSendingGroupsGroupSchema),
    /** Sum of the provider-reported group counts for this window. */
    reportedTotalCount: z.number().int().min(0),
    distinctHours: z.number().int().min(0),
    /**
     * Pinned to true: a page cut short by the row bound fails closed as
     * `provider_result_truncated` and never reaches an artifact, so this records
     * one fact, and no always-false flag is carried beside it.
     */
    pageComplete: z.literal(true),
    /** An `*Adaptive` dataset may be sampled, so counts are not guaranteed exact. */
    sampling: z.literal('provider_may_sample_adaptive_dataset'),
    /** Provenance of the numbers, pinned so it cannot be overstated. */
    observation: z.literal('provider_reported_grouped_totals'),
  })
  .strict();

export type Ac209EmailSendingGroupsReport = z.infer<
  typeof Ac209EmailSendingGroupsReportSchema
>;
