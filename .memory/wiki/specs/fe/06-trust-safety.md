# Trust, Safety, Disputes and Evidence - Frontend Specification

> **BE Sources**: [[specs/be/06a-case-intake-evidence|Case Intake and Evidence]], [[specs/be/06b-policy-enforcement-appeals|Policy Enforcement and Appeals]], [[specs/be/06c-disputes-dmca-legal-risk|Disputes DMCA and Legal Risk]]  
> **IA Source**: [[specs/ia/06-trust-safety|Shard 06 Trust, Safety, Disputes and Evidence]]  
> **Status**: Complete

## Classification

- **Type**: High-complexity feature specification spanning three protected backend contracts and phased public, party, moderator, specialist and counsel surfaces.
- **Surface**: Consumer report/restriction/DMCA/status flows; Phase-2 queue, review, appeal, dispute and evidence workbenches; counsel-gated legal/illegal-content operations.
- **Approval**: Recommended grouping, source map and phase-preserving route model approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 governs shell/state/jobs/uploads/errors/offline; FE 01 governs acting context/authority/step-up; FE 02 governs ownership claims; FE 04 governs media takedown; FE 05 governs grants, diagnostics and launch gates.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/06-trust-safety|Shard 06 IA]] | Delivery Phases, Interactions TSE-01..18, Contracts, Access Control, Accessibility, Edge Cases |
| IA deep dive | [[specs/ia/deep-dives/06-trust-safety|Trust and Safety Deep Dive]] | queue fairness, exposure controls, sanctions, evidence, disputes, legal process and counsel gates |
| Backend | [[specs/be/06a-case-intake-evidence|06a]] | report intake, status, routing, leases, materials, restrictions, evidence and holds |
| Backend | [[specs/be/06b-policy-enforcement-appeals|06b]] | policies, proposals, controls, activation, statements, appeals, signals and launch risk |
| Backend | [[specs/be/06c-disputes-dmca-legal-risk|06c]] | DMCA, transaction disputes, account protection, identity cases, personal safety and legal requests |
| Cross-cutting FE | [[specs/fe/00-infrastructure|FE 00]] | global state/error/job/upload/offline/confirmation/accessibility |
| Design | [[specs/design-system|Design System]] | Guided Form, Record Detail/Activity, List-to-Detail Workbench and Admin Operations |

## Source Map

| FE section | Source |
|---|---|
| Report/restriction/status | BE 06a § API/State Registry; IA TSE-01, TSE-08 |
| Queue/review/evidence/holds | BE 06a § API/Persistence; IA TSE-03..04, TSE-16..17 |
| Decisions/controls/SoR/appeals/signals/risk | BE 06b § API/State Registry; IA TSE-05..07, TSE-09, TSE-18 |
| DMCA/disputes/identity/safety/legal | BE 06c § API/State Registry; IA TSE-02, TSE-10..15 |
| Role rendering/accessibility | IA 06 § Access Control/Accessibility; FE 00/01 |

## Phase and Release Gates

| Gate | Enabled frontend |
|---|---|
| Consumer launch | User-visible object/profile report, own safe status, private restriction, identified DMCA intake/status, authorized moderator removal/suspension and audit-safe record |
| Phase 2+ | Full queue/lease/review, ordinary appeals, fraud/signals, transaction dispute/mediation, safety/identity cases, evidence inventories and aggregate transparency |
| Counsel-gated | Automatic CSAM/TVEC action, emergency disclosure, 24/7 legal response, high-risk automation, sparse safety analytics and unapproved money/AML outcomes |

Disabled Phase-2/counsel capabilities have no navigable route, hidden control or generic substitute. A feature flag cannot satisfy a phase/counsel approval record.

## Design Requirements

**Direction**: Calm, private and evidence-led. Public forms prioritize safe completion; case workbenches prioritize allegation/finding separation, current policy, scope and exposure minimization.  
**Typography**: Source Sans 3 for content/controls; IBM Plex Mono for receipts, case/policy versions, hashes, deadlines and request IDs.  
**Colors**: restrained Paper/Surface/Graphite; Jam Magenta for current action only. Severity, allegation, finding, sanction and appeal never rely on color.  
**Motion**: 150-220ms bounded feedback; no alarming animation, countdown pressure or forced media reveal. Reduced motion removes nonessential transitions.  
**Anti-patterns**: no public case enumeration, accusation-as-finding, volume-as-guilt, person trust score, AI concurrence, forced sensitive-media exposure, admin override, sanction changing ownership/credits, crisis input as guilt, improvised legal disclosure or “case closed” while enforcement/evidence is partial.

