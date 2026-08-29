# Owner Policy, Quotes and MFN — Backend Specification

## Split Group

Shard 20 licensing core, split 20c. This companion owns share-scoped licensing policy versions, co-owner blocks, deterministic policy folds, rate cards, quotes, negotiation offers and MFN evaluations for LIC-09 through LIC-14. It does not own rights-side truth, evidence or clearance, catalogue projections, holds, issued instruments or lifecycle.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| LIC-09 owner policy | Versioned command | A share owner or administrator writes only their own share policy under a pinned grammar. New grammar values are not covered until adopted; transfer ends the prior policy. |
| LIC-10 co-owner block | Scoped veto command | A standing co-owner blocks a category or declared buyer/end client for a term. The block affects future and in-flight requests, never an issued instrument. |
| LIC-11 policy fold | Derived deterministic evaluation | Refusal, eligibility, per-owner threshold, human fall-through and pricing execute in fixed order, input-order independent, with binding owner attribution. |
| LIC-12 quote | Pinned pricing command | Policy passes before pricing. A quote pins scope, grammar, rate card, policy, read version, TTL and deadline; a money ask does not imply consent. |
| LIC-13 negotiation | Immutable offer command | Each counterparty records asks and counters within TTL; consent remains separate and partial agreement is never a deal. |
| LIC-14 MFN | Fixed-point derived evaluation | A complete settled eligible set is compared at a fixed settlement point, excluding self-comparison; agreed and owed values are separate and failure stays provisional. |

BE00 inheritance is mandatory: requestId, authenticated acting context, strict Zod 4 parsing, idempotency, audit/outbox, rate limiting, RLS and ApiError { code, message, requestId, details } are applied per operation. Platform endpoints are not duplicated here.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 20](../ia/20-licensing-core.md) | Interactions, lines 64–81 | Normative owner policy, block, fold, quote, negotiation and MFN preconditions and recovery. |
| [IA Shard 20](../ia/20-licensing-core.md) | Contracts, lines 99–131 | LicenceScope, policy fold, auto-approve, quote, MFN and instrument-adjacent error semantics. |
| [IA Shard 20](../ia/20-licensing-core.md) | Data Models, lines 133–149 and 157–182 | Seven assigned model relationships, cardinality and deterministic type registry. |
| [IA Shard 20](../ia/20-licensing-core.md) | Access Control, lines 184–206 | Owner, administrator, buyer, operator, finance and service-principal authority boundaries. |
| [IA Shard 20](../ia/20-licensing-core.md) | Event Schemas, lines 217–232 | Policy, block and quote event payloads and exclusion rules. |
| [IA Shard 20](../ia/20-licensing-core.md) | Edge Cases and matrices, lines 234–297 | New grammar, transfer, veto during quote, concurrent access, MFN failure and deletion behavior. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Policy and Pricing Algorithm, lines 40–49 | Refusal/eligibility/threshold/fall-through/pricing order, auto-approve, quote pinning, negotiation and MFN. |
| [Deep Dive 20](../ia/deep-dives/20-licensing-core.md) | Abuse and Recovery Verification, lines 73–85 | Silent approval, self-dealing, block, stale cache and immutable issuance protections. |
| [BE00](00-infrastructure.md) | Contracts, middleware and deterministic protocol rules | ApiError envelope, actor context, idempotency, audit/outbox, CORS, rate and fail-closed inheritance. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| LIC-09 Owner configures licensing policy | LIC-POL-API-01 | Saves share-scoped defaults, overrides, exclusions, thresholds and opt-in auto-approve under grammar; AI training is refused by default and transfer ends the version. |
| LIC-10 Co-owner creates veto/block | LIC-POL-API-02 | Validates standing side, category or declared buyer/end-client scope, term and disclosure; withdraws affected in-flight quote/consent but never rewrites an issued instrument. |
| LIC-11 System folds owner policies | LIC-POL-API-03 | Applies refusal, eligibility, per-owner threshold, fall-through and pricing in fixed order; failure or budget excess falls to human and names binding owner. |
| LIC-12 Buyer requests quote | LIC-POL-API-04 | Requires passed fold and covering rate card; pins policy, card, scope, read version, grammar and TTL; policy ask and consent remain separate. |
| LIC-13 Parties negotiate | LIC-POL-API-05 | Records immutable asks and counters within TTL per counterparty; pending or partial set never becomes a deal. |
| LIC-14 System evaluates MFN | LIC-POL-API-06 | Compares complete settled eligible distinct counterparties at fixed point, excludes self and keeps agreed versus owed values separate; failure is provisional. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| LIC-09 | Create a versioned share policy | LIC-POL-API-01 | Policy version with grammar adoption, axis defaults, thresholds and lifecycle. |
| LIC-10 | Create a future/in-flight co-owner block | LIC-POL-API-02 | Standing-checked block with scoped category or named buyer/end client and supersession history. |
| LIC-11 | Fold all owner policies deterministically | LIC-POL-API-03 | Attributed per-owner results, fixed order, threshold decision and binding owner. |
| LIC-12 | Produce a pinned licensing quote | LIC-POL-API-04 | Complete or labelled partial/pending quote with policy/card/read/scope/grammar versions and TTL. |
| LIC-13 | Record immutable negotiation offers | LIC-POL-API-05 | Offer/counter sequence with TTL, separate consent state and no-deal partial state. |
| LIC-14 | Evaluate MFN at settlement point | LIC-POL-API-06 | Settled-set manifest, agreed and owed values, fixed point and provisional refusal on incompleteness or evaluator failure. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to one operation ID below.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| LIC-POL-API-01 | POST | /api/v1/licensing/policies | LIC-09 | Share owner or administrator acting for that owner’s share. | 201 ConfigurePolicySuccess |
| LIC-POL-API-02 | POST | /api/v1/licensing/blocks | LIC-10 | Standing co-owner for the named rights side or assigned licensing operator. | 201 CreateLicensingBlockSuccess |
| LIC-POL-API-03 | POST | /api/v1/licensing/policy-folds | LIC-11 | Licensing evaluator for the buyer’s named request or assigned operator. | 200 EvaluatePolicyFoldSuccess |
| LIC-POL-API-04 | POST | /api/v1/licensing/quotes | LIC-12 | Buyer or mandate representative for the frozen scope; owner projections remain scoped. | 201 CreateQuoteSuccess |
| LIC-POL-API-05 | POST | /api/v1/licensing/negotiations | LIC-13 | Named buyer or counterparty acting on their own share or mandate. | 201 RecordNegotiationOfferSuccess |
| LIC-POL-API-06 | POST | /api/v1/licensing/mfn-evaluations | LIC-14 | Licensing evaluator at a fixed settlement point with the complete settled set. | 200 EvaluateMFNSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting-context verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms and 150 ms before mutation | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 10 share and ownership resolver | {workId, shareIds, buyerId, endClientId, asOf} → {ownerShares, standingVersions, transferStates, rightsVersion} | 700 ms | 2 retries at 100 ms and 300 ms; no policy activation on stale result | Open after 4 failures in 30 s; fold returns POLICY_EVALUATION_FAILED or DEPENDENCY_UNAVAILABLE; half-open after 20 s. |
| 20b clearance and consent resolver | {workId, scopeHash, policyReadVersion, consentRequestIds} → {clearanceVerdict, consentStates, snapshotVersion, evaluatedAt} | 800 ms | 2 retries at 100 ms and 300 ms with fresh read key | Open after 4 failures in 30 s; quote remains pending and no issuance path advances; half-open after 20 s. |
| BE00 settings/rate-card source | {shareIds, scopeHash, effectiveAt, cardVersion} → {rateRules, currency, coverage, sourceVersion} | 500 ms | 2 retries at 75 ms and 225 ms; stale card cannot price | Open after 4 failures in 30 s; return RATE_CARD_UNAVAILABLE; half-open after 20 s. |
| BE00 queue and outbox | {eventType, aggregateId, version, idempotencyKey} → {outboxId, acceptedAt} | 400 ms | 3 retries at 100 ms, 300 ms and 900 ms | Open after 5 failures in 30 s; canonical state commits with dispatch pending; half-open after 15 s. |

