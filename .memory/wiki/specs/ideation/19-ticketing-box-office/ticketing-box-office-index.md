# Ticketing & Box Office — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-23
> **Novelty**: `user-directive` | **Priority**: `important`

## Overview

Selling and controlling admission — ticket configuration, on-sales and presales, allocations, guest list and comps, door scanning, live counts, refunds and rescheduling — whether issued here or ingested from an incumbent.

**Why this is a top-level domain**: Not part of Live Booking, because it has a fan-facing surface, its own money rail, its own regulatory regime (BOTS Act, resale price caps, fee-disclosure and junk-fee rules) and its own integration boundary. Critically: even if WeJammin never sells a ticket, it must ingest box office data or settlement is fiction and draw intelligence is guesswork — so the domain exists either way and build-versus-integrate is a scoping decision inside it, not grounds for omission. Guest list and comps live here because they are an admission concern with a settlement consequence (comps reduce the paid count that drives the door split), and they are a nightly source of door-time conflict. Boundary clarified against Fanbase & D2F, which a verifier correctly flagged as duplicating presales: this domain owns the presale MECHANISM (allocation, code issuance, redemption, access window); Fanbase owns the SEGMENT (superfan scoring decides who gets a code). Fan decides who, Ticketing decides how.

**Interacting capabilities** (what justifies domain status):

- ticket config, scaling & allocations
- on-sale, presale & announce
- guest list & comps
- door scanning & live counts
- refunds/rescheduling
- external ticketing ingestion & reconciliation

## Children

> Classified through the Node Classification Gate during `/ideate-discover` Step 3.
> **9 sub-domains, 3 domain-level features, 38 leaf features.** All `[SURFACE]` — breadth pass;
> depth is allocated by MoSCoW at Step 5.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Ticket Configuration, Scaling & Allocations | sub-domain | [19.01-ticket-config-scaling-allocations/](./19.01-ticket-config-scaling-allocations/) | `[SURFACE]` | 11 (5 features) |
| 02 | On-Sale, Announce & Presale Access | sub-domain | [19.02-on-sale-announce-presale/](./19.02-on-sale-announce-presale/) | `[SURFACE]` | 10 (5 features) |
| 03 | Guest List & Comps | sub-domain | [19.03-guest-list-comps/](./19.03-guest-list-comps/) | `[SURFACE]` | 6 (3 features) |
| 04 | Door Scanning & Access Control | sub-domain | [19.04-door-scanning-access-control/](./19.04-door-scanning-access-control/) | `[SURFACE]` | 9 (4 features) |
| 05 | Box Office Counts, Drops & Day-of-Show | sub-domain | [19.05-box-office-counts-drops/](./19.05-box-office-counts-drops/) | `[SURFACE]` | 11 (5 features) |
| 06 | Refunds, Cancellations & Rescheduling | sub-domain | [19.06-refunds-cancellations-rescheduling/](./19.06-refunds-cancellations-rescheduling/) | `[SURFACE]` | 7 (3 features) |
| 07 | External Ticketing Integration & Count Reconciliation | sub-domain | [19.07-external-ticketing-integration/](./19.07-external-ticketing-integration/) | `[SURFACE]` | 9 (4 features) |
| 08 | VIP Packages & Meet-and-Greet | sub-domain | [19.08-vip-packages-meet-and-greet/](./19.08-vip-packages-meet-and-greet/) | `[SURFACE]` | 6 (3 features) |
| 09 | Ticketing Fraud, Bot & Resale Controls | sub-domain | [19.09-ticketing-fraud-bot-resale-controls/](./19.09-ticketing-fraud-bot-resale-controls/) | `[SURFACE]` | 7 (3 features) |
| 10 | Attendee Data Capture & Event-Party Consent | feature | [19.10-attendee-data-capture-consent.md](./19.10-attendee-data-capture-consent.md) | `[SURFACE]` | 2 |
| 11 | RSVP & Free/Private Event Admission | feature | [19.11-rsvp-free-private-event-admission.md](./19.11-rsvp-free-private-event-admission.md) | `[SURFACE]` | 2 |
| 12 | Ticket Delivery & Fan Ticket Wallet | feature | [19.12-ticket-delivery-fan-wallet.md](./19.12-ticket-delivery-fan-wallet.md) | `[SURFACE]` | 2 |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

**Cross-cuts**: [ticketing-box-office-cx.md](./ticketing-box-office-cx.md) — 14 intra-domain pairs, 6 rejected pairs, 8 cross-cut mechanisms routed out, and the domain's 3 characteristic mechanisms.

## Role Matrix

