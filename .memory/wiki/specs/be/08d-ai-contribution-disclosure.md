# AI contribution disclosure and destination policy — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]  
**Deep Dive:** None required by the approved IA  
**Contribution Boundary:** [[specs/be/07b-session-capture-offline|Session roll and contribution capture]]

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

- **Shard split:** 4 of 4; CXR-11 through CXR-14. Structured self-authored disclosure and portability ship at consumer launch; destination-specific blocking activates only for an approved named policy/version.
- **Boundary:** immutable contributor-authored disclosure versions, additive vocabulary, factual projections, destination policy evaluation and export/release staleness.
- **Approval:** Recommended split accepted under standing autonomy.

## Disclosure Invariants

- Only the contributor may describe AI involvement in their own contribution. A contribution has zero or more structured entries; absence is exactly `not_disclosed`, never proof of human origin, non-use, quality or provenance.
- V1 kinds are `generation|assistance|modelling|separation|correction` with bounded contribution-local scope, tool name/version, optional model name, optional own-model flag where applicable and optional plain-text note. New kinds require a new additive vocabulary version.
- The platform performs no AI detection, classifier inference, threshold question, binary “AI” label or automatic disclosure. Notes are never interpreted for policy evaluation.
- Amend/retract creates a successor with reason; history remains immutable. A disclosure version is orthogonal to credit provenance and cannot raise/lower rung, prove human-only performance or change contribution ownership/rights.
- Destination evaluation uses one approved named policy/version and structured fields only. Missing required data is a blocking/warning gap, never a negative factual assertion; destination failure cannot invalidate the canonical credit or self-service portability.
- Authorized viewers receive factual entries, author/source and version only within source-credit visibility. Exports/releases pin the active disclosure version; changes mark affected outputs stale.

## API Endpoint Matrix

All bodies are strict Zod 4 objects with bounded plain text and rejected markup/links where specified. Commands inherit Shard 00 actor, acting-context, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/contributions/{contributionId}/ai-disclosures` | `CreateAIDisclosureRequest`: vocabulary version and entries<=25; contribution owner/key | `201 AIDisclosureVersionResponse`; immutable active version/hash | `403 CONTRIBUTOR_ONLY`, `404`, `409 ACTIVE_DISCLOSURE_EXISTS|CONTRIBUTION_VERSION_CHANGED`, `422 ENTRY_OR_VOCABULARY_INVALID`, `429` |
| `POST /api/v1/ai-disclosures/{id}/successors` | `SupersedeAIDisclosureRequest`: replacement entries or retract, reason; original contributor ETag/key | `201 AIDisclosureVersionResponse`; successor and stale-output job | `403`, `404`, `409 VERSION_CONFLICT|ALREADY_SUPERSEDED`, `422`, `428`, `429` |
| `GET /api/v1/contributions/{contributionId}/ai-disclosure` | authorized contribution/credit viewer | `AIDisclosureProjectionResponse`; `not_disclosed` or factual active entries/source/version | concealment-safe `404`, `429`, `503` |
| `GET /api/v1/ai-disclosure/vocabularies/{version}` | authenticated/public schema reader | `AIDisclosureVocabularyResponse`; kinds/field rules/effective state | `404`, `429` |
| `POST /api/v1/disclosure-policy-evaluations` | `DisclosurePolicyEvaluationRequest`: contribution/output scope, destination policy/version, exact disclosure/source versions; authorized exporter/release adapter/key | `201 DisclosurePolicyEvaluationResponse`; pass/block/warning gaps and policy evidence | `403`, `409 SOURCE_STALE`, `422 POLICY_UNAVAILABLE|RECIPIENT_REQUIREMENT_UNMET`, `429`, `503` |
| `GET /api/v1/disclosure-policy-evaluations/{id}` | requester/purpose-granted adapter | `DisclosurePolicyEvaluationResponse`; immutable inputs/result/version | `403`, `404`, `429` |
| `GET /api/v1/admin/disclosure-policies` | destination/effective/gate cursor; reporting-admin capability | `DestinationPolicyPage`; reviewed versions/evidence | `403`, `422`, `429` |
| `POST /api/v1/admin/disclosure-policies` | `CreateDestinationPolicyRequest`: destination/version/structured requirements/evidence/effective interval; distinct review approval/key | `201 DestinationPolicyVersionResponse`; reviewed inactive/active version | `403`, `409 POLICY_VERSION_EXISTS|APPROVAL_REQUIRED`, `422`, `429` |
| `POST /internal/v1/ai-disclosures/{id}/mark-outputs-stale` | disclosure/source versions and event ID; worker capability/key | `DisclosureStaleResult`; exact artifacts/releases affected | `403`, `409 EVENT_REUSED|SOURCE_STALE`, `422`, `429` |

Disclosure reads are 240/min/person; writes 30/min/contributor and 10/min/contribution; evaluations 60/min/requester and 20/min/destination; admin policies 10/min with 100% audit. Private responses are no-store. Public/authorized projections apply credit visibility before returning `not_disclosed` so hidden contribution existence cannot be inferred.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `reporting.ai_disclosure_versions` | contribution/author/vocabulary/entries JSON/reason/state/supersedes/hash/version/time; one active version per contribution |
| `reporting.ai_disclosure_vocabularies` | immutable version/kinds/field schemas/effective interval/state; code-compatible additive evolution only |
| `reporting.destination_policy_versions` | destination/version/structured requirements/effective interval/source evidence/reviewer/gate state |
| `reporting.disclosure_policy_evaluations` | source/disclosure/policy versions, result, gap codes, evidence hash, requester/purpose/time |

RLS limits write/supersession to the canonical contributor person under current acting context. Producers, admins and adapters cannot author on another contributor's behalf. Readers must already have source-credit access; policy admins can version rules but cannot edit disclosures or credits. Evaluation is a pure version-pinned function over structured entries and policy requirements; note text is excluded. Stale workers compare exact disclosure snapshots and update output/release tasks idempotently without changing canonical credit state.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| AI disclosure | `active → superseded|retracted`; replacement creates a new active version | Canonical contributor command triggers. Producer/admin cannot author; terminal version immutable and remains historical. |
| Vocabulary/policy version | `draft → reviewed → active → retired|superseded` | Protected review/effective activation triggers. Incompatible or unapproved version blocks active; terminal key/version remains resolvable. |
| Destination evaluation | immutable terminal `pass|block|warning` bound to disclosure/policy/source versions | Pure evaluator triggers. Stale source creates a new evaluation/task; note text never changes result and prior evaluation never mutates. |
| Affected output task | `current → stale → refreshed|blocked|superseded` | Disclosure/policy/source change and output worker trigger. Stale output cannot be represented current; worker cannot edit disclosure/credit. |

Every unlisted transition returns the typed state/version conflict. Event omits entries/notes and carries contribution/vocabulary/state/version only.

## Failure, Deepening and Ambiguity Gate

Tests cover another-person authorship, unknown/new vocabulary, markup/link rejection, zero/multiple entries, amendment/retraction races, hidden-credit non-inference, absence wording, prohibited detection/threshold behavior, provenance separation, policy-version change, missing required field, note-exclusion, stale export/release propagation and policy adapter outage. No assertion equates `not_disclosed` with human origin. Logs/events omit entries, model/tool names, notes and source-credit identity. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical authorship, absence, versioning, policy and staleness behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | AI contribution disclosure contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]
- [[specs/be/07b-session-capture-offline|Session roll, contribution capture and offline merge — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/08a-portability-ddex-emission|Credit portability and DDEX RIN emission — Backend Specification]]
