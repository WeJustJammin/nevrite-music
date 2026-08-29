# Show Setlists, Files and Performed Capture — Backend Specification

## Split Group

- IA source: ../ia/33-show-day-operations.md.
- Assigned interactions: 33.01 Version planned setlist, 33.02 Export stage-ready set, 33.03 Package show files and 33.04 Capture performed set.
- Owned aggregates: SetlistVersion, ShowFilePackage and PerformedSet.
- Owned events: showday.setlist.versioned and showday.performed_set.recorded.
- Planned and performed are separate immutable facts. Missing capture never becomes an inferred performance; fallback displays the plan as unconfirmed.

## Endpoint Completeness

| IA ID | Method | Path | Success |
|---|---|---|---|
| 33.01 | POST | /api/v1/showday/events/{eventId}/setlists | 201 SetlistVersionV1 |
| 33.02 | POST | /api/v1/showday/events/{eventId}/setlist-exports | 202 SetlistExportV1 |
| 33.03 | POST | /api/v1/showday/events/{eventId}/show-file-packages | 201 ShowFilePackageV1 |
| 33.04 | POST | /api/v1/showday/events/{eventId}/performed-sets | 201 PerformedSetV1 |

References: ../ia/33-show-day-operations.md, 00-infrastructure.md and Shard32 production-plan source seam.

## Shared Contract Inheritance

ApiError { code, message, requestId, details } is exact. File bodies, private notes, personnel evidence and signed URLs never enter errors/logs/events. Browser writes use credentialled CORS, CSRF, strict Zod, event/act authority, Idempotency-Key and If-Match.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 33](../ia/33-show-day-operations.md) | Interactions lines 73–95; Contracts lines 96–115; Data Models lines 116–158; Access Control lines 159–184; Event Schemas and Edge Cases lines 195–228 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 18.06 Setlist & Show Files | 33.01–33.04 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Concurrency/idempotency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 33.01 | POST | /api/v1/showday/events/{eventId}/setlists | act/TM setlist.manage | key plus If-Match; stable row/order three-way merge | 60/hour act; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, act/song/work/timing |
| 33.02 | POST | /api/v1/showday/events/{eventId}/setlist-exports | current-set viewer and recipient scope | key; setlist/version/recipient/format checksum | 30/hour; no-store; 500ms, async 1m | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, version/recipient/accessibility/render |
| 33.03 | POST | /api/v1/showday/events/{eventId}/show-file-packages | act/TM file.manage and asset authority | key plus If-Match; ordered manifest/file digest unique | 20/hour; no-store; 10s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, upload/asset/checksum/malware |
| 33.04 | POST | /api/v1/showday/events/{eventId}/performed-sets | act/TM/show reporter after event start | key; event/capture source unique; append-only actual version | 20/hour; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, event/plan/person/attestation |

## Zod 4 Contracts and Invariants

| ID | Strict request | Success |
|---|---|---|
| 33.01 | SetlistVersionCreate { parentVersionId nullable, tourId/dateId, rows 1–200 with stableRowId/orderKey/songRef nullable/workRef nullable/localTitle/structure/durationLowSec/durationHighSec/transitionNote, changeReason } | SetlistVersionV1 { setlistId, versionId, parent, rows, totalDurationRange, warnings, checksum, version } |
| 33.02 | SetlistExportCreate { setlistVersionId, format print_pdf/html_device, recipientPolicy, locale, includeTimingWarnings true } | SetlistExportV1 { exportId, sourceVersion, state queued/ready, artifactRef nullable, renderHash, accessibilityReportRef nullable } |
| 33.03 | ShowFilePackageCreate { setlistVersionId, orderedFiles 1–500 with rowId/assetUploadId/purpose/playbackOrder/expectedSha256, packageLabel, designateCurrent boolean } | ShowFilePackageV1 { packageId, version, manifest, archiveSha256, state current/superseded/quarantined, artifactRef } |
| 33.04 | PerformedSetCreate { plannedSetlistVersionId nullable, actualRows 1–300 with ordinal/song/work/local refs/startedAt/endedAt/occurrenceAttestation/contentAttestation, personnelRefs, capturedAt, captureSource } | PerformedSetV1 { performedSetId, version, actualRows, planDeltas, personnel, attestationStates, state recorded } |

