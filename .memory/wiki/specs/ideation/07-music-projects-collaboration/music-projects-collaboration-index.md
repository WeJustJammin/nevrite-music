# Music Projects & Collaboration — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `in-source` | **Priority**: `core`

## Overview

The workspace where a song moves from idea to delivered master — song and release containers, contributor rosters, versioned audio and stems, timestamped review, approval gates, mix/master workflow and validated handoff.

**Why this is a top-level domain**: In-source ('managing music projects from concept to completion') with zero behavioural depth. Merged what one lens split into ten domains, because they are one workflow: a song passes through them, and splitting review from versioning detaches comments from versions. Music projects do not behave like software projects — stage gates are craft-specific and the same asset mutates identity across stages. 'Mix_FINAL_v3_ACTUAL.wav' is an industry-wide failure that costs real money when the wrong master ships, and timestamped waveform feedback is the highest-value interaction in music collaboration and table stakes. Crucially this is the capture surface for the platform's core asset: music-native primitives (sessions, takes, comps, stems) yield credits and splits as a byproduct, where generic tasks yield nothing. That byproduct is the wedge — this domain is where it is manufactured.

**Interacting capabilities** (what justifies domain status):

- song/release container & stage gates
- contributor roster & roles
- audio version control & lineage
- timestamped review & approval
- mix/master workflow & deliverable specs
- validated handoff packages

## Breadth Pass Result (2026-07-16)

35 sweep candidates → **9 sub-domains, 37 features, 113 Deep Think hypotheses**. 4 candidates merged into 2,
1 split into 2, 3 demoted to cross-cuts, **6 features added by Deep Think** that the 14-lens sweep did not find.

**The single most consequential finding**: the sweep produced 35 candidates describing what to capture — song
records, versions, review, approval, mastering — and **not one asking how the work reaches the platform**. Every
candidate assumes a browser. `meta/personas.md` states the Producer's constraint plainly ("their work happens
inside a DAW, not a browser... any capture flow requiring them to leave the session will not be used") and
`meta/problem-statement.md` names the root cause ("no system is present at the moment of creation"). The moment
of creation is inside a DAW. **A web app is, by construction, not present at it.** That gap became `07.09` — and
seven features across four sub-domains independently named it as a hard dependency. See
[music-projects-collaboration-cx.md#CX-01](./music-projects-collaboration-cx.md).

## Children

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Song, Release & Production Board | sub-domain | [07.01-song-release-production-board/](./07.01-song-release-production-board/) | `[BREADTH]` | 9 hypotheses |
| 02 | Songwriting & Composition Workspace | sub-domain | [07.02-songwriting-composition-workspace/](./07.02-songwriting-composition-workspace/) | `[BREADTH]` | 9 hypotheses |
| 03 | Contributors, Access & Confidentiality | sub-domain | [07.03-contributors-access-confidentiality/](./07.03-contributors-access-confidentiality/) | `[BREADTH]` | 9 hypotheses |
| 04 | Audio Version Control & Lineage | sub-domain | [07.04-audio-version-control-lineage/](./07.04-audio-version-control-lineage/) | `[BREADTH]` | 18 hypotheses |
| 05 | Review, Feedback & Approval | sub-domain | [07.05-review-feedback-approval/](./07.05-review-feedback-approval/) | `[BREADTH]` | 15 hypotheses |
| 06 | Sessions, Documentation & Recall | sub-domain | [07.06-sessions-documentation-recall/](./07.06-sessions-documentation-recall/) | `[BREADTH]` | 13 hypotheses |
| 07 | Mix & Master Workflow | sub-domain | [07.07-mix-master-workflow/](./07.07-mix-master-workflow/) | `[BREADTH]` | 15 hypotheses |
| 08 | Delivery, Readiness & QC | sub-domain | [07.08-delivery-readiness-qc/](./07.08-delivery-readiness-qc/) | `[BREADTH]` | 16 hypotheses |
| 09 | DAW Bridge & Capture-at-Source | sub-domain | [07.09-daw-bridge-capture-at-source/](./07.09-daw-bridge-capture-at-source/) | `[BREADTH]` | 9 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping within a domain that has 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)
>
> All 9 children are sub-domains — no candidate survived as a direct feature of the domain. Every one clustered
> with others into an interacting group, which is consistent with the domain rationale's claim that these are
> "one workflow" rather than ten adjacent ones.

