# BE-09e — DAW bridge evidence gate

## Split Group

This companion owns the future local-device and bridge-ingest evidence gate: device identity, signed agent version, allowed-root attestation, revocable grant, heartbeat and queued ingest state. The route is present as a typed denial in v1; no desktop agent, watch-folder parser, take ingest, environment verification, source-path observation or moment-of-use prompt is active. Project, song, roster, asset, audio, session, package and rights truth remain in their owning companions. The authoritative source is [IA Shard 09 — Music projects and collaboration](../ia/09-projects-collaboration.md).

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Boundary | Owner-only future bridge activation with a four-part evidence gate | IA PRJ-20 line 97, `ActivateBridge` line 172 and bridge delivery boundary lines 40–44. |
| Operation | One typed route for `PRJ-20`; v1 always returns `BRIDGE_DISABLED` | IA interaction row 97 and deep-dive DAW Bridge Evidence Gate lines 142–151. |
| Data | `bridge_device` and `bridge_ingest` only; no v1 active rows | IA Data Models row 204 and typed registry lines 260–261. |
| Evidence | Costed agent model, least-filesystem-read threat proof, real-session/legal validation per DAW, product justification, signed version and allowed-roots attestation | IA line 97; deep-dive lines 142–151. |
| Security | Deny-by-default device grants, revocation, path-root attestation, secret isolation and local queue protection | Deep-dive Abuse and Recovery Verification lines 153–169. |
| Exclusions | No feature flag alone can activate; no arbitrary filesystem read, credentials, canonical/credit/rights mutation or hidden desktop dependency | IA Delivery Phase line 44, Access Control lines 275–276 and PRJ-20 line 97. |

## Referenced Material Inventory

| Source file | Section and lines | Material used | Trace |
|---|---|---|---|
| [IA parent](../ia/09-projects-collaboration.md) | Overview/Delivery Phases, lines 1–44 | Web/PWA launch and local-agent exclusion | IA-09E-SCOPE |
| [IA parent](../ia/09-projects-collaboration.md) | PRJ-20 and Global Interaction Rules, lines 97 and 104–111 | Preconditions, disabled result and request context | IA-09E-INT |
| [IA parent](../ia/09-projects-collaboration.md) | `ActivateBridge`, lines 164–172 | Bridge contract and no-v1 assertion | IA-09E-CONTRACT |
| [IA parent](../ia/09-projects-collaboration.md) | Data Models and Typed Field Registry, lines 174–205 and 260–261 | Exact bridge model identifiers and fields | IA-09E-DATA |
| [IA parent](../ia/09-projects-collaboration.md) | Access Control, lines 264–289 | Owner/device/worker permissions and no credential access | IA-09E-ACCESS |
| [IA parent](../ia/09-projects-collaboration.md) | Accessibility and Event Schemas, lines 291–319 | Diagnostics accessibility and bridge state event privacy | IA-09E-A11Y-EVENT |
| [IA parent](../ia/09-projects-collaboration.md) | Edge Cases and Cross-Shard Contracts, lines 321–419 | Unknown format, v1 denial, local-agent threat and consumer boundary | IA-09E-EDGE |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | DAW Bridge Evidence Gate, lines 142–151 | Four evidence requirements and propagation rule | DD09E-GATE |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Abuse and Recovery Verification, lines 153–169 | Allowed roots, signed updates, revocation and queue protection | DD09E-RECOVERY |
| [09 deep dive](../ia/deep-dives/09-projects-collaboration.md) | Cross-Shard Contracts and Implementation Envelope, lines 171–190 | BE00 storage/queue, web/PWA and gated activation boundary | DD09E-CROSS |
| [Feature ledger](../feature-ledger.md) | rows 273–275 | Bridge watch-folder, DAW parsing and capture surface boundaries | FL-09E |
| [BE00](00-infrastructure.md) | Shared errors, request context, signed credentials, queue, audit and revocation contracts | Inherited platform behavior | BE00-INHERIT |

