# Licence Issuance, Verification and Lifecycle — Backend Specification

## Split Group

Shard 20 licensing core, split 20d. This companion owns the protected licence transaction, canonical scope grammar, immutable licence instrument, certificate projection, live verifier and lifecycle event for LIC-15 through LIC-19. It is the sole Shard 20 issuance authority. It consumes fresh clearance, consent, policy, quote, MFN, hold and evidence state; it does not rewrite upstream truth or treat certificate bytes as authority.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| LIC-15 issue licence | Protected saga command | Freeze all parties, scope, required sides, quotes, consent and idempotency; re-evaluate fresh and commit consideration plus required-side instrument atomically. Paid multi-counterparty is denied by B3 before provider effect; zero consideration remains valid. |
| LIC-16 download certificate | Projection command/query | Render a reproducible projection of an issued canonical instrument with an unguessable reference. Render failure retries while the instrument remains issued. |
| LIC-17 verify licence | Public live query | Resolve grammar, instrument and lifecycle live, returning safe status, checked-at and validity window. Outage is CANNOT_VERIFY, never invalid. |
| LIC-18 amend licence | Superseding command | Classify administrative, narrowing or widening. Widening is a new grant with fresh scope, clearance, consent, quote and consideration; original remains unchanged on refusal. |
| LIC-19 process term/termination | Lifecycle command | Resolve commencement and duration; expiry can be expiry_indeterminate. Breach termination needs instrument-authorized remedy plus Shard 06 evidence or case. Later policy, veto or ownership changes cannot terminate issued state. |

