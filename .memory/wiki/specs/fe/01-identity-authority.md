# Identity Authority and Party Governance - Frontend Specification

> **BE Sources**: [[specs/be/01a-auth-account-linking|Auth and Account Linking]], [[specs/be/01b-party-identity-aliases|Party Identity and Aliases]], [[specs/be/01c-relationships-authority-governance|Relationships and Governance]], [[specs/be/01d-identifiers-legacy|Identifiers and Legacy]]  
> **IA Source**: [[specs/ia/01-identity-authority|Shard 01 Identity Authority]]  
> **Status**: Complete

## Classification

- **Type**: Feature specification spanning four BE contracts that share one identity/authority UI surface.
- **Surface**: Public authentication and memorial reporting; authenticated identity/settings; organization workbench; capability-gated identity operations.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: Every shell, feedback, state, request, offline, conflict and accessibility behavior inherits [[specs/fe/00-infrastructure|FE 00 Infrastructure]] and is narrowed below.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/01-identity-authority|Shard 01 IA]] | Features, Interactions IDA-01..18, Contracts, Access Control, Accessibility, Edge Cases |
| IA deep dive | [[specs/ia/deep-dives/01-identity-authority|Identity Authority Deep Dive]] | deterministic policy values, state machines, authority resolution, disclosure/counsel gates |
| Backend | [[specs/be/01a-auth-account-linking|01a]] | providers, auth, login methods and account merge |
| Backend | [[specs/be/01b-party-identity-aliases|01b]] | facets, aliases, acting context and legal identity |
| Backend | [[specs/be/01c-relationships-authority-governance|01c]] | organizations, relationships, mandates, governance and lifecycle |
| Backend | [[specs/be/01d-identifiers-legacy|01d]] | identifiers, collisions, nominations, memorialisation and estate representation |
| Cross-cutting FE | [[specs/fe/00-infrastructure|FE 00]] | shells, global states, errors, confirmation, job/upload/offline and responsive contracts |
| Design | [[specs/design-system|Design System]] | Auth/Claim/Recovery, Settings/Registry, Record Detail, Guided Form, Admin Operations |

## Source Map

| FE section | Source |
|---|---|
| Authentication and additive login methods | BE 01a § Provider Registry/API Endpoints; IA IDA-01 |
| Facets, aliases, contexts and legal identity | BE 01b § API Endpoints; IA IDA-02..05 |
| Organizations, relationships and governance | BE 01c § API Endpoints/Authority Resolution; IA IDA-06..14 |
| Identifiers and collision handling | BE 01d § Identifier Registry/API Endpoints; IA IDA-15..16 |
| Legacy and memorialisation | BE 01d § API Endpoints; IA IDA-17..18; counsel gate |
| Role rendering | IA 01 § Access Control; BE authorization matrices |
| Accessibility | IA 01 § Accessibility; FE 00 component contracts |
| Responsive and visual behavior | Design System; FE 00 responsive contract |

## Design Requirements

**Direction**: Credible, human and exact identity work. Every screen distinguishes public identity, legal identity, human actor, acting party, relationship source and current authority.  
**Typography**: Source Sans 3 for all controls and identity records; IBM Plex Mono for stable handles, IDs, versions and policy hashes; no serif in protected flows.  
**Colors**: restrained Paper/Surface/Graphite. Jam Magenta marks current context or one primary action, never verification. State/provenance always includes text and structure.  
**Motion**: FE 00 bounded feedback only. Context switches and step-up return use no decorative transition.  
**Anti-patterns**: no “one primary role,” profile completion score, decorative verified badge, inferred account merge, role-based authority claim, hidden acting context, sensational memorial styling or organization “owner” UI that exceeds recorded grants.

## Design System Compliance

