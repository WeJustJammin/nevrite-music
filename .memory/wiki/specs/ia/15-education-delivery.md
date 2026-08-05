# Shard 15 — Lessons, practice and mentorship delivery

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/15-education-delivery.md](deep-dives/15-education-delivery.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 15 owns teacher tuition facets, lesson series/credits, cancellation, safeguarded delivery, teacher discovery/trials, curriculum/assignments/practice, group teaching, mentorship and curated learning paths. It separates educational participation from credentials, credits, public reputation and automated assessment. Consumer launch is adults-only; minor registration/teaching and all guardian/chaperone flows remain fully specified but disabled until the safeguarding/minor gate is approved as a whole.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 6 |
| In-scope source documents loaded | 22 |
| Child capabilities reconciled | 17 |
| Added or removed feature boundaries | 0 |
| Consumer-launch age boundary | Known under-18 registration, lessons and professional transactions blocked; no partial minor activation |
| Future safeguarding boundary | Guardian, recording/chaperone, academy-room, feedback and group controls activate only through approved minor profile |
| Credentials boundary | Shard 02 evidence stays visually distinct; no trust score/badge |
| Split handling | Parent IA plus one approved high-complexity deep dive |

## Features

- **06.01 Lesson Booking, Packages & Delivery** — recurring series, teacher-scoped lesson credits, frozen cancellation policy and safeguarded session record.
- **06.02 Teacher Discovery, Profiles & Trials** — identity facet, separate evidence kinds, published transparent matching and bounded trials.
- **06.03 Curriculum, Assignments & Practice** — optional plan instances, timestamped feedback, non-coercive practice capture/tools and teacher-approved progress reports.
- **06.05 Group Lessons, Workshops & Masterclasses** — viability/roster/safeguarding sibling lifecycle.
- **06.06 Mentorship Programmes** — scarce fixed-term relationship without lesson credits/cancellation/curriculum inheritance.
- **06.07 Learning Paths** — self-paced curation over existing content with total cost disclosure.

### Delivery Phases

| Phase | Enabled boundary |
|---|---|
| Adult consumer launch | Adult teacher/student profiles, discovery, booking/credits, remote/in-person lessons, assignments/practice, adult groups/mentorship/paths |
| Minor activation | Entire approved age/guardian/vetting/chaperone/recording/feedback/privacy control set; no piecemeal feature flags |
| Deferred | Automated skill assessment, participation grading, trust scores, platform-wide lesson credits and guaranteed teacher feedback SLA |

## Acceptance Criteria

- **AC-EDU-01 — Publish tuition facet:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Teacher explicitly publishes self-authored fields, structured rate/availability/intake and read-only evidence blocks; contact data blocked, and (6) return Facet version publishes after rate/availability/age-range gates; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-02 — Discover teacher:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Student states instrument/level/age/mode/language/window; hard filters precede transparent weighted ranking and partitioned bookability, and (6) return Small ranked list with reasons/missing inputs; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-03 — Book trial/lesson:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Student selects occurrence/series/rate line/mode; exact policy, credit/value and safeguarding profile shown, and (6) return Booking/reservation/payment or credit hold commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-04 — Purchase lesson pack:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Purchaser buys teacher-scoped rate-line credits with pinned currency/tax/FX/revenue share/policy; auto-renew opt-in only, and (6) return Credit ledger and liability evidence commit; no teacher earning yet; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-05 — Cancel/no-show/make-up:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Actor sees exact credit consequence before action; policy at booking governs; evidence/ordering handles cancellation/no-show race, and (6) return Settlement event/credit return-burn/make-up grant commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-06 — Join lesson room:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Identity-bound participants pass current safeguarding gate; no anonymous/link/dial-in join, and (6) return Presence/session grant or actionable fail-closed denial; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-07 — Deliver/close lesson:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Server-stamped concurrent presence evaluates delivery; teacher captures session record and next assignment, but write failure does not block earned outcome, and (6) return Delivery fact and education record/outbox commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-08 — Convert trial:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) End-of-room prompt offers series; walking away needs no message/rating; one bounded 48h nudge only, and (6) return Conversion/quiet-expiry state commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-09 — Create curriculum/path:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Teacher instantiates optional versioned curriculum; learner may proceed/self-place without behind-schedule state, and (6) return Plan instance/version relation commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-10 — Assign/submit work:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Teacher defines medium/reference; student submits optional resumable take; no grade/overdue/quota display, and (6) return Assignment/take/version/outbox state commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-11 — Annotate feedback:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized teacher records time/range comments under declared stance; async channel uses lesson-level safeguarding, and (6) return Feedback version/access-retention state commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-12 — Practice:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Student uses optional timer/click/tuner/drone/recording; logging is byproduct, offline/manual backfill allowed, streak optional, and (6) return Private practice event/log version commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-13 — Issue progress report:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Teacher reviews coverage evidence and explicitly approves optional report; platform never measures musicianship, and (6) return Approved report version and audience commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-14 — Run group class:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Organizer publishes roster composition/viability/refund/safeguarding; class proceeds only at threshold, and (6) return Cohort/occurrences/refund or delivery state commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-15 — Run mentorship:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Mentor/mentee enter fixed-term scarce-capacity programme with goals/check-ins/end; no lesson-credit/cancellation/curriculum semantics, and (6) return Mentorship agreement/state/check-ins commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-EDU-16 — Follow learning path:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Learner self-places and consumes existing units with upfront total cost/requirements, and (6) return Path enrollment/progress references commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| EDU-01 | Publish tuition facet | Teacher explicitly publishes self-authored fields, structured rate/availability/intake and read-only evidence blocks; contact data blocked. | Facet version publishes after rate/availability/age-range gates. |
| EDU-02 | Discover teacher | Student states instrument/level/age/mode/language/window; hard filters precede transparent weighted ranking and partitioned bookability. | Small ranked list with reasons/missing inputs. |
| EDU-03 | Book trial/lesson | Student selects occurrence/series/rate line/mode; exact policy, credit/value and safeguarding profile shown. | Booking/reservation/payment or credit hold commits. |
| EDU-04 | Purchase lesson pack | Purchaser buys teacher-scoped rate-line credits with pinned currency/tax/FX/revenue share/policy; auto-renew opt-in only. | Credit ledger and liability evidence commit; no teacher earning yet. |
| EDU-05 | Cancel/no-show/make-up | Actor sees exact credit consequence before action; policy at booking governs; evidence/ordering handles cancellation/no-show race. | Settlement event/credit return-burn/make-up grant commits. |
| EDU-06 | Join lesson room | Identity-bound participants pass current safeguarding gate; no anonymous/link/dial-in join. | Presence/session grant or actionable fail-closed denial. |
| EDU-07 | Deliver/close lesson | Server-stamped concurrent presence evaluates delivery; teacher captures session record and next assignment, but write failure does not block earned outcome. | Delivery fact and education record/outbox commit. |
| EDU-08 | Convert trial | End-of-room prompt offers series; walking away needs no message/rating; one bounded 48h nudge only. | Conversion/quiet-expiry state commits. |
| EDU-09 | Create curriculum/path | Teacher instantiates optional versioned curriculum; learner may proceed/self-place without behind-schedule state. | Plan instance/version relation commits. |
| EDU-10 | Assign/submit work | Teacher defines medium/reference; student submits optional resumable take; no grade/overdue/quota display. | Assignment/take/version/outbox state commits. |
| EDU-11 | Annotate feedback | Authorized teacher records time/range comments under declared stance; async channel uses lesson-level safeguarding. | Feedback version/access-retention state commits. |
| EDU-12 | Practice | Student uses optional timer/click/tuner/drone/recording; logging is byproduct, offline/manual backfill allowed, streak optional. | Private practice event/log version commits. |
| EDU-13 | Issue progress report | Teacher reviews coverage evidence and explicitly approves optional report; platform never measures musicianship. | Approved report version and audience commit. |
| EDU-14 | Run group class | Organizer publishes roster composition/viability/refund/safeguarding; class proceeds only at threshold. | Cohort/occurrences/refund or delivery state commits. |
| EDU-15 | Run mentorship | Mentor/mentee enter fixed-term scarce-capacity programme with goals/check-ins/end; no lesson-credit/cancellation/curriculum semantics. | Mentorship agreement/state/check-ins commit. |
| EDU-16 | Follow learning path | Learner self-places and consumes existing units with upfront total cost/requirements. | Path enrollment/progress references commit. |

