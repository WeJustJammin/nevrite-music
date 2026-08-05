# Profiles, Claiming and Qualifications - Frontend Specification

> **BE Sources**: [[specs/be/02a-shadow-claim-ownership|Shadow Claims and Ownership]], [[specs/be/02b-profile-portfolio-epk|Profile Portfolio and EPK]], [[specs/be/02c-credentials-trader|Credentials and Trader Status]]  
> **IA Source**: [[specs/ia/02-profiles-verification|Shard 02 Profiles, Claiming and Qualifications]]  
> **Status**: Complete

## Classification

- **Type**: Feature specification spanning three backend contracts that share party identity, public profile and qualification surfaces.
- **Surface**: Public profiles and EPKs; claim, remedy, contest and transfer flows; authenticated profile curation; credential and trader-status settings; assigned review operations.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: Every shell, feedback, state, request, offline, conflict and accessibility behavior inherits [[specs/fe/00-infrastructure|FE 00 Infrastructure]] and is narrowed below.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/02-profiles-verification|Shard 02 IA]] | Features, Interactions PRF-01..16, Contracts, Access Control, Accessibility, Edge Cases |
| IA deep dive | [[specs/ia/deep-dives/02-profiles-verification|Profiles Verification Deep Dive]] | proof tiers, claim/contest states, projection privacy, EPK/media, credential/trader and counsel gates |
| Backend | [[specs/be/02a-shadow-claim-ownership|02a]] | shadow remedies, matching/invitation, claim proof, contests and ownership transfer |
| Backend | [[specs/be/02b-profile-portfolio-epk|02b]] | public profile, portfolio, reel curation, EPK share and PDF export |
| Backend | [[specs/be/02c-credentials-trader|02c]] | credentials, verification jobs, trader questionnaire, mismatch and review |
| Cross-cutting FE | [[specs/fe/00-infrastructure|FE 00]] | shells, global states, errors, confirmation, job/upload/offline and responsive contracts |
| Identity FE | [[specs/fe/01-identity-authority|FE 01]] | party projection, acting context, mandate, step-up and assigned-operator boundaries |
| Design | [[specs/design-system|Design System]] | Public Profile, Auth/Claim/Recovery, Settings/Registry, Guided Form, Record Detail and Admin Operations |

## Source Map

| FE section | Source |
|---|---|
| Shadow notice, remedy and invitation | BE 02a § Core Contracts/API Endpoint Matrix; IA PRF-01..04 |
| Claim, proof, contest and transfer | BE 02a § API Endpoint Matrix/State Machine Registry; IA PRF-05..09 |
| Public profile and portfolio | BE 02b § Projection Invariants/API Endpoint Matrix; IA PRF-10..12 |
| Reel and EPK | BE 02b § API Endpoint Matrix/State Machine Registry; IA PRF-12..13 |
| Credentials and trader status | BE 02c § API Endpoint Matrix/Deterministic Rules; IA PRF-14..16 |
| Role rendering | IA 02 § Access Control; BE authorization/RLS contracts |
| Accessibility | IA 02 § Accessibility; FE 00 component contracts |
| Responsive and visual behavior | Design System; FE 00 responsive contract |

## Design Requirements

**Direction**: The Working Record. Profiles read as credible, evolving professional records rather than promotional templates. Claim and qualification flows are calm, exact and consequence-led.  
**Typography**: Source Sans 3 for content and controls; IBM Plex Mono for claim codes, dates, versions, evidence classes and immutable references.  
**Colors**: restrained Paper/Surface/Graphite. Jam Magenta identifies one current action or focus, never ownership, verification, provenance or trader status.  
**Motion**: 150-220ms bounded feedback; no autoplay, celebration, parallax, animated verification or countdown pressure. Reduced-motion removes nonessential transitions.  
**Anti-patterns**: no user themes, card-grid résumé, aggregate verification/completeness score, decorative verified badge, public shadow page, inferred authority, attester identity, credit-implies-rights shortcut, recipient tracking claim, invented legal copy or silent trader reclassification.

## Design System Compliance

