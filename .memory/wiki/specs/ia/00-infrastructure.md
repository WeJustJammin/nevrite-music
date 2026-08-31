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
- **Observability and release assurance** — Structured logs, traces, provider-native diagnostics, SLO registration, CI gates, protected releases, runbooks, synthetic/local recovery evidence, restore drills, and infrastructure verification make operations measurable.

- **DEC-104 free-tier binding** — Supabase Free remains the selected PostgreSQL/Auth/Storage/Realtime provider. It provides no PITR and no uptime SLA; no paid add-on or upgrade is authorized. Recovery evidence is synthetic/local only until production-verified recovery evidence is separately demonstrated, and protected money, rights, and publication writes remain closed without it. Cloudflare Workers Paid is the sole paid-service exception under a soft `$10/month` ceiling.

## Acceptance Criteria

- **AC-INF-01 — Public read:** Given Route is registered with a public auth class and an allowlisted cache class and the request targets only public projections; no session, acting context, `Idempotency-Key` or `If-Match` is required, and none is accepted as authority, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Cloudflare serves safe cached static/public content or forwards to Hono; Zod validates inputs; the handler reads only public projections, and (6) return Response uses the versioned contract; only explicitly safe responses are cacheable; if the flow cannot complete, Boundary validation failure returns `INVALID_REQUEST` at 400 or `VALIDATION_FAILED` at 422, and a request for a non-public row returns a typed refusal that leaks no existence of it; `RATE_LIMITED` carries the `RateLimit-*` and `Retry-After` headers and `DEPENDENCY_UNAVAILABLE` is retryable; the anonymous actor's only forward path is the authentication entry point.
- **AC-INF-02 — Authenticated read:** Given A Supabase Auth session verifies server-side and the current actor and acting party resolve server-side; RLS-visible authority must already cover the requested rows, because identity alone grants no organization or party authority, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Server verifies the Supabase session, resolves the current actor and acting party, authorizes, then reads under RLS, and (6) return Private response is `no-store`; request and trace identifiers are emitted; if the flow cannot complete, An expired or revoked session returns `UNAUTHENTICATED` with a reauthentication path; RLS and the server capability check deny rows outside the resolved authority, and a valid user supplying another party or resource ID is denied with sanitized security telemetry rather than a disclosure; the forward path is being granted acting-party authority by the party that holds it, never a wider grant at the infrastructure layer.
- **AC-INF-03 — Protected command:** Given The actor is authenticated, the acting party resolves server-side and holds the capability for this operation, the body is `application/json` satisfying the route's registered Zod request contract, a retryable create or effect carries an `Idempotency-Key` of 8–128 printable ASCII characters, and a mutable resource carries its exact quoted current version in `If-Match`, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Boundary validation precedes authorization; the command verifies version and idempotency, then atomically writes canonical state, audit, and outbox, and (6) return Commit returns the authoritative resource/version or an existing idempotent result; if the flow cannot complete, Malformed JSON returns 400, unsupported media type 415, valid JSON with invalid semantics 422, and a stale `If-Match` or a same-key/different-body idempotency mismatch returns 409 with sanitized current-version guidance; `UNAUTHENTICATED` and `FORBIDDEN` refuse before any mutation, no partial effect is committed, and retrying with the same idempotency key returns the original committed result.
- **AC-INF-04 — High-risk/admin command:** Given Every INF-03 precondition holds and, additionally, the operator has completed a recent step-up authentication and holds the explicit internal capability for this administrative operation; a user-facing role label never satisfies this precondition, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) INF-03 plus recent step-up authentication and an explicit internal capability; user-facing role labels never grant authority alone, and (6) return Decision and reason are audited without storing protected request content; if the flow cannot complete, Missing step-up returns `STEP_UP_REQUIRED` and is cleared by re-authenticating; a missing capability returns `FORBIDDEN` and is cleared only by being granted the explicit internal capability, never by a blanket bypass; a forged acting-party ID or user-editable JWT role is ignored, resolved server-side, denied on mismatch and recorded as sanitized abuse telemetry, and the denial is audited with reason, target, decision and actor without storing protected request content.
- **AC-INF-05 — Long-running job:** Given The initiating bounded command satisfies INF-03, the work cannot complete within the 15-second protected-command deadline, and the job type and its consumer are registered with event types and versions, queue, lease duration, retry policy, dead-letter policy, SLO tier, owner shard and runbook, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) A bounded command commits a job and outbox event, returning its status resource within 2 seconds; workers lease and retry from canonical state, and (6) return Client polls or refetches after a Realtime hint until terminal state; if the flow cannot complete, A refusal before commit returns the typed INF-03 error and creates no job; after commit the `JobStatus` resource reports `failed` with a sanitized error code and retryability, a retryable failure returns the job to `queued`, an expired lease lets a later attempt resume from canonical state, and an unknown event `schemaVersion` dead-letters to manual review without execution; terminal states cannot reopen.
- **AC-INF-06 — Object upload:** Given The actor is authorized for the upload target, the declared media type is on the route's allowlist and the declared size is within the intent's maximum bytes, and an unexpired `UploadIntent` — at most 15 minutes old and bound to actor, object intent and one server-generated normalized target key — governs the transfer, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Server authorizes the target and creates database metadata plus a 15-minute signed upload; client uploads directly and reports completion for verification, and (6) return Object becomes usable only after size/type/checksum/state validation; if the flow cannot complete, An object key containing traversal or control characters is rejected before signing; an expired intent cannot authorize, so the unverified object stays unusable and the client requests a newly authorized intent; 30 seconds without a transferred byte aborts and offers retry, and any transferred byte resets inactivity timing; bytes failing size, type, checksum or state validation never reach `ready` and are quarantined or removed under the retention class.
- **AC-INF-07 — Offline intent:** Given The client is disconnected and holds a temporary, non-canonical local intent; acceptance on reconnect additionally requires that identity, acting authority, the target's expected version and the recorded request content are all still valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Client stores a temporary local intent; on reconnect the server assigns an operation UUID, revalidates identity, authority, version, and request content, and (6) return Accepted intent follows INF-03/05; stale or unauthorized intent remains visible and retryable; if the flow cannot complete, Revalidation refuses a stale or unauthorized intent with the typed INF-03 code and writes no canonical state, so a target deleted or an authority revoked while offline creates no orphan; the refused intent stays visible and retryable rather than being silently discarded or silently applied, and unsent client input is preserved locally with a reauthentication path when the session expired.
- **AC-INF-08 — Realtime hint:** Given The client holds a Realtime subscription it is authorized to hold and receives an entity or event hint; the hint is non-authoritative, so no state, version or authority may be presumed from it, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Realtime carries only an entity/event hint; client treats it as non-authoritative and refetches the canonical resource, and (6) return UI updates only from authorized canonical data; if the flow cannot complete, A missed, duplicated or reordered hint is recovered by poll or navigation refetch and never determines correctness; a hint naming a resource the actor cannot read yields nothing on refetch and discloses nothing, and the UI updates only from authorized canonical data.
- **AC-INF-09 — Inbound webhook:** Given The request reaches one provider-specific endpoint with raw bytes intact and carries a provider signature whose timestamp falls inside the provider replay window; this principal holds no API session and no acting context, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Raw bytes are signature-checked within the provider replay window before parsing; receipt identity is deduplicated and acknowledged quickly, and (6) return Acknowledgment p95 ≤1,000ms and p99 <2,000ms; durable processing continues asynchronously; if the flow cannot complete, An invalid signature never creates a trusted receipt or trusted work, and a valid signature outside the replay window is rejected without exposing signature-oracle detail; a repeated provider and external event ID is recorded as `duplicate` and never repeats the effect; recovery is provider-side redelivery, deduplicated by receipt identity so the business effect still occurs exactly once.
- **AC-INF-10 — Provider effect:** Given A local `ProviderOperation` carrying an immutable intent hash, plus its idempotency record, are committed in `planned` state before any network call, and the sending worker runs as the named queue or schedule principal on least-privilege server credentials after re-reading canonical state and version, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Local intent and idempotency are committed before the network call; a worker sends the minimum contract and records attempt evidence, and (6) return Success comes from verified webhook/poll reconciliation; ambiguity remains `pending`; if the flow cannot complete, A timed-out or ambiguous send keeps the operation `pending` and is never blindly resent; resolution comes only from provider idempotency, webhook or poll reconciliation, and an operation that cannot be reconciled ends in `failed` or `manual_review` rather than being deleted, with its deduplicated receipts retained as evidence.
- **AC-INF-11 — Release promotion:** Given One immutable artifact has already been built and is being promoted preview to staging to production by an environment-scoped deployment principal; production promotion additionally requires protected approval, and every new route and async consumer must already be registered with contracts, owner and runbook, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) CI validates contracts, tests, security, accessibility, build, migrations, route/consumer SLO registration, and artifact identity, and (6) return Protected approval promotes the same artifact; rollback restores artifact/config, never erases committed business effects; if the flow cannot complete, A failed CI gate — contracts, tests, security, accessibility, build, migrations, route or consumer SLO registration, or artifact identity — stops promotion and is cleared only by a new artifact through the same gates; a migration that fails after expansion stops promotion, leaves the old code compatible and runs no destructive rollback migration; rollback restores artifact and configuration only and never erases committed business effects.
- **AC-INF-12 — Maintenance/recovery:** Given Either scheduled maintenance has been announced at least 48 hours before its exclusion window, or an incident or restore is proceeding under the applicable runbook; Supabase Free provides no PITR or uptime SLA, so only synthetic/local recovery evidence may exist and production-verified recovery evidence must already exist before money, rights or publication writes are enabled, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Operator announces scheduled maintenance ≥48 hours ahead, exposes truthful status, follows the runbook, and validates available recovery evidence plus restore integrity/RLS/RPCs, and (6) return Service resumes only after checks pass; protected writes remain disabled without production-verified recovery evidence; if the flow cannot complete, Missing or unverified production recovery evidence disables protected production writes for money, rights and publication records and escalates through the runbook; a restore that returns data but fails integrity, RLS or RPC checks keeps service and protected writes closed until the checks pass; unplanned downtime counts fully against the internal 99.9% objective and no provider uptime SLA is assumed, while append-only audit rows survive recovery.