### Global Interaction Rules

- Commands carry `actor_person_id`, `acting_party_id?`, `acting_context_version`, `idempotency_key`, `expected_version?`, `request_id` and teacher-student relationship version.
- Consumer launch rejects known under-18 participants before booking/profile publication; minor-specific records cannot be enabled independently.
- Lesson credits are teacher/academy + rate-line scoped units, not money or platform currency. Undelivered value remains with platform provider ledger.
- Lesson attendance/delivery, session record, practice, assignment, feedback, credential and public reputation are separate facts.
- Blocks/restrictions and safeguarding predicates override discovery, booking, room, assignment, feedback, group and mentorship access without leaking reasons.
- Education data never creates Shard 07 professional credit, automated skill rating or public participation score.

## Contracts

### Core Types and Errors

| Contract | Definition |
|---|---|
| `LessonMode` | `remote | in_person` |
| `CreditEventKind` | `purchase | reserve | return | burn | earn | residual | make_up_grant | refund` |
| `LessonState` | `booked | cancelled | room_open | delivered | partial | no_show | no_fault | closed` |
| `FeedbackStance` | `included | in_lesson_only | capped_weekly` |
| `SafeguardingProfile` | `adult | future_minor_remote | future_minor_in_person | future_minor_group` |
| `StandardError` | `VALIDATION_FAILED, FORBIDDEN, ACTING_CONTEXT_STALE, VERSION_CONFLICT, IDEMPOTENCY_MISMATCH, AGE_GATE_DISABLED, SAFEGUARDING_FAILED, CREDIT_UNAVAILABLE, POLICY_CONFLICT, ROOM_IDENTITY_REQUIRED, DELIVERY_EVIDENCE_INSUFFICIENT, FEEDBACK_NOT_INCLUDED, UPLOAD_FAILED` |

