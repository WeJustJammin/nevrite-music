# Digital Goods & Plugin Marketplace — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Digital Goods & Plugin Marketplace](./digital-goods-marketplace-index.md)
> **Status**: [BREADTH] — 10 sub-domains classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | [14.03 Delivery & Library](./14.03-delivery-versioning-library/) | The entitlement authorises every byte. No entitlement, no download — and the library is that record's presentation. | Musician, Producer, Operator, Fan | High | Every download mints a URL against a live entitlement check (14.03 CX-01). A static link makes the entitlement decorative. |
| CX-02 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.09 Refunds](./14.09-digital-refunds-revocation/) | The compatibility verdict shown at the buy button is recorded against the order and becomes the evidence in a "it doesn't work" refund case — usually indicting the store. | Musician, Producer, Operator | High | 14.01.04 DT-02 / 14.09.02 DT-02. The badge is our claim; standing behind it is what makes it worth trusting. |
| CX-03 | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | [14.06 Used Licence Transfer](./14.06-used-licence-transfer/) | A transfer is a change of holder on an existing entitlement, inheriting its bound terms and history. Without a first-class entitlement record there is no resale market. | Musician, Producer, Operator | High | 14.06 D-03. Minting a new entitlement would destroy the inheritance that is the transaction's legal basis. |
| CX-04 | [14.08 Vendor Portal & QA](./14.08-vendor-portal-build-qa/) | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | Terms, transfer policy and the rights attestation are all authored at submission. Everything the licensing layer later enforces was captured here or invented. | Musician, Producer | High | 14.08.01's whole role: the domain's narrowest point, through which all supply passes. |
| CX-05 | [14.08 Vendor Portal & QA](./14.08-vendor-portal-build-qa/) | [14.07 Monetisation](./14.07-monetisation-models-pricing/) | Vendor exit collides with every model that assumes a vendor still exists — rent-to-own mid-schedule, transfer approval, perpetual continuity. | Musician, Producer, Operator | High | 14.07.03 DT-02 / 14.08.05 DT-01: the vendor took year-one revenue; the obligation runs twenty. |
| CX-06 | [14.04 Sound Content](./14.04-sound-content-catalogs/) | [14.10 Contributor Revenue](./14.10-contributor-revenue-royalty-pool/) | Packs are what the pool pays for, and packs have several makers — so the pool needs a split before it can pay anyone. | Musician, Producer | High | 14.10.03 DT-01. The pool computes a correct amount and pays the wrong person without it. |
| CX-07 | [14.07 Monetisation](./14.07-monetisation-models-pricing/) | [14.10 Contributor Revenue](./14.10-contributor-revenue-royalty-pool/) | Subscription revenue is the pool's only funding source. No subscription, no pool. | Musician, Producer | High | 14.10 Q-01: this sub-domain is entirely contingent on a monetisation decision nobody has taken. |
| CX-08 | [14.05 Beat Licensing](./14.05-beat-instrumental-licensing/) | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | Beat lease tiers are expressed through the terms registry rather than a parallel licensing vocabulary. | Musician, Producer | High | 14.05 D-03. A second terms system splits the clearance chain in half for no gain. |
| CX-09 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.04 Sound Content](./14.04-sound-content-catalogs/) | The dependency graph is load-bearing for content: a preset without its synth, a template without its plugins, is an unopenable file. | Musician, Producer | High | 14.04.02's defining constraint; 14.04.03's manifest is a many-edge instance of 14.01.03's graph. |
| CX-10 | [14.03 Delivery & Library](./14.03-delivery-versioning-library/) | [14.08 Vendor Portal & QA](./14.08-vendor-portal-build-qa/) | Staged rollout is only meaningful because the legacy archive exists to roll back to; the archive is only actionable because rollout can halt a bad build. | Producer, Operator | High | 14.08.04 DT-01 / 14.03.02 DT-01 — each is the other's precondition. |
| CX-11 | [14.06 Used Licence Transfer](./14.06-used-licence-transfer/) | [14.09 Refunds](./14.09-digital-refunds-revocation/) | Transfer reuses revocation's clawback to strip the seller rather than inventing a second stripping path. | Musician, Producer, Operator | Medium | 14.06 R-02. Two stripping mechanisms would diverge, leaving a sold licence quietly running. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Licensing ↔ Delivery & Library

