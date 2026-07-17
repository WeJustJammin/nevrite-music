# Gear Marketplace (Physical Goods) — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Gear Marketplace (Physical Goods)](./gear-marketplace-index.md)
> **Status**: [BREADTH] — 13 children classified; intra-domain pairs mapped below.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [13.01 Catalog](./13.01-canonical-gear-catalog/) | [13.04 Price Discovery](./13.04-price-discovery-market-data/) | The model record is the comp-set key — a bad merge silently poisons every price the guide quotes | All (silently) | High | 13.01.01 DT-02; 13.04.01 Edge Cases |
| CX-02 | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | [13.04 Price Discovery](./13.04-price-discovery-market-data/) | Comps bucket on model × condition × originality; collapsing the two axes makes the guide wrong where money is | Fan (most exposed), all | High | 13.04 D-01; 13.02 CX-04 |
| CX-03 | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | [13.08 Returns](./13.08-returns-rma-warranty/) | "Not as described" is adjudicated against the disclosure record and the evidence pack | All | High | 13.08.01 D-02, DT-02 |
| CX-04 | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | [13.07 Logistics](./13.07-gear-logistics-cross-border/) | The evidence pack is the damage claim's baseline; the packing standard is its term | All | High | 13.07.04 D-03; 13.02.04 Cross-Cut Notes |
| CX-05 | [13.03 Listings & Inventory](./13.03-listings-inventory/) | [13.05 Offers & Auctions](./13.05-offers-auctions-negotiation/) | Accepted offers and won auctions are claims identical in force to Buy Now — all must funnel through one arbitration point | Musician, Producer, Fan | High | 13.05 D-01; 13.03.03 CX-01 synthesis Q5 |
| CX-06 | [13.06 Cart & Orders](./13.06-cart-checkout-orders/) | [13.07 Logistics](./13.07-gear-logistics-cross-border/) | A multi-vendor cart is N independent feasibility questions; checkout may legitimately partially fail | All (Fan primary) | High | 13.06.01 DT-01, D-02 |
| CX-07 | [13.05 Auctions](./13.05-offers-auctions-negotiation/13.05.02-auctions-bidding.md) | [13.07 CITES & Freight](./13.07-gear-logistics-cross-border/) | A binding bid from an ineligible bidder is a sale of an undeliverable object — eligibility must gate at **bid time** | Musician, Producer, Fan | High | 13.05.02 DT-01, D-01 |
| CX-08 | [13.06 Cart & Orders](./13.06-cart-checkout-orders/) | [13.03 Listings & Inventory](./13.03-listings-inventory/) | Claims are taken before or atomically with authorisation, never after — a cart is not a claim | All | High | 13.06.01 D-01, D-03; 13.03.03 D-02 |
| CX-09 | [13.11 Local Pickup](./13.11-local-pickup-meetup-safety.md) | [13.06 Cart & Orders](./13.06-cart-checkout-orders/) | Local pickup dissolves escrow, the evidence pack **and** ownership transfer — three mechanisms silently absent | Musician, Fan | High | 13.11 DT-01 |
| CX-10 | [13.09 Trade-In & Consignment](./13.09-tradein-consignment/) | [13.06.05 Ownership Transfer](./13.06-cart-checkout-orders/13.06.05-ownership-transfer-on-settlement.md) | A trade-in is **two** transfers; a consignment is **one**, skipping the consignee entirely | Musician, Producer | High | 13.09.01 DT-01; 13.09.02 D-02 |
| CX-11 | [13.13 Authorized Dealer & MAP](./13.13-authorized-dealer-map-pricing.md) | [13.04 Price Discovery](./13.04-price-discovery-market-data/) | A transparent comp guide publishes the below-MAP prices MAP exists to suppress — possibly mutually exclusive products | Operator (poor fit), all | Medium | 13.13 DT-02 |
| CX-12 | [13.10 Rental](./13.10-gear-rental-backline/) | [13.03 Listings & Inventory](./13.03-listings-inventory/) | Rental reserves a range via CX-M05 scheduling; sale claims a unit via locking. Different problem shapes entirely | Operator, Musician | Medium | 13.10.02 DT-01 |
| CX-13 | [13.12 Storefront Policies](./13.12-gear-seller-storefront-policies.md) | [13.08 Returns](./13.08-returns-rma-warranty/) | Statutory rights override seller policy — and the same "no returns" text is lawful from a private seller and misleading from a trader | Musician, Fan | High | 13.12 DT-02; 13.08.01 DT-01 |

