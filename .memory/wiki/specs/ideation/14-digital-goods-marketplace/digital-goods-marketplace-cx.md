# Digital Goods & Plugin Marketplace — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Digital Goods & Plugin Marketplace](./digital-goods-marketplace-index.md)
> **Status**: [DEEP] — 10 sub-domains classified; intra-domain cross-cuts synthesised (Step 6).
> **Last updated**: 2026-07-18

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | [14.03 Delivery & Library](./14.03-delivery-versioning-library/) | The entitlement authorises every byte. No entitlement, no download — and the library is that record's presentation. | Musician, Producer, Operator, Fan | High | Every download mints a URL against a live entitlement check (14.03 CX-01). A static link makes the entitlement decorative. |
| CX-02 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.09 Refunds](./14.09-digital-refunds-revocation/) | The compatibility verdict shown at the buy button is snapshotted onto the order and becomes the evidence in a "it doesn't work" refund case — usually indicting the store. | Musician, Producer, Operator | High | 14.01.04 DT-02 / 14.09.02 DT-02. The badge is our claim; standing behind it is what makes it worth trusting. |
| CX-03 | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | [14.06 Used Licence Transfer](./14.06-used-licence-transfer/) | A transfer is a change of holder on an existing entitlement, inheriting its bound terms and history. Without a first-class entitlement record there is no resale market. | Musician, Producer, Operator | High | 14.06 D-03. Minting a new entitlement would destroy the inheritance that is the transaction's legal basis. |
| CX-04 | [14.08 Vendor Portal & QA](./14.08-vendor-portal-build-qa/) | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | Terms, transfer policy and the rights attestation are all authored at submission. Everything the licensing layer later enforces was captured here or invented. | Musician, Producer | High | 14.08.01's whole role: the domain's narrowest point, through which all supply passes. |
| CX-05 | [14.08 Vendor Portal & QA](./14.08-vendor-portal-build-qa/) | [14.07 Monetisation](./14.07-monetisation-models-pricing/) | Vendor exit collides with every model that assumes a vendor still exists — rent-to-own mid-schedule, transfer approval, perpetual continuity. | Musician, Producer, Operator | High | 14.07.03 DT-02 / 14.08.05 DT-01: the vendor took year-one revenue; the obligation runs twenty. |
| CX-06 | [14.04 Sound Content](./14.04-sound-content-catalogs/) | [14.10 Contributor Revenue](./14.10-contributor-revenue-royalty-pool/) | Packs are what the pool pays for, and packs have several makers — so the pool needs a split before it can pay anyone. | Musician, Producer | High | 14.10.03 DT-01. The pool computes a correct amount and pays the wrong person without it. |
| CX-07 | [14.07 Monetisation](./14.07-monetisation-models-pricing/) | [14.10 Contributor Revenue](./14.10-contributor-revenue-royalty-pool/) | Subscription revenue is the pool's only funding source. No subscription, no pool. | Musician, Producer | High | 14.10 Q-01: this sub-domain is entirely contingent on a monetisation decision nobody has taken. |
| CX-08 | [14.05 Beat Licensing](./14.05-beat-instrumental-licensing/) | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | Beat lease tiers are expressed through the terms registry rather than a parallel licensing vocabulary. | Musician, Producer | High | 14.05 D-03 / domain CX-08. Term length and stream cap live here; a second terms system splits the clearance chain for no gain. |
| CX-09 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.04 Sound Content](./14.04-sound-content-catalogs/) | The dependency graph is load-bearing for content: a preset without its synth, a template without its plugins, is an unopenable file. | Musician, Producer | High | 14.04.02's defining constraint; 14.04.03's manifest is a many-edge instance of 14.01.03's graph. |
| CX-10 | [14.03 Delivery & Library](./14.03-delivery-versioning-library/) | [14.08 Vendor Portal & QA](./14.08-vendor-portal-build-qa/) | Staged rollout is only meaningful because the legacy archive exists to roll back to; the archive is only actionable because rollout can halt a bad build. A withdrawal must carry a *reason* for delivery to branch on. | Producer, Operator | High | 14.08.04 DT-01 / 14.03.02 DT-01 / 14.03.01 DT-05 — each is the other's precondition. |
| CX-11 | [14.06 Used Licence Transfer](./14.06-used-licence-transfer/) | [14.09 Refunds](./14.09-digital-refunds-revocation/) | Transfer reuses revocation's clawback to strip the seller rather than inventing a second stripping path. | Musician, Producer, Operator | Medium | 14.06 R-02. Two stripping mechanisms would diverge, leaving a sold licence quietly running. |
| CX-12 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.08 Vendor Portal & QA](./14.08-vendor-portal-build-qa/) | The listing's type-conditional required-section schema is authored at submission and cross-checked by QA against the actual artifact; vendor exit produces **two** distinct delisted states (retirement vs removal-for-cause), which the listing must render differently. | Musician, Producer | High | 14.08.01 D-02 and 14.01.01 D-02 are the same decision from two sides; 14.08.02 QA gates publish; 14.08.05 D-03 splits retirement from removal. |
| CX-13 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.02 Licensing (Terms Registry 14.02.05)](./14.02-licensing-activation-entitlement/) | Bound licence terms are a required listing section; they bind at purchase and are immutable thereafter, which drives the asymmetric cart rule — **price locks in the cart, terms do not**. | Musician, Producer, Operator | High | THE THESIS TOUCHPOINT (DT-04). 14.02.05 D-02 / 14.01.01 D-04/D-05. |
| CX-14 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.03 Delivery & Library](./14.03-delivery-versioning-library/) | The listing is the durable record; versions come and go beneath it. The buyer-state rendering table reads *owned* state from the library — the listing reads, never writes it. | Musician, Producer, Operator, Fan | High | 14.03.02 D-01 (every entitled version stays fetchable) keeps a delisted owner-view functional; 14.03.03 owns the owned-state read (DT-03). |
| CX-15 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.05 Beat Licensing](./14.05-beat-instrumental-licensing/) | An exclusive sale delists the listing **atomically** and can invalidate other buyers' in-flight carts — the only transaction on the platform where a purchase destroys its own product. | Musician, Producer | High | 14.05.02 D-01. The sharpest concurrency case the listing must survive: two artists holding the same exclusive in-cart. |
| CX-16 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.07 Monetisation](./14.07-monetisation-models-pricing/) | The monetisation model is a required listing section; price is per-tier for beats. The version-range field displayed at original purchase is what makes the buyer-state Upgrade row expressible. | Musician, Producer, Operator | High | 14.01.01 D-08 / 14.07.01 D-01. |
| CX-17 | [14.01 Catalog & Compatibility](./14.01-catalog-compatibility/) | [14.06 Used Licence Transfer](./14.06-used-licence-transfer/) | Transfer policy is a required listing section, set at submission and displayed on the listing — defensible as consumer information at the point of a **new** purchase even where the used market never materialises. | Musician, Producer, Operator | Medium | 14.06.01 DT-01. Contingent on 14.06 Q-01/Q-08 (whether the used market is real). |
| CX-18 | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | [14.05 Beat Licensing](./14.05-beat-instrumental-licensing/) | Exclusive issuance is not an ordinary mint: it atomically terminates availability **and must NOT revoke prior non-exclusive leases** — grandfathering is the market norm and provenance-correct. | Musician, Producer | High | 14.05 DT-09/D-12. Distinct from CX-08 (vocabulary sharing): this is the exclusivity *race and grandfathering* rule. |
| CX-19 | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | [14.09 Refunds & Revocation](./14.09-digital-refunds-revocation/) | **Chargeback** is a new trigger distinct from refund — no vendor consent, no policy check, arriving up to 120 days (cards) / 13 months (SEPA) later, after payout. The terms registry's downstream-propagation signal gates auto-refundability, closing the buy→release→refund→free-clearance fraud vector. | Musician, Producer, Operator | High | 14.02.01 / 14.02.05 / 14.09.03. Revocation *appends* an event, never deletes. |
| CX-20 | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | [14.07 Monetisation](./14.07-monetisation-models-pricing/) | A bundle mints **N** entitlements, one per product, each carrying an *apportioned* price + currency. Without a per-entitlement allocated price, a partial refund of one bundle item has no correct amount and the pool cannot attribute revenue. | Musician, Producer | High | 14.07.04 / 14.02.01 DT-08/D-07. |
| CX-21 | [14.02 Licensing](./14.02-licensing-activation-entitlement/) | [14.10 Contributor Revenue](./14.10-contributor-revenue-royalty-pool/) | Payout settles against the *allocated* price per entitlement, not list price. Self-purchase and chargeback-reversed sales must be excluded — and chargebacks arrive **after** payout has already run. | Musician, Producer | High | 14.02.01 → 14.10 D-10/D-11. Timing hazard: the pool must reverse an already-settled share. |
| CX-22 | [14.08 Vendor Portal & QA](./14.08-vendor-portal-build-qa/) | [14.02 Licensing (Terms Registry)](./14.02-licensing-activation-entitlement/) | Vendor exit **tombstones** terms versions, never deletes them. A bound version is the holder's evidence and must outlive the vendor — deletion destroys the proof the feature exists to create, at the exact moment the vendor stops caring. | Musician, Producer, Operator | High | 14.02.05 D-09. Extends CX-04 (authoring) into the exit path. |
| CX-23 | [14.03 Delivery & Library](./14.03-delivery-versioning-library/) | [14.09 Refunds & Revocation](./14.09-digital-refunds-revocation/) | Revocation kills an in-flight transfer within 30 s (a resumed range request *is* a next download); the withdrawal waiver gates bytes structurally (no waiver → no grant → no bytes); and per-grant delivery telemetry is the evidence source for "did the buyer actually receive the goods?". | Musician, Producer, Operator, Fan | High | 14.03.01 → 14.09.01/02/03. Resolves 14.09.03 Q-01. |
| CX-24 | [14.03 Delivery & Library](./14.03-delivery-versioning-library/) | [14.04 Sound Content](./14.04-sound-content-catalogs/) | Delivered audio must be **written** with embedded tempo/key/loop metadata (ACIDized-WAV / Apple-Loops), not merely served — a DAW auto-stretches only if the file says its tempo. This lands on the *same* delivery step as per-buyer watermarking: two writers on one artifact. Pack revision is append-and-correct for existing buyers. | Musician, Producer | High | 14.04.01 DT-03 / 14.03.05 / 14.03.02 D-09. |
| CX-25 | [14.04 Sound Content](./14.04-sound-content-catalogs/) | [14.02 Licensing (Terms Registry)](./14.02-licensing-activation-entitlement/) | The clause set needs an explicit **master/publishing** distinction. "Royalty-free" is ambiguous between the recording and the underlying work; a melodic loop on a released song can raise a compositional claim the label never settled. | Musician, Producer | High | 14.04.01 DT-07. A structured clause, not a disclaimer. |
| CX-26 | [14.04 Sound Content](./14.04-sound-content-catalogs/) | [14.09 Refunds & Revocation](./14.09-digital-refunds-revocation/) | A rights **takedown** is not a refund revocation and needs the opposite posture: 14.09.03 D-01 says never overstate to a vendor; a takedown must never *understate* to a buyer. Every holder is notified naming the specific assets and reason. | Musician, Producer | High | 14.04.01 DT-05/D-08. |
| CX-27 | [14.04 Sound Content](./14.04-sound-content-catalogs/) | [14.08 Vendor Portal & QA](./14.08-vendor-portal-build-qa/) | **Two** attestations at submission, not one: "is this yours?" and "if any of it is licensed from elsewhere, does that licence permit resale inside a pack?". The second is the common failure — bedroom producers genuinely read "royalty-free" as "resellable". | Musician, Producer | High | 14.04.01 DT-06. The domain's central inbound exposure (DT-B) is captured here or not at all. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Licensing ↔ Delivery & Library