BE00 inheritance is mandatory for every operation: requestId, acting context, strict Zod 4 parsing, idempotency ledger, audit/outbox, RLS, rate limits, settings and the exact ApiError { code, message, requestId, details } envelope. No platform route is redeclared.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 20](../ia/20-licensing-core.md) | Interactions, lines 64–86 | Normative issuance, certificate, verification, amendment and lifecycle preconditions, behavior and recovery. |
| [IA Shard 20](../ia/20-licensing-core.md) | Contracts, lines 99–131 | LicenceScope, InstrumentState, IssueLicence, VerifyLicence, AmendLicence and issuance errors. |
| [IA Shard 20](../ia/20-licensing-core.md) | Data Models, lines 133–155 and 157–182 | scope_grammar_version, licence_transaction, licence_instrument, licence_certificate_projection and licence_lifecycle_event fields and invariants. |
| [IA Shard 20](../ia/20-licensing-core.md) | Access Control, lines 184–206 | Buyer, owner, operator, finance, dispute reviewer and service-principal permissions. |
| [IA Shard 20](../ia/20-licensing-core.md) | Event Schemas, lines 217–232 | Instrument issued and lifecycle events, safe payloads and exclusions. |
| [IA Shard 20](../ia/20-licensing-core.md) | Edge Cases and matrices, lines 234–297 | B3 gate, ambiguous provider, render failure, verifier outage, widening, unknown term and delivery handoff. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Issuance and Consideration Saga, lines 51–60 | Protected freeze, fresh gate, payee topology, atomic transaction, provider reconciliation and asynchronous render. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Lifecycle Algorithm, lines 62–71 | Immutable instrument, amendment classes, policy independence, expiry, breach remedy and live verification. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Abuse and Recovery Verification, lines 73–85 | Partial issue, charge-without-licence, exclusive race, certificate authority and later-veto safeguards. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Cross-Shard Contracts and Implementation Envelope, lines 87–104 | BE00 provider/storage/jobs, Shards 01, 02, 04, 06, 09 and 10, PostgreSQL/RLS, queues and outbox. |
| [BE00](00-infrastructure.md) | Contracts, middleware and deterministic protocol rules | Global ApiError, actor context, idempotency, audit/outbox, CORS, B3 feature gate, provider pending and fail-closed inheritance. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| LIC-15 Gate issues licence | LIC-INS-API-01 | Freezes buyer, licensee, purchaser authority, end client, scope, sides, quotes, consents and idempotency; fresh clearance/policy/hold checks; no partial pair, no paid multi-payee B3 effect and ambiguous provider remains pending. |
| LIC-16 User downloads certificate | LIC-INS-API-02 | Renders canonical issued instrument with unguessable verification reference; retryable projection failure never reissues or erases instrument. |
| LIC-17 Third party verifies | LIC-INS-API-03 | Performs live pinned grammar/instrument/lifecycle lookup with safe status, checked-at and validity window; outage is CANNOT_VERIFY. |
| LIC-18 Parties amend licence | LIC-INS-API-04 | Requires affected-party authority; administrative/narrowing supersede, widening starts a fresh grant and refusal leaves original untouched. |
| LIC-19 System processes term/termination | LIC-INS-API-05 | Resolves trigger/duration, warns both sides, records expiry_indeterminate when needed and permits breach termination only with instrument remedy and Shard 06 case/evidence. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| LIC-15 | Protected atomic licence issuance | LIC-INS-API-01 | Transaction, consideration, required-side instrument pair, lifecycle event and outbox are all committed or none. |
| LIC-16 | Certificate projection | LIC-INS-API-02 | Versioned render hash/object and unguessable verification reference, with retry state independent of instrument. |
| LIC-17 | Live licence verification | LIC-INS-API-03 | Pinned grammar and instrument lifecycle resolution returns safe status or cannot-verify. |
| LIC-18 | Superseding amendment | LIC-INS-API-04 | Affected-party authority and change class; widening produces a new grant path and original remains immutable. |
| LIC-19 | Term and termination processing | LIC-INS-API-05 | Lifecycle state, trigger/duration, warning and authorized breach evidence are durable and verifiable. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| LIC-INS-API-01 | POST | /api/v1/licensing/licence-transactions | LIC-15 | Buyer or mandate representative with named purchaser authority; issuance gate service owns final commit. | 201 IssueLicenceSuccess |
| LIC-INS-API-02 | POST | /api/v1/licensing/licence-certificates | LIC-16 | Instrument party or purpose-limited render service. | 202 DownloadCertificateSuccess |
| LIC-INS-API-03 | POST | /api/v1/licensing/licence-verifications | LIC-17 | Public verifier with unguessable reference; no private party context required. | 200 VerifyLicenceSuccess |
| LIC-INS-API-04 | POST | /api/v1/licensing/licence-amendments | LIC-18 | Every affected instrument party or mandate with authority for each affected party. | 201 AmendLicenceSuccess |
| LIC-INS-API-05 | POST | /api/v1/licensing/licence-lifecycle-events | LIC-19 | Lifecycle worker, instrument party warning path or dispute/legal reviewer with assigned case. | 201 ProcessLifecycleSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 authority and MFA verifier | {accessToken, actingContextId, resourceId, requiredRole, mfaAgeSeconds} → {actorId, partyId, roles, mandateVersion, contextVersion, mfaSatisfied} | 300 ms | 2 retries at 50 ms and 150 ms before protected mutation | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| 20b fresh clearance and consent resolver | {workId, scopeHash, buyerId, endClientId, expectedEvidenceVersion, expectedConsentVersion} → {clearanceVerdict, consentStates, snapshotVersion, evaluatedAt} | 800 ms | 2 retries at 100 ms and 300 ms with a fresh read key | Open after 4 failures in 30 s; issuance returns CLEARANCE_UNKNOWN or CONSENT_REQUIRED and does not call provider; half-open after 20 s. |
| 20c policy, quote and MFN resolver | {scopeHash, policyFoldId, quoteIds, mfnEvaluationId, asOf} → {policyVerdict, quoteStates, mfnState, agreedAmount, owedAmount, versions} | 800 ms | 2 retries at 100 ms and 300 ms; stale values rejected | Open after 4 failures in 30 s; issuance returns POLICY_BLOCKED or MFN_PROVISIONAL; half-open after 20 s. |
| Shard 04 delivery command boundary | {instrumentId, instrumentVersion, workId, lifecycleCaseRef, command: ApplyDeliveryHold or ReleaseDeliveryHold or RevokeDeliveryEligibility} → {deliveryCommandId, acceptedState, deliveryVersion} | 900 ms | 2 retries at 150 ms and 450 ms with same command idempotency key | Open after 4 failures in 30 s; command remains pending and instrument state is never fabricated; half-open after 20 s. |
| Single-payee consideration provider | {transactionId, payeeId, amountMinor, currency, idempotencyKey} → {providerReference, commitmentState, amountMinor, currency} | 1500 ms | 2 retries at 500 ms and 1500 ms only with provider idempotency | Open after 4 failures in 60 s; ambiguous state remains pending for reconciliation, never charged or issued; half-open after 30 s. Paid multi-payee is rejected before this seam. |
| Certificate renderer and storage | {instrumentId, instrumentVersion, format, verificationRef} → {objectKey, renderHash, bytes, rendererVersion} | 1200 ms | 3 retries at 300 ms, 900 ms and 2700 ms with same projection key | Open after 5 failures in 60 s; instrument stays issued and projection is retryable; half-open after 30 s. |
| Shard 06 breach evidence/case resolver | {instrumentId, caseRef, remedyRef, actorId} → {caseState, evidenceVersion, remedyAuthorized} | 700 ms | 2 retries at 100 ms and 300 ms; no termination on uncertainty | Open after 4 failures in 30 s; lifecycle remains active or expiry_indeterminate; half-open after 20 s. |

## Request/Response Contracts

All five operations use strict Zod 4 contracts and a required Idempotency-Key header, except public verification where the reference itself is the replay-safe query key. Every failure uses ApiError { code, message, requestId, details }. Canonical issue state is authoritative; projection and provider statuses are subordinate.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const LicenceScopeSchema = z.strictObject({
  grammarVersion: z.string().min(1).max(64),
  media: z.array(z.string().min(1)).min(1),
  dataUse: z.array(z.string().min(1)).min(1),
  territoryCountries: z.array(z.string().length(2)).min(1),
  termTrigger: z.string().min(1).max(128),
  termDuration: z.string().min(1).max(128),
  exclusivity: z.enum(["non_exclusive", "exclusive"]),
  usage: z.array(z.string().min(1)).min(1),
  scale: z.string().min(1).max(128),
  extent: z.string().min(1).max(128),
  granteePartyId: z.uuid()
});
const ConsiderationSchema = z.strictObject({
  topology: z.enum(["single_payee", "zero"]),
  payeeId: z.uuid().nullable(),
  amountMinor: z.int().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable()
});
const ApiErrorSchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.uuid(),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
});

