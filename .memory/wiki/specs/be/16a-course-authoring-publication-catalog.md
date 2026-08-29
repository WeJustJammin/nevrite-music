# Course Authoring, Publication & Catalog — Backend Specification

**Status:** Complete
**IA source:** [Shard 16 — Courses, credentials and institutions](../ia/16-education-credentials-institutions.md)
**Deep-dive source:** [Deep Dive 16 — Courses, credentials and institutions](../ia/deep-dives/16-education-credentials-institutions.md)
**Backend foundation:** [BE00 — Cross-cutting platform foundation](00-infrastructure.md)

## Split Group

This split owns individual-adult course admission, immutable course/revision authoring, governed lesson-media uploads, contributor rights attestations, atomic publication, catalog discovery, and scoped withdrawal. It contains `EDU-CI-01`, `EDU-CI-02`, `EDU-CI-03`, `EDU-CI-04`, and `EDU-CI-08`. Commerce, consumption/refunds/diagnostics, exam evidence, institution evolution, and clinical exclusion remain in sibling specifications. Object storage, rights review, moderation, admission, and catalog indexing are external seams.

## Classification

- **Type:** versioned authoring and public-read education catalog boundary.
- **Boundary:** `course`, `course_revision`, `course_section`, `course_lesson`, `course_media`, `course_contributor`, and `course_offer` ownership; buyer, entitlement, playback, progress, refunds, evidence, and organization authority are outside this split.
- **Expected operations:** five HTTP operations, one for each assigned IA interaction (`EDU-CI-01`, `EDU-CI-02`, `EDU-CI-03`, `EDU-CI-04`, `EDU-CI-08`).
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** launch owner is one authorized adult individual; content revisions are immutable after publication; media is private and governed until playable; an external embed never satisfies media or rights gates; withdrawal scopes the smallest lawful revision, lesson, media, or territory.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/16-education-credentials-institutions.md:39-43` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **06.04 Course Marketplace & Authoring** — [ideation source](../ideation/06-education-lessons-mentorship/06.04-course-marketplace-authoring/06.04-course-marketplace-authoring-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [16a](16a-course-authoring-publication-catalog.md#route-registry): `EDU-COURSE-AUTH-API-01`–`EDU-COURSE-AUTH-API-05`; [16b](16b-course-commerce-consumption-refunds.md#route-registry): `EDU-COURSE-COM-API-01`–`EDU-COURSE-COM-API-05`. |
| **06.08 Certificates, Badges & Verification** — [ideation source](../ideation/06-education-lessons-mentorship/06.08-certificates-badges-verification.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [16c](16c-exam-evidence-credential-exclusion.md#route-registry): `EDU-CRED-API-03`. |
| **06.09 Exam Board Alignment** — [ideation source](../ideation/06-education-lessons-mentorship/06.09-exam-board-alignment.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [16c](16c-exam-evidence-credential-exclusion.md#route-registry): `EDU-CRED-API-01`–`EDU-CRED-API-02`. |
| **06.10 Academy & Multi-Teacher Operations** — [ideation source](../ideation/06-education-lessons-mentorship/06.10-academy-multi-teacher-operations.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [16d](16d-institution-gate-clinical-exclusion.md#route-registry): `EDU-INST-API-01`–`EDU-INST-API-02`. |
| **06.11 Music Therapy Practice** — [ideation source](../ideation/06-education-lessons-mentorship/06.11-music-therapy-practice.md); represented in the normative interactions, contracts, data model, access rules and edge cases below. | [16d](16d-institution-gate-clinical-exclusion.md#route-registry): `EDU-INST-API-03`. |

## Referenced Material Inventory

| Source | Section and lines | Material used |
|---|---|---|
| `16-education-credentials-institutions.md` | `Overview`, `Scope Reconciliation`, `Product and Governance Decisions`, `Features`, `Acceptance Criteria` lines 7–63 | Individual ownership, admission, course lifecycle, publication predicate, catalog visibility, and withdrawal decisions. |
| `16-education-credentials-institutions.md` | `Interactions` lines 64–85 | Exact `EDU-CI-01`, `EDU-CI-02`, `EDU-CI-03`, `EDU-CI-04`, and `EDU-CI-08` preconditions, outcomes and edge cases. |
| `16-education-credentials-institutions.md` | `Contracts`, `Course Authoring and Commerce` lines 93–123 | `CourseState`, `MediaState`, `CourseOwner`, `CreateCourse`, `SaveCourseRevision`, upload, publish, offer, and takedown rules. |
| `16-education-credentials-institutions.md` | `Data Models` and typed registry lines 136–186 | Canonical authoring model names, revision membership, media governance, contributor mandates, offers and versions. |
| `16-education-credentials-institutions.md` | `Access Control`, `Access Escalation`, `Accessibility` lines 187–223 | Author/contributor/moderator capabilities, self-approval exclusion, safe catalog fields, and accessible refusal copy. |
| `16-education-credentials-institutions.md` | `Event Schemas`, `Edge Cases`, `Edge-Case Coverage Matrix` lines 225–294 | Course revision/media/publication/offer/takedown events, races, rights deletion and recovery obligations. |
| `16-education-credentials-institutions.md` | `Cross-Shard Section Contract Map`, `Changelog`, `Dependency References` lines 296–312 | Storage, rights, moderation, admission, catalog, and BE00 dependencies. |
| `deep-dives/16-education-credentials-institutions.md` | `Canonical Field Contracts`, `State Machines`, `Course Publication Algorithm` lines 19–59 | Typed field requirements, state transitions, complete-outline/media/rights/moderation gates, and atomic publish. |
| `deep-dives/16-education-credentials-institutions.md` | `Abuse and Recovery Verification`, `Cross-Shard Contracts`, `Implementation Envelope` lines 121–153 | Upload quarantine, takedown scope, idempotent outbox/reconciliation, seam versioning, and bounded commands. |
| `00-infrastructure.md` | BE00 auth/errors/idempotency/rate/CORS/observability | Shared `ApiError`, request IDs, actor/acting context, replay ledger, rate limits, audit, outbox and middleware. |
| `2026-08-02-architecture-design.md` and `ENGINEERING-STANDARDS.md` | Data placement/security/API/testing | Supabase/RLS, private object storage, PII isolation, Zod-first contracts, and verification standards. |

## IA Source Map

| IA interaction | IA behavior retained | Backend operation | Canonical models/events |
|---|---|---|---|
| `EDU-CI-01` Eligible adult author creates course | Adult admission and explicit individual owner are required; minor/unverified/unadmitted actor creates no draft; replay returns original draft. | `EDU-COURSE-AUTH-API-01` | `course`; `education.course-revision.changed.v1` |
| `EDU-CI-02` Author structures and uploads lessons | Draft/review-pending revision, contributor capability, declared purpose/MIME/size/checksum, immutable outline, async scan/transcode, explicit failed/quarantined state. | `EDU-COURSE-AUTH-API-02` | `course_revision`, `course_section`, `course_lesson`, `course_media`, `course_contributor`; `education.course-revision.changed.v1`, `education.course-media.changed.v1` |
| `EDU-CI-03` Author previews and publishes | Complete declared outline, preview, paid lesson, playable media, metadata, rights and moderation gates; publication is atomic. | `EDU-COURSE-AUTH-API-03` | `course_revision`, `course_section`, `course_lesson`, `course_media`, `course_offer`; `education.course.published.v1` |
| `EDU-CI-04` Adult learner discovers course | Territory/age/offer/publication filters; only published allowlisted fields; stale projection freshness is honest; no drafts, paid media or progress. | `EDU-COURSE-AUTH-API-04` | `course`, `course_revision`, `course_offer`; catalog/search projection |
| `EDU-CI-08` Author updates or withdraws course | New revisions use the same predicate; delisting stops new sales/discovery while preserving eligible prior access; smallest lawful takedown scope and frozen purchases. | `EDU-COURSE-AUTH-API-05` | `course`, `course_revision`, `course_media`, `course_offer`; `education.course-takedown.changed.v1`, `education.course-revision.changed.v1` |

## Endpoint Completeness Reconciliation

| IA interaction | Operation ID | Method/path | Request and success | Error/auth/policy coverage |
|---|---|---|---|---|
| `EDU-CI-01` | `EDU-COURSE-AUTH-API-01` | `POST /api/v1/education/courses` | `CreateCourseRequest` → `CreateCourseSuccess` (`201`) | Adult/admission/owner gate, replay, draft privacy and typed `ApiError`. |
| `EDU-CI-02` | `EDU-COURSE-AUTH-API-02` | `POST /api/v1/education/courses/{courseId}/revisions` | `AuthorRevisionRequest` → `AuthorRevisionSuccess` (`201`) | Owner/contributor scope, CAS, upload declaration, scan/transcode, quarantine, retries and typed `ApiError`. |
| `EDU-CI-03` | `EDU-COURSE-AUTH-API-03` | `POST /api/v1/education/courses/{courseId}/revisions/{revisionId}/publish` | `PublishCourseRequest` → `PublishCourseSuccess` (`201`) | Complete edition, media, rights, moderation, offer, CAS and atomic outbox with typed `ApiError`. |
| `EDU-CI-04` | `EDU-COURSE-AUTH-API-04` | `POST /api/v1/education/course-searches` | `DiscoverCourseRequest` → `DiscoverCourseSuccess` (`200`) | Territory/age/availability filtering, public allowlist, freshness, rate and typed `ApiError`. |
| `EDU-CI-08` | `EDU-COURSE-AUTH-API-05` | `POST /api/v1/education/courses/{courseId}/withdrawals` | `WithdrawCourseRequest` → `WithdrawCourseSuccess` (`200`) | Owner/moderator/rights authority, scoped takedown, frozen access, CAS and typed `ApiError`. |

## API Endpoints

### Route Registry

This registry is authoritative. Every contract, error, authorization, idempotency, rate, telemetry, and test row keys to an operation ID below.

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| `EDU-COURSE-AUTH-API-01` | `POST` | `/api/v1/education/courses` | `EDU-CI-01` | Authenticated verified adult with current author admission; explicit individual owner equals actor or authorized mandate. | `201` `CreateCourseSuccess` |
| `EDU-COURSE-AUTH-API-02` | `POST` | `/api/v1/education/courses/{courseId}/revisions` | `EDU-CI-02` | Course owner or revision-scoped contributor with current mandate; course is `draft` or `review_pending`. | `201` `AuthorRevisionSuccess` |
| `EDU-COURSE-AUTH-API-03` | `POST` | `/api/v1/education/courses/{courseId}/revisions/{revisionId}/publish` | `EDU-CI-03` | Course owner or assigned moderator/rights reviewer for scoped case; author cannot self-approve moderation. | `201` `PublishCourseSuccess` |
| `EDU-COURSE-AUTH-API-04` | `POST` | `/api/v1/education/course-searches` | `EDU-CI-04` | Authenticated eligible adult learner; public read projection contains no ownership claim. | `200` `DiscoverCourseSuccess` |
| `EDU-COURSE-AUTH-API-05` | `POST` | `/api/v1/education/courses/{courseId}/withdrawals` | `EDU-CI-08` | Course owner for delist; scoped moderator/rights reviewer for safety/legal/rights action. | `200` `WithdrawCourseSuccess` |

### External Seams

| Seam | Request → response | Timeout | Retry | Circuit breaker |
|---|---|---:|---:|---|
| BE00 identity/admission verifier | `{accessToken, actingContextId, authoringPolicyVersion}` → `{actorId, partyId, roles, adultVerified, admitted, contextVersion}` | 300 ms | 2 retries at 50 ms/150 ms before writes | Open after 5 failures/30 s; half-open after 15 s; fail closed with `503 DEPENDENCY_UNAVAILABLE`. |
| Object storage reservation | `{courseId, revisionId, purpose, mime, sizeBytes, checksum, idempotencyKey}` → `{objectKey, uploadSessionId, expiresAt}` | 700 ms | 2 retries at 100 ms/300 ms using same key; no retry on declaration mismatch | Open after 5 failures/30 s; return `503` with no media row; half-open after 20 s. |
| Malware scan/transcode worker | `{objectKey, checksum, mediaPurpose, revisionId}` → `{mediaState, playableVariantId?, failureCode?, scannerVersion}` | 2,000 ms enqueue | 3 retries at 2 s/8 s/32 s; job dedupe by object/checksum | Open after 5 enqueue failures/60 s; media remains `scanning` or `failed`; half-open after 30 s. |
| Rights/moderation decision service | `{revisionId, contributorAttestations, repertoireRefs, moderationCaseId?}` → `{rightsAccepted, moderationEligible, decisionVersion, scope}` | 900 ms | 2 retries at 150 ms/450 ms for timeout/5xx; no retry on refusal | Open after 4 failures/30 s; publish fails closed with `503`; half-open after 20 s. |
| Catalog projection/indexer | `{courseId, revisionId, offerVersion, state, eventId}` → `{projectionVersion, indexed}` | 800 ms | 3 retries at 200 ms/600 ms/1800 ms, event dedupe | Open after 5 failures/60 s; source transaction stays committed and catalog remains last safe projection; half-open after 30 s. |

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

export const CreateCourseRequest = z.object({
  ...Context.shape, idempotencyKey: Key, ownerPartyId: Uuid, authoringPolicyVersion: z.int().positive(), title: z.string().trim().min(1).max(160), description: z.string().trim().max(4000), instrument: z.string().trim().min(1).max(80), level: z.enum(["beginner", "intermediate", "advanced"]), audience: z.enum(["adult", "general"]),
}).strict();
export const CreateCourseSuccess = z.object({ courseId: Uuid, ownerPartyId: Uuid, state: z.literal("draft"), version: z.int().positive() }).strict();

const UploadIntent = z.object({ purpose: z.enum(["lesson", "preview", "thumbnail"]), mime: z.enum(["audio/mpeg", "audio/wav", "video/mp4", "image/jpeg", "image/png"]), sizeBytes: z.int().positive().max(524288000), checksum: z.string().length(64).regex(/^[a-f0-9]+$/) }).strict();
export const AuthorRevisionRequest = z.object({
  ...Context.shape, idempotencyKey: Key, courseId: Uuid, baseRevisionId: Uuid.nullable(), action: z.enum(["save", "upload_intent"]), outline: z.array(z.object({ sectionId: Uuid.nullable(), title: z.string().trim().min(1).max(160), lessonIds: z.array(Uuid).max(100) }).strict()).max(100), lessonId: Uuid.nullable(), upload: UploadIntent.nullable(), contributorIds: z.array(Uuid).max(50),
}).strict().superRefine((v, c) => { if (v.action === "upload_intent" && (v.lessonId === null || v.upload === null)) c.addIssue({ code: "custom", path: ["upload"], message: "lesson and upload intent required" }); });
export const AuthorRevisionSuccess = z.object({ revisionId: Uuid, uploadSessionId: Uuid.nullable(), state: z.enum(["draft", "review_pending", "uploading"]), version: z.int().positive(), mediaState: z.enum(["reserved", "uploading", "scanning"]).nullable() }).strict();

export const PublishCourseRequest = z.object({ ...Context.shape, idempotencyKey: Key, courseId: Uuid, revisionId: Uuid, expectedRevisionVersion: z.int().positive(), offer: z.object({ amountMinor: z.int().positive(), currency: z.string().length(3).regex(/^[A-Z]{3}$/), territory: z.string().trim().length(2).regex(/^[A-Z]{2}$/), taxClass: z.string().trim().min(1).max(40), refundPolicyVersion: z.int().positive() }).strict(), rightsAttestationIds: z.array(Uuid).min(1).max(100), moderationCaseId: Uuid.nullable(), previewLessonId: Uuid }).strict();
export const PublishCourseSuccess = z.object({ courseId: Uuid, revisionId: Uuid, offerId: Uuid, state: z.literal("published"), projectionVersion: z.int().positive(), version: z.int().positive() }).strict();

export const DiscoverCourseRequest = z.object({ ...Context.shape, idempotencyKey: Key, territory: z.string().trim().length(2).regex(/^[A-Z]{2}$/), ageBand: z.enum(["adult", "general"]), instrument: z.string().trim().min(1).max(80).optional(), level: z.enum(["beginner", "intermediate", "advanced"]).optional(), limit: z.int().min(1).max(50), cursor: z.string().max(256).optional() }).strict();
export const DiscoverCourseSuccess = z.object({ courses: z.array(z.object({ courseId: Uuid, revisionId: Uuid, title: z.string().min(1), instrument: z.string().min(1), level: z.string().min(1), authorDisplay: z.string().min(1), previewAvailable: z.boolean(), offer: z.object({ amountMinor: z.int().positive(), currency: z.string().length(3) }).strict(), freshness: z.object({ projectionVersion: z.int().positive(), indexedAt: DateTime }).strict() }).strict()).max(50), nextCursor: z.string().max(256).nullable() }).strict();

export const WithdrawCourseRequest = z.object({ ...Context.shape, idempotencyKey: Key, courseId: Uuid, scope: z.enum(["course", "revision", "lesson", "media", "territory"]), targetId: Uuid.nullable(), territory: z.string().length(2).regex(/^[A-Z]{2}$/).nullable(), reasonClass: z.enum(["author_delist", "rights", "safety", "legal"]), caseId: z.string().trim().min(1).max(120) }).strict();
export const WithdrawCourseSuccess = z.object({ courseId: Uuid, scope: z.enum(["course", "revision", "lesson", "media", "territory"]), state: z.enum(["delisted", "restricted", "removed"]), priorBuyerAccess: z.enum(["preserved", "scoped_restricted", "overridden_by_law"]), version: z.int().positive() }).strict();
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error response |
|---|---|---|---|
| `EDU-COURSE-AUTH-API-01` | `CreateCourseRequest` | `CreateCourseSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,409,422,429,503` |
| `EDU-COURSE-AUTH-API-02` | `AuthorRevisionRequest` | `AuthorRevisionSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-COURSE-AUTH-API-03` | `PublishCourseRequest` | `PublishCourseSuccess` / `201` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |
| `EDU-COURSE-AUTH-API-04` | `DiscoverCourseRequest` | `DiscoverCourseSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,429,503` |
| `EDU-COURSE-AUTH-API-05` | `WithdrawCourseRequest` | `WithdrawCourseSuccess` / `200` | `ApiError { code, message, requestId, details }` / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation ID | Validation and refusal point |
|---|---|
| `EDU-COURSE-AUTH-API-01` | Require verified adult admission, explicit individual `ownerPartyId`, active authoring policy, bounded metadata and no organization owner at launch. Minor/unverified returns `ADULT_REQUIRED`; unadmitted returns `ADMISSION_REQUIRED`; no draft is created. |
| `EDU-COURSE-AUTH-API-02` | Require `draft` or `review_pending`, owner/contributor capability, base revision CAS, ordered immutable outline, declared upload purpose/MIME/size/checksum. Malformed upload returns `UPLOAD_INVALID`; stale version returns `VERSION_CONFLICT`; scan/transcode failure retains prior assets and marks `failed` or `quarantined`. |
| `EDU-COURSE-AUTH-API-03` | Require complete declared sections/lessons, one preview, at least one paid lesson, every required media `playable`, title/instrument/level/audience/price/tax/refund versions, contributor/repertoire rights and moderation eligibility. Failure returns `PUBLISH_GATE_FAILED`, `MEDIA_NOT_READY`, or `RIGHTS_REQUIRED`; external embed cannot satisfy gates. |
| `EDU-COURSE-AUTH-API-04` | Require eligible adult territory/age projection and bounded filters. Return only published allowlisted metadata/preview/offer; stale freshness is shown; unpublished/ineligible returns honest absence or `COURSE_UNAVAILABLE` without draft/buyer/progress leakage. |
| `EDU-COURSE-AUTH-API-05` | Require owner or scoped case authority, current course version and valid scope/case. Delist stops new sales/discovery; smallest lawful scope is applied; prior purchases keep eligible access; rights/safety/legal scope may override with safe reason. |

### Error, Authorization, Idempotency, Rate and Observability Matrix

| Operation ID | Error codes and 403/404 rule | Idempotency | Rate limit | Observability |
|---|---|---|---|---|
| `EDU-COURSE-AUTH-API-01` | `NOT_AUTHENTICATED`, `ADULT_REQUIRED`, `ADMISSION_REQUIRED`, `VALIDATION_FAILED`, `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `DEPENDENCY_UNAVAILABLE`. `403` for known party without admission/owner authority; `404` only for intentionally hidden target. | Required 24 h; hash includes owner, policy version and metadata. Matching replay returns original draft; different hash returns `IDEMPOTENCY_MISMATCH`. | 10 drafts/hour/author; 30/minute/IP after auth. | Log operationId, requestId, actor hash, courseId, admission/policy versions and result; redact biography and private metadata. |
| `EDU-COURSE-AUTH-API-02` | `UPLOAD_INVALID`, `VERSION_CONFLICT`, `NOT_AUTHORIZED`, `MEDIA_NOT_READY`, `DEPENDENCY_UNAVAILABLE`. `403` for known course without owner/contributor mandate; `404` hides another party's draft. | Required 24 h per revision/upload intent; hash includes base version and checksum. Replay returns original intent/revision; mismatch returns `IDEMPOTENCY_MISMATCH`. | 60 revision writes/hour/contributor; 20 upload intents/hour/course. | Log operationId, requestId, revision/media IDs, checksum prefix, state and scanner version; never log object content, keys or instructions. |
| `EDU-COURSE-AUTH-API-03` | `PUBLISH_GATE_FAILED`, `MEDIA_NOT_READY`, `RIGHTS_REQUIRED`, `VERSION_CONFLICT`, `NOT_AUTHORIZED`, `DEPENDENCY_UNAVAILABLE`. `403` for nonowner/nonassigned reviewer; `404` hides unpublished revision. | Required 24 h; hash includes revision/version/offer/attestation IDs. Replay returns publication; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 publish attempts/hour/revision; 30/hour/author. | Log gate result classes, operationId, requestId, revision/version, moderation decision and projection version; redact prices/rights text. |
| `EDU-COURSE-AUTH-API-04` | `COURSE_UNAVAILABLE`, `NOT_AUTHORIZED`, `VALIDATION_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for ineligible requester context only; `404` or honest empty result for hidden/unpublished course; no existence oracle. | Required 24 h for normalized filter/cursor hash; replay returns same projection cursor; mismatch returns `IDEMPOTENCY_MISMATCH`. | 120 searches/minute/adult learner; 20 concurrent searches. | Log operationId, requestId, territory/age buckets, filter presence, freshness and count; never raw age, buyer, draft or rank data. |
| `EDU-COURSE-AUTH-API-05` | `NOT_AUTHORIZED`, `VERSION_CONFLICT`, `PUBLISH_GATE_FAILED`, `DEPENDENCY_UNAVAILABLE`. `403` for known course without owner/scoped case; `404` hides unknown course. | Required 24 h; hash includes course/version/scope/target/case. Replay returns prior withdrawal; mismatch returns `IDEMPOTENCY_MISMATCH`. | 10 withdrawal commands/hour/actor; legal worker has one claim/course/5 minutes. | Log operationId, requestId, course/version/scope/reason class, case hash and prior-access posture; never reason text or buyer list. |

## Database Schema

### PostgreSQL Model Registry

All tables are in `education`, use UUID primary keys, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`, and `version bigint NOT NULL CHECK (version > 0)`. Published revisions are immutable; BE00 migration, encryption, audit and private-storage policies apply.

