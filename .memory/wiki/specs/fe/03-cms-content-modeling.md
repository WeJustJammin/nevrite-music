# CMS Content Modeling and Authoring - Frontend Specification

> **BE Sources**: [[specs/be/03a-content-schema-registry|Content Schema Registry]], [[specs/be/03b-editorial-workflow-publication|Editorial Workflow and Publication]], [[specs/be/03c-composition-taxonomy-localization|Composition Taxonomy and Localization]]  
> **IA Source**: [[specs/ia/03-cms-content-modeling|Shard 03 CMS Content Modeling and Authoring]]  
> **Status**: Complete

## Classification

- **Type**: Feature specification spanning three backend contracts that form one governed CMS control-plane and authoring workbench.
- **Surface**: Capability-gated admin schema/template/taxonomy registries; editor/reviewer/publisher workbench; preview, migration and publication operations.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: All shell, feedback, request, job, upload, offline, conflict and accessibility behavior inherits [[specs/fe/00-infrastructure|FE 00 Infrastructure]]. Identity and acting-context behavior inherits [[specs/fe/01-identity-authority|FE 01 Identity Authority]].

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/03-cms-content-modeling|Shard 03 IA]] | Features, Interactions CMS-01..16, Contracts, Access Control, Accessibility, Edge Cases |
| IA deep dive | [[specs/ia/deep-dives/03-cms-content-modeling|CMS Content Modeling Deep Dive]] | registries, compiler, revision merge, review/publication, migrations, composition, taxonomy/locales and abuse recovery |
| Backend | [[specs/be/03a-content-schema-registry|03a]] | content types, fields, relations, compile, migration and activation |
| Backend | [[specs/be/03b-editorial-workflow-publication|03b]] | entries, autosave, revisions, review, schedule, publish and lifecycle |
| Backend | [[specs/be/03c-composition-taxonomy-localization|03c]] | blocks, templates, patterns, preview, taxonomy, locale and related content |
| Cross-cutting FE | [[specs/fe/00-infrastructure|FE 00]] | global shell, state, error, job, upload, offline and responsive contracts |
| Identity FE | [[specs/fe/01-identity-authority|FE 01]] | acting context, capability gates, step-up and assigned-review boundaries |
| Design | [[specs/design-system|Design System]] | Settings/Registry, List-to-Detail Workbench, Guided Form, Record Detail/Activity and Admin Operations |

## Source Map

| FE section | Source |
|---|---|
| Type/schema/field/relation registry | BE 03a § Registry/API Endpoint Matrix; IA CMS-01..04 |
| Entry editing/revisions/conflicts | BE 03b § Editorial Invariants/API Endpoint Matrix; IA CMS-05..07 |
| Review/schedule/publication/lifecycle | BE 03b § API Endpoint Matrix/State Machine Registry; IA CMS-08..09, CMS-13 |
| Blocks/templates/patterns/preview | BE 03c § Composition Invariants/API Endpoint Matrix; IA CMS-10..13 |
| Taxonomy/localization/related content | BE 03c § API Endpoint Matrix/State Machine Registry; IA CMS-14..16 |
| Role rendering | IA 03 § Access Control; BE RLS and authorization contracts |
| Accessibility | IA 03 § Accessibility; registered block contracts; FE 00 |
| Responsive and visual behavior | Design System; FE 00 responsive contract |

## Design Requirements

**Direction**: A precise editorial instrument, not a generic website builder. The interface emphasizes current object, version, risk, owner, validation and next legitimate transition.  
**Typography**: Source Sans 3 for controls/content; IBM Plex Mono for immutable keys, versions, hashes, field paths, locale codes and job references.  
**Colors**: Paper/Surface/Graphite with Jam Magenta reserved for current selection or one primary action. Validation, review and publication states always use text and structure.  
**Motion**: 150-220ms bounded feedback; no animated dashboards, celebratory publishing or motion-dependent composition. Reduced-motion removes nonessential transitions.  
**Anti-patterns**: no arbitrary HTML/CSS/JS/SQL/expressions, plugin/theme marketplace, drag-only builder, silent autosave overwrite, mutable production schema, self-approval, fake preview-as-accessibility-check, generic legal fallback, hidden dependency drift or “admin can override everything.”

## Design System Compliance

- **Archetypes**: Settings/Registry for type/block/taxonomy definitions; List-to-Detail Workbench for entries/reviews/migrations; Guided Form for type, field, schedule and locale flows; Record Detail/Activity for revision history; Admin Operations for publish, activation and protected review.
- **Global components consumed**: `<PageShell>`, `<AdminNav>`, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<StateLabel>`, `<FilterBar>`, `<DataTable>`, `<Timeline>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every data view inherits FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Canonical revision, review, migration, activation and publication changes never show optimistic success.
- **Empty/error language**: no entries, no terms and no translations may be valid empty states. Dependency failure, withheld capability, stale approval, incompatible block, no-fallback field and migration failure are explicit states, never empty.