### Exact typed success schemas

Operation comments map routes to strict Zod 4 success bodies. File references are opaque storage IDs; bytes and signed URLs never appear here.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Instant = z.iso.datetime({ offset: true });
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const SetlistRow = z.object({
  stableRowId: Uuid, orderKey: z.string().min(1).max(64), songRef: Uuid.nullable(), workRef: Uuid.nullable(),
  localTitle: z.string().min(1).max(300), structure: z.string().max(2000).nullable(),
  durationLowSec: z.int().min(0).max(86_400), durationHighSec: z.int().min(0).max(86_400), transitionNote: z.string().max(2000).nullable(),
}).strict();
// 33.01
export const SetlistVersionV1 = z.object({
  setlistId: Uuid, versionId: Uuid, parent: Uuid.nullable(), rows: z.array(SetlistRow).min(1).max(200),
  totalDurationRange: z.object({ lowSec: z.int().min(0), highSec: z.int().min(0) }).strict(),
  warnings: z.array(z.object({ code: z.string().regex(/^[a-z0-9_]{1,64}$/), rowIds: z.array(Uuid).max(200) }).strict()).max(200),
  checksum: Digest, version: Version,
}).strict();
// 33.02
export const SetlistExportV1 = z.object({
  exportId: Uuid, sourceVersion: Version, state: z.enum(["queued", "ready"]), artifactRef: Uuid.nullable(),
  renderHash: Digest, accessibilityReportRef: Uuid.nullable(),
}).strict();
const FileManifestItem = z.object({ rowId: Uuid, assetUploadId: Uuid, purpose: z.enum(["playback", "click", "stem", "reference"]), playbackOrder: z.int().min(1).max(500), sha256: Digest }).strict();
// 33.03
export const ShowFilePackageV1 = z.object({
  packageId: Uuid, version: Version, manifest: z.array(FileManifestItem).min(1).max(500), archiveSha256: Digest,
  state: z.enum(["current", "superseded", "quarantined"]), artifactRef: Uuid,
}).strict();
const ActualRow = z.object({
  ordinal: z.int().min(1).max(300), songRef: Uuid.nullable(), workRef: Uuid.nullable(), localRef: Uuid.nullable(),
  startedAt: Instant, endedAt: Instant, occurrenceAttestation: z.enum(["observed", "party_asserted"]),
  contentAttestation: z.enum(["confirmed", "unknown", "disputed"]),
}).strict();
// 33.04
export const PerformedSetV1 = z.object({
  performedSetId: Uuid, version: Version, actualRows: z.array(ActualRow).min(1).max(300),
  planDeltas: z.array(z.object({ plannedRowId: Uuid.nullable(), actualOrdinal: z.int().positive().nullable(), kind: z.enum(["added", "omitted", "reordered", "timing_changed"]) }).strict()).max(500),
  personnel: z.array(Uuid).max(200),
  attestationStates: z.object({ occurrence: z.enum(["complete", "partial"]), content: z.enum(["confirmed", "mixed", "unknown"]), capturedAt: Instant }).strict(),
  state: z.literal("recorded"),
}).strict();
~~~

- Setlist rows use stable IDs; concurrent disjoint edits may merge, same row/order conflicts require explicit resolution. Durations are ranges with low ≤ high; missing work/timing refs remain warnings.
- Export is print-first with tagged headings/table order, readable contrast and device secondary view. Warnings remain in every format.
- Package file hashes are verified from scanned uploads. Every manifest row binds order/purpose/asset/hash. designateCurrent occurs only after every checksum passes; prior package becomes superseded, never deleted.
- Performed rows are independent of plan and require occurrence/content attestations. Unknown work/content stays unknown; personnel is actual, not copied silently.

## Database Schema

