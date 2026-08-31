import {
  HighRiskServerAuthoritySchema,
  InfrastructureCommandSchema,
  ProtectedCommandHeadersSchema,
  VerifiedSessionSchema,
  type CommandResult,
} from '@wejammin/contracts';

import {
  denialWithAudit,
  dependencyError,
  normalizeClassification,
  normalizeCommitOutcome,
  parseExactVersion,
  safeAbuseSignal,
} from './security-support.ts';
import type {
  AtomicCommitOutcome,
  ProtectedCommandClassification,
  ProtectedCommandDecision,
  ProtectedCommandInput,
  ProtectedCommandPorts,
  ProtectedCommandResolution,
  ScrubbedTelemetry,
} from './security-types.ts';

/**
 * Executes a protected command from untrusted transport material. Identity,
 * authority, risk, capability, clock, target version, hash, and idempotency
 * decisions all come from server ports.
 */
export const executeProtectedCommand = async (
  input: ProtectedCommandInput,
  ports: ProtectedCommandPorts,
): Promise<ProtectedCommandDecision> => {
  const command = InfrastructureCommandSchema.safeParse(input.command);
  const headers = ProtectedCommandHeadersSchema.safeParse(input.headers);
  if (!command.success || !headers.success) {
    return { kind: 'denied', preservedInput: true, reason: 'INVALID_REQUEST' };
  }

  const claimsPresent = input.clientClaims !== undefined;
  const telemetry: ScrubbedTelemetry = { scrubbed: true };
  if (claimsPresent) {
    await safeAbuseSignal(ports, {
      kind: 'untrusted_client_claims',
      scrubbed: true,
    });
  }
  const claimExtras = claimsPresent
    ? ({ ignoredClientClaims: true, telemetry } as const)
    : {};

  let verifiedSession;
  try {
    verifiedSession = await ports.verifySession();
  } catch {
    return dependencyError();
  }
  if (verifiedSession === null) {
    return {
      kind: 'denied',
      preservedInput: true,
      ...claimExtras,
      reason: 'UNAUTHENTICATED',
    };
  }
  const session = VerifiedSessionSchema.safeParse(verifiedSession);
  if (!session.success) {
    return {
      kind: 'denied',
      preservedInput: true,
      ...claimExtras,
      reason: 'UNAUTHENTICATED',
    };
  }

  let nowEpochSeconds: number;
  try {
    nowEpochSeconds = await ports.now();
  } catch {
    return dependencyError();
  }
  if (!Number.isSafeInteger(nowEpochSeconds) || nowEpochSeconds < 0) {
    return dependencyError();
  }
  if (nowEpochSeconds >= session.data.expiresAt) {
    return {
      kind: 'denied',
      preservedInput: true,
      ...claimExtras,
      reason: 'SESSION_EXPIRED',
    };
  }

  let resolution: ProtectedCommandResolution;
  try {
    resolution = await ports.resolveAuthorityAndTarget({
      command: command.data,
      session: session.data,
    });
  } catch {
    return dependencyError();
  }
  const authority = HighRiskServerAuthoritySchema.safeParse(
    resolution?.authority,
  );
  if (!authority.success) {
    return {
      kind: 'denied',
      preservedInput: true,
      ...claimExtras,
      reason: 'FORBIDDEN',
    };
  }

  const target = resolution.target;
  if (
    target === null ||
    typeof target !== 'object' ||
    target.targetId !== command.data.targetId ||
    typeof target.currentVersion !== 'string' ||
    parseExactVersion(target.currentVersion) === null
  ) {
    if (authority.data.actingPartyId === null) {
      return {
        kind: 'denied',
        preservedInput: true,
        ...claimExtras,
        reason: 'NOT_FOUND',
      };
    }
    return denialWithAudit(
      ports,
      {
        authority: authority.data,
        capability: 'infrastructure.command',
        session: session.data,
        targetId: command.data.targetId,
      },
      'NOT_FOUND',
      claimExtras,
    );
  }

  let classificationResult: ProtectedCommandClassification | boolean;
  try {
    if (ports.classifyOperationRisk === undefined) return dependencyError();
    classificationResult = await ports.classifyOperationRisk({
      authority: authority.data,
      command: command.data,
      session: session.data,
      target,
    });
  } catch {
    return dependencyError();
  }
  let splitCapability: string | undefined;
  if (ports.classifyOperationCapability !== undefined) {
    try {
      splitCapability = await ports.classifyOperationCapability({
        authority: authority.data,
        command: command.data,
        session: session.data,
        target,
      });
    } catch {
      return dependencyError();
    }
  }
  const classification = normalizeClassification(
    classificationResult,
    splitCapability,
  );
  if (classification === null) return dependencyError();

  if (
    command.data.requestedPartyId !== undefined &&
    command.data.requestedPartyId !== authority.data.actingPartyId
  ) {
    await safeAbuseSignal(ports, { kind: 'foreign_authority', scrubbed: true });
    return denialWithAudit(
      ports,
      {
        authority: authority.data,
        capability: classification.requiredCapability,
        session: session.data,
        targetId: command.data.targetId,
      },
      'FOREIGN_AUTHORITY',
      { telemetry, ...claimExtras },
    );
  }
  if (
    authority.data.actingPartyId === null ||
    !authority.data.capabilities.includes(classification.requiredCapability)
  ) {
    return denialWithAudit(
      ports,
      {
        authority: authority.data,
        capability: classification.requiredCapability,
        session: session.data,
        targetId: command.data.targetId,
      },
      'FORBIDDEN',
      claimExtras,
    );
  }
  if (classification.highRisk && !authority.data.stepUpVerified) {
    return denialWithAudit(
      ports,
      {
        authority: authority.data,
        capability: classification.requiredCapability,
        session: session.data,
        targetId: command.data.targetId,
      },
      'STEP_UP_REQUIRED',
      claimExtras,
    );
  }
  if (classification.highRisk && !authority.data.auditReasonPresent) {
    return denialWithAudit(
      ports,
      {
        authority: authority.data,
        capability: classification.requiredCapability,
        session: session.data,
        targetId: command.data.targetId,
      },
      'AUDIT_REASON_REQUIRED',
      claimExtras,
    );
  }

  let normalizedRequestHash: string;
  try {
    normalizedRequestHash = await ports.calculateCanonicalHash({
      authority: authority.data,
      classification,
      command: command.data,
      headers: headers.data,
      session: session.data,
      target,
    });
  } catch {
    return dependencyError();
  }
  if (
    typeof normalizedRequestHash !== 'string' ||
    normalizedRequestHash.trim().length === 0
  ) {
    return dependencyError();
  }

  let committed: AtomicCommitOutcome | CommandResult | null;
  try {
    committed = normalizeCommitOutcome(
      await ports.commitAtomically({
        actingPartyId: authority.data.actingPartyId,
        actorId: session.data.userId,
        command: command.data,
        expectedVersion: headers.data.ifMatch,
        headers: headers.data,
        highRisk: classification.highRisk,
        normalizedRequestHash,
        requiredCapability: classification.requiredCapability,
        resolvedCurrentVersion: target.currentVersion,
        sessionId: session.data.sessionId,
        targetId: target.targetId,
      }),
    );
  } catch {
    return dependencyError();
  }
  if (committed === null) return dependencyError();
  if (committed.kind === 'replayed') {
    return { kind: 'replayed', result: committed.result, ...claimExtras };
  }
  if (committed.kind === 'conflict') {
    return {
      kind: 'conflict',
      partialEffects: false,
      reason: committed.reason,
      ...(committed.currentVersion === undefined
        ? {}
        : { currentVersion: committed.currentVersion }),
      ...(claimsPresent ? { ignoredClientClaims: true, telemetry } : {}),
    };
  }
  return {
    atomicWrites: ['canonical_state', 'audit', 'outbox', 'idempotency'],
    kind: 'committed',
    result: committed.result,
    ...claimExtras,
  };
};
