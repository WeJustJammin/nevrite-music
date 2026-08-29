# Title, Control, Conflicts and Freezes — Backend Specification

## Split Group

Shard 10 rights and ownership, split 10c. This companion owns title and grant events, control projections, conflict detection and Shard 06 case and exact-scope freeze instructions for RGT-09 through RGT-13. It does not adjudicate merits, hold funds, assert ownership from credits, or mutate the base ledger owned by 10a.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| RGT-09 transfer, grant or reversion | Append-only title command | Right, share, territory, period, parties, evidence and TrustLevel are explicit. Conflicting events coexist; fixed approved reversion may execute, conditional reversion only notifies. |
| RGT-10 control summary | Derived projection query | Folds consented ledgers, joint-owner rule, grants, encumbrances, covenants and custody. Verdicts are authorized, blocked or no_recorded_obstacle; the last is never clear title. |
| RGT-11 rights conflict | Synchronous detection command | Deterministic overlap classes run at claim/write time and cannot be suppressed. Duplicate candidate needs corroboration and can be permanently dismissed by either party. |
| RGT-12 rights case | Scoped case-link command | A standing party opens a Shard 06 case for exactly one right, share, territory and period; platform evidence is unweighted and merits stay with the case service. |
| RGT-13 disputed-share freeze | Authorized downstream instruction | A case outcome targets one exact share, territory and period. Downstream acknowledgement is required; whole-work freeze and self-release are denied. |

