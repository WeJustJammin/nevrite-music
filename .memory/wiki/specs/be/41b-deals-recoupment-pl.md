# Deals, recoupment, runway and closing — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]  
**Deep Dive:** [[specs/ia/deep-dives/41-career-finance|Career finance and business operations deep dive]]

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

- **Shard split:** 2 of 2; 41.12, 41.13, 41.14, 41.15, 41.16, 41.17, 41.18 and 41.19.
- **Boundary:** immutable deal instruments and confirmed terms, advisory reconciliation/referrals, clause-cited commission/recoupment, runway ranges, P&L closing and record-only band allocation.
- **Approval:** Recommended two-document split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 41 IA/deep dive | contract instruments, term confirmation, obligations, referrals, calculations, runway, closing and allocation |
| Shard 41a | immutable income, FX, expense and receivable evidence projections |
| Shards 01, 10, 18, 30, 31 and 34 | mandate, rights, royalty, booking, settlement and tour facts |

## Instrument and Term Invariants

- Upload creates immutable document digest/version and deal-chain edge. Replacement appends; per-document delegation never widens to all instruments.
- Extraction produces clause-cited proposal or absence finding only. A term becomes operative for alerts/calculations only after authorized confirmation pins digest, clause, value and version.
- Instrument change invalidates unreviewed proposals and blocks stale confirmation. Confirmed historical versions remain auditable.
- Obligation alerts carry source clause, confidence and action class. Unconfirmed dates are labelled; scheduler failure creates operations incident rather than silent omission.
- Deal-to-rights/finance reconciliation emits cited observation, absence or conflict. It cannot change source facts or make a legal conclusion.

## Referral, Calculation and Runway Invariants

- Advance referral is closed unless the B3/counsel/provider gate is approved. If activated, explicit holder consent selects a minimum verified package; declared income is excluded and WeJammin never approves, prices or promises credit.
- Commission and recoupment use the narrowest confirmed scope, event-date rule, clause version and deterministic source order. Ambiguous rate/scope/sequence holds the row.
- Recoupment is append/reverse only; every entry exposes working and resulting balance. Calculation never authorizes payment or mutates royalty/settlement ledgers.
- Runway is an advisory range from confidence-sufficient net cashflow. Low confidence returns unknown/action routes, never reassurance, wellbeing inference or lending advice.

## P&L and Allocation Invariants

- P&L consumes canonical linked rows plus explainable tag proposals. Untagged, conflicting and unreconciled rows remain visible and excluded or blocking by versioned policy.
- Close preview freezes rows, debts, distribution rule and exceptions. Final close is immutable; late events require explicit reopen reason and superseding close.
- Member-funded debt ranks before profit according to confirmed governance. Allocation is record-only evidence bound to one close version and cannot create transfer, royalty split or payable instruction.

## API Endpoint Matrix

