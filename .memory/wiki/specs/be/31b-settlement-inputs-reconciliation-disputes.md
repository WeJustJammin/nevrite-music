# Settlement Inputs, Reconciliation and Disputes — Backend Specification

## Split Group

- IA source: ../ia/31-live-settlement-intelligence.md.
- Assigned interactions: 31.04 Open settlement, 31.05 Reconcile box office, 31.06 Capture show expense, 31.07 Reconcile merch, 31.08 Recompute settlement and 31.09 Contest line.
- Owned canonical aggregates: SettlementSheet, SettlementInput, SettlementLine and LineDispute.
- Owned events: settlement.sheet.versioned, settlement.input.appended and settlement.line.disputed.
- Boundary: Shard 30 owns accepted deal/expression/show/run grammar; Shards 35/36 own ticket/box-office facts; Shard 34 owns tour expense sources; Shard 31 evaluates immutable inputs without adjudicating factual disputes.

## Classification and Source Inventory

| Source | Locked requirement |
|---|---|
| ../ia/31-live-settlement-intelligence.md | 31.04–31.09, settlement expression evaluation, input provenance, disputes, floor and versioning |
| 00-infrastructure.md | ApiError, auth/mandates, idempotency, uploads, queues, audit and telemetry |
| planned Shard 30 BE contract | accepted deal/expression/show/run snapshot seam |
| planned Shards 35/36 BE contracts | ticket and verified box-office count source seams |

## Endpoint Completeness Reconciliation

| IA ID | Method | Path | Success |
|---|---|---|---|
| 31.04 | POST | /api/v1/live/settlements | 201 SettlementSheetV1 |
| 31.05 | POST | /api/v1/live/settlements/{settlementId}/box-office-reconciliations | 201 SettlementVersionV1 |
| 31.06 | POST | /api/v1/live/settlements/{settlementId}/expenses | 201 SettlementInputV1 |
| 31.07 | POST | /api/v1/live/settlements/{settlementId}/merch-reconciliations | 201 SettlementVersionV1 |
| 31.08 | POST | /api/v1/live/settlements/{settlementId}/recomputations | 201 SettlementVersionV1 |
| 31.09 | POST | /api/v1/live/settlements/{settlementId}/line-disputes | 201 LineDisputeV1 |

## Shared Contract Inheritance

- Errors use ApiError { code, message, requestId, details }; safe details contain field/line ID, current revision and policy/error class only.
- Every browser mutation uses credentialled allowlisted CORS, CSRF, strict Zod and actor/side mandate. Device capture may queue offline but server acceptance remains authoritative.
- Idempotency-Key is mandatory. Every command quotes settlement If-Match/version; stale input is 412 REVISION_MISMATCH. Source events additionally bind producer/sourceEventId/digest.

## Referenced-Material Inventory

| Source | Exact section and lines | Normative use |
|---|---|---|
| [IA Shard 31](../ia/31-live-settlement-intelligence.md) | Interactions lines 82–109; Contracts lines 110–136; Data Models lines 137–198; Access Control lines 199–226; Event Schemas and Edge Cases lines 238–285 | Literal interaction IDs, request/outcome semantics, canonical model/event names, authorization, failure, and recovery constraints for this split |
| [BE00 Infrastructure](00-infrastructure.md) | API Endpoints lines 67–111; Zod 4 contracts lines 112–201; Database Schema lines 202–252; Middleware lines 253–307; Events lines 365–425; Error Handling lines 426–461; Observability lines 462–471 | Global routes, strict validation, ApiError envelope, CORS/auth/rate/idempotency, persistence/outbox, reliability, and telemetry inheritance |

## Feature Traceability

| IA Level-1 feature | Implementing authoritative operations |
|---|---|
| 17.09 Settlement & Reconciliation | 31.04–31.09 |

## API Endpoints

### Authoritative Route Registry

