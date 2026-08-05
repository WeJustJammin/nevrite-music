# Deep Dive 26 — Gear transactions, fulfilment and possession models

**Status:** Complete
**Parent:** [[specs/ia/26-gear-commerce-fulfilment|Shard 26]]

## Overview

This deep dive closes offer force, checkout atomicity, quote/claim separation, concurrent order clocks, remedy precedence, title timing and local-pickup evidence.

## Interactions

### Offer and Checkout Algorithm

1. Offer submission pins listing/price/eligibility versions, item-price amount and expiry policy; delivered-cost context is computed separately.
2. Pending/countered offers never reserve. Acceptance submits the same atomic inventory claim as Buy Now.
3. Winning acceptance voids all other live offers in the unit transaction and creates a checkout obligation; no payment is captured automatically.
4. Cart groups selected intents by shipped gear, platform pickup, off-platform pickup and non-physical domain.
5. Each group resolves current destination/mode eligibility and claims lines before or atomically with payment authorization.
6. Lines that lose or become ineligible are removed before authorization and remain in cart with reasons.
7. Created orders are independent and real; a failed sibling creation cannot leave an undocumented paid “half-order.”

### Freight Quote and Dispatch

1. Catalog/unit/package facts derive freight class; buyer never downgrades it to parcel.
2. Human quote request stores no claim/order/payment. Quote includes destination, service, requirements, coverage and validity.
3. Buyer returning with a ready quote revalidates listing/price/availability and then performs ordinary claim/authorization.
4. Dispatch requires packing-standard acknowledgement/evidence and admitted coverage where policy requires it.
5. Carrier scans append as evidence but do not override contradictory human evidence or fabricate status.
6. Verified delivery—not raw scan—starts inspection and settlement clocks.

### Remedy and Settlement Precedence

1. Disclosure amendment before dispatch holds shipment and offers buyer accept, accept-with-reduction or void.
2. Timely damage filing atomically places settlement/title hold. A concurrent auto-settle loses to the committed filing.
3. Return reason derives entitlement, freight payer and available remedies; UI sequence never changes statutory rights.
4. Buyer refund executes independently from carrier/insurer/seller recovery.
5. Settlement closes money exactly once when delivery/remedy/dispute clocks permit.
6. Ownership transfer intent emits from settled line and retries independently; return/rescission emits compensating intent.
7. Order remains evidentially readable after financial close.

### Pickup Flow

1. Listing selects platform-settled or off-platform settlement explicitly; branches never blur.
2. Adult parties agree public/safe venue and time before exact location is released.
3. Platform-settled branch keeps payment/claim, captures dual confirmation and starts a configurable hidden-defect inspection policy; statutory rights remain.
4. Unilateral confirmation, no-show or condition disagreement holds settlement and routes evidence/reconciliation.
5. Off-platform branch records arrangement only, creates no settled comp/automatic transfer and offers manual registry handshake.

## Contracts

### Clock Contract

Every clock records type, policy version, start, deadline, pause intervals and protected filing. Tunable deadlines include offer checkout, dispatch, amendment response, inspection, return dispatch/receipt and evidence submission. Product code enforces absolute safety bounds; administrators change policy versions, never live historical clocks.

### Money/Title Ordering

`claim → authorization → order → dispatch → verified delivery → remedy window → settlement → ownership event`

- Payment does not equal ownership.
- Delivery does not equal settlement.
- Settlement does not wait for registry availability.
- Refund does not wait for compensating registry append.
- Chargeback without object return does not fabricate return of ownership; title evidence remains contested/factual.

### Freight and Insurance Admission

- Launch route is domestic and provider-supported only.
- Above configured value/category threshold, declared-value cover or logged seller equivalent is mandatory.
- Platform brokers evidence/options and never represents itself as carrier/insurer/customs agent.
- International route requires current tariff/material rules, DDP/DAP policy, CITES determination, provider/counsel approval and refund/duty-reclaim contract before enablement.

## Data Models

### Order State Machine

`created → authorized → awaiting_dispatch → dispatched → delivered → inspection → settled`

Side states include `awaiting_buyer_amendment`, `damage_hold`, `return_authorized`, `return_in_transit`, `returned`, `cancelled`, `refunded`, `post_settlement_claim`. Transitions are line-scoped where remedies differ; financial settlement is terminal but evidence remains appendable.

### Return Payer Matrix