export const IssueLicenceRequest = z.strictObject({
  buyerId: z.uuid(),
  licenseeId: z.uuid(),
  purchaserAuthorityId: z.uuid(),
  endClientId: z.uuid(),
  scope: LicenceScopeSchema,
  requiredSideIds: z.array(z.uuid()).min(1),
  quoteIds: z.array(z.uuid()).min(1),
  consentRequestIds: z.array(z.uuid()).min(1),
  mfnEvaluationId: z.uuid().nullable(),
  consideration: ConsiderationSchema,
  expectedHoldVersion: z.int().positive(),
  expectedPolicyVersion: z.int().positive(),
  expectedClearanceVersion: z.int().positive()
});
export const IssueLicenceSuccess = z.strictObject({
  transactionId: z.uuid(),
  instrumentIds: z.array(z.uuid()).min(1),
  state: z.enum(["issued", "pending", "void", "refunded"]),
  providerCommitmentState: z.enum(["not_called", "committed", "pending", "voided", "refunded"]),
  requestId: z.uuid()
});

export const DownloadCertificateRequest = z.strictObject({
  instrumentId: z.uuid(),
  instrumentVersion: z.int().positive(),
  format: z.enum(["pdf", "json"]),
  verificationRef: z.string().min(32).max(128)
});
export const DownloadCertificateSuccess = z.strictObject({
  certificateId: z.uuid(),
  instrumentId: z.uuid(),
  objectKey: z.string().min(1).max(512),
  renderHash: z.string().length(64),
  state: z.enum(["ready", "pending"]),
  requestId: z.uuid()
});

export const VerifyLicenceRequest = z.strictObject({
  verificationRef: z.string().min(32).max(128)
});
export const VerifyLicenceSuccess = z.strictObject({
  status: z.enum(["issued", "active", "expiry_indeterminate", "expired", "superseded", "terminated", "cannot_verify"]),
  instrumentVersion: z.int().positive().nullable(),
  checkedAt: z.iso.datetime(),
  validFrom: z.iso.datetime().nullable(),
  validUntil: z.iso.datetime().nullable(),
  expiryIndeterminate: z.boolean(),
  requestId: z.uuid()
});

export const AmendLicenceRequest = z.strictObject({
  instrumentId: z.uuid(),
  affectedPartyIds: z.array(z.uuid()).min(1),
  changeClass: z.enum(["administrative", "narrowing", "widening"]),
  requestedScope: LicenceScopeSchema.nullable(),
  amendmentReason: z.string().min(1).max(1000),
  expectedInstrumentVersion: z.int().positive()
});
export const AmendLicenceSuccess = z.strictObject({
  amendmentId: z.uuid(),
  supersedingInstrumentId: z.uuid().nullable(),
  state: z.enum(["accepted", "requires_new_grant", "rejected"]),
  requestId: z.uuid()
});