## Interactions

| ID | Interaction | Preconditions | Required behavior | Completion | Failure / recovery |
|---|---|---|---|---|---|
| INF-01 | Public read | Route is registered with a public auth class and an allowlisted cache class and the request targets only public projections; no session, acting context, `Idempotency-Key` or `If-Match` is required, and none is accepted as authority. | Cloudflare serves safe cached static/public content or forwards to Hono; Zod validates inputs; the handler reads only public projections. | Response uses the versioned contract; only explicitly safe responses are cacheable. | Boundary validation failure returns `INVALID_REQUEST` at 400 or `VALIDATION_FAILED` at 422, and a request for a non-public row returns a typed refusal that leaks no existence of it; `RATE_LIMITED` carries the `RateLimit-*` and `Retry-After` headers and `DEPENDENCY_UNAVAILABLE` is retryable; the anonymous actor's only forward path is the authentication entry point. |
| INF-02 | Authenticated read | A Supabase Auth session verifies server-side and the current actor and acting party resolve server-side; RLS-visible authority must already cover the requested rows, because identity alone grants no organization or party authority. | Server verifies the Supabase session, resolves the current actor and acting party, authorizes, then reads under RLS. | Private response is `no-store`; request and trace identifiers are emitted. | An expired or revoked session returns `UNAUTHENTICATED` with a reauthentication path; RLS and the server capability check deny rows outside the resolved authority, and a valid user supplying another party or resource ID is denied with sanitized security telemetry rather than a disclosure; the forward path is being granted acting-party authority by the party that holds it, never a wider grant at the infrastructure layer. |
| INF-03 | Protected command | The actor is authenticated, the acting party resolves server-side and holds the capability for this operation, the body is `application/json` satisfying the route's registered Zod request contract, a retryable create or effect carries an `Idempotency-Key` of 8–128 printable ASCII characters, and a mutable resource carries its exact quoted current version in `If-Match`. | Boundary validation precedes authorization; the command verifies version and idempotency, then atomically writes canonical state, audit, and outbox. | Commit returns the authoritative resource/version or an existing idempotent result. | Malformed JSON returns 400, unsupported media type 415, valid JSON with invalid semantics 422, and a stale `If-Match` or a same-key/different-body idempotency mismatch returns 409 with sanitized current-version guidance; `UNAUTHENTICATED` and `FORBIDDEN` refuse before any mutation, no partial effect is committed, and retrying with the same idempotency key returns the original committed result. |
| INF-04 | High-risk/admin command | Every INF-03 precondition holds and, additionally, the operator has completed a recent step-up authentication and holds the explicit internal capability for this administrative operation; a user-facing role label never satisfies this precondition. | INF-03 plus recent step-up authentication and an explicit internal capability; user-facing role labels never grant authority alone. | Decision and reason are audited without storing protected request content. | Missing step-up returns `STEP_UP_REQUIRED` and is cleared by re-authenticating; a missing capability returns `FORBIDDEN` and is cleared only by being granted the explicit internal capability, never by a blanket bypass; a forged acting-party ID or user-editable JWT role is ignored, resolved server-side, denied on mismatch and recorded as sanitized abuse telemetry, and the denial is audited with reason, target, decision and actor without storing protected request content. |
| INF-05 | Long-running job | The initiating bounded command satisfies INF-03, the work cannot complete within the 15-second protected-command deadline, and the job type and its consumer are registered with event types and versions, queue, lease duration, retry policy, dead-letter policy, SLO tier, owner shard and runbook. | A bounded command commits a job and outbox event, returning its status resource within 2 seconds; workers lease and retry from canonical state. | Client polls or refetches after a Realtime hint until terminal state. | A refusal before commit returns the typed INF-03 error and creates no job; after commit the `JobStatus` resource reports `failed` with a sanitized error code and retryability, a retryable failure returns the job to `queued`, an expired lease lets a later attempt resume from canonical state, and an unknown event `schemaVersion` dead-letters to manual review without execution; terminal states cannot reopen. |
| INF-06 | Object upload | The actor is authorized for the upload target, the declared media type is on the route's allowlist and the declared size is within the intent's maximum bytes, and an unexpired `UploadIntent` — at most 15 minutes old and bound to actor, object intent and one server-generated normalized target key — governs the transfer. | Server authorizes the target and creates database metadata plus a 15-minute signed upload; client uploads directly and reports completion for verification. | Object becomes usable only after size/type/checksum/state validation. | An object key containing traversal or control characters is rejected before signing; an expired intent cannot authorize, so the unverified object stays unusable and the client requests a newly authorized intent; 30 seconds without a transferred byte aborts and offers retry, and any transferred byte resets inactivity timing; bytes failing size, type, checksum or state validation never reach `ready` and are quarantined or removed under the retention class. |
| INF-07 | Offline intent | The client is disconnected and holds a temporary, non-canonical local intent; acceptance on reconnect additionally requires that identity, acting authority, the target's expected version and the recorded request content are all still valid. | Client stores a temporary local intent; on reconnect the server assigns an operation UUID, revalidates identity, authority, version, and request content. | Accepted intent follows INF-03/05; stale or unauthorized intent remains visible and retryable. | Revalidation refuses a stale or unauthorized intent with the typed INF-03 code and writes no canonical state, so a target deleted or an authority revoked while offline creates no orphan; the refused intent stays visible and retryable rather than being silently discarded or silently applied, and unsent client input is preserved locally with a reauthentication path when the session expired. |
| INF-08 | Realtime hint | The client holds a Realtime subscription it is authorized to hold and receives an entity or event hint; the hint is non-authoritative, so no state, version or authority may be presumed from it. | Realtime carries only an entity/event hint; client treats it as non-authoritative and refetches the canonical resource. | UI updates only from authorized canonical data. | A missed, duplicated or reordered hint is recovered by poll or navigation refetch and never determines correctness; a hint naming a resource the actor cannot read yields nothing on refetch and discloses nothing, and the UI updates only from authorized canonical data. |
| INF-09 | Inbound webhook | The request reaches one provider-specific endpoint with raw bytes intact and carries a provider signature whose timestamp falls inside the provider replay window; this principal holds no API session and no acting context. | Raw bytes are signature-checked within the provider replay window before parsing; receipt identity is deduplicated and acknowledged quickly. | Acknowledgment p95 ≤1,000ms and p99 <2,000ms; durable processing continues asynchronously. | An invalid signature never creates a trusted receipt or trusted work, and a valid signature outside the replay window is rejected without exposing signature-oracle detail; a repeated provider and external event ID is recorded as `duplicate` and never repeats the effect; recovery is provider-side redelivery, deduplicated by receipt identity so the business effect still occurs exactly once. |
| INF-10 | Provider effect | A local `ProviderOperation` carrying an immutable intent hash, plus its idempotency record, are committed in `planned` state before any network call, and the sending worker runs as the named queue or schedule principal on least-privilege server credentials after re-reading canonical state and version. | Local intent and idempotency are committed before the network call; a worker sends the minimum contract and records attempt evidence. | Success comes from verified webhook/poll reconciliation; ambiguity remains `pending`. | A timed-out or ambiguous send keeps the operation `pending` and is never blindly resent; resolution comes only from provider idempotency, webhook or poll reconciliation, and an operation that cannot be reconciled ends in `failed` or `manual_review` rather than being deleted, with its deduplicated receipts retained as evidence. |
| INF-11 | Release promotion | One immutable artifact has already been built and is being promoted preview to staging to production by an environment-scoped deployment principal; production promotion additionally requires protected approval, and every new route and async consumer must already be registered with contracts, owner and runbook. | CI validates contracts, tests, security, accessibility, build, migrations, route/consumer SLO registration, and artifact identity. | Protected approval promotes the same artifact; rollback restores artifact/config, never erases committed business effects. | A failed CI gate — contracts, tests, security, accessibility, build, migrations, route or consumer SLO registration, or artifact identity — stops promotion and is cleared only by a new artifact through the same gates; a migration that fails after expansion stops promotion, leaves the old code compatible and runs no destructive rollback migration; rollback restores artifact and configuration only and never erases committed business effects. |
| INF-12 | Maintenance/recovery | Either scheduled maintenance has been announced at least 48 hours before its exclusion window, or an incident or restore is proceeding under the applicable runbook; Supabase Free provides no PITR or uptime SLA, so only synthetic/local recovery evidence may exist and production-verified recovery evidence must already exist before money, rights or publication writes are enabled. | Operator announces scheduled maintenance ≥48 hours ahead, exposes truthful status, follows the runbook, and validates available recovery evidence plus restore integrity/RLS/RPCs. | Service resumes only after checks pass; protected writes remain disabled without production-verified recovery evidence. | Missing or unverified production recovery evidence disables protected production writes for money, rights and publication records and escalates through the runbook; a restore that returns data but fails integrity, RLS or RPC checks keeps service and protected writes closed until the checks pass; unplanned downtime counts fully against the internal 99.9% objective and no provider uptime SLA is assumed, while append-only audit rows survive recovery. |

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
- Supabase Free provides no PITR or uptime SLA. Recovery evidence is synthetic/local only until production-verified recovery evidence is separately demonstrated; protected money, rights, and publication writes remain disabled without it.

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
| Audit | `decision` is `allowed\|denied\|completed\|failed`; actor may be null only for named system principals; rows are append-only and update/delete is revoked. |

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
| Job | `queued → running → succeeded\|failed\|cancelled`; retryable failure returns to `queued`; terminal states cannot reopen. |
| Provider operation | `planned → pending → confirmed\|failed\|manual_review`; ambiguous send remains `pending`; reconciliation may resolve it once. |
| Object | `pending_upload → uploaded → verifying → ready\|rejected\|quarantined`; only `ready` is consumable. |
| Webhook receipt | `received → accepted\|duplicate\|rejected → processed\|failed`; duplicate never repeats the effect. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