- **Archetypes**: Auth/Claim/Recovery for sign-in/link/merge; Settings/Registry for identity, methods, facets, aliases and identifiers; List → Detail Workbench for organizations; Record Detail/Activity for relationships/cases; Guided Form/Transaction for transfers, disclosure, governance and lifecycle; Admin Operations for assigned collision/memorial review.
- **Global components consumed**: `<PageShell>`, navigation family, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<ProvenanceFact>`, `<StateLabel>`, `<DataTable>`, `<Timeline>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every data view inherits FE 00 `idle|loading|empty|success|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Protected identity commands never display optimistic success.
- **Empty/error language**: zero facets and typeless organizations are valid states, not failure or completion debt. Hidden legal identity, nominations, cases and owner linkage are forbidden/limited states, not empty.

## Page and Route Definitions

| Route | Archetype and guard | Primary components | Deep-link and navigation behavior |
|---|---|---|---|
| `/auth/sign-in` | Public Auth/Claim/Recovery; redirect authenticated users only after server session check | `AuthEntry`, `ProviderChoice` | Relative allowlisted `returnTo`; provider selection never implies account creation/merge. |
| `/auth/recovery` | Public Auth/Claim/Recovery | `AuthEntry` recovery variant | Existence-safe accepted response; no account discovery. |
| `/auth/result` | Public focused result | `AuthResult` | Reads allowlisted outcome/request ID only; no provider error text/token. |
| `/app/settings/login-methods` | Authenticated self, recent step-up for mutations | `LoginMethodManager` | Bookmarkable; callback returns to exact state-bound path; session/provider status refetches. |
| `/app/settings/account/merge` | Authenticated survivor self plus step-up | `AccountMergeWizard`, `JobStatus` | Merge ID is server-issued; refresh reconciles current merge/job; no email candidate search. |
| `/app/settings/identity` | Authenticated self | `IdentitySummary`, `FacetEditor`, `AliasList` | Canonical identity projection; facet changes refresh navigation/capabilities. |
| `/app/settings/aliases/new` | Authenticated self | `AliasEditor` create variant | Discloses implied performer facet before submit. |
| `/app/settings/aliases/{aliasId}` | Owner or explicitly scoped alias-profile mandate | `AliasEditor`, `AliasLifecycleActions`, `AliasTransferFlow` | Concealment-safe 404; transfer/retire remain owner-self only. |
| `/app/settings/legal-identity` | Self plus recent step-up; no-store | `LegalIdentityForm`, `LegalDisclosureFlow` | No browser persistence, prefetch or analytics; step-up restores exact field/context. |
| `/app/organizations` | Authenticated app shell | `OrganizationWorkbench` | URL stores allowlisted query/selection; authority is recalculated on detail load. |
| `/app/organizations/new` | Authenticated self | `OrganizationCreateFlow` | Mode is explicit `self_member|shadow_custodial|external_reference`; duplicate candidates warn but do not auto-bind. |
| `/app/organizations/{organizationId}` | Viewer-relative record detail | `OrganizationHeader`, type/membership/representation/authority/governance/lifecycle tabs | Current context does not switch from deep link; target may be preselected for deliberate switch. |
| `/app/parties/{partyId}/identifiers` | Public projection or current identifier capability | `IdentifierList`, `IdentifierClaimFlow` | Public and owner projections differ server-side; provider evidence never enters props. |
| `/app/identity/collisions/{collisionId}` | Affected party minimum projection | `IdentifierCollisionWorkbench` participant variant | Wrong party collapses to 404; other claimant labels stay disclosure-safe. |
| `/app/settings/legacy` | Living self plus step-up | `LegacyNominationForm` | Private/no-store; successor nomination grants no current access. |
| `/memorialisation/report` | Counsel-policy enabled reporter route | `MemorialReportForm` | Subject lookup remains concealment-safe; receipt code is the only public follow-up key. |
| `/app/legacy/cases/{caseId}` | Minimum participant projection | `MemorialCaseView` | Reporter/nominee/estate variants contain only policy-allowed fields. |
| `/admin/identity/collisions/{collisionId}` | Assigned identity operator, MFA and reason | `IdentifierCollisionWorkbench` operator variant | Admin shell; assignment and step-up rechecked on every action. |
| `/admin/identity/memorialisation/{caseId}` | Assigned identity operator, counsel policy, MFA and reason | `MemorialCaseView`, `EstateRepresentationFlow` | No general profile browse; evidence opens through separate expiring purpose grant. |

Admin and memorial routes do not appear unless their capability/policy exists. Known-under-18 registration remains blocked; no guardian/minor identity route is invented.

## Component Inventory

Every row cites FE 00 for global state/error/loading/empty behavior. “No optimistic success” means `optimistic_pending` and `optimistic_rollback` are explicitly unavailable because authority/history changes require canonical confirmation.

### Authentication and Account Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<AuthEntry mode: "sign_in"|"recovery"; providers: ProviderProjection[]; emailRecoveryEnabled: boolean; returnTo: RelativePath>` | `idle|submitting|accepted|rate_limited|provider_unavailable|failed`; email validates on blur/submit; success copy is existence-safe. OAuth start follows native navigation to returned URL. | Focused spacious form, persistent email label, provider choices as named buttons, status live region, no CAPTCHA puzzle without accessible alternative. |
| `<ProviderChoice provider: {code,label,state}; intent: AuthIntent; disabledReason?: string; onStart>` | Temporarily unavailable is disabled with reason; disabled/unsupported providers are absent. Never exposes provider scopes/subjects. | 44px targets, provider name in text, no logo-only button, pending state preserves label. |
| `<AuthResult outcome: AllowlistedAuthOutcome; requestId: string; returnAction: ActionDescriptor>` | Success, expired, conflict, provider unavailable and unknown remain distinct. No automatic mutation retry. | Route heading receives focus; request ID selectable; exact next action. |
| `<LoginMethodManager methods: LoginMethodProjection[]; recoveryBaselinePresent: boolean; version: ETag; onLink; onRemove>` | `loading|success|empty_invalid|conflict|step_up|provider_unavailable|failed`; final method removal blocked; link/remove always canonical, no optimistic success. | Method list with semantic state/removability text; destructive removal uses confirmation and restores row focus. |
| `<AccountMergeWizard merge?: MergeProjection; conflictPlan?: MergeConflictPlan; providers: ProviderProjection[]; job?: JobStatusResponse>` | `start -> awaiting_duplicate_proof -> analyzing -> awaiting_confirmation -> queued -> completed|failed`; step-up and version conflict preserve progress. Same-account proof and unresolved conflict plan block. | Guided form with named irreversible consequence; changed-field/conflict summaries precede acknowledgements; final confirm not default focused. |

