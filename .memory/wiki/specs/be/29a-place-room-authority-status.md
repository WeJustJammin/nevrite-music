# Place and room identity, authority and status — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]  
**Deep Dive:** [[specs/ia/deep-dives/29-venues-spaces|Venues and spaces deep dive]]

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

- **Shard split:** 1 of 4; 29.01, 29.02, 29.03, 29.04 and 29.10.
- **Boundary:** place seeding/deduplication, proof-scoped claims, room topology, retirement/supersession/outage and moderated at-risk status.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 29 IA/deep dive | place identity, claim authority, room lifecycle and effective status |
| Shards 01 and 06 | acting-party capabilities, proof privacy, review and abuse handling |

## Place and Room Invariants

- Place creation stores normalized location, type set, source and provenance. Candidate duplicates are shown and races may create reviewable candidates; records never silently merge.
- Claim proof grants provisional or full capabilities for an exact place/room scope. Failure reveals no private anchor, certificate or competing claimant evidence and retains review/appeal.
- Room has its own stable identity, operating party, compatible type and effective relationships. Adding a room may extend place type; removing a live room is blocked.
- `requires(A,B)` is explicit; exclusion derives from requires, part-of or hard shared capacity and is never directly edited. Relationship cycles reject with the exact member/resource.
- Retirement, supersession and outage preserve history and close availability from effective time. Confirmed reservations block unsafe transition unless explicitly migrated through the reservation owner.
- Public at-risk signals require qualified evidence plus moderation/corroboration. Status is effective-dated, reasoned and cascades without exposing restricted evidence.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/places` | normalized location/types/source/key; authenticated contributor | `201 PlaceResponse`; created/candidate duplicates/provenance | `403 SOURCE_FORBIDDEN`, `409 IDEMPOTENCY_CONFLICT`, `422 LOCATION_INVALID`, `429` |
| `GET /api/v1/places/candidates` | bounded location/name/type query; public-safe search | `PlaceCandidateResponse`; candidates/confidence/source classes | `400`, `429`, `503` |
| `POST /api/v1/places/{id}/claims` | acting party/scope/proof route/token/key; authorized claimant | `201 PlaceClaimResponse`; provisional/full capabilities/review state | `403 ANCHOR_INELIGIBLE`, `409 CLAIM_CONFLICT`, `422 PROOF_FAILED|REVIEW_REQUIRED`, `429` |
| `POST /api/v1/place-claims/{id}/appeals` | challenged outcome/reason/evidence/key; claimant | `201 PlaceClaimAppealResponse`; queued/deadline | `403`, `409 APPEAL_EXISTS`, `422`, `429` |
| `POST /api/v1/places/{id}/rooms` | type/operator/relationships/effective time/key; authorized operator | `201 RoomResponse`; room/place type version | `403`, `409 TYPE_CONFLICT|RELATIONSHIP_CYCLE`, `422`, `429` |
| `POST /api/v1/rooms/{id}/versions` | type/operator/relationship delta/effective time/expected version/key; authorized operator | `201 RoomResponse`; successor/cascade preview | `403`, `409 LIVE_RESERVATION_CONFLICT|RELATIONSHIP_CYCLE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/rooms/{id}/status-versions` | status/reason/effective interval/evidence/expected version/key; authorized operator or qualified moderator | `201 RoomStatusResponse`; successor/affected reservations | `403 AUTHORITY_REQUIRED`, `409 FUTURE_BOOKING_CONFLICT|VERSION_CONFLICT`, `422 TRANSITION_INVALID`, `428`, `429` |
| `POST /api/v1/places/{id}/risk-signals` | signal/evidence/effective interval/key; qualified source | `201 PlaceRiskSignalResponse`; pending/corroborated/public-safe | `403`, `409 SIGNAL_EXISTS`, `422 MODERATION_REQUIRED`, `429` |

## Persistence, RLS and Workers

- `place`, source/provenance, duplicate candidate, scoped claim/proof ref, room/effective versions, relationships and status/risk events pin actor, evidence and policy versions.
- RLS exposes public-safe place/room/status projections publicly, claim anchors/proofs only to claimant and case-bound reviewers, and operator topology to scoped operators. Proof documents never enter projections.
- Deduplication, claim review, status cascade and search-projection workers consume transactional-outbox events idempotently; no worker merges canonical identities without a versioned resolution.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Place record | `active → superseded|retired`; duplicate candidate `open → linked|merged|kept_separate|contested` | Contributor create and explicit versioned resolution trigger. Races may create candidates; no silent merge. |
| Place claim | `pending → provisional|full|rejected|review_required`; provisional `→ full|revoked|expired|contested`; rejected/review `→ appeal_pending → upheld|reversed|remanded` | Exact scope proof/review/appeal trigger. Failure leaks no anchors/competing evidence and capability never broadens beyond scope. |
| Room | `active → outage|retired|superseded`; outage `→ active|retired`; live reservations block unsafe change absent explicit migration | Authorized effective version/status command triggers. Relationship cycle/type conflict names exact member/resource and blocks. |
| Room relationship | `active → superseded|ended`; derived exclusion recomputes from requires/part-of/shared-capacity only | Operator versioned topology trigger. Exclusion is never directly edited and cycles reject. |
| Place/room risk status | `pending → corroborated|rejected`; corroborated `→ public_active → expired|withdrawn|superseded` | Qualified evidence/moderation/effective interval trigger. Restricted evidence never enters public reason projection. |

Every unlisted transition returns the typed state/version/authority conflict. Retirement/outage preserves history and closes availability from effective time.

## Failure, Deepening and Ambiguity Gate

Tests cover silent duplicate merge, proof-anchor leakage, broad claim capability, room relationship cycle, live-room removal, history deletion, reservation-breaking outage, unmoderated at-risk publication and direct database override. Seven passes converge; two implementers receive identical place, room authority and status behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Place, room authority and status contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/deep-dives/29-venues-spaces|Deep Dive 29 — Venues and spaces]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/deep-dives/29-venues-spaces|Deep Dive 29 — Venues, studios and spaces]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
