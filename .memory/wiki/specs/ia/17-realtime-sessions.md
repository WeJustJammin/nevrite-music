# Shard 17 — Real-time jamming and remote sessions

**Status:** Complete
**Surface:** Web/PWA orchestration plus separately admitted specialized audio runtime
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 17 owns remote-session intent, pairwise latency evidence, playability, authenticated monitoring, talkback/cue policy, local-first capture, non-destructive alignment, attendance observations, preflight, overdub and interruption continuity. It is a Phase-2 train: the consumer web stack may orchestrate sessions, but it cannot claim musical-grade transport, capture or device control without a separately approved specialized runtime, provider, cost and security gate.

### Scope Reconciliation

| Reconciliation item | Result |
|---|---|
| In-scope source documents loaded | 30 |
| Child capabilities reconciled | 20 |
| Top-level capabilities | Latency/playability; peer discovery; monitoring; talkback/cues; capture/recall; preflight; overdub; continuity |
| Consumer launch | No real-time audio, remote monitoring or specialized runtime dependency |
| Phase-2 entry | Approved runtime/provider, measured thresholds, relay/egress budget, privacy/counsel profile and infrastructure verification |
| Minor boundary | Minor participation, UGC audio, paid remote work and recording remain disabled until the indivisible minor gate |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Runtime boundary | Astro/Hono/Supabase own orchestration, authority, durable facts and governed files; an admitted specialized runtime owns device/audio/transport operations. |
| Timing model | Live takes use one declared conductor/reference elected before take start. It cannot change mid-take; loss ends the live take rather than silently promoting. |
| Playability | Pairwise verdict includes BPM ceiling, instrument scope, confidence, freshness and evidence basis. Unknown is first-class; worst pair bounds a room. |
| Thresholds | Versioned performance-policy settings hold researched/validated tables; consumers cannot invent thresholds. Red informs and offers overdub, never blocks. |
| Discovery privacy | Opt-in coarse market/metro discovery only. Precise home location is never published; pairwise probing requires mutual session intent. |
| Monitoring | Identity-bound, expiring session grants; no anonymous listener. Revocation cuts in-flight stream. Performer objection is visible/audited and advisory by default. |
| Capture | Local-first; network stream is never master. Network loss never stops durable local recording. |
| Alignment | Offset/drift model remains beside immutable audio; measured residual is shown, never a confidence score or baked edit. |
| Overdub | First-class, globally usable mode. Versioned bed package is reference; provenance grade distinguishes delivered file from observed performance. |
| Provenance | Attendance records observed authenticated endpoint/audio windows, never automatic credit or a claim that a human played. |
| Commerce | Shard 14/05 owns paid terms. This shard records preflight, latency, hold, interruption, delivery and withholding facts without inventing billing outcomes. |

## Features

