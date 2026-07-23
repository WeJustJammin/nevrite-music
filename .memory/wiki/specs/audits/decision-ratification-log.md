# Blocking Decision Queue — Ratification Log

> Owner decisions on the 57 open sub-decisions from `blocking-decision-queue.md`.
> Each records the choice, the reasoning, what it preserves, and what it commits downstream.

**Ratified: 57 / 57 — COMPLETE**

| Entry | Domain | Axes |
|---|---|---|
| DQ-03 | 02 Credits | 4 — DQ-03.A3, DQ-03.A4, DQ-03.A2, DQ-03.A5 |
| DQ-04 | 02 Credits | 2 — DQ-04.1, DQ-04.2 |
| DQ-05 | 02 Credits | 2 — DQ-05.1, DQ-05.2 |
| DQ-06 | 02 Credits | 2 — DQ-06.1, DQ-06.2 |
| DQ-01 | 01 Identity | 2 — DQ-01.A, DQ-01.B |
| DQ-02 | 01 Identity | 5 — DQ-02.3, DQ-02.4, DQ-02.5, DQ-02.6, DQ-02.7 |
| DQ-08 | 07 Music Projects | 4 — DQ-08.2, DQ-08.3, DQ-08.4, DQ-08.5 |
| DQ-09 | 11 Licensing | 3 — DQ-09.A, DQ-09.B, DQ-09.C |
| DQ-10 | 11 Licensing | 3 — DQ-10.A1, DQ-10.A2, DQ-10.A3 |
| DQ-11 | 12 Release | 5 — DQ-11.A2, DQ-11.A3, DQ-11.A4, DQ-11.A6, DQ-11.A7 |
| DQ-12 | 13 Gear | 3 — DQ-12.O1, DQ-12.O2, DQ-12.O3 |
| DQ-13 | 16 Venues | 3 — DQ-13.1, DQ-13.2, DQ-13.3 |
| DQ-14 | 16 Venues | 4 — DQ-14.1, DQ-14.2, DQ-14.3, DQ-14.4 |
| DQ-15 | 16 Venues | 3 — DQ-15.A1, DQ-15.A2, DQ-15.A3 |
| DQ-16 | 19 Ticketing | 4 — DQ-16.3, DQ-16.4, DQ-16.5, DQ-16.6 |
| DQ-17 | 19 Ticketing | 3 — DQ-17.1, DQ-17.2, DQ-17.3 |
| DQ-19 | 20 Fanbase | 3 — DQ-19.1, DQ-19.2, DQ-19.3 |
| DQ-20 | 21 Promotion | 2 — DQ-20.1, DQ-20.3 |

**Owner-decided**: 43 · **Agent-decided (flagged, spec hygiene or technically determined)**: 14

- `DQ-02.3` — Coarse activity enum — seven or four _(agent (spec hygiene, not a product choice — flagged to owner))_
- `DQ-10.A3` — Scope of the ratification — licence buyer only, or all non-persona actors _(agent (anti-axis-collapse scoping call — flagged to owner))_
- `DQ-11.A4` — Artist-facing expectation copy statistic _(agent (technically determined — flagged to owner))_
- `DQ-11.A6` — Unconditional escalation ceiling _(agent (safety backstop, no artist-facing cost — flagged to owner))_
- `DQ-11.A7` — Resolution key for the window _(agent (technically determined — flagged to owner))_
- `DQ-12.O1` — Carrier — what projects a severity option onto a grade ceiling _(agent (technically determined — flagged to owner))_
- `DQ-13.3` — Proof — which rung a room claim runs on _(agent (technically determined — flagged to owner))_
- `DQ-14.2` — Contents of the US launch profile statutory slots _(agent (refuses an unsourced empirical claim — flagged to owner))_
- `DQ-14.3` — Where external-register availability is modelled _(agent (refuses an unsourced empirical claim — flagged to owner))_
- `DQ-14.4` — Temporary-permission analogue where no per-venue statutory licence exists _(agent (a statutory exception with no statutory source is a contradiction — flagged to owner))_
- `DQ-15.A3` — Provision fact — where the commercial/provision posture of rehearsal backline lives _(agent (the alternatives fail against source — flagged to owner))_
- `DQ-16.4` — Amber stale warning default — 30 or 60 minutes _(agent (reconciles three files by editing one row — flagged to owner))_
- `DQ-16.5` — Scope at which the staleness threshold is overridable _(agent (determined by axis 3 — flagged to owner))_
- `DQ-16.6` — Which file authors the reconciled staleness rule _(agent (author-where-owned, already-ratified rule — flagged to owner))_

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


## DQ-01.A — Disclosure shape for the implied facet at alias creation

> **Entry**: DQ-01 · **Ratified**: 2026-07-22

**Chosen**: D — Pre-write disclosure inside the single Create action (auto-add plus one disclosure line; no gate, no decline branch)

**Why**: The only option leaving both ratified rules intact: 01.01.01 line 84 forbids a PROMPT and D has none; 01.01.02 D-10 objects to SILENCE and D is not silent. Those are different axes, so the apparent contradiction dissolves. Every other option either overturns one file outright or invents a decline branch no source defines — and CX-04 states "there is no state where someone holds an alias but no professional facet", so a refusal has nowhere to sit against the all-or-nothing creation contract (E-14/E-15). Note also that D-10's cited precedent is miscited: step 3's seller add is user-initiated ("They hit 'Sell something'"), and 01.01.01 separates explicit adds from implied adds, placing alias creation on the implied side by name.

**Preserves**: 01.01.01 D-12 (implied facets auto-added, never prompted); 01.01.02 D-10 (never silently); 01.01.02 E-14/E-15 all-or-nothing creation; 01.01.01 D-06 (live obligations block removal, history never does); 01.01.01 D-07 (facet, visibility, permission are independent axes); DT-03 (Fan->Musician crossing stays non-destructive)

**Commits us to**:
- Both children are edited: 01.01.01 D-12 gains a pre-write disclosure it does not currently mention; 01.01.02 D-10 loses its "one confirm" framing and its miscited precedent.
- Disclosure copy reuses the ratified seller sentence pattern: "Creating this name adds Performing to your account. Nothing you already have changes."
- No decline branch, no refusal state, no conditional — nothing new is commissioned.
- CX-04 §2 in 01.01-person-identity-roles-cx.md can now be closed; it is currently "[PENDING — Step 5]".
- Accepted limit: a user who reads nothing on the creation screen ends up where auto-add would have left them. The disclosure improves the informed case only.

**Precedent**: 01.01.01 Happy Path step 3 supplies the disclosure sentence without the blocking confirm (line 80 reserves confirms for explicit adds). 01.01.02 E-18 supplies the distinction that keeps it non-blocking: E-18 blocks before publication because "after delivery the inference is permanent and un-retractable" — a facet add is reversible, so it does not qualify.


## DQ-01.B — Which facet alias creation implies

> **Entry**: DQ-01 · **Ratified**: 2026-07-22

**Chosen**: B1 — Always `performer`, explicitly ratified; the production-only-alias case recorded as a residual open question

**Why**: B1 is the status quo of both ratified children and the only option needing no new signal and contradicting no ratified statement. B2 requires a purpose signal alias creation does not carry — obtainable only by asking, which collides with the axis A prohibition on role prompts — and a wrong inference reveals the WRONG markets under D-05, worse than an over-assertion the user can trim. B3 contradicts both 01.01.02 ("there is no fan-with-an-alias state") and CX-04, and inverts its own gate-at-the-act precedent, which gates the act while leaving the claim free.

**Preserves**: 01.01.01 line 84 (creating an alias implies performer); 01.01.02 Happy Path step 4; 01.01.01 D-02 (facets are self-asserted, not credentials); 01.01.01 D-06 (removal blocked only by live obligations); CX-04 (no alias without a professional facet)

**Commits us to**:
- The parent CX map row is CORRECTED from "implies a performer/writer facet" to `performer` only, so all three files agree. That row is Medium confidence and its own detail section already says performer only.
- RESIDUAL OPEN QUESTION recorded: a production-only alias (the industry norm per 01.01.02 Role Lens — production credits under one name, artist releases under another) receives a `performer` claim it did not ask for, with the discoverability that follows.
- That cost is bounded by D-02 and D-06: the user can drop the facet in one act, since a fresh performer has no live obligations.


## DQ-02.3 — Coarse activity enum — seven or four

> **Entry**: DQ-02 · **Ratified**: 2026-07-22 · **Decided by**: agent (spec hygiene, not a product choice — flagged to owner)

**Chosen**: 3a — Ratify seven (book / sign / spend / list / release / settle / administer); correct DT-02 prose to "a handful of coarse activities"

**Why**: D-01 is the ratified Decision and 01.03.03 Behavior independently repeats the same seven, so two of three mentions already agree. DT-02 is a rejection annotation arguing against a granular permission matrix; its count is incidental to that argument. 3b would contradict a ratified decision to match a non-ratified annotation, no source says WHICH four, DT-02 own illustrative triple names three not four, and folding settle into spend collides with 01.04.03 which treats receive/spend/distribute as distinct money authorities.

**Commits us to**:
- Enum fixed at seven; axes 4 and 5 are stated over it.
- DT-02 closing line edited from "four coarse activities" to "a handful of coarse activities".
- release and settle stay individually addressable, which the split-seed option on axis 4 requires.
- Accepted: seven plain-language statements per member is closer to DT-02 disliked matrix than four would be.


## DQ-02.4 — Activity set seeded on a non-creator confirmed band membership edge

> **Entry**: DQ-02 · **Ratified**: 2026-07-22

**Chosen**: 4a — Peer seed: every confirmed band membership edge carries the full seven-activity set; the creator owning mandate is the first instance of the same set, not a superior grade

