# Shard 42 — Career planning, insurance and sustainability

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 42 owns queryable career goals, derived milestones, privacy-gated peer distributions and point-of-need insurance referrals. It consumes descriptive market evidence from [[specs/ia/40-market-intelligence-signals|Shard 40]], verified income/runway/finance facts from [[specs/ia/41-career-finance|Shard 41]] and platform policy/notification primitives from [[specs/ia/00-infrastructure|Shard 00]]. It does not infer wellbeing, prescribe career choices, underwrite insurance or promise coverage.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 9 |
| Child capabilities | 5 across 23.05, 23.08 and 23.09 |
| Goal boundary | Every offered goal has a queryable target and source derivation; templates compose without forcing one career archetype |
| Milestone boundary | Derived only; one canonical milestone per entity/fact; income-derived milestones private by default |
| Benchmark boundary | Role-specific distributions and position only; B2 keeps cohorts disabled until lawful privacy floor |
| Insurance boundary | Suppressible referral at point of need; no underwriting, policy sale, definitive coverage interpretation or action interruption |
| Sustainability boundary | No wellbeing collection/inference. Workload facts remain in source domains; runway action belongs to Shard 41 |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Goals | A goal is target predicate + derivation query + cadence + visibility. Unsupported manual trackers are not offered as platform goals. |
| Templates | Templates are composable goal bundles, not persona/archetype assignment. Stability-oriented goals are default suggestions, never mandatory. |
| Progress | Derived from canonical source facts and source integrity. Users may annotate context but cannot manually mark derived metric complete. |
| Milestones | Append-only derived facts with source revision and visibility. One entity/fact milestone prevents duplicate public/private timelines. |
| Privacy | Income/financial milestones are hard-private by default and cannot be made public through generic visibility control. Public `first` wording is scoped to `first recorded on WeJammin`. |
| Cohorts | Per-role stage/shape cohorts return distributions, sample and subject position; never a single market rate, prescription or named peer. Verified income only. |
| B2 | Cohort computation/query/export remains disabled until counsel approves floor, lawful basis, anti-differencing, retention and disclosure. Below floor suppresses, never broadens. |
| Insurance triggers | Venue/engagement requirement outranks gear-purchase context. Trigger is advisory and never blocks underlying booking/purchase workflow. |
| Coverage gap | Platform may compare structured declared requirement/policy attributes and show `possible gap`; only insurer/broker-confirmed response may state applicability. |
| Referral | User-initiated, suppressible and non-nagging. Provider receives minimum consented package; platform does not rank by commission or decide eligibility/premium. |
| Sustainability | Capability is explicitly excluded. No self-reported wellbeing, health inference, burnout score or intervention automation. Observable workload is not interpreted as mental/physical state. |
| Configuration | Goal predicates, derivations, milestone wording/visibility, cohort dimensions/floors and insurance trigger/suppression policies are typed versioned settings. |

## Features

