# Opportunities and Casting Lifecycle - Frontend Specification

> **BE Sources**: [[specs/be/13a-opportunity-publication-discovery-alerts|Opportunity Publication Discovery and Alerts]], [[specs/be/13b-submissions-auditions-pitches|Submissions Auditions and Pitches]], [[specs/be/13c-triage-offers-dispositions|Triage Offers and Dispositions]], [[specs/be/13d-handoff-history-specialized-calls|Handoff History and Specialized Calls]]  
> **IA Source**: [[specs/ia/13-opportunities-casting|Shard 13 Opportunities and Casting Lifecycle]]  
> **Status**: Complete

## Classification

- **Type**: High-complexity feature specification spanning four backend contracts and the complete post-to-handoff opportunity lifecycle.
- **Surface**: Opportunity drafting/publication/targeting, finite board/alerts, submissions/auditions/pitches, triage/shortlist, offers/counters/urgent cascades, dispositions, handoff/history, band membership opportunities and fee-free open calls.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 jobs/errors; FE 01 acting/decider authority; FE 06 moderation; FE 07 evidence; FE 09/10 handoff targets; FE 11 verified collaboration graph; Shard 14 service engagement remains distinct.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/13-opportunities-casting|Shard 13 IA]] | OPP-01..19, contracts, access control, accessibility and edge cases |
| IA deep dive | [[specs/ia/deep-dives/13-opportunities-casting|Opportunities and Casting Deep Dive]] | compensation gate, finite matching, terms-change consent, queue completeness, receipt ordering and handoff durability |
| Backend | [[specs/be/13a-opportunity-publication-discovery-alerts|13a]] | draft/publish/terms/targeting, finite board and explicit alerts |
| Backend | [[specs/be/13b-submissions-auditions-pitches|13b]] | deliberate applications, terms responses, audition task/media and policy-gated pitches |
| Backend | [[specs/be/13c-triage-offers-dispositions|13c]] | reviewer conflicts, triage, shortlist, offers/counters/cascades and immutable dispositions |
| Backend | [[specs/be/13d-handoff-history-specialized-calls|13d]] | durable handoff, external artifacts, history, response signals, band proposals and open calls |
| Design | [[specs/design-system|Design System]] | Public Directory, Guided Form, Working Record and List-to-Detail Workbench |

## Source and Interaction Map

| IA interaction | Frontend owner | Completion boundary |
|---|---|---|
| `OPP-01` Draft opportunity | `OpportunityComposer` | Explicit acting identity/decider, immutable type, slots, compensation and criteria persist. |
| `OPP-02` Publish/re-publish | `PublicationPreflight` | Exact type/compensation/spec-work/criteria/rights/target gate passes; no force publish. |
| `OPP-03` Edit live terms | `TermsSuccessorFlow` | Material successor re-gates and every applicant sees delta with Stay/Withdraw; silence stays. |
| `OPP-04` Configure targeting | `TargetingCascadeEditor` | Poster-ordered verified-network/local/broad predicates/times freeze without platform reorder. |
| `OPP-05` Browse/search board | `OpportunityBoard` | Finite exhaustible session returns fit reasons, compensation, freshness and explicit new count. |
| `OPP-06` Save alert | `OpportunityAlertEditor` | Explicit bounded intent/tier ceiling/expiry creates at most governed deliveries. |
| `OPP-07` Assemble submission | `SubmissionAssembler` | Exact entity/slot/evidence/availability/answers submit deliberately; no bulk/template apply. |
| `OPP-08` Audition task | `AuditionTaskFlow` | Scope/rounds/retention/payment/rights precede resumable upload; strong evidence may waive. |
| `OPP-09` Unsolicited pitch | `PitchFlow` | Current target policy converts eligible pitch to ordinary target-anchored submission, not message. |
| `OPP-10` Triage | `CandidateTriageWorkbench` | Loaded evidence permits attributed advance/reject/hold; hold has blocker/owner/resolve-by. |
| `OPP-11` Shortlist/review | `ShortlistWorkbench` | Independent attributed disagreement remains visible; decider saves full shortlist version. |
| `OPP-12` Issue offer | `OfferComposer` | Exact final terms/delta/gate/fuse/parallel disclosure/handoff mode create irrevocable active offer. |
| `OPP-13` Counter/accept/decline | `OfferDecisionFlow` | Full delta reviewed; counter is reverse offer; first platform receipt atomically fills slot. |
| `OPP-14` Urgent-fill cascade | `UrgentCascadeWorkbench` | Frozen poster ranking drives honest serial/parallel fuses; platform confidence never reorders. |
| `OPP-15` Disposition applicants | `DispositionStatus` | Every submitted candidate receives one immutable terminal truth independent of notice delivery. |
| `OPP-16` Execute handoff | `AcceptanceHandoffStatus` | Exact target outbox converges/retries; acceptance remains valid through failure/divergence. |
| `OPP-17` Pipeline history | `ApplicantOpportunityHistory` | Applicant sees own immutable age/state/diffs/onward links and may hide locally only. |
| `OPP-18` Band membership | `BandMemberOpportunityFlow` | Accepted candidate enters Shard 01 membership proposal, never service engagement/inferred consent. |
| `OPP-19` Open call | `OpenCallComposer` | Fee-free, decide-by and judging rules use ordinary slots/submissions/dispositions with no Fan vote. |

