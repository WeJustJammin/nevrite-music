# Shard 10 — Rights and ownership

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/10-rights-ownership.md](deep-dives/10-rights-ownership.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 10 owns asserted/consented ownership records for works and recordings, split capture, transfers and encumbrances, chain of title, rights conflicts, consent for AI/voice/likeness uses, identifiers and publication-safe evidence. It records evidence and agreement; it does not turn credits into ownership, adjudicate legal merits, promise clearance, hold funds, collect royalties, register automatically or provide legal advice.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 6 |
| In-scope source documents loaded | 38 |
| Child capabilities reconciled | 26 |
| Added or removed feature boundaries | 0 |
| Consumer launch | Work/recording duality, exact-rational ledger/split capture, immutable consent/amendment, title evidence, conflict state and signed export |
| Counsel/provider gates | Multi-party payout, escrow custody, registration filing, identifier registrant operations and automatic legal actions remain separately gated |
| Territory baseline | Ownership draft defaults to World; term/moral-right informational status supports US/FR/DE/GB only where inputs/sources permit |
| Split handling | Parent IA plus one approved high-complexity deep dive |

## Features

- **09.01 Rights Registry** — work/recording duality, exact-rational ownership ledgers, master control/encumbrances, publishing structures, performer facts and sample provenance.
- **09.02 Split Capture & Agreements** — creation-time split proposals, producer points, work-for-hire/buyout designation and superseding re-consent.
- **09.03 Chain of Title & Rights Lifecycle** — attributed title events, term/territory/reversion, termination windows, succession, term/public-domain and moral-right status.
- **09.04 Rights Conflicts & Disputes** — deterministic/probabilistic conflict detection, scoped evidence cases and rights-side freeze instructions.
- **09.05 AI, Voice & Likeness Consent** — scoped AI-training consent, person-held NIL positions and orthogonal AI declarations without detection.
- **09.06 Rights Evidence & Public Record** — identifier allocation/reconciliation, universal possession timestamping, registration preparation and publication-safe lookup.

### Delivery Phases

| Phase | Enabled boundary |
|---|---|
| Consumer launch | Capture/consent/export of ownership and split evidence; work/recording records; chain events; conflict flags/cases; private proof |
| Later activation | Identifier registrant allocation, registration filing adapters, public rights lookup, society/collection and full territory/deal operations |
| Counsel-gated | Money custody/escrow, multi-party payouts, court-order execution beyond compelled platform compliance, automated reversion/termination outside fixed approved rules |

## Acceptance Criteria

- **AC-RGT-01 — Assert work/recording:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized actor creates separate composition/recording records; names parties without assigning shares; link optional until release, and (6) return Immutable assertion and possession timestamp commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-02 — Link recording/work:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Actor creates weighted typed links whose positive exact-rational weights sum to 100%; concurrent stale edits reject, and (6) return New link-set version and validation result commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-03 — Draft/propose ownership ledger:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Editor enters exact-rational rows, party/type/territory and row authorship; draft may be unbalanced, proposal may not, and (6) return Frozen whole-ledger version and consent requests created; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-04 — Consent/refuse ledger:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Named party sees complete ledger and exact values, then consents/refuses; stale link or version cannot apply, and (6) return Row consent evidence plus aggregate ledger state commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-05 — Capture split at close:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Shard 09 moment pre-fills parties/designations, never percentages; share/fee/present-not-party remain explicit and skippable, and (6) return Draft/proposal/debt stored without blocking session; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-06 — Record producer points:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Parties specify named base, exact rate, payee and recoupment terms as master encumbrance, not ownership share, and (6) return Consented encumbrance version and title event commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-07 — Record work-for-hire/buyout:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Contribution-scoped designation, consideration, beneficiary and required consents captured without asserting legal effectiveness, and (6) return Agreement/evidence state and ledger gap consequences commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-08 — Amend split/ledger:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized prior/current party proposes delta; one open proposal, all affected consents reset, current version governs until unanimous required consent, and (6) return Successor version or blocked/disputed proposal; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-09 — Record transfer/grant/reversion:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Actor selects right, share, territory, term, parties, evidence and trust level; fixed reversion may execute only under approved rule, and (6) return Chain event and current registry projection update atomically; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-10 — Resolve control summary:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) derive the ownership/control/encumbrance/covenant outcome from consented records only and label uncertainty honestly, and (6) return verdict `authorized`, `blocked` or `no_recorded_obstacle` with evidence links, where `no_recorded_obstacle` explicitly disclaims clearance and never asserts clear title; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-11 — Detect rights conflict:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) At claim time deterministic overlaps and precision-first duplicate signals notify parties; no case/freeze auto-opens, and (6) return Conflict record/dismissibility and evidence snapshot commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-12 — Open rights dispute:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Standing party opens Shard 06 case scoped to right/share/territory/period; platform evidence remains unweighted, and (6) return Case link, contest state and optional freeze request; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-13 — Freeze disputed share:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized legal/payment workflow targets exact share/territory/period; rights state instructs downstream hold but never holds funds itself, and (6) return Freeze instruction/version; distribution fails closed if required hold fails; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-14 — Record AI-training consent:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) All relevant holders state scoped grantee/use/term/territory/compensation positions; most restrictive controls and no-position stays distinct, and (6) return Consent registry version and grant eligibility result; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-15 — Record NIL position:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Person or authorized representative records voice/name/likeness scope; master/WFH ownership grants no implied NIL authority, and (6) return Person-scoped position/evidence version commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-16 — Record AI declaration:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Contributor/authorized declarant links structured declaration to content; platform never detects AI or converts absence into human claim, and (6) return Declaration version and downstream disclosure event; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-17 — Allocate/reconcile identifier:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Approved adapter checks existing identifiers before allocation; retries are idempotent; conflicts rank but owners confirm canonical, and (6) return Identifier assertion/allocation/reconciliation version; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-18 — Prepare registration:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) User reviews registration group, source values, gaps and deadline; platform never auto-registers or says filing creates copyright, and (6) return Draft artifact and source-version manifest; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-19 — View private/public rights evidence:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized party sees full ledger; public sees separate publication-safe projection without default percentages/disputes, and (6) return Viewer-scoped, provenance-labelled response; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-RGT-20 — Export signed agreement/title chain:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) User pins right/territory/period and current evidence; output names its scope, gaps, trust and source versions, and (6) return Immutable artifact/checksum/receipt created; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| RGT-01 | Assert work/recording | Authorized actor creates separate composition/recording records; names parties without assigning shares; link optional until release. | Immutable assertion and possession timestamp commit. |
| RGT-02 | Link recording/work | Actor creates weighted typed links whose positive exact-rational weights sum to 100%; concurrent stale edits reject. | New link-set version and validation result commit. |
| RGT-03 | Draft/propose ownership ledger | Editor enters exact-rational rows, party/type/territory and row authorship; draft may be unbalanced, proposal may not. | Frozen whole-ledger version and consent requests created. |
| RGT-04 | Consent/refuse ledger | Named party sees complete ledger and exact values, then consents/refuses; stale link or version cannot apply. | Row consent evidence plus aggregate ledger state commits. |
| RGT-05 | Capture split at close | Shard 09 moment pre-fills parties/designations, never percentages; share/fee/present-not-party remain explicit and skippable. | Draft/proposal/debt stored without blocking session. |
| RGT-06 | Record producer points | Parties specify named base, exact rate, payee and recoupment terms as master encumbrance, not ownership share. | Consented encumbrance version and title event commit. |
| RGT-07 | Record work-for-hire/buyout | Contribution-scoped designation, consideration, beneficiary and required consents captured without asserting legal effectiveness. | Agreement/evidence state and ledger gap consequences commit. |
| RGT-08 | Amend split/ledger | Authorized prior/current party proposes delta; one open proposal, all affected consents reset, current version governs until unanimous required consent. | Successor version or blocked/disputed proposal. |
| RGT-09 | Record transfer/grant/reversion | Actor selects right, share, territory, term, parties, evidence and trust level; fixed reversion may execute only under approved rule. | Chain event and current registry projection update atomically. |
| RGT-10 | Resolve control summary | System derives ownership/control/encumbrance/covenant outcome from consented records and labels uncertainty honestly. | Verdict `authorized`, `blocked` or `no_recorded_obstacle` with evidence links; `no_recorded_obstacle` never asserts clear title. |
| RGT-11 | Detect rights conflict | At claim time deterministic overlaps and precision-first duplicate signals notify parties; no case/freeze auto-opens. | Conflict record/dismissibility and evidence snapshot commit. |
| RGT-12 | Open rights dispute | Standing party opens Shard 06 case scoped to right/share/territory/period; platform evidence remains unweighted. | Case link, contest state and optional freeze request. |
| RGT-13 | Freeze disputed share | Authorized legal/payment workflow targets exact share/territory/period; rights state instructs downstream hold but never holds funds itself. | Freeze instruction/version; distribution fails closed if required hold fails. |
| RGT-14 | Record AI-training consent | All relevant holders state scoped grantee/use/term/territory/compensation positions; most restrictive controls and no-position stays distinct. | Consent registry version and grant eligibility result. |
| RGT-15 | Record NIL position | Person or authorized representative records voice/name/likeness scope; master/WFH ownership grants no implied NIL authority. | Person-scoped position/evidence version commits. |
| RGT-16 | Record AI declaration | Contributor/authorized declarant links structured declaration to content; platform never detects AI or converts absence into human claim. | Declaration version and downstream disclosure event. |
| RGT-17 | Allocate/reconcile identifier | Approved adapter checks existing identifiers before allocation; retries are idempotent; conflicts rank but owners confirm canonical. | Identifier assertion/allocation/reconciliation version. |
| RGT-18 | Prepare registration | User reviews registration group, source values, gaps and deadline; platform never auto-registers or says filing creates copyright. | Draft artifact and source-version manifest. |
| RGT-19 | View private/public rights evidence | Authorized party sees full ledger; public sees separate publication-safe projection without default percentages/disputes. | Viewer-scoped, provenance-labelled response. |
| RGT-20 | Export signed agreement/title chain | User pins right/territory/period and current evidence; output names its scope, gaps, trust and source versions. | Immutable artifact/checksum/receipt created. |