| Model | Typed fields, constraints, indexes | RLS/grants |
|---|---|---|
| SetlistVersion | id uuid; setlist_id; event_id; act_id; parent_version_id nullable; version; rows_json validated; duration_low/high; warnings; checksum; created_by/at | unique setlist,version/checksum; order-key uniqueness; indexes event,act/version; append-only; act/TM and narrowed stage recipients |
| show_setlist_export | id uuid; event_id; setlist_version_id; owner_id; recipient_policy; format; locale; render_hash; artifact/accessibility refs nullable; state; expires_at nullable | unique source/recipient/policy/format/hash; owner/recipient and renderer |
| ShowFilePackage | id uuid; event_id; setlist_version_id; version; manifest_json; archive_sha256; artifact_ref; state current/superseded/quarantined; designated_at nullable; created_by/at | unique event,version/archive hash; one current event/date partial; index state; act/file workers |
| show_file_entry | id uuid; package_id; ordinal; row_id; asset_ref; purpose; expected/observed sha256; scan_receipt; state verified/quarantined | unique package,ordinal and package,asset/purpose; worker scoped |
| PerformedSet | id uuid; event_id; planned_version_id nullable; version; actual_rows; plan_deltas; personnel_refs; capture_source; captured_at; checksum; created_by | unique event,capture source/checksum; indexes event/version; append-only; act/TM/event participants narrowed |

All tables enable RLS and deny PUBLIC/anon. Assets/artifacts are immutable BE00 Storage refs with scan receipts and short signed access. Histories append; current pointers change by constrained RPC.

### D4 Persistence and Query-Plan Closure

Every field below is normative SQL and `NOT NULL` unless explicitly marked `NULL`. UUIDs are non-nil, checks mirror the strict request contracts, local FKs use `ON DELETE RESTRICT`, and revision-pinned cross-shard IDs are validated through owner seams.

