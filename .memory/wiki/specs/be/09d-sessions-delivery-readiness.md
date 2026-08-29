# BE-09d — Sessions, recall, delivery and readiness

## Split Group

This companion owns first-class sessions and attendance assertions, close/capture arbitration, revision agreements and rounds, labelled environment archives and recall sheets, filtered Operator recall projections, recipient specifications, handoff packages, objective QC and target-specific readiness. It does not own party identity, role taxonomy, credits, rights, audio bytes/lineage, project containers, review comments, release-local distribution or local DAW bridge activation. The authoritative source is [IA Shard 09 — Music projects and collaboration](../ia/09-projects-collaboration.md).

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Boundary | Session, capture, delivery and readiness commands/queries | IA scope lines 9–24; Contracts lines 144–172. |
| Operations | Seven routes for `PRJ-15`, `PRJ-16`, `PRJ-17`, `PRJ-18`, `PRJ-21`, `PRJ-23`, `PRJ-24` | IA interaction rows 92–95 and 98–101. |
| Data | Fourteen canonical models for sessions, asks, rounds, sheets, filtered grants, packages, QC and readiness | IA Data Models rows 195–205 and typed registry lines 243–258. |
| Capture | Close commits before asks dispatch; Tier 1 is independent and non-blocking, Tier 2 has one Producer ask | IA PRJ-15/16 lines 92–93; deep-dive Session and Capture Arbitration lines 120–129. |
| Delivery | Target-specific owned recipient spec, exact canonical pins, integrity-blocking package and live ordered debt | IA PRJ-17/18 lines 94–95; Delivery algorithm lines 131–140. |
| Recall privacy | Operator receives only filtered analogue gear/signal-path/patch/room projection for one exact sheet version | IA PRJ-23/24 lines 100–101; Edge Cases lines 351–353. |
| Explicit exclusions | No DAW parsing, environment verification, public remix program, format-specific master logic, arbitrary stages or submission claim | IA Delivery Phases lines 40–44; feature ledger Won't rows 704–706. |

## Referenced Material Inventory

| Source file | Section and lines | Material used | Trace |
|---|---|---|---|
| [IA parent](../ia/09-projects-collaboration.md) | Overview/Scope Reconciliation and Delivery Phases, lines 1–44 | Session, package, bridge and launch boundaries | IA-09D-SCOPE |
| [IA parent](../ia/09-projects-collaboration.md) | PRJ-15 through PRJ-18, PRJ-21, PRJ-23 and PRJ-24, lines 92–101 | Preconditions, completion and failure/recovery | IA-09D-INT |
| [IA parent](../ia/09-projects-collaboration.md) | Contracts, lines 144–172 | Sessions, rounds, recall, packages, QC, readiness and bridge exclusions | IA-09D-CONTRACT |
| [IA parent](../ia/09-projects-collaboration.md) | Data Models and Typed Field Registry, lines 174–205, 243–258 | Exact model identifiers, nullable fields and row discriminants | IA-09D-DATA |
| [IA parent](../ia/09-projects-collaboration.md) | Access Control and Accessibility, lines 264–299 | Session roles, Operator projection policy, semantic debt and package gaps | IA-09D-ACCESS |
| [IA parent](../ia/09-projects-collaboration.md) | Event Schemas, lines 301–319 | Session close, package and recall grant events | IA-09D-EVENT |
| [IA parent](../ia/09-projects-collaboration.md) | Edge Cases and Coverage Matrix, lines 321–387 | Reopen, asks, package staleness, recall privacy, exhaustion and disputes | IA-09D-EDGE |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Versions, Review and Sessions fields, lines 35–52 | Session, capture and sheet model fields | DD09D-FIELDS |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Session and Capture Arbitration, lines 120–129 | Close ordering, ten-minute batching, reopen and tier budgets | DD09D-CAPTURE |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Delivery, QC and Readiness algorithm, lines 131–140 | Owned target, exact pins, QC and opaque dependency behavior | DD09D-DELIVERY |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Abuse and Recovery Verification, lines 155–169 | Operator least disclosure, package quarantine and recovery | DD09D-RECOVERY |
| [Feature ledger](../feature-ledger.md) | rows 66, 68–69, 270–271, 273, 531–537, 704–706 | Assigned session, round, recall, delivery, QC, readiness and excluded capabilities | FL-09D |
| [BE00](00-infrastructure.md) | Shared request, idempotency, storage, signed grant, outbox, audit and cache contracts | Inherited platform behavior | BE00-INHERIT |

## IA Source Map

### Interaction map

| IA interaction | IA lines | Backend operation | Owned result |
|---|---:|---|---|
| `PRJ-15` Create/close session | 92 | `PRJ-15` `POST /api/v1/sessions` | Session state/version and close event |
| `PRJ-16` Complete close prompt | 93 | `PRJ-16` `POST /api/v1/sessions/{sessionId}/capture-answers` | Stable ask/answer and completeness debt |
| `PRJ-17` Build handoff package | 94 | `PRJ-17` `POST /api/v1/songs/{songId}/handoff-packages` | Immutable pinned package and validation report |
| `PRJ-18` Run QC/readiness | 95 | `PRJ-18` `POST /api/v1/songs/{songId}/readiness-evaluations` | Target-specific QC/readiness projection |
| `PRJ-21` Open/close revision round | 98 | `PRJ-21` `POST /api/v1/songs/{songId}/revision-rounds` | Round state, contents manifest and count |
| `PRJ-23` Author recall sheet | 100 | `PRJ-23` `POST /api/v1/sessions/{sessionId}/recall-sheets` | Combined sheet version and typed rows |
| `PRJ-24` Grant/revoke Operator recall projection | 101 | `PRJ-24` `POST /api/v1/sessions/{sessionId}/recall-projection-grants` | Expiring recipient grant and filtered projection policy |

### Model map

| IA first-column identifier | IA line | Ownership in this companion |
|---|---:|---|
| `revision_agreement` | 195 | Song-scoped gate and nullable `engagement_ref` pointer |
| `revision_round` | 195 | Producer-writable/contributor-readable round state and manifest |
| `session` | 197 | First-class session owner, source, grade, sensitivity and lifecycle |
| `attendance_assertion` | 197 | Human asserted set-valued attendance |
| `capture_moment` | 198 | Close/batch/tier dispatch state |
| `capture_ask` | 198 | Stable ask/answer/debt payload and owner |
| `environment_archive` | 199 | Labelled archive/manifest availability |
| `recall_sheet_version` | 199 | Combined paper/derived/template sheet version |
| `recall_sheet_row` | 199 | Typed derived or analogue row union |
| `recall_projection_grant` | 200 | Exact sheet/verified Operator grant and revocation |
| `recipient_spec_version` | 201 | Platform-owned target requirements and checks |
| `handoff_package` | 201 | Exact canonical pins, manifest and artifact state |
| `qc_result` | 202 | Objective check result and dismissal |
| `readiness_projection` | 202 | Derived target-specific ordered gaps |

### Event map

| IA event type | IA line | Producer/consumer treatment |
|---|---:|---|
| `project.session.closed.v1` | 312 | Published only after session close commits; Shard 07 and Shard 10 consume |
| `project.package.generated.v1` | 314 | Published after package manifest/artifact seals |
| `project.recall-projection-access.changed.v1` | 317 | Published after grant create/renew/revoke; no projected content |
| `project.approval.recorded.v1` | 313 | Consumed to re-evaluate readiness; approval owner is 09c |
| `project.canonical.changed.v1` | 310 | Consumed to invalidate package/readiness pins |
| `project.access.changed.v1` | 307 | Consumed to revoke package/recall projections |
| `project.source-declaration.changed.v1` | 315 | Consumed as target-specific clearance/readiness input |
| `project.bridge.state-changed.v1` | 316 | Consumed only for disabled bridge diagnostics |

Events exclude attendance names, capture answers, paper photographs, derived rows, songs, creative text, asset bytes, hidden gaps and unrestricted PII.

## Feature Ledger Coverage