- **Archetypes**: Public Profile for profile/portfolio/reel; Auth/Claim/Recovery for claim/remedy; Guided Form/Transaction for proof, contest, transfer, EPK and trader declaration; Settings/Registry for profile curation and credentials; Record Detail/Activity for cases; Admin Operations for assigned review.
- **Global components consumed**: `<PageShell>`, navigation family, `<ActingContextSwitcher>`, `<RecordHeader>`, `<ProvenanceFact>`, `<StateLabel>`, `<FilterBar>`, `<DataTable>`, `<Timeline>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<MediaPlayer>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every data view inherits FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Claim, ownership, credential and trader commands disallow optimistic success.
- **Empty/error language**: an empty portfolio is valid only after a successful complete projection. Denial, timeout, failed source, hidden alias, unavailable rule pack and unclaimed shadow are distinct states and never collapse to empty.

## Page and Route Definitions

| Route | Archetype and guard | Primary components | Deep-link and navigation behavior |
|---|---|---|---|
| `/profiles/{partyId}` | Public Profile; server confirms lawful public projection | `PublicProfile`, `ProfileRecord`, `ProfileDetail`, `CredentialSummary` | Immutable projection version drives cache; 404 never distinguishes shadow, suppressed or absent party. |
| `/profiles/{partyId}/portfolio` | Public Profile collection | `PortfolioExplorer` | Allowlisted filters/cursor in URL; unfiltered canonical route always available. |
| `/profiles/{partyId}/reel` | Public Profile media | `ReelViewer` | No autoplay; removed/taken-down media refetches without hiding source credit. |
| `/claim/{pointer}` | Public pointer then authenticated Claim/Recovery | `ClaimEntry`, `ClaimProofWizard` | Pointer never authenticates; after sign-in returns to server-resolved current claim, not a client step. |
| `/claim/cases/{claimId}` | Claimant/incumbent minimum projection | `ClaimStatus`, `ClaimProofWizard` | Bookmarkable; refresh reconciles methods, deadline, control and version. |
| `/claim/contests/{contestId}` | Participant minimum projection | `OwnershipContestWorkbench` | Concealment-safe 404; exact case state replaces stale URL state. |
| `/claim/transfers/{transferId}` | Named recipient or current full owner plus step-up | `OwnershipTransferFlow` | Decision link requires authentication and current offer; back navigation cannot replay terminal action. |
| `/shadow/remedy` | Public account-free remedy | `ShadowRemedyFlow` | Existence-safe start; receipt and challenge are never party-discovery or login credentials. |
| `/app/profile` | Current owned/mandated party | `ProfileEditor`, `PortfolioCurator`, `ReelManager` | Acting context stays explicit; each tab is bookmarkable and server-authorized. |
| `/app/profile/epk` | Full owner/exact mandate | `EpkShareManager`, `EpkComposer` | Refresh loads active shares; no token appears in URL before canonical creation result. |
| `/epk/{token}` | Public bearer capability | `EpkViewer` | No auth, no-store, forwarding expected; expired/revoked/empty is invariant 404. |
| `/app/settings/credentials` | Full owner/exact mandate | `CredentialRegistry` | Viewer-relative self projection; evidence body never enters list props. |
| `/app/settings/credentials/new` | Full owner/exact mandate | `CredentialForm` | Registry schema controls fields; unknown type cannot be improvised. |
| `/app/settings/trader-status` | Subject/current commerce authority plus step-up to submit | `TraderStatusPanel`, `TraderAssessmentFlow` | Current pack/version refetched after step-up; unsupported/missing pack is blocked, not a generic questionnaire. |
| `/admin/profile/credentials/{credentialId}` | Assigned reviewer, MFA, named capability | `CredentialReviewWorkbench` | No general profile browse; evidence opens through expiring purpose grant. |
| `/admin/profile/claims/{caseId}` | Assigned case operator, MFA and reason | `OwnershipContestWorkbench` operator variant | Mechanical recovery only; credible conflict routes to Shard 24 rather than owner override. |
| `/admin/profile/trader-reviews/{reviewId}` | Assigned trader operator, MFA and active counsel pack | `TraderReviewWorkbench` | Current pack and assignment rechecked on every action. |

Public unclaimed profiles, known/suspected-minor outreach, unapproved credentials, third-party reel media without rights basis and trader commerce without an approved US rule pack have no enabled route or hidden placeholder.

## Component Inventory

Every component below inherits FE 00 error classes, 8-second read timeout, 15-second protected-command timeout, request-ID persistence, offline rules and exact focus restoration. Safe preference updates may be optimistic; identity, rights, consent, ownership, credential and legal-status changes require canonical success.

### Shadow, Claim and Ownership Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<ShadowMatchAssist input: ShadowMatchInput; suggestions?: SafePartySuggestion[]; timedOut: boolean; onSelect; onContinueNew>` | `idle|matching|suggestions|no_match|timed_out|failed`; 400ms timeout is successful non-blocking no-suggestion. Selection never merges or grants authority. | Suggestions are semantic radio-like choices with “continue as new”; timeout announced without error alarm; mobile choices stack with 44px targets. |
| `<ShadowInvitationStatus shadowId: UUID; dispatch?: JobStatusResponse; inviteState: InviteState; canDispatch: boolean; version: ETag>` | `idle|queued|sent|failed_retryable|stopped|suppressed|limit_reached|conflict`; dispatch remains canonical and no portfolio/title leaks into notice. | State and schedule in text; disabled reason exposed; focus returns to dispatch control; compact timeline becomes labelled rows. |
| `<ShadowRemedyFlow action?: "suppress"|"correct"; receiptCode?: string; challenge?: RemedyChallengeProjection>` | `start|accepted|code_entry|submitting|completed|expired|attempts_exceeded|unavailable|failed`; receipt syntactic validation on submit; six-digit input supports paste/autocomplete; start response remains existence-safe. | Step heading and progress announced; errors preserve entered code and focus field; no forced account prompt; one-column at every width. |
| `<ClaimEntry pointer: string; sessionState: SessionState; target?: SafePartyReference; claim?: ClaimProjection>` | `resolving|sign_in_required|ready|existing_claim|target_unavailable|withheld|failed`; pointer possession never changes control. | Current target and consequence read before continue; route heading receives focus after auth return. |
| `<ClaimProofWizard claim: ClaimProjection; methods: ProofMethodProjection[]; challenge?: ChallengeProjection; version: ETag>` | `select_method|issuing|code_entry|provider_redirect|attestation_review|submitting|provisional|full|stalled|withheld|contested|expired|conflict|failed`; only healthy methods render. Five attempts/15 minutes, Tier/independence outcome and resumability are explicit. | Ordered stepper exposes current step, alternatives, proof requirements and countdown text; OTP paste/autocomplete; error summary is non-destructive; mobile uses one step, desktop may pair explanation and form. |
| `<ClaimStatus claim: ClaimProjection; control: "none"|"provisional"|"full"; deadlines: DeadlineProjection[]; allowedActions: ClaimAction[]>` | Read-only canonical state plus `convert|contest|resume`. Provisional restrictions and reversal window remain visible; convert blocks on window/proof/contest. | State uses text/icon/semantics, never badge color alone; deadlines use absolute date plus relative time; updates announced once. |
| `<OwnershipContestWorkbench variant: "participant"|"operator"; contest: ContestProjection; evidenceSchema?: EvidenceSchema; job?: JobStatusResponse>` | `open|submitting_evidence|resolved|frozen|withdrawn|conflict|failed`; 14-day response, no default winner, operate-only consequences and transfer freeze explicit. Operator cannot guess or bypass counsel/capability. | Timeline, comparable-proof instructions and available actions have semantic headings; evidence upload follows FE 00; focus moves to current status after state change. |
| `<OwnershipTransferFlow transfer: TransferProjection; role: "sender"|"recipient"; partyKind: "person"|"organization"; version: ETag>` | `draft|step_up|pending|accepted|declined|expired|blocked_by_contest|conflict|failed`; recipient decision only, with 14/30-day reversal and 30-day public marker. No optimistic success. | Confirmation names from/to party, acting human, reversibility and marker; cancel restores initiator; actions stack mobile and remain secondary to consequence copy. |