## IA Source Map

### Interaction map

| IA interaction | IA line | Backend operation | Owned result |
|---|---:|---|---|
| `PRJ-20` Activate DAW bridge | 97 | `PRJ-20` `POST /api/v1/songs/{songId}/bridge/activation` | Signed device grant/agent state or gated denial |

### Model map

| IA first-column identifier | IA line | Ownership in this companion |
|---|---:|---|
| `bridge_device` | 204 | Device public key, agent version, allowed roots, gate evidence, revocation and heartbeat |
| `bridge_ingest` | 204 | Future local queue/ingest state and checksum evidence; inactive in v1 |

### Event map

| IA event type | IA line | Producer/consumer treatment |
|---|---:|---|
| `project.bridge.state-changed.v1` | 316 | Published only for reviewed gate state or revocation; no local path or file payload |
| `project.song.changed.v1` | 305 | Consumed for song ownership; song owner is 09a |
| `project.version.ingested.v1` | 308 | Future consumer only; audio version owner is 09c |
| `project.access.changed.v1` | 307 | Consumed to revoke bridge grants when role/block policy changes |
| `project.session.closed.v1` | 312 | Future consumer only; session owner is 09d |

The event map retains the exact parent event identifiers relevant to the gate while this companion publishes only `project.bridge.state-changed.v1`. Events contain hashes and state, never local paths, file names, credentials, audio bytes, project titles or unrestricted PII.

## Feature Ledger Coverage

| Ledger ID | Capability | Ledger line | Backend treatment |
|---|---|---:|---|
| `07.09.01` | Bounce Watch-Folder & Auto-Ingest | 273 | Future only; activation remains `BRIDGE_DISABLED` in v1 |
| `07.09.02` | DAW Session File Parsing & Track-to-Contributor Mapping | 274 | Evidence-gated future adapter; no parser or mapping in v1 |
| `07.09.03` | In-Session Capture Surface | 275 | Evidence-gated future web/desktop decision; no hidden prompt in v1 |

## Endpoint Completeness Reconciliation

