# Collaborator discovery, availability and calls — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]  
**Deep Dive:** [[specs/ia/deep-dives/11-community-graph|Community graph deep dive]]

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

- **Shard split:** 3 of 5; COM-07 through COM-10. Intro reachability and private CRM remain separate.
- **Boundary:** evidence-ranked collaborator search, explainable fit, expiring role-specific appetite, term-explicit moderated calls and typed project/split setup on acceptance.
- **Approval:** Recommended split accepted under standing autonomy.

## Discovery Invariants

- Candidate set uses authorized shared role/provenance/appetite/remote/in-room/geography/feasibility projections only. Private notes, contacts, messages, protected traits, endorsements and undisclosed availability are forbidden inputs.
- Search makes remote/in-room primary and returns reasons plus missing/degraded inputs—never a public numeric fit score. Tag-only evidence is labelled degraded; missing data is unknown, not poor fit.
- Open-to signals are explicit per role/mode/geography/scope with start/expiry; silence is default and expired/paused signals leave search promptly.
- Calls require role, scope, `split|unpaid|credit_only` terms, unused-submission policy, expiry and moderation state before publication. Terms remain attached to every response/upload.
- Accepting one response emits typed Shard 09 project and Shard 10 split-setup commands. Submission/acceptance transfers no rights and creates no ownership/credit without downstream explicit contracts.
- Blocks/restrictions and policy apply before search/results/counts. Prior match is not durable trust and re-ranks/degrades when evidence disappears.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/collaborators/search` | role/evidence needs/mode/geography/feasibility/cursor/limit<=50; professional party/key | `CollaboratorSearchPage`; authorized results/reasons/missing inputs/version | `403`, `422 SEARCH_INVALID`, `429`, `503` |
| `PUT /api/v1/me/open-to/{roleVersionId}` | mode/geography/scope/start/expiry; acting party ETag/key | `OpenToSignalResponse`; active/paused/version/expiry | `403`, `409 VERSION_CONFLICT`, `422 ROLE_OR_EXPIRY_INVALID`, `428`, `429` |
| `DELETE /api/v1/me/open-to/{roleVersionId}` | acting party ETag/key | `204`; paused/ended version | `403`, `404`, `409`, `428`, `429` |
| `POST /api/v1/collaboration-calls` | role/scope/terms/unused-submission policy/expiry/project hints; owner/key | `201 CollaborationCallResponse`; moderation pending/version | `403`, `409`, `422 TERMS_OR_POLICY_REQUIRED`, `429` |
| `PATCH /api/v1/collaboration-calls/{id}` | successor fields; owner ETag/key | `CollaborationCallResponse`; version/re-moderation state | `403`, `404`, `409 RESPONSE_EXISTS|VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/collaboration-calls` | role/mode/geography/terms cursor | `CollaborationCallPage`; authorized active calls/count/cursor | `422`, `429`, `503` |
| `POST /api/v1/collaboration-calls/{id}/responses` | response note/submission refs/terms hash; professional responder/key | `201 CallResponseResponse`; pending/version/receipt | `403`, `404`, `409 RESPONSE_EXISTS|TERMS_STALE`, `422`, `429` |
| `POST /api/v1/collaboration-calls/{id}/responses/{responseId}/accept` | exact call/response/terms versions and setup choices; owner ETag/key | `202 CallAcceptanceResponse`; accepted state and downstream command IDs | `403`, `404`, `409 ALREADY_ACCEPTED|SOURCE_STALE`, `422`, `428`, `429`, `503` |

Search reads are 60/min/person; open-to 30/min; calls 10/day/owner and responses 20/day/person; acceptance 10/hour/call. Private submissions/terms receipts are no-store; search caches bind policy/block/projection versions.

## Persistence, RLS and Workers

Tables: `community.collaborator_search_documents`, `open_to_signals`, `collaboration_calls`, `call_responses`, `call_acceptances` and audit events. Calls/responses pin terms/source versions and one accepted response.

RLS exposes only public/shared search fields and call-authorized submissions. Search workers update from versioned source events, expire signals/calls using database time and label dependency outage degraded/unknown. Acceptance RPC atomically selects one response and writes outbox commands; retries reuse stable IDs, and downstream failure remains pending without claiming project/rights setup.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Open-to signal | `scheduled → active`; active `→ paused|expired|ended`; paused `→ active|expired|ended` | Owner command, start/expiry time or deletion triggers. Expired/paused/ended state leaves search promptly; silence never creates a signal. |
| Collaboration call | `pending_moderation → published|rejected`; published `→ expired|closed|removed`; editable state creates a successor pending moderation | Owner command, moderation outcome or database-time expiry triggers. Missing terms/unused-submission policy blocks publication; an existing response blocks incompatible edits. |
| Call response | `pending → accepted|declined|withdrawn|invalidated`; accepted is exclusive per call | Responder submission/withdrawal, owner selection or source/terms invalidation triggers. Stale terms, blocked route or second accepted response loses atomically. |
| Call acceptance/setup | `accepted_pending_setup → setup_complete`; pending remains pending with `retrying|dependency_failed` delivery status until exact downstream outcomes resolve | Atomic response selection/outbox commit triggers. Stable command IDs prevent duplicate Shard 09/10 setup; partial/unknown dependency outcomes cannot claim project, rights, ownership or credit creation. |
| Search document | `active → stale|suppressed|removed`; stale `→ active` only after a newer authorized rebuild | Source/policy/block/evidence change triggers. Missing dependency yields degraded/unknown result, never poor fit or a fabricated score. |

Every unlisted transition returns the typed state/version/terms conflict. Events omit private submissions and prohibited search inputs.

## Failure, Deepening and Ambiguity Gate

Tests cover protected/private feature injection, missing/tag-only evidence, stale appetite, block filtering, required terms/unused policy, terms changed after response, multiple acceptance race, downstream partial failure and rights-transfer implication. Seven passes converge; two implementers receive identical search, appetite, call and acceptance behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Discovery and collaboration-call contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/deep-dives/11-community-graph|Deep Dive 11 — Social graph and collaborator network]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09a-project-containers-creative-docs|Project containers, release boards and creative documents — Backend Specification]]
- [[specs/be/10b-splits-points-buyouts-amendments|Split capture, producer points, buyouts and amendments — Backend Specification]]
