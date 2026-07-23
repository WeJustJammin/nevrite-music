# Credits & Attribution — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Credits & Attribution](./credits-attribution-index.md)
> **Status**: [DEEP] — children deepened (Step 5); intra-domain cross-cuts synthesised with rollback, race, and per-field permission detail.
> **Last updated**: 2026-07-23

## Cross-Cut Map

> Rolled to child level. The children are four sub-domains (`02.01`–`02.04`) and six features
> (`02.05`–`02.10`). Feature-to-feature notes inside a sub-domain live in that sub-domain's own CX
> file; this file records only edges that cross a child boundary.

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | [02.01 Credit Graph & Discography](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) | The close prompt commits working session data into immutable credit records; the commit is the mutable→fact boundary, and visibility intent (incl. permanent ghosting) is captured *at* the contribution | Musician, Producer, Operator | High | 02.02.03→02.01.01; 02.02.02→02.01.05 (D-12/DT-07); 02.01.01 happy path |
| CX-02 | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | [02.04 Attestation & Confidence](./02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md) | The in-room tap at close *is* the attestation — same act, best conversion moment; the log also supplies asserter identity + assertion timing, tier inputs that exist nowhere else | Musician, Producer, Operator | High | 02.04.01 DT-03; 02.02.03 D-01; 02.02.02→02.04.02 (DT-04, DT-10) |
| CX-03 | [02.03 Claiming & Seeding](./02.03-claiming-cold-start-seeding/02.03-claiming-cold-start-seeding-index.md) | [02.04 Attestation & Confidence](./02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md) | Imported credits are permanently tier-capped; claiming verifies the *person*, never the *fact* | Musician, Producer, Operator | High | 02.03 D-01; 02.03.02 D-01 |
| CX-04 | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | [02.03 Claiming & Seeding](./02.03-claiming-cold-start-seeding/02.03-claiming-cold-start-seeding-index.md) | Roll call creates unclaimed shells; the claim inbox is where they become users — the growth loop's two halves, joined by a broken notification channel | Musician, Producer | High | 02.02.01 DT-03; 02.02.01→02.03.02; 02.03.02 DT-01 |
| CX-05 | [02.04 Attestation & Confidence](./02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md) | [02.01 Credit Graph & Discography](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) | The tier renders per discography line (viewer-relative) and weights every traversal edge; unweighted traversal is the laundering exploit | All four | High | 02.01.02→02.04.02; 02.01.03 D-01; 02.04.02 DT-01, DT-03 |
| CX-06 | [02.06 Taxonomy](./02.06-credit-role-instrument-taxonomy.md) | [02.01 Credit Graph & Discography](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) | Every credit's role is a foreign key into the vocabulary; the discography groups on the FAMILY tier and traversal reasons over the hierarchy | All four | High | 02.01.01 D-01; 02.01.02→02.06 (D-07, hard structural req) |
| CX-07 | [02.06 Taxonomy](./02.06-credit-role-instrument-taxonomy.md) + [02.01 Graph](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) | [02.08 Export & DDEX RIN](./02.08-credit-export-ddex-rin.md) | Exact role codes, resolved identifiers, and a stable display sequence are hard preconditions for a valid RIN — emission's cost is entirely upstream | Musician, Producer, Operator | High | 02.08 DT-02; 02.01.01→RIN (D-12 display sequence) |
| CX-08 | [02.01 Credit Graph & Discography](./02.01-credit-graph-discography/02.01.06-credit-correction-amendment.md) (Amendment) | [02.05 Dispute Resolution](./02.05-credit-dispute-resolution.md) | Failed agreement on an amendment auto-escalates into a dispute, carrying the proposal as opening evidence — one continuum, two social framings | Musician, Producer | High | 02.01.06 D-02, DT-01 |
| CX-09 | [02.05 Dispute Resolution](./02.05-credit-dispute-resolution.md) | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | Captured evidence is what makes a dispute *cheap*; without a roll there are no witnesses and the platform reconstructs like everyone else | Musician, Producer, Operator | High | 02.05 DT-02; 02.02.01 (witness eligibility) |
| CX-10 | [02.01 Graph](./02.01-credit-graph-discography/02.01.05-credit-visibility-embargo.md) (Embargo) | [02.08 Export & DDEX RIN](./02.08-credit-export-ddex-rin.md) | Export bypasses the discography page entirely — a live leak path; participant-scoped export may carry embargoed credits, catalog-scoped export must exclude and say so | Producer, Musician, Operator | High | 02.01.05 DT-02; 02.01.05→02.08; 02.08 D-03 |
| CX-11 | [02.09 Gear Linkage](./02.09-gear-credit-linkage.md) | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | Gear attaches at contribution granularity ("SM7B on this vocal") so it exists only at tracking time — and must never enter the tap path | Musician, Producer, Operator | High | 02.09 D-01, D-02, DT-02; 02.02.02→02.09 |
| CX-12 | [02.10 AI Disclosure](./02.10-ai-contribution-disclosure.md) | [02.06 Taxonomy](./02.06-credit-role-instrument-taxonomy.md) | Deliberately orthogonal — disclosure is an axis on the contribution, never a role | Musician, Producer, Fan | High | 02.10 DT-01, D-01 |
| CX-13 | [02.03 Claiming & Seeding](./02.03-claiming-cold-start-seeding/02.03-claiming-cold-start-seeding-index.md) | [02.01 Graph](./02.01-credit-graph-discography/02.01.04-identifier-resolution-duplicate-merge.md) (Resolution & Merge) | Import is the source of essentially all duplication; claim and merge are one act from the user's side, and a merge chain A→B→C must 301 in a single hop | Musician, Producer, Operator | High | 02.01.04 behavior; 02.01.02→02.01.04; 02.03.01 behavior |
| CX-14 | [02.10 AI Disclosure](./02.10-ai-contribution-disclosure.md) | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | The AI-disclosure axis is captured on the contribution row, but ownership of that field is *split*: the Producer owns the attribution, the named contributor owns its AI axis | Musician, Producer | High | 02.02.02→02.10 (D-04); per-field permission model |
| CX-15 | [02.06 Taxonomy](./02.06-credit-role-instrument-taxonomy.md) | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | Capture is where role and instrument bind as separate axes; pending aliases are accepted and never block, and the taxonomy must express *doubling* (one party, two instruments, one date) because it is a payment-relevant fact | Musician, Producer | High | 02.02.02→02.06 (D-02, D-03); 02.02.01→02.06 (DT-05 doubling) |
| CX-16 | [02.05 Dispute Resolution](./02.05-credit-dispute-resolution.md) | [02.01 Credit Graph & Discography](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) | "Contested" is a state of the *record*: a filed dispute produces no public page state, and contest marks/zero-weights a credit but never suppresses it. **The same rule now governs a claim contest** (`02.03.03` D-03 corrected), where the credit additionally stays attached to the first claimant until the contest closes | Musician, Producer, Fan | High | 02.01.02→02.05 (D-06); 02.01.01→contested (D-11); 02.03.03 D-03/D-05 |
| CX-17 | [02.07 Union Reporting](./02.07-union-performer-session-reporting.md) | [02.02 Session Capture](./02.02-session-capture/02.02.01-session-roll-call.md) (Roll Call) | Union filings are paid by the hour — the temporal roll (personnel, instruments, doubles, window) *is* their billable substance | Musician, Producer | Medium | 02.07 DT-02; 02.02.01→02.07 (D-14) |
| CX-18 | [02.04.04 Ring Detection](./02.04-attestation-credit-confidence/02.04.04-attestation-ring-collusion-detection.md) | [02.05 Dispute Resolution](./02.05-credit-dispute-resolution.md) | `CollusionEvidenceConstraintV1` supplies `contractVersion`, opaque `attestationEdgeId`, per-attestation-edge `negativeMultiplier`, and `requiresNonTopologicalCorroboration: true`; topology never identifies a party, hard-excludes testimony, or opens/advances a case | None (internal only) | High | CQ-03 Option B; 02.04.04 D-07; 02.05 D-06 |
| CX-19 | [02.01 Graph](./02.01-credit-graph-discography/02.01.05-credit-visibility-embargo.md) (Embargo) | [02.05 Dispute Resolution](./02.05-credit-dispute-resolution.md) | A Producer's objection to an evidence-based lift is a **stated-ground challenge, not a veto**: closed ground list over `02.01.05` D-03's own predicate, lift paused at the embargoed status quo, inline platform re-verification first, then the dispute engine under a **mandatory** resolution SLA; re-submission of evidence is unbounded | Musician, Producer | High | DQ-03 A2–A5; 02.01.05 D-19–D-22; 02.05 D-07 |
| CX-20 | [02.04 Attestation & Confidence](./02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md) | [02.01 Graph](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) + [02.08 Export & DDEX RIN](./02.08-credit-export-ddex-rin.md) | **Demotion is score-only and the rung is invariant to detection**, so the discography label never moves, every rung-gated consumer reads one rung, and demotion **drops off** `02.08`'s re-emission staleness trigger | None (invisible) | High | DQ-06.1/06.2; 02.04.02 D-19/D-20; 02.04.04 D-08/D-09; 02.08 D-05 |
| CX-21 | [02.06 Taxonomy](./02.06-credit-role-instrument-taxonomy.md) + [02.01 Graph](./02.01-credit-graph-discography/02.01.06-credit-correction-amendment.md) (Amendment) | [02.04 Attestation & Confidence](./02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md) | Materiality is **one flat identity test** (party, role, work) owned by `02.04.01` D-10; instrument changes never invalidate, and **no taxonomy operation ever invalidates** — including the one retroactive pending-alias mapping | Musician, Producer | High | DQ-05.1/05.2; 02.04.01 D-10; 02.04.02 D-17/D-18; 02.06 D-23/D-24 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Session Capture ↔ Credit Graph