## Design System Compliance

- **Archetypes**: Guided Form for report/notice/appeal/dispute/legal intake; Record Detail/Activity for safe status/SoR/case; List-to-Detail Workbench for queues; Admin Operations for decisions, holds, legal process and risk assessments.
- **Global components consumed**: `<PageShell>`, `<AdminNav>`, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<StateLabel>`, `<FilterBar>`, `<DataTable>`, `<Timeline>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<UploadManager>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: all data views inherit FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Reports may acknowledge canonical receipt immediately; sanctions, evidence, appeals, settlements, holds and disclosures never show optimistic success.
- **Safe absence**: concealment-safe 404, sealed evidence, prohibited disclosure, unavailable dependency and no case are distinct; UI does not expose which condition applies beyond the authorized projection.

## Page and Route Definitions

| Route | Guard/phase | Primary components | Navigation behavior |
|---|---|---|---|
| `/report` | Public/authenticated, launch | `SafetyReportForm` | Target/reason registry server-resolved; safe return route; no queue details. |
| `/safety/status/{receipt}` | Receipt or current party | `SafeCaseStatus` | Non-enumerable receipt; concealment-safe absence; only next action/deadline. |
| `/settings/restrictions` | Authenticated self | `RestrictionManager` | Private list; subject cannot discover edge. |
| `/legal/dmca/notice` | Identified claimant, launch | `DmcaNoticeForm` | Incomplete saves draft only; no removal/strike claim. |
| `/legal/dmca/{noticeId}` | Claimant/subject safe projection | `DmcaStatus`, `DmcaCounterNoticeForm` | Role-specific fields/deadlines; identities sealed from unauthorized party. |
| `/safety/decisions/{decisionId}` | Eligible subject | `StatementOfReasons`, `AppealForm` | Immutable SoR/correction chain; appeal route only when enabled/eligible. |
| `/safety/disputes/{disputeId}` | Case party, Phase 2 | `TransactionDisputeWorkbench` | Exact frozen transaction/remedies/deadlines; deep link grants no party role. |
| `/safety/personal` | Public/authenticated, gated | `PersonalSafetyIntake`, `CrisisResources` | Crisis branch bypasses enforcement and returns resources-only. |
| `/legal/requests` | Documented requester, counsel gate | `LegalRequestIntake` | Intake only; no self-service disclosure or urgency promise. |
| `/admin/safety/cases` | Scoped moderator, Phase 2 except launch removal queue | `CaseQueue` | Capability/exposure-filtered weighted-fair lanes; no global search. |
| `/admin/safety/cases/{caseId}` | Active lease/case purpose | `CaseReviewWorkbench`, `EvidenceInventory`, `DecisionProposal` | Lost lease blocks mutation and restricted evidence closes immediately. |
| `/admin/safety/decisions/{decisionId}` | Eligible distinct reviewer | `DecisionControlPanel`, `EnforcementStatus` | Current case/target/policy/control versions rechecked. |
| `/admin/safety/appeals/{appealId}` | Independent reviewer, Phase 2 | `AppealReviewWorkbench` | Original decider excluded; per-item outcomes only. |
| `/admin/safety/signals` | Scoped specialist, Phase 2 | `RiskSignalWorkbench` | Action/object signals only; never person profile or direct sanction. |
| `/admin/safety/identity/{caseId}` | Assigned specialist, Phase 2 | `IdentityCaseWorkbench` | Shard 01 truth read-only; outcome cannot rewrite ownership. |
| `/admin/safety/legal-holds/{holdId}` | Counsel/MFA | `LegalHoldWorkbench` | Sealed manifest; hold blocks destruction but grants no broader access. |
| `/admin/legal/requests/{requestId}` | Assigned counsel/MFA | `LegalRequestWorkbench` | Verification/minimization/prohibition before protected export job. |
| `/admin/safety/risk-assessments/{assessmentId}` | Domain owner/distinct approver | `DomainRiskAssessment` | Current release gate; unresolved gaps block launch. |

## Component Inventory

Every component inherits FE 00 request IDs, no-store protected data, 8s reads/15s commands, upload/job behavior, no blind retries and exact focus restoration. Protected drafts persist only through approved encrypted server workflow.

