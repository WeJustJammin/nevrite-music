# Shard 16 — Courses, credentials, institutions and special practice

**Status:** Complete
**Surface:** Astro hybrid web/PWA with React islands
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 16 owns governed course authoring, catalog sales, course entitlements, consumption, third-party exam-board alignment and the future academy teaching-operations boundary. It does not issue platform credentials, infer musicianship, admit health/therapy records, merge course entitlements with lesson credits or activate institution administration before consumer launch is ready.

### Scope Reconciliation

| Reconciliation item | Result |
|---|---|
| In-scope source documents loaded | 9 |
| Child capabilities reconciled | 7 |
| Course chain | Authoring/publishing, catalog/pricing/enrollment, consumption/completion |
| Third-party education evidence | Exam-board syllabus mapping, deadlines and externally issued result records |
| Deferred institution capability | Academy/multi-teacher operations behind post-consumer `/evolve-feature` gate |
| Excluded capabilities | Platform certificates/badges and music-therapy practice |
| Launch age boundary | Adult authors and purchasers only; minors cannot buy, consume UGC courses or enter academy flows |

### Product and Governance Decisions

| Area | Locked decision |
|---|---|
| Marketplace admission | Governed adult-author intake. Admission mode is a versioned setting, but publication always requires identity, rights, metadata, media and policy gates. |
| Course completeness | A paid course publishes only a complete declared edition. Later additions are free living-entitlement updates; unfinished promises are not sold. |
| Repertoire | Authors may reference lawful repertoire; third-party recordings, notation or editions are not hosted without verified rights. |
| Course support | Course purchase is asynchronous and creates no author Q&A or response obligation. A separate lesson/service offer may be linked. |
| Offline media | Deferred. Launch delivery is authorized streaming; progress and approved text metadata may cache, governed media may not. |
| Credentials | Shard 02 displays approved third-party evidence. WeJammin never issues a skill certificate, badge, grade or trust mark. |
| Exam boards | Absent at US consumer launch. Future board support is additive, per-board and per-syllabus-version; grades are never normalized. |
| Institutions | Multi-teacher academy operations are fully deferred until consumer readiness and explicit `/evolve-feature`. |
| Therapy | Music-therapy/clinical records, treatment goals, outcome instruments, insurance billing and PHI are prohibited from this product estate. |

## Features