| Ledger ID | Capability | Ledger line | Backend treatment |
|---|---|---:|---|
| `07.05.05` | Revision Round Counting & Scope Enforcement | 531 | `PRJ-21`; Producer-authored count/scope, advisory and disputable through Shard 06 |
| `07.06.01` | Session Record & Attendance | 68 | `PRJ-15`; human attendance assertions, no auto-presence |
| `07.06.02` | Session Close & Capture Prompt | 69 | `PRJ-15`, `PRJ-16`; close-before-dispatch and tier budgets |
| `07.06.03` | Session Snapshot, Archival & Environment Manifest | 532 | `PRJ-15`, `PRJ-23`; labelled manifest only, no DAW parse |
| `07.06.04` | Track Sheet, Channel Map & Recall Sheet | 533 | `PRJ-23`, `PRJ-24`; combined sheet and filtered Operator view |
| `07.07.02` | Alternate Version Matrix | 535 | `PRJ-17`; purpose-labelled/parallel pins only |
| `07.07.03` | Mastering Workflow & DSP Loudness Targets | 536 | `PRJ-17`, `PRJ-18`; objective measurements and warnings |
| `07.07.04` | Format-Specific Masters | 704 | Explicitly Won't; no format-specific product logic |
| `07.07.05` | Immersive / Dolby Atmos Deliverables | 705 | Explicitly Won't; no Atmos product surface |
| `07.08.01` | Handoff Package Builder & Recipient-Spec Validation | 270 | `PRJ-17`; owned spec and exact pins |
| `07.08.02` | Automated Audio QC & Technical Spec Validation | 537 | `PRJ-18`; narrow objective checks only |
| `07.08.03` | Song Metadata Completeness & Readiness Score | 271 | `PRJ-18`; ordered debt, no global score |
| `07.08.05` | Remix Stems Delivery & Remix Programs | 706 | Explicitly Won't; no public remix program |

## Endpoint Completeness Reconciliation

| IA interaction | Route | Request | Success | Errors and recovery | Event/audit |
|---|---|---|---|---|---|
| `PRJ-15` | `POST /api/v1/sessions` | `SessionCommandRequest` | `SessionResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | `project.session.closed.v1` on close, audit |
| `PRJ-16` | `POST /api/v1/sessions/{sessionId}/capture-answers` | `CaptureAnswerRequest` | `CaptureAnswerResponse` | `VALIDATION_FAILED`, `FORBIDDEN`; silence is not an error | `project.session.closed.v1` consumed, debt audit |
| `PRJ-17` | `POST /api/v1/songs/{songId}/handoff-packages` | `BuildPackageRequest` | `HandoffPackageResponse` | `CANONICAL_UNSET`, `INTEGRITY_FAILED`, `SOURCE_STALE`, `FORBIDDEN` | `project.package.generated.v1`, audit |
| `PRJ-18` | `POST /api/v1/songs/{songId}/readiness-evaluations` | `ReadinessRequest` | `ReadinessResponse` | `FORBIDDEN`, `ASSET_NOT_FOUND`; unverifiable is a result | QC/readiness audit only |
| `PRJ-21` | `POST /api/v1/songs/{songId}/revision-rounds` | `RevisionRoundRequest` | `RevisionRoundResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | `project.song.changed.v1`, audit |
| `PRJ-23` | `POST /api/v1/sessions/{sessionId}/recall-sheets` | `RecallSheetRequest` | `RecallSheetResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | `project.song.changed.v1`, audit |
| `PRJ-24` | `POST /api/v1/sessions/{sessionId}/recall-projection-grants` | `RecallProjectionGrantRequest` | `RecallProjectionGrantResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `ACCESS_REVOKED` | `project.recall-projection-access.changed.v1`, audit |

## Shared Contract Inheritance

BE00 supplies request IDs, actor context, `ApiError { code, message, requestId, details }`, idempotency fingerprints, storage quarantine, signed URLs, cache purge, audit hashes, transactional outbox and offline replay. BE01 supplies session-owner/party authority. BE07 supplies role and credit-capture boundaries; this companion emits the close fact but never edits credit or split truth. Shard 10 receives the close event for split capture. Shard 23 owns gear identity; the Operator projection accepts only sheet-local line references. Shard 22/other delivery consumers receive package hashes and opaque pins, never direct tables.

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA interaction | Method and path | Request → success | Auth / ownership / 403 versus 404 | Middleware incl. CORS | Idempotency / concurrency | Rate / timeout / cache / SLO | Error envelope | Event |
|---|---|---|---|---|---|---|---|---|---|
| `PRJ-15` | `PRJ-15` | `POST /api/v1/sessions` | `SessionCommandRequest` → `SessionResponse` | Creating context resolves exactly one owner; close/reopen requires session owner or Producer; hidden session 404, known unauthorized 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(actor, idempotency_key, session_id?)`; session state CAS; ten-minute close batch | 30 requests/minute/party; 900 ms deadline; private session cache purge; p95 ≤ 450 ms | `ApiError { code, message, requestId, details }` | `project.session.closed.v1` on close |
| `PRJ-16` | `PRJ-16` | `POST /api/v1/sessions/{sessionId}/capture-answers` | `CaptureAnswerRequest` → `CaptureAnswerResponse` | Actor may answer only own dispatched ask; hidden session/ask 404, known other-party ask 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(ask_id, actor, idempotency_key)` unique; stable ask state CAS; silence/dismissal creates debt only | 60 requests/minute/identity; 700 ms deadline; no answer-body cache; p95 ≤ 350 ms | `ApiError { code, message, requestId, details }` | Debt/audit only |
| `PRJ-17` | `PRJ-17` | `POST /api/v1/songs/{songId}/handoff-packages` | `BuildPackageRequest` → `HandoffPackageResponse` | Song/project package authority and owned recipient spec; hidden song/spec 404, known unauthorized 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → canonicalResolve → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, spec_version_id, idempotency_key)` unique; pinned manifest and source-version CAS | 10 requests/minute/party; 2,000 ms deadline; artifact cache private; p95 ≤ 1,200 ms after queue acceptance | `ApiError { code, message, requestId, details }` | `project.package.generated.v1` |
| `PRJ-18` | `PRJ-18` | `POST /api/v1/songs/{songId}/readiness-evaluations` | `ReadinessRequest` → `ReadinessResponse` | Actor may read song/package and selected owned target; hidden song 404, known unauthorized 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → projectionRead`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, target_spec_version_id, source_hash, idempotency_key)`; projection generation is read-only | 60 requests/minute/party; 1,500 ms deadline; readiness TTL 60 s; p95 ≤ 700 ms | `ApiError { code, message, requestId, details }` | Audit only |
| `PRJ-21` | `PRJ-21` | `POST /api/v1/songs/{songId}/revision-rounds` | `RevisionRoundRequest` → `RevisionRoundResponse` | Producer role writes; contributor reads through separate projection; hidden song 404, known non-Producer 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, idempotency_key)` unique; round state/count CAS; batching window 10 minutes | 30 requests/minute/party; 900 ms deadline; private round cache purge; p95 ≤ 450 ms | `ApiError { code, message, requestId, details }` | `project.song.changed.v1` |
| `PRJ-23` | `PRJ-23` | `POST /api/v1/sessions/{sessionId}/recall-sheets` | `RecallSheetRequest` → `RecallSheetResponse` | Actor reaches inherited session sensitivity; hidden session/sheet 404, known insufficient role 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(session_id, idempotency_key)` unique; sheet version CAS; template copy reads source only | 20 requests/minute/party; 1,200 ms deadline; sheet projection purge; p95 ≤ 650 ms | `ApiError { code, message, requestId, details }` | `project.song.changed.v1` |
| `PRJ-24` | `PRJ-24` | `POST /api/v1/sessions/{sessionId}/recall-projection-grants` | `RecallProjectionGrantRequest` → `RecallProjectionGrantResponse` | Producer/session owner with `session:share_recall_projection`; verified Operator recipient; hidden session/sheet 404, known unauthorized 403 | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → idempotency → signedGrant → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(sheet_version_id, recipient_party_id, idempotency_key)` unique; one active grant CAS; revoke epoch invalidates reads | 20 requests/minute/party; 700 ms deadline; grant TTL ≤ 24 h; p95 ≤ 350 ms | `ApiError { code, message, requestId, details }` | `project.recall-projection-access.changed.v1` |

### Registry invariants

1. Every route validates strict UUIDs, state/action discriminants and expected versions before resource-dependent detail. Hidden resources return 404; known resources without capability return 403 after tenant-safe existence resolution.
2. Every failure is `ApiError { code, message, requestId, details }`; details contain safe field paths, target hashes or required action, never attendance names, paper images, creative text, hidden gap fields, channel names or signed locators.
3. Session close commits before dispatching capture asks. A close dispatch failure cannot reopen the session or roll back the close; a reopen within six hours re-arms the moment without recalling dispatched asks.
4. Packages resolve canonical IDs once, pin exact versions and recipient spec, validate integrity, quarantine partial artifacts and emit only after the manifest seals. Readiness is target-specific and never a global score.
5. A recall sheet is valid with a readable paper photograph or at least one typed row. Operator projection includes only analogue microphone, signal-path, patch and room rows with sheet-local references; photograph, derived rows, track/channel names, songs, creative content, attendance and prompts are excluded.
6. Revision rounds are off without an accepted `revision_agreement`; Producer authors count and scope with a reason. Exhaustion informs both parties and never blocks or bills. The unresolved `engagement_ref` remains a nullable pointer and has no second writer.