## Request/Response Contracts

All six operations use strict Zod 4 contracts and the required Idempotency-Key header. Every failure is ApiError { code, message, requestId, details }; no client receives raw policy thresholds, hidden owners or private negotiation text.

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
const PolicyAxesSchema = z.strictObject({
  media: z.array(z.string().min(1)).min(1),
  dataUse: z.array(z.string().min(1)).min(1),
  territories: z.array(z.string().length(2)).min(1),
  term: z.string().min(1).max(128),
  usage: z.array(z.string().min(1)).min(1),
  scale: z.string().min(1).max(128),
  extent: z.string().min(1).max(128),
  exclusivity: z.enum(["non_exclusive", "exclusive"])
});
const ApiErrorSchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.uuid(),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
});

export const ConfigurePolicyRequest = z.strictObject({
  shareId: z.uuid(),
  grammarVersion: z.string().min(1).max(64),
  defaults: PolicyAxesSchema,
  workOverride: PolicyAxesSchema.partial().nullable(),
  exclusions: z.array(z.string().min(1)).max(100),
  thresholdMinor: z.int().nonnegative(),
  trailing90DayShareValueMinor: z.int().nonnegative(),
  autoApproveOptIn: z.boolean(),
  effectiveFrom: z.iso.datetime(),
  expectedShareVersion: z.int().positive()
});
export const ConfigurePolicySuccess = z.strictObject({
  policyId: z.uuid(),
  state: z.enum(["draft", "active", "superseded", "ended_on_transfer"]),
  version: z.int().positive(),
  requestId: z.uuid()
});

export const CreateLicensingBlockRequest = z.strictObject({
  workId: z.uuid(),
  standingSideId: z.uuid(),
  category: z.string().min(1).max(128),
  buyerId: z.uuid().nullable(),
  endClientId: z.uuid().nullable(),
  termStart: z.iso.datetime(),
  termEnd: z.iso.datetime(),
  reasonDisclosure: z.string().min(1).max(1000),
  expectedSideVersion: z.int().positive()
});
export const CreateLicensingBlockSuccess = z.strictObject({
  blockId: z.uuid(),
  state: z.enum(["active", "lapsed", "superseded"]),
  requestId: z.uuid()
});

