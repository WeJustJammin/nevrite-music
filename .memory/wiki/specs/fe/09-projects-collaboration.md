# Music projects and collaboration: Frontend Specification

> **Classification**: Feature specification
> **BE Source**: [09a-project-containers-creative-docs.md](../be/09a-project-containers-creative-docs.md), [09b-roster-invitations-vault-access.md](../be/09b-roster-invitations-vault-access.md), [09c-audio-version-review-approval.md](../be/09c-audio-version-review-approval.md), [09d-sessions-delivery-readiness.md](../be/09d-sessions-delivery-readiness.md), [09e-daw-bridge-evidence-gate.md](../be/09e-daw-bridge-evidence-gate.md)
> **IA Source**: [09-projects-collaboration.md](../ia/09-projects-collaboration.md)
> **Surface**: Responsive Astro hybrid web/PWA with bounded React islands
> **Status**: Complete

## Referenced Material Inventory

- **Primary IA**: [09-projects-collaboration.md](../ia/09-projects-collaboration.md) in full.
- **BE sources**: [09a-project-containers-creative-docs.md](../be/09a-project-containers-creative-docs.md), [09b-roster-invitations-vault-access.md](../be/09b-roster-invitations-vault-access.md), [09c-audio-version-review-approval.md](../be/09c-audio-version-review-approval.md), [09d-sessions-delivery-readiness.md](../be/09d-sessions-delivery-readiness.md), [09e-daw-bridge-evidence-gate.md](../be/09e-daw-bridge-evidence-gate.md).
- **Cross-cutting FE source**: [00-infrastructure.md](00-infrastructure.md).
- **Design sources**: [design-system.md](../design-system.md), root `PRODUCT.md`, root `DESIGN.md`, and `.agents/skills/brand-guidelines/SKILL.md`.
- **Contract conventions**: BE00 `ApiError`, opaque cursor pagination, ETag/`If-Match`, idempotency, rate-limit headers, canonical refetch after Realtime hints, and disclosure-safe authorization.

## Source Map

| FE section | Authoritative source | Consumed material |
|---|---|---|
| Classification and scope | `09-projects-collaboration.md`; BE index | Shard boundary and completed BE split group |
| Component inventory | BE response/request contracts; IA interactions | Typed props, commands, state machines, access variants |
| Routes and navigation | IA user flows; design-system navigation paradigm | Entry, deep-link, back, stack, compact-tab, and governed menu behavior |
| State management | BE resource versions/events; BE00 | Server authority, URL state, local drafts, optimistic rollback, offline intent |
| Interaction specification | IA Interactions and Edge Cases; BE route registries | Triggers, guards, success, errors, retry, and persistence |
| Responsive behavior | IA responsive/accessibility rules; design-system grid | Mobile, tablet, and desktop structural behavior |
| Accessibility | IA Accessibility and interaction rows; WCAG 2.2 AA baseline | Keyboard, focus, names, live regions, reflow, target size, reduced motion |
| Data mapping | Every BE source listed above | Operation, schema, response field, error, and component ownership |
| Testing obligations | IA acceptance criteria; BE contract/security/recovery tests | Component, integration, E2E, a11y, and degraded-network assertions |

## Design Requirements

- **Direction**: Product-first restrained utility under The Working Record. The next task and canonical record state precede secondary controls.
- **Typography**: Source Sans 3 for work UI; Source Serif 4 only for public display headings; IBM Plex Mono for identifiers, versions, timestamps, and provenance metadata.
- **Color**: Paper and Surface backgrounds with Graphite text. Jam Magenta is limited to active selection or one high-value action and never proves provenance. Semantic colors communicate literal states with text and icon.
- **Motion**: 150–220 ms feedback using `cubic-bezier(0.16, 1, 0.3, 1)` on opacity, color, border, or small transforms. Reduced motion collapses spatial effects to instant or opacity-only at at most 100 ms.
- **Anti-patterns**: No hero metrics, identical or nested card grids, nightclub styling, glassmorphism, gradient text, colored side stripes, decorative waveforms, gamified completion, or decorative verification.
- **Trust language**: asserted, counterparty-confirmed, verified, disputed, pending, unavailable, blocked, stale, and failed are distinct text-first states.

## Design System Compliance

- **Page archetypes**: List → Detail Workbench; Record Detail / Activity; Guided Form / Transaction; System / Degraded.
- **Navigation**: Consume `<PageShell>`, `<AppSidebar>` or `<AdminSidebar>`, `<TopBar>`, `<CompactTabBar>`, `<Breadcrumbs>`, and `<ActingContextSwitcher>`. Authorization and required routes remain code-owned.
- **Composition**: Consume `<Workbench>`, `<ActionBar>`, `<DataTable>`, `<FilterBar>`, `<Pagination>`, `<RecordHeader>`, `<ProvenanceFact>`, `<StateLabel>`, `<Timeline>`, `<CapabilityGate>`, `<OfflineStatus>`, and `<SyncConflict>` where applicable.
- **Loading**: Route HTML renders server-first. Known sections use layout-stable `<LoadingSkeleton>` after 250 ms; bounded mutations use `<InlineProgress>` with a stable label. Unknown absence is never skeletonized.
- **Errors**: Field and row failures are inline; route-wide dishonesty uses System / Degraded; component faults use `<ErrorBoundary>` with correlation ID. Money, rights, publication, security, or data-loss failures are never toast-only.
- **Empty**: `<EmptyState>` distinguishes no records, filter mismatch, forbidden disclosure, offline, unavailable, and failed. Copy gives one truthful next action.

## Component Inventory

### Shared types

```ts
type UiError = { code: string; message: string; requestId: string; details: Record<string, unknown> | null };
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading'; startedAt: string }
  | { status: 'error'; error: UiError; retryable: boolean }
  | { status: 'empty'; reason: 'no-records' | 'filter-miss' | 'not-disclosed' }
  | { status: 'success'; data: T; version: string; stale: false }
  | { status: 'optimistic-pending'; data: T; operationId: string; version: string }
  | { status: 'optimistic-rollback'; data: T; error: UiError; version: string }
  | { status: 'disabled'; reason: string }
  | { status: 'degraded'; data: T | null; requestId: string; lastVerifiedAt: string | null };

type AccessVariant = 'full' | 'read-only' | 'partial-hidden' | 'disabled' | 'not-rendered';
type DomainVariant = 'publicPage' | 'appPage' | 'adminPage' | 'authPage' | 'degradedPage' | 'publicRead' | 'entitledRead' | 'ownerFull' | 'guardianMandate' | 'juniorRestricted' | 'businessMandate' | 'staffCaseScoped' | 'adminStepUp' | 'forbiddenHidden' | 'disabledPrerequisite';
type Breakpoint = 'mobile' | 'tablet' | 'desktop';
```

### `ProjectsCollaborationRoute` (Astro server route)

```ts
interface ProjectsCollaborationRouteProps {
  children?: never;
  variant: DomainVariant;
  actorId: string | null;
  actingPartyId: string | null;
  capabilitySnapshot: readonly string[];
  canonicalUrl: string;
  initialQuery: Readonly<Record<string, string>>;
  requestId: string;
}
```
- Server-verifies session, acting context, route visibility, and initial data before HTML composition. Props are validated, minimal, serializable, and disclosure-safe.
- Renders useful semantic HTML before hydration. React is used only for bounded filtering, commands, realtime invalidation, media controls, or rich editing.
- **A11y inline contract**: skip link targets `<main tabindex="-1">`; one `h1`; landmarks have unique names; route changes focus the `h1`; title includes record and state; 200% zoom and 320 CSS px reflow preserve reading/action order.

### `ProjectContainersCreativeDocsWorkbench` (bounded React island)

**BE owner**: `09a-project-containers-creative-docs.md`

