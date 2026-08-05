# Services Marketplace Lifecycle - Frontend Specification

> **BE Sources**: [[specs/be/14a-service-listings-quotes-engagements|Service Listings Quotes and Engagements]], [[specs/be/14b-requirements-sla-milestones-revisions|Requirements SLA Milestones and Revisions]], [[specs/be/14c-delivery-acceptance-exit-rights|Delivery Acceptance Exit and Rights]], [[specs/be/14d-substitution-multiparty-supply|Substitution and Multi-Party Supply]], [[specs/be/14e-repair-inspection-custody|Repair Inspection and Custody]]  
> **IA Source**: [[specs/ia/14-services-marketplace|Shard 14 Services Marketplace Lifecycle]]  
> **Status**: Complete

## Classification

- **Type**: High-complexity feature specification spanning five backend contracts, money-authorized engagements, atomic acceptance/rights/credit legs and custodial physical work.
- **Surface**: Service listings, quote requests/quotes, engagements, requirements/SLA, milestones/revisions/change orders, final delivery/acceptance/exits/recalls, substitutions, gated supply composition, rights execution, repair/inspection/custody and damage claims.
- **Approval**: Recommended grouping, consumer boundary and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 jobs/errors; FE 01 authority/self-dealing; FE 06 disputes; FE 07 worker credit; FE 09 project assets; FE 10 rights execution; payment provider evidence; B3 counsel gate blocks multi-payee release.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/14-services-marketplace|Shard 14 IA]] | SRV-01..19, contracts, access control, accessibility and edge cases |
| IA deep dive | [[specs/ia/deep-dives/14-services-marketplace|Services Marketplace Deep Dive]] | pricing shapes, quote acceptance, requirements deadlock, SLA races, atomic acceptance and custody evidence |
| Backend | [[specs/be/14a-service-listings-quotes-engagements|14a]] | listing/preflight, price evaluation, quote request/version and single-payee engagement acceptance |
| Backend | [[specs/be/14b-requirements-sla-milestones-revisions|14b]] | requirements gate, attributed SLA clock, milestone delivery, revision rounds and change orders |
| Backend | [[specs/be/14c-delivery-acceptance-exit-rights|14c]] | frozen final delivery, QC, acceptance saga, rights execution, exits, abandonment and recall |
| Backend | [[specs/be/14d-substitution-multiparty-supply|14d]] | buyer-approved substitution, actual-worker credit and B3-gated supply composition |
| Backend | [[specs/be/14e-repair-inspection-custody|14e]] | repair assessment/estimate, mutual custody/condition, independent inspection and damage claims |
| Design | [[specs/design-system|Design System]] | Public Directory, Guided Form, Working Record, Record Detail and List-to-Detail Workbench |

## Source and Interaction Map

| IA interaction | Frontend owner | Completion boundary |
|---|---|---|
| `SRV-01` Publish listing | `ServiceListingComposer` | Immutable craft plus tiers/deliverables/exclusions/pricing/mode/SLA/capacity/rights passes gate. |
| `SRV-02` Browse/request quote | `ServiceDirectory`, `QuoteRequestFlow` | Actual job inputs render seller pricing shape or quote-required without benchmark normalization. |
| `SRV-03` Issue/reissue quote | `QuoteComposer` | Ordered price/scope/artifacts/requirements/revisions/rights/exit/anonymity/expiry freeze; successor shows diff. |
| `SRV-04` Accept quote | `QuoteAcceptanceFlow` | Eligible different human confirms full quote/acknowledgements/payment authorization; exactly one engagement. |
| `SRV-05` Requirements gate | `RequirementsWorkbench` | Typed complete items/project attachments pass atomically or reach bounded no-fault deadlock. |
| `SRV-06` SLA clock | `SLAClockRecord` | Starts only after requirements, pauses only for named buyer-owed act and records contestable events. |
| `SRV-07` Milestone delivery | `MilestoneWorkbench` | Complete artifact set/QC delivers and eligible acceptance releases tranche/credit, not final rights. |
| `SRV-08` Revision | `RevisionRoundWorkbench` | Exact-artifact notes freeze as one round; empty/identical cycles consume nothing. |
| `SRV-09` Change order | `ChangeOrderFlow` | Out-of-scope mini-quote freezes price/payment/allowance delta and changes scope only after acceptance. |
| `SRV-10` Final delivery | `FinalDeliveryFlow` | Complete frozen manifest/declarations/QC/payout readiness starts fixed acceptance window. |
| `SRV-11` Accept/auto-accept | `DeliveryAcceptanceFlow` | Buyer or timer after grace atomically commits payment, rights and credit or rolls all back. |
| `SRV-12` Exit | `EngagementExitFlow` | Distinct cancellation/abandonment/release preflight yields exact four-leg settlement evidence. |
| `SRV-13` Recall | `RecallFlow` | Bounded post-terminal support task preserves closure/payment/rights. |
| `SRV-14` Substitute supplier | `SubstitutionFlow` | Buyer approves exact worker/scope before first work; actual worker receives credit. |
| `SRV-15` Compose fixer/bundle | `SupplyCompositionWorkbench` | N+1 stages/counterparties/title/payout plan records but activation returns B3 counsel-gate denial. |
| `SRV-16` Execute rights posture | `RightsExecutionStatus` | Frozen quote elections apply against current Shard 10 allocation during atomic acceptance. |
| `SRV-17` Repair service | `RepairJobWorkbench` | Mutual intake condition, assessment/estimate/approval/work/return condition create custody chain. |
| `SRV-18` Inspection | `InspectionJobWorkbench` | Conflict-free inspector delivers complete immutable template and earns instruction regardless finding. |
| `SRV-19` Damage claim | `DamageClaimFlow` | Exact mutual handoff/estimate/value evidence opens claim/case without insurance promise. |