- **06.04 Course Marketplace & Authoring** — [ideation source](../ideation/06-education-lessons-mentorship/06.04-course-marketplace-authoring/06.04-course-marketplace-authoring-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **06.08 Certificates, Badges & Verification** — [ideation source](../ideation/06-education-lessons-mentorship/06.08-certificates-badges-verification.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **06.09 Exam Board Alignment** — [ideation source](../ideation/06-education-lessons-mentorship/06.09-exam-board-alignment.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **06.10 Academy & Multi-Teacher Operations** — [ideation source](../ideation/06-education-lessons-mentorship/06.10-academy-multi-teacher-operations.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **06.11 Music Therapy Practice** — [ideation source](../ideation/06-education-lessons-mentorship/06.11-music-therapy-practice.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-EDU-CI-01 — Eligible adult author creates course:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Resolve acting party and admission; create private draft with explicit individual owner and policy version, and (6) return Draft exists; no catalog projection; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-02 — Author structures and uploads lessons:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Save immutable outline revisions; create governed upload intents; transcode/scan asynchronously without losing draft state, and (6) return Media becomes playable or retryable with reason; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-03 — Author previews and publishes:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Render learner projection; verify complete declared edition, price, preview, playable lessons, metadata, rights and moderation state, and (6) return Revision publishes atomically or returns typed failures; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-04 — Adult learner discovers course:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply publication, territory, age and availability filters; show price, preview, author and read-only verified-credit projection, and (6) return Eligible catalog result or honest absence; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-05 — Adult learner buys course:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze offer/tax/refund terms; reconcile hosted payment; idempotently grant product-scoped entitlement, and (6) return Paid entitlement or no grant/no charge; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-06 — Buyer purchases course-plus-lessons:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) One checkout atomically grants a course entitlement and Shard 15 teacher/academy-scoped credit event, and (6) return Both grants commit or both fail; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-07 — Entitled learner consumes course:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorize current entitlement/revision, stream media, save monotonic per-lesson progress and open preconfigured Shard 15 practice, and (6) return Resume state persists without completion pressure; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-08 — Author updates or withdraws course:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Publish new immutable revision or delist future sales; preserve prior-buyer access except scoped rights/safety/legal takedown, and (6) return Catalog changes without arbitrary entitlement loss; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-09 — Buyer requests refund:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate frozen 14-day policy, material consumption under 20%, defect/misrepresentation evidence and mandatory-law overrides, and (6) return Refund revokes access; progress/practice facts remain private; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-10 — Author reviews course diagnostics:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Produce delayed, thresholded aggregates for starts, lesson drop-off and returns; exclude named learner progress and musicianship claims, and (6) return Diagnostic report, never engagement target; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-11 — Future teacher creates exam goal:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) If board support is enabled, pin board/instrument/grade/syllabus version and external session/deadline, and (6) return Component plan exists without synthetic equivalence; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-12 — Teacher records exam result:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record self-reported or third-party-evidenced result with issuer/provenance and consented Shard 02 projection, and (6) return Honest evidence state; no platform-issued credential; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-13 — Future academy configures operations:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Post-consumer gate resolves organization mandate, roster, terms, rates, rooms and academy-scoped liabilities, and (6) return Institution workspace exists only after evolution gate; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-14 — Future teacher joins/leaves academy:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Join by mandate without transferring personal identity; preserve academy student/credit continuity and isolate private practice, and (6) return Roster changes without profile capture or data leakage; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-15 — User requests certificate/badge:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reject platform issuance and direct user to external evidence recording where applicable, and (6) return No artifact, score or credential-block contamination; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-CI-16 — User submits therapy/clinical data:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Purpose/schema controls reject health-purpose fields and route ordinary non-clinical tuition to Shard 15, and (6) return No PHI or clinical record enters storage, logs or analytics; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Actor and intent | System flow | Terminal outcome |
|---|---|---|---|
| EDU-CI-01 | Eligible adult author creates course | Resolve acting party and admission; create private draft with explicit individual owner and policy version. | Draft exists; no catalog projection. |
| EDU-CI-02 | Author structures and uploads lessons | Save immutable outline revisions; create governed upload intents; transcode/scan asynchronously without losing draft state. | Media becomes playable or retryable with reason. |
| EDU-CI-03 | Author previews and publishes | Render learner projection; verify complete declared edition, price, preview, playable lessons, metadata, rights and moderation state. | Revision publishes atomically or returns typed failures. |
| EDU-CI-04 | Adult learner discovers course | Apply publication, territory, age and availability filters; show price, preview, author and read-only verified-credit projection. | Eligible catalog result or honest absence. |
| EDU-CI-05 | Adult learner buys course | Freeze offer/tax/refund terms; reconcile hosted payment; idempotently grant product-scoped entitlement. | Paid entitlement or no grant/no charge. |
| EDU-CI-06 | Buyer purchases course-plus-lessons | One checkout atomically grants a course entitlement and Shard 15 teacher/academy-scoped credit event. | Both grants commit or both fail. |
| EDU-CI-07 | Entitled learner consumes course | Authorize current entitlement/revision, stream media, save monotonic per-lesson progress and open preconfigured Shard 15 practice. | Resume state persists without completion pressure. |
| EDU-CI-08 | Author updates or withdraws course | Publish new immutable revision or delist future sales; preserve prior-buyer access except scoped rights/safety/legal takedown. | Catalog changes without arbitrary entitlement loss. |
| EDU-CI-09 | Buyer requests refund | Evaluate frozen 14-day policy, material consumption under 20%, defect/misrepresentation evidence and mandatory-law overrides. | Refund revokes access; progress/practice facts remain private. |
| EDU-CI-10 | Author reviews course diagnostics | Produce delayed, thresholded aggregates for starts, lesson drop-off and returns; exclude named learner progress and musicianship claims. | Diagnostic report, never engagement target. |
| EDU-CI-11 | Future teacher creates exam goal | If board support is enabled, pin board/instrument/grade/syllabus version and external session/deadline. | Component plan exists without synthetic equivalence. |
| EDU-CI-12 | Teacher records exam result | Record self-reported or third-party-evidenced result with issuer/provenance and consented Shard 02 projection. | Honest evidence state; no platform-issued credential. |
| EDU-CI-13 | Future academy configures operations | Post-consumer gate resolves organization mandate, roster, terms, rates, rooms and academy-scoped liabilities. | Institution workspace exists only after evolution gate. |
| EDU-CI-14 | Future teacher joins/leaves academy | Join by mandate without transferring personal identity; preserve academy student/credit continuity and isolate private practice. | Roster changes without profile capture or data leakage. |
| EDU-CI-15 | User requests certificate/badge | Reject platform issuance and direct user to external evidence recording where applicable. | No artifact, score or credential-block contamination. |
| EDU-CI-16 | User submits therapy/clinical data | Purpose/schema controls reject health-purpose fields and route ordinary non-clinical tuition to Shard 15. | No PHI or clinical record enters storage, logs or analytics. |

### Global Interaction Rules

- Course, revision, price offer, entitlement, lesson credit, progress, practice, exam evidence and institution mandate are distinct facts.
- Publication, purchase, refund, entitlement revocation and takedown use frozen policy versions, idempotency keys and immutable audit.
- Verified credits establish work provenance, not teaching quality; absence is never a negative signal.
- Course completion is descriptive. It cannot produce a badge, score, public rank, inferred skill or teacher-performance judgment.
- Configuration uses governed Shard 03 setting definitions with typed scope, approval, audit and fail-safe defaults. Settings cannot bypass age, rights, payment, authorization, privacy or prohibited-data invariants.

## Contracts

### Core Types and Errors

| Type | Contract |
|---|---|
| `CourseId`, `CourseRevisionId`, `LessonId` | Opaque immutable identifiers; revision membership/order is versioned. |
| `CourseOwner` | Launch: one authorized adult individual party. Future organization ownership requires explicit signed mandate and contributor rights. |
| `CourseState` | `draft`, `review_pending`, `published`, `delisted`, `restricted`, `removed`. |
| `MediaState` | `reserved`, `uploading`, `scanning`, `transcoding`, `playable`, `failed`, `quarantined`, `removed`. |
| `EntitlementState` | `pending_payment`, `active`, `refund_pending`, `revoked`, `disputed`. |
| `ProgressState` | Per lesson: furthest confirmed position, completion marker, source device version and updated time. |
| `EvidenceState` | `self_reported`, `issuer_verified`, `expired`, `revoked`, `superseded`; issuer controls meaning. |
| `InstitutionGate` | `disabled`, `design_only`, `enabled`; launch value is `disabled` and cannot change without `/evolve-feature`. |
| Errors | `NOT_AUTHENTICATED`, `NOT_AUTHORIZED`, `ADULT_REQUIRED`, `ADMISSION_REQUIRED`, `VERSION_CONFLICT`, `UPLOAD_INVALID`, `MEDIA_NOT_READY`, `RIGHTS_REQUIRED`, `PUBLISH_GATE_FAILED`, `COURSE_UNAVAILABLE`, `ALREADY_OWNED`, `PAYMENT_PENDING`, `ENTITLEMENT_REQUIRED`, `REFUND_INELIGIBLE`, `BOARD_UNSUPPORTED`, `INSTITUTION_DISABLED`, `PROHIBITED_HEALTH_DATA`. |

### Course Authoring and Commerce

| Contract | Rule |
|---|---|
| `CreateCourse` | Requires admitted adult author, explicit owner, idempotency key and active authoring-policy version. |
| `SaveCourseRevision` | Optimistic version check; immutable prior revision; same-field conflict never silently overwrites. |
| `CreateMediaUploadIntent` | Purpose/MIME/size/checksum declared; private object reservation; scan/transcode job references identifiers only. |
| `PublishCourseRevision` | Complete disclosed outline, one preview, one or more paid lessons, all required media playable, price/tax class, rights attestations and moderation eligibility. |
| `CreateCourseOffer` | One-off price at launch; currency/territory/tax/refund terms freeze into purchase snapshot. |
| `GrantCourseEntitlement` | Product-scoped and idempotent; cannot be spent, transferred or interpreted as money. |
| `GrantEducationBundle` | Payment reconciles once; entitlement grant and Shard 15 credit grant share one atomic application transaction. |
| `EvaluateCourseRefund` | 14 calendar days and consumption below 20% for change-of-mind; verified defect, misrepresentation and mandatory law override. |
| `ApplyCourseTakedown` | Scope to revision/lesson/media/territory where possible; legal/safety removal overrides legacy access and supplies a safe reason. |

### Consumption, Evidence and Institution Boundaries

| Contract | Rule |
|---|---|
| `AuthorizeCoursePlayback` | Active entitlement plus eligible revision/media; signed access is short-lived and never creates authority. |
| `AdvanceLessonProgress` | Accept furthest confirmed position; concurrent devices converge monotonically; regressions require explicit restart intent. |
| `OpenCoursePractice` | Sends course/revision/lesson/task provenance and tool preset to Shard 15; practice remains student-private. |
| `ProjectAuthorDiagnostics` | Minimum cohort threshold, delayed buckets and bounded dimensions; no named learner or private-practice join. |
| `CreateExamGoal` | Future-only supported board/version; component mapping remains per-board and references repertoire rather than hosting it. |
| `RecordExternalExamResult` | Issuer, board, subject, grade, date, evidence state and provenance; Shard 02 controls profile projection. |
| `ConfigureAcademyEducation` | Institution gate plus organization authority; no enterprise feature is a consumer-launch dependency. |
| `RejectClinicalPurpose` | Reject therapy, diagnosis, treatment, clinical note, health outcome and insurance-purpose schemas before persistence. |

## Data Models

| Model | Relationships and invariants |
|---|---|
| `course` | Owner party, authoring policy, state; launch owner is individual; no mutable published content inline. |
| `course_revision` | Course, version, declared completeness, metadata, rights summary, moderation state; immutable after publication. |
| `course_section` / `course_lesson` | Revision-scoped ordered tree; lesson owns preview flag, duration and practice-task reference. |
| `course_media` | Lesson, governed object metadata, role, checksum, media state, rights/retention/takedown scope. |
| `course_contributor` | Party, role, ownership/licence assertion and mandate evidence; never inferred from uploader. |
| `course_offer` | Course/revision eligibility, amount/currency, territory, tax class, refund-policy version and lifecycle. |
| `course_purchase` | Buyer, frozen offer, payment reference, idempotency, tax/refund snapshot and state. |
| `course_entitlement` | Buyer/course/purchase, active/revoked state, grant/revocation reason; unique active grant per buyer/course. |
| `entitled_revision_access` | Purchase-time revision plus later eligible revisions; preserves bought material except lawful scoped removal. |
| `course_progress` | Learner/entitlement/lesson, furthest position, completion marker and version; private and retained after refund. |
| `course_diagnostic_bucket` | Course/revision/lesson/time bucket aggregates after privacy threshold; no learner key. |
| `exam_board` / `syllabus_version` | Future registry; board/instrument/grade/territory/version/effective dates; never cross-board normalized. |
| `exam_requirement` / `exam_goal` | Versioned components and learner goal; references only, with component coverage not synthetic percentage. |
| `external_exam_result` | Learner, issuer/board, grade/result, date, provenance and evidence state; not platform-issued. |
| `academy_education_config` | Future-only organization policy, term/rate/room references and gate version. |
| `academy_roster_mandate` | Future organization/teacher authority and term; teacher identity remains personal. |
| `academy_student_relationship` | Future organization/student relationship isolated from teacher private-book relationships. |
| `academy_credit_liability` | Future derived academy-scoped Shard 15 entitlement liability; not a cash wallet. |

PostgreSQL owns canonical metadata, policy, state, audit, idempotency and outbox. Supabase Storage holds private immutable course bytes behind database-owned purpose/rights/retention. Search and catalog projections contain only published allowlisted fields. Realtime emits authorized ID/version invalidations, never entitlements or learner progress.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`course`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner party, authoring policy, state; launch owner is individual; no mutable published content inline..
- **`course_revision`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Course, version, declared completeness, metadata, rights summary, moderation state; immutable after publication..
- **`course_section`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Revision-scoped ordered tree; lesson owns preview flag, duration and practice-task reference..
- **`course_lesson`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Revision-scoped ordered tree; lesson owns preview flag, duration and practice-task reference..
- **`course_media`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Lesson, governed object metadata, role, checksum, media state, rights/retention/takedown scope..
- **`course_contributor`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party, role, ownership/licence assertion and mandate evidence; never inferred from uploader..
- **`course_offer`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Course/revision eligibility, amount/currency, territory, tax class, refund-policy version and lifecycle..
- **`course_purchase`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Buyer, frozen offer, payment reference, idempotency, tax/refund snapshot and state..
- **`course_entitlement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Buyer/course/purchase, active/revoked state, grant/revocation reason; unique active grant per buyer/course..
- **`entitled_revision_access`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Purchase-time revision plus later eligible revisions; preserves bought material except lawful scoped removal..
- **`course_progress`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Learner/entitlement/lesson, furthest position, completion marker and version; private and retained after refund..
- **`course_diagnostic_bucket`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Course/revision/lesson/time bucket aggregates after privacy threshold; no learner key..
- **`exam_board`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Future registry; board/instrument/grade/territory/version/effective dates; never cross-board normalized..
- **`syllabus_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Future registry; board/instrument/grade/territory/version/effective dates; never cross-board normalized..
- **`exam_requirement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Versioned components and learner goal; references only, with component coverage not synthetic percentage..
- **`exam_goal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Versioned components and learner goal; references only, with component coverage not synthetic percentage..
- **`external_exam_result`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Learner, issuer/board, grade/result, date, provenance and evidence state; not platform-issued..
- **`academy_education_config`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Future-only organization policy, term/rate/room references and gate version..
- **`academy_roster_mandate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Future organization/teacher authority and term; teacher identity remains personal..
- **`academy_student_relationship`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Future organization/student relationship isolated from teacher private-book relationships..
- **`academy_credit_liability`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Future derived academy-scoped Shard 15 entitlement liability; not a cash wallet..

## Access Control

| Role | Allowed | Denied |
|---|---|---|
| Public visitor | Published catalog metadata and designated preview | Paid media, learner progress, drafts, buyer lists, exam records |
| Adult learner/buyer | Own purchases, entitlements, playback, progress, refunds and external evidence | Another learner's state, author drafts, private diagnostics inputs |
| Adult course author | Own drafts/revisions/offers; aggregate diagnostics after threshold | Named learner progress/practice, self-approval, authoring credentials, refund override |
| Course contributor | Explicit revision-scoped authoring capability | Ownership, pricing, publication or payouts without separate mandate |
| Moderator/rights reviewer | Assigned projection, evidence and scoped publication/takedown action | Course ownership, arbitrary buyer access, unrestricted media export |
| Teacher | Future authorized learner exam goals/results and explicitly shared learning evidence | Private course consumption/practice by default, normalized skill claims |
| Academy operator | Future organization-scoped roster/terms/liability after gate | Teacher identity, private clients, personal profile, unrelated practice or cross-organization data |
| Platform administrator | Named registry/settings/appeal operations with MFA/reason/audit | Universal tenant browsing, arbitrary entitlement grants, therapy-data exception |
| Service principal | One queue/transcode/payment/projection purpose | Interactive authority, wildcard storage/database access |

Blocking or restriction can hide discovery and prevent new transactions without rewriting historical purchases. Rights/safety/legal cases can suspend the smallest valid media/revision scope. No admin role may convert completion into credential evidence or waive the health-data prohibition.

### Access Escalation

- **Public visitor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Adult learner/buyer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Adult course author:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Course contributor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator/rights reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Teacher:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Academy operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Platform administrator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Course outline, editor, catalog, checkout status, player, transcript, progress, exam-component view and future academy grids are fully keyboard operable with visible focus and stable headings.
- Media requires captions/transcripts where speech conveys instruction; audio-only examples require equivalent labels/context. Player controls expose names, state, elapsed/total time, speed and captions without gesture-only operation.
- Upload/transcode/publish progress uses text status and resumable actions; errors identify the affected lesson without relying on color.
- Completion and progress avoid shame, streak pressure, confetti-only meaning, forced motion and comparative ranking.
- Exam readiness uses named components and text states rather than color or a single visual percentage.
- Timed payment/session actions warn before expiry and preserve safe input; reduced-motion and high-contrast preferences apply.
- Future academy tables provide linearized summaries, sortable headers and accessible conflict/error announcements before activation.

## Event Schemas

All events use the platform envelope: `event_id`, `event_type`, `event_version`, `occurred_at`, `actor`, `subject`, `correlation_id`, `causation_id`, `idempotency_key`, safe payload and schema hash.

| Event | Safe payload | Primary consumers |
|---|---|---|
| `education.course-revision.changed.v1` | Course/revision/state/version | Editor/catalog projector |
| `education.course-media.changed.v1` | Media/lesson/state/version | Publish gate/editor |
| `education.course.published.v1` | Course/revision/offer eligibility/version | Catalog/search/notifications |
| `education.course-offer.changed.v1` | Course/offer/state/territory/version | Catalog/checkout |
| `education.course-entitlement.changed.v1` | Entitlement/course/buyer pseudonym/state/version | Library/playback/reconciliation |
| `education.course-progress.changed.v1` | Learner pseudonym/lesson/position/completion/version | Private resume projector |
| `education.course-refund.changed.v1` | Purchase/refund/state/reason class/version | Finance/entitlement/reconciliation |
| `education.course-takedown.changed.v1` | Scope/state/reason class/version | Storage/catalog/entitlement projector |
| `education.exam-goal.changed.v1` | Goal/board/syllabus/component state/version | Authorized education projector |
| `education.exam-result.changed.v1` | Result/issuer/evidence state/version | Shard 02 approved evidence projector |
| `education.academy-operations.changed.v1` | Future organization/config/roster state/version | Future institution projectors only |

Events exclude media bytes/URLs, lesson text, buyer identity, named progress, practice logs, exam documents, payment credentials, protected moderation evidence and health data.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Upload/transcode fails repeatedly | Draft and successful assets remain; retry uses new attempt, quarantine is explicit, publication stays blocked. |
| Two contributors edit same field | Optimistic conflict with current version/diff; never silent overwrite. |
| Course changes during checkout | Purchase commits only frozen eligible offer/revision or fails before charge; no post-charge substitution. |
| Duplicate payment/webhook | One purchase and one entitlement; reconciliation is idempotent and auditable. |
| Bundle's lesson-credit grant fails | Whole application transaction rolls back and payment remains unfulfilled/refundable; no half bundle. |
| Buyer owns course already | Block before payment and open library; cannot create duplicate entitlement. |
| Course is delisted | Existing buyers retain eligible access; new sale/discovery stops. |
| Lesson removed after purchase | Prior-buyer revision remains reachable unless scoped legal/rights/safety removal requires honest unavailable state. |
| Refund races playback | Refund decision locks purchase/entitlement version; post-revocation access fails, recorded progress remains. |
| Two devices report progress | Furthest confirmed position wins; stale updates cannot move resume backward. |
| Learner abandons | Quiet resumability, no nag/shame or failure classification. |
| Author has fewer than privacy threshold learners | Diagnostics withhold sensitive buckets rather than exposing individuals. |
| Copyright complaint targets one lesson | Restrict affected media/lesson/territory first; preserve unrelated course material where lawful. |
| Board revises syllabus | Existing goal stays pinned; teacher may explicitly migrate with component mapping and audit. |
| Unsupported board or US launch | Feature is absent, not an empty/nagging setup surface. |
| Academy setting is toggled before evolution | Domain gate denies; a CMS/feature setting cannot provision schema or authority. |
| Certificate template is requested through CMS | Registry rejects unsupported content type; CMS cannot manufacture credential authority. |
| Therapy note hidden in ordinary text/upload | Purpose controls, DLP/moderation signal and reviewer workflow quarantine/reject without logging content. |
| Deletion intersects purchase/audit | Public/profile projections erase as required; financial/legal minimum and immutable audit follow retention policy; media access ends safely. |

## Dependency References

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]] for payments/media/jobs; [[specs/ia/01-identity-authority|Shard 01]] for parties/organizations/mandates; [[specs/ia/02-profiles-verification|Shard 02]] for verified credits and external evidence; [[specs/ia/03-cms-content-modeling|Shard 03]] for governed settings; [[specs/ia/06-trust-safety|Shard 06]] for moderation/rights/safeguarding; [[specs/ia/15-education-delivery|Shard 15]] for credits, practice and lesson delivery.
- **Depended on by:** later catalog, payments, rights, search and analytics shards consume only published course/entitlement/evidence events; no consumer-launch shard depends on academy operations.
- **Deep dive:** [Courses, credentials and institutions](deep-dives/16-education-credentials-institutions.md).

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| EDU-CI-01 Eligible adult author creates course | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-02 Author structures and uploads lessons | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-03 Author previews and publishes | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-04 Adult learner discovers course | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-05 Adult learner buys course | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-06 Buyer purchases course-plus-lessons | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-07 Entitled learner consumes course | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-08 Author updates or withdraws course | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-09 Buyer requests refund | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-10 Author reviews course diagnostics | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-11 Future teacher creates exam goal | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-12 Teacher records exam result | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-13 Future academy configures operations | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-14 Future teacher joins/leaves academy | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-15 User requests certificate/badge | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-CI-16 User submits therapy/clinical data | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 02:** consume [Shard 02 Contracts](02-profiles-verification.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 02 Event Schemas](02-profiles-verification.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 03:** consume [Shard 03 Contracts](03-cms-content-modeling.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 03 Event Schemas](03-cms-content-modeling.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 15:** consume [Shard 15 Contracts](15-education-delivery.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 15 Event Schemas](15-education-delivery.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Source | Sections |
|---|---|---|---|
| 2026-08-03 | Reconciled nine sources; locked governed courses, external exam evidence, deferred institutions and prohibited credential/therapy boundaries | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
