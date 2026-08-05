# Shard 21 — Specialized clearances and licensing

**Status:** Complete
**Surface:** Web/PWA with provider-gated whitelist, fingerprint and dataset adapters
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 21 owns sample/interpolation/remix clearance, creator micro-licences and Content ID claim recovery, AI-training consent/corpus manifests/compensation records, cover compulsory-mechanical guidance, print/lyric licensing and the explicit exclusion of grand-rights automation. It composes Shard 20 scope/instrument gates and never converts machine suggestions, possession, silence, subscription state or statutory status into authority.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 21 |
| Child capabilities | 15 |
| Sample chain | Declaration, instant/negotiated clearance, interpolation, remix/stem/bootleg |
| Creator chain | Flat catalogue, verified whitelist, claim release and perpetual issued grant |
| AI chain | Opt-in registry, immutable corpus manifest and manifest-based compensation record |
| Statutory/special rights | Cover mechanical, print/lyrics and grand-rights exclusion |
| Provider boundary | Fingerprint, Content ID/whitelist, corpus delivery and payout adapters remain disabled until reviewed Phase-2 integration/evolution |

### Specialized Decisions

| Area | Locked decision |
|---|---|
| Samples | Human declares; machine only suggests/measures. Missing declaration does not block release, but unresolved truth blocks scopes requiring clearance. |
| Interpolation | Composition side only; plain-language replay declaration; no machine backstop. |
| Remixes/stems | Stem possession is not grant authority; independent exploitation is explicit; bootleg path means retroactive legitimisation only. |
| Micro-licence | Flat listed price, no negotiation; purchase completes only after issued licence and confirmed whitelist capability. |
| Persistence | Issued creator licence/whitelist survives subscription cancellation; subscription affects future purchases only. |
| AI | Share-level opt-in; silence/refailure/refusal excludes. Shipped corpus/manifest immutable; withdrawal cannot undo shipped models. |
| Compensation | Allocate by disclosed manifest rule, never inferred influence; small amounts remain exact and accrue without forfeiture, but payout remains B3-gated. |
| Covers | Statutory eligibility/identification flow; owner policy/veto does not create a right to refuse a valid compulsory route. |
| Grand rights | WONT in current product; never auto-approved or encoded as ordinary media scope. |

## Features

