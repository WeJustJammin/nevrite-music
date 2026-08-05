# Credit Graph, Capture and Confidence - Frontend Specification

> **BE Sources**: [[specs/be/07a-credit-assertions-visibility|Credit Assertions and Visibility]], [[specs/be/07b-session-capture-offline|Session Capture and Offline Merge]], [[specs/be/07c-claims-attestations-confidence-taxonomy|Claims Attestations Confidence and Taxonomy]]  
> **IA Source**: [[specs/ia/07-credits-core|Shard 07 Credit Graph, Capture and Confidence]]  
> **Status**: Complete

## Classification

- **Type**: High-complexity feature specification spanning three backend contracts and one shared credit/capture/confidence surface.
- **Surface**: Public discography and bounded graph; participant work ledger, correction, embargo and claim flows; online/offline session capture; prompts/attestations/provenance; import and taxonomy review.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 governs state/jobs/offline/errors; FE 01 governs parties/acting context; FE 02 governs profile projection; FE 06 governs disputes and protected evidence.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/07-credits-core|Shard 07 IA]] | Interactions CRD-01..18, Credit/Visibility, Session Capture, Claims/Attestations/Confidence, Taxonomy, Access Control, Accessibility, Edge Cases |
| IA deep dive | [[specs/ia/deep-dives/07-credits-core|Credit Graph and Capture Deep Dive]] | immutable credit versions, viewer-relative graph, offline merge, prompt cadence, evidence derivation and vocabulary evolution |
| Backend | [[specs/be/07a-credit-assertions-visibility|07a]] | assertions, ledgers, discography, traversal, merges, embargo and corrections |
| Backend | [[specs/be/07b-session-capture-offline|07b]] | session roll, intervals, offline operations, contributions, close prompts and attendance evidence |
| Backend | [[specs/be/07c-claims-attestations-confidence-taxonomy|07c]] | imports, claims, witness/attestation, provenance, contests and role/instrument taxonomy |
| Cross-cutting FE | [[specs/fe/00-infrastructure|FE 00]] | global shells, state, offline merge, errors, jobs and accessibility |
| Related FE | [[specs/fe/02-profiles-verification|FE 02]], [[specs/fe/06-trust-safety|FE 06]] | public profile projection and dispute-case boundaries |
| Design | [[specs/design-system|Design System]] | Public Profile, Record Detail, Guided Form, List-to-Detail Workbench and Admin Operations |

## Source Map

| FE concern | Source |
|---|---|
| Credit assertion, ledger, public discography, graph and visibility | BE 07a § API/State Registry; IA CRD-01..07 |
| Session roll, offline merge, contributions, close prompts and attendance | BE 07b § API/State Registry; IA CRD-08..11 |
| Imports, claims, attestations, provenance, contests and taxonomy | BE 07c § API/State Registry; IA CRD-12..18 |
| Role rendering and accessibility | IA 07 § Access Control/Accessibility; FE 00 |

## Design Requirements

**Direction**: A working credit record: precise, contribution-led and provenance-transparent without gamification.  
**Typography**: Source Sans 3 for records/controls; IBM Plex Mono for versions, source hashes, taxonomy IDs and operation IDs.  
**Colors**: Paper/Surface/Graphite; Jam Magenta for current action only. Provenance, contest, embargo and merge states use text/structure, never badges alone.  
**Motion**: bounded 150-220ms feedback; no animated confidence meter, celebratory attestation or graph spectacle.  
**Anti-patterns**: no rights/split inference, auto-merge, public embargo trace, attendance-as-credit, silence-as-refusal, popularity-as-confidence, internal score display, provenance eligibility floor, instrument make/model taxonomy or destructive history edits.

## Design System Compliance

- **Archetypes**: Public Profile for discography/graph; Record Detail for work ledger/credit history; Guided Form for assertions/corrections/claims; List-to-Detail Workbench for sessions/imports/taxonomy; Admin Operations for merges and vocabulary review.
- **Global components consumed**: `<PageShell>`, navigation family, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<ProvenanceFact>`, `<StateLabel>`, `<FilterBar>`, `<DataTable>`, `<Timeline>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every data view inherits FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Assertions, visibility, claims, evidence, attestations and merges require canonical success.
- **Empty/error language**: empty public discography is valid only after an authorized complete query. Embargo, confidentiality, sparse graph, unavailable provenance, taxonomy outage and failed projection never collapse to zero/empty.