---

## Cross-Cut Details

### CX-01: Catalog ↔ Price Discovery

**Relationship**: The comp set is keyed on the catalog model. Every price the guide quotes, every facet, every alert and every registry unit identity resolves through 13.01. This makes catalog moderation the highest-blast-radius write path in the domain — and its failures are **silent**: nobody sees a bad merge, they see a price guide that is subtly wrong.

**Role scoping**:
- **All personas, silently.** That is the defining property.
- **Musician/Producer/Operator**: can contribute and earn category-scoped moderation rights.
- **Fan**: no contribution access (13.01.02 D-03), and the persona least able to detect a corrupted number.

**Synthesis questions answered**:
1. **Shared state conflict**: Model records are the shared entity; the guide reads, contribution/moderation writes. Merges must be reversible with an audit trail (13.01.02 Edge Cases) — an irreversible merge is unrecoverable corruption of every downstream price.
2. **Trigger chain**: Contribution → provisional → moderation → canonical | merged. A merge re-points every bound listing and recomputes comp buckets, which can flip a bucket across 13.04.03's confidence threshold — a model page that quoted a price yesterday may refuse today.
3. **Permission intersection**: Category-scoped moderator standing gates merges; Fan is excluded entirely.
4. **Notification fan-out**: Contributor notified. Downstream sellers whose comps shifted: open (13.01.04 Q-02).
5. **State transition conflict**: A merge landing mid-checkout re-points the comp set under a live transaction. Low frequency, high confusion.

### CX-02: Condition & Originality ↔ Price Discovery

**Relationship**: The guide buckets on **model × condition × originality** (13.04 D-01). Any downstream consumer that reduces condition and originality to one dimension reintroduces the exact error 13.02 D-01 exists to prevent — and the guide is the most likely place for that to happen, because a single "quality" number is so much easier to bucket on.

**Role scoping**:
- **Fan**: the reason it matters. A merged score reads as authoritative to the persona least able to detect it is nonsense — "Mint" on a refinished '59 Les Paul.
- **Producer**: needs the axes to work in *opposite* directions — a mod raises studio-gear value.
- **Musician (collector context)**: filters on originality independently of grade.

**Synthesis questions answered**:
1. **Shared state conflict**: None — the guide reads both fields. The risk is architectural: a schema that stores one "condition score" makes the error unrecoverable.
2. **Trigger chain**: Grade + originality set at listing → sale → comp enters the bucket. A modified or provenanced unit has **no valid bucket** and the guide must decline (13.04.01 D-03).
3. **Permission intersection**: All four read the guide; three write the axes.
4. **Notification fan-out**: None.
5. **State transition conflict**: None at runtime. **Flagged for `/write-architecture-spec` as an invariant**: condition and originality are separate fields, separately bucketed, never collapsed.

### CX-03: Condition & Originality ↔ Returns

**Relationship**: "Not as described" only means something against a description of record. 13.02.02's structured disclosure is that record; 13.02.04's pack is the evidence. Together they turn the domain's most common dispute from an argument into a comparison — and they protect the honest seller at least as often as the buyer (13.02.02 DT-02, 13.08.01 DT-02).

**Role scoping**:
- **Musician**: as a private seller, may owe fewer statutory obligations than a trader — unresolved (CX-13).
- **Producer**: "not as described" is usually *functional* here, and hardest to evidence.
- **Operator**: runs returns at volume with a real policy, and almost certainly carries full trader obligations.
- **Fan**: statutory rights regardless of what the marketplace prefers.