export const ProcessLifecycleRequest = z.strictObject({
  instrumentId: z.uuid(),
  eventType: z.enum(["commence", "expire", "terminate_breach", "terminate_authorized", "warn"]),
  triggerAt: z.iso.datetime().nullable(),
  caseRef: z.string().max(128).nullable(),
  remedyRef: z.string().max(128).nullable(),
  expectedInstrumentVersion: z.int().positive()
});
export const ProcessLifecycleSuccess = z.strictObject({
  lifecycleEventId: z.uuid(),
  state: z.enum(["issued", "active", "expiry_indeterminate", "expired", "superseded", "terminated"]),
  warningDispatched: z.boolean(),
  requestId: z.uuid()
});
export const LicensingApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| LIC-INS-API-01 | IssueLicenceRequest with Idempotency-Key | IssueLicenceSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-INS-API-02 | DownloadCertificateRequest with Idempotency-Key | DownloadCertificateSuccess / 202 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-INS-API-03 | VerifyLicenceRequest with verification reference | VerifyLicenceSuccess / 200 | ApiError { code, message, requestId, details } / 400,404,429,503 |
| LIC-INS-API-04 | AmendLicenceRequest with Idempotency-Key | AmendLicenceSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-INS-API-05 | ProcessLifecycleRequest with Idempotency-Key | ProcessLifecycleSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| LIC-INS-API-01 | Require named buyer, licensee, purchaser authority and end client, complete LicenceScope, all required sides, live quotes, consent completion and expected versions. Re-evaluate clearance, blocks, holds, exclusivity and policy under a protected transaction. Paid multi-counterparty returns MULTIPAYEE_DISABLED_B3 before provider call; zero consideration is valid. |
| LIC-INS-API-02 | Require instrument party authority, issued instrument version and unguessable verificationRef. Certificate is a render projection only; render or storage failure produces pending and never changes instrument state. |
| LIC-INS-API-03 | Require only an unguessable verification reference. Resolve pinned grammar, instrument and lifecycle live. Return safe status, checkedAt and validity window; an unresolved term is expiry_indeterminate and a dependency outage is cannot_verify, never invalid. |
| LIC-INS-API-04 | Require every affected party authority and a preclassified change. Administrative or narrowing creates a superseding record. Widening returns AMENDMENT_REQUIRES_NEW_GRANT and starts new scope, clearance, consent, quote and consideration; the original is untouched on refusal. |
| LIC-INS-API-05 | Require issued instrument, expected version and a resolvable trigger or authorized breach remedy with Shard 06 case/evidence. Warn both sides before expiry. Regret is not breach; later policy, veto, ownership or encumbrance cannot terminate issued state. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| LIC-INS-API-01 | CLEARANCE_BLOCKED, CLEARANCE_UNKNOWN, CONSENT_REQUIRED, POLICY_BLOCKED, EXCLUSIVITY_CONFLICT, CONSIDERATION_UNCOMMITTED, MULTIPAYEE_DISABLED_B3, ISSUANCE_CONFLICT, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign buyer, mandate or purchaser authority; 404 hides unknown transaction, quote, side or work. | Required 7 years; hash covers parties, scope, side set, quote/consent/MFN IDs, expected versions and consideration topology. Replay returns transaction/instrument; mismatch returns IDEMPOTENCY_MISMATCH. | 20 issuance attempts/hour/buyer; 5 concurrent/work. | Log operationId, requestId, transaction/work/scope hashes, side-count bucket, topology class, gate outcome, provider state, pending age and latency; no private terms, names or amount. |
| LIC-INS-API-02 | NOT_AUTHORIZED, INSTRUMENT_NOT_ISSUED, RENDER_UNAVAILABLE, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for non-party or foreign instrument; 404 hides unknown instrument/version/certificate. | Required 30 days; hash covers instrument/version/format/verification-ref hash. Replay returns projection status; mismatch returns IDEMPOTENCY_MISMATCH. | 120 renders/hour/party; 10 concurrent/instrument. | Log operationId, requestId, instrument hash, version, format, renderer version, render state, retry count and latency; no certificate bytes or private terms. |
| LIC-INS-API-03 | CANNOT_VERIFY, GRAMMAR_UNSUPPORTED, VERIFICATION_REFERENCE_INVALID, DEPENDENCY_UNAVAILABLE. 403 is not used for public verification; 404 hides unknown reference without distinguishing private instruments. | Idempotency not applicable to this read-only query; reference is the stable live query key and request keys are rejected. No body mutation. Repeated checks return current checkedAt and status. | 600 verifications/hour/IP; 50 concurrent/reference bucket. | Log operationId, requestId, reference hash, status class, grammar version, checked-at bucket, dependency latency and outage class; no private terms or identity. |
| LIC-INS-API-04 | AMENDMENT_REQUIRES_NEW_GRANT, NOT_AUTHORIZED, VERSION_CONFLICT, CLEARANCE_UNKNOWN, CONSENT_REQUIRED, POLICY_BLOCKED, DEPENDENCY_UNAVAILABLE. 403 for any missing affected-party authority; 404 hides unknown instrument/amendment. | Required 7 years; hash covers instrument, affected-party hashes, class, requested scope hash, reason class and expected version. Replay returns amendment; mismatch returns IDEMPOTENCY_MISMATCH. | 30 amendments/hour/instrument; 5 concurrent/instrument. | Log operationId, requestId, instrument/party hashes, change class, widening flag, state and dependency latency; no reason text or scope details. |
| LIC-INS-API-05 | LIFECYCLE_TRIGGER_UNRESOLVED, BREACH_EVIDENCE_REQUIRED, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for non-party or unassigned reviewer; 404 hides unknown instrument/case. | Required 7 years; hash covers instrument, event type, trigger class, case/remedy hashes and expected version. Replay returns lifecycle event; mismatch returns IDEMPOTENCY_MISMATCH. | 120 lifecycle events/hour/instrument; 20 concurrent/instrument. | Log operationId, requestId, instrument hash, event class, trigger state, expiry class, warning state and case hash; no breach evidence or private terms. |

## Database Schema

### PostgreSQL Model Registry

