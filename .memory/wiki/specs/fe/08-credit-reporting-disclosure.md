# Credit Reporting, Exchange and Disclosure - Frontend Specification

> **BE Sources**: [[specs/be/08a-portability-ddex-emission|Portability and DDEX Emission]], [[specs/be/08b-union-session-reporting|Union Session Reporting]], [[specs/be/08c-gear-credit-linkage|Gear Credit Linkage]], [[specs/be/08d-ai-contribution-disclosure|AI Contribution Disclosure]]  
> **IA Source**: [[specs/ia/08-credit-reporting-disclosure|Shard 08 Credit Reporting, Exchange and Disclosure]]  
> **Status**: Complete

## Classification

- **Type**: Medium-complexity feature specification spanning four backend contracts, two consumer-launch surfaces and three later-activation capability families.
- **Surface**: Self-service own-credit exports, artifact receipts/downloads, structured contributor-authored AI disclosure and destination evaluation; gated DDEX RIN, union report and gear-discography workspaces.
- **Approval**: Recommended grouping, launch boundary and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 governs jobs, downloads, states and errors; FE 01 governs acting context; FE 05 governs capability/policy administration; FE 07 supplies authorized credit and contribution projections; Shard 23 must activate before gear linkage.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/08-credit-reporting-disclosure|Shard 08 IA]] | Delivery phases, CXR-01..14, contracts, access control, accessibility and edge cases |
| Backend | [[specs/be/08a-portability-ddex-emission|08a]] | portability preflight/generation/status, receipts/downloads, RIN gates, emissions and staleness |
| Backend | [[specs/be/08b-union-session-reporting|08b]] | inactive-domain concealment, source-labelled drafts, rendering, human certification and no-submission boundary |
| Backend | [[specs/be/08c-gear-credit-linkage|08c]] | Shard 23 gate, contribution-level links, public opt-in, ownership transfer and deny-first purge |
| Backend | [[specs/be/08d-ai-contribution-disclosure|08d]] | contributor-only disclosure, immutable successors, absence wording, vocabulary and destination-policy evaluation |
| Cross-cutting FE | [[specs/fe/00-infrastructure|FE 00]], [[specs/fe/01-identity-authority|FE 01]], [[specs/fe/05-platform-configuration-admin|FE 05]], [[specs/fe/07-credits-core|FE 07]] | shells, global states, authority, governed gates/policies and source projections |
| Design | [[specs/design-system|Design System]] | Guided Form, Record Detail, List-to-Detail Workbench and Admin Operations |

No Shard 08 IA deep-dive document exists; the primary IA and four complete BE contracts are authoritative.

## Source Map

| FE concern | Source |
|---|---|
| Own-credit preflight, generation, status, receipt and download | BE 08a § API/State Registry; IA CXR-01/CXR-05 |
| DDEX validation, generation, emission, stale review and re-emission | BE 08a § API/State Registry; IA CXR-02..04 |
| Union draft, render and human certification | BE 08b § API/State Registry; IA CXR-06..07 |
| Contribution gear links, item opt-in and transfer-safe projection | BE 08c § API/State Registry; IA CXR-08..10 |
| AI disclosure, amendment/retraction, projection and destination evaluation | BE 08d § API/State Registry; IA CXR-11..14 |
| Roles, accessibility, concealment and phase gates | IA 08 § Delivery Phases/Access Control/Accessibility/Edge Cases; FE 00/01/05 |

### Interaction Coverage Registry

