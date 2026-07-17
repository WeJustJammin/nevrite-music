# Education, Lessons & Mentorship — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Education, Lessons & Mentorship](./education-lessons-mentorship-index.md)
> **Status**: [BREADTH] — 11 children classified; 12 intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [06.02 Teacher Discovery, Profiles & Trials](./06.02-teacher-discovery-profiles-trials/) | [06.01 Lesson Booking, Packages & Delivery](./06.01-lesson-booking-packages-delivery/) | A converted trial **creates a recurring series** — the domain's core funnel | Musician (both stances), Operator, Fan | High | 06.02.04 DT-02 — the decision is made in the room, in the last two minutes; deferring it hands the conversion to an off-platform text |
| CX-02 | [06.01 Lesson Booking, Packages & Delivery](./06.01-lesson-booking-packages-delivery/) | [06.03 Curriculum, Assignments & Practice](./06.03-curriculum-assignments-practice/) | The **session record is the seam** — a delivered lesson becomes an assignment, in-room | Musician (both stances), Operator | High | 06.01.04 D-01 + 06.03.02's happy path; the platform's own capture-at-source thesis applied to teaching |
| CX-03 | [06.04 Course Marketplace & Authoring](./06.04-course-marketplace-authoring/) | [06.03 Curriculum, Assignments & Practice](./06.03-curriculum-assignments-practice/) | Courses hand learners the **practice room** (06.03.04) — a teacher-less product consuming a teacher-loop feature | Musician, Producer, Fan | High | 06.04.03 DT-01 + 06.03.04 DT-02 — the room works with no teacher, which is where that finding pays off |
| CX-04 | [06.02 Teacher Discovery, Profiles & Trials](./06.02-teacher-discovery-profiles-trials/) | [06.04 Course Marketplace & Authoring](./06.04-course-marketplace-authoring/) | The **credits wedge** serves both — modestly for teachers, at full strength for courses | Musician, Producer, Operator, Fan | High | 06.02.02 DT-02 (must not dominate ranking) vs 06.04.01 DT-02 (the buyer is buying the credit) — the same wedge, two settings |
| CX-05 | [06.10 Academy & Multi-Teacher Operations](./06.10-academy-multi-teacher-operations.md) | [06.01 Lesson Booking, Packages & Delivery](./06.01-lesson-booking-packages-delivery/) | The academy owns **term bounds, house rates, floor policy and credit liability** | Musician (both stances), Operator | High | 06.01.02 DT-03's resolution (academy-scoped packs) + 06.10 D-03 (student belongs to the academy, identity to the teacher) |
| CX-06 | [06.09 Exam Board Alignment](./06.09-exam-board-alignment.md) | [06.03 Curriculum, Assignments & Practice](./06.03-curriculum-assignments-practice/) | The syllabus is **the domain's only external, objective progress measure** | Musician (both stances), Operator | High | 06.09 DT-01 + 06.03.05 DT-02 — three features failed to measure musicianship; this is the one thing that can |
| CX-07 | [06.05 Group Lessons](./06.05-group-lessons-workshops-masterclasses.md) | [06.10 Academy & Multi-Teacher Operations](./06.10-academy-multi-teacher-operations.md) | Groups fill the Operator's **perishable off-peak inventory** | Operator, Musician, Producer | High | `meta/personas.md` (an unsold Tuesday is gone forever) + 06.05's Operator lens; groups need capacity and academies have rooms |
| CX-08 | [06.07 Learning Paths](./06.07-learning-paths.md) | [06.04 Course Marketplace & Authoring](./06.04-course-marketplace-authoring/) | A path is **curation over the catalogue** — structurally downstream of it | Musician, Producer, Fan | High | 06.07 DT-03 — with 4 courses there is no path, only a list. MoSCoW is near-mechanical |
| CX-09 | [06.08 Certificates](./06.08-certificates-badges-verification.md) | [06.02 Teacher Discovery, Profiles & Trials](./06.02-teacher-discovery-profiles-trials/) | Certificates must **never** render beside verified credits — debasement by association | Musician, Producer, Operator, Fan | High | 06.08 DT-02 — the reader cannot tell a completion badge from a counter-attested credit |
| CX-10 | [06.06 Mentorship Programmes](./06.06-mentorship-programmes.md) | [06.02 Teacher Discovery, Profiles & Trials](./06.02-teacher-discovery-profiles-trials/) | Mentor credibility is their **career**, evidenced by the same credit block | Musician, Producer | Medium | 06.06's cross-cut notes; the pairing model may reuse 06.02.03's criteria, though scarcity makes search the wrong metaphor |
| CX-11 | [06.05 Group Lessons](./06.05-group-lessons-workshops-masterclasses.md) | [06.04 Course Marketplace & Authoring](./06.04-course-marketplace-authoring/) | A **recorded masterclass is a course** — the bridge that doubles the format's economics | Musician, Producer | Medium | 06.05 Q-03; unresolved but structurally obvious |
| CX-12 | [06.09 Exam Board Alignment](./06.09-exam-board-alignment.md) | [06.02 Teacher Discovery, Profiles & Trials](./06.02-teacher-discovery-profiles-trials/) | "Prepares for ABRSM" is a high-intent filter — but does **not** solve the level-taxonomy problem | Musician (both stances) | Medium | 06.09 DT-02 (boards are not commensurable) + 06.02.03 DT-02 (level is not a scalar) |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)
>
> **Cross-references:** `education-lessons-mentorship-cx.md#CX-NN`

