# Shard 00 — Cross-cutting platform foundation

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Document Type**: Cross-cutting
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 00 defines the mandatory platform contracts every product shard inherits. It covers the responsive web/PWA request path from Cloudflare through Hono and Supabase, plus deployment, asynchronous work, external-provider effects, observability, and recovery. It owns no consumer-domain behavior and introduces no independently marketable feature.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source features loaded | 6 |
| Features specified | 6 |
| Added product features | 0 |
| Removed or deferred features | 0 |
| Boundary | Architecture-wide infrastructure only |
| Split required | No; six cohesive cross-cutting areas |

### Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Request, persistence, async, provider, release, recovery, and accessibility rules use one ordering and authority model. |
| What-if expansion | Disconnects, stale versions, retries, missed hints, partial uploads, failed migrations, outages, and restore failures have deterministic outcomes. |
| Adversarial/abuse paths | BOLA, forged acting context, webhook replay, event downgrade, object-key abuse, log injection, and secret/PII leakage fail closed. |
| Convergence | No new feature, entity, interaction, or unresolved implementation choice emerged after the final pass. |

## Features

- **Runtime and immutable deployment** — Cloudflare Pages/CDN hosts Astro/static delivery; Cloudflare Workers hosts SSR, Hono, Queues, and schedules; one immutable artifact is promoted preview → staging → production.
- **Identity and security boundaries** — Supabase Auth verifies identity; the server resolves acting context and enforces capabilities, mandates, visibility, step-up, and abuse controls.
- **API and error contracts** — REST under `/api/v1`, Zod 4 validation, OpenAPI contracts, cursor pagination, idempotency, optimistic concurrency, rate metadata, and one global error shape.
- **Data, storage and migration foundation** — Supabase PostgreSQL is canonical; RLS and reviewed RPCs enforce invariants; Storage bytes are governed by database metadata; Realtime is a refetch hint; migrations are forward-only.
- **Async and provider effects** — Transactions atomically commit state, audit, idempotency, and outbox records; Queues are disposable at-least-once delivery; provider effects use local intent and reconciliation.
- **Observability and release assurance** — Structured logs, traces, Sentry, SLO registration, CI gates, protected releases, runbooks, PITR, restore drills, and infrastructure verification make operations measurable.

## Acceptance Criteria

