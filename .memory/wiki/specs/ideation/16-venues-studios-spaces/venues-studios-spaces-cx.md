# Venues, Studios & Spaces — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Venues, Studios & Spaces](./venues-studios-spaces-index.md)
> **Status**: [DEEP] — Step 6 synthesis. 7 children; 11 intra-domain cross-cuts confirmed, 50 feature-level cross-cut notes folded in.
> **Last updated**: 2026-07-23

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [16.06 Booking](./16.06-space-booking-reservations/) | [16.05 Curation](./16.05-curation-provenance-data-integrity/) | **The domain's power supply** — a completed reservation is the proof of presence that triggers the harvest and makes a report first-hand | Musician, Producer, Operator | High | 16.06.03 DT-01; 16.05.06 DT-03 |
| CX-02 | [16.05 Curation](./16.05-curation-provenance-data-integrity/) | [16.02 Venue Spec](./16.02-venue-technical-specification/) | The spec's truth is maintained by curation, not by its owner — provenance is derived from **relationship to the record, not persona lens** (D-12) | Musician, Producer, Operator | High | 16.02.02 DT-03; 16.05.04 D-01; 16.02.01 D-12/DT-13 |
| CX-03 | [16.01 Place Records](./16.01-place-records-rooms/) | [16.02](./16.02-venue-technical-specification/) · [16.03](./16.03-studio-technical-specification/) · [16.04](./16.04-rehearsal-practice-space-specification.md) | Composition — the room is the spec-carrying unit; the statutory record supplies ceilings (date-scoped) **where the regime profile declares them**; accessibility displacement enters the capacity chain | Operator, Musician, Producer | High | 16.01.01 D-01; 16.01.02 D-01; 16.01.06 D-05; 16.02.01 DT-06/DT-15/D-16 |
| CX-04 | [16.02 Venue Spec](./16.02-venue-technical-specification/) · [16.03 Studio Spec](./16.03-studio-technical-specification/) | [16.07 Conformance Check](./16.07-spec-conformance-check-rider-room.md) | The spec is one half of the match; the **field triple** (typed value + closed-vocab caveat + display-only note) makes the check computable | Musician, Producer, Operator | High | 16.07 DT-04; 16.02.02 D-05; 16.02.03 |
| CX-05 | [16.03 Studio Spec](./16.03-studio-technical-specification/) | [16.06 Booking](./16.06-space-booking-reservations/) | The staffing model and the **pooled mic locker** change what a booking is — a room, a room + person, or a room + a specific contended asset | Producer, Operator, Musician | High | 16.03.03 DT-01; 16.03.02 D-08; 16.06.05 D-01 |
| CX-06 | [16.01 Place Records](./16.01-place-records-rooms/) | [16.05 Curation](./16.05-curation-provenance-data-integrity/) | The registry substrate — every field is seeded, claimed, suggested, provenance-ranked, decayed; the claim **anchor class** now includes the address, and an in-window edit invalidates it | All | High | 16.01.01 D-09/DT-10; 16.05 index |
| CX-07 | [16.01 Place Records](./16.01-place-records-rooms/) | [16.06 Booking](./16.06-space-booking-reservations/) | The room **graph is declared here, enforced there** (evaluate at hold, re-evaluate at confirm, first commit wins); statutory records gate bookings; closure cascades unconditionally, Out-of-Service narrowly | Operator, Musician, Producer | High | 16.01.02 DT-05/D-10; 16.06.01; 16.01.06 D-04 |
| CX-08 | [16.04 Rehearsal](./16.04-rehearsal-practice-space-specification.md) | [16.06 Booking](./16.06-space-booking-reservations/) | Lockout is a **tenancy**, not a booking — generates no completion events, so CX-01's engine never fires on the domain's most-used supply | Operator, Musician | High | 16.04 DT-02; 16.06.09 DT-01; index Q-10 |
| CX-09 | [16.05 Curation](./16.05-curation-provenance-data-integrity/) | [16.07 Conformance Check](./16.07-spec-conformance-check-rider-room.md) | A match against a stale or unverified field is false confidence — the check must be confidence-aware and return `unknown` on missing measurement metadata | Musician, Producer | High | 16.07 DT-05; 16.05.05 D-03; 16.02.03 |
| CX-10 | [16.02 Venue Spec](./16.02-venue-technical-specification/) | [16.06 Booking](./16.06-space-booking-reservations/) | Published standing terms seed the enquiry baseline; `available ≠ included` caveats carry the rate line so bands are not surprised at settlement | Musician, Operator | Medium | 16.02.05 D-01; 16.02.02 (conditional-on-cost caveat); 16.06.07 |
| CX-11 | [16.01 Place Records](./16.01-place-records-rooms/) | [16.03 Studio Spec](./16.03-studio-technical-specification/) | Mobile assets (mic locker) are **place assets allocated per booking**, not room fields — a room's advertised spec is false the moment the U47 is in the other room; and the control-room photo leaks serials 15 withholds | Producer, Operator | Medium | 16.01.02 DT-07; 16.03.02; 16.01.03 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Intra-sub-domain cross-cuts** (curfew↔deal, limiter↔capacity, limiter↔PA spec, standing-deal↔hospitality inside 16.02; mic-locker↔rooms inside 16.03; the seven 16.01 internal ties; the 16.05 provenance-ranking chain) live in each sub-domain's own CX file, not here. This file connects the seven **children**.

