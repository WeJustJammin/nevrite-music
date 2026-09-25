import { Ac209AlertConfigurationReportSchema } from './ac209-alert-configuration-contract.ts';
import {
  Ac209ProductionExerciseFailureReceiptSchema,
  type Ac209ProductionExerciseFailureReceipt,
} from './ac209-production-exercise-failure-contract.ts';
import { parseAc209StageDiagnostic } from './ac209-exercise-stage-diagnostic.ts';

export {
  Ac209ProductionExerciseFailureReceiptSchema,
  type Ac209ProductionExerciseFailureReceipt,
} from './ac209-production-exercise-failure-contract.ts';

/**
 * Cleanup disposition for a failed exercise.
 *
 * `not_required` — the exercise never recorded `cleanup_required`, so no queue
 * mutation started. `verified` — the exact-marker cleanup step proved marker
 * absence. `unverified` — cleanup was required but this process has no proof
 * that it completed, so a reviewer must treat the marker as possibly resident.
 */
export type Ac209FailureCleanupState =
  'not_required' | 'verified' | 'unverified';

export type Ac209ProductionExerciseFailureReceiptInput = Readonly<{
  sourceRevision: string;
  productionVersionId: string | null;
  recipientConfiguration: unknown;
  diagnostic: unknown;
  cleanupRequired: boolean;
  cleanup: Ac209FailureCleanupState;
  capturedAt: string;
}>;

const fail = (): never => {
  throw new Error('AC209 production exercise failure receipt invalid');
};

const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;

/**
 * Derives the two identities worth retaining on a failure: the exact source
 * revision and the already-redacted alert recipient digest. Both are read from
 * the configuration artifact, and neither can carry an address, token, marker,
 * subject, or provider message identifier.
 */
const readRecipientIdentity = (
  configuration: unknown,
):
  Readonly<{ sourceRevision: string; recipientDigest: string }> | undefined => {
  const parsed = Ac209AlertConfigurationReportSchema.safeParse(configuration);
  if (!parsed.success) return undefined;
  return Object.freeze({
    sourceRevision: parsed.data.sourceRevision,
    recipientDigest: parsed.data.verifiedSettings.alertEmailSha256,
  });
};

/**
 * Binds the receipt to at most one source revision.
 *
 * A declared revision contradicting the verified configuration means the run
 * cannot be attributed to a single revision, so the receipt records no revision
 * rather than picking a side. An identity that cannot be verified is nulled
 * instead of failing: refusing to retain the artifact is the failure mode this
 * receipt exists to remove.
 */
const bindSourceRevision = (
  identity: Readonly<{ sourceRevision: string }> | undefined,
  declaredRevision: string,
): string | null => {
  if (identity === undefined) return null;
  if (
    SOURCE_REVISION.test(declaredRevision) &&
    declaredRevision !== identity.sourceRevision
  )
    return null;
  return identity.sourceRevision;
};

const bindProductionVersionId = (declared: string | null): string | null =>
  declared !== null && SAFE_ID.test(declared) ? declared : null;

/**
 * Resolves the single capture timestamp. An unreadable clock yields no receipt
 * rather than a misleading capture time.
 */
export const resolveAc209FailureCapturedAt = (
  now: () => number,
): string | undefined => {
  try {
    const milliseconds = now();
    return Number.isFinite(milliseconds)
      ? new Date(milliseconds).toISOString()
      : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Builds the retained failure receipt.
 *
 * This is deliberately a pure, total function over closed vocabulary: every
 * field that reaches the artifact is either an allowlisted code, a boolean, a
 * bounded integer, a SHA-256 digest, or a validated timestamp. A failure to
 * build is a hard error so the caller can keep the exercise fail-closed while
 * still reporting the original diagnostic.
 */
export const buildAc209ProductionExerciseFailureReceipt = (
  input: Ac209ProductionExerciseFailureReceiptInput,
): Ac209ProductionExerciseFailureReceipt => {
  const diagnostic = parseAc209StageDiagnostic(input.diagnostic);
  if (diagnostic === undefined) fail();
  const identity = readRecipientIdentity(input.recipientConfiguration);
  const withBoundary = 'boundary' in diagnostic;
  const receipt = {
    schemaVersion: 'ac209-production-exercise-failure-v1',
    status: 'unsuccessful',
    outcome: 'no_acceptance',
    environment: 'production',
    sourceRevision: bindSourceRevision(identity, input.sourceRevision),
    productionVersionId: bindProductionVersionId(input.productionVersionId),
    stage: diagnostic.stage,
    code: diagnostic.code,
    boundary: withBoundary ? diagnostic.boundary : null,
    providerStatus: withBoundary ? diagnostic.status : null,
    cleanupRequired: input.cleanupRequired,
    cleanup: input.cleanup,
    recipientDigest: identity?.recipientDigest ?? null,
    capturedAt: input.capturedAt,
  };
  const parsed = Ac209ProductionExerciseFailureReceiptSchema.safeParse(receipt);
  if (!parsed.success) fail();
  return parsed.data;
};
