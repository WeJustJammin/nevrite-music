# Gear Marketplace (Physical Goods) — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Gear Marketplace (Physical Goods)](./gear-marketplace-index.md)
> **Status**: [DEEP] — 13 children classified; 21 intra-domain pairs mapped and synthesised (Step 6).
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [13.01 Catalog](./13.01-canonical-gear-catalog/) | [13.04 Price Discovery](./13.04-price-discovery-market-data/) | The model record is the comp-set key — a bad merge silently poisons every price the guide quotes, and comp variance is the signal a merge was **wrong** (bidirectional, DT-09) | All (silently) | High | 13.01.01 DT-02, DT-09; 13.04.01 Edge Cases |
| CX-02 | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | [13.04 Price Discovery](./13.04-price-discovery-market-data/) | Comps bucket on model × grade × originality × **definition_version**; collapsing axes or dropping the version silently corrupts the series | Fan (most exposed), all | High | 13.04 D-01; 13.02.01 DT-04/D-07 |
| CX-03 | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | [13.08 Returns](./13.08-returns-rma-warranty/) | "Not as described" is adjudicated against the **pinned disclosure version** and the evidence pack | All | High | 13.08.01 D-02, DT-02; 13.02.02 |
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
| CX-14 | [13.01 Catalog](./13.01-canonical-gear-catalog/) | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | Category drives one **per-category structured-attribute schema** — attribute set, flaw checklist, component set — and the model is the as-shipped baseline the grade measures deviation from (semantic prerequisite) | All (as seller) | High | 13.02.01 DT-01/D-04; 13.02.02 (category→checklist); 13.01.01 |
| CX-15 | [13.01 Catalog](./13.01-canonical-gear-catalog/) | [13.03 Listings & Inventory](./13.03-listings-inventory/) | Listing↔Model Matching (13.01.04) is the bind that joins a listing to the catalog; no match → generic fallback, weakened grade, no compliance derivation; bulk uses (seller, SKU) memoisation | All (as seller) | High | 13.01.04 D-05/D-08; 13.02.02 |
| CX-16 | [13.01 Catalog](./13.01-canonical-gear-catalog/) | [13.07 Logistics](./13.07-gear-logistics-cross-border/) | Model attributes derive compliance: materials → CITES gate, category → tariff class, dims+weight → freight class. A mis-bound listing makes the voltage/CITES warning **underivable** | All | High | 13.01.01 → 13.07.01/02/03; 13.01.04 CX-04 |
| CX-17 | [13.01 Catalog](./13.01-canonical-gear-catalog/) | [13.06 Cart & Orders](./13.06-cart-checkout-orders/) | The model bind is **snapshotted onto the order** at creation; a merge cannot re-point a comp set under an in-flight transaction (the buyer bought the listing, not the model) | All | High | 13.01.04 CX-03 synthesis Q5 / D-10 |
| CX-18 | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | [13.03 Listings & Inventory](./13.03-listings-inventory/) | Grade is **required, no bulk exemption**; relist pre-fills prior disclosure but >90-day items revert to unanswered; grade + flaws save atomically and the **edit** is challenged, never the listing | All (as seller) | High | 13.02.01 E-21/D-11; 13.02.02 DT-06; 13.02.01 E-11/D-09 |
| CX-19 | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | [13.05 Offers & Auctions](./13.05-offers-auctions-negotiation/) | Regrade is **asymmetric in the buyer's favour**: downward regrade / added material flaw auto-voids open offers with reason; upward regrade / removed flaw preserves + notifies | Musician, Producer, Fan | High | 13.02.01 D-10; 13.02.02 (flaw added→void) |
| CX-20 | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | [13.09 Trade-In & Inspection](./13.09-tradein-consignment/) | Same 8 grades / ceilings / definition versions, **opposite epistemics**: a self-grade is a claim by an interested owner; an intake grade is an assessment by an interested receiver | Musician, Producer, Operator | High | 13.09.03 DT-01; 13.02.01 |
| CX-21 | [13.02 Condition & Originality](./13.02-condition-originality-disclosure/) | [13.10 Rental](./13.10-gear-rental-backline/) + [13.08 Repair/Service](./13.08-returns-rma-warranty/) | First-party platform condition records (rental fleet, repair/service history, intake grading) pre-fill the disclosure checklist and surface contradictions — structurally impossible without an owned fleet + repair function | Musician, Producer, Operator | High | 13.02.02 DT-05 (three first-party records for the unit) |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** Cite entries from other files as `gear-marketplace-cx.md#CX-NN`.

---

## Cross-Cut Details

### CX-01: Catalog ↔ Price Discovery

**Relationship**: The comp set is keyed on the catalog model. Every price the guide quotes, every facet, every alert and every registry unit identity resolves through 13.01 — making catalog moderation the highest-blast-radius write path in the domain, and its failures **silent**. Step 6 added the reverse arrow (13.01.01 DT-09): comp variance is diagnostic of the catalog. **Bimodal sold comps on a single model ⇒ probably two models ⇒ a split candidate** the price guide should raise back to catalog moderation. The dependency is bidirectional: 13.04 knows a merge recomputes its comps, but did not know its own variance is the signal the merge was wrong.

**Role scoping**:
- **All personas, silently.** That is the defining property.
- **Musician/Producer/Operator**: can contribute and earn category-scoped moderation rights.
- **Fan**: no contribution access (13.01.02 D-03), and the persona least able to detect a corrupted number.

