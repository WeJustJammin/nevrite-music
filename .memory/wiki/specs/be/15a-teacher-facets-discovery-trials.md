# Teacher Facets, Discovery & Trial Conversion — Backend Specification

**Status:** Complete
**IA source:** [Shard 15 — Education delivery](../ia/15-education-delivery.md)
**Deep-dive source:** [Deep Dive 15 — Education delivery](../ia/deep-dives/15-education-delivery.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns publication of a teacher's tuition facet, protected teacher discovery, and conversion of a closed trial into a lesson series. It contains `EDU-01`, `EDU-02`, and `EDU-08`. Booking, credit, room, lesson delivery, learning artifacts, group classes, mentorships, and learning paths remain in sibling Shard 15 specifications. Shard 02 evidence is consumed as a read-only projection; this split never edits evidence truth.

## Classification

- **Type:** read/write education marketplace boundary with a versioned publication aggregate and a privacy-preserving discovery projection.
- **Boundary:** `tuition_facet`, `tuition_evidence_projection`, `rate_card_line`, `teacher_match_projection`, and `trial_relationship` reads/writes are owned here. Identity, guardian, vetting, relationship, availability-rule, payment, and search infrastructure are cross-shard seams.
- **Expected operations:** three HTTP operations, one for each assigned IA interaction (`EDU-01`, `EDU-02`, `EDU-08`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** only explicitly authored, non-contact facet fields publish; evidence and eligibility are read-only projections; discovery filters hard-gate before ranking; a trial conversion is a single bounded offer with a quiet terminal state.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/15-education-delivery.md:28-33` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **06.01 Lesson Booking, Packages & Delivery** — recurring series, teacher-scoped lesson credits, frozen cancellation policy and safeguarded session record. | [15b](15b-lesson-booking-credits-delivery.md#route-registry): `EDU-LESSON-API-01`–`EDU-LESSON-API-05`. |
| **06.02 Teacher Discovery, Profiles & Trials** — identity facet, separate evidence kinds, published transparent matching and bounded trials. | [15a](15a-teacher-facets-discovery-trials.md#route-registry): `EDU-FAC-API-01`–`EDU-FAC-API-03`. |
| **06.03 Curriculum, Assignments & Practice** — optional plan instances, timestamped feedback, non-coercive practice capture/tools and teacher-approved progress reports. | [15c](15c-curriculum-feedback-practice.md#route-registry): `EDU-LEARN-API-01`–`EDU-LEARN-API-05`. |
| **06.05 Group Lessons, Workshops & Masterclasses** — viability/roster/safeguarding sibling lifecycle. | [15d](15d-group-mentorship-learning-paths.md#route-registry): `EDU-GRP-API-01`. |
| **06.06 Mentorship Programmes** — scarce fixed-term relationship without lesson credits/cancellation/curriculum inheritance. | [15d](15d-group-mentorship-learning-paths.md#route-registry): `EDU-GRP-API-02`. |
| **06.07 Learning Paths** — self-paced curation over existing content with total cost disclosure. | [15d](15d-group-mentorship-learning-paths.md#route-registry): `EDU-GRP-API-03`. |

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `15-education-delivery.md` | `Overview`, `Features`, `Acceptance Criteria` lines 9–60 | Education scope, publication gates, discovery behavior, trial conversion behavior. |
| `15-education-delivery.md` | `Interactions` lines 62–83 | Exact `EDU-01`, `EDU-02`, and `EDU-08` interaction contracts and global interaction rules. |
| `15-education-delivery.md` | `Contracts` lines 92–135 | Core types/errors and discovery/trial contract rules. |
| `15-education-delivery.md` | `Data Models` and typed registry lines 136–192 | Canonical model names, ownership/version requirements, and field cardinality. |
| `15-education-delivery.md` | `Access Control`, `Accessibility` lines 193–224 | Adult/teacher/student roles, acting context, accessibility obligations. |
| `15-education-delivery.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 226–283 | Event payload facts, failure ordering, idempotency, deletion, and privacy cases. |
| `15-education-delivery.md` | `Cross-Shard Dependencies`, `Deep Dives Needed`, `Dependency References` lines 285–312 | Shard 02 evidence, identity, relationship, availability, and platform dependencies. |
| `deep-dives/15-education-delivery.md` | `Canonical Field Contracts`, `State Machines`, `Discovery and Trial Algorithm` lines 20–78 | Typed fields, publication/trial states, hard filters, ranking, widening, and one-nudge algorithm. |
| `deep-dives/15-education-delivery.md` | `Abuse and Recovery Verification`, `Cross-Shard Contracts`, `Implementation Envelope` lines 99–134 | Abuse controls, retry/outbox expectations, seam versioning, and bounded command envelope. |
| `00-infrastructure.md` | BE00 contracts, auth, errors, idempotency, rate limits, observability, CORS | Shared `ApiError`, request IDs, actor context, idempotency ledger, limits, audit, and middleware baseline. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Security, data placement, API and testing standards | Supabase/RLS boundary, PII minimization, Zod-first contracts, and verification bar. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `EDU-01` Publish tuition facet | Publish self-authored fields and structured rate/availability/intake only after gates; contact data is rejected; expired evidence retracts only affected projection/range. | `EDU-FAC-API-01` | `tuition_facet`, `tuition_evidence_projection`, `rate_card_line`; `education.teacher-facet.changed.v1` |
| `EDU-02` Discover teacher | Adult student supplies instrument/level/age/mode/language/window; hard filters precede transparent weighted ranking; widening and missing-evidence reasons are explicit. | `EDU-FAC-API-02` | `teacher_match_projection`, `tuition_facet`, `tuition_evidence_projection` |
| `EDU-08` Convert trial | Closed trial offers series; decline needs no message/rating; at most one 48-hour nudge; quiet at seven days; duplicate conversion returns the existing series. | `EDU-FAC-API-03` | `trial_relationship`; consumes `education.lesson-booking.changed.v1` from the booking split |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `EDU-01` | `EDU-FAC-API-01` | `POST /api/v1/education/teacher-facets` | `PublishFacetRequest` → `PublishFacetSuccess` (`201`) | Validation, acting-context ownership, publication gates, evidence expiry, CAS, idempotency, and typed `ApiError` are specified. |
| `EDU-02` | `EDU-FAC-API-02` | `POST /api/v1/education/teacher-searches` | `DiscoverTeacherRequest` → `DiscoverTeacherSuccess` (`200`) | Adult-student auth, hard filters, safe ranking/widening, non-disclosure, bounded reads, rate limit, and typed `ApiError` are specified. |
| `EDU-08` | `EDU-FAC-API-03` | `POST /api/v1/education/trial-relationships/{trialRelationshipId}/convert` | `ConvertTrialRequest` → `ConvertTrialSuccess` (`201`) | Closed-trial ownership, one conversion, nudge/quiet state, CAS, idempotency, and typed `ApiError` are specified. |

## API Endpoints

### Route Registry

The following registry is authoritative. Every downstream contract, policy, error, telemetry, and test row keys to one operation ID here.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `EDU-FAC-API-01` | `POST` | `/api/v1/education/teacher-facets` | `EDU-01` | Authenticated adult teacher; current acting context owns the facet and rate-card authority. | `201` `PublishFacetSuccess` |
| `EDU-FAC-API-02` | `POST` | `/api/v1/education/teacher-searches` | `EDU-02` | Authenticated adult student; query contains no target-teacher ownership claim. | `200` `DiscoverTeacherSuccess` |
| `EDU-FAC-API-03` | `POST` | `/api/v1/education/trial-relationships/{trialRelationshipId}/convert` | `EDU-08` | Authenticated adult trial participant; actor is the student or assigned teacher in the relationship. | `201` `ConvertTrialSuccess` |

### Command and Read Lifecycle

BE00 supplies a request ID, verified actor and acting context, body-size limit, Zod parse, idempotency ledger, transaction boundary, structured audit, and response envelope. Mutating operations acquire the aggregate row with `SELECT ... FOR UPDATE`, verify `expectedVersion`, write the state and outbox record in one transaction, then return the committed projection. Discovery uses a repeatable-read snapshot and never exposes raw evidence, ranking integers, or another student's relationship.

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-context verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms, only before any write | Open after 5 failures/30 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`, half-open after 15 s. |
| Shard 02 evidence projection | `{teacherId, evidenceProjectionVersion}` → `{adultEligible, minorEligible, status, projectionVersion}` | 400 ms | 2 retries at 75 ms/225 ms for reads | Open after 5 failures/30 s; discovery marks `evidence_unavailable` and publication refuses closed with `503`; half-open after 20 s. |
| Availability/rate policy reader | `{teacherId, rateCardLineId, availabilityRuleVersion}` → `{rateLine, availability, policyVersion}` | 400 ms | 2 retries at 75 ms/225 ms, no retry after version conflict | Open after 5 failures/30 s; publish fails closed, discovery omits bookability but retains teacher with reason. |
| Trial-series creator (lesson split) | `{trialRelationshipId, teacherId, studentId, expectedVersion, idempotencyKey}` → `{lessonSeriesId, state, version}` | 700 ms | 2 retries at 100 ms/300 ms with same idempotency key | Open after 4 failures/30 s; conversion remains offered and returns `503`, never a partial relationship. |

## Request/Response Contracts

All schemas are Zod 4 strict objects. Unknown keys reject with `VALIDATION_FAILED`; dates are RFC 3339 UTC strings; IDs are UUIDs. Every error uses the BE00/global envelope `ApiError { code, message, requestId, details }`.

```ts
import { z } from "zod";

type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const Uuid = z.uuid();
const DateTime = z.iso.datetime({ offset: true });
const ActorContext = z.object({
  actingContextId: Uuid,
  expectedVersion: z.int().nonnegative().optional(),
}).strict();
const Idempotency = z.string().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/);

export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: Uuid,
  details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema),
}).strict();

