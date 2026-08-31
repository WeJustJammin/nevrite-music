import {
  type CommandResult,
  type HighRiskServerAuthority,
  type InfrastructureCommand,
  type ProtectedCommandHeaders,
  type VerifiedSession,
} from '@wejammin/contracts';

export type MaybePromise<T> = T | Promise<T>;

export type ScrubbedTelemetry = Readonly<{ scrubbed: true }>;

/** Untrusted transport material. Server security facts never belong here. */
export type ProtectedCommandInput = Readonly<{
  command: unknown;
  headers: unknown;
  clientClaims?: unknown;
}>;

export type ProtectedCommandTarget = Readonly<{
  targetId: string;
  currentVersion: string;
}>;

export type ProtectedCommandResolution = Readonly<{
  authority: HighRiskServerAuthority;
  target: ProtectedCommandTarget | null;
}>;

export type ProtectedCommandClassification = Readonly<{
  highRisk: boolean;
  requiredCapability: string;
}>;

export type DecisionAudit = Readonly<{
  actorId: string;
  actingPartyId: string;
  targetId: string;
  capability: string;
  decision: 'allow' | 'deny';
  reasonCode: string;
}>;

export type AbuseSignal = Readonly<{
  kind: 'foreign_authority' | 'untrusted_client_claims';
  scrubbed: true;
}>;

export type AtomicCommitInput = Readonly<{
  actorId: string;
  actingPartyId: string;
  sessionId: string;
  command: InfrastructureCommand;
  headers: ProtectedCommandHeaders;
  /** Server-resolved version bound to the CAS context. */
  resolvedCurrentVersion: string;
  /** Validated request precondition, checked atomically by the commit port. */
  expectedVersion: string;
  normalizedRequestHash: string;
  requiredCapability: string;
  highRisk: boolean;
  targetId: string;
}>;

export type AtomicCommitOutcome =
  | Readonly<{
      kind: 'committed';
      result: CommandResult;
    }>
  | Readonly<{
      kind: 'replayed';
      result: CommandResult;
    }>
  | Readonly<{
      kind: 'conflict';
      reason: 'IDEMPOTENCY_MISMATCH' | 'VERSION_MISMATCH';
      currentVersion?: string;
    }>;

export type ProtectedCommandPorts = Readonly<{
  /** Returns a current, non-revoked session; null includes revoked sessions. */
  verifySession: () => MaybePromise<VerifiedSession | null>;
  /** Trusted server clock; caller-provided timestamps are never consulted. */
  now: () => MaybePromise<number>;
  /** Resolves authority and target through server state/RLS. */
  resolveAuthorityAndTarget: (
    input: Readonly<{
      session: VerifiedSession;
      command: InfrastructureCommand;
    }>,
  ) => MaybePromise<ProtectedCommandResolution>;
  /** Classifies operation policy from server-side facts. */
  classifyOperationRisk?: (
    input: Readonly<{
      session: VerifiedSession;
      authority: HighRiskServerAuthority;
      target: ProtectedCommandTarget;
      command: InfrastructureCommand;
    }>,
  ) => MaybePromise<ProtectedCommandClassification | boolean>;
  /** Optional split capability resolver for risk/capability deployments. */
  classifyOperationCapability?: (
    input: Readonly<{
      session: VerifiedSession;
      authority: HighRiskServerAuthority;
      target: ProtectedCommandTarget;
      command: InfrastructureCommand;
    }>,
  ) => MaybePromise<string>;
  /** Hashes canonical output and server facts, never raw request text. */
  calculateCanonicalHash: (
    input: Readonly<{
      session: VerifiedSession;
      authority: HighRiskServerAuthority;
      target: ProtectedCommandTarget;
      command: InfrastructureCommand;
      headers: ProtectedCommandHeaders;
      classification: ProtectedCommandClassification;
    }>,
  ) => MaybePromise<string>;
  /** One database/RPC transaction owning idempotency lookup and CAS. */
  commitAtomically: (
    input: AtomicCommitInput,
  ) => MaybePromise<AtomicCommitOutcome | CommandResult>;
  auditDenial: (event: DecisionAudit) => MaybePromise<void>;
  recordAbuseSignal: (signal: AbuseSignal) => MaybePromise<void>;
}>;

export type ProtectedCommandDecision =
  | Readonly<{
      kind: 'committed';
      result: CommandResult;
      atomicWrites: readonly [
        'canonical_state',
        'audit',
        'outbox',
        'idempotency',
      ];
      ignoredClientClaims?: true;
      telemetry?: ScrubbedTelemetry;
    }>
  | Readonly<{
      kind: 'replayed';
      result: CommandResult;
      ignoredClientClaims?: true;
      telemetry?: ScrubbedTelemetry;
    }>
  | Readonly<{
      kind: 'conflict';
      reason: 'IDEMPOTENCY_MISMATCH' | 'VERSION_MISMATCH';
      replacedOriginal?: false;
      currentVersion?: string;
      partialEffects: false;
      ignoredClientClaims?: true;
      telemetry?: ScrubbedTelemetry;
    }>
  | Readonly<{
      kind: 'denied';
      reason:
        | 'INVALID_REQUEST'
        | 'UNAUTHENTICATED'
        | 'SESSION_EXPIRED'
        | 'FOREIGN_AUTHORITY'
        | 'FORBIDDEN'
        | 'NOT_FOUND'
        | 'STEP_UP_REQUIRED'
        | 'AUDIT_REASON_REQUIRED';
      preservedInput: true;
      appendOnlyDecisionAudit?: true;
      ignoredClientClaims?: true;
      telemetry?: ScrubbedTelemetry;
    }>
  | Readonly<{
      kind: 'dependency_error';
      reason: 'DEPENDENCY_UNAVAILABLE';
      retryable: true;
      partialEffects: false;
    }>;