**Synthesis questions answered**:
1. **Shared state conflict**: The pack is sealed and append-only (13.02.04 D-03). A return's condition assessment writes *arrival* evidence without mutating dispatch evidence.
2. **Trigger chain**: Return opened → pack assembled automatically → adjudication → refund → **ownership reverses by compensating append** (13.06.05 D-03). A return therefore reaches all the way into the provenance chain.
3. **Permission intersection**: Buyer sees the pack for their own order only.
4. **Notification fan-out**: Return → seller; possibly domain 24.
5. **State transition conflict**: A seller editing a disclosure between purchase and dispatch (13.03.02 Q-01, 13.02 CX-02 Q5) — the buyer bought against the old disclosure. Unresolved and shared by three files.

### CX-04: Condition & Originality ↔ Logistics

**Relationship**: The evidence pack was created for damage claims and turned out to serve six consumers. Here it is the baseline: state at dispatch vs. state on arrival. The packing standard (13.07.01 D-02) is the other term — a claim turns on whether the item was packed to spec, which is why the standard has to be specific and evidenced rather than a help article.

**Role scoping**:
- **Musician**: has never shipped a guitar; the standard is education and liability at once.
- **Producer**: ships fragile expensive outboard where "was the transformer already loose" decides everything.
- **Operator**: packs at volume; needs compliance and evidence to be phone-fast at a dock.
- **Fan**: claims against a standard they never read, protected by a mechanism they never see.

**Synthesis questions answered**:
1. **Shared state conflict**: The pack is the shared entity; both disclosure and packing write to it, neither owns it.
2. **Trigger chain**: Label print → standard surfaced → packing evidence → seal → transit → damage → claim reads the pack. Skipping evidence is permitted (13.02.04 D-02) and is the seller's own risk.
3. **Permission intersection**: The seller produces evidence that may be used against them — and far more often defends them.
4. **Notification fan-out**: Claim → seller, carrier, insurer, possibly domain 24.
5. **State transition conflict**: **A claim opened on the last day of the inspection window must suspend auto-settle** (13.06.02 D-02) — and therefore suspend ownership transfer (13.06.05), or the chain records a transfer of a destroyed object. Flagged in 13.07 CX-02 and unresolved.

### CX-05: Listings & Inventory ↔ Offers & Auctions

**Relationship**: Three claim paths — Buy Now, accepted offer, won auction — contend for one qty=1 unit. 13.05 D-01 makes them identical in force; 13.03.03 must arbitrate them through **one point** or the domain oversells. 13.05 D-03 removes one dimension of the problem by forbidding offers and auctions on the same listing.

**Role scoping**:
- **Musician**: loses races on hunted vintage after months of saved searches (13.03.03 D-01).
- **Producer**: loses on rare outboard where the next one may be years away.
- **Fan**: may offer or bid; needs the loss explained in plain language.
- **Operator**: rarely races buyers; their oversell is cross-channel.

**Synthesis questions answered**:
1. **Shared state conflict**: The unit. Arbitration, not merge — exactly one winner.
2. **Trigger chain**: Any claim path → arbitration → reserved → checkout. Reservation expiry re-triggers watchlist alerts to prior losers.
3. **Permission intersection**: Fan may claim (buy/offer/bid) but has no seller side anywhere.
4. **Notification fan-out**: "It's back" on expiry — bounded by watcher count, which on a hyped listing could be large.
5. **State transition conflict**: The domain's core invariant. **Flagged for `/write-architecture-spec`**: all claim paths funnel through one arbitration point.

### CX-06: Cart & Orders ↔ Logistics

**Relationship**: 13.06.01 DT-01's finding: a multi-vendor gear cart is not "N orders with one payment", it is **N independent feasibility questions**. Each line has its own freight class, export legality, region question and possibility of being undeliverable at any price. This is the clearest vindication of D-14 in the domain — digital goods deliver instantly and identically; services don't ship at all.

