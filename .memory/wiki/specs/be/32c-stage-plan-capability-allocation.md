# Stage Plan, Capability Diff and Allocation — Backend Specification

## Split Group

- IA source: ../ia/32-show-production-planning.md.
- Assigned interactions: 32.05 Build stage plot, 32.06 Derive input list, 32.07 Author monitor needs, 32.08 Run venue capability diff and 32.09 Allocate pooled capability.
- Owned aggregates: StagePlanVersion, InputRow, MonitorMix, CapabilityDiff and CapabilityAllocation.
- Owned events: production.stage_plan.versioned and production.capability_diff.completed.
- Boundary: list/source editor remains canonical; stage plot is structured geometry. Input rows derive deterministically except venue-owned patch. Diff unknown never becomes match. Pool over-allocation blocks allocation, not the event.

## Endpoint Completeness

| IA ID | Method | Path | Success |
|---|---|---|---|
| 32.05 | POST | /api/v1/production/events/{eventId}/stage-plans | 201 StagePlanVersionV1 |
| 32.06 | POST | /api/v1/production/stage-plans/{planId}/input-list-derivations | 201 InputListV1 |
| 32.07 | POST | /api/v1/production/events/{eventId}/monitor-mixes | 201 MonitorMixVersionV1 |
| 32.08 | POST | /api/v1/production/events/{eventId}/capability-diffs | 201 CapabilityDiffV1 |
| 32.09 | POST | /api/v1/production/events/{eventId}/capability-allocations | 201 CapabilityAllocationV1 |

References: ../ia/32-show-production-planning.md, 00-infrastructure.md and venue/gear source seams in Shards 23/24/29.

## Shared Contract Inheritance

ApiError { code, message, requestId, details } is exact. Geometry/details may identify stable item/row codes but not protected performer/access content. Browser writes use credentialled CORS, CSRF, strict Zod, event/act/venue mandate, Idempotency-Key and If-Match.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 32](../ia/32-show-production-planning.md) | Interactions lines 68–88; Contracts lines 89–107; Data Models lines 108–151; Access Control lines 152–177; Event Schemas and Edge Cases lines 187–217 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.03 Show Advancing | 32.08–32.09 |
| 18.05 Stage Plot & Input List | 32.05–32.07 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Concurrency/idempotency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 32.05 | POST | /api/v1/production/events/{eventId}/stage-plans | act production editor for owned sources/positions | key plus If-Match; source version/geometry checksum | 30/hour act; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, act/source/geometry |
| 32.06 | POST | /api/v1/production/stage-plans/{planId}/input-list-derivations | act/production viewer; venue patch editor only for patch column | key; plan/source/rule versions unique; deterministic replay | 60/hour plan; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, source/rule/patch ownership |
| 32.07 | POST | /api/v1/production/events/{eventId}/monitor-mixes | person/act monitor editor | key plus If-Match; person/position/source-set version | 60/hour act; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, person/act/source/equipment |
| 32.08 | POST | /api/v1/production/events/{eventId}/capability-diffs | production/venue counterpart with snapshot visibility | key; all snapshot/rule versions pin result | 30/hour event; no-store; 10s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, snapshot/freshness/diff policy |
| 32.09 | POST | /api/v1/production/events/{eventId}/capability-allocations | show producer plus affected act/venue scope | key plus If-Match; bill/pool version and allocation serializable | 30/hour event; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, bill/pool/capacity/visibility |

## Zod 4 Contracts and Validation

