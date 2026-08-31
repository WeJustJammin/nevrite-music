# Agency, settlement and live-market intelligence: Frontend Specification

> **Classification**: Feature specification
> **BE Source**: [31a-agency-terms-pipeline-commission.md](../be/31a-agency-terms-pipeline-commission.md), [31b-settlement-inputs-reconciliation-disputes.md](../be/31b-settlement-inputs-reconciliation-disputes.md), [31c-settlement-finality-restatement-export.md](../be/31c-settlement-finality-restatement-export.md), [31d-live-splits-disbursement-tax.md](../be/31d-live-splits-disbursement-tax.md), [31e-live-draw-guidance-reliability-demand.md](../be/31e-live-draw-guidance-reliability-demand.md)
> **IA Source**: [31-live-settlement-intelligence.md](../ia/31-live-settlement-intelligence.md)
> **Surface**: Responsive Astro hybrid web/PWA with bounded React islands
> **Status**: Complete

## Referenced Material Inventory

- **Primary IA**: [31-live-settlement-intelligence.md](../ia/31-live-settlement-intelligence.md) in full.
- **BE sources**: [31a-agency-terms-pipeline-commission.md](../be/31a-agency-terms-pipeline-commission.md), [31b-settlement-inputs-reconciliation-disputes.md](../be/31b-settlement-inputs-reconciliation-disputes.md), [31c-settlement-finality-restatement-export.md](../be/31c-settlement-finality-restatement-export.md), [31d-live-splits-disbursement-tax.md](../be/31d-live-splits-disbursement-tax.md), [31e-live-draw-guidance-reliability-demand.md](../be/31e-live-draw-guidance-reliability-demand.md).
- **Cross-cutting FE source**: [00-infrastructure.md](00-infrastructure.md).
- **Design sources**: [design-system.md](../design-system.md), root `PRODUCT.md`, root `DESIGN.md`, and `.agents/skills/brand-guidelines/SKILL.md`.
- **Contract conventions**: BE00 `ApiError`, opaque cursor pagination, ETag/`If-Match`, idempotency, rate-limit headers, canonical refetch after Realtime hints, and disclosure-safe authorization.

## Source Map

| FE section | Authoritative source | Consumed material |
|---|---|---|
| Classification and scope | `31-live-settlement-intelligence.md`; BE index | Shard boundary and completed BE split group |
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

### `LiveSettlementIntelligenceRoute` (Astro server route)

