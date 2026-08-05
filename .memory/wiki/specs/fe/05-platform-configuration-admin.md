# Platform Configuration, Admin and Quality - Frontend Specification

> **BE Sources**: [[specs/be/05a-settings-flags-runtime|Settings Flags and Runtime]], [[specs/be/05b-admin-workspace-operations|Admin Workspace and Operations]], [[specs/be/05c-portability-quality-lifecycle|Portability Quality and Lifecycle]]  
> **IA Source**: [[specs/ia/05-platform-configuration-admin|Shard 05 Platform Configuration, Admin and Quality]]  
> **Status**: Complete

## Classification

- **Type**: Feature specification spanning three backend contracts that form the governed configuration and administrative control plane.
- **Surface**: Settings/flags/experiments/kill-switch registries; task/search/bulk/grant/diagnostic workbenches; import/export/restore/quality/lifecycle operations.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: FE 00 governs global states/jobs/uploads/offline; FE 01 governs acting context/capability/step-up; FE 03-04 govern CMS publication and delivery evidence.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/05-platform-configuration-admin|Shard 05 IA]] | Interactions CFG-01..14, Contracts, Access Control, Accessibility, Edge Cases |
| IA deep dive | [[specs/ia/deep-dives/05-platform-configuration-admin|Platform Configuration Deep Dive]] | resolution, risk, runtime snapshots, exact bulk manifests, diagnostics, portability and lifecycle |
| Backend | [[specs/be/05a-settings-flags-runtime|05a]] | settings, flags, experiments, kill switches and runtime snapshots |
| Backend | [[specs/be/05b-admin-workspace-operations|05b]] | tasks, search, bulk operations, capability grants, audit and diagnostics |
| Backend | [[specs/be/05c-portability-quality-lifecycle|05c]] | import/export, restore verification, quality checks and lifecycle requests |
| Cross-cutting FE | [[specs/fe/00-infrastructure|FE 00]] | shell, state, error, jobs, upload, offline, confirmation and breakpoints |
| Design | [[specs/design-system|Design System]] | Settings/Registry, List-to-Detail Workbench, Guided Form, Record Detail and Admin Operations |

## Source Map

| FE section | Source |
|---|---|
| Setting definitions/resolution/changes | BE 05a § Definition/API/Resolution; IA CFG-01..04 |
| Flags/experiments/kill switches | BE 05a § API/State Algorithms; IA CFG-05..07 |
| Tasks/search/bulk/grants/audit/diagnostics | BE 05b § API/State Registry; IA CFG-08..12 |
| Import/export/restore/quality/lifecycle | BE 05c § API/State Registry; IA CFG-13..14 |
| Role rendering/accessibility | IA 05 § Access Control/Accessibility; FE 00 |

## Design Requirements

**Direction**: An evidence-first operations console. Every screen exposes object, scope, source, version, freshness, risk, impact and legitimate next transition.  
**Typography**: Source Sans 3 for controls; IBM Plex Mono for keys, scopes, hashes, versions, cursors, checker IDs and request IDs.  
**Colors**: restrained Paper/Surface/Graphite; Jam Magenta for current selection or one primary action, never health, authority or approval.  
**Motion**: 150-220ms bounded feedback; no “mission control” theatrics, animated counters or emergency flashing. Reduced motion removes nonessential transitions.  
**Anti-patterns**: no universal admin, arbitrary keys/commands/SQL, settings as secrets or authority, flags as business rules, protected-trait experiments, silent bulk expansion, diagnostic-as-truth, backup-without-restore proof or erasure that ignores holds/shared evidence.

## Design System Compliance

- **Archetypes**: Settings/Registry for definitions/flags; List-to-Detail Workbench for tasks/search/jobs/grants; Guided Form for changes/exports/lifecycle; Record Detail/Activity for audit; Admin Operations for kill switches, bulk, restore and incidents.
- **Global components consumed**: `<PageShell>`, `<AdminNav>`, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<StateLabel>`, `<FilterBar>`, `<DataTable>`, `<Timeline>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<UploadManager>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every data view inherits FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Protected configuration/admin/lifecycle actions never show optimistic success.
- **Truthful absence**: missing/partial/unknown task, search, diagnostic, quality or lifecycle data never renders as zero, empty or healthy.

