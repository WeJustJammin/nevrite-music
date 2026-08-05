# Shard 01 — Identity authority and party governance

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/01-identity-authority.md](deep-dives/01-identity-authority.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 01 owns canonical people, aliases, organizations, memberships, representations, mandates, band governance, external party identifiers, and legacy-party administration. It answers four separate questions: who authenticated, which party they are acting as, what current relationship authorizes the act, and how the resulting fact remains attributable over time. Supabase Auth proves only the first question; PostgreSQL records and guarded commands answer the rest.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 6 |
| Child capabilities reconciled | 17 |
| Source documents loaded | 24 |
| Added or removed feature boundaries | 0 |
| Enterprise identity features | Deferred; no launch dependency |
| Split handling | Parent IA plus one approved deep dive |

## Features

- **01.01 Person Identity & Roles** — one human party with simultaneous role facets; first-class aliases; explicit per-view acting context; structurally separate legal and public identity.
- **01.02 Organizations & Entity Model** — thin party spine, typed capability sets, progressive attributes, weak creation, duplicate signals, multi-type support, and non-destructive lifecycle.
- **01.03 Membership, Representation & Mandate** — time-bounded consented relationships, provenance-labelled historical assertions, scoped delegated authority, and deterministic revocation.
- **01.04 Band & Ensemble Governance** — versioned decision terms, name ownership, treasury authority, dissolution, and successor/fork behavior without deleting work.
- **01.09 Party Identifier Resolution** — namespace/capacity-aware external identifiers, verification/collision states, and fail-safe downstream routing.
- **01.10 Estates, Deceased Users & Legacy Accounts** — successor nomination, verified memorialisation, estate representation, and permanent provenance without deceased-user impersonation.

## Acceptance Criteria

- **AC-IDA-01 — Create person record:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Idempotently create one PostgreSQL person party for the verified Supabase user; matching email/name/provider text never merges people, and (6) return User owns a self acting context; zero facets is valid; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-02 — Add/remove role facet:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Change one facet per command. Add is self-asserted; removal atomically checks the facet's closed live-obligation set and never deletes history, and (6) return Version increments; affected navigation refreshes from canonical capability projection; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-03 — Create/retire/transfer alias:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create a single-owner alias with unique confusable-normalized handle and disclosed implied `performer` facet; retirement preserves history; transfer requires both people within 7 days, and (6) return Dated ownership period and permanent handle redirect are committed; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-04 — Switch acting context:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Show self, aliases, active memberships, and representations derived from current records. Switch is one deliberate tap, per tab/device, never triggered by a deep link, and (6) return Persistent text+avatar indicator updates; submit revalidates authority; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-05 — Disclose legal identity:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Require an eligible transaction, explicit audience/purpose, recent step-up, and minimum field projection, and (6) return Disclosure event records recipient, purpose, fields, version, and time; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-06 — Create organization:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Choose self-member, shadow/custodial, or external-reference mode; run bounded type-aware duplicate detection before commit without blocking creation, and (6) return One canonical party is created with ownership and lifecycle independent; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-07 — Add/remove organization type:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Owner/admin adds one type at a time; type-specific fields remain progressive and undiscoverable until their owning-domain gates pass, and (6) return Party identity/history remain unchanged; removed surfaces disappear, not records; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-08 — Invite/assert/end membership:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Prospective current authority requires invitation and acceptance; historical tenure may be asserted and labelled. End-now is immediate; retroactive end requires counterpart confirmation, and (6) return Dated tenure/capacity periods persist; revoked authority is immediate; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-09 — Create representation:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Both parties confirm explicit activities, domains, territory, term, communication grant, and any monetary ceiling, and (6) return Authority begins only on acceptance and ends automatically on expiry/revocation; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-10 — Grant/revoke mandate:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) A capable holder grants a subset of their own authority; changes are plain-language, versioned, audited, and effective immediately, and (6) return Current authority projection refreshes; existing historic facts remain; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-11 — Propose governance terms:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Draft immutable terms version; all current permanent members review the same hash/version, and (6) return Terms activate only after unanimous confirmation; otherwise prior/default rules remain; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-12 — Record name ownership:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record a versioned ownership/disposition statement and optional self-supplied trademark reference without legal verification or registry assurance, and (6) return Statement is attributable and dated; platform does not adjudicate ownership; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-13 — Use treasury authority:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Every member can view band money records; action authorization reuses the current mandate and single-payee payment boundary, and (6) return No platform-held pooled balance or multi-party distribution is implied; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-14 — Close/dissolve/re-form party:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Closure waits only on finite resolvable obligations; dissolution follows active governance rules and preserves all work. Re-forming creates a successor party with lineage, and (6) return Terminal state and dispositions are recorded; no destructive reopen; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-15 — Record external identifier:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Validate namespace format/capacity, record provenance, and attempt configured registry verification, and (6) return Identifier is labelled `self_asserted|verified|mismatch|collision|revoked`; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-16 — Resolve identifier collision:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Hold both claims, suspend verified/routing status, notify both parties, and accept withdrawal or registry-backed resolution, and (6) return Exactly one claim may become routing-eligible; history remains; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-17 — Nominate legacy successor:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Living user privately nominates an existing or invited person; nomination is evidence, not probate authority, and (6) return Versioned nomination is revocable while the nominator is alive; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-IDA-18 — Report death/memorialise:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Open a protected case; no public/auth change occurs until the counsel-approved evidence policy verifies the report, and (6) return Authority ends, public party becomes memorialised, and scoped estate representation may begin; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| IDA-01 | Create person record | Idempotently create one PostgreSQL person party for the verified Supabase user; matching email/name/provider text never merges people. | User owns a self acting context; zero facets is valid. |
| IDA-02 | Add/remove role facet | Change one facet per command. Add is self-asserted; removal atomically checks the facet's closed live-obligation set and never deletes history. | Version increments; affected navigation refreshes from canonical capability projection. |
| IDA-03 | Create/retire/transfer alias | Create a single-owner alias with unique confusable-normalized handle and disclosed implied `performer` facet; retirement preserves history; transfer requires both people within 7 days. | Dated ownership period and permanent handle redirect are committed. |
| IDA-04 | Switch acting context | Show self, aliases, active memberships, and representations derived from current records. Switch is one deliberate tap, per tab/device, never triggered by a deep link. | Persistent text+avatar indicator updates; submit revalidates authority. |
| IDA-05 | Disclose legal identity | Require an eligible transaction, explicit audience/purpose, recent step-up, and minimum field projection. | Disclosure event records recipient, purpose, fields, version, and time. |
| IDA-06 | Create organization | Choose self-member, shadow/custodial, or external-reference mode; run bounded type-aware duplicate detection before commit without blocking creation. | One canonical party is created with ownership and lifecycle independent. |
| IDA-07 | Add/remove organization type | Owner/admin adds one type at a time; type-specific fields remain progressive and undiscoverable until their owning-domain gates pass. | Party identity/history remain unchanged; removed surfaces disappear, not records. |
| IDA-08 | Invite/assert/end membership | Prospective current authority requires invitation and acceptance; historical tenure may be asserted and labelled. End-now is immediate; retroactive end requires counterpart confirmation. | Dated tenure/capacity periods persist; revoked authority is immediate. |
| IDA-09 | Create representation | Both parties confirm explicit activities, domains, territory, term, communication grant, and any monetary ceiling. | Authority begins only on acceptance and ends automatically on expiry/revocation. |
| IDA-10 | Grant/revoke mandate | A capable holder grants a subset of their own authority; changes are plain-language, versioned, audited, and effective immediately. | Current authority projection refreshes; existing historic facts remain. |
| IDA-11 | Propose governance terms | Draft immutable terms version; all current permanent members review the same hash/version. | Terms activate only after unanimous confirmation; otherwise prior/default rules remain. |
| IDA-12 | Record name ownership | Record a versioned ownership/disposition statement and optional self-supplied trademark reference without legal verification or registry assurance. | Statement is attributable and dated; platform does not adjudicate ownership. |
| IDA-13 | Use treasury authority | Every member can view band money records; action authorization reuses the current mandate and single-payee payment boundary. | No platform-held pooled balance or multi-party distribution is implied. |
| IDA-14 | Close/dissolve/re-form party | Closure waits only on finite resolvable obligations; dissolution follows active governance rules and preserves all work. Re-forming creates a successor party with lineage. | Terminal state and dispositions are recorded; no destructive reopen. |
| IDA-15 | Record external identifier | Validate namespace format/capacity, record provenance, and attempt configured registry verification. | Identifier is labelled `self_asserted\|verified\|mismatch\|collision\|revoked`. |
| IDA-16 | Resolve identifier collision | Hold both claims, suspend verified/routing status, notify both parties, and accept withdrawal or registry-backed resolution. | Exactly one claim may become routing-eligible; history remains. |
| IDA-17 | Nominate legacy successor | Living user privately nominates an existing or invited person; nomination is evidence, not probate authority. | Versioned nomination is revocable while the nominator is alive. |
| IDA-18 | Report death/memorialise | Open a protected case; no public/auth change occurs until the counsel-approved evidence policy verifies the report. | Authority ends, public party becomes memorialised, and scoped estate representation may begin. |

### Global Interaction Rules

- Every command inherits Shard 00 validation, idempotency, optimistic concurrency, error, audit, outbox, and accessibility contracts.
- One authenticated human acts as exactly one party per command. Subject party, beneficiary, recipient, or represented party are separate explicit fields.
- Acting context is bound when an interaction opens and revalidated at submit. A stale/expired mandate cannot commit even if the UI still displays it.
- Reattribution is forbidden. A wrong-context relied-upon fact is retracted/tombstoned and re-created under the correct actor.
- Third-party reliance controls reversibility: money/attestation 0 seconds; communication/publication 60 seconds; private state until another party relies.

## Contracts

### Party and Identity

| Contract | Locked rule |
|---|---|
| Canonical party | `person|alias|organization`, PostgreSQL UUID, immutable kind, explicit lifecycle/version. An alias is a party but never signs; a person/legal entity signs. |
| Facet vocabulary | Versioned platform registry initially containing `performer, writer, producer, engineer, teacher, seller, tech`; no primary facet; petitions enter a curation queue and never create live values directly. |
| Alias ownership | Exactly one owner at a time through non-overlapping dated periods. Display names are non-unique; public handles are globally unique after Unicode/confusable normalization and never reissued. |
| Legal identity | Protected fields are stored/read separately from public projections, never browser-cached, and disclosed only by purpose/audience allowlist. |
| Acting context | Derived, not configured. Stable order: up to five pins → self → aliases by creation → organizations/represented parties alphabetically; frozen while open; filter at eight contexts. |

### Organization and Relationship

| Contract | Locked rule |
|---|---|
| Organization types | Set drawn from versioned registry; launch registry includes `band, collective, studio, venue, label, agency, shop`; empty set means collective. |
| Legal multiplicity | Separate legal/payable identities are separate parties connected by affiliation. Multi-type is one party only where legal/payable identity is the same. |
| Attribute declaration | Owning domain declares scope, authority, freshness, gate, and use. Stale claims remain visible and flagged; confirm-on-use is primary. |
| Membership | One continuous tenure has date-only start/end and versioned capacity periods; authority-bearing acceptance/revocation uses exact instants. Rejoin creates a new tenure. |
| Representation | Explicit `activities × domains` conjunction plus territory and term; at least one activity/domain; `communicate` is independent. Partial overlaps warn and coexist; identical overlapping scope requires explicit acknowledgement. |
| Mandate ceiling | Seeded permanent band members receive seven commercial activities across all domains up to USD 1,000 per monetary act; communication is not seeded. Representation monetary acts require an explicit ceiling; null authorizes no monetary act. |
| Delegation | Grant cannot exceed grantor authority or term. Revocation is immediate; history and already-valid relied-upon actions survive. |

### Governance, Identifiers, and Legacy

| Contract | Locked rule |
|---|---|
| Governance source | Active unanimously confirmed terms generate the enforceable mandate/governance projection. Before activation, the disclosed platform/legal defaults remain authoritative. |
| New member | Must accept current terms version before current membership confirms and authority begins; historical asserted tenure does not imply acceptance. |
| Treasury | Record/authorization surface only at consumer launch. Stripe's compliance-cleared single payee owns funds movement; pooled funds, split routing, escrow, tax computation, and multi-party payouts remain disabled. |
| Dissolution standing | Current permanent members vote per active terms; former/non-member stakeholders receive notice and visibility, never a vote unless an active recorded term explicitly grants it. |
| Identifier routing | Self-asserted/mismatch/collision identifiers may display with labels but cannot independently route royalties or prove ownership. Provider integrations are adapter-specific and gated. |
| Estate authority | Death ends every personal mandate/session. Estate acts as itself through a representation edge; no login, signature, or attestation as the deceased. Without verified legal authority, administration remains disabled. |

## Data Models

| Model | Purpose and core fields |
|---|---|
| `PersonParty` | `id, auth_user_id?, lifecycle, public_profile_id, legal_identity_id?, version`; at most one active person per Auth UUID. |
| `RoleFacetAssertion` | `person_id, facet_code, state, source, asserted_at, removed_at?, version`; unique active person/facet. |
| `AliasParty` | `id, display_name, current_handle, lifecycle, public_link_state, version`. |
| `AliasOwnershipPeriod` | `alias_id, person_id, starts_on, ends_on?, transfer_id?`; non-overlapping; one current owner. |
| `HandleReservation` | normalized handle, party, active/redirect state, first/last use; never reusable. |
| `LegalIdentityRecord` | protected names/address/tax/KYC references plus effective periods; no public projection. |
| `LegalDisclosureEvent` | legal record/version, recipient party, purpose, disclosed field codes, actor/context, time. |
| `OrganizationParty` | `id, ownership_state, lifecycle, inferred_quiet_at?, closing_at?, version`. |
| `OrganizationTypeAssignment` | organization/type, active period, actor/version; one active row per type. |
| `MembershipTenure` | organization/person, state, provenance, start/end dates, accepted/revoked instants, version. |
| `MembershipCapacityPeriod` | tenure, capacity, start/end dates; non-overlapping within tenure. |
| `RepresentationEdge` | principal/representative parties, activities, domains, territory, term, communicate, ceiling, state/version. |
| `MandateGrant` | relationship, activities, domains resolution, ceiling, term, grantor, source/default, state/version. |
| `GovernanceTermsVersion` | band, hash, structured decisions, effective state/time, supersedes; immutable after proposal. |
| `GovernanceConfirmation` | terms version/member, decision, identity/context, time; one current decision per member/version. |
| `PartyIdentifierClaim` | party, namespace, normalized value, capacity, provenance, verification state/evidence, version. |
| `LegacyNomination` | person, successor person, state, created/revoked time, version; private. |
| `MemorialisationCase` | subject, reporter, evidence refs, state, reviewer, decision/reason, verified time. |

Model field constraints, relationships, state machines, and authority-resolution order are normative in the linked deep dive.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`PersonParty`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, auth_user_id?, lifecycle, public_profile_id, legal_identity_id?, version`; at most one active person per Auth UUID..
- **`RoleFacetAssertion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `person_id, facet_code, state, source, asserted_at, removed_at?, version`; unique active person/facet..
- **`AliasParty`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, display_name, current_handle, lifecycle, public_link_state, version`..
- **`AliasOwnershipPeriod`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `alias_id, person_id, starts_on, ends_on?, transfer_id?`; non-overlapping; one current owner..
- **`HandleReservation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: normalized handle, party, active/redirect state, first/last use; never reusable..
- **`LegalIdentityRecord`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: protected names/address/tax/KYC references plus effective periods; no public projection..
- **`LegalDisclosureEvent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: legal record/version, recipient party, purpose, disclosed field codes, actor/context, time..
- **`OrganizationParty`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `id, ownership_state, lifecycle, inferred_quiet_at?, closing_at?, version`..
- **`OrganizationTypeAssignment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: organization/type, active period, actor/version; one active row per type..
- **`MembershipTenure`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: organization/person, state, provenance, start/end dates, accepted/revoked instants, version..
- **`MembershipCapacityPeriod`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: tenure, capacity, start/end dates; non-overlapping within tenure..
- **`RepresentationEdge`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: principal/representative parties, activities, domains, territory, term, communicate, ceiling, state/version..
- **`MandateGrant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: relationship, activities, domains resolution, ceiling, term, grantor, source/default, state/version..
- **`GovernanceTermsVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: band, hash, structured decisions, effective state/time, supersedes; immutable after proposal..
- **`GovernanceConfirmation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: terms version/member, decision, identity/context, time; one current decision per member/version..
- **`PartyIdentifierClaim`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: party, namespace, normalized value, capacity, provenance, verification state/evidence, version..
- **`LegacyNomination`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: person, successor person, state, created/revoked time, version; private..
- **`MemorialisationCase`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: subject, reporter, evidence refs, state, reviewer, decision/reason, verified time..

## Access Control

| Principal/context | Allowed | Explicit denial |
|---|---|---|
| Anonymous | Read publication-approved party projections, retired redirects, and permitted memorial markers. | Legal identity, private linkage, mandates, membership assertions, nominations, cases. |
| Self person | Manage own facets, aliases, public/legal identity, successor nomination, and eligible privacy actions. | Fabricate another person's consent, transfer shared names as aliases, rewrite relied-upon history. |
| Alias context | Perform actions allowed to its current owner/mandate while attributing public identity to alias. | Contract/sign as alias; expose hidden owner linkage; transfer/retire through a mandate. |
| Organization member | Read membership/governance and act only through current accepted mandate. | Authority from membership presence alone except the explicit band seed. |
| Owner/admin | Manage types, relationships, mandates, and eligible governance proposals within current grant. | Exceed grant, erase history, silently impersonate, adjudicate disputes. |
| Representative/estate | Act only for conjoined scope, territory, term, ceiling, and communication grant. | Ownership transfer, alias disposal, deceased impersonation, unscoped/private access. |
| Platform identity operator | Review assigned collision/recovery/memorialisation case after MFA with reason/audit. | General profile browsing, legal adjudication, arbitrary party merge, direct database edits. |
| Service principal | Resolve one registered projection/event under least privilege. | Interactive authority, wildcard party access, trusting Queue/provider claims as authorization. |

Every protected read/command tests anonymous, wrong valid user, wrong party, wrong resource, expired/revoked relationship, stale version, and over-disclosure.

### Access Escalation

- **Principal/context:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Anonymous:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Self person:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Alias context:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Organization member:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Owner/admin:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Representative/estate:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Platform identity operator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Service principal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Acting party is always shown as text plus avatar; color is supplementary. Context changes are announced and focus returns to the triggering control.
- Relationship, identifier, governance, and memorial states use explicit text labels: asserted, invited, confirmed, expired, disputed, collision, pending, memorialised.
- Destructive/authority actions use a confirmation step naming acting party, target, effect, reversibility, and any third-party reliance.
- Dense membership/mandate tables provide semantic headers, keyboard sorting/filtering, responsive card equivalents, and no horizontal information loss at 200% zoom.
- Terms/mandate plain-language summaries precede structured detail; screen-reader users receive changed-field summaries before confirming a new version.
- Legal-identity disclosure names recipient, purpose, fields, and persistence before consent. Step-up interruption restores the exact prior context after success.
- Loading/error states never masquerade as empty identity, membership, balance, authority, or memorial state.

## Event Schemas

All events use Shard 00's `PlatformEvent`; payloads contain identifiers only.

| Event type | Payload | Consumer contract |
|---|---|---|
| `identity.facet.changed.v1` | `{ personId, facetCode }` | Navigation/search refetch person version. |
| `identity.alias.changed.v1` | `{ aliasId }` | Public profile, credits, redirects refetch canonical alias. |
| `identity.acting-context.revoked.v1` | `{ personId, partyId, relationshipId }` | Session/UI purges cached context; commands already revalidate. |
| `identity.organization.changed.v1` | `{ organizationId }` | Type-owned surfaces and search refetch party/type versions. |
| `identity.relationship.changed.v1` | `{ relationshipType, relationshipId }` | Authority projection, roster, audit, notifications refetch. |
| `identity.governance.activated.v1` | `{ organizationId, termsVersionId }` | Mandate projection and dependent governance consumers update idempotently. |
| `identity.identifier.changed.v1` | `{ identifierClaimId }` | Rights/royalty consumers re-evaluate routing eligibility. |
| `identity.party.memorialised.v1` | `{ personId, caseId }` | Auth/session revocation, offers/search/profile, rights and notifications refetch. |

## Edge Cases

| Case | Required result |
|---|---|
| Two provider identities appear to match one person | Never auto-merge; require control of both accounts under Shard 00 merge flow. |
| Concurrent facet add/remove | Single-facet compare-and-swap; no set replacement or lost update. |
| Facet removal has live obligations | Return conflict with obligation codes; history never blocks and never deletes. |
| Confusable/new alias handle | Reject normalized collision; display name remains allowed. |
| Alias transfer receives stale acceptance | Reject; ownership period remains unchanged; offer can be reissued. |
| Cached org context was revoked | Display may remain briefly, but submit fails closed and switches to self with explanation. |
| Deep link names another context | Preselect target only; never switch or execute without deliberate choice. |
| Duplicate organization suspected after commit timeout | Keep created party; open merge/claim offer asynchronously; never silently combine. |
| Last organization type removed | Party becomes a typeless collective; history and links persist. |
| Membership assertion rejected | Hide publicly, retain protected evidence, route dispute; grant no authority. |
| Retroactive departure contested | Current revocation remains immediate; historical date is disputed without rewriting. |
| Representation scopes partially overlap | Warn and require acknowledgement; coexist by term/territory/domain; never infer exclusivity. |
| Representation has no monetary ceiling | Non-monetary scoped acts may proceed; every monetary act fails closed/escalates. |
| Grantor loses authority | Dependent sub-grants revoke immediately; past valid actions remain attributable. |
| New member has not accepted current terms | Remains invited/pending with no authority; cannot be counted as governance confirmer. |
| Governance proposal loses a member mid-vote | Freeze proposal; recalculate required parties in a superseding version, never mutate it. |
| Dissolution has unresolved name/funds/rights | Party may be terminal with explicit unresolved dispositions; records remain accessible by policy. |
| Same identifier claimed by two parties | Both lose routing/verified status until registry-backed resolution or withdrawal. |
| Registry unavailable | Preserve local claim and prior evidence; mark verification delayed; do not downgrade verified evidence silently. |
| False/unverified death report | No public or authority change; rate-limit and route protected review. |
| Death occurs with no successor | Revoke deceased authority; preserve earnings/rights records; no estate administration until verified legal authority. |
| Estate requests public removal | Suppress optional public profile after approved case while retaining minimal citation/tombstone and third-party provenance; legal policy remains counsel-gated. |

## Surface Applicability

- **Primary**: Responsive web/PWA settings, profiles, context switcher, organization, roster, governance, identifier, and legacy-case surfaces.
- **Server**: Hono commands/queries, Supabase Auth mapping, PostgreSQL RLS/RPC authority evaluation, outbox/Queue reconciliation.
- **Deferred**: Enterprise SSO/SCIM, minor accounts, identifier procurement, registry adapters without approved contracts, multi-party payouts, probate adjudication.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| IDA-01 Create person record | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-02 Add/remove role facet | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-03 Create/retire/transfer alias | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-04 Switch acting context | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-05 Disclose legal identity | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-06 Create organization | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-07 Add/remove organization type | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-08 Invite/assert/end membership | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-09 Create representation | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-10 Grant/revoke mandate | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-11 Propose governance terms | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-12 Record name ownership | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-13 Use treasury authority | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-14 Close/dissolve/re-form party | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-15 Record external identifier | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-16 Resolve identifier collision | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-17 Nominate legacy successor | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| IDA-18 Report death/memorialise | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** Shard 00 for platform contracts.
- **Depended on by:** Shards 02–18, 20, 23–25, 27, 29–30, 37, and 39 according to the approved decomposition.
- Downstream shards reference canonical party IDs and current authority; they never duplicate identity or infer authority from profile/provider text.

## Deep Dives Needed

- [Identity authority and party governance deep dive](deep-dives/01-identity-authority.md) — field constraints, state machines, policy ordering, concurrency, counsel gates, and cross-shard contracts.

### Cross-Shard Section Contract Map

- **Shard 00 — Cross-cutting platform foundation:** consume [Shard 00 — Cross-cutting platform foundation Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 — Cross-cutting platform foundation Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **WeJammin — IA Decomposition Plan:** consume [WeJammin — IA Decomposition Plan Contracts](decomposition-plan.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [WeJammin — IA Decomposition Plan Event Schemas](decomposition-plan.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 02 — Profiles, claiming and qualifications:** consume [Shard 02 — Profiles, claiming and qualifications Contracts](02-profiles-verification.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 02 — Profiles, claiming and qualifications Event Schemas](02-profiles-verification.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-02 | Authored complete parent IA from 24 approved ideation sources | /write-architecture-spec-design | All |
| 2026-08-02 | Resolved model, authority, governance, identifier, estate, and abuse-path variance | /write-architecture-spec-deepen | Contracts, Models, Access, Events, Edge Cases |
| 2026-08-05 | A-01: repaired corrupted AC-IDA-15 to the shard's AC template and escaped the IDA-15 completion enum pipes | /resolve-ambiguity | Acceptance Criteria, Interactions |

## Dependency References

### Constrained by

- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ENGINEERING-STANDARDS|WeJammin — Engineering Standards]]
- [[specs/data-placement-strategy|WeJammin — Data Placement Strategy]]
- [[specs/ia/decomposition-plan|WeJammin — IA Decomposition Plan]]

### Constrains

- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- All declared dependent IA shards through canonical party and authority contracts.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ENGINEERING-STANDARDS|WeJammin — Engineering Standards]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
- [[specs/ia/decomposition-plan|WeJammin — IA Decomposition Plan]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
