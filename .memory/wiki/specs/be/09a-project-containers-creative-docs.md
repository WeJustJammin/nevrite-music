# BE-09a — Project containers and creative documents

## Split Group

Shard 09 is split into five bounded backend specifications. This companion owns the song and project containers, release membership edges, stage/debt records, idea and document versions, and the living mix brief. It does not own party authority, role taxonomy, credit facts, rights, audio lineage, sessions, delivery packages, or the future local bridge. The authoritative source is [IA Shard 09 — Music projects and collaboration](../ia/09-projects-collaboration.md).

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Boundary | Production command and query surface for containers and creative documents | IA scope says Shard 09 owns workspace containers and pointers, not credits, rights, splits, payments, releases, or distribution truth (IA §Overview, lines 9–24). |
| Operations | Five routes, one route for each assigned interaction: `PRJ-01`, `PRJ-02`, `PRJ-03`, `PRJ-04`, `PRJ-22` | IA interaction rows 78–81 and 99. |
| Data | Twelve canonical tables plus two audit/document tables; immutable versions and append-only movements | IA Data Models rows 178–182, 195–196, 205 and typed registry lines 211–221, 243–246, 262. |
| Delivery | Responsive web/PWA at launch; manual records, no local agent or third-party audio hosting | IA Overview/Delivery Phases, lines 21–24 and 38–44; Accessibility, lines 291–299. |
| Exclusions | No arbitrary stages, silent canonical selection, rights/split mutation, hard delete, commercial reference hosting, or public remix program | IA Delivery Phases line 44, Edge Cases lines 335 and 349–350, and feature-ledger Won't rows 704–706. |

## Referenced Material Inventory

| Source file | Section and lines | Material used | Trace |
|---|---|---|---|
| [IA parent](../ia/09-projects-collaboration.md) | Overview and Scope Reconciliation, lines 1–24 | Ownership boundary, launch surface, bridge exclusion, split scope | IA-09-SCOPE |
| [IA parent](../ia/09-projects-collaboration.md) | Features and Delivery Phases, lines 26–44 | Feature and phase boundaries | IA-09-FEATURES |
| [IA parent](../ia/09-projects-collaboration.md) | Acceptance Criteria, lines 46–72 | Acceptance behavior and failure semantics for PRJ-01 through PRJ-04 and PRJ-22 | IA-09-AC |
| [IA parent](../ia/09-projects-collaboration.md) | Interactions and Global Interaction Rules, lines 74–112 | Assigned interaction contracts, actor context, idempotency, versioning, confidentiality | IA-09-INT |
| [IA parent](../ia/09-projects-collaboration.md) | Contracts, lines 113–173 | `SongLifecycle`, `ProductionStage`, `CreateSong`, `MixBrief`, and shared errors | IA-09-CONTRACT |
| [IA parent](../ia/09-projects-collaboration.md) | Data Models and Typed Field Registry, lines 174–262 | Canonical model names, fields, cardinality, `engagement_ref` boundary | IA-09-DATA |
| [IA parent](../ia/09-projects-collaboration.md) | Access Control, Accessibility, lines 264–299 | Roles, denial behavior, semantic documents and keyboard operations | IA-09-A11Y |
| [IA parent](../ia/09-projects-collaboration.md) | Event Schemas, lines 301–319 | Event payload minimums and privacy exclusions | IA-09-EVENT |
| [IA parent](../ia/09-projects-collaboration.md) | Edge Cases through Cross-Shard Contract Map, lines 321–419 | Failure recovery, 403/404 privacy, upstream ownership and consumer boundaries | IA-09-EDGE |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Canonical Field Contracts, lines 20–62 | Field-level invariants for containers, documents and mix references | DD09-FIELDS |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | State Machines and algorithms, lines 64–151 | Lifecycle, lineage-independent document versioning, delivery and bridge boundaries | DD09-ALGO |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Abuse and Recovery Verification, lines 153–169 | No deletion, privacy, idempotent worker and stale recovery controls | DD09-RECOVERY |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Cross-Shard Contracts and Implementation Envelope, lines 171–190 | Typed BE00/BE01/BE07 boundaries and PostgreSQL/Hono/outbox choices | DD09-CROSS |
| [Feature ledger](../feature-ledger.md) | rows 61–69, 263–264, 526–528, 534 | Assigned Must, Should and Could capabilities | FL-09A |
| [BE00](00-infrastructure.md) | Shared request, error, idempotency, audit, storage and outbox contracts | Inherited platform envelope; no duplicate platform routes | BE00-INHERIT |

## IA Source Map

### Interaction map

| IA interaction | IA lines | Backend operation | Owned result |
|---|---:|---|---|
| `PRJ-01` Create/manage song | 78 | `PRJ-01` `POST /api/v1/songs` | Song lifecycle/version and owner-context audit commit |
| `PRJ-02` Assemble release | 79 | `PRJ-02` `POST /api/v1/releases/{releaseId}/memberships` | Ordered membership edge and readiness invalidation |
| `PRJ-03` Move production stage | 80 | `PRJ-03` `POST /api/v1/songs/{songId}/stage` | Fixed stage movement plus non-blocking completeness debt |
| `PRJ-04` Capture idea or edit creative doc | 81 | `PRJ-04` `POST /api/v1/songs/{songId}/creative-records` | Immutable idea or independently versioned lyric/chart record |
| `PRJ-22` Maintain mix brief | 99 | `PRJ-22` `POST /api/v1/songs/{songId}/mix-briefs` | Living brief version and typed reference pointers |

### Model map

| IA first-column identifier | IA line | Ownership in this companion |
|---|---:|---|
| `song` | 178 | Canonical song aggregate, lifecycle, stage pointer and confidentiality |
| `song_title_version` | 178 | Append-only working-title history |
| `project` | 179 | Project container and owner boundary |
| `project_song_membership` | 179 | Many-to-many project/song edge |
| `release_container` | 180 | Release workspace container only; distribution truth remains downstream |
| `release_membership` | 180 | Ordered song membership and exact master pointer |
| `milestone` | 181 | Advisory stage/deadline prompt |
| `completeness_debt` | 181 | Non-blocking unresolved ask |
| `idea_artifact` | 182 | Immutable nameless or attributed idea origin |
| `lyric_document_version` | 182 | Immutable versioned lyric text and attribution |
| `chart_version` | 182 | Immutable chart/arrangement version |
| `mix_brief` | 196 | Living song-scoped brief |
| `brief_reference` | 196 | External link or same-party platform-version pointer |
| `project_audit_event` | 205 | Immutable actor/context/request evidence |

### Event map

