# Blocking Decision Queue — Ratification Log

> Owner decisions on the 57 open sub-decisions from `blocking-decision-queue.md`.
> Each records the choice, the reasoning, what it preserves, and what it commits downstream.

**Ratified: 10 / 57**

## Progress by entry

| Entry | Domain | Axes ratified |
|---|---|---|
| DQ-03 | 02 Credits & Attribution | 4 — DQ-03.A3, DQ-03.A4, DQ-03.A2, DQ-03.A5 |
| DQ-04 | 02 Credits & Attribution | 2 — DQ-04.1, DQ-04.2 |
| DQ-05 | 02 Credits & Attribution | 2 — DQ-05.1, DQ-05.2 |
| DQ-06 | 02 Credits & Attribution | 2 — DQ-06.1, DQ-06.2 |

---

## DQ-03.A3 — A3 — What a timely objection does to the pending lift

> **Entry**: DQ-03 · **Ratified**: 2026-07-22

**Chosen**: E2 — Pause at the status quo pending resolution

**Why**: Both E1 and E2 rewrite ratified text; the tie-break is which casualties matter. E1 would rewrite D-11's rationale, the payment-dispute edge row and DT-10 — the reasoning the feature was built on. E2 rewrites line 59 and two UI copy strings, which is a copy change. E2 also preserves Q-04's compensating control against forged store URLs, which E3 destroys.

**Preserves**: D-11 rationale (Producer off the critical path); payment-dispute edge row three-defence list; DT-10 anti-persona case; Q-04 forgery compensating control

**Commits us to**:
- New state row required in the Axis A x Axis B table: "Lift pending — objection contested" (embargoed while contested).
- Line 59 and the two user-facing strings ("Credits publish in 72 hours unless {Producer} objects") must be rewritten — the objection is a challenge, not a veto.
- Two new notification fan-outs: objection raised, objection resolved.
- A resolution SLA is now mandatory — an embargoed status quo plus an unbounded resolver is a de facto veto. Axis A4 becomes live.
- D-11's "the window costs three days of nothing" cost claim no longer holds for contested lifts.

**Precedent**: credits-attribution CX-16 and 02.05 D-02 — a unilateral filing produces no state change while pending; outcome changes only after adjudication. Holds toward the status quo ante, which here is embargoed.


## DQ-03.A4 — A4 — Who resolves a contested objection

> **Entry**: DQ-03 · **Ratified**: 2026-07-22

**Chosen**: R2 — Route to the dispute engine (02.05), with platform re-verification as the free first rung

**Why**: Only resolver that names an accountable decider without inventing one. Every part already exists: the engine (02.05 D-01 + the domain cross-cut listing it for 02/05/09/13/14/17/19/24), the privileged non-publishing read over embargoed records (02.01.05 D-18), and the routing habit (02.02.01 D-10 and its edge row: an unresolved objection "becomes a dispute"). R1 alone cannot resolve what the first automated pass already failed to resolve; R3 decides by silence, which D-03/DT-03 reject.

**Commits us to**:
- Contested lifts inherit 02.05 ladder latency — no longer a three-day matter.
- Per-objection operational load lands on domain 24, unbudgeted in current specs — must be recorded as a load source.
- Platform re-check runs inline first and only has content if the objection supplies new information (couples to axis A2).
- If axis A2 permits authorisation grounds, the adjudicator is handed a question no source defines a test for — A2 must not create that gap.

**Precedent**: 02.02.01 D-10 + edge row (objection classified by kind; unresolved becomes a 02.05 dispute). Does NOT speak to embargoed-vs-published while pending — that is CX-16 / 02.05 D-02, which is why A3=E2 holds at embargo.


## DQ-03.A2 — A2 — Must an objection state a ground; open or closed ground space

> **Entry**: DQ-03 · **Ratified**: 2026-07-22

**Chosen**: G3a — Closed ground list restricted to grounds about D-03's existing predicate: (i) evidence identifies a different recording; (ii) URL/identifier not publicly reachable; (iii) other (free text, routes to a human, never auto-handled)

**Why**: Cheapest structure that makes A3/A4 decidable. Both enumerated grounds challenge a check D-11 already assigns the platform against D-03's ratified predicate, so no new kind of adjudication is taken on. G3b was explicitly declined at this axis: it commissions an authorised-vs-unauthorised predicate no file defines, which D-03's "demonstrably public" does not license, and would make domain 12 the authority for "authorised release".

