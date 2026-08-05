# Informal event discovery, listening rooms and conference networking — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]  
**Deep Dive:** None required by the approved IA  
**Reachability Boundary:** [[specs/be/11d-collaboration-paths-warm-intros|Collaboration paths and reachability]]

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

- **Shard split:** 4 of 4; SPC-10 through SPC-13. Shard 12 owns discovery freshness and temporary participation grants; durable relationships remain typed Shard 11 commands.
- **Boundary:** informal recurring-opportunity freshness, professional peer/scene listening-room scope, verified attendee networking windows and explicit post-event persistence.
- **Approval:** Recommended split accepted under standing autonomy.

## Event Participation Invariants

- Informal jam/open-mic records are discovery listings, not platform-owned recurrence/events. Every claim names source/evidence/observed time/expiry; Operator confirmation and attendee flags produce freshness, never platform verification.
- A stale listing remains visibly stale/unconfirmed rather than silently removed or shown current. Residential place records are prohibited through 12a.
- Listening rooms consume the shared room transport/presence contract. Eligibility is professional plus scene/peer scope; Fan is denied. Room moderation and audience scope are server-side and never broaden during degraded transport.
- Conference mode requires verified event attendance, explicit opt-in, bounded start/end and contact scope. Blocks, restrictions, minor/compliance policy always override and remain reasonless to other participants.
- Reachability relaxation expires automatically at the absolute event end. Proximity, co-attendance, room presence or badge scan creates no follow, connection, contact, intro edge or CRM record.
- Durable persistence requires an explicit owning Shard 11 follow/connection/private-contact command with its own consent/authorization. Partial downstream failure remains visible; conference grant does not extend.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/informal-music-listings` | place/scene/date/freshness cursor | `InformalListingPage`; source/freshness/observed/expiry labels | `422`, `429`, `503` |
| `POST /api/v1/informal-music-listings/{id}/freshness-assertions` | confirm/flag plus bounded attributes/evidence; Operator/attendee/key | `201 FreshnessAssertionResponse`; listing state/version | `403`, `404`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/listening-rooms/{roomId}/participation-grants` | scene/peer scope and room-policy version; professional party/key | `201 ListeningRoomGrantResponse`; scoped transport grant/expiry | `403 FAN_ROOM_FORBIDDEN|ROOM_SCOPE_DENIED`, `404`, `409 POLICY_STALE`, `422`, `429` |
| `DELETE /api/v1/listening-rooms/{roomId}/participation-grants/me` | participant ETag/key | `204`; revoked/version | `403`, `404`, `409`, `428`, `429` |
| `POST /api/v1/conference-networking/grants` | event/attendance evidence/contact scope/start/end; attendee/key | `201 ConferenceGrantResponse`; active grant/absolute expiry/persistence choices | `403 ATTENDANCE_UNVERIFIED|BLOCKED_ROUTE`, `409 GRANT_EXISTS`, `422 WINDOW_OR_SCOPE_INVALID`, `429` |
| `GET /api/v1/conference-networking/grants/{id}` | grant owner | `ConferenceGrantResponse`; state/scope/expiry/reachability version | `403`, `404`, `429`, `503` |
| `DELETE /api/v1/conference-networking/grants/{id}` | grant owner/automatic expiry ETag/key | `204`; revoked/expired version | `403`, `404`, `409`, `428`, `429` |
| `POST /api/v1/conference-networking/grants/{id}/persist` | explicit `follow|connection|private_contact` choice and target; attendee/key | `202 EventRelationshipPersistenceResponse`; typed Shard 11 command IDs/states | `403`, `404`, `409 GRANT_EXPIRED|BLOCKED_ROUTE`, `422`, `429`, `503` |

Listing reads are 120/min/IP; freshness writes 20/day/person/listing; room grants 60/min/person; conference grants 10/day/event/person; persistence 30/min. Room/conference responses are no-store. Events omit attendee proximity, room content, block reasons and participant lists.

## Persistence, RLS and Workers

Tables: `space.informal_event_listings`, `listing_freshness_assertions`, `listening_room_scopes`, `conference_attendee_grants`, `event_relationship_commands` and audit events. RLS limits attendance/grants to owner and server-side room moderators; public listings contain no attendee identities.

Workers age freshness using database time, preserve stale rows, expire conference grants exactly and revoke reachability/cache tokens before notifications. Room transport failure preserves policy/scope and publishes degraded mode. Persistence writes only stable downstream commands; no local edge/contact fallback exists.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Informal listing | `unconfirmed → fresh|disputed`; fresh `→ stale|disputed`; stale `→ fresh|disputed|retired`; disputed `→ fresh|stale|retired` after evidence fold | Source assertion, Operator/attendee evidence and database-time expiry trigger. State never becomes platform-verified; contradictory evidence stays visible and residential place records are prohibited. |
| Listening-room participation grant | `active → revoked|expired|restricted`; restricted may return active only after current policy permits | Professional eligibility/scene-peer policy creates grant; participant revoke, timer, block/restriction or policy change triggers. Transport degradation never broadens scope or admits Fans. |
| Conference networking grant | `scheduled → active → revoked|expired|restricted`; scheduled may become revoked/expired before start | Verified attendance, explicit opt-in and absolute window trigger. Event-end expiry is irreversible for that grant; block/restriction/minor/compliance policy overrides without reason disclosure. |
| Relationship persistence command | `requested → dispatched → pending|completed|failed|unknown`; pending/failed/unknown may retry with stable downstream command IDs | Explicit attendee choice dispatches Shard 11 command. Expired/restricted grant blocks dispatch; partial outcome remains visible and creates no local fallback edge/contact. |

Every unlisted transition returns the typed state/version/policy conflict. Events omit attendee proximity, room content, participant lists and block reasons.

## Failure, Deepening and Ambiguity Gate

Tests cover stale listing display, contradictory freshness, platform-verification wording, Fan room access, degraded transport audience widening, unverified attendee, event-end expiry, block arrival mid-event, proximity auto-edge, persistence after expiry and partial Shard 11 command failure. Seven passes converge; two implementers receive identical listing, room, grant and persistence behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Informal/listening/conference event contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]
- [[specs/be/11d-collaboration-paths-warm-intros|Collaboration paths, reachability and warm introductions — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/11a-follows-connections-endorsements|Follows, professional connections and endorsements — Backend Specification]]
- [[specs/be/12a-scenes-stewardship-seeding|Scenes, stewardship and derived place/event seeding — Backend Specification]]
