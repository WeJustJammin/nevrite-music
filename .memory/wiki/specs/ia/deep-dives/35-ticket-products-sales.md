# Deep Dive 35 — Ticket products, sales, access packages and delivery

**Status:** Complete
**Parent:** [[specs/ia/35-ticket-products-sales|Shard 35]]

## Overview

This deep dive closes inventory accounting, payment-hold races, accessible parity, neutral queues, reserve-backed door issuance, component-package atomicity and live-pass correctness.

## Interactions

### Scaling, Manifest and Fees

1. Select Shard-29 room configuration and seating model GA/reserved/mixed.
2. Define price levels/timed or sold-quantity tiers and shared concession variants in one currency.
3. Partition capacity into sellable, accessible, comp and contract-derived hold blocks; kills remain distinct.
4. Every hold has release deadline. Accessible block structurally lacks generic auto-release.
5. Configure all fee lines/recipient/tax/rounding and compute one exact all-in total.
6. Lock manifest only when every unit reconciles and accessible/companion parity passes.
7. Post-sale price decrease runs affected-buyer preview and selected guarantee; increase blocks by default.

### On-Sale, Presale and Cart

1. Consume announce authorization and save venue-local times plus UTC with explicit DST semantics.
2. Schedule durable announce/presale/public jobs; schedule change blocks until window/code-holder impacts confirmed.
3. Presale window reserves exclusive source-pool allocation and issues unique/shared eligibility policy.
4. Optional waiting room randomizes active participants at on-sale; no earlier-arrival/role priority.
5. Cart serializably reserves units and sold-tier counters, freezes exact price and expires to source pool.
6. Payment authorization enters bounded reconciliation extension; inventory remains reserved until definitive commit/compensation.
7. Commit order/payment/tickets atomically or through durable saga with no oversell/double charge.

### Waitlist

1. Fan records quantity, all-or-partial preference and demand-processing consent.
2. Returned inventory forms private offer batches before public release.
3. Signed code/offer gives bounded claim; position/depth never exposed.
4. Lapse releases to next fan. Repeated abuse applies disclosed cooldown under settings, not secret rank.
5. Waitlist depth can prompt Operator hold release, never auto-release or price increase.

### Guest List and Door Add

1. Typed Shard-30 comp term creates party/funder allocation and matching held manifest units.
2. Party submits one identity per admission; +1 is separate unit/barcode and spends atomically.
3. Issuance moves held→comp, binds price level and keeps paid/comp/admission counters distinct.
4. Before deadline, void returns specific unit; after deadline barcode invalidates but unit is not resold.
5. Offline event bundle includes configured reserve units. Door add spends reserve and syncs idempotently.
6. Over-reserve add requires online Operator, reason and absorb party (`artist|venue|split|goodwill_funded_party`) and appears separately in settlement.

### VIP, RSVP and Delivery

1. Launch package references ticket, early entry and artist-capacity M&G; no copied counts.
2. Availability is minimum across variant-aware components and reservation is all-or-release-all.
3. Assign M&G slots with slack; roster has device and paper views.
4. Artist/platform-fault missed component receives component refund/remedy; fan-fault nonattendance does not automatically refund.
5. Free/private RSVP creates one admission per verified fan/head with no payment-shaped objects.
6. Wallet pass projects live ticket/show state; print/email are fallbacks and transferred recipient can claim without account.

## Contracts

### Manifest Equation

```text
licensed_config_capacity =
  unassigned +
  sellable_available +
  accessible_available +
  held +
  carted +
  sold +
  comp +
  killed
```

Each physical seat/unit occupies exactly one state. Allocation/source-pool moves are journaled; counters alone are not canonical.

### Payment-Hold Saga

1. `ReserveCart` commits inventory and price.
2. Create provider authorization with cart idempotency key.
3. Definitive success commits order and ticket epochs.
4. Definitive failure releases source units and code use.
5. Ambiguous state extends reservation only within configured reconcile bound and polls/webhook-reconciles.
6. Bound exceeded enters manual finance/inventory hold; it never sells same units twice.

### Accessible Parity

Accessible position and companions share ordinary sale windows/process. One order fee applies; companions use comparable tier per-ticket fees. No medical proof. Production relocation requires same/better sightline, price and access or explicit holder remedy.

### Delivery Projection

```text
TicketPass = project(
  ticket_identity,
  ticket_state_and_epoch,
  show_state_and_logistics,
  holder_delivery_claim,
  channel_capabilities
)
```

Projection contains correctness/logistics only. Any ticket/show state change invalidates prior artifact epoch and updates/reissues channels.