**Commits us to**:
- New objection form with a closed ground selector plus two new copy strings.
- "Other" is treated as G2-style free text — logged, shown, routed to a human, never auto-resolved.
- The leak/bootleg case (publicly reachable but unauthorised) remains UNHANDLED by design — record as a known open gap, not an oversight.
- Platform re-check (A4 first rung) is now meaningful: grounds (i) and (ii) supply new information the first pass did not have.

**Precedent**: 02.01.05 D-10: a decline in the adjacent early-lift flow is "logged and shown to the requester" with its reason — the file already treats a Producer refusal as an accountable, reasoned act. Supports requiring a reason; the enumeration is the increment G3a adds.


## DQ-03.A5 — A5 — Whether re-submission of evidence after an objection is bounded

> **Entry**: DQ-03 · **Ratified**: 2026-07-22

**Chosen**: S1 — Unbounded re-submission (condition satisfied: A3=E2 and A4=R2)

**Why**: The recommendation was explicitly conditional on A3=E2 + A4=R2, and both hold. With every contested objection already routed to an adjudicator, the resolver bounds the loop, so no counting rule needs to be invented. S1's indefinite-veto con applied only to the veto option (E1), which was declined. S2 commissions an unsourced threshold N and a new domain-24 abuse pattern; S3 composes a "first one free" rule no source states and is redundant once every contested objection is on the engine.

**Commits us to**:
- No cap, cooldown or escalation rule enters the spec — nothing new to invent.
- A repeat objector must keep winning on the merits at the dispute engine rather than blocking for free.
- Matches the existing Lift-stalled path shape (repeated 90-day nudges, then the evidence-based lift is offered).
- If A3 is ever revisited to E1, this axis MUST be revisited to S3 — E1+S1 is the one combination leaving a permanent costless weapon.


## DQ-04.1 — Attachment during pendency of a claim contest

> **Entry**: DQ-04 · **Ratified**: 2026-07-22

**Chosen**: P1 — Stay attached to the first claimant until the contest closes; detach only on Unresolvable

**Why**: Both options reverse ratified text; the choice is which exposure to accept. Under P2 a free, unilateral, evidence-free filing strips a line from a professional's public sales page with no abuse control defined anywhere in the specs. Under P1 a possibly-wrong line stays up for one corroboration round-trip — explicitly priced by 02.01.02 D-06 as "the status quo ante", and short by construction. The terminal lock (D-02, Unresolvable leaves the credit unattached) means P1 can no longer permanently award a credit to whoever clicked first, which was the only serious objection to it.

**Preserves**: 02.01.01 D-11 (contest marks, never suppresses); 02.01.02 D-06 (a contest is not published); 02.01.02 reconciliation (public line unchanged and never hidden); 02.03.03 D-02 (Unresolvable leaves it unattached)

**Commits us to**:
- REVERSES 02.03.03 Happy Path step 2 ("System holds the credit — neither claimant gets it while contested") — must be rewritten for the pendency window.
- REVERSES 02.03.02's Contested state row ("Held; adjudication") for pendency.
- The contested marker is a record-view affordance only; no public marker (already locked by D-06).
- Known asymmetry to document: the true owner sees a stranger carrying their credit and has no unilateral control, because 02.01.05 Private is available to a party NAMED on the record, not to a party who claims it should have named them.
- No corroboration SLA exists — "Corroborator is gone" and "Corroborator is themselves a claimant" both fall to Unresolvable. Pendency length is therefore unbounded in the worst case; flag as a follow-on gap.

**Precedent**: 02.03.03 DT-02 (claim adjudication and credit dispute "share the contested state and the suppression behavior") read with 02.05 D-02, whose suppression language was corrected to "marked for participants, not suppressed and not publicly annotated". The shared behaviour was corrected on one side only; P1 finishes the correction.


## DQ-04.2 — Party-side public render of an unattached credit

> **Entry**: DQ-04 · **Ratified**: 2026-07-22

**Chosen**: S1 — Shell fallback: the credit returns to the unclaimed shell it came from

**Why**: It is the pre-claim status quo rather than a new behaviour, and the destination 02.03.02's unclaim row already names for exactly this trigger. S2 would require a partial-render rule for shell pages that no source describes. Keeps the claim CTA on the surface where the true owner would find it — the mechanism 02.03.02's Unclaimed row and 02.01.02 DT-01 both rely on for acquisition.

