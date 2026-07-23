# Venues, Studios & Spaces — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-23
> **Novelty**: `user-directive` | **Priority**: `core`

## Overview

The canonical, community-curated registry of music's physical places — venue technical specs, studio
rooms and mic lockers, rehearsal spaces, trades — plus the booking of their time.

**Why this is a top-level domain**: Explicit owner directive (D-07: 'a directory for venues,
studios...'). Its write model is what makes it a domain rather than listings: records exist unclaimed
and seeded from public data (OSM, Wikidata, MusicBrainz, licensing registers), facts are contested
between owner and community, and the data needs provenance, revision history, dedup/merge and
freshness decay — a machine with nothing in common with a single-writer gear listing. Its unit of
value is coverage and accuracy at zero transactions (SEO, cold start). Venue technical truth is the
highest-leverage unbuilt asset in live music: every advance re-asks questions the venue has answered a
thousand times, and structured specs make rider-vs-venue conflict detection possible for the first
time. Booking is kept here rather than in Services because separating a studio's mic locker from its
rate card fails the wrong-cut test — the mic locker IS the booking decision. The write-model seam is
real and preserved either way: specs stay community-curated with provenance and freshness decay, rates
stay owner-controlled.

**Interacting capabilities** (what justifies domain status):

- canonical place records & tech specs
- claim & verification
- community curation, provenance & freshness decay
- availability & space booking
- compound resource booking (room + engineer + backline)
- enquiry/RFQ routing

### What this pass added to the rationale

Two findings from breadth classification strengthen the domain-status argument beyond the original:

1. **A second, mechanical reason booking belongs here.** The domain index argued the wrong-cut test
   (the mic locker IS the booking decision). Drilling found a harder one: **the completed reservation
   is the proof of presence that makes a post-gig report first-hand** (16.06.03 DT-01). Without
   booking in this domain, 16.05.06 has no trigger and no credential — and without 16.05.06 the
   registry rots (16.05.05 DT-05). Booking is not adjacent to the registry; it is its power supply.

2. **The domain touches the thesis directly, in two places.** D-18 says provenance is the wedge. The
   post-gig harvest is capture-at-source applied to *rooms* — a load-in is known perfectly by the band
   on the night and by nobody afterwards (16.05.06 DT-03). And 16.02.06 is capture-at-source applied
   to *live performance royalties*: a setlist at a licensed venue on a known date is money that
   currently evaporates. This domain was classified `user-directive`; it is also a provenance surface.

## Children

> Classified from the sweep's 22 candidates via the Node Classification Gate. **5 sub-domains, 2
> domain-level features, 33 leaf features.** 6 features are Deep Think additions (absent from the
> sweep); 3 candidates were merged; 3 were split. All nodes `[SURFACE]` — breadth pass only.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Place Records & Rooms | sub-domain | [16.01-place-records-rooms/](./16.01-place-records-rooms/) | [SURFACE] | 28 hypotheses (7 features) |
| 02 | Venue Technical Specification | sub-domain | [16.02-venue-technical-specification/](./16.02-venue-technical-specification/) | [SURFACE] | 27 hypotheses (6 features) |
| 03 | Studio Technical Specification | sub-domain | [16.03-studio-technical-specification/](./16.03-studio-technical-specification/) | [SURFACE] | 18 hypotheses (4 features) |
| 04 | Rehearsal & Practice Space Specification | feature | [16.04-rehearsal-practice-space-specification.md](./16.04-rehearsal-practice-space-specification.md) | [SURFACE] | 4 hypotheses |
| 05 | Curation, Provenance & Data Integrity | sub-domain | [16.05-curation-provenance-data-integrity/](./16.05-curation-provenance-data-integrity/) | [SURFACE] | 35 hypotheses (7 features) |
| 06 | Space Booking & Reservations | sub-domain | [16.06-space-booking-reservations/](./16.06-space-booking-reservations/) | [SURFACE] | 44 hypotheses (9 features) |
| 07 | Spec Conformance Check (Rider ↔ Room) | feature | [16.07-spec-conformance-check-rider-room.md](./16.07-spec-conformance-check-rider-room.md) | [SURFACE] | 5 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

### Deep Think Additions (not in the sweep's 22 candidates)

| Node | Why it must exist |
|------|-------------------|
| [16.06.02 External Calendar Sync](./16.06-space-booking-reservations/16.06.02-external-calendar-sync.md) | **The sweep's largest gap.** The Operator's primary pain point is a calendar in three incompatible places. No candidate addressed it. Without sync, WeJammin is the fourth. |
| [16.05.07 Duplicate Detection & Merge](./16.05-curation-provenance-data-integrity/16.05.07-duplicate-detection-merge.md) | Named in this index's own rationale ("dedup/merge"), absent from the candidates. Seeding from 3+ sources without it produces a registry **worse than empty** — it splits calendars. |
| [16.07 Spec Conformance Check](./16.07-spec-conformance-check-rider-room.md) | Asserted in this index's rationale as the domain's headline capability, owned by nobody. It sits between 16's spec and 18's rider and would fall down the gap. |
| [16.06.09 Recurring & Lockout Tenancy](./16.06-space-booking-reservations/16.06.09-recurring-bookings-lockout-tenancy.md) | Lockout appears in the sweep only as a word in a parenthetical. It is a **tenancy, not a booking** — and a large share of rehearsal revenue. |
| [16.01.06 Licences, Insurance & Statutory Records](./16.01-place-records-rooms/16.01.06-licences-insurance-statutory-records.md) | Liability cover is a hard gate on real venue bookings; the occupancy ceiling is a statutory ceiling 19 must not exceed **where the record's regime profile declares that slot** (D-13). Entirely absent from the sweep. |
| [16.03.04 Session Archive & Recall Policy](./16.03-studio-technical-specification/16.03.04-session-archive-recall-policy.md) | Split out of candidate 17, where it was bundled with invoicing. The session archive is **where provenance physically lives**. |

## Role Matrix

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 16.01 Place Records & Rooms | 👁️ View + suggest | 👁️ View + suggest | ✅ Full | 👁️ View (venue-type only) |
| 16.02 Venue Technical Specification | 👁️ View + suggest | 👁️ View | ⚙️ Config (statutory-derived fields not writable, where the profile declares them — D-13) | ❌ None (doors/transport only) |
| 16.03 Studio Technical Specification | 👁️ View + suggest | 👁️ View + suggest (primary) | ✅ Full | ❌ None |
| 16.04 Rehearsal & Practice Spaces | ✅ Full (primary) | 👁️ View | ✅ Full | ❌ None |
| 16.05 Curation, Provenance & Data Integrity | ✅ Contribute (primary) | ✅ Contribute (primary) | ✅ Full / 📊 Reports (harvest) | ⚙️ Suggest (limited, unresolved) |
| 16.06 Space Booking & Reservations | ✅ Full | ✅ Full | ✅ Full | ❌ None |
| 16.07 Spec Conformance Check | ✅ Full | ✅ Full | 📊 Reports | ❌ None |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
>
> Persona names come from [meta/personas.md](../meta/personas.md) — never redefined here.
>
> **Three patterns worth reading off this matrix:**
> 1. **The Fan is almost entirely absent** — `❌ None` on 4 of 7, and the exceptions are thin (a venue
>    page, an accessibility route, an at-risk signal to rally around). This is the platform's most
>    professional domain. Per D-11 the Fan is a first-class user; here that means a small, deliberate
>    surface, not a shrunken version of the professional one.
> 2. **The Operator is `⚙️ Config`, not `✅ Full`, on the venue spec** — statutory-derived facts
>    (operating-hours limit, dB limit, occupancy ceiling) are not theirs to write **where the record's
>    regime profile declares an instrument that imposes them** (16.01.06 D-02/D-05, D-13). Where it
>    declares none, the same numbers are Operator claims labelled as claims (16.02.03 D-01) — the
>    `⚙️ Config` posture holds because the *rule* is unchanged; only its input is absent.
> 3. **On 16.05 the Operator is `📊 Reports` for the harvest while Musician and Producer are `✅`** —
>    the party who owns the record is not the party who supplies its most trustworthy facts. That
>    inversion is the domain's defining property.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Explicit owner directive (D-07). Write model, coverage-at-zero-transactions, and the wrong-cut test on booking | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **5 sub-domains, 2 domain-level features, 33 leaf features** | Classification gate applied to 22 candidates + 6 Deep Think additions | `/ideate-discover` Step 3 |
| D-03 | **Rehearsal (16.04) is a feature, not a sub-domain** — despite venues and studios being sub-domains | One spec sheet, no interacting capability clusters. Symmetry is an aesthetic argument, and inflating structure is exactly what D-17 warns about | 16.04 DT-01 |
| D-04 | Booking stays in this domain — on a **mechanical** ground, not only the wrong-cut test | The completed reservation is the proof of presence that makes a post-gig report first-hand. No booking → no harvest → the registry rots | 16.06.03 DT-01; 16.05.06 DT-03 |
| D-05 | **Conflict default: last-agreed stands, contest visible** — not owner-wins | Owner-wins makes this a listings product and favours the party whose anti-persona is "misrepresents the room's specs". Policy is per field class | 16.05.04 D-01 |
| D-06 | Place type is a **set**, not an enum; the **room** is the spec- and calendar-carrying unit | Buildings are multi-hyphenate too. A spec on the place sends bands to the wrong room; a calendar on the place blocks parallel sales | 16.01.01 D-01; 16.01.02 D-01 |
| D-07 | The spec is **structured fields, not a document** | A PDF cannot be searched, diffed against a rider, or dated per-field. The structuring IS the unbuilt asset | 16.02.02 DT-01 |
| D-08 | The platform's calendar is **not** authoritative — it earns authority by syncing | Their calendar is where their life already is; asserting authority makes us the fourth incompatible place | 16.06.01 DT-03; 16.06.02 DT-02 |
| D-09 | **Dynamic pricing proposed `wont`** — for a positive reason, not scheduling | No demand data exists at cold start; surge-pricing a community's rehearsal room is a relationship decision; serves neither half of D-18 | 16.06.08 D-02 |
| D-10 | Two capabilities routed **out of the product** to `/create-prd` | ODbL share-alike contamination (legal); calendar sync protocol layer; virtual tour hosting | 16.05.01 DT-03; 16.06.02 DT-05; 16.01.03 DT-03 |
| D-11 | 16 publishes **standing terms**; 17 negotiates and settles the **deal** | The domain's sharpest seam. Standing terms are a room property; the deal is a show property | 16.02.05 DT-01 |
| D-12 | **A room's operating org arrives by grant *or* by room-scoped claim; a grant is never revoked by an act, only adjudicated as a dispute** | The cooperative sublease should cost nobody anything; the uncooperative landlord is precisely the case a fast path cannot serve. Revocability, not the grant itself, was the leverage problem | 16.01.01 D-12/D-13; 16.01.02 D-15/D-16; 16.05.02 D-16/D-17 |
| D-13 | **Statutory records are a regime profile of *capabilities*; only the US profile is authored, and register availability resolves per licensing authority** | Ideation D-32 keeps the model jurisdiction-parameterized while shipping one market. Every rule that reads a statutory field is capability-gated and has **no input** rather than a default where the regime supplies none | 16.01.06 D-05/D-06; 16.05.01 D-16; 16.02.01 D-16; 16.02.03 D-13/D-14; 16.05.07 D-08; 16.06.03 D-25 |
| D-14 | **Rehearsal backline is a read-through from 15, quantity-tracked by default, with the provision posture typed on the room spec** | Confirms 15.07 D-01 for the third room type; a duplicated list rots by construction. Ceremony is what kills the rehearsal path, so commodity stock is counted, not identified | 16.04 D-06/D-07/D-08; 16.06.07 D-06 |

### Merges & Splits Applied to the Sweep's Candidates

| Action | Detail |
|--------|--------|
| **Merged** | Candidate 02's "Studio Records" half → 16.01.01 Place Record. A studio record *is* a place record with `type=studio`; only the spec sheet differs. Only "Rooms & Acoustics" remained studio-specific (→ 16.03.01). |
| **Merged** | "Booking contact" (inside candidate 01's bundle) → 16.06.06 Enquiry Routing. A booking contact is a routing target, not a spec field. |
| **Merged** | "Merch terms" + "deal model" (both inside candidate 01) → 16.02.05 Standing Deal Model. Both are commercial terms; merch was filed under hospitality by habit. |
| **Split** | Candidate 14 → 16.06.03 Reservation Lifecycle / 16.06.04 Waitlist & Backfill / 16.06.09 Lockout. Waitlist is demand captured, not supply committed; lockout is not a booking. |
| **Split** | Candidate 17 → 16.06.07 Rate Cards / 16.03.04 Session Archive Policy. The recall fee is an extra; the policy is a durable provenance-bearing studio property. |
| **Split** | Candidate 22 → off-peak/seasonal (a rate-card variant) / dynamic pricing (proposed `wont`). They share a phrase and nothing else. |
| **Split** | Candidate 01's 11-field bundle → 5 features across 16.02 (capacity / stage-PA / access-logistics / hospitality / deal model). |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | **Will bands answer the post-gig prompt?** The domain's largest unvalidated assumption. Every freshness guarantee rests on it; if the rate is near zero, decay does not degrade gracefully — the registry rots while accurately documenting the rot. Test before finalising MoSCoW. | **User** | `/ideate-validate` — **validation, not design** |
| Q-02 | **The field-class → conflict-policy map**: who does the platform believe when an Operator and a band disagree about a physical fact? A values decision that defines what kind of registry this is. | **User** | Step 5 — **owner decision** |
| Q-03 | **The spec is not a set of constants.** Four features independently hit this: day-varying curfew (16.02.03 DT-04), production-dependent capacity (16.02.01 Q-02), billing-dependent hospitality (16.02.04 DT-04), conditional accessibility (16.01.04 DT-02). Does the spec need a general conditionality model? **16.05.04 DT-05 suggests fixing this would remove conflicts rather than resolve them.** | Agent | Step 5 — highest-value structural question |
| Q-04 | **Enum vs free text per spec field** (16.02 Q-01). Enums enable 16.07; free text is honest and uncheckable. **The domain's headline capability rests on this.** | Agent | Step 5 |
| Q-05 | **Is the mic locker a view over 15 Gear Registry scoped to the studio's org?** Decides whether there is one gear taxonomy or two. **Answered per feature, three times now** — 16.02.02 D-06 (venue backline), 16.03.02 D-04/D-05 (studio locker), 16.04 D-06 (rehearsal backline): yes, a read-through, never a second store. What remains is the population 15 cannot serve — an Operator with **no org entity** cannot publish at all (16.03.02 Q-02 / 16.04 Q-04), which now blocks supply in all three room types. | **User** | `/ideate-validate` · **cross-check with 15 mandatory** |
| Q-06 | **Can ODbL sources be used at all?** Share-alike may reach a derived database; OSM is simultaneously the best venue geodata and the heaviest obligation. | User | `/create-prd` (legal + architecture) |
| Q-07 | **Studio supply has no seeding story** — public data knows venues, not studios. Does 16.03's supply need a wholly different acquisition strategy, and does that change the launch sequence? | User | `/ideate-validate` |
| Q-08 | **Who owns the cross-domain compound** (dry-hire room + a 05 freelance engineer)? The platform's clearest structural cross-sell, currently nobody's feature. | **User** | `/ideate-validate` · cross-check with 05 |
| Q-09 | **Does the platform operate tenancies or only represent them?** Operating them = property-management software; representing them leaves a large share of rehearsal revenue untransactable. | **User** | `/ideate-validate` — scope decision |
| Q-10 | **Lockout generates no completion events**, so the harvest never fires on the supply used most (16.06 CX-08). The freshest data comes from the least-used rooms. Real hole, no proposed fix. | Agent | Step 5 |
| Q-11 | **Is rehearsal the domain's beachhead?** Highest frequency, lowest stakes, fastest feedback, simplest spec — and `problem-statement.md` Q-03 asks which consolidation surface goes first. | User | `/ideate-validate` · MoSCoW |
| Q-12 | Is 16.01.07 Trades genuinely in this domain? It passes the address test, exercises no spec and no calendar, and has **no freshness mechanism at all** (no transaction → no harvest). | User | `/ideate-validate` |
| Q-13 | ~~**Jurisdiction** — 16.01.06 and 16.02.06 assume a UK regime.~~ — **RESOLVED → D-13.** A record resolves a **regime profile** from its address; the profile declares which statutory slots exist, what instrument fills each, whether a per-premises register class exists, and whether a temporary-permission instrument exists. **Only the US profile is authored**; every other territory is an unauthored profile rendering explicit unknowns, and the UK vocabulary retires into one rather than being deleted or defaulted to. Register availability then resolves **per licensing authority** (16.05.01 D-16). **Residuals now tracked separately**: the US instrument names (16.01.06 Q-04, live `[PENDING]` to `/create-prd-security`), who maintains the per-authority coverage record (16.05.01 Q-06), and the unsizable Tier 1 dedup load that follows from it (16.05.07 Q-05). | — | Closed |
| Q-14 | Does a business have the right to be **delisted** from an unclaimed record it never created? That is most of the registry at launch. | User | `/create-prd-security` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-10|D-10]]
