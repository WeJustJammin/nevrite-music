# Ticketing & Box Office — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [SURFACE]
> **Last updated**: 2026-07-16
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

> Candidate children discovered by the 14-lens sweep. All are `[SURFACE]` — identified only.
> `/ideate-discover` runs each through the Node Classification Gate to determine
> sub-domain (folder) vs feature (file), then drills. **Nothing below is confirmed structure.**

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Ticket Configuration, Scaling & Allocations | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 02 | On-Sale, Announce & Presale Access Codes | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 03 | Guest List & Comps | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 04 | Door Scanning & Offline-Capable Access Control | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 05 | Box Office Counts & Drop Reporting | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 06 | Refunds, Cancellations & Rescheduling | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 07 | Ticketing Platform Integrations & Count Reconciliation | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 08 | VIP Packages & Meet-and-Greet | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 09 | Ticketing Fraud, Bot & Resale/Scalping Controls | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 10 | Attendee Data Capture & Consent | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 11 | RSVP & Free/Private Event Management | _unclassified_ | _pending_ | `[SURFACE]` | 0 |

## Role Matrix

> `[PENDING]` — populated by `/ideate-discover` once `meta/personas.md` exists.
> Provisional personas for this domain (from sweep): promoter, venue box office, artist, door staff, fan/attendee, tour manager
>
> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None

| Child | promoter | venue box office | artist | door staff | fan/attendee | tour manager |
|-------| --- | --- | --- | --- | --- | --- |
| _pending — children unclassified_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Not part of Live Booking, because it has a fan-facing surface, its own money rail, its own regulatory regime (BOTS Act, resale price caps, fee-disclosure and junk-fee rules) and it... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Which candidate children are sub-domains (2+ interacting capabilities) vs features (single capability)? | Agent | `/ideate-discover` |
| Q-02 | Are any candidate children actually cross-cuts belonging in a CX file? | Agent | `/ideate-discover` |