## Page and Route Definitions

| Route | Archetype and guard | Primary components | Deep-link and navigation behavior |
|---|---|---|---|
| `/admin/cms/entries` | Author/editor/reviewer/publisher workbench | `EntryWorkbench` | URL stores allowlisted type/state/owner/locale query and selected entry; authority refetches. |
| `/admin/cms/entries/new` | Author guided form | `EntryEditor` create variant | Type/schema fixed after first canonical revision except through registered migration. |
| `/admin/cms/entries/{entryId}` | Viewer-relative record detail | `EntryEditor`, `AutosaveStatus`, `PresenceStrip` | Refresh loads canonical draft/revision; URL never grants draft access. |
| `/admin/cms/entries/{entryId}/history` | Record Detail/Activity | `RevisionTimeline`, `RevisionCompare`, `RestoreRevisionFlow` | From/to revision query is allowlisted; incompatible comparison shows typed state. |
| `/admin/cms/entries/{entryId}/review` | Assigned review workbench | `ReviewPanel`, `PreflightReport` | Frozen hash/dependency manifest always visible; changed candidate redirects to current review state. |
| `/admin/cms/entries/{entryId}/publish` | Publisher/MFA guided transaction | `PublicationPanel`, `ScheduleEditor`, `PreflightReport` | Exact revision/version set is server-issued; step-up restores review context. |
| `/admin/cms/content-types` | Schema designer registry | `ContentTypeRegistry` | Filter/state in URL; retired keys remain visible and unavailable for reuse. |
| `/admin/cms/content-types/{typeId}/versions/{versionId}` | Schema workbench | `SchemaDesigner`, `CompatibilityReport` | Draft/current active versions are separate records; active version is read-only. |
| `/admin/cms/migrations/{planId}` | Migration operator/admin operations | `MigrationWorkbench`, `JobStatus` | Durable job/cursor survives refresh; no browser-side transformation. |
| `/admin/cms/blocks` | Template designer read-only code registry | `BlockRegistry` | Only code-synced versions render; unsupported versions remain historical. |
| `/admin/cms/templates/{templateId}/versions/{versionId}` | Template designer workbench | `TemplateDesigner`, `ImpactReport` | Exact block/version/slot set in URL-independent server record. |
| `/admin/cms/patterns/{patternId}/versions/{versionId}` | Template designer workbench | `PatternDesigner`, `PatternUpdateReview` | Linked instances require explicit accept or detach after diff. |
| `/preview/{token}` | Audience-bound preview capability | `PreviewShell` | No-store/noindex; every open reauthorizes; revoked/expired is invariant 404. |
| `/admin/cms/taxonomies` | Taxonomy curator registry | `TaxonomyWorkbench` | Vocabulary selection in URL; canonical overlap is blocked, not silently mapped. |
| `/admin/cms/entries/{entryId}/locales/{locale}` | Translator/editor guided form | `LocaleEditor`, `FallbackInspector` | BCP-47 locale and source revision server-validated; stale source refetches. |
| `/admin/cms/entries/{entryId}/related` | Editor curation workbench | `RelatedContentEditor` | Pins/exclusions/derived rule keys are canonical and viewer-safe candidates only. |

Routes are absent unless the named capability is available. Service principals have no interactive route. Shard 04 owns menus/routes/media delivery; Shard 05 owns global settings/admin task infrastructure.

## Component Inventory

Every component inherits FE 00 timeouts, request-ID persistence, no blind mutation retry, offline policy and exact focus restoration. Safe local draft edits may be immediately reflected; no canonical state is claimed until save succeeds.