| IA event type | IA line | Emission from this companion |
|---|---:|---|
| `project.song.changed.v1` | 305 | Song create, lifecycle, title, stage and debt projection changes |
| `project.canonical.changed.v1` | 310 | Release membership pin or canonical pointer invalidation notice; this companion never chooses audio canonicals |
| `project.review.changed.v1` | 311 | Not emitted by these routes; consumed as a brief conflict/readability signal only when authorized |
| `project.session.closed.v1` | 312 | Not emitted; session owner remains 09d |
| `project.package.generated.v1` | 314 | Not emitted; package owner remains 09d |
| `project.source-declaration.changed.v1` | 315 | Not emitted; declaration owner remains 09b |
| `project.bridge.state-changed.v1` | 316 | Not emitted; bridge owner remains 09e |
| `project.recall-projection-access.changed.v1` | 317 | Not emitted; recall grant owner remains 09d |

The event map preserves every event identifier relevant to the parent contract while naming the producer. This companion publishes only `project.song.changed.v1`; it never duplicates an event owner assigned to another companion.

## Feature Ledger Coverage

| Ledger ID | Capability | Ledger line | Backend treatment |
|---|---|---:|---|
| `07.01.01` | Song Record & Work Entity | 61 | `PRJ-01`; song is a private working record, not rights truth |
| `07.01.02` | Release Container, Sequencing & Assembly | 526 | `PRJ-02`; edge and sequence are immutable/versioned |
| `07.01.03` | Production Stage Board, Milestones & Creative Deadlines | 263 | `PRJ-03`; fixed stage and advisory debt |
| `07.02.01` | Idea Capture Inbox | 527 | `PRJ-04`; nameless immutable idea with original local timestamp |
| `07.02.02` | Lyric Workspace with Per-Line Attribution | 264 | `PRJ-04`; line attribution and section anchors validate before append |
| `07.02.03` | Chord, Arrangement & Chart Workspace | 528 | `PRJ-04`; chart version is independent from lyric version |
| `07.07.01` | Mix Brief & Reference Board | 534 | `PRJ-22`; external links only for commercial references |

No feature-ledger row is silently promoted. Won't capabilities `07.07.04`, `07.07.05`, and `07.08.05` remain excluded and are recorded in 09d's delivery boundary.

## IA Umbrella Feature Coverage

The nine umbrella bullets in IA Shard 09 `## Features` (lines 26–36) are reconciled below. Leaf ledger treatment remains in the owning companion; this table is the cross-companion traceability record and does not create a second route owner.

| IA feature (exact source title) | Owning companion(s) | Interaction coverage | Evidence and disposition |
|---|---|---|---|
| `07.01 Song, Release & Production Board` | 09a | `PRJ-01`, `PRJ-02`, `PRJ-03` | Song/project, release membership and fixed-stage commands are implemented by 09a; leaf rows `07.01.01`–`07.01.03` are covered above. |
| `07.02 Songwriting & Composition Workspace` | 09a | `PRJ-04` | Idea, lyric and chart records use the 09a creative-record command; leaf rows `07.02.01`–`07.02.03` are covered above. |
| `07.03 Contributors, Access & Confidentiality` | 09b | `PRJ-05`, `PRJ-06`, `PRJ-07` | Roster, invitation and vault-gating commands are owned by 09b; leaf rows `07.03.01`–`07.03.03` remain in 09b. |
| `07.04 Audio Version Control & Lineage` | 09c | `PRJ-08`, `PRJ-09`, `PRJ-10`, `PRJ-25` | Version ingest, canonical/compare, and exact-version descriptor correction are owned by 09c; descriptor correction preserves the Shard 22 release-origin seam. |
| `07.05 Review, Feedback & Approval` | 09c | `PRJ-11`, `PRJ-12`, `PRJ-13`, `PRJ-14` | Comment, share, triage and approval commands are owned by 09c; revision-round counting is separately represented under 09d's `07.05.05` ledger row. |
| `07.06 Sessions, Documentation & Recall` | 09d | `PRJ-15`, `PRJ-16`, `PRJ-23`, `PRJ-24` | Session close/capture, recall-sheet and Operator projection-grant commands are owned by 09d; leaf rows `07.06.01`–`07.06.04` are covered in 09d. |
| `07.07 Mix & Master Workflow` | 09a, 09d | `PRJ-17`, `PRJ-18`, `PRJ-22` | 09a owns the mix brief/reference board (`07.07.01`); 09d owns alternate-version, mastering and delivery-facing workflow rows (`07.07.02`–`07.07.05`), with explicit Won't boundaries for format-specific and Atmos product logic. |
| `07.08 Delivery, Readiness & QC` | 09b, 09d | `PRJ-17`, `PRJ-18`, `PRJ-19` | 09d owns package/readiness/QC rows `07.08.01`–`07.08.03`; 09b owns manual source declaration `07.08.04`; excluded remix-program logic remains 09d's `07.08.05` Won't boundary. |
| `07.09 DAW Bridge & Capture-at-Source` | 09e | `PRJ-20` | 09e owns the evidence-gated bridge activation; leaf rows `07.09.01`–`07.09.03` remain explicitly disabled or future-only in v1. |

## Endpoint Completeness Reconciliation

| IA interaction | Route | Request | Success | Errors and recovery | Event/audit |
|---|---|---|---|---|---|
| `PRJ-01` | `POST /api/v1/songs` | `ManageSongRequest` | `SongMutationResponse` | `VALIDATION_FAILED`, `FORBIDDEN`, `ACTING_CONTEXT_STALE`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH`; no deletion | `project.song.changed.v1`, `project_audit_event` |
| `PRJ-02` | `POST /api/v1/releases/{releaseId}/memberships` | `AssembleReleaseRequest` | `ReleaseMembershipResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `CANONICAL_UNSET`, `INTEGRITY_FAILED`; prior ordering retained | `project.song.changed.v1` and audit |
| `PRJ-03` | `POST /api/v1/songs/{songId}/stage` | `MoveStageRequest` | `StageMovementResponse` | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT`; debt remains advisory | `project.song.changed.v1` and audit |
| `PRJ-04` | `POST /api/v1/songs/{songId}/creative-records` | `CreativeRecordRequest` | `CreativeRecordResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`; prior version untouched | `project.song.changed.v1` and audit |
| `PRJ-22` | `POST /api/v1/songs/{songId}/mix-briefs` | `MixBriefRequest` | `MixBriefResponse` | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`; both contradictory references remain visible | `project.song.changed.v1` and audit |

## Shared Contract Inheritance