## Launch Boundaries

| Boundary | Required frontend behavior |
|---|---|
| Acting authority | Poster identity and decider are explicit; no silent personal/Band/organization default. |
| Compensation | Six facets and spec/unpaid legitimacy gate before publication/offer; system never infers compensation. |
| Discovery | Finite cursor session, explicit end/new count and reasons; no infinite-scroll dependency or own-party posts. |
| Submission | One deliberate entity/post/slot application; no one-click, bulk, template or upload-as-submit. |
| Review | Candidate-reviewer conflict overrides grants; incomplete queue disables irreversible reject/disposition. |
| Offers | Immutable fuse/delta/parallel disclosure and monotonic server-receipt winner; losing race receives named filled/cascade outcome. |
| Handoff | Failure never reopens or rolls back acceptance; absent internal target yields external artifact, not fabricated object. |

## Design Requirements

**Direction**: A casting desk, not a gig-feed casino: terms-first, finite and accountable.  
**Typography**: Source Sans 3; IBM Plex Mono for terms/rule hashes, slot IDs, receipt order, fuses and handoff manifests.  
**Colors**: Paper/Surface/Graphite; Jam Magenta for current action. Fit, triage, terms-change, offer and disposition use text/structure.  
**Motion**: 150-220ms bounded feedback; no infinite scroll, countdown panic, swipe rejection, confetti or race animation.  
**Anti-patterns**: no compensation inference, admin force-publish, trusted-network=follows, false mismatch, bulk apply/reject, averaged reviewer opinion, queue position, silent terms withdrawal, platform-ranked urgent candidates, rollback-on-handoff-failure or Fan voting.

## Design System Compliance

- **Archetypes**: Public Directory for board; Guided Form for compose/apply/audition/offer; Workbench for pipeline/triage; Record Detail for post/submission/offer/history.
- **Global components**: `<PageShell>`, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<StateLabel>`, `<FilterBar>`, `<DataTable>`, `<Timeline>`, `<GapList>`, `<SemanticDiff>`, `<ActionBar>`, `<ConfirmationStep>`, `<JobStatus>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every view implements FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Offers, acceptances, dispositions and handoffs require canonical success.
- **Timing**: 8-second reads and 15-second protected commands; uploads and handoff jobs expose stable polling/retry.

## Page and Route Definitions

