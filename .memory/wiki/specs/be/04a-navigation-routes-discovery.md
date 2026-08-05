# CMS navigation, routes and discovery metadata — Backend Specification

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

- **Shard split:** 1 of 3; DLV-01 through DLV-04.
- **Boundary:** named menus, complete-tree versions, canonical routes/permanent redirects and privacy-safe discovery metadata.
- **Approval:** Recommended split accepted under standing autonomy.

## Locked Contracts

- Launch locations are `primary, utility, footer, legal, account`; code/design owns each location contract. One active complete version exists per location/locale/audience.
- Menu defaults: depth 3, 200 items/tree, 50 siblings. Targets are active publication, approved internal route or allowlisted HTTPS external URL. Visibility is bounded AND predicates from `always,anonymous,authenticated,locale,capability,entitlement,feature_available`; it is presentation only, never authorization.
- Reserved prefixes `/api,/admin,/auth,/_astro,/.well-known,/health,/preview` and code-declared routes cannot be CMS slugs. Paths are NFC/locale-lowercase safe segments. Redirect graph is acyclic, no open external redirect and at most five hops.
- Privacy, suppressed/unclaimed party, embargo, legal/safety, authorization, archive/unpublish and noindex policy override editor SEO/social/sitemap values.

## API Endpoint Matrix

| Endpoint | Request / constraints | Success | Errors |
|---|---|---|---|
| `POST /api/v1/cms/menus` | `{ key,locationKey }`; editor key | `201` menu + draft v1 | `403`, `409 KEY_EXISTS`, `422 LOCATION_INVALID`, `429` |
| `POST /api/v1/cms/menus/{id}/versions` | `{ locale,audienceClass,items[] }`; ETag/key; full tree | `201` draft + tree hash/target impact | `409 TREE_CYCLE|LIMIT_EXCEEDED|TARGET_INELIGIBLE|VERSION`, `422`, `428`, `429` |
| `GET /api/v1/cms/menu-versions/{id}/preview` | audience/viewport/locale; authorized editor | coherent tree preview, no-store | `403`, `404`, `409 TARGET_CHANGED`, `422`, `429` |
| `POST /api/v1/cms/menu-versions/{id}/activate` | approved exact hash, MFA, ETag/key | `200` active immutable version + event | `403 STEP_UP_REQUIRED`, `409 APPROVAL_INVALID|TARGET_CHANGED|ACTIVE_VERSION_CHANGED`, `428`, `429` |
| `POST /api/v1/cms/routes` | `{ publicationId,locale,path,cacheClass,audience }`; key | `201` reserved canonical route candidate | `409 ROUTE_COLLISION|RESERVED_ROUTE`, `422 PATH_INVALID`, `429` |
| `POST /api/v1/cms/routes/{id}/path-changes` | `{ path,reasonCode }`; ETag/key | `200` route + permanent old-path redirect/impact | `409 ROUTE_COLLISION|REDIRECT_LOOP|HOP_LIMIT|VERSION`, `422`, `428`, `429` |
| `POST /api/v1/cms/redirects` | `{ sourcePath,destination,status:301|308,reason }`; ETag/key | `201` validated redirect version | `409 REDIRECT_LOOP|OPEN_REDIRECT|ROUTE_COLLISION|HOP_LIMIT`, `422`, `428`, `429` |
| `PUT /api/v1/cms/publications/{id}/discovery-metadata` | bounded title/description/canonical/noindex/social/breadcrumb/structured schema; ETag/key | `200` metadata candidate + policy overrides/blockers | `409 POLICY_BLOCKED|VERSION`, `422 METADATA_INVALID|STRUCTURED_DATA_INVALID`, `428`, `429` |
| `POST /api/v1/cms/route-manifests/build-jobs` | exact publication/menu/discovery set; publisher key | `202 JobStatus` complete immutable manifest | `409 INPUT_SET_CHANGED|MANIFEST_CONFLICT`, `422`, `429`, `503` |

All routes are private/no-store, strict, versioned/idempotent and inherit Shard 00 errors. Reads 120/min/admin, edits 60/min, activation/manifest 10/min with 100% audit/trace.

## Persistence, Compilation and RLS

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Menu version | `draft → approved → active`; prior `active → superseded`; draft may become `rejected` | Editor/reviewer/publisher triggers. Cycle, limits, ineligible target, stale hash or invalid approval blocks activation; active/superseded immutable. |
| Route reservation | `reserved → active → redirect|retired`; redirect may become `retired` | Publication/route compiler triggers. Reserved/active source is globally unique; collision or private target blocks activation; retired source remains reserved. |
| Route manifest | `compiling → ready|failed`; `ready → active`; prior `active → superseded` | Exact publication/menu version compiler and atomic switch trigger. Any required invalid target/cycle blocks ready; partial manifest never activates. |
| Redirect record | `draft → active → revoked|superseded` | Compiler validation/manifest activation triggers. Loop, chain over five, unsafe destination or source collision blocks active. |
| Discovery projection | `building → ready|failed|suppressed`; ready `→ stale|superseded` | Manifest compiler/domain policy triggers. Private/ineligible content suppresses; stale/failed never serves. |

Every unlisted transition returns the typed state/version conflict and keeps the prior complete active manifest.

| Table | Invariants |
|---|---|
| `delivery.menus` / `menu_versions` | immutable key/location; locale/audience/tree hash/state; one active tuple |
| `delivery.menu_item_versions` | same-version parent, unique sibling position, typed target/visibility/a11y; no authority fields |
| `delivery.route_manifest_versions` | complete publication-set hash/state/times; active immutable |
| `delivery.route_records` | manifest/route/path/locale/target/version/canonical/cache/audience; unique path+locale |
| `delivery.redirect_records` | manifest/source/destination/status/reason/active; source unique, acyclic <=5 |
| `delivery.discovery_metadata_versions` | publication/locale/metadata/policy overrides/hash |

Compiler normalizes URLs, validates targets/tree/cycles/limits/visibility, builds redirect graph, then canonical/breadcrumb/sitemap/social/structured data with policy overrides last. Hash and activate complete route/menu/discovery manifest atomically. Editors cannot activate; publishers cannot target unauthorized/private records; public reads only active manifest projections. Events: `delivery.menu.activated.v1`, `delivery.route.changed.v1`.

## Failure, Deepening and Ambiguity Gate

Tests cover reserved routes, Unicode/control/scheme/userinfo/HTTPS validation, locale collision, redirect cycles/hops/open redirects, tree orphan/cycle/limits, keyboard ordering metadata, target revocation, hidden-menu-versus-RLS independence, SEO privacy/embargo suppression, stale approval and atomic complete-tree activation. Metrics/logs contain manifest/version/count/outcome only. Seven deepening passes converge; micro/macro ambiguity and devil's-advocate checks leave no implicit target, authority, redirect or activation behavior. Two implementers receive identical route/menu/discovery behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Navigation, route and discovery contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/ia/deep-dives/04-cms-delivery-media|Deep Dive 04 — CMS navigation, media and delivery]]
- [[specs/be/03b-editorial-workflow-publication|CMS entries, revisions, review, scheduling and publication — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