| Model | Typed fields, nullability, constraints and foreign keys | Indexes | RLS / grants |
|---|---|---|---|
| `course` | `id uuid PK`; `owner_party_id uuid NOT NULL FK party`; `authoring_policy_version bigint NOT NULL`; `state text NOT NULL CHECK draft/review_pending/published/delisted/restricted/removed`; `current_revision_id uuid NULL FK course_revision`; `title text NOT NULL CHECK length 1..160`; `instrument text NOT NULL`; `level text NOT NULL`; `audience text NOT NULL`; `version bigint NOT NULL`. | Unique `(owner_party_id, title) WHERE state <> removed`; `(owner_party_id, state, updated_at DESC)`; `(state, current_revision_id)`. | Owner selects/updates own drafts; public view selects published allowlisted fields; moderator/rights reviewer needs scoped case; anon receives only catalog view, never base table. |
| `course_revision` | `id uuid PK`; `course_id uuid NOT NULL FK course ON DELETE RESTRICT`; `revision_number bigint NOT NULL CHECK >0`; `base_revision_id uuid NULL FK course_revision`; `declared_complete boolean NOT NULL`; `metadata jsonb NOT NULL CHECK object`; `rights_summary jsonb NOT NULL CHECK object`; `moderation_state text NOT NULL CHECK pending/eligible/blocked`; `state text NOT NULL CHECK draft/review_pending/published/delisted/restricted/removed`; `published_at timestamptz NULL`; `version bigint NOT NULL`. | Unique `(course_id, revision_number)`; `(course_id, state, updated_at DESC)`; partial `(moderation_state) WHERE state='review_pending'`. | Owner/contributor reads scoped drafts; immutable published row; moderator/rights reviewer reads assigned case; public view only. |
| `course_section` | `id uuid PK`; `revision_id uuid NOT NULL FK course_revision ON DELETE CASCADE`; `position integer NOT NULL CHECK >=0`; `title text NOT NULL CHECK length 1..160`; `version bigint NOT NULL`. | Unique `(revision_id, position)`; `(revision_id, id)`. | Revision-author capability selects/writes before publication; public view only through published projection; no anon base grant. |
| `course_lesson` | `id uuid PK`; `section_id uuid NOT NULL FK course_section ON DELETE CASCADE`; `revision_id uuid NOT NULL FK course_revision`; `position integer NOT NULL CHECK >=0`; `title text NOT NULL CHECK length 1..160`; `duration_seconds integer NOT NULL CHECK 1..86400`; `is_preview boolean NOT NULL`; `practice_task_ref uuid NULL`; `version bigint NOT NULL`. | Unique `(section_id, position)`; `(revision_id, is_preview)`; `(revision_id, id)`. | Owner/contributor writes prepublication; learner sees published metadata and preview only; practice ref is read-only projection; anon no base grant. |
| `course_media` | `id uuid PK`; `lesson_id uuid NOT NULL FK course_lesson ON DELETE CASCADE`; `revision_id uuid NOT NULL FK course_revision`; `object_key text NOT NULL`; `purpose text NOT NULL CHECK lesson/preview/thumbnail`; `mime text NOT NULL`; `size_bytes bigint NOT NULL CHECK >0`; `checksum char(64) NOT NULL`; `state text NOT NULL CHECK reserved/uploading/scanning/transcoding/playable/failed/quarantined/removed`; `rights_scope text NOT NULL`; `retention_until timestamptz NOT NULL`; `version bigint NOT NULL`. | Unique `(revision_id, checksum, purpose)`; `(lesson_id, state)`; `(state, updated_at)`; `(retention_until)`. | Worker/service role writes states; owner sees own media status; public receives signed access only for published playable media; object key never exposed; anon no table grant. |
| `course_contributor` | `id uuid PK`; `revision_id uuid NOT NULL FK course_revision ON DELETE CASCADE`; `party_id uuid NOT NULL FK party`; `role text NOT NULL CHECK author/editor/rights`; `mandate_id uuid NOT NULL FK mandate`; `ownership_assertion text NOT NULL`; `effective_from timestamptz NOT NULL`; `effective_to timestamptz NULL CHECK > effective_from`; `version bigint NOT NULL`. | Unique `(revision_id, party_id, role)`; `(party_id, effective_to)`; `(mandate_id)`. | Contributor selects only revisions with current mandate; owner retains ownership; rights reviewer sees assigned attestations; uploader identity never grants capability; anon no grant. |
| `course_offer` | `id uuid PK`; `course_id uuid NOT NULL FK course`; `revision_id uuid NOT NULL FK course_revision`; `amount_minor bigint NOT NULL CHECK >0`; `currency char(3) NOT NULL CHECK uppercase ISO-4217`; `territory char(2) NOT NULL`; `tax_class text NOT NULL`; `refund_policy_version bigint NOT NULL`; `state text NOT NULL CHECK draft/active/retired`; `version bigint NOT NULL`. | Unique `(course_id, revision_id, territory, version)`; `(course_id, state, territory)`; `(territory, state, updated_at DESC)`. | Owner manages future offers; catalog/checkout reads active disclosed snapshot; buyer writes no offer; public view contains only active amount/currency/territory; anon view is allowlisted. |