## Page and Route Definitions

| Route | Guard/archetype | Primary components | Navigation behavior |
|---|---|---|---|
| `/works/{workId}/credits` | Viewer-relative Record Detail | `WorkCreditLedger`, `CreditAssertionFlow`, `CreditOrderEditor` | Public/participant projections differ server-side; selected credit/filter in URL only. |
| `/works/{workId}/credits/{creditId}` | Viewer-relative credit record | `CreditRecord`, `CreditHistory`, `ProvenanceExplanation` | Concealment-safe 404; immutable version/history selected explicitly. |
| `/profiles/{partyId}/discography` | Public Profile | `PublicDiscography` | Role-family/cursor in URL; embargo/confidential rows leave no trace. |
| `/credits/graph` | Fan/professional bounded query | `CreditGraphExplorer` | Server-enforced path mode/depth; linear path list is canonical. |
| `/app/credits` | Authenticated credited party inbox | `CreditInbox`, `ClaimFlow`, `AttestationInbox` | Current party context explicit; no hidden suggested-count leak. |
| `/app/credits/{creditId}/visibility` | Authorized participant | `VisibilityEditor`, `EmbargoLiftFlow` | Current visibility version refetched; strictest participant policy preserved. |
| `/app/credits/{creditId}/correction` | Authorized participant | `CreditAmendmentFlow` | Successor proposal and required-party snapshot canonical. |
| `/app/credits/{creditId}/contest` | Credited participant | `CreditContestFlow` | Creates Shard 06 case link; public route remains unchanged. |
| `/app/credit-sessions/{sessionId}` | Overlapping participant/owner/delegate | `SessionCaptureWorkbench`, `SessionRoll`, `ContributionGrid` | Offline device/session scope bound; selected part/row in safe URL state. |
| `/app/credit-sessions/{sessionId}/close` | Owner/delegate | `SessionCloseFlow`, `ClosePromptPreview` | Close never blocked by prompt response; 24-hour reopen state canonical. |
| `/app/credit-prompts` | Recipient self | `CreditPromptInbox` | Exact issue/claim hash; silence/skip/expiry never appears negative. |
| `/app/credit-attestations` | Recipient self | `AttestationInbox` | Bounded current requests only; refusal identity never public. |
| `/app/credit-claims/{claimId}` | Claimant/affected party | `ClaimFlow`, `WitnessRequestFlow` | Identity proof attaches claimant but never raises contribution/provenance. |
| `/admin/credits/imports/{batchId}` | Import reviewer | `CreditImportWorkbench` | Source/license/hash retained; candidates private until explicit decision. |
| `/admin/credits/party-merges/{proposalId}` | Distinct knowledgeable reviewer | `PartyMergeReview` | Exact manifest required; rejection persists negative assertion. |
| `/admin/credits/taxonomy` | Taxonomy admin | `TaxonomyWorkbench`, `PendingAliasReview` | Canonical versions immutable; assertions remain pinned to historical versions/literals. |

## Component Inventory

Every component inherits FE 00 request IDs, 8-second reads, 15-second protected commands, cursor/offline/error behavior and exact focus restoration. Safe display preferences may use optimistic rollback; credit/evidence truth may not.