### Profile, Portfolio, Reel and EPK Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<PublicProfile profile: ProfileProjection; projectionVersion: string>` | Fixed `Header -> Now -> Record -> Detail`; sections render `success|empty|denied|degraded|failed` independently. Truly empty sections omit only after successful projection. | Landmarks and ordered headings preserve composition; facts use explicit provenance labels; reflow retains reading order and reserved provenance styling cannot be supplied by content. |
| `<ProvenanceFact fact: ProfileFact; displayMode: "summary"|"detail">` | Renders `asserted|attested|confirmed_assertion|creator_asserted|disputed`, evidence class/count when allowed, date/role/source safe fields. Never attester identity/evidence. | State text and icon, no color-only meaning; source/version detail is keyboard reachable; disputed treatment follows owning credit public policy. |
| `<PortfolioExplorer page: CursorPage<ProfileFact>; filters: RegisteredPortfolioFilter[]; active: PortfolioQuery; projectionVersion: string>` | `loading|success|empty|filter_empty|degraded|failed|stale`; filters update URL and refetch. Hidden aliases are excluded before every total/filter/count. Failure never yields zero. | Filter controls labelled and keyboard operable; result count announced; focus stays on changed filter; clear/unfiltered route visible; table becomes labelled records without field loss. |
| `<ProfileEditor sections: ProfileSectionProjection[]; schemas: ProfileSectionSchema[]; capabilities: SectionCapability[]; partyVersion: ETag>` | Per-section `view|edit|submitting|success|validation_error|conflict|forbidden|failed`; content <=32KiB and registry validated on blur/submit. Cannot edit attested facts, layer order, HTML/CSS/scripts/active URLs or provenance visuals. | Persistent labels/error summary; section save restores heading; changed-field review on conflict; single-column editor mobile, preview adjacent only when reading order remains valid. |
| `<PortfolioCurator emphasis: EmphasisProjection; visibleRefs: SafeFactReference[]; version: ETag>` | `loading|editing|optimistic_pending|optimistic_rollback|success|conflict|invalid_ref|failed`; reorder/emphasis/unlist affects this party page only and never source credit. | Keyboard move controls plus pointer reorder; position announced; unlist explanation names unchanged ledger/co-contributor pages; no drag-only interaction. |
| `<ReelManager items: ReelItemProjection[]; eligibleCredits: SafeCreditReference[]; rightsOptions: RightsBasisDefinition[]; version: ETag>` | `loading|empty|editing|pending_verification|active|rejected|hidden|removed|rights_invalid|conflict|failed`; add validates credit, media, role, rights basis/ref. Reorder/list may be optimistic; add/remove waits for canonical result. | Media controls, transcript/caption status and rights state in text; no autoplay; keyboard reorder; takedown restores focus to removed row position or manager heading. |
| `<ReelViewer items: PublicReelItemPage>` | `loading|success|empty|degraded|failed`; only active rights-valid items. Takedown during playback stops item, explains availability change and preserves source credit link. | Inherits accessible `<MediaPlayer>` controls, captions/transcripts, reduced motion and no autoplay; list order matches DOM/play order. |
| `<EpkComposer party: ProfileProjection; selectableFacts: SafeFactReference[]; consents: ConsentProjection[]; defaults: EpkPolicyProjection>` | `editing|consent_required|review|submitting|success|conflict|failed`; recipient label/purpose required; default public facts; each private alias/member credit needs explicit current consent/inclusion; forwarding warning required. | Grouped fieldsets and selected-data summary precede confirm; no prechecked private inclusion; removed consent announced and selection disabled; one-column review mobile. |
| `<EpkShareManager shares: EpkShareProjection[]; jobs: Record<UUID, JobStatusResponse>>` | `loading|empty|success|revoking|revoked|expired|empty_share|export_queued|export_running|export_failed|source_changed|conflict`; token shown once in create result, revoke immediate, PDF job follows FE 00. | Semantic table/labelled rows; copy-link result announced without reading token aloud by default; job and material-change status explicit; revoke restores row focus. |
| `<EpkViewer epk: PublicEpkProjection; currentAt: ISODateTime; generatedPdf?: AccessibleExportLink>` | `loading|success|degraded|failed|absent`; selected lawful live facts only; no recipient identity claim or tracking UI. | WCAG 2.2 AA headings/reflow/alt text; descriptive links; current timestamp and live-vs-snapshot notice visible; PDF has tagged structure and canonical live link. |

