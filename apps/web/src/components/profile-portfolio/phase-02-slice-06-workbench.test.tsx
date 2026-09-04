import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ProfilePortfolioEpkWorkbench from './ProfilePortfolioEpkWorkbench';

const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const RECORD_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';

const projection = {
  partyId: PARTY_ID,
  displayName: 'Ada Example',
  headline: 'Producer and arranger',
  layers: {
    header: { state: 'available', label: 'Ada Example' },
    now: [{ id: 'now-1', title: 'Current work', roleCodes: ['producer'] }],
    record: [
      { id: 'record-1', title: 'Recorded work', roleCodes: ['arranger'] },
    ],
    detail: [
      { id: 'detail-1', title: 'More detail', provenanceState: 'asserted' },
    ],
  },
  portfolio: [
    {
      id: 'portfolio-1',
      title: 'Credit-backed portfolio item',
      creditRef: 'credit-1',
      mediaRef: 'media-1',
      rightsBasis: 'ownership',
      rightsState: 'verified',
      roleCodes: ['producer'],
      listingState: 'listed',
      provenanceState: 'asserted',
    },
  ],
  reel: [
    {
      id: 'reel-1',
      title: 'Governed reel clip',
      creditRef: 'credit-1',
      mediaRef: 'media-1',
      rightsBasis: 'licence',
      rightsState: 'verified',
      roleCodes: ['producer'],
      mediaState: 'ready',
      listingState: 'listed',
    },
  ],
  legalIdentity: 'PRIVATE LEGAL IDENTITY MUST NOT RENDER',
  traderAddress: 'PRIVATE TRADER ADDRESS MUST NOT RENDER',
  privateAlias: 'PRIVATE ALIAS MUST NOT RENDER',
};

const record = {
  id: RECORD_ID,
  version: '7',
  state: 'active',
  provenance: [
    {
      source: 'profile-publication',
      evidence: 'projection-7',
      at: '2026-09-01T12:00:00.000Z',
      visibility: 'public',
    },
  ],
  projection,
};

const contractFields = {
  source: '02b-profile-portfolio-epk.md',
  fields: {
    PublicProfileResponse: ['partyId', 'projectionVersion', 'layers'],
    PortfolioListResponse: ['creditRef', 'rightsBasis', 'roleCodes'],
    ReelListResponse: ['mediaRef', 'rightsState', 'listingState'],
  },
};

const baseProps = {
  contractFields,
  variant: 'publicRead' as const,
  initial: {
    status: 'success' as const,
    data: [record],
    version: '7',
    stale: false,
  },
  actorId: PARTY_ID,
  actingPartyId: PARTY_ID,
  access: 'read-only' as const,
  query: { tab: 'profile', selected: RECORD_ID },
  selectedId: RECORD_ID,
  expectedVersion: '"7"',
  csrfToken: 'csrf-token',
  onCanonicalRefetch: async () => undefined,
};

const render = (overrides: Record<string, unknown> = {}): string =>
  renderToStaticMarkup(
    React.createElement(ProfilePortfolioEpkWorkbench, {
      ...baseProps,
      ...overrides,
    }),
  );

