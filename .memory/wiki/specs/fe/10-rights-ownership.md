# Rights and Ownership - Frontend Specification

> **BE Sources**: [[specs/be/10a-rights-objects-ledgers|Rights Objects and Ledgers]], [[specs/be/10b-splits-points-buyouts-amendments|Splits Points Buyouts and Amendments]], [[specs/be/10c-title-control-conflicts-freezes|Title Control Conflicts and Freezes]], [[specs/be/10d-ai-training-nil-consent|AI Training and NIL Consent]], [[specs/be/10e-identifiers-registration-evidence|Identifiers Registration and Evidence]]  
> **IA Source**: [[specs/ia/10-rights-ownership|Shard 10 Rights and Ownership]]  
> **Status**: Complete

## Classification

- **Type**: High-complexity feature specification spanning five backend contracts, exact-rational ledgers, consent evidence, title chains, conflict/freeze instructions, person-held consent and registration evidence.
- **Surface**: Private rights workspace, session split capture, ledger consent/amendment, chain-of-title and control, rights cases, AI-training/NIL positions, identifiers, registration drafts, evidence export and later public lookup.
- **Approval**: Recommended grouping, launch boundary and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 governs jobs/artifacts/errors; FE 01 authority/representation; FE 06 cases/evidence; FE 07 credits remain orthogonal; FE 08 AI disclosure remains distinct; FE 09 supplies source project/session records.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/10-rights-ownership|Shard 10 IA]] | delivery phases, RGT-01..20, contracts, access control, accessibility and edge cases |
| IA deep dive | [[specs/ia/deep-dives/10-rights-ownership|Rights and Ownership Deep Dive]] | exact arithmetic, consent freezing, title/control folding, person-held consent and evidence boundaries |
| Backend | [[specs/be/10a-rights-objects-ledgers|10a]] | work/recording objects, weighted links, ledgers, proposals, consent links and public-domain declarations |
| Backend | [[specs/be/10b-splits-points-buyouts-amendments|10b]] | split capture, producer points, buyouts/WFH, amendments, re-consent and true-up evidence |
| Backend | [[specs/be/10c-title-control-conflicts-freezes|10c]] | title events, grants, reversion, succession, control, conflicts, cases and freeze instructions |
| Backend | [[specs/be/10d-ai-training-nil-consent|10d]] | holder-scoped AI-training positions, person-held NIL, declarations and version-pinned evaluations |
| Backend | [[specs/be/10e-identifiers-registration-evidence|10e]] | identifier preflight/allocation, possession proof, registration drafts, public projection and evidence artifacts |
| Design | [[specs/design-system|Design System]] | Working Record, Record Detail, Guided Form, List-to-Detail Workbench and Admin Operations |

## Source and Interaction Map

| IA interaction | Frontend owner | Completion boundary |
|---|---|---|
| `RGT-01` Assert work/recording | `RightsObjectAssertionFlow` | Separate composition/recording assertion commits without shares or legal conclusion. |
| `RGT-02` Link recording/work | `RecordingWorkLinkEditor` | Positive reduced rational weights total exactly 100% in an immutable link-set version. |
| `RGT-03` Draft/propose ledger | `OwnershipLedgerEditor`, `LedgerProposalReview` | Draft may be unallocated; balanced full ledger freezes before consent. |
| `RGT-04` Consent/refuse ledger | `LedgerConsentFlow` | Named party reviews complete exact frozen ledger and records immutable decision. |
| `RGT-05` Capture split at close | `SplitCaptureFlow` | Prefilled parties/designations contain no percentages and never block session close. |
| `RGT-06` Record producer points | `ProducerPointsEditor` | Named base/rate/payee/recoupment becomes consented master encumbrance, not ownership. |
| `RGT-07` Record WFH/buyout | `BuyoutDesignationFlow` | Contribution-scoped designation/evidence/consent records no claim of legal effectiveness. |
| `RGT-08` Amend ledger | `LedgerAmendmentWorkbench` | One frozen open successor resets affected consents; current ledger governs until applied. |
| `RGT-09` Transfer/grant/reversion | `TitleEventEditor`, `TerritoryGrantEditor` | Scoped immutable chain event updates derived registry without deleting history. |
| `RGT-10` Resolve control summary | `ControlSummary` | Version-pinned fold returns `authorized|blocked|no_recorded_obstacle` with uncertainty. |
| `RGT-11` Detect rights conflict | `RightsConflictInbox` | Deterministic overlap/duplicate signal records evidence without opening a case or deciding merits. |
| `RGT-12` Open rights dispute | `RightsCaseOpeningFlow` | Standing party opens exact-scope Shard 06 case with unweighted platform evidence. |
| `RGT-13` Freeze disputed share | `FreezeInstructionStatus` | Exact share/territory/period instruction reflects downstream evidence and never claims custody. |
| `RGT-14` Record AI-training consent | `AITrainingPositionEditor`, `AITrainingEvaluation` | Holder positions remain scoped; most restrictive controls and absence stays unknown. |
| `RGT-15` Record NIL position | `NILPositionEditor` | Person/authorized representative controls voice/name/likeness independently of ownership. |
| `RGT-16` Record AI declaration | `AIContentDeclarationEditor` | Structured declaration is versioned, orthogonal and never detected/inferred. |
| `RGT-17` Allocate/reconcile identifier | `IdentifierWorkbench` | Later-gated preflight prevents duplicate allocation; owners confirm canonical among conflicts. |
| `RGT-18` Prepare registration | `RegistrationDraftWorkbench` | Reviewed source-pinned artifact never auto-files or claims copyright creation. |
| `RGT-19` View rights evidence | `PrivateRightsEvidence`, `PublicRightsProjection` | Private complete and public publication-safe projections remain separate. |
| `RGT-20` Export title evidence | `RightsEvidenceExportFlow` | Scoped immutable artifact names sources, gaps, trust, checksum and receipt. |