| ID | Method | Path | Authorization | Idempotency/concurrency | Rate/cache/deadline | Middleware and CORS |
|---|---|---|---|---|---|---|
| 31.04 | POST | /api/v1/live/settlements | confirmed/performed deal participant with settle.manage | key; deal/expression/show/run unique open sheet; source revisions locked | 20/hour show; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, deal/show authority, expression evaluator |
| 31.05 | POST | /api/v1/live/settlements/{settlementId}/box-office-reconciliations | authorized venue/promoter/artist settlement side for its source classes | key plus If-Match; source-event unique; stable input lock order | 120/hour show; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, source/side/provenance policy |
| 31.06 | POST | /api/v1/live/settlements/{settlementId}/expenses | authorized settlement participant/payer | key plus If-Match; device capture ID unique; upload receipt digest | 120/hour show; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, category/cap/receipt policy |
| 31.07 | POST | /api/v1/live/settlements/{settlementId}/merch-reconciliations | artist/venue merch settlement side within deal scope | key plus If-Match; evidence-source unique; stable line lock | 60/hour show; no-store; 5s | BE00-CORS-WEB-CREDENTIALLED, auth, CSRF, merch basis/rate/evidence |
| 31.08 | POST | /api/v1/live/settlements/{settlementId}/recomputations | settlement participant or registered source invalidator | key plus If-Match; source watermark/checksum unique; serializable append | 60/hour sheet; no-store; 10s | BE00-CORS-WEB-CREDENTIALLED or internal deny branch, auth, CSRF as applicable, evaluator |
| 31.09 | POST | /api/v1/live/settlements/{settlementId}/line-disputes | affected participant with visibility to named line/input | key plus If-Match; one open actor/causal input/basis; exposure CAS | 30/hour actor; no-store; 3s | BE00-CORS-WEB-CREDENTIALLED, auth, step-up, CSRF, participant/line/evidence policy |

## Request and Response Contracts — Zod 4

Money is bigint minor units and ISO-4217 currency; counts nonnegative safe integers; rates decimal strings; timestamps RFC 3339 UTC; device and server time are distinct; provenance is a registered closed enum with evidence refs.

| ID | Strict request | Success contract |
|---|---|---|
| 31.04 | OpenSettlementRequest { dealId, dealRevision, expressionId, expressionVersion, showId, runId nullable, sourceVersionSet, requestedCurrency } | SettlementSheetV1 { settlementId, version, versionHash, state proposed, lines, unevaluatedTerms, payableFloorMinor, payableCeilingMinor, sourceWatermark } |
| 31.05 | BoxOfficeReconcileRequest { countSources 1–20 each sourceKind/sold/paid/allAdmissions/comps/tiers/fees/provenance/sourceEventId/deviceAt/serverAt, gapTreatments typed } | SettlementVersionV1 with reconciled lines, gaps, variances and new hash |
| 31.06 | ExpenseAppendRequest { category, amountMinor, currency, payerPartyId, receiptUploadId nullable, assertionReason nullable, incurredAt, capTreatment expected/inside_cap/outside_cap/unknown, captureId } | SettlementInputV1 { inputId, provenanceGrade, deductibilityState, affectedLineIds, version } |
| 31.07 | MerchReconcileRequest { countIn, countOut, salesBySku, cashMinor, statementMinor nullable, basis gross/net/custom_registered, rateBands, bundles, venueAllocation, evidenceRefs } | SettlementVersionV1 with sellThrough, merchBasis, venueCut, unresolvedLines and variance |
| 31.08 | RecomputeSettlementRequest { causeKind source_appended/source_restated/expression_changed/dispute_state_changed, causalIds, sourceWatermark, reasonCode } | SettlementVersionV1 { priorVersion, version, versionHash, lineDiffs, totalDiff, unresolvedCount, payableFloor/Ceiling } |
| 31.09 | LineDisputeCreate { versionHash, lineId, causalInputIds, basisCode, exposureMinor, currency, evidenceRefs, escalationRequested false default } | LineDisputeV1 { disputeId, state open/answered/resolved/escalated/withdrawn, undisputedFloorMinor, affectedLineIds, version } |

#### Exact typed success schemas

Every operation comment below maps its route to one strict Zod 4 success body. The response cannot contain undeclared fields.