**Relationship**: The domain's spine. 14.02 mints and holds the entitlement; 14.03 renders it and
serves bytes against it. Every download authorises live — state `active`, version permitted,
waiver captured (14.09.01) — through a short-lived, buyer-scoped URL. Revocation therefore lands
on the *next* request even when it cannot reach a machine.

**Role scoping**:
- **Musician**: reinstalls a career's worth of tools on a new laptop years later; the check must still pass.
- **Producer**: fetches the same product to many machines routinely — must not read as abuse.
- **Operator**: fetches per room, often on a restricted network.
- **Fan**: traverses this same gate for music bought on an artist page (domain 20) — the acknowledged shared layer.

**Synthesis questions answered**:
1. **Shared state conflict**: The entitlement is 14.02's; 14.03 reads only. Single writer.
2. **Trigger chain**: Request → entitlement check → waiver check → URL mint → transfer. Sync. Any check failing yields no URL, never a partial transfer.
3. **Permission intersection**: Total — 14.02's state directly gates bytes.
4. **Notification fan-out**: None on a normal download; treating a touring musician's new location as a threat is the wrong default.
5. **State transition conflict**: Revocation racing an in-flight multi-GB transfer (14.03 CX-01 q5, 14.09.03 Q-01) — unresolved.

---

### CX-02: Catalog & Compatibility ↔ Refunds

**Relationship**: The most interesting loop in the domain. 14.01.04's badge is a claim the store
makes at the buy button; 14.09.02 later adjudicates a refund using that recorded claim as
evidence. The evidence usually points at **us** — either we badged "will run" (our error, refund)
or "untested" (the buyer proceeded knowingly). This is the platform's thesis applied to its own
commerce: a contemporaneous record beats an argument from memory.

**Role scoping**:
- **Musician**: gets an answer instead of a negotiation.
- **Producer**: the persona most likely to have a legitimate "not as described" claim.
- **Operator**: per-room verdicts; a wrong badge multiplies across four rooms.
- **Fan**: not affected — fan purchases route through domain 20's policy.

**Synthesis questions answered**:
1. **Shared state conflict**: The verdict is derived at read time (14.01.04) but **snapshotted onto the order**. That snapshot is the only durable copy and must be immutable.
2. **Trigger chain**: Purchase → verdict recorded. Later: refund requested → verdict read → policy applied. Days or months apart.
3. **Permission intersection**: A vendor's inaccurate matrix (14.01 Q-02) becomes the store's liability at this intersection — which is the pressure that should make matrices accurate.
4. **Notification fan-out**: A refund driven by a bad badge should flag the vendor's matrix as inaccurate, not just refund the buyer.
5. **State transition conflict**: Matrix edited between purchase and refund request — the snapshot governs, not the current matrix.

---

### CX-03: Licensing ↔ Used Licence Transfer

**Relationship**: 14.06's entire existence depends on 14.02.01 D-01 (the entitlement record is
primary, the key is an artifact). A transfer changes the holder and carries across the bound terms
(14.02 CX-02), version range and history — the inheritance is the transaction's legal basis.

**Role scoping**:
- **Musician**: buys tools they could not otherwise afford; sells what they've moved on from.
- **Producer**: deepest library, most to resell.
- **Operator**: studio clear-outs — their one substantial presence in the domain.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state conflict**: One entitlement, one holder. The escrow must hard-lock it — the same race class as 14.05.02's double-exclusive.
2. **Trigger chain**: Settlement → strip seller (via 14.09.03) → write buyer → vendor fee. Atomic or rolled back entirely.
3. **Permission intersection**: The **vendor** decides whether a holder may sell what they own (14.06.01) — ownership without alienation, and the absent third party holds the veto (14.06.02 DT-02).
4. **Notification fan-out**: Both parties at settlement; the vendor if approval is required.
5. **State transition conflict**: Vendor policy changing mid-escrow (14.06 CX-01 q5).