This registry types only the eight entities declared in § Infrastructure Records. The row labels in § Field-Level Constraints and § State Machines (`Common`, `Idempotency`, `Outbox`, `Job`, `Webhook receipt`, `Provider operation`, `Object/upload`, `Audit`, `Object`) are groupings of those same eight entities, not additional entities, and no table is created for any of them. There is no universal core-field set: `id: uuid` and one creation-or-occurrence timestamp are required everywhere, while `version: bigint` and `updated_at: timestamptz` exist only where the model row below declares them — append-only and immutable entities carry neither. Cardinality is declared in § Relationships; where § Relationships states a cardinality for a pair of entities, that statement governs.

- **`IdempotencyRecord`:** mutable, unversioned. Core fields `id: uuid`, `actor_id: uuid`, `operation`, `key_hash`, `request_hash`, `state: closed enum`, `response_ref`, `created_at: timestamptz`, `expires_at: timestamptz`. Actor and operation are non-null, hashes are fixed-length digests, `request_hash` is immutable, `expires_at > created_at`, and `response_ref` is nullable until completion. Unique on actor/operation/key; ordinary retention 30 days. States are `reserved → completed` and `reserved → failed_retryable`. Cardinality: one protected command creates at most one record.
- **`OutboxEvent`:** immutable — no `state`, no `version`, no `updated_at`. Core fields `id: uuid`, `event_type`, `schema_version: integer > 0`, `aggregate_type`, `aggregate_id: uuid`, `aggregate_version: bigint > 0`, `correlation_id: uuid`, `causation_id: uuid` nullable, `payload jsonb`, `occurred_at: timestamptz`, `dispatched_at: timestamptz` nullable and set only after accepted delivery. Written with the domain mutation in the same transaction; payload excludes unnecessary PII. Cardinality: one protected command writes one or more rows; one row may cause at most one `Job`.
- **`Job`:** mutable and versioned — carries `version: bigint` under the § Data Models rule that mutable rows are versioned, which is what makes "lease changes are version-checked" enforceable. Core fields `id: uuid`, `job_type`, `actor_id: uuid`, `acting_party_id: uuid`, `state: closed enum`, `progress jsonb` nullable and Zod-validated, `attempt_count: integer default 0 check >= 0`, `lease_until: timestamptz`, `result_ref`, `error_code`, `created_at: timestamptz`, `updated_at: timestamptz`. Lease, result and error fields are nullable according to state; the terminal result is immutable. States are `queued → running → succeeded`, `failed` or `cancelled`; retryable failure returns to `queued`; terminal states cannot reopen. Cardinality: one job owns many leased attempts but exactly one canonical terminal result.
- **`WebhookReceipt`:** mutable state row, unversioned — timestamps are `received_at` and `signature_verified_at`, not `created_at`/`updated_at`. Core fields `id: uuid`, `provider`, `external_event_id`, `payload_digest`, `signature_verified_at: timestamptz`, `received_at: timestamptz`, `state: closed enum`, `operation_id: uuid`. `provider` and `external_event_id` are non-empty, the digest is fixed-length, and `signature_verified_at` is required before `accepted`. Unique on provider/external event; invalid signatures never create trusted work. States are `received → accepted`, `duplicate` or `rejected`, then `processed` or `failed`; a duplicate never repeats the effect. Cardinality: many receipts may reference one `ProviderOperation`, per § Relationships.
- **`ProviderOperation`:** mutable and versioned; the model row declares `version: bigint` explicitly. Core fields `id: uuid`, `provider`, `operation_type: closed enum`, `actor_id: uuid`, `state: closed enum`, `intent_hash`, `provider_ref`, `last_attempt_at: timestamptz`, `reconciliation_at: timestamptz`, `version: bigint`. `intent_hash` is immutable, `provider_ref` is nullable and is not required for creation, `reconciliation_at` is nullable until evidence is checked, and state/version changes are compare-and-swap. Intent precedes the call; an ambiguous outcome stays pending. States are `planned → pending → confirmed`, `failed` or `manual_review`; reconciliation may resolve it once. Cardinality: one operation may reference many deduplicated `WebhookReceipt` records, and reconciliation updates only the matching current operation/version.
- **`ObjectRecord`:** mutable and versioned; the model row declares `version: bigint` explicitly. Core fields `id: uuid`, `bucket`, `object_key`, `owner_party_id: uuid`, `purpose`, `media_type`, `byte_size`, `checksum`, `state: closed enum`, `retention_class: closed enum`, `version: bigint`. The object key is server-generated and normalized, byte counts are non-negative, and the checksum uses an allowlisted algorithm. Unique on bucket/key; the database row governs the Storage object and it is usable only in verified state. States are `pending_upload → uploaded → verifying → ready`, `rejected` or `quarantined`; only `ready` is consumable. Cardinality: one `UploadIntent` authorizes one `ObjectRecord`.
- **`UploadIntent`:** mutable state row, unversioned — the only timestamp is `expires_at`. Core fields `id: uuid`, `object_id: uuid`, `actor_id: uuid`, `max_bytes`, `allowed_media_types`, `expires_at: timestamptz`, `state: closed enum`. Expiry cannot exceed 15 minutes from creation and the intent cannot authorize after expiry. Cardinality: single object target — one intent authorizes exactly one `ObjectRecord`.
- **`AuditEvent`:** append-only — UPDATE and DELETE are revoked, so it carries no `state`, no `version` and no `updated_at`, and its only timestamp is `occurred_at`. Core fields `id: uuid`, `action`, `actor_id: uuid` nullable, `acting_party_id: uuid`, `target_type`, `target_id: uuid`, `decision`, `reason_code`, `correlation_id: uuid`, `occurred_at: timestamptz`. `decision` is the closed enum `allowed | denied | completed | failed`; the actor may be null only for named system principals. Excludes secrets, bodies, payment/evidence data and private content. Cardinality: one protected command writes one or more rows.

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