BE00 inheritance is mandatory for every operation: requestId, acting context, strict Zod 4 parsing, idempotency, audit/outbox, CORS, rate limits, RLS and ApiError { code, message, requestId, details }. Platform endpoints are not duplicated.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 10](../ia/10-rights-ownership.md) | Interactions, lines 66–83 | RGT-09 through RGT-13 title, control, conflict, case and freeze behavior and recovery. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Core Types and Errors, lines 100–111 | RightType, LedgerState, TrustLevel, ConflictKind and StandardError. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Agreements and Lifecycle, lines 125–134 | AppendTitleEvent, RecordGrant, RecordSuccession and term/reversion rules. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Conflicts, Consent and Evidence, lines 136–145 | DetectConflict, OpenRightsCase, IssueFreezeInstruction and no-merits rules. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Data Models, lines 147–197 | joint_owner_rule, control_projection, title_event, territory_grant, reversion_instruction, rights_conflict, rights_case_link and rights_freeze_instruction. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Access Control and Accessibility, lines 208–242 | Owner, administrator, estate, reviewer, public and system-worker boundaries. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Event Schemas and Edge Cases, lines 243–306 | Title, conflict and freeze events; conflicting events, public projection and adapter recovery. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Chain, Control and Reversion Algorithm, lines 105–114 | Coexisting title events, consented fold, control verdicts, fixed versus conditional reversion and succession. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Conflict, Dispute and Freeze Algorithm, lines 116–125 | Synchronous classes, duplicate corroboration, exact case scope, adapter acknowledgement and independent release. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Abuse and Recovery Verification, lines 137–149 | Forced control, whole-catalog freeze, self-release and public dispute leakage protections. |
| [BE00](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Global request, error, middleware and deterministic protocol contracts | Exact ApiError, request IDs, idempotency, audit/outbox, CORS, CAS and fail-closed inheritance. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| RGT-09 Record transfer/grant/reversion | RGT-TTL-API-01 | Appends title events with explicit scope, parties, evidence and trust; missing grant term is incomplete; only fixed approved reversion executes. |
| RGT-10 Resolve control summary | RGT-TTL-API-02 | Folds consented inputs and labels authorized, blocked or no_recorded_obstacle with jurisdiction, source, inputs and unknowns; never claims clear title. |
| RGT-11 Detect rights conflict | RGT-TTL-API-03 | Runs deterministic conflict classes at claim/write, requires corroboration for duplicate candidate, remembers dismissal and does not auto-open case or freeze money. |
| RGT-12 Open rights dispute | RGT-TTL-API-04 | Requires standing and exact one-right/share/territory/period scope, links Shard 06 case and leaves platform evidence unweighted. |
| RGT-13 Freeze disputed share | RGT-TTL-API-05 | Requires authorized case outcome, exact scope and downstream adapter; fails closed if acknowledgement is missing and denies beneficiary self-release. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| RGT-09 | Record title transfer, grant or reversion | RGT-TTL-API-01 | Append-only event, explicit scope and term, conflict coexistence and approved reversion state. |
| RGT-10 | Derive control summary | RGT-TTL-API-02 | Consent-only fold with verdict, source, jurisdiction, inputs and unknown labels. |
| RGT-11 | Detect and record rights conflict | RGT-TTL-API-03 | Synchronous deterministic class, corroborated duplicate signal and dismissal version. |
| RGT-12 | Open exact-scope Shard 06 case | RGT-TTL-API-04 | Standing, one-right/share/territory/period scope and case link. |
| RGT-13 | Issue exact-scope downstream freeze | RGT-TTL-API-05 | Authorized instruction, adapter acknowledgement, independent release authority and version history. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to one operation ID.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| RGT-TTL-API-01 | POST | /api/v1/rights/title-events | RGT-09 | Standing actor for named party, right and object; verified estate or grant authority where applicable. | 201 AppendTitleEventSuccess |
| RGT-TTL-API-02 | POST | /api/v1/rights/control-summaries | RGT-10 | Actor allowed to read the object’s consented rights state. | 200 ResolveControlSummarySuccess |
| RGT-TTL-API-03 | POST | /api/v1/rights/conflicts | RGT-11 | Claim/write service or authorized rights actor for the triggering object. | 201 DetectConflictSuccess |
| RGT-TTL-API-04 | POST | /api/v1/rights/rights-cases | RGT-12 | Standing party for the exact contested right/share/territory/period. | 201 OpenRightsCaseSuccess |
| RGT-TTL-API-05 | POST | /api/v1/rights/freeze-instructions | RGT-13 | Authorized legal/payment workflow outcome with independent release authority. | 201 IssueFreezeInstructionSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting-context verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms and 150 ms before mutation | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| 10a ledger and ownership resolver | {objectId, rightType, ledgerVersion, titleEventId, asOf} → {consentedLedger, jointRule, ownerRows, version, unresolvedGaps} | 700 ms | 2 retries at 100 ms and 300 ms with expected version | Open after 4 failures in 30 s; control returns unknown and title mutation stops; half-open after 20 s. |
| Shard 01 representation and succession resolver | {partyId, estateId, authorityRef, effectiveAt} → {representationState, authorityVersion, successionScope, actorPartyId} | 500 ms | 2 retries at 75 ms and 225 ms; stale authority rejected | Open after 4 failures in 30 s; title event returns FORBIDDEN or DEPENDENCY_UNAVAILABLE; half-open after 20 s. |
| Shard 06 case and evidence resolver | {objectId, rightType, shareHash, territory, period, caseRef} → {caseId, caseState, evidenceVersion, authorizedOutcome, releaseAuthority} | 700 ms | 2 retries at 100 ms and 300 ms; no freeze on uncertainty | Open after 4 failures in 30 s; case stays retryable and freeze remains unissued; half-open after 20 s. |
| Shard 04 delivery adapter | {freezeId, exactScope, requiredAssetState, caseRef} → {deliveryCommandId, acknowledgedState, deliveryVersion} | 900 ms | 2 retries at 150 ms and 450 ms using same instruction key | Open after 4 failures in 30 s; payment/distribution gate fails closed and instruction remains unacknowledged; half-open after 20 s. |
| Royalty and distribution hold adapter | {freezeId, exactShareScope, requiredState, releaseAuthority} → {holdId, acknowledged, adapterVersion} | 900 ms | 2 retries at 150 ms and 450 ms using same instruction key | Open after 4 failures in 30 s; no custody claim and downstream operation remains blocked; half-open after 20 s. |
| BE00 audit and outbox | {eventType, aggregateId, version, requestId} → {auditId, outboxId, acceptedAt} | 400 ms | 3 retries at 100 ms, 300 ms and 900 ms | Open after 5 failures in 30 s; canonical state commits with dispatch pending; half-open after 15 s. |

## Request/Response Contracts

All requests require Idempotency-Key and canonical body hashing. Exact share values use integer numerator and positive denominator. Every failure uses ApiError { code, message, requestId, details }.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const RightTypeSchema = z.enum([
  "composition_writer", "composition_publisher", "master", "performer",
  "neighbouring", "nil", "ai_training", "security_interest"
]);
const TrustLevelSchema = z.enum(["platform_witnessed", "evidence_attached", "asserted", "imported"]);
const ConflictKindSchema = z.enum([
  "arithmetic_overlap", "double_assignment", "territory_collision",
  "external_conflict", "duplicate_candidate", "public_domain_contradiction"
]);
const RationalSchema = z.strictObject({
  numerator: z.int().positive(),
  denominator: z.int().positive()
});
const ApiErrorSchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.uuid(),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
});

export const AppendTitleEventRequest = z.strictObject({
  objectId: z.uuid(),
  rightType: RightTypeSchema,
  share: RationalSchema,
  territory: z.string().min(1).max(128),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime().nullable(),
  eventKind: z.enum(["transfer", "grant", "reversion", "succession"]),
  fromPartyId: z.uuid().nullable(),
  toPartyId: z.uuid().nullable(),
  evidenceRef: z.string().min(1).max(256),
  trust: TrustLevelSchema,
  reversionRuleVersion: z.int().positive().nullable(),
  expectedObjectVersion: z.int().positive()
});
export const AppendTitleEventSuccess = z.strictObject({
  titleEventId: z.uuid(),
  state: z.enum(["recorded", "notify_only", "executed"]),
  version: z.int().positive(),
  requestId: z.uuid()
});