**Commits us to**:
- Zero new state and zero new render mode — reverts to pre-claim status quo.
- EXPLICITLY DOES NOT ANSWER 02.03.02 Q-02 (what an unclaimed shell publishes before anyone claims it). That remains owner-held, deferred to /create-prd-security. If shells publish little, S1 collapses toward ledger-only in practice.
- For a contest between two real people with the same name, the shell becomes a public page about a disputed identity for the contest duration; its interaction with 02.03.03 Q-02 (whether claimants see each other) is unexamined in any source — flag as a follow-on gap.

**Precedent**: Drafting precedent on authorship, not direction: attachment semantics belong to 02.03, public-render semantics to 02.01.02. 02.03.03 D-03 should state the attachment rule and reference 02.01.02 for render; 02.01.02 should reference 02.03.03 rather than asserting on its behalf that it "aligns to the same rule". That misplacement is what produced this conflict.


## DQ-05.1 — Materiality test on the ROLE facet of an attested credit

> **Entry**: DQ-05 · **Ratified**: 2026-07-22

**Chosen**: A1 — Flat identity test; 02.04.01 D-10 is the single materiality boundary

**Why**: D-13's own worked carrying example ("Drums" -> "Drums — brushes") is an INSTRUMENT change, and instrument is excluded from the (party, role, work) uniqueness key by 02.01.01 D-03 and 02.06 D-16 — so it already carries under D-10 with no entailment rule at all. DT-08 is internally incoherent ("strictly weaker or equal. Widening and intra-family narrowing carry" — a narrowing IS a strengthening). A3 commissions a role-strength ordering 02.06 does not define and would have to maintain against its own "High" deprecation pressure, creating a permanent laundering surface, and it runs against DEC-027 which already rejected the semantic reading of materiality. A2 carries in the wrong direction (dropping a modifier is a strengthening: "Assistant Engineer" -> "Engineer" would carry) while still invalidating 02.01.06's own worked correction.

**Preserves**: 02.01.06 D-01 (amendment is supersession); 02.01.06 D-03 (party change is never an amendment); 02.01.06 D-05 + DT-03 (successor tier re-derived, never inherited); 02.04.01 DT-07 anti-laundering; 02.06 D-16 (instrument multi-valued; role is not)

**Commits us to**:
- 02.04.02 D-13 and DT-08 are SUBSUMED by D-10 and must be recorded as superseded — not silently deleted.
- Four downstream citations need reference-only edits (07.03.01 counter-attested edge case + its 02.04 cross-cut note; 12.01.03 D-02 and DT-04) — outcomes unchanged, citations wrong.
- Instrument accretion/refinement never invalidates: it is not part of the claim identity.
- Accepted cost: the routine "Producer" -> "Additional Production" correction re-asks. Bounded by 02.04.01 D-09 cadence caps (1 request + <=2 nudges per credit x attester; <=5 outstanding, <=10 per rolling 30d per recipient) and D-21 request collapsing.
- The user-visible "Nothing happens" entailed-amendment promise on the role axis is withdrawn.

**Precedent**: DEC-027 (P-03) — rejected the semantic reading of materiality in favour of a mechanical predicate, explicitly to avoid minting a third project-wide materiality definition. A1 follows that direction; A3 reverses it.


## DQ-05.2 — Whether 02.06 D-11's one retroactive pending-alias mapping invalidates attestations

> **Entry**: DQ-05 · **Ratified**: 2026-07-22

**Chosen**: C1 — Pending-alias first mapping never invalidates; it is resolution completion, not a role change

**Why**: 02.06 already ratified that existing credits never re-resolve (D-11) and deprecation never rewrites credits (D-04); the pending-alias exception exists only because the alternative is credits "permanently unexportable and unqueryable". The attester confirmed the LITERAL, which 02.06 D-03/D-13 keep on the credit line unchanged — only the machine-readable canonical is filled in, so the attester cannot see the change. C2 would push mass asks through a channel D-09 caps at <=5 outstanding per recipient, on 02.06's own 4,000-credit example.

**Preserves**: 02.06 D-11 (resolution happens once; existing credits never re-resolve); 02.06 D-04 (deprecation never rewrites existing credits); 02.06 D-03/D-13 (literal retained on the credit line); 02.04.01 D-09 cadence caps / DT-11 harassment ceiling

**Commits us to**:
- 02.04.01's cross-cut note must be EDITED — it currently asserts that a taxonomy re-map is a material amendment that invalidates. Narrowed to: no taxonomy operation ever invalidates.
- Accepted blind spot: an admin mapping error silently changes the canonical on an attested credit until someone notices.
- The remedy path is ratified and routes correctly: 02.06's edge case sends a disagreeing credited party to amend via 02.01.06, which then runs the flat test from DQ-05.1.