A denial always returns a typed reason and preserves canonical state, and the error code identifies which decision refused — authentication, acting-context resolution, authorization, semantic validation and persistence are distinct decisions with distinct error codes. Shard 00 declares no dependencies, so it owns no case path, no capability-grant path and no support-recovery path, and names none: where a denial turns on domain authority or contested evidence, the resolution path belongs to the domain shard that owns the disputed authority and is stated there. The four machine principals below have no human escalation route at all.

- **Anonymous browser:** a denial is a typed refusal that leaks no existence of non-public rows. The only forward path is the authentication entry point; no route promotes anonymous access to a private row, a signed private object, an acting context or a protected command.
- **Authenticated user:** a denial is a typed refusal under the server capability check and RLS, and supplying another party's or resource's ID emits sanitized security telemetry. Identity alone grants no organization or party authority, so the forward path is to be granted acting-party authority by the party that holds it — never a wider grant at the infrastructure layer.
- **Acting-party principal:** the typed error code names which check refused; mandate, NDA, visibility and commercial authority are each re-evaluated per request. The party ID is never accepted from client trust, so a denial is not recoverable by resubmitting a different party ID — the forward path is a change to the underlying membership or mandate in the shard that records it.
- **Internal capability operator:** a missing step-up returns `STEP_UP_REQUIRED` and is recovered by re-authenticating; a missing capability returns `FORBIDDEN` and is recovered only by being granted the explicit internal capability, never by a blanket bypass. Reason, target, decision and actor are audited on the denial as well as the allow, without storing protected request content.
- **Queue/schedule principal:** no human escalation route exists. A refused message is not executed: the consumer re-reads canonical state and version rather than trusting the Queue envelope, a stale or out-of-order version is ignored or reconciled and never regresses canonical state, and an unknown `schemaVersion` dead-letters to manual review without execution. Recovery is replay, which creates new attempt evidence while preserving original event identity and business idempotency.
- **Provider webhook:** no human escalation route exists and no grant can be issued to a provider endpoint. An invalid signature never creates a trusted receipt or trusted work, and a valid signature outside the provider replay window is rejected without exposing signature-oracle detail. Recovery is provider-side redelivery — deduplicated by receipt identity so the business effect still occurs once — or the poll/webhook reconciliation path of INF-10.
- **Deployment principal:** no escalation route exists beyond the protected approval itself. A failed CI gate — contracts, tests, security, accessibility, build, migrations, route/consumer SLO registration or artifact identity — fails before promotion and is cleared only by a new artifact through the same gates. A migration that fails after expansion stops promotion, leaves the old code compatible and runs no destructive rollback migration; rollback restores artifact and configuration and never erases committed business effects. The principal cannot mutate business data outside migration and runbook contracts.
- **Service role:** no human escalation route exists. A denial is a typed refusal to the calling server path; the role is never exposed to the browser and its use is isolated, logged, reviewed and BOLA-tested rather than widened. Where maintenance or recovery genuinely requires it, the action runs as the announced INF-12 runbook with restore integrity, RLS and RPC checks, not as an ad-hoc elevation.

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
| Production-verified recovery evidence missing | Disable protected production writes for money/rights/publication and escalate via runbook. |
| Scheduled maintenance | Announce ≥48 hours before exclusion; display truthful scope/status; otherwise count outage against objective. |
| Unplanned outage | Counts fully against the internal 99.9% objective; no provider uptime SLA or excluded error-budget category is assumed. |
| Recovery restores data but RLS/RPC checks fail | Keep service/protected writes closed until integrity and authorization checks pass. |

