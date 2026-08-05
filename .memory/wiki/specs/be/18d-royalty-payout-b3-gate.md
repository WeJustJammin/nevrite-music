# Royalty payout and escrow B3 gate — Backend Specification

**Status:** Complete; payout execution disabled  
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

- **Shard split:** 4 of 5; ROY-16 only.
- **Boundary:** hard denial of royalty payout, pooled funds and escrow representation pending B3 counsel/provider evolution.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 18 IA/deep dive | B3 payout/escrow gate and abuse verification |
| Shards 00 and 14 | provider adapter/reconciliation and existing B3 multi-party supply denial |

## B3 Gate Invariants

- Current capability is calculation/reporting only. `ExecuteRoyaltyPayout` always returns `PAYOUT_DISABLED_B3` before provider, KYC, tax or money movement effect.
- Calculated balances are derived liabilities/positions, never described as WeJammin-held funds, wallet deposits, pooled balances, escrow or guaranteed money.
- Disputed scope may be marked held in calculation, but no party/admin can release provider escrow because none exists.
- Unpayable or erased payee balance remains attributable under legal policy and never becomes float, platform revenue, forfeiture or redistribution.
- No admin, feature flag, direct database function, queue worker or provider webhook bypasses B3.
- Future `/evolve-feature` requires counsel, payment provider, KYC/AML, tax, money-transmission, ledger, hold, refund, insolvency and reconciliation contracts.
- Future activation must preserve one transfer/payee/run, statement-before-transfer, provider finality, failed-transfer return to payable and idempotent interruptible runs.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Every route denies before side effect.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/royalty-payout-runs` | statement/payees/holds/KYC/tax/provider versions; finance operator/key | no success while B3 disabled | `403 PAYOUT_DISABLED_B3`, `409`, `422`, `429` |
| `POST /api/v1/royalty-payout-runs/{id}/execute` | run/version; finance operator/key | no success while B3 disabled | `403 PAYOUT_DISABLED_B3`, `409`, `428`, `429` |
| `POST /internal/v1/royalty-payout-runs/{id}/transfer` | future payee/amount/provider operation; worker/key | no success while B3 disabled | `403 PAYOUT_DISABLED_B3`, `409`, `429` |
| `POST /api/v1/royalty-holds/{id}/release` | dispute/hold/provider evidence; administrator/key | no provider release while B3 disabled | `403 PAYOUT_DISABLED_B3`, `409`, `422`, `429` |

## Persistence, RLS and Workers

- Launch migrations contain no active provider payout account, pooled-funds ledger, escrow account or executable payout-run state. Design-only tables deny all grants and functions.
- RLS and database functions independently return B3 denial; service principals/admins have no bypass. Audit records attempted scope/digest without payment credentials.
- Queue consumers reject payout event types while disabled. Unknown provider webhooks cannot create paid/receipt state.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Royalty payout capability | launch terminal `disabled_b3`; future activation requires explicit `/evolve-feature` and complete counsel/provider/KYC-AML/tax/ledger/insolvency contracts | No admin, setting, feature flag, database function, worker or webhook can transition. Every route denies before provider/money effect. |
| Launch payout run/transfer | unavailable; no active state row may be created | Any create/execute/transfer attempt returns `PAYOUT_DISABLED_B3`. Unknown webhook cannot create paid/receipt state. |
| Calculated payable position | derived `known|unknown|held_label|unpayable`; immutable successor versions only | Calculation/accounting evidence triggers. State is liability/position only, never wallet, escrow, pooled funds, guarantee or platform revenue. |
| Future payout run | future-only `draft → approved → executing → completed|interrupted|failed`; transfer `pending → submitted → paid|failed|unknown`, failed returns payable | Unavailable until capability activation. One transfer/payee/run, statement-before-transfer and provider finality remain mandatory. |

Every unlisted transition returns `PAYOUT_DISABLED_B3` before mutation or external effect. Audit stores scope/digest only, never payment credentials.

## Failure, Deepening and Ambiguity Gate

Tests cover admin/flag/database/worker bypass, provider call before denial, wallet/escrow wording, disputed release, erased-payee seizure, redistribution and fake paid webhook. Seven passes converge; two implementers receive identical hard-denial behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | B3 royalty payout gate authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/14d-substitution-multiparty-supply|Supplier substitution, fixers and multi-party service supply — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/14d-substitution-multiparty-supply|Supplier substitution, fixers and multi-party service supply — Backend Specification]]