### Global Interaction Rules

- Commands carry `actor_person_id`, `acting_party_id?`, `acting_context_version`, `idempotency_key`, `expected_version?`, `request_id` and exact right/territory scope.
- Credit, contribution, ownership, control, custody, collection, registration and payment are distinct facts.
- Exact rationals are canonical; displayed decimals are derived and never round back into stored shares.
- Consent binds the whole frozen ledger version and exact values. Silence, opening a link, being named, credit or representation mandate never means consent.
- Draft capture never blocks creative work; release/payment/licensing gates may later refuse incomplete/conflicted rights.
- Legal-status computations expose jurisdiction, source, inputs, unknowns and disclaimer; no bare verdict or clearance claim.

## Contracts

### Core Types and Errors

| Contract | Definition |
|---|---|
| `RightType` | `composition_writer \| composition_publisher \| master \| performer \| neighbouring \| nil \| ai_training \| security_interest` |
| `LedgerState` | `draft \| unallocated \| proposed \| consented \| refused \| superseded \| disputed \| public_domain` |
| `ConsentState` | `pending \| consented \| refused \| unreachable` |
| `TrustLevel` | `platform_witnessed \| evidence_attached \| asserted \| imported` |
| `ConflictKind` | `arithmetic_overlap \| double_assignment \| territory_collision \| external_conflict \| duplicate_candidate \| public_domain_contradiction` |
| `StandardError` | `VALIDATION_FAILED, FORBIDDEN, ACTING_CONTEXT_STALE, VERSION_CONFLICT, IDEMPOTENCY_MISMATCH, LEDGER_UNBALANCED, CONSENT_STALE, CONSENT_REQUIRED, TERRITORY_INCOMPLETE, CONTROL_BLOCKED, CONFLICT_ACTIVE, COUNSEL_GATE_DISABLED, IDENTIFIER_PROVIDER_FAILED` |