### Intake and Party Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<SafetyReportForm target: SafeTargetReference; reasons: ReportReasonDefinition[]; reporterModes: ReporterMode[]>` | `editing|submitting|received|rate_deprioritized|target_invalid|validation_error|offline|failed`; reason derives from target type/version; narrative <=10KiB; valid excess admitted. Same payload/key returns same receipt. | Persistent labels/error summary; consequence and anonymity limits before submit; draft/errors/focus preserved; one-column at all widths. |
| `<SafeCaseStatus status: SafeCaseStatusProjection; receipt: OpaqueReceipt>` | `loading|received|queued|reviewing|awaiting_party|decided|appealed|resolved|closed|capture_failed|degraded|absent`; only safe deadline/next action. | State/deadline textual; absolute and remaining time; generic notice still names allowed response/appeal/export route. |
| `<RestrictionManager edges: RestrictionPage; availableScopes: RestrictionScope[]>` | `loading|empty|success|submitting|active|revoked|conflict|failed`; immediate private deny-first create/revoke; no case required and no subject notification/discovery. | Scope/consequence plain language; confirmation only for broad scope; focus returns to row; no optimistic success until edge version. |
| `<DmcaNoticeForm notice?: DmcaNoticeDraft; regime: DmcaRegimeDefinition; asset: SafeAssetReference>` | `editing|draft|submitting|validated|duplicate|incomplete|failed`; identified claimant/contact/signature/attestations required. Incomplete cannot remove or count strike. | Legal consequences/required statements before signature; errors preserve draft; no prechecked attestation. |
| `<DmcaStatus notice: DmcaSafeProjection; role: "claimant"|"subject">` | `draft|validated|removed|rejected|countered|restoration_wait|restored|retained|closed|degraded`; safe deadlines and delivery state only. | Timeline semantic; absolute/relative deadlines; role-specific hidden data absent from DOM. |
| `<DmcaCounterNoticeForm notice: DmcaSafeProjection; requirements: CounterNoticeDefinition; etag: ETag>` | `editing|review|submitting|complete|counter_incomplete|state_conflict|failed`; identity/address/jurisdiction and signed 512(g) statements; restoration clock starts only after complete delivery. | Disclosure consequences and exact fields shown before unchecked confirmations; step-up/focus return exact. |
| `<StatementOfReasons statement: StatementProjection; corrections: StatementCorrection[]>` | Immutable safe summary, cited policy/version, scope/term/items, appeal eligibility and correction chain. `loading|success|degraded|absent`. | Structured representation and plain summary; correction/supersession textual; no reporter/reviewer/detection detail. |
| `<AppealForm decision: AppealableDecisionProjection; grounds: AppealGroundDefinition[]; etag: ETag>` | `editing|submitting|open|window_closed|exists|forbidden|failed`; select item IDs/typed grounds/supplements; draft preserved; no promise of restoration. | Item-level consequences and deadline; upload accessible; error summary/focus; no color-only sanction state. |
| `<PersonalSafetyIntake reasons: PersonalSafetyReasonDefinition[]; target?: SafeTargetReference>` | `editing|protected_case|resources_only|submitting|failed`; harassment/doxxing enters protected lane. Crisis branch bypasses classifier/ladder/SoR/appeal and never sanctions. | Neutral language, immediate exit, no forced detail; crisis resources prominent but not modal trap; focus preserved. |
| `<CrisisResources locale: BCP47; resources: CrisisResourceProjection[]>` | `success|unavailable|failed`; informational resources-only completion, no diagnosis, monitoring or enforcement. | Descriptive contact links, language, availability and emergency limitation; no countdown/alarm animation. |

