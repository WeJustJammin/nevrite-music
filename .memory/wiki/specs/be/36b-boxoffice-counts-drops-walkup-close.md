# Box-office counts, immutable drops, walk-up sales and close — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]  
**Deep Dive:** [[specs/ia/deep-dives/36-box-office-risk|Box-office risk deep dive]]

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

- **Shard split:** 2 of 5; 36.06, 36.07, 36.08, 36.09 and 36.10.
- **Boundary:** sourced live counts, deal-scoped immutable drops, reference-based pacing, walk-up inventory/float and attested box-office close.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 36 IA/deep dive | source/freshness counters, drops, pacing, walk-up and close |
| Shards 31 and 35 | settlement count consumers and manifest/order truth |

## Count and Close Invariants

- Count snapshot stores every source, freshness, arithmetic and reconciliation state and never silently averages.
- Authorized deal/role projections receive consistent aggregate; fan receives availability boolean only. Counterparty act may counter-attest under deal scope.
- Immutable drop pins recipient/scope/deal term/source/freshness/movement. Later scope changes forward only.
- Pacing requires explicit break-even/trajectory reference and returns actionable deviation or silence; absent reference yields no claim.
- Walk-up sale atomically consumes manifest unit at current all-in price, issues ticket/admission at birth and records cash/card/float facts.
- Offline authorized-block oversell is honored as evidence then reconciled/attributed, never silently erased.
- Close requires drained sales and reconciled or reasoned-written-off devices, certified counters, float, exceptions and attestations. Unknown counter/device prevents unreasoned close.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/box-office/events/{id}/counts` | deal/role projection/as-of; authorized actor | `BoxOfficeCountResponse`; sources/freshness/arithmetic | `403`, `429`, `503` |
| `POST /api/v1/box-office/events/{id}/drops` | recipient/scope/deal term/count version/key; box-office lead | `201 BoxOfficeDropResponse`; immutable snapshot | `403`, `409 SOURCE_STALE`, `422 SCOPE_INVALID`, `429` |
| `POST /api/v1/box-office/events/{id}/pacing-evaluations` | count/break-even/trajectory versions/key; authorized operator | `201 BoxOfficePacingResponse`; deviation/silence/basis | `403`, `409 SOURCE_STALE`, `422 REFERENCE_REQUIRED`, `429` |
| `POST /api/v1/box-office/events/{id}/walk-up-sales` | window/manifest units/all-in price/payment/holder/device block/key; seller role | `201 TicketOrderResponse`; sale/ticket/admission/float state | `403`, `409 INVENTORY_UNAVAILABLE|PRICE_STALE`, `422`, `429` |
| `POST /api/v1/box-office/events/{id}/closes` | count snapshot/devices/float/exceptions/attestations/key; box-office lead | `201 BoxOfficeCloseResponse`; close version/gaps/certification | `403`, `409 SALE_DRAINING`, `422 DEVICE_UNRECONCILED|COUNTER_UNKNOWN|REASON_REQUIRED`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Count snapshot | `current -> stale|superseded`; `stale -> superseded` | Any source/freshness/reconciliation successor marks the snapshot stale; recomputation creates an immutable successor. Competing or unknown sources remain explicit and are never averaged into a state transition. |
| Count drop | `issued -> superseded` | A later authorized recipient/scope/deal-term snapshot creates a forward-only successor. Issued drops are immutable; stale source returns `409 SOURCE_STALE`. |
| Pacing evaluation | `current -> stale|superseded`; `stale -> superseded` | Count, break-even or trajectory source change marks the run stale; a new run supersedes it. Missing reference produces no claim rather than a fabricated trajectory state. |
| Walk-up sale | `initiated -> committed|failed|reconciliation_required`; `reconciliation_required -> committed|failed` | Inventory, current all-in price, payment, ticket/admission and float facts commit atomically. Offline backed oversell enters reconciliation with attribution; it is never deleted or silently normalized. |
| Box-office close | `open -> draining -> ready -> closed`; `draining|ready -> blocked`; `blocked -> draining` | Close request drains sales, reconciles or reasons each device, and verifies counters, float, exceptions and attestations before certification. Unknown or unreasoned inputs block close; closed is terminal and preserves all gaps. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; mutation of issued drops, committed sales or certified closes returns `409 IMMUTABLE_BOX_OFFICE_FACT`.

## Persistence, RLS and Workers

- Count source/version, drop, pacing run, walk-up sale/inventory/payment/float and close/device/exception/attestation rows pin source versions.
- RLS exposes aggregate deal counts to qualified parties, own operational view to box office and only availability boolean publicly; payment data stays restricted.
- Count, drop, pacing, walk-up reconciliation and close workers are idempotent; no unknown source becomes certified automatically.

## Failure, Deepening and Ambiguity Gate

Tests cover silent count averaging, fan exact count, mutable drop, pacing without reference, walk-up admission after delay, offline oversell deletion, unresolved-device close and hidden close exception. Seven passes converge; two implementers receive identical box-office count and close behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Count, walk-up and close contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Box-office risk]]
- [[specs/be/31b-settlement-inputs-reconciliation-disputes|Live settlement inputs, reconciliation and disputes — Backend Specification]]
- [[specs/be/35b-ticket-carts-orders-waitlists|Ticket carts, orders and returned-inventory waitlists — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/deep-dives/36-box-office-risk|Deep Dive 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/31b-settlement-inputs-reconciliation-disputes|Live settlement inputs, reconciliation and disputes — Backend Specification]]
- [[specs/be/35b-ticket-carts-orders-waitlists|Ticket carts, orders and returned-inventory waitlists — Backend Specification]]
