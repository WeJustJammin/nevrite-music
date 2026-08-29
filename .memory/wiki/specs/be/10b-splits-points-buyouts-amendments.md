# Splits, Points, Buyouts and Ledger Amendments — Backend Specification

## Split Group

Shard 10 rights and ownership, split 10b. This companion owns split capture from a Shard 09 close moment, producer-point encumbrances, contribution-scoped work-for-hire or buyout designations and consented ledger amendments for RGT-05 through RGT-08. It does not own base work and recording objects, title events, conflict freezes, AI or NIL positions, identifier allocation or registration.

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| RGT-05 capture split at close | Debt-preserving capture command | Shard 09 supplies participants and claims, never percentages. Each designation is share, fee or present-not-party; empty or skipped remains first-class capture debt and never blocks session close. |
| RGT-06 record producer points | Consent-gated encumbrance command | Points require named base, exact rate, tier, term, payee and recoupment, stay at or below the tier ceiling and cannot coexist with a work-for-hire fee for the same contribution. |
| RGT-07 record work-for-hire or buyout | Contribution-scoped agreement command | Designation, consideration, beneficiary or explicit none and required consents are atomic. The platform never asserts legal effectiveness; credit, performer, neighbouring-right and NIL facts survive. |
| RGT-08 amend split or ledger | Versioned successor command | One open proposal at a time; later proposals queue with source snapshot and rebase. Every change resets consent, share decreases need exact affected-party acknowledgement and cross-ledger changes advance together or not at all. |

