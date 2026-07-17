# Venues, Studios & Spaces — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Venues, Studios & Spaces](./venues-studios-spaces-index.md)
> **Status**: [BREADTH] — 7 children classified; 10 intra-domain cross-cuts confirmed.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [16.06 Booking](./16.06-space-booking-reservations/) | [16.05 Curation](./16.05-curation-provenance-data-integrity/) | **The domain's power supply** — a completed reservation is the proof of presence that triggers the harvest and makes a report first-hand | Musician, Producer, Operator | High | 16.06.03 DT-01; 16.05.06 DT-03 |
| CX-02 | [16.05 Curation](./16.05-curation-provenance-data-integrity/) | [16.02 Venue Spec](./16.02-venue-technical-specification/) | The spec's truth is maintained by curation, not by its owner — the band who played there is a better witness than the Operator | Musician, Operator | High | 16.02.02 DT-03; 16.05.04 DT-01 |
| CX-03 | [16.01 Place Records](./16.01-place-records-rooms/) | [16.02](./16.02-venue-technical-specification/) · [16.03](./16.03-studio-technical-specification/) · [16.04](./16.04-rehearsal-practice-space-specification.md) | Composition — the room is the spec-carrying unit; the place's type set decides which spec sheet attaches | Operator, Musician, Producer | High | 16.01.01 D-01; 16.01.02 D-01 |
| CX-04 | [16.02 Venue Spec](./16.02-venue-technical-specification/) · [16.03 Studio Spec](./16.03-studio-technical-specification/) | [16.07 Conformance Check](./16.07-spec-conformance-check-rider-room.md) | The spec is one half of the match; the check is what makes structuring the spec worth the effort | Musician, Producer, Operator | High | 16.07 DT-04; 16.02.02 DT-05 |
| CX-05 | [16.03 Studio Spec](./16.03-studio-technical-specification/) | [16.06 Booking](./16.06-space-booking-reservations/) | The staffing model changes **what a booking is** — a room, or a room and a person with their own calendar | Producer, Operator | High | 16.03.03 DT-01; 16.06.05 D-01 |
| CX-06 | [16.01 Place Records](./16.01-place-records-rooms/) | [16.05 Curation](./16.05-curation-provenance-data-integrity/) | Every field on a place record is subject to seeding, claim, suggestion, provenance and decay | All | High | 16.01.01 States; 16.05 index |
| CX-07 | [16.01 Place Records](./16.01-place-records-rooms/) | [16.06 Booking](./16.06-space-booking-reservations/) | Statutory records gate bookings (hirer PLI); closure cascades to every room's calendar and live reservations | Operator, Musician | High | 16.01.06 D-04; 16.01.05 States |
| CX-08 | [16.04 Rehearsal](./16.04-rehearsal-practice-space-specification.md) | [16.06 Booking](./16.06-space-booking-reservations/) | Lockout is a **tenancy**, not a booking — and generates no completion events, so CX-01's engine never fires on the domain's most-used supply | Operator, Musician | High | 16.04 DT-02; 16.06.09 DT-01; 16.06 CX-08 |
| CX-09 | [16.05 Curation](./16.05-curation-provenance-data-integrity/) | [16.07 Conformance Check](./16.07-spec-conformance-check-rider-room.md) | A match against a stale or unverified field is false confidence — the check must be confidence-aware | Musician, Producer | High | 16.07 DT-05; 16.05.05 D-03 |
| CX-10 | [16.02 Venue Spec](./16.02-venue-technical-specification/) | [16.06 Booking](./16.06-space-booking-reservations/) | Published standing terms mean an enquiry starts from a baseline rather than a fishing expedition | Musician, Operator | Medium | 16.02.05 D-01; 16.06.06 D-03 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Booking ↔ Curation — *the domain's power supply*

**Relationship**: The most important connection in domain 16, and one the original rationale did not
name. The index justified keeping booking here on the wrong-cut test — the mic locker IS the booking
decision. Drilling found a harder, mechanical reason: **a completed reservation is the only proof that
a person was physically in a room.** That proof is what makes their post-gig report first-hand rather
than an anonymous claim (16.05.06 D-02), and the harvest is the only mechanism in the domain that
produces fresh, disinterested facts (16.05.05 DT-05).

The chain is unbroken and load-bearing: **booking → completion → harvest → fresh facts → a spec worth
trusting → a conformance check that means something → a reason to book here.** Remove booking from
this domain and the registry has no engine — decay would still label staleness perfectly, and nothing
would ever be refreshed.

**Role scoping**:
- **Musician / Producer**: book, and are the harvest's contributors. They pay for the registry's accuracy with 20 seconds of attention.
- **Operator**: receives both — bookings, and free QA on their own listing. Notably *not* the source of the strong facts.
- **Fan**: absent from both sides.