### Case, Evidence and Decision Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<CaseQueue page: CaseQueuePage; query: CaseQueueQuery; freshness: ProjectionFreshness>` | `loading|empty|success|partial|stale|degraded|failed`; queue/severity/deadline/kind filters; weighted-fair server order and S0 isolation. Volume/badge/persona/role never guilt/priority. | Semantic sortable table/labelled rows; sort announcement; severity and remaining time textual; no general target search. |
| `<CaseLeasePanel case: CaseSummary; lease?: CaseLeaseProjection; reviewer: ReviewerEligibility>` | `available|claiming|active|expired|released|revoked|ineligible|conflicted|lost|failed`; compare-and-set lease; original clocks preserved. | Lease expiry absolute/relative; lost lease closes mutable controls, preserves local draft and focuses status. |
| `<CaseReviewWorkbench case: CaseSafeProjection; intake: ImmutableIntakeSnapshot; policy: PolicyProjection; lease: ActiveLease>` | `loading|reviewing|awaiting_party|decision_ready|lease_lost|policy_stale|conflict|failed`; minimum safe target, immutable allegation snapshot, mutable current target separated. Finding must be explicitly entered/cited. | Regions/headings distinguish allegation/current target/finding; keyboard complete; 200/400% reflow; exposure controls persistent. |
| `<SensitiveEvidenceViewer entry: EvidenceSafeProjection; exposure: ExposurePolicy>` | `sealed|metadata_only|blurred_muted|revealed|unavailable|degraded`; sensitive media starts blurred/muted with warning and text-only path. Restricted preservation never renders content. | Reveal requires deliberate control, does not autoplay, focus returns; text-only evidence path; forced exposure impossible. |
| `<EvidenceInventory entries: EvidenceInventoryPage; disclosureClass: EvidenceClass; chainStatus: ChainStatus>` | `loading|empty|success|capture_failed|degraded|disclosure_prohibited|failed`; append-only sequence/source/version/hash/class/state. No mutation/download absent exact grant. | Semantic inventory/table; chain/capture state text; errors never imply missing evidence; restricted entries shown sealed-only if allowed. |
| `<CaseMaterialForm case: CasePartyProjection; schema: MaterialSchema; window: MaterialWindow; etag: ETag>` | `editing|submitting|accepted|window_closed|conflict|failed`; typed response/supplement refs append only; cannot edit snapshots/findings/other-party material. | Deadline/extension behavior explicit; upload and error summary accessible; draft/focus preserved after interruption. |
| `<DecisionProposal case: CaseSafeProjection; policy: PolicyProjection; evidence: EvidenceInventorySummary; allowedScopes: EnforcementScope[]>` | `editing|review|proposed|awaiting_controls|ready|lease_lost|policy_invalid|scope_forbidden|conflict`; requires finding, cited rule, evidence manifest, rationale, narrow scope and consequence preview. Ownership/confirmed credits/splits/export rights absent. | Scope ladder and before/after consequences in ordered text; labels/errors; no default focus on activation. |
| `<DecisionControlPanel decision: DecisionProjection; requirements: DecisionControlRequirement[]; actorEligibility: ReviewerEligibility>` | `required|satisfied|rejected|expired|stale|cooling_off|step_up|failed`; distinct-human concurrence/reaffirmation/compensating controls. AI/self-concurrence impossible. | Requirement, human distinctness, cooling-off and urgency exception textual; step-up returns exact action. |
| `<EnforcementStatus decision: DecisionProjection; items: EnforcementItemProjection[]; statement: StatementProjection>` | `pending|applying|active|partial|failed|reversed|expired|superseded`; SoR/audit failure means no sanction. Partial remains open; reversal uses compensation. | Per-item semantic states and recovery; partial never summarized complete; status changes polite/assertive by urgency. |
| `<AppealReviewWorkbench appeal: AppealProjection; originalDecision: DecisionProjection; items: AppealItemProjection[]; reviewer: ReviewerEligibility>` | `open|reviewing|upheld|reversed|modified|withdrawn|expired|evidence_changed|conflict`; original decider blocked; outcome per item with correction jobs. | Original/current evidence and proposed result linear compare; keyboard decisions; rationale labels; focus to first unresolved item. |
| `<LegalHoldWorkbench hold: LegalHoldProjection; manifest: HoldManifestProjection; retention: RetentionClockProjection[]>` | `proposed|active|releasing|released|condition_unmet|conflict|failed`; counsel basis/authority/scope/release condition. Active hold blocks destruction without widening access. | Sealed manifest/counts, not content; expiry/release condition text; MFA confirmation and focus restoration. |

