# Repair, Inspection & Custody — Backend Specification

**Status:** Complete
**IA source:** [Shard 14 — Services marketplace lifecycle](../ia/14-services-marketplace.md)
**Deep-dive source:** [Deep Dive 14 — Services marketplace lifecycle](../ia/deep-dives/14-services-marketplace.md)
**Backend foundation:** [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md)

## Split Group

This split owns custodial repair intake and handoffs, estimate approval, independent inspection reports, damage evidence claims, and append-only service audit facts. It contains SRV-17–SRV-19. The repair job is an engagement-scoped aggregate; the canonical split-owned models are `custody_handoff`, `condition_record`, `inspection_report`, `damage_claim`, and `service_audit_event`.

## Classification

- **Type:** physical-custody and evidence-record split.
- **Boundary:** custody chain, mutual condition records, estimate/change scope, inspection report, damage claim, and service audit persistence; adjudication remains Shard 06 and gear provenance remains Shard 23.
- **Expected operations:** three HTTP operations, one-to-one with IA interactions SRV-17, SRV-18, and SRV-19.
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** payment authorization follows estimate approval, not booking; condition records are mutual and append-only; reports and claims record evidence and never promise insurance, coverage, or a payout entitlement.

## Referenced Material Inventory

| Source file | Section / lines | Material used in this specification |
|---|---|---|
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Features, lines 26–35 | Feature ID `05.07`, repair, inspection, custody, and damage scope. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Interactions, lines 78–80 | SRV-17 repair intake/handoff, SRV-18 inspection, and SRV-19 damage claim acceptance/failure rules. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Contracts, lines 141–146 | Custody handoff, condition, estimate, inspection, and evidence-only claim contracts. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Data Models, lines 207–213 | `custody_handoff`, `condition_record`, `inspection_report`, `damage_claim`, and `service_audit_event`. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Access Control, lines 214–237 | Custodian, inspector, buyer/seller, contributor, moderator, and worker authority. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Event Schemas, lines 260–263 | `service.custody.changed.v1` payload and Shard 23/26/dispute consumers. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Edge Cases, lines 275–291 | QC/custody, estimate scope, damage, dispute, and fee/value separation. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Custody and Inspection Algorithm, lines 113–121 | Intake, estimate, mutual handoff, return comparison, inspection template, and dispute evidence. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Abuse and Recovery Verification, lines 122–138 | Fee/value boundary, report immutability, evidence, and recovery controls. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Request/Response Contracts, lines 112–201; Deterministic Protocol Rules, lines 330–353 | Zod 4, `ApiError`, idempotency, ETag, body limits, and effect recovery. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Middleware & Policies, lines 253–298; Event and Consumer Contracts, lines 355–416 | Hono/CORS, RLS, audit, outbox, and consumer behavior. |
| `.memory/wiki/specs/2026-08-02-architecture-design.md` | Security Model, lines 709–790; Integration Points, lines 916–937 | PII/evidence boundaries, auth, Shard 06/23/26 seams, and provider handling. |

## IA Source Map

| BE section | IA source / trace |
|---|---|
| Routes and operation contracts | Shard 14 IA `§ Interactions`, lines 78–80; `§ Contracts`, lines 141–146 |
| Custody and condition persistence | Shard 14 IA `§ Data Models`, lines 207–209; deep dive `§ Custody and Inspection Algorithm`, lines 113–121 |
| Inspection and claims persistence | Shard 14 IA `§ Data Models`, lines 210–213; deep dive `§ Abuse and Recovery Verification`, lines 122–138 |
| Authority, privacy, and edge cases | Shard 14 IA `§ Access Control`, lines 214–237; `§ Edge Cases`, lines 275–291 |
| Custody event | Shard 14 IA `§ Event Schemas`, lines 260–263 |
| Shared transport and recovery | BE00 `§ Request/Response Contracts`, lines 112–201; `§ Deterministic Protocol Rules`, lines 330–353; `§ Event and Consumer Contracts`, lines 355–416 |

## Endpoint Completeness Reconciliation

