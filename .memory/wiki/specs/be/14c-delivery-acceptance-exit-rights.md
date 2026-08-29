# Delivery, Acceptance, Exit & Recall — Backend Specification

**Status:** Complete
**IA source:** [Shard 14 — Services marketplace lifecycle](../ia/14-services-marketplace.md)
**Deep-dive source:** [Deep Dive 14 — Services marketplace lifecycle](../ia/deep-dives/14-services-marketplace.md)
**Backend foundation:** [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md)

## Split Group

This split owns final delivery, explicit/automatic acceptance, exit settlement, recall-policy publication, recall allowance activation, and buyer recall requests. It contains SRV-10–SRV-13. It consumes the pinned engagement, milestone, artifact, and revision projections from 14a/14b; rights execution and specialized custody remain separate commands.

## Classification

- **Type:** delivery-to-settlement transactional split with payment, rights, credit, timer, and recall effects.
- **Boundary:** `delivery`, `delivery_artifact`, `acceptance`, `exit_settlement`, `recall_policy_version`, `recall_allowance`, and `recall` persistence.
- **Expected operations:** four HTTP operations, one-to-one with IA interactions SRV-10, SRV-11, SRV-12, and SRV-13. Seller recall acceptance is an authorized state transition in the SRV-13 workflow and has no separate public route.
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** acceptance is atomic across payment, rights, credits, and recall activation; exit legs are explicit; recall count is consumed only after timely seller acceptance.

## Referenced Material Inventory

| Source file | Section / lines | Material used in this specification |
|---|---|---|
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Features, lines 26–35 | Feature IDs `05.03`, `05.06`, and `05.07` delivery, rights, and recall scope. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Interactions, lines 58–90 | SRV-10–SRV-13 delivery, acceptance, exit, and recall commands. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Contracts, lines 133–146 | Final delivery, acceptance, exit settlement, recall policy, allowance, and recall rules. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Data Models, lines 181–202 | `delivery`, `delivery_artifact`, `acceptance`, `exit_settlement`, `recall_policy_version`, `recall_allowance`, and `recall`. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Access Control, lines 214–237 | Buyer, seller, platform taxonomy, worker, and reviewer authority. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Event Schemas, lines 253–261 | `service.delivery.changed.v1`, `service.acceptance.committed.v1`, `service.recall-policy.changed.v1`, `service.recall.changed.v1`, and `service.exit-settlement.changed.v1`. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Edge Cases, lines 265–291 | Auto-accept boundary, revision race, recall window, duplicate recall, exit, and provider failures. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Delivery and Atomic Acceptance Algorithm, lines 78–89 | Complete artifact set, QC, explicit/automatic acceptance, and atomic effects. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Exit Settlement Algorithm, lines 90–101 | Four exit kinds and named settlement legs. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Quote Acceptance and Engagement Creation, lines 45–55 | Pinned recall terms and engagement basis consumed at acceptance. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Abuse and Recovery Verification, lines 122–138 | Recall race, idempotent consumption, payment/rights rollback, and unknown provider effects. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Request/Response Contracts, lines 112–201; Deterministic Protocol Rules, lines 330–353 | Zod 4, `ApiError`, idempotency, ETag, timers, and bounded payloads. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Middleware & Policies, lines 253–298; Event and Consumer Contracts, lines 355–416 | Hono/CORS order, RLS, outbox, retries, and consumer recovery. |
| `.memory/wiki/specs/2026-08-02-architecture-design.md` | Integration Points, lines 916–937; Error Architecture, lines 578–633 | Payment, rights, credit seams and error propagation. |

## IA Source Map

| BE section | IA source / trace |
|---|---|
| Route registry and contracts | Shard 14 IA `§ Interactions`, lines 58–90; `§ Contracts`, lines 133–146 |
| Delivery/acceptance persistence | Shard 14 IA `§ Data Models`, lines 181–192; deep dive `§ Delivery and Atomic Acceptance Algorithm`, lines 78–89 |
| Exit and recall persistence | Shard 14 IA `§ Data Models`, lines 193–202; deep dive `§ Exit Settlement Algorithm`, lines 90–101 |
| Authorization and race behavior | Shard 14 IA `§ Access Control`, lines 214–237; `§ Edge Cases`, lines 265–291; deep dive `§ Abuse and Recovery Verification`, lines 122–138 |
| Event payloads | Shard 14 IA `§ Event Schemas`, lines 253–261 |
| Shared transport/effects | BE00 `§ Request/Response Contracts`, lines 112–201; `§ Deterministic Protocol Rules`, lines 330–353; `§ Event and Consumer Contracts`, lines 355–416 |