## Page and Route Definitions

| Route | Guard/archetype | Primary components | Navigation behavior |
|---|---|---|---|
| `/admin` | Named admin capability; workbench | `AdminHome`, `TaskInbox` | Capability-filtered modules only; refresh labels freshness/partial/unknown. |
| `/admin/settings` | Settings editor registry | `SettingRegistry` | Safe filters/query in URL; definition keys code-owned/read-only. |
| `/admin/settings/{definitionId}` | Settings record/guided form | `EffectiveValueInspector`, `SettingChangeFlow` | Scope/subject/version server validated; deep link grants no value access. |
| `/admin/settings/changes/{changeId}` | Approver/publisher record | `ConfigurationReview`, `RuntimeConsumerStatus` | Frozen hash/impact/current approvals; stale review redirects to current state. |
| `/admin/release/flags` | Release manager registry | `FeatureFlagManager` | Environment/owner/state filters; auth/legal effects never offered. |
| `/admin/release/experiments` | Experiment operator registry | `ExperimentManager` | Approved dimensions/consent contracts only. |
| `/admin/incidents/kill-switches/{switchId}` | Assigned incident operator/MFA | `KillSwitchFlow`, `RuntimeSnapshotStatus` | Predeclared scope/fallback only; activation remains visible until reconciled. |
| `/admin/search` | Named admin capability | `AdminSearch` | Entity/filter/sort allowlisted; counts/snippets capability filtered. |
| `/admin/bulk/{operationId}` | Exact command capability | `BulkOperationWorkbench` | Durable manifest/job; broad query never reruns during execution. |
| `/admin/capabilities` | Qualified grantor/MFA | `CapabilityGrantManager` | No wildcard; revocation immediately invalidates session/task caches. |
| `/admin/audit` | Minimum named audit capability | `AuditLinkViewer` | Safe linked references only; payload evidence remains in owning domain. |
| `/admin/diagnostics` | Named diagnostic capability | `DiagnosticWorkbench` | Current definition/freshness; unknown never healthy. |
| `/admin/imports/{importId}` | Import operator | `ImportWorkbench` | Private scanned source; source/mapping hash and quarantine canonical. |
| `/admin/exports/{exportId}` | Export operator/MFA | `ExportWorkbench` | Delivery grant separate; token possession never authorizes. |
| `/admin/restores/{verificationId}` | Restore operator/distinct reviewer | `RestoreVerificationWorkbench` | Isolated target only; approval never promotes production. |
| `/admin/quality/{runId}` | Checker target capability | `QualityFindings` | Exact checker/target version; stale finding cannot pass publication. |
| `/admin/lifecycle/{requestId}` | Assigned privacy/legal operator/MFA | `LifecycleWorkbench` | Sealed case projection and exact cross-store manifest. |

Enterprise SSO, SCIM, directory sync and enterprise-wide policy consoles remain absent until post-consumer evolution.

## Component Inventory

Every component inherits FE 00 errors, jobs, 8s read/15s command timeouts, request IDs, no blind retries, offline blocking and focus restoration.