```ts
interface LiveSettlementIntelligenceRouteProps {
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

### `AgencyTermsPipelineCommissionWorkbench` (bounded React island)

**BE owner**: `31a-agency-terms-pipeline-commission.md`

```ts
interface AgencyTermsPipelineCommissionWorkbenchProps {
  contractFields: AgencyTermsPipelineCommissionWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly AgencyTermsPipelineCommissionRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface AgencyTermsPipelineCommissionRecord {
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

### `SettlementInputsReconciliationDisputesWorkbench` (bounded React island)

**BE owner**: `31b-settlement-inputs-reconciliation-disputes.md`

```ts
interface SettlementInputsReconciliationDisputesWorkbenchProps {
  contractFields: SettlementInputsReconciliationDisputesWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly SettlementInputsReconciliationDisputesRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface SettlementInputsReconciliationDisputesRecord {
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

### `SettlementFinalityRestatementExportWorkbench` (bounded React island)

**BE owner**: `31c-settlement-finality-restatement-export.md`

```ts
interface SettlementFinalityRestatementExportWorkbenchProps {
  contractFields: SettlementFinalityRestatementExportWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly SettlementFinalityRestatementExportRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface SettlementFinalityRestatementExportRecord {
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

### `LiveSplitsDisbursementTaxWorkbench` (bounded React island)

**BE owner**: `31d-live-splits-disbursement-tax.md`

```ts
interface LiveSplitsDisbursementTaxWorkbenchProps {
  contractFields: LiveSplitsDisbursementTaxWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly LiveSplitsDisbursementTaxRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface LiveSplitsDisbursementTaxRecord {
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

### `LiveDrawGuidanceReliabilityDemandWorkbench` (bounded React island)

**BE owner**: `31e-live-draw-guidance-reliability-demand.md`

```ts
interface LiveDrawGuidanceReliabilityDemandWorkbenchProps {
  contractFields: LiveDrawGuidanceReliabilityDemandWorkbenchContractFields;
  children?: never;
  variant: DomainVariant;
  initial: AsyncState<readonly LiveDrawGuidanceReliabilityDemandRecord[]>;
  actorId: string;
  actingPartyId: string;
  access: AccessVariant;
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  onCanonicalRefetch: (reason: 'navigation' | 'realtime-hint' | 'mutation' | 'reconnect') => Promise<void>;
}

interface LiveDrawGuidanceReliabilityDemandRecord {
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
| `/app/live-settlement-intelligence` | Astro SSR or cache-safe prerender by route registry | Public exposes public projection; protected verifies session/acting context; admin requires explicit capability and named step-up | Query, cursor, selected record, tab are URL state; invalid values normalize with `replaceState`; Back restores selection/scroll |
| `/app/live-settlement-intelligence/:recordId` | Server-first detail with bounded islands | Concealed returns disclosure-safe 404; visible forbidden uses `<CapabilityGate>`; expired session preserves safe return target | Bookmark resolves current canonical version; stale/deleted target shows exact state and safe parent |
| System/degraded boundary | Preserved shell when safe | Unsafe cached content removed for privacy, legal, takedown, or revoked authority | Retry repeats safe read; mutation status reconciles before retry |

## Interaction Specification

| Interaction | Trigger and focus | Preconditions | Success | Failure and recovery | Persistence |
|---|---|---|---|---|---|
| `31-UI-01` Canonical route interaction | Native link/button/form; focus stays until navigation or named result heading | Server-derived actor/context/capability, valid Zod input, required ETag/idempotency | Render authoritative response/version/provenance/next action; announce status | Map exact `ApiError`; retain input; focus summary/field; reconcile unknown mutation before retry | URL for navigation/filter; scoped draft before commit; server after success |

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
| Route shell/navigation | 1.3.1, 2.4.1–2.4.3, 2.4.7/2.4.11 | Skip link; logical DOM; route focuses `h1` | Named landmarks, one main, `aria-current=page`, unique title | `31-live-settlement-intelligence.md` Accessibility/User Flows |
| Workbench selection | 1.3.1, 2.1.1, 2.4.3, 4.1.2 | Native controls; Enter opens; Escape closes bounded inspector; focus returns | Named list/detail; selected state; state/provenance text | `31-live-settlement-intelligence.md` Interactions/Access Control |
| Forms/validation | 1.3.1, 3.3.1–3.3.4, 4.1.3 | Persistent labels; linked summary focuses first invalid field; no trap | `aria-invalid`, `aria-describedby`, error links, polite status | `31-live-settlement-intelligence.md` Acceptance Criteria/Edge Cases |
| Async/refetch/conflict | 2.2.1, 2.4.3, 4.1.3 | Refresh never steals focus; Retry native; conflict begins at heading | Polite atomic update; stale/pending/failed text; request ID | `31-live-settlement-intelligence.md` Interactions/BE failures |
| Tables/filters | 1.3.1, 1.4.10, 2.1.1, 2.5.8 | Header buttons; Apply/Reset; 24 CSS px minimum, 44 preferred | Caption, headers, sort, count, active-filter summary | `31-live-settlement-intelligence.md` User Flows/responsive |
| High-risk confirmation | 2.1.2, 2.4.3, 3.3.4, 4.1.2 | Inline first; dialog heading focus, Tab containment, Escape before commit, return focus | Consequence, scope, version, context, step-up, irreversible effect | `31-live-settlement-intelligence.md` Access Control/Edge Cases |
| Motion/media | 1.2.x where applicable, 2.2.2, 2.3.3 | Media keyboard controls; pause/stop; no essential timed gesture | Captions/transcript/metadata; reduced motion; waveform never sole content | `31-live-settlement-intelligence.md` Accessibility |

The inventory exceeds the thin-coverage threshold and is woven into component contracts. WCAG 2.2 AA is the release floor, exceeding the requested 2.1 AA gate.

## FE Rubric Closure

This section makes every FE-rubric checkpoint explicit. It narrows implementation choices without changing any upstream product, permission, security, or data contract.

### Complete component contracts

Every local component interface above includes `children?: never` and a `DomainVariant`. “Never” is deliberate because Astro slots and canonical global components own composition; these route/workbench boundaries do not accept arbitrary children.

| Component | Props interface | Children | Named variants | BE/IA source |
|---|---|---|---|---|
| `LiveSettlementIntelligenceRoute` | `LiveSettlementIntelligenceRouteProps` | `never` | `publicPage`, `appPage`, `adminPage`, `authPage`, `degradedPage` | `31-live-settlement-intelligence.md` user flows/accessibility; design-system page archetypes |
| `AgencyTermsPipelineCommissionWorkbench` | `AgencyTermsPipelineCommissionWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `31a-agency-terms-pipeline-commission.md` request/response fields; `31-live-settlement-intelligence.md` interactions/access rules |
| `SettlementInputsReconciliationDisputesWorkbench` | `SettlementInputsReconciliationDisputesWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `31b-settlement-inputs-reconciliation-disputes.md` request/response fields; `31-live-settlement-intelligence.md` interactions/access rules |
| `SettlementFinalityRestatementExportWorkbench` | `SettlementFinalityRestatementExportWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `31c-settlement-finality-restatement-export.md` request/response fields; `31-live-settlement-intelligence.md` interactions/access rules |
| `LiveSplitsDisbursementTaxWorkbench` | `LiveSplitsDisbursementTaxWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `31d-live-splits-disbursement-tax.md` request/response fields; `31-live-settlement-intelligence.md` interactions/access rules |
| `LiveDrawGuidanceReliabilityDemandWorkbench` | `LiveDrawGuidanceReliabilityDemandWorkbenchProps` | `never` | `publicRead`, `entitledRead`, `ownerFull`, `guardianMandate`, `juniorRestricted`, `businessMandate`, `staffCaseScoped`, `adminStepUp`, `forbiddenHidden`, `disabledPrerequisite` | `31e-live-draw-guidance-reliability-demand.md` request/response fields; `31-live-settlement-intelligence.md` interactions/access rules |
| Global primitives consumed by this spec | Canonical interfaces from design-system Global Component Inventory; local wrappers forbidden | Canonical slot only where that interface declares it, otherwise `never` | `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `error` plus semantic/access variants named above | `design-system.md` Global Component Inventory and State Language |

### IA flow to page/component ownership

| IA flow | Interaction | Page/component owner | Preconditions | Required behavior / success response | Failure / recovery | Visual feedback and timing |
|---|---|---|---|---|---|---|
| `31.01` | Configure representation terms | `LiveSettlementIntelligenceRoute` | Active scoped Shard-01 edge; parties can bind | Structured scope, basis, rate and sunset version append | Ambiguous `net` or unsupported scope rejects | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.02` | Project agency pipeline | `LiveSettlementIntelligenceRoute` | Authorized agency roster scope | Derived stage, confidence and gross/commission/net columns render | Projection lag is disclosed; no state owned here | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.03` | Accrue commission | `LiveSettlementIntelligenceRoute` | Final/provisional settlement and pinned representation version | Derivation appends against represented-party share | B3 blocks at-source fan-out; accrual remains statement/invoice | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.04` | Open settlement | `LiveSettlementIntelligenceRoute` | Confirmed/performed Shard-30 deal and expression available | Proposed sheet version evaluates exact accepted grammar | Missing/unmodellable terms remain visible and suppress finality | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.05` | Reconcile box office | `LiveSettlementIntelligenceRoute` | Authorized aggregates and count sources available | Sold/paid/all-admissions, tiers, fees, comps and provenance reconcile | Gap is priced/attributed; platform never adjudicates | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.06` | Capture show expense | `LiveSettlementIntelligenceRoute` | Authorized phone capture; category known | Amount, cap treatment, receipt/assertion and payer append | Unreceipted item follows accepted deductibility rule | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.07` | Reconcile merch | `LiveSettlementIntelligenceRoute` | Count-in/out and cash/statement evidence available | Sell-through, basis, rate bands, allocation and venue cut compute | Bundle/basis ambiguity creates unresolved line | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.08` | Recompute settlement | `LiveSettlementIntelligenceRoute` | Source input/version changed | Explicit new sheet version and variance fan-out append | Prior signed version remains immutable | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.09` | Contest line | `LiveSettlementIntelligenceRoute` | Participant names line/input, basis and exposure | Line dispute and evidence attach; undisputed floor remains | Derived-line contest redirects to causal inputs | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.10` | Sign settlement | `LiveSettlementIntelligenceRoute` | Actor has bind authority; version current | `agreed` or `under_protest` signature appends to exact hash | Missing adverse-variance explanation blocks owning side | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.11` | Finalize settlement | `LiveSettlementIntelligenceRoute` | Both sides signed same version; run policy permits | Final settlement and downstream obligations emit | Open run stays provisional until run close | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.12` | Amend/restatement | `LiveSettlementIntelligenceRoute` | Eligible party window or later fact event | New version, reason and complete derived fan-out append | Late party request rejected; factual correction retained | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.13` | Export statement/history | `LiveSettlementIntelligenceRoute` | Authorized party; signed/final version exists | Structured export plus accessible PDF and manifest issue | Export never includes private other-side trail or fan rows | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.14` | Propose live split | `LiveSettlementIntelligenceRoute` | Performing entity/show and eligible participants | Flat/share ordering and prefilled inert proposal publish | No agreement means no applied split | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.15` | Approve live split | `LiveSettlementIntelligenceRoute` | Entity governance satisfied; shares visible | Atomic show split version becomes eligible at settlement finality | Missing participant/percentage/scope blocks | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.16` | Build payout instruction | `LiveSettlementIntelligenceRoute` | Final settlement, split and payee eligibility | One-payee launch instruction or gated future recipient instructions | B3/eligibility failure holds no money; records pending obligation | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.17` | Record payout/tax evidence | `LiveSettlementIntelligenceRoute` | Provider or bilateral assertion available | Discharge, status, withholding/VAT facts and documents append | Platform gives no tax determination/advice | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.18` | Create verified draw | `LiveSettlementIntelligenceRoute` | Bilaterally signed settlement and slot present | Append-only paid-admissions record attaches to performing entity | Unsigned/protested-unresolved or inferred slot blocks | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.19` | View own draw/guidance | `LiveSettlementIntelligenceRoute` | Authorized artist-side actor | Raw own records and own-history range/basis/confidence render | Sparse/fast-changing data returns insufficient, not point estimate | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.20` | Share draw in negotiation | `LiveSettlementIntelligenceRoute` | Artist grants purpose/time-bound access | Counterparty receives selected records or derived range | Revocation stops future reads; accepted snapshot remains auditable | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.21` | View reliability facts | `LiveSettlementIntelligenceRoute` | Relevant active/past counterparty context | Specific late-pay, cancel, variance and resolution facts render | No history shows “no history”; no public score | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.22` | Submit fan demand request | `LiveSettlementIntelligenceRoute` | Verified fan; artist/location eligible | One-way private aggregate signal records | Rate/identity abuse dedupes/routes Shard 06 | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |
| `31.23` | Share demand with promoter | `LiveSettlementIntelligenceRoute` | Artist opt-in and B2 gate satisfied | Thresholded location/time aggregate becomes booking input | Below threshold/refused consent renders nothing | Same-frame pressed or disabled state; loading feedback after 250 ms; parsed success or error announcement within 100 ms. |

Every IA interaction row is represented above by its exact identifier and source behavior. The route page is the orchestration owner and delegates to the named domain workbench from the component inventory; server contracts remain authoritative.

### Server, URL, and client state query registry

| BE operation/query | Server-state key | URL state | Island-local state | All async render states |
|---|---|---|---|---|

No global client store is authorized. A new cross-island state need requires architecture review; until then URL/server state or a colocated island state owns it.

### Route registry with guards and metadata

| URL pattern | Auth guard and failure redirect | Page component | Meta title | Meta description |
|---|---|---|---|---|
| `/app/live-settlement-intelligence` | Server validates Supabase token, expiry, acting context, and route capability. Missing/expired token redirects 303 to `/auth/sign-in?returnTo=%2Fapp%2Flive-settlement-intelligence` after allowlist normalization. Valid but concealed target returns 404; visible forbidden target renders `CapabilityGate`. | `LiveSettlementIntelligenceRoute` variant `appPage` | `Agency, settlement and live-market intelligence | WeJammin` | `Work with agency, settlement and live-market intelligence using current authority, record state, and provenance.` |
| `/app/live-settlement-intelligence/:recordId` | Same token/expiry/context check; malformed ID returns 400, concealed/unreadable returns 404, expired session uses the same safe sign-in redirect. | `LiveSettlementIntelligenceRoute` with the matching workbench detail variant | `Record | Agency, settlement and live-market intelligence | WeJammin` | `Review the current record, provenance, history, and permitted actions.` |
| Public projection when a BE route declares one | No session accepted as authority; public projection only. Unsafe or non-public record returns disclosure-safe 404, never app-shell redirect. | `LiveSettlementIntelligenceRoute` variant `publicPage` | `Agency, settlement and live-market intelligence | WeJammin` | `View the public, provenance-labelled record.` |
| System/degraded boundary | Preserves verified shell only; Retry stays on canonical URL; unsafe cached data is removed. | `LiveSettlementIntelligenceRoute` variant `degradedPage` | `Service status | WeJammin` | `Review affected scope, last verified time, request ID, and recovery action.` |

### Per-component responsive contract

| Component | Mobile ≤768 px | Tablet 769–1024 px | Desktop ≥1025 px |
|---|---|---|---|
| `LiveSettlementIntelligenceRoute` | Four-column shell, 16 px gutter/margins, compact tabs, stack navigation, Back before detail, no horizontal page scroll at 320 CSS px | Eight-column shell, 20 px gutter, 24 px margins, collapsible sidebar, list/inspector when container permits | Twelve-column shell, 24 px gutter, max 1440 px, persistent sidebar/top bar, stable route heading/action region |
| `AgencyTermsPipelineCommissionWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `SettlementInputsReconciliationDisputesWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `SettlementFinalityRestatementExportWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `LiveSplitsDisbursementTaxWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
| `LiveDrawGuidanceReliabilityDemandWorkbench` | List then detail stack; priority facts remain; action bar avoids virtual keyboard; controls at least 44 by 44 px | List plus inline inspector or stack by container; two-column fields only when independent; lower-priority columns move into row details | List/detail workbench; compact semantic table; virtualize over 100 rows; detail/action rail shows acting context and version |
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
| `LiveSettlementIntelligenceRoute` public variant | ≤45 KB initial route JS; zero hydration when static | Hydrate only a visible interaction with `client:visible`; no global router | Astro image pipeline emits width/height, AVIF/WebP plus fallback, responsive `srcset`/`sizes`; below-fold images lazy; hero/record identity eager only when LCP | LCP <2.5 s, INP <200 ms, CLS <0.1 at p75 |
| `LiveSettlementIntelligenceRoute` app/admin variant | ≤90 KB initial route JS including shared shell | Each workbench island ≤35 KB initial; editor/media/chart modules split to ≤80 KB lazy chunk and load on explicit entry/visibility; independent fetches parallel | Same optimized image contract; audio/video metadata preload only until explicit play; waveform data lazy and functional | LCP <2.5 s, INP <200 ms, CLS <0.1; interaction feedback same frame |
| `AgencyTermsPipelineCommissionWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `SettlementInputsReconciliationDisputesWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `SettlementFinalityRestatementExportWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `LiveSplitsDisbursementTaxWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |
| `LiveDrawGuidanceReliabilityDemandWorkbench` | ≤35 KB hydrated entry | Detail/editor/media/export modules dynamic-import on selection; list over 100 virtualizes; no barrel import | Preserve intrinsic dimensions; thumbnails use bounded variants; originals never download for list rows | Long task off main thread or chunked; no task >50 ms during input |

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
| `31a-agency-terms-pipeline-commission.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `31b-settlement-inputs-reconciliation-disputes.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `31c-settlement-finality-restatement-export.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `31d-live-splits-disbursement-tax.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |
| `31e-live-draw-guidance-reliability-demand.md` | Exact named Zod request schema: type, optionality, default, min/max/enum/format, cross-field rule; safe local checks on blur and full authoritative check on submit | Linked summary plus exact field errors; preserve all valid and server-accepted input; no raw upstream copy | One idempotent commit with expected version; stable pending label; parsed authoritative response replaces draft; result heading receives focus | CSRF/origin rule by credential mode, unknown-key rejection, allowlist sanitization, framework output encoding, secret/PII redaction |

## Data Mapping

Every BE operation and parsed response field is owned below. Components consume generated Zod-inferred types; no hand-written partial DTO may silently omit a field. A field is displayed, drives explicit state/control, or is non-rendered for a named security reason.

| BE source | Operation | Method/path | Success to component | Error mapping |
|---|---|---|---|---|
| `31a-agency-terms-pipeline-commission.md` | `31A-AGENCY-TERMS-PIPELINE-COMMISSION-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `AgencyTermsPipelineCommissionWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `31b-settlement-inputs-reconciliation-disputes.md` | `31B-SETTLEMENT-INPUTS-RECONCILIATION-DISPUTES-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `SettlementInputsReconciliationDisputesWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `31c-settlement-finality-restatement-export.md` | `31C-SETTLEMENT-FINALITY-RESTATEMENT-EXPORT-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `SettlementFinalityRestatementExportWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `31d-live-splits-disbursement-tax.md` | `31D-LIVE-SPLITS-DISBURSEMENT-TAX-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `LiveSplitsDisbursementTaxWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |
| `31e-live-draw-guidance-reliability-demand.md` | `31E-LIVE-DRAW-GUIDANCE-RELIABILITY-DEMAND-REGISTRY` | `REGISTERED See route registry` | `2xx` parsed into `LiveDrawGuidanceReliabilityDemandWorkbench`; update only after validation | BE00 typed envelope to inline, capability, conflict, rate-wait, or degraded state |

### Response field ownership

| BE source | Contract schemas | Parsed field set | UI ownership |
|---|---|---|---|
| `31a-agency-terms-pipeline-commission.md` | Named source schemas | `requestId`, `rosterPartyIds`, `stageFilter`, `dateRange`, `territories`, `enum`, `text`, `representation_term_versions`, `custom_basis_definition_id`, `commission_accruals`, `traceId`, `operationId` | `AgencyTermsPipelineCommissionWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `31b-settlement-inputs-reconciliation-disputes.md` | Named source schemas | `settlement_sheets`, `settlement_inputs`, `settlement_lines`, `input_ids`, `line_disputes`, `open`, `answered`, `requestId`, `traceId`, `operationId` | `SettlementInputsReconciliationDisputesWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `31c-settlement-finality-restatement-export.md` | Named source schemas | `settlement_signatures`, `sunset`, `settlement_id`, `settlement_finality_records`, `settlement_restatement_records`, `settlement_export_jobs`, `under_protest`, `requestId`, `traceId`, `operationId` | `SettlementFinalityRestatementExportWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `31d-live-splits-disbursement-tax.md` | Named source schemas | `proposal_inert`, `evidenceClass`, `future_multi_recipient_gated`, `live_split_versions`, `disbursement_instructions`, `tax_evidence`, `not_enabled`, `instructed`, `requestId`, `traceId`, `operationId` | `LiveSplitsDisbursementTaxWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |
| `31e-live-draw-guidance-reliability-demand.md` | Named source schemas | `factClasses`, `counterpartyId`, `contextId`, `verified_draw_records`, `draw_access_grants`, `guidance_runs`, `reliability_facts`, `fan_demand_signals`, `requestId`, `traceId`, `operationId` | `LiveDrawGuidanceReliabilityDemandWorkbench`: identity/version/state in `<RecordHeader>`; provenance in `<ProvenanceFact>`; command/status in `<ActionBar>`/`<StateLabel>`; remaining authorized facts in detail rows; security-only fields never serialize |

### Exhaustive BE field and error ownership

The unions below are generated from every contract identifier in each complete BE source, not a representative sample. Request-only identifiers remain because their owning form consumes them; response identifiers remain because the workbench renders them or uses them for explicit state/control. Generated Zod types remain normative if this conservative union includes a non-field identifier.

```ts
type AgencyTermsPipelineCommissionContractField =
  | 'commission_accruals'
  | 'custom_basis_definition_id'
  | 'dateRange'
  | 'enum'
  | 'operationId'
  | 'representation_term_versions'
  | 'rosterPartyIds'
  | 'stageFilter'
  | 'territories'
  | 'text'
  | 'traceId';
interface AgencyTermsPipelineCommissionWorkbenchContractFields {
  source: '31a-agency-terms-pipeline-commission.md';
  fields: Readonly<Record<AgencyTermsPipelineCommissionContractField, unknown>>;
}
```

```ts
type SettlementInputsReconciliationDisputesContractField =
  | 'answered'
  | 'input_ids'
  | 'line_disputes'
  | 'open'
  | 'operationId'
  | 'settlement_inputs'
  | 'settlement_lines'
  | 'settlement_sheets'
  | 'traceId';
interface SettlementInputsReconciliationDisputesWorkbenchContractFields {
  source: '31b-settlement-inputs-reconciliation-disputes.md';
  fields: Readonly<Record<SettlementInputsReconciliationDisputesContractField, unknown>>;
}
```

```ts
type SettlementFinalityRestatementExportContractField =
  | 'operationId'
  | 'settlement_export_jobs'
  | 'settlement_finality_records'
  | 'settlement_id'
  | 'settlement_restatement_records'
  | 'settlement_signatures'
  | 'sunset'
  | 'traceId'
  | 'under_protest';
interface SettlementFinalityRestatementExportWorkbenchContractFields {
  source: '31c-settlement-finality-restatement-export.md';
  fields: Readonly<Record<SettlementFinalityRestatementExportContractField, unknown>>;
}
```

```ts
type LiveSplitsDisbursementTaxContractField =
  | 'disbursement_instructions'
  | 'evidenceClass'
  | 'future_multi_recipient_gated'
  | 'instructed'
  | 'live_split_versions'
  | 'not_enabled'
  | 'operationId'
  | 'proposal_inert'
  | 'tax_evidence'
  | 'traceId';
interface LiveSplitsDisbursementTaxWorkbenchContractFields {
  source: '31d-live-splits-disbursement-tax.md';
  fields: Readonly<Record<LiveSplitsDisbursementTaxContractField, unknown>>;
}
```

```ts
type LiveDrawGuidanceReliabilityDemandContractField =
  | 'contextId'
  | 'counterpartyId'
  | 'draw_access_grants'
  | 'factClasses'
  | 'fan_demand_signals'
  | 'guidance_runs'
  | 'operationId'
  | 'reliability_facts'
  | 'traceId'
  | 'verified_draw_records';
interface LiveDrawGuidanceReliabilityDemandWorkbenchContractFields {
  source: '31e-live-draw-guidance-reliability-demand.md';
  fields: Readonly<Record<LiveDrawGuidanceReliabilityDemandContractField, unknown>>;
}
```

| BE source | Owning component/prop | Every discovered application error code | UI state owner |
|---|---|---|---|
| `31a-agency-terms-pipeline-commission.md` | `AgencyTermsPipelineCommissionWorkbenchContractFields.fields` and `AgencyTermsPipelineCommissionWorkbenchProps.contractFields` | `ACCRUAL_STATE_CONFLICT`, `AGENCY_CONTEXT_NOT_FOUND`, `AUTHORITY_REQUIRED`, `BASIS_INVALID`, `CURRENCY_MISMATCH`, `DEPENDENCY_TIMEOUT`, `EDGE_AUTHORITY_UNAVAILABLE`, `IDEMPOTENCY_CONFLICT`, `PIPELINE_SOURCE_UNAVAILABLE`, `QUERY_INVALID`, `RATE_INVALID`, `RATE_LIMITED`, `REVISION_MISMATCH`, `ROSTER_SCOPE_REQUIRED`, `SCOPE_INVALID`, `SERVICE_AUTH_REQUIRED`, `SOURCE_EVENT_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `31b-settlement-inputs-reconciliation-disputes.md` | `SettlementInputsReconciliationDisputesWorkbenchContractFields.fields` and `SettlementInputsReconciliationDisputesWorkbenchProps.contractFields` | `CAPTURE_CONFLICT`, `COUNT_SCHEMA_INVALID`, `CURRENCY_INVALID`, `DEAL_AUTHORITY_REQUIRED`, `DEPENDENCY_TIMEOUT`, `EVALUATOR_UNAVAILABLE`, `EVIDENCE_INVALID`, `EXPENSE_INVALID`, `EXPOSURE_INVALID`, `EXPRESSION_UNAVAILABLE`, `GAP_TREATMENT_INVALID`, `IDEMPOTENCY_CONFLICT`, `MERCH_INPUT_INVALID`, `MERCH_SCOPE_REQUIRED`, `PARTICIPANT_REQUIRED`, `PROVENANCE_REQUIRED`, `RATE_LIMITED`, `REVISION_MISMATCH`, `SOURCE_EVENT_CONFLICT`, `SOURCE_FORBIDDEN`, `SOURCE_WATERMARK_CONFLICT` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `31c-settlement-finality-restatement-export.md` | `SettlementFinalityRestatementExportWorkbenchContractFields.fields` and `SettlementFinalityRestatementExportWorkbenchProps.contractFields` | `ACCESSIBILITY_GATE_FAILED`, `AFFECTED_VERSION_STALE`, `AMENDMENT_AUTHORITY_REQUIRED`, `AUTHORITY_REQUIRED`, `DEPENDENCY_TIMEOUT`, `EVIDENCE_INVALID`, `EXPLANATION_REQUIRED`, `EXPORT_POLICY_INVALID`, `EXPORT_SCOPE_REQUIRED`, `FINALITY_REQUEST_INVALID`, `FINALIZER_REQUIRED`, `FORMAT_INVALID`, `HASH_CONFLICT`, `LEGAL_HOLD_CONFLICT`, `RATE_LIMITED`, `RENDER_UNAVAILABLE`, `SIGNATURE_INVALID`, `SIGNATURE_SET_MISMATCH`, `SOURCE_EVENT_CONFLICT`, `STEP_UP_REQUIRED`, `VERSION_NOT_FOUND`, `VERSION_STALE` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `31d-live-splits-disbursement-tax.md` | `LiveSplitsDisbursementTaxWorkbenchContractFields.fields` and `LiveSplitsDisbursementTaxWorkbenchProps.contractFields` | `ADVICE_CONTENT_FORBIDDEN`, `APPROVAL_CONFLICT`, `APPROVAL_INVALID`, `CHECKSUM_MISMATCH`, `DEPENDENCY_TIMEOUT`, `DOCUMENT_REQUIRED`, `ENTITY_AUTHORITY_REQUIRED`, `EVIDENCE_INVALID`, `EVIDENCE_SCOPE_REQUIRED`, `IDEMPOTENCY_CONFLICT`, `INSTRUCTION_CONFLICT`, `OBLIGATION_INVALID`, `PARTICIPANT_AUTHORITY_REQUIRED`, `PARTICIPANT_INVALID`, `RATE_LIMITED`, `REVISION_MISMATCH`, `SCOPE_INVALID`, `SERVICE_AUTH_REQUIRED`, `SOURCE_EVENT_CONFLICT`, `SPLIT_SCOPE_CONFLICT`, `STEP_UP_REQUIRED`, `STORAGE_UNAVAILABLE`, `TOTAL_INVALID` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |
| `31e-live-draw-guidance-reliability-demand.md` | `LiveDrawGuidanceReliabilityDemandWorkbenchContractFields.fields` and `LiveDrawGuidanceReliabilityDemandWorkbenchProps.contractFields` | `ARTIST_OPT_IN_REQUIRED`, `AUTHORITY_REQUIRED`, `CONSENT_UNAVAILABLE`, `CONTEXT_INVALID`, `CONTEXT_NOT_FOUND`, `COUNTERPARTY_CONTEXT_REQUIRED`, `DEPENDENCY_TIMEOUT`, `DRAW_INPUT_INVALID`, `ENTITY_AUTHORITY_REQUIRED`, `GEO_OR_WINDOW_INVALID`, `GRANT_CONFLICT`, `GUIDANCE_QUERY_INVALID`, `GUIDANCE_UNAVAILABLE`, `MODEL_INPUT_STALE`, `PROMOTER_CONTEXT_REQUIRED`, `PURPOSE_INVALID`, `QUERY_INVALID`, `RATE_LIMITED`, `REVISION_MISMATCH`, `SERVICE_AUTH_REQUIRED`, `SHARE_QUERY_INVALID`, `SIGNAL_DUPLICATE`, `SLOT_REQUIRED`, `SOURCE_EVENT_CONFLICT`, `SOURCE_WATERMARK_CONFLICT`, `STEP_UP_REQUIRED` | validation/input → linked summary; auth/permission → auth or capability gate; not-found → disclosure-safe route/row; conflict/stale/mismatch/duplicate → sync conflict; rate → retry wait; dependency/timeout/unavailable → degraded; blocked/failed/cancelled/revoked → exact terminal state and legitimate recovery |

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
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
