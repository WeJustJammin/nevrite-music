# Royalty Recovery & Statement Disputes — Backend Specification

**Status:** Complete
**IA source:** [Shard 18 — Royalty registration, ingestion, calculation and payout](../ia/18-royalty-accounting.md)
**Deep-dive source:** [Deep Dive 18 — Royalty accounting](../ia/deep-dives/18-royalty-accounting.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns mandate-bounded recovery-candidate review, evidence-bearing claim packs and scoped statement-dispute records. It contains ROY-17 and ROY-18. It may identify a candidate, preserve evidence and hand off a claim or dispute to the governed case process; it never promises an amount the source does not prove, adjudicates ownership, pays a party, creates escrow, or hides a restatement delta.

## Classification

- **Type:** evidence-preserving recovery and dispute command boundary with explicit authority, bounded scope and versioned case handoff.
- **Boundary:** recovery_candidate, claim_pack and royalty_dispute ownership; source statements/calculations remain 18b/18c, rights and credit truth remain Shards 10/07, protected case evidence remains Shard 06, and payout remains disabled in 18d.
- **Expected operations:** two HTTP operations, one for each assigned IA interaction (ROY-17 and ROY-18).
- **Approval:** blanket approval from /write-be-spec all shards; delegated decision authority applies.
- **Decision lock:** recovery reports candidate evidence and expected-by, not guaranteed money; dismissed candidates persist; disputes freeze named calculation/statement scope, absorb concurrent restatements and never release nonexistent escrow.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Interactions, lines 89–90 | ROY-17 approved-corpus search, evidence/mandate, no amount promise and manual handoff; ROY-18 scoped dispute, evidence, deadline and restatement absorption. |
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Contracts — Calculation, Statement and Financial Gate, lines 152–163 | Restatement/dispute relationship, statement traceability and no pre-B3 payment/escrow. |
| [IA Shard 18](../ia/18-royalty-accounting.md) | ## Data Models, lines 183–189 | recovery_candidate, claim_pack and royalty_dispute fields and relationships. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## Recoupment, Restatement and Statement Algorithm, lines 57–66 | Versioned deltas, dispute absorption, stale-resolution prevention and visible residuals. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## Registration and Recovery Algorithm, lines 77–86 | Mandate-bounded corpus, evidence cost, manual handoff, dismissed persistence and platform leakage attribution. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## Cross-Shard Contracts, lines 103–113 | Shard 01 mandates, Shard 06 case/evidence, Shard 10 rights and Shard 19 read-only consumers. |
| [Deep Dive 18](../ia/deep-dives/18-royalty-accounting.md) | ## Implementation Envelope, lines 115–121 | PostgreSQL/RLS, typed Hono/Zod, queues/outbox and provider-isolation requirements. |
| [BE00](00-infrastructure.md) | Request/Response Contracts, lines 112–138; Middleware & Policies, lines 253–298; Deterministic Protocol Rules, lines 330–348; Error Handling, lines 418–452 | Acting context, authorization, request IDs, idempotency, audit/outbox, CORS and ApiError conventions inherited by every operation. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| ROY-17 User reviews recovery candidate | ROY-REC-API-01 | Search only approved corpora inside a party/right mandate; preserve evidence and expected-by; amountKnown is false unless source proves it; dismissed and manual handoff states persist. |
| ROY-18 Party opens statement dispute | ROY-REC-API-02 | Freeze exact named scope/reason/evidence/deadline, attach Shard 06 case, absorb restatement delta and prevent stale resolution; no hidden payment or escrow. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| ROY-17 | Review recovery candidate | ROY-REC-API-01 | Candidate review state, evidence/mandate refs, amount-known rule, claim_pack or manual handoff and durable dismissal. |
| ROY-18 | Open statement dispute | ROY-REC-API-02 | Scoped statement/calculation versions, exact reason/evidence/deadline, case handoff and restatement-aware dispute state. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| ROY-REC-API-01 | POST | /api/v1/royalties/recovery-candidate-reviews | ROY-17 | Payee/rightsholder or mandate-scoped administrator reviews a party/right candidate in an approved corpus. | 200 ReviewRecoveryCandidateSuccess |
| ROY-REC-API-02 | POST | /api/v1/royalties/statement-disputes | ROY-18 | Named payee/rightsholder or authorized counterparty opens a dispute only for its calculation/statement scope. | 201 OpenStatementDisputeSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-party verifier | {accessToken, actingContextId, resourceScope, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms/150 ms before command | Open after 5 failures/30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Approved recovery-corpus search | {partyId, rightType, territory, corpusIds, evidencePolicy, correctionWindow} → {candidateIds, evidenceRefs, sourceProvenance, amountProofFlags, corpusVersion} | 1,200 ms | 2 retries at 250 ms/750 ms with same search key; no retry after partial evidence response | Open after 4 failures/60 s; candidate stays pending/manual_handoff; half-open after 30 s. |
| Shard 10 rights/statement scope resolver | {candidateId, partyId, rightType, statementId, calculationId, version} → {authorizedScope, sourceVersions, residualClass, conflictState} | 700 ms | 2 retries at 100 ms/300 ms with the same read key | Open after 4 failures/30 s; command fails closed; half-open after 20 s. |
| Shard 06 evidence/case handoff | {mandateRef, partyId, scope, evidenceRefs, reason, deadline} → {caseId, acceptedEvidenceRefs, caseState, acceptedVersion} | 800 ms | 2 retries at 100 ms/300 ms; replay by idempotency key | Open after 4 failures/30 s; local pack/dispute remains open for outbox retry; half-open after 20 s. |
| Shard 19 statement/calculation projection | {statementId, calculationId, version, disputeId} → {coverage, componentClasses, freshnessAt} | 700 ms | 2 retries at 100 ms/300 ms; read-only replay | Open after 4 failures/30 s; dispute retains local scope and freshness marker; half-open after 20 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with VALIDATION_FAILED; identifiers are UUIDs, dates are ISO calendar dates, timestamps are RFC 3339 with offset, evidence refs are opaque keys, and every error uses the BE00/global envelope ApiError { code, message, requestId, details }.

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
const Currency = z.string().regex(/^[A-Z]{3}$/);
const Context = z.object({ actingContextId: Uuid }).strict();
const EvidenceRefs = z.array(Key).min(1).max(200);
const ApiErrorSchema = z.object({
  code: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  requestId: Uuid,
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
}).strict();

export const ReviewRecoveryCandidateRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  partyId: Uuid,
  rightType: z.string().trim().min(1).max(80),
  territory: z.string().trim().min(2).max(16),
  corpusIds: z.array(Key).min(1).max(50),
  candidateId: Uuid.nullable(),
  action: z.enum(["review", "dismiss", "submit", "handoff"]),
  mandateRef: Key,
  evidenceRefs: EvidenceRefs,
  expectedBy: DateOnly.nullable(),
  correctionWindowEnd: DateOnly.nullable(),
  expectedVersion: z.int().positive().nullable()
}).strict();
export const ReviewRecoveryCandidateSuccess = z.object({
  candidateId: Uuid,
  claimPackId: Uuid.nullable(),
  caseId: Uuid.nullable(),
  state: z.enum(["reviewing", "dismissed", "submitted", "manual_handoff", "monitoring"]),
  amountKnown: z.boolean(),
  provenAmount: ExactAmount.nullable(),
  currency: Currency.nullable(),
  expectedBy: DateOnly.nullable(),
  version: z.int().positive()
}).strict();