### Configuration Runtime Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<SettingRegistry definitions: SettingDefinitionPage; query: SettingQuery; capabilities: ConfigCapability[]>` | `loading|empty|success|degraded|failed`; code-synced keys/types/scopes/risk/lifecycle read-only. Admin cannot create key or lower risk. | Semantic table/labelled rows; key/risk/scope text; filters/count announced. |
| `<EffectiveValueInspector definition: SettingDefinition; resolution: EffectiveValueProjection; context: ResolutionContext>` | Shows typed value, source scope/subject/version, default/inherited flag, interval, evaluator and time. `resolved|defaulted|inherited|blocked|unknown|stale|failed`. | Ordered text/table equivalent to precedence visualization; keyboard navigation; no color-only source. |
| `<SettingChangeFlow definition: SettingDefinition; candidate?: SettingValueVersion; impact: ConsumerImpactProjection; etag: ETag>` | Registry-driven typed value and permitted scope. `editing|validating|review|submitting|draft|conflict|failed`; safe impact/rollback candidate before submit; no effect from draft. | Persistent labels/errors; effective-before/proposed-after linear review; risk/scope/rollback announced. |
| `<ConfigurationReview change: SettingValueVersion; review: ChangeReviewProjection; impact: ConsumerImpactProjection>` | `open|approved|rejected|stale|withdrawn|step_up|activating|active|scheduled|conflict`; exact value/impact hash; risk-required distinct approvals. Rollback creates successor. | Hash supplements plain summary; changed context announced; step-up restores action; self-approval blocked textually. |
| `<FeatureFlagManager flags: FeatureFlagPage; definitions: FlagDefinition[]; etag: ETag>` | `draft|active|paused|expired|retired|validation_error|conflict`; requires owner, purpose, environments, eligible non-authority cohort, fallback, dependencies, interval and expiry. | Expiry/timezone and fallback explicit; dependency graph has ordered text; no on/off color-only toggle. |
| `<ExperimentManager experiments: ExperimentPage; dimensions: AllowedDimension[]; consentContracts: ConsentContract[]>` | `draft|approved|running|paused|stopped|completed|blocked|conflict`; hypothesis, allowed cohort, consent, allocation, metrics, stop/end required. Protected traits/access/price/legal floors unavailable. | Variant/allocation table semantic; expiry/stop condition announced; controls are commands, not instant toggles. |
| `<KillSwitchFlow definition: KillSwitchDefinition; activation?: KillActivationProjection; snapshots: RuntimeSnapshotProjection[]>` | `requested|step_up|active|resolving|ended|blocked|failed`; choose only predeclared scope/fallback/reason. Independent signed snapshot applies during control-plane outage. | Consequence/fallback/scope before confirm; no flashing; incident status assertive only on change; action focus restored. |
| `<RuntimeConsumerStatus expectedVersion: string; consumers: RuntimeConsumerProjection[]>` | `pending|compatible|active|prior_compatible|degraded|unknown|failed`; unrecognized version fails safe and reports diagnostic. | Expected/current versions and fallback textual; semantic table becomes labelled rows. |

### Admin Operations Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<AdminHome modules: AdminModuleProjection[]; health: AdminProjectionHealth>` | `loading|success|partial|unknown|stale|failed`; missing module/card never means no work. | Landmark sections; freshness/state text; focus order stable when modules suppressed. |
| `<TaskInbox page: AdminTaskPage; query: TaskQuery>` | `loading|empty|success|partial|unknown|stale|failed`; source version/freshness/required capability/due/severity. Action always re-reads source. | Semantic table/labelled rows; result/freshness announced; overdue uses text, not color alone. |
| `<AdminSearch definitions: SearchDefinition[]; results?: AdminSearchPage; query: AdminSearchQuery>` | `idle|searching|success|empty|partial|too_broad|field_forbidden|failed`; <=200 query and allowlisted fields/operators. Per-result/count/facet authorization. | Search label/help; result count polite; snippets semantic and never expose protected body/evidence. |
| `<BulkOperationWorkbench operation: BulkOperationProjection; report?: BulkDryRunProjection; items?: BulkItemPage; job?: JobStatusResponse>` | `draft|dry_running|review_ready|approved|running|completed|partial|failed|cancelled|stale`; freezes ordered target IDs/versions/command. Changed target skips item; cancellation stops future leases only. | Frozen count/hash, per-item state/error/retry and accessible downloadable report; tables become labelled records. |
| `<CapabilityGrantManager grants: CapabilityGrantPage; capabilityDefinitions: CapabilityDefinition[]; sourceAuthority: GrantorAuthority>` | `pending_approval|active|rejected|revoked|expired|superseded|step_up|conflict`; named resource/actions/scope/term/reason only, no wildcard or grant beyond authority. | Source/proposed scope comparison; expiry/timezone announced; revoke consequence and session invalidation explicit. |
| `<AuditLinkViewer links: AuditLinkPage; target: SafeAuditTarget>` | `loading|empty|success|degraded|failed`; editable history and immutable event refs with request/action/decision/time only. | Semantic timeline/list; IDs selectable; protected payload never hidden in collapsed DOM. |
| `<DiagnosticWorkbench definitions: DiagnosticDefinition[]; runs: DiagnosticRunPage; job?: JobStatusResponse>` | `queued|running|healthy|degraded|unknown|failed|stale`; registered input/timeout/freshness only. Never auto-repairs high-risk source. | State/freshness/evidence code and runbook textual; unknown not styled as healthy; updates polite. |