### Booking, Credits and Delivery

| Contract | Invariant |
|---|---|
| `PublishTeacherFacet` | Identity facet only; rate card/availability required; evidence fields read-only; age range retracts on vetting expiry. |
| `PurchaseLessonCredits` | Pins teacher/academy, rate line, policy, currency/tax/FX/share. Credit equals lesson entitlement, not money. |
| `ResolveResidual` | Expiry removes rate lock only; paid residual value remains redeemable with teacher at current price. |
| `SettleCancellation` | Booking-pinned policy, evidence and event order decide return/burn/make-up/no-fault. Write failure leaves lesson booked. |
| `EvaluateDelivery` | Concurrent server presence ≥50% scheduled duration is delivery predicate; partial classification separate. |
| `OpenLessonRoom` | Identity-bound only; current safeguarding and participant list checked server-side. Adult launch profile cannot admit minor. |

### Discovery, Learning and Feedback

| Contract | Invariant |
|---|---|
| `SearchTeachers` | Hard filters level/age/instrument/mode/language/bookability; student window ranks/partitions. Evidence capped and never trust score. |
| `CreateTrial` | One per teacher-student pair; full protections; no explicit rating/outcome, conversion inferred. |
| `AssignPractice` | Optional curriculum, medium/reference and no overdue/grade pressure. |
| `SubmitTake` | Resumable, immutable versions, 10m in-room/20m external caps, no auto-assessment/forwarding. |
| `RecordFeedback` | Timestamp anchor, safeguarding/access/stance/cap; guardian rules depend future profile; no platform SLA. |
| `RecordPractice` | Student-private, offline/manual, non-evidentiary diagnostic only; no identifiable guardian/operator access. |
| `ApproveProgressReport` | Teacher approval mandatory; measures coverage facts only and remains optional. |

