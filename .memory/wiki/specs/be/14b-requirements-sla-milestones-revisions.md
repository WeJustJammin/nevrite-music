# Requirements, SLA, Milestones & Revisions — Backend Specification

**Status:** Complete
**IA source:** [Shard 14 — Services marketplace lifecycle](../ia/14-services-marketplace.md)
**Deep-dive source:** [Deep Dive 14 — Services marketplace lifecycle](../ia/deep-dives/14-services-marketplace.md)
**Backend foundation:** [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md)

## Split Group

This split owns the requirements gate, SLA clock transitions, milestone deliveries, revision rounds/notes, and change-order acceptance. It contains SRV-05–SRV-09 and consumes the pinned `engagement` created by 14a. Final delivery, acceptance, exit, recall, supply, rights, and custody commands remain in sibling specifications.

## Classification

- **Type:** engagement-state command split with payment and timer seams.
- **Boundary:** `requirement_item`, `requirement_submission`, `sla_clock_event`, `milestone`, `milestone_delivery`, `revision_round`, `revision_note`, and `change_order` persistence.
- **Expected operations:** five HTTP operations, one-to-one with IA interactions SRV-05, SRV-06, SRV-07, SRV-08, and SRV-09.
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** requirements are frozen at acceptance, revision allowances decrement only on valid redelivery, and a pending change order never pauses the auto-accept clock.

## Referenced Material Inventory

| Source file | Section / lines | Material used in this specification |
|---|---|---|
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Features, lines 26–35 | Feature IDs `05.03` and `05.04`, requirements/SLA/milestone/revision scope. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Interactions, lines 58–90 | SRV-05–SRV-09 preconditions, state transitions, failure outcomes, and gates. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Contracts, lines 121–146 | Requirements gate, milestone, revision, and change-order contracts. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Data Models, lines 162–181 | `requirement_item`, `requirement_submission`, `sla_clock_event`, `milestone`, `milestone_delivery`, `revision_round`, `revision_note`, and `change_order`. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Access Control, lines 214–237 | Buyer/seller/contributor/worker authority for gates and work. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Event Schemas, lines 250–257 | `service.requirements.changed.v1`, `service.engagement.changed.v1`, and `service.delivery.changed.v1`. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Edge Cases, lines 265–291 | Rejection-round deadlock, SLA pause race, revision race, incomplete delivery, and pending change order. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | State Machines, lines 35–44 | Engagement, requirement, milestone, revision, and change-order transitions. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Requirements and SLA Algorithm, lines 56–66 | Frozen checklist, all-or-nothing gate, three rejection rounds, and clock accounting. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Revision and Change-Order Algorithm, lines 67–77 | Anchored notes, allowance decrement, mini-quote, and expiry behavior. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Delivery and Atomic Acceptance Algorithm, lines 78–89 | Complete milestone artifact set and QC boundary. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Request/Response Contracts, lines 112–201; Deterministic Protocol Rules, lines 330–353 | Zod 4, global `ApiError`, idempotency, ETag, body limits, and worker semantics. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Middleware & Policies, lines 253–298; Event and Consumer Contracts, lines 355–416 | Hono order, CORS, RLS, outbox, and timer/provider recovery. |
| `.memory/wiki/specs/2026-08-02-architecture-design.md` | Data Strategy, lines 636–706; Security Model, lines 709–790 | Supabase transaction boundary, PII/evidence separation, and abuse controls. |

## IA Source Map

| BE section | IA source / trace |
|---|---|
| Routes and interaction mapping | Shard 14 IA `§ Interactions`, lines 58–90 |
| Gate, clock, milestone, revision, and change-order contracts | Shard 14 IA `§ Contracts`, lines 121–146; deep dive `§ Requirements and SLA Algorithm`, lines 56–66; `§ Revision and Change-Order Algorithm`, lines 67–77 |
| Persistence and transitions | Shard 14 IA `§ Data Models`, lines 162–181; deep dive `§ State Machines`, lines 35–44 |
| Authority and edge recovery | Shard 14 IA `§ Access Control`, lines 214–237; `§ Edge Cases`, lines 265–291 |
| Event payloads | Shard 14 IA `§ Event Schemas`, lines 250–257 |
| Shared API behavior | BE00 `§ Request/Response Contracts`, lines 112–201; `§ Deterministic Protocol Rules`, lines 330–353 |