## Endpoint Completeness Reconciliation

| IA interaction | BE operation ID | Method and path | Result |
|---|---|---|---|
| SRV-10 Deliver final work | SRV-DEL-API-01 | `POST /api/v1/services/engagements/{engagementId}/deliveries/final` | Reconciled: complete frozen final artifact set and declarations enters QC/delivery state. |
| SRV-11 Accept/auto-accept | SRV-DEL-API-02 | `POST /api/v1/services/deliveries/{deliveryId}/accept` | Reconciled: explicit buyer accept and timer-authorized auto-accept converge through one atomic acceptance transaction. |
| SRV-12 Cancel/abandon/release | SRV-DEL-API-03 | `POST /api/v1/services/engagements/{engagementId}/exit` | Reconciled: computes four named settlement legs and commits one terminal exit state. |
| SRV-13 Open recall | SRV-DEL-API-04 | `POST /api/v1/services/recalls` | Reconciled: validates pinned policy/window and opens a buyer recall without consuming allowance until seller acceptance. |

## API Endpoints

### Route Registry

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| SRV-DEL-API-01 | POST | `/api/v1/services/engagements/{engagementId}/deliveries/final` | SRV-10 | Seller/contributor with final-work mandate | `201` delivery projection |
| SRV-DEL-API-02 | POST | `/api/v1/services/deliveries/{deliveryId}/accept` | SRV-11 | Buyer approver, or BE00 timer worker for auto-accept | `200` acceptance projection |
| SRV-DEL-API-03 | POST | `/api/v1/services/engagements/{engagementId}/exit` | SRV-12 | Buyer/seller party for permitted exit, or worker for timeout abandonment | `200` settlement projection |
| SRV-DEL-API-04 | POST | `/api/v1/services/recalls` | SRV-13 | Buyer on its terminal engagement; seller later accepts/declines in workflow | `201` recall projection |

`SRV-DEL-API-04` has an exact bucket of 5 `POST` requests per buyer, engagement, and recall allowance during that allowance's positive pinned window (`window_days` is 7–90 days). The bucket does not refill before `ends_at`; a duplicate idempotency replay does not consume a request, and a new bucket exists only for a new allowance/engagement. `Retry-After` reports seconds until the pinned window ends. Zero-count or closed allowances accept no request and return the typed exhaustion error.

### Transport and external seams

All routes use HTTPS JSON, `X-Request-Id`, `Idempotency-Key`, optional `If-Match`, strict body limits, and BE00 error/outbox conventions. Automatic acceptance is invoked by the BE00 timer worker with a signed internal principal; a browser cannot claim `kind: auto`.

| Seam | Exact request | Exact response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---|---:|---|---|
| BE00 storage/QC | `{ deliveryId: uuid, artifacts: [{ objectKey: string, sha256: hex64, byteLength: int64, mime: string }], declarationsHash: hex64 }` | `{ qcState: 'clean'|'failed'|'pending', artifactHash: hex64, failureCodes: string[] }` | 2,000 ms | 2 retries at 250 ms, 750 ms; idempotent delivery ID | Open 60 s; pending/failed never counts as delivery; worker retries and emits one version. |
| BE00 acceptance payment release | `{ engagementId: uuid, acceptanceId: uuid, authorizationId: uuid, idempotencyKey: string }` | `{ releaseId: uuid, status: 'released'|'pending'|'failed' }` | 2,000 ms | 3 retries at 250 ms, 500 ms, 1,000 ms; same effect key | Open 60 s; pending uses reconciliation; atomic acceptance rolls back domain state until all legs commit. |
| Shard 10 rights execution | `{ engagementId: uuid, acceptanceId: uuid, rightsPostures: object, expectedVersion: int }` | `{ executionId: uuid, status: 'executed'|'pending'|'failed', instrumentIds: uuid[] }` | 1,000 ms | 2 retries at 150 ms, 400 ms; idempotent acceptance ID | Open 45 s; pending/failed prevents committed acceptance and pages reconciliation. |
| Shard 07 credit emission | `{ engagementId: uuid, acceptanceId: uuid, creditFacts: object, idempotencyKey: string }` | `{ creditEmissionId: uuid, status: 'emitted'|'pending'|'failed' }` | 1,000 ms | 2 retries at 150 ms, 400 ms | Open 45 s; acceptance transaction compensates payment/rights effects if emission cannot commit. |
| BE00 timer/recall clock | `{ deliveryId: uuid, windowEnd: RFC3339, command: 'auto-accept'|'recall-expire' }` | `{ timerId: uuid, fired: boolean, firedAt?: RFC3339 }` | 500 ms | 2 retries at 100 ms, 250 ms | Open 30 s; committed delivery timestamps and half-open window are authoritative. |

