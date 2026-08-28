# Deep Dive 28 — Digital licensing, commerce, revocation and revenue

**Status:** Complete
**Parent:** [[specs/ia/28-digital-licensing-commerce|Shard 28]]

## Overview

This deep dive closes bundle-allocation/ownership arithmetic, exclusive-rights atomicity, withdrawal causality, refund policy, transfer deferral and contributor-money integrity.

## Interactions

### Purchase and Waiver Flow

1. Resolve current product/tier, holder, seller capacity, price, terms and artifact versions.
2. Commit payment/order and Shard-27 entitlement idempotently; no delivery yet where waiver applies.
3. First delivery asks one unticked localized consent containing both immediate-supply and withdrawal-loss limbs.
4. Waiver row commits before transfer grant; absent row means no grant/bytes.
5. Decline is supported and states the date ordinary delivery becomes available without repeated waiver.
6. Exempt origins/sellers/windows skip only under counsel-authored policy; ambiguity receives protective EU/UK wording.

### Bundle Allocation and Ownership Adjustment

1. On promotion-version admission, resolve every exact member listing/model and a positive independently executable standalone-price version in one settlement currency. Missing, zero, negative, cross-currency or bundle-only price fails closed; no list/equal/vendor weight or runtime FX fallback exists.
2. Freeze `basis_kind=standalone_selling_price`, listing/price versions and full-bundle consideration. Compute each raw share as `B × s_i / Σs`.
3. Invoke Shard 18 `RoundPayableAggregate` once with immutable `bundle_member_id` row/tie keys. Persist a vector whose minor-unit shares sum exactly to full consideration; multi-vendor participants accept that exact version before sale.
4. At cart time, resolve a versioned holder-ownership snapshot. Deduct frozen shares for owned members; payable equals the sum of unowned shares. Ownership uncertainty holds the cart.
5. Recheck ownership before capture. A change produces a visible successor quote; no capture uses a stale quote. All-owned returns zero and mints nothing.
6. Each acquired entitlement pins its member allocation, promotion version, basis kind and standalone-price version. Refunds, vendor payout and contributor accrual consume that evidence without re-apportionment; later price/promotion changes never rewrite it.

### Refund and Revocation Flow

1. Before first delivery, cancel instantly without adjudication.
2. After delivery, read frozen compatibility, listing, terms, waiver, transfer and downstream-use evidence.
3. Automatic path handles deterministic promise failure/statutory cases; ambiguous conformity/downstream use routes human review.
4. Decision returns outcome, exact reason, operational cause and appeal; cause allocates cost but never weakens buyer entitlement.
5. Refund goes to original instrument/currency independently of vendor clawback.
6. Revocation stops future platform delivery immediately, tombstones library and preserves annotations.
7. Previously evidenced lawful release clearance remains; new use is prohibited and unknown cases remain unresolved, not “clear.”

### Exclusive Beat Transaction

1. Lock beat/product/right aggregates and display active prior-lease count plus exact scope.
2. Confirm payment and Shard-10 rights instrument.
3. Atomically delist exclusive tier/product, preserve disclosed prior leases and issue exclusive entitlement/right.
4. If atomic boundary cannot include external leg, durable saga compensates money/delist/right with visible hold.
5. Post-transfer refund never enters ordinary refund path; rescission must unwind rights explicitly.

### Contributor Accrual

1. Product submission references Shard-10 contributor use consents and split version.
2. Acquisition allocates consideration to product/assets. For bundle lines it consumes the entitlement's frozen standalone-price-proportional member share without re-apportioning; an eligible download/acquisition event creates per-asset accrual.
3. Re-download by same buyer/asset dedupes; refund/chargeback appends reversal.
4. Period close freezes rate/split versions and emits per-payee statement.
5. Confirmed payable shares proceed only through admitted payout gate; unresolved share becomes held funds after configured deadline (source default 30 days).

## Contracts

### Refund Policy Matrix

| State/reason | Outcome |
|---|---|
| before first delivery | instant cancellation/refund |
| valid waiver + change of mind | discretionary refund unavailable |
| statutory right not validly waived | refund |
| false compatibility/conformity promise | refund regardless of cause |
| downstream-used asset + genuine defect | human review; remedy may refund while preserving past clearance |
| transferred-out entitlement | not refundable, disclosed before transfer |
| exclusive rights transferred | counsel-reviewed rescission only |

### Revocation Semantics