### State, Concurrency and Transaction Rules

- `course` and `course_revision` move `draft → review_pending → published`, or `delisted|restricted|removed`; published content is immutable. `course_media` moves through `reserved → uploading → scanning → transcoding → playable`, or `failed|quarantined|removed`.
- Revision authoring locks the course/revision and checks `expectedVersion`; same-field conflicts return `VERSION_CONFLICT` and never overwrite. Upload intents reserve private objects only after purpose/MIME/size/checksum validation.
- Publication checks complete outline, one preview, one paid lesson, playable required media, metadata, offer, rights and moderation in one transaction; revision state, offer, audit and outbox event commit together or not at all.
- Catalog discovery reads a safe published projection. A stale index returns freshness metadata; it does not make drafts, paid media, buyer lists, or progress visible.
- Withdrawal locks course and affected projection rows, applies the smallest lawful scope, writes a takedown event, and preserves eligible prior-buyer access. Rights/safety/legal cases may override access only with an auditable safe reason.

### Grants, RLS and Retention

`education_api` receives execute on bounded authoring/publication/search/withdrawal RPCs; `education_worker` writes media states, projections and outbox; `education_migrator` owns DDL. RLS uses BE00 `current_actor_id()` and `current_acting_context_id()`. Drafts and object keys are private; published media uses short-lived signed access; revision/rights/audit facts retain seven years or applicable legal minimum.