| IA interaction | BE operation ID | Method and path | Result |
|---|---|---|---|
| SRV-17 Run repair service | SRV-CUS-API-01 | `POST /api/v1/services/repair-jobs` | Reconciled: mutual intake condition, declared value, labour/parts estimate, approval, payment authorization, and custody chain are recorded. |
| SRV-18 Complete inspection | SRV-CUS-API-02 | `POST /api/v1/services/repair-jobs/{repairJobId}/inspection` | Reconciled: assigned inspector conflict check and full category template commit an immutable report paid on delivery. |
| SRV-19 Record damage claim | SRV-CUS-API-03 | `POST /api/v1/services/repair-jobs/{repairJobId}/damage-claims` | Reconciled: party files evidence against mutual before/after conditions and approved estimate; contested claims link to Shard 06. |

## API Endpoints

### Route Registry

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| SRV-CUS-API-01 | POST | `/api/v1/services/repair-jobs` | SRV-17 | Custodial seller/provider and buyer/custodian jointly confirm intake; provider owns estimate command | `201` custody/repair projection |
| SRV-CUS-API-02 | POST | `/api/v1/services/repair-jobs/{repairJobId}/inspection` | SRV-18 | Assigned independent inspector with graph conflict clearance | `201` immutable inspection report |
| SRV-CUS-API-03 | POST | `/api/v1/services/repair-jobs/{repairJobId}/damage-claims` | SRV-19 | Party in custody chain with before/after condition access | `201` evidence claim projection |

### Transport and external seams

All routes use HTTPS JSON, `X-Request-Id`, `Idempotency-Key`, `If-Match`, strict body limits, and BE00 error/outbox conventions. Condition media is submitted through BE00 upload intents; this split stores hashes and references only. Fee escrow and declared item value are separate fields and ledger legs.

| Seam | Exact request | Exact response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---|---:|---|---|
| BE00 estimate payment authorization | `{ repairJobId: uuid, estimateId: uuid, laborMinor: int64, partsMinor: int64, currency: string, idempotencyKey: string }` | `{ authorizationId: uuid, status: 'authorized'|'pending'|'declined' }` | 2,000 ms | 2 retries at 250 ms, 500 ms; provider-safe idempotency | Open 60 s; pending estimate remains unapproved and reconciles before work. |
| BE00 upload/media scanner | `{ conditionRecordId: uuid, objectKeys: string[], hashes: string[], declaredBytes: int64 }` | `{ scanState: 'clean'|'pending'|'quarantined', verifiedHashes: string[] }` | 1,500 ms | 2 retries at 200 ms, 500 ms | Open 45 s; pending media leaves handoff unconfirmed; quarantine blocks evidence link. |
| Shard 01 inspector assignment/conflict graph | `{ inspectorPersonId: uuid, buyerPartyId: uuid, sellerPartyId: uuid, repairJobId: uuid }` | `{ eligible: boolean, conflictCheckId: uuid, graphVersion: string }` | 800 ms | 2 retries at 100 ms, 250 ms; read-safe | Open 45 s; unknown/failed check returns `FORBIDDEN`, no report accepted. |
| Shard 06 evidence case | `{ repairJobId: uuid, damageClaimId: uuid, conditionRecordIds: uuid[], estimateId: uuid, evidenceHashes: string[] }` | `{ caseId: uuid, state: 'opened'|'pending'|'rejected' }` | 1,000 ms | 2 retries at 150 ms, 400 ms; idempotent claim key | Open 45 s; claim remains evidence-only and case link retries after recovery. |
| Shard 23 custody/service history | `{ itemId: uuid, engagementId: uuid, handoffId: uuid, conditionHash: hex64, state: string }` | `{ serviceEventId: uuid, state: 'appended'|'pending'|'rejected' }` | 1,000 ms | 2 retries at 150 ms, 400 ms | Open 45 s; history append is retried; Shard 23 owns gear identity and append-only history. |

## Request/Response Contracts

All schemas are Zod 4. Every failure uses the BE00/global error envelope exactly: `ApiError { code, message, requestId, details }`.

### Shared and operation schemas

