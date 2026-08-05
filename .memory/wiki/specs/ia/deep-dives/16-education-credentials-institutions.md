# Deep Dive 16 — Courses, credentials, institutions and special practice

**Status:** Complete
**Parent:** [Shard 16](../16-education-credentials-institutions.md)

## Scope

This deep dive owns course revision integrity, publication governance, entitlement/refund semantics, consumption privacy, third-party exam evidence, the post-consumer academy gate and hard exclusion of platform credentials and clinical data.

## Deepening Record

| Pass | Converged result |
|---|---|
| Cross-section consistency | Course content, offers, purchases, entitlements, progress, exam evidence and institution authority use distinct immutable versions. |
| What-if expansion | Delisting, removed lessons, refund/playback races, multiple devices, syllabus revisions, academy exits and hidden clinical uploads have terminal behavior. |
| Adversarial pass | Thin-course promises, stolen media, fake credits, duplicate grants, completion badges, named learner analytics, institution lock-in and PHI smuggling fail closed. |
| Convergence | No additional entity, role or lifecycle is required; certificates and therapy remain explicit non-features. |

## Canonical Field Contracts

| Record | Required fields |
|---|---|
| `course_revision` | `course_id, revision, title, instrument, level, audience, declared_outline, rights_summary, moderation_state, authoring_policy_version, state`. |
| `course_lesson` | `revision_id, lesson_id, section_id, order, title, duration, preview, media_refs, practice_task_ref?`. |
| `course_offer` | `course_id, revision_floor, amount, currency, territory, tax_class, refund_policy_version, valid_from/to, state`. |
| `course_purchase` | `buyer, offer_snapshot, payment_ref, tax_snapshot, idempotency_key, state, created_at`. |
| `course_entitlement` | `buyer, course, purchase, grant_reason, state, granted_at, revoked_at?, revocation_reason?`. |
| `course_progress` | `learner, entitlement, lesson, furthest_ms, completed_at?, client_version, row_version`. |
| `exam_goal` | `learner, board, instrument, grade, syllabus_version, session?, deadline?, component_states, authority`. |
| `external_exam_result` | `learner, issuer, board, result, date, provenance, evidence_state, visibility_consent`. |
| `academy_roster_mandate` | Future-only `organization, teacher, capabilities, effective_from/to, evidence, state`. |

Identifiers are opaque. Money uses integer minor units and ISO currency. Times are UTC instants plus named local-zone context for deadlines. Published revisions and purchase snapshots are immutable.

## State Machines

| Aggregate | Valid transitions |
|---|---|
| Course | `draft → review_pending → published → delisted`; any active state may enter `restricted`; scoped adjudication may restore or remove. |
| Media | `reserved → uploading → scanning → transcoding → playable`; any processing state may become `failed`/`quarantined`; playable may become `removed`. |
| Offer | `draft → active → paused → retired`; active offer mutation creates a new version. |
| Purchase | `created → payment_pending → paid → refund_pending → refunded`; ambiguous payment remains pending until reconciliation. |
| Entitlement | `pending_payment → active → refund_pending → revoked`; dispute may suspend but never fabricate another grant. |
| Exam evidence | `self_reported → issuer_verified`; either may become `superseded`, `expired` or `revoked` with provenance. |
| Institution gate | `disabled → design_only → enabled` only through approved post-consumer evolution; ordinary configuration cannot transition it. |

## Course Publication Algorithm

1. Resolve authenticated user, adult status, acting party, author admission and explicit course-owner mandate.
2. Load expected draft version; reject stale same-field writes and preserve uploaded assets.
3. Freeze a candidate revision and declared outline. Every advertised section/lesson must exist; all required media must be playable.
4. Require title, instrument, level, audience, one preview, at least one paid lesson, one-off offer, tax class and refund-policy version.
5. Evaluate contributor identity/mandates, media rights, repertoire references, prohibited content, moderation restrictions and territory eligibility.
6. Render author credits from Shard 02 as read-only evidence. Authors cannot select, reorder, edit or convert evidence into a claim.
7. Commit immutable revision, publication state, audit and outbox atomically. Catalog/search consume the published projection only.
8. Paid content cannot promise undisclosed future lessons. A later revision may add content free; it cannot retroactively change frozen purchase terms.