| IA interaction | Frontend owner | Completion boundary |
|---|---|---|
| `CXR-01` Export own credit history | `PortabilityExportFlow`, `ExportPreflightSummary`, `OutputRequestStatus` | Immutable snapshot request reaches generated/failed without hidden-row leakage. |
| `CXR-02` Preflight RIN package | `RINPreflightWorkbench` | Exact profile/source validation returns grouped blocking, warning and lossy gaps. |
| `CXR-03` Generate RIN package | `LowTierOverrideReview`, `RINGenerationReview` | Exact snapshot, per-credit overrides and loss declaration are sealed. |
| `CXR-04` Review stale emission | `EmissionStatus` | Changed sources are explicit and successor generation never claims external supersession. |
| `CXR-05` Generate portability receipt | `ArtifactReceipt`, `ArtifactDownloadControl` | Receipt persists with scope, omissions, degradation, checksums and generated time. |
| `CXR-06` Prepare union session report | `UnionReportWorkbench` | Later-only source-labelled draft remains blocked until profile/counsel gates activate. |
| `CXR-07` Certify union report | `UnionCertificationFlow` | Eligible human signs exact artifact; no submit action or status exists. |
| `CXR-08` Link gear to contribution | `GearCreditLinkEditor` | Later-only contribution-level item/chain link records author and source. |
| `CXR-09` Publish gear discography line | `GearDiscographySetting`, `GearDiscographyProjection` | Current owner opt-in projects only currently public source credits. |
| `CXR-10` Transfer registered gear | `GearDiscographyProjection` | Item history follows item while private prior-owner context remains absent. |
| `CXR-11` Add AI involvement entry | `AIDisclosureEditor`, `AIDisclosureEntryEditor` | Canonical contributor creates immutable structured own-contribution disclosure. |
| `CXR-12` Amend/retract AI disclosure | `AIDisclosureSuccessorFlow`, `AIDisclosureHistory` | Reasoned successor becomes active and affected outputs become stale. |
| `CXR-13` Evaluate destination requirement | `DestinationDisclosureEvaluation` | Version-pinned policy returns pass/block/warning without altering credit truth. |
| `CXR-14` View disclosure | `AIDisclosureProjection` | Authorized factual projection or exact `not_disclosed`; provenance remains separate. |

## Delivery Phase Gates

| Capability | Consumer-launch presentation | Activation condition | Disabled behavior |
|---|---|---|---|
| Own-credit portability | Enabled, self-service and never support-gated | Authenticated credited party with current authority | Typed forbidden/conflict/failure; no hidden-row inference |
| Structured AI disclosure | Enabled for a contributor's own contribution and export policy checks | Current contributor authority and active vocabulary | Read projection may say `not disclosed`; never “human” or detected |
| DDEX RIN | No launch navigation or action | Identifier, taxonomy, recipient adapter and profile gates all active | Capability explanation only where actor is entitled; API returns `CAPABILITY_DISABLED` before lookup |
| Union reporting | No launch route or session action | Approved US form profile, counsel/institution gate and eligible signer workflow | No draft/certify/submit affordance; automated submission has no endpoint at any phase |
| Gear-credit linkage | No launch route, prompt or contribution action | Shard 23 item identity plus gear-link capability active | No session-close prompt and no item/credit existence leak |

The router, server-rendered navigation and action menus consume the same governed capability snapshot. A stale client gate never exposes a disabled route; server denial is canonical.

## Design Requirements

**Direction**: A working reporting record: exact scope, source versions, gaps, receipts and factual disclosure without compliance theatre.  
**Typography**: Source Sans 3 for instructions and records; IBM Plex Mono for profile versions, source hashes, checksums, artifact IDs and policy versions.  
**Colors**: Paper/Surface/Graphite; Jam Magenta only for the current primary action. Blocking, warning, lossy, stale and not-disclosed states use text and structure, never color alone.  
**Motion**: bounded 150-220ms feedback; job progress is textual and reduced-motion safe.  
**Anti-patterns**: no export paywall, share-default embargoed artifact, AI badge/detector/threshold, provenance promotion, bulk low-tier override, inferred union membership, “submitted” without evidence, gear prompt during capture or public hidden-row omission clues.

## Design System Compliance

