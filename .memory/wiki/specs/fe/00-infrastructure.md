# Cross-cutting Web Foundation - Frontend Specification

> **BE Source**: [[specs/be/00-infrastructure|Shard 00 Backend Infrastructure]]  
> **IA Source**: [[specs/ia/00-infrastructure|Shard 00 Cross-cutting Platform Foundation]]  
> **Status**: Complete

## Classification

- **Type**: Cross-cutting frontend foundation.
- **Surface**: Responsive Astro web/PWA with public, authenticated, admin, auth/recovery and system/degraded route families.
- **Reasoning**: This specification owns shared shell, state, feedback, request, job, upload, offline and accessibility behavior consumed by every feature FE specification. It introduces no consumer-domain capability.
- **Approval**: Recommended classification and source mapping approved under standing owner autonomy.

## Referenced Material Inventory

| Class | Source | Sections consumed |
|---|---|---|
| Primary IA | [[specs/ia/00-infrastructure|Shard 00 IA]] | Features, Interactions, Contracts, Access Control, Accessibility, Edge Cases, Surface Applicability |
| Backend source | [[specs/be/00-infrastructure|Shard 00 BE]] | Global Transport Contracts, API Endpoints, Policy/Authorization Matrices, Validation/Error Contract, State Machine Registry |
| Architecture | [[specs/2026-08-02-architecture-design|Architecture Design]] | Frontend Architecture, Error Architecture, Runtime Topology, Security, Observability, Testability |
| Quality | [[specs/ENGINEERING-STANDARDS|Engineering Standards]] | performance, bundle, accessibility, browser and validation gates |
| Design system | [[specs/design-system|Design System]] | navigation, layout, archetypes, global components, motion, density and state language |
| Product context | `PRODUCT.md`, `DESIGN.md` | product register, Working Record direction, tokens, component rules and anti-patterns |

## Source Map

| FE section | Normative source |
|---|---|
| Frontend boundary and component ownership | Architecture Design § Frontend Architecture; Design System § Global Component Inventory |
| Route families and guards | Architecture Design § Runtime and Deployment Topology; IA 00 § Access Control |
| Request, command, job, upload and offline interactions | IA 00 § Interactions; BE 00 § API Endpoints |
| Error and degraded behavior | Architecture Design § Error Architecture; BE 00 § Error Matrix |
| Accessibility annotations | IA 00 § Accessibility; Engineering Standards § Accessibility |
| Responsive behavior | Design System § Layout Grid and Navigation Paradigm |
| Performance and hydration | Engineering Standards § Bundle and Payload Budgets, Web Vitals, API Response Time |
| Test obligations | IA 00 § Observability and Assurance; Architecture Design § Testability Architecture |

No frontend field, state, route or action may be inferred outside these sources. A new global component or cross-route behavior requires contract evolution here before feature use.

## Design Requirements

**Direction**: Product-first restrained utility under The Working Record. Product surfaces prioritize the current task, evidence state and next lawful action.  
**Typography**: Source Sans 3 for shells, controls, forms, tables and prose; IBM Plex Mono only for IDs, versions, timestamps and provenance metadata; Source Serif 4 is unavailable to product-shell controls.  
**Colors**: Paper and Surface backgrounds, Graphite text/primary controls, Seam boundaries, Jam Magenta for rare active/high-value emphasis under 10% of the viewport, and semantic colors only for literal status. Every status also uses text and structure.  
**Motion**: 150-220ms exponential ease-out for opacity, color, border or bounded layer entry. Reduced motion removes spatial transition and limits essential opacity transition to 100ms. Layout animation, bounce and orchestrated loading are prohibited.  
**Anti-patterns**: no interchangeable card dashboard, hero metrics, profile-completion scoring, decorative waveform, neon/nightclub styling, gradient text, side-stripe alerts, nested cards, glassmorphism, arbitrary themes/plugins/scripts or color-only trust indicators.

## Design System Compliance