export const EvaluatePolicyFoldRequest = z.strictObject({
  workId: z.uuid(),
  scope: LicenceScopeSchema,
  ownerShareIds: z.array(z.uuid()).min(1).max(200),
  clearanceSnapshotId: z.uuid(),
  policyReadVersion: z.int().positive(),
  budgetMs: z.int().min(1).max(5000)
});
export const EvaluatePolicyFoldSuccess = z.strictObject({
  foldId: z.uuid(),
  verdict: z.enum(["pass", "blocked", "human_review"]),
  bindingOwnerId: z.uuid().nullable(),
  ownerResults: z.array(z.strictObject({
    shareId: z.uuid(),
    verdict: z.enum(["pass", "blocked", "human_review"]),
    thresholdPassed: z.boolean()
  })),
  requestId: z.uuid()
});

export const CreateQuoteRequest = z.strictObject({
  buyerId: z.uuid(),
  endClientId: z.uuid(),
  scope: LicenceScopeSchema,
  policyFoldId: z.uuid(),
  rateCardVersionId: z.uuid(),
  policyReadVersion: z.int().positive(),
  deadline: z.iso.datetime(),
  ttlSeconds: z.int().min(60).max(604800),
  expectedFoldVersion: z.int().positive()
});
export const CreateQuoteSuccess = z.strictObject({
  quoteId: z.uuid(),
  state: z.enum(["complete", "partial", "pending", "expired", "withdrawn"]),
  amountMinor: z.int().nonnegative().nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  expiresAt: z.iso.datetime(),
  requestId: z.uuid()
});

export const RecordNegotiationOfferRequest = z.strictObject({
  quoteId: z.uuid(),
  counterpartyId: z.uuid(),
  amountMinor: z.int().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  termsHash: z.string().length(64),
  consentState: z.enum(["pending", "approved", "declined", "countered"]),
  parentOfferId: z.uuid().nullable(),
  expectedQuoteVersion: z.int().positive()
});
export const RecordNegotiationOfferSuccess = z.strictObject({
  offerId: z.uuid(),
  state: z.enum(["open", "countered", "accepted", "withdrawn", "expired"]),
  sequenceNo: z.int().positive(),
  requestId: z.uuid()
});

