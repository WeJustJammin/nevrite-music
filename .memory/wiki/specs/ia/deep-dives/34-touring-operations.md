# Deep Dive 34 — Tour routing, logistics, finance and reporting

**Status:** Complete
**Parent:** [[specs/ia/34-touring-operations|Shard 34]]

## Overview

This deep dive closes linked-tour cost ownership, facts-not-verdict routing, high-PII offline delivery, B3-safe float/finance, border-document containment and estimate transparency.

## Interactions

### Tour and Route

1. Create optional primary-act container and attach confirmed dates, holds and non-show days.
2. Package/co-headline act may attach per date. Independent co-headliner keeps linked tour and shares only approved date/cost/transport facts.
3. Build adjacent legs from load-out to next load-in, transport mode, driver assignments and rest.
4. Resolve authoritative regime profile only when source/version matches vehicle/use/jurisdiction.
5. Render distance/drive range/rest gap plus `feasible`, `legal_but_humane_risk`, `unknown_profile` or factual conflicts; never optimize itinerary.
6. Any date/travel change explicitly re-evaluates affected legs and tour-book versions.

### Travel, Rooming and Tour Book

1. Record confirmation/reference facts from human/provider source; no booking or automatic email ingestion.
2. Person profile supplies preferences/access constraints by scoped grant.
3. Producer allocates room inventory using operational constraint, never medical/access reason.
4. Render recipient-specific tour book from dates, travel, rooming, calls, finance allowances, border readiness and contacts.
5. Issue high-PII live link/artifact/offline bundle with expiry, revocation and captured-at.

### Finance and Expense

1. Version structured budget by date/category/currency/FX basis.
2. Derive per diem from roster eligibility, days and rate; record float custodian/source/cash assertions.
3. Accrue settlement, travel, accommodation, merch and expense actuals from source events.
4. Capture receipt photo offline; OCR is draft and human confirms. Unreceipted expense requires explanation.
5. Closed-period late sync follows pinned grace/current-period policy without changing true spend date.
6. No platform float advance/custody, multi-party payment or automatic salary disclosure under B3.

### Border and Carnet

1. Build person×border matrix from route and requirement source; track lead time, document ref and date validity.
2. Alert against lead time, not departure. Never assert eligibility or advice.
3. Generate carnet rows from manifest attributes; merch excluded.
4. Each owned/rented row states exporter/document owner/carrier responsibility.
5. Reconcile export, crossings and re-entry as running actions; platform never issues carnet.
6. Track withholding warning/certificate/deadline and specialist referral; numeric tax computation remains outside.

### Merch and Carbon

1. Resolve external SKU/current tour stock and one cross-channel pool.
2. Record load-in, platform/cash sale, comp, damage, transfer, venue cut and return per show, offline-capable.
3. Reconcile count variance with source/device/server times.
4. Derive carbon from known transport/accommodation/freight inputs only.
5. Pin factor set and expose coverage/exclusions; no venue energy or verified/standard-compliant label.

## Contracts

### Route Feasibility

```text
RouteLegResult = {
  from_date,
  to_date,
  distance_range,
  drive_time_range,
  load_out_to_load_in,
  required_rest,
  actual_rest_gap,
  profile_ref?,
  profile_confidence,
  result,
  humane_risks[],
  evaluated_at
}
```

An unauthored/uncertain profile removes legal result rather than applying a neighboring country's rule.

### Shared Cost

Linked tours share cost only through bilateral allocation instrument with category, source invoice/estimate, percentages/amounts, currency, effective dates and approvals. No “primary act pays” default exists.

### B3 Money Boundary

Per diem, float, expense reimbursement and personnel cost are obligations/assertions. Platform may calculate and export; it does not hold/advance cash or fan out recipients before approved money architecture. Terms `held`, `escrow`, `paid` and `discharged` require provider/party evidence.

Every grace window, feasibility band, alert lead time, offline expiry, FX source, carbon factor mapping, privacy expiry and reconciliation threshold resolves from versioned settings or an explicit approved instrument; implementations contain no hidden numeric policy.