### Pagination and response bounds

Collection behavior is explicit outside the operation matrices. Commands return one bounded object; no cursor is accepted. `limit` bounds batch members before persistence and protects session, recall, and package projections from unbounded work.

| Operation ID | Pagination and cursor | Limit and rationale |
|---|---|---|
| `PRJ-15` | Pagination: N/A; cursor: N/A | One session; request body limit 32 KiB. |
| `PRJ-16` | Pagination: N/A; cursor: N/A | Capture-answer batch limit 20 answers; request body limit 64 KiB. |
| `PRJ-17` | Pagination: N/A; cursor: N/A | One handoff package; manifest item limit 500 and request body limit 128 KiB. |
| `PRJ-18` | Pagination: N/A; cursor: N/A | One readiness projection; gap list limit 100 and request body limit 32 KiB. |
| `PRJ-21` | Pagination: N/A; cursor: N/A | One revision round; included-item limit 100 and request body limit 32 KiB. |
| `PRJ-23` | Pagination: N/A; cursor: N/A | One recall-sheet version; row limit 200 and request body limit 128 KiB. |
| `PRJ-24` | Pagination: N/A; cursor: N/A | One projection grant; request body limit 16 KiB. |

### Operation contract and error matrix

| Operation ID | Request and validation | Success | Declared errors | Recovery |
|---|---|---|---|---|
| `PRJ-15` | Create/close/reopen action, owner/source, grade, attendance and expected session version; reopen ≤ six hours | Session state/version and close batch ID | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry after re-reading the session with the expected version; close stays committed even when asks fail |
| `PRJ-16` | Stable ask ID, answer payload, actor and expected ask version; payload must match ask schema | Answer ID, state and debt ID when unanswered/dismissed | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry the corrected answer under the same ask/version; silence/dismissal is persisted debt |
| `PRJ-17` | Owned recipient spec, exact required canonical slots, source versions and expected package version | Immutable manifest, artifact and validation report | `CANONICAL_UNSET`, `INTEGRITY_FAILED`, `SOURCE_STALE`, `FORBIDDEN`, `IDEMPOTENCY_MISMATCH` | Quarantine unsealed artifact; retry by re-resolving and rebuilding from new pins |
| `PRJ-18` | Owned target spec, readable sources and optional dismissals keyed by check version | Ordered gaps with `passed`, `warning`, `unverifiable` or `opaque_dependency` | `FORBIDDEN`, `ASSET_NOT_FOUND`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry recomputation after access/source change; unsupported check remains unverifiable |
| `PRJ-21` | Open/close action, accepted triage batch, delivered version, expected round version and Producer scope reason | Round state/count/manifest and both-party view | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry after re-reading the round; dispute routes to Shard 06 with manifest |
| `PRJ-23` | Paper asset or typed rows, row discriminants, optional template/snapshot refs and expected sheet version | Immutable sheet version and attributed rows | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry against the current sheet version; photograph-only remains valid and failed template copy mutates nothing |
| `PRJ-24` | Create/renew/revoke, exact sheet, verified Operator recipient, expiry and expected grant version | Grant/policy hash or revocation status | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `ACCESS_REVOKED`, `IDEMPOTENCY_MISMATCH` | Retry renewal/revocation with the current grant version; revoke epoch kills new reads and a successor sheet needs a new grant |

### Route field validation matrix

| Operation ID | Path and body fields | Limits and invariants | Rejection |
|---|---|---|---|
| `PRJ-15` | `action`, `session_id?`, `source_kind/ref?`, `grade`, `owner_party_id?`, `attendance`, `expected_version?` | Exactly one owner; human attendance; reopen only ≤ six hours; action close only active | `VALIDATION_FAILED` |
| `PRJ-16` | `sessionId`, `ask_id`, `answer_kind`, `payload`, `dismissed`, `expected_ask_version` | Stable ask ID; payload matches tier schema; payload ≤ 64 KiB; dismissal has reason | `VALIDATION_FAILED` |
| `PRJ-17` | `songId`, `recipient_spec_version_id`, `canonical_slots`, `expected_package_version` | Owned spec; exact required slots; no oversend; ≤ 1,000 manifest entries | `CANONICAL_UNSET`, `VALIDATION_FAILED` |
| `PRJ-18` | `songId`, target spec, source refs, check keys, dismissal versions | Target-specific; inaccessible dependency opaque; unsupported check cannot pass | `VALIDATION_FAILED`, `ASSET_NOT_FOUND` |
| `PRJ-21` | `songId`, `action`, `triage_batch_id?`, `delivered_version_id?`, `scope_verdict?`, `reason`, `expected_round_version` | `revision_agreement` required; count advisory; scope reason required; no billing | `VALIDATION_FAILED` |
| `PRJ-23` | `sessionId`, `paper_asset_ref?`, `derived_snapshot_ref?`, `template_sheet_version_id?`, `rows`, `expected_sheet_version` | Paper or ≥1 typed row; row discriminant/payload agreement; ≤ 5,000 rows; no OCR claim | `VALIDATION_FAILED` |
| `PRJ-24` | `sessionId`, `sheet_version_id`, `action`, `recipient_party_id`, `expires_at`, `projection_policy_hash`, `expected_grant_version` | Verified Operator; expiry 5 minutes–24 hours; exact sheet/session; revoke reason required | `VALIDATION_FAILED`, `ACCESS_REVOKED` |

## Request/Response Contracts (Zod 4 schemas)

