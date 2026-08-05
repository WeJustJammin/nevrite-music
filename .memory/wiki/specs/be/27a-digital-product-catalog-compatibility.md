# Digital product catalog, compatibility and dependencies — Backend Specification

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

- **Shard split:** 1 of 5; 27.01, 27.02, 27.03 and 27.04.
- **Boundary:** immutable product typing, type-conditional drafts, compatibility/dependency declarations and advisory buyer-rig evaluation.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 27 IA/deep dive | product draft, support matrix, dependency graph and self-declared rig checks |
| Shards 03, 05 and 24 | governed schemas/settings and buyer-authored rig facts |

## Product Catalog Invariants

- Product type is selected at draft creation and becomes immutable after first publication. Type-conditional schema remains versioned and revalidates at resume and publication.
- Product drafts contain no external purchase links. Unsupported executable types remain draftable/exportable only and cannot reach publication routes while capability is disabled.
- Compatibility is declared per product version/build, OS, format, host/DAW and relevant architecture combination with source, support class and known issues. Unknown is never promoted to supported.
- Curated-host unknown combinations are omitted from positive facet/checker outputs, while the underlying unknown remains visible to the vendor.
- Dependencies are a versioned graph with exact product/edition/version range and `required|optional` status. Unknown and unsatisfied are distinct; missing required dependencies block `completable` claims.
- Buyer rig checking separately reports machine capability and dependency verdicts, checked/unchecked coverage, sources and freshness. It is advisory and never emits a compatibility badge implying enforcement.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/digital-products` | vendor party/type/schema version/draft key; accepted vendor terms and authorized vendor actor | `201 DigitalProductResponse`; draft/type/schema/checklist | `403`, `409 DRAFT_KEY_REUSED`, `422 TYPE_UNSUPPORTED`, `429` |
| `PATCH /api/v1/digital-products/{id}/draft` | structured type fields/expected version/key; vendor editor | `DigitalProductResponse`; validated draft/gaps/version | `403`, `409 TYPE_IMMUTABLE|VERSION_CONFLICT`, `422 SCHEMA_INVALID`, `428`, `429` |
| `PUT /api/v1/digital-products/{id}/versions/{versionId}/compatibility` | combination rows/support/known issues/source/expected version/key; vendor editor | `DigitalCompatibilityResponse`; matrix/version/unknown coverage | `403`, `409 VERSION_CONFLICT`, `422 COMBINATION_INVALID`, `428`, `429` |
| `PUT /api/v1/digital-products/{id}/versions/{versionId}/dependencies` | dependencies/requiredness/version ranges/source/expected version/key; vendor editor | `DigitalDependencyGraphResponse`; graph/completable verdict/gaps | `403`, `409 CYCLE_INVALID|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/digital-products/{id}/rig-checks` | product version/buyer rig version/target host context; controlling rig actor | `DigitalRigCheckResponse`; separate machine/dependency verdicts/coverage/freshness | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `GET /api/v1/digital-catalog/facets` | product type/platform/format/host/DAW bounds | `DigitalCatalogFacetResponse`; positive facets/schema versions/freshness | `400`, `429`, `503` |

## Persistence, RLS and Workers

- `digital_product`, immutable type, draft revision, compatibility assertion/matrix and dependency graph/version rows pin vendor, schema, source and policy versions.
- RLS exposes drafts/matrices to authorized vendor actors, published-safe catalog projections publicly and buyer rig evaluations only to the controlling rig party. Private rig facts never enter catalog projections.
- Facet and compatibility projection workers consume transactional-outbox events idempotently; stale matrices expose age and never synthesize support.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Digital product | `draft → submitted → published|blocked`; published `→ retired|superseded`; type becomes immutable at first publication | Vendor schema-valid command/submission trigger. External purchase links and unsupported executable publication routes block. |
| Draft revision | immutable `current → superseded`; resume/publication revalidates current schema | Vendor edit with expected version triggers. Type/schema conflict blocks without mutating prior draft. |
| Compatibility assertion/matrix | `declared → current|stale|superseded`; each row is `supported|unsupported|unknown` with source/support class/issues | Vendor versioned declaration/source change triggers. Unknown never promotes to supported or positive curated facet. |
| Dependency graph | `draft → valid|blocked`; valid `→ stale|superseded`; dependency nodes remain `satisfied|unsatisfied|unknown` | Exact product/edition/range/requiredness and cycle validation trigger. Missing required/unknown blocks completable claim. |
| Rig check | `queued → completed|partial|failed|stale` with separate machine/dependency verdicts | Explicit controlling-rig request/source versions trigger. Advisory result exposes coverage/freshness and never enforcement badge. |

Every unlisted transition returns the typed state/version/schema conflict. Private rig facts never enter catalog projections.

## Failure, Deepening and Ambiguity Gate

Tests cover post-publish type change, executable route reachability, external purchase link, unknown-as-supported, curated-host false facet, required dependency as optional, cyclic dependency and advisory checker as enforcement badge. Seven passes converge; two implementers receive identical digital catalog and compatibility behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Product catalog and compatibility contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog delivery]]
- [[specs/be/03a-content-schema-registry|Content schema registry — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]
- [[specs/be/24b-rigs-compatibility-exports|Gear rigs, compatibility evaluation and exports — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/deep-dives/27-digital-catalog-delivery|Deep Dive 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/03a-content-schema-registry|CMS content types, schema registry and migrations — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
- [[specs/be/24b-rigs-compatibility-exports|Gear rigs, advisory compatibility and source exports — Backend Specification]]