```ts
type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const ConditionFacts = z.object({ cosmeticGrade: z.enum(["mint", "excellent", "good", "fair", "poor", "unknown"]).optional(), functionalState: z.enum(["working", "intermittent", "not_working", "not_tested"]).optional(), missingPartCodes: z.array(z.string().regex(/^[A-Z0-9_-]{1,48}$/)).max(64).optional(), damageCodes: z.array(z.enum(["scratch", "dent", "corrosion", "crack", "water", "electrical", "missing_part"])).max(32).optional(), notes: z.string().trim().max(2000).optional() }).strict();
const ApprovedChangeScope = z.object({ allowedFields: z.array(z.enum(["labor", "parts", "finish", "structural", "electrical"])).min(1).max(5), maxAmountMinor: z.number().int().nonnegative(), reason: z.string().trim().min(1).max(500) }).strict();
const InspectionCategoryValues = z.object({ conditionGrade: z.enum(["mint", "excellent", "good", "fair", "poor", "unknown"]).optional(), safetyState: z.enum(["safe", "restricted", "unsafe", "not_tested"]).optional(), completeness: z.enum(["complete", "minor_missing", "major_missing", "unknown"]).optional(), workmanship: z.enum(["professional", "acceptable", "deficient", "not_assessed"]).optional(), notes: z.string().trim().max(2000).optional() }).strict();
const CommandContext = z.object({
  actor_person_id: z.string().uuid(), acting_party_id: z.string().uuid(), acting_context_version: z.string().min(1).max(128),
  idempotency_key: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/), request_id: z.string().uuid(), expected_version: z.number().int().positive().optional(),
}).strict();
const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: z.string().uuid(), details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict(); // ApiError { code, message, requestId, details }

const ConditionInput = z.object({ side: z.enum(['intake','handoff','return']), structured: ConditionFacts, media_artifact_ids: z.array(z.string().uuid()).max(32), declared_value: z.number().nonnegative(), condition_hash: z.string().regex(/^[a-f0-9]{64}$/), confirmed_by_party_ids: z.array(z.string().uuid()).min(2).max(2) }).strict();
const RepairJobRequest = CommandContext.extend({
  item_id: z.string().uuid(), buyer_party_id: z.string().uuid(), seller_party_id: z.string().uuid(), intake: ConditionInput, estimate: z.object({ labor_amount: z.number().nonnegative(), parts_amount: z.number().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/), approved_change_scope: ApprovedChangeScope }).strict(), approve_estimate: z.literal(true), from_custodian_party_id: z.string().uuid(), to_custodian_party_id: z.string().uuid(),
}).strict();
const RepairJobSuccess = z.object({ engagement_id: z.string().uuid(), custody_handoff_id: z.string().uuid(), condition_record_id: z.string().uuid(), estimate_id: z.string().uuid(), payment_authorization_id: z.string().uuid(), state: z.enum(['intake_confirmed','estimate_approved','in_custody','in_repair']), event_id: z.string().uuid() }).strict();

const InspectionRequest = CommandContext.extend({
  repair_job_id: z.string().uuid(), template_version: z.string().min(1).max(64), category_values: InspectionCategoryValues, condition_artifact_ids: z.array(z.string().uuid()).max(32), conflict_check_id: z.string().uuid(), report_hash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
const InspectionSuccess = z.object({ inspection_report_id: z.string().uuid(), repair_job_id: z.string().uuid(), state: z.literal('submitted'), payment_instruction_id: z.string().uuid(), report_version: z.number().int().positive(), event_id: z.string().uuid() }).strict();

const DamageClaimRequest = CommandContext.extend({
  repair_job_id: z.string().uuid(), before_condition_record_id: z.string().uuid(), after_condition_record_id: z.string().uuid(), estimate_id: z.string().uuid(), declared_value: z.number().nonnegative(), evidence_artifact_ids: z.array(z.string().uuid()).min(1).max(32), claim_summary: z.string().trim().min(1).max(2000),
}).strict();
const DamageClaimSuccess = z.object({ damage_claim_id: z.string().uuid(), repair_job_id: z.string().uuid(), state: z.enum(['open','referred','contested']), evidence_case_id: z.string().uuid().nullable(), claim_hash: z.string().regex(/^[a-f0-9]{64}$/), event_id: z.string().uuid() }).strict();
const ErrorResponse = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error schema/status |
|---|---|---|---|
| SRV-CUS-API-01 | `RepairJobRequest` | `RepairJobSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-CUS-API-02 | `InspectionRequest` | `InspectionSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-CUS-API-03 | `DamageClaimRequest` | `DamageClaimSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation | Required validation and invariant |
|---|---|
| SRV-CUS-API-01 | Custodial engagement exists; both parties confirm structured intake condition/media and declared-value consequence; estimate separates labour and parts; payment authorization occurs only after estimate approval; every transfer records from/to/time/mutual condition; approved change scope bounds work; fee escrow never equals item value. |
| SRV-CUS-API-02 | Inspector is assigned and passes graph conflict check against both parties; category template is complete; report is immutable on submission; corrections create a superseding report; payment is owed on report delivery regardless of finding or underlying transaction. |
| SRV-CUS-API-03 | Claim references mutual before and after condition records plus approved estimate and declared value; evidence hashes are scanned; claim is an evidence record only; contested claim opens Shard 06 case; no insurance, coverage, or payout entitlement field is accepted. |