- **Page archetypes**: `System / Degraded` owns route failure, offline and maintenance presentation; `Work Queue / Overview` owns jobs; `Record Detail / Activity` owns job/audit detail; all other archetypes consume the shell and state primitives defined here.
- **Navigation**: consumes `<PublicNav>`, `<AppSidebar>`, `<AdminSidebar>`, `<CompactTabBar>`, `<TopBar>`, `<Breadcrumbs>` and `<ActingContextSwitcher>` from the locked global inventory. No feature may create another global shell.
- **Loading**: server renders identity/header/canonical state first; skeletons appear only for known-existing sections; bounded operations use labelled inline progress; last-known-good read-only content remains only when policy-safe and is labelled stale.
- **Errors**: field/row errors are inline; transient non-critical failures may toast only when the screen remains truthful; persistent route failure uses System/Degraded; every island has an isolating boundary with request ID and recovery.
- **Empty**: calm, specific copy with one truthful next action. Forbidden, blocked, offline, unavailable, stale, disputed and absent never use the empty-state treatment.
- **Density**: compact for navigation, jobs, tables and status timelines; standard for forms and confirmations; spacious only for focused route-level degraded/maintenance explanations.

## Frontend Architecture Boundary

1. Astro owns routes, layouts, server data loading, guards, cache headers, semantic HTML and route boundaries.
2. React is allowed only for bounded interactive islands: acting-context selection, cancellable job polling, resumable upload, offline intent review, conflict resolution and high-risk confirmation.
3. Server-rendered canonical context remains readable if an island fails. No island is the sole renderer of record identity, authority, current state or consequence.
4. URL and server data are preferred over client state. Cross-island state is prohibited unless a later architecture decision demonstrates necessity.
5. Realtime carries an invalidation hint only. The client refetches the authorized canonical resource before rendering a state change.
6. Browser storage contains bounded preferences, safe cache and approved local intent/draft envelopes only. It never contains tokens, service credentials, final transaction state, durable authority or protected PII.
7. Public routes default to static or cacheable server HTML with no hydration. Protected and freshness-critical routes render on demand and return private/no-store output.

## Shared State Vocabulary

| State | Required rendering and behavior |
|---|---|
| `idle` | Current server-rendered value and available actions; no progress indicator. |
| `loading` | Known-existing region skeleton after 200ms, or labelled inline progress for a bounded command. Preserve layout and accessible name. |
| `empty` | Confirmed zero records after a successful authorized response, with one truthful next action. Never used for 403/404 concealment. |
| `success` | Canonical returned resource/version or stable job status. Durable outcomes appear in page state/task/notification, not toast alone. |
| `optimistic_pending` | Allowed only for reversible non-authority preferences. Show pending text; do not claim canonical completion. |
| `optimistic_rollback` | Restore prior displayed value, preserve user input, announce failure and expose retry if safe. Protected commands do not use optimistic completion. |
| `disabled` | Action remains visible only when disclosure policy permits; label exact prerequisite or capability gate. |
| `blocked` | Canonical policy/prerequisite blocks action; render reason code in plain language and legitimate recovery path. |
| `forbidden` | Disclosure-safe denial. Do not render protected fields, counts, names or existence hints. |
| `conflict` | Preserve draft, display expected/current version guidance, require refetch/compare before resubmission. |
| `offline` | Label local versus canonical data, allowed offline action scope and reconnect behavior. Never imply server acceptance. |
| `stale` | Preserve last-known-good read-only data only where policy allows; show source time/version and refetch action. |
| `degraded` | Identify affected scope and unavailable dependency while preserving safe neighboring context. |
| `failed` | Persistent operation failure with safe message, request ID and recovery/support action. |
| `absent` | Authorized 404 or confirmed no resource. Concealment-safe routes do not distinguish absent from forbidden. |

## Component Inventory

### Shell and Navigation Contracts