~~~ts
import { z } from "zod";
const Uuid = z.uuid();
const Version = z.int().positive();
const Minor = z.bigint();
const Currency = z.string().regex(/^[A-Z]{3}$/);
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Instant = z.iso.datetime({ offset: true });
const SettlementLine = z.object({
  lineId: Uuid, code: z.string().regex(/^[a-z0-9_]{1,64}$/), label: z.string().min(1).max(160),
  amountMinor: Minor.nullable(), currency: Currency, evaluationState: z.enum(["evaluated", "unevaluated", "disputed"]),
  sourceIds: z.array(Uuid).max(100),
}).strict();
const Gap = z.object({ code: z.string().regex(/^[a-z0-9_]{1,64}$/), sourceId: Uuid.nullable(), treatment: z.enum(["exclude", "zero", "block"]), blocksFinality: z.boolean() }).strict();
const Variance = z.object({ code: z.string().regex(/^[a-z0-9_]{1,64}$/), expectedMinor: Minor.nullable(), observedMinor: Minor.nullable(), deltaMinor: Minor.nullable(), currency: Currency }).strict();
const LineDiff = z.object({ lineId: Uuid, beforeMinor: Minor.nullable(), afterMinor: Minor.nullable(), deltaMinor: Minor.nullable(), currency: Currency }).strict();
const SettlementCore = z.object({
  settlementId: Uuid, priorVersion: Version.nullable(), version: Version, versionHash: Digest,
  state: z.enum(["proposed", "reconciling"]), lines: z.array(SettlementLine).max(5000),
  payableFloorMinor: Minor, payableCeilingMinor: Minor, sourceWatermark: Digest,
}).strict();
// 31.04
export const OpenSettlementSuccess = SettlementCore.extend({
  unevaluatedTerms: z.array(z.object({ expressionTermId: Uuid, reasonCode: z.string().regex(/^[a-z0-9_]{1,64}$/) }).strict()).max(500),
}).strict();
// 31.05
export const BoxOfficeReconcileSuccess = SettlementCore.extend({
  gaps: z.array(Gap).max(100), variances: z.array(Variance).max(1000), reconciliationKind: z.literal("box_office"),
}).strict();
// 31.06
export const SettlementInputV1 = z.object({
  inputId: Uuid, provenanceGrade: z.enum(["verified", "attested", "estimated", "unknown"]),
  deductibilityState: z.enum(["inside_cap", "outside_cap", "unknown", "not_deductible"]),
  affectedLineIds: z.array(Uuid).max(500), version: Version,
}).strict();
// 31.07
export const MerchReconcileSuccess = SettlementCore.extend({
  sellThrough: z.string().regex(/^(?:0(?:\.\d{1,6})?|1(?:\.0{1,6})?)$/),
  merchBasisMinor: Minor, venueCutMinor: Minor, unresolvedLines: z.array(Uuid).max(500), variance: Variance,
}).strict();
// 31.08
export const RecomputeSettlementSuccess = SettlementCore.extend({
  lineDiffs: z.array(LineDiff).max(5000), totalDiff: z.object({ beforeMinor: Minor, afterMinor: Minor, deltaMinor: Minor, currency: Currency }).strict(),
  unresolvedCount: z.int().min(0).max(5000),
}).strict();
// 31.09
export const LineDisputeV1 = z.object({
  disputeId: Uuid, state: z.enum(["open", "answered", "resolved", "escalated", "withdrawn"]), undisputedFloorMinor: Minor,
  affectedLineIds: z.array(Uuid).min(1).max(500), version: Version,
}).strict();
~~~

### Deterministic validation

- Open requires a confirmed/performed Shard30 deal and accepted expression. Unsupported/unmodellable terms remain named unevaluated lines and suppress finality; they are never coerced to zero.
- Counts retain sold, paid, all-admissions, tiers, fees and comps separately. Gaps have source, magnitude, price/exposure and attribution; platform does not choose whose count is true.
- Expense category, payer, cap treatment and receipt/assertion are required. An unreceipted item follows the accepted deal deductibility rule and remains visibly asserted.
- Merch sell-through is countIn minus countOut. Bundles require a declared allocation/basis; ambiguity creates an unresolved line rather than a guessed split.
- Recompute appends a new version over exact source watermark. Signed versions are immutable.
- Disputes target causal inputs where a line is derived. Exposure is bounded by affected line range; undisputed floor excludes only quantified contested delta. Escalation to Shard06 is explicit.

## Database Schema

