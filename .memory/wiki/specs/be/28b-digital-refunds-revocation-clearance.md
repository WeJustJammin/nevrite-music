# Digital Refunds, Revocation and Clearance — Backend Specification

## Split Group

Shard 28 digital licensing and commerce, split 28b. This companion owns withdrawal-waiver evidence, pre-delivery cancellation, digital refund cases, approved refund application, future-entitlement revocation and the preserved-past-clearance disposition for IA interactions 28.06–28.11. It does not own product or entitlement authority (Shard 27), payment capture truth, rights/split truth (Shard 10), safety merits (Shard 06), transfers/promotions (28c), or contributor accounting (28d).

## Classification

| Capability | Classification | Boundary decision |
|---|---|---|
| 28.06 capture withdrawal waiver | Causal consent command | A full localized waiver and two affirmative limbs commit before any applicable delivery grant or bytes; a decline preserves purchase and records the ordinary delivery-window date. |
| 28.07 cancel before delivery | Immediate cancellation command | A qualifying pre-delivery cancellation refunds the original method without opening a refund case; entitlement becomes inactive while order evidence remains. |
| 28.08 request digital refund | Buyer-initiated case command | Automatic or human path evaluates a frozen order/entitlement snapshot, returns outcome, reason, cause, SLA and appeal, and never suspends statutory rights for fraud. |
| 28.09 apply approved refund | Finance/adjudicator settlement command | Refund to the original instrument and currency is independent from vendor clawback; recovery failure never becomes buyer debt. |
| 28.10 revoke future entitlement use | Triggered enforcement command | Refund, chargeback and blacklist remain distinct triggers; delivery stops immediately, future use is revoked, and local file/machine recovery is best effort only. |
| 28.11 preserve past clearance | Release-disposition command | Lawfully evidenced past release use remains recorded while future placement/use is disallowed; ambiguous rights route counsel or dispute and never silently become clear. |

BE00 inheritance is mandatory for every operation: authenticated acting context, request ID, strict Zod 4 parsing, idempotency receipts, audit/outbox, CORS, rate limits, forced RLS and ApiError { code, message, requestId, details }. Shard 27 remains authoritative for entitlement state and delivery enforcement. A refund decision does not itself infer title, rights, or clearance.

## Referenced Material Inventory