**Synthesis questions answered**:
1. **Shared state conflict**: None — booking writes reservations, curation writes facts. The link is the completion event.
2. **Trigger chain**: Reservation completes (inferred, 16.06.03 D-01) → harvest prompt selects the least-certain fields (16.05.05) → answers write strong-class provenance → clocks reset. Every step degrades gracefully except the first: a completion that never fires is silent, and the registry stops improving with no error anywhere.
3. **Permission intersection**: The booking **is** the credential. A harvest answer is strong-class only because a reservation proves presence.
4. **Notification fan-out**: One prompt per completed reservation, shared with the PRO setlist ask (16.02.06 DT-04). That prompt is a scarce resource every feature wants a piece of.
5. **State transition conflict**: An Operator self-confirming a field while a band's harvest contradicts it. Different provenance classes, so a timestamp tiebreak is wrong. Unresolved — 16.05.05 Q-01.

> **The hole**: CX-08. Lockout tenancies never complete, so this chain never fires on the domain's
> highest-frequency supply. The freshest data comes from the least-used rooms.

---

### CX-02: Curation ↔ Venue Spec — *the inverted witness*

**Relationship**: The venue spec is 16's flagship asset and **its owner is not its best witness.**
`personas.md` names the Operator's accidental anti-persona precisely: "publishes a stale gear list, so
a band arrives to a room that can't run their show" — and their intentional one: "misrepresents the
room's specs to win bookings". The party with write access to the spec is the party with a reason to
flatter it.

Curation is the correction, and it inverts the usual model: the band who carried through the load-in
has tested the claim empirically and has nothing to sell. This is why 16.05.04's default is *not*
owner-wins (D-01) — resolving every dispute in the Operator's favour would make the registry a listings
product that systematically believes the interested party.

**Role scoping**:
- **Operator**: writes the spec; discovers they do not have the last word on it.
- **Musician**: corrects it from experience; on accessibility their correction is proposed to outrank the owner outright (16.01.04 DT-04).
- **Producer**: same, on studio facts — `personas.md` makes them a trust broker whose attestation outweighs a self-claim.
- **Fan**: sees a contested marker on public facts; that disclosure is itself information.

**Synthesis questions answered**:
1. **Shared state conflict**: The provenance ranking settles most of it (16.05.03 D-02). What reaches 16.05.04 is owner-vs-first-hand, where both are credible.
2. **Trigger chain**: Harvest contradiction → contest → corroboration → `[PENDING]` flip or escalate.
3. **Permission intersection**: Inverted for statutory fields — the owner has *less* authority there (16.01.06 D-02).
4. **Notification fan-out**: Contests notify the Operator. A stream of "more people say you're wrong" is a real defection risk.
5. **State transition conflict**: **A large share of "conflicts" are conditionality failures** (16.05.04 DT-05) — the ramp was out one week and not the next; both parties told the truth and the spec model could not hold it. Fixing conditionality (index Q-03) would *remove* conflicts, not resolve them.

---

### CX-04 / CX-09: Specs ↔ Conformance Check — *the incentive loop, and its failure mode*

**Relationship (CX-04)**: These close the loop the venue spec has been assuming. 16.02.02 DT-02 worries
that Operators will not fill a long structured form — they are at a loading dock, not a desk. The
answer is not persuasion, it is **consequence**: an unstated field returns "unknown" (16.07 D-02),
unknowns lose enquiries, and the Operator sees which gaps cost them work. The check converts
spec-filling from admin into self-interest, and it is why the structuring bet pays off at all.

**Relationship (CX-09)**: And it is exactly where the domain can hurt someone. A green tick derived
from a never-verified field looks identical to one derived from a fact a band confirmed last week — and
the band acts on it. They leave the wedges at home. **A confidently wrong check is worse than no
check**, because it moves risk from the venue onto the platform's claim. Matches must carry per-field
confidence, and stale fields must drop out of confident matching (16.05.05 D-03).

**Role scoping**:
- **Musician / Producer**: run the check; bear the cost of a false positive personally.
- **Operator**: sees conflicts at advance instead of at 6pm, and sees which unstated fields lose them work.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: None — the check reads; it never writes.
2. **Trigger chain**: Rider (18) + spec (16.02/16.03) + freshness (16.05.05) → three-way output. If freshness is ignored, the output is confidently wrong.
3. **Permission intersection**: The Operator cannot suppress a conflict against their room. Deliberate.
4. **Notification fan-out**: Conflicts surface at advance to both sides.
5. **State transition conflict**: A spec changing between a check in January and a show in March — is the check a moment or a subscription? (16.07 Q-03.)

