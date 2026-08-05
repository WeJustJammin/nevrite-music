# Ticket VIP packages, RSVP and free-to-paid conversion — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]  
**Deep Dive:** [[specs/ia/deep-dives/35-ticket-products-sales|Ticket products and sales deep dive]]

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

- **Shard split:** 4 of 5; 35.15, 35.16, 35.17, 35.18 and 35.19.
- **Boundary:** conjunctive access packages, atomic purchase/fulfilment, payment-free RSVP admissions and holder-safe free-to-paid conversion.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 35 IA/deep dive | package components, M&G policy, free admissions and conversion |
| Shards 14 and 29 | physical fulfilment engagements and venue-less capacity/location owner |

## Package and RSVP Invariants

- Package version pins artist approval, variants, ticket/M&G/merch/other components, inventories, slots, binding constraints and component fault/remedy policies.
- Package state is conjunction of components. Missing physical fulfilment disables component/package variant; purchase reserves/issues every component atomically or releases all.
- Fan sees unified package plus component statuses/remedies. Transfer allowed only when every component policy permits and artist M&G policy confirms recipient handling.
- M&G/VIP redemption pins assigned slot/current roster and records component fulfilment. Miss/cancel follows component fault policy, not blanket package fiction.
- RSVP/free admit shares admission/door contract but never creates order/payment/refund/resale state. One admission per verified fan/head; duplicate is idempotent and self-release returns unit.
- Venue-less RSVP requires named capacity/location owner and private location disclosure policy.
- Free-to-paid conversion preserves existing RSVPs as comp allocation and makes only remaining units sellable; holder is never stranded or silently charged.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/ticket-events/{id}/access-packages` | component refs/variants/artist approval/policies/key; package operator | `201 AccessPackageResponse`; enabled/disabled variants/version | `403 ARTIST_APPROVAL_REQUIRED`, `409 COMPONENT_INVENTORY_CONFLICT`, `422 COMPONENT_UNAVAILABLE`, `429` |
| `POST /api/v1/access-packages/{id}/purchases` | variant/components/slots/payment/holder/key; fan | `201 AccessPackagePurchaseResponse`; atomic package/components | `403`, `409 COMPONENT_UNAVAILABLE|SLOT_CONFLICT`, `422 PAYMENT_AMBIGUOUS`, `429` |
| `POST /api/v1/access-package-holdings/{id}/redemptions` | component/slot/roster/outcome/evidence/key; fan or fulfiller | `AccessPackageHoldingResponse`; unified/component states/remedies | `403`, `409 SLOT_STALE`, `422`, `429` |
| `POST /api/v1/ticket-events/{id}/rsvps` | capacity owner/fan/admission source/location policy/key; verified fan | `201 AdmissionResponse`; payment-free admission/ticket identity | `403 FAN_REQUIRED`, `409 CAP_REACHED|ALREADY_ISSUED`, `422 LOCATION_OWNER_REQUIRED`, `429` |
| `DELETE /api/v1/rsvps/{id}` | admission/version/key; holder | `204`; unit returned to RSVP pool | `403`, `409 VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/ticket-events/{id}/paid-conversions` | RSVP/manifest snapshots/approval/new scaling/key; event owner | `201 TicketConversionResponse`; comps preserved/remaining sellable | `403`, `409 SOURCE_STALE`, `422 HOLDER_STRANDING|SILENT_CHARGE_FORBIDDEN`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Access-package version | `current -> superseded`; package variant `enabled -> disabled`; `disabled -> enabled` | Approved component/policy/inventory successor supersedes the immutable version. Component loss disables every dependent variant; re-enable requires all components and binding constraints to pass again. |
| Package purchase | `reserving -> confirmed|failed|reconciliation_required`; `reconciliation_required -> confirmed|failed` | Inventory, slot, ticket and payment effects commit atomically or release all. Ambiguous payment remains unusable reconciliation; no partial package holding is issued. |
| Package component holding | `reserved -> fulfilled|missed|cancelled|transferred`; `reserved -> remedy_pending`; `remedy_pending -> remedied|closed` | Scoped redemption records exact slot/roster/outcome; miss/cancel applies the pinned component fault policy. Transfer occurs only when every package/component policy permits and preserves the unified holding link. |
| Package holding | `active -> partially_fulfilled|fulfilled|remedy_pending|cancelled|transferred`; `partially_fulfilled -> fulfilled|remedy_pending|cancelled`; `remedy_pending -> fulfilled|closed` | Aggregate state is derived from component states after each atomic event. It never advances beyond a component or invents blanket fulfilment/remedy. |
| RSVP admission | `issued -> released|converted_comp|void`; `converted_comp -> redeemed|void` | Holder release returns the unit once; paid conversion preserves it as comp without charge; authorized admission invalidation voids it. Released/void admissions cannot be restored or converted. |
| Paid conversion | `validating -> committed|failed` | Event-owner authorization atomically maps all existing RSVPs to comps and exposes only remaining units under the new scaling. Any stale source, stranding or silent-charge risk fails without partial conversion. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; any partial component purchase, RSVP charge or holder-stranding operation returns `409 ATOMICITY_REQUIRED`.

## Persistence, RLS and Workers

- Package/component/variant/approval/inventory/slot/policy, purchase/holding/redemption, RSVP/admission/source pool and conversion mapping rows pin source versions.
- RLS exposes package/catalog publicly, own holding/RSVP to fan, component fulfilment to scoped operator and private venue-less location only through purpose grant.
- Component reservation, fulfilment, RSVP release and conversion workers are idempotent; package state never outruns a component.

## Failure, Deepening and Ambiguity Gate

Tests cover package enabled without physical fulfilment, partial component purchase, forbidden component transfer, blanket remedy, RSVP payment surface, duplicate RSVP ticket, public venue-less location, conversion RSVP loss and silent holder charge. Seven passes converge; two implementers receive identical package, RSVP and conversion behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | VIP package and RSVP contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products and sales]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagements — Backend Specification]]
- [[specs/be/29a-place-room-authority-status|Place and room identity, authority and status — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products, sales, access packages and delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/14a-service-listings-quotes-engagements|Service listings, quotes and engagement creation — Backend Specification]]
- [[specs/be/29a-place-room-authority-status|Place and room identity, authority and status — Backend Specification]]