```ts
interface ProjectContainersCreativeDocsWorkbenchProps {
  contractFields: ProjectContainersCreativeDocsWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly ProjectContainersCreativeDocsRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface ProjectContainersCreativeDocsRecord {
  id: string;
  version: string;
  state: string;
  provenance: ReadonlyArray<{ source: string; evidence: string; at: string; visibility: string }>;
  projection: Readonly<Record<string, unknown>>;
}
```
- Astro owns route data and static structure. The island owns only selection, typed filters, pending commands, conflict resolution, and invalidation.
- `projection` is the parsed union of the response schemas named in the BE route registry; runtime validation rejects unknown variants.
- **A11y inline contract**: `<Workbench>` list/detail regions are named; selection is URL-addressable; rows use native links/buttons; Arrow keys are added only inside a declared composite; focus never moves on Realtime refetch; status changes use a polite atomic live region.
- **Responsive contract**: desktop shows list and detail; tablet preserves list with an inline inspector; mobile uses list then detail stack with a persistent Back action and no hidden command rail.
- **Error boundary**: isolates this domain section, sends scrubbed error plus request ID to provider-native diagnostics, preserves neighboring server HTML, and exposes Retry. A render error is never empty data.

### `RosterInvitationsVaultAccessWorkbench` (bounded React island)

**BE owner**: `09b-roster-invitations-vault-access.md`

```ts
interface RosterInvitationsVaultAccessWorkbenchProps {
  contractFields: RosterInvitationsVaultAccessWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly RosterInvitationsVaultAccessRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface RosterInvitationsVaultAccessRecord {
  id: string;
  version: string;
  state: string;
  provenance: ReadonlyArray<{ source: string; evidence: string; at: string; visibility: string }>;
  projection: Readonly<Record<string, unknown>>;
}
```
- Astro owns route data and static structure. The island owns only selection, typed filters, pending commands, conflict resolution, and invalidation.
- `projection` is the parsed union of the response schemas named in the BE route registry; runtime validation rejects unknown variants.
- **A11y inline contract**: `<Workbench>` list/detail regions are named; selection is URL-addressable; rows use native links/buttons; Arrow keys are added only inside a declared composite; focus never moves on Realtime refetch; status changes use a polite atomic live region.
- **Responsive contract**: desktop shows list and detail; tablet preserves list with an inline inspector; mobile uses list then detail stack with a persistent Back action and no hidden command rail.
- **Error boundary**: isolates this domain section, sends scrubbed error plus request ID to provider-native diagnostics, preserves neighboring server HTML, and exposes Retry. A render error is never empty data.

### `AudioVersionReviewApprovalWorkbench` (bounded React island)

**BE owner**: `09c-audio-version-review-approval.md`

```ts
interface AudioVersionReviewApprovalWorkbenchProps {
  contractFields: AudioVersionReviewApprovalWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly AudioVersionReviewApprovalRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface AudioVersionReviewApprovalRecord {
  id: string;
  version: string;
  state: string;
  provenance: ReadonlyArray<{ source: string; evidence: string; at: string; visibility: string }>;
  projection: Readonly<Record<string, unknown>>;
}
```
- Astro owns route data and static structure. The island owns only selection, typed filters, pending commands, conflict resolution, and invalidation.
- `projection` is the parsed union of the response schemas named in the BE route registry; runtime validation rejects unknown variants.
- **A11y inline contract**: `<Workbench>` list/detail regions are named; selection is URL-addressable; rows use native links/buttons; Arrow keys are added only inside a declared composite; focus never moves on Realtime refetch; status changes use a polite atomic live region.
- **Responsive contract**: desktop shows list and detail; tablet preserves list with an inline inspector; mobile uses list then detail stack with a persistent Back action and no hidden command rail.
- **Error boundary**: isolates this domain section, sends scrubbed error plus request ID to provider-native diagnostics, preserves neighboring server HTML, and exposes Retry. A render error is never empty data.

### `SessionsDeliveryReadinessWorkbench` (bounded React island)

**BE owner**: `09d-sessions-delivery-readiness.md`

```ts
interface SessionsDeliveryReadinessWorkbenchProps {
  contractFields: SessionsDeliveryReadinessWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly SessionsDeliveryReadinessRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface SessionsDeliveryReadinessRecord {
  id: string;
  version: string;
  state: string;
  provenance: ReadonlyArray<{ source: string; evidence: string; at: string; visibility: string }>;
  projection: Readonly<Record<string, unknown>>;
}
```
- Astro owns route data and static structure. The island owns only selection, typed filters, pending commands, conflict resolution, and invalidation.
- `projection` is the parsed union of the response schemas named in the BE route registry; runtime validation rejects unknown variants.
- **A11y inline contract**: `<Workbench>` list/detail regions are named; selection is URL-addressable; rows use native links/buttons; Arrow keys are added only inside a declared composite; focus never moves on Realtime refetch; status changes use a polite atomic live region.
- **Responsive contract**: desktop shows list and detail; tablet preserves list with an inline inspector; mobile uses list then detail stack with a persistent Back action and no hidden command rail.
- **Error boundary**: isolates this domain section, sends scrubbed error plus request ID to provider-native diagnostics, preserves neighboring server HTML, and exposes Retry. A render error is never empty data.

### `DawBridgeEvidenceGateWorkbench` (bounded React island)

**BE owner**: `09e-daw-bridge-evidence-gate.md`

```ts
interface DawBridgeEvidenceGateWorkbenchProps {
  contractFields: DawBridgeEvidenceGateWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly DawBridgeEvidenceGateRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface DawBridgeEvidenceGateRecord {
  id: string;
  version: string;
  state: string;
  provenance: ReadonlyArray<{ source: string; evidence: string; at: string; visibility: string }>;
  projection: Readonly<Record<string, unknown>>;
}
```
- Astro owns route data and static structure. The island owns only selection, typed filters, pending commands, conflict resolution, and invalidation.
- `projection` is the parsed union of the response schemas named in the BE route registry; runtime validation rejects unknown variants.
- **A11y inline contract**: `<Workbench>` list/detail regions are named; selection is URL-addressable; rows use native links/buttons; Arrow keys are added only inside a declared composite; focus never moves on Realtime refetch; status changes use a polite atomic live region.
- **Responsive contract**: desktop shows list and detail; tablet preserves list with an inline inspector; mobile uses list then detail stack with a persistent Back action and no hidden command rail.
- **Error boundary**: isolates this domain section, sends scrubbed error plus request ID to provider-native diagnostics, preserves neighboring server HTML, and exposes Retry. A render error is never empty data.

### Global feedback and command components

| Component | Props contract | Interactive and accessibility contract |
|---|---|---|
| `<ActionBar>` | `{ primary, secondary, destructive, state, expectedVersion, operationId }` | Native buttons; stable pending label; named destructive consequence; focus returns to trigger; Enter submits only the owning form. |
| `<CapabilityGate>` | `{ variant, reasonCode, recoveryHref, disclosure }` | `not-rendered` emits no protected label; disabled has reason/recovery; step-up focuses heading; server remains authoritative. |
| `<FilterBar>` | `{ schema, values, resultCount, resetHref }` | Persistent labels; URL commits on Apply; Escape clears only the open combobox; result count is politely announced. |
| `<DataTable>` | `{ columns, rows, sort, selection, density }` | Semantic table wide; priority list mobile; header buttons expose sort; stable keys; bulk actions name count/scope. |
| `<ConfirmationStep>` | `{ consequence, affectedScope, expectedVersion, stepUpState, idempotencyKey }` | Inline first; heading focus; Escape cancels before commit; duplicate activation returns same operation. |
| `<OfflineStatus>` / `<SyncConflict>` | `{ connectivity, intents, serverVersion, localVersion }` | Text plus icon; refused intents remain; conflict actions name outcomes; no automatic overwrite. |

## State Management

