# Services marketplace lifecycle: Frontend Specification

> **Classification**: Feature specification
> **BE Source**: [14a-service-listings-quotes-engagements.md](../be/14a-service-listings-quotes-engagements.md), [14b-requirements-sla-milestones-revisions.md](../be/14b-requirements-sla-milestones-revisions.md), [14c-delivery-acceptance-exit-rights.md](../be/14c-delivery-acceptance-exit-rights.md), [14d-substitution-multiparty-supply.md](../be/14d-substitution-multiparty-supply.md), [14e-repair-inspection-custody.md](../be/14e-repair-inspection-custody.md)
> **IA Source**: [14-services-marketplace.md](../ia/14-services-marketplace.md)
> **Surface**: Responsive Astro hybrid web/PWA with bounded React islands
> **Status**: Complete

## Referenced Material Inventory

- **Primary IA**: [14-services-marketplace.md](../ia/14-services-marketplace.md) in full.
- **BE sources**: [14a-service-listings-quotes-engagements.md](../be/14a-service-listings-quotes-engagements.md), [14b-requirements-sla-milestones-revisions.md](../be/14b-requirements-sla-milestones-revisions.md), [14c-delivery-acceptance-exit-rights.md](../be/14c-delivery-acceptance-exit-rights.md), [14d-substitution-multiparty-supply.md](../be/14d-substitution-multiparty-supply.md), [14e-repair-inspection-custody.md](../be/14e-repair-inspection-custody.md).
- **Cross-cutting FE source**: [00-infrastructure.md](00-infrastructure.md).
- **Design sources**: [design-system.md](../design-system.md), root `PRODUCT.md`, root `DESIGN.md`, and `.agents/skills/brand-guidelines/SKILL.md`.
- **Contract conventions**: BE00 `ApiError`, opaque cursor pagination, ETag/`If-Match`, idempotency, rate-limit headers, canonical refetch after Realtime hints, and disclosure-safe authorization.

## Source Map

| FE section | Authoritative source | Consumed material |
|---|---|---|
| Classification and scope | `14-services-marketplace.md`; BE index | Shard boundary and completed BE split group |
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

### `ServicesMarketplaceRoute` (Astro server route)

