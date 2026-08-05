# Shard 34 — Tour routing, logistics, finance and reporting

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 34 owns optional tour grouping, route feasibility, offline tour books, record-only travel/rooming/ground logistics, per-diem/float/budget/expense records, border readiness, carnet reconciliation, per-show merch counts and transparent carbon estimates. It consumes production/show-day versions from [[specs/ia/32-show-production-planning|Shard 32]] and [[specs/ia/33-show-day-operations|Shard 33]], gear truth from [[specs/ia/24-gear-holdings-operations|Shard 24]], and settlement actuals from [[specs/ia/31-live-settlement-intelligence|Shard 31]].

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 22 |
| Child capabilities | 14 |
| Tour boundary | Optional primary-act container for dates/holds/non-show days, riders, crew, gear and budget |
| Routing boundary | Feasibility and humane-risk facts, never route optimization or legal driver verdict |
| Travel boundary | Record/import references and itinerary delivery; platform does not book travel |
| Money boundary | Per-diem/float/budget/expense records and projections; no platform cash advance/holding or multi-payee execution before B3 |
| Border boundary | Requirement/document/deadline/validity tracking; no immigration, customs or tax advice |
| Reporting boundary | Transparent estimate with factor/version/coverage/exclusions; no verification or external-standard claim at launch |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Tour | One primary act owns container. Co-headline/package participants attach per date; independent co-headliners keep linked tours and explicitly allocate shared costs. |
| Dates | Holds and non-show days are first-class and carry constraints/costs. One-off shows require no tour. |
| Route | Check load-out→load-in ranges, rest gaps and configured regimes where authoritative. Without confident rule profile show facts only and never “legal.” |
| Tour book | Render, not authored document; distinct from day sheet; mandatory offline and treated as high-PII. |
| Travel | Record-only confirmations with source/provenance. No booking or inbound-email parsing at launch. |
| Rooming | Person-owned preferences/access constraints; producer sees operational constraint, not reason. Each person sees own row, producer sees authorized grid. |
| Finance | Per-date P&L is grain. Actuals accrue from platform facts; budget remains versioned structured categories. Personnel line items remain restricted. |
| Per diem/float | Derived rate×eligible days×person; cash/source assertions are first-class. Platform never holds/advances float under B3. |
| Receipts | One-photo offline capture; OCR creates draft only. Unreceipted expense allowed with explanation and source. |
| Border | Person×border readiness, person-owned documents, lead-time alerts. Withholding warning originates at offer and is tracked here without computed advice. |
| Carnet | Generated/reconciled from date manifest; platform does not issue. Rental row explicitly states document owner/responsible carrier. Merch excluded. |
| Merch | External catalogue/stock identity referenced; this shard owns tour/per-show count movements and venue-cut reconciliation, with one stock pool across channels. |
| Carbon | Derived only from logistics. Every figure carries factor-set version, coverage and exclusions; no venue-energy attribution or verified/standard-compliant claim. |

## Features