**Why**: 01.03.03 DT-03 is the sub-domain own verdict on the alternative: custodial seeding makes whoever typed the name first the owner of the band, a structural injustice the platform would be inventing. personas.md states the rule directly (the design must make the lazy path the correct path) and CX-01 confirms the lazy path is dominant (most bands will never open the mandate surface). 01.03.01 costed the alternative operationally: every band is one death away from unadministrable. Directionally consistent with the equal-shares partnership default 01.04.01 already commits to disclosing.

**Preserves**: 01.02.02 D-07 (creator of a band they are in holds an owning mandate); 01.03.01 Behavior rule 2 (unconfirmed edge carries zero mandate); 01.04.03 D-01 (authority and visibility decoupled; every member sees every movement); sub-domain CX-01 s4 (silently gaining authority is a security event)

**Commits us to**:
- ACCEPTED COST: maximally enables the personas.md Producer anti-persona split-push; detection is after the fact via 01.04.03 D-01 transparency and the audit trail.
- Seeding administer means any confirmed member can alter another member mandate or invite/remove — WIDER than the partnership default the disclosure screen describes. The disclosure copy and the mandate screen must be reconciled so they say the same thing.
- D-06 over-limit escalation is INERT unless axis 5 supplies a default ceiling — with no ceiling nothing is ever over limit.
- Bands formed from a shared alias capture (CX-12) inherit peer authority for everyone named at capture; the skip must be legible, not silent.
- 01.03.01 D-14 succession machinery is NOT load-bearing for multi-member bands — no sole holder means death never orphans the org.

**Precedent**: personas.md Producer worst-accidental entry: the design must make the lazy path the correct path. CX-01 establishes the lazy path is the dominant path.


## DQ-02.5 — Default value ceiling on seeded authority

> **Entry**: DQ-02 · **Ratified**: 2026-07-22

**Chosen**: 5b — Default value ceiling of USD 1,000 per act, configurable per band; over-ceiling acts escalate to the owning-mandate holder

**Why**: Repairs peer seeding one structural defect (D-06 inert by construction) using only ratified parts: value ceiling is already a first-class scope dimension in 01.03.03 Behavior, and the escalation target is guaranteed to exist by 01.02.02 D-07 plus 01.03.03 D-04. 5c is more elegant but has no threshold to read in the unconfigured state, commissions an approval flow and timeout no source defines, amends D-06 stated target, and pre-empts 01.04 index Q-02. The USD 1,000 figure was authored by the owner: no source supplies one, and the illustrative GBP 300 / GBP 30k / GBP 2,000 figures predate the US-first revision and are one example band agreed threshold, not a platform default.

**Preserves**: 01.03.03 D-06 (over-limit escalates to a capable holder, never dead-ends); 01.03.03 D-04 (every org retains at least one full mandate holder); 01.02.02 D-07 (creator owning mandate is uncapped); 01.03.03 Behavior (activity and value ceiling are the two scope dimensions); 01.04 index Q-02 left open (governance stays optional)

**Commits us to**:
- USD 1,000 per act is the platform default; each band may configure its own figure.
- Denominated in USD per meta/constraints.md US-first revision. The GBP figures in 01.03.03 and 01.04.01 are illustrative narrative and must not be read as defaults.
- D-06 escalation and 01.03.03 Happy Path steps 3-5 plus its first Edge Case row are now REACHABLE in the default state rather than only after configuration.
- ACCEPTED: asymmetry returns above the ceiling — the creator is the only uncapped holder, so 01.03.01 D-14 succession offer and Q-04 selection rule stay live for the over-ceiling half rather than becoming dead code.
- Revisit 5c once 01.04.01 governance capture ships — it takes none of the DT-03 objection and tracks what bands actually agree.

**Precedent**: 01.03.03 Behavior names value ceiling as a first-class scope dimension; D-06 supplies the escalation semantics; D-07/D-04 guarantee the target exists.


## DQ-02.6 — Which membership capacities the seed attaches to

> **Entry**: DQ-02 · **Ratified**: 2026-07-22

**Chosen**: 6b — Seed attaches to `permanent` capacity only, as a REBUTTABLE DEFAULT; touring / staff / honorary carry presence with zero authority until explicitly granted. R-02 amended in the same pass.

**Why**: The axis-4 justification is symmetry among the people who constitute the band; it does not reach a hired touring player or an honorary name. 01.03.01 touring row confirms their governance standing is treated differently. IMPORTANT HONESTY NOTE carried from the revision round: an earlier draft claimed this qualification was inherited from ratified content — that was false. R-02 is the on-point ratified item and it cuts the other way ("Considered deriving mandate from capacity ('drummers can't sign')" — rejected). 6b is therefore genuine new content, coherent only if R-02 is amended to distinguish DERIVATION (barred) from a REBUTTABLE DEFAULT keyed to capacity (permitted).

**Preserves**: 01.03.01 D-03 (four capacities: permanent/touring/staff/honorary); 01.03.03 D-02 (plain-language authority statements)

**Commits us to**:
- R-02 MUST be amended in the same pass — derivation of mandate from capacity stays barred; a rebuttable capacity-keyed default is permitted. Without that amendment this decision contradicts a ratified item.
- A band may still grant a touring member the full set explicitly, and the surface must say so.
- Every plain-language default statement gains a second sentence.
- A touring hire does not inherit settle authority over band money on day one.


## DQ-02.7 — Whether non-band org types inherit the seed

> **Entry**: DQ-02 · **Ratified**: 2026-07-22

**Chosen**: 7a — Band only; studio / venue / label / shop / agency default to the owning mandate plus explicit grants

**Why**: The entire case for a peer seed is the invisible general-partnership default 01.04.01 D-04 commits the platform to disclosing, and 01.04 index D-01 scopes that to bands in terms while denying it for other orgs ("a limited company has directors and articles; a studio has an owner"). A studio, venue or shop already has an owner in the sense the seed would otherwise invent. Uniform seeding would push settle and sign onto every confirmed staff edge of a venue or shop, contradicting the Operator Role Lens in spirit. CX-15 uniformity claim was checked and does not support 7b: it is about scope across the types of one multi-type org, not about defaults across org types.

**Preserves**: 01.04 index D-01 (governance modelled for the band specifically, not orgs generally); 01.03.03 Role Lens (Operators configure staff mandates explicitly); sub-domain D-01 (one merged membership/representation model)

**Commits us to**:
- HONESTY NOTE: no source states what a non-band org defaults to when nothing is configured. This is a ratification, not an inheritance — an earlier draft smuggled it in as part of another option's definition rather than surfacing it as a choice.
- Two default models to explain: band = peer seed with ceiling; every other org type = owning mandate plus explicit grants.
- Avoids the trader-status and payments unwinding that uniform seeding would force.

**Precedent**: 01.04 index D-01, read at its real strength: it governs whether GOVERNANCE is modelled per type, which is supporting reasoning for scoping the seed to bands rather than a direct precedent on mandate defaults.


## DQ-08.2 — Is a non-web client on the producer machine ever authorised

> **Entry**: DQ-08 · **Ratified**: 2026-07-22

**Chosen**: C — Defer behind a named, surface-specific evidence gate. No client authorised; the Desktop row becomes "not authorised; reopens only on the enumerated evidence".

**Why**: A and B decide the same strategic question in opposite directions on the same missing evidence — domain Q-08 and 07.09.02 Q-03 both state the track-name premise is "asserted from reasoning, not verified" and call it the strongest single assumption in the domain. D genuinely changes the cost profile but is unspecified anywhere in the tree, keeps the parser cost, kills 07.09.03 ratified delivery surface, and widens the read-scope problem D-06 exists to control. C closes the ambiguity without spending a commitment on unevidenced ground, and costs nothing in v1 because no 07.09 feature is phased.

**Preserves**: 07.09 D-02 (delivery shape routed to /create-prd); 07.09 D-04 / ideation-index D-37 (evidence before commitment); feature-ledger rows 273-275 (07.09.* Should, unphased); constraints.md single-surface v1 classification

**Commits us to**:
- THE CONTENT IS THE DECISION: the Desktop row must enumerate the four reopen-evidence items in full. Written without them it reproduces the exact ambiguity this finding names.
- Reopen evidence: (a) can producers on locked-down commercial studio machines install anything at all (07.09.01 Q-02 / DT-03(b)); (b) does real-session evidence support the track-name premise (domain Q-08, 07.09.02 Q-03); plus the two further items enumerated in the entry.
- "Not in scope. No directive." is REPLACED — the current row is an absence that any future reader can re-read as permission.
- Nobody is currently assigned to gather the reopen evidence; these are owner-decision inputs, not tracked work. Flag as a follow-on.
- /create-prd-stack can now proceed: no agent distribution, signing, notarisation or auto-update design is required for v1.

**Precedent**: 07.09 D-04 / ideation-index D-37 (Owner, 2026-07-20) — evidence before commitment, already set on this sub-domain. C matches the SHAPE of that gate without borrowing its content.


## DQ-08.3 — What delivers the 07.06.02 capture prompt in v1

> **Entry**: DQ-08 · **Ratified**: 2026-07-22

**Chosen**: PWA web push + in-app, ratified as the v1 delivery of the Tier 1 contributor card and Tier 2 Producer card

**Why**: Uses only a capability D-28 (User, 2026-07-18) already locked into v1 — the capability needs no new authorisation, only the assignment is new. It is the only v1-available surface that can meet 07.06.02 D-09 Tier 1 requirement (<=5 s after close, ungated). 07.09.03 DT-01 rejected the web app as a prompt surface by name; its only objection to phone push was that constraints.md lacked a mobile surface — written 2026-07-17, one day before D-28 supplied one.

**Preserves**: 07.06.02 D-09 (Tier 1 <=5 s, ungated); 07.06.02 D-11 (an ask with an empty pre-fill does not fire); 07.09.03 DT-01 (the web app is not a prompt surface); constraints.md Mobile (PWA) row, D-28