```ts
import { z } from "zod";

const UUID = z.string().uuid();
const Version = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const Key = z.string().trim().min(16).max(128);
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const ApiError = z.object({
  code: z.enum([
    "VALIDATION_FAILED", "FORBIDDEN", "RESOURCE_NOT_FOUND", "VERSION_CONFLICT",
    "IDEMPOTENCY_MISMATCH", "CANONICAL_UNSET", "INTEGRITY_FAILED", "SOURCE_STALE",
    "ASSET_NOT_FOUND", "ACCESS_REVOKED", "DEPENDENCY_UNAVAILABLE"
  ]),
  message: z.string().trim().min(1).max(240),
  requestId: UUID,
  details: z.record(z.string(), z.json())
}).strict();

const ActorContext = z.object({
  actor_person_id: UUID,
  acting_party_id: UUID.optional(),
  acting_context_version: Version,
  idempotency_key: Key,
  request_id: UUID
}).strict();

const Attendance = z.object({
  subject_kind: z.enum(["party", "shell"]),
  subject_id: UUID,
  state: z.enum(["asserted", "withdrawn"]),
  timing_start: z.string().datetime({ offset: true }).optional(),
  timing_end: z.string().datetime({ offset: true }).optional(),
  timing_consent: z.boolean().default(false)
}).strict();

export const SessionCommandRequest = ActorContext.extend({
  action: z.enum(["create", "close", "reopen"]),
  session_id: UUID.optional(),
  owner_party_id: UUID.optional(),
  source_kind: z.enum(["booking", "order", "room", "project", "manual"]).optional(),
  source_ref: UUID.optional(),
  grade: z.enum(["captured", "confirmed", "reconstructed"]).optional(),
  sensitivity: z.enum(["roster", "review", "stems", "takes", "restricted"]),
  attendance: z.array(Attendance).max(500),
  expected_version: Version.optional()
}).strict();

export const SessionResponse = z.object({
  session_id: UUID,
  owner_party_id: UUID,
  state: z.enum(["active", "closed", "reopened", "amended"]),
  grade: z.enum(["captured", "confirmed", "reconstructed"]),
  close_event_id: UUID.nullable(),
  capture_batch_key: Hash.nullable(),
  version: Version,
  audit_event_id: UUID,
  event_id: UUID.nullable()
}).strict();

const CapturePayload = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("contributor_facts"), facts: z.record(z.string().max(80), z.string().max(500)) }).strict(),
  z.object({ kind: z.literal("producer_heavyweight"), facts: z.record(z.string().max(80), z.string().max(2000)) }).strict(),
  z.object({ kind: z.literal("dismissal"), reason: z.string().trim().min(1).max(500) }).strict()
]);
export const CaptureAnswerRequest = ActorContext.extend({
  session_id: UUID,
  ask_id: UUID,
  expected_ask_version: Version,
  answer: CapturePayload,
  dismissed: z.boolean().default(false)
}).strict();

export const CaptureAnswerResponse = z.object({
  session_id: UUID,
  ask_id: UUID,
  answer_id: UUID,
  answer_state: z.enum(["answered", "dismissed"]),
  debt_id: UUID.nullable(),
  session_remains_closed: z.literal(true),
  version: Version,
  audit_event_id: UUID
}).strict();

const CanonicalPin = z.object({ slot_id: UUID, audio_version_id: UUID, source_version: Version }).strict();
export const BuildPackageRequest = ActorContext.extend({
  song_id: UUID,
  recipient_spec_version_id: UUID,
  canonical_pins: z.array(CanonicalPin).min(1).max(1000),
  expected_package_version: Version
}).strict();

export const HandoffPackageResponse = z.object({
  package_id: UUID,
  recipient_spec_version_id: UUID,
  manifest_hash: Hash,
  artifact_checksum: Hash.nullable(),
  state: z.enum(["draft", "resolving", "validating", "blocked", "generated", "stale", "superseded"]),
  validation: z.object({ blocking: z.number().int().nonnegative(), warnings: z.number().int().nonnegative(), lossy: z.number().int().nonnegative() }).strict(),
  version: Version,
  event_id: UUID,
  audit_event_id: UUID
}).strict();

export const ReadinessRequest = ActorContext.extend({
  song_id: UUID,
  recipient_spec_version_id: UUID,
  source_refs: z.array(UUID).min(1).max(1000),
  check_keys: z.array(z.string().trim().min(1).max(80)).min(1).max(200),
  dismissals: z.array(z.object({ check_key: z.string().trim().min(1).max(80), check_version: Version }).strict()).max(200)
}).strict();

export const ReadinessResponse = z.object({
  target_spec_version_id: UUID,
  source_hash: Hash,
  gaps: z.array(z.object({ check_key: z.string().trim().min(1).max(80), outcome: z.enum(["passed", "warning", "blocking_integrity", "opaque_dependency", "unverifiable"]), action: z.string().trim().min(1).max(500), dismissed: z.boolean() }).strict()),
  computed_at: z.string().datetime({ offset: true }),
  viewer_scope_hash: Hash
}).strict();

export const RevisionRoundRequest = ActorContext.extend({
  song_id: UUID,
  action: z.enum(["open", "close"]),
  revision_agreement_id: UUID,
  triage_batch_id: UUID.optional(),
  delivered_version_id: UUID.optional(),
  scope_verdict: z.enum(["in_scope", "out_of_scope"]).optional(),
  scope_reason: z.string().trim().min(1).max(1000).optional(),
  expected_round_version: Version
}).strict();

export const RevisionRoundResponse = z.object({
  revision_round_id: UUID,
  state: z.enum(["configured", "open", "closed", "exhausted", "out_of_scope", "error"]),
  included_count: z.number().int().nonnegative().nullable(),
  contents_manifest_hash: Hash,
  version: Version,
  audit_event_id: UUID
}).strict();

const RecallRow = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("derived_track"), track_ref: UUID, display_name: z.string().trim().min(1).max(120), channel_count: z.number().int().positive().max(256) }).strict(),
  z.object({ kind: z.literal("derived_channel"), channel_ref: UUID, track_ref: UUID.optional(), label: z.string().trim().max(120).optional(), plugin_chain_ref: UUID.optional() }).strict(),
  z.object({ kind: z.literal("derived_session"), sample_rate_hz: z.number().int().positive().max(384000), bit_depth: z.number().int().positive().max(64).optional() }).strict(),
  z.object({ kind: z.literal("analogue_microphone"), channel_ref: UUID.optional(), gear_ref: UUID.optional(), model_text: z.string().trim().max(200).optional(), position_text: z.string().trim().max(500).optional() }).strict(),
  z.object({ kind: z.literal("analogue_signal_path"), channel_ref: UUID.optional(), ordered_stage_refs: z.array(UUID).max(100), settings_text: z.string().trim().max(2000).optional() }).strict(),
  z.object({ kind: z.literal("analogue_patch"), from_endpoint: z.string().trim().min(1).max(120), to_endpoint: z.string().trim().min(1).max(120) }).strict(),
  z.object({ kind: z.literal("analogue_room"), room_ref: UUID.optional(), layout_note: z.string().trim().min(1).max(2000) }).strict()
]);
export const RecallSheetRequest = ActorContext.extend({
  session_id: UUID,
  paper_asset_ref: UUID.optional(),
  derived_snapshot_ref: UUID.optional(),
  template_sheet_version_id: UUID.optional(),
  rows: z.array(z.object({ ordinal: z.number().int().nonnegative(), half: z.enum(["derived", "analogue"]), source_kind: z.enum(["snapshot", "template", "manual"]), source_ref: UUID.optional(), row: RecallRow }).strict()).max(5000),
  expected_sheet_version: Version
}).strict().refine(x => Boolean(x.paper_asset_ref) || x.rows.length > 0, "paper asset or typed row required");

export const RecallSheetResponse = z.object({
  sheet_version_id: UUID,
  session_id: UUID,
  row_count: z.number().int().nonnegative(),
  paper_complete: z.boolean(),
  sensitivity: z.enum(["roster", "review", "stems", "takes", "restricted"]),
  version: Version,
  audit_event_id: UUID
}).strict();

export const RecallProjectionGrantRequest = ActorContext.extend({
  session_id: UUID,
  sheet_version_id: UUID,
  action: z.enum(["create", "renew", "revoke"]),
  recipient_party_id: UUID,
  expires_at: z.string().datetime({ offset: true }),
  projection_policy_hash: Hash,
  revocation_reason: z.string().trim().max(500).optional(),
  expected_grant_version: Version
}).strict();

export const RecallProjectionGrantResponse = z.object({
  grant_id: UUID,
  state: z.enum(["active", "revoked", "expired"]),
  recipient_party_id: UUID,
  projection_policy_hash: Hash,
  projection_url: z.string().url().nullable(),
  expires_at: z.string().datetime({ offset: true }).nullable(),
  version: Version,
  event_id: UUID,
  audit_event_id: UUID
}).strict();

export type ApiError = z.infer<typeof ApiError>;
export type SessionCommandRequest = z.infer<typeof SessionCommandRequest>;
export type SessionResponse = z.infer<typeof SessionResponse>;
export type CaptureAnswerRequest = z.infer<typeof CaptureAnswerRequest>;
export type CaptureAnswerResponse = z.infer<typeof CaptureAnswerResponse>;
export type BuildPackageRequest = z.infer<typeof BuildPackageRequest>;
export type HandoffPackageResponse = z.infer<typeof HandoffPackageResponse>;
export type ReadinessRequest = z.infer<typeof ReadinessRequest>;
export type ReadinessResponse = z.infer<typeof ReadinessResponse>;
export type RevisionRoundRequest = z.infer<typeof RevisionRoundRequest>;
export type RevisionRoundResponse = z.infer<typeof RevisionRoundResponse>;
export type RecallSheetRequest = z.infer<typeof RecallSheetRequest>;
export type RecallSheetResponse = z.infer<typeof RecallSheetResponse>;
export type RecallProjectionGrantRequest = z.infer<typeof RecallProjectionGrantRequest>;
export type RecallProjectionGrantResponse = z.infer<typeof RecallProjectionGrantResponse>;
```

### Contract field traceability

| Field | IA source | Enforcement |
|---|---|---|
| Session action, owner/source, grade, attendance, reopen | PRJ-15 and `session`/`attendance_assertion`, lines 92, 154, 197 | Exactly-one owner, human assertions, six-hour reopen |
| Stable `ask_id`, tier payload and dismissal | PRJ-16 and `capture_moment`/`capture_ask`, lines 93 and 198 | Ask ownership, payload discriminator and debt |
| Recipient spec and canonical pins | PRJ-17, `BuildPackage`, lines 94 and 168 | Owned target, exact versions and no oversend |
| Objective checks, dismissals, opaque dependency | PRJ-18, `EvaluateReadiness`, lines 95 and 170 | Target-specific ordered gaps |
| Agreement, triage batch, delivered version, scope reason | PRJ-21 and `RevisionRound`, lines 98 and 155 | Producer-only scope and advisory count |
| Paper/template/snapshot rows and kind payload | PRJ-23, `RecallSheet`, lines 100 and 157 | Typed row union, paper-only completion |
| Verified Operator, exact sheet, expiry and policy | PRJ-24 and `GrantRecallProjection`, lines 101 and 158 | Recipient binding, filtered projection and revocation |

## Database Schema

### Canonical records and fields

