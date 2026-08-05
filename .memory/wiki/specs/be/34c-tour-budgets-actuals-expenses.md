# Tour budgets, actuals and expenses — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]  
**Deep Dive:** [[specs/ia/deep-dives/34-touring-operations|Touring operations deep dive]]

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

- **Shard split:** 3 of 4; 34.10, 34.11 and 34.12.
- **Boundary:** versioned multi-currency budgets, source-linked actual accrual/variance and attributable offline-capable expense capture.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 34 IA/deep dive | budget proposals, source actuals, FX basis, receipt/OCR and permissions |
| Shards 18, 31 and 33 | exact ledgers, settlement actuals and show-day expense facts |

## Tour Finance Invariants

- Budget is immutable proposal version by tour/date/category with exact amount/currency, FX basis/rate source/time and permissions. Unsupported free-form total rejects.
- Shared allocation references source instrument/invoice and contributes only allocated portion; it never duplicates invoice truth.
- Actual appends from authoritative settlement, travel, expense or merch fact and pins source/version. Ambiguous source remains pending and excluded from confirmed totals.
- Variance preserves planned and actual source, formula, currency, FX basis and text explanation. Prior period/budget versions never mutate.
- Expense capture supports offline draft with actor/date/category/original currency, receipt or explanation, source and device/server times. OCR is suggestion only; mismatch requires confirmation.
- Finance roles see permitted rows; ordinary band member receives governed aggregate P&L without private vendor/person details.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/tours/{id}/budget-versions` | dates/categories/amounts/currencies/FX basis/permissions/expected version/key; finance role | `201 TourBudgetResponse`; per-date/tour totals/version | `403 PERMISSION_DENIED`, `409 VERSION_CONFLICT`, `422 CATEGORY_INVALID|FX_BASIS_REQUIRED`, `428`, `429` |
| `POST /internal/v1/tour-actuals` | tour/date/category/source fact/amount/currency/key; actual worker | `201 TourActualResponse`; confirmed/pending actual/variance | `403`, `409 IDEMPOTENCY_CONFLICT|PERIOD_LOCKED`, `422 SOURCE_AMBIGUOUS`, `429` |
| `POST /api/v1/tours/{id}/expenses` | actor/date/category/amount/currency/receipt-or-explanation/device time/key; authorized spender | `201 TourExpenseResponse`; draft/confirmed/OCR comparison | `403`, `409 DUPLICATE_EXPENSE`, `422 RECEIPT_OR_EXPLANATION_REQUIRED`, `429` |
| `POST /api/v1/tour-expenses/{id}/confirmations` | reviewed OCR/source fields/expected version/key; expense actor or finance reviewer | `TourExpenseResponse`; confirmed/version | `403`, `409 OCR_MISMATCH|VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/tours/{id}/finance` | permitted scope/as-of/cursor; tour member or finance role | `TourFinanceResponse`; row or aggregate projection/formulas/freshness | `403`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Tour budget version | `current -> superseded` | An authorized expected-version write creates the immutable successor and atomically supersedes the prior proposal. Stale writes return `409 VERSION_CONFLICT`; locked or prior versions never mutate. |
| Tour actual | `pending -> confirmed|rejected`; `confirmed -> restated`; `restated -> restated` | Authoritative source resolution confirms or rejects a pending fact; a later source correction appends a restatement. Pending/rejected facts remain outside confirmed totals, and locked periods return `409 PERIOD_LOCKED`. |
| Expense | `draft -> confirmed|rejected`; `confirmed -> corrected`; `rejected -> draft` | Actor or permitted reviewer confirms exact reviewed source fields, rejects an unsupported claim, or appends a correction. Receipt/explanation absence blocks creation; stale confirmation returns `409 VERSION_CONFLICT`. |
| OCR comparison | `suggested -> accepted|mismatch|dismissed`; `mismatch -> accepted|dismissed` | Explicit field-by-field review resolves the suggestion. OCR never confirms an expense; unresolved mismatch returns `409 OCR_MISMATCH`. |
| Finance projection | `fresh -> stale`; `stale -> rebuilding -> fresh`; `rebuilding -> failed`; `failed -> rebuilding` | Any accepted budget, actual, expense, allocation or FX-source successor marks affected projections stale. Reads disclose freshness; failed rebuilds preserve the last projection and never relabel it fresh. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; destructive mutation of ledger facts or immutable versions returns `409 IMMUTABLE_FINANCE_FACT`.

## Persistence, RLS and Workers

- Budget/category/FX/permission versions, source actual/pending state, variance and expense/receipt/OCR/confirmation rows use exact numeric storage and immutable source refs.
- RLS exposes finance rows by permitted role, own expenses to actor and aggregate P&L to ordinary members; receipt images and vendor/person details remain restricted.
- Actual ingestion, FX/variance, OCR and finance projection workers are idempotent. OCR/provider ambiguity cannot confirm value.

## Failure, Deepening and Ambiguity Gate

Tests cover free-form total, missing FX basis, duplicated shared invoice, ambiguous actual in confirmed total, in-place budget edit, hidden formula, OCR auto-accept, receipt leak and ordinary-member line-item access. Seven passes converge; two implementers receive identical tour finance behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Tour budget, actual and expense contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]
- [[specs/ia/deep-dives/34-touring-operations|Deep Dive 34 — Touring operations]]
- [[specs/be/31b-settlement-inputs-reconciliation-disputes|Live settlement inputs, reconciliation and disputes — Backend Specification]]
- [[specs/be/33d-safety-weather-postshow-corrections|Show safety evidence, weather decisions and post-show corrections — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]
- [[specs/ia/deep-dives/34-touring-operations|Deep Dive 34 — Tour routing, logistics, finance and reporting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/31b-settlement-inputs-reconciliation-disputes|Live settlement inputs, reconciliation and disputes — Backend Specification]]
- [[specs/be/33d-safety-weather-postshow-corrections|Show safety evidence, weather decisions and post-show corrections — Backend Specification]]