### Identity, Alias and Legal Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<IdentitySummary person: PersonIdentityProjection; aliases: AliasProjection[]; legalIdentityPresent: boolean; version: ETag>` | Server projection only. Zero facets/aliases are truthful states with actions, not profile scoring. Legal fields never render. | Record header plus aligned facts; each facet/alias labelled self-asserted/current/retired in text. |
| `<FacetEditor facets: FacetCode[]; available: FacetDefinition[]; version: ETag; blockers?: FacetBlockerSummary; onAdd; onRemove>` | One facet per command. Add validates registered value; remove may enter blocked state with safe blocker codes/counts/routes. No set replacement. | Checkbox-like rows are buttons/commands, not immediate toggles; confirmation for removals with obligations; update announced and focus retained. |
| `<AliasList aliases: AliasProjection[]; canCreate: boolean>` | Empty state offers create; private/public/retired/transfer-pending states distinct. | Semantic list, stable handle in mono, no owner linkage exposed outside allowed projection. |
| `<AliasEditor mode: "create"|"edit"; alias?: AliasProjection; personVersion?: ETag; canEdit: boolean>` | Display name 1..120, handle 3..40 normalized code points, public link enum. Create discloses performer facet; edit uses alias ETag. Handle conflict preserves input. | Persistent labels/help; normalization errors linked to handle; preview never implies availability until server confirms. |
| `<AliasLifecycleActions alias: AliasProjection; canOwnerRetire: boolean; canOwnerTransfer: boolean; blockers?: SafeBlocker[]>` | Handle change/retire/transfer are separate high-risk flows with step-up. Mandate variants never show transfer/retire. Rate limits show reset guidance. | Action hierarchy separates edit from destructive/ownership actions; confirmations name permanent redirects/history. |
| `<AliasTransferFlow alias: AliasProjection; offer?: AliasTransferOffer; recipient?: SafePersonReference>` | `draft|pending|accepted|declined|expired|conflict`; exactly seven-day expiry; accept/decline recipient self. No legal identity/contract transfer. | Timeline and ownership effect summary; recipient decision keyboard operable; terminal state announced. |
| `<LegalIdentityForm value?: LegalIdentityProjection; countrySchema: LegalFieldSchema; version?: ETag>` | `step_up|loading|editing|submitting|success|validation_error|conflict|storage_unavailable`; no local persistence. Country-aware fields reject unnecessary data. | Plain labels, address grouping, error summary, no autocomplete beyond policy, field values excluded from telemetry and DOM after navigation. |
| `<LegalDisclosureFlow eligibility: DisclosureEligibility; legalIdentity: LegalIdentityProjection; transaction: SafeTransactionRef>` | Recipient, purpose, exact fields, persistence and version shown before consent; step-up then canonical create. Ineligible/expired transaction blocks. | Review summary read before action; changed fields announced; return focus to initiator after step-up; no prechecked consent. |