BE00 supplies authentication context resolution, request IDs, `ApiError { code, message, requestId, details }`, idempotency-key storage, actor-safe audit hashing, Supabase transaction boundaries, storage quarantine, outbox delivery, signed URL invalidation, cache purge and offline replay. This file adds no BE00 platform route. All commands require `actor_person_id`, optional `acting_party_id`, `acting_context_version`, `idempotency_key` and `request_id`; optional `expected_version` is required for mutation of an existing version. A failed validation or authority check occurs before a domain mutation or provider call.

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA interaction | Method and path | Request → success | Auth / ownership / 403 versus 404 | Middleware incl. CORS | Idempotency / concurrency | Rate / timeout / cache / SLO | Error envelope | Event |
|---|---|---|---|---|---|---|---|---|---|
| `PRJ-01` | `PRJ-01` | `POST /api/v1/songs` | `ManageSongRequest` → `SongMutationResponse` | Song/project owner for owning party; missing subject is `404 RESOURCE_NOT_FOUND`, known subject without authority is `403 FORBIDDEN` | `requestId → authContext → rateLimit → zod(ManageSongRequest) → cors=consumer-web-pwa → csrf → audit`; CORS policy is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(actor_person_id, idempotency_key, route)` unique; `expected_version` CAS; duplicate proposal never merges | 30 requests/minute/party; 800 ms application deadline; no cache; p95 ≤ 400 ms | `ApiError { code, message, requestId, details }` | `project.song.changed.v1` |
| `PRJ-02` | `PRJ-02` | `POST /api/v1/releases/{releaseId}/memberships` | `AssembleReleaseRequest` → `ReleaseMembershipResponse` | Release owner authority and readable song; hidden release/song is `404 RESOURCE_NOT_FOUND`, visible but unauthorized is `403 FORBIDDEN` | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → audit`; CORS policy is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(release_id, idempotency_key)` unique; serializable sequence CAS; unique `(release_id, sequence)` | 60 requests/minute/party; 900 ms deadline; invalidate readiness cache; p95 ≤ 450 ms | `ApiError { code, message, requestId, details }` | `project.song.changed.v1` |
| `PRJ-03` | `PRJ-03` | `POST /api/v1/songs/{songId}/stage` | `MoveStageRequest` → `StageMovementResponse` | Song owner or Producer stage authority; hidden song `404`, known unauthorized song `403` | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → audit`; CORS policy is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, idempotency_key)` unique; stage-pointer CAS; advisory debt append is in same transaction | 60 requests/minute/party; 700 ms deadline; purge board cache; p95 ≤ 350 ms | `ApiError { code, message, requestId, details }` | `project.song.changed.v1` |
| `PRJ-04` | `PRJ-04` | `POST /api/v1/songs/{songId}/creative-records` | `CreativeRecordRequest` → `CreativeRecordResponse` | Owner, Producer, or contributor acting for itself; hidden song `404`, known unauthorized song `403` | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → audit → storage-quarantine-check`; CORS policy is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, idempotency_key)` unique; document version CAS; offline replay returns original immutable artifact | 30 requests/minute/party; 1,200 ms deadline including storage; no body cache; p95 ≤ 650 ms | `ApiError { code, message, requestId, details }` | `project.song.changed.v1` |
| `PRJ-22` | `PRJ-22` | `POST /api/v1/songs/{songId}/mix-briefs` | `MixBriefRequest` → `MixBriefResponse` | Mix-brief authoring role on song; hidden song `404`, known unauthorized song `403` | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → audit`; CORS policy is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, idempotency_key)` unique; brief-version CAS; references append, never overwrite | 30 requests/minute/party; 900 ms deadline; private cache purge on append; p95 ≤ 450 ms | `ApiError { code, message, requestId, details }` | `project.song.changed.v1` |

### Registry invariants

1. Path parameters are UUIDs and are validated before existence lookup. The route's authorization predicate runs after a tenant-scoped lookup, so hidden resources produce the same `404 RESOURCE_NOT_FOUND` shape as absent resources while known unauthorized resources produce `403 FORBIDDEN` only when policy permits that distinction.
2. `ApiError { code, message, requestId, details }` is the only error shape. `details` contains field paths or a safe conflict version, never title text, private body, hidden member names, storage locators, or role lists.
3. A successful mutation writes the domain row, immutable audit event and outbox entry in one transaction. Outbox retries do not repeat a domain mutation.
4. Stage and document versions are append-only. No route may set a canonical audio pointer, grant a hand permission, alter credit or rights facts, or hard-delete a song.

### Pagination and response bounds

Collection behavior is explicit outside the operation matrices. These commands return one bounded object; no cursor is accepted. `limit` is a request or response cap, never an invitation to fetch an unbounded collection.

| Operation ID | Pagination and cursor | Limit and rationale |
|---|---|---|
| `PRJ-01` | Pagination: N/A; cursor: N/A | One song object; request body limit 32 KiB. |
| `PRJ-02` | Pagination: N/A; cursor: N/A | One release-membership edge; request body limit 16 KiB. |
| `PRJ-03` | Pagination: N/A; cursor: N/A | One stage transition result; request body limit 16 KiB. |
| `PRJ-04` | Pagination: N/A; cursor: N/A | One creative-record version; request body limit 64 KiB. |
| `PRJ-22` | Pagination: N/A; cursor: N/A | One mix brief version; request body limit 64 KiB and 100 references. |

### Operation contract and error matrix

| Operation ID | Request and validation | Success | Declared errors | Recovery |
|---|---|---|---|---|
| `PRJ-01` | Title 1–200 trimmed characters, owning party UUID, allowed action, context and idempotency key; archive requires legal lifecycle | Song version, owner/context audit reference and lifecycle | `VALIDATION_FAILED`, `FORBIDDEN`, `ACTING_CONTEXT_STALE`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Retry same key; archive preserves all rows; owner loss sets `unadministered` through BE01 |
| `PRJ-02` | Release, song, sequence, variant and optional exact master UUID; duplicate sequence and unreadable pin rejected | Membership version plus readiness invalidation reference | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `CANONICAL_UNSET`, `INTEGRITY_FAILED` | Retry after re-reading the membership version; no fallback to latest master |
| `PRJ-03` | Stage belongs to versioned fixed set and expected stage version is positive | Stage movement and debt projection version | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT` | Retry after re-reading the stage pointer; deadline debt never blocks stage movement |
| `PRJ-04` | Record discriminator, body/rows, line attribution and anchors; offline origin needs local timestamp; body bounds enforced | Immutable idea or new document version with origin | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | Replay original key; prior version remains addressable |
| `PRJ-22` | Reference discriminant and payload agree; external URI is HTTPS; platform version belongs to same party; prose/annotation bounds enforced | Brief version and reference IDs | `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT` | Retry CAS with latest version; contradictory references remain surfaced |

### Route field validation matrix

| Operation ID | Path and body fields | Limits and invariants | Rejection |
|---|---|---|---|
| `PRJ-01` | `songId?`, `project_id?`, `title`, `action`, `lifecycle?`, `expected_version?` | UUIDs; title 1–200; lifecycle transition matrix; no hard delete | `VALIDATION_FAILED` before lookup mutation |
| `PRJ-02` | `releaseId`, `song_id`, `sequence`, `variant_key`, `selected_master_version_id?`, `expected_version` | Sequence 1–10,000; variant 1–64; exact visible master; unique position | `VALIDATION_FAILED` or `CANONICAL_UNSET` |
| `PRJ-03` | `songId`, `stage`, `expected_stage_version` | Stage enum is versioned and closed; version positive integer | `VALIDATION_FAILED` |
| `PRJ-04` | `songId`, `record_kind`, `origin`, `body?`, `line_attributions?`, `section_anchors?`, `chord_symbols?`, `expected_version?` | JSON payload ≤ 256 KiB; anchors resolve; offline timestamp not future by > 5 minutes | `VALIDATION_FAILED` |
| `PRJ-22` | `songId`, `references`, `prose?`, `expected_version` | ≤ 50 references; URI ≤ 2,048; annotation ≤ 500; no hosted third-party bytes | `VALIDATION_FAILED` |