| Route | Guard/archetype | Primary components | Navigation behavior |
|---|---|---|---|
| `/opportunities` | Public/professional directory | `OpportunityBoard`, `OpportunityAlertEditor` | Finite session filters/cursor and explicit new count in URL-safe state. |
| `/opportunities/{id}` | Viewer-relative Record Detail | `OpportunityRecord`, `SubmissionAssembler` | Public/Fan and professional compensation projections differ server-side. |
| `/app/opportunities/new` | Authorized poster | `OpportunityComposer`, `PublicationPreflight` | Acting identity/decider persistent and explicit. |
| `/app/opportunities/{id}/edit` | Poster/decider | `OpportunityComposer`, `TermsSuccessorFlow`, `TargetingCascadeEditor` | Published type/handoff mode immutable; clone path for type change. |
| `/app/opportunities/{id}/pipeline` | Assigned poster/decider/reviewer | `CandidatePipeline`, `CandidateTriageWorkbench`, `ShortlistWorkbench` | Candidate-reviewer conflict hides queue entirely. |
| `/app/opportunities/{id}/offers` | Current decider | `OfferComposer`, `UrgentCascadeWorkbench` | Exact slot/terms/shortlist versions refetched before issue. |
| `/app/submissions/{id}` | Applicant entity/authorized reviewer | `SubmissionRecord`, `TermsChangeResponse`, `AuditionTaskFlow` | Projection role-scoped; applicant never sees queue/other candidates. |
| `/app/offers/{id}` | Candidate/issuer | `OfferRecord`, `OfferDecisionFlow` | Absolute deadline plus fuse; full delta required before accept. |
| `/app/acceptances/{id}/handoff` | Winner/owner | `AcceptanceHandoffStatus`, `ExternalHandoffArtifact` | Acceptance truth stays fixed through retries/divergence. |
| `/app/opportunity-history` | Applicant acting entity | `ApplicantOpportunityHistory` | Entity/state/date cursor; hide is viewer-local only. |
| `/app/pitches/new` | Eligible professional | `PitchFlow` | Target policy/version and slot intent required; no messaging fallback. |
| `/app/bands/{bandId}/member-opportunities/new` | Band representative mandate | `BandMemberOpportunityFlow` | Decide-by <=90 days; membership handoff explicit. |
| `/app/open-calls/new` | Authorized organizer | `OpenCallComposer` | Fee-free and no Fan-vote constraints hard-coded by schema. |

## Component Inventory

Every component inherits FE 00 request IDs, redaction, errors and focus restoration. Queue position, other candidates/reviews and hidden availability conflicts never enter applicant props.