| Model | Typed fields, constraints, keys and indexes | RLS/grants |
|---|---|---|
| SettlementSheet | id uuid PK; deal_id/revision; expression_id/version; show_id; run_id nullable; currency char(3); state proposed/signed/final/restated; current_version bigint; current_hash bytea; payable_floor_minor/payable_ceiling_minor bigint; source_watermark jsonb; created_at | unique deal,show,run expression where open; FK source refs by typed seam; indexes show,state and deal. Settlement participants see authorized side projection; worker roles scoped |
| SettlementInput | id uuid PK; settlement_id; settlement_version; line_id nullable; source_class enum; source_event_id; value_json; currency nullable; provenance_grade enum; evidence_refs; device_at nullable; server_at; supersedes_id nullable; created_by | unique producer/source_event_id and settlement,input digest; FK settlement/line/supersedes; indexes settlement,source class,server time; append-only. Only source-authorized side inserts |
| SettlementLine | id uuid PK; settlement_id; version; line_key; formula_id/version; input_ids uuid array; party_or_pool_id; amount_minor nullable; currency; evaluability evaluated/unevaluated/unresolved; cap_treatment; deductibility; dispute_state; derivation_json | unique settlement,version,line key; indexes settlement,version and dispute state; append-only version rows; participant reads only permitted party-sensitive details |
| LineDispute | id uuid PK; settlement_id; version_hash; line_id; causal_input_ids; opened_by; basis_code; exposure_minor; currency; evidence_refs; state open/answered/resolved/escalated/withdrawn; case_ref nullable; outcome nullable; version; created_at | one open opened_by/line/causal digest partial; FK sheet/line/inputs; indexes state,created_at; affected participant and scoped settlement parties only |

Version payloads are immutable and content-addressed. A recomputation transaction inserts new line rows, updates sheet current pointer, calculates floor/ceiling and appends settlement.sheet.versioned/outbox. No UPDATE/DELETE is granted on input/line version rows.

All tables enable RLS and deny PUBLIC/anon. Named security-invoker RPCs enforce deal/show/side and line visibility. Receipt/evidence bodies remain in BE00 Storage through opaque refs. Retention preserves signed/final facts and legal-hold evidence; invalid source access removes future projection, not immutable authorized snapshot.

### D4 SQL Type, Nullability, Relationship, and Index Closure

Every field below is normative and `NOT NULL` unless marked `NULL`; UUIDs are non-nil, enums are closed `text CHECK` domains, and local FKs use `ON DELETE RESTRICT`.