## Request/Response Contracts

All schemas are Zod 4. Every failure uses the BE00/global error envelope exactly: `ApiError { code, message, requestId, details }`.

### Shared and operation schemas

```ts
type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const CommandContext = z.object({
  actor_person_id: z.string().uuid(), acting_party_id: z.string().uuid(), acting_context_version: z.string().min(1).max(128),
  idempotency_key: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/), request_id: z.string().uuid(), expected_version: z.number().int().positive().optional(),
}).strict();
const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: z.string().uuid(), details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict(); // ApiError { code, message, requestId, details }

const FinalDeliveryRequest = CommandContext.extend({
  engagement_id: z.string().uuid(), artifact_ids: z.array(z.string().uuid()).min(1).max(128),
  declarations: z.array(z.object({ kind: z.enum(['originality','source_warranty','performance']), value: z.string().trim().min(1).max(2000) }).strict()).min(1).max(32),
  artifact_set_hash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
const FinalDeliverySuccess = z.object({ delivery_id: z.string().uuid(), engagement_id: z.string().uuid(), state: z.enum(['submitted','qc_pending','qc_failed','delivered']), version: z.number().int().positive(), event_id: z.string().uuid() }).strict();

const AcceptDeliveryRequest = CommandContext.extend({
  delivery_id: z.string().uuid(), kind: z.enum(['explicit','auto']), expected_delivery_version: z.number().int().positive(), buyer_confirmed: z.literal(true),
}).strict();
const AcceptDeliverySuccess = z.object({ acceptance_id: z.string().uuid(), delivery_id: z.string().uuid(), kind: z.enum(['explicit','auto']), committed_at: z.string().datetime(), payment_release_id: z.string().uuid(), rights_execution_id: z.string().uuid(), credit_emission_id: z.string().uuid(), recall_window_start: z.string().datetime().nullable(), recall_window_end: z.string().datetime().nullable(), event_id: z.string().uuid() }).strict();

const ExitRequest = CommandContext.extend({
  engagement_id: z.string().uuid(), exit_kind: z.enum(['buyer_cancel','seller_cancel','abandonment','mutual_release']), fault_party_id: z.string().uuid().nullable(), reason_code: z.string().regex(/^[a-z0-9_-]{1,48}$/), consent_token: z.string().min(16).max(256).optional(),
}).strict();
const ExitSuccess = z.object({ exit_settlement_id: z.string().uuid(), engagement_id: z.string().uuid(), exit_kind: z.enum(['buyer_cancel','seller_cancel','abandonment','mutual_release']), state: z.literal('committed'), consumed_fee: z.number().nonnegative(), refund: z.number().nonnegative(), expenses: z.number().nonnegative(), rights_disposition: z.enum(['none','return','retain','licensed']), event_id: z.string().uuid() }).strict();

const OpenRecallRequest = CommandContext.extend({
  engagement_id: z.string().uuid(), acceptance_id: z.string().uuid(), delivery_id: z.string().uuid(), scope: z.string().trim().min(1).max(2000), evidence_artifact_ids: z.array(z.string().uuid()).max(16),
}).strict();
const OpenRecallSuccess = z.object({ recall_id: z.string().uuid(), allowance_id: z.string().uuid(), state: z.literal('requested'), requested_at: z.string().datetime(), window_end: z.string().datetime(), event_id: z.string().uuid() }).strict();
const ErrorResponse = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error schema/status |
|---|---|---|---|
| SRV-DEL-API-01 | `FinalDeliveryRequest` | `FinalDeliverySuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-DEL-API-02 | `AcceptDeliveryRequest` | `AcceptDeliverySuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-DEL-API-03 | `ExitRequest` | `ExitSuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-DEL-API-04 | `OpenRecallRequest` | `OpenRecallSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation | Required validation and invariant |
|---|---|
| SRV-DEL-API-01 | Final artifact set is complete and frozen; every artifact hash/QC is clean; declarations are present; partial delivery is rejected; QC failure is not delivery; no rights/credit effect occurs here. |
| SRV-DEL-API-02 | Explicit buyer acceptance requires active delivery and approver; auto acceptance requires BE00 timer and deadline; revision opened by deadline plus 120 seconds wins; acceptance commits `committed_at`, payment, rights, credits, and pinned recall allowance atomically. Positive recall windows are half-open `[committed_at, committed_at + window_days)`; zero is closed. |
| SRV-DEL-API-03 | Exit kind is one of four; abandonment requires awaited-action timeout plus one consented extension; settlement has consumed fee/kill, refund, 100% expenses zero-take, and rights disposition legs; liability cap defaults to engagement value; no full-amount abandonment payout. |
| SRV-DEL-API-04 | Buyer owns terminal engagement; allowance policy/version and accepted delivery are pinned; requested time must be inside positive half-open window; duplicate, decline, out-of-scope, or withdrawal consume zero; seller acceptance CAS consumes one ordinal only when timely/in-scope. |

### Error, authorization, idempotency, rate, and observability matrix

| Operation | Status/code matrix (all bodies are `ApiError { code, message, requestId, details }`) | Authorization and 403/404 rule | Idempotency / rate / observability |
|---|---|---|---|
| SRV-DEL-API-01 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 ENGAGEMENT_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 DELIVERY_INCOMPLETE`/`QC_FAILED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides engagement; 403 for visible engagement outside seller/contributor mandate | 24h key per engagement/artifact hash; 20 final deliveries/hour; trace artifact hashes/QC state, never media/declarations. |
| SRV-DEL-API-02 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 DELIVERY_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 QC_FAILED`/`DELIVERY_INCOMPLETE`/`PAYMENT_AUTH_FAILED`/`RIGHTS_EXECUTION_FAILED`/`CREDIT_EMISSION_FAILED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 for hidden delivery; 403 for non-approver or browser claiming auto; revision race returns 409 | 24h key per delivery/kind/version; 10 accepts/hour/buyer; trace acceptance/payment/rights/credit IDs and committedAt. |
| SRV-DEL-API-03 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 ENGAGEMENT_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 COUNSEL_GATE_DISABLED`/`EXIT_TERMS_INVALID`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides engagement; 403 when party lacks exit authority or mutual consent | 24h key per engagement/exit kind; 10 exits/day/party; trace leg hashes/fault class, not protected amounts. |
| SRV-DEL-API-04 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 ENGAGEMENT_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`/`RECALL_ALLOWANCE_CONFLICT`; `422 RECALL_WINDOW_CLOSED`/`RECALL_ALLOWANCE_EXHAUSTED`/`RECALL_TERMS_INVALID`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 for non-terminal/unknown engagement; 403 for seller/non-buyer actor or failed evidence capability | 24h key per engagement/acceptance/scope hash; exactly 5 POST requests per buyer/engagement/allowance per positive pinned window (`window_days` 7–90); duplicate replay does not consume quota and `Retry-After` reaches `ends_at`; trace allowance version, ordinal, state and policy class, redact scope/evidence. |

## Database Schema

### PostgreSQL model registry

| Canonical model | Typed fields, nullability, constraints, foreign keys, and indexes |
|---|---|
| `delivery` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id`; `kind text NOT NULL CHECK (kind IN ('milestone','final'))`; `artifact_set_hash bytea NOT NULL CHECK (octet_length(artifact_set_hash)=32)`; `state text NOT NULL CHECK (state IN ('submitted','qc_pending','qc_failed','delivered','accepted'))`; `qc_state text NOT NULL CHECK (qc_state IN ('pending','clean','failed'))`; `window_start timestamptz NULL`; `window_end timestamptz NULL`; `version integer NOT NULL CHECK (>0)`; `submitted_at timestamptz NOT NULL`; `delivered_at timestamptz NULL`; unique `(engagement_id,kind,version)`; indexes `(engagement_id,state)`, `(window_end) WHERE state='delivered'`. RLS: engagement parties; worker writes. |
| `delivery_artifact` | `id uuid PK`; `delivery_id uuid NOT NULL FK delivery.id ON DELETE RESTRICT`; `object_key varchar(512) NOT NULL`; `sha256 bytea NOT NULL CHECK (octet_length(sha256)=32)`; `byte_length bigint NOT NULL CHECK (byte_length>=0)`; `mime_type varchar(128) NOT NULL`; `role text NOT NULL CHECK (role IN ('audio','stems','document','archive','other'))`; `scan_state text NOT NULL CHECK (scan_state IN ('pending','clean','quarantined'))`; `created_at timestamptz NOT NULL`; unique `(delivery_id,sha256)`; index `(delivery_id,scan_state)`. RLS: parties receive signed URLs only; object key is service-only. |
| `acceptance` | `id uuid PK`; `delivery_id uuid NOT NULL UNIQUE FK delivery.id`; `engagement_id uuid NOT NULL FK engagement.id`; `kind text NOT NULL CHECK (kind IN ('explicit','auto'))`; `committed_at timestamptz NOT NULL`; `buyer_party_id uuid NOT NULL FK party.id`; `payment_release_id uuid NOT NULL`; `rights_execution_id uuid NOT NULL`; `credit_emission_id uuid NOT NULL`; `recall_allowance_id uuid NULL FK recall_allowance.id`; `recall_window_start timestamptz NULL`; `recall_window_end timestamptz NULL`; `version integer NOT NULL CHECK (>0)`; unique `(engagement_id,kind)`; index `(recall_window_end) WHERE recall_window_end IS NOT NULL`. RLS: parties safe projection; effect IDs service-only. |
| `exit_settlement` | `id uuid PK`; `engagement_id uuid NOT NULL UNIQUE FK engagement.id`; `exit_kind text NOT NULL CHECK (exit_kind IN ('buyer_cancel','seller_cancel','abandonment','mutual_release'))`; `fault_party_id uuid NULL FK party.id`; `consumed_fee numeric(12,2) NOT NULL CHECK (consumed_fee>=0)`; `refund numeric(12,2) NOT NULL CHECK (refund>=0)`; `expenses numeric(12,2) NOT NULL CHECK (expenses>=0)`; `rights_disposition text NOT NULL CHECK (rights_disposition IN ('none','return','retain','licensed'))`; `liability_cap numeric(12,2) NOT NULL CHECK (liability_cap>=0)`; `leg_hash bytea NOT NULL CHECK (octet_length(leg_hash)=32)`; `state text NOT NULL CHECK (state IN ('pending','committed','compensating','failed'))`; `created_at timestamptz NOT NULL`; index `(exit_kind,state)`. RLS: party-safe leg projection; exact amounts protected. |
| `recall_policy_version` | `id uuid PK`; foreign keys: none (platform taxonomy root); `policy_class text NOT NULL CHECK (policy_class IN ('mastering','mixing_or_production','other_recall_capable'))`; `origin text NOT NULL CHECK (origin='craft_seed')`; `total_count smallint NOT NULL CHECK (total_count BETWEEN 0 AND 5)`; `window_days smallint NOT NULL CHECK ((total_count=0 AND window_days=0) OR (total_count>0 AND window_days BETWEEN 7 AND 90))`; `effective_at timestamptz NOT NULL`; `retired_at timestamptz NULL`; `version integer NOT NULL CHECK (>0)`; unique `(policy_class,version)`; index `(policy_class,effective_at DESC)`. RLS: public taxonomy-safe read; platform governance writes only. |
| `recall_allowance` | `id uuid PK`; `engagement_id uuid NOT NULL UNIQUE FK engagement.id`; `acceptance_id uuid NOT NULL UNIQUE FK acceptance.id`; `policy_version_id uuid NOT NULL FK recall_policy_version.id`; `origin text NOT NULL CHECK (origin IN ('craft_seed','seller_override'))`; `author_party_id uuid NOT NULL FK party.id`; `total_count smallint NOT NULL CHECK (total_count BETWEEN 0 AND 5)`; `consumed_count smallint NOT NULL DEFAULT 0 CHECK (consumed_count BETWEEN 0 AND total_count)`; `window_start timestamptz NULL`; `window_end timestamptz NULL`; `version integer NOT NULL CHECK (>0)`; indexes `(window_end,consumed_count)`, `(engagement_id,version)`. RLS: buyer/seller safe projection; consume function worker-only. |
| `recall` | `id uuid PK`; `allowance_id uuid NOT NULL FK recall_allowance.id`; `engagement_id uuid NOT NULL FK engagement.id`; `requested_by_party_id uuid NOT NULL FK party.id`; `accepted_by_party_id uuid NULL FK party.id`; `requested_at timestamptz NOT NULL`; `accepted_at timestamptz NULL`; `ordinal smallint NULL CHECK (ordinal BETWEEN 1 AND 5)`; `state text NOT NULL CHECK (state IN ('requested','accepted','declined','withdrawn','delivered','impossible'))`; `scope_hash bytea NOT NULL CHECK (octet_length(scope_hash)=32)`; `outcome_code varchar(64) NULL`; `version integer NOT NULL CHECK (>0)`; unique `(allowance_id,id)`; partial unique `(allowance_id,ordinal) WHERE ordinal IS NOT NULL`; indexes `(engagement_id,state)`, `(allowance_id,requested_at DESC)`. RLS: buyer/seller and reviewer capability; evidence references only. |