- **18.11 Tour Container & Routing** — [ideation source](../ideation/18-show-production-touring/18.11-tour-container-routing/18.11-tour-container-routing-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.12 Travel, Accommodation & Ground** — [ideation source](../ideation/18-show-production-touring/18.12-travel-logistics/18.12-travel-logistics-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.13 Tour Finance** — [ideation source](../ideation/18-show-production-touring/18.13-tour-finance/18.13-tour-finance-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.14 Border, Visas & Carnets** — [ideation source](../ideation/18-show-production-touring/18.14-border-visas-carnets/18.14-border-visas-carnets-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.15 Tour Merch Inventory & Per-Show Counts** — [ideation source](../ideation/18-show-production-touring/18.15-tour-merch-inventory.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.20 Green Touring & Carbon Reporting** — [ideation source](../ideation/18-show-production-touring/18.20-green-touring-carbon.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-34.01 — Create/link tour:** Given Authorized primary act; optional dates, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create/link tour, and (6) return Tour/container and participant/date links append; if the flow cannot complete, One-off remains standalone.
- **AC-34.02 — Add show/hold/non-show day:** Given Tour/date authority valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Add show/hold/non-show day, and (6) return Ordered date with type, constraints and cost scope adds; if the flow cannot complete, Conflicting primary ownership rejects.
- **AC-34.03 — Allocate shared co-headline cost:** Given Linked tours/date and binding allocation supplied, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Allocate shared co-headline cost, and (6) return Cost share/version pins to both budgets; if the flow cannot complete, Missing approval leaves cost unallocated.
- **AC-34.04 — Evaluate route leg:** Given Adjacent dates, load times, transport and rest inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate route leg, and (6) return Drive range/rest/humane-risk and profile confidence render; if the flow cannot complete, Unknown rule profile returns facts only.
- **AC-34.05 — Render tour book:** Given Authorized recipient/current sources, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Render tour book, and (6) return Versioned accessible artifact/live link/offline bundle issues; if the flow cannot complete, Gaps explicit; old version announces supersession.
- **AC-34.06 — Record travel/accommodation:** Given Authorized source confirmation, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record travel/accommodation, and (6) return Segment/stay/reference/cost/cancellation facts append; if the flow cannot complete, No booking or silent email ingestion.
- **AC-34.07 — Build rooming list:** Given Roster/person constraints and inventory available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Build rooming list, and (6) return Minimal room assignments/grid version issue; if the flow cannot complete, Sensitive reason withheld; conflicts named.
- **AC-34.08 — Plan ground transport:** Given Vehicle/driver/leg/rest facts available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Plan ground transport, and (6) return Feasibility and call impacts append; if the flow cannot complete, No legality claim without authoritative profile.
- **AC-34.09 — Version per diem/float:** Given Roster/day eligibility/rates/current float known, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Version per diem/float, and (6) return Derived obligations and cash assertions append; if the flow cannot complete, No custody/advance implication.
- **AC-34.10 — Version tour budget:** Given Dates/categories/currencies/rates defined, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Version tour budget, and (6) return Per-date/tour planned totals and permissions save; if the flow cannot complete, Unsupported free-form total rejects.
- **AC-34.11 — Accrue actual:** Given Settlement/travel/expense/merch fact arrives, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Accrue actual, and (6) return Source-linked per-date actual and variance append; if the flow cannot complete, Ambiguous source remains pending.
- **AC-34.12 — Capture expense:** Given Actor authorized; offline draft allowed, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Capture expense, and (6) return Receipt/explanation/source/currency/date append; if the flow cannot complete, OCR mismatch requires confirmation.
- **AC-34.13 — Track visa/work permit:** Given Person/border/date requirement source known, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Track visa/work permit, and (6) return Requirement, lead time, document validity and alert save; if the flow cannot complete, No advice or inferred eligibility.
- **AC-34.14 — Generate/reconcile carnet:** Given Date manifest and required gear attributes available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Generate/reconcile carnet, and (6) return Crossing list, discrepancies and re-entry state append; if the flow cannot complete, Missing serial/value/origin/weight blocks readiness only.
- **AC-34.15 — Track withholding readiness:** Given Cross-border deal/party and specialist refs available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Track withholding readiness, and (6) return Warning, deadline, forms/certificate and actual fact track; if the flow cannot complete, No computed rate/advice.
- **AC-34.16 — Count tour merch:** Given Authorized stock/event; offline count, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Count tour merch, and (6) return Load-in/sales/comp/damage/return and per-show balance append; if the flow cannot complete, Conflict requires count reconciliation.
- **AC-34.17 — Generate carbon estimate:** Given Sufficient logistics facts and factor set, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Generate carbon estimate, and (6) return Distance/mode/fuel/accommodation estimate with coverage/exclusions; if the flow cannot complete, Insufficient inputs return partial/unknown.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 34.01 | Create/link tour | Authorized primary act; optional dates | Tour/container and participant/date links append | One-off remains standalone |
| 34.02 | Add show/hold/non-show day | Tour/date authority valid | Ordered date with type, constraints and cost scope adds | Conflicting primary ownership rejects |
| 34.03 | Allocate shared co-headline cost | Linked tours/date and binding allocation supplied | Cost share/version pins to both budgets | Missing approval leaves cost unallocated |
| 34.04 | Evaluate route leg | Adjacent dates, load times, transport and rest inputs | Drive range/rest/humane-risk and profile confidence render | Unknown rule profile returns facts only |
| 34.05 | Render tour book | Authorized recipient/current sources | Versioned accessible artifact/live link/offline bundle issues | Gaps explicit; old version announces supersession |
| 34.06 | Record travel/accommodation | Authorized source confirmation | Segment/stay/reference/cost/cancellation facts append | No booking or silent email ingestion |
| 34.07 | Build rooming list | Roster/person constraints and inventory available | Minimal room assignments/grid version issue | Sensitive reason withheld; conflicts named |
| 34.08 | Plan ground transport | Vehicle/driver/leg/rest facts available | Feasibility and call impacts append | No legality claim without authoritative profile |
| 34.09 | Version per diem/float | Roster/day eligibility/rates/current float known | Derived obligations and cash assertions append | No custody/advance implication |
| 34.10 | Version tour budget | Dates/categories/currencies/rates defined | Per-date/tour planned totals and permissions save | Unsupported free-form total rejects |
| 34.11 | Accrue actual | Settlement/travel/expense/merch fact arrives | Source-linked per-date actual and variance append | Ambiguous source remains pending |
| 34.12 | Capture expense | Actor authorized; offline draft allowed | Receipt/explanation/source/currency/date append | OCR mismatch requires confirmation |
| 34.13 | Track visa/work permit | Person/border/date requirement source known | Requirement, lead time, document validity and alert save | No advice or inferred eligibility |
| 34.14 | Generate/reconcile carnet | Date manifest and required gear attributes available | Crossing list, discrepancies and re-entry state append | Missing serial/value/origin/weight blocks readiness only |
| 34.15 | Track withholding readiness | Cross-border deal/party and specialist refs available | Warning, deadline, forms/certificate and actual fact track | No computed rate/advice |
| 34.16 | Count tour merch | Authorized stock/event; offline count | Load-in/sales/comp/damage/return and per-show balance append | Conflict requires count reconciliation |
| 34.17 | Generate carbon estimate | Sufficient logistics facts and factor set | Distance/mode/fuel/accommodation estimate with coverage/exclusions | Insufficient inputs return partial/unknown |

## Contracts

| Command | Required input | Output | Explicit errors |
|---|---|---|---|
| `VersionTour` | owner, dates/holds/non-show days, participants, expected version | tour version | `OWNER_CONFLICT`, `DATE_CONFLICT`, `STALE_VERSION` |
| `EvaluateRouteLeg` | date versions, load windows, vehicle/driver/rest, rule profile | feasibility | `INPUT_INCOMPLETE`, `PROFILE_UNAUTHORED`, `RANGE_INVALID` |
| `VersionTravelRecord` | segment/stay, source, travelers, cost/cancellation | travel version | `SOURCE_REQUIRED`, `TRAVELER_FORBIDDEN`, `DATE_INVALID` |
| `VersionRoomingList` | roster, room inventory, constraints, assignments | rooming version | `CONSTRAINT_CONFLICT`, `PII_SCOPE_FORBIDDEN` |
| `VersionTourBudget` | tour/date, categories, currency/FX basis, amounts | budget version | `CATEGORY_INVALID`, `FX_BASIS_REQUIRED`, `PERMISSION_DENIED` |
| `AppendTourActual` | date/category, source fact, amount/currency | actual/variance | `SOURCE_AMBIGUOUS`, `PERIOD_LOCKED`, `IDEMPOTENCY_CONFLICT` |
| `RecordBorderReadiness` | person/border/date, requirement/source, document refs | readiness state | `SOURCE_UNQUALIFIED`, `DOCUMENT_ACCESS_FORBIDDEN` |
| `ReconcileCarnet` | crossing, manifest version, rows/actions | reconciliation | `ATTRIBUTE_MISSING`, `DOCUMENT_OWNER_UNKNOWN` |
| `AppendMerchCount` | tour/show/SKU ref, movement/count, device/server times | stock projection | `COUNT_CONFLICT`, `SKU_UNKNOWN`, `STALE_VERSION` |
| `EstimateTourCarbon` | logistics versions, factor set | estimate | `COVERAGE_INSUFFICIENT`, `FACTOR_SET_UNAVAILABLE` |

- All commands use stable idempotency keys and expected aggregate versions.
- Shared money/payout rails remain authoritative; this shard records obligations/assertions and never calls float escrow.
- Person documents/preferences remain in protected identity storage; tour stores scoped references/projections.
- External maps/weather/travel/factor sources carry source version and freshness.

## Data Models

| Aggregate | Key invariants |
|---|---|
| `Tour` | Primary act, linked participants, ordered date/hold/non-show members, state and versions |
| `RouteLeg` | Adjacent date refs, load windows, distance/drive ranges, rest facts, profile/confidence and risk |
| `TourBookVersion` | Source snapshot, recipient projection, artifact/offline hashes and supersession |
| `TravelRecord` | Segment/stay/ground facts, travelers, provider/reference, cost/cancellation and source |
| `RoomingList` | Stay, room inventory, assignments and person-constraint refs; reasons excluded |
| `PerDiemFloatVersion` | Eligibility/rate/day/person derivation, source/custodian assertions and state |
| `TourBudgetVersion` | Date/category planned values, currencies/FX and visibility |
| `TourActual` | Source fact, date/category, amount/currency, period and variance lineage |
| `TourExpense` | Spend date, source, receipt/explanation, payer, category, currency and sync period |
| `BorderReadiness` | Person/border/date, requirement/source, lead time, document ref/validity and state |
| `CarnetReconciliation` | Crossing/manifest, rows, document owner, export/re-entry actions and discrepancies |
| `TourMerchMovement` | Tour/show/SKU, load/sale/comp/damage/return/count and channel/source |
| `CarbonEstimate` | Tour/date/leg inputs, factor set, outputs, coverage, exclusions and unverified label |

- Tour: `planning → active → completed|cancelled`; date members retain independent source lifecycle.
- Budget periods are append-only versions; closed-period late expense follows configurable grace then current period with true spend date.
- One stock pool prevents cash/platform channel duplication.
- Every numeric policy, grace, threshold, factor mapping and PII expiry uses versioned settings.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Key invariants.
- **`Tour`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Primary act, linked participants, ordered date/hold/non-show members, state and versions.
- **`RouteLeg`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Adjacent date refs, load windows, distance/drive ranges, rest facts, profile/confidence and risk.
- **`TourBookVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source snapshot, recipient projection, artifact/offline hashes and supersession.
- **`TravelRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Segment/stay/ground facts, travelers, provider/reference, cost/cancellation and source.
- **`RoomingList`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Stay, room inventory, assignments and person-constraint refs; reasons excluded.
- **`PerDiemFloatVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Eligibility/rate/day/person derivation, source/custodian assertions and state.
- **`TourBudgetVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Date/category planned values, currencies/FX and visibility.
- **`TourActual`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source fact, date/category, amount/currency, period and variance lineage.
- **`TourExpense`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Spend date, source, receipt/explanation, payer, category, currency and sync period.
- **`BorderReadiness`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Person/border/date, requirement/source, lead time, document ref/validity and state.
- **`CarnetReconciliation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Crossing/manifest, rows, document owner, export/re-entry actions and discrepancies.
- **`TourMerchMovement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Tour/show/SKU, load/sale/comp/damage/return/count and channel/source.
- **`CarbonEstimate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Tour/date/leg inputs, factor set, outputs, coverage, exclusions and unverified label.

## Access Control

| Actor | Allowed | Denied |
|---|---|---|
| Tour owner/TM | Tour/dates/route/travel/rooming/budget/merch/carbon within scope | Person document contents without grant |
| Participant/co-headline | Own linked dates, agreed shared-cost lines and own itinerary projection | Primary act private budget/crew/rooming grid |
| Person/traveler | Own itinerary, assignment, document/readiness and expense/per-diem | Other travelers' rows/salaries/documents |
| Finance manager | Budget/actual/float/expense and authorized personnel lines | Immigration/access reasons and unrelated personal data |
| Crew/driver | Own calls/legs/rest/vehicle facts and offline tour-book projection | Full tour finance/rooming grid |
| Specialist/advisor | Explicit person/border/tax readiness scope | Platform-wide roster or authority to issue advice as platform |
| System worker | Derive routes/actuals/renders/estimates/alerts | Book travel, decide legality, hold cash or claim verification |

- Tour book/rooming/border artifacts are high-PII, recipient-scoped, expiring, encrypted and audited.
- Export omits restricted personnel lines and document details unless actor has explicit authority.
- Carbon/public reporting requires separate owner authorization and never broadens source PII.

### Access Escalation

- **Tour owner/TM:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Participant/co-headline:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Person/traveler:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Finance manager:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Crew/driver:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Specialist/advisor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Route feasibility exposes ranges/rest gaps/risk reasons in text and table, not map/color only.
- Tour book and rooming list have accessible HTML/offline parity and tagged print/export.
- Budget/actual/merch tables support keyboard editing, clear formulas and mobile linear forms.
- Person document/readiness screens state source/deadline/validity without legal-advice wording.
- Carbon estimates show factor version, coverage and exclusions adjacent to every result.
- Maps have itinerary/list alternatives and manual correction.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `tour.versioned` | tour/version, owner/date/participant deltas | all tour projections |
| `tour.route.evaluated` | leg, input versions, ranges/rest/profile/risk | itinerary, alerts |
| `tour.travel.versioned` | record/version, segment/stay refs, affected travelers | tour book, budget |
| `tour.budget.actual_changed` | tour/date/category, source/amount/variance | finance/reporting |
| `tour.border.readiness_changed` | person/border/date, state/deadline/source refs | alerts, tour book |
| `tour.carnet.reconciled` | crossing/manifest, state/discrepancy refs | gear/tour book |
| `tour.merch.movement_recorded` | tour/show/SKU, movement/count/version | inventory, settlement |
| `tour.carbon.estimated` | tour/version, factor/coverage/exclusion refs | authorized reporting |

Events carry references rather than passport/visa files, rooming reasons, salary lines or receipt images. Consumers dedupe/order by aggregate version.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Linked co-headline tours disagree on cost | Keep unallocated/contested line; no default split |
| Route profile unavailable | Show distance/drive/rest facts and “no legal assessment” |
| Travel cancellation changes itinerary | Version record, budget and tour book; old artifact superseded |
| Rooming constraint identifies one person | Producer sees operational class; exact reason remains person-controlled |
| Float cash count disputed | Preserve both assertions/custody and route finance review; no custody claim by platform |
| Offline receipt syncs after close | Apply pinned grace/current-period policy and true spend date |
| Visa document expires mid-tour | Affected border readiness blocks readiness and alerts; no eligibility verdict |
| Rented gear crosses border | Require declared document owner/carrier before carnet-ready |
| Offline merch counts conflict | Preserve device/server times and require authoritative recount |
| Carbon factor set updates | Prior report remains pinned; explicit rerun produces successor |
| Scheduled outage in transit | Offline tour book/itinerary remains readable; queued writes reconcile on reconnect |

## Surface Applicability

Responsive web/PWA is the sole launch surface. Offline tour book, itinerary, room assignment, border checklist and merch count drafts are required; protected documents are not embedded unless explicitly authorized. Normal-web reads target p95 ≤2 seconds; travel-day reads operate continuously except scheduled outages.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 34.01 Create/link tour | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.02 Add show/hold/non-show day | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.03 Allocate shared co-headline cost | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.04 Evaluate route leg | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.05 Render tour book | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.06 Record travel/accommodation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.07 Build rooming list | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.08 Plan ground transport | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.09 Version per diem/float | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.10 Version tour budget | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.11 Accrue actual | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.12 Capture expense | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.13 Track visa/work permit | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.14 Generate/reconcile carnet | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.15 Track withholding readiness | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.16 Count tour merch | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 34.17 Generate carbon estimate | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/24-gear-holdings-operations|Shard 24]], [[specs/ia/31-live-settlement-intelligence|Shard 31]], [[specs/ia/32-show-production-planning|Shard 32]], [[specs/ia/33-show-day-operations|Shard 33]]
- **Depended on by:** None


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 24:** consume [Shard 24 Contracts](24-gear-holdings-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 24 Event Schemas](24-gear-holdings-operations.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 31:** consume [Shard 31 Contracts](31-live-settlement-intelligence.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 31 Event Schemas](31-live-settlement-intelligence.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 32:** consume [Shard 32 Contracts](32-show-production-planning.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 32 Event Schemas](32-show-production-planning.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 33:** consume [Shard 33 Contracts](33-show-day-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 33 Event Schemas](33-show-day-operations.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Authored and deepened complete IA contract | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