| ID | Strict request | Success |
|---|---|---|
| 32.05 | StagePlanCreate { sourceVersion, stageBounds { widthMm,depthMm,heightLimitMm nullable }, objects 1–500 with stableId/sourceRef/xMm/yMm/widthMm/depthMm/heightMm nullable/rotationDegrees/type, units fixed mm, renderOptions } | StagePlanVersionV1 { planId, version, sourceVersion, objects, geometryWarnings, renderHash, artifactRef } |
| 32.06 | InputListDerive { planVersion, sourceVersion, derivationRuleVersion, venuePatchChanges nullable with rowId/patchValue } | InputListV1 { inputVersion, rows { rowId,sourceRef,channelCount,DI,mic,stand,power,derivedChecksum,venuePatch }, renderHash } |
| 32.07 | MonitorMixCreate { personOrPositionRef, sourceVersion, channels, equipment { mode wedge/IEM/none, sends, hardwareRefs }, relativeNotes nullable } | MonitorMixVersionV1 { mixId, version, position, channels, equipment, notes, validationWarnings } |
| 32.08 | CapabilityDiffCreate { riderVersion, stagePlanVersion, inputVersion, monitorVersions, gearManifestVersion, venueCapabilitySnapshotVersion, diffRuleVersion } | CapabilityDiffV1 { diffId, snapshots, rows with requirement/outcome match/shortfall/unknown/basis/caveats/confidence/severity/judgement, counts, version } |
| 32.09 | CapabilityAllocationCreate { billVersion, poolSnapshotVersion, assignments with poolItem/act/quantity/window, affectedActAcknowledgements } | CapabilityAllocationV1 { allocationId, version, assignments, remainingPool, unresolvedShortfalls } |

### Exact typed success schemas

The operation comments map each route to its exact strict success parser. All dimensions are integer millimetres; all counts are bounded integers.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Instant = z.iso.datetime({ offset: true });
const StageObject = z.object({
  stableId: Uuid, sourceRef: Uuid, xMm: z.int(), yMm: z.int(), widthMm: z.int().positive(), depthMm: z.int().positive(),
  heightMm: z.int().positive().nullable(), rotationDegrees: z.number().min(0).lt(360), type: z.string().regex(/^[a-z0-9_]{1,64}$/),
}).strict();
// 32.05
export const StagePlanVersionV1 = z.object({
  planId: Uuid, version: Version, sourceVersion: Version, objects: z.array(StageObject).min(1).max(500),
  geometryWarnings: z.array(z.object({ code: z.string().regex(/^[a-z0-9_]{1,64}$/), objectIds: z.array(Uuid).min(1).max(20), hard: z.boolean() }).strict()).max(500),
  renderHash: Digest, artifactRef: Uuid,
}).strict();
const InputRow = z.object({
  rowId: Uuid, sourceRef: Uuid, channelCount: z.int().positive().max(512), DI: z.boolean(),
  mic: z.string().max(128).nullable(), stand: z.string().max(128).nullable(), power: z.string().max(128).nullable(),
  derivedChecksum: Digest, venuePatch: z.string().max(500).nullable(),
}).strict();
// 32.06
export const InputListV1 = z.object({ inputVersion: Version, rows: z.array(InputRow).min(1).max(5000), renderHash: Digest }).strict();
// 32.07
export const MonitorMixVersionV1 = z.object({
  mixId: Uuid, version: Version, position: z.string().min(1).max(128),
  channels: z.array(z.object({ sourceRef: Uuid, send: z.int().min(0).max(128), muted: z.boolean() }).strict()).max(512),
  equipment: z.object({ mode: z.enum(["wedge", "IEM", "none"]), sends: z.int().min(0).max(128), hardwareRefs: z.array(Uuid).max(100) }).strict(),
  notes: z.string().max(2000).nullable(), validationWarnings: z.array(z.string().regex(/^[a-z0-9_]{1,64}$/)).max(100),
}).strict();
const DiffRow = z.object({
  requirementId: Uuid, outcome: z.enum(["match", "shortfall", "unknown"]), basis: z.string().min(1).max(500),
  caveats: z.array(z.string().max(500)).max(20), confidence: z.number().min(0).max(1),
  severity: z.enum(["info", "warning", "hard"]), judgement: z.enum(["deterministic", "human_required"]),
}).strict();
// 32.08
export const CapabilityDiffV1 = z.object({
  diffId: Uuid, snapshots: z.object({ riderVersion: Version, stagePlanVersion: Version, inputVersion: Version, gearManifestVersion: Version, venueCapabilitySnapshotVersion: Version }).strict(),
  rows: z.array(DiffRow).max(5000), counts: z.object({ match: z.int().min(0), shortfall: z.int().min(0), unknown: z.int().min(0) }).strict(), version: Version,
}).strict();
const Assignment = z.object({ assignmentId: Uuid, poolItemId: Uuid, actId: Uuid, quantity: z.int().positive(), startsAt: Instant, endsAt: Instant }).strict();
// 32.09
export const CapabilityAllocationV1 = z.object({
  allocationId: Uuid, version: Version, assignments: z.array(Assignment).max(5000),
  remainingPool: z.array(z.object({ poolItemId: Uuid, quantity: z.int().min(0) }).strict()).max(5000),
  unresolvedShortfalls: z.array(z.object({ requirementId: Uuid, quantity: z.int().positive(), severity: z.enum(["warning", "hard"]) }).strict()).max(5000),
}).strict();
~~~