**Relationship**: Capture is the graph's reason to exist and its highest-tier writer. The close prompt (`02.02.03`) reconciles the roll (`02.02.01`) and the log (`02.02.02`) and commits them as credit records (`02.01.01`) — that commit is the boundary between working data (mutable, session-scoped, nobody's business) and facts (superseded-not-edited, public-per-embargo, disputable). Step 5 sharpened one thing the breadth pass missed: **visibility intent is captured at the contribution, not bolted on after** — `02.02.02` D-12/DT-07 carries permanent non-publication for ghost work into `02.01.05`, which must therefore hold *two* kinds of suppression (time-bound embargo and unbounded ghosting) or the ghost producer cannot use the log at all.

**Role scoping**:
- **Producer**: writes both sides — the working data and, via the prompt, the facts.
- **Musician**: config on their own rows in both; the tap that crosses the boundary is theirs.
- **Operator**: sees the roll (opt-in) and the room's own credit row; sees nothing of the log.
- **Fan**: sees only the published projection, long after and only past embargo.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Session working data is `02.02`'s (and possibly domain 07's — Q-03 is unresolved and is the worst available structural error here). Credit records are `02.01`'s. The commit *transfers authority* rather than sharing it; nothing writes both. The log freezes at commit (`02.02.02` D-13) and everything after is an amendment.
2. **Trigger chain + rollback + sync/async**: Wrap → prompt → commit → credits exist → embargo/ghost evaluated → discography + traversal update (async, derived-on-read). A skipped prompt still commits at producer-asserted tier (`02.02.03` D-02) — the chain degrades, never simply stops. Failure of the async projection does not roll back the commit; the record is authoritative and the projection re-derives.
3. **Permission intersection**: Yes. Roll membership gates who *can* be credited; Producer-owns-the-roll gates who may assert about others; the visibility axis set at capture gates who may later *see* the committed record.
4. **Notification fan-out**: The commit notifies every credited *user*. Non-users have no channel (CX-04) — the loop's known break. Embargoed and ghosted rows suppress their own lift/claim notifications until the release event.
5. **State-transition race**: Late roll/log edits after commit must route to `02.01.06` (amendment), never back into the session. Removing a roll party whose contributions are already confirmed crosses the freeze line mid-gesture and becomes a retraction, not a delete. If both paths stayed open the two records would diverge silently.