| Table | Exact SQL fields | Relationships and query-pattern indexes |
|---|---|---|
| `settlement_sheets` (SettlementSheet) | `id uuid PRIMARY KEY`; `deal_id uuid`; `deal_revision bigint CHECK (deal_revision>0)`; `expression_id uuid`; `expression_version bigint CHECK (expression_version>0)`; `show_id uuid`; `run_id uuid NULL`; `currency char(3) CHECK (currency ~ '^[A-Z]{3}$')`; `state text CHECK (state IN ('proposed','reconciling','signed_one_side','signed_both','final','under_protest','restated','superseded'))`; `current_version bigint CHECK (current_version>0)`; `current_hash bytea CHECK (octet_length(current_hash)=32)`; `payable_floor_minor bigint`; `payable_ceiling_minor bigint CHECK (payable_ceiling_minor>=payable_floor_minor)`; `source_watermark jsonb CHECK (jsonb_typeof(source_watermark)='object')`; `created_at timestamptz` | Deal/expression/show/run are revision-pinned Shard30/31 refs. Partial `UNIQUE(deal_id,show_id,COALESCE(run_id,nil_uuid()),expression_id) WHERE state IN ('proposed','reconciling','signed_one_side','signed_both')`; `INDEX(show_id,state,current_version DESC)`; `INDEX(deal_id,created_at DESC)`. |
| `settlement_inputs` (SettlementInput) | `id uuid PRIMARY KEY`; `settlement_id uuid`; `settlement_version bigint CHECK (settlement_version>0)`; `line_id uuid NULL`; `source_class text CHECK (source_class IN ('ticket','scan','cash','asserted','contract','adjustment'))`; `source_event_id uuid`; `value_json jsonb CHECK (jsonb_typeof(value_json)='object')`; `currency char(3) NULL`; `provenance_grade text CHECK (provenance_grade IN ('verified','attested','estimated','unknown'))`; `evidence_refs text[] DEFAULT '{}'`; `device_at timestamptz NULL`; `server_at timestamptz`; `supersedes_id uuid NULL`; `created_by uuid` | FK `settlement_id -> settlement_sheets.id`; self-FK `supersedes_id -> settlement_inputs.id`; line is a local logical relationship verified in the transaction. `UNIQUE(source_class,source_event_id)`; stored digest `UNIQUE(settlement_id,settlement_version,input_digest)`; `INDEX(settlement_id,source_class,server_at DESC)`. |
| `settlement_lines` (SettlementLine) | `id uuid PRIMARY KEY`; `settlement_id uuid`; `version bigint CHECK (version>0)`; `line_key text CHECK (length(line_key) BETWEEN 1 AND 120)`; `formula_id uuid`; `formula_version bigint CHECK (formula_version>0)`; `input_ids uuid[] CHECK (cardinality(input_ids)>0)`; `party_or_pool_id uuid`; `amount_minor bigint NULL`; `currency char(3)`; `evaluability text CHECK (evaluability IN ('evaluated','unevaluated','unresolved'))`; `cap_treatment text`; `deductibility text`; `dispute_state text CHECK (dispute_state IN ('none','open','answered','resolved','escalated','withdrawn'))`; `derivation_json jsonb CHECK (jsonb_typeof(derivation_json)='object')` | FK `settlement_id -> settlement_sheets.id`; trigger verifies each `input_ids` member belongs to the quoted settlement/version; formula and party/pool are owner-seam refs. `UNIQUE(settlement_id,version,line_key)`; `INDEX(settlement_id,version,line_key)`; `INDEX(settlement_id,dispute_state)`. |
| `line_disputes` (LineDispute) | `id uuid PRIMARY KEY`; `settlement_id uuid`; `version_hash bytea CHECK (octet_length(version_hash)=32)`; `line_id uuid`; `causal_input_ids uuid[] CHECK (cardinality(causal_input_ids)>0)`; `opened_by uuid`; `basis_code text CHECK (length(basis_code) BETWEEN 1 AND 80)`; `exposure_minor bigint CHECK (exposure_minor>=0)`; `currency char(3)`; `evidence_refs text[] DEFAULT '{}'`; `state text CHECK (state IN ('open','answered','resolved','escalated','withdrawn'))`; `case_ref uuid NULL`; `outcome jsonb NULL CHECK (outcome IS NULL OR jsonb_typeof(outcome)='object')`; `version bigint CHECK (version>0)`; `created_at timestamptz` | FK `settlement_id -> settlement_sheets.id`, `line_id -> settlement_lines.id`; causal inputs are validated against `settlement_inputs`; case is a dispute-seam ref. Partial unique on opener/line/causal digest while state is `open` or `answered`; `INDEX(settlement_id,state,created_at DESC)`; `INDEX(opened_by,state)`. |

All four tables FORCE RLS. Settlement participants receive field-narrowed SELECT; source-authorized writers and recomputation/dispute RPCs receive only required INSERT/EXECUTE; version rows are append-only. PUBLIC/anon/authenticated have no base grants. Migration tests assert every constraint, FK/seam validator, index plan, RLS branch, and grant denial.

## State, Transactions and Failure Recovery

- Settlement sheet: proposed_vN → reconciling_vN → proposed_vN+1; signing/finality continues in 31c as `signed_one_side → signed_both → final`. Any recompute after signature creates a later proposed/restatement candidate without changing the signed hash.
- Dispute: `open → answered → resolved|escalated|withdrawn`; timeout never escalates automatically. Open/answered/escalated disputes reduce payable ceiling to floor but do not hold money because B3 is disabled.
- Each append locks sheet, validates current hash, inserts input, recomputes affected dependency graph and commits new sheet version plus events atomically.
- Source callback after client timeout replays by sourceEventId/digest. Same ID/different digest quarantines and returns 409.
- Evaluator failure leaves prior current version intact; no partial input/version pointer. Poison source events retry 1s/5s/30s/2m/10m, cap 15m and quarantine after eight.

## Middleware, Authorization and Observability

