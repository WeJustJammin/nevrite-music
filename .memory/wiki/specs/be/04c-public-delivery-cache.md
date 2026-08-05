# CMS public delivery, projection convergence and cache coherence — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]  
**Deep Dive:** [[specs/ia/deep-dives/04-cms-delivery-media|CMS delivery deep dive]]  
**Publication Source:** [[specs/be/03b-editorial-workflow-publication|CMS publication workflow]]

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

- **Shard split:** 3 of 3; DLV-09 through DLV-12.
- **Boundary:** render-ready public/authenticated read models, exact preview delivery, publication consumer convergence, active pointer switching, caching, urgent purge and degraded recovery.
- **Approval:** Recommended split accepted under standing autonomy.

## Delivery Invariants

- Public reads select active render-ready projection tables/immutable objects only; draft/admin fields are structurally absent. Preview/admin are separate no-store paths.
- Required route/render/menu/media states must be ready before active pointer switch. Search/sitemap/social may lag only when correctness/privacy/discovery remain unchanged.
- Public HTML/read models default edge max-age 60s plus stale-while-revalidate 300s; hashed static assets immutable one year. Auth/admin/preview no-store. Settings may tighten by route class but cannot weaken revocation/privacy floors.
- Last-known-good requires previously verified active projection, current authorization, staleness bound and no urgent rights/privacy/security/takedown block. Unknown/unsafe is unavailable, never empty/healthy.

## API and Consumer Matrix

| Surface | Request / contract | Success | Errors/failure |
|---|---|---|---|
| `GET /api/v1/content/by-route` | normalized route, BCP-47 locale, audience derived server-side | exact publication resource/render descriptor, ETag/version, cache policy | `404 CONTENT_NOT_FOUND`, `422`, `429`, `503 CONTENT_UNAVAILABLE`, `500` |
| `GET /api/v1/content` | declared type/taxonomy cursor filters only | `CursorPage` active projections | same; dependency failure never returns empty set |
| `GET /preview/{token}` | Shard 03 opaque token; current user/context/capability/version/audience rechecked | exact no-store/noindex preview | existence-safe `404`, `403`, `429`, `503`; never public cache |
| publication projection worker | `cms.publication.changed.v1` exact publication/version | builds route/render/menu/media plus allowed optional consumers | stale lease ignored; retry/dead-letter with visible consumer state |
| active-pointer coordinator | required consumer-ready records | atomic route/locale/audience pointer switch + `delivery.projection.ready.v1` | no partial public switch |
| `GET /api/v1/cms/publications/{id}/delivery-status` | publisher/operator capability | each consumer expected/current version/state/attempt/error class | `403`, `404`, `429`, `503` |
| `POST /api/v1/cms/publications/{id}/rebuild-jobs` | exact publication/version/consumer list; key | `202 JobStatus` idempotent rebuild | `409 PUBLICATION_SUPERSEDED|CONSUMER_UNKNOWN`, `422`, `429` |
| `POST /api/v1/delivery/purges` | subject/version/scope/reason/urgent; assigned operator MFA or trusted event; key | `202 JobStatus`; canonical purge ID | `403 STEP_UP_REQUIRED`, `409 SCOPE_STALE|PURGE_EXISTS`, `422`, `429` |
| purge/recovery status | `GET /api/v1/delivery/purges/{id}` and recovery comparison job | provider attempt evidence and completed/partial state | urgent partial remains incident/open; no false completion |

Public cache reads: 120/min/IP, burst 30/10s; authenticated reads 300/min/user. Admin/status 120/min; rebuild/purge 10/min. Critical projection/purge traces 100%; public successes 1%.

## Projection, Persistence and RLS

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Publication projection | `pending → building → ready|failed|blocked`; ready `→ stale|superseded` | Publication event/compiler triggers. Missing required route/render/menu/media state blocks ready; stale/failed projection never becomes active. |
| Projection consumer | `pending → running → ready|failed_retryable|dead_letter|suppressed` | Named consumer lease/current expected version triggers. Stale lease ignored; required non-ready blocks pointer, optional suppressed only when correctness/privacy unchanged. |
| Active delivery pointer | `active → superseded|revoked` | Atomic coordinator compares required ready versions then switches. Partial set, stale publication or urgent revocation blocks/clears pointer; superseded cannot reactivate. |
| Delivery purge | `pending → running → completed|partial|failed_retryable|blocked` | Urgent/ordinary purge worker/provider evidence triggers. Any required provider failure keeps partial/open; only complete evidence permits completed. |
| Recovery comparison | `queued → running → completed|partial|failed` under Shard 00 JobStatus | Operator/current canonical-versus-provider comparison triggers. Unknown/unsafe state cannot be labelled healthy and never widens last-known-good. |

Every unlisted transition returns the typed state/version conflict and preserves the last safe active projection only within its authorization/staleness bound.

| Table | Invariants |
|---|---|
| `delivery.publication_projections` | publication/manifest/locale/audience/render/discovery/refs/state/version; no control fields |
| `delivery.projection_consumer_states` | publication/consumer/expected/state/attempt/error/time; unique tuple |
| `delivery.active_delivery_pointers` | route/locale/audience to projection/manifest/switch/version; one active tuple |
| `delivery.delivery_purges` / attempts | canonical subject/version/scope/reason/urgent/state/evidence/provider refs; append attempts |

Projection worker loads exact schema/template/block/pattern/taxonomy/locale/settings versions, current authorized domain bindings, route/menu/discovery and eligible media; creates bounded payload/hash. Active switch is compare-and-swap by publication/version so stale builders cannot replace newer pointer. Public role selects active projections only; preview/publisher/operator/service roles have separate views/grants.

Cache keys bind route/locale/audience/publication/version. Event purge targets route/tag/version. Private local caches additionally bind user/acting party/contract and purge on logout/context change. Public immutable media paths change or deactivate on urgent takedown—signed URL expiry alone is insufficient.

## Degraded Recovery, Deepening and Ambiguity Gate

- Control-plane/consumer outage serves safe last-known-good; response may carry safe degraded status. No safe projection returns explicit unavailable, never wrong locale/jurisdiction/draft.
- Recovery compares canonical publication/manifest/purge to every consumer, rebuilds stale/missing projections, purges stale keys and verifies synthetic routes/media.
- Required consumer partial failure blocks pointer; optional lag remains visible and cannot violate SEO/privacy/correctness.
- Revocation transaction independently blocks affected projection before purge; stale LKG is denied. Urgent partial purge is Severity 1 and remains open.
- Tests cover public draft/cache leak, exact-version preview BOLA, stale builder CAS, required/optional readiness, duplicate events, ETag/cache keys, LKG authorization/staleness, revoked content, partial purge/recovery, locale/audience separation, error-not-empty and telemetry redaction.

Seven deepening passes converge across consistency, projection races, consumer/provider cascades, roles, telemetry, cache abuse and partial-state hygiene. Micro/macro ambiguity and devil's-advocate checks leave no implicit readiness, stale-serving, revocation or recovery behavior. Two implementers receive identical readiness, pointer, cache, purge and degraded-delivery semantics.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Public delivery and cache coherence contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/ia/deep-dives/04-cms-delivery-media|Deep Dive 04 — CMS navigation, media and delivery]]
- [[specs/be/03b-editorial-workflow-publication|CMS entries, revisions, review, scheduling and publication — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