export const PublishFacetRequest = z.object({
  ...ActorContext.shape,
  idempotencyKey: Idempotency,
  facetId: Uuid,
  facetVersion: z.int().positive(),
  authoredFields: z.object({
    displayName: z.string().trim().min(1).max(120),
    biography: z.string().trim().max(4000),
    instruments: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
    levels: z.array(z.enum(["beginner", "intermediate", "advanced"])).min(1),
    languages: z.array(z.string().trim().min(2).max(40)).min(1).max(8),
  }).strict(),
  rateCardLineId: Uuid,
  availabilityRuleVersion: z.int().positive(),
  ageRange: z.object({ min: z.int().min(18).max(120), max: z.int().min(18).max(120) }).strict(),
  intake: z.object({ mode: z.enum(["remote", "in_person", "both"]), note: z.string().trim().max(1000) }).strict(),
}).strict().superRefine((v, ctx) => {
  if (v.ageRange.max < v.ageRange.min) ctx.addIssue({ code: "custom", path: ["ageRange", "max"], message: "max must be >= min" });
});

export const PublishFacetSuccess = z.object({
  facetId: Uuid, state: z.literal("published"), version: z.int().positive(),
  evidenceProjectionVersion: z.int().positive(), publishedAt: DateTime,
}).strict();

