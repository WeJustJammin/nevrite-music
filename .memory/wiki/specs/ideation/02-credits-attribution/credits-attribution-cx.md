# Credits & Attribution — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Credits & Attribution](./credits-attribution-index.md)
> **Status**: [BREADTH] — children classified; intra-domain cross-cuts mapped.
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | [02.01 Credit Graph & Discography](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) | Capture is the graph's highest-tier writer; the close prompt commits working data into credit records | Musician, Producer | High | 02.02 CX-02; 02.01.01 happy path |
| CX-02 | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | [02.04 Attestation & Confidence](./02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md) | The in-room tap at close *is* an attestation — the same act at its best conversion moment | Musician, Producer | High | 02.04.01 DT-03; 02.02.03 D-01 |
| CX-03 | [02.03 Claiming & Seeding](./02.03-claiming-cold-start-seeding/02.03-claiming-cold-start-seeding-index.md) | [02.04 Attestation & Confidence](./02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md) | Imported credits are permanently tier-capped; claiming verifies the person, never the fact | Musician, Producer, Operator | High | 02.03 D-01; 02.03.02 D-01 |
| CX-04 | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | [02.03 Claiming & Seeding](./02.03-claiming-cold-start-seeding/02.03-claiming-cold-start-seeding-index.md) | Roll call creates unclaimed shells; the claim inbox is where they become users. The growth loop's two halves | Musician, Producer | High | 02.02.01 DT-03; 02.03.02 DT-01 |
| CX-05 | [02.04 Attestation & Confidence](./02.04-attestation-credit-confidence/02.04-attestation-credit-confidence-index.md) | [02.01 Credit Graph & Discography](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) | Tier renders per discography line and weights every traversal edge; unweighted traversal is the laundering exploit | All four | High | 02.01.03 DT-01, D-01; 02.04.02 DT-03 |
| CX-06 | [02.06 Taxonomy](./02.06-credit-role-instrument-taxonomy.md) | [02.01 Credit Graph & Discography](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) | Every credit's role is a foreign key into the vocabulary; traversal reasons over its structure | All four | High | 02.01.01 D-01; 02.06 behavior |
| CX-07 | [02.06 Taxonomy](./02.06-credit-role-instrument-taxonomy.md) + [02.01 Graph](./02.01-credit-graph-discography/02.01-credit-graph-discography-index.md) | [02.08 Export & DDEX RIN](./02.08-credit-export-ddex-rin.md) | Exact role codes and resolved identifiers are hard preconditions for valid emission — emission's cost is upstream | Musician, Producer, Operator | High | 02.08 DT-02 |
| CX-08 | [02.01.06 Amendment](./02.01-credit-graph-discography/02.01.06-credit-correction-amendment.md) | [02.05 Dispute Resolution](./02.05-credit-dispute-resolution.md) | Failed agreement auto-escalates, carrying the proposal as opening evidence — one continuum, two social framings | Musician, Producer | High | 02.01.06 D-02, DT-01 |
| CX-09 | [02.05 Dispute Resolution](./02.05-credit-dispute-resolution.md) | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | Captured evidence is what makes a dispute cheap; without it the platform is reconstructing like everyone else | Musician, Producer, Operator | High | 02.05 DT-02 |
| CX-10 | [02.01.05 Embargo](./02.01-credit-graph-discography/02.01.05-credit-visibility-embargo.md) | [02.08 Export & DDEX RIN](./02.08-credit-export-ddex-rin.md) | Export bypasses the discography page entirely — a live leak path for unreleased work | Producer, Musician, Operator | High | 02.01.05 DT-02; 02.08 D-03 |
| CX-11 | [02.09 Gear Linkage](./02.09-gear-credit-linkage.md) | [02.02 Session Capture](./02.02-session-capture/02.02-session-capture-index.md) | Gear attaches at contribution granularity, so it exists only at tracking time — and must cost the capture flow nothing | Musician, Producer, Operator | High | 02.09 D-01, D-02, DT-02 |
| CX-12 | [02.10 AI Disclosure](./02.10-ai-contribution-disclosure.md) | [02.06 Taxonomy](./02.06-credit-role-instrument-taxonomy.md) | Deliberately orthogonal — disclosure is an axis on the contribution, never a role | Musician, Producer, Fan | High | 02.10 DT-01, D-01 |
| CX-13 | [02.03 Claiming & Seeding](./02.03-claiming-cold-start-seeding/02.03-claiming-cold-start-seeding-index.md) | [02.01.04 Resolution & Merge](./02.01-credit-graph-discography/02.01.04-identifier-resolution-duplicate-merge.md) | Import is the source of essentially all duplication; claim and merge are one act from the user's side | Musician, Producer, Operator | High | 02.01.04 behavior; 02.03.01 behavior |
| CX-14 | [02.07 Union Reporting](./02.07-union-performer-session-reporting.md) | [02.02.01 Roll Call](./02.02-session-capture/02.02.01-session-roll-call.md) | Union filings are paid by the hour — the temporal roll is their billable substance, independently validating 02.02.01 D-02 | Musician, Producer | Medium | 02.07 DT-02 |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Session Capture ↔ Credit Graph

