import { CapabilitySchema } from '@wejammin/contracts';

import {
  isControlFree,
  isRecord,
  isUuid,
  JobStatusProductionInternalError,
  type JobStatusProductionAuthority,
  type ServerAuthority,
} from './job-status-production-support';
import type { JobStatusPrincipal } from './job-status-types';

export const MAX_OPERATOR_REASON_BYTES = 240;
const MAX_CAPABILITIES = 64;
const OPERATOR_CAPABILITY = 'jobs.read:any';
const ACTING_PARTY_CAPABILITY = 'jobs.read';

type ParsedAuthority = JobStatusProductionAuthority & {
  capabilities?: readonly string[];
  reason?: unknown;
};

type ParseResult = ParsedAuthority | null | 'invalid';

const has = (value: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const parseCapabilities = (value: unknown): readonly string[] | null => {
  if (!Array.isArray(value) || value.length > MAX_CAPABILITIES) return null;
  const capabilities = value.filter(
    (candidate): candidate is string =>
      typeof candidate === 'string' &&
      CapabilitySchema.safeParse(candidate).success,
  );
  return capabilities.length === value.length &&
    new Set(capabilities).size === capabilities.length
    ? capabilities
    : null;
};

const parseAuthorityRecord = (value: unknown): ParseResult => {
  if (!isRecord(value)) return 'invalid';
  if (has(value, 'userId') || has(value, 'actorId')) return 'invalid';

  const allowedKeys = [
    'actingPartyId',
    'capabilities',
    'reason',
    'stepUpVerified',
  ] as const;
  if (
    Object.keys(value).some(
      (key) => !allowedKeys.includes(key as (typeof allowedKeys)[number]),
    )
  ) {
    return 'invalid';
  }
  const party = has(value, 'actingPartyId')
    ? { present: true, value: value.actingPartyId }
    : { present: false };
  const capabilities = has(value, 'capabilities')
    ? { present: true, value: value.capabilities }
    : { present: false };
  const stepUp = has(value, 'stepUpVerified')
    ? { present: true, value: value.stepUpVerified }
    : { present: false };
  const reason = has(value, 'reason')
    ? { present: true, value: value.reason }
    : { present: false };
  if (
    !party.present &&
    !capabilities.present &&
    !stepUp.present &&
    !reason.present
  ) {
    return null;
  }
  if (
    (party.present && party.value !== null && !isUuid(party.value)) ||
    (capabilities.present && parseCapabilities(capabilities.value) === null) ||
    (stepUp.present && typeof stepUp.value !== 'boolean') ||
    (reason.present &&
      reason.value !== undefined &&
      reason.value !== null &&
      typeof reason.value !== 'string')
  ) {
    return 'invalid';
  }
  return {
    ...(party.present ? { actingPartyId: party.value as string | null } : {}),
    ...(capabilities.present
      ? {
          capabilities: parseCapabilities(
            capabilities.value,
          ) as readonly string[],
        }
      : {}),
    ...(reason.present && typeof reason.value === 'string'
      ? { reason: reason.value }
      : {}),
    ...(stepUp.present ? { stepUpVerified: stepUp.value as boolean } : {}),
  };
};

const ownerAuthority = (actorId: string): ServerAuthority => ({
  actorId,
  actingPartyId: null,
  capabilities: [],
  capability: null,
  kind: 'user',
  reason: null,
  stepUpVerified: false,
});

const boundedReason = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  if (
    value !== value.trim() ||
    value.length < 3 ||
    value.length > MAX_OPERATOR_REASON_BYTES ||
    new TextEncoder().encode(value).byteLength > MAX_OPERATOR_REASON_BYTES ||
    !isControlFree(value)
  ) {
    return null;
  }
  return value;
};

const buildAuthority = (
  actorId: string,
  input: ParsedAuthority,
): ServerAuthority => {
  const actingPartyId = input.actingPartyId ?? null;
  const capabilities = input.capabilities ?? [];
  const stepUpVerified = input.stepUpVerified ?? false;
  const kind: ServerAuthority['kind'] =
    stepUpVerified || capabilities.includes(OPERATOR_CAPABILITY)
      ? 'operator'
      : actingPartyId !== null
        ? 'acting_party'
        : 'user';
  return {
    actorId,
    actingPartyId: kind === 'user' ? null : actingPartyId,
    capabilities,
    capability:
      kind === 'operator' && capabilities.includes(OPERATOR_CAPABILITY)
        ? OPERATOR_CAPABILITY
        : kind === 'acting_party' &&
            capabilities.includes(ACTING_PARTY_CAPABILITY)
          ? ACTING_PARTY_CAPABILITY
          : null,
    kind,
    reason: kind === 'operator' ? boundedReason(input.reason) : null,
    stepUpVerified: kind === 'operator' ? stepUpVerified : false,
  };
};

export const authorityFromResolver = (
  actorId: string,
  value: unknown,
): ServerAuthority => {
  if (!isUuid(actorId)) throw new JobStatusProductionInternalError();
  if (value === null) return ownerAuthority(actorId);
  const parsed = parseAuthorityRecord(value);
  if (parsed === null || parsed === 'invalid') {
    throw new JobStatusProductionInternalError();
  }
  return buildAuthority(actorId, parsed);
};

export const principalFromAuthority = (
  authority: ServerAuthority,
): JobStatusPrincipal => {
  switch (authority.kind) {
    case 'operator':
      return {
        actingPartyId: authority.actingPartyId,
        capabilities: authority.capabilities,
        kind: 'operator',
        reason: authority.reason,
        stepUpVerified: authority.stepUpVerified,
        userId: authority.actorId,
      };
    case 'acting_party':
      if (authority.actingPartyId === null) {
        throw new JobStatusProductionInternalError();
      }
      return {
        actingPartyId: authority.actingPartyId,
        capabilities: authority.capabilities,
        kind: 'acting_party',
        userId: authority.actorId,
      };
    case 'user':
      return { kind: 'user', userId: authority.actorId };
  }
};
