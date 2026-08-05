# CMS Navigation, Media and Delivery - Frontend Specification

> **BE Sources**: [[specs/be/04a-navigation-routes-discovery|Navigation Routes and Discovery]], [[specs/be/04b-governed-media-renditions|Governed Media and Renditions]], [[specs/be/04c-public-delivery-cache|Public Delivery and Cache]]  
> **IA Source**: [[specs/ia/04-cms-delivery-media|Shard 04 CMS Navigation, Media and Delivery]]  
> **Status**: Complete

## Classification

- **Type**: Feature specification spanning three backend contracts that share navigation, governed media and public-delivery control surfaces.
- **Surface**: Capability-gated menu/route/discovery and media workbenches; exact-version preview and delivery operations; public navigation/content/media projections.
- **Approval**: Recommended grouping and source map approved under standing owner autonomy.
- **Cross-cutting dependency**: Global state, request, job, upload, offline and accessibility behavior inherits [[specs/fe/00-infrastructure|FE 00]]. Acting context inherits [[specs/fe/01-identity-authority|FE 01]]. Editorial version/review/publication semantics inherit [[specs/fe/03-cms-content-modeling|FE 03]].

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/04-cms-delivery-media|Shard 04 IA]] | Features, Interactions DLV-01..12, Contracts, Access Control, Accessibility, Edge Cases |
| IA deep dive | [[specs/ia/deep-dives/04-cms-delivery-media|CMS Delivery and Media Deep Dive]] | route compilation, private media, rights eligibility, projection switching, cache and urgent purge |
| Backend | [[specs/be/04a-navigation-routes-discovery|04a]] | menus, routes, redirects, discovery metadata and route manifests |
| Backend | [[specs/be/04b-governed-media-renditions|04b]] | ingest, inspection, rights, accessibility metadata, renditions, references and lifecycle |
| Backend | [[specs/be/04c-public-delivery-cache|04c]] | public reads, preview, projection readiness, rebuild, purge and recovery |
| Cross-cutting FE | [[specs/fe/00-infrastructure|FE 00]] | shells, global states, errors, jobs, upload, offline and breakpoints |
| Editorial FE | [[specs/fe/03-cms-content-modeling|FE 03]] | immutable versions, review, preflight, preview grant and publication |
| Design | [[specs/design-system|Design System]] | Settings/Registry, List-to-Detail Workbench, Guided Form, Admin Operations and public navigation |

## Source Map

| FE section | Source |
|---|---|
| Menu tree, visibility and activation | BE 04a § Locked Contracts/API Endpoint Matrix; IA DLV-01..02 |
| Slugs, redirects and discovery metadata | BE 04a § API Endpoint Matrix/State Machine Registry; IA DLV-03..04 |
| Asset ingest, rights, accessibility and renditions | BE 04b § Media Invariants/API Endpoint Matrix; IA DLV-05..07 |
| Reference replacement and takedown | BE 04b § API Endpoint Matrix/State Machine Registry; IA DLV-08 |
| Public content/preview/projection/recovery | BE 04c § API and Consumer Matrix; IA DLV-09..12 |
| Role rendering | IA 04 § Access Control; BE RLS/authorization contracts |
| Accessibility | IA 04 § Accessibility; media/accessibility records; FE 00 |
| Responsive and visual behavior | Design System; FE 00 responsive contract |

## Design Requirements

**Direction**: Quiet operational precision. Navigation tools expose hierarchy and reachability; media tools expose readiness, rights, accessibility and references; public delivery remains editorial and unobtrusive.  
**Typography**: Source Sans 3 for labels/content; IBM Plex Mono for paths, hashes, versions, checksums, MIME types, transform profiles and purge IDs.  
**Colors**: restrained Paper/Surface/Graphite. Jam Magenta marks current selection or one primary action, never rights, scan, readiness or accessibility status.  
**Motion**: 150-220ms bounded feedback; no autoplay, animated tree flourish, upload celebration or delivery dashboard theatrics. Reduced motion disables nonessential transitions.  
**Anti-patterns**: no drag-only menus, menu-as-authorization, arbitrary visibility expressions, open redirects, public originals, upload-implies-rights, inaccessible media fallback, silent asset swap, preview leakage, stale revoked output or failure rendered as empty content.

## Design System Compliance

