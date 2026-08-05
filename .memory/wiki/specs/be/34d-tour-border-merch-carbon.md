# Tour border readiness, carnets, withholding, merch and carbon — Backend Specification

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

- **Shard split:** 4 of 4; 34.13, 34.14, 34.15, 34.16 and 34.17.
- **Boundary:** sourced visa/permit tracking, manifest-derived carnet readiness, withholding evidence, offline merch counts and coverage-labelled carbon estimates.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 34 IA/deep dive | border requirements, carnet discrepancy, withholding boundaries, merch movements and factor estimates |
| Shards 24, 31 and 33 | gear manifests/custody, settlement facts and show evidence |

## Border, Merch and Reporting Invariants

- Visa/work-permit readiness pins person/border/date, qualified requirement source, lead time, document validity and alert. Platform gives no legal advice or inferred eligibility.
- Document access is person/purpose scoped; ordinary tour actors see readiness/gap, not document contents.
- Carnet crossing list derives from date manifest and exact serial/value/origin/weight facts. Missing attribute blocks readiness only; platform does not issue carnet or claim customs acceptance.
- Reconciliation appends discrepancy/action/re-entry state against crossing/manifest version; no gear identity/custody fact is overwritten.
- Withholding tracks sourced warning, deadline, specialist refs, forms/certificate and actual fact. It never computes tax rate or advice.
- Merch movements/counts append load-in/sale/comp/damage/return with device/server time. Conflicts remain reconciliation state; no silent overwrite.
- Carbon estimate pins logistics versions/factor set and returns distance/mode/fuel/accommodation estimate, coverage and exclusions. Insufficient input is partial/unknown and carbon readers receive allowlisted aggregates only.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/tours/{id}/border-readiness` | person/border/date/requirement source/document refs/key; border coordinator or person | `201 BorderReadinessResponse`; state/deadline/gaps/version | `403 DOCUMENT_ACCESS_FORBIDDEN`, `409 SOURCE_STALE`, `422 SOURCE_UNQUALIFIED`, `429` |
| `POST /api/v1/tours/{id}/carnet-reconciliations` | crossing/manifest version/rows/actions/key; gear/border coordinator | `201 TourCarnetResponse`; readiness/discrepancies/re-entry | `403`, `409 VERSION_CONFLICT`, `422 ATTRIBUTE_MISSING|DOCUMENT_OWNER_UNKNOWN`, `429` |
| `POST /api/v1/tours/{id}/withholding-readiness` | deal/party/specialist refs/warnings/deadlines/forms/certificate/actual facts/key; finance actor | `201 WithholdingReadinessResponse`; factual state/gaps | `403`, `409 SOURCE_STALE`, `422 SOURCE_UNQUALIFIED`, `429` |
| `POST /api/v1/tours/{id}/merch-movements` | show/SKU/movement/count/device time/expected version/key; merch actor | `201 TourMerchResponse`; movement/balance/conflict | `403`, `409 COUNT_CONFLICT|VERSION_CONFLICT`, `422 SKU_UNKNOWN`, `428`, `429` |
| `POST /api/v1/tours/{id}/carbon-estimates` | logistics versions/factor set/key; authorized reporting actor | `201 TourCarbonResponse`; estimate/coverage/exclusions/unknowns | `403`, `409 SOURCE_STALE`, `422 COVERAGE_INSUFFICIENT|FACTOR_SET_UNAVAILABLE`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Border-readiness assessment | `unknown -> incomplete|ready`; `incomplete -> ready|stale`; `ready -> stale|expired`; `stale|expired -> superseded` | Qualified source/document evaluation derives readiness; source change or document expiry invalidates it, and a new assessment supersedes it. Unknown, incomplete, stale or expired states never imply eligibility or legal advice. |
| Carnet reconciliation | `pending -> reconciled|discrepant`; `discrepant -> action_required|reentry_pending`; `action_required -> reentry_pending|reconciled`; `reentry_pending -> reconciled` | Exact crossing/manifest comparison appends discrepancy, action and re-entry facts. Missing attributes block readiness, and reconciliation never overwrites gear identity or custody. |
| Withholding-readiness assessment | `unknown -> incomplete|ready`; `incomplete -> ready|stale`; `ready -> stale`; `stale -> superseded` | Qualified warning, deadline, form, certificate and actual-fact sources derive the state; changed sources require a successor. No state computes tax or constitutes advice. |
| Merch movement | `accepted -> reconciliation_required`; `reconciliation_required -> reconciled`; `reconciled -> reconciliation_required` | A count/version conflict preserves the append-only movement and opens reconciliation; an authorized counted correction resolves it. Silent overwrite is forbidden and stale writes return `409 VERSION_CONFLICT`. |
| Carbon estimate | `complete|partial|unknown -> stale|superseded`; `stale -> superseded` | Coverage evaluation selects the initial state; any logistics or factor-set successor marks it stale, and a recomputation supersedes it. Partial/unknown results retain exclusions and cannot be presented as complete. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; destructive mutation of sourced evidence or append-only movements returns `409 IMMUTABLE_SOURCE_FACT`.

## Persistence, RLS and Workers

- Border requirement/document refs, carnet crossing/rows/discrepancy/re-entry, withholding evidence, merch movements/conflicts and carbon input/factor/output rows pin source versions.
- RLS exposes readiness without document contents to tour operators, documents to person/scoped coordinator, merch to authorized crew/finance and carbon allowlisted aggregates to reporting readers.
- Alert, carnet, withholding, merch projection and carbon workers are idempotent. None emits legal/tax/customs acceptance or broad PII.

## Failure, Deepening and Ambiguity Gate

Tests cover inferred visa eligibility, document leak, missing-attribute whole-tour block, carnet issuance claim, overwritten gear fact, computed withholding advice, merch last-write-wins, carbon point estimate from sparse inputs and traveler PII in carbon output. Seven passes converge; two implementers receive identical border, merch and carbon behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Border, merch and carbon contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]
- [[specs/ia/deep-dives/34-touring-operations|Deep Dive 34 — Touring operations]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
- [[specs/be/31c-settlement-finality-restatement-export|Live settlement signatures, finality, restatement and export — Backend Specification]]
- [[specs/be/33c-gear-manifest-loadout-daysheet|Show-date gear manifests, load-out and day sheets — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/34-touring-operations|Shard 34 — Tour routing, logistics, finance and reporting]]
- [[specs/ia/deep-dives/34-touring-operations|Deep Dive 34 — Tour routing, logistics, finance and reporting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
- [[specs/be/31c-settlement-finality-restatement-export|Live settlement signatures, finality, restatement and export — Backend Specification]]
- [[specs/be/33c-gear-manifest-loadout-daysheet|Show-date gear manifests, load-out and day sheets — Backend Specification]]
