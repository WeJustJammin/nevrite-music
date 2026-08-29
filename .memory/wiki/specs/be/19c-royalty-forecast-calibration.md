# Royalty Forecast & Calibration — Backend Specification

**Status:** Complete
**IA source:** [Shard 19 — Performance reporting, money-in-flight and forecasting](../ia/19-royalty-reporting-forecasting.md)
**Deep-dive source:** [Deep Dive 19 — Royalty reporting and forecasting](../ia/deep-dives/19-royalty-reporting-forecasting.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns forecast eligibility, conservative royalty forecast versions and forecast-versus-actual calibration. It contains RRF-10 through RRF-12. It consumes labelled in-flight expectations, immutable Shard 18 accounting versions and Shard 10 rights/catalogue changes; it never presents an estimate as actual, feeds a payable balance or payout, makes a credit decision, rewrites a historical forecast or leaves a stale confident chart visible.

## Classification

- **Type:** policy-gated statistical projection boundary with immutable forecast versions, explicit uncertainty and calibration lineage.
- **Boundary:** forecast_eligibility, royalty_forecast_version and forecast_calibration ownership; registration, rights, accounting, calendar and catalogue facts remain producer-owned seams.
- **Expected operations:** three HTTP operations, one for each assigned IA interaction (RRF-10, RRF-11 and RRF-12).
- **Approval:** blanket approval from /write-be-spec all shards; delegated decision authority applies.
- **Decision lock:** deterministic in-flight facts are separated before eligibility; minimum-history/coverage, active registration and stable-rights policy are versioned; thin/lumpy data yields explicit silence; actual calibration never rewrites history; rights/catalogue/registration changes mark stale before any recompute.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Acceptance Criteria, lines 39–41 | Eligibility gates, insufficient-data silence, immutable calibration and stale-basis invalidation. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Interactions, lines 56–58 | Normative preconditions, behavior, completion and recovery for RRF-10 through RRF-12. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Contracts, lines 70–77 | GenerateRoyaltyForecast, CalibrateForecast, states and named errors. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Data Models, lines 88–92 | forecast_eligibility, royalty_forecast_version, forecast_calibration and Shard 18 canonical-ownership rule. |
| [IA Shard 19](../ia/19-royalty-reporting-forecasting.md) | ## Event Schemas, lines 143–146 | royalty.forecast.changed.v1 and royalty.forecast-calibrated.v1 payload safety. |
| [Deep Dive 19](../ia/deep-dives/19-royalty-reporting-forecasting.md) | ## Forecast Algorithm, lines 37–45 | In-flight separation, policy gates, one-off handling, range/basis output, stale invalidation and no-payable rule. |
| [Deep Dive 19](../ia/deep-dives/19-royalty-reporting-forecasting.md) | ## Abuse and Recovery Verification, lines 47–57 | Thin data, invented amount, guaranteed forecast, hidden error and historical rewrite prevention. |
| [Deep Dive 19](../ia/deep-dives/19-royalty-reporting-forecasting.md) | ## Cross-Shard Contracts and ## Implementation Envelope, lines 59–74 | Shards 00, 09, 10 and 18 seams, PostgreSQL/RLS, Zod/Hono, queues and outbox. |
| [BE00](00-infrastructure.md) | Request/Response Contracts, lines 112–138; Middleware & Policies, lines 253–298; Deterministic Protocol Rules, lines 330–348; Error Handling, lines 418–452 | Actor context, request IDs, idempotency, audit/outbox, CORS, error envelope and fail-closed conventions inherited by every operation. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| RRF-10 User requests forecast | RRF-FC-API-01 | Verify policy-version eligibility, active registration, stable rights, history/coverage and separated in-flight; return range or explicit insufficient-data silence. |
| RRF-11 Model recalibrates | RRF-FC-API-02 | Compare immutable forecast to complete Shard 18 actual horizon, publish error/coverage and withhold calibration on partial actuals. |
| RRF-12 Catalogue/rights change | RRF-FC-API-03 | Mark affected forecast stale/withdrawn before recompute; emit no replacement when eligibility fails and never leave stale confident output. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| RRF-10 | Generate forecast | RRF-FC-API-01 | Eligibility record plus active range or explicit insufficient-data state; in-flight separated and non-payable. |
| RRF-11 | Calibrate forecast | RRF-FC-API-02 | Immutable forecast/actual version lineage, error and coverage or withheld state. |
| RRF-12 | Invalidate forecast basis | RRF-FC-API-03 | Stale/withdrawn mark committed before recompute decision, with policy and change provenance. |

## API Endpoints

### Authoritative Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| RRF-FC-API-01 | POST | /api/v1/royalties/forecast-requests | RRF-10 | Party/catalogue owner or mandate-scoped administrator requests only that party's forecast. | 200 GenerateRoyaltyForecastSuccess |
| RRF-FC-API-02 | POST | /api/v1/royalties/forecast-calibrations | RRF-11 | Forecast owner, authorized model operator or schedule worker reads complete actual horizon. | 200 CalibrateForecastSuccess |
| RRF-FC-API-03 | POST | /api/v1/royalties/forecast-basis-invalidations | RRF-12 | Rights/catalogue/registration change worker or mandate-scoped owner invalidates affected basis. | 202 InvalidateForecastBasisSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms/150 ms before command | Open after 5 failures/30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 18 registration/accounting resolver | {partyId, catalogueId, horizon, actualVersionIds} → {activeRegistrations, accountingVersions, coverage, freshnessAt} | 900 ms | 2 retries at 150 ms/450 ms with same read key | Open after 4 failures/60 s; forecast stays insufficient/stale; half-open after 30 s. |
| Shard 10 rights/catalogue basis resolver | {partyId, catalogueId, asOf, changeRef} → {rightsBasisVersion, stable, changedObjects[], eligibilityImpact} | 700 ms | 2 retries at 100 ms/300 ms | Open after 4 failures/30 s; invalidation fails closed; half-open after 20 s. |
| 19b money-in-flight projection | {partyId, catalogueId, horizon} → {expectationIds, deterministicFlags, coverage, freshnessAt} | 700 ms | 2 retries at 100 ms/300 ms; read-only replay | Open after 4 failures/30 s; forecast remains pending/insufficient; half-open after 20 s. |
| Forecast model worker | {eligibilityId, features, policyVersion, modelVersion, horizon, inFlightIds} → {lower, upper, currency, confidence, basis, coverage, generatedAt} | 2,500 ms | 2 retries at 200 ms/600 ms with same idempotency key | Open after 4 failures/60 s; no forecast version is published; half-open after 30 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with VALIDATION_FAILED; identifiers are UUIDs, dates are ISO calendar dates, timestamps are RFC 3339 with offset, ratios are bounded decimal strings, and every error uses the BE00/global envelope ApiError { code, message, requestId, details }.

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateOnly = z.iso.date();
const DateTime = z.iso.datetime({ offset: true });
const Key = z.string().min(16).max(160).regex(/^[A-Za-z0-9._:-]+$/);
const ExactAmount = z.string().regex(/^-?(0|[1-9]\d*)(\.\d{1,18})?$/);
const Ratio = z.string().regex(/^(0|1|0?\.\d{1,6})$/);
const Context = z.object({ actingContextId: Uuid }).strict();
const ApiErrorSchema = z.object({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: Uuid,
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
}).strict();

export const GenerateRoyaltyForecastRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  partyId: Uuid,
  catalogueId: Uuid,
  eligibilityId: Uuid,
  policyVersion: Key,
  modelVersion: Key,
  horizonStart: DateOnly,
  horizonEnd: DateOnly,
  minimumHistoryMonths: z.int().positive().max(240),
  minimumCoverage: Ratio,
  inFlightExpectationIds: z.array(Uuid),
  expectedVersion: z.int().positive().nullable()
}).strict();
export const GenerateRoyaltyForecastSuccess = z.object({
  forecastVersionId: Uuid.nullable(),
  eligibilityId: Uuid,
  state: z.enum(["insufficient_data", "active", "stale", "withdrawn", "calibrated"]),
  lower: ExactAmount.nullable(),
  upper: ExactAmount.nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  confidence: Ratio.nullable(),
  basis: z.array(Key),
  coverage: Ratio,
  deterministicInFlightSeparated: z.literal(true),
  version: z.int().positive()
}).strict();

