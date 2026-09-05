export const CONTENT_SCHEMA_REGISTRY_ALERT_THRESHOLDS = Object.freeze({
  activationBlockedMs: 15 * 60 * 1000,
  migrationRetryCount: 3,
  outboxAgeMs: 2 * 60 * 1000,
  conflictRate: 0.05,
  conflictWindowMs: 5 * 60 * 1000,
  unknownEventVersions: 0,
  commandP95Ms: 1_200,
  protectedRpcP95Ms: 300,
  acceptanceP99Ms: 1_000,
  queueFirstAttemptP95Ms: 60 * 1000,
  dailyDlqRate: 0.001,
} as const);