## Delivery Phase Gates

| Capability | Consumer-launch presentation | Gate/boundary |
|---|---|---|
| Single-seller service lifecycle | Enabled from listing through quote, requirements, delivery, acceptance, exit and recall | Current authority, single payee and provider payment evidence |
| Seller-approved actual-worker substitution | Enabled with explicit buyer approval before first-work boundary | Current worker identity/profile and ordered approval/delivery evidence |
| Supply composition/fixer bundle | Recordable as inactive plan; activation disabled | B3 counsel/payment capability; no feature/admin bypass or flattened beneficiary |
| Multi-payee release | No route/action/provider call in v1 | Future immutable B3 approval only |
| Repair/inspection/custody | Enabled with mutual condition evidence and service-fee limitation | Platform never becomes custodian/insurer/warranty adjudicator |

## Design Requirements

**Direction**: A professional service work order: terms, clocks, artifacts and evidence—not gig-market gamification.  
**Typography**: Source Sans 3; IBM Plex Mono for quote hashes, price evaluation order, SLA events, artifact digests, provider leg IDs and condition hashes.  
**Colors**: Paper/Surface/Graphite; Jam Magenta only for current action. QC, clock, acceptance, rights, custody and provider states use text/structure.  
**Motion**: 150-220ms bounded feedback; no countdown panic, progress theatre, confetti, seller rank badges or price benchmark nudges.  
**Anti-patterns**: no pricing normalization, self-acceptance, silent repricing, incomplete delta acceptance, creative-quality QC, empty-round consumption, backdated auto-accept, partial atomic success, agency worker credit, B3 flag bypass, custody/insurance promise or outcome-paid inspection.

## Design System Compliance

- **Archetypes**: Public Directory for services; Guided Form for listing/quote/requirements/delivery/exit; Working Record for engagement; Workbench for milestones/repairs.
- **Global components**: `<PageShell>`, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<StateLabel>`, `<DataTable>`, `<Timeline>`, `<GapList>`, `<SemanticDiff>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<DownloadControl>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every view implements FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Quotes, engagements, acceptance legs, rights, custody and claims require canonical success.
- **Timing**: 8-second reads and 15-second commands; media/payment/acceptance/settlement jobs expose stable polling/reconciliation.

## Page and Route Definitions