## Endpoint Completeness Reconciliation

| IA interaction | BE operation ID | Method and path | Result |
|---|---|---|---|
| SRV-05 Satisfy requirements gate | SRV-REQ-API-01 | `POST /api/v1/services/engagements/{engagementId}/requirements` | Reconciled: validates the frozen checklist atomically and records accepted/rejected/deadlock outcome. |
| SRV-06 Start/pause SLA | SRV-REQ-API-02 | `POST /api/v1/services/engagements/{engagementId}/sla-clock` | Reconciled: append-only start/pause/resume/stop event with CAS and effective-clock projection. |
| SRV-07 Deliver milestone | SRV-REQ-API-03 | `POST /api/v1/services/engagements/{engagementId}/milestones/{milestoneId}/deliver` | Reconciled: complete frozen artifact set, declarations, QC state, and sequential milestone transition. |
| SRV-08 Request revision | SRV-REQ-API-04 | `POST /api/v1/services/deliveries/{deliveryId}/revisions` | Reconciled: one or more anchored notes, bounded round/time, and allowance decrement only on valid redelivery. |
| SRV-09 Accept change order | SRV-REQ-API-05 | `POST /api/v1/services/change-orders/{changeOrderId}/accept` | Reconciled: exact mini-quote acknowledgement, expiry/payment/scope delta, and no auto-clock pause. |

## API Endpoints

### Route Registry

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| SRV-REQ-API-01 | POST | `/api/v1/services/engagements/{engagementId}/requirements` | SRV-05 | Assigned buyer approver or seller worker submits/reviews only its side | `200` gate projection |
| SRV-REQ-API-02 | POST | `/api/v1/services/engagements/{engagementId}/sla-clock` | SRV-06 | Authorized worker/party for the awaited action | `200` clock projection |
| SRV-REQ-API-03 | POST | `/api/v1/services/engagements/{engagementId}/milestones/{milestoneId}/deliver` | SRV-07 | Assigned seller/contributor within engagement mandate | `201` milestone delivery |
| SRV-REQ-API-04 | POST | `/api/v1/services/deliveries/{deliveryId}/revisions` | SRV-08 | Eligible buyer approver or authorized reviewer | `201` revision round |
| SRV-REQ-API-05 | POST | `/api/v1/services/change-orders/{changeOrderId}/accept` | SRV-09 | Buyer approver for the engagement; seller cannot self-accept buyer delta | `200` accepted change order |

### Transport and external seams

All routes use HTTPS JSON, `X-Request-Id`, `Idempotency-Key`, optional `If-Match`, strict body limits, and BE00 error/outbox conventions. Upload bytes use BE00 upload intents; this split stores only artifact references and hashes.

| Seam | Exact request | Exact response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---|---:|---|---|
| BE00 timer service | `{ engagementId: uuid, clockEventId: uuid, dueAt: RFC3339, command: 'sla-expire'|'auto-accept' }` | `{ timerId: uuid, state: 'scheduled'|'cancelled' }` | 500 ms | 2 retries at 100 ms, 250 ms; idempotent timer key | Open after 5 failures/30 s; committed clock remains authoritative and reconciliation re-enqueues. |
| BE00 upload/QC intent | `{ artifactId: uuid, objectKey: string, sha256: hex64, byteLength: int64, mime: string }` | `{ artifactId: uuid, scan: 'clean'|'quarantined'|'pending', verifiedHash: hex64 }` | 1,500 ms | 2 retries at 200 ms, 500 ms; same artifact key | Open 45 s; pending/quarantined cannot satisfy a complete delivery; worker retries scan. |
| BE00 payment delta authorization (SRV-REQ-API-05) | `{ changeOrderId: uuid, amountMinor: int64, currency: string, idempotencyKey: string }` | `{ authorizationId: uuid, status: 'authorized'|'pending'|'declined' }` | 2,000 ms | 2 retries at 250 ms, 500 ms; provider-safe idempotency | Open 60 s; pending change order stays unaccepted and clock continues. |
| Shard 01 capability/acting context | `{ actorPersonId: uuid, actingPartyId: uuid, contextVersion: string, capability: string }` | `{ allowed: boolean, contextVersion: string }` | 500 ms | 2 retries at 75 ms, 150 ms | Open 30 s; stale/unknown is `ACTING_CONTEXT_STALE`, never allow. |