export const ResolveControlSummaryRequest = z.strictObject({
  objectId: z.uuid(),
  rightType: RightTypeSchema,
  territory: z.string().min(1).max(128),
  asOf: z.iso.datetime(),
  expectedLedgerVersion: z.int().positive()
});
export const ResolveControlSummarySuccess = z.strictObject({
  projectionId: z.uuid(),
  verdict: z.enum(["authorized", "blocked", "no_recorded_obstacle", "uncertain"]),
  jurisdiction: z.string().min(1).max(128),
  sourceClass: z.string().min(1).max(64),
  unknownLabels: z.array(z.enum(["ledger_unavailable", "authority_unresolved", "evidence_missing", "projection_stale"])),
  nonAdvice: z.literal(true),
  requestId: z.uuid()
});

export const DetectConflictRequest = z.strictObject({
  objectId: z.uuid(),
  rightType: RightTypeSchema,
  share: RationalSchema.nullable(),
  territory: z.string().min(1).max(128),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime().nullable(),
  claimRef: z.string().min(1).max(256),
  corroborationRef: z.string().max(256).nullable(),
  expectedObjectVersion: z.int().positive()
});
export const DetectConflictSuccess = z.strictObject({
  conflictId: z.uuid().nullable(),
  kind: ConflictKindSchema.nullable(),
  state: z.enum(["active", "dismissed", "unresolved", "none"]),
  requestId: z.uuid()
});

export const OpenRightsCaseRequest = z.strictObject({
  objectId: z.uuid(),
  rightType: RightTypeSchema,
  share: RationalSchema,
  territory: z.string().min(1).max(128),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime(),
  triggeringConflictId: z.uuid().nullable(),
  standingPartyId: z.uuid(),
  evidenceRefs: z.array(z.string().min(1).max(256)).max(50)
});
export const OpenRightsCaseSuccess = z.strictObject({
  caseLinkId: z.uuid(),
  caseId: z.uuid(),
  state: z.enum(["opened", "pending"]),
  requestId: z.uuid()
});

export const IssueFreezeInstructionRequest = z.strictObject({
  conflictId: z.uuid(),
  caseId: z.uuid(),
  objectId: z.uuid(),
  rightType: RightTypeSchema,
  share: RationalSchema,
  territory: z.string().min(1).max(128),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime(),
  adapter: z.enum(["delivery", "royalty", "distribution"]),
  requiredState: z.enum(["restricted", "disputed", "revoked"]),
  authorizedBy: z.uuid(),
  releaseAuthority: z.uuid(),
  evidenceRef: z.string().min(1).max(256)
});
export const IssueFreezeInstructionSuccess = z.strictObject({
  freezeId: z.uuid(),
  state: z.enum(["issued", "unacknowledged", "released", "superseded"]),
  acknowledged: z.boolean(),
  requestId: z.uuid()
});
export const RightsTitleApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| RGT-TTL-API-01 | AppendTitleEventRequest with Idempotency-Key | AppendTitleEventSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-TTL-API-02 | ResolveControlSummaryRequest with Idempotency-Key | ResolveControlSummarySuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-TTL-API-03 | DetectConflictRequest with Idempotency-Key | DetectConflictSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-TTL-API-04 | OpenRightsCaseRequest with Idempotency-Key | OpenRightsCaseSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-TTL-API-05 | IssueFreezeInstructionRequest with Idempotency-Key | IssueFreezeInstructionSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Pagination and bounded reads

