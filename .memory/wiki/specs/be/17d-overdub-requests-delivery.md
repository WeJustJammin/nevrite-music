# Overdub Requests & Delivery — Backend Specification

**Status:** Complete
**IA source:** [Shard 17 — Real-time jamming and remote sessions](../ia/17-realtime-sessions.md)
**Deep-dive source:** [Deep Dive 17 — Real-time jamming and remote sessions](../ia/deep-dives/17-realtime-sessions.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns the immutable overdub round request, versioned bed package, performer pass intake, local latency evidence, resumable delivery, keeper/preference facts, and provenance-safe completion. It contains `RTS-17` and `RTS-18`. Runtime admission, live transport, capture/alignment, project asset lifecycle, service consequences, rights, billing, and credit conclusions remain external boundaries. A delivered file or observed-playing fact is evidence, not a musicianship, contract, payment, or credit conclusion.

## Classification

- **Type:** versioned overdub workflow with immutable reference material and evidence-preserving delivery.
- **Boundary:** `overdub_request`, `bed_version`, and `overdub_pass` ownership; runtime admission and preflight are consumed from the runtime split, while source takes/assets belong to the capture split and project/round ownership belongs to Shard 09.
- **Expected operations:** two HTTP operations, one for each assigned IA interaction (`RTS-17`, `RTS-18`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** every published bed has a frozen bounce, tempo/bar map, count-in, markers, brief, fidelity, version and deadline; a pass records local round-trip uncertainty, validation facts, keeper/preference and `delivered_file` or `observed_endpoint_audio` provenance without judging feel or quantizing performance.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `17-realtime-sessions.md` | `Overview`, `Scope Reconciliation`, `Architecture Decisions`, `Features`, `Acceptance Criteria` lines 7–68 | Specialized runtime boundary, durable capture, provenance separation and overdub acceptance behavior. |
| `17-realtime-sessions.md` | `Interactions` lines 70–93 | Exact `RTS-17` and `RTS-18` preconditions, outputs, version conflict and unattended-pass rules. |
| `17-realtime-sessions.md` | `Contracts`, `Core Types and Errors`, `Monitoring, Capture and Overdub` lines 102–143 | `CreateOverdubBed`, `SubmitOverdubPass`, `BED_VERSION_CONFLICT`, capture and disclosure constraints. |
| `17-realtime-sessions.md` | `Data Models` and typed registry lines 145–195 | Canonical `overdub_request`, `bed_version`, and `overdub_pass` model names and invariants. |
| `17-realtime-sessions.md` | `Access Control`, `Accessibility` lines 196–232 | Named performer authority, version visibility, safe uncertainty and no automatic performance judgment. |
| `17-realtime-sessions.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 233–305 | Exact overdub events, unavailable-runtime behavior, superseded versions, retries and delivery recovery. |
| `17-realtime-sessions.md` | `Cross-Shard Section Contract Map`, `Dependency References` lines 306–323 | BE00, Shard 01, Shard 02, Shard 06, Shard 09 and service-boundary responsibilities. |
| `deep-dives/17-realtime-sessions.md` | `Overdub Algorithm` lines 79–90 | Frozen bed package, local round-trip measurement, pass checks, keeper selection and resumable delivery. |
| `deep-dives/17-realtime-sessions.md` | `Interruption and Recovery Algorithm` lines 102–114 | Credential refresh, local continuity, late delivery and failure-safe recovery. |
| `deep-dives/17-realtime-sessions.md` | `Abuse and Recovery Verification`, `Cross-Shard Contracts`, `Implementation Envelope` lines 116–149 | Fake-green prevention, evidence boundaries, outbox behavior and bounded retries. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, actor/acting context, replay ledger, limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Cloudflare/Supabase boundaries, private media, Zod-first contracts and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `RTS-17` Producer creates overdub request | Freeze immutable bounce, tempo/bar map, two-bar count-in, markers, brief, fidelity, deadline wrapper, version and optional observed-attendance slot. | `RTS-OD-API-01` | `overdub_request`, `bed_version`; `realtime.overdub-request.changed.v1` |
| `RTS-18` Performer submits overdub passes | Verify named performer, current or visibly superseded bed version, overdub preflight and local round-trip uncertainty; record/check passes, choose keepers and resumably deliver with honest provenance. | `RTS-OD-API-02` | `overdub_pass`, `bed_version`, `overdub_request`; `realtime.overdub-pass.changed.v1` |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `RTS-17` | `RTS-OD-API-01` | `POST /api/v1/realtime/session-intents/{intentId}/overdub-requests` | `CreateOverdubRequest` → `CreateOverdubSuccess` (`201`) | Project/round producer authority, source take readiness, immutable render, version/CAS, deadline and typed `ApiError`. |
| `RTS-18` | `RTS-OD-API-02` | `POST /api/v1/realtime/overdub-requests/{requestId}/passes` | `SubmitOverdubPassRequest` → `SubmitOverdubPassSuccess` (`200`) | Named performer ownership, bed version, preflight/latency evidence, resumable chunks, provenance and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| `RTS-OD-API-01` | `POST` | `/api/v1/realtime/session-intents/{intentId}/overdub-requests` | `RTS-17` | Authenticated producer or Shard 09 round owner with current project/acting-party authority; source take and assets are readable. | `201` `CreateOverdubSuccess` |
| `RTS-OD-API-02` | `POST` | `/api/v1/realtime/overdub-requests/{requestId}/passes` | `RTS-18` | Authenticated named performer for the request owns the submitted pass and its delivery session. | `200` `SubmitOverdubPassSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before mutation | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Shard 09 source take/round resolver | `{intentId, sourceTakeId, actorId, expectedVersion}` → `{projectId, roundId, takeState, sourceAssetRefs[], authorityVersion}` | 600 ms | 2 retries at 100 ms/300 ms with the same read key | Open after 4 failures/30 s; no bed publication while open; half-open after 20 s. |
| Immutable bounce/package renderer | `{sourceAssetRefs[], tempoBpm, barMap, countInBars, markers, fidelity, renderKey}` → `{bounceAssetRef, checksum, durationMs, renderVersion}` | 3,000 ms | 2 retries at 200 ms/600 ms with the same render key | Open after 4 failures/60 s; request stays `draft`; half-open after 30 s. |
| BE00 preflight/latency evidence verifier | `{participantId, bedVersionId, preflightResultId, roundTripMs, uncertaintyMs}` → `{fresh, storageReady, sampleRateReady, monitoringReady, bedStampValid}` | 500 ms | 2 retries at 50 ms/150 ms; never retries a stale result into a pass | Open after 5 failures/30 s; pass remains local/uploading; half-open after 15 s. |
| Supabase Storage resumable chunk service | `{passId, bedVersionId, uploadSessionId, chunkNo, offset, checksum}` → `{providerChunkId, acceptedOffset, etag, complete}` | 1,500 ms | 3 retries at 2 s/8 s/32 s for provider-confirmed chunks; no retry on checksum mismatch | Open after 5 failures/60 s; pass remains `uploading`; half-open after 30 s. |
| Shard 09 project asset handoff | `{passId, requestId, bedVersionId, checksum, provenanceBasis}` → `{projectAssetId, accepted}` | 800 ms | 2 retries at 100 ms/300 ms through durable outbox | Open after 4 failures/30 s; pass remains delivery-owned until acceptance; half-open after 20 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with `VALIDATION_FAILED`; timestamps are RFC 3339 with offset; IDs are UUIDs; hashes are lowercase SHA-256. Every error is the BE00/global envelope `ApiError { code, message, requestId, details }`.

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
const BarMapPoint = z.object({ bar: z.int().positive(), beat: z.number().min(0).max(16), offsetMs: z.int().nonnegative() }).strict();
const Marker = z.object({ bar: z.int().positive(), beat: z.number().min(0).max(16), label: z.string().trim().min(1).max(120) }).strict();
const PassChecks = z.object({ silence: z.boolean(), clipping: z.boolean(), bleed: z.boolean(), sampleRateMatch: z.boolean(), monitoringPath: z.enum(["local", "authorized_interface"]), bedStamp: Hash }).strict();
export const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: Uuid, details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict();

export const CreateOverdubRequest = z.object({ ...Context.shape, idempotencyKey: Key, intentId: Uuid, projectId: Uuid, roundId: Uuid, sourceTakeId: Uuid, performerPartyId: Uuid, tempoBpm: z.number().positive().max(400), barMap: z.array(BarMapPoint).min(1).max(4096), countInBars: z.literal(2), markers: z.array(Marker).max(512), brief: z.string().trim().min(1).max(4000), fidelity: z.enum(["original_sample_rate", "normalized_lossless"]), deadline: DateTime, observedAttendanceSlot: z.boolean() }).strict();
export const CreateOverdubSuccess = z.object({ requestId: Uuid, overdubRequestId: Uuid, bedVersionId: Uuid, state: z.literal("published"), checksum: Hash, deadline: DateTime, observedAttendanceSlot: z.boolean(), version: z.int().positive() }).strict();

export const SubmitOverdubPassRequest = z.object({ ...Context.shape, idempotencyKey: Key, requestId: Uuid, passId: Uuid, bedVersionId: Uuid, action: z.enum(["start", "chunk", "complete", "select", "report_lost"]), passNumber: z.int().positive().max(64), contentHash: Hash, sampleRateHz: z.int().min(8000).max(192000), durationMs: z.int().positive().max(86400000), localRoundTripMs: z.number().nonnegative().max(2000), latencyUncertaintyMs: z.number().nonnegative().max(2000), preflightResultId: Uuid, checks: PassChecks, keeper: z.boolean(), preference: z.enum(["preferred", "alternate", "discarded"]), provenanceBasis: z.enum(["delivered_file", "observed_endpoint_audio"]), uploadSessionId: Key.nullable(), chunkNo: z.int().nonnegative().nullable(), offset: z.int().nonnegative().nullable(), chunkChecksum: Hash.nullable(), chunkSizeBytes: z.int().positive().max(10485760).nullable(), acceptSuperseded: z.boolean() }).strict();
export const SubmitOverdubPassSuccess = z.object({ requestId: Uuid, passId: Uuid, bedVersionId: Uuid, state: z.enum(["uploading", "delivered", "observed", "selected", "lost"]), provenanceBasis: z.enum(["delivered_file", "observed_endpoint_audio"]), residualMs: z.number().nonnegative().nullable(), version: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `RTS-OD-API-01` | `CreateOverdubRequest` | `CreateOverdubSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-OD-API-02` | `SubmitOverdubPassRequest` | `SubmitOverdubPassSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `RTS-OD-API-01` | Require current project/round authority, adult named performer, readable source take/assets, positive bounded tempo, ordered bar map, exactly two count-in bars, marker/brief/fidelity/deadline fields and current expected version. Renderer must checksum a complete bounce before publication; an incomplete package remains `draft` and cannot reach the performer. |
| `RTS-OD-API-02` | Require named performer, request/bed existence in the caller's authorized projection, current or explicitly accepted superseded bed stamp, fresh storage/sample-rate/monitoring/bed-stamp preflight, measured nonnegative round-trip and uncertainty, pass checks and action-specific chunk fields. A superseded pass remains visibly deliverable against its old immutable bar map but cannot silently become the current keeper. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `RTS-OD-API-01` | `NOT_AUTHORIZED`, `TAKE_STATE_CONFLICT`, `BED_VERSION_CONFLICT`, `DISCLOSURE_REQUIRED`, `DURABLE_CAPTURE_UNAVAILABLE`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for a non-owner/non-producer; `404` hides an unknown intent, source take or performer relationship. | Required 24 h; hash includes intent/take/performer/tempo/bar-map hash/fidelity/deadline. Replay returns the original request/bed; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 requests/hour/round; 50 requests/day/producer. | Log operationId, requestId, request/take/bed hashes, render version, fidelity, deadline class and state transition; never brief text, audio, object key or precise location. |
| `RTS-OD-API-02` | `BED_VERSION_CONFLICT`, `UPLOAD_INCOMPLETE`, `TAKE_STATE_CONFLICT`, `NOT_AUTHORIZED`, `DURABLE_CAPTURE_UNAVAILABLE`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for a non-recipient or foreign pass; `404` hides an unknown request, pass or bed version. | Required 30 days per request/pass/action/chunk; hash includes request/pass/bed/chunk/offset/checksum/action. Replay returns accepted offset/state; mismatch returns `IDEMPOTENCY_MISMATCH`. | 600 chunks/minute/pass; 40 passes/day/performer; 5 concurrent uploads/request. | Log operationId, requestId, request/pass/bed hashes, chunk number/offset bucket, RTT and uncertainty buckets, validation flags, provenance basis and provider latency; never media bytes or object key. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `realtime`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. A frozen bed and its checksum/bar map are immutable; provider tokens and private media refs are service-only fields. BE00 migration, encryption, audit and outbox policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `overdub_request` | `id uuid PK`; `intent_id uuid NOT NULL FK realtime.session_intent`; `project_id uuid NOT NULL FK project`; `round_id uuid NOT NULL FK project_round`; `source_take_id uuid NOT NULL FK realtime.take`; `producer_party_id uuid NOT NULL FK identity.party`; `performer_party_id uuid NOT NULL FK identity.party`; `state text NOT NULL CHECK (state IN ('draft','published','active','completed','expired','cancelled'))`; `brief_ciphertext bytea NOT NULL`; `fidelity text NOT NULL CHECK (fidelity IN ('original_sample_rate','normalized_lossless'))`; `deadline timestamptz NOT NULL CHECK (deadline > created_at)`; `observed_attendance_slot boolean NOT NULL`; `current_bed_version_id uuid NULL FK realtime.bed_version DEFERRABLE INITIALLY DEFERRED`; `version bigint NOT NULL CHECK (version > 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(intent_id, source_take_id, version)`; `(round_id, state, deadline)`; `(performer_party_id, state, deadline)`; `(intent_id, state, updated_at DESC)`; `(current_bed_version_id)`. | Producer/round owner reads and updates own requests; named performer reads only published safe package fields; worker updates state by CAS; private brief is decrypted only for authorized parties; `realtime_api` gets scoped RPC execute, `realtime_worker` gets state/outbox write, anon no grant. |
| `bed_version` | `id uuid PK`; `request_id uuid NOT NULL FK realtime.overdub_request ON DELETE RESTRICT`; `source_take_id uuid NOT NULL FK realtime.take`; `bounce_asset_ref text NOT NULL`; `checksum char(64) NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$')`; `tempo_bpm numeric(6,2) NOT NULL CHECK (tempo_bpm > 0 AND tempo_bpm <= 400)`; `bar_map jsonb NOT NULL CHECK (jsonb_typeof(bar_map) = 'array')`; `count_in_bars smallint NOT NULL CHECK (count_in_bars = 2)`; `markers jsonb NOT NULL CHECK (jsonb_typeof(markers) = 'array')`; `fidelity text NOT NULL CHECK (fidelity IN ('original_sample_rate','normalized_lossless'))`; `version_number integer NOT NULL CHECK (version_number > 0)`; `state text NOT NULL CHECK (state IN ('draft','frozen','superseded','retired'))`; `supersedes_id uuid NULL FK realtime.bed_version`; `frozen_at timestamptz NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version > 0)`. | Unique `(request_id, version_number)`; Unique `(request_id, checksum)`; `(request_id, state)`; `(source_take_id, created_at DESC)`; `(supersedes_id)`. | Producer/round owner creates a draft and freezes once; named performer reads frozen versions for its request; worker validates checksum and transitions state; `bounce_asset_ref` is never client-readable; `realtime_api` has scoped RPC execute, `realtime_worker` has insert/state write, anon no grant. |
| `overdub_pass` | `id uuid PK`; `request_id uuid NOT NULL FK realtime.overdub_request ON DELETE RESTRICT`; `bed_version_id uuid NOT NULL FK realtime.bed_version`; `performer_party_id uuid NOT NULL FK identity.party`; `pass_number integer NOT NULL CHECK (pass_number > 0 AND pass_number <= 64)`; `content_hash char(64) NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$')`; `sample_rate_hz integer NOT NULL CHECK (sample_rate_hz BETWEEN 8000 AND 192000)`; `duration_ms bigint NOT NULL CHECK (duration_ms > 0 AND duration_ms <= 86400000)`; `local_round_trip_ms numeric(8,3) NOT NULL CHECK (local_round_trip_ms >= 0 AND local_round_trip_ms <= 2000)`; `latency_uncertainty_ms numeric(8,3) NOT NULL CHECK (latency_uncertainty_ms >= 0 AND latency_uncertainty_ms <= 2000)`; `preflight_result_id uuid NOT NULL FK realtime.preflight_result`; `checks jsonb NOT NULL CHECK (jsonb_typeof(checks) = 'object')`; `keeper boolean NOT NULL`; `preference text NOT NULL CHECK (preference IN ('preferred','alternate','discarded'))`; `provenance_basis text NOT NULL CHECK (provenance_basis IN ('delivered_file','observed_endpoint_audio'))`; `residual_ms numeric(8,3) NULL CHECK (residual_ms >= 0)`; `upload_session_ref text NULL`; `provider_object_ref text NULL`; `state text NOT NULL CHECK (state IN ('local','uploading','delivered','observed','selected','rejected','lost'))`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version > 0)`. | Unique `(request_id, performer_party_id, pass_number, content_hash)`; `(request_id, bed_version_id, state)`; `(performer_party_id, created_at DESC)`; `(request_id, keeper, preference)`; `(provider_object_ref)`. | Performer reads and writes only own pass; producer/round owner reads safe validation/provenance and keeper facts; worker writes provider refs/state and outbox; raw pass media stays private; `realtime_api` gets scoped RPC execute, `realtime_worker` gets provider-state write, anon no grant. |

### State, Concurrency and Transaction Rules

- Request lifecycle is `draft → published → active → completed|expired|cancelled`. Publication is atomic with a checksum-proven frozen `bed_version`, durable outbox event and current-version CAS; a renderer or resolver failure leaves `draft` and exposes no partial package.
- A `bed_version` is `draft → frozen → superseded|retired`. Once frozen, bounce checksum, tempo, bar map, count-in, markers, fidelity and brief reference cannot change. A new version points to `supersedes_id`, carries a bar-map/section diff in the safe response, and never mutates an in-flight version.
- Pass lifecycle is `local → uploading → delivered|observed|selected`, with `rejected|lost` terminal evidence. Chunks are immutable and provider-confirmed by offset/checksum; upload can resume after credential refresh or outage. `observed_endpoint_audio` is permitted only when an authorized observed session fact exists; unattended delivery is `delivered_file`.
- Every mutation uses `expectedVersion`, operation idempotency and aggregate row locking. Two producers cannot publish competing current beds; one keeper selection wins by CAS. A pass submitted against a superseded bed returns `BED_VERSION_CONFLICT`, preserves any checksum-proven old-version delivery as visibly superseded, and never silently selects it as current.
- Creation, version publication, pass metadata, provider receipt and domain outbox event commit atomically where local; external work is retried by a durable job and never reported complete before its required checksum/receipt exists. No transaction here creates billing, rights, contract fault or credit.

### Grants, RLS and Retention

`realtime_api` receives execute on scoped request/pass RPCs; `realtime_worker` writes render/provider state, projections and outbox; `realtime_migrator` owns DDL. RLS uses BE00 `current_actor_id()` plus project owner, named performer and request membership predicates. Bed packages and pass media retain seven years or consent/legal minimum; superseded metadata and provenance remain auditable, while revoked delivery projections are removed without deleting required immutable evidence. Briefs, private media refs and preflight/latency detail are not public analytics fields.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed actor and ownership | 403 behavior | 404 behavior |
|---|---|---|---|
| `RTS-OD-API-01` | Producer or authorized Shard 09 round owner for the intent; performer is the named adult recipient; source take/asset access is checked. | `403 NOT_AUTHORIZED` for a non-owner, non-producer or actor lacking current acting-party authority. | `404 NOT_AUTHORIZED` hides unknown intent, source take, project or performer relationship. |
| `RTS-OD-API-02` | Named performer on the request owns the pass and upload; producer/round owner can inspect safe results but cannot impersonate performer submission. | `403 NOT_AUTHORIZED` for another performer, producer attempting a pass, or missing bed/request grant. | `404 NOT_AUTHORIZED` hides unknown request, pass, bed version or source relation. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `RTS-OD-API-01` | `requestId` → `strictCors(realtimeOverdubOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(overdubRequestCreate)` → `parseZod(CreateOverdubRequest)` → `idempotency(24h)` → `authorizeProjectRoundOwner` → `sourceTakeStateGuard` → `renderChecksumGuard` → `publishBedTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-OD-API-02` | `requestId` → `strictCors(realtimeOverdubOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(overdubPassUpload)` → `parseZod(SubmitOverdubPassRequest)` → `idempotency(30d)` → `authorizeNamedPerformer` → `bedVersionGuard` → `preflightFreshnessGuard` → `latencyEvidenceGuard` → `chunkStorageOrStateTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |

### Security and Privacy Controls

Use signed short-lived private upload URLs, immutable checksums, opaque request/pass/bed IDs, encrypted briefs, scoped project projections and server-stamped provenance. Do not expose object keys, raw audio, exact IP/location, device names, private latency samples or brief text in logs/events. CORS never permits `*` with credentials; request/pass responses are `private, no-store`. A client cannot claim `observed_endpoint_audio` without the server-verified observed-session fact. Provider tokens are never returned to clients, and no path makes a performance-quality, payment, rights or credit determination.

## Data Flow

1. BE00 authenticates actor/context, validates strict Zod input, resolves Shard 09 source authority and reserves the idempotency key.
2. Request creation validates the source take and named performer, renders a complete bounce/package, stores a frozen `bed_version`, then publishes the immutable reference and optional attendance slot.
3. The performer runs runtime/overdub preflight, measures local round-trip latency and uncertainty, records checks and submits pass metadata plus immutable provider-confirmed chunks.
4. Resumable delivery refreshes credentials and retries only confirmed-safe chunks; `delivered_file` and `observed_endpoint_audio` remain distinct provenance values, and a superseded bed remains visibly labelled.
5. Keeper/preference and residual facts publish through the outbox to Shard 09; downstream commerce, rights, dispute and Shard 02 credit workflows consume evidence under their own contracts.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `realtime.overdub-request.changed.v1` | `{eventId, requestId, intentId, bedVersionId, performerPseudonym, state, fidelity, deadline, observedAttendanceSlot, version, occurredAt}`; no brief, object key or media. | Shard 09 project/round projector and named participant projection; at-least-once, ordered by request/version, deduped by eventId. |
| `realtime.overdub-pass.changed.v1` | `{eventId, requestId, passId, bedVersionId, performerPseudonym, state, keeper, preference, provenanceBasis, residualClass, version, occurredAt}`; no audio, hash, IP or device detail. | Shard 09 project asset/round projector and authorized service evidence; at-least-once, ordered by request/pass/version, deduped by eventId. |

Consumers reject stale versions, retry at 2 s/8 s/32 s, dead-letter after five attempts with an alert, preserve the last safe projection and carry BE00 `requestId`/`correlationId`. A superseded bed/pass remains labelled in projections; consumers must not reinterpret delivery evidence as credit or contract fault.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Identity, acting context or project authority denial | Typed `ApiError` before render/storage mutation; `403` for a known foreign actor and `404` for hidden unknown resources; no package or pass effect. |
| Source take not ready, disclosure missing or durable capture unavailable | Return `TAKE_STATE_CONFLICT`, `DISCLOSURE_REQUIRED` or `DURABLE_CAPTURE_UNAVAILABLE`; request remains unpublished/draft and no partial bed reaches the performer. |
| Render timeout or checksum mismatch | Keep request `draft`, retry the same render key with bounded backoff/breaker, alert after exhaustion and never publish a partial or unverified bounce. |
| Bed version superseded during pass | Return `BED_VERSION_CONFLICT`; preserve checksum-proven old-version delivery as visibly superseded, prevent current-keeper CAS, and allow explicit old-version continuation only with `acceptSuperseded`. |
| Preflight stale, local storage failure or latency evidence unavailable | Return `DURABLE_CAPTURE_UNAVAILABLE` or typed validation/dependency failure; pass remains local/uploading and no observed-playing claim is created. |
| Upload timeout, credential expiry or checksum mismatch | Keep pass `uploading`, refresh short-lived credential, retry provider-confirmed chunks at 2 s/8 s/32 s, and return `UPLOAD_INCOMPLETE` until complete; never silently drop a chunk. |
| Shard 09/project outage | Commit source delivery state and durable outbox; retry handoff with bounded breaker. Keep pass delivery-owned until `{accepted:true}` and do not infer project/commerce/credit completion. |
| Duplicate request, chunk, provider receipt or event | Dedupe by idempotency key, pass/chunk checksum, provider receipt or eventId; return original request/offset/state without a second render, asset or keeper effect. |
| Performer, producer or runtime interruption | Preserve local journal/checksum and upload state, record the interruption through the runtime boundary, refresh credentials on return and allow safe resume against the same immutable bed version. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `RTS-OD-API-01` | Strict Zod 4 fields, ordered bar map, count-in/marker bounds, fidelity/deadline and exact success/error envelope. | Producer/round authority, named adult performer, disclosure, private brief, no partial publication, CORS/rate. | Atomic render checksum, frozen bed immutability, version/CAS, idempotent replay and request event. | Renderer timeout/checksum mismatch, source outage, breaker recovery, event dedupe and redacted telemetry. |
| `RTS-OD-API-02` | Strict chunk/action/pass checks, bed stamp, sample rate, RTT/uncertainty bounds, provenance and exact success/error envelope. | Named performer ownership, superseded label, preflight freshness, no fake observed evidence, private media, CORS/rate. | Immutable chunks, provider-confirmed resume, pass uniqueness, keeper CAS, request/pass event and Shard 09 outbox. | Credential refresh, storage timeout/checksum failure, stale bed conflict, breaker recovery, latency bucket redaction and replay. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, bed/pass state transitions, version conflict and exact `ApiError`. PostgreSQL tests run RLS, scoped grants, immutable frozen beds, deferred current-bed FK, pass uniqueness, CAS keeper selection and retention/tombstone behavior. Adapter tests exercise resolver/render/preflight/storage/handoff timeout, retry/backoff, breaker and provider idempotency. Worker tests prove outbox ordering, stale-version labels, late delivery and Shard 09 handoff. Playwright covers producer package publication, performer preflight, chunk pause/resume, superseded-bed disclosure, keeper selection, keyboard focus and provenance copy. The gate fails on any route collision, missing operation row, non-`ApiError` response, partial-bed publication, object-key leak, duplicate keeper effect or provenance laundering.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** both routes have strict Zod 4 request/success/error schemas, bounded fields, statuses, action-specific validation and exact error envelope.
- **Pass 2 — macro boundary:** BE00, Shard 09, runtime/preflight, storage and downstream evidence/commerce/credit seams are explicit; no duplicate live transport or capture route is introduced.
- **Pass 3 — lifecycle/race:** requests, frozen bed versions and passes use immutable checksums, expected-version CAS, resumable chunks, stale-version labels and idempotent outbox delivery.
- **Pass 4 — failure/abuse:** incomplete render, fake-green preflight, checksum mismatch, credential expiry, provider outage, superseded bed, hidden resource and provenance laundering are testable failure paths.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, foreign keys, indexes, RLS/grants, retention and safe redacted event payloads.

## Ambiguity Gate

**PASS.** The split is source-aligned (`RTS-17`, `RTS-18`), both routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, failure recovery and tests. Renderer, resolver, preflight, storage and Shard 09 seams specify exact request/response, timeout, retries/backoff and circuit-breaker behavior. Frozen bed versions, superseded delivery, latency uncertainty and `delivered_file` versus `observed_endpoint_audio` provenance are resolved without assigning credit, rights, payment or aesthetic judgment.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 17 and deep dive; locked immutable overdub bed versions, resumable pass delivery and provenance-safe evidence. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) provides auth, acting context, errors, idempotency, rate limits, CORS, audit and outbox.
- [Shard 01 — Identity and authority](../ia/01-identity-authority.md#contracts) provides human/acting-party resolution and performer authority.
- [Shard 02 — Profiles and verification](../ia/02-profiles-verification.md#contracts) consumes evidence without receiving a credit conclusion from this split.
- [Shard 09 — Projects and collaboration](../ia/09-projects-collaboration.md#contracts) owns project/round source authority and accepts delivered assets through its own contract.