### Publication and Discovery

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<OpportunityBoard page: OpportunityPage; session: BoardSessionProjection; query: OpportunityQuery; actingParty?: ActingPartyProjection>` | `loading|empty|success|stale|degraded|failed`; finite cursor/end, one-sentence reasons, compensation/freshness, own-party exclusion and explicit new count. | Keyboard pagination, no infinite-scroll dependence; reason/freshness/age text; over-60m cache removes fit claim. |
| `<OpportunityRecord opportunity: OpportunityProjection; slots: OpportunitySlotPage; viewer: OpportunityViewerProjection>` | `loading|published|closed|cancelled|expired|degraded|failed`; immutable type/handoff, current terms/rules, compensation, criteria and target stage. | Semantic terms/slot definition lists; no hidden professional fields in Fan DOM. |
| `<OpportunityComposer draft?: OpportunityResponse; actingParties: SafePartyPage; deciders: DeciderAuthorityPage; types: OpportunityTypePage>` | `editing|submitting|draft|validation_error|conflict|failed`; explicit identity/decider, immutable type, slots/date/location/decide-by/compensation/criteria. | Grouped semantic controls; persistent validation; identity/type/compensation always visible. |
| `<PublicationPreflight opportunity: OpportunityResponse; preflight?: PublicationPreflightResponse; rules: OpportunityRuleSet>` | `idle|checking|blocked|ready|publishing|published|source_stale|failed`; six compensation facets, unpaid/spec legitimacy, criteria/rights/targeting. No force publish. | Semantic exact gaps and remediation; focus first blocker; rule/source version in review. |
| `<TermsSuccessorFlow opportunity: OpportunityProjection; current: OpportunityTerms; proposed?: OpportunityTerms; affectedCount: SafeCount>` | `editing|preflighting|blocked|submitting|active|conflict|failed`; complete successor/delta; tighter/decreased terms mark every submission changed. Silence keeps applicant. | Accessible before/after table; consequences/notices before submit; no applicant identities/count leakage beyond safe count. |
| `<TargetingCascadeEditor opportunity: OpportunityProjection; stages: TargetingStagePage; predicates: TargetPredicateDefinition[]>` | `draft|active|completed|expired|cancelled|superseded|editing|conflict|failed`; poster order/times, invite/trusted-credit-network/qualified-local/broad. | Keyboard reorder/actions and announced positions; source predicate explanation. |
| `<OpportunityAlertEditor current?: OpportunityAlertResponse; limits: AlertPolicyProjection; queryDefaults: OpportunityQuery>` | `editing|active|paused|expired|cancelled|optimistic_pending|optimistic_rollback|failed`; explicit bounded intent, tier ceiling/expiry and two-delivery lifetime budget. | No implicit alert toggle; device-consent/delivery-state text; keyboard complete. |

### Submission and Review

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<SubmissionAssembler opportunity: OpportunityProjection; slot: OpportunitySlotProjection; applicantEntities: ApplicantEntityPage; evidence: SelectableEvidencePage>` | `editing|draft|submitting|submitted|terms_changed|withdrawn|conflict|failed`; exact entity/slot, cited pointers, per-date availability, bounded answers and deliberate confirmation. | Saved draft, no one-click pressure; evidence/availability summary; focus errors. |
| `<SubmissionRecord submission: SubmissionProjection; history: SubmissionVersionPage; viewer: SubmissionViewerProjection>` | `draft|submitted|terms_changed|withdrawn|under_review|accepted|declined|not_selected|slot_filled|cancelled|expired`; immutable diffs/evidence pointers. | Ordered history; state/age/diffs in text; no queue position or other candidate data. |
| `<TermsChangeResponse submission: SubmissionProjection; delta: TermsDeltaProjection>` | `review|submitting|stayed|withdrawn|stale|failed`; Stay/Withdraw against exact delta; silence stays. | Before/after semantic table; equivalent actions; focus result; no urgency manipulation. |
| `<AuditionTaskFlow task: AuditionTaskProjection; evidence: SelectableEvidencePage; upload?: AuditionUploadProjection>` | `draft|active|blocked|waived|uploading|settling|quarantined|scanning|ready|submitted|completed|failed|rejected|expired|cancelled`; scope/rounds/retention/payment/rights first. | Resumable progress; non-audio alternatives where task permits; waiver/evidence and rights text associated. |
| `<PitchFlow target: TargetPitchPolicyProjection; applicant: ProfessionalPartyProjection; slots: TargetSlotIntentPage; evidence: SelectableEvidencePage>` | `policy_eligible|editing|submitting|submitted|blocked|stale|failed`; ordinary submission lifecycle and current policy; never messaging bypass. | Policy/target/slot/terms before submit; denied route reveals no private reason. |
| `<CandidatePipeline slot: OpportunitySlotProjection; page: CandidatePipelinePage; completeness: QueueCompletenessProjection>` | `loading|partial|success|degraded|failed`; owner/reviewer state cursor, evidence/media completeness and independent reviews. | Semantic table/list; loaded/incomplete state; irreversible actions absent until complete. |
| `<CandidateTriageWorkbench candidate: CandidateReviewProjection; assignment: ReviewAssignmentProjection; completeness: CandidateCompletenessProjection>` | `assigned|active|completed|revoked|conflicted|advance|reject|hold|failed`; candidate-reviewer conflict hides candidate; reject needs complete load; hold needs blocker/owner/date. | Evidence/criterion snapshot and consequences; reject disabled/unfocusable when incomplete. |
| `<ShortlistWorkbench slot: OpportunitySlotProjection; candidates: ShortlistCandidatePage; votes: ReviewVotePage; etag: ETag>` | `draft|active|superseded|closed|optimistic_pending|optimistic_rollback|conflict|failed`; full-set save, attributed disagreement never averaged. | Keyboard add/remove/reorder if ordered; independent reviews rendered separately. |