`RGT-TTL-API-02` is a fixed, singular control-summary projection, not a collection endpoint. Cursor, offset, page, and list filters are not applicable and are rejected as unknown input; the request selects one object/right/territory/as-of/version tuple, and the typed `ResolveControlSummarySuccess` returns one verdict with bounded jurisdiction/source labels and a finite `unknownLabels` enum set. No holder, event, ledger-row, or conflict enumeration is returned.

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| RGT-TTL-API-01 | Require standing, right type, positive rational share, territory, period and evidence/trust. Grants require explicit term; missing term is incomplete. Fixed reversion executes only under approved rule; conditional reversion is notify_only. Conflicting transfers append and never choose a winner. |
| RGT-TTL-API-02 | Require readable object and consented ledger version. Fold only consented ledgers, joint-owner rule, grants, encumbrances, covenants and custody. Missing or contradictory inputs return uncertainty with jurisdiction, source, input and unknown labels; no_recorded_obstacle is not clear title. |
| RGT-TTL-API-03 | Require claim/write scope and deterministic class evaluation. Duplicate candidate requires title plus corroborating writer, identifier or fingerprint signal. Deterministic conflicts cannot be suppressed; dismissal remembers exact pair and version and does not auto-open case or freeze money. |
| RGT-TTL-API-04 | Require standing party and exactly one right, share, territory and period. Shard 06 case creation is a linked external effect; platform evidence remains unweighted and merits are not adjudicated here. |
| RGT-TTL-API-05 | Require linked case outcome, exact contested share scope, authorized actor, independent release authority and adapter. Whole-work freeze and beneficiary self-release are rejected. Missing adapter acknowledgement leaves instruction unacknowledged and downstream distribution/payment fails closed. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| RGT-TTL-API-01 | VALIDATION_FAILED, FORBIDDEN, TERRITORY_INCOMPLETE, COUNSEL_GATE_DISABLED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for no standing or succession authority; 404 hides unknown object/party/grant. | Required 7 years; hash covers object, right, rational share, territory, period, parties, event kind and evidence hash. Replay returns title event; mismatch returns IDEMPOTENCY_MISMATCH. | 120 title events/hour/party; 20 concurrent/object. | Log operationId, requestId, object hash, right class, scope hash, event/trust class, state and version; no party names or evidence. |
| RGT-TTL-API-02 | CONTROL_BLOCKED, FORBIDDEN, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for unreadable object; 404 hides unknown object or ledger. | Required 24 hours; hash covers object, right, territory, as-of and ledger version. Replay returns projection; mismatch returns IDEMPOTENCY_MISMATCH. | 600 summaries/hour/actor; 50 concurrent/object. | Log operationId, requestId, object/scope hashes, verdict, source class, unknown-count bucket and latency; no percentages, disputes or names. |
| RGT-TTL-API-03 | VALIDATION_FAILED, CONFLICT_ACTIVE, FORBIDDEN, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign claim/object; 404 hides unknown object or claim. | Required 7 years; hash covers object/right/scope, claim hash, corroboration hash and expected version. Replay returns conflict; mismatch returns IDEMPOTENCY_MISMATCH. | 300 detections/hour/object; 40 concurrent/object. | Log operationId, requestId, object/scope hashes, conflict kind, corroboration class, dismissal flag and version; no claim narrative. |
| RGT-TTL-API-04 | VALIDATION_FAILED, FORBIDDEN, CONFLICT_ACTIVE, DEPENDENCY_UNAVAILABLE. 403 for no standing; 404 hides unknown object/conflict/case. | Required 7 years; hash covers exact scope, standing party hash, conflict and evidence refs. Replay returns case link; mismatch returns IDEMPOTENCY_MISMATCH. | 30 cases/hour/party; 5 concurrent/object. | Log operationId, requestId, object/scope/case hashes, standing class, case state and latency; no evidence or party names. |
| RGT-TTL-API-05 | VALIDATION_FAILED, FORBIDDEN, CONFLICT_ACTIVE, DEPENDENCY_UNAVAILABLE, VERSION_CONFLICT. 403 for unauthorized workflow or beneficiary self-release; 404 hides unknown conflict/case/freeze. | Required 7 years; hash covers case/conflict, exact scope, adapter, required state, authorities and evidence hash. Replay returns freeze; mismatch returns IDEMPOTENCY_MISMATCH. | 60 freeze instructions/hour/case; 10 concurrent/adapter. | Log operationId, requestId, freeze/case/scope hashes, adapter, required/acknowledged state, release-authority class and latency; no evidence or beneficiary identity. |

## Database Schema

### PostgreSQL Model Registry

