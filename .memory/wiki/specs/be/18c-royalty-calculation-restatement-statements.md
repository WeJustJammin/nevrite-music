# Royalty Calculation, Restatement & Statements — Backend Specification

**Status:** Complete
**IA source:** [Shard 18 — Royalty registration, ingestion, calculation and payout](../ia/18-royalty-accounting.md)
**Deep-dive source:** [Deep Dive 18 — Royalty accounting](../ia/deep-dives/18-royalty-accounting.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns authored executable deal-term versions, bitemporal calculation parameter resolution, exact royalty derivation, recoupment views, versioned restatement cascades and immutable payee statements. It contains ROY-11 through ROY-15. It consumes source-native normalized lines and confirmed identity mappings from 18b and rights/split truth from Shard 10; it never interprets contract prose, guesses a missing term, overwrites a prior calculation, or represents a calculated balance as platform-held money.

## Classification

- **Type:** deterministic accounting command boundary with immutable inputs, exact-decimal derivations, dependency lineage and read-safe statement projections.
- **Boundary:** deal_term_version, calculation_parameter_set, royalty_calculation, calculation_part, recoupment_application, restatement, payee_statement and calculated_balance ownership; normalized source facts, rights/splits, dispute cases and future provider effects remain explicit seams.
- **Expected operations:** five HTTP operations, one for each assigned IA interaction (ROY-11, ROY-12, ROY-13, ROY-14, ROY-15).
- **Approval:** blanket approval from /write-be-spec all shards; delegated decision authority applies.
- **Decision lock:** known-but-unrecorded terms hold rather than default; calculations use exact decimal and bitemporal facts; under-allocation remains a visible residual; recoupment is separate from earnings; restatement versions preserve prior authority; statements freeze display facts; payout is outside this split and disabled by B3.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Interactions, lines 83–87 | Normative preconditions, behaviors, completions and recovery for ROY-11–ROY-15. |
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Contracts — Core Types and Errors, lines 103–120 | ExactAmount, MoneyFact, CalculationState, named error codes and financial-state boundary. |
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Contracts — Calculation, Statement and Financial Gate, lines 152–163 | ResolveCalculationParameters, CalculateRoyalty, RoundPayableAggregate, DeriveRecoupmentPosition, RestateCalculation and IssuePayeeStatement. |
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Data Models, lines 178–185 | Required calculation, recoupment, restatement, statement and balance aggregates. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## Normalization and Calculation Algorithm, lines 44–55 | Four dates, bitemporal resolution, exact arithmetic, allocation bounds, residuals and largest-remainder conservation. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## Recoupment, Restatement and Statement Algorithm, lines 57–66 | Earnings separation, dependency traversal, dispute absorption, frozen display and residual visibility. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## B3 Payout and Escrow Gate, lines 68–75 | No custody/escrow claim and no provider execution before the separately evolved gate. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## Cross-Shard Contracts and ## Implementation Envelope, lines 103–121 | Shard 00, 01, 06, 10, 19 and 28/41 seams, RLS/PostgreSQL, Zod/Hono, queues and transactional outbox. |
| [BE00](00-infrastructure.md) | Request/Response Contracts, lines 112–138; Middleware & Policies, lines 253–298; Deterministic Protocol Rules, lines 330–348; Error Handling, lines 418–452 | Request IDs, actor context, idempotency, audit/outbox, ApiError, CORS and service-failure conventions inherited by every operation. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| ROY-11 Administrator records executable deal terms | ROY-CALC-API-01 | Human-authored closed-taxonomy term version, scope/order/effective and recorded times; contradictory or unrepresentable terms hold calculation. |
| ROY-12 System calculates royalties | ROY-CALC-API-02 | Confirmed identity plus fully resolved bitemporal rights/splits/allocation/terms; exact itemized derivation, hard over-allocation block and visible under-allocation residual. |
| ROY-13 User views recoupment | ROY-CALC-API-03 | Advance, order, reserve and cross-collateral terms remain separate from earnings; missing advance is explicit unknown. |
| ROY-14 New fact triggers restatement | ROY-CALC-API-04 | New version, cause, dependency manifest and deltas; prior version remains authoritative until cascade completion and disputes absorb concurrent change. |
| ROY-15 Administrator issues payee statement | ROY-CALC-API-05 | Immutable statement with frozen display FX/coverage and distinct earned, deducted, applied, payable and paid values; zero/broken-chain output remains visible. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| ROY-11 | Record terms | ROY-CALC-API-01 | Versioned term or typed TERMS_CONTRADICTORY/CALCULATION_HELD; no contract-text interpretation. |
| ROY-12 | Calculate royalty | ROY-CALC-API-02 | Immutable calculation parts, exact residual and parameter dependency hash. |
| ROY-13 | View recoupment | ROY-CALC-API-03 | Separate recoupment application and readable unknown position. |
| ROY-14 | Restate calculation | ROY-CALC-API-04 | Restatement manifest, versioned delta and durable requeue/outbox. |
| ROY-15 | Issue statement | ROY-CALC-API-05 | Frozen statement version with coverage, display rates, residual and component separation. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| ROY-CALC-API-01 | POST | /api/v1/royalties/deal-terms | ROY-11 | Rights administrator with a current mandate over the deal; term author is recorded. | 201 RecordDealTermSuccess |
| ROY-CALC-API-02 | POST | /api/v1/royalties/calculations | ROY-12 | Scoped calculation worker or mandated administrator; normalized line and confirmed mapping are readable in the same payee scope. | 201 CalculateRoyaltySuccess |
| ROY-CALC-API-03 | POST | /api/v1/royalties/calculations/{calculationId}/recoupment | ROY-13 | Payee/rightsholder reads own calculation; mandate-scoped administrator may request the derived position. | 200 DeriveRecoupmentSuccess |
| ROY-CALC-API-04 | POST | /api/v1/royalties/calculations/{calculationId}/restatements | ROY-14 | Authorized source owner or mandate-scoped calculation worker submits a named correction cause. | 202 RestateCalculationSuccess |
| ROY-CALC-API-05 | POST | /api/v1/royalties/payee-statements | ROY-15 | Payee/rightsholder reads own period; mandated administrator issues only the payee/period it may administer. | 201 IssuePayeeStatementSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | {accessToken, actingContextId, requiredRole, resourceScope} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms/150 ms before command | Open after 5 failures/30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 10 rights/splits/allocation resolver | {workId, recordingId, rightType, territory, sourceId, usageDate, knowledgeAt} → {rightsSnapshotId, splitSnapshotId, allocationSnapshotId, rightsFacts, splitFacts, allocationFacts} | 700 ms | 2 retries at 100 ms/300 ms with the same bitemporal read key | Open after 4 failures/30 s; calculation remains held_rights; half-open after 20 s. |
| Deal-term registry/projector | {dealId, workId, masterId, incomeType, territory, usageDate, knowledgeAt} → {termVersionId, taxonomy, value, scope, state} | 600 ms | 2 retries at 100 ms/300 ms; no retry on contradiction | Open after 4 failures/30 s; unresolved terms remain held_terms; half-open after 20 s. |
| Deterministic exact calculation worker | {normalizedLineId, parameterSetId, engineVersion, exactSourceAmount, rowKey} → {calculationId, parts[], deductions, residual, state, dependencyHash} | 2,500 ms | 2 retries at 200 ms/600 ms with same idempotency key | Open after 4 failures/60 s; job requeues with prior version untouched; half-open after 30 s. |
| Recoupment/balance projector | {calculationId, payeePartyId, advanceTerms, applicationOrder, reserve} → {applicationId, position, unknownReason, balanceVersion} | 900 ms | 2 retries at 100 ms/300 ms | Open after 4 failures/30 s; read returns typed dependency failure; half-open after 20 s. |
| Shard 09 statement/project handoff | {payeePartyId, period, calculationIds, coverage, statementVersion} → {deliveryProjectionId, acceptedVersion, freshnessAt} | 800 ms | 2 retries at 100 ms/300 ms; replay is version-keyed | Open after 4 failures/30 s; statement remains immutable and handoff retries from outbox; half-open after 20 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with VALIDATION_FAILED; timestamps are RFC 3339 with offset, dates are ISO calendar dates, identifiers are UUIDs, amounts are decimal strings, and every error uses the BE00/global envelope ApiError { code, message, requestId, details }.

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateTime = z.iso.datetime({ offset: true });
const DateOnly = z.iso.date();
const Key = z.string().min(16).max(160).regex(/^[A-Za-z0-9._:-]+$/);
const ExactAmount = z.string().regex(/^-?(0|[1-9]\d*)(\.\d{1,18})?$/);
const Currency = z.string().regex(/^[A-Z]{3}$/);
const Context = z.object({ actingContextId: Uuid }).strict();
const ApiErrorSchema = z.object({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: Uuid,
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
}).strict();
const MoneyFact = z.object({
  amount: ExactAmount,
  currency: Currency,
  precision: z.int().min(0).max(18),
  sourceRef: Key
}).strict();
const Cause = z.enum(["source_correction", "mapping_reversal", "rights_change", "allocation_change", "deal_term_change"]);
const Component = z.enum(["earned", "deducted", "applied", "payable", "paid", "residual"]);

export const RecordDealTermRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  dealId: Uuid.nullable(),
  workId: Uuid.nullable(),
  masterId: Uuid.nullable(),
  incomeType: z.string().trim().min(1).max(80),
  rightType: z.string().trim().min(1).max(80),
  territory: z.string().trim().min(2).max(16),
  sourceId: Uuid.nullable(),
  taxonomy: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(500),
  applicationOrder: z.int().positive(),
  effectiveFrom: DateOnly,
  effectiveTo: DateOnly.nullable(),
  recordedAt: DateTime,
  expectedVersion: z.int().positive().nullable()
}).strict();
export const RecordDealTermSuccess = z.object({
  termVersionId: Uuid,
  state: z.enum(["draft", "reviewed", "active", "contradictory", "superseded"]),
  dependencyHash: z.string().length(64).regex(/^[a-f0-9]+$/),
  version: z.int().positive()
}).strict();