## Delivery Phase Gates

| Capability | Consumer launch | Activation boundary | Disabled behavior |
|---|---|---|---|
| Rights objects, ledgers, split capture, consent and evidence export | Enabled for current authorized parties | Current identity/authority/source versions | Typed refusal; no hidden object/party inference |
| Chain events, control, conflicts and cases | Enabled as evidence/workflow, not legal adjudication | Standing and exact scope | Uncertain/blocked remains explicit; no admin merits decision |
| AI-training, NIL and AI declarations | Enabled as scoped holder/person/declarant positions | Current holder/person authority | Absence=`no_position`/`undeclared`, never permit/human origin |
| Identifier registrant allocation, filing adapters, public lookup, society/full-territory operations | Later activation | Approved scheme/profile/operator/privacy/provider gates | Routes/actions absent; gate denial before source lookup |
| Custody/escrow, multi-party payouts and broad automated reversion/termination | Counsel-gated/excluded | Separately approved legal/financial contracts only | No money-movement UI or “funds held” state |

Fixed approved reversion rules may execute only where the exact architecture/counsel gate permits; conditional rules remain notify-only.

## Design Requirements

**Direction**: A working title record: exact, sober and evidence-led, never legal theatre.  
**Typography**: Source Sans 3 for explanations/forms; IBM Plex Mono for rational values, hashes, versions, identifiers, territories and evidence IDs.  
**Colors**: Paper/Surface/Graphite; Jam Magenta only for current action. Consent, conflict, unknown and freeze status use text/structure, never color alone.  
**Motion**: bounded 150-220ms feedback; no animated ownership pies, countdown pressure or celebratory consent.  
**Anti-patterns**: no auto-remainder, inferred consent, zero-share bought-out row, percentage-default public view, legal-advice wording, chronology-as-title winner, public dispute leak, ownership-implies-NIL, AI detection, auto-registration, identifier auto-choice or custody claim.

## Design System Compliance

- **Archetypes**: Working Record for rights workspace; Guided Form for assertions/consent/positions; Record Detail for ledger/title/evidence; List-to-Detail for conflicts/registration; Admin Operations for gated identifier profiles.
- **Global components**: `<PageShell>`, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<StateLabel>`, `<DataTable>`, `<Timeline>`, `<GapList>`, `<SemanticDiff>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<DownloadControl>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every data view implements FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Rights, consent, title, freeze, position and evidence truth require canonical success.
- **Timing**: 8-second reads and 15-second protected commands; artifact/provider jobs expose stable polling and actor-safe retries.
- **Precision**: UI stores/transmits reduced numerator/denominator or canonical decimal input contract; binary floating-point never determines balance, equality or display.

## Page and Route Definitions