---

### CX-02: Session Capture ↔ Attestation & Confidence

**Relationship**: The domain's central economic fact. `02.04.01` DT-03 establishes that the in-room tap and the async chase are **the same feature** with radically different conversion; `02.02.03` D-01 fires the prompt while people are physically present *because* of that gap. Step 5 added the tier-input dependency that makes the log irreplaceable: the log is the only supplier of **who asserted each contribution** (DT-04 — a Producer attributing themselves is a self-claim, not a broker assertion) and **when they asserted it relative to the session** (DT-10 — contemporaneous vs reconstructed). The corollary stays uncomfortable: **if the wrap signal is unreliable (`02.02` Q-02 — no DAW plugin), the prompt mistimes, the taps do not happen in the room, and the domain degrades to Sound Credit, which already failed.** The plugin question *is* the wedge.

**Role scoping**:
- **Musician**: the tap — one act, worth more in the room than a week later.
- **Producer**: assertion plus trust-broker weight; but self-authored rows carry no broker weight (`02.02.01` D-07).
- **Operator**: room facts only (`02.04.01` D-05); "witnessed on my phone" (`02.02.03` D-12) scores below producer-asserted until ratified.
- **Fan**: never attests; sees a simplified label.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Capture *asserts*; attestation *confirms*. These are separate records on one credit and must never collapse into one field, or a Producer's self-assertion becomes indistinguishable from corroboration. The log owns assertion + authorship; `02.04` owns confirmation and the derived tier.
2. **Trigger chain + rollback + sync/async**: Prompt → tap → attestation → tier re-derives → discography changes (async). Non-tap is not a failure; it is the modal async path. A withdrawn attestation re-derives the tier downward with no rollback of the underlying credit (CX-05).
3. **Permission intersection**: Yes — you may only attest what you were positioned to know, and that positioning comes from the roll (`02.02.01`).
4. **Notification fan-out**: Present contributors get the in-room buzz; absent ones get the async request at materially worse conversion. Do not double-send when the same moment triggers a marketplace payment release (cross-domain 05).
5. **State-transition race**: Simultaneous taps at close all trigger re-derivation; the tier must settle once, not flicker per tap. Room-mode "witnessed" confirmations must not be silently scored as attestation before ratification.

---

### CX-03: Claiming & Seeding ↔ Attestation & Confidence

**Relationship**: Imported and reconstructed credits are permanently tier-capped: claiming binds the *person* to the record, but it does nothing to verify the underlying *fact*, because there was no session behind an import (`02.03` D-01, `02.03.02` D-01). This is the load-bearing distinction that keeps the tier honest — without it, importing Discogs would manufacture a graph of "verified" credits nobody attested.

**Role scoping**:
- **Musician / Producer**: claim their imported catalogue; the claim populates a page but does not raise fact-tier.
- **Operator**: claims the room's imported catalogue, duplicate-prone.
- **Fan**: no claiming.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The imported credit is `02.03`'s until claimed, then it is a first-class `02.01` record still bearing an import-provenance cap owned by `02.04.02`. Claim and merge union evidence but never lift the cap.
2. **Trigger chain + rollback + sync/async**: Import → shell + capped credit → claim binds identity → tier re-derives *within the cap* → page updates. A later contemporaneous attestation can exceed the cap only if a real session record appears; otherwise the cap holds.
3. **Permission intersection**: Claiming an identity grants edit on its records but not the authority to self-attest them above import tier.
4. **Notification fan-out**: Suggested-claim notifications depend on a reachable channel — the same broken loop as CX-04.
5. **State-transition race**: A record being claimed while new import batches add credits to the same shell — the claim must absorb late arrivals rather than freezing contents at claim time.

---

### CX-04: Session Capture ↔ Claiming & Seeding