**Commits us to**:
- Closes 07.06.02 Q-09 and 07.09.03 Q-03.
- PAYLOAD CAVEAT ratified with it: with no parse in v1 the pre-fill sources are the session roll (07.06.01) and roster (07.03.01) only, and D-11 suppresses cards with neither. "Push is decided" must not be read downstream as "the card is full".
- The close SIGNAL is still limited in v1: producer tap, booked end and the 72 h backstop apply, but DAW close is unavailable as a trigger.
- VERIFY BEFORE RELYING ON IT: iOS Safari web push requires the PWA installed to the home screen. No source in the tree states this platform fact.

**Precedent**: constraints.md Mobile (PWA) row locked by D-28.


## DQ-08.4 — Does 07.09 keep Should or become Won't

> **Entry**: DQ-08 · **Ratified**: 2026-07-22 · **Decided by**: determined by DQ-08.2 (defer with a reopen gate)

**Chosen**: Keep `Should`, unphased — no ledger change

**Why**: This axis was explicitly conditional on the client-surface axis. Demoting 07.09.01/.02/.03 to `Won't` would close the door the evidence gate exists to hold open — the two are incompatible. `Should` + unphased is already the ledger state (feature-ledger rows 273-275, under the header rule that phasing applies to Must-haves only), so this is a confirmation rather than a change.

**Commits us to**:
- No change to moscow-ledger.md or feature-ledger.md.
- The six bridge-dependent features are NOT re-scoped; 07.04.01 Q-05 ("if the bridge is a Won't, this feature should be re-scoped honestly rather than shipped hollow") does not fire.
- If the gate later closes without reopening, this axis must be revisited to `Won't` together with that re-scope.


## DQ-08.5 — Is the v1 thesis restated to match what v1 can do

> **Entry**: DQ-08 · **Ratified**: 2026-07-22

**Chosen**: Restate for the v1 window — capture at the first sharing moment; capture-at-source described as the direction, not the current claim

**Why**: No 07.09 feature ships in v1 under any answer, so for the entire v1 window the product captures at first sharing (the review link, 07.05.02) plus the close prompt. Domain 07 D-06 makes this an obligation, not a preference: "the platform never overclaims what it cannot do ... these users are professionals; an overclaim discovered later is an unrecoverable trust breach." 07.09 Q-02 asks the question directly. Restating is cheap now and expensive later.

**Preserves**: Domain 07 D-06 (honest claims over false assurance); The thesis itself as DIRECTION — provenance is the wedge, consolidation is the platform

**Commits us to**:
- Edits three positioning documents: vision.md thesis wording, meta/problem-statement.md framing, meta/competitive-landscape.md capture-vs-reconstruct differentiation.
- Reversible if the evidence gate reopens and the bridge is built — two edits instead of none, accepted as cheaper than carrying the overclaim.
- OPEN FOLLOW-ON: whether the restated claim is still competitively differentiating is a market judgement no source in the tree makes. competitive-landscape.md must be re-read against the new wording before the edit is finalised.
- Closes 07.09 Q-02.

**Precedent**: Domain 07 D-06, which states the obligation directly.


## DQ-09.A — Gate denominator — what an auto-approve ceiling is a ceiling on

> **Entry**: DQ-09 · **Ratified**: 2026-07-22

**Chosen**: A1 — Own share: each owner ceiling is tested against that owner own share of the deal value; auto-approve still requires every owner to pass (permissions stay conjunctive per 11.04.03 D-02)

**Why**: Both texts are ratified, so the tie breaks on ownership and load-bearing-ness. The per-share base is stated four times in the [DEEP] file that owns the policy object (Behavior twice, Happy Path 7, D-17), is the literal product promise in its Role Lens (up to GBP 500 of my share), and carries a dependent rule (unresolved splits fall through). The minimum clause appears once in the sub-domain only [PARTIAL] file, has no Deep Think derivation behind it, and its two apparent corroborations are citations back to it rather than independent findings. It is also not well formed on its own terms: min(500, 2000) only names a work-level ceiling if both ceilings were denominated on the deal to begin with, which is the very thing in dispute. Independent argument: 11.04.02 D-02/DT-02 draw the ratified line between a policy and a veto — a policy governs its author share; a veto constrains everyone shares. A2 makes every policy behave like a veto.

**Preserves**: 11.04.01 D-17 and both Behavior statements (per-share base); 11.04.01 Musician Role Lens copy (up to GBP 500 of my share); 11.04.02 D-02/DT-02 policy-vs-veto distinction; 11.04.03 D-02 conjunctive permissions (untouched by this axis); 11.04.01 master-vs-publishing order-of-magnitude economics

**Commits us to**:
- THREE ratified sentences are corrected as WRONG, not refined: 11.04.03 Behavior minimum clause, its edge-case row, and the sub-domain CX synthesis Q5.
- Also corrects 11.04.01 own edge-case row (Two owners set different auto-approve ceilings | Lowest wins (11.04.03)) — a citation back to the clause being removed.
- ACCEPTED: this is the strictly MORE PERMISSIVE reading. Everything the alternative auto-approves, this auto-approves too, plus more. Exposure is wider.
- Threshold force becomes proportional to share size — the instinct 11.04.03 DT-02 rejected in its own file.
- A resolved split is required for every threshold test, so cold-start and provisional-split works keep falling through (already ratified in D-17; this makes it load-bearing).
- 11.04.01 DT-05 salami-slicing exposure (ten GBP 450 requests against a GBP 500 ceiling) is unchanged by this axis and remains governed by the D-06 trailing 90-day window.

**Precedent**: P-04/P-05 author-where-owned, applied narrowly to the denominator only: the unit a ceiling is denominated in is an attribute of the policy object, which 11.04.01 owns via D-01 (Policy attaches to a share, never to a work).


## DQ-09.B — What the fold emits and displays for thresholds

> **Entry**: DQ-09 · **Ratified**: 2026-07-22

**Chosen**: B2 — No synthetic work-level ceiling. An attributed per-owner threshold set, plus a per-request pass/fall-through answer naming the binding owner.

**Why**: B3 (literal minimum) is foreclosed by the per-share choice on axis A: min(500, 2000) would compare quantities in different denominations, producing a figure that is arithmetically meaningless and materially misleading. Between the remaining two, B2 invents nothing — per-owner thresholds are already the fold inputs, and naming the binding owner is exactly 11.04.03 D-04 (Owners are told when their own policy is inert, and by whom). B1 formula is arithmetically correct but appears in no source file, and adopting a divisor-derived quantity silently reopens D-04 attribution guarantee, which attributes a CONSTRAINT to an owner rather than a derived number.

**Preserves**: 11.04.03 D-04 attribution in its ratified form; 11.04.03 D-01 (the aggregate is derived and never editable); 11.02.01 cross-cut note (consumes the fold verdict, never individual share policies)

**Commits us to**:
- 11.04.03 Populated state and its edge-case row must be REWRITTEN: they currently promise a single effective ceiling figure (Both see the effective ceiling and whose it is); they now promise an attributed threshold set plus a per-request binding-owner answer.
- ACCEPTED comprehension cost: an owner asking what can this work auto-clear gets a rule, not a figure, and must supply a deal value to get an answer.
- The fold API must expose per-owner threshold data to the CO-OWNER VIEW. This is a display surface, not 11.02.01 gate path — the boundary must be stated explicitly or it risks reading as a licence to consume individual policies.
- Survives the D-06 trailing 90-day window without contortion: no standing number has to stay true across buyers and media.

**Precedent**: 11.04.03 D-04, read at full strength: attribution is of a constraint to an owner, which B2 preserves and B1 would have replaced with a derived quantity.


## DQ-09.C — Denomination and share-basis of the D-06 trailing 90-day window

> **Entry**: DQ-09 · **Ratified**: 2026-07-22

**Chosen**: C0 (forced consequence) plus C1 — Historic: the window is per-owner and share-denominated, and each past auto-approval keeps the share value it had when it cleared

**Why**: C0 is arithmetic necessity, not a choice: 11.04.01 Happy Path 7 adds the running total to the request share value and compares the sum to one ceiling, so the window must be denominated the same way the ceiling is. Under the per-share gate that makes it per-owner and share-denominated. The genuinely open part — historic vs current share — is decided by D-06 own purpose (the window is a record of what actually cleared; DT-05 exploit is about what cleared) and by DT-14 read in the direction the source states it: revaluing at a reduced current share lowers the running total and silently widens headroom under a ceiling the owner never touched.

**Preserves**: 11.04.01 D-06 (trailing 90-day cumulative window); 11.04.01 DT-05 (salami-slicing defence); 11.04.01 DT-14 (a ceiling that moves without the owner acting silently widens); 11.04.01 D-15 (dispute suspension)

**Commits us to**:
- The auto-approval record must PERSIST the share value used at approval, not only the deal value.
- ACCEPTED: an owner whose share GREW mid-window carries a total computed at their old smaller stake, so their headroom is proportionally generous for up to 90 days.
- History is never restated — the digest record of what was approved always matches the figures the gate uses.
- No split-history reconstruction is needed at gate time.

**Precedent**: 11.04.01 DT-14, applied in the direction the source states: revaluation that widens headroom without the owner acting is the harm the rule names.


## DQ-10.A1 — What written artifact describes the commercial licence buyer

> **Entry**: DQ-10 · **Ratified**: 2026-07-22

**Chosen**: A1-b — Buyer counterparty profile authored in meta/ (e.g. meta/counterparties.md), six fields plus Workflow and Anti-Persona Behavior, explicitly NOT a persona, adding no Role Matrix column

**Why**: The blocked files ask for one specific thing — a described primary user for the Role Lens to consume — and this delivers exactly that at the smallest edit surface, leaving D-19 and 24 Role Matrices untouched. Authoring nothing is refuted by disk: the same name-it-do-not-describe-it treatment was applied to Admin, and 24.01.03 Q-01 records that the actor still cannot be specified. Deferring is the mechanism that already failed — Q-01 went to /ideate-validate, which ran 2026-07-18, scored Persona Specificity green and closed 8/8 without recording an answer. A fifth persona is defensible but costs a full 24-domain column pass and creates precedent pressure toward personas for eight other non-persona actors that existing decisions resolved by refusing exactly that.

