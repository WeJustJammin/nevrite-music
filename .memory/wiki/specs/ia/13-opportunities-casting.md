# Shard 13 — Opportunities and casting lifecycle

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/13-opportunities-casting.md](deep-dives/13-opportunities-casting.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 13 owns opportunity publication, targeting, finite discovery, alerts, structured submissions/auditions, conflict-safe review, offers/counters, irreversible dispositions and typed downstream handoff. An opportunity is a terms container with independently fillable slots. It never treats credit as compensation, posting as consent, submission as rights transfer, graph proximity as authority, silence as withdrawal, or a won opportunity as downstream membership/rights truth.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 7 |
| In-scope source documents loaded | 33 |
| Child capabilities reconciled | 24 |
| Added or removed feature boundaries | 0 |
| Consumer launch | Deferred to later opportunity domain activation after identity/graph/moderation and relevant downstream handoff surfaces |
| Legal/safety floors | Applicant fees unrepresentable; compensation gate has no admin override; protected criteria type-scoped; spec-work rights bounded |
| Enterprise features | Deferred; no ATS import, enterprise HR suite, agency CRM or automated candidate scoring |
| Split handling | Parent IA plus one approved high-complexity deep dive |

## Features

- **04.01 Opportunity Posting & Targeting** — immutable curated types, per-slot lifecycle, ordered targeting, compensation/spec-work publication gate and trust-tiered eligibility.
- **04.02 Discovery, Matching & Alerts** — finite explainable board, availability/travel/material fit and strictly bounded user-created alerts.
- **04.03 Submission & Audition** — assembled entity submissions, cited evidence, rights-bounded audition tasks, paperwork-layer blind review and policy-respecting pitches.
- **04.04 Triage, Shortlist & Decisioning** — recoverable triage, disagreement-preserving shortlist, immutable-fuse offers and honest urgent-fill cascades.
- **04.05 Outcome, Response & Handoff** — per-submission close-out obligation, response signals, idempotent typed handoff and private applicant history.
- **04.06 Band & Member Wanted** — specialized membership outcome with 90-day decide-by and no Operator surface.
- **04.07 Open Calls** — festival/showcase/competition calls with explicit decide-by, no submission fees and no Fan voting.

## Acceptance Criteria

- **AC-OPP-01 — Draft opportunity:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Poster chooses explicit acting identity/decider, immutable type, slots, date/location, decide-by, compensation and criteria; context may prefill facts except compensation, and (6) return Draft/container/slot versions persist; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-02 — Publish/re-publish:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Gate validates type schema, compensation six facets, unpaid/spec-work legitimacy, criteria and target policy; no admin force-publish, and (6) return Frozen terms/rule-set version publishes or exact gaps return; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-03 — Edit live terms:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Downward compensation or tighter criteria creates new terms version, re-gates and marks every existing submission `terms_changed` with Stay/Withdraw, and (6) return Applicant notices and terms version commit; silence keeps applicant; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-04 — Configure targeting cascade:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Poster orders invite/trusted-network/qualified-local/broad stages; trusted network uses verified-credit graph, not follows, and (6) return Cascade stages, timing and audience predicates freeze; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-05 — Browse/search board:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Viewer sees finite, exhaustible, fit-first results with one-sentence reasons, declared compensation, freshness and own-party posts excluded, and (6) return Stable session result/cursor and “new” count returned; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-06 — Save alert intent:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) User explicitly creates bounded subscription; no silent intent. Policy computes tier from type/time/context/material evidence and user ceiling, and (6) return Intent/version/delivery budget commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-07 — Assemble submission:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Submitting person/Band chooses exact slot, cites selected evidence, confirms per-date availability and bounded answers; no one-click/bulk/template apply, and (6) return Submission version/claim/evidence refs commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-08 — Complete audition task:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Applicant sees scope, rounds, retention, payment and rights before work; resumable upload; strong evidence may waive task, and (6) return Task attempt/media/evidence state commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-09 — Submit unsolicited pitch:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Eligible professional follows target pitch policy; pitch becomes ordinary target-anchored submission and queue item, and (6) return Submission state with pitch source commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-10 — Triage candidate:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized non-candidate reviewer selects advance/reject/hold; reject disabled on incomplete evidence/queue; hold requires blocker/owner/resolve-by, and (6) return Recoverable vote or irreversible disposition rule applied; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-11 — Shortlist/review:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized reviewers independently assess; disagreement remains visible and is never averaged; shortlist survives until acceptance, and (6) return Review records/shortlist version commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-12 — Issue offer:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Decider supplies exact final terms/delta, compensation gate, fuse, parallel-offer disclosure and target handoff mode, and (6) return Irrevocable active offer version commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-13 — Counter/accept/decline:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Candidate sees full delta; counter is reverse offer; acceptance ordered by platform receipt and atomically checks availability; decline may use structured reason, and (6) return Winning offer/slot transition and downstream outbox commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-14 — Run urgent-fill cascade:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Poster ranks candidates; platform issues bounded-fuse parallel/serial offers honestly; platform confidence never outranks list, and (6) return First accepted by receipt wins; named cascade losses close; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-15 — Disposition applicants:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Winning acceptance closes all remaining submissions for slot; delist/delete never discharges obligation; first disposition is irreversible truth, and (6) return Per-submission disposition/attribution/notice commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-16 — Execute handoff:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Outbox creates/joins/proposes exact downstream target fixed at post time; acceptance remains valid if handoff retries/fails, and (6) return Handoff state/back-references/cast-credit triggers converge; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-17 — Review pipeline history:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Applicant sees own immutable age/state/diffs/onward links and may hide locally; poster sees private owner-scoped pipeline, and (6) return Viewer-specific history projection returned; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-18 — Fill band membership:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Band posts specialized role; accepted candidate transitions through Shard 01 membership/governance, not service engagement, and (6) return Membership proposal/outcome link commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-OPP-19 — Run open call:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Organizer publishes fee-free no-Fan-voting call with explicit decide-by and submission/judging rules, and (6) return Open-call lifecycle uses ordinary slots/submissions/dispositions; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| OPP-01 | Draft opportunity | Poster chooses explicit acting identity/decider, immutable type, slots, date/location, decide-by, compensation and criteria; context may prefill facts except compensation. | Draft/container/slot versions persist. |
| OPP-02 | Publish/re-publish | Gate validates type schema, compensation six facets, unpaid/spec-work legitimacy, criteria and target policy; no admin force-publish. | Frozen terms/rule-set version publishes or exact gaps return. |
| OPP-03 | Edit live terms | Downward compensation or tighter criteria creates new terms version, re-gates and marks every existing submission `terms_changed` with Stay/Withdraw. | Applicant notices and terms version commit; silence keeps applicant. |
| OPP-04 | Configure targeting cascade | Poster orders invite/trusted-network/qualified-local/broad stages; trusted network uses verified-credit graph, not follows. | Cascade stages, timing and audience predicates freeze. |
| OPP-05 | Browse/search board | Viewer sees finite, exhaustible, fit-first results with one-sentence reasons, declared compensation, freshness and own-party posts excluded. | Stable session result/cursor and “new” count returned. |
| OPP-06 | Save alert intent | User explicitly creates bounded subscription; no silent intent. Policy computes tier from type/time/context/material evidence and user ceiling. | Intent/version/delivery budget commits. |
| OPP-07 | Assemble submission | Submitting person/Band chooses exact slot, cites selected evidence, confirms per-date availability and bounded answers; no one-click/bulk/template apply. | Submission version/claim/evidence refs commit. |
| OPP-08 | Complete audition task | Applicant sees scope, rounds, retention, payment and rights before work; resumable upload; strong evidence may waive task. | Task attempt/media/evidence state commits. |
| OPP-09 | Submit unsolicited pitch | Eligible professional follows target pitch policy; pitch becomes ordinary target-anchored submission and queue item. | Submission state with pitch source commits. |
| OPP-10 | Triage candidate | Authorized non-candidate reviewer selects advance/reject/hold; reject disabled on incomplete evidence/queue; hold requires blocker/owner/resolve-by. | Recoverable vote or irreversible disposition rule applied. |
| OPP-11 | Shortlist/review | Authorized reviewers independently assess; disagreement remains visible and is never averaged; shortlist survives until acceptance. | Review records/shortlist version commit. |
| OPP-12 | Issue offer | Decider supplies exact final terms/delta, compensation gate, fuse, parallel-offer disclosure and target handoff mode. | Irrevocable active offer version commits. |
| OPP-13 | Counter/accept/decline | Candidate sees full delta; counter is reverse offer; acceptance ordered by platform receipt and atomically checks availability; decline may use structured reason. | Winning offer/slot transition and downstream outbox commit. |
| OPP-14 | Run urgent-fill cascade | Poster ranks candidates; platform issues bounded-fuse parallel/serial offers honestly; platform confidence never outranks list. | First accepted by receipt wins; named cascade losses close. |
| OPP-15 | Disposition applicants | Winning acceptance closes all remaining submissions for slot; delist/delete never discharges obligation; first disposition is irreversible truth. | Per-submission disposition/attribution/notice commits. |
| OPP-16 | Execute handoff | Outbox creates/joins/proposes exact downstream target fixed at post time; acceptance remains valid if handoff retries/fails. | Handoff state/back-references/cast-credit triggers converge. |
| OPP-17 | Review pipeline history | Applicant sees own immutable age/state/diffs/onward links and may hide locally; poster sees private owner-scoped pipeline. | Viewer-specific history projection returned. |
| OPP-18 | Fill band membership | Band posts specialized role; accepted candidate transitions through Shard 01 membership/governance, not service engagement. | Membership proposal/outcome link commits. |
| OPP-19 | Run open call | Organizer publishes fee-free no-Fan-voting call with explicit decide-by and submission/judging rules. | Open-call lifecycle uses ordinary slots/submissions/dispositions. |