**Relationship**: The platform's only self-reinforcing loop, and its known break. Every session names 3–8 professionals; most are not users; each becomes an unclaimed shell with real work on a real page (`02.02.01` DT-03). Capture → page → claim → the claimant captures their own sessions → more shells. **The break: a shell has no notification channel** (`02.03.02` DT-01, domain Q-05). The actual invitation is the Producer saying "you're on WeJammin, go claim it" — a *social* act the platform can prompt but never perform.

**Role scoping**:
- **Producer**: creates the most shells and is the only viable invitation channel.
- **Musician**: the shell's subject; arrives to a populated page — the best onboarding available.
- **Operator**: room shells, especially duplicate-prone from imports.
- **Fan**: no shells, no claiming.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Shells are identity objects (domain 01) created by capture and import. Two sessions naming the same non-user must converge on one shell (via `02.01.04`), or the human gets two inboxes and neither is complete. Freehand names must never silently bind to an existing party (`02.02.01` D-15) — silent binding is the impersonation vector.
2. **Trigger chain + rollback + sync/async**: Roll entry for a non-user → shell → credits attach → inbox waits → **no notification fires** → the human must arrive by another route. There is no rollback because nothing completes.
3. **Permission intersection**: A Producer's roll entry creates a public-ish record about a third party who never consented (`02.02.01` Q-02, `02.03.02` Q-02) — the domain's sharpest consent tension.
4. **Notification fan-out**: The gap itself. Embargo forbids even the invitation while a work is confidential (`02.01.05` D-15) — "come claim your credit on <unreleased album>" is a breach.
5. **State-transition race**: A shell claimed while new credits are added — the claim absorbs late arrivals rather than fixing contents at claim time.

---

### CX-05: Attestation & Confidence ↔ Credit Graph

**Relationship**: The tier is not a label on the graph — it is the graph's ranking function. It renders per discography line (`02.01.02` D-02) and weights every traversal edge (`02.01.03` D-01). The second is the one that bites: unweighted traversal lets anyone manufacture proximity to any famous party with one self-asserted credit — the laundering attack in `personas.md`'s Musician anti-persona. Step 5 added two hard facts. **Derivation is on-read** (`02.04.02` DT-01) and the discography is the fan-scale read surface — the two most expensive properties in the product land on one page, a live constraint on the locked Supabase decision. And **the rendered count is viewer-relative** (`02.01.02` D-09): an owner header may read 1,847 where a Fan header reads 1,203 on the same page, because a count that includes suppressed rows leaks their existence.

**Role scoping**:
- **Musician / Producer / Operator**: read tiers, cannot set them; see what would raise them.
- **Fan**: simplified label only (`02.04.02` D-04); the distinction matters to them, the vocabulary must not — and their count excludes suppressed rows.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Attestations are the attesters'; the tier derives; the graph consumes. Derivation must be reproducible or two reads disagree. The tier is never stamped onto the record (domain D-09).
2. **Trigger chain + rollback + sync/async**: Evidence change → re-derive → discography label + traversal weight → any cached projection invalidates. Derived-on-read means there is nothing to roll back — the next read is correct by construction.
3. **Permission intersection**: Who may attest bounds the reachable tier for a given credit; the viewer's relationship bounds which rows and counts they see.
4. **Notification fan-out**: Rung *rises* notify (good news, page got stronger). Rung *drops* notify — and the only causes of a rung drop are retraction (`02.04.03`) and amendment invalidation (`02.04.01` D-10). **Ring demotion notifies nothing because it changes nothing visible**: it is score-only and the rung is invariant to detection (`02.04.02` D-19). What was a deliberate, sharp-edged notification inconsistency is now silence by construction — there is no user-visible value a demotion could be described as having changed.
5. **State-transition race**: Concurrent attestation/retraction on one credit both trigger re-derivation; on-read derivation makes the settled value order-independent, but a maintained-on-write cache would risk staleness — `/create-prd-architecture`'s call.

---

### CX-06: Taxonomy ↔ Credit Graph

**Relationship**: Every credit's role is a foreign key into the vocabulary (`02.01.01` D-01) — never free text. Step 5 upgraded this to a hard structural requirement: the discography **groups on the FAMILY tier and renders the leaf role per line** (`02.01.02` D-07), so `02.06` must expose a stable family/leaf hierarchy where every leaf has exactly one family. A flat vocabulary makes the discography ungroupable. Traversal (`02.01.03`) reasons over the same hierarchy.

**Role scoping**:
- **All four** read role labels; **Fan** sees plain labels with no codes.
- **Musician / Producer / Operator** pick roles and request additions; a pending alias never blocks a live record (`02.06` D-03).

**Synthesis questions answered**:
1. **Shared-state owner + merge**: `02.06` owns the vocabulary; `02.01` holds foreign keys into it. A record can be live with a role the vocabulary does not yet canonically hold (pending alias) — the key resolves once the alias is ratified.
2. **Trigger chain + rollback + sync/async**: Role pick at capture → FK stored → discography groups by family, renders leaf → traversal weights by role. Vocabulary edits re-render labels but never rewrite stored keys.
3. **Permission intersection**: Requesting a new role is not the same as minting one; ratification is the taxonomy's, not the crediter's.
4. **Notification fan-out**: Alias ratification can notify the requester; otherwise silent.
5. **State-transition race**: A leaf reparented in the family tree while a discography page is cached — re-render on the version bump; keys are stable so no record is invalidated.

---

### CX-07: Taxonomy + Graph ↔ Export & DDEX RIN