**Preserves**: D-19 (4 primary personas) unamended; personas.md coverage-verified-across-24-domains invariant; 11.08.02 D-11 (licensee is not the purchaser) — expressible in prose, not in a single column; 06 D-07 escalation left recorded but not resolved here, as that row itself states

**Commits us to**:
- New file authored in meta/ describing the commercial licence buyer with the same six fields personas.md uses, plus Workflow and Anti-Persona Behavior, under a header stating it is NOT a persona and adds no Role Matrix column.
- Buyer-facing Role Lens notes in 11.01.02, 11.02.01, 11.01-sync-licensing-index, 11.06 and 11.08.02 change from this feature primary user is unspecified to a REFERENCE to the profile — authored once, never restated.
- personas.md MUST carry a pointer to the new file, or the profile is easy to miss — this is the option own stated weakness.
- Role Matrix tables stay four-column: a reader skimming only the table still sees no buyer, and the correction depends on the prose note beneath being read.
- Closes 11.01.02 Q-01, 11.02.01 Role Lens block, 11 Q-01 and 11.06 Q-01.
- Does NOT close vision.md Q-00 (Admin/Moderator as a fifth persona) — that remains open and is now the nearest neighbour question.

**Precedent**: personas.md Q-02 with 02.06 D-20 and 05.01.02 Q-02 — an actor genuinely needed can sit outside the persona set BY DECISION rather than by omission. Plus D-50/P-04 author-where-owned: the buyer is described once in meta/ and referenced by each 11.x Role Lens.


## DQ-10.A2 — Granularity — one buyer artifact or two

> **Entry**: DQ-10 · **Ratified**: 2026-07-22

**Chosen**: A2-b — Two artifacts: a professional licence buyer (supervisor/brand/agency) and a creator micro-licence buyer (podcaster/streamer/small-business channel)

**Why**: 11.06 index does not record a difference of degree but a difference in KIND: there the buyer matches no persona; here they match one badly, which is more dangerous. It also names the concrete downstream harm of blurring them — a spec writer reading Fan: Full builds for a music enthusiast instead of a small-business operator. One artifact broad enough to cover both would reproduce that defect one level up, and its six fields would diverge on almost every row (pain, workaround, budget, tolerance for professional-tool complexity), producing exactly the generic text the Persona Specificity rubric rejects.

**Preserves**: 11.06 index characterisation of the creator buyer as running a business that happens not to be a music business; Persona Specificity rubric standard applied to non-persona profiles too

**Commits us to**:
- Professional buyer profile referenced by 11.01, 11.02, 11.03 and 11.08.
- Creator micro-licence buyer profile referenced by 11.06 AND by 11.02.01 Fan row, which currently describes that population as silently governed.
- Two documents must be kept consistent where the buy side is genuinely common (checkout, verdict rendering, the licence instrument).
- OPEN BOUNDARY CASE recorded: a small production company that is neither agency nor creator sits between the two artifacts; a single broader artifact would have absorbed it.


## DQ-10.A3 — Scope of the ratification — licence buyer only, or all non-persona actors

> **Entry**: DQ-10 · **Ratified**: 2026-07-22 · **Decided by**: agent (anti-axis-collapse scoping call — flagged to owner)

**Chosen**: A3-a — Narrow: commercial licence buyer only, with an explicit non-closure list written into the decision

**Why**: The nine other non-persona actors are not buyers and are not alike — a curator receives pitches, a stagehand sells four hours of labour, an insurer is off-platform, Admin is internal — so a buyer artifact is not their answer. Several already have contrary domain rulings. Applying one form to ten heterogeneous actors in a single pass is precisely the axis-collapse defect this entire revision round was run to remove. Each of those questions is owned in another domain index, so a domain-11 ratification can make them answerable but cannot close them without a propagation pass; claiming closure would leave them silently unaddressed.

**Commits us to**:
- CLOSES: 11 Q-01, 11.06 Q-01, 11.01.02 Q-01.
- EXPLICITLY DOES NOT CLOSE (must be written into the decision): personas.md Q-01 (professional dealer, 13/14/15 — a seller, not a buyer); personas.md Q-02 with 24.01.03 Q-01 (Admin); 21.02 Q-01 with 21 D-03 (curator/journalist/radio/DSP gatekeeper); 13.09 D-03 with 13.13 (dealer counterparty); plus the stagehand, insurer, accountant, manager and fee-paying-parent questions.
- ACCEPTED: 11 Q-01 own text bundles itself with personas.md Q-01 and 11.06 Q-01 (all three are one question), so this narrow ratification explicitly declines part of what that row asks.
- Nine open actor questions remain, several independently blocking their own surfaces — 24.01.03 Q-01 (Admin) most sharply.
- The non-closure list is what stops a downstream reader treating this as THE persona-gap decision and assuming dealer, curator and Admin were handled.

**Precedent**: The axis-decomposition rule applied throughout this queue: name what is locked, decide only what is genuinely open, and never let one answer silently overwrite heterogeneous cases.


## DQ-11.A2 — Precedence — observed vs contractual window

> **Entry**: DQ-11 · **Ratified**: 2026-07-22

**Chosen**: A2-i — Observed outranks contractual. Where enough observations exist the window is the observed value (marked measured); a stated SLA is used only where observation is insufficient (marked stated).

**Why**: Supported from inside the file that argues the other way: 12.02.02 DT-07 (a profile certified in March is wrong in July and nothing tells us) and DT-15 both find partner documentation stale, thin and changed without announcement — precisely the argument against treating a stated SLA as authoritative. 12.02.03 D-05 already specifies what to do with the divergent case rather than dropping it. EXPLICIT NON-SUPPORT recorded: 12.02.02 contested-entry rule is only an analogy, not an argument — it fires on 2 independent rejections on 2 distinct releases, a falsification EVENT, and a timing divergence produces no rejection. The first draft cited it as if it decided the matter.

**Preserves**: 12.02.03 D-05 divergence routing (recorded, routed to partner management, never surfaced to the artist); 12.02.02 DT-07 / DT-15 staleness findings

**Commits us to**:
- A partner inside our observed window but outside their own written SLA is NOT late by the window.
- The contractual comparison becomes a second path routed to partner management — described in 12.02.03 D-05 but with NO OWNER, NO SURFACE and NO THRESHOLD anywhere. Flag as a follow-on gap.
- For a partner with a published SLA but few deliveries we ignore a real number we already have until the sample floor is met.


## DQ-11.A3 — Alarm statistic, sample floor and recency bound

> **Entry**: DQ-11 · **Ratified**: 2026-07-22

**Chosen**: A3-i — p95 over >=30 completed signal-complete -> first terminal ack observations per (partner x message type) within the last 180 days, rounded up to the next whole partner-business-day, floor 1 day

**Why**: The rival formulation (P90 over the last 20 acks once >=5 are seen) is not buildable as written: at its own floor the statistic is the sample maximum, it carries no recency bound in a file whose DT-07 makes staleness the central hazard, and it specifies neither rounding nor a minimum. A3-i is the only formulation an implementer can code without inventing a rule. The owner chose the higher floor (30 over 20) accepting longer silence for low-volume partners in exchange for a statistic resistant to a single slow week.

**Commits us to**:
- ACCEPTED: a low-volume partner or uncommon message type may never reach 30 observations in a rolling 180 days and sits permanently on the tier-3 seeded window with no measured value.
- Rounding up to whole partner-business-days with a 1-day floor is part of the ratified rule, not an implementation detail.


## DQ-11.A4 — Artist-facing expectation copy statistic

> **Entry**: DQ-11 · **Ratified**: 2026-07-22 · **Decided by**: agent (technically determined — flagged to owner)

**Chosen**: A4-i — p50 (median) at N>=10, DISTINCT from the alarm statistic; below N=10 no expectation clause is shown at all

**Why**: Using one number for both is the single option that produces an actually wrong sentence: quoting a p95 or P90 after the word usually misdescribes the partner. Between the two median options the statistic is identical and only the floor differs, and 12.03.02 own text calls its 20 a default, not a law whose exact number is tunable — so adopting 10 overrides nothing that file defends, and it reaches evidence sooner than the alarm does, which is the right asymmetry for a reassurance clause.

**Commits us to**:
- Two distinct statistics coexist by design: p95@30 fires the ladder, p50@10 backs the usually N days copy.
- Below N=10 the artist sees no expectation clause rather than a guess.


## DQ-11.A6 — Unconditional escalation ceiling

> **Entry**: DQ-11 · **Ratified**: 2026-07-22 · **Decided by**: agent (safety backstop, no artist-facing cost — flagged to owner)

**Chosen**: A6-i — Keep the unconditional internal escalation ceiling (10 business days) alongside the tiered window, restated in partner business days per the locked counting clock

**Why**: The ceiling and the tier-3 seed answer different questions and only look like rivals: regardless makes 12.02.02 row an always-on backstop, while 12.02.03 5 partner-business-days applies only when neither a stated nor an observed window exists. Keeping both preserves a real safety property at no artist-facing cost, and it is the part of 12.02.02 D-12 that survives the other axes going the other way.

**Commits us to**:
- The ceiling wakes an operator even when the tiered window is silent or wrong.
- Its numeric value (10) is a guess by its own file admission (12.02.02 Q-05) — recorded as tunable, not as evidenced.
- Restated on the partner-business-day clock per the locked A5, not wall-clock.


## DQ-11.A7 — Resolution key for the window

> **Entry**: DQ-11 · **Ratified**: 2026-07-22 · **Decided by**: agent (technically determined — flagged to owner)

