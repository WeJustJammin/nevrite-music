# Royalty calculation, recoupment, restatement and payee statements — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]  
**Deep Dive:** [[specs/ia/deep-dives/18-royalty-accounting|Royalty accounting deep dive]]

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

- **Shard split:** 3 of 5; ROY-11, ROY-12, ROY-13, ROY-14 and ROY-15.
- **Boundary:** authored executable terms, exact bitemporal calculation, separate recoupment/payability, transitive restatement and immutable payee statements.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 18 IA/deep dive | normalization/calculation and recoupment/restatement/statement algorithms |
| Shard 10 | works, recordings, rights, splits, allocations and title conflicts |

## Calculation and Statement Invariants

- Deal terms are authored closed-taxonomy facts with order, scope, effective time and recorded time. Engine never interprets contract prose.
- `no deal` may yield raw split; `known deal, terms missing` yields no amount. Contradictory or unrepresentable terms place calculation hold.
- Parameter set resolves bitemporally by recording→work allocation, right type, territory, source, split, entities and terms at usage and knowledge time.
- Missing usable period is exception unless a bounded period proves one split version. Usage spans split versions only at finest source-supplied sub-period.
- Allocation occurs in source currency before conversion. Exact decimal precision is at least 9 dp; engine itemizes deductions and never nets or rounds.
- Parts below whole remain visible residual routed to rights/exception; nothing silently redistributes.
- Earnings, recoupment, cross-collateralization, payability, provider transfer and receipt are separate facts. Unknown terms/advance state produce explicit unknown, never fabricated payability.
- Source correction, mapping reversal or rights/allocation/term change creates successor calculation and transitive restatement; prior versions never overwrite.
- Restatement traverses calculation→recoupment→payee statement→future payout reference and records cause/delta per edge. Dispute absorbs new version; stale resolution cannot win.
- Payee statement freezes display FX/coverage and separately states earned, deducted, applied, payable and paid with drill-through and breaks. Zero statements remain valid immutable versions.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Calculations are reproducible by complete parameter-set and engine hashes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/royalty-deal-term-sets` | parties/scope/order/effective/recorded/closed terms; authorized administrator/key | `201 DealTermSetResponse`; executable/held version | `403`, `409 TERM_CONTRADICTION`, `422 TERM_UNREPRESENTABLE`, `429` |
| `POST /api/v1/royalty-calculations/preflight` | normalized rows/rights/allocation/terms/as-of times; administrator/key | `CalculationPreflightResponse`; exact inputs/holds/hash | `403`, `409 SOURCE_STALE`, `422 PERIOD_UNKNOWN|TERMS_UNKNOWN`, `429` |
| `POST /api/v1/royalty-calculations` | preflight/engine version; administrator/key | `202 RoyaltyCalculationResponse`; immutable job/state | `403`, `409 PREFLIGHT_STALE`, `422`, `429`, `503` |
| `POST /internal/v1/royalty-calculations/{id}/complete` | derivation lines/deductions/residuals/input hashes/event; worker/key | `RoyaltyCalculationResponse`; party-scoped results | `403`, `409 EVENT_REUSED|CONSERVATION_FAILED`, `422`, `429` |
| `GET /api/v1/royalty-calculations/{id}` | scoped party/administrator | `RoyaltyCalculationResponse`; authorized drill-through | `403`, `404`, `429`, `503` |
| `GET /api/v1/royalty-recoupment/{partyId}` | scoped payee/administrator/as-of | `RecoupmentPositionResponse`; earnings/advance/applications/payability/unknown | `403`, `404`, `429`, `503` |
| `POST /internal/v1/royalty-restatements` | cause/source successor/affected graph/event; worker/key | `202 RoyaltyRestatementResponse`; traversal/version | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `GET /api/v1/royalty-restatements/{id}` | affected party/administrator | `RoyaltyRestatementResponse`; causes/deltas/successors | `403`, `404`, `429`, `503` |
| `POST /api/v1/payee-statements/preflights` | payee/coverage/calculation/recoupment/display FX versions; administrator/key | `PayeeStatementPreflight`; lines/breaks/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/payee-statements` | preflight hash/expected version; administrator/key | `201 PayeeStatementResponse`; immutable zero/nonzero version | `403`, `409 PREFLIGHT_STALE`, `422`, `428`, `429` |

## Persistence, RLS and Workers

- `deal_term_set`, `calculation_parameter_set`, `royalty_calculation`, `calculation_line`, `recoupment_position`, `royalty_restatement`, `payee_statement` and lines are immutable-versioned.
- Exact decimal check/conservation constraints ensure source allocation = party lines + deductions + residual at declared precision.
- RLS exposes each payee only scoped results/statements, administrators mandate-scoped corpus and workers immutable source IDs. Cross-payee terms and results are denied.
- Restatement graph uses dependency edges and stable cause ID; worker retries idempotently and never exposes mixed old/new statement as current.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Deal term set | `draft → executable|held`; executable/held `→ superseded` | Closed-taxonomy validation and authorized append trigger. Contradictory/unrepresentable/missing known terms hold calculation; prose is never interpreted. |
| Royalty calculation | `preflight → queued → running → completed|held|failed`; completed/held `→ superseded` by restatement | Exact bitemporal parameter/engine hashes trigger. Unknown period/terms, conservation failure or stale sources block completion; no line silently nets/rounds/disappears. |
| Recoupment position | immutable derived `known|unknown`; current pointer `active → superseded` | Completed calculation plus known advance/application facts trigger. Unknown state never fabricates payability. |
| Restatement | `queued → traversing → completed|failed|blocked`; failed may retry with stable cause ID | Source/mapping/rights/term successor dependency graph triggers. Disputed scope invalidates stale resolution; mixed old/new current statement is forbidden. |
| Payee statement | `preflight → issued|blocked`; issued `→ superseded` by restatement, including immutable zero statements | Exact calculation/recoupment/display-FX coverage trigger. Stale source blocks; earned/deducted/applied/payable/paid remain separate. |

Every unlisted transition returns the typed state/version/parameter-hash conflict. Cross-payee terms and results remain denied.

## Failure, Deepening and Ambiguity Gate

Tests cover prose interpretation, assumed terms, bitemporal mismatch, split-period guess, conversion-before-allocation, float use, engine rounding, hidden residual, earnings/payability merge, overwrite restatement, partial traversal, stale dispute race and zero-statement suppression. Seven passes converge; two implementers receive identical calculation and statement behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Calculation and statement contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
- [[specs/be/10b-splits-points-buyouts-amendments|Splits, points, buyouts and amendments — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
- [[specs/be/10b-splits-points-buyouts-amendments|Split capture, producer points, buyouts and amendments — Backend Specification]]
