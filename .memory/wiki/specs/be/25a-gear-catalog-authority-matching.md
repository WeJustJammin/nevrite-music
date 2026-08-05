# Gear catalog authority, matching and advisory facts — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]  
**Deep Dive:** [[specs/ia/deep-dives/25-gear-market-catalog|Gear market catalog deep dive]]

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

- **Shard split:** 1 of 4; 25.01, 25.02, 25.03, 25.04, 25.05, 25.06 and 25.07.
- **Boundary:** canonical makes/models/category schemas, attributed assertions, reversible moderation, listing-model binding, serial hypotheses and advisory fitment/voltage evaluation.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 25 IA/deep dive | catalog assertion/resolution, standing, model binding and advisory evaluation contracts |
| Shards 03, 06 and 23 | governed schemas, moderation cases and gear identity boundaries |

## Catalog Authority Invariants

- Catalog state is an attributed assertion graph. Automation and ordinary contributors append assertions but never overwrite trusted safety/compliance facts or silently establish canonical truth.
- A provisional model requires a real listing or gear-record context, retains assertion provenance and may remain unmatched without blocking publication.
- Moderator standing is category-scoped, earned, revocable and conflict-screened. Commercially interested moderators recuse; high-blast merge/split requires two independent eligible moderators.
- Accept, reject, alias, merge and split actions are versioned and reversible. Existing orders and registry records retain their pinned historical resolution.
- Listing-model binding is attributed and reversible. Automatic binding requires configured confidence and margin thresholds; ambiguity degrades to `unmatched` and never fabricates identity.
- Serial decoding emits versioned hypotheses, source, confidence and alternatives. It never mutates canonical identity or converts uncertainty into a verified manufacture date.
- Fitment and voltage evaluation is advisory and evidence-citing. Fitment no-result suppresses a warning; voltage no-result explicitly says unverified; neither blocks a transaction.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/gear-catalog/models` | bounded query/facets/cursor/as-of; public | `GearCatalogSearchResponse`; versioned models/aliases/facets/freshness | `400`, `429`, `503 SEARCH_UNAVAILABLE` |
| `POST /api/v1/gear-catalog/provisional-models` | listing or gear-record context/make/category/assertions/evidence/key; controlling seller or owner | `201 GearModelResponse`; provisional/version/provenance | `403`, `409 DUPLICATE_CANDIDATE`, `422`, `429` |
| `POST /api/v1/gear-catalog/assertions` | subject/field/value/source/evidence/schema version/key; authenticated contributor | `201 CatalogAssertionResponse`; pending/corroborated/version | `403`, `409 VERSION_CONFLICT`, `422 FIELD_UNSUPPORTED|SAFETY_REVIEW_REQUIRED`, `429` |
| `POST /api/v1/gear-catalog/resolutions` | contribution/action/reason/expected graph versions/moderator attestations/key; eligible category moderators | `201 CatalogResolutionResponse`; prior/new graph/reversal handle | `403 RECUSAL_REQUIRED|STANDING_REQUIRED`, `409 QUORUM_REQUIRED|VERSION_CONFLICT`, `422`, `429` |
| `PUT /api/v1/gear-listings/{id}/model-bind` | model/source/confidence/margin/expected listing+graph versions/key; seller, moderator or matcher worker | `ListingModelBindResponse`; attributed state/version | `403`, `409 VERSION_CONFLICT|BIND_DISPUTED`, `422 CONFIDENCE_INSUFFICIENT`, `428`, `429` |
| `POST /api/v1/gear-catalog/serial-decodes` | model/serial digest/region/decoder version; authorized record or listing reader | `SerialDecodeResponse`; hypotheses/alternatives/confidence/unknown | `403`, `422 DECODER_UNSUPPORTED`, `429`, `503` |
| `POST /api/v1/gear-catalog/advisory-evaluations` | model or unit facts/target/region/reference versions; authenticated actor | `GearAdvisoryEvaluationResponse`; warnings/exclusions/coverage/freshness | `403`, `409 SOURCE_STALE`, `422`, `429` |

## Persistence, RLS and Workers

- `gear_make`, `gear_model`, `model_period`, immutable `category_schema_version`, `catalog_assertion`, `catalog_resolution`, `listing_model_bind`, `serial_decode_hypothesis` and advisory evaluation rows pin actor, source, policy and graph versions.
- RLS exposes accepted public-safe catalog projections publicly, contributor-owned pending assertions to their author and case-bound reviewers, and moderator actions only within current category standing. Raw serial input is never public.
- Matching, duplicate detection, guide rebuild and advisory workers consume transactional-outbox events idempotently. Retries reuse event/idempotency keys; stale graph versions no-op or requeue rather than overwrite.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Catalog assertion | `pending → corroborated|accepted|rejected|superseded|contested` | Contributor evidence and category-scoped moderation trigger. Ordinary automation/contributor cannot overwrite trusted safety/compliance facts. |
| Provisional model | `provisional → accepted|aliased|merged|split|rejected|unmatched`; resolutions append reversible successors | Real listing/gear context and eligible moderator action trigger. High-blast merge/split requires two independent non-conflicted moderators; pinned history survives. |
| Listing-model binding | `unmatched → auto_bound|human_bound|ambiguous`; bound `→ disputed|superseded|unmatched` | Attributed human decision or configured confidence+margin trigger. Weak/ambiguous evidence degrades unmatched and never fabricates identity. |
| Serial decode | immutable `hypotheses|unknown|unsupported` result `→ stale|superseded` | Exact model/serial digest/region/decoder version triggers. Hypothesis never mutates identity or verifies manufacture date. |
| Advisory evaluation | `queued → completed|partial|no_result|failed|stale` | Explicit fitment/voltage request and evidence sources trigger. Fitment no-result suppresses warning; voltage no-result says unverified; no result blocks transaction. |

Every unlisted transition returns the typed state/version/graph conflict. Raw serial and pending assertions remain scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover fabricated search matches, unsupported provisional creation, unmoderated safety overwrite, commercial conflict, quorum races, irreversible merge, weak auto-bind, decoder identity mutation and advisory blocking. Seven passes converge; two implementers receive identical catalog authority and matching behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Catalog authority and matching contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/deep-dives/25-gear-market-catalog|Deep Dive 25 — Gear market catalog]]
- [[specs/be/03a-content-schema-registry|Content schema registry — Backend Specification]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/deep-dives/25-gear-market-catalog|Deep Dive 25 — Gear catalog, listings and market data]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/03a-content-schema-registry|CMS content types, schema registry and migrations — Backend Specification]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]
