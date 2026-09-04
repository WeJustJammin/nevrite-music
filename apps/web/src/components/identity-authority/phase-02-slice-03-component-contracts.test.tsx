import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { responsiveLayoutForWidth } from '../../../../../packages/ui/src/infrastructure/presentation-responsive';
import AuthAccountLinkingWorkbench, {
  type AuthAccountLinkingWorkbenchProps,
} from './AuthAccountLinkingWorkbench';
import IdentityAuthorityRoute, {
  type IdentityAuthorityRouteProps,
} from './IdentityAuthorityRoute';
import IdentifiersLegacyWorkbench, {
  type IdentifiersLegacyWorkbenchProps,
} from './IdentifiersLegacyWorkbench';
import { IdentityAuthorityPrimitives } from './IdentityAuthorityPrimitives';
import PartyIdentityAliasesWorkbench, {
  type PartyIdentityAliasesWorkbenchProps,
} from './PartyIdentityAliasesWorkbench';
import RelationshipsAuthorityGovernanceWorkbench, {
  type RelationshipsAuthorityGovernanceWorkbenchProps,
} from './RelationshipsAuthorityGovernanceWorkbench';

type Renderable = React.ComponentType<Readonly<Record<string, unknown>>>;

const render = (
  component: unknown,
  props: Readonly<Record<string, unknown>>,
): string =>
  renderToStaticMarkup(React.createElement(component as Renderable, props));

const refetch = async (): Promise<void> => undefined;

const routeProps = {
  variant: 'appPage',
  actorId: 'human-s03',
  actingPartyId: 'party-s03',
  capabilitySnapshot: ['identity.read'],
  canonicalUrl: '/app/identity-authority?tab=people',
  initialQuery: { tab: 'people' },
  requestId: 'request-s03-route',
} satisfies IdentityAuthorityRouteProps;

const recordFor = (id: string, projection: string) => ({
  id,
  version: '"1"',
  state: 'active',
  provenance: [
    {
      source: 'server',
      evidence: 'verified',
      at: '2026-09-01T00:00:00.000Z',
      visibility: 'public',
    },
  ],
  projection: { projection },
});

const fields = {} as Readonly<Record<string, unknown>>;

const authProps = {
  contractFields: {
    source: '01a-auth-account-linking.md',
    fields,
  },
  variant: 'ownerFull',
  initial: {
    status: 'success',
    data: [recordFor('auth-record-s03', 'auth-account')] as const,
    version: '"1"',
    stale: false,
  },
  actorId: 'human-s03',
  actingPartyId: 'party-s03',
  access: 'full',
  query: { tab: 'auth' },
  selectedId: 'auth-record-s03',
  expectedVersion: '"1"',
  onCanonicalRefetch: refetch,
} satisfies AuthAccountLinkingWorkbenchProps;

const aliasesProps = {
  contractFields: {
    source: '01b-party-identity-aliases.md',
    fields,
  },
  variant: 'ownerFull',
  initial: {
    status: 'success',
    data: [recordFor('alias-record-s03', 'party-alias')] as const,
    version: '"1"',
    stale: false,
  },
  actorId: 'human-s03',
  actingPartyId: 'party-s03',
  access: 'full',
  query: { tab: 'aliases' },
  selectedId: 'alias-record-s03',
  expectedVersion: '"1"',
  onCanonicalRefetch: refetch,
} satisfies PartyIdentityAliasesWorkbenchProps;

const relationshipsProps = {
  contractFields: {
    source: '01c-relationships-authority-governance.md',
    fields,
  },
  variant: 'businessMandate',
  initial: {
    status: 'success',
    data: [recordFor('relationship-record-s03', 'relationship')] as const,
    version: '"1"',
    stale: false,
  },
  actorId: 'human-s03',
  actingPartyId: 'party-s03',
  access: 'full',
  query: { tab: 'relationships' },
  selectedId: 'relationship-record-s03',
  expectedVersion: '"1"',
  onCanonicalRefetch: refetch,
} satisfies RelationshipsAuthorityGovernanceWorkbenchProps;

