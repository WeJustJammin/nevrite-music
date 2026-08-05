# Opportunity submissions, auditions and unsolicited pitches — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/13-opportunities-casting|Opportunities and casting deep dive]]  
**Publication Boundary:** [[specs/be/13a-opportunity-publication-discovery-alerts|Opportunity publication and discovery]]

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

- **Shard split:** 2 of 4; OPP-07 through OPP-09. Review, offer and disposition are owned by 13c.
- **Boundary:** deliberate slot-specific entity applications, evidence citations, private availability, rights-bounded resumable audition tasks, paperwork-layer blind review and policy-respecting pitches.
- **Approval:** Recommended split accepted under standing autonomy.

## Submission Invariants

- Applicant explicitly selects submitting person/Band acting entity, one slot and current terms, cites chosen evidence, confirms each relevant date and answers bounded questions. No one-click, bulk, template or automatic apply command exists.
- One active submission per entity/opportunity/slot; resubmission creates a successor and highlights diffs after triage. Evidence references source records rather than copying a full CV/credit graph.
- Evidence/provider outage degrades cited proof and never fabricates fit or rejects. Calendar conflicts warn applicant privately; poster receives only candidate-confirmed availability, including valid partial availability.
- Audition task must disclose scope, rounds, retention, payment and rights before work/upload and pass the same spec-work gate as publication. One unpaid evaluation-only round has no use rights and return/destruction on non-selection; more requires paid trial.
- Upload is resumable/quarantined and pins exact task/terms/media versions. Eligible strong evidence may waive a task through an attributed decision; no software-generated waiver implies superiority.
- Blind review removes configured paperwork fields only and states its limits; evidence/media may still identify a candidate. Candidate cannot review any competing queue even if separately granted reviewer authority.
- Unsolicited pitch requires professional target-policy eligibility and becomes an ordinary target-anchored submission/queue item with pitch source—not a messaging bypass.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/opportunity-submissions/drafts` | entity/opportunity/slot/terms versions, answers/evidence refs/per-date availability; entity authority/key | `201 SubmissionResponse`; draft/version/eligibility state | `403`, `404`, `409 ACTIVE_SUBMISSION_EXISTS|TERMS_CHANGED`, `422`, `429` |
| `PATCH /api/v1/opportunity-submissions/{id}` | full draft successor fields; applicant ETag/key | `SubmissionResponse`; successor/diff/version | `403`, `404`, `409 SUBMISSION_LOCKED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/opportunity-submissions/{id}/submit` | exact submission/terms/evidence hashes and deliberate confirmation; applicant ETag/key | `SubmissionResponse`; submitted version/receipt | `403`, `409 TERMS_CHANGED|ELIGIBILITY_FAILED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/opportunity-submissions/{id}/terms-responses` | stay/withdraw against exact delta; applicant ETag/key | `SubmissionResponse`; current/withdrawn state/version | `403`, `404`, `409 TERMS_RESPONSE_STALE`, `422`, `428`, `429` |
| `POST /api/v1/opportunity-submissions/{id}/withdraw` | reason optional; applicant ETag/key before active offer | `SubmissionResponse`; withdrawn version | `403`, `409 ACTIVE_OFFER_REQUIRES_DECLINE`, `428`, `429` |
| `POST /api/v1/opportunity-submissions/{id}/audition-tasks` | scope/rounds/retention/payment/rights and waiver policy; authorized decider/key | `201 AuditionTaskResponse`; gated task/version | `403`, `409 TASK_EXISTS`, `422 SPEC_WORK_GATE_FAILED`, `429` |
| `POST /api/v1/audition-tasks/{id}/waivers` | cited strong evidence/reason; authorized reviewer ETag/key | `AuditionTaskResponse`; waived version/evidence | `403 REVIEW_CONFLICT`, `404`, `409 VERSION_CONFLICT`, `422 EVIDENCE_INCOMPLETE`, `428`, `429` |
| `POST /api/v1/audition-tasks/{id}/upload-sessions` | media metadata/hash; applicant/key | `201 UploadSessionResponse`; private resumable target/expiry | `403`, `404`, `409 TASK_TERMS_CHANGED`, `422`, `429` |
| `POST /api/v1/audition-attempts/{id}/settle` | exact media checksum/task version; applicant/key | `202 AuditionAttemptResponse`; scanning/ready/failure state | `403`, `404`, `409 UPLOAD_UNSETTLED|CHECKSUM_MISMATCH`, `422`, `429`, `503` |
| `POST /api/v1/targets/{targetPartyId}/pitches` | target policy/version, slot intent, answers/evidence refs; professional party/key | `201 SubmissionResponse`; ordinary pitch-sourced submission | `403 PITCH_POLICY_DENIED|BLOCKED_ROUTE`, `404`, `409`, `422`, `429` |

Submission drafts/writes are 60/min/person and 20/day/entity; audition tasks 20/hour/post; uploads use bounded sessions; pitches 10/day/sender/target. Private availability, answers, media and evidence are no-store and omitted from events/logs.

## Persistence, RLS and Workers

Tables: `opportunity.submissions`, `submission_versions`, `submission_evidence_refs`, `availability_confirmations`, `audition_tasks`, `audition_attempts`, `pitch_policy_snapshots` and audit events. Stable unique tuple is entity/post/slot/current active state.

RLS is applicant entity plus authorized owner/reviewer projection; reviewer-candidate conflict is a hard deny above governance grants. Ingest workers quarantine/scan/hash media and never grant use rights. Evidence projectors preserve unavailable/degraded state. Submission events carry entity/slot/terms/state/version only.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Submission | `draft → submitted`; submitted `→ terms_changed|withdrawn|under_review`; terms-changed `→ submitted|withdrawn`; under-review `→ withdrawn` only before active offer, otherwise decline is required | Deliberate applicant command, material terms successor or queue handoff triggers. Bulk/template/automatic apply, duplicate active tuple, stale terms/evidence or failed eligibility blocks. |
| Submission version | immutable current version `→ superseded`; triaged successor remains diff-visible | Applicant full replacement before lock or explicit resubmission after triage triggers. Stale expected version or locked state blocks; evidence references remain pointers rather than copied profiles. |
| Audition task | `draft → active|blocked`; active `→ waived|submitted|expired|cancelled`; submitted `→ completed|failed` | Decider gate, attributed evidence waiver, applicant attempt or timer triggers. Undisclosed scope/rights/retention/payment, unpaid extra round or reviewer conflict blocks. |
| Audition upload/attempt | `created → uploading → settling → quarantined → scanning → ready|failed|rejected`; created/uploading may expire | Resumable upload completion, checksum settle and ingest scan trigger. Unsettled/mismatched/stale-task media cannot become ready; quarantine grants no use rights. |
| Unsolicited pitch | `policy_eligible → submitted`; submitted follows the ordinary submission lifecycle | Current target policy, professional acting context and explicit submit trigger. Blocked route or policy denial blocks; pitch never becomes a messaging bypass. |

Every unlisted transition returns the typed state/version/terms conflict. Events omit availability detail, answers, evidence and media.

## Failure, Deepening and Ambiguity Gate

Tests cover bulk/template apply, duplicate concurrent submit, stale terms, evidence outage, private calendar leak, partial availability, unpaid multi-round task, undisclosed retention/rights, resumable upload mismatch, candidate-reviewer conflict, blind-review overclaim and pitch-policy bypass. Seven passes converge; two implementers receive identical application, audition and pitch behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Submission, audition and pitch contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
- [[specs/ia/deep-dives/13-opportunities-casting|Deep Dive 13 — Opportunities and casting lifecycle]]
- [[specs/be/13a-opportunity-publication-discovery-alerts|Opportunity publication, targeting, discovery and alerts — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09b-roster-invitations-vault-access|Project roster, invitations and vault access — Backend Specification]]
