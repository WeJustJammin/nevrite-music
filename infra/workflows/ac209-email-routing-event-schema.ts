import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import { AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES } from './ac209-email-presence-contract.ts';
import { isBoundedProviderLabel } from './ac209-email-routing-day-counts-schema.ts';
import { PROVIDER_LABEL_SHA256 } from './ac209-email-log-safety.ts';
import { Ac209EmailRoutingPresenceInputSchema } from './ac209-email-routing-presence-contract.ts';

/**
 * Re-exported so the collector keeps importing one shared label-bound predicate
 * from the contract path instead of reaching across to the day-counts module
 * directly; `extensibility.md` requires one definition, not one importer.
 */
export { isBoundedProviderLabel };

/**
 * Zod schemas and the literal identities for the bounded, read-only AC209 Email
 * Routing *per-event* diagnostic.
 *
 * Split into two schema modules by SHAPE rather than by domain, because
 * `extensibility.md` caps a schema file at 150 lines and this domain's shapes do
 * not fit in one file: this module owns the measurement shapes - the input, the
 * bounded label tally, and the outcome union - while
 * `ac209-email-routing-event-report-schema.ts` owns the report envelope that
 * carries them. Both describe the one routing-event domain, the dependency runs
 * one way only (the report module imports this one, never the reverse), and
 * `ac209-email-routing-event-contract.ts` re-exports both so importers keep one
 * stable path and the module graph stays a DAG.
 *
 * The outcome shape is the whole safety story. A routing event carries `from`,
 * `to`, `subject`, `messageId`, `sessionId`, `errorDetail`, and `ruleMatched`,
 * and NONE of those may be retained: the report carries bounded counts, the two
 * provider label tallies only as one-way digests, and - only when a reader could
 * still use it to correlate a specific send - a one-way digest of a message
 * identifier. No raw address, subject, provider message identifier, session,
 * routing-rule identifier, provider error detail, or provider label text has a
 * field to land in, so none can be published by accident.
 *
 * The failure vocabulary is reused from the sibling presence contract rather
 * than restated, so the closed code list cannot drift away from the codes the
 * shared request boundary actually throws.
 */

export const AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION =
  'ac209-email-routing-event-v2' as const;

export const AC209_EMAIL_ROUTING_EVENT_DATASET =
  'emailRoutingAdaptive' as const;

const SHA256 = /^[0-9a-f]{64}$/u;

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
 * One bounded provider-owned label tally: a one-way digest of the label, and how
 * many rows carried it.
 *
 * The label behind the digest is shape-checked but NOT constrained to a closed
 * vocabulary, because enumerating the provider's values is the purpose of the
 * diagnostic and Cloudflare publishes no value list for `status` or `action`. The
 * digest is the only carried form: the raw label is hashed in the reader frame,
 * so a label containing the legacy `##[` workflow-command prefix - which the
 * Actions runner matches anywhere in a line, not only at the start - or personal
 * data has no field to land in on the artifact or the log line.
 */
export const Ac209EmailRoutingEventLabelCountSchema = z
  .object({
    labelSha256: z.string().regex(PROVIDER_LABEL_SHA256),
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
         * test membership. The raw identifier is not recoverable, but an
         * identifier that can be guessed - which is the realistic case for a
         * provider message id - can be confirmed by hashing it.
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

export type Ac209EmailRoutingEventOutcome = z.infer<
  typeof Ac209EmailRoutingEventOutcomeSchema
>;
export type Ac209EmailRoutingEventLabelCount = z.infer<
  typeof Ac209EmailRoutingEventLabelCountSchema
>;
