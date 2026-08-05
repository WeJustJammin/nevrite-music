# Digital contributor consent, accrual and period close — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]  
**Deep Dive:** [[specs/ia/deep-dives/28-digital-licensing-commerce|Digital licensing commerce deep dive]]

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

- **Shard split:** 4 of 4; 28.16, 28.17 and 28.18.
- **Boundary:** contributor use/split consent, per-asset exact accrual, reversal/reconciliation and non-forfeitable close-period statements/holds.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 28 IA/deep dive | separate use/split consent, asset accrual, forward-only amendments and period close |
| Shards 10 and 18 | rights/split authority, exact ledgers, statements and payout gate patterns |

## Contributor Revenue Invariants

- Vendor proposal names every contributor and references a Shard 10 agreement. Each contributor separately consents to use and own split row; single contributor explicitly confirms 100% with no default assignment.
- Use refusal blocks publication. Split disagreement holds only unresolved money under configured policy and never grants use consent by implication.
- Asset is accrual unit. Eligible paid acquisition/download pins consideration allocation, asset, payee, rate, split and period versions; re-download dedupes buyer/asset.
- Self-purchase, refund and chargeback exclude or reverse through immutable entries under the original pinned rule. No manual ledger edit or silent recomputation is allowed.
- Split amendments apply forward from period boundary. Closed statements remain immutable; correction is a linked restatement with visible delta.
- Period close freezes accrual set/rates/splits and reconciles exact decimal/integer-minor-unit entries to the penny with explicit residual policy.
- Contributor sees only own consent, accrual/held funds and reconciliation totals. Vendor sees aggregates, never buyer identity; one contributor cannot inspect another's private row.
- Unresolved or departed shares remain non-forfeitable held funds with claim path. Payout is unreachable until B3 counsel/provider gate passes; closure and statement do not depend on payout.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/digital-products/{id}/contributor-proposals` | parties/use/split rows/Shard-10 agreement/effective period/key; vendor principal | `201 ContributorProposalResponse`; pending rows/total/gaps | `403`, `409 AGREEMENT_STALE`, `422 TOTAL_INVALID`, `429` |
| `POST /api/v1/digital-contributor-proposals/{id}/consents` | own use decision/own split decision/expected row version/key; named contributor | `ContributorConsentResponse`; accepted/refused/disputed row | `403`, `409 VERSION_CONFLICT`, `422 EXPLICIT_100_REQUIRED`, `428`, `429` |
| `POST /internal/v1/digital-contributor-accruals` | acquisition/download/asset/allocation/rate/split/period versions/key; accrual worker | `201 DigitalContributorAccrualResponse`; admitted/excluded/reversed entry | `403`, `409 DEDUPE_HIT|SOURCE_STALE`, `422`, `429` |
| `POST /internal/v1/digital-contributor-accruals/{id}/reversals` | refund/chargeback/source entry/rule version/key; accrual worker | `201 DigitalContributorAccrualResponse`; linked reversal | `403`, `409 REVERSAL_EXISTS`, `422`, `429` |
| `GET /api/v1/digital-contributor/ledger` | own payee/period/cursor; contributor | `DigitalContributorLedgerResponse`; own entries/holds/reconciliation totals | `403`, `429` |
| `POST /internal/v1/digital-contributor-periods/{id}/closes` | frozen accrual/rate/split sets/gate status/event key; close worker | `DigitalContributorPeriodResponse`; closed totals/residual/statement refs | `403`, `409 UNFROZEN|EVENT_REUSED|UNRECONCILED`, `422`, `429` |
| `POST /internal/v1/digital-contributor-periods/{id}/holds` | payee/amount/reason/claim path/source versions/key; finance service | `201 ContributorFundsHoldResponse`; non-forfeitable hold | `403`, `409 HOLD_EXISTS`, `422`, `429` |

## Persistence, RLS and Workers

- Contributor proposal/consent rows, immutable accrual/reversal ledger, frozen period, statement/restatement and held-funds records pin agreement, asset, allocation, rate, split, rule and actor versions using exact numeric storage.
- RLS exposes own rows/ledger/holds to each contributor, aggregates to vendor, full ledger to finance services and no buyer identity in vendor/contributor projections.
- Accrual, reversal, close, statement and gated payout workers are idempotent. Transactional outbox prevents ledger/statement split truth; finance exceptions append dual-controlled evidence.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Contributor proposal/row | proposal `pending → consented|blocked|superseded`; each row `pending → accepted|refused|disputed`; single row requires explicit 100% | Vendor proposal/Shard 10 agreement and each named contributor decision trigger. Use refusal blocks publication; split disagreement never implies use consent. |
| Contributor accrual | immutable `admitted|excluded|reversed`; admitted `→ reversed` only by linked entry | Eligible paid acquisition/download with exact asset/allocation/rate/split/period triggers. Self-purchase/refund/chargeback exclude/reverse; re-download dedupes buyer/asset. |
| Split amendment | `proposed → accepted|refused|disputed`; accepted `→ effective_future_period`; later `→ superseded` | Contributor decisions/period boundary trigger. Closed periods/statements never mutate. |
| Contributor period | `open → freezing → closed|blocked`; closed `→ restated` only by linked correction version | Exact accrual/rate/split set and penny/residual reconciliation trigger. Unfrozen/unreconciled blocks; payout status does not block closure. |
| Held funds | `active → claimed|resolved|superseded`; never `forfeited|redistributed` | Unresolved/departed share and governed claim path trigger. Position is non-forfeitable; payout remains B3-disabled. |

Every unlisted transition returns the typed state/version/ledger conflict. Contributors see own rows only and vendors never see buyer identity.

## Failure, Deepening and Ambiguity Gate

Tests cover implicit use consent, default 100%, split dispute blocking agreed shares, re-download double accrual, self-purchase, refund without reversal, retroactive split, silent closed-period recompute, contributor cross-row leak, forfeited departed share and payout-gated statement. Seven passes converge; two implementers receive identical contributor revenue behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Contributor revenue contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/deep-dives/28-digital-licensing-commerce|Deep Dive 28 — Digital licensing commerce]]
- [[specs/be/10b-splits-points-buyouts-amendments|Splits, points, buyouts and amendments — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, restatement and statements — Backend Specification]]
- [[specs/be/18d-royalty-payout-b3-gate|Royalty payout and B3 gate — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/deep-dives/28-digital-licensing-commerce|Deep Dive 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10b-splits-points-buyouts-amendments|Split capture, producer points, buyouts and amendments — Backend Specification]]
- [[specs/be/18c-royalty-calculation-restatement-statements|Royalty calculation, recoupment, restatement and payee statements — Backend Specification]]
- [[specs/be/18d-royalty-payout-b3-gate|Royalty payout and escrow B3 gate — Backend Specification]]