export const DiscoverTeacherRequest = z.object({
  ...ActorContext.shape, idempotencyKey: Idempotency,
  instrument: z.string().trim().min(1).max(80), level: z.enum(["beginner", "intermediate", "advanced"]),
  ageBand: z.enum(["adult", "future_minor"]), mode: z.enum(["remote", "in_person"]),
  language: z.string().trim().min(2).max(40), availabilityWindow: z.object({
    startsAt: DateTime, endsAt: DateTime, timezone: z.string().trim().min(1).max(80),
  }).strict(), limit: z.int().min(1).max(50), cursor: z.string().max(256).optional(),
}).strict();

const Match = z.object({
  teacherId: Uuid, facetId: Uuid, reasons: z.array(z.string().min(1).max(160)).min(1).max(12),
  bookability: z.enum(["bookable", "contact_for_availability", "not_bookable"]),
  evidenceStatus: z.enum(["verified", "degraded", "unavailable"]),
}).strict();
export const DiscoverTeacherSuccess = z.object({ matches: z.array(Match).max(50), nextCursor: z.string().max(256).nullable(), wideningStep: z.int().nonnegative() }).strict();

export const ConvertTrialRequest = z.object({
  ...ActorContext.shape, idempotencyKey: Idempotency, trialRelationshipId: Uuid,
  offer: z.object({ rateCardLineId: Uuid, occurrencePreference: z.object({ startsAt: DateTime, endsAt: DateTime }).strict().optional() }).strict(),
}).strict();
export const ConvertTrialSuccess = z.object({
  trialRelationshipId: Uuid, state: z.enum(["converted", "declined", "quiet_expired"]),
  lessonSeriesId: Uuid.nullable(), version: z.int().positive(), nudgeAt: DateTime.nullable(),
}).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `EDU-FAC-API-01` | `PublishFacetRequest` | `PublishFacetSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-FAC-API-02` | `DiscoverTeacherRequest` | `DiscoverTeacherSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,429,503` |
| `EDU-FAC-API-03` | `ConvertTrialRequest` | `ConvertTrialSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `EDU-FAC-API-01` | Require adult teacher, owned facet, current acting context, positive facet/rate/availability versions, bounded authored fields, age range with `min >= 18`, and no contact/secret keys. Confirm rate line, availability rule, evidence projection, and age gate before mutation; stale facet returns `VERSION_CONFLICT`; missing gate returns `VALIDATION_FAILED`; known minor returns `AGE_GATE_DISABLED`. |
| `EDU-FAC-API-02` | Require adult student, valid instrument/level/age/mode/language/window, ordered UTC window and limit `1..50`. Blocks, restrictions, safeguarding and eligibility run before ranking. Empty results widen by declared steps; degraded evidence stays as a reason and never becomes a rank exclusion. |
| `EDU-FAC-API-03` | Require closed trial, participating actor, matching teacher/student, current relationship version, valid rate line, and offer shape. Reject an open/expired/nonexistent trial with a non-oracular response; duplicate key or already converted relationship returns stored result. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `EDU-FAC-API-01` | `VALIDATION_FAILED`, `FORBIDDEN`, `ACTING_CONTEXT_STALE`, `VERSION_CONFLICT`, `AGE_GATE_DISABLED`, `EVIDENCE_UNAVAILABLE`, `DEPENDENCY_UNAVAILABLE`. `403` for known facet without teacher/agency authority; `404` only for an intentionally undiscoverable facet. | Required 24 h; request hash includes facet/version/fields/rate/availability. Same hash returns original; different hash returns `IDEMPOTENCY_MISMATCH`. | 20 writes/minute/acting party; BE00 burst 5. | Structured event has operationId, requestId, actorPartyId, facetId, resultCode, version, evidence version; biography, intake note, contact and prices are redacted. |
| `EDU-FAC-API-02` | `VALIDATION_FAILED`, `FORBIDDEN`, `RATE_LIMITED`, `DEPENDENCY_UNAVAILABLE`. `403` only for a non-student actor or blocked acting context; no teacher existence, rank, or restriction oracle is returned. | Required 24 h for a replayable query; hash includes normalized filters and cursor. Same query returns same snapshot cursor. | 60 queries/minute/student; 10 concurrent searches. | Log operationId, requestId, actor hash, filter dimensions, widening step, result count, evidence status counts; never log raw age, language note, or rank integer. |
| `EDU-FAC-API-03` | `VALIDATION_FAILED`, `FORBIDDEN`, `TRIAL_NOT_CLOSED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for authenticated nonparticipant; `404` hides unknown/non-visible relationship. | Required 48 h; hash includes relationship/version/offer. Replay returns original series/state; differing hash returns `IDEMPOTENCY_MISMATCH`. | 10 conversion attempts/hour/participant; one nudge per relationship. | Log operationId, requestId, relationshipId, actor role, result state, seriesId, version, nudge decision; never log lesson notes or protected identity details. |

