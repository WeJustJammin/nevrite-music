# Cross-cutting platform foundation — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]  
**Owner:** Platform foundation  
**API namespace:** `/api/v1`

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

- **Type:** Cross-cutting backend foundation.
- **Expected BE specifications:** 1.
- **Rationale:** One shared middleware, persistence, async-effect, upload, webhook, job, audit and observability contract must be consumed identically by every feature domain. Splitting it would duplicate ordering, idempotency and error rules.
- **Complexity gate:** The 416-line cross-cutting contract remains one file because every domain must inherit one atomic route/transaction/worker rule set; its endpoint, persistence and assurance sections are independently addressable and no subsection creates a separate domain owner.
- **Approval:** Recommended classification accepted under the owner's standing autonomy delegation.

## Referenced Material Inventory

| Material | Sections / lines | Backend use |
|---|---|---|
| [[specs/ia/00-infrastructure|IA Shard 00]] | Features/acceptance 32–55; interactions 56–81; contracts 82–165; data 166–244; access 245–272; events 283–320; edge/assurance 321–383 | Primary endpoint, schema, middleware, worker, error and test source |
| [[specs/2026-08-02-architecture-design|Architecture Design]] | API 359–449; runtime/data flow 450–575; errors 576–633; data/security 634–915; integration/observability 916–996 | Runtime, protocol, security, SLO and provider boundaries |
| [[specs/ENGINEERING-STANDARDS|Engineering Standards]] | API/DB/async 96–132; availability 133–139; security 149–184; migration/CI 185–207 | Performance, recovery, test and release gates |
| [[specs/data-placement-strategy|Data Placement Strategy]] | placement/security/PII 5–94; lifecycle/tenancy 95–149 | PostgreSQL, RLS, PII and consistency rules |
| [[specs/audits/2026-08-03-ia-ambiguity-rerun-1|IA Ambiguity Rerun 1]] | 7–134 | Confirms current IA completeness and testability |

## Endpoint Reconciliation

| IA flow | Backend surface | Disposition | Ownership note |
|---|---|---|---|
| INF-01 Public read | `GET /api/v1/status` plus shared public-read middleware | Authored | Foundation owns the truthful public runtime projection; Shard 05 owns maintenance/configuration mutations. |
| INF-02 Authenticated read | Shared authenticated-read middleware | Authored as inherited route contract | Domain shards own resource endpoints and MUST register against this middleware profile. |
| INF-03 Protected command | Shared protected-command transaction/RPC profile | Authored as inherited route contract | Domain shards own commands; foundation owns validation, idempotency, version, audit and outbox ordering. |
| INF-04 High-risk/admin command | Shared high-risk command profile | Authored as inherited route contract | Domain/admin shards own commands; foundation adds freshness, named capability and audited reason gates. |
| INF-05 Long-running job | `GET /api/v1/jobs/{jobId}`, `DELETE /api/v1/jobs/{jobId}` | Authored | Domain shards create typed jobs; foundation owns lifecycle/status/cancellation semantics. |
| INF-06 Object upload | `POST /api/v1/uploads/intents`, `POST /api/v1/uploads/{uploadId}/complete`, `DELETE /api/v1/uploads/{uploadId}` | Authored | Domain shards register allowed purposes/targets; foundation governs upload authorization and verification. |
| INF-07 Offline intent | `POST /api/v1/offline-intents/batches` | Authored | Envelope is foundation-owned; each operation is dispatched only to an allowlisted domain command. |
| INF-08 Realtime hint | Shared event-hint contract | Authored as async contract | Realtime never authorizes or confirms a transition. |
| INF-09 Inbound webhook | `POST /api/v1/webhooks/{provider}` | Authored | Each integration registers a provider signature/replay/parser profile. |
| INF-10 Provider effect | Shared `provider-operation` worker profile | Authored as worker contract | Domain adapters register operation types; success requires reconciliation evidence. |
| INF-11 Release promotion | CI/CD contract | Deferred from HTTP API by design | `/setup-workspace-cicd` implements artifact promotion; no runtime endpoint exists. |
| INF-12 Maintenance/recovery | `GET /health/live`, `GET /health/ready`, public status read | Authored | Shard 05 owns protected announcement mutation; setup/verification owns recovery execution. |

No IA backend surface remains implicit or unassigned.

## Normative Schema Grammar

Every request and response field token in every backend contract expands through this grammar before a Zod/OpenAPI schema is valid. Local endpoint constraints may narrow these rules but never widen them; an unresolvable token is a specification failure, not permission to use `any`, `unknown` or an unconstrained string.