## Middleware & Policies

### Authorization Matrix

| Operation ID | Allowed roles and ownership | 403 vs 404 |
|---|---|---|
| `EDU-COURSE-AUTH-API-01` | Verified adult admitted author; explicit individual owner. | `403` for known party without admission/owner capability; `404` only for intentionally hidden target. |
| `EDU-COURSE-AUTH-API-02` | Course owner or revision-scoped contributor with current mandate. | `403` for known course without capability; `404` hides another party's draft. |
| `EDU-COURSE-AUTH-API-03` | Owner plus separate assigned moderator/rights reviewer for approval; no self-approval. | `403` for wrong owner/reviewer; `404` hides unpublished revision. |
| `EDU-COURSE-AUTH-API-04` | Eligible adult learner; public projection only. | `403` for blocked/ineligible context without revealing why; `404` or empty for unpublished/unknown course. |
| `EDU-COURSE-AUTH-API-05` | Owner for delist or scoped moderator/rights reviewer for case. | `403` for known course without mandate/case; `404` hides unknown course. |

### Per-Operation Middleware Registry

| Operation ID | Middleware chain (CORS named) |
|---|---|
| `EDU-COURSE-AUTH-API-01` | `requestId` → `strictCors(educationAuthoringOrigins)` → `requireAuth` → `requireAdult` → `resolveActingContext` → `rateLimit(courseCreate)` → `parseZod(CreateCourseRequest)` → `idempotency(24h)` → `requireAdmission` → `authorizeIndividualOwner` → `transaction` → `audit`. |
| `EDU-COURSE-AUTH-API-02` | `requestId` → `strictCors(educationAuthoringOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(revisionWrite)` → `parseZod(AuthorRevisionRequest)` → `idempotency(24h)` → `authorizeOwnerOrContributor` → `uploadDeclarationGuard` → `revisionTransaction` → `audit`. |
| `EDU-COURSE-AUTH-API-03` | `requestId` → `strictCors(educationPublicationOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(coursePublish)` → `parseZod(PublishCourseRequest)` → `idempotency(24h)` → `authorizeOwnerAndReviewer` → `rightsModerationGate` → `publicationTransaction` → `audit`. |
| `EDU-COURSE-AUTH-API-04` | `requestId` → `strictCors(educationCatalogOrigins)` → `requireAuth` → `requireEligibleAdult` → `rateLimit(courseDiscovery)` → `parseZod(DiscoverCourseRequest)` → `publishedProjectionOnly` → `freshnessGuard` → `traceSearch`. |
| `EDU-COURSE-AUTH-API-05` | `requestId` → `strictCors(educationPublicationOrigins)` → `requireAuth` → `resolveActingContext` → `rateLimit(courseWithdrawal)` → `parseZod(WithdrawCourseRequest)` → `idempotency(24h)` → `authorizeOwnerOrCaseReviewer` → `scopeGuard` → `withdrawalTransaction` → `audit`. |

