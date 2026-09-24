import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES } from './ac209-email-presence-contract.ts';
import { isVisibleAsciiStatus } from './ac209-email-routing-day-counts-schema.ts';
import { Ac209EmailRoutingPresenceInputSchema } from './ac209-email-routing-presence-contract.ts';

/**
 * Re-exported so the collector keeps importing one shared printable-label
 * predicate from the contract path instead of reaching across to the day-counts
 * module directly; `extensibility.md` requires one definition, not one importer.
 */
export { isVisibleAsciiStatus };

/**
 * Zod schemas and the literal identities for the bounded, read-only AC209 Email
 * Routing *per-event* diagnostic.
 *
 * Split from `ac209-email-routing-event-contract.ts` for the same reason the
 * day-counts pair is split: `extensibility.md` caps schema files at 150 lines,
 * and the dependency must run one way only so the module graph stays a DAG. This
 * module therefore imports nothing from the contract module, which re-exports
 * everything here.
 *
 * The report shape is the whole safety story. A routing event carries `from`,
 * `to`, `subject`, `messageId`, `sessionId`, `errorDetail`, and `ruleMatched`,
 * and NONE of those may be retained: the report carries bounded counts, closed
 * non-PII provider labels (`status`, `action`), and - only when a reader could
 * still use it to correlate a specific send - a one-way digest of a message
 * identifier. No raw address, subject, provider message identifier, session,
 * routing-rule identifier, or provider error detail has a field to land in, so
 * none can be published by accident.
 *
 * The failure vocabulary is reused from the sibling presence contract rather
 * than restated, so the closed code list cannot drift away from the codes the
 * shared request boundary actually throws.
 */

export const AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION =
  'ac209-email-routing-event-v1' as const;

export const AC209_EMAIL_ROUTING_EVENT_DATASET =
  'emailRoutingAdaptive' as const;

const SHA256 = /^[0-9a-f]{64}$/u;
const MAX_LABEL_LENGTH = 256;

/**
 * Derived from the sibling routing probe's input instead of restating the zone
 * id, token, and revision rules, then extended with the bounded window. A future
 * tightening of the token or zone rules therefore reaches this diagnostic
 * automatically.
 */
export const Ac209EmailRoutingEventInputSchema =
  Ac209EmailRoutingPresenceInputSchema.extend({
    start: SafeReleaseTimestampSchema,
    end: SafeReleaseTimestampSchema,
  }).strict();

export type Ac209EmailRoutingEventInput = z.infer<
  typeof Ac209EmailRoutingEventInputSchema
> & {
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
};

/**
 * One bounded provider-owned label and how many rows carried it.
 *
 * The label is shape-checked but NOT constrained to a closed vocabulary, because
 * enumerating the provider's values is the purpose of the diagnostic. It is
 * restricted to visible ASCII because it is echoed into a CI log line, so a
 * control character, tab, escape sequence, DEL, C1 byte, or multi-byte glyph is
 * rejected rather than printed.
 */
export const Ac209EmailRoutingEventLabelCountSchema = z
  .object({
    label: z
      .string()
      .min(1)
      .max(MAX_LABEL_LENGTH)
      .refine((value) => isVisibleAsciiStatus(value)),
    count: z.number().int().min(0),
  })
  .strict();

export const Ac209EmailRoutingEventOutcomeSchema = z.discriminatedUnion(
  'status',
  [
    z
      .object({
        status: z.literal('unavailable'),
        code: z.enum(AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES),
      })
      .strict(),
    z
      .object({
        status: z.literal('available'),
        /** Raw rows the provider returned, in-window or not. */
        rowsReturned: z.number().int().min(0),
        /** Rows at or after the requested start and at or before its end. */
        withinWindowRows: z.number().int().min(0),
        outsideWindowRows: z.number().int().min(0),
        /** Distinct one-way message-identifier digests among in-window rows. */
        uniqueMessageIds: z.number().int().min(0),
        /** In-window rows whose provider message identifier was absent. */
        messageIdsMissing: z.number().int().min(0),
        /** In-window rows the provider marked as the last event for the email. */
        finalEventRows: z.number().int().min(0),
        statusCounts: z.array(Ac209EmailRoutingEventLabelCountSchema),
        actionCounts: z.array(Ac209EmailRoutingEventLabelCountSchema),
        /**
         * Sorted, de-duplicated SHA-256 digests of the in-window provider message
         * identifiers. Digests are the ONLY form of identifier material a report
         * may carry: an operator who holds a candidate identifier can hash it and
         * test membership, and no raw identifier is recoverable from the digest.
         */
        messageIdDigests: z.array(z.string().regex(SHA256)),
        /**
         * `complete` means every in-window row contributed a digest, so the set
         * may be compared against another report's set. `partial` means at least
         * one in-window row carried no provider identifier, so the set is missing
         * members and a non-match MUST NOT be read as absence. This states the
         * completeness of the digest set, never anything about delivery.
         */
        messageIdDigestCoverage: z.enum(['complete', 'partial']),
      })
      .strict(),
  ],
);

export const Ac209EmailRoutingEventReportSchema = z
  .object({
    schemaVersion: z.literal(AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION),
    diagnosticOnly: z.literal(true),
    environment: z.literal('production'),
    sourceRevision: z.string().regex(/^[0-9a-f]{40}$/u),
    /** When this diagnostic ran; the requested window is reported separately. */
    probedAt: SafeReleaseTimestampSchema,
    /**
     * One-way digest of the requested zone tag. Binds the artifact to the zone
     * that produced it without retaining the raw identifier.
     */
    zoneTagSha256: z.string().regex(SHA256),
    dataset: z.literal(AC209_EMAIL_ROUTING_EVENT_DATASET),
    window: z
      .object({
        start: SafeReleaseTimestampSchema,
        end: SafeReleaseTimestampSchema,
      })
      .strict(),
    outcome: Ac209EmailRoutingEventOutcomeSchema,
    /**
     * Required caveat: an `Adaptive`-suffixed dataset may be served from a
     * sample, so a zero-row reading is not proof that no routing event occurred.
     *
     * This literal IS the documented sampling indicator, not a placeholder for
     * one. Cloudflare documents sampling as a property of the dataset - the
     * `Adaptive` name carries it and the dataset description states it, both
     * discoverable through introspection - and documents no per-response or
     * numeric sampling field for this dataset
     * (https://developers.cloudflare.com/analytics/graphql-api/sampling/). The
     * query already targets the `Adaptive`-named dataset, so the designation is
     * known without a second call and no field is invented.
     */
    sampling: z.literal('provider_may_sample_adaptive_dataset'),
    /** Provenance of the counts, pinned so it cannot be overstated. */
    observation: z.literal('provider_reported_per_event_rows'),
    /**
     * Pinned statement of the one inference this report refuses to make. An empty
     * or sparse hour cannot be read as absence of the underlying routing events:
     * the dataset may be sampled, and provider retention bounds also apply. The
     * literal exists so the caveat is structural - a reader cannot strip it and
     * leave a report that looks like proof, and a future edit cannot quietly drop
     * it the way free text could.
     */
    underlyingEventAbsence: z.literal('not_established'),
  })
  .strict();

export type Ac209EmailRoutingEventOutcome = z.infer<
  typeof Ac209EmailRoutingEventOutcomeSchema
>;
export type Ac209EmailRoutingEventLabelCount = z.infer<
  typeof Ac209EmailRoutingEventLabelCountSchema
>;
export type Ac209EmailRoutingEventReport = z.infer<
  typeof Ac209EmailRoutingEventReportSchema
>;