---

## Cross-Cut Details

### CX-01: Booking ↔ Curation — *the domain's power supply*

**Relationship**: The most important connection in domain 16, and one the original rationale did not
name. The index justified keeping booking here on the wrong-cut test — the mic locker IS the booking
decision. Drilling found a harder, mechanical reason: **a completed reservation is the only proof that
a person was physically in a room.** That proof is what makes their post-gig report first-hand rather
than an anonymous claim (16.05.06 D-02), and the harvest is the only mechanism in the domain that
produces fresh, disinterested facts (16.05.05 DT-05). Step 6 sharpened two constraints on the harvest:
question selection must intersect *least-certain* with *witnessable by this booking* — a band witnesses
only what it touched, silence is not confirmation (16.02.02 DT-11) — and the studio harvest rides the
session-close flow the Producer is already completing, while the **venue harvest has no flow to ride**,
which is exactly why the prompt is a scarce, contested resource.

**Role scoping**:
- **Musician / Producer**: book, and are the harvest's contributors. They pay for the registry's accuracy with ~20 seconds of attention.
- **Operator**: receives both — bookings, and free QA on their own listing. Notably *not* the source of the strong facts. An Operator who plays their own room enters the harvest through the Musician door carrying the Operator's incentive (16.02.03 DT-11) — a hole.
- **Fan**: a Fan's ticket is not a reservation and never triggers a harvest (16.05.06 explicit non-cut). A Fan observed nothing on the spec.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Booking owns reservations; curation owns facts. No shared record — the link is the completion event. Merge is moot; provenance ranking (statutory > owner > first-hand > community > seeded) settles which fact wins.
2. **Trigger chain + rollback + sync/async**: Reservation completes (async, inferred, 16.06.03 D-01) → harvest prompt selects least-certain ∩ witnessable fields → answers write strong-class provenance → decay clocks reset. Every step degrades gracefully except the first: a completion that never fires is silent — the registry stops improving with no error anywhere.
3. **Permission intersection**: The booking **is** the credential. A harvest answer is strong-class *only* because a reservation proves presence; without it the same answer is anonymous community-class.
4. **Notification fan-out**: One prompt per completed reservation, shared with the PRO setlist ask (16.02.06) and contended by 02/17/18/19/20 (the post-gig attention budget). That prompt is a commons nobody owns.
5. **State-transition race**: An Operator self-confirming a field while a band's harvest contradicts it — different provenance classes, so a timestamp tiebreak is wrong. Unresolved (16.05.05 Q-01).