| Component and props interface | States and interaction | Responsive behavior | Accessibility annotation |
|---|---|---|---|
| `<PageShell shell: "public"|"app"|"admin"; title: string; currentPath: string; actingContext?: ActingContextSummary; maintenance?: MaintenanceState; children>` | Server-rendered. Selects one shell only; preserves safe shell during section error; route-level forbidden removes protected children. `loading/empty/optimistic_*` are not applicable because shell existence is known before render. | Desktop 12-column with sidebar where applicable; tablet 8-column collapsible rail; mobile 4-column with compact tabs and stack. | `<header>`, `<nav>`, `<main>`, optional `<aside>`, skip link first; one `h1`; focus lands on `main` after navigation; WCAG 1.3.1, 2.4.1, 2.4.3, 2.4.6. |
| `<PublicNav items: NavItem[]; currentPath: string; status?: "ready"|"degraded">` | Link activation uses native navigation. Unknown/unauthorized configured items are omitted; degraded menu resolution exposes only required recovery routes. | Inline top nav becomes governed menu trigger without changing order/labels. | Native links, `aria-current="page"`, labelled menu button, Escape closes and restores trigger focus. |
| `<AppSidebar items: NavItem[]; currentPath: string; collapsed: boolean; unreadByRoute: Record<string, number>; onToggle>` | Toggle persists a user preference only. Hidden routes collapse their slots; current route never disappears. Optimistic preference rollback is allowed. | Persistent at desktop; collapsible rail at tablet; not rendered on mobile where `<CompactTabBar>` owns primary navigation. | Toggle has expanded state and name; arrow keys are not invented for ordinary links; counts have screen-reader text. |
| `<AdminSidebar items: NavItem[]; capabilities: string[]; currentPath: string>` | Server capability filtering only. Empty admin capability set renders no admin shell and routes to disclosure-safe forbidden state. | Same structural behavior as app sidebar but never shares consumer authorization assumptions. | Landmark label `Administration`; current item announced; denied items are not focusable or discoverable. |
| `<CompactTabBar items: [NavItem, NavItem, NavItem, NavItem]; moreItems: NavItem[]; currentPath: string>` | Four context-relevant destinations plus More. More opens complete authorized tree; selection closes drawer and navigates natively. | Mobile only; hidden at 769px and above. Fixed placement must not cover content/action bars or virtual keyboard. | 44x44 minimum primary targets, `aria-current`, labelled More, focus trap only while drawer is open, Escape/close restores focus. |
| `<TopBar search?: SearchEntry; actingContext?: ActingContextSummary; createItems: NavItem[]; notifications?: NotificationSummary; account: AccountSummary>` | Search/create/notification controls render only when authorized. Acting context precedes protected create actions. Loading for independent notification count uses inline placeholder, never blocks shell. | Full labels desktop, priority icons with accessible names tablet/mobile; account and context remain reachable. | Logical tab order, icon buttons named, menus announce expanded state, no hover-only action. |
| `<Breadcrumbs items: BreadcrumbItem[]; currentPath: string>` | Server-derived canonical ancestry; last item is text with `aria-current`. No client-generated route guess. | Horizontal scroll only when wrapping would obscure hierarchy; first/middle compaction preserves accessible full labels. | `<nav aria-label="Breadcrumb"><ol>` semantics; no click target for current page. |
| `<ActingContextSwitcher current: ActingContextSummary; eligible: ActingContextSummary[]; pendingCommand?: PendingCommandSummary; onSelect>` | Selection refetches authority and canonical page data. If unsaved/pending work exists, inline confirmation names impact before switch. Client selection never grants authority. | Popover desktop/tablet; full-height drawer mobile; current context remains visible in persistent top bar. | Combobox/listbox semantics where searchable, roving focus, Escape restores trigger, selected item announced with authority summary. |

### Feedback, State and Recovery Contracts