### Security and Privacy Controls

Use parameterized SQL, opaque IDs, private storage buckets, signed upload/access URLs, checksum/MIME/size validation, encrypted private notes, and safe allowlisted catalog fields. Never trust uploader identity as contributor authority, external embeds as rights/media proof, client freshness, or client publication state. CORS never permits `*` with credentials; draft, media, authoring and withdrawal responses are `private, no-store`.

## Data Flow

1. BE00 authenticates actor/context, validates strict Zod input, and reserves the idempotency key.
2. Course creation checks adult admission and writes a private draft. Revision authoring locks the current version, writes outline/contributor records, and obtains a governed upload session; scan/transcode jobs update media state asynchronously.
3. Publication verifies all gates, creates/updates the offer, commits revision state and `education.course.published.v1`, and indexes only after commit.
4. Discovery filters safe published projections by territory/age/offer and returns freshness; no private course or progress joins occur.
5. Withdrawal applies scoped state and `education.course-takedown.changed.v1`; dependent catalog/storage/entitlement workers invalidate only affected access, preserving eligible frozen purchases.

## Events and Consumer Contracts

| Event type | Producer and exact payload | Consumers / delivery |
|---|---|---|
| `education.course-revision.changed.v1` | `{eventId, courseId, revisionId, state, revisionVersion, declaredComplete, occurredAt}`; no draft content or rights text. | Authoring/projection workers; at-least-once ordered by course/revision/version and deduped by eventId. |
| `education.course-media.changed.v1` | `{eventId, mediaId, lessonId, revisionId, state, version, scannerVersion, occurredAt}`; no object key/content. | Publication gate and editor; stale versions rejected; failed/quarantined state remains explicit. |
| `education.course.published.v1` | `{eventId, courseId, revisionId, offerId, territory, eligibility, version, occurredAt}`; only allowlisted metadata. | Catalog/search/notification projectors; index retry is durable. |
| `education.course-offer.changed.v1` | `{eventId, courseId, revisionId, offerId, territory, currency, taxClass, refundPolicyVersion, state, version, occurredAt}`. | Catalog/checkout; offer snapshot is immutable once a purchase starts. |
| `education.course-takedown.changed.v1` | `{eventId, courseId, scope, targetId?, territory?, state, reasonClass, version, occurredAt}`; no case text or buyer list. | Storage/catalog/entitlement projector; smallest scope applied and deduped. |