> **The hole**: CX-08. Lockout tenancies never complete, so this chain never fires on the domain's
> highest-frequency supply. The freshest data comes from the least-used rooms.

---

### CX-02: Curation ↔ Venue Spec — *the inverted witness*

**Relationship**: The venue spec is 16's flagship asset and **its owner is not its best witness.**
`personas.md` names the Operator's anti-persona precisely: "misrepresents the room's specs to win
bookings". The party with write access to the spec is the party with a reason to flatter it. Curation
is the correction, and it inverts the usual model: the band who carried through the load-in has tested
the claim empirically and has nothing to sell (16.05.04 D-01 — *not* owner-wins). Step 6 added a
platform-wide constraint that lands here first: **provenance class is derived from the contributor's
relationship to the record, not the active persona lens** (16.02.01 D-12/DT-13) — because one human
holds several roles at once, a provenance model keyed on the lens is gameable. The capacity feature is
also three conflict classes in one (statutory ceiling not contestable; configuration capacity under the
default; backline condition a first-hand-wins exception), which is itself the evidence for per-field-class
policy (16.05.04 D-02).

**Role scoping**:
- **Operator**: writes the spec; discovers they do not have the last word on it; on statutory fields has *less* authority (16.01.06 D-02).
- **Musician**: corrects it from experience; on accessibility and backline condition their first-hand correction is proposed to outrank the owner (16.01.04 DT-04; 16.02.02 DT-16).
- **Producer**: same, on studio facts — a trust broker whose attestation outweighs a self-claim.
- **Fan**: sees a contested marker on public facts; that disclosure is itself information.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The record owns the field; the provenance ranking (16.05.03 D-02) settles most. What reaches 16.05.04 is owner-vs-first-hand, both credible — last-agreed stands, contest visible.
2. **Trigger chain + rollback**: Harvest contradiction → contest → corroboration → `[PENDING]` flip or escalate to 24. Async; no rollback (append-only revision history).
3. **Permission intersection**: Inverted for statutory fields — the owner cannot write the operating-hours limit, the dB limit or the occupancy ceiling **where the record's regime profile declares an instrument that imposes them** (16.01.06 D-02/D-05). Where it declares none — as the US launch profile does not for the operating conditions — the same numbers are the Operator's own claims labelled as claims (16.02.03 D-01/D-13) and the inversion has no input. A rival Operator's false edit routes through the suggested-edit queue either way, never a unilateral write.
4. **Notification fan-out**: Contests notify the Operator. A stream of "more people say you're wrong" is a real defection risk — a product tension, not just a mechanism.
5. **State-transition race**: **A large share of "conflicts" are conditionality failures** (16.05.04 DT-05) — the ramp was out one week and not the next; both parties told the truth and the flat spec model could not hold it. Fixing conditionality (index Q-03) would *remove* conflicts, not resolve them.

---

### CX-03: Place Records ↔ the three spec sub-domains — *composition and the capacity chain*

**Relationship**: Composition, and the reason the type set works (16.01.01 D-01/D-06). A building typed
`[venue, studio]` does not carry two spec sheets — its **rooms** do, individually. Model the spec on the
place instead of the room and a band books "the venue" and arrives at the wrong room. Step 6 added the
supply chain that feeds capacity: the **statutory ceiling is date-scoped, not scalar** (a temporary
permission at 499 for one weekend is a second, time-bounded ceiling — 16.02.01 DT-06 — **where the
regime profile declares a temporary-permission instrument**, 16.01.06 D-05 / 16.02.03 D-13; where it
does not, the date-scoping machinery is unchanged and has one ceiling to resolve), and a **wheelchair
bay physically displaces standing places** (16.02.01 DT-15), so accessible provision is a term in the
capacity subtraction chain, not a parallel concern — a fact currently owned by nobody. Configurations
belong to the room (D-04); a **divisible room** (airwall / combinable rehearsal rooms) is not a
configuration but a child room with `part-of` (16.01.02 DT-08), because two clients can hold the halves
simultaneously and no capacity property can express that.