- **08.01 Latency Budget & Playability** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.01-latency-budget-playability/08.01-latency-budget-playability-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **08.02 Playable Radius & Peer Matching** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.02-playable-radius-peer-matching/08.02-playable-radius-peer-matching-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **08.03 Remote Monitoring & Session Attendance** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **08.04 Talkback & Cue Mixes** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.04-talkback-cue-mixes/08.04-talkback-cue-mixes-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **08.05 Session Capture & Recall** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.05-session-capture-recall/08.05-session-capture-recall-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **08.06 Session Pre-Flight & Rig Readiness Check** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.06-session-preflight-rig-readiness.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **08.07 Overdub Mode (Latency-Independent Tracking)** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.07-overdub-mode.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **08.08 Interruption, Reconnect & Session Continuity** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.08-interruption-reconnect-continuity.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-RTS-01 — Producer creates remote session intent:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Resolve project/acting authority, mode, participants, schedule, recording disclosure, policy/runtime versions, and (6) return Private intent created; no transport yet; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-02 — Participant runs scheduled preflight:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Specialized runtime checks authorized device, storage, sample rate, local path, network and mode capabilities, and (6) return Timestamped pass/fail/not-run/stale facts with fixes; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-03 — Participants measure pairwise path:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Exchange bounded probes through admitted runtime; report directional estimate interval, app/device/network decomposition, confidence and freshness, and (6) return Honest measured/unknown evidence; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-04 — User discovers possible partners:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Search opt-in coarse region/instrument/availability; use centrally owned pair verdict where fresh and authorized, and (6) return Candidates shown without precise location guarantee; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-05 — Participant joins room:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authenticate human, acting party, grants, recording disclosure and runtime capability before connecting, and (6) return Named roster entry or typed denial; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-06 — Producer starts live take:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze conductor, timing model, participants, cue/talkback/capture policy and transport clock epoch, and (6) return Take rolls only when every recording endpoint is durable; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-07 — Performer adjusts cue:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Mix authorized sources locally; self-monitor locally; explicit profile save only, and (6) return Performer-owned cue state; no producer override; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-08 — Producer uses talkback:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Route capture-excluded channel; momentary default, visible latch, transient ducking over cue, and (6) return Reachable performers without recorded talkback audio; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-09 — Producer admits monitor listener:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Grant identity-bound role/window/quality/comment capabilities; notify performers and record objections, and (6) return Visible expiring roster or denied access; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-10 — Listener records timestamped note:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Stamp against delay-compensated position/range; queue until take end; transfer durable ownership to Shard 09/Projects, and (6) return Note appears after take under explicit comment grant; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-11 — Participant disconnects/rejoins:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Keep local capture rolling; record named gap; preserve cue/profile; re-auth/re-sync before stream resumes, and (6) return One attendance with gap segments; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-12 — Conductor/producer drops:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) End current live take on conductor loss; predeclared deputy may manage room after take; local files finalize safely, and (6) return No silent timing or authority succession; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-13 — Producer stops/finalizes take:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Specialized runtime finalizes one file per take/endpoint, latches signal/clip facts and creates upload state, and (6) return Playable local files even before upload; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-14 — Participant uploads/withholds/discards:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Pause uploads during live room; resume immutable chunks afterward; distinguish pending/uploaded/withheld/discarded/lost, and (6) return Asset state is explicit and attributable; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-15 — System aligns uploaded tracks:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Validate committed method/reference; estimate offset/drift at multiple anchors; save non-destructive model and residual, and (6) return Aligned, unaligned or partial tracks; audio preserved; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-16 — Participants close session record:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) One composed close flow presents own observed rows and declared role/instrument; seal after 24h, and (6) return Immutable observation; Shard 02 decides credit meaning; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-17 — Producer creates overdub request:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze bed package, round brief, fidelity, version, deadline wrapper and optional observed-attendance slot, and (6) return Performer receives immutable reference package; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RTS-18 — Performer submits overdub passes:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Measure local round-trip, record/check passes, choose keepers, resumably deliver against bed version, and (6) return Delivery-grade or observed-playing evidence with residual; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Actor and intent | System flow | Terminal outcome |
|---|---|---|---|
| RTS-01 | Producer creates remote session intent | Resolve project/acting authority, mode, participants, schedule, recording disclosure, policy/runtime versions. | Private intent created; no transport yet. |
| RTS-02 | Participant runs scheduled preflight | Specialized runtime checks authorized device, storage, sample rate, local path, network and mode capabilities. | Timestamped pass/fail/not-run/stale facts with fixes. |
| RTS-03 | Participants measure pairwise path | Exchange bounded probes through admitted runtime; report directional estimate interval, app/device/network decomposition, confidence and freshness. | Honest measured/unknown evidence. |
| RTS-04 | User discovers possible partners | Search opt-in coarse region/instrument/availability; use centrally owned pair verdict where fresh and authorized. | Candidates shown without precise location guarantee. |
| RTS-05 | Participant joins room | Authenticate human, acting party, grants, recording disclosure and runtime capability before connecting. | Named roster entry or typed denial. |
| RTS-06 | Producer starts live take | Freeze conductor, timing model, participants, cue/talkback/capture policy and transport clock epoch. | Take rolls only when every recording endpoint is durable. |
| RTS-07 | Performer adjusts cue | Mix authorized sources locally; self-monitor locally; explicit profile save only. | Performer-owned cue state; no producer override. |
| RTS-08 | Producer uses talkback | Route capture-excluded channel; momentary default, visible latch, transient ducking over cue. | Reachable performers without recorded talkback audio. |
| RTS-09 | Producer admits monitor listener | Grant identity-bound role/window/quality/comment capabilities; notify performers and record objections. | Visible expiring roster or denied access. |
| RTS-10 | Listener records timestamped note | Stamp against delay-compensated position/range; queue until take end; transfer durable ownership to Shard 09/Projects. | Note appears after take under explicit comment grant. |
| RTS-11 | Participant disconnects/rejoins | Keep local capture rolling; record named gap; preserve cue/profile; re-auth/re-sync before stream resumes. | One attendance with gap segments. |
| RTS-12 | Conductor/producer drops | End current live take on conductor loss; predeclared deputy may manage room after take; local files finalize safely. | No silent timing or authority succession. |
| RTS-13 | Producer stops/finalizes take | Specialized runtime finalizes one file per take/endpoint, latches signal/clip facts and creates upload state. | Playable local files even before upload. |
| RTS-14 | Participant uploads/withholds/discards | Pause uploads during live room; resume immutable chunks afterward; distinguish pending/uploaded/withheld/discarded/lost. | Asset state is explicit and attributable. |
| RTS-15 | System aligns uploaded tracks | Validate committed method/reference; estimate offset/drift at multiple anchors; save non-destructive model and residual. | Aligned, unaligned or partial tracks; audio preserved. |
| RTS-16 | Participants close session record | One composed close flow presents own observed rows and declared role/instrument; seal after 24h. | Immutable observation; Shard 02 decides credit meaning. |
| RTS-17 | Producer creates overdub request | Freeze bed package, round brief, fidelity, version, deadline wrapper and optional observed-attendance slot. | Performer receives immutable reference package. |
| RTS-18 | Performer submits overdub passes | Measure local round-trip, record/check passes, choose keepers, resumably deliver against bed version. | Delivery-grade or observed-playing evidence with residual. |