- **11.05 Sample & Derivative Clearance** — [ideation source](../ideation/11-music-licensing/11.05-sample-derivative-clearance/11.05-sample-derivative-clearance-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **11.06 Creator Micro-Licensing** — [ideation source](../ideation/11-music-licensing/11.06-creator-micro-licensing/11.06-creator-micro-licensing-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **11.07 AI Training Licensing** — [ideation source](../ideation/11-music-licensing/11.07-ai-training-licensing/11.07-ai-training-licensing-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **11.09 Cover Songs & Compulsory Mechanical Licensing** — [ideation source](../ideation/11-music-licensing/11.09-cover-song-compulsory-mechanical.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **11.10 Print & Lyric Rights** — [ideation source](../ideation/11-music-licensing/11.10-print-lyric-rights.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **11.11 Grand Rights & Dramatic Performance** — [ideation source](../ideation/11-music-licensing/11.11-grand-rights-dramatic-performance.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-SPL-01 — Contributor declares sampled material:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Enumerative versioned prompt records contribution, recording/composition sides, known/unknown source and human/machine provenance, and (6) return Current declaration plus immutable superseded history; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-02 — System suggests sample identity:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Provider/local adapter returns candidates/prominence measurements; human confirms/rejects without automatic merge, and (6) return Suggestion or honest no-machine state; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-03 — Owner requests instant sample clearance:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate policy then complete source scope/consent/terms; any failure falls to negotiation, and (6) return Issued clearance or negotiation route, never false clear; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-04 — Owners negotiate sample terms:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Route all source owners simultaneously; unanimous consent; validate fee/revenue-share obligation stacking, and (6) return Complete instrument or no clearance; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-05 — Creator declares replay/interpolation:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Ask whether they replayed recognizable musical material; resolve composition owners only, and (6) return Composition clearance route with explicit master-not-cleared warning; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-06 — Rights holder grants remix/stem use:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Verify Shard 10 authority, exact source assets and exploitation/derivative scope, and (6) return Authorized instrument; no declaration/encumbrance for permitted use; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-07 — Owner opts work into creator catalogue:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Validate fixed template containment, price, channel/use scale and single-payee path, and (6) return Active listing or human-clearance fallback; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-08 — Creator buys micro-licence:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Verify buyer/licensee/channel OAuth, scope/price/clearance; issue instrument and request whitelist, and (6) return Complete only after confirmed whitelist, else pending/failed recovery; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-09 — Creator reports Content ID claim:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) One “I have a licence” action loads instrument/channel/content/claim and submits release, and (6) return Released, correct-claim explanation or escalated relanding case; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-10 — Subscriber cancels:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Disable new purchasing benefit; preserve issued instruments/whitelists; failed cascade favors persistence, and (6) return Future capability off, grants unchanged; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-11 — Owner sets AI-training decision:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Share/work/data-use/corpus-purpose opt-in through Shard 20 policy/consent; silence is refusal, and (6) return Versioned consent/refusal with effective time; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-12 — Dataset buyer assembles corpus:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze proposed manifest; require full clearance/current opt-in on every item and notify owners before ship, and (6) return Immutable shipped corpus or blocked assembly; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-13 — Owner withdraws AI consent:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Exclude from unshipped corpora; explain shipped corpus/model irreversibility and preserve visible history, and (6) return Future exclusion plus immutable shipped-use register; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-14 — System records training compensation:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply disclosed manifest allocation to deal proceeds; preserve exact small entitlement and B3-disabled payout state, and (6) return Traceable accrual record, never influence claim; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-SPL-15 — User clears cover/print/grand-right use:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Classify use: valid cover statutory route, negotiated print/lyric route, or unsupported grand rights, and (6) return Correct route, blocked gap or explicit out-of-scope; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Actor and intent | System flow | Terminal outcome |
|---|---|---|---|
| SPL-01 | Contributor declares sampled material | Enumerative versioned prompt records contribution, recording/composition sides, known/unknown source and human/machine provenance. | Current declaration plus immutable superseded history. |
| SPL-02 | System suggests sample identity | Provider/local adapter returns candidates/prominence measurements; human confirms/rejects without automatic merge. | Suggestion or honest no-machine state. |
| SPL-03 | Owner requests instant sample clearance | Evaluate policy then complete source scope/consent/terms; any failure falls to negotiation. | Issued clearance or negotiation route, never false clear. |
| SPL-04 | Owners negotiate sample terms | Route all source owners simultaneously; unanimous consent; validate fee/revenue-share obligation stacking. | Complete instrument or no clearance. |
| SPL-05 | Creator declares replay/interpolation | Ask whether they replayed recognizable musical material; resolve composition owners only. | Composition clearance route with explicit master-not-cleared warning. |
| SPL-06 | Rights holder grants remix/stem use | Verify Shard 10 authority, exact source assets and exploitation/derivative scope. | Authorized instrument; no declaration/encumbrance for permitted use. |
| SPL-07 | Owner opts work into creator catalogue | Validate fixed template containment, price, channel/use scale and single-payee path. | Active listing or human-clearance fallback. |
| SPL-08 | Creator buys micro-licence | Verify buyer/licensee/channel OAuth, scope/price/clearance; issue instrument and request whitelist. | Complete only after confirmed whitelist, else pending/failed recovery. |
| SPL-09 | Creator reports Content ID claim | One “I have a licence” action loads instrument/channel/content/claim and submits release. | Released, correct-claim explanation or escalated relanding case. |
| SPL-10 | Subscriber cancels | Disable new purchasing benefit; preserve issued instruments/whitelists; failed cascade favors persistence. | Future capability off, grants unchanged. |
| SPL-11 | Owner sets AI-training decision | Share/work/data-use/corpus-purpose opt-in through Shard 20 policy/consent; silence is refusal. | Versioned consent/refusal with effective time. |
| SPL-12 | Dataset buyer assembles corpus | Freeze proposed manifest; require full clearance/current opt-in on every item and notify owners before ship. | Immutable shipped corpus or blocked assembly. |
| SPL-13 | Owner withdraws AI consent | Exclude from unshipped corpora; explain shipped corpus/model irreversibility and preserve visible history. | Future exclusion plus immutable shipped-use register. |
| SPL-14 | System records training compensation | Apply disclosed manifest allocation to deal proceeds; preserve exact small entitlement and B3-disabled payout state. | Traceable accrual record, never influence claim. |
| SPL-15 | User clears cover/print/grand-right use | Classify use: valid cover statutory route, negotiated print/lyric route, or unsupported grand rights. | Correct route, blocked gap or explicit out-of-scope. |

### Global Interaction Rules

- Declaration, detected suggestion, upstream licence, downstream clearance, issued instrument and public disclosure are separate records.
- A true declaration is never rejected to simplify downstream arithmetic; “unidentified source” remains first-class indefinitely.
- External provider success is confirmed/reconciled; fire-and-forget whitelist, fingerprint, claim release or corpus delivery is forbidden.
- AI consent cannot be inferred from broad media rights and does not transfer with a sold share.
- Grand rights and fan transcription/score generation are not hidden generic-scope cases.

## Contracts

### Types and Errors

| Type | Contract |
|---|---|
| `SampleDeclarationState` | `declared`, `unidentified`, `suggested_match`, `identified`, `superseded`, `retracted`; contribution scoped. |
| `SourceSide` | Recording and composition tracked separately; interpolation requires composition only. |
| `ClearanceTerms` | `fixed_fee`, `revenue_share`, or explicit combination/order; revenue share is not a price field. |
| `WhitelistState` | `not_requested`, `pending`, `confirmed`, `failed`, `revoked_in_error`, `reconciling`. |
| `AIConsentState` | `refused`, `opted_in`, `withdrawn`, `superseded`; default/refailure is refused. |
| `CorpusState` | `draft`, `clearance_blocked`, `ready`, `shipped`, `withdrawn_pre_ship`; shipped immutable. |
| Errors | `DECLARATION_REQUIRED`, `SOURCE_UNIDENTIFIED`, `CLEARANCE_REQUIRED`, `UNANIMOUS_CONSENT_REQUIRED`, `OBLIGATION_STACK_INVALID`, `STEM_AUTHORITY_REQUIRED`, `TEMPLATE_SCOPE_MISMATCH`, `CHANNEL_PROOF_REQUIRED`, `WHITELIST_UNCONFIRMED`, `CLAIM_REFERENCE_INVALID`, `AI_OPT_IN_REQUIRED`, `CORPUS_CLEARANCE_INCOMPLETE`, `MULTIPAYEE_DISABLED_B3`, `STATUTORY_ROUTE_INELIGIBLE`, `GRAND_RIGHTS_UNSUPPORTED`. |

### Specialized Clearance and Provider Contracts

| Contract | Rule |
|---|---|
| `DeclareSample` | Enumerative prompt/version, contribution, sides, source known/unknown, prominence facts and per-field human/machine source. |
| `SuggestSampleIdentity` | Candidate only; provider absence visible; no auto-declare, auto-notify or auto-merge. |
| `ClearSample` | Shard 20 scope/gate plus unanimous source-side consent and validated stacked obligations. |
| `GrantDerivativeUse` | Registry authority, exact assets and explicit remix/stem/independent-exploitation terms. |
| `PurchaseCreatorLicence` | Flat template/price, verified channel, issued instrument and confirmed provider whitelist before complete. |
| `ReleaseContentClaim` | Instrument/channel/content/claim binding, provider receipt and reconciliation; relanding escalates. |
| `SetAITrainingConsent` | Explicit share owner opt-in for exact data-use/corpus purpose; transfer resets to refusal. |
| `ShipCorpus` | Immutable manifest with current full clearance/consent, owner pre-notice and delivery evidence. |
| `AllocateTrainingProceeds` | Declared manifest rule and exact entitlements; no model-influence assertion or payout before B3. |
| `ClassifySpecialRoute` | Cover eligibility and statutory rate route; print/lyric negotiated route; grand rights unsupported. |

## Data Models

| Model | Relationships and invariants |
|---|---|
| `sample_declaration` / `sample_source_side` | Contribution, prompt version, recording/composition source, provenance/prominence facts and supersession. |
| `sample_identity_suggestion` | Declaration/provider/model/version/candidate/evidence/measurement and human decision. |
| `sample_clearance_request` / `sample_terms` | Source work/sides/scope/owners, consent, fee/revenue-share order and instrument. |
| `derivative_asset_grant` | Source asset, granting party authority, remix/stem/bootleg route and exploitation scope. |
| `creator_licence_listing` | Work/template/price/currency/channel/use policy, owner share and state. |
| `channel_proof` / `whitelist_operation` | User/licensee/provider/channel OAuth proof, instrument, request/receipt/reconciliation/state. |
| `content_claim_case` | Claim/content/channel/instrument/provider attempts, result and escalation. |
| `subscription_grant_history` | Subscription period and future-purchase capability only; no issued-licence ownership. |
| `ai_training_consent` | Share/work/purpose/scope/effective state, owner/version/supersession and transfer reset. |
| `corpus_manifest` / `corpus_manifest_item` | Deal/dataset/version/item/instrument/consent/evidence; immutable after ship. |
| `shipped_model_use` | Corpus/model/version/ship time/owner-visible provenance; append-only. |
| `training_compensation_allocation` | Deal/manifest rule/item/party/exact entitlement and B3 payout state. |
| `cover_mechanical_case` | Recording/work/release/territory/eligibility/statutory-rate/accounting route. |
| `print_lyric_request` | Work/text/format/territory/quantity/use and Shard 20 negotiated instrument. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`sample_declaration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Contribution, prompt version, recording/composition source, provenance/prominence facts and supersession..
- **`sample_source_side`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Contribution, prompt version, recording/composition source, provenance/prominence facts and supersession..
- **`sample_identity_suggestion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Declaration/provider/model/version/candidate/evidence/measurement and human decision..
- **`sample_clearance_request`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source work/sides/scope/owners, consent, fee/revenue-share order and instrument..
- **`sample_terms`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source work/sides/scope/owners, consent, fee/revenue-share order and instrument..
- **`derivative_asset_grant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source asset, granting party authority, remix/stem/bootleg route and exploitation scope..
- **`creator_licence_listing`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Work/template/price/currency/channel/use policy, owner share and state..
- **`channel_proof`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: User/licensee/provider/channel OAuth proof, instrument, request/receipt/reconciliation/state..
- **`whitelist_operation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: User/licensee/provider/channel OAuth proof, instrument, request/receipt/reconciliation/state..
- **`content_claim_case`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Claim/content/channel/instrument/provider attempts, result and escalation..
- **`subscription_grant_history`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Subscription period and future-purchase capability only; no issued-licence ownership..
- **`ai_training_consent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Share/work/purpose/scope/effective state, owner/version/supersession and transfer reset..
- **`corpus_manifest`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Deal/dataset/version/item/instrument/consent/evidence; immutable after ship..
- **`corpus_manifest_item`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Deal/dataset/version/item/instrument/consent/evidence; immutable after ship..
- **`shipped_model_use`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Corpus/model/version/ship time/owner-visible provenance; append-only..
- **`training_compensation_allocation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Deal/manifest rule/item/party/exact entitlement and B3 payout state..
- **`cover_mechanical_case`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recording/work/release/territory/eligibility/statutory-rate/accounting route..
- **`print_lyric_request`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Work/text/format/territory/quantity/use and Shard 20 negotiated instrument..

## Access Control

| Role | Allowed | Denied |
|---|---|---|
| Contributor | Own contribution sample declaration and suggestion review | Resolve/licence another owner's source |
| Work/master owner/admin | Clearance, derivative grants, creator listing, AI share consent and terms under standing | Override co-owner/source consent or issue unsupported grand rights |
| Creator licensee | Own listing purchase, channel proof, issued instrument and claim-release case | Owner policies/evidence, other channels/claims |
| Dataset buyer | Proposed manifest/terms and authorized shipped manifest | Raw refusals, undeclared works, influence attribution |
| Rights/licensing operator | Assigned provider reconciliation, manifest/route validation | Grant consent, modify issued licence, enable B3 |
| Claim/dispute reviewer | Assigned claim/relending/clearance evidence | General media/catalogue access |
| Service principal | One fingerprint/whitelist/claim/corpus job | Interactive authority or wildcard provider/store access |

### Access Escalation

- **Contributor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Work/master owner/admin:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Creator licensee:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Dataset buyer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Rights/licensing operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Claim/dispute reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Declaration, candidate review, clearance, listing, channel proof, claim release, AI consent, manifest and route classification are keyboard operable.
- Recording/composition sides, human/machine provenance, unknown source and clearance state are explicit text—not icons/color alone.
- Consent withdrawal leads with irreversible shipped uses before confirmation and preserves focus/context after step-up.
- Provider jobs expose pending/confirmed/failed/reconciling states and receipts without silent background completion.
- Exact small compensation displays full value/precision and does not round to zero in accessible summaries.

## Event Schemas

| Event | Safe payload | Consumers |
|---|---|---|
| `licensing.sample-declaration.changed.v1` | Declaration/contribution/state/version | Clearance/rights |
| `licensing.sample-clearance.changed.v1` | Request/source sides/state/version | Gate/instrument |
| `licensing.derivative-grant.changed.v1` | Grant/source asset/state/version | Projects/clearance |
| `licensing.creator-listing.changed.v1` | Listing/template/state/version | Catalogue |
| `licensing.whitelist.changed.v1` | Operation/instrument/provider/state/version | Purchase/claim reconciliation |
| `licensing.content-claim.changed.v1` | Case/instrument/state/attempt/version | Creator/support |
| `licensing.ai-consent.changed.v1` | Consent/share/purpose/state/version | Corpus gate |
| `licensing.corpus.changed.v1` | Corpus/manifest/state/item count/version | Delivery/compensation |
| `licensing.training-allocation.changed.v1` | Allocation/manifest/state/version | Accounting |
| `licensing.special-route.changed.v1` | Case/route/state/version | User tasks |

Events exclude sample/source descriptions, media, provider tokens, channel identity, claim evidence, buyer dataset details, exact compensation and refusal reasons.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Fingerprint unavailable/wrong | Human declaration continues; candidate rejection retained; never auto-clear. |
| Source unidentified forever | Declaration remains truthful; affected clearance unavailable, no expiry fabrication. |
| Sample owner declines | No negotiated clearance; instant path cannot override. |
| Interpolation includes original audio | Reclassify as sample requiring both sides. |
| Stem uploaded by possessor without authority | No grant/listing; possession never creates standing. |
| Whitelist succeeds after local timeout | Reconcile receipt before issue/purchase terminal state; no duplicate instrument. |
| Payment succeeds, whitelist fails | Purchase remains unfulfilled; void/refund/recovery according to committed transaction, never silent licence-only state. |
| Claim is correct | Explain plainly; no dishonest release request. |
| Claim relands after release | Escalate with prior receipts; never infinite retry loop. |
| Subscription ends/provider cascade fails | Issued licence and whitelist persist. |
| AI owner silent/provider race | Exclude item from corpus. |
| Consent withdrawn after ship | Future corpora exclude; shipped manifest/model record stays visible and immutable. |
| Share transfers | Prior AI consent resets refused for acquirer. |
| Tiny AI allocation | Preserve exact entitlement; no vanish/round-to-zero, payout B3-disabled. |
| Cover changes melody/lyrics materially | Compulsory route may be ineligible; route to negotiated derivative clearance. |
| Grand-right request | Explicit unsupported/WONT; never ordinary scope or auto-approve. |

## Dependency References

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]] for provider adapters/storage/jobs/audit; [[specs/ia/01-identity-authority|Shard 01]] for parties/mandates; [[specs/ia/06-trust-safety|Shard 06]] for claim/dispute evidence; [[specs/ia/09-projects-collaboration|Shard 09]] for contributions/assets; [[specs/ia/10-rights-ownership|Shard 10]] for rights/shares; [[specs/ia/20-licensing-core|Shard 20]] for scope/clearance/policy/instruments.
- **Depended on by:** distribution, accounting and claims consumers use issued instrument/manifest/allocation references only.
- **Deep dive:** [[specs/ia/deep-dives/21-specialized-licensing|Specialized licensing deep dive]].

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| SPL-01 Contributor declares sampled material | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-02 System suggests sample identity | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-03 Owner requests instant sample clearance | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-04 Owners negotiate sample terms | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-05 Creator declares replay/interpolation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-06 Rights holder grants remix/stem use | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-07 Owner opts work into creator catalogue | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-08 Creator buys micro-licence | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-09 Creator reports Content ID claim | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-10 Subscriber cancels | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-11 Owner sets AI-training decision | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-12 Dataset buyer assembles corpus | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-13 Owner withdraws AI consent | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-14 System records training compensation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| SPL-15 User clears cover/print/grand-right use | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 09:** consume [Shard 09 Contracts](09-projects-collaboration.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 09 Event Schemas](09-projects-collaboration.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 10:** consume [Shard 10 Contracts](10-rights-ownership.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 10 Event Schemas](10-rights-ownership.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 20:** consume [Shard 20 Contracts](20-licensing-core.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 20 Event Schemas](20-licensing-core.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Reconciled 21 sources; locked specialized clearance, provider, AI, statutory and WONT boundaries | `/write-architecture-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]
- [[specs/ia/deep-dives/21-specialized-licensing|Deep Dive 21 — Specialized clearances and licensing]]