### Schema and Migration Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<ContentTypeRegistry page: ContentTypePage; query: ContentTypeQuery; capabilities: CmsCapability[]>` | `loading|empty|success|degraded|failed`; state filters private/active/retired. Create key validates immutable regex and reserved registry on submit. | Semantic table becomes labelled records; key/state in text; filter changes announce count and retain focus. |
| `<SchemaDesigner type: ContentTypeProjection; version: SchemaVersionProjection; registries: SchemaRegistryManifest; etag: ETag>` | `draft|compiling|compatible|migration_required|rejected|approved|activating|active|superseded|conflict|failed`; active/superseded read-only. Add/edit/deprecate one stable field or relation per command. | Field tree has headings and keyboard navigation; reordering uses move controls; conditional requirements announced; mobile uses list then field detail. |
| `<FieldDefinitionEditor field?: FieldDefinitionProjection; kinds: FieldKindDefinition[]; reservedKeys: string[]>` | Kind drives strict constraints/default/localization/editor fields; validate on blur and submit. Distinguishes missing/null/empty/default/fallback. Key/UUID immutable after first save. | Persistent labels/descriptions/errors; dynamic field visibility/requirement announced; examples are help, not placeholders. |
| `<RelationDefinitionEditor relation?: RelationDefinitionProjection; projections: AllowedProjection[]; fieldKind: FieldKind>` | Validates target kind/type, cardinality, min/max, projection, unavailable behavior and ordering. Relation stores no authority/copied target data. | Plain-language access/recheck explanation precedes advanced fields; error links exact constraint. |
| `<CompatibilityReport report?: CompatibilityProjection; job?: JobStatusResponse>` | `idle|queued|running|additive|conditional|breaking|failed|stale`; shows affected entry/template/API counts and deterministic reasons, never field values. | Status live region is non-intrusive; impact tables semantic; changed class announced once. |
| `<MigrationWorkbench plan: MigrationPlanProjection; report?: MigrationDryRunProjection; job?: JobStatusResponse; capability: MigrationCapability>` | `draft|dry_running|ready|failed|running|verifying|completed|failed_retryable|failed_terminal|blocked|stale`; transform must be registered. Dry run never mutates; run requires MFA/current versions. | Progress, cursor/counts/errors and old-version authority in text; retry names idempotent resume; action rail follows record in mobile reading order. |
| `<SchemaActivationFlow version: SchemaVersionProjection; compatibility: CompatibilityProjection; migration?: MigrationPlanProjection; approvals: ApprovalProjection[]>` | `blocked|review|step_up|submitting|active|queued|conflict|failed`; requires current compile hash, approvals, zero unresolved references and completed migration evidence. | Changed dependency/approval summary before confirmation; step-up restores initiator; no preselected approval override. |

### Editorial and Publication Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<EntryWorkbench page: EntrySummaryPage; query: EntryQuery; selected?: EntryProjection; capabilities: CmsCapability[]>` | FE 00 list/detail states; filters type/state/owner/locale/review. Selection never changes acting context or assignment. | Split view desktop, stack mobile; semantic table/labelled records; result count announced. |
| `<EntryEditor entry: EntryProjection; revision: EntryRevisionProjection; manifest: EditorManifest; capabilities: EntryCapability[]; etag: ETag>` | `loading|editing|saving|saved|validation_error|same_field_conflict|schema_stale|forbidden|offline|failed`; structured fields/blocks/relations only. Validation on blur, autosave and explicit submit; autosave never publishes. | Manifest supplies labels/descriptions/constraints; conditional fields announce changes; error summary; logical DOM order; no raw HTML editor. |
| `<AutosaveStatus dirty: boolean; lastSavedAt?: ISODateTime; state: SaveState; nextMaxSaveAt?: ISODateTime>` | Saves after 3s idle and at most 30s dirty; explicit save always available. Failure preserves local unsent value; authority revocation blocks commit and removes presence. | Polite status region; no announcement per keystroke; disconnected/failed text never color-only. |
| `<PresenceStrip leases: PresenceProjection[]; currentFieldId?: UUID>` | Advisory `active|expiring|expired`; two-minute lease, renew every 30s. Never grants or blocks write and exposes only allowed collaborator identity/context. | Compact named list; presence changes announced only when materially relevant; no focus theft. |
| `<RevisionConflictResolver conflict: SameFieldConflictProjection; resolutions: FieldResolutionDraft[]>` | Shows base/theirs/yours safe values per path; every conflict requires explicit choice/edit. Submit creates two-parent revision; stale input refetches without overwrite. | Linear semantic compare equivalent to columns; keyboard choice per field; focus moves to first unresolved then result heading. |
| `<RevisionTimeline revisions: RevisionSummaryPage; selected?: UUID>` | Immutable history with author human/acting party, parents, schema/template/taxonomy versions, hash and state. Pagination follows FE 00. | Ordered timeline/list; mono refs supplement descriptive text; no color-only change type. |
| `<RevisionCompare diff: RevisionDiffProjection; mode: "semantic"|"linear">` | Field/block/relation additions/removals/changes; incompatible revision is explicit. Never relies on side-by-side only. | Semantic change list is canonical DOM; desktop columns are visual enhancement; additions/removals announced in text. |
| `<RestoreRevisionFlow source: RevisionSummary; migrationPath?: MigrationPathProjection; currentSchema: SchemaSummary; etag: ETag>` | `review|migration_required|submitting|success|path_missing|conflict|failed`; creates new current-schema draft and never mutates/reactivates history. | Consequence and transformed fields reviewed before confirm; focus returns to new draft heading. |
| `<ReviewPanel review: EditorialReviewProjection; decisions: DecisionProjection[]; currentCapability: ReviewCapability>` | `open|approved|rejected|stale|withdrawn|submitting|conflict`; exact hash/dependency/risk visible. Protected review blocks self-approval and requires distinct specialist/humans plus MFA. | Decision history semantic; rejection/comment labels persistent; changed dependency announced and actions disabled. |
| `<PreflightReport checks: PreflightCheckProjection[]; versionSetHash: string; state: PreflightState>` | `running|passed|blocked|degraded|failed|stale`; contract, relation, privacy, security, accessibility, rights/media, route/SEO, locale, migration and domain checks. Unknown blocks publish. | Check groups/headings with explicit status and recovery links; zero Critical/Serious accessibility finding gate textual. |
| `<ScheduleEditor value?: PublicationScheduleProjection; allowedActions: ScheduleAction[]; revision: RevisionSummary>` | Local datetime, IANA timezone, resolved UTC, tzdb and action required. `editing|time_ambiguous|time_nonexistent|review|pending|executing|completed|blocked|cancelled|conflict`; ambiguous time requires earlier/later selection. | Labels timezone and resolved instant; alternatives keyboard selectable; absolute times announced; action/consequence reviewed. |
| `<PublicationPanel entry: EntryProjection; revision: RevisionSummary; review: EditorialReviewProjection; preflight: PreflightProjection; publication?: PublicationProjection>` | `blocked|ready|step_up|publishing|queued|active|degraded|revoked|expired|superseded|conflict|failed`; exact approved version set only. Unpublish/archive/delete are separate confirmed commands. | Primary action follows blocker summary; current publication and last-known-good status explicit; destructive action focus restoration per FE 00. |

