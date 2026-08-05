# Service listings, quotes and engagement creation — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/14-services-marketplace|Services marketplace deep dive]]

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

- **Shard split:** 1 of 5; SRV-01, SRV-02, SRV-03 and SRV-04. Requirements/work, final acceptance, multi-party supply and custody remain separate.
- **Boundary:** curated craft listings, shape-specific pricing, quote requests, immutable expiring quotes, anonymity/NDA and atomic single-payee engagement creation.
- **Approval:** Recommended split accepted under standing autonomy.

## Listing and Quote Invariants

- Listing chooses exactly one immutable primary craft plus curated facets, tiers/packages/add-ons, deliverables/exclusions, service mode, SLA, capacity and explicit master/composition rights posture. Craft maps to Shard 07 role but never extends taxonomy.
- Pricing shape is `flat|per_unit|hourly|day_halfday|tiered_volume|minimum_plus|points|hybrid` with legal minimum, contract currency/tax, rounding, breaks/overtime and required inputs. Models/benchmarks remain seller-specific/private and are never normalized into one misleading price.
- Price evaluation uses ordered tiers/add-ons/volume/rounding in one contract currency; timestamped buyer conversion is indicative. Cash and rights are never summed.
- Quote freezes exact ordered scope, artifacts, requirements, revisions, rights postures, kill/exit schedule, anonymity/NDA, expiry, price evaluation and material terms. Reissue creates a successor and full diff; listing/rate/capacity changes never alter an issued quote.
- Buyer sees the full quote; diff is supplemental. Acceptance requires separate unchecked acknowledgements for material terms, current authority and exact version/expiry.
- Same human cannot represent both sides alone; a distinct authorized buyer human is required. Known under-18 transaction requires verified guardian co-signatory, otherwise launch policy blocks.
- Payment provider authorization in contract currency and canonical engagement creation are atomic with accepted quote. Provider failure leaves quote issued; same idempotency returns one engagement and no new quote version may issue while acceptance is in flight.
- Launch supports one payee only. A multi-payee composition may be recorded by 14d but cannot activate through this acceptance route.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/service-listings/preflight` | craft/facets/tiers/add-ons/pricing/mode/SLA/capacity/rights postures; seller/key | `ListingPreflightResponse`; exact gate gaps/hash | `403`, `409 TAXONOMY_STALE`, `422 LISTING_GATE_FAILED`, `429`, `503` |
| `POST /api/v1/service-listings` | preflight/source hash and complete listing; seller/key | `201 ServiceListingResponse`; draft/published version | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /api/v1/service-listings/{id}/versions` | non-craft successor fields; seller ETag/key | `201 ServiceListingResponse`; successor version | `403`, `404`, `409 CRAFT_IMMUTABLE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/service-listings` | craft/facets/mode/price-shape/liveness cursor | `ServiceListingPage`; safe structured listings/freshness | `422`, `429`, `503` |
| `POST /api/v1/service-listings/{id}/price-evaluations` | actual job inputs/quantity/currency display preference; buyer/key | `PriceEvaluationResponse`; seller-model result or quote-required, evaluation hash | `403`, `404`, `409 MODEL_VERSION_CHANGED`, `422 INPUTS_INVALID`, `429` |
| `POST /api/v1/service-listings/{id}/quote-requests` | buyer/seller context versions, job inputs, requirements/assets refs; buyer/key | `201 QuoteRequestResponse`; request/version | `403`, `404`, `409`, `422`, `429` |
| `POST /api/v1/quote-requests/{id}/quotes` | ordered price/scope/artifacts/requirements/revisions/rights/exit/anonymity/expiry; seller/key | `201 QuoteResponse`; issued binding offer/version/delivery evidence | `403`, `404`, `409 QUOTE_ALREADY_ISSUED`, `422`, `429` |
| `POST /api/v1/quotes/{id}/successors` | complete replacement and reason; seller ETag/key | `201 QuoteResponse`; reissued version/full diff, prior void | `403`, `404`, `409 ACCEPTANCE_IN_FLIGHT|VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/quotes/{id}` | buyer/seller authorized party | `QuoteResponse`; full quote, supplemental diff, expiry/material acknowledgements | `403`, `404`, `429`, `503` |
| `POST /api/v1/quotes/{id}/accept` | exact quote hash, material acknowledgements, buyer/guardian authority, payment method token; eligible buyer/key | `201 EngagementResponse`; one engagement/payment authorization/requirements IDs | `403 SELF_ACCEPTANCE_FORBIDDEN|GUARDIAN_REQUIRED`, `409 QUOTE_EXPIRED|ACCEPTANCE_IN_FLIGHT|VERSION_CONFLICT`, `422 MATERIAL_ACK_REQUIRED`, `429`, `503 PAYMENT_AUTH_FAILED` |

Listing/browse reads are 120/min/IP; listing writes 30/hour/seller; price/quote requests 60/min/buyer; quote issue/reissue 20/hour/request; acceptance 10/hour/quote with step-up and 100% audit. Private prices, NDA, quote text and payment credentials are no-store/omitted from logs/events.

## Persistence, RLS and Workers

Tables: `service.listings`, `listing_versions`, `pricing_model_versions`, `quote_requests`, `quote_versions`, `quote_acknowledgements`, `engagements`, `payment_authorizations` and audit events. Listing craft and accepted quote snapshot are immutable; one engagement per accepted quote.

RLS is seller/buyer/guardian/authorized acting party bound. Quote acceptance is a serializable state machine: re-resolve both authorities and self-dealing, lock quote, request provider auth with stable key, then atomically mark accepted/create engagement+requirements/outbox. Ambiguous provider outcome stays pending reconciliation and never creates a second authorization/engagement. Anonymity failures preserve the more restrictive state; sealed credit remains privately recorded.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Service listing | `draft → active`; active `↔ paused`; draft/active/paused `→ retired`; successor version supersedes prior current version | Seller command with current preflight/taxonomy triggers. Primary craft is immutable; invalid model/rights/SLA/capacity gate blocks activation. |
| Quote request | `open → quoted|withdrawn|expired|declined` | Buyer request, seller issue/decline, buyer withdrawal or timer triggers. One current issued quote per request; stale contexts block issue. |
| Quote | `draft → issued → accepted|expired|superseded|void`; issued may enter `acceptance_pending` and returns issued on provider failure | Seller issue/reissue, timer or buyer acceptance saga triggers. Reissue is blocked during acceptance; stale/expired/self-dealing/guardian/material-ack failures block acceptance. |
| Payment authorization | `requested → authorized|declined|unknown`; unknown `→ authorized|declined` by reconciliation; authorized `→ captured|voided|expired` in owning payment flow | Stable provider key/evidence triggers. Unknown outcome must reconcile before retry; no duplicate authorization or engagement is created. |
| Engagement | `requirements → active → delivery|exit_pending → completed|exited|deadlocked` with detailed transitions owned by 14b–14c | Atomic accepted-quote commit creates requirements state. Multi-payee composition or missing payment authorization blocks this v1 route. |

Every unlisted transition returns the typed state/version/authority conflict. Events carry IDs/state/version/hash only and omit commercial content.

## Failure, Deepening and Ambiguity Gate

Tests cover immutable craft, pricing arithmetic/rounding, model normalization attempt, listing change after quote, missing expiry/material term, same-human self-acceptance, minor without guardian, quote expiry/payment race, provider unknown/retry, acceptance idempotency and quote reissue during flight. Seven passes converge; two implementers receive identical listing, quote and engagement-creation behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Listing, quote and engagement contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/deep-dives/14-services-marketplace|Deep Dive 14 — Services marketplace lifecycle]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