**Synthesis questions answered**:
1. **Shared state conflict**: Model records are the shared entity; the guide reads, contribution/moderation writes. Merges must be reversible with an audit trail — an irreversible merge is unrecoverable corruption of every downstream price.
2. **Trigger chain**: Contribution → provisional → moderation → canonical | merged. A merge re-points bound listings and recomputes comp buckets, which can flip a bucket across 13.04.03's confidence threshold. **New (DT-09)**: bimodal comps emit a `split-candidate` signal into the moderation queue — async, advisory, never auto-splits.
3. **Permission intersection**: Category-scoped moderator standing gates merges; Fan is excluded.
4. **Notification fan-out**: Contributor notified. Downstream sellers whose comps shifted: open (13.01.04 Q-02).
5. **State transition conflict**: A merge landing mid-checkout re-points the comp set under a live transaction — **resolved by CX-17**: the bind is snapshotted onto the order at creation.

### CX-02: Condition & Originality ↔ Price Discovery

**Relationship**: The guide buckets on **model × grade × originality × definition_version** (13.04 D-01, 13.02.01 DT-04). Step 6 raised two hard requirements from the condition side: (1) `definition_version` MUST be part of the comp key or a copy-edit to a grade definition silently corrupts the entire time series with no symptom; (2) `Condition not itemised` units (bulk-defaulted) and non-arm's-length sales MUST be **excluded** from comp sets, never treated as flaw-free — otherwise the laziest listings poison the guide as if they were clean.