## Role Matrix

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 07.01 Song, Release & Production Board | ✅ Full | ✅ Full | ❌ None | ❌ None |
| 07.02 Songwriting & Composition Workspace | ✅ Full | 👁️ Read-only | ❌ None | ❌ None |
| 07.03 Contributors, Access & Confidentiality | ✅ Full | ✅ Full | ❌ None | ❌ None |
| 07.04 Audio Version Control & Lineage | 👁️ Read-only | ✅ Full | ❌ None | ❌ None |
| 07.05 Review, Feedback & Approval | ✅ Full | ✅ Full | ❌ None | ❌ None |
| 07.06 Sessions, Documentation & Recall | 👁️ Read-only | ✅ Full | 👁️ Read-only | ❌ None |
| 07.07 Mix & Master Workflow | ⚙️ Config | ✅ Full | ❌ None | ❌ None |
| 07.08 Delivery, Readiness & QC | ✅ Full | ✅ Full | ❌ None | 👁️ Read-only |
| 07.09 DAW Bridge & Capture-at-Source | 👁️ Read-only | ✅ Full | ❌ None | ❌ None |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
>
> Persona names from [meta/personas.md](../meta/personas.md) — referenced, never redefined.

**What the matrix reveals** — three findings, each with downstream consequences:

1. **The Producer is Full in 8 of 9 sub-domains.** This is the most Producer-centric domain in the platform, and
   correctly so: `meta/personas.md` calls them "the capture point... without this persona the provenance wedge
   has no mechanism." Their only non-Full row is `07.02` (composition), where they are deliberately read-only —
   see D-04.
2. **The Operator appears exactly once** (`07.06`, read-only, room-scoped). A session physically happens in a
   studio, so the Operator knows it occurred and who came — but never the music, the songs, the credits or the
   splits (`07.06` R-01). A studio with visibility into its clients' splits would be unbookable.
3. **The Fan appears exactly once** (`07.08.05`, remix programs). That single cell is an anomaly, and the
   anomaly is a tell: `07.08.05` DT-03 argues the remix *program* belongs to domain 20/21 and only its stem set
   and clearance gate belong here.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | In-source ('managing music projects from concept to completion') with zero behavioural depth. Merged what one lens split into ten domains, because they are one workflow: a song pas... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **Added `07.09` (DAW Bridge & Capture-at-Source)** — absent from all 35 candidates | `meta/personas.md` (Producer: "will not leave the session") + `meta/problem-statement.md` ("no system is present at the moment of creation"). The moment of creation is inside a DAW; a web app is not present at it. Seven features independently named this as a hard dependency. **The domain's largest addition and its largest open risk** — it may contradict `meta/constraints.md`'s single-web-surface classification (Q-01). **Q-01 resolved 2026-07-22 → D-08**: no non-web client is authorised, and the bridge is deferred behind a named, enumerated evidence gate; the sub-domain stands as ratified product intent, not as v1 build content. | Deep Think, `/ideate-discover` Step 3 |