### Global Interaction Rules

- The normal-web monthly p95 `<2s` SLO is not an audio-latency promise. Every live/audio route declares its own transport and device budget.
- No paid relay, specialized runtime, TURN/media provider or egress commitment is provisioned before the Phase-2 setup/evolution cost gate.
- Browser and Supabase Realtime presence are coordination hints, never musical transport, transport clock, durable attendance or capture authority.
- Every participant is an authenticated human. Acting as a band/organization is recorded separately; shared credentials never establish person-to-track proof.
- Session recording state is disclosed before connection. Jurisdictions requiring a stronger basis remain blocked by counsel policy rather than silently recording.
- Captured facts remain distinct from credit, contract fault, payment, aesthetic quality and musicianship.

## Contracts

### Core Types and Errors

| Type | Contract |
|---|---|
| `SessionIntentId`, `TakeId`, `EndpointId`, `TrackId` | Opaque immutable IDs; take belongs to one intent and transport epoch. |
| `SessionMode` | `live`, `monitor`, `overdub`; mixed modes require explicit compatible capability set. |
| `RuntimeAdmission` | Runtime/version/provider/region/capabilities, security review, cost ceiling and enabled phase. |
| `PathVerdict` | Pair, instrument pair, BPM ceiling, latency interval, confidence basis, freshness, policy version, `playable|constrained|red|unknown`. |
| `TakeState` | `prepared`, `rolling`, `interrupted`, `finalizing`, `finalized`, `uploading`, `aligned`, `partial`, `sealed`. |
| `CaptureAssetState` | `local`, `pending`, `uploading`, `uploaded`, `withheld`, `discarded`, `lost`, `quarantined`. |
| `ListenerGrant` | Session, identity, listen/comment capabilities, valid window, issuer, state/version. |
| `AttendanceBasis` | `observed_endpoint_audio`, `delivered_file`, `counter_attested`; never an automatic performance claim. |
| Errors | `RUNTIME_DISABLED`, `RUNTIME_INCOMPATIBLE`, `NOT_AUTHORIZED`, `MINOR_DISABLED`, `DISCLOSURE_REQUIRED`, `PREFLIGHT_STALE`, `PATH_UNKNOWN`, `CONDUCTOR_REQUIRED`, `DURABLE_CAPTURE_UNAVAILABLE`, `DEVICE_BUSY`, `DISK_INSUFFICIENT`, `LISTENER_GRANT_REQUIRED`, `COMMENT_GRANT_REQUIRED`, `TAKE_STATE_CONFLICT`, `UPLOAD_INCOMPLETE`, `ALIGNMENT_UNAVAILABLE`, `BED_VERSION_CONFLICT`. |