**Role scoping**:
- **Operator**: creates the record once, then rooms; at N=1 the room layer is invisible (16.01.02 D-03); declares the accessible displacement rate.
- **Musician / Producer**: search and book *rooms*; the place is context.
- **Fan**: sees the place and a room name on a ticket; on a `[venue, studio]` record the studio rooms are absent from the Fan payload, not merely collapsed.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The record owns identity/claim; the room owns spec/calendar; the statutory record owns the ceiling consumed here as a hard cap — **where the regime profile declares an occupancy-ceiling slot** (16.01.06 D-05/D-06); where it does not, there is no ceiling, no contradiction detection, and every figure is an unverified Operator claim (16.02.01 D-16). Removing a type from the set while a room of that type exists is **blocked, not cascaded**. Room subdivision/merge must **freeze** the retired room's configurations for historical bookings (a 2024 settlement stays readable).
2. **Trigger chain + rollback**: Claim → write access to all rooms. A ceiling drop while a hold exists **suspends the configuration but never voids the hold** (no tickets exist yet); the holder is notified to decide before conversion.
3. **Permission intersection**: Write access is record-level and inherited **except on a room carrying its own operating org**. That authority now has **two origins** (16.01.01 D-12): a **grant** (16.01.02 D-09 — instant, no claim unit, the cooperative default) and a **room-scoped claim** (16.05.02 D-16 — L7 on the sublease, Provisional until reviewed, for the landlord who will not cooperate). A grant is **not unilaterally revocable**: revocation is adjudicated, and the room stays live and bookable throughout (16.01.02 D-16).
4. **Notification fan-out**: Record-level events (closure) reach everyone with a reservation on any room.
5. **State-transition race**: Closure racing a booking — closure wins and rolls back; a **statutory-condition** change must cascade to confirmed reservations the way closure does, and currently nothing does (16.02.03 gap, Q-04). Where the profile declares no such condition (16.01.06 D-05) the cascade has no trigger — the equivalent Operator-claim edit is 16.02.03 D-08's "the negotiation holds the value it was quoted against", which is a different rule with a different owner.

---

### CX-04 / CX-09: Specs ↔ Conformance Check — *the incentive loop, and its failure mode*

**Relationship (CX-04)**: These close the loop the venue spec assumes. 16.02.02 DT-02 worries Operators
will not fill a long structured form — they are at a loading dock, not a desk. The answer is not
persuasion, it is **consequence**: an unstated field returns "unknown" (16.07 D-02), unknowns lose
enquiries, the Operator sees which gaps cost them work. Step 6 supplied the mechanism that makes the
check possible at all: the **field triple** — typed value + closed-vocabulary caveat + display-only note
(16.02.02 D-05) — so the check computes on values and caveats, never on free-text notes (resolving 16.07
Q-02). Base + typed exceptions (16.02.03) evaluate curfew/limiter to a **single value at the show's
date**, precisely the checkable form Q-02 feared free text would destroy.

**Relationship (CX-09)**: And it is exactly where the domain can hurt someone. A green tick derived from
a never-verified field looks identical to one derived from a fact a band confirmed last week — and the
band acts on it, leaving the wedges at home. **A confidently wrong check is worse than no check.** A
limiter threshold missing weighting / measurement point / averaging returns `unknown`, not a false pass
(16.02.03 → 16.07); matches carry per-field confidence and stale fields drop out of confident matching
(16.05.05 D-03).

