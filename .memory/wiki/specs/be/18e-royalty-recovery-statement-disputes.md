# Royalty recovery findings and statement disputes — Backend Specification

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

- **Shard split:** 5 of 5; ROY-17 and ROY-18.
- **Boundary:** mandate-bounded recovery candidates/evidence packs and amount-scoped statement disputes routed through Shard 06 without hidden payment handling.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 18 IA/deep dive | registration/recovery algorithm, restatement/dispute race and edge cases |
| Shards 06 and 10 | protected evidence/dispute workflow and rights conflict authority |

## Recovery and Dispute Invariants

- Recovery search uses approved corpus, explicit mandate, territory/right scope and evidence provenance. It reports candidates, never promised amount or guaranteed recovery.
- Candidate requires evidence links and confidence basis but cannot alter catalogue mapping, rights, calculation or payability automatically.
- Filing/handoff pack freezes claimant mandate, work/recording identifiers, society/source, evidence, requested action and expected-by date.
- Outcome is `dismissed|submitted|monitoring|resolved|closed`; silence after expected-by creates alarm, not fabricated receipt.
- Statement dispute freezes source statement/calculation version, amount/currency/right/territory/period scope, reason, evidence and deadline.
- Dispute routes Shard 06 case workflow; this shard owns accounting scope/version updates only and does not interpret contract or decide legal merit.
- Restatement affecting disputed scope appends changed amount/cause and invalidates stale proposed resolution. Closed history remains immutable.
- Disputed amount is a calculated hold label only. No escrow, payout concealment or provider release exists while B3 disabled.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Recovery corpus and dispute evidence use purpose-scoped access.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/royalty-recovery-searches` | mandate/corpus/territory/right/catalogue versions; authorized claimant/key | `202 RecoverySearchResponse`; job/scope/state | `403`, `409 SOURCE_STALE`, `422 MANDATE_INSUFFICIENT`, `429`, `503` |
| `GET /api/v1/royalty-recovery-searches/{id}/candidates` | claimant/authorized representative | `RecoveryCandidatePage`; evidence/basis/no amount promise | `403`, `404`, `429`, `503` |
| `POST /api/v1/royalty-recovery-candidates/{id}/decisions` | dismiss/submit and evidence/mandate versions; claimant ETag/key | `RecoveryCandidateResponse`; decision/version | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/royalty-recovery-candidates/{id}/packs` | requested action/recipient/expected-by/source versions; claimant/key | `201 RecoveryPackResponse`; immutable pack/hash | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/royalty-statement-disputes` | statement/calculation/amount scope/reason/evidence/deadline; affected party/key | `201 RoyaltyDisputeResponse`; open case/scope version | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /internal/v1/royalty-statement-disputes/{id}/apply-restatement` | restatement/delta/cause/event; worker/key | `RoyaltyDisputeResponse`; successor amount/invalidation | `403`, `409 EVENT_REUSED`, `422`, `429` |
| `POST /api/v1/royalty-statement-disputes/{id}/resolve` | Shard 06 case outcome/source versions; authorized resolver ETag/key | `RoyaltyDisputeResponse`; resolved/closed version | `403`, `409 STALE_RESOLUTION|VERSION_CONFLICT`, `422`, `428`, `429` |

## Persistence, RLS and Workers

- `recovery_search`, `recovery_candidate`, `recovery_pack`, `royalty_statement_dispute` and immutable versions pin mandate/evidence/accounting sources.
- RLS exposes recovery to claimant/mandated representative, dispute to affected parties and assigned Shard 06 reviewers, and denies corpus/evidence to unrelated payees.
- Search and expected-by workers use bounded retry; candidate generation cannot mutate accounting. Restatement application locks dispute current version before invalidating resolution.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Recovery search | `queued → searching → completed|failed|stale`; completed `→ superseded` by source/mandate change | Approved corpus/mandate/scope worker triggers. Missing mandate or stale source blocks; result never promises amount/recovery. |
| Recovery candidate | `open → dismissed|submitted|monitoring|resolved|closed`; submitted/monitoring may become overdue | Claimant decision, immutable pack handoff, outcome or expected-by timer triggers. Candidate cannot mutate mapping/rights/calculation/payability automatically. |
| Recovery pack | `draft → frozen → submitted|failed|submitted_unknown`; unknown `→ submitted|failed`; submitted `→ acknowledged|overdue` | Exact mandate/evidence/request/recipient versions trigger. Silence creates alarm, not receipt. |
| Statement dispute | `open → case_linked → proposed_resolution → resolved|closed`; restatement appends successor and returns stale proposed resolution to `case_linked` | Affected-party scope and Shard 06 case outcome trigger. Stale resolution/legal-merits/admin release blocks; accounting scope only changes by version. |
| Disputed amount label | `active → superseded|released_by_accounting_resolution`; no provider hold/release state exists while B3 disabled | Current calculation/dispute scope triggers label only. It never implies escrow, custody or payout concealment. |

Every unlisted transition returns the typed state/version/mandate conflict. Recovery/dispute evidence remains purpose scoped and prior history immutable.

## Failure, Deepening and Ambiguity Gate

Tests cover unmandated corpus, promised money, automatic mapping, evidence-free filing, fabricated receipt, overbroad dispute, legal-merit ruling, restatement race, stale resolution, hidden payment and escrow language. Seven passes converge; two implementers receive identical recovery and dispute behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Recovery and dispute contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/deep-dives/18-royalty-accounting|Deep Dive 18 — Royalty accounting]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]