export const CalculateRoyaltyRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  normalizedLineId: Uuid,
  parameterSetVersion: z.int().positive(),
  rightsSnapshotId: Uuid,
  splitSnapshotId: Uuid,
  allocationSnapshotId: Uuid,
  dealTermVersionId: Uuid.nullable(),
  usageDate: DateOnly,
  knowledgeAt: DateTime,
  sourceMoney: MoneyFact,
  rowKey: Key,
  policyVersion: z.string().trim().min(1).max(80),
  expectedVersion: z.int().positive().nullable()
}).strict();
export const CalculateRoyaltySuccess = z.object({
  calculationId: Uuid,
  parameterSetId: Uuid,
  state: z.enum(["ready", "incomplete", "held_terms", "held_rights", "calculated", "restated"]),
  parts: z.array(z.object({ partyId: Uuid, component: Component, amount: ExactAmount, currency: Currency, rowKey: Key }).strict()),
  residual: ExactAmount,
  dependencyHash: z.string().length(64).regex(/^[a-f0-9]+$/),
  version: z.int().positive()
}).strict();

export const DeriveRecoupmentRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  calculationId: Uuid,
  payeePartyId: Uuid,
  advanceId: Uuid.nullable(),
  applicationOrder: z.int().positive().nullable(),
  reserveAmount: ExactAmount.nullable(),
  crossCollateralScope: z.enum(["none", "deal", "catalogue"]).nullable(),
  expectedVersion: z.int().positive()
}).strict();
export const DeriveRecoupmentSuccess = z.object({
  calculationId: Uuid,
  applicationId: Uuid.nullable(),
  earnings: ExactAmount,
  applied: ExactAmount.nullable(),
  payable: ExactAmount.nullable(),
  position: z.enum(["known", "unknown"]),
  unknownReason: z.enum(["advance_missing", "application_terms_missing"]).nullable(),
  version: z.int().positive()
}).strict();

