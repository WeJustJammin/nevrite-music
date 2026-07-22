# Blocking Decision Queue — Ratification Log

> Owner decisions on the 57 open sub-decisions from `blocking-decision-queue.md`.
> Each entry records the choice, why, and what it commits downstream.

**Ratified: 4 / 57**

## DQ-03.A3 — A3 — What a timely objection does to the pending lift

> **Entry**: DQ-03 · **Date**: 2026-07-22

**Chosen**: E2 — Pause at the status quo pending resolution

**Why**: Both E1 and E2 rewrite ratified text; the tie-break is which casualties matter. E1 would rewrite D-11's rationale, the payment-dispute edge row and DT-10 — the reasoning the feature was built on. E2 rewrites line 59 and two UI copy strings, which is a copy change. E2 also preserves Q-04's compensating control against forged store URLs, which E3 destroys.

**Preserved**: D-11 rationale (Producer off the critical path); payment-dispute edge row three-defence list; DT-10 anti-persona case; Q-04 forgery compensating control

**Commits us to**:
- New state row required in the Axis A x Axis B table: "Lift pending — objection contested" (embargoed while contested).
- Line 59 and the two user-facing strings ("Credits publish in 72 hours unless {Producer} objects") must be rewritten — the objection is a challenge, not a veto.
- Two new notification fan-outs: objection raised, objection resolved.
- A resolution SLA is now mandatory — an embargoed status quo plus an unbounded resolver is a de facto veto. Axis A4 becomes live.
- D-11's "the window costs three days of nothing" cost claim no longer holds for contested lifts.

**Precedent**: credits-attribution CX-16 and 02.05 D-02 — a unilateral filing produces no state change while pending; outcome changes only after adjudication. Holds toward the status quo ante, which here is embargoed.

## DQ-03.A4 — A4 — Who resolves a contested objection

> **Entry**: DQ-03 · **Date**: 2026-07-22

**Chosen**: R2 — Route to the dispute engine (02.05), with platform re-verification as the free first rung

**Why**: Only resolver that names an accountable decider without inventing one. Every part already exists: the engine (02.05 D-01 + the domain cross-cut listing it for 02/05/09/13/14/17/19/24), the privileged non-publishing read over embargoed records (02.01.05 D-18), and the routing habit (02.02.01 D-10 and its edge row: an unresolved objection "becomes a dispute"). R1 alone cannot resolve what the first automated pass already failed to resolve; R3 decides by silence, which D-03/DT-03 reject.

**Commits us to**:
- Contested lifts inherit 02.05 ladder latency — no longer a three-day matter.
- Per-objection operational load lands on domain 24, unbudgeted in current specs — must be recorded as a load source.
- Platform re-check runs inline first and only has content if the objection supplies new information (couples to axis A2).
- If axis A2 permits authorisation grounds, the adjudicator is handed a question no source defines a test for — A2 must not create that gap.

**Precedent**: 02.02.01 D-10 + edge row (objection classified by kind; unresolved becomes a 02.05 dispute). Does NOT speak to embargoed-vs-published while pending — that is CX-16 / 02.05 D-02, which is why A3=E2 holds at embargo.

## DQ-03.A2 — A2 — Must an objection state a ground; open or closed ground space

> **Entry**: DQ-03 · **Date**: 2026-07-22

**Chosen**: G3a — Closed ground list restricted to grounds about D-03's existing predicate: (i) evidence identifies a different recording; (ii) URL/identifier not publicly reachable; (iii) other (free text, routes to a human, never auto-handled)

**Why**: Cheapest structure that makes A3/A4 decidable. Both enumerated grounds challenge a check D-11 already assigns the platform against D-03's ratified predicate, so no new kind of adjudication is taken on. G3b was explicitly declined at this axis: it commissions an authorised-vs-unauthorised predicate no file defines, which D-03's "demonstrably public" does not license, and would make domain 12 the authority for "authorised release".

**Commits us to**:
- New objection form with a closed ground selector plus two new copy strings.
- "Other" is treated as G2-style free text — logged, shown, routed to a human, never auto-resolved.
- The leak/bootleg case (publicly reachable but unauthorised) remains UNHANDLED by design — record as a known open gap, not an oversight.
- Platform re-check (A4 first rung) is now meaningful: grounds (i) and (ii) supply new information the first pass did not have.

**Precedent**: 02.01.05 D-10: a decline in the adjacent early-lift flow is "logged and shown to the requester" with its reason — the file already treats a Producer refusal as an accountable, reasoned act. Supports requiring a reason; the enumeration is the increment G3a adds.

## DQ-03.A5 — A5 — Whether re-submission of evidence after an objection is bounded

> **Entry**: DQ-03 · **Date**: 2026-07-22

**Chosen**: S1 — Unbounded re-submission (condition satisfied: A3=E2 and A4=R2)

**Why**: The recommendation was explicitly conditional on A3=E2 + A4=R2, and both hold. With every contested objection already routed to an adjudicator, the resolver bounds the loop, so no counting rule needs to be invented. S1's indefinite-veto con applied only to the veto option (E1), which was declined. S2 commissions an unsourced threshold N and a new domain-24 abuse pattern; S3 composes a "first one free" rule no source states and is redundant once every contested objection is on the engine.

**Commits us to**:
- No cap, cooldown or escalation rule enters the spec — nothing new to invent.
- A repeat objector must keep winning on the merits at the dispute engine rather than blocking for free.
- Matches the existing Lift-stalled path shape (repeated 90-day nudges, then the evidence-based lift is offered).
- If A3 is ever revisited to E1, this axis MUST be revisited to S3 — E1+S1 is the one combination leaving a permanent costless weapon.

