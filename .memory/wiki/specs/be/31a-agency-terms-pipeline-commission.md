# Agency representation terms, pipeline and commission — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]  
**Deep Dive:** [[specs/ia/deep-dives/31-live-settlement-intelligence|Live settlement intelligence deep dive]]

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

- **Shard split:** 1 of 5; 31.01, 31.02 and 31.03.
- **Boundary:** scoped representation economics, derived agency pipeline projection and exact commission accrual without at-source fan-out.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 31 IA/deep dive | representation basis, roster projection and settlement-derived commission |
| Shards 01, 18 and 30 | representation authority, exact statements and accepted deal state |

## Agency and Commission Invariants

- Representation terms attach to an active scoped Shard 01 edge and append immutable versions containing territory/service scope, basis line, exact rate, approvals, effective interval and sunset.
- Ambiguous `net`, undefined basis or unsupported scope rejects. Termination removes future roster access but preserves historical commission evidence.
- Agency pipeline owns no booking state; it derives stage, confidence, gross, commission and represented-party net from authoritative Shard 30/31 sources and labels projection age.
- Commission accrues only from final/provisional settlement under the representation version effective for the represented-party share. Restatement appends linked commission delta.
- At-source multi-payee fan-out remains disabled behind B3. Launch produces exact commission statement/invoice obligation rather than holding or redirecting represented-party funds.
- Agency access is representation-edge scoped. Private counterparty economics, unrelated roster and represented-party tax/payment data never enter pipeline projection.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/representation-edges/{id}/commercial-terms` | scope/basis/rate/effective interval/sunset/approvals/key; both binding parties | `201 RepresentationTermsResponse`; immutable version | `403`, `409 EDGE_INACTIVE|APPROVAL_INCOMPLETE`, `422 SCOPE_INVALID|BASIS_UNDEFINED`, `429` |
| `GET /api/v1/agencies/{id}/booking-pipeline` | roster scope/stages/as-of/cursor; authorized agency actor | `AgencyPipelineResponse`; derived rows/confidence/freshness | `403`, `429`, `503` |
| `POST /internal/v1/live-commission/accruals` | settlement/version/represented share/terms version/event key; commission worker | `201 LiveCommissionAccrualResponse`; exact obligation/state | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `422 B3_AT_SOURCE_FANOUT_DISABLED`, `429` |
| `POST /internal/v1/live-commission/accruals/{id}/restatements` | causal settlement restatement/source entry/key; commission worker | `201 LiveCommissionAccrualResponse`; linked delta | `403`, `409 RESTATEMENT_EXISTS`, `422`, `429` |
| `GET /api/v1/agencies/{id}/commission-statements` | represented party/period/cursor; scoped agency actor | `AgencyCommissionStatementResponse`; accruals/deltas/totals | `403`, `429` |

## Persistence, RLS and Workers

- Representation commercial-term versions, pipeline projection and immutable commission accrual/restatement rows pin edge, settlement, represented share, basis and rate versions with exact numeric storage.
- RLS exposes terms to edge parties, roster pipeline to scoped agency roles and commission evidence only to represented party/agency/finance roles; unrelated roster facts remain hidden.
- Pipeline, commission and statement workers consume transactional-outbox events idempotently; lag is explicit and never changes booking/settlement authority.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Representation commercial terms | `draft → active|rejected`; active `→ expired|terminated|superseded` | Both binding parties/current scoped Shard 01 edge and exact basis/rate/scope trigger. Undefined net/unsupported scope blocks; termination removes future access only. |
| Agency pipeline projection | `current → stale|rebuilding`; rebuilding `→ current|failed`; rows derive stage/confidence/economics from authoritative sources | Shard 30/31 events trigger. Projection never owns booking state and lag remains labelled. |
| Commission accrual | immutable `provisional|final|held`; current `→ restated` through linked delta | Settlement status/represented share/effective terms trigger. Wrong share/version blocks; no in-place recomputation. |
| Commission obligation | `open → invoiced|discharged|contested|waived`; launch never `at_source_paid` | Exact accrual/statement/bilateral evidence triggers. B3 blocks fan-out and platform never holds/redirects represented funds. |

Every unlisted transition returns the typed state/version/representation conflict. Pipeline and statements remain edge-scoped with unrelated economics hidden.

## Failure, Deepening and Ambiguity Gate

Tests cover undefined net basis, inactive-edge terms, post-termination roster access, pipeline-owned booking state, commission from wrong share/version, silent restatement, B3 source fan-out and unrelated roster leak. Seven passes converge; two implementers receive identical agency and commission behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Agency terms and commission contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Live settlement intelligence]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, restatement and statements — Backend Specification]]
- [[specs/be/30b-booking-offers-approval-acceptance|Booking offers, counters, approvals and confirmation — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Agency, settlement and live-market intelligence]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, recoupment, restatement and payee statements — Backend Specification]]
- [[specs/be/30b-booking-offers-approval-acceptance|Booking offers, counters, approvals and confirmation — Backend Specification]]
