# Chain of title, control, conflicts and freeze instructions — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]  
**Deep Dive:** [[specs/ia/deep-dives/10-rights-ownership|Rights ownership deep dive]]  
**Case Boundary:** [[specs/be/06a-case-intake-evidence|Trust and safety case intake]]

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

- **Shard split:** 3 of 5; RGT-09 through RGT-13. Money custody/escrow, multi-party payouts and non-compelled court execution remain counsel/provider-gated and absent.
- **Boundary:** append-only title events, grants/reversions/succession, explainable control projections, claim-time conflicts, scoped cases and downstream share-freeze instructions.
- **Approval:** Recommended split accepted under standing autonomy.

## Title and Conflict Invariants

- Title events require right, reduced share, territory, period, from/to parties, evidence and trust level. Prior events never delete; conflicts coexist and chronology alone never picks a winner.
- Grants require explicit territory and term; missing term is incomplete, never perpetual. Fixed reversion executes only under a versioned approved rule; conditional reversion only notifies. Succession records an estate acting as itself under Shard 01 authority and never determines probate/heir priority.
- Control folds the last consented ledger with non-conflicted effective title events, joint-owner rule, grants, encumbrances, covenants and custody. Result is `authorized|blocked|no_recorded_obstacle`; the last explicitly disclaims clearance and always names jurisdiction, inputs, evidence and unknowns.
- Claim/write synchronously detects arithmetic overlap, double assignment, territory collision, external/public-domain contradiction. Duplicate candidates require title plus corroborating writer/identifier/fingerprint and are permanently dismissible per exact pair/version; deterministic conflicts are not suppressible.
- Conflict only notifies. It never auto-opens a case or freezes funds. A standing party opens one Shard 06 case scoped to exact right/share/territory/period; platform evidence is unweighted and staff cannot decide merits by admin action.
- Authorized case outcome may issue an exact-scope downstream hold instruction. Whole-work freeze and self-release are forbidden. Shard 10 never holds money or claims a hold succeeded; required downstream acknowledgment failure stops the payment/distribution operation.

## API Endpoint Matrix