- **Archetypes**: Guided Form for portability/disclosure; Record Detail for artifact/disclosure history; List-to-Detail Workbench for stale output and later reporting workspaces; Admin Operations for destination policy/profile management.
- **Global components consumed**: `<PageShell>`, `<ActingContextSwitcher>`, `<RecordHeader>`, `<Workbench>`, `<StateLabel>`, `<GapList>`, `<DataTable>`, `<Timeline>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<DownloadControl>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every data view implements FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Canonical artifacts, emissions, certifications, links and disclosures never use optimistic success.
- **Timing**: reads fail visibly at 8 seconds; protected commands at 15 seconds. Status views honor `Retry-After`, preserve scope and expose actor-safe retry.
- **Empty/error language**: an authorized complete empty export scope is distinct from a failed projection. Hidden credits, disabled domains, missing profiles and unavailable dependencies never become a zero count.

## Page and Route Definitions

| Route | Phase/guard/archetype | Primary components | Navigation behavior |
|---|---|---|---|
| `/app/credits/exports` | Launch; authenticated credited party; List-to-Detail | `CreditExportList`, `PortabilityExportFlow` | Current party explicit; safe state/filter in URL; no other-party hidden count. |
| `/app/credits/exports/{requestId}` | Launch; request owner/purpose grant; Record Detail | `OutputRequestStatus`, `ArtifactReceipt`, `ArtifactDownloadControl` | Polls with `Retry-After`; stale/current state server canonical. |
| `/app/contributions/{contributionId}/ai-disclosure` | Launch; authorized viewer, contributor-only edit; Record Detail | `AIDisclosureProjection`, `AIDisclosureEditor`, `AIDisclosureHistory` | Concealment-safe absence; contribution owner sees create/supersede actions only. |
| `/app/disclosure-checks/new` | Launch where an export/release flow requires it; Guided Form | `DestinationDisclosureEvaluation` | Exact source/disclosure/policy versions pinned; return target is allowlisted. |
| `/app/reporting/rin` | Later; authorized exporter plus all DDEX gates; Workbench | `RINPreflightWorkbench`, `RINGenerationReview`, `EmissionStatus` | Route omitted until active; stale emissions link to explicit re-emission flow. |
| `/app/reporting/union/{sessionId}` | Later; approved profile/counsel gate and session authority; Workbench | `UnionReportWorkbench`, `UnionCertificationFlow` | Route omitted while inactive; no submission route exists. |
| `/app/contributions/{contributionId}/gear` | Later; Shard 23 and link capability; Record Detail | `GearCreditLinkEditor` | Added only after contribution exists; never linked from session close. |
| `/gear/{itemId}/discography` | Later; public eligible projection/current owner; Record Detail | `GearDiscographyProjection`, `GearDiscographySetting` | Public concealment-safe 404; owner setting does not grant source access. |
| `/admin/reporting/disclosure-policies` | Launch if reporting-admin capability; Admin Operations | `DisclosurePolicyWorkbench` | Reviewed version workflow; admins cannot edit disclosures or credits. |

## Component Inventory

Every component inherits FE 00 request IDs, timing, focus restoration, safe errors and no-store rules. Local state may preserve drafts and filters; generated truth always waits for canonical confirmation.

### Portability and DDEX Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<CreditExportList page: OutputRequestPage; query: OutputRequestQuery; capabilities: ReportingCapability[]>` | `loading|empty|success|degraded|failed`; lists own requests/artifacts with kind, state, freshness, profile and generated time. Failure never renders zero. | Semantic list/table alternatives; status text; cursor/filter keyboard complete; 200/400% reflow. |
| `<PortabilityExportFlow scope: AuthorizedCreditScope; formats: PortabilityFormatDefinition[]; defaults: ExportPreference>` | `idle|editing|preflighting|blocked|ready|submitting|success|source_stale|failed`; formats `json|csv|pdf`; includes every own visible credit/state and pins preflight hash. | Persistent labels/error summary; scope/format review before submit; blocker links and focus first issue. |
| `<ExportPreflightSummary response: PortabilityPreflightResponse; selectedFormat: PortabilityFormat>` | Shows authorized count, estimate, source hash and safe gaps only. `ready|warning|blocked|stale`; hidden records never produce gaps/count deltas. | Blocking/warning/lossy semantic sections with counts/headings; no color-only severity. |
| `<OutputRequestStatus request: OutputStatusResponse; polling: PollingPolicy>` | `validating|blocked|generating|generated|failed|stale|superseded`; honors retry interval and safe failure. Mixed/unsealed artifacts never appear downloadable. | Polite progress announcements; no rapidly updating progressbar; retry preserves selected scope. |
| `<ArtifactReceipt receipt: ArtifactReceiptResponse; freshness: ArtifactFreshness>` | `loading|success|expired_blob|stale|degraded|failed`; renders format/profile/scope, safe omissions, degradation/loss, checksums, manifest and generated time. | Definition list; checksums copyable with full accessible label; stale declaration precedes download. |
| `<ArtifactDownloadControl artifact: SafeArtifactReference; permission: DownloadPermission; staleState: ArtifactFreshness>` | `idle|requesting|ready|stale_confirmation|expired|forbidden|failed`; actor-bound URL, size, checksum and expiry. Own embargoed exports are private/non-share-default. | Format/size/checksum/expiry announced; explicit stale confirmation; persistent retry and focus restoration. |
| `<RINPreflightWorkbench scope: AuthorizedCreditScope; profiles: RINProfilePage; recipient?: RecipientProfile>` | Later-only `disabled|editing|validating|blocked|ready|source_stale|profile_unavailable|failed`; groups identifier/role/confidentiality blockers, warnings and declared loss. | Capability state before controls; semantic gap sections and direct remediation; linear mobile review. |
| `<LowTierOverrideReview gaps: RINGap[]; selected: CreditOverride[]; sourceHash: string>` | `idle|editing|ready|stale|failed`; explicit per-credit override/reason only, no select-all. Hidden/confidential rows never enter props. | One labelled confirmation per eligible credit; warning repeated in review; keyboard complete. |
| `<RINGenerationReview preflight: RINPreflightResponse; overrides: CreditOverride[]; manifest: SourceManifest>` | `review|submitting|generating|generated|blocked|stale|failed`; seals exact snapshot/profile/loss declarations. No source mutation. | Linear exact-snapshot summary; generation state announced; primary action unavailable until all explicit confirmations. |
| `<EmissionStatus emission: EmissionStatusResponse; artifact: SafeArtifactReference; capability: DeliveryCapability>` | `pending|attempting|accepted|rejected|unknown|stale|superseded|failed`; generated/emitted never implies acceptance; re-emission creates successor. | Evidence/state/time textual; unknown distinct from failed/success; stale changes summarized before re-emission. |