> **Dependency worth naming**: 16.07 exists only if 16.02 Q-01 resolves toward enums (or enum +
> caveat). **The domain's headline capability rests on an unresolved modelling decision.**

---

### CX-03: Place Records ↔ the three spec sub-domains

**Relationship**: Composition, and the reason the type set works (16.01.01 D-01). A building typed
`[venue, studio]` does not carry two spec sheets — its **rooms** do, individually. The main room takes a
venue spec, the tracking room upstairs takes a studio spec, and both sit under one record, one org, one
claim, one enquiry inbox, one calendar system. Model the spec on the place instead of the room and a
band books "the venue" and arrives at the wrong room.

**Role scoping**:
- **Operator**: creates the record once, then rooms; at N=1 the room layer is invisible (16.01.02 D-03).
- **Musician / Producer**: search and book *rooms*; the place is context.
- **Fan**: sees the place and a room name on a ticket.

**Synthesis questions answered**:
1. **Shared state conflict**: The record owns identity/claim; the room owns spec/calendar. Removing a type from the set while a room of that type exists must be blocked, not cascaded.
2. **Trigger chain**: Claim → write access to all rooms. Closure → all room calendars (16.01 CX-04).
3. **Permission intersection**: Write access is record-level and inherited. No per-room delegation — which the sublease question (16.01.01 Q-01) will likely force.
4. **Notification fan-out**: Record-level events reach everyone with a reservation on any room.
5. **State transition conflict**: Closure racing a booking; closure must win and roll back.

---

### CX-05: Studio Spec ↔ Booking

**Relationship**: The staffing model (16.03.03) is a spec field that **changes what a booking is**. Dry
hire reserves a room. Full-service reserves a room *and a person* — two calendars, two availability
constraints, an atomic compound that can fail on either side (16.06.05). This is the clearest case in
the domain of a spec fact with transactional teeth, and it is why 16.06.05 exists.

It also carries the domain's most interesting unowned opportunity: **dry hire here + a freelance
engineer from 05**, one transaction. No competitor can offer it because none holds both sides. It is
consolidation as D-18 defines it, and it is currently nobody's feature (index Q-08).

**Role scoping**:
- **Producer**: on both sides — buying the room, and sometimes *being* the house engineer. The multi-hyphenate fact, structurally.
- **Operator**: manages two resource types with asymmetric scarcity; the engineer is usually the binding constraint.
- **Musician**: needs full-service and is entirely at the mercy of the engineer's calendar.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared state conflict**: Room and person are separate resources; the compound owns atomicity.
2. **Trigger chain**: Hold room → hold engineer → confirm both or release both. A partial release leaves the orphaned hold that is the Operator's named failure — automated.
3. **Permission intersection**: If the engineer is a named 05 provider, whose permission grants the booking? Unresolved (16.03.03 Q-03).
4. **Notification fan-out**: Operator and engineer, who may be different parties.
5. **State transition conflict**: Two compounds racing for one shared engineer.

---

### CX-06, CX-07, CX-08, CX-10 — summary detail

**CX-06 (Place Records → Curation)**: universal. Every field on every record is seeded, claimable,
suggestible, provenance-tracked and decaying. This is the connection that makes 16 a registry; listed
for completeness because it is so pervasive it could be mistaken for background.

**CX-07 (Place Records → Booking)**: statutory records gate transactions — a hirer PLI requirement must
surface at enquiry, not at the door (16.01.06 D-04) — and closure cascades destructively into live
reservations with an inverted refund ladder (16.01.05; 16.06.03 D-05).

**CX-08 (Rehearsal → Booking)** — *the hole*: lockout is a tenancy (16.04 DT-02). It has no
availability, no deposit ladder, no buffers, and **no completion** — so CX-01's chain never fires. The
domain's highest-frequency supply (16.04 DT-04 — rehearsal is the frequency play D-18 needs) generates
zero freshness data. `[PENDING — /ideate-discover Step 5 deepening]`; escalated as index Q-10.

**CX-10 (Venue Spec → Booking)** — *Medium*: published standing terms (16.02.05) mean an enquiry starts
from a shared baseline. Medium confidence because 16.02.05 D-02 makes non-disclosure a first-class
posture — for the venues that publish nothing this connection does not exist, and those may be the
venues bands most want to compare.

---

## Cross-Cut Mechanisms Discovered (for the global CX file)

> Candidates that turned out to be **mechanisms serving many domains**. Recorded here per the Node
> Classification Gate; not modelled as nodes in this domain. In each case the *mechanism* is platform
> machinery and the *domain-specific specialisation* stays here — that split is stated per row.