| State class | Source of truth | Entry trigger | Render and copy | Exit/persistence |
|---|---|---|---|---|
| idle | URL and server HTML | Route composed with no client work | No artificial busy state | User interaction or invalidation |
| loading | In-flight request descriptor | Navigation/refetch exceeds 250 ms | Skeleton for known layout; “Loading current records” inline | Success, typed error, or cancellation; safe prior content remains when allowed |
| error per class | BE00 `ApiError` | Parsed non-success | Validation inline; 401 reauthenticate; 403 capability; 404 disclosure-safe; 409 conflict; 429 countdown; 5xx degraded | Explicit recovery; valid input retained |
| empty | Canonical success | Zero records or filtered results | Distinguish no records from filter miss; one legitimate action | Create/import/invite or Reset filters |
| success | Server resource and ETag | Validated 2xx | Canonical facts, state, version, provenance, allowed actions | Invalidation or command |
| optimistic-pending | Local overlay by operation ID | Reversible command accepted locally | Pending text/icon; affected controls disabled | Confirmed refetch or rollback |
| optimistic-rollback | Canonical preimage plus error | Command refused/ambiguous after reconciliation | Restore preimage; announce refusal; retain input | Edit/retry/dismiss |
| disabled | Capability/config contract | Known unavailable action | Visible reason and prerequisite; no handler | Capability/config refetch |
| degraded | Last-known-good plus freshness | Dependency/network failure | Exact scope, stale timestamp, request ID, Retry/Status | Canonical refetch |

- **Server state**: Astro/Hono resources, ETags, cursor pages, job status, and canonical authorization.
- **URL state**: query, sort, filters, cursor, selected record, tab, and return target. It is bookmarkable and Back/Forward safe.
- **Island-local state**: draft fields, disclosure toggles, transient focus, and bounded optimistic overlay. No global client store.
- **Realtime**: entity/event hints only. Deduplicate, preserve focus, refetch canonical data, and apply only currently authorized responses.
- **Multi-tab**: `BroadcastChannel` signals invalidation only. Each tab refetches; no tab writes another tab's canonical cache.
- **Unsaved changes**: retain scoped draft, show inline leave confirmation, use `beforeunload` only while dirty, and clear only after success or explicit discard.
- **Offline**: store non-canonical intents only where BE permits. Reconnect revalidates identity, authority, input, and version; refused intents remain visible.

## Page and Route Definitions

| Route | Rendering | Guard and redirect | Deep-link and history |
|---|---|---|---|
| `/app/projects-collaboration` | Astro SSR or cache-safe prerender by route registry | Public exposes public projection; protected verifies session/acting context; admin requires explicit capability and named step-up | Query, cursor, selected record, tab are URL state; invalid values normalize with `replaceState`; Back restores selection/scroll |
| `/app/projects-collaboration/:recordId` | Server-first detail with bounded islands | Concealed returns disclosure-safe 404; visible forbidden uses `<CapabilityGate>`; expired session preserves safe return target | Bookmark resolves current canonical version; stale/deleted target shows exact state and safe parent |
| System/degraded boundary | Preserved shell when safe | Unsafe cached content removed for privacy, legal, takedown, or revoked authority | Retry repeats safe read; mutation status reconciles before retry |

## Interaction Specification

| Interaction | Trigger and focus | Preconditions | Success | Failure and recovery | Persistence |
|---|---|---|---|---|---|
| `PRJ-01` Create/manage song | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-02` Assemble release | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-03` Move production stage | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-04` Capture idea or edit creative doc | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-05` Manage roster | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-06` Invite contributor | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-07` Access vault asset | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-08` Upload audio version | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-09` Nominate canonical | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-10` Compare versions/stems | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-11` Comment/review version | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-12` Share private review | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-13` Triage feedback | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-14` Approve version | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-15` Create/close session | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-16` Complete close prompt | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-17` Build handoff package | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-18` Run QC/readiness | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-19` Declare source use | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-20` Activate DAW bridge | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-21` Open/close revision round | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-22` Maintain mix brief | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-23` Author recall sheet | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-24` Grant/revoke Operator recall projection | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `PRJ-25` Review release-origin version descriptor correction | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |

### Network and retry contract

- Read over 250 ms exposes loading; protected commands use the BE deadline and never show false success.
- 429 waits for `Retry-After`, announces remaining wait, and preserves input.
- 502/503/504 retry at most twice after 250 ms and 750 ms only when BE declares safe. Mutations reuse idempotency and reconcile status first.
- Offline/startup failure renders System / Degraded. Last-known-good appears only when policy permits and always includes freshness.
- `<FileUpload>` aborts after 30 seconds with no transferred byte; any byte resets inactivity; cancellation is explicit; quarantined/unverified bytes never appear ready.

### Form contract

| Concern | Required behavior |
|---|---|
| Fields | Generate controls from named Zod request schema. Every field has persistent label, type, required/optional state, help, autocomplete/inputmode, and canonical serialization. Unknown keys are not submitted. |
| Validation timing | Syntax and safe local constraints on blur; cross-field on review/submit; server remains authoritative. No pre-visit error. |
| Error copy | `VALIDATION_FAILED`: “Check the highlighted fields.” Field copy states rule and correction. `INVALID_REQUEST`: “This request could not be read. Review the form and try again.” |
| Submission | Disable only commit action, preserve width/label, expose pending text, send expected version/idempotency, and ignore duplicate activation. |
| Conflict | Show current server version beside preserved draft. Actions: Review changes, Reapply when permitted, or Discard. Never overwrite automatically. |
| Completion | Focus result heading, update URL/version, clear committed draft, and expose exact next action. Important outcomes also enter durable history/notification. |

## Conditional Rendering Matrix

| Feature/component | Free | Paid | Creator | Guardian | Junior | Business | Staff | Admin |
|---|---|---|---|---|---|---|---|---|
| Public/read projection | full public | full entitled | full owned/public | full mandate-visible | full age-allowed own/public | full organization public/mandated | read-only with explicit case capability | read-only with explicit capability |
| Protected command form | not-rendered without capability | full only with server capability, else disabled | full owned/mandated, else not-rendered | full only within guardian mandate | partial-hidden for restricted fields, else capability-bound | full only in organization mandate | full only with operation/case capability | full only with named capability, recent step-up, audited reason |
| Provenance/evidence | public subset | entitled subset | owned/participating subset | mandate-visible subset | disclosure-safe age-allowed subset | organization-mandated subset | case-scoped read-only | capability-scoped read-only |
| Destructive/high-risk | not-rendered | disabled unless named capability/step-up | disabled unless owner capability/step-up | not-rendered unless mandate grants | not-rendered where age policy forbids | disabled unless organization capability/step-up | full only named case capability/step-up | full only named operation capability/step-up |

Named variants: `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, and `disabledPrerequisite`. Role labels never grant authority client-side.

## Responsive Behavior

| Breakpoint | Grid/navigation | Workbench/detail | Forms/actions | Tables/media |
|---|---|---|---|---|
| Mobile ≤768 px | 4 columns, 16 px gutter/margins; compact tabs and stack; acting context before writes | List then detail; Back first; inspector inline; no horizontal page scroll at 320 CSS px | One column; labels above; action bar avoids keyboard; 44 by 44 px targets | Priority list preserves every field in expandable facts; media controls wrap logically |
| Tablet 769–1024 px | 8 columns, 20 px gutter, 24 px margins; collapsible sidebar | List plus inspector when container permits, else stack; URL selection | Two-column only for independent fields; action bar cannot cover errors | Lower-priority columns move to row details, never disappear |
| Desktop ≥1025 px | 12 columns, 24 px gutter, max 1440 px; sidebar/top bar | Stable list/detail split; detail owns heading/action rail | Grouped form/review summary; action rail cites context/version | Compact semantic table, virtualize >100 rows, stable IDs, functional media only |

- Container queries may switch composition but cannot change semantics, authorization, or consequences.
- 200% zoom and text-spacing overrides retain content/action order. Hover-only disclosure and pointer-only reordering are prohibited.

## Accessibility Inventory