### Union and Gear Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<UnionReportWorkbench session: ReportingSessionProjection; profiles: UnionProfilePage; report?: UnionReportResponse; capability: UnionCapability>` | Later-only `disabled|draft|incomplete|ready_to_render|rendering|rendered|stale|superseded|failed`; every derived field source-labelled; membership/rates/jurisdiction require human entry. | Semantic field groups and source labels; missing declarations focusable; mobile linear review; no inferred value styling. |
| `<UnionCertificationFlow report: UnionReportResponse; render: UnionRenderResponse; signer: SignerEligibility>` | `blocked|review|step_up_required|submitting|certified|rejected|expired|stale|failed`; signs exact checksum/source/profile, unchecked consequence acceptance and human attestations. Never submits externally. | Consequence text before unchecked confirmation; exact signer authority/date; keyboard/AT complete and focus result heading. |
| `<GearCreditLinkEditor contribution: ContributionProjection; registeredItems: SafeGearItemPage; links: GearCreditLinkPage; capability: GearLinkCapability>` | Later-only `disabled|loading|empty|editing|submitting|active|revoked|conflict|failed`; one contribution to registered item/chain version, author/source method required. | Contribution and item identity repeated; no session-level option; keyboard searchable picker and revocation confirmation. |
| `<GearDiscographySetting item: GearItemProjection; setting: GearDiscographySettingResponse; etag: ETag>` | `private|public|optimistic_pending|optimistic_rollback|purging|building|disabled|conflict|failed`; current owner opt-in only and no private credit access. | Consequences before action; current projection state textual; opt-out result/purge announced. |
| `<GearDiscographyProjection item: PublicGearItemProjection; page: GearDiscographyPage; freshness: ProjectionFreshness>` | `loading|empty|success|purging|blocked|degraded|failed|absent`; only source-public links; transfer retains item history without prior-owner context. | Semantic list/table; credit role/date/source visibility in text; hidden rows absent from DOM/count/cursor. |