| Table | Exact SQL field types and constraints | Relationships and query-pattern indexes | RLS and grants |
|---|---|---|---|
| `setlist_versions` (SetlistVersion) | `id uuid PRIMARY KEY`; `setlist_id uuid NOT NULL`; `event_id uuid NOT NULL`; `act_id uuid NOT NULL`; `parent_version_id uuid NULL`; `version bigint NOT NULL CHECK (version>0)`; `rows_json jsonb NOT NULL CHECK (jsonb_typeof(rows_json)='array' AND jsonb_array_length(rows_json) BETWEEN 1 AND 200)`; `duration_low integer NOT NULL CHECK (duration_low>=0)`; `duration_high integer NOT NULL CHECK (duration_high>=duration_low)`; `warnings jsonb NOT NULL CHECK (jsonb_typeof(warnings)='array')`; `checksum bytea NOT NULL CHECK (octet_length(checksum)=32)`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL` | Self-FK `parent_version_id -> setlist_versions.id`; event/act are ProductionEvent/bill relationships. `UNIQUE(setlist_id,version)`, `UNIQUE(setlist_id,checksum)`; normalized-row constraint enforces stable row/order uniqueness; `INDEX(event_id,act_id,version DESC)` | FORCE RLS. Act/TM editors insert/select; stage recipients use narrowed projection; append-only trigger denies UPDATE/DELETE. |
| `show_setlist_exports` (show_setlist_export) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `setlist_version_id uuid NOT NULL`; `owner_id uuid NOT NULL`; `recipient_policy text NOT NULL CHECK (length(recipient_policy) BETWEEN 1 AND 120)`; `format text NOT NULL CHECK (format IN ('print_pdf','html_device'))`; `locale text NOT NULL CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')`; `render_hash bytea NOT NULL CHECK (octet_length(render_hash)=32)`; `artifact_ref text NULL`; `accessibility_ref text NULL`; `state text NOT NULL CHECK (state IN ('queued','ready','failed','expired'))`; `expires_at timestamptz NULL` | FK `setlist_version_id -> setlist_versions.id`; event/owner are external relationships; artifacts are BE00 Storage receipts. `UNIQUE(setlist_version_id,owner_id,recipient_policy,format,render_hash)`; `INDEX(owner_id,state,expires_at)`; partial `INDEX(expires_at) WHERE state='ready'` | FORCE RLS. Owner/recipient select; renderer has leased SELECT/transition; token gateway has no base-table browse; PUBLIC denied. |
| `show_file_packages` (ShowFilePackage) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `setlist_version_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version>0)`; `manifest_json jsonb NOT NULL CHECK (jsonb_typeof(manifest_json)='array')`; `archive_sha256 bytea NOT NULL CHECK (octet_length(archive_sha256)=32)`; `artifact_ref text NOT NULL`; `state text NOT NULL CHECK (state IN ('current','superseded','quarantined'))`; `designated_at timestamptz NULL`; `created_by uuid NOT NULL`; `created_at timestamptz NOT NULL` | FK `setlist_version_id -> setlist_versions.id`; event/artifact are external relationships. `UNIQUE(event_id,version)`, `UNIQUE(event_id,archive_sha256)`; partial `UNIQUE(event_id) WHERE state='current'`; `INDEX(event_id,state,version DESC)` | FORCE RLS. Act/file workers select authorized package; uploader creates quarantined rows; designation RPC alone transitions state; no request DELETE. |
| `show_file_entries` (show_file_entry) | `id uuid PRIMARY KEY`; `package_id uuid NOT NULL`; `ordinal integer NOT NULL CHECK (ordinal BETWEEN 0 AND 499)`; `row_id uuid NOT NULL`; `asset_ref text NOT NULL`; `purpose text NOT NULL CHECK (length(purpose) BETWEEN 1 AND 80)`; `expected_sha256 bytea NOT NULL CHECK (octet_length(expected_sha256)=32)`; `observed_sha256 bytea NOT NULL CHECK (octet_length(observed_sha256)=32)`; `scan_receipt text NOT NULL`; `state text NOT NULL CHECK (state IN ('verified','quarantined'))` | FK `package_id -> show_file_packages.id`; asset/scan receipt are BE00 Storage relationships. `UNIQUE(package_id,ordinal)`, `UNIQUE(package_id,asset_ref,purpose)`; `INDEX(package_id,state,ordinal)`; `INDEX(row_id)` | FORCE RLS. Inherits package visibility; malware/hash worker inserts/transitions; browser receives signed artifacts, never base rows. |
| `performed_sets` (PerformedSet) | `id uuid PRIMARY KEY`; `event_id uuid NOT NULL`; `planned_version_id uuid NULL`; `version bigint NOT NULL CHECK (version>0)`; `actual_rows jsonb NOT NULL CHECK (jsonb_typeof(actual_rows)='array' AND jsonb_array_length(actual_rows) BETWEEN 1 AND 300)`; `plan_deltas jsonb NOT NULL CHECK (jsonb_typeof(plan_deltas)='array')`; `personnel_refs uuid[] NOT NULL DEFAULT '{}'`; `capture_source text NOT NULL CHECK (length(capture_source) BETWEEN 1 AND 120)`; `captured_at timestamptz NOT NULL`; `checksum bytea NOT NULL CHECK (octet_length(checksum)=32)`; `created_by uuid NOT NULL` | FK `planned_version_id -> setlist_versions.id`; event/personnel are source relationships. `UNIQUE(event_id,capture_source,checksum)`; `UNIQUE(event_id,version)`; `INDEX(event_id,version DESC)`; GIN `(actual_rows jsonb_path_ops)` | FORCE RLS. Act/TM/event participants select narrowed facts; authorized recorder inserts; histories are append-only and unrelated participants are concealed. |

Migration tests assert all checks, local/external relationship validators, partial indexes, forced RLS, grants, immutable histories, and signed-artifact expiry plans.

## State, Transactions and Recovery

- Setlist/performed set are immutable version chains.
- Package: validating → current/quarantined; current → superseded.
- Export: queued → rendering → ready/failed/expired.
- 33.01 commits version/current pointer and showday.setlist.versioned outbox atomically.
- 33.03 verifies files before a serializable current designation; mismatch leaves prior package current.
- 33.04 commits performed record and showday.performed_set.recorded atomically. Missing capture has no row.
- Render/storage queues retry 1s/5s/30s/2m and poison after eight; prior ready export/package persists.

## Middleware, Security and Observability