PostgreSQL owns title, control and conflict instruction state. Every model row declares typed nullable fields, constraints, foreign keys, indexes and RLS/grants. Conflicting title records remain immutable and coexisting.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| joint_owner_rule | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; master_ledger_id uuid NOT NULL FK rights.rights_ledger_version; rule text NOT NULL CHECK rule IN ('unanimous','majority_by_share'); consented_version bigint NOT NULL CHECK consented_version>0; state text NOT NULL CHECK state IN ('draft','consented','superseded'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(master_ledger_id, consented_version); (master_ledger_id, state, version DESC); (owner_id); (state) | Ledger parties read rules for their object; authorized ledger service appends; control worker reads consented rules; direct update/delete denied; anon no grant. |
| control_projection | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; object_id uuid NOT NULL; right_type text NOT NULL CHECK right_type IN ('composition_writer','composition_publisher','master','performer','neighbouring','nil','ai_training','security_interest'); territory text NOT NULL; ledger_version bigint NOT NULL CHECK ledger_version>0; verdict text NOT NULL CHECK verdict IN ('authorized','blocked','no_recorded_obstacle','uncertain'); evidence_hash text NOT NULL CHECK length(evidence_hash)=64; jurisdiction text NOT NULL; source_class text NOT NULL; input_manifest jsonb NOT NULL CHECK jsonb_typeof(input_manifest)='object'; unknown_labels jsonb NOT NULL CHECK jsonb_typeof(unknown_labels)='array'; non_advice boolean NOT NULL CHECK non_advice=true; evaluated_at timestamptz NOT NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(object_id, right_type, territory, ledger_version, version); (object_id, right_type, territory, evaluated_at DESC); (verdict, evaluated_at DESC); (evidence_hash) | Object-authorized parties read scoped projection; control worker inserts; public gets allowlisted no_recorded_obstacle class without percentages; no direct mutation/delete; anon no grant. |
| title_event | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; right_type text NOT NULL CHECK right_type IN ('composition_writer','composition_publisher','master','performer','neighbouring','nil','ai_training','security_interest'); object_id uuid NOT NULL; share_numerator bigint NOT NULL CHECK share_numerator>0; share_denominator bigint NOT NULL CHECK share_denominator>0; territory text NOT NULL; period_start timestamptz NOT NULL; period_end timestamptz NULL CHECK period_end IS NULL OR period_end>=period_start; event_kind text NOT NULL CHECK event_kind IN ('transfer','grant','reversion','succession'); from_party_id uuid NULL FK identity.party; to_party_id uuid NULL FK identity.party; evidence_ref text NOT NULL; trust text NOT NULL CHECK trust IN ('platform_witnessed','evidence_attached','asserted','imported'); effective_at timestamptz NOT NULL; recorded_at timestamptz NOT NULL; conflict_ids uuid[] NOT NULL; state text NOT NULL CHECK state IN ('recorded','notify_only','executed'); reversion_rule_version bigint NULL CHECK reversion_rule_version IS NULL OR reversion_rule_version>0; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | (object_id, right_type, territory, period_start, recorded_at DESC); (from_party_id, recorded_at DESC); (to_party_id, recorded_at DESC); (event_kind, state); GIN(conflict_ids) | Standing actor appends title event; control and chain workers read; public projection excludes parties and evidence; no update/delete; anon no grant. |
| territory_grant | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; anchor_row_id uuid NOT NULL FK rights.rights_ledger_row; right_type text NOT NULL; grantee_id uuid NOT NULL FK identity.party; territory_set jsonb NOT NULL CHECK jsonb_typeof(territory_set)='array'; right_scope jsonb NOT NULL CHECK jsonb_typeof(right_scope)='object'; term text NOT NULL; conditions jsonb NOT NULL CHECK jsonb_typeof(conditions)='object'; collection_share_numerator bigint NULL CHECK collection_share_numerator IS NULL OR collection_share_numerator>0; collection_share_denominator bigint NULL CHECK collection_share_denominator IS NULL OR collection_share_denominator>0; evidence_ref text NOT NULL; state text NOT NULL CHECK state IN ('active','expired','superseded','incomplete'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (anchor_row_id, state); (grantee_id, state); (state, updated_at); GIN(territory_set); (right_type) | Anchored grant holder reads own grant; title worker appends; control reads active grants; direct update/delete denied; anon no grant. |
| reversion_instruction | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; grant_id uuid NOT NULL FK rights.territory_grant; rule_version bigint NOT NULL CHECK rule_version>0; exact_scope jsonb NOT NULL CHECK jsonb_typeof(exact_scope)='object'; deadline timestamptz NOT NULL; conditions jsonb NOT NULL CHECK jsonb_typeof(conditions)='object'; authority_id uuid NOT NULL FK identity.party; state text NOT NULL CHECK state IN ('notify_only','scheduled','executed','cancelled'); execution_kind text NOT NULL CHECK execution_kind IN ('fixed_approved','conditional'); title_event_id uuid NULL FK rights.title_event; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (grant_id, state, deadline); (deadline, state); (authority_id); (title_event_id); UNIQUE(grant_id, rule_version) | Grant authority reads own instruction; scheduler executes fixed approved only; conditional path notifies; direct client execute denied; anon no grant. |
| rights_conflict | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; object_id uuid NOT NULL; right_type text NOT NULL; share_numerator bigint NULL CHECK share_numerator IS NULL OR share_numerator>0; share_denominator bigint NULL CHECK share_denominator IS NULL OR share_denominator>0; territory text NOT NULL; period_start timestamptz NOT NULL; period_end timestamptz NULL; kind text NOT NULL CHECK kind IN ('arithmetic_overlap','double_assignment','territory_collision','external_conflict','duplicate_candidate','public_domain_contradiction'); claim_refs jsonb NOT NULL CHECK jsonb_typeof(claim_refs)='array'; evidence_hash text NOT NULL CHECK length(evidence_hash)=64; dismissible boolean NOT NULL; dismissed_by uuid NULL FK identity.party; dismissed_pair_version bigint NULL; state text NOT NULL CHECK state IN ('active','dismissed','unresolved','resolved'); case_id uuid NULL FK trust_safety.case; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (object_id, right_type, territory, period_start, kind, state); (state, updated_at); (case_id); (dismissed_by); GIN(claim_refs) | Claiming actor reads own conflict; affected parties read scoped conflict; detection worker appends; Shard 06 reads linked case; public no grant and no conflict count. |
| rights_case_link | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; conflict_id uuid NULL FK rights.rights_conflict; case_id uuid NOT NULL FK trust_safety.case; object_id uuid NOT NULL; right_type text NOT NULL; share_numerator bigint NOT NULL CHECK share_numerator>0; share_denominator bigint NOT NULL CHECK share_denominator>0; territory text NOT NULL; period_start timestamptz NOT NULL; period_end timestamptz NOT NULL; standing_party_id uuid NOT NULL FK identity.party; evidence_refs jsonb NOT NULL CHECK jsonb_typeof(evidence_refs)='array'; state text NOT NULL CHECK state IN ('pending','opened','closed'); case_version bigint NOT NULL CHECK case_version>0; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(case_id, object_id, right_type, share_numerator, share_denominator, territory, period_start); (standing_party_id, state); (conflict_id); (case_id, state); (object_id, territory, period_start) | Standing party reads own case link; case service writes linked outcome; rights worker reads state; platform evidence remains unweighted; direct delete denied; anon no grant. |
| rights_freeze_instruction | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; conflict_id uuid NOT NULL FK rights.rights_conflict; case_id uuid NOT NULL FK trust_safety.case; object_id uuid NOT NULL; right_type text NOT NULL; share_numerator bigint NOT NULL CHECK share_numerator>0; share_denominator bigint NOT NULL CHECK share_denominator>0; territory text NOT NULL; period_start timestamptz NOT NULL; period_end timestamptz NOT NULL; adapter text NOT NULL CHECK adapter IN ('delivery','royalty','distribution'); required_state text NOT NULL CHECK required_state IN ('restricted','disputed','revoked'); state text NOT NULL CHECK state IN ('issued','unacknowledged','acknowledged','released','superseded'); authorized_by uuid NOT NULL FK identity.party; release_authority uuid NOT NULL FK identity.party; evidence_ref text NOT NULL; adapter_command_id uuid NULL; acknowledged_at timestamptz NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(conflict_id, adapter, object_id, right_type, territory, period_start, version); (adapter, state, updated_at); (case_id, state); (release_authority); (object_id, territory, period_start); | Authorized workflow inserts; adapter worker updates acknowledgement through RPC; release requires release_authority and cannot equal beneficiary; downstream reads exact scope; direct update/delete denied; anon no grant. |

### State, Concurrency and Transaction Rules

- Title events are append-only and conflicting events coexist. Chronology never chooses a winner. Control projection folds only non-conflicted effective events over the last consented ledger and preserves gaps.
- A fixed approved reversion locks grant and rule version, then appends title event and updates projection atomically at deadline. A conditional reversion remains notify_only. Succession uses Shard 01 representation and records an event without deciding probate priority.
- Control summary includes consented ownership, joint_owner_rule, territory grants, encumbrances, covenants and custody. Missing or contradictory input returns uncertainty and never clear title.
- Conflict detection runs synchronously at claim/write. Deterministic classes are non-suppressible. Duplicate candidate requires corroboration; dismissal stores exact pair and version and prevents re-raising that pair.
- Rights case scope is exactly one right, share, territory and period. Shard 06 case creation is an external effect; failure leaves retryable pending link and no freeze.
- Freeze instruction scope is exact contested share. Delivery, royalty or distribution acknowledgement is required; downstream operation fails closed if it does not arrive. The rights service never claims custody of funds.
- Release requires an independent authority distinct from the beneficiary. Every transition uses compare-and-swap, idempotency, audit and outbox; deletion preserves conflict and case history.

### Grants, RLS and Retention

- RLS requires object, standing party, linked case, adapter assignment or authorized release scope. Public projections omit disputes, private deals, percentages and contact data.
- Evidence refs, claim narratives, exact shares, case details and release authority are excluded from ordinary logs and public events. Hashes and state classes are used.
- Title, control, conflict, case and freeze history retain 7 years or legal hold, whichever is longer. Conflicting events and dismissed pairs remain visible to authorized parties.
- Service principals receive named RPC grants for title append, control fold, detection, case link, adapter acknowledgement and outbox. No wildcard table or storage grant exists.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Named owner or writer | Read consented control and append standing title event. | Choose a conflict winner, self-release freeze or expose another party’s evidence. |
| Estate or successor | Scoped title action under verified Shard 01 representation. | Login as deceased, decide probate priority or rewrite history. |
| Dispute/legal reviewer | Assigned Shard 06 case, evidence and exact freeze authorization. | General merits adjudication, whole-work freeze or beneficiary self-release. |
| Registration/payment operator | Read or acknowledge assigned exact-scope adapter instruction. | Hold funds in this service, widen scope or suppress conflict. |
| Public/fan | Publication-safe control/provenance class. | Percentages, disputes, case existence, private economics or contact data. |
| System worker | Detect, fold, notify and project state. | Create consent, decide merits, infer clear title or choose conflict winner. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| RGT-TTL-API-01 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(titleEvent) → parseZod(AppendTitleEventRequest) → idempotency(7y) → authorizeStandingOrSuccession → explicitTermGuard → fixedReversionRuleGuard → titleEventAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-TTL-API-02 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(controlSummary) → parseZod(ResolveControlSummaryRequest) → idempotency(24h) → authorizeRightsRead → consentedLedgerGuard → conflictFoldGuard → controlProjectionTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RGT-TTL-API-03 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(conflictDetection) → parseZod(DetectConflictRequest) → idempotency(7y) → authorizeClaimScope → synchronousConflictClassGuard → duplicateCorroborationGuard → dismissalVersionGuard → conflictAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-TTL-API-04 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(rightsCaseOpen) → parseZod(OpenRightsCaseRequest) → idempotency(7y) → authorizeExactScopeStanding → exactOneScopeGuard → shard06CaseLinkTransaction → evidenceWeightIsolationGuard → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-TTL-API-05 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(freezeInstruction) → parseZod(IssueFreezeInstructionRequest) → idempotency(7y) → authorizeCaseOutcome → exactShareScopeGuard → independentReleaseAuthorityGuard → downstreamAcknowledgementGuard → freezeInstructionTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |

### Security and Privacy Controls

- Strict Zod 4 parsing rejects missing grant terms, broad freeze scopes, invalid rational shares, duplicate case scope, unsupported event kinds and beneficiary self-release.
- CORS allows configured rights origins with credentials and CSRF protection. Public projection and verification routes are separate from credentialed case and freeze commands.
- 403 denotes an authenticated actor without authority over a known object, case or freeze. 404 hides unknown or out-of-scope resources. Error details expose stable code and requestId only.
- Deterministic conflicts cannot be suppressed and no platform role adjudicates merits. Public output excludes dispute existence, percentages, evidence and private economics.
- Adapter commands carry exact scope and idempotency key. An unacknowledged freeze is not reported as held; this service never claims custody of money.

## Data Flow

1. RGT-TTL-API-01 verifies standing and appends transfer, grant, succession or reversion title event. Fixed approved rules can execute; conditional rules notify. It emits rights.title-event.recorded.v1.
2. RGT-TTL-API-02 resolves consented ledger and effective title, then folds joint-owner rule, grants, encumbrances, covenants and custody into a safe control projection.
3. RGT-TTL-API-03 evaluates deterministic conflict classes synchronously and appends conflict or dismissal state, emitting rights.conflict.changed.v1. It never opens a case or freezes money automatically.
4. RGT-TTL-API-04 validates exact scope and standing, links Shard 06 case and preserves platform evidence as unweighted.
5. RGT-TTL-API-05 accepts authorized case outcome and sends exact freeze command to Shard 04 or royalty/distribution adapter. It emits rights.freeze.changed.v1 and remains unacknowledged until adapter evidence arrives.
6. Downstream consumers read state, provenance and exact scope; no consumer may choose a title winner, infer clear title or broaden a freeze.

## Events and Consumer Contracts

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| rights.title-event.recorded.v1 | RGT-TTL-API-01 | titleEventId, object/right/scope hashes, event kind, trust class, effective/recorded time class and version; registry, control and chain export consume it. Exact parties, shares and evidence are excluded. |
| rights.conflict.changed.v1 | RGT-TTL-API-03 and case link | conflictId, kind, scope hash, state, case-state class and version; parties, Shard 06 and downstream gates consume it. Claim narratives and evidence blobs are excluded. |
| rights.freeze.changed.v1 | RGT-TTL-API-05 | freezeId, case hash, exact scope hash, adapter, required/acknowledged state, authority class and version; royalty/distribution and delivery adapters consume it. Evidence and beneficiary identity are excluded. |

Events are transactional-outbox records keyed by event ID and aggregate version. Consumers preserve conflict, case and acknowledgement state and cannot elevate a projection to a legal conclusion.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| RGT-TTL-API-01 | Missing term, no standing, succession outage, conflicting event or conditional reversion | Return VALIDATION_FAILED, FORBIDDEN, TERRITORY_INCOMPLETE or dependency error; append no unsafe event, retain conflicting history and keep conditional path notify_only. |
| RGT-TTL-API-02 | Missing consented ledger, contradiction, conflict fold or resolver outage | Return CONTROL_BLOCKED or dependency error with uncertainty labels; never return clear title or expose hidden conflict details. |
| RGT-TTL-API-03 | Malformed claim, unreadable input, duplicate without corroboration or concurrent version | Return VALIDATION_FAILED, unresolved state or VERSION_CONFLICT; deterministic conflict persists, duplicate waits for corroboration and dismissal remains versioned. |
| RGT-TTL-API-04 | No standing, broad scope, Shard 06 outage or duplicate case | Return FORBIDDEN or VALIDATION_FAILED; retain pending link for retry and never weigh platform evidence or create a partial freeze. |
| RGT-TTL-API-05 | Missing authorized outcome, whole-work scope, adapter outage or self-release | Return FORBIDDEN, VALIDATION_FAILED or dependency error; preserve unacknowledged instruction, fail downstream closed and require independent release authority. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| RGT-TTL-API-01 | Strict title scope, term, trust, rational share and exact ApiError schema. | Standing/succession, fixed versus conditional reversion, CORS/rate and 403/404. | Append-only events, conflict coexistence, CAS, RLS/grants and title event. | Missing term, authority outage, conflicting transfer, replay and evidence redaction. |
| RGT-TTL-API-02 | Consent-only inputs, verdict, unknown labels and non-advice schema. | Rights-read scope, no clear-title claim, CORS/rate and dispute privacy. | Consent fold, joint rule, projection version, RLS/grants and stale invalidation. | Contradictory inputs, resolver outage, conflict gap, replay and safe telemetry. |
| RGT-TTL-API-03 | Conflict classes, corroboration and dismissal schema. | Non-suppressible detection, duplicate threshold, CORS/rate and no auto-case. | Unique pair/version, synchronous write hook, RLS/grants and conflict event. | Unreadable input, concurrent claim, duplicate dismissal, replay and narrative redaction. |
| RGT-TTL-API-04 | Exact one-right/share/territory/period and case link schema. | Standing, Shard 06 boundary, evidence isolation, CORS/rate and 404 hiding. | Case link uniqueness, pending retry, RLS/grants and state event. | Case outage, duplicate case, broad scope, replay and safe logs. |
| RGT-TTL-API-05 | Exact freeze scope, adapter, required state and release authority schema. | Authorized outcome, no whole-work freeze, no self-release, CORS/rate and privacy. | Instruction CAS, adapter acknowledgement, RLS/grants and freeze event. | Adapter outage, acknowledgement retry, release race, replay and custody redaction. |

### Test Levels and Acceptance Gates

- Unit: strict Zod 4 rejects unsupported kinds, absent terms, invalid rational values, broad freeze scope and malformed case periods; every failure validates ApiError { code, message, requestId, details }.
- Integration: exercise BE00 context, Shard 01 succession, 10a ledger, Shard 06 case/evidence, Shard 04 delivery and royalty/distribution adapters with exact timeout and retry behavior.
- Database: verify append-only title/conflict/case/freeze records, consent-only control fold, exact scope predicates, independent release authority, RLS and no direct grants.
- Property: conflicting title events never choose a winner; duplicate dismissal blocks same pair/version; two freeze attempts serialize; adapter failure never reports money held.
- Acceptance gate: all five operations have route, Zod contract, field, error/auth/idempotency/rate/observability, middleware, persistence and test rows; all eight assigned models and three assigned events are literal-covered.

## Deepening Passes and Ambiguity Gate

### Micro Pass

- Missing grant term, conditional reversion, contradictory control inputs, duplicate without corroboration, broad case scope, adapter outage and beneficiary self-release have explicit incomplete, notify, uncertain, pending or denied state.
- Control verdict no_recorded_obstacle is explicitly non-advice and never a clearance or clear-title claim.

### Meso Pass

- joint_owner_rule and control_projection are derived from consented ledger and title inputs; title_event, territory_grant and reversion_instruction remain append-only legal-history records.
- rights_conflict, rights_case_link and rights_freeze_instruction separate detection, merits case and downstream effect. Platform evidence never receives merits weight.

### Macro Pass

- 10a owns base ledgers, 10b owns amendments, Shard 01 owns representation, Shard 06 owns disputes, Shard 04 executes delivery and downstream adapters own their acknowledgements. This companion owns title/conflict/freeze truth.
- Events, RLS and state provenance prevent downstream consumers from treating asserted or unresolved data as consented, clear or held.

## Ambiguity Gate

**PASS.** RGT-09 through RGT-13 map one-to-one to authoritative routes and complete operation-keyed matrices. Explicit title terms, coexistence, control uncertainty, deterministic conflict classes, duplicate corroboration, exact case and freeze scopes, Shard 06 boundary, adapter acknowledgement and independent release are resolved. BE00 ApiError, CORS, RLS and event exclusions are explicit.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored title-chain, control, conflict, Shard 06 case and exact-scope freeze backend contracts. | /write-be-spec |

## Dependency References

- **Consumes:** [BE00 request and error contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas), [Shard 01 Contracts](../ia/01-identity-authority.md#contracts) for representation and succession, [Shard 06 Contracts](../ia/06-trust-safety.md#contracts) for cases and evidence, [Shard 04 Contracts](../ia/04-cms-delivery-media.md#contracts) for delivery commands, and 10a ledger contracts for consented ownership.
- **Publishes:** rights.title-event.recorded.v1, rights.conflict.changed.v1 and rights.freeze.changed.v1 with hashed exact-scope and state metadata.
- **Sibling handoff:** 10a supplies ledger versions; 10b supplies amendment deltas; 10d consumes right and conflict boundaries; 10e consumes object/title/evidence versions.
- **Downstream:** Royalty, distribution, delivery and licensing consumers use exact acknowledged state only and cannot choose title winner, adjudicate merits or broaden a freeze.
