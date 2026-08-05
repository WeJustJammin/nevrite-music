# Production riders, sensitive disclosure and redlines — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]  
**Deep Dive:** [[specs/ia/deep-dives/32-show-production-planning|Show production planning deep dive]]

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

- **Shard split:** 2 of 4; 32.03, 32.04 and 32.12.
- **Boundary:** structured rider versions, person-owned access-rider disclosure and bilateral production redlines without commercial mutation.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 32 IA/deep dive | layered rider authority, sensitive grants and production-only overlays |
| Shards 01 and 30 | person/entity authority and accepted commercial incorporation |

## Rider and Disclosure Invariants

- Rider is immutable structured version with template/fork parents, typed requirements and provenance. Template/fork is copy-on-create and never live-syncs.
- Imported/unconfirmed items remain visible but excluded from authoritative diff until confirmed. Sensitive facts outside governed access fields reject.
- Shard 30 accepted contract references exact rider version; later production version/redline never changes commercial incorporation automatically.
- Producer owns act rider/freeze proposal; members/crew own assigned sections and personal defaults. Person alone grants access-rider disclosure; act/TM cannot broaden it.
- Sensitive grant is recipient/purpose/field/date scoped, consented, expiring and revocable. Revocation stops future access and marks affected advance item without erasing audit.
- Production redline is date/event overlay approved by affected owners. Commercial content routes Shard 30; access change requires person grant.
- Privacy/counsel gate may disable exact sensitive sharing without disabling non-sensitive advancing.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/production-riders` | template/fork parents/items/provenance/key; producer/member by scope | `201 ProductionRiderResponse`; draft/version/authoritative items | `403 AUTHORITY_REQUIRED`, `409 PARENT_STALE`, `422 ITEM_INVALID|SENSITIVE_DATA_MISPLACED`, `429` |
| `POST /api/v1/production-riders/{id}/versions` | item delta/provenance/expected version/key; scoped editor | `201 ProductionRiderResponse`; successor/changed refs | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/people/{id}/sensitive-production-grants` | recipient/fields/purpose/expiry/consent/key; person controller | `201 SensitiveDisclosureGrantResponse`; active grant/scope | `403 CONSENT_REQUIRED`, `409 GRANT_EXISTS`, `422 RECIPIENT_INVALID|PRIVACY_GATE_DISABLED`, `429` |
| `DELETE /api/v1/sensitive-production-grants/{id}` | expected version/reason/key; person controller | `204`; revoked/future access stopped | `403`, `409 VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/production-events/{id}/rider-redlines` | rider/date overlay/production delta/affected-owner approvals/key; producer | `201 RiderRedlineResponse`; production successor/affected items | `403`, `409 APPROVAL_INCOMPLETE`, `422 COMMERCIAL_TERM_ROUTING_REQUIRED|PERSON_GRANT_REQUIRED`, `429` |

## Persistence, RLS and Workers

- Rider/item/provenance versions, section authority, sensitive grants/access audit and redline/approval rows pin actor, person, purpose and source versions.
- RLS exposes non-sensitive rider to scoped production parties, sensitive fields only through live grants and access audit to the person/restricted privacy roles.
- Grant expiry/revocation, redline routing and affected-item workers are idempotent; no projection broadens grant scope.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Rider version/item | version `draft → active → superseded|retired`; item `unconfirmed → confirmed|rejected|superseded` | Scoped owner/editor and provenance trigger. Template/fork copies once; imported/unconfirmed items remain visible but non-authoritative. |
| Sensitive disclosure grant | `active → revoked|expired|superseded`; privacy gate may keep state `blocked` before activation | Person-only consented recipient/purpose/field/date grant triggers. Act/TM cannot broaden and revocation stops future access without erasing audit. |
| Rider redline | `draft → approval_pending → active|rejected|blocked`; active `→ superseded` | Event/date overlay and every affected owner approval trigger. Commercial term routes Shard 30; access change requires person grant. |
| Contract incorporation | immutable reference to exact accepted rider version `active → superseded` only by Shard 30 amendment | Shard 30 accepted contract/amendment trigger. Later production rider/redline never changes commercial incorporation automatically. |

Every unlisted transition returns the typed state/version/grant conflict. Non-sensitive advancing remains available when sensitive sharing is gate-disabled.

## Failure, Deepening and Ambiguity Gate

Tests cover live template sync, unconfirmed diff authority, sensitive-field misplacement, later rider contract mutation, act-granted personal access, revoked read, commercial redline and privacy-gate disabling all advancing. Seven passes converge; two implementers receive identical rider and sensitive-disclosure behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|---|
| 2026-08-03 | Rider, disclosure and redline contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/deep-dives/32-show-production-planning|Deep Dive 32 — Show production planning]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/30b-booking-offers-approval-acceptance|Booking offers, counters, approvals and confirmation — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/deep-dives/32-show-production-planning|Deep Dive 32 — Event production planning and advancing]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/30b-booking-offers-approval-acceptance|Booking offers, counters, approvals and confirmation — Backend Specification]]