**Chosen**: A7-i — Per (partner x message type); the accepted-but-not-live wait stays with 12.03.02 as a separate concern

**Why**: The only option that does not require inventing an observation model. The argument that the per-stage axis is orthogonal and therefore free does not hold: the axes are orthogonal but the statistic is not axis-neutral, because 12.02.03 tier-1 interval is end-to-end (signal-complete -> first terminal ack) and per-stage intervals are defined nowhere. The third-source support usually cited for per-stage keying (12.03.02 DT-15) is actually about ack-wait versus live-wait, which is a different distinction.

**Commits us to**:
- A takedown and a new release get separate windows for the same partner — correct, since takedowns are frequently expedited for legal reasons while new releases queue.
- 12.02.02 PC-10 per-ack-stage axis is DROPPED, not merged.
- Live-wait (accepted but not yet live) remains 12.03.02 concern and is not folded into this window.


## DQ-12.O1 — Carrier — what projects a severity option onto a grade ceiling

> **Entry**: DQ-12 · **Ratified**: 2026-07-22 · **Decided by**: agent (technically determined — flagged to owner)

**Chosen**: A — An authored (axis, severity-token) pair on each severity option, drawn from 13.02.01 vocabulary (axis: cosmetic | functional | structural | missing-part); 13.02.01 keeps one ceiling table

**Why**: The only carrier that leaves every locked decision standing. L1 (per-item severity language) is untouched because the pair is never seller-facing. L2 is satisfied because the checklist author decides it once per category — literally what D-06 already says that actor does with this same pair. L3 is untouched because the table still caps rather than sets. 13.02.01 Scale table and its versioned grade definitions survive UNEDITED, which neither alternative achieves: authoring the ceiling grade directly rewrites six Requires cells, and keying off the materiality verdict deletes three.

**Commits us to**:
- Each authored severity option gains one authored (axis, severity-token) property alongside the materiality verdict it already produces.
- The pair is never seller-facing — sellers continue to see per-item plain language only.
- 13.02.01 versioned grade definitions and Scale table need no edit and no version bump.


## DQ-12.O2 — Ownership — which artifact authors the projection

> **Entry**: DQ-12 · **Ratified**: 2026-07-22

**Chosen**: E — The shared per-category structured-attribute schema authors it; catalog moderation holds the standing

**Why**: The only option that names an accountable writer for a field that caps what every seller in a category may claim. It ratifies a direction three files have already taken rather than inventing one — 13.02.02 Behavior already asserts the checklist rides that same per-category mechanism, and its Cross-Cut Notes count itself as the third vote for yes. Authoring a per-category mapping table in 13.02.01 was eliminated by DEC-028: it is the one option creating a second copy of a set another file owns.

**Preserves**: DEC-028 author-where-owned (no second copy of another file set); 13.02.02 Behavior binding of the checklist to the per-category mechanism

**Commits us to**:
- PRE-ANSWERS 13.02.03 Q-02 — the open question about the shared per-category mechanism is decided in the affirmative as a side effect. Must be recorded there explicitly, not left to be discovered.
- Commissions the schema field as new work.
- Catalog moderation gains standing over a field that caps seller condition claims — a real authority grant, consistent with the ratified rule that Config permits taxonomy selection and proposals but never vocabulary curation.


## DQ-12.O3 — Grade semantics — may a professionally-repaired unit still be Excellent

> **Entry**: DQ-12 · **Ratified**: 2026-07-22

**Chosen**: H — Keep the split (professional/stable -> Excellent, amateur/unstable -> Good), seller-asserted, with first-party records pre-filling and contradictions surfaced but never auto-asserted

**Why**: This axis changes what a grade MEANS, which is versioned content under 13.02.01 D-07, so it was decided on its own rather than as a side effect of the carrier question. Collapsing both rows to Good is the tempting default and was rejected: it deletes a live Scale-table allowance on the false premise that no source supplies repair quality, when three do for on-platform repairs (13.08.02 records the repairer and what was replaced; 13.09.03 is a professional bench assessment; 13.02.02 DT-04 models a repair as a fact). H reuses the pre-fill-never-auto-assert pattern already specified for this exact class of fact and degrades gracefully where no record exists.

**Preserves**: 13.02.01 Scale table grade-3 allowance (at most one professionally-executed, stable, disclosed structural repair); 13.02.01 D-07 immutable versioned grade definitions — NO version bump required; 13.02.02 D-07 pre-fill-never-auto-assert pattern; 13.02.02 D-06 (the seller is not asked to assess their own liability) — respected via corroboration

**Commits us to**:
- The severity option splits where a category admits it; the seller picks, and the pick is a signed claim carrying their liability.
- Where the platform holds a first-party record for the unit, the option is pre-filled and corroborated; contradictions are SURFACED, never auto-asserted.
- DEPENDENCY: the corroboration half is not implementable until 13.08.02 Q-02 resolves (whether off-platform repairs can be recorded, and how a self-reported one is treated). Degrades to seller-asserted-only until then.
- Most vintage repairs predate the platform, so corroboration will be absent in the common case.


## DQ-13.1 — Origin — how a room operating org authority comes into existence

> **Entry**: DQ-13 · **Ratified**: 2026-07-22

**Chosen**: A3 — Both: the place claimant may GRANT a room (cooperative default, instant, no claim unit), and a room operator may independently PROVE control via 16.05.02 ladder scoped to the room when the claimant will not cooperate or has vanished

**Why**: The two source files are not arguing about the same thing. 16.01.02 DT-11 is entirely about ORIGIN COST (a second claim requires a partial-claim concept 16.05.02 does not have). 16.01.01 DT-08 is entirely about DEPENDENCY AND LEVERAGE (a grant makes the landlord the gatekeeper; in a rent dispute the grant is a lever). A3 answers both rather than picking a loser, and matches the real distribution: most subleases are cooperative and should cost nobody anything, while the uncooperative landlord is precisely the case a fast path cannot serve. The two-path shape is already ratified in the file that owns claims (16.05.02 D-10: the cooperative path is one action, no review).

**Preserves**: 16.01.01 D-06 (containment is room-level operating org, not a second record); 16.01.01 D-07 and DT-08 (no landlord gatekeeping); 16.01.02 D-09 (room as the unit of operational delegation); 16.05.07 D-17 premise (a sublessee is not at the landlord mercy)

**Commits us to**:
- 16.05.02 Q-03 is answered YES (a room can be a claim unit) and D-14 (the claim unit is the place record) is AMENDED.
- Commissions both the grantable power 16.05.02 does not currently model AND the room-scoped claim unit D-14 currently forbids — the most machinery of the three options.
- UNSPECIFIED COLLISION recorded: two authority provenances can exist on one room. No source defines what happens when a granted room operator later claims, or when a room claim lands on an already-granted room. This MUST be specified.
- Carries 16.01.01 Q-09 hostile-room-claim exposure — the claim path is the vector.


## DQ-13.2 — Extinguishment — can the place claimant end a grant unilaterally

> **Entry**: DQ-13 · **Ratified**: 2026-07-22

**Chosen**: B2 — Adjudicated: revocation is a dispute, not an act. Initiating it opens a counter-window with escalation to domain 24, and the room stays live and bookable throughout.

**Why**: 16.01.01 DT-08 rejection of the grant is, read closely, entirely a rejection of UNILATERAL REVOCATION — the words are the grant is a lever and revoking it takes a trading studio offline. Removing that and leaving the grant is why the two source files stop conflicting once this axis is separated from origin. B2 also costs the room operator nothing, which distinguishes it from the two-tier option: 16.05.02 DT-10/DT-11 establish the sublessee studio is structurally unable to complete any strong rung, so any option conditioning protection on proof gives that population nothing.

**Preserves**: 16.05.02 D-03 (a contested claim freezes the claim, never the record); 16.05.02 D-10 (14-day counter-window, maximal notification, silence is what closes it); 16.01.02 revocation booking-safety rule (never orphan a paid deposit) — carried into the dispute path; the room stays live and bookable throughout — clause of 16.01.01 D-07 and 16.05.07 D-17, inherited from 16.05.02 D-03 per 16.05.07 DT-13

**Commits us to**:
- NO SOURCE DEFINES A DISPUTE PATH FOR A GRANT. 16.05.02 D-03/D-10 machinery is defined over claims and anchor snapshots; a revocation dispute over a non-claim authority has no anchor to re-derive. This must be specified.
- The platform is placed inside the landlord/tenant row that 16.01.01 DT-08 itself says it has no business adjudicating — domain 24 becomes arbiter of whether a sublease genuinely ended. Accepted deliberately.
- A landlord whose tenant has genuinely vacated must wait out a dispute window before re-letting their own room on the platform.
- Adjudication load lands on domain 24, unbudgeted.


## DQ-13.3 — Proof — which rung a room claim runs on

> **Entry**: DQ-13 · **Ratified**: 2026-07-22 · **Decided by**: agent (technically determined — flagged to owner)

**Chosen**: C1 — L7 document review, with the sublease/licence agreement as the document and the place claimant org as the external cross-check

**Why**: It commissions nothing: the rung, the reviewer checks and the claimant notification all exist in 16.05.02 and 16.01.01 today. The only new statement is that a sublease agreement is an acceptable L7 document for a room-scoped claim and that the named landlord is checked against the record claimant org — which is a genuine strengthening of L7, since 16.05.02 says that where the register cross-check is unavailable L7 is a human reading a forgeable PDF. Adding a claimant-attestation anchor rung was rejected on its own terms: under the both-paths origin a cooperative landlord already has the grant path, so it buys nothing and costs the independence the claim path exists to provide. Deferring the rung set would leave the escape hatch declared and unbuildable.