describe('P2-S06 ProfilePortfolioEpkWorkbench', () => {
  it('[P2-S06-AC-001..002] renders a viewer-safe fixed-layer projection and rights-bearing portfolio/reel facts', () => {
    const markup = render();
    expect(markup).toContain('data-workbench="profile-portfolio-epk"');
    expect(markup).toContain('Ada Example');
    expect(markup).toContain('Current work');
    expect(markup).toContain('Recorded work');
    expect(markup).toContain('More detail');
    expect(markup).toContain('credit-1');
    expect(markup).toContain('ownership');
    expect(markup).toContain('licence');
    expect(markup).toContain('producer');
    expect(markup).not.toContain('PRIVATE LEGAL IDENTITY');
    expect(markup).not.toContain('PRIVATE TRADER ADDRESS');
    expect(markup).not.toContain('PRIVATE ALIAS');
    expect(markup).not.toContain('Generate EPK');
    expect(markup).not.toContain('Share EPK');
  });

  it('[P2-S06-AC-111..113] keeps public composition URL-addressable, semantic, and explicit about source state', () => {
    const markup = render();
    expect(markup).toContain('aria-label=');
    expect(markup).toContain('data-selection-url=');
    expect(markup).toContain(RECORD_ID);
    expect(markup).toMatch(/<(?:a|button)\b/u);
    expect(markup.indexOf('Current work')).toBeLessThan(
      markup.indexOf('Recorded work'),
    );
    expect(markup.indexOf('Recorded work')).toBeLessThan(
      markup.indexOf('More detail'),
    );
    expect(markup).toContain('profile-portfolio-epk.md');
    expect(markup).toContain('7');
  });

  it('[P2-S06-AC-114..116] exposes only owner-capable asserted editing with version/idempotency boundaries', () => {
    const markup = render({
      variant: 'ownerFull',
      access: 'full',
    });
    expect(markup).toContain('<form');
    expect(markup).toContain('expected-version');
    expect(markup).toContain('idempotency');
    expect(markup).toContain('csrf');
    expect(markup).toContain('Save');
    expect(markup).toContain('Ada Example');
    expect(markup).not.toContain('attested fact');
    expect(markup).not.toContain('verification styling');
    expect(markup).not.toMatch(/<script\b|<style\b[^>]*>.*PRIVATE/isu);
  });

  it('[P2-S06-AC-117..119] curates only rights-eligible clips and preserves role/provenance while exposing native recovery controls', () => {
    const markup = render({
      variant: 'ownerFull',
      access: 'full',
    });
    expect(markup).toContain('rights');
    expect(markup).toContain('provenance');
    expect(markup).toContain('Unlist');
    expect(markup).toContain('emphasis');
    expect(markup).toContain('producer');
    expect(markup).toMatch(
      /<(?:button|a)\b[^>]*>(?:[^<]*(?:Retry|Review|Discard))/isu,
    );
    expect(markup).not.toContain('completeness score');
    expect(markup).not.toContain('career timeline density');
    expect(markup).not.toContain('aggregate provenance score');
  });

  it('[P2-S06-AC-003..008, P2-S06-AC-015..026, P2-S06-AC-039..044] keeps success output canonical and mutation forms bounded to the current actor/context', () => {
    const markup = render({ variant: 'ownerFull', access: 'full' });
    expect(markup).toContain(`data-actor-id="${PARTY_ID}"`);
    expect(markup).toContain(`data-acting-party-id="${PARTY_ID}"`);
    expect(markup).toContain('data-version="7"');
    expect(markup).not.toContain('actorId="');
    expect(markup).not.toContain('actingPartyId="');
    expect(markup).not.toContain('rawPayload');
  });

  it('[P2-S06-AC-009..014, P2-S06-AC-027..038, P2-S06-AC-045..079] renders every bounded async state without implying absent data', () => {
    const states = [
      { status: 'idle' },
      { status: 'loading' },
      { status: 'empty', data: [] },
      {
        status: 'error',
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Check the highlighted fields.',
          requestId: 'req-1',
        },
        retryable: false,
      },
      { status: 'optimistic-pending', data: [record], version: '7' },
      {
        status: 'optimistic-rollback',
        data: [record],
        version: '7',
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Review the current version.',
          requestId: 'req-2',
        },
      },
      {
        status: 'degraded',
        data: [record],
        version: '7',
        stale: true,
        error: {
          code: 'DEPENDENCY_UNAVAILABLE',
          message: 'Current data is temporarily unavailable.',
          requestId: 'req-3',
        },
      },
      { status: 'disabled' },
    ] as const;
    for (const state of states) {
      const markup = render({ initial: state });
      expect(markup).toContain(`data-state="${state.status}"`);
      if (state.status === 'degraded') expect(markup).toContain('req-3');
      if (state.status === 'error')
        expect(markup).toContain('VALIDATION_FAILED');
      if (state.status === 'optimistic-rollback')
        expect(markup).toContain('Review');
    }
  });

  it('[P2-S06-AC-080..110] keeps deferred EPK/share surfaces unmounted and route errors disclosure-safe', () => {
    const markup = render({
      variant: 'disabledPrerequisite',
      access: 'disabled',
    });
    expect(markup).toContain('disabled');
    expect(markup).toMatch(/(?:deferred|unavailable|prerequisite)/iu);
    expect(markup).not.toContain('/epk/');
    expect(markup).not.toContain('shareToken');
    expect(markup).not.toContain('private alias');
    expect(markup).not.toContain('providerReference');
  });

  it('[P2-S06-AC-001, P2-S06-AC-004, P2-S06-AC-111] encodes untrusted profile content and never treats markup as provenance', () => {
    const unsafeRecord = {
      ...record,
      projection: {
        ...projection,
        displayName: '<script>alert(1)</script>',
        headline: '<span class="verified">fake badge</span>',
        portfolio: [
          { ...projection.portfolio[0], title: 'javascript:alert(1)' },
        ],
      },
    };
    const markup = render({
      initial: { ...baseProps.initial, data: [unsafeRecord] },
    });
    expect(markup).not.toContain('<script>alert(1)</script>');
    expect(markup).not.toContain('<span class="verified">');
    expect(markup).not.toContain('javascript:alert(1)');
    expect(markup).toContain('&lt;script&gt;');
  });

  it('[P2-S06-AC-003..110] keeps deferred capability variants honest and never lets role labels authorize a command', () => {
    const variants = [
      ['forbiddenHidden', 'not-rendered'],
      ['disabledPrerequisite', 'disabled'],
      ['juniorRestricted', 'partial-hidden'],
      ['staffCaseScoped', 'read-only'],
      ['adminStepUp', 'disabled'],
    ] as const;
    for (const [variant, access] of variants) {
      const markup = render({ variant, access });
      expect(markup).toContain(`data-variant="${variant}"`);
      expect(markup).not.toContain('PRIVATE LEGAL IDENTITY');
      expect(markup).not.toContain('<form');
    }
  });
});
