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
| Q-03 | **The 4-persona model has no PROMOTER.** In live music the promoter buys the show, sets the price and owns the on-sale — and here they collapse into Operator (venue-promoted) or Musician (self-promoted). That collapse is *defensible at club level*, where most shows are venue- or artist-promoted, and breaks above it. The sweep's provisional personas named "promoter", "venue box office", "door staff" and "tour manager"; three map cleanly (Operator, Operator sub-role, Musician's team) and **promoter does not**. Related: drops (19.05.02) are addressed to an **agent**, who is also nobody in this model. | User | `/ideate-validate` |
| Q-04 | **The Producer is `None` on 11 of 12 children.** Producers do not run box offices, so this is structurally honest — but a persona absent from an entire domain is worth confirming rather than assuming. The one exception (19.11 RSVP: private playbacks, listening sessions) may be the shape of their whole relationship with live. | User | `/ideate-validate` |
| Q-05 | **Does WeJammin scan tickets on externally-ticketed shows?** This is the domain's biggest MoSCoW question and it is *not* what it appears. `ticketing-box-office-cx.md#CX-05` establishes that the **gate-observed** `scanned` count is the only count WeJammin independently observes (never the derived `admissions_total`, which contains WeJammin's own window sales — 19.05.01 D-09, 19.07.03 D-07) — so without the door, 19.07's reconciliation degrades to transcription and the artist is still just trusting the venue's word. **The door and the reconciliation stand or fall together.** If the incumbent owns the barcode, this domain's central claim weakens substantially. | User | MoSCoW |
| Q-06 | **What is the refund policy, and are fees refundable?** Live events are frequently *exempt* from statutory rights to cancel, which makes this a genuine commercial and values choice rather than a compliance readout. It determines the shape of all of 19.06. Note the compliance table in `meta/constraints.md` is `[PENDING]` throughout. | User | `/ideate-validate` then MoSCoW |
| Q-07 | **Which jurisdictions at launch?** All-in pricing rules, accessible-seating release conditions, resale caps, postponement-to-refund conversion and amusement taxes are all jurisdiction-specific and all materially shape this domain. `meta/constraints.md` has every compliance row `[PENDING]`. | User | `/ideate-validate` |
| Q-08 | **Does 19.12's wallet pass strengthen the mobile-surface question?** D-13 already notes the Fan persona strengthens it. This domain adds evidence: the fan's entire relationship with ticketing happens on a phone at a venue, and the wallet pass is the mechanism that makes reschedules work (CX-10). **Astro on Cloudflare Pages can issue wallet passes without a native app** — so this may not force a surface change, but it should be decided rather than assumed. | User | `/ideate-validate` → `/create-prd-stack` |
| Q-09 | **Does the attestation primitive shared by 19.05.05 and 19.07.04 belong to this domain at all?** Domains 02 (credits), 09 (rights) and 17 (settlement) all need "a fact, attested by the party present, counter-signed by the counterparty, immutable thereafter". Four domains, one primitive. If they diverge, they diverge badly. | Agent | `/create-prd-architecture` |
| Q-10 | **Who certifies a box office statement?** The Operator certifies the number that determines what they pay the artist. Counter-attestation by the Musician is the provenance-shaped answer (`personas.md` treats the Producer as a "trust broker" for exactly this reason) — but the artist has usually left the building. Required, optional, or async-with-a-deadline? | User | `/ideate-discover` Step 5 |
| Q-11 | Do deal terms (comp allocations, presale allocations, announce timing, reporting cadence, break-even count) **flow from domain 17**, or are they re-keyed here? Re-keying is where the artist's and venue's understanding diverge, and the divergence surfaces at 7pm with people at the door. This question recurs in 19.01.02, 19.02.02, 19.03.01, 19.05.02 and 19.05.03 — it is one question, not five. | Agent | `/ideate-discover` Step 5 |
| Q-12 | Does domain 16 model rooms structurally enough to feed this domain? Three features need data 16 may hold as free text: **per-configuration** licensed capacity (19.01.04 DT-02), accessible provision (19.01.05 Q-02), and licensed age restriction (19.04.04 Q-04). All three are requirements discovered here that land on 16. | Agent | `/ideate-discover` Step 5 (domain 16 owner) |


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