### Credential and Trader Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<CredentialRegistry page: CursorPage<CredentialProjection>; definitions: CredentialTypeDefinition[]; capabilities: CredentialCapability[]>` | `loading|empty|success|degraded|failed`; states `submitted|reviewing|verified|expired|rejected|revoked|unknown` remain visible. Filters never turn dependency failure into zero. | State/method/expiry use text and semantics; semantic table becomes labelled records; unknown/expired is not styled as verified. |
| `<CredentialForm party: SafePartyReference; definition: CredentialTypeDefinition; value?: CredentialDraft; version: ETag>` | Registry-driven jurisdiction/type/issuer/ref/dates/method/evidence fields; validation on blur and submit; `submitting|success|schema_invalid|method_unavailable|conflict|failed`. Assertion never verifies. | Dynamic requirements announced; date/issuer errors tied to controls; evidence upload follows FE 00 and protected values do not persist in browser storage. |
| `<CredentialReviewWorkbench credential: ReviewerCredentialProjection; attempt?: CredentialAttemptProjection; capability: ReviewerCapability; job?: JobStatusResponse>` | `submitted|reviewing|verification_queued|verified|rejected|unknown|expired|revoked|conflict`; assigned reviewer only, MFA and purpose grant. Stale provider result cannot change record. | Evidence/action rail separated from safe subject summary; decision consequence and current method/version read before submit; focus returns to state heading after job result. |
| `<TraderStatusPanel status: TraderStatusProjection; rulePack?: TraderRulePackProjection; listingEffects: ListingEffectProjection[]>` | `private|trader|undetermined|review_required|pack_unavailable|degraded|failed`; listing eligibility is server output. Review-required pauses public listings but preserves drafts/orders. | Classification, effective period and effects in plain text; no accusatory color/icon; current rule version available in mono. |
| `<TraderAssessmentFlow party: SafePartyReference; rulePack: TraderRulePackProjection; existing?: TraderStatusProjection; version: ETag>` | `loading|editing|review|step_up|submitting|private|trader|undetermined|review_required|pack_stale|validation_error|conflict|failed`; exact future public fields/effects shown before explicit unchecked acknowledgement. | Each question has persistent label/help; disclosure gets heading and field list; step-up restores exact question/review context; changed pack forces reread and acknowledgement. |
| `<TraderReviewWorkbench review: TraderReviewProjection; signals: SafeMismatchSignal[]; rulePack: TraderRulePackProjection; assignment: OperatorAssignment>` | `open|deciding|decided|cancelled|pack_stale|conflict|failed`; bounded metrics only, no buyer/content/payment detail; operator may apply only current-pack outcomes or continue block. | Neutral evidence language; signal table has semantic headers; decision basis and listing effect announced before confirm; no silent “fraud” or legal verdict copy. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Claim, proof, contest, transfer and control | Server canonical with ETag; claim pointer and route IDs are locators only; refresh always refetches state/methods/deadlines. |
| Profile, portfolio, reel and EPK | Server projection/version. URL stores registered public filters; safe curator draft may persist through step-up, but private alias/member selections do not persist outside current EPK draft. |
| Credential/trader evidence and answers | No-store server projection plus current component memory; cleared on route exit/session loss; never service-worker cached, logged or analyzed. |
| Public EPK | Opaque token capability; no local profile merge, authentication inference or recipient identity state; no-store response. |
| Pending verification/export jobs | Stable server job ID survives refresh; terminal state stops polling; source-version changes refetch or return typed failure. |