### Global Interaction Rules

- Commands carry `actor_person_id`, `acting_party_id`, `acting_context_version`, `idempotency_key`, `expected_version?`, `request_id` and post/slot/terms version.
- Post/container state derives from slot states. Every submission, offer and disposition is scoped to one slot.
- Acting identity, poster and decider are separate attributed facts. Authority resolves through Shard 01 at each high-consequence action.
- Targeting resolves before matching. Protected-characteristic criteria are unrepresentable for labour-class types and jurisdiction-gated for performance types.
- Applicant calendar conflicts and availability are private; only candidate-confirmed availability state reaches poster.
- Missing evidence/provider/calendar/material signals fail open to submission/matching degradation, never fabricate fit or reject.

## Contracts

### Core Types and Errors

| Contract | Definition |
|---|---|
| `OpportunityType` | Closed/versioned platform taxonomy plus fully specified `general_call` escape; immutable after publish |
| `SlotState` | `draft | open | paused | offer_active | filled | closed | cancelled` |
| `SubmissionState` | `draft | submitted | terms_changed | held | shortlisted | offered | withdrawn | accepted | declined | rejected | dispositioned` |
| `CompensationShape` | `flat_fee | range | hourly | day_rate | points | buyout | unpaid | shared_cost` with shape-specific schema |
| `TriageDecision` | `advance | reject | hold` |
| `HandoffMode` | `create | join | propose | external` fixed at publication |
| `StandardError` | `VALIDATION_FAILED, FORBIDDEN, ACTING_CONTEXT_STALE, VERSION_CONFLICT, IDEMPOTENCY_MISMATCH, PUBLICATION_GATE_FAILED, TYPE_IMMUTABLE, TERMS_CHANGED, ELIGIBILITY_FAILED, REVIEW_CONFLICT, EVIDENCE_INCOMPLETE, OFFER_EXPIRED, SLOT_ALREADY_FILLED, DISPOSITION_EXISTS, HANDOFF_FAILED` |