### Specialist, Dispute and Legal Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<RiskSignalWorkbench page: RiskSignalPage; query: RiskSignalQuery>` | signal `active|expired|ignored|monitored|linked_to_case`; action/object/reasons/source/version/confidence/expiry only. Disposition cannot create finding/sanction/notice. | Neutral advisory language; confidence not guilt; semantic table and explanation; no person profile aggregation. |
| `<TransactionDisputeWorkbench dispute: DisputeProjection; materials: MaterialPage; proposals: ResolutionProposal[]>` | `open|awaiting_response|negotiating|decision_pending|settled|resolved|closed|reconciling|conflict`; frozen transaction/parties/mandates/remedy/deadlines/evidence. Settlement is agreement, not finding/payout. | Party-safe tabs/linear mobile; deadlines and frozen terms; proposal accept names exact mandate/terms; no counterparty-private evidence. |
| `<IdentityCaseWorkbench case: IdentityCaseProjection; identityTruth: Shard01TruthProjection; etag: ETag>` | `reviewing|decision_ready|truth_changed|blocked|resolved|failed`; party/alias/credit/membership/mandate truth read-only. Credential possession never ownership; outcome changes scoped access/claim only. | Source truth and proposed scoped effect separated; no “owner” badge; exact conflicts announced. |
| `<LegalRequestIntake definition: LegalIntakeDefinition; request?: LegalRequestDraft>` | `editing|received|incomplete|gate_disabled|failed`; documented requester/instrument/jurisdiction/scope/prohibition evidence. Intake performs no disclosure and promises no 24/7 response. | Required authority/scope fields and limitation copy; accessible upload/error summary; no urgency bypass control. |
| `<LegalRequestWorkbench request: LegalRequestProjection; verification: LegalVerificationProjection; minimization: DisclosureManifestProjection>` | `received|verifying|narrowed|refused|approved|disclosing|completed|blocked|failed`; verified authority, minimization, approval, prohibition and user-notice state required. Export exact fields/blobs only. | Sealed evidence links; scope-before/after compare; prohibition and notice state textual; protected export job progress accessible. |
| `<DomainRiskAssessment assessment: RiskAssessmentProjection; release: ReleaseGateProjection; etag: ETag>` | `draft|review|approved|blocked|stale|conflict`; harms, controls, gaps, evidence and disposition required; distinct approval; calendar review insufficient. | Structured harm/control/gap table with linear reading; blocker links; no aggregate “safe” score. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Intake/status/restrictions | Server canonical; receipt opaque; safe form draft only in approved encrypted session recovery. |
| Cases/leases/policies/decisions | Protected server versions; lease grants temporary mutable projection only; realtime/event means refetch. |
| Evidence/legal identity | No-store and purpose-bound; sensitive bytes never service-worker/localStorage; reveal state resets on route/lease loss. |
| Appeals/disputes/DMCA | Server immutable submissions and deadlines; local safe draft cleared after canonical receipt. |
| Enforcement/compensation/capture/export jobs | Stable server IDs survive refresh; partial remains open; client never infers completion from one consumer. |

- Browser back/forward restores only a still-authorized safe route/state. Lost lease, revoked grant, changed mandate or closed window disables mutation without discarding safe unsent draft.
- Unsaved-change guards apply to report/notice/material/proposal/appeal/dispute/legal forms; urgent restriction/revocation and access loss are never blocked.
- Offline allows report draft preparation only where encrypted safe recovery exists; submission/status/evidence/decision/legal operations require network.
- Multi-tab conflicts preserve drafts and refetch exact case/target/policy/evidence versions. No case or decision last-write-wins.

## Interaction Flows

### Report, Restriction and DMCA

1. Report target determines reasons; submit atomically records intake snapshot, route/capture intent and non-enumerable receipt.
2. Excess valid reports remain admitted/deprioritized; receipt status exposes no reporter/queue/reviewer/evidence detail.
3. Self restriction writes immediate private deny-first edge and retries propagation without creating case.
4. DMCA incomplete notice remains draft; complete identified notice validates and may remove/count one unique event.
5. Counter-notice reviews disclosure, signs required statements, records delivery, then starts restoration clock.

### Review, Decision and Appeal

1. Server routes by severity/deadline; eligible reviewer claims exclusive lease without clock reset.
2. Workbench separates immutable allegation snapshot, current target and explicit finding under exact policy version.
3. Proposal cites evidence/rule/rationale and narrow scope. Required distinct control or solo compensating path completes.
4. Activation atomically commits decision, enforcement, SoR, audit and outbox; any required failure rolls back.
5. Independent appeal decides per item and emits compensating commands/corrections; partial restoration stays visible.

### Disputes, Safety and Legal Operations