- **Archetypes**: Settings/Registry for routes/discovery/media; List-to-Detail Workbench for menus/assets/delivery; Guided Form for route/rights/replacement; Admin Operations for activation, purge and recovery; public shell for active navigation/content.
- **Global components consumed**: `<PageShell>`, public/admin navigation families, `<ActingContextSwitcher>`, `<Workbench>`, `<RecordHeader>`, `<StateLabel>`, `<FilterBar>`, `<DataTable>`, `<Timeline>`, `<ActionBar>`, `<ConfirmationStep>`, `<CapabilityGate>`, `<JobStatus>`, `<UploadManager>`, `<MediaPlayer>`, `<InlineMessage>`, `<ErrorBoundary>`.
- **States**: every data view inherits FE 00 `idle|loading|empty|success|optimistic_pending|optimistic_rollback|disabled|blocked|forbidden|conflict|offline|stale|degraded|failed|absent`. Activation, rights, lifecycle, delivery pointer and purge never show optimistic success.
- **Empty/error language**: no menu items/assets/content may be valid emptiness only after successful reads. Quarantine, hidden navigation, denied target, unavailable content, removed media and degraded delivery are distinct.

## Page and Route Definitions

| Route | Archetype and guard | Primary components | Deep-link and navigation behavior |
|---|---|---|---|
| `/admin/cms/navigation` | Navigation editor workbench | `MenuWorkbench` | URL stores location/locale/audience and selected menu version; active and draft remain distinct. |
| `/admin/cms/navigation/{menuId}/versions/{versionId}` | Navigation editor detail | `MenuTreeEditor`, `MenuPreview`, `MenuActivationPanel` | Exact draft hash/target impact refetches; URL never grants activation. |
| `/admin/cms/routes` | Navigation editor registry | `RouteRegistry` | Path/locale/state filters in URL; retired/reserved paths remain visible. |
| `/admin/cms/routes/{routeId}` | Guided route form | `RouteEditor`, `RedirectImpact` | Canonical route and permanent redirect history load together. |
| `/admin/cms/discovery/{publicationId}` | Navigation editor/publisher registry | `DiscoveryMetadataEditor` | Policy overrides and blockers always server-derived. |
| `/admin/media` | Contributor/curator workbench | `MediaLibrary` | URL stores safe purpose/state/type query and selected asset; no dedup owner inference. |
| `/admin/media/upload` | Contributor guided upload | `AssetIngestFlow` | Pending asset ID survives navigation; upload intent expiry is canonical. |
| `/admin/media/{assetId}` | Viewer-relative media record | `AssetRecord`, `RightsEditor`, `AccessibilityMetadataEditor`, `RenditionManager` | Concealment-safe 404; selected tab does not broaden capability. |
| `/admin/media/{assetId}/references` | Curator/operator impact workbench | `AssetReferenceWorkbench` | Cursor/use query allowlisted; reference existence follows scoped projection. |
| `/admin/media/{assetId}/lifecycle` | Assigned lifecycle transaction | `AssetLifecycleFlow`, `PurgeStatus` | MFA/reason and current reference/hold/retention state rechecked. |
| `/admin/cms/publications/{publicationId}/delivery` | Publisher/operator operations | `DeliveryStatusBoard`, `ProjectionRebuildFlow` | Exact expected/current consumer versions; refresh reconciles jobs. |
| `/admin/delivery/purges/{purgeId}` | Assigned operator operations | `PurgeStatus`, `RecoveryComparison` | Partial urgent purge remains open and prominent. |
| `/preview/{token}` | Exact authorized preview | `DeliveryPreview` | No-store/noindex; every open reauthorizes; denied/expired is existence-safe. |
| `/api/v1/content/by-route` | Public server-consumed read model | public route renderer | Audience derived server-side; immutable publication/ETag; no client authority input. |
| public route manifest paths | Public shell | `PublicNavigation`, content renderer, `PublicMedia` | Only active pointer projections; canonical redirects handled before render. |

Service delivery principals have no interactive UI. Preview/admin routes never enter public navigation, cache, search or sitemap.

## Component Inventory

Every component inherits FE 00 request timeouts, request-ID persistence, upload/job semantics, no blind mutation retries, offline policy and focus restoration. Canonical state is server/version owned.