## Request/Response Contracts (Zod 4 schemas)

```ts
import { z } from "zod";

const UUID = z.string().uuid();
const Version = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const IdempotencyKey = z.string().trim().min(16).max(128);
const RequestId = UUID;
const Json = z.json();

export const ApiError = z.object({
  code: z.enum([
    "VALIDATION_FAILED", "FORBIDDEN", "RESOURCE_NOT_FOUND", "ACTING_CONTEXT_STALE",
    "VERSION_CONFLICT", "IDEMPOTENCY_MISMATCH", "CANONICAL_UNSET", "INTEGRITY_FAILED",
    "STORAGE_UNAVAILABLE", "DEPENDENCY_UNAVAILABLE"
  ]),
  message: z.string().trim().min(1).max(240),
  requestId: RequestId,
  details: z.record(z.string(), Json)
}).strict();

const ActorContext = z.object({
  actor_person_id: UUID,
  acting_party_id: UUID.optional(),
  acting_context_version: Version,
  idempotency_key: IdempotencyKey,
  request_id: RequestId
}).strict();

const SongAction = z.enum(["create", "rename", "shelve", "restore", "archive"]);
const SongLifecycle = z.enum(["active", "shelved", "archived", "unadministered"]);
const ProductionStage = z.enum([
  "idea", "writing", "pre_production", "recording", "editing", "mixing", "mastering", "delivered"
]);

export const ManageSongRequest = ActorContext.extend({
  action: SongAction,
  song_id: UUID.optional(),
  project_id: UUID.optional(),
  owning_party_id: UUID.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  lifecycle: SongLifecycle.optional(),
  expected_version: Version.optional()
}).strict();

export const SongMutationResponse = z.object({
  song_id: UUID,
  owning_party_id: UUID,
  title_version_id: UUID,
  lifecycle: SongLifecycle,
  current_stage: ProductionStage,
  version: Version,
  audit_event_id: UUID,
  event_id: UUID
}).strict();

export const AssembleReleaseRequest = ActorContext.extend({
  release_id: UUID,
  song_id: UUID,
  sequence: z.number().int().min(1).max(10000),
  variant_key: z.string().trim().min(1).max(64),
  selected_master_version_id: UUID.optional(),
  expected_membership_version: Version
}).strict();

export const ReleaseMembershipResponse = z.object({
  release_id: UUID,
  membership_id: UUID,
  song_id: UUID,
  sequence: z.number().int().positive(),
  variant_key: z.string().trim().min(1).max(64),
  selected_master_version_id: UUID.nullable(),
  version: Version,
  readiness_invalidation_id: UUID,
  audit_event_id: UUID,
  event_id: UUID
}).strict();

export const MoveStageRequest = ActorContext.extend({
  song_id: UUID,
  stage: ProductionStage,
  expected_stage_version: Version
}).strict();

export const StageMovementResponse = z.object({
  song_id: UUID,
  stage: ProductionStage,
  stage_version: Version,
  completeness_debt_id: UUID.nullable(),
  audit_event_id: UUID,
  event_id: UUID
}).strict();

const LineAttribution = z.object({
  line_number: z.number().int().min(1),
  contributor_party_id: UUID,
  text_hash: z.string().regex(/^[a-f0-9]{64}$/)
}).strict();

const SectionAnchor = z.object({
  section_key: z.string().trim().min(1).max(80),
  start_line: z.number().int().min(1),
  end_line: z.number().int().min(1)
}).strict().refine(x => x.end_line >= x.start_line, "section range is reversed");

export const CreativeRecordRequest = ActorContext.extend({
  song_id: UUID,
  record_kind: z.enum(["idea", "lyric", "chart"]),
  origin: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("online"), captured_at: z.string().datetime({ offset: true }) }).strict(),
    z.object({ mode: z.literal("offline"), local_captured_at: z.string().datetime({ offset: true }) }).strict()
  ]),
  body: z.string().max(262144).optional(),
  line_attributions: z.array(LineAttribution).max(10000).optional(),
  section_anchors: z.array(SectionAnchor).max(500).optional(),
  chord_symbols: z.array(z.string().trim().min(1).max(32)).max(20000).optional(),
  expected_version: Version.optional()
}).strict();

export const CreativeRecordResponse = z.object({
  record_id: UUID,
  record_kind: z.enum(["idea", "lyric", "chart"]),
  version_id: UUID,
  version: Version,
  origin: z.object({ mode: z.enum(["online", "offline"]), captured_at: z.string().datetime({ offset: true }) }).strict(),
  immutable: z.literal(true),
  audit_event_id: UUID,
  event_id: UUID
}).strict();

const BriefReference = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("external_link"),
    external_uri: z.string().url().max(2048),
    timestamp_ms: z.number().int().nonnegative().max(86400000).optional(),
    annotation: z.string().trim().max(500).optional()
  }).strict(),
  z.object({
    kind: z.literal("platform_version"),
    source_version_id: UUID,
    timestamp_ms: z.number().int().nonnegative().max(86400000).optional(),
    annotation: z.string().trim().max(500).optional()
  }).strict()
]);

export const MixBriefRequest = ActorContext.extend({
  song_id: UUID,
  prose: z.string().max(20000).optional(),
  references: z.array(BriefReference).max(50),
  expected_version: Version
}).strict();

export const MixBriefResponse = z.object({
  mix_brief_id: UUID,
  version: Version,
  reference_ids: z.array(UUID),
  contradictory_reference_count: z.number().int().nonnegative(),
  audit_event_id: UUID,
  event_id: UUID
}).strict();

export type ApiError = z.infer<typeof ApiError>;
export type ManageSongRequest = z.infer<typeof ManageSongRequest>;
export type SongMutationResponse = z.infer<typeof SongMutationResponse>;
export type AssembleReleaseRequest = z.infer<typeof AssembleReleaseRequest>;
export type ReleaseMembershipResponse = z.infer<typeof ReleaseMembershipResponse>;
export type MoveStageRequest = z.infer<typeof MoveStageRequest>;
export type StageMovementResponse = z.infer<typeof StageMovementResponse>;
export type CreativeRecordRequest = z.infer<typeof CreativeRecordRequest>;
export type CreativeRecordResponse = z.infer<typeof CreativeRecordResponse>;
export type MixBriefRequest = z.infer<typeof MixBriefRequest>;
export type MixBriefResponse = z.infer<typeof MixBriefResponse>;
```

### Contract field traceability

