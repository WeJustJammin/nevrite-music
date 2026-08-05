# Live room, cue, talkback and monitoring controls — Backend Specification

**Status:** Complete; specialized runtime disabled  
**IA Source:** [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]  
**Deep Dive:** [[specs/ia/deep-dives/17-realtime-sessions|Real-time sessions deep dive]]

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

- **Shard split:** 2 of 4; RTS-05, RTS-06, RTS-07, RTS-08, RTS-09 and RTS-10.
- **Boundary:** identity-bound room admission, transport epochs, live take authority, performer-owned cue, capture-excluded talkback, expiring listeners and delayed notes.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 17 IA/deep dive | live authority and monitoring/talkback/cue algorithms |
| Shards 01, 06 and 09 | acting authority, recording restrictions and durable project notes |

## Live-Control Invariants

- Every room participant is an authenticated named human with current project role, recording disclosure and runtime capability; no anonymous listener, bearer link or dial-in.
- Live take freezes conductor, producer, timing model, participants, cue/talkback/capture policy and transport-clock epoch. It starts only when each recording endpoint reports durable local readiness.
- New conductor creates a new epoch and take. Deputy has only predeclared room-continuity powers and never inherits commerce, rights or producer authority.
- Performer cue mix and self-monitor are local and performer-owned. Producer cannot override; saved profile requires explicit performer action.
- Talkback is excluded before capture tap. Momentary is default; latch is conspicuous; ducking overlays cue without mutating it, and duck failure never mutes talkback.
- Listener grant binds identity, session, listen/comment capabilities, quality and mandatory expiry. Performers see named listener and quality state; revocation closes in-flight transport.
- Performer objection is visible/audited and advisory by default unless a frozen policy requires unanimous consent. Recording-law denial fails closed without silent downgrade.
- Listener comment requires separate capability. Delay compensation yields a point only when bounded; otherwise stores a time range. Notes queue until take end and transfer to Shard 09.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Runtime-dependent routes reject with `REALTIME_RUNTIME_DISABLED` at launch.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/remote-session-intents/{id}/room-grants` | identity/role/disclosure/runtime/policy versions; participant/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED|RECORDING_POLICY_DENIED`, `409`, `429` |
| `POST /api/v1/remote-session-intents/{id}/takes` | conductor/participants/policies/endpoint readiness; producer/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409 ENDPOINT_NOT_DURABLE`, `422`, `429` |
| `POST /api/v1/realtime-takes/{id}/cue-state` | source levels/pan/self-monitor/profile-save flag; performer/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/realtime-takes/{id}/talkback-events` | momentary/latch/release/ducking state; authorized producer/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/remote-session-intents/{id}/listener-grants` | listener/window/quality/listen-comment capabilities; producer/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409 CONSENT_POLICY_FAILED`, `422`, `429` |
| `DELETE /api/v1/listener-grants/{id}` | grant/version; producer or listener/key | `204`; durable revocation/transport disconnect command | `403`, `404`, `409 VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/listener-grants/{id}/objections` | performer/reason class/policy version; performer/key | `201 ListenerObjectionResponse`; visible audit/advisory effect | `403`, `404`, `409`, `422`, `429` |
| `POST /api/v1/realtime-takes/{id}/listener-notes` | compensated point/range/body/grant version; comment-capable listener/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED|COMMENT_CAPABILITY_REQUIRED`, `409`, `422`, `429` |
| `POST /internal/v1/realtime-takes/{id}/flush-notes` | stopped take/note IDs/event; worker/key | `202 NoteTransferResponse`; Shard 09 references | `403`, `409 EVENT_REUSED|TAKE_ACTIVE`, `429`, `503` |

## Persistence, RLS and Workers

- `realtime_transport_epoch`, `realtime_take`, `listener_grant`, `listener_objection` and `listener_note` pin frozen policy/authority versions; transient cue/talkback values remain runtime-local except state/audit facts.
- RLS exposes roster/listeners to participants, performer cue only to performer, listener notes to grant holder until transfer, and objections to room participants. Lateral private cue data is denied.
- Runtime kill switch revokes outstanding transport credentials. Listener revocation publishes high-priority disconnect and remains effective if projection delivery is delayed.
- Note flush uses stable Shard 09 idempotency keys and preserves range when delay uncertainty prevents a point.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Room grant | future `issued → active → revoked|expired|disconnected`; unavailable while runtime disabled | Named participant identity/role/disclosure/runtime policy triggers. Anonymous/bearer/wrong-role or recording-law denial blocks; kill switch revokes. |
| Live take/transport epoch | future `ready → recording → stopped|aborted`; conductor change ends take and creates a new epoch/take | All endpoints durable and authorized producer command trigger. Conductor loss/non-durable endpoint blocks start or ends current take without silent succession. |
| Performer cue profile | runtime-local `active`; explicit save creates immutable `saved` successor | Performer command alone triggers. Producer/deputy cannot override or save; ducking/talkback never mutates cue. |
| Talkback | `released → momentary|latched → released`; duck overlay `inactive ↔ active` independently | Authorized producer event triggers. Talkback stays pre-capture; duck failure cannot mute talkback. |
| Listener grant | future `issued → active → revoked|expired|objected`; objection is advisory unless frozen policy requires consent | Producer grant/performer objection/revoke/timer triggers. Revocation closes open transport; comment requires separate capability. |
| Listener note | `queued → transferred|failed`; transfer only after take stopped | Comment-capable listener and stable Shard 09 flush trigger. Unbounded delay stores range, never false point; active take blocks flush. |

Every unlisted transition returns the typed state/version/runtime-gate conflict. Events omit cue values, note bodies and hidden listener policy data.

## Failure, Deepening and Ambiguity Gate

Tests cover anonymous join, forwarded link, non-durable take start, silent conductor succession, producer cue override, implicit profile save, captured talkback, stuck latch, duck failure, hidden listener, advisory objection mutation, revoke-with-open-socket and false point note. Seven passes converge; two implementers receive identical live-control behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Live room and monitoring contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/ia/deep-dives/17-realtime-sessions|Deep Dive 17 — Real-time sessions]]
- [[specs/be/06b-policy-enforcement-appeals|Policy enforcement and appeals — Backend Specification]]
- [[specs/be/09c-audio-version-review-approval|Audio versions, review and approval — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/ia/deep-dives/17-realtime-sessions|Deep Dive 17 — Real-time jamming and remote sessions]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06b-policy-enforcement-appeals|Safety policy, moderation decisions, enforcement and appeals — Backend Specification]]
- [[specs/be/09c-audio-version-review-approval|Audio versioning, review and approval — Backend Specification]]
