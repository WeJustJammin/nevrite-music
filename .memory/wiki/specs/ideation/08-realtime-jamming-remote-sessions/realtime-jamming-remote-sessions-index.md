# Real-Time Jamming & Remote Sessions — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-16
> **Novelty**: `industry-standard` | **Priority**: `important`

## Overview

Synchronous music over the network — low-latency jam rooms with geographic peer matching, high-fidelity remote session monitoring and talkback, and multitrack capture of what happened.

**Why this is a top-level domain**: Renamed to drop the 'Collaboration' collision with domain 07, and narrowed hard in response to the strongest objection in the verification set. That objection's invocation test is correct — Education's lesson room, Services' remote session, Projects' live mix attendance and Community's jam spaces all call the same pipe — so I extracted the pipe as the 'Real-Time Rooms, Presence & Audio Transport' cross-cut and stripped the borrowed children (presence/multiplayer to the cross-cut; listening rooms split to Community and Fanbase). But the objection over-reached in concluding the destination does not exist, and it defeats itself with its own analogy: Stripe is standalone and Payments is a cross-cut here, yet Gear Marketplace is still a domain. A cross-cut pipe does not preclude a destination built on it. What survives extraction has interacting capabilities and is unowned by any sibling: the 25-30ms desync ceiling caps the playable radius at a few hundred miles, which turns latency budgeting into a matching feature ('show me who I can actually play with') that is a product decision, not infrastructure; and high-fidelity remote monitoring is a proven paid category with the inverse trade-off — loose latency, uncompromising audio quality — where Zoom's codec destroys exactly what is being judged (Audiomovers Listento, acquired by Abbey Road/Universal; Source-Connect is the broadcast standard). Two honest counter-facts the owner must weigh, both surfaced as owner decision #4: this is NOT directed by anything the owner said — only by the product's name, which is aspiration, not evidence — and per the not-product routing it will not run on Cloudflare Workers + Supabase and needs dedicated media infrastructure. Novelty retagged from 'user-directive' to 'industry-standard': nothing in D-01..D-09 sources it, and JamKazam/JackTrip/Jamulus/SonoBus/Elk LIVE make it an existing category rather than whitespace.

**Interacting capabilities** (what justifies domain status):

- low-latency jam rooms & latency budgeting
- geographic peer/playable-radius matching
- high-fidelity remote session monitoring
- in-room talkback & cue mixes
- multitrack capture of network sessions

## What the Breadth Pass Found

> Three findings that materially change this domain's case, surfaced during classification and
> flagged here because they should reach the owner before MoSCoW.

**1. The domain has a real thesis link, and it is the strongest in the product.**
[08.05.04 Session Attendance Record & Provenance Capture](./08.05-session-capture-recall/08.05.04-session-attendance-provenance.md)
is D-18's wedge expressed here: **a network session is the most instrumentable room that has ever
existed.** The platform *is* the transport, so who played what is *observed*, not remembered. Per
`meta/problem-statement.md`, the root cause of music's most litigated failure is "absence at the point of
truth" — and here, absence is structurally impossible. Every incumbent (Jaxsta, Muso.AI, Sound Credit,
the MLC) is "asking people to remember." This domain does not have to. Nothing in the sweep's candidate
list contained this.

**2. Most "remote session" work never needed low latency at all.**
[08.07 Overdub Mode](./08.07-overdub-mode.md) — a player tracks against locally-buffered playback,
records locally, take aligned afterward. Latency is *irrelevant*. A vocalist comping, a guitarist on a
finished bed, a session drummer replacing a programmed part: none need sub-30 ms, and all are what people
mean by "remote session." The candidate list assumed simultaneity throughout, which reads as an artifact
of the domain's **name** rather than an observation about the work.

**3. Consequence: the domain is shippable without contradicting `meta/constraints.md`.**
Overdub needs file storage and background jobs — no media infrastructure. And it carries the provenance
(08.05.04) intact. Without this finding, the honest recommendation for domain 08 would be `wont` in its
entirety, since the thesis half cannot ship without a session mechanism and every session mechanism was
infrastructure-blocked. **The counter-consideration is in D-06 below and it is serious.**