| Route | Guard/archetype | Primary components | Navigation behavior |
|---|---|---|---|
| `/app/rights` | Named rights party; Workbench | `RightsObjectList`, `RightsObjectAssertionFlow` | Viewer-safe type/state filters; counts after authorization. |
| `/app/rights/{objectId}` | Authorized object viewer; Record Detail | `RightsObjectRecord`, `RecordingWorkLinkEditor`, `ControlSummary` | Separate work/recording identity always visible. |
| `/app/rights/{objectId}/ledgers/{ledgerId}` | Named ledger party/editor | `OwnershipLedgerEditor`, `LedgerProposalReview`, `LedgerConsentFlow` | Exact version/hash in rendered record, never URL secret. |
| `/app/split-captures/{captureId}` | Session participant/authorized editor | `SplitCaptureFlow` | Session close remains independent; current draft/debt canonical. |
| `/app/contributions/{contributionId}/terms` | Required parties | `ProducerPointsEditor`, `BuyoutDesignationFlow` | Ownership and encumbrance/designation panels remain separate. |
| `/app/rights/ledger-amendments/{id}` | Affected standing party | `LedgerAmendmentWorkbench` | Current versus proposed complete diff before decision. |
| `/app/rights/{objectId}/title` | Authorized rights party | `TitleChainTimeline`, `TitleEventEditor`, `TerritoryGrantEditor` | Linear timeline canonical; graph optional and aria-hidden. |
| `/app/rights/{objectId}/conflicts` | Named party/reviewer | `RightsConflictInbox`, `RightsCaseOpeningFlow`, `FreezeInstructionStatus` | Case/freeze scopes remain exact and private. |
| `/app/rights/consent-positions` | Holder/person/evaluator | `AITrainingPositionEditor`, `NILPositionEditor`, `AITrainingEvaluation` | Position type/scope/version explicit; no ownership shortcut. |
| `/app/rights/ai-declarations/{contentId}` | Contributor/authorized declarant | `AIContentDeclarationEditor` | Source visibility first; absence renders `undeclared`. |
| `/app/rights/{objectId}/identifiers` | Later-gated owner/operator | `IdentifierWorkbench` | Route omitted until scheme/operator capability active. |
| `/app/rights/registrations/{draftId}` | Later-gated registrant | `RegistrationDraftWorkbench` | No submit/filing status without separate adapter evidence. |
| `/app/rights/{objectId}/evidence` | Named party/case grant | `PrivateRightsEvidence`, `RightsEvidenceExportFlow` | Protected evidence/exports no-store and purpose-bound. |
| `/rights/{publicId}` | Later public-lookup gate | `PublicRightsProjection` | Concealment-safe 404; no percentages/disputes/hidden counts. |
| `/rights/consent/{token}` | Bound intended identity | `LedgerConsentFlow` | Complete frozen ledger only; token never substitutes identity/authority. |

## Component Inventory

Every component inherits FE 00 request IDs, timing, errors, redaction and focus restoration. Safe filters may use optimistic rollback; all rights/consent commands wait for canonical confirmation.