### Registry and Ledger

| Contract | Invariant |
|---|---|
| `AssertRightsObject` | Work and recording separate. Explicit assertion only; no project artifact auto-promotion. Non-empty/consented/earning record never deletes. |
| `SetRecordingWorkLinks` | Typed weighted set; each weight positive exact rational; sum exactly one; work links separate from recording lineage. |
| `ProposeLedger` | Arithmetic/structural invariants pass. Draft persists unbalanced; proposed version frozen and row authors visible. |
| `ConsentLedger` | Party may read whole ledger but acts only for authorized row/party. Consent exact-version; any row change resets every consent. |
| `PublishingLedger` | Writer/publisher pools distinct; publisher rows anchored exactly to writer share; only writer/authorized publisher relationship may edit own anchored rows. |
| `MasterControl` | Derived from consented ownership, joint-owner rule, grants and encumbrances. “No recorded obstacle” never equals clear title. |
| `PublicDomainLedger` | User declaration creates terminal zero-row publishing state; platform does not declare public domain and contradiction remains visible. |

### Agreements and Lifecycle

| Contract | Invariant |
|---|---|
| `RecordPoints` | Named base required; base-tier waterfall ≤100% per tier; points are assignable encumbrance and mutually exclusive with WFH fee per contribution. |
| `RecordBuyout` | Contribution-scoped designation/consideration/beneficiary; two consents unless approved engagement evidence waives payer action; performer/credit/NIL survive. |
| `ProposeAmendment` | Supersedes only; one open proposal; no admin override; delta/impact manifest shown; unreachable leaves blocked indefinitely. |
| `AppendTitleEvent` | Right/share/territory/period/event/evidence/trust required. Conflicting transfers both remain; no silent winner. |
| `RecordGrant` | Territory and term explicit; missing term incomplete, never perpetual. Fixed reversion may auto-execute only through versioned approved rule; conditional only notifies. |
| `RecordSuccession` | Estate acts as itself under Shard 01 authority; inheritance is title event, never login as deceased or probate determination. |