export const CalibrateForecastRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  forecastVersionId: Uuid,
  actualAccountingVersionIds: z.array(Uuid).min(1).max(10000),
  horizonEnd: DateOnly,
  modelVersion: Key,
  expectedVersion: z.int().positive()
}).strict();
export const CalibrateForecastSuccess = z.object({
  calibrationId: Uuid.nullable(),
  forecastVersionId: Uuid,
  state: z.enum(["calibrated", "stale", "withdrawn"]),
  errorClass: z.string().trim().max(120).nullable(),
  coverage: Ratio,
  actualsComplete: z.boolean(),
  version: z.int().positive()
}).strict();

export const InvalidateForecastBasisRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  forecastVersionId: Uuid,
  changeRef: Key,
  changeType: z.enum(["rights", "catalogue", "registration"]),
  sourceVersion: z.int().positive(),
  recomputeEligibilityVersion: Key,
  expectedVersion: z.int().positive()
}).strict();
export const InvalidateForecastBasisSuccess = z.object({
  forecastVersionId: Uuid,
  state: z.enum(["stale", "withdrawn"]),
  recomputeEligible: z.boolean(),
  replacementForecastVersionId: Uuid.nullable(),
  version: z.int().positive()
}).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| RRF-FC-API-01 | GenerateRoyaltyForecastRequest | GenerateRoyaltyForecastSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RRF-FC-API-02 | CalibrateForecastRequest | CalibrateForecastSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RRF-FC-API-03 | InvalidateForecastBasisRequest | InvalidateForecastBasisSuccess / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| RRF-FC-API-01 | Require policy-version minimum history/coverage, active Shard 18 registration, stable rights basis and prior separation of deterministic in-flight expectations. Thin/lumpy data or a failed check returns INSUFFICIENT_HISTORY/REGISTRATION_REQUIRED with explicit silence; one-off events are excluded or robustly isolated and disclosed. Range values are estimates only and cannot enter payable/payout/credit paths. |
| RRF-FC-API-02 | Require immutable forecast whose horizon elapsed and complete actual Shard 18 accounting versions cover that horizon. Partial actuals withhold calibration; model replacement appends a new calibration and never rewrites historical forecast. |
| RRF-FC-API-03 | Require named forecast basis, rights/catalogue/registration change ref and current version. Mark stale or withdrawn before eligibility/recompute; when eligibility fails, replacementForecastVersionId remains null and no stale chart is served. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| RRF-FC-API-01 | INSUFFICIENT_HISTORY, REGISTRATION_REQUIRED, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign catalogue/party; 404 hides unknown catalogue/eligibility. | Required 24 hours; hash includes party/catalogue/policy/model/horizon/history/coverage/in-flight IDs. Replay returns forecast/silence; mismatch returns IDEMPOTENCY_MISMATCH. | 30 forecast requests/hour/catalogue; 5 concurrent/model worker. | Log operationId, requestId, party/catalogue hashes, policy/model versions, eligibility state, coverage class and latency; no features, amounts or names. |
| RRF-FC-API-02 | INSUFFICIENT_HISTORY, FORECAST_BASIS_STALE, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign forecast/operator scope; 404 hides unknown forecast/actual versions. | Required 30 days; hash includes forecast/actual versions/horizon/model. Replay returns calibration/withheld state; mismatch returns IDEMPOTENCY_MISMATCH. | 60 calibrations/hour/model; 10 concurrent/horizon. | Log operationId, requestId, forecast/actual hashes, coverage/error classes, model version and latency; no feature vectors or amounts. |
| RRF-FC-API-03 | FORECAST_BASIS_STALE, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign basis/mandate; 404 hides unknown forecast/change ref. | Required 30 days; hash includes forecast/change/type/source/recompute policy. Replay returns stale/withdrawn state; mismatch returns IDEMPOTENCY_MISMATCH. | 120 invalidations/hour/party; 20 concurrent/catalogue. | Log operationId, requestId, forecast/change hashes, change type, stale/withdrawn state, eligibility class and queue latency; no catalogue names or forecast values. |