PostgreSQL owns grammar versions, protected transaction, canonical instrument, certificate metadata and lifecycle history. Provider state and bytes are adapter-owned; all foreign keys, constraints, indexes and grants below are explicit.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| scope_grammar_version | id uuid PK NOT NULL; version bigint NOT NULL CHECK version>0; axes jsonb NOT NULL CHECK jsonb_typeof(axes)='object'; allowed_values jsonb NOT NULL CHECK jsonb_typeof(allowed_values)='object'; hierarchy jsonb NOT NULL CHECK jsonb_typeof(hierarchy)='object'; exclusions jsonb NOT NULL CHECK jsonb_typeof(exclusions)='object'; rights_side_mapping jsonb NOT NULL CHECK jsonb_typeof(rights_side_mapping)='object'; effective_from timestamptz NOT NULL; effective_to timestamptz NULL CHECK effective_to IS NULL OR effective_to>=effective_from; state text NOT NULL CHECK state IN ('draft','active','deprecated'); supersedes_id uuid NULL FK licensing.scope_grammar_version; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(version); (state, effective_from DESC); (supersedes_id); GIN(allowed_values); (effective_to) | Licensing service reads active and deprecated versions; operator publishes reviewed versions; deprecated values remain resolvable for issued instruments; client cannot update/delete; anon may read only public grammar metadata. |
| licence_transaction | id uuid PK NOT NULL; work_id uuid NOT NULL FK works.work; buyer_id uuid NOT NULL FK identity.party; licensee_id uuid NOT NULL FK identity.party; purchaser_authority_id uuid NOT NULL FK identity.party; end_client_id uuid NOT NULL FK identity.party; scope jsonb NOT NULL CHECK jsonb_typeof(scope)='object'; scope_hash text NOT NULL CHECK length(scope_hash)=64; required_side_ids uuid[] NOT NULL CHECK cardinality(required_side_ids)>0; quote_ids uuid[] NOT NULL CHECK cardinality(quote_ids)>0; consent_request_ids uuid[] NOT NULL CHECK cardinality(consent_request_ids)>0; mfn_evaluation_id uuid NULL FK licensing.mfn_evaluation; topology text NOT NULL CHECK topology IN ('single_payee','zero'); payee_id uuid NULL FK identity.party; amount_minor bigint NOT NULL CHECK amount_minor>=0; currency char(3) NULL CHECK currency IS NULL OR currency ~ '^[A-Z]{3}$'; b3_gate_state text NOT NULL CHECK b3_gate_state IN ('not_applicable','enabled_single_payee','disabled_multi_payee'); provider_reference text NULL; provider_state text NOT NULL CHECK provider_state IN ('not_called','committed','pending','voided','refunded'); state text NOT NULL CHECK state IN ('pending','issued','void','refunded'); idempotency_key_hash text NOT NULL CHECK length(idempotency_key_hash)=64; expected_hold_version bigint NOT NULL CHECK expected_hold_version>0; expected_policy_version bigint NOT NULL CHECK expected_policy_version>0; expected_clearance_version bigint NOT NULL CHECK expected_clearance_version>0; issued_instrument_id uuid NULL FK licensing.licence_instrument; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; CHECK ((topology='zero' AND payee_id IS NULL AND amount_minor=0) OR (topology='single_payee' AND payee_id IS NOT NULL)); CHECK NOT (topology='single_payee' AND b3_gate_state='disabled_multi_payee') | UNIQUE(idempotency_key_hash); (buyer_id, state, created_at DESC); (work_id, state); (provider_reference); (state, updated_at); (issued_instrument_id) | Issuance RPC is the only writer; buyer and named parties read own transaction status; finance reads provider commitment under purpose grant; issuance worker reconciles pending; anon no grant; direct UPDATE/DELETE denied. |
| licence_instrument | id uuid PK NOT NULL; transaction_id uuid NOT NULL FK licensing.licence_transaction; grammar_version_id uuid NOT NULL FK licensing.scope_grammar_version; scope jsonb NOT NULL CHECK jsonb_typeof(scope)='object'; scope_hash text NOT NULL CHECK length(scope_hash)=64; buyer_id uuid NOT NULL FK identity.party; licensee_id uuid NOT NULL FK identity.party; purchaser_authority_id uuid NOT NULL FK identity.party; end_client_id uuid NOT NULL FK identity.party; capacities jsonb NOT NULL CHECK jsonb_typeof(capacities)='object'; required_side_ids uuid[] NOT NULL CHECK cardinality(required_side_ids)>0; price_minor bigint NOT NULL CHECK price_minor>=0; currency char(3) NULL CHECK currency IS NULL OR currency ~ '^[A-Z]{3}$'; obligations jsonb NOT NULL CHECK jsonb_typeof(obligations)='object'; issued_at timestamptz NOT NULL; effective_from timestamptz NULL; term_trigger text NOT NULL; term_duration text NOT NULL; state text NOT NULL CHECK state IN ('issued','active','expiry_indeterminate','expired','superseded','terminated'); supersedes_id uuid NULL FK licensing.licence_instrument; verification_ref_hash text NOT NULL CHECK length(verification_ref_hash)=64; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(transaction_id); UNIQUE(verification_ref_hash); (buyer_id, state, issued_at DESC); (licensee_id, state); (end_client_id, state); (state, effective_from); (supersedes_id) | Instrument parties read their own instrument; verifier reads safe public status by reference hash; lifecycle worker updates state through guarded RPC; support/counsel require assigned purpose grant; no direct edit/delete; anon sees safe verification response only. |
| licence_certificate_projection | id uuid PK NOT NULL; instrument_id uuid NOT NULL FK licensing.licence_instrument; instrument_version bigint NOT NULL CHECK instrument_version>0; format text NOT NULL CHECK format IN ('pdf','json'); verification_ref text NOT NULL CHECK length(verification_ref)>=32; object_key text NULL; render_hash text NULL CHECK render_hash IS NULL OR length(render_hash)=64; renderer_version text NULL; state text NOT NULL CHECK state IN ('pending','ready','failed','superseded'); attempt_count integer NOT NULL CHECK attempt_count>=0; last_error_class text NULL; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(instrument_id, instrument_version, format); (instrument_id, state); (verification_ref); (state, updated_at); | Instrument parties read their certificate metadata and authorized bytes through storage adapter; renderer writes metadata only; public verifier never receives certificate bytes; anon no storage grant; delete is forbidden while instrument is active. |
| licence_lifecycle_event | id uuid PK NOT NULL; instrument_id uuid NOT NULL FK licensing.licence_instrument; event_type text NOT NULL CHECK event_type IN ('commence','expire','terminate_breach','terminate_authorized','warn','amend'); trigger_at timestamptz NULL; case_ref text NULL; remedy_ref text NULL; actor_id uuid NOT NULL FK identity.party; evidence_version bigint NULL CHECK evidence_version IS NULL OR evidence_version>0; prior_state text NOT NULL CHECK prior_state IN ('issued','active','expiry_indeterminate','expired','superseded','terminated'); next_state text NOT NULL CHECK next_state IN ('issued','active','expiry_indeterminate','expired','superseded','terminated'); cause_class text NOT NULL; warning_dispatched boolean NOT NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(instrument_id, version); (instrument_id, created_at DESC); (instrument_id, next_state); (case_ref); (event_type, created_at DESC) | Instrument parties read own lifecycle; verifier reads safe next state and validity window; Shard 04 command worker reads assigned lifecycle assertions; Shard 06 reviewer reads case-scoped evidence; append-only, no direct delete; anon safe status only. |