Consumers retry at 2s/8s/32s, dead-letter after five attempts with an alert, preserve the last safe projection, and carry BE00 `requestId`/`correlationId`.

## Error Handling and Failure Recovery

| Failure | Required result and recovery |
|---|---|
| Admission, adult, ownership or schema failure | Typed error before mutation; no draft/revision/media reservation or event. |
| Upload declaration/storage failure | `UPLOAD_INVALID` before reservation or `503` on storage outage; successful prior assets remain; retry uses same idempotency key. |
| Scan/transcode failure | Preserve draft and successful assets; mark media `failed` or `quarantined`; retry job 2s/8s/32s; publication remains blocked. |
| Publication gate failure | `PUBLISH_GATE_FAILED`, `MEDIA_NOT_READY`, or `RIGHTS_REQUIRED`; no catalog projection or partial offer. |
| Version race | `VERSION_CONFLICT` with authorized current version/diff; client rereads and confirms; no same-field overwrite. |
| Catalog/index outage | Source transaction remains committed; durable event retry and last-safe projection; never expose unpublished content. |
| Rights/safety/legal takedown | Apply scoped state, emit event, invalidate dependent projection, retain required evidence/tombstone, and preserve unrelated prior access. |
| Duplicate event/replay | Dedupe by eventId, provider job ID and idempotency key; return original effect without a second reservation/publication. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract tests | Policy/security tests | Persistence/integration tests | Failure/observability tests |
|---|---|---|---|---|
| `EDU-COURSE-AUTH-API-01` | Strict metadata/owner/admission schema and exact `201`/error envelope. | Adult/admission, individual owner, draft privacy, CORS/rate. | Idempotent draft, unique owner/name, RLS and audit. | Admission timeout/breaker, replay/hash mismatch, redaction. |
| `EDU-COURSE-AUTH-API-02` | Outline/upload discriminant, checksum/MIME/size bounds, CAS response. | Owner/contributor mandate, private object, no uploader authority, CORS/rate. | Immutable revision/outline, upload intent, media state and outbox. | Storage/scan/transcode retry/breaker, quarantine, request telemetry. |
| `EDU-COURSE-AUTH-API-03` | Complete publication request, offer and rights IDs, exact gate errors. | Separate reviewer, rights/moderation, no external embed bypass, CORS/rate. | Atomic revision/offer/outbox/index handoff and replay. | Gate failure/no partial projection, index retry, event dedupe. |
| `EDU-COURSE-AUTH-API-04` | Filter bounds, freshness and public result shape; no private fields. | Territory/age filter, projection allowlist, no draft/buyer/progress leak. | Snapshot cursor and stale projection behavior. | Search/index outage, empty honesty, telemetry redaction. |
| `EDU-COURSE-AUTH-API-05` | Scope/target/case schema and exact state response. | Owner/scoped-case authorization, smallest-scope rule, frozen access. | CAS, takedown outbox, dependent invalidation and replay. | Rights/service timeout/breaker, audit correlation, no buyer leak. |

