# Real-Time Jamming & Remote Sessions — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Real-Time Jamming & Remote Sessions](./realtime-jamming-remote-sessions-index.md)
> **Status**: [DEEP]
> **Last updated**: 2026-07-18

## Cross-Cut Map

> Children of this domain: sub-domains **08.01** Latency Budget, **08.02** Playable Radius, **08.03**
> Remote Monitoring, **08.04** Talkback, **08.05** Session Capture; features **08.06** Pre-Flight,
> **08.07** Overdub, **08.08** Interruption. Edges below connect *distinct* children; interactions
> internal to a single sub-domain (e.g. 08.05.01↔08.05.02) live in that sub-domain's own CX file.

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [08.01 Latency Budget](./08.01-latency-budget-playability/08.01-latency-budget-playability-index.md) | [08.07 Overdub](./08.07-overdub-mode.md) | The red playability verdict routes into Overdub, not a refusal. Overdub then discards the **network** half of the latency budget and depends absolutely on the **local** output→input round-trip (5–25 ms), which becomes the alignment offset. | Musician, Producer | High | 08.01.02 DT-03; 08.07 DT-01/DT-04. A red verdict is a redirect; overdub keeps only the local latency half. |
| CX-02 | [08.04 Talkback](./08.04-talkback-cue-mixes/08.04-talkback-cue-mixes-index.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | **Talkback must be structurally incapable of reaching capture** — including the pre-talkback timing witness (08.05.02 R2) and any audible recording indicator, both of which would print the engineer's voice / a warning tone onto the keeper take. | Producer, Musician | High | 08.04.01 DT-01; 08.05.02→08.04.01; 08.05.01→08.04.01 (audible indicator = same failure class as talkback bleed). |
| CX-03 | [08.01 Latency Budget](./08.01-latency-budget-playability/08.01-latency-budget-playability-index.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | The shared clock's click (08.01.03) is the R1 alignment reference. 08.01.03 Q-03 (is the click recorded as a reference?) gates 08.05.02 Q-01 **and**, per DT-07, decides *at capture time* whether R2's witness must be enabled — the dependency is causal, not informational. | Producer, Musician | High | 08.05.02→08.01.03; 08.05.01→08.01.03. Sharpened CX. |
| CX-04 | [08.06 Pre-Flight](./08.06-session-preflight-rig-readiness.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | Pre-flight is where capture's hard dependencies are committed *before* cost is incurred: R1 storage durability, R2 multichannel/device access, R3 background execution, R4 app-close survival, disk ≥ 2× session size, **and the alignability pre-commitment** (per DT-07 every reference-ladder rung needs something recorded while the session runs — knowable at minute zero). | Musician, Producer | High | 08.05.01→08.06 (defines capture checks); 08.05.02→08.06 (alignability is a pre-session commitment, gap in CX). |
| CX-05 | [08.06 Pre-Flight](./08.06-session-preflight-rig-readiness.md) | [08.08 Interruption](./08.08-interruption-reconnect-continuity.md) | Together they are the domain's evidence record for technical failure — what was true before (08.06) joined to what happened during (08.08). Adjudicated by 05/24, owned by neither. | Producer, Operator, Musician | High | 08.08 DT-02. |
| CX-06 | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | [08.08 Interruption](./08.08-interruption-reconnect-continuity.md) | Every drop-and-rejoin is a presence-segment boundary. 08.08 owns the reconnect; 08.05 owns what a reconnect *means* for the record: **one attendance with a gap list, never N** (D-08), fragments aligned independently with gaps preserved as real silence, no auto-stop on unresolved disconnect. | Producer, Musician | High | 08.05.04→08.08 (state-race); 08.05.02→08.08 (D-11, unblocked); 08.05.01→08.08 (no-auto-stop D-15/DT-11). |
| CX-07 | [08.07 Overdub](./08.07-overdub-mode.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | Overdub **reuses** capture + alignment machinery (delivered bed = the R1 reference, D-02; peer-drift vanishes) but yields a **different provenance grade**: delivery-certainty (a file arrived), not performance-certainty (a human observed playing). 08.05.04's "overdub works identically → same record" edge is **wrong** and must be corrected. | Musician, Producer | High | 08.07→08.05.04 (CORRECTION, DT-08, highest Step-6 priority); 08.07→08.05.02 (alignment ref resolved). |
| CX-08 | [08.03 Remote Monitoring](./08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-index.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | Two independent edges. **(a) Semantic**: the listener roster records who *heard* (access); the attendance record records who *played* (provenance) — merging puts listeners in the credits. **(b) Resource contention**: a background take upload must never run while the endpoint is in a live room — 1.5 GB saturating the upstream sabotages the monitor stream the platform is serving. | Producer, Musician, Operator | High | 08.03.02→08.05.04 (roster ≠ attendance); 08.05.01→08.03 (upload vs monitor uplink, D-08). |
| CX-09 | [08.03 Remote Monitoring](./08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-index.md) | [08.07 Overdub](./08.07-overdub-mode.md) | Attending an overdub **live** is not convenience — it is the WITNESS that upgrades overdub's provenance grade from *delivered-by* to *observed-playing* (per CX-07). It is the only thesis link 08.03 otherwise has. | Producer, Musician | High | 08.07→08.03 (thesis-bearing, DT-08/DT-09). |
| CX-10 | [08.06 Pre-Flight](./08.06-session-preflight-rig-readiness.md) | [08.07 Overdub](./08.07-overdub-mode.md) | 08.06 knows overdub only as the *destination* of unfixable failures; overdub is also a **consumer** with its own distinct checklist — disk, sample rate, local monitoring path (DT-05), output→input round-trip calibration (DT-04) — and needs **no** reachability or uplink check. | Musician, Producer | High | 08.07→08.06 (new edge, both directions, DT-14). |
| CX-11 | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | [08.02 Playable Radius](./08.02-playable-radius-peer-matching/08.02-playable-radius-peer-matching-index.md) | A completed **live** session (08.05.04) is the strongest probe — the only evidence a given latency was musically workable, not merely measurable. Overdub says *nothing* here (no write-back), which is exactly why the loop needs live rooms. | Musician, Producer | Medium | 08.02.02 DT-03; 08.07→08.02 (no write-back confirms live-specificity). |
| CX-12 | [08.03 Remote Monitoring](./08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-index.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | A listener's "keep this" note (08.03.03) and a participant's highlight flag (08.05.03) converge on one gesture from opposite ends — different authors (heard vs played), possibly the same object. Probable merge; Step 5 must decide. | Musician, Producer | Medium | 08.03.03 Q-03 and 08.05.03 Q-03 raised independently. |
| CX-13 | [08.07 Overdub](./08.07-overdub-mode.md) | [08.02 Playable Radius](./08.02-playable-radius-peer-matching/08.02-playable-radius-peer-matching-index.md) | Overdub is the *destination* of 08.02's empty-state / match exclusions — playable radius does not apply (D-03) — and it never writes back (a completed overdub says nothing about playability). | Musician, Producer | Medium | 08.07→08.02. Consistent with CX-11's live-only synthesis. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Latency Budget ↔ Overdub

**Relationship**: The verdict (08.01.02) measures whether two people can play together in real time. When the answer is no — most pairs, most distances — the work changes **mode** rather than stopping. Overdub (08.07) removes the *network* constraint entirely: the player tracks to a locally-buffered bed. But it does not remove all latency — it depends *absolutely* on the **local** output→input round-trip (5–25 ms, DT-04), which becomes the offset alignment consumes. The domain's job is sorting work into the right mode, not gatekeeping.

**Role scoping**:
- **Musician**: the difference between "you can't work with this person" and "here's how you work with this person."
- **Producer**: staffs across both modes; needs to know the mode *before* booking.
- **Operator**: room reach determines mode; overdub needs no special room (honest to state).
- **Fan**: not affected (R-04).

**Synthesis questions answered**:
1. **Shared state conflict**: None. The verdict is read-only input to mode selection. Overdub never writes back to the latency model (CX-13).
2. **Trigger chain**: Red verdict → Overdub *offered*, never automatic (08.01.02 D-02: a red verdict never blocks). Async, user-initiated. No rollback — it is a suggestion.
3. **Permission intersection**: None. Anyone who can see a verdict can take the overdub route.
4. **Notification fan-out**: None beyond surfacing the offer.
5. **State transition conflict**: A live session degrading to overdub mid-session is plausible but likely disruptive; the local-round-trip figure overdub needs is a *different* measurement than the network verdict, so a mid-session switch is not a free reuse of state. `[Deferred — Step 5]`.

### CX-02: Talkback ↔ Session Capture

**Relationship**: The hardest constraint in the domain — one sub-domain imposing an architectural requirement on another. Talkback (08.04.01) is the engineer's voice to performers. Capture (08.05) records everything at each endpoint. These must **never meet**, and Step 6 widened the surface: the same exclusion kills two "obvious" additions. (1) The pre-talkback **timing witness** R2 (08.05.02) records what a performer *heard* — which includes talkback ducked into their cue — so a naive witness breaches the talkback wall. (2) An **audible recording indicator** would be printed onto the take by the very microphone it warns about — same failure class. The requirement is **structural, not configured**: a config flag gets flipped, defaulted wrong on a new path, or lost in a refactor.

**Role scoping**:
- **Producer**: keys talkback and owns the take; both sides land here.
- **Musician**: their performance is the take being protected.
- **Operator**: where a physical room's hardware talkback is the source (08.04.01 Q-02) — the interop case where this is most fragile.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None by design — the point is that these paths never share state. Any shared state is a defect. The R2 witness must capture a *pre-duck* tap, not the performer's actual monitor mix.
2. **Trigger chain**: The deliberate *absence* of a chain is the requirement. There is no talkback→capture edge to make sync/async decisions about.
3. **Permission intersection**: None.
4. **Notification fan-out**: None.
5. **State transition conflict**: The race is talkback (or an indicator tone) during an active take. It must be *impossible*, not handled — a handled race can be lost. Worst case: the Producer's talkback mic is also a performance mic (08.04.01 Q-01), a single source feeding both paths. That is the case an implementer gets wrong.

### CX-03: Latency Budget ↔ Session Capture

**Relationship**: Alignment (08.05.02) needs a canonical reference to place independently-recorded tracks against. The shared clock's click (08.01.03) is the R1 reference. Step 6 sharpened this from informational to **causal**: 08.01.03 Q-03 (is the click recorded as a reference?) gates 08.05.02 Q-01 (what is the reference?), *and* per DT-07 the answer decides — at capture time, before the session — whether R2's fallback witness must be enabled. The reference ladder is a **pre-session commitment**: whether a session's takes will be alignable is knowable at minute zero and cannot be retrofitted.

**Role scoping**:
- **Producer**: owns both the clock and the aligned result; feels this end to end.
- **Musician**: affected invisibly — a bad reference means their take lands wrong.
- **Operator / Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The clock owns the reference; capture embeds/records it; alignment reads it. One producer, two consumers, no write-back.
2. **Trigger chain**: Clock established → capture records against it (or enables R2 witness) → alignment reads it. If the reference is absent *and* R2 was not pre-armed, there is no correlation input: R3 timestamps plus measured directional delay may provide only a placement hint. The tracks publish **unaligned**, never as a correlation or alignment result, and the UI states that basis. Decision is at capture time; it cannot be fixed after.
3. **Permission intersection**: None.
4. **Notification fan-out**: A low-confidence alignment notifies the Producer (08.05.02 D-04/D-18). A **common-mode** failure (every track low-confidence) points at the *reference*, not the tracks, and must say so.
5. **State transition conflict**: A timing-model change mid-session (08.01.03 D-02 forbids mid-take) would invalidate the reference across the boundary — another reason that decision is locked to take boundaries.

### CX-04: Pre-Flight ↔ Session Capture

**Relationship**: Pre-flight (08.06) is the only feature that runs *before* capture cost is incurred, so it is where capture's hard dependencies are committed. 08.05.01 now *defines* those checks concretely: R1 storage durability (a browser can reclaim a recording without asking — DT-09), R2 multichannel/device access, R3 execution while unfocused, R4 survival of app close, and free disk ≥ 2× (channels × duration). Step 6 added the **alignability pre-commitment**: per DT-07 every reference-ladder rung requires something recorded while the session ran, so pre-flight must also confirm the session *will be* alignable — a distinct check from disk headroom.

**Role scoping**:
- **Musician**: their disk, their rig, their take, their loss.
- **Producer**: their session's output.
- **Operator**: their room's capture rig where the room is the endpoint.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None. Pre-flight reads conditions; capture depends on them. Separate records.
2. **Trigger chain**: Pre-flight checks (disk, device, durability, alignability) → capture proceeds. A pass is a **snapshot** (08.06 D-02) — disk can fill afterward — so capture needs its own live guard; pre-flight is not a substitute. Sync gate before the session; live guard during.
3. **Permission intersection**: The Producer sees everyone's pre-flight; a Musician sees only their own.
4. **Notification fan-out**: A disk warning must reach the participant *loudly, before* capture fails, not after.
5. **State transition conflict**: Disk fills mid-take (minute 40, largest file, keeper take). Capture must fail loudly and preserve what it has — never truncate silently (08.05.01).

### CX-05: Pre-Flight ↔ Interruption

**Relationship**: Together these are the domain's evidence record for technical failure. Pre-flight (08.06) establishes what was true before; interruption (08.08) records what happened during. A paid session that dies at minute 40 produces a dispute needing: was pre-flight run, did it pass, whose link failed, for how long, did the room hold. Neither decides commercial policy (05 owns that, 24 owns the dispute) — but together they are the only things positioned to *know*. Same structural move as 08.05.04: presence at the moment of truth, applied to blame instead of credit.

**Role scoping**:
- **Producer**: owns the session and the invoice; primary consumer.
- **Musician**: their rig may be the fault; "pre-flight passed and the ISP died" is a defence as much as an exposure.
- **Operator**: their room's endpoint may be the fault; reputation accrues from smooth sessions.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Pre-flight results and interruption events are separate immutable records joined at the session. Neither edits the other.
2. **Trigger chain**: Pre-flight (before) → session → interruption events (during) → combined record (after) → offered to 05 and 24. If the handoff fails, the records survive here. Async.
3. **Permission intersection**: Producer sees everyone's pre-flight; a Musician sees only their own — but in a dispute, the record about a Musician is disclosed to the counterparty. `[Deferred — /create-prd-security]`.
4. **Notification fan-out**: Interruptions notify the room in real time; the combined record surfaces at session end.
5. **State transition conflict**: A pre-flight that passed and a session that failed is not a contradiction — conditions change. Timestamps make it a timeline, not an inconsistency (08.06 D-02).

### CX-06: Session Capture ↔ Interruption

**Relationship**: **New for Step 6.** Every drop-and-rejoin is a presence-segment boundary in the attendance record. 08.08 owns the reconnect mechanics; 08.05 owns what a reconnect *means* for the record. Three joint constraints are load-bearing: (1) **one attendance with a gap list, never N attendances** (D-08) — the transport cannot distinguish a network drop from a walk-away, so the record carries gaps rather than fabricating multiple sessions; (2) **fragmented takes align independently**, gaps preserved as **real silence** (never concatenated-then-aligned — a concatenation is a lie about continuity, D-11), with drift rate inherited across fragments of the same clock; (3) **no auto-stop on unresolved disconnect** (D-15/DT-11) — an auto-stop fires at the exact moment 08.08 D-02 exists to handle.

**Role scoping**:
- **Producer**: reads the gapped attendance and the fragmented takes; must not be shown a falsely-continuous file.
- **Musician**: the dropped player; the first message they see on rejoin is "still recording" (08.08 D-01).
- **Operator**: read-only visibility that a session dropped (08.08 role matrix).
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Capture owns the *fact* ("still recording"); 08.08 owns *surfacing* it as the first message a dropped player sees. Single writer (capture) per segment, one consumer (08.08). The attendance record is the shared entity and capture is its owner — 08.08 contributes segment boundaries, not attendance rows.
2. **Trigger chain**: Disconnect → 08.08 records a gap boundary → capture continues locally (no auto-stop) → reconnect → segments stitched by session-relative timestamps with explicit gap markers. If reconnect never happens, the take seals with its gaps intact. Async; failure mode is *preserve*, not rollback.
3. **Permission intersection**: None new — the reconnecting identity must match the dropped one (08.08); a different identity is a new participant, not a resumption.
4. **Notification fan-out**: Interruption notifies the room live; the sealed gapped record surfaces at close.
5. **State transition conflict**: The race is auto-stop vs D-02's "still recording" guarantee — resolved by forbidding auto-stop. A second race: a fragment arriving late (08.05.02 re-anchoring, DT-12) must not silently re-place accepted tracks. Re-anchoring happens **once, at seal** — a late fragment triggering a silent re-run would invalidate a Producer's spot-check with no visible event.

### CX-07: Overdub ↔ Session Capture

**Relationship**: **New for Step 6 — the highest-priority correction.** Overdub (08.07) *reuses* capture and alignment machinery: it is one participant, one track, same binding, and its alignment reference is fully resolved — the delivered **bed, stamped by version** (D-02) — so peer-clock drift genuinely vanishes (DT-06, one interface = one clock). But 08.05.04's edge row claiming "overdub works identically → same record" is **wrong** (DT-08). Overdub yields **delivery-certainty** (the platform observed a *file arriving*), not **performance-certainty** (a human observed *playing*). A solo overdub is self-attested end to end unless a witness attends live (CX-09). One residual physics bug survives: a playback-vs-capture rate error when the bed plays out of a different clock than the take records into (a single-endpoint drift).

**Role scoping**:
- **Musician**: overdubs against the bed; their contribution is real but its *evidence grade* is lower without a live witness.
- **Producer**: receives the pass with a **grade attached** (DT-08), and must not treat delivered as observed.
- **Operator**: their room can be an overdub endpoint (see cross-domain 16) but adds acoustics, not certainty.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The attendance/provenance record (08.05.04) is the shared entity; capture owns it. Overdub writes a row with `grade = delivered-by`, never `observed-playing`. Merge strategy: grade is a property of the row, set by *how* the evidence arrived, never overwritten upward without a witness event.
2. **Trigger chain**: Bed delivered (versioned) → player tracks locally → file arrives → alignment against the bed → attendance row written at the *delivered* grade. If a live witness attended (CX-09), grade upgrades. No rollback; grade only ever rises on evidence.
3. **Permission intersection**: The binding is only as strong as the identity (cross-domain 01) — a band/shared account delivering an overdub is near content-free as evidence.
4. **Notification fan-out**: A low-confidence single-endpoint drift alignment notifies the Producer (inherits 08.05.02 D-04).
5. **State transition conflict**: Re-anchoring on a late overdub pass must obey the once-at-seal rule (DT-12, shared with CX-06). The bed version is immutable and cannot be recalled once disclosed (DT-07) — a bed edit is a new version, not a mutation.

### CX-08: Remote Monitoring ↔ Session Capture

**Relationship**: **New for Step 6 — two independent edges.** **(a) Semantic separation**: the listener roster (08.03.02) records who *heard* (access grant); the attendance record (08.05.04) records who *played* (provenance). They must stay distinct — merging puts listeners in the credits. Operative test: *bound to a track = played; on the roster = heard*; someone connected with no input device is a listener. **(b) Resource contention**: a background take upload (08.05.01) must **never** run while the endpoint is in a live room (D-08). A background upload of a 1.5 GB take saturates the upstream carrying the monitor stream (08.03.01) — the platform sabotaging the very stream it is serving.

**Role scoping**:
- **Producer**: owns both records; must reconcile "heard" vs "played" and never conflate them.
- **Musician**: appears in attendance if playing, in the roster if only listening.
- **Operator**: their room's uplink is the contended resource where the room is the endpoint.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Two distinct entities (roster vs attendance), each single-owner (08.03 owns roster, 08.05 owns attendance). No merge — the design invariant is that they are never joined into one list.
2. **Trigger chain**: (b) Live room active → upload scheduler must **defer** take uploads until the room closes → on close, uploads run. Overdub (no live room) uploads immediately (DT-07, D-08 does not bite). Sync gate keyed on room state; failure mode is degraded monitor audio, so the gate is mandatory.
3. **Permission intersection**: Roster membership authorizes the monitor stream continuously (08.03.02 CX-01); it does **not** authorize appearing in attendance. Two separate grants.
4. **Notification fan-out**: None between the two records; a deferred upload may surface a "will upload after session" status.
5. **State transition conflict**: The contention race — upload vs live stream for the same uplink — is resolved by *scheduling*, not by QoS best-effort. Revoking a roster grant mid-stream terminates that listener's receive within the same beat (08.03.02 edge) but never touches the attendance record.

### CX-09: Remote Monitoring ↔ Overdub

**Relationship**: **New for Step 6 — thesis-bearing.** Attending an overdub *live* (via 08.03's monitor stream + attendance) is the WITNESS that upgrades overdub's provenance grade from *delivered-by* to *observed-playing* (per CX-07, DT-08/DT-09). Without it, 08.03 is pure consolidation with no thesis link; this edge gives it one, and it is the only mechanism by which a solo overdub escapes being self-attested.

**Role scoping**:
- **Producer**: attends the overdub live to earn the upgraded grade; the incentive is provenance strength.
- **Musician**: performs the overdub under observation, which strengthens the evidence for their own credit.
- **Operator / Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The attendance record (owned by 08.05) is the shared entity; 08.03's live attendance contributes the witness event that sets the grade. Capture writes the grade; monitoring supplies the observation.
2. **Trigger chain**: Overdub begins → a witness joins via 08.03 → attendance records `observed-playing` for that segment → grade upgraded. If no witness, grade stays `delivered-by`. Async; upgrade-only.
3. **Permission intersection**: The witness must be on the listener roster (08.03.02) to receive the stream, and the observation is only as good as *their* identity (cross-domain 01).
4. **Notification fan-out**: None required beyond recording the witness.
5. **State transition conflict**: A witness who drops mid-overdub witnessed only the segments they were present for — the grade is per-segment, inheriting CX-06's gap-list structure, not a whole-take boolean.

### CX-10: Pre-Flight ↔ Overdub

**Relationship**: **New for Step 6, both directions.** 08.06 previously knew overdub only as the *destination* of unfixable live-session failures. But overdub is also a **consumer** of pre-flight with its **own** checklist — and a *different* one: disk, sample rate, local monitoring path (DT-05), and output→input round-trip calibration (DT-04, the offset alignment consumes), but **no** reachability and **no** uplink check (per DT-14). Running the live-session pre-flight against an overdub would fail it on checks that do not apply.

**Role scoping**:
- **Musician**: runs the overdub-specific pre-flight; the round-trip calibration is the load-bearing new step.
- **Producer**: relies on the calibration being correct for alignment to land.
- **Operator / Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None. Pre-flight reads rig conditions; overdub consumes them. The two checklists (live vs overdub) are variants selected by mode, not a shared mutable object.
2. **Trigger chain**: Mode = overdub → run overdub checklist (disk, sample rate, monitoring path, round-trip calibration) → overdub proceeds. Skip reachability/uplink. Sync gate before tracking.
3. **Permission intersection**: None.
4. **Notification fan-out**: A failed round-trip calibration must warn *before* tracking — a wrong offset silently mis-aligns every take.
5. **State transition conflict**: The round-trip figure is a *snapshot*; a device change between calibration and tracking (e.g. switching interfaces) invalidates it — the same snapshot-vs-live tension as CX-04, resolved by re-calibrating on device change.

---

### Medium-confidence entries (synthesis deferred)

**CX-11: Session Capture ↔ Playable Radius** — `[Deferred — Step 5]`. The radius correction loop (08.02.02) needs evidence about what is *playable*, not merely *measurable*; a completed **live** session (08.05.04) is the only such probe. The open question: does *completion* imply playability at all — people finish bad sessions? Overdub explicitly writes nothing back (CX-13), which confirms this loop is live-room-specific and is why 08.02 does not fully survive a MoSCoW cut of the rooms.

**CX-12: Remote Monitoring ↔ Session Capture (highlights)** — `[Deferred — Step 5]`. A listener's "keep this" note (08.03.03) and a participant's highlight flag (08.05.03) are the same gesture from opposite ends — different authors (heard vs played), different timelines (delay-shifted vs canonical), possibly the same object. Both files independently raised whether the other absorbs it. Flagged as a probable merge; Step 5 should decide rather than let both build it.

**CX-13: Overdub ↔ Playable Radius** — `[Deferred — Step 5]`. Overdub is the *destination* of 08.02's empty-state and match exclusions (playable radius does not apply, D-03) and never writes back — a completed overdub says nothing about playability. This is the mirror of CX-11's live-only synthesis.

---

## Cross-Cuts Escalated to the Global CX File

> Mechanisms serving many domains. **Not** nodes in domain 08. Recorded here so the global CX file
> (`ideation-cx.md`, orchestrator-owned) can absorb them.

| Mechanism | Serves | Domain 08's relationship |
|-----------|--------|-------------------------|
| **Real-Time Rooms, Presence & Audio Transport** | 03, 05, 06, 07, 08, 17, 18 | Extracted by D-15; 08 consumes, does not own. **Finding for `/create-prd`**: monitoring (08.03) and jam rooms (08.01) want *contradictory* tuning from the same pipe — quality-over-latency vs latency-over-everything. One cross-cut, two opposed targets. |
| **Endpoint uplink arbitration (background sync vs live transport)** | 07, 08, and any domain with large uploads + live streams | **New — see CX-08(b).** The transport cross-cut moves *live* packets; it does not arbitrate the platform's own background take-uploads against that live stream on a shared uplink. A session-aware upload scheduler is required so the platform does not sabotage its own monitor stream. Routes to `/create-prd-architecture`. |
| **Graded provenance / observation-strength ladder** | 02, 08, 09 | **New — see CX-07/CX-09.** 08.05.04 emits not a boolean but a *grade* (`delivered-by` < `observed-playing` < `session-captured+attested`, DT-08). 02.04.02 consumes the grade as the top rung of its tier ladder. The grade dimension is new relative to the registry's flat "session attendance → provenance ledger" line. |
| **`playable-with?` predicate** | 03, 04, 05, 06 | Domain 08 **owns the definition** (08.02.03); consumers read the answer in their own search surfaces and may not apply their own thresholds. Note 04.02.02: latency-match (playing together) must NOT be conflated with travel-time match to a place. |
| **Session attendance → provenance ledger** | 02, 09 | 08 owns the **observation** (08.05.04); 02 owns the **conclusion** (is it a credit?); 09 consumes it as split *evidence, never a split*. The observation cannot be extracted — only made where the transport is, while the session runs. |
| **Captured stems → project assets** | 07 | Aligned multitrack (08.05.01 + 08.05.02) lands in 07 with a `relative` vs `absolute` timebase declaration (DT-16) — a 50 ppm reference makes the whole multitrack 50 ppm fast, inaudible until it meets 07's tempo grid. 08 cannot own the asset lifecycle; 07 cannot manufacture the alignment. |
| **Live session notes → project review timeline** | 07 | 08 captures the note (only 08 knows the listener's stream delay); 07 owns its life. |
| **Technical-failure record → billing & disputes** | 05, 24 | 08.06 + 08.08 produce the facts; 05 owns billing policy; 24 owns the dispute. Neither can observe what the room did. |

## Not-Product Concerns Routed Out

| Concern | Why it is not product | Routed to |
|---------|----------------------|-----------|
| Media infrastructure (SFU/MCU, TURN/STUN, NAT traversal, jitter buffers, media servers) | Infrastructure. Contradicts `meta/constraints.md` — will not run on Cloudflare Workers + Supabase. | `/create-prd-stack`, `/create-prd-architecture` |
| Codec selection & audio DSP pipeline | Architecture. The *quality contract* (08.03.01) is product; the codec is not. | `/create-prd-architecture` |
| Clock synchronisation protocol (NTP/PTP-style disciplining) | Architecture. *Who* the timing reference is (08.01.03) is product; how clocks are disciplined is not. | `/create-prd-architecture` |
| Route/topology data sourcing (peering databases, BGP-derived priors) | Architecture. The radius (08.02) is product; where the priors come from is not. | `/create-prd-architecture` |
| Reconnection / ICE restart / session resumption mechanics | Architecture. What the room *does* on interruption (08.08) is product; how the socket comes back is not. | `/create-prd-architecture` |
| Uplink QoS enforcement mechanism | Architecture. The *rule* (defer uploads during a live room, CX-08b) is product; the QoS/scheduling mechanism is not. | `/create-prd-architecture` |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 08.02 Playable Radius | 08.03 Remote Monitoring | Considered: filter monitoring listeners by latency. Rejected — monitoring is deliberately latency-tolerant (08.03 D-01); it is the one part of the domain physics does not constrain. Applying the radius would exclude listeners for no reason. |
| R-02 | 08.04 Talkback & Cue Mixes | 08.07 Overdub | Considered: cue mixes for overdubbing players. Rejected — an overdubbing player balances a *local* bed against a *local* input; that is a local playback control, not a networked cue mix. No other performers, no network in the path (08.04 Q-03, answered). |
| R-03 | 08.03 Remote Monitoring | 08.02 Playable Radius | Considered: put monitoring-capable rooms on the radius map. Rejected — the map's semantic is "who can I *play* with"; monitoring has no playing in it. A second physics-free layer would make the boundary mean two things. |
| R-04 | Any domain 08 child | Fan persona | Deliberate: **no child of domain 08 has a Fan surface.** Rejected at three points — fan listening rooms (08.03 D-04), fan-facing "musicians near you" (08.02.01 DT-03), live fan reactions (08.03 CX R-03). All belong to Community (03) and Fanbase (20). Per `meta/personas.md` the Fan has no professional stake; per D-13 they bring a moderation population with no business near unreleased masters. The uniform `❌ None` is a finding, not an oversight. |
| R-05 | 08.06 Pre-Flight | 08.02 Playable Radius | Considered: pre-flight results as radius input. Rejected as a *pair* — pre-flight is pass/fail on a rig; the radius is a measured latency model. The shared input is the measurement (08.01.01), which already pairs with each; this edge would double-count it. |
| R-06 | 08.07 Overdub | 08.04 Talkback | Considered (again, from the overdub side): route talkback into an attended overdub. Rejected — even when a Producer attends an overdub live (CX-09), the talkback→capture wall (CX-02) is unconditional; an attended overdub is still a take being protected, so the witness hears via monitoring, never via a path that can reach the record. |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-08|D-08]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-13|D-13]]