| Component/interaction | WCAG requirement | Keyboard/focus | Screen reader/semantics | IA source |
|---|---|---|---|---|
| Route shell/navigation | 1.3.1, 2.4.1–2.4.3, 2.4.7/2.4.11 | Skip link; logical DOM; route focuses `h1` | Named landmarks, one main, `aria-current=page`, unique title | `09-projects-collaboration.md` Accessibility/User Flows |
| Workbench selection | 1.3.1, 2.1.1, 2.4.3, 4.1.2 | Native controls; Enter opens; Escape closes bounded inspector; focus returns | Named list/detail; selected state; state/provenance text | `09-projects-collaboration.md` Interactions/Access Control |
| Forms/validation | 1.3.1, 3.3.1–3.3.4, 4.1.3 | Persistent labels; linked summary focuses first invalid field; no trap | `aria-invalid`, `aria-describedby`, error links, polite status | `09-projects-collaboration.md` Acceptance Criteria/Edge Cases |
| Async/refetch/conflict | 2.2.1, 2.4.3, 4.1.3 | Refresh never steals focus; Retry native; conflict begins at heading | Polite atomic update; stale/pending/failed text; request ID | `09-projects-collaboration.md` Interactions/BE failures |
| Tables/filters | 1.3.1, 1.4.10, 2.1.1, 2.5.8 | Header buttons; Apply/Reset; 24 CSS px minimum, 44 preferred | Caption, headers, sort, count, active-filter summary | `09-projects-collaboration.md` User Flows/responsive |
| High-risk confirmation | 2.1.2, 2.4.3, 3.3.4, 4.1.2 | Inline first; dialog heading focus, Tab containment, Escape before commit, return focus | Consequence, scope, version, context, step-up, irreversible effect | `09-projects-collaboration.md` Access Control/Edge Cases |
| Motion/media | 1.2.x where applicable, 2.2.2, 2.3.3 | Media keyboard controls; pause/stop; no essential timed gesture | Captions/transcript/metadata; reduced motion; waveform never sole content | `09-projects-collaboration.md` Accessibility |

The inventory exceeds the thin-coverage threshold and is woven into component contracts. WCAG 2.2 AA is the release floor, exceeding the requested 2.1 AA gate.

## FE Rubric Closure

This section makes every FE-rubric checkpoint explicit. It narrows implementation choices without changing any upstream product, permission, security, or data contract.

### Complete component contracts

Every local component interface above includes `children?: never` and a `DomainVariant`. “Never” is deliberate because Astro slots and canonical global components own composition; these route/workbench boundaries do not accept arbitrary children.

| Component | Props interface | Children | Named variants | BE/IA source |
|---|---|---|---|---|
| `ProjectsCollaborationRoute` | `ProjectsCollaborationRouteProps` | `never` | `publicPage`, `appPage`, `adminPage`, `authPage`, `degradedPage` | `09-projects-collaboration.md` user flows/accessibility; design-system page archetypes |
| `ProjectContainersCreativeDocsWorkbench` | `ProjectContainersCreativeDocsWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `09a-project-containers-creative-docs.md` request/response fields; `09-projects-collaboration.md` interactions/access rules |
| `RosterInvitationsVaultAccessWorkbench` | `RosterInvitationsVaultAccessWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `09b-roster-invitations-vault-access.md` request/response fields; `09-projects-collaboration.md` interactions/access rules |
| `AudioVersionReviewApprovalWorkbench` | `AudioVersionReviewApprovalWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `09c-audio-version-review-approval.md` request/response fields; `09-projects-collaboration.md` interactions/access rules |
| `SessionsDeliveryReadinessWorkbench` | `SessionsDeliveryReadinessWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `09d-sessions-delivery-readiness.md` request/response fields; `09-projects-collaboration.md` interactions/access rules |
| `DawBridgeEvidenceGateWorkbench` | `DawBridgeEvidenceGateWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `09e-daw-bridge-evidence-gate.md` request/response fields; `09-projects-collaboration.md` interactions/access rules |
| Global primitives consumed by this spec | Canonical interfaces from design-system Global Component Inventory; local wrappers forbidden | Canonical slot only where that interface declares it, otherwise `never` | `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `error` plus semantic/access variants named above | `design-system.md` Global Component Inventory and State Language |

### IA flow to page/component ownership

| IA flow | Trigger/response owner | Source citation | Visual feedback and timing |
|---|---|---|---|
| `PRJ-01` Create/manage song | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-01` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-02` Assemble release | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-02` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-03` Move production stage | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-03` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-04` Capture idea or edit creative doc | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-04` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-05` Manage roster | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-05` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-06` Invite contributor | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-06` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-07` Access vault asset | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-07` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-08` Upload audio version | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-08` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-09` Nominate canonical | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-09` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-10` Compare versions/stems | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-10` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-11` Comment/review version | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-11` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-12` Share private review | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-12` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-13` Triage feedback | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-13` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-14` Approve version | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-14` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-15` Create/close session | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-15` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-16` Complete close prompt | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-16` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-17` Build handoff package | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-17` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-18` Run QC/readiness | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-18` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-19` Declare source use | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-19` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-20` Activate DAW bridge | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-20` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-21` Open/close revision round | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-21` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-22` Maintain mix brief | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-22` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-23` Author recall sheet | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-23` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-24` Grant/revoke Operator recall projection | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-24` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `PRJ-25` Review release-origin version descriptor correction | `ProjectsCollaborationRoute` orchestrates; `ProjectContainersCreativeDocsWorkbench`, `RosterInvitationsVaultAccessWorkbench`, `AudioVersionReviewApprovalWorkbench`, `SessionsDeliveryReadinessWorkbench`, `DawBridgeEvidenceGateWorkbench` renders the relevant BE response and command state | `09-projects-collaboration.md` Interactions row `PRJ-25` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |

Every IA interaction row is represented above. No flow is inferred from a heading or omitted because it shares an endpoint.

### Server, URL, and client state query registry

| BE operation/query | Server-state key | URL state | Island-local state | All async render states |
|---|---|---|---|---|

No global client store is authorized. A new cross-island state need requires architecture review; until then URL/server state or a colocated island state owns it.

### Route registry with guards and metadata

| URL pattern | Auth guard and failure redirect | Page component | Meta title | Meta description |
|---|---|---|---|---|
| `/app/projects-collaboration` | Server validates Supabase token, expiry, acting context, and route capability. Missing/expired token redirects 303 to `/auth/sign-in?returnTo=%2Fapp%2Fprojects-collaboration` after allowlist normalization. Valid but concealed target returns 404; visible forbidden target renders `CapabilityGate`. | `ProjectsCollaborationRoute` variant `appPage` | `Music projects and collaboration | WeJammin` | `Work with music projects and collaboration using current authority, record state, and provenance.` |
| `/app/projects-collaboration/:recordId` | Same token/expiry/context check; malformed ID returns 400, concealed/unreadable returns 404, expired session uses the same safe sign-in redirect. | `ProjectsCollaborationRoute` with the matching workbench detail variant | `Record | Music projects and collaboration | WeJammin` | `Review the current record, provenance, history, and permitted actions.` |
| Public projection when a BE route declares one | No session accepted as authority; public projection only. Unsafe or non-public record returns disclosure-safe 404, never app-shell redirect. | `ProjectsCollaborationRoute` variant `publicPage` | `Music projects and collaboration | WeJammin` | `View the public, provenance-labelled record.` |
| System/degraded boundary | Preserves verified shell only; Retry stays on canonical URL; unsafe cached data is removed. | `ProjectsCollaborationRoute` variant `degradedPage` | `Service status | WeJammin` | `Review affected scope, last verified time, request ID, and recovery action.` |

### Per-component responsive contract

| Component | Mobile ≤768 px | Tablet 769–1024 px | Desktop ≥1025 px |
|---|---|---|---|
| `ProjectsCollaborationRoute` | Four-column shell, 16 px gutter/margins, compact tabs, stack navigation, Back before detail, no horizontal page scroll at 320 CSS px | Eight-column shell, 20 px gutter, 24 px margins, collapsible sidebar, list/inspector when container permits | Twelve-column shell, 24 px gutter, max 1440 px, persistent sidebar/top bar, stable route heading/action region |
| `ProjectContainersCreativeDocsWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `RosterInvitationsVaultAccessWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `AudioVersionReviewApprovalWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `SessionsDeliveryReadinessWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `DawBridgeEvidenceGateWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| Global `FilterBar`, `DataTable`, `ActionBar`, `ConfirmationStep` | Apply/Reset and priority-list form; action labels remain text; confirmation becomes separate review step | Wrapped toolbar and row detail expansion; no hidden material field | Full typed filter/table/action composition; same semantics and authorization |

### Interaction, accessibility, and image rules