### Conflicts, Consent and Evidence

| Contract | Invariant |
|---|---|
| `DetectConflict` | Runs at claim/write time. Deterministic classes non-suppressible; duplicate candidate needs corroborating signal and is dismissible permanently. |
| `OpenRightsCase` | Shard 06 case scope is one right/share/territory/period. Platform does not adjudicate merits or weight its evidence. |
| `IssueFreezeInstruction` | Exact contested share only; no whole-work freeze. Release requires independent authorization; party cannot release own hold. |
| `EvaluateAITrainingGrant` | Unanimity/most-restrictive position; no-position distinct from refusal. Scope/grantee/term/territory/compensation required. |
| `RecordNILPosition` | Person-scoped and separately authorized; no derivation from master, credit or WFH. |
| `AnchorCreationProof` | Universal source hash/time/event attachment; proves possession at time, not authorship. Failure loud and retryable. |

## Data Models

| Model | Key relationships and constraints |
|---|---|
| `work` / `recording` | Separate asserted objects, lifecycle, identifiers, source project/version links and creation-proof refs. |
| `recording_work_link_version` | Recording, work, type, exact weight, author/evidence, set version; weights sum one. |
| `recording_lineage_edge` | Recording parent/child and kind; separate from work links/project versions. |
| `rights_ledger_version` | Object/right/territory/state/payout-basis-term version, proposer, source hash, supersedes; immutable. |
| `rights_ledger_row` | Ledger, party, row kind, exact numerator/denominator, entered-by, writer anchor?, provenance. |
| `ledger_consent` | Ledger version/row/party, state, method, evidence, acted-at; unique exact version/party/row. |
| `joint_owner_rule` / `control_projection` | Consented rule and derived verdict/evidence hash; projection only. |
| `encumbrance` / `covenant` | Asset-travelling burden versus party-bound promise, base/tier/rate/term/payee/evidence. |
| `split_capture` | Work/session source, party designations, proposal/debt and platform payout-basis term version. |
| `buyout_designation` | Contribution, payer/designee/beneficiary, consideration, consent/effectiveness disclaimer. |
| `ledger_amendment` | Current/proposed versions, delta/impact manifest, standing, consent state, true-up item, version. |
| `title_event` | Right/share/territory/period, event type, from/to, evidence/trust, effective/recorded times, conflict link. |
| `territory_grant` / `reversion_instruction` | Grant scope/term/conditions and notify/execute state. |
| `rights_conflict` / `rights_case_link` | Kind, claims, evidence, dismissibility/state and Shard 06 case. |
| `rights_freeze_instruction` | Case, exact scope, downstream adapter, state/evidence/release authority/version. |
| `ai_training_position` / `nil_position` | Holder/person, scope, grantee/use/term/territory/compensation, evidence/state/version. |
| `ai_content_declaration` | Content/contributor, declaration kind/details, author, state/supersession. |
| `identifier_assertion` / `identifier_allocation` | Scheme/value/object/issuer/status/evidence, request idempotency and reconciliation chain. |
| `creation_timestamp` | Object/version/source hash, observed-at, external anchor/evidence, state. |
| `registration_draft` | Jurisdiction/form/group/source versions/gaps/artifact/submission evidence; never automatic. |
| `public_rights_projection` | Object, publication-safe holders/contact/one-stop/provenance; no default percentages/disputes. |
| `rights_audit_event` | Immutable actor/context/action/scope/before-after/evidence/request hashes. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`work`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Separate asserted objects, lifecycle, identifiers, source project/version links and creation-proof refs..
- **`recording`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Separate asserted objects, lifecycle, identifiers, source project/version links and creation-proof refs..
- **`recording_work_link_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recording, work, type, exact weight, author/evidence, set version; weights sum one..
- **`recording_lineage_edge`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recording parent/child and kind; separate from work links/project versions..
- **`rights_ledger_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Object/right/territory/state/payout-basis-term version, proposer, source hash, supersedes; immutable..
- **`rights_ledger_row`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Ledger, party, row kind, exact numerator/denominator, entered-by, writer anchor?, provenance..
- **`ledger_consent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Ledger version/row/party, state, method, evidence, acted-at; unique exact version/party/row..
- **`joint_owner_rule`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Consented rule and derived verdict/evidence hash; projection only..
- **`control_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Consented rule and derived verdict/evidence hash; projection only..
- **`encumbrance`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Asset-travelling burden versus party-bound promise, base/tier/rate/term/payee/evidence..
- **`covenant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Asset-travelling burden versus party-bound promise, base/tier/rate/term/payee/evidence..
- **`split_capture`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Work/session source, party designations, proposal/debt and platform payout-basis term version..
- **`buyout_designation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Contribution, payer/designee/beneficiary, consideration, consent/effectiveness disclaimer..
- **`ledger_amendment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Current/proposed versions, delta/impact manifest, standing, consent state, true-up item, version..
- **`title_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Right/share/territory/period, event type, from/to, evidence/trust, effective/recorded times, conflict link..
- **`territory_grant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Grant scope/term/conditions and notify/execute state..
- **`reversion_instruction`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Grant scope/term/conditions and notify/execute state..
- **`rights_conflict`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Kind, claims, evidence, dismissibility/state and Shard 06 case..
- **`rights_case_link`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Kind, claims, evidence, dismissibility/state and Shard 06 case..
- **`rights_freeze_instruction`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Case, exact scope, downstream adapter, state/evidence/release authority/version..
- **`ai_training_position`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Holder/person, scope, grantee/use/term/territory/compensation, evidence/state/version..
- **`nil_position`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Holder/person, scope, grantee/use/term/territory/compensation, evidence/state/version..
- **`ai_content_declaration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Content/contributor, declaration kind/details, author, state/supersession..
- **`identifier_assertion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scheme/value/object/issuer/status/evidence, request idempotency and reconciliation chain..
- **`identifier_allocation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scheme/value/object/issuer/status/evidence, request idempotency and reconciliation chain..
- **`creation_timestamp`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Object/version/source hash, observed-at, external anchor/evidence, state..
- **`registration_draft`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Jurisdiction/form/group/source versions/gaps/artifact/submission evidence; never automatic..
- **`public_rights_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Object, publication-safe holders/contact/one-stop/provenance; no default percentages/disputes..
- **`rights_audit_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable actor/context/action/scope/before-after/evidence/request hashes..

