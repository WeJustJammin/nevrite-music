# Latency-independent overdub requests and delivery — Backend Specification

**Status:** Complete; execution runtime disabled  
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

- **Shard split:** 4 of 4; RTS-17 and RTS-18.
- **Boundary:** immutable overdub reference package and brief, local round-trip measurement, pass/keeper capture and resumable version-bound delivery.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 17 IA/deep dive | overdub algorithm and runtime fallback boundary |
| Shards 09, 13 and 14 | project packages, opportunity wrappers and commercial terms |

## Overdub Invariants

- Producer may plan overdub request without live transport. Request freezes bed package/files/digests, round brief, fidelity, version, deadline wrapper and optional observed-attendance slot.
- Commercial deadline, price, revision and acceptance remain Shard 13/14 facts; this contract does not invent billing consequences.
- Performer receives immutable reference package. Bed change requires successor request and explicit diff; delivery against stale bed is rejected before upload association.
- Execution requires admitted local runtime with independently verified local durability and eventual governed upload. Consumer browser cannot claim device capture or latency compensation.
- Runtime measures local round-trip per rig/session with uncertainty and applies measured offset only; it never judges feel, quantizes performance or reports artistic quality.
- Each pass is immutable. Performer chooses keepers; non-keepers remain local unless explicitly uploaded. Delivery is resumable and pins request/bed/runtime/measurement versions.
- Result distinguishes delivery-grade asset from observed-playing evidence and reports measured residual. Neither state automatically creates credit, rights or acceptance.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls. Planning routes remain available; runtime capture routes reject while disabled.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/overdub-requests` | project/bed manifest/brief/fidelity/deadline/attendance slot; producer/key | `201 OverdubRequestResponse`; frozen request/version | `403`, `409 SOURCE_STALE`, `422`, `429` |
| `POST /api/v1/overdub-requests/{id}/successors` | new bed/brief/diff reason; producer ETag/key | `201 OverdubRequestResponse`; successor/diff | `403`, `409 VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/overdub-requests/{id}/runtime-grants` | endpoint/rig/runtime version; performer/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/overdub-requests/{id}/round-trip-measurements` | rig/session/interval/uncertainty; runtime/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409`, `422`, `429` |
| `POST /api/v1/overdub-requests/{id}/passes` | local pass/checksum/duration/measurement version; performer runtime/key | no success while runtime disabled | `403 REALTIME_RUNTIME_DISABLED`, `409 BED_VERSION_STALE`, `422`, `429` |
| `POST /api/v1/overdub-requests/{id}/deliveries` | keeper pass IDs/bed/request versions/chunk manifest; performer/key | `202 OverdubDeliveryResponse`; delivery job/state | `403`, `409 BED_VERSION_STALE`, `422`, `429`, `503` |
| `POST /internal/v1/overdub-deliveries/{id}/complete` | asset digests/residual/evidence class/event; worker/key | `OverdubDeliveryResponse`; delivery-grade/observed-playing | `403`, `409 EVENT_REUSED`, `422`, `429` |

## Persistence, RLS and Workers

- `overdub_request` and successor rows pin bed/package/brief/fidelity/deadline versions. `overdub_pass` is immutable and owner-private until selected; `overdub_delivery` references keeper IDs and stable upload operations.
- RLS exposes request to scoped project participants, passes only to performer until delivery and resulting governed assets through Shard 09 project access.
- Upload workers resume verified chunks and preserve local pending state. Completion emits evidence class/residual only; Shards 07/10/14 decide attribution, rights and acceptance.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Overdub request | `draft → active → delivered|cancelled|expired`; active `→ superseded` by explicit bed/brief successor | Producer command/deadline/delivery triggers. Bed change requires frozen successor/diff; stale bed blocks pass/delivery association. |
| Runtime grant/measurement | future grant `issued → active → revoked|expired`; measurement `running → measured|unknown|failed`; unavailable while runtime disabled | Admitted runtime/local durability and bounded rig evidence trigger. Browser, gate bypass or uncertainty inflation blocks. |
| Overdub pass | future immutable `local → keeper|non_keeper`; keeper `→ upload_pending`; unavailable while runtime disabled | Performer selection triggers. Non-keeper stays local unless explicitly selected; no automatic upload or quantization. |
| Overdub delivery | `requested → uploading → processing → delivery_grade|observed_playing|partial|failed`; failed/partial may retry with stable operations | Exact keeper/request/bed/runtime/measurement versions and verified chunks trigger. Result never auto-creates credit, rights, acceptance or billing outcome. |

Every unlisted transition returns the typed state/version/runtime-gate conflict. Events expose evidence class/residual only and omit private passes.

## Failure, Deepening and Ambiguity Gate

Tests cover mutable bed, hidden successor diff, browser capture claim, runtime gate bypass, round-trip certainty inflation, quantization, automatic keeper upload, stale-bed delivery, delivery-to-credit and commercial-outcome invention. Seven passes converge; two implementers receive identical overdub behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Overdub request and delivery contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/ia/deep-dives/17-realtime-sessions|Deep Dive 17 — Real-time sessions]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
- [[specs/be/14c-delivery-acceptance-exit-rights|Final delivery, acceptance, exit settlement, recall and rights execution — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
- [[specs/ia/deep-dives/17-realtime-sessions|Deep Dive 17 — Real-time jamming and remote sessions]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
- [[specs/be/14c-delivery-acceptance-exit-rights|Final delivery, acceptance, exit settlement, recall and rights execution — Backend Specification]]