### Session and Transport

| Contract | Rule |
|---|---|
| `CreateSessionIntent` | Project/party authority, adult participants, mode, schedule, recording/jurisdiction, runtime/policy versions. |
| `RecordPreflight` | Timestamped capability facts and specific remediations; informs and records but does not promise or block. |
| `MeasurePath` | Repeated bounded exchanges produce estimate plus uncertainty; asymmetry/clock ambiguity yields unknown, never RTT/2 certainty. |
| `EvaluatePlayability` | Central versioned policy; worst authorized pair bounds room; red may be knowingly overridden and recorded. |
| `StartTake` | Expected room version, fixed conductor/timing model, durable local capture and visible rolling state. |
| `HandleConductorLoss` | Mark interruption and terminate transport epoch/take; successor can start a new take only after explicit election. |
| `RecordInterruption` | Named participant, start/end, transport epoch, hold elapsed and local-capture state; no billing judgment. |

### Monitoring, Capture and Overdub

| Contract | Rule |
|---|---|
| `GrantListenerAccess` | Authenticated identity, session-bound capability/window, performer visibility and immediate revocation. |
| `RecordListenerNote` | Separate comment grant; delay-compensated point or uncertainty range; never interrupts take. |
| `UpdateCueMix` | Performer-owned local mix; producer can seed/observe; self path always local; profile save explicit. |
| `UseTalkback` | Structural capture exclusion and visible latch; ducking failure cannot mute speech. |
| `FinalizeLocalTake` | One immutable file per take/endpoint, playable finalization, checksum and capture facts. |
| `UploadCaptureAsset` | Resumable immutable chunks, paused in live room, explicit withholding/discard/loss terminal facts. |
| `AlignTake` | Committed reference method, nominal-rate reconciliation, multi-anchor drift, non-destructive model and measured residual. |
| `CreateOverdubBed` | Immutable bounce, tempo/bar map, count-in, markers, brief, fidelity and version. |
| `SubmitOverdubPass` | Bed version, local round-trip/uncertainty, validation facts, keeper/preference and provenance basis. |
| `SealAttendance` | Composed close workflow, own-row disclosure, role vocabulary, gap/audible seconds, self-attested marker and 24h seal. |

## Data Models