### Error, authorization, idempotency, rate, and observability matrix

| Operation | Status/code matrix (all bodies are `ApiError { code, message, requestId, details }`) | Authorization and 403/404 rule | Idempotency / rate / observability |
|---|---|---|---|
| SRV-CUS-API-01 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 ITEM_OR_ENGAGEMENT_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 ESTIMATE_INVALID`/`PAYMENT_AUTH_FAILED`/`CUSTODY_CONDITION_INCOMPLETE`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides item/engagement outside custody parties; 403 for visible item where actor lacks provider/custodian authority | 24h key per item/engagement/intake hash; 10 repair starts/day/provider; trace handoff/condition/estimate/payment IDs, not media or private values. |
| SRV-CUS-API-02 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 REPAIR_JOB_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 INSPECTION_TEMPLATE_INCOMPLETE`/`CONFLICT_CHECK_FAILED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides job outside inspector assignment; 403 for failed graph conflict check or unassigned inspector | 24h key per job/template/hash; 30 reports/day/inspector; trace conflict/report/payment IDs and template version, never findings text. |
| SRV-CUS-API-03 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 REPAIR_JOB_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 CONDITION_CHAIN_INCOMPLETE`/`EVIDENCE_UNAVAILABLE`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides job outside custody chain; 403 for actor not party to chain or lacking evidence capability | 24h key per job/condition pair/hash; 10 claims/day/party; trace condition/estimate/case IDs, redact summary and declared value. |

## Database Schema

### PostgreSQL model registry

