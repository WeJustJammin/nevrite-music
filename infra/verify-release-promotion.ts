import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  evaluateReleasePromotion,
  type ReleasePromotionDecision,
} from '../packages/application/src/infrastructure/release-recovery/promotion.ts';
import {
  ReleasePromotionEvidenceSchema,
  type ReleasePromotionEvidence,
} from '../packages/contracts/src/release-artifact.ts';

export const verifyStagingCandidateMetadata = (
  metadata: unknown,
): ReleasePromotionEvidence => {
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
  return evidence;
};

export const verifyReleasePromotionMetadata = (
  metadata: unknown,
  options?: Readonly<{ protectedEnvironment?: unknown }>,
): ReleasePromotionDecision => {
  const protectedApproval = options?.protectedEnvironment === 'production';
  if (!protectedApproval) {
    throw new Error('A protected production environment is required.');
  }
  const decision = evaluateReleasePromotion({
    evidence: metadata,
    previousArtifact:
      typeof metadata === 'object' &&
      metadata !== null &&
      'artifact' in metadata
        ? metadata.artifact
        : null,
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
): void => {
  if (!metadataPath) {
    throw new Error('Promotion metadata path is required.');
  }
  const metadata: unknown = JSON.parse(readFileSync(metadataPath, 'utf8'));
  if (mode === 'candidate') {
    verifyStagingCandidateMetadata(metadata);
    return;
  }
  if (mode !== 'production') {
    throw new Error('Promotion verification mode is required.');
  }
  verifyReleasePromotionMetadata(metadata, {
    protectedEnvironment: process.env.RELEASE_PROTECTED_ENVIRONMENT,
  });
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(entrypoint).href
) {
  run(process.argv[2], process.argv[3]);
}