- `refund`, `chargeback` and `blacklist` are distinct triggers even when entitlement state converges.
- First revocation trigger controls current state; later triggers append to history.
- Platform delivery is enforceable; local bytes/machines are best-effort and never represented as recovered.
- Commercial re-purchase reactivates the same Shard-27 entitlement/acquisition history.

## Data Models

### Digital Commerce States

`carted → purchased → awaiting_waiver → deliverable → refunded|chargeback|revoked`

Entitlement state remains authoritative in Shard 27. This commerce projection records causes, money and consent; it cannot erase issuance.

### Split and Accrual Boundary

- Shard 10 authors parties, percentages, consent and effective versions.
- This shard authors acquisition consideration allocation, asset attribution, period rate, accrual/reversal and held-funds records.
- Promotion admission authors the full member vector; holder ownership removes already-owned shares before capture. Entitlement/refund/accrual consumers may cite but never recompute that vector.
- Split amendments apply forward from period boundary; closed period statements never recompute silently.
- Single contributor must explicitly confirm 100%; no default assignment.

## Access Control

- Holder controls purchase/waiver/refund/transfer request for its entitlement; actor authority is rechecked for org holders.
- Vendor sees structured reversal/cause and aggregate usage/accrual, never buyer identity or case narrative.
- Contributor confirms only own split/use row and sees only own accrual/held funds plus reconciliation totals.
- Refund adjudicator cannot alter rights/split records; rights rescission routes authorized Shard-10 process.
- Finance exceptions require immutable reason and configured dual control; no manual ledger edits.

## Accessibility

- Tier scope and exclusive-rights transfer use plain summaries before legal detail.
- Waiver checkbox text remains complete at 200% zoom and durable confirmation is accessible.
- Refund outcome includes cited evidence, reason, appeal deadline and status in logical reading order.
- Accrual statements expose formulas and exact source rows without requiring visual charts.

## Event Schemas

### Race Resolution

| Race | Resolution |
|---|---|
| Price hold vs terms change | Price may remain held; changed terms invalidate consent and require fresh acceptance |
| Waiver vs transfer grant | Database causal constraint prevents grant without applicable waiver/exemption |
| Refund vs download range | Refund commit emits revocation; next range reauthorization fails |
| Exclusive vs lease checkout | Aggregate lock serializes; losing checkout refunds/never charges |
| Split edit vs period close | Effective version determines next period; closing period pins prior |
| Refund vs contributor close | Late refund appends reversal in current correction period with original reference |

All money and rights events use server time, idempotency and reconciliation.

## Edge Cases

| Ambiguity | Locked resolution |
|---|---|
| Beat licensing domain 14 or 11? | Shopping/entitlement surface here; rights vocabulary and instruments remain Shard 10/terms registry |
| Lower-tier beat delivery tagged? | No; public preview tagged, paid delivery follows tier and defaults untagged |
| Subscriptions at launch? | No; avoids stored-value liability and subscription proliferation |
| Rent-to-own at launch? | No; consumer-credit and exit/refund risks unresolved |
| Used licence transfer at launch? | No; exhaustion law and vendor deactivation/provider gates unresolved |
| Platform currency? | None |
| Gift purchases? | Data model supported by Shard 27; checkout UI deferred |
| Refund above statutory floor? | Promise/conformity-protective, not general post-delivery change-of-mind |
| Refund un-clears prior release? | No; preserve evidenced past clearance and revoke future use |
| Grace before routine revocation? | Platform delivery stops immediately; future executable session grace follows disclosed activation policy |
| Who owns contributor split? | Shard 10; no second split system |
| Multi-payee payout now? | Accrue/state/hold now; disburse only after B3 counsel/provider approval |

## Dependency References

- [[specs/ia/27-digital-catalog-delivery|Shard 27]] owns entitlement and delivery enforcement.
- [[specs/ia/10-rights-ownership|Shard 10]] owns rights transfers, splits and clearance evidence.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [28-digital-licensing-commerce § Contracts](../28-digital-licensing-commerce.md#contracts) defines commands/queries and [28-digital-licensing-commerce § Event Schemas](../28-digital-licensing-commerce.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

- 2026-08-03: Deepened consent-before-delivery, evidence-first refunds, exclusive rights, future-use revocation and contributor accrual boundaries.
- 2026-08-27: F09 resolved — deepened immutable standalone-selling-price proportional bundle allocation, Shard 18 residue handling, ownership-adjusted quotes and downstream allocation evidence.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