export const RestateCalculationRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  calculationId: Uuid,
  sourceCorrectionRef: Key,
  cause: Cause,
  affectedCalculationIds: z.array(Uuid).min(1).max(10000),
  affectedStatementIds: z.array(Uuid).max(1000),
  dependencyVersion: z.int().positive(),
  expectedVersion: z.int().positive()
}).strict();
export const RestateCalculationSuccess = z.object({
  restatementId: Uuid,
  state: z.enum(["queued", "running", "complete", "partial", "absorbed_by_dispute"]),
  priorVersion: z.int().positive(),
  newVersion: z.int().positive().nullable(),
  affectedCount: z.int().nonnegative(),
  version: z.int().positive()
}).strict();

export const IssuePayeeStatementRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  payeePartyId: Uuid,
  periodStart: DateOnly,
  periodEnd: DateOnly,
  calculationIds: z.array(Uuid).min(1).max(100000),
  displayCurrency: Currency,
  fxRatePinIds: z.array(Uuid),
  coverage: z.object({ sourceCount: z.int().nonnegative(), lineCount: z.int().nonnegative(), firstBreak: z.string().trim().max(240).nullable() }).strict(),
  expectedVersion: z.int().positive().nullable()
}).strict();
export const IssuePayeeStatementSuccess = z.object({
  statementId: Uuid,
  statementVersion: z.int().positive(),
  earned: ExactAmount,
  deducted: ExactAmount,
  applied: ExactAmount,
  payable: ExactAmount,
  paid: ExactAmount,
  residual: ExactAmount,
  displayCurrency: Currency,
  state: z.enum(["issued", "held", "restated"]),
  version: z.int().positive()
}).strict();

// Contract DEC-011: the only rounding boundary is a named, exact-decimal aggregate.
export type RoundPayableAggregateInput = {
  aggregateKey: string;
  policyVersion: string;
  rows: ReadonlyArray<{ rowKey: string; exactAmount: string }>;
  currencyMinorDigits: number;
};
export type RoundPayableAggregateOutput = {
  aggregateKey: string;
  roundedAggregate: string;
  rows: ReadonlyArray<{ rowKey: string; roundedAmount: string }>;
  conservation: "exact";
};
export function RoundPayableAggregate(input: RoundPayableAggregateInput): RoundPayableAggregateOutput;
// Implementation uses canonical row-key bytes and largest remainder; it rejects
// binary floats, list order, actor identity and a platform residue sink.
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| ROY-CALC-API-01 | RecordDealTermRequest | RecordDealTermSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| ROY-CALC-API-02 | CalculateRoyaltyRequest | CalculateRoyaltySuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| ROY-CALC-API-03 | DeriveRecoupmentRequest | DeriveRecoupmentSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| ROY-CALC-API-04 | RestateCalculationRequest | RestateCalculationSuccess / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| ROY-CALC-API-05 | IssuePayeeStatementRequest | IssuePayeeStatementSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Pagination and bounded reads