| Contract field | IA source | Enforcement |
|---|---|---|
| `acting_party_id`, `acting_context_version`, `idempotency_key`, `request_id` | IA global rules, lines 104–106 | Actor context middleware and BE00 idempotency store |
| `title`, `action`, `lifecycle`, `expected_version` | `CreateSong` and PRJ-01, lines 48 and 136 | Lifecycle transition table and title bounds |
| `release_id`, `sequence`, `variant_key`, `selected_master_version_id` | PRJ-02, lines 49 and 79 | Unique release position and exact readable version check |
| `stage`, `expected_stage_version` | `ProductionStage` and PRJ-03, lines 50 and 120 | Closed versioned enum and CAS |
| `record_kind`, `origin`, `line_attributions`, `section_anchors`, `chord_symbols` | PRJ-04 and `idea_artifact`/document models, lines 51 and 182 | Discriminated payload and anchor resolution |
| `references.kind`, external URI or source version, annotation | `MixBrief`, lines 99 and 156 | Reference-kind agreement and no third-party bytes |

## Database Schema

### Canonical records and fields

Every row below lists SQL type, nullability and constraints for every domain field, then names foreign-key targets, query indexes, RLS predicate and grants. `owner_party_id` is a tenant boundary, not an authority shortcut. `project_audit_event` is append-only and never exposes private body content.

| Table | Typed fields with nullability and constraints | Foreign keys, indexes and RLS/grants |
|---|---|---|
| `song` | `id uuid NOT NULL PRIMARY KEY`; `owning_party_id uuid NOT NULL`; `title_version_id uuid NOT NULL`; `lifecycle text NOT NULL CHECK (lifecycle IN ('active','shelved','archived','unadministered'))`; `current_stage text NOT NULL`; `confidentiality text NOT NULL`; `created_by_person_id uuid NOT NULL`; `created_context_version bigint NOT NULL CHECK (created_context_version >= 0)`; `archived_at timestamptz NULL`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `owning_party_id → party.id`, `created_by_person_id → person.id`, `title_version_id → song_title_version.id` deferred on insert; indexes `(owning_party_id, lifecycle, updated_at DESC)` and `(id, version)`; RLS owner or live song-role read, owner/Producer write; grants authenticated select through policy, service role insert/update only through domain function, no direct delete |
| `song_title_version` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200)`; `authored_by_person_id uuid NOT NULL`; `acting_context_version bigint NOT NULL CHECK (acting_context_version >= 0)`; `supersedes_id uuid NULL`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `song_id → song.id`, `authored_by_person_id → person.id`, `supersedes_id → song_title_version.id`; indexes `(song_id, version DESC)` and `(song_id, created_at DESC)`; RLS follows song visibility, insert only owner/Producer, no update/delete grants |
| `project` | `id uuid NOT NULL PRIMARY KEY`; `owning_party_id uuid NOT NULL`; `name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200)`; `state text NOT NULL CHECK (state IN ('active','archived'))`; `created_by_person_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `owning_party_id → party.id`, `created_by_person_id → person.id`; indexes `(owning_party_id, state, updated_at DESC)` and `(id, version)`; RLS owning party or explicit project role, owner write only; GRANT policy: authenticated SELECT via RLS, domain function INSERT/UPDATE for owner, DELETE revoked |
| `project_song_membership` | `project_id uuid NOT NULL`; `song_id uuid NOT NULL`; `purpose text NULL CHECK (purpose IS NULL OR char_length(purpose) <= 120)`; `added_by_party_id uuid NOT NULL`; `added_at timestamptz NOT NULL`; `removed_at timestamptz NULL`; `version bigint NOT NULL CHECK (version >= 0)`; primary key `(project_id, song_id)` | FK `project_id → project.id`, `song_id → song.id`, `added_by_party_id → party.id`; indexes `(song_id, removed_at)` and `(project_id, removed_at, added_at)`; RLS requires owner of project and song visibility, owner write through command only; GRANT policy: authenticated SELECT via RLS, domain command INSERT/UPDATE for project/song owner, DELETE revoked |
| `release_container` | `id uuid NOT NULL PRIMARY KEY`; `owning_party_id uuid NOT NULL`; `display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 200)`; `state text NOT NULL CHECK (state IN ('draft','active','archived'))`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `owning_party_id → party.id`; indexes `(owning_party_id, state, updated_at DESC)` and `(id, version)`; RLS owner and authorized release workspace, owner write only; distribution adapters receive projections, never table grants |
| `release_membership` | `id uuid NOT NULL PRIMARY KEY`; `release_id uuid NOT NULL`; `song_id uuid NOT NULL`; `sequence integer NOT NULL CHECK (sequence BETWEEN 1 AND 10000)`; `variant_key text NOT NULL CHECK (char_length(variant_key) BETWEEN 1 AND 64)`; `selected_master_version_id uuid NULL`; `added_by_person_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`; unique `(release_id, sequence)` | FK `release_id → release_container.id`, `song_id → song.id`, `selected_master_version_id → audio_version.id` owned by 09c, `added_by_person_id → person.id`; indexes `(release_id, sequence)`, `(song_id, updated_at DESC)`; RLS release owner plus readable song; GRANT policy: authenticated SELECT via RLS, CAS function INSERT/UPDATE for release owner, DELETE revoked |
| `milestone` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `stage text NOT NULL`; `due_at timestamptz NULL`; `prompt_text text NOT NULL CHECK (char_length(prompt_text) <= 500)`; `state text NOT NULL CHECK (state IN ('open','dismissed','completed'))`; `created_by_person_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `song_id → song.id`, `created_by_person_id → person.id`; indexes `(song_id, state, due_at)`, `(song_id, stage)`; RLS song role read and owner/Producer write; grants exclude anonymous/public |
| `completeness_debt` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `source_kind text NOT NULL`; `source_ref uuid NULL`; `severity text NOT NULL CHECK (severity IN ('advisory','unverifiable'))`; `description text NOT NULL CHECK (char_length(description) <= 500)`; `resolved_at timestamptz NULL`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `song_id → song.id`; `source_ref` is an opaque domain reference with no cross-shard FK because source ownership varies; indexes `(song_id, resolved_at, severity)` and `(source_kind, source_ref)`; RLS song role read, system or owner append; GRANT policy: authenticated SELECT via RLS, system/owner append function, UPDATE/DELETE revoked |
| `idea_artifact` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `captured_by_person_id uuid NOT NULL`; `nameless_origin boolean NOT NULL`; `local_captured_at timestamptz NOT NULL`; `body_ciphertext text NULL`; `content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$')`; `state text NOT NULL CHECK (state IN ('captured','redacted'))`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)` | FK `song_id → song.id`, `captured_by_person_id → person.id`; indexes `(song_id, created_at DESC)`, `(content_hash)` unique for owner scope; RLS song creative-role read; GRANT policy: authenticated SELECT via RLS, contributor append function for own artifact, UPDATE/DELETE revoked, redaction only through retention function |
| `lyric_document_version` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `document_version bigint NOT NULL CHECK (document_version >= 0)`; `body text NOT NULL CHECK (char_length(body) <= 262144)`; `line_attribution jsonb NOT NULL`; `section_anchors jsonb NOT NULL`; `authored_by_person_id uuid NOT NULL`; `supersedes_id uuid NULL`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; unique `(song_id, document_version)` | FK `song_id → song.id`, `authored_by_person_id → person.id`, `supersedes_id → lyric_document_version.id`; indexes `(song_id, document_version DESC)`, GIN `(line_attribution)`; RLS song creative-role read; GRANT policy: authenticated SELECT via RLS, role-scoped append function, UPDATE/DELETE revoked |
| `chart_version` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `document_version bigint NOT NULL CHECK (document_version >= 0)`; `chart_body text NOT NULL CHECK (char_length(chart_body) <= 262144)`; `section_anchors jsonb NOT NULL`; `chord_symbols jsonb NOT NULL`; `authored_by_person_id uuid NOT NULL`; `supersedes_id uuid NULL`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; unique `(song_id, document_version)` | FK `song_id → song.id`, `authored_by_person_id → person.id`, `supersedes_id → chart_version.id`; indexes `(song_id, document_version DESC)`, GIN `(chord_symbols)`; RLS song creative-role read; GRANT policy: authenticated SELECT via RLS, role-scoped append function, UPDATE/DELETE revoked |
| `mix_brief` | `id uuid NOT NULL PRIMARY KEY`; `song_id uuid NOT NULL`; `prose text NULL CHECK (prose IS NULL OR char_length(prose) <= 20000)`; `authored_by_person_id uuid NOT NULL`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL` | FK `song_id → song.id`, `authored_by_person_id → person.id`; indexes `(song_id, version DESC)` and `(song_id, updated_at DESC)`; RLS song authoring role read/write; GRANT policy: authenticated SELECT/INSERT/UPDATE through RLS for song authoring role, DELETE revoked; no stage or contract gate |
| `brief_reference` | `id uuid NOT NULL PRIMARY KEY`; `mix_brief_id uuid NOT NULL`; `kind text NOT NULL CHECK (kind IN ('external_link','platform_version'))`; `external_uri text NULL CHECK (external_uri IS NULL OR char_length(external_uri) <= 2048)`; `source_version_id uuid NULL`; `timestamp_ms integer NULL CHECK (timestamp_ms IS NULL OR timestamp_ms BETWEEN 0 AND 86400000)`; `annotation text NULL CHECK (annotation IS NULL OR char_length(annotation) <= 500)`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL` | FK `mix_brief_id → mix_brief.id`; `source_version_id` is an opaque 09c audio pointer because 09c owns audio truth; CHECK requires exactly one payload matching `kind`; indexes `(mix_brief_id, created_at)`, `(source_version_id)`; RLS follows mix brief, no public projection of external URI without song authorization; GRANT policy: authenticated SELECT via RLS, brief-author append function, UPDATE/DELETE revoked |
| `project_audit_event` | `id uuid NOT NULL PRIMARY KEY`; `owning_party_id uuid NOT NULL`; `actor_person_id uuid NOT NULL`; `acting_context_version bigint NOT NULL`; `action text NOT NULL`; `target_type text NOT NULL`; `target_id uuid NOT NULL`; `before_hash text NULL`; `after_hash text NULL`; `request_hash text NOT NULL`; `created_at timestamptz NOT NULL`; immutable CHECK forbids UPDATE and DELETE | FK `owning_party_id → party.id`, `actor_person_id → person.id`; indexes `(owning_party_id, created_at DESC)`, `(target_type, target_id, created_at DESC)`, `(request_hash)`; RLS owner audit reader and service append, grants deny body read to consumers |