Order: request ID → CORS → auth → CSRF → strict size/Zod → rate → event/act/recipient RLS → idempotency/If-Match → work/timing/asset/attestation policy → transaction → response schema → redacted audit. Logs include IDs, versions, row/file counts, hashes, warning/attestation classes and duration; exclude file bodies, notes, personnel details and signed URLs.

## Events and Integrations

| Event/seam | Contract and delivery |
|---|---|
| showday.setlist.versioned | setlist/version, date/tour, duration range, checksum; at-least-once, version dedupe |
| showday.performed_set.recorded | event/plan, actual row refs, personnel count, attestation states; performed-version dedupe |
| work/catalog source | work/song ref/version → safe identity; 2s, 2 retries 100ms/500ms, circuit 5 failures/30s 30s; warning/unknown |
| storage/scanner/renderer | upload/snapshot → verified asset/archive/PDF; 15–30s, 2 retries 1s/5s, circuit 5 failures/min 2m; prior current persists |

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 33.01 | 400 SETLIST_INVALID/DURATION_INVALID; 403 ACT_AUTHORITY_REQUIRED; 409 ROW_OR_ORDER_CONFLICT; 412 REVISION_MISMATCH; 422 WORK_REF_UNRESOLVED |
| 33.02 | 400 EXPORT_POLICY_INVALID; 403 RECIPIENT_SCOPE_REQUIRED; 409 SOURCE_VERSION_CONFLICT; 422 ACCESSIBILITY_GATE_FAILED; 503 RENDER_UNAVAILABLE |
| 33.03 | 400 MANIFEST_INVALID; 403 FILE_AUTHORITY_REQUIRED/STEP_UP_REQUIRED; 409 PACKAGE_VERSION_CONFLICT; 422 CHECKSUM_MISMATCH/ASSET_QUARANTINED; 503 STORAGE_UNAVAILABLE |
| 33.04 | 400 PERFORMED_SET_INVALID; 403 CAPTURE_AUTHORITY_REQUIRED; 409 CAPTURE_CONFLICT; 422 EVENT_NOT_OCCURRED/ATTESTATION_REQUIRED |

Unknown errors map 500 INTERNAL_ERROR, deadlines 503 DEPENDENCY_TIMEOUT and rates 429 RATE_LIMITED; hidden IDs are 404.

## Verification and Test Strategy

| ID | Tests |
|---|---|
| 33.01 | stable row/order merge, conflict, duration range, missing refs warnings and append-only parent |
| 33.02 | exact version/recipient, accessible print/device, warning preservation and render failure |
| 33.03 | ordered manifest/hash/scan, mismatch blocks current, supersession and signed access |
| 33.04 | separate actual order/deltas/personnel/attestations, replay, and absent capture remains unconfirmed plan |

RLS/grant tests cover act, TM, stage recipient, unrelated act, file/renderer workers. Transaction tests prove current-pointer/outbox atomicity and no partial package designation.

## Deepening Passes

- Micro: rows/order, duration uncertainty, render warnings, file hashes/current state and performed attestations are explicit.
- Macro: catalog/production plan remain sources; show-day stores immutable planned/export/package/actual facts.
- Devil's advocate: no implementation may infer performed from planned, hide warnings, designate a bad package, overwrite versions or leak files/personnel.
- Two-implementer and ambiguity gates: PASS; no open decision.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 33.01 | `be_http_requests_total{operation_id="33.01",outcome,code}`, `be_http_latency_seconds{operation_id="33.01"}`, and `be_operation_recovery_total{operation_id="33.01",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.02 | `be_http_requests_total{operation_id="33.02",outcome,code}`, `be_http_latency_seconds{operation_id="33.02"}`, and `be_operation_recovery_total{operation_id="33.02",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.03 | `be_http_requests_total{operation_id="33.03",outcome,code}`, `be_http_latency_seconds{operation_id="33.03"}`, and `be_operation_recovery_total{operation_id="33.03",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 33.04 | `be_http_requests_total{operation_id="33.04",outcome,code}`, `be_http_latency_seconds{operation_id="33.04"}`, and `be_operation_recovery_total{operation_id="33.04",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 33a production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 33](../ia/33-show-day-operations.md)
- Shard32 production planning and work/catalog source seams.