- Geometry uses integer millimetres, stage origin and clockwise degrees. Overlap/out-of-bounds/height conflicts name stable objects and reject only hard conflicts; list editor/source stays canonical.
- Input row IDs derive from source stable ID plus channel ordinal. Client edits to derived DI/mic/stand/power/channel values are rejected; only venuePatch is writable by venue authority.
- Monitor relative-level language is stored as a note; the system never translates “same/louder/quieter than person” into a matched level.
- Capability diff is a pure function over pinned snapshots. A stale hard venue capability becomes unknown with freshness caveat/confidence zero, never match.
- Allocation quantities/windows cannot exceed pool snapshot; same pool unit cannot overlap assignments. An over-allocation returns 409 and leaves event/diff intact.

## Database Schema

| Model | Typed fields, constraints, indexes | RLS/grants |
|---|---|---|
| StagePlanVersion | id uuid; event_id; act_id; version; source_version; stage_bounds jsonb; objects_json validated; geometry_checksum; render_hash; artifact_ref; created_by/at | unique event,act,version/checksum; GIN objects; append-only; act and production/venue projection |
| InputRow | id uuid; plan_id/version; input_version; row_id; source_ref; channel_ordinal; channel_count; di/mic/stand/power typed fields; derived_checksum; venue_patch nullable; patch_owner_revision nullable | unique plan/input version/row; index source ref; derived fields trigger immutable, venue patch RPC only |
| MonitorMix | id uuid; event_id; act_id; person_or_position_ref; source_version; channels/equipment/relative_notes jsonb; version; created_by/at | unique event,act,person position,version; act/person scoped, production narrowed |
| CapabilityDiff | id uuid; event_id; snapshot_manifest; rule_version; rows_json; match/shortfall/unknown counts; checksum; version; created_at | unique snapshot checksum/rule; indexes event,time; counterparties see permitted rows |
| CapabilityAllocation | id uuid; event_id; bill_version; pool_snapshot_version; assignments_json; remaining_pool; unresolved_shortfalls; version; created_by/at | unique event,bill,pool,version; exclusion pool item/time assignment; producer/affected act/venue projections |

All tables have RLS and no PUBLIC/anon grants. Versions/diffs are append-only. Render artifacts are immutable Storage refs. Security-invoker views apply per-act visibility and remove sensitive rider/access details.

### D4 Persistence and Query-Plan Closure

The following field map is normative. Every listed column is `NOT NULL` unless explicitly marked `NULL`; UUIDs reject the nil value, JSON arrays/objects have shape checks, and all local FKs use `ON DELETE RESTRICT`. Revision-pinned cross-shard refs are validated through their owner seam rather than an unsafe cross-domain FK.