### Navigation, Route and Discovery Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<MenuWorkbench menus: MenuSummaryPage; query: MenuQuery; selected?: MenuVersionProjection; capabilities: MenuCapability[]>` | `loading|empty|success|degraded|failed`; filters location/locale/audience/state. Selection never activates or changes audience. | Semantic table becomes labelled records; result count announced; location and active version textual. |
| `<MenuTreeEditor menu: MenuProjection; version: MenuVersionProjection; targets: EligibleTargetPage; limits: MenuLimits; etag: ETag>` | `draft|validating|approved|active|superseded|rejected|cycle|orphan|limit_exceeded|target_ineligible|conflict`; full tree only. Item fields: label, target, parent, order, bounded visibility and current-state semantics. | Semantic tree/list, keyboard expand/move/indent/outdent, visible focus and destination announcement; drag optional; mobile uses outline then item editor. |
| `<MenuVisibilityEditor value: VisibilityPredicate[]; vocabulary: VisibilityDefinition[]>` | AND-only registered predicates `always|anonymous|authenticated|locale|capability|entitlement|feature_available`; no arbitrary expression or sensitive client signal. | Plain-language summary and equivalent-route warning; dynamic fields announced; no menu state presented as access grant. |
| `<MenuPreview tree: MenuPreviewProjection; viewport: ViewportClass; locale: BCP47; audience: AudienceClass>` | `loading|success|target_changed|failed`; exact coherent tree preview, no-store. Preview never substitutes route authorization. | Public semantic landmark/list behavior, current-page state, skip links, disclosure keyboard support and no hover dependence. |
| `<MenuActivationPanel version: MenuVersionProjection; targetImpact: TargetImpactProjection; approval: ApprovalProjection; etag: ETag>` | `blocked|ready|step_up|activating|active|target_changed|approval_invalid|conflict|failed`; exact tree hash and current targets required. | Blockers precede action; confirmation names location/locale/audience and replaced active version; step-up restores initiator. |
| `<RouteRegistry routes: RouteSummaryPage; query: RouteQuery>` | `loading|empty|success|degraded|failed`; canonical/redirect/retired/reserved states. Retired source remains reserved. | Path/locale/state table with mono path; responsive labelled rows; filters/results announced. |
| `<RouteEditor route?: RouteProjection; publication: SafePublicationReference; reservedPrefixes: string[]; etag?: ETag>` | `editing|normalized|collision|reserved|invalid|submitting|success|conflict|failed`; NFC/locale-lowercase safe path preview. Change creates permanent old-path redirect. | Persistent path label; normalized/canonical preview announced after pause; exact safe collision/segment error linked to field. |
| `<RedirectImpact redirect?: RedirectProjection; graph: RedirectGraphProjection; inboundCount: number>` | Validates internal/allowlisted HTTPS destination, no open redirect, cycle or chain over five. `valid|loop|hop_limit|collision|unsafe|stale`. | Source/destination and hop chain in linear ordered list; errors name safe collision without protected target leak. |
| `<DiscoveryMetadataEditor publication: PublicationSummary; value: DiscoveryMetadataProjection; policy: DiscoveryPolicyProjection; etag: ETag>` | Bounded title/description/canonical/noindex/social/breadcrumb/structured fields. `editing|valid|policy_overridden|blocked|submitting|success|conflict|failed`; privacy/embargo/legal/safety wins. | Normalized canonical/social preview, language and social-image alt explicit; policy override text, not color; errors tied to fields. |

