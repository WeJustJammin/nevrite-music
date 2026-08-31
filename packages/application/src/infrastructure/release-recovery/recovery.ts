import {
  RecoveryTargetEnvironmentSchema,
  RecoveryReadinessEvidenceSchema,
  ReleaseArtifactIdentitySchema,
  type RecoveryCheckSet,
  type RecoveryReadinessEvidence,
  type ReleaseArtifactIdentity,
} from '../../../../contracts/src/release-recovery.ts';

const CHECK_NAMES = [
  'integrity',
  'rls',
  'rpc',
  'idempotency',
  'outbox',
  'jobs',
  'objects',
  'provider',
  'public',
] as const satisfies readonly (keyof RecoveryCheckSet)[];

export type RecoveryReadinessInput = Readonly<{
  evidence: unknown;
  now: unknown;
  expectedRestoreEpoch: unknown;
  expectedArtifact: unknown;
  targetEnvironment: unknown;
}>;

export type RecoveryClosureReason =
  | 'evidence_missing'
  | 'evidence_invalid'
  | 'evidence_stale'
  | 'restore_epoch_mismatch'
  | 'pitr_unavailable'
  | 'synthetic_verification_only'
  | 'pitr_retention_insufficient'
  | 'rpo_exceeded'
  | 'rto_exceeded'
  | 'reconciliation_check_failed'
  | 'artifact_binding_mismatch'
  | 'recovery_environment_mismatch'
  | 'production_verification_required';

export type RecoveryReadinessDecision =
  | Readonly<{
      status: 'ready';
      service: 'open';
      protectedWrites: 'enabled';
      restoreEpoch: string;
      verificationKind: RecoveryReadinessEvidence['verification']['kind'];
      artifact: ReleaseArtifactIdentity;
      environment: RecoveryReadinessEvidence['environment'];
      artifactBound: true;
      checksVerified: true;
    }>
  | Readonly<{
      status: 'closed';
      service: 'closed';
      protectedWrites: 'disabled';
      reason: RecoveryClosureReason;
      failedChecks: readonly string[];
    }>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const close = (
  reason: RecoveryClosureReason,
  failedChecks: readonly string[] = [],
): RecoveryReadinessDecision => ({
  status: 'closed',
  service: 'closed',
  protectedWrites: 'disabled',
  reason,
  failedChecks,
});

const failedChecks = (
  checks: RecoveryCheckSet,
): readonly (keyof RecoveryCheckSet)[] =>
  CHECK_NAMES.filter((name) => !checks[name]);

const sameArtifact = (
  left: ReleaseArtifactIdentity,
  right: ReleaseArtifactIdentity,
): boolean =>
  left.artifactDigest === right.artifactDigest &&
  left.sourceRevision === right.sourceRevision &&
  left.buildId === right.buildId &&
  left.migrationVersion === right.migrationVersion;

/**
 * Evaluates local recovery evidence and returns the fail-closed service state.
 * It never restores data, enables writes, or contacts an external provider.
 */
export const evaluateRecoveryReadiness = (
  input: unknown,
): RecoveryReadinessDecision => {
  if (!isRecord(input)) {
    return close('evidence_invalid');
  }

  if (
    !('evidence' in input) ||
    input.evidence === undefined ||
    input.evidence === null
  ) {
    return close('evidence_missing');
  }

  const evidenceResult = RecoveryReadinessEvidenceSchema.safeParse(
    input.evidence,
  );
  if (!evidenceResult.success) {
    return close('evidence_invalid');
  }

  if (
    typeof input.now !== 'string' ||
    !Number.isFinite(Date.parse(input.now)) ||
    typeof input.expectedRestoreEpoch !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(input.expectedRestoreEpoch) ||
    !ReleaseArtifactIdentitySchema.safeParse(input.expectedArtifact).success ||
    !RecoveryTargetEnvironmentSchema.safeParse(input.targetEnvironment).success
  ) {
    return close('evidence_invalid');
  }

  const evidence = evidenceResult.data;
  const expectedArtifact = ReleaseArtifactIdentitySchema.parse(
    input.expectedArtifact,
  );
  const targetEnvironment = RecoveryTargetEnvironmentSchema.parse(
    input.targetEnvironment,
  );
  if (!sameArtifact(evidence.artifact, expectedArtifact)) {
    return close('artifact_binding_mismatch');
  }
  if (evidence.environment !== targetEnvironment) {
    return close('recovery_environment_mismatch');
  }
  const now = Date.parse(input.now);
  const capturedAt = Date.parse(evidence.capturedAt);
  const expiresAt = Date.parse(evidence.expiresAt);
  if (now < capturedAt || now >= expiresAt) {
    return close('evidence_stale');
  }

  if (!evidence.pitr.available) {
    return close('pitr_unavailable');
  }
  if (evidence.verification.kind === 'synthetic_local') {
    return close('synthetic_verification_only');
  }
  if (
    targetEnvironment === 'production' &&
    evidence.verification.kind !== 'production_verified'
  ) {
    return close('production_verification_required');
  }
  if (
    targetEnvironment === 'staging' &&
    evidence.verification.kind !== 'staging_verified'
  ) {
    return close('recovery_environment_mismatch');
  }
  if (evidence.pitr.retentionDays < 7) {
    return close('pitr_retention_insufficient');
  }
  if (evidence.measuredRpoSeconds! > 120) {
    return close('rpo_exceeded');
  }
  if (evidence.measuredRtoSeconds! > 14_400) {
    return close('rto_exceeded');
  }
  if (evidence.restoreEpoch !== input.expectedRestoreEpoch) {
    return close('restore_epoch_mismatch');
  }

  const failed = failedChecks(evidence.checks);
  if (failed.length > 0) {
    return close('reconciliation_check_failed', failed);
  }

  return {
    status: 'ready',
    service: 'open',
    protectedWrites: 'enabled',
    restoreEpoch: evidence.restoreEpoch,
    verificationKind: evidence.verification.kind,
    artifact: evidence.artifact,
    environment: evidence.environment,
    artifactBound: true,
    checksVerified: true,
  };
};
