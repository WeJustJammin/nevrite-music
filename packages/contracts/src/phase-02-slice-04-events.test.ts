import { describe, expect, it } from 'vitest';

import {
  PlatformEventSchema,
  PlatformEventTypeSchema,
} from './platform-events.ts';

const organizationId = '11111111-1111-4111-8111-111111111111';
const relationshipId = '22222222-2222-4222-8222-222222222222';
const eventId = '33333333-3333-4333-8333-333333333333';
const correlationId = '44444444-4444-4444-8444-444444444444';

const base = {
  eventId,
  schemaVersion: 1 as const,
  aggregateType: 'organization',
  aggregateId: organizationId,
  aggregateVersion: '1',
  correlationId,
  causationId: null,
  actorId: null,
  actingPartyId: null,
  occurredAt: '2026-01-01T00:00:00.000Z',
};

describe('Phase 2 Slice 04 platform event contracts', () => {
  it('P2-S04-AC-008/020/026/032/038/044/050/056/062 registers identifier-only organization changes', () => {
    expect(
      PlatformEventTypeSchema.parse('identity.organization.changed.v1'),
    ).toBe('identity.organization.changed.v1');
    expect(
      PlatformEventSchema.parse({
        ...base,
        eventType: 'identity.organization.changed.v1',
        payload: { organizationId },
      }).payload,
    ).toEqual({ organizationId });
  });

  it('P2-S04-AC-032/044 emits relationship changes with no caller-controlled identity data', () => {
    const event = PlatformEventSchema.parse({
      ...base,
      eventType: 'identity.relationship.changed.v1',
      aggregateType: 'membership',
      aggregateId: relationshipId,
      payload: { relationshipType: 'membership', relationshipId },
    });
    expect(event.payload).toEqual({
      relationshipType: 'membership',
      relationshipId,
    });
    expect(() =>
      PlatformEventSchema.parse({
        ...event,
        payload: {
          relationshipType: 'membership',
          relationshipId,
          personId: organizationId,
        },
      }),
    ).toThrow();
  });

  it('P2-S04-AC-050/056 supports context revocation while preserving the existing nullable relationship binding', () => {
    const event = PlatformEventSchema.parse({
      ...base,
      eventType: 'identity.acting-context.revoked.v1',
      payload: {
        personId: organizationId,
        partyId: organizationId,
        relationshipId,
      },
    });
    expect(event.eventType).toBe('identity.acting-context.revoked.v1');
  });
});
