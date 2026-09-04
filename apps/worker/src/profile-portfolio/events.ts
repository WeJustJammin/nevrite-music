import type { ProfilePortfolioEvent } from '@wejammin/contracts';

import type { WorkerContext } from '../index';
import type { ActiveProfilePortfolioOperation } from './runtime-helpers';
import type { ProfilePortfolioPortInput } from './types';

export const responseVersion = (value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) return null;
  const data = (value as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;
  const record = data as Record<string, unknown>;
  return typeof record.version === 'string'
    ? record.version
    : typeof record.projectionVersion === 'string'
      ? record.projectionVersion
      : null;
};

const partyIdFrom = (
  input: ProfilePortfolioPortInput,
  value: unknown,
): string | null => {
  const pathPartyId = input.path?.partyId;
  if (pathPartyId !== undefined) return pathPartyId;
  if (typeof value !== 'object' || value === null) return null;
  const data = (value as { data?: unknown }).data;
  return typeof data === 'object' &&
    data !== null &&
    typeof (data as { partyId?: unknown }).partyId === 'string'
    ? (data as { partyId: string }).partyId
    : null;
};

const reasonFor = (
  operationId: ActiveProfilePortfolioOperation,
): 'section_changed' | 'emphasis_changed' | 'reel_changed' =>
  operationId === 'PRF-PROF-04' || operationId === 'PRF-PROF-11'
    ? 'emphasis_changed'
    : operationId === 'PRF-PROF-03'
      ? 'section_changed'
      : 'reel_changed';

export const eventFor = (
  context: WorkerContext,
  input: ProfilePortfolioPortInput,
  value: unknown,
): ProfilePortfolioEvent | null => {
  if (
    ![
      'PRF-PROF-03',
      'PRF-PROF-04',
      'PRF-PROF-07',
      'PRF-PROF-08',
      'PRF-PROF-09',
    ].includes(input.operationId)
  )
    return null;
  const partyId = partyIdFrom(input, value);
  const version = responseVersion(value);
  if (partyId === null || version === null) return null;
  return {
    eventId: crypto.randomUUID(),
    eventType: 'profile.projection.invalidated.v1',
    eventVersion: 1,
    aggregateId: partyId,
    aggregateVersion: version,
    occurredAt: new Date().toISOString(),
    correlationId: context.get('correlationId'),
    causationId: context.get('requestId'),
    payload: {
      partyId,
      sourceType: 'profile',
      sourceId: partyId,
      sourceVersion: version,
      reason: reasonFor(input.operationId as ActiveProfilePortfolioOperation),
    },
  };
};
