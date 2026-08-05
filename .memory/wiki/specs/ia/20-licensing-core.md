# Shard 20 — Licensing core and instrument lifecycle

**Status:** Complete
**Surface:** Web/PWA, asynchronous projections and provider-reconciled single-payee consideration
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 20 owns sync catalogue eligibility, briefs/pitches, bilateral holds, dual-right coordination, scope-specific clearance, completeness/encumbrance evidence, consent routing, pricing/negotiation/MFN, share-scoped owner policy, veto/conflict folding, structured licence instruments, verification and lifecycle. It consumes rights truth from Shard 10 and cannot override missing consent, contested title, encumbrance, payment/counsel gates or post-issue licence history.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 29 |
| Child capabilities | 19 |
| Core chains | Search/pitch/hold; clearance/attestation/encumbrance/consent; price/quote/MFN; policy/veto/fold; scope/instrument/lifecycle |
| Phase | Phase-2 licensing train after rights, projects, safety and single-payee payment prerequisites |
| Money boundary | Single-payee or £0 consideration only under current architecture; paid multi-counterparty routing/escrow remains B3-disabled |

### Licensing Decisions

| Area | Locked decision |
|---|---|
| Clearance | Computed per `(work, scope)` from fresh consent graph, rights sides, attestations, encumbrances and policy; fail closed and owner cannot override. |
| One-stop | Displayed only when exactly one transacting counterparty controls every required side; otherwise state counterparty count. |
| Catalogue evidence | Human-committed tags/attestations/declarations only. Machine output may propose but never creates clearance. |
| Consent | Route all required parties simultaneously; silence never improves status; buyer blocker detail is privacy-scoped. |
| Policy | Share-scoped, opt-in auto-approval; refusals first, permissions conjunctive, AI training refused by default, exclusivity never auto-approved. |
| Scope | Structured versioned grammar; unset is non-permissive, data use is separate, territory resolves to explicit countries and instruments pin versions. |
| Issuance | Gate issues immutable instrument(s), not owner UI. Required sides issue atomically or not at all; consideration commitment and issuance reconcile as one saga. |
| Lifecycle | Amendments supersede; widening is new consent/policy/price; later regret/veto/encumbrance cannot rewrite an issued licence. |

## Features