1. Dispute freezes transaction, parties/mandates, remedy policy, deadlines and contemporaneous evidence.
2. Party proposal binds only after every required current mandate accepts; specialist adjudication uses disclosed weights and reconciles providers.
3. Identity case consumes Shard 01 truth; personal-safety protected case or resources-only crisis path never rewrites identity or creates guilt.
4. Evidence capture seals hash chain or records explicit failure; hold supersedes destructive clocks without widening access.
5. Legal request verifies/narrows/refuses before any disclosure; approved exact minimization manifest creates protected export job.

## Error-to-UI Matrix

| Code | UI state | Recovery |
|---|---|---|
| `IDEMPOTENCY_MISMATCH`, `TARGET_OR_REASON_INVALID` | Report conflict/validation | Reuse identical payload or correct target/reason; no duplicate. |
| `CASE_LEASE_LOST`, `REVIEWER_INELIGIBLE`, `CONFLICT_OF_INTEREST` | Review read-only/lost | Preserve draft, release exposure and return queue/reassignment. |
| `MATERIAL_WINDOW_CLOSED` | Party material blocked | Show deadline/allowed extension or appeal route. |
| `DISCLOSURE_PROHIBITED` | Evidence/legal sealed | No override; use authorized non-content result if available. |
| `POLICY_VERSION_INVALID`, `TARGET_CHANGED` | Proposal/activation stale | Refetch exact policy/target and review again. |
| `SCOPE_FORBIDDEN`, `CONTROL_REQUIRED`, `COOLING_OFF_ACTIVE` | Decision blocked | Narrow scope or complete current human control/wait. |
| `SELF_CONCURRENCE`, `ORIGINAL_DECIDER` | Independence blocked | Assign eligible distinct human. |
| `APPEAL_EXISTS`, `WINDOW_CLOSED`, `EVIDENCE_CHANGED` | Appeal conflict | Open current appeal or refetch evidence; no replay. |
| `PERSON_SCORE_FORBIDDEN` | Signal rejected | Submit action/object bounded signal only. |
| `NOTICE_INCOMPLETE`, `DUPLICATE_NOTICE`, `COUNTER_INCOMPLETE` | DMCA draft/conflict | Complete current notice/counter; duplicates never count. |
| `TRANSACTION_NOT_FOUND`, `DISPUTE_EXISTS`, `REMEDY_NOT_ALLOWED` | Dispute blocked | Use current transaction/dispute and eligible remedy. |
| `MANDATE_INVALID`, `MANDATE_CHANGED`, `PROPOSAL_EXPIRED` | Settlement invalid | Reissue proposal under current binding mandates. |
| `IDENTITY_TRUTH_CHANGED` | Identity case stale | Refetch Shard 01 truth and reassess scoped outcome. |
| `COUNSEL_GATE_DISABLED`, `REQUEST_INCOMPLETE` | Legal capability unavailable/draft | No disclosure; complete verified intake or await approved gate. |
| `VERIFICATION_INCOMPLETE`, `DISCLOSURE_PROHIBITED` | Legal decision blocked | Narrow/verify/minimize; prohibition has no UI override. |
| `CAPTURE_FAILED`, provider unavailable | Explicit evidence/dependency failure | Preserve marker/case, retry authorized capture or use disclosed degraded path. |
| `STEP_UP_REQUIRED`, `VERSION_CONFLICT` | Protected interruption/conflict | Step up and restore exact safe context or refetch/compare. |

Persistent errors include request ID. Narratives, reporter/reviewer identities, raw evidence, legal documents, private messages, protected traits, detection methods and prohibition details never enter URL/toast/telemetry.

## Conditional Rendering Matrix

| Feature | Reporter/claimant | Case party | Public | Moderator | Independent reviewer | Specialist | Legal/counsel | Break-glass | Worker/admin |
|---|---|---|---|---|---|---|---|---|---|
| Report/status | create + opaque own status | safe own status/response | policy only | assigned intake minimum | assigned review minimum | scoped lane | legal-case minimum | sealed non-content only | no human decision |
| Queue/case | hidden | safe disclosed material | hidden | assigned lease/workbench | assigned concur/appeal | scoped specialist case | assigned legal case | time-boxed validation | worker exact task; admin health only |
| Evidence | own submitted refs/status | disclosed own/allowed refs | hidden | filtered inventory, no restricted | appeal-safe filtered | purpose-filtered | exact legal purpose | sealed validation, no copy | capture worker IDs only |
| Decision/appeal | SoR/appeal if subject | SoR/item appeal | aggregate policy only | propose/narrow sanction | concur or appeal, never original | scoped adjudication | counsel control if required | hidden | enforcement item only; admin cannot decide |
| Restrictions/signals | self restriction | hidden | hidden | hidden | hidden | action/object signals | hidden | hidden | propagation/router only |
| DMCA/dispute | claimant notice/status | role-specific counter/dispute | policy only | assigned review | independent appeal | dispute/IP specialist | counsel-gated legal view | hidden | provider reconciliation only |
| Legal/hold/risk | intake only where enabled | notice unless barred | aggregate policy | hidden | risk approval if named | domain assessment draft | full assigned verification/hold | dual-evidence validation | exact export/hold/launch task |