## Observability and Assurance

- `@wejammin/observability` emits one newline-delimited JSON object per event with timestamp, severity, service, environment, event name, request/correlation/causation/trace IDs, job/attempt IDs when present, entity type/ID/version when safe, duration, outcome, and sanitized error code.
- Logs never contain secrets, credentials, session tokens, raw request/response bodies, direct PII, payment data, evidence, or private content. Third-party PII collection and session replay are absent; structured diagnostics use allowlisted fields only.
- Sampling retains 100% of errors and high-risk operations, 10% of ordinary authentication success, and 1% of public/cache success. provider-native diagnostic sinks receive exceptions and sampled spans, not the full log stream.
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
| INF-01 Public read | Reads acquire no `Idempotency-Key` and take no lock, so concurrent public reads cannot conflict and none is serialized against another; only explicitly safe responses are cacheable and public caching is allowlist-only. | Zod validates inputs before the handler runs and the handler reads only public projections; a refusal is typed and leaks no existence of non-public rows. | Not a data-owning flow: the read path creates no state and retains no evidence. A deleted or revoked source leaves the public projection and nothing cascades from the read. |
| INF-02 Authenticated read | Reads acquire no `Idempotency-Key` and take no lock; mutable reads return `ETag: "<version>"` so a later protected mutation can detect that the version this read observed is stale. | The Supabase session is verified server-side, acting context is resolved server-side, then RLS denies rows outside the resolved authority; a valid user supplying another party or resource ID is denied under the capability check and RLS with sanitized security telemetry. | Not a data-owning flow. Revoked authority and deleted rows stop being readable on the next request because every read re-resolves acting context and re-evaluates RLS, and private responses are `no-store` so no cached private copy survives. |
| INF-03 Protected command | `Idempotency-Key` is bound to actor, operation and normalized request hash: the same binding returns the original result and mismatched content returns 409 without executing or replacing it. `If-Match` must carry the exact quoted version and the database verifies it inside the same transaction, so competing writers serialize — the loser receives 409 with sanitized current-version guidance and no partial effect. | Boundary validation precedes authorization and each decision returns a distinct code: malformed JSON 400, unsupported media type 415, valid JSON with invalid semantics 422, stale authority a typed refusal. No canonical mutation occurs on refusal. | Canonical state, `AuditEvent` and `OutboxEvent` commit in one transaction, so a deletion carries append-only audit evidence and one or more immutable outbox events; consumers deduplicate, re-read the current aggregate/version and apply the dependent effect exactly once. |
| INF-04 High-risk/admin command | INF-03's idempotency binding and `If-Match` version check apply unchanged; step-up weakens neither. | INF-03 plus recent step-up authentication and an explicit internal capability — user-facing role labels never grant authority alone, and a forged acting-party ID or user-editable JWT role is ignored, resolved server-side, denied on mismatch and recorded as sanitized abuse telemetry. | Decision, reason, target and actor are audited without storing protected request content, and audit rows are append-only with UPDATE/DELETE revoked, so the evidence of a destructive administrative action cannot itself be removed. |
| INF-05 Long-running job | Lease changes are version-checked and only one canonical terminal result exists; a worker that dies while leased loses the lease on expiry and a later attempt resumes from canonical state. Terminal states cannot reopen. | The bounded command validates and authorizes before committing the job; workers re-read canonical state and version rather than trusting the Queue envelope, and an unknown event schema version dead-letters without execution. | The terminal result is immutable. Terminal attempt detail is retained 30 days, and replay creates new attempt evidence while preserving original event identity and business idempotency. |
| INF-06 Object upload | `ObjectRecord` is unique on bucket/key with server-generated keys, and one `UploadIntent` authorizes exactly one `ObjectRecord`, so concurrent uploads cannot both claim a key; state advances only along `pending_upload → uploaded → verifying → ready`, `rejected` or `quarantined`. | The signed URL is bound to actor, object intent, maximum bytes, allowed media type and one target key and cannot authorize after its 15-minute expiry; a key containing traversal or control characters is rejected before signing; the object is usable only after size/type/checksum/state validation. | The database row governs the Storage object: bytes without valid governing metadata or a matching checksum are quarantined or removed under the retention class and are never exposed to consumers. |
| INF-07 Offline intent | The local intent holds no key and no lock; on reconnect the server assigns the operation UUID and revalidates the expected version before accepting, after which the accepted intent follows INF-03/05 idempotency and `If-Match` rules. | Identity, authority, version and request content are all revalidated server-side on reconnect; a stale or unauthorized intent is refused and remains visible and retryable rather than being silently discarded or silently applied. | A local intent is never canonical. If its target was deleted or its authority revoked while offline, revalidation refuses it and no canonical state is written, so no orphan is created. |
| INF-08 Realtime hint | The hint carries only an entity/event identifier and is non-authoritative, so duplicated, reordered or interleaved hints cannot conflict; correctness comes from the client refetching the canonical resource and its version. | The UI updates only from authorized canonical data, so a hint naming a resource the actor cannot read yields nothing on refetch and discloses nothing. | Not a data-owning flow. A missed or duplicated hint is recovered by poll or navigation refetch and never determines correctness; a deletion is observed on the canonical refetch, not from the hint. |
| INF-09 Inbound webhook | Receipt identity is deduplicated on provider and external event ID — `received → accepted`, `duplicate` or `rejected`, then `processed` or `failed` — and a duplicate never repeats the effect, so concurrent redeliveries collapse to one. | Raw bytes are signature-checked within the provider replay window before parsing: an invalid signature never creates a trusted receipt or trusted work, and a valid signature outside the window is rejected without exposing signature-oracle detail. | A `WebhookReceipt` is dedupe evidence, not canonical business state; the raw protected payload is never logged, and reconciliation updates only the matching current operation and version. |
| INF-10 Provider effect | Local operation UUID, intent and idempotency commit before the network call; `intent_hash` is immutable and state/version changes are compare-and-swap, so a concurrent attempt cannot produce a second provider effect. | The worker sends the minimum contract and records attempt evidence; a timed-out or ambiguous send stays `pending` and is never blindly resent, resolving only through provider idempotency, webhook or poll reconciliation. | Provider identifiers are reconciliation attributes, not canonical identity. An operation that cannot be reconciled ends in `failed` or `manual_review` rather than being deleted, and its many deduplicated `WebhookReceipt` records remain as evidence. |
| INF-11 Release promotion | Promotion is not idempotency-keyed: one immutable artifact moves preview → staging → production and protected approval promotes that same artifact. Migrations are forward-only, so a migration that fails after expansion stops promotion while the old code remains compatible and no destructive rollback migration runs. | CI rejects duplicate registrations, missing owners/contracts/runbooks, unbounded retries, unknown SLO tiers and protected routes without BOLA test declarations, and fails before promotion when a new route or consumer lacks SLO registration; production requires protected approval under environment-scoped credentials. | Not a data-owning flow and it has no owner cascade. Rollback restores artifact and configuration only and never erases committed business effects; the deployment principal cannot mutate business data outside migration and runbook contracts. |
| INF-12 Maintenance/recovery | Not idempotency-keyed. Protected writes are the unit of control: they stay disabled while production-verified recovery evidence is missing and until restore integrity, RLS and RPC checks pass. | Scheduled maintenance is announced at least 48 hours ahead with truthful scope and status; available synthetic/local and production recovery evidence are checked, the runbook is followed, and restore integrity, RLS and RPC checks are validated before service resumes. | Not a data-owning flow and it has no owner cascade. A restore that returns data but fails RLS or RPC checks keeps service and protected writes closed, and audit rows remain append-only across recovery so recovery cannot erase evidence. |