**Relationship**: The domain's spine. 14.02 mints and holds the entitlement; 14.03 renders it and serves bytes against it. Every download authorises live — state `active`, version permitted, waiver captured (14.09.01) — through a buyer-scoped URL stable for the grant's 72 h window, with per-request re-authorisation as the control. Revocation therefore lands on the *next* request even when it cannot reach a machine.

**Role scoping**:
- **Musician**: reinstalls a career's worth of tools on a new laptop years later; the check must still pass.
- **Producer**: fetches the same product to many machines routinely — must not read as abuse.
- **Operator**: fetches per room, often on a restricted network.
- **Fan**: traverses this same gate for music bought on an artist page (domain 20) — the acknowledged shared layer.

**Synthesis questions answered**:
1. **Shared state**: The entitlement is 14.02's; 14.03 reads only. Single writer.
2. **Trigger chain**: Request → entitlement check → waiver check → URL mint → transfer. Sync. Any check failing yields no URL, never a partial transfer.
3. **Permission intersection**: Total — 14.02's state directly gates bytes.
4. **Notification fan-out**: None on a normal download; treating a touring musician's new location as a threat is the wrong default.
5. **State-transition race**: Revocation racing an in-flight multi-GB transfer — resolved at CX-23 (killed within 30 s; the resumed range request re-authorises and fails).

---

### CX-02: Catalog & Compatibility ↔ Refunds

**Relationship**: 14.01.04's compatibility badge is a claim the store makes at the buy button; 14.09.02 later adjudicates a refund using that recorded claim as evidence. The adjudicable question in an "it doesn't work" dispute is not "is it compatible" but "what did we tell them" — the order's listing-revision snapshot plus the recorded verdict are that answer.

**Role scoping**:
- **Musician**: gets an answer instead of a negotiation.
- **Producer**: the persona most likely to have a legitimate "not as described" claim.
- **Operator**: per-room verdicts; a wrong badge multiplies across four rooms.
- **Fan**: not affected — fan purchases route through domain 20's policy.