| Interactive element | Native role and accessible name | Keyboard/focus | Feedback |
|---|---|---|---|
| Navigation/record link | `a` with visible purpose; `aria-current` only for current route | Tab, Enter; route focuses `h1`; Back restores prior trigger/scroll | Visited/current are not color-only; navigation busy only after 250 ms |
| Button/icon button | `button`; visible label or specific `aria-label`; decorative icon `aria-hidden=true` | Tab, Enter, Space; disabled is native when unavailable; focus ring never removed | Same-frame pressed/pending; stable label width; result in polite live region |
| Form controls | Native `input`/`select`/`textarea` with persistent `label` and help/error IDs | Logical Tab; first invalid field from linked summary; Enter cannot bypass review; Escape does not erase form | Blur validation where safe, authoritative submit validation, errors within 100 ms of response |
| Table/filter/selection | Native table/header buttons and labelled filter form; no ARIA grid without grid behavior | Tab through controls; Arrow keys only in declared composite; stable selection focus on refetch | Sort/filter state text and result count announced politely |
| Dialog/drawer/popover when inline is exhausted | Named dialog/region; trigger relationship; consequence in heading | Initial heading focus, Tab containment for modal, Escape before commit, return focus | Open/close 150–220 ms or instant under reduced motion |
| Media/upload | Native media/file controls with filename, type, progress, cancel, transcript/caption links | Full keyboard operation; no drag-only or waveform-only action | Determinate progress where known; quarantine/failed/ready text |

- **Image alt policy**: informative images use concise purpose-specific alt; functional images use the action name; decorative images use empty `alt=""` and no redundant ARIA; complex charts/artwork use short alt plus adjacent long description/data table; user/CMS images require governed alt before publication; avatars use the visible person/organization name only when the image adds identity.
- **Output semantics**: every icon is decorative or named, every status combines text/icon/structure, and every dynamic result uses the least interruptive correct live region. WCAG 2.2 AA is mandatory.

### Performance budgets and loading strategy

| Page/component | JavaScript budget (gzip) | Lazy loading | Image/media policy | Runtime targets |
|---|---:|---|---|---|
| `ProjectsCollaborationRoute` public variant | ≤45 KB initial route JS; zero hydration when static | Hydrate only a visible interaction with `client:visible`; no global router | Astro image pipeline emits width/height, AVIF/WebP plus fallback, responsive `srcset`/`sizes`; below-fold images lazy; hero/record identity eager only when LCP | LCP <2.5 s, INP <200 ms, CLS <0.1 at p75 |
| `ProjectsCollaborationRoute` app/admin variant | ≤90 KB initial route JS including shared shell | Each workbench island ≤35 KB initial; editor/media/chart modules split to ≤80 KB lazy chunk and load on explicit entry/visibility; independent fetches parallel | Same optimized image contract; audio/video metadata preload only until explicit play; waveform data lazy and functional | LCP <2.5 s, INP <200 ms, CLS <0.1; interaction feedback same frame |
| `ProjectContainersCreativeDocsWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `RosterInvitationsVaultAccessWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `AudioVersionReviewApprovalWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `SessionsDeliveryReadinessWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `DawBridgeEvidenceGateWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |

Budgets are hard acceptance criteria for `/plan-phase` and implementation. A feature exceeding a budget must split or obtain an originating architecture decision, not silently raise the number.

### Form and auth security rules

| Boundary | Exact frontend rule |
|---|---|
| Token/session | Astro verifies the Supabase token server-side on every protected route and write, checks expiry/revocation and server-derived acting context, strips protected props on failure, and uses the allowlisted 303 sign-in redirect above. Client role strings never authorize. |
| CSRF | Cookie-authenticated mutations require same-site `Secure`/`HttpOnly` cookies, strict allowed `Origin`/`Referer` validation, and the architecture-approved CSRF token binding. Bearer-only API calls do not rely on cookies but still enforce CORS/origin policy. No GET mutates. |
| Input validation/sanitization | Controls serialize only named Zod request fields; trim/normalize only where the contract says; reject unknown keys; rich text/URLs/filenames pass allowlist sanitizers server-side. Client checks improve feedback but never replace boundary validation. |
| Output encoding | Render untrusted text through framework text bindings. `dangerouslySetInnerHTML` is prohibited except an approved sanitized typed CMS renderer; URL attributes use allowlisted schemes; CSS/script/expression content is never executed. |
| Secrets/PII | Tokens, provider responses, evidence bodies, contact data, media URLs, and drafts never enter URL, analytics, logs, structured diagnostic events, Realtime payloads, or client-persisted global state. |
| Upload | Server-authorized short-lived intent binds actor, target, type, size, key, and checksum. Client cannot choose canonical object key; unverified/quarantined bytes never render as ready. |
| Redirects | `returnTo` is a relative route from a code-owned allowlist, normalized before encoding. External schemes, protocol-relative URLs, control characters, and unauthorized admin destinations fall back to the safe app root. |

### Form-by-source completeness

| BE source | Fields/validation | Error display | Submission and success | Security |
|---|---|---|---|---|
| `09a-project-containers-creative-docs.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `09b-roster-invitations-vault-access.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `09c-audio-version-review-approval.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `09d-sessions-delivery-readiness.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `09e-daw-bridge-evidence-gate.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |

## Data Mapping

Every BE operation and parsed response field is owned below. Components consume generated Zod-inferred types; no hand-written partial DTO may silently omit a field. A field is displayed, drives explicit state/control, or is non-rendered for a named security reason.

| BE source | Operation | Method/path | Success to component | Error mapping |
|---|---|---|---|---|
| `09a-project-containers-creative-docs.md` | `09A-PROJECT-CONTAINERS-CREATIVE-DOCS-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `ProjectContainersCreativeDocsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `09b-roster-invitations-vault-access.md` | `09B-ROSTER-INVITATIONS-VAULT-ACCESS-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `RosterInvitationsVaultAccessWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `09c-audio-version-review-approval.md` | `09C-AUDIO-VERSION-REVIEW-APPROVAL-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `AudioVersionReviewApprovalWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `09d-sessions-delivery-readiness.md` | `09D-SESSIONS-DELIVERY-READINESS-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `SessionsDeliveryReadinessWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `09e-daw-bridge-evidence-gate.md` | `09E-DAW-BRIDGE-EVIDENCE-GATE-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `DawBridgeEvidenceGateWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |

### Response field ownership