Authoring intake may be curated, invite-based or broader through a governed setting. That setting changes eligibility, not the hard publication predicate. External embeds do not satisfy media availability or rights gates. Academy-owned publication remains disabled until the institution gate and explicit ownership/licence mandate exist.

## Entitlement, Bundle and Refund Algorithm

1. Checkout freezes buyer, course, eligible revision, offer, amount/currency, territory, tax and refund policy.
2. Hosted payment creates no entitlement until server reconciliation confirms the intended amount/currency/account and idempotency key.
3. A course-only purchase creates one unique product-scoped entitlement. It is non-transferable, non-spendable and not cash.
4. A bundle application transaction creates that entitlement plus a Shard 15 teacher/academy-scoped credit event. Both grants and outbox rows commit together.
5. Duplicate checkout, webhook or replay returns the original terminal result; owning buyers cannot purchase the same course twice.
6. Change-of-mind is eligible within 14 calendar days only while material consumed duration is below 20% of published course duration.
7. Verified delivery defect, material misrepresentation or mandatory law can override time/consumption. Author analytics never decide eligibility.
8. Approved refund revokes playback entitlement and initiates payment reconciliation. Progress and private practice provenance remain under the learner identity.
9. Delisting stops new sales but preserves buyer access. Rights/safety/legal takedown removes only the smallest lawful scope and overrides legacy access.

If payment succeeds but the application transaction fails, the purchase remains unfulfilled and enters automated reconciliation/refund; the UI never claims nothing was charged until provider state is known.

## Consumption and Privacy Algorithm

1. Resolve active entitlement and an eligible revision-access row before issuing short-lived media access.
2. Save progress per lesson using furthest confirmed playback position; stale concurrent updates cannot regress it.
3. Explicit restart changes presentation state but preserves the canonical furthest position for consumption/refund evidence.
4. Course practice opens Shard 15 with `course/revision/lesson/task` provenance. Practice media/logs remain private and never enter course diagnostics.
5. Completion marks all lessons consumed but produces no score, badge, certificate, public signal, notification pressure or inferred ability.
6. Author diagnostics aggregate starts, lesson transitions, completion and returns into delayed buckets only after the configured privacy floor.
7. Named buyer/progress exports, cross-course learner ranking and private-practice joins are forbidden.
8. Launch streams governed media. Offline byte download/DRM is deferred; network failure preserves confirmed progress and offers honest retry.

## Exam Board and Evidence Algorithm

1. At US launch the board registry is disabled and the surface is absent.
2. Future activation admits named boards/territories through reviewed registry entries and sourced versioned syllabi.
3. A goal pins board, instrument, grade and syllabus version. Boards and grades are never mapped to a common level.
4. Requirements are named components; coverage is per component, not a synthetic readiness percentage.
5. Repertoire is referenced to lawful external editions. The platform does not host board material or commercial recordings without verified rights.
6. Existing goals stay pinned across revisions. Teacher-initiated migration previews a component mapping and records explicit consent/audit.
7. Entry occurs with the board unless a separately reviewed integration exists; deadline tracking never claims an entry succeeded.
8. Results record issuer/provenance as self-reported or verified. Shard 02 controls consented profile display and revocation.

## Institution Evolution Gate