| Component and props interface | States and interaction | Responsive behavior | Accessibility annotation |
|---|---|---|---|
| `<StateLabel state: PlatformUiState; label: string; detail?: string; icon?: SemanticIcon>` | Text is mandatory; icon/color only reinforce. No interaction. | Never truncates state word; detail may wrap below at compact width. | State text remains in forced colors; icon is hidden from AT when redundant. |
| `<InlineMessage tone: "info"|"warning"|"danger"|"success"; title: string; body: string; action?: ActionDescriptor; requestId?: string>` | Action is explicit and idempotent where applicable. Success is not auto-dismissed when it records money, rights, publication, authority or data-loss consequences. | Full-width within owning region; action stacks below copy on mobile. | `role="alert"` only for urgent new errors; otherwise `role="status"` or labelled region. Focus does not jump unless submission failed. |
| `<ErrorBoundary scope: "route"|"section"|"island"; requestId?: string; recovery: RecoveryAction[]; safeContext?: RenderableContext>` | Catches render/runtime failure, reports scrubbed telemetry once, preserves safe context, prevents blind mutation retry. Route boundary offers status/navigation; section/island boundary cannot mask canonical parent state. | Route fallback uses System/Degraded archetype; section fallback stays in original layout. | Heading names failed scope; request ID selectable; retry is a button; focus moves to fallback heading only when current focused subtree is removed. |
| `<LoadingSkeleton regionLabel: string; shape: SkeletonShape; knownToExist: true>` | Appears after 200ms, disappears when content/error resolves, never represents uncertain presence. `empty/error/optimistic_*` not applicable. | Matches final container dimensions at every breakpoint to prevent layout shift. | `aria-hidden`; parent has `aria-busy="true"` and stable accessible label. Reduced motion disables shimmer. |
| `<EmptyState title: string; explanation: string; primaryAction: ActionDescriptor; resetAction?: ActionDescriptor>` | Render only after authorized successful zero result. Filtered-empty and never-created use different copy/actions. | Spacious focused layout mobile; constrained 65-75ch desktop. | Heading and action order; optional illustration has empty alt and no semantic dependency. |
| `<CapabilityGate state: "forbidden"|"step_up"|"gate_closed"|"prerequisite"; title: string; explanation: string; recovery?: ActionDescriptor>` | Never grants capability client-side. Step-up returns to initiating control and re-runs current authorization; counsel gate has no override CTA. | Inline in place of action/content when disclosure permits; route-level gate uses System/Degraded. | Named status region; recovery action explains destination; hidden fields are absent from DOM. |
| `<OfflineStatus online: boolean; lastCanonicalAt?: string; queuedCount: number; syncState: "idle"|"syncing"|"blocked"|"failed">` | Announces connectivity change once, opens review of local intents, never auto-labels queued work accepted. Reconnect triggers session/authority/version revalidation. | Compact persistent bar mobile; top-bar status desktop; does not overlay action controls. | Polite live region, exact text, no color-only state; connection flapping is debounced to avoid announcement spam. |
| `<SyncConflict intent: LocalIntentSummary; serverVersion?: string; safeDiff: DiffField[]; actions: ("discard"|"edit_and_retry"|"open_canonical")[]>` | No automatic merge for protected commands. User selects one named action after canonical refetch; stale protected fields are redacted. | Side-by-side safe diff desktop; sequential labelled old/current sections mobile. | Diff uses headings and inserted/deleted text labels, not color alone; focus starts on conflict summary. |

### Data, Command and Infrastructure Contracts

| Component and props interface | States and interaction | Responsive behavior | Accessibility annotation |
|---|---|---|---|
| `<ActionBar primary?: ActionDescriptor; secondary: ActionDescriptor[]; destructive?: ActionDescriptor; state: "idle"|"pending"|"blocked">` | One primary action. Pending disables duplicate commit but preserves label width; destructive action always names consequence and routes high-risk work through confirmation. | Sticky bottom action bar only where it does not cover content; mobile actions stack by priority. | DOM order matches visual order; pending state announced; disabled reason is adjacent text, not tooltip-only. |
| `<ConfirmationStep consequence: string; affectedScope: string; expectedVersion: string; stepUp: "not_required"|"required"|"satisfied"; confirmationText?: string; onConfirm; onCancel>` | States `idle|validating|submitting|reconciling|success|error`. Ambiguous outcome enters reconciling and blocks another submit until status lookup. Cancel restores initiating focus. | Inline final step preferred; drawer/dialog only when route context must remain visible. | Initial focus on consequence heading, not destructive button; explicit accessible name; Escape cancels only before commit; errors use summary and field links. |
| `<JobStatus job: JobStatusResponse; canCancel: boolean; onCancel; refetch>` | `queued|running|cancelRequested|succeeded|failed|cancelled`. Poll uses visibility-aware bounded cadence and refetches on Realtime hint. Terminal state stops polling. Cancel requires current ETag and handles 409 by refetch. | Timeline and actions side-by-side desktop; stacked mobile. | Determinate `<progress>` when measurable; otherwise textual stage, polite updates no more than meaningful state/progress changes; terminal state announced once. |
| `<FileUpload target: UploadTarget; constraints: UploadConstraints; existing?: UploadObject; onReady>` | `idle|validating|authorizing|uploading|paused|completing|verifying|ready|rejected|quarantined|aborted|failed|offline_blocked`. Validates type/size before intent; shows byte progress; aborts after exactly 30s without a byte; signed intent expires at 15m; recovery starts from provider-confirmed bytes. | Drop zone becomes standard file picker on compact/touch; progress/actions never require drag. | Persistent label/instructions, keyboard picker, no drag-only path, determinate progress and polite stage announcements, file errors linked to file row. |
| `<DataTable<Row> rows: Row[]; columns: ColumnDef<Row>[]; sort: SortState; filters: FilterState; selection?: SelectionState; onQueryChange>` | Server/URL query is canonical. `loading|empty|error|success|degraded` are distinct; previous page may remain stale-labelled during safe refetch. No hidden client sorting beyond declared API options. | Table desktop; priority columns plus disclosure rows at tablet/mobile; never horizontal-scroll the only primary action offscreen. | Semantic table, sortable header buttons with `aria-sort`, keyboard selection, caption/summary, bulk selection count announced. |
| `<Pagination cursor: CursorState; pageSize: 25|50; freshness?: string; onNavigate>` | Opaque cursor only. Previous/next update URL and refetch; exhausted disables next. Automatic retry follows safe-read policy. | Compact previous/next mobile; result/freshness text remains visible. | Native buttons/links, disabled semantics, focus moves to result heading after navigation, live region announces page result count. |