Order: request ID → CORS → auth/service binding → CSRF → strict sizes/Zod → actor/show/source rate → settlement/participant/side RLS → idempotency/If-Match → expression/provenance policy → transaction → response validation → redacted audit.

Logs contain operation ID, settlement/version/hash prefix, actor/side class, source class, safe error code, unresolved count and duration. They exclude raw deal expressions, line amounts, receipt images, fan rows, evidence text and other-side private audit trail. Metrics cover evaluator failures, source digest conflicts, provenance grades, unresolved lines, floor/ceiling spread, CAS conflicts and dispute exposure.

## Events and Integrations

| Event/seam | Contract | Delivery/recovery |
|---|---|---|
| settlement.sheet.versioned | eventId/type/schemaVersion, sheet/version, deal/expression, totals, unresolved count, version hash, occurredAt, producer, traceId | at-least-once; sheet-version dedupe; stale no-op, equal-version digest conflict quarantine |
| settlement.input.appended | sheet/line/input, source class, provenance grade, device/server times, source event | input ID dedupe; consumer sees typed value/provenance only |
| settlement.line.disputed | line/input IDs, exposure, state, case ref nullable, version | dispute-version dedupe; Shard06 consumes only explicit escalation |
| Shard30 expression service | deal/expression/version → deterministic grammar | 3s, 2 retries 100ms/500ms, circuit 5 failures/30s for 30s; leave term unevaluated or 503 on open |
| ticket/box-office sources | source revision/aggregate → counts and provenance | 5s, 3 retries 1s/5s/30s, circuit per producer 5m; gaps remain visible |
| receipt storage | upload receipt → verified digest/metadata | 3s, 2 retries 250ms/1s, circuit 5 failures/min 2m; input assertion policy applies |

## Error Handling

| ID | Status and ApiError codes |
|---|---|
| 31.04 | 400 EXPRESSION_MISSING/CURRENCY_INVALID; 403 DEAL_AUTHORITY_REQUIRED; 409 SETTLEMENT_EXISTS/IDEMPOTENCY_CONFLICT; 422 DEAL_NOT_SETTLEABLE/TERM_UNEVALUATED; 503 EXPRESSION_UNAVAILABLE |
| 31.05 | 400 COUNT_SCHEMA_INVALID/GAP_TREATMENT_INVALID; 403 SOURCE_FORBIDDEN; 409 SOURCE_EVENT_CONFLICT; 412 REVISION_MISMATCH; 422 PROVENANCE_REQUIRED |
| 31.06 | 400 EXPENSE_INVALID/CATEGORY_UNKNOWN; 403 PARTICIPANT_REQUIRED; 409 CAPTURE_CONFLICT; 412 REVISION_MISMATCH; 422 DEDUCTIBILITY_UNRESOLVED |
| 31.07 | 400 MERCH_INPUT_INVALID/BASIS_UNDEFINED; 403 MERCH_SCOPE_REQUIRED; 409 SOURCE_EVENT_CONFLICT; 412 REVISION_MISMATCH; 422 BUNDLE_ALLOCATION_UNRESOLVED |
| 31.08 | 400 CAUSE_UNSUPPORTED; 403 PARTICIPANT_REQUIRED; 409 SOURCE_WATERMARK_CONFLICT; 412 REVISION_MISMATCH; 503 EVALUATOR_UNAVAILABLE |
| 31.09 | 400 EXPOSURE_INVALID/EVIDENCE_INVALID; 403 LINE_NOT_VISIBLE; 409 ALREADY_RESOLVED; 412 REVISION_MISMATCH; 422 LINE_NOT_CONTESTABLE |

Unknown errors become 500 INTERNAL_ERROR, dependency deadlines 503 DEPENDENCY_TIMEOUT and rate admission 429 RATE_LIMITED with Retry-After. Existence is concealed with 404 when the actor cannot see the settlement.

## Verification and Test Strategy

| ID | Deterministic tests |
|---|---|
| 31.04 | accepted grammar evaluates; missing term stays named and blocks finality; duplicate open and cross-party denial |
| 31.05 | sold/paid/all/comps/fees kept distinct; source replay/conflict; gap exposure and no adjudication |
| 31.06 | receipt and permitted assertion paths; cap/deductibility rule; offline capture replay |
| 31.07 | count-in/out sell-through, rate bands and venue cut; ambiguous bundle unresolved |
| 31.08 | exact affected graph/new immutable version/variance; signed prior unchanged; concurrent source CAS |
| 31.09 | causal-input redirect, quantified exposure and undisputed floor; duplicate/local/escalated flows |