1. Consumer readiness and explicit `/evolve-feature` approval are prerequisites; no launch route, migration, setting or entitlement depends on academy operations.
2. Future organization authority comes from Shard 01 mandate, never domain name, email domain, login provider or admin role.
3. The academy owns its student relationship and academy-scoped credit liability. The teacher owns personal identity, profile, credentials and private book.
4. Academy views cannot access teacher private students, learner practice diaries or unrelated course consumption.
5. House rates, revenue share and course ownership are versioned signed terms. A setting cannot settle an employment/ownership dispute.
6. Teacher departure ends roster authority but does not delete identity or academy student/credit continuity.
7. Closure freezes new sales/credits, computes outstanding liability and routes to counsel-approved insolvency/refund handling; the platform does not promise escrow.
8. Rooms are Shard 00/venue references consumed by occurrences, not duplicate academy inventory.

## Prohibited Credential and Clinical Paths

| Attempt | Enforcement |
|---|---|
| Issue completion certificate/badge | No issuance aggregate, route, template or event exists; return typed unsupported response. |
| Place completion beside verified credits | Projection schemas cannot join completion into Shard 02 credential blocks. |
| Create teacher trust badge from activity | No score/headline count; only source-specific evidence under Shard 02 policy. |
| Use CMS certificate template | Approved block/content-type registry excludes credential authority. |
| Submit therapy client/case/note/goal/outcome | Strict request schema rejects; free-text/upload classifiers quarantine likely clinical purpose for limited review. |
| Bill insurer or health system | No payer, diagnosis, claim or clinical billing contracts/providers exist. |
| Label clinical data as ordinary lesson notes | Purpose limitation and moderation escalation reject; content is not copied into logs/analytics. |

Ordinary non-clinical teaching in a care/community setting remains a Shard 15 lesson or group class. No diagnosis, treatment claim, health outcome or clinical record may be attached.

## Abuse and Recovery Verification

| Failure or abuse | Required proof |
|---|---|
| Stolen course/media | Contributor/rights attestations, object checksum, provenance, complaint scope and adjudication audit. |
| Thin or misleading paid course | Complete declared edition gate, preview and immutable purchase-time outline. |
| Fake author expertise | Read-only Shard 02 evidence; no author-edited claim or absence penalty. |
| Duplicate/half bundle | Unique idempotency and atomic entitlement/credit transaction tests. |
| Refund-after-consumption gaming | Frozen policy and server-side authorized consumption evidence with override review path. |
| Named learner surveillance | Projection/RLS tests prove only thresholded diagnostic buckets reach authors. |
| Syllabus silently changes | Version pin and explicit migration audit tests. |
| Academy captures teacher identity | Mandate-scope and departure tests preserve personal profile and private relationships. |
| Hidden PHI enters upload | Schema/DLP quarantine, restricted reviewer projection, no analytics/log body and verified deletion path. |
| Takedown over-removes course | Scope tests prove unaffected revisions/lessons remain when legally permitted. |

## Cross-Shard Contracts

| Shard | Contract |
|---|---|
| Shard 00 | Hosted payment reconciliation, private media, transcode jobs, settings, audit/outbox and notifications. |
| Shard 01 | Adult/party/organization identity, acting context and future institution mandates. |
| Shard 02 | Read-only verified-credit projection and consented third-party exam evidence display. |
| Shard 03 | Governed admission, policy, threshold and feature-registry settings without invariant override. |
| Shard 06 | Rights/safety moderation, restrictions, appeals and protected evidence. |
| Shard 15 | Lesson credits, course-origin practice and education-delivery boundaries. |

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [16-education-credentials-institutions § Contracts](../16-education-credentials-institutions.md#contracts) defines commands/queries and [16-education-credentials-institutions § Event Schemas](../16-education-credentials-institutions.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Deepened course revision, entitlement, refund, privacy, exam evidence, institution deferral and prohibited-data paths | `/write-architecture-spec` |

## Dependency References

- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/2026-08-02-architecture-design|Architecture design]]
- [[specs/data-placement-strategy|Data placement strategy]]
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/16-education-credentials-institutions|Shard 16 — Courses, credentials, institutions and special practice]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/ia/15-education-delivery|Shard 15 — Lessons, practice and mentorship delivery]]