**Role scoping**:
- **Fan**: the reason it matters — a merged/inflated score reads as authoritative to the persona least able to detect nonsense ("Mint" on a refinished '59 Les Paul).
- **Producer**: needs the axes to work in *opposite* directions — a mod raises studio-gear value.
- **Musician (collector context)**: filters on originality independently of grade.

**Synthesis questions answered**:
1. **Shared state conflict**: None at runtime — the guide reads. The risk is architectural: a schema storing one "condition score", or a comp key missing `definition_version`, makes the corruption unrecoverable.
2. **Trigger chain**: Grade + originality + version set at listing → sale → comp enters the bucket **only if itemised and arm's-length**. A modified/provenanced unit has no valid clean bucket and the guide declines (13.04.01 D-03).
3. **Permission intersection**: All four read; three write the axes.
4. **Notification fan-out**: None.
5. **State transition conflict**: A definition-version publication mid-series — **flagged for `/write-architecture-spec` as an invariant**: comps are keyed to the version in force at sale, and re-versioning never retroactively re-buckets a sold comp.

### CX-03: Condition & Originality ↔ Returns

**Relationship**: "Not as described" only means something against a description of record. 13.02.02's structured disclosure is that record; 13.02.04's pack is the evidence; adjudication runs against the **pinned disclosure version** in force at purchase (Step 6: the pin, not the current text, is the baseline). Together they turn the domain's most common dispute from an argument into a comparison — protecting the honest seller at least as often as the buyer (13.02.02 DT-02, 13.08.01 DT-02).

**Role scoping**:
- **Musician**: as a private seller, may owe fewer statutory obligations than a trader — unresolved (CX-13).
- **Producer**: "not as described" is usually *functional*, and hardest to evidence.
- **Operator**: runs returns at volume and almost certainly carries full trader obligations.
- **Fan**: statutory rights regardless of marketplace preference.

**Synthesis questions answered**:
1. **Shared state conflict**: The pack is sealed and append-only (13.02.04 D-03). A return's arrival assessment appends without mutating dispatch evidence.
2. **Trigger chain**: Return opened → pack assembled → adjudicated against pinned version → refund → **ownership reverses by compensating append** (13.06.05). A return reaches into the provenance chain.
3. **Permission intersection**: Buyer sees the pack for their own order only. Trader vs private seller changes statutory duties and the platform cannot yet tell them apart (domain Q-03).
4. **Notification fan-out**: Return → seller; integrity signals (seller evidence contradicts own affirmation) → domain 24; the honest private seller who didn't know is **not** an integrity signal (13.08.01 DT-07 — narrow the fan-out).
5. **State transition conflict**: A seller editing a disclosure between purchase and dispatch — the buyer bought against the old version; the pin protects them.

### CX-04: Condition & Originality ↔ Logistics

**Relationship**: The evidence pack, built for damage claims, serves six consumers. Here it is the baseline: state at dispatch vs. state on arrival. The packing standard (13.07.01 D-02) is the other term — a claim turns on whether the item was packed to spec, so the standard is specific and evidenced, not a help article.

**Role scoping**:
- **Musician**: has never shipped a guitar; the standard is education and liability at once.
- **Producer**: ships fragile outboard where "was the transformer already loose" decides everything.
- **Operator**: packs at volume; needs compliance and evidence phone-fast at a dock.
- **Fan**: claims against a standard they never read, protected by a mechanism they never see.

**Synthesis questions answered**:
1. **Shared state conflict**: The pack is the shared entity; disclosure and packing both write, neither owns.
2. **Trigger chain**: Label print → standard surfaced → packing evidence → seal → transit → damage → claim reads the pack. Skipping evidence is permitted (13.02.04 D-02) at the seller's own risk.
3. **Permission intersection**: The seller produces evidence usable against them — and far more often defending them.
4. **Notification fan-out**: Claim → seller, carrier, insurer, possibly domain 24.
5. **State transition conflict**: **A claim opened on the last inspection day must suspend auto-settle** (13.06.02 D-02) and therefore ownership transfer (13.06.05), or the chain records a transfer of a destroyed object.

### CX-05: Listings & Inventory ↔ Offers & Auctions

**Relationship**: Three claim paths — Buy Now, accepted offer, won auction — contend for one qty=1 unit. 13.05 D-01 makes them identical in force; 13.03.03 must arbitrate them through **one point** or the domain oversells. 13.05 D-03 removes one dimension by forbidding offers and auctions on the same listing.

**Role scoping**:
- **Musician**: loses races on hunted vintage after months of saved searches.
- **Producer**: loses on rare outboard where the next may be years away.
- **Fan**: may offer or bid; needs the loss explained plainly.
- **Operator**: rarely races buyers; their oversell is cross-channel.

**Synthesis questions answered**:
1. **Shared state conflict**: The unit. Arbitration, not merge — exactly one winner.
2. **Trigger chain**: Any claim path → arbitration → reserved → checkout. Reservation expiry re-triggers watchlist alerts to prior losers.
3. **Permission intersection**: Fan may claim but has no seller side anywhere.
4. **Notification fan-out**: "It's back" on expiry — bounded by watcher count.
5. **State transition conflict**: The domain's core invariant. **Flagged for `/write-architecture-spec`**: all claim paths funnel through one arbitration point.

### CX-06: Cart & Orders ↔ Logistics

**Relationship**: 13.06.01 DT-01: a multi-vendor gear cart is **N independent feasibility questions**, not "N orders with one payment". Each line has its own freight class, export legality, region question, and possibility of being undeliverable at any price — the clearest vindication of D-14 in the domain.

**Role scoping**:
- **Fan**: full primary access here and nowhere else; partial failure is exactly the complexity the persona won't tolerate.
- **Musician**: hits the freight cliff unexpectedly.
- **Producer**: landed cost must resolve before commitment.
- **Operator**: oversize freight quoting at volume, from a phone, at a dock.

**Synthesis questions answered**:
1. **Shared state conflict**: The cart holds intent, not claims — contents can evaporate before checkout, making checkout the only consistency point.
2. **Trigger chain**: Destination → per-item eligibility (CITES first) → per-vendor quote → claims → authorisation. **A claim failing after another succeeded has no clean unwind** (13.06.01 Q-01).
3. **Permission intersection**: All four buy; three sell.
4. **Notification fan-out**: One checkout, N sellers.
5. **State transition conflict**: Freight lines may need a human quote and cannot resolve in a session (13.06.01 Q-03).

### CX-07: Auctions ↔ CITES & Freight

**Relationship**: A bid is **binding**. Other marketplaces' auctions ignore delivery eligibility because their goods ship anywhere; ours cannot — a rosewood guitar cannot cross some borders, a 7ft piano cannot be freighted to some destinations at any price. **An ineligible auction winner is a binding sale of an undeliverable object.**

**Role scoping**:
- **Musician/Producer**: bid on rare items internationally — exactly where the gate matters.
- **Fan**: may bid, understands none of this, would hold the won-but-undeliverable auction.
- **Operator**: liquidates fleet stock; less exposed as a bidder.

**Synthesis questions answered**:
1. **Shared state conflict**: None — the auction reads eligibility.
2. **Trigger chain**: Bid attempt → eligibility (CITES + freight + region) → accept/reject the bid at **bid time** (13.05.02 D-01).
3. **Permission intersection**: None — eligibility is a property of the bidder's destination, not their role.
4. **Notification fan-out**: An ineligible bidder must be told *why*.
5. **State transition conflict**: A CITES rule change mid-auction (13.07.03 Q-02) could invalidate accepted bids. Rare; nasty.

### CX-08: Cart & Orders ↔ Listings & Inventory

**Relationship**: Claims must be taken **before or atomically with** authorisation (13.06.01 D-03), never after — charging for an amp sold 200ms earlier is not fixable by a refund; they wanted *that* amp. A cart never claims (13.03.03 D-02), ruling out "3 people are looking at this" pressure UX because it wouldn't be true.

**Role scoping**: As CX-05 and CX-06.

**Synthesis questions answered**:
1. **Shared state conflict**: The unit — arbitration at the checkout moment.
2. **Trigger chain**: Checkout → claim → authorise → order. Multi-vendor makes this N claims, one payment.
3. **Permission intersection**: None distinct.
4. **Notification fan-out**: Losing buyers → alternatives, ISO (13.05.03), watchlist.
5. **State transition conflict**: A stolen-registry hit between cart and capture — re-screen at capture catches it (13.03.07 D-02).

### CX-09: Local Pickup ↔ Cart & Orders

**Relationship**: 13.11 DT-01 — a hole through the middle of the domain. Local pickup dissolves **three** mechanisms: escrow has no delivery proof to release against, the evidence pack has no dispatch/arrival baseline, and **ownership transfer (13.06.05) never fires** because a cash meetup never settles. The domain's entire provenance contribution is silently skipped on what may be the category's most common transaction shape.

**Role scoping**:
- **Musician**: cheap-gear transactions are mostly local, therefore mostly invisible to the chain.
- **Fan**: buys a first guitar locally, carrying cash, meeting a stranger — safety exposure (13.11 DT-02) and the chain gap land on the same persona.
- **Producer/Operator**: collect heavy items by choice.

**Synthesis questions answered**:
1. **Shared state conflict**: If money doesn't move through the platform, there is no settlement event and no shared state — the platform introduced two people and learned nothing.
2. **Trigger chain**: **Broken by design.** Purchase → meetup → (nothing).
3. **Permission intersection**: n/a.
4. **Notification fan-out**: n/a.
5. **State transition conflict**: The strategic one. **13.11 Q-01 ("does money move through the platform on local pickup?") is the most consequential open question in the domain** — copying the incumbent's fee-free local product copies a hole through the thesis.

### CX-10: Trade-In & Consignment ↔ Ownership Transfer

**Relationship**: Two paths, two structurally different provenance outcomes. A trade-in writes **two** transfers (13.09.01 DT-01 — the inbound unit changes owner too; modelling it as a discount erases it from the chain). A consignment writes **one**, consignor → buyer, the consignee never appearing as an owner because they never were one (13.09.02 D-02).

**Role scoping**:
- **Musician/Producer**: choose between the paths at one decision point.
- **Operator**: the counterparty on both — and a poor persona fit (domain Q-03).
- **Fan**: may trade in, cannot consign.

**Synthesis questions answered**:
1. **Shared state conflict**: The chain is append-only; both paths append, differently.
2. **Trigger chain**: Trade-in → two appends atomically. Consignment sale → one append skipping the custodian.
3. **Permission intersection**: The consignee acts *as* the seller without owning — a CX-M09 delegation.
4. **Notification fan-out**: Modest.
5. **State transition conflict**: A trade-in of gear under an outstanding layaway or lien (13.09.01 Edge Cases) — the chain would know, if intact.

### CX-11: Authorized Dealer & MAP ↔ Price Discovery

**Relationship**: 13.13 DT-02's collision. MAP suppresses *advertised* prices below a floor; the price guide's purpose is publishing what units **actually sold for** — routinely below MAP — in aggregate, permanently, indexed for search. A MAP-compliant platform running a transparent guide publishes exactly what MAP exists to suppress. Medium confidence: the collision is certain, but only if the platform ever carries new gear from major brands (13.13 DT-01 doubts it will).

**Role scoping**:
- **Operator**: nominal dealer persona, a poor fit (domain Q-03).
- **All others**: read-only on both; would experience either a gagged guide or absent brands.

**Synthesis questions deferred** — Medium confidence. The strategic question is domain Q-08: which product survives? The guide is far closer to the thesis (transparency, provenance, trust); the dealer program is downstream of supply relationships nobody has and serves a persona that doesn't exist.

### CX-12: Rental ↔ Listings & Inventory

**Relationship**: Both prevent double-allocating a physical unit, differently. Sale claims are instantaneous and terminal — one arbitration, unit gone. Rental reserves a **range** that must not overlap another, held for months, with turnaround buffers and cascading dependencies (13.10.02 DT-01). Rental's reservation has more in common with booking a rehearsal room (domain 16) than buying an amp.

**Role scoping**:
- **Operator**: runs both; per personas.md their calendar *is* the business — domain 16's description, not this one's.
- **Musician/Producer**: rent and buy.
- **Fan**: read-only on rental; no deposit access.

**Synthesis questions deferred** — Medium confidence. Strongest evidence for domain Q-07 (promote rental): the mechanism rental needs (CX-M05 scheduling) is built for another domain, and rental cannot reuse this domain's order, comp, ownership or condition models. Four irreconcilable structures is the D-14 test.

### CX-13: Storefront Policies ↔ Returns

**Relationship**: Statute beats policy (13.12 D-02, 13.08.01 D-04) — the sharper finding (13.12 DT-02): **the same "no returns" text is lawful from a private seller and misleading from a trader**, and the platform renders both identically. Displaying it to a consumer tells them they have no right they in fact have, and most will believe it.

**Role scoping**:
- **Musician**: as a private seller, "no returns" may be honest.
- **Operator**: as a trader, the same words may be a dark pattern.
- **Fan**: the consumer who believes it and doesn't ask.
- **Producer**: either, depending on volume — precisely why the line is hard.

**Synthesis questions answered**:
1. **Shared state conflict**: Policy is a storefront default; statutory rights are external and non-negotiable — where they conflict the policy **must not be displayed as if valid**.
2. **Trigger chain**: Policy set → inherited by listings → shown pre-purchase → return requested → statute applies regardless.
3. **Permission intersection**: **The platform cannot currently tell a trader from a private seller** — the fourth independent arrival at domain Q-03 (with 13.13, 13.09, personas.md Q-01).
4. **Notification fan-out**: None.
5. **State transition conflict**: Policy changed after sale but before dispatch — the order holds its published terms (13.12 D-03).

### CX-14: Catalog ↔ Condition & Originality

**Relationship**: Step 6's highest-value intra reconciliation. Three features (13.01.01 attribute schemas, 13.02.02 flaw checklists, 13.03.01 "what's included" component sets) independently reach for the **same per-category structured-attribute mechanism** — "fret wear" is meaningless on a microphone; the checklist is derived from the bound category, not authored per listing. And the model is not decorative: it defines the **as-shipped baseline** against which a grade measures deviation (13.02.01 D-04/DT-03), so model binding is a *semantic prerequisite* for grading. An unmatched listing has no baseline → weakened grade semantics (E-08), which publishes anyway (domain D-03) with a generic 6-item fallback.

**Role scoping**:
- **Musician/Producer/Operator (as sellers)**: fill category-derived values; never author the attribute schema (that is moderation, 13.01.02 DT-10).
- **Fan**: reads the derived warnings; no write access.

**Synthesis questions answered**:
1. **Shared state conflict**: The per-category attribute schema is owned by catalog moderation (13.01.02); condition/disclosure/component-set features are read-consumers. A schema change is a moderation event, versioned; contributors add models and fill values, never attributes (D-09/DT-10).
2. **Trigger chain**: Category assigned via bind → attribute schema resolved → flaw checklist + component set + grade-ceiling table instantiated. No category (unmatched) → generic fallback, synchronous, degrades not blocks.
3. **Permission intersection**: Adding an attribute is a comp dimension and a catalog-schema act (moderator standing); filling a value is a seller act. The boundary is the enforcement (open attribute creation fragments the comp space).
4. **Notification fan-out**: A schema version publication is audit-logged (CX-M19); sellers with live listings on that category are not notified per-edit (would be noise).
5. **State transition conflict**: Category re-binding on a live listing re-instantiates the checklist under a filled disclosure — items whose attribute survived carry over; orphaned answers revert to unanswered rather than silently persisting a claim the seller never re-made.

### CX-15: Catalog ↔ Listings & Inventory

**Relationship**: 13.01.04 Listing↔Model Matching is the join that makes the catalog load-bearing rather than decorative — it binds a listing to the `(model, spec-period, variant)` triple. Everything downstream (comps, facets, compliance derivation, grade baseline, alerts) depends on this bind existing and being correct. Step 6 specified the bulk path: `(seller, SKU) → model` memoisation outranks every text signal (D-08), no gate relaxation for bulk (D-05 — relaxing gives Operators wrong comps at scale, worse than none), grouped review queue (120 rows ≈ 12 decisions).

**Role scoping**:
- **Operator**: bulk-lists at volume; SKU memoisation is the difference between usable and unusable.
- **Musician/Producer**: single listings, text-signal matching with confirm step.
- **Fan**: read-only.

**Synthesis questions answered**:
1. **Shared state conflict**: The bind is an attributed claim (13.01.04 D-04), stored distinctly from decoded facts, retained as dispute evidence — matching cannot detect counterfeits and must not launder them.
2. **Trigger chain**: Listing draft → text/SKU signal → candidate model → bind (auto if high-confidence sibling-eligible, else confirm) → publish. No match → publish unmatched with fallback, queued for review.
3. **Permission intersection**: Moderators may **unbind** (subtractive — removes a claim) but may not **rebind** (additive — makes a claim on the seller's behalf); claims belong to the seller (D-12).
4. **Notification fan-out**: A rebind is an alert-eligibility event — but naive "notify on rebind" is a free-bump exploit (5 rebinds → 5 alert waves, no fee); fan-out deduped per `(listing, model)` pair (D-09, DT-03).
5. **State transition conflict**: Moderation writes asynchronously under live binds; rejection has three subtypes (duplicate → silent re-point; nonsense → unbind + notify; abuse → unbind + escalate to 24, D-07).

### CX-16: Catalog ↔ Logistics

**Relationship**: Three compliance/logistics reads all derive from model attributes, not seller entry: **materials → CITES export gate** (13.07.03), **category → tariff classification** (13.07.02 — tariff is product identity, not tax), **dims + weight → freight class** (13.07.01). This is why binding correctness is a safety property, not a nicety: a 100V Japan-market unit auto-bound to the identically-named 120V US model yields **no voltage warning** for a US buyer (13.01.04 CX-04, highest severity) — the warning is *underivable*, not merely missing.

**Role scoping**:
- **All buyers**: protected by derived warnings they never see the machinery of.
- **Sellers**: a seller override below the model-derived freight envelope is logged and surfaced for abuse review (13.07.01).

**Synthesis questions answered**:
1. **Shared state conflict**: None — logistics reads catalog attributes. Correctness of the bind is the shared dependency.
2. **Trigger chain**: Bind → attributes resolved → CITES gate / tariff class / freight envelope computed at listing and re-checked at checkout for destination. CITES is a hard gate on international (13.07.03 D-02); freight is advisory-then-quoted.
3. **Permission intersection**: Seller may override freight upward or flag oversize; overriding below the envelope escalates (notification to 24).
4. **Notification fan-out**: Under-declaration / mark-as-gift requests are customs fraud → domain 24 trust signal (13.07.02).
5. **State transition conflict**: A merge/rebind changing materials or category could change CITES status mid-listing — re-derivation fires on bind change; an in-flight order keeps its snapshotted eligibility (CX-17).

### CX-17: Catalog ↔ Cart & Orders

**Relationship**: The resolution to CX-01's and CX-15's mid-transaction race. The model bind is **snapshotted onto the order at order creation** (13.01.04 D-10), so a catalog merge cannot re-point a comp set — or any derived fact — under an in-flight transaction. The buyer bought the *listing*, not the *model*; comps are advisory and never part of the agreement.

**Role scoping**: All buyers and sellers; invisible when working.

**Synthesis questions answered**:
1. **Shared state conflict**: The order snapshots the bind + derived facts at creation; the catalog remains free to evolve without corrupting settled or in-flight orders.
2. **Trigger chain**: Order created → bind + comps + compliance snapshotted → catalog changes apply only to future listings/orders.
3. **Permission intersection**: None — the snapshot is automatic.
4. **Notification fan-out**: None.
5. **State transition conflict**: This entry **exists to eliminate** the race — a merge landing mid-checkout is a no-op against the order's snapshot.

### CX-18: Condition & Originality ↔ Listings & Inventory

**Relationship**: Grading is a listing-lifecycle constraint, not an afterthought. Step 6 resolved three seams: (1) grade stays **required with no bulk exemption** (an ungraded listing is unfilterable and uncomparable) — bulk may carry a seller-set default flagged `bulk_defaulted`, disclosed, comp-weight reduced (E-21/D-11); (2) relist **pre-fills** prior disclosure but any item whose as-of date is >90 days reverts to unanswered (gear deteriorates in storage; a pre-filled answer glanced past is a signed claim never made, DT-06); (3) grade + flaws save **atomically as a consistent pair**, and a later edit is *challenged*, never the listing (no auto-downgrade, no stall — domain D-03 intact, E-11/D-09).

**Role scoping**:
- **Musician/Producer/Operator (as sellers)**: bound by the required-grade rule; bulk sellers get the flagged default.
- **Fan**: benefits from filterability; never sees `bulk_defaulted` machinery.

**Synthesis questions answered**:
1. **Shared state conflict**: The listing owns grade + flaw fields; they save atomically. The edit-vs-listing distinction is the merge strategy — the fact is versioned, the listing keeps publishing.
2. **Trigger chain**: Create/relist → grade required (or bulk-default) → publish. Relist → pre-fill → >90-day items revert to unanswered → re-affirm.
3. **Permission intersection**: Grade is required across all seller classes; no exemption relaxes it.
4. **Notification fan-out**: A grade/flaw edit on a live listing fans out per CX-19 (offer voiding) and is audit-logged (CX-M19).
5. **State transition conflict**: An edit while offers are pending — resolved by CX-19's asymmetric void; an edit while `reserved`/`sold` freezes the sold fact (buyer gets one-click cancel + full refund, E-15).

### CX-19: Condition & Originality ↔ Offers & Auctions

**Relationship**: A regrade changes the object an offer was priced against, and the response is **asymmetric because the harm is asymmetric** (13.02.01 D-10). A downward regrade or an added material flaw **auto-voids** open offers with the reason stated — a buyer bound to a worse item is trapped and a price-raise disguised as a downgrade is blocked. An upward regrade or a removed flaw **preserves** the offer (the buyer holding an offer on a better item is not harmed) and notifies, so they may withdraw.

**Role scoping**:
- **Musician/Producer/Fan (as buyers/offerers)**: protected by the asymmetry.
- **Sellers**: cannot weaponise a regrade to re-price out of an accepted offer.

**Synthesis questions answered**:
1. **Shared state conflict**: The listing's grade/flaw set is the shared state; the offer references the version it was made against.
2. **Trigger chain**: Regrade/flaw-change → evaluate direction → downward voids + notifies all offerers; upward preserves + notifies. Synchronous with the save.
3. **Permission intersection**: Only the seller regrades; the void/preserve is system-enforced, not seller-chosen.
4. **Notification fan-out**: Material flaw added → fan-out to **every** offerer (bounded by offer count); removed → same audience, informational.
5. **State transition conflict**: A regrade racing an offer acceptance — arbitration orders them; if the offer accepted first the sold fact freezes (CX-18) and the buyer gets the one-click cancel path.

### CX-20: Condition & Originality ↔ Trade-In & Inspection

**Relationship**: 13.09.03 intake grading and 13.02.01 self-grading share the entire vocabulary — same 8 grades, same ceilings, same definition versions — with **opposite epistemics** (13.09.03 DT-01). A self-grade is a claim by an *interested owner*; an intake grade is an assessment by an *interested receiver* (the dealer wants to pay less). Both are recorded, neither replaces the other; their gap is itself a signal.

**Role scoping**:
- **Musician/Producer (as trade-in/consignor)**: self-grade meets the counterparty's intake grade.
- **Operator (as intake grader)**: a poor persona fit (domain Q-03) but the party performing intake.
- **Fan**: trade-in only, read-only on intake.

**Synthesis questions answered**:
1. **Shared state conflict**: Two grade records on the same unit, neither authoritative over the other — the merge strategy is *coexistence with attribution*, not overwrite.
2. **Trigger chain**: Owner self-grades → submits → receiver intake-grades on arrival → divergence surfaced → offer/negotiation. A large gap is a negotiation and integrity input, not an auto-reject.
3. **Permission intersection**: The owner grades their listing; the receiver grades on intake; neither can edit the other's record.
4. **Notification fan-out**: Divergence → the submitting owner (offer justification).
5. **State transition conflict**: Both grades reference a definition version; a version change between self-grade and intake is reconciled to the version in force at each act, not silently unified.

### CX-21: Condition & Originality ↔ Rental + Repair/Service History

**Relationship**: 13.02.02 DT-05 — the file's strongest provenance contribution and a structural thesis differentiator. Three **first-party platform condition records** exist for a unit: rental-return condition (13.10), repair/service history (13.08.02), and intake grading (13.09.03). These pre-fill the disclosure checklist and **surface contradictions** against the seller's claims. A pure marketplace (Reverb) cannot do this: it owns no rental fleet and no repair function, so it has no first-party condition history — only seller assertion.

**Role scoping**:
- **Musician/Producer (as sellers)**: pre-filled from platform records; contradictions flagged, never auto-asserted (the seller signs and carries liability).
- **Operator**: runs rental/repair at volume — the largest source of first-party records.
- **Fan**: benefits from the higher-integrity disclosure.

**Synthesis questions answered**:
1. **Shared state conflict**: The unit's condition history is the shared entity, keyed on the serial-keyed unit (domain D-04). Each first-party record is append-only; disclosure reads them, never mutates them.
2. **Trigger chain**: Listing created for a unit with platform history → checklist pre-filled → contradictions (seller claims Mint, last rental return logged a dent) → flagged for the seller to reconcile → publishes with the flag if unresolved (D-03).
3. **Permission intersection**: The seller cannot edit or suppress a first-party record; they may only add their own (challengeable) claim alongside it.
4. **Notification fan-out**: A seller-claim-contradicts-first-party-record event is an integrity signal to domain 24 (CX-M08 scorecard), not a per-listing scarlet letter.
5. **State transition conflict**: A repair logged after listing publication — the disclosure re-triggers its contradiction check on every affirmation, not only at first publish (13.02.02).

---

## Cross-Cut Routing — swept candidates and Step 6 mechanism reads

> Classified as cross-cuts; **no node created**. Recorded so the global CX file absorbs them. Step 6 additions marked.

| Swept candidate / Step 6 read | Routed to | Reasoning |
|---|---|---|
| #17 (part) Vendor onboarding | **CX-M15** Onboarding & Role-Aware Activation | Identical across gear, digital goods, services, venues. |
| #17 (part) Seller tiers & scorecards | **CX-M08** Reviews, Ratings & Portable Reputation | Systematic over-grading and repeated non-disclosure are seller-performance signals aggregated into the scorecard, **never surfaced on the individual listing** (13.02.01 E-05) — a scarlet letter punishes the wrong transaction. |
| #17 (part) Carrier rate configuration | **CX-M14** Shipping, Fulfilment & Logistics | Extracted at D-16; seller rate config is part of it. |
| #19 (part) Bulk CSV/API import | **CX-M29** Bulk Import, Sync & Migration Tooling | Parsing/mapping/error-reporting domain-agnostic. **Cross-channel availability sync stays domain-owned** (13.03.04 DT-01). |
| #20 (part) Geo & map discovery | **CX-M13** Geo, Location & Map Discovery | Already serves this domain. |
| #25 (part) Watchlists & saved searches | **CX-M28** Follow, Save & Watchlist | Polymorphic follow/save serving 13, 14, 05, 20. |
| #27 (part) Financing & BNPL | **CX-M01** Payments, Escrow & Payouts | **Layaway stays domain-owned** (13.06.03) — an inventory hold on a qty=1 non-fungible unit. |
| — Promoted placement / bumping | **CX-M25** Promoted Placement & Advertising | Already serves this domain; no gear-specific residue. |
| **Step 6:** Generic dedupe / merge / alias / unmerge over the model record | **CX-M17** Canonical Data, Taxonomy & Entity Resolution | 13.01.04 supplies gear-specific ranking signals, the gear lexicon and the sibling-exclusion rule (domain-owned); the generic resolution substrate is CX-M17. **New requirement**: aliases must resolve **historically** — a binding made before a merge must still resolve, and a merged-away identifier must never 404 (D-08). |
| **Step 6:** Per-attribute assertion provenance on model attributes | **CX-M19** Audit Log & Provenance Ledger | DT-08 requires who-asserted / when / citing-what / confirmed-by-whom on **every** model attribute, plus immutable catalog annotations on domain-15 ownership records. The breadth pass consumed CX-M19 only for merge reversibility — this is a scope extension. |
| **Step 6:** Grade-inflation via facets | **CX-M16** Search & Discovery | The facet contract (13.02.01 DT-08): a buyer ticking only "Excellent" silently deletes every honest conservative grader, so **the facet IS the grade-inflation engine**. `Condition not itemised` is excluded from flaw-free facets by construction — this exclusion *is* the enforcement replacing a gate. |
| **Step 6:** Flaw audio clips | **CX-M10** Media Handling & Audio Playback | Flaw evidence is photos **and** audio (13.02.02 DT-10) — a 10-second clip of an amp hum is a music-specific evidence requirement a generic marketplace would never have. |
| **Step 6:** Message-to-disclosure promotion | **CX-M11** Messaging & Conversations | DT-12: the highest-volume condition disclosure on any gear marketplace happens in unstructured messages ("any cracks?" → "no, none"). One-tap promotion into structured, timestamped, pack-pinned disclosure — capture-at-source applied to the message thread. |

### Cross-cut gaps found — the ratified list may be incomplete

| Mechanism | Finding |
|---|---|
| **CX-M04** Atomic Payment ↔ Rights Transfer | Serves rights/services/projects/live-booking/royalties/digital-goods/credits — **not gear-marketplace or gear-registry**, despite 13.06.05 being structurally the same mechanism (money moves, ownership moves, atomically). Likely a gap. Domain Q-11. |
| **CX-M31** Safeguarding & Minor Protection | Does not list gear-marketplace. 13.11 puts a possibly-minor Fan in a room with a stranger and cash; **13.02.01 E-19**: a Fan buying Non-Functioning mains-powered gear needs a safety interstitial ("for parts" on a vintage valve amp means death caps and two-prong plugs). Domain Q-12. |
| **CX-M11** Real-Time Rooms, Presence & Audio Transport | Does not serve gear-marketplace. 13.05.02 (live auction bid state) may need it — low confidence, only if auctions survive MoSCoW. |

## Not-Product — routed to `/create-prd`

| Concern | Routed to | Reasoning |
|---|---|---|
| qty=1 reservation & concurrency-control strategy | `/create-prd-architecture` | 13.03.03 owns the **product** answer (who wins, what the loser sees, how the seller is told). Locking/reservation/idempotency mechanics are architecture. Includes optimistic concurrency on model-record edits (13.01.01). |
| Price-guide comp aggregation & materialisation pipeline | `/create-prd-architecture` | 13.04.01 owns what is shown and when. Batch vs. streaming, materialised views, recompute-on-merge are architecture. |
| High-resolution listing media storage, transcode & CDN at scale | `/create-prd-stack` | Unit-specific photos, audio and video demos at marketplace scale. Flagged in `meta/constraints.md`. |
| Permission-scoped self-dealing check (not identity-scoped) | `/create-prd-architecture` | 13.05.01 D-4a / 13.03.03 D-14: "is this the same interested party?" must span a person **and** the entities they control, and be permission-scoped, not identity-scoped. |

## Candidate Disposition — merges and splits

| # | Swept candidate | Disposition |
|---|---|---|
| 01, 02, 03 | Catalog / Contribution / Serial decoding | **Merged** into 13.01 — one spine, three interacting capabilities. |
| 04 | Condition Grading & Mandatory Flaw/Mod Disclosure | **Split** into 13.02.01/02/03 — condition and originality are orthogonal axes (D-02). |
| 10, 11, 12, 13 | Freight / Customs / CITES / Insurance | **Merged** into 13.07 — the gear-physics cluster. |
| 15, 16 | Price guide / Repricing | **Merged** into 13.04, plus 13.04.03 governing when either may speak. |
| 17 | Vendor Onboarding, Storefronts, Tiers & Scorecards | **Split**: onboarding → CX-M15, tiers/scorecards → CX-M08, rates → CX-M14; storefront + policies → 13.12. |
| 19 | Multi-Channel Inventory Sync & Bulk Listing | **Split**: bulk import → CX-M29; cross-channel sync → 13.03.04 (domain-owned). |
| 20 | Local Pickup, Geo Commerce & Meetup Safety | **Split**: geo → CX-M13; pickup + safety → 13.11. |
| 25 | Wanted/ISO Reverse Marketplace & Watchlists | **Split**: watchlists → CX-M28; ISO → 13.05.03. |
| 27 | Financing, BNPL & Layaway | **Split**: financing/BNPL → CX-M01; layaway → 13.06.03. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 13.01 Catalog | 13.11 Local Pickup | Catalog data could inform a pickup decision (this is a piano, collect it). Rejected — that inference belongs to 13.07.01 freight classification, which already routes to 13.11. A direct edge duplicates an existing path. |
| R-02 | 13.13 Authorized Dealer & MAP | 13.02 Condition & Originality | Dealer status might affect condition claims' credibility. Rejected — MAP/authorisation govern **new** gear, which has no condition question. The non-overlap signals 13.13 sits outside the domain's centre of gravity. |
| R-03 | 13.04 Price Discovery | 13.10 Rental | Rental rates as market data. Rejected — a day rate says nothing about a unit's value (13.10.01 DT-02); mixing rates corrupts the guide with a different unit of account. |
| R-04 | 13.09 Trade-In & Consignment | 13.05 Offers & Auctions | A trade-in offer is an offer. Rejected — 13.05 offers are buyer→seller price proposals on a listing with a claim state machine; a trade-in offer is a dealer's valuation of an inbound unit with no listing and no claim. Same word, different object. |
| R-05 | 13.12 Storefront Policies | 13.01 Catalog | Sellers might scope storefronts by catalog category. Rejected — a presentation filter, not an interaction. No shared state, trigger or permission intersection. |
| R-06 | 13.03 Listings & Inventory | 13.07 Logistics | Listings need shipping. Rejected — the interaction is mediated entirely by the order (CX-06). A listing declares fulfilment options; logistics executes against an order. Compliance *derivation* is catalog→logistics (CX-16), not listing→logistics. |
| R-07 | 13.04 Price Discovery | 13.02.04 Condition Evidence Pack | An evidenced pack could weight comps more. Rejected as a direct edge — the pack's price-relevance flows through the *grade/flaw axes* (CX-02); the guide never reads pack media. What lowers confidence is the disclosure being not-itemised (CX-02), not the pack's presence. |
| R-08 | 13.05 Offers & Auctions | 13.13 Authorized Dealer & MAP | MAP might floor an accepted offer. Rejected — MAP governs *advertised* price on **new** gear; offers/auctions operate on the used, qty=1 inventory that has no MAP. No overlap in the objects each touches. |

> **Notes:** CX-14 through CX-21 are Step 6 additions from the deep-think intra pass; CX-01/02/03/15/18 were enriched with resolutions to previously-`[PENDING]` synthesis questions. Intra-*sub-domain* feature pairs (13.01.04↔13.01.05 fitment, 13.01.01↔13.01.02 contribution, 13.02.01↔13.02.02 grade-ceiling) are resolved in their respective sub-domain CX files, not here.