### Media Governance Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<MediaLibrary assets: AssetSummaryPage; query: AssetQuery; selected?: AssetProjection; capabilities: MediaCapability[]>` | `loading|empty|success|degraded|failed`; filters purpose/type/state/rights/accessibility. Grid and list share exact records/actions. | Equivalent semantic list/table view; grid never sole access; keyboard selection; state/count announced. |
| `<AssetIngestFlow owner: SafeOwnerReference; purposeProfiles: MediaPurposeProfile[]; intent?: UploadIntentProjection; asset?: AssetProjection>` | `selecting|validating|intent_ready|uploading|uploaded|inspecting|ready|quarantined|rejected|expired|quota|failed`; validates declared type/size/checksum before 15-minute private upload. Completion always enters inspection job. | Inherits accessible upload manager; per-item progress/errors announced; retry names item/action; no hidden auto-upload; single-column mobile. |
| `<AssetRecord asset: AssetProjection; inspection: InspectionProjection; rightsSummary: RightsSummary; accessibilitySummary: AccessibilitySummary; referenceCount: number>` | Read-only canonical metadata, checksum class, scan state, lifecycle, rights/accessibility/reference summaries. Duplicate suggestion reveals no owner/reference. | Definition list with explicit state; preview only for authorized safe object; mono technical values have descriptive labels. |
| `<RightsEditor asset: AssetProjection; right?: AssetRightProjection; schema: RightsSchema; etag: ETag>` | claimant/rightsholder/source/basis/use/territory/term/audience/attribution/consent/evidence. `editing|asserted|active|rejected|disputed|expired|revoked|superseded|validation_error|conflict`; assertion never means verified. | Grouped fieldsets; consequences/limits read before submit; rights state textual; evidence upload protected and excluded from browser persistence. |
| `<AccessibilityMetadataEditor asset: AssetProjection; useCode: string; locale: BCP47; record?: AssetAccessibilityProjection; requirements: AccessibilityRequirement[]>` | Image requires meaningful alt or explicit decorative empty alt; audio/video requires use-specific captions/transcript; focal point where relevant. `draft|approved|rejected|stale|incomplete|conflict`. | Instructions and preview; decorative choice explicit, not blank bypass; language/track labels; keyboard focal alternative with coordinate fields. |
| `<RenditionManager asset: AssetProjection; renditions: RenditionProjection[]; profiles: TransformProfileProjection[]; jobs: JobStatusResponse[]>` | `empty|queued|processing|ready|rejected|quarantined|stale|source_not_ready|rights_ineligible|accessibility_incomplete|profile_retired|failed`; exact registered profile/use/locale/audience only. | Job/status announcements; rendition table/list identifies profile and blocker; no arbitrary crop/transform expression. |
| `<AssetReferenceWorkbench asset: AssetProjection; page: AssetReferencePage; query: AssetReferenceQuery>` | `loading|empty|success|degraded|failed`; exact source type/id/version/path/use/locale/audience/period projection. Missing authorization is absent, not redacted count inference. | Semantic table/labelled rows; filter count announced; each reference has descriptive target/action. |
| `<ReplacementPlanFlow source: AssetProjection; successor: AssetProjection; references: AssetReferencePage; decisions: ReferenceReplacementDraft[]; etag: ETag>` | `review|semantic_change|crop_change|rights_change|submitting|queued|completed|references_changed|ineligible|conflict|failed`; every scoped reference gets replace/retain/remove decision. No global silent swap. | Linear per-reference review canonical; desktop comparison optional; changed meaning/crop/rights announced before confirm. |
| `<AssetLifecycleFlow asset: AssetProjection; action: "replace"|"revoke"|"archive"|"erase"|"hold"|"release_hold"; impact: LifecycleImpactProjection; etag: ETag>` | `blocked|review|step_up|submitting|queued|completed|partial|hold|retention|references|conflict|failed`; urgent revoke removes delivery eligibility before provider purge. | Consequence, scope, retained evidence and reversibility explicit; destructive confirm not default-focused; focus returns to state heading. |

### Delivery and Public Components

| Component and props interface | States, interactions and validation | Responsive/accessibility contract |
|---|---|---|
| `<DeliveryPreview render: PreviewProjection; versionSetHash: string; audience: AudienceClass; locale: BCP47; expiresAt: ISODateTime>` | `loading|success|forbidden|absent|expired|dependency_unavailable|failed`; exact no-store/noindex render; current user/context/capability rechecked. | Preview controls labelled; close restores authoring focus; preview frame title and language explicit; denial leaks no draft existence. |
| `<DeliveryStatusBoard publication: PublicationSummary; projection: PublicationProjectionStatus; consumers: ConsumerStatusProjection[]>` | projection `pending|building|ready|failed|blocked|stale|superseded`; consumers `pending|running|ready|failed_retryable|dead_letter|suppressed`. Required readiness blocks pointer; optional lag labelled. | Status table with expected/current versions and recovery; updates polite; required/optional expressed in text. |
| `<ProjectionRebuildFlow publication: PublicationSummary; consumers: RebuildableConsumer[]; currentJob?: JobStatusResponse>` | `select|review|submitting|queued|running|completed|partial|failed|superseded|unknown_consumer`; exact current publication/version and named consumers only. | Checkbox group with impact; job announcement; partial result links each failed consumer. |
| `<PurgeStatus purge: DeliveryPurgeProjection; attempts: PurgeAttemptProjection[]; job?: JobStatusResponse>` | `pending|running|completed|partial|failed_retryable|blocked`; urgent partial remains incident-open and never reads complete. | Urgency, scope and provider evidence textual; timeline semantic; no green state from partial response. |
| `<RecoveryComparison comparison: RecoveryComparisonProjection; syntheticChecks: SyntheticCheckProjection[]>` | `queued|running|completed|partial|failed|unsafe|unknown`; compares canonical publication/manifest/purge with providers, rebuilds/purges and verifies routes/media. | Results grouped by consumer; unknown/unsafe announced as unavailable, not healthy; retry controls keyboard operable. |
| `<PublicNavigation locations: PublicMenuProjection[]; currentPath: string; userAudience: PublicAudienceProjection>` | Server-rendered active complete trees only. `success|absent|degraded`; hidden item never means route denial and direct routes independently authorize. | Semantic nav/list, skip link, visible focus, current-page state, keyboard/mobile disclosure, equivalent route reachability and no hover-only path. |
| `<PublicMedia media: EligibleMediaProjection; fallback?: ApprovedMediaFallback>` | `loading|ready|unavailable|revoked|takedown|degraded|failed`; serves eligible rendition/grant only, never original accidentally. No autoplay. | Alt/decorative state, captions/transcript, keyboard player, contrast/focus and reduced-motion behavior; removed content yields truthful status. |
| `<PublicDeliveryBoundary content?: PublicContentProjection; delivery: DeliveryHealthProjection; requestId?: string>` | `loading|success|degraded_lkg|unavailable|absent|revoked|failed`; last-known-good only if currently authorized, within staleness policy and unaffected by urgent revocation. Dependency failure never becomes empty. | Status content uses heading/live region only when needed; request ID available on persistent failure; absent and unavailable have distinct copy. |