### Test Levels and Acceptance Gates

Vitest validates Zod 4 schemas, publication gates, state transitions and idempotency. PostgreSQL tests run RLS, CAS, unique revision/order, immutable publication, contributor mandates and private storage metadata. Adapter tests exercise exact timeout/retry/backoff/breaker behavior for storage, scan, rights and indexing. Worker tests prove event ordering, dedupe, quarantine and scoped invalidation. Playwright covers adult admission, authoring/upload failure, publication refusal, catalog discovery freshness, scoped withdrawal, keyboard focus and safe copy. The gate fails on any route collision, missing operation row, non-`ApiError` response or private-field leak.

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** all five routes have strict Zod 4 request/success/error schemas, bounded fields, statuses and exact error envelope.
- **Pass 2 — macro boundary:** admission, storage, scan/transcode, rights, moderation, catalog and BE00 ownership are exact seams; commerce and entitlement routes are not duplicated.
- **Pass 3 — lifecycle/race:** course/revision/media/offer transitions use CAS, immutable published content, atomic publication and scoped takedown.
- **Pass 4 — failure/abuse:** upload quarantine, external-embed rejection, no self-approval, retries/breakers, deletion/tombstone and event dedupe are testable.
- **Pass 5 — data/privacy:** every canonical model has typed fields, nullability, constraints, FKs, indexes, RLS/grants, retention and redacted events.