### Publication, Discovery and Alerts

| Contract | Invariant |
|---|---|
| `PublishOpportunity` | Type/acting identity/decider/date semantics/decide-by/slots/compensation/criteria required per type; gate rule version pinned. |
| `ValidateCompensation` | Shape, amount/basis, unit, currency, expenses and timing mandatory. Credit never compensation; applicant fees absent; unbounded negotiable invalid. |
| `ValidateSpecWork` | Unpaid deliverable limited to one evaluation-only round, no use rights, return/destroy on non-selection; additional rounds require paid trial. |
| `ChangeTerms` | New frozen version; re-gate; applicant diff/Stay/Withdraw. Existing silent applicants remain; new applicants use new criteria. |
| `ProjectBoard` | Viewer-safe structured fields, fit-primary/recency tie-break, finite pages, session-stable rank, tombstone/freshness. Own acting parties excluded. |
| `DeliverAlert` | User-created intent only; max two alerts per user/post; copy contains recipient facts only and no cascade position. |

### Submission, Review and Offer

| Contract | Invariant |
|---|---|
| `SubmitApplication` | Unique active submission per submitting entity/post/slot; resubmission supersedes. Evidence refs, not copied CV; partial availability valid. |
| `CreateAuditionTask` | Scope/rounds/retention/payment/rights validated by same spec-work gate; blind mode removes paperwork fields only. |
| `TriageSubmission` | Candidate/reviewer mutually exclusive. Reject unavailable when evidence/criteria/media/queue incomplete. Hold has closed blocker, owner and bounded date. |
| `BulkTriage` | Only criterion-scoped against criterion live at submit; no “reject remaining”; count/criterion explicit in confirmation/disposition. |
| `IssueOffer` | Final terms and all deltas explicit; compensation re-gated; fuse irrevocable except named external cause. |
| `AcceptOffer` | Compare-and-set active offer/slot; server receipt orders race; acceptance durable before downstream handoff. |
| `RecordDisposition` | One irreversible disposition per submission/slot; obligation starts at submit and survives delist/delete. |