| Reason class | Outbound/return freight | Buyer remedy |
|---|---|---|
| not as described / undisclosed defect | seller-side allocation, subject to law/platform recovery policy | full refund or buyer-elected partial/repair |
| transit damage / misdelivery | logistics/coverage recovery path, never buyer precondition | refund, repair or partial by election/agreement |
| lawful change of mind | buyer unless jurisdiction/published valid policy says otherwise | refund of reversible components |
| buyer-caused diminished condition | buyer return freight plus evidenced diminished-value deduction | refund remainder; never total refusal |

### Custody Liability Snapshot

Every physical handoff pins owner, holder, reason, expected return/delivery, evidence standard, coverage source and loss-allocation policy version. It records agreed responsibility without making WeJammin an insurer or adjudicating legal title.

## Access Control

- Buyer alone elects remedy after seller disclosure amendment.
- Seller cannot settle, release escrow, rewrite address/disclosure snapshots or confirm buyer receipt.
- Support may apply only enumerated exception commands with reason, evidence, dual control above configured value and immutable audit.
- Payment/carrier providers submit scoped facts; they cannot transition unrelated domain state directly.
- Exact addresses and meetup locations release only to authorized order parties at the required stage and expire from routine views after retention needs.
- Buying-party selection requires current control of the organisation; clicking user remains actor in audit.

## Accessibility

- Offer acceptance and pickup branch consequences are concise, adjacent to the action and available before confirmation.
- Grouped checkout presents a heading and subtotal for every order group and explains separate charges/shipments.
- Order state and competing clocks have one plain-language next-action summary.
- Evidence comparison supports sequential text/media review rather than requiring visual side-by-side inspection.
- Maps are optional enhancements; every pickup venue/address flow has text search and instructions.

## Event Schemas

### Race Resolution

| Race | Resolution |
|---|---|
| Offer acceptance vs Buy Now | Single unit arbitration; first committed claim wins |
| Claim vs stale price | Stale version rejects before authorization; lower current price may be re-presented, never silently charged |
| Quote readiness vs sale elsewhere | Quote creates no hold; checkout revalidation may report sold |
| Damage filing vs auto-settlement | Filing transaction wins when timestamp/commit precedes deadline |
| Return refund vs registry reversal | Refund independent; reversal intent retries exactly once |
| Provider duplicate webhook | Inbox/idempotency maps provider event to one state transition |
| Pickup confirmations disagree | Settlement hold and evidence review; no majority/inference |

Events use canonical server timestamps; device offline time is evidence, not transition authority.

## Edge Cases

| Ambiguity | Locked resolution |
|---|---|
| Is accepted offer legally binding? | Operational inventory/checkout obligation; legal enforceability and wording are counsel/policy-gated, with no unauthorized charge |
| Auctions at launch? | No; defer until fixed-price/offer behavior and consumer demand are proven |
| Mixed gear/digital cart? | Shared intent view, separate checkout groups and orders |
| Freight quote holds inventory? | No; quote validity is not an inventory hold |
| International launch? | No; domestic physical routes only |
| DDP or DAP? | Not selected until international gate; no route enables without one explicit policy |
| Who files carrier claim? | Seller/provider claimant under current contract; platform may preserve evidence/deadline but acts as agent only under explicit admitted terms |
| Inspection window length? | Configurable by category/value/pickup mode under versioned policy and statutory minimums; no source-code constant |
| Buyer refund if recovery fails? | Buyer remedy proceeds; platform/seller/coverage allocation follows policy/counsel and never appears as buyer debt |
| Ownership transfer trigger? | Settlement only, exactly once |
| Pickup evidence tier? | Platform-settled dual-confirmed pickup is first-party transaction evidence; off-platform branch is manual attestation only |
| Platform consignee/warehouse? | Never at consumer launch |
| Rentals/layaway/protection plans? | Deferred; no partial launch path |
| Warranty on used gear? | Explicit seller/manufacturer evidence only; platform provides no warranty |

## Dependency References

- [[specs/ia/25-gear-market-catalog|Shard 25]] owns listing truth and inventory claim inputs.
- [[specs/ia/23-gear-provenance-registry|Shard 23]] owns title evidence and transfer chain.
- [[specs/ia/24-gear-holdings-operations|Shard 24]] owns custody and granted selling authority.
- [[specs/ia/14-services-marketplace|Shard 14]] owns repair/inspection service engagements.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [26-gear-commerce-fulfilment § Contracts](../26-gear-commerce-fulfilment.md#contracts) defines commands/queries and [26-gear-commerce-fulfilment § Event Schemas](../26-gear-commerce-fulfilment.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

- 2026-08-02: Deepened offer/checkout authority, freight quote separation, remedy races, settlement/title ordering and pickup branches.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
