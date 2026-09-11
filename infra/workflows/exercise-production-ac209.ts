import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readAc209ExerciseEligibility,
  verifyAc209AlertDelivery,
  type Ac209DeliveryVerification,
} from './ac209-delivery-verification.ts';
import {
  collectAc209EmailSendingAnalytics,
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

export const formatAc209QueueDiagnostic = (
  value: unknown,
): string | undefined => {
  const diagnostic = parseAc209QueueDiagnostic(value);
  if (diagnostic === undefined) return undefined;
  return `AC209_DIAGNOSTIC boundary=${diagnostic.boundary} code=${diagnostic.code} status=${diagnostic.status ?? 'none'}`;
};

export type Ac209ProductionExerciseDependencies = Readonly<{
  queueExercise?: (
    input: Ac209QueueExerciseInput,
  ) => Promise<Ac209QueueExerciseReport>;
  readEligibility?: typeof readAc209ExerciseEligibility;
  collectEmailAnalytics?: typeof collectAc209EmailSendingAnalytics;
  verifyDelivery?: typeof verifyAc209AlertDelivery;
  now?: () => number;
  reportQueueDiagnostic?: (diagnostic: string) => void;
  sleep?: (milliseconds: number) => Promise<void>;
}>;

export const exerciseProductionAc209 = async (
  input: Ac209ProductionExerciseInput,
  dependencies: Ac209ProductionExerciseDependencies = {},
): Promise<Ac209ProductionExerciseReport> => {
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
    const eligibility = await readEligibility({
      supabaseUrl: input.supabaseUrl,
      serviceKey: input.supabaseServiceKey,
      checkedAt: startedAt,
    });
    if (!eligibility.eligible) failAc209ProductionExercise();

    let email: Ac209EmailSendingAnalyticsReport | undefined;
    let database: Ac209DeliveryVerification | undefined;
    const collectEmail =
      dependencies.collectEmailAnalytics ?? collectAc209EmailSendingAnalytics;
    const verifyDelivery =
      dependencies.verifyDelivery ?? verifyAc209AlertDelivery;
    const maxPolls = input.evidenceMaxPolls ?? AC209_DEFAULT_EVIDENCE_POLLS;
    const pollInterval =
      input.evidencePollIntervalMs ?? AC209_DEFAULT_EVIDENCE_POLL_MS;
    const queueExercise = dependencies.queueExercise ?? runAc209QueueExercise;
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
          } catch {
            email = undefined;
          }
          if (email !== undefined) {
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
          }
          if (email !== undefined && database !== undefined) return;
          if (poll + 1 < maxPolls) await sleep(pollInterval);
        }
        failAc209ProductionExercise();
      },
    });
    if (email === undefined || database === undefined)
      failAc209ProductionExercise();
    if (
      Date.parse(database.claimedAt) < startedAtMs ||
      Date.parse(database.deliveredAt) < startedAtMs
    )
      failAc209ProductionExercise();
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
    const diagnostic =
      error instanceof Ac209QueueExerciseError
        ? formatAc209QueueDiagnostic(error.diagnostic)
        : undefined;
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
    if (
      error instanceof Error &&
      error.message === 'AC209 production exercise failed'
    )
      throw error;
    failAc209ProductionExercise();
  }
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
      reportQueueDiagnostic: (diagnostic: string) =>
        console.error(`::error::${diagnostic}`),
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
