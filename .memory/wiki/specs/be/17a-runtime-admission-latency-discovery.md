# Runtime Admission, Preflight, Path Measurement & Discovery — Backend Specification

**Status:** Complete
**IA source:** [Shard 17 — Real-time jamming and remote sessions](../ia/17-realtime-sessions.md)
**Deep-dive source:** [Deep Dive 17 — Real-time jamming and remote sessions](../ia/deep-dives/17-realtime-sessions.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns remote-session intent creation, specialized runtime admission, scheduled device preflight, bounded pairwise network measurement, and coarse opt-in partner discovery. It contains `RTS-01`, `RTS-02`, `RTS-03`, and `RTS-04`. Room entry/live controls, capture/alignment/attendance, overdub, project containers, commercial consequences, and rights evidence remain sibling boundaries. Runtime capability registry, identity, network probes, path policy, and discovery projection are external seams.

## Classification

- **Type:** runtime admission and privacy-preserving discovery boundary.
- **Boundary:** `runtime_admission`, `session_intent`, `session_participant`, `endpoint_capability`, `preflight_result`, `network_observation`, and `path_verdict` ownership; room transport, capture, project/session containers, and credit/evidence conclusions are outside this split.
- **Expected operations:** four HTTP operations, one for each assigned IA interaction (`RTS-01`, `RTS-02`, `RTS-03`, `RTS-04`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** runtime/version/provider/region/capability admission is explicit; preflight informs and records but does not promise or block; path measurement reports directional intervals and uncertainty rather than RTT/2 certainty; discovery is opt-in, coarse, mutual-intent and never a precise location guarantee.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/17-realtime-sessions.md:40-47` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **08.01 Latency Budget & Playability** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.01-latency-budget-playability/08.01-latency-budget-playability-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [17a](17a-runtime-admission-latency-discovery.md#route-registry): `RTS-RUN-API-01`–`RTS-RUN-API-03`. |
| **08.02 Playable Radius & Peer Matching** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.02-playable-radius-peer-matching/08.02-playable-radius-peer-matching-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [17a](17a-runtime-admission-latency-discovery.md#route-registry): `RTS-RUN-API-04`. |
| **08.03 Remote Monitoring & Session Attendance** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.03-remote-monitoring-session-attendance/08.03-remote-monitoring-session-attendance-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [17b](17b-live-room-monitoring-controls.md#route-registry): `RTS-LIVE-API-01`–`RTS-LIVE-API-03`; [17c](17c-continuity-capture-alignment-attendance.md#route-registry): `RTS-CAP-API-04`. |
| **08.04 Talkback & Cue Mixes** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.04-talkback-cue-mixes/08.04-talkback-cue-mixes-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [17b](17b-live-room-monitoring-controls.md#route-registry): `RTS-LIVE-API-03`–`RTS-LIVE-API-04`. |
| **08.05 Session Capture & Recall** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.05-session-capture-recall/08.05-session-capture-recall-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [17c](17c-continuity-capture-alignment-attendance.md#route-registry): `RTS-CAP-API-01`–`RTS-CAP-API-03`. |
| **08.06 Session Pre-Flight & Rig Readiness Check** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.06-session-preflight-rig-readiness.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [17a](17a-runtime-admission-latency-discovery.md#route-registry): `RTS-RUN-API-02`. |
| **08.07 Overdub Mode (Latency-Independent Tracking)** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.07-overdub-mode.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [17d](17d-overdub-requests-delivery.md#route-registry): `RTS-OD-API-01`–`RTS-OD-API-02`. |
| **08.08 Interruption, Reconnect & Session Continuity** — [ideation source](../ideation/08-realtime-jamming-remote-sessions/08.08-interruption-reconnect-continuity.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [17b](17b-live-room-monitoring-controls.md#route-registry): `RTS-LIVE-API-07`–`RTS-LIVE-API-08`; [17c](17c-continuity-capture-alignment-attendance.md#route-registry): `RTS-CAP-API-04`. |

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `17-realtime-sessions.md` | `Overview`, `Scope Reconciliation`, `Architecture Decisions`, `Features`, `Acceptance Criteria` lines 7–68 | Runtime admission, provider/cost controls, preflight, path measurement, discovery and privacy decisions. |
| `17-realtime-sessions.md` | `Interactions` lines 70–93 | Exact `RTS-01`–`RTS-04` preconditions, outcomes, uncertainty and location rules. |
| `17-realtime-sessions.md` | `Contracts`, `Core Types and Errors`, `Session and Transport` lines 102–129 | `SessionMode`, `RuntimeAdmission`, `PathVerdict`, runtime errors and intent/preflight/measurement/playability contracts. |
| `17-realtime-sessions.md` | `Data Models` and typed registry lines 145–195 | Canonical runtime, intent, participant, endpoint, preflight, observation and path models. |
| `17-realtime-sessions.md` | `Access Control`, `Accessibility` lines 196–232 | Human identity, adult participant, opt-in discovery and safe absence/refusal rules. |
| `17-realtime-sessions.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 233–305 | Session-intent/preflight/path events, runtime failures, inference resistance and recovery. |
| `17-realtime-sessions.md` | `Cross-Shard Section Contract Map`, `Dependency References` lines 306–323 | BE00 runtime, identity, safety, project, service and rights dependencies. |
| `deep-dives/17-realtime-sessions.md` | `Specialized Runtime Admission`, `Pairwise Measurement and Discovery Algorithm` lines 19–40 | Admission inputs, probe bounds, directional intervals, freshness, mutual intent and coarse discovery. |
| `deep-dives/17-realtime-sessions.md` | `Abuse and Recovery Verification`, `Cross-Shard Contracts`, `Implementation Envelope` lines 116–149 | Cost ceilings, location inference tests, auth/retry requirements and seam boundaries. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor/acting context, replay ledger, limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Cloudflare/Supabase boundaries, PII minimization, Zod-first contracts and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `RTS-01` Producer creates remote session intent | Resolve project/party authority, adult participants, mode, schedule, recording/jurisdiction, runtime/policy versions and cost ceiling; no transport yet. | `RTS-RUN-API-01` | `session_intent`, `session_participant`, `runtime_admission`; `realtime.session-intent.changed.v1` |
| `RTS-02` Participant runs scheduled preflight | Check authorized device/storage/sample rate/local path/network/mode; record timestamped pass/fail/not-run/stale facts and specific fixes without promise/block. | `RTS-RUN-API-02` | `endpoint_capability`, `preflight_result`, `runtime_admission`; `realtime.preflight.recorded.v1` |
| `RTS-03` Participants measure pairwise path | Bounded repeated directional probes; report interval, app/device/network decomposition, confidence and freshness; asymmetry/clock ambiguity remains unknown. | `RTS-RUN-API-03` | `network_observation`, `path_verdict`; `realtime.path-verdict.changed.v1` |
| `RTS-04` User discovers possible partners | Opt-in coarse region/instrument/availability and centrally owned fresh pair verdict; candidates have no precise location guarantee. | `RTS-RUN-API-04` | `path_verdict`, `session_intent`; discovery projection |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `RTS-01` | `RTS-RUN-API-01` | `POST /api/v1/realtime/session-intents` | `CreateSessionIntentRequest` → `CreateSessionIntentSuccess` (`201`) | Adult human/party authority, mode/runtime/policy versions, cost ceiling, participant consent, idempotency and typed `ApiError`. |
| `RTS-02` | `RTS-RUN-API-02` | `POST /api/v1/realtime/session-intents/{intentId}/preflight` | `RecordPreflightRequest` → `RecordPreflightSuccess` (`201`) | Named participant/device capability, scheduled window, stale facts, nonblocking result, rate and typed `ApiError`. |
| `RTS-03` | `RTS-RUN-API-03` | `POST /api/v1/realtime/session-intents/{intentId}/path-measurements` | `MeasurePathRequest` → `MeasurePathSuccess` (`201`) | Mutual participant authorization, bounded probe, uncertainty/asymmetry, freshness, policy version and typed `ApiError`. |
| `RTS-04` | `RTS-RUN-API-04` | `POST /api/v1/realtime/partner-discovery` | `DiscoverPartnersRequest` → `DiscoverPartnersSuccess` (`200`) | Opt-in/coarse filters, hard privacy restrictions, verdict freshness, query throttling and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `RTS-RUN-API-01` | `POST` | `/api/v1/realtime/session-intents` | `RTS-01` | Authenticated adult producer; project/party authority and named adult participants are verified. | `201` `CreateSessionIntentSuccess` |
| `RTS-RUN-API-02` | `POST` | `/api/v1/realtime/session-intents/{intentId}/preflight` | `RTS-02` | Authenticated named participant; participant owns endpoint facts for the intent. | `201` `RecordPreflightSuccess` |
| `RTS-RUN-API-03` | `POST` | `/api/v1/realtime/session-intents/{intentId}/path-measurements` | `RTS-03` | Authenticated named participant in the intent; both endpoints are authorized for pair measurement. | `201` `MeasurePathSuccess` |
| `RTS-RUN-API-04` | `POST` | `/api/v1/realtime/partner-discovery` | `RTS-04` | Authenticated adult opted-in user; result is a coarse projection with no target ownership claim. | `200` `DiscoverPartnersSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Runtime capability registry | `{runtimeVersion, provider, region, mode, capabilities, policyVersion}` → `{admitted, admissionVersion, costCeiling, securityReview, reasonCode}` | 500 ms | 2 retries at 100 ms/300 ms; no retry on incompatible result | Open after 5 failures/30 s; intent returns `RUNTIME_DISABLED` or `RUNTIME_INCOMPATIBLE`; half-open after 20 s. |
| Pairwise probe service | `{intentId, endpointA, endpointB, nonce, sampleCount, deadline}` → `{observations[], clockBasis, providerVersion}` | 1,000 ms | 2 retries at 100 ms/300 ms with fresh nonce; never retry a partial result as complete | Open after 4 failures/30 s; measurement returns bounded unknown; half-open after 20 s. |
| Central path/verdict policy | `{pairKey, instrumentPair, bpmCeiling, interval, freshness, policyVersion}` → `{playable, confidence, verdictVersion, reasonClass}` | 500 ms | 2 retries at 75 ms/225 ms; no retry on policy denial | Open after 5 failures/30 s; discovery omits verdict-dependent claim and returns freshness; half-open after 20 s. |
| Opt-in discovery projection | `{actorId, coarseRegion, instruments, availability, mutualIntent, limit, cursor}` → `{candidates[], nextCursor, projectionVersion}` | 600 ms | 2 retries at 100 ms/300 ms; same cursor | Open after 5 failures/30 s; return safe empty/degraded result; half-open after 20 s. |

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

export const CreateSessionIntentRequest = z.object({
  ...Context.shape, idempotencyKey: Key, projectId: Uuid, producerPartyId: Uuid, participantPartyIds: z.array(Uuid).min(2).max(8), mode: z.enum(["live", "monitor", "overdub"]), startsAt: DateTime, endsAt: DateTime, runtimeVersion: z.string().trim().min(1).max(80), provider: z.string().trim().min(1).max(80), region: z.string().trim().min(1).max(80), recordingDisclosureVersion: z.int().positive(), jurisdiction: z.string().trim().length(2).regex(/^[A-Z]{2}$/), policyVersion: z.int().positive(), costCeilingMinor: z.int().nonnegative(), currency: z.string().length(3).regex(/^[A-Z]{3}$/),
}).strict().superRefine((v, c) => { if (v.endsAt <= v.startsAt) c.addIssue({ code: "custom", path: ["endsAt"], message: "end must follow start" }); });
export const CreateSessionIntentSuccess = z.object({ intentId: Uuid, admissionId: Uuid, state: z.literal("prepared"), participantCount: z.int().positive(), version: z.int().positive() }).strict();

export const RecordPreflightRequest = z.object({
  ...Context.shape, idempotencyKey: Key, intentId: Uuid, endpointId: Uuid, scheduledAt: DateTime, runtimeVersion: z.string().trim().min(1).max(80), deviceClass: z.string().trim().min(1).max(80), storageFreeBytes: z.int().nonnegative(), sampleRateHz: z.int().min(8000).max(192000), localPath: z.enum(["available", "unavailable"]), network: z.enum(["reachable", "unreachable", "unknown"]), capabilities: z.array(z.string().trim().min(1).max(80)).max(40), result: z.enum(["pass", "fail", "not_run", "stale"]), remediation: z.array(z.string().trim().min(1).max(300)).max(12), measuredAt: DateTime,
}).strict();
export const RecordPreflightSuccess = z.object({ preflightId: Uuid, result: z.enum(["pass", "fail", "not_run", "stale"]), remediation: z.array(z.string()), recordedAt: DateTime, version: z.int().positive() }).strict();

export const MeasurePathRequest = z.object({
  ...Context.shape, idempotencyKey: Key, intentId: Uuid, endpointAId: Uuid, endpointBId: Uuid, instrumentA: z.string().trim().min(1).max(80), instrumentB: z.string().trim().min(1).max(80), bpmCeiling: z.int().min(20).max(400), sampleCount: z.int().min(3).max(20), probeDeadline: DateTime, probeNonce: Key,
}).strict();
export const MeasurePathSuccess = z.object({ pathVerdictId: Uuid, playable: z.enum(["yes", "no", "unknown"]), directionalIntervalMs: z.object({ min: z.number().nonnegative(), max: z.number().nonnegative() }).strict(), confidence: z.enum(["high", "medium", "low", "unknown"]), basis: z.enum(["measured", "asymmetric", "clock_ambiguous", "insufficient"]), freshnessUntil: DateTime, version: z.int().positive() }).strict();

export const DiscoverPartnersRequest = z.object({
  ...Context.shape, idempotencyKey: Key, coarseRegion: z.string().trim().min(1).max(80), instruments: z.array(z.string().trim().min(1).max(80)).min(1).max(8), availabilityWindow: z.object({ startsAt: DateTime, endsAt: DateTime }).strict(), mutualIntent: z.literal(true), limit: z.int().min(1).max(50), cursor: z.string().max(256).optional(),
}).strict();
export const DiscoverPartnersSuccess = z.object({ candidates: z.array(z.object({ partnerId: Uuid, instrument: z.string().min(1), coarseRegion: z.string().min(1), availability: z.enum(["matching", "partial"]), pathVerdict: z.enum(["fresh_playable", "fresh_unknown", "stale"]), reason: z.string().min(1).max(200) }).strict()).max(50), nextCursor: z.string().max(256).nullable(), projectionVersion: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `RTS-RUN-API-01` | `CreateSessionIntentRequest` | `CreateSessionIntentSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-RUN-API-02` | `RecordPreflightRequest` | `RecordPreflightSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-RUN-API-03` | `MeasurePathRequest` | `MeasurePathSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-RUN-API-04` | `DiscoverPartnersRequest` | `DiscoverPartnersSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `RTS-RUN-API-01` | Require adult producer, named adult participants, project/party authority, ordered schedule, supported `live`, `monitor` or `overdub` mode, disclosure/jurisdiction/runtime/policy versions and nonnegative cost ceiling. Disabled/incompatible runtime returns `RUNTIME_DISABLED` or `RUNTIME_INCOMPATIBLE`; no transport is created. |
| `RTS-RUN-API-02` | Require named participant/endpoint in scheduled intent, bounded storage/sample-rate/device/network facts and timestamp. Record pass/fail/not-run/stale with remediation; result informs later admission but does not promise or block by itself. |
| `RTS-RUN-API-03` | Require both named endpoints, mutual intent, bounded sample count/deadline and instrument pair. Produce directional intervals and decomposition; asymmetry or clock ambiguity yields `unknown`/low confidence, never RTT/2 certainty. |
| `RTS-RUN-API-04` | Require adult opted-in actor, coarse region/instrument/availability, mutual intent and limit. Hard blocks/restrictions precede ranking; no precise location, comparative rank, hidden opt-out, or unsupported verdict is exposed. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `RTS-RUN-API-01` | `RUNTIME_DISABLED`, `RUNTIME_INCOMPATIBLE`, `NOT_AUTHORIZED`, `MINOR_DISABLED`, `DISCLOSURE_REQUIRED`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for known project/party without authority; `404` hides unknown project/participant. | Required 24 h; hash includes project/participants/mode/schedule/runtime/policy. Replay returns original intent; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 intents/hour/producer; 30/hour/project. | Log operationId, requestId, project/intent IDs, mode, runtime/policy versions, admission result and cost bucket; no exact location/device fingerprint. |
| `RTS-RUN-API-02` | `NOT_AUTHORIZED`, `PREFLIGHT_STALE`, `DEVICE_BUSY`, `DISK_INSUFFICIENT`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for nonparticipant; `404` hides unknown intent/endpoint. | Required 24 h; hash includes intent/endpoint/measured facts. Replay returns preflight; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 preflights/hour/participant; 5/minute/intent. | Log operationId, requestId, intent/endpoint IDs, result class, remediation count and runtime version; redact raw device/path/network identifiers. |
| `RTS-RUN-API-03` | `NOT_AUTHORIZED`, `PATH_UNKNOWN`, `PREFLIGHT_STALE`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for nonparticipant; `404` hides unknown intent/endpoints. | Required 15 minutes; hash includes pair, nonce, sample/deadline and policy. Replay returns same verdict; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 measurements/hour/pair; 5/minute/intent. | Log operationId, requestId, pair pseudonyms, interval bucket, confidence/basis, freshness and provider latency; never exact IP/location. |
| `RTS-RUN-API-04` | `NOT_AUTHORIZED`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for nonadult/opt-out actor; `404` is not used to reveal candidate existence and empty is honest. | Required 24 h; normalized filter/cursor hash. Replay returns same candidate page; mismatch returns `IDEMPOTENCY_MISMATCH`. | 30 searches/minute/user; 10 concurrent queries. | Log operationId, requestId, coarse region bucket, filter dimensions, result count and freshness; no precise location, rank or hidden restriction. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `realtime`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Raw network/device identifiers are encrypted or hashed; BE00 migration, audit and RLS policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `runtime_admission` | `id uuid PK`; `runtime_version text NOT NULL`; `provider text NOT NULL`; `region text NOT NULL`; `mode text NOT NULL CHECK live/monitor/overdub`; `capabilities jsonb NOT NULL CHECK array`; `security_review_version bigint NOT NULL`; `cost_ceiling_minor bigint NOT NULL CHECK >=0`; `state text NOT NULL CHECK admitted/disabled/incompatible`; `version bigint NOT NULL`. | Unique `(runtime_version, provider, region, mode)`; `(state, updated_at DESC)`; `(security_review_version)`. | Service-role registry writes; producer reads own admission projection; no public raw capability/device data; anon no grant. |
| `session_intent` | `id uuid PK`; `project_id uuid NOT NULL FK project`; `producer_party_id uuid NOT NULL FK party`; `runtime_admission_id uuid NOT NULL FK runtime_admission`; `mode text NOT NULL CHECK live/monitor/overdub`; `starts_at/ends_at timestamptz NOT NULL CHECK ends_at>starts_at`; `recording_disclosure_version bigint NOT NULL`; `jurisdiction char(2) NOT NULL`; `policy_version bigint NOT NULL`; `cost_ceiling_minor bigint NOT NULL CHECK >=0`; `state text NOT NULL CHECK prepared/admitted/cancelled`; `version bigint NOT NULL`. | `(project_id, state, starts_at)`; `(producer_party_id, state)`; unique `(project_id, starts_at, version)`. | Producer/project authority selects and updates via CAS; named participants select safe fields; no transport token or raw policy grant; anon no grant. |
| `session_participant` | `id uuid PK`; `intent_id uuid NOT NULL FK session_intent ON DELETE CASCADE`; `party_id uuid NOT NULL FK party`; `role text NOT NULL CHECK producer/performer/monitor`; `consent_version bigint NOT NULL`; `adult_verified boolean NOT NULL`; `state text NOT NULL CHECK invited/accepted/declined`; `version bigint NOT NULL`. | Unique `(intent_id, party_id)`; `(party_id, state)`; `(intent_id, role)`. | Participant selects own row; producer sees named roster after consent; service verifies adult; anon no grant. |
| `endpoint_capability` | `id uuid PK`; `participant_id uuid NOT NULL FK session_participant`; `device_class text NOT NULL`; `runtime_version text NOT NULL`; `sample_rate_hz integer NOT NULL CHECK 8000..192000`; `storage_free_bytes bigint NOT NULL CHECK >=0`; `local_path_state text NOT NULL CHECK available/unavailable`; `network_state text NOT NULL CHECK reachable/unreachable/unknown`; `capabilities jsonb NOT NULL CHECK array`; `version bigint NOT NULL`. | Unique `(participant_id, device_class, runtime_version, version)`; `(participant_id, measured_at DESC)`; `(network_state)`. | Participant selects own capability; service writes verified facts; producer sees only safe readiness class; no raw path/fingerprint grant. |
| `preflight_result` | `id uuid PK`; `intent_id uuid NOT NULL FK session_intent`; `endpoint_id uuid NOT NULL FK endpoint_capability`; `scheduled_at timestamptz NOT NULL`; `measured_at timestamptz NOT NULL`; `result text NOT NULL CHECK pass/fail/not_run/stale`; `remediation jsonb NOT NULL CHECK array`; `fresh_until timestamptz NULL`; `version bigint NOT NULL`. | Unique `(intent_id, endpoint_id, scheduled_at, version)`; `(intent_id, result)`; `(fresh_until)`. | Participant and producer read safe facts; service writes; no raw device/path details; anon no grant. |
| `network_observation` | `id uuid PK`; `intent_id uuid NOT NULL FK session_intent`; `endpoint_a_id uuid NOT NULL FK endpoint_capability`; `endpoint_b_id uuid NOT NULL FK endpoint_capability`; `direction text NOT NULL CHECK a_to_b/b_to_a`; `sample_count smallint NOT NULL CHECK 1..20`; `min_ms numeric NOT NULL CHECK >=0`; `max_ms numeric NOT NULL CHECK max_ms>=min_ms`; `clock_basis text NOT NULL CHECK synchronized/ambiguous/unknown`; `decomposition jsonb NOT NULL CHECK object`; `measured_at timestamptz NOT NULL`; `version bigint NOT NULL`. | `(intent_id, endpoint_a_id, endpoint_b_id, measured_at DESC)`; unique `(intent_id, endpoint_a_id, endpoint_b_id, direction, measured_at)`. | Pair participants read interval projections; raw network identity service-only; no public grant. |
| `path_verdict` | `id uuid PK`; `intent_id uuid NOT NULL FK session_intent`; `pair_key char(64) NOT NULL`; `instrument_pair jsonb NOT NULL CHECK array`; `bpm_ceiling smallint NOT NULL CHECK 20..400`; `directional_min_ms numeric NULL`; `directional_max_ms numeric NULL`; `confidence text NOT NULL CHECK high/medium/low/unknown`; `basis text NOT NULL CHECK measured/asymmetric/clock_ambiguous/insufficient`; `playable text NOT NULL CHECK yes/no/unknown`; `fresh_until timestamptz NOT NULL`; `policy_version bigint NOT NULL`; `version bigint NOT NULL`. | Unique `(pair_key, policy_version, version)`; `(pair_key, fresh_until DESC)`; `(playable, fresh_until)`. | Authorized pair reads verdict; discovery reads coarse projection; service writes; no exact location/IP grant. |

### State, Concurrency and Transaction Rules

- Intent state is `prepared → admitted → cancelled`; admission is a versioned runtime/policy decision and cannot create a room or transport. Participants are named and adult-verified before admission.
- Preflight is an append-only timestamped fact (`pass`, `fail`, `not_run`, `stale`); it informs the later room gate but does not itself block or promise runtime success. A stale result is never relabeled as a pass.
- Pair measurement stores directional observations and uncertainty. A clock-ambiguous/asymmetric pair remains `unknown`; policy computes worst authorized pair bounds and freshness. Verdict updates use CAS and preserve prior observations.
- Discovery requires user opt-in and mutual intent. Hard restrictions run before matching; only coarse region/instrument/availability and fresh safe verdicts are projected. No candidate rank integer or precise location is persisted in public views.
- Intent creation, participant rows, admission decision and `realtime.session-intent.changed.v1` outbox commit atomically. Preflight/path facts and events commit atomically; provider outages leave no fabricated green result.

### Grants, RLS and Retention

`realtime_api` receives execute on intent/preflight/path/discovery RPCs; `realtime_worker` writes admission/projections/outbox; `realtime_migrator` owns DDL. RLS uses BE00 `current_actor_id()` and named participant/project predicates. Device/network raw identifiers are short-retained hashed diagnostics; intent/path facts retain seven years for dispute/evidence, while discovery query telemetry expires after 30 days.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `RTS-RUN-API-01` | Adult producer with project/party authority; named participants consent and pass adult gate. | `403` for known project without authority; `404` hides unknown project/participants. |
| `RTS-RUN-API-02` | Named participant owns endpoint/preflight facts for the intent. | `403` for nonparticipant; `404` hides unknown intent/endpoint. |
| `RTS-RUN-API-03` | Either named participant, with both endpoints authorized for the same intent. | `403` for nonparticipant; `404` hides unknown intent/endpoints. |
| `RTS-RUN-API-04` | Adult opted-in user; candidates are returned from a coarse projection only. | `403` for blocked/nonadult/opt-out actor; `404` is reserved for an absent requester projection and never reveals candidate existence; empty result avoids the candidate oracle. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `RTS-RUN-API-01` | `requestId` → `strictCors(realtimeIntentOrigins)` → `requireAuth` → `requireAdult` → `resolveActingContext` → `rateLimit(sessionIntent)` → `parseZod(CreateSessionIntentRequest)` → `idempotency(24h)` → `authorizeProjectAndParticipants` → `runtimeAdmissionGate` → `intentTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-RUN-API-02` | `requestId` → `strictCors(realtimePreflightOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(runtimePreflight)` → `parseZod(RecordPreflightRequest)` → `idempotency(24h)` → `authorizeNamedParticipant` → `factTimestampGuard` → `preflightTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-RUN-API-03` | `requestId` → `strictCors(realtimeMeasurementOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(pathMeasurement)` → `parseZod(MeasurePathRequest)` → `idempotency(15m)` → `authorizePair` → `probeBudgetGuard` → `measurementTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-RUN-API-04` | `requestId` → `strictCors(realtimeDiscoveryOrigins)` → `requireAuth` → `requireAdultOptIn` → `rateLimit(partnerDiscovery)` → `parseZod(DiscoverPartnersRequest)` → `mutualIntentGuard` → `coarseProjectionOnly` → `traceSearch` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |

### Security and Privacy Controls

Use opaque IDs, one-time nonces, bounded probe counts, server clocks, hashed endpoint identities, coarse-region buckets, private cache keys and parameterized SQL. Never expose precise location, IP, rank integer, hidden restriction, device fingerprint, or an unmeasured playability promise. CORS never permits `*` with credentials; discovery/preflight responses are `private, no-store`.

## Data Flow

1. BE00 authenticates actor/context, validates strict Zod input and reserves the idempotency key.
2. Intent creation verifies project/party/adult authority, resolves runtime admission and stores named participants plus disclosure/policy versions.
3. Preflight records endpoint facts with remediation and freshness; it informs later admission without blocking by itself.
4. Pair measurement runs bounded repeated directional probes, computes interval/uncertainty and asks central policy for a versioned verdict.
5. Discovery filters opt-in coarse projections by hard restrictions/mutual intent, then returns candidates with safe reasons and fresh/stale verdict class.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `realtime.session-intent.changed.v1` | `{eventId, intentId, projectId, producerPseudonym, mode, scheduleBucket, runtimeVersion, policyVersion, state, version, occurredAt}`; no precise party/location/device data. | Project/session projectors and room admission; at-least-once ordered by intent/version and deduped by eventId. |
| `realtime.preflight.recorded.v1` | `{eventId, intentId, participantPseudonym, endpointClass, result, freshness, remediationClasses, version, occurredAt}`; no raw path/network identifiers. | Roster/runtime evidence; stale results remain labeled. |
| `realtime.path-verdict.changed.v1` | `{eventId, pairPseudonyms, instrumentPair, playable, intervalBucket, confidence, freshness, policyVersion, version, occurredAt}`; no IP/location. | Authorized discovery/room policy; unknown remains unknown. |

Consumers reject stale versions, retry at 2s/8s/32s, dead-letter after five attempts with an alert, preserve last safe projections, and carry BE00 `requestId`/`correlationId`.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Adult/admission/authority/disclosure failure | Typed refusal before domain mutation; no intent, participant or transport. |
| Runtime disabled/incompatible or cost ceiling | `RUNTIME_DISABLED`/`RUNTIME_INCOMPATIBLE`; no room admission and no fabricated compatibility. |
| Preflight device/storage/network issue | Record `fail` with actionable remediation; never silently block or relabel as pass. `DISK_INSUFFICIENT`/`DEVICE_BUSY` is typed where command cannot record. |
| Probe timeout/clock ambiguity/asymmetry | Store bounded observations and return unknown/low confidence; retry with fresh nonce; never claim RTT/2 certainty. |
| Path/discovery policy outage | Return safe unknown/degraded/empty result; preserve last safe verdict and retry worker; no precise inference. |
| Version/idempotency race | `VERSION_CONFLICT` or original replay; no duplicate intent, probe effect or discovery cursor. |
| Source deletion/restriction | Tombstone required facts, invalidate discovery projection, retain audit, and do not expose deleted party/location. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `RTS-RUN-API-01` | Strict mode/schedule/participant/version/cost schema and exact `201` envelope. | Adult/party/project authority, disclosure, runtime gate, CORS/rate. | Atomic intent/participants/admission/outbox, CAS and replay. | Runtime timeout/breaker, disabled result, redacted telemetry. |
| `RTS-RUN-API-02` | Fact bounds/result union/remediation and exact timestamp response. | Named participant, no device/path leak, nonblocking semantics, CORS/rate. | Append-only preflight/freshness/event and replay. | Device/storage issues, stale facts, provider outage and audit. |
| `RTS-RUN-API-03` | Probe bounds/nonce/deadline and interval/uncertainty result. | Pair authorization, no IP/location inference, policy freshness, CORS/rate. | Directional observations, verdict CAS, unknown preservation and event. | Probe timeout/retry/breaker, clock ambiguity, metric redaction. |
| `RTS-RUN-API-04` | Coarse filter/mutual-intent/limit/cursor and candidate allowlist. | Opt-in, hard restriction ordering, no precise location/rank oracle, CORS/rate. | Stable projection cursor and stale verdict class. | Projection outage/empty honesty, query abuse and safe telemetry. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, mode/admission, probe interval/uncertainty, freshness and mutual-intent algorithms. PostgreSQL tests run RLS, CAS, unique named participants, append-only facts and hashed/private fields. Adapter tests exercise exact runtime/probe/policy/discovery timeout, retry/backoff, breaker and nonce behavior. Worker tests prove event ordering, stale rejection and projection invalidation. Playwright covers intent creation, preflight remediation, unknown path result, opt-in discovery, keyboard focus and safe copy. The gate fails on any route collision, missing operation row, non-`ApiError` response, precise-location leak or false green path.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all four routes have strict Zod 4 request/success/error schemas, bounds, freshness, statuses and exact error envelope.
- **Pass 2 — macro boundary:** runtime registry, identity, probes, path policy, discovery and BE00 ownership are explicit; room/capture/rights routes are not duplicated.
- **Pass 3 — lifecycle/race:** intent/admission, preflight facts, path observations/verdicts and discovery projection use versions, nonces, CAS and mutual intent.
- **Pass 4 — failure/abuse:** disabled runtime, device/storage issues, clock ambiguity, location probing, opt-out, retries/breakers, tombstones and event dedupe are testable.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, FKs, indexes, RLS/grants, retention and redacted events.

## Ambiguity Gate

**PASS.** The split is source-aligned (`RTS-01`–`RTS-04`), all four routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, failure recovery and tests. Runtime, identity, probe, path-policy and discovery seams specify exact timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 17 and deep dive; locked runtime admission, nonblocking preflight, uncertain path measurement and coarse opt-in discovery. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox and shared middleware.
- [BE Shard 17b — Live controls and monitoring](17b-live-room-monitoring-controls.md) for room admission and transport epochs.
- [BE Shard 17c — Continuity, capture and alignment](17c-continuity-capture-alignment-attendance.md) for takes, capture and attendance.
- [BE Shard 17d — Overdub requests and delivery](17d-overdub-requests-delivery.md) for overdub mode consumers.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for controlled identity/role vocabulary and evidence conclusions.