## Data Models

### Period and Source Lineage

- Budget values are proposals tied to version.
- Actuals are immutable source-linked facts or assertions.
- Variance is derived and recomputed.
- Period close freezes projection; late source follows policy and emits successor.
- Personnel detail has separate privacy projection from band-level P&L.
- Shared-cost allocation creates each tour's source-linked portion without duplicating invoice truth.

### Document Containment

Tour/border rows store protected document references, validity metadata and access grant only. Offline bundle defaults to checklist/status, not document bytes. Document access requires online reauthorization unless explicit necessity/offline grant exists.

### Merch Projection

Movement ledger is append-only; current stock derives from opening plus signed movements. Cash/platform channels are sale-source dimensions, not separate stock pools. Per-show settlement references exact movement/count version.

## Access Control

- Primary tour owner controls container; linked participants control own tour and shared instruments only.
- Producer sees rooming operational constraints, not reasons; hotel export is explicit recipient/purpose/time scoped.
- Finance role sees permitted cost rows; ordinary band member receives aggregate P&L.
- Person controls border documents and can grant specialist/producer access.
- Driver sees own legs/rest facts, not full roster/finance.
- Carbon reader sees allowlisted logistics aggregates, not traveler/document/rooming PII.
- Admin corrections append reason/source/version under dual control.

## Accessibility

- Route/tour book provide ordered list alternative to maps.
- High-PII offline artifact shows owner/version/expiry and one clear revoke/report-loss path.
- Rooming assignment supports keyboard grid and private self-row view.
- Finance tables expose formulas, source, currency and variance text.
- Border readiness avoids red/green eligibility shorthand and states exact missing/expiry facts.
- Merch offline counts use large touch targets plus keyboard/manual quantity entry.

## Event Schemas

### Ordering and Idempotency

Every date, route, travel, rooming, budget, expense, border, carnet, merch and carbon command uses stable idempotency keys.

| Race | Resolution |
|---|---|
| Date move vs route evaluation | evaluation pins versions; move supersedes affected legs |
| Travel cancellation vs offline tour book | live version supersedes; bundle remains stale-labeled |
| Constraint revoke vs rooming export | grant epoch blocks new export/read |
| Period close vs offline expense | server receipt and pinned grace policy determine posting period |
| Manifest correction vs carnet | reconciliation pins manifest; successor required |
| Two offline merch counts | preserve both and require authoritative recount |
| Factor update vs report | prior report pinned; new estimate is successor |

### Privacy Classes

Operational: dates/legs/general itinerary. Restricted: contact/rooming assignments. Protected: access reasons, passports/visas/tax IDs. Financial: salaries, float, receipts and budgets. Events outside owning projection carry opaque refs and minimum state only.

## Edge Cases

| Failure | Deterministic recovery |
|---|---|
| One co-headline tour cancels | Shared dates/costs become impacted; no silent reassignment |
| Map provider route missing | Manual distance/time range with source label; no false precision |
| Hotel changes room inventory | New rooming version and affected-person notice |
| Lost PII offline device | Revoke bundle, expire keys/access and audit; protected docs absent by default |
| Cash float handoff disputed | Append two assertions/custody trail; platform does not declare owner |
| Tax/carnet specialist disagrees | Preserve sources and select responsible human decision; no platform ruling |
| Merch stock goes negative | Block further derived availability, expose conflict and require recount |
| Carbon coverage low | Render partial estimate and exclusions, not normalized full-tour total |

### Two-Implementer Check

Implementations must converge on optional primary-act tours, linked-tour cost instruments, non-optimizing route facts, high-PII offline tour books, record-only travel/float, source-linked per-date P&L, person-owned border documents, running carnet reconciliation, one merch pool and versioned unverified carbon estimates. Booking travel, asserting legality, holding float, copying passports offline by default or claiming verified carbon is non-conformant.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [34-touring-operations § Contracts](../34-touring-operations.md#contracts) defines commands/queries and [34-touring-operations § Event Schemas](../34-touring-operations.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Completed deepening and adversarial convergence | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]