| BE source | Contract schemas | Parsed field set | UI ownership |
|---|---|---|---|
| `09a-project-containers-creative-docs.md` | Named source schemas | `SongLifecycle`, `ProductionStage`, `CreateSong`, `MixBrief`, `engagement_ref`, `song`, `song_title_version`, `project`, `project_song_membership`, `release_container`, `release_membership`, `milestone`, `completeness_debt`, `idea_artifact`, `lyric_document_version`, `chart_version`, `mix_brief`, `brief_reference`, `project_audit_event`, `ManageSongRequest`, `SongMutationResponse`, `AssembleReleaseRequest`, `ReleaseMembershipResponse`, `MoveStageRequest`, `StageMovementResponse`, `CreativeRecordRequest`, `CreativeRecordResponse`, `MixBriefRequest`, `MixBriefResponse`, `actor_person_id`, `acting_party_id`, `acting_context_version`, `idempotency_key`, `request_id`, `expected_version`, `limit`, `unadministered`, `title`, `action`, `releaseId`, `song_id`, `sequence`, `variant_key`, `songId`, `stage`, `expected_stage_version`, `record_kind`, `origin`, `references`, `lifecycle`, `release_id`, `selected_master_version_id`, `line_attributions`, `section_anchors`, `chord_symbols`, `owner_party_id`, `source_ref`, `source_version_id`, `kind`, `external_link`, `platform_version`, `revision_agreement`, `requestId`, `authContext`, `rateLimit`, `zod`, `tenantScope`, `authorization`, `idempotency`, `transactionAuditOutbox`, `pending_storage`, `currentStage`, `changeKind`, `reasonCode`, `state`, `grade`, `closedAt`, `batchKey`, `gateState`, `grantState` | `ProjectContainersCreativeDocsWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `09b-roster-invitations-vault-access.md` | Named source schemas | `ChangeRoster`, `IssueInvitation`, `ResolveVaultAccess`, `RecordSourceDeclaration`, `SensitivityClass`, `roster_event`, `roster_projection`, `contributor_invitation`, `asset`, `asset_blob`, `nda_acceptance`, `access_grant`, `role_access_profile_version`, `vault_role_class`, `source_declaration`, `ManageRosterRequest`, `RosterMutationResponse`, `InviteContributorRequest`, `InvitationResponse`, `AccessGrantRequest`, `AccessGrantResponse`, `SourceDeclarationRequest`, `SourceDeclarationResponse`, `review`, `may_invite`, `limit`, `not_reviewed`, `songId`, `event_kind`, `subject`, `expected_projection_version`, `idempotency_key`, `roster_event_ids`, `intended_recipient_hash`, `disclosure_tier`, `expires_at`, `material_refs`, `assetId`, `requested_mode`, `acting_context_version`, `state`, `none`, `declared`, `role_version`, `role_literal`, `asset_id`, `kind`, `supersedes_id`, `source_version_id`, `section_ref`, `requestId`, `authContext`, `rateLimit`, `tenantScope`, `roleResolution`, `authorization`, `idempotency`, `transactionAuditOutbox`, `signedGrant`, `responseFilter`, `eventKind`, `involvementState`, `reasonCode`, `residency`, `integrity`, `grantState`, `expiresAt`, `policyHash` | `RosterInvitationsVaultAccessWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `09c-audio-version-review-approval.md` | Named source schemas | `audio_version`, `lineage_edge`, `version_descriptor_correction`, `version_descriptor_correction_proposal`, `canonical_slot`, `canonical_movement`, `review_comment`, `comment_anchor`, `triage_record`, `share_link`, `share_access_event`, `approval_gate`, `approval_record`, `IngestAudioVersionRequest`, `AudioVersionResponse`, `NominateCanonicalRequest`, `CanonicalSlotResponse`, `CompareVersionsRequest`, `AudioComparisonResponse`, `ReviewCommentRequest`, `ReviewCommentResponse`, `ShareReviewRequest`, `ShareLinkResponse`, `TriageFeedbackRequest`, `TriageResponse`, `ApproveVersionRequest`, `ApprovalResponse`, `DescriptorCorrectionRequest`, `DescriptorCorrectionResponse`, `limit`, `songId`, `slotId`, `stage`, `variant`, `format`, `expected_slot_version`, `clear`, `version_ids`, `stem_ids`, `playback_mode`, `loudness_match`, `full_rate`, `adaptive`, `versionId`, `body`, `audience`, `start_ms`, `mode`, `gate_id`, `tempo_bpm`, `musical_key`, `requestId`, `authContext`, `rateLimit`, `tenantScope`, `quarantineCheck`, `integrityCheck`, `authorization`, `idempotency`, `serializableCommand`, `auditOutbox`, `signedGrant`, `responseFilter`, `unverifiable`, `retracted`, `integrity_failed`, `lineageState`, `integrity`, `residency`, `field`, `state`, `reasonCode`, `proxyStrength`, `decision` | `AudioVersionReviewApprovalWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `09d-sessions-delivery-readiness.md` | Named source schemas | `revision_agreement`, `engagement_ref`, `revision_round`, `session`, `attendance_assertion`, `capture_moment`, `capture_ask`, `environment_archive`, `recall_sheet_version`, `recall_sheet_row`, `recall_projection_grant`, `recipient_spec_version`, `handoff_package`, `qc_result`, `readiness_projection`, `SessionCommandRequest`, `SessionResponse`, `CaptureAnswerRequest`, `CaptureAnswerResponse`, `BuildPackageRequest`, `HandoffPackageResponse`, `ReadinessRequest`, `ReadinessResponse`, `RevisionRoundRequest`, `RevisionRoundResponse`, `RecallSheetRequest`, `RecallSheetResponse`, `RecallProjectionGrantRequest`, `RecallProjectionGrantResponse`, `limit`, `passed`, `warning`, `unverifiable`, `opaque_dependency`, `action`, `grade`, `attendance`, `sessionId`, `ask_id`, `answer_kind`, `payload`, `dismissed`, `expected_ask_version`, `songId`, `recipient_spec_version_id`, `canonical_slots`, `expected_package_version`, `reason`, `expected_round_version`, `rows`, `expected_sheet_version`, `sheet_version_id`, `recipient_party_id`, `expires_at`, `projection_policy_hash`, `expected_grant_version`, `BuildPackage`, `EvaluateReadiness`, `RevisionRound`, `RecallSheet`, `GrantRecallProjection`, `project_id`, `source_version_id`, `requestId`, `authContext`, `rateLimit`, `tenantScope`, `authorization`, `idempotency`, `serializableCommand`, `signedGrant`, `projectionFilter`, `grantState`, `decision`, `reasonCode`, `state`, `kind`, `gateState` | `SessionsDeliveryReadinessWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `09e-daw-bridge-evidence-gate.md` | Named source schemas | `ActivateBridge`, `bridge_device`, `bridge_ingest`, `ActivateBridgeRequest`, `BridgeActivationResponse`, `limit`, `songId`, `device_public_key`, `agent_version`, `allowed_roots_attestation`, `evidence_refs`, `requested_scopes`, `expected_device_version`, `read_bounce`, `queue_ingest`, `missing_evidence_keys`, `grant_expires_at`, `gate_state`, `last_seen_at`, `requestId`, `authContext`, `rateLimit`, `tenantScope`, `authorization`, `evidenceGate`, `idempotency`, `serializableCommand`, `auditOutbox`, `disabled`, `pending_review`, `gateState`, `state`, `residency`, `integrity`, `reasonCode` | `DawBridgeEvidenceGateWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |

### Exhaustive BE field and error ownership

The unions below are generated from every contract identifier in each complete BE source, not a representative sample. Request-only identifiers remain because their owning form consumes them; response identifiers remain because the workbench renders them or uses them for explicit state/control. Generated Zod types remain normative if this conservative union includes a non-field identifier.

```ts
type ProjectContainersCreativeDocsContractField =
  | 'ApiError'
  | 'AssembleReleaseRequest'
  | 'CreateSong'
  | 'CreativeRecordRequest'
  | 'CreativeRecordResponse'
  | 'ManageSongRequest'
  | 'MixBrief'
  | 'MixBriefRequest'
  | 'MixBriefResponse'
  | 'MoveStageRequest'
  | 'ProductionStage'
  | 'ReleaseMembershipResponse'
  | 'SongLifecycle'
  | 'SongMutationResponse'
  | 'StageMovementResponse'
  | 'acting_context_version'
  | 'acting_party_id'
  | 'action'
  | 'actor_person_id'
  | 'authContext'
  | 'authorization'
  | 'batchKey'
  | 'brief_reference'
  | 'changeKind'
  | 'chart_version'
  | 'chord_symbols'
  | 'closedAt'
  | 'completeness_debt'
  | 'currentStage'
  | 'engagement_ref'
  | 'expected_stage_version'
  | 'expected_version'
  | 'expiresAt'
  | 'external_link'
  | 'gateState'
  | 'grade'
  | 'grantState'
  | 'idea_artifact'
  | 'idempotency'
  | 'idempotency_key'
  | 'kind'
  | 'lifecycle'
  | 'limit'
  | 'line_attributions'
  | 'lyric_document_version'
  | 'milestone'
  | 'mix_brief'
  | 'origin'
  | 'owner_party_id'
  | 'pending_storage'
  | 'platform_version'
  | 'policyHash'
  | 'project'
  | 'project_audit_event'
  | 'project_song_membership'
  | 'rateLimit'
  | 'reasonCode'
  | 'record_kind'
  | 'references'
  | 'releaseId'
  | 'release_container'
  | 'release_id'
  | 'release_membership'
  | 'request_id'
  | 'revision_agreement'
  | 'section_anchors'
  | 'selected_master_version_id'
  | 'sequence'
  | 'song'
  | 'songId'
  | 'song_id'
  | 'song_title_version'
  | 'source_ref'
  | 'source_version_id'
  | 'stage'
  | 'tenantScope'
  | 'title'
  | 'transactionAuditOutbox'
  | 'unadministered'
  | 'variant_key'
  | 'zod';