- Browser back/forward restores only a server-valid wizard route. If proof methods, contest, transfer, consent, credential or rule pack changed, render current state and explain the change.
- Unsaved-change guards protect profile, EPK, credential and trader drafts. They never obstruct immediate authority, consent, takedown or rule-pack invalidation.
- Realtime invalidation marks public/owner projection stale, then refetches. It never patches provenance, control, credential or trader classification from an event payload.
- Multi-tab conflicts preserve safe draft input and present current-versus-proposed review. Only emphasis/reorder preferences permit deliberate last-write-wins behavior.
- Offline public pages may show a labelled cached projection where FE 00 permits; claim, contest, transfer, credential, EPK creation/revocation and trader submission remain blocked until online.

## Interaction Flows

### Shadow Notice and Account-Free Remedy

1. Source-domain capture may show viewer-safe duplicate suggestions for at most 400ms; continue remains available and never merges.
2. Invitation status reflects queued/sent/stopped state without revealing work titles or portfolio.
3. Remedy start accepts receipt/action with existence-safe response and issues a fresh route challenge.
4. Six-digit proof completion either applies suppression/correction case or returns typed expiry/attempt state; no account is requested.

### Claim, Contest and Transfer

1. Pointer resolves target and current case only after authentication; it never proves control.
2. Wizard ranks currently healthy Tier A/B/C methods and issues a fresh challenge.
3. Proof submit revalidates claim, party, challenge, attester independence and version; result is provisional, full, stalled, withheld or contested.
4. Provisional view exposes allowed reversible actions and denied durable actions. Conversion requires elapsed window or stronger independent proof and no contest.
5. Contest preserves current operation, blocks ownership transfer, shows the 14-day response and accepts comparable evidence without default winner.
6. Full owner starts transfer after step-up; recipient accepts/declines after step-up; accepted result shows reversal and public marker periods.

### Profile, Reel and EPK

1. Server composes fixed Header, Now, Record and Detail from viewer-authorized facts and immutable projection version.
2. Portfolio filters query the visible source set; hidden aliases are excluded before totals and counts.
3. Editor changes one asserted section with expected version; curator changes only emphasis/listing; neither mutates source credit/provenance.
4. Reel add submits credit, role, media and rights basis to verification. Only active rights-valid items publish; takedown removes media, not credit.
5. EPK composer selects recipient/purpose/public facts and explicitly consented private facts, then reviews forwarding consequences.
6. Created share is live and revocable. PDF is an accessible timestamped snapshot; source changes update live EPK and notify sender.

### Credentials and Trader Status

1. Credential definition determines fields and methods; submit creates `submitted`, never `verified`.
2. Verification job or assigned review advances only current evidence/version. Expired/revoked/unknown remain visible.
3. Trader screen loads an approved jurisdiction/surface rule pack; absent pack blocks assessment and listing publication.
4. User answers situational questions, reviews exact public fields/effects, explicitly acknowledges, completes step-up and submits current pack version.
5. Durable mismatch moves status to `review_required`, pauses listings and routes assigned review without silently calling the party a trader.

## Error-to-UI Matrix

FE 00 status-class behavior applies. Persistent errors include request ID and never expose contact routes, attesters, evidence, hidden aliases, trader answers, tokens or other-side claim data.