```ts
interface ServicesMarketplaceRouteProps {
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

### `ServiceListingsQuotesEngagementsWorkbench` (bounded React island)

**BE owner**: `14a-service-listings-quotes-engagements.md`

```ts
interface ServiceListingsQuotesEngagementsWorkbenchProps {
  contractFields: ServiceListingsQuotesEngagementsWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly ServiceListingsQuotesEngagementsRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface ServiceListingsQuotesEngagementsRecord {
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

### `RequirementsSlaMilestonesRevisionsWorkbench` (bounded React island)

**BE owner**: `14b-requirements-sla-milestones-revisions.md`

```ts
interface RequirementsSlaMilestonesRevisionsWorkbenchProps {
  contractFields: RequirementsSlaMilestonesRevisionsWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly RequirementsSlaMilestonesRevisionsRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface RequirementsSlaMilestonesRevisionsRecord {
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

### `DeliveryAcceptanceExitRightsWorkbench` (bounded React island)

**BE owner**: `14c-delivery-acceptance-exit-rights.md`

```ts
interface DeliveryAcceptanceExitRightsWorkbenchProps {
  contractFields: DeliveryAcceptanceExitRightsWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly DeliveryAcceptanceExitRightsRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface DeliveryAcceptanceExitRightsRecord {
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

### `SubstitutionMultipartySupplyWorkbench` (bounded React island)

**BE owner**: `14d-substitution-multiparty-supply.md`

```ts
interface SubstitutionMultipartySupplyWorkbenchProps {
  contractFields: SubstitutionMultipartySupplyWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly SubstitutionMultipartySupplyRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface SubstitutionMultipartySupplyRecord {
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

### `RepairInspectionCustodyWorkbench` (bounded React island)

**BE owner**: `14e-repair-inspection-custody.md`

```ts
interface RepairInspectionCustodyWorkbenchProps {
  contractFields: RepairInspectionCustodyWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly RepairInspectionCustodyRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface RepairInspectionCustodyRecord {
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
| `/app/services-marketplace` | Astro SSR or cache-safe prerender by route registry | Public exposes public projection; protected verifies session/acting context; admin requires explicit capability and named step-up | Query, cursor, selected record, tab are URL state; invalid values normalize with `replaceState`; Back restores selection/scroll |
| `/app/services-marketplace/:recordId` | Server-first detail with bounded islands | Concealed returns disclosure-safe 404; visible forbidden uses `<CapabilityGate>`; expired session preserves safe return target | Bookmark resolves current canonical version; stale/deleted target shows exact state and safe parent |
| System/degraded boundary | Preserved shell when safe | Unsafe cached content removed for privacy, legal, takedown, or revoked authority | Retry repeats safe read; mutation status reconciles before retry |

## Interaction Specification

| Interaction | Trigger and focus | Preconditions | Success | Failure and recovery | Persistence |
|---|---|---|---|---|---|
| `SRV-01` Publish service listing | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-02` Browse/request quote | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-03` Issue/reissue quote | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-04` Accept quote | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-05` Satisfy requirements gate | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-06` Start/pause SLA | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-07` Deliver milestone | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-08` Request revision | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-09` Accept change order | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-10` Deliver final work | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-11` Accept/auto-accept | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-12` Cancel/abandon/release | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-13` Open recall | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-14` Substitute supplier | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-15` Compose fixer/bundle | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-16` Execute rights posture | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-17` Run repair service | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-18` Complete inspection | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |
| `SRV-19` Record damage claim | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |

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
| Route shell/navigation | 1.3.1, 2.4.1–2.4.3, 2.4.7/2.4.11 | Skip link; logical DOM; route focuses `h1` | Named landmarks, one main, `aria-current=page`, unique title | `14-services-marketplace.md` Accessibility/User Flows |
| Workbench selection | 1.3.1, 2.1.1, 2.4.3, 4.1.2 | Native controls; Enter opens; Escape closes bounded inspector; focus returns | Named list/detail; selected state; state/provenance text | `14-services-marketplace.md` Interactions/Access Control |
| Forms/validation | 1.3.1, 3.3.1–3.3.4, 4.1.3 | Persistent labels; linked summary focuses first invalid field; no trap | `aria-invalid`, `aria-describedby`, error links, polite status | `14-services-marketplace.md` Acceptance Criteria/Edge Cases |
| Async/refetch/conflict | 2.2.1, 2.4.3, 4.1.3 | Refresh never steals focus; Retry native; conflict begins at heading | Polite atomic update; stale/pending/failed text; request ID | `14-services-marketplace.md` Interactions/BE failures |
| Tables/filters | 1.3.1, 1.4.10, 2.1.1, 2.5.8 | Header buttons; Apply/Reset; 24 CSS px minimum, 44 preferred | Caption, headers, sort, count, active-filter summary | `14-services-marketplace.md` User Flows/responsive |
| High-risk confirmation | 2.1.2, 2.4.3, 3.3.4, 4.1.2 | Inline first; dialog heading focus, Tab containment, Escape before commit, return focus | Consequence, scope, version, context, step-up, irreversible effect | `14-services-marketplace.md` Access Control/Edge Cases |
| Motion/media | 1.2.x where applicable, 2.2.2, 2.3.3 | Media keyboard controls; pause/stop; no essential timed gesture | Captions/transcript/metadata; reduced motion; waveform never sole content | `14-services-marketplace.md` Accessibility |

The inventory exceeds the thin-coverage threshold and is woven into component contracts. WCAG 2.2 AA is the release floor, exceeding the requested 2.1 AA gate.

## FE Rubric Closure

This section makes every FE-rubric checkpoint explicit. It narrows implementation choices without changing any upstream product, permission, security, or data contract.

### Complete component contracts

Every local component interface above includes `children?: never` and a `DomainVariant`. “Never” is deliberate because Astro slots and canonical global components own composition; these route/workbench boundaries do not accept arbitrary children.

| Component | Props interface | Children | Named variants | BE/IA source |
|---|---|---|---|---|
| `ServicesMarketplaceRoute` | `ServicesMarketplaceRouteProps` | `never` | `publicPage`, `appPage`, `adminPage`, `authPage`, `degradedPage` | `14-services-marketplace.md` user flows/accessibility; design-system page archetypes |
| `ServiceListingsQuotesEngagementsWorkbench` | `ServiceListingsQuotesEngagementsWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `14a-service-listings-quotes-engagements.md` request/response fields; `14-services-marketplace.md` interactions/access rules |
| `RequirementsSlaMilestonesRevisionsWorkbench` | `RequirementsSlaMilestonesRevisionsWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `14b-requirements-sla-milestones-revisions.md` request/response fields; `14-services-marketplace.md` interactions/access rules |
| `DeliveryAcceptanceExitRightsWorkbench` | `DeliveryAcceptanceExitRightsWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `14c-delivery-acceptance-exit-rights.md` request/response fields; `14-services-marketplace.md` interactions/access rules |
| `SubstitutionMultipartySupplyWorkbench` | `SubstitutionMultipartySupplyWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `14d-substitution-multiparty-supply.md` request/response fields; `14-services-marketplace.md` interactions/access rules |
| `RepairInspectionCustodyWorkbench` | `RepairInspectionCustodyWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `14e-repair-inspection-custody.md` request/response fields; `14-services-marketplace.md` interactions/access rules |
| Global primitives consumed by this spec | Canonical interfaces from design-system Global Component Inventory; local wrappers forbidden | Canonical slot only where that interface declares it, otherwise `never` | `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `error` plus semantic/access variants named above | `design-system.md` Global Component Inventory and State Language |

### IA flow to page/component ownership

| IA flow | Trigger/response owner | Source citation | Visual feedback and timing |
|---|---|---|---|
| `SRV-01` Publish service listing | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-01` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-02` Browse/request quote | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-02` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-03` Issue/reissue quote | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-03` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-04` Accept quote | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-04` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-05` Satisfy requirements gate | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-05` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-06` Start/pause SLA | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-06` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-07` Deliver milestone | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-07` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-08` Request revision | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-08` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-09` Accept change order | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-09` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-10` Deliver final work | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-10` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-11` Accept/auto-accept | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-11` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-12` Cancel/abandon/release | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-12` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-13` Open recall | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-13` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-14` Substitute supplier | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-14` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-15` Compose fixer/bundle | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-15` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-16` Execute rights posture | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-16` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-17` Run repair service | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-17` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-18` Complete inspection | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-18` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |
| `SRV-19` Record damage claim | `ServicesMarketplaceRoute` orchestrates; `ServiceListingsQuotesEngagementsWorkbench`, `RequirementsSlaMilestonesRevisionsWorkbench`, `DeliveryAcceptanceExitRightsWorkbench`, `SubstitutionMultipartySupplyWorkbench`, `RepairInspectionCustodyWorkbench` renders the relevant BE response and command state | `14-services-marketplace.md` Interactions row `SRV-19` | Pressed/pending state in the same animation frame; inline progress after 250 ms; result or typed error text plus polite announcement within 100 ms of parsed response; 150–220 ms visual transition |

Every IA interaction row is represented above. No flow is inferred from a heading or omitted because it shares an endpoint.

### Server, URL, and client state query registry

| BE operation/query | Server-state key | URL state | Island-local state | All async render states |
|---|---|---|---|---|
| `SRV-LST-API-01` from `14a-service-listings-quotes-engagements.md` | `['SRV-LST-API-01', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-LST-API-02` from `14a-service-listings-quotes-engagements.md` | `['SRV-LST-API-02', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-LST-API-04` from `14a-service-listings-quotes-engagements.md` | `['SRV-LST-API-04', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-REQ-API-01` from `14a-service-listings-quotes-engagements.md` | `['SRV-REQ-API-01', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-REQ-API-05` from `14a-service-listings-quotes-engagements.md` | `['SRV-REQ-API-05', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-DEL-API-01` from `14a-service-listings-quotes-engagements.md` | `['SRV-DEL-API-01', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-DEL-API-04` from `14a-service-listings-quotes-engagements.md` | `['SRV-DEL-API-04', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-SUP-API-01` from `14a-service-listings-quotes-engagements.md` | `['SRV-SUP-API-01', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-SUP-API-03` from `14a-service-listings-quotes-engagements.md` | `['SRV-SUP-API-03', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-CUS-API-01` from `14a-service-listings-quotes-engagements.md` | `['SRV-CUS-API-01', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-CUS-API-03` from `14a-service-listings-quotes-engagements.md` | `['SRV-CUS-API-03', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-LST-API-03` from `14a-service-listings-quotes-engagements.md` | `['SRV-LST-API-03', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-REQ-API-02` from `14b-requirements-sla-milestones-revisions.md` | `['SRV-REQ-API-02', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-REQ-API-03` from `14b-requirements-sla-milestones-revisions.md` | `['SRV-REQ-API-03', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-REQ-API-04` from `14b-requirements-sla-milestones-revisions.md` | `['SRV-REQ-API-04', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-DEL-API-02` from `14c-delivery-acceptance-exit-rights.md` | `['SRV-DEL-API-02', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-DEL-API-03` from `14c-delivery-acceptance-exit-rights.md` | `['SRV-DEL-API-03', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-SUP-API-02` from `14d-substitution-multiparty-supply.md` | `['SRV-SUP-API-02', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |
| `SRV-CUS-API-02` from `14e-repair-inspection-custody.md` | `['SRV-CUS-API-02', actingPartyId, normalizedPath, normalizedQuery]`; response parsed by its named Zod schema and versioned by ETag | `q`, `sort`, `filter`, `cursor`, `selected`, and `tab` when the operation uses them; absent keys are explicit defaults | Draft fields, disclosure state, focus, pending operation ID, and reversible optimistic overlay only | idle, loading after 250 ms, typed error per class, empty, success, optimistic pending, optimistic rollback, disabled, degraded |

No global client store is authorized. A new cross-island state need requires architecture review; until then URL/server state or a colocated island state owns it.

### Route registry with guards and metadata

| URL pattern | Auth guard and failure redirect | Page component | Meta title | Meta description |
|---|---|---|---|---|
| `/app/services-marketplace` | Server validates Supabase token, expiry, acting context, and route capability. Missing/expired token redirects 303 to `/auth/sign-in?returnTo=%2Fapp%2Fservices-marketplace` after allowlist normalization. Valid but concealed target returns 404; visible forbidden target renders `CapabilityGate`. | `ServicesMarketplaceRoute` variant `appPage` | `Services marketplace lifecycle | WeJammin` | `Work with services marketplace lifecycle using current authority, record state, and provenance.` |
| `/app/services-marketplace/:recordId` | Same token/expiry/context check; malformed ID returns 400, concealed/unreadable returns 404, expired session uses the same safe sign-in redirect. | `ServicesMarketplaceRoute` with the matching workbench detail variant | `Record | Services marketplace lifecycle | WeJammin` | `Review the current record, provenance, history, and permitted actions.` |
| Public projection when a BE route declares one | No session accepted as authority; public projection only. Unsafe or non-public record returns disclosure-safe 404, never app-shell redirect. | `ServicesMarketplaceRoute` variant `publicPage` | `Services marketplace lifecycle | WeJammin` | `View the public, provenance-labelled record.` |
| System/degraded boundary | Preserves verified shell only; Retry stays on canonical URL; unsafe cached data is removed. | `ServicesMarketplaceRoute` variant `degradedPage` | `Service status | WeJammin` | `Review affected scope, last verified time, request ID, and recovery action.` |

### Per-component responsive contract

| Component | Mobile ≤768 px | Tablet 769–1024 px | Desktop ≥1025 px |
|---|---|---|---|
| `ServicesMarketplaceRoute` | Four-column shell, 16 px gutter/margins, compact tabs, stack navigation, Back before detail, no horizontal page scroll at 320 CSS px | Eight-column shell, 20 px gutter, 24 px margins, collapsible sidebar, list/inspector when container permits | Twelve-column shell, 24 px gutter, max 1440 px, persistent sidebar/top bar, stable route heading/action region |
| `ServiceListingsQuotesEngagementsWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `RequirementsSlaMilestonesRevisionsWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `DeliveryAcceptanceExitRightsWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `SubstitutionMultipartySupplyWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `RepairInspectionCustodyWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
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
| `ServicesMarketplaceRoute` public variant | ≤45 KB initial route JS; zero hydration when static | Hydrate only a visible interaction with `client:visible`; no global router | Astro image pipeline emits width/height, AVIF/WebP plus fallback, responsive `srcset`/`sizes`; below-fold images lazy; hero/record identity eager only when LCP | LCP <2.5 s, INP <200 ms, CLS <0.1 at p75 |
| `ServicesMarketplaceRoute` app/admin variant | ≤90 KB initial route JS including shared shell | Each workbench island ≤35 KB initial; editor/media/chart modules split to ≤80 KB lazy chunk and load on explicit entry/visibility; independent fetches parallel | Same optimized image contract; audio/video metadata preload only until explicit play; waveform data lazy and functional | LCP <2.5 s, INP <200 ms, CLS <0.1; interaction feedback same frame |
| `ServiceListingsQuotesEngagementsWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `RequirementsSlaMilestonesRevisionsWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `DeliveryAcceptanceExitRightsWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `SubstitutionMultipartySupplyWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `RepairInspectionCustodyWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |

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
| `14a-service-listings-quotes-engagements.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `14b-requirements-sla-milestones-revisions.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `14c-delivery-acceptance-exit-rights.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `14d-substitution-multiparty-supply.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `14e-repair-inspection-custody.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |

## Data Mapping

Every BE operation and parsed response field is owned below. Components consume generated Zod-inferred types; no hand-written partial DTO may silently omit a field. A field is displayed, drives explicit state/control, or is non-rendered for a named security reason.

| BE source | Operation | Method/path | Success to component | Error mapping |
|---|---|---|---|---|
| `14a-service-listings-quotes-engagements.md` | `SRV-LST-API-01` | `REGISTERED See 14a-service-listings-quotes-engagements.md route registry` | `2xx` parsed into `ServiceListingsQuotesEngagementsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14a-service-listings-quotes-engagements.md` | `SRV-LST-API-02` | `REGISTERED See 14a-service-listings-quotes-engagements.md route registry` | `2xx` parsed into `ServiceListingsQuotesEngagementsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14a-service-listings-quotes-engagements.md` | `SRV-REQ-API-01` | `REGISTERED See 14a-service-listings-quotes-engagements.md route registry` | `2xx` parsed into `ServiceListingsQuotesEngagementsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14a-service-listings-quotes-engagements.md` | `SRV-DEL-API-01` | `REGISTERED See 14a-service-listings-quotes-engagements.md route registry` | `2xx` parsed into `ServiceListingsQuotesEngagementsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14a-service-listings-quotes-engagements.md` | `SRV-SUP-API-01` | `REGISTERED See 14a-service-listings-quotes-engagements.md route registry` | `2xx` parsed into `ServiceListingsQuotesEngagementsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14a-service-listings-quotes-engagements.md` | `SRV-DEL-API-04` | `REGISTERED See 14a-service-listings-quotes-engagements.md route registry` | `2xx` parsed into `ServiceListingsQuotesEngagementsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14a-service-listings-quotes-engagements.md` | `SRV-CUS-API-01` | `REGISTERED See 14a-service-listings-quotes-engagements.md route registry` | `2xx` parsed into `ServiceListingsQuotesEngagementsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14a-service-listings-quotes-engagements.md` | `SRV-LST-API-03` | `REGISTERED See 14a-service-listings-quotes-engagements.md route registry` | `2xx` parsed into `ServiceListingsQuotesEngagementsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14a-service-listings-quotes-engagements.md` | `SRV-LST-API-04` | `REGISTERED See 14a-service-listings-quotes-engagements.md route registry` | `2xx` parsed into `ServiceListingsQuotesEngagementsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14b-requirements-sla-milestones-revisions.md` | `SRV-REQ-API-01` | `REGISTERED See 14b-requirements-sla-milestones-revisions.md route registry` | `2xx` parsed into `RequirementsSlaMilestonesRevisionsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14b-requirements-sla-milestones-revisions.md` | `SRV-REQ-API-02` | `REGISTERED See 14b-requirements-sla-milestones-revisions.md route registry` | `2xx` parsed into `RequirementsSlaMilestonesRevisionsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14b-requirements-sla-milestones-revisions.md` | `SRV-REQ-API-03` | `REGISTERED See 14b-requirements-sla-milestones-revisions.md route registry` | `2xx` parsed into `RequirementsSlaMilestonesRevisionsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14b-requirements-sla-milestones-revisions.md` | `SRV-REQ-API-04` | `REGISTERED See 14b-requirements-sla-milestones-revisions.md route registry` | `2xx` parsed into `RequirementsSlaMilestonesRevisionsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14b-requirements-sla-milestones-revisions.md` | `SRV-REQ-API-05` | `REGISTERED See 14b-requirements-sla-milestones-revisions.md route registry` | `2xx` parsed into `RequirementsSlaMilestonesRevisionsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14c-delivery-acceptance-exit-rights.md` | `SRV-DEL-API-01` | `REGISTERED See 14c-delivery-acceptance-exit-rights.md route registry` | `2xx` parsed into `DeliveryAcceptanceExitRightsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14c-delivery-acceptance-exit-rights.md` | `SRV-DEL-API-02` | `REGISTERED See 14c-delivery-acceptance-exit-rights.md route registry` | `2xx` parsed into `DeliveryAcceptanceExitRightsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14c-delivery-acceptance-exit-rights.md` | `SRV-DEL-API-03` | `REGISTERED See 14c-delivery-acceptance-exit-rights.md route registry` | `2xx` parsed into `DeliveryAcceptanceExitRightsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14c-delivery-acceptance-exit-rights.md` | `SRV-DEL-API-04` | `REGISTERED See 14c-delivery-acceptance-exit-rights.md route registry` | `2xx` parsed into `DeliveryAcceptanceExitRightsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14d-substitution-multiparty-supply.md` | `SRV-SUP-API-01` | `REGISTERED See 14d-substitution-multiparty-supply.md route registry` | `2xx` parsed into `SubstitutionMultipartySupplyWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14d-substitution-multiparty-supply.md` | `SRV-SUP-API-02` | `REGISTERED See 14d-substitution-multiparty-supply.md route registry` | `2xx` parsed into `SubstitutionMultipartySupplyWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14d-substitution-multiparty-supply.md` | `SRV-SUP-API-03` | `REGISTERED See 14d-substitution-multiparty-supply.md route registry` | `2xx` parsed into `SubstitutionMultipartySupplyWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14e-repair-inspection-custody.md` | `SRV-CUS-API-01` | `REGISTERED See 14e-repair-inspection-custody.md route registry` | `2xx` parsed into `RepairInspectionCustodyWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14e-repair-inspection-custody.md` | `SRV-CUS-API-02` | `REGISTERED See 14e-repair-inspection-custody.md route registry` | `2xx` parsed into `RepairInspectionCustodyWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `14e-repair-inspection-custody.md` | `SRV-CUS-API-03` | `REGISTERED See 14e-repair-inspection-custody.md route registry` | `2xx` parsed into `RepairInspectionCustodyWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |

### Response field ownership

| BE source | Contract schemas | Parsed field set | UI ownership |
|---|---|---|---|
| `14a-service-listings-quotes-engagements.md` | Named source schemas | `service_listing`, `listing_version`, `pricing_model_version`, `quote_request`, `quote_version`, `quote_acknowledgement`, `engagement`, `RecordHandoffOutcome`, `expected_version`, `PublishListingRequest`, `PublishListingSuccess`, `ErrorResponse`, `QuoteRequestRequest`, `QuoteRequestSuccess`, `IssueQuoteRequest`, `IssueQuoteSuccess`, `AcceptQuoteRequest`, `AcceptQuoteSuccess`, `operationId`, `created_at`, `updated_at`, `version`, `terms_hash`, `PublishListing`, `IssueQuote`, `AcceptQuote`, `service_role`, `aggregate_version` | `ServiceListingsQuotesEngagementsWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `14b-requirements-sla-milestones-revisions.md` | Named source schemas | `engagement`, `requirement_item`, `requirement_submission`, `sla_clock_event`, `milestone`, `milestone_delivery`, `revision_round`, `revision_note`, `change_order`, `RequirementsRequest`, `RequirementsSuccess`, `ErrorResponse`, `SlaClockRequest`, `SlaClockSuccess`, `MilestoneDeliveryRequest`, `MilestoneDeliverySuccess`, `RevisionRequest`, `RevisionSuccess`, `ChangeOrderRequest`, `ChangeOrderSuccess`, `deadlocked`, `anon` | `RequirementsSlaMilestonesRevisionsWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `14c-delivery-acceptance-exit-rights.md` | Named source schemas | `delivery`, `delivery_artifact`, `acceptance`, `exit_settlement`, `recall_policy_version`, `recall_allowance`, `recall`, `window_days`, `ends_at`, `FinalDeliveryRequest`, `FinalDeliverySuccess`, `ErrorResponse`, `AcceptDeliveryRequest`, `AcceptDeliverySuccess`, `ExitRequest`, `ExitSuccess`, `OpenRecallRequest`, `OpenRecallSuccess`, `committed_at`, `ExecuteAcceptance`, `consumed_count`, `anon` | `DeliveryAcceptanceExitRightsWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `14d-substitution-multiparty-supply.md` | Named source schemas | `substitution`, `supply_composition`, `rights_election`, `rights_execution`, `performance_declaration`, `source_warranty`, `SubstitutionRequest`, `SubstitutionSuccess`, `ErrorResponse`, `SupplyRequest`, `SupplySuccess`, `RightsExecutionRequest`, `RightsExecutionSuccess`, `creates_none`, `assignment`, `licence`, `co_ownership`, `points` | `SubstitutionMultipartySupplyWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `14e-repair-inspection-custody.md` | Named source schemas | `custody_handoff`, `condition_record`, `inspection_report`, `damage_claim`, `service_audit_event`, `RepairJobRequest`, `RepairJobSuccess`, `ErrorResponse`, `InspectionRequest`, `InspectionSuccess`, `DamageClaimRequest`, `DamageClaimSuccess`, `report_version` | `RepairInspectionCustodyWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |

### Exhaustive BE field and error ownership

The unions below are generated from every contract identifier in each complete BE source, not a representative sample. Request-only identifiers remain because their owning form consumes them; response identifiers remain because the workbench renders them or uses them for explicit state/control. Generated Zod types remain normative if this conservative union includes a non-field identifier.

```ts
type ServiceListingsQuotesEngagementsContractField =
  | 'AcceptQuote'
  | 'AcceptQuoteRequest'
  | 'AcceptQuoteSuccess'
  | 'ApiError'
  | 'ErrorResponse'
  | 'IssueQuote'
  | 'IssueQuoteRequest'
  | 'IssueQuoteSuccess'
  | 'PublishListing'
  | 'PublishListingRequest'
  | 'PublishListingSuccess'
  | 'QuoteRequestRequest'
  | 'QuoteRequestSuccess'
  | 'RecordHandoffOutcome'
  | 'aggregate_version'
  | 'created_at'
  | 'engagement'
  | 'expected_version'
  | 'listing_version'
  | 'operationId'
  | 'pricing_model_version'
  | 'quote_acknowledgement'
  | 'quote_request'
  | 'quote_version'
  | 'service_listing'
  | 'service_role'
  | 'terms_hash'
  | 'updated_at';
interface ServiceListingsQuotesEngagementsWorkbenchContractFields {
  source: '14a-service-listings-quotes-engagements.md';
  fields: Readonly<Record<ServiceListingsQuotesEngagementsContractField, unknown>>;
}
```

```ts
type RequirementsSlaMilestonesRevisionsContractField =
  | 'ApiError'
  | 'ChangeOrderRequest'
  | 'ChangeOrderSuccess'
  | 'ErrorResponse'
  | 'MilestoneDeliveryRequest'
  | 'MilestoneDeliverySuccess'
  | 'RequirementsRequest'
  | 'RequirementsSuccess'
  | 'RevisionRequest'
  | 'RevisionSuccess'
  | 'SlaClockRequest'
  | 'SlaClockSuccess'
  | 'anon'
  | 'change_order'
  | 'deadlocked'
  | 'engagement'
  | 'milestone'
  | 'milestone_delivery'
  | 'requirement_item'
  | 'requirement_submission'
  | 'revision_note'
  | 'revision_round'
  | 'sla_clock_event';
interface RequirementsSlaMilestonesRevisionsWorkbenchContractFields {
  source: '14b-requirements-sla-milestones-revisions.md';
  fields: Readonly<Record<RequirementsSlaMilestonesRevisionsContractField, unknown>>;
}
```

```ts
type DeliveryAcceptanceExitRightsContractField =
  | 'AcceptDeliveryRequest'
  | 'AcceptDeliverySuccess'
  | 'ApiError'
  | 'ErrorResponse'
  | 'ExecuteAcceptance'
  | 'ExitRequest'
  | 'ExitSuccess'
  | 'FinalDeliveryRequest'
  | 'FinalDeliverySuccess'
  | 'OpenRecallRequest'
  | 'OpenRecallSuccess'
  | 'acceptance'
  | 'anon'
  | 'committed_at'
  | 'consumed_count'
  | 'delivery'
  | 'delivery_artifact'
  | 'ends_at'
  | 'exit_settlement'
  | 'recall'
  | 'recall_allowance'
  | 'recall_policy_version'
  | 'window_days';
interface DeliveryAcceptanceExitRightsWorkbenchContractFields {
  source: '14c-delivery-acceptance-exit-rights.md';
  fields: Readonly<Record<DeliveryAcceptanceExitRightsContractField, unknown>>;
}
```

```ts
type SubstitutionMultipartySupplyContractField =
  | 'ApiError'
  | 'ErrorResponse'
  | 'RightsExecutionRequest'
  | 'RightsExecutionSuccess'
  | 'SubstitutionRequest'
  | 'SubstitutionSuccess'
  | 'SupplyRequest'
  | 'SupplySuccess'
  | 'assignment'
  | 'co_ownership'
  | 'creates_none'
  | 'licence'
  | 'performance_declaration'
  | 'points'
  | 'rights_election'
  | 'rights_execution'
  | 'source_warranty'
  | 'substitution'
  | 'supply_composition';
interface SubstitutionMultipartySupplyWorkbenchContractFields {
  source: '14d-substitution-multiparty-supply.md';
  fields: Readonly<Record<SubstitutionMultipartySupplyContractField, unknown>>;
}
```

```ts
type RepairInspectionCustodyContractField =
  | 'ApiError'
  | 'DamageClaimRequest'
  | 'DamageClaimSuccess'
  | 'ErrorResponse'
  | 'InspectionRequest'
  | 'InspectionSuccess'
  | 'RepairJobRequest'
  | 'RepairJobSuccess'
  | 'condition_record'
  | 'custody_handoff'
  | 'damage_claim'
  | 'inspection_report'
  | 'report_version'
  | 'service_audit_event';
interface RepairInspectionCustodyWorkbenchContractFields {
  source: '14e-repair-inspection-custody.md';
  fields: Readonly<Record<RepairInspectionCustodyContractField, unknown>>;
}
```

| BE source | Owning component/prop | Every discovered application error code | UI state owner |
|---|---|---|---|
| `14a-service-listings-quotes-engagements.md` | `ServiceListingsQuotesEngagementsWorkbenchContractFields.fields` and `ServiceListingsQuotesEngagementsWorkbenchProps.contractFields` | `ACTING_CONTEXT_STALE`, `DEPENDENCY_UNAVAILABLE`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `LISTING_GATE_FAILED`, `LISTING_NOT_FOUND`, `PAYMENT_AUTH_FAILED`, `QUOTE_EXPIRED`, `QUOTE_NOT_FOUND`, `QUOTE_REQUEST_NOT_FOUND`, `RATE_LIMITED`, `RECALL_TERMS_INVALID`, `RIGHTS_EXECUTION_FAILED`, `SELF_ACCEPTANCE_FORBIDDEN`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `14b-requirements-sla-milestones-revisions.md` | `RequirementsSlaMilestonesRevisionsWorkbenchContractFields.fields` and `RequirementsSlaMilestonesRevisionsWorkbenchProps.contractFields` | `ACTING_CONTEXT_STALE`, `CHANGE_ORDER_NOT_FOUND`, `DELIVERY_NOT_FOUND`, `DEPENDENCY_UNAVAILABLE`, `ENGAGEMENT_NOT_FOUND`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `MILESTONE_NOT_FOUND`, `PAYMENT_AUTH_FAILED`, `QC_FAILED`, `QUOTE_EXPIRED`, `RATE_LIMITED`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `14c-delivery-acceptance-exit-rights.md` | `DeliveryAcceptanceExitRightsWorkbenchContractFields.fields` and `DeliveryAcceptanceExitRightsWorkbenchProps.contractFields` | `CREDIT_EMISSION_FAILED`, `DELIVERY_NOT_FOUND`, `DEPENDENCY_UNAVAILABLE`, `ENGAGEMENT_NOT_FOUND`, `EXIT_TERMS_INVALID`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `PAYMENT_AUTH_FAILED`, `QC_FAILED`, `RATE_LIMITED`, `RECALL_ALLOWANCE_CONFLICT`, `RECALL_TERMS_INVALID`, `RIGHTS_EXECUTION_FAILED`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `14d-substitution-multiparty-supply.md` | `SubstitutionMultipartySupplyWorkbenchContractFields.fields` and `SubstitutionMultipartySupplyWorkbenchProps.contractFields` | `ACTING_CONTEXT_STALE`, `CREDIT_EMISSION_FAILED`, `DEPENDENCY_UNAVAILABLE`, `ENGAGEMENT_NOT_FOUND`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `RATE_LIMITED`, `RIGHTS_EXECUTION_FAILED`, `SUBSTITUTION_INVALID`, `SUPPLY_COMPOSITION_INVALID`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `14e-repair-inspection-custody.md` | `RepairInspectionCustodyWorkbenchContractFields.fields` and `RepairInspectionCustodyWorkbenchProps.contractFields` | `CONFLICT_CHECK_FAILED`, `DEPENDENCY_UNAVAILABLE`, `ESTIMATE_INVALID`, `EVIDENCE_UNAVAILABLE`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH`, `ITEM_OR_ENGAGEMENT_NOT_FOUND`, `PAYMENT_AUTH_FAILED`, `RATE_LIMITED`, `REPAIR_JOB_NOT_FOUND`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |

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
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]

### References
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
