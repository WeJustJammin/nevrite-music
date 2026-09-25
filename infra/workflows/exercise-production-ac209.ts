import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readAc209ExerciseEligibility,
  verifyAc209AlertDelivery,
  type Ac209DeliveryVerification,
} from './ac209-delivery-verification.ts';
import {
  formatAc209StageDiagnostic,
  type Ac209StageDiagnostic,
} from './ac209-exercise-stage-diagnostic.ts';
import {
  buildAc209ProductionExerciseFailureReceipt,
  resolveAc209FailureCapturedAt,
  type Ac209FailureCleanupState,
} from './ac209-production-exercise-failure-receipt.ts';
import type { Ac209ProductionExerciseFailureReceipt } from './ac209-production-exercise-failure-contract.ts';
import {
  Ac209EmailSendingAnalyticsError,
  collectAc209EmailSendingAnalytics,
  verifyAc209EmailSendingCapability,
  type Ac209EmailSendingAnalyticsErrorCode,
  type Ac209EmailSendingAnalyticsReport,
} from './ac209-email-sending-analytics.ts';
import {
  Ac209ProductionExerciseReportSchema,
  type Ac209ProductionExerciseReport,
} from './ac209-production-exercise-contract.ts';
import {
  AC209_DEFAULT_EVIDENCE_POLLS,
  AC209_DEFAULT_EVIDENCE_POLL_MS,
  failAc209ProductionExercise,
  validateAc209ProductionExerciseInput,
  type Ac209ProductionExerciseInput,
} from './ac209-production-exercise-input.ts';
import {
  Ac209QueueExerciseError,
  parseAc209QueueDiagnostic,
  runAc209QueueExercise,
  type Ac209QueueExerciseInput,
  type Ac209QueueExerciseReport,
} from './ac209-queue-exercise.ts';
import { writeProviderReleaseEvidenceFile } from './provider-release-evidence-files.ts';

const SAFE_ARTIFACT_PATH = /^[A-Za-z0-9._/-]{1,256}$/u;
const MAX_CONFIGURATION_BYTES = 256 * 1024;

export { Ac209ProductionExerciseReportSchema } from './ac209-production-exercise-contract.ts';
export type { Ac209ProductionExerciseReport } from './ac209-production-exercise-contract.ts';
export type { Ac209ProductionExerciseInput } from './ac209-production-exercise-input.ts';
export { formatAc209StageDiagnostic } from './ac209-exercise-stage-diagnostic.ts';

type Ac209EmailDiagnosticCode =
  | 'email_not_observed'
  | 'email_query_failed'
  | 'email_invalid_configuration'
  | 'email_provider_graphql_error'
  | 'email_provider_permission_denied'
  | 'email_provider_query_invalid'
  | 'email_provider_request_failed'
  | 'email_provider_resource_unavailable'
  | 'email_provider_response_invalid'
  | 'email_provider_result_truncated'
  | 'email_provider_temporarily_unavailable';

const AC209_EMAIL_DIAGNOSTIC_CODES = Object.freeze({
  event_not_unique: 'email_not_observed',
  invalid_configuration: 'email_invalid_configuration',
  provider_graphql_error: 'email_provider_graphql_error',
  provider_permission_denied: 'email_provider_permission_denied',
  provider_query_invalid: 'email_provider_query_invalid',
  provider_request_failed: 'email_provider_request_failed',
  provider_resource_unavailable: 'email_provider_resource_unavailable',
  provider_response_invalid: 'email_provider_response_invalid',
  provider_result_truncated: 'email_provider_result_truncated',
  provider_temporarily_unavailable: 'email_provider_temporarily_unavailable',
  unexpected_failure: 'email_query_failed',
} satisfies Record<
  Ac209EmailSendingAnalyticsErrorCode,
  Ac209EmailDiagnosticCode
>);

