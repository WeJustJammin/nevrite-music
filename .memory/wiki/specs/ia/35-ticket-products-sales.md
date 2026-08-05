# Shard 35 — Ticket products, sales, access packages and delivery

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 35 owns show ticket products, scaling, capacity manifest/allocation, all-in pricing, on-sale/presale/queue/waitlist, guest-list/comps, ticket-only VIP access packages, free/private RSVP admission and fan ticket delivery. It consumes room configuration/capacity from [[specs/ia/29-venues-spaces|Shard 29]], accepted booking/announce authorization from [[specs/ia/30-booking-contracts|Shard 30]], resilient payment/event primitives from [[specs/ia/00-infrastructure|Shard 00]], and abuse/evidence controls from [[specs/ia/06-trust-safety|Shard 06]].

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 26 |
| Child capabilities | 18 |
| Launch inventory | One show, one selected room configuration/capacity graph; multi-day/festival overlapping pools deferred |
| Paid commerce | Exact all-in price, single-currency show, single compliance-cleared payee, server-reconciled payment |
| Free admission | Separate RSVP flow with no checkout, fees, refunds or resale |
| VIP launch | Ticket + scheduled M&G/early-entry access only; physical merchandise components deferred to governed fulfillment |
| Delivery | Wallet-pass projection first, print/email fallback, one ticket identity across issuance paths |
| Launch exclusions | Disability proof upload, dynamic pricing, comp oversell, queue priority, involuntary oversell unwind, physical VIP fulfillment and external-ticket wallet impersonation |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Scaling | Show-owned GA/reserved/mixed configuration in one ISO currency. Concessions share inventory and use honor-system plus door-check flag; no document verification. |
| Price changes | In-flight cart keeps quoted price. Increase after sale blocks by default. Decrease requires affected-buyer preview and defaults to automatic difference refund/credit where provider can execute, never silent repricing. |
| Manifest | Read-only licensed capacity from Shard 29, show allocations/holds/kills, explicit owner/funder/deadlines and atomic unit accounting. Contract-derived holds cite Shard-30 clause. |
| Accessible inventory | Separate protected block across every seating model; no proof at purchase, no early general release, and no production kill without equivalent-or-better replacement. |
| Fees | First impression equals exact charged total. Integer minor units, fee-line half-up rounding, order fees remain order-scoped, one per-order fee for accessible position plus companions. |
| Announcement | Shard 30 authorizes; this shard owns operational venue-local schedule. Tour-wide on-sale is a batch template over per-show schedules, not shared mutable entity. |
| Presale | Window owns real allocation. Unique codes do not exceed allocation by default; shared codes grant eligibility, never inventory guarantee. Invisible when fan is ineligible. |
| Queue/cart | Queue optional, neutral and randomized at on-sale; no backdoor. Cart hold returns to source pool and survives payment ambiguity only under bounded provider-reconciliation state. |
| Waitlist | Returned inventory offers privately before public release. Fan chooses all-or-partial acceptance at join; repeated lapses use disclosed cooldown, never hidden rank penalties. |
| Guest/comps | Deal-derived allocation flows automatically when typed. Every comp is real ticket/barcode from held inventory. No expected-no-show oversell. |
| Door additions | Offline add can spend only signed event reserve inventory. Beyond reserve requires online Operator authorization and explicit absorb-party settlement line. |
| VIP | Package availability is minimum of referenced components and reserves atomically. M&G is artist-capacity/assigned-slot; default nontransferable unless every component and artist policy permit. |
| RSVP | One verified person/head/admission, self-releasable, scannable or eye-check. Venue optional when explicit location/capacity owner exists. Conversion to paid honors existing RSVPs as comp allocation by default. |
| Wallet | Live projection, not issuance snapshot; wallet first, print fallback, identity-light claim links and no marketing. External-platform tickets appear only as external links/cards, never platform scannable passes. |

## Features

