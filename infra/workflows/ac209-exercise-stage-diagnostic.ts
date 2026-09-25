import {
  parseAc209QueueDiagnostic,
  type Ac209QueueDiagnosticBoundary,
  type Ac209QueueDiagnosticCode,
} from './ac209-queue-contracts.ts';

/**
 * Closed stage-diagnostic vocabulary for the AC209 production exercise.
 *
 * The retained failure receipt and the workflow log both derive from this one
 * table, so the log line and the artifact cannot drift apart. Every entry is a
 * code we authored: no provider response body, token, address, marker, subject,
 * or provider message identifier can reach either output, because neither
 * output has a free-text field to carry one.
 */
export const AC209_EXERCISE_STAGE_CODES = Object.freeze({
  configuration: ['invalid_configuration'],
  eligibility: ['request_failed', 'blocked'],
  queue: [
    'invalid_configuration',
    'provider_request_failed',
    'provider_response_invalid',
    'queue_identity_invalid',
    'consumer_configuration_invalid',
    'consumer_count_invalid',
    'consumer_type_invalid',
    'consumer_queue_name_invalid',
    'consumer_script_invalid',
    'consumer_dead_letter_queue_invalid',
    'consumer_max_retries_invalid',
    'preflight_not_empty',
    'marker_not_observed',
    'marker_ambiguous',
    'marker_message_invalid',
    'cleanup_failed',
    'marker_remains_after_cleanup',
  ],
  evidence: [
    'email_not_observed',
    'email_query_failed',
    'email_invalid_configuration',
    'email_provider_graphql_error',
    'email_provider_permission_denied',
    'email_provider_query_invalid',
    'email_provider_request_failed',
    'email_provider_resource_unavailable',
    'email_provider_response_invalid',
    'email_provider_result_truncated',
    'email_provider_temporarily_unavailable',
    'database_not_observed',
    'invalid',
  ],
  report: ['invalid'],
} as const);

export const AC209_EXERCISE_STAGES = Object.freeze(
  Object.keys(AC209_EXERCISE_STAGE_CODES),
);

export type Ac209ExerciseStage = keyof typeof AC209_EXERCISE_STAGE_CODES;

/**
 * One allowlisted stage failure. The queue stage additionally accepts the
 * provider boundary and status pair that the queue exercise error already
 * carries as a closed diagnostic.
 */
export type Ac209StageDiagnostic =
  | {
      [Stage in Ac209ExerciseStage]: Readonly<{
        stage: Stage;
        code: (typeof AC209_EXERCISE_STAGE_CODES)[Stage][number];
      }>;
    }[Ac209ExerciseStage]
  | Readonly<{
      stage: 'queue';
      code: Ac209QueueDiagnosticCode;
      boundary: Ac209QueueDiagnosticBoundary;
      status: number | null;
    }>;

const STAGE_CODES_BY_NAME: Readonly<Record<string, ReadonlySet<string>>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(AC209_EXERCISE_STAGE_CODES).map(([stage, codes]) => [
        stage,
        new Set<unknown>(codes) as ReadonlySet<string>,
      ]),
    ),
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = (value: Record<string, unknown>, key: string): boolean =>
  Object.hasOwn(value, key);

/**
 * Narrows an unknown candidate to the closed vocabulary, or returns undefined.
 * A candidate that carries a provider boundary is only accepted when the
 * existing queue diagnostic parser accepts the whole boundary/status pair.
 */
export const parseAc209StageDiagnostic = (
  value: unknown,
): Ac209StageDiagnostic | undefined => {
  if (!isRecord(value)) return undefined;
  const stage = value['stage'];
  if (typeof stage !== 'string' || !hasOwn(STAGE_CODES_BY_NAME, stage))
    return undefined;
  const code = value['code'];
  const boundary = value['boundary'] ?? null;
  const status = value['status'] ?? null;
  if (hasOwn(value, 'boundary') || hasOwn(value, 'status')) {
    if (stage !== 'queue') return undefined;
    const queueDiagnostic = parseAc209QueueDiagnostic({
      boundary,
      code,
      status,
    });
    if (queueDiagnostic === undefined) return undefined;
    return Object.freeze({
      stage: 'queue',
      code: queueDiagnostic.code,
      boundary: queueDiagnostic.boundary,
      status: queueDiagnostic.status,
    });
  }
  const codes = STAGE_CODES_BY_NAME[stage];
  if (codes === undefined || typeof code !== 'string' || !codes.has(code))
    return undefined;
  return Object.freeze({ stage, code }) as Ac209StageDiagnostic;
};

/**
 * Redacted one-line diagnostic for the workflow log. Raw provider values never
 * enter the string because the vocabulary above has no free-text slot.
 */
export const formatAc209StageDiagnostic = (
  value: unknown,
): string | undefined => {
  const diagnostic = parseAc209StageDiagnostic(value);
  if (diagnostic === undefined) return undefined;
  return 'boundary' in diagnostic
    ? `AC209_DIAGNOSTIC boundary=${diagnostic.boundary} code=${diagnostic.code} status=${diagnostic.status ?? 'none'}`
    : `AC209_DIAGNOSTIC stage=${diagnostic.stage} code=${diagnostic.code}`;
};