## Request/Response Contracts

All schemas are Zod 4. Every error body is the BE00/global `ApiError { code, message, requestId, details }` envelope.

### Shared and operation schemas

```ts
type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const RequirementValue = z.union([z.string().trim().max(2000), z.number().finite(), z.boolean(), z.array(z.string().trim().max(200)).min(1).max(32), z.object({ kind: z.enum(["text", "number", "boolean", "selection", "date"]), value: z.union([z.string().trim().max(2000), z.number().finite(), z.boolean()]) }).strict()]);
const CommandContext = z.object({
  actor_person_id: z.string().uuid(), acting_party_id: z.string().uuid(), acting_context_version: z.string().min(1).max(128),
  idempotency_key: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/), request_id: z.string().uuid(), expected_version: z.number().int().positive().optional(),
}).strict();
const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: z.string().uuid(), details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict(); // ApiError { code, message, requestId, details }

const RequirementsRequest = CommandContext.extend({
  submissions: z.array(z.object({ requirement_item_id: z.string().uuid(), value: RequirementValue, evidence_artifact_ids: z.array(z.string().uuid()).max(16), client_version: z.number().int().positive() }).strict()).min(1).max(128),
  decision: z.enum(['submit', 'accept', 'reject']), rejection_reason: z.string().trim().min(1).max(1000).optional(),
}).strict();
const RequirementsSuccess = z.object({ engagement_id: z.string().uuid(), state: z.enum(['requirements', 'active', 'buyer_wait', 'seller_work', 'abandoned', 'cancelled']), gate: z.enum(['open', 'accepted', 'rejected', 'deadlocked']), rejection_round: z.number().int().min(0).max(3), version: z.number().int().positive(), event_id: z.string().uuid() }).strict();

const SlaClockRequest = CommandContext.extend({ action: z.enum(['start', 'pause', 'resume', 'stop']), reason_code: z.string().regex(/^[a-z0-9_-]{1,48}$/), expected_clock_version: z.number().int().positive() }).strict();
const SlaClockSuccess = z.object({ engagement_id: z.string().uuid(), clock_state: z.enum(['running', 'paused', 'stopped']), elapsed_ms: z.number().int().nonnegative(), clock_version: z.number().int().positive(), event_id: z.string().uuid() }).strict();

const MilestoneDeliveryRequest = CommandContext.extend({
  milestone_id: z.string().uuid(), artifact_ids: z.array(z.string().uuid()).min(1).max(64), declarations: z.array(z.object({ kind: z.enum(['originality', 'source_warranty', 'performance']), value: z.string().min(1).max(2000) }).strict()).min(1).max(16), client_hash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
const MilestoneDeliverySuccess = z.object({ delivery_id: z.string().uuid(), milestone_id: z.string().uuid(), state: z.enum(['submitted', 'qc_pending', 'qc_failed', 'accepted']), version: z.number().int().positive(), event_id: z.string().uuid() }).strict();

const RevisionRequest = CommandContext.extend({
  delivery_id: z.string().uuid(), notes: z.array(z.object({ artifact_id: z.string().uuid(), anchor: z.string().min(1).max(256), category: z.enum(['scope', 'quality', 'technical', 'declaration']), body: z.string().trim().min(1).max(2000) }).strict()).min(1).max(32), expected_round: z.number().int().positive(), client_version: z.number().int().positive(),
}).strict();
const RevisionSuccess = z.object({ revision_round_id: z.string().uuid(), delivery_id: z.string().uuid(), note_count: z.number().int().positive(), allowance_remaining: z.number().int().nonnegative(), due_at: z.string().datetime(), version: z.number().int().positive(), event_id: z.string().uuid() }).strict();

const ChangeOrderRequest = CommandContext.extend({ change_order_id: z.string().uuid(), expected_change_order_version: z.number().int().positive(), terms_hash: z.string().regex(/^[a-f0-9]{64}$/), buyer_acknowledged: z.literal(true), payment_delta_confirmed: z.literal(true) }).strict();
const ChangeOrderSuccess = z.object({ change_order_id: z.string().uuid(), state: z.literal('accepted'), payment_authorization_id: z.string().uuid().nullable(), allowance_delta: z.number().int(), engagement_version: z.number().int().positive(), event_id: z.string().uuid() }).strict();
const ErrorResponse = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error schema/status |
|---|---|---|---|
| SRV-REQ-API-01 | `RequirementsRequest` | `RequirementsSuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-REQ-API-02 | `SlaClockRequest` | `SlaClockSuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-REQ-API-03 | `MilestoneDeliveryRequest` | `MilestoneDeliverySuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-REQ-API-04 | `RevisionRequest` | `RevisionSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-REQ-API-05 | `ChangeOrderRequest` | `ChangeOrderSuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation | Required validation and invariant |
|---|---|
| SRV-REQ-API-01 | Checklist is the frozen engagement schema; all required items must be present; each value/evidence matches its item schema; accept is all-or-nothing; rejection count is capped at three, then no-fault deadlock/full return/no kill fee. |
| SRV-REQ-API-02 | Only legal next clock action is accepted; action actor is responsible party; expected clock version matches; pause reason is closed and auditable; clock duration never goes negative. |
| SRV-REQ-API-03 | Milestone is next sequential milestone unless contract explicitly permits parallelism; artifact set is complete, hashes clean, declarations present; QC failure is not delivery; rights stay unexecuted before final acceptance. |
| SRV-REQ-API-04 | At least one exact artifact anchor/note; round and time allowance remain; duplicate note anchors are rejected; a valid redelivery is the only event that decrements allowance. |
| SRV-REQ-API-05 | Exact mini-quote hash/version; expiry is future; scope/payment/allowance deltas are bounded; omitted allowance delta is stored as zero; pending change order does not pause auto-accept. |

