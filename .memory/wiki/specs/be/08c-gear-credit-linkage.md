# Gear-to-credit linkage and item discography — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]  
**Deep Dive:** None required by the approved IA  
**Credit Boundary:** [[specs/be/07a-credit-assertions-visibility|Credit assertions and visibility]]

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

- **Shard split:** 3 of 4; CXR-08 through CXR-10. The domain remains unreachable until Shard 23 provides registered item identity/version and ownership events.
- **Boundary:** optional contribution-granular item links, author/source provenance, inherited confidentiality, owner-controlled public projection, restrictive purge and ownership-transfer access recalculation.
- **Approval:** Recommended split accepted under standing autonomy.

## Gear Linkage Invariants

- A link targets exactly one existing contribution credit and one registered Shard 23 item/version or saved chain version. Session-level links and links created before contribution are forbidden.
- Credited party may link their contribution; Producer/delegate may link only within current mandate. Author, source method and source versions are immutable. No session-close prompt, forced completion or provenance promotion exists.
- Link visibility can only be as permissive as the source credit. Public item display additionally requires current item-owner opt-in; authorization is applied before counts, item history, search, cache and export.
- A link follows the registered item across ownership transfer, but private session/credit access, actor identity and non-public context do not transfer. The new owner receives only public or independently authorized history.
- Source-credit restriction or withdrawal purges the public gear projection within Shard 07's 60-second restrictive SLA. Item opt-out is also deny-first; stale caches never serve the prior line.
- Gear linkage never proves item ownership, custody, contribution quality, endorsement, rights, split or authenticity. Shard 23 remains the only source of item identity and ownership.

## API Endpoint Matrix

All bodies are strict Zod 4 objects. Commands inherit Shard 00 actor, acting-context, idempotency and expected-version envelopes and fail at the capability gate before source lookup while Shard 23 is unavailable.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/contributions/{contributionId}/gear-links` | `CreateGearCreditLinkRequest`: item/version or saved-chain/version, source method; credited party/mandated Producer/key | `201 GearCreditLinkResponse`; link/version/effective visibility | `403 CAPABILITY_DISABLED|LINK_AUTHORITY_FORBIDDEN`, `404`, `409 LINK_EXISTS|SOURCE_VERSION_CONFLICT`, `422 SESSION_LEVEL_LINK_FORBIDDEN`, `429` |
| `GET /api/v1/contributions/{contributionId}/gear-links` | contribution-authorized viewer | `GearCreditLinkPage`; post-authorization links/count | `403`, `404`, `429`, `503` |
| `DELETE /api/v1/contributions/{contributionId}/gear-links/{linkId}` | author/current mandate ETag/key | `204`; link revoked, history retained, purge queued | `403`, `404`, `409 VERSION_CONFLICT`, `428`, `429` |
| `PUT /api/v1/gear-items/{itemId}/credit-discography-settings` | `GearDiscographySettingRequest`: public opt-in boolean; current item owner ETag/key | `GearDiscographySettingResponse`; version/purge-or-build job | `403`, `404`, `409 OWNERSHIP_OR_VERSION_CHANGED`, `422`, `428`, `429` |
| `GET /api/v1/gear-items/{itemId}/discography` | `GearDiscographyQuery`: role/date cursor, limit<=50; public/current authorized owner | `GearDiscographyPage`; source-public lines/count/freshness | concealment-safe `404`, `422`, `429`, `503` |
| `POST /internal/v1/gear-credit-links/reconcile-transfer` | `GearTransferCommand`: item, old/new owner, ownership version/event ID; worker capability/key | `GearTransferReconcileResponse`; projection/access version | `403`, `409 OWNERSHIP_EVENT_STALE|EVENT_REUSED`, `422`, `429` |
| `POST /internal/v1/gear-credit-links/reconcile-visibility` | `CreditVisibilityCommand`: credit/version/effective visibility/event ID; worker capability/key | `GearVisibilityReconcileResponse`; purge/build state | `403`, `409 CREDIT_EVENT_STALE|EVENT_REUSED`, `422`, `429` |

Reads are 120/min/IP public or 240/min/person; link mutations 30/min/actor; item opt-in 10/min/item; internal reconciliations use queue budgets and stable event IDs. Private reads are no-store; public projections use authorization-safe keys and the Shard 07 restrictive purge SLA.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `reporting.gear_credit_links` | contribution/credit/item-version-or-chain-version/author/source method/effective visibility/state/version; unique active source/item target |
| `reporting.gear_discography_settings` | item/current owner/opt-in/state/version and ownership source version |
| `reporting.gear_discography_projections` | item/public credit refs/source version set/hash/purge state/active pointer; derived only |

RLS joins current Shard 07 visibility and Shard 23 ownership through authorized projections, never unrestricted tables. Link authors and mandated Producers can manage links without gaining item-owner rights; item owners can opt in display without gaining private credit/session access. Workers consume item transfer and credit visibility events, compare exact versions, build a new projection and atomically switch pointers. Restrictive changes create a deny row and purge intent before asynchronous rebuild; unknown dependency state is private.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Gear-credit link | `active → revoked|superseded` | Author/mandate revoke or corrected successor triggers. Missing current item/credit authorization blocks create; terminal link never reactivates. |
| Display setting | `private ↔ public`; either may become `disabled` after ownership/source loss | Current item owner opt-in/out or transfer trigger. Public requires current eligible links and credit visibility; unknown ownership fails private. |
| Discography projection | `building → active|blocked`; active `→ purging|superseded`; purging `→ blocked|active` after current rebuild | Link/ownership/credit visibility event triggers. Restrictive change writes deny/purge before async work; stale builder cannot switch pointer. |

Every unlisted transition returns the typed state/version conflict. Event omits private credit/item context.

## Failure, Deepening and Ambiguity Gate

Tests cover domain-disabled non-enumeration, pre-contribution/session-level attempts, stale item/contribution versions, unauthorized Producer, duplicate link, ownership transfer races, prior-owner access denial, public opt-in with embargoed credit, credit restriction purge, item opt-out fail-closed, dependency outage and event replay. No test permits link-driven ownership, provenance or endorsement inference. Logs omit private item/credit/session identity. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical linkage, inheritance, transfer and purge behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Gear-to-credit linkage contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
