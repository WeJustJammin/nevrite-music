# Curriculum, Feedback, Practice & Progress — Backend Specification

**Status:** Complete
**IA source:** [Shard 15 — Education delivery](../ia/15-education-delivery.md)
**Deep-dive source:** [Deep Dive 15 — Education delivery](../ia/deep-dives/15-education-delivery.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns versioned curriculum/path artifacts, teacher assignment and student submission takes, stance/cap-limited feedback annotations, private practice logging, and explicitly approved progress reports. It contains `EDU-09` through `EDU-13`. Teacher discovery, lesson booking/delivery, group classes, mentorships, and learning-path enrollment remain sibling boundaries. Object storage, relationship authority, lesson access-retention, and notification delivery are external seams.

## Classification

- **Type:** education learning-artifact and private-record boundary with teacher/student asymmetric authorization.
- **Boundary:** `curriculum_template`, `curriculum_instance`, `assignment`, `submission_take`, `feedback_annotation`, `practice_event`, `practice_log`, and `progress_report` ownership; media object storage, teacher-student relationship, lesson delivery/access window, and platform audit are seams.
- **Expected operations:** five HTTP operations, one for each assigned IA interaction (`EDU-09`, `EDU-10`, `EDU-11`, `EDU-12`, `EDU-13`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** templates are version-pinned and non-retroactive; submissions are immutable and resumable; feedback is governed by a declared stance and cap; practice is private/non-evidentiary; reports require explicit teacher approval and contain coverage facts only.

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `15-education-delivery.md` | `Overview`, `Features`, `Delivery Phases`, `Acceptance Criteria` lines 9–60 | Curriculum, assignment, feedback, practice, and report scope. |
| `15-education-delivery.md` | `Interactions` lines 62–83 | Exact `EDU-09`–`EDU-13` preconditions, outcomes, edge cases, and privacy requirements. |
| `15-education-delivery.md` | `Contracts` lines 94–135 | Assignment, feedback stance, practice and progress rules; `ApiError { code, message, requestId, details }` envelope and closed error codes. |
| `15-education-delivery.md` | `Data Models` and typed registry lines 136–192 | Canonical learning artifact names, fields, cardinality and immutable-take rules. |
| `15-education-delivery.md` | `Access Control`, `Accessibility` lines 193–224 | Teacher/student relationship roles, report approval and accessible feedback. |
| `15-education-delivery.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 226–283 | Assignment/feedback/practice events, offline recovery, deletion and privacy. |
| `15-education-delivery.md` | `Cross-Shard Dependencies`, `Dependency References` lines 285–312 | Relationship, delivery, storage, evidence and platform dependencies. |
| `deep-dives/15-education-delivery.md` | `Canonical Field Contracts`, `State Machines` lines 20–45 | Field types, assignment/submission/feedback/practice/report states. |
| `deep-dives/15-education-delivery.md` | `Assignment, Feedback and Practice Algorithm`, `Abuse and Recovery Verification` lines 80–114 | Duration caps, upload outbox, feedback windows/caps, offline logging, and recovery. |
| `deep-dives/15-education-delivery.md` | `Cross-Shard Contracts`, `Implementation Envelope` lines 116–134 | Versioned relationship/storage seams and bounded command envelope. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor context, replay ledger, limits, audit and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Supabase/RLS, PII isolation, Zod-first contracts, and production verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `EDU-09` Create curriculum/path | Teacher relationship and existing template are required; instance optional; template updates are non-retroactive; learner self-placement has no behind-schedule state. | `EDU-LEARN-API-01` | `curriculum_template`, `curriculum_instance`; `education.assignment.changed.v1` consumer for downstream work |
| `EDU-10` Assign/submit work | Teacher names medium/reference; student owns assignment; ten-minute in-room/twenty-minute external cap; failed upload retries and durable outbox; takes are immutable. | `EDU-LEARN-API-02` | `assignment`, `submission_take`; `education.assignment.changed.v1` |
| `EDU-11` Annotate feedback | Teacher relationship/access window/stanced cap; timestamp/range comments; in-lesson or exhausted cap typed refusal; 90-day access expiry. | `EDU-LEARN-API-03` | `feedback_annotation`; `education.feedback.changed.v1` |
| `EDU-12` Practice | Student-owned offline/manual practice; optional tools and assignment; private row-level access; broken streak has no penalty. | `EDU-LEARN-API-04` | `practice_event`, `practice_log`; `education.practice.changed.v1` |
| `EDU-13` Issue progress report | Coverage facts and explicit teacher approval only; optional; no grade/skill rating; concurrent approval conflicts. | `EDU-LEARN-API-05` | `progress_report`; `education.assignment.changed.v1` consumer and education audit |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `EDU-09` | `EDU-LEARN-API-01` | `POST /api/v1/education/curriculum-instances` | `CreateCurriculumRequest` → `CreateCurriculumSuccess` (`201`) | Relationship/template authority, optional instance, version pin, CAS, non-retroactivity and typed `ApiError`. |
| `EDU-10` | `EDU-LEARN-API-02` | `POST /api/v1/education/assignment-commands` | `AssignmentCommandRequest` → `AssignmentCommandSuccess` (`201`) | Assign/submit union, ownership, duration caps, upload/outbox recovery, immutable takes and typed `ApiError`. |
| `EDU-11` | `EDU-LEARN-API-03` | `POST /api/v1/education/submissions/{takeId}/feedback` | `RecordFeedbackRequest` → `RecordFeedbackSuccess` (`201`) | Teacher relationship, stance/cap, access retention, safeguarding channel, range fallback and typed `ApiError`. |
| `EDU-12` | `EDU-LEARN-API-04` | `POST /api/v1/education/practice-events` | `RecordPracticeRequest` → `RecordPracticeSuccess` (`201`) | Student ownership, offline/manual input, private RLS, sync/replay and typed `ApiError`. |
| `EDU-13` | `EDU-LEARN-API-05` | `POST /api/v1/education/progress-reports` | `ApproveProgressReportRequest` → `ApproveProgressReportSuccess` (`201`) | Evidence coverage, explicit approval, no grading, CAS, report audience and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `EDU-LEARN-API-01` | `POST` | `/api/v1/education/curriculum-instances` | `EDU-09` | Authenticated adult teacher; current teacher-student relationship and readable template. | `201` `CreateCurriculumSuccess` |
| `EDU-LEARN-API-02` | `POST` | `/api/v1/education/assignment-commands` | `EDU-10` | Authenticated teacher for `assign` or student owner for `submit`; assignment party checked server-side. | `201` `AssignmentCommandSuccess` |
| `EDU-LEARN-API-03` | `POST` | `/api/v1/education/submissions/{takeId}/feedback` | `EDU-11` | Authenticated current teacher on relationship and unexpired take access. | `201` `RecordFeedbackSuccess` |
| `EDU-LEARN-API-04` | `POST` | `/api/v1/education/practice-events` | `EDU-12` | Authenticated adult student; event/log belongs to actor; optional assignment also belongs to actor. | `201` `RecordPracticeSuccess` |
| `EDU-LEARN-API-05` | `POST` | `/api/v1/education/progress-reports` | `EDU-13` | Authenticated current teacher; report concerns owned relationship and explicit review state. | `201` `ApproveProgressReportSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/acting-context verifier | `{accessToken, actingContextId}` → `{actorId, partyId, roles, adultVerified, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Relationship/access verifier | `{teacherId, studentId, relationshipVersion, takeId, deliveredAt}` → `{current, role, accessExpiresAt}` | 400 ms | 2 retries at 75 ms/225 ms for reads; no retry on denial | Open after 5 failures/30 s; feedback/report fail closed with `503`; half-open after 20 s. |
| Curriculum catalog | `{templateId, templateVersion}` → `{template, checksum, readable, unitRefs}` | 500 ms | 2 retries at 100 ms/300 ms, same version | Open after 4 failures/30 s; create returns `503` without an instance; half-open after 20 s. |
| Object storage | `{objectKey, contentHash, sizeBytes, contentType, uploadSessionId}` → `{stored, objectVersion, etag}` | 1,500 ms | 2 retries at 200 ms/600 ms for resumable chunks; no retry on hash/size refusal | Open after 5 failures/60 s; submission remains local/outbox; half-open after 30 s. |
| Coverage evidence reader | `{relationshipId, startsAt, endsAt, evidenceVersion}` → `{facts[], coverageHash, version}` | 700 ms | 2 retries at 100 ms/300 ms, same snapshot | Open after 4 failures/30 s; report returns `503` and creates no approval; half-open after 20 s. |

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

export const CreateCurriculumRequest = z.object({
  ...Context.shape, idempotencyKey: Key, relationshipId: Uuid, relationshipVersion: z.int().positive(), templateId: Uuid, templateVersion: z.int().positive(), createInstance: z.boolean(), learnerNotes: z.string().trim().max(2000).optional(),
}).strict();
export const CreateCurriculumSuccess = z.object({ curriculumInstanceId: Uuid.nullable(), templateId: Uuid, templateVersion: z.int().positive(), state: z.enum(["created", "not_instantiated"]), version: z.int().positive() }).strict();

const AssignCommand = z.object({ action: z.literal("assign"), relationshipId: Uuid, relationshipVersion: z.int().positive(), medium: z.string().trim().min(1).max(80), reference: z.string().trim().max(1000).nullable(), instructions: z.string().trim().max(4000), curriculumInstanceId: Uuid.nullable() }).strict();
const SubmitCommand = z.object({ action: z.literal("submit"), assignmentId: Uuid, assignmentVersion: z.int().positive(), source: z.enum(["in_room", "external", "manual_backfill"]), objectKey: z.string().trim().min(1).max(512), contentHash: z.string().length(64).regex(/^[a-f0-9]+$/), durationSeconds: z.int().min(1).max(1200), supersedesTakeId: Uuid.nullable() }).strict();
export const AssignmentCommandRequest = z.object({ ...Context.shape, idempotencyKey: Key, command: z.discriminatedUnion("action", [AssignCommand, SubmitCommand]) }).strict();
export const AssignmentCommandSuccess = z.object({ action: z.enum(["assign", "submit"]), assignmentId: Uuid, takeId: Uuid.nullable(), state: z.enum(["assigned", "uploading", "submitted"]), version: z.int().positive() }).strict();

export const RecordFeedbackRequest = z.object({
  ...Context.shape, idempotencyKey: Key, takeId: Uuid, takeVersion: z.int().positive(), stance: z.enum(["included", "in_lesson_only", "capped_weekly"]), anchor: z.object({ kind: z.enum(["timestamp", "range"]), startMs: z.int().nonnegative(), endMs: z.int().nonnegative().nullable(), click: z.int().positive().nullable() }).strict(), body: z.string().trim().min(1).max(2000), safeguardingChannelVersion: z.int().positive(),
}).strict().superRefine((v, c) => { if (v.anchor.endMs !== null && v.anchor.endMs < v.anchor.startMs) c.addIssue({ code: "custom", path: ["anchor", "endMs"], message: "range end must be >= start" }); });
export const RecordFeedbackSuccess = z.object({ annotationId: Uuid, takeId: Uuid, state: z.literal("committed"), accessExpiresAt: DateTime, version: z.int().positive() }).strict();

export const RecordPracticeRequest = z.object({
  ...Context.shape, idempotencyKey: Key, practiceLogId: Uuid.nullable(), assignmentId: Uuid.nullable(), occurredAt: DateTime, durationSeconds: z.int().min(1).max(86400), source: z.enum(["timer", "click", "tuner", "drone", "recording", "manual"]), offline: z.boolean(), clientEventId: Key,
}).strict();
export const RecordPracticeSuccess = z.object({ practiceEventId: Uuid, practiceLogId: Uuid, state: z.enum(["recorded", "queued", "backfilled"]), version: z.int().positive() }).strict();

export const ApproveProgressReportRequest = z.object({
  ...Context.shape, idempotencyKey: Key, relationshipId: Uuid, relationshipVersion: z.int().positive(), reportId: Uuid.nullable(), interval: z.object({ startsAt: DateTime, endsAt: DateTime }).strict(), evidenceVersion: z.int().positive(), coverageHash: z.string().length(64).regex(/^[a-f0-9]+$/), coverageFacts: z.array(z.object({ assignmentId: Uuid.nullable(), fact: z.string().trim().min(1).max(500), observedAt: DateTime }).strict()).max(100), approve: z.literal(true), audience: z.enum(["student", "student_guardian"]),
}).strict();
export const ApproveProgressReportSuccess = z.object({ reportId: Uuid, state: z.literal("approved"), version: z.int().positive(), publishedAt: DateTime }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `EDU-LEARN-API-01` | `CreateCurriculumRequest` | `CreateCurriculumSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-LEARN-API-02` | `AssignmentCommandRequest` | `AssignmentCommandSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-LEARN-API-03` | `RecordFeedbackRequest` | `RecordFeedbackSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-LEARN-API-04` | `RecordPracticeRequest` | `RecordPracticeSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-LEARN-API-05` | `ApproveProgressReportRequest` | `ApproveProgressReportSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `EDU-LEARN-API-01` | Require current teacher relationship and readable template/version. Missing template returns `VALIDATION_FAILED`; expired relationship returns `FORBIDDEN`; `createInstance=false` stores no instance; later template edits cannot mutate a pinned instance; self-placement never creates a behind-schedule state. |
| `EDU-LEARN-API-02` | `assign` requires current teacher relationship, bounded medium/reference/instructions; `submit` requires student-owned assignment, source-specific `durationSeconds <= 600` in-room or `<=1200` external, content hash and storage key. Overlength is rejected before transfer; upload failure returns `UPLOAD_FAILED`, local retry and durable outbox. |
| `EDU-LEARN-API-03` | Require current teacher relationship, take access within 90 days after last delivered lesson, valid stance/cap and safeguarding channel. `in_lesson_only` or exhausted weekly cap returns `FEEDBACK_NOT_INCLUDED`; absent click/tempo makes a timestamp anchor; range ordering is strict. |
| `EDU-LEARN-API-04` | Require student ownership, positive bounded duration, optional student-owned assignment, client event key, and valid offline/source shape. Manual backfill is accepted; guardian/teacher/operator/public reads are denied by RLS; broken streak never affects admission or state. |
| `EDU-LEARN-API-05` | Require current teacher relationship, ordered interval, evidence snapshot/hash, explicit `approve=true`, and coverage facts only. No grade/skill rating is accepted; missing evidence is a stated gap; concurrent approval returns `VERSION_CONFLICT`. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `EDU-LEARN-API-01` | `VALIDATION_FAILED`, `FORBIDDEN`, `ACTING_CONTEXT_STALE`, `VERSION_CONFLICT`, `TEMPLATE_NOT_FOUND`, `DEPENDENCY_UNAVAILABLE`. `403` for expired/nonowned relationship; `404` for intentionally hidden template/relationship. | Required 24 h; hash includes relationship/template/version/create flag. Same hash returns original; different hash returns `IDEMPOTENCY_MISMATCH`. | 30 creates/hour/teacher; 10/minute/relationship. | Log operationId, requestId, relationship/template/version, instantiated flag and result; redact learner notes and private template content. |
| `EDU-LEARN-API-02` | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT`, `UPLOAD_FAILED`, `STORAGE_UNAVAILABLE`, `DEPENDENCY_UNAVAILABLE`. `403` for wrong teacher/student; `404` hides another party's assignment/take. | Required 24 h; hash includes action, assignment/version, content hash and source. Replays return original assignment/take; mismatch returns `IDEMPOTENCY_MISMATCH`. | 60 assignment commands/hour/party; 20 uploads/hour/student. | Log operationId, requestId, assignment/take IDs, action, duration bucket, outbox state; never log object keys, audio hash linkage, or instruction text. |
| `EDU-LEARN-API-03` | `VALIDATION_FAILED`, `FORBIDDEN`, `FEEDBACK_NOT_INCLUDED`, `VERSION_CONFLICT`, `SAFEGUARDING_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for expired/nonteacher; `404` hides another student's take. | Required 24 h; hash includes take/version/anchor/body hash/stance. Matching replay returns annotation; differing hash returns `IDEMPOTENCY_MISMATCH`. | 40 annotations/hour/teacher; weekly cap is policy-enforced per relationship. | Log operationId, requestId, take/relationship IDs, stance, anchor kind and cap result; redact feedback body and student material. |
| `EDU-LEARN-API-04` | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for nonstudent or any named practice-log request from guardian/teacher/operator/public; `404` hides another student's log. | Required 30 days; hash includes client event ID and normalized event. Same event returns original/queued state; mismatch returns `IDEMPOTENCY_MISMATCH`. | 300 events/hour/student; 100 sync retries/hour/device. | Log operationId, requestId, student hash, source, duration bucket, offline/queued state; no practice content, recording metadata, or streak. |
| `EDU-LEARN-API-05` | `VALIDATION_FAILED`, `FORBIDDEN`, `VERSION_CONFLICT`, `EVIDENCE_UNAVAILABLE`, `DEPENDENCY_UNAVAILABLE`. `403` for nonrelationship teacher; `404` hides another relationship/report. | Required 24 h; hash includes relationship/interval/evidence/coverage hash/audience. Replay returns approved report; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 reports/hour/teacher/relationship; one approval per version. | Log operationId, requestId, report/relationship IDs, evidence version, fact count, audience and result; redact fact text and guardian identity. |

## Database Schema

### PostgreSQL Model Registry

All tables reside in `education`, use UUID primary keys, `created_at`/`updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Submission takes and feedback annotations are append-only in their content fields; BE00 migration/encryption/audit policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `curriculum_template` | `id uuid PK`; `owner_party_id uuid NOT NULL FK party`; `title text NOT NULL CHECK length 1..160`; `description text NULL CHECK length<=4000`; `units jsonb NOT NULL CHECK array`; `template_version bigint NOT NULL CHECK >0`; `state text NOT NULL CHECK draft/published/retired`; `checksum char(64) NOT NULL`; `created_at/updated_at timestamptz NOT NULL`. | Unique `(owner_party_id, template_version)`; `(owner_party_id, state, updated_at DESC)`; `(checksum)`. | Author manages own template; teachers read published templates; live instances retain a snapshot; students read only disclosed safe fields; anon no grant. |
| `curriculum_instance` | `id uuid PK`; `template_id uuid NOT NULL FK curriculum_template`; `template_version bigint NOT NULL`; `relationship_id uuid NOT NULL FK teacher_student_relationship`; `teacher_party_id uuid NOT NULL FK party`; `student_party_id uuid NOT NULL FK party`; `self_placement_unit_id uuid NULL`; `state text NOT NULL CHECK active/paused/completed/archived`; `snapshot jsonb NOT NULL CHECK object`; `version bigint NOT NULL`. | Unique `(relationship_id, template_id, template_version)`; `(student_party_id, state)`; `(teacher_party_id, updated_at DESC)`. | Relationship parties select safe instance; teacher updates own instance via CAS; student may self-place; template owner cannot retroactively update snapshot; anon no grant. |
| `assignment` | `id uuid PK`; `relationship_id uuid NOT NULL FK teacher_student_relationship`; `curriculum_instance_id uuid NULL FK curriculum_instance`; `teacher_party_id uuid NOT NULL FK party`; `student_party_id uuid NOT NULL FK party`; `medium text NOT NULL CHECK length 1..80`; `reference text NULL CHECK length<=1000`; `instructions_ciphertext bytea NOT NULL`; `state text NOT NULL CHECK assigned/closed`; `version bigint NOT NULL`. | `(student_party_id, state, created_at DESC)`; `(teacher_party_id, created_at DESC)`; `(curriculum_instance_id)`. | Teacher relationship owner inserts/updates assignment; student selects assigned fields; instructions decrypt only for parties; no public/anon grant. |
| `submission_take` | `id uuid PK`; `assignment_id uuid NOT NULL FK assignment`; `student_party_id uuid NOT NULL FK party`; `object_key text NOT NULL`; `content_hash char(64) NOT NULL`; `duration_seconds integer NOT NULL CHECK 1..1200`; `source text NOT NULL CHECK in_room/external/manual_backfill`; `supersedes_take_id uuid NULL FK submission_take`; `state text NOT NULL CHECK uploading/submitted/failed/expired`; `created_at timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(assignment_id, content_hash)`; `(assignment_id, created_at DESC)`; `(student_party_id, state, created_at DESC)`; `(supersedes_take_id)`. | Student owns/selects own take; teacher sees take only while access window valid; storage worker writes state; no delete/update of content by either party; anon no grant. |
| `feedback_annotation` | `id uuid PK`; `take_id uuid NOT NULL FK submission_take`; `teacher_party_id uuid NOT NULL FK party`; `relationship_id uuid NOT NULL FK teacher_student_relationship`; `start_ms integer NOT NULL CHECK >=0`; `end_ms integer NULL CHECK >=start_ms`; `body_ciphertext bytea NOT NULL`; `stance text NOT NULL CHECK included/in_lesson_only/capped_weekly`; `access_expires_at timestamptz NOT NULL`; `safeguarding_channel_version bigint NOT NULL`; `state text NOT NULL CHECK committed/revoked`; `version bigint NOT NULL`. | `(take_id, created_at)`; `(relationship_id, access_expires_at)`; `(teacher_party_id, created_at DESC)`; partial `(state)`. | Teacher inserts only for current relationship; student reads own annotations; access expiry enforced in view/RPC; encrypted body; no guardian/operator/public grant unless explicit audience. |
| `practice_event` | `id uuid PK`; `student_party_id uuid NOT NULL FK party`; `assignment_id uuid NULL FK assignment`; `practice_log_id uuid NOT NULL FK practice_log`; `occurred_at timestamptz NOT NULL`; `duration_seconds integer NOT NULL CHECK 1..86400`; `source text NOT NULL CHECK timer/click/tuner/drone/recording/manual`; `manually_backfilled boolean NOT NULL`; `client_event_id text NOT NULL`; `state text NOT NULL CHECK recorded/queued/backfilled`; `version bigint NOT NULL`. | Unique `(student_party_id, client_event_id)`; `(practice_log_id, occurred_at DESC)`; `(assignment_id, occurred_at DESC)`. | Student-only RLS for select/insert; service sync can update state; teacher/guardian/operator/public denied; no evidentiary projection grant. |
| `practice_log` | `id uuid PK`; `student_party_id uuid NOT NULL FK party`; `label text NULL CHECK length<=120`; `timezone text NOT NULL`; `streak_state jsonb NOT NULL CHECK object`; `last_event_at timestamptz NULL`; `version bigint NOT NULL`. | Unique `(student_party_id, label)`; `(student_party_id, updated_at DESC)`. | Student-only select/update; streak fields are presentation-only and never authorization input; sync service insert; no other-party/anon grant. |
| `progress_report` | `id uuid PK`; `relationship_id uuid NOT NULL FK teacher_student_relationship`; `teacher_party_id uuid NOT NULL FK party`; `student_party_id uuid NOT NULL FK party`; `starts_at timestamptz NOT NULL`; `ends_at timestamptz NOT NULL CHECK ends_at>starts_at`; `evidence_version bigint NOT NULL`; `coverage_hash char(64) NOT NULL`; `coverage_facts jsonb NOT NULL CHECK array`; `approved_at timestamptz NULL`; `audience text NOT NULL CHECK student/student_guardian`; `state text NOT NULL CHECK draft/approved/revoked`; `version bigint NOT NULL`. | Unique `(relationship_id, starts_at, ends_at, version)`; `(student_party_id, approved_at DESC)`; `(teacher_party_id, state, updated_at DESC)`. | Teacher approves own relationship report; student reads approved report; guardian only with consent/audience; no grade/rating fields or public projection; service may revoke. |

### State, Concurrency and Transaction Rules

- Template state is `draft → published → retired`; an instance stores an immutable template snapshot/version. Assignment is `assigned → closed`; each `submission_take` is `uploading → submitted|failed|expired`, and resubmission creates a new immutable row with `supersedes_take_id`.
- Feedback is `committed|revoked`; its 90-day teacher access window and stance/cap are evaluated at write time and on read. A timestamp remains valid when click/tempo is absent; annotations never mutate a prior take.
- Practice events are `queued → recorded|backfilled`; client event IDs provide dedupe. Offline events remain on device and in a durable outbox until acknowledged; they never expire solely because a streak broke.
- Report is `draft → approved|revoked`; approval requires a current relationship/evidence snapshot and `approve=true`. Lock report row and compare `expectedVersion`; a loser receives `VERSION_CONFLICT`.
- Assignment mutation and assignment event commit atomically. Upload transfer may precede final take commit only through a resumable session; hash/size validation occurs before accepting the take. Outbox retry schedule is 2s, 8s, 32s, then persistent queue.

### Grants, RLS and Retention

`education_api` receives execute on bounded artifact RPCs; `education_worker` receives storage/outbox/event updates; `education_migrator` owns DDL. RLS uses BE00 `current_actor_id()`/`current_acting_context_id()` and relationship predicates. Practice logs are private to the student; session/feedback material is encrypted; takes and annotations retain seven years unless a stricter consent/deletion policy applies; object keys are never public.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `EDU-LEARN-API-01` | Current teacher relationship owner; template must be readable/published for the actor. | `403 FORBIDDEN` for expired/nonowned relationship; `404` for hidden template/relationship. |
| `EDU-LEARN-API-02` | Teacher on `assign`; student owner on `submit`; assignment relationship is checked for both. | `403` for wrong party; `404` hides another party's assignment/take. |
| `EDU-LEARN-API-03` | Current teacher on relationship with unexpired access; student receives the result but cannot write. | `403` for wrong/expired teacher; `404` hides a take outside actor scope. |
| `EDU-LEARN-API-04` | Student owner only; optional assignment must also be student-owned. | `403` for guardian/teacher/operator/public named-log access; `404` hides another student's log. |
| `EDU-LEARN-API-05` | Current teacher relationship owner with explicit review authority; audience controls student/guardian read. | `403` for nonteacher/nonrelationship actor; `404` hides another relationship/report. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `EDU-LEARN-API-01` | `requestId` → `strictCors(educationCommandOrigins)` → `requireAuth` → `requireAdultTeacher` → `resolveActingContext` → `rateLimit(curriculumCreate)` → `parseZod(CreateCurriculumRequest)` → `idempotency(24h)` → `authorizeRelationshipAndTemplate` → `transaction` → `audit`. |
| `EDU-LEARN-API-02` | `requestId` → `strictCors(educationArtifactOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(assignmentCommand)` → `parseZod(AssignmentCommandRequest)` → `idempotency(24h)` → `authorizeCommandParty` → `storageGuard` → `assignmentTransaction` → `audit`. |
| `EDU-LEARN-API-03` | `requestId` → `strictCors(educationFeedbackOrigins)` → `requireAuth` → `requireAdultTeacher` → `resolveActingContext` → `rateLimit(feedbackWrite)` → `parseZod(RecordFeedbackRequest)` → `idempotency(24h)` → `authorizeTakeAccess` → `safeguardingGate` → `transaction` → `audit`. |
| `EDU-LEARN-API-04` | `requestId` → `strictCors(educationPrivateOrigins)` → `requireAuth` → `requireAdultStudent` → `resolveActingContext` → `rateLimit(practiceWrite)` → `parseZod(RecordPracticeRequest)` → `idempotency(30d)` → `authorizeStudentRls` → `offlineOutbox` → `transaction` → `audit`. |
| `EDU-LEARN-API-05` | `requestId` → `strictCors(educationReportOrigins)` → `requireAuth` → `requireAdultTeacher` → `resolveActingContext` → `rateLimit(reportApproval)` → `parseZod(ApproveProgressReportRequest)` → `idempotency(24h)` → `authorizeRelationshipReviewer` → `coverageSnapshot` → `transaction` → `audit`. |

### Security and Privacy Controls

Use parameterized SQL, encrypted body/object metadata, private storage buckets, signed short-lived upload URLs, content hash and MIME/size validation, opaque IDs, and no raw audio/text in logs. Teacher feedback cannot bypass stance/access policy; practice data never enters ranking, evaluation, safeguarding or public search. CORS allows only configured origins and never `*` with credentials; artifact/report responses use `private, no-store` where content is personal.

## Data Flow

1. BE00 authenticates actor/context, validates strict Zod union, and reserves idempotency key.
2. Curriculum creation validates relationship/template versions and stores an optional immutable snapshot.
3. Assignment command either stores a teacher-authored assignment or creates a student-owned resumable take after duration/hash checks; storage failure moves to local/durable outbox.
4. Feedback verifies current teacher access, stance/cap and safeguarding, stores encrypted timestamp/range annotation, and emits its event.
5. Practice records private event/log in online or queued state; reconnect worker backfills by client event ID. Report approval reads a versioned coverage snapshot, requires explicit approval, stores facts and audience, and emits audit.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `education.assignment.changed.v1` | `{eventId, assignmentId, takeId?, relationshipId, medium, state, version, occurredAt}`; no instruction/body/object key. | Student/teacher projectors, curriculum progress, notifications. At-least-once, ordered by assignment/version, dedupe by eventId. |
| `education.feedback.changed.v1` | `{eventId, annotationId, takeId, relationshipId, state, accessExpiresAt, version, occurredAt}`; no body or private material. | Authorized participant projector and audit. At-least-once, access rechecked at consume/read. |
| `education.practice.changed.v1` | `{eventId, practiceEventId, studentId, practiceLogId, source, durationBucket, state, version, occurredAt}`; student ID is scoped and content-free. | Student-private projector only; never teacher/public ranking. Dedupe by client event ID/event ID. |

Consumers reject stale versions, retain the last safe projection, retry at 2s/8s/32s, and dead-letter after five attempts with an alert. Event payloads carry BE00 `requestId`/`correlationId` and omit encrypted content.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Invalid schema, relationship, template, stance/cap or report approval | Typed `ApiError` before mutation; no artifact, annotation or report is created. |
| Upload timeout/hash/size failure | Return `UPLOAD_FAILED`; preserve local take and retry at 2s/8s/32s, then durable outbox surviving next open without expiration. |
| Access expiry or safeguarding denial | Return `FORBIDDEN`/`SAFEGUARDING_FAILED`; do not reveal take existence outside scope or create annotation. Student keeps own material after teacher access expiry. |
| Concurrent assignment/report edit | CAS returns `VERSION_CONFLICT`; client rereads authorized current version; no duplicate take/report. |
| Offline practice or sync outage | Store event locally with client key, return `queued`, retry on reconnect, and record one backfill; no streak penalty. |
| Event/worker outage | Transaction remains committed; at-least-once outbox retries, dedupes, alerts, and preserves last safe projection. |
| Deletion/revocation | Revoke derived access, tombstone required audit facts, remove storage through authorized worker, and preserve immutable take/history requirements. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `EDU-LEARN-API-01` | Strict template/version/create union, missing template, exact nullable response. | Teacher relationship, template visibility, no behind-schedule state, CORS/rate. | Immutable snapshot/non-retroactivity, CAS, replay and event. | Catalog timeout/breaker, no partial instance, redacted audit. |
| `EDU-LEARN-API-02` | Discriminated assign/submit, source duration caps, hash/object validation and exact errors. | Party ownership, private storage, object-key secrecy, CORS/rate. | Immutable takes/supersedes, outbox retries, assignment event dedupe. | Upload failure before transfer, durable next-open retry, request metrics. |
| `EDU-LEARN-API-03` | Stance/cap/range/click fallback and exact `201`/error envelope. | Teacher access 90-day expiry, safeguarding channel, no body leak, RLS. | Annotation encryption, CAS, feedback event and access view. | Relationship timeout/breaker, cap refusal, audit redaction. |
| `EDU-LEARN-API-04` | Offline/manual/source/duration bounds and queued response. | Student-only RLS; guardian/teacher/operator/public denial; no evidentiary use. | Client-key dedupe, backfill, streak independence, practice event. | Sync outage/retry, local persistence, private telemetry. |
| `EDU-LEARN-API-05` | Explicit approval literal, interval/hash/facts bounds and exact response. | Relationship reviewer, audience consent, no grades/ratings, CORS/rate. | Evidence snapshot, CAS approval, report RLS, audit event. | Evidence timeout/breaker, concurrent approval, redacted report logs. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, discriminated union behavior, duration/cap/state algorithms, and error matrices. PostgreSQL tests run RLS, encrypted-field, unique, append-only and CAS constraints. Storage tests exercise exact timeout/retry/breaker, hash/size rejection, resumable outbox, and provider reconciliation. Worker tests prove event ordering/dedupe and offline backfill. Playwright covers teacher assignment, student upload failure/retry, feedback refusal/cap, offline practice, approved report, keyboard focus, and safe copy. The gate fails on any route collision, missing operation row, non-`ApiError` response, grade leakage, or practice privacy breach.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all five operations have strict Zod 4 request/success/error schemas, bounded fields, source-specific caps, nullability, and status codes.
- **Pass 2 — macro boundary:** storage, relationship, lesson-access and BE00 ownership are explicit seams; no duplicate lesson or platform route is introduced.
- **Pass 3 — lifecycle/race:** template/instance, assignment/take, feedback, practice and report states use version locks, immutable history and client-key dedupe.
- **Pass 4 — failure/abuse:** upload outbox, offline replay, 90-day access, stance caps, RLS privacy, event retry/breaker and deletion semantics are testable.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, FKs, indexes, RLS/grants, encryption/retention and redacted events.

## Ambiguity Gate

**PASS.** The split is source-aligned (`EDU-09`–`EDU-13`), all five routes have six-cell registry rows and exact operation IDs, every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, states, failure recovery and tests. Storage, relationship, access and evidence seams specify timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 15 and deep dive; locked curriculum, immutable submission, feedback, private practice and approved-report contracts. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox and shared middleware.
- [BE Shard 15a — Teacher facets, discovery and trials](15a-teacher-facets-discovery-trials.md) for teacher discovery and relationship entry context.
- [BE Shard 15b — Lesson booking, credits and delivery](15b-lesson-booking-credits-delivery.md) for delivered-lesson access window and assignment timing.
- [BE Shard 15d — Groups, mentorship and learning paths](15d-group-mentorship-learning-paths.md) for education-wide audit and path references.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for read-only evidence and safeguarding facts where referenced.