## Children

> Classified through the Node Classification Gate. 5 sub-domains, 3 domain-level features, 20 leaf features.
> All `[SURFACE]` — breadth pass only; depth is allocated by MoSCoW in `/ideate-discover` Step 5.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 08.01 | Latency Budget & Playability | sub-domain | [08.01-latency-budget-playability/](./08.01-latency-budget-playability/08.01-latency-budget-playability-index.md) | `[BREADTH]` | 9 hypotheses (3 features) |
| 08.02 | Playable Radius & Peer Matching | sub-domain | [08.02-playable-radius-peer-matching/](./08.02-playable-radius-peer-matching/08.02-playable-radius-peer-matching-index.md) | `[BREADTH]` | 9 hypotheses (3 features) |
| 08.03 | Remote Monitoring & Session Attendance | sub-domain | [08.03-remote-monitoring-session-attendance/](./08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-index.md) | `[BREADTH]` | 14 hypotheses (4 features) |
| 08.04 | Talkback & Cue Mixes | sub-domain | [08.04-talkback-cue-mixes/](./08.04-talkback-cue-mixes/08.04-talkback-cue-mixes-index.md) | `[BREADTH]` | 9 hypotheses (3 features) |
| 08.05 | Session Capture & Recall | sub-domain | [08.05-session-capture-recall/](./08.05-session-capture-recall/08.05-session-capture-recall-index.md) | `[BREADTH]` | 43 hypotheses (4 features) |
| 08.06 | Session Pre-Flight & Rig Readiness Check | feature | [08.06-session-preflight-rig-readiness.md](./08.06-session-preflight-rig-readiness.md) | `[SURFACE]` | 3 hypotheses |
| 08.07 | Overdub Mode (Latency-Independent Tracking) | feature | [08.07-overdub-mode.md](./08.07-overdub-mode.md) | `[DEEP]` | 15 hypotheses |
| 08.08 | Interruption, Reconnect & Session Continuity | feature | [08.08-interruption-reconnect-continuity.md](./08.08-interruption-reconnect-continuity.md) | `[SURFACE]` | 3 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)

### Classification Record

| Sweep candidate | Outcome |
|---|---|
| 01 Low-Latency Jam Rooms & Latency Budgeting | → **08.01** sub-domain. The *room* is the transport cross-cut (D-15); what is domain-owned is the interpretation of latency into a human judgment. |
| 02 Geographic Peer Matching & Playable-Radius Discovery | → **08.02** sub-domain. |
| 03 Remote Session Attendance & High-Fidelity Live Monitoring | → **08.03** sub-domain. |
| 04 In-Room Talkback & Cue Mixes | → **08.04** sub-domain. |
| 05 Rehearsal & Jam Capture with Auto-Highlights | → **MERGED** into 08.05. Near-duplicate of 06. |
| 06 Multitrack Capture of Network Sessions | → **MERGED** into 08.05. Both are "capture what happened in a network session"; highlights is a feature inside capture, not a parallel product. |

**Deep Think additions** (not in the candidate list): 08.01.03 Shared Clock, 08.02.02 Route-Aware
Correction, 08.03.04 Monitoring Trust, 08.04.03 Cue Mix Recall, 08.05.02 Take Alignment, **08.05.04
Session Attendance & Provenance**, 08.06 Pre-Flight, **08.07 Overdub Mode**, 08.08 Interruption & Reconnect.

## Role Matrix

