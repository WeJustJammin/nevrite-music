# Activity feed, controls and native posts — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]  
**Deep Dive:** [[specs/ia/deep-dives/11-community-graph|Community graph deep dive]]

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

- **Shard split:** 2 of 5; COM-04 through COM-06. Source domains own event eligibility and truth; this contract owns viewer-safe projection, ranking, preferences and subordinate posts/reactions.
- **Boundary:** allowlisted typed events, actionability/evidence-first rank, alert bypass, private mute controls, professional native posts and moderation linkage.
- **Approval:** Recommended split accepted under standing autonomy.

## Feed Invariants

- Source domain supplies eligibility, amendment/retraction semantics and exact versions. Feed never strengthens source state or turns projections into canonical events.
- Candidate selection rechecks viewer authorization, blocks/restrictions, acting party, source eligibility and feed preferences before ranking/counts/cache.
- Alert-class events bypass ordinary rank. Ordinary order uses allowlisted actionability, evidence class, geography/proximity, timeliness and explicit viewer controls—never dwell, clicks, reactions, outrage or protected traits.
- Native posts structurally remain below evidenced domain events; scene membership may admit but never boost/tie-break. Fan may read/react but cannot author professional posts.
- Responses include readable reason labels and source freshness, never numeric score, hidden alternatives, muted-source identity or private graph/CRM/message inputs.
- Mutes by entity/type/domain and control changes are viewer-private and silent. Source retraction visibly amends/removes with tombstone under source policy, never silent rewrite.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 envelopes including acting context and idempotency.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/feed` | acting party, domains/types/geography cursor, limit<=50 | `FeedPage`; authorized items/reason labels/source versions/cursor/freshness | `403`, `422 CURSOR_INVALID`, `429`, `503` |
| `PUT /api/v1/me/feed-preferences` | muted parties/types/domains and bounded controls; acting party ETag/key | `FeedPreferenceResponse`; private version/effective projection version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/posts` | bounded plain text/media refs/visibility; professional party/key | `201 NativePostResponse`; moderation/state/version | `403 FAN_AUTHOR_FORBIDDEN`, `409`, `422 CONTENT_INVALID`, `429` |
| `PATCH /api/v1/posts/{id}` | successor content/reason; author ETag/key | `NativePostResponse`; new version/history | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `DELETE /api/v1/posts/{id}` | author/moderation outcome ETag/key | `204`; retracted tombstone/version | `403`, `404`, `409`, `428`, `429` |
| `PUT /api/v1/posts/{id}/reactions/{kind}` | bounded reaction; authenticated viewer/key | `ReactionResponse`; state/version/count after authorization | `403`, `404`, `409`, `422 REACTION_INVALID`, `429` |
| `DELETE /api/v1/posts/{id}/reactions/{kind}` | viewer ETag/key | `204`; ended state | `403`, `404`, `409`, `428`, `429` |

Feed reads are 120/min/person; preferences 30/min; posts 20/day/party; edits 30/min/post; reactions 120/min/person. Feed responses may use viewer/version-bound short caches; preferences and moderation are no-store.

## Persistence, RLS and Workers

Tables: `community.activity_event_projections`, `feed_preferences`, `native_posts`, `post_reactions` and moderation/audit links. Projection rows pin source event/domain/object/eligibility/evidence/geography/actionability/amendment/version.

RLS applies viewer/acting-party/source visibility before candidate selection and counts. Projection workers consume allowlisted outbox events idempotently; rank is deterministic over versioned allowlisted features. Cache keys include viewer party and policy/block/preference/projection versions. Moderation outcomes use Shard 06 and cannot expose private CRM.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Activity event projection | `eligible → amended|retracted|ineligible|stale`; amended may return `eligible` only from a newer authorized source version | Allowlisted source event and authorization/policy refresh trigger. Projection never strengthens source state; retracted/ineligible content cannot rank or count. |
| Feed preference version | immutable active version; current pointer `active → superseded` | Viewer-authorized full preference replacement triggers. Stale expected version blocks; mutes remain private and notify nobody. |
| Native post | `pending_moderation → published|rejected|quarantined`; published `→ amended|retracted|removed`; amended may yield a successor pending moderation | Author command or Shard 06 outcome triggers. Fan authoring, invalid content, stale version or non-author/non-moderation delete blocks; history/tombstone follows source policy. |
| Post reaction | `active → ended`; ended `→ active` only through a new explicit reaction version | Authenticated viewer add/remove triggers. Hidden/ineligible post or stale version blocks; counts authorize before aggregation. |
| Viewer feed cache | `fresh → stale → rebuilding → fresh|failed` | Any viewer policy/block/preference/projection version change invalidates. Stale/failed cache cannot be served as current or leak prior authorization. |

Every unlisted transition returns the typed state/version/authorization conflict. Ranking events expose allowlisted reason/freshness data only, never hidden alternatives, private controls or numeric score.

## Failure, Deepening and Ambiguity Gate

Tests cover source retraction, stale authorization/cache, muted-source silence, alert bypass, structured-event precedence, scene non-boost, prohibited engagement features, missing score input, Fan authoring, reaction count leakage and moderation replay. Seven passes converge; two implementers receive identical eligibility/rank/control behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Feed and native-post contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/deep-dives/11-community-graph|Deep Dive 11 — Social graph and collaborator network]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/11a-follows-connections-endorsements|Follows, professional connections and endorsements — Backend Specification]]