| Canonical model | Typed fields, nullability, constraints, foreign keys, and indexes |
|---|---|
| `custody_handoff` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id`; `item_id uuid NOT NULL`; `from_custodian_party_id uuid NOT NULL FK party.id`; `to_custodian_party_id uuid NOT NULL FK party.id`; `from_condition_record_id uuid NOT NULL FK condition_record.id`; `to_condition_record_id uuid NULL FK condition_record.id`; `occurred_at timestamptz NOT NULL`; `mutual_confirmed boolean NOT NULL`; `declared_value numeric(12,2) NOT NULL CHECK (declared_value>=0)`; `approved_change_scope jsonb NOT NULL CHECK (jsonb_typeof(approved_change_scope)='object')`; `state text NOT NULL CHECK (state IN ('proposed','confirmed','transferred','returned','disputed'))`; `version integer NOT NULL CHECK (>0)`; indexes `(item_id,occurred_at)`, `(engagement_id,state)`. RLS: both custody parties; append-only worker function. |
| `condition_record` | `id uuid PK`; `custody_handoff_id uuid NOT NULL FK custody_handoff.id`; `item_id uuid NOT NULL`; `side text NOT NULL CHECK (side IN ('intake','handoff','return'))`; `recorded_by_party_id uuid NOT NULL FK party.id`; `structured_condition jsonb NOT NULL CHECK (jsonb_typeof(structured_condition)='object')`; `media_artifact_ids jsonb NOT NULL CHECK (jsonb_typeof(media_artifact_ids)='array')`; `declared_value numeric(12,2) NOT NULL CHECK (declared_value>=0)`; `condition_hash bytea NOT NULL CHECK (octet_length(condition_hash)=32)`; `mutual_confirmed boolean NOT NULL`; `recorded_at timestamptz NOT NULL`; indexes `(item_id,recorded_at)`, `(custody_handoff_id,side)`, unique `(custody_handoff_id,side,condition_hash)`. RLS: custody parties; media through signed URLs. |
| `inspection_report` | `id uuid PK`; `engagement_id uuid NOT NULL FK engagement.id`; `repair_job_id uuid NOT NULL`; `inspector_person_id uuid NOT NULL FK person.id`; `template_version varchar(64) NOT NULL`; `category_values jsonb NOT NULL CHECK (jsonb_typeof(category_values)='object')`; `condition_artifact_ids jsonb NOT NULL`; `conflict_check_id uuid NOT NULL`; `report_hash bytea NOT NULL CHECK (octet_length(report_hash)=32)`; `state text NOT NULL CHECK (state IN ('draft','submitted','superseded'))`; `payment_instruction_id uuid NOT NULL`; `report_version integer NOT NULL CHECK (>0)`; `submitted_at timestamptz NULL`; unique `(repair_job_id,report_version)`; indexes `(inspector_person_id,submitted_at DESC)`, `(repair_job_id,state)`. RLS: assigned inspector and custody parties receive safe projection; findings restricted by capability. |
| `damage_claim` | `id uuid PK`; `repair_job_id uuid NOT NULL`; `engagement_id uuid NOT NULL FK engagement.id`; `filed_by_party_id uuid NOT NULL FK party.id`; `before_condition_record_id uuid NOT NULL FK condition_record.id`; `after_condition_record_id uuid NOT NULL FK condition_record.id`; `estimate_id uuid NOT NULL`; `declared_value numeric(12,2) NOT NULL CHECK (declared_value>=0)`; `evidence_artifact_ids jsonb NOT NULL CHECK (jsonb_typeof(evidence_artifact_ids)='array')`; `claim_summary text NOT NULL CHECK (char_length(claim_summary) BETWEEN 1 AND 2000)`; `claim_hash bytea NOT NULL CHECK (octet_length(claim_hash)=32)`; `evidence_case_id uuid NULL`; `state text NOT NULL CHECK (state IN ('open','referred','contested','resolved'))`; `created_at timestamptz NOT NULL`; indexes `(repair_job_id,state)`, `(filed_by_party_id,created_at DESC)`, `(before_condition_record_id,after_condition_record_id)`. RLS: custody parties/reviewer; no insurance or coverage columns. |
| `service_audit_event` | `id uuid PK`; `engagement_id uuid NULL FK engagement.id`; `operation_id varchar(64) NOT NULL`; `actor_person_id uuid NULL FK person.id`; `acting_party_id uuid NULL FK party.id`; `resource_type varchar(64) NOT NULL`; `resource_id uuid NOT NULL`; `outcome_code varchar(64) NOT NULL`; `payload_hash bytea NOT NULL CHECK (octet_length(payload_hash)=32)`; `occurred_at timestamptz NOT NULL`; `request_id uuid NOT NULL`; append-only; indexes `(engagement_id,occurred_at DESC)`, `(resource_type,resource_id,occurred_at DESC)`, unique `(request_id,operation_id)`. RLS: service/auditor only; no raw PII or media. |

### State, transaction, grants, and RLS rules

Repair intake writes the initial `condition_record` only after both parties confirm; estimate separates labour and parts, and payment authorization is a post-approval effect. Each handoff appends from/to, timestamp, and mutual condition; return comparison uses the condition chain and approved scope, not original appearance. Inspection conflict and template validation happen before an immutable report/payment instruction; a correction is a new `report_version`. Damage claim requires mutual before/after records, links evidence only, and routes a contest to Shard 06 without changing condition truth. `service_audit_event` is append-only and records every command result. Browser direct table grants are denied; RLS exposes party-safe projections, inspector assignments, and auditor functions. Fee escrow and declared item value are separate columns and effects.

## Middleware & Policies

| Operation | Allowed authority | 403 condition | 404 condition | Middleware and CORS policy |
|---|---|---|---|---|
| SRV-CUS-API-01 | Assigned repair provider plus both custody parties for mutual confirmation | Visible item/job but actor lacks provider/custodian authority or mutual confirmation | Item/job not in actor custody projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(128KiB) → contentType(json) → rateLimit(repair-intake) → auth → actingContext → zod(RepairJobRequest) → custody-party+estimate policy → idempotency → If-Match → upload/QC + payment seam → handler → audit/outbox`. |
| SRV-CUS-API-02 | Assigned independent inspector | Visible job but inspector unassigned or conflict graph fails | Job not in inspector projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(128KiB) → contentType(json) → rateLimit(inspection) → auth → actingContext → zod(InspectionRequest) → assignment+conflict gate → template completeness → idempotency → If-Match → payment instruction → handler → audit/outbox`. |
| SRV-CUS-API-03 | Party in custody chain or scoped reviewer | Visible job but actor is not custody party/evidence reviewer | Job not in custody projection | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(128KiB) → contentType(json) → rateLimit(damage-claim) → auth → actingContext → zod(DamageClaimRequest) → condition-chain+evidence gate → idempotency → If-Match → Shard06 case seam → handler → audit/outbox`. |