| IA interaction | Route | Request | Success | Errors and recovery | Event/audit |
|---|---|---|---|---|---|
| `PRJ-20` | `POST /api/v1/songs/{songId}/bridge/activation` | `ActivateBridgeRequest` | `BridgeActivationResponse` with `BRIDGE_DISABLED` v1 or signed grant after all gates pass | `BRIDGE_DISABLED`, `FORBIDDEN`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE` | `project.bridge.state-changed.v1` after durable gate state/revocation; audit |

## Shared Contract Inheritance

BE00 supplies request IDs, authentication context, `ApiError { code, message, requestId, details }`, idempotency fingerprints, signed device credentials, revocation epochs, queue durability, audit hashing and outbox delivery. BE01 supplies owner authority and device-party binding. This companion never reads credentials, creates project access, sets canonical versions, writes credits/rights or infers source declarations. A future activation is a new architecture decision propagated downstream; a feature flag alone is insufficient.

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA interaction | Method and path | Request → success | Auth / ownership / 403 versus 404 | Middleware incl. CORS | Idempotency / concurrency | Rate / timeout / cache / SLO | Error envelope | Event |
|---|---|---|---|---|---|---|---|---|---|
| `PRJ-20` | `PRJ-20` | `POST /api/v1/songs/{songId}/bridge/activation` | `ActivateBridgeRequest` → `BridgeActivationResponse` | Song/project owner only; hidden song 404, known non-owner 403; v1 owner still receives gated denial | `requestId → authContext → rateLimit → zod(path+body) → cors=consumer-web-pwa → csrf → tenantScope → authorization → evidenceGate → idempotency → audit`; CORS is `consumer-web-pwa` allowlist with no cross-site credentials; `ApiError { code, message, requestId, details }` | Key `(song_id, device_public_key_hash, idempotency_key)` unique; device state and evidence version CAS | 10 requests/hour/owner; 1,000 ms deadline; no cache of credentials; p95 ≤ 500 ms | `ApiError { code, message, requestId, details }` | `project.bridge.state-changed.v1` |

### Registry invariants

1. The path is tenant-scoped before the owner predicate. A hidden song is 404; a known song with a non-owner actor is 403. An owner request in v1 returns the typed `BRIDGE_DISABLED` result until all evidence and a new architecture decision are recorded.
2. Every failure is `ApiError { code, message, requestId, details }`. Details contain evidence checklist keys and safe hashes only, never local paths, device secrets, file names, project titles or parser output.
3. Evidence is four-part and conjunctive: costed agent/signing/support model, least-filesystem-read threat model, per-DAW real-session/legal validation and product evidence for a permanent desktop surface. Signed agent version, revocable device grant and allowed-roots attestation are required after evidence approval.
4. Device state and queued ingest are append-only/versioned. Revocation invalidates future reads and queue processing; it cannot recall bytes already copied. A bridge worker cannot mutate canonical, credit, rights, source-declaration or session attendance state.

### Pagination and response bounds

Collection behavior is explicit outside the operation matrices. Bridge activation is one bounded state transition; pagination and cursor are N/A, and `limit` is not accepted because the response contains one device projection. The evidence-reference array is capped at 32 entries and the request body at 32 KiB.

| Operation ID | Pagination and cursor | Limit and rationale |
|---|---|---|
| `PRJ-20` | Pagination: N/A; cursor: N/A | One bridge-device activation result; evidence-reference limit 32 and request body limit 32 KiB. |

### Operation contract and error matrix

| Operation ID | Request and validation | Success | Declared errors | Recovery |
|---|---|---|---|---|
| `PRJ-20` | Device public-key hash, signed agent version, allowed-roots attestation, evidence IDs, gate version, requested scopes and expected device version | V1: `BRIDGE_DISABLED` status with checklist; future: signed grant, state, scope and expiry | `BRIDGE_DISABLED`, `FORBIDDEN`, `VALIDATION_FAILED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH`, `DEPENDENCY_UNAVAILABLE` | Retry only after the evidence version changes and the gate is re-reviewed; replaying the same key returns the gated status, and revocation stops future queue work |

### Route field validation matrix

| Operation ID | Path and body fields | Limits and invariants | Rejection |
|---|---|---|---|
| `PRJ-20` | `songId`, `device_public_key`, `agent_version`, `allowed_roots_attestation`, `evidence_refs`, `requested_scopes`, `expected_device_version` | Key is 32-byte encoded public key; version is signed semver; roots ≤ 16 and canonicalized; scopes limited to `read_bounce`, `queue_ingest`; all four evidence refs required; no v1 activation | `VALIDATION_FAILED`, `BRIDGE_DISABLED` |

## Request/Response Contracts (Zod 4 schemas)

```ts
import { z } from "zod";

const UUID = z.string().uuid();
const Version = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const Key = z.string().trim().min(16).max(128);
const Hash = z.string().regex(/^[a-f0-9]{64}$/);
const ApiError = z.object({
  code: z.enum(["BRIDGE_DISABLED", "FORBIDDEN", "RESOURCE_NOT_FOUND", "VALIDATION_FAILED", "VERSION_CONFLICT", "IDEMPOTENCY_MISMATCH", "DEPENDENCY_UNAVAILABLE"]),
  message: z.string().trim().min(1).max(240),
  requestId: UUID,
  details: z.record(z.string(), z.json())
}).strict();

const EvidenceRefs = z.object({
  costed_agent_model_id: UUID,
  threat_model_id: UUID,
  daw_validation_id: UUID,
  product_evidence_id: UUID,
  reviewed_at: z.string().datetime({ offset: true }),
  approved_by_person_id: UUID
}).strict();