## State Management and Navigation

| State | Owner and persistence |
|---|---|
| Menu/route/discovery | Server immutable versions and complete manifest hash; URL stores safe selection/query only. |
| Asset/rights/accessibility/rendition/reference | Server canonical version. Bytes remain private; client holds upload handle and bounded draft metadata only. |
| Public projection | Server active pointer by route/locale/audience/publication/version; client never assembles draft/control records. |
| Preview | Opaque short grant bound to user/context/version/audience; no-store and no local persistence. |
| Cache/degraded status | Server response/version headers; client may render labelled safe cached projection but cannot decide LKG eligibility. |
| Jobs/purge/recovery | Stable server ID and attempts survive refresh; terminal state stops polling; events trigger refetch only. |

- Browser back/forward restores selected menu/route/asset/tab only if still authorized; otherwise concealment-safe absence or current state renders.
- Unsaved-change guards cover menu, route, discovery, rights, accessibility and replacement drafts. They never obstruct urgent revocation/takedown.
- Multi-tab conflicts preserve safe draft and compare against current version. No menu/route/rights/lifecycle last-write-wins.
- Offline public pages may render labelled eligible cached content under FE 00; all admin mutation, upload completion, preview, signed media grant, activation, rebuild and purge require network.
- Logout/acting-context change purges private local caches and media grants. Cache keys include user, party, audience, contract and entity/publication version.

## Interaction Flows

### Navigation and Discovery

1. Editor creates a complete draft tree for one named location/locale/audience using typed eligible targets and bounded visibility.
2. Tree validation rejects cycles, orphans, depth/item/sibling limits and target changes; keyboard ordering produces the same canonical order as pointer movement.
3. Preview renders coherent responsive/audience variants; publisher reviews exact hash/targets and activates atomically.
4. Route create/change normalizes path, rejects reserved/collision/loop/hop/open-redirect issues and preserves permanent old-path history.
5. Discovery metadata validates fields then applies privacy/embargo/legal/safety overrides last.

### Media Ingest and Governance

1. Contributor selects owner/purpose/file; client validates declared limits and obtains a 15-minute private upload intent.
2. Completion verifies size/checksum then enters detection, metadata and scanning. Scanner outage or mismatch stays quarantined.
3. Rights and accessibility are separately attributable records; upload and byte dedup grant neither.
4. Rendition job rechecks source, rights, use, audience and accessibility against a registered transform profile.
5. Replacement enumerates every reference and requires per-reference meaning/crop/right decision.
6. Revoke/takedown atomically removes eligibility and opens purge before provider cleanup; holds/retention preserve required evidence.

### Delivery, Degradation and Recovery

1. Public query derives audience server-side and selects exact active projection/ETag; preview uses separate no-store path.
2. Publication worker builds required route/render/menu/media and allowed optional consumers under one version.
3. Coordinator switches active pointer only when all required consumers are ready; stale builders cannot win.
4. Failure serves only eligible last-known-good with truthful degraded status. Unsafe/revoked/unknown returns unavailable.
5. Recovery compares canonical and provider states, rebuilds/purges, runs synthetic route/media checks and retains partial incidents until complete evidence.

## Error-to-UI Matrix

