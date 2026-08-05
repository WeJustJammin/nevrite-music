# Distribution calendars and money-in-flight expectations — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Royalty reporting and forecasting]]  
**Deep Dive:** [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Royalty reporting deep dive]]

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

- **Shard split:** 2 of 3; RRF-06, RRF-07, RRF-08 and RRF-09.
- **Boundary:** curated provenance-bearing distribution calendars, dated amount-unknown expectations, statement arrival matching and overdue observations.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 19 IA/deep dive | calendar/in-flight algorithm and expectation edge cases |
| Shard 18 | registration state, statement source/right/period and immutable actuals |

## Calendar and In-Flight Invariants

- Calendar version pins body, territory, income type, usage period, distribution date/rule, tolerance, provenance, reviewer and effective interval.
- Calendar changes create reviewed successor; no silent overwrite or unproven crowd-sourced date enters active projection.
- Registration plus applicable calendar yields body/right/period/due-date expectation with amount absent/unknown unless an independent source amount fact exists.
- Deterministic expected date and statistical forecast remain separate models and UI/API fields. Expected date never implies payable balance, custody or guaranteed receipt.
- Statement arrival matches source/right/period evidence independently of expected amount. Unexpected statement reconciles normally; calendar is not an income gate.
- Due date plus versioned tolerance and counterparty-wide delay signal determines overdue. Late is observation, never automatic leakage accusation.
- Calendar ambiguity or missing applicability yields `unverifiable`, not guessed date. Arrival may close or leave unexplained expectation with explicit basis.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Derived expectations cannot mutate Shard 18 accounting.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/distribution-calendars/preflight` | body/territory/income/usage/distribution/tolerance/provenance; curator/key | `CalendarPreflightResponse`; conflicts/gaps/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/distribution-calendars` | preflight/reviewer/effective interval; curator/key | `201 DistributionCalendarResponse`; reviewed active version | `403`, `409 PREFLIGHT_STALE|INTERVAL_CONFLICT`, `422`, `429` |
| `POST /internal/v1/money-in-flight/project` | registration/calendar/right/period versions/event; worker/key | `MoneyInFlightResponse`; dated or unverifiable expectation | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `GET /api/v1/money-in-flight` | mandate-scoped body/right/period/state cursor | `MoneyInFlightPage`; dates/amount-unknown/basis/freshness | `403`, `429`, `503` |
| `POST /internal/v1/money-in-flight/{id}/statement-arrivals` | Shard 18 source/right/period/accounting version/event; worker/key | `MoneyInFlightResponse`; arrived/reconciled/unexplained | `403`, `409 EVENT_REUSED|SOURCE_MISMATCH`, `422`, `429` |
| `POST /internal/v1/money-in-flight/{id}/overdue-evaluate` | due/tolerance/counterparty-delay/version/event; timer worker/key | `MoneyInFlightResponse`; on-time/overdue/unverifiable | `403`, `409 EVENT_REUSED|ARRIVED`, `429`, `503` |

## Persistence, RLS and Workers

- `distribution_calendar_version`, `money_in_flight_expectation`, `statement_arrival_match` and `counterparty_delay_signal` retain provenance and source versions.
- Amount is nullable by schema and absent by default; no zero/fabricated estimate substitutes unknown.
- RLS exposes calendars safely by territory/body, expectations to mandate-scoped holders and delay signals only as aggregated evidence.
- Projector/evaluator jobs are deterministic by source versions. Shard 18 restatement updates arrival link without rewriting original calendar expectation.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Distribution calendar version | `draft → reviewed → active`; active `→ superseded|retired`; draft/reviewed may be rejected | Curator/reviewer preflight and effective interval trigger. Unproven crowd date, conflict or stale provenance blocks activation; no silent overwrite. |
| Money-in-flight expectation | `projecting → expected|unverifiable`; expected `→ on_time|overdue|arrived|unexplained`; unverifiable `→ arrived|superseded` | Registration/calendar/right/period projection, timer and statement-arrival evidence trigger. Amount defaults unknown, and date never implies payable/custody/guarantee. |
| Statement arrival match | `candidate → matched|unexplained|source_mismatch`; matched `→ superseded` by Shard 18 restatement | Independent source/right/period evidence triggers. Unexpected statement reconciles normally; calendar never gates income. |
| Counterparty delay signal | `insufficient → active → stale|retired` | Governed aggregate evidence and freshness trigger. Late observation never becomes leakage accusation or exposes underlying holders. |

Every unlisted transition returns the typed state/version/provenance conflict. Shard 19 cannot mutate Shard 18 accounting.

## Failure, Deepening and Ambiguity Gate

Tests cover unreviewed calendar, overwrite, amount fabrication, date-as-guarantee, forecast blending, unexpected-arrival rejection, calendar-as-income-gate, tolerance drift and late-as-leakage. Seven passes converge; two implementers receive identical calendar and in-flight behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Distribution calendar and in-flight contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Royalty reporting and forecasting]]
- [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Deep Dive 19 — Royalty reporting and forecasting]]
- [[specs/be/18b-statement-ingestion-matching-normalization|Royalty statement ingestion, matching and normalization — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Performance reporting, money-in-flight and forecasting]]
- [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Deep Dive 19 — Royalty reporting and forecasting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/18b-statement-ingestion-matching-normalization|Royalty statement ingestion, matching and normalization — Backend Specification]]