- **AC-INF-01 — Public read:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Cloudflare serves safe cached static/public content or forwards to Hono; Zod validates inputs; the handler reads only public projections, and (6) return Response uses the versioned contract; only explicitly safe responses are cacheable; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-02 — Authenticated read:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Server verifies the Supabase session, resolves the current actor and acting party, authorizes, then reads under RLS, and (6) return Private response is `no-store`; request and trace identifiers are emitted; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-03 — Protected command:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Boundary validation precedes authorization; the command verifies version and idempotency, then atomically writes canonical state, audit, and outbox, and (6) return Commit returns the authoritative resource/version or an existing idempotent result; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-04 — High-risk/admin command:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) INF-03 plus recent step-up authentication and an explicit internal capability; user-facing role labels never grant authority alone, and (6) return Decision and reason are audited without storing protected request content; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-05 — Long-running job:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) A bounded command commits a job and outbox event, returning its status resource within 2 seconds; workers lease and retry from canonical state, and (6) return Client polls or refetches after a Realtime hint until terminal state; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-06 — Object upload:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Server authorizes the target and creates database metadata plus a 15-minute signed upload; client uploads directly and reports completion for verification, and (6) return Object becomes usable only after size/type/checksum/state validation; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-07 — Offline intent:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Client stores a temporary local intent; on reconnect the server assigns an operation UUID, revalidates identity, authority, version, and request content, and (6) return Accepted intent follows INF-03/05; stale or unauthorized intent remains visible and retryable; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-08 — Realtime hint:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Realtime carries only an entity/event hint; client treats it as non-authoritative and refetches the canonical resource, and (6) return UI updates only from authorized canonical data; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-09 — Inbound webhook:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Raw bytes are signature-checked within the provider replay window before parsing; receipt identity is deduplicated and acknowledged quickly, and (6) return Acknowledgment p95 ≤1,000ms and p99 <2,000ms; durable processing continues asynchronously; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-10 — Provider effect:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Local intent and idempotency are committed before the network call; a worker sends the minimum contract and records attempt evidence, and (6) return Success comes from verified webhook/poll reconciliation; ambiguity remains `pending`; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-11 — Release promotion:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) CI validates contracts, tests, security, accessibility, build, migrations, route/consumer SLO registration, and artifact identity, and (6) return Protected approval promotes the same artifact; rollback restores artifact/config, never erases committed business effects; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-INF-12 — Maintenance/recovery:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Operator announces scheduled maintenance ≥48 hours ahead, exposes truthful status, follows the runbook, and validates restore integrity/RLS/RPCs, and (6) return Service resumes only after checks pass; protected writes remain disabled when required PITR is unavailable; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Flow | Required behavior | Completion |
|---|---|---|---|
| INF-01 | Public read | Cloudflare serves safe cached static/public content or forwards to Hono; Zod validates inputs; the handler reads only public projections. | Response uses the versioned contract; only explicitly safe responses are cacheable. |
| INF-02 | Authenticated read | Server verifies the Supabase session, resolves the current actor and acting party, authorizes, then reads under RLS. | Private response is `no-store`; request and trace identifiers are emitted. |
| INF-03 | Protected command | Boundary validation precedes authorization; the command verifies version and idempotency, then atomically writes canonical state, audit, and outbox. | Commit returns the authoritative resource/version or an existing idempotent result. |
| INF-04 | High-risk/admin command | INF-03 plus recent step-up authentication and an explicit internal capability; user-facing role labels never grant authority alone. | Decision and reason are audited without storing protected request content. |
| INF-05 | Long-running job | A bounded command commits a job and outbox event, returning its status resource within 2 seconds; workers lease and retry from canonical state. | Client polls or refetches after a Realtime hint until terminal state. |
| INF-06 | Object upload | Server authorizes the target and creates database metadata plus a 15-minute signed upload; client uploads directly and reports completion for verification. | Object becomes usable only after size/type/checksum/state validation. |
| INF-07 | Offline intent | Client stores a temporary local intent; on reconnect the server assigns an operation UUID, revalidates identity, authority, version, and request content. | Accepted intent follows INF-03/05; stale or unauthorized intent remains visible and retryable. |
| INF-08 | Realtime hint | Realtime carries only an entity/event hint; client treats it as non-authoritative and refetches the canonical resource. | UI updates only from authorized canonical data. |
| INF-09 | Inbound webhook | Raw bytes are signature-checked within the provider replay window before parsing; receipt identity is deduplicated and acknowledged quickly. | Acknowledgment p95 ≤1,000ms and p99 <2,000ms; durable processing continues asynchronously. |
| INF-10 | Provider effect | Local intent and idempotency are committed before the network call; a worker sends the minimum contract and records attempt evidence. | Success comes from verified webhook/poll reconciliation; ambiguity remains `pending`. |
| INF-11 | Release promotion | CI validates contracts, tests, security, accessibility, build, migrations, route/consumer SLO registration, and artifact identity. | Protected approval promotes the same artifact; rollback restores artifact/config, never erases committed business effects. |
| INF-12 | Maintenance/recovery | Operator announces scheduled maintenance ≥48 hours ahead, exposes truthful status, follows the runbook, and validates restore integrity/RLS/RPCs. | Service resumes only after checks pass; protected writes remain disabled when required PITR is unavailable. |

### Interaction State Rules

