# Continuity, Capture, Alignment & Attendance — Backend Specification

**Status:** Complete
**IA source:** [Shard 17 — Real-time jamming and remote sessions](../ia/17-realtime-sessions.md)
**Deep-dive source:** [Deep Dive 17 — Real-time jamming and remote sessions](../ia/deep-dives/17-realtime-sessions.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns local-take finalization, immutable capture assets and chunk upload state, non-destructive multi-anchor alignment, moment flags, and participant attendance observation/sealing. It contains `RTS-13`, `RTS-14`, `RTS-15`, and `RTS-16`. Runtime admission/live controls, overdub, project/session containers, service consequences, and Shard 02 credit conclusions remain sibling boundaries. Local device capture, object storage, alignment compute, project handoff, and evidence projection are external seams.

## Classification

- **Type:** evidence-preserving capture and close boundary with resumable storage and non-destructive analysis.
- **Boundary:** `take`, `take_fragment`, `capture_asset`, `alignment_model`, `moment_flag`, and `attendance_observation` ownership; transport epochs and listener controls are consumed from the live split, while project assets/annotations and credit conclusions remain external.
- **Expected operations:** four HTTP operations, one for each assigned IA interaction (`RTS-13`, `RTS-14`, `RTS-15`, `RTS-16`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** one immutable local file per take/endpoint with checksum; upload chunks pause in the live room and distinguish pending/uploaded/withheld/discarded/lost; alignment is a sidecar model preserving originals; attendance is an attributed observation sealed after 24 hours and never directly creates Shard 02 credit.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `17-realtime-sessions.md` | `Overview`, `Scope Reconciliation`, `Architecture Decisions`, `Features`, `Acceptance Criteria` lines 7–68 | Durable local capture, explicit asset states, alignment preservation and attendance meaning. |
| `17-realtime-sessions.md` | `Interactions` lines 70–93 | Exact `RTS-13`, `RTS-14`, `RTS-15`, and `RTS-16` preconditions, outcomes and late/race rules. |
| `17-realtime-sessions.md` | `Contracts`, `Core Types and Errors`, `Monitoring, Capture and Overdub` lines 102–143 | `TakeState`, `CaptureAssetState`, finalize/upload/alignment/attendance contracts and errors. |
| `17-realtime-sessions.md` | `Data Models` and typed registry lines 145–195 | Canonical take, fragment, asset, alignment, moment and attendance model names. |
| `17-realtime-sessions.md` | `Access Control`, `Accessibility` lines 196–232 | Participant-owned capture, attributed observation, project ownership transfer and safe uncertainty. |
| `17-realtime-sessions.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 233–305 | Take/capture/alignment/attendance events, storage/runtime failures, late assets and recovery. |
| `17-realtime-sessions.md` | `Cross-Shard Section Contract Map`, `Dependency References` lines 306–323 | BE00 storage/jobs, Shard 02 evidence, Shard 09 projects and service dependencies. |
| `deep-dives/17-realtime-sessions.md` | `Live Take and Authority Algorithm`, `Local Capture, Upload and Alignment Algorithm` lines 41–78 | Frozen take epoch, durable local journal, resumable chunks, checksums, multi-anchor drift and residual. |
| `deep-dives/17-realtime-sessions.md` | `Attendance and Close Algorithm`, `Interruption and Recovery Algorithm` lines 91–114 | Own-row disclosure, role vocabulary, gaps, 24-hour seal and late-asset/recovery handling. |
| `deep-dives/17-realtime-sessions.md` | `Abuse and Recovery Verification`, `Cross-Shard Contracts`, `Implementation Envelope` lines 116–149 | Immutable originals, no attendance credit laundering, outbox, evidence scope and retries. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor/acting context, replay ledger, limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Cloudflare/Supabase boundaries, private capture data, Zod-first contracts and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `RTS-13` Producer stops/finalizes take | Specialized runtime finalizes one file per take/endpoint, latches signal/clip facts and creates upload state; playable local files exist before upload. | `RTS-CAP-API-01` | `take`, `take_fragment`, `capture_asset`; `realtime.take.changed.v1`, `realtime.capture-asset.changed.v1` |
| `RTS-14` Participant uploads/withholds/discards | Pause live uploads, resume immutable chunks afterward; explicit attributable pending/uploaded/withheld/discarded/lost states. | `RTS-CAP-API-02` | `capture_asset`, `take_fragment`; `realtime.capture-asset.changed.v1` |
| `RTS-15` System aligns uploaded tracks | Validate committed method/reference, estimate offset/drift at multiple anchors, retain original and measured residual in non-destructive model. | `RTS-CAP-API-03` | `alignment_model`, `moment_flag`, `capture_asset`; `realtime.alignment.changed.v1` |
| `RTS-16` Participants close session record | Present own observed rows and declared role/instrument; seal after 24 hours; Shard 02 decides credit meaning. | `RTS-CAP-API-04` | `attendance_observation`; `realtime.attendance.sealed.v1` |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `RTS-13` | `RTS-CAP-API-01` | `POST /api/v1/realtime/takes/{takeId}/finalize` | `FinalizeTakeRequest` → `FinalizeTakeSuccess` (`201`) | Producer/epoch, local file/checksum/fragment facts, playable state, capture event and typed `ApiError`. |
| `RTS-14` | `RTS-CAP-API-02` | `POST /api/v1/realtime/takes/{takeId}/capture-assets` | `UploadCaptureAssetRequest` → `UploadCaptureAssetSuccess` (`200`) | Named asset owner, pause/resume, immutable chunks, withhold/discard/lost attribution, retries and typed `ApiError`. |
| `RTS-15` | `RTS-CAP-API-03` | `POST /api/v1/realtime/takes/{takeId}/alignments` | `AlignTakeRequest` → `AlignTakeSuccess` (`201`) | Uploaded asset/reference/method, multi-anchor drift, non-destructive sidecar, residual and typed `ApiError`. |
| `RTS-16` | `RTS-CAP-API-04` | `POST /api/v1/realtime/session-intents/{intentId}/attendance/seal` | `SealAttendanceRequest` → `SealAttendanceSuccess` (`200`) | Own-row disclosure, role/instrument vocabulary, gap/audible seconds, 24-hour seal, no credit conclusion and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `RTS-CAP-API-01` | `POST` | `/api/v1/realtime/takes/{takeId}/finalize` | `RTS-13` | Authenticated producer/conductor with current take/epoch authority; endpoint local capture is participant-owned. | `201` `FinalizeTakeSuccess` |
| `RTS-CAP-API-02` | `POST` | `/api/v1/realtime/takes/{takeId}/capture-assets` | `RTS-14` | Authenticated named participant owns the endpoint asset and chunk session. | `200` `UploadCaptureAssetSuccess` |
| `RTS-CAP-API-03` | `POST` | `/api/v1/realtime/takes/{takeId}/alignments` | `RTS-15` | Authenticated take participant or authorized project processor; source assets are readable. | `201` `AlignTakeSuccess` |
| `RTS-CAP-API-04` | `POST` | `/api/v1/realtime/session-intents/{intentId}/attendance/seal` | `RTS-16` | Authenticated participant seals only their own observed row; composed session close is visible to named participants. | `200` `SealAttendanceSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Local journal/capture adapter | `{takeId, endpointId, stopAt, journalHash}` → `{filePathRef, durationMs, checksum, fragmentRefs[], signalFacts}` | 1,000 ms | 2 retries at 100 ms/300 ms if journal is recoverable; no fabricated file | Open after 4 failures/30 s; finalize returns `DURABLE_CAPTURE_UNAVAILABLE` or explicit partial/lost state; half-open after 20 s. |
| Object storage chunk service | `{assetId, chunkNo, offset, checksum, uploadSessionId}` → `{providerChunkId, acceptedOffset, etag, complete}` | 1,500 ms | 3 retries at 2 s/8 s/32 s for provider-confirmed chunks; no retry on checksum mismatch | Open after 5 failures/60 s; asset remains pending/uploading; half-open after 30 s. |
| Alignment compute service | `{assetIds[], referenceId, method, anchorSet, nominalRate}` → `{offsets[], driftModel, residualMs, quality, computeVersion}` | 2,500 ms | 2 retries at 200 ms/600 ms with same job key | Open after 4 failures/60 s; return `ALIGNMENT_UNAVAILABLE`, preserve originals; half-open after 30 s. |
| Shard 09 project asset handoff | `{assetId, takeId, checksum, ownership, alignmentRef}` → `{projectAssetId, accepted}` | 800 ms | 2 retries at 100 ms/300 ms through durable outbox | Open after 4 failures/30 s; source asset remains owned here until accepted; half-open after 20 s. |

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

export const FinalizeTakeRequest = z.object({ ...Context.shape, idempotencyKey: Key, takeId: Uuid, epochId: Uuid, stopAt: DateTime, endpointId: Uuid, journalHash: Hash, fragmentIds: z.array(Uuid).min(1).max(256), signalFacts: z.object({ clipped: z.boolean(), gapCount: z.int().nonnegative(), sampleRateHz: z.int().min(8000).max(192000) }).strict() }).strict();
export const FinalizeTakeSuccess = z.object({ takeId: Uuid, captureAssetId: Uuid, state: z.enum(["finalizing", "uploading", "partial"]), checksum: Hash, playableLocal: z.literal(true), version: z.int().positive() }).strict();

export const UploadCaptureAssetRequest = z.object({ ...Context.shape, idempotencyKey: Key, takeId: Uuid, assetId: Uuid, action: z.enum(["start", "chunk", "complete", "withhold", "discard", "report_lost"]), uploadSessionId: Key.nullable(), chunkNo: z.int().nonnegative().nullable(), offset: z.int().nonnegative().nullable(), chunkChecksum: Hash.nullable(), chunkSizeBytes: z.int().positive().max(10485760).nullable(), reason: z.string().trim().max(500).nullable() }).strict();
export const UploadCaptureAssetSuccess = z.object({ assetId: Uuid, state: z.enum(["pending", "uploading", "uploaded", "withheld", "discarded", "lost"]), acceptedOffset: z.int().nonnegative(), version: z.int().positive() }).strict();

export const AlignTakeRequest = z.object({ ...Context.shape, idempotencyKey: Key, takeId: Uuid, assetIds: z.array(Uuid).min(1).max(32), referenceAssetId: Uuid, method: z.enum(["multi_anchor", "nominal_rate"]), anchors: z.array(z.object({ assetId: Uuid, sourceMs: z.number().nonnegative(), referenceMs: z.number().nonnegative() }).strict()).min(2).max(128), nominalRate: z.number().positive().max(384000), expectedAssetVersions: z.array(z.object({ assetId: Uuid, version: z.int().positive() }).strict()).min(1).max(32) }).strict();
export const AlignTakeSuccess = z.object({ alignmentModelId: Uuid, state: z.enum(["aligned", "partial", "unaligned"]), residualMs: z.number().nonnegative().nullable(), originalChecksums: z.array(Hash).min(1), version: z.int().positive() }).strict();

export const SealAttendanceRequest = z.object({ ...Context.shape, idempotencyKey: Key, intentId: Uuid, participantId: Uuid, observationId: Uuid.nullable(), role: z.enum(["producer", "performer", "monitor", "listener"]), instrument: z.string().trim().min(1).max(80), observedEndpointIds: z.array(Uuid).max(8), gapSeconds: z.int().nonnegative().max(86400), audibleSeconds: z.int().nonnegative().max(86400), basis: z.enum(["observed_endpoint_audio", "delivered_file", "counter_attested"]), disclosureVersion: z.int().positive(), sealAt: DateTime }).strict();
export const SealAttendanceSuccess = z.object({ observationId: Uuid, state: z.enum(["open", "sealed"]), sealEligibleAt: DateTime, creditConclusion: z.literal("not_decided_here"), version: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `RTS-CAP-API-01` | `FinalizeTakeRequest` | `FinalizeTakeSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-CAP-API-02` | `UploadCaptureAssetRequest` | `UploadCaptureAssetSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-CAP-API-03` | `AlignTakeRequest` | `AlignTakeSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `RTS-CAP-API-04` | `SealAttendanceRequest` | `SealAttendanceSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `RTS-CAP-API-01` | Require current producer/epoch, local journal integrity, one endpoint file and fragment IDs. Finalization creates a playable local asset before upload; crash recovery uses checksum-proven journal or explicit partial/lost state; no invented success. |
| `RTS-CAP-API-02` | Require named asset owner, live-room pause for transfer, immutable chunk number/offset/checksum and action-specific fields. Provider-confirmed chunks resume after room; withhold/discard/lost are attributable terminal facts; checksum mismatch returns `UPLOAD_INCOMPLETE`. |
| `RTS-CAP-API-03` | Require uploaded/readable assets, committed method/reference, at least two anchors and expected versions. Save offset/drift/residual as sidecar `alignment_model`; originals/checksums remain unchanged; partial/unaligned is honest. |
| `RTS-CAP-API-04` | Require participant-owned observed rows, declared role/instrument vocabulary, disclosure and nonnegative gap/audible facts. Own rows are visible; seal is eligible after 24 hours; Shard 02 alone evaluates credit meaning. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `RTS-CAP-API-01` | `TAKE_STATE_CONFLICT`, `DURABLE_CAPTURE_UNAVAILABLE`, `DISK_INSUFFICIENT`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonproducer/epoch actor; `404` hides unknown take. | Required 24 h; hash includes take/epoch/endpoint/journal/fragments. Replay returns original asset state; mismatch returns `IDEMPOTENCY_MISMATCH`. | 5 finalizations/hour/take; 20/hour/producer. | Log operationId, requestId, take/asset hashes, fragment count, checksum prefix, state; no file paths/audio. |
| `RTS-CAP-API-02` | `UPLOAD_INCOMPLETE`, `TAKE_STATE_CONFLICT`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonowner participant; `404` hides unknown take/asset. | Required 30 days per asset/chunk action; hash includes asset/chunk/offset/checksum. Replay returns accepted offset/state; mismatch returns `IDEMPOTENCY_MISMATCH`. | 300 chunks/minute/asset; 20 assets/hour/participant. | Log operationId, requestId, asset/take hashes, chunk number/offset bucket, state and provider latency; no object key/content. |
| `RTS-CAP-API-03` | `ALIGNMENT_UNAVAILABLE`, `TAKE_STATE_CONFLICT`, `VERSION_CONFLICT`, `NOT_AUTHORIZED`, `DEPENDENCY_UNAVAILABLE`. `403` for nonparticipant/processor; `404` hides unknown take/asset. | Required 24 h; hash includes asset versions/reference/method/anchors. Replay returns alignment model; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 alignment jobs/hour/take; 5 concurrent/take. | Log operationId, requestId, take/model hashes, anchor count, residual bucket, quality and compute latency; no audio/precise positions. |
| `RTS-CAP-API-04` | `NOT_AUTHORIZED`, `DISCLOSURE_REQUIRED`, `TAKE_STATE_CONFLICT`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonparticipant/foreign row; `404` hides unknown intent/observation. | Required 24 h; hash includes intent/participant/role/instrument/facts/disclosure. Replay returns observation; mismatch returns `IDEMPOTENCY_MISMATCH`. | 5 seal commands/day/participant/intent; one winning seal/row. | Log operationId, requestId, intent/participant pseudonyms, role, gap/audible buckets, basis and seal state; no credit conclusion or raw audio. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `realtime`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Original audio/checksums are immutable; provider tokens/paths are not public fields; BE00 migration, audit, encryption and RLS policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `take` | `id uuid PK`; `epoch_id uuid NOT NULL FK transport_epoch`; `intent_id uuid NOT NULL FK session_intent`; `producer_party_id uuid NOT NULL FK party`; `state text NOT NULL CHECK prepared/rolling/interrupted/finalizing/finalized/uploading/aligned/partial/sealed`; `timing_model text NOT NULL`; `started_at timestamptz NOT NULL`; `stopped_at timestamptz NULL`; `version bigint NOT NULL`. | Unique `(epoch_id, id)`; `(intent_id, state, started_at)`; `(producer_party_id, created_at DESC)`. | Named participants/producer read safe take status; endpoint assets are participant-scoped; state writes require producer/worker CAS; anon no grant. |
| `take_fragment` | `id uuid PK`; `take_id uuid NOT NULL FK take ON DELETE CASCADE`; `endpoint_id uuid NOT NULL FK endpoint_capability`; `fragment_number integer NOT NULL CHECK >=0`; `local_journal_ref text NOT NULL`; `start_offset_ms bigint NOT NULL CHECK >=0`; `end_offset_ms bigint NOT NULL CHECK end>=start`; `checksum char(64) NOT NULL`; `state text NOT NULL CHECK local/pending/finalized/lost`; `version bigint NOT NULL`. | Unique `(take_id, endpoint_id, fragment_number)`; `(take_id, endpoint_id, state)`; `(checksum)`. | Endpoint participant owns fragment; producer sees counts/checksum prefix; storage worker updates state; raw local ref private; anon no grant. |
| `capture_asset` | `id uuid PK`; `take_id uuid NOT NULL FK take`; `endpoint_id uuid NOT NULL FK endpoint_capability`; `owner_party_id uuid NOT NULL FK party`; `checksum char(64) NOT NULL`; `size_bytes bigint NOT NULL CHECK >=0`; `duration_ms bigint NOT NULL CHECK >=0`; `state text NOT NULL CHECK local/pending/uploading/uploaded/withheld/discarded/lost/quarantined`; `upload_session_ref text NULL`; `provider_object_ref text NULL`; `retention_until timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(take_id, endpoint_id, checksum)`; `(owner_party_id, state, updated_at DESC)`; `(take_id, state)`. | Owner controls withhold/discard; project worker reads only accepted uploaded asset; provider ref service-only; no public/anon grant. |
| `alignment_model` | `id uuid PK`; `take_id uuid NOT NULL FK take`; `reference_asset_id uuid NOT NULL FK capture_asset`; `method text NOT NULL CHECK multi_anchor/nominal_rate`; `anchor_set jsonb NOT NULL CHECK array`; `drift_model jsonb NOT NULL CHECK object`; `residual_ms numeric NULL CHECK >=0`; `quality text NOT NULL CHECK measured/partial/unknown`; `original_checksums jsonb NOT NULL CHECK array`; `state text NOT NULL CHECK aligned/partial/unaligned`; `version bigint NOT NULL`. | Unique `(take_id, reference_asset_id, version)`; `(take_id, state)`; `(quality)`. | Take participants/project processor select model; only worker writes; original assets remain immutable; anon no grant. |
| `moment_flag` | `id uuid PK`; `take_id uuid NOT NULL FK take`; `asset_id uuid NOT NULL FK capture_asset`; `participant_id uuid NOT NULL FK session_participant`; `position_ms bigint NOT NULL CHECK >=0`; `kind text NOT NULL CHECK clip/gap/marker/note`; `basis text NOT NULL`; `state text NOT NULL CHECK open/confirmed/retracted`; `version bigint NOT NULL`. | Unique `(asset_id, position_ms, kind, version)`; `(take_id, position_ms)`; `(participant_id, created_at DESC)`. | Participant owns flags; project processor reads accepted flags; body/notes encrypted; no public/anon grant. |
| `attendance_observation` | `id uuid PK`; `intent_id uuid NOT NULL FK session_intent`; `take_id uuid NULL FK take`; `participant_id uuid NOT NULL FK session_participant`; `role text NOT NULL CHECK producer/performer/monitor/listener`; `instrument text NOT NULL`; `observed_endpoint_ids jsonb NOT NULL CHECK array`; `gap_seconds integer NOT NULL CHECK >=0`; `audible_seconds integer NOT NULL CHECK >=0`; `basis text NOT NULL CHECK observed_endpoint_audio/delivered_file/counter_attested`; `disclosure_version bigint NOT NULL`; `seal_eligible_at timestamptz NOT NULL`; `sealed_at timestamptz NULL`; `state text NOT NULL CHECK open/sealed/retracted`; `version bigint NOT NULL`. | Unique `(intent_id, participant_id, version)`; `(intent_id, state)`; `(participant_id, sealed_at)`. | Participant sees own row; named participants see composed safe rows after disclosure; Shard 02 consumes observation but cannot mutate source; anon no grant. |

### State, Concurrency and Transaction Rules

- Take state is `prepared → rolling → interrupted|finalizing → finalized|uploading|partial → aligned|sealed`; finalization is one immutable local file per take/endpoint. Conductor/producer interruption from the live split may move the take to `interrupted` or `finalizing`; this split never invents delivery.
- Fragment and asset state is `local → pending → uploading → uploaded`, or `withheld|discarded|lost|quarantined`; chunks are immutable and provider-confirmed by offset/checksum. Upload pauses while live and resumes later; a late asset can attach after attendance seal with original take/version and a late-delivery audit.
- Alignment locks expected asset versions, computes multi-anchor offsets/drift/residual, and writes only a sidecar `alignment_model`; original files/checksums remain unchanged. Partial/unaligned result is retained as such.
- Attendance observation is `open → sealed|retracted`; own-row disclosure and role/instrument are explicit, and seal is eligible after 24 hours. Shard 02 decides any credit meaning; no event or transaction here creates credit.
- Finalize, upload action, alignment and seal each lock the aggregate and use `expectedVersion`; outbox event commits with the local mutation. Storage/project outages leave source state recoverable and never fabricate success.

### Grants, RLS and Retention

`realtime_api` receives execute on finalization/upload/alignment/attendance RPCs; `realtime_worker` writes provider state, projections and outbox; `realtime_migrator` owns DDL. RLS uses BE00 `current_actor_id()` and named participant/endpoint predicates. Original assets and attendance evidence retain seven years or consent/legal minimum; local/provider refs and checksums are access-controlled; raw audio is never logged.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `RTS-CAP-API-01` | Producer/conductor controls finalization; endpoint participant owns local file facts. | `403` for nonauthority; `404` hides unknown take. |
| `RTS-CAP-API-02` | Named endpoint participant owns capture asset/chunk session. | `403` for foreign asset; `404` hides unknown take/asset. |
| `RTS-CAP-API-03` | Named take participant or authorized project processor with accepted assets. | `403` for unauthorized processor/participant; `404` hides unknown take/assets. |
| `RTS-CAP-API-04` | Named participant seals own attendance observation after disclosure. | `403` for foreign row; `404` hides unknown intent/observation. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `RTS-CAP-API-01` | `requestId` → `strictCors(realtimeCaptureOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(takeFinalize)` → `parseZod(FinalizeTakeRequest)` → `idempotency(24h)` → `authorizeProducerEpoch` → `journalIntegrityGuard` → `finalizeTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-CAP-API-02` | `requestId` → `strictCors(realtimeCaptureOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(captureUpload)` → `parseZod(UploadCaptureAssetRequest)` → `idempotency(30d)` → `authorizeAssetOwner` → `liveRoomPauseGuard` → `chunkStorage` → `assetTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-CAP-API-03` | `requestId` → `strictCors(realtimeCaptureOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(takeAlignment)` → `parseZod(AlignTakeRequest)` → `idempotency(24h)` → `authorizeTakeParticipantOrProcessor` → `assetVersionGuard` → `alignmentCompute` → `sidecarTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |
| `RTS-CAP-API-04` | `requestId` → `strictCors(realtimeAttendanceOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(attendanceSeal)` → `parseZod(SealAttendanceRequest)` → `idempotency(24h)` → `authorizeOwnObservation` → `disclosureGuard` → `sealTransaction` → `errorEnvelope(ApiError { code, message, requestId, details })` → `audit`. |

### Security and Privacy Controls

Use checksum-proven journals, immutable chunk offsets, private buckets, signed short-lived upload URLs, opaque IDs, encrypted flags/notes and server timestamps. Never accept a client-supplied playback/attendance claim, overwrite original audio, or let attendance directly mint credit. Capture assets are participant-attributed; late delivery remains visible. CORS never permits `*` with credentials; capture/alignment/attendance responses are `private, no-store`.

## Data Flow

1. BE00 authenticates actor/context, validates strict Zod input and reserves idempotency key.
2. Finalization closes local journal, persists checksum/fragment facts and creates a playable local asset; upload state follows separately.
3. Upload pauses while live, then sends immutable provider-confirmed chunks; withhold/discard/lost become explicit asset states.
4. Alignment validates assets/reference, computes sidecar offsets/drift/residual, and hands accepted source/model to Shard 09 without changing originals.
5. Attendance composes and discloses own observations, seals after 24 hours, emits an evidence event and leaves credit meaning to Shard 02.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `realtime.take.changed.v1` | `{eventId, takeId, intentId, epochId, state, fragmentCount, version, occurredAt}`; no audio/path. | Capture/project projectors; at-least-once ordered by take/version and deduped by eventId. |
| `realtime.capture-asset.changed.v1` | `{eventId, assetId, takeId, ownerPseudonym, state, checksumPrefix, quality, version, occurredAt}`; no object key/audio. | Upload/project/alignment workers; late asset carries original take/version and audit. |
| `realtime.alignment.changed.v1` | `{eventId, alignmentModelId, takeId, trackCount, state, residualClass, version, occurredAt}`; no audio or exact positions. | Project timeline; original asset checksums remain authoritative. |
| `realtime.attendance.sealed.v1` | `{eventId, intentId, observationIds, basis, sealedAt, version, occurredAt}`; no credit conclusion or private audio. | Shards 02, 09 and dispute evidence; consumer decides meaning under its own policy. |

Consumers reject stale versions, retry at 2s/8s/32s, dead-letter after five attempts with an alert, preserve last safe projections and carry BE00 `requestId`/`correlationId`.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Producer/participant/epoch or schema denial | Typed error before local/provider mutation; no foreign asset, attendance or alignment access. |
| Runtime crash/disk exhaustion | Recover journal/chunks only with checksum proof; otherwise explicit `partial`/`lost` and `DISK_INSUFFICIENT`; never fabricate file or success. |
| Storage timeout/checksum mismatch | Keep asset pending/uploading, return `UPLOAD_INCOMPLETE` or `503`, retry provider-confirmed chunks, and preserve local file. |
| Alignment timeout/invalid reference | `ALIGNMENT_UNAVAILABLE`; retain originals and prior model, retry bounded job, no destructive rewrite. |
| Attendance disclosure/24-hour race | Require own-row disclosure and seal eligibility; stale competing seal returns `VERSION_CONFLICT`; no direct credit event. |
| Late asset after seal | Attach with original take/version, preserve sealed observation, and append late-delivery audit/event. |
| Shard 09/02 outage | Source asset/observation remains committed; durable outbox retries; no ownership/credit claim until consumer acceptance. |
| Duplicate provider/event/replay | Dedupe by chunk/provider/event/idempotency key; return original offset/state/model without second effect. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `RTS-CAP-API-01` | Journal/checksum/fragment bounds and exact finalization states. | Producer/epoch, endpoint ownership, no fabricated success, CORS/rate. | Immutable take/file, fragment uniqueness, replay and event. | Crash/disk recovery, provider outage, checksum redaction. |
| `RTS-CAP-API-02` | Chunk/action/offset/checksum schema and explicit asset states. | Asset owner, live pause, private storage, withhold/discard attribution. | Provider-confirmed resume, immutable chunks, late asset and event. | Timeout/retry/breaker, checksum failure, local persistence. |
| `RTS-CAP-API-03` | Method/anchors/versions/residual result and exact error envelope. | Participant/processor scope, non-destructive original, no precise leak. | Sidecar alignment model, expected-version CAS and event. | Compute outage, partial result, stale assets and metrics. |
| `RTS-CAP-API-04` | Role/instrument/gap/audible/basis/24h schema and seal response. | Own-row disclosure, no credit minting, Shard 02 boundary, CORS/rate. | Unique observation, CAS seal, late asset and attendance event. | Seal race, consumer outage, no credit conclusion telemetry. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, take/capture/alignment/attendance state transitions, checksum/offset and seal eligibility. PostgreSQL tests run RLS, unique fragments/assets, immutable originals, CAS, sidecar-only alignment and attendance isolation. Adapter tests exercise exact journal/storage/alignment/project timeout, retry/backoff, breaker and provider idempotency. Worker tests prove event ordering, late-asset attachment and Shard 02/09 handoff. Playwright covers finalize-before-upload, pause/resume, withhold/discard, alignment residual, attendance disclosure/seal, keyboard focus and safe uncertainty copy. The gate fails on any route collision, missing operation row, non-`ApiError` response, original mutation or credit laundering.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all four routes have strict Zod 4 request/success/error schemas, bounded fields, statuses and exact error envelope.
- **Pass 2 — macro boundary:** runtime/live controls, storage, alignment, Shard 09 project and Shard 02 evidence/credit meaning are explicit seams; no duplicate transport route.
- **Pass 3 — lifecycle/race:** take/fragment/asset/alignment/observation states use CAS, immutable checksums, late-asset handling and 24-hour seal.
- **Pass 4 — failure/abuse:** crash/disk loss, checksum mismatch, upload pause, destructive alignment, attendance credit laundering, retries/breakers and event dedupe are testable.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, FKs, indexes, RLS/grants, retention and redacted events.

## Ambiguity Gate

**PASS.** The split is source-aligned (`RTS-13`, `RTS-14`, `RTS-15`, `RTS-16`), all four routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, failure recovery and tests. Journal/storage, alignment, Shard 09 and Shard 02 seams specify exact timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 17 and deep dive; locked immutable local capture, explicit upload outcomes, sidecar alignment and 24-hour attributed attendance sealing. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox and shared middleware.
- [BE Shard 17a — Runtime admission, latency and discovery](17a-runtime-admission-latency-discovery.md) for runtime admission and preflight prerequisites.
- [BE Shard 17b — Live controls and monitoring](17b-live-room-monitoring-controls.md) for transport epoch, interruption and capture-readiness inputs.
- [BE Shard 17d — Overdub requests and delivery](17d-overdub-requests-delivery.md) for later bed/pass assets.
- [IA Shard 09 — Projects and collaboration](../ia/09-projects-collaboration.md) for accepted project asset/alignment handoff.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for attendance evidence conclusions and consent.