Grant invariant applies row-for-row: client API roles receive no direct table `GRANT`; authenticated reads and writes use the named RLS or command function, while the service role receives only least-privilege `GRANT EXECUTE` on that function. No raw table grant exposes ownership or PII.

### Persistence invariants

- A song transition is a serializable transaction over `song`, its title version when present, `project_audit_event`, `completeness_debt` when applicable and the BE00 outbox. Non-empty songs archive; no command issues `DELETE` against a song, document, membership or audit row.
- Release membership never copies song or audio truth. The selected master is an exact 09c pointer; a missing or compromised target returns `CANONICAL_UNSET` or `INTEGRITY_FAILED` and leaves the prior order unchanged.
- Lyric and chart versions have independent monotonic document versions. A line attribution or section anchor must resolve within the submitted body before append. An offline idea preserves the original local timestamp and nameless flag.
- `mix_brief` is a living document. `external_link` stores only a URI and optional timestamp; the platform never stores or streams commercial reference bytes. `platform_version` is readable only when the source version belongs to the same authorized party context.
- `engagement_ref` belongs to 09d's nullable `revision_agreement` pointer. This companion never creates a second writer for the unresolved PRJ-21 count decision.

## Middleware & Policies

### Hono middleware order

1. `requestId` validates or creates a UUID and attaches it to every log and response.
2. `cors(consumer-web-pwa)` permits the configured web and PWA origins, `GET, POST, OPTIONS`, `content-type, authorization, idempotency-key, x-acting-context-version`, and never permits credentialed wildcard origins.
3. `authContext` verifies the BE00 session, party membership and acting-context version; stale context stops before resource lookup.
4. `rateLimit` uses party and IP buckets, then `zod` validates path, headers and body with strict objects.
5. `tenantScope` applies owning-party and song/project scope before any query or count.
6. `authorization` evaluates capability and lifecycle transition; it returns safe 404 for hidden resources and explicit 403 only for known resources.
7. `idempotency` loads or reserves the request fingerprint; mismatch returns `IDEMPOTENCY_MISMATCH` without mutation.
8. `transactionAuditOutbox` writes canonical state, audit and event atomically; response serialization strips private fields.

### Per-operation authorization matrix

| Operation ID | Required capability and ownership | 403 versus 404 | Idempotency and rate | CORS and output policy |
|---|---|---|---|---|
| `PRJ-01` | `song:manage` on owning party; create requires owner context | Hidden project or song is 404; known non-owner is 403 | `(actor, key, route)` replay; 30/minute/party | `consumer-web-pwa`; response contains owner/context IDs but no private party profile |
| `PRJ-02` | Release owner plus readable song and exact master | Hidden release/song is 404; known release member without owner is 403 | `(release, key)` replay; 60/minute/party | `consumer-web-pwa`; no hidden song title or audio metadata |
| `PRJ-03` | Song owner or Producer stage authority | Hidden song 404; known song without capability 403 | `(song, key)` plus stage CAS; 60/minute/party | `consumer-web-pwa`; debt text is safe and scoped |
| `PRJ-04` | Owner, Producer, or contributor acting for itself | Hidden song 404; known song without creative role 403 | `(song, key)`; 30/minute/party and body quota | `consumer-web-pwa`; no roster or hidden collaborator leakage |
| `PRJ-22` | Mix-brief authoring role on song | Hidden song 404; known song without role 403 | `(song, key)` plus brief CAS; 30/minute/party | `consumer-web-pwa`; external URI visible only to authorized song roles |

### Security and abuse controls