| Code | Component state and copy intent | Recovery |
|---|---|---|
| `TREE_CYCLE`, `LIMIT_EXCEEDED`, `TARGET_INELIGIBLE` | Menu draft blocked | Focus first invalid item; correct hierarchy/target while active tree remains. |
| `TARGET_CHANGED`, `APPROVAL_INVALID`, `ACTIVE_VERSION_CHANGED` | Menu activation stale | Refetch target impact/hash and obtain current approval. |
| `ROUTE_COLLISION`, `RESERVED_ROUTE`, `PATH_INVALID` | Route field error | Show normalized safe conflict/prefix and choose another path. |
| `REDIRECT_LOOP`, `OPEN_REDIRECT`, `HOP_LIMIT` | Redirect graph blocked | Correct destination/chain; preserve active manifest. |
| `POLICY_BLOCKED`, `METADATA_INVALID` | Discovery override/validation | Show policy-owned blocker or exact field issue; no override switch. |
| `QUOTA`, `CHECKSUM`, `SIZE`, `EXPIRED` | Upload item blocked/expired | Retry eligible intent/upload for same pending asset; no blind completion replay. |
| scanner/provider `502|503|504` | Asset quarantined/inspection delayed | Preserve pending asset and retry job later; never mark ready. |
| `RIGHT_SCHEMA_INVALID`, `RIGHT_OVERLAP` | Rights form conflict | Correct scoped right or review current overlap; no ownership inference. |
| `ACCESSIBILITY_INCOMPLETE` | Accessibility/rendition blocker | Add required alt/decorative/caption/transcript data for exact use/locale. |
| `SOURCE_NOT_READY`, `RIGHTS_INELIGIBLE`, `PROFILE_RETIRED` | Rendition blocked | Resolve source/right or select current registered profile; never expose original. |
| `REPLACEMENT_INELIGIBLE`, `REFERENCES_CHANGED` | Replacement plan stale | Refetch references and re-review each decision. |
| `HOLD`, `REFERENCES`, `RETENTION` | Lifecycle action blocked | Show safe blocker classes and legitimate review route; urgent revoke still removes delivery when allowed. |
| `MEDIA_DELIVERY_FORBIDDEN`, `RIGHT_REVOKED` | Public/admin media unavailable | Stop playback/display truthful state; do not retry signed URL blindly. |
| `CONTENT_UNAVAILABLE` | Public degraded/unavailable | Serve eligible LKG if server provides it; otherwise explicit unavailable with request ID. |
| `PUBLICATION_SUPERSEDED`, `CONSUMER_UNKNOWN` | Rebuild stale/invalid | Refetch current publication and supported consumers. |
| `SCOPE_STALE`, `PURGE_EXISTS` | Purge conflict | Open current purge and compare current scope; no duplicate incident. |
| `STEP_UP_REQUIRED`, `VERSION_CONFLICT` | Protected interruption/conflict | Step up and restore context or refetch/compare current version. |

Persistent errors include request ID. Preview tokens, signed URLs, filenames as storage keys, byte content, rights evidence, other owners, protected targets and provider secrets never enter URLs, toast detail or telemetry.

## Conditional Rendering Matrix

| Feature/component | Navigation editor | Media contributor | Media curator | CMS publisher | Rights/safety operator | Preview user | Public visitor | Delivery principal |
|---|---|---|---|---|---|---|---|---|
| Menu/route/discovery | full draft/preview | hidden | hidden | approve/activate exact validated set | assigned safety blocker read only | exact preview only | active public navigation | no UI; exact compile job |
| Media library/record | referenced safe media only | own-purpose full ingest/metadata | full eligible review/reference | publication eligibility read | assigned case minimum | selected preview media | eligible public media only | no UI; one object/use |
| Rights/accessibility | discovery/social alt fields only | assert own-scope right and metadata | review accessibility/rendition, not adjudicate rights | eligibility/preflight read | assigned restrict/revoke/hold | exact selected projection | public allowed labels only | hidden |
| Renditions | selected social preview only | request eligible profile | full eligible management | publication readiness read | assigned revoke state | exact preview rendition | active eligible rendition | no UI; exact transform job |
| Replacement/lifecycle | route impact read | own-scope replacement proposal | review reference impact | publication impact read | full assigned lifecycle after MFA | updated exact preview only | truthful unavailable/replacement | no UI; purge execution only |
| Delivery status/rebuild | manifest impact read | hidden | media consumer read | full current publication operations | purge/incident subset | hidden | safe degraded status only | no UI; exact consumer job |
| Preview | own exact menu/route | own exact media | eligible exact media | exact publication set | assigned case preview only | full exact authorized grant | hidden | hidden |

Named variants: `navigationDraft`, `contributorOwnerPurpose`, `curatorMetadataUse`, `publisherValidatedSet`, `operatorAssignedLifecycle`, `previewExactGrant`, `publicActiveProjection`, `deliveryExactJobNoUi`.

## Accessibility Inventory

