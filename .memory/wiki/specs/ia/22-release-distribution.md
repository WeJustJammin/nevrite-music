# Shard 22 — Release and distribution lifecycle

**Status:** Complete
**Surface:** Web/PWA, governed media jobs and Phase-2 partner delivery adapters
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 22 owns release composition, per-partner validation/readiness, asset conformance, DDEX-style message generation/choreography, store/territory selection and status, release scheduling, catalogue updates/takedowns, UGC fingerprint/claim coordination, delivery-time identifiers and migration/exit. It projects canonical identity, rights, credits and assets; it never rewrites them to satisfy a partner or claims live status without store-side evidence.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 37 |
| Child capabilities | 25 |
| Build chain | Composition, metadata, readiness, asset conformance, label copy |
| Delivery chain | Partner profile, ERN/projection, choreography, store/territory status and remediation |
| Schedule/lifecycle | Lead-time windows, links/deadlines, updates, voluntary/involuntary takedown |
| Claims/exit | Fingerprint/whitelist/disputes, identifiers and catalogue migration/export |
| Provider boundary | No partner offered until Phase-2 commercial/security/conformance admission; profiles may be authored/tested without live delivery |

### Distribution Decisions

| Area | Locked decision |
|---|---|
| Release | Contains recordings, not files; membership/order are release facts, recording facts remain canonical upstream. |
| Validation | Per-partner versioned knowledge/rule/spec packs; no global valid/live flag and no canonical-value mutation. |
| Readiness | Continuously re-evaluated chase list of people/actions; rights consent/conflict/third-party restrictions gate delivery. |
| Delivery | Deterministic per-partner projection with retained message/snapshot/profile/thread; partner deliveries are independent. |
| Status | Acknowledged, accepted and live are distinct; live requires store-side confirmation and store-local clock. |
| Territory | Derived from complete rights records and exact destination/model; unresolved rights never default worldwide. |
| Dates | Delivery/release/live/original-release/first-live are distinct; platform never moves announced date automatically. |
| Lifecycle | Updates/redelivery/takedown are versioned commands; provenance survives and redelivery after takedown is new release. |
| Claims | Fingerprint registration is stricter than delivery; unresolved ownership/uncleared samples block and no dispute auto-response occurs. |
| Identifiers | One ISRC per recording forever; UPC release-scoped; assignment idempotent and survives failed delivery. |
| Exit | Export always available; imported catalogue marked asserted/not witnessed; lock-in never depends on withholding data. |

## Features