### Offers, Outcomes and Handoff

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<OfferComposer candidate: CandidateReviewProjection; slot: OpportunitySlotProjection; currentTerms: OpportunityTerms; handoffModes: HandoffModeDefinition[]>` | `editing|gating|blocked|submitting|active|failed`; exact final terms/delta/comp proof/fuse/parallel count/handoff. Issuer cannot revoke inside fuse without named cause. | Full semantic delta, absolute deadline/fuse and parallel disclosure before submit. |
| `<OfferRecord offer: OfferProjection; slot: OpportunitySlotProjection; viewer: OfferViewerProjection>` | `active|accepted|declined|expired|revoked|superseded|stale|failed`; exact issuer/candidate/terms/delta/fuse/parallel/handoff state. | Absolute deadline plus remaining time; receipt-order rule announced. |
| `<OfferDecisionFlow offer: OfferProjection; delta: TermsDeltaProjection; availability: AvailabilityConfirmation>` | `review|countering|submitting|accepted|declined|expired|slot_filled|conflict|failed`; accept disabled if delta missing; decline always usable; counter is gated reverse offer. | Before/after table; parallel/receipt ordering before accept; first conflict result focused. |
| `<UrgentCascadeWorkbench slot: OpportunitySlotProjection; candidates: RankedCandidatePage; cascade?: UrgentCascadeProjection>` | `draft|active|completed|cancelled|stale|editing|failed`; frozen poster order, serial/parallel fuses/disclosure; platform never reorders. | Keyboard ranking controls; each candidate/fuse/disclosure textual; no confidence score. |
| `<DispositionStatus disposition: SubmissionDispositionProjection; notice: NoticeDeliveryProjection>` | immutable `accepted|declined|not_selected|slot_filled|cancelled|expired|withdrawn`; notice `queued|delivered|failed|suppressed`. First truth never changes. | Clear outcome/attribution/time; delivery failure distinct from missing outcome; no blame copy. |
| `<AcceptanceHandoffStatus acceptance: AcceptanceProjection; handoff: AcceptanceHandoffProjection>` | `pending|processing|converged|failed|diverged|external_required|artifact_pending`; retry same event identity; acceptance never rolls back. | Acceptance and handoff separate headings; exact target/back-reference/error without private manifest. |
| `<ExternalHandoffArtifact acceptance: AcceptanceProjection; artifact?: ExternalHandoffArtifactProjection>` | `requested|generating|ready|failed|stale|superseded`; only when no internal target; checksum-sealed, partial quarantined. | Format/checksum/expiry/download labels; no fabricated project/membership state. |
| `<ApplicantOpportunityHistory page: ApplicantHistoryPage; query: ApplicantHistoryQuery; actingEntity: ApplicantEntityProjection>` | `loading|empty|success|degraded|failed`; immutable age/state/diffs/onward links and viewer-local visible/hidden metadata. | Timeline/list; hiding scope explicit; no owner-pipeline deletion implication. |

### Specialized Calls

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<BandMemberOpportunityFlow band: BandProjection; representative: MandateProjection; roles: RoleVersionPage>` | `editing|publishing|published|acceptance_pending|membership_pending|accepted|rejected|expired|failed`; decide-by <=90d and unresolved-cast preserved. | Band/member authority and membership-not-service consequence before publish. |
| `<OpenCallComposer organizer: OrganizerProjection; types: OpenCallTypeDefinition[]; judgingRules: JudgingRuleDefinition[]>` | `editing|preflighting|blocked|publishing|published|failed`; fee-free, explicit decide-by/submission/judging and no Fan-voting schema. | Fee/terms/rules review and exact blockers; no vote controls. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Opportunity/terms/targeting | Server immutable type/handoff and versioned current terms/cascade; safe filters only in URL. |
| Board/alerts | Server stable search session/cursor and explicit user alert intent; no inferred intent. |
| Submission/audition/pitch | Server applicant-entity versions/hashes and resumable media state; local safe draft only. |
| Review/shortlist | Server assignments, complete-source snapshots and attributed votes; candidate conflict authoritative. |
| Offer/slot/cascade/disposition | Server monotonic receipt transaction and immutable terminal truth; timers use database time. |
| Handoff/history | Server durable acceptance/outbox and applicant-local visibility metadata. |

- Back/forward restores safe board filters, post tab, pipeline filter or history cursor only if still authorized.
- Unsaved guards protect composer, terms, targeting, submission, audition, triage hold, offer and cascade drafts. They never obstruct applicant withdrawal/decline where allowed.
- Multi-tab conflicts preserve local draft and refetch exact terms/slot/evidence/receipt state. No offer/acceptance/disposition uses last-write-wins.
- Offline permits bounded local draft and resumable upload metadata only; publication, submit, triage, offer and acceptance require current server truth.