### Objects, Ledgers and Agreements

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<RightsObjectList page: RightsObjectPage; query: RightsObjectQuery; capabilities: RightsCapability[]>` | `loading|empty|success|degraded|failed`; authorized work/recording objects, state, source and proof freshness. Failure never becomes zero. | Semantic table/list; type/state/source text; keyboard filters; 200/400% reflow. |
| `<RightsObjectAssertionFlow kind: "work"|"recording"; source: AuthorizedSourceProjection; parties: SafePartyPage>` | `editing|submitting|success|source_stale|validation_error|failed`; title/source/party/jurisdiction hints only; no share assignment. | Work/recording explanation before form; persistent labels/errors; review summary. |
| `<RightsObjectRecord object: RightsObjectResponse; source: RightsSourceProjection; proof: CreationProofProjection>` | Shows distinct object kind, assertion source, possession proof state and non-advice language. `loading|success|degraded|failed`. | Definition list; proof failure distinct from no proof; source/provenance announced. |
| `<RecordingWorkLinkEditor recording: RightsObjectResponse; links: RecordingWorkLinkSetResponse; works: SafeRightsObjectPage; etag: ETag>` | `editing|unbalanced|submitting|success|source_stale|conflict|failed`; positive reduced rational rows total exactly one; no auto-remainder. | Semantic table and keyboard rows; numerator/denominator/percent text; exact deficit/excess announced. |
| `<OwnershipLedgerEditor ledger: RightsLedgerResponse; parties: SafePartyPage; rightTypes: RightTypeDefinition[]; territories: TerritoryDefinition[]>` | `draft|unallocated|editing|submitting|success|conflict|failed`; exact rows, pool/type/territory, authorship/provenance; bought-out party absent, never zero row. | Semantic exact-value table; keyboard row operations; pool labels/totals/imbalance text. |
| `<LedgerProposalReview ledger: RightsLedgerResponse; validation: LedgerValidationResponse; consentPolicy: ConsentDeliveryPolicy>` | `draft|unallocated|ready|proposing|proposed|blocked|failed`; proposal freezes exact hash/order/terms and complete required consent set. | Full summary, exact totals and consequences; focus first gap; no pressure copy. |
| `<LedgerConsentFlow ledger: FrozenRightsLedgerProjection; actorRows: LedgerRowReference[]; existing?: LedgerConsentProjection>` | `loading|review|submitting|consented|refused|stale|wrong_recipient|failed`; complete ledger/delta/authorship before unchecked decision; silence never consent. | Semantic full ledger; consequence before controls; equivalent consent/refuse; receipt screen-reader readable. |
| `<SplitCaptureFlow capture: SplitCaptureResponse; participants: SafeParticipantPage; designations: SplitDesignationDefinition[]>` | `draft|debt|editing|proposed|abandoned|conflict|failed`; prefilled parties/designations only, explicit share/fee/present-not-party, skippable and non-blocking. | Dignified debt/skipped language; semantic rows; close-session independence stated. |
| `<ProducerPointsEditor contribution: ContributionProjection; points?: ProducerPointsResponse; bases: PointsBaseDefinition[]>` | `draft|proposed|consented|refused|blocked|superseded|conflict|failed`; reduced rate, named base/tier/term/payee/recoupment/evidence; not ownership. | Plain-language base examples and exact formula; consent/gap list; no percentage pie. |
| `<BuyoutDesignationFlow contribution: ContributionProjection; designation?: BuyoutDesignationResponse; requiredParties: SafePartyPage>` | `draft|proposed|consented|refused|blocked|superseded|failed`; payer/designee/beneficiary/consideration/evidence and explicit legal-effect disclaimer. | Contribution/parties/consequence before decision; credit/performance/NIL separation textual. |
| `<LedgerAmendmentWorkbench amendment: LedgerAmendmentResponse; current: FrozenRightsLedgerProjection; proposed: FrozenRightsLedgerProjection>` | `draft|open|consented|refused|blocked|disputed|applied|superseded|conflict|failed`; one open proposal, full delta, affected consent reset and atomic apply. | Semantic before/after diff; affected rows/parties and current-governs status; keyboard complete. |

### Title, Control and Conflict

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<TitleChainTimeline events: TitleEventPage; scope: RightsScope; viewer: RightsViewerProjection>` | `loading|empty|success|degraded|failed`; asserted events and derived pending/effective/conflicted/expired/superseded applicability; chronology never picks winner. | Ordered linear timeline canonical; optional graph aria-hidden; exact scope/trust/source. |
| `<TitleEventEditor object: RightsObjectResponse; scope: RightsScopeDefaults; parties: SafePartyPage; evidence: EvidenceReferencePage>` | `editing|submitting|success|scope_invalid|authority_stale|failed`; right/share/territory/period/type/from/to/evidence/trust; immutable append. | Persistent scope labels; full review; territory/term never defaults to perpetual. |
| `<TerritoryGrantEditor object: RightsObjectResponse; grant?: TerritoryGrantResponse; territories: TerritoryDefinition[]>` | `pending|incomplete|active|expired|revoked|reverted|superseded|conflict|failed`; explicit territory/term/conditions/evidence. | Term/territory/conditions readable; incomplete distinct from inactive; no legal-effect badge. |
| `<ReversionInstructionFlow object: RightsObjectResponse; instruction?: ReversionInstructionResponse; approvedRules: ReversionRulePage>` | `draft|scheduled|notify_only|executed|cancelled|failed|disabled`; only approved fixed rule may execute; conditional never auto-executes. | Rule/evidence/time/jurisdiction and counsel boundary before action; status announced. |
| `<ControlSummary result: ControlProjectionResponse; source: ControlSourceManifest; purpose: ControlPurpose>` | `loading|authorized|blocked|no_recorded_obstacle|stale|degraded|failed`; exact scope/input/source; never says clear or legally valid. | Plain-language unknown/jurisdiction/source/input labels and non-advice wording. |
| `<RightsConflictInbox page: RightsConflictPage; query: RightsConflictQuery; capabilities: ConflictCapability[]>` | `loading|empty|success|detected|linked_to_case|dismissed|resolved|superseded|degraded|failed`; only exact duplicate candidate dismissible. | Semantic list/detail; evidence snapshot; no merits/risk color score or public leak. |
| `<RightsCaseOpeningFlow conflict: RightsConflictProjection; standing: StandingProjection; evidence: SafeEvidenceReferencePage>` | `editing|submitting|success|case_exists|scope_invalid|forbidden|failed`; exact right/share/territory/period and Shard 06 link; no auto-freeze. | Scope/consequence/privacy before submit; focus case result; evidence unweighted. |
| `<FreezeInstructionStatus instruction: FreezeInstructionProjection; downstream: AdapterEvidenceProjection>` | `pending_acknowledgment|active|failed|unknown|release_pending|released|release_failed|release_unknown`; exact share scope; no funds-held claim. | Downstream evidence/time/source textual; unknown blocks dependent operation; no custody iconography. |