**Commits us to**:
- L7 is PERMANENT for this population, not a fallback — 16.05.02 Q-01 already flags this as unresourced: the weakest, slowest, forgeable, human-operated rung becomes the primary rung.
- 5-business-day review SLA applies, and Provisional grants no calendar and no rate card — so a room operator on the CLAIM path cannot trade until a human clears the document. The grant path remains instant.
- No new rung and no new provenance class is added to 16.05.03 ranking.


## DQ-14.1 — Parameterization shape — jurisdiction axis and how many profiles at launch

> **Entry**: DQ-14 · **Ratified**: 2026-07-22

**Chosen**: B-minus — Regime axis exists, US profile only authored. The UK vocabulary retires into an UNAUTHORED profile whose statutory fields resolve to explicit unknown, never a silent UK default.

**Why**: D-32 does not merely say US-first; it ends with keeps the data model jurisdiction-parameterized so later international expansion is additive, not a rewrite — which rules out deleting the axis and rules out the labels-only abstraction. Between authoring one profile and two, the sources say most of what a second vocabulary would protect is already written as CAPABILITY-ABSENCE rather than UK text: 16.05.02 no-register edge case, 16.05.07 Q-05, 16.02.03 D-01 and 16.02.01 Claimed state all already author the degraded branch. So the axis is what must be kept; the second vocabulary is not. Follows the precedent D-46 set for the identical class of problem — author the determinate jurisdictions, make every other territory an explicit unknown rather than a guess.

**Preserves**: D-32 both halves (US-first AND jurisdiction-parameterized); 16.05.01 D-05/D-13 statutory-class single-writer rule; 16.05.02 authored degradation branch; 16.02.03 D-01 provenance fallback

**Commits us to**:
- Every place naming a premises licence, PAT, PLI or TEN as THE instrument must be restated against a profile CAPABILITY — in 16.01.06, 16.02.01, 16.02.03 and 16.05.*. Larger prose edit than retaining both profiles.
- 16.05.07 D-08 becomes: where the profile declares a decisive statutory building key, equality proves and inequality refutes. Where it does not, that rule has no input.
- The worked UK example is LOST — if the second market is the UK its vocabulary must be re-derived rather than un-flagged.
- The capability vocabulary (what a profile may declare) is new structure and MUST be kept small, or it grows into a rules engine.
- Live/Events is Phase 2+, so no launch urgency argues against the larger edit.


## DQ-14.2 — Contents of the US launch profile statutory slots

> **Entry**: DQ-14 · **Ratified**: 2026-07-22 · **Decided by**: agent (refuses an unsourced empirical claim — flagged to owner)

**Chosen**: Lock the five slots (occupancy ceiling, liability cover, electrical/fire safety record, performing-rights licence status, hirer requirements) each with an issuer and expiry; DEFER the US instrument names to /create-prd-security

**Why**: The slot set, the issuer requirement, the expiry semantics and the declared-not-verified rule are product decisions and are all decidable now. The instrument names are per-state legal facts that no ideation source contains — a full-tree grep for occupant load, certificate of occupancy and the rest returns nothing — so asserting them here would be an unsourced claim wearing a ratified decision clothes. It is also exactly the class of empirical work D-32 hands to /create-prd-security. Dropping the electrical/fire-safety slot was rejected: it removes a stated role need (the Producer reads PAT status because they are the person plugging in) and saves nothing structurally, since the slot shares the same expiry engine as the other four.

**Preserves**: 16.01.06 D-01 (licences/insurance are declarations with expiry, never platform-verified certificates); 16.01.06 Role Lens dependencies — Musician reads hirer PLI requirement, Producer reads electrical-safety status

**Commits us to**:
- A [PENDING] marker stays live in 16.01.06 through the rest of ideation, re-pointed at /create-prd-security — a LIVE deferral, not an expired one.
- 16.05.01 ingest mapping row for the register class stays provisional until the instrument names land.


## DQ-14.3 — Where external-register availability is modelled

> **Entry**: DQ-14 · **Ratified**: 2026-07-22 · **Decided by**: agent (refuses an unsourced empirical claim — flagged to owner)

**Chosen**: Per-authority capability, resolved per record: the profile names the register CLASS that applies; actual availability resolves per licensing authority for the record address. L2 and D-08 gate on the resolved value; unresolved renders as unknown.

**Why**: The only option that neither asserts an unverified fact about US registers nor pretends registers are uniform within a jurisdiction. It is the granularity 16.05.01 already uses for these same sources (per-authority formats). A per-profile boolean is contradicted by 16.05.01 own source row describing licensing registers as public records with patchy machine access and per-authority formats. Declaring L2 and D-08 unavailable at launch is unsourced — no cited file states the US lacks per-premises public records — and irreversible in the wrong direction, since it would delete the only rule the specs call decisive. NOTE: 16.05.01 D-15 (re-ingest cadence monthly per source per region) does NOT support this option — it sets an ingest cadence, not a per-region coverage model. That gloss was corrected during confirmation.

**Preserves**: 16.05.01 D-05/D-13 (statutory class has exactly one permitted writer; a seeded source may never write a statutory field); 16.05.02 authored no-register degradation; 16.05.07 D-08 decisive-key rule, restated as capability-gated

**Commits us to**:
- A per-authority coverage record must be MAINTAINED — this is new structure, not an existing modelled concept.
- At cold start most authorities will be unresolved, so L2 is unavailable in practice for most records at launch even though it is not deleted.
- 16.05.07 Tier 1 review load is unpredictable until coverage is known, so the operational cost of D-08 absence cannot be sized during ideation.


## DQ-14.4 — Temporary-permission analogue where no per-venue statutory licence exists

> **Entry**: DQ-14 · **Ratified**: 2026-07-22 · **Decided by**: agent (a statutory exception with no statutory source is a contradiction — flagged to owner)

**Chosen**: No statutory temporary permission where there is no statutory condition. The date-range exception type survives unchanged under D-05; curfew and dB limits are Operator claims labelled as claims per D-01.

**Why**: 16.02.03 D-01 already ratifies the provenance outcome, so the only genuinely open part is whether the STATUTORY exception type survives — and it cannot, because a statutory exception with no statutory source is a contradiction. The date-range exception itself survives under D-05 closed vocabulary of exactly three condition types, so nothing is lost mechanically. Mapping a US analogue was rejected: no such instrument is named anywhere in the tree, and choosing it would commission research plus a per-municipality permission model, reopening 16.02.03 Q-03 in the launch market.

**Preserves**: 16.02.03 D-01 (provenance fallback — Operator claims labelled as claims); 16.02.03 D-05 closed vocabulary of exactly three condition types; field machine-resolvability, which 16.07 depends on

**Commits us to**:
- MUST BE WRITTEN EXPLICITLY: 16.06.03 D-22 (the premises licence is a hard ceiling on overrun the Operator cannot lift in the app) has NO INPUT in a licence-less profile. Leaving this unstated leaves D-22 pointing at an unspecified field.
- Resolves 16.02.03 Q-03 (tracking remaining temporary-permission allowance) for the US profile without a separate mechanism.
- ACCEPTED GAP: a real US venue may still be bound by a municipal ordinance the platform now cannot represent as statutory.


## DQ-15.A1 — Item store — read-through from the register, or typed on the 16.04 spec sheet

> **Entry**: DQ-15 · **Ratified**: 2026-07-22

**Chosen**: A1-a — Read-through: 16.04 confirms 15.07 D-01 for rehearsal rooms. Backline items render from 15.07.03 filtered by 15.07.02 condition; 16.04 stops typing an item list.

**Why**: Every mechanism this needs already exists and is exercised twice — both sibling room types (16.02.02 D-06, 16.03.02 D-04/D-05) have already confirmed it locally, and 15.07 D-01 names rehearsal inside its own scope line. The local-list alternative contradicts two ratified 15.07 decisions rather than filling a gap, needs a condition store, fault-reporting surface and permission model that no source defines, and reproduces the exact failure 15.07.03 DT-01 exists to prevent (a duplicated list rots by construction: two stores, two update paths). It also breaks on a venue+rehearsal record, which would hold register-backed backline for one type and typed backline for the other.

**Preserves**: 15.07 D-01 and D-04; 15.07.02 D-01 graded condition; 16.02.02 D-06 One store, two doors inline create path; 16.05.06 post-session correction target

**Commits us to**:
- RECORDED AS A PER-FEATURE CONFIRMATION in the sibling convention — this does NOT close domain-15 Q-07 or 15.07 Q-01, both open and Owner=User.
- UNRESOLVED PRECONDITION: 15.07 publishes ORG registers, and 16.03.02 DT-12 found this structurally excludes supply with no org entity — a sole-trader rehearsal Operator cannot publish at all. Blocks a real population; must be tracked.
- Partly answers 16.04 Q-01 (condition vocabulary between a kit and a shell pack with no snare) by inheriting the graded-with-note model instead of inventing one.


## DQ-15.A2 — Granularity — identity-tracked or quantity-tracked rehearsal backline (= 15.07 Q-03)

> **Entry**: DQ-15 · **Ratified**: 2026-07-22

**Chosen**: A2-a — Quantity-tracked mode for commodity rehearsal stock, with identity-tracking retained per item where the Operator wants it

**Why**: The only option consistent with what two other specs already publish: 15.07.03 commodity edge case and 16.03.02 commodity row both state counts, not identity, and both cite 15.07.01 DT-03 as settled. It is also the option DT-03 itself proposes for this exact room type, rejecting per-object identity for a rehearsal room with 40 mic stands, 200 cables and four interchangeable practice amps. Identity-only would load the highest onboarding cost onto the lowest-value room type, against the finding that ceremony is what kills the rehearsal path.

**Preserves**: 15.07.01 DT-03; 15.07.03 commodity publication row; 16.03.02 commodity row; 16.06.01 D-19 / DT-15 rehearsal speed posture