**Precedent**: DEC-028 (P-04) — 02.06 owns the vocabulary and its resolution rules ("Domain 02 owns the vocabulary; other domains consume it"), so 02.04.01's cross-cut note is a reference that must surface 02.06's verdict, not restate a contradicting one.


## DQ-06.1 — Does ring-detection demotion enter the RUNG derivation or only the internal score

> **Entry**: DQ-06 · **Ratified**: 2026-07-22

**Chosen**: A — Score-only: the rung is invariant to detection; only the continuous internal score moves

**Why**: 02.04.02's own score-input table files ring demotion inside the score with the annotation "Detection never writes the rung", and every rung gate is written as a KIND of evidence rather than a quantity — a multiplier removes no evidence of any kind. B requires a rung-gate cut value that exists nowhere (02.04.04 Q-04 defers only the score-side cut), turns the rung into a threshold on a number (the grindability hazard kind-gating exists to remove), converts the public label into a probe oracle D-12/DT-14 were written to prevent, and lands maximum severity on the false positive 02.04.04 DT-02 calls dominant ("nearly identical", "the detector cannot be confidently right"). C is directionally clean but breaks the traversal demotion path DEC-020 ratified.

**Preserves**: 02.04.02 D-12 / DT-14 (demotion is a weight, never a cap); 02.04.02 D-02 (labels describe the evidence, not the conclusion); DEC-020 (tier-weighted traversal, no unweighted mode); DEC-010 (CollusionEvidenceConstraintV1 boundary); DT-16 (rung-at-time-T reproducibility)

**Commits us to**:
- LARGEST textual correction of the three: at least nine assertions across six files in three domains state the rung drops on demotion (02.04.02 States row, 02.04.04 States, 02.01.02 edge cases, and others). All must be corrected to score-only.
- Accepted: a fully corroborated fiction keeps its top-rung public label indefinitely. The defence is real but operates on ranking, search and dispute weighting — never on the page.
- Rung-at-time-T stays reproducible because the rung has no mutable input.
- Does NOT by itself settle the rung-GATED consumers (06.02.02 rung>=5 credential blocks, 02.08 re-emission staleness) — that is the next axis.

**Precedent**: 02.04.02's own score-input table, read literally, plus DEC-020/DEC-010 which already route suspicion through per-consumer contracts and per-edge rank rather than through public presentation.


## DQ-06.2 — Whether rung-GATED consumers also become detection-invariant

> **Entry**: DQ-06 · **Ratified**: 2026-07-22

**Chosen**: 1 — Single rung: every gate reads the same detection-invariant rung

**Why**: One rung with one meaning for v1. Options 2 and 3 both commission machinery and both reintroduce a probe surface — weaker than the rung-moving option but real — on exactly the party 02.04.04 DT-02 says the detector is most likely to be wrong about. The gate that would matter most, 02.08's RIN low-tier exclusion, is unreachable by demotion under every option (it fires on rungs 1-2). 06.02.02's rung>=5 block sits behind domain 06's own D-04 read-only-consumer rule, so if the source rung does not move the block does not either. Domain 10's possible registration floor is 10's call per 02.04.02's cross-cut note and ideation-cx item 20.

**Preserves**: 02.04.02 D-06 (exactly two axes: categorical rung + continuous score); 02.04.04 D-01/D-02 (detection internal, no probe surface); 06.02.02 D-04 (read-only consumer, never more permissive than source); Domain 10 retains its own gate decision

**Commits us to**:
- ACCEPTED COST, stated plainly: a fully corroborated fiction keeps its place in 06.02.02's rung>=5 credential block on a minors-facing paid-teaching page, indefinitely and invisibly. The defence operates only on ranking, search and dispute weighting.
- 02.08's re-emission staleness trigger currently lists demotion alongside amendment and retraction — demotion now changes nothing a RIN carries, so it must DROP OFF that trigger list.
- No third derived value enters the model; 06 needs no new logic.
- If this outcome is later judged unacceptable, per-consumer contracts (option 3) is the better remedy — its shape is already ratified as DEC-010 and it keeps each domain deciding its own gate.

**Precedent**: DEC-010 / 02.04.04 D-07 — the per-consumer constrained-contract shape exists and is ratified, which is why option 3 remains the designated fallback rather than a new invention.

