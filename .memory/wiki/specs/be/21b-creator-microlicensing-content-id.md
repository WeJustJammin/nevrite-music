# Creator micro-licensing, whitelisting and Content ID recovery — Backend Specification

**Status:** Complete; whitelist/Content ID provider disabled  
**IA Source:** [[specs/ia/21-specialized-licensing|Shard 21 — Specialized licensing]]  
**Deep Dive:** [[specs/ia/deep-dives/21-specialized-licensing|Specialized licensing deep dive]]

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

- **Shard split:** 2 of 4; SPL-07, SPL-08, SPL-09 and SPL-10.
- **Boundary:** fixed-template creator listings, no-negotiation purchase, provider whitelist completion, licensed-claim recovery and subscription-independent issued grants.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 21 IA/deep dive | micro-licence, whitelist, claim and subscription rules |
| Shards 00 and 20 | OAuth/provider reconciliation and canonical licence issuance |

## Micro-Licence and Claim Invariants

- Listing uses contained fixed template, flat price, channel/use scale, exact scope and eligible single-payee or zero-consideration path. Failure routes to human clearance.
- Buyer cannot negotiate listed price. Purchase pins buyer/licensee/channel OAuth identity, scope, price, clearance and listing versions.
- Completion requires both canonical Shard 20 issued instrument and confirmed provider whitelist. Licence-only or whitelist-only state is unfulfilled.
- Provider integration is disabled until Phase-2 review; purchase execution returns typed disabled before payment/provider effect while planning/listing may exist.
- Payment success plus whitelist failure remains unfulfilled and follows committed void/refund/recovery; never silent licence-only success.
- Claim recovery loads instrument, channel, content and claim from one “I have a licence” action. Result is released, correct-claim explanation or bounded escalation.
- Relanded claim preserves prior receipts and escalates; no infinite retry loop.
- Subscription cancellation disables future purchase benefit only. Issued instrument and whitelist persist; failed cascade favors persistence.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/creator-licence-listings/preflight` | work/template/scope/price/channel/scale/payee versions; owner/key | `CreatorListingPreflight`; eligible/fallback/hash | `403`, `409 SOURCE_STALE`, `422 TEMPLATE_NOT_CONTAINED|B3_TOPOLOGY_DISABLED`, `429` |
| `POST /api/v1/creator-licence-listings` | preflight/listing terms; owner/key | `201 CreatorListingResponse`; active/human-fallback | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /api/v1/creator-licence-purchases/preflight` | listing/buyer/licensee/channel OAuth/scope; creator/key | `CreatorPurchasePreflight`; frozen price/gaps/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/creator-licence-purchases` | preflight/payment token; creator/key | no completed purchase while provider disabled | `403 WHITELIST_PROVIDER_DISABLED`, `409`, `422`, `429` |
| `POST /internal/v1/creator-licence-purchases/{id}/whitelist` | instrument/channel/content/provider operation; worker/key | no provider success while disabled | `403 WHITELIST_PROVIDER_DISABLED`, `409`, `429` |
| `POST /api/v1/content-id-claims/recovery` | instrument/channel/content/claim receipt; licensee/key | no provider submission while disabled | `403 CONTENT_ID_PROVIDER_DISABLED`, `409`, `422`, `429` |
| `POST /internal/v1/content-id-claims/{id}/provider-result` | release/correct/escalate/receipt/event; worker/key | `ContentIdRecoveryResponse`; terminal/escalated | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `POST /api/v1/subscription-benefits/{id}/cancel` | subscription/version; subscriber/key | `SubscriptionGrantResponse`; future capability off | `403`, `409 VERSION_CONFLICT`, `428`, `429` |

## Persistence, RLS and Workers

- `creator_licence_listing`, `creator_purchase`, `provider_whitelist`, `content_id_claim_recovery` and `subscription_grant_history` retain immutable instrument/provider references.
- RLS exposes listing safely, purchase/claim to licensee/owner purpose scope and provider credentials only to adapters.
- Subscription cascade cannot delete/revoke instrument/whitelist rows. Provider gates exist at router, database and worker.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Creator licence listing | `draft → active|human_fallback`; active `→ paused|retired|superseded` | Contained fixed-template/single-payee-or-zero preflight triggers. Negotiation, B3 topology or clearance failure routes human fallback. |
| Provider capability | whitelist/content-ID launch terminal `disabled`; future explicit integration may `→ enabled|killed` after Phase-2 review | No purchase/whitelist/recovery provider effect while disabled; router/database/worker all deny. |
| Creator purchase | future `preflight → payment_pending → instrument_pending → whitelist_pending → fulfilled`; any partial state `→ void_refund|recovery|failed|unknown` | Frozen listing/licensee/channel/scope and both Shard 20 instrument plus provider whitelist trigger. Licence-only or whitelist-only never fulfilled. |
| Claim recovery | future `opened → submitted → released|correct_claim|escalated|failed`; relanded claim `→ escalated` | One licensed-claim action/provider receipt triggers. Prior receipts persist and bounded retry prevents infinite loop. |
| Subscription benefit | `active → cancelled|expired`; cancellation affects future purchase eligibility only | Subscriber command/timer triggers. Issued instrument/whitelist persist even if cascade fails. |

Every unlisted transition returns the typed state/version/provider-gate conflict. Provider credentials and private claims remain adapter/purpose scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover negotiable fixed price, B3 topology, provider call while disabled, licence-only success, whitelist-only success, payment ambiguity, claim infinite retry and subscription revocation of issued grant. Seven passes converge; two implementers receive identical micro-licensing behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Creator micro-licensing and claims authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/21-specialized-licensing|Shard 21 — Specialized licensing]]
- [[specs/ia/deep-dives/21-specialized-licensing|Deep Dive 21 — Specialized licensing]]
- [[specs/be/20d-licence-issuance-verification-lifecycle|Licence issuance, verification and immutable lifecycle — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/21-specialized-licensing|Shard 21 — Specialized clearances and licensing]]
- [[specs/ia/deep-dives/21-specialized-licensing|Deep Dive 21 — Specialized clearances and licensing]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/20d-licence-issuance-verification-lifecycle|Licence issuance, verification and immutable lifecycle — Backend Specification]]