export const EvaluateMFNRequest = z.strictObject({
  quoteId: z.uuid(),
  settlementPoint: z.iso.datetime(),
  settledOfferIds: z.array(z.uuid()).min(1).max(500),
  eligibleCounterpartyIds: z.array(z.uuid()).min(1).max(500),
  expectedOfferVersion: z.int().positive()
});
export const EvaluateMFNSuccess = z.strictObject({
  evaluationId: z.uuid(),
  state: z.enum(["final", "provisional"]),
  agreedAmountMinor: z.int().nonnegative().nullable(),
  owedAmountMinor: z.int().nonnegative().nullable(),
  requestId: z.uuid()
});
export const LicensingApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| LIC-POL-API-01 | ConfigurePolicyRequest with Idempotency-Key | ConfigurePolicySuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-POL-API-02 | CreateLicensingBlockRequest with Idempotency-Key | CreateLicensingBlockSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-POL-API-03 | EvaluatePolicyFoldRequest with Idempotency-Key | EvaluatePolicyFoldSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-POL-API-04 | CreateQuoteRequest with Idempotency-Key | CreateQuoteSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-POL-API-05 | RecordNegotiationOfferRequest with Idempotency-Key | RecordNegotiationOfferSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| LIC-POL-API-06 | EvaluateMFNRequest with Idempotency-Key | EvaluateMFNSuccess / 200 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| LIC-POL-API-01 | Require own share, supported grammar and complete axis values. Save defaults, work overrides, exclusions, per-owner share-denominated threshold and explicit auto-approve opt-in. AI training is refused unless affirmatively represented; exclusive auto-approve, foreign share and newly unsupported grammar are rejected. |
| LIC-POL-API-02 | Require standing on the named side, exactly one category or declared buyer/end-client scope, ordered term and reason-disclosure level. A block affects future and in-flight requests only. It is rejected without standing and remains lapsed or superseded in history. |
| LIC-POL-API-03 | Require a complete LicenceScope, all affected policies and a current clearance snapshot. Fold order is refusal, eligibility, per-owner threshold, human fall-through, then pricing. Input order cannot change output; failure or budget excess is human_review, never pass. |
| LIC-POL-API-04 | Require passed fold, rate card coverage, pinned scope, grammar, policy and read versions, positive TTL and deadline. POLICY_BLOCKED occurs before price. Partial or pending is labelled and money does not imply consent. |
| LIC-POL-API-05 | Require live non-expired quote, own counterparty authority, nonnegative currency amount, immutable terms hash and separate consent state. Asks/counters append in sequence; expired or partial offers cannot be accepted as a deal. |
| LIC-POL-API-06 | Require fixed settlement point, complete settled eligible distinct counterparties and self-comparison exclusion. Agreed and owed values are separate. Incomplete set or evaluator failure returns MFN_PROVISIONAL and cannot advance issuance. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| LIC-POL-API-01 | POLICY_BLOCKED, GRAMMAR_UNSUPPORTED, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign share or missing owner authority; 404 hides unknown share/work/policy. | Required 7 years; hash covers share, grammar, axes, overrides, exclusions, threshold and effective time. Replay returns policy version; mismatch returns IDEMPOTENCY_MISMATCH. | 60 policy writes/hour/owner; 10 concurrent/share. | Log operationId, requestId, share hash, grammar, state, axis classes, threshold bucket and version; no policy text or exact threshold. |
| LIC-POL-API-02 | NOT_AUTHORIZED, VALIDATION_FAILED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for non-standing author; 404 hides unknown work/side/block. | Required 7 years; hash covers work, side, category, party hashes, term and disclosure class. Replay returns block; mismatch returns IDEMPOTENCY_MISMATCH. | 30 blocks/hour/owner; 5 concurrent/work. | Log operationId, requestId, work/side/party hashes, category class, term bucket, state and version; no reason text or identity. |
| LIC-POL-API-03 | POLICY_BLOCKED, POLICY_EVALUATION_FAILED, CLEARANCE_UNKNOWN, CONSENT_REQUIRED, GRAMMAR_UNSUPPORTED, NOT_AUTHORIZED, DEPENDENCY_UNAVAILABLE. 403 for foreign request; 404 hides unknown work/snapshot/fold. | Required 24 hours; hash covers work, scope, share set, snapshot and read version. Replay returns fold; mismatch returns IDEMPOTENCY_MISMATCH. | 240 folds/hour/requester; 30 concurrent/work. | Log operationId, requestId, work/scope hashes, result class, owner-count bucket, binding-owner hash, budget class and latency; no policy threshold or owner name. |
| LIC-POL-API-04 | POLICY_BLOCKED, RATE_CARD_UNAVAILABLE, QUOTE_EXPIRED, CLEARANCE_UNKNOWN, CONSENT_REQUIRED, NOT_AUTHORIZED, VERSION_CONFLICT. 403 for foreign buyer/quote; 404 hides unknown fold/card/work. | Required through TTL plus 30 days; hash covers parties, scope, fold/card/read versions, deadline and TTL. Replay returns quote; mismatch returns IDEMPOTENCY_MISMATCH. | 120 quotes/hour/buyer; 20 concurrent/buyer. | Log operationId, requestId, quote/scope hashes, fold/card versions, state, amount-present flag, TTL bucket and latency; no amount or end-client name. |
| LIC-POL-API-05 | QUOTE_EXPIRED, NOT_AUTHORIZED, VALIDATION_FAILED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for a counterparty outside own share/mandate; 404 hides unknown quote/offer. | Required through quote expiry plus 7 years; hash covers quote, counterparty, amount class, terms hash, consent state and parent. Replay returns offer; mismatch returns IDEMPOTENCY_MISMATCH. | 300 offers/hour/counterparty; 40 concurrent/quote. | Log operationId, requestId, quote/counterparty hashes, sequence, state, amount bucket, consent class and TTL; no terms text. |
| LIC-POL-API-06 | MFN_PROVISIONAL, QUOTE_EXPIRED, POLICY_EVALUATION_FAILED, NOT_AUTHORIZED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign quote/evaluator scope; 404 hides unknown quote/offer set. | Required 7 years; hash covers quote, settlement point, settled offer IDs and eligible counterparty hashes. Replay returns evaluation; mismatch returns IDEMPOTENCY_MISMATCH. | 60 evaluations/hour/quote; 10 concurrent/quote. | Log operationId, requestId, quote hash, settlement bucket, set-size bucket, self-exclusion flag, provisional/final state and evaluator latency; no agreed or owed values. |

## Database Schema

### PostgreSQL Model Registry