## Database Schema

### PostgreSQL Model Registry

All tables live in the education schema with UUID primary keys, `created_at`/`updated_at` `timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. BE00 migration ownership, encrypted PII columns, audit append-only policy, and service-role-only migrations apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `tuition_facet` | `id uuid PK`; `teacher_party_id uuid NOT NULL FK party`; `acting_context_id uuid NOT NULL FK acting_context`; `authored_fields jsonb NOT NULL CHECK jsonb_typeof='object'`; `age_min smallint NOT NULL CHECK 18..120`; `age_max smallint NOT NULL CHECK age_max>=age_min`; `mode text NOT NULL CHECK remote/in_person/both`; `state text NOT NULL CHECK draft/published/retracted`; `rate_card_line_id uuid NOT NULL FK rate_card_line`; `availability_rule_version bigint NOT NULL`; `evidence_projection_version bigint NOT NULL`; `version bigint NOT NULL`. | Unique `(teacher_party_id, acting_context_id, state) WHERE state='published'`; `(teacher_party_id, updated_at DESC)`; `(state, mode)`. | Owner teacher/authorized agency can select and update own draft; public policy reads only published projection; student never reads authored contact fields; service role inserts tombstones. `anon` has no table grant. |
| `tuition_evidence_projection` | `id uuid PK`; `facet_id uuid NOT NULL FK tuition_facet ON DELETE CASCADE`; `source_evidence_id uuid NOT NULL FK shard02_evidence`; `projection_version bigint NOT NULL CHECK >0`; `status text NOT NULL CHECK verified/degraded/unavailable/retracted`; `adult_eligible boolean NOT NULL`; `minor_eligible boolean NOT NULL`; `expires_at timestamptz NULL`; `reason_code text NULL`; `updated_at timestamptz NOT NULL`. | Unique `(facet_id, projection_version)`; `(facet_id, status)`; `(expires_at) WHERE status='verified'`. | Teacher sees own projection status; students see only eligibility/status reason safe for discovery; raw source IDs and reasons are service-only; no public insert/update grant. |
| `rate_card_line` | `id uuid PK`; `owner_party_id uuid NOT NULL FK party`; `facet_id uuid NOT NULL FK tuition_facet`; `currency char(3) NOT NULL CHECK uppercase ISO-4217`; `amount_minor bigint NOT NULL CHECK >=0`; `duration_minutes smallint NOT NULL CHECK 1..1440`; `mode text NOT NULL CHECK remote/in_person`; `policy_version bigint NOT NULL`; `effective_from timestamptz NOT NULL`; `effective_to timestamptz NULL CHECK > effective_from`; `version bigint NOT NULL`. | Unique `(owner_party_id, currency, duration_minutes, mode, effective_from)`; `(facet_id, effective_from DESC)`; `(effective_to)`. | Owner and authorized agency read/write future lines; current published line is public through projection; students read only disclosed immutable snapshot; no direct anon table grant. |
| `teacher_match_projection` | `id uuid PK`; `teacher_party_id uuid NOT NULL FK party`; `facet_id uuid NOT NULL FK tuition_facet`; `instrument_key text NOT NULL`; `level text NOT NULL`; `language_key text NOT NULL`; `mode text NOT NULL`; `availability_bucket text NOT NULL`; `evidence_status text NOT NULL`; `reason_codes jsonb NOT NULL`; `bookability text NOT NULL`; `projection_version bigint NOT NULL`; `updated_at timestamptz NOT NULL`. | Unique `(teacher_party_id, facet_id, instrument_key, level, language_key, mode, availability_bucket, projection_version)`; `(instrument_key, level, mode, language_key, updated_at DESC)`; partial `(bookability)`. | Service-role projector writes; adult students can select only published safe fields through a view; teacher sees own projection; no raw rank or comparative position grant. |
| `trial_relationship` | `id uuid PK`; `teacher_party_id uuid NOT NULL FK party`; `student_party_id uuid NOT NULL FK party`; `trial_occurrence_id uuid NOT NULL FK lesson_occurrence`; `state text NOT NULL CHECK open/converted/declined/quiet_expired`; `closed_at timestamptz NULL`; `converted_series_id uuid NULL FK lesson_series`; `nudge_at timestamptz NULL`; `nudge_sent_at timestamptz NULL`; `quiet_expires_at timestamptz NOT NULL`; `version bigint NOT NULL`; `created_at/updated_at timestamptz NOT NULL`. | Unique `(teacher_party_id, student_party_id, trial_occurrence_id)`; partial unique `(teacher_party_id, student_party_id) WHERE state IN ('open','converted')`; `(nudge_at, state)` for one scheduler; `(student_party_id, updated_at DESC)`. | Teacher and student select their own relationship fields; only parties can initiate conversion; series ID visible after conversion; service role schedules nudge and quiet expiry; no public table grant. |

### State, Concurrency and Transaction Rules

- Facet state is `draft → published → retracted`; only a teacher-owned current version can publish. Evidence expiry atomically sets the projection `retracted` and removes only disallowed age-range/bookability; an eligible adult facet remains published.
- Trial state is `open → converted|declined|quiet_expired`; `converted` requires closed occurrence and a successful lesson-split create. `nudge_sent_at` is a compare-and-set claim, so two workers can send at most one nudge.
- Publish locks `tuition_facet`, confirms `rate_card_line` and evidence projection versions, writes the facet and `education.teacher-facet.changed.v1` outbox record atomically. Conversion locks `trial_relationship`, calls the lesson seam with the same idempotency key, then commits the returned series ID; a failed seam leaves `open`.
- Discovery reads a consistent projection snapshot. A missing projection is a visible `evidence_unavailable` reason, not a deletion. Ranking weights are server-owned and versioned; clients receive reasons, never score or position.

### Grants, RLS and Retention

`education_api` receives execute on approved RPCs only; `education_worker` receives projector/outbox writes; `education_migrator` owns DDL. RLS predicates use BE00 `current_actor_id()` and `current_acting_context_id()`. Contact, raw evidence, restriction predicates, and guardian data remain outside public views. Trial relationship history is retained seven years for audit; discovery query telemetry is minimized and expires after 30 days.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `EDU-FAC-API-01` | `teacher_adult` or delegated `agency_editor`; actor must own facet and hold current acting context. | `403 FORBIDDEN` for known facet without authority; `404` only for an undiscoverable facet ID. |
| `EDU-FAC-API-02` | `student_adult`; student owns query context. | `403 FORBIDDEN` for nonstudent/blocked context; never disclose teacher existence or safety predicates. |
| `EDU-FAC-API-03` | `teacher_adult` or `student_adult` who is a party to the trial. | `403 FORBIDDEN` for a known nonparty; `404` for unknown or deliberately hidden relationship. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `EDU-FAC-API-01` | `requestId` → `strictCors(educationCommandOrigins)` → `requireAuth` → `requireAdult` → `resolveActingContext` → `rateLimit(educationFacetWrite)` → `parseZod(PublishFacetRequest)` → `idempotency(24h)` → `authorizeFacetOwner` → `transaction` → `audit`. |
| `EDU-FAC-API-02` | `requestId` → `strictCors(educationReadOrigins)` → `requireAuth` → `requireAdultStudent` → `rateLimit(educationDiscoveryRead)` → `parseZod(DiscoverTeacherRequest)` → `safeProjectionOnly` → `traceSearch`. |
| `EDU-FAC-API-03` | `requestId` → `strictCors(educationCommandOrigins)` → `requireAuth` → `requireAdult` → `resolveActingContext` → `rateLimit(trialConversion)` → `parseZod(ConvertTrialRequest)` → `idempotency(48h)` → `authorizeTrialParty` → `transaction` → `audit`. |

### Security and Privacy Controls

Reject contact data, secrets, arbitrary URLs, unbounded arrays, and unknown keys at parse time. Normalize case for instrument/language keys; enforce tenant and acting-context scope in SQL; use parameterized queries; redact request bodies; encrypt private notes at rest; use opaque cursors; prevent cache sharing across student actors; and apply deletion/tombstone invalidation to all derived projections. CORS allows only configured WeJammin origins, never `*` with credentials.

## Data Flow

1. BE00 authenticates actor and context; the command schema validates bounded input and idempotency key.
2. Publish reads current rate/availability/evidence versions, checks age and adult eligibility, persists the authored facet, rebuilds safe match projection, and emits `education.teacher-facet.changed.v1` after commit.
3. Discovery applies block/restriction/safeguarding and age/mode hard filters, joins safe facet/rate/bookability projections, ranks with the server-owned weight version, and returns reasons plus explicit widening state.
4. Trial conversion locks the relationship, confirms its occurrence is closed, invokes the lesson-series seam, and stores the resulting series or leaves the trial open on failure. Scheduler sends at most one 48-hour nudge; day-seven worker writes `quiet_expired`.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `education.teacher-facet.changed.v1` | Outbox payload `{eventId, facetId, teacherPartyId, state, rateCardLineId, availabilityRuleVersion, ageRange, evidenceProjectionVersion, version, occurredAt}`; no contact or raw evidence. | Discovery projector, notification policy, audit. At-least-once, ordered by `facetId/version`, dedupe by `eventId`; retry 2s/8s/32s then durable outbox. |
| `education.lesson-booking.changed.v1` | Consumed for the trial occurrence close signal; accepted payload `{eventId, occurrenceId, trialRelationshipId?, state, version}` is schema-checked and privacy-filtered. | Trial conversion read model; unknown optional relationship is ignored without revealing it. |

Consumers reject stale versions, preserve last known safe projection, and dead-letter only after five attempts with an operator-visible metric. Event payloads use the BE00 envelope and carry `requestId`/`correlationId`.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Invalid field, contact key, or age gate | Return `400 VALIDATION_FAILED` or `422 AGE_GATE_DISABLED`; no row, event, or provider effect. |
| Actor/context/evidence unavailable | `401`/`403` for auth failure; `503 DEPENDENCY_UNAVAILABLE` for service outage. Publish fails closed; discovery returns safe degraded reason only when the projection snapshot is available. |
| Stale facet/trial version | `409 VERSION_CONFLICT` with current version only for an authorized owner; client rereads and re-confirms. |
| Idempotency replay or hash mismatch | Return the committed original for matching hash; return `409 IDEMPOTENCY_MISMATCH` for different request; never create a second facet publication or series. |
| Outbox/projection failure | Transaction commits once; worker retries 2s/8s/32s with dedupe, then durable queue and alert. Public reads retain last safe version and a degraded reason. |
| Evidence revocation/deletion | Tombstone source reference, retract affected projection, invalidate match cache, retain required audit fact, and do not remove an eligible adult facet. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `EDU-FAC-API-01` | Reject unknown/contact keys, bad age range, stale versions, and invalid enums; accept strict valid payload and exact `201`. | Teacher ownership, agency delegation, adult/minor gate, evidence expiry, RLS, CORS, and redaction. | CAS publication, unique published facet, rate/availability pin, atomic outbox, replay and hash mismatch. | Evidence timeout/retry/breaker, no partial write, event dedupe/order, requestId and metric fields. |
| `EDU-FAC-API-02` | Validate ordered window, bounded limit/cursor and exact result shape; never return rank integer. | Hard-filter ordering, blocks/safeguarding, student-only access, cache isolation, CORS and rate limit. | Projection snapshot, widening sequence, degraded evidence reason, cursor stability. | Projection timeout/breaker, empty pool explanation, telemetry redaction and no existence oracle. |
| `EDU-FAC-API-03` | Require closed trial/offer, exact state union, and nullable series response. | Party ownership, adult gate, no rating/message requirement, one nudge and no cross-party leak. | Row lock/CAS, series seam idempotency, duplicate conversion, quiet-expiry worker. | Seam retries/breaker, failed conversion leaves open, event replay, audit correlation. |

### Test Levels and Acceptance Gates

Zod contract tests run in Vitest; repository tests run against PostgreSQL with RLS enabled; seam tests use deterministic timeout/retry/breaker fakes; worker tests prove at-least-once dedupe; Playwright covers adult teacher publication, student discovery, trial close/conversion, safe error copy, keyboard focus, and narrow viewport. Security tests prove no PII or safety predicate in logs, responses, caches, or events. The gate fails on any schema drift, route collision, missing operation row, or non-`ApiError` error.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** every request field has type, bounds, nullability, and unknown-key behavior; every operation maps to one route and one status.
- **Pass 2 — macro boundary:** evidence, identity, availability, and lesson-series ownership are explicit seams; no duplicate BE00 endpoint is introduced.
- **Pass 3 — failure/abuse:** stale versions, replay, evidence expiry, ranking privacy, CORS, rate limits, retries, and circuit states are testable.
- **Pass 4 — lifecycle:** facet/trial state transitions, worker claims, retention, deletion/tombstones, and outbox recovery are explicit.
- **Pass 5 — accessibility/privacy:** result reasons and refusal copy are actionable without exposing protected facts; authored contact data is structurally blocked.

## Ambiguity Gate

**PASS.** The split is source-aligned (`EDU-01`, `EDU-02`, `EDU-08`), all three routes have strict request/success/error contracts, every route has auth/ownership, 403-vs-404, idempotency, rate, CORS middleware, observability, persistence, state, failure, and tests, and cross-shard behavior has exact timeout/retry/breaker rules. No unresolved product or architecture choice remains in this split.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 15 and its deep dive; locked three operation contracts, projection privacy, and trial conversion recovery. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, actor context, idempotency, rate limiting, audit, outbox, CORS, and common middleware.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for read-only evidence projections and revocation semantics.
- [BE Shard 02c — Credentials and trader](02c-credentials-trader.md) for identity/evidence source contracts where applicable; this split does not duplicate its routes.
- [BE Shard 15b — Lesson booking, credits and delivery](15b-lesson-booking-credits-delivery.md) for trial occurrence closure and lesson-series creation seam.
- [BE Shard 15d — Groups, mentorship and learning paths](15d-group-mentorship-learning-paths.md) for education-wide audit and consumer conventions.
