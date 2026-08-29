# Royalty Payout & B3 Gate — Backend Specification

**Status:** Complete
**IA source:** [Shard 18 — Royalty registration, ingestion, calculation and payout](../ia/18-royalty-accounting.md)
**Deep-dive source:** [Deep Dive 18 — Royalty accounting](../ia/deep-dives/18-royalty-accounting.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns the explicit payout-request record and future transfer projection at the B3 capability boundary. It contains ROY-16 only. It reports a calculated balance and a disabled provider gate; it does not hold funds, create escrow, issue wallet deposits, call a payout provider, alter earnings, or convert a balance into platform revenue.

## Classification

- **Type:** capability-gated financial command boundary with a deliberately disabled side-effect path.
- **Boundary:** payout_run and payout_transfer lifecycle, finance-operator request evidence, gate facts, reconciliation references and provider-effect sentinel; calculation/statement truth remains 18c and future money movement requires a separately evolved contract.
- **Expected operations:** one HTTP operation for IA interaction ROY-16.
- **Approval:** blanket approval from /write-be-spec all shards; delegated decision authority applies.
- **Decision lock:** B3 is hard-disabled. Every current request returns a typed disabled result before provider invocation. Only /evolve-feature may activate provider, legal, KYC/AML, tax, ledger, hold, refund, insolvency and reconciliation capabilities.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Interactions, line 88 | ROY-16 MFA/reason precondition, B3 gate, disabled outcome, no-provider-side-effect recovery and no custody/escrow representation. |
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Contracts — Core Types and Errors, lines 103–120 | PayoutGate members and PAYOUT_DISABLED_B3 error. |
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Contracts — Calculation, Statement and Financial Gate, lines 152–163 | ExecuteRoyaltyPayout boundary and statement-before-transfer relationship. |
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Data Models, lines 183–185 | calculated_balance, payout_run and payout_transfer separation. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## B3 Payout and Escrow Gate, lines 68–75 | Hard precondition, provider/legal gates, finality, failed-transfer policy and prohibition on platform custody/float/forfeiture. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## Implementation Envelope, lines 115–121 | PostgreSQL/RLS, typed Hono/Zod, queue/outbox, disabled capability and ambiguous external outcomes. |
| [BE00](00-infrastructure.md) | Request/Response Contracts, lines 112–138; Middleware & Policies, lines 253–298; Deterministic Protocol Rules, lines 330–348; Error Handling, lines 418–452 | Actor context, MFA evidence, request IDs, idempotency, audit/outbox, CORS and ApiError conventions inherited by the operation. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| ROY-16 Finance operator requests payout | ROY-PAY-API-01 | Require finance role, MFA, reason, calculated balance and gate facts; return PAYOUT_DISABLED_B3 before any provider effect; retain balance/statement without custody claim. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| ROY-16 | Request payout | ROY-PAY-API-01 | Immutable payout_run and disabled payout_transfer projection; providerEffect is false and no provider seam is called while B3 is disabled. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry and test row keys to the operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| ROY-PAY-API-01 | POST | /api/v1/royalties/payout-runs | ROY-16 | Finance operator with MFA and a stated reason; payee, statement and calculated balance are resolved in authorized scope. | 202 ExecuteRoyaltyPayoutSuccess with disabled_b3 and providerEffect false |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/finance-role verifier | {accessToken, actingContextId, requiredRole: finance_operator, mfaEvidence} → {actorId, roles, mandateVersion, mfaVerified, contextVersion} | 300 ms | 2 retries at 50 ms/150 ms before mutation | Open after 5 failures/30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| 18c statement/balance resolver | {payeePartyId, statementId, calculatedBalanceId, expectedVersion} → {statementVersion, balanceVersion, payableComponents, statementBeforeTransfer, payoutGate} | 700 ms | 2 retries at 100 ms/300 ms with the same read key | Open after 4 failures/30 s; request remains unsubmitted; half-open after 20 s. |
| B3 capability/configuration registry | {capability: royalty_payout, requestedVersion, gateFacts} → {enabled, counselVersion, providerVersion, kycVersion, taxVersion, reconciliationVersion} | 400 ms | 2 retries at 50 ms/150 ms; no write retry on ambiguous response | Open after 4 failures/30 s; fail closed to disabled_b3; half-open after 20 s. |
| Future provider adapter, unreachable before B3 | {payoutRunId, payeeTokenRef, amount, currency, statementVersion, idempotencyKey} → {providerTransferRef, providerState, finality, reconciliationRef} | 1,500 ms | 2 retries at 500 ms/1,500 ms only after provider idempotency acknowledgement; current path makes 0 calls | Open after 3 failures/60 s; half-open after 30 s; any ambiguous result remains provider_unready and requires reconciliation. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with VALIDATION_FAILED; timestamps are RFC 3339 with offset, identifiers are UUIDs, exact amounts are decimal strings, MFA evidence is non-secret metadata, and every error uses the BE00/global envelope ApiError { code, message, requestId, details }.

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateTime = z.iso.datetime({ offset: true });
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
const GateFacts = z.object({
  b3Version: z.string().trim().min(1).max(80),
  counselApproved: z.boolean(),
  providerReady: z.boolean(),
  kycVersion: Key.nullable(),
  taxVersion: Key.nullable(),
  reconciliationVersion: Key.nullable(),
  holdsCleared: z.boolean()
}).strict();

export const ExecuteRoyaltyPayoutRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  payeePartyId: Uuid,
  statementId: Uuid,
  calculatedBalanceId: Uuid,
  amount: ExactAmount,
  currency: Currency,
  mfaEvidence: z.object({ method: z.enum(["webauthn", "totp"]), verifiedAt: DateTime, evidenceRef: Key }).strict(),
  reason: z.string().trim().min(10).max(500),
  gateFacts: GateFacts,
  expectedVersion: z.int().positive()
}).strict();

