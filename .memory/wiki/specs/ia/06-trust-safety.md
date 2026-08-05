# Shard 06 — Trust, safety, disputes and evidence

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/06-trust-safety.md](deep-dives/06-trust-safety.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 06 owns the protected case system for reports, moderation, sanctions, appeals, fraud review, transaction disputes, copyright/authenticity enforcement, personal-safety response, identity/ownership disputes, illegal-content/legal process, and immutable evidence. It separates allegation from finding, advisory signals from decisions, access sanctions from ownership truth, and ordinary case access from restricted preservation.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 9 |
| Child capabilities reconciled | 37 |
| Source documents loaded | 47 |
| Added or removed feature boundaries | 0 |
| Consumer-launch boundary | Reporting, admin takedown/suspension, DMCA `512 intake/repeat-infringer tracking, and minimal immutable audit |
| Deferred product surface | Automated classification, generalized disputes, trust scoring, ordinary appeals, marketplaces, and advanced legal/safety operations |
| Counsel gates | B2/B3/B5/B6 remain disabled, especially automatic CSAM action, emergency guarantees, and 24/7 police response |
| Split handling | Parent IA plus one approved high-complexity deep dive |

## Features

- **24.01 Reporting, Moderation & Notice-and-Action** — object-level intake, advisory classification, weighted-fair queues, trusted flaggers, reviewer exposure controls, and metadata-first messaging safety.
- **24.02 Enforcement, Appeals & Policy** — scoped sanctions, reversible decisions, statements of reasons, immutable policy versions/acceptance, prohibited-item evaluation, and transparency projections.
- **24.03 Fraud & Risk Operations** — action scoring, account protection, ban-evasion/ring review, transaction abuse controls, sanctions/AML boundaries, and review-integrity adjudication.
- **24.04 Transaction Disputes & Protection** — claim filing, evidence retrieval, mediation, protection eligibility, and chargeback reconciliation.
- **24.05 Copyright & Authenticity Enforcement** — DMCA notice/counter-notice/repeat-infringer flow, advisory audio matching, counterfeit/authenticity review, and forensic leak response.
- **24.06 Personal Safety & Threat Response** — private restriction, harassment/doxxing cases, meetup safety records, and resources-only crisis response at v1.
- **24.07 Identity Abuse & Ownership Disputes** — impersonation, mandate/credential conflict, account recovery, succession, and reversible incapacity handling.
- **24.08 Illegal Content & Legal Process** — counsel-gated CSAM automation, separate TVEC hash/policy paths, verified legal intake, and domain-launch-triggered risk assessment.
- **24.09 Case Evidence Locker & Chain of Custody** — event-time snapshots, hashed media references, capture delivery, appeal supplements, retention clocks, legal holds, and restricted preservation.

### Delivery Phases

| Phase | Enabled boundary |
|---|---|
| Consumer launch | `report.create` for user-visible objects/profiles; authorized admin removal/suspension; identified DMCA intake; repeat-infringer ledger; moderation audit |
| Phase 2+ | Full queue operations, policy library, ordinary appeal UI, fraud review, transaction disputes, safety/identity cases, evidence views and transparency |
| Counsel-gated | Automatic CSAM action, emergency disclosure/escalation, 24/7 legal response, high-risk automation, sparse safety analytics and unapproved money/AML outcomes |

## Acceptance Criteria

- **AC-TSE-01 — Submit safety report:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reason derives from target type; anonymity allowed where lawful; per-reporter throttling admits but deprioritizes excess; replay is idempotent, and (6) return Case and intake snapshot commit atomically; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-02 — Submit legal/DMCA notice:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Identified claimant completes regime attestations; incomplete notice stays draft and cannot remove content or increment strikes, and (6) return Validated notice, attestation and capture intent exist; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-03 — Route and claim case:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reason, object type, severity and remaining time select a weighted-fair lane; staff claims an exclusive expiring lease, and (6) return Lease/version recorded without resetting clocks; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-04 — Review case:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Minimum safe projection, exposure controls, conflict/mandate checks and exact policy version required; allegation remains distinct from finding, and (6) return Proposal or no-action result written; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-05 — Apply sanction/takedown:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Narrowest scope only; access/privileges may change, never ownership/credits; expected version and idempotency required, and (6) return Sanction, audit and required SoR commit atomically; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-06 — Concur or reaffirm:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) From second moderator onward, S1 and rung ≥6/indefinite require another human; solo uses compensating controls and cooling-off except urgent S0/S1, and (6) return Actual control used is immutable; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-07 — Appeal decision:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Eligible subject appends evidence; independent human review applies when surface enabled while reversibility always remains possible, and (6) return Per-item outcome and correction recorded; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-08 — Restrict another user:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Private block/restriction is immediate with no case requirement and propagates deny-first, and (6) return Effective edge version returned; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-09 — Evaluate advisory signal:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Rule/model/provider scores action or object, never person; may prioritize review but cannot sanction, remove or notify, and (6) return Signal and disposition linked without becoming finding; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-10 — Open transaction dispute:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized party files against transaction; remedies derive from type; contemporaneous evidence is retrieved, not reconstructed, and (6) return Parties, remedies and deadline freeze; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-11 — Mediate or adjudicate:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Settlement is party agreement, not platform finding; adjudication uses disclosed evidence weights and protection rules, and (6) return Signed settlement or reasoned outcome reconciles; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-12 — Process DMCA counter-notice:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Subject sees disclosure consequences and signs `512(g) statements; restoration timer starts only when complete, and (6) return Delivery evidence and deadline recorded; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-13 — Resolve identity/ownership case:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Shard 01 party, alias, credit, membership and mandate truth controls; credential possession is not ownership, and (6) return Scoped outcome preserves ownership records; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-14 — Handle safety/crisis intake:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Harassment/doxxing uses protected lane; crisis resources bypass classifier/ladder/SoR/appeal and never sanction person in crisis, and (6) return Safety action or resources-only completion recorded; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-15 — Receive legal process:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) V1 verifies requester, authority, scope and prohibition; overbroad requests narrow/refuse; user notified unless barred, and (6) return No disclosure before legal authorization; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-16 — Capture evidence:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Source event atomically writes capture intent; worker snapshots fields and hashes media; terminal failure is explicit, and (6) return Sealed entry or `capture_failed` marker exists; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-17 — Place/release legal hold:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Counsel-authorized actor states basis, scope and release condition; hold supersedes destructive clocks, and (6) return Hold/release version and manifest commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-TSE-18 — Assess domain-launch risk:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Before launch, owner records harms, controls, gaps, evidence and disposition; calendar-only review is insufficient, and (6) return Assessment gates launch configuration; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| TSE-01 | Submit safety report | Reason derives from target type; anonymity allowed where lawful; per-reporter throttling admits but deprioritizes excess; replay is idempotent. | Case and intake snapshot commit atomically. |
| TSE-02 | Submit legal/DMCA notice | Identified claimant completes regime attestations; incomplete notice stays draft and cannot remove content or increment strikes. | Validated notice, attestation and capture intent exist. |
| TSE-03 | Route and claim case | Reason, object type, severity and remaining time select a weighted-fair lane; staff claims an exclusive expiring lease. | Lease/version recorded without resetting clocks. |
| TSE-04 | Review case | Minimum safe projection, exposure controls, conflict/mandate checks and exact policy version required; allegation remains distinct from finding. | Proposal or no-action result written. |
| TSE-05 | Apply sanction/takedown | Narrowest scope only; access/privileges may change, never ownership/credits; expected version and idempotency required. | Sanction, audit and required SoR commit atomically. |
| TSE-06 | Concur or reaffirm | From second moderator onward, S1 and rung ≥6/indefinite require another human; solo uses compensating controls and cooling-off except urgent S0/S1. | Actual control used is immutable. |
| TSE-07 | Appeal decision | Eligible subject appends evidence; independent human review applies when surface enabled while reversibility always remains possible. | Per-item outcome and correction recorded. |
| TSE-08 | Restrict another user | Private block/restriction is immediate with no case requirement and propagates deny-first. | Effective edge version returned. |
| TSE-09 | Evaluate advisory signal | Rule/model/provider scores action or object, never person; may prioritize review but cannot sanction, remove or notify. | Signal and disposition linked without becoming finding. |
| TSE-10 | Open transaction dispute | Authorized party files against transaction; remedies derive from type; contemporaneous evidence is retrieved, not reconstructed. | Parties, remedies and deadline freeze. |
| TSE-11 | Mediate or adjudicate | Settlement is party agreement, not platform finding; adjudication uses disclosed evidence weights and protection rules. | Signed settlement or reasoned outcome reconciles. |
| TSE-12 | Process DMCA counter-notice | Subject sees disclosure consequences and signs `512(g) statements; restoration timer starts only when complete. | Delivery evidence and deadline recorded. |
| TSE-13 | Resolve identity/ownership case | Shard 01 party, alias, credit, membership and mandate truth controls; credential possession is not ownership. | Scoped outcome preserves ownership records. |
| TSE-14 | Handle safety/crisis intake | Harassment/doxxing uses protected lane; crisis resources bypass classifier/ladder/SoR/appeal and never sanction person in crisis. | Safety action or resources-only completion recorded. |
| TSE-15 | Receive legal process | V1 verifies requester, authority, scope and prohibition; overbroad requests narrow/refuse; user notified unless barred. | No disclosure before legal authorization. |
| TSE-16 | Capture evidence | Source event atomically writes capture intent; worker snapshots fields and hashes media; terminal failure is explicit. | Sealed entry or `capture_failed` marker exists. |
| TSE-17 | Place/release legal hold | Counsel-authorized actor states basis, scope and release condition; hold supersedes destructive clocks. | Hold/release version and manifest commit. |
| TSE-18 | Assess domain-launch risk | Before launch, owner records harms, controls, gaps, evidence and disposition; calendar-only review is insufficient. | Assessment gates launch configuration. |

### Global Interaction Rules

- Every command carries `actor_person_id`, `acting_party_id?`, `acting_context_version`, `idempotency_key`, `expected_version?`, `request_id` and required step-up proof.
- Canonical writes use domain services plus protected PostgreSQL RPC/RLS; Realtime, queues, search and analytics are projections or hints.
- Intake captures target, acting context, policy/routing versions and minimal immutable snapshot; later edits never rewrite allegation.
- Volume, badge, persona, entity membership, price, genre, protected trait and role diversity never independently establish guilt or priority.
- Advisory classifiers/matchers fail open; prohibited-item checkout and approved payout screening fail closed; counsel-gated automation remains disabled.
- User status exposes safe projection only; reporter identity, detection method, reviewer identity, legal prohibitions and restricted evidence stay sealed.

## Contracts

### Core Types and Errors

| Contract | Definition |
|---|---|
| `CaseKind` | `safety_report | moderation | dmca | fraud_review | transaction_dispute | impersonation | ownership | legal_process | illegal_content | crisis | governance` |
| `CaseState` | `draft | received | triaged | queued | claimed | reviewing | awaiting_party | proposed | awaiting_control | decided | appealed | resolved | closed | capture_failed` |
| `Severity` | `S0_illegal | S1_active_harm | S2_material | S3_standard | S4_low`; mapping is policy-versioned |
| `Decision` | `no_action | warn | restrict | remove_object | suspend_scope | suspend_account | terminate_access | restore | refer_external | resources_only` |
| `EvidenceClass` | `ordinary | sensitive | legal | restricted_preservation` |
| `StandardError` | `VALIDATION_FAILED, UNAUTHENTICATED, ACTING_CONTEXT_STALE, FORBIDDEN, STEP_UP_REQUIRED, VERSION_CONFLICT, IDEMPOTENCY_MISMATCH, CASE_LEASE_LOST, POLICY_VERSION_INVALID, CONTROL_REQUIRED, COUNSEL_GATE_DISABLED, DISCLOSURE_PROHIBITED, PROVIDER_UNAVAILABLE, CAPTURE_FAILED` |

### Intake, Case and Evidence

| Contract | Invariant |
|---|---|
| `CreateReport` | Target addressable; reason valid for target kind. Anonymous receipt non-enumerable; legal identity protected. Target report volume never blocks intake. |
| `RouteCase` | Priority derives from severity and remaining deadline. Safety capacity floor and S0 isolation cannot be weakened below policy floor. |
| `ClaimCase` | Compare-and-set lease on `case_id/version`; reviewer eligible/unconflicted; expiry preserves clocks. |
| `AppendCaseMaterial` | Parties append typed submissions/supplements only; no mutation of snapshots, findings or another party's material. |
| `SealEvidence` | Entry records source event/version, captured-at, canonical hash, blob hash/locator, origin and prior-entry hash. |
| `EvidenceProjection` | Case role/purpose controls fields. Restricted preservation has no party/reviewer derivative; break-glass may emit sealed non-content result only. |

### Policy, Decisions and Enforcement

| Contract | Invariant |
|---|---|
| `PolicyVersion` | Published rules immutable; half-open UTC intervals; decisions pin exact version/locale; superseded versions remain retrievable. |
| `EvaluatePolicy` | Returns candidate rule, severity, allowed bounds and controls; cannot write enforcement. |
| `ProposeDecision` | Requires evidence inventory, cited rule, rationale, scope, consequence preview, conflict check and expected case version. |
| `ActivateDecision` | Uses narrowest sufficient scope. Ownership, confirmed credits/splits and export rights excluded. Unresolved actor/mandate blocks entity action. |
| `StatementOfReasons` | Plain summary plus structured representation commits with sanction. Correction supersedes, never edits. |
| `AppealDecision` | Original decider cannot decide appeal. Result per enforcement item; reversal emits compensating commands. |
| `RepeatInfringerLedger` | Strike unit is claimant + asset + infringement event; incomplete/duplicate notices cannot inflate count. |

### Fraud, Disputes and Legal Operations

| Contract | Invariant |
|---|---|
| `RiskSignal` | Scores action/object with reason/version/confidence/expiry; never durable user trust score or protected-trait profile. |
| `ProtectAccount` | ATO response revokes sessions/steps up/holds recovery; protective and separately reviewable, not sanction. |
| `OpenDispute` | Freezes transaction, parties/mandates, remedy policy, deadlines and evidence manifest. |
| `RecordSettlement` | Requires binding-party mandates/exact terms; non-precedential and cannot create finding/protection payout. |
| `LegalDisclosure` | Requires verified requester/instrument/jurisdiction/scope/minimization/approval/prohibition state. No v1 self-service or 24/7 promise. |
| `CounselGate` | Deny-by-default, named, versioned, review-bound and auditable; feature flag cannot substitute for approval record. |

## Data Models

| Model | Key relationships and constraints |
|---|---|
| `safety_case` | Kind/state/severity/queue/clock/owner/version; immutable creation and original deadline. |
| `case_party` / `case_target` | Party role/mandate/disclosure plus target/actor/context/intake snapshot. |
| `report_intake` | Reporter pseudonym or protected identity, reason/version, encrypted narrative, channel, idempotency hash. |
| `case_route` / `case_lease` | Route evidence and exclusive expiring reviewer lease. |
| `policy_rule_version` / `policy_acceptance` | Immutable rulebook/version/locale/interval and append-only acceptance. |
| `case_decision` / `decision_control` | Finding/rationale/rule/scope plus concurrence/reaffirmation/compensating-control evidence. |
| `sanction` / `enforcement_item` | Subject/target/scope/rung/action/state/SoR/reversal; unique active tuple. |
| `statement_of_reasons` / `appeal` | Immutable notice/correction and independent per-item review. |
| `risk_signal` / `review_disposition` | Advisory reasons/version/expiry and explicit disposition without user score. |
| `transaction_dispute` / `resolution_proposal` | Transaction/party/mandate/remedy/deadline snapshots and signed proposals. |
| `dmca_notice` / `dmca_counter_notice` / `repeat_infringer_entry` | Attestations, delivery/restoration clocks and deduplicated strike unit. |
| `restriction_edge` | Private actor-to-subject scope/state/version; non-discoverable. |
| `legal_request` / `disclosure_decision` | Verification, instrument, scope, prohibition/minimization/approval and release manifest. |
| `evidence_bundle` / `evidence_entry` | Case/class/retention/hold and append-only snapshot/media hash chain. |
| `capture_intent` | Source event, requested capture, retry state and terminal failure; atomic with source event. |
| `legal_hold` / `retention_clock` | Basis/authorizer/manifest/release; effective retention is maximum clock, hold unbounded. |
| `safety_risk_assessment` | Domain/release, harms, controls, evidence, gaps, approver and disposition. |
| `audit_event` | Actor/context/action/target/before-after hashes/reason/step-up/request; separate from logs. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`safety_case`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Kind/state/severity/queue/clock/owner/version; immutable creation and original deadline..
- **`case_party`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party role/mandate/disclosure plus target/actor/context/intake snapshot..
- **`case_target`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party role/mandate/disclosure plus target/actor/context/intake snapshot..
- **`report_intake`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Reporter pseudonym or protected identity, reason/version, encrypted narrative, channel, idempotency hash..
- **`case_route`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Route evidence and exclusive expiring reviewer lease..
- **`case_lease`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Route evidence and exclusive expiring reviewer lease..
- **`policy_rule_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable rulebook/version/locale/interval and append-only acceptance..
- **`policy_acceptance`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable rulebook/version/locale/interval and append-only acceptance..
- **`case_decision`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Finding/rationale/rule/scope plus concurrence/reaffirmation/compensating-control evidence..
- **`decision_control`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Finding/rationale/rule/scope plus concurrence/reaffirmation/compensating-control evidence..
- **`sanction`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Subject/target/scope/rung/action/state/SoR/reversal; unique active tuple..
- **`enforcement_item`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Subject/target/scope/rung/action/state/SoR/reversal; unique active tuple..
- **`statement_of_reasons`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable notice/correction and independent per-item review..
- **`appeal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable notice/correction and independent per-item review..
- **`risk_signal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Advisory reasons/version/expiry and explicit disposition without user score..
- **`review_disposition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Advisory reasons/version/expiry and explicit disposition without user score..
- **`transaction_dispute`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Transaction/party/mandate/remedy/deadline snapshots and signed proposals..
- **`resolution_proposal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Transaction/party/mandate/remedy/deadline snapshots and signed proposals..
- **`dmca_notice`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Attestations, delivery/restoration clocks and deduplicated strike unit..
- **`dmca_counter_notice`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Attestations, delivery/restoration clocks and deduplicated strike unit..
- **`repeat_infringer_entry`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Attestations, delivery/restoration clocks and deduplicated strike unit..
- **`restriction_edge`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Private actor-to-subject scope/state/version; non-discoverable..
- **`legal_request`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Verification, instrument, scope, prohibition/minimization/approval and release manifest..
- **`disclosure_decision`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Verification, instrument, scope, prohibition/minimization/approval and release manifest..
- **`evidence_bundle`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Case/class/retention/hold and append-only snapshot/media hash chain..
- **`evidence_entry`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Case/class/retention/hold and append-only snapshot/media hash chain..
- **`capture_intent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source event, requested capture, retry state and terminal failure; atomic with source event..
- **`legal_hold`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Basis/authorizer/manifest/release; effective retention is maximum clock, hold unbounded..
- **`retention_clock`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Basis/authorizer/manifest/release; effective retention is maximum clock, hold unbounded..
- **`safety_risk_assessment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Domain/release, harms, controls, evidence, gaps, approver and disposition..
- **`audit_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Actor/context/action/target/before-after hashes/reason/step-up/request; separate from logs..

## Access Control

| Actor/capability | Permitted | Explicitly denied |
|---|---|---|
| Reporter/claimant | Create applicable report/notice; opaque receipt and safe own status | Queue, other reports, signals, reviewer identity, sealed evidence |
| Case party | Own disclosed material, typed response/appeal, authorized settlement | Mutate snapshots/findings; counterparty-private/restricted evidence |
| Public user | Published policy and aggregate transparency | Allegations, case existence, safety/legal records, low-count analytics |
| Moderator | Assigned safe projection; review/propose within capability/conflict rules | General DB/search, self-concurrence, restricted evidence, ownership mutation |
| Independent reviewer | Concur/appeal when distinct and authorized | Bypass policy/SoR, alter evidence, decide conflicted case |
| Fraud/safety specialist | Scoped queue/signals for assigned purpose | Marketing reuse, unrelated profiling/enforcement |
| Legal/counsel | Verify process, authorize disclosure/hold/gates | Unlogged disclosure, blanket access, retroactive policy change |
| Break-glass custodian | Time-boxed restricted validation with step-up and dual evidence | Export/copy/preview/party disclosure/persistent access |
| System worker | Idempotent route/capture/project/notify with service identity | Human judgment absent approved automatic legal path |
| Platform administrator | Capability/configuration/health | Decide case by admin status or weaken floors through settings |

Protected tables use deny-by-default RLS and service RPC predicates. Staff identity is separate from consumer context; grants are scoped, temporary, non-wildcard and audited.

### Access Escalation

- **Actor/capability:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Reporter/claimant:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Case party:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Public user:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Independent reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Fraud/safety specialist:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Legal/counsel:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Break-glass custodian:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Platform administrator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Report, notice, counter-notice, response and appeal preserve drafts/errors/focus; consequences announced before commitment and never color/hover/pointer-only.
- Queues, evidence inventories and decision forms support keyboard operation, semantic headings/labels, sortable-table announcements, zoom/reflow and reduced motion.
- Sensitive media begins blurred/muted with accessible reveal, warnings and text-only evidence path; forced exposure prohibited.
- Timers expose absolute deadline and remaining time; active preserved forms have recoverable extension behavior.
- Safe-status messages remain truthful but non-leaking; generic notices still identify review/export routes.
- High-consequence forms require automated plus manual keyboard/screen-reader evidence under Shard 05 gates.

## Event Schemas

| Event | Payload minimum | Consumers |
|---|---|---|
| `safety.case.received.v1` | Case/kind/target/reason version/severity/deadline/intake hash | Router, capture worker, receipt projector |
| `safety.case.routed.v1` | Case/queue/priority inputs/route version | Task projector, SLA monitor |
| `safety.decision.activated.v1` | Case/decision/policy/scope/control/SoR/audit hashes | Target domain, notice, transparency |
| `safety.decision.reversed.v1` | Case/original/result/compensating IDs | Target domain, notice/correction |
| `safety.restriction.changed.v1` | Edge/scope/state/version | Messaging, community, marketplace, search |
| `safety.signal.recorded.v1` | Signal/action-or-object/reasons/version/expiry | Authorized risk router only |
| `safety.dispute.changed.v1` | Case/transaction/state/remedy/deadline/version | Commerce/payment adapters, party projector |
| `safety.dmca.changed.v1` | Notice/asset/state/strike/restoration deadlines | Asset availability, ledger, notice |
| `safety.evidence.sealed.v1` | Bundle/entry/class/source/hash/status | Case projector, retention/hold |
| `safety.legal-disclosure.decided.v1` | Request/decision/prohibition/release hash | Legal audit, permitted notification |
| `safety.risk-assessment.decided.v1` | Domain/release/disposition/gap/control hashes | Shard 05 launch gate, audit |

Events exclude narratives, raw evidence, legal documents, reporter identity, private messages, protected traits and unrestricted PII. Consumers fetch authorized projections by opaque ID.

## Edge Cases

| Case | Required result |
|---|---|
| Double-submit/offline replay | Same case for same idempotency hash; differing payload conflicts. |
| Report brigading | Admit all; deprioritize reporter excess; target volume never blocks or establishes priority. |
| Target edited/deleted | Intake snapshot remains; target tombstones without erasing evidence. |
| Reviewer lease expires | Stale proposal rejected; draft preserved; original deadline retained. |
| Solo high-impact control | Concurrence remains scale-gated; compensating controls/reaffirmation apply with S0/S1 urgency exception. |
| Classifier/matcher outage | Ordinary unscored flow; no removal/notice fabricated. |
| Conflicted entity case | Recuse/escalate; unresolved actor/mandate blocks collective sanction. |
| SoR/audit write fails | Enforcement rolls back; external transparency delivery may retry. |
| Restriction partially propagates | Deny-first source effective; retry and alert; stale surfaces must not expose content. |
| Capture exhausts retries | Explicit `capture_failed` and warning; no fabricated evidence. |
| Erasure intersects case/hold | Anonymize where allowed; retain only under clock/hold with audited rationale. |
| Urgent after-hours legal request | Logged intake only; no improvised disclosure or 24/7 promise. |
| CSAM provider path unavailable | Unapproved automatic path stays disabled; no false human-review claim or silent report loss. |
| Appeal reverses multi-scope action | Per-item compensating commands; truthful partial restoration; idempotent convergence. |

## Surface Applicability

Responsive web/PWA only. Consumer launch exposes report/flag and required notice/status surfaces; staff uses protected admin workspace. No enterprise SSO, native-only or public case-search dependency.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| TSE-01 Submit safety report | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-02 Submit legal/DMCA notice | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-03 Route and claim case | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-04 Review case | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-05 Apply sanction/takedown | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-06 Concur or reaffirm | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-07 Appeal decision | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-08 Restrict another user | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-09 Evaluate advisory signal | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-10 Open transaction dispute | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-11 Mediate or adjudicate | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-12 Process DMCA counter-notice | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-13 Resolve identity/ownership case | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-14 Handle safety/crisis intake | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-15 Receive legal process | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-16 Capture evidence | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-17 Place/release legal hold | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| TSE-18 Assess domain-launch risk | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [Shard 00](00-infrastructure.md) for request/event/error/audit/recovery; [Shard 01](01-identity-authority.md) for parties, acting context, aliases, organizations, mandates and succession; [Shard 05](05-platform-configuration-admin.md) for capabilities, guarded configuration, tasks, diagnostics, quality gates, retention and kill switches.
- **Depended on by:** Shards 11–16, 25–31, 33, 35–37 and 40 consume restrictions, findings, disputes, evidence references, policy decisions or risk signals. Those shards own transaction truth/capture points; Shard 06 owns case/evidence truth.

## Deep Dives Needed

- [Trust, safety, disputes and evidence deep dive](deep-dives/06-trust-safety.md)

### Cross-Shard Section Contract Map

- **Shard 11 — Community graph:** consume [Shard 11 — Community graph Contracts](11-community-graph.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 11 — Community graph Event Schemas](11-community-graph.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 14 — Services marketplace:** consume [Shard 14 — Services marketplace Contracts](14-services-marketplace.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 14 — Services marketplace Event Schemas](14-services-marketplace.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 25 — Gear market catalog:** consume [Shard 25 — Gear market catalog Contracts](25-gear-market-catalog.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 25 — Gear market catalog Event Schemas](25-gear-market-catalog.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 26 — Gear commerce and fulfilment:** consume [Shard 26 — Gear commerce and fulfilment Contracts](26-gear-commerce-fulfilment.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 26 — Gear commerce and fulfilment Event Schemas](26-gear-commerce-fulfilment.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 27 — Digital catalog and delivery:** consume [Shard 27 — Digital catalog and delivery Contracts](27-digital-catalog-delivery.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 27 — Digital catalog and delivery Event Schemas](27-digital-catalog-delivery.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 28 — Digital licensing and commerce:** consume [Shard 28 — Digital licensing and commerce Contracts](28-digital-licensing-commerce.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 28 — Digital licensing and commerce Event Schemas](28-digital-licensing-commerce.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 30 — Booking and contracts:** consume [Shard 30 — Booking and contracts Contracts](30-booking-contracts.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 30 — Booking and contracts Event Schemas](30-booking-contracts.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 36 — Box office risk:** consume [Shard 36 — Box office risk Contracts](36-box-office-risk.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 36 — Box office risk Event Schemas](36-box-office-risk.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-03 | Reconciled 47 sources; locked case, policy, enforcement, dispute, legal and evidence contracts | /write-architecture-spec | All |

## Dependency References

### Constrains

- [[specs/ia/11-community-graph|Shard 11 — Community graph]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace]]
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear market catalog]]
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear commerce and fulfilment]]
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog and delivery]]
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing and commerce]]
- [[specs/ia/30-booking-contracts|Shard 30 — Booking and contracts]]
- [[specs/ia/36-box-office-risk|Shard 36 — Box office risk]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