All bodies are strict Zod 4 objects. Mutations require acting-party mandate, `Idempotency-Key`, expected version, audit correlation and endpoint rate limit; typed errors use the Shard 00 envelope.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/finance/deals/{dealId}/instruments` | file digest/effective date/parties/access policy/key; authorized party | `201 DealInstrumentResponse`; immutable version/chain | `403`, `409 DIGEST_EXISTS`, `422 DOCUMENT_INVALID`, `429` |
| `POST /internal/v1/finance/instruments/{id}/term-proposals` | extractor version/clause/value/confidence/key; extraction worker | `201 DealTermProposalResponse`; cited proposal/absence | `403`, `409 EVENT_KEY_CONFLICT`, `422 CITATION_INVALID`, `429` |
| `POST /api/v1/finance/deals/{dealId}/terms` | instrument digest/clause/type/value/expected deal version/key; authorized reviewer | `201 ConfirmedDealTermResponse`; active term/version | `403`, `409 INSTRUMENT_CHANGED|VERSION_CONFLICT`, `422 VALUE_AMBIGUOUS`, `428`, `429` |
| `POST /api/v1/finance/deals/{dealId}/reconciliations` | confirmed term/source fact revisions/scope/key; authorized party | `201 DealReconciliationResponse`; cited observations/conflicts | `403`, `409 SOURCE_STALE`, `422 TERM_UNCONFIRMED|LEGAL_CONCLUSION_FORBIDDEN`, `429` |
| `POST /api/v1/finance/advance-referrals` | provider/verified snapshot/consented fields/terms version/key; holder | `201 AdvanceReferralResponse`; consented package/status | `403 GATE_CLOSED`, `409 CONSENT_STALE`, `422 DECLARED_INCOME_FORBIDDEN|PACKAGE_INSUFFICIENT`, `429` |
| `POST /internal/v1/finance/commission-calculations` | deal/term/source income/rule/order/key; calculation worker | `201 CommissionCalculationResponse`; clause-cited rows/working | `403`, `409 EVENT_KEY_CONFLICT`, `422 SCOPE_AMBIGUOUS|SEQUENCE_UNSPECIFIED`, `429` |
| `POST /internal/v1/finance/recoupment-entries` | deal/source income/term/rule/sequence/debit-credit/key; calculation worker | `201 RecoupmentEntryResponse`; entry/balance/version | `403`, `409 EVENT_KEY_CONFLICT`, `422 TERM_UNCONFIRMED|SEQUENCE_UNSPECIFIED`, `429` |
| `GET /api/v1/finance/runway` | holder/scope/currency/as-of/source versions; holder/delegate | `RunwayRangeResponse`; range/confidence/gap lead/action routes or unknown | `403`, `409 SOURCE_STALE`, `422 CONFIDENCE_INSUFFICIENT`, `429` |
| `GET /api/v1/finance/profit-and-loss/{scope}` | close/provisional/source versions; scoped entity authority | `ProfitAndLossResponse`; rows/tags/exceptions/debts/version | `403`, `409 SOURCE_STALE`, `429` |
| `POST /api/v1/finance/profit-and-loss/{scope}/close-previews` | row/debt/rule/source versions/key; scoped entity authority | `201 ClosePreviewResponse`; frozen preview/exceptions/expiry | `403`, `409 SOURCE_STALE`, `422 GOVERNANCE_RULE_MISSING`, `429` |
| `POST /api/v1/finance/profit-and-loss/{scope}/closings` | preview/expected scope version/key; authorized closer | `201 ClosingVersionResponse`; immutable close/version | `403`, `409 PREVIEW_STALE|VERSION_CONFLICT`, `422 UNRESOLVED_ROW`, `428`, `429` |
| `POST /api/v1/finance/profit-and-loss/{scope}/reopens` | closing/reason/expected version/key; authorized closer | `201 ClosingReopenResponse`; reopen record/draft successor | `403`, `409 VERSION_CONFLICT`, `422 REASON_REQUIRED`, `428`, `429` |
| `POST /api/v1/finance/profit-and-loss/{scope}/allocations` | closing/rule/member debts/shares/key; governance authority | `201 BandAllocationResponse`; record-only allocations | `403`, `409 CLOSING_SUPERSEDED`, `422 GOVERNANCE_RULE_MISSING|TRANSFER_COMMAND_FORBIDDEN`, `429` |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Deal instrument | `current -> superseded` | Replacement appends immutable digest/version and deal-chain edge. Supersession invalidates unreviewed proposals without widening delegation or deleting history. |
| Term proposal | `proposed -> confirmed|rejected|invalidated`; `invalidated -> proposed` only from a new instrument/extractor event | Clause citation and authorized review are required for operative state. Instrument change invalidates stale proposal; absence finding never becomes a term automatically. |
| Confirmed deal term | `active -> superseded|disputed`; `disputed -> active|superseded` | Authorized expected-version confirmation/correction pins digest, clause and value. Only active confirmed scope may drive calculations; stale instrument returns `409 INSTRUMENT_CHANGED`. |
| Deal reconciliation | `evaluating -> observed|absence|conflict`; `conflict -> resolved|disputed`; `observed|absence -> superseded` | Cited comparison of confirmed term and source facts emits a non-mutating result. It cannot alter sources or become a legal conclusion. |
| Advance referral | `gate_closed -> available`; `available -> submitted|declined`; `submitted -> provider_pending|failed`; `provider_pending -> resolved|unknown` | B3/counsel/provider gate and minimum verified consented package permit handoff. Declared income is excluded and no state implies approval, price or credit promise. |
| Commission/recoupment row | `held -> calculated|rejected`; `calculated -> reversed|superseded`; `reversed -> superseded` | Narrow confirmed scope, dated rule and deterministic sequence permit append; ambiguity holds. Reversal is additive and never authorizes payment or mutates source ledgers. |
| P&L close | `open -> previewed`; preview `active -> committed|expired|stale`; scope `previewed -> closed`; `closed -> reopened`; `reopened -> previewed` | Frozen rows/debts/rules/exceptions plus unchanged version commit immutable close. Late facts require reasoned reopen and successor close; unresolved rows block. |
| Band allocation | `recorded` is terminal for its closing version | Governance-authorized record binds debts/shares to one current immutable close. Superseded close blocks allocation and no transition creates transfer, royalty split or payable instruction. |

Every unlisted transition returns `409 INVALID_STATE_TRANSITION`; source mutation, legal conclusion or money-transfer command returns `409 DEAL_FINANCE_BOUNDARY_VIOLATION`.

## Persistence, RLS and Workers

- Restricted tables hold instrument blobs/digests, access grants, proposals, confirmed terms, obligation alerts, reconciliation findings, referrals, calculations, recoupment entries, runway snapshots, P&L projections, close previews/versions/reopens and allocations.
- RLS evaluates current party mandate and document/scope grant under purpose-bound privacy controls. Reviewer, accountant and band delegate access is least privilege; public access is absent. Document contents, clauses, finance amounts and referral payloads never enter shared events.
- Extraction, obligation, referral reconciliation, commission, recoupment, runway and P&L workers/events use transactional outbox, deterministic ordering and idempotency. External timeout is `unknown_reconciling`, never approval/rejection.
- Rate limits separate uploads, interactive calculations and internal events; expensive previews/calculations enforce per-holder concurrency leases.

## Failure, Deepening and Ambiguity Gate

Tests cover replacement overwrite, delegation widening, uncited extraction, stale term confirmation, alert omission, auto-correction, closed referral gate, declared-income referral, ambiguous commission, out-of-order recoupment, calculation-triggered payment, low-confidence reassurance, hidden untagged rows, late-close mutation, missing debt priority and transfer-producing allocation. Seven passes converge; two implementers receive identical deal, calculation and closing behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Deals, recoupment, runway and closing contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]
- [[specs/ia/deep-dives/41-career-finance|Deep Dive 41 — Career finance and business operations]]
- [[specs/be/41a-income-tax-receivables|Income, tax readiness and receivables — Backend Specification]]
- [[specs/be/31a-agency-terms-pipeline-commission|Agency terms, pipeline and commission — Backend Specification]]
- [[specs/be/34c-tour-budgets-actuals-expenses|Tour budgets, actuals and expenses — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]
- [[specs/ia/deep-dives/41-career-finance|Deep Dive 41 — Career finance and business operations]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/41a-income-tax-receivables|Income, tax readiness and receivables — Backend Specification]]
- [[specs/be/31a-agency-terms-pipeline-commission|Agency representation terms, pipeline and commission — Backend Specification]]
- [[specs/be/34c-tour-budgets-actuals-expenses|Tour budgets, actuals and expenses — Backend Specification]]