> Personas from [meta/personas.md](../meta/personas.md) — referenced, never redefined.
>
> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 19.01 Ticket Configuration, Scaling & Allocations | ⚙️ Config | ❌ None | ✅ Full | 👁️ Read-only |
| 19.02 On-Sale, Announce & Presale Access | ⚙️ Config | ❌ None | ✅ Full | ✅ Full |
| 19.03 Guest List & Comps | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 19.04 Door Scanning & Access Control | 📊 Reports | ❌ None | ✅ Full | 👁️ Read-only |
| 19.05 Box Office Counts, Drops & Day-of-Show | 📊 Reports | ❌ None | ✅ Full | 👁️ Read-only |
| 19.06 Refunds, Cancellations & Rescheduling | ⚙️ Config | ❌ None | ✅ Full | ✅ Full |
| 19.07 External Ticketing Integration & Reconciliation | 👁️ Read-only | ❌ None | ✅ Full | ❌ None |
| 19.08 VIP Packages & Meet-and-Greet | ⚙️ Config | ❌ None | ✅ Full | ✅ Full |
| 19.09 Ticketing Fraud, Bot & Resale Controls | ⚙️ Config | ❌ None | ✅ Full | ✅ Full |
| 19.10 Attendee Data Capture & Event-Party Consent | 👁️ Read-only | ❌ None | ✅ Full | ✅ Full |
| 19.11 RSVP & Free/Private Event Admission | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| 19.12 Ticket Delivery & Fan Ticket Wallet | ❌ None | ❌ None | ⚙️ Config | ✅ Full |

### Reading the matrix

**This is the Operator's domain.** Every child except 19.12 is Operator-Full — the room, the door, the money and the licence are theirs. That is the correct shape, not an oversight.

**The Producer is `None` on 11 of 12 children**, and the exception (19.11 RSVP) is the only feature in domain 19 they can use — a private playback for a client's team, an invite-only listening session. Producers do not run box offices. This is an honest structural finding rather than a gap: the persona doc places the Producer's value at the *session*, and this domain has no session. Recorded as Q-04 below because a persona that is absent from an entire domain is worth the owner knowing about.

**The Musician's strongest presence** is 19.03 (Guest List — their budget to spend, not the venue's to approve) and 19.09 (Resale — their price, their fans getting gouged, their name on the £200 listing). Both are `Full`/`Config` for the same reason: it is the artist's interest at stake, not the venue's.