### State, Concurrency and Transaction Rules

- Scope grammar versions are additive. Deprecated values remain resolvable for issued instruments, while a new grant must use a supported active grammar. The issued licence instrument stores its exact grammar version and canonical scope.
- LIC-INS-API-01 locks the idempotency row, all required side keys, holds, quotes, consents, policy/MFN versions and expected instrument conflict key in one serializable transaction. It repeats fresh clearance, blocks, holds, exclusivity and policy checks.
- Payee topology is evaluated before provider effect. A paid multi-counterparty request returns MULTIPAYEE_DISABLED_B3 and b3_gate_state disabled_multi_payee without invoking the provider. A single payee may commit; zero consideration has no provider call.
- For an allowed single payee, the provider commitment uses the transaction idempotency key. An accepted commitment and the required-side instrument pair are recorded atomically in PostgreSQL. A provider timeout or ambiguous response leaves transaction pending for reconciliation; a failed transaction voids or refunds commitment and never reports charge-only success.
- At most one overlapping exclusive can commit. Database exclusion or expected-version conflict returns ISSUANCE_CONFLICT; the loser is refused, not queued. No required-side instrument pair is partially persisted.
- Instrument issued_at is server time. effective_from and term trigger remain distinct. Render, notification, whitelist and Shard 04 delivery command failures cannot erase or reissue the instrument.
- Certificate projection reads canonical instrument only. Verification resolves live instrument, pinned grammar and lifecycle, never trusting certificate authority or a stale projection. Outage is cannot_verify.
- Amendment is append-only. Administrative and narrowing changes create a superseding record with every affected-party authority. Widening invokes a fresh grant path; refusal leaves original scope, price and lifecycle untouched.
- Lifecycle uses compare-and-swap on instrument version. A non-computable term remains expiry_indeterminate. Breach termination requires instrument remedy plus Shard 06 evidence/case; regret is rejected. Later policy, ownership, veto or encumbrance changes affect new requests only.

### Grants, RLS and Retention

- RLS scopes transaction and instrument reads to buyer, licensee, purchaser authority, end client, required side party or declared mandate. Finance receives only provider commitment fields under a purpose grant. Public verifier receives safe status and validity window.
- Exact price, private obligations, party capacities, buyer identity, consent text, breach evidence, provider references and verification secret are excluded from public events and ordinary logs. Verification reference is stored hashed in canonical data and rendered only to authorized parties.
- Transaction, instrument, lifecycle, audit and idempotency history retain 7 years or legal hold, whichever is longer. Certificate bytes follow storage retention but metadata remains linked; superseded instruments remain resolvable.
- Service principals have named grants for issuance gate, provider reconciliation, certificate rendering, verification, lifecycle warning, Shard 04 command dispatch and outbox. No wildcard database or storage grant exists.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Buyer or buyer representative | Submit protected issuance, read own transaction/instrument and request own certificate under declared mandate. | Foreign buyer, undisclosed end client, multi-payee bypass or instrument edit. |
| Instrument party | Read own issued instrument, certificate and lifecycle; authorize affected-party amendment. | Another party’s private terms or unilateral widening. |
| Rights/licensing operator | Run assigned issuance, render, verification and lifecycle adapter jobs. | Grant owner consent, bypass B3, provider charge outside gate or arbitrary termination. |
| Finance operator | Reconcile allowed single-payee commitment and void/refund pending state. | Multi-payee routing, raw instrument edit or policy override. |
| Dispute/legal reviewer | Assigned breach evidence/case and authorized lifecycle projection. | Regret termination, general catalogue browsing or direct instrument edit. |
| Public verifier | Query safe status for an unguessable reference. | Private party, scope, price, obligations or evidence. |
| Service principal | Purpose-limited protected transaction, render, verify, lifecycle, delivery command and outbox work. | Interactive authority, wildcard storage or approval by timeout. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| LIC-INS-API-01 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → requireFreshMfa → rateLimit(licenceIssue) → parseZod(IssueLicenceRequest) → idempotency(7y) → authorizeBuyerMandateAndPurchaser → freshClearanceGuard → freshConsentGuard → freshPolicyQuoteMfnGuard → b3TopologyGuard → exclusiveConflictGuard → providerCommitmentSaga → atomicInstrumentPairTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-INS-API-02 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(certificateRender) → parseZod(DownloadCertificateRequest) → idempotency(30d) → authorizeInstrumentPartyOrRenderer → issuedInstrumentGuard → verificationReferenceGuard → renderProjectionJob → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| LIC-INS-API-03 | requestId → strictCors(publicVerificationOrigins) → rateLimit(publicVerify) → parseZod(VerifyLicenceRequest) → verificationReferenceGuard → liveGrammarInstrumentLifecycleResolver → safeProjectionRedactor → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| LIC-INS-API-04 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → requireFreshMfa → rateLimit(licenceAmendment) → parseZod(AmendLicenceRequest) → idempotency(7y) → authorizeEveryAffectedParty → changeClassGuard → freshGrantGuardForWidening → supersedingInstrumentTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-INS-API-05 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(lifecycleEvent) → parseZod(ProcessLifecycleRequest) → idempotency(7y) → authorizePartyWorkerOrAssignedCase → triggerResolutionGuard → breachEvidenceGuard → lifecycleCAS → warningAndDeliveryCommandDispatch → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |

