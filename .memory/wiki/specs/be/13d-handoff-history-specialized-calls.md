# Opportunity handoff, history, band membership and open calls — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]  
**Deep Dive:** [[specs/ia/deep-dives/13-opportunities-casting|Opportunities and casting deep dive]]  
**Acceptance Boundary:** [[specs/be/13c-triage-offers-dispositions|Triage, offers and dispositions]]

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

- **Shard split:** 4 of 4; OPP-16 through OPP-19. This contract translates durable acceptance into typed downstream facts without manufacturing authority, rights or final splits.
- **Boundary:** idempotent create/join/propose/external handoff, viewer-specific immutable history, responsiveness-only signals, Band membership outcomes and fee-free no-Fan-vote open calls.
- **Approval:** Recommended split accepted under standing autonomy.

## Handoff and Specialized-Call Invariants

- Handoff mode/target is fixed at publication. `create` creates scoped operational container/engagement; `join` adds an operational participant under existing authority; `propose` creates pending consent; `external` creates an artifact.
- Fact manifest pins accepted terms, dates, role, compensation, split trigger, cast snapshot and back-reference. It never creates membership/authority, rights ownership, credit or final split without owning-domain validation/consent.
- Acceptance remains durable if handoff fails or diverges. Retries are idempotent; standard path escalates after 15 minutes and urgent/date<48h after 60 seconds. Missing downstream target uses honest external artifact, not fabricated project/membership.
- Reversed win creates a successor opportunity; it never reopens/inverts original acceptance or downstream actions. Original handoff history remains.
- Applicant sees own immutable age/state/terms diffs/disposition/onward links and may hide locally; poster sees owner-scoped pipeline. Post deletion does not delete either history.
- Response signal measures open disposition obligations primarily and response speed/rate secondarily, is suppressed below configured sample floor and never claims hiring quality or applicant merit.
- Band/member-wanted acceptance creates Shard 01 membership/governance proposal—not service engagement—and carries unresolved cast without member fan-out or inferred consent. Decide-by<=90 days.
- Open call uses ordinary slots/submissions/dispositions with explicit decide-by/judging rules, no applicant fee and no Fan voting.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/opportunity-acceptances/{id}/handoff` | winner/owner | `HandoffResponse`; mode/target/fact manifest/state/downstream refs | `403`, `404`, `429`, `503` |
| `POST /internal/v1/opportunity-acceptances/{id}/handoff` | exact acceptance/fact manifest/event ID; handoff worker/key | `202 HandoffResponse`; pending/converged/failed state | `403`, `409 EVENT_REUSED|MANIFEST_STALE`, `422 HANDOFF_FAILED`, `429`, `503` |
| `POST /api/v1/opportunity-acceptances/{id}/external-artifacts` | exact acceptance terms; owner/winner/key | `202 ExternalHandoffArtifactResponse`; artifact/checksum request | `403`, `409 INTERNAL_TARGET_EXISTS|SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/opportunity-acceptances/{id}/reversals` | named external cause/evidence/successor plan; current decider step-up/key | `201 WinReversalResponse`; successor opportunity/back-reference | `403`, `409 REVERSAL_CAUSE_INVALID`, `422`, `429` |
| `GET /api/v1/me/opportunity-history` | acting entity/state/date cursor | `ApplicantHistoryPage`; own immutable viewer projection/local-hidden state | `403`, `422`, `429`, `503` |
| `PUT /api/v1/me/opportunity-history/{entryId}/visibility` | local hidden/visible; applicant key | `ApplicantHistoryVisibilityResponse`; viewer-local version | `403`, `404`, `409`, `422`, `429` |
| `GET /api/v1/parties/{partyId}/opportunity-response-signal` | safe board viewer | `ResponseSignalResponse`; eligible/suppressed sample state and responsiveness metrics | `404`, `429`, `503` |
| `POST /api/v1/bands/{bandId}/member-opportunities` | role/criteria/decide-by<=90d/terms; Band representative mandate/key | `201 OpportunityResponse`; specialized published/draft post | `403`, `409 AUTHORITY_STALE`, `422 DECIDE_BY_INVALID`, `429` |
| `POST /internal/v1/opportunity-acceptances/{id}/band-membership-proposal` | acceptance/Band/role/representative authority versions; worker/key | `202 MembershipProposalResponse`; Shard 01 proposal/state | `403`, `409 EVENT_REUSED|AUTHORITY_STALE`, `422`, `429`, `503` |
| `POST /api/v1/open-calls` | organizer/type/slots/fee-free terms/decide-by/judging rules; organizer/key | `201 OpportunityResponse`; ordinary lifecycle post | `403`, `409`, `422 APPLICANT_FEE_FORBIDDEN|FAN_VOTING_FORBIDDEN`, `429` |

Handoff reads are 120/min; worker retries use queue budgets; artifacts/reversals 10/hour; history 120/min/person; response signals 60/min/IP; specialized posts 20/hour. Private histories/manifests are no-store; response signals use publication-safe aggregates only.

## Persistence, RLS and Workers

Tables: `opportunity.handoffs`, `handoff_fact_manifests`, `external_handoff_artifacts`, `win_reversals`, `applicant_history_projections`, `history_visibility`, `response_signals` and downstream command records. Source acceptance ID/event key is unique.

RLS grants handoff/history to winner/owner and safe aggregate response signals only above sample floor. Workers execute exact typed downstream commands, persist returned IDs/back-references and reconcile partial outcomes without mutating acceptance. Response workers count open obligations and suppress low samples. Band/Open-call adapters reuse ordinary opportunity/submission/disposition contracts.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Acceptance handoff | `pending → processing → converged|failed|diverged|external_required`; failed/diverged may `→ processing` under same event identity; external-required `→ artifact_pending → converged|failed` | Durable acceptance/outbox and exact fact manifest trigger. Stale manifest/event replay mismatch blocks; no failure or divergence mutates/reopens acceptance or fabricates downstream membership/rights/credit. |
| External handoff artifact | `requested → generating → ready|failed`; ready `→ stale|superseded` on source change | Winner/owner request and checksum-sealing worker trigger only when no internal target exists. Partial output is quarantined and non-ready artifacts cannot download as current. |
| Win reversal | `requested → successor_created|rejected|failed` | Named external cause/evidence and current decider step-up trigger. Success creates a successor opportunity/back-reference only; original acceptance/handoff history remains immutable. |
| Applicant history visibility | `visible ↔ hidden` as viewer-local metadata; source history remains immutable | Applicant command triggers. Local hiding never deletes owner pipeline, dispositions, acceptance or onward links. |
| Response signal | `insufficient_sample|eligible`; either `→ stale` on source/policy change, then rebuilds to either result | Publication-safe obligation/response aggregate worker triggers. Below sample floor is suppressed; metric never claims hiring quality or applicant merit. |
| Specialized membership proposal | `pending → accepted|rejected|expired|failed` under Shard 01 | Band-opportunity acceptance and exact representative authority dispatch trigger. Unresolved cast stays unresolved; no member fan-out, inferred consent or service engagement is created. |

Every unlisted transition returns the typed state/version/manifest conflict. Events omit private fact manifests and applicant history while preserving acceptance durability.

## Failure, Deepening and Ambiguity Gate

Tests cover duplicate/partial handoff, downstream authority/rights creation attempt, missing target, escalation windows, reversal in-place, deleted-post history loss, local hide propagation, low-sample signal, Band member fan-out, stale representative authority, open-call fee and Fan voting. Seven passes converge; two implementers receive identical handoff, history and specialized-call behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Handoff/history/specialized-call contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
- [[specs/ia/deep-dives/13-opportunities-casting|Deep Dive 13 — Opportunities and casting lifecycle]]
- [[specs/be/13c-triage-offers-dispositions|Candidate triage, shortlists, offers and dispositions — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/09a-project-containers-creative-docs|Project containers, release boards and creative documents — Backend Specification]]
- [[specs/be/10b-splits-points-buyouts-amendments|Split capture, producer points, buyouts and amendments — Backend Specification]]