### Credit and Visibility Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<WorkCreditLedger work: WorkProjection; page: CreditLedgerPage; query: CreditLedgerQuery; capabilities: CreditCapability[]>` | `loading|empty|success|degraded|failed`; authorized asserted/acknowledged/contested/superseded/withdrawn records, role filters and post-authorization count/cursor. Billing order remains separate. | Semantic table/list alternative, keyboard filters/sort, result count; state/qualifier/visibility text, no color-only meaning. |
| `<CreditRecord credit: CreditProjection; sources: SafeCreditSource[]; viewer: CreditViewerProjection>` | Shows one party/shell, role version/literal, work, scope, instruments, contribution/assertion dates, actual asserter, qualifier and viewer-safe evidence. Never rights/splits/payment. | Definition list and version heading; source provenance explicit; hidden fields absent from DOM. |
| `<CreditAssertionFlow work: WorkProjection; participants: SafePartyReference[]; roleResolver: RoleResolverProjection; instrumentResolver: InstrumentResolverProjection; defaults: VisibilityDefaults>` | `editing|taxonomy_unavailable|submitting|success|active_conflict|validation_error|failed`; one role, many instruments, required scope/date/asserter/visibility. Bounded literal allowed on taxonomy outage. | Registry-driven persistent labels/errors; dynamic role/instrument candidates announced; review summary before canonical submit. |
| `<CreditOrderEditor work: WorkProjection; visibleCredits: SafeCreditReference[]; order: CreditOrderProjection; etag: ETag>` | `editing|optimistic_pending|optimistic_rollback|success|credit_set_changed|conflict|failed`; display-only order and no ledger/visibility effect. | Keyboard move controls and pointer reorder; position announcements; no drag-only interaction. |
| `<PublicDiscography party: PublicPartyProjection; groups: DiscographyGroupPage; freshness: ProjectionFreshness>` | `loading|empty|success|degraded|failed`; groups role family, pins then reverse chronology, plain provenance. Counts/cursors after authorization; hidden records invariant. | Landmarks/headings and semantic lists; role/provenance sentence readable; 200/400% reflow. |
| `<DiscographyCuration credit: SafeCreditReference; value: DiscographyCurationProjection; etag: ETag>` | `listed|unlisted|pinned|optimistic_pending|optimistic_rollback|conflict`; party-page only, never ledger/co-contributor page. | Action text explains scope; keyboard pin/move; result announced and focus retained. |
| `<CreditGraphExplorer query: CreditGraphQuery; page?: CreditGraphPage; mode: "fan"|"professional">` | `idle|loading|success|sparse|scope_forbidden|degraded|failed`; max depth 3, bounded cursor. Fan only work-party walks; professional gets allowed weighted paths and explanation. | Linear ordered path list is canonical; graph visual optional/aria-hidden; each edge reason and sparse degradation announced. |
| `<VisibilityEditor credit: CreditProjection; current: VisibilityProjection; allowedTransitions: VisibilityTransition[]; etag: ETag>` | `confidential|embargoed|lift_pending|public|submitting|ratchet_forbidden|conflict|failed`; strictest allowed participant state wins. Restrictive changes fail closed/purge; public recovery only exact rule. | Current/proposed visibility and affected surfaces explicit; hidden counts never exposed; confirm restores trigger. |
| `<EmbargoLiftFlow credit: CreditProjection; evidenceTypes: LiftEvidenceDefinition[]; pending?: EmbargoLiftProjection>` | `editing|submitting|objection_window|lifted|objected|evidence_insufficient|already_pending|failed`; 72-hour objection window; public may retract for seven days only after verified release retraction. | Absolute/remaining deadline, basis/evidence labels and status; no hidden participant count; objection route keyboard complete. |
| `<CreditAmendmentFlow original: CreditProjection; proposed?: CreditAmendmentProjection; requiredParties: SafePartyReference[]; etag: ETag>` | `draft|proposed|awaiting_agreement|applied|disputed|correction_blocked|withdrawn|expired|conflict`; immutable successor. Party change routes claim transfer/dispute. | Original/proposed semantic linear diff; required responses/deadlines and reminder schedule textual; focus first unresolved field. |
| `<CreditHistory versions: CreditVersionPage; visibilityHistory: VisibilityVersionPage>` | Immutable assertions/successors/visibility/exposure audit. `loading|empty|success|degraded|failed`; no destructive actions. | Ordered timeline; version/state/source text; historical literal and taxonomy version preserved. |
| `<PartyMergeReview proposal: PartyMergeProposal; manifest: PartyMergeManifestPage; reviewer: ReviewerEligibility; etag: ETag>` | `proposed|approved|rejected|repointing|complete|failed|manifest_changed|negative_assertion|conflict`; people never auto-merge. No partial hidden identity on failure. | Candidate identities/evidence/affected credits reviewed linearly; confidentiality per row; rejection consequence explicit. |