### State, transaction, grants, and RLS rules

Final delivery writes a complete immutable artifact manifest and waits for QC. `ExecuteAcceptance` locks delivery, engagement, allowance, and effect records; it calls payment release, Shard 10 rights execution, and Shard 07 credit emission with one acceptance idempotency key. Any non-committed effect rolls back domain state and leaves a reconciliable pending effect. Explicit acceptance is valid only in the buyer window; auto-accept is timer-only. A revision opened by deadline plus 120 seconds wins the race. Exit settlement writes all four named legs under one CAS; abandonment schedules a bounded kill amount. Recall request is append-only; seller acceptance locks the scope and atomically increments `consumed_count` with `consumed_count < total_count`. Decline, duplicate, out-of-scope, or withdrawal do not increment. `anon` and browser direct table grants are denied; RLS exposes party-safe projections and worker functions only.

## Middleware & Policies

| Operation | Allowed authority | 403 condition | 404 condition | Middleware and CORS policy |
|---|---|---|---|---|
| SRV-DEL-API-01 | Seller/contributor final-work mandate | Visible engagement but actor lacks mandate | Engagement not in party projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(64KiB) → contentType(json) → rateLimit(final-delivery) → auth → actingContext → zod(FinalDeliveryRequest) → seller-mandate → artifact/QC gate → idempotency → If-Match → handler → audit/outbox`. |
| SRV-DEL-API-02 | Buyer approver for explicit; signed BE00 worker for auto | Visible delivery but wrong buyer or browser auto claim | Delivery not in party projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(32KiB) → contentType(json) → rateLimit(acceptance) → auth → actingContext → zod(AcceptDeliveryRequest) → kind-principal+buyer gate → revision/window policy → idempotency → If-Match/CAS → effect coordinator → handler → audit/outbox`. |
| SRV-DEL-API-03 | Party with permitted exit; signed timeout worker for abandonment | Visible engagement but missing consent/authority | Engagement not in party projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(32KiB) → contentType(json) → rateLimit(exit) → auth → actingContext → zod(ExitRequest) → exit-kind+consent policy → idempotency → If-Match → settlement coordinator → handler → audit/outbox`. |
| SRV-DEL-API-04 | Buyer party on terminal accepted engagement | Visible engagement but seller/non-buyer or evidence capability missing | Non-terminal/unknown engagement is hidden | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(64KiB) → contentType(json) → rateLimit(recall:5/positive-allowance-window/buyer+engagement) → auth → actingContext → zod(OpenRecallRequest) → buyer ownership+terminal gate → pinned allowance/window policy → idempotency → If-Match/CAS → handler → audit/outbox`. |