### AI Disclosure and Policy Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<AIDisclosureProjection contribution: ContributionProjection; disclosure: AIDisclosureProjectionResponse; viewer: DisclosureViewerProjection>` | `loading|not_disclosed|success|stale|degraded|failed|absent`; factual active entries/source/version only. Absence says “Not disclosed,” never “human” or “AI-free.” | Definition list; provenance visually/semantically separate; hidden contribution absent from DOM and AT tree. |
| `<AIDisclosureEditor contribution: OwnContributionProjection; vocabulary: AIDisclosureVocabularyResponse; active?: AIDisclosureVersionResponse>` | `editing|submitting|success|active_exists|contribution_changed|validation_error|failed`; 0..25 structured entries, contributor-only, no detector/threshold/binary label. | Persistent labels/help/errors; add/remove entry controls announced; complete review summary before canonical submit. |
| `<AIDisclosureEntryEditor entry?: AIDisclosureEntryV1; kinds: AIInvolvementKindDefinition[]; index: number>` | Validates kind, bounded contribution-local scope, tool/version, optional model/own-model and plain note; markup/links rejected. Note excluded from policy. | Fieldset/legend per entry; conditional modelling control announced; errors tied to exact entry/field. |
| `<AIDisclosureHistory versions: AIDisclosureVersionPage; activeId?: string>` | `loading|empty|success|degraded|failed`; immutable active/superseded/retracted versions and reasons. Amendment/retraction requires successor review. | Ordered timeline with version/state/reason/date; no destructive edit; current version heading announced. |
| `<AIDisclosureSuccessorFlow current: AIDisclosureVersionResponse; vocabulary: AIDisclosureVocabularyResponse; affectedOutputs: SafeOutputSummary>` | `editing|review|submitting|success|version_conflict|already_superseded|failed`; replacement or retract with reason; warns outputs become stale. | Current/proposed linear diff; consequence before submit; focus first conflict or success heading. |
| `<DestinationDisclosureEvaluation source: DisclosureEvaluationSource; policies: DestinationPolicyPage; existing?: DisclosurePolicyEvaluationResponse>` | `idle|editing|submitting|pass|block|warning|source_stale|policy_unavailable|failed`; exact structured fields/version only; note ignored; core credit/export remains valid. | Policy/version and gaps semantic; missing data never presented as human origin; remediation links keyboard complete. |
| `<DisclosurePolicyWorkbench policies: DestinationPolicyPage; reviewer: PolicyReviewerCapability>` | `loading|empty|success|editing|review_required|active|retired|conflict|failed`; reviewed version/evidence/effective interval; cannot edit disclosure/credit. | Admin workbench/table-list parity; version diff and approval separation explicit; 200/400% reflow. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Export request/artifact/receipt/emission | Server immutable versions, source hashes, checksums and evidence; URL stores safe filter/selection only. |
| Portability/disclosure draft | Local bounded form draft tied to acting person/context and source version; never final truth and cleared on successful canonical response. |
| AI disclosure/vocabulary/policy evaluation | Server immutable disclosure and policy versions; active projection refetched after change. |
| Union report/profile/render/certification | Server exact profile/source/report versions; route exists only after capability activation. |
| Gear link/setting/projection | Server link and item/credit visibility versions; restrictive changes deny before asynchronous purge. |
| Capability navigation | Server-rendered governed snapshot; denied server response overrides cached/client state. |

- Browser back/forward restores only safe export filters, selected request, disclosure section and policy destination. Artifact URLs, hidden counts and report declarations never enter URL state.
- Unsaved-change guards protect portability scope, disclosure entries, later union declarations and gear links. They do not obstruct restrictive gear opt-out or disclosure retraction confirmation once canonical submission begins.
- Multi-tab conflicts preserve the local form, fetch current source/version and present a semantic diff. No output/disclosure truth uses last-write-wins.
- Offline mode permits reading explicitly cached safe metadata only. Artifact generation, disclosure mutation, certification, linkage and policy evaluation remain blocked until current authority/source can be verified.

## Interaction Flows

### Portability, DDEX and Staleness

1. Credited party selects own authorized scope and `json|csv|pdf`; preflight computes post-authorization count, size, safe gaps and exact source hash.
2. Review confirms format/scope/private delivery. Generation returns a request; status polling reaches blocked/generated/failed without exposing hidden rows.
3. Generated artifact exposes persistent receipt metadata and creates a short-lived actor-bound download. Own embargoed content is private and non-share-default.
4. Later RIN preflight pins DDEX/profile/recipient versions, blocks unresolved identity/role/confidentiality and declares loss; low-tier inclusion requires per-credit confirmation.
5. Emission records attempted evidence separately from acceptance. Material source/disclosure change marks the artifact stale; re-emission creates an immutable linked successor.

### Union and Gear Activation

1. Union and gear routes/actions are absent at consumer launch and while their independent gates are inactive; denial occurs before source lookup.
2. Activated union preflight maps only approved facts and labels every source; users enter/confirm membership, classification, jurisdiction, rates and declarations.
3. Human signer reviews exact render/checksum/consequences and certifies; UI can offer private download but never a submission action/status.
4. Activated gear flow starts from an existing contribution, selects one registered item/chain version and records source/author. Session close never prompts for gear.
5. Current item owner separately opts into public discography. Credit restriction or item opt-out denies immediately and purges; ownership transfer never transfers private session access.

### AI Disclosure and Destination Policy