## Data Flow

1. Resolve custody party, inspector assignment, acting context, and strict schema before reading condition or evidence values.
2. Lock the engagement/item custody chain and validate mutual condition, estimate scope, report version, or claim references.
3. Write split-owned rows, audit event, and outbox event atomically. Payment, storage, graph conflict, dispute, and provenance effects carry stable idempotency keys.
4. Consumers receive hashes/state only. Shard 06 owns adjudication; Shard 23 owns item identity/history; no consumer treats a claim as an entitlement.

## Events and Consumer Contracts

| Event type | Trigger and payload | Consumers / recovery |
|---|---|---|
| `service.custody.changed.v1` | `{ eventId, occurredAt, jobId, itemId, handoffId, state, conditionHash, version, schemaVersion }`; excludes condition photos, signatures, private estimates, payment credentials, and unrestricted PII | Custody parties, Shards 23/26, and dispute projections; outbox retry five times, dedupe by event ID/version, then dead-letter/page. |

The event uses the BE00 lossless envelope and an append-only `service_audit_event` link. A claim or report event is represented through the custody aggregate projection and does not leak evidence bytes or findings.

## Error Handling and Failure Recovery

| Failure | Behavior |
|---|---|
| One-sided/incomplete condition | `422 CUSTODY_CONDITION_INCOMPLETE`; handoff remains pending and custody does not transfer. |
| Work exceeds approved scope | `422 ESTIMATE_INVALID`; new approval/change scope required; original estimate remains immutable. |
| Payment timeout/decline | `503 DEPENDENCY_UNAVAILABLE` for unknown state or `422 PAYMENT_AUTH_FAILED` for decline; no work-start state until reconciliation. |
| Inspector conflict or incomplete template | `403 CONFLICT_CHECK_FAILED` or `400 INSPECTION_TEMPLATE_INCOMPLETE`; report remains unsubmitted and unpaid. |
| Missing condition chain/evidence | `422 CONDITION_CHAIN_INCOMPLETE`/`EVIDENCE_UNAVAILABLE`; no claim is written or case opened. |
| Damage contest | Claim remains evidence-only, Shard 06 case link is retried, and condition records remain intact; no coverage/payment assertion is generated. |
| Duplicate correction/replay | Same idempotency hash returns stored report/claim; different hash returns `409 IDEMPOTENCY_MISMATCH`; reports are superseding, never edited. |
| Outbox/provider failure | Domain transaction remains atomic; effect ledger and outbox retry with bounded backoff, then dead-letter/page and reconcile by stable key. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract and handler tests | Authorization/RLS and failure tests |
|---|---|---|
| SRV-CUS-API-01 | Mutual intake, condition/media hash, estimate labour/parts, post-approval payment, handoff chain, idempotent replay | Provider/custodian authority, 403/404, one-sided condition, payment/upload recovery and fee/value isolation |
| SRV-CUS-API-02 | Assignment/conflict graph, complete category template, immutable/superseding report, payment-on-delivery | Inspector assignment, 403/404, conflict failure, findings/payment privacy and report RLS |
| SRV-CUS-API-03 | Before/after mutual records, estimate/value comparison, evidence-only claim, Shard 06 case link, replay | Custody-party/reviewer authority, 403/404, missing chain/evidence, no insurance/coverage fields and claim redaction |