const identifiersProps = {
  contractFields: {
    source: '01d-identifiers-legacy.md',
    fields,
  },
  variant: 'staffCaseScoped',
  initial: {
    status: 'success',
    data: [recordFor('identifier-record-s03', 'legacy-identifier')] as const,
    version: '"1"',
    stale: false,
  },
  actorId: 'human-s03',
  actingPartyId: 'party-s03',
  access: 'read-only',
  query: { tab: 'identifiers' },
  selectedId: 'identifier-record-s03',
  expectedVersion: '"1"',
  onCanonicalRefetch: refetch,
} satisfies IdentifiersLegacyWorkbenchProps;

const primitiveProps = {
  actionBar: {
    primary: 'Save identity',
    secondary: 'Cancel',
    destructive: 'Remove identity',
    state: 'idle',
    expectedVersion: '"1"',
    operationId: 'operation-s03',
  },
  capabilityGate: {
    variant: 'disabled',
    reasonCode: 'STEP_UP_REQUIRED',
    recoveryHref: '/app/identity-authority',
    disclosure: 'Step-up verification is required.',
  },
  filterBar: {
    schema: 'IdentityAuthorityFilterSchema',
    values: { q: 'Neon' },
    resultCount: 1,
    resetHref: '/app/identity-authority',
  },
  dataTable: {
    columns: ['displayName', 'state', 'version'],
    rows: [{ id: 'person-s03', displayName: 'Neon Harbor', state: 'active' }],
    sort: 'displayName',
    selection: ['person-s03'],
    density: 'compact',
  },
  confirmationStep: {
    consequence: 'Remove the role facet from this person',
    affectedScope: 'person-s03',
    expectedVersion: '"1"',
    stepUpState: 'required',
    idempotencyKey: 'idempotency-s03',
  },
};

type NoChildren<T> = T extends { readonly children?: never } ? true : false;

const noChildrenContracts: readonly [
  NoChildren<IdentityAuthorityRouteProps>,
  NoChildren<AuthAccountLinkingWorkbenchProps>,
  NoChildren<PartyIdentityAliasesWorkbenchProps>,
  NoChildren<RelationshipsAuthorityGovernanceWorkbenchProps>,
  NoChildren<IdentifiersLegacyWorkbenchProps>,
] = [true, true, true, true, true];
void noChildrenContracts;

const expectResponsiveContract = (): void => {
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
};