## Access Control

| Actor | Permitted | Explicitly denied |
|---|---|---|
| Named owner/writer/payee | Read whole relevant ledger, act for own authorized rows, propose/consent/amend/export | Alter another party's row, infer consent, release own disputed hold |
| Producer/master administrator | Assert recording/master draft, capture split, manage authorized master terms | Assign composition ownership, NIL, authorship or publisher shares |
| Performer | Confirm performance fact and own neighbouring/NIL position | Gain master share merely from credit/performance |
| Publisher/admin entity | Act only on anchored share/grant under recorded authority | Name itself over writer share or reach authorship through representation mandate |
| Estate/successor | Scoped title/royalty/licensing acts under Shard 01 representation | Login as deceased, rewrite historical consent or receive vault credentials |
| Public/Fan | Publication-safe lookup and provenance class | Percentages by default, disputes, private deals/evidence/contact data |
| Dispute/legal reviewer | Case-scoped rights/evidence/freeze authorization | Adjudicate via platform admin, edit ledgers or expose sealed evidence |
| Registration/identifier operator | Approved scheme/profile operations and reconciliation | Allocate without pre-check, hide conflicts or assert legal ownership |
| System worker | Validate arithmetic, derive control/status, detect conflict, timestamp, notify and project | Create consent, decide merits, infer clearance or hold funds |

