# Digital Contributor Revenue — Backend Specification

## Split Group

Shard 28 digital licensing and commerce, split 28d. This companion owns contributor use-consent admission, per-asset contributor revenue accrual, period close statements and held-funds records for IA interactions 28.16–28.18. It does not own contributor parties, percentages or consented rights ledgers (Shard 10), product/entitlement/acquisition truth (Shard 27), cent rounding (Shard 18), external disbursement/career income (Shard 41), or refund/revocation decisions (28b).

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| 28.16 propose contributor splits/use | Consent-gated vendor submission command | Shard 10 owns the agreement/split version; this companion links each contributor's separate use consent and blocks publish when any required consent is refused. Split disagreement holds only unresolved money and never creates a second split ledger. |
| 28.17 accrue contributor revenue | Append-only per-asset accrual command | An eligible paid acquisition/download is the accrual unit; buyer/asset replay dedupes, bundle lines consume frozen member allocation evidence, and refund/chargeback/self-purchase follows a pinned reversal/exclusion rule. |
| 28.18 close contributor period | Frozen period statement command | Rate/split versions and accrual set freeze before close. Per-payee aggregates invoke Shard 18 RoundPayableAggregate exactly once; any reconciliation difference blocks close, and unresolved/departed shares become non-forfeitable held funds. |

