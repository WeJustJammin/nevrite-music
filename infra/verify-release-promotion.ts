import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  evaluateReleasePromotion,
  type ReleasePromotionDecision,
} from '../packages/application/src/infrastructure/release-recovery/promotion.ts';
import {
  ReleaseArtifactIdentitySchema,
  ReleasePromotionEvidenceSchema,
  type ReleaseArtifactIdentity,
  type ReleasePromotionEvidence,
} from '../packages/contracts/src/release-artifact.ts';
import { verifyPerformanceEvidence } from './workflows/verify-performance-evidence.ts';

export const verifyStagingCandidateMetadata = (
  metadata: unknown,
  expectedArtifact: unknown,
): ReleasePromotionEvidence => {
  if (expectedArtifact === undefined) {
    throw new Error('An independent candidate artifact identity is required.');
  }
  const parsedExpectedArtifact =
    ReleaseArtifactIdentitySchema.safeParse(expectedArtifact);
  if (!parsedExpectedArtifact.success) {
    throw new Error('Independent candidate artifact identity is invalid.');
  }
  const parsed = ReleasePromotionEvidenceSchema.safeParse(metadata);
  if (!parsed.success) {
    throw new Error('Staging candidate evidence is invalid.');
  }
  const evidence = parsed.data;
  if (
    evidence.environment !== 'production' ||
    evidence.migration.state !== 'not_started' ||
    !evidence.migration.forwardFixOnly ||
    evidence.migration.destructiveRollbackAttempted ||
    Object.values(evidence.gates).some((gate) => !gate)
  ) {
    throw new Error('Staging candidate evidence is incomplete.');
  }
  verifyPerformanceEvidence(
    evidence.performance,
    evidence.artifact.sourceRevision,
  );
  if (!sameArtifactIdentity(evidence.artifact, parsedExpectedArtifact.data)) {
    throw new Error(
      'Staging candidate artifact identity does not match the independently derived identity.',
    );
  }
  return evidence;
};

const sameArtifactIdentity = (
  left: ReleaseArtifactIdentity,
  right: ReleaseArtifactIdentity,
): boolean =>
  left.artifactDigest === right.artifactDigest &&
  left.sourceRevision === right.sourceRevision &&
  left.buildId === right.buildId &&
  left.migrationVersion === right.migrationVersion;

export const verifyReleasePromotionMetadata = (
  metadata: unknown,
  options?: Readonly<{
    previousArtifact?: unknown;
    protectedEnvironment?: unknown;
  }>,
): ReleasePromotionDecision => {
  const protectedApproval = options?.protectedEnvironment === 'production';
  if (!protectedApproval) {
    throw new Error('A protected production environment is required.');
  }
  if (options?.previousArtifact === undefined) {
    throw new Error('An independent prior artifact identity is required.');
  }
  const parsedEvidence = ReleasePromotionEvidenceSchema.safeParse(metadata);
  if (!parsedEvidence.success) {
    throw new Error('Production promotion evidence is invalid.');
  }
  verifyPerformanceEvidence(
    parsedEvidence.data.performance,
    parsedEvidence.data.artifact.sourceRevision,
  );
  const decision = evaluateReleasePromotion({
    evidence: parsedEvidence.data,
    previousArtifact: options.previousArtifact,
    fromEnvironment: 'staging',
    targetEnvironment: 'production',
    protectedApproval,
  });
  if (decision.status !== 'approved') {
    throw new Error(`Release promotion rejected: ${decision.reason}`);
  }
  const migrationState =
    typeof metadata === 'object' &&
    metadata !== null &&
    'migration' in metadata &&
    typeof metadata.migration === 'object' &&
    metadata.migration !== null &&
    'state' in metadata.migration
      ? metadata.migration.state
      : null;
  if (migrationState !== 'expanded' && migrationState !== 'switched') {
    throw new Error('Verified production migration evidence is required.');
  }
  return decision;
};

const run = (
  metadataPath: string | undefined,
  mode: string | undefined,
  previousArtifactPath: string | undefined,
): void => {
  if (!metadataPath) {
    throw new Error('Promotion metadata path is required.');
  }
  const metadata: unknown = JSON.parse(readFileSync(metadataPath, 'utf8'));
  if (mode === 'candidate') {
    if (!previousArtifactPath) {
      throw new Error('Candidate artifact identity path is required.');
    }
    const expectedArtifact: unknown = JSON.parse(
      readFileSync(previousArtifactPath, 'utf8'),
    );
    verifyStagingCandidateMetadata(metadata, expectedArtifact);
    return;
  }
  if (mode !== 'production') {
    throw new Error('Promotion verification mode is required.');
  }
  if (!previousArtifactPath) {
    throw new Error('Production artifact identity path is required.');
  }
  const previousArtifact: unknown = JSON.parse(
    readFileSync(previousArtifactPath, 'utf8'),
  );
  verifyReleasePromotionMetadata(metadata, {
    previousArtifact,
    protectedEnvironment: process.env.RELEASE_PROTECTED_ENVIRONMENT,
  });
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(entrypoint)).href
) {
  run(process.argv[2], process.argv[3], process.argv[4]);
}