## Ambiguity Gate

**PASS.** The split is source-aligned (`EDU-CI-01`, `EDU-CI-02`, `EDU-CI-03`, `EDU-CI-04`, `EDU-CI-08`), all five routes have six-cell registry rows and exact operation IDs, and every operation has request/success/error (`ApiError { code, message, requestId, details }`), authorization/403-vs-404, idempotency, rate, named CORS middleware, observability, persistence, state, failure recovery and tests. Admission, storage, scan/transcode, rights, moderation and catalog seams specify exact timeout/retry/breaker behavior. No unresolved product or architecture choice remains.

## Open Questions

None.

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Authored production backend specification from IA Shard 16 and deep dive; locked individual ownership, immutable authoring, publication gates, catalog filtering and scoped withdrawal. |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md) for `ApiError`, auth/context, idempotency, rate, CORS, audit, outbox and shared middleware.
- [BE Shard 16b — Course commerce, consumption and refunds](16b-course-commerce-consumption-refunds.md) for offer snapshots, prior-buyer access and withdrawal consumers.
- [BE Shard 16c — Exam and credential boundary](16c-exam-evidence-credential-exclusion.md) for separate evidence semantics.
- [BE Shard 16d — Institution and clinical gate](16d-institution-gate-clinical-exclusion.md) for future organization authority and exclusion boundaries.
- [IA Shard 02 — Profiles and verification](../ia/02-profiles-verification.md) for profile visibility and rights/evidence projections where referenced.