### Composition, Taxonomy and Locale Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<BlockRegistry page: BlockDefinitionPage; filters: BlockRegistryQuery>` | Read-only `active|retired|unsupported` code-owned metadata: props, children, data sources, accessibility and compatibility. No upload/edit code action. | Search/filter keyboard operable; block detail uses definitions; unsupported reason and affected count textual. |
| `<TemplateDesigner template: TemplateVersionProjection; blocks: CompatibleBlockDefinition[]; etag: ETag>` | `draft|approved|active|superseded|rejected|conflict`; named slots accept only compatible registered block versions/bindings. Reserved regions/profile provenance cannot move/remove. | Slot/block tree has keyboard move/add/remove controls and destination announcements; drag is optional; mobile uses outline then selected block editor. |
| `<PatternDesigner pattern: PatternVersionProjection; blocks: CompatibleBlockDefinition[]; limits: CompositionLimits; etag: ETag>` | Validates acyclic typed tree, protected depth/count and bindings. `draft|approved|active|superseded|cycle|limit_exceeded|incompatible|failed`. | Tree semantics plus linear outline; keyboard reorder; cycle/error identifies source path and returns focus there. |
| `<PatternUpdateReview instance: CompositionInstanceProjection; current: PatternVersionProjection; candidate: PatternVersionProjection; diff: CompositionDiff>` | `review|accepting|detaching|success|local_changes_conflict|stale|failed`; linked update requires explicit accept or detach. No silent local overwrite. | Three-way semantic linear diff precedes actions; desktop columns preserve same DOM order; changed slots announced. |
| `<PreviewShell render: PreviewProjection; controls: PreviewControlProjection; expiresAt: ISODateTime>` | `loading|success|forbidden|absent|expired|dependency_unavailable|failed`; viewport/locale/audience controls alter bound preview request only. Preview never claims accessibility certification. | Returns authoring focus/context on close; controls labelled; iframe/title boundaries explicit; viewport simulation does not disable reflow/keyboard. |
| `<TaxonomyWorkbench taxonomy: TaxonomyProjection; terms: TaxonomyTermPage; impact?: TaxonomyImpactProjection; capabilities: TaxonomyCapability[]>` | `draft|approved|active|superseded|retired|conflict`; term `active|deprecated|merged|retired`. Rename keeps key; merge selects survivor/permanent alias and may create job. | Hierarchy uses tree plus linear list fallback; keyboard expand/select/move where allowed; merge impact and survivor announced. |
| `<LocaleEditor entry: EntryProjection; locale: BCP47; source: LocaleSourceProjection; fields: LocalizableFieldProjection[]; state: LocaleState; etag: ETag>` | `untranslated|draft|in_review|approved|rejected|stale|source_changed|validation_error|failed`; only allowed fields editable. Source changes mark changed fields stale; no-fallback missing/stale blocks publish. | Source/translation paired visually but linear source-then-target DOM; language attributes correct; stale fields and fallback source announced. |
| `<FallbackInspector fields: LocaleResolutionProjection[]; chain: BCP47[]>` | Read-only resolved source per field: local, ordered fallback or missing/blocked. Legal/safety/jurisdiction/accessibility required fields default no-fallback. | Semantic table/labelled records; language/source and blocked reason textual, never flag/color only. |
| `<RelatedContentEditor current: RelatedCurationProjection; candidates: RelatedCandidatePage; etag: ETag>` | `loading|empty|editing|optimistic_pending|optimistic_rollback|success|target_ineligible|conflict|failed`; pins ordered first, exclusions win, derived candidates show reason/version. Target authorization/publication rechecks. | Keyboard pin/exclude/reorder; candidate reason announced; unavailable target removal explains history without existence leak. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Schema/template/pattern/taxonomy definitions | Server canonical immutable versions with ETag; URL may identify record/version but never mutation capability. |
| Entry draft | Server immutable revisions plus bounded safe unsent field state in component memory; no raw secret/legal values in localStorage or service worker. |
| Presence/autosave | Advisory server lease and client dirty state; authority is independently rechecked at every save. |
| Review/preflight/publication | Server frozen hash/version/dependency set. Any invalidation refetches and disables decision/publish controls. |
| Jobs/migrations/schedules | Stable server IDs/cursors survive refresh; terminal state stops polling; client never advances state from events alone. |
| Preview | Opaque 15-minute maximum grant bound to user/context/version/audience/locale/route; no-store/noindex and no token logging. |