| Table | Typed fields with nullability and constraints | Foreign keys, indexes and RLS/grants |
|---|---|---|
| `revision_agreement` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `engagement_ref uuid NULL`; `included_round_count integer NOT NULL CHECK (included_round_count >= 0)`; `batch_window_seconds integer NOT NULL CHECK (batch_window_seconds BETWEEN 1 AND 3600)`; `state text NOT NULL CHECK (state IN ('configured','disabled','superseded'))`; `created_by_person_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `song_id → song.id`, `created_by_person_id → person.id`; `engagement_ref` opaque Shard 14/17 pointer with no FK and no second writer; indexes `(song_id, state)`, `(engagement_ref)`; RLS song owner/Producer read and owner configure; GRANT policy: authenticated SELECT via RLS, owner configure function INSERT/UPDATE, DELETE revoked |
| `revision_round` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `agreement_id uuid NOT NULL`; `sequence integer NOT NULL CHECK (sequence > 0)`; `triage_batch_id uuid NULL`; `opened_at timestamptz NULL`; `closed_at timestamptz NULL`; `delivered_version_id uuid NULL`; `contents_manifest jsonb NOT NULL`; `scope_verdict text NULL CHECK (scope_verdict IS NULL OR scope_verdict IN ('in_scope','out_of_scope'))`; `scope_reason text NULL CHECK (scope_reason IS NULL OR char_length(scope_reason) <= 1000)`; `state text NOT NULL CHECK (state IN ('configured','open','closed','exhausted','out_of_scope','error'))`; `version bigint NOT NULL CHECK (version >= 0)`; unique `(song_id, sequence)` | FK `song_id → song.id`, `agreement_id → revision_agreement.id`; triage and delivered IDs opaque 09c/09c audio references; indexes `(song_id, state, sequence DESC)`, `(agreement_id, opened_at)`; RLS Producer write, contributor/read parties see both-party projection; GRANT policy: authorized parties SELECT projection via RLS, round function INSERT/UPDATE for Producer, DELETE revoked |
| `session` | `id uuid NOT NULL PRIMARY KEY`; `owner_person_id uuid NOT NULL`; `owner_party_id uuid NOT NULL`; `source_kind text NULL CHECK (source_kind IS NULL OR source_kind IN ('booking','order','room','project','manual'))`; `source_ref uuid NULL`; `grade text NOT NULL CHECK (grade IN ('captured','confirmed','reconstructed'))`; `sensitivity text NOT NULL CHECK (sensitivity IN ('roster','review','stems','takes','restricted'))`; `started_at timestamptz NOT NULL`; `closed_at timestamptz NULL`; `reopened_at timestamptz NULL`; `state text NOT NULL CHECK (state IN ('active','closed','reopened','amended'))`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `owner_person_id → person.id`, `owner_party_id → party.id`; source ref opaque external pointer; indexes `(owner_party_id, state, started_at DESC)`, `(source_kind, source_ref)`, `(id, version)`; RLS owner/Producer/session-role access, no anonymous listing; GRANT policy: authorized session-role SELECT via RLS, command function INSERT/UPDATE, DELETE revoked |
| `attendance_assertion` | `id uuid NOT NULL PRIMARY KEY`; `session_id uuid NOT NULL`; `subject_kind text NOT NULL CHECK (subject_kind IN ('party','shell'))`; `subject_id uuid NOT NULL`; `asserted_by_person_id uuid NOT NULL`; `state text NOT NULL CHECK (state IN ('asserted','withdrawn'))`; `timing_start timestamptz NULL`; `timing_end timestamptz NULL`; `timing_consent boolean NOT NULL DEFAULT false`; `evidence_refs jsonb NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; CHECK end is null or after start | FK `session_id → session.id`, `asserted_by_person_id → person.id`; subject refs opaque BE01; indexes `(session_id, subject_id, state)`, `(session_id, timing_start)`; RLS session role sees set semantics, Operator projections receive headcount only; GRANT policy: session-role SELECT via RLS, assertion function INSERT, UPDATE/DELETE revoked |
| `capture_moment` | `id uuid NOT NULL PRIMARY KEY`; `session_id uuid NOT NULL`; `close_event_id uuid NOT NULL`; `batch_key text NOT NULL CHECK (char_length(batch_key) BETWEEN 1 AND 128)`; `tier_budget jsonb NOT NULL`; `state text NOT NULL CHECK (state IN ('pending','dispatched','partially_answered','complete','debt'))`; `dispatched_at timestamptz NULL`; `version bigint NOT NULL CHECK (version >= 0)`; unique `(session_id, batch_key)` | FK `session_id → session.id`; close event opaque BE00 event ID; indexes `(session_id, state)`, `(batch_key)`; RLS session owner/ask recipient scoped, system worker write only; GRANT policy: scoped SELECT via RLS, worker function INSERT/UPDATE, DELETE revoked |
| `capture_ask` | `id uuid NOT NULL PRIMARY KEY`; `moment_id uuid NOT NULL`; `owner_party_id uuid NOT NULL`; `tier integer NOT NULL CHECK (tier IN (1,2))`; `prefill jsonb NOT NULL`; `payload_schema_version text NOT NULL`; `state text NOT NULL CHECK (state IN ('dispatched','answered','dismissed','silent','expired'))`; `answer_id uuid NULL`; `debt_id uuid NULL`; `dispatched_at timestamptz NOT NULL`; `answered_at timestamptz NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `moment_id → capture_moment.id`, `owner_party_id → party.id`; answer/debt IDs opaque rows; indexes `(owner_party_id, state, dispatched_at DESC)`, `(moment_id, tier)`; RLS recipient sees own ask, Producer sees own Tier 2 ask, worker append only; GRANT policy: recipient/Producer SELECT via RLS, worker function INSERT/UPDATE, DELETE revoked |
| `environment_archive` | `id uuid NOT NULL PRIMARY KEY`; `session_id uuid NOT NULL`; `label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 160)`; `manifest jsonb NOT NULL`; `availability text NOT NULL CHECK (availability IN ('available','partial','unavailable'))`; `storage_hash text NOT NULL`; `created_by_person_id uuid NOT NULL`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `session_id → session.id`, `created_by_person_id → person.id`; manifest contains labels and opaque refs, never DAW environment assertion; indexes `(session_id, created_at DESC)`, `(availability)`; RLS session sensitivity, service storage locator hidden; GRANT policy: authorized session-role SELECT via RLS, archive function INSERT, UPDATE/DELETE revoked |
| `recall_sheet_version` | `id uuid NOT NULL PRIMARY KEY`; `session_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; `paper_asset_ref uuid NULL`; `derived_snapshot_ref uuid NULL`; `template_sheet_version_id uuid NULL`; `sensitivity_class text NOT NULL CHECK (sensitivity_class IN ('roster','review','stems','takes','restricted'))`; `authored_by_person_id uuid NOT NULL`; `state text NOT NULL CHECK (state IN ('draft','complete','superseded'))`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`; unique `(session_id, version)`; CHECK paper ref or typed row exists enforced by transaction | FK `session_id → session.id`, `authored_by_person_id → person.id`; paper/snapshot/template refs opaque or self-FK; indexes `(session_id, version DESC)`, `(template_sheet_version_id)`; RLS inherited session sensitivity, no Operator direct sheet read; GRANT policy: authorized sheet-role SELECT via RLS, sheet function INSERT, UPDATE/DELETE revoked |
| `recall_sheet_row` | `id uuid NOT NULL PRIMARY KEY`; `sheet_version_id uuid NOT NULL`; `half text NOT NULL CHECK (half IN ('derived','analogue'))`; `kind text NOT NULL`; `ordinal integer NOT NULL CHECK (ordinal >= 0)`; `source_kind text NOT NULL CHECK (source_kind IN ('snapshot','template','manual'))`; `source_ref uuid NULL`; `payload jsonb NOT NULL`; `author_party_id uuid NOT NULL`; `supersedes_row_id uuid NULL`; `created_at timestamptz NOT NULL`; unique `(sheet_version_id, ordinal)` | FK `sheet_version_id → recall_sheet_version.id`, `author_party_id → party.id`, `supersedes_row_id → recall_sheet_row.id`; source refs opaque snapshot/template/gear pointers; CHECK kind/half/source/payload discriminants; indexes `(sheet_version_id, ordinal)`, `(kind)`, `(source_ref)`; RLS sheet role read/write append, Operator projection never selects this row directly; GRANT policy: sheet-role SELECT via RLS, row append function INSERT, UPDATE/DELETE revoked |
| `recall_projection_grant` | `id uuid NOT NULL PRIMARY KEY`; `session_id uuid NOT NULL`; `sheet_version_id uuid NOT NULL`; `grantor_party_id uuid NOT NULL`; `recipient_party_id uuid NOT NULL`; `projection_policy_hash text NOT NULL CHECK (projection_policy_hash ~ '^[a-f0-9]{64}$')`; `state text NOT NULL CHECK (state IN ('active','revoked','expired'))`; `expires_at timestamptz NOT NULL`; `revoked_at timestamptz NULL`; `revoked_by_person_id uuid NULL`; `revocation_reason text NULL CHECK (revocation_reason IS NULL OR char_length(revocation_reason) <= 500)`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`; unique active `(sheet_version_id, recipient_party_id)` | FK `session_id → session.id`, `sheet_version_id → recall_sheet_version.id`, `grantor_party_id → party.id`, `recipient_party_id → party.id`, `revoked_by_person_id → person.id`; indexes `(recipient_party_id, state, expires_at)`, `(sheet_version_id, state)`, `(session_id)`; RLS grantor sees grants, recipient sees own projection metadata, service-only token, no standing role |
| `recipient_spec_version` | `id uuid NOT NULL PRIMARY KEY`; `owner_domain text NOT NULL`; `key text NOT NULL CHECK (char_length(key) BETWEEN 1 AND 120)`; `version bigint NOT NULL CHECK (version >= 0)`; `required_slots jsonb NOT NULL`; `required_assets jsonb NOT NULL`; `required_metadata jsonb NOT NULL`; `objective_checks jsonb NOT NULL`; `effective_from timestamptz NOT NULL`; `effective_to timestamptz NULL`; `state text NOT NULL CHECK (state IN ('draft','approved','retired'))`; unique `(owner_domain, key, version)` | No user FK: platform-owned recipient spec is an opaque provider-domain record by design; indexes `(owner_domain, key, state)`, `(effective_from, effective_to)`; RLS package-authority read only, platform service owns writes; GRANT policy: package-authority SELECT via RLS, platform service INSERT/UPDATE, DELETE revoked |
| `handoff_package` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `project_id uuid NULL`; `recipient_spec_version_id uuid NOT NULL`; `canonical_pin_hash text NOT NULL CHECK (canonical_pin_hash ~ '^[a-f0-9]{64}$')`; `manifest jsonb NOT NULL`; `validation jsonb NOT NULL`; `checksum text NULL CHECK (checksum IS NULL OR checksum ~ '^[a-f0-9]{64}$')`; `artifact_locator text NULL`; `state text NOT NULL CHECK (state IN ('draft','resolving','validating','blocked','generated','stale','superseded'))`; `version bigint NOT NULL CHECK (version >= 0)`; `created_by_person_id uuid NOT NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `song_id → song.id`, `created_by_person_id → person.id`, `recipient_spec_version_id → recipient_spec_version.id`; `project_id` opaque 09a pointer; artifact locator service-only; indexes `(song_id, state, created_at DESC)`, `(recipient_spec_version_id, state)`, `(canonical_pin_hash)`; RLS package authority/readers, no client artifact locator; GRANT policy: authorized package SELECT via RLS, package function INSERT/UPDATE, artifact locator service-role only, DELETE revoked |
| `qc_result` | `id uuid NOT NULL PRIMARY KEY`; `source_version_id uuid NULL`; `package_id uuid NULL`; `check_key text NOT NULL CHECK (char_length(check_key) BETWEEN 1 AND 80)`; `check_version bigint NOT NULL`; `outcome text NOT NULL CHECK (outcome IN ('passed','warning','blocking_integrity','opaque_dependency','unverifiable'))`; `measurement jsonb NULL`; `consequence text NOT NULL CHECK (char_length(consequence) <= 500)`; `dismissed_at timestamptz NULL`; `unverifiable_reason text NULL CHECK (unverifiable_reason IS NULL OR char_length(unverifiable_reason) <= 500)`; `created_at timestamptz NOT NULL`; CHECK source or package ref exists | FK `package_id → handoff_package.id`; `source_version_id` opaque 09c audio pointer; indexes `(package_id, check_key, check_version)`, `(source_version_id, outcome)`; RLS package/song authorized reader; GRANT policy: authorized reader SELECT via RLS, QC function INSERT, UPDATE/DELETE revoked |
| `readiness_projection` | `id uuid NOT NULL PRIMARY KEY`; `target_spec_version_id uuid NOT NULL`; `source_hash text NOT NULL CHECK (source_hash ~ '^[a-f0-9]{64}$')`; `weighted_gaps jsonb NOT NULL`; `computed_at timestamptz NOT NULL`; `viewer_scope_hash text NOT NULL CHECK (viewer_scope_hash ~ '^[a-f0-9]{64}$')`; `ttl_expires_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `target_spec_version_id → recipient_spec_version.id`; source refs opaque and inside hash; indexes `(target_spec_version_id, computed_at DESC)`, `(source_hash, viewer_scope_hash)`, `(ttl_expires_at)`; RLS viewer scope hash policy, derived service write only; GRANT policy: scoped viewer SELECT via RLS, readiness service INSERT/UPDATE, DELETE revoked |