| Route | Guard/archetype | Primary components | Navigation behavior |
|---|---|---|---|
| `/services` | Public/professional directory | `ServiceDirectory` | Craft/facet/mode/price-shape/liveness filters safe; no benchmark sort. |
| `/services/{listingId}` | Viewer-relative Record Detail | `ServiceListingRecord`, `QuoteRequestFlow` | Current listing version; issued quotes remain pinned to old version. |
| `/app/services/listings/new` | Seller | `ServiceListingComposer`, `ListingPreflight` | Explicit acting seller/craft/rights; primary craft immutable after publish. |
| `/app/quote-requests/{id}` | Buyer/seller | `QuoteRequestRecord`, `QuoteComposer` | Commercial content no-store and role-scoped. |
| `/app/quotes/{id}` | Buyer/seller | `QuoteRecord`, `QuoteAcceptanceFlow` | Full quote plus diff; payment token never enters URL/state history. |
| `/app/engagements/{id}` | Authorized party | `EngagementRecord`, `SLAClockRecord`, `RequirementsWorkbench` | State/tab safe; requirements values private. |
| `/app/engagements/{id}/milestones` | Buyer/seller/contributor scope | `MilestoneWorkbench`, `RevisionRoundWorkbench`, `ChangeOrderFlow` | Exact artifact/round/order versions. |
| `/app/engagements/{id}/delivery` | Buyer/seller | `FinalDeliveryFlow`, `DeliveryAcceptanceFlow`, `RightsExecutionStatus` | Acceptance timer and 120-second grace use server time. |
| `/app/engagements/{id}/exit` | Authorized party | `EngagementExitFlow`, `RecallFlow` | Exit kind explicit; terminal record never reopens. |
| `/app/engagements/{id}/substitution` | Seller/buyer | `SubstitutionFlow` | First-work boundary and actual worker explicit. |
| `/app/supply-compositions/{id}` | Buyer/fixer/scoped worker | `SupplyCompositionWorkbench` | Inactive record visible; activation action capability-gated. |
| `/app/repairs/{id}` | Item parties/custodian | `RepairJobWorkbench`, `CustodyHandoffFlow`, `DamageClaimFlow` | Condition media purpose-bound; platform not custodian. |
| `/app/inspections/{id}` | Buyer/assigned inspector | `InspectionJobWorkbench` | Template/evidence and conflict scope; finding does not affect fee instruction. |

## Component Inventory

Every component inherits FE 00 request IDs, redaction, errors and focus restoration. Requirement values, artifacts, economics, condition media and provider tokens never enter telemetry/URLs.