`ROY-CALC-API-03` is a fixed, singular recoupment-position projection, not a collection endpoint. Pagination, cursor, offset, page, sort, and client filters are not applicable and are rejected as unknown input; one calculation/payee/advance/application-order/reserve/scope tuple returns one `DeriveRecoupmentSuccess` with a typed position or unresolved state. It never enumerates calculation lines, payment records, or bank data.

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| ROY-CALC-API-01 | Require a mandate-scoped deal or work, closed taxonomy/value, positive application order, non-overlapping effective dates and recorded timestamp. Contradictory/unrepresentable values persist as contradictory and return TERMS_CONTRADICTORY plus CALCULATION_HELD; no text interpretation or default. |
| ROY-CALC-API-02 | Require reconciled normalized line, human-confirmed mapping, source money, four-date provenance, bitemporal snapshots and an optional explicit term version. Known deal with missing terms returns TERMS_UNKNOWN and no amount; incomplete rights or parts above whole return RIGHTS_INCOMPLETE/ALLOCATION_INVALID; under-allocation returns a named residual. |
| ROY-CALC-API-03 | Require readable calculation and payee scope. Advance, reserve, application order and cross-collateral scope are independent typed facts; absent advance/terms returns an unresolved position state and leaves earnings unchanged. |
| ROY-CALC-API-04 | Require source correction reference, closed cause, current dependency version and bounded affected IDs. Traverse calculation → recoupment → statement → future payout references; prior version cannot be overwritten, and disputed scopes are absorbed. |
| ROY-CALC-API-05 | Require at least one calculated/restated calculation, payee scope, closed period, display currency and frozen FX pin set. Freeze earned, deducted, applied, payable, paid, coverage and residual; zero/broken-chain output is still issued. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| ROY-CALC-API-01 | TERMS_CONTRADICTORY, CALCULATION_HELD, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for absent deal mandate; 404 hides unknown deal/work/term. | Required 30 days; hash includes scope/taxonomy/value/order/effective times. Replay returns term version; mismatch returns IDEMPOTENCY_MISMATCH. | 120 term writes/hour/deal; 500/day/administrator. | Log operationId, requestId, deal/work hash, taxonomy class, state, version and blocker code; never log contract prose or amounts. |
| ROY-CALC-API-02 | TERMS_UNKNOWN, RIGHTS_INCOMPLETE, ALLOCATION_INVALID, CALCULATION_HELD, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign line/payee; 404 hides line/mapping/snapshots. | Required 30 days; hash includes line/snapshot/engine/policy/row key. Replay returns calculation/version; mismatch returns IDEMPOTENCY_MISMATCH. | 600 calculations/hour/payee; 20 concurrent/worker. | Log operationId, requestId, line/parameter hashes, state, engine version, residual class, dependency latency and version; no amounts or names. |
| ROY-CALC-API-03 | TERMS_UNKNOWN, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for another payee; 404 hides calculation/advance. | Required 24 hours; hash includes calculation/payee/advance/order/reserve/scope. Replay returns application/unknown position; mismatch returns IDEMPOTENCY_MISMATCH. | 240 recoupment reads/hour/payee; 30 concurrent/actor. | Log operationId, requestId, calculation/payee hashes, known/unknown class, version and projector latency; no advance or bank data. |
| ROY-CALC-API-04 | CALCULATION_HELD, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for out-of-scope source correction; 404 hides calculation/statement. | Required 30 days; hash includes root/cause/correction/dependency version/affected IDs. Replay returns restatement state; mismatch returns IDEMPOTENCY_MISMATCH. | 60 restatements/hour/mandate; 10 concurrent/correction scope. | Log operationId, requestId, root/cause hashes, affected-count bucket, queue state and outbox latency; no statement contents. |
| ROY-CALC-API-05 | CALCULATION_HELD, FX_UNAVAILABLE, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for another payee/period; 404 hides calculation/payee. | Required 30 days; hash includes payee/period/calculation IDs/display currency/FX pins. Replay returns immutable statement; mismatch returns IDEMPOTENCY_MISMATCH. | 120 statements/hour/payee; 20 concurrent/administrator. | Log operationId, requestId, payee/period hashes, statement version, coverage/residual classes and handoff latency; no names, amounts or source bytes. |

## Database Schema

### PostgreSQL Model Registry