| Token form | Exact Zod 4 / JSON contract | PostgreSQL form |
|---|---|---|
| `id`, `*Id`, `*Ids` | `z.uuid()`; plural is unique `z.array(z.uuid()).min(1).max(50)` unless a smaller local maximum is stated | `uuid`; plural relationships use child/junction rows, never CSV |
| `version`, `*Version` | `z.number().int().positive().max(Number.MAX_SAFE_INTEGER)` | positive `bigint` with optimistic compare |
| `*At`, `*DateTime` | `z.iso.datetime({ offset: true })`, normalized to UTC in responses | `timestamptz` |
| `*On`, `*Date` | `z.iso.date()` | `date` |
| `*Minor` | `z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)`; signed adjustments explicitly say so | `bigint` with local sign/check constraint |
| `currency` | `z.string().regex(/^[A-Z]{3}$/)` | `char(3)` with ISO allowlist FK/check |
| `country`, `territory` | ISO-3166-1 alpha-2 or an explicitly listed closed sentinel such as `WORLDWIDE` | `char(2)` or checked closed enum |
| `locale` | BCP-47, 2–35 characters | `text` with format check |
| `email` | normalized address, 3–254 characters; never a canonical identity key | `citext` only where lookup is required, otherwise encrypted/restricted text |
| `url`, `*Url` | absolute HTTPS URL, maximum 2,048 characters; first-party return paths use the stricter local relative-path rule | `text` with scheme/length check |
| `hash`, `digest`, `checksum`, `*Hash` | lowercase hexadecimal SHA-256, exactly 64 characters unless a named algorithm overrides | `char(64)` plus algorithm column when variable |
| `cursor` | opaque base64url string, 1–512 characters | never canonical state; signed/verified at edge |
| `code`, `type`, `state`, `status`, `kind`, `mode`, `role`, `scope` | exact closed enum values listed by the local contract or protected registry version; never free text | checked text/enum plus registry FK where configured |
| `reason`, `message`, `label`, `name`, other human text | NFC Unicode, no C0/C1 controls or bidi overrides; local bounds apply, otherwise 1–200 code points | bounded `text`; restricted class when content may contain PII |
| `enabled`, `active`, `confirmed`, other predicates | `z.boolean()` | `boolean not null` |
| arrays/sets without a local bound | unique array, 1–50 entries; each entry uses this grammar | child/junction table unless immutable bounded JSON is explicitly named |
| object token named by an IA contract | `z.strictObject` containing exactly that contract's named fields, recursively typed by this grammar | normalized columns/relations named by local persistence design |

Optionality is legal only when the endpoint writes `?`, `optional`, or `nullable`; omission and JSON `null` are distinct and `null` is rejected unless explicitly named. Requests are separate strict path, query, header and body objects. Success responses contain exactly the fields named in the endpoint response contract plus no implicit metadata. Every schema publishes one valid example and boundary/invalid examples in contract tests.

## Normative Persistence Grammar

Every table/record named by a backend `## Persistence` section expands deterministically under these rules. The local row supplies the domain columns and business constraints; this grammar supplies exact relational defaults. No implementation may add a convenience column, JSON blob or implicit relationship outside the local row and cited IA data model.

| Concern | Normative rule |
|---|---|
| Primary identity | Aggregate, event, artifact and projection tables use `id uuid primary key default gen_random_uuid()` unless the local contract names a composite natural key. Junction tables use the complete named FK tuple as primary key. |
| Types | Every named column uses `## Normative Schema Grammar`; plural relationships become child/junction rows. JSONB is permitted only where the local contract explicitly says immutable bounded snapshot/payload and names its strict schema/version. |
| Nullability/default | Every named column is `not null` with no semantic default unless the local contract writes optional/nullable/default. Server-generated ID/time/version fields are the only universal defaults. |
| Version/time | Mutable aggregates carry `version bigint not null check (version > 0)`, `created_at timestamptz not null`, `updated_at timestamptz not null`; append-only events carry `recorded_at` and immutable sequence/source key instead of `updated_at`. |
| State | A named state/status column is checked against the exact closed state machine in the local contract. Terminal/immutable rows reject update by grant/trigger, not application convention. |
| Foreign keys | Every `*Id` domain column is a real FK to the named aggregate/projection. Default delete is `restrict`; `cascade`, `set null` or deidentification is legal only when the local deletion rule states it. Cross-schema references remain schema-qualified. |
| Uniqueness | Every idempotency/source/business singleton named in endpoint invariants becomes a database unique constraint, including partial uniqueness for active/current rows. Application prechecks never replace it. |
| Query indexes | Every GET/list/filter/order path receives one matching B-tree index with tenant/owner discriminator first, equality filters next and stable cursor order `(created_at desc, id desc)` last; partial predicates match active/public/terminal filters exactly. Every FK used for lookup has an index. |
| Search/specialized indexes | Full-text, trigram, geospatial or vector indexes require the local query contract, bounded operator and privacy policy; otherwise they are absent. |
| RLS/grants | RLS is enabled and forced on protected tables. Policies compare server-resolved actor/party/purpose columns; browser roles receive no direct write grant where the spec names RPC/worker-only mutation. Service grants are operation-specific. |
| Audit/outbox | Protected mutation commits domain row, idempotency result, audit row and outbox row in one transaction; audit/outbox reference the aggregate ID/version and contain no restricted body. |

Migration validation must compile each endpoint query against the declared index, verify every FK/delete action and prove cross-tenant/BOLA denial. Missing local field, state, relationship or query information blocks the spec rather than weakening these rules.

## Global Transport Contracts

### Middleware Order

Every Hono route executes only the applicable entries in this fixed order:

1. trusted-proxy normalization and body-size admission;
2. request UUID creation/replacement and W3C trace extraction;
3. security headers, CORS allowlist and route-registry lookup;
4. content-type/raw-body handling;
5. Supabase session verification;
6. server-side acting-context resolution;
7. resource authorization and disclosure policy;
8. Zod syntactic and semantic validation;
9. idempotency reservation and optimistic version check;
10. domain transaction/use case;
11. response serialization, cache policy, rate metadata and observability close.

Webhook routes replace steps 5–9 with raw-byte signature, replay-window and receipt-deduplication checks. Health routes use an internal-network principal before dependency probes. No handler can reorder or bypass the registered profile.

### Common Headers and Shapes

```ts
const RequestId = z.uuid();
const IdempotencyKey = z.string().min(8).max(128).regex(/^[\x20-\x7E]+$/);
const VersionTag = z.string().regex(/^"[1-9][0-9]*"$/);
const Cursor = z.string().max(512);
const JsonValue = z.json();

const ApiError = z.strictObject({
  code: z.string().min(1).max(64).regex(/^[A-Z][A-Z0-9_]*$/),
  message: z.string().min(1).max(500),
  requestId: RequestId,
  details: z.record(z.string(), JsonValue),
});
```