### Handoff and Reputation

| Contract | Invariant |
|---|---|
| `ExecuteHandoff` | Mode/target fixed at publication. Idempotent create/join/propose writes operational facts only; cannot create authority/rights without downstream consent. |
| `ReverseWin` | Creates successor opportunity; never reopens accepted offer or inverts downstream actions. |
| `ProjectResponseSignal` | Open obligations primary; rate/speed secondary; suppressed below sample floor; measures responsiveness only. |
| `ProjectApplicantHistory` | Owner/applicant scoped; immutable entries survive post deletion; hide is viewer-local, not deletion. |

## Data Models

| Model | Key relationships and constraints |
|---|---|
| `opportunity` | Acting party, poster, decider authority ref, type/version, context ref, lifecycle/version. |
| `opportunity_slot` | Opportunity, role/taxonomy, count/index, state, decide-by, target handoff mode/ref, version. |
| `opportunity_terms_version` | Type/date/location/criteria/compensation/spec-work/rights/targeting hashes, rule set, supersedes, published-at. |
| `compensation_spec` | Shape and six mandatory facets, buyout/AI scopes, shared-cost recipient/timing, state. |
| `eligibility_criterion` | Trust tier, required/preferred, casting class/jurisdiction, source slot and version. |
| `targeting_stage` | Terms version, order, audience predicate, starts/ends/escalation and notification policy. |
| `opportunity_board_document` | Safe structured listing, freshness/tombstone, fit features/source versions. |
| `alert_intent` / `alert_delivery` | User/query/type preferences, tier ceiling, expiry and per-user/post lifetime deliveries. |
| `submission` | Entity, post/slot/terms, source/pitch, state, current version, submitted/withdrawn times. |
| `submission_version` | Structured answers, evidence refs, availability confirmations, counter fields and content hash. |
| `audition_task` / `audition_attempt` | Scope/rounds/payment/rights/retention and resumable media state. |
| `review_assignment` / `triage_vote` | Reviewer authority/conflict, decision, blocker/owner/resolve-by and evidence snapshot. |
| `shortlist` / `shortlist_review` | Slot, candidates, reviewer/rubric outcomes, disagreement and attribution policy. |
| `offer` | Submission/slot, terms/delta, issuer, fuse, parallel count, state/version and external end cause. |
| `offer_response` | Offer, responder entity, accept/counter/decline, receipt sequence, structured reason and version. |
| `submission_disposition` | Submission/slot, acting identity, code/criterion, committed-at, notice state; unique. |
| `handoff` | Acceptance, mode/target, source fact manifest, downstream IDs, retry/state/back-reference. |
| `response_signal` | Acting party, obligation counts/rate/speed/sample eligibility/source window. |
| `opportunity_audit_event` | Immutable actor/context/action/target/before-after/evidence/request hashes. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`opportunity`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Acting party, poster, decider authority ref, type/version, context ref, lifecycle/version..
- **`opportunity_slot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Opportunity, role/taxonomy, count/index, state, decide-by, target handoff mode/ref, version..
- **`opportunity_terms_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Type/date/location/criteria/compensation/spec-work/rights/targeting hashes, rule set, supersedes, published-at..
- **`compensation_spec`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Shape and six mandatory facets, buyout/AI scopes, shared-cost recipient/timing, state..
- **`eligibility_criterion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Trust tier, required/preferred, casting class/jurisdiction, source slot and version..
- **`targeting_stage`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Terms version, order, audience predicate, starts/ends/escalation and notification policy..
- **`opportunity_board_document`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Safe structured listing, freshness/tombstone, fit features/source versions..
- **`alert_intent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: User/query/type preferences, tier ceiling, expiry and per-user/post lifetime deliveries..
- **`alert_delivery`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: User/query/type preferences, tier ceiling, expiry and per-user/post lifetime deliveries..
- **`submission`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Entity, post/slot/terms, source/pitch, state, current version, submitted/withdrawn times..
- **`submission_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Structured answers, evidence refs, availability confirmations, counter fields and content hash..
- **`audition_task`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scope/rounds/payment/rights/retention and resumable media state..
- **`audition_attempt`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scope/rounds/payment/rights/retention and resumable media state..
- **`review_assignment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Reviewer authority/conflict, decision, blocker/owner/resolve-by and evidence snapshot..
- **`triage_vote`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Reviewer authority/conflict, decision, blocker/owner/resolve-by and evidence snapshot..
- **`shortlist`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Slot, candidates, reviewer/rubric outcomes, disagreement and attribution policy..
- **`shortlist_review`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Slot, candidates, reviewer/rubric outcomes, disagreement and attribution policy..
- **`offer`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Submission/slot, terms/delta, issuer, fuse, parallel count, state/version and external end cause..
- **`offer_response`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Offer, responder entity, accept/counter/decline, receipt sequence, structured reason and version..
- **`submission_disposition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Submission/slot, acting identity, code/criterion, committed-at, notice state; unique..
- **`handoff`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Acceptance, mode/target, source fact manifest, downstream IDs, retry/state/back-reference..
- **`response_signal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Acting party, obligation counts/rate/speed/sample eligibility/source window..
- **`opportunity_audit_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable actor/context/action/target/before-after/evidence/request hashes..

## Access Control

| Actor | Permitted | Explicitly denied |
|---|---|---|
| Poster | Draft/post administration under acting authority | Silent acting-identity default, force-publish or candidate-side decisions without grant |
| Decider/reviewer | Assigned slot triage/shortlist/offer under Shard 01 activity+domain authority | Review own candidacy, inspect hidden calendar conflicts or bypass gate |
| Applicant entity | Own submission/audition/offer/history and pre-offer withdrawal | Queue position, other candidates/reviews, self-disposition or bulk apply |
| Band representative | Apply/post for Band under mandate; membership handoff where authorized | Infer member consent or act as personal applicant silently |
| Fan | Public/logged-out safe board where allowed | Apply, pitch, review, vote or see professional compensation projection |
| Moderator | Case-scoped post/submission/media enforcement | Candidate scoring, hiring decision or compensation override |
| System worker | Idempotent gate/rank/alert/expiry/disposition/handoff operations | Infer compensation, auto-create alerts, auto-reject or create authority/rights |

### Access Escalation

- **Poster:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Decider/reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Applicant entity:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Band representative:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Fan:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Composer exposes acting identity, immutable type, compensation facets and criteria trust as semantic grouped controls with persistent validation.
- Board is finite with keyboard pagination, one-sentence match reasons, freshness and explicit “N new” control; no infinite-scroll dependence.
- Terms-change comparison and offer delta use accessible before/after tables; accept remains disabled when delta unavailable while decline stays usable.
- Submission assembler supports saved draft/resumable media without one-click pressure; blind-review state explains limits.
- Triage cards expose loaded/incomplete state; irreversible reject/disposition cannot receive focus/action until prerequisites load.
- Timers show absolute deadline plus remaining fuse; platform-receipt ordering and parallel-offer disclosure are announced before acceptance.

## Event Schemas

| Event | Payload minimum | Consumers |
|---|---|---|
| `opportunity.post.changed.v1` | Post/type/acting party/terms/state/version | Board/search/targeting |
| `opportunity.slot.changed.v1` | Slot/post/role/state/decide-by/version | Board, submissions, disposition coordinator |
| `opportunity.terms.changed.v1` | Post/old/new/delta/gate/version | Applicants, board, alerts |
| `opportunity.submission.changed.v1` | Submission/entity/slot/terms/state/version | Applicant/owner/review projectors |
| `opportunity.review.changed.v1` | Assignment/submission/decision-or-blocker/state/version | Authorized shortlist/triage only |
| `opportunity.offer.changed.v1` | Offer/submission/slot/state/fuse/parallel count/version | Candidate, acceptance arbiter |
| `opportunity.disposition.recorded.v1` | Submission/slot/code/acting party/notice/version | Applicant history, response signal |
| `opportunity.handoff.changed.v1` | Handoff/acceptance/mode/target/state/downstream IDs/version | Owner/winner and downstream retry |
| `opportunity.response-signal.changed.v1` | Acting party/window/sample state/metrics/version | Safe board reputation projection |

Events exclude free-text answers, media, private criteria documents, reviewer scores/notes, calendar conflicts, queue position, counterparty PII and unrestricted compensation where public projection forbids it.

## Edge Cases

| Case | Required result |
|---|---|
| Type change requested after publish | Reject unconditionally; clone/new post path offered. |
| Compensation decreases live | Re-gate, notify every applicant with delta, mark terms-changed; no silent withdrawal. |
| Rules change after publish | Live post remains on pinned rule set; re-publish uses current gate. |
| Matching source unavailable | Keep reachable candidate/post with degraded explanation; no false mismatch/reject. |
| Applicant submits concurrently twice | Same entity/post/slot supersedes or idempotently returns current; no duplicate candidate card. |
| Reviewer is candidate | Automatic exclusion overrides all grants; no queue existence/details exposed. |
| Queue/evidence partially loads | Reject disabled; advance/hold remain recoverable where safe. |
| Two offer acceptances race | First server receipt atomically fills slot; loser receives named cascade/filled outcome. |
| Handoff fails after acceptance | Acceptance remains; idempotent retry/escalation, never rollback. |
| Post deleted with open applicants | Delist only; submissions/obligations/history persist until disposition. |
| Offer candidate withdraws | Live offer requires decline; pre-offer alone permits withdrawal. |
| Downstream target absent | Close as won and provide external handoff artifact; no fabricated project/membership. |
| Band win has unresolved cast | Handoff carries unresolved-cast state; no member fan-out. |
| Board cache older than 60 minutes | Stamp age and remove fit claims; never blank/spinner. |

## Surface Applicability

Responsive web/PWA only. Public/logged-out board uses Fan-safe projection without professional compensation. Alerts follow platform consent/delivery contracts and are pointers to current terms, not copied truth.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| OPP-01 Draft opportunity | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-02 Publish/re-publish | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-03 Edit live terms | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-04 Configure targeting cascade | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-05 Browse/search board | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-06 Save alert intent | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-07 Assemble submission | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-08 Complete audition task | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-09 Submit unsolicited pitch | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-10 Triage candidate | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-11 Shortlist/review | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-12 Issue offer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-13 Counter/accept/decline | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-14 Run urgent-fill cascade | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-15 Disposition applicants | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-16 Execute handoff | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-17 Review pipeline history | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-18 Fill band membership | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| OPP-19 Run open call | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [Shard 00](00-infrastructure.md) for request/event/search/alerts/uploads; [Shard 01](01-identity-authority.md) for acting parties/decider/reviewer/membership authority; [Shard 06](06-trust-safety.md) for report/spec-work enforcement; [Shard 11](11-community-graph.md) for trusted-network/reachability evidence.
- **Depended on by:** None in current decomposition; handoffs target Shards 09/10/14/30 or external tools through typed commands without table coupling.

## Deep Dives Needed

- [Opportunities and casting lifecycle deep dive](deep-dives/13-opportunities-casting.md)

### Cross-Shard Section Contract Map

- **Shard 00 — Cross-cutting platform foundation:** consume [Shard 00 — Cross-cutting platform foundation Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 — Cross-cutting platform foundation Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01 — Identity authority and party governance:** consume [Shard 01 — Identity authority and party governance Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 — Identity authority and party governance Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 06 — Trust, safety, disputes and evidence:** consume [Shard 06 — Trust, safety, disputes and evidence Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 — Trust, safety, disputes and evidence Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 09 — Music projects and collaboration:** consume [Shard 09 — Music projects and collaboration Contracts](09-projects-collaboration.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 09 — Music projects and collaboration Event Schemas](09-projects-collaboration.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 10 — Rights and ownership:** consume [Shard 10 — Rights and ownership Contracts](10-rights-ownership.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 10 — Rights and ownership Event Schemas](10-rights-ownership.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 11 — Social graph and collaborator network:** consume [Shard 11 — Social graph and collaborator network Contracts](11-community-graph.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 11 — Social graph and collaborator network Event Schemas](11-community-graph.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 14 — Services marketplace:** consume [Shard 14 — Services marketplace Contracts](14-services-marketplace.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 14 — Services marketplace Event Schemas](14-services-marketplace.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 30 — Booking and contracts:** consume [Shard 30 — Booking and contracts Contracts](30-booking-contracts.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 30 — Booking and contracts Event Schemas](30-booking-contracts.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-03 | Reconciled 33 sources; locked posting, discovery, submission, decision, offer, disposition and handoff contracts | /write-architecture-spec | All |

## Dependency References

- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace]]
- [[specs/ia/30-booking-contracts|Shard 30 — Booking and contracts]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