- Strict Zod objects reject unknown fields, duplicate JSON keys at the edge parser, oversized bodies, invalid UUIDs and future timestamps outside the five-minute clock-skew budget.
- CSRF tokens are required for cookie-authenticated browser mutations; bearer API callers require an origin allowlist and request signature. CSP blocks inline script and frame embedding for private documents.
- Search, counts and autocomplete are tenant-scoped before filtering. Hidden songs and collaborators never produce existence-dependent messages. Audit hashes exclude raw lyric/body/reference text.
- Content is encrypted at rest where retained; logs contain IDs, hashes and safe enum values only. Export, support and cache layers receive the smallest authorized projection.
- Abuse buckets include 10 failed authorization attempts per actor/song/10 minutes, 5 MB creative-body quota per minute and 20 release reorder conflicts per minute; the response remains the shared error envelope.

## Data Flow

### Transaction and external seams

| Seam | Exact request and response | Timeout | Retry | Circuit behavior |
|---|---|---:|---:|---|
| BE00 request/idempotency | `RequestContext { requestId, actorPersonId, actingPartyId?, actingContextVersion, idempotencyKey }` → `ContextDecision { accepted, fingerprint, replay? }` | 100 ms | 0 retries; no backoff; in-process | N/A for network circuit (in-process); fail closed on missing context |
| BE01 party authority | `ResolveAuthority { actorPersonId, partyId, capability, contextVersion }` → `AuthorityDecision { allowed, authorityVersion, reasonCode }` | 300 ms | 2 retries at 50 ms and 100 ms | Open after 5 failures for 30 s; deny mutations while open |
| BE07 role/claim projection | `ResolveSongRole { songId, actorPartyId, capability }` → `RoleDecision { allowed, roleVersion, claimRefs }` | 400 ms | 2 retries at 75 ms and 150 ms | Open after 5 failures for 30 s; unknown role fails closed |
| BE00 storage quarantine | `StorageProbe { locator, checksum, settled }` → `StorageDecision { readable, checksum, residency }` | 1,000 ms | 3 retries at 100 ms, 250 ms, 500 ms | Open after 4 failures for 20 s; retain version and return `STORAGE_UNAVAILABLE` |
| BE00 outbox/queue | `OutboxEnvelope { eventType, aggregateId, version, payloadHash }` → `EnqueueReceipt { eventId }` | 500 ms | 3 retries at 100 ms, 300 ms, 900 ms | Open after 5 failures for 30 s; transaction remains uncommitted if receipt cannot be durable |

No provider receives lyric, chart, title, external reference, roster or body content beyond the authorized projection. Consumer shards receive opaque IDs and version hashes, not direct table access.

### State machines and concurrency

- Song lifecycle is `active ↔ shelved → archived`; `unadministered → active` is allowed only after BE01 restores authority. A non-empty song has no delete transition.
- A title, lyric, chart or brief append increments its own version under `SELECT ... FOR UPDATE`; the expected version and idempotency fingerprint must both match. Concurrent losers receive `VERSION_CONFLICT` and no partial row.
- Project membership is many-to-many. Release sequence is protected by unique `(release_id, sequence)` and a serializable transaction; a conflict leaves the prior order/readiness projection untouched.
- Milestones and completeness debt are advisory. Failure to answer or update them never blocks a stage transition and never renders false completion.
- Outbox consumers are at-least-once. Event handlers use `(event_type, aggregate_id, version)` deduplication; stale projections may lag but never widen authorization.

### Failure recovery

| Failure | Durable result | Retry/recovery |
|---|---|---|
| BE01 context moves | No domain mutation | Re-resolve context and retry with a new request key |
| Duplicate song proposal | Existing owner-scoped proposal remains separate | Return existing result for same key; never auto-merge |
| Release ordering race | One serializable winner, prior order retained for loser | Read current membership version and resubmit |
| Anchor or attribution missing | No document version appended | Correct payload and reuse a new key |
| Storage unsettled | Idea/document remains absent or `pending_storage`; no published pointer | Poll quarantine through BE00, then retry same key |
| Outbox outage | Transaction rolls back before response | Queue retry with same event fingerprint; no domain duplicate |
| Owner disappears | BE01 marks song `unadministered` or transfers authority | Read-only history remains available to authorized auditors |
| Brief reference conflicts | Both references and annotations persist | Producer resolves outside the API; no automatic adjudication |

## Event Schemas

### Payload contracts

| Event type | Required payload | Privacy and delivery |
|---|---|---|
| `project.song.changed.v1` | `eventId uuid`, `songId uuid`, `owningPartyId uuid`, `lifecycle`, `currentStage`, `songVersion bigint`, `changeKind`, `sourceHash text`, `occurredAt timestamptz` | No title, body, collaborator names or private reference URI; outbox at-least-once and consumer dedupe by event/version |
| `project.canonical.changed.v1` | `eventId uuid`, `songId uuid`, `slotId uuid`, `oldTargetId uuid?`, `newTargetId uuid?`, `reasonCode`, `version bigint` | This companion emits only membership/readiness invalidation notice when required; 09c owns canonical pointer facts |
| `project.review.changed.v1` | `eventId uuid`, `commentId uuid`, `versionId uuid`, `audienceHash text`, `state`, `anchorHash text`, `version bigint` | Consumed only; no comment text or link identity |
| `project.session.closed.v1` | `eventId uuid`, `sessionId uuid`, `songRefs uuid[]`, `grade`, `closedAt`, `batchKey`, `version bigint` | Consumed only; no attendance names or prompt payload |
| `project.package.generated.v1` | `eventId uuid`, `packageId uuid`, `specVersionId uuid`, `pinHash text`, `manifestHash text`, `checksum text` | Consumed only; no asset bytes or hidden gap fields |
| `project.source-declaration.changed.v1` | `eventId uuid`, `assetId uuid`, `sectionRef uuid?`, `state`, `kind`, `version bigint` | Consumed only; no source notes or unrestricted PII |
| `project.bridge.state-changed.v1` | `eventId uuid`, `deviceId uuid`, `agentVersion text`, `gateState`, `state`, `version bigint` | Consumed only; bridge remains disabled in v1 |
| `project.recall-projection-access.changed.v1` | `eventId uuid`, `sessionId uuid`, `sheetVersionId uuid`, `recipientPartyId uuid`, `grantState`, `expiresAt`, `policyHash`, `version bigint` | Consumed only; no projected content |

## Error Handling

### Boundary mapping

| Condition | HTTP | `code` | Safe details |
|---|---:|---|---|
| Missing or malformed title, stage, record or brief field | 400 | `VALIDATION_FAILED` | Field paths and expected bounds only |
| Hidden song, release or project | 404 | `RESOURCE_NOT_FOUND` | Empty details object |
| Known resource without capability | 403 | `FORBIDDEN` | Required action, never hidden names |
| Acting context version moved | 409 | `ACTING_CONTEXT_STALE` | Current context version omitted; retry action |
| Domain expected version moved | 409 | `VERSION_CONFLICT` | Aggregate and committed version hash |
| Reused key with different request | 409 | `IDEMPOTENCY_MISMATCH` | Original fingerprint hash only |
| Pinned master absent | 409 | `CANONICAL_UNSET` | Slot ID and required action |
| Pinned master checksum invalid | 422 | `INTEGRITY_FAILED` | Asset-safe reason, no bytes |
| Quarantine or queue unavailable | 503 | `STORAGE_UNAVAILABLE` or `DEPENDENCY_UNAVAILABLE` | Retry-after bucket and request ID |