| Table | Exact SQL field types and constraints | Relationships and query-pattern indexes | RLS and grants |
|---|---|---|---|
| `stage_plan_versions` (StagePlanVersion) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `act_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version>0)`; `source_version bigint NOT NULL CHECK (source_version>0)`; `stage_bounds jsonb NOT NULL CHECK (jsonb_typeof(stage_bounds)='object')`; `objects_json jsonb NOT NULL CHECK (jsonb_typeof(objects_json)='array' AND jsonb_array_length(objects_json) BETWEEN 1 AND 500)`; `geometry_checksum bytea NOT NULL CHECK (octet_length(geometry_checksum)=32)`; `render_hash bytea NOT NULL CHECK (octet_length(render_hash)=32)`; `artifact_ref text NOT NULL CHECK (length(artifact_ref) BETWEEN 1 AND 500)`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL` | `event_id` is ProductionEvent; `act_id` is the event-bill act. `UNIQUE(event_id,act_id,version)`, `UNIQUE(event_id,act_id,geometry_checksum)`; `INDEX(event_id,act_id,version DESC)`; GIN `(objects_json jsonb_path_ops)` | FORCE RLS. Act editors insert/select own versions; venue/production actors use a field-narrowed projection; renderer has row-scoped SELECT; no request UPDATE/DELETE. |
| `input_rows` (InputRow) | `id uuid PRIMARY KEY`; `plan_id uuid NOT NULL`; `plan_version bigint NOT NULL CHECK (plan_version>0)`; `input_version bigint NOT NULL CHECK (input_version>0)`; `row_id uuid NOT NULL`; `source_ref text NOT NULL CHECK (length(source_ref) BETWEEN 1 AND 500)`; `channel_ordinal integer NOT NULL CHECK (channel_ordinal>=0)`; `channel_count integer NOT NULL CHECK (channel_count BETWEEN 1 AND 512)`; `di jsonb NOT NULL CHECK (jsonb_typeof(di)='object')`; `mic jsonb NOT NULL CHECK (jsonb_typeof(mic)='object')`; `stand jsonb NOT NULL CHECK (jsonb_typeof(stand)='object')`; `power jsonb NOT NULL CHECK (jsonb_typeof(power)='object')`; `derived_checksum bytea NOT NULL CHECK (octet_length(derived_checksum)=32)`; `venue_patch jsonb NULL CHECK (venue_patch IS NULL OR jsonb_typeof(venue_patch)='object')`; `patch_owner_revision bigint NULL CHECK (patch_owner_revision IS NULL OR patch_owner_revision>0)` | FK `plan_id -> stage_plan_versions.id`; `source_ref` is a canonical rig/plan seam. `UNIQUE(plan_id,input_version,row_id)`; `UNIQUE(plan_id,input_version,channel_ordinal)`; `INDEX(source_ref,input_version DESC)`; `INDEX(plan_id,plan_version,input_version)` | FORCE RLS. Plan/act readers see derived rows; only the venue-patch RPC can set patch columns; immutable-derived trigger denies all other field updates. |
| `monitor_mixes` (MonitorMix) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `act_id uuid NOT NULL`; `person_or_position_ref text NOT NULL CHECK (length(person_or_position_ref) BETWEEN 1 AND 300)`; `source_version bigint NOT NULL CHECK (source_version>0)`; `channels jsonb NOT NULL CHECK (jsonb_typeof(channels)='array')`; `equipment jsonb NOT NULL CHECK (jsonb_typeof(equipment)='object')`; `relative_notes jsonb NULL CHECK (relative_notes IS NULL OR jsonb_typeof(relative_notes) IN ('array','object'))`; `version bigint NOT NULL CHECK (version>0)`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL` | Event/act are ProductionEvent/bill relationships; person/position is an opaque roster reference. `UNIQUE(event_id,act_id,person_or_position_ref,version)`; `INDEX(event_id,act_id,version DESC)`; GIN `(channels jsonb_path_ops)` | FORCE RLS. Person/act editor inserts and selects authorized mixes; production view is narrowed; other acts and PUBLIC receive no rows/grants. |
| `capability_diffs` (CapabilityDiff) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `snapshot_manifest jsonb NOT NULL CHECK (jsonb_typeof(snapshot_manifest)='object')`; `rule_version bigint NOT NULL CHECK (rule_version>0)`; `rows_json jsonb NOT NULL CHECK (jsonb_typeof(rows_json)='array')`; `match_count integer NOT NULL CHECK (match_count>=0)`; `shortfall_count integer NOT NULL CHECK (shortfall_count>=0)`; `unknown_count integer NOT NULL CHECK (unknown_count>=0)`; `checksum bytea NOT NULL CHECK (octet_length(checksum)=32)`; `version bigint NOT NULL CHECK (version>0)`; `created_at timestamptz NOT NULL` | Event plus snapshot members are revision-pinned external relationships. `UNIQUE(event_id,checksum,rule_version)`; `INDEX(event_id,created_at DESC)`; `INDEX(event_id,shortfall_count,unknown_count)`; GIN `(rows_json jsonb_path_ops)` | FORCE RLS. Only event counterparties may select permitted rows; diff worker inserts; sensitive rider/access fields are absent; no UPDATE/DELETE grant. |
| `capability_allocations` (CapabilityAllocation) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `bill_version bigint NOT NULL CHECK (bill_version>0)`; `pool_snapshot_version bigint NOT NULL CHECK (pool_snapshot_version>0)`; `assignments_json jsonb NOT NULL CHECK (jsonb_typeof(assignments_json)='array')`; `remaining_pool jsonb NOT NULL CHECK (jsonb_typeof(remaining_pool)='array')`; `unresolved_shortfalls jsonb NOT NULL CHECK (jsonb_typeof(unresolved_shortfalls)='array')`; `version bigint NOT NULL CHECK (version>0)`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL` | Event/bill/pool are revision-pinned owner seams. `UNIQUE(event_id,bill_version,pool_snapshot_version,version)`; exclusion constraint on normalized assignment rows prevents the same pool unit and time range from overlapping; `INDEX(event_id,version DESC)`; GIN `(assignments_json jsonb_path_ops)` | FORCE RLS. Producer writes; affected act and venue projections expose only their assignments/remaining pool; allocator worker has bounded INSERT; no base-table UPDATE/DELETE. |

The allocator normalizes assignment ranges in the same transaction so the exclusion constraint is authoritative rather than a JSON-only application check. Migration tests prove every type/check, relationship validator, index plan, FORCE RLS policy, grant denial, and immutable-history trigger.

## State, Transactions and Recovery

- Plan/input/mix/diff/allocation are immutable version chains; current pointer changes with CAS.
- 32.05 validates geometry and commits plan/artifact manifest plus production.stage_plan.versioned atomically; render job may finish later without changing hash.
- 32.06 derives all rows inside one pinned snapshot; venue patches are applied after derivation and retained only where row identity persists.
- 32.08 computes diff and production.capability_diff.completed outbox atomically. Source outage returns unknown/failed without partial rows.
- 32.09 locks pool items in stable ID order and commits allocation/outbox atomically; conflict writes nothing.

## Middleware, Security and Observability

Order: request ID → CORS → auth → CSRF → strict size/Zod → rate → event/act/person/venue RLS → idempotency/If-Match → source/freshness/capacity policy → transaction → response validation → redacted audit. Logs include IDs, snapshot/rule versions, counts, safe conflict codes and duration; exclude protected access notes and private equipment/person detail outside scope.

## Events and Integrations

| Event/seam | Delivery/recovery |
|---|---|
| production.stage_plan.versioned | plan/input versions and render hash; event/version dedupe; at-least-once; no sensitive notes |
| production.capability_diff.completed | diff/snapshot manifest, outcome counts/row refs; diff-version dedupe |
| source/venue/gear snapshots | ID/version → typed source/manifest/capability; 3s, 2 retries 100ms/500ms, circuit 5 failures/30s 30s; stale hard value unknown |
| renderer/storage | geometry/input snapshot → immutable SVG/PDF/artifact hash; 15s, 2 retries 1s/5s, circuit 5 failures/min 2m; prior artifact persists |

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 32.05 | 400 GEOMETRY_INVALID/OBJECT_CONFLICT; 403 ACT_AUTHORITY_REQUIRED; 409 SOURCE_VERSION_CONFLICT; 412 REVISION_MISMATCH; 422 STAGE_BOUNDS_VIOLATED |
| 32.06 | 400 DERIVATION_INPUT_INVALID/PATCH_INVALID; 403 PATCH_AUTHORITY_REQUIRED; 409 DERIVED_ROW_EDIT_FORBIDDEN; 422 SOURCE_UNCONFIRMED |
| 32.07 | 400 MONITOR_MIX_INVALID; 403 PERSON_OR_ACT_AUTHORITY_REQUIRED; 409 VERSION_CONFLICT; 422 SOURCE_CHANNEL_UNKNOWN |
| 32.08 | 400 SNAPSHOT_INVALID; 403 SNAPSHOT_SCOPE_REQUIRED; 409 SNAPSHOT_VERSION_CONFLICT; 422 CAPABILITY_UNKNOWN; 503 SOURCE_UNAVAILABLE |
| 32.09 | 400 ALLOCATION_INVALID; 403 ALLOCATION_AUTHORITY_REQUIRED; 409 POOL_OVERALLOCATED/POOL_VERSION_CONFLICT; 412 REVISION_MISMATCH |

Unknown failures map 500 INTERNAL_ERROR, deadlines 503 DEPENDENCY_TIMEOUT, rate 429 plus Retry-After; unauthorized IDs are 404.

## Verification and Test Strategy

| ID | Tests |
|---|---|
| 32.05 | unit/geometry bounds, object conflicts, optional height, canonical source and render hash |
| 32.06 | deterministic rows/IDs, derived edit denial, venue patch owner and source revision |
| 32.07 | person/position scope, channel/equipment validation, relative note never matched |
| 32.08 | pinned pure diff, match/shortfall/unknown, stale hard venue unknown and visibility |
| 32.09 | bill/pool CAS, stable locks, overlapping/quantity over-allocation and atomic result |

RLS/grant tests cover each act/person, producer, venue and services. Transaction/event tests prove version/outbox atomicity, no partial diff/allocation and replay/conflict behavior.

## Deepening Passes

- Micro: units, geometry, row ownership, monitor semantics, snapshot freshness and pool capacity are explicit.
- Macro: source/gear/venue owners remain canonical; this companion derives plans/diffs/allocations.
- Devil's advocate: no implementation may mutate source via geometry, edit derived inputs, convert relative notes to levels, treat stale as match or over-allocate.
- Two-implementer and ambiguity gates: PASS; no open decision.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 32.05 | `be_http_requests_total{operation_id="32.05",outcome,code}`, `be_http_latency_seconds{operation_id="32.05"}`, and `be_operation_recovery_total{operation_id="32.05",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.06 | `be_http_requests_total{operation_id="32.06",outcome,code}`, `be_http_latency_seconds{operation_id="32.06"}`, and `be_operation_recovery_total{operation_id="32.06",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.07 | `be_http_requests_total{operation_id="32.07",outcome,code}`, `be_http_latency_seconds{operation_id="32.07"}`, and `be_operation_recovery_total{operation_id="32.07",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.08 | `be_http_requests_total{operation_id="32.08",outcome,code}`, `be_http_latency_seconds{operation_id="32.08"}`, and `be_operation_recovery_total{operation_id="32.08",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 32.09 | `be_http_requests_total{operation_id="32.09",outcome,code}`, `be_http_latency_seconds{operation_id="32.09"}`, and `be_operation_recovery_total{operation_id="32.09",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 32c production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 32](../ia/32-show-production-planning.md)
- Shards 23/24 gear and Shard29 venue capability source seams.
