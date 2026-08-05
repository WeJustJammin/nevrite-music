# Deep Dive 15 — Lessons, practice and mentorship delivery

> **Parent IA Shard**: [../15-education-delivery.md](../15-education-delivery.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns lesson-series materialization, entitlement/value ledgers, cancellation/delivery evidence, safeguarded rooms, discovery matching, learning artifacts, practice privacy and group/mentorship/path lifecycle. Minor flows are design-complete but launch-disabled as one indivisible gate.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Facets, rates, series, credits, bookings, policies, rooms, presence, assignments, takes, feedback, practice, groups and mentorship share pinned versions/authority. |
| What-if expansion | Minor attempt, vetting expiry, pack lapse, cancellation/no-show race, missing evidence, record failure, recording loss, upload retry, retention expiry and viability failure converge. |
| Adversarial pass | Credit-as-money, expiry confiscation, auto-burn, anonymous room, attendance-to-credit, public practice metrics, guardian diary access, automated grading and partial minor activation fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field or unresolved implementation choice. |

## Canonical Field Contracts

| Model | Fields and constraints |
|---|---|
| `tuition_facet` | `teacher_person/party, authored_fields, intake, age_range, publication, rate_card_version, availability_rule_version, evidence_projection_version, state, version`. |
| `rate_card_line` | `teacher/academy, instrument_version, duration, mode, level_range, price, currency, tax, policy_version, effective interval`. |
| `lesson_series` | `id, teacher/student/purchaser, rate_line, recurrence_rule, timezone, mode, safeguarding_profile, state, version`. |
| `lesson_occurrence` | `series_id, starts/ends, materialization_source, rate/policy versions, location/room, state, version`. |
| `lesson_credit_event` | `account, event_kind, lesson_unit_delta, residual_amount/currency?, occurrence?, cause, actor, created_at, idempotency`; append-only. |
| `lesson_presence` | `occurrence, participant_person, role, joined/left server times, concurrent_ms, observer/consent state`. |
| `assignment` | `relationship, curriculum_unit?, medium, reference?, instructions, state, created_by, version`. |
| `submission_take` | `assignment, student, blob/hash, duration, source, created_at, supersedes_id?, state`. |
| `feedback_annotation` | `take, teacher, start/end, body/history, stance_version, access_expires_at, state`. |
| `practice_event` | `student, assignment?, tool/source, duration, local/server time, manually_backfilled, state`. |
| `group_class` | `teacher/organizer, roster composition, viability threshold, schedule, rate/refund, safeguarding_profile, state, version`. |
| `mentorship` | `mentor/mentee, term, goals, cadence, capacity_snapshot, starts/ends, state, version`. |

## State Machines

- Series: `draft -> active -> suspended -> active | ended | cancelled`; occurrences materialize from rule.
- Occurrence: `booked -> room_open -> delivered | partial | no_show | cancelled | no_fault -> closed`.
- Credit entitlement remains append-only event balance; reserve/return/burn/earn are separate.
- Assignment: `active -> submitted -> feedback_available | discussed | closed`; no overdue/failed/grade.
- Group: `draft -> enrolling -> viable -> active -> completed` or `under_threshold -> cancelled_refunded`.
- Mentorship: `proposed -> active -> ending -> completed | cancelled`; fixed end is default.

## Lesson Credit and Policy Algorithm

1. Purchase pins teacher/academy, rate line, policy, currency/tax, FX, revenue share and purchaser/student split.
2. Create entitlement units and residual basis; teacher earns nothing at purchase.
3. Booking reserves one matching unit. Credits cannot move across rate lines/teachers except explicit departure remedy.
4. Expiry removes old rate lock and converts unused unit to residual purchase value; never destroys value or pays teacher.
5. Cancellation evaluates booking-pinned policy and event order. Teacher override may only improve student result.
6. No-show starts provisional and cannot commit before scheduled end; ≥5 minutes joint presence vacates.
7. Cancellation before no-show commit wins as late cancel. Persistence failure leaves booking intact.
8. No in-person delivery assertion after seven days returns credit.
9. Burn/delivery earns teacher as separate event. Make-up has independent validity and returns credit if never redeemable.

## Safeguarding and Delivery Algorithm

1. Launch admission requires adult profile. Any known minor returns `AGE_GATE_DISABLED` before booking/room access.
2. Future minor profile activates only after guardian authority, vetting, mode-specific chaperone/recording, feedback/privacy and incident controls all pass.
3. Room join requires authenticated identity and occurrence role; no bearer link/dial-in/anonymous participant.
4. Record server join/leave and concurrent presence. Never infer attendance before human joins.
5. Delivery predicate is joint server presence ≥50% scheduled duration; partial state remains separate for policy.
6. Session-record failure does not affect delivery/earning; open private teacher quality task.
7. Future remote minor 1:1 requires approved recording/chaperone. Recording loss ends lesson unless declared guardian observer joins within 60s.
8. Future in-person minor 1:1 requires declared adult present or approved academy room.
9. Cancellation unavailable after joint presence begins; lesson close emits delivery fact to credit-policy worker.

## Discovery and Trial Algorithm

1. Filter pool by instrument/level±1/age/mode/language/bookability and safeguarding eligibility.
2. Partition bookable matching window, bookable different hours, fully booked. Intake status is partition, not score.
3. Rank within partition by published education weights: weekly-window fit, mode/geography, behavioural evidence and capped credential/credit evidence.
4. Evidence maximum 8/100 and never exceeds lowest behavioural signal. No endorsements/trust score.
5. Return reasons and missing/degraded inputs; no rank integer/comparative position.
6. Empty results widen progressively and explicitly.
7. Trial unique teacher-student pair with full protections. End-of-room conversion prompt; one 48h nudge then silent at seven days.

## Assignment, Feedback and Practice Algorithm

1. Curriculum instance optional and version-pinned; template edits never mutate live path.
2. Assignment names medium and optional reference; no grade, overdue or completion pressure.
3. Submission records immutable take. In-room auto-stops at ten minutes; external over twenty minutes rejected before transfer.
4. Upload retries 2s/8s/32s then durable local/outbox next open, never expires.
5. Async feedback requires current relationship, safeguarding profile and teacher stance/cap. No platform SLA.
6. Annotations time-anchor always; bar/beat only from actual declared click/tempo. Resubmission keeps old takes/comments.
7. Teacher access expires ninety days after last delivered lesson; student keeps own data.
8. Practice event arises from tool use or easy manual backfill. It remains student-private, non-evidentiary and absent from public/guardian/operator named views.
9. Progress report derives coverage facts and requires teacher approval; never measures musicianship.

## Group, Mentorship and Path Algorithm

- Group class freezes instrument/level composition, minimum viable enrollment, schedule, refund and safeguards. Below threshold cancels/refunds everyone.
- Group safeguarding is a distinct approved profile, never relaxed 1:1 controls.
- Mentorship has explicit goals/term/end and scarce mentor capacity. No credit pack/cancellation policy/curriculum inheritance.
- Learning path references existing units, permits free self-placement and discloses total cost before enrollment.

## Abuse and Recovery Verification

| Threat/failure | Required control |
|---|---|
| Platform confiscates expired lessons | Residual-value event and purchaser notice; no teacher earning. |
| Teacher marks false no-show | Provisional until end, server presence evidence, contest route and platform-attributed policy. |
| Anonymous enters lesson room | Identity/occurrence-role predicate; no bearer route. |
| Attendance mints professional credit | No Shard 07 credit command from education delivery. |
| Minor path partly enabled | One compound gate/policy profile; launch adult predicate rejects all known minors. |
| Guardian monitors practice diary | RLS denies diary; guardian projection includes billing/feedback only in future profile. |
| Teacher grades performance algorithmically | No assessment/grade schema or consumer; visualizations non-judgmental. |
| Practice streak shames learner | Optional/forgiving/local design and no public/teacher evidence meaning. |
| Failed upload loses take | Local preservation, bounded retry and durable outbox. |
| Teacher keeps media forever | Access expiry worker at 90 days; student ownership preserved. |
| Group runs under viable composition | Transactional threshold check and all-participant refund. |
| Credential absence becomes distrust | Distinct evidence blocks and no composite score/badge. |

## Cross-Shard Contracts

| Counterparty | Contract |
|---|---|
| Shard 00 | Payments/realtime/media, requests/errors, outbox, timers and protected audit. |
| Shard 01 | Adult/guardian/academy authority, parties, blocks and acting context. |
| Shard 02 | Credentials/vetting/credit evidence projections and expiry; no teacher-authored evidence. |
| Shard 06 | Safeguarding profiles, incidents, restrictions and protected evidence. |
| Shard 16 | Receives course/completion/assessment evidence only where explicitly approved; no practice/private lesson access. |

Shard 16 names Shard 15 reciprocally. Consumers use typed completion evidence and cannot infer competence, grade or qualification from attendance alone.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [15-education-delivery § Contracts](../15-education-delivery.md#contracts) defines commands/queries and [15-education-delivery § Event Schemas](../15-education-delivery.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-03 | Locked lesson entitlement, safeguarding, delivery, discovery, learning and privacy algorithms | /write-architecture-spec-deepen | All |

## Dependency References

- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
