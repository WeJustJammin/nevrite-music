# Real-Time Jamming & Remote Sessions — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [SURFACE]
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

## Children

> Candidate children discovered by the 14-lens sweep. All are `[SURFACE]` — identified only.
> `/ideate-discover` runs each through the Node Classification Gate to determine
> sub-domain (folder) vs feature (file), then drills. **Nothing below is confirmed structure.**

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 01 | Low-Latency Jam Rooms & Latency Budgeting | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 02 | Geographic Peer Matching & Playable-Radius Discovery | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 03 | Remote Session Attendance & High-Fidelity Live Monitoring | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 04 | In-Room Talkback & Cue Mixes | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 05 | Rehearsal & Jam Capture with Auto-Highlights | _unclassified_ | _pending_ | `[SURFACE]` | 0 |
| 06 | Multitrack Capture of Network Sessions | _unclassified_ | _pending_ | `[SURFACE]` | 0 |

## Role Matrix

> `[PENDING]` — populated by `/ideate-discover` once `meta/personas.md` exists.
> Provisional personas for this domain (from sweep): musician, band, remote session player, mix engineer, remote client/producer, teacher
>
> **Legend**: ✅ Full · ⚙️ Config · 👁️ Read-only · 📊 Reports · ❌ None

| Child | musician | band | remote session player | mix engineer | remote client/producer | teacher |
|-------| --- | --- | --- | --- | --- | --- |
| _pending — children unclassified_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Renamed to drop the 'Collaboration' collision with domain 07, and narrowed hard in response to the strongest objection in the verification set. That objection's invocation test is ... | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | Which candidate children are sub-domains (2+ interacting capabilities) vs features (single capability)? | Agent | `/ideate-discover` |
| Q-02 | Are any candidate children actually cross-cuts belonging in a CX file? | Agent | `/ideate-discover` |