### Portability, Quality and Lifecycle Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<ImportWorkbench importJob: ImportProjection; mapping: ImportMappingProjection; report?: ImportDryRunProjection; items?: ImportItemPage>` | `draft|dry_running|review_ready|approved|running|completed|partial|failed|cancelled|stale`; private scanned source and exact source/mapping hash. Authority/ownership/consent/verification/money/rights/legal truth rows quarantine. | Mapping table keyboard reorder/select, error summary, create/update/duplicate/conflict/quarantine counts and focus restoration. |
| `<ExportWorkbench exportJob: ExportProjection; manifest: ExportManifestProjection; delivery?: ExportDeliveryProjection>` | `queued|running|ready|failed|expired|revoked|exhausted`; exact scope/fields/purpose/encryption/expiry/download limit. Delivery grant reauthorizes current actor. | Scope/field manifest and expiry/timezone explicit; copy/download state announced without exposing token. |
| `<RestoreVerificationWorkbench verification: RestoreVerificationProjection; checks: RestoreCheckProjection[]; job?: JobStatusResponse>` | `queued|running|verified|failed|stale|approved|rejected`; isolated target required; schema/migration/count/hash/ref/object/RLS/render/a11y all pass; distinct review. | Check groups semantic; failed evidence links exact check; “backup exists” never shown as restore success. |
| `<QualityFindings run: QualityCheckProjection; findings: QualityFindingPage>` | `queued|running|passed|warning|blocked|failed|stale`; registered checker/target version. Structural, a11y, privacy/legal/rights/route/rendition block; style remains warning. | Finding links exact field/block/route, rule/severity/explanation; automation disclaimer and human-review requirement. |
| `<LifecycleWorkbench request: LifecycleRequestProjection; manifest?: LifecycleManifestProjection; storeResults?: LifecycleStoreResult[]>` | `verifying|planning|review_ready|approved|rejected|stale|running|completed|partial|blocked|failed`; archive/delete/anonymize/hold/release/erasure are distinct. Hold/rule/shared record conflicts preserve minimum and seal access. | Store-by-store semantic results, residual manifest and reviewer basis; partial never announced complete; consequence before MFA confirm. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Definitions/settings/flags/experiments/switches | Server immutable versions; URL stores safe selection only; runtime snapshot is signed server artifact. |
| Admin tasks/search/diagnostics | Derived, capability-filtered and freshness-labelled; never cached as business truth or action authority. |
| Bulk/import/lifecycle manifests | Protected exact server object/hash/target versions; broad client query never determines execution set. |
| Grants | Server canonical; revocation invalidates sessions, task/search caches and new worker leases immediately. |
| Export/download | Server artifact and short delivery capability; tokens not persisted/logged; expiry/download count canonical. |
| Jobs/checks | Stable server ID survives refresh; terminal state stops polling; events trigger refetch only. |

- Back/forward restores selected registry/task/job only if capability and state remain current; otherwise render current denial/state.
- Unsaved-change guards cover setting/flag/experiment/grant/mapping/export/lifecycle forms; never obstruct revocation, expiry or kill-switch reconciliation.
- Offline allows only labelled safe cached definitions/tasks where FE 00 permits; all admin mutation, search, export, preview, approval and job commands require network.
- Multi-tab conflicts preserve safe draft and compare exact version/hash. No configuration/admin last-write-wins.

## Interaction Flows

### Governed Configuration

1. Code release synchronizes immutable definition; editor selects only allowed scope and typed value.
2. Effective inspector resolves exact precedence/merge and shows provenance; draft change computes impact/rollback.
3. Review freezes value/impact hash and collects risk-required distinct approvals/MFA.
4. Activation/schedule rechecks context, atomically activates and distributes versioned snapshot; rollback creates successor.
5. Flags remain release availability, experiments remain consented measurement, kill switches remain predeclared incident fallback—none controls authorization/business truth.

### Admin Operations