## Data Models

### Inventory Journal

- Unit-addressable reserved seats track seat ID; GA uses serializable quantity journal.
- Concession variant changes price/eligibility, not capacity block.
- Presale, cart, guest and waitlist return to exact source pool.
- Contract-derived hold edit creates Shard-30 amendment request; local override cannot contradict contract silently.
- Manifest owner is authorized box-office party for show, independent of venue/promoter label.

### Package and Admission

- Package state is conjunction of components; fan sees unified view plus component remedies.
- Transfer allowed only when every component policy permits and artist M&G policy confirms recipient handling.
- RSVP and paid ticket share admission/door contract but never order/payment/refund/resale flows.
- Venue-less RSVP requires named capacity/location owner and private location disclosure policy.

### Price and Refund Basis

Every order stores exact first-impression all-in total and fee allocation. Per-order fee remains order-scoped. Price guarantee creates explicit refund/credit instruction; downstream refunds never reconstruct fees by averaging.

## Access Control

- Box-office Config manages scaling/manifest/schedule; settlement-side authority manages fees/payee.
- Artist guest allocator spends own held units but cannot configure global inventory.
- Door role scans and spends signed reserve only; Operator role authorizes over-allocation.
- Fan can access only eligible windows, own cart/order/tickets/waitlist/RSVP.
- System queue has no privileged role lane or manual backdoor.
- Support can re-send/recover delivery under audit but cannot mint duplicate ticket identities.

## Accessibility

- Accessible stock is not hidden behind support/contact path.
- Seat maps have list alternatives with accessible/companion/sightline/price labels.
- Queue status and reconnect are screen-reader announced without exposing exact rank.
- Cart timer shows absolute expiry and remaining time without animation-only urgency.
- M&G roster and wallet have print/text fallback.
- All void/refund/transfer states are visible words on pass, not barcode behavior alone.

## Event Schemas

### Ordering and Idempotency

All inventory, schedule, code, queue, cart, order, comp, RSVP, package and delivery commands require stable idempotency keys.

| Race | Resolution |
|---|---|
| Tier advance vs cart create | serializable tier counter; cart pins committed tier |
| Payment callback vs cart expiry | reconcile state lock decides; inventory not released while ambiguous |
| Code redemption vs failed payment | saga restores both use count and exact source units |
| Hold expiry vs guest issuance | allocation lock chooses one; loser reads terminal state |
| Door reserve add offline vs online sale | reserve is pre-partitioned, so pools cannot collide |
| Transfer vs wallet update | ticket epoch serializes; old holder artifact voids |
| RSVP release vs conversion to paid | manifest lock preserves admission or returns unit once |

### Inventory Event Privacy

Public events expose availability posture/product only. Fan events expose own cart/order/pass. Operator events expose block counts but not accessible medical identity. Code/barcode/claim secrets never enter events.

## Edge Cases

| Failure | Deterministic recovery |
|---|---|
| Manifest source capacity decreases after sale | Stop new sales, impact review/remediation; no involuntary auto-unwind |
| Price guarantee provider refund fails | Buyer obligation remains owed/pending; price decrease records visible incident |
| Queue service restarts | Durable signed positions/reconnect epoch restore neutral order |
| Shared code leaked | Rate/quantity/account policy limits; rotate/revoke without exposing holders |
| Waitlist claimant repeatedly lapses | Disclosed cooldown after configured threshold; no permanent hidden penalty |
| Comp duplicates paid buyer | Warn allocation owner; do not expose purchase details or auto-void |
| Door device loses network | Scan/offline reserve from signed bundle; sync detects replay/epoch conflicts |
| Package component cancels | Recompute package state and component remedy; unaffected ticket remains unless package policy says all-cancel |
| RSVP holder forwards link | Recipient must become distinct verified fan; original cannot create party-size unit |
| Delivery email bounces | Retry under settings, alert Operator and keep wallet/print recovery |

### Two-Implementer Check

Implementations must converge on exact unit conservation, show-owned scaling, all-in price immutability, protected accessible inventory, durable neutral queue, source-pool returns, payment ambiguity reservation, hold-backed comps, reserve-backed offline adds, atomic ticket-only VIP, payment-free RSVP and live ticket projection. Capacity oversell, queue priority, disability proof, hidden repricing, duplicate package stock or stale wallet snapshots are non-conformant.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [35-ticket-products-sales § Contracts](../35-ticket-products-sales.md#contracts) defines commands/queries and [35-ticket-products-sales § Event Schemas](../35-ticket-products-sales.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Completed deepening and adversarial convergence | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