Grant invariant applies row-for-row: client API roles receive no direct table `GRANT`; authenticated reads and writes use the named RLS or command function, while the service role receives only least-privilege `GRANT EXECUTE` on that function. No raw table grant exposes session, recall, package, or readiness data.

### Persistence invariants

- Session close is a serializable state transition. It records owner, grade, attendance assertions, batch key and close event before asks are dispatched. Close dispatch is at-least-once and deduplicated; failure never rolls back a committed close.
- Capture asks have stable IDs and payload schema versions. Tier 1 asks fire independently; at most one Tier 2 Producer ask fires and only when prefill is non-empty. Silence/dismissal creates completeness debt and never changes session state to failed.
- Revision rounds require an accepted agreement and Producer authority. Counts and scope are advisory, both-party-visible and never billed. `engagement_ref` remains nullable and has no second writer.
- A paper-only recall sheet is complete. Typed rows are immutable per sheet version, with exact discriminant/source rules. Template copies preserve source references and never mutate the source sheet.
- Operator grants bind one verified recipient to one exact sheet version. The server projection includes only analogue gear/signal-path/patch/room fields, replaces internal refs with sheet-local line refs and is revoked/expired by epoch. No successor sheet inherits a grant.
- Package resolution pins recipient spec and canonical versions before build. Integrity blocks; other gaps warn. A source change produces `SOURCE_STALE`, and partial artifacts remain unsealed in quarantine.
- Readiness is on-demand and target-specific. Unsupported checks are `unverifiable`, inaccessible dependencies are opaque, and dismissed warnings remain sticky only for the same project/check version.

## Middleware & Policies

### Hono middleware order

1. `requestId` validates UUID and binds it to trace, audit and response.
2. `cors(consumer-web-pwa)` applies origin and method/header allowlists; no credentialed wildcard. Package/provider-internal requests use `internal-release-web` only where configured.
3. `authContext` resolves BE00 session, acting party and context version.
4. `rateLimit` selects party/identity/IP bucket, then strict Zod validates path, headers and body.
5. `tenantScope` resolves session/song/package/spec under the authorized party before counts, gaps, rows or grant metadata are visible.
6. `authorization` evaluates session owner, Producer role, package authority, target read, sensitivity and verified Operator identity.
7. `idempotency` fingerprints command payload and reserves/replays the key; mismatches return 409 without mutation.
8. `serializableCommand` applies state/CAS transition and appends audit/outbox; `signedGrant` issues only after grant transaction commits.
9. `projectionFilter` strips attendance identity, paper/derived rows, creative fields, channel names, hidden gaps, artifact locators and package extras.

### Per-operation authorization matrix

| Operation ID | Required capability and ownership | 403 versus 404 | Idempotency and rate | CORS and output policy |
|---|---|---|---|---|
| `PRJ-15` | Session owner or authorized Producer for close/reopen; creating context owns one party | Hidden session 404; known non-owner 403 | `(actor, session, key)`; 30/minute/party | `consumer-web-pwa`; attendance projection is set-valued and scoped |
| `PRJ-16` | Ask recipient answers own stable ask only | Hidden session/ask 404; another party's ask 403 | `(ask, actor, key)`; 60/minute/identity | `consumer-web-pwa`; no other ask/prefill visible |
| `PRJ-17` | Song/project package authority and owned recipient spec | Hidden song/spec 404; known no authority 403 | `(song, spec, key)`; 10/minute/party | `consumer-web-pwa`; exact required assets only |
| `PRJ-18` | Authorized read of song/package and owned target spec | Hidden song/spec 404; known unreadable 403 | `(song, spec, source hash, key)`; 60/minute/party | `consumer-web-pwa`; opaque dependency gaps |
| `PRJ-21` | Producer writes; contributors read both-party round projection | Hidden song 404; known contributor write attempt 403 | `(song, key)`; 30/minute/party | `consumer-web-pwa`; count informs, never bills |
| `PRJ-23` | Session role reaches inherited sensitivity | Hidden session/sheet 404; known insufficient class 403 | `(session, key)`; 20/minute/party | `consumer-web-pwa`; Operator cannot read source sheet |
| `PRJ-24` | Producer/session owner capability and verified Operator recipient | Hidden session/sheet 404; known unauthorized grantor/recipient 403 | `(sheet, recipient, key)`; 20/minute/party | `consumer-web-pwa`; filtered projection only |

