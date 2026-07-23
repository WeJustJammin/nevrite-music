# Gear Marketplace (Physical Goods) — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `user-directive` | **Priority**: `core`

## Overview

Multi-vendor buying and selling of new and used instruments and equipment — canonical catalog, condition-graded listings, offers and auctions, multi-vendor checkout, and the brutal physics of moving music gear.

**Why this is a top-level domain**: Explicit owner directive (D-05). Kept apart from digital goods and services because the physics are irreconcilable: qty=1 non-fungible inventory, condition as ~40% of price, freight and CITES and packing standards, physical returns, and a canonical make/model catalog that alone makes a price guide possible. Reverb (~$1B GMV), Sweetwater and eBay's instrument category define it. Collapsing with plugins would force serial registries and licence activation into one schema; collapsing with services would force carrier labels and revision-round counting into one order model. The catalog is the spine — without it the price guide, comps, alerts and facets all degrade to text matching. Boundary adjusted: generic carrier rates/labels/tracking extracted to the new Shipping, Fulfilment & Logistics cross-cut (it also serves D2F merch, tour merch and custodial repair intake); this domain keeps the gear-specific physics — freight and oversize handling, packing standards, CITES, landed cost, and damage claims on a $40k vintage instrument — which are domain content, not shared plumbing.

**Interacting capabilities** (what justifies domain status):

- canonical catalog & taxonomy
- condition-graded listings
- offers/auctions/negotiation
- multi-vendor cart & order
- gear-specific freight & customs
- price guide from comps
- vendor storefront ops

## Breadth Pass Summary (2026-07-16)

28 swept candidates → **13 children**: 10 sub-domains, 3 features, **43 leaf features total**.

| Outcome | Count | Notes |
|---|---|---|
| Classified as sub-domain | 10 | Each has 2+ interacting capabilities |
| Classified as feature (direct child) | 3 | 13.11, 13.12, 13.13 |
| Routed to cross-cuts | 8 | See `gear-marketplace-cx.md` §Cross-Cut Routing |
| Routed to `/create-prd` (not product) | 3 | Concurrency control, comp pipeline, media at scale |
| Deep Think additions (not in the sweep) | 7 | See below |
| Candidates merged or split | 6 | See `gear-marketplace-cx.md` §Candidate Disposition |

**The central Deep Think finding**: the sweep's 28 candidates describe a complete gear marketplace — and **every one of them exists at Reverb today**. Under D-18 (provenance is the wedge; consolidation is the platform), a domain containing only copyable features is pure consolidation with nothing that compounds — the failure mode the problem statement names explicitly. The gear domain's provenance contribution was entirely absent from the sweep. Seven nodes were added; three of them (13.03.06, 13.03.07, 13.06.05) are that contribution, and 13.06.05 is the load-bearing one: **without it, domain 15's ownership chain is populated by self-assertion, which is the reconstruction failure this platform exists to end, reproduced inside it.**