const AllowedRootsAttestation = z.object({
  roots: z.array(z.string().trim().min(1).max(512)).min(1).max(16),
  root_hash: Hash,
  issued_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }),
  signer_key_id: UUID
}).strict();

export const ActivateBridgeRequest = z.object({
  actor_person_id: UUID,
  acting_party_id: UUID,
  acting_context_version: Version,
  song_id: UUID,
  device_public_key: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  device_public_key_hash: Hash,
  agent_version: z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/),
  allowed_roots_attestation: AllowedRootsAttestation,
  evidence_refs: EvidenceRefs,
  requested_scopes: z.array(z.enum(["read_bounce", "queue_ingest"])).min(1).max(2),
  expected_device_version: Version,
  idempotency_key: Key,
  request_id: UUID
}).strict();

export const BridgeActivationResponse = z.object({
  device_id: UUID,
  song_id: UUID,
  state: z.enum(["disabled", "pending_review", "active", "revoked"]),
  gate_state: z.enum(["not_reviewed", "incomplete", "approved"]),
  missing_evidence_keys: z.array(z.enum(["costed_agent_model", "threat_model", "daw_validation", "product_evidence"])),
  grant_id: UUID.nullable(),
  grant_expires_at: z.string().datetime({ offset: true }).nullable(),
  allowed_roots_hash: Hash,
  version: Version,
  event_id: UUID,
  audit_event_id: UUID
}).strict();

