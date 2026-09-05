export type ContentSchemaRegistryAlertCode =
  | 'activation_blocked'
  | 'migration_retry_exceeded'
  | 'nonce_rejection_spike'
  | 'dlq_nonempty'
  | 'outbox_age_exceeded'
  | 'conflict_rate_exceeded'
  | 'unknown_event_version'
  | 'command_p95_exceeded'
  | 'protected_rpc_p95_exceeded'
  | 'acceptance_p99_exceeded'
  | 'queue_first_attempt_p95_exceeded'
  | 'daily_dlq_rate_exceeded';

export type ContentSchemaRegistryOperationalSnapshot = Readonly<{
  activationBlockedMs?: number;
  migrationRetryCount?: number;
  nonceRejectionRate?: number;
  nonceRejectionBaseline?: number;
  dlqDepth?: number;
  outboxAgeMs?: number;
  conflictRate?: number;
  conflictWindowMs?: number;
  unknownEventVersions?: number;
  commandP95Ms?: number;
  protectedRpcP95Ms?: number;
  acceptanceP99Ms?: number;
  queueFirstAttemptP95Ms?: number;
  dailyDlqRate?: number;
}>;

export type ContentSchemaRegistryAlert = Readonly<{
  code: ContentSchemaRegistryAlertCode;
  observed: number;
  threshold: number;
  route: 'platform.on_call';
  runbook: 'content-schema-registry';
}>;
