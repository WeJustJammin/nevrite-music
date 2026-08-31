import {
  CommandResultSchema,
  HighRiskServerAuthoritySchema,
  VerifiedSessionSchema,
  type CommandResult,
  type HighRiskServerAuthority,
  type VerifiedSession,
} from '@wejammin/contracts';

import {
  type AbuseSignal,
  type AtomicCommitOutcome,
  type ProtectedCommandDecision,
  type ProtectedCommandPorts,
  type ProtectedCommandClassification,
  type ScrubbedTelemetry,
} from './security-types.ts';

const SAFE_VERSION = /^"([1-9][0-9]{0,18})"$/;
const MAX_BIGINT_VERSION = 9_223_372_036_854_775_807n;

export const UNKNOWN_CAPABILITY = 'infrastructure.command';

export const parseExactVersion = (value: string): bigint | null => {
  const match = SAFE_VERSION.exec(value);
  if (match === null || match[1] === undefined) return null;
  try {
    const version = BigInt(match[1]);
    return version <= MAX_BIGINT_VERSION ? version : null;
  } catch {
    return null;
  }
};

export const dependencyError = (): ProtectedCommandDecision => ({
  kind: 'dependency_error',
  partialEffects: false,
  reason: 'DEPENDENCY_UNAVAILABLE',
  retryable: true,
});

export const safeAudit = async (
  ports: ProtectedCommandPorts,
  event: Readonly<{
    actorId: string;
    actingPartyId: string;
    targetId: string;
    capability: string;
    decision: 'allow' | 'deny';
    reasonCode: string;
  }>,
): Promise<boolean> => {
  try {
    await ports.auditDenial(event);
    return true;
  } catch {
    return false;
  }
};

export const safeAbuseSignal = async (
  ports: ProtectedCommandPorts,
  signal: AbuseSignal,
): Promise<void> => {
  try {
    await ports.recordAbuseSignal(signal);
  } catch {
    // Abuse telemetry is best effort and never contains request content.
  }
};

export const denialWithAudit = async (
  ports: ProtectedCommandPorts,
  context: Readonly<{
    session: VerifiedSession;
    authority: HighRiskServerAuthority;
    targetId: string;
    capability: string;
  }>,
  reason: Extract<ProtectedCommandDecision, { kind: 'denied' }>['reason'],
  extras: Readonly<{
    ignoredClientClaims?: true;
    telemetry?: ScrubbedTelemetry;
  }> = {},
): Promise<ProtectedCommandDecision> => {
  const actingPartyId = context.authority.actingPartyId;
  if (actingPartyId === null) {
    return {
      kind: 'denied',
      preservedInput: true,
      ...extras,
      reason,
    };
  }
  const audited = await safeAudit(ports, {
    actingPartyId,
    actorId: context.session.userId,
    capability: context.capability,
    decision: 'deny',
    reasonCode: reason,
    targetId: context.targetId,
  });
  if (!audited) return dependencyError();
  return {
    appendOnlyDecisionAudit: true,
    kind: 'denied',
    preservedInput: true,
    ...extras,
    reason,
  };
};

export const normalizeClassification = (
  result: ProtectedCommandClassification | boolean,
  capability: string | undefined,
): ProtectedCommandClassification | null => {
  if (typeof result === 'boolean') {
    if (capability === undefined) return null;
    return { highRisk: result, requiredCapability: capability };
  }
  if (
    typeof result.highRisk !== 'boolean' ||
    typeof result.requiredCapability !== 'string' ||
    result.requiredCapability.length < 3 ||
    result.requiredCapability.length > 128 ||
    !/^[a-z][a-z0-9_.:-]*$/.test(result.requiredCapability)
  ) {
    return null;
  }
  return {
    highRisk: result.highRisk,
    requiredCapability: result.requiredCapability,
  };
};

export const normalizeCommitOutcome = (
  value: AtomicCommitOutcome | CommandResult,
): AtomicCommitOutcome | null => {
  const result = CommandResultSchema.safeParse(value);
  if (result.success) return { kind: 'committed', result: result.data };
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.kind === 'committed') {
    const parsed = CommandResultSchema.safeParse(candidate.result);
    return parsed.success ? { kind: 'committed', result: parsed.data } : null;
  }
  if (candidate.kind === 'replayed') {
    const parsed = CommandResultSchema.safeParse(candidate.result);
    return parsed.success
      ? { kind: 'replayed', result: { ...parsed.data, replayed: true } }
      : null;
  }
  if (
    candidate.kind === 'conflict' &&
    (candidate.reason === 'IDEMPOTENCY_MISMATCH' ||
      candidate.reason === 'VERSION_MISMATCH')
  ) {
    const currentVersion = candidate.currentVersion;
    return {
      kind: 'conflict',
      reason: candidate.reason,
      ...(typeof currentVersion === 'string' &&
      parseExactVersion(currentVersion) !== null
        ? { currentVersion }
        : {}),
    };
  }
  return null;
};

export const parseVerifiedSession = (value: VerifiedSession | null) =>
  value === null ? null : VerifiedSessionSchema.safeParse(value);

export const parseServerHighRiskAuthority = (value: HighRiskServerAuthority) =>
  HighRiskServerAuthoritySchema.safeParse(value);