Named variants: `reporterOpaque`, `partyDisclosed`, `publicAggregate`, `moderatorAssignedLease`, `reviewerIndependent`, `specialistPurposeScoped`, `counselAssigned`, `breakGlassSealed`, `workerExactTask`, `adminNoDecision`.

## Accessibility Inventory

| Interaction | Keyboard/focus and screen-reader contract | IA source |
|---|---|---|
| Report/notice/counter/response/appeal | Draft/error/focus preserved; consequences before commit; no color/hover/pointer-only interaction | IA 06 § Accessibility |
| Queue/evidence/decision | Semantic headings/labels, keyboard sortable tables, announced sort/state, 200/400% reflow and reduced motion | IA 06 § Accessibility |
| Sensitive media | Blurred/muted initially; deliberate reveal with warning; text-only path; never forced or autoplayed | IA 06 § Accessibility |
| Deadlines | Absolute deadline plus remaining time; preserved forms expose recoverable extension behavior | IA 06 § Accessibility |
| Safe status | Truthful non-leaking state with allowed review/export route; absence distinct from failure | IA 06 § Accessibility |
| High-consequence forms | Automated plus manual keyboard/screen-reader evidence required under Shard 05 quality gate | IA 06 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, sensitive-media reveal avoidance, step-up/dialog focus restoration and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Public/party forms | Queue/case review | Evidence/decision/legal |
|---|---|---|---|
| `<=768px` | One section/step; safe status/deadline persistent | Queue list then leased case; allegation/current/finding stack distinctly | Metadata first; sensitive reveal separate; item/store outcomes labelled rows |
| `769-1024px` | Form plus consequence summary when reflow valid | Conditional queue/detail; policy/evidence below target | Two panels only with canonical linear reading order |
| `>=1025px` | Guided form with contextual summary | Queue/detail plus policy/action rail; no global target browse | Evidence inventory, decision form and immutable activity rail |

Every width retains case/receipt, allegation versus finding, policy version, deadline, lease, disclosure class, sanction scope and partial state in text. No sensitive action is hover-only.

## Data Mapping

| BE response | Components |
|---|---|
| Report receipt/case safe status/restriction edge | `SafetyReportForm`, `SafeCaseStatus`, `RestrictionManager` |
| DMCA notice/counter/deadline safe projections | `DmcaNoticeForm`, `DmcaStatus`, `DmcaCounterNoticeForm` |
| Queue page/lease/case safe target/intake/policy | `CaseQueue`, `CaseLeasePanel`, `CaseReviewWorkbench` |
| Evidence inventory/entry/material window | `SensitiveEvidenceViewer`, `EvidenceInventory`, `CaseMaterialForm` |
| Decision/control/enforcement/SoR/appeal | `DecisionProposal`, `DecisionControlPanel`, `EnforcementStatus`, `StatementOfReasons`, `AppealForm`, `AppealReviewWorkbench` |
| Risk signal/dispute/proposal/identity truth | `RiskSignalWorkbench`, `TransactionDisputeWorkbench`, `IdentityCaseWorkbench` |
| Personal safety/resources/legal request/hold/risk assessment | `PersonalSafetyIntake`, `CrisisResources`, `LegalRequestIntake`, `LegalRequestWorkbench`, `LegalHoldWorkbench`, `DomainRiskAssessment` |