1. Authorized viewer receives either factual structured entries or exact `not_disclosed`; source-credit visibility applies before either result.
2. Canonical contributor selects vocabulary V1 kind/scope/tool/model fields for their own contribution. No question asks whether content is “AI” or applies a threshold.
3. Amendment/retraction creates a reasoned immutable successor and marks matching outputs stale; historical versions remain visible to authorized viewers.
4. Destination evaluation pins named policy, disclosure and source versions, evaluates structured fields only and returns pass/block/warning gaps.
5. A blocked destination does not invalidate the credit, alter provenance or disable self-service portability.

## Error-to-UI Matrix

| Code | UI state | Recovery |
|---|---|---|
| `FORMAT_OR_SCOPE_INVALID`, generic `VALIDATION_FAILED` | Export/disclosure validation | Focus exact field; preserve safe draft and current source context. |
| `SOURCE_STALE`, `PREFLIGHT_STALE` | Stale review | Refetch source/preflight; compare scope/versions before resubmit. |
| `ARTIFACT_NOT_READY` | Status pending | Honor `Retry-After`; retain request and retry status. |
| `STALE_CONFIRMATION_REQUIRED`, `ARTIFACT_STALE` | Stale artifact warning | Review changed-source summary; confirm download or generate successor where allowed. |
| `ARTIFACT_EXPIRED` | Receipt available/blob expired | Keep receipt/audit; create a permitted replacement artifact, not a false live link. |
| `CAPABILITY_DISABLED`, `ADAPTER_DISABLED` | Gated/disabled | Remove action/navigation; show actor-safe activation prerequisite only when entitled. |
| `PROFILE_UNAVAILABLE`, `POLICY_UNAVAILABLE` | Profile/policy blocked | Select approved current version or wait for governed activation; no admin bypass. |
| `RECIPIENT_REQUIREMENT_UNMET` | Gap list blocked/warning | Remediate named structured gap; preserve canonical credit/disclosure. |
| `DELIVERY_ALREADY_PENDING`, `RECIPIENT_STATE_UNKNOWN` | Emission pending/unknown | Open current attempt/evidence; reconcile or explicitly re-emit without acceptance claim. |
| `SIGNER_INELIGIBLE`, `STEP_UP_REQUIRED` | Certification blocked | Refresh signer authority or complete step-up; never delegate to worker/admin. |
| `REPORT_INCOMPLETE`, `DECLARATION_INCOMPLETE` | Union gaps | Complete human declarations/review; derived values remain source-labelled. |
| `LINK_AUTHORITY_FORBIDDEN`, `SESSION_LEVEL_LINK_FORBIDDEN` | Gear action forbidden | Use contribution-level link with current author/mandate; no session workaround. |
| `OWNERSHIP_OR_VERSION_CHANGED`, `CREDIT_EVENT_STALE` | Gear conflict/private | Refetch item/credit versions; fail private and preserve proposed link/setting. |
| `CONTRIBUTOR_ONLY` | Disclosure forbidden | Canonical contributor must author; producer/admin cannot attest for them. |
| `ACTIVE_DISCLOSURE_EXISTS`, `ALREADY_SUPERSEDED` | Current disclosure conflict | Open active/successor version and create a new successor if still authorized. |
| `ENTRY_OR_VOCABULARY_INVALID` | Disclosure validation | Use active vocabulary and bounded plain structured fields; retain safe draft. |
| `VERSION_CONFLICT`, `ACTING_CONTEXT_STALE`, `IDEMPOTENCY_MISMATCH` | Protected conflict | Refetch authority/version and compare; never silently replay a changed command. |

Persistent errors include request ID. Credit titles/parties, hidden counts, union identifiers/rates/declarations, AI entry text/tool/model/note, private item/session context, artifact content and signed URLs never enter URL, toast, log or telemetry.

## Conditional Rendering Matrix