**Role scoping**:
- **Fan**: full primary access here and nowhere else. A partial failure is exactly the complexity the persona won't tolerate.
- **Musician**: hits the freight cliff unexpectedly.
- **Producer**: landed cost must resolve before commitment.
- **Operator**: oversize freight quoting at volume, from a phone, at a dock.

**Synthesis questions answered**:
1. **Shared state conflict**: The cart holds intent, not claims — so contents can evaporate before checkout, making checkout the only consistency point.
2. **Trigger chain**: Destination → per-item eligibility (CITES first, per 13.07 CX-01) → per-vendor quote → claims → authorisation. **A claim failing after another succeeded has no clean unwind** (13.06.01 Q-01) — the domain's hardest open question, joint with CX-M01's escrow model.
3. **Permission intersection**: All four buy; three sell.
4. **Notification fan-out**: One checkout, N sellers.
5. **State transition conflict**: Freight lines may need a human quote and cannot resolve in a session (13.06.01 Q-03, 13.07.01 Q-02).

### CX-07: Auctions ↔ CITES & Freight

**Relationship**: The domain's sharpest structural defect, and the sweep missed it entirely. A bid is **binding**. Every other marketplace's auction can ignore delivery eligibility because their goods ship anywhere. Ours cannot: a rosewood guitar cannot cross some borders at all, a 7ft piano cannot be freighted to some destinations at any price. **An ineligible auction winner is a binding sale of an undeliverable object.**

**Role scoping**:
- **Musician/Producer**: bid on rare items internationally — exactly where the gate matters.
- **Fan**: may bid, understands none of this, and would be the one holding a won auction for a guitar that can't legally reach them.
- **Operator**: liquidates fleet stock; less exposed as a bidder.

**Synthesis questions answered**:
1. **Shared state conflict**: None — the auction reads eligibility.
2. **Trigger chain**: Bid attempt → eligibility (CITES + freight + region) → accept or reject the bid. Must run at **bid time**, not checkout (13.05.02 D-01).
3. **Permission intersection**: None — eligibility is a property of the bidder's destination, not their role.
4. **Notification fan-out**: An ineligible bidder must be told *why* they cannot bid, not merely blocked.
5. **State transition conflict**: A CITES rule change mid-auction (13.07.03 Q-02) could invalidate accepted bids. Rare; nasty.

### CX-08: Cart & Orders ↔ Listings & Inventory

**Relationship**: Claims must be taken **before or atomically with** authorisation (13.06.01 D-03), never after — charging a buyer for an amp sold 200ms earlier is not fixable by a refund, because they wanted *that* amp. And a cart never claims (13.03.03 D-02), which also rules out "3 people are looking at this" pressure UX, because it wouldn't be true.

**Role scoping**: As CX-05 and CX-06.

**Synthesis questions answered**:
1. **Shared state conflict**: The unit, again — arbitration at the checkout moment.
2. **Trigger chain**: Checkout → claim → authorise → order. Multi-vendor makes this N claims and one payment (CX-06 Q5).
3. **Permission intersection**: None distinct.
4. **Notification fan-out**: Losing buyers → alternatives, ISO (13.05.03), watchlist.
5. **State transition conflict**: A stolen-registry hit between cart and capture — re-screen catches it (13.03.07 D-02).

### CX-09: Local Pickup ↔ Cart & Orders

**Relationship**: 13.11 DT-01's finding, and it is a hole through the middle of the domain. Local pickup dissolves **three** mechanisms at once: escrow has no delivery proof to release against, the evidence pack has no dispatch/arrival baseline, and — worst — **ownership transfer (13.06.05) never fires**, because a cash meetup never settles. The domain's entire provenance contribution is silently skipped on what may be the category's most common transaction shape.

**Role scoping**:
- **Musician**: the persona whose cheap-gear transactions are mostly local, and therefore mostly invisible to the chain.
- **Fan**: buys a first guitar locally, carrying cash, meeting a stranger. The safety exposure (13.11 DT-02) and the chain gap land on the same persona.
- **Producer/Operator**: collect heavy items by choice.