### Security and Privacy Controls

- Strict Zod 4 parsing rejects unsupported grammar, incomplete scope, duplicate sides, negative amounts, invalid topology, mutable instrument fields and non-unguessable verification references. Canonical JSON is sorted before hashing.
- CORS separates credentialed licensing origins from public verification origins. Mutations require CSRF protection, fresh MFA where authority changes, and no client-supplied role or B3 enablement claim.
- 403 means an authenticated actor lacks authority over a known transaction, instrument, party or case. 404 hides unknown or out-of-scope resources. Public verification returns a safe not-found class without confirming private instrument existence.
- Provider adapters are unreachable for disabled multi-payee topology. Provider references, exact amounts and private terms are redacted from logs and events. Pending provider state is never collapsed into charged or issued.
- Certificate is a disposable projection. Verification uses the live canonical instrument and lifecycle, and cannot be made valid by possession of a certificate file.

## Data Flow

1. LIC-INS-API-01 freezes all parties, scope, required sides, quotes, consents and expected versions; it loads fresh 20b, 20c, hold and evidence state and applies B3 topology before any provider call.
2. If allowed, the single-payee provider commitment is reconciled and the transaction, canonical licence instrument, required-side records, audit and outbox are committed atomically. Ambiguous provider state remains pending.
3. LIC-INS-API-02 queues a certificate projection from the canonical instrument and emits licensing.instrument.issued.v1 only from the canonical issue transaction. Renderer failure retries independently.
4. LIC-INS-API-03 resolves grammar, instrument and lifecycle by unguessable reference and returns safe validity data. It never reads certificate bytes as authority.
5. LIC-INS-API-04 classifies the requested amendment. Widening returns AMENDMENT_REQUIRES_NEW_GRANT and re-enters 20b/20c/issuance; narrowing or administrative changes append a superseding instrument.
6. LIC-INS-API-05 resolves term or authorized breach, warns buyer and owners, appends lifecycle event and dispatches Shard 04 ApplyDeliveryHold, ReleaseDeliveryHold or RevokeDeliveryEligibility where applicable. It emits licensing.instrument.lifecycle.v1.
7. Shard 21 and Shard 22 consume instrument IDs and scope only; they cannot issue, widen or terminate this companion’s canonical instrument.

## Events and Consumer Contracts

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| licensing.instrument.issued.v1 | LIC-INS-API-01 | instrumentId, transactionId, scope hash, lifecycle state, grammar version, required-side count and instrument version; certificate, rights and notification consumers use it. Excludes price, parties, obligations, provider reference and verification secret. |
| licensing.instrument.lifecycle.v1 | LIC-INS-API-05 and amendment transaction | instrumentId, lifecycle state, cause class, event version, effective/expiry class and scope hash; verifier, search, Shard 04 delivery and notifications consume it. Excludes breach evidence, private terms and party identity. |

Events are transactional-outbox records keyed by event ID and aggregate version. Delivery, notification, renderer and consumer retries cannot create a second instrument. Consumers never strengthen validity or alter canonical lifecycle.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| LIC-INS-API-01 | Stale clearance/policy/hold, missing consent, exclusive race, B3-disabled topology, provider ambiguity or transaction failure | Return typed gate error before provider effect where possible. For ambiguous provider retain pending and reconcile; for failed commitment void/refund; commit required-side pair atomically or none. |
| LIC-INS-API-02 | Non-party request, stale instrument, renderer/storage outage or projection conflict | Return NOT_AUTHORIZED or INSTRUMENT_NOT_ISSUED; retain issued instrument and retry render with same projection key. Never reissue because a certificate failed. |
| LIC-INS-API-03 | Unknown reference, grammar deprecation, lifecycle resolver outage or unresolved trigger | Return safe cannot-verify or status. Outage never means invalid; unresolved term returns expiry_indeterminate with checkedAt and no fabricated date. |
| LIC-INS-API-04 | Missing affected-party authority, widening request, stale version or fresh-grant dependency outage | Return AMENDMENT_REQUIRES_NEW_GRANT, NOT_AUTHORIZED, VERSION_CONFLICT or dependency error. Leave original instrument unchanged on refusal; retry new grant with a new idempotency scope. |
| LIC-INS-API-05 | Unknown trigger, absent breach case/remedy, delivery command outage or lifecycle race | Return LIFECYCLE_TRIGGER_UNRESOLVED or BREACH_EVIDENCE_REQUIRED; keep active or expiry_indeterminate, retry warnings/Shard 04 commands idempotently and never terminate on regret or uncertainty. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| LIC-INS-API-01 | Strict scope, topology, parties, versions, instrument pair and exact ApiError schema. | Purchaser authority, fresh gate, MFA, B3 denial before provider, CORS/rate and 403/404. | Serializable saga, provider reconciliation, no partial pair, exclusivity, RLS/grants, outbox and issued event. | Provider ambiguous, void/refund, stale gate, concurrent exclusive, replay and redacted telemetry. |
| LIC-INS-API-02 | Instrument/version/format/reference and projection result schema. | Instrument-party authority, private bytes, CORS/rate and no authority from certificate. | Projection uniqueness, renderer retries, storage metadata, RLS/grants and issue-event consumer. | Renderer outage, stale version, duplicate job, replay and byte/term redaction. |
| LIC-INS-API-03 | Reference and safe status/validity window schema. | Public-origin CORS/rate, unguessable reference, private-term redaction and outage semantics. | Live grammar/instrument/lifecycle lookup, deprecated grammar resolution and no certificate authority. | Unknown ref, outage, unresolved trigger, superseded/terminated status and checkedAt telemetry. |
| LIC-INS-API-04 | Affected parties, class, scope, reason and superseding result schema. | Every-party authority, MFA, widening fresh grant, CORS/rate and original immutability. | Superseding instrument, version CAS, fresh 20b/20c handoff, RLS/grants and lifecycle event. | Refusal, dependency outage, concurrent amendment, replay and reason redaction. |
| LIC-INS-API-05 | Event type, trigger/case/remedy and InstrumentState schema. | Party/case authority, no regret breach, warning privacy, CORS/rate and 404 hiding. | Lifecycle CAS, expiry_indeterminate, Shard 06 evidence, Shard 04 command, RLS/grants and lifecycle event. | Trigger unknown, evidence outage, command retry, expiry race, replay and safe verifier state. |