## Data Flow

1. Validate actor, terminal/active state, exact version, artifact/QC/evidence references, and strict schema before protected data access.
2. Lock the aggregate and relevant delivery/allowance rows. Apply a single legal transition and write effect intents with acceptance/exit/recall idempotency keys.
3. Coordinate external effects using bounded seams. Commit domain rows and outbox only after required effects are authorized; compensate pending effects on failure.
4. Consumers receive redacted versioned events. Timer workers use stored timestamps and CAS; replay cannot consume an allowance or settle twice.

## Events and Consumer Contracts

| Event type | Trigger and payload | Consumers / recovery |
|---|---|---|
| `service.delivery.changed.v1` | `{ eventId, occurredAt, deliveryId, engagementId, state, windowStart, windowEnd, qcState, artifactHash, version, schemaVersion }`; no media bytes, declarations, or private notes | Acceptance/revision/payout workers; at-least-once outbox, dedupe by event ID/version. |
| `service.acceptance.committed.v1` | `{ eventId, occurredAt, acceptanceId, deliveryId, kind, committedAt, paymentReleaseId, rightsExecutionId, creditEmissionId, recallAllowanceId, recallWindowStart, recallWindowEnd, version, schemaVersion }`; credentials and exact protected values excluded | Parties, Shards 07/10, payment, and recall timer; unknown versions quarantine and page. |
| `service.exit-settlement.changed.v1` | `{ eventId, occurredAt, engagementId, exitKind, faultClass, legHashes, state, version, schemaVersion }`; no exact amounts or private evidence | Payment, dispute, reputation, and project projections; compensation events retain the same aggregate version. |
| `service.recall-policy.changed.v1` | `{ eventId, occurredAt, policyVersionId, policyClass, totalCount, windowDays, effectiveAt, retiredAt, version, schemaVersion }` | Quote issuer and taxonomy caches; issued quotes/engagements retain their snapshots. |
| `service.recall.changed.v1` | `{ eventId, occurredAt, recallId, allowanceId, engagementId, state, requestedAt, acceptedAt, ordinal, outcomeCode, version, schemaVersion }`; scope/evidence bytes excluded | Buyer/seller tasks, notifications, and reputation; duplicate consumer delivery is harmless. |