| Feature | Public/viewer | Credited contributor | Producer/session owner | Operator/room | Item owner | Export/recipient adapter | Reporting admin | Worker |
|---|---|---|---|---|---|---|---|---|
| Portability/receipt | no other-party export | own complete export including actual embargoed state | managed scope only with authority | hidden | hidden | sealed scoped artifact only | safe failure/profile only | validate/generate/purge only |
| DDEX RIN | hidden | authorized scope after gate | authorized managed scope after gate | hidden | hidden | exact package/evidence only | profile/policy administration | generate/deliver/reconcile only |
| Union report | hidden | signer/party view after gate | draft/edit after gate | approved room facts only | hidden | no submission adapter in scope | profile administration only | map/render, never certify |
| Gear linkage | public eligible item projection after gate | own contribution links | links within current mandate | registered room item fact only | public opt-in/history, no private credit | hidden | safe failure only | transfer/visibility reconcile |
| AI disclosure | authorized factual projection | author own entry/successor and view | view if source-authorized, never author for another | view only if source-authorized | hidden unless independently authorized | exact policy evaluation scope | policy versions, no entry edit | stale/evaluate projection only |

Named variants: `publicEligible`, `creditedOwn`, `producerMandated`, `operatorFactsOnly`, `itemOwnerPublicOnly`, `adapterSealedScope`, `reportingAdminPolicyOnly`, `workerExactNoUi`.

## Accessibility Inventory

| Interaction | Keyboard/focus and screen-reader contract | IA source |
|---|---|---|
| Export/RIN/union preflight gaps | Semantic blocking/warning/lossy headings, counts and direct remediation; focus first blocking item | IA 08 § Accessibility |
| Artifact generation/stale/retry | Polite status without color; retry preserves scope; stale changes textual | IA 08 § Accessibility |
| Tables/manifests | Keyboard sort/filter plus linear alternative; readable at 200% and 400% reflow | IA 08 § Accessibility |
| AI disclosure wording | “Not disclosed” exact wording; provenance separately labelled; no human-origin implication | IA 08 § Accessibility |
| Gear opt-in/union certification | Consequence before explicit unchecked confirmation; screen-reader-labelled action | IA 08 § Accessibility |
| Download controls | Format, size, checksum availability and expiry in accessible name/description; persistent retry | IA 08 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, job-status announcements and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Export/artifact | Disclosure/policy | Later reporting workspaces |
|---|---|---|---|
| `<=768px` | One guided step, semantic gap cards, manifest definition list and full-width download action | Entry fieldsets stacked; history/evaluation linear; policy review one record at a time | Source fields, gaps, declarations and confirmations linear; no dense grid dependency |
| `769-1024px` | Scope/form beside summary where reflow remains readable; artifact metadata two-column | List/detail with current entry/version summary before actions | List/detail report or linkage workbench with sticky textual state |
| `>=1025px` | Export list/detail and receipt/status rail | Disclosure record/history rail; policy list/detail/action rail | Workbench with source facts, editable declarations/gaps and exact action rail |

Every width retains kind, state, profile/vocabulary/policy version, source freshness, gap severity, checksum availability and acceptance evidence in text. Touch, pointer and keyboard provide equivalent review and confirmation.

## Data Mapping

| BE response | Components |
|---|---|
| `PortabilityPreflightResponse`, `OutputRequestResponse`, `OutputStatusResponse` | `PortabilityExportFlow`, `ExportPreflightSummary`, `CreditExportList`, `OutputRequestStatus` |
| `ArtifactReceiptResponse`, `ArtifactDownloadResponse` | `ArtifactReceipt`, `ArtifactDownloadControl` |
| `RINPreflightResponse`, `EmissionStatusResponse` | `RINPreflightWorkbench`, `LowTierOverrideReview`, `RINGenerationReview`, `EmissionStatus` |
| `UnionProfilePage`, `UnionReportResponse`, `UnionRenderResponse`, `UnionCertificationResponse` | `UnionReportWorkbench`, `UnionCertificationFlow` |
| `GearCreditLinkPage/Response`, `GearDiscographySettingResponse`, `GearDiscographyPage` | gear linkage components |
| `AIDisclosureProjectionResponse`, `AIDisclosureVocabularyResponse`, `AIDisclosureVersionResponse` | disclosure projection/editor/entry/history/successor components |
| `DisclosurePolicyEvaluationResponse`, `DestinationPolicyPage/VersionResponse` | `DestinationDisclosureEvaluation`, `DisclosurePolicyWorkbench` |

