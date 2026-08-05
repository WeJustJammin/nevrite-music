# Contests, submissions, judging and prize instructions — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]  
**Deep Dive:** None required by the approved IA  
**Rights Boundary:** [[specs/be/10a-rights-objects-ledgers|Rights objects and ledgers]]

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

- **Shard split:** 3 of 4; SPC-07 through SPC-09. Shard 12 records prize evidence/instructions but never holds funds; cash execution remains provider/counsel-gated.
- **Boundary:** immutable published briefs, deliberate version-pinned entry, eligibility snapshots, conflict-disclosed craft judging, reasoned verdicts and specific funded prize instructions.
- **Approval:** Recommended split accepted under standing autonomy.

## Contest Invariants

- Published brief must define eligibility, judging/rubric, entrant-retains rights plus narrow stated purpose licence, submission/unused-submission use, deadlines, cancellation/restart policy and specific prize.
- Rights check must pass before publication. First deliberate submission freezes exact brief/rights/judging/prize versions; later change requires visible cancellation/republication under the frozen policy.
- Posting/upload alone never enters. Submission pins brief, asset/version, terms acceptance and eligibility evidence. Fixable eligibility may be remediated before deadline; ineligible remains explicit.
- Judges are appointed for a bounded craft scope and disclose conflicts before access. No peer/public voting. Every verdict pins rubric outcomes and reason; later conflict preserves history and triggers invalidate/re-run under brief policy.
- Winner eligibility is rechecked before award. Cash prize may be stated only with verified provider/counsel-approved funding/escrow evidence; non-cash prize must be specific and deliverable. “Exposure” is invalid.
- Shard 12 emits an instruction and evidence, never custody/payment success. Losing submissions retain full rights after the narrow brief use ends; organizer cannot expand rights through acceptance or judging.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/contests/preflight` | eligibility/judging/rights/use/deadlines/prize/funding evidence; organizer/key | `ContestPreflightResponse`; blocking/warning gaps/source hash | `403`, `409 SOURCE_STALE`, `422 RIGHTS_CHECK_FAILED|PRIZE_UNFUNDED`, `429`, `503` |
| `POST /api/v1/contests` | exact preflight hash/brief fields; organizer/key | `201 ContestResponse`; draft/version | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `POST /api/v1/contests/{id}/publish` | exact brief/source/prize versions; organizer ETag/key | `ContestResponse`; published/accepting version | `403`, `409 BRIEF_OR_PRIZE_STALE`, `422 RIGHTS_CHECK_FAILED`, `428`, `429` |
| `POST /api/v1/contests/{id}/submissions/preflight` | entrant/asset-version/eligibility/terms hash; entrant/key | `SubmissionPreflightResponse`; eligible/ineligible/fixable gaps | `403`, `404`, `409 BRIEF_FROZEN|SOURCE_STALE`, `422 ELIGIBILITY_FAILED`, `429` |
| `POST /api/v1/contests/{id}/submissions` | preflight/brief/asset/terms versions and deliberate confirmation; entrant/key | `201 ContestSubmissionResponse`; frozen submission/evidence state | `403`, `404`, `409 DEADLINE_PASSED|SUBMISSION_EXISTS`, `422`, `429` |
| `DELETE /api/v1/contest-submissions/{id}` | entrant ETag/key before policy deadline | `204`; withdrawn/version, evidence retained | `403`, `404`, `409 WITHDRAWAL_CLOSED`, `428`, `429` |
| `POST /api/v1/contests/{id}/judges` | judge/craft scope/conflict declaration/rubric version; organizer/key | `201 JudgeAppointmentResponse`; appointment/version | `403`, `409 JUDGE_CONFLICT_UNRESOLVED`, `422`, `429` |
| `POST /api/v1/contest-submissions/{id}/verdicts` | rubric outcomes/reason/conflict confirmation; assigned judge/key | `201 ContestVerdictResponse`; reasoned immutable verdict/version | `403 JUDGE_SCOPE_FORBIDDEN`, `404`, `409 VERDICT_EXISTS|RUBRIC_STALE`, `422`, `429` |
| `POST /api/v1/contest-verdicts/{id}/invalidations` | conflict evidence/re-run policy; organizer/moderator ETag/key | `ContestVerdictResponse`; invalidated/history/re-run state | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/contests/{id}/awards` | winning submission/eligibility recheck/prize evidence; organizer ETag/key | `202 ContestAwardResponse`; reasoned award/downstream instruction | `403`, `409 ELIGIBILITY_FAILED|PRIZE_UNFUNDED|VERDICT_CONFLICT`, `422`, `428`, `429`, `503` |