No component consumes unrestricted case search, raw reporter/reviewer identity, another party's material, restricted evidence content, person trust score, hidden detection data, legal prohibition detail or service credentials.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every named role/state; draft/focus recovery; deadline; sensitive reveal avoidance; allegation/finding separation; partial enforcement/restoration; hidden-field DOM absence |
| Contract | all 06a-c endpoints/errors, no-store/redaction, ETags/idempotency, cursor/lease/state registries, jobs and concealment-safe status |
| E2E | report/replay/deprioritized intake, restriction, DMCA draft/complete/counter, lease loss, evidence capture failure, proposal/control/activate atomicity, SoR/appeal compensation, dispute settlement, crisis resources, hold and legal verification |
| Accessibility | keyboard/AT forms, queues, timers, tables, sensitive evidence, consequences, safe status and responsive workbenches |
| Security | case enumeration, reporter/reviewer/evidence leak, brigading priority, self-concurrence, ownership sanction, person score, crisis guilt, legal urgency bypass, break-glass copy/export and admin decision denial |
| Performance | public forms <=70KB initial JS, guided protected flow <=100KB, workbench <=120KB, each island <=50KB unless approved; protected media loads only after reveal |

## Deepening Record

1. **State synchronization**: intake, route, lease, material, evidence, policy, decision, control, enforcement, appeal, dispute, DMCA, hold and legal request converge on server versions.
2. **Network degradation**: valid report admission, classifier fail-open, capture failure, provider reconciliation, partial enforcement/restoration and unavailable legal path are explicit.
3. **Flow sequencing**: TSE-01..18 map to routes/components and preserve intake, lease, finding, control, atomic activation, independent review, compensation and evidence order.
4. **Responsive/touch**: forms, queues, evidence inventories and decision/legal workbenches retain complete keyboard/touch behavior without forced media.
5. **State exhaustion**: every case/lease/material/evidence/hold/decision/control/item/appeal/signal/dispute/DMCA/legal state maps to rendered behavior.
6. **Role exhaustion**: all IA actor classes have explicit cells and named variants; workers/platform admins cannot make judgment.
7. **Accessibility edge cases**: draft/focus recovery, deadlines, safe status, sensitive exposure, tables and high-consequence evidence are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role variant, responsive behavior and accessibility contract.
- **Macro**: TSE-01..18 preserve launch/Phase-2/counsel gates, minimum disclosure, allegation/finding separation, narrow enforcement, reversible corrections and sealed evidence/legal boundaries.
- **Two-implementer assertion**: independent implementers choose identical intake, queue/lease, policy/decision/control, appeal, evidence, dispute, DMCA, crisis, identity and legal behavior.
- **Devil's advocate**: no UI can enumerate cases, turn volume/signal into guilt, force evidence exposure, let staff self-concur, sanction ownership/credits, count incomplete DMCA, treat settlement as finding, use crisis as sanction, bypass counsel or let platform admin decide a case.
- **Result**: PASS.

## Open Questions

None. Phase-2 and counsel-gated surfaces remain absent until their explicit gate opens. Consumer launch receives only the approved report, restriction, DMCA, authorized enforcement and audit boundaries.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete trust, safety, disputes and evidence frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by
- [[specs/fe/00-infrastructure|FE 00 Infrastructure]]
- [[specs/fe/01-identity-authority|FE 01 Identity Authority]]
- [[specs/fe/02-profiles-verification|FE 02 Profiles and Claiming]]
- [[specs/fe/04-cms-delivery-media|FE 04 Delivery and Media]]
- [[specs/fe/05-platform-configuration-admin|FE 05 Configuration and Admin]]
- [[specs/design-system|Design System]]

### Derives from
- [[specs/ia/06-trust-safety|Shard 06 IA]]
- [[specs/ia/deep-dives/06-trust-safety|Trust and Safety Deep Dive]]
- [[specs/be/06a-case-intake-evidence|BE 06a]]
- [[specs/be/06b-policy-enforcement-appeals|BE 06b]]
- [[specs/be/06c-disputes-dmca-legal-risk|BE 06c]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/06-trust-safety|Deep Dive 06 — Trust, safety, disputes and evidence]]

### References
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/06c-disputes-dmca-legal-risk|Fraud review, transaction disputes, DMCA, identity abuse and legal process — Backend Specification]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/deep-dives/06-trust-safety|Deep Dive 06 — Trust, safety, disputes and evidence]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/design-system|Design System]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/fe/02-profiles-verification|Profiles, Claiming and Qualifications - Frontend Specification]]
- [[specs/fe/04-cms-delivery-media|CMS Navigation, Media and Delivery - Frontend Specification]]
- [[specs/fe/05-platform-configuration-admin|Platform Configuration, Admin and Quality - Frontend Specification]]