interface ProjectContainersCreativeDocsWorkbenchContractFields {
  source: '09a-project-containers-creative-docs.md';
  fields: Readonly<Record<ProjectContainersCreativeDocsContractField, unknown>>;
}
```

```ts
type RosterInvitationsVaultAccessContractField =
  | 'AccessGrantRequest'
  | 'AccessGrantResponse'
  | 'ChangeRoster'
  | 'InvitationResponse'
  | 'InviteContributorRequest'
  | 'IssueInvitation'
  | 'ManageRosterRequest'
  | 'RecordSourceDeclaration'
  | 'ResolveVaultAccess'
  | 'RosterMutationResponse'
  | 'SensitivityClass'
  | 'SourceDeclarationRequest'
  | 'SourceDeclarationResponse'
  | 'access_grant'
  | 'acting_context_version'
  | 'asset'
  | 'assetId'
  | 'asset_blob'
  | 'asset_id'
  | 'authContext'
  | 'authorization'
  | 'contributor_invitation'
  | 'declared'
  | 'disclosure_tier'
  | 'eventKind'
  | 'event_kind'
  | 'expected_projection_version'
  | 'expiresAt'
  | 'expires_at'
  | 'grantState'
  | 'idempotency'
  | 'idempotency_key'
  | 'integrity'
  | 'intended_recipient_hash'
  | 'involvementState'
  | 'kind'
  | 'limit'
  | 'material_refs'
  | 'may_invite'
  | 'nda_acceptance'
  | 'none'
  | 'not_reviewed'
  | 'policyHash'
  | 'rateLimit'
  | 'reasonCode'
  | 'requested_mode'
  | 'residency'
  | 'responseFilter'
  | 'review'
  | 'roleResolution'
  | 'role_access_profile_version'
  | 'role_literal'
  | 'role_version'
  | 'roster_event'
  | 'roster_event_ids'
  | 'roster_projection'
  | 'section_ref'
  | 'signedGrant'
  | 'songId'
  | 'source_declaration'
  | 'source_version_id'
  | 'subject'
  | 'supersedes_id'
  | 'tenantScope'
  | 'transactionAuditOutbox'
  | 'vault_role_class';
interface RosterInvitationsVaultAccessWorkbenchContractFields {
  source: '09b-roster-invitations-vault-access.md';
  fields: Readonly<Record<RosterInvitationsVaultAccessContractField, unknown>>;
}
```

```ts
type AudioVersionReviewApprovalContractField =
  | 'ApprovalResponse'
  | 'ApproveVersionRequest'
  | 'AudioComparisonResponse'
  | 'AudioVersionResponse'
  | 'CanonicalSlotResponse'
  | 'CompareVersionsRequest'
  | 'DescriptorCorrectionRequest'
  | 'DescriptorCorrectionResponse'
  | 'IngestAudioVersionRequest'
  | 'NominateCanonicalRequest'
  | 'ReviewCommentRequest'
  | 'ReviewCommentResponse'
  | 'ShareLinkResponse'
  | 'ShareReviewRequest'
  | 'TriageFeedbackRequest'
  | 'TriageResponse'
  | 'adaptive'
  | 'approval_gate'
  | 'approval_record'
  | 'audience'
  | 'audio_version'
  | 'auditOutbox'
  | 'authContext'
  | 'authorization'
  | 'body'
  | 'canonical_movement'
  | 'canonical_slot'
  | 'clear'
  | 'comment_anchor'
  | 'decision'
  | 'expected_slot_version'
  | 'field'
  | 'format'
  | 'full_rate'
  | 'gate_id'
  | 'idempotency'
  | 'integrity'
  | 'integrityCheck'
  | 'integrity_failed'
  | 'limit'
  | 'lineageState'
  | 'lineage_edge'
  | 'loudness_match'
  | 'mode'
  | 'musical_key'
  | 'playback_mode'
  | 'proxyStrength'
  | 'quarantineCheck'
  | 'rateLimit'
  | 'reasonCode'
  | 'residency'
  | 'responseFilter'
  | 'retracted'
  | 'review_comment'
  | 'serializableCommand'
  | 'share_access_event'
  | 'share_link'
  | 'signedGrant'
  | 'slotId'
  | 'songId'
  | 'stage'
  | 'start_ms'
  | 'stem_ids'
  | 'tempo_bpm'
  | 'tenantScope'
  | 'triage_record'
  | 'unverifiable'
  | 'variant'
  | 'versionId'
  | 'version_descriptor_correction'
  | 'version_descriptor_correction_proposal'
  | 'version_ids';
interface AudioVersionReviewApprovalWorkbenchContractFields {
  source: '09c-audio-version-review-approval.md';
  fields: Readonly<Record<AudioVersionReviewApprovalContractField, unknown>>;
}
```

```ts
type SessionsDeliveryReadinessContractField =
  | 'BuildPackage'
  | 'BuildPackageRequest'
  | 'CaptureAnswerRequest'
  | 'CaptureAnswerResponse'
  | 'EvaluateReadiness'
  | 'GrantRecallProjection'
  | 'HandoffPackageResponse'
  | 'ReadinessRequest'
  | 'ReadinessResponse'
  | 'RecallProjectionGrantRequest'
  | 'RecallProjectionGrantResponse'
  | 'RecallSheet'
  | 'RecallSheetRequest'
  | 'RecallSheetResponse'
  | 'RevisionRound'
  | 'RevisionRoundRequest'
  | 'RevisionRoundResponse'
  | 'SessionCommandRequest'
  | 'SessionResponse'
  | 'action'
  | 'answer_kind'
  | 'ask_id'
  | 'attendance'
  | 'attendance_assertion'
  | 'authContext'
  | 'authorization'
  | 'canonical_slots'
  | 'capture_ask'
  | 'capture_moment'
  | 'decision'
  | 'dismissed'
  | 'engagement_ref'
  | 'environment_archive'
  | 'expected_ask_version'
  | 'expected_grant_version'
  | 'expected_package_version'
  | 'expected_round_version'
  | 'expected_sheet_version'
  | 'expires_at'
  | 'gateState'
  | 'grade'
  | 'grantState'
  | 'handoff_package'
  | 'idempotency'
  | 'kind'
  | 'limit'
  | 'opaque_dependency'
  | 'passed'
  | 'payload'
  | 'project_id'
  | 'projectionFilter'
  | 'projection_policy_hash'
  | 'qc_result'
  | 'rateLimit'
  | 'readiness_projection'
  | 'reason'
  | 'reasonCode'
  | 'recall_projection_grant'
  | 'recall_sheet_row'
  | 'recall_sheet_version'
  | 'recipient_party_id'
  | 'recipient_spec_version'
  | 'recipient_spec_version_id'
  | 'revision_agreement'
  | 'revision_round'
  | 'rows'
  | 'serializableCommand'
  | 'session'
  | 'sessionId'
  | 'sheet_version_id'
  | 'signedGrant'
  | 'songId'
  | 'source_version_id'
  | 'tenantScope'
  | 'unverifiable'
  | 'warning';
interface SessionsDeliveryReadinessWorkbenchContractFields {
  source: '09d-sessions-delivery-readiness.md';
  fields: Readonly<Record<SessionsDeliveryReadinessContractField, unknown>>;
}
```

```ts
type DawBridgeEvidenceGateContractField =
  | 'ActivateBridge'
  | 'ActivateBridgeRequest'
  | 'BridgeActivationResponse'
  | 'agent_version'
  | 'allowed_roots_attestation'
  | 'auditOutbox'
  | 'authContext'
  | 'authorization'
  | 'bridge_device'
  | 'bridge_ingest'
  | 'device_public_key'
  | 'disabled'
  | 'evidenceGate'
  | 'evidence_refs'
  | 'expected_device_version'
  | 'gateState'
  | 'gate_state'
  | 'grant_expires_at'
  | 'idempotency'
  | 'integrity'
  | 'last_seen_at'
  | 'limit'
  | 'missing_evidence_keys'
  | 'pending_review'
  | 'queue_ingest'
  | 'rateLimit'
  | 'read_bounce'
  | 'reasonCode'
  | 'requested_scopes'
  | 'residency'
  | 'serializableCommand'
  | 'songId'
  | 'tenantScope';