### Listings, Quotes and Engagements

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<ServiceDirectory page: ServiceListingPage; query: ServiceListingQuery; freshness: ProjectionFreshness>` | `loading|empty|success|stale|degraded|failed`; craft/facets/mode/pricing shape/liveness, no normalized benchmark. | Semantic list/table; pricing shape and liveness text; keyboard filters. |
| `<ServiceListingRecord listing: ServiceListingProjection; tiers: ServiceTierPage; rights: RightsPostureProjection>` | `active|paused|retired|stale|degraded|failed`; deliverables/exclusions/pricing/mode/SLA/capacity/rights. | Definition lists and exact exclusions; no ranking/benchmark meter. |
| `<ServiceListingComposer draft?: ServiceListingResponse; crafts: CraftTaxonomyPage; pricingShapes: PricingShapeDefinition[]>` | `editing|preflighting|blocked|submitting|active|validation_error|failed`; immutable craft, tiers/add-ons/deliverables/exclusions/pricing/mode/SLA/capacity/rights. | Grouped fields and arithmetic examples; semantic publish summary. |
| `<ListingPreflight listing: ServiceListingResponse; preflight?: ListingPreflightResponse>` | `idle|checking|blocked|ready|failed`; taxonomy/model/rights/SLA/capacity gate, no force publish. | Exact gap/remediation list; focus first blocker. |
| `<QuoteRequestFlow listing: ServiceListingProjection; buyer: BuyerAuthorityProjection; inputs: JobInputDefinition[]>` | `editing|evaluating|quote_required|priced|submitting|open|failed`; actual quantity/input/currency display; seller model remains distinct. | Pricing arithmetic and tax explanation; no benchmark comparison. |
| `<QuoteRequestRecord request: QuoteRequestProjection; assets: SafeAssetReferencePage; viewer: QuoteViewerProjection>` | `open|quoted|withdrawn|expired|declined|stale|failed`; buyer/seller/context/source versions. | Semantic input/requirement summary; protected values absent from wrong role. |
| `<QuoteComposer request: QuoteRequestProjection; current?: QuoteProjection; rightsOptions: RightsPostureDefinition[]>` | `editing|issuing|issued|superseded|expired|void|conflict|failed`; ordered price evaluation, exact scope/artifacts/requirements/revisions/rights/exit/anonymity/expiry. | Full document plus successor diff; material terms grouped. |
| `<QuoteRecord quote: QuoteProjection; prior?: QuoteProjection; delivery: QuoteDeliveryProjection>` | `issued|acceptance_pending|accepted|expired|superseded|void|failed`; complete frozen quote and diff supplement. Listing changes never rewrite. | Full semantic document always present; diff never replaces terms. |
| `<QuoteAcceptanceFlow quote: QuoteProjection; buyer: BuyerAuthorityProjection; selfDealing: SelfDealingProjection; payment: PaymentMethodProjection>` | `review|submitting|payment_pending|accepted|declined|unknown|expired|forbidden|failed`; separate unchecked acknowledgements, different buyer human and stable provider key. | Full quote before actions; each material acknowledgement separate; unknown provider state explicit. |
| `<EngagementRecord engagement: EngagementProjection; parties: EngagementPartyProjection; acceptedQuote: QuoteProjection>` | `requirements|active|delivery|exit_pending|completed|exited|deadlocked|degraded|failed`; single accepted quote/payee and immutable commercial baseline. | Record headings/timeline; actor/state/terms source text. |

### Requirements, Milestones and Delivery

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<RequirementsWorkbench engagement: EngagementProjection; gate: RequirementGateProjection; items: RequirementItemPage>` | `collecting|evaluating|passed|rejected|deadlocked|conflict|failed`; typed values/blob/project refs, mechanical observations only; third rejection no-fault/full return. | Ordered semantic items/status/actor; exact rejection/remediation; no verdict styling. |
| `<SLAClockRecord clock: SLAClockProjection; events: SLAEventPage; viewer: EngagementViewerProjection>` | `not_started|running|paused|met|breached|stopped|contested|stale|failed`; starts after gate, pauses only named buyer act, absolute due/version. | Absolute date/timezone and event attribution; contest route; no countdown-only meaning. |
| `<MilestoneWorkbench engagement: EngagementProjection; milestones: MilestonePage; artifacts: AuthorizedArtifactPage>` | `pending|active|delivered|accepted|revision_requested|blocked|failed`; sequential complete set/QC; acceptance releases tranche/credit only. | Semantic milestone timeline; artifact checklist; final-rights separation. |
| `<RevisionRoundWorkbench delivery: DeliveryProjection; round?: RevisionRoundProjection; allowance: RevisionAllowanceProjection>` | `open|frozen|redelivered|resolved|rejected|superseded|conflict|failed`; >=1 exact-artifact note, batch/freeze, resolution; empty/identical consumes nothing. | Linear notes and waveform/time alternatives; allowance/consequence text. |
| `<ChangeOrderFlow engagement: EngagementProjection; order?: ChangeOrderProjection; authority: ChangeOrderAuthorityProjection>` | `draft|issued|payment_pending|accepted|declined|expired|superseded|void|failed`; scope/price/payment/expiry/allowance mini-quote; pending never pauses final auto-accept. | Full change document/diff and acknowledgements; timer text. |
| `<FinalDeliveryFlow engagement: EngagementProjection; artifacts: AuthorizedArtifactPage; declarations: DeliveryDeclarationDefinition[]>` | `draft|qc_pending|deliverable|qc_failed|unverifiable|delivered|acceptance_pending|revision_requested|retracted|failed`; complete manifest/digests/declarations/readiness. | Manifest/checksum and QC measurement/consequence/warning/failure/unverifiable text. |
| `<DeliveryAcceptanceFlow delivery: FinalDeliveryProjection; timer: AcceptanceTimerProjection; buyer: BuyerAuthorityProjection>` | `pending|running|committed|compensating|rolled_back|human_review|revision_requested|failed`; timely revision through deadline+120s wins; no backdating. | Absolute deadline/timezone and grace announced; accept/revision equivalent; atomic-leg status separate. |
| `<RightsExecutionStatus execution: RightsExecutionProjection; elections: FrozenRightsElectionProjection; aggregate: RightsAggregateProjection>` | `pending|applied|failed|unknown|compensated|blocked`; exact frozen quote/artifact/current allocation, stable leg retry; no listing default. | Rights posture/allocation/source and atomic-saga consequence in plain language. |
| `<AbandonmentClock engagement: EngagementProjection; timer: AbandonmentTimerProjection; awaitedAct: AwaitedActProjection>` | `inactive|running|extended|satisfied|expired|cancelled|conflict|failed`; only named awaited act resets; one extension maximum; unrelated activity has no effect. | Absolute deadline/timezone, attributed awaited party/action and extension use announced; contest route keyboard complete. |
| `<EngagementExitFlow engagement: EngagementProjection; preflight?: ExitPreflightProjection; kinds: ExitKindDefinition[]>` | `editing|preflight|pending|applied|failed|unknown|conflict`; distinct cancel/abandon/release, consumed work/capacity/fault/kill/rights four-leg settlement. | Exit kinds/consequences/delta and provider evidence; no money claim without evidence. |
| `<RecallFlow engagement: TerminalEngagementProjection; recalls: RecallPage; policy: RecallPolicyProjection>` | `open|resolved|expired|cancelled|blocked|failed`; bounded count/window/support kind/evidence; never reopens acceptance/payment/rights. | Closure-preservation text; count/window absolute dates. |