- Browser back/forward restores selected record/tab/diff only when server state still permits it; otherwise current canonical state and reason render.
- Unsaved-change guards cover schema, entry, template, pattern, taxonomy, locale and schedule forms. They do not block authority revocation or unsafe publication withdrawal.
- Multi-tab same-field conflicts preserve local values and open `RevisionConflictResolver`; no silent last-write-wins. Related-content preference ordering alone may use explicit optimistic rollback.
- Offline permits viewing labelled safe cached registry metadata and editing a recoverable non-sensitive local draft only where FE 00 allows. Every save/review/publish/migration/preview/term merge remains online-only.
- Realtime events invalidate and refetch exact versions; event payloads never become definition, approval or publication truth.

## Interaction Flows

### Schema and Migration

1. Schema designer creates immutable type key and private version-one draft from approved registries.
2. Field/relation changes compile deterministic artifacts and impact/compatibility result.
3. Conditional/breaking change requires registered migration plan, non-mutating dry run, reviewed errors/counts and resumable run.
4. Activation reviews exact compile hash, dependency set, approvals and migration evidence, then switches atomically; prior active remains authoritative until success.

### Entry, Review and Publication

1. Entry editor loads server manifest/revision and advisory presence; changes validate and autosave to immutable revisions.
2. Non-overlapping paths may auto-merge; same-path divergence opens explicit base/theirs/yours resolution.
3. Compare is semantic; restore migrates history into a new current-schema draft.
4. Submit freezes hash/dependencies and opens risk-appropriate review. Changed content, authority or dependency invalidates approval.
5. Publisher reviews current preflight and either publishes immediately or records local time/timezone/resolved UTC schedule.
6. Execution rechecks the exact set and commits publication/outbox once. Unpublish, expire, archive and delete remain distinct.

### Composition, Taxonomy and Localization

1. Block registry is synced by signed code release; designers can select, not implement, block versions.
2. Template/pattern builders enforce slots, bindings, limits, accessibility contract and reserved regions with keyboard-equivalent composition.
3. Linked pattern update presents three-way diff and requires accept or detach.
4. Preview creates a short exact-version audience-bound grant and compares semantic output to active publication.
5. Taxonomy curation checks canonical overlap; rename preserves key, merge preserves alias/redirect and migrates assignments idempotently.
6. Locale editor tracks source-field hashes, stale state and explicit fallback; required no-fallback fields block locale publish.
7. Related editor applies pins then exclusions then explainable eligible derived candidates.

## Error-to-UI Matrix

