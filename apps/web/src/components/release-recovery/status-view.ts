import type {
  RecoveryReadinessProjection,
  ReleasePromotionProjection,
  StatusViewState,
} from './status-projection.ts';

const STATUS_VIEW_STATES = [
  'loading',
  'error',
  'success',
  'blocked',
] as const satisfies readonly StatusViewState[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStatusViewState = (value: unknown): value is StatusViewState =>
  typeof value === 'string' &&
  (STATUS_VIEW_STATES as readonly string[]).includes(value);

export const releaseEvidenceComplete = (
  release: ReleasePromotionProjection,
): boolean =>
  release.status === 'success' &&
  release.environment !== null &&
  release.artifactDigest !== null &&
  release.sourceRevision !== null &&
  release.verifiedAt !== null;

export const recoveryEvidenceComplete = (
  recovery: RecoveryReadinessProjection,
): boolean =>
  recovery.status === 'success' &&
  recovery.pitrAvailable === true &&
  recovery.pitrRetentionDays !== null &&
  recovery.pitrRetentionDays >= 7 &&
  recovery.measuredRpoSeconds !== null &&
  recovery.measuredRtoSeconds !== null &&
  recovery.protectedWrites === 'enabled' &&
  recovery.checksVerified;

export const recoveryArtifactMatchesRelease = (
  release: ReleasePromotionProjection,
  recovery: RecoveryReadinessProjection,
): boolean =>
  recovery.artifactBound &&
  release.environment !== null &&
  release.environment === recovery.environment &&
  release.artifactDigest !== null &&
  release.artifactDigest === recovery.artifactDigest &&
  release.sourceRevision !== null &&
  release.sourceRevision === recovery.sourceRevision;

export type LastKnownGoodState =
  | Readonly<{ status: 'available'; verifiedAt: string }>
  | Readonly<{ status: 'unavailable'; verifiedAt: null }>;

export const resolveLastKnownGood = (input: unknown): LastKnownGoodState => {
  if (
    typeof input !== 'string' ||
    input.length === 0 ||
    !Number.isFinite(Date.parse(input))
  ) {
    return { status: 'unavailable', verifiedAt: null };
  }

  return { status: 'available', verifiedAt: input };
};

export const deriveReleaseRecoveryState = (input: unknown): StatusViewState => {
  if (!isRecord(input)) return 'blocked';

  const releaseStatus = input.releaseStatus;
  const recoveryStatus = input.recoveryStatus;
  if (!isStatusViewState(releaseStatus) || !isStatusViewState(recoveryStatus)) {
    return 'blocked';
  }
  if (releaseStatus === 'loading' || recoveryStatus === 'loading') {
    return 'loading';
  }
  if (releaseStatus === 'error' || recoveryStatus === 'error') {
    return 'error';
  }
  if (releaseStatus === 'blocked' || recoveryStatus === 'blocked') {
    return 'blocked';
  }

  return input.releaseEvidenceComplete === true &&
    input.recoveryEvidenceComplete === true &&
    input.protectedWritesEnabled === true &&
    input.checksVerified === true &&
    input.artifactBound === true
    ? 'success'
    : 'blocked';
};