### Session Capture Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<SessionCaptureWorkbench session: CreditSessionProjection; roll: RollPage; contributions: ContributionPage; sync: OfflineSyncProjection>` | `open|closing|closed|reopened|final|offline|syncing|conflict|degraded|failed`; current source/wrap/reopen clocks and device watermark. | Record/activity layout; persistent offline/freshness state; mobile stack preserves roll/contribution separation. |
| `<SessionRoll entries: RollEntryPage; capabilities: RollCapability[]; etag: ETag>` | entries `provisional|observed|inferred|confirmed|disputed|removed`; one party/shell, many intervals/capacities. Presence never creates credit. | Semantic table/labelled rows; keyboard add/remove/expand; source quality/state text; exact conflicted row focused after sync. |
| `<RollEntryEditor entry?: RollEntryProjection; participants: SafePartyReference[]; capacityDefinitions: CapacityDefinition[]>` | `editing|submitting|success|subject_forbidden|conflict|failed`; self/owner/delegate scope. Add/remove are source operations, not deletion. | Persistent labels/error summary; intervals and capacities grouped; no inferred state represented as confirmed. |
| `<RollIntervalEditor entry: RollEntryProjection; interval?: RollIntervalProjection; sessionBounds: TimeRange>` | Validates start/end/source/observed-inferred quality. `editing|success|interval_conflict|invalid|failed`; conflicts append facts. | Time fields labelled with zone; conflict values listed; keyboard complete. |
| `<ContributionGrid parts: SessionPartPage; roll: SafeRollReference[]; claims: ContributionPage; capability: ContributionCapability>` | `loading|empty|success|offline|conflict|failed`; one row per subject/part/role, many instruments, qualifier, visibility intent and actual asserter. Self only self; owner/delegate any roll party. | Semantic grid plus linear form/list; keyboard cell navigation; row/part/role labels repeated at reflow. |
| `<OfflineMergeStatus device: OfflineDeviceProjection; operations: OfflineOperationResult[]; serverVersion: number>` | `offline|queued|syncing|accepted|rejected|conflicted|superseded|base_too_old|failed`; <=250 ordered unique ops. Add wins, intervals union/conflict; no silent destructive reconciliation. | Polite sync announcements; accepted/rejected counts and exact rows; focus first changed/conflicted row. |
| `<SessionCloseFlow session: CreditSessionProjection; requiredOps: OfflineOperationSummary; delta: PromptDeltaProjection>` | `review|closing|closed|unmerged_ops|source_changed|failed`; close records two independent prompt intents and stable issue IDs, never waits for answers. Reopen within 24h. | Consequences/delta before submit; absolute reopen window; close success announced without claiming credits confirmed. |
| `<ClosePromptPreview contributorPrompts: CreditPromptSummary[]; producerReconciliation: ReconciliationSummary>` | Read-only exact deltas. `ready|partial|degraded`; contributor and Producer flows independent; silence never negative. | Cards have semantic list/table alternative; exact claim summary and recipient-safe state. |
| `<CreditPromptInbox page: CreditPromptPage; query: PromptQuery>` | `loading|empty|success|degraded|failed`; issues `pending|answered|skipped|expired|superseded`. Answer binds displayed claim hash. | One-tap controls have full labels/claim summary; keyboard/AT parity; stale hash returns focused updated claim. |
| `<AttendanceEvidenceFlow session: CreditSessionProjection; consent: ConsentProjection; evidenceTypes: AttendanceEvidenceDefinition[]>` | `editing|active|revoked|held|expired|consent_revoked|duplicate|failed`; optional and consequence-free decline. Human evidence outranks device conflict; no direct credit effect. | Consent/use/retention explicit; decline equivalent; no raw location/device data; revoke/hold status announced. |