### Access Escalation

- **Named owner/writer/payee:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Producer/master administrator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Performer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Publisher/admin entity:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Estate/successor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Public/Fan:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Dispute/legal reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Registration/identifier operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Ledger/split editors expose exact values, pool labels, totals and imbalance in semantic tables with keyboard row operations.
- Consent screen presents the complete frozen ledger, before/after delta, row authorship and consequence before an unchecked action.
- Work/recording duality and writer/publisher/master pools use plain-language explanations; color never distinguishes legal state alone.
- Control, term, moral-right and public-domain status always includes jurisdiction/source/input/unknown labels and non-advice wording.
- Chain-of-title and dispute evidence have linear timelines; graph visualization is optional and never required.
- Signed-link consent, registration preflight and identifier conflict flows preserve focus/errors and provide screen-reader-readable receipts.

## Event Schemas

| Event | Payload minimum | Consumers |
|---|---|---|
| `rights.object.changed.v1` | Object/kind/state/source/version/hash | Projects, release, lookup, identifiers |
| `rights.ledger.proposed.v1` | Ledger/object/right/territory/rows hash/consent set/version | Consent tasks, split UI |
| `rights.ledger.consented.v1` | Ledger/version/party/row states/aggregate state | Control, licensing, royalty projections |
| `rights.ledger.superseded.v1` | Old/new/delta/impact/effective/version | Shards 18/20–22/27/28 and stale artifacts |
| `rights.title-event.recorded.v1` | Event/right/share/territory/period/trust/evidence hash | Registry, control, chain export |
| `rights.conflict.changed.v1` | Conflict/kind/scope/state/case/version | Parties, Shard 06, downstream gates |
| `rights.freeze.changed.v1` | Instruction/case/scope/state/authority/version | Royalty/distribution adapters |
| `rights.consent-position.changed.v1` | Kind/holder-or-person/scope/state/version | Licensing/AI/NIL policy evaluators |
| `rights.identifier.changed.v1` | Object/scheme/value/state/reconciliation/version | Release/distribution/reporting |
| `rights.creation-proof.anchored.v1` | Object/version/hash/anchor/state | Private evidence and title chain |

Events exclude percentages unless consumer contract explicitly requires them, private economics, narratives, signatures, evidence blobs, disputes, NIL details and unrestricted PII.

## Edge Cases

| Case | Required result |
|---|---|
| Unbalanced draft | Persist as unallocated; proposal blocked with exact deficit/excess, no auto-remainder. |
| Ledger edited after one consent | New version resets all consents; stale action rejected. |
| Two concurrent amendments | First opens; second queues with snapshot and must rebase, never merges. |
| Unreachable party | Proposal remains blocked indefinitely; silence never consent and current ledger governs. |
| Bought-out contributor | Absent from ownership ledger, not zero row; credit/performance/NIL records remain. |
| Lineage child diverges | Inherited ledger reference forks to independent copy on first divergence. |
| Conflicting transfers | Both title events visible; control remains blocked/uncertain pending case. |
| Payment freeze adapter fails | Distribution/payment operation fails closed; rights service never pretends funds held. |
| Public-domain declaration conflicts with computed term | Persistent non-dismissible conflict; neither state silently overwrites other. |
| Identifier allocation retries | Same request returns same allocation; never consumes second code. |
| Two valid identifiers | Ranked recommendation only; owners confirm canonical or open dispute. |
| Timestamp anchor outage | Source record commits with failed proof state, loud task and idempotent retry. |
| Public lookup request | Separate safe projection; no hidden percentage/dispute existence leak. |
| AI declaration absent | Render undeclared, never no-AI/human-origin claim. |