## Children

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Canonical Gear Catalog | sub-domain | [13.01-canonical-gear-catalog/](./13.01-canonical-gear-catalog/) | `[BREADTH]` | 10 hypotheses |
| 02 | Condition, Originality & Disclosure | sub-domain | [13.02-condition-originality-disclosure/](./13.02-condition-originality-disclosure/) | `[BREADTH]` | 8 hypotheses |
| 03 | Listings & Inventory | sub-domain | [13.03-listings-inventory/](./13.03-listings-inventory/) | `[BREADTH]` | 14 hypotheses |
| 04 | Price Discovery & Market Data | sub-domain | [13.04-price-discovery-market-data/](./13.04-price-discovery-market-data/) | `[BREADTH]` | 6 hypotheses |
| 05 | Offers, Auctions & Negotiation | sub-domain | [13.05-offers-auctions-negotiation/](./13.05-offers-auctions-negotiation/) | `[BREADTH]` | 6 hypotheses |
| 06 | Cart, Checkout & Orders | sub-domain | [13.06-cart-checkout-orders/](./13.06-cart-checkout-orders/) | `[BREADTH]` | 10 hypotheses |
| 07 | Gear Logistics & Cross-Border | sub-domain | [13.07-gear-logistics-cross-border/](./13.07-gear-logistics-cross-border/) | `[BREADTH]` | 8 hypotheses |
| 08 | Returns, RMA & Warranty | sub-domain | [13.08-returns-rma-warranty/](./13.08-returns-rma-warranty/) | `[BREADTH]` | 6 hypotheses |
| 09 | Trade-In, Part-Exchange & Consignment | sub-domain | [13.09-tradein-consignment/](./13.09-tradein-consignment/) | `[BREADTH]` | 6 hypotheses |
| 10 | Gear Rental & Backline Hire | sub-domain | [13.10-gear-rental-backline/](./13.10-gear-rental-backline/) | `[BREADTH]` | 6 hypotheses |
| 11 | Local Pickup & Meetup Safety | feature | [13.11-local-pickup-meetup-safety.md](./13.11-local-pickup-meetup-safety.md) | `[SURFACE]` | 2 hypotheses |
| 12 | Gear Seller Storefront & Commerce Policies | feature | [13.12-gear-seller-storefront-policies.md](./13.12-gear-seller-storefront-policies.md) | `[DEEP]` | 2 hypotheses |
| 13 | Authorized Dealer Program & MAP Pricing | feature | [13.13-authorized-dealer-map-pricing.md](./13.13-authorized-dealer-map-pricing.md) | `[SURFACE]` | 2 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

### Deep Think Additions (not in the sweep's candidate list)

| Node | Why it had to exist |
|---|---|
| [13.01.04 Listing↔Model Matching](./13.01-canonical-gear-catalog/13.01.04-listing-model-matching.md) | The sweep had a catalog and a contribution flow with nothing joining a listing to either. Without it the catalog is decorative. |
| [13.02.04 Condition Evidence Pack](./13.02-condition-originality-disclosure/13.02.04-condition-evidence-pack.md) | The sweep had disclosure and damage claims but no baseline between them. **Six independent consumers** across the domain — the most depended-upon node here. |
| [13.03.06 Provenance & Session-History Display](./13.03-listings-inventory/13.03.06-provenance-session-history-display.md) | The one listing feature Reverb structurally cannot build. Requires credit graph + registry + listing simultaneously. |
| [13.03.07 Stolen-Serial Screening](./13.03-listings-inventory/13.03.07-stolen-serial-screening.md) | Domain 15 owns the registry and has no listing flow to gate. The gate must live here. |
| [13.04.03 Valuation Confidence](./13.04-price-discovery-market-data/13.04.03-valuation-confidence-thin-market.md) | The sweep had a price guide with nothing governing when it may speak. Thin markets are permanent, not a cold start. |
| [13.06.05 Ownership Transfer on Settlement](./13.06-cart-checkout-orders/13.06.05-ownership-transfer-on-settlement.md) | **The thesis node.** No swept candidate wrote anything to the registry. |
| [13.09.03 Inspection & Intake Grading](./13.09-tradein-consignment/13.09.03-inspection-intake-grading.md) | The sweep had trade-in and consignment with nothing between "owner describes it" and "dealer offers a number". |