**Role scoping**:
- **Musician / Producer**: run the check; bear the cost of a false positive personally.
- **Operator**: sees conflicts at advance instead of at 6pm, and which unstated fields lose them work; cannot suppress a conflict against their room.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: None — the check reads; it never writes (R-03 defends this). A failed check is "this room doesn't suit you", never "this field is false".
2. **Trigger chain + sync**: Rider (18) + spec (16.02/16.03) + freshness (16.05.05) → three-way output {pass / conflict / unknown}, synchronous at advance. A check run before the show's configuration is set returns `unknown` for config-dependent fields.
3. **Permission intersection**: The Operator cannot suppress a conflict against their room — deliberate.
4. **Notification fan-out**: Conflicts surface at advance to both sides.
5. **State-transition race**: A spec changing between a January check and a March show — is the check a moment or a subscription? (16.07 Q-03.)

> **Dependency worth naming**: 16.07 exists only if 16.02 Q-01 resolves toward enums (or enum + caveat).
> **The domain's headline capability rests on an unresolved modelling decision.**

---

### CX-05: Studio Spec ↔ Booking — *staffing, the pooled mic locker, and gear-dependent bookings*

**Relationship**: The staffing model (16.03.03) is a spec field that **changes what a booking is**. Dry
hire reserves a room; full-service reserves a room *and a person* — two calendars, an atomic compound
that can fail on either side (16.06.05). Step 6 found two harder cases in the mic locker. First, the
**pooled double-sale** (16.03.02 → 16.06.05): the mic locker is studio-pooled, not room-bound, so two
rooms booked for the same Tuesday, both chosen for the studio's single C12, is a double-sale **no
calendar detects** because no calendar owns the mic — room calendars are independent. Second,
**gear-dependent booking** (16.03.02 D-08): a Producer books "the room with the C12"; when it
breaks / sells / walks three days out, the booking is materially void and **no system connects the two
facts**. Both are the domain's clearest structural cross-sell and its clearest structural hole in one
feature.

**Role scoping**:
- **Producer**: on both sides — buying the room, and sometimes *being* the house engineer who owns half the mic locker personally (15.01.01 DT-11). The multi-hyphenate, structurally.
- **Operator**: manages two resource types with asymmetric scarcity; the engineer or the one good mic is usually the binding constraint.
- **Musician**: needs full-service and is at the mercy of the engineer's calendar.
- **Fan**: none.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Room and person and pooled asset are separate resources; the compound (16.06.05) owns atomicity. The pooled mic has no calendar owner today — the gap that produces the double-sale.
2. **Trigger chain + rollback**: Hold room → hold engineer → hold pooled asset → confirm all or release all. A partial release leaves the orphaned hold that is the Operator's named failure — automated. Asset withdrawal mid-booking is neither a fault report nor a cancellation; the booking consequence is 16's alone (16.03.02 → 15.08).
3. **Permission intersection**: If the engineer is a named 05 provider, whose permission grants the booking? Unresolved (16.03.03 Q-03).
4. **Notification fan-out**: Operator and engineer (who may be different parties); on asset withdrawal, every booking that named that asset.
5. **State-transition race**: Two compounds racing for one shared engineer or one shared mic — the pooled-asset case has no detector, so the race is currently silent.

---

### CX-06: Place Records ↔ Curation — *the registry substrate*

**Relationship**: Universal. Every field on every record is seeded, claimable, suggestible,
provenance-tracked and decaying — this is the connection that makes 16 a registry rather than a listings
board. Step 6 hardened the claim: the anchor for ownership is no longer just the phone number but a
whole **anchor class including the address** (16.01.01 D-09/DT-10), and an in-window edit must
**invalidate** the anchor, not merely log it. Seeding creates the typed, **zero-room** record that D-05
exists to permit (the cold-start argument that killed pure type derivation); source tags map to the type
set (`amenity=nightclub → {venue}`), listings sites map to nothing safely (DT-14). The suggested-edit
queue supplies the field classes curation ranks on — statutory / anchor / fact / commercial /
structural — and `location_precision` and `typeset` are **structural, not fact** (the community can
correct where a place is, but not what kind of place it is).

