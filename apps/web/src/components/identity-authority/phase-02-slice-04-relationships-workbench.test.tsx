import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { responsiveLayoutForWidth } from '../../../../../packages/ui/src/infrastructure/presentation-responsive';
import RelationshipsAuthorityGovernanceWorkbench, {
  type RelationshipsAuthorityGovernanceWorkbenchProps,
} from './RelationshipsAuthorityGovernanceWorkbench';
import {
  createIdentityAuthorityInvalidationMessage,
  isIdentityAuthorityInvalidationMessage,
} from './identity-authority-routes';

const refetch = async (): Promise<void> => undefined;

const record = (
  id: string,
  state: string,
  projection: Readonly<Record<string, unknown>>,
) => ({
  id,
  version: '7',
  state,
  provenance: [
    {
      source: 'identity-authority-rpc',
      evidence: 'canonical',
      at: '2026-09-01T00:00:00.000Z',
      visibility: 'authorized',
    },
  ],
  projection,
});

const props = {
  contractFields: {
    source: '01c-relationships-authority-governance.md',
    fields: {},
  },
  variant: 'ownerFull',
  initial: {
    status: 'success',
    data: [
      record('organization-s04', 'active', {
        organizationId: 'organization-s04',
        lifecycle: 'active',
        typeCodes: ['band'],
        ownershipState: 'owned',
        version: '7',
        etag: '"7"',
        evidenceBody: 'protected-evidence-must-not-render',
      }),
      record('assignment-s04', 'active', {
        assignmentId: 'assignment-s04',
        organizationId: 'organization-s04',
        typeCode: 'band',
        startsAt: '2026-09-01T00:00:00.000Z',
        endsAt: null,
      }),
      record('tenure-s04', 'invited', {
        tenureId: 'tenure-s04',
        organizationId: 'organization-s04',
        personId: 'person-s04',
        state: 'invited',
        provenance: 'invitation',
        startsOn: '2026-09-01',
        endsOn: null,
        acceptedAt: null,
        revokedAt: null,
      }),
    ] as const,
    version: '7',
    stale: false,
  },
  actorId: 'human-s04',
  actingPartyId: 'organization-s04',
  access: 'full',
  query: { tab: 'relationships', selected: 'organization-s04' },
  selectedId: 'organization-s04',
  expectedVersion: '"7"',
  onCanonicalRefetch: refetch,
} satisfies RelationshipsAuthorityGovernanceWorkbenchProps;

const render = (
  input: RelationshipsAuthorityGovernanceWorkbenchProps = props,
): string =>
  renderToStaticMarkup(
    React.createElement(RelationshipsAuthorityGovernanceWorkbench, input),
  );