### Test Levels and Acceptance Gates

- Unit: strict Zod 4 rejects extra keys, unsupported grammar, incomplete scope, invalid topology, non-unguessable references and malformed trigger/case combinations; every failure validates ApiError { code, message, requestId, details }.
- Integration: exercise BE00 authority/MFA, 20b clearance/consent, 20c policy/quote/MFN, Shard 04 delivery commands, Shard 06 evidence, provider and renderer adapters with exact timeout and retry behavior.
- Database: verify serializable issue transaction, required-side atomicity, B3 topology constraint, provider pending reconciliation, exclusion/CAS, instrument immutability, lifecycle retention, RLS and no direct grants.
- Property: replay issue, render, amendment and lifecycle idempotency; race two exclusive issues and two amendments; assert one winner, no partial pair and no provider side effect for B3-disabled topology.
- Acceptance gate: LIC-INS-API-01 through LIC-INS-API-05 each have route, Zod contract, field, error/auth/idempotency/rate/observability, middleware, persistence and test rows; all five assigned models and both assigned events are literal-covered.

## Deepening Passes and Ambiguity Gate

### Micro Pass

- Missing scope, unsupported grammar, stale versions, partial consent, multi-payee payment, provider ambiguity, render failure, public outage, unresolved term, widening, missing breach remedy and expired delivery command each have a typed terminal or pending state.
- issued-at, effective-from and term trigger remain distinct. Certificate, quote, policy, cache, ownership change and delivery projection cannot substitute for canonical instrument state.

### Meso Pass

- licence_transaction owns saga and consideration state, licence_instrument owns immutable authority, licence_certificate_projection owns disposable bytes, scope_grammar_version owns grammar compatibility and licence_lifecycle_event owns additive state history.
- 403 is an authority denial on a known resource; 404 hides existence. Public verifier receives safe state only. Provider or Shard 04 uncertainty never fabricates charge, issue, expiry or termination.

### Macro Pass

- 20b owns fresh evidence/clearance/consent, 20c owns policy/quote/MFN, 20a owns holds, Shard 04 executes delivery commands, Shard 06 owns breach evidence and Shard 10 owns rights. This companion owns instrument validity and lifecycle.
- Shard 21 and Shard 22 consume issued instrument IDs and scope through contracts but cannot issue or widen. Instrument lifecycle changes notify downstream consumers without allowing them to rewrite authority.

## Ambiguity Gate

**PASS.** LIC-15 through LIC-19 map one-to-one to five authoritative routes and complete operation-keyed matrices. Fresh gate, B3 topology, provider pending, atomic required-side pair, certificate projection authority, live verification, amendment classes, unresolved expiry, breach evidence and later-policy independence are deterministic. External seams, CORS, ApiError, RLS, grants, events and Shard 04 handoff are explicit.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored protected licence issuance, certificate projection, live verification, amendment and lifecycle backend contracts with B3 and fail-closed recovery gates. | /write-be-spec |

## Dependency References

- **Consumes:** [Shard 00 Contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) for authority, MFA, ApiError, B3 settings, provider adapters, storage/render jobs, audit, outbox and queues; [Shard 01 Contracts](../ia/01-identity-authority.md#contracts) for parties and mandates; [Shard 02 Contracts](../ia/02-profiles-verification.md#contracts) for evidence quality; [Shard 04 Contracts](../ia/04-cms-delivery-media.md#contracts) for ApplyDeliveryHold, ReleaseDeliveryHold and RevokeDeliveryEligibility; [Shard 06 Contracts](../ia/06-trust-safety.md#contracts) for breach evidence/cases; [Shard 09 Contracts](../ia/09-projects-collaboration.md#contracts) for works/assets; [Shard 10 Contracts](../ia/10-rights-ownership.md#contracts) for rights sides; 20a for holds; 20b for clearance/consent; 20c for policy/quote/MFN.
- **Publishes:** licensing.instrument.issued.v1 and licensing.instrument.lifecycle.v1 with scope hashes, versions and safe state classes.
- **Sibling handoff:** 20a receives lifecycle delivery assertions only; 20b and 20c receive invalidation or fresh-grant requests; no sibling can mutate the canonical instrument.
- **Downstream:** Shard 21 and Shard 22 consume issued instrument IDs, scope and safe lifecycle events; their specialized or release records never issue, widen or terminate this instrument.