- **19.01 Ticket Configuration, Scaling & Allocations** — [ideation source](../ideation/19-ticketing-box-office/19.01-ticket-config-scaling-allocations/19.01-ticket-config-scaling-allocations-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.02 On-Sale, Announce & Presale Access** — [ideation source](../ideation/19-ticketing-box-office/19.02-on-sale-announce-presale/19.02-on-sale-announce-presale-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.03 Guest List & Comps** — [ideation source](../ideation/19-ticketing-box-office/19.03-guest-list-comps/19.03-guest-list-comps-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.08 VIP Packages & Meet-and-Greet** — [ideation source](../ideation/19-ticketing-box-office/19.08-vip-packages-meet-and-greet/19.08-vip-packages-meet-and-greet-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.11 RSVP & Free/Private Event Admission** — [ideation source](../ideation/19-ticketing-box-office/19.11-rsvp-free-private-event-admission.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **19.12 Ticket Delivery & Fan Ticket Wallet** — [ideation source](../ideation/19-ticketing-box-office/19.12-ticket-delivery-fan-wallet.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-35.01 — Configure scaling:** Given Show/room config/currency and authority valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Configure scaling, and (6) return Ticket types, shared variants, tiers and limits version; if the flow cannot complete, Capacity/currency/fee inconsistency rejects.
- **AC-35.02 — Lock manifest:** Given Scaling, blocks, holds/kills and accessible stock valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Lock manifest, and (6) return Locked sellable/held/protected inventory version; if the flow cannot complete, On-sale cannot schedule partially locked manifest.
- **AC-35.03 — Configure fees:** Given Settlement authority; all fee lines defined, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Configure fees, and (6) return Exact all-in calculation/version publishes; if the flow cannot complete, Mid-sale increase blocked; parity violation rejects.
- **AC-35.04 — Schedule announce/on-sale:** Given Shard-30 authorization and locked manifest, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Schedule announce/on-sale, and (6) return Venue-local wall time plus resolved UTC jobs save; if the flow cannot complete, DST gap rejects; stale edit conflicts.
- **AC-35.05 — Configure presale:** Given Window, allocation, eligibility/code policy valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Configure presale, and (6) return Real source-pool allocation reserves; if the flow cannot complete, Overlapping inventory rejects.
- **AC-35.06 — Issue/redeem code:** Given Fan/window/code state and pool current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Issue/redeem code, and (6) return Eligibility/use count and cart source atomically reserve; if the flow cannot complete, Invalid code and exhausted allocation remain distinct.
- **AC-35.07 — Enter queue:** Given Queue-enabled sale and fan eligible, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Enter queue, and (6) return Randomized neutral position with reconnect token; if the flow cannot complete, No role priority or duplicate positions.
- **AC-35.08 — Create cart:** Given Inventory/source pool and price version current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create cart, and (6) return Units and exact price hold atomically; if the flow cannot complete, Tier may advance; cart price stays fixed.
- **AC-35.09 — Complete checkout:** Given Hold, fan/order/payee and payment valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Complete checkout, and (6) return Payment/order/tickets commit or compensate idempotently; if the flow cannot complete, Ambiguous payment keeps bounded reconcile state; no oversell.
- **AC-35.10 — Join waitlist:** Given Sold-out/exhausted pool; demand terms supplied, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Join waitlist, and (6) return Private entry with all/partial preference and consent; if the flow cannot complete, Position never disclosed.
- **AC-35.11 — Claim returned inventory:** Given Offer/code active and units returned, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Claim returned inventory, and (6) return Requested permitted quantity enters cart; if the flow cannot complete, Expiry/lapse advances batch without public release.
- **AC-35.12 — Create/raise guest allocation:** Given Entitled party/funder, deadline and manifest headroom, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create/raise guest allocation, and (6) return Matching held units reserve atomically; if the flow cannot complete, Cannot lower below spend.
- **AC-35.13 — Submit guest/+1:** Given Allocation and deadline valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Submit guest/+1, and (6) return One ticket/barcode per head moves held→comp; if the flow cannot complete, Partial +1 spend disallowed; duplicate warns.
- **AC-35.14 — Add door guest:** Given Door role or online Operator; reserve/headroom known, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Add door guest, and (6) return Reserve-backed comp or attributed over-allocation line issues; if the flow cannot complete, Offline beyond reserve refuses safely.
- **AC-35.15 — Compose VIP access package:** Given Artist approval and component inventories current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Compose VIP access package, and (6) return Per-variant availability/binding constraint saves; if the flow cannot complete, Missing physical fulfillment keeps component disabled.
- **AC-35.16 — Purchase VIP package:** Given Every component/slot available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Purchase VIP package, and (6) return All components reserve/issue atomically; if the flow cannot complete, Any component failure releases all.
- **AC-35.17 — Redeem M&G/VIP:** Given Valid package, assigned slot/current roster, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Redeem M&G/VIP, and (6) return Fulfillment states update in one fan package view; if the flow cannot complete, Miss/cancel uses component fault policy.
- **AC-35.18 — RSVP/free admit:** Given Event cap/owner and verified fan valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) RSVP/free admit, and (6) return One admission/head issues without payment surfaces; if the flow cannot complete, Duplicate is idempotent; self-release returns unit.
- **AC-35.19 — Convert free event to paid:** Given RSVP/manifest and explicit conversion approved, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Convert free event to paid, and (6) return Existing RSVPs become comp allocation; remaining units sellable; if the flow cannot complete, Cannot strand or charge existing holder silently.
- **AC-35.20 — Deliver/update ticket:** Given Issuance/change and delivery routes available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Deliver/update ticket, and (6) return Live wallet projection plus fallbacks update; if the flow cannot complete, Delivery failure alerts Operator.
- **AC-35.21 — Claim transferred ticket:** Given Signed single-use link and ticket state valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Claim transferred ticket, and (6) return Recipient receives same deterministic ticket identity; if the flow cannot complete, Account creation optional; replay fails.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 35.01 | Configure scaling | Show/room config/currency and authority valid | Ticket types, shared variants, tiers and limits version | Capacity/currency/fee inconsistency rejects |
| 35.02 | Lock manifest | Scaling, blocks, holds/kills and accessible stock valid | Locked sellable/held/protected inventory version | On-sale cannot schedule partially locked manifest |
| 35.03 | Configure fees | Settlement authority; all fee lines defined | Exact all-in calculation/version publishes | Mid-sale increase blocked; parity violation rejects |
| 35.04 | Schedule announce/on-sale | Shard-30 authorization and locked manifest | Venue-local wall time plus resolved UTC jobs save | DST gap rejects; stale edit conflicts |
| 35.05 | Configure presale | Window, allocation, eligibility/code policy valid | Real source-pool allocation reserves | Overlapping inventory rejects |
| 35.06 | Issue/redeem code | Fan/window/code state and pool current | Eligibility/use count and cart source atomically reserve | Invalid code and exhausted allocation remain distinct |
| 35.07 | Enter queue | Queue-enabled sale and fan eligible | Randomized neutral position with reconnect token | No role priority or duplicate positions |
| 35.08 | Create cart | Inventory/source pool and price version current | Units and exact price hold atomically | Tier may advance; cart price stays fixed |
| 35.09 | Complete checkout | Hold, fan/order/payee and payment valid | Payment/order/tickets commit or compensate idempotently | Ambiguous payment keeps bounded reconcile state; no oversell |
| 35.10 | Join waitlist | Sold-out/exhausted pool; demand terms supplied | Private entry with all/partial preference and consent | Position never disclosed |
| 35.11 | Claim returned inventory | Offer/code active and units returned | Requested permitted quantity enters cart | Expiry/lapse advances batch without public release |
| 35.12 | Create/raise guest allocation | Entitled party/funder, deadline and manifest headroom | Matching held units reserve atomically | Cannot lower below spend |
| 35.13 | Submit guest/+1 | Allocation and deadline valid | One ticket/barcode per head moves held→comp | Partial +1 spend disallowed; duplicate warns |
| 35.14 | Add door guest | Door role or online Operator; reserve/headroom known | Reserve-backed comp or attributed over-allocation line issues | Offline beyond reserve refuses safely |
| 35.15 | Compose VIP access package | Artist approval and component inventories current | Per-variant availability/binding constraint saves | Missing physical fulfillment keeps component disabled |
| 35.16 | Purchase VIP package | Every component/slot available | All components reserve/issue atomically | Any component failure releases all |
| 35.17 | Redeem M&G/VIP | Valid package, assigned slot/current roster | Fulfillment states update in one fan package view | Miss/cancel uses component fault policy |
| 35.18 | RSVP/free admit | Event cap/owner and verified fan valid | One admission/head issues without payment surfaces | Duplicate is idempotent; self-release returns unit |
| 35.19 | Convert free event to paid | RSVP/manifest and explicit conversion approved | Existing RSVPs become comp allocation; remaining units sellable | Cannot strand or charge existing holder silently |
| 35.20 | Deliver/update ticket | Issuance/change and delivery routes available | Live wallet projection plus fallbacks update | Delivery failure alerts Operator |
| 35.21 | Claim transferred ticket | Signed single-use link and ticket state valid | Recipient receives same deterministic ticket identity | Account creation optional; replay fails |

## Contracts

| Command | Required input | Output | Explicit errors |
|---|---|---|---|
| `VersionTicketScaling` | show/config/currency, ticket types/tiers, expected version | scaling version | `CAPACITY_EXCEEDED`, `CURRENCY_MISMATCH`, `TIER_INVALID` |
| `LockManifest` | capacity source, blocks/holds/kills/protected inventory | manifest version | `MANIFEST_UNBALANCED`, `ACCESSIBLE_PARITY_FAILED`, `HOLD_DEADLINE_MISSING` |
| `ScheduleOnSale` | announce authorization, manifest, local datetimes/timezone | schedule/jobs | `MANIFEST_UNLOCKED`, `DST_NONEXISTENT`, `STALE_VERSION` |
| `ReserveCart` | fan/session, source pool, units, price version, idempotency key | cart/expiry | `INVENTORY_UNAVAILABLE`, `LIMIT_EXCEEDED`, `PRICE_VERSION_STALE` |
| `CommitTicketOrder` | cart, all-in total, payment result, payee, holder | order/tickets | `HOLD_EXPIRED`, `PAYMENT_AMBIGUOUS`, `TOTAL_MISMATCH`, `PAYEE_INELIGIBLE` |
| `IssueComp` | allocation, guest identities, units, price-level refs | comp tickets | `ALLOCATION_EXHAUSTED`, `DEADLINE_PASSED`, `DUPLICATE_GUEST` |
| `AuthorizeDoorAdd` | event, reserve/over-allocation, authorizer, absorb party, reason | ticket/statement line | `RESERVE_EXHAUSTED`, `ONLINE_AUTH_REQUIRED`, `ABSORB_PARTY_REQUIRED` |
| `ComposeAccessPackage` | component refs/variants, artist approval, policies | package version | `COMPONENT_UNAVAILABLE`, `ARTIST_APPROVAL_REQUIRED` |
| `IssueRSVP` | event/capacity owner, fan, admission source | admission | `CAP_REACHED`, `FAN_REQUIRED`, `ALREADY_ISSUED` |
| `ProjectTicketPass` | ticket/show states, recipient channel/version | pass/artifact state | `TICKET_VOID`, `DELIVERY_UNAVAILABLE`, `CLAIM_LINK_REPLAYED` |

- Manifest/order/issuance commands use stable idempotency keys and serializable unit claims.
- Shard 30 owns deal/announce authority; Shard 35 owns fan-facing product/schedule execution.
- Payment is single-payee and server-reconciled; B3-disabled split/escrow behavior is absent.
- Fan PII, code secrets and ticket credentials never enter public/events beyond opaque refs.

## Data Models

| Aggregate | Key invariants |
|---|---|
| `TicketScalingVersion` | Show/config/currency, ticket types/shared variants, tiers/triggers and price-guarantee policy |
| `Manifest` | Capacity source, sellable/protected/held/killed/comp/sold/cart units and locked version |
| `InventoryBlock` | Section/seat/GA pool, price level, accessibility/comp posture and source |
| `FeeProfileVersion` | Ticket/order fee lines, recipient, tax posture, rounding and exact all-in projection |
| `OnSaleSchedule` | Venue-local/UTC announce/public/presale windows, embargo and job states |
| `AccessCode` | Window/policy, unique/shared secret hash, identity binding, use count and state |
| `QueuePosition` | Sale/fan/session, randomized rank token, reconnect/expiry and state |
| `TicketCart` | Source pools, units, quoted total/version, tier reservations, expiry and payment state |
| `WaitlistEntry` | Pool, quantity/all-partial choice, consent, offer/cooldown and private order key |
| `GuestAllocation` | Party/funder, hold units, spend, deadline, source clause and authority |
| `TicketOrder` | Buyer/holder/payee, exact all-in total, payment and issued ticket refs |
| `Ticket` | Deterministic identity, show/unit/type, holder, barcode credential, state and delivery |
| `AccessPackage` | Referenced components/variants, computed availability, artist approval and transfer/fault policies |
| `RSVPAdmission` | Event/capacity owner, fan/head, source, state and optional comp-conversion ref |
| `TicketPassProjection` | Ticket/show current state, logistics, channel artifact/version and delivery health |

- Manifest invariant: licensed configured capacity equals all mutually exclusive unit states plus explicitly unassigned units.
- Accessible inventory cannot auto-release/kill without equivalent replacement.
- Cart/ticket/pass identities are deterministic and one active barcode credential exists per ticket epoch.
- All TTLs, queue/reconnect windows, waitlist batches, limits, reserve floors and retry schedules use versioned settings.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Key invariants.
- **`TicketScalingVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Show/config/currency, ticket types/shared variants, tiers/triggers and price-guarantee policy.
- **`Manifest`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Capacity source, sellable/protected/held/killed/comp/sold/cart units and locked version.
- **`InventoryBlock`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Section/seat/GA pool, price level, accessibility/comp posture and source.
- **`FeeProfileVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Ticket/order fee lines, recipient, tax posture, rounding and exact all-in projection.
- **`OnSaleSchedule`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Venue-local/UTC announce/public/presale windows, embargo and job states.
- **`AccessCode`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Window/policy, unique/shared secret hash, identity binding, use count and state.
- **`QueuePosition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Sale/fan/session, randomized rank token, reconnect/expiry and state.
- **`TicketCart`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source pools, units, quoted total/version, tier reservations, expiry and payment state.
- **`WaitlistEntry`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Pool, quantity/all-partial choice, consent, offer/cooldown and private order key.
- **`GuestAllocation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party/funder, hold units, spend, deadline, source clause and authority.
- **`TicketOrder`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Buyer/holder/payee, exact all-in total, payment and issued ticket refs.
- **`Ticket`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Deterministic identity, show/unit/type, holder, barcode credential, state and delivery.
- **`AccessPackage`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Referenced components/variants, computed availability, artist approval and transfer/fault policies.
- **`RSVPAdmission`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Event/capacity owner, fan/head, source, state and optional comp-conversion ref.
- **`TicketPassProjection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Ticket/show current state, logistics, channel artifact/version and delivery health.

## Access Control

| Actor | Allowed | Denied |
|---|---|---|
| Fan/holder | Browse eligible products, queue/cart/buy, own wallet, waitlist, RSVP, transfer claim | Hidden windows, other fans/orders/codes, manifest internals |
| Artist/Musician | Own deal-derived guest allocation, approve named VIP package/M&G capacity | Global manifest/fee/schedule config unless separately authorized |
| Operator/box office | Configure show inventory/on-sale/fees, guest funders, resolve delivery | Artist-only allocation spend beyond role; disability proof collection |
| Door staff | Scan/eye-check, reserve-backed comp add and current credential lookup | Fee/manifest reconfiguration or over-allocation authorization |
| Settlement/finance role | Fee recipient/tax/payee config and refunds/reconciliation | Guest identity/door operations beyond need |
| System worker | Schedule jobs, queue, expire/restore units, deliver/update passes | Queue priority, accessible release, hidden repricing or involuntary unwind |

- One person with multiple roles receives union only within authorized show scope; every action records acting role.
- Code secrets, wallet claim links and barcodes are hashed/rotated and least-privilege.
- Accessible purchase receives ordinary process with no additional identity/medical data.

### Access Escalation

- **Fan/holder:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Artist/Musician:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Operator/box office:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Door staff:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Settlement/finance role:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Accessible inventory is discoverable/purchasable through ordinary flow at identical time/friction and companion fee parity.
- Seat/section selection has list/table alternative; GA/reserved/mixed states do not rely on map/color.
- Queue provides position-state/reconnect/estimated range without inaccessible animation or role priority.
- All-in price and fee breakdown appear before commitment and remain stable at 200% zoom.
- Wallet/print/email each include readable status, event changes and non-QR door fallback.
- M&G assigned slot and RSVP cap/release actions are screen-reader/keyboard operable.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `ticketing.manifest.versioned` | show/version, capacity/source/state counts | checkout, box office |
| `ticketing.schedule.changed` | show, local/UTC times, window/job states | discovery, notifications |
| `ticketing.cart.changed` | cart/source pools, units, price/expiry/payment state | checkout, inventory |
| `ticketing.order.changed` | order, total/currency, ticket refs, payment state | finance, delivery |
| `ticketing.waitlist.offer_changed` | pool/entry/offer, quantity/expiry/state | notifications |
| `ticketing.comp.changed` | allocation/funder, held/comp delta, ticket refs | manifest, settlement |
| `ticketing.package.changed` | package/component refs, state/binding constraint | fulfillment, fan view |
| `ticketing.admission.changed` | ticket/RSVP, holder/source/state/epoch | delivery, door |
| `ticketing.delivery.changed` | ticket/channel, artifact/version/health | Operator, fan |

Events carry opaque refs, not code/barcode/claim secrets, guest contact data or disability information. Consumers dedupe/order by aggregate version.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Price tier advances with active carts | New carts use new tier; held carts retain exact quote |
| Price decreases after purchases | Preview affected buyers and execute frozen guarantee policy |
| Payment result arrives after cart expiry | Reconcile reserved payment state before releasing; compensate/refund without oversell |
| Code valid but allocation exhausted | Say allocation exhausted, not invalid code/sold out |
| Queue reconnect after signal loss | Restore within configured grace from signed token; no duplicate position |
| Waitlist asks four, two return | Apply fan's all/partial preference |
| Guest deadline passes | Unspent held units return automatically and notifications append |
| Offline door add with no reserve | Refuse add and require online Operator; capacity safety wins |
| Accessible seat production change | Equivalent-or-better replacement/holder remediation before change |
| M&G cancelled, show continues | Refund/remedy M&G component under fault policy; ticket remains valid |
| Transferred package has nontransferable M&G | Package transfer blocked or component policy explicitly separates before action |
| Free event becomes paid | Existing RSVPs remain valid comps and reduce sellable inventory |
| Wallet pass voided/refunded/transferred | Front visibly changes and prior barcode epoch invalidates |
| External platform ticket | Show card links provider; no WeJammin ticket/pass/barcode claim |
| Scheduled outage during on-sale | Durable jobs/queue fail closed; no partial charge or oversell; reconcile before resume |

## Surface Applicability

Responsive web/PWA is the sole launch surface. Wallet/print tickets and door lookup support offline use, but cart, payment, issuance, transfer, manifest changes and online over-allocation require authoritative server confirmation. Normal-web reads target p95 ≤2 seconds; ticket delivery and scheduled jobs operate continuously except scheduled outages.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 35.01 Configure scaling | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.02 Lock manifest | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.03 Configure fees | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.04 Schedule announce/on-sale | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.05 Configure presale | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.06 Issue/redeem code | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.07 Enter queue | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.08 Create cart | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.09 Complete checkout | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.10 Join waitlist | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.11 Claim returned inventory | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.12 Create/raise guest allocation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.13 Submit guest/+1 | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.14 Add door guest | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.15 Compose VIP access package | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.16 Purchase VIP package | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.17 Redeem M&G/VIP | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.18 RSVP/free admit | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.19 Convert free event to paid | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.20 Deliver/update ticket | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 35.21 Claim transferred ticket | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/06-trust-safety|Shard 06]], [[specs/ia/29-venues-spaces|Shard 29]], [[specs/ia/30-booking-contracts|Shard 30]]
- **Depended on by:** [[specs/ia/36-box-office-risk|Shard 36]], [[specs/ia/37-fanbase-direct-to-fan|Shard 37]], [[specs/ia/38-promotion-marketing|Shard 38]], [[specs/ia/39-analytics-ingestion-reporting|Shard 39]]


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 29:** consume [Shard 29 Contracts](29-venues-spaces.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 29 Event Schemas](29-venues-spaces.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 30:** consume [Shard 30 Contracts](30-booking-contracts.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 30 Event Schemas](30-booking-contracts.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 36:** consume [Shard 36 Contracts](36-box-office-risk.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 36 Event Schemas](36-box-office-risk.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 37:** consume [Shard 37 Contracts](37-fanbase-direct-to-fan.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 37 Event Schemas](37-fanbase-direct-to-fan.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 38:** consume [Shard 38 Contracts](38-promotion-marketing.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 38 Event Schemas](38-promotion-marketing.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 39:** consume [Shard 39 Contracts](39-analytics-ingestion-reporting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 39 Event Schemas](39-analytics-ingestion-reporting.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Authored and deepened complete IA contract | `/write-architecture-spec` | All |
| 2026-08-05 | A-21 — replaced the two nonexistent consumer shards (`37-ticket-resale-refunds`, `39-fan-discovery`) with the four shards that actually declare an inbound edge from this shard: 36, 37 fanbase, 38 promotion, 39 analytics | `/resolve-ambiguity` | Cross-Shard Dependencies, Cross-Shard Section Contract Map |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]
- [[specs/ia/38-promotion-marketing|Shard 38 — Promotion and marketing]]
- [[specs/ia/39-analytics-ingestion-reporting|Shard 39 — Analytics ingestion, matching and reporting]]