### Claims, Attestations and Taxonomy Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<CreditInbox claims: CreditClaimPage; suggestions: CreditSuggestionPage; prompts: CreditPromptPage>` | `loading|empty|success|degraded|failed`; source-marked suggestions, claim state and prompts independently loaded. Failed panel never becomes zero. | Landmark sections and distinct status/error; no hidden suggestion/count inference. |
| `<ClaimFlow credit: ClaimableCreditProjection; claim?: CreditClaimProjection; shell: SafePartyReference; identityEvidence: EvidenceReference[]>` | `pending|witness_needed|attached|contested|rejected|expired|claim_conflict|negative_assertion|failed`; verified identity attaches claimant only. First claimant remains during contest. | Identity-versus-contribution explanation precedes submit; state/deadline text; evidence controls accessible. |
| `<WitnessRequestFlow claim: CreditClaimProjection; eligibleWitnesses: SafePartyReference[]; cadence: RequestCadenceProjection>` | `editing|pending|answered|expired|cancelled|suppressed|ineligible|request_exists`; bounded context/note, one request per witness/claim. | Context facts and cadence/mute state explicit; no social-pressure copy; 44px controls. |
| `<AttestationInbox page: AttestationInboxPage; query: AttestationQuery>` | `loading|empty|success|degraded|failed`; pending/answered/expired/cancelled/suppressed. Shows work, date, named present party and canonical claim hash summary. | Semantic list; claim summary before answers; no public refusal identity. |
| `<AttestationAnswerFlow request: AttestationRequestProjection; displayedClaimHash: string>` | `editing|submitting|confirmed|refused|dont_know|stale|answer_exists|failed`; immutable answer. Refusal private/publicly unanswered; retraction separate reasoned append. | Equivalent labelled one-tap controls, confirmation summary, undo/retraction route; silence not styled negative. |
| `<ProvenanceExplanation provenance: CreditProvenanceProjection>` | `imported|asserted|witnessed|attested|captured_verified|unavailable|stale`; plain evidence classes/algorithm version only, never internal score/ring flags/refusal identity. Score cannot cross rung. | Text/icon/structure, no meter or color-only rank; unavailable distinct from lowest; explanation keyboard/AT readable. |
| `<CreditContestFlow credit: ParticipantCreditProjection; existing?: CreditContestProjection; etag: ETag>` | `editing|open|resolved|withdrawn|superseded|exists|failed`; participant marker and Shard 06 link. Public line preserves existing eligible rung without contest marker; discovery weight zero. | Consequence and privacy before submit; participant timeline; no public dispute badge. |
| `<CreditImportWorkbench batch: CreditImportProjection; candidates: CreditCandidatePage; job?: JobStatusResponse>` | batch `queued|running|review_ready|failed|completed`; candidate `pending|accepted|rejected|deferred|superseded`. Exact matches only; fuzzy suggestion cannot bind or publish. | Source/license/hash and row state semantic; candidate compare linear; no source body in telemetry. |
| `<TaxonomyPicker kind: "role"|"instrument"; literal: string; locale: BCP47; partyType?: PartyType>` | `idle|loading|exact|alias|candidates|unavailable|failed`; role one canonical base/modifier; instruments functional hierarchy, no make/model. No fuzzy auto-selection. | Combobox/listbox semantics; candidate fidelity and retained literal announced; keyboard complete. |
| `<PendingAliasReview pending: PendingAliasProjection; candidates: RoleVersionProjection[]; etag: ETag>` | `pending|promoted|mapped|rejected|already_resolved|conflict`; first decision immutable. Mapping changes resolution only, never claim identity/attestation validity. | Literal/candidates/history and effect summary; no retroactive rewrite language; focus result heading. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Credits/visibility/order/curation/corrections/merge | Server immutable versions/ETags; URL stores safe filters/selection only. |
| Session capture/offline ops | Server aggregate plus registered device operation log; local encrypted operation queue scoped to session/device, never final truth. |
| Prompts/claims/attestations/provenance | Server claim-hash/evidence-set/algorithm versions; events trigger refetch, never direct rung update. |
| Taxonomy | Server immutable vocabulary versions plus retained literal; picker cache keys kind/locale/party-type/version. |
| Embargo/confidentiality | Server/RLS before aggregation/cache/search/export; client never receives hidden rows/counts. |

- Browser back/forward restores selected record/session/part/filter only if current scope still authorizes it; otherwise concealment-safe absence/current state.
- Unsaved-change guards protect assertion, roll, contribution, correction, claim, attestation and taxonomy drafts. They never obstruct restrictive visibility or consent revocation.
- Offline writes are queued only for the bound capture session/device. Reauthentication/context mismatch pauses sync and preserves encrypted ops for explicit recovery.
- Multi-tab and online/offline conflicts preserve proposed rows/ops and show current-versus-local resolution. No credit truth last-write-wins.

## Interaction Flows

### Credit, Visibility and Correction

1. Assertion resolves exact party/shell, role/literal, work, scope and visibility, then creates/attaches to canonical active row without rights inference.
2. Viewer ledger/discography/graph applies authorization before counts/cursors/cache; public hidden records are 404-equivalent.
3. Visibility change enforces ratchet; embargo lift enters evidence/objection workflow and restrictive changes purge fail-closed.
4. Correction proposes immutable successor and required-party snapshot; unresolved material change routes Shard 06.
5. Party merge requires distinct knowledgeable review of exact manifest; rejection persists negative assertion.

### Session Capture and Offline Merge