### Organization, Relationship and Governance Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<OrganizationWorkbench rows: OrganizationSummary[]; selected?: OrganizationDetail; query: OrganizationQuery; authority?: AuthorityProjection>` | FE 00 table/list states. Selection never changes acting context. Revoked cached context triggers explanation and self fallback on command refusal. | Split desktop, list/detail stack mobile; URL selection; semantic table and record header. |
| `<OrganizationCreateFlow modes: OrganizationCreateMode[]; typeRegistry: OrganizationTypeDefinition[]; duplicateSignals?: SafeDuplicateSignal[]>` | `editing|checking_duplicates|review|submitting|success|conflict|failed`; duplicate signals require explicit continue/open-existing, never auto-merge or block creation. | Guided steps name custody/authority implications; duplicate candidates are disclosure-safe and keyboard selectable. |
| `<OrganizationTypeEditor organization: OrganizationDetail; definitions: OrganizationTypeDefinition[]; canManage: boolean>` | Add/remove one type with version. Last removal yields valid typeless collective. Gated domain fields remain absent, not disabled placeholders. | Registry list with current/effective periods; changes announce removed surfaces without claiming deleted records. |
| `<MembershipTable tenures: MembershipProjection[]; capabilities: MembershipActions; query: RelationshipQuery>` | `invited|asserted|confirmed|ended|disputed|rejected|expired`; invite/assert/end/retroactive-confirm actions map to exact state and version. Immediate authority revocation remains visible during date dispute. | Semantic headers, keyboard sort/filter, responsive labelled record rows with no information loss at 200% zoom. |
| `<RepresentationFlow mode: "create"|"decision"|"revoke"; parties: SafePartyRef[]; value?: RepresentationProjection; overlap?: ScopeOverlap>` | Typed activities/domains/territories/term/communicate/ceiling. Exact overlap requires acknowledgement from both sides; null ceiling clearly states no monetary authority. | Plain-language scope summary before structured detail; overlap warning uses text, not alarm color alone. |
| `<MandateEditor relationship: RelationshipProjection; sourceAuthority: AuthorityProjection; mandate?: MandateProjection>` | Can grant only subset of current source scope/term/ceiling. `all` domains and explicit domains are mutually exclusive. Revoke immediately invalidates contexts. | Side-by-side source versus proposed scope desktop, sequential mobile; changed-field summary before confirm. |
| `<AuthorityExplanation authority?: AuthorityProjection; requestedAction?: AuthorityRequest>` | Read model only. Shows human actor, acting party, relationship, mandate, activities, domains, communication, ceiling, term and source version. Absence is not an authorization token error detail. | Definition list; machine fields mono; “Why can/can’t I?” copy is plain language and disclosure-safe. |
| `<GovernanceTermsReview organization: OrganizationDetail; active: GovernanceTerms; proposal?: GovernanceProposal; confirmations: ConfirmationProjection[]>` | `draft|proposed|active|rejected|withdrawn|superseded|frozen`; immutable hash/version/member set. Each member reviews same content; final activation is canonical/unanimous. | Changed-field summary precedes full detail; hash available but not sole identity; decision buttons named and step-up aware. |
| `<NameOwnershipStatement organization: OrganizationDetail; current?: NameOwnershipProjection; canRecord: boolean>` | Owners/disposition/trademark reference submit as attributable self-supplied statement; UI never says legally verified/cleared. | Provenance fact treatment, explicit non-adjudication copy, source/version timeline. |
| `<OrganizationLifecycleFlow action: "close"|"reopen"|"dissolve"|"successor"; organization: OrganizationDetail; obligations: SafeBlocker[]; governance?: GovernanceProjection>` | High-risk confirmation. Close may return job; dissolve terminal; reopen only closed; successor copies only explicitly selected public fields and lineage. Live obligations/governance gaps block. | Consequence, acting context, dispositions and non-copied work/rights/relationships named before action; job progress accessible. |