---

### CX-04: Vendor Portal & QA ↔ Licensing

**Relationship**: Everything 14.02 enforces was captured at submission — terms (14.02.05),
transfer policy (14.06.01), the rights attestation, the AI declaration. 14.08.01 is the domain's
narrowest point: all supply passes through it, and any assurance not captured there is invented
later or not at all.

**Role scoping**:
- **Musician**: the realistic vendor — a musician with a folder, not a software company.
- **Producer**: the archetypal vendor and the only one plausibly shipping code.
- **Operator**: config-level; org vendor identity is blocked on 14.02 Q-03.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state conflict**: Submission authors; licensing reads and freezes at issuance.
2. **Trigger chain**: Submit → QA → publish → (later) purchase → terms frozen onto the entitlement.
3. **Permission intersection**: A vendor's authoring rights never extend to already-bound terms versions (14.02 CX-02). That is the whole point.
4. **Notification fan-out**: New terms notify existing holders informationally — and must not read as a change to their rights.
5. **State transition conflict**: Terms edited during a checkout — bind what was displayed, not what is current at commit.

---

### CX-05: Vendor Portal & QA ↔ Monetisation

**Relationship**: Vendor exit (14.08.05) is where every monetisation model's unexamined assumption
— that the vendor still exists — fails at once. Perpetual becomes the platform's sole obligation
(14.07.01 DT-01). Rent-to-own mid-schedule has no answer anywhere in the market (14.07.03 DT-02).
Transfer approval freezes forever (14.06.01).

**Role scoping**:
- **Musician**: 6 of 12 payments into a tool whose maker has gone.
- **Producer**: same at higher values.
- **Operator**: rooms run exited vendors' tools routinely — Tuesday, not a hypothetical.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state conflict**: Continuity obligations are agreed at onboarding (14.08 CX-05) and read at exit, years apart.
2. **Trigger chain**: Exit → delist → obligations enforced. Rent-to-own schedules in flight have **no defined behaviour**.
3. **Permission intersection**: A vendor cannot delete artifacts buyers hold perpetual rights to — structurally, not by policy (14.08.05 D-02).
4. **Notification fan-out**: All holders: "no longer sold — your access is unaffected".
5. **State transition conflict**: Exit racing an in-flight rent-to-own payment or a pending transfer.

---

### CX-06: Sound Content ↔ Contributor Revenue

**Relationship**: The pool pays for packs; packs are made by several people. 14.10.03 is the join,
and without it the money goes to whoever clicked upload — reproducing, inside our own marketplace,
the exact failure D-18 says the platform exists to fix.

**Role scoping**:
- **Musician**: the drummer whose kit samples are in a friend's pack — the contributor this protects.
- **Producer**: the pack owner who proposes the split and holds the power.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state conflict**: The pack is 14.04's product; the split is 14.10's — and per 14.10.03 DT-03 the split arguably belongs to domain 02/09 entirely.
2. **Trigger chain**: Submission → split proposed → confirmed. Period close → accrual valued → split applied → payout. Payout blocks on an unagreed split (14.10.03 D-02).
3. **Permission intersection**: Nobody joins a split without confirming; the pack owner cannot unilaterally name shares.
4. **Notification fan-out**: All contributors on proposal, confirmation and statement.
5. **State transition conflict**: Split edited after a period closed — frozen per period, edits forward only.

---

### CX-07: Monetisation ↔ Contributor Revenue

**Relationship**: A strict dependency. The pool exists only because the credit model breaks the
link between payment and sale. If the store sells packs perpetually — which is what creator content
sells as, and what 14.07 Q-01 recommends at launch — every download has a sale attached and 14.10
does not exist.