RLS/grant tests cover each side, affected/unaffected participant, support, evaluator and source workers. Transaction tests prove atomic input/version/outbox, no partial recompute, immutable signed history and stable lock ordering.

## Deepening Passes

- Micro: source classes, provenance, count categories, caps, deductibility, merch basis, evaluability, exposure and floor/ceiling are exact.
- Macro: canonical deal/ticket/tour facts remain with their owners; this companion only evaluates immutable snapshots and local disputes.
- Devil's advocate: no implementation may coerce unknown to zero, choose a source winner, rewrite a signed version, contest an opaque derived total without causal inputs, or expose other-side evidence.
- Two-implementer and ambiguity checks: PASS. Routes, schemas, errors, SQL, RLS/grants, state, event delivery and recovery are deterministic. No open decision.

## Per-Operation Observability and Synthetic Registry

Every authoritative operation has an independent telemetry/test row below. Logs are BE00-redacted and always include `requestId`, `traceId`, the exact `operationId`, tenant/actor role, opaque aggregate ID and version, idempotency replay class, outcome/code, latency, dependency attempt, and outbox/lease age when applicable. They never include request/response bodies, PII, secrets, evidence, money details, tokens, or provider payloads. Metrics use bounded labels only; alerts apply the route deadline/SLO and the recovery contract already specified.

| Operation | Required metrics and alert | Required keyed synthetic/acceptance test |
|---|---|---|
| 31.04 | `be_http_requests_total{operation_id="31.04",outcome,code}`, `be_http_latency_seconds{operation_id="31.04"}`, and `be_operation_recovery_total{operation_id="31.04",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.05 | `be_http_requests_total{operation_id="31.05",outcome,code}`, `be_http_latency_seconds{operation_id="31.05"}`, and `be_operation_recovery_total{operation_id="31.05",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.06 | `be_http_requests_total{operation_id="31.06",outcome,code}`, `be_http_latency_seconds{operation_id="31.06"}`, and `be_operation_recovery_total{operation_id="31.06",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.07 | `be_http_requests_total{operation_id="31.07",outcome,code}`, `be_http_latency_seconds{operation_id="31.07"}`, and `be_operation_recovery_total{operation_id="31.07",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.08 | `be_http_requests_total{operation_id="31.08",outcome,code}`, `be_http_latency_seconds{operation_id="31.08"}`, and `be_operation_recovery_total{operation_id="31.08",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |
| 31.09 | `be_http_requests_total{operation_id="31.09",outcome,code}`, `be_http_latency_seconds{operation_id="31.09"}`, and `be_operation_recovery_total{operation_id="31.09",recovery_class}`; alert on route-SLO breach, five-minute 5xx error-budget burn, or stuck outbox/lease/dependency recovery | strict request and success contract; every role/ownership 403-vs-404 branch; exact CORS and BE00 ApiError envelope; rate admission; idempotent replay or declared safe-read behavior; concurrent conflict plus timeout/retry/circuit/rollback recovery |

Telemetry contract tests reject unbounded/dynamic labels and any forbidden field; synthetic tests assert the row's `operationId` appears in logs, spans, metrics, audit records, and failure alerts.

## Ambiguity Gate

**PASS.** Source inventory, authoritative operations, strict contracts, typed persistence, authorization, failures, idempotency, rate limits, observability, state/concurrency/recovery, external seams, and verification resolve every micro- and macro-level implementation choice. The two-implementer simulation yields the same behavior and the adversarial review leaves no surviving ambiguity.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Initial Shard 31b production backend specification |

- 2026-08-28: Remediation pre-audit added an exact route-mapped typed success contract for every operation and reverified source/structure gates.

## Dependency References

- [Backend infrastructure](00-infrastructure.md)
- [IA Shard 31](../ia/31-live-settlement-intelligence.md)
- Shard 30 booking contracts, Shards 35/36 ticket and box-office sources, Shard 34 tour expenses, and Shard 06 escalated disputes.