### Error, authorization, idempotency, rate, and observability matrix

| Operation | Status/code matrix (all bodies are `ApiError { code, message, requestId, details }`) | Authorization and 403/404 rule | Idempotency / rate / observability |
|---|---|---|---|
| SRV-REQ-API-01 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 ENGAGEMENT_NOT_FOUND`; `409 VERSION_CONFLICT`/`REVISION_RACE`/`IDEMPOTENCY_MISMATCH`; `422 REQUIREMENTS_INCOMPLETE`/`QC_FAILED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides an engagement outside party scope; 403 when a visible party lacks assigned gate authority | 24h key per engagement/version; 30 submissions/min/party; metrics for gate state/round/latency, notes and evidence redacted. |
| SRV-REQ-API-02 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 ENGAGEMENT_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 ACTING_CONTEXT_STALE`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 for hidden engagement; 403 for visible engagement with wrong actor or action | 24h key + expected clock version; 60 events/min/engagement; trace clock version, elapsedMs, and timer ID. |
| SRV-REQ-API-03 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 MILESTONE_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 DELIVERY_INCOMPLETE`/`QC_FAILED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 for milestone not in party projection; 403 for visible milestone outside seller/contributor mandate | 24h key per milestone/hash; 20 deliveries/hour/engagement; trace artifact IDs/hashes only, not content. |
| SRV-REQ-API-04 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 DELIVERY_NOT_FOUND`; `409 REVISION_RACE`/`VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 REQUIREMENTS_INCOMPLETE`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 for hidden delivery; 403 for actor not assigned as buyer approver/reviewer | 24h key per delivery/round; 30 requests/hour/buyer; trace round, allowance, anchor hashes; redact note body. |
| SRV-REQ-API-05 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 CHANGE_ORDER_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 QUOTE_EXPIRED`/`PAYMENT_AUTH_FAILED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides change order outside buyer scope; 403 for seller or non-approver | 24h key bound to terms hash; 20 accepts/hour/buyer; trace changeOrderId, termsHash, payment status, and clock dueAt. |