No component consumes unrestricted credit tables, hidden omission rows/counts, union sensitive content, AI note text for policy, private prior-owner context, artifact bytes before actor-bound download, delivery credentials or external acceptance without evidence.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every named state/role; gap severity semantics; exact `not_disclosed`; stale confirmation; checksum/expiry labels; gated route/action absence; source-labelled union fields |
| Contract | all 08a-d success/errors, ETags/idempotency/source hashes, state registries, `Retry-After`, no-store/redaction, capability-before-lookup and immutable successors |
| E2E | own export including embargoed state, source change during generation, receipt/download expiry, gated RIN, per-credit override, unknown/rejected emission, union no-submission, gear transfer/purge, AI create/amend/retract and destination block |
| Accessibility | keyboard/AT preflight, gaps, status, receipt, download, disclosure fieldsets/history, policy result and activated union/gear flows |
| Security | other-party non-inference, hidden gap/count leak, share-default embargo denial, AI authorship/detection/provenance denial, inferred union status denial, prior-owner access denial and false acceptance denial |
| Performance | export/disclosure launch routes <=100KB initial JS, admin/later workbenches <=120KB, islands <=50KB unless approved; polling/cursors preserve semantics |

## Deepening Record

1. **State synchronization**: requests, artifacts, emissions, disclosures, policies, reports, links and projections converge on exact server source/version/hash state.
2. **Network degradation**: polling retry, stale source, expired blobs, unknown adapter evidence, deny-first gear purge and policy dependency failure remain explicit.
3. **Flow sequencing**: CXR-01..14 map to routes/components while launch gates prevent premature DDEX, union and gear interaction.
4. **Responsive/touch**: gaps, manifests, structured entries, timelines and confirmations retain complete keyboard/touch behavior at all breakpoints.
5. **State exhaustion**: every request/artifact/emission/report/render/certification/link/projection/disclosure/policy state has explicit presentation.
6. **Role exhaustion**: all eight IA actor classes have explicit cells and named variants; workers and adapters receive no broad interactive UI.
7. **Accessibility edge cases**: severity grouping, no hidden AT trace, exact absence wording, consequence confirmation and download metadata are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role variant, responsive behavior and accessibility contract.
- **Macro**: CXR-01..14 preserve complete own portability, immutable/versioned output, evidence-bound delivery, contributor-authored disclosure, human union certification and visibility-inherited gear projection.
- **Two-implementer assertion**: independent implementers choose identical launch gates, export scope, artifact/receipt lifecycle, stale/re-emission behavior, AI absence/authorship, union no-submission and gear transfer/privacy rules.
- **Devil's advocate**: no UI can paywall export, leak hidden records through gaps/counts, call output accepted without evidence, infer union/AI status, treat non-disclosure as human origin, promote provenance, bulk-override low-tier credits, transfer private context with gear or surface deferred actions early.
- **Result**: PASS.

## Open Questions

None. Consumer launch enables complete own-credit portability and structured AI disclosure. DDEX RIN, union reporting and gear linkage remain specified but unavailable until their named gates activate.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete credit reporting, exchange and disclosure frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by

- [[specs/fe/00-infrastructure|Frontend Infrastructure]]
- [[specs/fe/01-identity-authority|Identity and Authority Frontend]]
- [[specs/fe/05-platform-configuration-admin|Platform Configuration and Admin Frontend]]
- [[specs/fe/07-credits-core|Credit Graph, Capture and Confidence Frontend]]

### Derives from

- [[specs/ia/08-credit-reporting-disclosure|Shard 08 Credit Reporting, Exchange and Disclosure]]
- [[specs/be/08a-portability-ddex-emission|Portability and DDEX Emission]]
- [[specs/be/08b-union-session-reporting|Union Session Reporting]]
- [[specs/be/08c-gear-credit-linkage|Gear Credit Linkage]]
- [[specs/be/08d-ai-contribution-disclosure|AI Contribution Disclosure]]

### References

- [[specs/ia/23-gear-provenance-registry|Shard 23 Gear Provenance and Registry]]
- [[specs/design-system|Design System]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]

### References
- [[specs/be/08a-portability-ddex-emission|Credit portability and DDEX RIN emission — Backend Specification]]
- [[specs/be/08b-union-session-reporting|Union and performer session reporting — Backend Specification]]
- [[specs/be/08c-gear-credit-linkage|Gear-to-credit linkage and item discography — Backend Specification]]
- [[specs/be/08d-ai-contribution-disclosure|AI contribution disclosure and destination policy — Backend Specification]]
- [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/fe/05-platform-configuration-admin|Platform Configuration, Admin and Quality - Frontend Specification]]
- [[specs/fe/07-credits-core|Credit Graph, Capture and Confidence - Frontend Specification]]
- [[specs/design-system|Design System]]
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