BE00 inheritance is mandatory for every operation: requestId, acting context, strict Zod 4 parsing, idempotency ledger, audit/outbox, CORS, rate limiting, RLS and ApiError { code, message, requestId, details }. Platform endpoints are not duplicated.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 10](../ia/10-rights-ownership.md) | Interactions, lines 66–77 | RGT-05 through RGT-08 preconditions, required behavior, completion and recovery. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Core Types and Errors, lines 100–111 | LedgerState, ConsentState, TrustLevel and standard refusal classes. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Agreements and Lifecycle, lines 125–134 | RecordPoints, RecordBuyout and ProposeAmendment invariants. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Data Models, lines 147–191 | split_capture, encumbrance, covenant, buyout_designation and ledger_amendment ownership and fields. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Access Control and Accessibility, lines 208–242 | Producer, owner, contributor, administrator, publisher, estate and review permissions. |
| [IA Shard 10](../ia/10-rights-ownership.md) | Event Schemas and Edge Cases, lines 243–306 | Ledger supersession, consent reset, split debt, point, buyout and amendment events and recovery. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Split, Points and Buyout Algorithm, lines 81–90 | Ternary designation, point ceiling, WFH fee exclusion, atomic buyout and legal-effect disclaimer. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Amendment and Transfer Algorithm, lines 92–103 | One-open queue, delta/impact manifest, consent reset, unreachable handling and cross-ledger atomic package. |
| [Deep Dive 10](../ia/deep-dives/10-rights-ownership.md) | Abuse and Recovery Verification, lines 137–148 | Forced split, contributor zeroing, attrition and unauthorized freeze safeguards. |
| [BE00](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Global request, error, middleware and deterministic protocol contracts | Exact ApiError, request IDs, idempotency, audit/outbox, CORS, CAS and fail-closed inheritance. |

## IA Source Map

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| RGT-05 Capture split at close | RGT-AGR-API-01 | Captures participants and ternary designation from Shard 09 without percentages; open or skipped designations become debt and do not reopen close. |
| RGT-06 Record producer points | RGT-AGR-API-02 | Records named base, exact rate, tier, term, payee and recoupment as an encumbrance; enforces tier ceiling and points/WFH fee mutual exclusion. |
| RGT-07 Record work-for-hire/buyout | RGT-AGR-API-03 | Atomically stores contribution designation, consideration, beneficiary or none and required consents; preserves non-ownership facts and legal disclaimer. |
| RGT-08 Amend split/ledger | RGT-AGR-API-04 | Validates standing, before/after delta and impact manifest, queues one later proposal, resets consent and leaves current version governing until unanimous required consent. |

## Endpoint Completeness Reconciliation

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| RGT-05 | Capture session-close split designations | RGT-AGR-API-01 | Immutable capture with source moment, ternary designations and debt state. |
| RGT-06 | Record consented producer points | RGT-AGR-API-02 | Encumbrance version with base/tier ceiling, payee, term and consent state. |
| RGT-07 | Record contribution buyout designation | RGT-AGR-API-03 | Atomic designation/consideration/consent record with effectiveness disclaimer. |
| RGT-08 | Propose successor ledger amendment | RGT-AGR-API-04 | Delta and impact manifest, one-open queue, consent reset and immutable successor. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to one operation ID.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| RGT-AGR-API-01 | POST | /api/v1/rights/split-captures | RGT-05 | Shard 09 close worker or actor with split-drafting authority for the work. | 201 CaptureSplitSuccess |
| RGT-AGR-API-02 | POST | /api/v1/rights/producer-points | RGT-06 | Master administrator or authorized actor for the recording and contribution. | 201 RecordPointsSuccess |
| RGT-AGR-API-03 | POST | /api/v1/rights/buyout-designations | RGT-07 | Payer or standing actor for the contribution with designee and payer consent scope. | 201 RecordBuyoutSuccess |
| RGT-AGR-API-04 | POST | /api/v1/rights/ledger-amendments | RGT-08 | Party with standing on a ledger-chain version and authority for the proposed delta. | 201 ProposeAmendmentSuccess |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting-context verifier | {accessToken, actingContextId, resourceId, requiredRole} → {actorId, partyId, roles, mandateVersion, contextVersion} | 300 ms | 2 retries at 50 ms and 150 ms before mutation | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 09 close/source resolver | {sessionId, workId, closeMomentId, participantRefs, claimRefs} → {closeVersion, participantSet, claimSet, actingContextVersion} | 700 ms | 2 retries at 100 ms and 300 ms with same moment key | Open after 4 failures in 30 s; capture remains retryable and never blocks close; half-open after 20 s. |
| Shard 01 agency and party resolver | {partyId, contributionId, agencyRef, requiredConsentRole} → {partyState, agencyVersion, agencyScope, consentAuthority} | 500 ms | 2 retries at 75 ms and 225 ms; stale authority rejected | Open after 4 failures in 30 s; return FORBIDDEN or DEPENDENCY_UNAVAILABLE; half-open after 20 s. |
| Shard 10 ledger and rights resolver | {ledgerId, objectId, currentVersion, deltaHash, rightType} → {ledgerState, rowSet, standing, consentState, latestVersion} | 700 ms | 2 retries at 100 ms and 300 ms using expected version | Open after 4 failures in 30 s; amendment or points remain uncommitted; half-open after 20 s. |
| Shard 07 credit evidence resolver | {workId, participantIds, contributionRefs} → {creditFacts, evidenceVersion, contributorStanding} | 600 ms | 2 retries at 100 ms and 300 ms; evidence does not grant ownership | Open after 4 failures in 30 s; capture may retain unresolved participant debt; half-open after 20 s. |
| Downstream impact manifest registry | {currentLedgerVersion, proposedVersion, affectedTypes} → {licences, registrations, accountingRuns, releases, manifestVersion} | 800 ms | 2 retries at 100 ms and 300 ms; no merge on failure | Open after 4 failures in 30 s; amendment stays draft/queued and current version governs; half-open after 20 s. |
| BE00 audit and outbox | {eventType, aggregateId, version, requestId} → {auditId, outboxId, acceptedAt} | 400 ms | 3 retries at 100 ms, 300 ms and 900 ms | Open after 5 failures in 30 s; canonical state commits with dispatch pending; half-open after 15 s. |

## Request/Response Contracts

All requests require Idempotency-Key and canonical body hashing. Exact rational values use integer numerator and positive denominator. Every failure uses ApiError { code, message, requestId, details }.

### Zod 4 Contract Definitions

```typescript
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const RationalSchema = z.strictObject({
  numerator: z.int().positive(),
  denominator: z.int().positive()
});
const DesignationSchema = z.enum(["share", "fee", "present-not-party"]);
const ApiErrorSchema = z.strictObject({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.uuid(),
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)
});

export const CaptureSplitRequest = z.strictObject({
  workId: z.uuid(),
  sourceSessionId: z.uuid().nullable(),
  closeMomentId: z.uuid(),
  participants: z.array(z.strictObject({
    participantId: z.uuid(),
    claimRef: z.string().min(1).max(128),
    designation: DesignationSchema
  })).min(1).max(500),
  expectedCloseVersion: z.int().positive()
});
export const CaptureSplitSuccess = z.strictObject({
  captureId: z.uuid(),
  debtState: z.enum(["none", "open"]),
  designationCount: z.int().positive(),
  requestId: z.uuid()
});

export const RecordPointsRequest = z.strictObject({
  recordingId: z.uuid(),
  contributionId: z.uuid(),
  baseKey: z.string().min(1).max(128),
  rate: RationalSchema,
  tier: z.string().min(1).max(64),
  term: z.string().min(1).max(500),
  payeeId: z.uuid(),
  recoupment: z.string().min(1).max(1000),
  workForHireFeePresent: z.boolean(),
  expectedRecordingVersion: z.int().positive()
});
export const RecordPointsSuccess = z.strictObject({
  encumbranceId: z.uuid(),
  state: z.enum(["pending_consent", "consented", "refused", "superseded"]),
  requestId: z.uuid()
});

export const RecordBuyoutRequest = z.strictObject({
  contributionId: z.uuid(),
  payerId: z.uuid(),
  designeeId: z.uuid(),
  beneficiaryId: z.uuid().nullable(),
  considerationRef: z.string().min(1).max(256),
  considerationMinor: z.int().nonnegative(),
  consentPartyIds: z.array(z.uuid()).min(1).max(10),
  payerWaiverEvidenceId: z.uuid().nullable(),
  disclaimerVersion: z.string().min(1).max(64)
});
export const RecordBuyoutSuccess = z.strictObject({
  designationId: z.uuid(),
  state: z.enum(["pending_consent", "consented", "refused", "superseded"]),
  legalEffect: z.literal("not_asserted"),
  requestId: z.uuid()
});

export const ProposeAmendmentRequest = z.strictObject({
  currentLedgerId: z.uuid(),
  currentLedgerVersion: z.int().positive(),
  proposedRows: z.array(z.strictObject({
    partyId: z.uuid(),
    rowKind: z.enum(["writer", "publisher", "master_owner", "encumbrance"]),
    numerator: z.int().positive(),
    denominator: z.int().positive(),
    exactDecreaseAcknowledged: z.boolean()
  })).min(1).max(1000),
  proposalKind: z.enum(["correction", "amendment", "cross-ledger"]),
  deltaHash: z.string().length(64),
  impactManifest: z.record(z.string().regex(/^[a-z][a-z0-9_.-]{0,63}$/), z.array(z.string().trim().min(1).max(256)).min(1).max(128)).max(64),
  standingPartyId: z.uuid(),
  queuedAfterId: z.uuid().nullable(),
  trueUpItemRef: z.string().max(128).nullable()
});
export const ProposeAmendmentSuccess = z.strictObject({
  amendmentId: z.uuid(),
  state: z.enum(["draft", "open", "queued", "blocked", "consented", "superseded"]),
  consentReset: z.literal(true),
  requestId: z.uuid()
});
export const RightsAgreementApiError = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| RGT-AGR-API-01 | CaptureSplitRequest with Idempotency-Key | CaptureSplitSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-AGR-API-02 | RecordPointsRequest with Idempotency-Key | RecordPointsSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-AGR-API-03 | RecordBuyoutRequest with Idempotency-Key | RecordBuyoutSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |
| RGT-AGR-API-04 | ProposeAmendmentRequest with Idempotency-Key | ProposeAmendmentSuccess / 201 | ApiError { code, message, requestId, details } / 400,401,403,404,409,422,429,503 |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| RGT-AGR-API-01 | Require close moment, readable work and participant claims. Each designation must be share, fee or present-not-party. No percentage field is accepted. Empty, skipped or open designation persists as debt and never blocks session close. |
| RGT-AGR-API-02 | Require recording authority, contribution, named base, positive reduced rate, tier, term, payee and recoupment. Reject a tier total above one and reject workForHireFeePresent when points apply to the same contribution. Points are an encumbrance, not an ownership row. |
| RGT-AGR-API-03 | Require contribution scope, payer, designee, explicit beneficiary or none, consideration and required consents. Approved engagement evidence may waive payer action only. Never assert legal effect; buyout does not erase credit, performer fact, neighbouring-right potential or NIL. |
| RGT-AGR-API-04 | Require standing on a ledger-chain version, one open proposal, exact before/after rows, delta and downstream impact manifest. A share decrease needs exact affected-party acknowledgement. Any amendment resets all consent; queued proposals rebase and never merge. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| RGT-AGR-API-01 | VALIDATION_FAILED, FORBIDDEN, ACTING_CONTEXT_STALE, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for actor without split authority; 404 hides unknown work/session/moment. | Required 7 years; hash covers work, source moment, participants, claims and designations. Replay returns capture; mismatch returns IDEMPOTENCY_MISMATCH. | 120 captures/hour/work; 20 concurrent/work. | Log operationId, requestId, work/moment hashes, participant count bucket, designation classes, debt state and version; no names or claims. |
| RGT-AGR-API-02 | VALIDATION_FAILED, FORBIDDEN, CONSENT_REQUIRED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign recording/contribution; 404 hides unknown recording/contribution. | Required 7 years; hash covers recording, contribution, base, rate, tier, term, payee and recoupment hashes. Replay returns encumbrance; mismatch returns IDEMPOTENCY_MISMATCH. | 60 points/hour/recording; 10 concurrent/recording. | Log operationId, requestId, recording/contribution hashes, tier, rate bucket, consent state and version; no payee name or exact rate. |
| RGT-AGR-API-03 | VALIDATION_FAILED, FORBIDDEN, CONSENT_REQUIRED, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for foreign contribution or payer/designee; 404 hides unknown contribution/designation. | Required 7 years; hash covers contribution, party hashes, consideration reference, value bucket, consent set and disclaimer. Replay returns designation; mismatch returns IDEMPOTENCY_MISMATCH. | 30 buyouts/hour/actor; 5 concurrent/contribution. | Log operationId, requestId, contribution/party hashes, consent count, legalEffect not_asserted and state; no consideration or identity. |
| RGT-AGR-API-04 | VALIDATION_FAILED, FORBIDDEN, LEDGER_UNBALANCED, TERRITORY_INCOMPLETE, CONSENT_STALE, VERSION_CONFLICT, DEPENDENCY_UNAVAILABLE. 403 for no standing; 404 hides unknown ledger/version. | Required 7 years; hash covers current version, ordered proposed rows, kind, delta, impact manifest and standing party. Replay returns amendment; mismatch returns IDEMPOTENCY_MISMATCH. | 30 amendments/hour/ledger; 5 concurrent/ledger. | Log operationId, requestId, ledger hash, proposal kind, row-count bucket, delta class, impact-count bucket, queue state and version; no exact shares or party names. |

## Database Schema

### PostgreSQL Model Registry

PostgreSQL owns these agreement and amendment records. All rational values are integer columns with positive denominators; field nullability, constraints, foreign keys, indexes and RLS are explicit.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| encumbrance | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; object_id uuid NOT NULL; kind text NOT NULL CHECK kind IN ('producer_points','master_encumbrance'); base_key text NOT NULL; tier text NOT NULL; rate_numerator bigint NOT NULL CHECK rate_numerator>0; rate_denominator bigint NOT NULL CHECK rate_denominator>0; payee_id uuid NOT NULL FK identity.party; term text NOT NULL; recoupment text NOT NULL; contribution_id uuid NOT NULL; evidence_hash text NOT NULL CHECK length(evidence_hash)=64; state text NOT NULL CHECK state IN ('pending_consent','consented','refused','superseded'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (object_id, kind, tier, state); (contribution_id, state); (payee_id, state); UNIQUE(object_id, base_key, tier, version); (state, updated_at) | Recording administrator inserts in own scope; consenting parties read own evidence; ledger and title workers read consented encumbrances; no direct update/delete; anon no grant. |
| covenant | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; object_id uuid NOT NULL; contribution_id uuid NOT NULL; payer_id uuid NOT NULL FK identity.party; designee_id uuid NOT NULL FK identity.party; beneficiary_id uuid NULL FK identity.party; covenant_kind text NOT NULL CHECK covenant_kind IN ('work_for_hire','buyout'); consideration_ref text NOT NULL; consideration_minor bigint NOT NULL CHECK consideration_minor>=0; disclaimer_version text NOT NULL; consent_set jsonb NOT NULL CHECK jsonb_typeof(consent_set)='array'; legal_effect_state text NOT NULL CHECK legal_effect_state='not_asserted'; state text NOT NULL CHECK state IN ('pending_consent','consented','refused','superseded'); version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | (contribution_id, state, created_at DESC); (payer_id, state); (designee_id, state); (beneficiary_id); (consideration_ref); | Payer/designee read own covenant; agreement service writes after standing checks; downstream readers see disclaimer and consent state only; direct delete denied; anon no grant. |
| split_capture | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; work_id uuid NOT NULL; source_session_id uuid NULL; close_moment_id uuid NOT NULL; participant_designations jsonb NOT NULL CHECK jsonb_typeof(participant_designations)='array'; claim_refs jsonb NOT NULL CHECK jsonb_typeof(claim_refs)='array'; proposer_id uuid NOT NULL FK identity.party; ledger_id uuid NULL FK rights.rights_ledger_version; debt_state text NOT NULL CHECK debt_state IN ('none','open'); term_version bigint NOT NULL CHECK term_version>0; source_close_version bigint NOT NULL CHECK source_close_version>0; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL | UNIQUE(work_id, close_moment_id); (work_id, debt_state, created_at DESC); (source_session_id); (proposer_id); (ledger_id) | Split worker and authorized proposer append in work scope; session owner reads own capture; ledger service reads designation only; no percentage mutation or direct delete; anon no grant. |
| buyout_designation | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; contribution_id uuid NOT NULL; payer_id uuid NOT NULL FK identity.party; designee_id uuid NOT NULL FK identity.party; beneficiary_id uuid NULL FK identity.party; consideration_ref text NOT NULL; consideration_minor bigint NOT NULL CHECK consideration_minor>=0; consent_set jsonb NOT NULL CHECK jsonb_typeof(consent_set)='array'; disclaimer_version text NOT NULL; legal_effect_state text NOT NULL CHECK legal_effect_state='not_asserted'; state text NOT NULL CHECK state IN ('pending_consent','consented','refused','superseded'); supersedes_id uuid NULL FK rights.buyout_designation; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(contribution_id, version); (contribution_id, state); (payer_id, state); (designee_id, state); (supersedes_id) | Payer and designee read own designation; agreement worker appends; Shard 07 and downstream readers get non-ownership facts; no direct update/delete; anon no grant. |
| ledger_amendment | id uuid PK NOT NULL; owner_id uuid NOT NULL FK identity.party; current_ledger_id uuid NOT NULL FK rights.rights_ledger_version; current_version bigint NOT NULL CHECK current_version>0; proposed_ledger_id uuid NULL FK rights.rights_ledger_version; proposal_kind text NOT NULL CHECK proposal_kind IN ('correction','amendment','cross-ledger'); delta_hash text NOT NULL CHECK length(delta_hash)=64; impact_manifest jsonb NOT NULL CHECK jsonb_typeof(impact_manifest)='object'; standing_party_id uuid NOT NULL FK identity.party; state text NOT NULL CHECK state IN ('draft','open','queued','blocked','consented','superseded'); queued_after_id uuid NULL FK rights.ledger_amendment; consent_reset boolean NOT NULL CHECK consent_reset=true; true_up_item_ref text NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | UNIQUE(current_ledger_id, version); (current_ledger_id, state, created_at); (standing_party_id, state); (queued_after_id); (proposed_ledger_id); | Ledger parties read whole proposal; standing proposer appends; consent service reads frozen deltas; downstream impact workers read manifest; direct update/delete denied; anon no grant. |

### State, Concurrency and Transaction Rules

- Split capture is keyed to one Shard 09 close moment. Replays return the same capture. It stores no percentages and does not block close; a debt row remains visible until separately resolved.
- Producer points lock recording, contribution and tier. The base-tier sum must stay at or below one. The same contribution cannot have points and a work-for-hire fee. A refused points entry never becomes an ownership row.
- Buyout designation and consideration append atomically with consent references. Required payer and designee consents are explicit unless approved engagement evidence waives payer action. Legal effectiveness is never computed here.
- Amendments require standing on any chain version and a per-party before/after delta. One open proposal is allowed; later proposals queue with source snapshot and rebase. Any row change resets every consent, while the current ledger governs until unanimous required consent.
- A share decrease must carry the exact affected-party acknowledgement. Cross-ledger proposal packages lock master and publishing versions and advance together or neither. True-up is a separate consent item, never compelled payment.
- Unreachable parties remain blocked indefinitely. At most three notification resends per rolling seven days are permitted, while saving a proposal remains unlimited. Outbox and audit are atomic with each state transition.

### Grants, RLS and Retention

- RLS requires work, recording, contribution, ledger-party, payer, designee or mandate scope. Public readers receive designation or state classes only; exact economics and rows are private.
- Agreement evidence, payer identity, consideration, exact rates, row values, impact details and consent text are excluded from events and ordinary logs. Events carry hashes and state classes.
- Captures, encumbrances, covenants, buyouts, amendments, audit and idempotency retain 7 years or legal hold, whichever is longer. Superseded and refused records remain attributable.
- Service principals receive named RPC grants for capture ingestion, point validation, buyout consent, amendment queue, impact manifest and outbox. No wildcard access exists.

## Middleware & Policies

### Authorization Matrix

| Role | Allowed scope | Explicit denial |
|---|---|---|
| Named owner or writer | Propose or consent own authorized ledger rows and review amendments. | Another party row, forced share assignment or inferred consent. |
| Producer or master administrator | Capture split and record authorized master points. | Composition ownership, publisher share, NIL or authorship by role alone. |
| Contributor or designee | Review and consent own contribution agreement. | Changing another party designation or asserting legal effect. |
| Publisher or admin entity | Act on anchored publisher relationship. | Cross-anchored writer edit or whole-ledger override. |
| Estate or successor | Act under verified Shard 01 representation. | Login as deceased or historical consent rewrite. |
| System worker | Capture close moment, validate arithmetic, queue impact and notify. | Create consent, decide merits or add percentages. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| RGT-AGR-API-01 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(splitCapture) → parseZod(CaptureSplitRequest) → idempotency(7y) → authorizeCloseMoment → sourceCloseVersionGuard → ternaryDesignationGuard → captureAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-AGR-API-02 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(producerPoints) → parseZod(RecordPointsRequest) → idempotency(7y) → authorizeMasterAdministration → contributionScopeGuard → tierCeilingGuard → pointsWfhExclusionGuard → consentAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-AGR-API-03 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(buyoutDesignation) → parseZod(RecordBuyoutRequest) → idempotency(7y) → authorizePayerOrStandingActor → contributionScopeGuard → consentSetGuard → legalEffectDisclaimerGuard → buyoutAppendTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |
| RGT-AGR-API-04 | requestId → strictCors(rightsOrigins) → requireAuth → resolveActingContext → rateLimit(ledgerAmendment) → parseZod(ProposeAmendmentRequest) → idempotency(7y) → authorizeLedgerChainStanding → oneOpenProposalGuard → deltaAndImpactGuard → consentResetGuard → amendmentQueueTransaction → errorEnvelope(ApiError { code, message, requestId, details }) → auditOutbox. |

### Security and Privacy Controls

- Strict Zod 4 parsing rejects percentage input in split capture, zero or unreduced rationals, absent terms, missing beneficiary choice, mutable prior rows and incomplete impact manifests.
- CORS permits configured rights origins with credentials and CSRF protection. Idempotency keys and hashes are server-normalized; client roles and consent claims are ignored.
- 403 means known resource without authority; 404 hides unknown or out-of-scope work, contribution, ledger or party. Error details expose only stable code and requestId.
- No point, fee, credit, performance, project membership or designation is converted to ownership. No amendment endpoint has an administrator override.
- Private agreements and exact ledger values are encrypted at rest and excluded from search, events and normal telemetry.

## Data Flow

1. RGT-AGR-API-01 consumes a Shard 09 close moment and appends ternary participant designations and capture debt, emitting rights.ledger.proposed.v1 only when a ledger proposal is separately created.
2. RGT-AGR-API-02 resolves master authority, validates tier arithmetic and points/WFH exclusion, then appends encumbrance pending consent.
3. RGT-AGR-API-03 records contribution designation and consideration atomically, waits for required consents and preserves legal-effect disclaimer.
4. RGT-AGR-API-04 freezes current ledger and delta, resets consent and stores an impact manifest. It emits rights.ledger.superseded.v1 only after successor consent, not at proposal time.
5. Current consented ledger remains the governing projection until a successor is fully consented. Downstream licensing, accounting and registration consumers receive state and provenance and cannot infer legal effect.

## Events and Consumer Contracts

| Event type | Emitted by | Required payload and consumers |
|---|---|---|
| rights.ledger.proposed.v1 | RGT-AGR-API-04 after a valid open proposal | ledgerId hash, object/right/territory classes, row-set hash, consent-set count and version; consent tasks and split UI consume it. Exact rows, shares and private evidence are excluded. |
| rights.ledger.consented.v1 | Consent aggregation after all required parties consent | ledgerId, version, party hash, row-state classes and aggregate state; control, licensing and royalty projections consume it. Exact values and consent text are excluded. |
| rights.ledger.superseded.v1 | Successor amendment after unanimous consent | old/new ledger hashes, delta class, impact-count bucket, effective class and version; stale artifact and downstream consumers invalidate prior projections. |

All events are transactional-outbox records keyed by event ID and aggregate version. Consumers cannot convert capture debt, points, buyout or proposed state into consented ownership.

## Error Handling and Failure Recovery

| Operation ID | Failure | Required response and recovery |
|---|---|---|
| RGT-AGR-API-01 | Close resolver outage, stale moment, invalid designation or duplicate capture | Return dependency, ACTING_CONTEXT_STALE or VALIDATION_FAILED; retry same moment idempotently, retain valid debt and never block or reopen close. |
| RGT-AGR-API-02 | Tier overage, points/WFH collision, missing payee or consent outage | Return VALIDATION_FAILED or CONSENT_REQUIRED; preserve prior encumbrance and do not create ownership row. Retry resolver/outbox with same key. |
| RGT-AGR-API-03 | Missing consent, contribution authority, invalid consideration or agency outage | Return CONSENT_REQUIRED, FORBIDDEN or VALIDATION_FAILED; retain pending designation without legal-effect claim and retry only idempotently. |
| RGT-AGR-API-04 | No standing, second open proposal, stale version, incomplete impact or unreachable party | Return FORBIDDEN, VERSION_CONFLICT or validation refusal; queue later proposal with source snapshot, keep current ledger governing and retain blocked state indefinitely when needed. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| RGT-AGR-API-01 | Strict ternary designation, no percentages, close version and exact ApiError schema. | Close worker authority, no session block, CORS/rate and privacy. | Capture uniqueness, debt state, source version, RLS/grants and event handoff. | Duplicate moment, resolver outage, skipped designation and redacted participant logs. |
| RGT-AGR-API-02 | Rational rate, tier, term, payee, recoupment and fee collision schema. | Master administration, tier ceiling, points ownership isolation, CORS/rate. | Encumbrance append, consent state, tier aggregate, RLS/grants and event. | Over-ceiling, WFH collision, consent outage, replay and exact-rate redaction. |
| RGT-AGR-API-03 | Contribution, beneficiary choice, consideration, consent set and disclaimer schema. | Payer/designee authority, no legal effect, preserved credit/NIL, CORS/rate. | Atomic designation/covenant, consent linkage, supersession, RLS/grants and audit. | Missing consent, agency outage, duplicate replay and consideration redaction. |
| RGT-AGR-API-04 | Delta rows, impact manifest, proposal kind, queue and version schema. | Chain standing, one-open rule, consent reset, no admin override and privacy. | Amendment queue, rebase, CAS, cross-ledger atomicity, RLS/grants and events. | Concurrent proposals, unreachable party, impact outage, stale version and replay. |

### Test Levels and Acceptance Gates

- Unit: strict Zod 4 rejects unknown keys, percentages in capture, zero rationals, missing beneficiary choice, absent term and malformed hashes; every failure validates ApiError { code, message, requestId, details }.
- Integration: exercise BE00 context, Shard 01 agency, Shard 07 evidence, Shard 09 close, Shard 10 ledger and impact registry adapters with exact timeout and retry behavior.
- Database: verify append-only agreements, tier arithmetic, one-open proposal, consent reset, queue ordering, cross-ledger atomicity, RLS and no direct grants.
- Property: replay capture and agreement commands; permute rows to canonical order; amend any row and assert all consent resets; assert queued proposals never merge.
- Acceptance gate: all four operations have route, Zod contract, field, error/auth/idempotency/rate/observability, middleware, persistence and test rows; all five assigned models and rights.ledger.superseded.v1 are literal-covered.

## Deepening Passes and Ambiguity Gate

### Micro Pass

- Empty designation, skipped participant, tier overflow, WFH collision, beneficiary none, missing consent, share decrease, second open proposal, unreachable party and incomplete impact manifest have explicit debt, refusal or blocked states.
- Capture debt is not a rights grant. Points are encumbrances, buyouts are contribution agreements and amendments are successors only after consent.

### Meso Pass

- split_capture, encumbrance, covenant, buyout_designation and ledger_amendment remain separate models. Consent applies to the relevant complete agreement or ledger version and never to inferred percentages.
- Current ledger governs until successor consent. True-up is a separate decision, and downstream consumers receive state and provenance rather than legal conclusions.

### Macro Pass

- Shard 09 supplies close facts, Shard 01 supplies agency, Shard 07 supplies credit evidence and 10a owns object/ledger base. 10c consumes successors for title/control; 10d consumes rights positions; 10e consumes source/version evidence.
- Outbox, audit and idempotency are atomic. Deletion preserves agreement history while derived projections and capture access are revoked or tombstoned.

## Ambiguity Gate

**PASS.** RGT-05 through RGT-08 map one-to-one to authoritative routes and complete operation-keyed matrices. Ternary capture, point ceiling, fee exclusion, contribution scope, legal-effect disclaimer, one-open queue, consent reset, unreachable blocking and cross-ledger atomicity are deterministic. BE00 ApiError, CORS, RLS and event provenance are explicit.

## Open Questions

None.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-28 | Authored split capture, producer points, contribution buyout and consent-reset amendment backend contracts. | /write-be-spec |

## Dependency References

- **Consumes:** [BE00 request and error contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas), [Shard 01 Contracts](../ia/01-identity-authority.md#contracts) for agency and parties, [Shard 07 Contracts](../ia/07-credits-core.md#contracts) for contributor evidence, and [Shard 09 Contracts](../ia/09-projects-collaboration.md#contracts) for close moments and source claims.
- **Publishes:** rights.ledger.proposed.v1, rights.ledger.consented.v1 and rights.ledger.superseded.v1 with state-safe hashes and versions.
- **Sibling handoff:** 10a supplies ledger/object versions; 10c consumes amendment/title inputs; 10d consumes contribution and rights-holder boundaries; 10e consumes source/version and audit evidence.
- **Downstream:** Shards 14, 18, 20–22, 27 and 28 consume consented successors only and cannot treat points, buyouts or capture debt as ownership.
