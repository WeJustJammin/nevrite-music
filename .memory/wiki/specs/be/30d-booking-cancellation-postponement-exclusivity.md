# Booking cancellation, postponement and exclusivity — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]  
**Deep Dive:** [[specs/ia/deep-dives/30-booking-contracts|Booking contracts deep dive]]

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

- **Shard split:** 4 of 5; 30.20, 30.21, 30.22, 30.23, 30.24 and 30.25.
- **Boundary:** previewed/authorized cancellation, bilateral release, neutral force-majeure declaration, successor postponement and radius/exclusivity waiver.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 30 IA/deep dive | cancellation recomputation, force-majeure neutrality, postponement lineage and waiver clocks |
| Shards 06, 10 and 29 | disputes/evidence, contractual authority and successor physical slots |

## Cancellation and Exclusivity Invariants

- Cancellation preview recomputes exact deal/run cross-collateralization and contracted forfeit against current obligation before terminal mutation. Stale preview cannot commit.
- Unilateral cancellation requires side binding authority; agreed cancellation requires both binding chains on same instrument. Delegate without bind capability cannot terminate.
- Force-majeure is an attributed declaration with evidence, response and dispute path. Platform never declares it valid/invalid.
- Postponement requires both sides, successor Shard 29 slot and approved amendment. Original remains postponed with lineage; dependency refusal leaves obligations visible.
- Radius/exclusivity evaluates candidate against active clause owner, identity/geodata scope and terms as `conflict|unknown|clear`; missing inputs are unknown.
- Waiver names authorized decider and bounded deadline. Grant/refuse/lapse is append-only; break-glass exists only under live challenge plus principal action.
- Fan refunds, payout and settlement accounting remain downstream; this shard emits contracted instruction only.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/booking/deals/{id}/cancellation-previews` | actor/reason/deal-run versions/key; side participant | `CancellationPreviewResponse`; recomputation/forfeit/hash/expiry | `403`, `409 ALREADY_TERMINAL`, `422`, `429` |
| `POST /api/v1/booking/deals/{id}/cancellations` | preview hash/reason/expected version/key; binding actor | `201 BookingCancellationResponse`; terminal/instruction | `403 BIND_AUTHORITY_REQUIRED`, `409 PREVIEW_STALE|ALREADY_TERMINAL`, `428`, `429` |
| `POST /api/v1/booking/deals/{id}/agreed-cancellations` | instrument/both chain approvals/expected version/key; binding chains | `201 BookingCancellationResponse`; bilateral allocation/release | `403`, `409 APPROVAL_INCOMPLETE|VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/booking/deals/{id}/force-majeure-declarations` | event/evidence/contract ref/key; party | `201 ForceMajeureDeclarationResponse`; declared/response/dispute route | `403`, `409 DECLARATION_EXISTS`, `422`, `429` |
| `POST /api/v1/booking/deals/{id}/postponements` | successor slot/amendment/dependency consents/key; both sides | `201 BookingPostponementResponse`; original/successor/migration tasks | `403`, `409 SUCCESSOR_UNAVAILABLE|CONSENT_INCOMPLETE|DEPENDENCY_MIGRATION_FAILED`, `429` |
| `POST /api/v1/booking/exclusivity-evaluations` | candidate/clause refs/identity-geodata scope/versions/key; booking actor | `201 ExclusivityEvaluationResponse`; conflict/unknown/clear/waiver route | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/booking/exclusivity-waivers` | clause/candidate/decider/deadline/key; requester | `201 ExclusivityWaiverResponse`; pending/clock | `403`, `409 CLAUSE_NOT_APPLICABLE`, `422 DEADLINE_INVALID|DECIDER_UNAVAILABLE`, `429` |
| `POST /api/v1/booking/exclusivity-waivers/{id}/decisions` | grant/refuse/expected version/key; named decider | `ExclusivityWaiverResponse`; granted/refused/lapsed | `403`, `409 VERSION_CONFLICT|DEADLINE_EXPIRED`, `428`, `429` |

## Persistence, RLS and Workers

- Cancellation preview/instrument, force-majeure declaration/response, postponement lineage/migrations, exclusivity run and waiver/decision rows pin contract, actor, evidence and source versions.
- RLS exposes instruments/evaluations to deal sides and named deciders, evidence to case-bound roles and only minimum operational state downstream.
- Preview/waiver expiry, migration and notice workers are idempotent. No automatic legal validity determination or downstream settlement mutation occurs.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Cancellation preview | `current → committed|expired|stale`; commit creates terminal cancellation instrument | Exact current deal/run obligation/forfeit recomputation and binding authority trigger. Stale preview/terminal deal blocks. |
| Booking cancellation | `pending → unilateral|agreed|blocked`; unilateral/agreed `→ terminal` with contracted instruction | One binding side or both chains on same instrument trigger. Delegate without bind capability cannot terminate and no downstream settlement mutates here. |
| Force-majeure declaration | `declared → responded|disputed|withdrawn|closed`; every response is append-only | Party evidence/counterparty response/case trigger. Platform never declares legal validity. |
| Postponement | `proposed → dependency_migration → completed|blocked|failed`; completed leaves original `postponed` and successor active | Both-side consent/successor Shard 29 slot/approved amendment trigger. Dependency refusal leaves obligations visible and no partial inversion. |
| Exclusivity evaluation | immutable `conflict|unknown|clear`; current `→ stale|superseded` | Candidate/clause/identity/geodata/terms fold triggers. Missing input is unknown, never clear. |
| Exclusivity waiver | `pending → granted|refused|lapsed|withdrawn`; live challenge may allow principal break-glass append | Named decider/deadline trigger. No silent grant and terminal history remains. |

Every unlisted transition returns the typed state/version/authority conflict. Fan refunds, payout and settlement remain downstream instructions only.

## Failure, Deepening and Ambiguity Gate

Tests cover surprise forfeit, stale preview, nonbinding cancellation, mismatched bilateral instrument, platform force-majeure judgment, silent obligation erasure, missing-geodata clear result, unauthorized waiver and break-glass without live challenge. Seven passes converge; two implementers receive identical cancellation, postponement and exclusivity behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Cancellation, postponement and exclusivity contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking contracts]]
- [[specs/be/06c-disputes-dmca-legal-risk|Disputes, DMCA and legal risk — Backend Specification]]
- [[specs/be/29d-room-reservations-series-handoff|Room reservations, waitlists, recurring series and performance handoff — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/deep-dives/30-booking-contracts|Deep Dive 30 — Booking, negotiation and contracts]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06c-disputes-dmca-legal-risk|Fraud review, transaction disputes, DMCA, identity abuse and legal process — Backend Specification]]
- [[specs/be/29d-room-reservations-series-handoff|Room reservations, waitlists, recurring series and performance handoff — Backend Specification]]