## Database Schema

### PostgreSQL Model Registry

All tables are in schema royalty, use UUID primary keys, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL and version bigint NOT NULL CHECK (version > 0). Forecast ranges are private projections, never accounting balances; historical versions are append-only.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| forecast_eligibility | id uuid PK NOT NULL; party_id uuid NOT NULL FK identity.party; catalogue_id uuid NOT NULL FK rights.catalogue; policy_version text NOT NULL; minimum_history_months integer NOT NULL CHECK (minimum_history_months > 0); minimum_coverage numeric(9,6) NOT NULL CHECK (minimum_coverage >= 0 AND minimum_coverage <= 1); active_registration boolean NOT NULL; stable_rights_basis boolean NOT NULL; in_flight_separated boolean NOT NULL CHECK (in_flight_separated = true); one_off_treatment text NOT NULL CHECK (one_off_treatment IN ('excluded','robust_isolation')); failure_code text NULL; state text NOT NULL CHECK (state IN ('eligible','insufficient_data','stale')); evaluated_at timestamptz NOT NULL; version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (party_id, catalogue_id, policy_version, version); (party_id, catalogue_id, state, evaluated_at DESC); (policy_version, state). | Party reads own eligibility; mandate admin reads governed catalogue; forecast worker inserts through policy RPC; no client policy update; anon no grant. |
| royalty_forecast_version | id uuid PK NOT NULL; party_id uuid NOT NULL FK identity.party; catalogue_id uuid NOT NULL FK rights.catalogue; eligibility_id uuid NOT NULL FK royalty.forecast_eligibility; horizon_start date NOT NULL; horizon_end date NOT NULL CHECK (horizon_end >= horizon_start); lower_amount numeric(38,18) NULL; upper_amount numeric(38,18) NULL CHECK (upper_amount IS NULL OR lower_amount IS NULL OR upper_amount >= lower_amount); currency char(3) NULL CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'); confidence numeric(9,6) NULL CHECK (confidence IS NULL OR confidence >= 0 AND confidence <= 1); basis jsonb NOT NULL CHECK (jsonb_typeof(basis) = 'array'); coverage numeric(9,6) NOT NULL CHECK (coverage >= 0 AND coverage <= 1); model_version text NOT NULL; policy_version text NOT NULL; in_flight_expectation_ids uuid[] NOT NULL; one_off_treatment text NOT NULL CHECK (one_off_treatment IN ('excluded','robust_isolation')); state text NOT NULL CHECK (state IN ('insufficient_data','active','stale','withdrawn','calibrated')); generated_at timestamptz NOT NULL; supersedes_id uuid NULL FK royalty.royalty_forecast_version; version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (party_id, catalogue_id, horizon_start, horizon_end, model_version, version); (party_id, catalogue_id, state, horizon_end DESC); (eligibility_id); (supersedes_id). | Party reads own forecast; mandate admin reads governed catalogue; model worker inserts immutable version; no payable/payout/credit consumer grant; anon no grant. |
| forecast_calibration | id uuid PK NOT NULL; forecast_version_id uuid NOT NULL FK royalty.royalty_forecast_version; party_id uuid NOT NULL FK identity.party; actual_accounting_version_ids uuid[] NOT NULL; horizon_end date NOT NULL; model_version text NOT NULL; error_metrics jsonb NULL CHECK (error_metrics IS NULL OR jsonb_typeof(error_metrics) = 'object'); coverage numeric(9,6) NOT NULL CHECK (coverage >= 0 AND coverage <= 1); actuals_complete boolean NOT NULL; state text NOT NULL CHECK (state IN ('calibrated','stale','withdrawn')); error_class text NULL; version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (forecast_version_id, model_version, version); (party_id, horizon_end DESC); (forecast_version_id, state); (actuals_complete, created_at). | Party reads own calibration; model operator/worker writes complete actual comparison; reporting receives error/coverage projection; no direct forecast rewrite; anon no grant. |