## Surface Applicability

Responsive web/PWA only. Signed consent links may support non-account parties without granting broader workspace access. Machine exports and registration artifacts use short-lived authorized downloads.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| RGT-01 Assert work/recording | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-02 Link recording/work | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-03 Draft/propose ownership ledger | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-04 Consent/refuse ledger | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-05 Capture split at close | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-06 Record producer points | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-07 Record work-for-hire/buyout | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-08 Amend split/ledger | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-09 Record transfer/grant/reversion | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-10 Resolve control summary | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-11 Detect rights conflict | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-12 Open rights dispute | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-13 Freeze disputed share | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-14 Record AI-training consent | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-15 Record NIL position | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-16 Record AI declaration | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-17 Allocate/reconcile identifier | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-18 Prepare registration | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-19 View private/public rights evidence | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| RGT-20 Export signed agreement/title chain | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [Shard 00](00-infrastructure.md) for contracts/events/storage/audit; [Shard 01](01-identity-authority.md) for parties/authority/estates; [Shard 07](07-credits-core.md) for credit evidence; [Shard 09](09-projects-collaboration.md) for songs/sessions/versions/source declarations.
- **Depended on by:** Shards 14, 18, 20, 21, 22, 27 and 28 consume consented ledger, title, conflict, identifier or consent-position projections. They cannot mutate rights truth or treat incomplete/asserted data as consented.

## Deep Dives Needed

- [Rights and ownership deep dive](deep-dives/10-rights-ownership.md)

### Cross-Shard Section Contract Map

- **Shard 14 — Services marketplace:** consume [Shard 14 — Services marketplace Contracts](14-services-marketplace.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 14 — Services marketplace Event Schemas](14-services-marketplace.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 18 — Royalty accounting:** consume [Shard 18 — Royalty accounting Contracts](18-royalty-accounting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 18 — Royalty accounting Event Schemas](18-royalty-accounting.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 20 — Licensing core:** consume [Shard 20 — Licensing core Contracts](20-licensing-core.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 20 — Licensing core Event Schemas](20-licensing-core.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 21 — Licensing operations:** consume [Shard 21 — Licensing operations Contracts](21-licensing-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 21 — Licensing operations Event Schemas](21-licensing-operations.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 22 — Release and distribution:** consume [Shard 22 — Release and distribution Contracts](22-release-distribution.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 22 — Release and distribution Event Schemas](22-release-distribution.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 27 — Digital catalog and delivery:** consume [Shard 27 — Digital catalog and delivery Contracts](27-digital-catalog-delivery.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 27 — Digital catalog and delivery Event Schemas](27-digital-catalog-delivery.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 28 — Digital licensing and commerce:** consume [Shard 28 — Digital licensing and commerce Contracts](28-digital-licensing-commerce.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 28 — Digital licensing and commerce Event Schemas](28-digital-licensing-commerce.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-03 | Reconciled 38 sources; locked registry, ledger, consent, title, conflict, AI/NIL and evidence contracts | /write-architecture-spec | All |
| 2026-08-05 | A-12 — repaired RGT-10 table corruption (unescaped pipes in the Completion cell) and regenerated AC-RGT-10 from the Interactions row; verdict enum sourced from deep-dives/10 § Chain, Control and Reversion Algorithm step 5 | /resolve-ambiguity | Acceptance Criteria, Interactions |

## Dependency References

### Constrains

- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace]]
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty accounting]]
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core]]
- [[specs/ia/21-licensing-operations|Shard 21 — Licensing operations]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution]]
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog and delivery]]
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing and commerce]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/28-digital-licensing-commerce|Shard 28 — Digital licensing, commerce, revocation and revenue]]