## Interaction Flows

### Publish and Discover

1. Poster explicitly selects acting identity/decider/type/slots and complete terms; preflight gates compensation, criteria, rights, targeting and rule versions.
2. Type/handoff mode never changes after publication. Material terms successor re-gates and sends exact delta to every applicant.
3. Targeting follows frozen poster stage order using verified-credit graph, never follows/platform confidence.
4. Board returns finite fit-first results and explicit end/new count; stale cache remains usable with age but no fit claims.
5. Alert exists only after explicit bounded user intent and consented device delivery policy.

### Submit and Review

1. Applicant selects exact acting entity/slot, cites evidence, confirms per-date availability and deliberately submits one active tuple.
2. Audition rights/payment/retention/scope precede upload; strong current evidence may create attributed waiver.
3. Pitch obeys target policy and enters ordinary queue; no direct-message escape.
4. Reviewer conflict removes queue visibility. Reject requires complete evidence/media/criteria; hold requires owner/blocker/deadline.
5. Reviews stay independent and attributed; decider saves shortlist without averaging disagreement.

### Offer, Disposition and Handoff

1. Decider issues exact gated offer with full delta/fuse/parallel disclosure; counter creates successor reverse offer.
2. Candidate reviews delta/receipt ordering before acceptance; first valid server receipt fills slot atomically and named losers close.
3. Terminal slot sweep writes one immutable disposition for every submitted candidate; notice delivery retries separately.
4. Acceptance outbox creates/joins/proposes exact target. Failure/divergence retries without mutating acceptance.
5. Missing internal target yields external artifact; band win yields Shard 01 proposal; original history remains immutable.

## Error-to-UI Matrix

| Code/family | UI state | Recovery |
|---|---|---|
| acting/decider/type invalid | Draft blocked | Select explicit authorized identity/decider/type; published type requires clone. |
| compensation/criteria/rights/spec gate | Publication/offer blocked | Resolve exact facet/evidence; no admin override. |
| terms/rules/source stale | Stale preflight/delta | Refetch and compare; existing applicants retain Stay/Withdraw. |
| targeting source invalid | Cascade blocked | Use current verified-credit predicates and poster ordering. |
| board dependency/cache stale | Degraded/aged | Keep finite results with age, remove fit claim, retry source. |
| alert consent/budget invalid | Suppressed | Renew explicit intent/device consent or create new intent after expiry. |
| duplicate active submission | Current submission | Open existing tuple or explicit successor; no duplicate card. |
| terms/evidence/task stale | Submission/audition blocked | Re-preflight current versions; preserve draft/upload where safe. |
| reviewer candidate/conflicted | Queue concealed | Reassign eligible reviewer; expose no queue existence/details. |
| evidence/queue partial | Reject unavailable | Finish loading/current checks; recoverable advance/hold only where safe. |
| offer delta/compensation missing | Offer/accept blocked | Regenerate exact delta/gate; decline remains available. |
| slot already filled/receipt lost | Named filled/cascade loss | Preserve candidate outcome; no partial acceptance or retry claim. |
| cascade source changed | Cascade stale | Rebuild explicit poster order; platform does not reorder. |
| handoff failed/diverged | Acceptance durable | Retry same event identity/escalate or generate external artifact. |
| downstream target absent | External required | Generate exact acceptance artifact; no fabricated target object. |
| history visibility conflict | Viewer-local conflict | Refetch local metadata; source history remains immutable. |
| `VERSION_CONFLICT`, `ACTING_CONTEXT_STALE`, `IDEMPOTENCY_MISMATCH` | Protected conflict | Refetch/compare and retry identical command only; preserve safe draft. |

Errors include request ID but omit private matching/compensation filters, availability, answers, evidence/media, queue position, other candidates/reviews, competing offers and private handoff manifests.

## Conditional Rendering Matrix

