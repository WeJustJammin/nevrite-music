import { describe, expect, it } from 'vitest';

import { eventFor, responseVersion } from './events';
import { profilePortfolioResponseSchemas } from './responses';
import {
  EVENT_ID,
  OBSERVATION_ID,
  PARTY_ID,
  REQUEST_ID,
  responses,
} from './phase-02-slice-06.test-support';

const context = {
  get: (key: string) => (key === 'requestId' ? REQUEST_ID : 'correlation-06'),
} as never;

describe('Phase 2 Slice 06 event and response defensive coverage', () => {
  it('rejects values without a versioned response data record', () => {
    expect(responseVersion(null)).toBeNull();
    expect(responseVersion('profile')).toBeNull();
    expect(responseVersion({ data: null })).toBeNull();
    expect(responseVersion({ data: 'profile' })).toBeNull();
    expect(responseVersion({ data: {} })).toBeNull();
    expect(responseVersion({ data: { projectionVersion: '7' } })).toBe('7');
  });

  it('derives mutation invalidation identity from either path or response', () => {
    expect(
      eventFor(
        context,
        { operationId: 'PRF-PROF-01', request: new Request('https://x.test') },
        responses.publicProfile,
      ),
    ).toBeNull();
    expect(
      eventFor(
        context,
        { operationId: 'PRF-PROF-03', request: new Request('https://x.test') },
        null,
      ),
    ).toBeNull();
    expect(
      eventFor(
        context,
        { operationId: 'PRF-PROF-03', request: new Request('https://x.test') },
        { data: null },
      ),
    ).toBeNull();

    const fromResponse = eventFor(
      context,
      { operationId: 'PRF-PROF-03', request: new Request('https://x.test') },
      { data: { partyId: PARTY_ID, version: '8' } },
    );
    expect(fromResponse).toMatchObject({
      aggregateId: PARTY_ID,
      aggregateVersion: '8',
      payload: { reason: 'section_changed' },
    });
    expect(
      eventFor(
        context,
        {
          operationId: 'PRF-PROF-07',
          request: new Request('https://x.test'),
          path: { partyId: PARTY_ID },
        },
        { data: { version: '9' } },
      ),
    ).toMatchObject({ payload: { reason: 'reel_changed' } });
  });

  it('strictly validates observation and job response alternatives', () => {
    const schema = profilePortfolioResponseSchemas['PRF-PROF-10'];
    const valid = responses.observation;
    expect(schema.safeParse(valid).success).toBe(true);
    expect(
      schema.safeParse({
        data: {
          observationId: OBSERVATION_ID,
          accepted: true,
          dedupeState: 'duplicate',
          projectionVersion: '4',
          invalidationEventId: null,
        },
        meta: { requestId: REQUEST_ID },
      }).success,
    ).toBe(true);
    expect(schema.safeParse(null).success).toBe(false);
    expect(schema.safeParse({ data: {}, meta: {}, extra: true }).success).toBe(
      false,
    );
    expect(schema.safeParse({ data: null, meta: {} }).success).toBe(false);
    expect(schema.safeParse({ data: {}, meta: null }).success).toBe(false);
    expect(
      schema.safeParse({ data: {}, meta: { requestId: REQUEST_ID, extra: 1 } })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({
        data: {
          observationId: OBSERVATION_ID,
          accepted: true,
          dedupeState: 'new',
          projectionVersion: '4',
          invalidationEventId: EVENT_ID,
          extra: true,
        },
        meta: { requestId: REQUEST_ID },
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        data: {
          observationId: OBSERVATION_ID,
          accepted: true,
          dedupeState: 'invalid',
          projectionVersion: '4',
          invalidationEventId: EVENT_ID,
        },
        meta: { requestId: REQUEST_ID },
      }).success,
    ).toBe(false);
  });

  it('accepts only strict compatibility list envelopes', () => {
    const revision = profilePortfolioResponseSchemas['PRF-PROF-02'];
    const reel = profilePortfolioResponseSchemas['PRF-PROF-06'];
    for (const schema of [revision, reel]) {
      expect(schema.safeParse(null).success).toBe(false);
      expect(schema.safeParse({ data: [], meta: null }).success).toBe(false);
      expect(
        schema.safeParse({ data: {}, meta: { requestId: REQUEST_ID } }).success,
      ).toBe(false);
      expect(
        schema.safeParse({
          data: [],
          meta: { requestId: REQUEST_ID, unsupported: true },
        }).success,
      ).toBe(false);
    }
    expect(revision.safeParse(responses.sectionRevisions).success).toBe(true);
    expect(reel.safeParse(responses.reel).success).toBe(true);
    expect(
      revision.safeParse({
        data: [],
        meta: { requestId: REQUEST_ID, nextCursor: null },
      }).success,
    ).toBe(true);
    expect(
      reel.safeParse({
        data: [],
        meta: {
          requestId: REQUEST_ID,
          nextCursor: null,
          projectionVersion: '3',
        },
      }).success,
    ).toBe(true);
  });

  it('strictly validates legacy portfolio compatibility envelopes', () => {
    const schema = profilePortfolioResponseSchemas['PRF-PROF-05'];
    expect(schema.safeParse(responses.portfolio).success).toBe(true);
    expect(
      schema.safeParse({
        data: {
          items: [],
          visibleTotals: { items: 0 },
          filters: { roleCodes: [] },
          projectionVersion: '3',
        },
        meta: { requestId: REQUEST_ID, nextCursor: null },
      }).success,
    ).toBe(true);
    expect(schema.safeParse(null).success).toBe(false);
    expect(schema.safeParse({ data: null, meta: {} }).success).toBe(false);
    expect(
      schema.safeParse({ data: {}, meta: { requestId: REQUEST_ID } }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        data: {
          items: [{}],
          visibleTotals: {},
          filters: { roleCode: null, from: null, to: null },
          projectionVersion: '3',
        },
        meta: { requestId: REQUEST_ID },
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        data: {
          items: [],
          visibleTotals: [],
          filters: {},
          projectionVersion: '3',
        },
        meta: { requestId: REQUEST_ID },
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        data: {
          items: [],
          visibleTotals: {},
          filters: { unsupported: true },
          projectionVersion: '3',
        },
        meta: { requestId: REQUEST_ID },
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        data: {
          items: [],
          visibleTotals: {},
          filters: { roleCodes: [] },
          projectionVersion: '3',
        },
        meta: { requestId: REQUEST_ID, nextCursor: null },
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        data: {
          items: [],
          visibleTotals: {},
          filters: { roleCodes: [] },
          projectionVersion: '3',
        },
        meta: { requestId: REQUEST_ID, nextCursor: 'opaque-cursor' },
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        data: {
          items: [],
          visibleTotals: {},
          filters: { roleCodes: [] },
          projectionVersion: 3,
        },
        meta: { requestId: REQUEST_ID, nextCursor: 7 },
      }).success,
    ).toBe(false);
  });
});