export type ApiError = z.infer<typeof ApiError>;
export type ActivateBridgeRequest = z.infer<typeof ActivateBridgeRequest>;
export type BridgeActivationResponse = z.infer<typeof BridgeActivationResponse>;
```

### Contract field traceability

| Field | IA source | Enforcement |
|---|---|---|
| `device_public_key`, `agent_version`, `allowed_roots_attestation` | PRJ-20 line 97 and `bridge_device` line 204 | Signed version, canonical roots and revocable device grant |
| Four `evidence_refs` | DAW Bridge Evidence Gate lines 142–151 | Conjunctive checklist; v1 remains disabled |
| `requested_scopes`, `expected_device_version` | Access Control lines 275–276 and bridge contract line 172 | Least scope and CAS |
| `missing_evidence_keys`, `grant_expires_at`, `gate_state` | PRJ-20 completion/failure line 97 | Explicit gated response, no hidden dependency |

## Database Schema

### Canonical records and fields

| Table | Typed fields with nullability and constraints | Foreign keys, indexes and RLS/grants |
|---|---|---|
| `bridge_device` | `id uuid NOT NULL PRIMARY KEY`; `owner_party_id uuid NOT NULL`; `device_public_key text NOT NULL CHECK (char_length(device_public_key) = 43)`; `device_public_key_hash text NOT NULL CHECK (device_public_key_hash ~ '^[a-f0-9]{64}$')`; `agent_version text NOT NULL CHECK (char_length(agent_version) BETWEEN 5 AND 80)`; `allowed_roots_hash text NOT NULL CHECK (allowed_roots_hash ~ '^[a-f0-9]{64}$')`; `requested_scopes jsonb NOT NULL`; `grant_hash text NULL`; `gate_evidence jsonb NOT NULL`; `state text NOT NULL CHECK (state IN ('disabled','pending_review','active','revoked'))`; `last_seen_at timestamptz NULL`; `revoked_at timestamptz NULL`; `revocation_reason text NULL CHECK (revocation_reason IS NULL OR char_length(revocation_reason) <= 500)`; `version bigint NOT NULL CHECK (version >= 0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`; unique `(owner_party_id, device_public_key_hash)` | FK `owner_party_id → party.id`; grant and evidence IDs are BE00/authority opaque references; indexes `(owner_party_id, state, updated_at DESC)`, `(device_public_key_hash)`, `(state, last_seen_at)`; RLS owner diagnostics only, service gate function writes, credential/grant hash fields excluded from client grants |
| `bridge_ingest` | `id uuid NOT NULL PRIMARY KEY`; `device_id uuid NOT NULL`; `song_id uuid NOT NULL`; `queue_key text NOT NULL CHECK (char_length(queue_key) BETWEEN 1 AND 128)`; `source_locator_hash text NOT NULL CHECK (source_locator_hash ~ '^[a-f0-9]{64}$')`; `checksum text NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$')`; `bytes bigint NOT NULL CHECK (bytes >= 0)`; `media_type text NOT NULL CHECK (char_length(media_type) <= 120)`; `state text NOT NULL CHECK (state IN ('queued','settling','accepted','rejected','revoked'))`; `error_code text NULL`; `created_at timestamptz NOT NULL`; `settled_at timestamptz NULL`; `version bigint NOT NULL CHECK (version >= 0)`; unique `(device_id, queue_key)` | FK `device_id → bridge_device.id`, `song_id → song.id`; source locator is a hash and no local path is persisted; indexes `(device_id, state, created_at)`, `(song_id, state, created_at DESC)`, `(checksum)`; RLS owner can see status only after active grant, service worker append/update through queue function, no direct blob or locator grant |

Grant invariant applies row-for-row: client API roles receive no direct table `GRANT`; bridge activation uses the named evidence-gate function, while the service role receives only least-privilege `GRANT EXECUTE` and never raw device or ingest table access.

### Persistence invariants

- v1 activation writes no active device or ingest state. An owner request records a safe disabled status/audit only when the idempotency contract requires durable response; no feature flag bypasses evidence.
- Future activation requires all four evidence references, signed agent version, canonical allowed-root attestation, revocable grant and expected device version. Device scopes are limited to explicit bounce read/queue ingest capabilities.
- `bridge_ingest` stores only source locator hash, checksum, size and queue state. It never stores credentials, arbitrary paths, project titles, attendance, credits, rights, canonical decisions or source classification.
- Revocation increments device epoch, stops new queue work and invalidates grants. In-flight bytes are quarantined and marked revoked; they cannot become an audio version without a separate 09c ingest command.
- Heartbeats update `last_seen_at` through a service function and never authorize work. Stale devices remain denied until owner reactivation after evidence review.

## Middleware & Policies

### Hono middleware order

1. `requestId` validates UUID and propagates it to trace, audit and response.
2. `cors(consumer-web-pwa)` applies the web/PWA allowlist and mutation headers; no browser route can supply a credentialed wildcard origin.
3. `authContext` resolves BE00 session, owner party and acting-context version.
4. `rateLimit` applies owner/IP buckets, then strict Zod validates path, body, signed key and root attestation.
5. `tenantScope` resolves song and device under owner policy before evidence state is disclosed.
6. `authorization` requires song/project owner and rejects non-owner with known-resource 403; hidden song is 404.
7. `evidenceGate` verifies four references, review expiry, signed agent version and root canonicalization; v1 returns `BRIDGE_DISABLED` even when valid.
8. `idempotency` reserves/replays the request fingerprint; `serializableCommand` CASes device/evidence version.
9. `auditOutbox` records safe gate state and `project.bridge.state-changed.v1`; response filtering strips paths, keys and device secrets.

### Per-operation authorization matrix

| Operation ID | Required capability and ownership | 403 versus 404 | Idempotency and rate | CORS and output policy |
|---|---|---|---|---|
| `PRJ-20` | Song/project owner with current BE01 authority; future device grant is owner-scoped | Hidden song 404; known non-owner 403; owner v1 request is typed disabled result | `(song, device hash, key)` replay; 10/hour/owner | `consumer-web-pwa`; safe checklist and hashes only, no paths/credentials |

### Security and abuse controls

- Root attestations are canonicalized, hashed and bounded to 16 explicit roots. Parent traversal, home-directory expansion, symlink escape, wildcard roots and roots outside the reviewed threat model are rejected.
- Agent versions require signed metadata, supported semver and revocation-list check. Credentials, tokens and environment manifests are never readable by the agent contract.
- The queue is encrypted and scoped to one owner/device/song. Revocation stops dequeue and invalidates grant epoch; failed or unknown formats remain quarantined and labelled unavailable.
- Evidence references are capability-scoped and expire. A stale legal/DAW validation or changed root set returns `BRIDGE_DISABLED` or `VALIDATION_FAILED`; it never silently degrades to broader access.
- Rate limits: 10 activation attempts/hour/owner, 5 invalid attestation attempts/10 minutes/device hash and 100 queue items/hour/device after a future gate. No v1 queue endpoint is reachable.
- Audit/log fields are hashes, evidence keys, state and request IDs. provider-native diagnostics never receives keys, local roots, paths, file names, credentials or parser content.

## Data Flow

### Transaction and external seams

| Seam | Exact request and response | Timeout | Retry | Circuit behavior |
|---|---|---:|---:|---|
| BE00 context/idempotency | `RequestContext { requestId, actorPersonId, actingPartyId, contextVersion, key, fingerprint }` → `ContextDecision { accepted, replay, storedResult? }` | 100 ms | 0 retries; no backoff; in-process | N/A for network circuit (in-process); fail closed on missing context |
| BE01 owner/device authority | `ResolveBridgeAuthority { songId, partyId, deviceKeyHash, capability }` → `AuthorityDecision { allowed, ownerPartyId, authorityVersion, blocked }` | 300 ms | 2 at 50 ms and 100 ms | Open after 5 failures for 30 s; deny activation |
| Evidence registry | `VerifyBridgeEvidence { evidenceRefs, reviewedAt, requestedAgentVersion }` → `EvidenceDecision { complete, missingKeys, evidenceVersion, expiresAt }` | 500 ms | 2 at 75 ms and 150 ms | Open after 4 failures for 30 s; return `BRIDGE_DISABLED` |
| Agent signature registry | `VerifyAgent { publicKeyHash, agentVersion, signature }` → `AgentDecision { signed, supported, revoked }` | 400 ms | 2 at 75 ms and 150 ms | Open after 5 failures for 30 s; no grant |
| BE00 queue/grant | `DeviceGrant { deviceId, ownerPartyId, rootsHash, scopes, expiresAt }` → `GrantReceipt { grantId, epoch, expiresAt }` | 600 ms | 3 at 100 ms, 300 ms and 900 ms | Open after 5 failures for 30 s; queue remains disabled |
| BE00 outbox | `OutboxEnvelope { eventType, aggregateId, version, payloadHash }` → `EnqueueReceipt { eventId }` | 500 ms | 3 at 100 ms, 300 ms and 900 ms | Open after 5 failures for 30 s; no state seal without durable event |

### State machines and concurrency

- Device state is `disabled → pending_review → active → revoked`; v1 stops at disabled. Re-activation after revocation requires a new evidence version and expected device version.
- Ingest is `queued → settling → accepted | rejected | revoked`; accepted queue output still requires a separate 09c audio-version ingest command.
- Evidence is a four-part conjunctive gate. Any expiry, revocation, root mismatch, unsupported agent or legal validation gap returns disabled/denied and writes no active grant.
- Device activation uses serializable CAS on device version and unique owner/device-key hash. Duplicate idempotency returns the same safe status; concurrent owners cannot win over one owner boundary.
- Heartbeat is advisory and cannot renew a grant. Grant expiry/revocation is checked on dequeue and each future file operation; stale queue work is quarantined.
- `project.bridge.state-changed.v1` is at-least-once and deduplicated by device/version. Events never grant access by themselves.

### Failure recovery

| Failure | Durable result | Retry/recovery |
|---|---|---|
| v1 activation request | Safe `disabled` response; no active device grant | Re-submit only after architecture evidence and decision are locked |
| Missing evidence | `pending_review` or disabled checklist with missing keys | Owner supplies reviewed evidence; no feature-flag bypass |
| Root attestation mismatch | No grant; audit refusal | Re-attest exact allowed roots and rerun threat review |
| Agent signature/revocation failure | No active device state | Install supported signed agent and retry after registry recovery |
| Queue/storage outage | No dequeue/activation; queued item retained | Retry with same queue key after circuit closes |
| Device revocation | Grant epoch invalidated; in-flight ingest quarantined | Owner reactivates with new evidence/version; old queue never resumes |
| Unknown DAW/archive format | Bytes retained as unavailable label, never verified | Human/manual upload through 09c after supported metadata is supplied |
| Worker duplicate event | One state transition, duplicate ignored | Event dedupe by device/version |

## Event Schemas

### Payload contracts

| Event type | Required payload | Privacy and delivery |
|---|---|---|
| `project.bridge.state-changed.v1` | `eventId uuid`, `deviceId uuid`, `ownerPartyId uuid`, `agentVersion text`, `gateState`, `state`, `allowedRootsHash text`, `version bigint` | No root strings, file names, credentials, parser data or queue bytes; outbox dedupe |
| `project.song.changed.v1` | `eventId uuid`, `songId uuid`, `songVersion bigint`, `sourceHash text` | Consumed only; no title |
| `project.version.ingested.v1` | `eventId uuid`, `songId uuid`, `versionId uuid`, `checksum text`, `residency`, `integrity` | Future consumer only; no bytes or path |
| `project.access.changed.v1` | `eventId uuid`, `targetRefHash text`, `reasonCode`, `revocationEpoch bigint` | Consumed to revoke device grant; no role/identity detail |
| `project.session.closed.v1` | `eventId uuid`, `sessionId uuid`, `songRefs uuid[]`, `version bigint` | Future consumer only; no attendance or prompt payload |

## Error Handling

### Boundary mapping

| Condition | HTTP | `code` | Safe details |
|---|---:|---|---|
| Invalid key, version, root or evidence shape | 400 | `VALIDATION_FAILED` | Field path and evidence key |
| Hidden song | 404 | `RESOURCE_NOT_FOUND` | Empty details |
| Known song, non-owner actor | 403 | `FORBIDDEN` | Required owner action only |
| v1 or incomplete evidence gate | 409 | `BRIDGE_DISABLED` | Missing checklist keys and gate state, no paths |
| Expected device/evidence version moved | 409 | `VERSION_CONFLICT` | Safe committed version |
| Reused key with different body | 409 | `IDEMPOTENCY_MISMATCH` | Fingerprint hash only |
| Authority/evidence/queue registry unavailable | 503 | `DEPENDENCY_UNAVAILABLE` | Retry-after bucket |

### Operation error coverage

| Operation ID | 400 | 403 | 404 | 409 | 503 |
|---|---|---|---|---|---|
| `PRJ-20` | `VALIDATION_FAILED` | `FORBIDDEN` | `RESOURCE_NOT_FOUND` | `BRIDGE_DISABLED`, `VERSION_CONFLICT`, `IDEMPOTENCY_MISMATCH` | `DEPENDENCY_UNAVAILABLE` |

Every failure serializes `ApiError { code, message, requestId, details }`; logs never contain local path or agent secret.

## Observability

| Operation ID | Metrics | Structured logs | Trace and alerts |
|---|---|---|---|
| `PRJ-20` | activation attempts, gate completeness, disabled reasons, signature failures, revocation hits, queue state | song/device IDs, public-key hash, agent version, evidence keys, gate state, result | `prj.bridge.activation`; alert invalid-root attempts, repeated signature failures and any active v1 state |

provider-native diagnostic sinks receive request ID, operation ID, gate state and safe error code only. A production alert fires if any v1 device reaches `active`, if an outbox event contains a path-like value, or if a queue item bypasses an active grant epoch.

## Testing Strategy

### Contract and route tests

| Operation ID | Required tests |
|---|---|
| `PRJ-20` | Strict key/semver/root/evidence schema; owner 403 and hidden song 404; v1 always `BRIDGE_DISABLED`; all four evidence keys required; root traversal/symlink/wildcard rejection; signed-agent revocation; device CAS/idempotency; CORS and exact ApiError |

### Persistence, concurrency and recovery tests

- Migration tests assert every bridge field's SQL type, nullability, check, unique constraint, FK or opaque rationale, index, RLS predicate and grant. Client never reads key/grant hashes or queue locators.
- Property tests generate root attestations and prove canonicalization, least scope, no parent traversal, no credential path, and no active state while any evidence key is missing or expired.
- Race tests submit two owner/device activations, revocation during queue dequeue and duplicate outbox events; exactly one CAS transition wins and revoked work remains quarantined.
- Integration tests inject BE00/BE01/evidence/signature/queue timeouts, retry with bounded backoff and confirm circuit-open denial with no active grant.
- Negative tests assert bridge workers cannot mutate audio canonical, credit, rights, session attendance or source-declaration state; future accepted ingest must hand off through the 09c route.
- Playwright tests cover accessible disabled checklist, keyboard retry, safe required-action text and absence of local path/credential strings in DOM, logs and event payload fixtures.

## Deepening Passes

| Pass | Evidence and resolution |
|---|---|
| Boundary | PRJ-20, two models and three ledger features traced to IA lines 97, 204, 273–275; no active desktop surface |
| Gate | Four evidence requirements are conjunctive and exact; a feature flag cannot activate the bridge |
| Contract | Strict Zod 4 request/success/error schemas cover keys, agent, roots, evidence, scopes and gate result |
| Authorization | Owner-only predicate with hidden 404 versus known 403; device grant remains owner-scoped |
| Persistence | Both bridge tables list typed fields, constraints, indexes, FKs/opaque references, RLS and grants |
| Security | Least roots, signed agent, secret isolation, revocation epoch and queue quarantine are explicit |
| Concurrency | Device CAS, queue state machine, idempotency and event-version dedupe cover the one operation |
| Recovery | Missing evidence, root mismatch, registry outage, queue outage, revocation and unknown format converge safely |
| Privacy | Events/logs omit roots, file names, credentials, paths, bytes, titles and parser output |
| Accessibility | Disabled evidence checklist and denial action are keyboard/screen-reader specified |

## Ambiguity Gate

PASS. Evidence: `PRJ-20` has one authoritative route with CORS and exact `ApiError { code, message, requestId, details }`; v1 behavior is deterministically disabled; both parent bridge model identifiers have typed fields, constraints, indexes, RLS and grants; four evidence requirements and least-scope rules are explicit; activation cannot mutate project, audio, credit, rights or session truth; idempotency, CAS, rate, observability, errors, tests and recovery are keyed to the operation; table/link/marker checks are defined; and no new architecture choice was invented.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored typed DAW bridge evidence-gate backend companion with v1 denial boundary | `/write-be-spec` | All |
| 2026-08-28 | Locked strict contracts, device/queue persistence, least-root security, external seams and ambiguity evidence | `/write-be-spec-write` | API, contracts, database, security, tests |

## Dependency References

- [BE00 Cross-cutting platform foundation](00-infrastructure.md) — request context, errors, signed credentials, revocation, queue, audit and outbox.
- [IA Shard 01 Identity authority](../ia/01-identity-authority.md) — owner authority and device-party binding.
- [IA Shard 09 parent](../ia/09-projects-collaboration.md) — PRJ-20, bridge models, event and evidence source of truth.
- [IA Shard 09 deep dive](../ia/deep-dives/09-projects-collaboration.md) — four-part bridge evidence gate and abuse controls.
- [IA Shard 07 Credits core](../ia/07-credits-core.md) — downstream credit boundary; bridge cannot write credit truth.