**Synthesis questions answered**:
1. **Shared state**: The verdict is derived at read time (14.01.04) but snapshotted onto the order. That snapshot is the only durable copy and must be immutable.
2. **Trigger chain**: Purchase → verdict + listing revision recorded. Later: refund requested → snapshot read → policy applied. Days or months apart.
3. **Permission intersection**: A vendor's inaccurate matrix (14.01 Q-02) becomes the store's liability here — the pressure that should make matrices accurate.
4. **Notification fan-out**: A refund driven by a bad badge flags the vendor's matrix as inaccurate (a vendor-accuracy signal), not just refunds the buyer.
5. **State-transition race**: Matrix edited between purchase and refund — the snapshot governs, not the current matrix.

---

### CX-03: Licensing ↔ Used Licence Transfer

**Relationship**: 14.06's existence depends on 14.02.01 D-01 (the entitlement record is primary, the key is an artifact). A transfer changes the holder and carries across the bound terms (CX-13), version range and history — the inheritance is the transaction's legal basis. The purchaser/holder split (D-05) makes "who holds it now" expressible without losing "who bought it originally".

**Role scoping**:
- **Musician**: buys tools they could not otherwise afford; sells what they've moved on from.
- **Producer**: deepest library, most to resell.
- **Operator**: studio clear-outs — their one substantial presence in the domain.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state**: One entitlement, one holder. The escrow must hard-lock it — the same race class as CX-15's double-exclusive.
2. **Trigger chain**: Settlement → strip seller (via 14.09.03) → write buyer → vendor fee. Atomic or rolled back entirely. NFR grants (D-06) are non-transferable by origin.
3. **Permission intersection**: The **vendor** decides whether a holder may sell what they own (14.06.01) — ownership without alienation; the absent third party holds the veto.
4. **Notification fan-out**: Both parties at settlement; the vendor if approval is required.
5. **State-transition race**: Vendor policy changing mid-escrow (14.06 CX-01 q5).

---

### CX-04: Vendor Portal & QA ↔ Licensing

**Relationship**: Everything 14.02 enforces was captured at submission — terms (14.02.05), transfer policy (14.06.01), the rights attestation, the AI declaration. 14.08.01 is the domain's narrowest point: all supply passes through it, and any assurance not captured there is invented later or not at all. Terms are authored from templates (the vendor is a musician, not a lawyer); a custom clause contradicting a structured clause is rejected.

**Role scoping**:
- **Musician**: the realistic vendor — a musician with a folder, not a software company.
- **Producer**: the archetypal vendor and the only one plausibly shipping code.
- **Operator**: config-level; org vendor identity is blocked on 14.02 Q-03.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state**: Submission authors; licensing reads and freezes at issuance. Snapshot failure must fail issuance — an entitlement with no terms is unenforceable.
2. **Trigger chain**: Submit → QA → publish → (later) purchase → the *rendered* terms version is frozen onto the entitlement (not whatever is current at commit).
3. **Permission intersection**: A vendor's authoring rights never extend to already-bound terms versions. That is the whole point.
4. **Notification fan-out**: New terms notify existing holders informationally — and must not read as a change to their rights.
5. **State-transition race**: Terms edited during a checkout — bind what was displayed, not what is current at commit.

---

### CX-05: Vendor Portal & QA ↔ Monetisation

**Relationship**: Vendor exit (14.08.05) is where every monetisation model's unexamined assumption — that the vendor still exists — fails at once. Perpetual becomes the platform's sole obligation (14.07.01 DT-01). Rent-to-own mid-schedule has no answer in the market. Transfer approval freezes forever.

**Role scoping**:
- **Musician**: 6 of 12 payments into a tool whose maker has gone.
- **Producer**: same at higher values.
- **Operator**: rooms run exited vendors' tools routinely — Tuesday, not a hypothetical.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state**: Continuity obligations are agreed at onboarding (14.08 CX-05) and read at exit, years apart.
2. **Trigger chain**: Exit → delist → obligations enforced. Rent-to-own schedules in flight have **no defined behaviour** — an open gap.
3. **Permission intersection**: A vendor cannot delete artifacts buyers hold perpetual rights to — structurally, not by policy (14.08.05 D-02).
4. **Notification fan-out**: All holders: "no longer sold — your access is unaffected".
5. **State-transition race**: Exit racing an in-flight rent-to-own payment or a pending transfer.

---

### CX-06: Sound Content ↔ Contributor Revenue

**Relationship**: The pool pays for packs; packs are made by several people. 14.10.03 is the join, and without it the money goes to whoever clicked upload — reproducing, inside our own marketplace, the exact failure D-18 says the platform exists to fix. Critically, a split captures the **percentage, not the permission**: a session drummer consented to being on a record, not to being sold as a commercial sample pack in perpetuity.

**Role scoping**:
- **Musician**: the drummer whose kit samples are in a friend's pack — the contributor this protects.
- **Producer**: the pack owner who proposes the split and holds the power.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: The pack is 14.04's product; the split is 14.10's — and per 14.10.03 DT-03 the split arguably belongs to domain 02/09 entirely (a credits object, not a listing field).
2. **Trigger chain**: Submission → split proposed → confirmed. Period close → accrual valued → split applied → payout. Payout blocks on an unagreed split (14.10.03 D-02).
3. **Permission intersection**: Nobody joins a split without confirming; the pack owner cannot unilaterally name shares. The consent is to *resale as a pack*, a materially different grant from the original session consent.
4. **Notification fan-out**: All contributors on proposal, confirmation and statement.
5. **State-transition race**: Split edited after a period closed — frozen per period, edits forward only.

---

### CX-07: Monetisation ↔ Contributor Revenue

**Relationship**: A strict dependency. The pool exists only because the credit model breaks the link between payment and sale. If the store sells packs perpetually — what creator content sells as, and what 14.07 Q-01 recommends at launch — every download has a sale attached and 14.10 does not exist.

**Role scoping**: See 14.10's Role Matrix — Reports-only for Musician and Producer, absent for Operator and Fan.

**Synthesis questions answered**:
1. **Shared state**: None — 14.07 produces revenue, 14.10 distributes a share of it.
2. **Trigger chain**: Subscribe → pool funded. Credit spent → accrual. Period close → payout.
3. **Permission intersection**: None new.
4. **Notification fan-out**: Statements at period close.
5. **State-transition race**: Credit farming (14.07.02) dilutes every honest contributor's pro-rata share — a pool-integrity issue, not just abuse.

---

### CX-08: Beat Licensing ↔ Licensing

**Relationship**: A beat lease tier is a terms bundle with a price (14.05 D-03). Expressing tiers through 14.02.05 means a track cleared against a beat lease and one cleared against a sample pack use the same clearance chain into domain 09. Beat leases are the primary source of `term_length` and `stream_cap` — the two clauses that make the model breach-able.

**Role scoping**:
- **Musician**: the artist whose released record carries the lease's caps.
- **Producer**: the beatmaker defining tiers.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: One terms vocabulary, two consumers. Tiers are bound and frozen at purchase like any terms.
2. **Trigger chain**: Tier purchased → lease minted with caps → terms frozen.
3. **Permission intersection**: A producer cannot retroactively tighten a bound tier.
4. **Notification fan-out**: Cap-approach warnings (14.05.03).
5. **State-transition race**: None at purchase (exclusivity race is CX-18, not this vocabulary edge).