1. Session opens with provisional seeded roll. Human/device operations append intervals/capacities without creating credit.
2. Self attributes self; owner/delegate may attribute roll parties one role per contribution row.
3. Offline ops synchronize in deterministic server order; add/remove and interval conflicts remain visible facts.
4. Close waits only for required local operations, records stable contributor/Producer prompt intents and never waits for answers.
5. Reopen within 24 hours preserves history and reissues only changed delta prompts.

### Claims, Attestation and Provenance

1. Import remains private/source-marked until exact explicit review; fuzzy suggestions never bind.
2. Verified claimant attaches to shell-linked credit; witness path may resolve identity link but never proves contribution.
3. Eligible independent attestation request collapses duplicates and enforces day 7/21 nudges/mute/dormancy budgets.
4. Immutable answer/retraction updates eligible evidence; derivation computes rung and internal score separately, exposing only rung/explanation.
5. Contest creates Shard 06 case, suppresses asks/discovery weight and preserves public prior state without dispute leak.

## Error-to-UI Matrix

| Code | UI state | Recovery |
|---|---|---|
| `CREDIT_ACTIVE_CONFLICT`, `PARTY_WORK_MISMATCH` | Assertion conflict/validation | Open canonical row or correct party/work/scope; preserve draft. |
| `EMBARGOED_NOT_FOUND`/concealment 404 | Public absent | Standard absence; no existence/count clue. |
| `GRAPH_SCOPE_FORBIDDEN`, sparse response | Graph blocked/sparse | Use allowed fan path or narrower professional query; do not infer hidden graph. |
| `CREDIT_SET_CHANGED` | Order stale | Refetch visible set and reconcile display order. |
| `VISIBILITY_RATCHET_FORBIDDEN`, `EVIDENCE_INSUFFICIENT` | Visibility/lift blocked | Retain stricter state; provide eligible evidence/authority route. |
| `WINDOW_CLOSED`, `DUPLICATE_OBJECTION` | Objection unavailable/current | Open current case/status or explain closed window. |
| `ORDINARY_PARTY_CHANGE_FORBIDDEN`, `AMENDMENT_OPEN` | Correction blocked | Use claim/dispute or current amendment. |
| `MANIFEST_CHANGED`, `PERSON_AUTO_MERGE_FORBIDDEN` | Merge stale/forbidden | Refetch exact manifest; require human decision. |
| `DEVICE_OP_REUSED`, `BASE_TOO_OLD`, `OP_BATCH_INVALID` | Offline sync conflict | Replay identical op or explicit rebase; never drop local rows. |
| `INTERVAL_CONFLICT`, `PART_VERSION_CONFLICT` | Exact row/part conflict | Focus affected row and resolve against current version. |
| `UNMERGED_REQUIRED_OPS`, `REOPEN_WINDOW_CLOSED` | Close/reopen blocked | Sync required ops or keep final state; prompts remain independent. |
| `CLAIM_HASH_STALE`, `ANSWER_EXISTS` | Prompt/attestation stale | Refetch exact claim; historical answer retained and re-ask if required. |
| `CONSENT_REVOKED`, `RETENTION_HOLD` | Attendance evidence revoked/held | Stop use; retain protected tombstone where required. |
| `CLAIM_CONFLICT`, `NEGATIVE_ASSERTION_EXISTS` | Claim blocked/contested | Open current claim/case; submit new evidence basis only where allowed. |
| `ATTESTATION_INELIGIBLE`, `BLOCKED_OR_DISPUTED`, `CONTEXT_FLOOR_UNMET` | Ask blocked | Choose eligible independent witness/current context; no bypass. |
| `EVIDENCE_SET_CHANGED`, `ALGORITHM_VERSION_INVALID` | Provenance stale/unavailable | Refetch/rederive; remove stale label rather than show lowest. |
| `TAXONOMY_UNAVAILABLE`, `LITERAL_REJECTED` | Picker unavailable/literal invalid | Commit bounded screened literal or correct input; no fuzzy auto-bind. |
| `VERSION_CONFLICT`, `ACTING_CONTEXT_STALE` | Protected conflict | Refetch/current context and compare; preserve safe draft/ops. |

Persistent errors include request ID. Embargo existence, private session names, device/location observations, refusal identity/reason, internal score, ring flags and private evidence never enter URL/toast/telemetry.

## Conditional Rendering Matrix

