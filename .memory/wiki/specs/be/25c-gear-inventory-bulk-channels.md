# Gear inventory claims, bundles, bulk listing and channels — Backend Specification

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

- **Shard split:** 3 of 4; 25.14, 25.15, 25.16 and 25.17.
- **Boundary:** atomic quantity-one and counted-stock claims, bundle composition, organization bulk import/listing and deferred external availability adapters.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 25 IA/deep dive | inventory arbitration, bundle, bulk and external data admission contracts |
| Shards 01, 23 and 24 | acting-party authority, unit identity and organization register/custody grants |

## Inventory and Channel Invariants

- Quantity-one inventory and counted stock are distinct regimes. Exactly one claimant wins a unit; counted stock decrements available quantity atomically without inventing unit identity.
- Claim pins listing, price, disclosure, model bind, policy and inventory versions. A stale price rejects and is never silently accepted or repriced.
- Self-dealing is denied. Losing claimants receive a typed loss and designed alternatives; no hidden cart reservation exists.
- Bundle claim is atomic across every constituent. Used units retain independent grade/disclosure; bundle has no synthetic condition grade and never auto-splits after one constituent fails.
- Parts and B-stock remain explicitly typed. Ownership or confirmed custody plus `sell` grant is required for each quantity-one constituent.
- Bulk import is reviewable partial success: invalid rows isolate, defaults stay visibly flagged, and each unit retains normal evidence/disclosure obligations.
- External availability adapters are post-consumer-launch capabilities requiring provider/legal admission. Sync is per channel/unit, best-effort and freshness-labelled; policy, disclosure and rights never sync implicitly.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-inventory/claims` | listing/price/unit-or-stock versions/claim type/buyer/key; eligible buyer | `201 InventoryClaimResponse`; won/expiry/pinned snapshot | `403 SELF_DEALING`, `409 CLAIM_LOST|STALE_PRICE|STOCK_CONFLICT`, `422`, `429` |
| `POST /internal/v1/gear-inventory/claims/{id}/expirations` | claim/expected state/timer event key; claim timer worker | `InventoryClaimResponse`; expired/no-op/released version | `403`, `409 EVENT_REUSED|STATE_CHANGED`, `429` |
| `POST /api/v1/gear-listing-bundles` | constituent unit/stock refs/quantities/terms/expected versions/key; authorized seller | `201 ListingBundleResponse`; atomic bundle/version/gaps | `403`, `409 CONSTITUENT_UNAVAILABLE|DOUBLE_ALLOCATION|VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/gear-listing-imports` | organization/storefront/file/schema/defaults/key; delegated listing operator | `202 ListingImportResponse`; batch/review state | `403`, `409 IMPORT_REUSED`, `422`, `429` |
| `GET /api/v1/gear-listing-imports/{id}` | batch/cursor; delegated operator | `ListingImportResponse`; row outcomes/flags/freshness | `403`, `404`, `429` |
| `POST /api/v1/gear-listing-imports/{id}/publications` | accepted row IDs/expected batch+source versions/key; delegated operator | `202 BulkPublicationResponse`; per-row queued/denied states | `403`, `409 SOURCE_STALE`, `422 REVIEW_REQUIRED`, `429` |
| `POST /api/v1/gear-channel-connections/{id}/availability-syncs` | channel/unit scope/cursor/key; delegated operator; admitted adapter capability | `202 ChannelAvailabilitySyncResponse`; per-channel pending/freshness | `403`, `409 SYNC_IN_PROGRESS`, `422 CAPABILITY_DISABLED|PROVIDER_NOT_ADMITTED`, `429` |
| `GET /api/v1/gear-channel-connections/{id}/availability` | channel/unit filters/cursor; delegated operator | `ChannelAvailabilityResponse`; explicit state/freshness/errors | `403`, `404`, `429`, `503` |

## Persistence, RLS and Workers

- `marketplace_unit`, `stock_line`, `inventory_claim`, bundle/constituent rows, import batch/row outcomes and channel availability projection pin source and policy versions. PostgreSQL row locks or serializable compare-and-swap resolve claims.
- RLS exposes claims to buyer, seller and purpose-scoped Shard 26 processes; inventory and imports to delegated storefront operators; provider credentials and internal channel errors remain server-only.
- Claim expiry, bulk validation/publication and channel sync workers are idempotent. Provider ambiguity remains `pending|unknown` with freshness/error; retries never duplicate reservations, listings or decrements.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Inventory claim | `pending → won|lost|expired|cancelled`; won `→ converted_to_order|released|expired` | Serializable unit/stock compare-and-swap with pinned price/disclosure/policy versions triggers. Self-dealing/stale price/stock race blocks; no hidden reservation. |
| Stock line | `available → partially_claimed|depleted`; claims release back to available/partial atomically | Counted-stock claim/release/order conversion triggers. Underflow and invented unit identity are forbidden. |
| Bundle | `draft → active|blocked`; active `→ claimed|withdrawn|stale`; claim is atomic across every constituent | Exact constituent versions/authority/availability trigger. Any failure rolls back whole bundle and no synthetic grade/auto-split occurs. |
| Import batch/row | batch `uploaded → validating → review_ready|failed`; each row `valid|invalid|flagged → queued|published|denied` | Delegated operator review and normal publication gates trigger. Invalid rows isolate; defaults stay flagged and no whole-batch rollback. |
| External channel capability/sync | launch capability `disabled`; future sync `queued → pending → current|partial|failed|unknown|stale` | Provider/legal admission and explicit channel/unit scope trigger. Policy/disclosure/rights never sync implicitly and ambiguity never duplicates decrement/listing. |

Every unlisted transition returns the typed state/version/inventory conflict. Provider credentials/internal errors remain server-only.

## Failure, Deepening and Ambiguity Gate

Tests cover two-buyer race, counted-stock underflow, stale-price acceptance, self-dealing, bundle partial allocation, synthetic bundle grade, invalid bulk-row rollback, hidden defaults, disabled provider route and implicit policy/disclosure sync. Seven passes converge; two implementers receive identical inventory and channel behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Inventory, bulk and channel contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/deep-dives/25-gear-market-catalog|Deep Dive 25 — Gear market catalog]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/24c-organization-register-backline|Organization gear register and public backline — Backend Specification]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/deep-dives/25-gear-market-catalog|Deep Dive 25 — Gear catalog, listings and market data]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/24c-organization-register-backline|Organization asset registers, condition and public backline — Backend Specification]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
