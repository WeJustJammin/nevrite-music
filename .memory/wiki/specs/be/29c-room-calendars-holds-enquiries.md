# Room calendars, external busy mirrors, holds and enquiries — Backend Specification

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

- **Shard split:** 3 of 4; 29.11, 29.12, 29.13 and 29.14.
- **Boundary:** native room availability, busy-only provider mirrors, ranked atomic resource holds and routed room-hire enquiries.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 29 IA/deep dive | availability composition, sync uncertainty, resource arbitration and enquiry routing |
| Shards 01 and 05 | delegated booker scope, provider grants and runtime policy |

## Calendar and Demand Invariants

- Native slots, buffers, holds, exceptions, room/resource dependencies and external busy blocks compose one versioned room calendar. Cycles/overlaps reject with exact member.
- External calendar is authoritative only as a busy block, never proof of availability. Multiple providers union busy intervals; deletion is accepted only beyond connector monotonic watermark.
- Ambiguous mapping, revoked provider, stale watermark or uncertain interval blocks affected slots and disables instant book until reconciled.
- Public availability is coarse. Exact free/busy, resource identities, connector diagnostics and private demand are available only to scoped operators and qualified requester flows.
- Ranked expiring hold claims every required resource atomically. Losing challenge identifies higher claim class without private claimant identity; expiry releases all resources.
- Enquiry carries requester identity/credits, declared room-hire use type, requirements and explicit lapse time. Broken assignee falls back to organization; lapse is never presented as decline.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `PUT /api/v1/rooms/{id}/calendar-configuration` | posture/windows/buffers/exceptions/resources/mappings/expected version/key; room operator | `RoomCalendarResponse`; composed version/gaps | `403`, `409 RELATIONSHIP_CYCLE|VERSION_CONFLICT`, `422 WINDOW_INVALID|MAPPING_AMBIGUOUS`, `428`, `429` |
| `POST /api/v1/rooms/{id}/calendar-connectors` | provider grant/explicit room mapping/key; room operator | `201 RoomCalendarConnectorResponse`; admitted/pending mapping/watermark | `403`, `409 MAPPING_AMBIGUOUS`, `422 CONNECTOR_REVOKED`, `429` |
| `POST /internal/v1/room-calendar-connectors/{id}/busy-deltas` | provider event/version/busy intervals/deletions/watermark; connector worker | `RoomCalendarConnectorResponse`; union blocks/sync state | `403`, `409 EVENT_REPLAYED|WATERMARK_REGRESSION`, `422`, `429` |
| `GET /public/rooms/{id}/availability` | coarse date/timezone/use type | `PublicRoomAvailabilityResponse`; coarse windows/uncertainty/freshness | `404`, `422 DST_AMBIGUOUS`, `429`, `503` |
| `POST /api/v1/room-resource-holds` | requester/resources/slot/rank basis/calendar version/key; qualified requester | `201 RoomHoldResponse`; active/expiry/all resources | `403`, `409 RESOURCE_UNAVAILABLE|CALENDAR_UNCERTAIN`, `422 HOLD_LIMIT`, `429` |
| `POST /api/v1/room-resource-holds/{id}/challenges` | alternate slot/claim basis/expected version/key; qualified requester | `RoomHoldChallengeResponse`; won/lost/higher claim class/alternatives | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/room-hire-enquiries` | room/use type/requester party/credits/requirements/lapse/key; eligible requester | `201 RoomHireEnquiryResponse`; routed assignee/fallback/status/lapse | `403`, `409 POSTURE_INELIGIBLE`, `422`, `429` |

## Persistence, RLS and Workers

- Calendar configuration/version, connector mapping/grant ref/watermark, busy intervals, hold/resource members/challenges and enquiry routing/lapse rows pin actor, source and policy versions.
- RLS exposes coarse calendar publicly, exact calendar/diagnostics to operators, qualified slices to requesters and assigned enquiry context to delegated bookers without payout, membership or unrelated-client data.
- Connector, staleness, hold expiry and enquiry lapse workers are idempotent. Provider tokens/raw payloads remain server-only; uncertainty always removes instant-book authority.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Room calendar version | `draft → active → superseded|retired`; active may become `uncertain|stale`, then return active after reconciliation | Operator config/resources/mappings and connector state trigger. Cycles/overlaps/ambiguous mappings block with exact member. |
| Calendar connector | `pending_mapping → active|ambiguous|revoked|failed`; active `→ stale|revoked|failed`; stale `→ active` only with monotonic watermark | Explicit provider grant/mapping and ordered busy deltas trigger. Multiple providers union busy; stale deletion/regressed watermark rejects. |
| Resource hold | `pending → active|lost`; active `→ converted|expired|released|challenged`; challenge `→ won|lost` atomically across all resources | Ranked claim/calendar certainty/timer trigger. Partial-resource hold is forbidden and loser sees claim class, not claimant identity. |
| Hire enquiry | `open → assigned|fallback_assigned → responded|lapsed|withdrawn|closed` | Eligible requester/routing/assignee health/timer trigger. Broken assignee falls to organization and lapse never means decline. |

Every unlisted transition returns the typed state/version/calendar conflict. Uncertainty removes instant-book authority and public output stays coarse.

## Failure, Deepening and Ambiguity Gate

Tests cover external busy as free, multi-provider overwrite, stale deletion, public exact calendar, connector token leak, partial-resource hold, private claimant leak, expiry residue, broken assignee loss and lapse-as-decline. Seven passes converge; two implementers receive identical calendar, hold and enquiry behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Calendar, hold and enquiry contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/deep-dives/29-venues-spaces|Deep Dive 29 — Venues and spaces]]
- [[specs/be/01c-relationships-authority-governance|Relationships, authority and governance — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Settings, flags and runtime policy — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/deep-dives/29-venues-spaces|Deep Dive 29 — Venues, studios and spaces]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01c-relationships-authority-governance|Organizations, relationships, mandates and governance — Backend Specification]]
- [[specs/be/05a-settings-flags-runtime|Governed settings, flags, experiments and kill switches — Backend Specification]]