| Model | Relationships and invariants |
|---|---|
| `runtime_admission` | Specialized runtime/provider/version/region/capabilities, phase, security/cost evidence and lifecycle. |
| `session_intent` | Project, owner party, mode, schedule, recording/jurisdiction, runtime/policy versions and state. |
| `session_participant` | Human user/person, acting party, role/grants and join state; no shared credential identity. |
| `endpoint_capability` / `preflight_result` | Participant device/rig capability and timestamped test facts; protected telemetry. |
| `network_observation` | Pair, context pseudonym, direction/interval/decomposition/confidence/freshness; retention bounded. |
| `path_verdict` | Derived pair/instrument/policy result; no precise-location projection. |
| `transport_epoch` | Session/take, conductor, timing model, clock basis, start/end and interruption reason. |
| `take` / `take_fragment` | Session, epoch, state, sequence and preserved interruption gaps. |
| `cue_mix_state` / `monitoring_profile` | Session-local performer mix and explicit person/role-relative saved profile. |
| `listener_grant` / `listener_presence` | Session identity/capability/window and observed connection segments. |
| `capture_asset` | Take/endpoint, owner, checksum, quality, signal/clip, state and governed object metadata. |
| `alignment_model` | Track/reference, nominal-rate correction, offset, drift anchors/model, residual and manual nudge. |
| `moment_flag` | Take/window/actor/reason; durable Shard 09 annotation projection owns lifecycle after transfer. |
| `attendance_observation` | Human/acting party/endpoint, segments, gaps, audible seconds, declaration, basis and seal. |
| `overdub_request` / `bed_version` | Project, round, immutable brief and reference package version/fidelity. |
| `overdub_pass` | Request/bed/participant, local measurement, validation, keeper/preference, delivery and basis. |
| `interruption_fact` | Session/take/participant, times, reconnect, hold elapsed, capture status and cause class. |

PostgreSQL owns intents, grants, observations, state, audit and outbox. Specialized runtime owns transient transport/device state and local files until governed upload. Supabase Storage receives immutable authorized assets only. Raw IP, precise location, media and home-rig details never enter search, general analytics, Queue payloads or public projections.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`runtime_admission`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Specialized runtime/provider/version/region/capabilities, phase, security/cost evidence and lifecycle..
- **`session_intent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Project, owner party, mode, schedule, recording/jurisdiction, runtime/policy versions and state..
- **`session_participant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Human user/person, acting party, role/grants and join state; no shared credential identity..
- **`endpoint_capability`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Participant device/rig capability and timestamped test facts; protected telemetry..
- **`preflight_result`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Participant device/rig capability and timestamped test facts; protected telemetry..
- **`network_observation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Pair, context pseudonym, direction/interval/decomposition/confidence/freshness; retention bounded..
- **`path_verdict`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Derived pair/instrument/policy result; no precise-location projection..
- **`transport_epoch`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Session/take, conductor, timing model, clock basis, start/end and interruption reason..
- **`take`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Session, epoch, state, sequence and preserved interruption gaps..
- **`take_fragment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Session, epoch, state, sequence and preserved interruption gaps..
- **`cue_mix_state`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Session-local performer mix and explicit person/role-relative saved profile..
- **`monitoring_profile`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Session-local performer mix and explicit person/role-relative saved profile..
- **`listener_grant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Session identity/capability/window and observed connection segments..
- **`listener_presence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Session identity/capability/window and observed connection segments..
- **`capture_asset`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Take/endpoint, owner, checksum, quality, signal/clip, state and governed object metadata..
- **`alignment_model`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Track/reference, nominal-rate correction, offset, drift anchors/model, residual and manual nudge..
- **`moment_flag`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Take/window/actor/reason; durable Shard 09 annotation projection owns lifecycle after transfer..
- **`attendance_observation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Human/acting party/endpoint, segments, gaps, audible seconds, declaration, basis and seal..
- **`overdub_request`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Project, round, immutable brief and reference package version/fidelity..
- **`bed_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Project, round, immutable brief and reference package version/fidelity..
- **`overdub_pass`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Request/bed/participant, local measurement, validation, keeper/preference, delivery and basis..
- **`interruption_fact`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Session/take/participant, times, reconnect, hold elapsed, capture status and cause class..

## Access Control

