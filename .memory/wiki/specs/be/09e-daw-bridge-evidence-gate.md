# DAW bridge and capture-at-source evidence gate — Backend Specification

**Status:** Complete; capability disabled for v1  
**IA Source:** [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]  
**Deep Dive:** [[specs/ia/deep-dives/09-projects-collaboration|Project collaboration deep dive]]

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

- **Shard split:** 5 of 5; PRJ-20. This specification locks the disabled boundary and evidence required for a future architecture change; it does not authorize a desktop client, plugin, watch folder or DAW parser.
- **Boundary:** reviewed activation evidence, signed local-agent identity, least-readable roots, revocable device grants, protected local queue and source-to-manual-ingest handoff.
- **Approval:** Recommended split accepted under standing autonomy.

## Disabled-Boundary Invariants

- Consumer v1 has no active bridge device, agent, watch-folder, parser, environment-manifest or missing-media resolution path. Web/manual upload remains complete without a hidden desktop dependency.
- Activation requires a new architecture decision propagated downstream—not a feature flag—and recorded evidence for: solo-team cost/support model; least-filesystem-scope threat model; secret isolation, signed updates and revocation; protected local queue; representative validation per supported DAW; format legal review; and product value.
- Until every evidence item is independently reviewed, all enrollment/activation/ingest commands fail `BRIDGE_DISABLED` before project/path/device existence checks and no active-row or secret material can be created.
- A future agent uses device public-key authentication, signed/notarized allowlisted versions and owner-approved roots only. Home-directory, credential-store, browser-profile and sibling-project reads are deny-by-default and cannot be broadened by server instruction.
- Local capture may propose immutable ingest facts only. It cannot choose canonical, classify source/AI use, assert attendance/credit/rights/splits, delete records or mutate project truth.
- Unknown DAW/archive formats preserve user-selected bytes and label parsing unavailable. Agent/provider ambiguity remains explicit pending/unknown; local queue replay is content-hash/idempotency bound.

## API Endpoint Matrix

These strict Zod 4 contracts are documented for deterministic denial and future migration. In v1 only the capability-status query and gated activation denial are routable; all device/ingest routes are absent from the deployed router.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/project-bridge/capability` | authenticated owner | `BridgeCapabilityResponse`; disabled state and non-sensitive unmet evidence classes | `403`, `429`, `503` |
| `POST /api/v1/projects/{projectId}/bridge-activations` | `BridgeActivationRequest`: intended DAW/use; owner/key | no v1 success | `403 BRIDGE_DISABLED` before source lookup, `429` |
| `POST /api/v1/project-bridge/devices` | future `EnrollBridgeDeviceRequest`: public key, signed agent/version, owner-approved root attestations; owner step-up/key | future `201 BridgeDeviceResponse` | route absent v1; later `403 GATE_EVIDENCE_INCOMPLETE|STEP_UP_REQUIRED`, `409 DEVICE_EXISTS`, `422`, `429` |
| `POST /api/v1/project-bridge/devices/{id}/grants` | future exact project/read roots/capabilities/expiry; owner step-up ETag/key | future revocable signed grant | route absent v1; later `403`, `409 ROOT_SCOPE_FORBIDDEN|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/project-bridge/ingests` | future signed device event, content hash, local sequence, safe relative path token and metadata; active device grant/key | future `202 BridgeIngestResponse`; quarantine/manual-confirmation state | route absent v1; later `403 DEVICE_OR_GRANT_REVOKED`, `409 EVENT_REUSED|HASH_MISMATCH`, `422`, `429`, `503` |
| `POST /api/v1/project-bridge/devices/{id}/revoke` | future reason; owner/security authority ETag/key | future `204`; grant/queue revoked | route absent v1; later `403`, `409 VERSION_CONFLICT`, `428`, `429` |

Capability query is 30/min/person and activation denial 5/min/project. Future device operations require mTLS-equivalent key proof, nonce/replay protection, bounded batches and 100% security audit. No path strings, local usernames, project titles or file contents enter logs/events.

## Persistence, RLS and Security Envelope

V1 has reviewed gate-evidence records only; `project.bridge_devices` and `bridge_ingests` permit no active rows through database constraints while the architecture capability version is absent. Future rows pin owner, device public key, signed agent version, allowed-root hash, grant version, evidence-set hash, state and heartbeat; ingests pin device sequence/content hash/quarantine state without storing absolute local paths.

RLS is owner/device/grant-version bound and never grants staff filesystem visibility. No v1 worker consumes bridge events or polls local-agent state. Agent updates are signed, rollback-protected and separately revocable; server commands can narrow but never widen local roots. Local secrets remain OS-protected; queue payloads encrypt at rest and expire through governed bounded settings. Revocation blocks new reads/uploads immediately and treats ambiguous in-flight work as unknown pending reconciliation.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Capability gate evidence | `draft → reviewed → approved|rejected`; approved may become `stale|revoked` on architecture/security evidence change | Qualified review/propagated architecture version triggers. V1 capability remains absent/disabled regardless of ordinary setting. |
| Future device registration | `pending → active → revoked|expired` | Device proof/admin approval/timer triggers after future activation. Non-active device cannot ingest; no v1 rows are created. |
| Future bridge ingest | `queued → quarantined → confirmed|rejected|failed` | Signed active device/parser/human confirmation triggers. Quarantined data cannot affect project/credit truth; only confirmed emits bounded evidence. |

Every unlisted transition is unavailable or returns the typed state conflict. Owner-diagnostic event remains disabled in v1.

## Failure, Deepening and Ambiguity Gate

Tests prove router absence for device/ingest routes, activation denial before project enumeration, database rejection of active rows, feature-flag inability to activate, path/root traversal denial, signed-version rollback prevention, server scope-widening denial, device replay/hash mismatch, revocation during upload, unknown format preservation and prohibition on canonical/credit/rights/source classification. Logs omit local/device-sensitive data. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical v1 denial and future evidence-gated security behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | DAW bridge disabled boundary and evidence gate authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/deep-dives/09-projects-collaboration|Deep Dive 09 — Music projects and collaboration]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09c-audio-version-review-approval|Audio versioning, review and approval — Backend Specification]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
