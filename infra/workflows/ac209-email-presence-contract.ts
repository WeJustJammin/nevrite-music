import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import type { Ac209EmailSendingAnalyticsErrorCode } from './ac209-email-sending-analytics.ts';

/**
 * Contract surface for the bounded, read-only AC209 Email Sending
 * dataset-presence probe.
 *
 * The hour-bounded correlation gate answers "is this one exercise message
 * present?". It cannot answer the surrounding question: whether the zone-wide
 * Email Sending dataset holds any telemetry at all. The probe defined here
 * samples two trailing windows against the exact parent zone and reports only
 * whether each returned a row. It selects only the non-PII `status` field, which
 * a bare `object field must have selections` GraphQL rule requires on every
 * selection set, and it never publishes that value: the output is a bounded row
 * count and a boolean. No address, subject, or provider message identifier is
 * ever selected or retained.
 *
 * Diagnostic-only: it performs no mutation, closes no acceptance criterion, and
 * never substitutes for the correlation gate, the delivery verifier, or the
 * visible receipt inspection.
 */

export const AC209_EMAIL_PRESENCE_SCHEMA_VERSION =
  'ac209-email-presence-v1' as const;

/** One returned row is enough to prove presence; the page must never exceed it. */
export const AC209_EMAIL_PRESENCE_SAMPLE_LIMIT = 1 as const;
export const AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS = 86_400_000 as const;
export const AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS = 2_592_000_000 as const;
/** The provider's own reported `maxDuration` ceiling: 2,678,400 seconds. */
export const AC209_EMAIL_PRESENCE_MAX_DURATION_MS = 2_678_400_000 as const;

/**
 * The closed provider-failure vocabulary a window may report. The artifact is
 * logged and retained, so an unconstrained string could carry provider free text
 * or a token into durable evidence; this list is the same vocabulary the shared
 * request boundary already classifies into.
 */
export const AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES = [
  'invalid_configuration',
  'provider_graphql_error',
  'provider_permission_denied',
  'provider_query_invalid',
  'provider_request_failed',
  'provider_resource_unavailable',
  'provider_response_invalid',
  'provider_result_truncated',
  'provider_temporarily_unavailable',
  'event_not_unique',
  'unexpected_failure',
] as const satisfies readonly Ac209EmailSendingAnalyticsErrorCode[];

/**
 * Enforced, not merely documented: the wide window must fit inside the
 * provider's own reported `maxDuration` ceiling, or the probe would ask for a
 * range the Email Sending dataset refuses to serve. Evaluated at module load so
 * a widened window fails immediately and everywhere rather than at request time.
 */
export const AC209_EMAIL_PRESENCE_WINDOWS_FIT_PROVIDER_BUDGET: boolean =
  AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS <= AC209_EMAIL_PRESENCE_MAX_DURATION_MS &&
  AC209_EMAIL_PRESENCE_RECENT_WINDOW_MS <= AC209_EMAIL_PRESENCE_WIDE_WINDOW_MS;

if (!AC209_EMAIL_PRESENCE_WINDOWS_FIT_PROVIDER_BUDGET)
  throw new RangeError(
    'AC209 Email Sending presence windows exceed the provider duration budget.',
  );

const ZONE_ID = /^[0-9a-f]{32}$/u;
const SOURCE_REVISION = /^[0-9a-f]{40}$/u;

/**
 * Count-only probe: exactly one row, ordered newest-first, and only the
 * documented `status` field selected. The row count is the entire signal, so
 * no event dimension is requested and no time-series grouping is used.
 */
export const AC209_EMAIL_PRESENCE_QUERY =
  `query Ac209EmailSendingPresence($zoneTag: string!, $start: Time!, $end: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      emailSendingAdaptive(
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

export type Ac209EmailPresenceClassification =
  | 'recent_present'
  | 'recent_missing'
  | 'zone_wide_missing'
  | 'provider_unavailable';

export const Ac209EmailPresenceInputSchema = z
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

export type Ac209EmailPresenceInput = z.infer<
  typeof Ac209EmailPresenceInputSchema
> & {
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
};

const UnavailableSchema = z
  .object({
    status: z.literal('unavailable'),
    code: z.enum(AC209_EMAIL_PRESENCE_UNAVAILABLE_CODES),
  })
  .strict();

const AvailableWindowSchema = z
  .object({
    status: z.literal('available'),
    start: SafeReleaseTimestampSchema,
    end: SafeReleaseTimestampSchema,
    rowsReturned: z
      .number()
      .int()
      .min(0)
      .max(AC209_EMAIL_PRESENCE_SAMPLE_LIMIT),
    present: z.boolean(),
  })
  .strict()
  .refine((value) => value.present === value.rowsReturned > 0, {
    message: 'presence flag must match the returned row count.',
  });

export const Ac209EmailPresenceWindowSchema = z.discriminatedUnion('status', [
  UnavailableSchema,
  AvailableWindowSchema,
]);

export const Ac209EmailPresenceProbeReportSchema = z
  .object({
    schemaVersion: z.literal(AC209_EMAIL_PRESENCE_SCHEMA_VERSION),
    diagnosticOnly: z.literal(true),
    environment: z.literal('production'),
    sourceRevision: z.string().regex(SOURCE_REVISION),
    probedAt: SafeReleaseTimestampSchema,
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

export type Ac209EmailPresenceWindow = z.infer<
  typeof Ac209EmailPresenceWindowSchema
>;
export type Ac209EmailPresenceProbeReport = z.infer<
  typeof Ac209EmailPresenceProbeReportSchema
>;