**Role scoping**: See 14.10's Role Matrix — Reports-only for Musician and Producer, absent for
Operator and Fan.

**Synthesis questions answered**:
1. **Shared state conflict**: None — 14.07 produces revenue, 14.10 distributes a share of it.
2. **Trigger chain**: Subscribe → pool funded. Credit spent → accrual. Period close → payout.
3. **Permission intersection**: None new.
4. **Notification fan-out**: Statements at period close.
5. **State transition conflict**: Credit farming (14.07.02) dilutes every honest contributor's pro-rata share — a pool-integrity issue, not just abuse (14.10.01 D-03).

---

### CX-08: Beat Licensing ↔ Licensing

**Relationship**: A beat lease tier is a terms bundle with a price (14.05 D-03). Expressing tiers
through 14.02.05 means a track cleared against a beat lease and one cleared against a sample pack
use the same clearance chain into domain 09.

**Role scoping**:
- **Musician**: the artist whose released record carries the lease's caps.
- **Producer**: the beatmaker defining tiers.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state conflict**: One terms vocabulary, two consumers. Tiers are bound and frozen at purchase like any terms.
2. **Trigger chain**: Tier purchased → lease minted with caps → terms frozen.
3. **Permission intersection**: A producer cannot retroactively tighten a bound tier.
4. **Notification fan-out**: Cap-approach warnings (14.05.03).
5. **State transition conflict**: None at purchase.

---

### CX-09: Catalog & Compatibility ↔ Sound Content

**Relationship**: 14.01.03's dependency graph matters most for content, not software. A compressor
runs standalone; a Serum bank without Serum is unreadable text, and a project template is mostly
pointers to other people's products. 14.04.03's manifest is a many-edge instance of the same graph.

**Role scoping**:
- **Musician**: the Kontakt-Player-vs-full failure, the market's most common return.
- **Producer**: needs cart-level rollup — "what does this basket require that I lack?"
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state conflict**: 14.01.03 owns the graph; 14.04.03 owns the missing-deps-to-cart flow.
2. **Trigger chain**: Buying a dependency re-evaluates dependents (14.01 CX-02).
3. **Permission intersection**: Owning a template does not license its dependencies (14.04 CX-04) — the trap.
4. **Notification fan-out**: "3 wishlisted items now run" is a real merchandising moment.
5. **State transition conflict**: A lapsed subscription un-satisfying a perpetual product's dependency (14.07.01 Q-03).

---

### CX-10: Delivery & Library ↔ Vendor Portal & QA

**Relationship**: Mutual precondition. Rollback (14.08.04) is meaningless without the archive
(14.03.02) to roll back *to*; the archive is inert without rollout able to halt a bad build
spreading. Together they are the domain's only answer to its most likely incident — a v3 that
changes a sound and lands on everyone mid-album.

**Role scoping**:
- **Producer**: vendor and victim, the same human.
- **Operator**: wants the slowest channel; rooms update on maintenance windows.
- **Musician**: default channel, unaware.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state conflict**: Versions are immutable once published; the channel assignment is separate state.
2. **Trigger chain**: QA pass → channel → progressive offer → (adverse signal) → halt → rollback → archive serves the previous build.
3. **Permission intersection**: The channel is **buyer-selected** (14.08.04 D-01) — an inversion of the app-store model, because only the buyer knows they are mid-album.
4. **Notification fan-out**: Progressive by cohort; release notes must describe what changed *musically* (14.03.02 D-03).
5. **State transition conflict**: Rollback racing an in-flight download — the download completes; the artifact is valid, the recommendation changed.

---

### CX-11: Used Licence Transfer ↔ Refunds

**Relationship**: Medium confidence. 14.06.02 reuses 14.09.03's clawback to strip the seller,
deliberately rather than inventing a second stripping path (14.06 R-02). It inherits the same
physics: under fail-open (14.02.02 D-01), a seller's offline machine keeps running after they sold
the licence.

