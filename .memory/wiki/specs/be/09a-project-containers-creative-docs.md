# Project containers, release boards and creative documents — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]  
**Deep Dive:** [[specs/ia/deep-dives/09-projects-collaboration|Project collaboration deep dive]]

**Error Architecture:** Every endpoint uses [[specs/2026-08-02-architecture-design#error-architecture|Architecture Design § Error Architecture]] with `{ code, message, details, requestId }`; `code` is the application enum listed by the endpoint, never an HTTP-status string.  
**Error Recovery:** For every endpoint code, `400|401|403|404|415|422` is non-retryable without corrected input/authority; `409|412|428` requires refetch or prerequisite repair; `429` retries only after `Retry-After`; `502|503|504` retries idempotent reads and committed-key mutations with jitter after status reconciliation; `500` is never blindly retried.  
**Endpoint Security:** Every endpoint rejects unknown fields through strict Zod validation at middleware stage 8, normalizes bounded text and rejects control/format smuggling before domain execution. Response serialization allowlists only the named success/error schema and excludes secrets, tokens, raw provider payloads, SQL, stack traces, private policy predicates, restricted evidence and PII not explicitly named in that response.  
**Endpoint Middleware:** The route's request/authorization cell selects exactly one non-implicit profile: public/cacheable read `120/min/IP`; authenticated read `300/min/user` and `600/min/party`; search `60/min/user` or `30/min/IP`, max 50; ordinary mutation `60/min/user` and `120/min/party`; high-risk command `10/min/user`; admin read/command `120/10 per min/user`; signed provider/webhook `300/min/provider`; internal worker `300/min/service principal`. All run the fixed Shard 00 middleware order. Browser `/api/v1` permits credentialed exact first-party origins only with documented methods/headers and 10-minute-max preflight; `/internal/v1` and worker/provider routes deny browser CORS. `429` includes `Retry-After` and RateLimit headers.  
**Concurrency and Collections:** Every retryable `POST` reserves `Idempotency-Key`; internal/event writes additionally enforce the named producer/event uniqueness key. `PUT|PATCH|DELETE` require `If-Match`/expected version and return `428` when absent and `409 VERSION_CONFLICT` when stale; named allocator, claim, close or lease operations use the stronger serializable/row-lock/unique-key rule stated in the endpoint invariants. Every unbounded collection uses opaque cursor pagination with default `25`, maximum `50`, stable `(created_at DESC, id DESC)` order, only the filters/sorts named in its request cell, and `nextCursor: null` at exhaustion. Explicit bounded embedded arrays/registries return the complete allowlisted set with maximum 50 and no pagination.  
**External Seam:** When an endpoint names a provider/adapter, its outbound request is the strict allowlisted adapter DTO derived from that endpoint's request cell and its response is reduced to the named success fields before domain use; raw payloads never cross the adapter. Synchronous calls have a `5,000 ms` deadline. Idempotent reads retry at most twice with jittered `250 ms` then `1,000 ms` backoff; mutations do not retry after an ambiguous outcome and enter the named reconciliation state. The circuit opens after five consecutive retryable failures for 60 seconds, then admits one probe; exhausted work returns `502|503|504` or the explicit queued/unknown state.  
**IA Traceability:** Every endpoint/worker below implements only the interaction IDs allocated in `## Classification`; its domain request and success tokens are exact projections of the cited IA shard `## Contracts` and `## Data Model`, while transport-only `requestId`, idempotency, version, cursor and error fields derive from [[specs/be/00-infrastructure|Shard 00]]. No endpoint or field may be inferred outside those cited sections; a new field requires contract evolution.  
**Schema Grammar:** Every request/response token expands through [[specs/be/00-infrastructure#normative-schema-grammar|Shard 00 § Normative Schema Grammar]] into an exact strict Zod 4 and PostgreSQL type; local constraints only narrow it. Optionality/nullability must be written, and an unresolved token blocks implementation rather than becoming `any`, `unknown` or free text.  
**Persistence Grammar:** Every locally named table/record expands through [[specs/be/00-infrastructure#normative-persistence-grammar|Shard 00 § Normative Persistence Grammar]] for exact types, non-null defaults, FK/delete actions, uniqueness, query-matched indexes, RLS/grants and atomic audit/outbox behavior. A missing local field, relationship, state or query blocks implementation.  

## Classification

- **Shard split:** 1 of 5; PRJ-01 through PRJ-04. Rights, credits, roster access, audio versioning and delivery remain separate contracts.
- **Boundary:** song/project/release containers, fixed production-stage events, advisory milestones/completeness debt, immutable idea capture and independently versioned lyric/chart documents.
- **Approval:** Recommended split accepted under standing autonomy.

## Container and Document Invariants

- A song requires only title and owning party. It is a collaboration container, never a rights/split/payment object; ownership here means administrative authority only.
- Lifecycle `active|shelved|archived|unadministered` and production stage are independent. Stages come from a code-owned versioned fixed set; arbitrary user/admin stages are forbidden. Non-empty songs archive and never hard-delete.
- Projects and releases reference songs through versioned membership edges. Release sequence, variant and selected master pin exact source IDs/versions; no song/version truth is copied into the release.
- Milestones, deadlines and capture prompts are advisory. Missing work records explicit target-specific completeness debt; it never blocks stage movement or becomes false completion.
- Offline ideas are immutable, nameless capture artifacts with origin/device operation and local timestamp preserved. Promotion creates a new titled artifact without changing the idea record.
- Lyric and chart documents version independently. Lyrics preserve line authorship/history; charts preserve sections, chord symbols and source key so transposition is a projection, not a destructive edit.

## API Endpoint Matrix

All bodies are strict Zod 4 objects. Commands inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/songs` | `CreateSongRequest`: title, owning party, confidentiality; party authority/key | `201 SongResponse`; song/title/lifecycle/stage/version | `403`, `409 DUPLICATE_SONG_CANDIDATE|IDEMPOTENCY_MISMATCH`, `422`, `429` |
| `GET /api/v1/songs` | owner/project/stage/lifecycle cursor; authorized workspace viewer | `SongPage`; post-authorization items/count/freshness | `403`, `422`, `429`, `503` |
| `PATCH /api/v1/songs/{songId}` | `UpdateSongRequest`: lifecycle or new title version, reason; owner/Producer ETag/key | `SongResponse`; new container/title version | `403`, `404`, `409 VERSION_CONFLICT`, `422 NONEMPTY_DELETE_FORBIDDEN`, `428`, `429` |
| `POST /api/v1/songs/{songId}/stage-events` | `MoveStageRequest`: fixed stage/version and reason; configured role ETag/key | `201 StageEventResponse`; stage event and debt refresh | `403`, `404`, `409 STAGE_SET_OR_VERSION_CONFLICT`, `422 STAGE_INVALID`, `428`, `429` |
| `POST /api/v1/projects` | `CreateProjectRequest`: title, owning party, purpose; authority/key | `201 ProjectResponse`; project/version | `403`, `409`, `422`, `429` |
| `PUT /api/v1/projects/{projectId}/songs/{songId}` | `ProjectSongMembershipRequest`: purpose; project authority ETag/key | `ProjectMembershipResponse`; active edge/version | `403`, `404`, `409 MEMBERSHIP_EXISTS|VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/releases` | `CreateReleaseRequest`: title, owning party; authority/key | `201 ReleaseResponse`; release/version | `403`, `409`, `422`, `429` |
| `PUT /api/v1/releases/{releaseId}/memberships` | `ReleaseMembershipSetRequest`: ordered unique song/variant/master-version rows; owner ETag/key | `ReleaseMembershipVersionResponse`; exact ordered edge set/readiness job | `403`, `404`, `409 SOURCE_OR_VERSION_CONFLICT`, `422 SEQUENCE_OR_MASTER_INVALID`, `428`, `429` |
| `POST /api/v1/songs/{songId}/milestones` | `MilestoneRequest`: fixed kind, target time, scope; authorized role/key | `201 MilestoneResponse`; advisory milestone/version | `403`, `404`, `409`, `422`, `429` |
| `POST /api/v1/ideas/offline-operations` | `IdeaOperationBatch`: device ID and immutable operations<=100 with local times; authenticated contributor/key | `IdeaOperationResult`; accepted IDs/artifact IDs/server times | `403`, `409 DEVICE_OP_REUSED`, `422 BATCH_INVALID`, `429`, `503` |
| `POST /api/v1/ideas/{ideaId}/promotions` | `PromoteIdeaRequest`: target song, artifact kind, title; idea author/key | `201 CreativeArtifactResponse`; linked artifact/version, idea unchanged | `403`, `404`, `409 ALREADY_PROMOTED`, `422`, `429` |
| `POST /api/v1/songs/{songId}/lyric-versions` | `CreateLyricVersionRequest`: parent version, sections/lines/line-author refs; authorized contributor/key | `201 LyricVersionResponse`; immutable version/hash | `403`, `404`, `409 PARENT_STALE`, `422 ATTRIBUTION_OR_STRUCTURE_INVALID`, `429` |
| `POST /api/v1/songs/{songId}/chart-versions` | `CreateChartVersionRequest`: parent, source key, sections/chord symbols; authorized contributor/key | `201 ChartVersionResponse`; immutable source version/transposition metadata | `403`, `404`, `409 PARENT_STALE`, `422 CHART_INVALID`, `429` |

Reads are 240/min/person; container/stage/membership writes 60/min; offline idea batches 30/min/device; creative document versions 120/hour/song/person. Private responses are no-store and every mutation is audited. Search, counts and duplicate proposals apply confidentiality before aggregation.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `project.songs` / `song_title_versions` / `stage_events` | owning party/lifecycle/current fixed stage/confidentiality/version and append-only title/stage history; no rights fields |
| `project.projects` / `project_song_memberships` | project owner/purpose/version and many-to-many effective membership edges |
| `project.release_containers` / `release_memberships` | ordered song/variant/exact master-version pins; unique release position and song/variant per version |
| `project.milestones` / `completeness_debts` | advisory target and explicit unresolved/resolved/deferred debt with source version |
| `project.idea_artifacts` / `idea_device_operations` | immutable nameless content/origin/local time/device op hash/promotion links |
| `project.lyric_document_versions` / `lyric_lines` | parent/hash/sections and immutable line text/author/source-line lineage |
| `project.chart_versions` / `chart_sections` | parent/hash/source key and version-pinned chord symbols/section anchors |

RLS is owning-party/project-membership/confidentiality bound and uses Shard 01 acting authority. `unadministered` removes mutation authority without removing authorized historical reads. Serializing stage and release-membership RPCs compare exact versions and append events atomically. Workers build board/search/readiness projections from source versions; projection lag exposes freshness and never blocks canonical writes.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Song lifecycle | `active ↔ shelved`; `active|shelved → archived|unadministered`; unadministered may return active only after valid authority; archived remains archived | Owner/authority lifecycle command triggers. Non-empty delete is forbidden; lifecycle never changes rights/splits/payment. |
| Project/release membership | `active → removed|superseded` | Authorized edge/set replacement triggers. Source/version conflict blocks; removal preserves history and never deletes song/version truth. |
| Milestone/completeness debt | `open → resolved|dismissed|superseded`; resolved may be superseded by new source debt | Advisory action/source change triggers. Open debt never blocks stage; dismissal never becomes false completion. |
| Idea artifact | immutable `captured`; promotion creates linked artifact and records `promoted` relation | Offline op/promotion triggers. Captured idea never mutates or gains title; duplicate promotion conflicts. |
| Lyric/chart document version | immutable append-only root/successor; current pointer `active → superseded` | Authorized new version triggers. Stale parent/invalid attribution or chart structure blocks append; transposition never edits source. |

Every unlisted transition returns the typed state/version conflict. Event carries safe lifecycle/stage/version/hash and no rights conclusion.

## Failure, Deepening and Ambiguity Gate

Tests cover duplicate proposals without auto-merge, vanished owner/unadministered transition, non-empty deletion, stage/version races, advisory deadline expiry, release reorder/master-source races, hidden-container count inference, offline operation replay, local/server clock skew, idea promotion immutability, lyric concurrent lineage/attribution and chart transposition without source mutation. No endpoint creates rights/splits or arbitrary stages. Logs omit confidential titles/content. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical container, debt, idea and document behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Project container and creative-document contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/deep-dives/09-projects-collaboration|Deep Dive 09 — Music projects and collaboration]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
