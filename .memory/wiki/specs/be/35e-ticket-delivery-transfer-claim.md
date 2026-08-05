# Ticket delivery, pass projection and transfer claim — Backend Specification

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

- **Shard split:** 5 of 5; 35.20 and 35.21.
- **Boundary:** live wallet/fallback pass projection, delivery recovery and signed single-use transfer claims preserving one deterministic ticket identity.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 35 IA/deep dive | pass versioning, channel health, fallback and claim replay protection |
| Shards 01 and 04 | optional account/holder identity and governed delivery artifacts |

## Delivery and Claim Invariants

- Ticket has one deterministic identity across wallet, app, PDF/fallback and transfer epochs. Support may resend/recover under audit but cannot mint duplicate identity.
- Pass projection is live to ticket/show/holder state and pins artifact/channel version. Void/refund/transfer states render as text, never barcode behavior alone.
- Delivery routes include accessible non-wallet fallback and health state. Failure alerts operator and gives fan exact recovery path.
- Transfer claim uses signed, scoped, expiring single-use link and preserves ticket identity while appending holder epoch. Replay fails.
- Account creation is optional for claim. Recipient gets minimum event/pass context before acceptance; sender loses future authority only after atomic claim.
- Package transfer requires all component policies; this contract cannot bypass Shard 35d package restrictions.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /internal/v1/tickets/{id}/delivery-projections` | ticket/show/holder/channel versions/event key; delivery worker | `TicketPassResponse`; live wallet/fallback/artifact health | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `422 TICKET_VOID|DELIVERY_UNAVAILABLE`, `429` |
| `POST /api/v1/tickets/{id}/delivery-recoveries` | desired channel/reason/key; holder or audited support | `TicketDeliveryRecoveryResponse`; resent/refreshed route | `403`, `409 DUPLICATE_IDENTITY_FORBIDDEN`, `422 DELIVERY_UNAVAILABLE`, `429` |
| `POST /api/v1/tickets/{id}/transfer-links` | recipient hint/scope/expiry/expected version/key; current holder | `201 TicketTransferLinkResponse`; signed single-use link | `403`, `409 TRANSFER_FORBIDDEN|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/ticket-transfer-claims` | signed link/recipient identity-or-contact/key; recipient | `201 TicketPassResponse`; same identity/new holder epoch | `403`, `409 CLAIM_LINK_REPLAYED|CLAIM_LINK_EXPIRED`, `422 PACKAGE_POLICY_FORBIDDEN`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Ticket identity | `issued -> transferred|redeemed|void|refunded`; `transferred -> transferred|redeemed|void|refunded` | Atomic claim appends a holder epoch without replacing identity; admission, authorized void or refund changes live eligibility. Terminal redeemed/void/refunded tickets cannot transfer or regain validity. |
| Holder epoch | `current -> superseded` | Successful single-use claim atomically creates the next holder epoch and supersedes sender authority. Superseded holders may view permitted history but cannot recover, transfer or render a current pass. |
| Pass projection | `rendering -> healthy|degraded|failed`; `healthy|degraded -> stale`; `stale|failed -> rendering` | Source-version event renders every allowed channel; partial channel failure is degraded, total unavailable delivery is failed, and any ticket/show/holder successor marks it stale. Stale/void/refund state must render as text as well as barcode behavior. |
| Delivery attempt | `queued -> sent|failed`; `failed -> retrying|closed`; `retrying -> sent|failed` | Channel adapter result advances the attempt under bounded idempotent recovery. Failure alerts operators and exposes the exact accessible fallback; retries never mint a new ticket identity. |
| Transfer link | `active -> claimed|expired|revoked`; `claimed|expired|revoked -> active` is forbidden | Atomic claim consumes the signed scope and creates the next holder epoch; TTL, source-version change or sender revocation terminates it. Replay returns `409 CLAIM_LINK_REPLAYED`; expired use returns `409 CLAIM_LINK_EXPIRED`. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; duplicate ticket identity creation returns `409 DUPLICATE_IDENTITY_FORBIDDEN`.

## Persistence, RLS and Workers

- Ticket identity/holder epochs, pass projection/artifact/channel health, delivery attempts/recovery audit and transfer link/claim rows pin source and policy versions.
- RLS exposes own pass/delivery state to holder, minimum preview to intended claimant and channel diagnostics to operator/support; signing secrets and prior-holder private data remain server-only.
- Projection, health, recovery and claim workers are idempotent. Atomic holder epoch change and link consumption prevent split authority.

## Failure, Deepening and Ambiguity Gate

Tests cover support duplicate ticket, wallet-only delivery, barcode-only void, stale pass, silent delivery failure, reusable transfer link, forced account creation, sender authority after claim, identity replacement and package-policy bypass. Seven passes converge; two implementers receive identical ticket delivery and claim behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Ticket delivery and transfer contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products and sales]]
- [[specs/be/01a-auth-account-linking|Authentication and account linking — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media renditions — Backend Specification]]
- [[specs/be/35d-ticket-vip-rsvp-conversion|Ticket VIP packages, RSVP and free-to-paid conversion — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/deep-dives/35-ticket-products-sales|Deep Dive 35 — Ticket products, sales, access packages and delivery]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01a-auth-account-linking|Authentication, additive login methods and account merge — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/35d-ticket-vip-rsvp-conversion|Ticket VIP packages, RSVP and free-to-paid conversion — Backend Specification]]