const resolveAc209EmailDiagnosticCode = (
  error: unknown,
): Ac209EmailDiagnosticCode =>
  error instanceof Ac209EmailSendingAnalyticsError
    ? AC209_EMAIL_DIAGNOSTIC_CODES[error.code]
    : 'email_query_failed';

export const formatAc209QueueDiagnostic = (
  value: unknown,
): string | undefined => {
  const diagnostic = parseAc209QueueDiagnostic(value);
  if (diagnostic === undefined) return undefined;
  return `AC209_DIAGNOSTIC boundary=${diagnostic.boundary} code=${diagnostic.code} status=${diagnostic.status ?? 'none'}`;
};

/**
 * Selects the closed diagnostic that best explains this failure.
 *
 * A queue error that carries a provider boundary reports that boundary, because
 * the boundary and status are what a reviewer needs first. Any other queue
 * error reports its own stage code. Every other failure reports the stage that
 * was in flight when it was thrown.
 */
const failureDiagnostic = (
  error: unknown,
  stageDiagnostic: Ac209StageDiagnostic,
): unknown => {
  if (!(error instanceof Ac209QueueExerciseError)) return stageDiagnostic;
  const queueDiagnostic = parseAc209QueueDiagnostic(error.diagnostic);
  if (queueDiagnostic !== undefined)
    return {
      stage: 'queue',
      code: queueDiagnostic.code,
      boundary: queueDiagnostic.boundary,
      status: queueDiagnostic.status,
    };
  if (stageDiagnostic.stage === 'evidence') return stageDiagnostic;
  return { stage: 'queue', code: error.code };
};

export type Ac209ProductionExerciseDependencies = Readonly<{
  queueExercise?: (
    input: Ac209QueueExerciseInput,
  ) => Promise<Ac209QueueExerciseReport>;
  readEligibility?: typeof readAc209ExerciseEligibility;
  verifyEmailCapability?: typeof verifyAc209EmailSendingCapability;
  collectEmailAnalytics?: typeof collectAc209EmailSendingAnalytics;
  verifyDelivery?: typeof verifyAc209AlertDelivery;
  beforeQueueAccess?: () => void;
  captureFailureReceipt?: (
    receipt: Ac209ProductionExerciseFailureReceipt,
  ) => void;
  now?: () => number;
  reportQueueDiagnostic?: (diagnostic: string) => void;
  sleep?: (milliseconds: number) => Promise<void>;
}>;

