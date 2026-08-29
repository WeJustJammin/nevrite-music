# Course Commerce, Consumption & Refunds — Backend Specification

**Status:** Complete
**IA source:** [Shard 16 — Courses, credentials and institutions](../ia/16-education-credentials-institutions.md)
**Deep-dive source:** [Deep Dive 16 — Courses, credentials and institutions](../ia/deep-dives/16-education-credentials-institutions.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns course purchase snapshots, product-scoped entitlements, revision access, learner playback/progress, course-plus-lessons bundle application, refunds, and privacy-thresholded author diagnostics. It contains `EDU-CI-05`, `EDU-CI-06`, `EDU-CI-07`, `EDU-CI-09`, and `EDU-CI-10`. Course authoring/catalog, exam evidence, institution evolution, clinical exclusion, and Shard 15 lesson-credit truth remain sibling boundaries. Payment, media access, Shard 15 credit, course catalog, and aggregate analytics are external seams.

## Classification

- **Type:** commerce/entitlement and private-consumption boundary with payment reconciliation and immutable purchase terms.
- **Boundary:** `course_purchase`, `course_entitlement`, `entitled_revision_access`, `course_progress`, and `course_diagnostic_bucket` ownership; course/revision/offer authoring, media object truth, lesson credits, and external evidence are outside this split.
- **Expected operations:** five HTTP operations, one for each assigned IA interaction (`EDU-CI-05`, `EDU-CI-06`, `EDU-CI-07`, `EDU-CI-09`, `EDU-CI-10`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** checkout freezes buyer, eligible revision, amount, currency, territory, tax and refund policy before payment; entitlement is product-scoped and never money; bundle grants are atomic; progress is monotonic/private; refund uses frozen policy plus server consumption evidence; diagnostics are delayed and thresholded.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `16-education-credentials-institutions.md` | `Overview`, `Scope Reconciliation`, `Product and Governance Decisions`, `Features`, `Acceptance Criteria` lines 7–63 | Course commerce, bundle, playback, progress, refund and diagnostics decisions. |
| `16-education-credentials-institutions.md` | `Interactions` lines 64–85 | Exact `EDU-CI-05`, `EDU-CI-06`, `EDU-CI-07`, `EDU-CI-09`, and `EDU-CI-10` preconditions, outcomes and edge cases. |
| `16-education-credentials-institutions.md` | `Contracts`, `Course Authoring and Commerce`, `Consumption, Evidence and Institution Boundaries` lines 93–134 | Entitlement/progress states, offer snapshot, bundle atomicity, refund algorithm, signed playback, monotonic progress and diagnostic threshold. |
| `16-education-credentials-institutions.md` | `Data Models` and typed registry lines 136–186 | Canonical purchase, entitlement, revision-access, progress and diagnostic models. |
| `16-education-credentials-institutions.md` | `Access Control`, `Access Escalation`, `Accessibility` lines 187–223 | Buyer/learner/author diagnostics capabilities, private progress, refund access and safe absence. |
| `16-education-credentials-institutions.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 225–294 | Entitlement/progress/refund/takedown events, payment races, consumption evidence and privacy. |
| `16-education-credentials-institutions.md` | `Cross-Shard Section Contract Map`, `Dependency References` lines 296–312 | Course offer, Shard 15 credit, payment, storage, catalog and audit dependencies. |
| `deep-dives/16-education-credentials-institutions.md` | `Canonical Field Contracts`, `State Machines`, `Entitlement, Bundle and Refund Algorithm` lines 19–73 | Typed fields, purchase/entitlement/refund states, frozen terms, bundle transaction and 14-day/20% rule. |
| `deep-dives/16-education-credentials-institutions.md` | `Consumption and Privacy Algorithm`, `Abuse and Recovery Verification` lines 74–135 | Signed media access, monotonic progress, thresholded diagnostics, webhook reconciliation and privacy recovery. |
| `deep-dives/16-education-credentials-institutions.md` | `Cross-Shard Contracts`, `Implementation Envelope` lines 136–153 | Payment/credit/catalog seams, versioning, idempotency, outbox and bounded commands. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor/acting context, replay ledger, rate limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Supabase/RLS, private media, PII isolation, Zod-first contracts and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `EDU-CI-05` Adult learner buys course | Active territorial offer and no active entitlement; frozen terms before payment; provider reconciliation; product-scoped idempotent entitlement. | `EDU-COURSE-COM-API-01` | `course_purchase`, `course_entitlement`, `entitled_revision_access`; `education.course-entitlement.changed.v1` |
| `EDU-CI-06` Buyer purchases course-plus-lessons | Course grant and Shard 15 teacher/academy credit grant apply atomically after one reconciled payment; failure rolls back/refunds. | `EDU-COURSE-COM-API-02` | `course_purchase`, `course_entitlement`; `education.course-entitlement.changed.v1`, `education.course-refund.changed.v1` |
| `EDU-CI-07` Entitled learner consumes course | Active entitlement and eligible revision/media; short-lived signed playback; monotonic private progress; Shard 15 practice provenance. | `EDU-COURSE-COM-API-03` | `course_entitlement`, `entitled_revision_access`, `course_progress`; `education.course-progress.changed.v1` |
| `EDU-CI-09` Buyer requests refund | Purchase owner, paid/not-refunded, frozen policy and authorized consumption; 14 calendar days and below 20% change-of-mind rule, defect/law override. | `EDU-COURSE-COM-API-04` | `course_purchase`, `course_entitlement`, `course_progress`; `education.course-refund.changed.v1` |
| `EDU-CI-10` Author reviews course diagnostics | Owner-only delayed thresholded starts/drop-off/returns; no named learner/progress/practice joins; withheld bucket states why. | `EDU-COURSE-COM-API-05` | `course_diagnostic_bucket`; `education.course-progress.changed.v1` consumer |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `EDU-CI-05` | `EDU-COURSE-COM-API-01` | `POST /api/v1/education/course-purchases` | `PurchaseCourseRequest` → `PurchaseCourseSuccess` (`201`) | Eligibility, frozen offer, payment reconciliation, entitlement idempotency and typed `ApiError`. |
| `EDU-CI-06` | `EDU-COURSE-COM-API-02` | `POST /api/v1/education/course-bundles/purchases` | `PurchaseBundleRequest` → `PurchaseBundleSuccess` (`201`) | One payment, atomic course/Shard 15 grants, rollback/refund reconciliation and typed `ApiError`. |
| `EDU-CI-07` | `EDU-COURSE-COM-API-03` | `POST /api/v1/education/course-entitlements/{entitlementId}/lessons/{lessonId}/playback` | `AuthorizePlaybackRequest` → `AuthorizePlaybackSuccess` (`200`) | Entitlement/revision/media gate, signed access, progress monotonicity, privacy and typed `ApiError`. |
| `EDU-CI-09` | `EDU-COURSE-COM-API-04` | `POST /api/v1/education/course-purchases/{purchaseId}/refunds` | `EvaluateRefundRequest` → `EvaluateRefundSuccess` (`200`) | Frozen policy/consumption, evidence/law escalation, entitlement revocation, CAS and typed `ApiError`. |
| `EDU-CI-10` | `EDU-COURSE-COM-API-05` | `POST /api/v1/education/courses/{courseId}/diagnostics` | `RequestDiagnosticsRequest` → `DiagnosticsSuccess` (`200`) | Owner/delay/threshold, privacy withholding, bounded aggregates and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `EDU-COURSE-COM-API-01` | `POST` | `/api/v1/education/course-purchases` | `EDU-CI-05` | Authenticated adult buyer; buyer owns payment and has no active course entitlement. | `201` `PurchaseCourseSuccess` |
| `EDU-COURSE-COM-API-02` | `POST` | `/api/v1/education/course-bundles/purchases` | `EDU-CI-06` | Authenticated adult buyer; eligible course offer and Shard 15 rate line are disclosed and current. | `201` `PurchaseBundleSuccess` |
| `EDU-COURSE-COM-API-03` | `POST` | `/api/v1/education/course-entitlements/{entitlementId}/lessons/{lessonId}/playback` | `EDU-CI-07` | Authenticated entitlement owner; entitlement grants only eligible revision/media access. | `200` `AuthorizePlaybackSuccess` |
| `EDU-COURSE-COM-API-04` | `POST` | `/api/v1/education/course-purchases/{purchaseId}/refunds` | `EDU-CI-09` | Authenticated buyer owning paid purchase; author cannot decide refund eligibility. | `200` `EvaluateRefundSuccess` |
| `EDU-COURSE-COM-API-05` | `POST` | `/api/v1/education/courses/{courseId}/diagnostics` | `EDU-CI-10` | Authenticated course owner; requested buckets pass delay and privacy threshold. | `200` `DiagnosticsSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-context verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Course catalog/offer verifier | `{courseId, revisionId, offerId, territory, offerVersion}` → `{active, eligible, amountMinor, currency, taxClass, refundPolicyVersion}` | 500 ms | 2 retries at 100 ms/300 ms; no retry on version refusal | Open after 5 failures/30 s; checkout fails closed with `503`; half-open after 20 s. |
| Payment provider | `{purchaseId, amountMinor, currency, buyerToken, idempotencyKey, termsHash}` → `{providerPaymentId, status, capturedAmount, capturedAt}` | 1,200 ms | 2 retries at 150 ms/450 ms on timeout/5xx with same key | Open after 4 failures/60 s; purchase stays `PAYMENT_PENDING`, no grant; half-open after 30 s. |
| Shard 15 bundle credit adapter | `{purchaseId, rateCardLineId, units, policyVersion, idempotencyKey}` → `{creditEventId, accountId, state}` | 700 ms | 2 retries at 100 ms/300 ms with same key | Open after 4 failures/30 s; bundle transaction rolls back and reconciliation/refund queue starts; half-open after 20 s. |
| Media access signer | `{entitlementId, revisionId, mediaId, lessonId, actorId}` → `{signedUrl, objectVersion, expiresAt}` | 600 ms | 2 retries at 100 ms/300 ms; no retry on authorization denial | Open after 5 failures/30 s; playback returns `503` without a token; half-open after 20 s. |
| Refund/payment reconciliation | `{purchaseId, providerPaymentId, policyVersion, decision, idempotencyKey}` → `{refundId, providerStatus, refundedAmount}` | 1,200 ms | 2 retries at 150 ms/450 ms; durable webhook reconciliation | Open after 4 failures/60 s; entitlement enters `refund_pending`, never reports final refund until confirmed; half-open after 30 s. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with `VALIDATION_FAILED`; timestamps are RFC 3339 with offset; IDs are UUIDs. Every error is the BE00/global envelope `ApiError { code, message, requestId, details }`.

```ts
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateTime = z.iso.datetime({ offset: true });
const Key = z.string().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const TermsHash = z.string().length(64).regex(/^[a-f0-9]+$/);
const Context = z.object({ actingContextId: Uuid, expectedVersion: z.int().nonnegative().optional() }).strict();
export const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: Uuid, details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict();

export const PurchaseCourseRequest = z.object({
  ...Context.shape, idempotencyKey: Key, courseId: Uuid, revisionId: Uuid, offerId: Uuid, offerVersion: z.int().positive(), territory: z.string().length(2).regex(/^[A-Z]{2}$/), amountMinor: z.int().positive(), currency: z.string().length(3).regex(/^[A-Z]{3}$/), taxClass: z.string().trim().min(1).max(40), refundPolicyVersion: z.int().positive(), termsHash: TermsHash, paymentMethodId: Uuid,
}).strict();
export const PurchaseCourseSuccess = z.object({ purchaseId: Uuid, entitlementId: Uuid, revisionAccessId: Uuid, state: z.literal("active"), version: z.int().positive() }).strict();

export const PurchaseBundleRequest = z.object({
  ...Context.shape, idempotencyKey: Key, courseId: Uuid, revisionId: Uuid, offerId: Uuid, offerVersion: z.int().positive(), rateCardLineId: Uuid, rateCardLineVersion: z.int().positive(), lessonUnits: z.int().min(1).max(100), amountMinor: z.int().positive(), currency: z.string().length(3).regex(/^[A-Z]{3}$/), taxClass: z.string().trim().min(1).max(40), refundPolicyVersion: z.int().positive(), termsHash: TermsHash, paymentMethodId: Uuid,
}).strict();
export const PurchaseBundleSuccess = z.object({ purchaseId: Uuid, entitlementId: Uuid, creditEventId: Uuid, state: z.literal("active"), version: z.int().positive() }).strict();

export const AuthorizePlaybackRequest = z.object({
  ...Context.shape, idempotencyKey: Key, entitlementId: Uuid, lessonId: Uuid, revisionId: Uuid, mediaId: Uuid, deviceId: Key, confirmedPositionSeconds: z.int().min(0).max(86400), clientProgressVersion: z.int().positive(),
}).strict();
export const AuthorizePlaybackSuccess = z.object({ signedUrl: z.url(), expiresAt: DateTime, mediaVersion: z.int().positive(), progress: z.object({ furthestSeconds: z.int().nonnegative(), completed: z.boolean(), version: z.int().positive() }).strict() }).strict();

export const EvaluateRefundRequest = z.object({
  ...Context.shape, idempotencyKey: Key, purchaseId: Uuid, purchaseVersion: z.int().positive(), reason: z.enum(["change_of_mind", "defect", "misrepresentation", "mandatory_law"]), requestedAt: DateTime, consumptionEvidenceVersion: z.int().positive(), consumedPercent: z.number().min(0).max(100), evidenceRef: z.string().trim().max(256).nullable(),
}).strict();
export const EvaluateRefundSuccess = z.object({ purchaseId: Uuid, decision: z.enum(["eligible", "ineligible", "review_pending"]), state: z.enum(["refunded", "refund_pending", "paid"]), entitlementRevoked: z.boolean(), refundId: Uuid.nullable(), policyVersion: z.int().positive(), version: z.int().positive() }).strict();

export const RequestDiagnosticsRequest = z.object({
  ...Context.shape, idempotencyKey: Key, courseId: Uuid, revisionId: Uuid, requestedBuckets: z.array(z.object({ startsAt: DateTime, endsAt: DateTime }).strict()).min(1).max(52), dimensions: z.array(z.enum(["starts", "lesson_dropoff", "returns"])).min(1).max(3), cohortThreshold: z.int().min(10).max(1000), delayHours: z.int().min(24).max(8760),
}).strict();
export const DiagnosticsSuccess = z.object({ courseId: Uuid, revisionId: Uuid, buckets: z.array(z.object({ startsAt: DateTime, endsAt: DateTime, dimension: z.enum(["starts", "lesson_dropoff", "returns"]), value: z.number().nonnegative().nullable(), withheld: z.boolean(), withholdingReason: z.string().trim().max(500).nullable() }).strict()), generatedAt: DateTime, version: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `EDU-COURSE-COM-API-01` | `PurchaseCourseRequest` | `PurchaseCourseSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,502,503` |
| `EDU-COURSE-COM-API-02` | `PurchaseBundleRequest` | `PurchaseBundleSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,502,503` |
| `EDU-COURSE-COM-API-03` | `AuthorizePlaybackRequest` | `AuthorizePlaybackSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-COURSE-COM-API-04` | `EvaluateRefundRequest` | `EvaluateRefundSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,502,503` |
| `EDU-COURSE-COM-API-05` | `RequestDiagnosticsRequest` | `DiagnosticsSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `EDU-COURSE-COM-API-01` | Require adult buyer, active territory offer, no active entitlement, matching revision/amount/currency/tax/refund terms and payment source. Existing entitlement returns `ALREADY_OWNED` before payment; changed offer fails before charge; unreconciled provider state remains `PAYMENT_PENDING` with no grant. |
| `EDU-COURSE-COM-API-02` | Validate current course offer and Shard 15 rate-line versions, one payment and exact terms. Apply course entitlement plus credit event in one transaction; any grant failure rolls back and enters reconciliation/refund; no half bundle. |
| `EDU-COURSE-COM-API-03` | Require active entitlement, eligible revision access, playable media, owner identity and bounded confirmed position. Signed URL is short-lived; progress accepts only a furthest position and never moves backward without explicit restart intent; media failure returns `MEDIA_NOT_READY`. |
| `EDU-COURSE-COM-API-04` | Require purchase owner, `paid` and not refunded, frozen policy/evidence versions and bounded consumption. Change-of-mind eligibility is within 14 calendar days and below 20%; verified defect, misrepresentation or mandatory law may enter review; author diagnostics cannot decide. |
| `EDU-COURSE-COM-API-05` | Require course owner, delayed buckets, dimensions allowlist and cohort threshold. Buckets below threshold return `withheld=true` and reason; no named learner, progress, practice, ranking or skill claim enters output. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `EDU-COURSE-COM-API-01` | `ALREADY_OWNED`, `PAYMENT_PENDING`, `NOT_AUTHORIZED`, `COURSE_UNAVAILABLE`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for known buyer without eligibility; `404` hides unpublished/unknown offer. | Required 24 h and provider key; matching replay returns purchase/entitlement; mismatch returns `IDEMPOTENCY_MISMATCH`. | 5 purchases/hour/buyer; 30/hour/offer. | Log operationId, requestId, purchase/offer IDs, terms version, provider status and result; never payment credentials, buyer identity or exact private tax data. |
| `EDU-COURSE-COM-API-02` | `PAYMENT_PENDING`, `VERSION_CONFLICT`, `BUNDLE_GRANT_FAILED`, `REFUND_PENDING`, `NOT_AUTHORIZED`, `DEPENDENCY_UNAVAILABLE`. `403` for ineligible buyer; `404` hides unavailable course/rate line. | Required 24 h; one key spans payment and both grants; mismatch returns `IDEMPOTENCY_MISMATCH`. | 3 bundles/hour/buyer; 20/hour/course. | Log operationId, requestId, purchase ID, grant statuses, provider state and reconciliation ID; no credit account balances or payment data. |
| `EDU-COURSE-COM-API-03` | `ENTITLEMENT_REQUIRED`, `MEDIA_NOT_READY`, `VERSION_CONFLICT`, `NOT_AUTHORIZED`, `DEPENDENCY_UNAVAILABLE`. `403` for known entitlement not owned; `404` hides unknown entitlement/lesson. | Required 15 minutes for signer/progress command; matching replay returns same signed access or latest progress; mismatch returns `IDEMPOTENCY_MISMATCH`. | 120 playback authorizations/hour/learner; 30/minute/lesson. | Log operationId, requestId, entitlement/lesson IDs, position bucket, media version and signer latency; never URL tokens or learner progress details. |
| `EDU-COURSE-COM-API-04` | `REFUND_INELIGIBLE`, `PAYMENT_PENDING`, `VERSION_CONFLICT`, `NOT_AUTHORIZED`, `DEPENDENCY_UNAVAILABLE`. `403` for nonowner; `404` hides unknown purchase. | Required 24 h; hash includes purchase/version/reason/evidence; replay returns decision; mismatch returns `IDEMPOTENCY_MISMATCH`. | 3 refund requests/24h/purchase; 10/hour/buyer. | Log operationId, requestId, purchase/version, policy result class, evidence version and provider state; no reason text or consumption joins. |
| `EDU-COURSE-COM-API-05` | `NOT_AUTHORIZED`, `COURSE_UNAVAILABLE`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for nonowner; `404` hides unknown course. | Required 24 h; normalized bucket/dimension hash; replay returns same report; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 diagnostic reports/hour/course owner; 2 concurrent runs/course. | Log operationId, requestId, course/revision, threshold/delay, bucket count/withheld count and duration; never learner keys or practice joins. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `education`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Purchase terms, progress and diagnostics are versioned; BE00 migration, encryption, audit and private-storage policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `course_purchase` | `id uuid PK`; `buyer_party_id uuid NOT NULL FK party`; `course_id uuid NOT NULL FK course`; `revision_id uuid NOT NULL FK course_revision`; `offer_id uuid NOT NULL FK course_offer`; `amount_minor bigint NOT NULL CHECK >0`; `currency char(3) NOT NULL`; `territory char(2) NOT NULL`; `tax_class text NOT NULL`; `refund_policy_version bigint NOT NULL`; `terms_hash char(64) NOT NULL`; `provider_payment_id uuid NULL`; `state text NOT NULL CHECK payment_pending/paid/refund_pending/refunded/failed`; `idempotency_key text NOT NULL`; `version bigint NOT NULL`. | Unique `(buyer_party_id, idempotency_key)`; `(buyer_party_id, course_id, state)`; `(provider_payment_id)`; `(course_id, created_at DESC)`. | Buyer selects own purchase; finance worker updates provider/refund state; author sees aggregate only; no anon grant; payment token never stored. |
| `course_entitlement` | `id uuid PK`; `buyer_party_id uuid NOT NULL FK party`; `course_id uuid NOT NULL FK course`; `purchase_id uuid NOT NULL FK course_purchase`; `state text NOT NULL CHECK pending_payment/active/refund_pending/revoked/disputed`; `grant_reason text NOT NULL CHECK purchase/bundle/compensation`; `granted_at timestamptz NULL`; `revoked_at timestamptz NULL`; `revocation_reason text NULL`; `version bigint NOT NULL`. | Unique `(buyer_party_id, course_id) WHERE state IN ('active','refund_pending')`; `(purchase_id)`; `(buyer_party_id, state)`. | Buyer selects own entitlement; playback RPC checks owner/state; finance worker revokes; author/public no entitlement row grant. |
| `entitled_revision_access` | `id uuid PK`; `entitlement_id uuid NOT NULL FK course_entitlement ON DELETE CASCADE`; `revision_id uuid NOT NULL FK course_revision`; `purchase_revision_id uuid NOT NULL FK course_revision`; `access_state text NOT NULL CHECK eligible/restricted/revoked`; `takedown_scope text NULL`; `eligible_from timestamptz NOT NULL`; `eligible_to timestamptz NULL`; `version bigint NOT NULL`. | Unique `(entitlement_id, revision_id)`; `(revision_id, access_state)`; `(entitlement_id, eligible_to)`. | Buyer selects eligible access through RPC; takedown worker restricts scoped rows; no author/media-object direct access; anon no grant. |
| `course_progress` | `id uuid PK`; `entitlement_id uuid NOT NULL FK course_entitlement`; `learner_party_id uuid NOT NULL FK party`; `lesson_id uuid NOT NULL FK course_lesson`; `furthest_seconds integer NOT NULL CHECK >=0`; `completed boolean NOT NULL`; `source_device_version bigint NOT NULL`; `updated_at timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(learner_party_id, entitlement_id, lesson_id)`; `(entitlement_id, updated_at DESC)`; `(learner_party_id, completed)`. | Learner-only select/update through monotonic RPC; author diagnostics receives thresholded aggregate only; no public/guardian/teacher raw grant; retained after refund. |
| `course_diagnostic_bucket` | `id uuid PK`; `course_id uuid NOT NULL FK course`; `revision_id uuid NOT NULL FK course_revision`; `bucket_start timestamptz NOT NULL`; `bucket_end timestamptz NOT NULL CHECK bucket_end>bucket_start`; `dimension text NOT NULL CHECK starts/lesson_dropoff/returns`; `cohort_count integer NOT NULL CHECK >=0`; `value_numeric numeric NULL CHECK >=0`; `withheld boolean NOT NULL`; `withholding_reason text NULL`; `delay_until timestamptz NOT NULL`; `privacy_threshold smallint NOT NULL CHECK >=10`; `version bigint NOT NULL`. | Unique `(course_id, revision_id, bucket_start, bucket_end, dimension)`; `(course_id, delay_until)`; `(revision_id, dimension)`. | Worker writes from privacy-safe aggregate; course owner reads delayed buckets; no learner key/progress/practice join; anon no base grant. |

### State, Concurrency and Transaction Rules

- Purchase state is `payment_pending → paid → refund_pending → refunded`, or `failed`; entitlement is `pending_payment → active → refund_pending → revoked`, with `disputed` for provider dispute. Payment/webhook callbacks are idempotent by provider event ID and purchase key.
- Course purchase freezes offer/revision/territory/tax/refund terms before provider effect. Existing active entitlement is rejected before charge. A provider timeout remains pending and is reconciled; the system never guesses no-charge or grants early.
- Bundle application confirms one payment then locks purchase, entitlement and the Shard 15 credit adapter key. Both grants commit or neither; failure queues automated reconciliation/refund, never a half bundle or orphan credit.
- Playback requires active entitlement, eligible revision access and playable media; signer returns a short-lived token. Progress update accepts `max(current, confirmed)` under CAS; regression requires explicit restart intent and a new source device version.
- Refund locks purchase/entitlement, evaluates frozen policy and server consumption evidence, and revokes access only after eligible provider confirmation. Progress and private practice facts remain retained. Diagnostics materialize only delayed, thresholded aggregates and withhold a bucket below threshold.

### Grants, RLS and Retention

`education_api` receives execute on purchase, playback, refund and diagnostic RPCs; `education_worker` receives provider/webhook, entitlement, aggregation and outbox writes; `education_migrator` owns DDL. RLS uses BE00 `current_actor_id()` and `current_acting_context_id()`. Progress is private and retained after refund; payment/audit records retain seven years; signed URLs expire at the configured short lifetime and are never stored.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `EDU-COURSE-COM-API-01` | Adult buyer owns payment and has no active entitlement; course offer must be eligible in territory. | `403` for known buyer lacking capability; `404` hides unknown/unpublished offer. |
| `EDU-COURSE-COM-API-02` | Adult buyer owns payment; course offer and Shard 15 rate line are current. | `403` for known ineligible buyer; `404` hides unavailable offer/rate line. |
| `EDU-COURSE-COM-API-03` | Entitlement owner only; access row and media must be eligible/playable. | `403` for known entitlement not owned; `404` hides unknown entitlement/lesson. |
| `EDU-COURSE-COM-API-04` | Paid purchase owner only; policy evaluation is server-side. | `403` for nonowner; `404` hides unknown purchase. |
| `EDU-COURSE-COM-API-05` | Course owner only; diagnostics are delayed/thresholded aggregates. | `403` for nonowner; `404` hides unknown course. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `EDU-COURSE-COM-API-01` | `requestId` → `strictCors(educationCommerceOrigins)` → `requireAuth` → `requireAdultBuyer` → `resolveActingContext` → `rateLimit(coursePurchase)` → `parseZod(PurchaseCourseRequest)` → `idempotency(24h)` → `verifyOfferAndOwnership` → `paymentTransaction` → `audit`. |
| `EDU-COURSE-COM-API-02` | `requestId` → `strictCors(educationCommerceOrigins)` → `requireAuth` → `requireAdultBuyer` → `resolveActingContext` → `rateLimit(bundlePurchase)` → `parseZod(PurchaseBundleRequest)` → `idempotency(24h)` → `verifyCourseAndRateLine` → `paymentBundleTransaction` → `audit`. |
| `EDU-COURSE-COM-API-03` | `requestId` → `strictCors(educationPlaybackOrigins)` → `requireAuth` → `requireEntitlementOwner` → `resolveActingContext` → `rateLimit(coursePlayback)` → `parseZod(AuthorizePlaybackRequest)` → `idempotency(15m)` → `authorizeRevisionMedia` → `signMedia` → `progressTransaction` → `audit`. |
| `EDU-COURSE-COM-API-04` | `requestId` → `strictCors(educationCommerceOrigins)` → `requireAuth` → `requireAdultBuyer` → `resolveActingContext` → `rateLimit(courseRefund)` → `parseZod(EvaluateRefundRequest)` → `idempotency(24h)` → `authorizePurchaseOwner` → `evaluateFrozenPolicy` → `refundTransaction` → `audit`. |
| `EDU-COURSE-COM-API-05` | `requestId` → `strictCors(educationDiagnosticsOrigins)` → `requireAuth` → `requireCourseOwner` → `resolveActingContext` → `rateLimit(courseDiagnostics)` → `parseZod(RequestDiagnosticsRequest)` → `idempotency(24h)` → `thresholdAndDelayGuard` → `privateAggregateRead` → `audit`. |

### Security and Privacy Controls

Use parameterized SQL, provider webhook signature verification, payment-token isolation, opaque IDs, private media buckets and short-lived signed access. Never expose entitlement existence to another buyer, learner progress to authors, or named learners/practice to diagnostics. Cache-control is `private, no-store` for purchases, entitlements, progress and refunds; diagnostics are owner-scoped and thresholded. CORS never permits `*` with credentials.

## Data Flow

1. BE00 authenticates actor/context, validates strict Zod input, and reserves idempotency key.
2. Purchase verifies current offer/territory/terms, reconciles hosted payment, writes purchase and entitlement/access in one transaction, then emits entitlement event.
3. Bundle confirms one payment, applies course entitlement and Shard 15 credit through one application transaction, or queues reconciliation/refund with no partial grant.
4. Playback rechecks entitlement/revision/media, obtains a signed URL, and advances private progress monotonically; Shard 15 practice provenance is opened without importing practice data.
5. Refund evaluates frozen policy/evidence, reconciles provider, revokes entitlement/access on confirmed refund, and emits refund event. Diagnostic worker creates delayed thresholded buckets with no learner keys.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `education.course-entitlement.changed.v1` | `{eventId, entitlementId, courseId, buyerPseudonym, state, revisionId, purchaseId, version, occurredAt}`; buyer identity is pseudonymous and no payment data. | Library/playback/reconciliation projectors; at-least-once ordered by entitlement/version and deduped by eventId. |
| `education.course-progress.changed.v1` | `{eventId, entitlementId, learnerPseudonym, lessonId, furthestBucket, completed, version, occurredAt}`; no exact position or private practice. | Private resume projector and thresholded diagnostics only; no author/student cross-read. |
| `education.course-refund.changed.v1` | `{eventId, purchaseId, refundId?, state, reasonClass, policyVersion, entitlementState, version, occurredAt}`; no reason text or consumption detail. | Finance/entitlement/reconciliation; provider state remains authoritative until confirmed. |

Consumers reject stale versions, retry at 2s/8s/32s, dead-letter after five attempts with an alert, and preserve the last safe projection. Every event carries BE00 `requestId`/`correlationId`.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Offer, territory, age, ownership or schema failure | Typed error before provider effect; no purchase, entitlement, refund or diagnostic mutation. |
| Existing entitlement | Return `ALREADY_OWNED` before payment and open library path; no second purchase. |
| Payment timeout/webhook duplicate | Keep `PAYMENT_PENDING`, reconcile signed provider events by event ID/key, grant only once, and never claim no charge until known. |
| Bundle grant failure | Roll back local application, retain purchase pending/unfulfilled, queue idempotent credit reconciliation/refund; no half bundle. |
| Entitlement/media/takedown denial | `ENTITLEMENT_REQUIRED` or `MEDIA_NOT_READY`; retain confirmed progress, issue no token, and scope lawful removal. |
| Concurrent progress device | CAS accepts furthest confirmed position; stale lower position is harmless; explicit restart required for regression. |
| Refund ineligible/override | Return `REFUND_INELIGIBLE` with policy version and safe review route; verified defect/misrepresentation/law enters review; author cannot decide. |
| Refund provider outage | Set `refund_pending`, do not claim final refund; durable retry/reconciliation and safe entitlement state. |
| Diagnostic threshold/delay or worker outage | Withhold bucket with reason; retry aggregate job; never lower threshold or join named learner/practice data. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `EDU-COURSE-COM-API-01` | Strict offer/terms/payment schema, exact `201`, already-owned and pending responses. | Adult/territory eligibility, no buyer leak, payment-token isolation, CORS/rate. | Frozen purchase, unique entitlement, webhook dedupe and outbox. | Payment timeout/breaker, duplicate webhook, request correlation and redaction. |
| `EDU-COURSE-COM-API-02` | Bundle versions/units/currency bounds and exact grant response. | Buyer ownership, Shard 15 boundary, no half grant, CORS/rate. | One payment plus atomic entitlement/credit application and reconciliation. | Adapter failure/rollback/refund, provider replay and metrics. |
| `EDU-COURSE-COM-API-03` | Entitlement/media/position schema, signer response, monotonic progress. | Owner-only playback, short-lived token, no private progress leak, CORS/rate. | Access eligibility, CAS furthest position and progress event. | Signer timeout/breaker, stale device, network resume and redaction. |
| `EDU-COURSE-COM-API-04` | Policy/reason/evidence bounds and exact decision states. | Purchase ownership, 14-day/20% rule, law/defect review, no author override. | Locked purchase/entitlement, provider reconciliation, revocation and event. | Refund timeout/breaker, duplicate callback, pending visibility and audit. |
| `EDU-COURSE-COM-API-05` | Bucket/dimension/threshold/delay schema and withholding response. | Owner-only, named learner/practice exclusion, no skill claims, CORS/rate. | Delayed aggregate, privacy threshold and stable report replay. | Worker outage/retry, below-threshold honesty, metric redaction. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, eligibility, bundle atomicity, monotonic progress and refund algorithms. PostgreSQL tests run RLS, unique active entitlement, CAS, immutable purchase snapshots and privacy-safe diagnostic constraints. Adapter tests exercise exact payment/signer/refund/credit timeout, retry/backoff, breaker and webhook reconciliation. Worker tests prove event ordering, dedupe, delayed threshold aggregation and scoped takedown. Playwright covers checkout, pending payment, bundle failure, playback/resume, refund eligibility/review, diagnostics withholding, keyboard focus and safe copy. The gate fails on any route collision, missing operation row, non-`ApiError` response or buyer/progress/practice leak.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all five routes have strict Zod 4 request/success/error schemas, bounded fields, frozen-term/version checks and exact statuses.
- **Pass 2 — macro boundary:** course authoring/catalog, payment, media, Shard 15 credit, diagnostics and BE00 ownership are explicit seams; no duplicate lesson-credit truth.
- **Pass 3 — lifecycle/race:** purchase/entitlement/refund/progress states use provider reconciliation, CAS, unique active grants and monotonic updates.
- **Pass 4 — failure/abuse:** payment pending, bundle rollback, signed access, refund review, threshold withholding, privacy isolation, retries/breakers and event dedupe are testable.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, FKs, indexes, RLS/grants, retention and redacted events.

## Ambiguity Gate

**PASS.** The split is source-aligned (`EDU-CI-05`, `EDU-CI-06`, `EDU-CI-07`, `EDU-CI-09`, `EDU-CI-10`), all five routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, failure recovery and tests. Payment, catalog, Shard 15 credit, media, signer and refund seams specify exact timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 16 and deep dive; locked frozen commerce terms, atomic bundles, private playback/progress, refund policy and thresholded diagnostics. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox and shared middleware.
- [BE Shard 16a — Course authoring, publication and catalog](16a-course-authoring-publication-catalog.md) for course/revision/offer truth and publication projections.
- [BE Shard 15b — Lesson booking, credits and delivery](15b-lesson-booking-credits-delivery.md) for teacher/academy-scoped lesson credit application and entitlement boundary.
- [BE Shard 16c — Exam and credential boundary](16c-exam-evidence-credential-exclusion.md) for separate external evidence semantics.
- [BE Shard 16d — Institution and clinical gate](16d-institution-gate-clinical-exclusion.md) for future academy liability isolation.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for profile/evidence visibility where referenced.