## Error Handling and Failure Recovery

| Failure | Behavior |
|---|---|
| Incomplete or quarantined artifact | `422 DELIVERY_INCOMPLETE`/`QC_FAILED`; no delivery/acceptance effect. |
| Revision/acceptance boundary race | A revision through deadline + 120 seconds wins; acceptance returns `409 VERSION_CONFLICT` and releases no effects. |
| Payment/rights/credit effect failure | `422 PAYMENT_AUTH_FAILED`, `RIGHTS_EXECUTION_FAILED`, or `CREDIT_EMISSION_FAILED`; domain transaction compensates and BE00 reconciles pending effects. |
| Exit ambiguity or counsel gate | `422 EXIT_TERMS_INVALID` or `COUNSEL_GATE_DISABLED`; no terminal state. |
| Recall window/count race | `422 RECALL_WINDOW_CLOSED`/`RECALL_ALLOWANCE_EXHAUSTED` or `409 RECALL_ALLOWANCE_CONFLICT`; CAS ensures one ordinal per count. |
| Provider timeout | `503 DEPENDENCY_UNAVAILABLE` only when no committed effect is known; reconciliation queries provider by idempotency key before retry. |
| Duplicate idempotency | Stored response replayed for same hash; `409 IDEMPOTENCY_MISMATCH` otherwise. |
| Outbox failure | Committed domain event remains in BE00 outbox; five retries, dead-letter, and page; replay keyed by event ID. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract and handler tests | Authorization/RLS and failure tests |
|---|---|---|
| SRV-DEL-API-01 | Complete artifact/QC, declaration/hash, final-only state, immutable delivery, idempotent replay | Seller/contributor mandate, 403/404, upload quarantine, redacted artifact projection |
| SRV-DEL-API-02 | Explicit/auto principal, deadline+120s race, atomic payment/rights/credit, one acceptance/window | Buyer versus browser auto authority, 403/404, provider compensation, effect/outbox replay |
| SRV-DEL-API-03 | Four exit kinds, consent/abandonment extension, four settlement legs, liability cap, CAS | Party/worker authority, 403/404, counsel gate, protected amount and dispute projection |
| SRV-DEL-API-04 | Pinned allowance/window, half-open boundary, duplicate/withdrawal zero consumption, ordinal CAS | Buyer terminal engagement, 403/404, race conflict, evidence redaction and timer recovery |