---

### CX-09: Catalog & Compatibility ↔ Sound Content

**Relationship**: 14.01.03's dependency graph matters most for content, not software. A compressor runs standalone; a Serum bank without Serum is unreadable text; a project template is mostly pointers to other people's products. 14.04.03's manifest is a many-edge instance of the same graph. The unknown dependency state (Kontakt-full vs Player) is the *common* case, so the listing needs honest copy for it, never a fallback to green.

**Role scoping**:
- **Musician**: the Kontakt-Player-vs-full failure, the market's most common return.
- **Producer**: needs cart-level rollup — "what does this basket require that I lack?"
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: 14.01.03 owns the graph; 14.04.03 owns the missing-deps-to-cart flow.
2. **Trigger chain**: Buying a dependency re-evaluates dependents (14.01 CX-02).
3. **Permission intersection**: Owning a template does not license its dependencies (14.04 CX-04) — the trap.
4. **Notification fan-out**: "3 wishlisted items now run" is a real merchandising moment.
5. **State-transition race**: A lapsed subscription un-satisfying a perpetual product's dependency (14.07.01 Q-03).

---

### CX-10: Delivery & Library ↔ Vendor Portal & QA

**Relationship**: Mutual precondition. Rollback (14.08.04) is meaningless without the archive (14.03.02) to roll back *to*; the archive is inert without rollout able to halt a bad build spreading. A withdrawal must carry a **reason** so delivery can branch — a withdrawal that cannot say *why* forces delivery to serve malware and supersession identically. Together they are the domain's only answer to its most likely incident — a v3 that changes a sound and lands on everyone mid-album.

**Role scoping**:
- **Producer**: vendor and victim, the same human.
- **Operator**: wants the slowest channel; rooms update on maintenance windows.
- **Musician**: default channel, unaware.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state**: Versions are immutable once published; the channel assignment is separate state.
2. **Trigger chain**: QA pass → channel → progressive offer → (adverse signal) → halt → rollback → archive serves the previous build. A rights-infringing or malicious build must NOT complete an in-flight download (14.03.01 DT-05 overrides the "let it finish" default).
3. **Permission intersection**: The channel is **buyer-selected** (14.08.04 D-01) — an inversion of the app-store model, because only the buyer knows they are mid-album.
4. **Notification fan-out**: Progressive by cohort; release notes must describe what changed *musically* (14.03.02 D-03).
5. **State-transition race**: Rollback racing an in-flight download — the download completes for a *benign* supersession; a *harmful* withdrawal terminates it (the reason decides).

---

### CX-11: Used Licence Transfer ↔ Refunds

**Relationship**: Medium confidence. 14.06.02 reuses 14.09.03's clawback to strip the seller, deliberately rather than inventing a second stripping path (14.06 R-02). It inherits the same physics: under fail-open (14.02.02 D-01), a seller's offline machine keeps running after they sold the licence.

**Role scoping**: `[PENDING — contingent on 14.06 Q-01]`

**Synthesis questions**: Deferred — Medium confidence, contingent on whether the used market is real enough for the escrow to exist at all (14.06 Q-01 / domain Q-08).

---

### CX-12: Catalog & Compatibility ↔ Vendor Portal & QA

**Relationship**: The listing's shape is authored at the vendor portal and validated by QA. 14.08.01 D-02 ("required sections are type-conditional") and 14.01.01 D-02 are the *same decision seen from two sides* — the portal owns the flow, the catalog owns the record's schema. QA cross-checks the declared manifest and matrix against the actual artifact (asymmetry: under-declaration prompts, over-declaration blocks). Vendor exit produces **two** distinct delisted states — retirement vs removal-for-cause (14.08.05 D-03) — and the listing must render each differently, because "no longer available" is wrong half the time.

**Role scoping**:
- **Musician**: the folder-vendor whose submission becomes the listing.
- **Producer**: the archetypal vendor; the only one shipping executable artifacts QA can partly verify.
- **Operator**: config-level.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state**: The listing record — authored at 14.08.01, validated at 14.08.02, presented by 14.01.01. One writer (submission), one validator, one renderer.
2. **Trigger chain**: Submit → QA cross-check (manifest + matrix vs artifact) → publish → listing live. Publish is *gated* on QA. Exit → retirement or removal-for-cause → the corresponding delisted state on the listing.
3. **Permission intersection**: How far QA's read overrides the vendor's declaration for non-executable types is open (14.08.02 Q-01) — QA can inspect a plugin binary, not a producer's claim about a WAV's provenance.
4. **Notification fan-out**: Under-declaration → a prompt to the vendor; over-declaration → publish blocked. Removal-for-cause → an active alert to holders (see CX-26); retirement → a passive library-row state.
5. **State-transition race**: A matrix edited during QA; the QA verdict binds the artifact that was scanned.

---

### CX-13: Catalog & Compatibility ↔ Licensing (Terms Registry)

**Relationship**: THE THESIS TOUCHPOINT (DT-04). Bound terms are a required listing section; they bind at purchase and are immutable thereafter (14.02.05 D-02). This drives the asymmetric cart rule (14.01.01 D-04): **price locks in the cart for the hold window, but terms do not** — if a vendor revises terms while an item sits in a cart, the buyer hits a consent break rather than silently buying different terms. D-05's revision snapshot is what makes "which terms did they agree to" answerable years later.

**Role scoping**:
- **Musician**: sees the terms before the buy button; the revision they agreed to is the one that clears their record.
- **Producer**: both buyer and, as vendor, the author of the terms shown.
- **Operator**: org-held purchase; the terms bind the org principal.
- **Fan**: never sees this — fan purchases bind a platform consumer licence (domain 20), not vendor terms.

**Synthesis questions answered**:
1. **Shared state**: The terms *version* is owned by 14.02.05; the listing renders the current version and freezes the rendered one at purchase. Single source of truth.
2. **Trigger chain**: Listing renders terms vX → add to cart → (vendor revises to vY) → consent break at the cart → buyer re-agrees or abandons → purchase freezes the *agreed* version onto the entitlement.
3. **Permission intersection**: A vendor may revise terms for *future* buyers but can never touch a version already bound (CX-04). The cart is the boundary where "future" starts.
4. **Notification fan-out**: Terms-changed-in-cart notifies the buyer (consent break); the CX-01 matrix-flip notification is a sibling event.
5. **State-transition race**: Price drops *and* terms change simultaneously while in cart — price re-prices downward immediately and silently; terms force a consent break. Two different rules on the same cart line, deliberately.

---

### CX-14: Catalog & Compatibility ↔ Delivery & Library

**Relationship**: The listing is the durable record; versions come and go beneath it (14.03.02 D-01 keeps every entitled version fetchable). The buyer-state rendering table (DT-03) — "You own this", "Upgrade available", "Delisted but yours" — cannot be resolved without reading owned state from the library (14.03.03). The listing **reads** owned state; it never writes it. This is what keeps a delisted listing's owner-view functional rather than decorative.