### Identifier and Legacy Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<IdentifierList claims: CursorPage<IdentifierProjection>; projection: "public"|"owner"; namespaces: IdentifierNamespaceDefinition[]; canManage: boolean>` | `self_asserted|verifying|verified|mismatch|collision|revoked|verification_delayed`; public projection omits IDs/attempts/recovery. Pagination inherits FE 00. | Table/list with namespace, masked/public value, capacity, provenance and state text; no verification badge alone. |
| `<IdentifierClaimFlow party: PartySummary; namespaceDefinitions: IdentifierNamespaceDefinition[]; version: ETag>` | Namespace drives exact value/capacity/evidence fields. Create always begins routing-ineligible; configured verification may produce job. | Dynamic fields announce added requirements; examples are help, not placeholders; invalid format/capacity links exact field. |
| `<IdentifierCollisionWorkbench variant: "participant"|"operator"; collision: CollisionProjection; allowedActions: CollisionAction[]>` | Participant may withdraw/submit evidence; operator resolve requires assignment, MFA, reason and sufficient registry evidence. Collision keeps all routing disabled until canonical resolution. | Workbench preserves claimant-safe labels; evidence opens separately; operator-only controls absent from participant DOM. |
| `<LegacyNominationForm nomination?: LegacyNominationProjection; successorOptions: SafePersonRef[]; version?: ETag>` | `absent|active|superseded|revoked`; step-up create/replace/revoke. Copy states “evidence of intent, not probate authority” and no current access. | Focused settings form; successor search does not enumerate unavailable people; revoke confirmation restores trigger. |
| `<MemorialReportForm policy: MemorialPolicyProjection; subjectLookup: ConcealmentSafeLookup>` | `editing|uploading_evidence|submitting|reported|policy_disabled|failed`; statement 1..2000; admitted evidence classes only. Report creates no public/auth change. | Restricted-evidence warning, accessible uploads, no subject confirmation leak; receipt code announced once and printable. |
| `<MemorialCaseView variant: "reporter"|"nominee"|"estate"|"operator"; case: MemorialCaseProjection; job?: JobStatusResponse>` | `reported|reviewing|verified|rejected|contested|reversed`; each variant receives minimum fields/actions. Verify job revokes sessions/authority and updates marker only after policy transition. | State timeline, no sensational imagery; operator evidence/action rail separate; terminal state text and request/audit links. |
| `<EstateRepresentationFlow case: MemorialCaseProjection; legalAuthority: EvidenceStatus; representationSchema: RepresentationSchema>` | Hidden until verified memorialisation and legal-authority evidence. Creates pending scope requiring operator approval and representative acceptance; never grants login/signature/attestation as deceased. | Consequence and prohibited powers explicit; field-level consent/evidence summary; blocked state has counsel-policy route, no workaround. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Session/person/account/login methods | Server/Supabase projection; no tokens/provider subjects in client state; refetch after callback, unlink, logout or merge. |
| Acting context | Server-issued tab binding; tab/session memory only; explicit user action; 12-hour inactivity expiry; session-gap reconfirmation for attested/monetary actions. |
| Organization/relationship/authority | Server canonical with ETag; URL may hold selected organization/tab but never capability. Realtime invalidates and refetches. |
| Legal identity/memorial evidence | No-store server projection and component memory only; cleared on route exit; never service-worker cached, logged or analyzed. |
| Form drafts | Safe non-secret fields may persist through step-up/session recovery; merge acknowledgements, legal/tax fields and restricted memorial statement/evidence do not persist beyond approved encrypted workflow storage. |
| Pending jobs | Stable server job ID survives refresh; terminal state stops polling. |

- Deep links never switch acting context. If a route targets another eligible party, the UI preselects and asks for deliberate confirmation.
- Browser back/forward restores wizard step only when the server merge/transfer/proposal state still permits it; otherwise render current state and explain the change.
- Unsaved-change guard applies to alias, organization, relationship, governance, identifier, legal and memorial forms. It never blocks forced session/authority revocation; safe draft recovery follows FE 00.
- Multi-tab conflicts preserve draft and open current-versus-proposed review. Last-write-wins is forbidden.

## Interaction Flows

### Additive Sign-in and Linking

1. Server renders only currently enabled/temporarily unavailable providers from `GET /auth/providers`.
2. Email start returns the same accepted UI for every syntactically valid address.
3. OAuth/link creates state-bound authorization and leaves the site by native navigation.
4. Callback returns only allowlisted result code/request ID. It may create one person, link one method or prove duplicate control, but never merges from name/email similarity.
5. Login-method manager refetches canonical methods/version. Final verified method removal remains blocked.

### Acting Context and Authority

1. `<ActingContextSwitcher>` receives derived self, aliases, accepted memberships and representations.
2. User deliberately selects a context; deep link cannot select it.
3. Binding is tab-specific and expires after 12 hours inactivity. The current context remains textually visible before every protected action.
4. Submit sends binding ID; server re-resolves human, relationship, mandate, term, scope, ceiling and version.
5. Revocation/conflict switches command outcome to blocked/conflict, purges stale binding and explains self fallback without reattributing draft/fact.

### Governance and Lifecycle

1. Proposer edits a structured terms draft and reviews changed-field/plain-language summary.
2. Submit creates immutable proposed version/hash/member snapshot.
3. Each permanent member confirms/rejects that exact version after step-up. Membership-set change freezes it and requires successor proposal.
4. Unanimous final confirmation activates atomically; rejection/withdrawal leaves prior/default rules active.
5. Close/dissolve/successor flows read current obligations/governance, show consequences and commit canonical job/result. Dissolution remains terminal.

### Identifier Collision

