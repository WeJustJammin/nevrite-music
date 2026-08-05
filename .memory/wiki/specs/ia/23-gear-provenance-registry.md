# Shard 23 — Gear identity, provenance and recovery

**Status:** Complete
**Surface:** Web/PWA, private evidence storage and public bounded lookup
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 23 owns gear identity records, claims/transfers/provenance views, identity continuity, theft flags/screening/sightings/disputes, service/modification history, valuation/appraisal/insurance claim packs and producer-attested gear discography. It preserves evidence and contests without adjudicating legal title, exposing possession/location or treating missing history as proof.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 21 |
| Child capabilities | 15 |
| Identity chain | Record/serial, ownership claim, transfer, chain view, non-serialized identity and modification continuity |
| Recovery chain | Theft flag, point-of-transfer screening, sightings and false-flag lifecycle |
| Evidence chain | Service history, valuation/appraisal/insurance pack and gear discography |
| Privacy boundary | Public lookup exposes bounded status/provenance; evidence, exact possession, owner contact and sightings remain protected |

### Registry Decisions

| Area | Locked decision |
|---|---|
| Identity | Minting is not ownership. Record intent is owned/held/observed; historical facts append and never terminally delete. |
| Keys | Manufacturer/model/serial plus secondary identifiers/locations form composite identity; WJ-ID is weaker and stated as such. |
| Claims | Evidence tiers recompute and may fall; silence is neutral; contests are surfaced, not adjudicated. |
| Transfer | Marketplace completion starts handshake; off-platform manual handshake is fallback; reversal is new event. |
| Theft | Flag may be filed without police reference; screening requires full composite key and fails closed at transfer. |
| Recovery | Possessor treated as potential victim; all contact brokered; sightings private. |
| History | Service/modification/original components are append-only facts; absence proves nothing. |
| Valuation | Estimate withheld below governed evidence threshold and always shows sample/recency; appraisal remains distinct/private. |
| Insurance | Generate evidence document/claim pack only; no insurer submission or coverage promise. |
| Discography | Producer-attested gear-use link inherits underlying credit visibility/status and never widens it. |

## Features