## Role Matrix

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 13.01 Canonical Gear Catalog | ✅ Full (contribute) | ✅ Full (contribute) | ✅ Full (contribute) | 👁️ Read-only |
| 13.02 Condition, Originality & Disclosure | ✅ Full (as seller) | ✅ Full (as seller) | ✅ Full (as seller) | 👁️ Read-only |
| 13.03 Listings & Inventory | ✅ Full | ✅ Full | ✅ Full | ❌ None (no seller side) |
| 13.04 Price Discovery & Market Data | 👁️ Read-only (✅ on own repricing) | 👁️ Read-only (✅ on own) | 👁️ Read-only (✅ on own) | 👁️ Read-only |
| 13.05 Offers, Auctions & Negotiation | ✅ Full (both sides) | ✅ Full (both sides) | ✅ Full (both sides) | 👁️ Read-only (may offer/bid; no seller side) |
| 13.06 Cart, Checkout & Orders | ✅ Full | ✅ Full | ✅ Full | ✅ Full (as buyer) |
| 13.07 Gear Logistics & Cross-Border | ✅ Full (as seller) | ✅ Full (as seller) | ✅ Full (as seller) | 👁️ Read-only (✅ on damage claims as buyer) |
| 13.08 Returns, RMA & Warranty | ✅ Full (both sides) | ✅ Full (both sides) | ✅ Full (both sides) | ✅ Full on returns (statutory) |
| 13.09 Trade-In & Consignment | ✅ Full (as consignor/trader-in) | ✅ Full | ⚙️ Config (as counterparty — **poor fit**) | 👁️ Read-only (trade-in only) |
| 13.10 Gear Rental & Backline Hire | ✅ Full (both sides) | ✅ Full (both sides) | ✅ Full (primary supplier) | 👁️ Read-only (❌ on deposits) |
| 13.11 Local Pickup & Meetup Safety | ✅ Full (both sides) | ✅ Full (both sides) | ✅ Full (both sides) | ✅ Full (as buyer) |
| 13.12 Seller Storefront & Policies | ✅ Full (own) | ✅ Full (own) | ✅ Full (own) | ❌ None |
| 13.13 Authorized Dealer & MAP | 👁️ Read-only | 👁️ Read-only | ⚙️ Config (**poor fit**) | 👁️ Read-only |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
> Personas from [meta/personas.md](../meta/personas.md). Per-role behaviour lives in each feature file's Role Lens.

### ⚠️ The Role Matrix came out thin — `meta/personas.md` Q-01 has triggered

`meta/personas.md` Q-01 asked whether a professional **dealer** is a distinct persona, and said explicitly: *"revisit if the Gear/Digital Role Matrices come out thin during drilling."*

**They did.** Three places in this domain have no persona that fits:

| Node | The gap |
|---|---|
| [13.13 Authorized Dealer & MAP](./13.13-authorized-dealer-map-pricing.md) | Role Lens is **empty**. No persona holds a manufacturer authorisation. |
| [13.09 Trade-In & Consignment](./13.09-tradein-consignment/) | Both features need a dealer counterparty. `Operator` is defined as selling "time and space" — a rehearsal room is not a guitar shop. |
| [13.12 Seller Storefront](./13.12-gear-seller-storefront-policies.md) | The trader-vs-private-seller distinction (DT-02 there) has legal consequences and no persona to hang them on. |

