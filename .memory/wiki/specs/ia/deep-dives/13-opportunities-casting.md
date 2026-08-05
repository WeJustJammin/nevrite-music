# Deep Dive 13 — Opportunities and casting lifecycle

> **Parent IA Shard**: [../13-opportunities-casting.md](../13-opportunities-casting.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns immutable post terms, compensation/eligibility gates, targeting/ranking/alerts, assembled submissions, recoverable review, offer races, disposition debt and idempotent handoff. Downstream domains own projects, rights, engagements, memberships and live operational truth.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Posts, slots, terms, compensation, criteria, targeting, alerts, submissions, tasks, reviews, offers, dispositions and handoffs share exact versions/idempotency. |
| What-if expansion | Live term change, rules drift, partial sources, duplicate submission, reviewer candidacy, incomplete queue, acceptance race, failed handoff and deleted post converge. |
| Adversarial pass | Acting-context ambiguity, unpaid deliverable abuse, applicant fees, infinite engagement board, auto-created alerts, one-click spam, self-review, reject-remaining and silent nonresponse fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field or unresolved implementation choice. |

## Canonical Field Contracts

| Model | Fields and constraints |
|---|---|
| `opportunity` | `id, type_version, acting_party_id, poster_person_id, decider_authority_ref, context_type/id?, state, created_at, version`; type immutable after first publish. |
| `opportunity_slot` | `id, opportunity_id, role_version/literal, casting_class, sequence, state, decide_by, handoff_mode/target_ref?, version`. |
| `opportunity_terms_version` | `id, post_id, date_semantics/value, timezone?, location, compensation_id, criteria_hash, targeting_hash, rights/spec-work hash, gate_rule_version, published_at, supersedes_id?`. |
| `compensation_spec` | `shape, amount_min/max?, basis?, unit, currency, expenses, timing, points_base?, buyout_scope?, ai_training_included, shared_cost_recipient?, state`. |
| `submission` | `id, submitting_party_id, post_id, slot_id, terms_version, state, current_version_id, submitted_at, withdrawn_at?, version`; one active tuple. |
| `submission_version` | `id, submission_id, structured_answers, evidence_refs[], availability_by_date, media/task refs, counter_terms?, content_hash, supersedes_id?`. |
| `triage_vote` | `assignment_id, submission_id/version, decision, blocker?, blocker_owner?, resolve_by?, evidence_snapshot_hash, created_at`. |
| `offer` | `id, submission_id, slot_id, terms_version, issuer, compensation/engagement facts, delta_hash, fuse_expires_at, parallel_offer_count, state, version`. |
| `submission_disposition` | `submission_id, slot_id, code, criterion_version?, acting_party, source_event, committed_at, notice_state`; unique immutable. |
| `handoff` | `id, acceptance_event_id, mode, target_ref?, fact_manifest_hash, downstream_ids[], state, attempts, next_attempt_at?, escalation_at?, version`. |

## State Machines

- Post: `draft -> published -> paused -> published -> closed | cancelled`; deletion is delisting/tombstone, never obligation deletion.
- Slot: `draft -> open -> paused -> offer_active -> filled | closed | cancelled`.
- Submission: `draft -> submitted -> terms_changed -> submitted | withdrawn -> held | shortlisted -> offered -> accepted | declined | rejected -> dispositioned`.
- Offer: `draft -> active -> accepted | declined | countered | expired | externally_ended`. Active offer is issuer-irrevocable.
- Handoff: `pending -> dispatching -> succeeded | failed_retryable | escalated | external_complete`. Acceptance never rolls back.

## Publication Gate Algorithm

1. Resolve explicit acting party and decider activity/domain authority at current Shard 01 version.
2. Validate immutable opportunity type and its date semantics, slot schemas and casting class.
3. Validate compensation six facets. Reject applicant-side fees, credit-as-pay, unbounded negotiable and £0-as-flat-fee.
4. For unpaid, require legitimate presence outcome or one evaluation-only deliverable round with no use rights and return/destruction on non-selection.
5. For range, filter/badge floor is declared minimum. For points/buyout, require base/scope and AI/model-training line.
6. Validate criteria trust tier. Protected criteria unavailable on labour types; performance exceptions require jurisdiction profile.
7. Freeze targeting order, decide-by, rights, unused-submission handling and rule-set version.
8. Publish atomically with slots/outbox. No admin override; admin may unpublish only.

## Terms Change and Discovery Algorithm

1. Material live edit creates successor terms and re-runs current gate.
2. Compute applicant-readable delta and mark every active submission `terms_changed`.
3. Notify with Stay/Withdraw. Silence preserves candidacy; new applicants bind new terms.
4. Board first resolves targeting entitlement, then viewer blocks/restrictions, own-party exclusion, availability/reachability and material evidence.
5. Rank fit-primary, recency tie-break within equal fit. Return one-sentence reasons and missing/degraded inputs.
6. Keep finite/exhaustible pages and session-stable order; changes accumulate behind “N new.”
7. Type-specific freshness sinks and tombstones presentation only; submission/post canonical state unchanged.
8. Public/Fan projection omits professional compensation and protected filters.

## Alert Policy Algorithm

1. Create only from explicit user intent; cap twenty live intents/account.
2. Compute type floor × time-to-close × material confidence × context-raised status; user preference clamps ceiling.
3. Critical requires context-raised opportunity and material confidence; poster cannot declare urgency override.
4. Calendar quiet hours suppress unless earned policy exception. Availability has persona-specific sign.
5. Deduplicate user/post and allow at most two lifetime deliveries; second used by widening or deadline escalation.
6. Push carries pointer/minimum safe copy, never compensation/position/other-candidate facts.
7. Record delivered-to-device evidence, never claim user notified/read.
8. Burst/critical abuse signals route Shard 06 without blocking legitimate saved intent.

## Submission and Review Algorithm

1. Validate submitting entity, exact slot/terms, eligibility and applicant-side review exclusion.
2. Assemble structured submission from selected evidence citations; never copy full CV/credit graph. Evidence outage degrades and does not block.
3. Calendar conflict warns applicant only. Partial per-date availability remains valid.
4. Stable tuple supersedes prior version and flags diff if triaged; no one-click/bulk/template submit.
5. Audition task reuses publication spec-work gate and discloses scope/rounds/retention/payment/rights before upload.
6. Review assignment excludes any candidate automatically, overriding governance grants.
7. Reject requires fully loaded queue/evidence/criteria/media. Advance/hold remain recoverable; hold needs closed blocker, owner and resolve-by ≤ decide-by.
8. Multi-triager reject is vote; disagreement advances to shortlist. Bulk reject must name criterion live at submit and exact count.
9. Shortlist preserves independent review/disagreement; never average scores into authority.

## Offer, Race and Disposition Algorithm

1. Re-resolve decider authority and re-run compensation gate on final offer.
2. Compute post-to-offer material delta. If unavailable, accept disabled; decline remains.
3. Commit active offer with fuse and disclosed N live parallel offers. Issuer cannot revoke inside fuse except named external cause.
4. Counter is new reverse-direction offer with own gate/fuse/delta against original post.
5. Accept command compares active offer/slot version; database sequence orders by receipt, never device timestamp.
6. Winning commit sets slot filled, acceptance event and handoff outbox atomically.
7. Concurrent losers receive filled/cascade result and disposition; no ambiguous “too late.”
8. Winner triggers disposition for every other active submission on slot. First disposition is immutable/idempotent.
9. Delisting/deletion never discharges obligations. Platform chases acting party; applicants cannot nudge/self-close.

## Handoff Algorithm

1. Read publication-fixed mode/target and acceptance fact manifest.
2. `create` creates scoped downstream container/engagement; `join` adds operational participant under existing authority; `propose` creates pending consent object; `external` produces artifact.
3. Write operational facts, accepted terms, dates, role, compensation, split trigger, cast snapshot and back-reference.
4. Never create membership/authority, rights ownership or final split without owning-domain consent.
5. Retry idempotently. Standard path escalates by fifteen minutes; urgent/date<48h by sixty seconds.
6. Downstream failure/divergence is visible and never rolls back acceptance.
7. Reversed win creates successor opportunity; original agreement/handoff history remains.
8. Band winner carries unresolved cast unless explicitly fixed/consented elsewhere.

## Abuse and Recovery Verification

| Threat/failure | Required control |
|---|---|
| Poster hides identity behind affiliation | Explicit unskippable acting party and attributed decider. |
| Unpaid audition harvests usable work | One evaluation-only round, no use rights, return/destroy; more requires paid trial. |
| Poster charges application fee | Fee shape absent from schemas/gates; shared cost payable after selection and not to poster. |
| Board optimizes engagement | Finite/exhaustible, fit reasons, no infinite scroll/reinjection/dwell rank. |
| Platform spams urgent alerts | Explicit intent, lifetime cap, Critical gate and Shard 06 burst signal. |
| Applicant applies everywhere blindly | No one-click/bulk/templates; deliberate slot/evidence confirmation. |
| Candidate reviews competitors | Candidate exclusion overrides all grants and hides queue. |
| Reviewer rejects during outage | Reject unavailable until complete evidence/queue; recoverable actions only. |
| Bulk “reject remaining” discrimination | No such command; criterion-scoped exact-count only. |
| Poster avoids closure by deleting | Submissions/obligations persist; response signal counts open debt. |
| Two candidates accept | Serializable receipt order; one slot winner and named loser outcomes. |
| Handoff partially writes | Acceptance durable; idempotent fact manifest retries and alerts. |

## Cross-Shard Contracts

| Counterparty | Contract |
|---|---|
| Shard 00 | Request/error/outbox/search/alerts/upload/idempotency and protected audit. |
| Shard 01 | Acting party, decider/reviewer activities+domains, Band membership and authority. |
| Shard 06 | Reports, spec-work gate enforcement, abuse signals and media safety. |
| Shard 11 | Trusted-network/reachability/evidence discovery; follows never substitute. |
| Shards 09/10/14/30 | Typed project/split/service/booking handoff commands with exact acceptance facts. |

No current IA shard declares Shard 13 as a dependency; integrations are outgoing typed handoffs and do not grant table access. Future consumers must add reciprocal references before implementation.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [13-opportunities-casting § Contracts](../13-opportunities-casting.md#contracts) defines commands/queries and [13-opportunities-casting § Event Schemas](../13-opportunities-casting.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-03 | Locked publication, discovery, submission, review, offer, disposition and handoff algorithms | /write-architecture-spec-deepen | All |

## Dependency References

- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