### Consent, Registration and Evidence

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<AITrainingPositionEditor holder: RightsHolderProjection; current?: AITrainingPositionResponse; scopes: AITrainingScopeDefinition[]>` | `editing|submitting|permit|refuse|no_position|superseded|authority_stale|failed`; exact object/right/grantee/use/term/territory/compensation/evidence. Silence never permit. | Scope and compensation position before action; equally weighted options; immutable history link. |
| `<AITrainingEvaluation request: AITrainingEvaluationRequest; result?: AITrainingEvaluationResponse>` | `idle|queued|evaluating|eligible|blocked|unknown|stale|failed`; exact holder-set/source hash; all permit required, any refusal blocks, missing/stale unknown. | Holder-safe reason summary; unknown distinct from refusal; no consent mutation action. |
| `<NILPositionEditor person: PersonProjection; representative?: RepresentationProjection; current?: NILPositionResponse>` | `editing|submitting|permit|refuse|no_position|superseded|forbidden|failed`; voice/name/likeness scope; only person/current explicit representative. | Person-held authority explanation; ownership/credit/performance/WFH never shown as authority. |
| `<AIContentDeclarationEditor content: AuthorizedContentProjection; current?: AIContentDeclarationResponse; vocabulary: DeclarationVocabulary>` | `editing|submitting|declared|retracted|undeclared|superseded|failed`; structured source and reasoned successor; no detection/human-origin/training/NIL effect. | Exact `undeclared`; disclosure/consent/provenance separation; structured field errors. |
| `<IdentifierWorkbench object: RightsObjectResponse; preflights: IdentifierPreflightPage; conflicts: IdentifierConflictPage; capability: IdentifierCapability>` | Later-only `disabled|requested|eligible|existing|conflict|gap|pending|reserved|reconciled|failed|unknown|stale`; stable request key and owner canonical decision. | Capability before controls; ranked recommendation not auto-choice; receipt/focus preserved. |
| `<RegistrationDraftWorkbench draft: RegistrationDraftResponse; profiles: RegistrationProfilePage; source: RegistrationSourceManifest>` | Later-only `disabled|draft|review_ready|blocked|rendering|rendered|stale|superseded|failed`; exact jurisdiction/form/group/source; no filing/copyright claim. | Source values/gaps/deadline and non-advice text; semantic preflight; no submit status. |
| `<PrivateRightsEvidence object: RightsObjectResponse; evidence: RightsEvidencePage; scope: EvidenceScope>` | `loading|empty|success|degraded|failed`; full authorized ledger/title/consent/proof provenance under purpose grant. | Linear evidence timeline and source labels; sealed items described without leaking content. |
| `<PublicRightsProjection projection: PublicRightsProjectionResponse>` | Later-only `disabled|loading|empty|success|hidden|stale|failed|absent`; publication-safe provenance, no default shares/disputes/deals/contact/hidden counts. | Concealment-safe absence; semantic facts; no percentage chart or private-state AT trace. |
| `<RightsEvidenceExportFlow scope: RightsEvidenceScope; formats: EvidenceExportFormat[]; preflight?: EvidenceExportPreflight>` | `editing|preflighting|blocked|generating|ready|stale|expired|failed`; pins right/territory/period/source, names gaps/trust/checksum/receipt; mixed output quarantined. | Semantic gaps and exact scope review; progress announced; download format/size/checksum/expiry labelled. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Objects/link sets/ledgers/consents | Server immutable versions/hashes and ETags; URL stores safe selection only. |
| Split/points/buyout/amendment drafts | Server draft aggregate plus locally preserved form tied to actor/context/base version. |
| Title/grant/reversion/control/conflict/freeze | Server append-only evidence and derived version-pinned projections; events trigger refetch. |
| AI-training/NIL/declarations | Server immutable scoped versions; absence values are explicit projections, not inferred client defaults. |
| Identifier/registration/public lookup | Server governed capability/profile/provider state; routes server-omitted until activation. |
| Evidence artifacts | Server exact source snapshot, checksum and purpose-bound short-lived download. |

- Back/forward restores safe object/tab/filter/scope only when still authorized; otherwise concealment-safe absence/current projection.
- Unsaved guards protect ledgers, split designations, title/grant, positions, declarations and registration drafts. They never obstruct restrictive position successor or purpose-grant expiry.
- Multi-tab conflicts preserve local exact values and show semantic current/proposed diff. No consent/title/freeze/position uses last-write-wins.
- Offline permits read-only previously authorized non-sensitive metadata and local draft preservation only. Proposal, consent, title, freeze, identifier and artifact commands require current authority/source.

## Interaction Flows

### Objects, Ledgers and Agreements

1. Actor asserts separate work or recording from authorized source facts; party naming creates no share or legal conclusion.
2. Recording-work links validate positive reduced rational weights totaling exactly one and commit a whole-set successor.
3. Ledger draft permits explicit unallocated deficit/excess; proposal blocks until exact balance/structure, then freezes full hash/order/terms.
4. Every named party reviews the complete frozen ledger and records immutable consent/refusal. Any edit creates successor and resets required consent.
5. Session split capture remains skippable; producer points and buyout/WFH remain separate encumbrance/designation evidence, never ownership/legal-effect shortcuts.

### Title, Control and Conflict

1. Standing actor appends exact-scope title/grant/succession/reversion evidence; conflicting events remain visible and chronology never selects merits.
2. Control fold returns only authorized, blocked or no recorded obstacle against exact source manifest with uncertainty/non-advice wording.
3. Deterministic overlap or precision-first duplicate signal creates conflict only; standing party explicitly opens case.
4. Authorized case outcome may issue exact share freeze instruction to downstream adapter. Failed/unknown acknowledgment blocks dependent distribution without claiming funds held.

### Consent, Registration and Evidence

1. Rights holder records scoped AI-training permit/refuse/no-position; person/representative separately records NIL position; most restrictive applicable result controls.
2. AI declaration remains content/contribution fact only. Absence is undeclared and never affects training/NIL consent or proves human origin.
3. Later identifier preflight checks existing values before idempotent allocation; two valid identifiers require owner choice or dispute.
4. Registration draft reviews exact source values/gaps/deadline and renders artifact only; no auto-file or copyright-creation language.
5. Private evidence and scoped export retain complete authorized facts; later public projection is independently allowlisted and privacy-safe.

## Error-to-UI Matrix

| Code/family | UI state | Recovery |
|---|---|---|
| exact-rational invalid/non-unit total | Link/ledger unbalanced | Show exact deficit/excess and row; require explicit correction, never auto-remainder. |
| stale ledger/link/hash/version | Conflict/stale | Refetch complete current version and compare; all affected consents reset on successor. |
| wrong recipient/authority/consent duplicate | Consent forbidden/current | Use bound intended identity/current authority or open immutable existing decision. |
| open amendment exists/stale base | Amendment blocked | Open current proposal or rebase queued snapshot; never merge concurrent deltas. |
| points tier/base/WFH conflict | Encumbrance blocked | Correct named base/tier/parties/evidence; do not convert to share. |
| incomplete territory/term/evidence | Grant incomplete | Supply explicit scope; never default perpetual/worldwide. |
| control source stale/conflicted | Control blocked/stale | Recompute exact scope; no “clear” fallback. |
| conflict not dismissible/case exists | Conflict current | Open linked case or preserve signal; only exact duplicate candidate dismisses. |
| freeze acknowledgment failed/unknown | Freeze failed/unknown | Reconcile downstream evidence; dependent distribution remains blocked, custody unclaimed. |
| holder/person authority stale | Position forbidden | Refresh holder/representation authority; ownership/performance cannot substitute. |
| position source incomplete | Evaluation unknown | Complete current holder set/scope; silence/no-position never permit. |
| identifier profile/gate unavailable | Capability disabled/blocked | No allocation action; await approved operator/profile activation. |
| identifier ambiguous provider outcome | Allocation unknown | Reconcile same stable request key before another allocation. |
| registration source/profile stale | Draft stale | Re-preflight exact form/group/source; no filing claim. |
| creation proof anchor failed | Proof failed | Keep rights object, expose loud retry task with exact source hash. |
| evidence mixed/stale/expired | Artifact quarantined/stale/expired | Regenerate exact snapshot; receipt remains actor-safe where retained. |
| `VERSION_CONFLICT`, `ACTING_CONTEXT_STALE`, `IDEMPOTENCY_MISMATCH` | Protected conflict | Refetch/compare/retry identical command only; preserve safe draft. |

Errors include request ID but omit private shares, disputes, deals, evidence, contacts, consent details, compensation, NIL scope, declarations, identifiers under review, signed URLs and hidden counts.

## Conditional Rendering Matrix

| Feature | Named owner/writer/payee | Producer/master admin | Performer | Publisher/admin | Estate/successor | Public/Fan | Reviewer/operator | Worker |
|---|---|---|---|---|---|---|---|---|
| Objects/ledgers | complete relevant ledger, own actions | recording/master only | own performance/NIL, no master-share inference | anchored authority only | scoped represented acts | hidden/private; later safe projection | case/operator exact scope | validate/project only |
| Splits/points/buyouts | propose/consent own authorized rows | capture/master terms | own designation/decision | anchored party only | scoped successor view | hidden | case-safe evidence | notify/derive only |
| Title/control/conflict | standing scope actions | master scope actions | own applicable scope | anchored grant/share | represented title scope | later public provenance only | exact case/freeze or identifier scope | fold/detect/instruct only |
| AI/NIL/declaration | holder position/own declaration | holder only where recorded | own NIL/declaration | holder through anchored authority | represented holder scope | hidden | evaluation exact scope | evaluate/project only |
| Identifier/registration/evidence | later owner actions/private evidence/export | authorized registrant scope | own evidence where authorized | registrant/anchored scope | represented scope | later safe lookup | approved operator/case grant | anchor/render/generate only |

Named variants: `namedPartyComplete`, `producerMasterOnly`, `performerOwn`, `publisherAnchored`, `successorRepresented`, `publicSafeOnly`, `reviewerExactScope`, `workerExactNoUi`.

## Accessibility Inventory

| Interaction | Keyboard/focus and screen-reader contract | IA source |
|---|---|---|
| Ledger/split editors | Semantic exact-value tables, keyboard rows, pool labels, totals and exact imbalance | IA 10 § Accessibility |
| Consent/amendment | Complete frozen ledger, before/after delta, authorship and consequence before unchecked action | IA 10 § Accessibility |
| Rights duality/pools | Plain-language work/recording and writer/publisher/master explanations; no color-only legal state | IA 10 § Accessibility |
| Control/term/moral/public-domain | Jurisdiction/source/input/unknown labels and non-advice wording | IA 10 § Accessibility |
| Title/dispute evidence | Linear timeline canonical; graph optional and never required | IA 10 § Accessibility |
| Consent link/registration/identifier | Focus-preserving errors and screen-reader-readable receipts | IA 10 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, exact-value speech and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Ledger/consent | Title/conflict | Positions/registration/evidence |
|---|---|---|---|
| `<=768px` | One row/step, sticky exact total, full ledger review before decision | Linear timeline/list-detail and exact scope card | One scope form, semantic gaps, manifest definition list |
| `769-1024px` | Conditional table/list with before/after summary | List/detail with source/evidence rail | Position/draft list-detail and receipt panel |
| `>=1025px` | Full exact table, consent/state rail and immutable history | Timeline/workbench with control/conflict/action rail | Workbench with scope/source/gaps/evidence rail |

Every width retains object kind, pool/right/territory, exact rational value, authorship, consent/version, title trust, uncertainty, holder/person authority and evidence freshness in text.

## Data Mapping

| BE response family | Components |
|---|---|
| rights object/link set/ledger/consent | object list/assertion/record, link editor, ledger/proposal/consent components |
| split capture/points/buyout/amendment | split/points/buyout/amendment components |
| title event/grant/reversion/control/conflict/freeze | title timeline/editors, control, conflict/case/freeze components |
| AI-training/NIL/evaluation/declaration | position, evaluation, NIL and declaration components |
| identifier preflight/allocation/conflict | `IdentifierWorkbench` |
| creation proof/registration/evidence/public projection/export | object record, registration, private/public evidence and export components |

No component consumes unrestricted rights tables, hidden percentages/conflicts/evidence/contact, court/private documents outside purpose, provider credentials, payment custody state or binary floating-point authority.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every state/role; exact arithmetic/imbalance; full-ledger consent; absence wording; linear title; unknown/custody/public concealment boundaries |
| Contract | all 10a-e successes/errors, ETags/idempotency/source hashes, state registries, purpose/RLS, artifact/provider jobs, no-store/redaction and capability-before-lookup |
| E2E | assert/link, ledger draft/propose/consent/refuse, split/points/buyout/amend, title/grant/reversion/control/conflict/case/freeze, AI/NIL/declaration, identifier/registration/evidence export |
| Accessibility | keyboard/AT exact tables, consent/diffs, timelines, scope forms, gaps, receipts and responsive views |
| Security | inferred consent/share/title/NIL/AI, public percentage/dispute leak, authority overreach, chronology winner, false custody/clearance/registration and identifier duplication denial |
| Performance | rights/ledger routes <=120KB initial JS, workbenches <=140KB, guided forms <=100KB, islands <=50KB unless approved; large ledgers preserve semantic virtualization |

## Deepening Record

1. **State synchronization**: objects, ledgers, consents, agreements, title, conflicts, positions and evidence converge on exact versions/hashes.
2. **Network degradation**: stale consent, anchor failure, unknown freeze/provider, registration staleness and artifact quarantine remain explicit.
3. **Flow sequencing**: RGT-01..20 map to components while consumer/later/counsel gates prevent premature provider, public and custody claims.
4. **Responsive/touch**: exact tables, semantic diffs, timelines, scope forms and manifests retain keyboard/touch parity.
5. **State exhaustion**: every object, ledger, consent, split, encumbrance, amendment, title, grant, reversion, control, conflict, freeze, position, identifier, proof, registration and artifact state renders.
6. **Role exhaustion**: all nine IA actor classes have explicit variants; public, operators and workers never receive private broad UI.
7. **Accessibility edge cases**: exact arithmetic speech, complete-ledger review, plain duality, non-advice uncertainty, linear evidence and readable receipts are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role, responsive and accessibility contracts.
- **Macro**: RGT-01..20 preserve exact-rational ownership, immutable whole-ledger consent, orthogonal credits/encumbrances/NIL/AI, evidence-first title/control, scoped freeze and safe registration/publication.
- **Two-implementer assertion**: independent implementers choose identical object duality, balance/consent, split/agreement, title/control/conflict, AI/NIL, identifier/registration and evidence behavior.
- **Devil's advocate**: no UI can auto-balance, infer consent/title/clearance/NIL/AI, represent buyout as zero share, expose private percentages/disputes, call adapter failure funds-held, auto-select identifier, auto-file registration or turn proof into ownership.
- **Result**: PASS.

## Open Questions

None. Consumer launch records private rights evidence and consent without legal-advice or money-movement claims. Identifier allocation, filing adapters and public lookup remain unavailable until their named gates activate.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete rights and ownership frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by

- [[specs/fe/00-infrastructure|Frontend Infrastructure]]
- [[specs/fe/01-identity-authority|Identity and Authority Frontend]]
- [[specs/fe/06-trust-safety|Trust, Safety and Evidence Frontend]]
- [[specs/fe/07-credits-core|Credits Core Frontend]]
- [[specs/fe/08-credit-reporting-disclosure|Credit Reporting and Disclosure Frontend]]
- [[specs/fe/09-projects-collaboration|Projects and Collaboration Frontend]]

### Derives from

- [[specs/ia/10-rights-ownership|Shard 10 Rights and Ownership]]
- [[specs/ia/deep-dives/10-rights-ownership|Rights and Ownership Deep Dive]]
- [[specs/be/10a-rights-objects-ledgers|Rights Objects and Ledgers]]
- [[specs/be/10b-splits-points-buyouts-amendments|Splits Points Buyouts and Amendments]]
- [[specs/be/10c-title-control-conflicts-freezes|Title Control Conflicts and Freezes]]
- [[specs/be/10d-ai-training-nil-consent|AI Training and NIL Consent]]
- [[specs/be/10e-identifiers-registration-evidence|Identifiers Registration and Evidence]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/10-rights-ownership|Deep Dive 10 — Rights and ownership]]

### References
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
- [[specs/be/10b-splits-points-buyouts-amendments|Split capture, producer points, buyouts and amendments — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]
- [[specs/be/10d-ai-training-nil-consent|AI-training, voice and likeness consent — Backend Specification]]
- [[specs/be/10e-identifiers-registration-evidence|Rights identifiers, registration and evidence export — Backend Specification]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/deep-dives/10-rights-ownership|Deep Dive 10 — Rights and ownership]]
- [[specs/design-system|Design System]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/fe/06-trust-safety|Trust, Safety, Disputes and Evidence - Frontend Specification]]
- [[specs/fe/07-credits-core|Credit Graph, Capture and Confidence - Frontend Specification]]
- [[specs/fe/08-credit-reporting-disclosure|Credit Reporting, Exchange and Disclosure - Frontend Specification]]
- [[specs/fe/09-projects-collaboration|Music Projects and Collaboration - Frontend Specification]]