- **23.05 Career Progression & Benchmarking** — [ideation source](../ideation/23-career-finance-business/23.05-career-progression-benchmarking/23.05-career-progression-benchmarking-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **23.08 Point-of-Need Insurance** — [ideation source](../ideation/23-career-finance-business/23.08-point-of-need-insurance.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **23.09 Career Sustainability Signals** — [ideation source](../ideation/23-career-finance-business/23.09-career-sustainability-signals.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-42.01 — Add goal template:** Given Authorized person/entity and supported derivations, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Add goal template, and (6) return Composable goals instantiate with targets, cadence and visibility; if the flow cannot complete, Missing source/query disables goal with explanation.
- **AC-42.02 — View goal progress:** Given Current source projection and integrity, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View goal progress, and (6) return Progress/unknown state derives with source/freshness; if the flow cannot complete, Stale/incomplete source never renders achieved.
- **AC-42.03 — Derive milestone:** Given Qualifying canonical fact and rule version, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Derive milestone, and (6) return One immutable milestone appends with safe visibility/wording; if the flow cannot complete, Duplicate derivation idempotent; revoked fact invalidates visibly.
- **AC-42.04 — Share milestone:** Given Milestone class permits sharing and actor authorized, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Share milestone, and (6) return Public/entity-scoped projection uses bounded wording; if the flow cannot complete, Financial/hard-private class refuses public visibility.
- **AC-42.05 — View peer distribution:** Given B2 gate open, role/context and cohort meet floor, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View peer distribution, and (6) return Pull-only distribution, n, position and caveats render; if the flow cannot complete, Below floor/denied/no data suppresses without widening.
- **AC-42.06 — Detect insurance need:** Given Named underlying action and structured requirement/policy facts, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Detect insurance need, and (6) return Non-blocking possible-gap prompt appears once per policy; if the flow cannot complete, Unknown facts state uncertainty; no coverage verdict.
- **AC-42.07 — Request insurance referral:** Given User affirmatively selects provider/path and disclosure, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request insurance referral, and (6) return Minimum consented package transmits with provider terms; if the flow cannot complete, Decline/suppress leaves underlying action unchanged.
- **AC-42.08 — Record provider response:** Given Provider/actor supplies reference/outcome, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record provider response, and (6) return Referral status records without underwriting claim; if the flow cannot complete, Ambiguous/failed response remains external/unknown.
- **AC-42.09 — Request wellbeing/sustainability score:** Given Any actor/context, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request wellbeing/sustainability score, and (6) return Stable capability-not-offered explanation and runway/workload source routes; if the flow cannot complete, No sensitive input is solicited or stored.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 42.01 | Add goal template | Authorized person/entity and supported derivations | Composable goals instantiate with targets, cadence and visibility | Missing source/query disables goal with explanation |
| 42.02 | View goal progress | Current source projection and integrity | Progress/unknown state derives with source/freshness | Stale/incomplete source never renders achieved |
| 42.03 | Derive milestone | Qualifying canonical fact and rule version | One immutable milestone appends with safe visibility/wording | Duplicate derivation idempotent; revoked fact invalidates visibly |
| 42.04 | Share milestone | Milestone class permits sharing and actor authorized | Public/entity-scoped projection uses bounded wording | Financial/hard-private class refuses public visibility |
| 42.05 | View peer distribution | B2 gate open, role/context and cohort meet floor | Pull-only distribution, n, position and caveats render | Below floor/denied/no data suppresses without widening |
| 42.06 | Detect insurance need | Named underlying action and structured requirement/policy facts | Non-blocking possible-gap prompt appears once per policy | Unknown facts state uncertainty; no coverage verdict |
| 42.07 | Request insurance referral | User affirmatively selects provider/path and disclosure | Minimum consented package transmits with provider terms | Decline/suppress leaves underlying action unchanged |
| 42.08 | Record provider response | Provider/actor supplies reference/outcome | Referral status records without underwriting claim | Ambiguous/failed response remains external/unknown |
| 42.09 | Request wellbeing/sustainability score | Any actor/context | Stable capability-not-offered explanation and runway/workload source routes | No sensitive input is solicited or stored |

## Contracts

| Contract | Producer → consumer | Required fields | Errors / invariants |
|---|---|---|---|
| `GoalDefinitionV1` | Template/user → goal service | owner, target predicate, derivation query/version, cadence, visibility class | Queryable targets only; no archetype lock |
| `GoalProgressV1` | Source projections → goal view | goal, value/state, source revision, integrity/freshness, derived-at | Unknown/stale cannot become achieved |
| `DerivedMilestoneV1` | Rule engine → timeline/share | owner/entity, fact key, class, source revision, wording scope, visibility | Unique fact/rule; financial hard-private |
| `PeerDistributionV1` | B2 cohort engine → subject | role, stage/shape criteria, distribution, n, subject position, policy version | No named peer/market-rate/prescription; no export |
| `InsuranceNeedObservationV1` | Booking/gear/finance fact → referral surface | owner, underlying action, requirement, declared policy attributes, confidence/source | Possible gap only unless provider-confirmed |
| `InsuranceReferralV1` | User → external provider | need, provider, consented fields, terms version, requested-at, status | No underwriting/eligibility/premium decision |

All mutations carry acting-party mandate, expected revision/idempotency key and audit correlation. Cohort and insurance provider failures are explicit. External provider timeout becomes `unknown_reconciling`; it never blocks source action or implies rejected coverage.

## Data Models

| Entity | Key relationships and constraints |
|---|---|
| `goal_template` / `goal_definition` | Versioned composable target/derivation/cadence/visibility; no archetype discriminator |
| `goal_progress_projection` | Disposable source-versioned value/state/integrity/freshness |
| `derived_milestone` | Unique owner/entity/fact/rule, immutable source/wording/visibility class and active/invalidated state |
| `cohort_definition` / `peer_distribution` | Role/stage/shape criteria and anonymous aggregate; physically gate-restricted under B2 |
| `insurance_need_observation` | Underlying action, structured requirement/declared policy facts, source/confidence and suppression key |
| `insurance_referral` | User consent, provider, disclosed field allowlist, terms and external status; no risk/underwriting score |
| `insurance_prompt_suppression` | Owner/provider/need class/effective window; always honored |

No wellbeing/health profile, self-report, inference or score table exists. Financial milestone source remains in Shard 41; market evidence remains in Shard 40. Restricted insurance facts use least-privilege schema/RLS and purpose retention. Cohort membership is ephemeral and never exported/stored as reusable peer list.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`goal_template`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Versioned composable target/derivation/cadence/visibility; no archetype discriminator.
- **`goal_definition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Versioned composable target/derivation/cadence/visibility; no archetype discriminator.
- **`goal_progress_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Disposable source-versioned value/state/integrity/freshness.
- **`derived_milestone`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Unique owner/entity/fact/rule, immutable source/wording/visibility class and active/invalidated state.
- **`cohort_definition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Role/stage/shape criteria and anonymous aggregate; physically gate-restricted under B2.
- **`peer_distribution`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Role/stage/shape criteria and anonymous aggregate; physically gate-restricted under B2.
- **`insurance_need_observation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Underlying action, structured requirement/declared policy facts, source/confidence and suppression key.
- **`insurance_referral`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: User consent, provider, disclosed field allowlist, terms and external status; no risk/underwriting score.
- **`insurance_prompt_suppression`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner/provider/need class/effective window; always honored.

## Access Control

| Actor | Allowed | Explicitly denied |
|---|---|---|
| Person/multi-hyphenate | Manage own goals, private milestones, gated role cohorts and referrals | Publish hard-private finance milestone or access named peers |
| Entity actor | Manage entity goals/shareable entity milestones under mandate | Access member personal finance/insurance without separate authority |
| Insurance provider | Receive one consented referral package and return external status | Browse platform profile, source finance or decide platform eligibility state |
| Support | Resolve named goal/milestone/referral case through expiring grant | Read general financial/insurance data or override suppression |
| Administrator | Activate versioned templates/B2/provider policies under dual control | Lower cohort floor, enable wellbeing inference or force referral |
| Service principal | Execute one derivation/cohort/referral contract | Join identities across purposes or retain cohort member list |

Goal/milestone rows use owner/entity RLS. Cohort query enforces privacy before count/rank and has no admin bypass while B2 closed. Insurance field disclosure is allowlisted per provider/purpose and requires affirmative user consent plus step-up for sensitive finance attachment.

### Access Escalation

- **Person/multi-hyphenate:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Entity actor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Insurance provider:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Support:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Administrator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Goals identify target, source, cadence, visibility and unknown/stale state in text; progress is not communicated by color/progress bar alone.
- Template composition is keyboard-operable and does not require choosing a persona/archetype.
- Milestone sharing preview states exact audience/wording and blocks hard-private classes before public controls.
- Peer distributions provide accessible table, n, range/percentiles and caveats; no single normative target or shaming language.
- Insurance prompt is non-modal/non-blocking, dismissible and permanently suppressible from keyboard; source action remains available.
- Possible coverage gap language is plain and cautious, with provider/broker confirmation path adjacent.
- Referral consent lists every field/provider/purpose and supports granular cancel before transmission.
- Capability-not-offered sustainability response does not solicit health/wellbeing details and routes to existing practical workload/runway tools.
- Normal web/PWA reads target p95 ≤2 seconds with cached complete derived projections and explicit freshness.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `career.goal.created.v1` | goal, owner/entity, target/derivation version, cadence, visibility | progress scheduler/audit |
| `career.goal.progress_changed.v1` | goal, state/value, source revision, integrity, derived-at | timeline/notification |
| `career.milestone.derived.v1` | milestone, fact/rule, source revision, class/visibility/wording | private timeline/share projection |
| `career.milestone.invalidated.v1` | milestone, source fact revision, reason | timeline/public cache invalidation |
| `career.insurance_need.observed.v1` | need, owner, action, requirement/source/confidence, suppression class | referral prompt |
| `career.insurance_referral.changed.v1` | referral, provider, consent version, status, occurred-at | user status/audit |

Events are versioned, append-only and at-least-once. Consumers deduplicate by event/domain key. Shared events exclude finance amounts, policy documents, health/wellbeing data, cohort membership, peer identities and provider referral payload fields.

## Edge Cases

- Source metric disappears or permission revokes: goal becomes unknown/unavailable, never silently completed or reset.
- One fact satisfies two templates: one milestone fact renders once with applicable labels, not duplicate timeline claims.
- Historical data predates WeJammin: wording says `first recorded on WeJammin`, never false career-first claim.
- Income milestone rule fires: hard-private visibility enforced even if generic entity timeline is public.
- Role changes over time: peer distribution evaluates selected role/window; no identity-wide cohort mixes careers.
- Cohort shrinks below floor: suppress immediately and invalidate cache; never widen stage/shape criteria.
- Repeated cohort queries attempt differencing: B2 query-family budget/floor blocks and audits without revealing membership.
- Venue requirement conflicts with declared policy: prompt states possible gap and requests qualified confirmation, not definitive non-coverage.
- Gear/venue action is time-sensitive: referral prompt never blocks completion and can be revisited afterward.
- Provider pays referral commission: disclosure required; commission cannot influence ranking, need detection or eligibility.
- User suppresses insurance: future equivalent prompts remain suppressed by policy; critical changed requirement may only reappear under explicit versioned rule/notice.
- User types wellbeing details into support/free text elsewhere: classify/restrict under source domain; Shard 42 creates no sustainability profile or inference.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 42.01 Add goal template | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 42.02 View goal progress | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 42.03 Derive milestone | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 42.04 Share milestone | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 42.05 View peer distribution | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 42.06 Detect insurance need | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 42.07 Request insurance referral | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 42.08 Record provider response | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 42.09 Request wellbeing/sustainability score | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/40-market-intelligence-signals|Shard 40]], [[specs/ia/41-career-finance|Shard 41]]
- **Depended on by:** None
- **Deep dives:** None required after convergence; the parent shard remains below the complexity threshold.


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 40:** consume [Shard 40 Contracts](40-market-intelligence-signals.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 40 Event Schemas](40-market-intelligence-signals.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 41:** consume [Shard 41 Contracts](41-career-finance.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 41 Event Schemas](41-career-finance.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Locked queryable goals, private milestones, gated cohorts, referral-only insurance and no-wellbeing boundary | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/40-market-intelligence-signals|Shard 40 — Market intelligence, fraud and scouting signals]]
- [[specs/ia/41-career-finance|Shard 41 — Career finance and business operations]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