All bodies are strict Zod 4 objects using 10a rational contracts and Shard 00 envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/rights/title-events` | `TitleEventRequest`: object/right/share/territory/period/type/from/to/evidence/trust; standing actor/key | `201 TitleEventResponse`; immutable event/conflict scan/projection version | `403`, `409 SOURCE_STALE|IDEMPOTENCY_MISMATCH`, `422 SCOPE_OR_EVIDENCE_INVALID`, `429` |
| `POST /api/v1/rights/grants` | explicit scope/grantee/term/conditions/evidence; grantor authority/key | `201 RightsGrantResponse`; grant/title-event/control refresh | `403`, `409`, `422 TERRITORY_INCOMPLETE|TERM_MISSING`, `429` |
| `POST /api/v1/rights/reversion-instructions` | fixed/conditional rule version, event scope/evidence; authorized party/key | `201 ReversionInstructionResponse`; scheduled/notify-only state | `403 COUNSEL_GATE_DISABLED`, `409 RULE_VERSION_INVALID`, `422`, `429` |
| `POST /api/v1/rights/succession-events` | estate party/representation version/evidence/title scope; estate authority/key | `201 TitleEventResponse`; succession event, no probate verdict | `403`, `409 AUTHORITY_STALE`, `422`, `429` |
| `GET /api/v1/rights/control` | object/right/territory/period; authorized decision maker | `ControlProjectionResponse`; verdict/evidence/unknowns/source hash/freshness | `403`, `404`, `409 CONTROL_BLOCKED`, `422`, `429`, `503` |
| `GET /api/v1/rights/conflicts` | object/scope/state cursor; named party/reviewer | `RightsConflictPage`; viewer-safe evidence snapshots | `403`, `404`, `422`, `429`, `503` |
| `POST /api/v1/rights/conflicts/{id}/dismissals` | duplicate-candidate exact pair/version/reason; either named party/key | `201 ConflictDismissalResponse`; permanent scoped dismissal | `403`, `404`, `409 NONDISMISSIBLE_CONFLICT|VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/rights/conflicts/{id}/cases` | exact scope/reason/evidence refs; standing party/key | `201 RightsCaseResponse`; Shard 06 case/contest/optional freeze-request state | `403 STANDING_REQUIRED`, `404`, `409 CASE_EXISTS`, `422`, `429` |
| `POST /internal/v1/rights/freeze-instructions` | authorized case outcome, exact share/territory/period, downstream adapter; case worker/key | `201 FreezeInstructionResponse`; pending acknowledgment/version | `403 COUNSEL_GATE_DISABLED|OUTCOME_UNAUTHORIZED`, `409 INSTRUCTION_EXISTS`, `422 WHOLE_WORK_FREEZE_FORBIDDEN`, `429` |
| `POST /internal/v1/rights/freeze-instructions/{id}/acknowledgments` | adapter outcome/evidence/idempotency; adapter/key | `FreezeInstructionResponse`; active/failed/unknown state | `403`, `409 EVENT_REUSED`, `422`, `429`, `503` |
| `POST /internal/v1/rights/freeze-instructions/{id}/releases` | independent release authority/case evidence; reviewer/key | `FreezeInstructionResponse`; released/version | `403 SELF_RELEASE_FORBIDDEN|COUNSEL_GATE_DISABLED`, `409 RELEASE_UNAUTHORIZED`, `422`, `429` |

Reads are 120/min/person; title/grant/reversion 30/hour/object; conflicts 60/min; case opens 10/day/conflict/person; freeze/release 10/hour with step-up, counsel gate and 100% audit. Private responses are no-store.

## Persistence, RLS and Workers

Tables: `rights.title_events`, `territory_grants`, `reversion_instructions`, `joint_owner_rules`, `control_projections`, `rights_conflicts`, `rights_case_links`, `rights_freeze_instructions` and immutable audit events. Exact-scope indexes cover object/right/territory/period/state; conflicting title events remain simultaneously addressable.

RLS is named-party/standing/case-purpose bound. Reviewers see only exact case scope and cannot edit ledgers/title. Workers fold projections deterministically from exact source hashes, execute only approved fixed-term rules, detect conflicts synchronously at writes, and reconcile downstream holds idempotently. `unknown|failed` hold acknowledgment blocks the requesting downstream operation without claiming custody.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Title event | immutable `asserted`; derived applicability `pending → effective|conflicted|expired|superseded` | Authorized append and deterministic scope/time/conflict fold trigger. Prior events never mutate or delete, chronology never selects a winner and conflicting events remain co-addressable. |
| Territory grant | `pending → active → expired|revoked|reverted|superseded`; pending may become `incomplete` | Explicit complete territory/term/evidence and title event trigger. Missing term/territory never defaults to perpetual; conditional reversion cannot auto-transition. |
| Reversion instruction | `draft → scheduled|notify_only`; scheduled `→ executed|cancelled|failed`; notify-only is terminal until an authorized successor | Approved fixed-rule version/time triggers execution. Conditional rule only notifies; stale/unapproved rule or authority blocks execution. |
| Control projection | immutable result `authorized|blocked|no_recorded_obstacle`; current pointer `active → stale|superseded` | Exact source-hash fold triggers. Source change makes the projection stale; unknown/conflicted inputs prevent authorized and no result claims clearance. |
| Rights conflict | `detected → linked_to_case|dismissed|resolved|superseded` | Deterministic write scan triggers detection. Only duplicate-candidate exact pair/version may be dismissed; conflict never auto-opens a case, chooses merits or freezes funds. |
| Freeze instruction | `pending_acknowledgment → active|failed|unknown`; active `→ release_pending → released|release_failed|release_unknown` | Authorized Shard 06 outcome and downstream adapter evidence trigger. Whole-work scope, self-release or missing independent authority blocks; unknown/failed acknowledgment blocks dependent distribution without claiming custody. |

Every unlisted transition returns the typed state/version/scope conflict. Events preserve exact scope and evidence references without publishing merits, private evidence or custody claims.

## Failure, Deepening and Ambiguity Gate

Tests cover conflicting transfers, missing grant term, conditional auto-execution attempt, succession without representation, no-recorded-obstacle wording, title-only duplicate signal, non-dismissible deterministic conflict, no auto-case/freeze, whole-work freeze, adapter failure/unknown, beneficiary self-release and staff merits override. Seven passes converge; two implementers receive identical title, control, conflict and freeze behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Title, control, conflict and freeze contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/deep-dives/10-rights-ownership|Deep Dive 10 — Rights and ownership]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