**Commits us to**:
- COMMISSIONS A MODEL ADDITION INSIDE DOMAIN 15 — 15.07.01 DT-03 calls it a genuine model addition rather than a UI concession. This ratifies work in domain 15, not only domain 16.
- DEGRADES 15.07.02 D-01: per-asset graded condition becomes condition-on-a-count (4 amps, 1 faulty cannot say which one). The condition model now carries two shapes.
- DEGRADES 16.03.02 D-08: a reservation captures its gear dependency from the filter that produced it and notifies when that item goes faulty — on a count, the item you booked for has no referent. Must be respecified for quantity lines.


## DQ-15.A3 — Provision fact — where the commercial/provision posture of rehearsal backline lives

> **Entry**: DQ-15 · **Ratified**: 2026-07-22 · **Decided by**: agent (the alternatives fail against source — flagged to owner)

**Chosen**: A3-a — 16.04 owns a typed per-category provision enum (included | hire-extra | bring-your-own-only | none, with unstated as a distinct non-value); 15 owns the items, 16.06.07 owns the price

**Why**: The only option under which the two facts a rehearsal buyer actually decides on — is a kit included, must we bring one — can be STATED rather than inferred. Inference fails against source in both directions: an empty register renders unstated, not none (16.02.02 States, Read-through unavailable), so bring-your-own-only is unassertable; and included as the absence of a rate line is indistinguishable from an Operator who has not built a rate card. Extending the rate-card feature was rejected because it puts a non-commercial fact (the band must bring a kit) inside the feature whose one absolute rule is that only the Operator sets terms, and a room with no rate card would then have no provision posture at all. This mirrors what the venue sibling already does structurally: 16.02.02 G2 types a provision-model enum HERE while its read-throughs sit beside it.

**Preserves**: 16.02.02 D-05 field-triple model and D-04 unstated as a distinct non-value; 16.03.02 D-05 decomposition (condition to 15.07.02, price to 16.06.07, provision posture to the room spec); 16.06.07 D-03 / 16.05.03 D-03 (only the Operator sets terms)

**Commits us to**:
- ONE EXPLICIT BOUNDARY SENTENCE REQUIRED: 16.06.07 owns the price and the rate-card term; 16.04 owns the provision posture. Without it the two enums overlap.
- Duplication risk at TERM level between 16.04 provision and 16.06.07 inclusion facet — the kind 15.07.03 DT-01 warns about, one level up from items.
- NOTED INCONSISTENCY in the cited precedent: 16.02.02 G7 says backline is Not typed here while its Checkable tier lists backline present y/n as a core field. The precedent is real but the source is not fully self-consistent.


## DQ-16.3 — Can a present-but-stale replica block a scanner from becoming ready

> **Entry**: DQ-16 · **Ratified**: 2026-07-22

**Chosen**: A — Staleness NEVER blocks. Only a missing or incomplete replica blocks. A present, complete replica of any age enters ready; an amber stale state is raised before doors and whenever the device learns inventory changed after its replica timestamp.

**Why**: The only position on the record formed with the opposing numbers in hand: 19.04.01 DT-04 names the staleness threshold in 19.04.02 as its Source and rejects it, so blocking would reverse a Deep Think outcome using an argument the tree does not contain. Its reasoning survives re-reading — because admit-and-reconcile already absorbs the refunded-after-sync case, a stale replica residual error is falsely refusing a ticket issued after sync, and a hard block converts that rare false-refusal into a total one at exactly the venues index D-02 says the sub-domain exists for (an online-only door does not work in the target market at all). The same instinct was independently rejected one sub-domain over: refusing is the loud-offline anti-pattern wearing a safety costume.

**Preserves**: 19.04.01 D-02 admit-and-reconcile; 19.04.01 DT-04; 19.04.01 D-05 (Operator override of a refusal is permitted and recorded); index D-02 (offline-capable is a precondition, not a feature); locked: staleness never turns a scan into a refusal

**Commits us to**:
- 19.04.02 States row Stale (block) and its 120-minute hard threshold are DELETED.
- REMOVES the only forcing function that makes an Operator re-sync — the amber warning is now the sole signal.
- LOSES the bound 19.04.02 D-06 claimed (30/120 keeps the manifest at most ~2h behind money movements). Nothing replaces it.
- NO SOURCE defines any escalation from an ignored amber — flag as a follow-on gap, since refunds after sync are the main source of staleness with money attached.


## DQ-16.4 — Amber stale warning default — 30 or 60 minutes

> **Entry**: DQ-16 · **Ratified**: 2026-07-22 · **Decided by**: agent (reconciles three files by editing one row — flagged to owner)

**Chosen**: 60 minutes

**Why**: 60 is the only number that already appears at BOTH the seam (19.04.01 cross-cut note: the 60-minute staleness warning and no-block-on-stale posture live at this seam) and at domain level (CX-14 Q1: the replica freshness gate, amber at 60 min). Choosing 30 would additionally require correcting the domain CX. Under the never-blocks rule a tighter amber on a fleet that is normally offline risks the desensitisation 19.04.01 DT-03 warns about (an alarming offline indicator trains the Operator to ignore it). 19.04.02 Q-03 survives unchanged as numeric ratification at /create-prd-compile — this axis only fixes which default that stage ratifies.

**Commits us to**:
- ACCEPTED: 19.04.02 reasoned 30 as half of a 30/120 pair; taking 60 alone discards the ratio that pair was reasoned as — but the 120 half is deleted anyway under axis 3.
- Under never-blocks the amber is the ONLY signal the Operator gets, and a longer fuse means a later first warning.


## DQ-16.5 — Scope at which the staleness threshold is overridable

> **Entry**: DQ-16 · **Ratified**: 2026-07-22 · **Decided by**: agent (determined by axis 3 — flagged to owner)

**Chosen**: Per show

**Why**: This axis answer depends on axis 3. Since staleness only ever warns, the thing being scoped is a WARNING whose stake DT-04 explicitly relocates to newly-issued tickets — comp batches, transfers and sales batches, all show-level properties. Per-venue would be correct only if staleness blocked, because a blocking threshold prices connectivity, which is a room property. One scope means one config surface and no precedence rule to define.

**Commits us to**:
- A venue running 200 nights a year must set the same override per show if it wants a non-default threshold — accepted, since the default should fit most shows.
- The venue-default-with-show-override shape was rejected: no source defines a precedence rule between the two scopes, and it runs against 19.04.02 D-05 (the Operator thinks about sync once, before doors).


## DQ-16.6 — Which file authors the reconciled staleness rule

> **Entry**: DQ-16 · **Ratified**: 2026-07-22 · **Decided by**: agent (author-where-owned, already-ratified rule — flagged to owner)

**Chosen**: 19.04.02 authors the staleness rule and thresholds; 19.04.01 reduces its D-06 to a reference plus the scan-side consequence

**Why**: The governing rule is already ratified; only its application was open, and the ownership facts are unambiguous. 19.04.02 owns the object being governed — readiness is gated on replica freshness, and its States table holds every replica state — while 19.04.01 own cross-cut note defers the threshold and posture to that seam. Two independently authored D-06 entries drifting apart is exactly what produced this contradiction.

**Preserves**: author-where-owned (D-50/P-04)

**Commits us to**:
- The authored decision in 19.04.02 will cite a Deep Think entry (DT-04) that lives in a sibling file — acceptable, and preferable to duplicate authorship.
- Removes the duplication that produced this contradiction: exactly one file states the rule.


## DQ-17.1 — Storage shape for a walk-up window admission

> **Entry**: DQ-17 · **Ratified**: 2026-07-22

**Chosen**: A2 — Split with a derived canonical total: `scanned` stays gate-only, window admits get their own stored counter, and the canonical all-bodies total is a DERIVED counter (gate scans net of reversals + window admits net of un-admissions), modelled as `Remaining` already is

**Why**: Both options land the walk-up inside the admissions family, so the choice is purely which body of ratified text gets rewritten. The split preserves 19.05.04 D-01 ("walk-up tickets are admitted at birth, never scanned"), D-11, DT-03, the at-window refund row, the skim edge case and two cross-cut notes VERBATIM, rewriting one cross-cut sentence plus name bindings that axis 2 touches under either option anyway. The merge would rewrite six-plus items and collapse two ratified rules pointing OPPOSITE ways onto one counter. It also applies 19.03.02 DT-02's own test rather than overriding it: DT-02 rejects one counter with a type flag because the parts have different arrival times and different consumers.

**Preserves**: 19.05.04 D-01, D-11, DT-03, at-window refund row, skim edge case; 19.05.01 D-01 (canonical state, not per-consumer computation) — D-01 forbids consumers computing their own count, not derived counters; 19.05.01 D-03 alarm (scanned > paid + comp) operating on a gate-pure counter; 19.03.02 DT-02

**Commits us to**:
- ticketing-box-office-cx.md CX-04 becomes FALSE as written (scanned is no longer settlement admitted number) and must be edited — the domain cross-cut is the later-dated file.
- 19.05.01 counter table grows from six rows to eight.
- The derived total needs a STATED FRESHNESS RULE — it is only as fresh as its stalest input. D-02 does not spell this out for derived counters, though  is the precedent.
- Musician Role Lens (On the night, sees scanned vs paid) must be re-pointed at the derived total or the artist reads a gate-only number.


## DQ-17.2 — Vocabulary for the canonical admissions total

> **Entry**: DQ-17 · **Ratified**: 2026-07-22 · **Decided by**: forced by DQ-17.1 (two distinct quantities cannot share one name)

**Chosen**: Rename the canonical total to `admissions_total` / `admissions_paid`, reserving `scanned` for gate-observed admissions only

**Why**: Under the split storage shape this is forced, not optional: two distinct quantities exist (gate-observed admissions and all admissions) and one name cannot carry both. It also fixes the one place the current text is genuinely load-bearing on the ambiguity — 19.07.03 DT-01 says WeJammin's independently observed count is the door scan, which is no longer the same quantity as a counter including WeJammin's own window sales; keeping one name would let a reconciliation compare a number against a component of itself. The name `scanned` is also literally false for 20-50% of the gate at the beachhead venues (19.05.04 Overview).

