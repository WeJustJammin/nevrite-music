export type StatusViewState = 'loading' | 'error' | 'success' | 'blocked';

export type ReleasePromotionProjection = Readonly<{
  status: StatusViewState;
  environment: 'preview' | 'staging' | 'production' | null;
  artifactDigest: string | null;
  sourceRevision: string | null;
  verifiedAt: string | null;
}>;

export type RecoveryReadinessProjection = Readonly<{
  status: StatusViewState;
  environment: 'staging' | 'production' | null;
  artifactDigest: string | null;
  sourceRevision: string | null;
  artifactBound: boolean;
  checksVerified: boolean;
  pitrAvailable: boolean | null;
  pitrRetentionDays: number | null;
  measuredRpoSeconds: number | null;
  measuredRtoSeconds: number | null;
  restoreEpoch: string | null;
  protectedWrites: 'enabled' | 'disabled';
  verifiedAt: string | null;
}>;

export type MaintenanceProjection = Readonly<{
  status: 'scheduled' | 'active' | 'completed' | 'unavailable';
  scope: string | null;
  announcedAtLeast48HoursAhead: boolean;
  windowStartsAt: string | null;
  windowEndsAt: string | null;
  availabilityBasisPoints: number | null;
  availabilityObjectiveBasisPoints: 9_990;
  unplannedDowntimeCounted: true;
}>;

export const DEFAULT_RELEASE_PROJECTION: ReleasePromotionProjection =
  Object.freeze({
    status: 'blocked',
    environment: null,
    artifactDigest: null,
    sourceRevision: null,
    verifiedAt: null,
  });

export const DEFAULT_RECOVERY_PROJECTION: RecoveryReadinessProjection =
  Object.freeze({
    status: 'blocked',
    environment: null,
    artifactDigest: null,
    sourceRevision: null,
    artifactBound: false,
    checksVerified: false,
    pitrAvailable: null,
    pitrRetentionDays: null,
    measuredRpoSeconds: null,
    measuredRtoSeconds: null,
    restoreEpoch: null,
    protectedWrites: 'disabled',
    verifiedAt: null,
  });

export const DEFAULT_MAINTENANCE_PROJECTION: MaintenanceProjection =
  Object.freeze({
    status: 'unavailable',
    scope: null,
    announcedAtLeast48HoursAhead: false,
    windowStartsAt: null,
    windowEndsAt: null,
    availabilityBasisPoints: null,
    availabilityObjectiveBasisPoints: 9_990,
    unplannedDowntimeCounted: true,
  });