| D-03 | **Added the Session entity and the Session Close Capture Prompt** (`07.06.01`, `07.06.02`) | `meta/personas.md` specifies the prompt almost verbatim: "closes a project without capturing splits — the exact failure the platform exists to prevent... **the design must make the lazy path the correct path**." The sweep captured session *artifacts* but neither the session nor the prompt. `07.06.02` is the mechanism by which the thesis becomes a product. | Deep Think, `/ideate-discover` Step 3 |
| D-04 | **Non-blocking is absolute; the reckoning happens at the exit** | The board never blocks (`07.01.03` D-02), the capture prompt never blocks (`07.06.02` D-02), QC never blocks (`07.08.02` D-04), naming never blocks (`07.04.04` D-03). Coercion makes producers route around the platform, and a platform outside the room captures nothing. The debt accrues silently and surfaces at `07.08.03`, when the user wants to ship. **Non-blocking upstream + honest reckoning at the exit is the domain's core interaction design** — neither half works alone. | Deep Think, `/ideate-discover` Step 3; CX-07 |
| D-05 | **Measure and show; never judge.** The platform does not adjudicate craft or taste | Found five times independently: `07.02.02` D-01 (attribution is evidence, not arithmetic — never computes a split), `07.05.03` D-01 (surfaces contradictions, never resolves them), `07.07.03` D-01 (measures loudness, never prescribes it), `07.08.02` D-01 (checks only objective faults), `07.01.03` D-04 (deadlines advisory). Consistent with `.claude/rules/decision-classification.md`. | Deep Think, `/ideate-discover` Step 3 |
| D-06 | **Honest claims over false assurance** — the platform never overclaims what it cannot do | Found four times: `07.03.03` D-05 (does not claim to prevent leaks), `07.05.02` D-04 (streaming-only is not protection), `07.06.03` D-01 (archival is a probability, not a promise), `07.08.04` D-05 (`declared: none` ≠ `not reviewed`). These users are professionals; an overclaim discovered later is an unrecoverable trust breach. | Deep Think, `/ideate-discover` Step 3 |
| D-07 | **Be the record, not the tool.** WeJammin does not mix, master, comp or notate | `07.04.03` D-02 (no comping UI — Pro Tools wins), `07.07` D-02 (no mixing/mastering tools), `07.02.03` D-01 (charts, not notation), `07.09` D-03 (the bridge captures, never controls). Competing with three decades of refined craft tooling would consume the domain's entire build and lose. | Deep Think, `/ideate-discover` Step 3 |
| D-08 | **No non-web client on the producer's machine is authorised.** `meta/constraints.md`'s Desktop row is rewritten from "Not in scope. No directive." to **"not authorised; reopens only on the enumerated evidence"** — a rule with a named exit, not an absence | **Resolves Q-01.** Authorising and prohibiting decide the same strategic question in opposite directions on the same missing evidence: Q-08 and `07.09.02` Q-03 both record the track-name premise as asserted from reasoning, not verified. The four reopen-evidence items are enumerated in full at `07.09` D-05 and must be carried wherever this decision is referenced — written without them, the row reproduces the exact ambiguity it exists to close. `07.09` D-04's parser gate is a **separate, additional** gate applying *after* the surface question, never instead of it. Costs nothing in v1: no `07.09` feature is phased (feature-ledger rows 273–275). Unblocks `/create-prd-stack` — **no agent distribution, signing, notarisation or auto-update design is required for v1.** | Owner decision, 2026-07-22 (DQ-08.2) |
| D-09 | **PWA web push + in-app is the v1 delivery of `07.06.02`'s capture prompt** — both the Tier 1 contributor card and the Tier 2 Producer card | **Answers the close-prompt half of Q-02**; closes `07.06.02` Q-09 and `07.09.03` Q-03. Uses only a capability already locked into v1 (`meta/constraints.md` Mobile (PWA) row, `ideation-index.md` D-28, User 2026-07-18) — the capability needed no new authorisation; only the assignment is new. It is the only v1-available surface that can meet `07.06.02` D-09's Tier 1 requirement (≤ 5 s after the close signal, ungated) for people who are in the room now and in a car in ten minutes. `07.09.03` DT-01 stands unchanged: the web app on its own is not a prompt surface. **Payload caveat ratified with it** — with no parse in v1 the pre-fill sources are the session roll (`07.06.01`) and the roster (`07.03.01`) only, and `07.06.02` D-11 suppresses a card with neither. "Push is decided" must not be read downstream as "the card is full". | Owner decision, 2026-07-22 (DQ-08.3) |
| D-10 | **`07.09.01/.02/.03` keep `Should`, unphased — no ledger change**, and the six bridge-dependent features are **not** re-scoped | Determined by D-08. Demoting the bridge to `Won't` would close the door the evidence gate exists to hold open; the two are incompatible. `Should` + unphased is already the ledger state, so this is a confirmation rather than a change — no edit to `moscow-ledger.md` or `feature-ledger.md`. `07.04.01` Q-05's re-scope trigger therefore **does not fire**. If the gate later closes without reopening, this must be revisited to `Won't` together with that re-scope. | Owner decision, 2026-07-22 (DQ-08.4) |
| D-11 | **For the v1 window the thesis is restated**: WeJammin captures at the **first sharing moment** (the review link, `07.05.02`) plus the close prompt. **Capture-at-source is the direction, not the current claim** | D-06 makes this an obligation, not a preference — "the platform never overclaims what it cannot do… an overclaim discovered later is an unrecoverable trust breach." No `07.09` feature ships in v1 under any answer, so for the entire v1 window capture-at-source is not what the product does. Answers `07.09` Q-02 directly. The wording edits land in `vision.md`, `meta/problem-statement.md` and `meta/competitive-landscape.md` — outside this domain. Reversible if the gate reopens and the bridge is built: two edits instead of none, accepted as cheaper than carrying the overclaim. | Owner decision, 2026-07-22 (DQ-08.5) |

## Candidate Disposition — all 35 accounted for

| Disposition | Count | Detail |
|---|---|---|
| Became features (1:1) | 27 | — |
| **Merged** | 4 → 2 | 09+11 → `07.04.01`; 29+30 → `07.08.02` |
| **Split** | 1 → 2 | 19 → `07.05.01` (review) + `07.05.02` (links/analytics) — different shapes, radically different risk |
| **Re-homed** | 2 | Candidate 24's "Mix Recall" → `07.06.04`; candidate 33's music half → `07.08.01` |
| **Demoted to cross-cut** | 3 | 20 (watermarking), 32 (time tracking/billing), 33 (data portability — generic half) |
| **Added by Deep Think** | +6 | `07.06.01`, `07.06.02`, `07.08.04`, `07.09.01`, `07.09.02`, `07.09.03` |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ✅ **RESOLVED 2026-07-22 → D-08.** *(Was: does the DAW bridge (`07.09`) contradict the `single-surface` classification?)* **Answer**: no non-web client on the producer's machine is authorised, and the Desktop row in `meta/constraints.md` becomes "not authorised; reopens only on the enumerated evidence" (the four items are written out in full at `07.09` D-05). The single-surface v1 classification is unchanged. The consequences are ratified with it: `07.09` stays `Should` and unphased (D-10), the v1 capture prompt is delivered by PWA web push + in-app (D-09), and the v1 thesis is restated to capture-at-first-sharing (D-11). | — | Closed |
| Q-02 | ⚠️ **PARTIALLY RESOLVED 2026-07-22 → D-09.** *(Four features independently argue for a phone.)* **Answered**: `07.06.02` Q-04/Q-09 (the close prompt fires while packing up) and `07.09.03` Q-03 (push may beat a desktop notification) — both are closed by D-09, which assigns PWA web push + in-app as the v1 delivery using the capability `meta/constraints.md`'s Mobile (PWA) row and `ideation-index.md` D-28 already lock into v1. The mobile-surface question is therefore **not** reopened: v1 = web + PWA, native mobile stays phase 2, classification stays `single-surface`. **Still open**: `07.02.01` DT-02 (idea capture vs a lock-screen voice memo) and `07.02.03` DT-01 (charts on a music stand) — neither is a notification-delivery question and neither is answered by D-09. | User | `/ideate-validate` (remaining two features only) |
| Q-03 | **Does readiness (`07.08.03`) ever hard-block?** Everything upstream is deliberately non-blocking (D-04). If nothing ever blocks, is the debt just a number nobody acts on? Candidates for a legitimate block: DSP release (domain 12) and remix publication (`07.08` CX-05) — both external and irreversible. **The domain's central unresolved tension.** | User | `/ideate-discover` Step 5 |
| Q-04 | **Work vs recording** (`07.01.01` Q-01): is a Song one entity with typed versions, or are `work` (ISWC, publishing splits) and `recording` (ISRC, master splits) both first-class? The highest-leverage schema decision in the domain; constrains 02, 09, 10 and 12. | User | `/ideate-discover` Step 5 → `/create-prd-architecture` |
| Q-05 | **Is a session the same entity as a studio booking (16) and a service order (05)?** A booked studio day is all three at once: the Operator sells it, the Producer runs it, the platform credits from it. One entity with three lenses, or three with a shared key? | User | `/ideate-discover` Step 5 → `/create-prd-architecture` |
| Q-06 | **Is the beachhead in this domain?** `meta/problem-statement.md` Q-03 asks which consolidation surface ships first. Two candidates here: `07.05.02` (private review links — the highest-frequency professional action, and how the platform gets in the room at all) and `07.05.01` (timestamped review — table stakes, real incumbents). | User | MoSCoW / `/ideate-validate` |
| Q-07 | **Is the provenance graph exportable?** (`07.08.01` Q-02) `meta/problem-statement.md` Q-02 asks whether the lock-in is earned or hostile. This domain is where it becomes concrete: the `archive` spec gives users their audio; it does not give them the credits, splits, attestations and lineage. If those are not exportable in an open form (DDEX RIN?), the lock-in is hostile. **A values decision.** | User | `/ideate-validate` |
| Q-08 | **Is `07.09.02` DT-01's premise true?** The elegant claim — that producers already encode attribution in track names (`Sam Drums OH`) and the platform need only read it — is asserted from reasoning, not verified. In electronic production (`Kick In`, `Bass 3`) there may be no people in the names at all, and that is a large share of the market. **The strongest single assumption in this domain, and it should be tested against real sessions.** **Re-pointed 2026-07-22 (D-08)**: this is now *reopen-evidence item (b)* on the non-web-client gate at `07.09` D-05 — an owner-decision input, not tracked work, and **nobody is assigned to gather it** (Q-11). It is no longer a Step-5 investment gate, because no `07.09` feature reaches v1 under any answer. | User | Owner-decision input to `07.09` D-05 (see Q-11) |
| Q-09 | **Do specialist engineers need their own persona?** `07.07.03` Q-02 (mastering) and `07.07.05` Q-03 (Atmos) both argue that distinct professionals are folded into "Producer". Two features raising it independently echoes `meta/personas.md` Q-01's dealer question. | User | `/ideate-validate` |
| Q-10 | **Two features argue themselves out of existence**: `07.07.04` DT-01 (format masters — no provenance value, entrenched incumbents) and `07.07.05` DT-03 (Atmos — serves almost nobody in phase one). Both are proposed `Won't`. Two of five features dissolving in `07.07` is a signal about that sub-domain's scope, not just its features. | User | MoSCoW |
| Q-11 | **Who gathers the four reopen-evidence items on the non-web-client gate (D-08 / `07.09` D-05)?** The gate is written and its exit condition is enumerated, but **nobody is currently assigned to gather the evidence**, and the items are owner-decision inputs rather than tracked engineering work. Until someone is, the gate holds a door open that nothing is walking through: `07.09.01` and `07.09.02` have no answer at any horizon. Recorded as a follow-on so the absence is stated rather than discovered later. | User | Follow-on to D-08 — not gated on any pipeline stage |
| Q-12 | **Does PWA web push actually deliver on iOS Safari without the user installing the PWA to the home screen?** D-09 assigns web push as the v1 delivery of a Tier 1 ask with a ≤ 5 s ungated requirement. iOS Safari is understood to require home-screen installation before web push works at all — but **no source in this tree states that platform fact**, so it is recorded as a verification item, not asserted as one. If it holds, D-09's reach is conditional on an install step that `07.06.02`'s contributor (a session player who may not be a user at all) has not taken. **Verify before relying on D-09.** | User | `/create-prd-stack` (platform capability verification) |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-28|D-28]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-13|D-13]]