Cross-operation test-level matrix:

| Level | Required tests |
|---|---|
| Contract | Zod 4 fixtures for intake, inspection, and damage claim; mutual confirmation, estimate separation, complete category fields, condition chain, evidence arrays, and `ApiError { code, message, requestId, details }`; unknown insurance/coverage fields reject. |
| Handler/state | Intake → estimate approval → payment → custody, every handoff, return comparison, inspector conflict/template/payment, superseding report, evidence-only claim, and Shard 06 contest link. |
| Authorization/RLS | Buyer/seller/provider/custodian/inspector/reviewer/anonymous; 403 versus 404; condition media, findings, estimates, declared value, and PII redaction; direct table grants denied. |
| Concurrency/recovery | Mutual handoff race, duplicate estimate payment, simultaneous return/claim, report correction, provider timeout, graph conflict retry, Shard 06/23 replay, and event dedupe. |
| Integration | BE00 payment/upload, Shard 01 conflict graph, Shard 06 evidence, and Shard 23 custody history verify exact timeout/retry/backoff/breaker behavior. |
| Observability | Per-operation requestId/operationId/item/job/resource/version/result metrics; audit hash present; no media, signatures, findings, credentials, or unrestricted PII. |

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** mutual confirmations, condition sides, estimate currency/parts/labour, report template, claim references, evidence hashes, and closed states are strict.
- **Pass 2 — macro contract:** SRV-17–SRV-19 map one-to-one to routes; repair, inspection, claim, Shard 06, and Shard 23 ownership boundaries are explicit.
- **Pass 3 — race/recovery:** custody CAS, report versioning, payment/upload/conflict/dispute/provenance effect keys, outbox dedupe, and pending states are bounded.
- **Pass 4 — security/privacy:** custody RLS, evidence references, CORS, rate limits, 403/404, fee/value separation, and redacted events/audit are per operation.

## Ambiguity Gate

**PASS.** SRV-17–SRV-19 are reconciled one-to-one with stable operation IDs. Mutual custody, estimate/payment timing, inspection conflict/template/payment, evidence-only damage claims, Shard 06 adjudication, and Shard 23 history are deterministic; every operation has strict Zod 4 request/success/error contracts, explicit CORS/auth/rate/validation middleware, typed persistence, events, tests, and failure recovery. No implementation decision remains open.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored repair, inspection, custody, and damage-evidence backend split from IA Shard 14. | `/write-be-spec` | All |
| 2026-08-28 | Added per-operation Zod 4, CORS, custody RLS, provider seams, audit, event, and recovery contracts. | `/write-be-spec-write` | API, Database, Middleware, Events, Tests |

## Dependency References

- [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md): global `ApiError`, idempotency, RLS, uploads, payment effects, audit, outbox, and transport.
- [14a — Service listings, quotes & engagements](14a-service-listings-quotes-engagements.md), [14b — Requirements/SLA/milestones/revisions](14b-requirements-sla-milestones-revisions.md), and [14c — Delivery/acceptance/exit](14c-delivery-acceptance-exit-rights.md): engagement, milestone, artifact, and acceptance projections.
- [IA Shard 14](../ia/14-services-marketplace.md) and [Deep Dive 14](../ia/deep-dives/14-services-marketplace.md): canonical interactions, models, events, custody algorithm, and edge cases.
- Shards 01, 06, 23, and 26: conflict graph, evidence adjudication, gear provenance, and fulfilment/history seams; this split does not duplicate their endpoints.