| Source | Section / lines | Material used |
|---|---|---|
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Overview, Scope Reconciliation and Commerce Decisions, lines 7–39 | Withdrawal consent, instant pre-delivery cancellation, statutory/refund policy, independent clawback, future-use revocation and preserved-past-clearance locks. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Interactions, lines 79–84 | Exact 28.06–28.11 preconditions, success outcomes and failure/recovery behavior. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Command Contracts, lines 95–104 | CaptureDeliveryWaiver, DecideDigitalRefund and ApplyRefundAndRevocation inputs and invariants. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Data Models and Typed Field Registry, lines 119–147 | WithdrawalWaiver, DigitalRefundCase and RevocationTrigger required fields, constraints and cardinality. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Access Control and Accessibility, lines 153–189 | Buyer, holder, vendor, adjudicator, finance and system boundaries; minimum refund evidence and accessible outcome. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Event Schemas, lines 190–207 | digital_waiver.captured.v1, digital_refund.decided.v1, digital_entitlement.revocation_requested.v1 and digital_clearance.disposition_changed.v1. |
| [IA Shard 28](../ia/28-digital-licensing-commerce.md) | Edge Cases and coverage matrix, lines 209–263 | Waiver decline, false promises, refund after release, exclusive-rights exception, chargeback and deletion/recovery behavior. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Purchase and Waiver Flow, lines 12–20 | Version pinning, waiver causal predecessor, decline date, exemption policy and fail-closed ambiguity. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Refund and Revocation Flow, lines 30–39 | Pre-delivery cancellation, evidence-first decisioning, original-instrument refund, future revocation and past clearance. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Refund Policy Matrix and Revocation Semantics, lines 58–76 | Statutory/promissory outcomes, transfer/exclusive exceptions, distinct triggers and best-effort local recovery. |
| [IA deep dive 28](../ia/deep-dives/28-digital-licensing-commerce.md) | Digital Commerce States and Race Resolution, lines 79–122 | Entitlement state authority, waiver/download/refund races and deterministic event handling. |
| [BE00](00-infrastructure.md#requestresponse-contracts-zod-4-schemas) | Global contracts, middleware and deterministic protocol rules | Global ApiError, request identity, idempotency, audit/outbox, CORS, CAS and safe error behavior. |
| [IA Shard 27](../ia/27-digital-catalog-delivery.md#contracts) | Entitlement and delivery authority | Delivery stops through Shard 27; this companion emits typed disposition/triggers only. |
| [IA Shard 06](../ia/06-trust-safety.md#contracts) | Dispute, fraud and protected-case authority | Safety owns dispute merits and risk cause; this companion consumes scoped signals without changing safety truth. |
| [IA Shard 10](../ia/10-rights-ownership.md#contracts) | Rights and clearance authority | Preserve-past-clearance records a disposition and routes ambiguity; it does not author rights or title. |

## IA Source Map

### Assigned interactions

| IA interaction | Backend operation | Source behavior preserved |
|---|---|---|
| 28.06 Capture withdrawal waiver | BE28B-DLC01 | Complete localized wording and affirmative immediate-supply/withdrawal-loss act commit before grant/bytes; decline records delivery-window date. |
| 28.07 Cancel before delivery | BE28B-DLC02 | Qualifying cancellation refunds immediately without a case and inactivates entitlement while retaining evidence. |
| 28.08 Request digital refund | BE28B-DLC03 | Frozen evidence supports automatic or human path with SLA, reason/outcome/cause and appeal; statutory floor is never fraud-suspended. |
| 28.09 Apply approved refund | BE28B-DLC04 | Original currency/instrument refund commits independently from vendor recovery and publishes the revocation trigger handoff. |
| 28.10 Revoke future entitlement use | BE28B-DLC05 | Distinct refund/chargeback/blacklist trigger stops platform delivery, tombstones future access and never claims local byte recovery. |
| 28.11 Preserve past clearance | BE28B-DLC06 | Past evidenced lawful release remains available to release checks while future placement/use is blocked or counsel-routed. |

### Canonical Data Models

| IA model name | Role in this companion | Durable authority or reference |
|---|---|---|
| WithdrawalWaiver | Owned localized affirmative consent and causal delivery gate | commerce.withdrawal_waivers |
| DigitalRefundCase | Owned evidence-first policy decision and appeal record | commerce.digital_refund_cases |
| RevocationTrigger | Owned append-only cause and first-authoritative revocation record | commerce.revocation_triggers |

### Event Schemas

| Exact Event Schemas type | Producer operation | Payload authority and privacy rule |
|---|---|---|
| digital_waiver.captured.v1 | BE28B-DLC01 | Entitlement, wording/version/locale, actor and capturedAt; no free text, payment secret or licence bytes. |
| digital_refund.decided.v1 | BE28B-DLC03 | Case, outcome/reason/cause, policy, adjudicator and appeal deadline; vendor receives structured cause only. |
| digital_entitlement.revocation_requested.v1 | BE28B-DLC04 or BE28B-DLC05 | Entitlement, trigger, effectiveAt, case/version; Shard 27 owns delivery-state transition. |
| digital_clearance.disposition_changed.v1 | BE28B-DLC05 or BE28B-DLC06 | Entitlement, past/future disposition, affected work references and version; no inferred title or rights winner. |

## Endpoint Completeness Reconciliation

BE00 owns authentication, global errors, idempotency, audit/outbox and CORS. Shard 27 owns entitlement/delivery state and Shard 06 owns dispute merits/risk. Payment rail owns money movement. Shard 10 owns rights/clearance evidence. The six routes below are the only public routes for 28.06–28.11; no route duplicates entitlement issuance, payment capture, safety adjudication or rights title.

| IA ID | Required capability | Route | Completion evidence |
|---|---|---|---|
| 28.06 | Capture withdrawal waiver | BE28B-DLC01 | Versioned localized waiver and affirmative receipt precede applicable delivery grant; no receipt means no delivery. |
| 28.07 | Cancel before delivery | BE28B-DLC02 | Original-method cancellation/refund and inactive entitlement commit without a refund case. |
| 28.08 | Request digital refund | BE28B-DLC03 | Frozen snapshot, evidence, policy path, SLA, outcome, cause and appeal are recorded. |
| 28.09 | Apply approved refund | BE28B-DLC04 | Original-instrument refund and independent vendor-recovery state are visible; trigger is emitted. |
| 28.10 | Revoke future entitlement use | BE28B-DLC05 | Delivery revocation request, future-use tombstone and trigger history persist; local recovery is never overstated. |
| 28.11 | Preserve past clearance | BE28B-DLC06 | Past release evidence remains preserved and future disposition is explicit or counsel/dispute pending. |

## API Endpoints

### Authoritative Route Registry

This is the sole route registry for this companion. Every contract, error, authorization, idempotency, rate, observability, middleware and test row keys to exactly one operation ID.

| Operation ID | Method | Path | IA interaction | Authorization/ownership | Success |
|---|---|---|---|---|---|
| BE28B-DLC01 | POST | /api/v1/digital/commerce/withdrawal-waivers | 28.06 | Buyer or controlled holder for the entitlement; waiver actor must be the bound holder. | 201 WithdrawalWaiverSuccess |
| BE28B-DLC02 | POST | /api/v1/digital/commerce/orders/{orderId}/cancel-before-delivery | 28.07 | Buyer/holder controller or system order worker before first delivery. | 200 PreDeliveryCancellationSuccess |
| BE28B-DLC03 | POST | /api/v1/digital/commerce/refund-cases | 28.08 | Buyer/holder requester for own order or case-bound support; adjudicator reads scoped evidence. | 202 DigitalRefundCaseSuccess |
| BE28B-DLC04 | POST | /api/v1/digital/commerce/refunds/{refundCaseId}/apply | 28.09 | Authorized adjudicator or dual-control finance actor for a final case; system may retry same decision. | 202 RefundApplicationSuccess |
| BE28B-DLC05 | POST | /api/v1/digital/commerce/entitlements/{entitlementId}/revoke | 28.10 | System trigger worker, finance, or case-bound adjudicator; no vendor self-revocation. | 202 RevocationSuccess |
| BE28B-DLC06 | POST | /api/v1/digital/commerce/clearance/{entitlementId}/preserve | 28.11 | Release/rights workflow actor with scoped evidence or counsel case; no buyer self-certification of rights. | 200 ClearanceDispositionSuccess |

### External Seams

| Seam | Exact request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 acting context and idempotency | {accessToken, actingContextId, operationId, aggregateId, idempotencyKey, requestHash} → {actorId, partyId, roles, receiptId, replay} | 400 ms | No external retry; transaction serialization retries twice at 50 ms and 150 ms. | Open after 5 failures in 30 s; half-open after 15 s; fail closed with 503 DEPENDENCY_UNAVAILABLE. |
| Shard 27 entitlement/delivery authority | {entitlementId, expectedVersion, disposition, effectiveAt, reasonClass} → {entitlementState, deliveryBlocked, version, acknowledgementId} | 800 ms | 2 retries at 100 ms and 300 ms with same command key; deny is not retried. | Open after 4 failures in 60 s; half-open after 30 s; revocation remains pending and returns 503. |
| Payment refund rail | {refundId, orderId, originalInstrumentRef, chargedCurrency, amountMinor, idempotencyKey} → {providerRefundId, state, refundedMinor, currency, providerRequestId} | 2,500 ms | 2 retries at 250 ms and 750 ms only on timeout/408/429; unknown is not duplicated. | Open after 3 failures in 60 s; half-open after 30 s; buyer outcome is recorded while recovery remains pending. |
| Shard 06 dispute/risk authority | {caseId, orderId, trigger, evidenceRefs, requestId} → {disputeState, riskCause, freezeVersion, appealDeadline} | 700 ms | 2 retries at 150 ms and 450 ms on timeout/408/429/5xx; refusal is final. | Open after 4 failures in 60 s; half-open after 30 s; unknown routes human review and never denies statutory floor. |
| Shard 10 release/clearance resolver | {entitlementId, workRefs, evidenceRefs, disposition, expectedRightsVersion} → {pastDisposition, futureDisposition, rightsCaseRef, version} | 900 ms | 2 retries at 150 ms and 450 ms with same disposition key; ambiguous result stays pending. | Open after 4 failures in 60 s; half-open after 30 s; no clear-title response while open. |

## Request/Response Contracts

All request schemas are strict Zod 4. UUIDs are canonical lowercase strings, dates are RFC 3339 UTC strings and Idempotency-Key is required on every mutation. Every failure is ErrorResponse containing BE00 ApiError { code, message, requestId, details }. A pre-delivery cancellation is deliberately not represented as a DigitalRefundCase.

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
const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  message: z.string().min(1).max(500),
  requestId: Id,
  details: BE00ErrorDetails,
}).strict();
const ErrorResponse = z.strictObject({ error: ApiError }).strict();
const TriggerKind = z.enum(["refund", "chargeback", "blacklist"]);
const RefundReason = z.enum(["statutory", "false_compatibility", "false_conformity", "defect", "change_of_mind", "other"]);
const RefundState = z.enum(["submitted", "automatic_review", "human_review", "approved", "refused", "appealed", "applied"]);

export const DlcB01Request = z.strictObject({
  operationId: z.literal("BE28B-DLC01"),
  entitlementId: Id,
  buyerHolderPartyId: Id,
  wordingVersion: z.string().trim().min(1).max(128),
  locale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  decision: z.enum(["accepted", "declined"]),
  immediateSupplyAcknowledged: z.boolean(),
  withdrawalLossAcknowledged: z.boolean(),
  exemptionBasis: z.string().trim().max(256).nullable(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict().superRefine((v, ctx) => {
  if (v.decision === "accepted" && (!v.immediateSupplyAcknowledged || !v.withdrawalLossAcknowledged)) {
    ctx.addIssue({ code: "custom", message: "accepted waiver requires both affirmative limbs" });
  }
  if (v.decision === "declined" && (v.immediateSupplyAcknowledged || v.withdrawalLossAcknowledged)) {
    ctx.addIssue({ code: "custom", message: "declined waiver cannot assert affirmative limbs" });
  }
});
export const DlcB01Success = z.strictObject({
  operationId: z.literal("BE28B-DLC01"),
  waiverId: Id,
  entitlementId: Id,
  state: z.enum(["captured", "exempt", "declined"]),
  capturedAt: IsoDate.nullable(),
  ordinaryDeliveryAt: IsoDate.nullable(),
  deliveryCausal: z.boolean(),
  requestId: Id,
}).strict();

export const DlcB02Request = z.strictObject({
  operationId: z.literal("BE28B-DLC02"),
  orderId: Id,
  entitlementId: Id,
  expectedEntitlementVersion: Version,
  cancellationReason: z.literal("before_delivery"),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcB02Success = z.strictObject({
  operationId: z.literal("BE28B-DLC02"),
  orderId: Id,
  entitlementId: Id,
  state: z.literal("cancelled_before_delivery"),
  refundState: z.enum(["refunded", "refund_pending"]),
  caseOpened: z.literal(false),
  version: Version,
  requestId: Id,
}).strict();

export const DlcB03Request = z.strictObject({
  operationId: z.literal("BE28B-DLC03"),
  orderId: Id,
  entitlementId: Id,
  orderSnapshotVersion: Version,
  reason: RefundReason,
  evidenceRefs: z.array(Id).max(100),
  policyVersion: z.string().trim().min(1).max(128),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcB03Success = z.strictObject({
  operationId: z.literal("BE28B-DLC03"),
  caseId: Id,
  state: RefundState,
  path: z.enum(["automatic", "human"]),
  slaDueAt: IsoDate,
  appealDueAt: IsoDate.nullable(),
  requestId: Id,
}).strict();

export const DlcB04Request = z.strictObject({
  operationId: z.literal("BE28B-DLC04"),
  refundCaseId: Id,
  finalOutcome: z.enum(["approved", "refused"]),
  reasonCode: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  causeCode: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  appealDueAt: IsoDate.nullable(),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcB04Success = z.strictObject({
  operationId: z.literal("BE28B-DLC04"),
  refundId: Id,
  refundCaseId: Id,
  paymentState: z.enum(["submitted", "refunded", "unknown", "not_applicable"]),
  revocationTriggerId: Id.nullable(),
  originalCurrency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  requestId: Id,
}).strict();

export const DlcB05Request = z.strictObject({
  operationId: z.literal("BE28B-DLC05"),
  entitlementId: Id,
  trigger: TriggerKind,
  sourceRef: Id,
  effectiveAt: IsoDate,
  reasonCode: z.string().regex(/^[A-Z0-9_]{3,80}$/),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcB05Success = z.strictObject({
  operationId: z.literal("BE28B-DLC05"),
  revocationTriggerId: Id,
  entitlementId: Id,
  trigger: TriggerKind,
  deliveryState: z.enum(["requested", "blocked", "unknown"]),
  localRecovery: z.literal("best_effort"),
  futureUse: z.literal("revoked"),
  version: Version,
  requestId: Id,
}).strict();

export const DlcB06Request = z.strictObject({
  operationId: z.literal("BE28B-DLC06"),
  entitlementId: Id,
  affectedWorkRefs: z.array(Id).min(1).max(100),
  releaseEvidenceRefs: z.array(Id).min(1).max(100),
  expectedRightsVersion: Version,
  futureDisposition: z.enum(["revoked", "counsel_pending", "disputed"]),
  idempotencyKey: z.string().trim().min(16).max(128),
}).strict();
export const DlcB06Success = z.strictObject({
  operationId: z.literal("BE28B-DLC06"),
  dispositionId: Id,
  entitlementId: Id,
  pastDisposition: z.literal("preserved"),
  futureDisposition: z.enum(["revoked", "counsel_pending", "disputed"]),
  rightsCaseRef: Id.nullable(),
  version: Version,
  requestId: Id,
}).strict();
```

### Operation Contract Matrix

| Operation ID | Request contract | Success contract and invariant | Error response |
|---|---|---|---|
| BE28B-DLC01 | DlcB01Request strict body plus Idempotency-Key; both affirmative limbs and wording/locale required. | DlcB01Success 201; deliveryCausal mirrors captured/exempt state, while declined includes ordinaryDeliveryAt and no grant. | ErrorResponse with ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28B-DLC02 | DlcB02Request strict body plus Idempotency-Key; expected entitlement version and before_delivery reason required. | DlcB02Success 200; caseOpened=false, entitlement inactive and refund is original-method. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28B-DLC03 | DlcB03Request strict body plus Idempotency-Key; frozen order snapshot, reason, policy and evidence refs required. | DlcB03Success 202; automatic/human path, SLA and appeal are explicit. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28B-DLC04 | DlcB04Request strict body plus Idempotency-Key; only final adjudicated outcome may apply. | DlcB04Success 202; original currency/instrument leg and independent revocation trigger are visible. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429, 502 or 503. |
| BE28B-DLC05 | DlcB05Request strict body plus Idempotency-Key; trigger/source/effective time required. | DlcB05Success 202; futureUse=revoked, localRecovery=best_effort and delivery acknowledgement are explicit. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |
| BE28B-DLC06 | DlcB06Request strict body plus Idempotency-Key; affected work and release evidence refs required. | DlcB06Success 200; pastDisposition=preserved and future disposition is revoked or counsel/dispute pending. | ErrorResponse with BE00 ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429 or 503. |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| BE28B-DLC01 | Entitlement must be purchased and waiver-eligible; wording version, locale and both affirmative limbs must match policy. No URL or link-open receipt substitutes for the actor's affirmative act. |
| BE28B-DLC02 | Delivery grant and first-delivery evidence must be absent; any completed delivery or waiver effect requiring adjudication returns CANCELLATION_NOT_ELIGIBLE and opens no automatic case. |
| BE28B-DLC03 | Order/entitlement snapshot and evidence refs are frozen before policy evaluation. Change-of-mind after valid waiver/delivery may refuse, but statutory and false-promise paths cannot be fraud-suspended. |
| BE28B-DLC04 | Case must be final and outcome/reason/cause/appeal complete. Payment rail receives original instrument/currency only; vendor recovery is a separate pending effect. |
| BE28B-DLC05 | Trigger is one of refund, chargeback or blacklist and source is verified. First trigger controls current state; later triggers append history and cannot weaken the effective revocation. |
| BE28B-DLC06 | Work/release references must be readable and rights version current. Past clearance is evidence preservation, not a legal rights verdict; ambiguous scope becomes counsel_pending or disputed. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| BE28B-DLC01 | VALIDATION_FAILED, WAIVER_NOT_ELIGIBLE, WAIVER_STALE, FORBIDDEN, ENTITLEMENT_NOT_FOUND, IDEMPOTENCY_KEY_CONFLICT, DEPENDENCY_UNAVAILABLE; hidden entitlement returns 404, visible entitlement without holder authority returns 403. | Required 7 years; hash covers entitlement, holder, wording, locale and both acts. Replay returns waiver receipt; mismatch returns 409. | 20 waiver attempts per holder per hour, burst 3. | waiver_captured_total, decline and stale counters; log requestId, operationId, wording/policy hash and causal state, no localized free text. |
| BE28B-DLC02 | CANCELLATION_NOT_ELIGIBLE, ENTITLEMENT_ALREADY_DELIVERED, FORBIDDEN, ORDER_NOT_FOUND, ENTITLEMENT_NOT_FOUND, VERSION_CONFLICT; hidden order returns 404, visible order without holder grant returns 403. | Required 7 years; hash covers order, entitlement and expected version. Replay returns cancellation/refund state. | 10 cancellations per holder per hour, burst 2. | pre_delivery_cancel_total, delivery-race and refund-pending counters; log order/entitlement hashes and state only. |
| BE28B-DLC03 | VALIDATION_FAILED, REFUND_CASE_EXISTS, SNAPSHOT_STALE, STATUTORY_POLICY_REQUIRED, FORBIDDEN, ORDER_NOT_FOUND, DEPENDENCY_UNAVAILABLE; hidden order returns 404, visible order without requester grant returns 403. | Required 7 years; hash covers order, entitlement, snapshot, reason, evidence refs and policy. Replay returns case/SLA. | 10 cases per holder per 30 days, burst 2; support is case-bound. | refund_case_total by path/reason, SLA age, appeal and statutory-floor alerts; evidence hashes only, no buyer free text. |
| BE28B-DLC04 | REFUND_NOT_FINAL, REFUND_ALREADY_APPLIED, ORIGINAL_INSTRUMENT_UNAVAILABLE, FORBIDDEN, CASE_NOT_FOUND, PAYMENT_UNKNOWN, DEPENDENCY_UNAVAILABLE; hidden case returns 404, visible case without finance/adjudicator grant returns 403. | Required 7 years; hash covers case, outcome, reason, cause and appeal. Replay returns payment/revocation state. | 30 applications per finance actor per hour, burst 5. | refund_apply_total, payment unknown/retry, vendor recovery lag and trigger emission; instrument tokens are redacted. |
| BE28B-DLC05 | INVALID_TRIGGER, REVOCATION_ALREADY_AUTHORITATIVE, FORBIDDEN, ENTITLEMENT_NOT_FOUND, DELIVERY_ACK_TIMEOUT, DEPENDENCY_UNAVAILABLE; hidden entitlement returns 404, visible entitlement without trigger authority returns 403. | Required 7 years; hash covers entitlement, trigger, source, effectiveAt and reason. Replay returns first trigger. | 120 triggers per partition per minute, burst 20. | revocation_requested_total by trigger, delivery ack age, local recovery unknown and duplicate counters; no file paths. |
| BE28B-DLC06 | CLEARANCE_EVIDENCE_MISSING, RIGHTS_VERSION_STALE, FORBIDDEN, ENTITLEMENT_NOT_FOUND, COUNSEL_REVIEW_REQUIRED, DEPENDENCY_UNAVAILABLE; hidden entitlement/work returns 404, visible workflow without scoped authority returns 403. | Required 7 years; hash covers entitlement, work refs, evidence refs, future disposition and rights version. Replay returns disposition. | 60 dispositions per case per hour, burst 5. | clearance_preserved_total, counsel/dispute pending, evidence-version conflict and latency; no legal conclusion in logs. |

## Database Schema

### PostgreSQL Model Registry

All tables use protected schemas, enabled and forced RLS, service/RPC writes only, append-only revisions and same-transaction audit/outbox. Money and provider references are separated from buyer-facing evidence. No direct anon/authenticated table grant exists.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| WithdrawalWaiver | id uuid PK NOT NULL; entitlement_id uuid NOT NULL FK catalog.entitlements(id); holder_party_id uuid NOT NULL FK identity.parties(id); wording_version text NOT NULL CHECK length between 1 and 128; locale text NOT NULL CHECK locale~'^[a-z]{2}(-[A-Z]{2})?$'; immediate_supply_ack boolean NOT NULL CHECK true; withdrawal_loss_ack boolean NOT NULL CHECK true; exemption_basis text NULL CHECK length<=256; state text NOT NULL CHECK state in ('captured','exempt','declined'); captured_at timestamptz NULL; ordinary_delivery_at timestamptz NULL; delivery_causal boolean NOT NULL CHECK delivery_causal=(state in ('captured','exempt')); receipt_hash char(64) NOT NULL; version bigint NOT NULL CHECK version>0; created_at timestamptz NOT NULL; unique (entitlement_id,wording_version,locale) | entitlement_id,state; holder_party_id,created_at desc; wording_version; state,captured_at | Holder reads own receipt; delivery worker reads causal proof; vendor sees no waiver wording/identity; forced RLS, append-only, no direct client write. |
| DigitalRefundCase | id uuid PK NOT NULL; order_id uuid NOT NULL FK commerce.orders(id); entitlement_id uuid NOT NULL FK catalog.entitlements(id); order_snapshot_version bigint NOT NULL CHECK >0; snapshot_hash char(64) NOT NULL; reason text NOT NULL CHECK reason in ('statutory','false_compatibility','false_conformity','defect','change_of_mind','other'); evidence_refs uuid[] NOT NULL CHECK cardinality<=100; policy_version text NOT NULL CHECK length between 1 and 128; path text NOT NULL CHECK path in ('automatic','human'); state text NOT NULL CHECK state in ('submitted','automatic_review','human_review','approved','refused','appealed','applied'); outcome text NULL; reason_code text NULL; cause_code text NULL; sla_due_at timestamptz NOT NULL; appeal_due_at timestamptz NULL; adjudicator_id uuid NULL FK identity.parties(id); created_by uuid NOT NULL FK identity.parties(id); version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; unique (order_id,entitlement_id,order_snapshot_version) | order_id,state; entitlement_id,created_at desc; state,sla_due_at; adjudicator_id; reason,cause_code | Buyer reads own case; adjudicator/finance reads minimum scoped evidence; vendor receives structured reason/cause only; forced RLS, append-only decisions, no direct delete. |
| RevocationTrigger | id uuid PK NOT NULL; entitlement_id uuid NOT NULL FK catalog.entitlements(id); trigger text NOT NULL CHECK trigger in ('refund','chargeback','blacklist'); source_ref uuid NOT NULL; effective_at timestamptz NOT NULL; reason_code text NOT NULL CHECK reason_code~'^[A-Z0-9_]{3,80}$'; first_authoritative boolean NOT NULL; state text NOT NULL CHECK state in ('requested','acknowledged','unknown','superseded'); appeal_due_at timestamptz NULL; version bigint NOT NULL CHECK version>0; created_by uuid NOT NULL FK identity.parties(id); created_at timestamptz NOT NULL; unique (entitlement_id,trigger,source_ref) | entitlement_id,first_authoritative,effective_at; entitlement_id,created_at desc; trigger,state; source_ref | System/finance/adjudicator appends; holder reads own trigger state; vendor receives structured cause; direct update/delete denied, forced RLS. |
| ClearanceDispositionProjection | id uuid PK NOT NULL; entitlement_id uuid NOT NULL FK catalog.entitlements(id); affected_work_refs uuid[] NOT NULL CHECK cardinality>0; release_evidence_refs uuid[] NOT NULL CHECK cardinality>0; past_disposition text NOT NULL CHECK past_disposition='preserved'; future_disposition text NOT NULL CHECK future_disposition in ('revoked','counsel_pending','disputed'); rights_case_ref uuid NULL FK rights.cases(id); expected_rights_version bigint NOT NULL CHECK >0; version bigint NOT NULL CHECK >0; created_by uuid NOT NULL FK identity.parties(id); created_at timestamptz NOT NULL; unique (entitlement_id,version) | entitlement_id,created_at desc; affected_work_refs; future_disposition,state if materialized | Release/rights workflow reads scoped evidence; public projection omits private refs; no buyer/vendor direct write; forced RLS and append-only. |

### State, Concurrency and Transaction Rules

- WithdrawalWaiver is a causal predecessor to an applicable delivery grant. Its full wording, locale, policy/exemption basis and affirmative receipt commit before Shard 27 may issue bytes. Decline is explicit and records the ordinary delivery-window date; silence, URL opening and read receipt do not consent.
- A qualifying pre-delivery cancellation locks order and entitlement, confirms no first-delivery or waiver effect, refunds the original method and marks entitlement inactive in one transaction. It never creates a DigitalRefundCase.
- A refund case evaluates a frozen order/entitlement snapshot. Automatic and human paths converge on an immutable outcome/reason/cause/appeal record. Statutory floors and false compatibility/conformity promises cannot be suppressed by a fraud cause; ambiguous evidence remains human review.
- ApplyRefundAndRevocation writes the refund decision/audit and provider command under one idempotency key, but provider recovery is independently reconciled. A payment unknown result never becomes a second charge or buyer debt.
- RevocationTrigger uses the first committed trigger as current authority; refund, chargeback and blacklist remain historical distinctions. Shard 27 delivery enforcement is called idempotently; local machines/files are best effort and never reported recovered.
- ClearanceDispositionProjection preserves past evidenced release use and independently records future revoked/counsel/disputed disposition. It cannot assert clear title or rewrite Shard-10 evidence.
- Concurrent download and refund is serialized by entitlement version: refund emits the revocation request and the next range grant fails. Worker crash resumes from audit/outbox/provider receipts; no partial case or orphan trigger.

### Grants, RLS and Retention

- authenticated and anon roles have no direct table grants. Security-invoker RPCs recheck holder, requester, adjudicator/finance dual control, entitlement version, waiver causal state and scoped evidence.
- Buyer projections contain own outcome, reason, cause and appeal but not internal risk heuristics or vendor identity. Vendors receive structured reason/cause and aggregate recovery status, never buyer identity, free text or waiver evidence.
- Waiver, refund, trigger and clearance evidence is retained under commerce/legal policy. Non-empty order, refund and earning references are tombstoned rather than deleted; revocation removes derived delivery access but preserves audit evidence.
- Support recovery requires an expiring purpose grant and cannot decide a refund, alter a waiver, release a freeze, claim local byte recovery or convert counsel_pending to clear.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles | Ownership and object scope | 403 versus 404 |
|---|---|---|---|
| BE28B-DLC01 | Buyer/holder controller; support case-bound mechanical recovery | Holder controls entitlement and records the affirmative waiver; policy/exemption is server-authored. | Hidden entitlement returns 404 ENTITLEMENT_NOT_FOUND; visible entitlement without holder grant returns 403 WAIVER_FORBIDDEN. |
| BE28B-DLC02 | Buyer/holder controller; system order worker | Order and entitlement must belong to the acting holder and be before first delivery. | Hidden order returns 404 ORDER_NOT_FOUND; visible order without holder grant returns 403 CANCELLATION_FORBIDDEN. |
| BE28B-DLC03 | Buyer/holder requester; support case-bound | Requester may open a case for own order/entitlement; adjudicator receives minimum evidence by case scope. | Hidden order returns 404 ORDER_NOT_FOUND; visible order without requester grant returns 403 REFUND_REQUEST_FORBIDDEN. |
| BE28B-DLC04 | Adjudicator or dual-control finance; system retry worker | Only final case outcome may invoke original-instrument refund; provider recovery is separate. | Hidden case returns 404 REFUND_CASE_NOT_FOUND; visible case without decision grant returns 403 REFUND_APPLY_FORBIDDEN. |
| BE28B-DLC05 | System, finance or case-bound adjudicator | Trigger source must be verified and entitlement scope must be visible; vendors cannot self-revoke. | Hidden entitlement returns 404 ENTITLEMENT_NOT_FOUND; visible entitlement without trigger authority returns 403 REVOCATION_FORBIDDEN. |
| BE28B-DLC06 | Release/rights workflow actor, counsel case or scoped adjudicator | Evidence refs and work scope are bounded; the action preserves evidence and cannot declare title. | Hidden entitlement/work returns 404 CLEARANCE_NOT_FOUND; visible workflow without scope returns 403 CLEARANCE_FORBIDDEN. |

### Per-Operation Middleware Registry

| Operation ID | Hono middleware order | CORS policy | Validation and security controls |
|---|---|---|---|
| BE28B-DLC01 | requestId → strictCors → auth → holder context → rate limit → idempotency → strict body validation → waiver policy gate → handler/audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 128 KiB body, localized text allowlist, two affirmative limbs, BE00 ApiError { code, message, requestId, details }, no free-text logs. |
| BE28B-DLC02 | requestId → strictCors → auth → order/holder context → rate limit → idempotency → strict body validation → delivery-state CAS → payment refund → handler/audit | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 128 KiB body, no cancellation after delivery, original instrument only, BE00 ApiError { code, message, requestId, details }. |
| BE28B-DLC03 | requestId → strictCors → auth → requester context → rate limit → idempotency → strict body validation → snapshot/evidence gate → handler/audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 256 KiB body, evidence refs only, buyer free text redacted, statutory policy gate, BE00 ApiError { code, message, requestId, details }. |
| BE28B-DLC04 | requestId → strictCors → auth → adjudicator/finance dual control → rate limit → idempotency → strict body validation → final-case gate → payment/revocation adapters → audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 256 KiB body, instrument token reference only, dual control, no vendor debt, BE00 ApiError { code, message, requestId, details }. |
| BE28B-DLC05 | requestId → strictCors → auth → trigger authority → rate limit → idempotency → strict body validation → first-trigger CAS → Shard-27 delivery adapter → audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 128 KiB body, trigger/source allowlist, local recovery never claimed, BE00 ApiError { code, message, requestId, details }. |
| BE28B-DLC06 | requestId → strictCors → auth → scoped release/rights context → rate limit → idempotency → strict body validation → evidence/version gate → Shard-10 resolver → audit/outbox | CORS policy digital-commerce: explicit web/PWA origins; no wildcard credentials; Vary: Origin | CSRF, 256 KiB body, evidence IDs not content, counsel/dispute gate, no clear-title boolean, BE00 ApiError { code, message, requestId, details }. |

### Security and Privacy Controls

Credentialed browser mutations require CSRF protection and origin allowlisting. Refund cases store evidence references and hashes rather than buyer free text; risk and fraud internals are purpose-limited. Payment instrument tokens remain server-side. Waiver wording is versioned and rendered completely at accessible zoom. Public and vendor projections never expose holder identity, legal conclusions, private evidence or licence bytes.

## Data Flow

1. BE28B-DLC01 validates the holder act and policy, commits WithdrawalWaiver and emits digital_waiver.captured.v1. Shard 27 may grant applicable delivery only after consuming the causal receipt.
2. BE28B-DLC02 checks no first delivery/waiver effect, refunds the original instrument, and marks entitlement inactive without creating a case.
3. BE28B-DLC03 stores a frozen evidence-first case. BE28B-DLC04 applies only a final outcome, refunds independently from vendor recovery, and emits the structured decision/trigger handoff.
4. BE28B-DLC05 appends the first-authoritative trigger and requests Shard 27 delivery revocation. BE28B-DLC06 preserves past clearance evidence and sends ambiguous future disposition to rights/counsel workflow.

## Events and Consumer Contracts

| Event type | Producer operation | Required envelope and payload | Consumer behavior |
|---|---|---|---|
| digital_waiver.captured.v1 | BE28B-DLC01 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, entitlementId, wordingVersion, locale, actorId, capturedAt, exemptionBasis} | Shard 27 delivery gate verifies causal receipt; legal evidence stores version; duplicate refetches. |
| digital_refund.decided.v1 | BE28B-DLC03 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, caseId, outcome, reasonCode, causeCode, policyVersion, adjudicatorId, appealDueAt} | Refund/revocation and vendor reports consume structured outcome; no buyer free text. |
| digital_entitlement.revocation_requested.v1 | BE28B-DLC04 or BE28B-DLC05 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, entitlementId, trigger, effectiveAt, caseId, version} | Shard 27 blocks future delivery/library access and acknowledges version; local recovery remains best effort. |
| digital_clearance.disposition_changed.v1 | BE28B-DLC05 or BE28B-DLC06 | {eventId, aggregateId, aggregateVersion, occurredAt, requestId, entitlementId, pastDisposition, futureDisposition, affectedWorkRefs, version} | Release/rights checks preserve past evidence and consume future restriction; no title inference. |

Transactional outbox rows contain event IDs, aggregate versions, hashes and redacted payloads only. Consumers refetch canonical records after loss or duplicate; no event is a substitute for Shard 27, Shard 06 or Shard 10 authority.

## Error Handling and Failure Recovery

| Operation ID | Condition | HTTP | Error code | Recovery |
|---|---|---:|---|---|
| BE28B-DLC01 | Waiver limbs missing or entitlement not eligible | 422 | WAIVER_NOT_ELIGIBLE | No delivery grant; correct policy/version and retry with a new key. |
| BE28B-DLC02 | First delivery or waiver effect already exists | 409 | CANCELLATION_NOT_ELIGIBLE | Do not open an automatic case; use BE28B-DLC03 under the frozen snapshot. |
| BE28B-DLC03 | Snapshot changed or policy requires human review | 409 or 202 | SNAPSHOT_STALE or REFUND_HUMAN_REVIEW | Refetch case state; preserve statutory path and SLA. |
| BE28B-DLC04 | Provider unknown after approved decision | 202 or 503 | PAYMENT_UNKNOWN | Preserve approved outcome, retry same provider key and keep vendor recovery pending. |
| BE28B-DLC05 | Duplicate later trigger or delivery adapter timeout | 200 or 503 | REVOCATION_ALREADY_AUTHORITATIVE or DELIVERY_ACK_TIMEOUT | Return first trigger; retry Shard 27 with same key; never claim local recovery. |
| BE28B-DLC06 | Rights evidence ambiguous or stale | 409 | COUNSEL_REVIEW_REQUIRED or RIGHTS_VERSION_STALE | Preserve past evidence; route future use to counsel/dispute and refetch version. |
| All | Idempotency hash mismatch | 409 | IDEMPOTENCY_KEY_CONFLICT | Use original key/result or a new key after intent changes. |
| All | Rate/dependency circuit open | 429 or 503 | RATE_LIMITED or DEPENDENCY_UNAVAILABLE | Honor Retry-After/backoff; no partial mutation or existence leak. |

## Verification and Test Strategy

### Operation Test Matrix

| Test ID | Operation ID | Acceptance assertion |
|---|---|---|
| BE28B-CON-001 | BE28B-DLC01 | Strict waiver contract requires complete localized wording, both affirmative limbs, causal receipt and exemption semantics. |
| BE28B-CON-002 | BE28B-DLC02 | Pre-delivery cancellation returns original-method refund/inactive state and caseOpened=false. |
| BE28B-CON-003 | BE28B-DLC03 | Frozen snapshot, automatic/human path, SLA, outcome/reason/cause and appeal parse exactly. |
| BE28B-CON-004 | BE28B-DLC04 | Final decision, original instrument/currency, independent recovery and trigger state parse exactly. |
| BE28B-CON-005 | BE28B-DLC05 | Distinct triggers, first-authoritative state, Shard-27 delivery acknowledgement and best-effort local recovery are exact. |
| BE28B-CON-006 | BE28B-DLC06 | Past preserved and future revoked/counsel/disputed disposition cannot assert clear title. |
| BE28B-ROUTE-001 | BE28B-DLC01 through BE28B-DLC06 | Method/path/operation registry is authoritative; aliases cannot bypass middleware. |
| BE28B-AUTH-001 | BE28B-DLC01 through BE28B-DLC06 | Hidden objects return 404, visible objects without scope return 403, and projections redact identity/evidence. |
| BE28B-MW-001 | BE28B-DLC01 through BE28B-DLC06 | CORS, CSRF, auth, rate, validation, BE00 ApiError and safe headers run per operation. |
| BE28B-DB-001 | BE28B-DLC01 through BE28B-DLC06 | Typed fields, constraints, indexes, forced RLS, grants and append-only evidence are migration-tested. |
| BE28B-RACE-001 | BE28B-DLC01, BE28B-DLC02, BE28B-DLC04 and BE28B-DLC05 | Waiver/download, cancellation/delivery, refund/download and first-trigger races serialize deterministically. |
| BE28B-RACE-002 | BE28B-DLC03 and BE28B-DLC06 | Provider unknown, appeal, rights-version conflict and worker crash preserve evidence and resumable state. |
| BE28B-EVT-001 | BE28B-DLC01 through BE28B-DLC06 | Exact IA events, privacy redaction, outbox dedupe and consumer refetch are verified. |

### Test Levels and Acceptance Gates

- Contract tests reject unknown keys, malformed IDs/dates, missing affirmative limbs, unsupported reasons, stale versions and malformed evidence before mutation.
- Route tests assert each method/path, explicit CORS policy, authorization chain, rate class, idempotency receipt and BE00 error envelope.
- Database tests exercise waiver causal constraints, case uniqueness, first-trigger uniqueness, append-only disposition, foreign keys, forced RLS and no direct client grants.
- Integration tests simulate delivery before waiver, cancellation racing first download, statutory refund, false promise, chargeback, provider timeout, Shard 06 review and Shard 10 ambiguity.
- Privacy tests verify no buyer identity/free text, payment token, risk heuristic, private evidence, local file path or legal conclusion appears in vendor/public output or logs.
- Recovery tests replay lost responses, duplicate event delivery, worker crash after provider refund, stale rights version and delivery acknowledgement timeout.

## Deepening Passes and Ambiguity Gate

### Micro Pass

| Question | Resolution |
|---|---|
| Does opening a waiver link imply consent? | No. Only the strict affirmative act with both limbs creates the causal receipt. |
| Is pre-delivery cancellation a refund case? | No. It is an immediate cancellation/refund with caseOpened=false; post-delivery or ambiguous paths use a case. |
| Can a fraud cause suppress a statutory refund? | No. Cause allocates operational recovery but never weakens the buyer's statutory floor. |
| Does refund prove rights are revoked locally? | No. Platform future-use revocation is authoritative; local machine/file recovery is best effort and never claimed complete. |
| Does preserving past clearance declare title? | No. It preserves evidence and routes uncertain future use to counsel/dispute. |

### Macro Pass

| Boundary question | Resolution |
|---|---|
| Does this companion own entitlement state? | No. Shard 27 owns entitlement/delivery; this companion sends typed requests and records refund/disposition evidence. |
| Does it adjudicate safety or disputes? | No. Shard 06 owns merits, risk and protected cases; this companion consumes scoped outcomes. |
| Does it author rights/title? | No. Shard 10 owns rights and clearance evidence; preservation is a bounded disposition projection. |
| Can vendor recovery failure create buyer debt? | No. Original refund outcome is independent; recovery remains a finance/provider state. |
| Can an exclusive-rights transfer use ordinary refund automation? | No. The exclusive exception remains counsel-reviewed rescission under the source policy. |

## Ambiguity Gate

PASS. Evidence: interactions 28.06–28.11 map one-to-one to BE28B-DLC01–DLC06 and six unique routes; WithdrawalWaiver, DigitalRefundCase and RevocationTrigger are explicitly owned; exact digital_waiver.captured.v1, digital_refund.decided.v1, digital_entitlement.revocation_requested.v1 and digital_clearance.disposition_changed.v1 events are inventoried; strict Zod 4 request/success/error contracts, BE00 ApiError { code, message, requestId, details }, 403-vs-404, idempotency, rate, observability, CORS, typed persistence/RLS/grants, state/recovery rules and keyed tests exist for every operation. Shard 27 entitlement authority, Shard 06 dispute authority, Shard 10 clearance authority and payment recovery boundaries are explicit. No unresolved source conflict remains.

## Open Questions

None.

## Dependency References

- [BE00 platform contracts](00-infrastructure.md#requestresponse-contracts-zod-4-schemas): request identity, strict Zod 4, ApiError, auth, CORS, idempotency, rate, audit/outbox and forced RLS.
- [IA Shard 27 contracts](../ia/27-digital-catalog-delivery.md#contracts): entitlement and delivery authority consumed for waiver gating and future-use revocation.
- [IA Shard 06 contracts](../ia/06-trust-safety.md#contracts): dispute/risk and protected-case signals consumed without replacing safety merits.
- [IA Shard 10 contracts](../ia/10-rights-ownership.md#contracts): rights/clearance evidence and counsel routing; no title or split mutation here.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-28 | Initial production-grade companion for IA interactions 28.06–28.11; waiver causality, cancellation, refund case/outcome, future revocation, past clearance, contracts, security, persistence, recovery and ambiguity evidence added. |