All tables are in schema royalty, use UUID primary keys, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL and version bigint NOT NULL CHECK (version > 0). Exact amounts are numeric(38,18) only for storage and are serialized as decimal strings; source facts, calculation versions and statement versions are append-only.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| deal_term_version | id uuid PK NOT NULL; deal_id uuid NULL FK identity.deal; work_id uuid NULL FK rights.work; master_id uuid NULL FK rights.master; income_type text NOT NULL; right_type text NOT NULL; territory text NOT NULL; source_id uuid NULL FK royalty.statement_source; taxonomy text NOT NULL; value text NOT NULL; application_order integer NOT NULL CHECK (application_order > 0); effective_from date NOT NULL; effective_to date NULL CHECK (effective_to IS NULL OR effective_to >= effective_from); recorded_at timestamptz NOT NULL; author_party_id uuid NOT NULL FK identity.party; state text NOT NULL CHECK (state IN ('draft','reviewed','active','contradictory','superseded')); contradiction_code text NULL; version bigint NOT NULL; timestamps. | Unique (deal_id, work_id, master_id, taxonomy, application_order, effective_from, version); (deal_id, state, effective_from DESC); (work_id, right_type, territory, effective_from). | Mandated administrator may insert/read scoped terms; payee may read terms that govern own statements; worker reads active snapshots; anon no grant; UPDATE denied after version creation. |
| calculation_parameter_set | id uuid PK NOT NULL; normalized_line_id uuid NOT NULL FK royalty.normalized_line; rights_snapshot_id uuid NOT NULL FK rights.rights_snapshot; split_snapshot_id uuid NOT NULL FK rights.split_snapshot; allocation_snapshot_id uuid NOT NULL FK rights.allocation_snapshot; deal_term_version_id uuid NULL FK royalty.deal_term_version; usage_date date NOT NULL; knowledge_at timestamptz NOT NULL; engine_version text NOT NULL; policy_version text NOT NULL; state text NOT NULL CHECK (state IN ('ready','incomplete','held_terms','held_rights','calculated','restated')); dependency_hash char(64) NOT NULL CHECK (dependency_hash ~ '^[a-f0-9]{64}$'); version bigint NOT NULL; timestamps. | Unique (normalized_line_id, usage_date, knowledge_at, version); (dependency_hash); (state, updated_at); (rights_snapshot_id, split_snapshot_id). | Worker inserts through scoped RPC; payee reads only parameter sets attached to own line; administrators read mandate scope; direct client UPDATE denied; service principal cannot widen RLS. |
| royalty_calculation | id uuid PK NOT NULL; normalized_line_id uuid NOT NULL FK royalty.normalized_line; parameter_set_id uuid NOT NULL FK royalty.calculation_parameter_set; payee_party_id uuid NOT NULL FK identity.party; source_amount numeric(38,18) NOT NULL; derived_amount numeric(38,18) NULL; currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'); deductions numeric(38,18) NOT NULL CHECK (deductions >= 0); residual numeric(38,18) NOT NULL; state text NOT NULL CHECK (state IN ('ready','incomplete','held_terms','held_rights','calculated','restated')); version bigint NOT NULL; timestamps. | Unique (normalized_line_id, parameter_set_id, version); (payee_party_id, state, created_at DESC); (payee_party_id, currency, updated_at DESC). | Payee/rightsholder reads own rows; mandate administrator and calculation worker operate scoped rows; no client amount UPDATE; service role only transaction RPC; anon no grant. |
| calculation_part | id uuid PK NOT NULL; calculation_id uuid NOT NULL FK royalty.royalty_calculation; party_id uuid NOT NULL FK identity.party; component text NOT NULL CHECK (component IN ('earned','deducted','applied','payable','paid','residual')); exact_amount numeric(38,18) NOT NULL; currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'); numerator numeric(38,18) NULL; denominator numeric(38,18) NULL CHECK (denominator IS NULL OR denominator > 0); row_key text NOT NULL; residual_reason text NULL; calculation_version bigint NOT NULL CHECK (calculation_version > 0); timestamps. | Unique (calculation_id, calculation_version, component, party_id, row_key); (party_id, component, created_at DESC); (calculation_id, row_key). | Party may read own parts; workers insert atomically with calculation; mandate admins read scoped parts; no delete/update; RLS prevents cross-payee joins. |
| recoupment_application | id uuid PK NOT NULL; calculation_id uuid NOT NULL FK royalty.royalty_calculation; payee_party_id uuid NOT NULL FK identity.party; advance_id uuid NULL FK rights.advance; obligation_id uuid NULL FK rights.obligation; applied_amount numeric(38,18) NULL CHECK (applied_amount IS NULL OR applied_amount >= 0); application_order integer NULL CHECK (application_order IS NULL OR application_order > 0); reserve_until date NULL; cross_collateral_scope text NULL CHECK (cross_collateral_scope IS NULL OR cross_collateral_scope IN ('none','deal','catalogue')); position_state text NOT NULL CHECK (position_state IN ('known','unknown')); unknown_reason text NULL; version bigint NOT NULL; timestamps. | Unique (calculation_id, payee_party_id, version); (payee_party_id, position_state, updated_at DESC); (advance_id, application_order). | Payee reads own position; mandated administrator may derive scoped position; projector inserts via RPC; direct balance edits and deletes denied; anon no grant. |
| restatement | id uuid PK NOT NULL; root_calculation_id uuid NOT NULL FK royalty.royalty_calculation; old_calculation_id uuid NOT NULL FK royalty.royalty_calculation; new_calculation_id uuid NULL FK royalty.royalty_calculation; old_statement_id uuid NULL FK royalty.payee_statement; new_statement_id uuid NULL FK royalty.payee_statement; cause text NOT NULL CHECK (cause IN ('source_correction','mapping_reversal','rights_change','allocation_change','deal_term_change')); source_correction_ref text NOT NULL; dependency_manifest jsonb NOT NULL CHECK (jsonb_typeof(dependency_manifest) = 'object'); delta_manifest jsonb NOT NULL CHECK (jsonb_typeof(delta_manifest) = 'object'); state text NOT NULL CHECK (state IN ('queued','running','complete','partial','absorbed_by_dispute')); prior_authoritative boolean NOT NULL; version bigint NOT NULL; timestamps. | Unique (root_calculation_id, source_correction_ref, version); (state, created_at); (old_calculation_id); (old_statement_id). | Source owner/mandate worker reads scoped lineage; payee reads its own restatement projection; worker inserts/advances via CAS; no delete; evidence details redacted from ordinary reads. |
| payee_statement | id uuid PK NOT NULL; payee_party_id uuid NOT NULL FK identity.party; period_start date NOT NULL; period_end date NOT NULL CHECK (period_end >= period_start); statement_version bigint NOT NULL CHECK (statement_version > 0); display_currency char(3) NOT NULL CHECK (display_currency ~ '^[A-Z]{3}$'); fx_rate_pin_ids uuid[] NOT NULL; coverage jsonb NOT NULL CHECK (jsonb_typeof(coverage) = 'object'); earned numeric(38,18) NOT NULL; deducted numeric(38,18) NOT NULL; applied numeric(38,18) NOT NULL; payable numeric(38,18) NOT NULL; paid numeric(38,18) NOT NULL; residual numeric(38,18) NOT NULL; first_break text NULL; state text NOT NULL CHECK (state IN ('issued','held','restated')); version bigint NOT NULL; timestamps. | Unique (payee_party_id, period_start, period_end, statement_version); (payee_party_id, period_end DESC, statement_version DESC); (state, updated_at). | Payee reads own statement; mandate admin issues scoped statement; Shard 09 receives read-only projection; immutable after issue except additive restatement linkage; no anon grant. |
| calculated_balance | id uuid PK NOT NULL; payee_party_id uuid NOT NULL FK identity.party; currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'); right_type text NOT NULL; territory text NOT NULL; period_start date NOT NULL; period_end date NOT NULL CHECK (period_end >= period_start); earned numeric(38,18) NOT NULL; deducted numeric(38,18) NOT NULL; applied numeric(38,18) NOT NULL; payable numeric(38,18) NOT NULL; paid numeric(38,18) NOT NULL; hold_reason text NULL; payout_gate text NOT NULL CHECK (payout_gate = 'disabled_b3'); source_version bigint NOT NULL; version bigint NOT NULL; timestamps. | Unique (payee_party_id, currency, right_type, territory, period_start, period_end, source_version); (payee_party_id, period_end DESC); (payout_gate, updated_at). | Payee reads own derived balance; administrators read mandate scope; payout split owns future transfer tables; no custody/escrow grants; balance components are immutable projections. |