**Synthesis questions answered**:
1. **Shared state conflict**: If money doesn't move through the platform, there is no settlement event and no shared state at all — the platform introduced two people and learned nothing.
2. **Trigger chain**: **Broken by design.** Purchase → meetup → (nothing). 13.06.05 Q-03 asks whether the chain tolerates the gap; this is the answer's cost.
3. **Permission intersection**: n/a.
4. **Notification fan-out**: n/a.
5. **State transition conflict**: The strategic one. The incumbent's local product takes no fee precisely because it can't hold the money — copying it copies a hole through the thesis. **13.11 Q-01 ("does money move through the platform on a local pickup?") is the most consequential open question in the domain.**

### CX-10: Trade-In & Consignment ↔ Ownership Transfer

**Relationship**: Two paths, two structurally different provenance outcomes from the same moment. A trade-in writes **two** transfers (13.09.01 DT-01 — the inbound unit changes owner too, and modelling it as a discount erases it from the chain). A consignment writes **one**, consignor → buyer, with the consignee never appearing as an owner because they never were one (13.09.02 D-02).

**Role scoping**:
- **Musician/Producer**: choose between the paths at one decision point (13.09 CX-03).
- **Operator**: the counterparty on both — and a poor persona fit (domain Q-03).
- **Fan**: may trade in, cannot consign.

**Synthesis questions answered**:
1. **Shared state conflict**: The chain is append-only; both paths append, differently.
2. **Trigger chain**: Trade-in → two appends atomically. Consignment sale → one append skipping the custodian. **A trade-in that doesn't write is a provenance leak at one of the highest-volume transfer points in the category.**
3. **Permission intersection**: The consignee acts *as* the seller without owning — a CX-M09 delegation.
4. **Notification fan-out**: Modest.
5. **State transition conflict**: A trade-in of gear under an outstanding layaway or lien (13.09.01 Edge Cases) — the chain would know, if it's intact.

### CX-11: Authorized Dealer & MAP ↔ Price Discovery

**Relationship**: 13.13 DT-02's collision. MAP suppresses *advertised* prices below a floor. The price guide's entire purpose is publishing what units **actually sold for** — routinely below MAP — drawn from immutable sold listings, in aggregate, permanently, indexed for search. A MAP-compliant platform running a transparent price guide is publishing exactly what MAP exists to suppress. Medium confidence: the collision is certain, but only if the platform ever carries new gear from major brands (13.13 DT-01 doubts it will).

**Role scoping**:
- **Operator**: nominal dealer persona, and a poor fit (domain Q-03).
- **All others**: read-only on both; would experience the outcome as either a gagged guide or absent brands.

**Synthesis questions deferred** — Medium confidence. The strategic question is stated at domain Q-08: which product survives? The guide is far closer to the thesis (transparency, provenance, trust); the dealer program is downstream of supply relationships nobody has and serves a persona that doesn't exist.

### CX-12: Rental ↔ Listings & Inventory

**Relationship**: Both prevent double-allocating a physical unit, and they do it with different mechanisms for different reasons. Sale claims are instantaneous and terminal — one arbitration, unit gone. Rental reserves a **range** that must not overlap another range, held for months, with turnaround buffers and cascading dependencies (13.10.02 DT-01). Rental's reservation has more in common with booking a rehearsal room (domain 16) than with buying an amp.

**Role scoping**:
- **Operator**: runs both, and per the persona doc their calendar *is* the business — which is domain 16's description, not this one's.
- **Musician/Producer**: rent and buy.
- **Fan**: read-only on rental; no deposit access.

**Synthesis questions deferred** — Medium confidence. This is the strongest evidence for domain Q-07 (promote rental): the mechanism rental needs (CX-M05 scheduling) is already built for a different domain, and rental cannot reuse this domain's order model, comp model, ownership model or condition model. Four irreconcilable structures is the D-14 test.

### CX-13: Storefront Policies ↔ Returns