### Supply, Repair and Inspection

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<SubstitutionFlow engagement: EngagementProjection; proposal?: SubstitutionProjection; workers: EligibleWorkerPage; firstWork: FirstWorkBoundary>` | `proposed|approved|refused|failed|superseded|effective|conflict`; buyer exact worker/scope approval before first work; race determines original/actual attribution. | Original/actual worker and boundary before decision; worker credit consequence. |
| `<ActualWorkerCreditStatus projection: WorkerCreditProjection>` | `pending|attributable|blocked|emitted|superseded`; effective work evidence only; agency/fixer commission never redirects credit. | Actual person/role/evidence/status textual; no agency-credit shortcut. |
| `<SupplyCompositionWorkbench composition: SupplyCompositionProjection; stages: SupplyStagePage; capabilities: SupplyCapability[]>` | `recorded_inactive|activation_blocked|disabled`; N+1 counterparties/stages/title/payout plan; v1 activation returns `COUNSEL_GATE_DISABLED`. | Full chain/plan summary and exact gate explanation; no activation/provider control. |
| `<RepairJobWorkbench job: RepairJobProjection; assessment?: RepairAssessmentProjection; authority: RepairAuthorityProjection>` | `awaiting_intake|in_custody|assessment_pending|estimate_pending|approved_work|declined|return_pending|returned|claim_open|failed`; estimate/payment before work. | Ordered status/checklist; service-fee-not-coverage limitation. |
| `<CustodyHandoffFlow job: RepairJobProjection; handoff?: CustodyHandoffProjection; conditionTemplate: ConditionTemplate>` | `editing|proposed|confirmed|rejected|expired|conflict|failed`; from/to/time/structured condition/media hashes and both confirmations; platform never custodian. | Structured checklist/media alternatives; exact mutual comparison; insurance limitation before declaration. |
| `<InspectionJobWorkbench job: InspectionJobProjection; template: InspectionTemplateProjection; report?: InspectionReportProjection>` | `assigned|in_progress|report_delivered|failed|cancelled|conflicted`; complete template/evidence/conflict confirmation; payment depends delivery not outcome. | Semantic template/results/evidence; independence and fee rule explicit. |
| `<DamageClaimFlow job: RepairJobProjection; handoffs: CustodyHandoffPage; claim?: DamageClaimProjection>` | `editing|open|uncontested|contested|withdrawn|case_linked|resolved|closed|failed`; exact condition/estimate/value evidence and Shard 06 route; no insurance promise. | Before/after condition comparison; evidence/case timeline; merits not decided by platform. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Listing/quote/request | Server immutable versions/hashes and provider acceptance state; safe directory filters only in URL. |
| Engagement/requirements/SLA | Server accepted quote baseline, typed gate and database-time attributed clock events. |
| Milestones/revisions/change orders | Server exact artifact/note/order versions; local safe draft only. |
| Delivery/acceptance/rights/exit | Server frozen manifest and stable atomic saga legs; events trigger refetch. |
| Substitution/supply | Server immutable first-work order and counsel capability snapshot. |
| Repair/inspection/custody | Server mutual condition/report/evidence versions; media purpose-bound. |

- Back/forward restores safe listing filters and engagement tab only if still authorized.
- Unsaved guards protect listing/quote, requirements, revision, delivery, exit and condition forms. They never obstruct custody rejection, recall cancellation or restrictive access change.
- Multi-tab conflicts preserve drafts and refetch exact quote/artifact/clock/first-work/custody versions. No acceptance/custody truth uses last-write-wins.
- Offline permits local bounded form/media-upload metadata only; acceptance, SLA, delivery publish, rights, payment and custody confirmation require current server truth.

## Interaction Flows

### Listing to Active Work

1. Seller publishes immutable-craft listing after taxonomy/pricing/SLA/capacity/rights gate; buyer inputs actual job facts without model normalization.
2. Seller issues complete expiring quote; reissue is immutable successor and full document remains primary.
3. Eligible different buyer human accepts exact quote/acknowledgements with reconciled single-payee payment authorization; one engagement commits.
4. Requirements pass atomically; three mechanical rejections produce no-fault deadlock/full return. SLA starts only after pass.
5. Milestones and revisions remain exact-artifact/round based; out-of-scope work requires accepted change order.

### Delivery, Acceptance and Exit

1. Seller publishes complete frozen final manifest, source/AI/human declarations, QC and payout readiness.
2. Buyer may revise/accept; timer accepts only after deadline plus 120-second race grace. Timely revision wins.
3. Acceptance atomically executes payment release, rights and credit; failed leg retries then compensates all successful legs or pages human.
4. Exit distinguishes cancel/abandon/release and produces evidence-bound settlement without unsupported payment claims.
5. Recall opens bounded support only and never reopens final commercial/right state.

### Supply and Custody

1. Identity substitution requires explicit buyer approval before first-work/delivery boundary; actual worker receives credit.
2. Fixer/bundle plan records all stages/counterparties/title/payout but v1 activation stops at B3 gate before provider effect.
3. Repair begins only after mutual intake custody/condition and approved estimate/payment authorization; return is mutually recorded.
4. Independent inspector delivers complete report and is paid for delivery regardless finding.
5. Damage claim compares mutual conditions/estimate/value and routes contest to Shard 06 without coverage/merits promise.

## Error-to-UI Matrix

| Code/family | UI state | Recovery |
|---|---|---|
| listing taxonomy/pricing/rights/SLA invalid | Publication blocked | Correct exact gate; primary craft change requires new listing. |
| quote context/version stale | Quote blocked/current | Reissue full successor and review diff; old issued quote remains unchanged. |
| self-dealing/material ack/guardian failure | Acceptance forbidden | Use eligible distinct buyer authority and complete acknowledgements. |
| payment authorization unknown | Acceptance pending/unknown | Reconcile stable provider key; never create duplicate engagement. |
| requirement incomplete/rejected | Collecting/rejected | Correct typed item; third rejection reaches no-fault deadlock. |
| SLA event cause/order invalid | Clock conflict | Refetch attributed event sequence and named awaited act. |
| milestone partial/QC failed | Delivery blocked | Complete exact artifact set or resolve mandatory technical QC. |
| revision empty/identical/race | No allowance consumed/conflict | Add meaningful exact-artifact notes or open current round. |
| change order stale/payment pending | Order blocked/pending | Reissue/reconcile; final acceptance clock continues. |
| QC unavailable/watermark failed | Unverifiable or streaming-only | Proceed visibly where fail-open; never expose unwatermarked download. |
| acceptance leg failed | Compensating/human review | Retry 2s/8s/32s then whole-saga rollback; no partial success. |
| exit race/source stale | Exit conflict | Refetch delivery/authority/preflight and retry exact kind. |
| substitution after first work/profile mismatch | Substitution blocked | Original worker remains; issue compliant proposal before boundary. |
| `COUNSEL_GATE_DISABLED` | Composition activation blocked | Keep inactive plan; no feature/admin/provider bypass. |
| custody unilateral/stale/incomplete | Handoff blocked | Both parties confirm exact current condition/media hash. |
| inspection conflict/incomplete | Report blocked | Reassign conflict-free inspector or complete template; finding irrelevant to fee. |
| damage claim contested | Case linked | Follow Shard 06 evidence workflow; no insurance/merits statement. |
| `VERSION_CONFLICT`, `ACTING_CONTEXT_STALE`, `IDEMPOTENCY_MISMATCH` | Protected conflict | Refetch/compare and retry identical command only; preserve safe draft. |

Errors include request ID but omit commercial terms, requirement values, revision notes, artifacts/declarations, provider tokens, condition media/reports and private economics.

## Conditional Rendering Matrix

| Feature | Seller | Buyer/approver | Contributor/worker | Fixer/agency | Inspector/custodian | Reviewer | Worker |
|---|---|---|---|---|---|---|---|
| Listing/quote | manage own listing/quote | browse/request/accept | scoped view only | coordinate under authority | relevant service listing only | case-scoped | gate/provider jobs |
| Requirements/work | review/perform/deliver | submit/accept/revise | assigned requirements/delivery | disclosed coordination | assigned custody/template | case evidence only | clock/QC/project |
| Acceptance/rights/exit | seller status, never self-accept | eligible accept/exit | own credit facts | no worker-credit substitution | relevant job status | dispute scope | atomic saga/settlement |
| Supply | propose substitution | approve exact worker | actual work/credit | inactive composition plan | hidden | case scope | no v1 multi-payee |
| Repair/inspection | service role | item owner/approver | assigned worker | hidden | condition/report actions | damage case scope | notify/project only |

Named variants: `sellerAuthorized`, `buyerEligibleDistinct`, `workerScopedActual`, `fixerDisclosedNoCredit`, `custodianAssigned`, `reviewerCaseScoped`, `workerExactNoUi`.

## Accessibility Inventory

| Interaction | Keyboard/focus and screen-reader contract | IA source |
|---|---|---|
| Listing/quote | Pricing arithmetic, tax, rights and exclusions in semantic summary before publish/accept | IA 14 § Accessibility |
| Quote successor | Diff supplements full document; material acknowledgements separate unchecked controls | IA 14 § Accessibility |
| Requirements/milestones/revisions | Ordered status/timers with absolute dates, actor and contest route | IA 14 § Accessibility |
| Media/QC | Linear keyboard notes; measurement/consequence/warning/failure/unverifiable distinct | IA 14 § Accessibility |
| Acceptance timer | Absolute deadline/timezone and 120-second grace announced | IA 14 § Accessibility |
| Custody/condition | Structured comparison and accessible media alternatives; insurance limitation before declaration | IA 14 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, media-note alternatives and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Listings/quotes | Engagement/delivery | Supply/custody |
|---|---|---|---|
| `<=768px` | Directory cards; grouped quote document/diff and acceptance steps | Requirements/milestones/rounds/timer linear | Plan/worker/condition/report one step at a time |
| `769-1024px` | List/detail with full quote before action | Engagement list/detail and status/action rail | Composition or repair list/detail |
| `>=1025px` | Directory and listing/quote workbench | Engagement workbench with timeline, artifacts and acceptance rail | Supply/repair/inspection workbench with evidence rail |

Every width retains acting authority, pricing shape, scope/exclusions, rights posture, absolute SLA/acceptance times, QC state, atomic saga, actual worker and custody limitation in text.

## Data Mapping

| BE response family | Components |
|---|---|
| listing/preflight/price evaluation/request/quote/payment/engagement | service directory/listing/composer/preflight/quote/acceptance/engagement components |
| requirements/SLA/milestones/revisions/change orders | requirements, clock, milestone, revision and change-order components |
| final delivery/acceptance/rights/exit/abandonment/recall | final delivery, acceptance, rights, exit and recall components |
| substitution/worker credit/supply composition | substitution, credit and composition components |
| repair/custody/assessment/inspection/damage claim | repair, custody, inspection and damage components |

No component consumes unrestricted economics, service credentials, payment tokens, other-party requirements/artifacts, condition media outside purpose or flattened worker/title/payout chains.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every state/role; full quote/diff; gate/deadlock; SLA attribution; revision allowance; acceptance grace/atomic legs; B3/custody limitations |
| Contract | all 14a-e successes/errors, ETags/idempotency/hashes, provider reconciliation, state registries, database timers, RLS/redaction and capability-before-effect |
| E2E | listing/quote/reissue/accept race, requirements/deadlock/SLA, milestone/revision/change, delivery/QC/accept race/rollback, exit/recall, substitution/B3 denial, repair/custody/inspection/claim |
| Accessibility | keyboard/AT pricing, full quote/diff, requirements/timers, media notes, QC, acceptance countdown, condition comparison and responsive views |
| Security | self-dealing, silent repricing, incomplete delta, creative QC, partial acceptance, agency credit, B3 bypass, custody/insurance/warranty/inspection-outcome inference denial |
| Performance | directory <=100KB initial JS, quote/engagement <=120KB, workbenches <=150KB, islands <=50KB unless approved; semantic virtualization |

## Deepening Record

1. **State synchronization**: listings, quotes, requirements, clocks, artifacts, acceptance, rights, supply and custody converge on exact versions/hashes.
2. **Network degradation**: provider unknown, QC unverifiable, watermark fail-closed, acceptance compensation, B3 disabled and custody conflicts remain explicit.
3. **Flow sequencing**: SRV-01..19 map to components while distinct authority, requirements, atomic acceptance, actual-worker and custody boundaries remain intact.
4. **Responsive/touch**: commercial documents, timers, media notes, evidence and condition comparisons retain keyboard/touch parity.
5. **State exhaustion**: every listing, request, quote, engagement, gate, clock, milestone, revision, order, delivery, acceptance, exit, substitution, repair and claim state renders.
6. **Role exhaustion**: all seven IA actors have explicit variants; seller/buyer self-dealing, fixer and worker boundaries are closed.
7. **Accessibility edge cases**: full-document review, separate acknowledgements, absolute timers, linear media notes, atomic status and custody limitation are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role, responsive and accessibility contracts.
- **Macro**: SRV-01..19 preserve model-specific pricing, immutable quotes, bounded requirements/revisions, atomic acceptance/rights/credit, actual-worker attribution, B3 gating and mutual custody evidence.
- **Two-implementer assertion**: independent implementers choose identical listing/quote, engagement/SLA, milestone/revision, delivery/acceptance/exit, substitution/composition and repair/inspection behavior.
- **Devil's advocate**: no UI can normalize price models, self-accept, silently reprice, consume empty revisions, backdate acceptance, claim partial saga success, credit agency over worker, bypass B3, make platform custodian/insurer or pay inspector by outcome.
- **Result**: PASS.

## Open Questions

None. Consumer launch supports single-payee services and physical service evidence. Multi-party composition may be recorded, but activation/release remains disabled until B3 counsel/payment approval.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete services marketplace lifecycle frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by

- [[specs/fe/00-infrastructure|Frontend Infrastructure]]
- [[specs/fe/01-identity-authority|Identity and Authority Frontend]]
- [[specs/fe/06-trust-safety|Trust, Safety and Evidence Frontend]]
- [[specs/fe/07-credits-core|Credits Core Frontend]]
- [[specs/fe/09-projects-collaboration|Projects and Collaboration Frontend]]
- [[specs/fe/10-rights-ownership|Rights and Ownership Frontend]]

### Derives from

- [[specs/ia/14-services-marketplace|Shard 14 Services Marketplace Lifecycle]]
- [[specs/ia/deep-dives/14-services-marketplace|Services Marketplace Deep Dive]]
- [[specs/be/14a-service-listings-quotes-engagements|Service Listings Quotes and Engagements]]
- [[specs/be/14b-requirements-sla-milestones-revisions|Requirements SLA Milestones and Revisions]]
- [[specs/be/14c-delivery-acceptance-exit-rights|Delivery Acceptance Exit and Rights]]
- [[specs/be/14d-substitution-multiparty-supply|Substitution and Multi-Party Supply]]
- [[specs/be/14e-repair-inspection-custody|Repair Inspection and Custody]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/14-services-marketplace|Deep Dive 14 — Services marketplace lifecycle]]

### References
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
- [[specs/be/14b-requirements-sla-milestones-revisions|Service requirements, SLA, milestones, revisions and change orders — Backend Specification]]
- [[specs/be/14c-delivery-acceptance-exit-rights|Final delivery, acceptance, exit settlement, recall and rights execution — Backend Specification]]
- [[specs/be/14d-substitution-multiparty-supply|Supplier substitution, fixers and multi-party service supply — Backend Specification]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection, custody and damage evidence — Backend Specification]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/deep-dives/14-services-marketplace|Deep Dive 14 — Services marketplace lifecycle]]
- [[specs/design-system|Design System]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/fe/06-trust-safety|Trust, Safety, Disputes and Evidence - Frontend Specification]]
- [[specs/fe/07-credits-core|Credit Graph, Capture and Confidence - Frontend Specification]]
- [[specs/fe/09-projects-collaboration|Music Projects and Collaboration - Frontend Specification]]
- [[specs/fe/10-rights-ownership|Rights and Ownership - Frontend Specification]]