| Code | Component state and copy intent | Recovery |
|---|---|---|
| `SCHEMA_FORBIDDEN`, `TYPE_KEY_EXISTS`, reserved collision | Type form blocked | Choose non-reserved immutable key or use canonical-domain reference; no override. |
| `FIELD_SCHEMA_INVALID`, `FIELD_KEY_REUSED` | Field validation error | Correct registered constraints; retired key remains unavailable. |
| `RELATION_NOT_ALLOWED`, `CARDINALITY_INVALID` | Relation validation error | Select allowlisted projection/cardinality; never copy target data. |
| `SCHEMA_INVALID`, `COMPILER_ARTIFACT_STALE` | Compile/plan stale | Recompile current definition and review changed impact. |
| `PLAN_NOT_READY`, `MIGRATION_INCOMPLETE` | Migration/activation blocked | Complete current dry-run/run/verification and resolve every blocker. |
| `SAME_FIELD_CONFLICT`, `UNRESOLVED_CONFLICT` | Explicit revision conflict | Resolve every path against current base/theirs/yours. |
| `SCHEMA_STALE`, `MIGRATION_PATH_MISSING` | Editor/restore blocked | Refetch manifest or create approved migration path. |
| `SELF_APPROVAL`, `HASH_CHANGED`, `DEPENDENCY_CHANGED` | Review invalid/blocked | Assign eligible distinct reviewer or submit a new current review. |
| `TIME_AMBIGUOUS`, `TIMEZONE_INVALID` | Schedule field error | Choose earlier/later valid instant or correct IANA timezone. |
| `APPROVAL_INVALID`, `PREFLIGHT_FAILED` | Publish blocked | Re-run current preflight/review; no bypass. |
| `BLOCK_INCOMPATIBLE`, `RESERVED_REGION_INVALID` | Template/pattern validation | Use compatible version and restore reserved structure. |
| `PATTERN_CYCLE`, `LOCAL_CHANGES_CONFLICT` | Pattern blocked/review conflict | Remove cycle or explicitly accept/detach after current diff. |
| `PREVIEW_FORBIDDEN`, `PREVIEW_NOT_FOUND` | Preview forbidden/absent | Return to authoring and issue a fresh authorized grant. |
| `TAXONOMY_OVERLAP`, `TERM_CYCLE`, `MERGE_CONFLICT` | Taxonomy blocked | Reference canonical taxonomy or select valid survivor/hierarchy. |
| `SOURCE_CHANGED`, `NO_FALLBACK_FIELD_MISSING` | Locale stale/blocked | Rebase changed fields and translate required no-fallback content. |
| `TARGET_INELIGIBLE`, `RULE_UNKNOWN` | Related curation stale | Refetch eligible candidates/rules; preserve safe selection draft. |
| `STEP_UP_REQUIRED`, `VERSION_CONFLICT` | Protected interruption/conflict | Step up and restore context, or refetch and compare current version. |

All persistent errors include request ID. Entry values, migration payloads, relation target private data, preview tokens, protected comments and legal/security content never enter URLs, toasts or telemetry.

## Conditional Rendering Matrix

| Feature/component | CMS author | CMS editor | CMS publisher | Schema designer | Template designer | Taxonomy curator | Legal/security reviewer | Service principal |
|---|---|---|---|---|---|---|---|---|
| Entry workbench/editor | full assigned draft | full eligible review/edit | read approved candidate | schema-impact read only | template-impact read only | term-impact read only | assigned protected minimum | hidden |
| Revision/conflict/restore | own/assigned full | full eligible | read/compare | impact read only | impact read only | hidden | assigned minimum | hidden |
| Review panel | submit/read decisions | review/reject ordinary; protected separation | approve eligible publication review | schema-review participant only if named | template-review participant only if named | taxonomy-review participant only if named | assigned protected decision | hidden |
| Publish/schedule/lifecycle | hidden | hidden except return/reject | full validated set after step-up | hidden | hidden | hidden | review only, no publisher authority | no UI; exact registered job |
| Schema/migration | hidden | read manifest | read active schema | full draft/compile; activation requires separate approval | compatibility read | hidden | assigned approval only | no UI; one plan/version |
| Block/template/pattern | consume in entries | review content use | impact/preflight read | schema compatibility read | full bounded design | hidden | assigned risk review | no UI; signed registry sync only |
| Taxonomy/terms | assign eligible terms | review assignments | impact/preflight read | field binding read | template binding read | full assigned vocabulary | assigned protected review | no UI; exact merge job |
| Locale/related content | full assigned variants/curation | full eligible review | publication readiness read | localization schema read | template locale impact read | taxonomy impact read | assigned no-fallback review | no UI; exact projection job |
| Preview | own/assigned exact version | eligible exact version | approved-set exact version | schema impact preview | template/pattern preview | taxonomy impact preview | assigned protected preview | hidden |

Named variants: `authorAssignedDraft`, `editorEligibleReview`, `publisherValidatedSet`, `schemaDesignerBounded`, `templateDesignerRegisteredOnly`, `taxonomyCuratorAssigned`, `specialistAssignedProtected`, `serviceExactJobNoUi`.

