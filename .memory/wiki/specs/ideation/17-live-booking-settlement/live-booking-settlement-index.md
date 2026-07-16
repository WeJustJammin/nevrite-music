# Live Booking & Settlement — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [SURFACE]
> **Last updated**: 2026-07-16
> **Novelty**: `industry-standard` | **Priority**: `core`

## Overview

The commercial spine of a show — availability and the hold ladder, offers and deal structures, contracts and deposits, radius clauses, and the post-show settlement that computes from the deal terms.

**Why this is a top-level domain**: Absent from idea.md entirely, yet it is the largest live-software category (Prism.fm, Opendate, Gigwell, Muzeek). Booking is kept with settlement deliberately: the deal structure IS the settlement formula ('$2,000 versus 85% of net after $6,000 expenses, whichever is greater'), and splitting them destroys the automation insight — settlement is only computable if the offer was structured data. The hold ladder (1st/2nd hold, challenge, release within 24-48h) is the most industry-specific mechanic in the corpus and invisible to outsiders; modelling it correctly is the strongest credibility signal available. Settlement itself happens in a back office at 1am with a calculator and information asymmetry running one direction — automating it is flagship-grade and is the source dataset for draw intelligence and payment-reliability reputation. Acknowledged cost: agent, promoter and tour manager in one domain is a wide persona span; the alternative (fold Ticketing in, giving 'commerce of a show' vs 'operations of a show') is noted in coverage notes.

**Interacting capabilities** (what justifies domain status):

- availability, holds & challenges
- offers & deal structures
- contracts & deposits
- settlement computed from deal + counts
- expense & merch reconciliation
- draw intelligence

## Children

> Candidate children discovered by the 14-lens sweep. All are `[SURFACE]` — identified only.
> `/ideate-discover` runs each through the Node Classification Gate to determine
> sub-domain (folder) vs feature (file), then drills. **Nothing below is confirmed structure.**

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Availability, Holds & Challenges | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 02 | Offer Sheets & Negotiation | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 03 | Deal Structures & Economics Modelling (guarantee, door split, versus, breakeven, bonus, walkout) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 04 | Performance Contracts & Deal Memos | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 05 | Deposits, Balance Schedules & Cancellation/Force Majeure Terms | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 06 | Radius Clause & Exclusivity Tracking | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 07 | Booking Enquiry Inbox & RFQ | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 08 | Agency Roster & Commission Tracking | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 09 | Show Settlement Sheet & Reconciliation | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 10 | Show Expense & Receipt Capture | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 11 | Merch Settlement & Venue Merch Cut | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 12 | Payout Splits & Disbursement | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 13 | Withholding Tax & VAT on Live Income | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 14 | Settlement Disputes & Audit Trail | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 15 | Deal Modelling & Breakeven Analysis | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 16 | Draw History & Market Intelligence | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 17 | Venue & Promoter Relationship History | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 18 | Event Listing Syndication & Fan Demand Signals | _unclassified_ | _pending_ | `[SURFACE]` | 0 |

## Role Matrix

> `[PENDING]` — populated by `/ideate-discover` once `meta/personas.md` exists.
> Provisional personas for this domain (from sweep): booking agent, promoter, venue talent buyer, artist, band, manager, tour manager
>
> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None

| Child | booking agent | promoter | venue talent buyer | artist | band | manager | tour manager |
|-------| --- | --- | --- | --- | --- | --- | --- |
| _pending — children unclassified_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Absent from idea.md entirely, yet it is the largest live-software category (Prism.fm, Opendate, Gigwell, Muzeek). Booking is kept with settlement deliberately: the deal structure I... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Which candidate children are sub-domains (2+ interacting capabilities) vs features (single capability)? | Agent | `/ideate-discover` |
| Q-02 | Are any candidate children actually cross-cuts belonging in a CX file? | Agent | `/ideate-discover` |