- Every trusted transition is `validate → authenticate → resolve acting context → authorize → enforce concurrency/idempotency → commit → emit`.
- Authentication, acting-context resolution, authorization, semantic validation, and persistence are distinct decisions with distinct error codes.
- Ordinary reads have an 8-second client/application deadline; bounded protected commands have 15 seconds.
- Work that cannot finish within the command deadline must commit and return a job/status resource within 2 seconds.
- Normal first-party interactive web requests target p95 <2,000ms; API job acceptance targets p95 ≤500ms and p99 ≤1,000ms.
- A browser upload aborts only after exactly 30 seconds without a transferred byte; progress resets the inactivity timer.

## Contracts

### Request Context

| Field | Type | Rule |
|---|---|---|
| `requestId` | UUID | Generated/validated at ingress; returned on every API error. |
| `correlationId` | UUID | Groups one user/business operation across retries and async work. |
| `causationId` | UUID/null | Identifies the immediate triggering request/event. |
| `traceId` | string | Propagates browser → Astro → Hono → Supabase → outbox → Queue → provider. |
| `userId` | UUID/null | Verified Supabase Auth subject; never accepted from request data. |
| `actingPartyId` | UUID/null | Resolved server-side from eligible memberships/mandates. |
| `capabilities` | readonly string[] | Server-derived and resource-scoped; never trusted from JWT user metadata. |
| `clientVersion` | string/null | Optional diagnostic value; cannot weaken server policy. |

### HTTP Shapes

```ts
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ApiError = {
  code: string;
  message: string;
  requestId: string;
  details: Readonly<Record<string, JsonValue>>;
};

type CursorPage<T> = {
  items: readonly T[];
  nextCursor: string | null;
  hasMore: boolean;
};
```

- Successful responses have no universal wrapper: single-resource endpoints return the endpoint's Zod resource, collections return `CursorPage<T>`, commands return the authoritative resource or `JobStatus`, and empty success returns 204.
- Errors have exactly the four top-level fields above. Validation details, retry data, conflict versions, and field paths belong in `details`.
- `cursor` is opaque and at most 512 characters. `limit` is an integer from 1–50 and defaults to 25.
- Semantic validation failures return 422. Stale version, state-transition, and idempotency-content conflicts return 409.
- Rate-limited responses expose `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After`.
- Public caching is allowlist-only. Authenticated, administrative, preview, and unspecified responses use `Cache-Control: no-store`.

### Transport Headers and Base Errors

| Contract | Exact rule |
|---|---|
| Authentication | Browser session is verified server-side from Supabase Auth cookies/tokens; APIs never accept a user ID as authentication. |
| Request tracing | Accept a valid `X-Request-Id` UUID or replace it; return `X-Request-Id`; propagate W3C `traceparent` and internal correlation/causation values server-side. |
| Idempotency | Protected retryable creates/effects require `Idempotency-Key`: 8–128 printable ASCII characters, scoped and hashed before persistence. |
| Concurrency | Mutable reads return `ETag: "<version>"`; protected mutation requires the exact quoted value in `If-Match`. |
| Content | JSON requests require `application/json`; unsupported media type is 415; malformed JSON is 400; valid JSON with invalid semantics is 422. |
| Base error codes | `INVALID_REQUEST`, `UNAUTHENTICATED`, `STEP_UP_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_FAILED`, `RATE_LIMITED`, `UNSUPPORTED_MEDIA_TYPE`, `DEPENDENCY_UNAVAILABLE`, `INTERNAL_ERROR`. |

```ts
type JobStatus = {
  id: string;
  type: string;
  state: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress: { completed: number; total: number; unit: string } | null;
  resultRef: { type: string; id: string } | null;
  error: { code: string; retryable: boolean } | null;
  createdAt: string;
  updatedAt: string;
};
```

### Command Guarantees

| Contract | Required behavior |
|---|---|
| Idempotency | Key is bound to actor, operation, and normalized request hash; ordinary records remain 30 days; same binding returns the original result, mismatched content conflicts. |
| Concurrency | Mutable resources expose a version/ETag; protected updates require `If-Match`; the database verifies the expected version in the same transaction. |
| Job status | Returns stable operation UUID, state, timestamps, progress when measurable, retryability, and a sanitized terminal error reference. |
| Upload authorization | Signed URL expires after 15 minutes and is bound to actor, object intent, maximum bytes, allowed media type, and one target key. |
| Webhook receipt | Provider, external event ID, signature context, and payload digest form the dedupe evidence; raw protected payload is not logged. |
| Provider operation | Local operation UUID and intent precede the call; provider identifiers are reconciliation attributes, not canonical identity. |