export const OpenStatementDisputeRequest = z.object({
  ...Context.shape,
  idempotencyKey: Key,
  statementId: Uuid,
  calculationId: Uuid,
  claimantPartyId: Uuid,
  counterpartyPartyId: Uuid.nullable(),
  scopeAmount: ExactAmount,
  currency: Currency,
  reason: z.enum(["missing_usage", "wrong_identity", "wrong_rights", "wrong_allocation", "wrong_terms", "unpaid", "other"]),
  evidenceRefs: EvidenceRefs,
  deadline: DateOnly.nullable(),
  expectedVersion: z.int().positive()
}).strict();
export const OpenStatementDisputeSuccess = z.object({
  disputeId: Uuid,
  caseId: Uuid,
  statementId: Uuid,
  calculationId: Uuid,
  scopeAmount: ExactAmount,
  currency: Currency,
  state: z.enum(["open", "held", "resolved"]),
  absorbedRestatementVersion: z.int().positive().nullable(),
  version: z.int().positive()
}).strict();

export const ApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| ROY-REC-API-01 | ReviewRecoveryCandidateRequest | ReviewRecoveryCandidateSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| ROY-REC-API-02 | OpenStatementDisputeRequest | OpenStatementDisputeSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| ROY-REC-API-01 | Require party/right/territory mandate, approved corpus IDs, evidence refs and a closed action. Candidate search never ranks self-asserted credit alone. amountKnown is true only when a source proof flag and evidence ref establish the amount; otherwise provenAmount is null and the response says candidate, not money. Dismissal requires a reason in the case evidence and remains durable across re-sweeps. |
| ROY-REC-API-02 | Require claimant party to match the named calculation/statement party, exact scoped amount/currency, closed reason, evidence refs and a named statement/calculation version. If the scope cannot be frozen against that version, return DISPUTE_SCOPE_CONFLICT before mutation. A concurrent restatement is joined to the dispute and cannot be resolved by a stale version. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| ROY-REC-API-01 | NOT_AUTHORIZED, VALIDATION_FAILED, DEPENDENCY_UNAVAILABLE. 403 for absent party/right mandate; 404 hides unknown candidate/corpus/mandate. | Required 30 days; hash includes party/right/territory/corpus/action/mandate/evidence hashes. Replay returns candidate state; mismatch returns IDEMPOTENCY_MISMATCH. | 60 searches/hour/mandate; 20 claim submissions/day/party; 5 concurrent/corpus. | Log operationId, requestId, party/right/corpus hashes, action, amount-known class, evidence count, expected-by and dependency latency; no source names, evidence bytes or unproven amounts. |
| ROY-REC-API-02 | DISPUTE_SCOPE_CONFLICT, CALCULATION_HELD, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for non-party claimant; 404 hides unknown statement/calculation/dispute. | Required 30 days; hash includes statement/calculation/version/scope amount hash/reason/evidence hash. Replay returns dispute/case; mismatch returns IDEMPOTENCY_MISMATCH. | 20 disputes/hour/party; 5 concurrent/statement; 100/day/mandate. | Log operationId, requestId, dispute/statement/calculation hashes, reason class, evidence count, restatement version and case latency; never log exact amount, names or evidence. |