**Role scoping**:
- **Musician**: sees "You own this — reinstall" on a listing whose current version they don't hold.
- **Producer**: the version-range Upgrade row (CX-16) is rendered from owned state.
- **Operator**: org-held ownership → a whole room sees "You own this" (a room's licence is not a person's).
- **Fan**: the "my purchases" view is this machinery with ~90% of columns removed (see cross-domain 20).

**Synthesis questions answered**:
1. **Shared state**: The entitlement + owned-version set is 14.02/14.03's; the listing reads it. No write path from catalog to library.
2. **Trigger chain**: Render listing → read owned state → resolve buyer-state row. Sync, read-only.
3. **Permission intersection**: Owned state is scoped to the *holder principal* (person or org); an org member sees the org's ownership.
4. **Notification fan-out**: None on render.
5. **State-transition race**: A version delisted between render and click — the owner-view stays valid because every entitled version remains fetchable.

---

### CX-15: Catalog & Compatibility ↔ Beat Licensing

**Relationship**: An exclusive beat sale delists the listing **atomically** (14.05.02 D-01) — the only transaction on the platform where a purchase destroys its own product. It can invalidate other buyers' in-flight carts holding the same exclusive: the sharpest concurrency case the listing must survive.

**Role scoping**:
- **Musician**: two artists both hold the same exclusive beat in-cart; one wins, one gets a hard "sold" state mid-checkout.
- **Producer**: the beatmaker whose one-time exclusive sale must be irreversible and unambiguous.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: The listing's availability is the contested resource. The exclusive sale is the single writer that flips it; carts are readers that must revalidate.
2. **Trigger chain**: Exclusive checkout commits → listing delists atomically → all other in-flight carts holding it are invalidated → those buyers see "exclusive sold during checkout". Prior non-exclusive leases are NOT revoked (CX-18).
3. **Permission intersection**: Only the current rights-holder can issue the exclusive; the atomic delist is a consequence, not a separate permission.
4. **Notification fan-out**: Exclusive-sold-during-checkout to the losing buyers; sale confirmation to the winner and vendor.
5. **State-transition race**: Two exclusive checkouts on the same beat — hard-locked so exactly one commits (same race class as CX-03's escrow lock).

---

### CX-16: Catalog & Compatibility ↔ Monetisation

**Relationship**: The monetisation model is a required listing section (14.01.01 D-08); price is per-tier for beats. The version-range field displayed at original purchase (14.07.01 D-01) is what makes the buyer-state **Upgrade** row expressible — without a recorded version range, "you own v1–v2, upgrade to v3" has no anchor.

**Role scoping**:
- **Musician**: sees the model (perpetual / lease tier) on the listing before buying.
- **Producer**: as vendor, sets the model; as buyer, sees the Upgrade path.
- **Operator**: model drives per-room cost.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state**: The model + price is authored via 14.07 and rendered by 14.01; the version range is recorded at purchase and read by the buyer-state table.
2. **Trigger chain**: Purchase → version range recorded on the entitlement → later render resolves Upgrade eligibility.
3. **Permission intersection**: Only perpetual/tier models the vendor enabled are purchasable; the listing cannot offer a model 14.07 did not configure.
4. **Notification fan-out**: "Upgrade available" when a new version exceeds the owned range.
5. **State-transition race**: Model changed on the listing while in cart — same asymmetric rule as CX-13 (price re-prices; a model change that alters terms forces a consent break).

---

### CX-17: Catalog & Compatibility ↔ Used Licence Transfer

**Relationship**: Medium confidence. Transfer policy is a required listing section set at submission (14.06.01) and displayed on the listing. Per 14.06.01 DT-01 the registry is defensible as *consumer information at the point of a new purchase* — "this licence is/ is not resellable" — even in a world where the used market never materialises.

**Role scoping**: `[PARTIAL — full scoping contingent on 14.06 Q-01/Q-08]`
- **Musician / Producer / Operator**: see the transfer policy before buying, informing whether a licence retains resale value.
- **Fan**: no column.

**Synthesis questions**: Deferred — Medium confidence. The display edge is real regardless; the transactional edges (CX-03, CX-11) are contingent on whether the used market is real enough to build the escrow.

---

### CX-18: Licensing ↔ Beat Licensing (Exclusivity & Grandfathering)

**Relationship**: Exclusive issuance is not an ordinary mint (14.05 DT-09/D-12). It atomically terminates the product's availability **and must NOT revoke prior non-exclusive leases** — grandfathering is the market norm and provenance-correct: voiding a lease an artist already released on would break their record retroactively. Distinct from CX-08 (which shares the terms *vocabulary*); this is the exclusivity *state rule*.

**Role scoping**:
- **Musician**: an artist holding an old non-exclusive lease keeps it after someone else buys the exclusive.
- **Producer**: the beatmaker converting a beat to exclusive, aware prior leases survive.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: The beat's availability + the set of outstanding leases. Exclusive issuance writes availability=closed but does not touch existing lease entitlements.
2. **Trigger chain**: Exclusive purchased → availability closed atomically (CX-15) → prior non-exclusive leases explicitly preserved → exclusive entitlement minted. All-or-nothing.
3. **Permission intersection**: The exclusive holder gains no power to revoke grandfathered leases; those are prior grants the vendor already made.
4. **Notification fan-out**: Prior lease-holders may be informed the beat is now exclusive (their rights unaffected); the exclusive buyer sees the grandfathered leases as a disclosed encumbrance.
5. **State-transition race**: A non-exclusive lease checkout racing an exclusive checkout — resolved at the same hard-lock as CX-15; if the exclusive commits first, the pending lease is refused, not grandfathered.

---

### CX-19: Licensing ↔ Refunds & Revocation (Chargeback)

**Relationship**: A **chargeback** is a new trigger, distinct from `refund` — 14.09.03 currently enumerates refund / transfer / hardware-return only. A chargeback has no vendor consent, no policy check, and arrives up to 120 days (cards) or 13 months (SEPA unauthorised) later — after payout. Separately, the terms registry exposes a `downstream_propagation` signal (placement + release-clearance counts) that refund eligibility reads: a *propagated* entitlement is not auto-refundable, closing the buy→release→refund→free-clearance fraud vector. Revocation **appends** an event; it never deletes.

**Role scoping**:
- **Musician**: an honest buyer whose card issuer reverses a legitimate purchase — the entitlement must reflect the reversal without destroying evidence.
- **Producer**: the vendor whose already-paid earnings must be clawed back on a chargeback.
- **Operator**: org-held purchase reversed at the org level.
- **Fan**: chargebacks on fan purchases adjudicate under domain 20's policy, same rail.

**Synthesis questions answered**:
1. **Shared state**: The entitlement's lifecycle state (14.02) and the refund/revocation ledger (14.09). Revocation appends; the entitlement is never hard-deleted (it is evidence).
2. **Trigger chain**: Chargeback received (async, months later) → entitlement → `revoked/reversed` → clawback cascades to the contributor pool (CX-21), which may already have settled. Compensating reversal, not rollback.
3. **Permission intersection**: A propagated entitlement (used in a release) is not auto-refundable — the propagation signal gates the discretionary path; the statutory floor still applies via 14.09.02.
4. **Notification fan-out**: Buyer, vendor, and any contributors whose settled share is reversed. Every refusal carries an appeal route (14.09.02 D-04 → domain 24).
5. **State-transition race**: Chargeback arriving after the entitlement was transferred (14.06) or used in a release (12) — revocation lands on the current holder / flags the release; the append-only ledger preserves the full history.

---

### CX-20: Licensing ↔ Monetisation (Bundles)

**Relationship**: A bundle mints **N** entitlements — one per product — each carrying an *apportioned* price + currency (14.07.04 / 14.02.01 DT-08/D-07). Without a per-entitlement allocated price, a partial refund of one bundle item has no correct amount, and the contributor pool (CX-21) cannot attribute revenue to the right pack.

**Role scoping**:
- **Musician**: buys a 5-pack bundle, refunds one item — the refund is the item's *allocated* share, not 1/5 of the sticker.
- **Producer**: as a vendor in a multi-vendor bundle, earns against the allocated price of their item.
- **Operator / Fan**: bundles are creator-content territory; thin here.

**Synthesis questions answered**:
1. **Shared state**: The bundle order line (14.07) and the N entitlements (14.02). The allocation is computed once at purchase and frozen per entitlement.
2. **Trigger chain**: Bundle purchased → apportion price across N items → mint N entitlements each with allocated price + currency → each is independently refundable/transferable.
3. **Permission intersection**: Each entitlement's terms are its own product's terms; the bundle is a pricing wrapper, not a terms object.
4. **Notification fan-out**: Standard per-entitlement; a partial refund notifies only the affected item's vendor/contributors.
5. **State-transition race**: Two items in one bundle refunded concurrently — each operates on its own entitlement + allocated amount; no shared mutable total.

---

### CX-21: Licensing ↔ Contributor Revenue (Attribution & Timing)

**Relationship**: Payout settles against the **allocated** price per entitlement (CX-20), not list price. Self-purchase (14.10 D-11) and chargeback-reversed sales (D-10) must be excluded from earnings — and chargebacks (CX-19) arrive *after* payout has already run, so the pool must be able to reverse an already-settled share.

**Role scoping**:
- **Musician / Producer**: contributors whose earnings must exclude self-purchases and survive downstream reversals.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: The entitlement's allocated price + payment state (14.02) is the input; the accrual ledger (14.10) is the consumer. The ledger is append-only with compensating reversals.
2. **Trigger chain**: Sale captured → accrual valued at allocated price → period close → payout. Later: chargeback → negative accrual against a *future* period (never a clawback of cash already paid, where avoidable).
3. **Permission intersection**: Self-purchase detection excludes a contributor buying their own pack from their earnings.
4. **Notification fan-out**: Statements at period close; a reversal notice when a settled share is negatively adjusted.
5. **State-transition race**: Chargeback landing between accrual and payout — excluded before payout; landing after payout — reversed against the next period.

---

### CX-22: Vendor Portal & QA ↔ Licensing (Terms Tombstoning at Exit)

**Relationship**: Vendor exit **tombstones** terms versions, never deletes them (14.02.05 D-09). A bound version is the holder's evidence and must outlive the vendor — deletion destroys the proof the feature exists to create, at exactly the moment the vendor stops caring (which is when the holder needs it most). Extends CX-04 (authoring) into the exit path.

**Role scoping**:
- **Musician / Producer / Operator**: a holder whose clearance evidence must survive the vendor's departure.
- **Fan**: no column.

**Synthesis questions answered**:
1. **Shared state**: The terms version registry (14.02.05). Exit sets a tombstone flag; bound versions remain readable forever.
2. **Trigger chain**: Vendor exit (14.08.05) → tombstone terms versions → holders' bound versions stay resolvable → clearance chains (domain 09) still cite them.
3. **Permission intersection**: A departed vendor cannot delete or edit tombstoned versions; the platform holds them as evidence, not the vendor.
4. **Notification fan-out**: Holders informed the vendor has left and their rights are unaffected (CX-05 wording).
5. **State-transition race**: Exit racing an in-flight purchase binding the terms version — the bind completes; the tombstone applies to *new* availability only.

---

### CX-23: Delivery & Library ↔ Refunds & Revocation

**Relationship**: Three edges on the delivery gate. (a) Revocation kills an in-flight transfer within 30 s — a resumed range request *is* a next download and re-authorises per 14.09.03 D-02, so no new rule is needed; this resolves 14.09.03 Q-01. (b) The withdrawal waiver (14.09.01) gates bytes **structurally** — no waiver, no transfer grant, no bytes. (c) Per-grant delivery telemetry (bytes served, ranges, completion, verification) is the evidence source for "did the buyer actually receive the goods?" — a question 14.09.02 must answer and previously had no source for.

**Role scoping**:
- **Musician**: reinstalls; the waiver gate fires once, the telemetry backs any later "it never downloaded" claim.
- **Producer**: many machines; each grant's telemetry is per-grant.
- **Operator**: per-room fetch on a restricted network — resumability + telemetry matter most here.
- **Fan**: the same gate fires on fan music purchases (14.03.01 E-24), waiver in plain language (domain 20).

**Synthesis questions answered**:
1. **Shared state**: The grant (14.03) carries telemetry; the entitlement state (14.02/14.09) gates it. Delivery reads state, writes telemetry.
2. **Trigger chain**: Waiver captured → grant issued → bytes served + telemetry recorded. Revocation → next request (incl. a resume) re-authorises and fails within 30 s.
3. **Permission intersection**: No waiver ⇒ no grant ⇒ no bytes — the download is the legally significant moment, not checkout.
4. **Notification fan-out**: None on normal delivery; a refused resume after revocation may notify the buyer.
5. **State-transition race**: Revocation racing a multi-GB in-flight transfer — the resumed range request is the interception point; the partial is abandoned.

---

### CX-24: Delivery & Library ↔ Sound Content (Delivery-Time Writes)

**Relationship**: Delivered audio must be **written** with embedded tempo/key/loop metadata (ACIDized-WAV / Apple-Loops convention), not merely served — a DAW auto-stretches a loop only if the file says its tempo (14.04.01 DT-03). This write lands on the *same* delivery step as per-buyer forensic watermarking (14.03.05): **two writers on one artifact**. Pack revision is append-and-correct for existing buyers, versioned for new ones — a revision never removes a held asset (14.03 CX-06).

**Role scoping**:
- **Musician**: drops a loop into a DAW and it stretches to project tempo because the metadata is embedded.
- **Producer**: as buyer benefits; as vendor, the revision path preserves what existing buyers hold.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: The delivered artifact bytes. Two writers — metadata embedding (14.04) and watermarking (14.03.05) — must compose deterministically; the watermark must survive the metadata write and (per 14.03.05 Q-01) ideally time-stretch.
2. **Trigger chain**: Grant issued → embed tempo/key/loop metadata → apply per-buyer watermark → serve. Ordering matters: the watermark is deterministic per grant (14.03.05 DT-03) so resume can realign.
3. **Permission intersection**: Both writes happen only for an entitled grant; neither is a separate permission.
4. **Notification fan-out**: None per delivery; a pack revision notifies existing buyers (append, no removal).
5. **State-transition race**: A pack revised mid-delivery — the in-flight grant completes the version it started; new buyers get the revision.

---

### CX-25: Sound Content ↔ Licensing (Master/Publishing Distinction)

**Relationship**: The clause set needs an explicit **master/publishing** distinction (14.04.01 DT-07). "Royalty-free" is ambiguous between the recording (master) and the underlying work (publishing/composition); a melodic loop on a released song can raise a *compositional* claim the label never settled — some sample labels claim a writer share on exactly this basis. This is a structured clause in 14.02.05, not a disclaimer.

**Role scoping**:
- **Musician**: buys a "royalty-free" melodic loop, later faces a publishing claim they thought they'd cleared.
- **Producer**: as vendor, must attest what "royalty-free" covers; as buyer, needs the distinction surfaced.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: The terms registry's clause vocabulary (14.02.05) gains master vs publishing scope. Owned by 14.02.05; 14.04 supplies the requirement.
2. **Trigger chain**: Pack authored → master/publishing scope declared per clause → bound at purchase → propagates as clearance (domain 09) carrying the *scope*, not a blanket "royalty-free".
3. **Permission intersection**: A master licence does not grant compositional rights; the clause makes the gap explicit rather than implied.
4. **Notification fan-out**: None at purchase; a downstream publishing claim (domain 09/24) references the bound clause.
5. **State-transition race**: None — the distinction is authored, not concurrent.

---

### CX-26: Sound Content ↔ Refunds & Revocation (Takedown Posture)

**Relationship**: A rights **takedown** is not a refund revocation and needs the opposite posture. 14.09.03 D-01 says never *overstate* to a vendor; a takedown must never *understate* to a buyer. Every holder is notified naming the specific assets and the reason (14.04.01 D-08) — because the buyer's record may already be released and their ability to act depends on being told precisely what is affected.

**Role scoping**:
- **Musician**: a holder whose released record contains a taken-down asset — needs the specific asset and reason, not a vague "rights issue".
- **Producer**: the vendor whose infringing pack triggers the takedown.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: The asset's rights status (14.04/24) and every entitlement bound to it (14.02). A takedown flags the asset and enumerates holders.
2. **Trigger chain**: Rights claim upheld (domain 24) → asset taken down → blast-radius enumeration → every holder notified individually with asset + reason → buyers may clear retroactively, replace, or pull (domain 12).
3. **Permission intersection**: The takedown removes the *grant*, not the buyer's evidence; the entitlement is revoked (appended), the record of what they were told stands.
4. **Notification fan-out**: Maximal and specific — the opposite of a refund's minimal-disclosure default. On the fan path (domain 20) too, in a different tone.
5. **State-transition race**: A takedown reaching an already-released record — the buyer is told so they can act; the release's clearance record (12) is flagged out-of-clearance.

---

### CX-27: Sound Content ↔ Vendor Portal & QA (Two-Part Attestation)

**Relationship**: **Two** attestations at submission, not one (14.04.01 DT-06): "is this yours?" and "if any of it is licensed from elsewhere, does that licence permit resale inside a pack?". The second is the *common* failure — bedroom producers genuinely read "royalty-free" as "resellable" — and it is the domain's central inbound exposure (DT-B), captured here or nowhere.

**Role scoping**:
- **Musician / Producer**: the folder-vendor who must attest both ownership and resale permission.
- **Operator / Fan**: no columns.

**Synthesis questions answered**:
1. **Shared state**: The attestation record (14.08.01), attributable to a verified identity (domain 01). Two boolean+scope attestations, not one.
2. **Trigger chain**: Submit pack → attest ownership → attest resale permission for any third-party-licensed material → QA (14.08.02) verifies what it can → publish. A false resale attestation is the fraud that a takedown (CX-26) later unwinds.
3. **Permission intersection**: The attestation binds a platform identity backed by a KYC-verified legal identity (domain 01); the legal name never renders (PII).
4. **Notification fan-out**: None at submission; a later contradiction triggers the takedown/blast-radius path.
5. **State-transition race**: None — attestation is a submission-time capture.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 14.05 Beat Licensing | 14.06 Used Licence Transfer | A beat lease is not transferable and the idea is incoherent rather than merely unsupported: a lease is a licence to *a specific artist* to release *their* record, bound to them. There is no "used beat lease" to sell. Exclusive beat ownership (14.05.02) *could* be resold, but that is a copyright assignment in domain 09, not a licence transfer in 14.06. |
| R-02 | 14.04 Sound Content | 14.06 Used Licence Transfer | Nobody resells a £15 sample pack, structurally: the transaction costs (escrow, policy check, vendor fee, clawback) exceed the goods' value, and pack terms forbid redistribution in isolation anyway (14.02.05). Recorded because "new and used" (D-05) tempts a blanket application of 14.06 onto precisely the inventory the store actually has, where it buys nothing. |
| R-03 | 14.10 Contributor Revenue | 14.09 Refunds | The pool is funded by subscription revenue (CX-07), not by pack sales — so a refunded *sale* never entered the pool and cannot be reversed out of it. The genuine adjacent problem is credit-farming clawback (14.07.02), an attribution correction, not a refund. Note: this is distinct from CX-21, where a *chargeback on an entitlement* does reverse a contributor accrual — that reversal flows through the entitlement/allocated-price path, not through the subscription pool. |
| R-04 | 14.03 Delivery & Library | 14.05 Beat Licensing | Beat delivery mostly routes through 14.03's machinery, but the *interesting* part — tier-gated untagged artifacts (14.05.04) — is a beat-licensing concern, not a delivery one. 14.03 serves the bytes exactly as it serves anything else, via CX-01's gate. A distinct edge would imply beats need special *delivery*; they need special *unlocking*, which lives where the tiers live. |
| R-05 | 14.01 Catalog & Compatibility | 14.10 Contributor Revenue | A pack's spec sheet and its contributor payouts never read each other. Tempting because both attach to "the pack", but the listing is a *product* description and the pool distributes to *people* — per 14.10.03 DT-03 the payee list is a credits object (domain 02/09), not a listing field. An edge here invites modelling contributors as listing metadata, the single-payee mistake 14.10.03 rejects. |
| R-06 | 14.01 Catalog & Compatibility | 14.01.04 Rig Profile & Checker | Recorded to prevent a false coupling at feature granularity (14.01 CX R-01): the listing does not read the rig. The checker reads *both* the listing's matrix and the saved rig, and renders the verdict *into* the listing. The direction matters — an edge the wrong way would put rig-reading logic in the listing. |
| R-07 | 14.02 Licensing (Terms) | 14.02.02 Activation & Seats | NULL relationship (14.02 CX R-01): terms govern *output* (what you may do with the sound), seats govern *machines* (how many installs). No terms clause is enforceable by an activation check, and coupling them would imply the platform can technically enforce usage rights it cannot. Recorded so a spec writer does not build the bridge. |

---

## Cross-Cuts Escalated to the Global CX

> Mechanisms discovered during this domain's classification that serve **many** domains. Per the Node Classification Gate these are **not** nodes in domain 14 — recorded here so `ideation-cx.md` can absorb them. Domain 14 is a consumer of each.

| Mechanism | Serves | Why it is a cross-cut, not a node here |
|---|---|---|
| **AI Provenance & Disclosure Attestation** | 07, 09, 12, 14, 24 | Candidate 24 — an attestation attached to an asset that propagates downstream. Identical need for AI stems in projects, AI content at release, and rights. Domain 14's touchpoint is capture at submission (14.08.01). Per 14.02.05 DT-07/D-12 it lands as **two** clauses: `ai_training_permitted` (a permission governing the buyer) and `disclosure_ai_generated` (a vendor-attested fact propagating as a disclosure obligation). |
| **Audio Audition Player** | 05, 07, 14, 20 | Auditioning a loop, a portfolio track, a project bounce or a release is one player. Domain 14's *catalog* audition (per-file, key/BPM-aware) is domain-specific; the player is not. |
| **Cart, Checkout & Payments** | 05, 13, 14, 17, 19, 20 | The cart is the only thing 13 and 14 share (D-14). Domain 14 places **new obligations** on the rail: a 7-day per-line price hold; an accept-new-price gate at expiry; immediate downward re-price; a terms-changed consent break (CX-13); **idempotency on the order line** (PSP retries / double-clicks must not mint duplicates); and **async-capture confirmation** for SEPA/BNPL (no atomic capture moment ⇒ a `pending-payment` entitlement state). Settlement semantics are domain-owned. |
| **Multi-vendor Payouts, Escrow & KYC** | 05, 13, 14, 17 | Moves money to vendors and contributors. Domain 14 decides amounts (14.10, allocated price) and conditions (14.06.02); it does not move money. **Post-payout chargeback reversal** (CX-19/21) is a new demand on this rail — a clawback arriving months after settlement. |
| **Marketplace Search, Faceting & Discovery** | 05, 13, 14, 16 | Finds *listings* from their structured fields (D-01's justification). Distinct from 14.04.04, which indexes listings' *contents* with relational musical facets. Both exist. |
| **Reviews & Ratings** | 05, 13, 14, 16 | Never surfaced as a candidate here — itself notable. The listing reserves the surface but must NOT depend on it (DT-06): a new store's listings have zero reviews for months, which is why the identity block (D-07), honest demo (D-06) and compatibility badge are load-bearing. |
| **Disputes & Case Management** | 05, 13, 14, 19, 24 | Appeals against revocation (14.09.03), blacklisting (14.02.04), failed transfers (14.06.02), chargebacks, and trademark/rights complaints against a listing are all *cases* — routed here, NOT to a publish gate (nominative use: a Serum preset pack must say "Serum"). 14.09 owns digital refund policy; 24 owns the case machinery. |
| **Marketplace Facilitator Tax / VAT / GST** | 05, 13, 14, 19 | Digital goods carry a specific nasty: **place of supply is the buyer's location** (EU VAT MOSS), unlike gear. The listing's displayed price must resolve **per-buyer**, not per-vendor. |
| **Notifications** | All | Fan-out from listing/entitlement state changes: price-hold expiry, terms-changed-in-cart, listing paused (payout lapse), delist-while-in-cart, exclusive-sold-during-checkout, matrix-flip on a wishlisted item, update available, lease expiring (14.05.03), cap approaching, trial ending (14.02.06). Retirement is a passive library-row state; removal-for-cause is an active alert — the notification layer must distinguish the two so tone tracks obligation. |
| **Statutory Withdrawal-Waiver Gate** *(candidate — see emergent cross-cuts)* | 14, 20 | The EU distance-selling withdrawal waiver fired at first delivery (not checkout) on the shared delivery layer, for both professional (14) and fan (20) purchases. Legal artifact, not product copy; wording routes to `/create-prd`. |

## Not-Product Concerns Routed Out

> Architecture and NFR discovered during classification, recorded per `constraints.md`'s "Architecture Concerns Reclassified Out of the Product" precedent.

| Concern | Routed To | Why |
|---|---|---|
| Licence key cryptography & activation-server design | `/create-prd-security` | The *product* half (seat management, blacklisting UX, offline flow) stays in 14.02. The crypto and server design are architecture — 14.02 Q-01 asks whether the server should exist at all. |
| Edge/CDN strategy for multi-GB assets under per-buyer watermarking + metadata writes | `/create-prd-architecture` | CX-24: per-buyer artifacts are uncacheable (two writers), colliding with the locked Cloudflare constraint on the largest files. |
| Storage & egress cost model for perpetual obligations | `/create-prd` | 14.03.01 DT-02 / 14.07.01 DT-01: an unbounded liability sold at a one-time price. A departed vendor's 100 GB catalog held in archival tiers forever (cold-storage restore latency lands hardest at 14.03.01 / 14.08.05). |
| Malware scanner selection & notarisation verification | `/create-prd-security` | The gate is product (14.08.02); the scanner choice is architecture. |
| DAW session-format parsing (Ableton/Logic/Pro Tools) | `/create-prd-architecture` | 14.04.03 DT-01 requires generated manifests. Proprietary, undocumented, version-drifting formats on a `could`-priority feature. |
| Audio fingerprinting against commercial recordings | `/create-prd-architecture` | 14.08.03 Q-01 and 14.05.02 Q-03 want the same capability — the only automated defence against the domain's central exposure (DT-B). |
| Machine fingerprinting (privacy-sensitive personal data) | `/create-prd-security` | 14.02.02's rig/machine identity is a fingerprint; vendors must never read it. |
| Consumer-credit regulatory perimeter (rent-to-own) | `/create-prd` | 14.07.03 DT-02 — absent from `constraints.md`'s compliance table; add regardless of whether rent-to-own ships. |
| Stored-value / e-money implications of a credit economy | `/create-prd` | 14.07.02 DT-01 — a platform currency spendable across vendors resembles an e-money instrument. |
| EU software-resale law (*UsedSoft v Oracle*, C-128/11) | `/create-prd` | 14.06.01 DT-02 — may override the registry's "vendor decides" model in a major territory. |
| Withdrawal-waiver wording (Consumer Rights Directive Art. 16(m)); waiver retention under GDPR Art. 17(3)(e) | `/create-prd` / `/create-prd-security` | 14.09.01 — a legal artifact. The waiver survives a GDPR erasure request (defence of legal claims), minimised, bounded at 7 years; DSAR handling must know the record exists and why it stays. |
| Chargeback / dispute-network integration (120-day card, 13-month SEPA windows) | `/create-prd` | CX-19 — the async, months-later reversal that arrives after payout is a payment-rail integration concern; the *policy* (propagation gates auto-refund) is product. |