### Runtime and Release

- The system remains a modular monolith. New microservices or Cloudflare D1/KV/R2/Durable Objects as canonical stores require an architecture change.
- Environment configuration is schema-validated at startup/deploy; secrets exist only in provider/deployment secret stores, never settings tables or source control.
- Preview, staging, and production have isolated credentials and data. Production deployment requires protected approval.
- Availability objective is 99.9% monthly excluding announced scheduled maintenance; no unplanned-downtime allowance is accepted.
- Supabase Pro with seven-day PITR is required before money, rights, or publication records are enabled. Measured RPO is ≤2 minutes and recovery RTO is ≤4 hours.

## Data Models

All canonical models reside in Supabase PostgreSQL. Identifiers are UUIDs, timestamps are UTC `timestamptz`, mutable rows carry `version bigint`, and authorization-sensitive tables have RLS with deny-by-default policies.

### Infrastructure Records

| Model | Required fields | Invariants and retention |
|---|---|---|
| `IdempotencyRecord` | `id, actor_id, operation, key_hash, request_hash, state, response_ref, created_at, expires_at` | Unique actor/operation/key; request hash immutable; ordinary retention 30 days. |
| `OutboxEvent` | `id, event_type, schema_version, aggregate_type, aggregate_id, aggregate_version, correlation_id, causation_id, payload, occurred_at, dispatched_at` | Written with domain mutation; immutable; payload excludes unnecessary PII. |
| `Job` | `id, job_type, actor_id, acting_party_id, state, progress, attempt_count, lease_until, result_ref, error_code, created_at, updated_at` | One canonical status; lease changes are version-checked; terminal result immutable. |
| `WebhookReceipt` | `id, provider, external_event_id, payload_digest, signature_verified_at, received_at, state, operation_id` | Unique provider/external event; invalid signatures never create trusted work. |
| `ProviderOperation` | `id, provider, operation_type, actor_id, state, intent_hash, provider_ref, last_attempt_at, reconciliation_at, version` | Intent precedes call; ambiguous outcome stays pending; provider ref is not required for creation. |
| `ObjectRecord` | `id, bucket, object_key, owner_party_id, purpose, media_type, byte_size, checksum, state, retention_class, version` | Database row governs Storage object; usable only in verified state; unique bucket/key. |
| `UploadIntent` | `id, object_id, actor_id, max_bytes, allowed_media_types, expires_at, state` | Single object target; 15-minute maximum authorization; cannot authorize after expiry. |
| `AuditEvent` | `id, action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at` | Append-only; excludes secrets, bodies, payment/evidence data, and private content. |

### Field-Level Constraints

| Model | Typed constraints and defaults |
|---|---|
| Common | `id uuid primary key default gen_random_uuid()`; timestamps `timestamptz not null default now()`; `version bigint not null default 1 check (version > 0)`. |
| Idempotency | Actor and operation are non-null; hashes are fixed-length digests; `state` enum; `expires_at > created_at`; response reference is nullable until completion. |
| Outbox | `schema_version integer > 0`; `aggregate_version bigint > 0`; `payload jsonb`; `dispatched_at` nullable and set only after accepted delivery. |
| Job | `progress jsonb` nullable and Zod-validated; `attempt_count integer default 0 check >= 0`; lease/result/error fields nullable according to state. |
| Webhook receipt | `provider` and `external_event_id` non-empty; digest fixed-length; `signature_verified_at` required before `accepted`. |
| Provider operation | Intent hash immutable; provider reference nullable; `reconciliation_at` nullable until evidence is checked; state/version changes are compare-and-swap. |
| Object/upload | Object key is server-generated and normalized; byte counts are non-negative; checksum uses an allowlisted algorithm; expiry cannot exceed 15 minutes from creation. |
| Audit | `decision` is `allowed|denied|completed|failed`; actor may be null only for named system principals; rows are append-only and update/delete is revoked. |