## Database Schema

### PostgreSQL Model Registry

All tables are in schema royalty, use UUID primary keys, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL and version bigint NOT NULL CHECK (version > 0). Amounts use numeric(38,18); evidence and source refs are opaque/encrypted; dismissed and dispute history is append-only.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| recovery_candidate | id uuid PK NOT NULL; party_id uuid NOT NULL FK identity.party; right_type text NOT NULL; territory text NOT NULL; corpus_id text NOT NULL; mandate_ref text NOT NULL; source_proof_ref text NULL; evidence_refs jsonb NOT NULL CHECK (jsonb_typeof(evidence_refs) = 'array'); amount numeric(38,18) NULL CHECK (amount IS NULL OR amount >= 0); currency char(3) NULL CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'); amount_known boolean NOT NULL; expected_by date NULL; correction_window_end date NULL; platform_leakage boolean NOT NULL DEFAULT false; state text NOT NULL CHECK (state IN ('reviewing','dismissed','submitted','manual_handoff','monitoring')); dismissed_reason text NULL; version bigint NOT NULL; timestamps. | Unique (party_id, right_type, territory, corpus_id, source_proof_ref); (party_id, right_type, state, updated_at DESC); (expected_by, state); (mandate_ref). | Payee/rightsholder reads own candidates; mandate administrator reads governed party/right; recovery worker inserts through corpus-scoped RPC; evidence refs protected; anon no grant. |
| claim_pack | id uuid PK NOT NULL; candidate_id uuid NOT NULL FK royalty.recovery_candidate; party_id uuid NOT NULL FK identity.party; mandate_ref text NOT NULL; evidence_refs jsonb NOT NULL CHECK (jsonb_typeof(evidence_refs) = 'array'); case_id uuid NULL FK trust.case; expected_by date NULL; correction_window_end date NULL; amount_proven boolean NOT NULL; proven_amount numeric(38,18) NULL CHECK (proven_amount IS NULL OR proven_amount >= 0); handoff_channel text NOT NULL CHECK (handoff_channel IN ('api','manual')); state text NOT NULL CHECK (state IN ('draft','submitted','accepted','manual_handoff','closed')); version bigint NOT NULL; timestamps. | Unique (candidate_id, version); (party_id, state, expected_by); (case_id); (mandate_ref). | Candidate owner and scoped administrator read own pack; Shard 06 receives allowlisted evidence refs; worker inserts/advances via CAS; raw evidence bytes never granted; anon no grant. |
| royalty_dispute | id uuid PK NOT NULL; statement_id uuid NOT NULL FK royalty.payee_statement; calculation_id uuid NOT NULL FK royalty.royalty_calculation; claimant_party_id uuid NOT NULL FK identity.party; counterparty_party_id uuid NULL FK identity.party; scope_amount numeric(38,18) NOT NULL CHECK (scope_amount >= 0); currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'); reason text NOT NULL CHECK (reason IN ('missing_usage','wrong_identity','wrong_rights','wrong_allocation','wrong_terms','unpaid','other')); evidence_refs jsonb NOT NULL CHECK (jsonb_typeof(evidence_refs) = 'array'); deadline date NULL; case_id uuid NOT NULL FK trust.case; restatement_version bigint NULL; state text NOT NULL CHECK (state IN ('open','held','resolved')); expected_version bigint NOT NULL; version bigint NOT NULL; timestamps. | Unique (statement_id, calculation_id, claimant_party_id, expected_version); (claimant_party_id, state, updated_at DESC); (case_id); (restatement_version). | Claimant reads own dispute; counterparty reads only scoped response; dispute reviewer and Shard 06 receive case projection; worker updates via CAS; no direct amount delete/update; anon no grant. |