## Accessibility Inventory

| Component/interaction | WCAG | Keyboard/focus | Screen-reader behavior | IA source |
|---|---|---|---|---|
| Schema/editor fields | 1.3.1, 3.3.1, 3.3.2 | Logical manifest order; error summary links controls | Labels, descriptions, constraints, errors and conditional requirement changes announced | IA 03 § Accessibility |
| Autosave/presence/status | 1.4.1, 4.1.3 | No focus theft; explicit save keyboard available | Non-intrusive dirty/saving/saved/offline/conflict/review/job messages | IA 03 § Accessibility |
| Field/block/term reorder | 2.1.1, 2.4.3 | Move before/after/up/down controls; drag optional | Announces item, source position and destination | IA 03 § Accessibility |
| Revision/pattern compare | 1.3.1, 1.4.10 | Linear semantic view is canonical; columns optional | Announces added/removed/changed path and selected resolution | IA 03 § Accessibility |
| Preview controls | 2.1.1, 2.4.3 | Viewport/locale/audience controls keyboard operable; close restores authoring focus | Names simulated context and explicitly does not claim accessibility validation | IA 03 § Accessibility |
| Publish preflight | 1.1.1, 1.3.1, 2.4.6, 3.3.4 | Blocker links and confirmation sequence keyboard complete | Announces alt/heading/link/language/block accessibility and axe gate results | IA 03 § Accessibility |
| Schedule/DST | 3.3.1, 3.3.2 | Earlier/later alternatives keyboard selectable | Announces timezone, local time, resolved UTC and ambiguity/nonexistent-time reason | IA 03 § Accessibility |
| Locale/fallback | 3.1.1, 3.1.2, 1.4.1 | Source/target/fallback controls in logical order | Correct language attributes; stale/no-fallback/source locale text | IA 03 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, focus restoration after preview/step-up/dialog and zero axe Critical/Serious findings on governed templates.

## Responsive Behavior

| Width | Registry/workbench | Editor/composer | Compare/review/operations |
|---|---|---|---|
| `<=768px` | List then detail stack; filters summarize inline; row actions attach to labelled record | Outline then selected field/block; one form section at a time; persistent save/state bar | Canonical linear diff; status then blockers then actions; no side-by-side dependency |
| `769-1024px` | Conditional split view with detail at least 5/8 width | Outline rail plus editor when reflow remains valid | Two panels only where linear reading order and 200% zoom remain valid |
| `>=1025px` | List/detail plus bounded activity/action rail | Schema/composition outline, primary editor and contextual inspector | Semantic side-by-side compare or record/activity with identical DOM reading order |

At every width, object key, version, state, acting context, risk, autosave, validation and next action remain visible in text. No critical control is hover-only, drag-only or hidden in an unlabeled icon.

## Data Mapping

| BE response | Components consuming exact fields |
|---|---|
| Content type/version/field/relation registry, compile artifact and impact job | `ContentTypeRegistry`, `SchemaDesigner`, `FieldDefinitionEditor`, `RelationDefinitionEditor`, `CompatibilityReport` |
| Migration plan `{ class,state,cursor,migratedCount,failedCount,version }`, dry-run report and job | `MigrationWorkbench`, `SchemaActivationFlow`, `JobStatus` |
| Entry/current revision/editor manifest/presence/ETag | `EntryWorkbench`, `EntryEditor`, `AutosaveStatus`, `PresenceStrip` |
| Revision page/diff/conflict `{ base,theirs,yours,paths }` and migration path | `RevisionTimeline`, `RevisionCompare`, `RevisionConflictResolver`, `RestoreRevisionFlow` |
| Review `{ frozenHash,dependencyManifest,riskClass,state,decisions,version }` and preflight checks | `ReviewPanel`, `PreflightReport`, `PublicationPanel` |
| Schedule `{ action,localDatetime,timezone,resolvedAtUtc,tzdbVersion,state,version }` and publication version | `ScheduleEditor`, `PublicationPanel` |
| Block/template/pattern/composition registry and impact/diff | `BlockRegistry`, `TemplateDesigner`, `PatternDesigner`, `PatternUpdateReview` |
| Preview `{ previewUrl,expiresAt,versionSetHash }` and authorized render controls | `PreviewShell` |
| Taxonomy/version/term/impact and merge job | `TaxonomyWorkbench` |
| Locale variant/source-field hashes/fallback resolutions | `LocaleEditor`, `FallbackInspector` |
| Related curation `{ pins,exclusions,derivedRules,reasons,version }` and eligible candidates | `RelatedContentEditor` |