> Personas from [meta/personas.md](../meta/personas.md). Never redefined here — referenced only.

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 08.01 Latency Budget & Playability | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 08.02 Playable Radius & Peer Matching | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 08.03 Remote Monitoring & Session Attendance | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 08.04 Talkback & Cue Mixes | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 08.05 Session Capture & Recall | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 08.06 Session Pre-Flight & Rig Readiness | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 08.07 Overdub Mode | ✅ Full | ✅ Full | ⚙️ Config | ❌ None |
| 08.08 Interruption, Reconnect & Continuity | ✅ Full | ✅ Full | 👁️ Read-only | ❌ None |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
>
> **Fan is `None` across the entire domain — this is a finding, not an oversight.** Fan surfaces were
> considered and rejected at three separate points (fan listening rooms, fan-facing "musicians near you",
> live fan reactions) and all belong to Community (03) and Fanbase (20), which the domain map split out
> at ratification. Per `meta/personas.md` the Fan has no professional stake and will not tolerate
> professional-tool complexity; per D-13 they bring a moderation population with no business in a room
> containing unreleased masters. See [CX R-04](./realtime-jamming-remote-sessions-cx.md#rejected-pairs).
>
> **Operator is `Config`, not `None`** — a studio is an *endpoint* with known-good infrastructure and
> sells remote-session capability as an amenity. They configure their room's participation; they do not
> run other people's sessions. Where an Operator runs a session, they are acting as Producer — per
> `meta/personas.md`, personas are lenses on behaviour, not account types.
>
> **Every cell in this table is the widest grant any child confers — read the child matrix for the
> per-feature truth.** The roll-up flatters 08.03 in particular: the Musician's `Full` there comes from
> **08.03.03 Live Listener Feedback** alone (*"Can leave notes as a listener — a bandmate attending a mix
> they are not playing on"*). On the stream itself (08.03.01) and the roster (08.03.02) the Musician is
> `Read-only` — they are owed the fact that a stream of their performance is going somewhere, they do not
> configure it — and on 08.03.04 they hold `Config` over their own declared playback chain and nothing
> else. See the [08.03 Role Matrix](./08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-index.md#role-matrix).

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Renamed to drop the 'Collaboration' collision with domain 07, and narrowed hard in response to the strongest objection in the verification set. The transport pipe was extracted as a cross-cut; what survives has interacting capabilities unowned by any sibling. | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | Sweep candidates 05 and 06 MERGED into 08.05 Session Capture & Recall | Near-duplicates — both are "capture what happened in a network session". Highlights is a feature inside capture, not a parallel product. The sweep was tuned for coverage, not discipline. | Agent, Node Classification Gate, 2026-07-16 |
| D-03 | The transport/interpretation line is the domain's organising boundary | D-15 extracted the pipe. This domain consistently owns *interpretation* (what a human is told, what they may do about it) and never *transport* (how packets move). Applied uniformly: 08.01 interprets latency, 08.03 contracts quality, 08.04 defines routing semantics, 08.08 decides what the room does on failure. | Agent, derived from D-15, 2026-07-16 |
| D-04 | **08.05.04 (Session Attendance & Provenance) is the domain's thesis link and ships with any session mechanism, including Overdub** | A network session is the most instrumentable room that exists — the platform *is* the transport, so who played what is observed, not remembered. Per `meta/problem-statement.md` the root cause is "absence at the point of truth"; here absence is impossible. If domain 08 ships anything without this, it is pure consolidation with nothing that compounds — the exact failure the thesis warns against. | Agent, derived from D-18, 2026-07-16 |
| D-05 | **Overdub Mode (08.07) is a first-class mode, not a fallback** | Most remote session work is latency-indifferent. The candidate list assumed simultaneity throughout — an artifact of the domain's *name*, not an observation about the work. Overdub also runs on the locked stack and carries the provenance intact. | Agent, Deep Think, 2026-07-16 |
| D-06 | **The domain's own strongest objection is recorded, not argued away**: if Overdub is where the value is, this domain arguably dissolves into Projects (07) | 08.07 DT-03 rejected this *narrowly* — the machinery (local-first capture, alignment, provenance, pre-flight) genuinely lives in 08, and moving overdub to 07 would drag it along and leave 08 as a rump of infrastructure-blocked features. **That may be the correct outcome.** D-17 flags domain-count inflation as a live hypothesis and this domain is a prime candidate. Escalated as Q-04. | Agent, adversarial self-test, 2026-07-16 |
| D-07 | Talkback exclusion from capture is a **structural** requirement, not a configuration | "Record everything, filter later" is a correct software default and a catastrophic audio one. The take it ruins is by definition the keeper. One sub-domain imposing an architectural constraint on another. | Agent, domain convention, 2026-07-16 |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ~~Which candidate children are sub-domains vs features?~~ **RESOLVED** — 5 sub-domains, 3 domain-level features, 2 candidates merged. See Classification Record. | Agent | ✅ `/ideate-discover` |
| Q-02 | ~~Are any candidate children actually cross-cuts?~~ **RESOLVED** — the transport pipe (already extracted by D-15, re-affirmed), the `playable-with?` predicate consumption, session attendance → provenance ledger, captured stems → project assets, live notes → project timeline, technical-failure record → billing/disputes. All recorded in the domain CX. | Agent | ✅ `/ideate-discover` |
| Q-03 | **The infrastructure contradiction stands and is the domain's central risk.** Everything except Overdub Mode needs media infrastructure that `meta/constraints.md` does not have (Astro/Cloudflare Workers/Supabase). The domain index conceded this at ratification and the breadth pass confirms it. Does the owner accept dedicated media infra, or does the domain reduce to Overdub + capture + provenance? MoSCoW has since run and did not decide this (D-24: Step 5 complete; the domain retains its Musts), and 08.07 DT-09 sharpens the question — the shippable mode is free on the locked stack and it is the **witness** (08.03) that costs media infrastructure, so the real trade is provenance grade against infrastructure. It is a provider/technology choice presented with options at the stack gate. Re-pointed off the completed MoSCoW pass. | User | `/create-prd-stack` |
| Q-04 | **[OWNER]** **Should this domain exist?** Per D-06 and 08.07 DT-03 — if Overdub is the value, and Overdub's machinery could live in Projects (07), domain 08 may be a rump. Raised against the agent's own interest in having found something. D-17 asks for exactly this scrutiny. **D-17 has since been answered and this question survived it as the sole exception**: `ideation-index.md` D-26 — *"**D-17 resolved — keep 24 domains** … One genuine merge candidate survives: `08 Real-Time Jamming` → `07 Music Projects` (Overdub machinery; rejected only narrowly at 08.07 DT-03) — escalated to `/create-prd` for an explicit keep-or-fold."* So the domain-count hypothesis is closed; the keep-or-fold is an owner call that no later stage takes on its own. Tracked identically at 08.07 Q-05. | User | `/create-prd` |
| Q-05 | Is the ~25–30 ms ceiling from D-15's rationale a real constant? 08.01.02 DT-02 rejected it as instrument-dependent — a drummer/bassist lock is far tighter than a vocalist over a bed. This does not weaken D-15; it means the playable radius is a *set* of radii by instrument pair, which makes matching richer. But the thresholds have no source yet. Step 5 has since completed without sourcing them: `08.01.02` Q-01 still asks where the instrument-pair table comes from, and 08.07 Q-02 inherits it for overdub residual tolerance. What remains is purely a set of numbers with a cost on both sides of being wrong — the same class as `08.05.02` Q-06's confidence-tier boundaries, already routed to the performance budget. Re-pointed from the completed `/ideate-discover` Step 5. | User + Agent | `/create-prd-compile` |
| Q-06 | Two probable merges surfaced: (a) live "keep this" note (08.03.03) vs highlight flag (08.05.03) — same gesture from opposite ends, both files raised it independently; (b) monitoring profile (08.04.03) vs playback context (08.03.04) — possibly one entity. Step 5 has since completed and neither merge was taken — all four features remain separate on disk, and domain CX-12 still stands as `[Deferred — Step 5]`. Both are "is this one entity or two", which is a data-model and component-boundary call. Re-pointed from the completed `/ideate-discover` Step 5. | Agent | `/create-prd-architecture` |
| Q-07 | Consent to recording: a jam room that silently records everyone is a surveillance product, but asking every time destroys the "byproduct of the session" property the thesis depends on. This tension is unresolved and it sits directly on the wedge. | User | `/create-prd-security` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-24|D-24]]
- [[decisions.md#d-26|D-26]]