- **11.01 Sync Licensing** — [ideation source](../ideation/11-music-licensing/11.01-sync-licensing/11.01-sync-licensing-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **11.02 Clearance & One-Stop Status** — [ideation source](../ideation/11-music-licensing/11.02-clearance-one-stop-status/11.02-clearance-one-stop-status-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **11.03 Licence Pricing & Negotiation** — [ideation source](../ideation/11-music-licensing/11.03-licence-pricing-negotiation/11.03-licence-pricing-negotiation-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **11.04 Licensing Policy & Rights-Holder Preferences** — [ideation source](../ideation/11-music-licensing/11.04-licensing-policy-preferences/11.04-licensing-policy-preferences-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **11.08 Licence Instrument & Lifecycle** — [ideation source](../ideation/11-music-licensing/11.08-licence-instrument-lifecycle/11.08-licence-instrument-lifecycle-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-LIC-01 — Owner prepares sync catalogue entry:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Bind work/master/assets; human confirms tags; asset-backed flags require governed asset evidence, and (6) return Searchable eligible projection or blocked reasons; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-02 — Professional buyer searches:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply metadata/reference candidates and scope snapshot; render clearance status/time basis inline, and (6) return Results with advisory “as of” verdicts; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-03 — Buyer creates brief and pitch request:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze hard constraints, target scope/deadline and clearance requirement; prefilter pitches, and (6) return Bounded candidate set and eventual terminal statuses; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-04 — Buyer requests hold:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Fresh conflict/clearance check; reserve both required sides for exact scope/window, and (6) return Active bilateral hold or no hold; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-05 — Owner/participant attests catalogue completeness:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reference immutable party-list version, side, knowledge basis, identity/presence/listing and grade, and (6) return Valid, corroborated, contested or superseded evidence; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-06 — Contributor declares encumbrance:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record own-work sample/material/source/scope condition and evidence grade; no accusation/notification, and (6) return Encumbered/declared state pending owner resolution; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-07 — Buyer requests clearance:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze grammar/scope/buyer/end-client; derive required sides/consent parties and evaluate precedence, and (6) return Clearable, consent-needed, incomplete, encumbered, contested, blocked or unknown; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-08 — System routes consent:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Send one plain-language request per verified person naming all stakes, simultaneously, and (6) return Approve/decline/counter/expired; non-response stays pending; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-09 — Owner configures licensing policy:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Save share-scoped defaults/overrides, exclusions, thresholds and opt-in auto-approve under grammar version, and (6) return Versioned policy; no work-wide authority; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-10 — Co-owner creates veto/block:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Validate standing side/category/buyer scope; atomically affect future/in-flight requests, not issued licences, and (6) return Active/lapsed/superseded block; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-11 — System folds owner policies:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply refusal→eligibility→per-owner threshold→fall-through→pricing order independently of input order, and (6) return Derived attributed verdict; failure blocks/falls through safely; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-12 — Buyer requests quote:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate policy first, pin rate-card version, scope and deadline; route ask/consent separately, and (6) return Complete quote, partial/pending or expired; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-13 — Parties negotiate:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record money asks/counters/consents until TTL; partial agreement never appears as deal, and (6) return Settled set or no deal; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-14 — System evaluates MFN:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) At fixed settlement point compare eligible distinct counterparties; separate agreed and owed price, and (6) return Final owed prices or provisional hold; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-15 — Gate issues licence:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Re-evaluate fresh clearance/exclusivity/policy/payment/B3; atomically persist required instruments and commitment record, and (6) return Issued pair/single instrument or no issuance; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-16 — User downloads certificate:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Render PDF/file projection from canonical instrument with prominent unguessable verification reference, and (6) return Reproducible certificate, not authority source; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-17 — Third party verifies:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Live lookup pinned grammar/instrument/lifecycle and timestamped validity window, and (6) return Valid/superseded/terminated/expired/cannot-verify; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-18 — Parties amend licence:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Classify narrowing/administrative/widening; widening runs new request, consent, price and consideration, and (6) return Superseding instrument or original unchanged; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-LIC-19 — System processes term/termination:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Resolve commencement/duration; warn both sides; breach termination only through authorized evidence/case, and (6) return Active, expiry-indeterminate, expired, superseded or terminated; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Actor and intent | System flow | Terminal outcome |
|---|---|---|---|
| LIC-01 | Owner prepares sync catalogue entry | Bind work/master/assets; human confirms tags; asset-backed flags require governed asset evidence. | Searchable eligible projection or blocked reasons. |
| LIC-02 | Professional buyer searches | Apply metadata/reference candidates and scope snapshot; render clearance status/time basis inline. | Results with advisory “as of” verdicts. |
| LIC-03 | Buyer creates brief and pitch request | Freeze hard constraints, target scope/deadline and clearance requirement; prefilter pitches. | Bounded candidate set and eventual terminal statuses. |
| LIC-04 | Buyer requests hold | Fresh conflict/clearance check; reserve both required sides for exact scope/window. | Active bilateral hold or no hold. |
| LIC-05 | Owner/participant attests catalogue completeness | Reference immutable party-list version, side, knowledge basis, identity/presence/listing and grade. | Valid, corroborated, contested or superseded evidence. |
| LIC-06 | Contributor declares encumbrance | Record own-work sample/material/source/scope condition and evidence grade; no accusation/notification. | Encumbered/declared state pending owner resolution. |
| LIC-07 | Buyer requests clearance | Freeze grammar/scope/buyer/end-client; derive required sides/consent parties and evaluate precedence. | Clearable, consent-needed, incomplete, encumbered, contested, blocked or unknown. |
| LIC-08 | System routes consent | Send one plain-language request per verified person naming all stakes, simultaneously. | Approve/decline/counter/expired; non-response stays pending. |
| LIC-09 | Owner configures licensing policy | Save share-scoped defaults/overrides, exclusions, thresholds and opt-in auto-approve under grammar version. | Versioned policy; no work-wide authority. |
| LIC-10 | Co-owner creates veto/block | Validate standing side/category/buyer scope; atomically affect future/in-flight requests, not issued licences. | Active/lapsed/superseded block. |
| LIC-11 | System folds owner policies | Apply refusal→eligibility→per-owner threshold→fall-through→pricing order independently of input order. | Derived attributed verdict; failure blocks/falls through safely. |
| LIC-12 | Buyer requests quote | Evaluate policy first, pin rate-card version, scope and deadline; route ask/consent separately. | Complete quote, partial/pending or expired. |
| LIC-13 | Parties negotiate | Record money asks/counters/consents until TTL; partial agreement never appears as deal. | Settled set or no deal. |
| LIC-14 | System evaluates MFN | At fixed settlement point compare eligible distinct counterparties; separate agreed and owed price. | Final owed prices or provisional hold. |
| LIC-15 | Gate issues licence | Re-evaluate fresh clearance/exclusivity/policy/payment/B3; atomically persist required instruments and commitment record. | Issued pair/single instrument or no issuance. |
| LIC-16 | User downloads certificate | Render PDF/file projection from canonical instrument with prominent unguessable verification reference. | Reproducible certificate, not authority source. |
| LIC-17 | Third party verifies | Live lookup pinned grammar/instrument/lifecycle and timestamped validity window. | Valid/superseded/terminated/expired/cannot-verify. |
| LIC-18 | Parties amend licence | Classify narrowing/administrative/widening; widening runs new request, consent, price and consideration. | Superseding instrument or original unchanged. |
| LIC-19 | System processes term/termination | Resolve commencement/duration; warn both sides; breach termination only through authorized evidence/case. | Active, expiry-indeterminate, expired, superseded or terminated. |

### Global Interaction Rules

- Search verdict is advisory; issuance gate always re-evaluates current canonical state.
- Consent graph, share graph, credit graph and payment payees are distinct and may contain different parties.
- Buyer never sees blocker identity/category detail; co-owners receive attributed reasons within their side.
- No licence without valid consideration state; no finalized charge without issued instrument. Ambiguous provider outcomes remain pending reconciliation.
- Paid issuance involving more than one payee/counterparty is denied until B3; consent/quote preparation may proceed without implying payment availability.
- Issued scope never expands because policies, grammar or ownership later changes.

## Contracts

### Types and Errors

| Type | Contract |
|---|---|
| `LicenceScope` | Grammar version plus media, data-use, territory country set, term trigger/duration, exclusivity, usage, scale, extent and grant-side grantee. |
| `ClearanceVerdict` | `unknown > blocked > contested > encumbered > incomplete > consent_needed > clearable_now`; per required side, blockers/remedy owner and evaluated-at. |
| `EvidenceGrade` | `captured`, `reconstructed`, `cleared_evidenced`, `cleared_asserted`; quality displayed, not silently converted to authority. |
| `ConsentState` | `pending`, `approved`, `declined`, `countered`, `expired`, `revoked_pre_issue`; one person may cover multiple stakes. |
| `InstrumentState` | `issued`, `active`, `expiry_indeterminate`, `expired`, `superseded`, `terminated`; no partial issue. |
| Errors | `SCOPE_REQUIRED`, `GRAMMAR_UNSUPPORTED`, `CLEARANCE_UNKNOWN`, `CLEARANCE_BLOCKED`, `CONSENT_REQUIRED`, `ENCUMBRANCE_ACTIVE`, `POLICY_BLOCKED`, `POLICY_EVALUATION_FAILED`, `HOLD_CONFLICT`, `EXCLUSIVITY_CONFLICT`, `QUOTE_EXPIRED`, `MFN_PROVISIONAL`, `CONSIDERATION_UNCOMMITTED`, `MULTIPAYEE_DISABLED_B3`, `ISSUANCE_CONFLICT`, `AMENDMENT_REQUIRES_NEW_GRANT`, `CANNOT_VERIFY`. |

### Clearance and Consent

| Contract | Rule |
|---|---|
| `ComputeClearance` | Scope required; derive sides and consent parties fresh; fail closed; audience-scoped blockers and exactly one remedy owner. |
| `DetermineOneStop` | Exactly one unique counterparty across all required sides; multi-role human counts once. |
| `CreateCompletenessAttestation` | Immutable party-list version, side, knowledge statement, verified attestor/authority basis and grade. |
| `DeclareEncumbrance` | Own-work declaration, scope ceiling and evidence grade; retraction supersedes, never deletes. |
| `RouteConsent` | All parties simultaneous; one person receives combined stakes; legal appendix plus primary plain-language summary. |
| `CreateHold` | Both master/publishing or every required side, exact scope/window; conflict unknown means no hold; automatic expiry. |

### Policy, Quote and Instrument

| Contract | Rule |
|---|---|
| `EvaluatePolicyFold` | Refusals absolute; eligibility and permissions conjunctive; per-owner share-denominated 90-day thresholds; silence non-permissive. |
| `EvaluateAutoApprove` | Party opt-in/live principal, non-exclusive only, no MFN/dispute/self-dealing conflict; budget/failure falls through to human. |
| `CreateQuote` | Pin scope/grammar/card/policy/read version and TTL; ask in money, consent remains separate. |
| `EvaluateMFN` | Settled set at fixed point, excludes self-comparison; agreed/owed price separate; failure remains provisional. |
| `IssueLicence` | Idempotent fresh gate; one instrument per committed transaction and atomic required-side pair; immutable issued-at server time. |
| `VerifyLicence` | Unguessable live reference, pinned grammar, lifecycle/time and validity window; outage returns cannot-verify. |
| `AmendLicence` | Superseding record; widening is fresh grant, refusal leaves original unchanged. |

## Data Models

| Model | Relationships and invariants |
|---|---|
| `licensing_catalogue_projection` | Work/master/assets/tags/evidence and publication eligibility; derived, no rights authority. |
| `licensing_brief` / `pitch` | Buyer/end-client, hard constraints, scope/deadline and terminal pitch state. |
| `licence_hold` | Work/sides/scope/window/buyer/state; excludes overlapping grants/holds according to policy. |
| `completeness_attestation` / `corroboration` | Side, party-list version, attestor basis/grade/state; immutable/superseding. |
| `encumbrance_declaration` | Work/master/material/source/scope ceiling/evidence/actor/state/version. |
| `clearance_snapshot` | Scope/rights/consent/policy/evidence versions, per-side verdicts, dominant state and evaluated time. |
| `consent_request` / `consent_decision` | Party/stakes/plain/legal scope/deadline and immutable decision sequence. |
| `licensing_policy_version` | Share/owner/default/work override, eight policy axes, thresholds, opt-in and lifecycle. |
| `licensing_block` | Author/standing side/category or declared buyer/end-client, term/reason disclosure/state. |
| `policy_fold_result` | Request/owners, attributed per-owner verdict/threshold result and binding owner; derived. |
| `rate_card_version` / `licence_quote` | Scope rules, amount/currency, card/policy versions, TTL and state. |
| `negotiation_offer` / `mfn_evaluation` | Counterparty asks/consents, settled set, agreed/owed values and state. |
| `scope_grammar_version` | Axis/value/hierarchy/exclusion/rights-side mapping and lifecycle; deprecated values remain resolvable. |
| `licence_transaction` | Buyer/licensee, consideration/provider/B3 state, idempotency and issuance result. |
| `licence_instrument` | Pinned scope/grammar/parties/capacities/rights sides/price/obligations/times/state and supersession. |
| `licence_certificate_projection` | Instrument/version/render hash/object/verification ref; disposable projection. |
| `licence_lifecycle_event` | Issue/amend/commence/expire/terminate cause, actor/evidence/version. |

PostgreSQL owns policy, clearance, consent, quotes, instruments, audit/idempotency/outbox. Storage owns private pitch media/evidence and certificate bytes behind metadata. Search contains only publication-approved fields and advisory clearance snapshot age.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`licensing_catalogue_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Work/master/assets/tags/evidence and publication eligibility; derived, no rights authority..
- **`licensing_brief`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Buyer/end-client, hard constraints, scope/deadline and terminal pitch state..
- **`pitch`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Buyer/end-client, hard constraints, scope/deadline and terminal pitch state..
- **`licence_hold`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Work/sides/scope/window/buyer/state; excludes overlapping grants/holds according to policy..
- **`completeness_attestation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Side, party-list version, attestor basis/grade/state; immutable/superseding..
- **`corroboration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Side, party-list version, attestor basis/grade/state; immutable/superseding..
- **`encumbrance_declaration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Work/master/material/source/scope ceiling/evidence/actor/state/version..
- **`clearance_snapshot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scope/rights/consent/policy/evidence versions, per-side verdicts, dominant state and evaluated time..
- **`consent_request`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party/stakes/plain/legal scope/deadline and immutable decision sequence..
- **`consent_decision`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party/stakes/plain/legal scope/deadline and immutable decision sequence..
- **`licensing_policy_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Share/owner/default/work override, eight policy axes, thresholds, opt-in and lifecycle..
- **`licensing_block`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Author/standing side/category or declared buyer/end-client, term/reason disclosure/state..
- **`policy_fold_result`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Request/owners, attributed per-owner verdict/threshold result and binding owner; derived..
- **`rate_card_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scope rules, amount/currency, card/policy versions, TTL and state..
- **`licence_quote`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scope rules, amount/currency, card/policy versions, TTL and state..
- **`negotiation_offer`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Counterparty asks/consents, settled set, agreed/owed values and state..
- **`mfn_evaluation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Counterparty asks/consents, settled set, agreed/owed values and state..
- **`scope_grammar_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Axis/value/hierarchy/exclusion/rights-side mapping and lifecycle; deprecated values remain resolvable..
- **`licence_transaction`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Buyer/licensee, consideration/provider/B3 state, idempotency and issuance result..
- **`licence_instrument`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Pinned scope/grammar/parties/capacities/rights sides/price/obligations/times/state and supersession..
- **`licence_certificate_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Instrument/version/render hash/object/verification ref; disposable projection..
- **`licence_lifecycle_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Issue/amend/commence/expire/terminate cause, actor/evidence/version..

## Access Control

| Role | Allowed | Denied |
|---|---|---|
| Public/professional buyer | Eligible search, advisory verdict, own briefs/pitches/quotes/licences/verifier | Co-owner identities/policies/block reasons, private evidence |
| Share owner/administrator | Own-share policy, consent, quotes, attributed co-owner clearance summary | Override gate, another share's policy, issued licence rewrite |
| Credited contributor | Own-work encumbrance declaration and eligible completeness evidence | Resolve encumbrance or consent without standing |
| Buyer representative | Act for declared buyer/licensee under mandate; purchaser and licensee remain distinct | Corporate-affiliate inference or undisclosed end client |
| Rights/licensing operator | Assigned catalogue/evidence/adapter/policy administration | Grant owner consent, arbitrary clearance override, multi-payee enablement |
| Finance operator | Reconcile allowed single-payee consideration and void/refund ambiguity | Raw instruments, B3-disabled multi-party routing |
| Dispute/legal reviewer | Assigned contested/breach evidence/case projection | General catalogue browsing or direct instrument edit |
| Service principal | One search/gate/render/notify/reconcile purpose | Interactive/owner authority or wildcard storage/database |

### Access Escalation

- **Public/professional buyer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Share owner/administrator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Credited contributor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Buyer representative:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Rights/licensing operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Finance operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Dispute/legal reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Search, briefs, consent, policy, quote, hold, issue, certificate and lifecycle flows are keyboard operable with visible focus and stable headings.
- Clearance displays dominant state plus all user-actionable blockers in text; audience filtering never creates unexplained empty UI.
- Structured scope has plain-language summary before legal appendix, with explicit unspecified/refused axes and country-list access.
- Consent/quote deadlines warn before expiry and preserve work after reauthentication; no action depends only on countdown/color.
- Multi-owner tables identify the current user's share/standing and expose derived fold reasoning in linearized text.
- Verification gives timestamp, validity window and cannot-verify state without treating outage as invalid.

## Event Schemas

| Event | Safe payload | Consumers |
|---|---|---|
| `licensing.catalogue.changed.v1` | Work/projection/state/version | Search |
| `licensing.hold.changed.v1` | Hold/work/scope hash/state/version | Gate/notifications |
| `licensing.evidence.changed.v1` | Work/side/evidence kind/state/version | Clearance |
| `licensing.clearance.changed.v1` | Work/scope hash/verdict/evaluated-at/version | Search/request |
| `licensing.consent.changed.v1` | Request/party pseudonym/state/version | Gate/quote |
| `licensing.policy.changed.v1` | Share/policy/state/version | Fold/gate |
| `licensing.block.changed.v1` | Work/side/block state/version | Gate/in-flight withdrawal |
| `licensing.quote.changed.v1` | Quote/scope hash/state/version | Buyer/owners |
| `licensing.instrument.issued.v1` | Instrument/transaction/scope hash/state/version | Certificate/rights/notifications |
| `licensing.instrument.lifecycle.v1` | Instrument/lifecycle state/cause class/version | Verifier/search |

Events exclude prices except purpose-authorized finance paths, policy thresholds, blocker identities/reasons, consent text, evidence, buyer private brief/media and verification secrets.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| No scope supplied | No verdict or quote; never default scope. |
| Search says clear, owner changes policy | Issuance fresh gate aborts; cached verdict creates no right. |
| One person controls both sides | Two approval/instrument-side records remain; one counterparty may qualify one-stop. |
| One side approves, other declines | No partial deal/licence/hold. |
| Silence/erased party | Never auto-consent; pseudonymous share survives and fresh-consent scope remains blocked. |
| New grammar value | Existing policies do not cover it; affirmative adoption required. |
| AI training omitted | Means none/refused, never implied by broad media rights. |
| Encumbrance retracted | Superseding history remains; downstream scope cannot exceed upstream clearance. |
| Veto arrives during quote | Withdraw affected in-flight quote/consent; issued licence unaffected. |
| Concurrent exclusive attempts | Database exclusion permits at most one; loser refused, not queued. |
| MFN evaluator fails | Owed price stays provisional; no issuance. |
| Provider payment ambiguous | Transaction remains pending; reconcile to issue or void/refund, never charge-only success. |
| Multiple paid counterparties | Consent may complete; issuance denied `MULTIPAYEE_DISABLED_B3`. |
| Certificate render fails | Instrument remains issued; retry projection, never reissue. |
| Verifier outage | `cannot verify`, not invalid. |
| Amendment widens scope | New request/consent/policy/price; original remains if refused. |
| Life-of-copyright/trigger unknown | `expiry_indeterminate` with active lifecycle monitoring, no fabricated date. |

## Dependency References

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]] for payments/storage/jobs/settings/audit; [[specs/ia/01-identity-authority|Shard 01]] for parties/mandates; [[specs/ia/02-profiles-verification|Shard 02]] for verified evidence; [[specs/ia/06-trust-safety|Shard 06]] for disputes/breach evidence; [[specs/ia/09-projects-collaboration|Shard 09]] for works/assets/pitches; [[specs/ia/10-rights-ownership|Shard 10]] for rights/splits/consent graph.
- **Depended on by:** downstream templates, usage controls, whitelist/claims and reporting consume issued instrument IDs and scope only.
- **Deep dive:** [[specs/ia/deep-dives/20-licensing-core|Licensing core deep dive]].

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| LIC-01 Owner prepares sync catalogue entry | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-02 Professional buyer searches | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-03 Buyer creates brief and pitch request | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-04 Buyer requests hold | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-05 Owner/participant attests catalogue completeness | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-06 Contributor declares encumbrance | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-07 Buyer requests clearance | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-08 System routes consent | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-09 Owner configures licensing policy | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-10 Co-owner creates veto/block | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-11 System folds owner policies | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-12 Buyer requests quote | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-13 Parties negotiate | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-14 System evaluates MFN | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-15 Gate issues licence | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-16 User downloads certificate | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-17 Third party verifies | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-18 Parties amend licence | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| LIC-19 System processes term/termination | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 02:** consume [Shard 02 Contracts](02-profiles-verification.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 02 Event Schemas](02-profiles-verification.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 09:** consume [Shard 09 Contracts](09-projects-collaboration.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 09 Event Schemas](09-projects-collaboration.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 10:** consume [Shard 10 Contracts](10-rights-ownership.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 10 Event Schemas](10-rights-ownership.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Reconciled 29 sources; locked clearance, policy, pricing, scope, issuance and B3 boundaries | `/write-architecture-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/deep-dives/20-licensing-core|Deep Dive 20 — Licensing core and instrument lifecycle]]
