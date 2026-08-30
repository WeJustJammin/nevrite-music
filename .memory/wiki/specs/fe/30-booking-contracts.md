# Booking, negotiation and contracts: Frontend Specification

> **Classification**: Feature specification
> **BE Source**: [30a-booking-avails-commercial-positions.md](../be/30a-booking-avails-commercial-positions.md), [30b-booking-offers-approval-acceptance.md](../be/30b-booking-offers-approval-acceptance.md), [30c-booking-documents-payments-announcement.md](../be/30c-booking-documents-payments-announcement.md), [30d-booking-cancellation-postponement-exclusivity.md](../be/30d-booking-cancellation-postponement-exclusivity.md), [30e-booking-rfq-bill-construction.md](../be/30e-booking-rfq-bill-construction.md)
> **IA Source**: [30-booking-contracts.md](../ia/30-booking-contracts.md)
> **Surface**: Responsive Astro hybrid web/PWA with bounded React islands
> **Status**: Complete

## Referenced Material Inventory

- **Primary IA**: [30-booking-contracts.md](../ia/30-booking-contracts.md) in full.
- **BE sources**: [30a-booking-avails-commercial-positions.md](../be/30a-booking-avails-commercial-positions.md), [30b-booking-offers-approval-acceptance.md](../be/30b-booking-offers-approval-acceptance.md), [30c-booking-documents-payments-announcement.md](../be/30c-booking-documents-payments-announcement.md), [30d-booking-cancellation-postponement-exclusivity.md](../be/30d-booking-cancellation-postponement-exclusivity.md), [30e-booking-rfq-bill-construction.md](../be/30e-booking-rfq-bill-construction.md).
- **Cross-cutting FE source**: [00-infrastructure.md](00-infrastructure.md).
- **Design sources**: [design-system.md](../design-system.md), root `PRODUCT.md`, root `DESIGN.md`, and `.agents/skills/brand-guidelines/SKILL.md`.
- **Contract conventions**: BE00 `ApiError`, opaque cursor pagination, ETag/`If-Match`, idempotency, rate-limit headers, canonical refetch after Realtime hints, and disclosure-safe authorization.

## Source Map

| FE section | Authoritative source | Consumed material |
|---|---|---|
| Classification and scope | `30-booking-contracts.md`; BE index | Shard boundary and completed BE split group |
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

### `BookingContractsRoute` (Astro server route)

