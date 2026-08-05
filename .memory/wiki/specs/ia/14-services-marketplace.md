# Shard 14 — Services marketplace lifecycle

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/14-services-marketplace.md](deep-dives/14-services-marketplace.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 14 owns craft-service listings, exact quotes, requirements-gated engagements, milestones/revisions/change orders, delivery/acceptance, single-payee settlement instructions, multi-party supply composition, rights elections/execution and custodial service evidence. Listing is a template, quote is the offer, accepted quote is scope of record and downstream rights/credit/payment actions use only frozen agreement and artifact data.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 7 |
| In-scope source documents loaded | 46 |
| Child capabilities reconciled | 32 |
| Added or removed feature boundaries | 0 |
| Consumer-launch payment boundary | Single-payee, compliance-cleared engagements only |
| Counsel-gated boundary | Multi-party payout/fixer/bundle atomic distribution remains B3-disabled; records/workflows remain specified |
| Rights boundary | Explicit master/composition posture; no default; Shard 10 owns resulting rights instruments |
| Split handling | Parent IA plus one approved high-complexity deep dive |

## Features

- **05.01 Service Listings & Pricing** — curated craft taxonomy, tier/package/add-on templates, shape-specific pricing, private benchmarks, service mode/SLA and fact-derived capacity/liveness.
- **05.02 Quotes, Scope & Contracting** — immutable expiring quotes, structured terms/diffs, NDA/anonymity and union/session contract facts.
- **05.03 Engagement Lifecycle** — frozen requirements, milestones, revisions/change orders, retainers, cancellation/abandonment and recall.
- **05.04 Delivery, QC & Acceptance** — complete artifact delivery, technical QC, previews and explicit source/session handover.
- **05.05 Multi-Party Supply** — consented deps, fixers, subcontracting and bundle composition, subject to B3 payout gate.
- **05.06 Rights, Warranties & Transfer** — explicit rights postures, points, atomic execution, source/originality and human-performance declarations.
- **05.07 Custodial & Physical Services** — repair/inspection micro-lifecycles and mutual custody/condition evidence.

## Acceptance Criteria

- **AC-SRV-01 — Publish service listing:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Seller chooses immutable craft, tiers, deliverables/exclusions, pricing shape, mode, SLA, capacity and explicit master/composition rights posture, and (6) return Atomic listing version publishes after taxonomy/gate validation; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-02 — Browse/request quote:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Buyer selects actual job inputs; engine renders seller model or quote-required without normalizing models/benchmarks, and (6) return Quote request with buyer/seller/context versions commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-03 — Issue/reissue quote:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Seller freezes ordered price evaluation, exact scope/artifacts/requirements/revisions/rights/kill fee/anonymity/expiry; reissue is new version/diff, and (6) return Issued binding offer version and delivery evidence commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-04 — Accept quote:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Eligible buyer authority confirms full version/material terms; same-human conflict prohibited; acceptance and single-payee payment authorization create one engagement, and (6) return Exactly one engagement references accepted quote; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-05 — Satisfy requirements gate:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Buyer supplies typed complete items or Shard 09 project attachments; observations never verdict; bounded rejection/deadlock, and (6) return Gate passes atomically or exact buyer/deadlock state commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-06 — Start/pause SLA:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Clock starts only after requirements pass, pauses when buyer owes response and records contestable attributed events, and (6) return Absolute due instant/version updates; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-07 — Deliver milestone:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Seller submits complete milestone artifact set; QC/integrity evaluates; accepted milestone releases tranche/credit, not final rights, and (6) return Milestone delivery/acceptance evidence commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-08 — Request revision:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Buyer batches notes within window against exact artifact; allowance decrements on valid redelivery; empty/identical cycles consume nothing, and (6) return Round/note/resolution state commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-09 — Accept change order:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Out-of-scope request becomes priced expiring mini-quote/payment top-up and optional allowance delta, and (6) return Accepted change order versions engagement scope; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-10 — Deliver final work:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Seller publishes complete frozen artifact set plus source/AI/human-performance declarations and payout-readiness result, and (6) return Delivery starts fixed acceptance window; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-11 — Accept/auto-accept:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Eligible non-seller buyer accepts, or window fires after grace; revision timestamp wins ties, and (6) return Payment release + rights execution + credit emission all commit or all rollback; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-12 — Cancel/abandon/release:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized party chooses distinct exit; settlement derives consumed capacity/work, fault, quote kill schedule and rights disposition, and (6) return Four-leg settlement instruction and terminal state commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-13 — Open recall:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Post-terminal bounded support request preserves closure, released payment and transferred rights, and (6) return Recall count/window/task state commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-14 — Substitute supplier:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Buyer explicitly approves eligible dep/subcontractor where identity-based; actual worker receives credit; race respects first delivery/approval, and (6) return Substitution/engagement/credit facts update; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-15 — Compose fixer/bundle:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Buyer sees N+1 engagements/stages, counterparties, title chain and payout plan; B3 gate controls multi-payee activation, and (6) return Composition record or counsel-gate denial; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-16 — Execute rights posture:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Final acceptance applies frozen master/composition elections against Shard 10 aggregate allocation; no live reinterpretation, and (6) return Rights instruments/title events and credit claim commit atomically; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-17 — Run repair service:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Custody intake condition → assessment/estimate → approval/payment authorization → work → mutual return condition, and (6) return Repair job/custody chain/condition evidence commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-18 — Complete inspection:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Independent inspector submits structured template and is paid for report delivery regardless outcome, and (6) return Immutable report/conflict check/payment instruction commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SRV-19 — Record damage claim:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Party compares mutual handoff conditions against approved estimate and declared value; Shard 06 dispute path handles contest, and (6) return Claim/evidence case link without insurance promise; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| SRV-01 | Publish service listing | Seller chooses immutable craft, tiers, deliverables/exclusions, pricing shape, mode, SLA, capacity and explicit master/composition rights posture. | Atomic listing version publishes after taxonomy/gate validation. |
| SRV-02 | Browse/request quote | Buyer selects actual job inputs; engine renders seller model or quote-required without normalizing models/benchmarks. | Quote request with buyer/seller/context versions commits. |
| SRV-03 | Issue/reissue quote | Seller freezes ordered price evaluation, exact scope/artifacts/requirements/revisions/rights/kill fee/anonymity/expiry; reissue is new version/diff. | Issued binding offer version and delivery evidence commit. |
| SRV-04 | Accept quote | Eligible buyer authority confirms full version/material terms; same-human conflict prohibited; acceptance and single-payee payment authorization create one engagement. | Exactly one engagement references accepted quote. |
| SRV-05 | Satisfy requirements gate | Buyer supplies typed complete items or Shard 09 project attachments; observations never verdict; bounded rejection/deadlock. | Gate passes atomically or exact buyer/deadlock state commits. |
| SRV-06 | Start/pause SLA | Clock starts only after requirements pass, pauses when buyer owes response and records contestable attributed events. | Absolute due instant/version updates. |
| SRV-07 | Deliver milestone | Seller submits complete milestone artifact set; QC/integrity evaluates; accepted milestone releases tranche/credit, not final rights. | Milestone delivery/acceptance evidence commits. |
| SRV-08 | Request revision | Buyer batches notes within window against exact artifact; allowance decrements on valid redelivery; empty/identical cycles consume nothing. | Round/note/resolution state commits. |
| SRV-09 | Accept change order | Out-of-scope request becomes priced expiring mini-quote/payment top-up and optional allowance delta. | Accepted change order versions engagement scope. |
| SRV-10 | Deliver final work | Seller publishes complete frozen artifact set plus source/AI/human-performance declarations and payout-readiness result. | Delivery starts fixed acceptance window. |
| SRV-11 | Accept/auto-accept | Eligible non-seller buyer accepts, or window fires after grace; revision timestamp wins ties. | Payment release + rights execution + credit emission all commit or all rollback. |
| SRV-12 | Cancel/abandon/release | Authorized party chooses distinct exit; settlement derives consumed capacity/work, fault, quote kill schedule and rights disposition. | Four-leg settlement instruction and terminal state commit. |
| SRV-13 | Open recall | Post-terminal bounded support request preserves closure, released payment and transferred rights. | Recall count/window/task state commits. |
| SRV-14 | Substitute supplier | Buyer explicitly approves eligible dep/subcontractor where identity-based; actual worker receives credit; race respects first delivery/approval. | Substitution/engagement/credit facts update. |
| SRV-15 | Compose fixer/bundle | Buyer sees N+1 engagements/stages, counterparties, title chain and payout plan; B3 gate controls multi-payee activation. | Composition record or counsel-gate denial. |
| SRV-16 | Execute rights posture | Final acceptance applies frozen master/composition elections against Shard 10 aggregate allocation; no live reinterpretation. | Rights instruments/title events and credit claim commit atomically. |
| SRV-17 | Run repair service | Custody intake condition → assessment/estimate → approval/payment authorization → work → mutual return condition. | Repair job/custody chain/condition evidence commits. |
| SRV-18 | Complete inspection | Independent inspector submits structured template and is paid for report delivery regardless outcome. | Immutable report/conflict check/payment instruction commits. |
| SRV-19 | Record damage claim | Party compares mutual handoff conditions against approved estimate and declared value; Shard 06 dispute path handles contest. | Claim/evidence case link without insurance promise. |

### Global Interaction Rules

- Commands carry `actor_person_id`, `acting_party_id`, `acting_context_version`, `idempotency_key`, `expected_version?`, `request_id` and quote/engagement version.
- Listing edits never change issued quotes; quote acceptance freezes scope, requirements, artifacts, revision allowance, rights, kill schedule and payout basis.
- Craft service excludes time/space rental and teaching; taxonomy maps to Shard 07 roles but never extends them.
- Money, rights and credits are separate transaction legs with explicit all-or-none coordination at acceptance milestones named by contract.
- Platform describes evidence/terms and computes arithmetic; it never promises artistic quality, leak prevention, insurance, legal effectiveness or union enforcement.
- Known under-18 professional transactions require verified guardian co-signatory; otherwise blocked under launch age policy.

## Contracts

### Core Types and Errors

| Contract | Definition |
|---|---|
| `PricingShape` | `flat | per_unit | hourly | day_halfday | tiered_volume | minimum_plus | points | hybrid` |
| `AnonymityLevel` | `open | delayed | aliased | sealed` |
| `EngagementState` | `requirements | active | buyer_wait | seller_work | delivered | revision | accepted | auto_accepted | cancelled | abandoned | mutually_released | closed` |
| `RightsPosture` | Closed master and composition vocabularies; `creates_none` explicit; no default/free text |
| `ExitKind` | `buyer_cancel | seller_cancel | abandonment | mutual_release` |
| `StandardError` | `VALIDATION_FAILED, FORBIDDEN, ACTING_CONTEXT_STALE, VERSION_CONFLICT, IDEMPOTENCY_MISMATCH, LISTING_GATE_FAILED, QUOTE_EXPIRED, SELF_ACCEPTANCE_FORBIDDEN, PAYMENT_AUTH_FAILED, REQUIREMENTS_INCOMPLETE, QC_FAILED, DELIVERY_INCOMPLETE, REVISION_RACE, RIGHTS_EXECUTION_FAILED, CREDIT_EMISSION_FAILED, COUNSEL_GATE_DISABLED` |

### Listings and Quotes

| Contract | Invariant |
|---|---|
| `PublishListing` | Exactly one primary craft, curated facets, legal pricing model/minimum/currency/tax, structured exclusions/add-ons and both rights postures. Craft immutable live. |
| `EvaluatePrice` | Ordered tier/add-on/volume/rounding arithmetic; same contract currency; indicative buyer conversion timestamped; cash/rights never summed. |
| `IssueQuote` | Immutable version, mandatory expiry, normative carried terms and structured fields only. Superseded version void; listing/rate/capacity changes do not. |
| `AcceptQuote` | Exact version and material acknowledgements; compare-and-set; payment authorization + engagement creation atomic. Same human cannot represent both sides alone. |
| `SetAnonymity` | Upstream NDA, priced level, delayed backstop; failures preserve more restrictive state. Sealed suppresses public credit but records it. |

### Engagement and Delivery

| Contract | Invariant |
|---|---|
| `PassRequirements` | Frozen typed checklist, all-or-nothing completeness. Three rejection rounds then no-fault deadlock/full return/no kill fee. |
| `RecordMilestone` | Quote-declared sequential default, tranche/allowance. Acceptance releases tranche and emits stage credit; rights absent until final. |
| `OpenRevision` | ≥1 note, bounded count/time, note window, exact artifact anchor; allowance decrements at valid redelivery. |
| `AcceptChangeOrder` | Mini-quote with expiry/payment delta/scope/allowance delta default zero. Pending CO does not pause auto-accept. |
| `PublishDelivery` | Complete frozen artifact set plus declarations; QC failure is not delivery. No partial delivery outside milestones. |
| `AcceptDelivery` | Explicit/auto states distinct; fixed 3-business-day to 30-calendar-day window; revision within deadline+120s wins. |
| `ExecuteAcceptance` | Payment release + rights execution + credit emission atomic with retries then rollback/page. |

### Exit, Supply and Custody

| Contract | Invariant |
|---|---|
| `ComputeExitSettlement` | Four named legs: consumed fee/kill, refund, expenses 100% zero-take, rights disposition. Liability cap defaults engagement value. |
| `RecordAbandonment` | Timeout starts from awaited act, reset only by that act; one consented extension; automatic result uses kill schedule, never full amount. |
| `ApproveSubstitution` | Buyer consent where identity-based; actual performer credited; seller fault if refused/failed. |
| `ComposeSupply` | Each worker/stage is engagement/credit. Multi-payee release requires B3 counsel/payment capability. |
| `RecordCustodyHandoff` | Mutual timestamped condition, custodian transfer, declared value and approved change scope; fee escrow never covers item value. |

## Data Models

| Model | Key relationships and constraints |
|---|---|
| `service_listing` / `listing_version` | Seller party, primary craft, facets, tiers/add-ons, mode/SLA/capacity, rights postures, state/version. |
| `pricing_model_version` | Shape, required inputs, minimum, currency/tax, rounding, breaks/overtime, effective state. |
| `quote_request` / `quote_version` | Parties/context, ordered scope/price/requirements/artifacts/revisions/rights/exit/anonymity/expiry and supersession. |
| `quote_acknowledgement` | Buyer authority, exact quote/material term, method/time/evidence. |
| `engagement` | Accepted quote, buyer/seller parties, state, contract currency, due/payment/rights/credit coordination versions. |
| `requirement_item` / `requirement_submission` | Frozen type/check, source method, value/blob/project ref, state/rejections/observations. |
| `sla_clock_event` | Engagement, start/pause/resume/due, actor/cause/contested state. |
| `milestone` / `milestone_delivery` | Order, tranche, artifact set, allowance, delivery/acceptance/version. |
| `revision_round` / `revision_note` | Artifact, window/freeze, allowance state, note anchor/resolution, redelivery. |
| `change_order` | Engagement, scope/price/expiry/allowance delta, acceptance/payment state. |
| `delivery` / `delivery_artifact` | Frozen set, blobs/digests/QC/declarations, payout readiness, state/window/version. |
| `acceptance` | Delivery, kind, accepter authority, received/fired time, atomic leg statuses/evidence. |
| `exit_settlement` | Exit kind/fault, consumed work/capacity, four leg amounts/bases, rights disposition, state. |
| `recall` | Engagement, support kind, count/window, state/outcome. |
| `substitution` / `supply_composition` | Original/actual parties, consent, stages/engagements/title chain/payout gate. |
| `rights_election` / `rights_execution` | Quote/engagement, master/composition posture/facts/triggers, Shard 10 instrument IDs/state. |
| `performance_declaration` / `source_warranty` | Delivery/version, author, human/AI/source state, evidence, supersession. |
| `custody_handoff` / `condition_record` | Item/custodian/from/to, mutual condition/media/time/value/estimate scope. |
| `inspection_report` / `damage_claim` | Template/result/conflict/payment and custody evidence/case link. |
| `service_audit_event` | Immutable actor/context/action/target/before-after/evidence/request hashes. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`service_listing`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Seller party, primary craft, facets, tiers/add-ons, mode/SLA/capacity, rights postures, state/version..
- **`listing_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Seller party, primary craft, facets, tiers/add-ons, mode/SLA/capacity, rights postures, state/version..
- **`pricing_model_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Shape, required inputs, minimum, currency/tax, rounding, breaks/overtime, effective state..
- **`quote_request`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Parties/context, ordered scope/price/requirements/artifacts/revisions/rights/exit/anonymity/expiry and supersession..
- **`quote_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Parties/context, ordered scope/price/requirements/artifacts/revisions/rights/exit/anonymity/expiry and supersession..
- **`quote_acknowledgement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Buyer authority, exact quote/material term, method/time/evidence..
- **`engagement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Accepted quote, buyer/seller parties, state, contract currency, due/payment/rights/credit coordination versions..
- **`requirement_item`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Frozen type/check, source method, value/blob/project ref, state/rejections/observations..
- **`requirement_submission`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Frozen type/check, source method, value/blob/project ref, state/rejections/observations..
- **`sla_clock_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Engagement, start/pause/resume/due, actor/cause/contested state..
- **`milestone`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Order, tranche, artifact set, allowance, delivery/acceptance/version..
- **`milestone_delivery`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Order, tranche, artifact set, allowance, delivery/acceptance/version..
- **`revision_round`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Artifact, window/freeze, allowance state, note anchor/resolution, redelivery..
- **`revision_note`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Artifact, window/freeze, allowance state, note anchor/resolution, redelivery..
- **`change_order`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Engagement, scope/price/expiry/allowance delta, acceptance/payment state..
- **`delivery`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Frozen set, blobs/digests/QC/declarations, payout readiness, state/window/version..
- **`delivery_artifact`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Frozen set, blobs/digests/QC/declarations, payout readiness, state/window/version..
- **`acceptance`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Delivery, kind, accepter authority, received/fired time, atomic leg statuses/evidence..
- **`exit_settlement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Exit kind/fault, consumed work/capacity, four leg amounts/bases, rights disposition, state..
- **`recall`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Engagement, support kind, count/window, state/outcome..
- **`substitution`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Original/actual parties, consent, stages/engagements/title chain/payout gate..
- **`supply_composition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Original/actual parties, consent, stages/engagements/title chain/payout gate..
- **`rights_election`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Quote/engagement, master/composition posture/facts/triggers, Shard 10 instrument IDs/state..
- **`rights_execution`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Quote/engagement, master/composition posture/facts/triggers, Shard 10 instrument IDs/state..
- **`performance_declaration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Delivery/version, author, human/AI/source state, evidence, supersession..
- **`source_warranty`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Delivery/version, author, human/AI/source state, evidence, supersession..
- **`custody_handoff`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Item/custodian/from/to, mutual condition/media/time/value/estimate scope..
- **`condition_record`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Item/custodian/from/to, mutual condition/media/time/value/estimate scope..
- **`inspection_report`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Template/result/conflict/payment and custody evidence/case link..
- **`damage_claim`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Template/result/conflict/payment and custody evidence/case link..
- **`service_audit_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable actor/context/action/target/before-after/evidence/request hashes..

## Access Control

| Actor | Permitted | Explicitly denied |
|---|---|---|
| Seller | Listings/quotes/requirements review/work/delivery under acting authority | Self-accept, silently reprice, hand rights/credit to agency instead of worker |
| Buyer/eligible approver | Quote/material acknowledgements, requirements, revision/change-order, acceptance/exit | Act through same human on both sides, accept incomplete delta or mutate seller listing |
| Contributor/subcontractor | Scoped actual-work requirements/delivery/credit facts | See unrelated commercial terms or bind buyer absent mandate |
| Fixer/agency | Coordinate authorized engagements/roster and disclosed commission | Receive worker credit, infer agency mandate or activate multi-payee B3 path |
| Inspector/custodian | Assigned template/custody/condition records | Warranty/insurance claim or unrelated item/account access |
| Moderator/dispute reviewer | Case-scoped listing/engagement/evidence actions | Artistic-quality ruling, force-publish or change contract terms |
| System worker | Idempotent gate/clock/QC/acceptance/settlement/rights-credit coordination | Creative judgment, AI detection, legal-effect assertion or money custody outside provider |

### Access Escalation

- **Seller:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Buyer/eligible approver:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Contributor/subcontractor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Fixer/agency:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Inspector/custodian:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator/dispute reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Listing/quote forms explain pricing shape arithmetic, tax, rights posture and exclusions in semantic summaries before publish/accept.
- Quote diffs supplement, never replace, full accepted document; material acknowledgements are separate unchecked controls.
- Requirements, milestones, revisions and delivery expose ordered status/timers with absolute dates, actor and contest route.
- Waveform/media notes have linear keyboard alternatives; QC distinguishes measurement, consequence, warning/failure/unverifiable.
- Acceptance/auto-accept countdown and 120-second revision grace are screen-reader announced with timezone.
- Custody/condition comparison provides structured checklist and accessible media alternatives; insurance limitation appears before declaration.

## Event Schemas

| Event | Payload minimum | Consumers |
|---|---|---|
| `service.listing.changed.v1` | Listing/seller/craft/state/version | Browse/search/benchmarks |
| `service.quote.changed.v1` | Quote/request/parties/state/expiry/version/hash | Buyer/seller projectors |
| `service.engagement.changed.v1` | Engagement/parties/state/due/payment gate/version | Parties/tasks/downstream facts |
| `service.requirements.changed.v1` | Engagement/item/state/rejection/deadlock/version | Gate/clock/notifications |
| `service.delivery.changed.v1` | Delivery/engagement/state/window/QC/artifact hash/version | Acceptance/revision/payout readiness |
| `service.acceptance.committed.v1` | Acceptance/delivery/kind/payment/rights/credit evidence IDs | Parties, Shards 07/10, payment adapter |
| `service.exit-settlement.changed.v1` | Engagement/exit/fault/leg hashes/state/version | Payment/dispute/reputation |
| `service.substitution.changed.v1` | Engagement/original/actual/state/consent/version | Buyer, credit/project coordinators |
| `service.custody.changed.v1` | Job/item/handoff/state/condition hash/version | Parties, Shard 23/26, disputes |

Events exclude quote free text, private rates/benchmarks, files, media, NDA terms, condition photos, signatures, payment credentials and unrestricted PII.

## Edge Cases

| Case | Required result |
|---|---|
| Listing changes after quote | Issued quote unchanged and still valid unless closed void condition occurs. |
| Same human controls buyer/seller | Different authorized buyer human required; single-authority entity cannot accept. |
| Payment authorization races quote expiry | Serializable accepted/expired result; at most one engagement. |
| Requirements reject three times | Deadlock, full return, no fault/kill fee; Shard 06 only if contested. |
| Upstream requirement engagement in flight | Suppress nudges/fault while on time; resume if failed/late. |
| Revision/auto-accept race | Valid revision through deadline+120s wins; auto-accept never backdated. |
| QC engine unavailable | Fail open with visible unverifiable flag; watermark engine fails closed to streaming-only. |
| Acceptance atomic leg fails | Retry 2s/8s/32s then rollback all legs and page human. |
| Seller/buyer identity overlaps after engagement | High-consequence action rechecks authority/self-dealing; existing record remains audited. |
| Multi-party payout requested | Record composition but return `COUNSEL_GATE_DISABLED` until B3 activation. |
| Delivery arrives as substitution approved concurrently | Delivery before recorded approval belongs original; after approval actual worker. |
| Custody item damaged | Preserve mutual condition chain; fee escrow never represented as item coverage. |
| Seller cancels | Refund/cover/reputation facts; no reverse kill-fee obligation. |
| Points-only exit | Rights disposition only; no manufactured cash settlement. |

## Surface Applicability

Responsive web/PWA only. Large files use resumable protected uploads/streams. Physical service condition records support mobile camera/file capture without requiring a native app.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| SRV-01 Publish service listing | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-02 Browse/request quote | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-03 Issue/reissue quote | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-04 Accept quote | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-05 Satisfy requirements gate | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-06 Start/pause SLA | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-07 Deliver milestone | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-08 Request revision | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-09 Accept change order | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-10 Deliver final work | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-11 Accept/auto-accept | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-12 Cancel/abandon/release | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-13 Open recall | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-14 Substitute supplier | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-15 Compose fixer/bundle | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-16 Execute rights posture | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-17 Run repair service | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-18 Complete inspection | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SRV-19 Record damage claim | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [Shard 00](00-infrastructure.md) for contracts/storage/queues/payment adapters; [Shard 01](01-identity-authority.md) for parties/authority/guardian/agency; [Shard 06](06-trust-safety.md) for disputes/spec-work/integrity; [Shard 09](09-projects-collaboration.md) for project assets/requirements; [Shard 10](10-rights-ownership.md) for rights instruments/allocation.
- **Depended on by:** Shard 26 consumes repair/inspection/custody services; Shard 41 consumes accepted engagement economics. Neither may bypass quote/acceptance truth.

## Deep Dives Needed

- [Services marketplace lifecycle deep dive](deep-dives/14-services-marketplace.md)

### Cross-Shard Section Contract Map

- **Shard 26 — Gear commerce and fulfilment:** consume [Shard 26 — Gear commerce and fulfilment Contracts](26-gear-commerce-fulfilment.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 26 — Gear commerce and fulfilment Event Schemas](26-gear-commerce-fulfilment.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 41 — Finance and tax operations:** consume [Shard 41 — Finance and tax operations Contracts](41-finance-tax-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 41 — Finance and tax operations Event Schemas](41-finance-tax-operations.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-03 | Reconciled 46 sources; locked listing, quote, engagement, delivery, supply, rights and custody contracts | /write-architecture-spec | All |

## Dependency References

### Constrains

- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear commerce and fulfilment]]
- [[specs/ia/41-finance-tax-operations|Shard 41 — Finance and tax operations]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/26-gear-commerce-fulfilment|Shard 26 — Gear transactions, fulfilment and possession models]]