- **15.01 Instrument Identity & Provenance** — [ideation source](../ideation/15-gear-registry-ownership/15.01-instrument-identity-provenance/15.01-instrument-identity-provenance-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **15.02 Stolen Gear Registry & Recovery** — [ideation source](../ideation/15-gear-registry-ownership/15.02-stolen-gear-registry-recovery/15.02-stolen-gear-registry-recovery-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **15.03 Service, Repair & Modification History** — [ideation source](../ideation/15-gear-registry-ownership/15.03-service-repair-modification-history.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **15.05 Valuation, Appraisal & Insurance** — [ideation source](../ideation/15-gear-registry-ownership/15.05-valuation-appraisal-insurance/15.05-valuation-appraisal-insurance-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **15.09 Gear Discography** — [ideation source](../ideation/15-gear-registry-ownership/15.09-gear-discography.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-GPR-01 — User mints gear record:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Choose owned/held/observed intent; resolve entity context and composite key, including no-object path, and (6) return New record or contested-key route; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-02 — User corrects/adds identifier:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Classify typo correction versus physical serial/component change; preserve reliance/history, and (6) return Superseding identity fact; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-03 — Person claims ownership:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Submit purpose-limited evidence and relationship; notify current claimants; compute evidence tier, and (6) return Confirmed/provisional/contested claim, never title judgment; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-04 — Buyer/seller transfers ownership:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Marketplace event or manual two-party handshake; screen theft flag at transfer and record custody/consideration evidence reference, and (6) return New chain event or blocked/contested transfer; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-05 — User views provenance:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Derive chain from immutable identity/claim/transfer/service/theft events under viewer projection, and (6) return Evidence-labelled history plus “does not prove title” disclosure; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-06 — Parties resolve duplicate records:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Detect same composite key; notify claimants; require mutual consent/reviewer policy, never auto-merge, and (6) return Linked/merged-under-audit or indefinitely separate; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-07 — Owner reports theft:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Bulk select case/rig/items; append flag, loss context and optional police reference/evidence, and (6) return Active flag with evidence strength; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-08 — Buyer/marketplace screens serial:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) At transfer load full composite key and active/disputed flag state; unavailable check blocks, and (6) return Clear/no-match, flagged, disputed or cannot-check; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-09 — Person reports sighting:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Submit minimum location/time/evidence privately; moderate abuse and broker safe contact, and (6) return Protected sighting/case action; no public location; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-10 — Claimant contests false flag:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Attach evidence; lifecycle marks disputed everywhere and routes Shard 06 case, and (6) return Disputed/withdrawn/upheld/stale, with history retained; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-11 — Service provider records work:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Consume completed Shard 14/05 work order, parts/measurements/evidence and owner approval, and (6) return Append service/modification event; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-12 — Owner records manual modification:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Identify component/removal/replacement and originality provenance without claiming whole-item originality, and (6) return Versioned component state; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-13 — Owner requests valuation:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Match exact normalized configuration/condition/location/time against eligible comps and threshold, and (6) return Evidence-labelled range or no estimate; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-14 — Appraiser issues appraisal:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Verify appraiser identity/mandate, snapshot gear/configuration and private document/effective date, and (6) return Immutable appraisal distinct from estimate; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-15 — Owner builds insurance claim pack:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Select items/evidence/appraisals/purchases/service/photos/gaps and generate signed manifest/document, and (6) return Downloadable pack; no insurer transmission; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-GPR-16 — Producer attests gear use:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) From an eligible credit/session, select gear identity and role/use; bind to attesting Producer, and (6) return Private/public link follows credit status/visibility; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Actor and intent | System flow | Terminal outcome |
|---|---|---|---|
| GPR-01 | User mints gear record | Choose owned/held/observed intent; resolve entity context and composite key, including no-object path. | New record or contested-key route. |
| GPR-02 | User corrects/adds identifier | Classify typo correction versus physical serial/component change; preserve reliance/history. | Superseding identity fact. |
| GPR-03 | Person claims ownership | Submit purpose-limited evidence and relationship; notify current claimants; compute evidence tier. | Confirmed/provisional/contested claim, never title judgment. |
| GPR-04 | Buyer/seller transfers ownership | Marketplace event or manual two-party handshake; screen theft flag at transfer and record custody/consideration evidence reference. | New chain event or blocked/contested transfer. |
| GPR-05 | User views provenance | Derive chain from immutable identity/claim/transfer/service/theft events under viewer projection. | Evidence-labelled history plus “does not prove title” disclosure. |
| GPR-06 | Parties resolve duplicate records | Detect same composite key; notify claimants; require mutual consent/reviewer policy, never auto-merge. | Linked/merged-under-audit or indefinitely separate. |
| GPR-07 | Owner reports theft | Bulk select case/rig/items; append flag, loss context and optional police reference/evidence. | Active flag with evidence strength. |
| GPR-08 | Buyer/marketplace screens serial | At transfer load full composite key and active/disputed flag state; unavailable check blocks. | Clear/no-match, flagged, disputed or cannot-check. |
| GPR-09 | Person reports sighting | Submit minimum location/time/evidence privately; moderate abuse and broker safe contact. | Protected sighting/case action; no public location. |
| GPR-10 | Claimant contests false flag | Attach evidence; lifecycle marks disputed everywhere and routes Shard 06 case. | Disputed/withdrawn/upheld/stale, with history retained. |
| GPR-11 | Service provider records work | Consume completed Shard 14/05 work order, parts/measurements/evidence and owner approval. | Append service/modification event. |
| GPR-12 | Owner records manual modification | Identify component/removal/replacement and originality provenance without claiming whole-item originality. | Versioned component state. |
| GPR-13 | Owner requests valuation | Match exact normalized configuration/condition/location/time against eligible comps and threshold. | Evidence-labelled range or no estimate. |
| GPR-14 | Appraiser issues appraisal | Verify appraiser identity/mandate, snapshot gear/configuration and private document/effective date. | Immutable appraisal distinct from estimate. |
| GPR-15 | Owner builds insurance claim pack | Select items/evidence/appraisals/purchases/service/photos/gaps and generate signed manifest/document. | Downloadable pack; no insurer transmission. |
| GPR-16 | Producer attests gear use | From an eligible credit/session, select gear identity and role/use; bind to attesting Producer. | Private/public link follows credit status/visibility. |

### Global Interaction Rules

- Gear identity, physical possession, legal ownership claim, marketplace custody and title are distinct.
- A flagged serial may still be minted to preserve evidence; mint notifies protected parties and never grants authority.
- Public serial lookup is rate/precision limited and returns status without claimant identity, contact, exact location or evidence.
- Claims, flags, appraisals and insurance evidence never become marketplace guarantees.
- Erasure can remove public/contact projections while relied-upon pseudonymous chain/audit facts follow legal retention.

## Contracts

### Types and Errors

| Type | Contract |
|---|---|
| `GearIntent` | `owned`, `held`, `observed`; controls capabilities and never implies title. |
| `IdentityConfidence` | Canonical value set from exact composite/secondary/visual/WJ-ID evidence; separate from ownership strength. |
| `ClaimState` | `asserted`, `provisional`, `confirmed`, `contested`, `superseded`, `withdrawn`; recomputable downward. |
| `TheftFlagState` | `active`, `stale`, `disputed`, `withdrawn`, `resolved`; disputed never renders stolen. |
| `AssetLifecycle` | No terminal deletion; destroyed/lost/recovered/restored are append-only reversible facts where evidence changes. |
| Errors | `IDENTITY_KEY_INCOMPLETE`, `IDENTITY_KEY_CONFLICT`, `ENTITY_CONTEXT_REQUIRED`, `CLAIM_EVIDENCE_REQUIRED`, `CLAIM_CONTESTED`, `TRANSFER_SCREEN_REQUIRED`, `FLAG_MATCHED`, `FLAG_DISPUTED`, `SCREENING_UNAVAILABLE`, `MERGE_CONSENT_REQUIRED`, `VALUATION_INSUFFICIENT_EVIDENCE`, `APPRAISAL_PRIVATE`, `DISCography_CREDIT_INELIGIBLE`. |

### Registry, Recovery and Evidence Contracts

| Contract | Rule |
|---|---|
| `MintGearRecord` | Intent/entity/composite identity/origin; no-object allowed; key resolution failure blocks; flagged match records/alerts, not mint denial. |
| `CorrectGearIdentity` | Free only while no reliance; otherwise superseding correction/change event and affected-party notification. |
| `SubmitOwnershipClaim` | Evidence/relationship/period and verified actor; platform computes tier but never adjudicates title. |
| `TransferGear` | Expected current claim/custody, full theft screen, both-party/provider evidence and append-only transfer/reversal. |
| `FileTheftFlag` | Reporter standing, item/case/bulk scope, loss facts and optional police reference; lifecycle system controlled. |
| `ScreenGearAtTransfer` | Full composite key only; partial is not-screenable and cannot query/hit/notify; dependency failure blocks. |
| `ReportSighting` | Protected minimum facts, abuse review, brokered communication and no direct owner/possessor disclosure. |
| `AppendServiceEvent` | Gear/config version, work/parts/provider/evidence; corrections supersede. |
| `EstimateGearValue` | Eligible comp policy/threshold, normalized configuration, range, sample size/recency and caveats; no estimate under floor. |
| `IssueAppraisal` | Appraiser/snapshot/value/currency/effective/expiry/document; private and never overwrites estimate. |
| `BuildInsurancePack` | Deterministic selected evidence manifest, gaps and checksum; user transmits externally. |
| `AttestGearUse` | Producer-attested eligible credit/session, gear identity/use; projection inherits exact credit status/visibility. |

## Data Models

| Model | Relationships and invariants |
|---|---|
| `gear_record` | WJ-ID, intent, attributed party/entity, lifecycle/version and creation origin. |
| `gear_identity_key` / `gear_identifier_fact` | Manufacturer/model/serial/secondary/location/type, source/effective/supersession and confidence. |
| `gear_claim` / `claim_evidence` | Claimant/relationship/period/state/tier/evidence/provenance; protected. |
| `gear_chain_event` | Identity/claim/transfer/correction/merge/lifecycle event, actor/basis/time/version; immutable. |
| `gear_transfer` | From/to parties, marketplace/manual source, screen result, custody/transaction refs and reversal relation. |
| `gear_duplicate_case` | Candidate records/key/confidence/claimants/consents/reviewer/state; no auto-merge. |
| `theft_case` / `theft_flag` | Reporter/items/loss facts/police ref/evidence/state/staleness and dispute case. |
| `gear_screening` | Transfer/key version/dependency result/flag projection/time; immutable decision evidence. |
| `gear_sighting` | Flag/reporter/time/coarse+protected location/evidence/moderation/state. |
| `service_event` / `component_fact` | Gear/config/work/provider/parts/measurements/evidence/originality source and supersession. |
| `valuation_estimate` | Gear/config/condition/market/time/comps/range/currency/sample/recency/policy version. |
| `appraisal_record` | Appraiser/gear snapshot/value/currency/effective/expiry/document/object/version; owner-private. |
| `insurance_pack` | Owner/item snapshots/evidence refs/gaps/manifest/document/hash/time/version. |
| `gear_credit_link` | Gear/credit/session/producer/use/state; visibility/status derived from credit. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`gear_record`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: WJ-ID, intent, attributed party/entity, lifecycle/version and creation origin..
- **`gear_identity_key`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Manufacturer/model/serial/secondary/location/type, source/effective/supersession and confidence..
- **`gear_identifier_fact`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Manufacturer/model/serial/secondary/location/type, source/effective/supersession and confidence..
- **`gear_claim`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Claimant/relationship/period/state/tier/evidence/provenance; protected..
- **`claim_evidence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Claimant/relationship/period/state/tier/evidence/provenance; protected..
- **`gear_chain_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Identity/claim/transfer/correction/merge/lifecycle event, actor/basis/time/version; immutable..
- **`gear_transfer`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: From/to parties, marketplace/manual source, screen result, custody/transaction refs and reversal relation..
- **`gear_duplicate_case`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Candidate records/key/confidence/claimants/consents/reviewer/state; no auto-merge..
- **`theft_case`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Reporter/items/loss facts/police ref/evidence/state/staleness and dispute case..
- **`theft_flag`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Reporter/items/loss facts/police ref/evidence/state/staleness and dispute case..
- **`gear_screening`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Transfer/key version/dependency result/flag projection/time; immutable decision evidence..
- **`gear_sighting`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Flag/reporter/time/coarse+protected location/evidence/moderation/state..
- **`service_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Gear/config/work/provider/parts/measurements/evidence/originality source and supersession..
- **`component_fact`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Gear/config/work/provider/parts/measurements/evidence/originality source and supersession..
- **`valuation_estimate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Gear/config/condition/market/time/comps/range/currency/sample/recency/policy version..
- **`appraisal_record`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Appraiser/gear snapshot/value/currency/effective/expiry/document/object/version; owner-private..
- **`insurance_pack`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner/item snapshots/evidence refs/gaps/manifest/document/hash/time/version..
- **`gear_credit_link`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Gear/credit/session/producer/use/state; visibility/status derived from credit..

## Access Control

| Role | Allowed | Denied |
|---|---|---|
| Public visitor | Bounded identity/provenance/status projection and serial screening | Owner identity/contact, exact possession/location, evidence/appraisal |
| Claimant/owner | Own claim/evidence, transfers, theft case, service/appraisal/pack and visibility | Adjudicate competing title or see protected sighting reporter |
| Holder/possessor | Held record, own transfer/sighting/dispute communication through broker | Owner contact/exact evidence unless explicitly shared |
| Service provider/appraiser | Mandate-scoped event/appraisal creation and own artifact | Ownership change, unrelated history/private packs |
| Producer | Eligible gear-use attestation/correction through credit path | Owner assertion or visibility widening |
| Marketplace operator | Point-of-transfer screen and transaction-scoped result | General theft/evidence browsing |
| Safety/dispute reviewer | Assigned theft/false-flag/sighting/merge case projection | Universal registry/evidence access |
| Service principal | One screen/valuation/render/notification purpose | Interactive authority or wildcard evidence access |

### Access Escalation

- **Public visitor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Claimant/owner:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Holder/possessor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service provider/appraiser:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Producer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Marketplace operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Safety/dispute reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Mint, claim, transfer, chain, theft, screening, service, valuation, appraisal, pack and discography flows are keyboard operable.
- Identity confidence and ownership strength are separate text labels, never one color/score.
- Flagged/disputed/stale/withdrawn/cannot-check states use explicit wording and do not label a possessor criminal.
- Provenance timelines have equivalent ordered tables with evidence basis and “does not prove” disclosures.
- Claim packs list missing evidence accessibly; estimates expose range/sample/recency before visual charts.
- Brokered communication and step-up restore exact context/focus.

## Event Schemas

| Event | Safe payload | Consumers |
|---|---|---|
| `gear.identity.changed.v1` | Gear/key/state/confidence/version | Registry/marketplace |
| `gear.claim.changed.v1` | Gear/claimant pseudonym/state/tier/version | Chain/transfer |
| `gear.transfer.changed.v1` | Gear/transfer/state/version | Chain/marketplace |
| `gear.theft-flag.changed.v1` | Gear/flag/state/weight class/version | Screening/cases |
| `gear.sighting.changed.v1` | Case/sighting/state/version | Protected recovery |
| `gear.service.changed.v1` | Gear/event/config state/version | History/valuation |
| `gear.valuation.changed.v1` | Gear/estimate state/evidence class/version | Owner |
| `gear.appraisal.changed.v1` | Gear/appraisal state/version | Owner/pack |
| `gear.insurance-pack.changed.v1` | Pack/state/version | Owner job |
| `gear.credit-link.changed.v1` | Gear/credit/state/version | Discography |

Events exclude serials, locations, names/contact, evidence/documents, values, police references and private service detail.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Object absent during mint | Allow observed/claimed record with explicit evidence weakness. |
| Serial typo after marketplace reliance | Superseding correction, not destructive edit; notify affected records/parties. |
| Two records same key | Retain both, notify claimants, no auto-merge. |
| Non-serialized item key incomplete | Block mint; WJ-ID never substitutes incomplete canonical key silently. |
| Prior owner silent | Neutral; no evidence downgrade solely for silence. |
| Flag exists during mint | Mint/protect evidence and notify; authority unchanged. |
| Partial serial at checkout | Not-screenable and transfer cannot complete where screening required. |
| Screening provider/database unavailable | Explicit cannot-check and block transfer. |
| Flag contested | Render disputed everywhere indefinitely until lifecycle evidence changes. |
| Sighting could enable confrontation | Hide direct contact/location; broker and safety review. |
| Modification removes serial-bearing component | Preserve original key history and append replacement/component identity fact. |
| No service history | Say no history recorded, never never-serviced. |
| Sparse/stale comps | Withhold estimate instead of fabricated wide range. |
| Appraisal expired | Preserve record, warn owner, never silently treat estimate as appraisal. |
| Credit disputed/hidden | Suppress gear link and hidden-link count. |

## Dependency References

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]] for storage/jobs/settings/audit; [[specs/ia/01-identity-authority|Shard 01]] for parties/entities; [[specs/ia/02-profiles-verification|Shard 02]] for credit visibility/correction; [[specs/ia/06-trust-safety|Shard 06]] for theft/false-flag/sighting disputes; [[specs/ia/14-services-marketplace|Shard 14]] for service/transaction facts.
- **Depended on by:** gear marketplace, logistics, insurance-support, studio/backline and analytics consume bounded identity/status events only.
- **Deep dive:** [[specs/ia/deep-dives/23-gear-provenance-registry|Gear provenance deep dive]].

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| GPR-01 User mints gear record | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-02 User corrects/adds identifier | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-03 Person claims ownership | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-04 Buyer/seller transfers ownership | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-05 User views provenance | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-06 Parties resolve duplicate records | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-07 Owner reports theft | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-08 Buyer/marketplace screens serial | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-09 Person reports sighting | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-10 Claimant contests false flag | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-11 Service provider records work | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-12 Owner records manual modification | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-13 Owner requests valuation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-14 Appraiser issues appraisal | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-15 Owner builds insurance claim pack | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| GPR-16 Producer attests gear use | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 02:** consume [Shard 02 Contracts](02-profiles-verification.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 02 Event Schemas](02-profiles-verification.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 14:** consume [Shard 14 Contracts](14-services-marketplace.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 14 Event Schemas](14-services-marketplace.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Reconciled 21 sources; locked gear identity, claims, recovery, evidence, valuation and discography contracts | `/write-architecture-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/deep-dives/23-gear-provenance-registry|Deep Dive 23 — Gear identity, provenance and recovery]]
