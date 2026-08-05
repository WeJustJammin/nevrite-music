# AI-training, voice and likeness consent — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]  
**Deep Dive:** [[specs/ia/deep-dives/10-rights-ownership|Rights ownership deep dive]]  
**Disclosure Boundary:** [[specs/be/08d-ai-contribution-disclosure|AI contribution disclosure]]

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

- **Shard split:** 4 of 5; RGT-14 through RGT-16. This contract records positions and evaluates eligibility; licensing/execution/compensation remain downstream and gated.
- **Boundary:** holder-scoped AI-training positions, person-held NIL positions, most-restrictive evaluation and factual AI content declarations without detection.
- **Approval:** Recommended split accepted under standing autonomy.

## Consent Invariants

- AI-training eligibility requires every relevant holder's position with grantee, use, term, territory and compensation position. `no_position` is unknown—not consent or refusal—and the most restrictive current position governs.
- NIL belongs to the person. Master ownership, credit, performer fact, WFH/buyout or representation mandate grants no implied voice/name/likeness authority; representatives require current explicit Shard 01 authority.
- Positions and declarations are immutable versions with evidence and supersession. A policy result never rewrites source rights, disclosure or consent.
- Contributors/authorized declarants record factual AI content declarations only. Platform performs no detection, classifier, threshold or human-origin inference; absence is `undeclared`.
- AI disclosure (how content was made), training consent (whether content may train) and NIL consent (whether a person may be modelled) are orthogonal. One never substitutes for another.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/rights/ai-training-positions` | holder/object/right/grantee/use/term/territory/compensation position/evidence; holder authority/key | `201 ConsentPositionResponse`; immutable version/evaluation job | `403`, `409 POSITION_EXISTS|AUTHORITY_STALE`, `422 SCOPE_INCOMPLETE`, `429` |
| `POST /api/v1/rights/ai-training-positions/{id}/successors` | replacement/revoke reason; holder ETag/key | `201 ConsentPositionResponse`; successor/version | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/rights/ai-training-evaluations` | object/use/grantee/term/territory/exact holder-set version; authorized evaluator/key | `201 AITrainingEvaluationResponse`; eligible/blocked/unknown with position refs | `403`, `409 SOURCE_STALE`, `422 HOLDER_SET_INCOMPLETE`, `429`, `503` |
| `POST /api/v1/me/nil-positions` | person scope `voice|name|likeness`, grantee/use/term/territory/compensation/evidence; person/representative key | `201 NILPositionResponse`; person-scoped version | `403 NIL_AUTHORITY_REQUIRED`, `409`, `422`, `429` |
| `POST /api/v1/me/nil-positions/{id}/successors` | replacement/revoke reason; current person authority ETag/key | `201 NILPositionResponse`; successor/version | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /api/v1/rights/consent-positions` | object/person/scope; named holder/person/authorized evaluator | `ConsentPositionPage`; viewer-safe versions/evidence classes | `403`, `404`, `422`, `429`, `503` |
| `POST /api/v1/rights/ai-content-declarations` | content/contribution/structured declaration/source; contributor/authorized declarant/key | `201 AIContentDeclarationResponse`; immutable version/disclosure event | `403`, `404`, `409`, `422`, `429` |
| `POST /api/v1/rights/ai-content-declarations/{id}/successors` | replacement/retract reason; original authority ETag/key | `201 AIContentDeclarationResponse`; successor/version | `403`, `404`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |

Reads/evaluations are 120/min/person; position/declaration writes 30/hour/scope/person. Private responses are no-store; evidence, compensation, NIL details and declarations are omitted from events/logs.

## Persistence, RLS and Workers

Tables: `rights.ai_training_positions`, `ai_training_evaluations`, `nil_positions`, `ai_content_declarations` and immutable audit events. Unique active position keys include holder/person, scope, grantee/use/territory/term and version.

RLS is exact holder/person/authorized-evaluator bound; master administrators cannot author NIL. Evaluation workers snapshot relevant holders, compare source hashes, apply unanimity/most-restrictive logic and return explicit unknown when any position is absent or stale. They never create consent or initiate licensing/payment. Events carry kind/scope/state/version only.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| AI-training position | immutable scoped value `permit|refuse|no_position`; current pointer `active → superseded` | Holder-authorized create/successor triggers. Revocation appends a `no_position` successor; stale authority, incomplete scope or duplicate current key blocks. No position or silence never becomes permit. |
| NIL position | immutable person-scoped value `permit|refuse|no_position`; current pointer `active → superseded` | Person or current explicit representative authority triggers. Revocation appends `no_position`; ownership, credit, performance, WFH, buyout or expired representation cannot authorize a transition. |
| AI-training evaluation | `queued → evaluating → eligible|blocked|unknown|failed`; any result `→ stale` on source change | Snapshot worker and exact holder-set/source hashes trigger. Every relevant current permit yields eligible; any refusal yields blocked; absent/stale/incomplete position yields unknown. Evaluation never writes consent. |
| AI-content declaration | immutable value `declared|retracted`; current pointer `active → superseded` | Contributor/authorized declarant successor triggers. Absence projects as `undeclared`; no declaration or retraction changes training/NIL consent or proves detection/human origin. |

Every unlisted transition returns the typed state/version/authority conflict. Events expose kind/scope/state/version only and omit evidence, compensation, NIL detail and declaration content.

## Failure, Deepening and Ambiguity Gate

Tests cover missing holder, no-position semantics, stale holder set, most-restrictive conflict, master/WFH-to-NIL inference, representative expiry, declaration-vs-consent substitution, absent declaration wording and detection/threshold attempts. Seven passes converge; two implementers receive identical AI-training, NIL and declaration behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | AI-training and NIL consent contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/deep-dives/10-rights-ownership|Deep Dive 10 — Rights and ownership]]
- [[specs/be/08d-ai-contribution-disclosure|AI contribution disclosure and destination policy — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
