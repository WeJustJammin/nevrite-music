# Collaboration paths, reachability and warm introductions — Backend Specification

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

- **Shard split:** 4 of 5; COM-11 through COM-15. Manual connections/follows/endorsements never supply graph evidence; this contract owns only derived citable collaboration edges and double opt-in routes.
- **Boundary:** ego-rooted two-hop path resolution, endpoint suppression, density/compliance-aware reachability, broker-first requests and target-consented channels.
- **Approval:** Recommended split accepted under standing autonomy.

## Graph and Intro Invariants

- Graph edges join claimed active human parties only from eligible session/attestation evidence with second-human confirmation. Follows, connections, endorsements, entities, unclaimed profiles and self-only assertions are excluded.
- Each source edge remains independent and citable. Evidence class is lexicographically stronger than volume/recency; age is disclosed, never silently decayed. Credits/evidence remain unchanged by graph suppression.
- Queries must be requester's ego-rooted path to a specific target with depth<=2. Intermediaries are active claimed humans; entities/unclaimed nodes may be terminals only. Arbitrary third-party relationship queries are forbidden.
- Every edge is re-authorized at request time for blocks, endpoint suppression, citability and active status. Path returns only when each step can be explained without private context; dependency failure is `unknown`, exhaustive miss is `no_path_within_intro_range`.
- Either human endpoint may silently suppress an edge; suppression invalidates path caches immediately and never notifies the other endpoint.
- Reachability resolves `direct|intro_required|unavailable` from block/restriction, compliance/minor policy, density, sender class and target policy without exposing reason. Sparse graphs never fabricate a path.
- Intro is broker-first with a specific ask and dedicated requester/broker caps. Target receives nothing until broker acceptance; broker decline/ignore is neutral. Only target acceptance opens the scoped channel.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/collaboration-paths` | `FindPathRequest`: acting party/target/evidence floor; professional requester/key | `GraphPathResponse`; citable <=2-hop path, unknown or bounded no-path with snapshot version | `403 EGO_ROOT_REQUIRED|BLOCKED_ROUTE`, `404`, `409 PROJECTION_STALE`, `422`, `429`, `503` |
| `PUT /api/v1/collaboration-edges/{edgeId}/suppression` | suppress true/false; either human endpoint ETag/key | `EdgeSuppressionResponse`; private version/cache invalidation | `403`, `404`, `409 VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/reachability-evaluations` | sender/target/intended action/context; professional sender/key | `ReachabilityResponse`; safe direct/intro/unavailable route/policy version | `403`, `404`, `422`, `429`, `503` |
| `POST /api/v1/intro-requests` | requester/target/broker/evidence snapshot/specific ask<=2KiB/expiry; eligible requester/key | `201 IntroRequestResponse`; broker-only requested state/version | `403 BROKER_INELIGIBLE|BLOCKED_ROUTE`, `404`, `409 REQUEST_EXISTS|BROKER_CAP_REACHED`, `422`, `429` |
| `POST /api/v1/intro-requests/{id}/broker-responses` | accept/decline, optional bounded note and disclosure consent; broker ETag/key | `IntroRequestResponse`; target-invited or declined state | `403`, `404`, `409 REQUEST_EXPIRED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/intro-requests/{id}/target-responses` | accept/decline; target ETag/key | `IntroRequestResponse`; channel-open/declined state | `403`, `404`, `409 TARGET_NOT_INVITED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `DELETE /api/v1/intro-requests/{id}` | authorized participant/block outcome ETag/key | `204`; revoked/closed route | `403`, `404`, `409`, `428`, `429` |

Path/reachability reads are 30/min/person/target; intro requests 10/day/requester and broker inbound cap resolves through governed bounds; responses 60/min. All responses are no-store; request ask/note/path internals/refusal reasons are omitted from logs/events.

## Persistence, RLS and Workers

Tables: `community.collaboration_edge_evidence`, `edge_suppressions`, `reachability_policy_versions`, `intro_requests`, `intro_channels` and audit events. Source evidence pins human endpoints/source kind+ID+version/evidence class/date/citability/attestation.

RLS is endpoint/request-participant and purpose bound. A security-definer path function enforces ego root, max depth, fresh authorization and explainability before returning steps. Cache keys include block/suppression/evidence/projection versions. Intro workers expire neutrally and deliver only stage-authorized messages; revocation/block closes future delivery without reason leakage.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Collaboration edge evidence | `active → suppressed|stale|ineligible`; suppressed `→ active` only when both source eligibility and current endpoint controls permit | Eligible second-human-confirmed source and endpoint suppression/source change trigger. Self-only, entity-intermediary, unclaimed or inactive evidence cannot become active. |
| Path evaluation | immutable result `path_found|unknown|no_path_within_intro_range` bound to exact snapshot | Ego-rooted <=2-hop query triggers. Dependency failure yields unknown; only an exhaustive authorized miss yields no-path; stale snapshot never returns a path. |
| Reachability evaluation | immutable result `direct|intro_required|unavailable` bound to policy snapshot | Current block/restriction/compliance/density/sender/target policy fold triggers. Result exposes no private reason and sparse graph cannot fabricate direct or intro reachability. |
| Intro request | `broker_requested → target_invited|broker_declined|expired|revoked`; target-invited `→ channel_open|target_declined|expired|revoked` | Broker then target decisions, database-time expiry or participant/block revocation trigger. Target receives nothing before broker acceptance; silence is neutral and terminal states reject replay. |
| Intro channel | `open → closed|revoked|expired` | Target acceptance creates exact scoped channel; participant close, block/restriction or policy expiry triggers. Closed channel cannot deliver and reveals no control reason. |

Every unlisted transition returns the typed state/version/policy conflict. Events omit ask, broker note, path internals and refusal reason.

## Failure, Deepening and Ambiguity Gate

Tests cover stranger-to-stranger query, entity intermediary, weak/self-only edge, old evidence disclosure, dependency timeout unknown, exhaustive no-path, immediate suppression, stale cache, sparse density, target block inference, broker harassment/cap, ignored request, pre-broker target contact and channel before target consent. Seven passes converge; two implementers receive identical path/reachability/intro behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Collaboration-path and intro contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/deep-dives/11-community-graph|Deep Dive 11 — Social graph and collaborator network]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/11c-collaborator-discovery-calls|Collaborator discovery, availability and calls — Backend Specification]]
