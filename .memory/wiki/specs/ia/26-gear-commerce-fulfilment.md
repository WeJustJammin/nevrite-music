# Shard 26 — Gear transactions, fulfilment and possession models

**Status:** Complete
**Surface:** Web/PWA, transactional checkout, order evidence and fulfilment workflows
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 26 owns gear offers, checkout grouping, order lifecycle, logistics eligibility, returns, settlement-triggered ownership transfer and local pickup. It consumes version-pinned listing/inventory facts from [[specs/ia/25-gear-market-catalog|Shard 25]], identity/custody facts from [[specs/ia/23-gear-provenance-registry|Shard 23]] and [[specs/ia/24-gear-holdings-operations|Shard 24]], and composes the shared payment/escrow and carrier rails rather than reimplementing them.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 34 |
| Child capabilities | 22 |
| Core consumer launch | Offers, checkout, order lifecycle, ownership transfer, domestic parcel/freight, returns and platform-settled pickup |
| Later consumer capabilities | Auctions, wanted/ISO, service add-ons, RMA/warranty routing |
| Deferred commercial supply | Trade-in, consignment and dealer intake pending a dealer persona and provider/liability model |
| Explicit launch exclusions | Layaway, rentals, international physical sale, platform warehousing, protection plans and permit procurement |

### Commerce Decisions

| Area | Locked decision |
|---|---|
| Offer acceptance | Acceptance atomically claims inventory and creates a time-bounded checkout obligation; no charge occurs without current authorization. Legal enforceability remains counsel/policy-gated. |
| Auctions | Deferred until consumer fixed-price/offer commerce is stable; no split market culture at launch. |
| Checkout composition | One cart may hold intents across domains, but checkout partitions by fulfilment/refund/payment regime. Shipped gear, pickup and digital goods never share one order group. |
| Account/party | Checkout requires an authenticated canonical account and explicit buying party; orders may belong to a person or controlled organisation. |
| Freight quote | Quote request holds no inventory or payment. A ready quote has bounded validity; checkout revalidates availability before claim. |
| Geographic launch | Domestic physical sale only. International/CITES/landed-cost paths remain specified but disabled until provider, counsel and rules-data gates pass. |
| Freight role | Platform brokers approved carrier/freight options and evidence; it does not act as carrier, customs agent, insurer or warehouse at launch. |
| Insurance | Configurable high-value thresholds require admitted carrier declared-value cover or seller attested equivalent; unsupported cover makes the route ineligible. |
| Returns | Statutory rights override policy. Not-as-described/damage return freight is seller-side; change-of-mind freight is buyer-side unless law/policy requires otherwise. Buyer refund is independent of platform recovery. |
| Transfer trigger | Ownership event emits exactly once at settlement, not payment or delivery; reversal is a compensating append. |
| Pickup | Platform-settled pickup is a distinct order with protected location exchange and confirmation. Off-platform payment receives no escrow/settlement/automatic transfer guarantee. |
| Minors | Consumer-launch pickup arrangement is adults-only; minor accounts cannot arrange in-person stranger exchange. |
| Dealer/rental | Trade-in, consignment, dealer intake and rentals are deferred; WeJammin never takes custody or acts as consignee/lessor at launch. |

## Features

