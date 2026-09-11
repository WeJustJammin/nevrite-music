import {
  Ac209AlertConfigurationReportSchema,
  type Ac209AlertConfigurationReport,
} from './ac209-alert-configuration-contract.ts';

const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const PROVIDER_ID = /^[0-9a-f]{32}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const EXERCISE_MARKER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export const AC209_DEFAULT_EVIDENCE_POLLS = 90;
export const AC209_DEFAULT_EVIDENCE_POLL_MS = 10_000;

export type Ac209ProductionExerciseInput = Readonly<{
  accountId: string;
  queueToken: string;
  emailAnalyticsToken: string;
  emailZoneId: string;
  sourceRevision: string;
  productionVersionId: string;
  exerciseMarker: string;
  expectedSourceQueueId: string;
  expectedDeadLetterQueueId: string;
  expectedSenderSha256: string;
  expectedRecipientSha256: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  configuration: unknown;
  execution: Readonly<{
    environment: string;
    ref: string;
    checkedOutSha: string;
  }>;
  evidenceMaxPolls?: number;
  evidencePollIntervalMs?: number;
}>;

export const failAc209ProductionExercise = (): never => {
  throw new Error('AC209 production exercise failed');
};

const assertSecret = (value: string): void => {
  if (value.length < 20 || /\s/u.test(value)) failAc209ProductionExercise();
};

export const validateAc209ProductionExerciseInput = (
  input: Ac209ProductionExerciseInput,
): Ac209AlertConfigurationReport => {
  if (
    !PROVIDER_ID.test(input.accountId) ||
    !PROVIDER_ID.test(input.emailZoneId) ||
    !PROVIDER_ID.test(input.expectedSourceQueueId) ||
    !PROVIDER_ID.test(input.expectedDeadLetterQueueId) ||
    !SOURCE_REVISION.test(input.sourceRevision) ||
    !SAFE_ID.test(input.productionVersionId) ||
    !EXERCISE_MARKER.test(input.exerciseMarker) ||
    !SHA256.test(input.expectedSenderSha256) ||
    !SHA256.test(input.expectedRecipientSha256) ||
    input.execution.environment !== 'production' ||
    input.execution.ref !== 'refs/heads/main' ||
    input.execution.checkedOutSha !== input.sourceRevision
  )
    failAc209ProductionExercise();
  assertSecret(input.queueToken);
  assertSecret(input.emailAnalyticsToken);
  assertSecret(input.supabaseServiceKey);
  const polls = input.evidenceMaxPolls ?? AC209_DEFAULT_EVIDENCE_POLLS;
  const interval =
    input.evidencePollIntervalMs ?? AC209_DEFAULT_EVIDENCE_POLL_MS;
  if (
    !Number.isSafeInteger(polls) ||
    polls < 1 ||
    polls > AC209_DEFAULT_EVIDENCE_POLLS ||
    !Number.isSafeInteger(interval) ||
    interval < 1_000 ||
    interval > 30_000
  )
    failAc209ProductionExercise();

  const parsed = Ac209AlertConfigurationReportSchema.safeParse(
    input.configuration,
  );
  if (!parsed.success) failAc209ProductionExercise();
  const report = parsed.data;
  if (
    report.sourceRevision !== input.sourceRevision ||
    report.worker.sourceRevision !== input.sourceRevision ||
    report.worker.versionTag !== input.sourceRevision ||
    report.worker.versionId !== input.productionVersionId ||
    report.verifiedSettings.versionId !== input.productionVersionId ||
    report.verifiedSettings.appRelease !== input.sourceRevision ||
    report.verifiedSettings.cloudflareAccountId !== input.accountId ||
    report.verifiedSettings.dlqId !== input.expectedDeadLetterQueueId ||
    report.verifiedSettings.supabaseUrl !== input.supabaseUrl ||
    report.verifiedSettings.alertEmailSha256 !==
      input.expectedRecipientSha256 ||
    report.verifiedSettings.queueName !== 'platform-jobs'
  )
    failAc209ProductionExercise();
  return report;
};
