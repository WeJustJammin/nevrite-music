import {
  ReleaseArtifactIdentitySchema,
  ReleasePromotionEvidenceSchema,
  type ReleaseArtifactIdentity,
  type ReleaseGateSet,
} from '../../../../contracts/src/release-recovery.ts';

const ENVIRONMENTS = ['preview', 'staging', 'production'] as const;
const RELEASE_GATE_NAMES = [
  'contracts',
  'tests',
  'security',
  'accessibility',
  'build',
  'migrationCompatibility',
  'registry',
  'sloRunbook',
  'infrastructure',
  'artifactIdentity',
] as const satisfies readonly (keyof ReleaseGateSet)[];

type Environment = (typeof ENVIRONMENTS)[number];

export type ReleasePromotionInput = Readonly<{
  evidence: unknown;
  previousArtifact: unknown;
  fromEnvironment: unknown;
  targetEnvironment: unknown;
  protectedApproval: unknown;
}>;

export type ReleasePromotionRejectionReason =
  | 'invalid_evidence'
  | 'invalid_environment_transition'
  | 'evidence_environment_mismatch'
  | 'invalid_approval'
  | 'protected_approval_required'
  | 'artifact_identity_mismatch'
  | 'release_gate_failed'
  | 'migration_failed_after_expansion'
  | 'destructive_rollback_forbidden';

export type ReleasePromotionDecision =
  | Readonly<{
      status: 'approved';
      artifact: ReleaseArtifactIdentity;
      fromEnvironment: Environment;
      targetEnvironment: Environment;
      sameArtifact: true;
    }>
  | Readonly<{
      status: 'rejected';
      reason: ReleasePromotionRejectionReason;
      requiresNewArtifact: boolean;
      failedGates: readonly string[];
    }>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isEnvironment = (value: unknown): value is Environment =>
  typeof value === 'string' &&
  (ENVIRONMENTS as readonly string[]).includes(value);

const reject = (
  reason: ReleasePromotionRejectionReason,
  requiresNewArtifact: boolean,
  failedGates: readonly string[] = [],
): ReleasePromotionDecision => ({
  status: 'rejected',
  reason,
  requiresNewArtifact,
  failedGates,
});

const sameArtifact = (
  left: ReleaseArtifactIdentity,
  right: ReleaseArtifactIdentity,
): boolean =>
  left.artifactDigest === right.artifactDigest &&
  left.sourceRevision === right.sourceRevision &&
  left.buildId === right.buildId &&
  left.migrationVersion === right.migrationVersion;

const failedGates = (
  gates: ReleaseGateSet,
): readonly (keyof ReleaseGateSet)[] =>
  RELEASE_GATE_NAMES.filter((name) => !gates[name]);

/**
 * Decides whether one immutable, verified artifact may move between adjacent
 * environments. This function only evaluates evidence; it performs no
 * deployment or provider operation.
 */
export const evaluateReleasePromotion = (
  input: unknown,
): ReleasePromotionDecision => {
  if (!isRecord(input)) {
    return reject('invalid_evidence', true);
  }

  const evidenceResult = ReleasePromotionEvidenceSchema.safeParse(
    input.evidence,
  );
  const previousArtifactResult = ReleaseArtifactIdentitySchema.safeParse(
    input.previousArtifact,
  );
  if (!evidenceResult.success || !previousArtifactResult.success) {
    return reject('invalid_evidence', true);
  }

  const evidence = evidenceResult.data;
  const previousArtifact = previousArtifactResult.data;
  if (
    !isEnvironment(input.fromEnvironment) ||
    !isEnvironment(input.targetEnvironment) ||
    !(
      (input.fromEnvironment === 'preview' &&
        input.targetEnvironment === 'staging') ||
      (input.fromEnvironment === 'staging' &&
        input.targetEnvironment === 'production')
    )
  ) {
    return reject('invalid_environment_transition', true);
  }

  const fromEnvironment = input.fromEnvironment;
  const targetEnvironment = input.targetEnvironment;
  if (evidence.environment !== targetEnvironment) {
    return reject('evidence_environment_mismatch', true);
  }

  if (typeof input.protectedApproval !== 'boolean') {
    return reject('invalid_approval', false);
  }

  if (!sameArtifact(evidence.artifact, previousArtifact)) {
    return reject('artifact_identity_mismatch', true);
  }

  if (evidence.migration.destructiveRollbackAttempted) {
    return reject('destructive_rollback_forbidden', true);
  }
  if (!evidence.migration.forwardFixOnly) {
    return reject('destructive_rollback_forbidden', true);
  }
  if (evidence.migration.state === 'failed_after_expansion') {
    return reject('migration_failed_after_expansion', true);
  }

  const failed = failedGates(evidence.gates);
  if (failed.length > 0) {
    return reject('release_gate_failed', true, failed);
  }

  if (targetEnvironment === 'production' && !input.protectedApproval) {
    return reject('protected_approval_required', false);
  }

  return {
    status: 'approved',
    artifact: evidence.artifact,
    fromEnvironment,
    targetEnvironment,
    sameArtifact: true,
  };
};
