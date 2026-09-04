import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import ProfilesVerificationRoute, {
  type ProfilesVerificationRouteProps,
} from '../../apps/web/src/components/profile-ownership/ProfilesVerificationRoute';
import ShadowClaimOwnershipWorkbench, {
  type ShadowClaimOwnershipWorkbenchProps,
} from '../../apps/web/src/components/profile-ownership/ShadowClaimOwnershipWorkbench';

const ROUTE = '/app/profiles-verification';
const OPAQUE_RECORD_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const OPAQUE_PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';
const REQUEST_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dc';

const contractFields = {
  source: '02a-shadow-claim-ownership.md',
  fields: {
    shadow: [
      'id',
      'partyId',
      'state',
      'sourceDomain',
      'sourceEntityId',
      'version',
    ],
    invitation: ['id', 'state', 'attemptNo', 'jobId', 'version'],
    remedy: ['accepted', 'action', 'scope', 'state', 'version'],
    claim: [
      'id',
      'state',
      'targetPartyId',
      'controlLevel',
      'windowEndsAt',
      'version',
    ],
    challenge: ['id', 'method', 'expiresAt', 'attemptsRemaining'],
    contest: [
      'id',
      'partyId',
      'state',
      'responseDueAt',
      'resolution',
      'version',
    ],
    transfer: [
      'id',
      'partyId',
      'recipientPersonId',
      'state',
      'reversalEndsAt',
      'version',
    ],
    ownership: ['partyId', 'controlLevel', 'basis', 'version'],
  },
} as const;

const successInitial = {
  status: 'success',
  data: [
    {
      id: OPAQUE_RECORD_ID,
      version: '7',
      state: 'invited',
      provenance: [
        {
          source: 'canonical',
          evidence: 'shadow-party-reference',
          at: '2026-09-01T00:00:00.000Z',
          visibility: 'authorized',
        },
      ],
      projection: {
        partyId: OPAQUE_PARTY_ID,
        sourceDomain: 'credits',
        sourceEntityId: 'credit-entity-17',
        roleCode: 'producer',
      },
    },
  ],
  version: '7',
  stale: false,
} satisfies ShadowClaimOwnershipWorkbenchProps['initial'];

const routeProps = {
  variant: 'appPage',
  actorId: 'human-s05',
  actingPartyId: 'party-s05',
  capabilitySnapshot: [
    'profile.shadow.create',
    'profile.invitation.dispatch',
    'profile.claim.prove',
  ],
  canonicalUrl: `${ROUTE}?tab=ownership&selected=${OPAQUE_RECORD_ID}`,
  initialQuery: { tab: 'ownership', selected: OPAQUE_RECORD_ID },
  requestId: REQUEST_ID,
} satisfies ProfilesVerificationRouteProps;

const workbenchProps = {
  contractFields,
  variant: 'ownerFull',
  initial: successInitial,
  actorId: 'human-s05',
  actingPartyId: 'party-s05',
  access: 'full',
  query: { tab: 'ownership', selected: OPAQUE_RECORD_ID },
  selectedId: OPAQUE_RECORD_ID,
  expectedVersion: '"7"',
  onCanonicalRefetch: async () => undefined,
} satisfies ShadowClaimOwnershipWorkbenchProps;

const renderRoute = (
  props: ProfilesVerificationRouteProps = routeProps,
): string =>
  renderToStaticMarkup(React.createElement(ProfilesVerificationRoute, props));

const renderWorkbench = (
  props: ShadowClaimOwnershipWorkbenchProps = workbenchProps,
): string =>
  renderToStaticMarkup(
    React.createElement(ShadowClaimOwnershipWorkbench, props),
  );