Cross-operation test-level matrix:

| Level | Required tests |
|---|---|
| Contract | Zod 4 fixtures for final delivery, explicit/auto acceptance, four exits, and recall; strict unknown-key rejection; half-open window; `ApiError { code, message, requestId, details }` snapshots. |
| Handler/state | Complete artifact/QC gate, 120-second revision race, atomic acceptance effects, timer-only auto path, all settlement legs, bounded abandonment, policy snapshot, recall request/accept/decline/withdrawal transitions. |
| Concurrency | Competing acceptance, exit, recall requests, duplicate ordinals, effect retries, and outbox replay use CAS/unique constraints and never double-release/consume. |
| Authorization/RLS | Buyer/seller/contributor/worker/reviewer/anonymous; 403 versus 404; protected amounts/evidence/media redaction; direct table grants denied. |
| Integration | BE00 storage/QC/payment/timer, Shard 07 credit, and Shard 10 rights seams verify exact timeout/retry/backoff/breaker/reconciliation behavior. |
| Observability | Per-operation requestId/operationId/aggregate/version/effect IDs, outcome and latency metrics; no credentials, media, scope, or exact protected amounts. |

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** state enums, half-open timestamps, artifact hashes, exit legs, allowance bounds, and effect IDs are strict.
- **Pass 2 — macro contract:** four IA interactions map to four routes; final acceptance is the sole cross-leg commit; recall seller acceptance remains workflow-scoped.
- **Pass 3 — race/recovery:** CAS, timer principal, provider idempotency, rollback/reconciliation, and outbox dedupe are explicit.
- **Pass 4 — security/privacy:** party RLS, evidence references, protected values, CORS, rate limits, and 403/404 policy are per operation.

