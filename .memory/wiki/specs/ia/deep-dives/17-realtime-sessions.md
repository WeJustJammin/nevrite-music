# Deep Dive 17 — Real-time jamming and remote sessions

**Status:** Complete
**Parent:** [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]

## Scope

This deep dive owns the specialized-runtime seam, pairwise measurement privacy, live take authority, monitor/cue/talkback controls, local capture/upload/alignment, overdub, provenance and interruption recovery.

## Deepening Record

| Pass | Converged result |
|---|---|
| Cross-section consistency | Session intent, transport epoch, take, capture asset, attendance and project wrapper use separate immutable versions. |
| What-if expansion | Unknown path, conductor/producer loss, disk/network failure, forwarded invites, delayed uploads, failed alignment and stale bed are terminally specified. |
| Adversarial pass | Fake green verdicts, home-location inference, hidden listeners/recording, capture coercion, credit laundering, destructive alignment and browser-grade overclaim fail closed. |
| Convergence | Live and overdub share evidence/capture primitives but remain explicit modes; no additional domain boundary is needed. |

## Specialized Runtime Admission

1. Consumer launch ships no musical-grade transport/runtime dependency.
2. Phase-2 admission records runtime/provider/version, OS/device support, media/relay regions, capabilities, privacy/security review, relay/egress ceiling, failure fallback and kill switch.
3. A local runtime receives a short-lived, session/endpoint/purpose credential after Hono/domain authorization; it cannot derive party authority.
4. Runtime reports typed capability/evidence facts. Server validates schema/version and stores durable facts; raw media/device/IP telemetry stays local/provider-side unless purpose requires bounded storage.
5. Supabase Realtime coordinates UI invalidation/presence only. It is never audio transport, clock, recorder or attendance evidence.
6. Runtime/provider degradation disables affected live/monitor capabilities. Overdub may proceed only when local durability and eventual governed upload are independently available.
7. No paid service is provisioned until setup/evolution approval; spend/egress alarms and hard ceilings precede shared staging.

## Pairwise Measurement and Discovery Algorithm

1. User opts into coarse metro/market discovery. Public projections never include exact coordinates, address, IP or route history.
2. Candidate matching first uses region, role/instrument, availability and mode. “Playable” is not a property of a person.
3. Pair probes require mutual session intent or explicit consent. Repeated exchanges estimate direction/interval, device/application/network components, jitter and confidence.
4. Unsynchronized/asymmetric ambiguity remains an uncertainty interval or `unknown`; RTT/2 never becomes directional certainty.
5. Central versioned policy converts evidence plus instrument pair into BPM ceiling/verdict. Consumers cannot override the table.
6. Multi-party verdict is the worst authorized pair. Red records informed override and offers overdub; it does not block.
7. Discovery-filter outage fails open by showing candidates without verdict. Measurement/preflight cannot fail green.
8. Raw path observations expire after the approved bounded retention; derived coarse confidence may persist without precise network/location identifiers.
9. Query precision, rate limits and authorization prevent binary-search inference of another user's location.

## Live Take and Authority Algorithm

1. Intent resolves authenticated humans, acting parties, grants, recording policy, mode, runtime and project.
2. Preflight runs ahead of schedule. It records timestamped `pass/fail/not_run/stale` facts and specific fixes without guaranteeing the future.
3. Before each take the Producer freezes conductor, timing model, participants, source map, cue/talkback policy, capture endpoints and reference method.
4. Every recording endpoint proves durable local storage before rolling. Rolling/not-rolling is visible to all.
5. The conductor/reference and timing model cannot change within a transport epoch.
6. Conductor loss marks interruption, ends the live take and finalizes local assets. No silent promotion occurs.
7. A predeclared deputy may manage roster/room continuity after the take. A newly elected conductor starts a new epoch and take.
8. Producer loss does not stop endpoint recording. Without delegated authority, no new take starts; current take may finish only while the conductor and policy remain valid.
9. Hold duration and interruption facts are visible. Service/commerce decides whether time is billable.

## Monitoring, Talkback and Cue Algorithm

1. Listener grant binds authenticated identity, session, listen/comment capabilities and mandatory expiry. Link possession alone is insufficient.
2. Performers always see named listener presence and quality state. Revocation closes in-flight transport.
3. Performer objection is visible and immutable; Producer resolves it. Default is advisory, not automatic removal.
4. Stream quality contract and degradation policy freeze before connection. Delivered degradation is visible; Producer may audition delivered quality without a roster grant.
5. Listener comment requires a separate capability. Delay compensation yields a point only when bounded; otherwise a range.
6. Notes queue during rolling and surface after take. Shard 09 owns durable annotation lifecycle; discarded take removes orphan note projection.
7. Playback context is self-declared, optional, Producer-only and a weighting clue—not a gate, score, fingerprint or excuse to dismiss feedback.
8. Performer owns cue mix. Self source is local; producer may seed/observe but not override. Saved profiles are explicit and source-role-relative.
9. Talkback is structurally excluded before capture tap. Momentary is default; latch is conspicuous; ducking overlays but never mutates cue; duck failure never mutes talkback.

## Local Capture, Upload and Alignment Algorithm