**Relationship**: A valid RIN needs exact role codes (`02.06`), resolved canonical identifiers (`02.01.04`), and — Step 5 addition — a **stable display sequence** (`02.01.01` D-12). An unordered ledger cannot emit a valid RIN. Emission's entire cost is upstream: the export is cheap once the graph and taxonomy are correct.

**Role scoping**: Musician/Producer/Operator export their own scope; Fan never exports.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Export reads a frozen projection; role codes are `02.06`'s, identifiers `02.01.04`'s, sequence `02.01.01`'s. Export owns none of them.
2. **Trigger chain + rollback + sync/async**: Resolve identifiers → map roles to codes → order → emit. A missing code or unresolved ID *blocks* emission rather than emitting an invalid message — the RIN spec is unforgiving.
3. **Permission intersection**: Export scope (participant vs catalog) determines which credits are eligible; embargo intersects here (CX-10).
4. **Notification fan-out**: None to third parties; delivery status logs to the integrations surface.
5. **State-transition race**: Post-export mutation (amendment, retraction, `02.01.01` D-09's comped-out qualifier) leaves consumers holding stale RINs — the unresolved re-emission problem (domain Q-08). **Ring demotion has dropped off that list**: it is score-only and moves no rung (`02.04.02` D-19/D-20), so it changes nothing an emitted package carries and stales nothing (`02.08` D-05).

---

### CX-08: Amendment ↔ Dispute Resolution

**Relationship**: `02.01.06` amendment and `02.05` dispute are one continuum with two social framings. A proposed amendment that fails to reach agreement auto-escalates into a dispute, carrying the proposal as opening evidence (`02.01.06` D-02, DT-01). Removing a comped-out contributor's credit (D-09) changes the party set and is closer to dispute territory than to routine amendment.

**Role scoping**: Musician/Producer file and respond; Operator corroborates room facts only; Fan absent.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The credit is `02.01`'s; amendment proposes a supersession, dispute holds it. On escalation the proposal becomes evidence, not a competing writer.
2. **Trigger chain + rollback + sync/async**: Amendment proposed → agreement sought → on failure, escalate to dispute (sync handoff). No rollback — the failed proposal is retained as the dispute's opening record.
3. **Permission intersection**: Amendment needs attesters' agreement; dispute widens the participant set to roll-derived witnesses.
4. **Notification fan-out**: Amendment notifies attesters; escalation notifies dispute parties.
5. **State-transition race**: An amendment in flight when a dispute is filed — the dispute absorbs the amendment as evidence (`02.01` CX-03 Q5); the two never resolve independently.

---

### CX-09: Dispute Resolution ↔ Session Capture

**Relationship**: The domain's honest claim, stated precisely. `02.05` DT-02 rejects "the platform determines who is right" and replaces it with **disputes about captured work are cheap, because the record already exists**. For a captured session, resolution is closer to reading a contemporaneous record than to weighing testimony; for imported/reconstructed credits, the platform is exactly where `problem-statement.md` blames the industry — asking people to remember, years later.

**Role scoping**: Producer is the most valuable participant in a dispute they did not raise (they ran the room); Musician files and responds; Operator gives narrow corroboration; Fan absent.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The dispute holds the credit (`02.05` D-02); capture data is read-only evidence by then. Contest marks and zero-weights but never suppresses (CX-16).
2. **Trigger chain + rollback + sync/async**: Dispute → show the record → most captured-session disputes end here → witnesses → adjudication → legal (out of scope). No rollback of the credit; the outcome is an amendment or removal.
3. **Permission intersection**: Witness eligibility comes from the roll (`02.02.01`); witness requests may not rest on `inferred` or `conflicted` interval endpoints (`02.02.01` D-08/D-11) — the system's own guess cannot be fed back as evidence.
4. **Notification fan-out**: Parties and, at the witness rung, co-present parties. Witness requests are not votes (`02.05` D-05).
5. **State-transition race**: A dispute racing an amendment on the same credit — the dispute wins and absorbs the amendment (CX-08).

---

### CX-10: Embargo ↔ Export & DDEX RIN

**Relationship**: Export bypasses the discography page entirely (`02.08` D-03) and is a live leak path for unreleased work. Step 5 resolved the pending scope question: **participant-scoped export may include embargoed credits; catalog-scoped export excludes them and states the exclusion explicitly** (`02.01.05`→`02.08`). No embargoed credit enters any automated outbound message.

**Role scoping**: Producer/Musician/Operator export within their scope; Fan never exports.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Embargo state is `02.01.05`'s and travels with the credit, never the party (`02.01.05` D-17). Export reads it; it cannot override it.
2. **Trigger chain + rollback + sync/async**: Export request → scope check → embargo filter → emit. An embargoed credit in catalog scope is filtered, not emitted; the exclusion is declared so the recipient knows the export is partial.
3. **Permission intersection**: Scope (participant vs catalog) is the permission that decides whether embargoed rows are eligible at all.
4. **Notification fan-out**: None outbound; the export itself is the risk surface.
5. **State-transition race**: A lift racing an export — a credit embargoed at request time stays excluded from that export even if it lifts mid-run; the next export includes it.

---

### CX-11: Gear Linkage ↔ Session Capture

**Relationship**: Gear attaches at contribution granularity ("SM7B on this vocal"), so it can only be captured at tracking time (`02.09` D-01) — and it must cost the capture flow nothing, never entering the tap path (`02.09` D-02, DT-02). It is a low-priority enrichment riding a high-priority surface.

**Role scoping**: Musician/Producer attach gear to their own contributions; Operator configures the room's gear; Fan reads.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The gear link is `02.09`'s, attached to a `02.02.02` contribution row. One write can be simultaneously a contribution and a delivered-artifact event (`02.02.02` D-14 / `02.02.04`).
2. **Trigger chain + rollback + sync/async**: Contribution logged → optional gear attach (async, off the tap path). Failure to attach gear never blocks the credit.
3. **Permission intersection**: Whoever owns the contribution row owns its gear link; gear does not open a new permission surface.
4. **Notification fan-out**: None — gear is not attested and nobody counter-signs a mic choice (R-01).
5. **State-transition race**: Gear edited after commit is a benign amendment; it carries no tier weight so it cannot race the tier.

---

### CX-12: AI Disclosure ↔ Taxonomy

**Relationship**: Deliberately orthogonal. Disclosure records *what tools were used*; the taxonomy records *what role/instrument was performed* (`02.10` DT-01, D-01). An AI-assisted contribution is not a less-verified or differently-roled contribution. Logged as an explicit non-relationship so it is not rediscovered downstream.

**Role scoping**: Musician/Producer set disclosure on their own contributions; Fan sees it as a distinct axis; the taxonomy is untouched by it.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Disclosure is an axis on the contribution (`02.10`); role is a foreign key into `02.06`. They never merge into one field.
2. **Trigger chain + rollback + sync/async**: Setting disclosure does not touch role selection and vice versa; no chain between them.
3. **Permission intersection**: None across this pair (but see CX-14 for the per-field split *within* the contribution row).
4. **Notification fan-out**: None across this pair.
5. **State-transition race**: None — the two axes are independent by design (`02.10` Q-03 exists to keep them so).

---

### CX-13: Claiming & Seeding ↔ Resolution & Merge

**Relationship**: Import is the source of essentially all duplication; claim and merge are one act from the user's side (`02.01.04`, `02.03.01`). Step 5 added SEO-critical mechanics: a merge chain A→B→C must **301 in a single hop** — a redirect chain on an indexed page bleeds link equity and exceeds crawler hop limits, deindexing the acquisition channel (`02.01.02`→`02.01.04`).

**Role scoping**: Musician/Producer/Operator claim and merge their own duplicates; Fan reads the survivor.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: Merge re-points every record naming either party and unions their evidence; `D-03`'s (party, role, work) uniqueness makes outcomes deterministic — same tuple collapses, differing roles both survive. Ownership of the merge *decision* likely sits with domain 01; trigger and evidence with 02 (a boundary tension — see below).
2. **Trigger chain + rollback + sync/async**: Duplicate detected → merge offered (never applied silently, `02.02.01` D-15) → survivor chosen → records re-pointed → single-hop 301 issued → pages re-derive. Merge must union credits and re-derive, never union two rendered pages (`02.01.05` D-17).
3. **Permission intersection**: Claiming binds identity; merging two *humans* is an identity operation with credit consequences — the decision is gated by 01, the evidence by 02.
4. **Notification fan-out**: Both merged parties' claimants are notified; downstream royalty routing (domain 10, IPI anchoring) must be re-checked because a false person-merge misroutes income.
5. **State-transition race**: Two concurrent merges touching an overlapping party — serialise on the shared node; a wrong person-merge is high-severity and hard to reverse.

---

### CX-14: AI Disclosure ↔ Session Capture

**Relationship**: The AI-disclosure axis is captured on the contribution row (`02.02.02`), but Step 5 revealed a **per-field, not per-row, permission model**: the Producer owns the attribution on the row, and the *named contributor* owns its AI-disclosure axis (`02.02.02`→`02.10`, D-04) — because disclosing someone else's work as AI is defamatory if wrong. One row, two owners of two fields.

**Role scoping**: Producer owns the attribution field; the named Musician owns the AI-disclosure field on the same row; Operator has no access; Fan reads the resolved row.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: One contribution row with split field ownership. The attribution and the AI axis are written by different parties and must not be collapsible by whoever holds the row.
2. **Trigger chain + rollback + sync/async**: Contribution logged by Producer → AI axis defaults unset → named contributor sets/clears their own axis (async). The Producer cannot pre-fill an AI claim about the contributor.
3. **Permission intersection**: The core of the edge — write permission is scoped to the *field*, not the row. `/write-be-spec` must model per-field authorization here.
4. **Notification fan-out**: A contributor being asked to set their disclosure axis is a notification to that contributor only.
5. **State-transition race**: Producer amends the attribution while the contributor sets the AI axis — independent fields, so the writes commute; no race.

---

### CX-15: Taxonomy ↔ Session Capture

**Relationship**: Capture is where role and instrument bind to a credit as **separate axes** (`02.06` D-02). Pending aliases are accepted at capture and never block (`02.06` D-03), but free text on a record naming a third party is where the abuse vector enters the system (`02.06` Q-04). Step 5 added a payment-relevant requirement: the taxonomy must express **doubling** (one party, two instruments, one date) because under AFM/MU rules it carries a fee (`02.02.01`→`02.06`, DT-05) — a payment fact, not a taxonomy nicety.

**Role scoping**: Musician/Producer bind role + instrument at capture; Operator binds capacity for room roles; Fan reads plain labels.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The vocabulary is `02.06`'s; capture writes foreign keys into it plus pending aliases. Doubling is modelled as one party bearing two instrument axes on one date, not as a duplicated party.
2. **Trigger chain + rollback + sync/async**: Role/instrument picked → FK (or pending alias) stored on the contribution → the credit is live even with an unratified alias.
3. **Permission intersection**: Picking a role is unrestricted; minting a canonical term is the taxonomy's; free-text aliases naming third parties are a moderation surface (cross-domain 24).
4. **Notification fan-out**: Alias ratification notifies the requester; doubling may surface a union-filing prompt (CX-17).
5. **State-transition race**: A pending alias ratified while the record is live — the FK resolves in place, no record invalidated.

---

### CX-16: Dispute Resolution ↔ Credit Graph

**Relationship**: "Contested" is a state of the *record*, and Step 5 fixed exactly what it does. Filing a dispute produces **no public page state** (`02.01.02`→`02.05`, D-06) — a contest is an objection, not evidence, and publishing pendency would let a free unilateral filing vandalise any page. Contest **marks and zero-weights** the credit for participants but **never suppresses** it (`02.01.01`→contested, D-11) — critical because the dispute engine is a platform cross-cut (domain D-03) and a shared engine must not assume it may hide the thing under dispute.

**Role scoping**: Musician/Producer see the contested marker on the record-view; Fan sees the unchanged public page (no contest state leaks); Operator corroborates only.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: The credit is `02.01`'s; `02.05` sets a contested flag that is a participant-view affordance, never a public page mutation. Dispute outputs (amendment, removal) change the page; pendency does not. **The same rule now governs a claim contest** (`02.03.03` D-03 corrected to match): no public marker, no public suppression — and there the credit additionally **stays attached to the first claimant** until the contest closes, detaching only on `Unresolvable`, when it returns to the unclaimed shell it came from (`02.03.03` D-05/D-06).
2. **Trigger chain + rollback + sync/async**: File dispute → mark record contested (participant view) + zero-weight in traversal → adjudicate → amendment/removal or dismissal. Dismissal clears the flag with no public trace.
3. **Permission intersection**: Anyone with standing may file; only participants see the contested marker; the adjudicator gets a logged, non-publishing scoped read (D-18) even of embargoed records.
4. **Notification fan-out**: Parties are notified on file and on outcome; the public is never notified of a mere filing.
5. **State-transition race**: A contested credit that is also embargoed — suppression (embargo) and marking (contest) are independent; the record stays hidden from non-participants and marked for participants, and the two states do not interfere.

---

### CX-17: Union Reporting ↔ Roll Call

**Relationship**: Union filings (AFM/MU) are paid by the hour, so the temporal roll — personnel, instruments, doubles, and the session window — *is* the billable substance of the filing (`02.07` DT-02). The roll is most of the filing already, which independently validates `02.02.01` D-02 (intervals + observed/inferred marking) and D-14 (contractor personnel list as bulk-import source). `02.07` is the domain's only Won't-now, but the roll should not make it unbuildable later.

**Role scoping**: Musician configures their own membership + line; Producer is the signatory; Operator read-only; Fan absent.

**Synthesis questions answered** *(Medium confidence — validation deferred, but the data dependency is firm)*:
1. **Shared-state owner + merge**: The roll is `02.02.01`'s; the filing is a `02.07` projection over it. The filing never writes back to the roll.
2. **Trigger chain + rollback + sync/async**: Roll finalised → filing assembled (personnel, doubles, window) → submitted to the external body. Doubling (CX-15) is a fee line the filing must carry.
3. **Permission intersection**: The signatory (Producer) submits; membership drives which lines are the Musician's.
4. **Notification fan-out**: Submission status is a filing concern, not a credit notification.
5. **State-transition race**: The roll editable after a filing is prepared — the filing must snapshot, since the external body's record is fixed at submission.

---

### CX-18: Ring Detection ↔ Dispute Resolution

**Relationship**: `02.04.04` and `02.05` join at a narrow, versioned internal boundary: `CollusionEvidenceConstraintV1`. Detection supplies an opaque attestation-edge identifier, its negative multiplier, and literal `requiresNonTopologicalCorroboration: true`; it never transfers a raw score, a cluster or witness identity, a ring flag, a trust score, a hard-exclusion instruction, or an enforcement recommendation. `02.05` applies the multiplier only to that edge's attested-evidence contribution. The constraint does not block ordinary filing, direct resolution, or witness resolution on other evidence. It instead prohibits the detection signal from independently opening or advancing a Domain 24 factual-dispute case: that transition requires separately captured non-topological corroboration.

**Role scoping**: None. Both sides are internal-only. Participants see the ordinary dispute state; they never see a detector payload, a topology rationale, or an inferred collusion label.

**Synthesis questions answered**:
1. **Shared-state owner + merge**: `02.04.04` owns derivation of the multiplier and immutable edge reference; `02.05` owns its use in credit-specific evidence weighting. Domain 24 owns case workflow and due process. No system writes another's state.
2. **Trigger chain + rollback + sync/async**: A v1 payload adjusts a referenced evidence-edge contribution during dispute confidence derivation. It does not start a case. Separately captured non-topological corroboration may route a factual dispute into Domain 24; a later payload update re-derives the edge weight without retroactively creating an accusation.
3. **Permission intersection**: No persona receives read or write access. Domain 24 reviewers receive the case evidence necessary for due process, not raw topology. Unknown payload versions are excluded rather than guessed over.
4. **Notification fan-out**: None from detection or the v1 payload. Normal dispute and Domain 24 case notices fire only when an independently valid case transition occurs.
5. **State-transition race**: A v1 payload may arrive while an ordinary dispute is open; it re-derives the one edge contribution but cannot independently advance the case. A corroborating non-topological evidence event and the payload may arrive in either order; the case transition occurs only after both requirements are present.

---

## Cross-Cuts Routed to the Global CX

> Mechanisms that are **not** nodes in this domain. Recorded here so `ideation-cx.md` can absorb
> them; also returned in this drill's cross-domain rows.

| Mechanism | Serves | Domain 02's relationship |
|---|---|---|
| **DAW / Plugin Host Integration Channel** | 02, 05, 07, 09, 12 | The channel carries stems (07), split capture (09) and service delivery (05) as well as credits. `02.02` owns the *payload* (roll, log, prompt); the channel is platform-wide. Sub-domain `02.02` D-01. **Q-02 makes the wedge depend on this cross-cut's answer.** **NO v1 CHANNEL (owner decision 2026-07-22, D-70 / DQ-08.2)**: no non-web client on the producer's machine is authorised, so this mechanism has **no v1 implementation** and every consumer above must degrade to its no-channel branch for the whole v1 window. Retained as a mechanism, not deleted — it reactivates only if the Desktop row reopens on its enumerated evidence. |
| **Dispute Case Engine** | 02, 05, 09, 13, 14, 17, 19, 24 | `02.05` rides it; only credit-specific evidence semantics and contested-credit behavior (CX-16) are domain-owned. Must carry a general privileged-read grant (D-18). `02.05` D-01, DT-01. |
| **Reputation, Endorsement & Vouching** | 01, 02, 03, 04, 05 | Credit-derived *weight* lands in `02.04.02`; the endorsement *surface* is a platform reputation mechanism. The pull toward a party-level "verified %" badge (strongest on a 05 marketplace profile) is exactly the reputation score routed OUT of domain 02 (D-07). |
| **Music Role & Instrument Taxonomy** _(owner: 02)_ | 02, 03, 04, 05, 06, 08, 13, 15, 16 | Shared vocabulary with a domain owner. Consumers (03, 04, 05, 06, 08) *map* rather than extend (`02.06` D-14); rights outcomes (featured-performer pay) belong to 10 not the vocabulary (D-15); gear objects belong to 13/15 (D-08). |
| **Notification, Inbox & Nudge Cadence** | All | Attestation requests, claim suggestions, merge proposals, dispute notices, embargo-lift announcements. Domain 02 is one of its heaviest and most sensitive users; the shell channel gap (Q-05) is this mechanism's unsolved edge. |
| **Audit History & Event Record** | 02, 09, 10, 17 | `02.01.06` D-01 (supersession), `02.04.03` D-01 (retraction preserves history) and `02.01` Q-01 all demand append-only, user-visible history. Product-facing (a dispute six years later reads it). |
| **Canonical Entity Resolution & Merge** | 01, 02, 07, 09, 10, 12 | Person/work/identifier dedup + redirect-on-merge. Domain 02 supplies the credit-evidence and the single-hop-301 SEO constraint (CX-13); the merge *decision* on two humans is 01's. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 02.09 Gear Linkage | 02.04 Attestation & Confidence | Nobody counter-signs a mic choice. Gear claims sit permanently at self-asserted tier (`02.09` D-04); attestation has no purchase on them. **Caveat**: `02.09` Q-02 — a false vintage-gear claim has monetary value in domain 13, but the remedy is a marketplace/Trust-&-Safety control, not credit attestation. |
| R-02 | 02.07 Union Reporting | 02.04 Attestation & Confidence | Union filings assert attendance to an external body under its own rules; the platform's internal confidence tier has no standing with the AFM, and AFM acceptance says nothing about our tier. Two unrelated notions of verification sharing a word. |
| R-03 | 02.10 AI Disclosure | 02.04.02 Provenance Tiers | Tier measures how well we know *who did it*; disclosure records *what tools they used*. An AI-assisted contribution is not a less-verified one. `02.10` Q-03 exists to keep this rejected. |
| R-04 | 02.03 Claiming & Seeding | 02.02 Session Capture (as a *data* edge) | Import never writes session data — a captured session is a contemporaneous record, an imported credit has no session behind it. The real edge is the shell/growth loop (CX-04), an identity-and-acquisition relationship. A data edge would imply imports can backfill sessions, destroying the tier distinction (`02.03` D-01). |
| R-05 | 02.06 Taxonomy | 02.05 Dispute Resolution | A dispute about which role someone held is about the *fact*, not the vocabulary. The taxonomy supplies the words both parties argue in; it has no stake in the argument. |
| R-06 | 02.08 Export | 02.05 Dispute Resolution | Contested credits are marked and zero-weighted but export reads a frozen projection; the genuine problem is post-emission change (CX-07, domain Q-08), not a standing interaction. |
| R-07 | 02.09 Gear Linkage | 02.06 Taxonomy | Instrument (a functional axis in `02.06`) and gear object (`02.09`, backed by domains 13/15) look like one taxonomy problem and are two things (`02.06` D-08, DT-06). Absorbing make/model into the instrument axis would turn the vocabulary into a product catalogue and duplicate 13/15. A boundary, not an interaction. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-12|D-12]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-14|D-14]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-18|D-18]]