| Feature | Poster | Decider/reviewer | Applicant entity | Band representative | Fan | Moderator | Worker |
|---|---|---|---|---|---|---|---|
| Draft/publish/target | authorized administration | gate/decider actions | hidden | band mandate variant | public read only | case-scoped enforcement | gate/index/expiry |
| Board/alerts | board excluding own party | professional board | professional board/alerts | acting-band board | safe public board, no professional comp | shared content only | rank/deliver only |
| Submission/audition | owner pipeline only | assigned review/task | own apply/task/pitch/history | band apply under mandate | hidden | media case scope | ingest/notify only |
| Triage/offer/cascade | owner if decider | assigned exact slot | own offer decision only | candidate/owner by mandate | hidden | no hiring decision | disposition timer/sweep |
| Handoff/specialized | owner handoff | decider status | winner/history | membership proposal path | open-call read, no vote/apply | case scope only | outbox/artifact/proposal |

Named variants: `posterAuthorized`, `reviewerAssigned`, `applicantOwn`, `bandMandated`, `fanSafeRead`, `moderatorCaseScoped`, `workerExactNoUi`.

## Accessibility Inventory

| Interaction | Keyboard/focus and screen-reader contract | IA source |
|---|---|---|
| Composer/publication | Acting identity, immutable type, compensation facets and criteria trust grouped with persistent validation | IA 13 § Accessibility |
| Board | Finite keyboard pagination, one-sentence reasons, freshness and explicit new count | IA 13 § Accessibility |
| Terms/offer delta | Semantic before/after tables; accept disabled without delta while decline remains usable | IA 13 § Accessibility |
| Submission/audition | Saved draft/resumable media, no one-click pressure and blind-review limits explained | IA 13 § Accessibility |
| Triage | Loaded/incomplete state; irreversible reject/disposition unavailable to focus until ready | IA 13 § Accessibility |
| Timers/acceptance | Absolute deadline plus remaining fuse, receipt ordering and parallel disclosure before accept | IA 13 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, resumable upload and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Board/compose | Submission/review | Offer/handoff/history |
|---|---|---|---|
| `<=768px` | Finite result cards; grouped composer/preflight steps | One evidence/task/candidate step; triage state before action | Delta then decision; status/history linear |
| `769-1024px` | Directory list/detail and compose summary | Submission record/task or candidate list/detail | Offer/handoff list-detail with timer/status rail |
| `>=1025px` | Board plus reason/filter rail; composer/preflight rail | Pipeline workbench with evidence/review/action rail | Offer/cascade/handoff workbench and applicant timeline |

Every width retains acting entity, immutable type, compensation, fit/freshness, terms version/delta, completeness, fuse/parallel disclosure, receipt outcome and handoff durability in text.

## Data Mapping

| BE response family | Components |
|---|---|
| opportunity/preflight/terms/targeting/board/alert | board/record/composer/preflight/terms/targeting/alert components |
| submission/version/terms response/audition/upload/pitch | submission record/assembler/terms/audition/pitch components |
| assignment/triage/shortlist/offer/counter/cascade/disposition/pipeline | pipeline/triage/shortlist/offer/cascade/disposition components |
| handoff/external artifact/history/response signal/band proposal/open call | handoff/artifact/history/band/open-call components |

No component consumes hidden calendar conflicts, queue rank, unrelated candidates/reviews, private handoff manifest, inferred compensation or service credentials.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every state/role; finite board/end/new count; six compensation facets; delta/fuse; incomplete queue; neutral history/handoff states |
| Contract | all 13a-d successes/errors, ETags/idempotency/hashes, state registries, database-time receipt order, authorization-before-count, jobs, RLS/redaction |
| E2E | draft/preflight/publish/terms/targeting/board/alert, apply/terms/audition/pitch, reviewer conflict/triage/shortlist, offer/counter/race/cascade/disposition, handoff failure/external/history/band/open call |
| Accessibility | keyboard/AT composer, finite board, deltas, submissions/uploads, triage completeness, timers, outcomes and responsive views |
| Security | silent identity, compensation inference, own/reviewer conflict, queue/availability leak, bulk apply/reject, false match, receipt race, disposition deletion and fabricated handoff denial |
| Performance | board <=100KB initial JS, compose/submission <=110KB, pipeline <=140KB, islands <=50KB unless approved; finite cursors/semantic virtualization |

## Deepening Record