PostgreSQL is the canonical owner for policy, block, fold, rate card, quote, negotiation and MFN state. Every field below includes type, nullability, constraints and foreign keys; indexes match scope and version predicates.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| licensing_policy_version | id uuid PK NOT NULL; share_id uuid NOT NULL FK rights.share; owner_id uuid NOT NULL FK identity.party; grammar_version text NOT NULL; defaults jsonb NOT NULL CHECK jsonb_typeof(defaults)='object'; work_override jsonb NULL CHECK work_override IS NULL OR jsonb_typeof(work_override)='object'; exclusions text[] NOT NULL; threshold_minor bigint NOT NULL CHECK threshold_minor>=0; trailing90_day_share_value_minor bigint NOT NULL CHECK trailing90_day_share_value_minor>=0; auto_approve_opt_in boolean NOT NULL; effective_from timestamptz NOT NULL; effective_to timestamptz NULL CHECK effective_to IS NULL OR effective_to>=effective_from; state text NOT NULL CHECK state IN ('draft','active','superseded','ended_on_transfer'); supersedes_id uuid NULL FK licensing.licensing_policy_version; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(share_id, version); (share_id, state, effective_from DESC); (owner_id, state); (grammar_version); (supersedes_id) | Owner reads/inserts own share policy; mandate administrator is constrained to declared owner scope; fold service reads active policies; buyer sees pass/block class only; direct client delete denied; anon no grant. |
| licensing_block | id uuid PK NOT NULL; author_id uuid NOT NULL FK identity.party; work_id uuid NOT NULL FK works.work; standing_side_id uuid NOT NULL FK rights.rights_side; category text NOT NULL; buyer_id uuid NULL FK identity.party; end_client_id uuid NULL FK identity.party; term_start timestamptz NOT NULL; term_end timestamptz NOT NULL CHECK term_end>term_start; reason_disclosure text NOT NULL; state text NOT NULL CHECK state IN ('active','lapsed','superseded'); supersedes_id uuid NULL FK licensing.licensing_block; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; CHECK ((buyer_id IS NULL) OR (end_client_id IS NOT NULL)) | (work_id, standing_side_id, state, term_start, term_end); (buyer_id, state, term_end); (end_client_id, state, term_end); (category, state); (supersedes_id) | Standing owner reads own blocks; fold and quote services read active blocks; buyer receives POLICY_BLOCKED only; operators require assigned scope; direct update/delete denied; anon no grant. |
| policy_fold_result | id uuid PK NOT NULL; request_id uuid NOT NULL FK licensing.clearance_snapshot; work_id uuid NOT NULL FK works.work; scope_hash text NOT NULL CHECK length(scope_hash)=64; owner_share_ids uuid[] NOT NULL CHECK cardinality(owner_share_ids)>0; owner_results jsonb NOT NULL CHECK jsonb_typeof(owner_results)='array'; verdict text NOT NULL CHECK verdict IN ('pass','blocked','human_review'); binding_owner_id uuid NULL FK identity.party; threshold_results jsonb NOT NULL CHECK jsonb_typeof(threshold_results)='object'; policy_read_version bigint NOT NULL CHECK policy_read_version>0; budget_ms integer NOT NULL CHECK budget_ms BETWEEN 1 AND 5000; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(request_id, scope_hash, policy_read_version); (work_id, scope_hash, created_at DESC); (verdict, created_at DESC); (binding_owner_id); | Buyer reads own fold verdict; owner reads own attributed result; fold service inserts; quote and issuance services read; no direct mutation/delete; anon no grant. |
| rate_card_version | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; share_ids uuid[] NOT NULL CHECK cardinality(share_ids)>0; scope_rules jsonb NOT NULL CHECK jsonb_typeof(scope_rules)='object'; amount_minor bigint NOT NULL CHECK amount_minor>=0; currency char(3) NOT NULL CHECK currency ~ '^[A-Z]{3}$'; effective_from timestamptz NOT NULL; effective_to timestamptz NULL CHECK effective_to IS NULL OR effective_to>=effective_from; state text NOT NULL CHECK state IN ('draft','active','superseded','expired'); supersedes_id uuid NULL FK licensing.rate_card_version; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(owner_id, version); (owner_id, state, effective_from DESC); (state, effective_to); GIN(share_ids); (supersedes_id) | Owners read and append their rates; operator may curate assigned rate cards; quote service reads active covering card; buyer sees final amount only when authorized; direct delete denied; anon no grant. |
| licence_quote | id uuid PK NOT NULL; buyer_id uuid NOT NULL FK identity.party; end_client_id uuid NOT NULL FK identity.party; scope jsonb NOT NULL CHECK jsonb_typeof(scope)='object'; scope_hash text NOT NULL CHECK length(scope_hash)=64; policy_fold_id uuid NOT NULL FK licensing.policy_fold_result; rate_card_version_id uuid NOT NULL FK licensing.rate_card_version; policy_read_version bigint NOT NULL CHECK policy_read_version>0; amount_minor bigint NULL CHECK amount_minor IS NULL OR amount_minor>=0; currency char(3) NULL CHECK currency IS NULL OR currency ~ '^[A-Z]{3}$'; deadline timestamptz NOT NULL; issued_at timestamptz NOT NULL; expires_at timestamptz NOT NULL CHECK expires_at>issued_at; state text NOT NULL CHECK state IN ('complete','partial','pending','expired','withdrawn'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(buyer_id, scope_hash, policy_fold_id, rate_card_version_id, version); (buyer_id, state, expires_at); (end_client_id, state); (policy_fold_id); (expires_at, state) | Buyer reads own quote; named owners read their share projection; quote service inserts and withdraws on block; negotiation service reads live TTL; direct price update/delete denied; anon no grant. |
| negotiation_offer | id uuid PK NOT NULL; quote_id uuid NOT NULL FK licensing.licence_quote; counterparty_id uuid NOT NULL FK identity.party; parent_offer_id uuid NULL FK licensing.negotiation_offer; amount_minor bigint NOT NULL CHECK amount_minor>=0; currency char(3) NOT NULL CHECK currency ~ '^[A-Z]{3}$'; terms_hash text NOT NULL CHECK length(terms_hash)=64; consent_state text NOT NULL CHECK consent_state IN ('pending','approved','declined','countered'); sequence_no integer NOT NULL CHECK sequence_no>0; state text NOT NULL CHECK state IN ('open','countered','accepted','withdrawn','expired'); expires_at timestamptz NOT NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(quote_id, sequence_no); (quote_id, state, expires_at); (counterparty_id, state); (parent_offer_id); | Counterparty reads/appends own offers; buyer reads their negotiation; quote service withdraws on block; MFN service reads settled offers; no direct update/delete; exact terms remain private. |
| mfn_evaluation | id uuid PK NOT NULL; quote_id uuid NOT NULL FK licensing.licence_quote; settlement_point timestamptz NOT NULL; settled_offer_ids uuid[] NOT NULL CHECK cardinality(settled_offer_ids)>0; eligible_counterparty_ids uuid[] NOT NULL CHECK cardinality(eligible_counterparty_ids)>0; agreed_amount_minor bigint NULL CHECK agreed_amount_minor IS NULL OR agreed_amount_minor>=0; owed_amount_minor bigint NULL CHECK owed_amount_minor IS NULL OR owed_amount_minor>=0; state text NOT NULL CHECK state IN ('final','provisional'); evaluator_version text NOT NULL; expected_offer_version bigint NOT NULL CHECK expected_offer_version>0; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(quote_id, settlement_point, expected_offer_version); (quote_id, state, settlement_point DESC); (state, created_at DESC); GIN(settled_offer_ids) | MFN service inserts immutable evaluations; buyer and owner views expose state only unless finance purpose grant; issuance reads final eligible result; direct update/delete denied; anon no grant. |

### State, Concurrency and Transaction Rules

- Policy versions are share-scoped and append-only. A transfer closes the old lifecycle and cannot transfer authority. A grammar value not explicitly adopted is outside coverage. Refusals and exclusions are absolute.
- Block creation locks the standing side and current in-flight aggregates. A new block withdraws affected quote and consent records in one transaction, while issued instruments remain untouched. Lapsed and superseded blocks remain queryable history.
- Policy fold sorts owners by stable share ID but computes the same result independent of input order. It applies refusal, eligibility, per-owner threshold using that owner’s share value and trailing 90-day approvals, then human fall-through and pricing. Budget or evaluator failure returns human_review.
- Auto-approve requires every owner policy to opt in, live-principal checks, non-exclusive scope and no MFN, dispute or self-dealing conflict. Silence or an absent policy cannot pass.
- Quote creation reads a passed fold and covering rate card, pins every version and sets server expires_at. A block or clearance change withdraws affected in-flight quote; expired quote cannot be extended.
- Negotiation offers are append-only sequence numbers with compare-and-swap on quote version. Consent is a separate state machine; partial approval or accepted money alone cannot create a settled set.
- MFN locks the quote and settled-offer manifest at settlement_point, excludes self-comparison and writes agreed and owed values independently. Incomplete or evaluator failure is provisional and blocks issuance.

### Grants, RLS and Retention

- RLS scopes policy and block writes to owner, standing side or declared mandate. Buyer reads only their fold, quote and negotiation; owners read their attributed share result. Finance receives amount values only under purpose grant.
- Policy thresholds, owner identity, negotiation terms, exact amounts and blocker reasons are excluded from public events and ordinary logs. Event payloads use hashes and state classes.
- Policy, block, quote, offer, MFN, audit and idempotency history retain 7 years or legal hold, whichever is longer. Supersession and withdrawal never hard-delete history.
- Service principals have named RPC grants for fold, quote, expiry, block withdrawal, MFN and outbox. No wildcard table or storage grant exists.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Share owner or administrator | Write/read own share policy, rate card and attributed fold result. | Another share policy, work-wide authority, consent or issued-instrument mutation. |
| Co-owner | Create block on a standing own side and read own effect. | Foreign side, issued licence revocation or arbitrary buyer block. |
| Professional buyer | Request own fold, quote and negotiation; read safe quote state. | Owner thresholds, blocker identity, private terms or foreign buyer state. |
| Buyer representative | Act inside named mandate with licensee and end client fixed. | Inferred affiliate, undisclosed end client or scope expansion. |
| Rights/licensing operator | Run assigned fold, quote, expiry and adapter jobs. | Grant owner consent, bypass blocks, enable multi-payee or change history. |
| Finance operator | Read purpose-authorized amount and MFN owed value for reconciliation. | Policy edit, raw private offer terms or instrument issue. |
| Service principal | Purpose-limited evaluation, withdrawal, expiry and outbox work. | Interactive authority, wildcard access or approval by silence. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| LIC-POL-API-01 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(policyWrite) → parseZod(ConfigurePolicyRequest) → idempotency(7y) → authorizeOwnShare → supportedGrammarAdoptionGuard → transferStateGuard → policyAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-POL-API-02 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(blockWrite) → parseZod(CreateLicensingBlockRequest) → idempotency(7y) → authorizeStandingSide → blockScopeGuard → termGuard → activeInFlightWithdrawalTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-POL-API-03 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(policyFold) → parseZod(EvaluatePolicyFoldRequest) → idempotency(24h) → authorizeEvaluationScope → freshClearanceGuard → deterministicOwnerSort → refusalEligibilityThresholdGuard → humanFallThroughGuard → policyFoldTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |
| LIC-POL-API-04 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(quoteCreate) → parseZod(CreateQuoteRequest) → idempotency(quoteTtlPlus30d) → authorizeBuyerScope → foldPassGuard → rateCardCoverageGuard → pinVersionGuard → quoteTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-POL-API-05 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(negotiationOffer) → parseZod(RecordNegotiationOfferRequest) → idempotency(quoteExpiryPlus7y) → authorizeCounterpartyScope → liveQuoteTtlGuard → immutableOfferCAS → separateConsentGuard → offerAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| LIC-POL-API-06 | requestId → strictCors(licensingOrigins) → requireAuth → resolveActingContext → rateLimit(mfnEvaluation) → parseZod(EvaluateMFNRequest) → idempotency(7y) → authorizeQuoteScope → fixedSettlementPointGuard → completeSettledSetGuard → selfComparisonExclusion → mfnEvaluationTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → audit. |

### Security and Privacy Controls

- Strict Zod 4 parsing rejects extra keys, incomplete axes, unsupported grammar, wildcard counterparties and negative amounts. Scope and terms are canonicalized before hashing.
- CORS permits only licensing origins and credentials with CSRF protection for mutations. Quote and offer responses are private and never cached publicly.
- 403 means an authenticated actor lacks authority over a known share, side, quote or offer. 404 hides unknown or out-of-scope resources. Error details contain stable code and requestId, not policy or owner data.
- No policy endpoint accepts a work-wide owner claim. AI training remains refused until explicit axis adoption; exclusivity cannot pass auto-approve. New grammar values remain inert.
- Logs use keyed identifiers, amount-presence and threshold buckets. Public events omit exact thresholds, exact prices, negotiation text, blocker reason and owner identity.

## Data Flow

1. LIC-POL-API-01 verifies share ownership, grammar adoption and transfer state, appends a versioned policy and emits licensing.policy.changed.v1.
2. LIC-POL-API-02 verifies standing on a rights side, appends a scoped block and atomically withdraws affected in-flight quote and consent state, emitting licensing.block.changed.v1.
3. LIC-POL-API-03 loads 20b clearance and Shard 10 shares, sorts owners deterministically and writes attributed policy_fold_result. It never defaults evaluation failure to pass.
4. LIC-POL-API-04 reads a passed fold and covering rate card, pins versions and writes quote with TTL, emitting licensing.quote.changed.v1. Consent remains a separate 20b state.
5. LIC-POL-API-05 appends money asks and counters within live TTL. LIC-POL-API-06 evaluates a complete settled set at one fixed point; provisional results stop issuance.
6. 20d consumes final quote, consent and MFN state only as protected issuance inputs. This companion never creates consideration commitments or instruments.

## Events and Consumer Contracts

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| licensing.policy.changed.v1 | LIC-POL-API-01 | shareId hash, policy version, grammar version, lifecycle state and version; fold and gate consume it. Excludes thresholds, owner identity and policy values. |
| licensing.block.changed.v1 | LIC-POL-API-02 | work hash, side hash, category class, block state and version; quote withdrawal and gate consume it. Excludes buyer/end-client identity and reason text. |
| licensing.quote.changed.v1 | LIC-POL-API-04 and LIC-POL-API-05 | quoteId, scope hash, state, TTL bucket, policy/card version and version; buyer and owners consume it. Excludes amount, terms, consent text and private party data. |

Events are transactional-outbox records keyed by event ID and aggregate version. Consumers may invalidate stale policy or quote projections but cannot approve, widen scope or rewrite issued instruments.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| LIC-POL-API-01 | Foreign share, transfer, unsupported grammar, stale version or settings outage | Return NOT_AUTHORIZED, GRAMMAR_UNSUPPORTED, VERSION_CONFLICT or DEPENDENCY_UNAVAILABLE before mutation; preserve prior policy and retry with same key. |
| LIC-POL-API-02 | Missing standing, invalid scope, term race or block withdrawal outage | Return NOT_AUTHORIZED or VALIDATION_FAILED; do not affect issued instruments. Retry withdrawal and outbox idempotently; retain lapsed/superseded history. |
| LIC-POL-API-03 | Missing clearance/policy, evaluator failure or budget excess | Return CLEARANCE_UNKNOWN, POLICY_EVALUATION_FAILED or human_review; never pass by silence, input order or timeout. Recompute fresh with same key. |
| LIC-POL-API-04 | Fold refused, card uncovered, dependency outage or TTL race | Return POLICY_BLOCKED, RATE_CARD_UNAVAILABLE or QUOTE_EXPIRED; do not expose price on refusal and require a fresh quote after expiry. |
| LIC-POL-API-05 | Quote expired, block withdrawal, counterparty loss or duplicate sequence | Return QUOTE_EXPIRED, NOT_AUTHORIZED or VERSION_CONFLICT; preserve immutable offers and keep consent separate. |
| LIC-POL-API-06 | Incomplete set, self-comparison, evaluator outage or quote expiry | Return MFN_PROVISIONAL or QUOTE_EXPIRED; preserve agreed and owed as separate values and prevent issuance until final recomputation. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| LIC-POL-API-01 | Strict policy axes, grammar, threshold, transfer state and exact ApiError schema. | Own-share authority, AI-training refusal, exclusive auto-approve ban, CORS/rate and 403/404. | Version uniqueness, supersession, transfer close, RLS/grants and policy event. | Unsupported grammar, stale version, replay, outage and redacted threshold logs. |
| LIC-POL-API-02 | Standing side, category, party scope, ordered term and block state schema. | Co-owner standing, no issued rewrite, CORS/rate, private reason and existence hiding. | Block exclusion, in-flight withdrawal, supersession, RLS/grants and block event. | Concurrent block, lapsed term, quote withdrawal outage, replay and safe event payload. |
| LIC-POL-API-03 | Scope, owner set, fold order, budget and attributed result schema. | Determinism, no silent pass, self-dealing, refusal and blocker privacy. | Versioned fold, owner sort, threshold calculation, RLS and fresh-resolver integration. | Resolver outage, budget excess, input permutation, replay and latency/budget logs. |
| LIC-POL-API-04 | Fold/card/version pinning, TTL, amount and partial state schema. | Buyer mandate, policy-before-price, CORS/rate and no consent inference. | Quote uniqueness, TTL CAS, block withdrawal, RLS and quote event. | Card outage, policy change, expiry, replay and amount redaction. |
| LIC-POL-API-05 | Offer/counter sequence, currency, terms hash, consent state and TTL schema. | Counterparty ownership, separate consent, CORS/rate and private terms. | Append-only sequence, quote CAS, expiry, RLS and quote event. | Duplicate counter, block withdrawal, timeout, replay and safe logs. |
| LIC-POL-API-06 | Fixed settlement point, complete set, self exclusion and provisional result schema. | Evaluator scope, distinct counterparties, CORS/rate and finance purpose grant. | Settled manifest uniqueness, agreed/owed separation, RLS and immutable evaluation. | Evaluator failure, incomplete set, quote expiry, replay and provisional telemetry. |

### Test Levels and Acceptance Gates

- Unit: strict Zod 4 rejects extra keys, omitted axes, unsupported grammar, negative amounts, invalid TTL and duplicate party sets; every failure validates ApiError { code, message, requestId, details }.
- Integration: exercise BE00 context, Shard 10 ownership, 20b clearance/consent, settings/rate-card and outbox adapters with exact timeout and retry behavior.
- Database: verify RLS by owner, buyer, counterparty and finance purpose; enforce append-only versions, CAS, active-block conflicts, quote expiry and event monotonicity.
- Property: permute owner input order and assert identical fold; inject evaluator failure and assert human_review or MFN_PROVISIONAL; assert no exclusive or silent auto-approval.
- Acceptance gate: all six operation IDs have route, Zod contract, field, error/auth/idempotency/rate/observability, middleware, persistence and test rows; all seven assigned models and three events are literal-covered.

## Deepening Passes and Ambiguity Gate

### Micro Pass

- Missing grammar, omitted AI-training axis, unsupported value, transferred share, empty owner set, exclusive auto-approve, stale quote, self-comparison and partial settlement have explicit refusal or provisional state.
- Thresholds are per owner and per share, not a work-wide total. Price is computed only after policy fold and does not imply consent.

### Meso Pass

- Policy, block, fold, rate card, quote, offer and MFN are separate models. A block withdraws future/in-flight quote and consent but cannot alter issued instrument history.
- Money negotiation is independent from ConsentState. MFN evaluates only complete settled eligible counterparties at a fixed point; agreed and owed values cannot overwrite one another.

### Macro Pass

- Shard 10 owns shares and rights, 20b owns clearance and consent, 20a owns briefs and holds and 20d owns protected issuance. This companion publishes only policy, block and quote state classes.
- Failure, stale reads and budget limits always stop or fall through to human review. No downstream consumer can infer a licence from quote or MFN state.

## Ambiguity Gate

**PASS.** LIC-09 through LIC-14 each map to one authoritative route and complete operation-keyed matrices. Share scope, grammar adoption, transfer, refusal order, threshold ownership, auto-approve limits, block impact, quote pinning, separate consent, negotiation TTL, fixed MFN set and provisional recovery are deterministic. BE00 errors, CORS, RLS, event exclusions and 20d handoff are explicit.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored share policy, co-owner block, deterministic fold, pinned quote, immutable negotiation and fixed-point MFN backend contracts. | /write-be-spec |

## Dependency References

- **Consumes:** [Shard 00 Contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) for actor context, ApiError, settings, idempotency, audit and outbox; [Shard 10 Contracts](../ia/10-rights-ownership.md#contracts) for shares, ownership and transfers; 20b contracts for clearance and consent; 20a contracts for buyer briefs and holds.
- **Publishes:** licensing.policy.changed.v1, licensing.block.changed.v1 and licensing.quote.changed.v1 with hashed, audience-safe state metadata.
- **Sibling handoff:** 20d consumes passed policy fold, live quote, negotiation and final MFN state as issuance inputs and repeats fresh checks; no quote or evaluation here can issue an instrument.
- **Downstream:** Shard 21 and Shard 22 may consume quote or policy state only through their named contracts; thresholds, private terms and owner identity remain protected.