| Mechanism | Serves | What stays domain-owned |
|-----------|--------|------------------------|
| **Entity claim & control verification** | 16, 01, 02, 15 | The venue-specific proof ladder (phone at the listed number, premises licence, venue domain) and the stakes — a claim inherits a live calendar and other people's deposits |
| **Community curation: suggest → review → apply, with per-field provenance & revision history** | 16, 01, 02, 12, 15 | The **source-class ranking** (statutory > owner > first-hand > community > seeded) — only this domain has licence-derived facts and post-transaction eyewitnesses |
| **External data ingestion, dedup/merge & source-licence compliance** | 16, 01, 02, 12, 15 | Which sources; the negative merge rules (same-address ≠ same-place; relocation ≠ duplicate; two rooms ≠ two records) |
| **Verification decay & confidence scoring** | 16, 01, 15 | The **decay profile table** — that a ceiling height never decays and a rehearsal-room snare decays weekly is music-domain knowledge |
| **Availability calendar & conflict-free reservation** | 16, 05, 06, 08, 17 | The **hold ranking and challenge protocol** — a live-music practice no other domain needs |
| **Enquiry / RFQ thread → quote → accept** | 16, 05, 13, 14, 18 | The **posture discriminator** (instant / enquiry / contact) as a statement about a room's commercial stance, and the enquiry payload |
| **Deposits, escrow & cancellation refund ladders** | 16, 05, 06, 13, 17, 19 | Operator-fault inversion; the perishable-inventory asymmetry |
| **Geo search & map discovery** | 16, 04, 05, 17, 19, 03 | Nothing — wholly generic; 16 is simply its largest consumer |
| **Reviews & reputation** | 16, 05, 13, 14, 06 | Nothing — and 16.05.06 is explicitly **not** this (facts, not opinions; 16.05.06 DT-01) |

## Not-Product Concerns Routed Out

| Concern | Route to | Why |
|---------|----------|-----|
| **ODbL / share-alike contamination analysis** | `/create-prd` (legal + architecture) | Share-alike may reach a derived database. OSM is the best venue geodata *and* the heaviest obligation. Not a product call — and getting it wrong contaminates the platform's core dataset (16.05.01 DT-03) |
| **Calendar sync protocol layer** (iCal vs CalDAV vs Google push, token lifecycle, polling, rate limits) | `/create-prd-architecture` | The *guarantee*, scoping rule, conflict policy and failure UX stay product; the protocol does not (16.06.02 DT-05) |
| **Virtual tour hosting** (embed vs self-host vs omit) | `/create-prd-architecture` | The structured photo checklist is product; 3D tour streaming is infrastructure (16.01.03 DT-03) |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 16.02 Venue Spec | 16.03 Studio Spec | Considered because they are siblings that look symmetrical. Rejected: no shared state, no trigger, no data flow. A venue's PA and a studio's mic locker never interact. Their only relationship is through 16.01 (both attach to rooms) and 16.07 (both are checkable). **The symmetry is presentational, not structural** — and mistaking it for a relationship is what would produce a bogus "Technical Specs" super-sub-domain. |
| R-02 | 16.04 Rehearsal | 16.02 Venue Spec | Considered: a rehearsal room in a venue's basement. Rejected as a pair — that is the type set (16.01.01 D-01) doing its job, which is CX-03, not a rehearsal↔venue relationship. The two specs never read each other. |
| R-03 | 16.07 Conformance Check | 16.05 Curation (as a *writer*) | Considered: should a failed check flag the spec? Rejected — the check **reads only**. A conflict means the room cannot meet a requirement, not that the spec is wrong. Conflating "this room doesn't suit you" with "this field is false" would fill the conflict queue with non-conflicts and poison 16.05.04's signal. |
| R-04 | 16.01 Place Records | 16.07 Conformance Check | Considered because accessibility (16.01.04) is checkable against a performer's requirements. Rejected as a *direct* domain-level pair: it routes through the spec layer like everything else 16.07 reads. Recorded so the indirection is deliberate — 16.07's Cross-Cut Notes carry the 16.01.04 link at feature level, which is the right altitude. |
| R-05 | 16.04 Rehearsal | 16.05 Curation | Considered and **inverted into a finding rather than a pair**: rehearsal rooms are the *best test case* for the harvest loop (highest frequency, lowest stakes, fastest feedback — 16.04 DT-03), but CX-08 shows lockout tenancies produce no completion events at all. The relationship is real for hourly rehearsal and **absent** for lockout, which is the more commercially significant half. Too conditional to record as a confirmed pair; too important to drop. See index Q-10. |
| R-06 | 16.06 Booking | 16.07 Conformance Check | Considered: should a failed check block a booking? Rejected — 16.07 D-05: a conflict is information, never a verdict. The band decides whether 4 monitor mixes is workable. A platform that blocks bookings on a spec mismatch would be enforcing its own possibly-stale data against two consenting parties. |