- `ApiError` always has exactly four top-level fields. `details` has at most 16 keys, depth four and 8 KiB serialized.
- Valid `X-Request-Id` is preserved; invalid/missing input is replaced. Every response emits `X-Request-Id`.
- JSON requests require `Content-Type: application/json`; malformed JSON is `400`, unsupported media is `415`, semantic/schema failure is `422`.
- Authenticated, mutation, job, upload, webhook and health responses use `Cache-Control: no-store`. Only `/status` is publicly cacheable.
- Mutable protected commands require `If-Match`. Retryable creates/commands require `Idempotency-Key`; keys are hashed before persistence.
- Error messages and `details` never disclose existence-sensitive policy, raw provider errors, SQL, stack traces, object URLs, tokens, PII or request bodies.

### Shared Route Profiles

| Profile | Authentication / authorization | Concurrency and transaction | Required tests |
|---|---|---|---|
| `public-read` | Anonymous allowed; query only an allowlisted public projection. | ETag/publication version; no canonical mutation. | cache isolation, unpublished absence, query bounds, anonymous abuse limit |
| `authenticated-read` | Verified user plus current acting context; RLS and resource policy both pass. | Private/no-store; stable cursor binds actor/context/filter. | wrong user, wrong party, cursor replay/tamper, revoked mandate |
| `protected-command` | Verified user, current acting context, scoped capability and ownership predicate. | `If-Match` + idempotency; one RPC commits domain state, audit, idempotency outcome and outbox. | duplicate, payload mismatch, stale version, disconnect-after-commit, BOLA |
| `high-risk-command` | Protected command plus recent step-up, named internal capability and typed reason. | Same atomic guarantees; denied and completed decisions are audited. | stale MFA, label-only admin, missing reason, capability revocation |

## API Endpoints

### `GET /api/v1/status`

**Request:** no body. Optional `locale` query is a BCP-47 string of 2–35 characters; example `en-US`. Unknown query keys fail with `422 VALIDATION_FAILED`.

**Success `200`:**

```json
{"state":"operational","message":"All systems operational","activeMaintenance":null,"nextMaintenance":null,"updatedAt":"2026-08-03T05:00:00Z","version":42}
```

`state` is `operational|degraded|maintenance|major_outage`; maintenance objects contain `id: UUID`, `startsAt`, `endsAt`, `scope: string[1..200]`, and localized `message: string[1..500]`. The projection includes no provider names or internal topology. It returns `ETag: "<version>"`, `Cache-Control: public, max-age=30, stale-while-revalidate=60`, and honors `If-None-Match` with `304`.

**Errors:** `422 VALIDATION_FAILED`, `429 RATE_LIMITED`, `503 STATUS_UNAVAILABLE`, `500 INTERNAL_ERROR`; all use `ApiError` except bodyless `304`.

### `GET /api/v1/jobs/{jobId}`

**Request:** `jobId` path UUID, example `018f0c45-73fe-7dc2-9c09-68f7ecf132d4`; no body or query.

**Success `200`:** `JobStatus` with `id`, registered `type`, `state: queued|running|succeeded|failed|cancelled`, nullable bounded progress, nullable typed `resultRef`, nullable sanitized error, `cancelRequestedAt`, `createdAt`, `updatedAt`, and positive `version`. Returns `ETag`, private/no-store.

**Errors:** `401 UNAUTHENTICATED`, concealment-safe `404 JOB_NOT_FOUND`, `422 VALIDATION_FAILED`, `429 RATE_LIMITED`, `503 DEPENDENCY_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `DELETE /api/v1/jobs/{jobId}`

**Request:** UUID `jobId`; required `If-Match`; required `Idempotency-Key`; no body. Example headers: `If-Match: "3"`, `Idempotency-Key: cancel-export-018f0c45`.

**Success:** `200 JobStatus` when queued work becomes `cancelled`; `202 JobStatus` when a running cancellable job records a cancellation request. A terminal job returns its unchanged `200` result for the same key.

**Errors:** `401 UNAUTHENTICATED`, `404 JOB_NOT_FOUND`, `409 VERSION_CONFLICT|JOB_NOT_CANCELLABLE|IDEMPOTENCY_CONFLICT`, `422 VALIDATION_FAILED`, `428 PRECONDITION_REQUIRED`, `429 RATE_LIMITED`, `503 DEPENDENCY_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `POST /api/v1/uploads/intents`

**Request body:**

| Field | Type and constraint | Example | Error code |
|---|---|---|---|
| `purpose` | registered lower-kebab identifier, 1–64 | `project-stem` | `UPLOAD_PURPOSE_INVALID` |
| `targetType` | registered lower-kebab identifier, 1–64 | `project-artifact` | `UPLOAD_TARGET_INVALID` |
| `targetId` | UUID | `018f0c45-73fe-7dc2-9c09-68f7ecf132d4` | `UPLOAD_TARGET_INVALID` |
| `filename` | Unicode 1–255 after normalization; diagnostic only | `guitar.wav` | `FILENAME_INVALID` |
| `mediaType` | allowlisted MIME, 1–127 | `audio/wav` | `MEDIA_TYPE_NOT_ALLOWED` |
| `byteSize` | integer 1 through purpose maximum | `8388608` | `UPLOAD_SIZE_EXCEEDED` |
| `checksum` | lowercase SHA-256 hex, 64 chars | `a3` repeated 32 times | `CHECKSUM_INVALID` |

Requires `Idempotency-Key`. Server generates the bucket/key and ignores filename for path construction.