export const exerciseProductionAc209 = async (
  input: Ac209ProductionExerciseInput,
  dependencies: Ac209ProductionExerciseDependencies = {},
): Promise<Ac209ProductionExerciseReport> => {
  let stageDiagnostic: Ac209StageDiagnostic = {
    stage: 'configuration',
    code: 'invalid_configuration',
  };
  let cleanupRequired = false;
  let cleanup: Ac209FailureCleanupState = 'not_required';
  try {
    const configuration = validateAc209ProductionExerciseInput(input);
    const now = dependencies.now ?? Date.now;
    const sleep =
      dependencies.sleep ??
      ((milliseconds: number) =>
        new Promise<void>((resolvePromise) =>
          setTimeout(resolvePromise, milliseconds),
        ));
    const startedAtMs = now();
    if (!Number.isFinite(startedAtMs)) failAc209ProductionExercise();
    const startedAt = new Date(startedAtMs).toISOString();
    const readEligibility =
      dependencies.readEligibility ?? readAc209ExerciseEligibility;
    stageDiagnostic = { stage: 'eligibility', code: 'request_failed' };
    const eligibility = await readEligibility({
      supabaseUrl: input.supabaseUrl,
      serviceKey: input.supabaseServiceKey,
      checkedAt: startedAt,
    });
    if (!eligibility.eligible) {
      stageDiagnostic = { stage: 'eligibility', code: 'blocked' };
      failAc209ProductionExercise();
    }

    const verifyEmailCapability =
      dependencies.verifyEmailCapability ?? verifyAc209EmailSendingCapability;
    stageDiagnostic = { stage: 'evidence', code: 'email_query_failed' };
    try {
      await verifyEmailCapability({
        zoneId: input.emailZoneId,
        token: input.emailAnalyticsToken,
      });
    } catch (error: unknown) {
      stageDiagnostic = {
        stage: 'evidence',
        code: resolveAc209EmailDiagnosticCode(error),
      };
      failAc209ProductionExercise();
    }

    let email: Ac209EmailSendingAnalyticsReport | undefined;
    let database: Ac209DeliveryVerification | undefined;
    let emailDiagnosticCode: Ac209EmailDiagnosticCode = 'email_not_observed';
    const collectEmail =
      dependencies.collectEmailAnalytics ?? collectAc209EmailSendingAnalytics;
    const verifyDelivery =
      dependencies.verifyDelivery ?? verifyAc209AlertDelivery;
    const maxPolls = input.evidenceMaxPolls ?? AC209_DEFAULT_EVIDENCE_POLLS;
    const pollInterval =
      input.evidencePollIntervalMs ?? AC209_DEFAULT_EVIDENCE_POLL_MS;
    const queueExercise = dependencies.queueExercise ?? runAc209QueueExercise;
    stageDiagnostic = { stage: 'queue', code: 'provider_request_failed' };
    dependencies.beforeQueueAccess?.();
    cleanupRequired = true;
    cleanup = 'unverified';
    const queue = await queueExercise({
      accountId: input.accountId,
      providerToken: input.queueToken,
      sourceQueueName: 'platform-jobs',
      deadLetterQueueName: 'platform-jobs-dlq',
      expectedSourceQueueId: input.expectedSourceQueueId,
      expectedDeadLetterQueueId: input.expectedDeadLetterQueueId,
      markerUuid: input.exerciseMarker,
      expectedConsumer: {
        scriptName: 'wejammin-api',
        maxRetries: 3,
        deadLetterQueueName: 'platform-jobs-dlq',
      },
      now,
      sleep,
      whileDlqMessagePresent: async () => {
        stageDiagnostic = { stage: 'evidence', code: 'email_not_observed' };
        for (let poll = 0; poll < maxPolls; poll += 1) {
          const observedAt = new Date(now()).toISOString();
          try {
            email = await collectEmail({
              zoneId: input.emailZoneId,
              token: input.emailAnalyticsToken,
              sourceRevision: input.sourceRevision,
              start: startedAt,
              end: observedAt,
              expectedSenderSha256: input.expectedSenderSha256,
              expectedRecipientSha256: input.expectedRecipientSha256,
              expectedSubject: '[WeJammin] dlq_nonempty',
              expectedMessageId: undefined,
            });
          } catch (error: unknown) {
            email = undefined;
            emailDiagnosticCode = resolveAc209EmailDiagnosticCode(error);
          }
          if (email !== undefined) {
            stageDiagnostic = {
              stage: 'evidence',
              code: 'database_not_observed',
            };
            try {
              database = await verifyDelivery({
                notBefore: startedAt,
                supabaseUrl: input.supabaseUrl,
                serviceKey: input.supabaseServiceKey,
                sourceRevision: input.sourceRevision,
                providerMessageId: email.event.messageId,
              });
            } catch {
              database = undefined;
            }
          } else {
            stageDiagnostic = {
              stage: 'evidence',
              code: emailDiagnosticCode,
            };
          }
          if (email !== undefined && database !== undefined) {
            stageDiagnostic = { stage: 'queue', code: 'cleanup_failed' };
            return;
          }
          if (poll + 1 < maxPolls) await sleep(pollInterval);
        }
        failAc209ProductionExercise();
      },
    });
    stageDiagnostic = {
      stage: 'evidence',
      code: email === undefined ? emailDiagnosticCode : 'database_not_observed',
    };
    if (email === undefined || database === undefined)
      failAc209ProductionExercise();
    stageDiagnostic = { stage: 'evidence', code: 'invalid' };
    if (
      Date.parse(database.claimedAt) < startedAtMs ||
      Date.parse(database.deliveredAt) < startedAtMs
    )
      failAc209ProductionExercise();
    stageDiagnostic = { stage: 'report', code: 'invalid' };
    const completedAt = new Date(now()).toISOString();
    const report = {
      schemaVersion: 'ac209-production-exercise-v1',
      sourceRevision: input.sourceRevision,
      productionVersionId: input.productionVersionId,
      environment: 'production',
      configuration: {
        configurationId: configuration.configurationId,
        configurationReference: configuration.configurationReference,
        deploymentId: configuration.worker.deploymentId,
        versionId: configuration.worker.versionId,
        capturedAt: configuration.capturedAt,
      },
      timing: { startedAt, completedAt },
      queue,
      email,
      database,
      mailboxReceipt: { status: 'pending_manual_verification' },
    };
    const parsed = Ac209ProductionExerciseReportSchema.safeParse(report);
    if (!parsed.success) failAc209ProductionExercise();
    return parsed.data;
  } catch (error: unknown) {
    const queueDiagnostic =
      error instanceof Ac209QueueExerciseError
        ? formatAc209QueueDiagnostic(error.diagnostic)
        : undefined;
    const diagnostic =
      queueDiagnostic ??
      (error instanceof Ac209QueueExerciseError &&
      stageDiagnostic.stage !== 'evidence'
        ? formatAc209StageDiagnostic({ stage: 'queue', code: error.code })
        : formatAc209StageDiagnostic(stageDiagnostic));
    if (
      diagnostic !== undefined &&
      dependencies.reportQueueDiagnostic !== undefined
    ) {
      try {
        dependencies.reportQueueDiagnostic(diagnostic);
      } catch {
        // Diagnostic reporting must not alter the fail-closed exercise result.
      }
    }
    const capturedAt = resolveAc209FailureCapturedAt(
      dependencies.now ?? Date.now,
    );
    if (
      dependencies.captureFailureReceipt !== undefined &&
      capturedAt !== undefined
    ) {
      try {
        dependencies.captureFailureReceipt(
          buildAc209ProductionExerciseFailureReceipt({
            sourceRevision: input.sourceRevision,
            productionVersionId: input.productionVersionId || null,
            recipientConfiguration: input.configuration,
            diagnostic: failureDiagnostic(error, stageDiagnostic),
            cleanupRequired,
            cleanup,
            capturedAt,
          }),
        );
      } catch {
        // Retention must never replace the fail-closed exercise result.
      }
    }
    if (
      error instanceof Error &&
      error.message === 'AC209 production exercise failed'
    )
      throw error;
    failAc209ProductionExercise();
  }
};

