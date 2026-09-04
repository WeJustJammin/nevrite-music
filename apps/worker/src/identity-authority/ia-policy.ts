export type IaPolicyInput =
  | Readonly<{
      kind: 'native';
      flow: 'person' | 'role-facet' | 'alias' | 'acting-context';
    }>
  | Readonly<{ kind: 'edge'; name: string }>;

export type IaPolicy = Readonly<Record<string, unknown>>;

const recovery = {
  retainInput: true,
  focus: 'summary-or-field',
  reconcileUnknownMutation: true,
  navigation: 'url',
  draft: 'scoped-before-commit',
  success: 'server-canonical',
} as const;

const native = (
  flow: IaPolicyInput extends never ? never : string,
): IaPolicy => ({
  decision: flow,
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
  requiredHeaders: ['etag', 'idempotency-key'],
  recovery,
});

const edges: Readonly<Record<string, IaPolicy>> = {
  'alias-lifecycle': {
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
  },
  'alias-failure-recovery': {
    decision: 'typed-failure-recovery',
    canonicalState: 'preserved',
    invalidAuthority: { outcome: 'denied', status: 403 },
    concurrency: { outcome: 'conflict', status: 409 },
    revocation: { outcome: 'invalidate-and-refetch' },
    deletion: { outcome: 'not-found' },
    cascade: { outcome: 'broadcast-invalidate-and-refetch' },
  },
  'context-switch-valid': {
    decision: 'bind',
    authority: 'selected-context',
    deliberateConfirmation: true,
    scope: 'per-tab-and-device',
    deepLink: 'suggest-only',
  },
  'context-switch-failure-recovery': {
    invalidAuthority: { outcome: 'denied', status: 403 },
    concurrency: { outcome: 'conflict', status: 409 },
    revocation: { outcome: 'invalidate-and-switch-self' },
    deletion: { outcome: 'not-found' },
    cascade: { outcome: 'broadcast-invalidate-and-refetch' },
  },
  'provider-identities-match': {
    decision: 'manual-merge-required',
    autoMerge: false,
    authority: 'none',
    nextAction: 'shard-00-merge-flow',
  },
  'concurrent-facet-change': {
    decision: 'single-facet-cas',
    mutation: 'compare-and-swap',
    lostUpdate: false,
  },
  'facet-removal-live-obligation': {
    decision: 'conflict',
    history: 'preserved',
    deleteHistory: false,
    obligationCodes: ['live_obligation'],
  },
  'confusable-alias-handle': {
    decision: 'reject-normalized-collision',
    normalizedCollision: true,
    displayName: 'allowed',
  },
  'stale-alias-transfer-acceptance': {
    decision: 'reject-stale-acceptance',
    ownershipPeriod: 'unchanged',
    reissueOffer: true,
  },
  'revoked-cached-organization-context': {
    decision: 'fail-closed',
    display: 'stale-display-allowed',
    submit: 'rejected',
    switchedContext: 'self',
    explanation: true,
  },
  'deep-link-context-suggestion': {
    decision: 'preselect-only',
    switched: false,
    executed: false,
    deliberateConfirmationRequired: true,
  },
  'duplicate-organization-after-timeout': {
    decision: 'retain-created-party',
    mergeOffer: 'async-open',
    silentCombine: false,
  },
  'last-organization-type-removed': {
    decision: 'typeless-collective',
    history: 'preserved',
    links: 'preserved',
  },
  'membership-assertion-rejected': {
    decision: 'reject-membership',
    publicProjection: 'hidden',
    protectedEvidence: 'retained',
    dispute: 'route',
    authority: 'none',
  },
  'retroactive-departure-contested': {
    decision: 'revoke-now-dispute-history',
    currentAuthority: 'revoked',
    historicalDate: 'disputed',
    rewriteHistory: false,
  },
  'overlapping-representation-scopes': {
    decision: 'warn-and-acknowledge',
    scopes: 'coexist',
    exclusivity: 'never-inferred',
    dimensions: ['term', 'territory', 'domain'],
  },
  'representation-without-monetary-ceiling': {
    decision: 'monetary-fail-closed',
    nonMonetary: 'allowed',
    monetary: 'escalate',
    ceiling: 'required',
  },
  'grantor-loses-authority': {
    decision: 'revoke-dependent-subgrants',
    pastActions: 'attributable',
  },
  'member-terms-not-accepted': {
    decision: 'pending-terms',
    authority: 'none',
    governanceConfirmer: false,
  },
  'governance-member-lost-mid-vote': {
    decision: 'freeze-and-supersede',
    recalculation: 'required-parties',
    mutateOriginal: false,
  },
  'dissolution-unresolved-dispositions': {
    decision: 'terminal-with-unresolved-dispositions',
    unresolvedDispositions: true,
    records: 'accessible-by-policy',
  },
  'duplicate-identifier-claim': {
    decision: 'quarantine-routing',
    partiesStatus: 'unverified',
    registryResolution: 'required',
  },
  'identifier-registry-unavailable': {
    decision: 'verification-delayed',
    localClaim: 'preserved',
    priorEvidence: 'preserved',
    downgradeVerified: false,
  },
  'false-death-report': {
    decision: 'protected-review',
    publicOrAuthorityChange: false,
    rateLimit: true,
  },
  'death-without-successor': {
    decision: 'revoke-deceased-authority',
    rights: 'preserved',
    estateAdministration: 'blocked-until-verified-legal-authority',
  },
  'estate-public-removal': {
    decision: 'suppress-optional-profile',
    tombstone: 'minimal-citation',
    thirdPartyProvenance: 'retained',
    legalPolicy: 'counsel-gated',
  },
};

export const evaluateIaPolicy = (input: IaPolicyInput): IaPolicy =>
  input.kind === 'native'
    ? native(input.flow)
    : (edges[input.name] ?? {
        decision: 'unsupported',
        outcome: 'fail-closed',
      });
