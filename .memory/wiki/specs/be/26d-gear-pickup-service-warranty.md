# Gear pickup, pre-dispatch service and warranty routing — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]  
**Deep Dive:** [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Gear commerce fulfilment deep dive]]

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

- **Shard split:** 4 of 5; 26.17, 26.18, 26.19 and 26.20.
- **Boundary:** safe platform pickup, explicitly off-platform arrangements, pre-dispatch service sequencing and manufacturer RMA/warranty evidence routing.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 26 IA/deep dive | pickup branches, protected location, service sequencing and warranty handoff |
| Shards 14, 23 and 25 | repair engagement, manual transfer and listing/unit evidence |

## Pickup, Service and Warranty Invariants

- Platform pickup is available only to adult buyer/seller on a platform-settled listing with an admitted safe-meetup option. Exact venue/location releases only to authorized parties at the required stage and expires from routine views.
- Maps are optional; every pickup flow provides text search, address/instructions and accessible confirmation. Home address is never publicly projected.
- Dual confirmation is preferred. Unilateral/no-show/disputed outcomes preserve funds and safety, create evidence and route to bounded resolution; they never silently settle or transfer title.
- Off-platform pickup is a seller-chosen disclosed branch. Platform records arrangement outcome only and never claims escrow, payment protection, refund, comparable sale or automatic ownership transfer.
- Off-platform completion may offer a manual Shard 23 transfer handshake; it does not strengthen either party's title evidence by itself.
- Pre-dispatch service is a separate Shard 14 engagement with accepted custody/liability path and sequencing before shipment. Seller service is never invoked as an uncontracted independent provider.
- Service outcome that contradicts listing truth pauses dispatch and gives buyer cancel, reprice or continue election; no option is silently chosen.
- Warranty/RMA routing is unit-scoped and evidence-labelled. `no warranty` remains explicit, provider submission requires an admitted adapter, and platform never offers its own warranty.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-orders/{id}/pickup-arrangements` | branch/coarse area/safe venue choice/schedule/party ages/expected order version/key; order party | `201 PickupArrangementResponse`; protected arrangement/checklist | `403`, `409 ORDER_STATE_CHANGED`, `422 ADULT_REQUIRED|SAFE_VENUE_REQUIRED`, `429` |
| `POST /api/v1/gear-pickups/{id}/location-releases` | purpose/stage/expected version/key; authorized pickup party | `PickupLocationResponse`; exact location/expiry/instructions | `403`, `409 STAGE_NOT_READY`, `422`, `429` |
| `POST /api/v1/gear-pickups/{id}/confirmations` | outcome/evidence/expected version/key; buyer or seller | `PickupArrangementResponse`; dual/unilateral/disputed/no-show state | `403`, `409 VERSION_CONFLICT|OUTCOME_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-pickups/{id}/off-platform-outcomes` | arrangement outcome/evidence/manual-transfer preference/key; disclosed off-platform parties | `PickupArrangementResponse`; recorded-only outcome/transfer prompt | `403`, `409 BRANCH_MISMATCH`, `422`, `429` |
| `POST /api/v1/gear-orders/{id}/pre-dispatch-services` | service listing/requirements/custody-liability acceptance/order versions/key; buyer and provider authority | `201 PreDispatchServiceResponse`; engagement/sequence/dispatch hold | `403`, `409 ORDER_STATE_CHANGED`, `422 SERVICE_INELIGIBLE`, `429` |
| `POST /api/v1/gear-orders/{id}/pre-dispatch-services/{serviceId}/outcomes` | service outcome/evidence/listing diff/expected versions/key; service provider | `PreDispatchServiceResponse`; complete or buyer-election hold | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-orders/{id}/service-outcome-elections` | cancel/reprice/continue/expected version/key; buyer only | `GearOrderResponse`; elected order state | `403 BUYER_ONLY`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-units/{id}/warranty-routes` | order/unit/warranty evidence/desired route/key; authorized owner | `WarrantyRouteResponse`; eligible/manual/no-warranty/provider-pending | `403`, `409 SOURCE_STALE`, `422 NO_WARRANTY|PROVIDER_NOT_ADMITTED`, `429` |

## Persistence, RLS and Workers

- `pickup_arrangement`, protected location release, confirmations/outcomes, pre-dispatch service link/outcome/election and warranty evidence/route rows pin actor, order, policy and provider versions.
- RLS exposes pickup details only to adult order parties and case-bound safety/support, service links to engagement parties, and warranty evidence to current authorized owner/provider. Exact location never enters public/search projections.
- Location expiry, pickup reminders, service outcome and admitted warranty adapter workers are idempotent. Provider ambiguity remains pending and cannot alter canonical order, custody or title state directly.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Pickup arrangement | `planned → scheduled → buyer_confirmed|seller_confirmed|dual_confirmed|unilateral|no_show|disputed|cancelled`; only governed dual resolution may proceed settlement/transfer | Adult parties/safe venue/confirmations trigger. Unilateral/no-show/dispute preserves funds/safety and routes bounded resolution. |
| Location release | `sealed → released → expired|revoked` | Authorized party and required stage/purpose trigger. Exact location never public and routine access expires. |
| Off-platform pickup | `arranged → outcome_recorded|failed|disputed`; optional manual transfer `offered → accepted|declined|expired` | Disclosed seller branch/party evidence triggers. No escrow/payment/refund/comparable/title claim is created. |
| Pre-dispatch service | `proposed → engagement_active → completed|failed|cancelled`; contradictory outcome `→ buyer_election_hold → cancel|reprice|continue` | Separate Shard 14 engagement/custody-liability and provider outcome trigger. Seller is not uncontracted provider and no option is silent. |
| Warranty route | `evaluating → no_warranty|manual|provider_pending|ineligible`; provider-pending `→ submitted|failed|unknown` | Unit/evidence/admitted provider trigger. Platform never provides its own warranty or lets ambiguity alter order/custody/title. |

Every unlisted transition returns the typed state/version/safety conflict. Protected locations and warranty evidence remain scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover public home address, minor pickup, map-only flow, unilateral silent settlement, no-show fund release, off-platform platform-protection claim, automatic transfer, uncontracted seller service, silent contradiction election, fabricated warranty and disabled-provider submission. Seven passes converge; two implementers receive identical pickup, service and warranty behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Pickup, service and warranty contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear commerce fulfilment]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagements — Backend Specification]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection and custody — Backend Specification]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/deep-dives/26-gear-commerce-fulfilment|Deep Dive 26 — Gear transactions, fulfilment and possession models]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
- [[specs/be/14e-repair-inspection-custody|Repair, inspection, custody and damage evidence — Backend Specification]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]
