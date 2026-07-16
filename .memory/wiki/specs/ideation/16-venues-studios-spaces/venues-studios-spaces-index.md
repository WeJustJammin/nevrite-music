# Venues, Studios & Spaces — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [SURFACE]
> **Last updated**: 2026-07-16
> **Novelty**: `user-directive` | **Priority**: `core`

## Overview

The canonical, community-curated registry of music's physical places — venue technical specs, studio rooms and mic lockers, rehearsal spaces, trades — plus the booking of their time.

**Why this is a top-level domain**: Explicit owner directive (D-07: 'a directory for venues, studios...'). Its write model is what makes it a domain rather than listings: records exist unclaimed and seeded from public data (OSM, Wikidata, MusicBrainz, licensing registers), facts are contested between owner and community, and the data needs provenance, revision history, dedup/merge and freshness decay — a machine with nothing in common with a single-writer gear listing. Its unit of value is coverage and accuracy at zero transactions (SEO, cold start). Venue technical truth is the highest-leverage unbuilt asset in live music: every advance re-asks questions the venue has answered a thousand times, and structured specs make rider-vs-venue conflict detection possible for the first time. Booking is kept here rather than in Services because separating a studio's mic locker from its rate card fails the wrong-cut test — the mic locker IS the booking decision. The write-model seam is real and preserved either way: specs stay community-curated with provenance and freshness decay, rates stay owner-controlled.

**Interacting capabilities** (what justifies domain status):

- canonical place records & tech specs
- claim & verification
- community curation, provenance & freshness decay
- availability & space booking
- compound resource booking (room + engineer + backline)
- enquiry/RFQ routing

## Children

> Candidate children discovered by the 14-lens sweep. All are `[SURFACE]` — identified only.
> `/ideate-discover` runs each through the Node Classification Gate to determine
> sub-domain (folder) vs feature (file), then drills. **Nothing below is confirmed structure.**

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Venue Records & Technical Specs (capacity model, stage, PA/FOH/monitors, sound limiter, load-in, curfew, parking, green room, merch terms, deal model, booking contact) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 02 | Studio Records, Rooms & Acoustics | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 03 | Studio Signal Chain, Mic Locker & Instrument Inventory | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 04 | Engineer Staffing Model (dry hire / assisted / full-service) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 05 | Rehearsal & Practice Spaces (backline inclusion, access model) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 06 | Industry Trades & Facilities Directory (luthiers, rental houses, PA/production, pressing plants) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 07 | Room/Space as First-Class Child Entity | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 08 | Claim & Ownership Verification (incl. unclaimed ghost records) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 09 | Data Seeding & Ingestion (with source-licence compliance) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 10 | Community Curation, Suggested Edits & Field-Level Provenance | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 11 | Owner-vs-Community Conflict Resolution Policy | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 12 | Verification Decay & Freshness Scoring | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 13 | Post-Gig/Post-Session Data Harvesting | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 14 | Space Booking & Reservations (availability, deposits, minimum blocks, buffers, overtime, lockout, cancellation ladders, waitlist backfill) | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 15 | Compound / Multi-Resource Booking | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 16 | Booking Posture Discriminator & Enquiry/RFQ Routing | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 17 | Rate Cards, Inclusions, Extras & Session Archive Policy | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 18 | Structured Photo Checklist & Virtual Tours | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 19 | Audience & Performer Accessibility Profile | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 20 | Venue Status & At-Risk Signalling | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 21 | Venue Blanket Licence (PRO) Compliance Status | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 22 | Off-Peak, Seasonal & Dynamic Pricing | _unclassified_ | _pending_ | `[SURFACE]` | 0 |

## Role Matrix

> `[PENDING]` — populated by `/ideate-discover` once `meta/personas.md` exists.
> Provisional personas for this domain (from sweep): venue operator, studio owner, rehearsal space operator, band, artist, tour manager, engineer, community editor
>
> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None

| Child | venue operator | studio owner | rehearsal space operator | band | artist | tour manager | engineer | community editor |
|-------| --- | --- | --- | --- | --- | --- | --- | --- |
| _pending — children unclassified_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Explicit owner directive (D-07: 'a directory for venues, studios...'). Its write model is what makes it a domain rather than listings: records exist unclaimed and seeded from publi... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Which candidate children are sub-domains (2+ interacting capabilities) vs features (single capability)? | Agent | `/ideate-discover` |
| Q-02 | Are any candidate children actually cross-cuts belonging in a CX file? | Agent | `/ideate-discover` |