| Code | Component state and copy intent | Recovery |
|---|---|---|
| `SUPPRESSED`, `INVITE_LIMIT`, `SHADOW_NOT_FOUND` | Invitation stopped/blocked or concealment-safe absent | Do not retry blindly; use allowed remedy/status route only. |
| `CHALLENGE_EXPIRED`, `ATTEMPTS_EXCEEDED` | Remedy/proof code terminal state | Issue a fresh eligible challenge; preserve case, not secret code. |
| `METHOD_UNAVAILABLE` | Proof/credential method unavailable | Preserve current state and offer another healthy method or later retry. |
| `PROOF_FAILED`, `INDEPENDENCE_FAILED` | Proof rejected with typed safe reason | Select eligible fresh method/evidence; never reveal failed attester graph. |
| `CLAIM_STATE_CONFLICT`, `VERSION_CONFLICT`, `CONTEST_OPEN` | Claim/transfer conflict | Refetch canonical case, preserve safe draft and show current allowed actions. |
| `WINDOW_ACTIVE`, `INDEPENDENT_PROOF_REQUIRED` | Conversion blocked | Show exact window end or stronger-proof requirement. |
| `CONTEST_LIMIT`, `EVIDENCE_INSUFFICIENT` | Contest blocked/needs review | Route legitimate Shard 24 case path; no paid or admin shortcut. |
| `PROFILE_NOT_FOUND` | Concealment-safe profile absent | Standard 404; do not distinguish shadow/suppressed/deleted. |
| `PROJECTION_UNAVAILABLE`, source `503` | Explicit degraded/failed profile section | Retry read; never display empty portfolio/counts. |
| `SECTION_CONTENT_INVALID`, `PROFILE_EDIT_FORBIDDEN` | Section validation/forbidden | Link fields or show capability reason; preserve safe draft. |
| `EMPHASIS_REF_INVALID` | Curator stale reference | Refetch visible references and reconcile ordering. |
| `RIGHTS_BASIS_INVALID`, `CREDIT_NOT_FOUND`, `ITEM_EXISTS` | Reel add blocked | Correct rights/source selection; never imply credit grants media rights. |
| `CONSENT_REQUIRED` | EPK review blocked | Remove private fact or obtain active named consent; no implicit inclusion. |
| `SOURCE_CHANGED` | PDF export failed/current source changed | Refetch and deliberately generate from current source version. |
| `CREDENTIAL_SCHEMA_INVALID`, `METHOD_UNAVAILABLE` | Credential form/review invalid or delayed | Apply current registry fields or choose configured method. |
| `TRADER_RULE_PACK_UNAVAILABLE`, `JURISDICTION_UNSUPPORTED` | Trader capability blocked | Disable submission/listing activation; no fallback legal copy. |
| `RULE_PACK_STALE`, `ANSWERS_INVALID`, `DISCLOSURE_NOT_ACKNOWLEDGED` | Assessment review invalid | Refetch pack, re-answer affected fields and explicitly re-acknowledge. |
| `STEP_UP_REQUIRED` | Protected submit interruption | Complete step-up and restore exact safe field/control context. |

## Conditional Rendering Matrix

| Feature/component | Anonymous | Shadow subject | Provisional owner | Full owner/mandate | Attester | Credential reviewer | Case operator | EPK recipient |
|---|---|---|---|---|---|---|---|---|
| Public profile/portfolio/reel | lawful public projection | public only if separately released; otherwise hidden | public projection plus reversible edit entry | public projection plus full eligible management | public projection | no review-context browse | assigned case minimum only | selected EPK projection only |
| Shadow remedy/invitation | account-free remedy; no internal status | full remedy for contacted route | own prior remedy status only | own-party invitation status within source capability | notice response only | hidden | assigned remedy case | hidden |
| Claim proof/status | pointer then auth | cannot act without account/fresh proof | full own case, restrictions visible | full own/incumbent case | specific attestation response only | hidden | assigned minimum case | hidden |
| Contest/transfer | contest initiation where allowed; no transfer | contest initiation after proof path | contest initiation; transfer hidden | full contest; transfer when uncontested | notice/eligible response only | hidden | assigned contest, no silent override | hidden |
| Profile editor/curator | hidden | hidden | reversible asserted edit/curation; private export hidden | full eligible sections/curation | hidden | hidden | case-linked read minimum | hidden |
| Reel manager | hidden | hidden | only independently rights-valid reversible actions | full rights-valid management | hidden | hidden | takedown/case minimum | view selected item only |
| EPK composer/manager | hidden | hidden | hidden | full exact capability | hidden | hidden | case minimum, no token export | active share view/forward only |
| Credentials | public safe state if configured | hidden | propose only where reversible; no verified claim | list/create/verify request/revoke own | hidden | assigned evidence/action | assigned case minimum | selected public state only |
| Trader assessment/status | listing disclosure only | hidden | read own current status; submission only if commerce authority permits | full own current-pack flow | hidden | hidden | assigned mismatch review | selected listing disclosure only |

Named variants: `publicProjection`, `shadowRemedyOnly`, `provisionalReversible`, `fullOwnerGrantScoped`, `attesterSpecificResponse`, `reviewerAssignedEvidence`, `operatorAssignedCase`, `epkSelectedBearer`, `concealmentSafeHidden`.

