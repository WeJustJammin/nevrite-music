# Lesson Booking, Credits & Delivery — Backend Specification

**Status:** Complete
**IA source:** [Shard 15 — Education delivery](../ia/15-education-delivery.md)
**Deep-dive source:** [Deep Dive 15 — Education delivery](../ia/deep-dives/15-education-delivery.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns lesson booking, lesson-pack entitlement, cancellation/no-show/make-up settlement, identity-bound room entry, and server-evidenced lesson close. It contains `EDU-03` through `EDU-07`. Teacher facets/discovery/trial conversion, learning artifacts, groups, mentorships, and paths remain in sibling specifications. Payment, identity, safeguarding, and room providers are external seams; the credit ledger is an append-only education liability record.

## Classification

- **Type:** multi-party transactional lifecycle boundary with payment, entitlement, real-time room, and evidence integrations.
- **Boundary:** `lesson_series`, `lesson_occurrence`, `lesson_credit_account`, `lesson_credit_event`, `cancellation_policy_version`, `lesson_room`, `lesson_presence`, and `lesson_session_record` ownership; payment intent, identity verification, safeguarding decision, and media-room transport remain adapter seams.
- **Expected operations:** five HTTP operations, one for each assigned IA interaction (`EDU-03`, `EDU-04`, `EDU-05`, `EDU-06`, `EDU-07`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** booking pins rate/policy/safeguarding versions; credits represent lesson entitlement rather than money; settlement is one compare-and-set outcome; delivery is based on server presence and never on a client assertion alone.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `15-education-delivery.md` | `Overview`, `Features`, `Delivery Phases`, `Acceptance Criteria` lines 9–60 | Lesson lifecycle, credit semantics, delivery and safeguarding boundaries. |
| `15-education-delivery.md` | `Interactions` lines 62–83 | Exact `EDU-03`–`EDU-07` behaviors, race ordering, and failure outcomes. |
| `15-education-delivery.md` | `Contracts` lines 94–135 | `LessonMode`, `CreditEventKind`, `LessonState`, `SafeguardingProfile`, and command rules. |
| `15-education-delivery.md` | `Data Models` and typed registry lines 136–192 | Canonical booking, policy, credit, room, presence, and session models. |
| `15-education-delivery.md` | `Access Control`, `Access Escalation`, `Accessibility` lines 193–224 | Participant/teacher/purchaser roles, acting context, and accessible refusal requirements. |
| `15-education-delivery.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 226–283 | Booking/credit/delivery events, settlement races, deletion, and recovery guarantees. |
| `15-education-delivery.md` | `Cross-Shard Dependencies`, `Dependency References` lines 285–312 | Identity, safeguarding, payments, rooms, and financial/rights dependencies. |
| `deep-dives/15-education-delivery.md` | `Canonical Field Contracts`, `State Machines`, `Lesson Credit and Policy Algorithm` lines 20–56 | Typed fields, booking/credit transitions, pinned policy and ledger algorithm. |
| `deep-dives/15-education-delivery.md` | `Safeguarding and Delivery Algorithm`, `Abuse and Recovery Verification` lines 58–114 | Join/participant checks, 50% delivery predicate, seven-day in-person fallback, and retries. |
| `deep-dives/15-education-delivery.md` | `Cross-Shard Contracts`, `Implementation Envelope` lines 116–134 | Versioned provider seams, idempotent effects, outbox and bounded command envelope. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor context, replay ledger, limits, audit and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Supabase/RLS, PII isolation, Zod-first contracts, and production verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `EDU-03` Book trial/lesson | Published rate/policy/value/safeguarding are displayed; reserve/payment or credit hold commits; trial uniqueness and policy/version races are typed. | `EDU-LESSON-API-01` | `lesson_series`, `lesson_occurrence`, `cancellation_policy_version`; `education.lesson-booking.changed.v1` |
| `EDU-04` Purchase lesson pack | Pinned teacher/academy rate, currency/tax/FX/revenue share and policy; credits are entitlement; provider/ledger ordering is atomic and expiration becomes residual value. | `EDU-LESSON-API-02` | `lesson_credit_account`, `lesson_credit_event`, `cancellation_policy_version`; `education.credit-event.recorded.v1` |
| `EDU-05` Cancel/no-show/make-up | Booking-pinned consequence; pre-no-show cancel wins; no-show after end and five-minute joint-presence rule; seven-day in-person fallback; one settlement. | `EDU-LESSON-API-03` | `lesson_occurrence`, `lesson_credit_account`, `lesson_credit_event`; `education.lesson-booking.changed.v1`, `education.credit-event.recorded.v1` |
| `EDU-06` Join lesson room | Named identity and consented observer only; server safeguarding at join; denial creates no presence/evidence. | `EDU-LESSON-API-04` | `lesson_room`, `lesson_presence`; `education.lesson-booking.changed.v1` consumer |
| `EDU-07` Deliver/close lesson | Server-stamped presence/in-person evidence; 50% predicate; session record is secondary to earned delivery; missing in-person evidence returns credit. | `EDU-LESSON-API-05` | `lesson_presence`, `lesson_session_record`, `lesson_occurrence`, `lesson_credit_event`; `education.lesson-delivery.recorded.v1` |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `EDU-03` | `EDU-LESSON-API-01` | `POST /api/v1/education/lesson-bookings` | `BookLessonRequest` → `BookLessonSuccess` (`201`) | Adult participant, trial uniqueness, policy/rate/safeguarding version, credit/payment hold, CAS, replay, and typed `ApiError`. |
| `EDU-04` | `EDU-LESSON-API-02` | `POST /api/v1/education/lesson-packs/purchases` | `PurchasePackRequest` → `PurchasePackSuccess` (`201`) | Purchaser authority, price/policy snapshot, provider/ledger ordering, residual expiry, replay, and typed `ApiError`. |
| `EDU-05` | `EDU-LESSON-API-03` | `POST /api/v1/education/lesson-occurrences/{occurrenceId}/settlements` | `SettleLessonRequest` → `SettleLessonSuccess` (`200`) | Actor role, policy outcome, delivery evidence clock, one settlement, CAS, retry, and typed `ApiError`. |
| `EDU-06` | `EDU-LESSON-API-04` | `POST /api/v1/education/lesson-occurrences/{occurrenceId}/room-joins` | `JoinRoomRequest` → `JoinRoomSuccess` (`201`) | Identity-bound participant/observer, safeguarding recheck, room state, no denial side effect, and typed `ApiError`. |
| `EDU-07` | `EDU-LESSON-API-05` | `POST /api/v1/education/lesson-occurrences/{occurrenceId}/close` | `CloseLessonRequest` → `CloseLessonSuccess` (`200`) | Assigned teacher, server presence/in-person evidence, 50% predicate, secondary record retry, credit/delivery event, and typed `ApiError`. |

## API Endpoints

### Route Registry

This is the authoritative route registry. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `EDU-LESSON-API-01` | `POST` | `/api/v1/education/lesson-bookings` | `EDU-03` | Authenticated adult student; student/purchaser selects an occurrence and owns the booking request. | `201` `BookLessonSuccess` |
| `EDU-LESSON-API-02` | `POST` | `/api/v1/education/lesson-packs/purchases` | `EDU-04` | Authenticated adult purchaser; purchaser may buy only an allowed teacher/academy rate line. | `201` `PurchasePackSuccess` |
| `EDU-LESSON-API-03` | `POST` | `/api/v1/education/lesson-occurrences/{occurrenceId}/settlements` | `EDU-05` | Authenticated booking student, purchaser, or assigned teacher; actor is checked against the occurrence. | `200` `SettleLessonSuccess` |
| `EDU-LESSON-API-04` | `POST` | `/api/v1/education/lesson-occurrences/{occurrenceId}/room-joins` | `EDU-06` | Authenticated named participant or consented observer; identity must match an occurrence role. | `201` `JoinRoomSuccess` |
| `EDU-LESSON-API-05` | `POST` | `/api/v1/education/lesson-occurrences/{occurrenceId}/close` | `EDU-07` | Authenticated assigned adult teacher; teacher owns the teaching relationship. | `200` `CloseLessonSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-context verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Safeguarding decision service | `{occurrenceId, actorId, profile, contextVersion}` → `{allowed, decisionVersion, denialCode}` | 450 ms | 2 retries at 75 ms/225 ms, never retry a denial | Open after 5 failures/30 s; join/booking fail closed with `503` and no participant disclosure; half-open after 20 s. |
| Payment provider | `{paymentIntentId, amountMinor, currency, idempotencyKey, policyHash}` → `{providerIntentId, status, authorizedAmount}` | 1,200 ms | 2 retries at 150 ms/450 ms using same provider key, only on timeout/5xx | Open after 4 failures/60 s; no ledger commit without a confirmed effect; half-open after 30 s. |
| Room provider | `{occurrenceId, actorIdentity, role, safeguardingDecisionVersion}` → `{roomToken, expiresAt, providerSessionId}` | 800 ms | 2 retries at 100 ms/300 ms, same request key | Open after 5 failures/30 s; join returns `503` without presence; half-open after 20 s. |
| In-person evidence verifier | `{occurrenceId, teacherAssertion, evidenceHash}` → `{accepted, recordedAt, verifierVersion}` | 600 ms | 2 retries at 100 ms/300 ms; no duplicate assertion | Open after 4 failures/30 s; close stores pending evidence and scheduler evaluates seven-day fallback; half-open after 20 s. |

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
const Context = z.object({ actingContextId: Uuid, expectedVersion: z.int().nonnegative().optional() }).strict();
export const ApiErrorSchema = z.object({
  code: z.string().min(1), message: z.string().min(1), requestId: Uuid, details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema),
}).strict();

export const BookLessonRequest = z.object({
  ...Context.shape, idempotencyKey: Key, occurrenceId: Uuid, rateCardLineId: Uuid,
  rateCardVersion: z.int().positive(), policyVersion: z.int().positive(), safeguardingProfile: z.enum(["adult", "future_minor_remote", "future_minor_in_person", "future_minor_group"]),
  trial: z.boolean(), displayedTermsHash: z.string().length(64).regex(/^[a-f0-9]+$/), paymentMethodId: Uuid.nullable(), creditAccountId: Uuid.nullable(),
}).strict().superRefine((v, c) => {
  if (v.paymentMethodId === null && v.creditAccountId === null) c.addIssue({ code: "custom", path: ["creditAccountId"], message: "one payment or credit source required" });
});
export const BookLessonSuccess = z.object({ bookingId: Uuid, seriesId: Uuid, occurrenceId: Uuid, state: z.literal("booked"), policyVersion: z.int().positive(), rateCardVersion: z.int().positive(), version: z.int().positive() }).strict();

export const PurchasePackRequest = z.object({
  ...Context.shape, idempotencyKey: Key, rateCardLineId: Uuid, rateCardVersion: z.int().positive(), policyVersion: z.int().positive(),
  units: z.int().min(1).max(100), currency: z.string().length(3).regex(/^[A-Z]{3}$/), amountMinor: z.int().nonnegative(), taxMinor: z.int().nonnegative(),
  fxQuoteVersion: z.int().positive(), revenueShareVersion: z.int().positive(), autoRenew: z.boolean(), paymentMethodId: Uuid,
  displayedTermsHash: z.string().length(64).regex(/^[a-f0-9]+$/),
}).strict();
export const PurchasePackSuccess = z.object({ purchaseId: Uuid, creditAccountId: Uuid, creditEventId: Uuid, units: z.int().positive(), currency: z.string().length(3), residualExpiryAt: DateTime.nullable(), state: z.literal("committed"), version: z.int().positive() }).strict();

export const SettleLessonRequest = z.object({
  ...Context.shape, idempotencyKey: Key, occurrenceId: Uuid, action: z.enum(["cancel", "no_show", "make_up"]), reason: z.string().trim().min(1).max(500).optional(), policyVersion: z.int().positive(), evidenceVersion: z.int().positive().optional(),
}).strict();
export const SettleLessonSuccess = z.object({ occurrenceId: Uuid, state: z.enum(["cancelled", "no_show", "no_fault", "partial"]), creditEventId: Uuid.nullable(), creditDeltaUnits: z.int(), version: z.int().positive() }).strict();

export const JoinRoomRequest = z.object({
  ...Context.shape, idempotencyKey: Key, occurrenceId: Uuid, role: z.enum(["participant", "observer"]), consentVersion: z.int().positive().optional(), device: z.object({ kind: z.enum(["browser", "app"]), clientVersion: z.string().trim().min(1).max(40) }).strict(),
}).strict().superRefine((v, c) => { if (v.role === "observer" && v.consentVersion === undefined) c.addIssue({ code: "custom", path: ["consentVersion"], message: "observer consent required" }); });
export const JoinRoomSuccess = z.object({ presenceId: Uuid, roomId: Uuid, providerSessionId: Uuid, role: z.enum(["participant", "observer"]), joinedAt: DateTime, version: z.int().positive() }).strict();

export const CloseLessonRequest = z.object({
  ...Context.shape, idempotencyKey: Key, occurrenceId: Uuid, sessionRecord: z.object({ summary: z.string().trim().max(4000), nextAssignment: z.string().trim().max(2000).nullable() }).strict(), inPersonEvidenceHash: z.string().length(64).regex(/^[a-f0-9]+$/).optional(),
}).strict();
export const CloseLessonSuccess = z.object({ occurrenceId: Uuid, state: z.enum(["delivered", "partial", "no_show", "no_fault"]), deliveryEligible: z.boolean(), creditEventId: Uuid.nullable(), sessionRecordId: Uuid.nullable(), version: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `EDU-LESSON-API-01` | `BookLessonRequest` | `BookLessonSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-LESSON-API-02` | `PurchasePackRequest` | `PurchasePackSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,502,503` |
| `EDU-LESSON-API-03` | `SettleLessonRequest` | `SettleLessonSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-LESSON-API-04` | `JoinRoomRequest` | `JoinRoomSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-LESSON-API-05` | `CloseLessonRequest` | `CloseLessonSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `EDU-LESSON-API-01` | Require adult student, published occurrence/rate line, displayed matching policy/rate/safeguarding versions, one valid payment/credit source, and one trial per teacher/student. Known minor returns `AGE_GATE_DISABLED`; safeguard denial returns `SAFEGUARDING_FAILED`; insufficient entitlement returns `CREDIT_UNAVAILABLE`; changed terms return `POLICY_CONFLICT` or `VERSION_CONFLICT`. |
| `EDU-LESSON-API-02` | Require adult purchaser, owned teacher/academy rate line, current price/currency/tax/FX/revenue-share/policy snapshots, `units 1..100`, and explicit auto-renew boolean. Provider effect is not attempted after schema, authority, or policy mismatch; expiry creates residual value. |
| `EDU-LESSON-API-03` | Require booking actor, occurrence state `booked` or `room_open`, pinned policy version, action-specific clock/evidence, and no joint presence before cancellation. No-show is impossible before scheduled end and is vacated by five minutes of joint presence; make-up is policy-authorized only. |
| `EDU-LESSON-API-04` | Require identity-bound named participant or consented observer, occurrence in `booked` or `room_open`, live safeguarding decision, and current room. Reject anonymous/link/dial-in with `ROOM_IDENTITY_REQUIRED`; no denial writes presence. |
| `EDU-LESSON-API-05` | Require assigned teacher and `room_open` or valid in-person assertion; compute concurrent server presence against scheduled duration; accept session record as secondary private data. Below 50% returns `DELIVERY_EVIDENCE_INSUFFICIENT` classification; missing in-person evidence after seven days returns credit. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `EDU-LESSON-API-01` | `VALIDATION_FAILED`, `FORBIDDEN`, `AGE_GATE_DISABLED`, `SAFEGUARDING_FAILED`, `CREDIT_UNAVAILABLE`, `POLICY_CONFLICT`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for known occurrence without booking ability; `404` hides an unpublished/unknown occurrence. | Required 24 h; hash includes occurrence, versions, trial flag, source and terms hash. Matching replay returns original booking; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 bookings/hour/student; 30/minute/teacher occurrence. | Log operationId, requestId, actor hash, occurrenceId, versions, outcome, credit/payment mode; redact payment method, age and safeguarding reason. |
| `EDU-LESSON-API-02` | `VALIDATION_FAILED`, `FORBIDDEN`, `POLICY_CONFLICT`, `VERSION_CONFLICT`, `PAYMENT_AUTH_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for purchaser lacking party scope; `404` for hidden rate line. | Required 24 h and provider idempotency key; replay returns original purchase/ledger event; different hash returns `IDEMPOTENCY_MISMATCH`. | 5 purchases/hour/purchaser; 20/hour/rate owner. | Log operationId, requestId, purchaseId, actor hash, currency, units, provider status and result code; never raw payment credentials or exact private tax data. |
| `EDU-LESSON-API-03` | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT`, `POLICY_CONFLICT`, `CREDIT_UNAVAILABLE`, `DELIVERY_EVIDENCE_INSUFFICIENT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonbooking actor; `404` hides an unknown occurrence. | Required 24 h; hash includes occurrence/action/policy/evidence version. Same key returns settlement; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 settlement commands/hour/actor; scheduler has one claim/minute/occurrence. | Log operationId, requestId, occurrenceId, action, policy version, winning actor role, credit event ID, result; redact reason text. |
| `EDU-LESSON-API-04` | `VALIDATION_FAILED`, `FORBIDDEN`, `ROOM_IDENTITY_REQUIRED`, `SAFEGUARDING_FAILED`, `AGE_GATE_DISABLED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for a known occurrence role denied; `404` for hidden occurrence. | Required 15 minutes; hash includes occurrence, role, consent and device class. Replay returns the existing presence/token metadata; mismatch returns `IDEMPOTENCY_MISMATCH`. | 6 joins/minute/identity/occurrence; 30/minute/party. | Log operationId, requestId, occurrenceId, role, decision code, provider session status and latency; never log tokens, participant list or denial predicate. |
| `EDU-LESSON-API-05` | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT`, `DELIVERY_EVIDENCE_INSUFFICIENT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonassigned teacher; `404` hides unknown occurrence. | Required 24 h; hash includes occurrence, evidence hash/version and session-record hash. Replay returns the committed delivery projection; mismatch returns `IDEMPOTENCY_MISMATCH`. | 5 close commands/hour/teacher/occurrence; scheduler claims once/hour. | Log operationId, requestId, occurrenceId, presence duration bucket, evidence status, state, credit event ID and session-record status; never summary text or audio. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `education`, use UUID primary keys, `created_at`/`updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Credit events are append-only; BE00 migration, encryption, audit, and service-role policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `lesson_series` | `id uuid PK`; `teacher_party_id uuid NOT NULL FK party`; `student_party_id uuid NOT NULL FK party`; `purchaser_party_id uuid NULL FK party`; `rate_card_line_id uuid NOT NULL FK rate_card_line`; `recurrence_rule jsonb NOT NULL CHECK object`; `timezone text NOT NULL`; `mode text NOT NULL CHECK remote/in_person`; `safeguarding_profile text NOT NULL CHECK adult/future_minor_remote/future_minor_in_person/future_minor_group`; `state text NOT NULL CHECK active/paused/ended`; `version bigint NOT NULL`. | `(teacher_party_id, state)`; `(student_party_id, state)`; `(rate_card_line_id, version)`. | Parties select their own series; teacher may update schedule under CAS; purchaser sees only own commercial fields; no anon grant; worker may end series. |
| `lesson_occurrence` | `id uuid PK`; `series_id uuid NOT NULL FK lesson_series ON DELETE RESTRICT`; `starts_at timestamptz NOT NULL`; `ends_at timestamptz NOT NULL CHECK ends_at>starts_at`; `materialization_source text NOT NULL CHECK recurrence/manual/make_up`; `rate_card_line_version bigint NOT NULL`; `policy_version bigint NOT NULL FK cancellation_policy_version`; `location_ref text NULL`; `room_id uuid NULL FK lesson_room`; `state text NOT NULL CHECK booked/cancelled/room_open/delivered/partial/no_show/no_fault/closed`; `version bigint NOT NULL`. | Unique `(series_id, starts_at)`; `(starts_at, state)`; `(room_id)`; `(policy_version)`. | Participants and assigned teacher select safe occurrence fields; only teacher/booking service updates state; location is party-scoped; anon no grant. |
| `lesson_credit_account` | `id uuid PK`; `owner_party_id uuid NOT NULL FK party`; `scope_party_id uuid NOT NULL FK party`; `currency char(3) NOT NULL CHECK uppercase ISO-4217`; `unit_balance integer NOT NULL CHECK >=0`; `residual_minor bigint NOT NULL CHECK >=0`; `expires_at timestamptz NULL`; `state text NOT NULL CHECK active/expired/closed`; `version bigint NOT NULL`. | Unique `(owner_party_id, scope_party_id, currency) WHERE state='active'`; `(expires_at, state)`; `(owner_party_id, updated_at DESC)`. | Owner/purchaser sees balance; service role alone changes balance through ledger RPC; teacher cannot read a student's balance; no anon grant. |
| `lesson_credit_event` | `id uuid PK`; `account_id uuid NOT NULL FK lesson_credit_account`; `event_kind text NOT NULL CHECK purchase/reserve/return/burn/earn/residual/make_up_grant/refund`; `lesson_unit_delta integer NOT NULL`; `residual_minor_delta bigint NOT NULL`; `currency char(3) NOT NULL`; `occurrence_id uuid NULL FK lesson_occurrence`; `cause text NOT NULL`; `actor_party_id uuid NOT NULL FK party`; `idempotency_key text NOT NULL`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(account_id, idempotency_key)`; `(occurrence_id, event_kind)`; `(account_id, created_at)`; partial `(event_kind)`. | Append-only insert through ledger RPC/service role; owner selects redacted history; teacher sees only earned settlement projection; no update/delete/anon grants. |
| `cancellation_policy_version` | `id uuid PK`; `owner_party_id uuid NOT NULL FK party`; `version_number bigint NOT NULL CHECK >0`; `rules jsonb NOT NULL CHECK object`; `effective_from timestamptz NOT NULL`; `effective_to timestamptz NULL CHECK > effective_from`; `hash char(64) NOT NULL`; `state text NOT NULL CHECK draft/active/retired`; `created_at timestamptz NOT NULL`. | Unique `(owner_party_id, version_number)`; `(owner_party_id, state, effective_from DESC)`; `(hash)`. | Owner/authorized agency manages drafts; published policy is read-only to booking actors; student sees pinned copy; no anon direct table grant. |
| `lesson_room` | `id uuid PK`; `occurrence_id uuid NOT NULL UNIQUE FK lesson_occurrence`; `provider_room_id uuid NOT NULL`; `state text NOT NULL CHECK provisioned/open/closed/expired`; `identity_policy text NOT NULL CHECK named_only`; `expires_at timestamptz NOT NULL`; `safeguarding_decision_version bigint NOT NULL`; `version bigint NOT NULL`. | Unique `(provider_room_id)`; `(occurrence_id, state)`; `(expires_at, state)`. | Participants receive one-time provider token through API; raw provider ID/token is service-only; teacher sees room state; no anon grant. |
| `lesson_presence` | `id uuid PK`; `occurrence_id uuid NOT NULL FK lesson_occurrence`; `participant_party_id uuid NOT NULL FK party`; `role text NOT NULL CHECK participant/observer`; `joined_at timestamptz NOT NULL`; `left_at timestamptz NULL CHECK > joined_at`; `concurrent_ms bigint NOT NULL CHECK >=0`; `observer_consent_version bigint NULL`; `server_evidence_hash char(64) NOT NULL`; `version bigint NOT NULL`. | Unique `(occurrence_id, participant_party_id, role, joined_at)`; `(occurrence_id, joined_at)`; `(participant_party_id, created_at DESC)`. | Participant sees own presence; assigned teacher sees occurrence presence totals, not observer private metadata; service role writes server stamps; no public insert. |
| `lesson_session_record` | `id uuid PK`; `occurrence_id uuid NOT NULL UNIQUE FK lesson_occurrence`; `teacher_party_id uuid NOT NULL FK party`; `summary_ciphertext bytea NOT NULL`; `next_assignment_ciphertext bytea NULL`; `captured_at timestamptz NOT NULL`; `write_status text NOT NULL CHECK pending/committed/failed`; `retention_until timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(occurrence_id)`; `(teacher_party_id, captured_at DESC)`; `(write_status, updated_at)`. | Assigned teacher selects/decrypts own record; student receives only explicitly shared safe fields; quality worker may retry status; no log/plaintext/anon access. |

### State, Concurrency and Transaction Rules

- Occurrence state is `booked → room_open → delivered|partial|no_show|no_fault → closed`; cancellation is allowed only from `booked|room_open` before joint presence, and `no_show` cannot be selected before scheduled end. All transitions use a row lock plus `expectedVersion`.
- A booking transaction locks occurrence, verifies current rate/policy/safeguarding, reserves a credit or confirms payment authorization, creates series/occurrence and booking event, and commits the outbox record. A failed provider/ledger step rolls back every local effect.
- Pack purchase confirms provider payment before creating `purchase` credit event and liability; a provider timeout leaves a recoverable pending intent, never a guessed charge or ledger entry. Expiry creates a `residual` event with redeemable value and does not pay the teacher.
- Settlement locks occurrence and account, evaluates the booking-pinned policy and server evidence, appends exactly one `return|burn|make_up_grant|refund` event, and updates occurrence in one transaction. A loser receives `VERSION_CONFLICT` and cannot create a second credit movement.
- Join writes presence only after identity and safeguarding succeed. Close computes interval union from server-stamped presence; at least 50% scheduled duration is `delivered`, below that is `partial|no_show|no_fault` according to evidence. Session-record failure queues private retry without reversing delivery.

### Grants, RLS and Retention

`education_api` receives execute on booking, ledger, room, and close RPCs; `education_worker` receives outbox, expiry, and evidence updates; `education_migrator` owns DDL. RLS uses BE00 `current_actor_id()` and `current_acting_context_id()`. Presence/room records retain seven years for dispute/audit; encrypted session notes retain seven years or policy minimum; provider tokens expire at room close.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `EDU-LESSON-API-01` | `student_adult`; may book as purchaser only where current relationship permits; occurrence must be published/bookable. | `403 FORBIDDEN` for known occurrence without booking role; `404` for unknown/unpublished occurrence. |
| `EDU-LESSON-API-02` | `purchaser_adult`; rate owner/academy must expose the current line; payment method belongs to actor. | `403 FORBIDDEN` for disallowed purchaser/line; `404` hides unknown or unpublished rate line. |
| `EDU-LESSON-API-03` | Booking `student`, purchaser, or assigned teacher; actor is named on occurrence. | `403 FORBIDDEN` for known nonactor; `404` hides an unknown occurrence. |
| `EDU-LESSON-API-04` | Named participant or consented observer with a current identity binding. | `403` for a known role blocked by policy; `404` hides occurrence; `ROOM_IDENTITY_REQUIRED` never lists participants. |
| `EDU-LESSON-API-05` | Assigned adult teacher under current acting context. | `403 FORBIDDEN` for another teacher; `404` hides unknown occurrence. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `EDU-LESSON-API-01` | `requestId` → `strictCors(educationCommandOrigins)` → `requireAuth` → `requireAdultStudent` → `resolveActingContext` → `rateLimit(lessonBooking)` → `parseZod(BookLessonRequest)` → `idempotency(24h)` → `authorizeBookableOccurrence` → `transaction` → `audit`. |
| `EDU-LESSON-API-02` | `requestId` → `strictCors(educationPaymentOrigins)` → `requireAuth` → `requireAdultPurchaser` → `resolveActingContext` → `rateLimit(packPurchase)` → `parseZod(PurchasePackRequest)` → `idempotency(24h)` → `authorizeRateLine` → `paymentAndLedgerTransaction` → `audit`. |
| `EDU-LESSON-API-03` | `requestId` → `strictCors(educationCommandOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(lessonSettlement)` → `parseZod(SettleLessonRequest)` → `idempotency(24h)` → `authorizeOccurrenceActor` → `settlementTransaction` → `audit`. |
| `EDU-LESSON-API-04` | `requestId` → `strictCors(educationRoomOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(roomJoin)` → `parseZod(JoinRoomRequest)` → `idempotency(15m)` → `authorizeNamedIdentity` → `safeguardingGate` → `roomProvider` → `presenceTransaction` → `audit`. |
| `EDU-LESSON-API-05` | `requestId` → `strictCors(educationCommandOrigins)` → `requireAuth` → `requireAdultTeacher` → `resolveActingContext` → `rateLimit(lessonClose)` → `parseZod(CloseLessonRequest)` → `idempotency(24h)` → `authorizeAssignedTeacher` → `presenceEvaluator` → `deliveryTransaction` → `audit`. |

### Security and Privacy Controls

Use parameterized SQL, opaque occurrence/room IDs, encrypted session summaries, server clock only for presence, and one-time short-lived room tokens. Do not accept client attendance duration, payment status, safeguarding truth, or policy text as authoritative. No bearer-link, dial-in, anonymous, or shared-room access. CORS never permits `*` with credentials; cache-control is `private, no-store` for booking, credit, room, presence, and session responses.

## Data Flow

1. BE00 authenticates the adult actor, validates strict Zod input, and reserves the idempotency key.
2. Booking reads pinned versions and safeguarding, then atomically creates occurrence state plus payment/credit hold and `education.lesson-booking.changed.v1`.
3. Pack purchase authorizes payment, appends purchase liability and `education.credit-event.recorded.v1`; settlement later appends reservation/return/burn/make-up/refund events.
4. Join asks safeguarding and the room provider for an identity-bound token, then writes server presence. A denial returns before presence mutation.
5. Close computes server-presence evidence, transitions the occurrence and credit outcome, writes `education.lesson-delivery.recorded.v1`, and queues private session-record retry if needed.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `education.lesson-booking.changed.v1` | `{eventId, bookingId, seriesId, occurrenceId, teacherPartyId, studentPartyId, state, rateCardLineVersion, policyVersion, safeguardingProfile, version, occurredAt}`; no payment credentials or denial details. | Room provisioner, credit reservation projector, trial converter, notifications. At-least-once, ordered by occurrence/version, dedupe by eventId. |
| `education.credit-event.recorded.v1` | `{eventId, creditEventId, accountId, eventKind, lessonUnitDelta, residualMinorDelta, currency, occurrenceId?, cause, version, occurredAt}`; account owner is scoped. | Purchaser/student ledger view, finance liability adapter, settlement projector. At-least-once, dedupe by creditEventId; no raw payment details. |
| `education.lesson-delivery.recorded.v1` | `{eventId, occurrenceId, presencePredicate, state, sessionRecordStatus, creditEventId?, version, occurredAt}`; duration is bucketed. | Cancellation/earnings/private-quality workers. Ordered per occurrence; no session summary or participant list. |

Workers reject stale versions, preserve the last safe projection, retry at 2s/8s/32s, and dead-letter after five attempts with an alert. Event consumers use the BE00 `requestId`/`correlationId` envelope.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Schema, policy, age, safeguarding or ownership failure | Return typed `ApiError` before mutation/provider effect; no booking, ledger, presence or room side effect. |
| Payment timeout/decline | Keep provider intent recoverable, do not create credit liability; replay same idempotency key reconciles provider status. |
| Credit ledger conflict | Roll back booking/settlement transaction; return `CREDIT_UNAVAILABLE` or `VERSION_CONFLICT`; retry with same key only. |
| Cancellation/no-show race | Lock occurrence; earlier valid cancellation wins; loser sees `VERSION_CONFLICT`; no partial credit movement. |
| Room/safeguarding outage | Fail closed with `503`; no presence or attendance evidence; retry via same key. |
| Session record failure | Keep earned delivery/credit outcome, store encrypted pending task, retry 2s/8s/32s; notify private teacher quality only. |
| Missing in-person evidence after seven days | Worker atomically appends `return`/`no_fault`, closes occurrence, and emits delivery/credit events; never burns credit on absent evidence. |
| Duplicate event/provider callback | Dedupe by event/provider ID and idempotency key; acknowledge without a second effect. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `EDU-LESSON-API-01` | Strict request, trial flag, terms hash, exact `201` and error envelope. | Adult/minor gate, safeguarding, trial uniqueness, participant ownership, CORS/rate. | Pinned versions, payment/credit hold atomicity, CAS and replay. | Provider timeout, rollback, booking event dedupe, requestId and redaction. |
| `EDU-LESSON-API-02` | Currency/units/bounds, auto-renew explicit, exact response and errors. | Purchaser/rate ownership, payment credentials isolation, policy confirmation. | Provider-before-ledger, liability event, residual expiry and replay. | Decline/timeout/breaker, reconciliation, metrics and no double charge. |
| `EDU-LESSON-API-03` | Action/state/clock/evidence validation, exact settlement union. | Actor roles, policy consequence disclosure, race and no-oracle errors. | Row lock, one credit event, return/burn/make-up semantics, CAS. | Scheduler retries, late cancel/no-show race, outbox dedupe and audit. |
| `EDU-LESSON-API-04` | Named role/consent/device schema and strict `201`. | Anonymous/link/dial-in rejection, safeguarding fail closed, token secrecy, CORS. | Presence only after provider success, one replayed presence. | Room timeout/breaker, denial has no row, latency and decision redaction. |
| `EDU-LESSON-API-05` | Session record bounds and exact delivery response. | Assigned teacher, server clock, no client duration/evidence trust. | 50% interval union, state/CAS, delivery/credit event, session task. | Evidence outage/seven-day worker, secondary write failure, event replay/audit. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, operation/error matrices, and deterministic state transitions. PostgreSQL tests run RLS and unique/append-only constraints. Adapter tests exercise exact timeout, retry count/backoff, breaker, provider idempotency, and reconciliation. Worker tests prove at-least-once event dedupe and seven-day evidence recovery. Playwright covers adult booking, pack purchase, cancel/no-show, keyboard-accessible room refusal, join/close, safe error copy, and narrow viewport. The gate fails on any route collision, missing operation ID row, non-`ApiError` response, or secret/PII leakage.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all five routes have strict request/success/error schemas, bounded fields, nullability, statuses, and exact error envelope.
- **Pass 2 — macro boundary:** payment, identity, safeguarding, room, evidence and BE00 ownership are seams with no duplicated platform route.
- **Pass 3 — lifecycle/race:** booking, credits, occurrence, presence and close state machines use CAS, locks, one settlement and deterministic precedence.
- **Pass 4 — failure/abuse:** retries, breakers, provider reconciliation, no anonymous room, no partial ledger movement, seven-day fallback, and idempotent workers are executable rules.
- **Pass 5 — data/privacy:** every canonical model has typed fields, constraints, indexes, RLS/grants, encryption/retention, and event redaction.

## Ambiguity Gate

**PASS.** The split is source-aligned (`EDU-03`–`EDU-07`), every route is registered once with six cells, each operation has exact Zod 4 request/success/error contracts, auth/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, retries, and tests. Payment, identity, safeguarding, room, and in-person evidence seams have exact timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 15 and deep dive; locked booking, entitlement, settlement, identity-bound room, and delivery evidence contracts. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox, and shared middleware.
- [BE Shard 15a — Teacher facets, discovery and trials](15a-teacher-facets-discovery-trials.md) for trial relationship and teacher rate discovery inputs.
- [BE Shard 15c — Curriculum, feedback and practice](15c-curriculum-feedback-practice.md) for assignments and feedback after delivery.
- [BE Shard 15d — Groups, mentorship and learning paths](15d-group-mentorship-learning-paths.md) for group delivery and education audit conventions.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for read-only vetting/safeguarding evidence projections.
