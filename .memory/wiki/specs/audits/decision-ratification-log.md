# Blocking Decision Queue — Ratification Log

> Owner decisions on the 57 open sub-decisions from `blocking-decision-queue.md`.

**Ratified: 35 / 57**

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
| DQ-11 | 12 Release & Distribution | 5 — DQ-11.A2, DQ-11.A3, DQ-11.A4, DQ-11.A6, DQ-11.A7 |
| DQ-12 | 13 Gear Marketplace | 3 — DQ-12.O1, DQ-12.O2, DQ-12.O3 |

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