1. Home/tasks/search load capability-filtered projections with freshness and unknown/partial semantics.
2. Every action opens source domain and rechecks current target/version/authority.
3. Bulk flow freezes exact target manifest, dry-runs, reviews hash, then invokes registered ordinary commands per target.
4. Capability grant requires least privilege, term, reason and protected distinct approval; revoke stops sessions/new leases immediately.
5. Diagnostics report bounded evidence/freshness and runbook; they never auto-repair or become canonical truth.

### Portability, Quality and Lifecycle

1. Import privately scans/maps/dry-runs; unsupported or authority-smuggling rows quarantine; approved exact hash runs idempotent batches.
2. Export compiles allowlisted encrypted expiring manifest and separately grants bounded download after current authorization.
3. Restore verifies isolated target across data, access, rendering and accessibility; distinct approval records proof only.
4. Quality checker binds findings to exact target/checker version and blocks only governed floors.
5. Lifecycle verifies subject/scope, plans every store/processor/reference, applies hold/counsel decisions and remains partial until every eligible store has evidence.

## Error-to-UI Matrix

| Code | UI state | Recovery |
|---|---|---|
| undefined key/scope invalid | Setting form blocked | Use synchronized definition/permitted scope; no arbitrary key. |
| `APPROVAL_INVALID`, hash/dependency changed | Review stale | Recompute impact and obtain current approvals. |
| flag dependency/fallback/expiry conflict | Flag blocked | Correct registered dependency/fallback/interval. |
| protected experiment dimension/consent missing | Experiment blocked | Remove dimension or bind approved consent contract. |
| kill scope/fallback not predeclared | Incident action blocked | Select allowed switch contract; no arbitrary mutation. |
| `TASK_PROJECTION_UNAVAILABLE` | Inbox unknown/partial | Open source/runbook or retry; never show zero. |
| `SEARCH_FIELD_NOT_ALLOWED`, `QUERY_TOO_BROAD` | Search validation | Narrow query/use allowlisted fields without inference detail. |
| `MANIFEST_CHANGED`, `NOT_APPROVED` | Bulk stale/blocked | Repeat dry run/review for exact current manifest. |
| `GRANT_EXCEEDS_AUTHORITY`, `WILDCARD_FORBIDDEN` | Grant blocked | Narrow resource/actions/scope/term. |
| `DEFINITION_STALE`, diagnostic unavailable | Diagnostic stale/unknown | Run current definition or manual runbook; never healthy. |
| `SOURCE_HASH_CHANGED`, `DRY_RUN_STALE` | Import stale | Rescan/remap/dry-run exact source. |
| `FIELD_NOT_ALLOWED`, `SCOPE_TOO_BROAD` | Export blocked | Narrow manifest; artifact remains unavailable. |
| `TARGET_NOT_ISOLATED`, `CHECKS_FAILED` | Restore blocked | Use isolated target and pass full suite. |
| `CHECKER_STALE` | Quality unknown/stale | Run current checker against current target version. |
| `HOLD_CONFLICT`, `RULE_PACK_MISSING`, `MANIFEST_CHANGED` | Lifecycle blocked/stale | Preserve/seal held data and obtain current counsel rule/manifest. |
| `STEP_UP_REQUIRED`, `SELF_APPROVAL`, `VERSION_CONFLICT` | Protected interruption | Step up/assign distinct reviewer/refetch while preserving safe context. |

Persistent errors include request ID. Setting values marked sensitive, user traits, search query/snippets, bulk/import rows, evidence, exported fields, download tokens and lifecycle subject content never enter URL/toast/telemetry.

## Conditional Rendering Matrix