**19.08.02 (M&G Scheduling) inverts the domain** — Musician `Full`, Operator `Config` — because the constrained resource there is a human's time and stamina, which the Operator does not own and must not be able to sell.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Not part of Live Booking, because it has a fan-facing surface, its own money rail, its own regulatory regime (BOTS Act, resale price caps, fee-disclosure and junk-fee rules) and its own integration boundary | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **11 candidates → 9 sub-domains + 3 features.** No candidate was dropped; 1 merged, 3 added | Every candidate survived the Node Classification Gate. Candidate 10 (Attendee Data) demoted from apparent sub-domain to feature once the consent *mechanism* was routed out as a cross-cut; candidate 11 (RSVP) classified as a feature — access mode and overbooking are configs on one capability, not separate capabilities | `/ideate-discover` Step 3 |
| D-03 | **3 Deep Think additions**: Box Office Close & Certified Statement (19.05.05), Manual Count Entry & Attestation (19.07.04), Ticket Delivery & Fan Wallet (19.12). Plus two feature-level additions: Accessible Seating (19.01.05) and Door Age/ID Verification (19.04.04) | All five are things a domain expert expects and the sweep missed. 19.05.05 is the domain's thesis feature; 19.07.04 is the majority path for the target market; 19.12 is the fan's entire relationship with the domain | Deep Think, `/ideate-discover` Step 3 |
| D-04 | **Walk-up sales placed with Counts (19.05), not with the Door (19.04)** | Its defining property is that it mutates the count and feeds settlement — the same concern as every other child of 19.05. It is a *sale*, not an admission control, even though it happens at the same table as scanning | Node Classification Gate |
| D-05 | **Boundary: 19.05 owns the canonical count and the certified statement; 19.07 gets foreign counts into it** | Both sub-domains produce something called a "count". Without the line they duplicate | `/ideate-discover` Step 3 |
| D-06 | **Chargebacks, generic fraud detection, consent management, age assurance, tax, notifications and payments all routed OUT as cross-cuts** | Each serves 3+ domains identically. A stolen card is a stolen card whether it buys a ticket, a guitar (13) or a plugin (14). What is ticketing-specific is only the *scarcity* regime | Node Classification Gate; see `ticketing-box-office-cx.md` |
| D-07 | **The domain has 3 characteristic mechanisms**, each discovered independently in separate sub-domains: deadline-with-auto-resolution, attribution-not-prevention, and structural-over-detective controls | Recurrence across independently-classified sub-domains makes these the domain's character, not local choices. Each needs a single shared implementation or it will drift | `/ideate-discover` Step 3 synthesis; see `ticketing-box-office-cx.md` |
| D-08 | **Offline-capable is a precondition of 19.04, not a feature of it** | Music venues have structurally bad connectivity — basements, concrete, and 300 phones on one cell. An online-only door does not degrade in the target market; it stops | Persona-derived (Operator: *"on a phone at a loading dock"*); 19.04 D-02 |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs features?~~ **RESOLVED** — 9 sub-domains, 3 features (D-02) | Agent | ✅ `/ideate-discover` Step 3 |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ **RESOLVED** — 8 mechanisms routed out (D-06); no whole candidate was a cross-cut, but Attendee Data lost most of its substance to one and demoted to a feature | Agent | ✅ `/ideate-discover` Step 3 |
| Q-03 | **[OWNER]** **The 4-persona model has no PROMOTER.** In live music the promoter buys the show, sets the price and owns the on-sale — and here they collapse into Operator (venue-promoted) or Musician (self-promoted). That collapse is *defensible at club level*, where most shows are venue- or artist-promoted, and breaks above it. The sweep's provisional personas named "promoter", "venue box office", "door staff" and "tour manager"; three map cleanly (Operator, Operator sub-role, Musician's team) and **promoter does not**. Related: drops (19.05.02) are addressed to an **agent**, who is also nobody in this model. **Bounded since**: `meta/counterparties.md` (D-71) holds the set at four — *"D-19 is unamended — The four primary personas stay four: Musician · Producer · Operator · Fan"* — so the promoter and the agent can only become non-persona **counterparty profiles** or nothing, never a fifth column. Which remaining actors get a profile is `meta/personas.md` Q-05 (`vision.md` Q-09), already re-pointed to `/create-prd`; the promoter and the agent are not among the nine actors D-71 enumerated, so they are unowned. | User | `/create-prd` |
| Q-04 | ~~**The Producer is `None` on 11 of 12 children** — a persona absent from an entire domain is worth confirming rather than assuming.~~ **RESOLVED — confirmed by design, not an oversight.** `meta/personas.md` § Coverage Check assigns *"16 Venues/Studios · 17 Live Booking · 18 Show Production · 19 Ticketing"* to *"Operator (+ Musician as counterparty)"* and marks that row **✅ covered**, with no ⚠️ persona-gap flag — in deliberate contrast to the two rows that do carry one (13/14/15 → personas Q-01, and 24 → personas Q-02). The Producer's absence from domain 19 is the ratified coverage model; the 19.11 RSVP exception stands as stated. | User | ✅ `meta/personas.md` § Coverage Check (D-19 / D-71) |
| Q-05 | **[OWNER]** **Does WeJammin scan tickets on externally-ticketed shows?** This is the domain's biggest scope question and it is *not* what it appears. `ticketing-box-office-cx.md#CX-05` establishes that the **gate-observed** `scanned` count is the only count WeJammin independently observes (never the derived `admissions_total`, which contains WeJammin's own window sales — 19.05.01 D-09, 19.07.03 D-07) — so without the door, 19.07's reconciliation degrades to transcription and the artist is still just trusting the venue's word. **The door and the reconciliation stand or fall together.** If the incumbent owns the barcode, this domain's central claim weakens substantially. MoSCoW ran and did **not** settle it: `moscow-ledger.md` places 19.04.01 in **Must** and 19.07.03 in **Should** with the rationale *"Its value is entirely conditional on Q-05"* — the tiering deferred the choice rather than making it. | User | `/create-prd` |
| Q-06 | **[OWNER]** **What is the refund policy, and are fees refundable?** Live events are frequently *exempt* from statutory rights to cancel, which makes this a genuine commercial and values choice rather than a compliance readout. It determines the shape of all of 19.06. The compliance backdrop is no longer `[PENDING]` — `meta/constraints.md` § Compliance is confirmed US-first and records that *"US has no federal 14-day withdrawal right (unlike EU) — returns are policy-driven per seller"*, which removes the statutory floor and leaves the whole question as the owner's commercial choice. | User | `/create-prd` |
| Q-07 | ~~**Which jurisdictions at launch?** All-in pricing rules, accessible-seating release conditions, resale caps, postponement-to-refund conversion and amusement taxes are all jurisdiction-specific and all materially shape this domain.~~ **RESOLVED — the United States only.** `meta/constraints.md` § Compliance: *"**Primary market: UNITED STATES to start** (owner revised from an initial 'global from day one' to US-first...)"*, and § Jurisdiction Parameterization (D-72): *"**Exactly one profile is authored at launch: `US`.** Every other territory — including the UK, whose vocabulary the specs were originally drafted in — is an **UNAUTHORED profile**"* whose statutory fields resolve to an explicit `unknown`. Every jurisdiction-specific rule in this domain is therefore authored against the US profile, and the UK vocabulary the domain was drafted in retires into an unauthored profile. The US **instrument names** remain deferred to `/create-prd-security` under D-72. | User | ✅ `/ideate-validate` (D-32) + D-72 |
| Q-08 | ~~**Does 19.12's wallet pass strengthen the mobile-surface question?**~~ **RESOLVED — it does not change the surface.** `ideation-index.md` **D-28** locks *"**Mobile** = native app is **phase 2** (v1 = web + PWA; classification stays `single-surface`, native tracked as a future surface, backend must be API-first)"*, and `meta/constraints.md` § Project Surfaces records the native row as *"**Phase 2** (owner-confirmed 2026-07-18) ... primarily serving Live/Events (16–19) and Fanbase (20)"*. So v1 issues wallet passes from the Astro web app + PWA exactly as this question hypothesised; the domain's phone-shaped evidence is already the stated reason a native surface is planned for **phase 2**, not v1. | User | ✅ `/ideate-validate` (D-28) |
| Q-09 | **Does the attestation primitive shared by 19.05.05 and 19.07.04 belong to this domain at all?** Domains 02 (credits), 09 (rights) and 17 (settlement) all need "a fact, attested by the party present, counter-signed by the counterparty, immutable thereafter". Four domains, one primitive. If they diverge, they diverge badly. | Agent | `/create-prd-architecture` |
| Q-10 | ~~**Who certifies a box office statement?** Required, optional, or async-with-a-deadline?~~ **RESOLVED — async with a deadline.** `19.05.05` **D-07**: *"When the Musician is absent at certify time, counter-attestation is **async with a deadline** (default 72h or the settlement run, whichever is sooner). The statement records three distinct outcomes — counter-attested, declined, and lapsed — never collapsing silence into consent."* **D-08** covers the degenerate cases: certifier = counterparty renders the statement `self-certified` (single-signature), and where the artist is one member of a booked band entity the other members remain valid counter-attesters. Only whether a *lapse gates settlement* remains open, tracked as `19.05.05` Q-01. | User | ✅ `/ideate-discover` Step 5 (19.05.05 D-07/D-08) |
| Q-11 | ~~Do deal terms (comp allocations, presale allocations, announce timing, reporting cadence, break-even count) **flow from domain 17**, or are they re-keyed here?~~ **RESOLVED — they flow.** `19.01.02` **D-04**: *"Hold classes are **derived from the executed booking contract** (17.04) where one exists, marked contract-derived with a clause citation; keyed directly only where no contract exists; an Operator edit to a contract-derived hold is a flagged divergence routed to 17.04's amendment flow"* — and that decision states outright that it *"Resolves Q-01 and the parent index's **Q-11** for this feature"*, on 17.04's own principle that *"a contract retyped from an offer is a second source of truth that will disagree with the first."* Announce timing is settled the same way in the opposite direction: `17.01.04` **D-08** makes announce timing a deal term while `17.01.04` DT-17 keeps the *schedule* in 19.02.01 as a reference, never a copy — *"17 decides whether, 19 decides when."* Per-feature wiring for the remaining four (19.02.02, 19.03.01, 19.05.02, 19.05.03) is tracked at `19.03.01` Q-01 → `/create-prd-architecture`. | Agent | ✅ `/ideate-discover` Step 5 (19.01.02 D-04) |
| Q-12 | ~~Does domain 16 model rooms structurally enough to feed this domain?~~ **RESOLVED for two of the three; the third has no owner.** (1) **Per-configuration licensed capacity** — yes: `16.01.02` **DT-04** (*"RESOLVED (Step 5) — SPLIT"*) states *"The room carries the **configuration** (named layout + capacity per layout + per-section seating mode: `ga`/`seated`/`mixed`) ... **19.01.04 Q-01 is answered: yes, per configuration**"*, with the statutory occupancy ceiling reaching rooms via 16.02.01 under `16` **D-13**. It explicitly **declines** seat identities and map geometry, so 19.01.04's "seat maps are a room asset" assertion is wrong and the reconciliation is `16.01.02` Q-02. (2) **Accessible provision** — yes: `16.02.01` **DT-15** rejects treating it as a parallel concern — *"a wheelchair bay **physically displaces standing places** ... accessible provision is a term in the subtraction chain"*, with the displacement ratio *"a **room fact the Operator declares**, not a constant the platform may invent."* (3) **Licensed age restriction** — **no**: D-72's US profile locks exactly five statutory slots (occupancy ceiling, liability cover, electrical/fire safety record, performing-rights licence status, hirer requirements) and an age restriction is not among them, so `19.04.04` Q-04's requirement currently lands on nobody. That residual is empirical legal work of the same class D-72 already routed onward. | Agent | ✅ Step 5 (16.01.02 DT-04, 16.02.01 DT-15) · residual (3) → `/create-prd-security` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-13|D-13]]