1. **State synchronization**: opportunity, terms, targeting, submission, review, offer, disposition and handoff converge on exact source/version/hash state.
2. **Network degradation**: aged board, resumable media, partial queue, lost offer race, failed handoff and unknown setup remain explicit.
3. **Flow sequencing**: OPP-01..19 map to components while terms, deliberate apply, review completeness, receipt ordering and durable acceptance stay intact.
4. **Responsive/touch**: finite board, grouped forms, deltas, task media, triage and timelines retain keyboard/touch parity.
5. **State exhaustion**: every opportunity, terms, cascade, alert, submission, task/upload, review, shortlist, offer, slot, disposition, handoff and history state renders.
6. **Role exhaustion**: all seven IA actors have explicit variants; Fan, moderator and worker boundaries are closed.
7. **Accessibility edge cases**: explicit identity, finite navigation, semantic deltas, pressure-free submission, incomplete-action lockout and receipt-order timers are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role, responsive and accessibility contracts.
- **Macro**: OPP-01..19 preserve explicit authority/terms, finite explainable discovery, deliberate application, conflict-free review, immutable offers/dispositions and durable typed handoff.
- **Two-implementer assertion**: independent implementers choose identical publication gate, terms-change, board/alert, submission/audition, triage/shortlist, offer race/cascade, disposition and handoff behavior.
- **Devil's advocate**: no UI can infer compensation/intent/authority, infinite-scroll or false-fit, bulk apply/reject, expose queue/conflicts, average review, let platform reorder cascade, rollback acceptance, erase disposition or fabricate downstream membership/project.
- **Result**: PASS.

## Open Questions

None. Consumer launch supports the complete lifecycle; specialized band/open-call outcomes reuse ordinary opportunity truth while preserving Shard 01 membership and no-Fan-vote boundaries.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete opportunities and casting lifecycle frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by

- [[specs/fe/00-infrastructure|Frontend Infrastructure]]
- [[specs/fe/01-identity-authority|Identity and Authority Frontend]]
- [[specs/fe/06-trust-safety|Trust, Safety and Evidence Frontend]]
- [[specs/fe/07-credits-core|Credits Core Frontend]]
- [[specs/fe/09-projects-collaboration|Projects and Collaboration Frontend]]
- [[specs/fe/10-rights-ownership|Rights and Ownership Frontend]]
- [[specs/fe/11-community-graph|Social Graph Frontend]]

### Derives from

- [[specs/ia/13-opportunities-casting|Shard 13 Opportunities and Casting Lifecycle]]
- [[specs/ia/deep-dives/13-opportunities-casting|Opportunities and Casting Deep Dive]]
- [[specs/be/13a-opportunity-publication-discovery-alerts|Opportunity Publication Discovery and Alerts]]
- [[specs/be/13b-submissions-auditions-pitches|Submissions Auditions and Pitches]]
- [[specs/be/13c-triage-offers-dispositions|Triage Offers and Dispositions]]
- [[specs/be/13d-handoff-history-specialized-calls|Handoff History and Specialized Calls]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/13-opportunities-casting|Deep Dive 13 — Opportunities and casting lifecycle]]

### References
- [[specs/be/13a-opportunity-publication-discovery-alerts|Opportunity publication, targeting, discovery and alerts — Backend Specification]]
- [[specs/be/13b-submissions-auditions-pitches|Opportunity submissions, auditions and unsolicited pitches — Backend Specification]]
- [[specs/be/13c-triage-offers-dispositions|Candidate triage, shortlists, offers and dispositions — Backend Specification]]
- [[specs/be/13d-handoff-history-specialized-calls|Opportunity handoff, history, band membership and open calls — Backend Specification]]
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
- [[specs/ia/deep-dives/13-opportunities-casting|Deep Dive 13 — Opportunities and casting lifecycle]]
- [[specs/design-system|Design System]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/fe/06-trust-safety|Trust, Safety, Disputes and Evidence - Frontend Specification]]
- [[specs/fe/07-credits-core|Credit Graph, Capture and Confidence - Frontend Specification]]
- [[specs/fe/09-projects-collaboration|Music Projects and Collaboration - Frontend Specification]]
- [[specs/fe/10-rights-ownership|Rights and Ownership - Frontend Specification]]
- [[specs/fe/11-community-graph|Social Graph and Collaborator Network - Frontend Specification]]