**Role scoping**: `[PENDING — /ideate-discover Step 5 deepening]`

**Synthesis questions**: Deferred — Medium confidence, and contingent on 14.06 Q-01 (whether the
used market is real enough for the escrow to exist at all).

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 14.05 Beat Licensing | 14.06 Used Licence Transfer | A beat lease is not transferable and the idea is incoherent rather than merely unsupported: a lease is a licence to *a specific artist* to release *their* record, granted on terms bound to them. There is no "used beat lease" to sell — the thing has no existence apart from the buyer's use of it. Exclusive beat ownership (14.05.02) *could* in principle be resold, but that is a copyright assignment in domain 09, not a licence transfer in 14.06. |
| R-02 | 14.04 Sound Content | 14.06 Used Licence Transfer | Nobody resells a £15 sample pack, and the reason is structural rather than cultural: the transaction costs (escrow, policy check, vendor fee, clawback) exceed the goods' value, and the licence terms of essentially every pack forbid redistribution in isolation anyway (14.02.05). Recording this because "new and used" (D-05) tempts a blanket application of 14.06 across the domain — and it lands on precisely the inventory the store actually has (14.01.01 DT-02), where it buys nothing. |
| R-03 | 14.10 Contributor Revenue | 14.09 Refunds | The pool is funded by subscription revenue (CX-07), not by pack sales — so a refunded *sale* never entered the pool and cannot be reversed out of it. The genuine adjacent problem is credit-farming clawback (14.07.02), which is an attribution correction (14.10 CX-01 q5), not a refund. A spec writer would reasonably assume "refunds must reverse contributor payouts" and would be importing a storefront's logic into a royalty system. |
| R-04 | 14.03 Delivery & Library | 14.05 Beat Licensing | Beat delivery looks like it should route through 14.03's machinery and mostly does — but the *interesting* part of beat delivery is tier-gated untagged artifacts (14.05.04), which is a beat-licensing concern, not a delivery one. 14.03 serves the bytes exactly as it serves anything else, via CX-01's entitlement gate. Modelling a distinct edge would imply beats need special delivery. They need special *unlocking*, which lives where the tiers live. |
| R-05 | 14.01 Catalog & Compatibility | 14.10 Contributor Revenue | A pack's spec sheet and its contributor payouts never read each other. Tempting because both attach to "the pack", but the listing is a *product* description and the pool distributes to *people* — and per 14.10.03 DT-03 the payee list is a credits object (domain 02/09), not a listing field. An edge here would invite modelling contributors as listing metadata, which is exactly the single-payee mistake 14.10.03 rejects. |

---

## Cross-Cuts Escalated to the Global CX

> Mechanisms discovered during this domain's classification that serve **many** domains. Per the
> Node Classification Gate these are **not** nodes in domain 14 — recorded here so
> `ideation-cx.md` can absorb them. Domain 14 is a consumer of each, not the owner.