### State, Concurrency and Transaction Rules

- A recovery_candidate moves reviewing → dismissed, submitted, manual_handoff or monitoring. Dismissed is terminal for that candidate version and is retained across later corpus sweeps; a new source proof creates a new version with lineage, not a silent resurrection.
- Candidate amount is nullable by design. The service may set amount_known true only when the approved corpus returns source proof and the evidence ref is retained. Self-asserted credit, confidence, candidate rank or an estimated split never creates proven money.
- claim_pack contains mandate, evidence, expected-by, correction window and handoff channel. If no filing API exists, handoff_channel is manual and state is manual_handoff; the platform records a task and deadline but never promises society recovery.
- A royalty_dispute freezes statement_id, calculation_id, claimant, exact scope amount, currency, reason and expected version in one transaction before creating the Shard 06 case. Concurrent changes compare-and-swap on expected_version; a mismatch returns DISPUTE_SCOPE_CONFLICT or VERSION_CONFLICT without widening scope.
- A restatement touching a disputed calculation appends restatement_version and moves the dispute to held/open with the exact delta reference. The dispute absorbs the new version; a stale resolution cannot win. There is no escrow release path, and a held dispute is a calculation/reporting state only.
- Every command uses a unique idempotency record plus transactional outbox. Evidence handoff and case creation are retried with the same key. A timeout leaves local candidate/pack/dispute state and a retryable outbox marker; no duplicate case or evidence submission is created.

### Grants, RLS and Retention