### Operation error coverage

| Operation ID | 400 | 403 | 404 | 409 | 422/503 |
|---|---|---|---|---|---|
| `PRJ-01` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `ACTING_CONTEXT_STALE`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-02` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH`, `CANONICAL_UNSET` | `INTEGRITY_FAILED`, `DEPENDENCY_UNAVAILABLE` |
| `PRJ-03` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |
| `PRJ-04` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `STORAGE_UNAVAILABLE`, `DEPENDENCY_UNAVAILABLE` |
| `PRJ-22` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |

Every error serializes as `ApiError { code, message, requestId, details }` and is logged with the operation ID and decision reason, not the private payload.

## Observability

| Operation ID | Metrics | Structured logs | Trace and alerts |
|---|---|---|---|
| `PRJ-01` | `prj_song_mutation_total{action,result}`, latency, conflict rate | request ID, actor hash, party hash, song ID, lifecycle transition, idempotency replay | `prj.song.manage`; alert p95 > 700 ms or forbidden spike |
| `PRJ-02` | membership append, sequence conflict, pin rejection, readiness invalidation | release ID, song ID, sequence, pin hash, result | `prj.release.assemble`; alert duplicate-position rate and stale readiness lag |
| `PRJ-03` | stage transition, CAS conflict, debt append | song ID, old/new stage, capability, result | `prj.stage.move`; alert unexpected stage enum or conflict surge |
| `PRJ-04` | record kind, payload bytes, anchor rejection, storage latency | song ID, record ID, origin mode, body hash, result | `prj.creative.capture`; alert storage failures and body quota abuse |
| `PRJ-22` | brief append, reference kind, conflict count, URI validation failures | song ID, brief version, reference count, source hash | `prj.mix_brief.write`; alert third-party-byte attempts and p95 > 800 ms |

Logs never contain title, lyric, chart, prose, collaborator identity, external URI, signed URL or storage locator. Sentry receives request ID, operation ID and safe error code only.

## Testing Strategy

### Contract and route tests

| Operation ID | Required tests |
|---|---|
| `PRJ-01` | Zod rejects blank/overlong title, unknown fields and illegal lifecycle; owner create/rename/shelve/archive; 403 versus hidden 404; same-key replay; key mismatch; context stale; no-delete assertion; CORS preflight and exact ApiError shape |
| `PRJ-02` | Sequence uniqueness race; unreadable/compromised master; release-owner policy; song visibility; pin never latest; CAS conflict; idempotent replay; readiness invalidation; CORS and error envelope |
| `PRJ-03` | Closed stage enum; Producer/owner capability; stage CAS race; advisory debt never blocks; hidden 404 and known 403; replay; CORS and error envelope |
| `PRJ-04` | Idea/lyric/chart discriminator; anchor and attribution bounds; offline timestamp preservation; immutable version; body quota; storage quarantine; replay; CORS and error envelope |
| `PRJ-22` | Reference discriminant agreement; HTTPS URI and no upload; same-party platform version; contradictory reference retention; CAS conflict; replay; CORS and error envelope |

### Persistence, concurrency and recovery tests

- Migration tests assert every listed column type, nullability, check, foreign key, index, RLS policy and grant. Policy tests cover owner, Producer, contributor-self, hidden resource and support-service identities.
- Property tests generate lifecycle transitions and prove no non-empty song reaches delete, no arbitrary stage is accepted, and no document update mutates a prior version.
- Serializable race tests run release sequence edits and document/brief CAS edits concurrently; exactly one expected-version winner commits its audit and outbox row.
- Replay tests deliver duplicate outbox events, duplicate offline ideas and duplicate requests; each yields one domain effect and one stable result.
- Recovery tests quarantine unsettled storage, inject BE01/BE07 timeout and queue failures, reopen owner authority, and verify safe retry without private payload in logs.
- Playwright accessibility tests cover semantic board tables, keyboard stage actions, heading/line anchors, announcement of conflicts and screen-reader-safe denial text. No visual graph is required.

## Deepening Passes

| Pass | Evidence and resolution |
|---|---|
| Boundary | Verified container/document ownership against IA lines 9–24; no rights, credit, release-distribution or DAW route included |
| Interaction | Reconciled all five assigned IDs to one route and one operation matrix row |
| Contract | Added strict Zod 4 requests/responses, shared error object and field traceability |
| Authorization | Applied owner/Producer/contributor-self predicates and explicit hidden-404 versus known-403 behavior |
| Persistence | Typed every assigned table field, FK/opaque reference rationale, index, RLS predicate and grant |
| Concurrency | Added idempotency fingerprints, serializable membership ordering and document/brief CAS |
| Failure | Covered owner loss, storage quarantine, queue outage, duplicate replay, stale version and contradictory brief references |
| Privacy | Removed bodies, title and external URI from events/logs and bounded projections before lookup/count |
| Accessibility | Added semantic tables, keyboard actions, line anchors, dignified debt/error states and denial action text |
| Cross-shard | Inherited BE00 and bounded BE01/BE07/09c seams with timeout, retry and circuit behavior; no unresolved implementation choice added |

## Ambiguity Gate

PASS. Evidence: operation ownership is one-to-one for `PRJ-01`, `PRJ-02`, `PRJ-03`, `PRJ-04`, and `PRJ-22`; route paths are unique; lifecycle and stage are separate; release membership never copies audio truth; lyric/chart versions are independent; external commercial references are URI-only; `engagement_ref` is nullable and owned by the later revision-round companion; every refusal has a typed error and recovery; every persistence field has type/nullability/constraint and access treatment; and all tables, links, markers and matrix identifiers pass structural checks.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored bounded container and creative-document backend companion from IA Shard 09 and deep dive | `/write-be-spec` | All |
| 2026-08-28 | Locked route registry, strict Zod 4 contracts, typed persistence, RLS/grants, failure matrices and ambiguity evidence | `/write-be-spec-write` | API, contracts, database, security, tests |

## Dependency References

- [BE00 Cross-cutting platform foundation](00-infrastructure.md) — inherited request context, `ApiError`, idempotency, audit, storage, outbox and cache contracts.
- [IA Shard 01 Identity authority](../ia/01-identity-authority.md) — owning party, acting context and succession; this companion never creates identity truth.
- [IA Shard 07 Credits core](../ia/07-credits-core.md) — role taxonomy and credit boundary; this companion stores no credit or rights facts.
- [IA Shard 09 parent](../ia/09-projects-collaboration.md) — source of truth for all assigned interactions, models, events and feature boundaries.
- [IA Shard 22 Release and distribution](../ia/22-release-distribution.md) — downstream release-local enrichment; project song and document truth remains here.