**Role scoping**:
- **All roles contribute**; the Operator claims and gains owner-class provenance; Musician/Producer supply first-hand; seeding supplies the weakest class.
- **Fan**: limited, unresolved suggest surface (index Role Matrix).

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The record owns the field; per-field provenance + revision history is the merge strategy (supersede, never edit). Rooms are dedup's negative constraint — two rooms at one address are never duplicates (16.05.07 D-03).
2. **Trigger chain + rollback**: Seed → claim → suggest → review → apply. A never-verified record must **not present as open** (16.01.05 D-03) — which is what makes a fabricated record harmless.
3. **Permission intersection**: A lineage declaration (rename vs refit vs subdivide) is a **contestable suggested edit, not a unilateral Operator write** — the Operator's incentive is skewed toward declaring "refit" to reset decay.
4. **Notification fan-out**: Suggested edits notify the claimant; contests notify both sides.
5. **State-transition race**: An in-window edit racing anchor validation — the edit invalidates the anchor (D-09), so the race resolves toward re-verification, not a silent overwrite.

---

### CX-07: Place Records ↔ Booking — *the room graph, declared here, enforced there*

**Relationship**: The room is the calendar-carrying unit, and its **relationships to other rooms are a
graph declared in 16.01.02 and enforced in 16.06.01**. `requires` and `excludes` are the same graph read
two ways (16.06.05 DT-03), which removes the possibility of the two features disagreeing. Two hard
requirements land in booking: the graph must be **evaluated at hold and re-evaluated at confirm — first
commit wins, the loser's hold released with a named reason** — otherwise two exclusive siblings both
confirm. Place closure cascades to every room and **wins unconditionally**; **Out of Service** (16.01.02
D-10) is its room-scoped counterpart with a narrow cascade (this room's live bookings only) — a flooded
live room is not a closed studio. Statutory records gate transactions: a hirer
liability-cover requirement must surface at enquiry, not at the door (16.01.06 D-04) — a **slot** that
survives every regime profile, because it is what the place demands of the hirer rather than what a
statute demands of the place.

**Role scoping**:
- **Operator**: declares the graph and Out-of-Service; owns the closure cascade.
- **Musician / Producer**: experience the hold/confirm race as "your hold was released because the adjacent room confirmed"; bookability requires the place be claimed (D-11 — a booking on an unclaimed record has nobody to honour it).
- **Fan**: only ever downstream when closure cancels a ticketed show (→ 19 refund path).

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The room graph is owned by 16.01.02; the calendar state is owned by 16.06.01. One graph, two readings — no merge conflict by construction.
2. **Trigger chain + rollback**: Hold evaluates the graph → confirm re-evaluates → first commit wins → loser rolled back with a named reason. Closure → cascade → live bookings cancelled with the inverted refund ladder.
3. **Permission intersection**: Live/bookable is gated on the place being claimed (D-11); room-level **grant** (16.01.02 D-09) confers booking authority on one room instantly and with no claim unit — **and, since DQ-13.1, a room-scoped claim (16.05.02 D-16) is the second origin** for the operator whose landlord will not cooperate, which runs L7 and is Provisional (no calendar, no rate card) until reviewed. So the "no partial-claim concept" framing is superseded: the room *is* a claim unit, it is simply not the fast path.
4. **Notification fan-out**: Hold-loss notifies the loser; closure notifies every reservation holder; Out-of-Service notifies only this room's holders.
5. **State-transition race**: The domain's central race — two exclusive siblings confirming simultaneously; resolved by evaluate-at-hold + re-evaluate-at-confirm, first commit wins.

---

### CX-08: Rehearsal ↔ Booking — *the hole*

**Relationship**: Lockout is a **tenancy**, not a booking (16.04 DT-02). It has no availability slot, no
deposit ladder, no buffers, and **no completion** — so CX-01's chain never fires. The domain's
highest-frequency supply (rehearsal is the frequency play D-18 needs) generates zero freshness data;
the freshest data comes from the least-used rooms. This is the domain's defining structural gap, not a
detail.

**Role scoping**: Operator (grants the tenancy), Musician (holds it); no harvest contributor because no completion event exists.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The tenancy is a durable lease on a room, held against an entity; no per-session reservation record to harvest from.
2. **Trigger chain**: There is no completion trigger — the chain is broken at the source. `[PENDING — /ideate-discover Step 5 deepening]`; escalated as index Q-10.
3. **Permission intersection**: Tenancy holder has standing access; no per-visit credential is minted.
4. **Notification fan-out**: None per session.
5. **State-transition race**: Lockout vs hourly booking on the same room — resolved by the tenancy owning the block outright.

---

### CX-10: Venue Spec ↔ Booking — *standing terms as baseline* (Medium)

**Relationship**: Published standing terms (16.02.05) mean an enquiry starts from a shared baseline
rather than a fishing expedition. Step 6 sharpened where bands get hurt: `available ≠ included`. A
`house-PA-hireable` provision and a `conditional-on-cost{rate-line-ref}` caveat are technical facts
wearing a commercial costume, so the caveat **carries the rate line** (16.06.07) rather than describing
it — "available" surfaced at enquiry, "included or £X" surfaced before settlement. The effective
music-off curfew (which may be commercial, not statutory) is what actually caps the bill and therefore
the deal — a settlement-timing fact 17 negotiates but 16 publishes. Medium confidence because 16.02.05
D-02 makes non-disclosure a first-class posture; for venues that publish nothing this connection does
not exist, and those may be the venues bands most want to compare.

---

### CX-11: Place Records ↔ Studio Spec — *mobile assets and the serial leak* (Medium)

**Relationship**: The mic locker is a **place asset allocated per booking, not a room field**
(16.01.02 DT-07) — a room's advertised spec is false the moment the U47 is carried into the other room,
and simultaneous bookings contend for it (this is the supply side of CX-05's pooled double-sale). Whether
that allocation is 16's or 15's is the same fork asked in three places and must be answered once
(index Q-05). Separately, a **boundary contradiction** surfaces here: 16.01.03's structured photo
checklist asks for a control-room photo — a photo of the desk and rack — and serials are **legible in
photos**, while 15.07.03 withholds serials unconditionally in text (16.03.02 → 16.01.03). Domain 16 must
not let this fall between the domains: the photo requirement needs a serial-obscuring rule or 15's text
policy is quietly defeated.

**Role scoping**: Producer (books the room expecting the named mic), Operator (allocates the pooled asset, uploads the photo); Musician secondary; Fan none.

**Synthesis questions answered** *(Medium — partial)*:
1. **Shared-state owner**: The asset register is 15's; the room binding and per-booking allocation are 16's (index Q-05 unresolved).
2. **Trigger chain**: Allocation at booking; the advertised room spec is a read-through, not a copy.
3. **Permission intersection**: The photo-upload permission (Operator) collides with 15's serial-withholding policy — unowned.
4/5. Deferred — Medium confidence pending Q-05.

---

## Cross-Cut Mechanisms Discovered (for the global CX file)

> Candidates that turned out to be **mechanisms serving many domains**. The *mechanism* is platform
> machinery; the *domain-specific specialisation* stays here. See the consolidated registry for the
> canonical mechanism list — this table records only what 16 uniquely specialises.

| Mechanism | Serves | What stays domain-owned |
|-----------|--------|------------------------|
| **Roles, Permissions & Delegated Authority** | 16, 01, 02, 15, 23 | Room-level **grant** on a single claim (16.01.02 D-09) *and* a **room-scoped claim unit** (16.05.02 D-16); one record referencing N operating orgs (D-06); revocation of a grant as an **adjudicated dispute**, never an act (16.01.02 D-16) |
| **Canonical Data, Taxonomy & Entity Resolution** (curation, dedup/merge) | 16, 01, 02, 12, 15 | The source-class ranking (statutory > owner > first-hand > community > seeded); negative merge rules (same-address ≠ same-place; relocation ≠ duplicate; two rooms ≠ two records); the `not-a-place` event-brand class; the **capability-gated decisive statutory key** — equality proves and inequality refutes *where the regime profile declares one*, no input where it does not (16.05.07 D-08) |
| **Availability, Scheduling & Reservations** | 16, 05, 06, 08, 17, 18 | The hold ranking + challenge protocol; the room graph evaluated at hold and confirm; the pooled-asset detector (missing) |
| **Reviews, Ratings & Portable Reputation** | 16, 05, 13, 17, 24 | 16.05.06 is explicitly **not** this — facts, not opinions (16.05.06 DT-01) |
| **Payments, Escrow & Payouts** | 16, 05, 06, 13, 17, 19 | Operator-fault refund inversion; escrow as the **precondition** for automatic ladder enforcement (16.06.03 DT-08); the perishable-inventory asymmetry |
| **Search & Discovery** (geo/map) | 16, 04, 05, 17, 19 | Nothing — wholly generic; 16 is simply its largest consumer, and the hold-pattern-scraping exclusion (16.06.01 D-20) |

## Not-Product Concerns Routed Out

| Concern | Route to | Why |
|---------|----------|-----|
| **ODbL / share-alike contamination analysis** | `/create-prd` (legal + architecture) | Share-alike may reach a derived database; OSM is the best venue geodata *and* the heaviest obligation (16.05.01 DT-03) |
| **Calendar sync protocol layer** (iCal / CalDAV / Google push, token lifecycle) | `/create-prd-architecture` | The guarantee, scoping rule, conflict policy and failure UX stay product; the protocol does not (16.06.02 DT-05) |
| **Virtual tour hosting** (embed vs self-host vs omit) | `/create-prd-architecture` | The structured photo checklist is product; 3D tour streaming is infrastructure (16.01.03 DT-03) |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 16.02 Venue Spec | 16.03 Studio Spec | Siblings that look symmetrical. Rejected: no shared state, no trigger, no data flow. A venue's PA and a studio's mic locker never interact — their only relationship is through 16.01 (both attach to rooms) and 16.07 (both are checkable). **The symmetry is presentational, not structural.** |
| R-02 | 16.04 Rehearsal | 16.02 Venue Spec | Considered: a rehearsal room in a venue's basement. Rejected — that is the type set (16.01.01 D-01) doing its job (CX-03), not a rehearsal↔venue relationship. The two specs never read each other. |
| R-03 | 16.07 Conformance Check | 16.05 Curation (as a *writer*) | Considered: should a failed check flag the spec? Rejected — the check **reads only**. A conflict means the room cannot meet a requirement, not that the field is false; conflating them would poison 16.05.04's signal. |
| R-04 | 16.01 Place Records | 16.07 Conformance Check | Accessibility (16.01.04) is checkable, but as a *direct* domain-level pair it routes through the spec layer like everything else 16.07 reads. Recorded so the indirection is deliberate — the 16.01.04 link lives at feature level. |
| R-05 | 16.04 Rehearsal | 16.05 Curation | **Inverted into a finding, not a pair**: rehearsal is the best test case for the harvest loop, but lockout produces no completion events (CX-08). Real for hourly rehearsal, absent for lockout — too conditional to record as a confirmed pair, too important to drop (index Q-10). |
| R-06 | 16.06 Booking | 16.07 Conformance Check | Considered: should a failed check block a booking? Rejected — 16.07 D-05: a conflict is information, never a verdict. The band decides whether 4 monitor mixes is workable; a platform blocking bookings on possibly-stale data overrides two consenting parties. |
| R-07 | 16.02.03 Curfew/Limiter | 16.01.05 At-Risk Signalling | **Boundary defended, no dependency created** (16.02.03): temporary access loss (roadworks, broken lift) is a field-level date-range exception, not an at-risk signal. At-risk means a room's existence is threatened and is Fan-facing to rally a constituency; reusing it for roadworks would cry wolf. Rejected as a pair to keep the semantics clean. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-20|D-20]]
