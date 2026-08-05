# Follows, professional connections and endorsements — Backend Specification

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

- **Shard split:** 1 of 5; COM-01 through COM-03. Feed, discovery, citable paths and private CRM remain separate.
- **Boundary:** acting-party directed follows, contextual professional connections, evidence-backed endorsements, safe counts and durable-alert consent.
- **Approval:** Recommended split accepted under standing autonomy.

## Social-Edge Invariants

- Every edge binds explicit follower/requester/endorser acting party and target party; states never union across a human's personas. Edges grant no contact consent, messaging, authority, project access, rights or trust.
- Follow is approval-free and directed. There is no public follower/following roster API; safe aggregate counts apply authorization first and exclude suspended/deleted endpoints. Unfollow is silent.
- Follow alert scope is bounded per edge. Durable email/push requires verified destination plus explicit consent; otherwise state remains truthfully browser-local with no server alert subscription.
- Professional connection requires a contextual note and non-Fan acting context. Acceptance never auto-follows and accepted connections never enter the citable collaboration graph.
- Endorsement requires eligible verified Shard 07/09/booking evidence; basis class/date is visible. Operator may endorse booking-evidenced reliability only, never craft. Endorsee may silently hide without changing evidence.
- Blocks/restrictions erase shared routes/projections without revealing which control fired. Private CRM content can never supply edge evidence.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `PUT /api/v1/me/follows/{targetPartyId}` | `SetFollowRequest`: acting party, alert scope, durable-alert consent/version; party authority ETag/key | `FollowEdgeResponse`; edge/local-or-durable state/version | `403`, concealment-safe `404`, `409 ACTING_CONTEXT_STALE|VERSION_CONFLICT`, `422 ALERT_SCOPE_INVALID`, `428`, `429` |
| `DELETE /api/v1/me/follows/{targetPartyId}` | acting party ETag/key | `204`; ended version, no target notice | `403`, `404`, `409 VERSION_CONFLICT`, `428`, `429` |
| `GET /api/v1/parties/{partyId}/follow-state` | current acting party | `FollowStateResponse`; own directed state and safe aggregate only | `404`, `429`, `503` |
| `POST /api/v1/professional-connections/requests` | `ConnectionRequest`: acting party, target, context kind/note<=1KiB; professional reachability/key | `201 ConnectionRequestResponse`; pending/expiry/version | `403 FAN_CONNECT_FORBIDDEN|BLOCKED_ROUTE`, `404`, `409 REQUEST_EXISTS`, `422`, `429` |
| `POST /api/v1/professional-connections/requests/{id}/responses` | accept/decline; target acting party ETag/key | `ConnectionResponse`; accepted/declined version, no follow effect | `403`, `404`, `409 REQUEST_EXPIRED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `DELETE /api/v1/professional-connections/{id}` | either endpoint ETag/key | `204`; revoked version | `403`, `404`, `409`, `428`, `429` |
| `POST /api/v1/endorsements` | `CreateEndorsementRequest`: parties, claim, eligible evidence ref/version; authenticated endorser/key | `201 EndorsementResponse`; basis/state/version | `403`, `404`, `409 ENDORSEMENT_EXISTS`, `422 EVIDENCE_INELIGIBLE`, `429` |
| `PUT /api/v1/endorsements/{id}/visibility` | hidden/visible; endorsee ETag/key | `EndorsementResponse`; visibility version | `403`, `404`, `409 VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/endorsements/{id}/retractions` | reason; endorser ETag/key | `201 EndorsementResponse`; retracted version/evidence retained | `403`, `404`, `409 ALREADY_RETRACTED`, `422`, `428`, `429` |

State reads are 120/min/person; follows 120/min/acting party with abuse budgets; connection requests 20/day/requester and responses 60/min; endorsements 20/day/endorser. Private notes/context are no-store and omitted from events/logs; all abuse decisions use safe reason codes.

## Persistence, RLS and Workers

Tables: `community.follow_edges`, `connection_requests`, `professional_connections`, `endorsements`, `follow_alert_subscriptions` and audit events. Directed pairs/version/state are unique; connection notes are encrypted; evidence references pin source/version.

RLS is acting-party/endpoints bound; public functions expose no roster. Workers update safe counts after authorization, migrate claimed-shell follow targets with follower notice but no expanded access, expire requests neutrally and deliver durable alerts only with current verified consent. Events: follow/connection/endorsement changed; payloads exclude notes, blocks and private evidence.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Follow edge | `active → ended`; ended `→ active` only through a new explicit follow version | Follower acting-party command triggers. Block/restriction suppresses routes/projections without exposing cause; unfollow is silent and never revokes unrelated authority because none was granted. |
| Follow alert subscription | `browser_local → durable`; durable `→ browser_local|revoked`; either may become `invalid` when destination verification expires | Verified destination plus current explicit consent triggers durable state. Missing/revoked consent or unverified destination blocks server delivery while preserving the follow edge. |
| Connection request | `pending → accepted|declined|expired|revoked` | Target response, database-time expiry or requester/block revocation triggers. Fan acting context, blocked route, missing note, wrong target or terminal replay blocks. |
| Professional connection | `active → revoked|suppressed` | Accepted request creates active edge; either endpoint revoke or policy suppression triggers. It never auto-follows or enters the citable collaboration graph. |
| Endorsement | `visible ↔ hidden`; visible/hidden `→ retracted`; retracted is terminal | Eligible evidence creates visible endorsement, endorsee controls visibility and endorser alone retracts. Stale/ineligible/self-only evidence or Operator craft claim blocks creation; hiding preserves evidence. |

Every unlisted transition returns the typed state/version/acting-context conflict. Events omit notes, blocks, alert destinations and private evidence.

## Failure, Deepening and Ambiguity Gate

Tests cover two acting entities, local-only follow, consent revocation, unfollow silence, celebrity-roster scraping, block non-inference, Fan connect, acceptance without follow, note privacy, ineligible/self-only evidence, Operator craft endorsement and silent hide. Seven passes converge; two implementers receive identical edge/count/alert behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Social-edge contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/deep-dives/11-community-graph|Deep Dive 11 — Social graph and collaborator network]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/07c-claims-attestations-confidence-taxonomy|Credit claims, attestations, confidence and taxonomy — Backend Specification]]