**Relationship**: Capture is the graph's reason to exist and its highest-tier writer. The close prompt (`02.02.03`) reconciles the roll and the log and commits them as credit records (`02.01.01`) — that commit is the boundary between working data (mutable, session-scoped, nobody's business) and facts (superseded-not-edited, public per embargo, disputable).

The boundary is sharp and load-bearing. Before the commit, a Producer fixes a mistake by typing over it. After, the same fix is an amendment requiring the attesters' agreement (`02.01.06`). Users will not perceive the transition, so the prompt must make the commit feel like a conclusion rather than a save.

**Role scoping**:
- **Producer**: writes both sides — the working data and, via the prompt, the facts.
- **Musician**: config on their own rows in both; the tap that crosses the boundary is theirs.
- **Operator**: sees the roll (opt-in), the room's credit, and nothing of the log.
- **Fan**: sees only the published projection, long after.

**Synthesis questions answered**:
1. **Shared state conflict**: Session data is `02.02`'s (and possibly domain 07's — sub-domain Q-01 is unresolved and is the worst available structural error here). Credit records are `02.01`'s. The commit transfers authority; nothing should write both.
2. **Trigger chain**: Wrap → prompt → commit → credits exist → embargo evaluated → discography/traversal update. A skipped prompt still commits at producer-asserted tier (`02.02.03` D-02) — the chain never simply stops.
3. **Permission intersection**: Yes. Roll membership gates who can be credited; Producer-owns-the-roll gates who can assert about others.
4. **Notification fan-out**: The commit tells every credited party. For non-users there is no channel (CX-04) — the loop's known break.
5. **State transition conflict**: Late roll/log edits after commit must route to `02.01.06`, not back into the session. If both paths stay open the two records diverge silently.

---

### CX-02: Session Capture ↔ Attestation & Confidence

**Relationship**: The domain's central economic fact. `02.04.01` DT-03 establishes that the in-room tap and the async chase are **the same feature** with radically different conversion. `02.02.03` D-01 fires the prompt while people are physically present *because* of that gap. Everything the domain claims over Jaxsta, Muso.AI and Sound Credit reduces to this: they can only ask people to remember; WeJammin can ask them before they leave the room.

The corollary is uncomfortable and worth stating plainly: **if the wrap signal is unreliable (`02.02` Q-02 — no DAW plugin, no reliable wrap), the prompt mistimes, the taps do not happen in the room, and the domain degrades to an async attestation chase — which is Sound Credit, which already exists and already failed.** The plugin question is not an implementation detail downstream of the wedge; it *is* the wedge.

**Role scoping**:
- **Musician**: the tap. One act, worth more in the room than the same act a week later.
- **Producer**: assertion plus trust-broker weight (`personas.md`).
- **Operator**: room facts only (`02.04.01` D-05) — cannot lift a contribution credit's tier at any volume.
- **Fan**: never attests.

**Synthesis questions answered**:
1. **Shared state conflict**: Capture asserts; attestation confirms. Separate records on one credit — the assertion and the confirmation must never collapse into one field, or a Producer's self-assertion becomes indistinguishable from corroboration.
2. **Trigger chain**: Prompt → tap → attestation → tier re-derives → discography changes. Non-tap is not a failure; it is the modal async path.
3. **Permission intersection**: Yes — you may only attest what you were positioned to know, which comes from the roll.
4. **Notification fan-out**: Present contributors get the in-room buzz; absent ones get the async request at materially worse conversion.
5. **State transition conflict**: Simultaneous taps at close all trigger re-derivation; the tier must settle once, not flicker per tap.

---

### CX-04: Session Capture ↔ Claiming & Seeding

**Relationship**: The platform's only self-reinforcing loop, and its known break. Every session names 3–8 professionals; most are not users; each becomes an unclaimed shell with real work on a real page (`02.02.01` DT-03). The claim inbox (`02.03.02`) is where they arrive. Capture → page → claim → the claimant captures their own sessions → more shells.