- RLS derives app.actor_party_id() and mandate version from BE00 acting context. Candidate predicates require party/right/territory scope; dispute predicates require claimant/counterparty/case assignment and exact statement/calculation ownership.
- Payee/rightsholder sees own candidate, claim pack and dispute; mandated administrators see only active scope; dispute reviewers see assigned evidence projections; Shard 06 receives protected case data through an allowlisted service grant; raw corpus bytes are never exposed.
- Evidence refs, mandates, source proof and case lineage follow legal/trust retention. Erasure revokes ordinary access and pseudonymizes projections without deleting required dispute, audit, source-proof or dismissal history.
- Exact disputed amounts are private. Logs, events and public search results expose amount-known/provenance class, not exact amount; no bank/tax, credential or provider data is stored here.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Payee/rightsholder | Review own party/right candidates, dismiss/submit own claim pack, and open disputes for own named statements/calculations. | Other parties, arbitrary corpus access, amount invention, case adjudication or payment. |
| Rights administrator | Review and submit candidates inside current party/right mandate; open a dispute only when mandate grants the named statement scope. | Cross-mandate search, ownership verdict, evidence widening, provider payout or escrow. |
| Counterparty/payer | Respond to a dispute case in the exact named scope when assigned. | Candidate corpus, payee catalogue, calculation rewrite or dispute scope widening. |
| Dispute reviewer | Read assigned candidate/dispute version, evidence refs and case state; record case outcome through Shard 06. | Direct royalty calculation mutation, candidate amount proof, payout release or cross-case browsing. |
| Recovery/dispute service principal | Search approved corpora and append scoped candidate/pack/dispute/outbox rows. | Expanding corpus/mandate scope, reading raw bytes, adjudicating, paying or creating custody. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| ROY-REC-API-01 | requestId → strictCors(royaltyRecoveryOrigins) → requireAuth → resolveActingContext → rateLimit(recoveryReview) → parseZod(ReviewRecoveryCandidateRequest) → idempotency(30d) → authorizeMandateAndCorpus → sourceProofGuard → dismissalPersistenceGuard → recoveryTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| ROY-REC-API-02 | requestId → strictCors(royaltyRecoveryOrigins) → requireAuth → resolveActingContext → rateLimit(statementDispute) → parseZod(OpenStatementDisputeRequest) → idempotency(30d) → authorizeNamedParty → disputeScopeFreeze → restatementVersionGuard → caseHandoffTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |

### Security and Privacy Controls

Approved-corpus allowlists, purpose-bound mandate tokens, evidence-reference encryption and case-scoped signed links are mandatory. CORS never permits * with credentials. Recovery responses are private, no-store and disclose only evidence class, amount-known state and expected-by; dispute responses are private to the parties/reviewer. Never log raw evidence, source names, exact amounts, unredacted mandates or case notes. Client input cannot choose a corpus outside the server allowlist, widen a dispute scope, or mark an amount proven. No recovery or dispute operation calls a payout provider or creates escrow.

## Data Flow

1. ROY-REC-API-01 verifies the actor and party/right mandate, queries only approved corpora, and records candidate evidence/provenance without deriving a promised amount.
2. Candidate review either persists dismissal, creates a claim_pack for API submission, or creates a manual handoff with expected-by and correction-window task. Shard 06 receives protected case/evidence refs where required.
3. ROY-REC-API-02 resolves named statement/calculation ownership and version, freezes the exact dispute scope, and creates a Shard 06 case through an idempotent outbox handoff.
4. A concurrent 18c restatement appends its version/delta to royalty_dispute and is absorbed by the case; stale dispute decisions are rejected by CAS. A disputed amount may be held in calculation, never in platform escrow.
5. Shard 19 and case consumers receive versioned projections only. Neither operation changes rights, calculations, statements, balances or payout state.

## Events and Consumer Contracts

Events are transactional-outbox records with eventId, eventType, schemaVersion, occurredAt, aggregateId, aggregateVersion, correlationId and causationId. Payloads contain pseudonymous IDs, scope/state/version, evidence-count and amount-known classes; they never contain exact amounts, evidence bytes, names, mandates or custody/payment claims.

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| royalty.recovery-candidate.changed.v1 | ROY-REC-API-01 | candidateId, partyPseudonym, rightType, territory, state, amountKnown, evidenceCount, expectedBy, version; recovery task projections and Shard 06 consume it. |
| royalty.dispute.changed.v1 | ROY-REC-API-02 and restatement worker | disputeId, caseId, statementId hash, calculationId hash, reason class, state, restatement version, version; Shard 06, statement views and reviewers consume it. |

Consumers deduplicate by eventId and aggregate version, retain dismissal and dispute lineage, and never infer a payment, ownership verdict, amount proof or escrow balance from an event.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| ROY-REC-API-01 | Corpus unavailable or partial evidence | Return DEPENDENCY_UNAVAILABLE or retain a pending/manual_handoff candidate with evidence count; retry search/outbox with the same key and never mark an amount proven from partial data. |
| ROY-REC-API-01 | Candidate dismissed or duplicate review | Persist dismissal and reason; a same-key replay returns the same candidate version. A new source proof creates an explicit new version and does not silently resurface dismissed history. |
| ROY-REC-API-01 | No filing API | Create claim_pack with manual channel, expected-by and owner; do not present a filing as submitted or a candidate as guaranteed money. |
| ROY-REC-API-02 | Scope/version conflict | Return DISPUTE_SCOPE_CONFLICT or VERSION_CONFLICT before case mutation; caller names the current version and retries with a new explicit scope. |
| ROY-REC-API-02 | Restatement races dispute | Append exact restatement version/delta, set the case projection held/open and reject stale resolution. No payment, escrow or hidden net is created. |
| ROY-REC-API-02 | Shard 06 handoff outage | Commit local dispute and outbox marker if scope is valid; retry case handoff idempotently, expose freshness and do not duplicate evidence. |