## Ambiguity Gate

**PASS.** SRV-10–SRV-13 are reconciled one-to-one with stable routes and operation IDs. Delivery completeness, explicit/automatic acceptance, atomic payment/rights/credit effects, exit legs, recall window/count semantics, and provider recovery are deterministic; every operation has strict Zod 4 request/success/error contracts, per-operation CORS/auth/rate/validation middleware, authorization outcomes, typed persistence, events, tests, and failure recovery. No implementation decision remains open.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored delivery, acceptance, exit settlement, and recall backend split from IA Shard 14. | `/write-be-spec` | All |
| 2026-08-28 | Added atomic effect seams, recall allowance CAS, typed persistence, CORS, and recovery contracts. | `/write-be-spec-write` | API, Database, Middleware, Events, Tests |

## Dependency References

- [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md): global `ApiError`, idempotency, timers, provider effects, outbox, RLS, and transport.
- [14a — Service listings, quotes & engagements](14a-service-listings-quotes-engagements.md): pinned quote/engagement/recall terms.
- [14b — Requirements, SLA, milestones & revisions](14b-requirements-sla-milestones-revisions.md): milestone deliveries, revisions, and change-order projection.
- [IA Shard 14](../ia/14-services-marketplace.md) and [Deep Dive 14](../ia/deep-dives/14-services-marketplace.md): canonical interactions, models, algorithms, events, and edge cases.
- Shards 07, 10, and 18: credit emission, rights execution, and downstream settlement seams; this split does not duplicate their endpoints.