The break: **a shell has no notification channel** (`02.03.02` DT-01). Import and roll call can manufacture ten thousand shells and invite nobody. The actual invitation is the Producer saying "you're on WeJammin, go claim it" — a *social* act the platform can prompt but cannot perform. Any growth model that treats the inbox as the acquisition channel is wrong, and `02.03.02` Q-01 is the load-bearing unknown.

**Role scoping**:
- **Producer**: creates the most shells and is the only viable invitation channel.
- **Musician**: the shell's subject; arrives to a populated page — the best onboarding available.
- **Operator**: room shells, especially duplicate-prone from imports.
- **Fan**: no shells, no claiming.

**Synthesis questions answered**:
1. **Shared state conflict**: Shells are identity objects (domain 01) created by capture and import. Two sessions naming the same non-user must converge on one shell, or the human gets two inboxes and neither is complete.
2. **Trigger chain**: Roll entry for a non-user → shell → credits attach → inbox waits → **no notification exists** → the human must arrive by another route.
3. **Permission intersection**: Uncomfortable — a Producer's roll entry creates a public-ish record about a third party who never consented (`02.02.01` Q-02, `02.03.02` Q-02).
4. **Notification fan-out**: The gap itself. See above.
5. **State transition conflict**: A shell being claimed while new credits are added to it — the claim must absorb late arrivals rather than fixing contents at claim time.

---

### CX-05: Attestation & Confidence ↔ Credit Graph

**Relationship**: The tier is not a label on the graph — it is the graph's ranking function. It renders per discography line (`02.01.02` D-02) and weights every traversal edge (`02.01.03` D-01). Both matter, but the second is the one that bites: an unweighted traversal lets anyone manufacture proximity to any famous party with one self-asserted credit, which is the reputation-laundering attack named in `personas.md`'s Musician anti-persona.

`02.04.02` DT-03 adds the twist that makes this the domain's most consequential edge: the tier's visible gap on a discography line is what *motivates* attestation, and each attestation pulls a collaborator into the product (CX-04). The tier is therefore simultaneously the differentiator, the ranking function, and the growth engine — three jobs in one number.

**Role scoping**:
- **Musician / Producer / Operator**: read tiers, cannot set them; see what would raise them.
- **Fan**: simplified label only (`02.04.02` D-04) — the distinction matters to them, the vocabulary must not.

**Synthesis questions answered**:
1. **Shared state conflict**: Attestations are the attesters'; the tier derives; the graph consumes. Derivation must be reproducible or two reads disagree.
2. **Trigger chain**: Evidence change → re-derive → discography label → traversal weight → any cached projection invalidates.
3. **Permission intersection**: Yes — who may attest bounds the reachable tier for a given credit.
4. **Notification fan-out**: Tier rises notify (good news, and the moment the page got stronger). Tier drops notify **only when caused by retraction**, never when caused by ring demotion (`02.04` CX-03 Q4) — a deliberate and sharp-edged inconsistency.
5. **State transition conflict**: Derived-on-read at fan-scale volume is a real cost; maintained-on-write risks staleness. `/create-prd-architecture`'s call, and a live constraint on the locked Supabase decision.

---

### CX-09: Dispute Resolution ↔ Session Capture

**Relationship**: The domain's honest claim, stated precisely. `02.05` DT-02 rejects "the platform determines who is right" and replaces it with something narrower and defensible: **disputes about captured work are cheap, because the record already exists.** For a captured session, resolution is closer to reading a contemporaneous record than to weighing testimony. For imported or reconstructed credits, the platform is in exactly the position `problem-statement.md` blames the industry for — asking people to remember, years later, at the moment the answer became valuable.

This is the clearest expression of the thesis inside the domain: capture is not a data-collection nicety, it is what makes the most litigated failure in music cheap to resolve.

**Role scoping**:
- **Producer**: the most valuable participant in a dispute they did not raise — they ran the room. Their switching trigger (`personas.md`) is precisely being unable to evidence a session they facilitated.
- **Musician**: files and responds; their switching trigger is "a credit that went to someone else".
- **Operator**: independent, narrow corroboration that the session occurred.
- **Fan**: absent — a crowd-adjudicated factual question is a popularity contest.

**Synthesis questions answered**:
1. **Shared state conflict**: The dispute holds the credit (`02.05` D-02) — suppressed publicly, downstream effects paused. Capture data is read-only evidence by then.
2. **Trigger chain**: Dispute → show the record → most captured-session disputes end here → witnesses → adjudication → legal (out of scope).
3. **Permission intersection**: Witness eligibility comes from the roll (`02.02.01`). No roll, no witnesses — which is why imported credits dead-end.
4. **Notification fan-out**: Parties and, at the witness rung, co-present parties. Witness requests are not votes (`02.05` D-05).
5. **State transition conflict**: A dispute racing an amendment on the same credit — the dispute wins and absorbs the amendment as evidence (`02.01` CX-03 Q5).