### Static Registries

- Every API route registers method, path template, auth class, cache class, timeout class, rate-limit class, SLO tier, owner shard, and Zod request/response/error contracts.
- Every async consumer registers event types/versions, queue, lease duration, retry policy, dead-letter policy, SLO tier, owner shard, and runbook.
- CI rejects duplicate registrations, missing owners/contracts/runbooks, unbounded retries, unknown SLO tiers, or protected routes without BOLA test declarations.

### Relationships

- One protected command may create one `IdempotencyRecord`, zero or more domain mutations, one or more `AuditEvent` rows, and one or more `OutboxEvent` rows in one transaction.
- An `OutboxEvent` may cause one `Job`; a job may own many leased attempts but only one canonical terminal result.
- One `ProviderOperation` may reference many deduplicated `WebhookReceipt` records; reconciliation updates only the matching current operation/version.
- One `UploadIntent` authorizes one `ObjectRecord`; Storage bytes without valid governing metadata are quarantined or removed.

### State Machines

| Model | Allowed transitions |
|---|---|
| Idempotency | `reserved → completed`; `reserved → failed_retryable`; expired records are removed by policy. |
| Job | `queued → running → succeeded|failed|cancelled`; retryable failure returns to `queued`; terminal states cannot reopen. |
| Provider operation | `planned → pending → confirmed|failed|manual_review`; ambiguous send remains `pending`; reconciliation may resolve it once. |
| Object | `pending_upload → uploaded → verifying → ready|rejected|quarantined`; only `ready` is consumable. |
| Webhook receipt | `received → accepted|duplicate|rejected → processed|failed`; duplicate never repeats the effect. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`IdempotencyRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, actor_id, operation, key_hash, request_hash, state, response_ref, created_at, expires_at` | Unique actor/operation/key; request hash immutable; ordinary retention 30 days..
- **`OutboxEvent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, event_type, schema_version, aggregate_type, aggregate_id, aggregate_version, correlation_id, causation_id, payload, occurred_at, dispatched_at` | Written with domain mutation; immutable; payload excludes unnecessary PII..
- **`Job`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, job_type, actor_id, acting_party_id, state, progress, attempt_count, lease_until, result_ref, error_code, created_at, updated_at` | One canonical status; lease changes are version-checked; terminal result immutable..
- **`WebhookReceipt`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, provider, external_event_id, payload_digest, signature_verified_at, received_at, state, operation_id` | Unique provider/external event; invalid signatures never create trusted work..
- **`ProviderOperation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, provider, operation_type, actor_id, state, intent_hash, provider_ref, last_attempt_at, reconciliation_at, version` | Intent precedes call; ambiguous outcome stays pending; provider ref is not required for creation..
- **`ObjectRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, bucket, object_key, owner_party_id, purpose, media_type, byte_size, checksum, state, retention_class, version` | Database row governs Storage object; usable only in verified state; unique bucket/key..
- **`UploadIntent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, object_id, actor_id, max_bytes, allowed_media_types, expires_at, state` | Single object target; 15-minute maximum authorization; cannot authorize after expiry..
- **`AuditEvent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at` | Append-only; excludes secrets, bodies, payment/evidence data, and private content..
- **`Common`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id uuid primary key default gen_random_uuid()`; timestamps `timestamptz not null default now()`; `version bigint not null default 1 check (version > 0)`..
- **`Idempotency`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Actor and operation are non-null; hashes are fixed-length digests; `state` enum; `expires_at > created_at`; response reference is nullable until completion..
- **`Outbox`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `schema_version integer > 0`; `aggregate_version bigint > 0`; `payload jsonb`; `dispatched_at` nullable and set only after accepted delivery..
- **`Job`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `progress jsonb` nullable and Zod-validated; `attempt_count integer default 0 check >= 0`; lease/result/error fields nullable according to state..
- **`Webhook receipt`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `provider` and `external_event_id` non-empty; digest fixed-length; `signature_verified_at` required before `accepted`..
- **`Provider operation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Intent hash immutable; provider reference nullable; `reconciliation_at` nullable until evidence is checked; state/version changes are compare-and-swap..
- **`Object/upload`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Object key is server-generated and normalized; byte counts are non-negative; checksum uses an allowlisted algorithm; expiry cannot exceed 15 minutes from creation..
- **`Audit`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `decision` is `allowed | denied | completed | failed`; actor may be null only for named system principals; rows are append-only and update/delete is revoked..
- **`Idempotency`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `reserved → completed`; `reserved → failed_retryable`; expired records are removed by policy..
- **`Job`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `queued → running → succeeded | failed | cancelled`; retryable failure returns to `queued`; terminal states cannot reopen..
- **`Provider operation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `planned → pending → confirmed | failed | manual_review`; ambiguous send remains `pending`; reconciliation may resolve it once..
- **`Object`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `pending_upload → uploaded → verifying → ready | rejected | quarantined`; only `ready` is consumable..
- **`Webhook receipt`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `received → accepted | duplicate | rejected → processed | failed`; duplicate never repeats the effect..

## Access Control

| Principal | Permitted | Prohibited/required controls |
|---|---|---|
| Anonymous browser | Public allowlisted reads and authentication entry points. | No private rows, signed private objects, acting context, or protected commands. |
| Authenticated user | Own eligible private reads/commands under RLS. | Identity alone grants no organization/party authority. |
| Acting-party principal | Capability-scoped operations for the resolved party. | Party ID cannot come from client trust; mandate, NDA, visibility, and commercial authority are re-evaluated. |
| Internal capability operator | Explicit administrative operation after step-up. | No blanket bypass; reason, target, decision, and actor are audited. |
| Queue/schedule principal | Named consumer function using least-privilege server credentials. | Must re-read canonical state/version; Queue envelope is not authority. |
| Provider webhook | Submit signed provider event to one provider endpoint. | Raw-body signature and replay validation precede parse; no general API session. |
| Deployment principal | Promote approved immutable artifact and managed migrations. | Environment-scoped credentials; production approval; cannot mutate business data outside migration/runbook contracts. |
| Service role | Narrow server-only maintenance/RPC path where RLS bypass is explicitly required. | Never exposed to browser; use is isolated, logged, reviewed, and BOLA-tested. |

- Every protected operation tests wrong-valid-user, wrong-party, and wrong-resource denial.
- Security-definer functions use an empty fixed `search_path`, fully qualified objects, revoked default execution, named grants, and abuse tests.
- Additive social identities are linked/unlinked only after reauthentication/step-up; the final verified login method cannot be removed.

### Access Escalation

- **Anonymous browser:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Authenticated user:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Acting-party principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Internal capability operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Queue/schedule principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Provider webhook:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Deployment principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service role:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- WCAG 2.2 AA applies to public, authenticated, administrative, degraded, maintenance, offline, upload, and job-status infrastructure states.
- Validation presents an error summary, moves focus to the first invalid field, links each error to its control, and never relies on color alone.
- Authentication/session expiry warns before timeout, allows extension when policy permits, and returns focus to the initiating control after modal completion.
- Upload and job progress use determinate progress when measurable and polite live-region updates; unknown progress is labelled truthfully rather than simulated.
- Offline, stale-version, retrying, maintenance, and degraded states explain data safety and the next available action without claiming success.
- Keyboard activation, visible focus, focus restoration, reduced motion, 200% zoom/reflow, semantic landmarks, and labelled status messages are mandatory.
- Automated gates require zero axe Critical/Serious findings and Lighthouse accessibility 100 on governed representative routes; manual keyboard/screen-reader checks remain required.

## Event Schemas

```ts
type PlatformEvent<T extends JsonValue> = {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  occurredAt: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  correlationId: string;
  causationId: string | null;
  actorId: string | null;
  actingPartyId: string | null;
  payload: T;
};