### State, Concurrency and Transaction Rules

- deal_term_version moves draft → reviewed → active → superseded; contradictory input moves to contradictory and is never silently activated. An active version is append-only. Known deal plus missing terms is held_terms, not zero.
- calculation_parameter_set resolves rights, splits, allocation, source, right, territory, usage date and knowledge time together. A missing or unavailable dependency yields incomplete, held_rights or held_terms; a calculation cannot enter calculated until every required fact is present.
- Calculation arithmetic uses at least nine decimal places and exact decimal strings. Parts above the whole hard-fail ALLOCATION_INVALID; parts below the whole create an attributed residual. Deductions remain itemized. RoundPayableAggregate is invoked once at a named payable aggregate, uses canonical row-key bytes for ties and proves rounded rows equal the rounded aggregate.
- Every command takes an expected version and writes through one PostgreSQL transaction with compare-and-swap. The unique (idempotency_scope, idempotency_key) record and transactional outbox commit atomically. A retry returns the committed result; a conflict returns VERSION_CONFLICT.
- Recoupment has its own version and never mutates earned. Missing advance/application terms produce unknown, not a zero or hidden net.
- Restatement writes a dependency manifest before queueing. The old calculation/statement remains authoritative while descendants recompute. Each edge is idempotent; a partial cascade remains partial and requeues the missing edge. An open dispute absorbs the new version and exact delta; stale resolution cannot win a CAS race.
- Statement issue freezes the selected calculations, display FX pins, coverage and component totals. Zero, unpaid and broken-chain statements remain issueable. No statement row is deleted to hide a residual.

### Grants, RLS and Retention