---

## Cross-Cuts Routed to the Global CX

> Mechanisms that are **not** nodes in this domain. Recorded here so `ideation-cx.md` can absorb
> them; also returned in this drill's `crossCuts`.

| Mechanism | Serves | Domain 02's relationship |
|---|---|---|
| **DAW / Plugin Host Integration Channel** | 02, 05, 07, 09, 12 | The channel carries stems (07), split capture (09) and service delivery (05) as well as credits. `02.02` owns the *payload* (roll, log, prompt); the channel is platform-wide. Sub-domain `02.02` D-01. **Note**: `02.02` Q-02 means the wedge's viability depends on this cross-cut's answer — an unusually high-stakes dependency for a "mere" channel. |
| **Dispute Case Engine** | 02, 05, 09, 13, 14, 17, 19, 24 | `02.05` rides it; only credit-specific evidence semantics and contested-credit behavior are domain-owned. `02.05` D-01, DT-01. |
| **Reputation, Endorsement & Vouching** | 01, 02, 03, 04, 05 | Sweep candidate #10 split (`02.04` D-01): the credit-derived *weight* lands in `02.04.02`; the endorsement *surface* is a platform reputation mechanism, not a credits feature. Domain 02 supplies the signal. |
| **Music Role & Instrument Taxonomy** _(owner: 02)_ | 02, 03, 04, 05, 08, 13 | Genuinely shared vocabulary with a domain owner. `02.06` DT-02: owned by its most demanding consumer (credits, where imprecision invalidates a RIN emission) or it drifts to the loosest requirement. `02.06` Q-03 asks whether consumers couple directly or keep mapped vocabularies. |
| **Notification, Inbox & Nudge Cadence** | All | Attestation requests, claim suggestions, merge proposals, dispute notices, embargo-lift announcements. `02.04.01` D-04 (rate limits) and Q-03 (nudge cadence) are this cross-cut's problem, not a credits one — but domain 02 is one of its heaviest and most sensitive users. |
| **Audit History & Event Record** | 02, 09, 10, 17 | `02.01.06` D-01 (supersession), `02.04.03` D-01 (retraction preserves history) and `02.01` Q-01 all demand append-only, user-visible history. Product-facing (a dispute six years later reads it), so not purely architecture — but the mechanism is shared. |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 02.09 Gear Linkage | 02.04 Attestation & Confidence | Rejected: nobody counter-signs a mic choice. Gear claims sit permanently at self-asserted tier (`02.09` D-04) and the attestation machinery has no purchase on them. **Caveat**: `02.09` Q-02 notes a false vintage-gear claim has direct monetary value in domain 13 — but the remedy is a marketplace/Trust-&-Safety control, not credit attestation. Promote only if Q-02 resolves toward attested gear. |
| R-02 | 02.07 Union Reporting | 02.04 Attestation & Confidence | Rejected: union filings assert attendance and hours to an external body under its own rules; the platform's internal confidence tier has no standing with the AFM, and the AFM's acceptance says nothing about our tier. Two unrelated notions of verification that merely share a word. |
| R-03 | 02.10 AI Disclosure | 02.04.02 Provenance Tiers | Rejected — and `02.10` Q-03 exists to keep it rejected. Tier measures how well we know **who did it**; disclosure records **what tools they used**. An AI-assisted contribution is not a less-verified contribution. The conflation is tempting enough that it is logged here as an explicit non-relationship rather than left to be rediscovered downstream. |
| R-04 | 02.03 Claiming & Seeding | 02.02 Session Capture (as a *data* edge) | Rejected in that direction. Import never writes session data — captured sessions are contemporaneous records and an imported credit has no session behind it. The real edge is the shell/growth loop (CX-04), which is an identity-and-acquisition relationship, not a data one. Logging a data edge would imply imports can backfill sessions, which would quietly destroy the tier distinction (`02.03` D-01). |
| R-05 | 02.06 Taxonomy | 02.05 Dispute Resolution | Rejected: a dispute about which role someone held is a dispute about the *fact*, not about the vocabulary. The taxonomy supplies the words both parties argue in; it has no stake in the argument. |
| R-06 | 02.08 Export | 02.05 Dispute Resolution | Rejected as a standing pair. Contested credits are held and suppressed (`02.05` D-02), so they are simply out of export scope — a filter, not an interaction. The genuine problem is post-emission change, which is CX-10's neighbourhood and `02.08` Q-01. |