### Group, Mentorship and Paths

| Contract | Invariant |
|---|---|
| `ActivateGroupClass` | Viability threshold, roster composition and safeguarding profile frozen; below threshold refunds all. |
| `CreateMentorship` | Fixed term/end, mentor capacity 1–3 expected, goals/check-ins; no lesson-credit/cancellation inheritance. |
| `EnrollLearningPath` | Curation refs existing units; self-placement free; total cost disclosed before enrollment. |

## Data Models

| Model | Key relationships and constraints |
|---|---|
| `tuition_facet` | Person/party, authored fields, rate/availability/intake, age range, publication/state/version. |
| `tuition_evidence_projection` | Credential/credit/vouch source/version/type/label/suppression; derived read-only. |
| `rate_card_line` | Teacher/academy, instrument, duration, mode, level, price/currency/tax, policy, effective interval/version. |
| `lesson_series` / `lesson_occurrence` | Rule/participants/rate line/mode/location, materialized times, state/version. |
| `lesson_credit_account` / `lesson_credit_event` | Purchaser/student/teacher/rate line, units/residual value and append-only events. |
| `cancellation_policy_version` | Preset/teacher/academy floor, windows/consequences/make-up rule, effective version. |
| `lesson_room` / `lesson_presence` | Occurrence, safeguarding profile, participants/observer roles, server joins/leaves/concurrency. |
| `lesson_session_record` | Occurrence, teacher/student, covered facts, notes, next assignment, state/version. |
| `teacher_match_projection` | Teacher, hard-filter fields, behavioural inputs, evidence cap, availability partitions/version. |
| `trial_relationship` | Teacher/student, occurrence, state, conversion/nudge timestamps; unique pair. |
| `curriculum_template` / `curriculum_instance` | Author/version and student-specific unit ordering/state; template edits non-retroactive. |
| `assignment` / `submission_take` | Relationship/unit, medium/reference/due-neutral state and immutable media versions. |
| `feedback_annotation` | Take, author, time/range, body/history, stance/cap/access-retention version. |
| `practice_event` / `practice_log` | Student, assignment/tool/source, duration/local/server times, private state. |
| `progress_report` | Student/teacher, coverage facts, approval, audience, version. |
| `group_class` / `cohort_enrollment` | Organizer, composition/threshold, safeguards, schedule, payment/refund/state. |
| `mentorship` / `mentorship_checkin` | Parties, term/goals/capacity, state and private check-ins. |
| `learning_path` / `path_enrollment` | Curated unit refs/cost version and learner progress refs. |
| `education_audit_event` | Immutable actor/context/action/target/before-after/evidence/request hashes. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`tuition_facet`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Person/party, authored fields, rate/availability/intake, age range, publication/state/version..
- **`tuition_evidence_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Credential/credit/vouch source/version/type/label/suppression; derived read-only..
- **`rate_card_line`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Teacher/academy, instrument, duration, mode, level, price/currency/tax, policy, effective interval/version..
- **`lesson_series`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Rule/participants/rate line/mode/location, materialized times, state/version..
- **`lesson_occurrence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Rule/participants/rate line/mode/location, materialized times, state/version..
- **`lesson_credit_account`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Purchaser/student/teacher/rate line, units/residual value and append-only events..
- **`lesson_credit_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Purchaser/student/teacher/rate line, units/residual value and append-only events..
- **`cancellation_policy_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Preset/teacher/academy floor, windows/consequences/make-up rule, effective version..
- **`lesson_room`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Occurrence, safeguarding profile, participants/observer roles, server joins/leaves/concurrency..
- **`lesson_presence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Occurrence, safeguarding profile, participants/observer roles, server joins/leaves/concurrency..
- **`lesson_session_record`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Occurrence, teacher/student, covered facts, notes, next assignment, state/version..
- **`teacher_match_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Teacher, hard-filter fields, behavioural inputs, evidence cap, availability partitions/version..
- **`trial_relationship`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Teacher/student, occurrence, state, conversion/nudge timestamps; unique pair..
- **`curriculum_template`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Author/version and student-specific unit ordering/state; template edits non-retroactive..
- **`curriculum_instance`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Author/version and student-specific unit ordering/state; template edits non-retroactive..
- **`assignment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Relationship/unit, medium/reference/due-neutral state and immutable media versions..
- **`submission_take`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Relationship/unit, medium/reference/due-neutral state and immutable media versions..
- **`feedback_annotation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Take, author, time/range, body/history, stance/cap/access-retention version..
- **`practice_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Student, assignment/tool/source, duration/local/server times, private state..
- **`practice_log`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Student, assignment/tool/source, duration/local/server times, private state..
- **`progress_report`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Student/teacher, coverage facts, approval, audience, version..
- **`group_class`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Organizer, composition/threshold, safeguards, schedule, payment/refund/state..
- **`cohort_enrollment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Organizer, composition/threshold, safeguards, schedule, payment/refund/state..
- **`mentorship`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Parties, term/goals/capacity, state and private check-ins..
- **`mentorship_checkin`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Parties, term/goals/capacity, state and private check-ins..
- **`learning_path`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Curated unit refs/cost version and learner progress refs..
- **`path_enrollment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Curated unit refs/cost version and learner progress refs..
- **`education_audit_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable actor/context/action/target/before-after/evidence/request hashes..

