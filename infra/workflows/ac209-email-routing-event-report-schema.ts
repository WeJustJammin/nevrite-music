import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  AC209_EMAIL_ROUTING_EVENT_DATASET,
  AC209_EMAIL_ROUTING_EVENT_SCHEMA_VERSION,
  Ac209EmailRoutingEventOutcomeSchema,
} from './ac209-email-routing-event-schema.ts';

/**
 * The report envelope for the bounded, read-only AC209 Email Routing *per-event*
 * diagnostic.
 *
 * Split from `ac209-email-routing-event-schema.ts` by SHAPE rather than by domain,
 * because `extensibility.md` caps a schema file at 150 lines and this one domain's
 * shapes do not fit in a single file: the measurement shapes (input, bounded label
 * tally, outcome union) live in that module and the envelope that carries them
 * lives here. The dependency runs one way only - this module imports the
 * measurement module and never the reverse - and
 * `ac209-email-routing-event-contract.ts` re-exports both, so importers keep one
 * stable path and the module graph stays a DAG.
 *
 * The envelope is the last surface a provider value could leak through, so every
 * field is either a closed literal, a bounded count, or a one-way digest. No raw
 * address, subject, provider message identifier, session, routing-rule identifier,
 * provider error detail, or provider label text has a field to land in.
 */

const SHA256 = /^[0-9a-f]{64}$/u;

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

export type Ac209EmailRoutingEventReport = z.infer<
  typeof Ac209EmailRoutingEventReportSchema
>;
