import {
  RealtimeInvalidationHintSchema,
  type RealtimeInvalidationHint,
} from '@wejammin/contracts';

import type { RealtimeRefetchDecision } from './types.ts';

type EntityHint = Extract<RealtimeInvalidationHint, { entityId: string }>;

const isEntityHint = (hint: RealtimeInvalidationHint): hint is EntityHint =>
  'entityId' in hint;

const versionOf = (hint: EntityHint): bigint | null => {
  if (hint.hintedVersion === undefined) return null;
  return BigInt(hint.hintedVersion.slice(1, -1));
};

const keepNewer = (current: EntityHint, candidate: EntityHint): EntityHint => {
  const currentVersion = versionOf(current);
  const candidateVersion = versionOf(candidate);
  if (currentVersion === null) return candidate;
  if (candidateVersion === null || currentVersion >= candidateVersion) {
    return current;
  }
  return candidate;
};

const keyOf = (hint: RealtimeInvalidationHint): string =>
  isEntityHint(hint)
    ? `${hint.entityType}:${hint.entityId}`
    : `event:${hint.eventId}`;

const keepHint = (
  current: RealtimeInvalidationHint,
  candidate: RealtimeInvalidationHint,
): RealtimeInvalidationHint => {
  if (isEntityHint(current) && isEntityHint(candidate)) {
    return keepNewer(current, candidate);
  }
  return current;
};

export const coalesceInvalidationHints = (
  hints: readonly unknown[],
): readonly RealtimeInvalidationHint[] => {
  const unique = new Map<string, RealtimeInvalidationHint>();
  for (const candidate of hints) {
    const parsed = RealtimeInvalidationHintSchema.safeParse(candidate);
    if (!parsed.success) continue;
    const hint = parsed.data;
    const key = keyOf(hint);
    const current = unique.get(key);
    unique.set(key, current === undefined ? hint : keepHint(current, hint));
  }
  return [...unique.values()].sort((left, right) => {
    return keyOf(left).localeCompare(keyOf(right));
  });
};

const UuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type RefetchTarget = Readonly<{
  entityId: string;
  entityType: 'job' | 'infrastructure_record';
}>;

const isRefetchTarget = (value: unknown): value is RefetchTarget => {
  if (typeof value !== 'object' || value === null) return false;
  const target = value as { entityId?: unknown; entityType?: unknown };
  return (
    typeof target.entityId === 'string' &&
    UuidPattern.test(target.entityId) &&
    (target.entityType === 'job' ||
      target.entityType === 'infrastructure_record')
  );
};

const eventTarget = (value: unknown): RefetchTarget | null => {
  return isRefetchTarget(value) ? value : null;
};

export const authorizeCanonicalRefetch = (input: {
  hint: unknown;
  authorized: boolean;
  target?: unknown;
}): RealtimeRefetchDecision => {
  const parsed = RealtimeInvalidationHintSchema.safeParse(input.hint);
  if (!parsed.success) {
    return { disclosureSafe: true, kind: 'ignore', reason: 'INVALID_HINT' };
  }
  if (!input.authorized) {
    return { disclosureSafe: true, kind: 'ignore', reason: 'UNAUTHORIZED' };
  }
  if (!isEntityHint(parsed.data)) {
    const target = eventTarget(input.target);
    if (target === null) {
      return { disclosureSafe: true, kind: 'ignore', reason: 'INVALID_HINT' };
    }
    return {
      entityId: target.entityId,
      entityType: target.entityType,
      kind: 'refetch',
      preserveFocus: true,
      reason: 'realtime-hint',
    };
  }
  return {
    entityId: parsed.data.entityId,
    entityType: parsed.data.entityType,
    kind: 'refetch',
    preserveFocus: true,
    reason: 'realtime-hint',
  };
};