- RLS predicates derive app.actor_party_id() and mandate version from BE00 acting context; resource checks use the payee, deal, work or correction owner on every command. service_role is unavailable to browser requests.
- Payee/rightsholder receives own statements, calculations, parts, recoupment and balances; a mandated administrator receives only active mandate scope; the worker can write derived rows through narrow stored procedures; Shard 09 receives an allowlisted read projection.
- Terms, calculations, parts, restatements and statements retain immutable lineage for the accounting/legal retention policy. Erasure requests revoke derived access and pseudonymize ordinary projections but do not delete required evidence, audit, source references or version lineage.
- Raw contract prose, bank/tax details and source statement bytes never enter these tables. Exact amounts are hidden from logs and public responses unless the caller owns the payee scope.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Payee/rightsholder | Read own calculations, recoupment, balances and statements; request own recoupment/dispute-linked views. | Other payees, term authoring, arbitrary recalculation or restatement. |
| Rights administrator | Mandate-scoped term authoring, calculation, restatement and statement issue; reads the governed payee scope. | Deals outside mandate, contract-text interpretation, balance edits or provider effects. |
| Calculation worker/service principal | Reads normalized lines and snapshots in a job scope; writes deterministic parameter/calculation/restatement projections. | Expanding job scope, choosing rights/terms, reading unrelated payees or issuing provider transfers. |
| Finance operator | Read calculated balances/statements and future gate state; no operation in this split grants payout authority. | Editing earnings, changing terms, releasing escrow, or bypassing B3. |
| Shard 09 reporting consumer | Read-only issued statement/coverage projection. | Mutation, raw evidence, term authoring or balance access beyond projection. |
| Dispute reviewer | Reads scoped version/delta and evidence references. | Direct calculation rewrite, cross-payee analytics or payout release. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| ROY-CALC-API-01 | requestId → strictCors(royaltyCalculationOrigins) → requireAuth → resolveActingContext → rateLimit(dealTermWrite) → parseZod(RecordDealTermRequest) → idempotency(30d) → authorizeDealMandate → closedTaxonomyGuard → termVersionTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| ROY-CALC-API-02 | requestId → strictCors(royaltyCalculationOrigins) → requireAuth → resolveActingContext → rateLimit(royaltyCalculation) → parseZod(CalculateRoyaltyRequest) → idempotency(30d) → authorizeLineScope → confirmedMappingGuard → bitemporalSnapshotGuard → exactDecimalCalculationQueue → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| ROY-CALC-API-03 | requestId → strictCors(royaltyCalculationOrigins) → requireAuth → resolveActingContext → rateLimit(recoupmentRead) → parseZod(DeriveRecoupmentRequest) → idempotency(24h) → authorizePayeeScope → separateEarningsGuard → recoupmentProjector → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| ROY-CALC-API-04 | requestId → strictCors(royaltyCalculationOrigins) → requireAuth → resolveActingContext → rateLimit(restatementCommand) → parseZod(RestateCalculationRequest) → idempotency(30d) → authorizeCorrectionScope → dependencyManifestGuard → disputeAbsorptionGuard → restatementOutboxTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| ROY-CALC-API-05 | requestId → strictCors(royaltyCalculationOrigins) → requireAuth → resolveActingContext → rateLimit(statementIssue) → parseZod(IssuePayeeStatementRequest) → idempotency(30d) → authorizePayeeMandate → fxFreezeGuard → coverageResidualGuard → statementTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |

### Security and Privacy Controls

Use payee-scoped opaque IDs, RLS-enforced mandate checks, signed one-use report links and private, no-store statement responses. Exact amounts are disclosed only to the owning payee, authorized mandate or scoped reviewer. Never log contract values, source bytes, names, bank/tax data, raw evidence, or unrestricted calculation IDs. CORS never permits * with credentials. Client input cannot select a rights snapshot, split, term or engine outside the authorized dependency set. Provider payout, escrow, wallet, float, revenue, forfeiture and redistribution concepts are absent while payout_gate = disabled_b3.

## Data Flow

1. ROY-CALC-API-01 validates the acting mandate, normalizes closed-taxonomy terms and appends a deal_term_version; contradiction is retained and emits a hold.
2. ROY-CALC-API-02 reads the 18b normalized line and confirmed mapping, resolves Shard 10 bitemporal snapshots, writes a calculation_parameter_set, computes exact parts and residual, then commits royalty_calculation, calculation_part, calculated_balance and outbox event atomically.
3. ROY-CALC-API-03 projects advance/application facts into recoupment_application without changing earnings; unknown terms stay visible.
4. ROY-CALC-API-04 records cause and dependency manifest, queues each descendant with the same idempotency key, and preserves old versions until the new graph is complete. Dispute scope is joined as a version edge, not a competing writer.
5. ROY-CALC-API-05 freezes FX/coverage/components, writes immutable statement version and read-only Shard 09 handoff. A missing display rate retains source-native value plus named residual.

## Events and Consumer Contracts

Events are transactional-outbox records with eventId, eventType, schemaVersion, occurredAt, aggregateId, aggregateVersion, correlationId and causationId. Payloads contain pseudonymous IDs, state/version, period class, cause class, coverage and dependency counts; they never contain amounts, contract values, source bytes, bank/tax data or unrestricted party names.

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| royalty.calculation.changed.v1 | ROY-CALC-API-02 and restatement worker | calculationId, payeePseudonym, period, state, version, dependencyHash; Shard 19 reporting and restatement worker consume it. |
| royalty.restatement.created.v1 | ROY-CALC-API-04 | restatementId, cause class, dependency count, prior/new version, state; statements, disputes and Shard 19 consume it. |
| royalty.payee-statement.issued.v1 | ROY-CALC-API-05 | statementId, payee pseudonym, period, statement version, coverage class; delivery and dispute projections consume it. |

Consumers must treat versions as monotonic, deduplicate by eventId and aggregate version, and never strengthen provenance, authority, confidence or terminal payment state.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| ROY-CALC-API-01 | Contradictory/unrepresentable term or registry outage | Commit the authored evidence as contradictory when safe, return TERMS_CONTRADICTORY/CALCULATION_HELD; if dependency unavailable, no term mutation, retry with same key after breaker recovery. |
| ROY-CALC-API-02 | Missing rights/terms, over-allocation, worker timeout | Persist held_rights/held_terms or ALLOCATION_INVALID; never estimate. Queue retry retains parameter hash and prior calculation; worker timeout leaves no partial parts. |
| ROY-CALC-API-03 | Missing advance terms or projector outage | Return an unresolved position state with unknownReason; earnings remain readable. Retry projector idempotently without netting or balance mutation. |
| ROY-CALC-API-04 | Restatement race, dispute race or partial cascade | CAS chooses one dependency version; dispute absorbs the exact delta; old version stays authoritative; missing edges requeue until complete, with no duplicate event effect. |
| ROY-CALC-API-05 | FX unavailable, broken source chain or statement handoff outage | Issue source-native residual/first honest break, preserve statement version, and retry only the read-only handoff from outbox. No statement suppression or hidden payment. |

