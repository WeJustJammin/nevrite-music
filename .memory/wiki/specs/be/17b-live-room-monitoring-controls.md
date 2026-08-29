# Live Room, Cue, Talkback & Monitoring Controls — Backend Specification

**Status:** Complete
**IA source:** [Shard 17 — Real-time jamming and remote sessions](../ia/17-realtime-sessions.md)
**Deep-dive source:** [Deep Dive 17 — Real-time jamming and remote sessions](../ia/deep-dives/17-realtime-sessions.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns identity-bound room entry, live-take admission, transport epochs, performer-local cue mixes, structurally capture-excluded talkback, monitor-listener grants/notes, disconnect/rejoin gaps, and explicit conductor/producer interruption handling. It contains `RTS-05` through `RTS-12`. Runtime admission/path measurement, local capture/alignment/attendance, overdub, project containers and commercial consequences remain sibling boundaries. Identity, room transport, durable capture, notification, project comments and safety policy are external seams.

## Classification

- **Type:** real-time room-control and participant-authority boundary.
- **Boundary:** `transport_epoch`, `cue_mix_state`, `monitoring_profile`, `listener_grant`, `listener_presence`, and `interruption_fact` ownership; `take`/`take_fragment` durability is owned by the capture split and is checked as a seam.
- **Expected operations:** eight HTTP operations, one for each assigned IA interaction (`RTS-05`, `RTS-06`, `RTS-07`, `RTS-08`, `RTS-09`, `RTS-10`, `RTS-11`, `RTS-12`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** every room connection authenticates a human and named acting party; a live take freezes conductor/timing/participant/control policy at a transport clock epoch; cue state is local and explicit; talkback is structurally excluded from capture; listener access is identity-bound, visible and revocable; interruption never silently transfers authority.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `17-realtime-sessions.md` | `Overview`, `Scope Reconciliation`, `Architecture Decisions`, `Features`, `Acceptance Criteria` lines 7–68 | Room, authority, transport, cue, talkback, listener, disconnect and interruption decisions. |
| `17-realtime-sessions.md` | `Interactions` lines 70–93 | Exact `RTS-05`–`RTS-12` preconditions, outcomes, disclosure and authority rules. |
| `17-realtime-sessions.md` | `Contracts`, `Core Types and Errors`, `Session and Transport`, `Monitoring, Capture and Overdub` lines 102–143 | `SessionMode`, `ListenerGrant`, `StartTake`, `HandleConductorLoss`, `RecordInterruption`, cue/talkback/listener contracts and exact errors. |
| `17-realtime-sessions.md` | `Data Models` and typed registry lines 145–195 | Canonical transport, mix, listener, presence and interruption model names. |
| `17-realtime-sessions.md` | `Access Control`, `Accessibility` lines 196–232 | Human/acting-party authentication, listener visibility, participant objection and safe recovery. |
| `17-realtime-sessions.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 233–305 | Transport/listener/interruption events, capture exclusion, reconnect and authority races. |
| `17-realtime-sessions.md` | `Cross-Shard Section Contract Map`, `Dependency References` lines 306–323 | Runtime, identity, safety, project, capture, service and rights dependencies. |
| `deep-dives/17-realtime-sessions.md` | `Live Take and Authority Algorithm`, `Monitoring, Talkback and Cue Algorithm` lines 41–64 | Epoch freeze, conductor authority, local mix, listener controls, visible latch and ducking behavior. |
| `deep-dives/17-realtime-sessions.md` | `Interruption and Recovery Algorithm`, `Abuse and Recovery Verification` lines 102–130 | Named gaps, conductor loss, deputy scope, listener fail-closed, fake authority and leakage tests. |
| `deep-dives/17-realtime-sessions.md` | `Cross-Shard Contracts`, `Implementation Envelope` lines 131–149 | Versioned room/capture seams, idempotency, outbox and bounded command envelope. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor/acting context, replay ledger, rate limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Cloudflare/Supabase boundaries, private transport data, Zod-first contracts and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `RTS-05` Participant joins room | Authenticate human/acting party, grant, recording disclosure and runtime capability before connection; named roster or typed denial. | `RTS-LIVE-API-01` | `transport_epoch`, `session_participant`; `realtime.transport-epoch.changed.v1` |
| `RTS-06` Producer starts live take | Freeze conductor, timing, participants, cue/talkback/capture policy and transport clock epoch; all recording endpoints durable before roll. | `RTS-LIVE-API-02` | `transport_epoch`, `take` seam; `realtime.transport-epoch.changed.v1` |
| `RTS-07` Performer adjusts cue | Authorized local mix/self-monitor; producer can seed/observe; explicit profile save; no producer override. | `RTS-LIVE-API-03` | `cue_mix_state`, `monitoring_profile` |
| `RTS-08` Producer uses talkback | Capture-excluded route, momentary default, visible latch, transient ducking; ducking failure cannot mute speech. | `RTS-LIVE-API-04` | `monitoring_profile`, `transport_epoch` |
| `RTS-09` Producer admits monitor listener | Identity-bound grant with window/quality/comment capability; notify performers, record objections, immediate revoke. | `RTS-LIVE-API-05` | `listener_grant`, `listener_presence`; `realtime.listener-grant.changed.v1` |
| `RTS-10` Listener records timestamped note | Separate comment grant; delay-compensated point/range; queue through take end then transfer durable ownership to Shard 09. | `RTS-LIVE-API-06` | `listener_grant`, `listener_presence`; `realtime.listener-grant.changed.v1` consumer |
| `RTS-11` Participant disconnects/rejoins | Local capture continues; named gap; re-auth/re-sync before stream resumes; one attendance with gap segments. | `RTS-LIVE-API-07` | `listener_presence`, `interruption_fact`, `transport_epoch`; `realtime.interruption.recorded.v1` |
| `RTS-12` Conductor/producer drops | End current live take on conductor loss; predeclared deputy only after take; no silent timing/authority succession. | `RTS-LIVE-API-08` | `interruption_fact`, `transport_epoch`; `realtime.interruption.recorded.v1` |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `RTS-05` | `RTS-LIVE-API-01` | `POST /api/v1/realtime/session-intents/{intentId}/room-joins` | `JoinRoomRequest` → `JoinRoomSuccess` (`201`) | Human/acting-party, grant/disclosure/runtime, named roster, provider token and typed `ApiError`. |
| `RTS-06` | `RTS-LIVE-API-02` | `POST /api/v1/realtime/session-intents/{intentId}/takes/start` | `StartTakeRequest` → `StartTakeSuccess` (`201`) | Producer/conductor, durable endpoints, frozen policy/epoch, capture seam and typed `ApiError`. |
| `RTS-07` | `RTS-LIVE-API-03` | `PUT /api/v1/realtime/session-intents/{intentId}/participants/{participantId}/cue-mix` | `UpdateCueMixRequest` → `UpdateCueMixSuccess` (`200`) | Performer-local ownership, seed/observe limits, explicit profile save and typed `ApiError`. |
| `RTS-08` | `RTS-LIVE-API-04` | `POST /api/v1/realtime/session-intents/{intentId}/talkback` | `UseTalkbackRequest` → `UseTalkbackSuccess` (`200`) | Producer authority, capture exclusion, latch/ducking safety and typed `ApiError`. |
| `RTS-09` | `RTS-LIVE-API-05` | `POST /api/v1/realtime/session-intents/{intentId}/listener-grants` | `GrantListenerRequest` → `GrantListenerSuccess` (`201`) | Identity/window/capability, performer objections, notification and typed `ApiError`. |
| `RTS-10` | `RTS-LIVE-API-06` | `POST /api/v1/realtime/listener-grants/{grantId}/notes` | `RecordListenerNoteRequest` → `RecordListenerNoteSuccess` (`201`) | Comment grant, delay/range, queue/Shard 09 handoff and typed `ApiError`. |
| `RTS-11` | `RTS-LIVE-API-07` | `POST /api/v1/realtime/session-intents/{intentId}/participants/{participantId}/reconnect` | `ReconnectParticipantRequest` → `ReconnectParticipantSuccess` (`200`) | Named participant, re-auth/re-sync, gap fact and typed `ApiError`. |
| `RTS-12` | `RTS-LIVE-API-08` | `POST /api/v1/realtime/session-intents/{intentId}/authority/interruption` | `RecordAuthorityInterruptionRequest` → `RecordAuthorityInterruptionSuccess` (`200`) | Conductor/producer role, epoch end, deputy scope, explicit successor and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `RTS-LIVE-API-01` | `POST` | `/api/v1/realtime/session-intents/{intentId}/room-joins` | `RTS-05` | Authenticated named human/acting party with participant role, disclosure and runtime capability. | `201` `JoinRoomSuccess` |
| `RTS-LIVE-API-02` | `POST` | `/api/v1/realtime/session-intents/{intentId}/takes/start` | `RTS-06` | Authenticated producer/conductor; all recording endpoints satisfy durable-capture gate. | `201` `StartTakeSuccess` |
| `RTS-LIVE-API-03` | `PUT` | `/api/v1/realtime/session-intents/{intentId}/participants/{participantId}/cue-mix` | `RTS-07` | Authenticated performer owns local cue; producer may seed/observe only. | `200` `UpdateCueMixSuccess` |
| `RTS-LIVE-API-04` | `POST` | `/api/v1/realtime/session-intents/{intentId}/talkback` | `RTS-08` | Authenticated producer with current transport epoch. | `200` `UseTalkbackSuccess` |
| `RTS-LIVE-API-05` | `POST` | `/api/v1/realtime/session-intents/{intentId}/listener-grants` | `RTS-09` | Authenticated producer; listener identity and performer visibility/objections are checked. | `201` `GrantListenerSuccess` |
| `RTS-LIVE-API-06` | `POST` | `/api/v1/realtime/listener-grants/{grantId}/notes` | `RTS-10` | Authenticated listener with current comment capability. | `201` `RecordListenerNoteSuccess` |
| `RTS-LIVE-API-07` | `POST` | `/api/v1/realtime/session-intents/{intentId}/participants/{participantId}/reconnect` | `RTS-11` | Authenticated same named participant; current epoch and prior gap are verified. | `200` `ReconnectParticipantSuccess` |
| `RTS-LIVE-API-08` | `POST` | `/api/v1/realtime/session-intents/{intentId}/authority/interruption` | `RTS-12` | Authenticated conductor/producer/deputy under predeclared room powers. | `200` `RecordAuthorityInterruptionSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 human/acting-party verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before room/write | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Room transport provider | `{intentId, actorIdentity, epochId, capabilities, disclosureVersion}` → `{providerSessionId, token, expiresAt, serverClock}` | 800 ms | 2 retries at 100 ms/300 ms with same request key | Open after 5 failures/30 s; join fails closed without presence/token; half-open after 20 s. |
| Durable capture readiness | `{intentId, participantIds, capturePolicy, epochId}` → `{endpointReadiness[], durable}` | 900 ms | 2 retries at 100 ms/300 ms; no retry after a known endpoint refusal | Open after 4 failures/30 s; start returns `DURABLE_CAPTURE_UNAVAILABLE`; half-open after 20 s. |
| Notification/objection service | `{intentId, listenerGrantId, performerIds, capabilities, expiry}` → `{deliveryIds[], objections[]}` | 500 ms | 2 retries at 75 ms/225 ms with dedupe key | Open after 5 failures/30 s; grant remains pending/visible only after notification acceptance; half-open after 20 s. |
| Shard 09 comment handoff | `{noteId, takeId, ownerPartyId, anchor, bodyCiphertextRef}` → `{projectNoteId, accepted}` | 700 ms | 2 retries at 100 ms/300 ms; durable outbox | Open after 4 failures/30 s; note remains queued until take end; half-open after 20 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with `VALIDATION_FAILED`; timestamps are RFC 3339 with offset; IDs are UUIDs. Every error is the BE00/global envelope `ApiError { code, message, requestId, details }`.

```ts
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateTime = z.iso.datetime({ offset: true });
const Key = z.string().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const Hash = z.string().length(64).regex(/^[a-f0-9]+$/);
const Context = z.object({ actingContextId: Uuid, expectedVersion: z.int().nonnegative().optional() }).strict();
export const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: Uuid, details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict();

export const JoinRoomRequest = z.object({ ...Context.shape, idempotencyKey: Key, intentId: Uuid, participantId: Uuid, role: z.enum(["performer", "producer", "monitor"]), disclosureVersion: z.int().positive(), runtimeAdmissionVersion: z.int().positive(), deviceSessionKey: Key }).strict();
export const JoinRoomSuccess = z.object({ epochId: Uuid, providerSessionId: Uuid, expiresAt: DateTime, rosterEntry: z.object({ participantId: Uuid, role: z.enum(["performer", "producer", "monitor"]) }).strict(), version: z.int().positive() }).strict();

export const StartTakeRequest = z.object({ ...Context.shape, idempotencyKey: Key, intentId: Uuid, conductorParticipantId: Uuid, timingModel: z.enum(["server_clock", "conductor_clock"]), tempoBpm: z.number().min(20).max(400), capturePolicyVersion: z.int().positive(), cueProfileVersion: z.int().positive(), talkbackPolicyVersion: z.int().positive(), expectedEndpointIds: z.array(Uuid).min(1).max(8) }).strict();
export const StartTakeSuccess = z.object({ epochId: Uuid, takeId: Uuid, state: z.literal("rolling"), conductorParticipantId: Uuid, timingModel: z.enum(["server_clock", "conductor_clock"]), version: z.int().positive() }).strict();

export const UpdateCueMixRequest = z.object({ ...Context.shape, idempotencyKey: Key, intentId: Uuid, participantId: Uuid, epochId: Uuid, sources: z.array(z.object({ sourceId: Uuid, gainDb: z.number().min(-60).max(12), pan: z.number().min(-1).max(1), muted: z.boolean() }).strict()).max(32), selfMonitor: z.boolean(), saveProfile: z.boolean(), profileName: z.string().trim().max(80).nullable() }).strict();
export const UpdateCueMixSuccess = z.object({ cueMixId: Uuid, state: z.literal("active"), profileId: Uuid.nullable(), version: z.int().positive() }).strict();

export const UseTalkbackRequest = z.object({ ...Context.shape, idempotencyKey: Key, intentId: Uuid, epochId: Uuid, mode: z.enum(["momentary", "latched"]), active: z.boolean(), duckDb: z.number().min(0).max(24), captureExcluded: z.literal(true) }).strict();
export const UseTalkbackSuccess = z.object({ monitoringProfileId: Uuid, active: z.boolean(), captureExcluded: z.literal(true), version: z.int().positive() }).strict();

export const GrantListenerRequest = z.object({ ...Context.shape, idempotencyKey: Key, intentId: Uuid, listenerPartyId: Uuid, quality: z.enum(["audio", "video", "low_bandwidth"]), canComment: z.boolean(), startsAt: DateTime, endsAt: DateTime, performerNotificationVersion: z.int().positive() }).strict();
export const GrantListenerSuccess = z.object({ grantId: Uuid, state: z.enum(["active", "pending_objection"]), endsAt: DateTime, version: z.int().positive() }).strict();

export const RecordListenerNoteRequest = z.object({ ...Context.shape, idempotencyKey: Key, grantId: Uuid, takeId: Uuid, anchor: z.object({ kind: z.enum(["point", "range"]), startMs: z.int().nonnegative(), endMs: z.int().nonnegative().nullable(), delayMs: z.number().min(-10000).max(10000), uncertaintyMs: z.number().nonnegative().max(10000) }).strict(), body: z.string().trim().min(1).max(2000) }).strict();
export const RecordListenerNoteSuccess = z.object({ noteId: Uuid, state: z.enum(["queued", "transferred"]), takeId: Uuid, version: z.int().positive() }).strict();

export const ReconnectParticipantRequest = z.object({ ...Context.shape, idempotencyKey: Key, intentId: Uuid, participantId: Uuid, priorEpochId: Uuid, lastServerSequence: z.int().nonnegative(), deviceSessionKey: Key, cueProfileVersion: z.int().positive() }).strict();
export const ReconnectParticipantSuccess = z.object({ presenceId: Uuid, epochId: Uuid, gapStartedAt: DateTime.nullable(), gapEndedAt: DateTime.nullable(), state: z.enum(["reconnected", "awaiting_resync"]), version: z.int().positive() }).strict();

export const RecordAuthorityInterruptionRequest = z.object({ ...Context.shape, idempotencyKey: Key, intentId: Uuid, epochId: Uuid, actorParticipantId: Uuid, cause: z.enum(["conductor_lost", "producer_lost"]), occurredAt: DateTime, deputyParticipantId: Uuid.nullable(), newEpochRequired: z.literal(true) }).strict();
export const RecordAuthorityInterruptionSuccess = z.object({ interruptionId: Uuid, takeId: Uuid, epochId: Uuid, takeState: z.enum(["interrupted", "finalizing"]), deputyAuthorized: z.boolean(), version: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `RTS-LIVE-API-01` | `JoinRoomRequest` | `JoinRoomSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-LIVE-API-02` | `StartTakeRequest` | `StartTakeSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-LIVE-API-03` | `UpdateCueMixRequest` | `UpdateCueMixSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-LIVE-API-04` | `UseTalkbackRequest` | `UseTalkbackSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-LIVE-API-05` | `GrantListenerRequest` | `GrantListenerSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-LIVE-API-06` | `RecordListenerNoteRequest` | `RecordListenerNoteSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-LIVE-API-07` | `ReconnectParticipantRequest` | `ReconnectParticipantSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-LIVE-API-08` | `RecordAuthorityInterruptionRequest` | `RecordAuthorityInterruptionSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `RTS-LIVE-API-01` | Require authenticated human/acting party, named roster role, recording disclosure and current runtime capability. Anonymous/shared-link/dial-in fails with `NOT_AUTHORIZED` or `DISCLOSURE_REQUIRED`; no room presence is written before provider success. |
| `RTS-LIVE-API-02` | Require producer/conductor authority, current epoch, frozen timing/cue/talkback/capture policy and every recording endpoint durable. Missing durability returns `DURABLE_CAPTURE_UNAVAILABLE`; no rolling take or partial epoch. |
| `RTS-LIVE-API-03` | Require performer owns participant ID and epoch; source count/gain/pan are bounded; producer may seed/observe but cannot overwrite local self-monitor; profile write occurs only when `saveProfile=true`. |
| `RTS-LIVE-API-04` | Require producer/current epoch, bounded ducking and explicit capture exclusion. Momentary is default; latched state is visible; ducking failure leaves speech reachable and cannot add talkback to master. |
| `RTS-LIVE-API-05` | Require identity-bound listener, future window, quality/comment capability and performer notification. Objection creates visible pending/denied state; grant is immediately revocable. |
| `RTS-LIVE-API-06` | Require active grant with comment capability, take access, bounded delay/uncertainty and point/range ordering. Note queues until take end and transfers durable ownership to Shard 09; no note interrupts take. |
| `RTS-LIVE-API-07` | Require same named participant, prior epoch/sequence, current auth and cue profile. Record one named gap, re-auth/re-sync before stream, preserve local capture and never create a second attendance identity. |
| `RTS-LIVE-API-08` | Require current conductor/producer/deputy role, epoch and cause. Conductor loss ends current take; producer loss grants only predeclared deputy room powers after take; successor always requires a new epoch. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `RTS-LIVE-API-01` | `NOT_AUTHORIZED`, `DISCLOSURE_REQUIRED`, `RUNTIME_INCOMPATIBLE`, `MINOR_DISABLED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for known role denied; `404` hides unknown intent/participant. | Required 15 minutes; hash includes intent/participant/role/disclosure/runtime. Replay returns existing provider session metadata; mismatch returns `IDEMPOTENCY_MISMATCH`. | 6 joins/minute/identity/intent; 30/minute/party. | Log operationId, requestId, intent/participant hashes, role, decision class and provider latency; no token, IP or roster details. |
| `RTS-LIVE-API-02` | `CONDUCTOR_REQUIRED`, `DURABLE_CAPTURE_UNAVAILABLE`, `TAKE_STATE_CONFLICT`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonproducer; `404` hides unknown intent. | Required 24 h; hash includes epoch/conductor/policy/endpoints. Replay returns same take; mismatch returns `IDEMPOTENCY_MISMATCH`. | 5 starts/hour/intent; 20/hour/producer. | Log operationId, requestId, epoch/take IDs, endpoint-ready count, timing/policy versions and result; no audio or device identifiers. |
| `RTS-LIVE-API-03` | `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for nonowner performer; `404` hides participant/intent. | Required 24 h; hash includes participant/epoch/mix/profile. Replay returns current mix; mismatch returns `IDEMPOTENCY_MISMATCH`. | 120 mix updates/minute/performer; 10 profile saves/minute. | Log operationId, requestId, participant/epoch, source count, save flag and latency; no source names or private mix values. |
| `RTS-LIVE-API-04` | `NOT_AUTHORIZED`, `TAKE_STATE_CONFLICT`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonproducer; `404` hides unknown epoch. | Required 5 minutes; hash includes epoch/mode/active/duck value; Replay returns state; mismatch returns `IDEMPOTENCY_MISMATCH`. | 60 talkback commands/minute/producer; latch changes 10/minute. | Log operationId, requestId, epoch, mode, active, captureExcluded and duck result; no speech/audio content. |
| `RTS-LIVE-API-05` | `LISTENER_GRANT_REQUIRED`, `NOT_AUTHORIZED`, `DISCLOSURE_REQUIRED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonproducer/blocked listener; `404` hides unknown intent/listener. | Required 24 h; hash includes listener/window/capabilities. Replay returns grant; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 grants/hour/producer; 10 listener requests/hour. | Log operationId, requestId, grant/intent hashes, capability class, expiry, objection count; no listener identity or comments. |
| `RTS-LIVE-API-06` | `COMMENT_GRANT_REQUIRED`, `NOT_AUTHORIZED`, `TAKE_STATE_CONFLICT`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for listener without comment grant; `404` hides unknown grant/take. | Required 24 h; hash includes grant/take/anchor/body hash. Replay returns note; mismatch returns `IDEMPOTENCY_MISMATCH`. | 60 notes/hour/listener; 10/minute/take. | Log operationId, requestId, note/grant/take IDs, anchor kind, queue status; redact note body and learner identity. |
| `RTS-LIVE-API-07` | `NOT_AUTHORIZED`, `PREFLIGHT_STALE`, `TAKE_STATE_CONFLICT`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for different human; `404` hides intent/participant. | Required 15 minutes; hash includes participant/epoch/sequence/profile. Replay returns presence/gap; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 reconnects/hour/participant; 5/minute/intent. | Log operationId, requestId, participant/epoch, gap duration bucket and resync result; no IP/device fingerprint. |
| `RTS-LIVE-API-08` | `CONDUCTOR_REQUIRED`, `NOT_AUTHORIZED`, `TAKE_STATE_CONFLICT`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonauthority/deputy; `404` hides unknown intent/epoch. | Required 24 h; hash includes epoch/actor/cause/deputy. Replay returns interruption; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 interruption commands/hour/intent; one winning claim/epoch. | Log operationId, requestId, epoch/take IDs, cause, deputy-authorized flag and state; no private speech/notes. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `realtime`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Provider tokens are short-lived secrets outside table fields; BE00 migration, audit, encryption and RLS policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `transport_epoch` | `id uuid PK`; `intent_id uuid NOT NULL FK session_intent`; `epoch_number bigint NOT NULL CHECK >0`; `conductor_participant_id uuid NOT NULL FK session_participant`; `timing_model text NOT NULL CHECK server_clock/conductor_clock`; `tempo_bpm numeric NOT NULL CHECK 20..400`; `capture_policy_version bigint NOT NULL`; `cue_profile_version bigint NOT NULL`; `talkback_policy_version bigint NOT NULL`; `state text NOT NULL CHECK prepared/rolling/interrupted/closed`; `version bigint NOT NULL`. | Unique `(intent_id, epoch_number)`; `(intent_id, state)`; `(conductor_participant_id, created_at DESC)`. | Named participants read safe epoch; producer/conductor updates under CAS; provider token not stored; anon no grant. |
| `cue_mix_state` | `id uuid PK`; `epoch_id uuid NOT NULL FK transport_epoch`; `participant_id uuid NOT NULL FK session_participant`; `sources jsonb NOT NULL CHECK array`; `self_monitor boolean NOT NULL`; `profile_id uuid NULL FK monitoring_profile`; `state text NOT NULL CHECK active/replaced`; `version bigint NOT NULL`. | Unique `(epoch_id, participant_id, version)`; `(participant_id, updated_at DESC)`; `(epoch_id, state)`. | Performer reads/writes own mix; producer reads aggregate/seed projection only; no cross-participant write; anon no grant. |
| `monitoring_profile` | `id uuid PK`; `owner_participant_id uuid NOT NULL FK session_participant`; `name text NOT NULL CHECK length 1..80`; `mix_snapshot jsonb NOT NULL CHECK object`; `talkback_mode text NOT NULL CHECK momentary/latched`; `duck_db numeric NOT NULL CHECK 0..24`; `capture_excluded boolean NOT NULL CHECK true`; `version bigint NOT NULL`. | Unique `(owner_participant_id, name)`; `(owner_participant_id, updated_at DESC)`. | Performer owns profile; producer may seed through explicit command; no profile public grant. |
| `listener_grant` | `id uuid PK`; `intent_id uuid NOT NULL FK session_intent`; `listener_party_id uuid NOT NULL FK party`; `issuer_party_id uuid NOT NULL FK party`; `quality text NOT NULL CHECK audio/video/low_bandwidth`; `can_comment boolean NOT NULL`; `starts_at/ends_at timestamptz NOT NULL CHECK ends_at>starts_at`; `state text NOT NULL CHECK pending_objection/active/revoked/expired/denied`; `version bigint NOT NULL`. | Unique `(intent_id, listener_party_id, starts_at)`; `(intent_id, state, ends_at)`; `(listener_party_id, state)`. | Listener selects own grant; producer/performers see visible capability/expiry; issuer revokes; anon no grant. |
| `listener_presence` | `id uuid PK`; `grant_id uuid NOT NULL FK listener_grant`; `participant_id uuid NOT NULL FK session_participant`; `joined_at timestamptz NOT NULL`; `left_at timestamptz NULL CHECK > joined_at`; `state text NOT NULL CHECK connected/disconnected/revoked`; `version bigint NOT NULL`. | Unique `(grant_id, participant_id, joined_at)`; `(grant_id, state)`; `(participant_id, joined_at DESC)`. | Listener sees own presence; performers see roster-safe presence; service writes server times; no public/anon grant. |
| `interruption_fact` | `id uuid PK`; `intent_id uuid NOT NULL FK session_intent`; `epoch_id uuid NOT NULL FK transport_epoch`; `take_id uuid NOT NULL FK take`; `participant_id uuid NOT NULL FK session_participant`; `cause text NOT NULL CHECK conductor_lost/producer_lost/network_loss`; `started_at timestamptz NOT NULL`; `ended_at timestamptz NULL`; `hold_elapsed_ms bigint NOT NULL CHECK >=0`; `local_capture_state text NOT NULL`; `deputy_authorized boolean NOT NULL`; `state text NOT NULL CHECK recorded/sealed`; `version bigint NOT NULL`. | `(intent_id, epoch_id, started_at)`; `(participant_id, started_at DESC)`; `(cause, state)`. | Named participant/producer sees own safe fact; room service writes; commercial/evidence projectors consume scoped event; anon no grant. |

### State, Concurrency and Transaction Rules

- `transport_epoch` moves `prepared → rolling → interrupted|closed`; only one rolling epoch per intent. Start locks intent/participants, requires conductor and durable endpoints, freezes timing/control versions, then creates the capture-split `take` seam and transport event atomically.
- Join grants a provider session only after human/acting-party, disclosure and runtime checks. Presence is written after provider success; provider/replay keys prevent duplicate sessions.
- Cue updates are performer-local and versioned; producer seed is a separate authorized path. Talkback graph has a structural capture-exclusion edge, visible latch state and ducking guard that cannot mute speech.
- Listener grants are `pending_objection → active → revoked|expired|denied`; notification/objection is visible before stream. Notes require separate comment capability, queue through take end, and transfer once to Shard 09.
- Disconnect writes one named `interruption_fact` gap per epoch/participant. Reconnect re-authenticates and re-syncs before stream; conductor loss interrupts/finalizes the current take and requires a new epoch/election. Producer loss never grants commerce/rights authority.

### Grants, RLS and Retention

`realtime_api` receives execute on room/control/listener/interruption RPCs; `realtime_worker` writes provider/outbox projections; `realtime_migrator` owns DDL. RLS uses BE00 `current_actor_id()` and participant/issuer predicates. Provider tokens expire at room close; listener/transport facts retain seven years for dispute/evidence; raw device/network data is minimized and hashed.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `RTS-LIVE-API-01` | Named human participant with disclosure/runtime/grant. | `403` for known role denied; `404` hides unknown intent/participant. |
| `RTS-LIVE-API-02` | Producer/conductor with durable capture readiness. | `403` for nonproducer; `404` hides unknown intent. |
| `RTS-LIVE-API-03` | Performer owns participant cue; producer seed/observe is scoped. | `403` for wrong performer; `404` hides unknown participant/intent. |
| `RTS-LIVE-API-04` | Producer/current epoch only. | `403` for nonproducer; `404` hides unknown epoch. |
| `RTS-LIVE-API-05` | Producer issuer; listener must be named and visible to performers. | `403` for nonissuer/blocked listener; `404` hides unknown intent. |
| `RTS-LIVE-API-06` | Listener with current comment grant. | `403` for missing capability; `404` hides unknown grant/take. |
| `RTS-LIVE-API-07` | Same named participant and prior epoch. | `403` for different human; `404` hides unknown intent/participant. |
| `RTS-LIVE-API-08` | Current conductor/producer or predeclared deputy. | `403` for nonauthority; `404` hides unknown intent/epoch. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `RTS-LIVE-API-01` | `requestId` → `strictCors(realtimeRoomOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(roomJoin)` → `parseZod(JoinRoomRequest)` → `idempotency(15m)` → `authorizeNamedParticipant` → `disclosureAndRuntimeGate` → `roomProvider` → `presenceTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-LIVE-API-02` | `requestId` → `strictCors(realtimeControlOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(takeStart)` → `parseZod(StartTakeRequest)` → `idempotency(24h)` → `authorizeProducerConductor` → `durableCaptureGate` → `epochTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-LIVE-API-03` | `requestId` → `strictCors(realtimeControlOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(cueMix)` → `parseZod(UpdateCueMixRequest)` → `idempotency(24h)` → `authorizePerformerLocal` → `cueTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-LIVE-API-04` | `requestId` → `strictCors(realtimeControlOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(talkback)` → `parseZod(UseTalkbackRequest)` → `idempotency(5m)` → `authorizeProducerEpoch` → `captureExclusionGuard` → `monitorTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-LIVE-API-05` | `requestId` → `strictCors(realtimeListenerOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(listenerGrant)` → `parseZod(GrantListenerRequest)` → `idempotency(24h)` → `authorizeProducer` → `notifyPerformers` → `listenerTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-LIVE-API-06` | `requestId` → `strictCors(realtimeListenerOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(listenerNote)` → `parseZod(RecordListenerNoteRequest)` → `idempotency(24h)` → `authorizeCommentGrant` → `anchorGuard` → `noteOutbox` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-LIVE-API-07` | `requestId` → `strictCors(realtimeRoomOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(reconnect)` → `parseZod(ReconnectParticipantRequest)` → `idempotency(15m)` → `authorizeNamedParticipant` → `reauthAndResync` → `gapTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-LIVE-API-08` | `requestId` → `strictCors(realtimeControlOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(authorityInterruption)` → `parseZod(RecordAuthorityInterruptionRequest)` → `idempotency(24h)` → `authorizeAuthorityOrDeputy` → `epochEndTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |

### Security and Privacy Controls

Use one-time provider tokens, endpoint-scoped credentials, server sequence/clock, opaque IDs, private cache keys and parameterized SQL. Never accept client presence, conductor state, capture inclusion or authority transfer as truth. Talkback exclusion is graph-level and tested before capture. Listener access is visible/revocable; comments and notes are encrypted/private. CORS never permits `*` with credentials; room/control responses are `private, no-store`.

## Data Flow

1. BE00 authenticates human/acting party, validates strict Zod input and reserves idempotency key.
2. Join checks named role, disclosure/runtime, obtains room token, then writes presence; denial creates no row.
3. Start locks epoch and verifies all durable capture endpoints before rolling a capture-split `take`; timing/cue/talkback policy is frozen.
4. Cue and talkback commands update local control state; talkback graph excludes capture structurally and displays latch/ducking state.
5. Listener grant notifies performers and records objections; notes require comment capability and queue to Shard 09.
6. Reconnect records named gap and resyncs; authority interruption ends epoch/take as required and permits no silent successor.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `realtime.transport-epoch.changed.v1` | `{eventId, intentId, epochId, conductorPseudonym, timingModel, policyVersions, state, version, occurredAt}`; no token/audio/device data. | Room/capture/continuity projectors; at-least-once ordered by intent/epoch/version and deduped by eventId. |
| `realtime.listener-grant.changed.v1` | `{eventId, intentId, grantId, listenerPseudonym, capabilities, startsAt, endsAt, state, version, occurredAt}`; no note body. | Monitor transport/roster and notification projectors; revocation is immediate. |
| `realtime.interruption.recorded.v1` | `{eventId, intentId, epochId, takeId, participantPseudonym, durationBucket, causeClass, localCaptureState, version, occurredAt}`. | Room/commercial evidence and continuity workers; no billing judgment is derived here. |

Consumers reject stale versions, retry at 2s/8s/32s, dead-letter after five attempts with an alert, preserve the last safe roster/control projection, and carry BE00 `requestId`/`correlationId`.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Human/disclosure/runtime/role denial | Typed `ApiError` before provider/presence mutation; no hidden roster or participant list. |
| Room provider timeout | `503 DEPENDENCY_UNAVAILABLE`; no presence/token; retry same key after circuit recovery. |
| Durable capture unavailable | `DURABLE_CAPTURE_UNAVAILABLE`; no rolling take or false readiness. |
| Cue/profile or talkback stale epoch | `VERSION_CONFLICT`/`TAKE_STATE_CONFLICT`; reread current local state; never overwrite another performer or include talkback. |
| Listener objection/authorization outage | Grant remains pending/denied or stream stops fail closed; visible history preserved; no silent listener. |
| Listener note handoff outage | Keep encrypted note in durable outbox through take end; transfer once to Shard 09; no take interruption. |
| Network disconnect | Continue authorized local capture, append one named gap, re-auth/resync before stream; never fabricate continuity. |
| Conductor/producer loss | End/finalize current take/epoch, record interruption; deputy receives only declared room powers and new epoch is explicit. |
| Duplicate provider/event/replay | Dedupe by provider session/event/idempotency key; return original effect and never duplicate presence/grant/interruption. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `RTS-LIVE-API-01` | Identity/disclosure/role schema and exact room response. | Human/acting party, no anonymous/link/dial-in, token secrecy, CORS/rate. | Provider-before-presence, replay and RLS. | Provider timeout/breaker, no denial row, redacted audit. |
| `RTS-LIVE-API-02` | Timing/policy/endpoint bounds and rolling response. | Producer/conductor, durable endpoint gate, frozen epoch, CORS/rate. | Epoch/take seam atomicity, one rolling epoch and event. | Capture readiness outage, stale state, metrics. |
| `RTS-LIVE-API-03` | Mix/gain/pan/profile bounds and exact response. | Performer local ownership, producer seed scope, no override, CORS/rate. | Versioned mix/profile and replay. | Epoch conflict, rapid update throttling, value redaction. |
| `RTS-LIVE-API-04` | Latch/duck/exclusion schema and exact response. | Producer authority, structural capture exclusion, reachable speech. | Monitoring profile/epoch CAS and event. | Ducking failure, provider outage, graph/tap test. |
| `RTS-LIVE-API-05` | Window/quality/capability schema and grant states. | Identity-bound listener, notification/objection, immediate revoke. | Grant/presence state, dedupe and RLS. | Notification outage, hidden listener test, event replay. |
| `RTS-LIVE-API-06` | Anchor/range/delay/body bounds and queue response. | Comment grant, note privacy, no interruption, CORS/rate. | Durable outbox and Shard 09 handoff once. | Handoff timeout, duplicate note, encrypted telemetry. |
| `RTS-LIVE-API-07` | Sequence/epoch/profile schema and gap response. | Same human, re-auth/resync, no second attendance. | Gap fact, local continuity and replay. | Reconnect race/outage, gap metrics without fingerprint. |
| `RTS-LIVE-API-08` | Cause/deputy/epoch schema and interruption response. | Conductor/producer/deputy scope, no silent transfer. | Epoch end, take interruption seam, CAS/event. | Authority race, duplicate claim, safe audit. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, room/epoch authority, local cue, capture exclusion, listener capability, gap and interruption algorithms. PostgreSQL tests run RLS, CAS, unique grants, append-only facts and provider-token absence. Adapter tests exercise exact room/capture/notification/comment timeout, retry/backoff, breaker and provider idempotency. Worker tests prove event ordering, revocation, note handoff and stale-event rejection. Playwright covers join refusal, take start durability, local cue/profile, talkback latch/exclusion, listener objection/note, reconnect gap and conductor loss, with keyboard focus and safe copy. The gate fails on any route collision, missing operation row, non-`ApiError` response, token/audio leak or silent authority transfer.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all eight routes have strict Zod 4 request/success/error schemas, bounded fields, statuses and exact error envelope.
- **Pass 2 — macro boundary:** identity, room provider, capture readiness, notification, Shard 09 comments and BE00 ownership are explicit seams; no capture/alignment route is duplicated.
- **Pass 3 — lifecycle/race:** epochs, listener grants, presence gaps and authority interruption use CAS, provider keys, visible revocation and explicit succession.
- **Pass 4 — failure/abuse:** no hidden listeners, anonymous joins, talkback leakage, false durability, fabricated continuity or silent producer powers; retries/breakers are testable.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, FKs, indexes, RLS/grants, retention and redacted events.

## Ambiguity Gate

**PASS.** The split is source-aligned (`RTS-05`–`RTS-12`), all eight routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, failure recovery and tests. Identity, room, capture-readiness, notification and Shard 09 seams specify exact timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 17 and deep dive; locked identity-bound room, durable-take gate, local controls, visible listener grants, named gaps and explicit interruption authority. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox and shared middleware.
- [BE Shard 17a — Runtime admission, latency and discovery](17a-runtime-admission-latency-discovery.md) for runtime/preflight/path prerequisites.
- [BE Shard 17c — Continuity, capture and alignment](17c-continuity-capture-alignment-attendance.md) for take durability, capture assets and attendance closure.
- [BE Shard 17d — Overdub requests and delivery](17d-overdub-requests-delivery.md) for overdub mode and bed handoff.
- [IA Shard 09 — Projects and collaboration](../ia/09-projects-collaboration.md) for durable listener-note handoff and project ownership.