**Commits us to**:
- CROSS-DOMAIN EDIT: 17.09.02 D-08 rows 5 and 6 and INV-02/INV-03/INV-04/INV-08 rebind to admissions_paid/admissions_total; 17.11.01 draw record and 19.05.05 statement line likewise.
- CAUTION: 17.09.02 D-08 is itself flagged as not fully settled (Refines D-02 and contradicts 17.11.01 DT-01 — escalated, not unilaterally applied, Q-03). This rename lands on contested text and must not be read as settling Q-03.
- The earlier verified-draw ratification is UNAFFECTED in substance — scanned_paid becomes admissions_paid; the quantity and its role as the verified draw are unchanged, only the name binds correctly.
- CX-04, the domain most-cited count sentence, is edited.
- 19.07.04 door floor is restated so it compares against the GATE count, which is what DT-01 means by independently observed.


## DQ-17.3 — Refund semantics for the canonical admissions total

> **Entry**: DQ-17 · **Ratified**: 2026-07-22

**Chosen**: Exit-scoped — an at-window un-admission reduces the total; a post-scan online refund does not

**Why**: The only option leaving both ratified statements standing. 19.05.04 D-11/DT-03 apply to the walk-up refunded at the window minutes later, who either never entered or has left — leaving the admission stale over-states occupancy for capacity, the statement, and the split. 19.05.01 rule applies to a scanned advance ticket refunded online, because that person is in the room. Keeps the safety number honest in both directions. Its one weakness — becoming a forgettable conditional — existed only under the merge option and disappears under the split, where the two stored counters compose the correct answer with no rule to apply.

**Preserves**: 19.05.04 D-11 and DT-03; 19.05.01 refund edge case (a post-scan refund does not reduce the gate count); 19.05.04 skim signal (depends on the count tracking actual bodies)

**Commits us to**:
- The exit-scoped distinction MUST BE WRITTEN DOWN EXPLICITLY — today it is implicit in two files that never reference each other on this point.
- No conditional rule is needed at runtime: the two stored counters compose.


## DQ-19.1 — Granularity — where the NYP split basis rule lives

> **Entry**: DQ-19 · **Ratified**: 2026-07-22

**Chosen**: D — Platform-wide constant. No basis field on any record; the platform states one rule as a term of service, printed on the split-capture screen beside the percentages.

**Why**: Per-listing was disqualified rather than merely weaker: the locked disclosure axis requires the basis be shown before the split is agreed, and 20.04.04 own happy path agrees the split a year before the listing exists, so a listing-time field cannot satisfy it — and the per-listing payee consent flow that would rescue it exists in no file (CX-02 provides notification, not consent). That left the constant versus a domain 09 field, and the deciding fact is that domain 09 defines NO payout-basis field anywhere (verified by grep), so that option is both new machinery and, as currently written in 20.04.04 cross-cut note, a P-04 violation — domain 20 authoring a domain 09 property. The constant satisfies disclosure by construction and spends nothing on 09.02.01 absolute design budget.

**Preserves**: locked: domain 09 owns the split percentages and the payout-plan source; locked: the payee must be told the basis before the split is agreed; 09.02.01 design budget (<=8 interactions, <=90s for 4 contributors); 20.04.01 D-06 / 20.04.04 DT-02 no-rights-record listing path

**Commits us to**:
- NO per-record variation is possible without reopening this decision — a charity listing on ask, or a one-off arrangement, cannot be expressed.
- CONTRADICTS how both authors modelled it: 20.04.03 D-07 (captured and locked at listing) and 20.04.04 (a field on the split agreement) are both replaced.
- The no-rights-record case dissolves for free: a lister taking 100% with no split agreement has nowhere to put a per-agreement field, and needs none.
- Concentrates a money rule in platform terms rather than in an agreement each payee signed — a weaker consent artefact if a payee later disputes.


## DQ-19.2 — Lock trigger — when the basis stops being changeable

> **Entry**: DQ-19 · **Ratified**: 2026-07-22 · **Decided by**: determined by DQ-19.1 (coherent partner of the platform-wide constant)

**Chosen**: L4 — Platform terms-change policy: no per-record lock because there is no per-record field. The constant is fixed at launch; any change is versioned as a platform term, applies only to splits agreed after the change date, and existing agreements keep the version live when they were agreed.

**Why**: This axis was explicitly conditional on granularity. It is the only option that keeps the locked disclosure axis intact ACROSS a change — no payee is ever paid on a rule they were not shown — while adding just one versioned record. It keeps a single lock model, the same version-live-when-agreed shape 20.04.01 D-02 already uses for the plan, and avoids the structural complaint that sinks the first-sale lock: a lock trigger private to one field on an object where every other field binds at settlement.

**Commits us to**:
- NEW SPECIFICATION WORK, small but real: a versioned platform-terms record. This is why the constant is the cheapest option and not a free one.
- The payout engine must resolve a TERMS VERSION per agreement date — a second version dimension alongside the plan version.
- Both D-07 lock clauses (locked at listing; immutable after first sale) are REPLACED rather than preserved.


## DQ-19.3 — The value itself — ask, paid, or paid-net

> **Entry**: DQ-19 · **Ratified**: 2026-07-22

**Chosen**: paid-net — the amount the fan actually paid, net of platform cut and processor fees

**Why**: Already the specified default (20.04.04 D-07) with its arithmetic and statement line worked through, and the only value consistent with the fan-facing claim the storefront makes: DT-04 promise is that the over-payment was shared with the people who made the record. Gross-paid would make the lister carry 100% of the platform cut and processor fees on behalf of every other payee, worsening with each additional payee, and on a low-margin sale the percentages could exceed what the platform actually collected. Ask-basis directly contradicts the fan-facing promise, makes the NYP over-payment invisible to every payee except the lister, and incentivises a zero floor — colliding with the co-owner-consent gate 20.04.03 already had to build for exactly that.

**Preserves**: 20.04.04 D-07 default value; 20.04.04 DT-04 fan-facing promise; 20.04.03 co-owner consent gate on low floors; 20.05.03 D-03 tips-attach-to-the-person (untouched — tips remain outside splits)

**Commits us to**:
- A payee effective take moves with fee structures: if the platform cut or processor rates change, so does the basis. Couples this to the platform-cut decision in the 20.04 index.
- CLOSES Q-01 in BOTH 20.04.03 and 20.04.04 — both were owner-assigned and deferred to a stage that has already run.
- Worked arithmetic stands as written in 20.04.04 happy path and statement line.


## DQ-20.1 — What input determines the coverage verification-strength badge

> **Entry**: DQ-20 · **Ratified**: 2026-07-22

**Chosen**: A — Artefact class plus retrievability determines strength; pitch provenance NEVER affects it. A fixed, live, retrievable article renders verified whether or not a pitch produced it.

**Why**: 21.07 owns the verification taxonomy, and the contradicting file says so itself: CX-05 synthesis Q1 states the strength is owned by 21.07 and is not an independent copy of the verdict — which makes the provenance gloss three paragraphs above it a non-owning duplicate rather than a competing ruling. On the text, 21.07 Verified trigger contains no pitch condition, D-03 declares parentless coverage fully valid (often the best coverage there is), and D-04 commits verification to a LINK act (we verify the link, not the reading), which is performable on any URL regardless of provenance. The alternative would demote the domain own stated best case and systematically disadvantage the artists with the strongest real press, since unsolicited coverage is by definition unpitched.

**Preserves**: 21.07 D-03 and the Organic state; 21.07 D-04 (we verify the link, not the reading); 21.07 D-05 / DT-03 and Q-03 (already resolved — not reopened); 21.07 Decayed state and the link-rot edge case

**Commits us to**:
- OVERRULES the later, deeper file: promotion-marketing-cx.md is [DEEP] (2026-07-18) while 21.07 is [PARTIAL] (2026-07-17). Ratified deliberately on ownership, not recency.
- EDITS ratified [DEEP] CX prose in TWO places (CX-05 Relationship paragraph and CX-08 synthesis Q3) — a correction of existing text, not an additive change.
- WEAKENS what the badge proves about WeJammin specifically: index D-02 rests the domain existence on it sent the pitch, it holds the link. That defensibility claim must be re-founded on the link-verification act rather than on provenance.
- A self-logged organic item is chosen entirely by the artist (their URL, their pull-quote), so the platform observed less of the chain than for a pitched item — accepted, and mitigated only by the retrievability check.


## DQ-20.3 — Whether pitched-vs-organic renders publicly on the EPK

> **Entry**: DQ-20 · **Ratified**: 2026-07-22

**Chosen**: 3-A — Provenance stays a log state. Attributed/Organic remains a record state visible to the Musician and driving the CRM flip and directory denominator; the EPK renders ONE strength badge per item and nothing about sourcing.

**Why**: The compound-label option is the only one in this entry requiring spec no source has written — no provenance vocabulary, no compound-label layout — and it would land that new surface on 21.09, which is [PARTIAL] with [PENDING] pin/retention mechanics and an unresolved leak-control question. The fact it would render is already captured as the Attributed/Organic state, so nothing is lost by deferring, and if the owner wants it later it is ADDITIVE to this choice, whereas unwinding a compound badge is not. A single label also matches 21.07 stated reason for badges at all: nobody checks, because checking is tedious.

**Preserves**: 21.07 Attributed / Organic states; 21.09 badge surface left unchanged while [PARTIAL]; 21.07 rationale for single-label badges

**Commits us to**:
- ACCEPTED: the journalist reading the EPK cannot distinguish a platform-observed capture from an artist-self-logged one — exactly the distinction index D-02 leans on.
- If provenance rendering is wanted later it is a new spec change on 21.09, designed additively rather than retrofitted.
- Kept as its own axis deliberately, so the badge-input decision did not silently decide the EPK surface.