- **13.05 Offers, Auctions & Negotiation** — [ideation source](../ideation/13-gear-marketplace/13.05-offers-auctions-negotiation/13.05-offers-auctions-negotiation-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.06 Cart, Checkout & Orders** — [ideation source](../ideation/13-gear-marketplace/13.06-cart-checkout-orders/13.06-cart-checkout-orders-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.07 Gear Logistics & Cross-Border** — [ideation source](../ideation/13-gear-marketplace/13.07-gear-logistics-cross-border/13.07-gear-logistics-cross-border-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.08 Returns, RMA & Warranty** — [ideation source](../ideation/13-gear-marketplace/13.08-returns-rma-warranty/13.08-returns-rma-warranty-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.09 Trade-In, Part-Exchange & Consignment** — [ideation source](../ideation/13-gear-marketplace/13.09-tradein-consignment/13.09-tradein-consignment-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.10 Gear Rental & Backline Hire** — [ideation source](../ideation/13-gear-marketplace/13.10-gear-rental-backline/13.10-gear-rental-backline-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **13.11 Local Pickup & Meetup Safety** — [ideation source](../ideation/13-gear-marketplace/13.11-local-pickup-meetup-safety.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-26.01 — Make/counter offer:** Given Listing allows offers; buyer eligible for destination/item, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Make/counter offer, and (6) return Private structured thread stores item-price offer, expiry and delivered-cost context; if the flow cannot complete, Ineligible route explains why; pending offer never reserves.
- **AC-26.02 — Accept/decline offer:** Given Seller controls listing; offer/version active, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Accept/decline offer, and (6) return Acceptance claims unit atomically and starts checkout deadline; all competing offers void; if the flow cannot complete, Lost unit, hold or stale offer returns explicit terminal reason.
- **AC-26.03 — Maintain mixed-intent cart:** Given Authenticated user, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Maintain mixed-intent cart, and (6) return Cart stores independent intents and displays required checkout groups; if the flow cannot complete, No line is silently dropped; cart never claims inventory.
- **AC-26.04 — Resolve checkout eligibility:** Given Buying party, one destination/group, current facts, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Resolve checkout eligibility, and (6) return Per-shipment price, voltage, fulfilment, policy and screening results itemize; if the flow cannot complete, Ineligible lines remain in cart with reasons and remediation.
- **AC-26.05 — Claim and authorize checkout:** Given All selected lines eligible; versions current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Claim and authorize checkout, and (6) return Claims all group lines, reconfirms actual set, authorizes once, creates independent orders; if the flow cannot complete, Partial claim losers are removed before charge; no half-created order.
- **AC-26.06 — Request freight quote:** Given Route classified freight/oversize, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request freight quote, and (6) return Purpose-bound request returns quote/options/requirements with validity; if the flow cannot complete, No parcel fallback; request holds no inventory/payment.
- **AC-26.07 — Commit domestic shipment:** Given Current quote/coverage/eligibility and order exist, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Commit domestic shipment, and (6) return Label/booking evidence, packing standard and delivery requirements pin to shipment; if the flow cannot complete, Coverage or carrier failure blocks dispatch path and offers retry/change.
- **AC-26.08 — Manage order lifecycle:** Given Actor authorized for action/current state, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Manage order lifecycle, and (6) return Idempotent transition advances concurrent clocks and preserves offline draft; if the flow cannot complete, Stale transition fails loudly with canonical state.
- **AC-26.09 — Amend after purchase:** Given Seller discovers material disclosure change pre-dispatch, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Amend after purchase, and (6) return Dispatch pauses; buyer accepts, accepts reduction or voids for full refund; if the flow cannot complete, No answer resolves toward void under configurable deadline.
- **AC-26.10 — Confirm dispatch/delivery:** Given Packing evidence complete; carrier event or pickup confirmation, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Confirm dispatch/delivery, and (6) return Evidence appends; verified delivery starts inspection/settlement clocks; if the flow cannot complete, Carrier silence remains silence; misdelivery triggers immediate recall/refund workflow.
- **AC-26.11 — Open damage claim:** Given Buyer files before remedy deadline with evidence, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Open damage claim, and (6) return Settlement/title suspend atomically; repair/refund/partial remedies proposed; if the flow cannot complete, Tie with auto-settle resolves to claim; later filing becomes post-settlement case.
- **AC-26.12 — Request return:** Given Order/line eligible by law or policy, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request return, and (6) return Reason-specific authorization, return freight, evidence and deadlines compose; if the flow cannot complete, Seller cooperation/recovery/duty reclaim never gates buyer remedy.
- **AC-26.13 — Inspect returned unit:** Given Return arrives with custody-boundary evidence, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Inspect returned unit, and (6) return Condition delta determines full/partial/diminished-value refund, never refusal; if the flow cannot complete, Conflicting evidence escalates through dispute; clocks remain bounded.
- **AC-26.14 — Settle order:** Given Verified delivery/remedy clocks complete, no active hold, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Settle order, and (6) return Escrow releases once; order becomes financially closed/evidentially open; if the flow cannot complete, Payout failure routes human reconciliation and never reverts settlement.
- **AC-26.15 — Emit ownership transfer:** Given Settlement line resolves canonical gear/party, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Emit ownership transfer, and (6) return Exactly-once transfer event records object, buyer party and settlement time; if the flow cannot complete, Registry outage retries asynchronously; collision appends contested, never misattaches.
- **AC-26.16 — Reverse ownership event:** Given Return/rescission completed, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reverse ownership event, and (6) return Compensating event references original transfer without deleting history; if the flow cannot complete, Refund does not wait for registry write.
- **AC-26.17 — Arrange platform pickup:** Given Adult buyer/seller, platform-settled listing and safe meetup choice, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Arrange platform pickup, and (6) return Protected location release, checklist, confirmations and pickup evidence; if the flow cannot complete, No home address publication; unilateral/no-show path preserves funds and safety.
- **AC-26.18 — Complete off-platform pickup:** Given Seller chose disclosed off-platform settlement branch, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Complete off-platform pickup, and (6) return Platform records arrangement outcome only and offers manual Shard 23 transfer handshake; if the flow cannot complete, No automatic ownership, comp, escrow, refund or platform payment claim.
- **AC-26.19 — Add pre-dispatch service:** Given Eligible domain-14 service and custody/liability path accepted, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Add pre-dispatch service, and (6) return Separate service engagement sequences before shipment; outcome can amend order; if the flow cannot complete, Contradiction gives buyer cancel/reprice/continue election; seller service never called independent.
- **AC-26.20 — Route RMA/warranty:** Given Unit/order/warranty evidence exists, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Route RMA/warranty, and (6) return Eligible order creates unit-scoped manufacturer warranty evidence/registration; Shard 14 repair and Shard 23 service history receive scoped handoff; if the flow cannot complete, “No warranty” stays explicit; provider submission waits for an admitted adapter; platform offers no own warranty.
- **AC-26.21 — Run future international gate:** Given Feature flag/provider/counsel enabled, destination entered, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Run future international gate, and (6) return Current tariff/CITES/landed-cost determination commits or rejects route; if the flow cannot complete, Unknown/recompute failure fails closed; no under-declaration or stale permission.
- **AC-26.22 — Run future auction/ISO/dealer flows:** Given Consumer launch and separate admission gates complete, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Run future auction/ISO/dealer flows, and (6) return Capability-specific state machines reuse claims, custody and evidence; if the flow cannot complete, Disabled features have no hidden partial path or substitute persona.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 26.01 | Make/counter offer | Listing allows offers; buyer eligible for destination/item | Private structured thread stores item-price offer, expiry and delivered-cost context | Ineligible route explains why; pending offer never reserves |
| 26.02 | Accept/decline offer | Seller controls listing; offer/version active | Acceptance claims unit atomically and starts checkout deadline; all competing offers void | Lost unit, hold or stale offer returns explicit terminal reason |
| 26.03 | Maintain mixed-intent cart | Authenticated user | Cart stores independent intents and displays required checkout groups | No line is silently dropped; cart never claims inventory |
| 26.04 | Resolve checkout eligibility | Buying party, one destination/group, current facts | Per-shipment price, voltage, fulfilment, policy and screening results itemize | Ineligible lines remain in cart with reasons and remediation |
| 26.05 | Claim and authorize checkout | All selected lines eligible; versions current | Claims all group lines, reconfirms actual set, authorizes once, creates independent orders | Partial claim losers are removed before charge; no half-created order |
| 26.06 | Request freight quote | Route classified freight/oversize | Purpose-bound request returns quote/options/requirements with validity | No parcel fallback; request holds no inventory/payment |
| 26.07 | Commit domestic shipment | Current quote/coverage/eligibility and order exist | Label/booking evidence, packing standard and delivery requirements pin to shipment | Coverage or carrier failure blocks dispatch path and offers retry/change |
| 26.08 | Manage order lifecycle | Actor authorized for action/current state | Idempotent transition advances concurrent clocks and preserves offline draft | Stale transition fails loudly with canonical state |
| 26.09 | Amend after purchase | Seller discovers material disclosure change pre-dispatch | Dispatch pauses; buyer accepts, accepts reduction or voids for full refund | No answer resolves toward void under configurable deadline |
| 26.10 | Confirm dispatch/delivery | Packing evidence complete; carrier event or pickup confirmation | Evidence appends; verified delivery starts inspection/settlement clocks | Carrier silence remains silence; misdelivery triggers immediate recall/refund workflow |
| 26.11 | Open damage claim | Buyer files before remedy deadline with evidence | Settlement/title suspend atomically; repair/refund/partial remedies proposed | Tie with auto-settle resolves to claim; later filing becomes post-settlement case |
| 26.12 | Request return | Order/line eligible by law or policy | Reason-specific authorization, return freight, evidence and deadlines compose | Seller cooperation/recovery/duty reclaim never gates buyer remedy |
| 26.13 | Inspect returned unit | Return arrives with custody-boundary evidence | Condition delta determines full/partial/diminished-value refund, never refusal | Conflicting evidence escalates through dispute; clocks remain bounded |
| 26.14 | Settle order | Verified delivery/remedy clocks complete, no active hold | Escrow releases once; order becomes financially closed/evidentially open | Payout failure routes human reconciliation and never reverts settlement |
| 26.15 | Emit ownership transfer | Settlement line resolves canonical gear/party | Exactly-once transfer event records object, buyer party and settlement time | Registry outage retries asynchronously; collision appends contested, never misattaches |
| 26.16 | Reverse ownership event | Return/rescission completed | Compensating event references original transfer without deleting history | Refund does not wait for registry write |
| 26.17 | Arrange platform pickup | Adult buyer/seller, platform-settled listing and safe meetup choice | Protected location release, checklist, confirmations and pickup evidence | No home address publication; unilateral/no-show path preserves funds and safety |
| 26.18 | Complete off-platform pickup | Seller chose disclosed off-platform settlement branch | Platform records arrangement outcome only and offers manual Shard 23 transfer handshake | No automatic ownership, comp, escrow, refund or platform payment claim |
| 26.19 | Add pre-dispatch service | Eligible domain-14 service and custody/liability path accepted | Separate service engagement sequences before shipment; outcome can amend order | Contradiction gives buyer cancel/reprice/continue election; seller service never called independent |
| 26.20 | Route RMA/warranty | Unit/order/warranty evidence exists | Eligible order creates unit-scoped manufacturer warranty evidence/registration; Shard 14 repair and Shard 23 service history receive scoped handoff | “No warranty” stays explicit; provider submission waits for an admitted adapter; platform offers no own warranty |
| 26.21 | Run future international gate | Feature flag/provider/counsel enabled, destination entered | Current tariff/CITES/landed-cost determination commits or rejects route | Unknown/recompute failure fails closed; no under-declaration or stale permission |
| 26.22 | Run future auction/ISO/dealer flows | Consumer launch and separate admission gates complete | Capability-specific state machines reuse claims, custody and evidence | Disabled features have no hidden partial path or substitute persona |

## Contracts

### Command Contracts

| Command | Required input | Invariants |
|---|---|---|
| `SubmitOffer` | listing/price version, item amount/currency, expiry policy, buyer/destination context | Private; item price only; eligibility checked; no reservation |
| `RespondOffer` | offer/thread version, action/counter amount, seller, idempotency key | Acceptance routes through same unit arbitration as Buy Now |
| `PrepareCheckoutGroup` | buyer party, destination/mode, selected lines/versions | One fulfilment regime and destination; actual delivered totals itemized |
| `CommitCheckoutGroup` | prepared group/version, claims, payment authorization, idempotency key | Claim before/with authorization; charge only created lines; independent orders |
| `TransitionOrder` | order/line, command, expected version, actor, offline command ID | Explicit state machine; every stall has policy-versioned automatic resolution |
| `SubmitOrderAmendment` | order line, disclosure diff, proposed remedy, seller | Dispatch pauses; buyer alone elects |
| `OpenReturnOrDamageCase` | order line, type/reason, evidence, capture times, idempotency key | Filing before deadline protects remedy; return and damage remain distinct |
| `SettleOrderLine` | order line/version, verified delivery, remedy/dispute state | Exactly-once money close and outbox; no duplicate payout |
| `RecordTransferFromSettlement` | order/line/unit, composite identity, buyer party, settlement time | One transfer per settled line/unit; no fabricated tenure |
| `ConfirmPickup` | order, party, outcome, evidence, expected version | Dual confirmation preferred; disputed/unilateral result never silently settles |

### Cross-Domain Contracts

- Shard 25 supplies immutable listing, disclosure, media, policy, price, inventory and screening versions.
- Shard 24 supplies confirmed custody and scoped `sell` authority; custody/liability facts remain distinct from ownership.
- [[specs/ia/14-services-marketplace|Shard 14]] owns inspection/repair work, provider matching and service delivery; this shard owns sale sequencing and buyer election.
- Shard 23 receives settlement transfer, reversal and service-history facts and remains authoritative for title evidence/contests.
- Payment, escrow, payout, tax and carrier integrations are shared rails with provider webhooks reconciled idempotently.

## Data Models

| Model | Required fields | Rules |
|---|---|---|
| `OfferThread` / `Offer` | listing/unit, buyer/seller, amount/currency, state, expiry, move count, eligibility version | States `pending`, `countered`, `accepted`, `declined`, `expired`, `voided`, `held`; private and versioned |
| `CartIntent` | account, listing/price version, desired quantity, destination/mode hint | No inventory authority; may span future checkout groups |
| `CheckoutGroup` | buying party, regime, destination, line preparations, quote/tax/policy versions, deadline | Shipped/pickup/digital groups never mix |
| `Order` / `OrderLine` | parties, subject, claim, pinned listing/disclosure/media/policy/price, payment/shipment refs, state/version | Independent real order; no half-order aggregate |
| `OrderClock` | type, policy version, starts/expires/paused reason, protected filing | Concurrent; messaging never pauses; dispute/provider outage may |
| `Shipment` | mode, origin/destination snapshots, packages, freight class, quote/coverage, state | Shipment is eligibility/quote unit; no silent parcel fallback |
| `FreightQuoteRequest` | dimensions/facts, destination, requirements, provider request/response, validity | No claim/payment; ready quote must revalidate at checkout |
| `PackingEvidence` | shipment, standard version, media/scans, capturer/times | Append-only and part of custody-boundary evidence |
| `ReturnCase` | order line, reason class, statutory/policy basis, freight payer, evidence, state/deadlines | Return distinct from damage; buyer refund independent of recovery |
| `DamageCase` | order line/shipment, evidence pack, coverage, remedy proposals, state | Timely open atomically suspends settlement/title |
| `SettlementRecord` | order line, money outcome, release/refund components, settled time/version | Financially terminal and exactly once |
| `OwnershipTransferIntent` | settlement line, gear identity, from/to party, transfer/reversal link, delivery mode | Async retry; collision contested; off-platform pickup excluded |
| `PickupArrangement` | adult parties, coarse area, protected venue/location, schedule, branch, confirmations/evidence | Exact location purpose-limited; platform/off-platform branches explicit |
| `InternationalDetermination` | destination, tariff/material facts, rule/provider version, CITES/landed-cost result, validity | Future gated; unknown/failure is ineligible |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`OfferThread`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: listing/unit, buyer/seller, amount/currency, state, expiry, move count, eligibility version | States `pending`, `countered`, `accepted`, `declined`, `expired`, `voided`, `held`; private and versioned.
- **`Offer`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: listing/unit, buyer/seller, amount/currency, state, expiry, move count, eligibility version | States `pending`, `countered`, `accepted`, `declined`, `expired`, `voided`, `held`; private and versioned.
- **`CartIntent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: account, listing/price version, desired quantity, destination/mode hint | No inventory authority; may span future checkout groups.
- **`CheckoutGroup`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: buying party, regime, destination, line preparations, quote/tax/policy versions, deadline | Shipped/pickup/digital groups never mix.
- **`Order`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: parties, subject, claim, pinned listing/disclosure/media/policy/price, payment/shipment refs, state/version | Independent real order; no half-order aggregate.
- **`OrderLine`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: parties, subject, claim, pinned listing/disclosure/media/policy/price, payment/shipment refs, state/version | Independent real order; no half-order aggregate.
- **`OrderClock`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: type, policy version, starts/expires/paused reason, protected filing | Concurrent; messaging never pauses; dispute/provider outage may.
- **`Shipment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: mode, origin/destination snapshots, packages, freight class, quote/coverage, state | Shipment is eligibility/quote unit; no silent parcel fallback.
- **`FreightQuoteRequest`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: dimensions/facts, destination, requirements, provider request/response, validity | No claim/payment; ready quote must revalidate at checkout.
- **`PackingEvidence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: shipment, standard version, media/scans, capturer/times | Append-only and part of custody-boundary evidence.
- **`ReturnCase`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: order line, reason class, statutory/policy basis, freight payer, evidence, state/deadlines | Return distinct from damage; buyer refund independent of recovery.
- **`DamageCase`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: order line/shipment, evidence pack, coverage, remedy proposals, state | Timely open atomically suspends settlement/title.
- **`SettlementRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: order line, money outcome, release/refund components, settled time/version | Financially terminal and exactly once.
- **`OwnershipTransferIntent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: settlement line, gear identity, from/to party, transfer/reversal link, delivery mode | Async retry; collision contested; off-platform pickup excluded.
- **`PickupArrangement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: adult parties, coarse area, protected venue/location, schedule, branch, confirmations/evidence | Exact location purpose-limited; platform/off-platform branches explicit.
- **`InternationalDetermination`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: destination, tariff/material facts, rule/provider version, CITES/landed-cost result, validity | Future gated; unknown/failure is ineligible.

## Access Control

| Capability | Buyer | Seller | Org staff | Support/risk | Provider |
|---|---:|---:|---:|---:|---:|
| Read own offer/order/claim | own only | relevant only | delegated seller orders | case-bound | scoped callback/status |
| Make/accept offer | make/counter | respond | delegated listing role | no | no |
| Select buying party | controlled parties | no | controlled org | no | no |
| Amend disclosure after claim | elect remedy | propose only | delegated proposal | audit/escalate | no |
| Dispatch/return evidence | arrival/return side | dispatch/return-receipt side | delegated | case-bound | carrier scan only |
| Settle/refund | no direct transition | no direct transition | no | authorized workflow/human exception | payment rail |
| Record ownership | recipient visibility choice later | no | buying party authority | retry/reconcile | no |
| View exact pickup location | after arrangement gate | after arrangement gate | relevant delegated actor | safety case only | no |

- Every action resolves canonical account, acting/buying party, relationship, age/safeguarding eligibility and aggregate version.
- Address, exact meetup location, customs documents, payment data and evidence originals are purpose-bound and never public.
- Provider webhook claims are authenticated, replay-protected, reconciled to expected state and cannot directly widen user authority.
- Off-platform payment branch is visibly outside escrow/refund/settlement guarantees before parties exchange location.

### Access Escalation

- **Read own offer/order/claim:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Make/accept offer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Select buying party:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Amend disclosure after claim:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Dispatch/return evidence:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Settle/refund:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Record ownership:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **View exact pickup location:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Offers state acceptance consequence, expiry and delivered-cost context in plain language before submission.
- Checkout groups explain why items split and preserve inaccessible/ineligible lines with linked remediation.
- Clocks use text deadlines and server times; countdowns never provide the only expiry information.
- Order timelines expose current state, completed steps, active deadlines and responsible party as semantic lists.
- Evidence capture supports keyboard/file input, retake/review, captions and non-camera alternatives where policy permits.
- Return/damage forms separate reason, evidence and remedy; errors focus the first invalid field without losing uploads.
- Pickup safety steps and emergency/no-show actions remain operable at 200% zoom and without precise pointer input.
- Status updates announce once and never rely on color, motion or map-only information.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `gear_offer.changed.v1` | thread/offer, prior/new state, amount, expiry, actor, version | private inbox, inventory claim |
| `gear_checkout.group_committed.v1` | group, buyer party, created order IDs, total/version | payment reconcile, receipt |
| `gear_order.state_changed.v1` | order/line, prior/new state, clocks, actor, version | timelines, notifications, evidence |
| `gear_order.amendment_opened.v1` | order line, disclosure versions/diff, options, deadline | buyer election, dispatch hold |
| `gear_shipment.state_changed.v1` | shipment, prior/new state, carrier evidence/version | order, settlement, claims |
| `gear_order.damage_claimed.v1` | case/order line, filedAt, evidence refs, hold/version | settlement/title suspension, insurance |
| `gear_order.return_changed.v1` | return, reason/basis, state, payer/remedy/version | refund, logistics, registry reversal |
| `gear_order.settled.v1` | settlement/order line, money outcome, settledAt, version | payout, comp admission, ownership |
| `gear_order.transfer_requested.v1` | settlement/line/unit, composite identity, parties, reversal ref | Shard 23 registry writer |
| `gear_pickup.arrangement_changed.v1` | arrangement, branch, state, schedule, version | safety, order, manual transfer prompt |
| `gear_logistics.quote_changed.v1` | request, state, quote validity/requirements, version | buyer/seller, checkout |
| `gear_compliance.determination_changed.v1` | route, rule version, result/reasons, validity | offer/bid/checkout gates |

Events carry no raw addresses, payment secrets, evidence bytes or protected registry identifiers.

## Edge Cases

| Case | Required outcome |
|---|---|
| Offer accepted while Buy Now commits | First atomic unit claim wins; other offer/claim voids with reason |
| Offer submitted while unit reserved | Store as queued without running its clock; activate only if unit returns, otherwise void on sale or configured return-window expiry |
| Stolen hold arrives during offer | Pause live offer clocks, reject new offers and preserve exact prior deadlines for lawful resume |
| Offer accepted without payment authorization | Unit holds under policy deadline; no charge or fabricated settlement |
| Cart mixes gear and digital | Preserve one cart view; partition into distinct checkout groups/orders |
| Freight quote pending | No claim/payment; quote result rechecks availability before checkout |
| Payment succeeds but order creation is uncertain | Idempotent reconcile creates/locates exact orders or refunds; never duplicate charge/order |
| Carrier says delivered but buyer disputes | Verified-delivery policy weighs evidence; filing protects remedy before auto-settle |
| Damage claim and auto-settle race | Claim wins when committed before deadline; transactional hold prevents release/title |
| Payout fails after settlement | Order stays settled; money exception routes human reconciliation |
| Registry unavailable at settlement | Settlement succeeds; exactly-once transfer intent retries |
| Return completes after transfer | Refund proceeds; compensating transfer append follows asynchronously |
| Buyer accepts repair/partial remedy | Applicable return right pauses during performance and resumes if the alternative fails; it is never silently waived |
| Buyer party is band/org | Order and transfer record controlled organisation, not clicking human |
| Pickup paid off-platform | No automatic settlement/comp/transfer; manual handshake and explicit protection limits |
| Pickup party is minor | Arrangement blocked at consumer launch; no exact location exchange |
| International route attempted while disabled | Route unavailable before offer/commitment; domestic alternatives remain |
| High-value cover unavailable | Shipment route ineligible; no uninsured silent fallback |
| Consignment/trade-in/rental requested | Deferred capability explains unavailability; platform does not invent dealer/operator role |

## Dependency References

- Consumes listing/inventory/policy snapshots from Shard 25 and identity/custody authority from Shards 23–24.
- Composes shared payment/escrow, tax, carrier, messaging, scheduling, notifications, moderation and dispute rails.
- Routes service/inspection/repair work to Shard 14 and settlement/reversal/service evidence to Shard 23.
- International, dealer, rental and layaway capabilities remain disabled behind explicit product, counsel, provider and persona gates.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 26.01 Make/counter offer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.02 Accept/decline offer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.03 Maintain mixed-intent cart | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.04 Resolve checkout eligibility | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.05 Claim and authorize checkout | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.06 Request freight quote | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.07 Commit domestic shipment | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.08 Manage order lifecycle | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.09 Amend after purchase | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.10 Confirm dispatch/delivery | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.11 Open damage claim | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.12 Request return | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.13 Inspect returned unit | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.14 Settle order | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.15 Emit ownership transfer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.16 Reverse ownership event | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.17 Arrange platform pickup | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.18 Complete off-platform pickup | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.19 Add pre-dispatch service | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.20 Route RMA/warranty | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.21 Run future international gate | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 26.22 Run future auction/ISO/dealer flows | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 25:** consume [Shard 25 Contracts](25-gear-market-catalog.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 25 Event Schemas](25-gear-market-catalog.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 23:** consume [Shard 23 Contracts](23-gear-provenance-registry.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 23 Event Schemas](23-gear-provenance-registry.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 24:** consume [Shard 24 Contracts](24-gear-holdings-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 24 Event Schemas](24-gear-holdings-operations.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 14:** consume [Shard 14 Contracts](14-services-marketplace.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 14 Event Schemas](14-services-marketplace.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

- 2026-08-02: Initial complete interaction architecture authored from 34 source documents and 22 child capabilities.
- 2026-08-02: Locked domestic consumer-first commerce, partitioned checkout, brokered freight, bounded remedies, settlement-triggered transfer and deferred custody-heavy models.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