1. New claim shows self-asserted/routing-ineligible immediately after canonical create.
2. Verification job may advance or delay. Provider outage does not silently downgrade prior verified evidence.
3. Competing claim changes every involved view to collision and disables routing.
4. Participant or assigned operator performs only allowlisted actions. Exact current version and sufficient evidence are mandatory.
5. Resolution enables at most one winner; losing/history records remain visible under projection policy.

### Memorialisation

1. Policy-disabled state stops before subject/evidence intake and explains capability unavailability.
2. Accepted report yields receipt/status only and makes no public, session or authority change.
3. Assigned operator reviews through purpose grant, MFA and reason. Probate/legal authority is never inferred from nomination/family/tenure.
4. Verify returns protected job that coordinates account/session/mandate/binding/public marker changes atomically.
5. Estate representation remains pending until verified legal authority, operator approval and representative acceptance; deceased impersonation is impossible.

## Error-to-UI Matrix

FE 00 status-class behavior applies. These named codes require the following identity-specific states.

| Code | Component state and copy intent | Recovery |
|---|---|---|
| `LOGIN_IDENTITY_CONFLICT`, `PROVIDER_ALREADY_LINKED` | Login-method/account conflict, never new-account prompt | Return to methods or start explicit merge proof. |
| `FINAL_LOGIN_METHOD` | Blocked removal with recovery-baseline explanation | Add/verify another method first. |
| `MERGE_CONFLICTS_UNRESOLVED`, `MERGE_PLAN_STALE` | Merge review conflict | Refetch analysis, resolve every current conflict, re-acknowledge changed plan. |
| `FACET_HAS_LIVE_OBLIGATIONS` | Facet row blocked with safe codes/counts only | Follow named recovery routes; no counterpart disclosure. |
| `HANDLE_UNAVAILABLE`, `HANDLE_CHANGE_LIMIT` | Alias handle field/rate state | Choose another handle or wait exact limit period; no availability oracle detail. |
| `ACTING_CONTEXT_STALE`, `ACTING_CONTEXT_RECONFIRMATION_REQUIRED` | Context gate | Explicitly rebind after reviewing current authority. |
| `STEP_UP_REQUIRED` | Step-up interruption preserving safe context | Complete step-up and restore initiating control/route. |
| `REPRESENTATION_SCOPE_OVERLAP`, `MANDATE_OVERLAP` | Scope review warning/conflict | Show exact safe overlap; require allowed acknowledgement or narrower scope. |
| `DELEGATION_EXCEEDS_AUTHORITY`, `AUTHORITY_NOT_FOUND` | Capability gate | Show source-scope explanation if disclosure-safe; no client override. |
| `TERMS_MEMBER_SET_CHANGED`, `TERMS_HASH_MISMATCH` | Governance proposal frozen/conflict | Refetch member set/version and create successor proposal. |
| `LIVE_OBLIGATIONS`, `GOVERNANCE_DECISION_INCOMPLETE` | Lifecycle blocked | Show safe blocker classes and legitimate owner routes. |
| `IDENTIFIER_VERIFICATION_UNAVAILABLE`, provider unavailable | Verification delayed | Preserve claim/prior evidence and offer later retry where allowed. |
| `COLLISION_STATE_CONFLICT`, `EVIDENCE_INSUFFICIENT` | Collision workbench conflict | Refetch current case; submit eligible evidence/action only. |
| `MEMORIALISATION_POLICY_DISABLED` | Capability unavailable | No intake/override; route to policy information. |
| `CASE_STATE_CONFLICT`, `ESTATE_EVIDENCE_UNVERIFIED` | Memorial/estate blocked | Refetch case or complete counsel-defined evidence path. |

All persistent errors include request ID. Legal identity, provider subjects, other claimant evidence, memorial statement/evidence and hidden party linkage are never placed in error details, toast, URL or telemetry.

## Conditional Rendering Matrix