**Success `201`:** `{ uploadId, objectId, upload: { url, method, requiredHeaders }, expiresAt, maxBytes, allowedMediaTypes, state: "pending_upload" }`. URL expiry is at most 15 minutes; response is private/no-store and URL is forbidden from telemetry.

**Errors:** `401 UNAUTHENTICATED`, `403 UPLOAD_FORBIDDEN`, concealment-safe `404 UPLOAD_TARGET_NOT_FOUND`, `409 IDEMPOTENCY_CONFLICT|UPLOAD_QUOTA_CONFLICT`, `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `422` with field code above, `429 RATE_LIMITED`, `503 STORAGE_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `POST /api/v1/uploads/{uploadId}/complete`

**Request:** UUID `uploadId`; required `If-Match` and `Idempotency-Key`; body `{ byteSize: integer >=1, checksum: lowercase SHA-256 hex }`. Example `{ "byteSize": 8388608, "checksum": "a3...a3" }`.

**Success `202`:** `{ object: { id, state: "verifying", mediaType, byteSize, checksum, version }, verificationJob: JobStatus }`. The transaction moves `pending_upload → uploaded → verifying`, writes audit/outbox, and returns within the job-acceptance budget. Ready state only follows canonical Storage HEAD, checksum/type validation and required scanning.

**Errors:** `401 UNAUTHENTICATED`, concealment-safe `404 UPLOAD_NOT_FOUND`, `409 VERSION_CONFLICT|IDEMPOTENCY_CONFLICT|UPLOAD_STATE_CONFLICT|UPLOAD_EXPIRED`, `422 BYTE_SIZE_MISMATCH|CHECKSUM_MISMATCH|VALIDATION_FAILED`, `428 PRECONDITION_REQUIRED`, `429 RATE_LIMITED`, `502 STORAGE_RESPONSE_INVALID`, `503 STORAGE_UNAVAILABLE`, `504 STORAGE_DEADLINE_EXCEEDED`, `500 INTERNAL_ERROR`.

### `DELETE /api/v1/uploads/{uploadId}`

**Request:** UUID `uploadId`; required `If-Match` and `Idempotency-Key`; no body.

**Success `204`:** aborts/revokes only `pending_upload|uploaded|verifying`, schedules byte cleanup idempotently and returns no body. A ready object must use its owning domain's governed deletion command.

**Errors:** `401 UNAUTHENTICATED`, `404 UPLOAD_NOT_FOUND`, `409 VERSION_CONFLICT|IDEMPOTENCY_CONFLICT|UPLOAD_NOT_ABORTABLE`, `428 PRECONDITION_REQUIRED`, `429 RATE_LIMITED`, `503 DEPENDENCY_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `POST /api/v1/offline-intents/batches`

**Request:** required batch `Idempotency-Key`; body has `clientBatchId: UUID` and `intents: 1..50`. Each intent has `clientIntentId: UUID`, registered `operation: lower-kebab[1..64]`, `idempotencyKey: printable ASCII[8..128]`, optional positive `expectedVersion`, `createdAt: ISO timestamp not more than 30 days old or 5 minutes future`, and `payload: object <=32 KiB`. Entire decoded body is at most 256 KiB.

Example: `{ "clientBatchId":"018f...","intents":[{"clientIntentId":"0190...","operation":"project-note-create","idempotencyKey":"offline-0190","expectedVersion":4,"createdAt":"2026-08-03T05:00:00Z","payload":{"text":"Verse idea"}}] }`.

**Success `200`:** `{ batchId, results: [{ clientIntentId, operationId, state: "accepted"|"rejected", resourceRef, job, error }] }`. Each result contains exactly one of accepted resource/job data or a safe four-field-compatible item error. Items execute independently in input order; acceptance reuses the domain command's authorization/version/idempotency transaction. Batch retry returns identical operation IDs/results.

**Errors:** whole-request `401 UNAUTHENTICATED`, `409 IDEMPOTENCY_CONFLICT|BATCH_ID_CONFLICT`, `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `422 VALIDATION_FAILED`, `429 RATE_LIMITED`, `503 DEPENDENCY_UNAVAILABLE`, `500 INTERNAL_ERROR`. Item-level failures include `OFFLINE_OPERATION_UNKNOWN`, `OFFLINE_INTENT_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `VERSION_CONFLICT`, and the domain command's allowlisted safe codes.

### `POST /api/v1/webhooks/{provider}`

**Request:** `provider` must match a deployed webhook-profile registry entry. Body is raw bytes, 1 byte through provider maximum and never parsed before signature/time validation. Required signature/timestamp/event-ID headers are profile-defined with exact casing-insensitive names, algorithms, key rotation rules and replay window no greater than five minutes. Example provider path: `/api/v1/webhooks/stripe`; example event ID is provider-defined and 1–255 printable characters.

**Success `204`:** after signature validation and durable receipt insert, both new and duplicate valid events receive no body. The receipt records provider, external event ID, digest and verification time; accepted events write `webhook.accepted` to outbox. A duplicate never repeats work.

**Errors:** existence-safe `400 WEBHOOK_INVALID`, `401 WEBHOOK_UNAUTHENTICATED`, `413 PAYLOAD_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `429 RATE_LIMITED`, `503 WEBHOOK_PERSISTENCE_UNAVAILABLE`, `500 INTERNAL_ERROR`. Signature, unknown-provider and replay details are not returned. Invalid signatures create no trusted receipt or queue work.

### `GET /health/live`

**Request:** no body/query; internal Cloudflare health principal only. **Success `200`:** `{ "status":"live", "requestId":"<uuid>" }`. It proves the Worker event loop can answer and performs no database/provider call. Unauthorized external callers receive `404 NOT_FOUND`. Unexpected failure is `500 INTERNAL_ERROR`.