| Feature | Settings editor | Config approver | Release manager | Experiment operator | Incident operator | Admin operator | Privacy/legal operator | Service principal |
|---|---|---|---|---|---|---|---|---|
| Settings/effective values | assigned definitions full draft | frozen review/approve | release-related read | experiment-related read | incident fallback read | safe diagnostics only | case-related minimum | no UI; registered key resolve |
| Flags/experiments | hidden/read impact | approve where assigned | flags full, experiments read | experiments full, flags read | fallback/dependency read | task/diagnostic read | protected-effects review | no UI; snapshot/assignment consumer |
| Kill switches | hidden | assigned review | impact read | hidden | full assigned activation/MFA | incident task/status | case minimum | no UI; signed snapshot consumer |
| Tasks/search/bulk | own change tasks | assigned approval tasks | release tasks | experiment tasks | incident tasks | full named capability | assigned case tasks only | no UI; exact task/command |
| Capability/audit/diagnostics | own audit links | review links | release diagnostics | experiment diagnostics | incident audit | scoped grants/search/diagnostics | sealed case audit | no UI; registered diagnostic |
| Import/export/restore | hidden | assigned review | hidden | hidden | incident export only if named | scoped operation | protected case export/restore review | no UI; exact worker |
| Quality/lifecycle | setting impact read | quality approval if assigned | release blocker read | hidden | incident blocker read | checker operations | full assigned lifecycle/hold | no UI; exact checker/store action |

Named variants: `settingsAssigned`, `approverFrozen`, `releaseBounded`, `experimentConsented`, `incidentPredeclared`, `adminNamedCapability`, `privacyAssignedSealed`, `serviceRegisteredNoUi`.

## Accessibility Inventory

| Interaction | Keyboard/focus and screen-reader contract | IA source |
|---|---|---|
| Admin home/tasks/diagnostics | Loading, stale, partial, unknown, healthy, empty and failed use text/semantics; stable focus when cards suppress | IA 05 § Accessibility |
| Settings/effective value | Labels effective/source/version/default/impact/risk/validation/rollback; precedence has ordered table equivalent | IA 05 § Accessibility |
| Bulk dry-run/results | Frozen count, item state/error/retry and accessible report; table keyboard complete | IA 05 § Accessibility |
| Expiring grants/flags/experiments/exports/holds | Expiry and timezone announced; step-up returns exact initiating control/context | IA 05 § Accessibility |
| Quality findings | Link exact field/block/route; announce severity/rule/explanation and automation limitation | IA 05 § Accessibility |
| Import mapping/restore compare | Semantic tables, keyboard mapping/reorder, error summary and focus restoration | IA 05 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, step-up/dialog focus restoration and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Registries/tasks | Forms/reviews | Bulk/portability/lifecycle |
|---|---|---|---|
| `<=768px` | List then detail; filters summarized; status/freshness persistent | One section at a time; source/proposed/impact linear | Manifest summary then labelled item/store results; actions after blockers |
| `769-1024px` | Conditional split view | Form plus impact when reflow valid | Status/detail split with accessible table alternative |
| `>=1025px` | List/detail/activity rail | Source/proposed/impact columns with canonical linear DOM | Manifest/result table plus action/evidence rail |

All widths retain key, scope, version, freshness, risk, expiry, manifest hash/count and partial/unknown state text. No action is hover-only or color-only.

## Data Mapping

| BE response | Components |
|---|---|
| Setting definition/effective value/value version/review/consumer status | `SettingRegistry`, `EffectiveValueInspector`, `SettingChangeFlow`, `ConfigurationReview`, `RuntimeConsumerStatus` |
| Flag/experiment/kill activation/runtime snapshot | `FeatureFlagManager`, `ExperimentManager`, `KillSwitchFlow` |
| Task/search/bulk manifest/items/job | `AdminHome`, `TaskInbox`, `AdminSearch`, `BulkOperationWorkbench` |
| Capability grant/audit links/diagnostic run | `CapabilityGrantManager`, `AuditLinkViewer`, `DiagnosticWorkbench` |
| Import mapping/dry-run/items, export manifest/delivery, restore checks | `ImportWorkbench`, `ExportWorkbench`, `RestoreVerificationWorkbench` |
| Quality findings and lifecycle manifest/store results | `QualityFindings`, `LifecycleWorkbench` |