## Database Schema

### PostgreSQL model registry

| Canonical model | Typed fields, nullability, constraints, foreign keys, and indexes |
|---|---|
| `requirement_item` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id ON DELETE RESTRICT`; `ordinal smallint NOT NULL CHECK (ordinal>0)`; `key varchar(96) NOT NULL`; `value_schema jsonb NOT NULL CHECK (jsonb_typeof(value_schema)='object')`; `required boolean NOT NULL`; `state text NOT NULL CHECK (state IN ('pending','submitted','accepted','rejected'))`; `rejection_round smallint NOT NULL CHECK (rejection_round BETWEEN 0 AND 3)`; `due_at timestamptz NULL`; `created_at timestamptz NOT NULL`; unique `(engagement_id,ordinal)`; indexes `(engagement_id,ordinal)`, `(engagement_id,state)`. RLS: both parties for assigned items; direct client grants none. |
| `requirement_submission` | `id uuid PK`; `requirement_item_id uuid NOT NULL FK requirement_item.id`; `submitted_by_party_id uuid NOT NULL FK party.id`; `value jsonb NOT NULL`; `evidence_artifact_ids jsonb NOT NULL CHECK (jsonb_typeof(evidence_artifact_ids)='array')`; `submission_hash bytea NOT NULL CHECK (octet_length(submission_hash)=32)`; `round smallint NOT NULL CHECK (round BETWEEN 1 AND 3)`; `state text NOT NULL CHECK (state IN ('submitted','accepted','rejected'))`; `submitted_at timestamptz NOT NULL`; `reviewed_at timestamptz NULL`; index `(requirement_item_id,submitted_at DESC)`, `(submitted_by_party_id,submitted_at DESC)`. RLS: item parties; evidence bytes stay in BE00 storage. |
| `sla_clock_event` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id`; `action text NOT NULL CHECK (action IN ('start','pause','resume','stop'))`; `reason_code varchar(48) NOT NULL`; `actor_person_id uuid NOT NULL FK person.id`; `acting_context_version varchar(128) NOT NULL`; `occurred_at timestamptz NOT NULL`; `expected_clock_version integer NOT NULL CHECK (>0)`; `idempotency_key varchar(128) NOT NULL`; unique `(engagement_id,idempotency_key)`; index `(engagement_id,occurred_at)`. RLS: parties read safe projection, worker append only. |
| `milestone` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id`; `ordinal smallint NOT NULL CHECK (ordinal>0)`; `name varchar(140) NOT NULL`; `due_at timestamptz NOT NULL`; `tranche_amount numeric(12,2) NOT NULL CHECK (tranche_amount>=0)`; `revision_allowance smallint NOT NULL CHECK (revision_allowance BETWEEN 0 AND 20)`; `state text NOT NULL CHECK (state IN ('pending','active','delivered','accepted','rejected','cancelled'))`; `version integer NOT NULL CHECK (>0)`; unique `(engagement_id,ordinal)`; indexes `(engagement_id,state)`, `(due_at) WHERE state IN ('active','delivered')`. RLS: engagement parties; no direct mutation after acceptance. |
| `milestone_delivery` | `id uuid PK`; `milestone_id uuid NOT NULL FK milestone.id`; `engagement_id uuid NOT NULL FK engagement.id`; `artifact_ids jsonb NOT NULL CHECK (jsonb_typeof(artifact_ids)='array' AND jsonb_array_length(artifact_ids)>0)`; `declarations jsonb NOT NULL`; `client_hash bytea NOT NULL CHECK (octet_length(client_hash)=32)`; `state text NOT NULL CHECK (state IN ('submitted','qc_pending','qc_failed','accepted'))`; `submitted_at timestamptz NOT NULL`; `accepted_at timestamptz NULL`; `version integer NOT NULL CHECK (>0)`; unique `(milestone_id,version)`; index `(engagement_id,submitted_at DESC)`. RLS: parties safe projection; artifacts via signed BE00 URLs. |
| `revision_round` | `id uuid PK`; `delivery_id uuid NOT NULL FK milestone_delivery.id`; `engagement_id uuid NOT NULL FK engagement.id`; `ordinal smallint NOT NULL CHECK (ordinal>0)`; `opened_at timestamptz NOT NULL`; `due_at timestamptz NOT NULL`; `allowance_before smallint NOT NULL CHECK (allowance_before>=0)`; `allowance_after smallint NOT NULL CHECK (allowance_after>=0 AND allowance_after<=allowance_before)`; `state text NOT NULL CHECK (state IN ('open','redelivered','accepted','expired','closed'))`; `version integer NOT NULL CHECK (>0)`; unique `(delivery_id,ordinal)`; indexes `(engagement_id,state)`, `(due_at) WHERE state='open'`. RLS: parties and assigned reviewer. |
| `revision_note` | `id uuid PK`; `revision_round_id uuid NOT NULL FK revision_round.id`; `artifact_id uuid NOT NULL`; `anchor varchar(256) NOT NULL`; `category text NOT NULL CHECK (category IN ('scope','quality','technical','declaration'))`; `body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000)`; `note_hash bytea NOT NULL CHECK (octet_length(note_hash)=32)`; `created_by_party_id uuid NOT NULL FK party.id`; `resolved_at timestamptz NULL`; `created_at timestamptz NOT NULL`; index `(revision_round_id,created_at)`, `(artifact_id,anchor)`. RLS: buyer/reviewer read and seller scoped read; no public projection. |
| `change_order` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id`; `source_revision_round_id uuid NULL FK revision_round.id`; `terms_hash bytea NOT NULL CHECK (octet_length(terms_hash)=32)`; `scope_delta jsonb NOT NULL`; `payment_delta numeric(12,2) NOT NULL`; `currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$')`; `allowance_delta smallint NOT NULL DEFAULT 0 CHECK (allowance_delta BETWEEN -20 AND 20)`; `expires_at timestamptz NOT NULL`; `state text NOT NULL CHECK (state IN ('pending','accepted','declined','expired'))`; `version integer NOT NULL CHECK (>0)`; `payment_authorization_id uuid NULL`; `created_at timestamptz NOT NULL`; indexes `(engagement_id,state)`, `(expires_at) WHERE state='pending'`; unique `(engagement_id,terms_hash)`. RLS: buyer/seller safe terms projection; payment reference service-only. |

