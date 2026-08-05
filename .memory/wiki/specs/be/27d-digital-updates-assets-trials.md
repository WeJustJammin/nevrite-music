# Digital updates, owned assets, auditions and trials — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]  
**Deep Dive:** [[specs/ia/deep-dives/27-digital-catalog-delivery|Digital catalog delivery deep dive]]

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

- **Shard split:** 4 of 5; 27.14, 27.15, 27.16, 27.17, 27.18 and 27.19.
- **Boundary:** immutable ordinary updates, deferred executable channels, holder asset search/organization, protected auditions and trial/free-grant acquisition.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 27 IA/deep dive | update preservation, release channels, asset indexing, audition, buyer metadata and trial origin |
| Shards 04, 05 and 06 | protected media, capability settings and appealable abuse handling |

## Update and Library Asset Invariants

- Ordinary update passes the same submission/QA gates and appends immutable artifact, metadata, compatibility/dependency and release-note versions. Metadata correction is a successor hash/version, never in-place mutation.
- Holders choose whether to adopt an entitled update; old entitled versions remain deliverable unless minimally withdrawn for a valid safety/legal cause.
- Stable/beta staging or rollback is executable-only and unreachable until executable capability gates pass. Malicious withdrawal stops transfers; defective/superseded in-flight transfer may finish under pinned policy.
- Pack is the launch billing unit. Individual files are indexed/auditioned assets, not independently sold, and owned search uses musical per-type facets plus buyer metadata separate from storefront merchandising.
- Nullable metadata remains honest. Buyer tags/collections are buyer-owned, survive revisions and refund tombstones, and relight on repurchase without merging entitlement histories.
- Public audition uses protected complete-duration `contents_only` renditions with source/confidence/processing labels; `made_with` is distinct. No original artifact URL or watermark map is disclosed.
- Trial/free grant uses the same entitlement model with origin, policy and expiry. Abuse checks are best-effort, reasoned and appealable; binary feature limits remain vendor-owned rather than platform entitlement fiction.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/digital-products/{id}/updates` | prior/new version/submission QA/release notes/compatibility/dependencies/key; vendor publisher | `201 DigitalProductUpdateResponse`; successor/preserved prior/notify state | `403`, `409 VERSION_CONFLICT`, `422 QA_BLOCKED`, `429` |
| `PUT /api/v1/digital-products/{id}/release-channels/{channel}` | build/stage/withdraw reason/expected version/key; vendor publisher; executable capability admitted | `DigitalReleaseChannelResponse`; immutable channel state/version | `403 CAPABILITY_DISABLED`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/digital-library/assets` | holder/type/musical facets/tags/collection/query/cursor; holder controller | `DigitalOwnedAssetSearchResponse`; owned-only results/nullable metadata/freshness | `403`, `429`, `503` |
| `GET /public/digital-products/{productId}/assets/{assetId}/audition` | rendition ID/range; public, rate bounded | `206` protected audition stream with type/source/confidence/processing headers | `404`, `416`, `429`, `503` |
| `PUT /api/v1/digital-library/assets/{assetId}/organization` | holder/tags/collections/expected version/key; holder controller | `DigitalAssetOrganizationResponse`; buyer metadata/version/tombstone state | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/digital-products/{id}/trial-grants` | holder/trial policy/origin/device-abuse context/key; holder controller | `201 DigitalEntitlementResponse`; trial/free epoch/expiry/state | `403`, `409 TRIAL_ALREADY_USED`, `422 TRIAL_UNAVAILABLE`, `429` |
| `POST /api/v1/digital-trial-decisions/{id}/appeals` | reason/evidence/key; affected holder | `201 DigitalTrialAppealResponse`; queued/deadline | `403`, `409 APPEAL_EXISTS`, `422`, `429` |

## Persistence, RLS and Workers

- Immutable product update/channel rows, asset metadata projection, protected rendition, buyer tag/collection, tombstone and trial acquisition/decision rows pin product, holder, policy and artifact versions.
- RLS exposes buyer organization only to holder controllers, protected audition renditions publicly without original authority, vendor channel controls to authorized publishers and abuse evidence only to case-bound reviewers.
- Update notification, asset indexing, rendition and trial-expiry workers are idempotent. Retried indexing preserves buyer metadata; capability revocation removes executable routes before queued work executes.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Product update | `submitted → qa_running → published|blocked|rejected`; published `→ superseded|withdrawn` | Same submission/QA gates and vendor publisher trigger. Holder adoption is optional and prior entitled versions remain deliverable absent narrow withdrawal. |
| Executable release channel | capability-disabled at launch; future `draft → staged → stable|rolled_back|withdrawn` | Complete executable gate and publisher command trigger. Capability revocation removes route before queued work. |
| Library asset projection | `indexing → current|partial|failed|stale`; current `→ withdrawn|superseded` | Pack/version/artifact indexing trigger. Files remain pack assets, never separately sold; owned search excludes storefront merchandising. |
| Buyer asset organization | `active → tombstoned`; repurchase `→ active` without merging entitlement histories | Holder tags/collections/refund/repurchase trigger. Metadata survives revisions and tombstone relights. |
| Audition rendition | `processing → ready|blocked|failed`; ready `→ withdrawn|stale` | Protected complete-duration contents-only rendition trigger. Made-with remains separate and original URL/watermark map never exposes. |
| Trial/free entitlement | `active → expired|revoked|converted`; abuse decision `pending → allowed|denied → appeal_pending → upheld|reversed` | Trial policy/origin/expiry and reasoned appealable abuse checks trigger. Binary feature limits remain vendor-owned. |

Every unlisted transition returns the typed state/version/capability conflict. Buyer metadata and abuse evidence remain scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover in-place update, forced holder update, old-version deletion, disabled beta route, individual pack-file sale, store results in owned search, null metadata fabrication, original audition URL, tags lost on refund, repurchase entitlement merge and automatic trial-abuse guilt. Seven passes converge; two implementers receive identical update, asset, audition and trial behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Update, asset, audition and trial contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog delivery]]
- [[specs/be/04b-governed-media-renditions|Governed media renditions — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