type Ac209OutputWriter = (
  path: string,
  value: string,
  encoding: 'utf8',
) => void;

export const writeAc209CleanupRequiredOutput = (
  outputPath: string | undefined,
  writeOutput: Ac209OutputWriter = appendFileSync,
): void => {
  if (outputPath === undefined || outputPath.length === 0)
    failAc209ProductionExercise();
  writeOutput(outputPath, 'cleanup_required=true\n', 'utf8');
};

const resolveArtifact = (
  workspaceRoot: string,
  artifactPath: string,
): string => {
  if (
    !SAFE_ARTIFACT_PATH.test(artifactPath) ||
    artifactPath.includes('..') ||
    artifactPath.startsWith('/')
  )
    failAc209ProductionExercise();
  const output = resolve(workspaceRoot, artifactPath);
  if (!output.startsWith(`${resolve(workspaceRoot)}${sep}`))
    failAc209ProductionExercise();
  return output;
};

const readConfiguration = (path: string): unknown => {
  try {
    if (statSync(path).size > MAX_CONFIGURATION_BYTES)
      failAc209ProductionExercise();
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === 'AC209 production exercise failed'
    )
      throw error;
    failAc209ProductionExercise();
  }
};

const run = async (): Promise<void> => {
  const workspaceRoot = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
  const configurationPath = resolveArtifact(
    workspaceRoot,
    process.env['AC209_OUTPUT_PATH'] ?? 'ac209-exercise/configuration.json',
  );
  const artifactPath =
    process.env['AC209_EXERCISE_OUTPUT_PATH'] ?? 'ac209-exercise/exercise.json';
  const outputPath = resolveArtifact(workspaceRoot, artifactPath);
  const failurePath = resolveArtifact(
    workspaceRoot,
    process.env['AC209_EXERCISE_FAILURE_OUTPUT_PATH'] ??
      'ac209-exercise/exercise-failure.json',
  );
  if (existsSync(outputPath)) failAc209ProductionExercise();
  const report = await exerciseProductionAc209(
    {
      accountId: process.env['CLOUDFLARE_ACCOUNT_ID'] ?? '',
      queueToken: process.env['CLOUDFLARE_QUEUE_EXERCISE_TOKEN'] ?? '',
      emailAnalyticsToken:
        process.env['CLOUDFLARE_EMAIL_ANALYTICS_API_TOKEN'] ?? '',
      emailZoneId: process.env['CLOUDFLARE_EMAIL_ZONE_ID'] ?? '',
      sourceRevision: process.env['SOURCE_REVISION'] ?? '',
      productionVersionId: process.env['PRODUCTION_VERSION_ID'] ?? '',
      exerciseMarker: process.env['AC209_EXERCISE_MARKER'] ?? '',
      expectedSourceQueueId: process.env['CLOUDFLARE_PLATFORM_QUEUE_ID'] ?? '',
      expectedDeadLetterQueueId: process.env['EXPECTED_DLQ_ID'] ?? '',
      expectedSenderSha256: process.env['EXPECTED_ALERT_SENDER_SHA256'] ?? '',
      expectedRecipientSha256: process.env['EXPECTED_ALERT_EMAIL_SHA256'] ?? '',
      supabaseUrl: process.env['SUPABASE_URL'] ?? '',
      supabaseServiceKey: process.env['SUPABASE_SECRET_KEY'] ?? '',
      configuration: readConfiguration(configurationPath),
      execution: {
        environment: process.env['GITHUB_ENVIRONMENT'] ?? '',
        ref: process.env['GITHUB_REF'] ?? '',
        checkedOutSha: process.env['CHECKED_OUT_SHA'] ?? '',
      },
    },
    {
      beforeQueueAccess: () =>
        writeAc209CleanupRequiredOutput(process.env['GITHUB_OUTPUT']),
      reportQueueDiagnostic: (diagnostic: string) =>
        console.error(`::error::${diagnostic}`),
      captureFailureReceipt: (receipt) => {
        const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
        writeProviderReleaseEvidenceFile(
          serialized,
          failurePath,
          workspaceRoot,
        );
        const sha256 = createHash('sha256').update(serialized).digest('hex');
        console.error(
          `AC209_EXERCISE_FAILURE_RECEIPT status=unsuccessful stage=${receipt.stage} code=${receipt.code} cleanup=${receipt.cleanup} sha256=${sha256}`,
        );
      },
    },
  );
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  writeProviderReleaseEvidenceFile(serialized, outputPath, workspaceRoot);
  const sha256 = createHash('sha256').update(serialized).digest('hex');
  console.log(
    `AC209 redacted production exercise captured (${relative(workspaceRoot, outputPath)}; sha256=${sha256}).`,
  );
};

const entrypoint = process.argv[1];
if (entrypoint && resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  run().catch(() => {
    console.error('::error::AC209 production exercise failed');
    process.exitCode = 1;
  });
}