| Component/interaction | WCAG | Keyboard/focus | Screen-reader behavior | IA source |
|---|---|---|---|---|
| Menu editor/public navigation | 1.3.1, 2.1.1, 2.4.1, 2.4.7 | Move/expand/disclose, visible focus, skip link; drag/hover optional | Announces level, position, destination, current page and disclosure state | IA 04 § Accessibility |
| Conditional navigation | 2.4.5, 3.2.3 | Equivalent direct route remains reachable | Hidden item is never announced as access denial or sole route explanation | IA 04 § Accessibility |
| Route/SEO forms | 3.3.1, 3.3.2 | Error links path/metadata field | Announces normalized path, collision/loop, canonical URL, language and social-image alt | IA 04 § Accessibility |
| Upload/rendition status | 4.1.3, 2.2.1 | Per-item retry/cancel keyboard operable | Announces progress, inspection, quarantine, failure item and recovery | IA 04 § Accessibility |
| Media library | 1.3.1, 1.4.10, 2.1.1 | Grid and equivalent list/table keyboard access | Same asset fields/states/actions in each view | IA 04 § Accessibility |
| Alt/caption/transcript/focal | 1.1.1, 1.2.1-1.2.5, 3.3.2 | Controls/previews keyboard complete; coordinate fallback for focal point | Decorative choice explicit; requirements/incomplete state announced | IA 04 § Accessibility |
| Public media player | 1.2.1-1.2.5, 2.1.1, 2.2.2, 1.4.3 | Full controls, no autoplay, reduced motion | Captions/transcript/role and unavailable/takedown state announced | IA 04 § Accessibility |
| Degraded/unavailable content | 1.3.1, 4.1.3 | Retry/navigation remains reachable | Distinguishes degraded LKG, unavailable, revoked, absent and failed | IA 04 § Accessibility |

Release tests include keyboard-only, NVDA+Firefox, VoiceOver+Safari, 200%/400% reflow, forced colors, reduced motion, media tracks, menu disclosure/focus restoration and zero axe Critical/Serious findings.

## Responsive Behavior

| Width | Navigation/routes | Media library/editor | Delivery operations/public |
|---|---|---|---|
| `<=768px` | Tree outline then item editor; keyboard move controls adjacent; route impact linear | List view default; selected asset tabs stack; upload/progress full width | Consumer/purge rows labelled; public nav disclosure keyboard-safe; media fits width |
| `769-1024px` | Conditional tree/detail split; preview below editor when needed | Grid/list with detail drawer only if focus order remains valid | Status/detail split; public nav follows design location contract |
| `>=1025px` | Tree, item editor and preview/impact rail with canonical DOM order | Grid/list plus record detail/reference rail; no hover-only actions | Status table plus action rail; public navigation stays restrained and content-led |

At every width, current location/path/version, asset readiness/rights/accessibility, publication version and degraded/revoked state remain textual. Touch and keyboard provide equivalent tree, filter, media and lifecycle behavior.

## Data Mapping

| BE response | Components consuming exact fields |
|---|---|
| Menu/version/items/tree hash/target impact/approval | `MenuWorkbench`, `MenuTreeEditor`, `MenuVisibilityEditor`, `MenuPreview`, `MenuActivationPanel` |
| Route/redirect/manifest/discovery metadata and policy blockers | `RouteRegistry`, `RouteEditor`, `RedirectImpact`, `DiscoveryMetadataEditor` |
| Upload intent/pending asset/inspection/job and asset ETag | `AssetIngestFlow`, `AssetRecord`, `JobStatus` |
| Asset right/accessibility/rendition/reference projections | `RightsEditor`, `AccessibilityMetadataEditor`, `RenditionManager`, `AssetReferenceWorkbench` |
| Replacement/lifecycle impact, purge and attempt evidence | `ReplacementPlanFlow`, `AssetLifecycleFlow`, `PurgeStatus` |
| Public resource/render descriptor/publication version/ETag/cache policy | `PublicNavigation`, `PublicMedia`, `PublicDeliveryBoundary` |
| Preview projection/version-set/audience/locale/expiry | `DeliveryPreview` |
| Publication delivery status and consumer expected/current version/state | `DeliveryStatusBoard`, `ProjectionRebuildFlow` |
| Recovery comparison and synthetic route/media checks | `RecoveryComparison` |

No component consumes draft/control data on public routes, arbitrary visibility or transform expressions, other dedup owners, raw bytes/evidence, preview token hashes, signed URL secrets, provider credentials or unrestricted storage keys.

## Test Contract