interface DawBridgeEvidenceGateWorkbenchContractFields {
  source: '09e-daw-bridge-evidence-gate.md';
  fields: Readonly<Record<DawBridgeEvidenceGateContractField, unknown>>;
}
```

| BE source | Owning component/prop | Every discovered application error code | UI state owner |
|---|---|---|---|
| `09a-project-containers-creative-docs.md` | `ProjectContainersCreativeDocsWorkbenchContractFields.fields` and `ProjectContainersCreativeDocsWorkbenchProps.contractFields` | `ACTING_CONTEXT_STALE`, `DEPENDENCY_UNAVAILABLE`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `INTEGRITY_FAILED`, `RESOURCE_NOT_FOUND`, `STORAGE_UNAVAILABLE`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `09b-roster-invitations-vault-access.md` | `RosterInvitationsVaultAccessWorkbenchContractFields.fields` and `RosterInvitationsVaultAccessWorkbenchProps.contractFields` | `ACCESS_REVOKED`, `ASSET_NOT_FOUND`, `DEPENDENCY_UNAVAILABLE`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `NDA_REQUIRED`, `RESOURCE_NOT_FOUND`, `STORAGE_UNAVAILABLE`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `09c-audio-version-review-approval.md` | `AudioVersionReviewApprovalWorkbenchContractFields.fields` and `AudioVersionReviewApprovalWorkbenchProps.contractFields` | `ACCESS_REVOKED`, `ASSET_NOT_FOUND`, `DEPENDENCY_UNAVAILABLE`, `DESCRIPTOR_PROPOSAL_CONFLICT`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `INTEGRITY_FAILED`, `NDA_REQUIRED`, `RESOURCE_NOT_FOUND`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `VERSION_DESCRIPTOR_TARGET_STALE` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `09d-sessions-delivery-readiness.md` | `SessionsDeliveryReadinessWorkbenchContractFields.fields` and `SessionsDeliveryReadinessWorkbenchProps.contractFields` | `ACCESS_REVOKED`, `ASSET_NOT_FOUND`, `DEPENDENCY_UNAVAILABLE`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `INTEGRITY_FAILED`, `RESOURCE_NOT_FOUND`, `SOURCE_STALE`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `09e-daw-bridge-evidence-gate.md` | `DawBridgeEvidenceGateWorkbenchContractFields.fields` and `DawBridgeEvidenceGateWorkbenchProps.contractFields` | `DEPENDENCY_UNAVAILABLE`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `RESOURCE_NOT_FOUND`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |

No discovered field or error code is allowed to fall through to generic rendering. An unrecognized schema discriminant or code is a contract mismatch: isolate in `ErrorBoundary`, show request ID and Retry/Status, and report scrubbed telemetry.

### Error class ownership

| Class | Required UI | Retry | Focus/announcement |
|---|---|---|---|
| 400 `INVALID_REQUEST` / 422 `VALIDATION_FAILED` | Summary plus field/row errors; preserve valid input | Correction only | Focus linked summary then field; concise alert |
| 401 `UNAUTHENTICATED` | Reauthentication with safe return; protected data removed | After session recovery | Focus auth heading; announce expiry |
| 403 `FORBIDDEN` / step-up | `<CapabilityGate>` with reason/recovery; no broadened disclosure | After capability/step-up refetch | Focus gate; no protected names |
| 404 | Disclosure-safe not-found; distinguish deleted only when authorized | Navigation | Focus route heading |
| 409 conflict/idempotency/state | `<SyncConflict>` with server/current version and preserved draft | Reconcile first | Focus conflict; announce no overwrite |
| 429 `RATE_LIMITED` | Inline countdown from `Retry-After`; input kept | At server time only | Polite coarse updates |
| 502/503/504 | Scoped degraded or full System / Degraded by honest renderability | Safe BE attempts only; mutation status first | Request ID/Retry; no raw provider detail |

## Navigation, Degradation, and Concurrency

- **Back/deep link/bookmark**: URL owns query, selection, cursor, and tab. Deep link refetches current authority/version, never serialized client authority.
- **Multi-tab**: version mismatch opens `<SyncConflict>`; another tab only invalidates. No last-write-wins UI claim.
- **Unsaved changes**: scoped draft survives recoverable auth and same-record navigation, but never enters logs, analytics, URL, or Realtime.
- **Authorization change**: revoke protected props/cache, cancel pending presentation, and refetch. Stale UI never authorizes.
- **Realtime reorder/duplication**: hints coalesce; canonical refetch is authoritative; focus/selection/draft remain if allowed.
- **Unknown mutation outcome**: render pending/manual review from operation status. Never show success or blindly resend.
- **Telemetry**: operation, route template, request ID, status, duration, and scrubbed IDs/hashes only. No bodies, evidence, secrets, contact data, or media URLs.

## Testing Obligations

| Level | Required assertions |
|---|---|
| Vitest unit/component | Exhaustive `AsyncState` and access variants; exact error copy/action; blur/submit timing; optimistic confirm/rollback; focus return; reduced motion; no unauthorized props |
| Vitest integration | Zod schemas accept BE fixtures/reject invalid variants; every operation maps fields/errors; ETag/idempotency/rate headers drive UI; Realtime only invalidates |
| Playwright E2E | Critical IA flows by role; keyboard; landmarks/names/live regions; three breakpoints; 200% zoom; offline/reconnect; stale multi-tab; auth expiry; 429/outage |
| Accessibility | axe zero serious/critical; contrast/non-color cues; VoiceOver/NVDA smoke; target size; focus; no trap; captions/transcripts where media exists |
| Performance | Server-first HTML; bounded islands; no hydration waterfall; stable skeleton; LCP <2.5 s, CLS <0.1; virtualize >100; route JS budget verified in phase plan |

## Deepening and Ambiguity Gate

| Pass | Result |
|---:|---|
| 1 state synchronization | URL, server resource/version, drafts, Realtime, and multi-tab have one authority order. |
| 2 degraded network | Thresholds, timeouts, rate waits, retries, offline intent, and unknown mutations are deterministic. |
| 3 user-flow persistence | Back, deep link, bookmark, auth return, drafts, and success transitions are named. |
| 4 responsive/touch | Every archetype has mobile, tablet, desktop composition plus target/keyboard parity. |
| 5 state enumeration | Idle, loading, per-class error, empty, success, optimistic states, disabled, degraded have triggers/exits. |
| 6 role rendering | Fixed matrix has no empty cells; named variants are capability-selected and disclosure-safe. |
| 7 accessibility edges | Keyboard, focus, announcements, contrast, reflow, reduced motion, timing, tables, media, confirmation are explicit. |
| 8 two-implementer | Components, props, routes, authority, interactions, errors, breakpoints, access, mappings need no undocumented choice. |
| 9 devil's advocate | Forged role/context, stale cache, duplicate activation, reordered hints, offline authority loss, inference, telemetry leaks fail closed. |
| 10 convergence | No new component, state, route, field mapping, permission, or unresolved locked decision emerged. |

**Ambiguity status**: PASS. Upstream IA and BE remain authoritative; this spec selects only allowed frontend implementation details. No product, permission, security, or data-placement decision is redefined.

## Open Questions

None. New product or architecture choices must re-open their originating locked stage and propagate forward.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-29 | Initial complete FE specification, source mapping, mandatory deepening, and convergence review | `/write-fe-spec` | All |

## Quality Gates Checklist

- [x] Every component has a props interface or explicit consumed-global props contract.
- [x] Every interactive element has trigger, keyboard/focus, success, failure, persistence, and recovery.
- [x] Every BE operation, schema group, parsed response field, and error class maps to a component owner.
- [x] Idle, loading, per-class error, empty, success, optimistic pending/rollback, disabled, and degraded states are defined.
- [x] WCAG 2.2 AA, keyboard, focus, screen reader, zoom/reflow, target size, contrast, timing, and reduced motion are specified.
- [x] Mobile, tablet, and desktop behavior is explicit.
- [x] IA accessibility, user flows, access controls, edge cases, and acceptance criteria are consumed.
- [x] Source Map covers every FE section.
- [x] Global design-system components and state language are consumed without reinvention.
- [x] Seven mandatory passes, two-implementer review, devil's-advocate review, and convergence pass completed.


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]

### References
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