All errors serialize ApiError { code, message, requestId, details }; details includes safe scope/version/evidence-count and retry metadata without exact amounts, raw evidence or private names.

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| ROY-REC-API-01 | Zod strict corpus, mandate, evidence, action, amount-known and expected-by schema. | Party/right mandate, approved corpus, 403/404 concealment, CORS/rate, no amount guessing and no raw evidence logging. | Candidate uniqueness, durable dismissal, claim_pack/manual handoff, RLS/grants and recovery event. | Corpus timeout, partial evidence, duplicate replay, outbox retry and redacted telemetry. |
| ROY-REC-API-02 | Zod strict statement/calculation/version/scope/reason/evidence/deadline schema. | Named-party ownership, exact scope, 403/404 concealment, CORS/rate, case-only evidence and no escrow. | Dispute CAS, restatement absorption, case handoff, RLS/grants and dispute event. | Scope conflict, restatement race, Shard 06 outage, stale resolution and idempotent retry. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 strict schemas, opaque evidence keys, exact decimal scope, amount-known invariants and error envelopes. PostgreSQL tests validate RLS, candidate dismissal history, claim-pack channel, dispute scope uniqueness, CAS, retention and outbox atomicity. Worker tests prove approved-corpus boundaries, no self-asserted amount proof, duplicate-safe case handoff, restatement absorption and stale-resolution rejection. Playwright covers private candidate/dispute views, evidence-count/expected-by accessibility and clear no-payment/no-guarantee language. The gate fails on guessed amount, resurfaced dismissal, widened scope, cross-party evidence leak, duplicate case, stale resolution, payout call or escrow claim.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — boundary:** verified ROY-17 and ROY-18 map one-to-one to two operations; calculation/restatement, statement, payout and rights truth remain in their owning companions.
- **Pass 2 — micro:** resolved approved corpus, mandate, evidence proof, amount-known/null amount, dismissal permanence, manual handoff, exact dispute scope, deadline and reason behavior.
- **Pass 3 — macro:** traced corpus → candidate → claim pack/case and statement/calculation → dispute → Shard 06 case → restatement absorption; no payment or custody edge exists.
- **Pass 4 — abuse/recovery:** covered self-asserted credit, partial evidence, corpus outage, duplicate review, scope race, restatement race, stale resolution, case outage and privacy-safe telemetry.
- **Pass 5 — contract:** every operation has exact Zod request/success/error, 403/404, idempotency, rate, CORS, ApiError, persistence, RLS, event and operation-level tests.

## Ambiguity Gate

**PASS.** Recovery and dispute behavior is source-complete: no unproved amount becomes a promise, dismissed history persists, exact dispute scope/version is frozen, concurrent restatements are absorbed and no pre-B3 payment or escrow path exists.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored mandate-bounded recovery candidates, claim packs and restatement-aware statement disputes with protected evidence and no-payment controls. | /write-be-spec |

## Dependency References

- **Depends on:** [BE00](00-infrastructure.md) for authority, CORS, ApiError, idempotency, audit and outbox; 18b for source facts; 18c for immutable statement/calculation versions; 18d for the disabled payout boundary; Shards 01, 06, 07 and 10 for mandates, cases, credits and rights.
- **Consumed by:** Shard 06 case/evidence workflow and Shard 19 read-only reporting consume versioned candidate/dispute projections; no consumer may infer amount proof, ownership, payment or escrow.
- **Boundary:** recovery_candidate, claim_pack and royalty_dispute preserve evidence and scope only. Platform-caused leakage is attributed, disputed amounts may be held in calculation, and no money is held or released by this split.
