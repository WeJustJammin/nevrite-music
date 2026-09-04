import { describe, expect, it } from 'vitest';

import { evaluateIaPolicy } from './ia-policy';

const native = (flow: 'alias' | 'acting-context') =>
  evaluateIaPolicy({ kind: 'native', flow });

const edge = (name: string) => evaluateIaPolicy({ kind: 'edge', name });

describe('Phase 2 Slice 03 IA01 native interactions and edge policy', () => {
  it('P2-S03-AC-146 keeps alias native-form focus and recovery server-authoritative', () => {
    const result = native('alias');

    expect(result).toMatchObject({
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
    });
    expect(result.requiredHeaders).toEqual(
      expect.arrayContaining(['etag', 'idempotency-key']),
    );
  });

  it('P2-S03-AC-147 binds only a deliberately confirmed context held by the current human', () => {
    expect(edge('context-switch-valid')).toMatchObject({
      decision: 'bind',
      authority: 'selected-context',
      deliberateConfirmation: true,
      scope: 'per-tab-and-device',
      deepLink: 'suggest-only',
    });
  });

  it('P2-S03-AC-148 preserves typed failure and recovery for context invalidation cascades', () => {
    expect(edge('context-switch-failure-recovery')).toMatchObject({
      invalidAuthority: { outcome: 'denied', status: 403 },
      concurrency: { outcome: 'conflict', status: 409 },
      revocation: { outcome: 'invalidate-and-switch-self' },
      deletion: { outcome: 'not-found' },
      cascade: { outcome: 'broadcast-invalidate-and-refetch' },
    });
  });

  it('P2-S03-AC-149 keeps acting-context native-form focus, headers, canonical result, and recovery', () => {
    const result = native('acting-context');

    expect(result).toMatchObject({
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
    });
    expect(result.requiredHeaders).toEqual(
      expect.arrayContaining(['etag', 'idempotency-key']),
    );
  });

  it('P2-S03-AC-150 never auto-merges matching provider identities', () => {
    expect(edge('provider-identities-match')).toMatchObject({
      decision: 'manual-merge-required',
      autoMerge: false,
      authority: 'none',
      nextAction: 'shard-00-merge-flow',
    });
  });

  it('P2-S03-AC-151 serializes concurrent facet changes as single-facet CAS', () => {
    expect(edge('concurrent-facet-change')).toMatchObject({
      decision: 'single-facet-cas',
      mutation: 'compare-and-swap',
      lostUpdate: false,
    });
  });

  it('P2-S03-AC-152 conflicts facet removal with live obligations but preserves history', () => {
    const result = edge('facet-removal-live-obligation');

    expect(result).toMatchObject({
      decision: 'conflict',
      history: 'preserved',
      deleteHistory: false,
    });
    expect(result.obligationCodes).toEqual(
      expect.arrayContaining(['live_obligation']),
    );
  });

  it('P2-S03-AC-153 rejects a confusable normalized alias handle while allowing display names', () => {
    expect(edge('confusable-alias-handle')).toMatchObject({
      decision: 'reject-normalized-collision',
      normalizedCollision: true,
      displayName: 'allowed',
    });
  });

  it('P2-S03-AC-154 rejects stale alias transfer acceptance without changing ownership', () => {
    expect(edge('stale-alias-transfer-acceptance')).toMatchObject({
      decision: 'reject-stale-acceptance',
      ownershipPeriod: 'unchanged',
      reissueOffer: true,
    });
  });

  it('P2-S03-AC-155 fails closed for a revoked cached organization context and returns to self', () => {
    expect(edge('revoked-cached-organization-context')).toMatchObject({
      decision: 'fail-closed',
      display: 'stale-display-allowed',
      submit: 'rejected',
      switchedContext: 'self',
      explanation: true,
    });
  });

  it('P2-S03-AC-156 treats a deep-linked context as preselection only', () => {
    expect(edge('deep-link-context-suggestion')).toMatchObject({
      decision: 'preselect-only',
      switched: false,
      executed: false,
      deliberateConfirmationRequired: true,
    });
  });

  it('P2-S03-AC-157 retains an organization created before a commit timeout and opens a merge offer asynchronously', () => {
    expect(edge('duplicate-organization-after-timeout')).toMatchObject({
      decision: 'retain-created-party',
      mergeOffer: 'async-open',
      silentCombine: false,
    });
  });

  it('P2-S03-AC-158 makes the last-type organization a typeless collective without deleting history or links', () => {
    expect(edge('last-organization-type-removed')).toMatchObject({
      decision: 'typeless-collective',
      history: 'preserved',
      links: 'preserved',
    });
  });

  it('P2-S03-AC-159 hides a rejected membership assertion while retaining evidence and granting no authority', () => {
    expect(edge('membership-assertion-rejected')).toMatchObject({
      decision: 'reject-membership',
      publicProjection: 'hidden',
      protectedEvidence: 'retained',
      dispute: 'route',
      authority: 'none',
    });
  });

  it('P2-S03-AC-160 revokes current membership immediately while disputing its historical departure date', () => {
    expect(edge('retroactive-departure-contested')).toMatchObject({
      decision: 'revoke-now-dispute-history',
      currentAuthority: 'revoked',
      historicalDate: 'disputed',
      rewriteHistory: false,
    });
  });

  it('P2-S03-AC-161 warns on overlapping representation scopes and never infers exclusivity', () => {
    const result = edge('overlapping-representation-scopes');

    expect(result).toMatchObject({
      decision: 'warn-and-acknowledge',
      scopes: 'coexist',
      exclusivity: 'never-inferred',
    });
    expect(result.dimensions).toEqual(
      expect.arrayContaining(['term', 'territory', 'domain']),
    );
  });

  it('P2-S03-AC-162 permits non-monetary representation acts but fails closed without a monetary ceiling', () => {
    expect(edge('representation-without-monetary-ceiling')).toMatchObject({
      decision: 'monetary-fail-closed',
      nonMonetary: 'allowed',
      monetary: 'escalate',
      ceiling: 'required',
    });
  });

  it('P2-S03-AC-163 revokes dependent representation sub-grants while retaining attribution of past acts', () => {
    expect(edge('grantor-loses-authority')).toMatchObject({
      decision: 'revoke-dependent-subgrants',
      pastActions: 'attributable',
    });
  });

  it('P2-S03-AC-164 keeps a member pending until current terms are accepted and excludes governance confirmation', () => {
    expect(edge('member-terms-not-accepted')).toMatchObject({
      decision: 'pending-terms',
      authority: 'none',
      governanceConfirmer: false,
    });
  });

  it('P2-S03-AC-165 freezes a governance proposal and recalculates parties in a superseding version', () => {
    expect(edge('governance-member-lost-mid-vote')).toMatchObject({
      decision: 'freeze-and-supersede',
      recalculation: 'required-parties',
      mutateOriginal: false,
    });
  });

  it('P2-S03-AC-166 permits terminal dissolution with explicit unresolved dispositions and policy-governed record access', () => {
    expect(edge('dissolution-unresolved-dispositions')).toMatchObject({
      decision: 'terminal-with-unresolved-dispositions',
      unresolvedDispositions: true,
      records: 'accessible-by-policy',
    });
  });

  it('P2-S03-AC-167 removes routing and verified status from both parties claiming the same identifier', () => {
    expect(edge('duplicate-identifier-claim')).toMatchObject({
      decision: 'quarantine-routing',
      partiesStatus: 'unverified',
      registryResolution: 'required',
    });
  });

  it('P2-S03-AC-168 preserves local identifier claims and prior evidence while registry verification is delayed', () => {
    expect(edge('identifier-registry-unavailable')).toMatchObject({
      decision: 'verification-delayed',
      localClaim: 'preserved',
      priorEvidence: 'preserved',
      downgradeVerified: false,
    });
  });

  it('P2-S03-AC-169 makes a false or unverified death report review-only with no public or authority change', () => {
    expect(edge('false-death-report')).toMatchObject({
      decision: 'protected-review',
      publicOrAuthorityChange: false,
      rateLimit: true,
    });
  });

  it('P2-S03-AC-170 revokes deceased authority while preserving rights and blocking estate administration pending legal authority', () => {
    expect(edge('death-without-successor')).toMatchObject({
      decision: 'revoke-deceased-authority',
      rights: 'preserved',
      estateAdministration: 'blocked-until-verified-legal-authority',
    });
  });

  it('P2-S03-AC-171 suppresses an approved estate public profile only to a minimal provenance tombstone under counsel-gated policy', () => {
    expect(edge('estate-public-removal')).toMatchObject({
      decision: 'suppress-optional-profile',
      tombstone: 'minimal-citation',
      thirdPartyProvenance: 'retained',
      legalPolicy: 'counsel-gated',
    });
  });
});