| Role | Allowed | Denied |
|---|---|---|
| Participant/performer | Own preflight/path details, cue, capture choice/assets, attendance row and visible roster | Other participants' home telemetry/audible detail, another endpoint capture, hidden listeners |
| Producer/session owner | Intent, invitations, conductor/take control, roster grants, seeded cues, aggregate/runtime diagnostics | Override performer cue, capture declined endpoint, convert facts to fault/credit, inspect unrelated rig history |
| Predeclared deputy | Room lifecycle after owner loss and only named capabilities | Silent conductor promotion, owner commerce/rights powers |
| Monitor listener | Granted stream and optional comment during exact window | Anonymous join, downloads, participant telemetry, post-session persistence without entitlement |
| Project collaborator | Uploaded/aligned assets and transferred notes under Shard 09 project rights | Live room or raw local asset without explicit grant |
| Moderator/security reviewer | Assigned protected grant/abuse/runtime evidence projection | General listening, media export, creative control |
| Specialized runtime principal | One session/endpoint/transport/upload scope with short-lived credential | Domain authority, unrelated Storage/database, acting-party decisions |
| Platform administrator | Named runtime/policy/incident capabilities with MFA/reason/audit | Universal room entry, silent recording, arbitrary threshold or evidence rewrite |

Room blocks/restrictions stop admission and new grants. In-flight listener revocation disconnects immediately. Historical attendance, interruption and capture facts remain immutable; disputes attach beside them.

### Access Escalation

- **Participant/performer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Producer/session owner:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Predeclared deputy:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Monitor listener:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Project collaborator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator/security reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Specialized runtime principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Platform administrator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- All orchestration, preflight, roster, cue, talkback, transport, upload, alignment and overdub controls are keyboard operable with visible focus and stable labels.
- Rolling/not-rolling, muted/live talkback, listener presence, conductor, disconnection, recording and degraded-quality states use persistent text/icon/state announcements, never color alone.
- Screen-reader live regions announce only high-priority state transitions; meters expose bounded textual summaries without flooding.
- Momentary talkback has keyboard press-and-hold plus accessible latch alternative with unmissable state and explicit release.
- Cue controls expose source-relative labels, value and reset; profile mapping failures are listed, never silently approximated.
- Network/playability expresses BPM, latency interval, freshness and confidence in plain language; unknown/degraded states remain distinct.
- Reconnect restores focus/context and announces “still recording” before secondary messages.
- Audio-only collaboration cannot be the sole access path for critical consent, warnings, notes or session control; equivalent text UI exists.

## Event Schemas

All durable events use the standard envelope and safe identifiers. High-rate transport/media telemetry is not a domain event stream.

| Event | Safe payload | Consumers |
|---|---|---|
| `realtime.session-intent.changed.v1` | Intent/mode/state/runtime version | Project/session projectors |
| `realtime.preflight.recorded.v1` | Intent/participant pseudonym/result/freshness/version | Roster/commercial evidence |
| `realtime.path-verdict.changed.v1` | Pair pseudonyms/verdict/BPM/confidence/freshness/version | Authorized discovery/room |
| `realtime.transport-epoch.changed.v1` | Intent/take/epoch/state/reason/version | Room/capture/continuity |
| `realtime.listener-grant.changed.v1` | Session/grant/identity pseudonym/capabilities/state/version | Monitor transport/roster |
| `realtime.take.changed.v1` | Session/take/state/fragment count/version | Capture/project projector |
| `realtime.capture-asset.changed.v1` | Take/asset/owner pseudonym/state/quality/version | Upload/project/alignment |
| `realtime.alignment.changed.v1` | Take/track/state/residual class/version | Project timeline |
| `realtime.attendance.sealed.v1` | Session/observation IDs/basis/sealed time/version | Shards 02, 09 and dispute evidence |
| `realtime.overdub-request.changed.v1` | Request/bed/round/state/version | Project/participant |
| `realtime.overdub-pass.changed.v1` | Request/pass/bed/state/basis/version | Project/service wrapper |
| `realtime.interruption.recorded.v1` | Session/take/participant pseudonym/duration/cause class | Room/commercial evidence |