### `GET /health/ready`

**Request:** no body/query; internal Cloudflare health principal only. **Success `200`:** `{ "status":"ready", "requestId":"<uuid>" }`. It checks configuration validity, migration compatibility, bounded canonical database read and required protected-write safety flags; it does not call optional external providers. Not ready returns `503 DEPENDENCY_UNAVAILABLE` with only a safe `reasonCode` allowlist in `details`. Unauthorized external callers receive `404 NOT_FOUND`.

## Endpoint Policy Matrix

| Endpoint | Profile / cache | Idempotency / concurrency | Rate limit | Service tier |
|---|---|---|---|---|
| `GET /status` | public-read / 30s public | ETag only | 120/min/IP, burst 30/10s | Tier 1 bounded read `<750ms` |
| `GET /jobs/:id` | authenticated-read / no-store | ETag only | 300/min/user, 600/min/party | Tier 1 |
| `DELETE /jobs/:id` | protected-command / no-store | key + `If-Match` | 60/min/user, 120/min/party | Tier 2 protected command `<1,200ms` |
| `POST /uploads/intents` | protected-command / no-store | key; create-only | 20/hour/user, three concurrent | job acceptance `<500ms` |
| `POST /uploads/:id/complete` | protected-command / no-store | key + `If-Match` | 20/hour/user | job acceptance `<500ms` |
| `DELETE /uploads/:id` | protected-command / no-store | key + `If-Match` | 60/min/user | Tier 2 |
| `POST /offline-intents/batches` | protected-command / no-store | batch and item keys + item version | 12/min/user; 50 items/batch | Tier 2 acceptance |
| `POST /webhooks/:provider` | webhook / no-store | provider event dedupe | 300/min/provider endpoint | acknowledgment p95 `<=1,000ms`, p99 `<2,000ms` |
| `/health/live`, `/health/ready` | internal-health / no-store | not applicable; read-only | 120/min/principal, burst 30/10s | Tier 0 `<500ms` |

Every `429` includes `Retry-After` and `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`. Limits are protected configuration records bounded by non-weakening security minima.

## Authorization Matrix

| Endpoint | Anonymous | Authenticated owner / acting party | Internal operator/service | Queue/provider | Existence policy |
|---|---|---|---|---|---|
| `GET /status` | Allow | Allow | Allow | Deny | Public projection only |
| `GET /jobs/:id` | Deny 401 | Allow only initiating actor or current delegated party capability | Allow named operations capability | Deny | Wrong user/party/resource collapses to 404 |
| `DELETE /jobs/:id` | Deny 401 | Same ownership plus job-type cancellation capability | Named operations capability; no blanket bypass | Deny | Wrong scope collapses to 404 |
| Upload routes | Deny 401 | Allow when target policy and owner/party capability both pass | Purpose-scoped support capability only | Deny | Wrong target/upload collapses to 404 |
| Offline batch | Deny 401 | Envelope allowed; every item reauthorizes against current acting context | No generic bypass | Deny | Item follows owning domain disclosure policy |
| Webhook | No user auth | Deny | Deny except isolated replay tooling outside this route | Only matching verified provider profile | Unknown/invalid profiles return generic webhook failure |
| Health routes | External callers receive 404 | External callers receive 404 | Allow internal health principal only | Deny | Route hidden from public topology |

Client-supplied user, party, capability, role, owner or service identifiers never establish authority. Every protected route tests wrong-valid-user, wrong-party and wrong-resource cases. RLS is defense in depth, not the only authorization layer.

## Validation and Error Contract

### Cross-Endpoint Validation Matrix

| Input | Constraint | Failure status/code |
|---|---|---|
| UUID path/body fields | RFC 4122 UUID string | `422 VALIDATION_FAILED` |
| unknown body/query key | strict-object rejection | `422 VALIDATION_FAILED` |
| `Idempotency-Key` | required where declared; printable ASCII 8–128 | `428 PRECONDITION_REQUIRED` if absent; otherwise `422 VALIDATION_FAILED` |
| `If-Match` | exact quoted positive bigint | `428 PRECONDITION_REQUIRED` if absent; `422 VALIDATION_FAILED` if malformed |
| content type | exact supported media class | `415 UNSUPPORTED_MEDIA_TYPE` |
| JSON syntax | valid UTF-8 JSON within route byte cap | `400 INVALID_REQUEST` or `413 PAYLOAD_TOO_LARGE` |
| timestamp | valid ISO instant and route-specific window | `422 VALIDATION_FAILED` or named expiry code |
| enum/registry value | exact active registry member | `422` with field-specific named code |
| checksum | lowercase 64-character SHA-256 hex | `422 CHECKSUM_INVALID` |
| byte count | safe positive integer and purpose quota | `422 UPLOAD_SIZE_EXCEEDED`; transport body overflow is `413` |

### Error Matrix