## Access Control

| Actor | Permitted | Explicitly denied |
|---|---|---|
| Adult student | Own booking/credits/lesson/assignments/practice/reports | Teacher/private peers' data, public grading or minor-only flows |
| Purchaser | Purchase/refund/residual/billing/entitlement facts | Student practice diary and unrelated lesson feedback |
| Teacher | Own facet/rate/availability, assigned students' delivery/learning records | Author credentials/vetting, infer skill score or retain takes beyond access window |
| Guardian (future gate) | Minor booking/observer/feedback/billing under approved profile | Practice diary, hidden teacher/student records or authority beyond minor mandate |
| Academy | Curate roster/vouch/policies/floors/group operations | Unpublish teacher facet, rewrite evidence or impose harsher-than-floor mandate |
| Operator/observer | Consented occurrence-specific observer or aggregate room operation | Named practice logs, lesson content by default or standing access |
| Moderator/safeguarding reviewer | Assigned case/protected evidence projection | General lesson/practice browsing or teaching evaluation |
| System worker | Idempotent materialization, credit events, timers, matching, upload retry and notifications | Auto-mark presence, grade music, infer trust or partially enable minors |

### Access Escalation

- **Adult student:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Purchaser:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Teacher:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Guardian (future gate):** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Academy:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Operator/observer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator/safeguarding reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Teacher discovery exposes every hard filter/partition/rank reason and provides adjustable small-list results without rank numbers.
- Booking/cancellation shows exact credit/value consequences, policy version and actor before confirmation.
- Lesson rooms provide captions/text alternatives, keyboard media controls, music-fidelity settings and explicit participant/observer roster.
- Assignment/feedback supports linear timestamp list, keyboard seeking and phone-first one-handed controls.
- Practice tools are optional and degrade to assignment/timer/record; streaks never shame or block.
- Progress/group/mentorship/path surfaces use semantic timelines and explicit no-grade/no-behind labels where relevant.

## Event Schemas