### State, transaction, grants, and RLS rules

Requirements acceptance locks the checklist and advances the engagement under serializable CAS. A third rejection round writes terminal `deadlocked`, schedules full return with no kill fee, and cannot be overwritten by a stale client. Clock events append first, then update a derived clock projection; duplicate events are idempotent. Milestone delivery requires complete artifact/QC evidence; acceptance releases only the milestone tranche and stage credit, never final rights. Revision creation and change-order acceptance lock the delivery/engagement row. A valid redelivery decrements allowance exactly once; a pending change order leaves the auto-accept timer unchanged. RLS permits party-scoped projections and service-worker commands only; `anon` and browser direct table grants are denied.

## Middleware & Policies

| Operation | Allowed authority | 403 condition | 404 condition | Middleware and CORS policy |
|---|---|---|---|---|
| SRV-REQ-API-01 | Assigned buyer/seller gate actor | Visible engagement but actor not assigned to submit/review | Engagement not in actor projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(256KiB) → contentType(json) → rateLimit(requirements) → auth → actingContext → zod(RequirementsRequest) → engagement ownership → gate policy → idempotency → If-Match → handler → audit/outbox`. |
| SRV-REQ-API-02 | Responsible party/worker for awaited action | Visible engagement with wrong clock authority | Hidden or unknown engagement | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(32KiB) → contentType(json) → rateLimit(clock) → auth → actingContext → zod(SlaClockRequest) → clock authority → idempotency → CAS → timer seam → handler → audit/outbox`. |
| SRV-REQ-API-03 | Seller/contributor with engagement mandate | Visible milestone outside assigned work scope | Milestone not in party projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(64KiB) → contentType(json) → rateLimit(milestone-delivery) → auth → actingContext → zod(MilestoneDeliveryRequest) → mandate → artifact/QC gate → idempotency → If-Match → handler → audit/outbox`. |
| SRV-REQ-API-04 | Buyer approver/reviewer | Visible delivery but actor lacks review capability | Delivery not in party projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(128KiB) → contentType(json) → rateLimit(revision) → auth → actingContext → zod(RevisionRequest) → approver ownership → anchor/allowance policy → idempotency → If-Match → handler → audit/outbox`. |
| SRV-REQ-API-05 | Buyer eligible approver | Visible change order but seller/non-approver actor | Change order not in party projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(32KiB) → contentType(json) → rateLimit(change-order) → auth → actingContext → zod(ChangeOrderRequest) → buyer ownership → expiry/payment policy → idempotency → If-Match → payment seam → handler → audit/outbox`. |

## Data Flow

1. Validate actor context, party mandate, expected engagement/delivery version, and strict schema before loading protected values.
2. Lock the engagement aggregate and relevant requirement/milestone/revision row; evaluate state transition and all-or-nothing gate.
3. Write typed rows, derived version, audit record, and matching outbox event in one transaction. Timer scheduling and payment effects use idempotent effect records.
4. Deliver events after commit. Workers reconcile QC, timer, and payment pending states; no worker can broaden scope or rights.

## Events and Consumer Contracts

| Event type | Trigger and payload | Consumers / recovery |
|---|---|---|
| `service.requirements.changed.v1` | `{ eventId, occurredAt, engagementId, requirementItemIds, state, rejectionRound, deadlock: boolean, version, schemaVersion }`; no requirement free text or evidence bytes | Gate, SLA, notification, and return workers; dedupe by event ID and engagement version; 5 retries then dead-letter. |
| `service.engagement.changed.v1` | `{ eventId, occurredAt, engagementId, buyerPartyId, sellerPartyId, state, dueAt, paymentGate, version, schemaVersion }`; protected prices and credentials excluded | Parties/tasks and downstream services; stale versions are discarded and audited. |
| `service.delivery.changed.v1` | `{ eventId, occurredAt, deliveryId, engagementId, milestoneId, state, windowStart, windowEnd, qcState, artifactHash, version, schemaVersion }`; media bytes and private notes excluded | Acceptance/revision/payout workers; upload/QC pending is retried with deterministic delivery ID. |

## Error Handling and Failure Recovery

| Failure | Behavior |
|---|---|
| Incomplete gate | `422 REQUIREMENTS_INCOMPLETE`; no active transition; after three rejected rounds write deadlock and schedule full return/no kill fee. |
| Stale clock/milestone/revision | `409 VERSION_CONFLICT` or `REVISION_RACE`; reload and resubmit; no duplicate allowance/tranche. |
| Artifact missing/QC failure | `422 DELIVERY_INCOMPLETE` or `QC_FAILED`; delivery remains non-accepted and no tranche/rights release occurs. |
| Timer failure | Clock event remains committed; BE00 timer reconciliation retries; due computation uses append-only events, not client timestamps. |
| Payment delta unknown | Change order remains pending; auto-accept timer is not paused; provider reconciliation decides without duplicate charge. |
| Idempotency mismatch | `409 IDEMPOTENCY_MISMATCH`; original result retained and new payload rejected. |
| Outbox failure | Committed transaction is replayable by aggregate/version; dead-letter and page after five attempts. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract and handler tests | Authorization/RLS and failure tests |
|---|---|---|
| SRV-REQ-API-01 | Frozen checklist, all-or-nothing acceptance, three-round deadlock, evidence validation, CAS/idempotency | Buyer/seller gate authority, 403/404, RLS note/evidence redaction, timer/outbox recovery |
| SRV-REQ-API-02 | Legal clock transitions, elapsed duration, expected version, duplicate event, timer reconciliation | Responsible-party authority, 403/404, stale context, rate abuse, append-only clock RLS |
| SRV-REQ-API-03 | Sequential milestone, complete artifact/QC, declarations, tranche boundary, duplicate delivery | Seller/contributor mandate, 403/404, QC failure, upload timeout, artifact projection |
| SRV-REQ-API-04 | Anchored batch notes, round/time allowance, race, valid redelivery decrement, idempotent replay | Buyer/reviewer authority, 403/404, note privacy, revision race and outbox retry |
| SRV-REQ-API-05 | Mini-quote hash/expiry/payment delta, default zero allowance delta, non-pausing timer, CAS | Buyer approver versus seller, 403/404, payment pending/decline, protected terms RLS |

Cross-operation test-level matrix:

| Level | Required tests |
|---|---|
| Contract | Zod 4 valid/invalid fixtures for every operation; unknown keys, malformed anchors, empty notes, bad windows, false acknowledgements, and oversized arrays fail; snapshot `ApiError { code, message, requestId, details }`. |
| State/handler | Requirements all-or-nothing, three-round deadlock/full return, legal clock transitions, sequential milestone gate, QC boundary, revision allowance decrement, exact mini-quote expiry, and pending-order auto-accept behavior. |
| Concurrency | Competing gate decisions, pause/resume race, duplicate delivery, simultaneous revision requests, replays, and change-order acceptance use CAS/unique constraints. |
| Authorization/RLS | Buyer/seller/contributor/reviewer/worker/anonymous matrices; 403 versus 404; evidence and note projection redaction; direct table grant denial. |
| Integration | BE00 timer/upload/QC/payment seams honor timeout, retry, backoff, breaker, and reconciliation contracts. |
| Observability | Per-operation requestId/operationId/engagementId/version/result metrics; no free text, media bytes, payment credentials, or protected amounts in logs/events. |

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** closed states, UUIDs, bounded notes/arrays, complete artifact sets, round limits, and exact change-order hashes are schema-enforced.
- **Pass 2 — macro contract:** five IA interactions map one-to-one to routes; engagement and delivery ownership is explicit; timer/payment/upload seams are bounded.
- **Pass 3 — race/recovery:** CAS, unique idempotency, append-only clocks, QC pending, deadlock compensation, and non-pausing auto-accept behavior are deterministic.
- **Pass 4 — security/privacy:** party-scoped RLS, evidence references only, capability checks, named CORS, body limits, and redacted telemetry are per operation.

## Ambiguity Gate

**PASS.** SRV-05–SRV-09 are each mapped to a stable route and operation ID. Frozen requirements, clock transitions, milestone/QC behavior, revision allowance, and mini-quote semantics are concrete; every operation has strict Zod 4 request/success/error contracts, explicit CORS/auth/rate/validation middleware, 403-vs-404 behavior, idempotency, typed persistence, events, and failure recovery. No implementation decision remains open.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored requirements, SLA, milestones, revisions, and change-order backend split from IA Shard 14. | `/write-be-spec` | All |
| 2026-08-28 | Added per-operation Zod 4, CORS, authorization, persistence, timer/provider, event, and recovery contracts. | `/write-be-spec-write` | API, Database, Middleware, Events, Tests |

## Dependency References

- [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md): global `ApiError`, request IDs, idempotency, CAS/ETag, Hono middleware, RLS, upload/QC, timers, payment effects, and outbox.
- [14a — Service listings, quotes & engagements](14a-service-listings-quotes-engagements.md): pinned `engagement`, quote, party, scope, and recall terms consumed by these routes.
- [IA Shard 14](../ia/14-services-marketplace.md) and [Deep Dive 14](../ia/deep-dives/14-services-marketplace.md): canonical interaction, model, state, event, and algorithm truth.
- Shards 01, 07, 09, 10, and 18: mandate, taxonomy, project/delivery, rights, and credit/payment seams; no endpoint duplication.