No component consumes arbitrary validator/render code, SQL, raw executable HTML/CSS, wildcard domain rows, relation target private fields, migration payload bodies, preview token hashes, public cache internals or service credentials.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | every named role/state; field-kind validation; missing/null/empty/default/fallback; autosave announcements; keyboard reorder; linear diff; DST choice; stale locale; hidden-field DOM absence |
| Contract | all 03a-c success/errors, ETags/idempotency, no-store/redaction, cursor policy, state registries, immutable active versions, job transitions and exact version sets |
| E2E | type/field/relation create, compile/impact, migration dry-run/run/activate, entry autosave/conflict/restore, review separation, schedule/DST/publish/unpublish, template/pattern diff, preview expiry, taxonomy merge, locale stale/no-fallback, related curation |
| Accessibility | keyboard/AT field manifests, reordering, statuses, semantic diffs, preview return, preflight, schedule, locale and responsive workbenches |
| Security | reserved-domain smuggling, arbitrary code/style, relation BOLA, preview forwarding/revocation, self/stale approval, protected review assignment, no public draft/cache leak |
| Performance | registry/editor initial JS <=120KB, guided flow <=100KB, each island <=50KB unless approved; virtualize only after semantic table/list remains accessible; no hydration waterfall |

## Deepening Record

1. **State synchronization**: definitions, revisions, presence, review, dependencies, schedule, migration, publication, preview, taxonomy and locale converge on server versions.
2. **Network degradation**: safe drafting versus fail-closed activation/publish, failed autosave, stale preview and last-known-good public output are explicit.
3. **Flow sequencing**: CMS-01..16 map to routes/components and preserve compile, impact, migration, review, preflight and canonical commit order.
4. **Responsive/touch**: registries, outlines, composers, diffs, preflight and operations retain complete information and keyboard/touch parity.
5. **State exhaustion**: every schema, migration, revision, review, schedule, publication, template, preview, taxonomy, locale and related state maps to rendered behavior.
6. **Role exhaustion**: all eight IA capabilities have explicit cells and named variants; service principals receive no interactive UI.
7. **Accessibility edge cases**: conditional fields, autosave, reordering, semantic diff, preview focus, publish gates, DST and locale language/fallback behavior are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, states, validation timing, errors, role variants, responsive behavior and inline accessibility requirements.
- **Macro**: routes/flows cover CMS-01..16 while preserving bounded registries, immutable versions, explicit conflicts, separation of duties, code-owned rendering, exact previews and fail-closed legal/accessibility/publication gates.
- **Two-implementer assertion**: independent implementers choose the same registry boundaries, autosave timing, merge behavior, migration sequence, review invalidation, schedule/DST semantics, block/template limits, preview scope, taxonomy merge and locale fallback.
- **Devil's advocate**: no UI can smuggle a canonical domain into CMS, upload executable behavior, overwrite same-field edits, mutate history, self-approve protected content, publish stale dependencies, treat preview as public/accessibility proof, override profile provenance, duplicate canonical taxonomy or borrow legal text by fallback.
- **Result**: PASS.

## Open Questions

None. Plugins/themes and arbitrary executable customization remain excluded. CMS administrators configure only governed, registered and versioned variables; security, authority, legal, money, migration and state-machine invariants remain code/rule-pack owned.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete CMS content modeling and authoring frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by
- [[specs/fe/00-infrastructure|FE 00 Infrastructure]]
- [[specs/fe/01-identity-authority|FE 01 Identity Authority]]
- [[specs/fe/02-profiles-verification|FE 02 Profiles and Claiming]]
- [[specs/design-system|Design System]]

### Derives from
- [[specs/ia/03-cms-content-modeling|Shard 03 IA]]
- [[specs/ia/deep-dives/03-cms-content-modeling|CMS Content Modeling Deep Dive]]
- [[specs/be/03a-content-schema-registry|BE 03a]]
- [[specs/be/03b-editorial-workflow-publication|BE 03b]]
- [[specs/be/03c-composition-taxonomy-localization|BE 03c]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/03-cms-content-modeling|Deep Dive 03 — CMS content modeling and authoring]]

### References
- [[specs/be/03a-content-schema-registry|CMS content types, schema registry and migrations — Backend Specification]]
- [[specs/be/03b-editorial-workflow-publication|CMS entries, revisions, review, scheduling and publication — Backend Specification]]
- [[specs/be/03c-composition-taxonomy-localization|CMS blocks, templates, preview, taxonomy, localization and related content — Backend Specification]]
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/ia/deep-dives/03-cms-content-modeling|Deep Dive 03 — CMS content modeling and authoring]]
- [[specs/design-system|Design System]]
- [[specs/fe/02-profiles-verification|Profiles, Claiming and Qualifications - Frontend Specification]]