**Relationship**: Statute beats policy (13.12 D-02, 13.08.01 D-04) — but the sharper finding is 13.12 DT-02's: **the same "no returns" text is lawful from a private seller and misleading from a trader**, and the platform renders both identically. Displaying it to a consumer tells them they have no right they in fact have, and most will believe it.

**Role scoping**:
- **Musician**: as a private seller, "no returns" may be honest.
- **Operator**: as a trader, the same words may be a dark pattern.
- **Fan**: the consumer who believes it and doesn't ask.
- **Producer**: either, depending on volume — which is precisely why the line is hard.

**Synthesis questions answered**:
1. **Shared state conflict**: Policy is a storefront default; statutory rights are external and non-negotiable. Where they conflict, the policy is not merely overridden — **it must not be displayed as if valid**.
2. **Trigger chain**: Policy set → inherited by listings → shown pre-purchase → return requested → statute applies regardless.
3. **Permission intersection**: **The platform cannot currently tell a trader from a private seller** — the fourth independent arrival at domain Q-03 (with 13.13, 13.09, and personas.md Q-01).
4. **Notification fan-out**: None.
5. **State transition conflict**: Policy changed after a sale but before dispatch — the order holds its published terms (13.12 D-03).

---

## Cross-Cut Routing — swept candidates that are mechanisms, not nodes

> These were classified as cross-cuts and **no node was created**. Recorded here so the global CX file can absorb them.

| Swept candidate | Routed to | Reasoning |
|---|---|---|
| #17 (part) Vendor onboarding | **CX-M15** Onboarding & Role-Aware Activation | Identical mechanism across gear, digital goods, services, venues. |
| #17 (part) Seller tiers & scorecards | **CX-M08** Reviews, Ratings & Portable Reputation | Measure performance → assign tier → gate privileges is shared; only the *metrics* differ by domain. |
| #17 (part) Carrier rate configuration | **CX-M14** Shipping, Fulfilment & Logistics | Already extracted at D-16; seller rate config is part of it. |
| #19 (part) Bulk CSV/API import | **CX-M29** Bulk Import, Sync & Migration Tooling | Parsing, column mapping, error reporting, resumability are domain-agnostic. **Cross-channel availability sync stays domain-owned** (13.03.04 DT-01) — it exists only because a qty=1 physical unit can be sold in a shop while listed online. |
| #20 (part) Geo & map discovery | **CX-M13** Geo, Location & Map Discovery | Already serves this domain. |
| #25 (part) Watchlists & saved searches | **CX-M28** Follow, Save & Watchlist | Explicitly a polymorphic follow/save mechanism serving 13, 14, 05, 20 and more. |
| #27 (part) Financing & BNPL | **CX-M01** Payments, Escrow & Payouts | A payment method serving every commerce domain. **Layaway stays domain-owned** (13.06.03) — it is an inventory hold on a qty=1 non-fungible unit, which has no analogue in digital goods or services. |
| — Promoted placement / bumping | **CX-M25** Promoted Placement & Advertising | Already serves this domain; no gear-specific residue found. |

### Cross-cut gaps found — the ratified list may be incomplete

| Mechanism | Finding |
|---|---|
| **CX-M04** Atomic Payment ↔ Rights Transfer | Serves rights, services, projects, live-booking, royalties, digital-goods, credits — **not gear-marketplace or gear-registry**, despite 13.06.05 being structurally the same mechanism (money moves, ownership moves, atomically). Likely a gap. Domain Q-11. |
| **CX-M31** Safeguarding & Minor Protection | Serves education, community, ticketing, services, venues, identity, trust-safety — **not gear-marketplace**. 13.11 puts a possibly-minor Fan in a room with a stranger and cash. Domain Q-12. |
| **CX-M11** Real-Time Rooms, Presence & Audio Transport | Does not serve gear-marketplace. 13.05.02 (live auction bid state) may need it — low confidence, and only if auctions survive MoSCoW. |

## Not-Product — routed to `/create-prd`