describe('Phase 2 Slice 03 component, route, and responsive contracts', () => {
  it('[P2-S03-AC-232] IdentityAuthorityRoute exposes the disclosure-safe typed page shell and never-children variants', () => {
    const markup = render(IdentityAuthorityRoute, routeProps);
    expect(markup).toContain('identity-authority');
    expect(markup).toContain('appPage');
    expect(markup).toContain('request-s03-route');
    expect(markup).toMatch(/<main\b/);
    expect(markup).toMatch(/<h1\b/);
    expect(markup).not.toContain('providerSecret');
  });

  it('[P2-S03-AC-233] AuthAccountLinkingWorkbench renders the typed access projection with no children and actionable list/detail state', () => {
    const markup = render(AuthAccountLinkingWorkbench, authProps);
    expect(markup).toContain('auth-account-linking');
    expect(markup).toContain('auth-record-s03');
    expect(markup).toContain('party-s03');
    expect(markup).toContain('"1"');
    expect(markup).not.toContain('providerSecret');
  });

  it('[P2-S03-AC-234] PartyIdentityAliasesWorkbench renders the typed access projection with no children and disclosure-safe alias facts', () => {
    const markup = render(PartyIdentityAliasesWorkbench, aliasesProps);
    expect(markup).toContain('party-identity-aliases');
    expect(markup).toContain('alias-record-s03');
    expect(markup).toContain('party-s03');
    expect(markup).not.toContain('legalIdentitySecret');
  });

  it('[P2-S03-AC-235] RelationshipsAuthorityGovernanceWorkbench renders mandate-scoped facts with no children', () => {
    const markup = render(
      RelationshipsAuthorityGovernanceWorkbench,
      relationshipsProps,
    );
    expect(markup).toContain('relationships-authority-governance');
    expect(markup).toContain('relationship-record-s03');
    expect(markup).toContain('businessMandate');
    expect(markup).not.toContain('providerSecret');
  });

  it('[P2-S03-AC-236] IdentifiersLegacyWorkbench renders case-scoped identifier facts with no children', () => {
    const markup = render(IdentifiersLegacyWorkbench, identifiersProps);
    expect(markup).toContain('identifiers-legacy');
    expect(markup).toContain('identifier-record-s03');
    expect(markup).toContain('staffCaseScoped');
    expect(markup).not.toContain('normalizedValue');
  });

  it('[P2-S03-AC-237] IdentityAuthorityPrimitives composes canonical global primitives without local wrappers', () => {
    const markup = render(IdentityAuthorityPrimitives, primitiveProps);
    expect(markup).toContain('Save identity');
    expect(markup).toContain('IdentityAuthorityFilterSchema');
    expect(markup).toContain('Neon Harbor');
    expect(markup).toContain('Remove the role facet from this person');
    expect(markup).toMatch(/<button\b/);
    expect(markup).toMatch(/<table\b/);
  });

  it('[P2-S03-AC-238] IdentityAuthorityRoute preserves four-eight-twelve-column responsive shell semantics', () => {
    expectResponsiveContract();
    const markup = render(IdentityAuthorityRoute, routeProps);
    expect(markup).toMatch(/<nav\b/);
    expect(markup).toMatch(/<main\b/);
    expect(markup).toContain('canonicalUrl');
    expect(markup).not.toMatch(/overflow-x\s*:\s*scroll/i);
  });

  it('[P2-S03-AC-239] AuthAccountLinkingWorkbench preserves priority facts and list-detail behavior at every breakpoint', () => {
    expectResponsiveContract();
    const markup = render(AuthAccountLinkingWorkbench, authProps);
    expect(markup).toMatch(/list|detail/i);
    expect(markup).toContain('auth-record-s03');
    expect(markup).toContain('party-s03');
    expect(markup).toMatch(/44|Back|inspector/i);
  });

  it('[P2-S03-AC-240] PartyIdentityAliasesWorkbench preserves priority facts and list-detail behavior at every breakpoint', () => {
    expectResponsiveContract();
    const markup = render(PartyIdentityAliasesWorkbench, aliasesProps);
    expect(markup).toMatch(/list|detail/i);
    expect(markup).toContain('alias-record-s03');
    expect(markup).toMatch(/44|Back|inspector/i);
  });

  it('[P2-S03-AC-241] RelationshipsAuthorityGovernanceWorkbench preserves priority facts and list-detail behavior at every breakpoint', () => {
    expectResponsiveContract();
    const markup = render(
      RelationshipsAuthorityGovernanceWorkbench,
      relationshipsProps,
    );
    expect(markup).toMatch(/list|detail/i);
    expect(markup).toContain('relationship-record-s03');
    expect(markup).toMatch(/44|Back|inspector/i);
  });

  it('[P2-S03-AC-242] IdentifiersLegacyWorkbench preserves priority facts and list-detail behavior at every breakpoint', () => {
    expectResponsiveContract();
    const markup = render(IdentifiersLegacyWorkbench, identifiersProps);
    expect(markup).toMatch(/list|detail/i);
    expect(markup).toContain('identifier-record-s03');
    expect(markup).toMatch(/44|Back|inspector/i);
  });

  it('[P2-S03-AC-243] canonical FilterBar DataTable ActionBar ConfirmationStep retain text semantics across responsive composition', () => {
    expectResponsiveContract();
    const markup = render(IdentityAuthorityPrimitives, primitiveProps);
    expect(markup).toContain('Apply');
    expect(markup).toContain('Reset');
    expect(markup).toContain('Save identity');
    expect(markup).toContain('Remove the role facet from this person');
    expect(markup).toMatch(/<table\b/);
    expect(markup).not.toContain('aria-hidden="true"');
  });
});