All errors serialize ApiError { code, message, requestId, details }; details contains field paths, blocker owner, dependency state or retry-after metadata without private amounts or source evidence.

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| ROY-CALC-API-01 | Zod strict taxonomy, scope, dates, order, version and exact error envelope. | Mandate ownership, 403/404 concealment, CORS/rate and no contract prose logging. | Term uniqueness, contradictory retention, CAS, RLS/grants and outbox. | Registry outage, duplicate replay, contradiction and redacted audit. |
| ROY-CALC-API-02 | Exact amount, snapshots, bitemporal dates, row key, parts and residual schema. | Confirmed mapping only, payee scope, no default term, CORS/rate. | Parameter dependency hash, exact parts, over/under allocation, RLS and calculation event. | Missing oracle/FX/terms, worker timeout, circuit breaker and deterministic replay. |
| ROY-CALC-API-03 | Unknown position, separate earnings/applied/payable and nullable advance schema. | Payee ownership, no balance edit, CORS/rate and redaction. | Application uniqueness, immutable earnings, RLS and projector event/read. | Missing advance, projector outage, concurrent version and idempotent retry. |
| ROY-CALC-API-04 | Cause, bounded IDs, manifest, versions and state schema. | Correction mandate, dispute scope, CORS/rate and no stale write. | Dependency graph CAS, prior-authoritative flag, outbox and restatement event. | Partial cascade, duplicate edge, restatement/dispute race and recovery queue. |
| ROY-CALC-API-05 | Frozen FX/coverage and five component totals with exact error envelope. | Payee/mandate scope, private response, no custody/escrow claim, CORS/rate. | Immutable statement version, residual/first-break persistence, RLS and handoff event. | FX unavailable, broken chain, zero-paid statement and handoff breaker. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 strict schemas, exact decimal parsing, term taxonomy, bitemporal selection, allocation bounds, largest-remainder tie determinism, recoupment unknowns and error envelopes. PostgreSQL tests validate RLS, append-only versions, uniqueness, numeric precision, CAS, dependency manifests and outbox atomicity. Worker tests replay calculation/restatement graphs and prove no assumptions, duplicate parts or stale dispute winner. Playwright covers accessible statement tables, coverage/first-break/residual disclosure and private payee boundaries. The gate fails on binary floating point, contract-text interpretation, default term, guessed period/FX, rounded engine intermediate, dropped residual, overwritten prior version, cross-payee leak or any provider/custody claim.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — boundary:** verified ROY-11–ROY-15 map one-to-one to five operations; registration, ingestion, payout, recovery and dispute commands remain in sibling companions.
- **Pass 2 — micro:** resolved unknown terms versus no-deal behavior, over/under allocation, four dates, exact decimal precision, recoupment separation, statement components and source-native FX residual.
- **Pass 3 — macro:** traced normalized line → bitemporal parameter set → calculation → recoupment → restatement → statement; identified Shard 10/09/19 and BE00 dependencies with explicit failure behavior.
- **Pass 4 — abuse/recovery:** tested duplicate commands, dependency outage, worker timeout, CAS race, dispute absorption, partial cascade, zero-paid statement and privacy-safe telemetry.
- **Pass 5 — contract:** every operation has Zod request/success/error contracts, 403/404 rule, idempotency, rate, CORS, global envelope, persistence and operation-level tests.

## Ambiguity Gate

**PASS.** Source behavior is decisive for all five interactions. Missing term, rights, allocation, FX, display coverage, provider effects and dispute/restatement races have typed terminal or retry states. No unresolved product, architecture or implementation ambiguity remains inside this split.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored the five-operation calculation, recoupment, restatement and statement backend boundary with exact contracts, persistence, event and failure controls. | /write-be-spec |

## Dependency References

- **Depends on:** [BE00](00-infrastructure.md) for acting context, ApiError, idempotency, audit, outbox and capability gates; 18b for normalized_line, source_identity_mapping, fx_rate_pin and confirmed mapping; Shard 10 for rights/splits/allocation; Shard 01 for parties and mandates; Shard 06 for dispute absorption.
- **Consumed by:** Shard 09 read-only statement delivery and Shard 19 reporting/forecasting consume immutable calculation/statement versions; Shard 28 consumes the generic RoundPayableAggregate contract at its own promotion boundary; Shard 41 consumes IssuePayeeStatement, DeriveRecoupmentPosition and RoundPayableAggregate without recalculating or mutating this shard.
- **Boundary:** Payout execution remains PAYOUT_DISABLED_B3 in 18d; this split exposes calculated positions only and never creates custody, escrow, wallet, float, revenue, forfeiture or redistribution semantics.
