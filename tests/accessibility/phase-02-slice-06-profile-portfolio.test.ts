import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import ProfilePortfolioEpkWorkbench from '../../apps/web/src/components/profile-portfolio/ProfilePortfolioEpkWorkbench';

const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d4';
const RECORD_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';

const props = {
  contractFields: {
    source: '02b-profile-portfolio-epk.md',
    fields: { PublicProfileResponse: ['partyId', 'layers'] },
  },
  variant: 'publicRead' as const,
  initial: {
    status: 'success' as const,
    version: '7',
    data: [
      {
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
        projection: {
          partyId: PARTY_ID,
          displayName: 'Ada Example',
          layers: {
            header: { state: 'available', label: 'Ada Example' },
            now: { state: 'available', items: ['Current work'] },
            record: { state: 'available', items: ['Recorded work'] },
            detail: { state: 'empty', items: [] },
          },
          reel: [
            {
              title: 'Accessible clip',
              creditRef: 'credit-1',
              rightsBasis: 'licence',
              rightsState: 'verified',
              mediaState: 'ready',
              captions: 'captions.vtt',
              transcript: 'transcript.txt',
            },
          ],
          legalIdentity: 'MUST NOT RENDER',
          traderAddress: 'MUST NOT RENDER',
        },
      },
    ],
  },
  actorId: PARTY_ID,
  actingPartyId: PARTY_ID,
  access: 'read-only' as const,
  query: { tab: 'profile', selected: RECORD_ID },
  selectedId: RECORD_ID,
  expectedVersion: '"7"',
  csrfToken: 'csrf',
  onCanonicalRefetch: async () => undefined,
};

const render = (overrides: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    React.createElement(ProfilePortfolioEpkWorkbench, {
      ...props,
      ...overrides,
    }),
  );

describe('P2-S06 profile portfolio accessibility contract', () => {
  it('[P2-S06-AC-080..088, P2-S06-AC-111..113] exposes named landmarks, one heading, skip target, and URL-addressable native selection', () => {
    const markup = render();
    expect(markup).toContain('<section');
    expect(markup).toMatch(/<h[12]\b/iu);
    expect(markup).toMatch(/href="#(?:main|profile-portfolio)/iu);
    expect(markup).toMatch(/id="(?:main|profile-portfolio)/iu);
    expect(markup).toContain('aria-label=');
    expect(markup).toContain('data-selection-url=');
    expect(markup).toMatch(/<(?:a|button)\b/iu);
  });

  it('[P2-S06-AC-113, P2-S06-AC-116, P2-S06-AC-119] links errors and status announcements without focus theft', () => {
    const markup = render({
      variant: 'ownerFull',
      access: 'full',
      initial: {
        ...props.initial,
        status: 'error',
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Check the highlighted fields.',
          requestId: 'slice06-request',
          details: {
            violations: [
              { path: 'headline', message: 'Headline is too long.' },
            ],
          },
        },
        retryable: false,
      },
    });
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('slice06-request');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby=');
    expect(markup).not.toContain('autofocus');
  });

  it('[P2-S06-AC-001..002, P2-S06-AC-111..119] uses text/non-color provenance and rights cues and excludes private fields', () => {
    const markup = render();
    expect(markup).toMatch(
      /(?:asserted|attested|verified|rights|provenance)/iu,
    );
    expect(markup).not.toContain('MUST NOT RENDER');
    expect(markup).not.toMatch(
      /(?:color|background-color)\s*:\s*(?:red|green|#(?:f00|0f0))/iu,
    );
    expect(markup).toMatch(/(?:credit|rights|licence)/iu);
  });

  it('[P2-S06-AC-080..088, P2-S06-AC-111..119] keeps media keyboard-safe, captioned, non-autoplay, and target-sized', () => {
    const markup = render();
    expect(markup).not.toContain('autoplay');
    expect(markup).toMatch(/(?:captions|transcript)/iu);
    expect(markup).toMatch(/(?:min-inline-size|min-width)\s*:\s*44px/iu);
    expect(markup).toMatch(/(?:prefers-reduced-motion|transition:\s*none)/iu);
    expect(markup).not.toContain('pointer-only');
  });

  it('[P2-S06-AC-003..110] keeps inaccessible and unauthorized variants explicit, bounded, and non-rendering', () => {
    const hidden = render({
      variant: 'forbiddenHidden',
      access: 'not-rendered',
    });
    expect(hidden).not.toContain('Ada Example');
    expect(hidden).not.toContain('MUST NOT RENDER');
    expect(hidden).not.toContain('<form');
    const disabled = render({
      variant: 'disabledPrerequisite',
      access: 'disabled',
    });
    expect(disabled).toMatch(/(?:disabled|prerequisite|unavailable)/iu);
    expect(disabled).not.toContain('<form');
  });
});
