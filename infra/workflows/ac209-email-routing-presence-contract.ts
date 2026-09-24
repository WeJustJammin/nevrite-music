import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  Ac209EmailPresenceInputSchema,
  Ac209EmailPresenceProbeReportSchema,
  Ac209EmailPresenceWindowSchema,
} from './ac209-email-presence-contract.ts';

/**
 * Contract surface for the bounded, read-only AC209 Email *Routing*
 * dataset-presence probe and the combined two-dataset dispatch report.
 *
 * Why this exists beside the Email Sending presence probe: Cloudflare documents
 * that emails sent from a Worker through the `send_email` binding
 * "appear in the Email Routing summary as dropped, even when they were
 * delivered successfully"
 * (https://developers.cloudflare.com/email-service/platform/limits/), and it
 * documents two independent zone-level datasets - `emailSendingAdaptive`
 * and `emailRoutingAdaptive`
 * (https://developers.cloudflare.com/email-service/observability/metrics-analytics/).
 * The production Worker sends the AC209 alert through exactly that binding, so
 * the exact zone's Email Sending dataset reading zero rows is not by itself
 * explained by that documented routing classification. Observing both datasets
 * on the same probe instant distinguishes "the sending dataset is empty for
 * this zone" from "the alert transport is accounted as routing", and it also
 * records whether the routing dataset is readable at all.
 *
 * Bounds are reused from the sibling presence contract rather than restated, so
 * the two probes cannot drift into different windows or page sizes.
 *
 * This is diagnostic-only. It performs no mutation, closes no acceptance
 * criterion, and never substitutes for the correlation gate, the delivery
 * verifier, or the visible receipt inspection. A routing `dropped` row
 * cannot by itself prove that the Email Sending dataset should be empty, and an
 * unreadable routing dataset cannot prove that it is.
 */

export const AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION =
  'ac209-email-routing-presence-v1' as const;

export const AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION =
  'ac209-email-datasets-presence-v1' as const;

export const AC209_EMAIL_ROUTING_DATASET = 'emailRoutingAdaptive' as const;

/**
 * Count-only probe of the documented Email Routing dataset: exactly one row,
 * ordered newest-first, selecting only the documented non-PII `status`
 * field. No sender, recipient, subject, provider message identifier, session,
 * routing rule identifier, or error detail is ever selected or retained.
 */
export const AC209_EMAIL_ROUTING_PRESENCE_QUERY =
  `query Ac209EmailRoutingPresence($zoneTag: string!, $start: Time!, $end: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      emailRoutingAdaptive(
        filter: {
          datetime_geq: $start
          datetime_leq: $end
        }
        limit: 1
        orderBy: [datetime_DESC]
      ) {
        status
      }
    }
  }
}` as const;

/**
 * Derived from the sibling presence input instead of restating its regexes, so
 * the zone-id, token, and revision rules cannot drift between the two probes.
 * The sibling-only alternate candidate tag is intentionally not picked: the
 * routing probe has no cross-tag inventory.
 */
export const Ac209EmailRoutingPresenceInputSchema =
  Ac209EmailPresenceInputSchema.pick({
    zoneId: true,
    token: true,
    sourceRevision: true,
  }).strict();

export type Ac209EmailRoutingPresenceInput = z.infer<
  typeof Ac209EmailRoutingPresenceInputSchema
> & {
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
};

export const Ac209EmailRoutingPresenceReportSchema = z
  .object({
    schemaVersion: z.literal(AC209_EMAIL_ROUTING_PRESENCE_SCHEMA_VERSION),
    diagnosticOnly: z.literal(true),
    environment: z.literal('production'),
    sourceRevision: z.string().regex(/^[0-9a-f]{40}$/u),
    probedAt: SafeReleaseTimestampSchema,
    dataset: z.literal(AC209_EMAIL_ROUTING_DATASET),
    windows: z
      .object({
        last24Hours: Ac209EmailPresenceWindowSchema,
        last30Days: Ac209EmailPresenceWindowSchema,
      })
      .strict(),
    classification: z.enum([
      'recent_present',
      'recent_missing',
      'zone_wide_missing',
      'provider_unavailable',
    ]),
  })
  .strict();

export type Ac209EmailRoutingPresenceReport = z.infer<
  typeof Ac209EmailRoutingPresenceReportSchema
>;

/**
 * One dispatch reports both datasets side by side. Neither verdict is derived
 * from the other: the sending field is the sibling probe's whole report and the
 * routing field is this probe's report, so a reader compares two independent
 * observations taken at the same instant.
 */
export const Ac209EmailDatasetsProbeReportSchema = z
  .object({
    schemaVersion: z.literal(AC209_EMAIL_DATASETS_PRESENCE_SCHEMA_VERSION),
    diagnosticOnly: z.literal(true),
    environment: z.literal('production'),
    sourceRevision: z.string().regex(/^[0-9a-f]{40}$/u),
    probedAt: SafeReleaseTimestampSchema,
    sending: Ac209EmailPresenceProbeReportSchema,
    routing: Ac209EmailRoutingPresenceReportSchema,
  })
  .strict();

export type Ac209EmailDatasetsProbeReport = z.infer<
  typeof Ac209EmailDatasetsProbeReportSchema
>;