BE00 inheritance is mandatory for every operation: authenticated acting context, request ID, strict Zod 4 parsing, idempotency receipts, audit/outbox, CORS, rate limits, forced RLS and ApiError { code, message, requestId, details }. Shard 10 remains the only contributor-share authority. This companion never silently re-allocates, re-rounds or forfeits contributor money.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Overview, Scope Reconciliation and Commerce Decisions, lines 7–39 | Domain-10 split authority, per-asset accrual, period statements, held funds and counsel/provider payout gate. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Interactions, lines 89–91 | Exact 28.16–28.18 preconditions, success outcomes and failure/recovery behavior. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Command Contracts and Cross-Domain Contracts, lines 95–117 | Propose contributor splits/use, AccrueDigitalRevenue, CloseContributorPeriod and Shard 10/18/41 ownership. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Data Models and Typed Field Registry, lines 119–151 | ContributorAccrual, HeldContributorFunds, exact decimal amount and retention/cardinality requirements. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Access Control and Accessibility, lines 153–189 | Vendor/contributor/finance visibility, pseudonymous retention, formula evidence and statement accessibility. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Event Schemas, lines 190–207 | digital_contributor.accrued.v1, digital_contributor.period_closed.v1 and digital_contributor.funds_held.v1. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Edge Cases and coverage matrix, lines 209–263 | Refusal, unresolved split, contributor departure/erasure, indivisible minor unit and exact period-close recovery. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Contributor Accrual, lines 48–55 | Shard 10 consent inputs, bundle allocation evidence, dedupe, reversal, period freeze and held-funds deadline. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Split and Accrual Boundary, lines 85–92 | Ownership split versus commerce allocation, forward-only amendments, closed statement immutability and explicit 100 percent confirmation. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Access Control and Race Resolution, lines 93–122 | Contributor privacy, finance dual control and split/close/refund race behavior. |
| [BE00](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Global contracts, middleware and deterministic protocol rules | Global ApiError, request identity, idempotency, audit/outbox, CORS, CAS and safe error behavior. |
| [IA Shard 10](../ia/10-rights-ownership.md#contracts) | Rights ledger and consent authority | Contributor parties, percentages, use consent and effective split versions are consumed, never duplicated. |
| [IA Shard 18](../ia/18-royalty-accounting.md#contracts) | RoundPayableAggregate and cent remainder authority | One exact largest-remainder pass at period close; Shard 18 owns tie key and residue policy. |
| [IA Shard 41](../ia/41-career-finance.md#contracts) | Income and payout ingestion | Closed amounts are handed off without re-allocation, re-rounding or reopening. |

## IA Source Map

### Assigned interactions

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| 28.16 Propose contributor splits/use | BE28D-DLC01 | Vendor submission references Shard-10 agreement and each contributor's separate use consent; refusal blocks publish while unresolved money remains scoped. |
| 28.17 Accrue contributor revenue | BE28D-DLC02 | Eligible acquisition/download creates one append-only per-asset accrual, dedupes buyer/asset, and reverses/excludes under pinned self-purchase/refund/chargeback rules. |
| 28.18 Close contributor period | BE28D-DLC03 | Frozen period/rate/split versions reconcile to the penny through one Shard-18 pass; agreed money is payable/held and unresolved/departed funds are never forfeited. |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
|---|---|---|
| ContributorAccrual | Owned append-only per-asset/payee accrual and reversal record | finance.contributor_accruals |
| HeldContributorFunds | Owned non-forfeitable held share and claim path | finance.held_contributor_funds |

### Event Schemas

| Exact Event Schemas type | Producer operation | Payload authority and privacy rule |
|---|---|---|
| digital_contributor.accrued.v1 | BE28D-DLC02 | Accrual, asset/period/rate/split/payee references and exact amount; no buyer identity or payment secret. |
| digital_contributor.period_closed.v1 | BE28D-DLC03 | Period, frozen rate/split versions, totals and gate state; statements are immutable after close. |
| digital_contributor.funds_held.v1 | BE28D-DLC03 | Held record, pseudonymous payee reference, amount/reason and claim path; no private identity/free text. |

## Endpoint Completeness Reconciliation

BE00 owns auth, global errors, idempotency, audit/outbox and CORS. Shard 10 owns contributor rights/splits and use consent. Shard 18 owns exact rounding. Shard 27 owns acquisitions/entitlements. Shard 41 consumes closed income. The three routes below are the only public routes for 28.16–28.18; no route edits a rights ledger, reopens a period or performs external disbursement.

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| 28.16 | Propose contributor splits/use | BE28D-DLC01 | Shard-10 split/agreement version and per-party use consent are linked; refusal blocks publish and no automatic share is assigned. |
| 28.17 | Accrue contributor revenue | BE28D-DLC02 | One deduped accrual per eligible asset/acquisition/payee with allocation evidence, reversal state and exact decimal amount. |
| 28.18 | Close contributor period | BE28D-DLC03 | Frozen statement reconciles exactly, invokes Shard 18 once, emits close/held events and preserves unresolved funds. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to exactly one operation ID.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| BE28D-DLC01 | POST | /api/v1/digital/commerce/contributor-use-proposals | 28.16 | Vendor submission authority; each named contributor may confirm only its own use/split row. | 202 ContributorUseProposalSuccess |
| BE28D-DLC02 | POST | /api/v1/digital/commerce/contributor-accruals | 28.17 | Revenue worker or authorized finance/vendor system for the acquisition and split version. | 201 ContributorAccrualSuccess |
| BE28D-DLC03 | POST | /api/v1/digital/commerce/contributor-periods/{periodId}/close | 28.18 | Finance dual-control actor or period-close worker with frozen rate/split authority. | 202 ContributorPeriodCloseSuccess |

### External Seams

| Seam | Exact request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting context and idempotency | {accessToken, actingContextId, operationId, aggregateId, idempotencyKey, requestHash} → {actorId, partyId, roles, receiptId, replay} | 400 ms | No external retry; transaction serialization retries twice at 50 ms and 150 ms. | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 10 rights/split authority | {agreementId, splitVersion, contributorPartyIds, useConsentRefs, operationId} → {agreementState, splitVersion, rowStates, useConsentStates, authorityVersion} | 800 ms | 2 retries at 150 ms and 450 ms on timeout/408/429/5xx; refusal is not retried. | Open after 4 failures in 60 s; half-open after 30 s; publish/accrual holds unresolved state. |
| Shard 27 acquisition/entitlement authority | {acquisitionId, entitlementId, assetId, buyerScope, allocationEvidenceRef, expectedVersion} → {eligible, paid, downloadState, allocationRef, buyerHash, version} | 700 ms | 2 retries at 100 ms and 300 ms on timeout/408/429/5xx; deny is not retried. | Open after 4 failures in 60 s; half-open after 20 s; accrual remains pending. |
| Shard 18 RoundPayableAggregate | {periodId, currency, aggregates:[{payeeKey, amountDecimal}], tieKeyRule:'party-id', roundingVersion} → {payablesMinor, residueMinor, aggregateTotalMinor, roundingVersion, resultHash} | 1,000 ms | 2 retries at 150 ms and 450 ms with same period key; no local rounding fallback. | Open after 3 failures in 60 s; half-open after 30 s; close remains blocked. |
| Shard 41 income/payout intake | {periodId, statementId, payeeAmountsMinor, currency, gateState, sourceHash} → {incomeEventIds, accepted, gateState, intakeVersion} | 900 ms | 2 retries at 200 ms and 600 ms on timeout/408/429/5xx; accepted close is not reopened. | Open after 4 failures in 60 s; half-open after 30 s; close stays recorded and handoff_pending. |

## Request/Response Contracts

All request schemas are strict Zod 4. UUIDs are canonical lowercase strings, dates are RFC 3339 UTC strings, amount decimals have at least nine fractional places where supplied, and Idempotency-Key is required on every mutation. Every failure is ErrorResponse containing BE00 ApiError { code, message, requestId, details }.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const Id = z.uuid();
const IsoDate = z.iso.datetime({ offset: true });
const Version = z.int().positive();
const Currency = z.string().regex(/^[A-Z]{3}$/);
const AmountDecimal = z.string().regex(/^(0|[1-9][0-9]*)(\.[0-9]{1,18})?$/);
const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  message: z.string().min(1).max(500),
  requestId: Id,
  details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.strictObject({ error: ApiError }).strict();

const ContributorRow = z.strictObject({
  contributorPartyId: Id,
  splitRowRef: Id,
  useConsentRef: Id.nullable(),
  useState: z.enum(["consented", "refused", "pending", "unreachable"]),
}).strict();

export const DlcD01Request = z.strictObject({
  operationId: z.literal("BE28D-DLC01"),
  submissionId: Id,
  vendorPartyId: Id,
  agreementId: Id,
  splitVersion: Version,
  contributorRows: z.array(ContributorRow).min(1).max(1000),
  expectedSubmissionVersion: Version,
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcD01Success = z.strictObject({
  operationId: z.literal("BE28D-DLC01"),
  proposalId: Id,
  state: z.enum(["consent_pending", "ready_for_publish", "publish_blocked"]),
  splitVersion: Version,
  consentedCount: z.int().nonnegative(),
  unresolvedCount: z.int().nonnegative(),
  requestId: Id,
}).strict();

export const DlcD02Request = z.strictObject({
  operationId: z.literal("BE28D-DLC02"),
  acquisitionId: Id,
  entitlementId: Id,
  assetId: Id,
  periodId: Id,
  splitVersion: Version,
  rateVersion: Version,
  allocationEvidenceRef: Id,
  sourceEventId: Id,
  basisAmount: AmountDecimal,
  currency: Currency,
  buyerAssetDedupKey: z.string().trim().min(16).max(160),
  disposition: z.enum(["eligible", "self_purchase", "refunded", "chargeback"]),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcD02Success = z.strictObject({
  operationId: z.literal("BE28D-DLC02"),
  accrualId: Id,
  state: z.enum(["accrued", "excluded", "reversal_pending", "duplicate"]),
  periodId: Id,
  amountScale: z.literal(9),
  version: Version,
  requestId: Id,
}).strict();

export const DlcD03Request = z.strictObject({
  operationId: z.literal("BE28D-DLC03"),
  periodId: Id,
  rateVersion: Version,
  splitVersions: z.array(Version).min(1).max(1000),
  accrualSetHash: z.string().regex(/^[a-f0-9]{64}$/),
  currency: Currency,
  payoutGateState: z.enum(["admitted", "held", "counsel_pending", "provider_pending"]),
  expectedPeriodVersion: Version,
  closeAt: IsoDate,
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcD03Success = z.strictObject({
  operationId: z.literal("BE28D-DLC03"),
  statementId: Id,
  periodId: Id,
  state: z.enum(["closed", "closed_with_holds", "handoff_pending", "blocked"]),
  totalDecimal: AmountDecimal,
  totalMinor: z.int().nonnegative(),
  heldCount: z.int().nonnegative(),
  roundingVersion: z.string().trim().min(1).max(128),
  version: Version,
  requestId: Id,
}).strict();
```

### Operation Contract Matrix

| Operation ID | Request contract | Success contract and invariant | Error response |
|---|---|---|---|
| BE28D-DLC01 | DlcD01Request strict body plus Idempotency-Key; Shard-10 agreement/version and per-party consent refs required. | DlcD01Success 202; refusal/pending blocks publish and no share is assigned by this companion. | ErrorResponse with ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28D-DLC02 | DlcD02Request strict body plus Idempotency-Key; acquisition, asset, allocation evidence, split/rate versions and disposition required. | DlcD02Success 201; exact decimal accrual is append-only and duplicate/excluded/reversal state is explicit. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28D-DLC03 | DlcD03Request strict body plus Idempotency-Key; frozen period versions, accrual hash, currency, gate and close time required. | DlcD03Success 202; statement total and Shard-18 rounding version are recorded; held/blocked state prevents premature payout. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429, 503. |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| BE28D-DLC01 | Vendor must control submission and Shard-10 agreement reference. Every contributor row is separate; use refusal or unresolved consent yields publish_blocked, and split disagreement holds only affected money. |
| BE28D-DLC02 | Shard 27 must verify paid eligible acquisition/download and allocation evidence. Buyer/asset dedup key is unique; self_purchase excludes accrual, refund/chargeback appends reversal under the pinned rule, and no bundle re-apportionment occurs. |
| BE28D-DLC03 | Period, rate and split versions plus accrual hash freeze under lock. Amounts reconcile before the one Shard-18 per-payee aggregate pass; a non-zero difference blocks close and cannot become platform float. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| BE28D-DLC01 | SPLIT_VERSION_UNAUTHORIZED, USE_CONSENT_REQUIRED, SUBMISSION_NOT_FOUND, PROPOSAL_VERSION_CONFLICT, FORBIDDEN, DEPENDENCY_UNAVAILABLE; hidden submission returns 404, visible submission without vendor authority returns 403. | Required 7 years; hash covers submission, agreement, split version, ordered contributor rows and expected version. Replay returns proposal state. | 30 proposals per vendor per hour, burst 5. | proposal state, consent pending/refused, publish block and version conflict metrics; log refs/hashes, no party identity or private terms. |
| BE28D-DLC02 | ACQUISITION_INELIGIBLE, ALLOCATION_EVIDENCE_MISSING, ACCRUAL_DUPLICATE, SPLIT_VERSION_STALE, FORBIDDEN, ENTITLEMENT_NOT_FOUND, DEPENDENCY_UNAVAILABLE; hidden acquisition returns 404, visible acquisition without worker scope returns 403. | Required 7 years; hash covers acquisition, asset, period, versions, basis, disposition and dedup key. Replay returns accrual state. | 10,000 events per revenue partition per minute, burst 1,000. | accrual/exclusion/reversal/duplicate totals, allocation evidence lag and latency; log asset/acquisition hashes and amount buckets. |
| BE28D-DLC03 | PERIOD_ALREADY_CLOSED, ACCRUAL_SET_CHANGED, RECONCILIATION_DIFFERENCE, ROUNDING_UNAVAILABLE, PAYOUT_GATE_BLOCKED, FORBIDDEN, PERIOD_NOT_FOUND, DEPENDENCY_UNAVAILABLE; hidden period returns 404, visible period without finance dual control returns 403. | Required 7 years; hash covers period, versions, accrualSetHash, currency, gate and closeAt. Replay returns immutable statement. | 12 close attempts per period per day, burst 2. | close state, reconciliation difference, hold count, rounding latency, handoff lag and gate state; no exact private payee amounts in broad logs. |

## Database Schema

### PostgreSQL Model Registry

All tables use protected schemas, enabled and forced RLS, service/RPC writes only, append-only revisions and same-transaction audit/outbox. Contributor amount decimals use numeric precision and at least nine fractional places; they are never stored as floating point.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| ContributorAccrual | id uuid PK NOT NULL; acquisition_id uuid NOT NULL FK commerce.acquisitions(id); entitlement_id uuid NOT NULL FK catalog.entitlements(id); asset_id uuid NOT NULL FK catalog.digital_assets(id); period_id uuid NOT NULL FK finance.contributor_periods(id); split_version bigint NOT NULL CHECK >0; rate_version bigint NOT NULL CHECK >0; allocation_evidence_ref uuid NOT NULL; source_event_id uuid NOT NULL; gross_basis numeric(30,9) NOT NULL CHECK >=0; net_basis numeric(30,9) NOT NULL CHECK >=0; rate numeric(18,9) NOT NULL CHECK >=0; payee_party_id uuid NOT NULL FK identity.parties(id); amount numeric(30,9) NOT NULL CHECK >=0; currency char(3) NOT NULL CHECK currency~'^[A-Z]{3}$'; disposition text NOT NULL CHECK disposition in ('eligible','self_purchase','refunded','chargeback'); state text NOT NULL CHECK state in ('accrued','excluded','reversal_pending','reversed','duplicate'); reversal_of uuid NULL FK finance.contributor_accruals(id); buyer_asset_dedup_hash char(64) NOT NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; unique (acquisition_id,asset_id,payee_party_id,split_version,version); unique (buyer_asset_dedup_hash,payee_party_id,period_id) | acquisition_id,asset_id; period_id,payee_party_id,state; asset_id,created_at desc; allocation_evidence_ref; state,created_at | Finance/revenue worker writes through RPC; contributor reads own rows; vendor sees aggregate only; buyer never sees payee rows; forced RLS, no direct client grant, no update/delete. |
| HeldContributorFunds | id uuid PK NOT NULL; payee_party_id uuid NOT NULL FK identity.parties(id); split_ref uuid NOT NULL; source_accrual_ids uuid[] NOT NULL CHECK cardinality(source_accrual_ids)>0; amount numeric(30,9) NOT NULL CHECK amount>0; currency char(3) NOT NULL CHECK currency~'^[A-Z]{3}$'; reason text NOT NULL CHECK reason in ('unresolved_split','departed_contributor','erasure_retention','payout_gate'); claim_path text NOT NULL CHECK length(claim_path) between 1 and 500; state text NOT NULL CHECK state in ('held','claimable','claimed','reconciled'); held_at timestamptz NOT NULL; claim_deadline timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; unique (payee_party_id,split_ref,reason,state) | payee_party_id,state; split_ref; state,held_at; claim_deadline; source_accrual_ids gin | Contributor reads own claim path/amount; finance dual control writes; vendor sees no payee identity; forced RLS, append-only, no timeout forfeiture. |
| contributor_use_projection | id uuid PK NOT NULL; submission_id uuid NOT NULL FK commerce.submissions(id); vendor_party_id uuid NOT NULL FK identity.parties(id); agreement_id uuid NOT NULL FK rights.agreements(id); split_version bigint NOT NULL CHECK >0; contributor_party_id uuid NOT NULL FK identity.parties(id); split_row_ref uuid NOT NULL; use_consent_ref uuid NULL; use_state text NOT NULL CHECK use_state in ('consented','refused','pending','unreachable'); state text NOT NULL CHECK state in ('consent_pending','ready_for_publish','publish_blocked'); version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; unique (submission_id,split_version,contributor_party_id) | submission_id,state; agreement_id,split_version; contributor_party_id,use_state; vendor_party_id,created_at desc | Vendor reads own safe state; contributor reads own row; Shard-10 resolver is authority; no direct client write, forced RLS. |

### State, Concurrency and Transaction Rules

- contributor_use_projection mirrors Shard-10 agreement/split and consent state. A contributor's use refusal blocks publish; split disagreement does not rewrite the split and holds only unresolved money. A single contributor must explicitly confirm 100 percent in Shard 10; this route never defaults it.
- ContributorAccrual is append-only and keyed by buyer/asset/acquisition/payee evidence. Re-download returns duplicate; self-purchase is excluded; refund/chargeback appends a reversal linked to the original accrual. Bundle lines cite the frozen PromotionAllocation member share and never recompute it.
- Period close locks period, rate versions, split versions and accrualSetHash. It verifies exact decimal reconciliation, invokes Shard 18 RoundPayableAggregate once per prescribed per-payee aggregate, then persists immutable payable/held outcomes. Any non-zero difference blocks the close.
- Unresolved or departed contributor shares become HeldContributorFunds after the configured deadline (source default 30 days). Departure/erasure does not forfeit or redistribute the amount; pseudonymous retention preserves a claim path.
- External disbursement requires the admitted counsel/provider payout gate. Shard 41 receives closed income facts and never re-allocates, re-rounds or reopens a statement. Provider unknown leaves handoff_pending.
- Same idempotency key/request hash replays the original result. Serialization/deadlock retries twice at 50/150 ms; worker crash resumes from audit/outbox and provider receipts without duplicate accrual or rounding.

### Grants, RLS and Retention

- authenticated and anon roles have no direct table grants. Security-invoker RPCs recheck vendor submission authority, contributor self-row, Shard-10 version, acquisition eligibility, period lock, finance dual control and payout gate.
- Contributors see own accrual and held-funds rows plus reconciliation totals; vendors see aggregate revenue/consent state without payee identity; finance sees minimum rows needed for reconciliation; public clients see no contributor money.
- Accrual, close, event and held-funds records survive contributor departure/erasure under lawful pseudonymous retention. Closed statements and source accruals cannot be deleted or rewritten.
- Support can replay mechanical reconciliation with a purpose-bound grant but cannot alter split percentages, consent, amounts, rounding result, close state or claim path.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
|---|---|---|---|
| BE28D-DLC01 | Vendor submission controller; contributor for own confirmation; support case-bound | Vendor controls submission; contributor confirms only its own linked Shard-10 row; no percentage mutation. | Hidden submission returns 404 SUBMISSION_NOT_FOUND; visible submission without vendor/contributor scope returns 403 USE_PROPOSAL_FORBIDDEN. |
| BE28D-DLC02 | Revenue worker, finance worker, authorized vendor system | Acquisition, asset, entitlement and allocation evidence must be in worker partition; payee rows derive from Shard 10. | Hidden acquisition/entitlement returns 404 ACQUISITION_NOT_FOUND; visible source without worker scope returns 403 ACCRUAL_FORBIDDEN. |
| BE28D-DLC03 | Finance dual-control actor; period-close worker; Shard 41 intake worker | Period lock and frozen version set are finance-scoped; no actor can reopen or alter a closed statement. | Hidden period returns 404 PERIOD_NOT_FOUND; visible period without close grant returns 403 PERIOD_CLOSE_FORBIDDEN. |

### Per-Operation Middleware Registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
|---|---|---|---|
| BE28D-DLC01 | requestId → strictCors → auth → vendor/contributor context → rate limit → idempotency → strict body validation → Shard-10 consent/version gate → handler/audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 256 KiB body, party/ref bounds, no split mutation, BE00 ApiError { code, message, requestId, details }, no private consent logs. |
| BE28D-DLC02 | requestId → strictCors → worker auth → acquisition partition → rate limit → idempotency → strict body validation → Shard-27 eligibility gate → dedupe CAS → handler/audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | 256 KiB body, source-event and allocation evidence validation, buyer identity hashing, no vendor payee leakage, BE00 ApiError { code, message, requestId, details }. |
| BE28D-DLC03 | requestId → strictCors → finance dual control → period lock → rate limit → idempotency → strict body validation → accrual-set hash gate → Shard-18 rounding → payout gate → audit/outbox | CORS policy digital-commerce: explicit finance origins; no wildcard credentials; Vary: Origin | CSRF, 256 KiB body, no close without exact reconciliation, no local rounding, BE00 ApiError { code, message, requestId, details }. |

### Security and Privacy Controls

Credentialed mutations use CSRF protection, explicit origin allowlisting, secure headers, body-size/content-type limits and redacted structured logs. Payee identity and exact private amounts are purpose-limited. Buyer identity is hashed into dedupe evidence. No vendor or public response exposes contributor identity, private consent narrative, payment secrets or claim details outside authorized scope.

## Data Flow

1. BE28D-DLC01 resolves the Shard-10 agreement/split version and contributor consent rows, persists a bounded projection and returns ready_for_publish or publish_blocked.
2. BE28D-DLC02 verifies Shard-27 acquisition/download and frozen allocation evidence, derives payees from Shard-10, appends exact decimal ContributorAccrual rows and emits digital_contributor.accrued.v1. Replays and disposition changes append history.
3. BE28D-DLC03 freezes the period, reconciles accruals, invokes Shard 18 once, records payable/held outcomes and emits close/funds events. Shard 41 receives closed facts only after the configured gate.

## Events and Consumer Contracts

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
|---|---|---|---|
| digital_contributor.accrued.v1 | BE28D-DLC02 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, accrualId, acquisitionId, assetId, periodId, rateVersion, splitVersion, payeeRef, amountDecimal, currency, disposition, state} | Statements and finance ledger consume the source row; duplicate event refetches canonical accrual. |
| digital_contributor.period_closed.v1 | BE28D-DLC03 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, periodId, statementId, rateVersion, splitVersions, totalDecimal, totalMinor, gateState, roundingVersion} | Statements freeze; Shard 41 ingests without re-allocation, re-rounding or reopen. |
| digital_contributor.funds_held.v1 | BE28D-DLC03 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, heldFundsId, payeeRef, amountDecimal, currency, reason, claimPathRef} | Contributor claim projection and finance reconciliation update; payeeRef is purpose-scoped. |

Events contain IDs, versions, hashes, redacted payee refs and money values only. Transactional outbox dedupes by event ID and aggregate version. Missing events cause consumer refetch and never alter a closed statement.

## Error Handling and Failure Recovery

| Operation ID | Condition | HTTP | Error code | Recovery |
|---|---|---:|---|---|
| BE28D-DLC01 | Use consent refused/pending or split version inaccessible | 409 or 422 | USE_CONSENT_REQUIRED or SPLIT_VERSION_UNAUTHORIZED | Return publish_blocked; correct/confirm through Shard 10 and retry with a new version. |
| BE28D-DLC02 | Acquisition ineligible or allocation evidence missing | 422 | ACQUISITION_INELIGIBLE or ALLOCATION_EVIDENCE_MISSING | Do not accrue; refetch Shard 27 and preserve source event. |
| BE28D-DLC02 | Buyer/asset replay or refund/chargeback | 200 or 202 | ACCRUAL_DUPLICATE or REVERSAL_PENDING | Return original accrual or append linked reversal; never duplicate or erase. |
| BE28D-DLC03 | Accrual set changed or reconciliation differs | 409 | ACCRUAL_SET_CHANGED or RECONCILIATION_DIFFERENCE | Keep period open/blocked, refetch exact set and investigate; never absorb residue. |
| BE28D-DLC03 | Shard 18 or payout gate unavailable | 409 or 503 | ROUNDING_UNAVAILABLE or PAYOUT_GATE_BLOCKED | Preserve frozen period; retry same key when dependency/gate returns. |
| All | Idempotency hash mismatch | 409 | IDEMPOTENCY_KEY_CONFLICT | Use original key/result or a new key after intent changes. |
| All | Rate/dependency circuit open | 429 or 503 | RATE_LIMITED or DEPENDENCY_UNAVAILABLE | Honor Retry-After/backoff; no partial mutation. |

## Verification and Test Strategy

### Operation Test Matrix

| Test ID | Operation ID | Acceptance assertion |
|---|---|---|
| BE28D-CON-001 | BE28D-DLC01 | Strict proposal contract links Shard-10 agreement/version and independent contributor use consent; refusal/pending blocks publish. |
| BE28D-CON-002 | BE28D-DLC02 | Eligible acquisition, frozen allocation evidence, exact decimal amount, disposition, dedupe and reversal state parse exactly. |
| BE28D-CON-003 | BE28D-DLC03 | Frozen period, exact reconciliation, one Shard-18 rounding result, gate state, statement totals and held count parse exactly. |
| BE28D-ROUTE-001 | BE28D-DLC01 through BE28D-DLC03 | Method/path/operation registry is authoritative; aliases cannot bypass middleware. |
| BE28D-AUTH-001 | BE28D-DLC01 through BE28D-DLC03 | Hidden objects return 404, visible objects without role/scope return 403, and contributor/payee privacy is preserved. |
| BE28D-MW-001 | BE28D-DLC01 through BE28D-DLC03 | CORS, CSRF, auth, rate, validation, BE00 ApiError, Shard-10 gate and safe headers run per operation. |
| BE28D-DB-001 | BE28D-DLC01 through BE28D-DLC03 | Typed fields, constraints, indexes, forced RLS, grants, append-only accruals/holds and audit/outbox are migration-tested. |
| BE28D-RACE-001 | BE28D-DLC01, BE28D-DLC02 | Consent update, acquisition replay, refund reversal and split-version race preserve one source result. |
| BE28D-RACE-002 | BE28D-DLC03 | Period close versus accrual, Shard-18 timeout, payout-gate failure and worker crash preserve frozen/blocked state. |
| BE28D-EVT-001 | BE28D-DLC01 through BE28D-DLC03 | Exact event names, payload redaction, outbox dedupe, Shard-41 intake and consumer refetch are verified. |

### Test Levels and Acceptance Gates

- Contract tests reject unknown keys, malformed IDs/dates, invalid decimal amounts, missing versions, duplicate member/payee inputs and unsupported dispositions before mutation.
- Route tests assert every method/path, explicit CORS policy, worker/party authorization, rate class, idempotency receipt and BE00 error envelope.
- Database tests verify foreign keys, exact decimal checks, unique dedupe keys, period locks, forced RLS, no direct client grants and immutable close/hold rows.
- Property tests generate duplicate acquisition events, disposition reversals, split consent states and period aggregates to verify no double accrual, no residue sink and deterministic replay.
- Integration tests simulate Shard-10 refusal, Shard-27 eligibility lag, bundle evidence, refund after accrual, Shard-18 outage, payout-gate hold, contributor departure and Shard-41 ingestion.
- Privacy tests verify buyer identity, contributor identity, exact payee amounts, free text and provider secrets remain purpose-scoped.

## Deepening Passes and Ambiguity Gate

### Micro Pass

| Question | Resolution |
|---|---|
| Can this route assign a default contributor share? | No. Shard 10 owns split percentages and explicit 100 percent confirmation. |
| Can use consent substitute for split consent? | No. Each contributor's use and share consent remain distinct; use refusal blocks publish. |
| Can a buyer/asset replay create another accrual? | No. Deduplication returns the original result; refund/chargeback appends a linked reversal. |
| Can period close absorb a rounding difference? | No. Shard 18 computes the exact prescribed result; any difference blocks close. |
| Can departure or erasure forfeit held money? | No. HeldContributorFunds is pseudonymized, non-forfeitable and claimable. |

### Macro Pass

| Boundary question | Resolution |
|---|---|
| Does this companion own rights percentages or consented ledgers? | No. Shard 10 is canonical; this companion consumes versions and consent state. |
| Does it own acquisition/entitlement truth? | No. Shard 27 verifies eligibility and evidence. |
| Does it own cent rounding or residue policy? | No. Shard 18 RoundPayableAggregate is invoked once; no local fallback exists. |
| Does period close perform external payout? | No. Payout remains behind the configured counsel/provider gate; Shard 41 ingests closed facts only. |
| Can a closed statement be reopened silently? | No. Corrections are additive in a later period with an original reference. |

## Ambiguity Gate

PASS. Evidence: interactions 28.16–28.18 map one-to-one to BE28D-DLC01–DLC03 and three unique routes; ContributorAccrual and HeldContributorFunds are explicitly owned; exact digital_contributor.accrued.v1, digital_contributor.period_closed.v1 and digital_contributor.funds_held.v1 events are inventoried; strict Zod 4 request/success/error contracts, BE00 ApiError { code, message, requestId, details }, 403-vs-404, idempotency, rate, observability, CORS, typed persistence/RLS/grants, state/recovery rules and keyed tests exist for every operation. Shard 10 split/consent authority, Shard 27 eligibility, Shard 18 one-pass rounding, Shard 41 intake and counsel/provider payout boundaries are explicit. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- [BE00 platform contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas): request identity, strict Zod 4, ApiError, auth, CORS, idempotency, rate, audit/outbox and forced RLS.
- [IA Shard 10 contracts](../ia/10-rights-ownership.md#contracts): contributor parties, split percentages, use consent and effective versions consumed here.
- [IA Shard 27 contracts](../ia/27-digital-catalog-delivery.md#contracts): acquisition, entitlement, asset and paid-download eligibility consumed here.
- [IA Shard 18 contracts](../ia/18-royalty-accounting.md#contracts): RoundPayableAggregate and residue/tie-key policy invoked once at close.
- [IA Shard 41 contracts](../ia/41-career-finance.md#contracts): closed-period income handoff without re-allocation or reopen.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-28 | Initial production-grade companion for IA interactions 28.16–28.18; use-consent admission, exact per-asset accrual, period close, held funds, contracts, security, persistence, recovery and ambiguity evidence added. |