The same gap arrives from a fourth direction as a **compliance** question: [13.08.01 DT-01](./13.08-returns-rma-warranty/13.08.01-returns-refunds.md) finds that a marketplace hosting both private sellers and traders is hosting **two consumer-protection regimes**, and the platform currently cannot tell them apart. This is not a modelling preference — it determines statutory obligations.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Explicit owner directive (D-05). Kept apart from digital goods and services because the physics are irreconcilable: qty=1 non-fungible inventory, condition as ~40% of price, freigh... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **Condition and originality are orthogonal axes**, never merged | A refinished mint '59 Les Paul and an all-original player-grade one cannot share a scale. Merging makes the price guide systematically wrong exactly where the money is. | Breadth pass, 13.02 |
| D-03 | **The listing flow never stalls** — every degradation publishes rather than blocks | Recurring across catalog matching, contribution, grading and disclosure. Two deliberate exceptions: material flaw photos (13.02.02 D-03) and CITES on international (13.07.03 D-02). | Breadth pass, 13.03 D-01 |
| D-04 | **The unit — not the listing, not the order — is the identity anchor** | Reached independently **five times**: relisting (13.03.02 DT-02), bundles (13.03 CX-05), repair history (13.08.02 DT-01), warranty (13.08.03 DT-01), rental condition (13.10 D-02). Flagged for `/create-prd-architecture`. | Breadth pass, converged |
| D-05 | **Settlement writes the ownership chain** — 15 owns the record, 13 owns the event | The gear analogue of capturing splits in the session. Without it, 15's chain is self-asserted, which is the failure D-18 exists to end. | Breadth pass, 13.06.05 |
| D-06 | The domain carries **three inventory regimes**, not one | qty=1 non-fungible sale, counted-stock fungible sale (13.03.03 DT-01), and pooled time-boxed rental (13.10.01 DT-01). D-14's "qty=1" framing is correct about what makes the domain *distinct* but is not complete. | Breadth pass |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs. features?~~ **RESOLVED** — 10 sub-domains, 3 features. | Agent | ✅ this pass |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ **RESOLVED** — 8 routed; see `gear-marketplace-cx.md`. | Agent | ✅ this pass |
| Q-03 | **[OWNER]** **Is there a dealer persona?** The Role Matrix came out thin in three places, and the trader/private-seller distinction has statutory consequences (13.08.01 DT-01). Triggers `meta/personas.md` Q-01 directly. **Still open**: the canonical row is [`vision.md` Q-05](../../vision.md), already re-pointed from the completed `/ideate-validate` to `/create-prd` and explicitly **not** closed by ideation D-71 ("a dealer is a *seller*; the counterparty profiles describe *buyers*"). Narrowed since: the *classification* half is settled by [01.08](../01-identity-profiles-organizations/01.08-trader-status-classification.md) D-01..D-04 (trader status is a party attribute owned by identity, self-declared but not self-determining), so what remains here is solely whether a **fifth persona** is added. | User | `/create-prd` |
| Q-04 | **[OWNER]** **Ratify 13.06.05 D-02**: the ownership chain always records; the owner controls visibility; default private. Opt-in *recording* makes the chain evidentially worthless; always-recording is a values position on problem-statement Q-02 (earned vs. hostile lock-in). Cannot be defaulted by an agent. **Still open at source** — [13.06.05](./13.06-cart-checkout-orders/13.06.05-ownership-transfer-on-settlement.md) Q-01, narrowed to the *always-record* half only (15.04 D-01/D-02 already settle visibility), and per its DT-10 "**D-02 is not ratifiable independently of 15.04's sequencing**". Re-pointed from the completed `/ideate-validate` to the next stage at which an owner ratification can be taken. | User | `/create-prd` |
| Q-05 | **[OWNER]** **Is international physical sale in scope at launch?** Reshapes 13.07 entirely — if yes, CITES is a `must` (most vintage guitars have restricted materials); if no, half of 13.07 defers. **MoSCoW ran and declined to answer it**: [`moscow-ledger.md`](../moscow-ledger.md) places 13.07.02 and 13.07.03 in SHOULD with the rationales "Conditional on domain Q-05 (is international sale in scope at launch?)" and "Becomes a MUST the instant cross-border physical sale is enabled (domain Q-05)". Re-pointed from the expired MoSCoW target; `/plan-phase` will not take it either (D-20 defers only sequencing, and orders by dependency). | User | `/create-prd` |
| Q-06 | **Does money move through the platform on local pickup?** (13.11 Q-01) Determines fee revenue, escrow protection, and whether the ownership chain has a hole at the category's most common transaction shape. | User | `/create-prd` |
| Q-07 | **[OWNER]** **Should rental (13.10) be promoted out of this domain?** Its order model, comp model, ownership model and condition model are all irreconcilable with sale's — the same D-14 logic that separated 13/14/05. Overlaps domain 16 (Operators selling time) and 18 (backline). **Still open**: the source row [13.10 Q-01](./13.10-gear-rental-backline/13.10-gear-rental-backline-index.md) states in terms "**This should not be decided by an agent.**" Context added since: all three 13.10 features sit in **WONT** in [`moscow-ledger.md`](../moscow-ledger.md), which lowers the urgency without settling the placement. Re-pointed from the completed `/ideate-validate`. | User | `/create-prd` |
| Q-08 | ~~**Does the price guide survive MAP, or does MAP survive the price guide?**~~ (13.13 DT-02) **RESOLVED BY SCOPE — the guide survives; the collision does not arise.** MoSCoW placed 13.13 Authorized Dealer Program & MAP Pricing in the **WONT** bucket of [`moscow-ledger.md`](../moscow-ledger.md) ("ROLE LENS IS EMPTY — no persona holds a manufacturer authorisation... DT-01: the cluster presupposes a supply side (Sweetwater/Thomann-shaped businesses) that has no reason..."). With no dealer programme there are no MAP-restricted models, so 13.04.01 publishes comps unconstrained. Reopens only if 13.13 leaves WONT. Mirrored at [13.13 Q-02](./13.13-authorized-dealer-map-pricing.md). | User | ✅ Resolved — `moscow-ledger.md` (13.13 = WONT) |
| Q-09 | **Resolve the custody-liability model once, platform-wide.** Three features hit the identical unowned question — layaway (13.06.03 Q-01), repair custody (13.08.02 Q-01), consignment (13.09.02 DT-02): *an irreplaceable object is held by someone who doesn't own it; if it's destroyed, whose loss is it?* Domain 15 has the custody/ownership vocabulary and nothing is using it. | Agent | `/create-prd-architecture` |
| Q-10 | Can a cart mix gear (13) and digital goods (14)? D-14 separated the domains at schema level and said nothing about the cart. | User | `/create-prd` |
| Q-11 | ~~Should CX-M04 (Atomic Payment ↔ Rights Transfer) be extended to serve gear-marketplace and gear-registry?~~ **RESOLVED — no. The extension is rejected, reversing the breadth pass's recommendation.** Per [13.06.05](./13.06-cart-checkout-orders/13.06.05-ownership-transfer-on-settlement.md) **DT-08**: "❌ REJECTED — **they are categorically different, and the resemblance is a trap.** CX-M04 is **constitutive**... A chattel is not a right. By the time settlement fires, the buyer **already physically has the guitar**... This node **records a fact it observed**; CX-M04 **performs an act**. Extending CX-M04 here would import atomicity guarantees gear cannot honour and would imply the platform can effect title — contradicting 15 D-07." The remaining work is the ledger edit itself, tracked as 13.06.05 Q-03 and 13.06 Q-02, not a reopening of the question. | Agent | ✅ Resolved — `13.06.05` DT-08 |
| Q-12 | Should CX-M31 (Safeguarding & Minor Protection) be extended to serve gear-marketplace? 13.11 puts a possibly-minor Fan in a room with a stranger and cash; CX-M31 does not currently list this domain — `ideation-cx.md`'s Mechanism Registry still shows it serving `01,03,04,06,08,17,20,24`. Reinforced from three further directions since: 13.02.01 E-19 (a safety interstitial on Non-Functioning mains-powered gear sold to a Fan), 13.08.01 (a minor's contract is a different legal object and nothing may condition a refund on capacity they lacked), and 13.03.01 (payout KYC age-gates by accident, and nobody owns that gate). Re-pointed from the completed `/ideate-validate` to `/create-prd-security`, matching `06.02.01` Q-03. | Agent | `/create-prd-security` |
| Q-13 | ~~How do bulk listings satisfy per-unit model binding, grading, disclosure and unit media?~~ **Resolved by DQ-MG-01 (2026-07-21) — and the dilemma was false.** The four axes resolve independently, not as one scalar: **model binding does not relax** (`13.01.04` D-05/D-08, DT-11 — bulk raises the bar); **grading relaxes in a bounded, disclosed way** (`13.02.01` D-11 — seller-set per-upload default, `bulk_defaulted`, reduced comp weight, never an exemption); **disclosure does not relax and admits no substitute** (`13.02.02` D-08, DT-14 — templating prohibited, absence priced not gated); **unit media does not relax but its capture moment moves** to label print (`13.03.01` D-06, DT-09). The bar does not bend; the evidence moment moves; absence is disclosed, never gated. | Owner | ✅ `/ideate-validate`, 2026-07-21 |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-11|D-11]]