| Feature | Public/Fan | Credited party | Session participant | Producer/owner | Operator/room | Work/release owner | Taxonomy admin | Dispute reviewer | Worker |
|---|---|---|---|---|---|---|---|---|---|
| Ledger/discography | public projection | own including embargoed | overlapping relevant | managed work visibility within ratchet | scoped support only | billing/display order | hidden | case-safe record | projection only |
| Graph | fan-safe work-party | professional if capable | same capability | same capability | hidden | professional if capable | hidden | case paths only | no UI |
| Assertion/correction | hidden | own eligible | self/overlap eligible | attribute roll parties/propose correction | room fact only | publication evidence/order | hidden | case outcome only | exact command |
| Visibility/embargo | public eligible only | own request/objection | request lift where eligible | manage within strictest ratchet | hidden | release evidence only | hidden | case-safe decision | purge/project only |
| Session roll/contribution | hidden | own overlapping | own/overlap roll; self contribution | full roll/delegate attribution/close | witnessed room facts, no creative attestation | hidden | hidden | case evidence only | seed/close jobs |
| Claims/attestations | public rung only | full own claim/ask/contest | eligible attest/witness | eligible session asks | cannot attest creative work solely by role | hidden | hidden | case-safe claim evidence | derive/notify only |
| Taxonomy/import/merge | public active labels | picker/pending literal | picker | picker | picker | picker | full reviewed vocabulary | case-safe historical version | exact import/derive |

Named variants: `publicAuthorized`, `creditedOwn`, `participantOverlap`, `producerManaged`, `operatorRoomFacts`, `releaseDisplayOnly`, `taxonomyReviewed`, `reviewerCaseScoped`, `workerExactNoUi`.

## Accessibility Inventory

| Interaction | Keyboard/focus and screen-reader contract | IA source |
|---|---|---|
| Roll/contribution/close/discography/evidence/taxonomy | Keyboard complete with semantic table/list alternatives and 200/400% reflow | IA 07 § Accessibility |
| Provenance/contest/qualifier/visibility | Text plus icon/structure; color never sole meaning; hidden state absent from AT tree | IA 07 § Accessibility |
| Prompt/attestation one-tap | Equivalent labelled controls, visible canonical claim summary and retraction route; silence never negative | IA 07 § Accessibility |
| Embargo/non-disclosure | No hidden count/existence announced to assistive technology | IA 07 § Accessibility |
| Offline/conflict | Polite status, preserved edits and focus first exact changed/conflicted row after reconciliation | IA 07 § Accessibility |
| Graph traversal | Linear path list and explanation; force-directed canvas never required | IA 07 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, offline conflict focus and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Ledger/discography/graph | Session capture | Claims/admin review |
|---|---|---|---|
| `<=768px` | Semantic lists, filters inline, linear graph paths only | Roll then contribution then status; one row editor; persistent offline bar | One guided step; candidate/manifest linear comparisons |
| `769-1024px` | Conditional table/list and path detail | Roll/contribution split when reflow valid | List/detail with summary before actions |
| `>=1025px` | Record table plus history/provenance rail; optional graph visual beside linear list | Roll, contribution grid and activity/status rail | Workbench with exact record/evidence/action rail |

Every width retains party, role, scope, asserter, qualifier, visibility, provenance availability, source quality and conflict state in text. Touch and keyboard provide equivalent ordering/reconciliation.

## Data Mapping

| BE response | Components |
|---|---|
| Credit version/ledger/discography/graph/order/curation | `CreditRecord`, `WorkCreditLedger`, `PublicDiscography`, `CreditGraphExplorer`, `CreditOrderEditor`, `DiscographyCuration` |
| Visibility/lift/objection/amendment/merge | `VisibilityEditor`, `EmbargoLiftFlow`, `CreditAmendmentFlow`, `PartyMergeReview`, `CreditHistory` |
| Capture session/roll/interval/offline/contribution/close/prompt/attendance | session capture components and `CreditPromptInbox` |
| Import candidate/claim/witness/attestation/provenance/contest | `CreditImportWorkbench`, `ClaimFlow`, `WitnessRequestFlow`, `AttestationInbox`, `AttestationAnswerFlow`, `ProvenanceExplanation`, `CreditContestFlow` |
| Role/instrument/pending alias projections | `TaxonomyPicker`, `PendingAliasReview` |