1. Runtime calculates required headroom as at least `2 × channels × 8.64 MB/min × planned minutes` and displays remaining minutes.
2. One immutable local file is created per session/take/endpoint; full-quality default, explicit labelled lossy fallback only.
3. Network failure never stops recording. No unresolved disconnect auto-stops; scheduled end +30 minutes prompts but cannot destroy work.
4. Finalization is uninterruptible and yields a playable file. Signal presence and clipping are latched facts.
5. Participant owns endpoint asset and may upload, withhold or discard it. The state is explicit; the platform never compels upload.
6. Upload never competes with a live room. Afterward, immutable chunks resume from provider-confirmed state with bounded backoff and no silent abandonment.
7. Alignment method/reference was committed at preflight. Nominal sample-rate reconciliation precedes offset/drift estimation.
8. Multiple anchors estimate drift; interruption fragments align independently and preserve gaps.
9. Model, measured residual and manual nudge sit beside original audio. Re-runs preserve manual nudge and do not move placed tracks unless a late reference triggers announced re-alignment.
10. Failure keeps original downloadable and marks unaligned; zero placement and baked correction are forbidden.
11. Timing-witness artifacts are pre-talkback, never mixed/delivered/downloaded and discarded at seal.

## Overdub Algorithm

1. Producer creates immutable round brief and bed package: bounce, tempo/bar map, two-bar count-in, markers, fidelity and version.
2. Performer downloads an authorized package; delivery cannot be recalled, so recipient/version/fidelity/time are recorded.
3. Bed does not mutate in flight. New version supplies section/bar-map diff; performer chooses switch. Old-version pass remains deliverable and labelled.
4. Runtime measures local round-trip per rig/session with uncertainty and applies the measured offset; it never judges feel or quantizes performance.
5. Overdub-specific preflight checks storage, sample rate, monitoring path, bed stamp and local calibration.
6. Each pass is locally checked for silence, clipping, bleed, sample-rate mismatch and bed version while performer can fix it.
7. Performer chooses keepers and optional preference; Producer chooses among keepers. Earlier round history remains immutable evidence.
8. Producer attendance is optional and selected before pass. Unattended yields `delivered_file`; attended may yield `observed_endpoint_audio`; counter-attestation remains separate.
9. Shard 09 owns project lifecycle and Shard 14/05 owns commercial wrapper; this shard owns bed/pass mechanics and evidence facts.

## Attendance and Close Algorithm

1. Transport clock records participant endpoint segments, gaps and audible seconds; endpoint timestamps cannot author duration.
2. Rejoins append gaps to one attendance row, never create duplicate contributors.
3. Observation states only that authenticated endpoint produced audio in observed windows. Role/instrument are declared from controlled vocabulary.
4. Each participant sees own detail; Producer receives only purpose-limited session summary. Lateral audible-second visibility is denied.
5. One composed close flow merges attendance confirmation and Shard 02 capture prompt, avoiding duplicate prompts.
6. Prompt is prefilled/one-tap, nonblocking, once in session plus one notification. It seals at session end +24h.
7. Self-attested rows are labelled. Presence never becomes credit; Shard 02/10 evaluates evidence with other attestations.
8. Acting as band/organization is recorded beside the authenticated human. Shared credentials are not accepted as person-to-track evidence.

## Interruption and Recovery Algorithm

| Event | Continuity behavior |
|---|---|
| Participant network loss | Announce name; local capture continues; record gap; reconnect re-auths/re-syncs and restores cue/profile. |
| Conductor loss | End/finalize current live take; explicit new conductor and epoch required. |
| Producer loss | Current capture continues; deputy uses only predeclared room powers; no implicit commerce/rights authority. |
| Runtime crash | Recover local journal/chunks where integrity proves; otherwise loud lost/partial state, never fabricated success. |
| Storage nearing exhaustion | Warn in minutes; allow deliberate stop/finalize; never silently reduce fidelity. |
| Listener authorization outage | Fail closed and stop stream; roster/history remains. |
| Project/database outage | Local capture continues where authorized session credential remains valid; protected durable mutations queue only through bounded signed journal and reconcile before claim. |
| Upload credential expiry | Refresh after reauthorization and continue provider-confirmed chunks. |
| Take seal races late asset | Seal observation independently; asset may attach later with original take/version and late-delivery audit. |

## Abuse and Recovery Verification

| Failure or abuse | Required proof |
|---|---|
| Fake green path | Unknown/failure tests, uncertainty bounds and policy-version evidence. |
| Location probing | Coarse projection, mutual-intent rule, query throttles and inference tests. |
| Hidden listener/recording | Authenticated roster, pre-connect disclosure and in-flight revoke tests. |
| Capturing another endpoint | Endpoint-scoped credential and participant-decline tests. |
| Talkback leaked into master | Structural graph/tap test proves exclusion before capture. |
| Withheld asset treated as lost | Distinct state/audit and participant-visible attribution. |
| Attendance launders credit | No event/contract directly creates Shard 02 credit. |
| Shared entity impersonates human | Human Auth UUID plus acting-party pair required at join/observation. |
| Alignment corrupts original | Immutable checksum and sidecar-only model tests. |
| Paid outage auto-charges/refunds | Facts emitted; no billing transition exists in this shard. |

## Cross-Shard Contracts

| Shard | Contract |
|---|---|
| Shard 00 | Runtime admission, short-lived credentials, storage, jobs, settings, audit/outbox and cost controls. |
| Shard 01 | Human identity, acting party, mandates and deputy authority. |
| Shard 02 | Controlled role vocabulary and credit evidence conclusions. |
| Shard 06 | Recording/listener safety, restrictions, abuse cases and protected evidence. |
| Shard 09 | Project/session container, assets, versions, annotations and review lifecycle. |
| Shard 14 | Service scope, delivery, interruption/commercial consequences and disputes where applicable. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [17-realtime-sessions § Contracts](../17-realtime-sessions.md#contracts) defines commands/queries and [17-realtime-sessions § Event Schemas](../17-realtime-sessions.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Deepened specialized runtime, pair measurement, authority, monitoring, capture, alignment, overdub, provenance and recovery paths | `/write-architecture-spec` |

## Dependency References

- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/2026-08-02-architecture-design|Architecture design]]
- [[specs/data-placement-strategy|Data placement strategy]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Projects and collaboration]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