| Feature/component | Anonymous | Self person | Alias context | Org member | Owner/admin | Representative/estate | Identity operator | Service principal |
|---|---|---|---|---|---|---|---|---|
| Sign-in/recovery | full | redirect/read-only result | same human session | same human session | same human session | same human session | same human session | hidden |
| Login methods/merge | hidden | full | self-only, not alias-attributed | self-only | self-only | self-only | assigned blocked-case read-only | hidden |
| Facets/aliases | public projection only | full | alias profile partial; no transfer/retire | self-only facets | self-only facets | self-only facets | hidden | hidden |
| Acting context | hidden | full eligible contexts | full current alias plus switch | full eligible accepted contexts | full eligible contexts | full exact scope | operator context only | hidden |
| Legal identity | hidden | full after step-up | hidden | hidden | hidden unless own self route | minimum disclosed transaction fields only | purpose-grant minimum | hidden |
| Organization record | public projection | viewer-relative | viewer-relative | membership/governance read | full within grant | exact represented scope | assigned case minimum | hidden |
| Relationship/mandate commands | hidden | own-party eligible | no alias disposal/signature | read or accepted actions | full within current authority | exact conjoined scope | hidden | hidden |
| Governance/lifecycle | public dated outcome only | member decision where eligible | hidden | read/confirm if permanent | propose/act within grant | hidden unless explicit grant | hidden | hidden |
| Identifier claims | public projection | own/current-party full | party projection only | current-party read | manage within grant | exact scope | assigned collision only | hidden |
| Legacy nomination | hidden | full living self | hidden | hidden | hidden | hidden while nominator alive | hidden | hidden |
| Memorial case | report entry only when policy allows | minimum participant variant | hidden | hidden | hidden | verified estate variant | assigned operator variant | hidden |

Named variants: `publicProjection`, `selfOnly`, `aliasProfilePartial`, `memberRead`, `ownerGrantScoped`, `representativeConjoinedScope`, `operatorAssignedCase`, `estateMinimum`, `concealmentSafeHidden`, `machineNoUi`.

## Accessibility Inventory

| Component/interaction | WCAG | Keyboard/focus | Screen-reader behavior | IA source |
|---|---|---|---|---|
| Acting context switch | 1.4.1, 2.4.3, 4.1.3 | One deliberate action; focus returns to trigger; no deep-link switch | Announces human/party label and changed context | IA 01 § Accessibility |
| Relationship/identifier/state | 1.3.1, 1.4.1 | State actions keyboard operable | Explicit invited/asserted/confirmed/expired/disputed/collision/pending/memorialised text | IA 01 § Accessibility |
| Authority/destructive confirmation | 3.3.4, 2.4.6 | Consequence reviewed before commit; cancel restores initiator | Announces acting party, target, effect, reversibility and reliance | IA 01 § Accessibility |
| Membership/mandate table | 1.3.1, 1.4.10, 2.1.1 | Keyboard sort/filter/actions; no horizontal-only access | Semantic headers and responsive row labels | IA 01 § Accessibility |
| Terms/mandate review | 3.3.2, 3.3.4 | Changed fields precede confirmation | Plain-language summary then structured detail/hash | IA 01 § Accessibility |
| Legal disclosure | 3.3.2, 3.3.4 | Step-up restores exact context/control | Recipient, purpose, fields and persistence announced before consent | IA 01 § Accessibility |
| Loading/error/empty | 4.1.3 | Error summary and recovery focus per FE 00 | Never announces unavailable/hidden identity or authority as empty | IA 01 § Accessibility |
| Transfer/merge/job | 2.2.1, 4.1.3 | Expiry visible, status controls keyboard accessible | Irreversibility, time remaining and terminal outcome announced once | IA 01 § Edge Cases |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, focus restoration after step-up/overlay, and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Identity/settings | Organization/case workbench | Consequential forms |
|---|---|---|---|
| `<=768px` | Single-column fact rows; current acting context persistent; alias/method actions under each record | List then detail stack; membership/mandate rows become labelled records without field loss | One step/section at a time with persistent consequence/action bar; no side-by-side-only comparison |
| `769-1024px` | Two-column definition/value where readable; rail navigation | Conditional split view; detail gets at least 5/8 columns | Summary and fields may split only when zoom/reflow remains valid |
| `>=1025px` | Settings/Registry navigation plus detail | List/detail or record/activity with authority/action rail | Source/proposed or before/after compare side-by-side with identical DOM reading order |

At every width, user identity and acting party remain distinguishable before a protected action. Hidden capability slots collapse. Dense tables preserve every material field through responsive labels rather than horizontal information loss.

## Data Mapping

