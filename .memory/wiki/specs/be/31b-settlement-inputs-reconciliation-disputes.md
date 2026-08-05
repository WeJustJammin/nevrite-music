# Live settlement inputs, reconciliation and disputes — Backend Specification

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

- **Shard split:** 2 of 5; 31.04, 31.05, 31.06, 31.07, 31.08 and 31.09.
- **Boundary:** settlement opening, box-office/expense/merch evidence, deterministic recomputation and causal line disputes.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 31 IA/deep dive | exact expression evaluation, source reconciliation, version fan-out and disputes |
| Shards 06 and 30 | evidence/dispute cases and accepted commercial expression |

## Settlement Input Invariants

- Settlement opens only from confirmed/performed Shard 30 deal plus accepted expression and show/run refs. Every term is evaluated against exact grammar; missing/unmodellable terms remain visible and suppress finality.
- Box office separately reconciles sold, paid and all-admissions counts, tiers, fees, comps and source provenance. Gap is priced and attributed; platform never adjudicates truth.
- Expense captures exact amount/currency, category, cap treatment, receipt/assertion, payer and device/server times. Unreceipted handling follows the accepted deductibility rule rather than hidden exclusion.
- Merch reconciliation pins count-in/out, cash/statement evidence, sell-through, basis, rate bands, allocations and venue cut. Bundle/basis ambiguity creates unresolved line.
- Any source change creates a complete successor sheet version with old/new values, formulas, totals, unresolved count and monetary/non-money variance fan-out; prior signed version remains immutable.
- Contest names causal input/line, basis, quantified exposure and evidence. Contesting a derived line redirects to causal inputs; undisputed floor remains separately visible/payable.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/live-settlements` | accepted deal/expression/show-run/source versions/key; deal participant | `201 SettlementSheetResponse`; proposed sheet/unresolved terms | `403`, `409 DEAL_NOT_SETTLEABLE`, `422 EXPRESSION_MISSING|TERM_UNEVALUATED`, `429` |
| `POST /api/v1/live-settlements/{id}/box-office-inputs` | count classes/tiers/fees/comps/sources/provenance/key; authorized settlement actor | `201 SettlementSheetResponse`; reconciled successor/gaps | `403 SOURCE_FORBIDDEN`, `409 VERSION_CONFLICT`, `422 PROVENANCE_REQUIRED`, `429` |
| `POST /api/v1/live-settlements/{id}/expenses` | amount/currency/category/cap/receipt-or-assertion/payer/times/key; authorized actor | `201 SettlementSheetResponse`; successor/deductibility | `403`, `409 VERSION_CONFLICT`, `422 CATEGORY_INVALID`, `429` |
| `POST /api/v1/live-settlements/{id}/merch-inputs` | count-in-out/sales/basis/rates/allocations/venue cut/evidence/key; authorized actor | `201 SettlementSheetResponse`; successor/unresolved lines | `403`, `409 VERSION_CONFLICT`, `422 BASIS_AMBIGUOUS`, `429` |
| `POST /internal/v1/live-settlements/{id}/recomputations` | causal source input/expected sheet version/event key; settlement worker | `SettlementSheetResponse`; complete successor/variance fan-out | `403`, `409 EVENT_REUSED|VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/live-settlement-lines/{id}/contests` | causal input/basis/exposure/evidence/key; participant | `201 SettlementLineDisputeResponse`; open/undisputed floor/case | `403`, `409 ALREADY_RESOLVED`, `422 LINE_NOT_CONTESTABLE|EXPOSURE_INVALID`, `429` |

## Persistence, RLS and Workers

- Settlement sheet/version/expression evaluation, box-office counts, expense, merch input, provenance, formula result, variance and line dispute rows are append-only and use exact numeric storage.
- RLS exposes shared deal/count/expense/merch lines to settlement sides, private side-only assumptions outside shared sheet, and evidence to participants/case reviewers. Raw payment/provider data remains restricted.
- Recompute, variance notification and dispute routing workers are idempotent; every output cites causal input and source versions.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Settlement sheet | `proposed → input_pending → provisional|ready_for_signature|blocked`; any source change appends `superseded` successor | Confirmed/performed deal, accepted expression and exact grammar/input versions trigger. Missing/unmodellable terms suppress finality. |
| Box-office reconciliation | `pending → reconciled|gap|contested|unverifiable`; result `→ superseded` | Sold/paid/all-admission classes, tiers, fees, comps and provenance trigger. Gap is priced/attributed; platform never adjudicates truth. |
| Expense/merch input | immutable `admitted|unresolved|contested|superseded` | Exact amount/category/evidence/rule or count/basis/rate/allocation trigger. Hidden unreceipted exclusion and guessed bundle basis are forbidden. |
| Recompute/variance | `queued → completed|blocked|failed`; completed creates complete successor and fan-out | Causal source input/current sheet version triggers. Prior signed version never mutates and output cites cause. |
| Settlement-line contest | `open → case_linked → resolved|closed|superseded`; disputed floor remains separately visible | Causal input/basis/exposure/evidence trigger. Derived-line contest redirects to causal source and cannot suppress undisputed floor. |

Every unlisted transition returns the typed state/version/input conflict. Evidence and side-private assumptions remain scoped.

## Failure, Deepening and Ambiguity Gate

Tests cover unevaluated-term finality, count-class collapse, platform adjudication, hidden unreceipted exclusion, merch bundle guess, in-place recomputation, signed-version mutation, derived-line orphan dispute and disputed-floor suppression. Seven passes converge; two implementers receive identical settlement input and dispute behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Settlement input and dispute contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Live settlement intelligence]]
- [[specs/be/06a-case-intake-evidence|Case intake and evidence — Backend Specification]]
- [[specs/be/30c-booking-documents-payments-announcement|Booking announcement, documents, amendments and payment assertions — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/31-live-settlement-intelligence|Shard 31 — Agency, settlement and live-market intelligence]]
- [[specs/ia/deep-dives/31-live-settlement-intelligence|Deep Dive 31 — Agency, settlement and live-market intelligence]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/30c-booking-documents-payments-announcement|Booking announcement, documents, amendments and payment assertions — Backend Specification]]
