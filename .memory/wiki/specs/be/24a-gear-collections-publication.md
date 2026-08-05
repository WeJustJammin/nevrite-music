# Gear collections and public item projection — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear holdings operations]]  
**Deep Dive:** [[specs/ia/deep-dives/24-gear-holdings-operations|Gear holdings deep dive]]

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

- **Shard split:** 1 of 4; 24.01 and 24.02.
- **Boundary:** private collection views, former-ownership separation and explicitly acknowledged per-item public-safe projections.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 24 IA/deep dive | collection/publication flow and exposure controls |
| Shard 23 | canonical gear identity, ownership lifecycle and bounded status |

## Collection and Publication Invariants

- Collection is private by default. Current and formerly owned records render separately; private aggregate value may render only to owning party.
- Public publication is per item and never computes or exposes aggregate collection value, serial, exact location, private/appraised value or hidden-history count.
- Public-safe media requires governed rendition inspected for serial/location leakage. Automatic masking requires review confidence; uncertainty blocks activation.
- Owner sees named composed physical-safety risk when public item combines with public tour dates/city, without exposing private facts inside warning.
- Publication requires current authority, safe projection, exposure policy and explicit acknowledgement version. Held item requires owner-granted public-disclosure grant.
- Read failure may serve last-known-good safe projection with age unless privacy/security requires immediate removal; it never falls back to private record.
- Publication changes visibility only and never strengthens ownership claim, possession or sale authority.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/gear-collections/{partyId}` | current/former/filter/cursor; party reader | `GearCollectionResponse`; private grouped rows/aggregate | `403`, `404`, `429`, `503` |
| `POST /api/v1/gear-records/{id}/publication-preflights` | safe media/audience/exposure context/grant versions; owner/key | `CollectionPublicationPreflight`; risks/gaps/hash | `403`, `409 SOURCE_STALE`, `422 SAFE_RENDITION_REQUIRED|DISCLOSURE_GRANT_REQUIRED`, `429` |
| `POST /api/v1/gear-records/{id}/publications` | preflight/exposure acknowledgement; owner/key | `201 PublicGearProjectionResponse`; active/version | `403`, `409 PREFLIGHT_STALE`, `422`, `429` |
| `DELETE /api/v1/gear-records/{id}/publications` | publication/version; owner/key | `204`; projection revoked | `403`, `404`, `409 VERSION_CONFLICT`, `428`, `429` |
| `GET /public/gear/{id}` | public projection ID | `PublicGearProjectionResponse`; safe fields/age | `404`, `429`, `503` |

## Persistence, RLS and Workers

- `collection_projection`, `public_gear_projection`, exposure acknowledgement and media-review refs pin source/visibility/policy versions.
- RLS exposes private collection/value/location to owner, held slice to confirmed holder, and public table only safe fields. Aggregate has no public view/function.
- Projection worker fails closed on source privacy/security event and otherwise may serve last-known-good with explicit age.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Private collection projection | `current → stale|superseded`; stale may serve last-known-good with age unless privacy/security requires removal | Ownership/possession/source refresh triggers. Current/former remain separate and aggregate value stays owner-only. |
| Public-safe media review | `pending → approved|blocked|uncertain`; approved `→ stale|revoked` | Governed rendition inspection/masking confidence triggers. Serial/location uncertainty blocks activation. |
| Public gear publication | `preflight → active|blocked`; active `→ revoked|stale|removed`; stale may serve last-known-good only under safe policy | Current authority/safe projection/exposure acknowledgment and held-item disclosure grant trigger. Privacy/security event removes immediately; no private fallback. |
| Exposure warning | `clear|risk_present|unknown`; result `→ stale` on public item/tour context change | Owner-only composed public-fact analysis triggers. Warning names risk without revealing private facts and never changes publication automatically. |

Every unlisted transition returns the typed state/version/privacy conflict. Publication changes visibility only, never ownership, possession or sale authority.

## Failure, Deepening and Ambiguity Gate

Tests cover private-by-default, former/current mixing, public aggregate, serial/location/value leak, unsafe mask, held-item self-grant, warning leakage and private fallback. Seven passes converge; two implementers receive identical collection/publication behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Collection/publication contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear holdings operations]]
- [[specs/ia/deep-dives/24-gear-holdings-operations|Deep Dive 24 — Gear holdings]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/deep-dives/24-gear-holdings-operations|Deep Dive 24 — Gear collections, rigs, custody and manifests]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/23a-gear-identity-claims-transfers|Gear identity, ownership claims, transfers and provenance — Backend Specification]]