| Level | Required coverage |
|---|---|
| Component | all named roles/states; keyboard tree/reorder; route normalization/graph; grid-list equivalence; upload progress; decorative/alt/caption rules; partial purge and degraded-versus-empty |
| Contract | all 04a-c success/errors, ETags/idempotency, no-store/redaction, cursor behavior, state registries, exact manifest/projection versions, jobs and cache headers |
| E2E | menu create/preview/activate, slug change/redirect collision, policy SEO override, ingest/quarantine/dedup non-disclosure, rights/a11y/rendition, replacement/takedown, preview denial, projection switch/rebuild, LKG and urgent partial purge recovery |
| Accessibility | keyboard/AT menus, disclosures, forms, upload/jobs, grid/list, media metadata/player, degraded status and responsive workbenches |
| Security | menu-not-auth, reserved/open redirect, preview BOLA/cache leak, private original, polyglot/scanner outage, rights overreach, signed capability scope, stale revoked cache denial |
| Performance | public navigation/content initial JS <=70KB, admin workbench <=120KB, each island <=50KB unless approved; responsive images/media; no hydration waterfall |

## Deepening Record

1. **State synchronization**: menu, route, manifest, asset, right, accessibility, rendition, reference, projection, pointer and purge converge on exact server versions.
2. **Network degradation**: quarantine, stalled jobs, required/optional consumers, last-known-good eligibility and urgent independent purge are explicit.
3. **Flow sequencing**: DLV-01..12 map to routes/components and preserve validate, preview, approve, activate, inspect, authorize, build, switch and recover order.
4. **Responsive/touch**: trees, grids/lists, media controls, impacts and operations retain full information and keyboard/touch parity.
5. **State exhaustion**: every menu/route/redirect/discovery/asset/right/accessibility/rendition/projection/purge state maps to rendered behavior.
6. **Role exhaustion**: all eight IA capabilities have explicit cells and named variants; delivery principals receive no interactive UI.
7. **Accessibility edge cases**: menu reachability, normalized route feedback, upload/job status, equivalent media list, metadata requirements, players and degraded states are explicit.

Passes 1-7 converge. No new dependency or product decision is introduced; passes 8-10 are unnecessary.

## Ambiguity Gate

- **Micro**: every component has props, exhaustive state/error behavior, validation timing, role variant, responsive behavior and inline accessibility contract.
- **Macro**: routes/flows cover DLV-01..12 while preserving independent authorization, immutable complete versions, private media, explicit rights/accessibility, atomic readiness and urgent revocation.
- **Two-implementer assertion**: independent implementers choose the same menu limits/visibility, path normalization/redirect rules, ingest quarantine, rights intersection, rendition identity, replacement scope, projection readiness, cache and LKG/purge behavior.
- **Devil's advocate**: no UI can use a hidden menu as denial, shadow a code route, create an open redirect, expose another dedup owner, infer rights from upload, publish without accessibility metadata, swap every reference silently, cache preview, activate partial projections or serve revoked stale content.
- **Result**: PASS.

## Open Questions

None. Menu locations, visibility vocabulary, media purpose/transform profiles, cache classes and purge providers remain governed registries/settings; authorization, reserved routes, rights/privacy/accessibility floors and urgent revocation remain code/policy owned.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete CMS navigation, media and delivery frontend specification | `/write-fe-spec` | All |

## Related Specs

### Constrained by
- [[specs/fe/00-infrastructure|FE 00 Infrastructure]]
- [[specs/fe/01-identity-authority|FE 01 Identity Authority]]
- [[specs/fe/03-cms-content-modeling|FE 03 CMS Content Modeling]]
- [[specs/design-system|Design System]]

### Derives from
- [[specs/ia/04-cms-delivery-media|Shard 04 IA]]
- [[specs/ia/deep-dives/04-cms-delivery-media|CMS Delivery and Media Deep Dive]]
- [[specs/be/04a-navigation-routes-discovery|BE 04a]]
- [[specs/be/04b-governed-media-renditions|BE 04b]]
- [[specs/be/04c-public-delivery-cache|BE 04c]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/04-cms-delivery-media|Deep Dive 04 — CMS navigation, media and delivery]]

### References
- [[specs/be/04a-navigation-routes-discovery|CMS navigation, routes and discovery metadata — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/04c-public-delivery-cache|CMS public delivery, projection convergence and cache coherence — Backend Specification]]
- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/fe/00-infrastructure|Cross-cutting Web Foundation - Frontend Specification]]
- [[specs/fe/01-identity-authority|Identity Authority and Party Governance - Frontend Specification]]
- [[specs/fe/03-cms-content-modeling|CMS Content Modeling and Authoring - Frontend Specification]]
- [[specs/ia/deep-dives/04-cms-delivery-media|Deep Dive 04 — CMS navigation, media and delivery]]
- [[specs/design-system|Design System]]