No component consumes internal confidence score, ring flags, refusal identity, private attendance pointer, hidden credit counts, unrestricted session data, raw import rows or service credentials.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every named role/state; hidden DOM absence; semantic table/list parity; prompt silence; unavailable provenance; offline conflict focus; taxonomy literal fallback |
| Contract | all 07a-c successes/errors, ETags/idempotency, cursor/count authorization, no-store/redaction, state registries, jobs and exact claim/evidence hashes |
| E2E | assertion/concurrent attach, public embargo non-inference, graph limits, lift/objection, amendment/merge, online/offline roll/contribution/close/reopen, prompts, attendance revoke, import, claim, attestation/retraction, derivation failure, contest and taxonomy mapping |
| Accessibility | keyboard/AT ledger, roll/grid, prompts, timelines, taxonomy, graph paths, offline reconciliation and responsive views |
| Security | rights/split inference, hidden count/cache leak, auto-merge, attribution overreach, attendance promotion, refusal/internal score leak, fuzzy auto-bind and dispute-publication denial |
| Performance | public discography/graph <=70KB initial JS, capture/workbench <=120KB, guided flows <=100KB, islands <=50KB unless approved; cursor/virtualization preserve semantics |

## Deepening Record

1. **State synchronization**: credit, visibility, amendment, merge, capture, offline ops, prompts, evidence, claims, attestations, provenance, contests and taxonomy converge on server versions/hashes.
2. **Network degradation**: restrictive visibility fail-closed, sparse graph, offline operation recovery, independent prompt delivery, taxonomy literal fallback and provenance unavailable are explicit.
3. **Flow sequencing**: CRD-01..18 map to routes/components and preserve immutable assertion, visibility ratchet, deterministic merge, prompt hash, evidence derivation and dispute order.
4. **Responsive/touch**: ledgers, grids, timelines, graph paths and review manifests retain complete keyboard/touch behavior.
5. **State exhaustion**: every credit/visibility/amendment/merge/session/roll/op/prompt/evidence/claim/request/attestation/provenance/contest/taxonomy state renders explicitly.
6. **Role exhaustion**: all nine IA actors have explicit cells and named variants; workers receive no interactive UI.
7. **Accessibility edge cases**: semantic alternatives, no hidden AT trace, prompt silence, offline conflict focus and graph explanation are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role variant, responsive behavior and accessibility contract.
- **Macro**: CRD-01..18 preserve immutable contribution truth, viewer-relative confidentiality, offline provenance, bounded attestations, categorical evidence and vocabulary history.
- **Two-implementer assertion**: independent implementers choose identical canonical credit identity, visibility/count behavior, correction/merge, offline merge, close prompts, claim/attestation/provenance and taxonomy rules.
- **Devil's advocate**: no UI can infer rights/splits, leak embargo counts, auto-merge people, turn attendance/silence/popularity into evidence, display internal score, suppress public credit merely because contested, or retroactively rewrite taxonomy/history.
- **Result**: PASS.

## Open Questions

None. Taxonomy literals keep credit capture non-blocking, while fuzzy identity/role matches remain suggestions only. Attendance remains optional evidence and never creates or promotes credit.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete credit graph, capture and confidence frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by
- [[specs/fe/00-infrastructure|FE 00 Infrastructure]]
- [[specs/fe/01-identity-authority|FE 01 Identity Authority]]
- [[specs/fe/02-profiles-verification|FE 02 Profiles and Claiming]]
- [[specs/fe/06-trust-safety|FE 06 Trust and Safety]]
- [[specs/design-system|Design System]]

### Derives from
- [[specs/ia/07-credits-core|Shard 07 IA]]
- [[specs/ia/deep-dives/07-credits-core|Credit Graph and Capture Deep Dive]]
- [[specs/be/07a-credit-assertions-visibility|BE 07a]]
- [[specs/be/07b-session-capture-offline|BE 07b]]
- [[specs/be/07c-claims-attestations-confidence-taxonomy|BE 07c]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/07-credits-core|Deep Dive 07 — Credit graph, capture and confidence]]

### References
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/07b-session-capture-offline|Session roll, contribution capture and offline merge — Backend Specification]]
- [[specs/be/07c-claims-attestations-confidence-taxonomy|Credit claims, attestations, confidence and taxonomy — Backend Specification]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/deep-dives/07-credits-core|Deep Dive 07 — Credit graph, capture and confidence]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/02-profiles-verification|Profiles, Claiming and Qualifications - Frontend Specification]]
- [[specs/fe/06-trust-safety|Trust, Safety, Disputes and Evidence - Frontend Specification]]
- [[specs/design-system|Design System]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
