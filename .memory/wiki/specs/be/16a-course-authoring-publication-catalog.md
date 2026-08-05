# Course authoring, publication and catalog — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]  
**Deep Dive:** [[specs/ia/deep-dives/16-education-credentials-institutions|Course and institution deep dive]]

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

- **Shard split:** 1 of 4; EDU-CI-01, EDU-CI-02, EDU-CI-03, EDU-CI-04 and EDU-CI-08.
- **Boundary:** adult individual-owned drafts, immutable revisions, governed media, complete-edition publication, safe catalog projection, living updates and scoped withdrawal.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 16 IA/deep dive | course authoring/publication/catalog interactions, canonical fields and publication algorithm |
| Shards 00, 01, 02, 03 and 06 | upload/media, adult authority, read-only evidence, governed settings and moderation |

## Publication Invariants

- Launch author is an eligible adult individual with explicit ownership/licence assertions; uploader identity never implies authorship or rights.
- Draft and outline revisions are immutable successors with optimistic conflict. A paid edition publishes only when every advertised lesson exists and every required medium is playable.
- Publication requires title, instrument, level, audience, preview, at least one paid lesson, one-off offer, tax class, refund policy, rights and moderation pass. Unfinished future promises cannot be sold.
- Governed author-intake setting may change eligibility breadth but cannot weaken completeness, rights, age, privacy or moderation gates.
- Shard 02 evidence is read-only, source-labelled and not author-selectable, reorderable or convertible into a quality claim. Evidence absence is neutral.
- Publication atomically commits frozen revision, state, audit and outbox. Catalog consumes only the published projection with territory/age/availability filtering.
- Later additions are free living-entitlement updates. Delisting stops new sales but preserves buyer access; rights/safety/legal takedown removes only the smallest lawful scope.
- Offline governed-media bytes are deferred; launch uses authorized streaming. External embeds never satisfy media availability or rights requirements.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Mutations audit actor/party/source hashes and media workers expose stable job IDs.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/courses` | owner/policy/title seed; eligible adult author/key | `201 CourseResponse`; private draft/version | `403 AGE_GATE_DISABLED`, `409`, `422 CLINICAL_PURPOSE_FORBIDDEN`, `429` |
| `POST /api/v1/courses/{id}/revisions` | outline/lesson metadata/contributors/rights; owner ETag/key | `201 CourseRevisionResponse`; immutable revision/diff | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/course-lessons/{id}/media-intents` | purpose/MIME/size/checksum/rights source; contributor/key | `201 UploadIntentResponse`; private reservation/job refs | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /internal/v1/course-media/{id}/process` | object/checksum/scan-transcode policy/event; worker/key | `CourseMediaResponse`; playable/retryable/quarantined | `403`, `409 EVENT_REUSED`, `422`, `429`, `503` |
| `POST /api/v1/course-revisions/{id}/publication-preflights` | candidate/offer/preview/evidence/policy versions; owner/key | `PublicationPreflightResponse`; exact gaps/hash | `403`, `409 SOURCE_STALE`, `422 EDITION_INCOMPLETE|RIGHTS_FAILED`, `429`, `503` |
| `POST /api/v1/course-revisions/{id}/publish` | preflight hash/expected version; owner/key | `201 PublishedCourseResponse`; revision/projection/version | `403`, `409 PREFLIGHT_STALE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/courses` | territory/age/instrument/level/availability/cursor | `CourseCatalogPage`; eligible projections/freshness | `422`, `429`, `503` |
| `GET /api/v1/courses/{id}` | territory/age/availability context | `PublishedCourseResponse`; price/preview/author/evidence | `404`, `409 REVISION_UNAVAILABLE`, `429`, `503` |
| `POST /api/v1/courses/{id}/withdrawals` | delist or scoped takedown/source mandate; owner or authorized reviewer/key | `CourseWithdrawalResponse`; affected sales/access scope | `403`, `409 SOURCE_STALE`, `422 SCOPE_TOO_BROAD`, `429` |

## Persistence, RLS and Workers

- `course`, `course_revision`, `course_lesson_revision`, `course_contributor` and `course_media` use immutable revision references; contributor rows require role plus ownership/licence mandate evidence.
- `course_publication` uniquely binds one course/revision/offer/policy tuple. Catalog projection excludes draft text, private contributor evidence and storage identifiers.
- RLS grants draft/revision access to explicit contributors, published safe projection to eligible viewers and quarantine evidence only to assigned reviewers. Known minors fail before existence-sensitive catalog details.
- Media processing retries `2s/8s/32s`, then durable queue; draft state survives. Publication transaction locks candidate sources and emits one idempotent projection event.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Course | `draft → published`; published `→ delisted|scoped_takedown|retired`; delisted may republish through a current eligible revision | Adult owner publish/withdrawal command triggers. Clinical purpose, incomplete edition, rights/moderation/age failure blocks. Delisting preserves buyer access. |
| Course revision | immutable `draft → publication_candidate → published|blocked`; published `→ superseded` by a later published revision | Contributor append, preflight and atomic owner publish trigger. Stale source/version or missing advertised lesson/media blocks; prior/live buyer history never rewrites. |
| Course media | `reserved → uploading → processing → playable|quarantined|failed`; failed may retry durably; playable `→ withdrawn|unavailable` | Checksum/scan/transcode/rights evidence triggers. External embed or unavailable/unlicensed medium cannot satisfy publication. |
| Catalog projection | `active → stale|delisted|suppressed`; stale `→ active` after current authorized rebuild | Publication, territory/age/availability/policy or withdrawal change triggers. Draft/private contributor/storage data never projects. |

Every unlisted transition returns the typed state/version/publication-gate conflict. Events omit draft text, private evidence and storage identifiers.

## Failure, Deepening and Ambiguity Gate

Tests cover implied ownership, thin-course publication, external-embed substitution, unplayable media, author-edited evidence, missing-evidence penalty, setting bypass, revision race, catalog leakage, paid update, delist entitlement loss and overbroad takedown. Seven passes converge; two implementers receive identical authoring and publication behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Course authoring/publication contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/ia/deep-dives/16-education-credentials-institutions|Deep Dive 16 — Courses and institutions]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/02c-credentials-trader|Credentials and trader evidence — Backend Specification]]
- [[specs/be/03b-editorial-workflow-publication|Editorial workflow and publication — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/ia/deep-dives/16-education-credentials-institutions|Deep Dive 16 — Courses, credentials, institutions and special practice]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/02c-credentials-trader|Credentials and trader-status assessment — Backend Specification]]
- [[specs/be/03b-editorial-workflow-publication|CMS entries, revisions, review, scheduling and publication — Backend Specification]]