| Event | Payload minimum | Consumers |
|---|---|---|
| `education.teacher-facet.changed.v1` | Teacher/state/rate/availability/age-range versions | Search/discovery |
| `education.lesson-booking.changed.v1` | Occurrence/series/parties/state/policy/rate version | Room/credits/notifications |
| `education.credit-event.recorded.v1` | Account/event kind/units/residual/cause/version | Purchaser/student/teacher ledgers |
| `education.lesson-delivery.recorded.v1` | Occurrence/presence predicate/state/session-record status | Cancellation/earnings/private quality |
| `education.assignment.changed.v1` | Assignment/relationship/medium/state/version | Student/teacher projectors |
| `education.feedback.changed.v1` | Annotation/take/relationship/state/access expiry/version | Authorized participants |
| `education.practice.changed.v1` | Student/log/source/duration/state/version | Student-private projector only |
| `education.group-class.changed.v1` | Class/threshold/enrollment/state/refund version | Participants/finance adapter |
| `education.mentorship.changed.v1` | Mentorship/parties/state/term/version | Parties/tasks |

Events exclude lesson notes, recording bytes, practice details, credential documents, guardian/private participant data, payment credentials and unrestricted PII.

## Edge Cases

| Case | Required result |
|---|---|
| Known minor attempts signup/booking | `AGE_GATE_DISABLED` at launch; no partial account/lesson path. |
| Teacher credential/vetting expires | Evidence/under-18 range retracts; adult facet remains where eligible. |
| Pack expires unused | Convert to residual value, never destroy paid value or earn teacher payment. |
| Cancellation/no-show race | Cancellation received before no-show commit wins as late cancel. |
| No in-person evidence after seven days | Return credit; no auto-burn. |
| Session-record write fails | Delivery/credit settlement continues; private teacher quality task opens. |
| Lesson recording/chaperone fails in future minor remote | End lesson unless declared guardian observer within 60s; fail closed. |
| Upload fails repeatedly | Preserve locally, retry 2s/8s/32s then persistent outbox next open. |
| Student resubmits | New immutable take; earlier take/annotations remain. |
| Teacher access retention ends | Revoke after 90 days from last delivered lesson; student keeps own material. |
| Group misses viability | Cancel/refund all; never silently run materially different cohort. |
| Mentorship ends | Deliberate closed state/history; no auto-renew/default indefinite relationship. |
| Search evidence missing | Degrade/result reasons, never zero-trust exclusion. |

## Surface Applicability

Responsive web/PWA only. Remote room/media functions use shared accessible web realtime/streaming. In-person workflows use record-based location/attendance and never device tracking.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| EDU-01 Publish tuition facet | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-02 Discover teacher | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-03 Book trial/lesson | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-04 Purchase lesson pack | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-05 Cancel/no-show/make-up | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-06 Join lesson room | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-07 Deliver/close lesson | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-08 Convert trial | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-09 Create curriculum/path | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-10 Assign/submit work | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-11 Annotate feedback | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-12 Practice | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-13 Issue progress report | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-14 Run group class | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-15 Run mentorship | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| EDU-16 Follow learning path | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [Shard 00](00-infrastructure.md) for payments/realtime/uploads/notifications; [Shard 01](01-identity-authority.md) for parties/guardian/academy/authority; [Shard 02](02-profiles-verification.md) for credentials/vetting; [Shard 06](06-trust-safety.md) for safeguarding/restrictions.
- **Depended on by:** Shard 16 consumes education delivery/completion evidence for credentials/institutions; it cannot infer learning outcomes or access practice/private lesson content.

## Deep Dives Needed

- [Lessons, practice and mentorship delivery deep dive](deep-dives/15-education-delivery.md)

### Cross-Shard Section Contract Map

- **Shard 16 — Education credentials and institutions:** consume [Shard 16 — Education credentials and institutions Contracts](16-education-credentials-institutions.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 16 — Education credentials and institutions Event Schemas](16-education-credentials-institutions.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-03 | Reconciled 22 sources; locked adult-launch lessons, credits, delivery, learning and future safeguarding contracts | /write-architecture-spec | All |

## Dependency References

### Constrains

- [[specs/ia/16-education-credentials-institutions|Shard 16 — Education credentials and institutions]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