Events exclude IP/location, raw latency samples, device names, media bytes/URLs, talkback, cue levels, private notes, exact audible seconds, contract prices and protected evidence.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Specialized runtime/provider unavailable | Live/monitor disabled honestly; intents and overdub planning remain; no browser fallback claims musical grade. |
| Path cannot be measured | Unknown with remediation/overdub; never green, zero or false precise radius. |
| Discovery verdict service unavailable | Candidate discovery fails open with playability hidden/stale; room admission/preflight remains honest. |
| Multi-player one bad pair | Worst pair bounds room verdict; no averaging. |
| Conductor drops mid-take | Current take ends/finalizes; no silent succession; deputy/conductor election starts a new epoch/take. |
| Producer drops but conductor remains | Live take may finish; local capture continues; deputy only exercises predeclared room powers. |
| Endpoint loses network | Local capture continues; one take gains gap fragments; reconnect re-auths and restores cue/profile. |
| Disk durability unavailable | Capture cannot start on that endpoint; no silent best-effort recorder. |
| Upload interrupted for days | Resume verified chunks on next authorized open; state remains pending/withheld/lost, never silently abandoned. |
| Participant declines upload | Withheld is visible; attendance fact seals independently; commerce/dispute layer decides consequence. |
| Talkback latch stuck or ducking fails | Persistent live indicator and emergency release; talkback remains audible and never enters capture. |
| Listener link forwarded | Login plus identity/session grant required; no anonymous stream; revoke disconnects current socket. |
| Note delay unknown | Anchor to explicit time range; never false point precision. |
| Alignment fails | Preserve/download original; mark unaligned; never place at zero or bake destructive correction. |
| Bed changes during pass | In-flight bed immutable; deliver against old version with visible superseded/bar-map label. |
| Shared acting entity joins | Each human authenticates separately; acting party recorded, person-to-endpoint observation remains individual. |
| Recording basis not approved in jurisdiction | Session cannot connect in recording mode; policy does not silently downgrade disclosure. |
| Scheduled end passes while disconnected | Local capture continues; prompt at +30 minutes, never automatic destructive stop. |

## Dependency References

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]] for runtime admission, storage, jobs, settings and audit; [[specs/ia/01-identity-authority|Shard 01]] for human/acting-party authority; [[specs/ia/02-profiles-verification|Shard 02]] for evidence vocabulary/credit conclusions; [[specs/ia/06-trust-safety|Shard 06]] for restrictions/recording safety; [[specs/ia/09-projects-collaboration|Shard 09]] for project/take/note lifecycle.
- **Depended on by:** service, rights, credit and dispute shards consume immutable facts only; they do not control audio/runtime state.
- **Deep dive:** [[specs/ia/deep-dives/17-realtime-sessions|Real-time sessions deep dive]].

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| RTS-01 Producer creates remote session intent | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-02 Participant runs scheduled preflight | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-03 Participants measure pairwise path | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-04 User discovers possible partners | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-05 Participant joins room | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-06 Producer starts live take | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-07 Performer adjusts cue | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-08 Producer uses talkback | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-09 Producer admits monitor listener | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-10 Listener records timestamped note | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-11 Participant disconnects/rejoins | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-12 Conductor/producer drops | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-13 Producer stops/finalizes take | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-14 Participant uploads/withholds/discards | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-15 System aligns uploaded tracks | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-16 Participants close session record | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-17 Producer creates overdub request | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RTS-18 Performer submits overdub passes | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 02:** consume [Shard 02 Contracts](02-profiles-verification.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 02 Event Schemas](02-profiles-verification.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 09:** consume [Shard 09 Contracts](09-projects-collaboration.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 09 Event Schemas](09-projects-collaboration.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Source | Sections |
|---|---|---|---|
| 2026-08-03 | Reconciled 30 sources; locked Phase-2 runtime boundary, live/overdub/capture/monitoring/provenance contracts | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/deep-dives/17-realtime-sessions|Deep Dive 17 — Real-time jamming and remote sessions]]
