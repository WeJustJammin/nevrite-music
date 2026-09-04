# Live Booking & Settlement — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `industry-standard` | **Priority**: `core`

## Overview

The commercial spine of a show — availability and the hold ladder, offers and deal structures,
contracts and deposits, radius clauses, and the post-show settlement that computes from the deal
terms.

**Why this is a top-level domain**: Absent from idea.md entirely, yet it is the largest live-software
category (Prism.fm, Opendate, Gigwell, Muzeek). Booking is kept with settlement deliberately: the
deal structure IS the settlement formula ('$2,000 versus 85% of net after $6,000 expenses, whichever
is greater'), and splitting them destroys the automation insight — settlement is only computable if
the offer was structured data. The hold ladder (1st/2nd hold, challenge, release within 24-48h) is
the most industry-specific mechanic in the corpus and invisible to outsiders; modelling it correctly
is the strongest credibility signal available. Settlement itself happens in a back office at 1am with
a calculator and information asymmetry running one direction — automating it is flagship-grade and is
the source dataset for draw intelligence and payment-reliability reputation. Acknowledged cost: agent,
promoter and tour manager in one domain is a wide persona span; the alternative (fold Ticketing in,
giving 'commerce of a show' vs 'operations of a show') is noted in coverage notes.

**Interacting capabilities** (what justifies domain status):

- availability, holds & challenges
- offers & deal structures
- contracts & deposits
- settlement computed from deal + counts
- expense & merch reconciliation
- draw intelligence

**How this domain serves the thesis (D-18)**: both halves. *Consolidation* — the hold ladder, offers
and settlement are the daily reason an agent and a promoter open the product. *Provenance* — a signed
settlement is a fact captured in the room where it became true, and three things fall out of it that
no competitor can retroactively manufacture: a **verified draw record** (17.11.01), a **derived
payment-reliability record** (17.12), and **proof the gig happened**, which makes a performance credit
in domain 02 evidenced rather than claimed.

## Children

> 18 sweep candidates classified through the Node Classification Gate → **14 children: 8 sub-domains
> + 6 features**, containing **37 leaf feature files**. 8 candidates merged into 3 nodes, 4 candidates
> split (2 halves routed out as cross-cuts, 1 half to domain 21, 1 half to domain 24), 4 Deep Think
> additions, 105 Deep Think hypotheses logged.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 17.01 | Availability, Holds & Confirmation | sub-domain | [17.01-availability-holds-confirmation/](./17.01-availability-holds-confirmation/) | `[SURFACE]` | 12 hypotheses |
| 17.02 | Offers & Negotiation | sub-domain | [17.02-offers-negotiation/](./17.02-offers-negotiation/) | `[SURFACE]` | 11 hypotheses |
| 17.03 | Deal Structures & Economics | sub-domain | [17.03-deal-structures-economics/](./17.03-deal-structures-economics/) | `[SURFACE]` | 9 hypotheses |
| 17.04 | Performance Contracts & Deal Memos | feature | [17.04-performance-contracts-deal-memos.md](./17.04-performance-contracts-deal-memos.md) | `[SURFACE]` | 3 hypotheses |
| 17.05 | Deposits, Balances & Cancellation | sub-domain | [17.05-deposits-balances-cancellation/](./17.05-deposits-balances-cancellation/) | `[SURFACE]` | 9 hypotheses |
| 17.06 | Radius Clause & Exclusivity Tracking | feature | [17.06-radius-clause-exclusivity.md](./17.06-radius-clause-exclusivity.md) | `[SURFACE]` | 3 hypotheses |
| 17.07 | Booking Enquiry Inbox & RFQ | feature | [17.07-booking-enquiry-inbox-rfq.md](./17.07-booking-enquiry-inbox-rfq.md) | `[SURFACE]` | 4 hypotheses |
| 17.08 | Agency Representation & Commission | sub-domain | [17.08-agency-representation-commission/](./17.08-agency-representation-commission/) | `[SURFACE]` | 8 hypotheses |
| 17.09 | Settlement & Reconciliation | sub-domain | [17.09-settlement-reconciliation/](./17.09-settlement-reconciliation/) | `[SURFACE]` | 20 hypotheses |
| 17.10 | Live Income Payout & Tax | sub-domain | [17.10-live-income-payout-tax/](./17.10-live-income-payout-tax/) | `[SURFACE]` | 9 hypotheses |
| 17.11 | Draw History & Market Intelligence | sub-domain | [17.11-draw-history-market-intelligence/](./17.11-draw-history-market-intelligence/) | `[SURFACE]` | 9 hypotheses |
| 17.12 | Counterparty Relationship & Payment Reliability | feature | [17.12-counterparty-relationship-payment-reliability.md](./17.12-counterparty-relationship-payment-reliability.md) | `[SURFACE]` | 3 hypotheses |
| 17.13 | Fan Demand Signals & Routing Requests | feature | [17.13-fan-demand-signals.md](./17.13-fan-demand-signals.md) | `[SURFACE]` | 3 hypotheses |
| 17.14 | Bill Construction & Support Slot Offers | feature | [17.14-bill-construction-support-slots.md](./17.14-bill-construction-support-slots.md) | `[SURFACE]` | 3 hypotheses |

> **Type column values:** `sub-domain` — 2+ interacting capabilities (folder with index + CX) ·
> `feature` — a single capability (.md file)

## Role Matrix

> Personas per `meta/personas.md` (D-19). **The deal has exactly two sides**: `Musician` = artist side
> (artist, band, their agent, their manager, their tour manager); `Operator` = buy side (promoter,
> venue talent buyer, festival booker). This mapping is how the sweep's 7 provisional personas
> (booking agent, promoter, venue talent buyer, artist, band, manager, tour manager) resolve into the
> ratified 4 — and it is **strained for the booking agent**, who makes no music and sells no space.
> See Q-01.
>
> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 17.01 Availability, Holds & Confirmation | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 17.02 Offers & Negotiation | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 17.03 Deal Structures & Economics | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 17.04 Performance Contracts & Deal Memos | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 17.05 Deposits, Balances & Cancellation | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 17.06 Radius Clause & Exclusivity Tracking | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 17.07 Booking Enquiry Inbox & RFQ | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 17.08 Agency Representation & Commission | ✅ Full | ❌ None | ❌ None | ❌ None |
| 17.09 Settlement & Reconciliation | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 17.10 Live Income Payout & Tax | ✅ Full | ❌ None | 👁️ Read-only | ❌ None |
| 17.11 Draw History & Market Intelligence | ✅ Full | ❌ None | 👁️ Read-only | ❌ None |
| 17.12 Counterparty Relationship & Payment Reliability | ✅ Full | ❌ None | ✅ Full | ❌ None |
| 17.13 Fan Demand Signals & Routing Requests | ✅ Full | ❌ None | 👁️ Read-only | ✅ Full |
| 17.14 Bill Construction & Support Slot Offers | ✅ Full | ❌ None | ✅ Full | ❌ None |

### Reading the Role Matrix — three deliberate patterns

1. **Producer is `None` across all 14 children.** This is a finding, not an omission. The Producer
   persona owns the studio room, not the stage; studio booking is domain 16 and live crew is domain
   18. A Producer who books a venue is acting as an **Operator**; one who plays a gig is acting as a
   **Musician** — personas are lenses on behaviour (`meta/personas.md`), and neither lens is
   "Producer" here. **Domain 17 is the clearest case in the map of a domain that one primary persona
   does not touch at all.**
2. **Fan is `None` across 13 of 14** — the exception is 17.13, which exists partly to make that not
   be 14/14. The Fan is nonetheless the *source* of nearly every number in 17.09 and 17.11: they buy
   the ticket, they are the draw. They simply never see the arithmetic. Whether that is the right
   reading of D-11 is Q-05.
3. **17.08 is `None` for Operator, by design.** What an act pays its agent is deliberately invisible
   to the promoter — a promoter who could see it would negotiate against it.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Absent from idea.md entirely, yet it is the largest live-software category (Prism.fm, Opendate, Gigwell, Muzeek). Booking is kept with settlement deliberately: the deal structure IS the settlement formula. | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | 18 candidates → **14 children: 8 sub-domains + 6 features**, 37 leaf features | Every candidate run through the Node Classification Gate. Sub-domain where 2+ capabilities interact with each other; feature where one capability has a lifecycle, however many edge cases it carries. The count rose from 18 candidates to 37 leaves because the sweep's candidates were mostly *sub-domain-sized*, not feature-sized — "Show Settlement Sheet & Reconciliation" is seven interacting things. | `/ideate-discover` Step 3 |
| D-03 | **MERGED** candidates 03 + 15 → 17.03 Deal Structures & Economics | Near-duplicates: candidate 03's own parenthetical enumerated "breakeven", which was candidate 15's whole subject. Keeping both would split the grammar from the calculator that consumes it. | Node Classification Gate — duplicate merge |
| D-04 | **MERGED** candidates 09 + 10 + 11 + 14 → 17.09 Settlement & Reconciliation | Expense capture, merch settlement and the audit trail are **inputs to** or **consequences of** the settlement sheet, not peers of it. Domain-level placement hid that they exist only to be settled. | Node Classification Gate — near-duplicate merge |
| D-05 | **MERGED** candidates 12 + 13 → 17.10 Live Income Payout & Tax | Withholding is an operation *on the payout pool*, sequenced against the split — not an independent peer. Separating them hid that the sequencing question exists. | Node Classification Gate — merge |
| D-06 | **SPLIT** candidate 18 ("Event Listing Syndication & Fan Demand Signals") | Two unrelated things in one bullet. **Syndication** is outbound announce → domain 21 (this domain owns only the announce *trigger*, 17.01.04). **Fan demand** is an inbound booking input → 17.13. | Node Classification Gate — split |
| D-07 | **SPLIT** candidate 14's dispute half → domain 24 | The dispute *machinery* (raise, mediate, resolve) is a cross-cut serving 05/13/14/17/19. What is domain-owned: a settlement dispute contests a **line item** and its resolution **changes a number** — which 24 cannot know. | Node Classification Gate — cross-cut test |
| D-08 | **SPLIT** candidate 07's transport → cross-cut; shape retained | A structured RFQ inbox serves 05/06/16/17 identically. But a booking enquiry's qualifying fields (date, fee, capacity, routing) mean nothing to a lesson request. Folding it whole into a cross-cut yields a generic `request` with nullable columns — the anti-pattern D-14 rejected for marketplaces. | Node Classification Gate — cross-cut test |
| D-09 | **SPLIT** candidate 17's reputation half → cross-cut; derived half retained (17.12) | Generic reviews are a cross-cut. Live settlement produces **derived** facts (paid on time, count matched) — the thesis applied to reputation. A star rating is a memory; a payment record is evidence. | Node Classification Gate — cross-cut test |
| D-10 | 4 **Deep Think additions**: 17.01.04, 17.02.03, 17.03.03, 17.14 | The sweep modelled the ladder but not what it resolves into; offers but not who may bind the band; deals but not runs; and **a show as one artist and one promoter** — an assumption wrong on the majority of shows. | Deep Think, `/ideate-discover` Step 3 |
| D-11 | Personas resolve to **Musician = artist side, Operator = buy side** | The deal has exactly two sides. The sweep's 7 provisional personas map onto them cleanly except the booking agent, who fits neither (Q-01). Consistent with `meta/personas.md`'s coverage table ("Operator + Musician as counterparty"). | `/ideate-discover` Step 3, per D-19 |

## Open Questions

> **Open-question governance.** Every unresolved row in this table is an explicit delivery hold. The **Owner** cell is accountable; the **hard decision deadline** is the gate immediately before the pipeline stage named in **Deferred To** begins; and the **Question** text is the exact policy, behavior, or contract decision blocked. **Deferred To** names the destination only and never replaces the deadline. No downstream stage may begin until its owner resolves the row or records a formally approved supersession.

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | **[OWNER]** **Which persona is a booking agent?** Mapped to Musician (artist's side, paid from the artist's money, invisible to the Operator) but they make no music and the fit is visibly poor — 17.08's entire Operator column being `None` is the symptom. This is the strongest evidence in the map for or against the four-persona model (D-19), and it mirrors the open dealer-persona question (`meta/personas.md` Q-01). *Re-pointed from the completed `/ideate-validate`, matching the precedent `meta/personas.md` Q-01 already set for the sibling persona questions.* | User | `/create-prd` |
| Q-02 | **[OWNER]** **Is a settlement final per show, or provisional until its run closes?** 17.03.03 (cross-collateralization) makes per-show finality arithmetically impossible for runs; 17.09 assumes it throughout. This **decides the settlement entity's grain** and cannot be deferred to implementation. The trade-off is real: provisional = correct + cashflow pain; per-show-final + true-up = cashflow relief + clawback risk. Both exist in the industry. 17.03.03 D-04 records it as escalated by design — "a genuine product trade-off between correctness and cashflow". | User | `/create-prd` |
| Q-03 | **Postponement is unmodelled across the entire domain** (17.05.04 DT-01). Post-2020 it is the dominant outcome when a show dies — the date moves, the deal survives, tickets stay valid. It is neither cancellation nor force majeure, and it must move the hold, the contract, the schedule and the ticket manifest together. Is it a state of the booking, or a new booking inheriting the old deal? *An entity/state-propagation decision spanning 17.01, 17.04, 17.05 and 19 — re-pointed from the completed `/ideate-discover` Step 5.* | User | `/create-prd-architecture` |
| Q-04 | ~~**Does closing the settlement asymmetry require owning the box office (domain 19)?**~~ **RESOLVED — yes, and the dependency is now shown.** `17.03-deal-structures-economics/17.03.01-deal-term-grammar-types.md` **D-07** binds the count to 19: "**Count references resolve to 19-owned named definitions. 'Sellout' is not a token**". That file's Cross-Cut Note states the coupling is *stronger* than 17.09.01 DT-03 argued — "This materially strengthens domain index Q-04/Q-10 (does settlement require owning the box office): **the grammar cannot even be authored correctly without 19's fee and count model**" — and names two hard dependencies (19-owned count definitions; the gross basis built from 19's fee structure). The MoSCoW half is satisfied structurally: `meta/constraints.md` § Phase 2+ ships **Live/Events (16–19)** as one release group, so 19 lands with 17. | User | ✅ Resolved (2026-07-23) |
| Q-05 | **[OWNER]** **Is a Fan touchpoint into live booking wanted at all?** Without 17.13, the Fan is `None` on 14/14 children — they consume shows and never influence which ones exist. That is coherent, and it is a smaller claim than D-11 makes. (Same question as 17.13 Q-01; answer both together.) | User | `/create-prd` |
| Q-06 | **Does the platform disburse to individuals or to the band entity?** (17.10 Q-01.) Individuals is what musicians want and makes the platform a mass payout facilitator — KYC/AML per recipient, tax reporting per recipient, money transmission, all `[PENDING]` in `meta/constraints.md`. Entity payout is trivial and delivers almost none of the value. Possibly **the most expensive compliance decision in the 24-domain map**. | User | `/create-prd-stack` |
| Q-07 | **[OWNER]** **Whose settlement data may inform whose decision?** (17.11 Q-01.) Comparables are built from confidential deal terms whose owners never consented to informing a rival. Aggregation thresholds address identifiability — badly, in a market this thin — and not consent at all. A values decision; the same question `meta/problem-statement.md` Q-02 asks about lock-in, applied to other people's data. The *technique* (statistical disclosure control) is already routed to `/create-prd-security` in `live-booking-settlement-cx.md`, which states that "the consent policy it enforces is product (index Q-07)" — so the policy itself is the owner's. | User | `/create-prd` |
| Q-08 | **[OWNER]** **Is the deal grammar a closed vocabulary or an open expression language?** (17.03 Q-01.) Closed settles cleanly and will not cover every deal; open covers the long tail and is a spreadsheet. **This sets the ceiling on the domain's entire automation claim.** *Reframed but not closed*: 17.03.01 DT-12 rejects the binary and adds a third option — closed + instrumented gap reporting + acknowledged free text (D-02+D-06+D-09) — and D-02 is "recorded as a decision to be **re-opened** by the owner via Q-01 ... not as a closed matter". Decide against three options, not two. | User | `/create-prd` |
| Q-09 | Settlement happens in a back room at 1am, with cash on the table and frequently no connectivity. **Is offline capture in scope?** ~~This is the strongest argument in the domain for resolving the open mobile-surface question in `meta/constraints.md`.~~ *The mobile-surface half is now closed*: `meta/constraints.md` § Project Surfaces fixes web-as-PWA for v1 and native mobile for phase 2 (D-28, D-70). What remains is whether a surface can degrade offline at all — 17.09.01 D-17 already specifies **how** the sheet degrades independently of that. Routed per this domain's own Not-Product table in `live-booking-settlement-cx.md` ("Offline capture & sync … Architecture — but driven by a product question (index Q-09)"). | User | `/create-prd-architecture` |
| Q-10 | ~~The domain index flags an alternative boundary: **fold Ticketing (19) in**, giving "commerce of a show" vs "operations of a show". Q-04 strengthens the case materially — the count is 19's and the settlement cannot be trustworthy without it. Worth re-testing at validate.~~ **RESOLVED — the boundary stands; 17 and 19 stay separate domains.** `ideation-index.md` **D-35**: "**24-domain map reaffirmed after restart/recovery.** Owner confirmed all 24 domains on 2026-07-19 following recovery of the 14-lens / 1,545-concept sweep. Four fresh independent audits found no missing required domain, cross-cut, blocker, or major boundary defect. Existing 24-folder fractal tree is authoritative". The hard 17↔19 coupling Q-04 records is carried as a cross-domain dependency (17.03.01 D-07), not as a merge. | User | ✅ Resolved (2026-07-23) |


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### Constrained by
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-19|D-19]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-28|D-28]]
- [[decisions.md#d-70|D-70]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-35|D-35]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