---

## Cross-Cut Details

### CX-01: Teacher Discovery ↔ Lesson Booking (the funnel)

**Relationship**: The domain's core commercial path: search → trial → **conversion to a recurring
series**. The conversion is the narrowest point and the highest-value moment, and 06.02.04 DT-02
places it **inside the lesson room** (06.01.04) rather than in a follow-up email — because the
decision to commit to a year of Tuesdays is made in the last two minutes of a good first lesson, while
the student is warm and the teacher is right there. Deferred to email, it is reconstructed cold, and
the teacher will do it off-platform by text, which is worse for everyone including them.

This is the platform's capture-at-source principle (`meta/problem-statement.md`) applied to a
commercial decision instead of a credit — the third distinct place in this domain it recurs (the
others: the session record, CX-02; the practice log, `06.03-...-cx.md#CX-01`).

**Role scoping**:
- **Musician (as Student)**: trials 2–3 teachers, converts one, keeps the standing slot
- **Musician (as Teacher)**: sees trial→series conversion — the number telling them whether their page attracts the right students
- **Operator**: house trial policy; conversion across staff is which-teachers-to-keep
- **Producer**: not affected
- **Fan**: the boundary itself — booking a trial is the act that makes someone a Student

**Synthesis questions answered**:
1. **Shared state conflict**: None — 06.02.04 owns the trial cap; 06.01.01 owns the series. A trial is an occurrence created under 06.01's model with a trial price and a one-per-pair cap.
2. **Trigger chain**: Trial delivered → conversion offered in-room → series created + pack purchased + trial fee credited. Sync, and it must be **one action**: a conversion requiring the student to leave the room and complete a purchase flow will lose most of them.
3. **Permission intersection**: A minor's pool is vetted-only pre-ranking (06.02.03 D-03), so every trial reachable from search is already gated, and conversion inherits the gate.
4. **Notification fan-out**: Conversion notifies the teacher; the series populates both calendars.
5. **State transition conflict**: The converted slot must be **held during the trial** — otherwise the student converts to a Tuesday 5pm someone else booked while they were in the lesson. Not currently specified; flagged for Step 5.

---

### CX-02: Lesson Booking ↔ Curriculum & Practice (the session record seam)