```ts
interface BookingContractsRouteProps {
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

### `BookingAvailsCommercialPositionsWorkbench` (bounded React island)

**BE owner**: `30a-booking-avails-commercial-positions.md`

```ts
interface BookingAvailsCommercialPositionsWorkbenchProps {
  contractFields: BookingAvailsCommercialPositionsWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly BookingAvailsCommercialPositionsRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface BookingAvailsCommercialPositionsRecord {
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

### `BookingOffersApprovalAcceptanceWorkbench` (bounded React island)

**BE owner**: `30b-booking-offers-approval-acceptance.md`

```ts
interface BookingOffersApprovalAcceptanceWorkbenchProps {
  contractFields: BookingOffersApprovalAcceptanceWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly BookingOffersApprovalAcceptanceRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface BookingOffersApprovalAcceptanceRecord {
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

### `BookingDocumentsPaymentsAnnouncementWorkbench` (bounded React island)

**BE owner**: `30c-booking-documents-payments-announcement.md`

```ts
interface BookingDocumentsPaymentsAnnouncementWorkbenchProps {
  contractFields: BookingDocumentsPaymentsAnnouncementWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly BookingDocumentsPaymentsAnnouncementRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface BookingDocumentsPaymentsAnnouncementRecord {
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

### `BookingCancellationPostponementExclusivityWorkbench` (bounded React island)

**BE owner**: `30d-booking-cancellation-postponement-exclusivity.md`

```ts
interface BookingCancellationPostponementExclusivityWorkbenchProps {
  contractFields: BookingCancellationPostponementExclusivityWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly BookingCancellationPostponementExclusivityRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface BookingCancellationPostponementExclusivityRecord {
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

### `BookingRfqBillConstructionWorkbench` (bounded React island)

**BE owner**: `30e-booking-rfq-bill-construction.md`

```ts
interface BookingRfqBillConstructionWorkbenchProps {
  contractFields: BookingRfqBillConstructionWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly BookingRfqBillConstructionRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface BookingRfqBillConstructionRecord {
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
| `/app/booking-contracts` | Astro SSR or cache-safe prerender by route registry | Public exposes public projection; protected verifies session/acting context; admin requires explicit capability and named step-up | Query, cursor, selected record, tab are URL state; invalid values normalize with `replaceState`; Back restores selection/scroll |
| `/app/booking-contracts/:recordId` | Server-first detail with bounded islands | Concealed returns disclosure-safe 404; visible forbidden uses `<CapabilityGate>`; expired session preserves safe return target | Bookmark resolves current canonical version; stale/deleted target shows exact state and safe parent |
| System/degraded boundary | Preserved shell when safe | Unsafe cached content removed for privacy, legal, takedown, or revoked authority | Retry repeats safe read; mutation status reconciles before retry |

## Interaction Specification

| Interaction | Trigger and focus | Preconditions | Success | Failure and recovery | Persistence |
|---|---|---|---|---|---|
| `30-UI-01` Canonical route interaction | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |

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
| Route shell/navigation | 1.3.1, 2.4.1–2.4.3, 2.4.7/2.4.11 | Skip link; logical DOM; route focuses `h1` | Named landmarks, one main, `aria-current=page`, unique title | `30-booking-contracts.md` Accessibility/User Flows |
| Workbench selection | 1.3.1, 2.1.1, 2.4.3, 4.1.2 | Native controls; Enter opens; Escape closes bounded inspector; focus returns | Named list/detail; selected state; state/provenance text | `30-booking-contracts.md` Interactions/Access Control |
| Forms/validation | 1.3.1, 3.3.1–3.3.4, 4.1.3 | Persistent labels; linked summary focuses first invalid field; no trap | `aria-invalid`, `aria-describedby`, error links, polite status | `30-booking-contracts.md` Acceptance Criteria/Edge Cases |
| Async/refetch/conflict | 2.2.1, 2.4.3, 4.1.3 | Refresh never steals focus; Retry native; conflict begins at heading | Polite atomic update; stale/pending/failed text; request ID | `30-booking-contracts.md` Interactions/BE failures |
| Tables/filters | 1.3.1, 1.4.10, 2.1.1, 2.5.8 | Header buttons; Apply/Reset; 24 CSS px minimum, 44 preferred | Caption, headers, sort, count, active-filter summary | `30-booking-contracts.md` User Flows/responsive |
| High-risk confirmation | 2.1.2, 2.4.3, 3.3.4, 4.1.2 | Inline first; dialog heading focus, Tab containment, Escape before commit, return focus | Consequence, scope, version, context, step-up, irreversible effect | `30-booking-contracts.md` Access Control/Edge Cases |
| Motion/media | 1.2.x where applicable, 2.2.2, 2.3.3 | Media keyboard controls; pause/stop; no essential timed gesture | Captions/transcript/metadata; reduced motion; waveform never sole content | `30-booking-contracts.md` Accessibility |

The inventory exceeds the thin-coverage threshold and is woven into component contracts. WCAG 2.2 AA is the release floor, exceeding the requested 2.1 AA gate.

## FE Rubric Closure

This section makes every FE-rubric checkpoint explicit. It narrows implementation choices without changing any upstream product, permission, security, or data contract.

### Complete component contracts

Every local component interface above includes `children?: never` and a `DomainVariant`. “Never” is deliberate because Astro slots and canonical global components own composition; these route/workbench boundaries do not accept arbitrary children.

| Component | Props interface | Children | Named variants | BE/IA source |
|---|---|---|---|---|
| `BookingContractsRoute` | `BookingContractsRouteProps` | `never` | `publicPage`, `appPage`, `adminPage`, `authPage`, `degradedPage` | `30-booking-contracts.md` user flows/accessibility; design-system page archetypes |
| `BookingAvailsCommercialPositionsWorkbench` | `BookingAvailsCommercialPositionsWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `30a-booking-avails-commercial-positions.md` request/response fields; `30-booking-contracts.md` interactions/access rules |
| `BookingOffersApprovalAcceptanceWorkbench` | `BookingOffersApprovalAcceptanceWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `30b-booking-offers-approval-acceptance.md` request/response fields; `30-booking-contracts.md` interactions/access rules |
| `BookingDocumentsPaymentsAnnouncementWorkbench` | `BookingDocumentsPaymentsAnnouncementWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `30c-booking-documents-payments-announcement.md` request/response fields; `30-booking-contracts.md` interactions/access rules |
| `BookingCancellationPostponementExclusivityWorkbench` | `BookingCancellationPostponementExclusivityWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `30d-booking-cancellation-postponement-exclusivity.md` request/response fields; `30-booking-contracts.md` interactions/access rules |
| `BookingRfqBillConstructionWorkbench` | `BookingRfqBillConstructionWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `30e-booking-rfq-bill-construction.md` request/response fields; `30-booking-contracts.md` interactions/access rules |
| Global primitives consumed by this spec | Canonical interfaces from design-system Global Component Inventory; local wrappers forbidden | Canonical slot only where that interface declares it, otherwise `never` | `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `error` plus semantic/access variants named above | `design-system.md` Global Component Inventory and State Language |

### IA flow to page/component ownership

| IA flow | Interaction | Page/component owner | Preconditions | Required behavior / success response | Failure / recovery | Visual feedback and timing |
|---|---|---|---|---|---|---|
| `30.01` | Publish room-date avail | `BookingContractsRoute` | Authorized buyer-side actor; Shard-29 slot exists | Commercial intention, structured terms and visibility publish over slot | Physical changes stale the avail; never mutate source slot | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.02` | Publish artist routing window | `BookingContractsRoute` | Scoped representation/booking authority | Territory, pattern, quota, fee floor and visibility publish | Missing territorial authority rejects without leaking window | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.03` | Request commercial position | `BookingContractsRoute` | Named act and delegated authority; slot/window match | Position enters room and artist ladders with request snapshot | Actless request rejected; no arrival-order guarantee | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.04` | Reorder/release position | `BookingContractsRoute` | Authorized ladder owner; expected version | New ordered ladder version and notices commit | Stale reorder returns current ladder; no lost position silently | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.05` | Challenge superior position | `BookingContractsRoute` | Directly superior position exists; deadline valid | Challenge clock, escalation and response options open | Release beats concurrent challenge; timeout equals drop | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.06` | Compose offer | `BookingContractsRoute` | Eligible composer; current room/slot refs | Private entity-owned draft with typed economics/outcomes | Unsupported economic term reports vocabulary gap | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.07` | Send offer version | `BookingContractsRoute` | Draft passes structure/lint; recipient resolved | Immutable complete version snapshots terms, room refs, rider ref and expiry | Contradictory free text blocks; unstructured signal requires acknowledgment | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.08` | Receive external-recipient link | `BookingContractsRoute` | Recipient entity not yet claimed | Readable version and provenance available | Acceptance/approval blocked until entity claim/authority | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.09` | Counter offer | `BookingContractsRoute` | Live thread; actor may negotiate | Complete child version with deterministic diff/outcomes | Concurrent counters create sibling leaves | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.10` | Record verbal agreement | `BookingContractsRoute` | Actor can negotiate | Attributed unconfirmed transcription enters thread | Cannot approve/accept until counterparty confirms | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.11` | Approve offer version | `BookingContractsRoute` | Actor has binding capability under side rule | Version-hash approval appends; non-adverse carry-forward allowed | Self-dealing actor excluded; authority loss invalidates pending approval | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.12` | Accept offer | `BookingContractsRoute` | Sole live leaf; both chains satisfied; unexpired | Accepted version fixes deal, confirms commercial booking and announce prerequisites | Sibling/unexpired/authority mismatch rejects atomically | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.13` | Confirm under challenge | `BookingContractsRoute` | Accepted version and artist approval exist | Selected commercial position confirms; losing positions release/notify | Challenge race resolves one terminal result | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.14` | Authorize announcement | `BookingContractsRoute` | Confirmation, P-02 immutable consent evidence, P-05 group readiness and every hard prerequisite snapshot pass | Durable announce authorization emitted to downstream owner | Exact unsatisfied precondition and tier returned; missing, revoked, superseded or unreadable evidence fails closed | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.15` | Generate deal memo/contract | `BookingContractsRoute` | Accepted version; approved template version | Bound deal memo and optional long form generated reproducibly | Missing binding fails closed; PDF is view, never source | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.16` | Amend accepted deal | `BookingContractsRoute` | Proposed complete successor version; materiality known | Required chains approve amendment; schedule/contract append successor | Paid history preserved; no in-place edits | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.17` | Record payment schedule | `BookingContractsRoute` | Accepted deal and direction known | Deposit row zero, timed/deferred rows and reminders publish | Invalid gaps/party/direction reject | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.18` | Record payment outcome | `BookingContractsRoute` | Provider-confirmed or authorized bilateral assertion | Row state and evidence append; reminders reconcile | Ambiguous provider result remains pending and reconciles | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.19` | Handle overdue row | `BookingContractsRoute` | Due time passed; no settled outcome | Both parties see at-risk state and entitled principal options | No automatic void unless accepted term explicitly grants it | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.20` | Preview/commit cancellation | `BookingContractsRoute` | Booking active; actor can bind side | Exact deal/run recomputation and forfeit preview precede terminal event | Stale preview forces recompute; no surprise obligation | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.21` | Agree cancellation | `BookingContractsRoute` | Both binding chains approve same instrument | Contract-specific release/allocation commits | Delegate without bind authority cannot terminate | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.22` | Declare force majeure | `BookingContractsRoute` | Party references contract event and evidence | Attributed declaration, response and dispute route record | Platform never labels claim valid/invalid | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.23` | Postpone show | `BookingContractsRoute` | Both sides approve successor date/amendment | Original becomes postponed; successor lineage and migration tasks create | Any dependency refusal leaves original obligations visible | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.24` | Evaluate radius/exclusivity | `BookingContractsRoute` | Candidate hold/offer and active clauses available | Conflict/unknown/clear with clause owner and waiver route | Missing geodata/identity scope returns unknown | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.25` | Request/grant waiver | `BookingContractsRoute` | Named decider; clock bounded by blocked decision | Grant/refuse/lapse instrument appends | Break-glass only under live challenge and principal action | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.26` | Submit booking RFQ | `BookingContractsRoute` | Eligible booking actor; structured request | Rules triage and route to correct party/avail/slot | Auto-decline cites real structured reason; note never scored | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.27` | Construct bill/support offer | `BookingContractsRoute` | Show/bill owner; slot control available | Named/TBA slot and short/full deal thread attach to bill | Buy-on direction rejected; unsupported cancellation dependency remains explicit | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.28` | Record announce consent | `BookingContractsRoute` | Confirmed deal plus direct principal consent or accepted-deal pre-authorising term | Immutable exact-deal-version P-02 evidence appends; self-promoter collapses to one attributed action | Non-principal consent, stale/superseded terms and cross-deal evidence reuse fail closed | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.29` | Manage announce-group membership | `BookingContractsRoute` | Musician group owner; expected group version | Create/add/eject/dissolve event appends and readiness recomputes atomically | Operator mutation forbidden; stale version conflicts; no partial group mutation | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.30` | Request announce-group ejection | `BookingContractsRoute` | Operator controls an active member booking | Attributed request appends without membership change; privacy-safe aggregate view returns | Other member identities stay hidden; only Musician owner decides through 30.29 | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.31` | Waive Tier-2 announce precondition | `BookingContractsRoute` | P-06 unsatisfied, or P-07=`not_due_before_announce`; direct principal or exact-booking/precondition `announce_waive` delegate acts for one side | Permanent reason/authority snapshot append; two keys yield `waived`; P-07 debt/schedule survive; self-promoter collapses honestly | P-07 due-before/zero/unknown, generic authority, stale/revoked/expired/scope mismatch, missing reason or cross-side reuse fails closed | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.32` | Manage announce-waive capability | `BookingContractsRoute` | Direct principal; exact deal/booking and eligible `P-06|P-07`; named delegate; expected version | Immutable grant/revoke version and current state | Ineligible P-07 class, authority escalation, stale version, invalid term or non-principal action fails before mutation; history survives revocation | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.33` | Record on-sale schedule snapshot | `BookingContractsRoute` | Authenticated Shard-35 callback; exact schedule/version, local+UTC instants or free marker, timing-term ref/version, expected deal version | P-03 snapshot appends; prior-version pre-announce authorization supersedes | Missing/contradictory timing, term mismatch, stale deal/schedule or idempotency mismatch fails closed; announced lifecycle never reopens | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `30.34` | Commit scheduled announcement | `BookingContractsRoute` | Authenticated Shard-35 timer; exact active authorization and matching schedule versions; instant reached | Canonical deal transitions once to `announced`; announce record/version and events return | Missing/stale/superseded/revoked auth, schedule mismatch, early callback, unknown prerequisite or wrong lifecycle fails closed; replay dedupes | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |

Every IA interaction row is represented above by its exact identifier and source behavior. The route page is the orchestration owner and delegates to the named domain workbench from the component inventory; server contracts remain authoritative.

### Server, URL, and client state query registry

| BE operation/query | Server-state key | URL state | Island-local state | All async render states |
|---|---|---|---|---|

No global client store is authorized. A new cross-island state need requires architecture review; until then URL/server state or a colocated island state owns it.

### Route registry with guards and metadata

| URL pattern | Auth guard and failure redirect | Page component | Meta title | Meta description |
|---|---|---|---|---|
| `/app/booking-contracts` | Server validates Supabase token, expiry, acting context, and route capability. Missing/expired token redirects 303 to `/auth/sign-in?returnTo=%2Fapp%2Fbooking-contracts` after allowlist normalization. Valid but concealed target returns 404; visible forbidden target renders `CapabilityGate`. | `BookingContractsRoute` variant `appPage` | `Booking, negotiation and contracts | WeJammin` | `Work with booking, negotiation and contracts using current authority, record state, and provenance.` |
| `/app/booking-contracts/:recordId` | Same token/expiry/context check; malformed ID returns 400, concealed/unreadable returns 404, expired session uses the same safe sign-in redirect. | `BookingContractsRoute` with the matching workbench detail variant | `Record | Booking, negotiation and contracts | WeJammin` | `Review the current record, provenance, history, and permitted actions.` |
| Public projection when a BE route declares one | No session accepted as authority; public projection only. Unsafe or non-public record returns disclosure-safe 404, never app-shell redirect. | `BookingContractsRoute` variant `publicPage` | `Booking, negotiation and contracts | WeJammin` | `View the public, provenance-labelled record.` |
| System/degraded boundary | Preserves verified shell only; Retry stays on canonical URL; unsafe cached data is removed. | `BookingContractsRoute` variant `degradedPage` | `Service status | WeJammin` | `Review affected scope, last verified time, request ID, and recovery action.` |

### Per-component responsive contract

| Component | Mobile ≤768 px | Tablet 769–1024 px | Desktop ≥1025 px |
|---|---|---|---|
| `BookingContractsRoute` | Four-column shell, 16 px gutter/margins, compact tabs, stack navigation, Back before detail, no horizontal page scroll at 320 CSS px | Eight-column shell, 20 px gutter, 24 px margins, collapsible sidebar, list/inspector when container permits | Twelve-column shell, 24 px gutter, max 1440 px, persistent sidebar/top bar, stable route heading/action region |
| `BookingAvailsCommercialPositionsWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `BookingOffersApprovalAcceptanceWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `BookingDocumentsPaymentsAnnouncementWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `BookingCancellationPostponementExclusivityWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `BookingRfqBillConstructionWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
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
| `BookingContractsRoute` public variant | ≤45 KB initial route JS; zero hydration when static | Hydrate only a visible interaction with `client:visible`; no global router | Astro image pipeline emits width/height, AVIF/WebP plus fallback, responsive `srcset`/`sizes`; below-fold images lazy; hero/record identity eager only when LCP | LCP <2.5 s, INP <200 ms, CLS <0.1 at p75 |
| `BookingContractsRoute` app/admin variant | ≤90 KB initial route JS including shared shell | Each workbench island ≤35 KB initial; editor/media/chart modules split to ≤80 KB lazy chunk and load on explicit entry/visibility; independent fetches parallel | Same optimized image contract; audio/video metadata preload only until explicit play; waveform data lazy and functional | LCP <2.5 s, INP <200 ms, CLS <0.1; interaction feedback same frame |
| `BookingAvailsCommercialPositionsWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `BookingOffersApprovalAcceptanceWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `BookingDocumentsPaymentsAnnouncementWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `BookingCancellationPostponementExclusivityWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `BookingRfqBillConstructionWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |

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
| `30a-booking-avails-commercial-positions.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `30b-booking-offers-approval-acceptance.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `30c-booking-documents-payments-announcement.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `30d-booking-cancellation-postponement-exclusivity.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `30e-booking-rfq-bill-construction.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |

## Data Mapping

Every BE operation and parsed response field is owned below. Components consume generated Zod-inferred types; no hand-written partial DTO may silently omit a field. A field is displayed, drives explicit state/control, or is non-rendered for a named security reason.

| BE source | Operation | Method/path | Success to component | Error mapping |
|---|---|---|---|---|
| `30a-booking-avails-commercial-positions.md` | `30A-BOOKING-AVAILS-COMMERCIAL-POSITIONS-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `BookingAvailsCommercialPositionsWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `30b-booking-offers-approval-acceptance.md` | `30B-BOOKING-OFFERS-APPROVAL-ACCEPTANCE-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `BookingOffersApprovalAcceptanceWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `30c-booking-documents-payments-announcement.md` | `30C-BOOKING-DOCUMENTS-PAYMENTS-ANNOUNCEMENT-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `BookingDocumentsPaymentsAnnouncementWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `30d-booking-cancellation-postponement-exclusivity.md` | `30D-BOOKING-CANCELLATION-POSTPONEMENT-EXCLUSIVITY-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `BookingCancellationPostponementExclusivityWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `30e-booking-rfq-bill-construction.md` | `30E-BOOKING-RFQ-BILL-CONSTRUCTION-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `BookingRfqBillConstructionWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |

### Response field ownership

| BE source | Contract schemas | Parsed field set | UI ownership |
|---|---|---|---|
| `30a-booking-avails-commercial-positions.md` | Named source schemas | `Avail`, `CommercialLadder`, `CommercialPosition`, `Interactions`, `Contracts`, `AvailRequest`, `AvailResult`, `RoutingWindowResult`, `PositionRequest`, `PositionResult`, `PositionAction`, `PositionActionResult`, `ChallengeRequest`, `ChallengeResult`, `ErrorResponse`, `booking_avails`, `Room`, `commercial_ladders`, `commercial_positions`, `commercial_position_challenges`, `anon`, `draft`, `available`, `tentative`, `unavailable`, `expired`, `superseded`, `blocked`, `open`, `closed`, `requested`, `challenged`, `confirmed`, `released`, `displaced`, `PositionChallenge`, `submitted`, `upheld`, `rejected`, `withdrawn` | `BookingAvailsCommercialPositionsWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `30b-booking-offers-approval-acceptance.md` | Named source schemas | `OfferThread`, `OfferVersion`, `Approval`, `DealExpression`, `AcceptedDeal`, `Interactions`, `Contracts`, `Compose`, `OfferThreadResult`, `OfferAppend`, `OfferVersionResult`, `LinkReceipt`, `OfferLinkReceiptResult`, `CounterOfferResult`, `VerbalExpression`, `VerbalExpressionResult`, `ApprovalRequest`, `ApprovalResult`, `Acceptance`, `AcceptedDealResult`, `ChallengeConfirmation`, `ChallengeConfirmationResult` | `BookingOffersApprovalAcceptanceWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `30c-booking-documents-payments-announcement.md` | Named source schemas | `Interactions`, `Contracts`, `AnnounceAuthorization`, `DealDocument`, `PaymentSchedule`, `PaymentAssertion`, `AnnounceConsent`, `AnnounceGroup`, `AnnounceGroupEjectionRequest`, `AnnouncePreconditionWaiver`, `AnnounceWaiveCapability`, `OnSaleScheduleSnapshot`, `AnnounceRecord`, `DepositAnnouncePolicy`, `AnnounceGroupMembershipEvent`, `AnnounceGroupReadinessProjection`, `disputed`, `deposit_announce_policies`, `on_sale_schedule_snapshots`, `announce_authorizations`, `announce_records`, `announce_consents`, `announce_groups`, `announce_group_membership_events`, `announce_group_ejection_requests`, `announce_group_readiness_projections`, `announce_waive_capabilities`, `announce_precondition_waivers`, `deal_documents`, `payment_schedules`, `payment_assertions`, `tenant_id`, `created_at`, `timestamptz`, `anon`, `blocked`, `paid` | `BookingDocumentsPaymentsAnnouncementWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `30d-booking-cancellation-postponement-exclusivity.md` | Named source schemas | `CancellationInstrument`, `ForceMajeureDeclaration`, `Postponement`, `ExclusivityClause`, `WaiverInstrument`, `Interactions`, `Contracts`, `ambiguous` | `BookingCancellationPostponementExclusivityWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `30e-booking-rfq-bill-construction.md` | Named source schemas | `Bill`, `Interactions`, `Contracts`, `privateNote`, `booking_bills`, `booking_bill_slots`, `execute`, `search_path`, `auto_declined`, `manual_triage` | `BookingRfqBillConstructionWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |

### Exhaustive BE field and error ownership

The unions below are generated from every contract identifier in each complete BE source, not a representative sample. Request-only identifiers remain because their owning form consumes them; response identifiers remain because the workbench renders them or uses them for explicit state/control. Generated Zod types remain normative if this conservative union includes a non-field identifier.

```ts
type BookingAvailsCommercialPositionsContractField =
  | 'ApiError'
  | 'Avail'
  | 'AvailRequest'
  | 'AvailResult'
  | 'ChallengeRequest'
  | 'ChallengeResult'
  | 'CommercialLadder'
  | 'CommercialPosition'
  | 'Contracts'
  | 'ErrorResponse'
  | 'Interactions'
  | 'PositionAction'
  | 'PositionActionResult'
  | 'PositionChallenge'
  | 'PositionRequest'
  | 'PositionResult'
  | 'Room'
  | 'RoutingWindowResult'
  | 'anon'
  | 'available'
  | 'blocked'
  | 'booking_avails'
  | 'challenged'
  | 'closed'
  | 'commercial_ladders'
  | 'commercial_position_challenges'
  | 'commercial_positions'
  | 'confirmed'
  | 'displaced'
  | 'draft'
  | 'expired'
  | 'open'
  | 'rejected'
  | 'released'
  | 'requested'
  | 'submitted'
  | 'superseded'
  | 'tentative'
  | 'unavailable'
  | 'upheld'
  | 'withdrawn';
interface BookingAvailsCommercialPositionsWorkbenchContractFields {
  source: '30a-booking-avails-commercial-positions.md';
  fields: Readonly<Record<BookingAvailsCommercialPositionsContractField, unknown>>;
}
```

```ts
type BookingOffersApprovalAcceptanceContractField =
  | 'Acceptance'
  | 'AcceptedDeal'
  | 'AcceptedDealResult'
  | 'ApiError'
  | 'Approval'
  | 'ApprovalRequest'
  | 'ApprovalResult'
  | 'ChallengeConfirmation'
  | 'ChallengeConfirmationResult'
  | 'Compose'
  | 'Contracts'
  | 'CounterOfferResult'
  | 'DealExpression'
  | 'Interactions'
  | 'LinkReceipt'
  | 'OfferAppend'
  | 'OfferLinkReceiptResult'
  | 'OfferThread'
  | 'OfferThreadResult'
  | 'OfferVersion'
  | 'OfferVersionResult'
  | 'VerbalExpression'
  | 'VerbalExpressionResult';
interface BookingOffersApprovalAcceptanceWorkbenchContractFields {
  source: '30b-booking-offers-approval-acceptance.md';
  fields: Readonly<Record<BookingOffersApprovalAcceptanceContractField, unknown>>;
}
```

```ts
type BookingDocumentsPaymentsAnnouncementContractField =
  | 'AnnounceAuthorization'
  | 'AnnounceConsent'
  | 'AnnounceGroup'
  | 'AnnounceGroupEjectionRequest'
  | 'AnnounceGroupMembershipEvent'
  | 'AnnounceGroupReadinessProjection'
  | 'AnnouncePreconditionWaiver'
  | 'AnnounceRecord'
  | 'AnnounceWaiveCapability'
  | 'Contracts'
  | 'DealDocument'
  | 'DepositAnnouncePolicy'
  | 'Interactions'
  | 'OnSaleScheduleSnapshot'
  | 'PaymentAssertion'
  | 'PaymentSchedule'
  | 'announce_authorizations'
  | 'announce_consents'
  | 'announce_group_ejection_requests'
  | 'announce_group_membership_events'
  | 'announce_group_readiness_projections'
  | 'announce_groups'
  | 'announce_precondition_waivers'
  | 'announce_records'
  | 'announce_waive_capabilities'
  | 'anon'
  | 'blocked'
  | 'created_at'
  | 'deal_documents'
  | 'deposit_announce_policies'
  | 'disputed'
  | 'on_sale_schedule_snapshots'
  | 'paid'
  | 'payment_assertions'
  | 'payment_schedules'
  | 'tenant_id'
  | 'timestamptz';
interface BookingDocumentsPaymentsAnnouncementWorkbenchContractFields {
  source: '30c-booking-documents-payments-announcement.md';
  fields: Readonly<Record<BookingDocumentsPaymentsAnnouncementContractField, unknown>>;
}
```

```ts
type BookingCancellationPostponementExclusivityContractField =
  | 'CancellationInstrument'
  | 'Contracts'
  | 'ExclusivityClause'
  | 'ForceMajeureDeclaration'
  | 'Interactions'
  | 'Postponement'
  | 'WaiverInstrument'
  | 'ambiguous';
interface BookingCancellationPostponementExclusivityWorkbenchContractFields {
  source: '30d-booking-cancellation-postponement-exclusivity.md';
  fields: Readonly<Record<BookingCancellationPostponementExclusivityContractField, unknown>>;
}
```

```ts
type BookingRfqBillConstructionContractField =
  | 'Bill'
  | 'Contracts'
  | 'Interactions'
  | 'auto_declined'
  | 'booking_bill_slots'
  | 'booking_bills'
  | 'execute'
  | 'manual_triage'
  | 'privateNote'
  | 'search_path';
interface BookingRfqBillConstructionWorkbenchContractFields {
  source: '30e-booking-rfq-bill-construction.md';
  fields: Readonly<Record<BookingRfqBillConstructionContractField, unknown>>;
}
```

| BE source | Owning component/prop | Every discovered application error code | UI state owner |
|---|---|---|---|
| `30a-booking-avails-commercial-positions.md` | `BookingAvailsCommercialPositionsWorkbenchContractFields.fields` and `BookingAvailsCommercialPositionsWorkbenchProps.contractFields` | `DEPENDENCY_UNAVAILABLE`, `FORBIDDEN`, `IDEMPOTENCY_CONFLICT`, `NOT_FOUND`, `POSITION_CONFLICT`, `POSITION_EXPIRED`, `RATE_LIMITED`, `SOURCE_OR_MANDATE_INVALID`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `30b-booking-offers-approval-acceptance.md` | `BookingOffersApprovalAcceptanceWorkbenchContractFields.fields` and `BookingOffersApprovalAcceptanceWorkbenchProps.contractFields` | `APPROVAL_INCOMPLETE_OR_REVOKED`, `DEPENDENCY_UNAVAILABLE`, `DIGEST_MISMATCH`, `FORBIDDEN`, `IDEMPOTENCY_CONFLICT`, `NOT_FOUND`, `OFFER_EXPIRED`, `OFFER_OR_LINK_EXPIRED`, `RATE_LIMITED`, `TERM_OR_MANDATE_INVALID`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `30c-booking-documents-payments-announcement.md` | `BookingDocumentsPaymentsAnnouncementWorkbenchContractFields.fields` and `BookingDocumentsPaymentsAnnouncementWorkbenchProps.contractFields` | `ASSERTION_CONFLICT`, `CAPABILITY_OR_WAIVER_EXPIRED`, `DEPENDENCY_UNAVAILABLE`, `FORBIDDEN`, `IDEMPOTENCY_CONFLICT`, `MEMBERSHIP_VERSION_CONFLICT`, `NOT_FOUND`, `PAYMENT_EVIDENCE_INVALID`, `RATE_LIMITED`, `READINESS_BLOCKED`, `TERM_DIGEST_MISMATCH`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `30d-booking-cancellation-postponement-exclusivity.md` | `BookingCancellationPostponementExclusivityWorkbenchContractFields.fields` and `BookingCancellationPostponementExclusivityWorkbenchProps.contractFields` | `DEPENDENCY_UNAVAILABLE`, `FORBIDDEN`, `IDEMPOTENCY_CONFLICT`, `NOT_FOUND`, `POSTPONEMENT_SOURCE_INVALID`, `PREVIEW_OR_WAIVER_EXPIRED`, `PREVIEW_STALE_OR_MISMATCHED`, `RATE_LIMITED`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `WAIVER_SCOPE_INVALID` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `30e-booking-rfq-bill-construction.md` | `BookingRfqBillConstructionWorkbenchContractFields.fields` and `BookingRfqBillConstructionWorkbenchProps.contractFields` | `CANCELLATION_DEPENDENCY_UNSUPPORTED`, `DEPENDENCY_UNAVAILABLE`, `DUPLICATE_ACTIVE_SLOT`, `FORBIDDEN`, `IDEMPOTENCY_CONFLICT`, `NOT_FOUND`, `RATE_LIMITED`, `SOURCE_REVOKED`, `TBA_OR_NAMED_SLOT_INVALID`, `UNAUTHENTICATED`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |

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
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
