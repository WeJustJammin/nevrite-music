# Real-Time Jamming & Remote Sessions — Cross-Cuts

> **Level**: domain
> **Scope**: Connections between children of [Real-Time Jamming & Remote Sessions](./realtime-jamming-remote-sessions-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16

## Cross-Cut Map

| # | Source | Target | Relationship | Roles Affected | Confidence | Evidence |
|---|--------|--------|--------------|----------------|------------|----------|
| CX-01 | [08.01 Latency Budget](./08.01-latency-budget-playability/08.01-latency-budget-playability-index.md) | [08.07 Overdub Mode](./08.07-overdub-mode.md) | The playability verdict's red state routes into Overdub. The domain's job is sorting work into the right mode, not gatekeeping. | Musician, Producer | High | 08.01.02 DT-03; 08.07 DT-01. Most remote work is latency-indifferent, so a red verdict is a redirect, not a refusal. |
| CX-02 | [08.04 Talkback & Cue Mixes](./08.04-talkback-cue-mixes/08.04-talkback-cue-mixes-index.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | **Talkback must be structurally incapable of reaching capture.** Not configured off — architecturally disconnected. | Producer, Musician | High | 08.04.01 DT-01. "Record everything, filter later" is a correct software default and a catastrophic audio one; the take it ruins is by definition the keeper. |
| CX-03 | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | [08.02 Playable Radius](./08.02-playable-radius-peer-matching/08.02-playable-radius-peer-matching-index.md) | A completed session is the strongest possible probe — the only evidence that a given latency was *musically* workable, not merely measurable. | Musician, Producer | Medium | 08.02.02 DT-03: probes calibrate the network model but cannot calibrate the musical threshold. |
| CX-04 | [08.01 Latency Budget](./08.01-latency-budget-playability/08.01-latency-budget-playability-index.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | The shared clock's reference is what makes locally-recorded tracks alignable. Without a reference in the capture, alignment is guesswork. | Producer | High | 08.05.02 Q-01 (what is the reference?) is gated by 08.01.03 Q-03 (is the click recorded as one?). |
| CX-05 | [08.06 Pre-Flight](./08.06-session-preflight-rig-readiness.md) | [08.08 Interruption & Reconnect](./08.08-interruption-reconnect-continuity.md) | Together they form the evidence record a billing dispute is adjudicated against. | Producer, Operator, Musician | High | 08.08 DT-02: 05 owns the booking, 24 owns the dispute, neither owns what the room did. |
| CX-06 | [08.03 Remote Monitoring](./08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-index.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | A "keep this" listener note and a participant's highlight flag are converging on one gesture from opposite ends. Probable duplicate. | Musician, Producer | Medium | Raised independently in 08.03.03 Q-03 and 08.05.03 Q-03 — two features arrived at the same question. |
| CX-07 | [08.06 Pre-Flight](./08.06-session-preflight-rig-readiness.md) | [08.05 Session Capture](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | Disk headroom is a pre-flight check because exhausting it mid-take destroys the asset rather than the experience. | Musician, Producer | High | 08.05.01: local disk is a hard dependency of local-first capture, and it fails at minute 40 of the good take. |

> **Confidence levels:** High (confirmed with evidence), Medium (strong signal, needs validation), Low (hypothesis)

---

## Cross-Cut Details

### CX-01: Latency Budget ↔ Overdub Mode

**Relationship**: The verdict (08.01.02) measures whether two people can play together in real time. When
the answer is no — which is most of the time, for most pairs, at most distances — the work does not stop
being possible. It changes mode. Overdub (08.07) removes the physics constraint entirely because the
player tracks to local playback. This edge is the domain's central product loop: measure, judge, route.

**Role scoping**:
- **Musician**: experiences this as the difference between "you can't work with this person" and "here's how you work with this person". The emotional register of the whole domain turns on this edge existing.
- **Producer**: staffs sessions across both modes; needs to know which mode a collaboration is *before* booking.
- **Operator**: their room's reach determines which mode a booking is — and overdub needs no special room, which is honest to state (08.07 Role Lens).
- **Fan**: not affected. No fan path anywhere in this domain (see R-04).

**Synthesis questions answered**:
1. **Shared state conflict**: None. The verdict is read-only input to a mode selection. Overdub does not write back to the latency model — a completed overdub says nothing about playability, which is exactly why CX-03 depends on *live* sessions specifically.
2. **Trigger chain**: Red verdict → Overdub offered. Not automatic — an automatic mode switch would be a surprise, and the user may want to try anyway (08.01.02 D-02: a red verdict never blocks).
3. **Permission intersection**: None. Anyone who can see a verdict can take the overdub route.
4. **Notification fan-out**: None.
5. **State transition conflict**: A session that starts live and degrades could in principle fall back to overdub mid-session. `[PENDING — /ideate-discover Step 5 deepening]` — plausible but likely disruptive enough not to be worth it.

### CX-02: Talkback ↔ Session Capture

**Relationship**: The hardest constraint in the domain, and one sub-domain imposing an architectural
requirement on another. Talkback (08.04.01) is the engineer's voice to performers. Capture (08.05.01)
records everything at each endpoint. These must never meet. The engineer saying "that was rubbish, go
again" baked into a keeper take is unrecoverable, and the failure only manifests on takes worth keeping.

The requirement is **structural, not configured**. A config flag is a thing that gets flipped, defaulted
wrong on a new code path, or lost in a refactor. The capture path must not be wired to receive talkback
at all.

**Role scoping**:
- **Producer**: keys talkback and owns the take. Both sides of this land on them.
- **Musician**: their performance is the take being protected.
- **Operator**: relevant where a physical room's hardware talkback is the source (08.04.01 Q-02) — the interop case is where this gets violated.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None by design — the entire point is that these two never share a path. Any shared state here is a defect.
2. **Trigger chain**: None. The deliberate absence of a chain *is* the requirement.
3. **Permission intersection**: None.
4. **Notification fan-out**: None.
5. **State transition conflict**: The race is talkback during an active take. It must be impossible rather than handled — a handled race is a race that can be lost. Note 08.04.01 Q-01: when the Producer's talkback mic is also a performance mic they share a source, and this constraint is at its most fragile. That is the case an implementer will get wrong.

### CX-03: Session Capture ↔ Playable Radius

**Relationship**: `[PARTIAL]` — the radius correction loop (08.02.02) needs evidence about what is
*playable*, not merely what is *measurable*. A probe returns milliseconds; only a completed live session
tells you whether those milliseconds were musically workable for that instrument pair. The attendance
record (08.05.04) is where "this actually worked" is observed.

The dependency is uncomfortable and worth naming: the correction loop's best data source only exists if
real-time rooms ship, and the rooms are the part of the domain most likely to be cut. 08.02.02 DT-03
concluded probes can bootstrap the network model but cannot calibrate the musical threshold — so this
edge is why 08.02 does not fully survive a MoSCoW cut of the rooms.

**Role scoping**:
- **Musician**: their completed sessions silently improve their own radius accuracy and other people's.
- **Producer**: better staffing data over time.
- **Operator**: their room's advertised reach becomes evidence-backed rather than claimed.
- **Fan**: not affected.

**Synthesis questions answered**: `[PENDING — /ideate-discover Step 5 deepening]` — Medium confidence, deferred per the CX template's rule for non-High entries. The live question is whether a session's *completion* implies playability at all — people finish bad sessions.

### CX-04: Latency Budget ↔ Session Capture

**Relationship**: Alignment (08.05.02) needs a canonical reference to place independently-recorded tracks
against. The shared clock (08.01.03) is the only thing in the domain that could supply one. If the click
is not recorded into (or alongside) the capture, alignment falls back to correlation or timestamps —
both weaker. A genuine unresolved dependency: 08.05.02 Q-01 asks what the reference is, 08.01.03 Q-03
asks whether the click is recorded as one. Neither is answerable alone.

**Role scoping**:
- **Producer**: owns both the clock and the aligned result; the only persona who feels this end to end.
- **Musician**: affected invisibly — a bad reference means their take lands wrong.
- **Operator** / **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: The clock owns the reference; capture embeds or records it; alignment reads it. One producer, two consumers, no write-back.
2. **Trigger chain**: Clock established → capture records against it → alignment reads it. If the reference is absent, alignment degrades to correlation rather than failing — and must state which method it used, because the confidence differs materially.
3. **Permission intersection**: None.
4. **Notification fan-out**: A low-confidence alignment must notify the Producer (08.05.02 D-04) — the dangerous failure is one that looks finished.
5. **State transition conflict**: A timing model change mid-session (08.01.03 D-02 forbids mid-take) would invalidate the reference across the boundary. Another reason that decision is locked to take boundaries.

### CX-05: Pre-Flight ↔ Interruption & Reconnect

**Relationship**: Together these are the domain's evidence record for technical failure. Pre-flight
(08.06) establishes what was true before; interruption (08.08) records what happened during. A paid
session that dies at minute 40 produces a dispute, and the dispute needs: was pre-flight run, did it
pass, whose link failed, for how long, did the room hold. Neither feature decides the commercial policy —
domain 05 owns that — but together they are the only things positioned to know the facts.

This is the same structural move as 08.05.04: presence at the moment of truth is what makes a record
possible rather than a reconstruction. Applied to blame instead of credit.

**Role scoping**:
- **Producer**: owns the session and the invoice; primary consumer of both records.
- **Musician**: their rig may be the fault; the record protects them as much as it exposes them — "pre-flight passed and the ISP died" is a defence.
- **Operator**: their room's endpoint may be the fault, and per `meta/personas.md` their reputation accrues from sessions that went smoothly.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: Pre-flight results and interruption events are separate immutable records joined at the session. Neither edits the other.
2. **Trigger chain**: Pre-flight (before) → session → interruption events (during) → combined record (after) → offered to 05 and 24. If the handoff fails, the records survive here.
3. **Permission intersection**: Yes — the Producer sees everyone's pre-flight; a Musician sees only their own. But in a dispute, the record about a Musician is disclosed to the counterparty. A real privacy consequence of a dispute. `[PENDING — /create-prd-security]`.
4. **Notification fan-out**: Interruptions notify the room in real time; the combined record surfaces at session end.
5. **State transition conflict**: A pre-flight that passed and a session that failed is not a contradiction — conditions change. The record carries timestamps so this reads as a timeline rather than an inconsistency (08.06 D-02).

### CX-06: Remote Monitoring ↔ Session Capture

**Relationship**: `[PARTIAL]` — a listener's "keep this" note (08.03.03) and a participant's highlight
flag (08.05.03) are the same gesture arrived at from opposite ends. Both features independently raised
whether the other absorbs it (08.03.03 Q-03, 08.05.03 Q-03), which is itself evidence the split may be
wrong.

The distinction that might justify keeping both: 08.03.03's notes come from *listeners* (not playing,
delay-shifted, possibly clients); 08.05.03's flags come from *participants* (playing, on the canonical
timeline, made the thing). Different authors, different timelines, possibly the same object. Step 5
should decide rather than let both build it.

**Role scoping**:
- **Musician**: flags as a participant, may also note as a listener — would experience two mechanisms for one intent.
- **Producer**: receives both and would have to reconcile them.
- **Operator** / **Fan**: not affected.

**Synthesis questions answered**: `[PENDING — /ideate-discover Step 5 deepening]` — Medium confidence. Flagged as a probable merge.

### CX-07: Pre-Flight ↔ Session Capture

**Relationship**: Local-first capture (08.05.01) depends on local disk, and disk exhaustion is the failure
that destroys the *asset* rather than the experience — the one thing local-first was chosen to protect.
It also fails at the worst moment: minute 40, during the take worth keeping, because that is when the
file is largest. Pre-flight is where this is caught, because it is the only feature that runs before the
cost is incurred.

**Role scoping**:
- **Musician**: their disk, their take, their loss.
- **Producer**: their session's output.
- **Operator**: their room's capture rig where the room is the endpoint.
- **Fan**: not affected.

**Synthesis questions answered**:
1. **Shared state conflict**: None. Pre-flight reads a condition; capture depends on it.
2. **Trigger chain**: Pre-flight checks headroom → capture proceeds. But a pre-flight pass is a snapshot (08.06 D-02) — something else can fill the disk afterward, so capture needs its own live guard. Pre-flight is not a substitute for it.
3. **Permission intersection**: None.
4. **Notification fan-out**: A disk warning must reach the participant loudly *before* capture fails, not after.
5. **State transition conflict**: Disk fills mid-take. Capture must fail loudly and preserve what it has, never truncate silently (08.05.01).

---

## Cross-Cuts Escalated to the Global CX File

> These are mechanisms serving many domains. They are **not** nodes in domain 08. Recorded here so the
> global CX file (`ideation-cx.md`, orchestrator-owned) can absorb them.

| Mechanism | Serves | Domain 08's relationship |
|-----------|--------|-------------------------|
| **Real-Time Rooms, Presence & Audio Transport** | 03, 05, 06, 07, 08 | Already extracted by D-15. Re-affirmed — 08 consumes it and does not own it. **New finding for `/create-prd`**: monitoring (08.03) and jam rooms (08.01) want *contradictory* tuning from the same pipe — quality-over-latency vs latency-over-everything. One cross-cut, two opposed targets. |
| **`playable-with?` predicate** | 03, 04, 05, 06 | Domain 08 **owns the definition** (08.02.03); those domains consume the answer in their own search surfaces. Consumers may not apply their own thresholds. Same line the domain index draws with Stripe/Payments vs Gear Marketplace. |
| **Session attendance → provenance ledger** | 02, 09 | Domain 08 owns the **observation** (08.05.04); 02 owns the **conclusion** (is it a credit?); 09 consumes it as split evidence. The observation cannot be extracted — it can only be made where the transport is, while the session runs. |
| **Captured stems → project assets** | 07 | Aligned multitrack (08.05.01 + 08.05.02) lands in 07. 08 cannot own the asset lifecycle; 07 cannot manufacture the alignment (08.05.02 DT-03). |
| **Live session notes → project review timeline** | 07 | 08 captures the note (only 08 knows the listener's stream delay); 07 owns its life. See 08.03 index D-03. |
| **Technical-failure record → billing & disputes** | 05, 24 | 08.06 + 08.08 produce the facts; 05 owns the billing policy; 24 owns the dispute process. Neither can observe what the room did. |

## Not-Product Concerns Routed Out

| Concern | Why it is not product | Routed to |
|---------|----------------------|-----------|
| Media infrastructure (SFU/MCU, TURN/STUN, NAT traversal, jitter buffers, media servers) | Infrastructure. **Directly contradicts `meta/constraints.md`** — will not run on Cloudflare Workers + Supabase. The domain index already concedes this. | `/create-prd-stack`, `/create-prd-architecture` |
| Codec selection & audio DSP pipeline | Architecture. The *quality contract* (08.03.01) is product; the codec is not. | `/create-prd-architecture` |
| Clock synchronisation protocol (NTP/PTP-style disciplining) | Architecture. Who the timing reference *is* (08.01.03) is product; how clocks are disciplined is not. | `/create-prd-architecture` |
| Route/topology data sourcing (peering databases, BGP-derived priors) | Architecture. The radius (08.02) is product; where the priors come from is not. | `/create-prd-architecture` |
| Reconnection / ICE restart / session resumption mechanics | Architecture. What the room *does* on interruption (08.08) is product; how the socket comes back is not. | `/create-prd-architecture` |

---

## Rejected Pairs

| # | Source | Target | Reason for Rejection |
|---|--------|--------|---------------------|
| R-01 | 08.02 Playable Radius | 08.03 Remote Monitoring | Considered: filter monitoring listeners by latency. Rejected — monitoring is deliberately latency-tolerant (08.03 index D-01); it is the one part of the domain physics does not constrain. Applying the radius here would import a limit that does not apply and exclude listeners for no reason. |
| R-02 | 08.04 Talkback & Cue Mixes | 08.07 Overdub Mode | Considered: cue mixes for overdubbing players. Rejected — an overdubbing player balances a local bed against a local input. That is a local playback control, not a networked cue mix; there are no other performers and no network in the path. Raised as 08.04 Q-03 and answered here: no relationship. |
| R-03 | 08.03 Remote Monitoring | 08.02 Playable Radius | Considered: put monitoring-capable rooms on the radius map. Rejected — the map's semantic is "who can I *play* with", and monitoring has no playing in it. A second, physics-free layer would make the boundary mean two things. |
| R-04 | Any domain 08 child | Fan persona | Explicit and deliberate: **no child of domain 08 has a Fan surface.** Considered and rejected at three points — fan listening rooms (08.03 D-04), fan-facing "musicians near you" (08.02.01 DT-03), live fan reactions (08.03 CX R-03). All belong to Community (03) and Fanbase (20), which the domain map split out at ratification. Per `meta/personas.md` the Fan has no professional stake and will not tolerate professional-tool complexity; per D-13 they bring a moderation population that has no business in a room containing unreleased masters. The uniform `❌ None` in every Role Matrix here is a finding, not an oversight. |
| R-05 | 08.06 Pre-Flight | 08.02 Playable Radius | Considered: pre-flight results as radius input. Rejected as a *pair* — pre-flight is pass/fail on a rig; the radius is a measured latency model. The measurement (08.01.01) is the shared input to both and already pairs with each. Adding this edge would double-count that relationship. |