## Page and Route Definitions

| Route/surface | Shell and archetype | Guard/cache | Data and states |
|---|---|---|---|
| `/status` | Public shell, System/Degraded | Public allowlisted read, 30s cache/ETag | `GET /api/v1/status`; ready, maintenance, degraded or unavailable. Never reveals internal health/provider topology. |
| `/app/jobs/{jobId}` | App shell, Record Detail/Activity | Session plus initiating actor/current delegated party; private/no-store; wrong scope collapses to 404 | `GET /api/v1/jobs/{jobId}` plus cancel action. Deep-linkable and bookmarkable; terminal state remains inspectable. |
| Any public route error | Public shell, System/Degraded | Route policy decides safe last-known-good versus removal | 404, dependency unavailable, maintenance and unknown failure remain distinct. |
| Any protected route error | App/admin shell only when safe, System/Degraded | Reauthorize before rendering partial data; private/no-store | session expired, step-up, forbidden, conflict, offline and dependency unavailable use scoped recovery. |
| Embedded upload surface | Owning feature route | Same target capability as owning command | Upload intent, direct provider transfer, completion, verification and abort are shown in place; no generic browse-all upload route. |
| Offline intent review | App shell region or drawer from `<OfflineStatus>` | Current session required before any sync; local-only view is clearly labelled | Lists safe local summaries, sync result per item and conflict actions. Protected payload details remain locally encrypted and purpose-limited. |
| `/health/live`, `/health/ready`, webhook endpoints | No browser UI route | Internal/provider only; external browser receives concealment-safe failure | Never linked, prefetched, cached by PWA or exposed in client configuration. |

### Navigation Guarantees

- Server redirects retain only allowlisted relative return paths. Auth tokens, provider text and protected identifiers never enter URLs.
- Back/forward restores URL-addressable filters, selection and cursor only when the server accepts them. A stale cursor refetches or resets with explicit explanation.
- Multi-tab protected commands rely on expected version and idempotency. A conflict in one tab cannot silently overwrite another.
- Unsaved safe draft input is preserved across session expiry and recoverable route errors; secrets, payment credentials and uploaded bytes are excluded.
- Browser refresh during pending command reconciles by stored operation/job identity rather than resubmitting a mutation.

## State Management

| State class | Owner | Persistence and synchronization |
|---|---|---|
| Canonical resource, authority and lifecycle | Server/API | Astro fetches with current session/context; React island refetches after mutation or hint; never copied into a global client store. |
| Route query, sort, filters, cursor and selected record | URL | Typed and allowlisted; shareable only where disclosure policy permits; invalid values return validation/reset UI. |
| Shell preference and reduced-density preference | Local user preference | Reversible optimistic update permitted; cannot weaken target size, contrast, disclosure or authorization. |
| Form draft | Island-local or approved encrypted draft store | Preserve valid non-secret fields on recoverable failure; clear only after canonical commit or explicit discard. |
| Idempotency key and pending operation reference | Session-scoped client operation registry | Generated once per intent, retained through timeout/reload until status reconciliation, then expired by policy. |
| Offline intent | Approved bounded local store | Contains operation, client intent ID, idempotency key, expected version, created time and allowlisted payload only; server assigns canonical operation ID after acceptance. |
| Realtime hint | Ephemeral | Invalidates named entity/version and triggers authorized refetch; never directly changes canonical UI state. |