| Concern | Routed to | Reasoning |
|---|---|---|
| qty=1 reservation & concurrency-control strategy | `/create-prd-architecture` | 13.03.03 owns the **product** answer (who wins, what the loser sees, how the seller is told). The locking/reservation/idempotency mechanics are architecture. |
| Price-guide comp aggregation & materialisation pipeline | `/create-prd-architecture` | 13.04.01 owns what is shown and when it may be shown. Batch vs. streaming, materialised views and recompute-on-merge are architecture. |
| High-resolution listing media storage, transcode & CDN delivery at scale | `/create-prd-stack` | Unit-specific photos, audio and video demos across a marketplace at scale. Already flagged in `meta/constraints.md`: *"File / media storage `[PENDING — /create-prd]` — must account for audio assets at scale."* |

## Candidate Disposition — merges and splits

| # | Swept candidate | Disposition |
|---|---|---|
| 01, 02, 03 | Catalog / Contribution / Serial decoding | **Merged** into sub-domain 13.01 — one spine, three interacting capabilities. |
| 04 | Condition Grading & Mandatory Flaw/Mod Disclosure | **Split** into 13.02.01/02/03 — condition and originality are orthogonal axes (D-02); bundling them was the sweep's most consequential error. |
| 10, 11, 12, 13 | Freight / Customs / CITES / Insurance | **Merged** into sub-domain 13.07 — the gear physics cluster. |
| 15, 16 | Price guide / Repricing | **Merged** into sub-domain 13.04, plus the 13.04.03 addition that governs when either may speak. |
| 17 | Vendor Onboarding, Storefronts, Tiers & Scorecards | **Split three ways**: onboarding → CX-M15, tiers/scorecards → CX-M08, rates → CX-M14; storefront + gear commerce policies → feature 13.12. |
| 19 | Multi-Channel Inventory Sync & Bulk Listing | **Split**: bulk import → CX-M29; cross-channel sync → 13.03.04 (domain-owned). |
| 20 | Local Pickup, Geo Commerce & Meetup Safety | **Split**: geo → CX-M13; pickup + meetup safety → feature 13.11. |
| 25 | Wanted/ISO Reverse Marketplace & Watchlists | **Split**: watchlists → CX-M28; ISO → 13.05.03. |
| 27 | Financing, BNPL & Layaway | **Split**: financing/BNPL → CX-M01; layaway → 13.06.03 (inventory hold on a non-fungible unit). |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 13.01 Catalog | 13.11 Local Pickup | Considered: catalog data could inform a pickup decision (this is a piano, collect it). Rejected — that inference belongs to 13.07.01's freight classification, which already routes to 13.11. A direct edge would duplicate an existing path. |
| R-02 | 13.13 Authorized Dealer & MAP | 13.02 Condition & Originality | Considered: dealer status might affect condition claims' credibility. Rejected — MAP and dealer authorisation govern **new** gear, which has no condition question at all. The two features have no overlap, and that non-overlap is itself a signal that 13.13 sits outside the domain's centre of gravity. |
| R-03 | 13.04 Price Discovery | 13.10 Rental | Considered: rental rates as market data. Rejected — a day rate says nothing about a unit's value (13.10.01 DT-02); mixing rates into comps would corrupt the guide with a different unit of account. |
| R-04 | 13.09 Trade-In & Consignment | 13.05 Offers & Auctions | Considered: a trade-in offer is an offer. Rejected — 13.05's offers are *buyer→seller price proposals on a listing*, with a claim state machine. A trade-in offer is a *dealer's valuation of an inbound unit*, with no listing and no claim. Same word, different object. |
| R-05 | 13.12 Storefront Policies | 13.01 Catalog | Considered: sellers might scope storefronts by catalog category. Rejected — a presentation filter, not an interaction. No shared state, no trigger, no permission intersection. |
| R-06 | 13.03 Listings & Inventory | 13.07 Logistics | Considered as a direct pair: listings need shipping. Rejected — the interaction is mediated entirely by the order (CX-06). A listing declares fulfilment options; logistics executes against an order. No direct edge. |