describe('Phase 2 Slice 05 profile ownership accessibility contract', () => {
  it('[P2-S05-AC-163..165, AC-201] renders useful server-first route HTML with safe navigation and focus targets', () => {
    const markup = renderRoute();

    expect(markup).toContain('href="#main-content"');
    expect(markup).toContain('Skip to main content');
    expect(markup).toMatch(/<main\b[^>]*id="main-content"[^>]*tabindex="-1"/u);
    expect(markup).toMatch(/<h1\b[^>]*id="page-title"[^>]*tabindex="-1"/u);
    expect(markup.match(/<main\b/gu)).toHaveLength(1);
    expect(markup.match(/<h1\b/gu)).toHaveLength(1);
    expect(markup).toContain('aria-label="Application navigation"');
    expect(markup).toContain('aria-label="Primary navigation"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain(ROUTE);
    expect(markup).toContain('data-server-first="true"');
    expect(markup).toContain('data-request-id="' + REQUEST_ID + '"');
  });

  it('[P2-S05-AC-202, AC-209, AC-214] exposes named list/detail regions, URL selection, native controls, and mobile-safe island boundaries', () => {
    const markup = renderWorkbench();

    expect(markup).toContain('data-workbench="shadow-claim-ownership"');
    expect(markup).toMatch(
      /aria-labelledby="shadow-claim-ownership-list-heading"/u,
    );
    expect(markup).toMatch(
      /aria-labelledby="shadow-claim-ownership-detail-heading"/u,
    );
    expect(markup).toContain('id="shadow-claim-ownership-list-heading"');
    expect(markup).toContain('id="shadow-claim-ownership-detail-heading"');
    expect(markup).toMatch(/<(?:a|button)\b[^>]*>/u);
    expect(markup).toContain('aria-selected="true"');
    expect(markup).toContain('Back to profile ownership records');
    expect(markup).toContain('data-selection-url="');
    expect(markup).toContain('data-layout="mobile-tablet-desktop"');
    expect(markup).toContain('data-reduced-motion="safe"');
  });

  it('[P2-S05-AC-019, P2-S05-AC-025, P2-S05-AC-042, P2-S05-AC-050, P2-S05-AC-203, P2-S05-AC-218..224] marks every active browser command as native JSON, CSRF-bound, idempotent, version-aware, and sanitized', () => {
    const markup = renderWorkbench();
    const operations = [
      'PRF-API-01',
      'PRF-API-02',
      'PRF-API-03',
      'PRF-API-04',
      'PRF-API-06',
      'PRF-API-07',
      'PRF-API-08',
    ];

    expect(markup).toMatch(/<form\b/u);
    expect(markup).toMatch(/<button\b[^>]*type="submit"/u);
    for (const operation of operations) {
      expect(markup).toContain(`data-operation="${operation}"`);
    }
    const forms = markup.match(/<form\b[^>]*data-operation="[^"]+"[^>]*>/gu);
    expect(forms).not.toBeNull();
    expect(forms?.length).toBeGreaterThanOrEqual(7);
    for (const form of forms ?? []) {
      expect(form).toContain('data-json-body="true"');
      expect(form).toContain('data-idempotency="required"');
      if (form.includes('data-operation="PRF-API-03"')) {
        expect(form).toContain('data-csrf="not-required"');
        expect(form).toContain('data-if-match="not-required"');
      } else {
        expect(form).toContain('data-csrf="required"');
        expect(form).toContain('data-if-match="required"');
      }
    }
    expect(markup).toMatch(/<label\b[^>]*for="[^"]+"/u);
    expect(markup).not.toContain('data-contact-value=');
    expect(markup).not.toContain('person@example');
    expect(markup).not.toContain('evidenceBody');
    expect(markup).not.toContain('providerToken');
  });

  it('[P2-S05-AC-107..117, P2-S05-AC-220] renders shadow creation, advisory matching, invitation, and account-free remedy as structured flows', () => {
    const markup = renderWorkbench();

    expect(markup).toContain('Create shadow by reference');
    expect(markup).toContain('Match possible duplicate');
    expect(markup).toContain('Dispatch invitation');
    expect(markup).toContain('Account-free suppress or correct');
    expect(markup).toContain('data-operation="PRF-API-03"');
    expect(markup).toContain('name="pointerToken"');
    expect(markup).toContain('name="scope"');
    expect(markup).toContain('name="proofKind"');
    expect(markup).toContain('data-authentication="anonymous"');
    expect(markup).toContain('Matching is advisory');
    expect(markup).toContain('data-uniqueness="not-a-constraint"');
    expect(markup).toContain('name="sourceDomain"');
    expect(markup).toContain('name="sourceEntityId"');
    expect(markup).toContain('name="roleCode"');
    expect(markup).toContain('name="instrumentCode"');
  });

  it('[P2-S05-AC-119..127, P2-S05-AC-228] renders claim start, challenge, proof, and conversion with disclosure-safe outputs', () => {
    const markup = renderWorkbench();

    expect(markup).toContain('Start or resume claim');
    expect(markup).toContain('Complete claim proof');
    expect(markup).toContain('Convert provisional claim');
    expect(markup).toContain('name="claimKind"');
    expect(markup).toContain('name="method"');
    expect(markup).toContain('name="routeId"');
    expect(markup).toContain('name="attesterPersonId"');
    expect(markup).toContain('name="challengeId"');
    expect(markup).toContain('name="code"');
    expect(markup).toContain('inputMode="numeric"');
    expect(markup).toContain('maxLength="6"');
    expect(markup).toContain('name="reasonCode"');
    expect(markup).toContain('No challenge hash or destination is shown');
    expect(markup).not.toContain('challengeHash');
    expect(markup).not.toContain('maskedDestination');
  });

  it('[P2-S05-AC-128..145, P2-S05-AC-208..216] keeps deferred contest, transfer, and reversal flows typed and disabled', () => {
    const markup = renderWorkbench();

    for (const operation of [
      'PRF-API-09',
      'PRF-API-10',
      'PRF-API-11',
      'PRF-API-12',
      'PRF-API-13',
      'PRF-API-14',
      'PRF-API-15',
      'PRF-API-16',
    ]) {
      expect(markup).toContain(`data-operation="${operation}"`);
      expect(markup).not.toMatch(
        new RegExp(`<form\\b[^>]*data-operation="${operation}"`, 'u'),
      );
    }
    expect(markup).toContain('data-capability-state="disabled"');
    expect(markup).toContain('data-deferred="true"');
    expect(markup).toMatch(
      /not available in this phase|disabled prerequisite/iu,
    );
    expect(markup).not.toContain('recipient@example');
    expect(markup).not.toContain('evidenceBody');
  });

  it('[P2-S05-AC-147, P2-S05-AC-152, P2-S05-AC-156, P2-S05-AC-159..160] links typed failure, pending, rollback, and conflict recovery to focusable status', () => {
    const markup = renderWorkbench({
      ...workbenchProps,
      initial: {
        status: 'error',
        error: {
          code: 'VERSION_CONFLICT',
          message: 'The ownership state changed. Refresh and retry.',
          requestId: REQUEST_ID,
          details: {
            violations: [
              {
                path: '/expectedVersion',
                code: 'version_mismatch',
                message: 'Review the current version.',
              },
            ],
          },
        },
        retryable: false,
      },
    });

    expect(markup).toContain('Check the highlighted fields.');
    expect(markup).toContain('The ownership state changed. Refresh and retry.');
    expect(markup).toMatch(/aria-invalid="true"/u);
    expect(markup).toMatch(/aria-describedby="[^"]+"/u);
    expect(markup).toMatch(/href="#[^"]*(?:error|invalid)[^"]*"/iu);
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toMatch(/role="(?:status|alert)"/u);
    expect(markup).toContain('Request ID: ' + REQUEST_ID);
    expect(markup).toMatch(
      /<(?:button|a)\b[^>]*>[^<]*(?:Retry|Review|Refresh)/iu,
    );
    expect(markup).toContain('data-state="error"');
    expect(markup).toContain('data-state="optimistic-pending"');
    expect(markup).toContain('data-state="optimistic-rollback"');
    expect(markup).toContain('data-state="conflict"');
  });

  it('[P2-S05-AC-166..197] applies disclosure-safe access variants without leaking protected controls', () => {
    const variants = [
      'publicRead',
      'entitledRead',
      'ownerFull',
      'guardianMandate',
      'juniorRestricted',
      'businessMandate',
      'staffCaseScoped',
      'adminStepUp',
      'forbiddenHidden',
      'disabledPrerequisite',
    ] as const;

    for (const variant of variants) {
      const markup = renderWorkbench({
        ...workbenchProps,
        variant,
        access:
          variant === 'forbiddenHidden'
            ? 'not-rendered'
            : variant === 'disabledPrerequisite'
              ? 'disabled'
              : variant === 'publicRead' || variant === 'entitledRead'
                ? 'read-only'
                : 'full',
      });
      expect(markup).toContain(`data-variant="${variant}"`);
      expect(markup).not.toContain('contactRouteValue');
      expect(markup).not.toContain('protected evidence body');
      if (variant === 'forbiddenHidden') {
        expect(markup).not.toContain('Dispatch invitation');
        expect(markup).not.toContain('Complete claim proof');
        expect(markup).toContain('data-capability-state="not-rendered"');
      }
      if (variant === 'disabledPrerequisite') {
        expect(markup).toContain('data-capability-state="disabled"');
        expect(markup).toMatch(/prerequisite|disabled|step-up/iu);
      }
    }
  });

  it('[P2-S05-AC-198..207, P2-S05-AC-213..217] preserves responsive order, target size, tables, and reduced-motion semantics', () => {
    const markup = renderWorkbench();

    expect(markup).toContain('data-layout="mobile-tablet-desktop"');
    expect(markup).toContain('data-breakpoint="desktop"');
    expect(markup).toContain('data-columns="12"');
    expect(markup).toContain('data-composition="list-detail-action-rail"');
    expect(markup).toContain('Back to profile ownership records');
    expect(markup).toContain('min-inline-size: 44px');
    expect(markup).toContain('data-no-horizontal-scroll="true"');
    expect(markup).toMatch(/<table\b/u);
    expect(markup).toMatch(/<caption\b/u);
    expect(markup).toMatch(/<th\b[^>]*scope="col"/u);
    expect(markup).toMatch(/aria-sort="(?:ascending|descending|none)"/u);
    expect(markup).toMatch(/prefers-reduced-motion/iu);
    expect(markup).toContain('data-reduced-motion="safe"');
  });

  it('[P2-S05-AC-252..253] renders the complete async/access state vocabulary and contract provenance', () => {
    const states = [
      'idle',
      'loading',
      'error',
      'empty',
      'success',
      'optimistic-pending',
      'optimistic-rollback',
      'disabled',
      'degraded',
    ];
    const markup = renderWorkbench();

    for (const state of states)
      expect(markup).toContain(`data-state="${state}"`);
    expect(markup).toContain(
      'data-contract-source="02a-shadow-claim-ownership.md"',
    );
    expect(markup).toContain('data-version="7"');
    expect(markup).toContain('shadow-party-reference');
    expect(markup).toContain('Server-authorized provenance');
    expect(markup).toContain('Allowed actions');
  });
});