- **12.01 Release Builder & Delivery Readiness** — [ideation source](../ideation/12-release-distribution/12.01-release-builder/12.01-release-builder-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **12.02 DDEX Delivery Messaging** — [ideation source](../ideation/12-release-distribution/12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **12.03 DSP Store & Territory Management** — [ideation source](../ideation/12-release-distribution/12.03-dsp-store-territory-management/12.03-dsp-store-territory-management-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **12.04 Release Scheduling & Windows** — [ideation source](../ideation/12-release-distribution/12.04-release-scheduling-windows/12.04-release-scheduling-windows-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **12.05 Catalog Lifecycle After Release** — [ideation source](../ideation/12-release-distribution/12.05-catalog-lifecycle-after-release/12.05-catalog-lifecycle-after-release-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **12.06 Content ID & UGC Claiming** — [ideation source](../ideation/12-release-distribution/12.06-content-id-ugc-claiming/12.06-content-id-ugc-claiming-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **12.07 Identifier Assignment at Delivery** — [ideation source](../ideation/12-release-distribution/12.07-identifier-assignment-at-delivery.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **12.08 Catalog Migration & Exit** — [ideation source](../ideation/12-release-distribution/12.08-catalog-migration-exit.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-DST-01 — Owner composes release:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Add eligible recordings/licensed inclusions; set order/type/volume/focus/gapless and schedule licence-expiry obligations, and (6) return Versioned draft composition; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-02 — System validates metadata:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate canonical snapshot against selected destination knowledge version; derive per-store renderings/findings, and (6) return Blocking/advisory findings with examples; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-03 — Producer supplies assets:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Upload/choose immutable source, confirm mapping; analyze against asset spec and generate non-artistic renditions, and (6) return Conformant/unverified/blocked per target; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-04 — Owner opens readiness gate:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Resolve machine preconditions then rights/consent/conflict/third-party chase list and named actors, and (6) return Ready, blocked, exhausted or explicit override path; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-05 — Owner selects destinations/territories:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Derive per recording×territory×model×destination availability and costs from rights/profile, and (6) return Exact footprint or blocked/unknown; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-06 — Owner chooses release dates:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Compute per-partner earliest deliverable/all-windows-open and costed forfeits; user chooses date, and (6) return Versioned territory-scoped date plan; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-07 — System assigns identifiers:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) At generation, reuse/safely assign ISRCs and UPC policy; reconcile ambiguous allocation by lookup, and (6) return Immutable identifier records independent of delivery success; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-08 — System generates partner message:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Pin canonical snapshot, validation/profile version, identifier set/thread and deterministic projection; diff prior, and (6) return Retained message and plain receipt; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-09 — Delivery operator dispatches:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Verify profile certification/runtime admission; execute idempotent partner choreography per release/partner, and (6) return Sent/received/accepted/rejected/overdue/unknown; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-10 — System reconciles store status:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Order acks by partner timestamp and separately verify store-local live/preorder/territory/items, and (6) return Exception-first destination board; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-11 — Owner remediates rejection:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Translate to item/action/owner; update source or approved rendering; redeliver only rejecting partner, and (6) return New superseding message/thread step; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-12 — Owner links artist profile:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Resolve Shard 01 store artist ID, require verified Tier-A before first delivery and verify landing, and (6) return Linked/merge-chase/block; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-13 — Owner manages editorial/pre-save/timeline:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Share claim source, one-use OAuth, derive hard/soft deadlines and person-owned critical path, and (6) return Honest submitted/link/deadline states; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-14 — Owner changes release date:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) State broken promise/forfeits, update plan and pre-save partner continuity; emit event only, and (6) return New announced date; no direct fan message; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-15 — Owner updates live metadata/audio:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Classify field/store effect and approval; persist per-store plan; credit updates land canonically regardless of store, and (6) return Update/redelivery/new-version path; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-16 — Owner requests voluntary takedown:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Show irreversible losses/counts, authority and destination scope; issue takedown messages only where accepted delivery exists, and (6) return Withdrawn evidence with provenance retained; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-17 — Platform processes involuntary removal:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply legal/rights/safety evidence and narrow scope; notify basis/contest; preserve append-only claim path, and (6) return Suspended/removed with post-mortem; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-18 — Owner registers fingerprint/whitelist:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply stricter rights/sample/ownership gate; review derived whitelist and confirmed provider operation, and (6) return Registered/blocked/withdrawn/reconciling; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-19 — Artist handles UGC claim:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Show people/videos/evidence; user chooses response; unresolved conflict blocks new registration, and (6) return Release/whitelist/dispute action, never auto-response; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-DST-20 — Owner migrates/exports catalogue:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Export canonical/partner/message/identifier/assets/evidence; import marks origin/losses and reconciles IDs, and (6) return Portable package and honest witnessed boundary; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Actor and intent | System flow | Terminal outcome |
|---|---|---|---|
| DST-01 | Owner composes release | Add eligible recordings/licensed inclusions; set order/type/volume/focus/gapless and schedule licence-expiry obligations. | Versioned draft composition. |
| DST-02 | System validates metadata | Evaluate canonical snapshot against selected destination knowledge version; derive per-store renderings/findings. | Blocking/advisory findings with examples. |
| DST-03 | Producer supplies assets | Upload/choose immutable source, confirm mapping; analyze against asset spec and generate non-artistic renditions. | Conformant/unverified/blocked per target. |
| DST-04 | Owner opens readiness gate | Resolve machine preconditions then rights/consent/conflict/third-party chase list and named actors. | Ready, blocked, exhausted or explicit override path. |
| DST-05 | Owner selects destinations/territories | Derive per recording×territory×model×destination availability and costs from rights/profile. | Exact footprint or blocked/unknown. |
| DST-06 | Owner chooses release dates | Compute per-partner earliest deliverable/all-windows-open and costed forfeits; user chooses date. | Versioned territory-scoped date plan. |
| DST-07 | System assigns identifiers | At generation, reuse/safely assign ISRCs and UPC policy; reconcile ambiguous allocation by lookup. | Immutable identifier records independent of delivery success. |
| DST-08 | System generates partner message | Pin canonical snapshot, validation/profile version, identifier set/thread and deterministic projection; diff prior. | Retained message and plain receipt. |
| DST-09 | Delivery operator dispatches | Verify profile certification/runtime admission; execute idempotent partner choreography per release/partner. | Sent/received/accepted/rejected/overdue/unknown. |
| DST-10 | System reconciles store status | Order acks by partner timestamp and separately verify store-local live/preorder/territory/items. | Exception-first destination board. |
| DST-11 | Owner remediates rejection | Translate to item/action/owner; update source or approved rendering; redeliver only rejecting partner. | New superseding message/thread step. |
| DST-12 | Owner links artist profile | Resolve Shard 01 store artist ID, require verified Tier-A before first delivery and verify landing. | Linked/merge-chase/block. |
| DST-13 | Owner manages editorial/pre-save/timeline | Share claim source, one-use OAuth, derive hard/soft deadlines and person-owned critical path. | Honest submitted/link/deadline states. |
| DST-14 | Owner changes release date | State broken promise/forfeits, update plan and pre-save partner continuity; emit event only. | New announced date; no direct fan message. |
| DST-15 | Owner updates live metadata/audio | Classify field/store effect and approval; persist per-store plan; credit updates land canonically regardless of store. | Update/redelivery/new-version path. |
| DST-16 | Owner requests voluntary takedown | Show irreversible losses/counts, authority and destination scope; issue takedown messages only where accepted delivery exists. | Withdrawn evidence with provenance retained. |
| DST-17 | Platform processes involuntary removal | Apply legal/rights/safety evidence and narrow scope; notify basis/contest; preserve append-only claim path. | Suspended/removed with post-mortem. |
| DST-18 | Owner registers fingerprint/whitelist | Apply stricter rights/sample/ownership gate; review derived whitelist and confirmed provider operation. | Registered/blocked/withdrawn/reconciling. |
| DST-19 | Artist handles UGC claim | Show people/videos/evidence; user chooses response; unresolved conflict blocks new registration. | Release/whitelist/dispute action, never auto-response. |
| DST-20 | Owner migrates/exports catalogue | Export canonical/partner/message/identifier/assets/evidence; import marks origin/losses and reconciles IDs. | Portable package and honest witnessed boundary. |

### Global Interaction Rules

- Partner profile, validation rule pack and asset spec resolve from one immutable partner-knowledge version pinned at handoff.
- Partner facts are data, not hardcoded logic; no profile may require a knowingly false canonical assertion.
- Generation does not re-author or default missing facts. Readiness owns eligibility; generator validates only its output/profile.
- Delivery/contact notifications are purpose-scoped; distribution never directly messages fans.
- No external provider is considered successful without signed/verified acknowledgement or independent store-side evidence.

## Contracts

### Types and Errors

| Type | Contract |
|---|---|
| `ReleaseState` | `draft`, `gating`, `ready`, `scheduled`, `delivering`, `partial`, `live`, `suspended`, `withdrawn`, `archived`. |
| `DestinationState` | `not_selected`, `queued`, `sent`, `received`, `accepted`, `rejected`, `live_preorder`, `live`, `partial`, `overdue`, `unknown`, `withdrawn`, `removed`. |
| `ReadinessState` | `machine_blocked`, `social_blocked`, `exhausted`, `ready`, `overridden`; override never changes records. |
| `IdentifierProvenance` | `platform`, `artist`, `third_party`; supplied IDs are asserted/well-formed, not globally verified. |
| Errors | `RECORDING_INELIGIBLE`, `RIGHTS_UNRESOLVED`, `RELEASE_CONSENT_REQUIRED`, `THIRD_PARTY_CLEARANCE_REQUIRED`, `PARTNER_RULE_BLOCKED`, `ASSET_UNANALYSABLE`, `TERRITORY_UNKNOWN`, `PROFILE_UNCERTIFIED`, `ARTIST_LINK_REQUIRED`, `DELIVERY_SNAPSHOT_STALE`, `MESSAGE_SEQUENCE_CONFLICT`, `ACK_QUARANTINED`, `IDENTIFIER_CONFLICT`, `TAKEDOWN_NOT_DELIVERED`, `CLAIM_REGISTRATION_BLOCKED`. |

### Build, Delivery and Lifecycle Contracts

| Contract | Rule |
|---|---|
| `AddReleaseRecording` | Recording/right or licensed-inclusion eligibility; immutable origin; add-time snapshot and delivery-time recheck. |
| `EvaluateReadiness` | Per target machine gate then social chase list; master consent/conflict and third-party rights block, publishing split routes registration. |
| `DeriveDestinationFootprint` | Rights-complete basis, track/release constraints, territory/model/destination and profile capabilities; no worldwide fallback. |
| `AnalyzeReleaseAsset` | Immutable source, `(asset version × spec version)` findings and derived target rendition without artistic alteration. |
| `GenerateDeliveryMessage` | Pure deterministic snapshot/profile projection, message thread/supersession, retained bytes and unexpected-delta acknowledgement. |
| `DispatchDelivery` | Certified admitted profile, idempotent `(message, step)`, no blind resend, partner-business-day window and quarantine. |
| `ConfirmStoreLive` | Independent store-side evidence, local time and exact territory/item; partner ack never implies live. |
| `RedeliverRelease` | Persisted per-store plan, owner Full approval for destructive effect and idempotent recovery. |
| `AssignISRC` | Unique recording assignment/reuse, registrant/year atomic allocation and ambiguity lookup; never rollback. |
| `AssignUPC` | Release/version policy; redelivery after takedown gets new UPC while retaining ISRCs. |
| `ExportCatalogue` | Always available asynchronous package with manifests/checksums/provenance and no artificial lock-in. |

## Data Models

| Model | Relationships and invariants |
|---|---|
| `release` / `release_version` | Owner, type, label copy, distributor statement, dates/state; immutable published versions. |
| `release_recording_membership` | Recording, order/volume/focus, origin, eligibility snapshot and licence-expiry obligation. |
| `partner_knowledge_version` | Partner/destination/release type/ERN/deal/territory key, certification, rule/profile/spec data. |
| `release_finding` | Release/recording/field/asset, destination, severity/evidence/example/remedy and state. |
| `delivery_readiness_item` | Target/kind/source entity/actor/state/version/exhaustion/override disclosure. |
| `destination_selection` | Destination/store/territory/model, rights basis, exclusions/cost and state. |
| `release_date_plan` | Destination/territory delivery/release/live dates, lead/window evidence and forfeits. |
| `delivery_snapshot` / `delivery_message` | Canonical versions, knowledge version, identifiers, thread/message/supersession/hash/bytes. |
| `delivery_step` / `partner_ack` | Message/step/idempotency, provider timestamps, quarantine/state/attempts/expected window. |
| `store_status` | Release/store/territory/item, requested/accepted/live/withdrawn state, evidence/local time/version. |
| `store_artist_link` | Shard 01 artist/destination ID, verified/asserted tier, claim/merge state. |
| `release_asset_analysis` / `asset_rendition` | Source object/spec version/metrics/findings and derived immutable target object. |
| `release_change_plan` | Requested field/asset changes, per-store effect/cost/approval/state/recovery. |
| `catalogue_lifecycle_command` | Voluntary/involuntary update/takedown/suspension scope, evidence, actor and state. |
| `fingerprint_registration` / `ugc_whitelist` | Recording/provider/rights gate, whitelist source/review/operation/state. |
| `ugc_claim_case` | Provider/content/claim/parties/evidence/user decisions and dispute lifecycle. |
| `recording_identifier` / `release_identifier` | ISRC/UPC, provenance/source, assignment state and collision evidence. |
| `catalogue_export_job` / `import_manifest` | Scope, objects/records/checksums/provenance/loss disclosures and state. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`release`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner, type, label copy, distributor statement, dates/state; immutable published versions..
- **`release_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner, type, label copy, distributor statement, dates/state; immutable published versions..
- **`release_recording_membership`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recording, order/volume/focus, origin, eligibility snapshot and licence-expiry obligation..
- **`partner_knowledge_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Partner/destination/release type/ERN/deal/territory key, certification, rule/profile/spec data..
- **`release_finding`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Release/recording/field/asset, destination, severity/evidence/example/remedy and state..
- **`delivery_readiness_item`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Target/kind/source entity/actor/state/version/exhaustion/override disclosure..
- **`destination_selection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Destination/store/territory/model, rights basis, exclusions/cost and state..
- **`release_date_plan`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Destination/territory delivery/release/live dates, lead/window evidence and forfeits..
- **`delivery_snapshot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Canonical versions, knowledge version, identifiers, thread/message/supersession/hash/bytes..
- **`delivery_message`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Canonical versions, knowledge version, identifiers, thread/message/supersession/hash/bytes..
- **`delivery_step`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Message/step/idempotency, provider timestamps, quarantine/state/attempts/expected window..
- **`partner_ack`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Message/step/idempotency, provider timestamps, quarantine/state/attempts/expected window..
- **`store_status`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Release/store/territory/item, requested/accepted/live/withdrawn state, evidence/local time/version..
- **`store_artist_link`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Shard 01 artist/destination ID, verified/asserted tier, claim/merge state..
- **`release_asset_analysis`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source object/spec version/metrics/findings and derived immutable target object..
- **`asset_rendition`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source object/spec version/metrics/findings and derived immutable target object..
- **`release_change_plan`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Requested field/asset changes, per-store effect/cost/approval/state/recovery..
- **`catalogue_lifecycle_command`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Voluntary/involuntary update/takedown/suspension scope, evidence, actor and state..
- **`fingerprint_registration`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recording/provider/rights gate, whitelist source/review/operation/state..
- **`ugc_whitelist`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recording/provider/rights gate, whitelist source/review/operation/state..
- **`ugc_claim_case`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Provider/content/claim/parties/evidence/user decisions and dispute lifecycle..
- **`recording_identifier`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: ISRC/UPC, provenance/source, assignment state and collision evidence..
- **`release_identifier`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: ISRC/UPC, provenance/source, assignment state and collision evidence..
- **`catalogue_export_job`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scope, objects/records/checksums/provenance/loss disclosures and state..
- **`import_manifest`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Scope, objects/records/checksums/provenance/loss disclosures and state..

## Access Control

| Role | Allowed | Denied |
|---|---|---|
| Release owner/admin | Compose, destination/date choice, delivery/update/takedown/export under authority | Rewrite recording rights/credits or force partner state |
| Co-owner/contributor | Own readiness/consent item, footprint notice and change request | Release edit/delivery/takedown without mandate |
| Producer | Asset conformance/replacement request and recording identity question | Owner approval or rights overrides |
| Delivery operator | Assigned profile, queue, acknowledgement, triage and recovery operations | Canonical content edits, false live state, owner override |
| Partner adapter principal | One destination/message/thread callback scope | Other partners/releases, party authority |
| Rights/safety reviewer | Assigned suspension/claim evidence and narrow command | General catalogue/media browsing |
| Support | Minimum status/request-ID projection and named recovery | Raw messages/media/legal evidence by default |

### Access Escalation

- **Release owner/admin:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Co-owner/contributor:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Producer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Delivery operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Partner adapter principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Rights/safety reviewer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Support:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Builder, findings, chase list, destination map/list, date plan, delivery board, remediation, takedown, claims and export are keyboard operable.
- Findings expose partner/item/severity/evidence/remedy in text; advisories collapse separately from blockers.
- Store status distinguishes requested/received/accepted/preorder/live/unknown/withdrawn/removed without color-only meaning.
- Timelines provide tables and person-owned critical path; dates include destination timezone and evidence basis.
- Irreversible takedown/change confirmation lists concrete losses before action and preserves focus after step-up.
- Long jobs expose resumable status, exact scope and safe retry; no spinner implies success.

## Event Schemas

| Event | Safe payload | Consumers |
|---|---|---|
| `distribution.release.changed.v1` | Release/state/version | Projects/CMS |
| `distribution.readiness.changed.v1` | Release/target/state/blocker class/version | Owner/tasks |
| `distribution.footprint.changed.v1` | Release/destination/territory-state/version | Rights/pre-save |
| `distribution.date-plan.changed.v1` | Release/territory/state/version | Promotion |
| `distribution.message.changed.v1` | Message/partner/thread/state/version | Delivery |
| `distribution.destination-status.changed.v1` | Release/store/territory/state/version | Board/alerts |
| `distribution.catalogue-lifecycle.changed.v1` | Release/command/scope/state/version | Stores/claims |
| `distribution.ugc-registration.changed.v1` | Recording/provider/state/version | Claims/licensing |
| `distribution.identifier.changed.v1` | Recording-or-release/id-kind/state/version | Rights/royalties |
| `distribution.export.changed.v1` | Job/scope/state/version | User tasks |

Events exclude message/media bytes, partner secrets, private rights evidence, exact dates before announcement, claim detail and export URLs.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Rights drift before dispatch | Halt, diff and re-run gate; never deliver stale snapshot. |
| Partner rule differs from canonical | Derive per-store rendering; never mutate canonical fact. |
| Profile gap/model gap | Attribute platform failure, suspend new delivery and repair/certify; do not blame artist. |
| Asset analysis fails three times | `unanalysable`, manual retry and target uncertainty; never false pass. |
| Message regenerated unexpectedly | Diff and require acknowledgement before handoff. |
| Ack out of order | Retain history by partner timestamp; never regress state. |
| Partner accepts but store not live | Accepted/live-wait; no live claim. |
| Store silent into date | T−24h forced choice; default announced date stands, no automatic move/redelivery. |
| Mixed item outcome | Partial row with structured rejected items; scoped redelivery only. |
| Artist ID asserted but not verified | First delivery blocked; Trust & Safety/merge chase. |
| Voluntary takedown before accepted delivery | Cancel queued thread; no invalid takedown message. |
| Metadata update replaces master | Ask same recording/new version; never silently reuse identity. |
| Unresolved ownership conflict | Block fingerprint registration across supported platforms. |
| Identifier allocation timeout | Lookup/reconcile, never second blind allocation. |
| Import has same ISRC with conflicting holder | Block and route Shard 06/10; do not merge. |
| User exits | Export remains available; partner access revocation cannot erase canonical provenance. |

## Dependency References

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]] for media/jobs/settings/provider admission/audit; [[specs/ia/01-identity-authority|Shard 01]] for parties/store IDs; [[specs/ia/02-profiles-verification|Shard 02]] for credits; [[specs/ia/06-trust-safety|Shard 06]] for suspensions/claims; [[specs/ia/09-projects-collaboration|Shard 09]] for recordings/releases/assets; [[specs/ia/10-rights-ownership|Shard 10]] for rights/consent; [[specs/ia/20-licensing-core|Shard 20]] for licensed inclusions.
- **Depended on by:** reporting, promotion, analytics and fan surfaces consume announced/live/store/identifier facts only.
- **Deep dive:** [[specs/ia/deep-dives/22-release-distribution|Release distribution deep dive]].

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| DST-01 Owner composes release | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-02 System validates metadata | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-03 Producer supplies assets | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-04 Owner opens readiness gate | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-05 Owner selects destinations/territories | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-06 Owner chooses release dates | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-07 System assigns identifiers | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-08 System generates partner message | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-09 Delivery operator dispatches | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-10 System reconciles store status | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-11 Owner remediates rejection | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-12 Owner links artist profile | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-13 Owner manages editorial/pre-save/timeline | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-14 Owner changes release date | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-15 Owner updates live metadata/audio | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-16 Owner requests voluntary takedown | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-17 Platform processes involuntary removal | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-18 Owner registers fingerprint/whitelist | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-19 Artist handles UGC claim | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| DST-20 Owner migrates/exports catalogue | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01:** consume [Shard 01 Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 02:** consume [Shard 02 Contracts](02-profiles-verification.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 02 Event Schemas](02-profiles-verification.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 09:** consume [Shard 09 Contracts](09-projects-collaboration.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 09 Event Schemas](09-projects-collaboration.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 10:** consume [Shard 10 Contracts](10-rights-ownership.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 10 Event Schemas](10-rights-ownership.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 20:** consume [Shard 20 Contracts](20-licensing-core.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 20 Event Schemas](20-licensing-core.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Source |
|---|---|---|
| 2026-08-03 | Reconciled 37 sources; locked release, partner, delivery, lifecycle, identifier and exit contracts | `/write-architecture-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/20-licensing-core|Shard 20 — Licensing core and instrument lifecycle]]
- [[specs/ia/deep-dives/22-release-distribution|Deep Dive 22 — Release and distribution lifecycle]]