No component consumes arbitrary keys/commands, secret values, raw protected traits, unrestricted search/counts, arbitrary database rows, export tokens, sealed evidence or service credentials.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every named role/state; effective provenance; scope precedence table; expiry; partial/unknown; exact manifest; accessible mapping/results; hidden-field DOM absence |
| Contract | all 05a-c endpoints/errors, ETags/idempotency, no-store/redaction, cursors, state registries, jobs and runtime/export/lifecycle grants |
| E2E | setting draft/review/activate/rollback, flag expiry, experiment stop, kill fallback, task/search, bulk dry-run/run/revoke, grant revoke, diagnostics unknown, import quarantine, export expiry, restore failure, quality block, hold/partial lifecycle |
| Accessibility | keyboard/AT settings, tasks/search, tables, mappings, findings, expiry/step-up and responsive operations |
| Security | arbitrary key/secret/authority setting denial, protected experiment targeting, search inference, bulk expansion, wildcard grant, export exfiltration, false restore/health and hold erasure denial |
| Performance | admin initial JS <=120KB, guided flows <=100KB, each island <=50KB unless approved; cursor/virtualization preserve accessible semantics |

## Deepening Record

1. **State synchronization**: definitions, values, approvals, snapshots, tasks, manifests, grants, diagnostics, exports, checks and lifecycle converge on server versions.
2. **Network degradation**: prior compatible runtime, partial/unknown admin projections, resumable jobs and truthful residual manifests are explicit.
3. **Flow sequencing**: CFG-01..14 map to routes/components and preserve define, resolve, impact, review, activate, dry-run, exact execute and verify order.
4. **Responsive/touch**: registries, comparisons, tables, mappings and store results retain complete keyboard/touch behavior.
5. **State exhaustion**: every configuration/admin/import/export/restore/quality/lifecycle state maps to rendered behavior.
6. **Role exhaustion**: all eight IA capabilities have explicit cells; service principals receive no UI.
7. **Accessibility edge cases**: provenance, freshness, manifests, expiry, findings, mapping and step-up restoration are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states/errors, validation, role variant, responsive behavior and accessibility contract.
- **Macro**: CFG-01..14 preserve governed variables, no universal admin, exact bulk/portability manifests, evidence-bound quality and hold-safe lifecycle.
- **Two-implementer assertion**: independent implementers choose identical scope resolution, risk review, release/experiment/kill separation, task/search truthfulness, exact bulk, least-privilege grants, restore proof and partial lifecycle semantics.
- **Devil's advocate**: no UI can mint settings, store secrets/authority, use flags/experiments to alter protected truth, show unknown as healthy, broaden bulk targets, grant wildcards, trust a download token, promote a restore, or erase held/shared evidence.
- **Result**: PASS.

## Open Questions

None. Product-operable variables are governed definitions/settings; security, authorization, legal, money, rights, state-machine, evidence and retention floors remain code/rule-pack owned. Enterprise administration remains deferred.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete platform configuration, admin and quality frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by
- [[specs/fe/00-infrastructure|FE 00 Infrastructure]]
- [[specs/fe/01-identity-authority|FE 01 Identity Authority]]
- [[specs/fe/03-cms-content-modeling|FE 03 CMS Content Modeling]]
- [[specs/fe/04-cms-delivery-media|FE 04 CMS Delivery and Media]]
- [[specs/design-system|Design System]]

### Derives from
- [[specs/ia/05-platform-configuration-admin|Shard 05 IA]]
- [[specs/ia/deep-dives/05-platform-configuration-admin|Platform Configuration Deep Dive]]
- [[specs/be/05a-settings-flags-runtime|BE 05a]]
- [[specs/be/05b-admin-workspace-operations|BE 05b]]
- [[specs/be/05c-portability-quality-lifecycle|BE 05c]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/05-platform-configuration-admin|Deep Dive 05 — Platform configuration, admin and quality]]

### References
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
- [[specs/be/05b-admin-workspace-operations|Admin workspace, capability grants, bulk operations and diagnostics — Backend Specification]]
- [[specs/be/05c-portability-quality-lifecycle|Portability, quality gates and data lifecycle — Backend Specification]]
- [[specs/ia/05-platform-configuration-admin|Shard 05 — Platform configuration, admin and quality]]
- [[specs/ia/deep-dives/05-platform-configuration-admin|Deep Dive 05 — Platform configuration, admin and quality]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/design-system|Design System]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/fe/03-cms-content-modeling|CMS Content Modeling and Authoring - Frontend Specification]]
- [[specs/fe/04-cms-delivery-media|CMS Navigation, Media and Delivery - Frontend Specification]]