export const ExecuteRoyaltyPayoutSuccess = z.object({
  payoutRunId: Uuid,
  transferId: Uuid.nullable(),
  state: z.enum(["disabled_b3", "provider_unready", "eligible", "held", "submitted", "paid", "failed"]),
  providerEffect: z.literal(false),
  providerTransferRef: z.null(),
  balancePreserved: z.literal(true),
  statementVersion: z.int().positive(),
  version: z.int().positive()
}).strict();

export const ApiError = ApiErrorSchema;
```

The current contract deliberately returns only disabled_b3 with providerEffect false, providerTransferRef null and balancePreserved true. Future enabled states require an additive /evolve-feature contract review; they cannot be reached by a role, threshold or configuration override in this split.

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| ROY-PAY-API-01 | ExecuteRoyaltyPayoutRequest | ExecuteRoyaltyPayoutSuccess / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| ROY-PAY-API-01 | Require a current finance role, verified MFA evidence, a non-empty reason, payee-owned statement/balance, exact positive amount within the calculated payable position, matching currency/version and statement-before-transfer. The B3 gate is evaluated before insert/provider dispatch; disabled state returns PAYOUT_DISABLED_B3 even when every other fact is valid. Client-supplied gate facts cannot enable the path. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| ROY-PAY-API-01 | PAYOUT_DISABLED_B3, NOT_AUTHORIZED, CALCULATION_HELD, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for missing finance role/MFA or payee mandate; 404 hides unknown payee, statement, balance or payout run. | Required 30 days; hash includes payee/statement/balance IDs, exact amount, currency, gate version and reason hash. Replay returns the same disabled run; mismatch returns IDEMPOTENCY_MISMATCH. | 20 payout requests/hour/finance operator; 100/day/tenant; 2 concurrent runs/payee. | Log operationId, requestId, payout-run hash, payee hash, gate state, MFA method, reason class, providerEffect and dependency latency; never log exact amount, token, bank/tax data or reason text. |

## Database Schema

### PostgreSQL Model Registry

All tables are in schema royalty, use UUID primary keys, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL and version bigint NOT NULL CHECK (version > 0). Amounts use numeric(38,18), provider references are nullable and opaque, and current provider-effect constraints make side effects impossible.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| payout_run | id uuid PK NOT NULL; payee_party_id uuid NOT NULL FK identity.party; statement_id uuid NOT NULL FK royalty.payee_statement; calculated_balance_id uuid NOT NULL FK royalty.calculated_balance; requested_by uuid NOT NULL FK identity.party; requested_at timestamptz NOT NULL; mfa_verified boolean NOT NULL CHECK (mfa_verified = true); reason_ciphertext bytea NOT NULL; b3_version text NOT NULL; gate_state text NOT NULL CHECK (gate_state IN ('disabled_b3','provider_unready','eligible','held','submitted','paid','failed')); provider_effect boolean NOT NULL CHECK (provider_effect = false); provider_run_ref text NULL; counsel_version text NULL; kyc_version text NULL; tax_version text NULL; holds_version text NULL; reconciliation_version text NULL; idempotency_scope text NOT NULL; idempotency_key text NOT NULL; version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (idempotency_scope, idempotency_key); (payee_party_id, created_at DESC); (statement_id, version); (gate_state, updated_at). | Finance operator reads own authorized runs; payee reads own disabled projection; worker inserts through gate RPC; provider adapter has no current grant; reason ciphertext restricted; anon no grant. |
| payout_transfer | id uuid PK NOT NULL; payout_run_id uuid NOT NULL FK royalty.payout_run; payee_party_id uuid NOT NULL FK identity.party; amount numeric(38,18) NOT NULL CHECK (amount > 0); currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'); state text NOT NULL CHECK (state IN ('disabled_b3','provider_unready','eligible','held','submitted','paid','failed')); external_effect boolean NOT NULL CHECK (external_effect = false); provider_transfer_ref text NULL; reconciliation_ref text NULL; disabled_reason text NOT NULL; version bigint NOT NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL. | Unique (payout_run_id); (payee_party_id, created_at DESC); (state, updated_at); (provider_transfer_ref) WHERE provider_transfer_ref IS NOT NULL. | Payee reads own disabled transfer projection; finance operator reads scoped state; current worker may insert with external_effect false; no provider write grant; anon no grant. |

### State, Concurrency and Transaction Rules

- The current state machine is requested → disabled_b3. The future enum members provider_unready, eligible, held, submitted, paid and failed remain schema-visible for evolution but are unreachable while B3 is disabled.
- The handler authenticates and verifies MFA, resolves statement/balance and validates gate facts, then checks a server-side capability setting in the same transaction. It writes payout_run and payout_transfer with provider_effect/external_effect false and commits an outbox audit event; it never dispatches a provider command.
- A payout request is accepted only if a statement version precedes it and the calculated balance is still payable. Statement/balance rows remain unchanged on disabled response. No balance decrement, transfer reservation, escrow credit, wallet entry or custody record is written.
- Compare-and-swap on expectedVersion and the unique idempotency scope serialize concurrent finance requests. A replay returns the original disabled run; a different payload under the key returns IDEMPOTENCY_MISMATCH; a stale version returns VERSION_CONFLICT.
- If a future evolution enables the gate, it must add provider finality, one transfer per payee/run, failed-transfer return to payable, interruptible idempotent runs, reconciliation and dispute holds. Ambiguous provider responses stay typed pending/provider_unready and never become paid by timeout.

### Grants, RLS and Retention

- RLS derives app.actor_party_id() and finance capability from BE00 acting context; every run and transfer checks payee, statement and balance ownership before disclosure.
- Finance operators may read gate/request state but cannot edit amounts, provider references, balances or statements. Payees see their own derived disabled state only. The service worker can insert through a narrow gate RPC with a server-enforced provider_effect false check.
- MFA evidence, reason ciphertext and audit/outbox lineage follow finance/legal retention. Erasure revokes ordinary access and pseudonymizes projections without deleting required financial evidence or immutable gate history.
- No browser path receives provider credentials, bank/tax details, token references, reason plaintext or private gate approval documents.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Finance operator | Request/read a disabled run for a payee balance within finance mandate, with MFA and reason. | No balance edit, provider dispatch, escrow release, bank/tax access or B3 bypass. |
| Payee/rightsholder | Read own calculated balance, statement and disabled payout projection. | Other payees, finance evidence, provider refs or changing gate state. |
| Rights administrator | Read mandate-scoped statement/balance context. | Requesting payout unless separately assigned finance role; no gate override. |
| Payout service principal | Validate gate and append disabled audit/projection through scoped RPC. | Provider invocation, custody, arbitrary payee scope or direct table mutation. |
| Future provider adapter | No current grant. | Any call before /evolve-feature enables and migrates the gate. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| ROY-PAY-API-01 | requestId → strictCors(royaltyPayoutOrigins) → requireAuth → resolveActingContext → requireMfa → rateLimit(payoutRequest) → parseZod(ExecuteRoyaltyPayoutRequest) → idempotency(30d) → authorizeFinancePayeeScope → resolveStatementBalance → b3CapabilityGuard → noProviderEffectGuard → payoutTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |

### Security and Privacy Controls

The server ignores client attempts to set enabled gate state, provider references or external effect. It evaluates a signed capability configuration and stores only opaque gate/version references. CORS never permits * with credentials. Responses are private, no-store; exact amounts are shown only to the payee or scoped finance actor. Never log reason plaintext, MFA evidence, provider tokens, bank/tax data or exact amounts. The current database checks and middleware make a provider call impossible before B3.

## Data Flow

1. Finance operator submits payee, statement, balance, exact amount, MFA evidence, reason and gate facts.
2. BE00 resolves the actor and finance capability; the handler checks statement-before-transfer, balance/version, holds and source scope.
3. The server-side B3 capability remains disabled. The transaction appends payout_run and payout_transfer with disabled_b3, providerEffect false, external_effect false and a redacted audit/outbox record.
4. The response contains PAYOUT_DISABLED_B3 semantics through the typed disabled success; calculated statement and balance remain readable and unchanged.
5. A future evolution may consume the outbox shape only after legal/provider/ledger/reconciliation gates are separately approved. No current consumer treats the run as money movement.

## Events and Consumer Contracts

Events are transactional-outbox records with eventId, eventType, schemaVersion, occurredAt, aggregateId, aggregateVersion, correlationId and causationId. The payload is pseudonymous and carries gate/state/version only; it never carries exact amounts, bank/tax data, provider credentials, reason text or custody claims.

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| royalty.payout.changed.v1 | ROY-PAY-API-01 | payoutRunId, transferId nullable, payeePseudonym, gateState, providerEffect false, balancePreserved true, statementVersion, version; finance projections and future reconciliation consumers may observe the disabled state. |

Consumers must deduplicate by eventId and aggregate version, treat disabled_b3 as non-payment, and never infer escrow, provider submission, receipt, revenue or forfeiture from this event.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| ROY-PAY-API-01 | B3 disabled | Return PAYOUT_DISABLED_B3 before provider dispatch; persist only a disabled audit/projection if the request is otherwise valid, preserve statement/balance, and expose the next gate owner without promising money. |
| ROY-PAY-API-01 | Missing role/MFA, foreign payee, stale version | Return NOT_AUTHORIZED with 403 or resource-hiding 404 as applicable; no run/transfer mutation. Retry after authority/MFA/version correction under a new or same valid idempotency key. |
| ROY-PAY-API-01 | Held calculation or dependency outage | Return CALCULATION_HELD or DEPENDENCY_UNAVAILABLE; no provider effect and no balance edit. Queue only safe read retry; breaker fails closed. |
| ROY-PAY-API-01 | Duplicate or concurrent request | Return committed disabled run for the same payload; conflicting key or stale CAS returns typed IDEMPOTENCY_MISMATCH/VERSION_CONFLICT. |

All errors serialize ApiError { code, message, requestId, details }; details includes gate state, field paths, safe retry metadata and blocker ownership, never private financial or provider data.

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| ROY-PAY-API-01 | Zod strict request, MFA/reason, exact amount, gate facts, disabled success and exact error envelope. | Finance role, payee ownership, 403/404 concealment, CORS/rate, no custody/escrow claim and no secret logging. | Run/transfer uniqueness, provider-effect false constraints, CAS, RLS/grants and transactional outbox. | Prove zero provider calls, B3 outage/disabled path, duplicate replay, version race, breaker and redacted audit. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, decimal bounds, MFA evidence and disabled response invariants. PostgreSQL tests prove provider_effect=false and external_effect=false constraints, statement/balance immutability, idempotency, CAS, RLS and retention. Worker tests assert no provider adapter invocation under every gate/role/timeout combination and monotonic event versions. Playwright covers private disabled-state disclosure, accessible gate explanation and no promise of payment. The gate fails on provider invocation, amount decrement, escrow/custody wording, role override, exact secret logging or enabled state without /evolve-feature.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — boundary:** verified ROY-16 maps one-to-one to ROY-PAY-API-01; calculation/statements remain 18c and future provider effects remain outside current scope.
- **Pass 2 — micro:** resolved MFA, reason, statement-before-transfer, calculated balance, providerEffect false, exact error, idempotency and CAS behavior.
- **Pass 3 — macro:** traced finance request → BE00 authority → 18c statement/balance → B3 capability → disabled run/transfer → outbox; no provider or custody edge exists.
- **Pass 4 — abuse/recovery:** covered role override, duplicate request, stale version, dependency timeout, ambiguous future provider result and privacy-safe logs.
- **Pass 5 — contract:** operation has exact Zod request/success/error, 403/404, idempotency, rate, CORS, ApiError, persistence, RLS, event and test rows.

## Ambiguity Gate

**PASS.** ROY-16 is fully resolved as a disabled B3 operation. No current request can invoke a provider or represent platform custody. Future enabled behavior is an explicit /evolve-feature boundary with named legal and operational contracts.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored the B3-gated payout request and disabled transfer projection with no-provider-side-effect guarantees. | /write-be-spec |

## Dependency References

- **Depends on:** [BE00](00-infrastructure.md) for authority, MFA, CORS, error envelope, idempotency, audit and capability config; 18c for payee_statement and calculated_balance; Shard 01 for finance mandate; future provider/legal/ledger contracts are intentionally absent until /evolve-feature.
- **Consumed by:** Finance projections and future reconciliation may consume royalty.payout.changed.v1 as a disabled state; no consumer may treat it as payment or custody.
- **Boundary:** payout_run and payout_transfer are projections only. PAYOUT_DISABLED_B3 is returned before provider effect, and no threshold, dormancy, erasure or closure can create platform revenue, float, forfeiture or redistribution.