### State, Concurrency and Transaction Rules

- forecast_eligibility evaluates versioned minimum history/coverage, active registration, stable rights basis and in-flight separation. Any failed condition yields insufficient_data with a named failure code; no range is emitted.
- royalty_forecast_version is immutable. Active output includes lower/upper range, confidence, basis, coverage, horizon, model/policy version and generated time; all views label it estimate, never actual or guaranteed income. Deterministic in-flight expectations remain separate.
- One-off events are excluded or robustly isolated with disclosed basis. The service never smooths lumpy income silently or turns a forecast into payable, payout, credit, collateral or entitlement.
- forecast_calibration requires actual Shard 18 versions covering the elapsed horizon. Partial actuals leave actuals_complete false and withhold error publication. Model replacement appends a new calibration; old forecast/calibration rows remain unchanged.
- RRF-12 marks the affected forecast stale or withdrawn in a CAS transaction before any recompute job. If the new eligibility fails, no replacement is created. A stale forecast cannot be returned as active after invalidation.
- Every command takes expected version, unique idempotency key and transactional outbox. Concurrent request/recompute/invalidation races resolve by CAS; stale workers re-read and stop, and retries reuse the same job key.

### Grants, RLS and Retention

- RLS derives app.actor_party_id() and mandate version from BE00. Catalogue/party predicates apply to eligibility, forecast and calibration rows; schedule workers receive one policy/job scope.
- Party owners read own forecasts/calibration and eligibility; mandate admins read governed scope; Shard 19 projections may expose range/basis/coverage classes; Shard 18 and Shard 10 remain canonical and receive no mutation grant.
- Forecast and calibration versions, policy/model references, feature provenance classes and stale/withdrawn lineage follow reporting retention. Erasure revokes derived access and pseudonymizes ordinary views without deleting required audit/version evidence.
- Model features, private catalogue details and exact forecast amounts remain private. Events and logs expose coverage/error/eligibility classes only.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Party/catalogue owner | Request/read own eligibility, forecast and calibration. | Other catalogues, model internals, guaranteed income or payable use. |
| Rights administrator | Read/request forecasts in active catalogue mandate. | Changing policy/model, hiding stale state, payment/credit decision or cross-mandate data. |
| Model operator | Run scoped calibration/recompute with approved model/policy version. | Rewriting history, bypassing eligibility, exposing features or authorizing payout. |
| Schedule service principal | Evaluate one job scope and append versioned projections/events. | Interactive browsing, cross-party reads, changing Shard 18/10 facts or stale-state bypass. |
| Finance/support | Read labelled range/status diagnostics in authorized scope. | Treating range as balance, payout, credit decision or guarantee. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| RRF-FC-API-01 | requestId → strictCors(royaltyForecastOrigins) → requireAuth → resolveActingContext → rateLimit(forecastRequest) → parseZod(GenerateRoyaltyForecastRequest) → idempotency(24h) → authorizeCatalogueScope → eligibilityPolicyGuard → inFlightSeparationGuard → noPayableUseGuard → forecastTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RRF-FC-API-02 | requestId → strictCors(royaltyForecastOrigins) → requireAuth → resolveActingContext → rateLimit(forecastCalibration) → parseZod(CalibrateForecastRequest) → idempotency(30d) → authorizeForecastScope → horizonCoverageGuard → immutableVersionGuard → calibrationTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| RRF-FC-API-03 | requestId → strictCors(royaltyForecastOrigins) → requireAuth → resolveActingContext → rateLimit(forecastInvalidation) → parseZod(InvalidateForecastBasisRequest) → idempotency(30d) → authorizeBasisScope → staleBeforeRecomputeGuard → eligibilityRecheckGuard → invalidationOutboxTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |

### Security and Privacy Controls

Use private/no-store range responses, opaque party/catalogue IDs, RLS policy-version checks and separate feature-store access. CORS never permits * with credentials. Never log feature vectors, model features, catalogue names, exact forecast amounts, source lines or private rights changes. Range, confidence, basis, coverage, generated time and calibration error are always labeled. No forecast route is accepted by payout, credit or accounting commands.

## Data Flow

1. RRF-FC-API-01 resolves party/catalogue scope, separates 19b deterministic in-flight expectations, evaluates policy/versioned history/coverage/registration/rights checks and either returns explicit silence or publishes an immutable range.
2. RRF-FC-API-02 reads an elapsed immutable forecast and complete Shard 18 actual versions, writes calibration error/coverage or withholds on partial actuals.
3. RRF-FC-API-03 consumes Shard 10 rights/catalogue or Shard 18 registration changes, marks stale/withdrawn before recompute and queues a replacement only when eligibility still passes.
4. Events carry state/version/coverage/error classes; no consumer receives a payable balance or guaranteed-income signal.

## Events and Consumer Contracts

Events are transactional-outbox records with eventId, eventType, schemaVersion, occurredAt, aggregateId, aggregateVersion, correlationId and causationId. Payloads exclude model features, amounts, private catalogue details, society/member IDs and accounting lines.

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| royalty.forecast.changed.v1 | RRF-FC-API-01/03 and worker | forecastVersionId, party/catalogue hash, horizon, state, coverage class, eligibility class, modelVersion, version; dashboard and stale-basis projections consume it. |
| royalty.forecast-calibrated.v1 | RRF-FC-API-02 | forecastVersionId, calibrationId, horizon, state, errorClass, coverage class, actualsComplete, version; transparency/reporting consumers consume it. |