| BE response | Components consuming exact fields |
|---|---|
| `AuthProviderResponse.providers[].{code,label,state}`, `emailRecoveryEnabled`, `version` | `AuthEntry`, `ProviderChoice` |
| `LoginMethodResponse.methods[].{id,provider,label,verifiedAt,lastUsedAt,removable}`, `recoveryBaselinePresent`, `version` | `LoginMethodManager` |
| `MergeResponse.{mergeId,state,expiresAt,version}` and merge conflict plan/job | `AccountMergeWizard`, `JobStatus` |
| Identity response `person.{id,lifecycle,facets,version}`, aliases, `legalIdentityPresent`, version | `IdentitySummary`, `FacetEditor`, `AliasList` |
| `ActingContextProjection.{partyId,partyKind,label,avatarRef,relationshipId,sourceVersion,expiresAt}` | inherited `ActingContextSwitcher`, `AuthorityExplanation` |
| Legal identity self-edit projection and disclosure projection | `LegalIdentityForm`, `LegalDisclosureFlow`; only named minimum fields pass to browser |
| Organization/type/membership/representation/mandate/governance/lifecycle projections | respective organization components; every action consumes returned version/state rather than local inference |
| Identifier cursor page and owner/public projection | `IdentifierList`, `IdentifierClaimFlow`, `IdentifierCollisionWorkbench` |
| Nomination/case/estate projections | `LegacyNominationForm`, `MemorialCaseView`, `EstateRepresentationFlow` |

No component consumes raw provider payloads, Supabase subjects/tokens, legal documents, evidence bodies, hidden aliases/owners, private claimant data, arbitrary JWT role metadata or service credentials.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every named role variant and lifecycle state; zero-facet/typeless valid states; focus restoration; expiry; changed-field summaries; hidden-field DOM absence |
| Contract | all 01a-d success/error mappings, ETags/idempotency, no-store/legal redaction, concealment-safe 404, cursor policy and job transitions |
| E2E | email/OAuth result, additive link/unlink/final-method block, merge proof/conflict/job, facet blocker, alias create/transfer, explicit context switch/revocation, legal disclosure, org/membership/representation/mandate/governance/lifecycle, identifier collision, nomination, memorial report/case |
| Accessibility | full keyboard and AT flows for switcher, tables, review/confirmation, step-up return, jobs, responsive records and error summaries |
| Security | forged context/deep link/JWT role denial, BOLA across every private route, hidden legal/evidence/provider data, operator assignment/MFA, no client authority token |
| Performance | auth/claim initial JS <=70KB, guided form <=100KB, workbench <=120KB; each island <=50KB unless approved; no hydration waterfall |

## Deepening Record

1. **State synchronization**: callback, ETag, context binding, relationship revocation, governance activation, job and collision refetch behavior converge on server authority.
2. **Network degradation**: provider outage, verification delay, stale authority, merge/memorial job and safe draft recovery have explicit UI states.
3. **Flow sequencing**: all 18 IA interactions map to components/routes and preserve step-up, idempotency, version and third-party reliance order.
4. **Responsive/touch**: tables, workbenches, reviews, transfers and admin evidence flows retain information and keyboard/touch parity.
5. **State exhaustion**: every domain state and named error maps to a rendered state or disclosure-safe absence.
6. **Role exhaustion**: all eight IA principal contexts have explicit cells and named variants.
7. **Accessibility edge cases**: context announcements, changed-field review, destructive consequence, legal disclosure, tables, status and focus restoration are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, full state/error behavior, role variant, responsive rule and inline accessibility contract.
- **Macro**: routes and flows cover IDA-01..18 while preserving identity, legal-data, authority, counsel and history boundaries.
- **Two-implementer assertion**: independent implementers choose the same additive auth model, explicit context switch, role rendering, merge/transfer/governance ordering, identifier collision posture and memorial safeguards.
- **Devil's advocate**: no UI can infer merge, use email/name as identity, turn membership/role/JWT into authority, switch context from a deep link, expose legal/evidence data, auto-resolve collision, treat nomination as probate authority or let an operator bypass counsel policy.
- **Result**: PASS.

## Open Questions

None. SoundCloud remains conditional, TikTok disabled, BandLab unsupported, and memorialisation remains policy-gated exactly as the backend contracts specify.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete identity/authority frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by
- [[specs/fe/00-infrastructure|FE 00 Infrastructure]]
- [[specs/design-system|Design System]]

### Derives from
- [[specs/ia/01-identity-authority|Shard 01 IA]]
- [[specs/be/01a-auth-account-linking|BE 01a]]
- [[specs/be/01b-party-identity-aliases|BE 01b]]
- [[specs/be/01c-relationships-authority-governance|BE 01c]]
- [[specs/be/01d-identifiers-legacy|BE 01d]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/01-identity-authority|Deep Dive 01 — Identity authority and party governance]]

### References
- [[specs/be/01a-auth-account-linking|Authentication, additive login methods and account merge — Backend Specification]]
- [[specs/be/01b-party-identity-aliases|Person, facets, aliases, acting context and legal disclosure — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/01d-identifiers-legacy|External identifiers, legacy succession and memorialisation — Backend Specification]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/ia/deep-dives/01-identity-authority|Deep Dive 01 — Identity authority and party governance]]
- [[specs/design-system|Design System]]