### Security and abuse controls

- Close prompts contain only session roll, roster and manual project facts. No local path, DAW parse, source observation, automatic presence or source classification enters prefill.
- Attendance names are never sent to Operator; Operator sees only permitted headcount/contact projection. Capture answers are recipient-scoped and excluded from events/logs.
- Package manifests use exact required slots and source hashes. Oversending is rejected. Artifact locators and bytes are service-only; unsealed partial writes are quarantined.
- Recall projection policy is deny-by-default and allowlists analogue microphone, signal-path, patch and room fields. Internal track/channel references become sheet-local line refs. Photograph, derived rows, songs, creative content and attendance are excluded.
- Rate buckets: 30 session/round mutations, 60 answer/readiness requests, 10 package builds, 20 sheet/grant mutations per party window. Repeated denied access is sampled without exposing target existence.
- CSP blocks frame embedding for private packages and sheets. CSRF protects cookie mutations. Logs contain hashes, IDs and safe enum values, never paper, answers, attendance, hidden gaps or locators.

## Data Flow

### Transaction and external seams

| Seam | Exact request and response | Timeout | Retry | Circuit behavior |
|---|---|---:|---:|---|
| BE00 context/idempotency | `RequestContext { requestId, actorPersonId, actingPartyId?, contextVersion, key, fingerprint }` → `ContextDecision { accepted, replay, storedResult? }` | 100 ms | 0 retries; no backoff; in-process | N/A for network circuit (in-process); fail closed on missing context |
| BE00 storage/quarantine | `ArtifactWrite { packageId, manifestHash, checksum, bytes }` → `ArtifactReceipt { locator, checksum, sealed }` | 1,500 ms | 3 at 100 ms, 300 ms and 900 ms | Open after 4 failures for 20 s; keep artifact unsealed and return `DEPENDENCY_UNAVAILABLE` |
| BE00 signed grant | `ProjectionGrant { sheetVersionId, recipientId, policyHash, expiresAt, epoch }` → `SignedProjection { token, expiresAt, epoch }` | 500 ms | 2 at 100 ms and 250 ms | Open after 4 failures for 20 s; deny new reads |
| BE01 authority | `ResolveSessionAuthority { actorPersonId, sessionId, capability, contextVersion }` → `AuthorityDecision { allowed, ownerPartyId, roleVersion }` | 300 ms | 2 at 50 ms and 100 ms | Open after 5 failures for 30 s; mutation denied |
| BE07 capture boundary | `SessionClosedFact { sessionId, songRefs, grade, closeEventId, version }` → `CaptureConsumerReceipt { accepted, consumerEventId }` | 600 ms | 3 at 100 ms, 300 ms and 900 ms | Open after 5 failures for 30 s; close remains committed and consumer retries |
| Shard 10 split consumer | `SessionClosedProjection { sessionId, songRefs, version, batchKey }` → `SplitCaptureReceipt { accepted, eventId }` | 600 ms | 3 at 100 ms, 300 ms and 900 ms | Open after 5 failures for 30 s; no split facts are written here |
| Recipient-spec registry | `ResolveRecipientSpec { specId, effectiveAt }` → `RecipientSpecDecision { owned, version, requiredSlots, checks }` | 400 ms | 2 at 75 ms and 150 ms | Open after 5 failures for 30 s; package is unavailable, never built against default |
| BE00 outbox/cache | `OutboxEnvelope { eventType, aggregateId, version, payloadHash }` → `EnqueueReceipt { eventId }` | 500 ms | 3 at 100 ms, 300 ms and 900 ms | Open after 5 failures for 30 s; domain transaction cannot seal without durable event |

### State machines and concurrency

- Session is `active → closed → reopened → closed → amended`; scheduled mirrors may disappear before activation. Reopen is legal within six hours, and close batches within ten minutes share one moment key.
- Capture moment is `pending → dispatched → partially_answered → complete | debt`; ask is `dispatched → answered | dismissed | silent | expired`. Stable IDs prevent duplicate answers.
- Package is `draft → resolving → validating → blocked | generated → stale | superseded`. Canonical pins and source hashes are locked before worker build.
- Revision round is `configured → open → closed → exhausted | out_of_scope | error`; no agreement means the surface stays disabled. Count/scope are Producer facts and can be disputed.
- Recall sheet versions are immutable; grant is `active → revoked | expired`. A grant is unique per exact sheet and recipient and does not follow a successor version.
- Readiness projections are derived by source hash and viewer scope. Stale projections are recomputed; stale data never widens visibility.
- Serializable CAS protects session, ask, round, sheet, package and grant versions. Outbox consumers dedupe by event type, aggregate ID and version.

### Failure recovery

| Failure | Durable result | Retry/recovery |
|---|---|---|
| Close dispatch outage | Session stays closed; asks remain pending/outbox retry | Replay close event with same event/version |
| Reopen outside six hours | No state change | Create a new session if authorized |
| Answer payload mismatch | No answer mutation; ask remains answerable | Correct payload under same stable ask ID |
| Silence/dismissal | Ask state/debt recorded; session remains closed | Answer later while ask remains open to its owner |
| Package source changes | Package becomes stale or build aborts before seal | Re-resolve pins and rebuild; no mixed-version artifact |
| Integrity failure | Package blocked with exact file/action; other warnings survive | Replace source and rerun objective validation |
| Readiness dependency hidden | Opaque gap, never pass or field leak | Recompute after authorized dependency becomes readable |
| Recall template copy failure | New sheet not committed; source untouched | Retry copy or author rows manually |
| Recall grant revoked mid-read | New chunks fail `ACCESS_REVOKED`; epoch/cache invalidated | Reauthorize exact sheet; no successor inheritance |
| Round count exhausted | Visible exhausted state; no work refusal or billing | New agreement/round after governance decision |

## Event Schemas

### Payload contracts

| Event type | Required payload | Privacy and delivery |
|---|---|---|
| `project.session.closed.v1` | `eventId uuid`, `sessionId uuid`, `songRefs uuid[]`, `grade`, `closeAt timestamptz`, `batchKey text`, `version bigint` | No attendance names, prompt answers, creative text or source paths; outbox dedupe |
| `project.package.generated.v1` | `eventId uuid`, `packageId uuid`, `specVersionId uuid`, `canonicalPinHash text`, `manifestHash text`, `validationHash text`, `checksum text` | No bytes, artifact locator, hidden gaps or extra assets |
| `project.recall-projection-access.changed.v1` | `eventId uuid`, `sessionId uuid`, `sheetVersionId uuid`, `recipientPartyId uuid`, `grantState`, `expiresAt timestamptz?`, `projectionPolicyHash text`, `version bigint` | No paper, derived/analogue payload, channel names or attendance |
| `project.canonical.changed.v1` | `eventId uuid`, `songId uuid`, `slotId uuid`, `targetVersionId uuid?`, `version bigint` | Consumed for package invalidation; no bytes |
| `project.approval.recorded.v1` | `eventId uuid`, `gateId uuid`, `versionId uuid`, `decision`, `version bigint` | Consumed for readiness; no signer PII |
| `project.access.changed.v1` | `eventId uuid`, `targetRefHash text`, `reasonCode`, `revocationEpoch bigint` | Consumed to invalidate grants/projections |
| `project.source-declaration.changed.v1` | `eventId uuid`, `targetRef uuid`, `state`, `kind`, `version bigint` | Consumed as readiness input; no source details |
| `project.bridge.state-changed.v1` | `eventId uuid`, `deviceId uuid`, `gateState`, `state`, `version bigint` | Consumed only for disabled bridge diagnostics |

## Error Handling

### Boundary mapping

