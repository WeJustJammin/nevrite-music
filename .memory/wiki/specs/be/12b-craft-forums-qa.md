# Craft forums and professional Q&A — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]  
**Deep Dive:** None required by the approved IA

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

- **Shard split:** 2 of 4; SPC-06. This contract intentionally remains small because forum participation must not become a reputation or authority subsystem.
- **Boundary:** professional-authored bounded craft questions/answers, credential context, revision history, Fan read-only access and Shard 06 moderation.
- **Approval:** Recommended split accepted under standing autonomy.

## Forum Invariants

- Professional acting parties may author; Fans are read-only. Acting context is visible and never unions across personas.
- Questions/answers are bounded, versioned craft discussion. No participation points, streaks, badges, karma, leaderboard or forum-derived trust/eligibility exists.
- Verified credentials may render as factual context but never alter correctness, rank, moderation weight or accepted-answer authority by themselves.
- Ranking uses allowlisted relevance, evidence links, freshness and explicit viewer controls—never engagement outrage, private graph, CRM, protected traits or post volume.
- Edits append versions; retraction preserves a tombstone/history. Moderation follows Shard 06 object-level controls and cannot expel scene members by default.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 envelopes including acting context and idempotency.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/craft-threads` | scene/topic/title/body/evidence refs; professional party/key | `201 CraftThreadResponse`; thread/version/moderation state | `403 FAN_POST_FORBIDDEN`, `409`, `422 CONTENT_INVALID`, `429` |
| `GET /api/v1/craft-threads` | scene/topic/state/cursor/limit<=50 | `CraftThreadPage`; authorized items/reason labels/freshness | `422`, `429`, `503` |
| `GET /api/v1/craft-threads/{id}` | public/authorized viewer | `CraftThreadDetailResponse`; thread/answers/history-safe context | `404`, `429`, `503` |
| `POST /api/v1/craft-threads/{id}/answers` | body/evidence refs; professional party/key | `201 CraftPostResponse`; answer/version/moderation state | `403 FAN_POST_FORBIDDEN`, `404`, `409 THREAD_CLOSED`, `422`, `429` |
| `POST /api/v1/craft-posts/{id}/revisions` | corrected body/retract reason; author ETag/key | `CraftPostResponse`; successor/tombstone version | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/craft-posts/{id}/moderation-reports` | reason/evidence refs; viewer/key | `201 CaseLinkResponse`; Shard 06 receipt | `403`, `404`, `409`, `422`, `429` |

Reads are 120/min/IP; threads 10/day/party; answers 30/day/party; revisions 30/min/post; reports use Shard 06 admission rules. Draft/moderation responses are no-store. Raw bodies and private reporter data are omitted from logs/events.

## Persistence, RLS and Workers

Tables: `space.forum_threads`, `forum_posts`, `forum_post_versions`, `forum_evidence_refs` and moderation links. RLS applies visibility/restrictions before counts/search. Search workers index only active authorized content and factual credential projections; no reputation aggregate table or API exists. Events carry thread/post/author-party/state/moderation/version only.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Craft thread | `pending_moderation → open|rejected|quarantined`; open `→ closed|removed|restricted`; restricted may return open after an authorized outcome | Professional author command and Shard 06 moderation trigger. Fan authoring, invalid content or current restriction blocks; closure blocks new answers. |
| Craft post/version | `pending_moderation → active|rejected|quarantined`; active `→ superseded|retracted|removed`; superseded/retracted preserve history/tombstone | Author revision/retraction or moderation outcome triggers. Stale expected version or non-author revision blocks; credential never changes transition authority. |
| Forum search projection | `indexable → stale|suppressed|removed`; stale `→ indexable` only after current authorization/content rebuild | Post/thread/moderation/restriction change triggers. Non-active content exits search/counts; no reputation or participation aggregate is created. |
| Moderation report link | `submitted → admitted|rejected|linked|closed` under Shard 06 | Viewer report and Shard 06 admission/case outcome trigger. Forum cannot expel scene members or expose reporter data through this state. |

Every unlisted transition returns the typed state/version/moderation conflict. Events omit raw bodies, private reporter data and prohibited engagement metrics.

## Failure, Deepening and Ambiguity Gate

Tests cover Fan posting, persona mixing, credential rank boost, participation-point insertion, engagement feature injection, restriction arrival, stale edit, retraction/search removal and moderation replay. Seven passes converge; two implementers receive identical authorship, ranking and moderation behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Craft forum/Q&A contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/12a-scenes-stewardship-seeding|Scenes, stewardship and derived place/event seeding — Backend Specification]]