Contest reads are 120/min/IP; preflight/drafts 20/hour/organizer; submissions 10/hour/entrant/contest; judging 60/min/judge; awards 5/hour/contest with step-up and 100% audit. Private entries/judge work are no-store.

## Persistence, RLS and Workers

Tables: `space.contests`, `contest_brief_versions`, `contest_submissions`, `submission_eligibility_snapshots`, `judge_appointments`, `contest_verdicts`, `prize_commitments`, `contest_awards` and audit events. First submission atomically freezes brief version.

RLS separates entrant, organizer and assigned-judge projections; judges cannot browse unrelated entries. Workers expire deadlines, validate exact versions, recheck winner eligibility and deliver downstream prize instructions idempotently. Unknown/failed payment acknowledgment remains pending/failed; Shard 12 never says paid or holds funds.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Contest/brief | `draft → published → accepting → judging → award_pending → completed`; published-or-later may become `cancelled`, and cancellation requires explicit successor/republication for restart | Current preflight/rights/prize versions and organizer command/time trigger. First deliberate submission freezes brief versions; later incompatible edit or silent restart blocks. |
| Submission preflight | `requested → eligible|fixable|ineligible|stale` | Exact brief/asset/terms/eligibility evaluation triggers. Only current eligible or remediated-fixable result may create a deliberate submission before deadline. |
| Contest submission | `submitted → eligible|ineligible|withdrawn`; eligible `→ under_judging|withdrawn`; under-judging `→ judged|withdrawn` only while policy permits | Deliberate entrant confirmation, eligibility recheck, judging start or allowed withdrawal triggers. Upload alone creates no state; frozen asset/terms/evidence never silently change. |
| Judge appointment | `proposed → active|rejected`; active `→ completed|revoked|conflicted` | Bounded craft appointment and conflict disclosure trigger. Unresolved conflict blocks access; later conflict preserves prior work and forces governed invalidation/re-run. |
| Verdict | immutable `recorded`; recorded `→ invalidated` by append-only invalidation, with optional `rerun_required` instruction | Assigned active judge with current rubric records reasoned verdict. Peer/public vote, stale rubric or scope mismatch blocks; invalidation never rewrites history. |
| Contest award | `pending_eligibility → instruction_pending → instruction_sent → acknowledged|failed|unknown`; failed/unknown may retry under same idempotency identity | Winner recheck, prize/funding evidence and downstream adapter outcome trigger. Unfunded/exposure prize or verdict conflict blocks; no state means paid or custody held. |

Every unlisted transition returns the typed state/version/eligibility conflict. Private entries, judge work and payment details remain outside public events.

## Failure, Deepening and Ambiguity Gate

Tests cover missing rights/use policy, first-submission freeze race, upload-without-submit, eligibility remediation, peer voting, judge conflict before/after verdict, rubric drift, unfunded/exposure prize, payment-provider unknown, losing-rights expansion and silent cancellation. Seven passes converge; two implementers receive identical brief, submission, judging and prize behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Contest and prize-instruction contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10c-title-control-conflicts-freezes|Chain of title, control, conflicts and freeze instructions — Backend Specification]]