## Accessibility Inventory

| Component/interaction | WCAG | Keyboard/focus | Screen-reader behavior | IA source |
|---|---|---|---|---|
| Provenance and qualification states | 1.3.1, 1.4.1 | State/source detail keyboard reachable | Announces asserted, attested, disputed, provisional, expired, unknown and trader text, never color alone | IA 02 § Accessibility |
| Claim/contest stepper and OTP | 1.3.1, 2.2.1, 3.3.1, 4.1.3 | Logical step order, paste/autocomplete, error returns exact control | Announces current step, alternatives, requirements, attempts and absolute/relative deadline | IA 02 § Accessibility |
| Profile partial states | 1.3.1, 4.1.3 | Retry and unfiltered route reachable | Distinguishes loading, empty, denied, degraded and failed; never announces failed portfolio as empty | IA 02 § Accessibility |
| Record filters | 2.1.1, 2.4.3, 4.1.3 | Keyboard filter/clear; focus preserved | Announces active filters and result count | IA 02 § Accessibility |
| Reel playback and takedown | 1.2.1-1.2.5, 2.2.2 | Full media controls; no autoplay | Captions/transcript availability, role, rights and takedown state announced | IA 02 § Accessibility |
| EPK link/PDF | 1.1.1, 1.3.1, 1.4.10, 2.4.4 | Reflow and descriptive links | Tagged headings, image alternatives, generated/current timestamps and live/snapshot distinction | IA 02 § Accessibility |
| Trader/legal disclosure | 3.3.2, 3.3.4 | Explicit unchecked confirmation; step-up restores exact context | Announces future public fields, consequences, rule version and changed disclosure | IA 02 § Accessibility |
| Transfer/revoke/takedown confirmation | 3.3.4, 2.4.6 | Consequence before commit; cancel restores initiator | Announces actor, target, irreversible/reversible effect and deadline | IA 02 § Edge Cases |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, captions/transcripts, focus restoration after step-up/overlay and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Public profile/portfolio | Claim/settings forms | Case/admin workbench |
|---|---|---|---|
| `<=768px` | Fixed layers stack in canonical order; filters open inline and retain visible summary; media fills content width without autoplay | One step/section at a time; current claim/control/rule state persistent above action; code fields use suitable input mode | Timeline then evidence/action sections; tables become labelled records with no state/deadline loss |
| `769-1024px` | Header/Now may pair; Record remains primary full-width body; Detail uses readable two-column groups | Explanation and form may split when reflow remains valid | Conditional list/detail split with state/action rail below record header |
| `>=1025px` | Restrained editorial grid with Record dominant and Detail secondary; no card dashboard | Guidance and form side-by-side with identical DOM reading order | Record/activity split plus assigned action rail; evidence never hidden in hover-only UI |

At every width, current human/acting party, claim/control state, provenance, rights state, deadlines and legal disclosure remain textual. Hidden capability slots collapse. Touch and keyboard provide equivalent reorder/filter/media/action behavior.

## Data Mapping

| BE response | Components consuming exact fields |
|---|---|
| Shadow match `{ suggestions[], timedOut }`, invitation `JobStatus`, remedy accepted/challenge result | `ShadowMatchAssist`, `ShadowInvitationStatus`, `ShadowRemedyFlow` |
| Claim `{ id,targetParty,state,control,eligibleMethods,deadlines,version }` and challenge `{ challengeId,expiresAt,maskedDestination? }` | `ClaimEntry`, `ClaimProofWizard`, `ClaimStatus` |
| Contest/transfer participant-safe projections and versions | `OwnershipContestWorkbench`, `OwnershipTransferFlow` |
| Profile `{ header,now,recordSummary,detail,projectionVersion }` | `PublicProfile`, `ProfileEditor`, `EpkViewer` |
| `CursorPage<ProfileFact>` with source/version/provenance/evidence/visibility safe fields | `PortfolioExplorer`, `ProvenanceFact`, `PortfolioCurator` |
| Reel item `{ id,creditRef,mediaKind,mediaRef,roleCode,rightsBasis,state,order,version }` | `ReelManager`, `ReelViewer` |
| EPK share `{ id,shareUrl,expiresAt,version,state,selectedRefs,materialChange }` and export `JobStatus` | `EpkComposer`, `EpkShareManager`, `EpkViewer` |
| Credential cursor/item `{ id,jurisdiction,profileType,issuer,issuedOn,expiresOn,method,state,version }` | `CredentialRegistry`, `CredentialForm`, `CredentialReviewWorkbench` |
| Rule pack `{ jurisdiction,surface,version,questions,disclosurePreview,effects }` and trader status `{ classification,effectivePeriod,listingEligibility,version }` | `TraderStatusPanel`, `TraderAssessmentFlow`, `TraderReviewWorkbench` |