describe('P2-S04 organization, type, and membership workbench RED contract', () => {
  it('[P2-S04-AC-146, AC-148] renders the IDA-06 create-organization form with explicit modes and registry types', () => {
    const markup = render();

    expect(markup).toContain('Create organization');
    expect(markup).toContain('Creation mode');
    expect(markup).toContain('Self-member');
    expect(markup).toContain('Shadow or custodial');
    expect(markup).toContain('External reference');
    expect(markup).toContain('Organization types');
    expect(markup).toContain('typeCodes');
    expect(markup).toMatch(/<form\b/);
  });

  it('[P2-S04-AC-149, AC-151] renders one-at-a-time TYPE-01/TYPE-02 commands with organization version and idempotency context', () => {
    const markup = render();

    expect(markup).toContain('Add organization type');
    expect(markup).toContain('Remove organization type');
    expect(markup).toContain('Organization type');
    expect(markup).toContain('typeCode');
    expect(markup).toContain('If-Match');
    expect(markup).toContain('Idempotency-Key');
    expect(markup).toContain('TYPE-01');
    expect(markup).toContain('TYPE-02');
  });

  it('[P2-S04-AC-152, AC-154] renders invitation, historical assertion, acceptance, end, and capacity commands with state labels', () => {
    const markup = render();

    for (const label of [
      'Invite membership',
      'Assert historical membership',
      'Accept membership',
      'End membership',
      'Add capacity period',
    ]) {
      expect(markup).toContain(label);
    }
    for (const field of [
      'personId',
      'startsOn',
      'endsOn',
      'termsVersionId',
      'termsHash',
      'capacity',
      'inviteExpiresAt',
      'evidenceRef',
      'counterpartConfirmationId',
      'reasonCode',
    ]) {
      expect(markup).toContain(`name="${field}"`);
    }
    expect(markup).toContain('invited');
    expect(markup).toContain('canonical');
    expect(markup).not.toContain('protected-evidence-must-not-render');
  });

  it('[P2-S04-AC-147, AC-150, AC-153] maps typed failures to linked form errors and preserves a safe draft for retry', () => {
    const errorProps = {
      ...props,
      initial: {
        status: 'error',
        error: {
          code: 'ORGANIZATION_VERSION_CONFLICT',
          message: 'The organization changed. Review the current version.',
          requestId: 'request-s04-conflict',
          details: { expectedVersion: '"7"', currentVersion: '"8"' },
        },
        retryable: false,
      },
    } satisfies RelationshipsAuthorityGovernanceWorkbenchProps;
    const markup = render(errorProps);

    expect(markup).toContain('Check the highlighted fields.');
    expect(markup).toContain('Review changes');
    expect(markup).toContain('Reapply');
    expect(markup).toContain('Discard');
    expect(markup).toContain('request-s04-conflict');
    expect(markup).toMatch(/aria-describedby="[^"]+"/);
    expect(markup).toMatch(/aria-invalid="true"/);
    expect(markup).toContain('Current server version');
  });

  it('[P2-S04-AC-148, AC-151, AC-154] keeps native controls, named regions, result focus, and responsive action order', () => {
    const markup = render();

    expect(markup).toMatch(/<form\b/);
    expect(markup).toMatch(/<button\b/);
    expect(markup).toMatch(/<label\b/);
    expect(markup).toMatch(/aria-live="polite"/);
    expect(markup).toMatch(/aria-atomic="true"/);
    expect(markup).toContain('Result');
    expect(markup).toContain('Back to list');

    expect(responsiveLayoutForWidth(320)).toMatchObject({
      breakpoint: 'mobile',
      columns: 4,
      composition: 'stacked',
      backActionFirst: true,
      minimumTargetPx: 44,
    });
    expect(responsiveLayoutForWidth(900)).toMatchObject({
      breakpoint: 'tablet',
      columns: 8,
      composition: 'collapsible_sidebar',
      preservesRowDetails: true,
    });
    expect(responsiveLayoutForWidth(1280)).toMatchObject({
      breakpoint: 'desktop',
      columns: 12,
      composition: 'list_detail_action_rail',
      virtualizeAboveRows: 100,
    });
  });

  it('[P2-S04-AC-148, AC-151, AC-154] limits cross-tab messages to invalidation hints and preserves explicit relationship routing', () => {
    const message = createIdentityAuthorityInvalidationMessage({
      tab: 'relationships',
      entityId: 'organization-s04',
      hintedVersion: '8',
    });

    expect(message).toEqual({
      kind: 'invalidate',
      tab: 'relationships',
      entityId: 'organization-s04',
      hintedVersion: '8',
      carriesCanonicalState: false,
    });
    expect(isIdentityAuthorityInvalidationMessage(message)).toBe(true);
    expect(
      isIdentityAuthorityInvalidationMessage({
        ...message,
        canonicalOrganization: { lifecycle: 'active' },
      }),
    ).toBe(false);
    expect(message).not.toHaveProperty('canonicalOrganization');
  });

  it('[P2-S04-AC-116..145] does not render organization commands without a server-selected capability variant', () => {
    const hidden = render({ ...props, access: 'not-rendered' });

    expect(hidden).toBe('');
  });
});