| Condition | HTTP | `code` | Safe details |
|---|---:|---|---|
| Invalid action, row discriminator, ask, target or expiry | 400 | `VALIDATION_FAILED` | Field path and allowed bounds |
| Hidden session/song/spec/sheet | 404 | `RESOURCE_NOT_FOUND` | Empty details |
| Known subject lacks session/package/Producer/grant authority | 403 | `FORBIDDEN` | Required action only |
| Expected state/version moved | 409 | `VERSION_CONFLICT` | Safe aggregate version |
| Required canonical absent | 409 | `CANONICAL_UNSET` | Slot and action |
| Integrity check blocks package | 422 | `INTEGRITY_FAILED` | Exact safe file/action |
| Source changes during build | 409 | `SOURCE_STALE` | Rebuild action |
| Unreadable source or asset | 404 | `ASSET_NOT_FOUND` | No name/count |
| Recall token/epoch revoked | 403 | `ACCESS_REVOKED` | Reauthorize action |
| Queue/storage/spec unavailable | 503 | `DEPENDENCY_UNAVAILABLE` | Retry-after bucket |
| Reused key with different body | 409 | `IDEMPOTENCY_MISMATCH` | Fingerprint hash only |

### Operation error coverage

| Operation ID | 400 | 403 | 404 | 409 | 422/503 |
|---|---|---|---|---|---|
| `PRJ-15` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-16` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-17` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `CANONICAL_UNSET`, `SOURCE_STALE`, `IDEMPOTENCY_MISMATCH` | `INTEGRITY_FAILED`, `DEPENDENCY_UNAVAILABLE` |
| `PRJ-18` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND`, `ASSET_NOT_FOUND` | `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-21` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-23` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-24` | `VALIDATION_FAILED`, `ACCESS_REVOKED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |

Every branch serializes `ApiError { code, message, requestId, details }`; errors never reveal attendance, paper, source or hidden dependency existence.

## Observability

| Operation ID | Metrics | Structured logs | Trace and alerts |
|---|---|---|---|
| `PRJ-15` | session creates/closes/reopens, batch size, close latency, CAS conflicts | session ID, owner hash, action, grade, result | `prj.session.lifecycle`; alert duplicate close and reopen-window failures |
| `PRJ-16` | asks dispatched/answered/dismissed/silent, debt count, payload rejection | ask ID, tier, actor hash, answer state, payload hash | `prj.capture.answer`; alert Tier 2 duplicate dispatch or validation spike |
| `PRJ-17` | package builds, blocked integrity, stale source, queue latency | package/spec IDs, pin/manifest hashes, result | `prj.package.build`; alert oversend attempt and unsealed-artifact age |
| `PRJ-18` | checks by outcome, opaque dependencies, readiness latency, dismissal reuse | target spec, source hash, check key, outcome | `prj.readiness.evaluate`; alert false-pass invariant or lag |
| `PRJ-21` | round opens/closes, exhausted state, count conflict, batching delay | song/round IDs, state, count hash, scope verdict | `prj.revision.round`; alert producer-only policy violation |
| `PRJ-23` | sheets/rows, paper-only ratio, template failures, row discriminator failures | session/sheet IDs, row kind, source kind, result | `prj.recall.sheet`; alert unsupported row payload attempts |
| `PRJ-24` | grants/revokes/expiry, epoch mismatches, projection reads | grant/sheet IDs, recipient hash, policy hash, state | `prj.recall.grant`; alert token replay and projection-policy drift |

Logs and Sentry contain request ID, operation ID, opaque IDs, hashes and safe codes only. They never contain answers, attendance names, paper bytes, derived rows, channel names, source paths, artifact locators or hidden gap fields.

## Testing Strategy

### Contract and route tests

| Operation ID | Required tests |
|---|---|
| `PRJ-15` | Exactly-one owner; human attendance; close-before-asks; six-hour reopen; ten-minute batch; close dispatch retry; 403/404; CAS/idempotency; CORS and exact ApiError |
| `PRJ-16` | Stable ask/payload discriminant; Tier 1 independence; one non-empty Tier 2; dismissal/silence debt; wrong actor; replay; CORS and exact ApiError |
| `PRJ-17` | Owned spec; exact pins/no oversend; integrity block; source stale; partial quarantine; artifact checksum; replay; CORS and exact ApiError |
| `PRJ-18` | Target-specific checks; opaque dependency; unverifiable distinct from passed; sticky dismissal; hidden source 404; read-only effect; CORS and exact ApiError |
| `PRJ-21` | Agreement gate; Producer role; accepted triage/delivered version; exhaustion visible; scope reason/dispute; batching; CAS/replay; CORS and exact ApiError |
| `PRJ-23` | Paper-only validity; typed row union; kind/half/source checks; template source immutability; sensitivity; CAS/replay; CORS and exact ApiError |
| `PRJ-24` | Verified Operator; exact sheet/session; expiry bound; projection allowlist; revoke epoch; successor non-inheritance; CORS and exact ApiError |

### Persistence, concurrency and recovery tests

- Migration tests assert every listed column SQL type, nullability, check, FK or opaque rationale, index, RLS policy and grant. Service-only artifact/token/locator fields are not selectable by clients.
- Property tests prove close commits before asks, no answer changes session state, packages never oversend, unsupported checks never pass, paper-only sheets are valid, and Operator projections never contain prohibited fields.
- Serializable race tests cover session close/reopen, duplicate asks, package pin resolution, round batching, sheet template copy and grant revoke/renew. Exactly one expected-version winner commits audit/outbox.
- Worker tests inject duplicate close/package/recall events, queue retries and projection lag; stale events cannot reopen sessions, widen grants or pass readiness.
- Recovery tests inject storage outage, source mutation, checksum failure, hidden dependency, template-copy failure and grant revocation during range reads; each leaves durable safe state and retry path.
- Playwright tests cover focus-stable close prompts, accessible debt/unverifiable text, semantic package gaps, keyboard sheet rows and Operator projection redaction.

## Deepening Passes

| Pass | Evidence and resolution |
|---|---|
| Boundary | Seven interactions and fourteen models traced to IA lines 92–101 and 195–205; no project/container, roster, audio, rights or bridge ownership overlap |
| Contract | Strict Zod 4 state/action/row discriminants, exact response fields and shared BE00 error object added |
| Capture | Close-before-dispatch, tier budgets, stable asks and debt behavior match deep-dive lines 120–129 |
| Delivery | Owned spec, exact pins, integrity block, source stale and quarantine behavior match lines 131–140 |
| Recall | Paper validity, typed row union, Operator allowlist, sheet-local refs and grant revocation are explicit |
| Authorization | Session, Producer, package, sensitivity and verified Operator predicates use hidden 404 versus known 403 |
| Persistence | Fourteen tables list field types/nullability/constraints, FKs or opaque rationale, indexes, RLS and grants |
| Concurrency | CAS/idempotency covers every route; batching and one-active-grant uniqueness are explicit |
| Recovery | Queue/storage failure, source mutation, revocation, template failure, exhaustion and stale projections converge safely |
| Privacy | Attendance, answers, paper, derived rows, channel names, hidden gaps and locators are excluded from events/logs |

## Ambiguity Gate

PASS. Evidence: all seven IA interactions have one authoritative route, contract, error, authorization, observability and test row; every route names CORS and exact `ApiError { code, message, requestId, details }`; fourteen assigned model identifiers have typed persistence fields, constraints, FKs or opaque rationale, indexes, RLS and grants; session close ordering, tier budgets, target-specific readiness, paper-only sheets and Operator filtering are deterministic; `engagement_ref` is nullable with no second writer; excluded Won't features are explicit; table/link/marker checks are defined; and no unresolved implementation choice was introduced.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored session, capture, round, recall, delivery, QC and readiness backend companion | `/write-be-spec` | All |
| 2026-08-28 | Locked exact routes/contracts, typed persistence, filtered Operator grants, source-stale recovery and ambiguity evidence | `/write-be-spec-write` | API, contracts, database, security, tests |

## Dependency References

- [BE00 Cross-cutting platform foundation](00-infrastructure.md) — request context, errors, idempotency, storage, grants, cache, audit and outbox.
- [IA Shard 01 Identity authority](../ia/01-identity-authority.md) — party, authority, identity and succession source.
- [IA Shard 07 Credits core](../ia/07-credits-core.md) — session close/capture consumer and role taxonomy boundary.
- [IA Shard 09 parent](../ia/09-projects-collaboration.md) — assigned interactions, contracts, models, events and feature limits.
- [IA Shard 10 Rights and ownership](../ia/10-rights-ownership.md) — downstream split capture; session close never mutates rights.
- [IA Shard 14 Services marketplace](../ia/14-services-marketplace.md) — downstream recipient/service consumer; no service fact is written here.
- [IA Shard 23 Gear provenance registry](../ia/23-gear-provenance-registry.md) — gear references are opaque and Operator projection uses sheet-local lines.