No component consumes claim evidence for the other side, attester identity, raw provider payloads, legal identity, protected credential evidence outside assigned purpose grant, trader answer bodies outside the current self/review flow, hidden aliases, EPK token hashes, recipient tracking identity or unrestricted mismatch data.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every named role variant and lifecycle state; OTP attempts/expiry; deadlines; partial-profile states; provenance text; hidden-field DOM absence; consent/rule-pack invalidation; focus restoration |
| Contract | all 02a-c successes/errors, ETags/idempotency, concealment-safe 404, no-store/redaction, cursor behavior, job transitions, fixed profile composition and state registries |
| E2E | account-free remedy, claim resume/Tier methods/provisional/full, contest/freeze/transfer, profile edit/conflict, portfolio filter/unlist, reel rights/takedown, EPK consent/share/revoke/PDF, credential verify/expiry, trader pack/step-up/mismatch review |
| Accessibility | keyboard and AT flows for steppers, OTP, filters, provenance, media, EPK/PDF, disclosure, responsive records, status timelines and error summaries |
| Security | bearer pointer cannot claim, BOLA on every private route, shadow non-discovery, no attester/evidence/alias/token/trader-answer leaks, assignment/MFA/purpose grants, no client authority inference |
| Performance | public profile initial JS <=70KB, claim/guided form <=100KB, workbench <=120KB; each island <=50KB unless approved; public reads honor backend `<750ms` target without hydration waterfall |

## Deepening Record

1. **State synchronization**: claim, proof, contest, transfer, projection, consent, rights, credential, job and rule-pack versions converge on server authority.
2. **Network degradation**: provider/method outage, projection partial failure, media verification, export source drift and rule-pack unavailability have explicit non-empty UI states.
3. **Flow sequencing**: PRF-01..16 map to routes/components and preserve fresh proof, step-up, consequence review, idempotency and canonical confirmation order.
4. **Responsive/touch**: fixed profile layers, filters, steppers, media, curation and review workbenches retain content and keyboard/touch parity.
5. **State exhaustion**: every shadow, claim, proof, contest, transfer, section, reel, EPK, credential and trader state maps to rendered behavior or concealment-safe absence.
6. **Role exhaustion**: all eight IA principal contexts have explicit cells and named variants; hidden slots collapse and never leak data.
7. **Accessibility edge cases**: OTP, deadline, provenance, partial-state, filter result, media, live/snapshot, legal disclosure and focus-restoration behavior are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has a props interface, exhaustive states/errors, validation timing, role variant, responsive behavior and inline accessibility contract.
- **Macro**: routes and flows cover PRF-01..16 while preserving shadow privacy, fresh proof, reversible provisional control, fixed profile composition, source credit truth, media rights, revocable consent, credential evidence and counsel-gated trader behavior.
- **Two-implementer assertion**: independent implementers choose the same route guards, state transitions, role visibility, profile order, proof/contest/transfer sequencing, EPK live-versus-snapshot semantics and trader disclosure gate.
- **Devil's advocate**: no UI can turn a link into identity, expose a shadow, infer full control, hide a failed portfolio as empty, convert credit into media rights, aggregate hidden aliases, track a recipient as authenticated, verify a credential by assertion, invent legal copy or silently classify a trader.
- **Result**: PASS.

## Open Questions

None. Public unclaimed profiles, known/suspected-minor outreach, unsupported credential profiles, unlicensed reel media and trader commerce without an approved US rule pack remain disabled exactly as the upstream contracts require.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete profiles, claiming and qualifications frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by
- [[specs/fe/00-infrastructure|FE 00 Infrastructure]]
- [[specs/fe/01-identity-authority|FE 01 Identity Authority]]
- [[specs/design-system|Design System]]

### Derives from
- [[specs/ia/02-profiles-verification|Shard 02 IA]]
- [[specs/ia/deep-dives/02-profiles-verification|Profiles Verification Deep Dive]]
- [[specs/be/02a-shadow-claim-ownership|BE 02a]]
- [[specs/be/02b-profile-portfolio-epk|BE 02b]]
- [[specs/be/02c-credentials-trader|BE 02c]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/02-profiles-verification|Deep Dive 02 — Profiles, claiming and qualifications]]

### References
- [[specs/be/02a-shadow-claim-ownership|Shadow parties, claims, contests and ownership transfer — Backend Specification]]
- [[specs/be/02b-profile-portfolio-epk|Public profiles, portfolio, reel and EPK delivery — Backend Specification]]
- [[specs/be/02c-credentials-trader|Credentials and trader-status assessment — Backend Specification]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/ia/deep-dives/02-profiles-verification|Deep Dive 02 — Profiles, claiming and qualifications]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/design-system|Design System]]