type QueueEnvelope = {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  causationId: string | null;
  correlationId: string;
};
```

- PostgreSQL outbox payload is the durable event. Queue messages contain only the transient envelope and no raw PII or protected payload.
- Consumers validate `eventType` and `schemaVersion`, acquire a lease/idempotency boundary, then re-read the canonical aggregate and version.
- Base event families are `job.requested`, `object.uploaded`, `provider.operation.requested`, `webhook.accepted`, and domain-defined events registered by owning shards.
- `job.requested` payload is `{ jobType, jobId }`; `object.uploaded` is `{ objectId }`; `provider.operation.requested` is `{ operationId }`; `webhook.accepted` is `{ receiptId }`. Each identifier is a UUID and consumers fetch all protected detail canonically.
- Shard 00 owns the four base schemas and their infrastructure consumers. Domain shards own domain event payloads and must name both producer and consumer; cross-shard references are bidirectional in both owning specs.
- Unknown versions fail closed to dead-letter/manual review. Stale or out-of-order aggregate versions cannot overwrite newer state.
- Outbox undispatched p95 is ≤2 seconds with alerting at 2 minutes; Queue first attempt p95 is ≤60 seconds; dead-letter rate is <0.1% daily.
- Terminal attempt detail is retained 30 days. Replay creates new attempt evidence while preserving original event identity and business idempotency.

## Edge Cases

| Case | Required result |
|---|---|
| Expired/revoked session during command | Reject before mutation; preserve unsent client input locally; return reauthentication path. |
| Valid user supplies another party/resource ID | Deny under server capability check and RLS; emit sanitized security telemetry. |
| Same idempotency key, different body | Return 409; do not execute or replace the original result. |
| Stale `If-Match` | Return 409 with sanitized current-version guidance; no partial effects. |
| Database commits but client disconnects | Retry with the same idempotency key returns the committed result/status. |
| Outbox dispatch repeats | Consumer deduplicates and re-reads current aggregate/version; effect occurs once. |
| Queue event arrives out of order | Ignore/reconcile stale version; never regress canonical state. |
| Worker dies while leased | Lease expires and a later attempt resumes from canonical state. |
| Provider times out after send | Keep operation pending; do not blindly resend; reconcile by provider idempotency/webhook/poll. |
| Duplicate/replayed webhook | Acknowledge safely after verification; receipt dedupe prevents repeated business effect. |
| Realtime hint is missed/duplicated | Poll/navigation refetch recovers; hint never determines correctness. |
| Signed upload expires mid-transfer | Unverified object remains unusable; client requests a newly authorized intent. |
| Bytes exist without metadata/checksum match | Quarantine/remove according to retention policy; never expose to consumers. |
| 30 seconds with no upload byte | Abort and offer retry; any transferred byte resets inactivity timing. |
| Migration fails after expansion | Stop promotion; old code remains compatible; no destructive rollback migration. |
| New route/consumer lacks SLO registration | CI fails before artifact promotion. |
| Logging receives forbidden field | Observability package redacts/drops it and raises a test/diagnostic signal. |
| Forged acting-party ID or user-editable JWT role | Ignore supplied authority, resolve server-side, deny mismatch, and record sanitized abuse telemetry. |
| Webhook signature is valid but timestamp is outside replay window | Reject without trusted receipt/work; expose no signature-oracle detail. |
| Queue envelope requests an older/unknown schema version | Known stale versions are handled idempotently; unknown versions dead-letter without execution. |
| Object key contains traversal/control characters | Reject before signing; keys are server-generated, normalized, and never derived directly from filenames. |
| User input attempts newline/log-field injection | Structured logger encodes values, applies the denylist, and prevents caller replacement of reserved identifiers. |
| PITR missing or older than required window | Disable protected production writes for money/rights/publication and escalate via runbook. |
| Scheduled maintenance | Announce ≥48 hours before exclusion; display truthful scope/status; otherwise count outage against objective. |
| Unplanned outage | Counts fully against 99.9% objective; no excluded error-budget category. |
| Recovery restores data but RLS/RPC checks fail | Keep service/protected writes closed until integrity and authorization checks pass. |

## Observability and Assurance

- `@wejammin/observability` emits one newline-delimited JSON object per event with timestamp, severity, service, environment, event name, request/correlation/causation/trace IDs, job/attempt IDs when present, entity type/ID/version when safe, duration, outcome, and sanitized error code.
- Logs never contain secrets, credentials, session tokens, raw request/response bodies, direct PII, payment data, evidence, or private content. Sentry uses `sendDefaultPii: false`; Session Replay is off.
- Sampling retains 100% of errors and high-risk operations, 10% of ordinary authentication success, and 1% of public/cache success. Sentry receives exceptions and sampled spans, not the full log stream.
- Seven SLO tiers are registered in code/config. Dashboards cover public delivery, authenticated API, async/outbox, provider/webhook, and database/recovery health.
- Severity 1 alerts email immediately, target detection is 5 minutes, and owner acknowledgment target is 30 minutes during declared owner coverage; no 24/7 human-response promise is made.
- Protected PostgreSQL transactions/RPCs target p95 ≤300ms. Undispatched outbox age, Queue first-attempt age, dead letters, webhook latency, normal-web latency, availability, and restore readiness are release/operations signals.

## Surface Applicability

- **Primary**: Responsive web/PWA across public, authenticated, administrative, offline, degraded, and maintenance states.
- **Server**: Astro hybrid rendering, Hono on Cloudflare Workers, Queue/schedule consumers, Supabase PostgreSQL/Auth/Storage/Realtime.
- **External**: Provider APIs and signed webhooks through local-intent/reconciliation boundaries.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| INF-01 Public read | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-02 Authenticated read | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-03 Protected command | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-04 High-risk/admin command | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-05 Long-running job | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-06 Object upload | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-07 Offline intent | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-08 Realtime hint | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-09 Inbound webhook | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-10 Provider effect | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-11 Release promotion | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| INF-12 Maintenance/recovery | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** None.
- **Depended on by:** Shards 01–42. Every downstream specification must reference the applicable contracts rather than redefine or weaken them.

## Deep Dives Needed

- None. Shard 00 remains a single cross-cutting specification because its six areas form one mandatory request, persistence, effect, and operations chain.

### Cross-Shard Section Contract Map

- **WeJammin — IA Decomposition Plan:** consume [WeJammin — IA Decomposition Plan Contracts](decomposition-plan.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [WeJammin — IA Decomposition Plan Event Schemas](decomposition-plan.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01 — Identity authority and party governance:** consume [Shard 01 — Identity authority and party governance Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 — Identity authority and party governance Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-02 | Complete design pass from approved architecture, standards, data placement, runbooks, and design system | /write-architecture-spec-design | All |
| 2026-08-02 | Deepening passes converged; transport, field, registry, event, observability, and abuse-path decisions made deterministic | /write-architecture-spec-deepen | Contracts, Data Models, Event Schemas, Edge Cases, Observability |

## Dependency References

### Constrained by

- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ENGINEERING-STANDARDS|WeJammin — Engineering Standards]]
- [[specs/data-placement-strategy|WeJammin — Data Placement Strategy]]
- [[specs/design-system|WeJammin — Design System]]
- [[specs/ia/decomposition-plan|WeJammin — IA Decomposition Plan]]
- [[operations/runbooks/README|Operations Runbooks]]

### Constrains

- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- All remaining IA shards 02–42 through their declared dependency on Shard 00.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ENGINEERING-STANDARDS|WeJammin — Engineering Standards]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/design-system|Design System]]
- [[specs/ia/decomposition-plan|WeJammin — IA Decomposition Plan]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