## Cross-Shard Dependencies

- **Depends on:** None.
- **Depended on by:** Shards 01–42. Every downstream specification must reference the applicable contracts rather than redefine or weaken them.

## Deep Dives Needed

- None. Shard 00 remains a single cross-cutting specification because its six areas form one mandatory request, persistence, effect, and operations chain.

### Cross-Shard Section Contract Map

- **Shard 01 — Identity authority and party governance:** consume [Shard 01 — Identity authority and party governance Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 — Identity authority and party governance Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-02 | Complete design pass from approved architecture, standards, data placement, runbooks, and design system | /write-architecture-spec-design | All |
| 2026-08-02 | Deepening passes converged; transport, field, registry, event, observability, and abuse-path decisions made deterministic | /write-architecture-spec-deepen | Contracts, Data Models, Event Schemas, Edge Cases, Observability |
| 2026-08-05 | Registry re-derived to the eight declared entities (A-26); access escalation differentiated per principal (A-27); edge-case matrix given per-flow content (A-28) | /resolve-ambiguity | Data Models, Access Control, Edge-Case Coverage Matrix |
| 2026-08-05 | F1 — added per-flow Preconditions and Failure / recovery; regenerated acceptance criteria | /resolve-ambiguity | Acceptance Criteria, Interactions |

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