| Status | Allowed infrastructure codes | Safe `details` keys |
|---:|---|---|
| 400 | `INVALID_REQUEST`, `WEBHOOK_INVALID` | `reason`, `documentationUri` |
| 401 | `UNAUTHENTICATED`, `WEBHOOK_UNAUTHENTICATED` | `reauthenticate`, `stepUpMethod` |
| 403 | `FORBIDDEN`, `UPLOAD_FORBIDDEN`, `STEP_UP_REQUIRED` | `reasonCode`, `recoveryAction` |
| 404 | `NOT_FOUND`, `JOB_NOT_FOUND`, `UPLOAD_NOT_FOUND`, `UPLOAD_TARGET_NOT_FOUND` | `{}` |
| 409 | `CONFLICT`, `VERSION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `JOB_NOT_CANCELLABLE`, `UPLOAD_STATE_CONFLICT`, `UPLOAD_EXPIRED`, `UPLOAD_NOT_ABORTABLE`, `UPLOAD_QUOTA_CONFLICT`, `BATCH_ID_CONFLICT` | `expectedVersion`, `currentVersion`, `state`, `recoveryAction` |
| 413 | `PAYLOAD_TOO_LARGE` | `maxBytes` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | `allowedMediaTypes` |
| 422 | `VALIDATION_FAILED` and endpoint field codes | `field`, `path`, `reason`, `allowedValues` |
| 428 | `PRECONDITION_REQUIRED` | `requiredHeader` |
| 429 | `RATE_LIMITED` | `retryAfterSeconds`, `limitClass` |
| 500 | `INTERNAL_ERROR` | `{}` |
| 502 | `STORAGE_RESPONSE_INVALID` | `retryable` |
| 503 | `DEPENDENCY_UNAVAILABLE`, `STATUS_UNAVAILABLE`, `STORAGE_UNAVAILABLE`, `WEBHOOK_PERSISTENCE_UNAVAILABLE` | `retryable`, `retryAfterSeconds`, `reasonCode` |
| 504 | `STORAGE_DEADLINE_EXCEEDED` | `retryable`, `retryAfterSeconds` |

Unknown errors become `500 INTERNAL_ERROR`. A failure is logged once at its owning boundary; upstream layers attach trace context without log-and-rethrow duplication.

## Persistence Design

### Tables and Indexes

| Table | Required keys / constraints | Required indexes and retention |
|---|---|---|
| `platform.idempotency_keys` | unique `(actor_id, operation, key_hash)`; immutable request hash; state `reserved|completed|failed_retryable`; expiry after creation | unique binding; `(expires_at)` cleanup; ordinary retention 30 days |
| `platform.outbox_events` | immutable event/aggregate/schema/version/correlation/payload; dispatched timestamp nullable | `(dispatched_at, occurred_at)` partial undispatched; `(aggregate_type, aggregate_id, aggregate_version)` |
| `platform.jobs` | actor/party/type/state/version; progress shape; immutable terminal result | owner+updated, party+updated, state+lease partial; terminal retained by owning domain policy |
| `platform.job_attempts` | job FK, positive attempt, lease/started/finished/outcome/error | unique `(job_id, attempt)`; active lease partial; append-only |
| `platform.upload_intents` | one object FK; actor; policy snapshot; expiry <=15 minutes; state/version | actor+created, object unique, expiry cleanup |
| `platform.objects` | unique bucket/key; owner party; purpose/type/size/checksum/state/version/retention | owner+state, purpose+target, checksum diagnostic; retention/hold prevents unsafe purge |
| `platform.webhook_receipts` | unique provider/external event; immutable digest/signature time; state | unique dedupe; state+received; provider retention policy |
| `platform.provider_operations` | immutable intent hash; provider ref nullable; compare-and-swap version | actor+created, provider+ref partial, pending+last-attempt |
| `platform.provider_attempts` | operation FK, attempt, request digest, outcome, retryability/timing | unique `(operation_id, attempt)`; append-only |
| `platform.offline_batches` | unique actor/client batch; request hash; response reference | actor+created; 30-day idempotency retention |
| `platform.offline_intents` | batch FK; unique actor/client intent; operation/expected version/state/result | unique actor+client intent; batch+ordinal; state+updated |
| `audit.events` | append-only action/actor/party/target/decision/reason/correlation/time | target+time, actor+time, correlation; domain retention/legal hold |

All identifiers are UUID, timestamps are UTC `timestamptz`, versions are positive `bigint`, hashes are fixed-length bytes, enums are closed database types, and authorization-sensitive tables enable deny-by-default RLS.

### RLS and Grants

- Users can select only their own eligible job/upload/offline projections and acting-party rows currently permitted by a server-resolved mandate. They cannot directly insert/update/delete infrastructure tables.
- `anon` can select only the dedicated `public.status_projection` view; it receives no base-table grants.
- Webhook ingress receives execute on one receipt RPC per registered provider profile, never table access.
- Queue consumers receive execute only on named lease/complete/fail/reconcile functions and re-read canonical state after lease acquisition.
- `audit.events`, `outbox_events`, attempt tables and completed idempotency rows revoke update/delete from application roles.
- Service-role access is isolated to named server modules, logged and tested; browser bundles/config never contain its credential.

### Transaction Functions

| Function | Security / atomic guarantee |
|---|---|
| `platform.reserve_idempotency(...)` | security invoker; reserve or return matching stored outcome; payload mismatch conflicts |
| `platform.cancel_job(...)` | security invoker; checks owner/capability/version/state; writes audit/outbox/idempotency atomically |
| `platform.create_upload_intent(...)` | security invoker; checks target/purpose/quota and inserts object+intent+audit atomically |
| `platform.complete_upload(...)` | security invoker; checks version/expiry/metadata and inserts verification job+outbox atomically |
| `platform.abort_upload(...)` | security invoker; state/version check and cleanup event atomically |
| `platform.accept_offline_batch(...)` | security invoker; reserves stable batch/items and dispatches allowlisted domain RPCs per item |
| `platform.accept_webhook_receipt(...)` | security definer only if provider ingress cannot use invoker; empty `search_path`, schema-qualified objects, revoked public execute and profile-specific grant |
| `platform.lease_job(...)`, `complete_job(...)`, `fail_job(...)` | named consumer grants; compare-and-swap lease/version; terminal rows immutable |
| `platform.dispatch_outbox(...)` | named dispatcher grant; marks dispatched only after Queue acceptance; redelivery remains safe |

Every security-definer function has dedicated wrong-role, search-path injection and BOLA tests. Generated Supabase types are migration artifacts; Zod API contracts remain independent.

## Async and Integration Contracts

### State Machine Registry

| Entity | Initial / valid transitions | Trigger and blocked behavior |
|---|---|---|
| Idempotency reservation | `reserved → completed|failed_retryable`; `failed_retryable → reserved` only for the same actor/operation/key/request hash | Reservation precedes domain work; completed replays exactly, mismatched hash conflicts, and terminal result cannot be overwritten. |
| Job | `queued → running → succeeded|failed`; `queued → cancelled`; running may record `cancelRequestedAt` then become `cancelled|succeeded|failed` | Lease starts running; worker commits terminal result. Terminal jobs reject lease/result/cancel mutation. |
| Upload/object | `pending_upload → uploaded → verifying → ready|rejected|quarantined`; `pending_upload|uploaded|verifying → aborted` | Completion requires provider-confirmed bytes; verifier chooses terminal evidence state. Ready rejects generic abort; terminal evidence states reject verification replay. |
| Webhook receipt | `accepted → dispatched|dead_letter`; duplicate delivery remains in the existing state | Signature/replay validation creates receipt; outbox processing advances it. Invalid input creates no receipt; terminal receipt cannot dispatch twice. |
| Provider operation | `pending → executing → succeeded|failed_terminal`; ambiguous send returns `executing → pending` with reconciliation marker | Lease triggers execution; verified evidence completes. Open circuit/unknown outcome blocks success and blind resend. |
| Offline batch item | `received → accepted|rejected`; accepted may reference a domain job without mirroring its state | Current authorization/domain command decides once. Terminal item result replays and cannot be reclassified later. |

Every unlisted source/target pair returns the typed state-conflict code and leaves canonical state unchanged.

| Consumer | Input envelope | Canonical read / effect | Retry and terminal policy |
|---|---|---|---|
| `outbox-dispatcher` | undispatched event ID/version | read immutable outbox, send minimal Queue envelope, mark accepted | exponential bounded retry; alert on age; no event deletion |
| `job-runner:<type>` | `job.requested {jobId, jobType}` | lease current job/version, execute registered handler, write attempt/result | type-specific max attempts; dead-letter + visible failed state |
| `object-verifier` | `object.uploaded {objectId}` | Storage HEAD/checksum/type/scan; transition verifying to ready/rejected/quarantined | transient Storage retry; mismatch terminal; cleanup separately idempotent |
| `webhook-processor:<provider>` | `webhook.accepted {receiptId}` | parse validated receipt through provider schema, reauthorize matching operation, apply once | schema unknown dead-letters; business refusal records processed/no effect |
| `provider-operation:<provider>` | `provider.operation.requested {operationId}` | lease pending intent, send minimum payload, record attempt, reconcile webhook/poll | timeout-after-send remains pending; no blind resend; circuit 5 failures/60s |
| `upload-cleaner` | object/upload cleanup event | verify current state/hold/references, remove bytes, evidence completion | retry bounded; hold/reference conflict surfaces manual review |

Queue envelopes contain IDs, event type/version and correlation metadata only. Consumers validate schema, acquire an idempotent lease, re-read canonical state and ignore stale/out-of-order versions. Realtime publishes only `{ entityType, entityId, version, eventHint }` after authorization-safe projection changes.

## Observability Contract

| Endpoint/consumer | Required log event | Metrics | Audit / spans |
|---|---|---|---|
| `/status` | `status.read.completed` sampled 1% successes | duration/error/cache/state | route span; no business audit |
| Job read/cancel | `job.read.completed`, `job.cancel.decided` | duration/state/conflict/cancel outcome | cancel allowed/denied audit; RPC and outbox spans |
| Upload routes | `upload.intent.decided`, `upload.completion.accepted`, `upload.abort.decided` | bytes/type/quota/state/verification lag | protected transition audit; Storage/RPC/Queue spans |
| Offline batch | `offline.batch.completed` | items/accepted/rejected/duration/code | per accepted domain command audit; item spans linked to batch |
| Webhook | `webhook.receipt.decided` | ack latency/signature class/duplicate/rate/error | receipt evidence; raw payload absent; ingress/RPC/Queue spans |
| Health | `health.check.completed` only on state change/error | readiness/liveness/error/duration | no business audit; dependency probe span |
| Consumers | `<consumer>.attempt.completed` | queue age/attempt/dead-letter/duration/dependency | immutable attempt evidence where applicable; linked trace |

Logs use `@wejammin/observability` typed NDJSON only. Required safe context includes environment, release, route/consumer, operation, request/correlation/causation/trace IDs, job/attempt, actor/context class, entity type/version, outcome, code, duration, dependency and retryability. Direct PII, IDs without approved hashing, headers, tokens, bodies, URLs, media, messages, evidence and provider payloads are forbidden. Errors and high-risk operations sample at 100%; authenticated successes 10%; public successes 1%.

Every route and consumer registers owner, auth/cache/rate/timeout class, criticality, SLO tier, measurement label, alert route, contracts, BOLA declaration and runbook. CI fails missing, duplicate or stale registrations.

## Failure Cascades and Partial-State Hygiene

| Failure point | Required outcome |
|---|---|
| DB rejects before commit | No canonical state, audit, outbox or idempotent success; safe typed error returned. |
| DB commits, response disconnects | Same idempotency binding returns committed resource/job; no duplicate effect. |
| Queue unavailable after domain commit | Outbox remains undispatched; dispatcher retries; canonical mutation is not rolled back. |
| Worker lease expires | Later attempt leases current version; prior attempt cannot complete stale lease. |
| Storage signed URL expires | Intent/object remain unusable; client requests a new authorized intent. |
| Bytes exist but metadata/checksum fails | Object becomes rejected/quarantined; never delivered; cleanup respects retention/hold. |
| Provider times out after send | Operation remains pending and reconciles before any resend. |
| Valid duplicate webhook | Durable duplicate evidence, `204`, no repeated business effect. |
| Database/PITR safety flag fails | Readiness fails and protected money/rights/publication writes stay disabled. |
| Status projection unavailable | `/status` returns typed 503; health remains topology-private; last-known public page may show stale labelled data. |

## Contract Test Plan

1. Generate OpenAPI and runtime schemas from the same Zod registry; snapshot every request, success and declared error body.
2. Parameterize all field constraints at boundary values and assert exact HTTP status/code/details allowlist.
3. For every protected endpoint assert anonymous, wrong valid user, wrong party, wrong resource, revoked mandate and valid owner/operator outcomes.
4. Replay every retryable command with same key/same payload and same key/different payload; simulate disconnect after commit.
5. Race versioned job/upload transitions and prove one winner, typed conflict and no duplicate audit/outbox/effect.
6. Replay duplicate/out-of-order Queue and webhook deliveries; kill workers during leases; verify terminal immutability and dead-letter visibility.
7. Verify raw webhook bytes are used for signature, replay windows reject stale timestamps, invalid signatures create no trusted work, and responses disclose no oracle detail.
8. Verify upload path normalization, quota/type/checksum enforcement, 15-minute expiry, 30-second client inactivity behavior contract and ready-only consumption.
9. Inspect logs/Sentry fixtures for forbidden fields and newline/reserved-field injection; assert one owning-boundary error event.
10. Migration tests create indexes, enable RLS, prove grants, run security-definer abuse tests, and regenerate/diff Supabase types.
11. Load tests enforce route SLOs, webhook acknowledgment, job acceptance, rate headers and 99.9% monthly availability measurement excluding only announced maintenance.
12. CI registry tests fail unregistered routes/consumers, missing BOLA declarations, unknown event versions, unbounded retries and missing runbooks.

## IA Traceability

| IA requirement | Backend contract |
|---|---|
| INF-01–04 | Shared profiles, middleware ordering, authorization, errors, idempotency, RPC atomicity |
| INF-05 | Job endpoints, jobs/attempts tables, leasing consumers and cancellation |
| INF-06 | Upload endpoints, object/intent records, Storage verification and cleanup |
| INF-07 | Offline batch envelope, stable item identities and domain-command redispatch |
| INF-08 | Minimal Realtime hint and canonical refetch requirement |
| INF-09 | Raw-body webhook ingress, receipt dedupe and asynchronous processing |
| INF-10 | Provider intent/attempt/reconciliation worker and ambiguous pending state |
| INF-11 | Explicit CI/CD boundary and route/consumer registry gates |
| INF-12 | Internal health, public status projection, protected-write safety and recovery boundary |

## Deepening Passes

| Pass | Result |
|---|---|
| 1 — Cross-endpoint consistency | One envelope, header, cache, version, idempotency and route registry contract applied. |
| 2 — Sequencing/concurrency | Transaction order, races, disconnect recovery, leases and terminal immutability specified. |
| 3 — Failure cascades | DB, Queue, Storage, provider, projection and recovery partial states resolved. |
| 4 — Authorization | Every endpoint has principals, ownership predicate and 403/404 disclosure behavior. |
| 5 — Observability | Logs, metrics, audit and spans specified per endpoint/consumer. |
| 6 — Abuse controls | Per-route sustained/burst limits, body/item caps, enumeration and mass-assignment controls specified. |
| 7 — Partial-state hygiene | Rollback, queue, compensate, quarantine, reconcile and surface rules specified per dependency. |

Passes 1–7 converge without a new domain split. Conditional passes 8–10 are not required.

## Ambiguity Gate

- **Micro:** Every route has request fields/constraints/example, success contract, errors, authorization, idempotency/concurrency, limits and observability.
- **Macro:** Public status versus Shard 05 mutation, domain command ownership, provider adapters, setup/recovery and Realtime authority boundaries are explicit.
- **Two-implementer test:** Independent implementations share route names, schemas, middleware order, status/error codes, transaction functions, RLS/grants, worker semantics and tests.
- **Devil's advocate:** Duplicate delivery, stale authority/version, forged context, payload mismatch, disconnect-after-commit, timeout-after-send, orphan bytes, missing PITR and hidden topology are fail-safe.
- **Open product decisions:** None. Provider-specific signature/header profiles remain integration-local implementation contracts, not unresolved architecture.

## Quality Checklist

- [x] Endpoint reconciliation complete; no silent deferrals.
- [x] Every endpoint passes the request/success/error/validation/auth/idempotency/rate/observability hard gate.
- [x] Database tables, indexes, RLS, grants, functions, retention and state transitions are explicit.
- [x] Deepening passes 1–7 completed and converged.
- [x] IA and cross-shard boundaries are traceable.
- [x] Spec graph compile and scoped lint pass.
- [x] BE index and pipeline tracker updated.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-03 | Classification approved and source inventory captured | `/write-be-spec-classify` | Classification, inventory |
| 2026-08-03 | Full foundation backend contract authored | `/write-be-spec-write` | All endpoint, persistence, async, security, assurance and traceability sections |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ENGINEERING-STANDARDS|WeJammin — Engineering Standards]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/audits/2026-08-03-ia-ambiguity-rerun-1|IA Ambiguity Audit — Fresh Rerun 1]]