**Relationship**: The domain's most important internal seam. A delivered lesson (06.01.04) produces a
**session record** and an **assignment**, both captured **in the room** (06.01.04 D-01), which is what
gives 06.03's whole loop something to run on. Without in-room capture, the assignment is reconstructed
from memory later — which is `meta/personas.md`'s Producer failure mode ("closes a project without
capturing splits… the design must make the lazy path the correct path") reproduced exactly, with a
teacher instead of a producer.

**Role scoping**:
- **Musician (as Teacher)**: assigns while they can still hear the problem; the record is a byproduct of teaching, not admin afterwards
- **Musician (as Student)**: leaves the room knowing what to practise, with the assignment already in the practice room
- **Operator**: narrow QA read of assignments/feedback; **never** the practice diary (06.03 index note)
- **Producer / Fan**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: 06.01.04 owns the session record; 06.03.02 owns the assignment. The lesson creates both; neither is edited by the other afterwards.
2. **Trigger chain**: Lesson ends → record + assignment exist. **Deliberately decoupled from payment**: 06.01.04 D-04 forbids an unwritten record from blocking credit consumption — withholding a teacher's pay over paperwork is hostile and pushes lessons off-platform.
3. **Permission intersection**: Teacher visibility follows the teaching relationship and ends with it — an unresolved consequence (06.03.01 Q-02 asks the same of the student's path).
4. **Notification fan-out**: Student receives record + assignment + recording.
5. **State transition conflict**: A lesson cancelled after an assignment was set (rescheduled series) — the assignment should stand; the student can still practise. Flagged for Step 5.

---

### CX-03: Course Marketplace ↔ Curriculum & Practice (the practice room crossing)

**Relationship**: Structurally the most interesting seam in the domain, because it crosses from a
**teacher-less product** into a **teacher-loop feature**. 06.03.04 (Practice Room Tools) was added by
Deep Think and justified entirely by the teacher-led loop — but 06.03.04 DT-02 found the room needs no
teacher, and this is where that pays: a course lesson saying "bars 12–20 at 80bpm" hands the learner a
room with the tempo set, the reference loopable at 70%, and a record button.

Per 06.04.03 DT-01 this is one of only two answers the domain has to "why not YouTube" — and the two
**compose**: verified credits make a stranger buy the course (CX-04); the practice room makes them able
to use it.

**Role scoping**:
- **Musician / Fan (as learner)**: practises inside the course, not in three other apps
- **Musician / Producer (as author)**: specifies practice rather than describing it
- **Operator**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: None — the course supplies configuration; the room consumes it. Whether course practice **writes to the practice log** (06.04.03 Q-01) is unresolved and would add a writer to a minor's behavioural record.
2. **Trigger chain**: Course lesson → practice task → pre-configured room. Sync, in-surface. The room must degrade (06.03.04 D-02) — a learner with their own metronome must not be blocked.
3. **Permission intersection**: None — a solo practice room has no safeguarding gate. If Q-01 resolves to "yes, it logs", the Privacy cross-cut engages for minors.
4. **Notification fan-out**: None — there is no teacher, which is the point.
5. **State transition conflict**: None.

---

### CX-04: Teacher Discovery ↔ Course Marketplace (the wedge, at two settings)

**Relationship**: The domain's unfair advantage — verified credits from domain 02 — serves both, and
**must be used at different strengths**. This is the single most nuanced finding in this drilling pass.

| | 06.02 (teachers) | 06.04 (courses) |
|---|---|---|
| What's being bought | patience with a 9-year-old, schedule fit, safety | "show me how you got that snare sound" |
| Is a credit the relevant qualification? | **No** — playing ability ≠ teaching ability | **Yes** — directly |
| Therefore | display prominently, **weight modestly** (06.02.02 DT-02) | **the conversion driver** (06.04.01 DT-02) |

Getting this backwards in either direction is costly: rank teachers on credits and the domain
systematically demotes the patient professional teachers who are its best supply; under-use credits on
courses and the domain discards its only real answer to YouTube.

**Role scoping**:
- **Musician (as Teacher)**: not punished in ranking for lacking a discography (06.02.02 D-03)
- **Musician / Producer (as course author)**: their credits sell the course, and they wrote nothing to make it happen
- **Musician / Fan (as buyer)**: buys on checkable evidence rather than a claim
- **Operator**: vouches for staff — an attestation with the academy's reputation staked on it

**Synthesis questions answered**:
1. **Shared state conflict**: None — both are read-only projections of domain 02 (06.02.02 D-04). Single source; the credit graph is the platform's most valuable asset and must have exactly one owner.
2. **Trigger chain**: Credit confirmed in domain 02 → surfaces in both. Async; staleness harmless in both. **Exception**: safeguarding vetting (which renders in the same block) must **not** be eventually-consistent — an expired check must gate immediately, which is why vetting gates rather than ranks.
3. **Permission intersection**: Vetting gates 06.02 (a minors-facing 1:1 surface) and does **not** gate 06.04 (an adult buying a video). This asymmetry is exactly why 06.04.02 DT-02 argues courses are independently shippable.
4. **Notification fan-out**: A new credit surfacing on a teaching page or a course is the wedge visibly paying the user, unprompted — worth telling them about.
5. **State transition conflict**: A disputed credit must render as disputed in both; never silently re-rank or re-price under a live reader.

---

### CX-05: Academy ↔ Lesson Booking

**Relationship**: The academy layer **bounds** 06.01 in four places: term calendar (bounds published
availability), house rate card (bounds pricing), floor cancellation policy (bounds what teachers can
undercut), and **academy-scoped credit packs** — which is how 06.01.02 DT-03's portable-credit problem
resolves without making the platform a bank. The seam that carries the ethics: **the student belongs to
the academy; the identity belongs to the teacher** (06.10 D-03).

**Role scoping**:
- **Operator**: sees credit liability across the school — the number that matters when a teacher leaves mid-pack, and when a school closes (06.10 Q-03)
- **Musician (as Teacher at an academy)**: works under house rates; their identity, credits and reputation remain theirs and survive leaving
- **Musician (as Student)**: enrolled with the academy; continuity survives their teacher leaving
- **Producer / Fan**: not affected

**Synthesis questions answered**:
1. **Shared state conflict**: The academy owns the pack and the liability; the teacher owns the identity and the pedagogy. Clean split, and it is the feature's whole design (06.10 DT-02 — the platform refuses the academy the teacher lock-in it wants most).
2. **Trigger chain**: Academy sets term bounds → teachers' publishable availability narrows. Applied at booking time, so tightening a floor policy does **not** retroactively bind existing series (`06.01-...-cx.md#CX-04`).
3. **Permission intersection**: Consumed from the `Roles, Permissions & Delegated Authority` cross-cut; the membership graph is domain 01's. A teacher's **private** students are strictly invisible to the academy — the multi-hyphenate again.
4. **Notification fan-out**: Escalated disputes route to the Operator (06.01.03's Operator lens).
5. **State transition conflict**: An academy closing with credits outstanding — 06.10 Q-03, and the scenario that makes 06.01.02 Q-01 (money vs entitlement) urgent rather than theoretical.

---

### CX-06: Exam Board Alignment ↔ Curriculum & Practice

**Relationship**: The domain's **only external, objective progress measure**, and far more load-bearing
than the candidate list implied. Three separate features concluded the platform cannot measure
musicianship: practice hours measure effort (06.03.05 DT-02), submissions measure confidence (same),
completion measures watching (06.04.03 DT-02). An exam grade is external, examined by a human, and
understood by the parent paying the bill — which is why exam boards have survived a century and why a
platform cannot displace them.

So 06.09 is not "exam-board support"; it is the domain's only working answer to "is my child getting
better?" — the question 06.03.05 exists to answer and 06.08 fails to.

**Role scoping**:
- **Musician (as Teacher)**: maps units to syllabus requirements; sees readiness by component (candidates fail on the component they avoided)
- **Musician (as Student)**: the one measure that isn't the platform's opinion of them
- **Operator**: exam prep is often the academy's core product and its real admin burden
- **Producer / Fan**: not affected — grades are irrelevant to production

**Synthesis questions answered**:
1. **Shared state conflict**: The syllabus is external, read-only, and **versioned** (06.09 D-04) — a student mid-grade stays on the syllabus they started, because boards revise on a cycle.
2. **Trigger chain**: Exam goal set → syllabus loads → requirements map to units → gaps visible → entry deadline enters the term plan. The deadline is a **hard external date**, and warning on it is the feature's single most useful function.
3. **Permission intersection**: None.
4. **Notification fan-out**: Entry deadlines — well ahead, because a missed deadline costs a term of work.
5. **State transition conflict**: A board revising a syllabus mid-teaching. Resolved by versioning (06.09 D-04).

---

### CX-07: Group Lessons ↔ Academy (perishable inventory)

**Relationship**: The domain's strongest Operator fit. `meta/personas.md` defines the Operator's
inventory as **time and space** — "perishable (an unsold Tuesday is gone forever) and physically
constrained (capacity…)". A group class is a product **shaped exactly like that inventory**: it needs
capacity, runs at a fixed time, and monetises an off-peak Saturday afternoon otherwise worth nothing.
A 1:1 lesson fills one room with one student; a band workshop fills it with eight.

**Role scoping**:
- **Operator**: fills perishable off-peak capacity; may lead the group themselves
- **Musician (as leader)**: teaches to a room; earns per head rather than per hour
- **Musician (as participant)**: the other students are part of the product
- **Producer**: the masterclass format
- **Fan**: not affected — though 06.05 DT-03 questions whether a ticketed masterclass is a Fanbase product

**Synthesis questions answered**:
1. **Shared state conflict**: Rooms are the Operator's; the roster is the group's. Note 06.10 Q-02 — room management may already live in domain 16, and asserting otherwise would be guessing at another domain's boundary.
2. **Trigger chain**: Group created → capacity reserved → **viability threshold** evaluated → runs or refunds. The threshold is a semantic 06.01's credit ledger has no equivalent for, and it is why 06.05 is a sibling of 06.01 rather than a child.
3. **Permission intersection**: Group safeguarding is **different in kind** from 1:1 (06.05 D-04) — an adult with a group of minors is a different risk profile, not a lesser one. The intuition that "a group is safer" is how controls get quietly dropped.
4. **Notification fan-out**: Viability warnings to the roster ("3 of 5 — needs 2 more by Thursday").
5. **State transition conflict**: A member dropping mid-term takes the group below viability. Unresolved (06.05 Q-02).

---

### CX-08: Learning Paths ↔ Course Marketplace

**Relationship**: `[PARTIAL]` — a path is curation **over the catalogue**, so it is structurally
downstream: with 4 courses there is no path, only a list (06.07 DT-03). This makes the MoSCoW ordering
near-mechanical, and it is the same cold-start failure 06.04.02 DT-03 identified for catalog
subscriptions, arriving from a different direction. It also carries an unbudgeted permanent cost —
paths **rot** as referenced courses are withdrawn or updated (06.04.01 Q-03).

**Role scoping**: `[PENDING — /ideate-discover Step 5]`, pending 06.07 Q-01 (platform- vs author-curated).

**Synthesis questions**: Deferred — the ordering consequence is what matters at breadth.

---

### CX-09: Certificates ↔ Teacher Discovery (the debasement risk)

**Relationship**: A **negative** cross-cut — recorded because the interaction must be prevented, not
built. A platform-issued completion badge rendering beside counter-attested verified credits invites
the reader to treat them as the same kind of thing. They are not: a credit asserts only what people who
were in the room confirmed; a certificate asserts that someone watched some videos (06.08 DT-02).

The reader cannot tell them apart, which means co-rendering **debases the credit graph by association**
— the platform's most valuable asset, damaged by its weakest feature. This is the same debasement
06.01.04 DT-02 rejected from the opposite direction: there, refusing to mint credits for lessons; here,
refusing to let a badge look like one.

**Role scoping**:
- **Musician (as Teacher)**: a WeJammin certificate must **not** feed the credential block — circular and self-serving
- **Musician / Fan (as reader)**: must never be shown two artifacts of incomparable trust as peers
- **Operator**: academy certificates for children are the one legitimate case — Operator-scoped and low-stakes
- **Producer**: their course's name is on an assertion the platform generated; most would rather it weren't

**Synthesis questions answered**:
1. **Shared state conflict**: None — the point is that they must not share a surface.
2. **Trigger chain**: Completion → issuance is **rejected as automatic** (`06.04-...-cx.md#R-04`).
3. **Permission intersection**: A certificate must never gate or credential anything (06.08 D-03).
4. **Notification fan-out**: None. An "earn your first certificate" prompt would manufacture a motivation the domain does not have (06.08's Empty state; index D-04).
5. **State transition conflict**: None.

---

### CX-10: Mentorship ↔ Teacher Discovery

**Relationship**: `[PARTIAL]` — a mentor's credibility is their **career**, evidenced by the same credit
block (06.02.02) that credentials a teacher. Unlike teaching, the correlation holds: mentorship
transmits career knowledge, and having had the career **is** the qualification — so the wedge works at
full strength here, as it does for courses (CX-04), and unlike for tuition.

Pairing may reuse 06.02.03's criteria model, but supply scarcity (06.06 D-03 — capacity 1–3) makes
search the wrong metaphor; application is closer.

**Role scoping**: `[PENDING — /ideate-discover Step 5]`, pending 06.06 Q-01.

**Synthesis questions**: Deferred — Medium confidence, per the CX template's rule.

---

### CX-11: Group Lessons ↔ Course Marketplace

**Relationship**: `[PARTIAL]` — a recorded masterclass is a course (06.05 Q-03). Structurally obvious,
and it doubles the format's economics: the Producer is paid by 30 attendees live and by strangers
forever after. Unresolved only because it depends on 06.04's authoring shape (06.04.01 Q-01 — if the
authoring tool is "record from the room", this is near-free).

**Role scoping**: `[PENDING]`.

**Synthesis questions**: Deferred — Medium confidence.

---

### CX-12: Exam Board Alignment ↔ Teacher Discovery

**Relationship**: `[PARTIAL]` — "prepares for ABRSM Grade 5" is a high-intent search filter and one of
the few things a parent searches for precisely. **But it does not solve the general level-taxonomy
problem**: 06.02.03 DT-02 found "level is not a scalar", and 06.09 DT-02 found the boards are not
commensurable — so exam boards give a rigorous handle only *within* a tradition, and only for the
traditions that have one. A US rock guitar student remains unfilterable by level, and no amount of
exam-board data fixes that.

**Role scoping**: `[PENDING]`.

**Synthesis questions**: Deferred — Medium confidence.

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 06.06 Mentorship Programmes | 06.01 Lesson Booking, Packages & Delivery | Considered folding mentorship into lesson booking — one person, one person, recurring meetings, a relationship. Rejected: **06.01's entire content is inapplicable**. No credit ledger (mentorship is often unpaid), no cancellation policy (you don't burn a credit for missing coffee with your mentor), no curriculum, no practice, no assignments. What remains shared is "two people meet on a cadence" — the Scheduling cross-cut, not 06.01. It transmits career knowledge rather than technique, so 06.03's loop doesn't apply either. See 06.06 DT-01. |
| R-02 | 06.05 Group Lessons | 06.01 Lesson Booking, Packages & Delivery | Considered as a child of 06.01 — "a lesson with more people". Rejected on **three independent grounds**: per-head pricing with a **viability threshold** (a concept the credit ledger cannot express — a 1:1 lesson has no minimum size and never cancels for under-subscription); the other students **are the product** (a band workshop of four guitarists fails regardless of the teacher); and group safeguarding is **different in kind** from 1:1. Any one would be a stretch; three make it a sibling. See 06.05 DT-01. |
| R-03 | 06.11 Music Therapy Practice | 06.01 Lesson Booking, Packages & Delivery | Considered as a delivery context for 1:1 recurring sessions. Rejected: **therapy is not teaching**. The goal is a clinical outcome (speech recovery, agitation reduction); music is the instrument, not the subject, and the client may never play a note. Sharing "1:1, recurring, relational" is a coincidence of shape — and shape has been an unreliable guide throughout this domain (see R-05). See 06.11 DT-01. |
| R-04 | 06.08 Certificates | [02 Credits & Attribution](../02-credits-attribution/) | Considered letting WeJammin certificates feed the credential block, unifying "things that vouch for you". Rejected — it inverts the credit graph's entire value. A credit asserts what participants confirmed; a certificate asserts what our own database logged. Merging them means the platform vouching for itself inside the one system whose worth is that it doesn't. See CX-09 and 06.08 DT-02. |
| R-05 | 06.07 Learning Paths | 06.03.01 Curriculum & Lesson Plans | Considered merging — structurally identical ordered sequences of units with prerequisites. Rejected on the axis this domain kept rediscovering: *authored for one known person, adapted continuously, meaningless without its author* (curriculum, mentorship) vs *authored once for strangers, identical for everyone, consumed without its author* (path, course). **The same distinction arose three times** (curriculum↔course, path↔curriculum, and here), making it a domain-level law rather than three coincidences: near-identical structures, opposite semantics. See 06.07 DT-01. |
| R-06 | 06.03 Curriculum, Assignments & Practice | 06.04 Course Marketplace & Authoring *(as a shared content model)* | Considered a single "instructional unit" primitive shared across curricula and courses, to avoid building two content trees. **Not rejected — deferred as an architecture question.** They may well share a primitive; what they must not share is semantics (R-05). Recorded here so `/create-prd-architecture` sees the option rather than discovering the duplication later. |
| R-07 | 06.09 Exam Board Alignment | 06.08 Certificates | Considered issuing platform certificates for exam-board grades. Rejected: **the platform records third-party credentials; it does not issue them** (06.08 D-05). An ABRSM grade is ABRSM's assertion, backed by an examiner and a syllabus. Re-issuing it under our name adds nothing and misattributes the authority. |
| R-08 | 06.10 Academy | 06.02.01 Teacher & Tuition Profile *(as academy-owned identity)* | Considered letting an academy own its teachers' profiles — the thing academies most want (06.10 DT-02). Rejected: it would re-create, inside our own product, the exact failure `meta/personas.md` says the platform exists to end ("nothing accumulates, and every new client requires re-proving who they are"). The academy gets the student relationship, the liability, the room and the brand. It does not get the person. |

---

## Cross-Cut Mechanisms Consumed (not owned)

> Per the Node Classification Gate: these are mechanisms serving many domains. **No node was created
> for any of them.** Returned in `crossCuts` for the global CX synthesis to absorb.

| Mechanism | How Education consumes it | Notable |
|---|---|---|
| **Safeguarding & Minor Protection** | Vetting, guardian consent, age assurance, chaperone/recording norms | **The domain is its heaviest consumer** — teaching is overwhelmingly a minors market. Four enforcement points, one owner (index D-05) |
| **Availability, Scheduling & Reservation** | Slots, holds, conflict detection | Education layers **series, slot ownership and term bounds** on top — tuition semantics the mechanism doesn't own (06.01 D-02) |
| **Real-Time Rooms, Presence & Audio Transport** | The live lesson room; masterclass broadcast | Carries the map's **hard stack warning** — will not run on Workers + Supabase realtime. 06.03.02 DT-01 argues the async half may matter more anyway |
| **Payments, Escrow & Payouts** | Pack purchase, teacher payout, course sales | Education uses the **payout** half and explicitly **not** escrow — no deliverable to release against (06.01.02 DT-01) |
| **Subscriptions & Entitlements** | Lesson subscriptions; course entitlements | **Two ledgers that must not merge** (06.04.02 DT-01) — D-14's argument recurring inside one domain |
| **Search & Discovery** | Teacher search; course catalog | Education owns the **criteria and weights**, not the machinery (06.02.03 DT-01). Two different ranking functions (`06.04-...-cx.md#R-05`) |
| **Geo, Location & Map Discovery** | In-person teacher radius | **Recurrence-weighted distance is unlike every other consumer** (06.02.03 DT-02) — 40 minutes is fine once, unthinkable weekly |
| **Media Handling & Audio Playback** | Submissions, recordings, course video, slow-downer | Heavy transcode/DSP is a routed **hard stack constraint**; the slow-downer specifically (06.03.04 DT-03) |
| **Privacy, Consent & Data Portability** | Minors' recordings, practice diaries, reports | A child's daily behavioural record is among the most sensitive data on the platform |
| **Roles, Permissions & Delegated Authority** | Guardian authority; academy roles | **How the guardian gap resolves without a new persona** (index D-03) |
| **Offline & Low-Connectivity Field Resilience** | Practice logging, practice room | Practice happens in bedrooms and garages; a lost entry breaks a streak, which is a quit trigger (06.03.03 D-04) |
| **Notifications & Alerts** | Reminders, deadlines, feedback | One design mistake from nagging a child (index D-04) |
| **Reviews, Ratings & Portable Reputation** | Teacher reviews; reliability signals | Reputation is portable across a person's facets, not per-facet |
| **Tax & Fiscal Compliance** | Tuition and course VAT | **Education is VAT-exempt in some regimes** — the generic marketplace engine will get this silently wrong (06.04.02 D-04) |
| **Public SEO Surfaces & Embeds** | Teacher pages | "Guitar teacher near me" — the page's main reader is a logged-out stranger (06.02.01 DT-02) |
| **Audit Log & Provenance Ledger** | Credit burns, attendance, verification | Ledger events must be **evidential** in a dispute, not merely balance deltas |
| **Canonical Data, Taxonomy & Entity Resolution** | Syllabi, qualifications, repertoire/editions | Per-board, never normalized (06.09 D-01) |
| **Localization, Currency & Timezone** | Cross-border remote tuition | Two timezones and a DST boundary — the domain's most common support complaint |
| **Accessibility** | Visual metronome/tuner; course captions | Deaf and hard-of-hearing musicians exist and practise |
| **Analytics Instrumentation & Per-Domain Reporting** | Conversion, drop-off, cohort outcomes | Diagnostic, never a target (06.04.03 D-04; 06.03.03 D-06) |
| **Onboarding & Role-Aware Activation** | Enabling the teaching facet | A role activation, not a second account (06.02.01 D-01) |
| **Bulk Import, Sync & Migration Tooling** | Importing an existing course catalogue | The highest-value acquisition target 06.04 has |
| **Promoted Placement & Advertising** | Teacher/course placement | **Values-laden in a minors-facing market** (06.02 Q-02) — unresolved |
| **Admin, Back-Office & Support** | Escalated disputes | Academy and platform tiers |
| **Referrals, Invites & Affiliates** | Teacher→student invites; academy roster onboarding | 06.10's cold-start motion |
| **Follow, Save & Watchlist** | Saving teachers/courses | Standard consumption |
| **Integrations, Public API & Webhooks** | Exam board entry | Expect these institutions have no usable APIs (06.09 Q-02) |