Consumers deduplicate by eventId and aggregate version, preserve stale/withdrawn status and never infer actual income, payment, creditworthiness or guaranteed range.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| RRF-FC-API-01 | Thin/lumpy history, missing active registration or dependency outage | Return INSUFFICIENT_HISTORY/REGISTRATION_REQUIRED/DEPENDENCY_UNAVAILABLE with explicit silence and failing check; no forecast version or payable effect. Retry with same key after dependency recovery. |
| RRF-FC-API-01 | One-off event or in-flight overlap | Exclude/robustly isolate and disclose one-off; keep deterministic in-flight separate; never silently establish a baseline. |
| RRF-FC-API-02 | Actual horizon incomplete or stale basis | Withhold calibration/return FORECAST_BASIS_STALE; keep historical forecast immutable and expose coverage/freshness. |
| RRF-FC-API-03 | Rights/catalogue/registration change or recompute race | CAS marks stale/withdrawn before queueing. Recheck eligibility; no replacement if failed. Stale worker stops without reactivating prior chart. |

All errors serialize ApiError { code, message, requestId, details }; details contains check, state, freshness, coverage class and safe retry metadata without features or amounts.

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| RRF-FC-API-01 | Zod strict policy/history/coverage/horizon/range/silence schema and exact error envelope. | Party/catalogue authority, active registration, in-flight separation, no-payable use, CORS/rate and feature redaction. | Eligibility/forecast immutability, one-off basis, RLS/grants, CAS and event. | Thin data, missing registration, model timeout, duplicate replay and safe telemetry. |
| RRF-FC-API-02 | Forecast/actual version, horizon, complete coverage and calibration schema. | Forecast ownership, no historical rewrite, CORS/rate and feature privacy. | Calibration lineage, partial actual withholding, RLS/grants and event. | Stale basis, incomplete actuals, model replacement, outage and replay. |
| RRF-FC-API-03 | Change type/ref/version, stale/withdrawn and recompute decision schema. | Basis authority, stale-before-recompute, no stale chart, CORS/rate. | CAS invalidation, replacement link, outbox, RLS and event. | Rights/registration race, worker stale stop, dependency outage and redacted audit. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 strict schemas, bounded ratios, explicit silence, range ordering, in-flight separation and calibration completeness. PostgreSQL tests prove immutable forecast/calibration rows, policy/version constraints, stale-before-recompute CAS, RLS and outbox atomicity. Worker tests exercise thin history, one-off isolation, model replacement, actual horizon gaps, rights changes and no-payable firewall. Playwright covers accessible range/basis/coverage tables, clear estimate labels, insufficient-data silence, stale/withdrawn notices and calibration error disclosure. The gate fails on invented amount, thin-data chart, stale confident output, historical rewrite, feature leak or any payable/payout/credit use.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — boundary:** verified RRF-10 through RRF-12 map one-to-one to three routes; returns/cue sheets, calendars/in-flight and Shard 18 accounting remain sibling/producer boundaries.
- **Pass 2 — micro:** resolved eligibility gates, deterministic in-flight separation, one-off treatment, range/uncertainty, partial actuals, calibration lineage and stale-before-recompute behavior.
- **Pass 3 — macro:** traced policy inputs → eligibility → forecast → actual calibration and rights/registration invalidation; Shards 00/10/18 and 19b remain explicit seams.
- **Pass 4 — abuse/recovery:** covered thin/lumpy data, invented amount, guaranteed-income language, feature privacy, model replacement, stale worker, dependency outage and CAS race.
- **Pass 5 — contract:** every operation has exact Zod request/success/error, 403/404, idempotency, rate, CORS, ApiError, persistence, RLS, event and test rows.

## Ambiguity Gate

**PASS.** Forecast eligibility, uncertainty, calibration completeness and stale-basis invalidation are source-complete. Thin data yields silence, actuals remain versioned, one-offs are disclosed, and no forecast can become payable or guaranteed. No unresolved ambiguity remains inside this split.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored conservative forecast eligibility, immutable forecast versions, calibration and stale-basis invalidation contracts. | /write-be-spec |

## Dependency References

- **Depends on:** [BE00](00-infrastructure.md) for authority, CORS, ApiError, idempotency, audit and outbox; 19b for labelled in-flight expectations; Shard 18 for registrations and actual accounting versions; Shard 10 for rights/catalogue basis; Shard 01 for mandates.
- **Consumed by:** dashboards, reporting and career planning consume labelled ranges/error/coverage only; no consumer may treat a forecast as actual income, payable balance, payout, credit decision or guarantee.
- **Boundary:** forecast_eligibility, royalty_forecast_version and forecast_calibration are derived projections. Rights, registration and accounting producers remain canonical, and stale/withdrawn states are never hidden.