| Mechanism | Serves | Why it is a cross-cut, not a node here |
|---|---|---|
| **AI Provenance & Disclosure Attestation** | 07, 09, 12, 14, 24 | Candidate 24 ("AI-Generated Content Disclosure & Clearance Attestation") — the mechanism is an attestation attached to an asset that propagates downstream. Identical need for AI stems in projects, AI content at release (DSPs increasingly require the disclosure), and rights. Domain 14's touchpoint is capture at submission (14.08.01, 14.08 D-04). |
| **Audio Audition Player** | 05, 07, 14, 20 | Auditioning a loop, a portfolio track, a project bounce or an artist's release is one player. Domain 14's *catalog* audition (per-file, key/BPM-aware, 14.04.01) is domain-specific; the player is not. |
| **Cart, Checkout & Payments** | 05, 13, 14, 17, 19, 20 | The domain index's own reasoning (D-14): the cart is the *only* thing 13 and 14 share. Shared rail; the settlement semantics are domain-owned (14.06.02 DT-01). |
| **Multi-vendor Payouts, Escrow & KYC** | 05, 13, 14, 17 | The rail that moves money to vendors and contributors. Domain 14 decides amounts (14.10) and conditions (14.06.02); it does not move money. |
| **Marketplace Search, Faceting & Discovery** | 05, 13, 14, 16 | Finds *listings*. Distinct from 14.04.04, which indexes listings' *contents* with relational musical facets — see 14.04.04 DT-01. Both exist. |
| **Reviews & Ratings** | 05, 13, 14, 16 | Never surfaced as a candidate in this domain, which is itself notable — a store with no reviews is not a store. Presumed a platform cross-cut; flagged in the domain index's Open Questions. |
| **Disputes & Case Management** | 05, 13, 14, 19, 24 | Appeals against revocation (14.09.03), blacklisting (14.02.04), failed transfers (14.06.02) and chargebacks are all *cases*. 14.09 owns digital-specific refund policy (14.09 D-03); 24 owns the case machinery. |
| **Marketplace Facilitator Tax / VAT / GST** | 05, 13, 14, 19 | Digital goods carry a specific nasty the shared mechanism must handle: **place of supply is the buyer's location** for digital services (EU VAT MOSS), unlike physical goods. A domain-14 constraint on a platform cross-cut. |
| **Notifications** | All | Update available, lease expiring (14.05.03), trial ending (14.02.06), cap approaching, matrix change flipping a wishlisted item to "won't run" (14.01 CX-01 q4). |

## Not-Product Concerns Routed Out

> Architecture and NFR discovered during classification, recorded per `constraints.md`'s
> "Architecture Concerns Reclassified Out of the Product" precedent.

| Concern | Routed To | Why |
|---|---|---|
| Licence key cryptography & activation-server design | `/create-prd-security` | The *product* half (seat management, blacklisting UX, offline flow) stays in 14.02. The crypto and server design are architecture — and 14.02 Q-01 asks whether the server should exist at all. |
| Edge/CDN strategy for multi-GB assets under per-buyer watermarking | `/create-prd-architecture` | 14.03 CX-04: per-buyer artifacts are uncacheable, which collides with the locked Cloudflare constraint on the largest files in the catalog. |
| Storage & egress cost model for perpetual obligations | `/create-prd` | 14.03.01 DT-02 / 14.07.01 DT-01: an unbounded liability sold at a one-time price. Uncosted, and it plausibly decides whether large-format content is sellable at all. |
| Malware scanner selection & notarisation verification | `/create-prd-security` | The gate is product (14.08.02); the scanner choice is architecture. |
| DAW session-format parsing (Ableton/Logic/Pro Tools) | `/create-prd-architecture` | 14.04.03 DT-01 requires generated manifests. Proprietary, undocumented, version-drifting formats on a `could`-priority feature. |
| Audio fingerprinting against commercial recordings | `/create-prd-architecture` | 14.08.03 Q-01 and 14.05.02 Q-03 want the same capability. One investment, two features — and it is the only automated defence against the domain's central exposure. |
| Machine fingerprinting (privacy-sensitive personal data) | `/create-prd-security` | 14.02.02's rig/machine identity is a fingerprint, and vendors must never read it. |
| Consumer-credit regulatory perimeter (rent-to-own) | `/create-prd` | 14.07.03 DT-02 — **absent from `meta/constraints.md`'s compliance table** and should be added regardless of whether rent-to-own ships. |
| Stored-value / e-money implications of a credit economy | `/create-prd` | 14.07.02 DT-01 — a platform currency spendable across vendors resembles an e-money instrument. |
| EU software-resale law (*UsedSoft v Oracle*, C-128/11) | `/create-prd` | 14.06.01 DT-02 — may override the registry's "vendor decides" model in a major territory. |
| Withdrawal-waiver wording (Consumer Rights Directive Art. 16(m)) | `/create-prd` | 14.09.01 — a legal artifact, not product copy. Getting it wrong voids it silently. |