## Interaction Specification

### Request and Command Timing

| Interaction | Waiting threshold and deadline | Retry and visible outcome |
|---|---|---|
| Public/authenticated read | Preserve server content immediately; section skeleton after 200ms only when known to exist; exact 8s client deadline | Retry safe reads with bounded jitter only; show stale safe content or scoped error with request ID. |
| Protected command | Pending state immediately; exact 15s deadline | Retry only with committed idempotency key. Timeout/ambiguous response reconciles status before enabling submit. |
| Long-running work | API returns job within 2s; acceptance target 500ms | Navigate/embed stable job status; poll/refetch until terminal; Realtime only accelerates refetch. |
| Direct upload | Byte progress; exactly 30s zero-byte inactivity abort; authorization expires at 15m | Resume from provider-confirmed state after new intent; never assume browser bytes equal ready object. |
| Offline sync | No automatic claim of success | Reauthenticate, reauthorize and version-check each item; display accepted/rejected result independently in input order. |

### Form Validation Contract

| Field/control | Client behavior | Authoritative submit behavior and copy |
|---|---|---|
| UUID/identifier | Validate format on blur only after non-empty input | `VALIDATION_FAILED`: “Check this identifier and try again.” Focus/link exact control. |
| Required enum/registry | Validate selection immediately when changed | Named field code: “Choose one of the available values.” Never display inactive hidden values. |
| File | Type/size checks on selection; checksum/progress after consent | `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, checksum/state errors map to file row with accepted limits. |
| Idempotency/version | Hidden system-managed values, never user-editable | `PRECONDITION_REQUIRED` is an implementation fault boundary; `VERSION_CONFLICT` opens compare/refetch recovery, not a user field error. |
| High-risk confirmation | Validate consequence acknowledgement and step-up at final step | Preserve all safe fields; submission error summary distinguishes denial, stale preview/version, dependency failure and unknown outcome. |

### Error-to-UI Matrix

| Status/code class | UI state | Recovery rule |
|---|---|---|
| `400 INVALID_REQUEST`, `415`, `422` | Inline summary plus exact field/row errors | Correct input; no automatic retry. Unknown field path goes to boundary with request ID. |
| `401 UNAUTHENTICATED` | Session recovery preserving safe draft | Reauthenticate and return to initiating control; never loop retries. |
| `403 FORBIDDEN` | Capability gate or concealment-safe route state | Show only allowlisted reason/action; step-up only when server names it. |
| `404` | Absent or concealment-safe not-found | No existence distinction beyond endpoint policy; offer safe navigation. |
| `409 VERSION_CONFLICT` | Sync conflict | Refetch current version, show safe diff, require explicit edit/retry. |
| Other `409` | Named blocked/conflict state | Follow server `recoveryAction`; never generic overwrite/force. |
| `413`, upload `415` | File-row error | Keep other files/draft; show exact max/allowed media. |
| `428` | Boundary/configuration failure or stale client | Refresh contract state; user is not asked to type transport headers. |
| `429` | Rate-limited state with retry time | Disable retry until `Retry-After`; show remaining wait; preserve input. |
| `502|503|504` | Dependency degraded/unknown | Safe reads may retry; mutations reconcile committed key/status; display request ID and status route. |
| `500 INTERNAL_ERROR` | Section/island/route boundary by scope | No blind retry for mutation; preserve safe context and report scrubbed correlation. |

## Conditional Rendering Matrix

`full` means the principal receives the complete authorized UI contract, not blanket data access. Machine principals have no browser rendering.

| Feature/component | Anonymous | Authenticated user | Acting-party principal | Internal operator | Queue/provider/deployment/service |
|---|---|---|---|---|---|
| Public shell and `/status` | full public projection | full public projection | full public projection | full public projection | hidden |
| App shell | hidden | full own-context shell | full current-party shell | read-only unless explicit app capability | hidden |
| Admin shell | hidden | hidden | hidden unless separately granted capability | full named-capability shell | hidden |
| Acting context switcher | hidden | full eligible self contexts | full eligible delegated contexts | read-only current operator context unless mandate allows | hidden |
| Job status | hidden | full own job | full permitted party job | full named operations capability | hidden |
| Job cancel | hidden | full only with job capability | full only with party capability | full named capability | hidden |
| Upload | hidden | full for authorized target | full for authorized target/party | partial purpose-scoped support variant | hidden |
| Offline intent review/sync | hidden | full own intent summaries | full current-context intent summaries | hidden | hidden |
| High-risk confirmation | hidden | locked unless explicit capability and step-up | full when capability/step-up pass | full named capability/step-up | hidden |
| Health/webhook controls | hidden | hidden | hidden | hidden in ordinary UI; separate runbook tooling only | hidden |

Named variants: `publicProjection`, `ownContext`, `actingParty`, `operatorPurposeScoped`, `stepUpRequired`, `concealmentSafeHidden`, and `machinePrincipalNoUi`. Feature specifications may narrow these variants but cannot widen them.

## Accessibility Inventory

Accessibility is inline in every component contract above. This inventory proves IA 00 extraction coverage and is not a substitute for those annotations.

| Component/interaction | WCAG requirement | Keyboard and focus | Screen-reader behavior | IA source |
|---|---|---|---|---|
| Shell navigation | 1.3.1, 2.4.1, 2.4.3, 2.4.6 | Skip link, logical tab order, focus main after navigation | Named landmarks and current route | IA 00 § Accessibility |
| Validation failure | 3.3.1, 3.3.3, 4.1.3 | Focus summary then exact first invalid control; links reach every field | Alert summary and associated field errors | IA 00 § Accessibility |
| Session expiry/step-up | 2.2.1, 2.4.3, 3.2.1 | Warning action, contained dialog if required, restore initiating focus | Time remaining and outcome announced | IA 00 § Accessibility |
| Upload | 1.3.1, 2.1.1, 4.1.3 | Picker and cancel/retry without drag; focus remains on file row | Determinate progress and truthful verification stages | IA 00 § Accessibility |
| Job status | 1.3.1, 4.1.3 | Cancel/retry/status links keyboard-operable | Polite meaningful progress, terminal announcement once | IA 00 § Accessibility |
| Offline/conflict | 1.4.1, 2.4.3, 4.1.3 | Focus conflict heading; keyboard-accessible discard/edit/open actions | Data safety, local/canonical distinction and next action announced | IA 00 § Accessibility |
| Overlay/drawer | 2.1.2, 2.4.3, 2.4.7 | Focus containment only while open; Escape; restore trigger | Label, description and expanded/open state | IA 00 § Accessibility |
| Reduced motion/reflow | 1.4.10, 2.3.3 | All functions remain available at 200%/400% zoom | DOM order matches visual order; status survives forced colors | IA 00 § Accessibility |

Release gate: zero axe Critical/Serious findings, Lighthouse accessibility 100 on governed fixtures, keyboard-only coverage, NVDA+Firefox and VoiceOver+Safari checks, 200%/400% zoom, forced colors and reduced motion.

## Responsive Behavior

| Width | Shell/navigation | Workbench/forms/status | Interaction changes |
|---|---|---|---|
| Mobile `<=768px` | 4-column, 16px margins, compact tab bar plus stack, no sidebars | List then detail, single-column fields, actions stack, 44px primary targets | Drawers replace non-critical popovers; no drag-only upload; safe table disclosure rows. |
| Tablet `769-1024px` | 8-column, 24px margins, collapsible app/admin rail | Split view only when container supports both readable panes; grouped forms remain standard density | Touch and keyboard parity; action bar remains visible without overlaying content. |
| Desktop `>=1025px` | 12-column, 1440px max, persistent eligible sidebar and compact top bar | List/detail, timeline/action rail and safe side-by-side compare | Popovers permitted for bounded selection; persistent context and consequence visible. |

Container behavior, not route-specific breakpoint duplication, owns component rearrangement. Typography remains fixed on product routes. At all widths, DOM/focus order follows reading order and hidden slots collapse without leaving unexplained gaps.

## Performance and Hydration Contract

- System/degraded/PWA shell: initial JS <=80KB gzip, total route JS <=160KB, CSS <=40KB, HTML <=75KB.
- No single hydrated island exceeds 50KB route-specific JS without approved exception.
- Shell, navigation, record identity, canonical state and static messages render as Astro HTML. Hydration is limited to the concrete interactive components named in this spec.
- Public/system LCP <=2.0s where classified as public; product route LCP <=2.5s. INP <=150ms for guided/system actions and <=200ms for product workbench; CLS <=0.05 public/guided and <=0.10 product workbench.
- Normal-web monthly p95 remains under 2,000ms; UI deadlines remain 8s reads and 15s commands and do not redefine SLO success.
- Above-fold responsive images stay <=250KB and are normally absent from system/degraded routes. Audio/video transfer is always user initiated.

## Test Contract

| Level | Required coverage |
|---|---|
| Unit/component | every component state and named role variant; focus restoration; error mapping; Retry-After countdown; upload inactivity timer; job terminal polling stop; offline serialization allowlist |
| Contract/integration | all BE 00 success/error shapes; private/no-store behavior; ETag/idempotency replay; concealment-safe 404; Realtime hint refetch; service-worker cache exclusions |
| Playwright | public/app/admin shell selection; keyboard navigation; mobile tab/More; session expiry draft recovery; command conflict; job cancel; upload success/reject/quarantine/expiry; offline accept/reject; route and island boundary |
| Accessibility | axe zero Critical/Serious for every shell and critical state; Lighthouse 100 fixtures; NVDA/VoiceOver manual scripts; zoom/reflow, forced colors, reduced motion and target-size assertions |
| Performance | bundle manifest, Lighthouse archetype budgets, no hydration waterfall, request deadline injection and no hidden retry in measured samples |
| Security | no protected fields in forbidden/404/error telemetry; no token/service credential in URL/storage/bundle; acting context cannot be forged client-side |

## Deepening Record

1. **State synchronization**: canonical server ownership, invalidation-only Realtime and multi-tab version conflicts are explicit.
2. **Degraded network**: exact deadlines, safe retry, stale content, offline intent and ambiguous mutation reconciliation are explicit.
3. **Flow sequencing**: protected commands, jobs, uploads, session recovery and reconnect reauthorization preserve deterministic order.
4. **Responsive/touch**: all shell, table, overlay, upload and action structures have breakpoint-specific behavior without pointer-only controls.
5. **State exhaustion**: idle/loading/empty/success/pending/rollback/disabled/blocked/forbidden/conflict/offline/stale/degraded/failed/absent are distinguished.
6. **Role exhaustion**: every browser principal has an explicit cell; machine principals are explicitly no-UI.
7. **Accessibility edge cases**: keyboard, focus, announcements, color, motion, zoom/reflow and forced-color behavior are component-local and testable.

Passes 1-7 converge without a new dependency, product decision or unresolved implementation choice. Passes 8-10 are not required.

## Ambiguity Gate

- **Micro**: every shared component has a props interface, state set, interaction, responsive rule and inline accessibility behavior.
- **Macro**: shell, authorization, server/client state, error, offline, performance and navigation contracts align with IA 00, BE 00 and Architecture Design.
- **Two-implementer assertion**: independent implementers choose the same shell owner, hydration boundaries, state vocabulary, route guards, error recovery, upload/job/offline sequencing and accessibility outcomes.
- **Devil's advocate**: a client cannot grant authority, treat Realtime/offline state as canonical, hide a persistent high-risk failure in a toast, skeleton an unknown region, retry an ambiguous mutation blindly or expose health/provider internals without violating an explicit rule.
- **Result**: PASS. No open ambiguity blocks downstream feature FE specifications.

## Open Questions

None. Feature-specific UI behavior must be resolved in its owning FE specification without weakening this foundation.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-03 | Initial complete cross-cutting web foundation | `/write-fe-spec` | All |

## Related Specs

### Constrained by
- [[specs/design-system|Design System]]
- [[specs/2026-08-02-architecture-design|Architecture Design]]
- [[specs/ENGINEERING-STANDARDS|Engineering Standards]]

### Derives from
- [[specs/ia/00-infrastructure|Shard 00 IA]]
- [[specs/be/00-infrastructure|Shard 00 BE]]


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]

### Implemented by
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]

### References
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ENGINEERING-STANDARDS|WeJammin — Engineering Standards]]
- [[specs/design-system|Design System]]
