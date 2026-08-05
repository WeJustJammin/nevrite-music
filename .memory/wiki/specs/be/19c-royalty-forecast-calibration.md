# Conservative royalty forecasts and calibration — Backend Specification

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

- **Shard split:** 3 of 3; RRF-10, RRF-11 and RRF-12.
- **Boundary:** governed forecast eligibility, immutable range generation, actual-based calibration and immediate invalidation on rights/catalogue change.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 19 IA/deep dive | forecast eligibility, uncertainty and calibration algorithm |
| Shards 10 and 18 | rights stability, registrations, coverage and immutable accounting actuals |

## Forecast and Calibration Invariants

- Deterministic in-flight expectations are separated before forecast eligibility and never included as statistical model output.
- Eligibility requires active registration, stable rights basis, governed minimum history and coverage, and enough non-lumpy evidence. Thin/lumpy history returns explicit insufficient-data silence.
- One-off sync/outlier is excluded or robustly modelled with disclosed basis; it never silently establishes recurring baseline.
- Forecast emits lower/upper range, confidence/basis, coverage, horizon, model/version and generated time—or no forecast. It never emits single promised amount.
- Forecast is derived read-only and cannot feed payable balance, payout, credit decision, contract value or guaranteed-income language.
- Each version is immutable. Shard 18 actual versions create calibration with error/coverage; model replacement never rewrites old forecast or hides miss.
- Rights, registration, catalogue or coverage change immediately marks affected forecast `stale|withdrawn` before optional recomputation.
- Projections render range, actual, in-flight, coverage and calibration as distinct typed fields and labels; no UI can collapse them into cash available.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Model inputs/outputs pin policy, data and model hashes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/royalty-forecasts/eligibility` | party/catalogue/horizon/registration/rights/coverage versions; holder/key | `ForecastEligibilityResponse`; eligible/gaps/policy/hash | `403`, `409 SOURCE_STALE`, `422 INSUFFICIENT_DATA`, `429`, `503` |
| `POST /api/v1/royalty-forecasts` | eligibility hash/model version/horizon; holder/key | `202 RoyaltyForecastResponse`; job or explicit silence | `403`, `409 ELIGIBILITY_STALE`, `422 INSUFFICIENT_DATA`, `429`, `503` |
| `POST /internal/v1/royalty-forecasts/{id}/complete` | lower/upper/confidence/basis/coverage/input hashes/event; model worker/key | `RoyaltyForecastResponse`; immutable version | `403`, `409 EVENT_REUSED|RANGE_INVALID`, `422`, `429` |
| `GET /api/v1/royalty-forecasts` | own catalogue/horizon/state cursor | `RoyaltyForecastPage`; ranges/calibration/in-flight separate | `403`, `429`, `503` |
| `POST /internal/v1/royalty-forecasts/{id}/calibrate` | Shard 18 actual versions/error metrics/coverage/event; worker/key | `ForecastCalibrationResponse`; calibrated/stale/withdrawn | `403`, `409 EVENT_REUSED|ACTUAL_VERSION_MISMATCH`, `422`, `429` |
| `POST /internal/v1/royalty-forecasts/invalidate` | catalogue/rights/registration source change/event; worker/key | `ForecastInvalidationResponse`; affected withdrawn/stale IDs | `403`, `409 EVENT_REUSED`, `429`, `503` |

## Persistence, RLS and Workers

- `forecast_eligibility`, `royalty_forecast_version`, `forecast_calibration` and `forecast_invalidation` pin source/accounting/model/policy versions and immutable created time.
- RLS exposes party/catalogue forecast to mandate-scoped holder, calibration aggregate to same audience and model diagnostics to authorized service reviewers without unrelated accounting rows.
- Generation/calibration workers are deterministic and idempotent. Invalidation has priority over publication and prevents stale confident chart from becoming current.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Forecast eligibility | `evaluating → eligible|insufficient_data|ineligible|stale` | Registration/rights/history/coverage/lumpiness policy fold triggers. Thin/lumpy evidence yields explicit silence; deterministic in-flight facts are excluded. |
| Royalty forecast | `queued → generating → published|no_forecast|failed`; published `→ stale|withdrawn|superseded` | Current eligibility/model/input hashes and bounded range output trigger. Single promised amount or invalid range blocks publication; source invalidation outranks publication. |
| Forecast calibration | `pending_actual → calibrated|actual_mismatch|failed`; calibrated `→ superseded` by newer actual/model comparison | Exact Shard 18 actual version and immutable forecast trigger. Model replacement never rewrites old miss or forecast. |
| Forecast projection | `current → stale|withdrawn`; stale may become current only through a newly published forecast version | Rights/registration/catalogue/coverage invalidation or recomputation triggers. Projection keeps range, actual, in-flight, coverage and calibration separate from cash available. |

Every unlisted transition returns the typed state/version/model-hash conflict. Forecasts never feed payability, payout, credit or contract value.

## Failure, Deepening and Ambiguity Gate

Tests cover in-flight blending, thin-history forecast, outlier baseline, single-number promise, payout/credit consumption, retrospective rewrite, hidden miss, calibration without actual version, rights-change race and stale current chart. Seven passes converge; two implementers receive identical forecast behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Forecast and calibration contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Royalty reporting and forecasting]]
- [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Deep Dive 19 — Royalty reporting and forecasting]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, recoupment, restatement and payee statements — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/19-royalty-reporting-forecasting|Shard 19 — Performance reporting, money-in-flight and forecasting]]
- [[specs/ia/deep-dives/19-royalty-reporting-forecasting|Deep Dive 19 — Royalty reporting and forecasting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, recoupment, restatement and payee statements — Backend Specification]]
