# Group Classes, Mentorship & Learning Paths — Backend Specification

**Status:** Complete
**IA source:** [Shard 15 — Education delivery](../ia/15-education-delivery.md)
**Deep-dive source:** [Deep Dive 15 — Education delivery](../ia/deep-dives/15-education-delivery.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns viable group-class formation, fixed-term mentorship agreements and check-ins, and learner enrollment/self-placement in curated learning paths. It contains `EDU-14`, `EDU-15`, and `EDU-16`. Teacher facets, lesson booking/delivery, curriculum artifacts, feedback, and practice remain in sibling specifications. Safeguarding, payment/refund, curriculum-unit resolution, identity, and notification delivery are external seams.

## Classification

- **Type:** multi-party cohort/relationship command boundary with a read/versioned learning-path enrollment projection.
- **Boundary:** `group_class`, `cohort_enrollment`, `mentorship`, `mentorship_checkin`, `learning_path`, `path_enrollment`, and `education_audit_event` ownership; payment/refund, unit catalog, safeguarding, identity, and notification systems are seams.
- **Expected operations:** three HTTP operations, one for each assigned IA interaction (`EDU-14`, `EDU-15`, `EDU-16`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** group rosters and safeguards are frozen before activation; viability failure cancels and refunds every participant; mentorship is adult-only, scarce-capacity and fixed-term with no lesson semantics; paths disclose current total cost and allow self-placement without prerequisites.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `15-education-delivery.md` | `Overview`, `Features`, `Delivery Phases`, `Acceptance Criteria` lines 9–60 | Group, mentorship and path scope, viability, fixed term, cost disclosure. |
| `15-education-delivery.md` | `Interactions` lines 62–83 | Exact `EDU-14`, `EDU-15`, and `EDU-16` preconditions, outcomes and refusal behavior. |
| `15-education-delivery.md` | `Contracts` lines 94–135 | Group/mentorship/path command and state rules; `ApiError { code, message, requestId, details }` envelope and closed error codes. |
| `15-education-delivery.md` | `Data Models` and typed registry lines 136–192 | Canonical cohort, mentorship, path, enrollment, and audit model names. |
| `15-education-delivery.md` | `Access Control`, `Access Escalation`, `Accessibility` lines 193–224 | Organizer/mentor/mentee/learner roles, consent and accessible enrollment/refusal. |
| `15-education-delivery.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 226–283 | Group/mentorship events, capacity races, cancellation/refund and deletion rules. |
| `15-education-delivery.md` | `Cross-Shard Dependencies`, `Dependency References` lines 285–312 | Safeguarding, payment/refund, unit catalog, relationship and platform dependencies. |
| `deep-dives/15-education-delivery.md` | `Canonical Field Contracts`, `State Machines` lines 20–45 | Typed fields and group/mentorship/path state transitions. |
| `deep-dives/15-education-delivery.md` | `Group, Mentorship and Path Algorithm`, `Abuse and Recovery Verification` lines 92–114 | Threshold activation, fixed-term capacity, cost/version disclosure, recovery and privacy. |
| `deep-dives/15-education-delivery.md` | `Cross-Shard Contracts`, `Implementation Envelope` lines 116–134 | Versioned seam inputs, idempotent refund/enrollment and bounded command envelope. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor context, replay ledger, limits, audit and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Supabase/RLS, PII isolation, Zod-first contracts, and production verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `EDU-14` Run group class | Organizer freezes roster, threshold, schedule, refund and group safeguards; below threshold becomes `cancelled_refunded`; safeguards never relax to 1:1. | `EDU-GRP-API-01` | `group_class`, `cohort_enrollment`; `education.group-class.changed.v1` |
| `EDU-15` Run mentorship | Adult mentor/mentee, fixed term/end/goals/cadence, expected 1–3 capacity, no lesson/cancellation/curriculum semantics, deliberate completion/cancellation. | `EDU-GRP-API-02` | `mentorship`, `mentorship_checkin`; `education.mentorship.changed.v1` |
| `EDU-16` Follow learning path | Upfront current total/requirements, resolved units, self-placement anywhere, explicit gap/recomputed total on removal, current-cost re-confirmation, duplicate returns existing. | `EDU-GRP-API-03` | `learning_path`, `path_enrollment`, `education_audit_event` |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `EDU-14` | `EDU-GRP-API-01` | `POST /api/v1/education/group-classes` | `CreateGroupClassRequest` → `CreateGroupClassSuccess` (`201`) | Frozen roster/threshold/safeguarding, capacity CAS, payment/refund, event and typed `ApiError`. |
| `EDU-15` | `EDU-GRP-API-02` | `POST /api/v1/education/mentorships` | `CreateMentorshipRequest` → `CreateMentorshipSuccess` (`201`) | Adult-only roles, capacity, fixed term, no cross-semantic reuse, check-in schedule, and typed `ApiError`. |
| `EDU-16` | `EDU-GRP-API-03` | `POST /api/v1/education/learning-path-enrollments` | `EnrollPathRequest` → `EnrollPathSuccess` (`201`) | Cost/version disclosure, unit resolution/gaps, self-placement, duplicate replay, RLS and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `EDU-GRP-API-01` | `POST` | `/api/v1/education/group-classes` | `EDU-14` | Authenticated adult organizer/teacher; organizer owns roster and class policy. | `201` `CreateGroupClassSuccess` |
| `EDU-GRP-API-02` | `POST` | `/api/v1/education/mentorships` | `EDU-15` | Authenticated adult mentor proposing or adult mentee accepting; capacity owner is mentor. | `201` `CreateMentorshipSuccess` |
| `EDU-GRP-API-03` | `POST` | `/api/v1/education/learning-path-enrollments` | `EDU-16` | Authenticated learner; learner owns enrollment and selected placement. | `201` `EnrollPathSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-context verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Group safeguarding evaluator | `{classId, rosterHash, profile, participantIds, contextVersion}` → `{allowed, decisionVersion, controls}` | 500 ms | 2 retries at 100 ms/300 ms; never retry a denial | Open after 5 failures/30 s; class creation/activation fails closed; half-open after 20 s. |
| Payment/refund adapter | `{classId, participantId, amountMinor, currency, refundPolicyHash, idempotencyKey}` → `{paymentId, status, refundId?}` | 1,200 ms | 2 retries at 150 ms/450 ms on timeout/5xx using same key | Open after 4 failures/60 s; class stays pending/refund queue durable; half-open after 30 s. |
| Unit catalog/version resolver | `{pathId, costVersion, unitRefs[]}` → `{resolvedUnits[], gaps[], totalMinor, currency, catalogVersion}` | 600 ms | 2 retries at 100 ms/300 ms for same version | Open after 4 failures/30 s; enrollment returns `503` without writing; half-open after 20 s. |
| Notification scheduler | `{aggregateId, eventType, audience, sendAt, dedupeKey}` → `{jobId, accepted}` | 400 ms | 2 retries at 75 ms/225 ms with dedupe key | Open after 5 failures/30 s; agreement/class remains committed and scheduler retries; half-open after 20 s. |

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
export const ApiErrorSchema = z.object({ code: z.string().min(1), message: z.string().min(1), requestId: Uuid, details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema) }).strict();

export const CreateGroupClassRequest = z.object({
  ...Context.shape, idempotencyKey: Key, classId: Uuid.nullable(), organizerPartyId: Uuid, title: z.string().trim().min(1).max(160),
  roster: z.array(z.object({ partyId: Uuid, role: z.enum(["student", "teacher", "observer"]), consentVersion: z.int().positive().optional() }).strict()).min(2).max(100),
  viabilityThreshold: z.int().min(2).max(100), capacity: z.int().min(2).max(100), startsAt: DateTime, endsAt: DateTime,
  currency: z.string().length(3).regex(/^[A-Z]{3}$/), priceMinor: z.int().nonnegative(), refundPolicyVersion: z.int().positive(), safeguardingProfile: z.enum(["adult", "future_minor_group"]),
}).strict().superRefine((v, c) => {
  if (v.viabilityThreshold > v.capacity) c.addIssue({ code: "custom", path: ["viabilityThreshold"], message: "threshold cannot exceed capacity" });
});
export const CreateGroupClassSuccess = z.object({ classId: Uuid, state: z.enum(["enrolling", "active", "cancelled_refunded"]), enrolledCount: z.int().nonnegative(), viabilityThreshold: z.int().positive(), version: z.int().positive() }).strict();

export const CreateMentorshipRequest = z.object({
  ...Context.shape, idempotencyKey: Key, mentorshipId: Uuid.nullable(), mentorPartyId: Uuid, menteePartyId: Uuid,
  startsAt: DateTime, endsAt: DateTime, goals: z.array(z.string().trim().min(1).max(500)).min(1).max(12), cadence: z.enum(["weekly", "biweekly", "monthly"]), capacitySnapshot: z.int().min(1).max(3), action: z.enum(["propose", "accept", "complete", "cancel"]), reason: z.string().trim().max(500).optional(),
}).strict().superRefine((v, c) => { if (v.endsAt <= v.startsAt) c.addIssue({ code: "custom", path: ["endsAt"], message: "term must end after start" }); if (v.mentorPartyId === v.menteePartyId) c.addIssue({ code: "custom", path: ["menteePartyId"], message: "mentor and mentee must differ" }); });
export const CreateMentorshipSuccess = z.object({ mentorshipId: Uuid, state: z.enum(["proposed", "active", "completed", "cancelled"]), startsAt: DateTime, endsAt: DateTime, version: z.int().positive() }).strict();

export const EnrollPathRequest = z.object({
  ...Context.shape, idempotencyKey: Key, pathId: Uuid, pathVersion: z.int().positive(), costVersion: z.int().positive(), disclosedTotalMinor: z.int().nonnegative(), currency: z.string().length(3).regex(/^[A-Z]{3}$/), disclosureHash: z.string().length(64).regex(/^[a-f0-9]+$/), placementUnitId: Uuid.nullable(), requirementsAcknowledged: z.boolean(),
}).strict().superRefine((v, c) => { if (!v.requirementsAcknowledged) c.addIssue({ code: "custom", path: ["requirementsAcknowledged"], message: "current requirements must be acknowledged" }); });
export const EnrollPathSuccess = z.object({ enrollmentId: Uuid, pathId: Uuid, pathVersion: z.int().positive(), costVersion: z.int().positive(), totalMinor: z.int().nonnegative(), currency: z.string().length(3), placementUnitId: Uuid.nullable(), gaps: z.array(z.object({ unitId: Uuid, reason: z.string().min(1).max(200) }).strict()), state: z.literal("active"), version: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `EDU-GRP-API-01` | `CreateGroupClassRequest` | `CreateGroupClassSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,502,503` |
| `EDU-GRP-API-02` | `CreateMentorshipRequest` | `CreateMentorshipSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-GRP-API-03` | `EnrollPathRequest` | `EnrollPathSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `EDU-GRP-API-01` | Require adult organizer, roster consent/identity, `2 <= viabilityThreshold <= capacity <= 100`, ordered schedule, pinned refund version and exact `adult` or `future_minor_group` safeguard profile. Capacity race returns `VERSION_CONFLICT`; below threshold at decision point becomes `cancelled_refunded` and refunds every participant; group safeguards never relax to 1:1. |
| `EDU-GRP-API-02` | Require two distinct authenticated adults, fixed future term, one-to-three capacity snapshot, nonempty bounded goals and cadence. Reject lesson-credit/cancellation-policy/curriculum fields or semantics with `VALIDATION_FAILED`; full mentor capacity returns `FORBIDDEN`; complete/cancel are deliberate terminal actions and never auto-renew. |
| `EDU-GRP-API-03` | Require current path/cost version, disclosed total/currency/hash, resolved units and acknowledged requirements. Learner may self-place at any unit; removed/unavailable units become explicit gaps and total is recomputed; changed cost returns `POLICY_CONFLICT`; duplicate enrollment returns the stored enrollment. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `EDU-GRP-API-01` | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT`, `SAFEGUARDING_FAILED`, `PAYMENT_AUTH_FAILED`, `REFUND_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for nonorganizer/roster authority; `404` hides unknown class. | Required 24 h; hash includes roster hash, schedule, threshold/capacity, refund/safeguard versions. Matching replay returns class; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 class writes/hour/organizer; 100 enrollment changes/hour/class. | Log operationId, requestId, classId, roster count/hash, threshold, state, refund status and result; no participant names or guardian data. |
| `EDU-GRP-API-02` | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT`, `CAPACITY_UNAVAILABLE`, `DEPENDENCY_UNAVAILABLE`. `403` for nonadult/nonparty/full mentor; `404` hides unknown mentorship. | Required 24 h; hash includes parties, term, goals hash, action/version. Replay returns existing agreement/state; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 proposals/hour/mentor; 10 state changes/hour/agreement. | Log operationId, requestId, mentorshipId, party hashes, action, capacity snapshot, state and result; redact goals/check-in content. |
| `EDU-GRP-API-03` | `VALIDATION_FAILED`, `FORBIDDEN`, `POLICY_CONFLICT`, `VERSION_CONFLICT`, `UNIT_UNAVAILABLE`, `DEPENDENCY_UNAVAILABLE`. `403` for nonlearner/blocked enrollment; `404` hides unknown path. | Required 24 h; hash includes path/version/cost/hash/placement. Replay returns existing enrollment; mismatch returns `IDEMPOTENCY_MISMATCH`. | 20 enrollments/hour/learner; 5/path/minute per learner. | Log operationId, requestId, enrollment/path/version, cost version, gap count and result; redact total purchase details where policy requires. |

## Database Schema

### PostgreSQL Model Registry

All tables reside in `education`, use UUID primary keys, `created_at`/`updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Audit rows are append-only; BE00 migration/encryption/audit policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `group_class` | `id uuid PK`; `organizer_party_id uuid NOT NULL FK party`; `title text NOT NULL CHECK length 1..160`; `roster_hash char(64) NOT NULL`; `viability_threshold smallint NOT NULL CHECK 2..100`; `capacity smallint NOT NULL CHECK capacity>=viability_threshold`; `starts_at/ends_at timestamptz NOT NULL CHECK ends_at>starts_at`; `currency char(3) NOT NULL`; `price_minor bigint NOT NULL CHECK >=0`; `refund_policy_version bigint NOT NULL`; `safeguarding_profile text NOT NULL CHECK adult/future_minor_group`; `state text NOT NULL CHECK enrolling/active/cancelled_refunded/completed`; `version bigint NOT NULL`. | `(organizer_party_id, state)`; `(starts_at, state)`; unique `(organizer_party_id, starts_at, roster_hash)`; `(state, viability_threshold)`. | Organizer selects/updates own class until frozen; roster members see only their own enrollment and safe schedule; worker activates/cancels; anon no grant. |
| `cohort_enrollment` | `id uuid PK`; `class_id uuid NOT NULL FK group_class ON DELETE CASCADE`; `participant_party_id uuid NOT NULL FK party`; `role text NOT NULL CHECK student/teacher/observer`; `consent_version bigint NULL`; `payment_reference uuid NULL`; `state text NOT NULL CHECK pending/confirmed/refunded/removed`; `joined_at timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(class_id, participant_party_id)`; `(class_id, state)`; `(participant_party_id, state, joined_at DESC)`. | Participant selects own safe enrollment; organizer sees roster role/count after consent; payment worker updates refund state; no public/anon grant. |
| `mentorship` | `id uuid PK`; `mentor_party_id uuid NOT NULL FK party`; `mentee_party_id uuid NOT NULL FK party`; `starts_at/ends_at timestamptz NOT NULL CHECK ends_at>starts_at`; `goals_ciphertext bytea NOT NULL`; `cadence text NOT NULL CHECK weekly/biweekly/monthly`; `capacity_snapshot smallint NOT NULL CHECK 1..3`; `state text NOT NULL CHECK proposed/active/completed/cancelled`; `version bigint NOT NULL`. | Unique `(mentor_party_id, mentee_party_id, starts_at)`; `(mentor_party_id, state)`; `(mentee_party_id, state)`. | Mentor/mentee select own agreement; mentor may update state under CAS; goals encrypted and party-only; no lesson/credit/curriculum joins; anon no grant. |
| `mentorship_checkin` | `id uuid PK`; `mentorship_id uuid NOT NULL FK mentorship ON DELETE CASCADE`; `scheduled_at timestamptz NOT NULL`; `completed_at timestamptz NULL`; `notes_ciphertext bytea NULL`; `state text NOT NULL CHECK scheduled/completed/skipped`; `created_by_party_id uuid NOT NULL FK party`; `version bigint NOT NULL`. | Unique `(mentorship_id, scheduled_at)`; `(mentorship_id, state, scheduled_at)`; `(created_by_party_id, scheduled_at DESC)`. | Parties select/update own check-ins; notes encrypted; worker schedules; no public/anon grant. |
| `learning_path` | `id uuid PK`; `owner_party_id uuid NOT NULL FK party`; `title text NOT NULL CHECK length 1..160`; `description text NULL CHECK length<=4000`; `unit_refs jsonb NOT NULL CHECK array`; `requirements jsonb NOT NULL CHECK object`; `cost_version bigint NOT NULL`; `total_minor bigint NOT NULL CHECK >=0`; `currency char(3) NOT NULL`; `state text NOT NULL CHECK draft/published/retired`; `version bigint NOT NULL`. | Unique `(owner_party_id, cost_version)`; `(state, updated_at DESC)`; `(owner_party_id, title)`. | Owner manages draft; learner reads published snapshot; unit catalog worker updates availability version; no anon direct write. |
| `path_enrollment` | `id uuid PK`; `path_id uuid NOT NULL FK learning_path`; `learner_party_id uuid NOT NULL FK party`; `path_version bigint NOT NULL`; `cost_version bigint NOT NULL`; `disclosed_total_minor bigint NOT NULL CHECK >=0`; `currency char(3) NOT NULL`; `disclosure_hash char(64) NOT NULL`; `placement_unit_id uuid NULL`; `gaps jsonb NOT NULL CHECK array`; `state text NOT NULL CHECK active/completed/withdrawn`; `version bigint NOT NULL`. | Unique `(path_id, learner_party_id)`; `(learner_party_id, state, updated_at DESC)`; `(path_id, cost_version)`. | Learner selects/updates own placement; path owner sees enrollment aggregate only; unit resolver/service updates gaps; no public/anon grant. |
| `education_audit_event` | `id uuid PK`; `actor_party_id uuid NULL FK party`; `acting_context_id uuid NULL FK acting_context`; `aggregate_type text NOT NULL`; `aggregate_id uuid NOT NULL`; `event_name text NOT NULL`; `payload jsonb NOT NULL CHECK object`; `occurred_at timestamptz NOT NULL`; `correlation_id uuid NOT NULL`; `retention_until timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(correlation_id, event_name, aggregate_id, version)`; `(aggregate_type, aggregate_id, occurred_at)`; `(retention_until)`. | Append-only service/worker insert; security operators read redacted records; parties receive only their own audit projection; no update/delete/anon grant. |

### State, Concurrency and Transaction Rules

- Group class is `enrolling → active → completed` or `enrolling → cancelled_refunded`; roster, threshold, schedule, refund policy and `future_minor_group` safeguards freeze at activation. Activation locks class and enrollments, compares count to threshold/capacity, and either opens delivery or cancels/refunds every confirmed participant.
- Mentorship is `proposed → active → completed|cancelled`; capacity is checked and reserved with a mentor-row lock. Fixed `ends_at` is required; no scheduler may auto-renew or attach lesson-credit, cancellation-policy or curriculum semantics.
- Path enrollment stores disclosed path/cost versions and resolved-unit snapshot. Self-placement updates only learner-owned placement; missing units append explicit gaps and recompute total. A cost-version mismatch requires re-disclosure and confirmation.
- Group activation/refund and mentorship/path writes append an `education_audit_event` in the same transaction. Provider refund jobs use participant-scoped idempotency keys; a partial provider outage leaves remaining refunds queued and class state visible as `cancelled_refunded_pending_reconciliation` in the internal ledger, while the public response remains safe.
- All mutating commands use row locks plus `expectedVersion`; a loser receives `VERSION_CONFLICT` and cannot duplicate seats, agreements, refunds, enrollments, or audit rows.

### Grants, RLS and Retention

`education_api` receives execute on bounded cohort/mentorship/path RPCs; `education_worker` receives threshold, refund, unit, notification and audit writes; `education_migrator` owns DDL. RLS uses BE00 `current_actor_id()`/`current_acting_context_id()`. Goals/check-in notes are encrypted and party-only; audit retains seven years; payment references and roster PII are redacted from logs and public projections.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `EDU-GRP-API-01` | Adult organizer/teacher owns class, roster, threshold, schedule, refund and safeguarding profile; participants may only use enrollment routes in sibling command. | `403 FORBIDDEN` for nonorganizer or missing roster authority; `404` hides unknown class. |
| `EDU-GRP-API-02` | Adult mentor proposes/owns capacity; adult mentee accepts or acts on own side; both are parties. | `403` for minor/full-capacity/nonparty; `404` hides unknown mentorship. |
| `EDU-GRP-API-03` | Adult learner owns enrollment and placement; path owner only manages the path source, not learner data. | `403 FORBIDDEN` for nonlearner/blocked context; `404` hides unknown or unpublished path. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `EDU-GRP-API-01` | `requestId` → `strictCors(educationCohortOrigins)` → `requireAuth` → `requireAdultOrganizer` → `resolveActingContext` → `rateLimit(groupClassWrite)` → `parseZod(CreateGroupClassRequest)` → `idempotency(24h)` → `authorizeRosterAndPolicy` → `safeguardingGate` → `capacityTransaction` → `audit`. |
| `EDU-GRP-API-02` | `requestId` → `strictCors(educationMentorshipOrigins)` → `requireAuth` → `requireAdult` → `resolveActingContext` → `rateLimit(mentorshipWrite)` → `parseZod(CreateMentorshipRequest)` → `idempotency(24h)` → `authorizeMentorCapacity` → `transaction` → `notificationOutbox` → `audit`. |
| `EDU-GRP-API-03` | `requestId` → `strictCors(educationPathOrigins)` → `requireAuth` → `requireAdultLearner` → `resolveActingContext` → `rateLimit(pathEnrollment)` → `parseZod(EnrollPathRequest)` → `idempotency(24h)` → `authorizePublishedPath` → `resolveUnitsAndCost` → `transaction` → `audit`. |

### Security and Privacy Controls

Require named identities and consent for group rosters; never expose participant names or guardian data beyond authorized views. Keep mentorship goals/check-ins encrypted; prohibit lesson/credit/cancellation/curriculum fields at schema and persistence boundaries. Recompute cost/requirements server-side from pinned versions; never trust client totals or unit availability. CORS allows only configured origins and never `*` with credentials; cohort, mentorship and enrollment responses are `private, no-store`.

## Data Flow

1. BE00 authenticates actor/context, validates strict Zod input, and reserves idempotency key.
2. Group creation checks adult roster identity and safeguarding, freezes policy inputs, and persists `enrolling`; threshold worker locks count and activates or cancels/refunds every participant.
3. Mentorship command verifies both adult parties and mentor capacity, stores fixed-term agreement/check-in schedule, and queues notification without changing lesson or curriculum records.
4. Path enrollment verifies disclosed current cost/requirements, resolves unit refs, records explicit gaps and self-placement, and stores one versioned enrollment.
5. Each committed transition writes an append-only `education_audit_event` and the appropriate source event after the transaction; workers dedupe by event/correlation key.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `education.group-class.changed.v1` | `{eventId, classId, threshold, enrollmentCount, state, refundVersion, safeguardingProfile, version, occurredAt}`; roster identities are not in payload. | Participant projection, refund adapter, group delivery/notification workers. At-least-once, ordered by class/version, dedupe by eventId. |
| `education.mentorship.changed.v1` | `{eventId, mentorshipId, mentorPartyId, menteePartyId, state, startsAt, endsAt, cadence, version, occurredAt}`; goals/check-in notes excluded. | Party task/notification projectors and audit. At-least-once, ordered by mentorship/version, dedupe by eventId. |

Learning-path enrollment changes are represented by scoped `education_audit_event` and the enrollment projection; no unlisted event type is introduced. Consumers reject stale versions, retry at 2s/8s/32s, and dead-letter after five attempts with an alert. All events carry BE00 `requestId`/`correlationId`.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Invalid roster/term/cost/requirement or cross-semantic field | Typed `ApiError` before mutation; no class, agreement or enrollment. |
| Safeguarding/identity failure | `SAFEGUARDING_FAILED`, `AGE_GATE_DISABLED` or `ROOM_IDENTITY_REQUIRED` as applicable; fail closed without participant disclosure. |
| Group capacity race | `VERSION_CONFLICT`; no double seat. Activation rechecks threshold under lock. |
| Group below threshold | Transition to `cancelled_refunded`; issue one refund per confirmed participant with durable idempotent queue and reconcile provider failures. |
| Mentorship full/expired/cross-semantic request | `FORBIDDEN` or `VALIDATION_FAILED`; proposal remains unchanged; no auto-renew. |
| Unit or cost version changed | `POLICY_CONFLICT` with re-disclosure requirement; no enrollment until learner confirms current total. |
| Unit unavailable | Persist explicit gap and recomputed total only where current path policy permits; never silently substitute a unit. |
| Provider/notification/event outage | Keep local transaction committed, retry adapter/outbox 2s/8s/32s with dedupe, alert after five attempts, and preserve a safe projection. |
| Deletion/revocation | Revoke access/projections, retain required cohort/mentorship/audit history, and remove only authorized private data through worker. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `EDU-GRP-API-01` | Roster/threshold/capacity/date/currency bounds, exact states and error envelope. | Adult organizer, consent, group safeguarding never downgraded, CORS/rate. | Frozen roster, capacity CAS, threshold activation, all-participant refund and audit. | Payment/refund timeout/breaker, partial reconciliation, event dedupe and redaction. |
| `EDU-GRP-API-02` | Adult/fixed-term/cadence/capacity/action union, forbidden cross-fields. | Mentor/mentee identity, 1–3 capacity, no lesson semantics, encrypted goals, CORS/rate. | CAS state, check-in schedule, deliberate close, notification outbox and audit. | Full capacity, stale version, scheduler outage, event replay and privacy metrics. |
| `EDU-GRP-API-03` | Disclosure hash/cost/version/requirements/unit placement and gap response. | Learner-only enrollment, self-placement no prerequisite, no cost substitution, CORS/rate. | Unique enrollment, unit snapshot/gap recompute, duplicate replay and audit. | Catalog timeout/breaker, policy conflict, projection retry and redacted telemetry. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, thresholds, fixed-term transitions, cost disclosure, gap and idempotency algorithms. PostgreSQL tests run RLS, unique/CAS, append-only audit, encrypted-field, refund-state and no-cross-semantic constraints. Adapter tests exercise exact timeout/retry/backoff/breaker, payment reconciliation, unit-version reads and notification dedupe. Worker tests prove threshold/refund ordering and stale-event rejection. Playwright covers class below/at threshold, mentorship proposal/close, path disclosure/self-placement/gap, keyboard focus, safe refusal copy and narrow viewport. The gate fails on route collisions, missing operation rows, non-`ApiError` responses, participant/goal leakage or silent unit substitution.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all three operations have strict Zod 4 request/success/error schemas, bounded fields, states, statuses and exact error envelope.
- **Pass 2 — macro boundary:** safeguarding, payment/refund, unit catalog, notification and BE00 ownership are exact seams; no lesson-credit or curriculum route is duplicated.
- **Pass 3 — lifecycle/race:** cohort threshold, refund, mentorship capacity/term and path cost/version transitions use locks, CAS, unique keys and deliberate terminal states.
- **Pass 4 — failure/abuse:** no minor/adult bypass, no safeguard relaxation, no cross-semantic reuse, provider retries/breakers, durable refunds, stale events and deletion are testable.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, FKs, indexes, RLS/grants, encryption/retention and redacted event/audit payloads.

## Ambiguity Gate

**PASS.** The split is source-aligned (`EDU-14`, `EDU-15`, `EDU-16`), all three routes have six-cell registry rows and exact operation IDs, every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, states, failure recovery and tests. Safeguarding, payment/refund, unit, identity and notification seams specify exact timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 15 and deep dive; locked group viability/refunds, fixed-term mentorship and versioned learning-path enrollment contracts. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox and shared middleware.
- [BE Shard 15a — Teacher facets, discovery and trials](15a-teacher-facets-discovery-trials.md) for adult identity and teacher context conventions.
- [BE Shard 15b — Lesson booking, credits and delivery](15b-lesson-booking-credits-delivery.md) for the intentionally separate lesson/credit boundary.
- [BE Shard 15c — Curriculum, feedback and practice](15c-curriculum-feedback-practice.md) for curriculum artifact references and non-overlapping learning records.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for read-only safeguarding/evidence inputs where required.
