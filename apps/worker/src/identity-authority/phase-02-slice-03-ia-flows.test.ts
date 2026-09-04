import { describe, expect, it } from 'vitest';

import { evaluateIaPolicy } from './ia-policy';

type NativeFlow = 'person' | 'role-facet';

const native = (flow: NativeFlow) => evaluateIaPolicy({ kind: 'native', flow });
const edge = (name: string) => evaluateIaPolicy({ kind: 'edge', name });

const nativeInteraction = {
  surface: 'native',
  control: 'link-button-form',
  focus: 'retain-until-navigation-or-named-result',
  actor: 'server-derived',
  context: 'server-derived',
  capability: 'server-derived',
  validation: 'zod',
  response: 'authoritative-version-provenance-next-action',
  announce: true,
  error: 'typed-api-error',
  recovery: {
    retainInput: true,
    focus: 'summary-or-field',
    reconcileUnknownMutation: true,
    navigation: 'url',
    draft: 'scoped-before-commit',
    success: 'server-canonical',
  },
};

describe('Phase 2 Slice 03 missing IA01 flow contracts', () => {
  it('P2-S03-AC-140 implements the IDA-01 person creation interaction', () => {
    const result = native('person');

    expect(result).toMatchObject(nativeInteraction);
    expect(result.requiredHeaders).toEqual(
      expect.arrayContaining(['etag', 'idempotency-key']),
    );
  });

  it('P2-S03-AC-143 implements the IDA-02 role-facet interaction', () => {
    const result = native('role-facet');

    expect(result).toMatchObject(nativeInteraction);
    expect(result.requiredHeaders).toEqual(
      expect.arrayContaining(['etag', 'idempotency-key']),
    );
  });

  it('P2-S03-AC-144 commits the IDA-03 alias lifecycle and permanent state', () => {
    expect(edge('alias-lifecycle')).toMatchObject({
      decision: 'alias-lifecycle',
      activePersonRequired: true,
      uniqueConfusableHandle: true,
      handleCollision: 'reject',
      displayName: 'allowed',
      singleOwner: true,
      impliedFacet: 'performer',
      ownershipPeriod: 'dated',
      transfer: { bothPeopleRequired: true, windowDays: 7 },
      creationQuota: { limit: 5, windowDays: 30 },
      handleChangeQuota: { limit: 2, windowMonths: 12 },
      permanentHandleRedirect: true,
      retirement: { history: 'preserved', reactivation: false },
    });
  });

  it('P2-S03-AC-145 preserves canonical alias state across typed recovery paths', () => {
    expect(edge('alias-failure-recovery')).toMatchObject({
      decision: 'typed-failure-recovery',
      canonicalState: 'preserved',
      invalidAuthority: { outcome: 'denied', status: 403 },
      concurrency: { outcome: 'conflict', status: 409 },
      revocation: { outcome: 'invalidate-and-refetch' },
      deletion: { outcome: 'not-found' },
      cascade: { outcome: 'broadcast-invalidate-and-refetch' },
    });
  });
});
