# Shard 24 — Gear collections, rigs, custody and manifests

**Status:** Complete
**Surface:** Web/PWA, private operational records and bounded public projections
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 24 owns personal collection views, public item visibility, rig definitions and advisory compatibility checks, organisation asset registers and condition, custody/loan/consignment state, cases, manifests and carnet source-data readiness. It composes gear records from [[specs/ia/23-gear-provenance-registry|Shard 23]] without converting possession, grouping, publication or operational condition into ownership.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 13 |
| Child capabilities | 9 |
| Personal operations | Collection visibility, rigs, compatibility and technical source data |
| Organisation operations | Identity- or quantity-tracked register, condition and public backline projection |
| Possession operations | Custody, loan, service, hire, consignment, transit and room residence |
| Logistics operations | Cases, manifests, bulk theft units and carnet readiness |

### Holdings Decisions

| Area | Locked decision |
|---|---|
| Collection privacy | Visibility is per item and private by default. Aggregate value, serials and private location never have a public form. |
| Exposure | Publishing invokes a platform-level composed-exposure check; a material warning names the public facts that combine into physical risk. |
| Rig authority | A rig belongs to an acting person or organisation and may reference a project/tour context; referenced gear retains its independent owner. |
| Rig continuity | A transferred or unavailable member becomes an unresolved placeholder in the live rig and remains in historical snapshots; it is never silently removed. |
| Compatibility | Checks are advisory and on demand. Findings, unchecked members, source freshness and scope are equally prominent; no result is a guarantee. |
| Register model | Organisation registers support identity-tracked assets and operator-selected quantity-tracked commodity lines. |
| Condition honesty | Known condition cannot be hidden from a published item. Unknown, stale and conflicting reports remain explicit and never become “verified working.” |
| Custody | Custody is orthogonal to ownership. Self-asserted custody grants no listing, publication, transfer or insurance authority until owner confirmation. |
| Cases and rigs | Both are first-class many-to-many groupings: rigs are functional; cases are physical and intentionally more volatile. |
| Carnet boundary | This shard produces immutable manifest snapshots, readiness gaps and source data; [[specs/ia/32-show-production-planning|Shard 32]] owns the carnet and advancing process. |

## Features

- **15.04 Gear Collection & Visibility** — [ideation source](../ideation/15-gear-registry-ownership/15.04-gear-collection-visibility.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **15.06 Rig Profile & Compatibility** — [ideation source](../ideation/15-gear-registry-ownership/15.06-rig-profile-compatibility/15.06-rig-profile-compatibility-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **15.07 Studio & Backline Asset Register** — [ideation source](../ideation/15-gear-registry-ownership/15.07-studio-backline-asset-register/15.07-studio-backline-asset-register-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **15.08 Custody, Loans & Consignment** — [ideation source](../ideation/15-gear-registry-ownership/15.08-custody-loans-consignment.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **15.10 Cases, Manifests & Carnet Source Data** — [ideation source](../ideation/15-gear-registry-ownership/15.10-cases-manifests-carnet-source-data.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-24.01 — View collection:** Given Authenticated actor may read owning entity, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) View collection, and (6) return Current and formerly owned records render separately; private aggregate may render; if the flow cannot complete, Unavailable projection preserves filters and offers retry; no partial public fallback.
- **AC-24.02 — Publish collection item:** Given Actor controls item visibility and passes current policy, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Publish collection item, and (6) return Public-safe projection activates after named exposure warning/acknowledgement; if the flow cannot complete, Missing safe rendition, authority or exposure evaluation blocks activation.
- **AC-24.03 — Create rig:** Given Actor may create for person/org; optional project context is readable, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create rig, and (6) return Versioned rig with ordered members and explicit unknowns; if the flow cannot complete, Invalid acting party or inaccessible context rejects atomically.
- **AC-24.04 — Add rig member:** Given Actor may reference record, confirmed custody item or placeholder, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Add rig member, and (6) return Member stores order, role, connections, placement and known/unknown specs; if the flow cannot complete, Hidden owner details stay masked; inaccessible record may be represented only as a placeholder.
- **AC-24.05 — Run compatibility check:** Given Rig and target versions are readable, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Run compatibility check, and (6) return Immutable advisory run returns mismatches, coverage, exclusions and freshness; if the flow cannot complete, Target unavailable/stale is explicit; no silent pass or booking block.
- **AC-24.06 — Export rig source data:** Given Actor may export rig; disclosure grants cover held items, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Export rig source data, and (6) return Versioned source snapshot carries visible gaps and advisory requirements; if the flow cannot complete, Unconsented held item is masked or replaced by non-identifying placeholder.
- **AC-24.07 — Maintain org register:** Given Actor has entity asset role, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Maintain org register, and (6) return Identity asset or quantity line is created/updated with chosen tracking mode; if the flow cannot complete, Mode conversion requiring identity/history is explicit and auditable, never inferred.
- **AC-24.08 — Report condition:** Given Reporter has entity fault-report capability, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Report condition, and (6) return Attributable per-item or count-level report appends in seconds; if the flow cannot complete, Conflicts coexist; correction supersedes but never deletes prior evidence.
- **AC-24.09 — Publish backline:** Given Publisher controls organisation and public room projection, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Publish backline, and (6) return Listing reads current register projection: item/count and honest condition, never serial/price/posture; if the flow cannot complete, Read failure serves last-known-good with age unless privacy/security requires removal.
- **AC-24.10 — Start custody:** Given Owner or proposed holder identifies gear, reason and expected return, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Start custody, and (6) return Pending custody handshake records both parties and no derived rights; if the flow cannot complete, Self-assertion remains pending/contested and confers no authority.
- **AC-24.11 — Confirm custody and grants:** Given Counterparty accepts exact custody and optional grants, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Confirm custody and grants, and (6) return Active custody plus separately scoped disclosure/listing grants; if the flow cannot complete, Partial acceptance activates custody only; silence is neutral.
- **AC-24.12 — Reconcile stale custody:** Given Tunable freshness threshold reached, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Reconcile stale custody, and (6) return Confidence decays and both ends receive one bounded reconciliation prompt; if the flow cannot complete, No response preserves state as stale; system never invents return.
- **AC-24.13 — End or dispute custody:** Given Owner/holder records return, transfer, loss or dispute, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) End or dispute custody, and (6) return Append-only terminal event closes active interval or marks contest; if the flow cannot complete, Concurrent actions resolve by version precondition and visible reconciliation.
- **AC-24.14 — Maintain case membership:** Given Actor controls case and can reference item/placeholder, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Maintain case membership, and (6) return Effective-dated membership supports rapid packing changes and many rigs; if the flow cannot complete, Offline edits reconcile by membership version; removed facts remain in snapshots.
- **AC-24.15 — Generate manifest/readiness:** Given Actor controls selected cases/rigs and export purpose, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Generate manifest/readiness, and (6) return Snapshot lists contents plus missing serial, weight, origin, value and consent gaps; if the flow cannot complete, Incomplete data produces a gap-led report, never a falsely complete carnet source set.
- **AC-24.16 — Bulk theft handoff:** Given Actor has theft-report standing through ownership or qualifying custody, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Bulk theft handoff, and (6) return Case/rig resolves eligible identity records into one report draft for Shard 23; if the flow cannot complete, Placeholders and quantity lines are excluded and reported; duplicate identities join existing flags.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 24.01 | View collection | Authenticated actor may read owning entity | Current and formerly owned records render separately; private aggregate may render | Unavailable projection preserves filters and offers retry; no partial public fallback |
| 24.02 | Publish collection item | Actor controls item visibility and passes current policy | Public-safe projection activates after named exposure warning/acknowledgement | Missing safe rendition, authority or exposure evaluation blocks activation |
| 24.03 | Create rig | Actor may create for person/org; optional project context is readable | Versioned rig with ordered members and explicit unknowns | Invalid acting party or inaccessible context rejects atomically |
| 24.04 | Add rig member | Actor may reference record, confirmed custody item or placeholder | Member stores order, role, connections, placement and known/unknown specs | Hidden owner details stay masked; inaccessible record may be represented only as a placeholder |
| 24.05 | Run compatibility check | Rig and target versions are readable | Immutable advisory run returns mismatches, coverage, exclusions and freshness | Target unavailable/stale is explicit; no silent pass or booking block |
| 24.06 | Export rig source data | Actor may export rig; disclosure grants cover held items | Versioned source snapshot carries visible gaps and advisory requirements | Unconsented held item is masked or replaced by non-identifying placeholder |
| 24.07 | Maintain org register | Actor has entity asset role | Identity asset or quantity line is created/updated with chosen tracking mode | Mode conversion requiring identity/history is explicit and auditable, never inferred |
| 24.08 | Report condition | Reporter has entity fault-report capability | Attributable per-item or count-level report appends in seconds | Conflicts coexist; correction supersedes but never deletes prior evidence |
| 24.09 | Publish backline | Publisher controls organisation and public room projection | Listing reads current register projection: item/count and honest condition, never serial/price/posture | Read failure serves last-known-good with age unless privacy/security requires removal |
| 24.10 | Start custody | Owner or proposed holder identifies gear, reason and expected return | Pending custody handshake records both parties and no derived rights | Self-assertion remains pending/contested and confers no authority |
| 24.11 | Confirm custody and grants | Counterparty accepts exact custody and optional grants | Active custody plus separately scoped disclosure/listing grants | Partial acceptance activates custody only; silence is neutral |
| 24.12 | Reconcile stale custody | Tunable freshness threshold reached | Confidence decays and both ends receive one bounded reconciliation prompt | No response preserves state as stale; system never invents return |
| 24.13 | End or dispute custody | Owner/holder records return, transfer, loss or dispute | Append-only terminal event closes active interval or marks contest | Concurrent actions resolve by version precondition and visible reconciliation |
| 24.14 | Maintain case membership | Actor controls case and can reference item/placeholder | Effective-dated membership supports rapid packing changes and many rigs | Offline edits reconcile by membership version; removed facts remain in snapshots |
| 24.15 | Generate manifest/readiness | Actor controls selected cases/rigs and export purpose | Snapshot lists contents plus missing serial, weight, origin, value and consent gaps | Incomplete data produces a gap-led report, never a falsely complete carnet source set |
| 24.16 | Bulk theft handoff | Actor has theft-report standing through ownership or qualifying custody | Case/rig resolves eligible identity records into one report draft for Shard 23 | Placeholders and quantity lines are excluded and reported; duplicate identities join existing flags |

## Contracts

### Command Contracts

| Command | Required input | Invariants |
|---|---|---|
| `PublishCollectionItem` | `gearRecordId`, `projectionVersion`, `audience`, `exposureAckVersion`, `idempotencyKey` | Audience cannot expose serial, aggregate value, exact location or unsafe media |
| `SaveRigVersion` | `rigId?`, `actingPartyId`, `contextRef?`, ordered `members[]`, `expectedVersion` | Every member is exactly one of record, confirmed-held record or placeholder; unknown specs remain null |
| `RunCompatibility` | `rigVersionId`, `targetVersionId`, `regionStandardVersion?` | Pure, version-pinned and advisory; result includes checked/unchecked counts and target freshness |
| `UpsertRegisterLine` | `entityId`, `mode`, item/count fields, `expectedVersion` | Quantity mode has no serial identity; identity mode references one canonical gear record |
| `AppendConditionReport` | `registerLineId`, `referent`, `grade`, `note`, `observedAt`, `expectedVersion` | Reports append; count faults cannot exceed total count; absence is not inspection |
| `ProposeCustody` | `gearRecordId`, `ownerPartyId`, `holderPartyId`, `reason`, dates, requested grants | Ownership is unchanged; proposer cannot self-grant rights |
| `RespondCustody` | `custodyId`, `decision`, accepted grants, `expectedVersion` | Confirmation is by the counterparty; each grant is separately scoped and revocable |
| `SaveCaseMembership` | `caseId`, membership changes, `effectiveAt`, `expectedVersion` | Case and rig membership remain independent; historical snapshots are immutable |
| `CreateManifestSnapshot` | case/rig versions, purpose, `asOf`, `idempotencyKey` | Output pins source versions and leads with unresolved readiness gaps |

### Cross-Domain Contracts

- Shard 23 is authoritative for gear identity, ownership claims, transfer, theft, service and private valuation facts.
- [[specs/ia/29-venues-spaces|Shard 29]] reads register publication and condition; it owns provision posture, price and bookable availability.
- Shard 32 consumes versioned rig/case source snapshots and owns rider, stage-plot, advancing, freight and carnet workflows.
- Marketplace listing authority consumes active confirmed custody plus an explicit selling grant; custody alone never authorises sale.
- All commands use acting-party context, optimistic version preconditions, idempotency and append-only audit/outbox records.

## Data Models

| Model | Required fields | Rules |
|---|---|---|
| `CollectionProjection` | `partyId`, record refs, ownership lifecycle, per-item visibility, private aggregate | Derived view; former ownership remains; aggregate never enters public projection |
| `PublicGearProjection` | `gearRecordId`, safe label/media, audience, publication version | Omits serial, exact location, private value and hidden-history counts |
| `Rig` / `RigVersion` | `actingPartyId`, `contextRef?`, name, status, version | Actor-owned; context does not become owner; versions immutable after use/export |
| `RigMember` | `kind`, record/placeholder ref, order, role, connection, placement?, specs | Unowned item requires confirmed custody or non-identifying placeholder |
| `CompatibilityRun` | pinned rig/target/reference versions, findings, unchecked members, coverage, freshness | Immutable advisory evidence; no bare `compatible: true` |
| `RegisterLine` | `entityId`, `mode`, `gearRecordId?`, commodity descriptor/count | Identity and quantity shapes are mutually exclusive |
| `ConditionReport` | line, reporter, grade, note, referent/count, observed time, supersession | Grades: `functional`, `degraded`, `faulty`, `out_for_service`; conflicts coexist |
| `PublicBacklineProjection` | room/entity, selected lines, condition composition, source version/time | Reads register; serial, terms and price prohibited; stale age required on fallback |
| `CustodyInterval` | gear, owner, holder, reason, start, expected return, state, confidence | States: `pending`, `active`, `stale`, `disputed`, `ended`; no automatic return |
| `CustodyGrant` | custody, type, scope, issuer, accepted/revoked times | Types include `public_disclosure` and `sell`; grants do not transfer title |
| `Case` / `CaseMembership` | controlling party, label, member ref, effective interval, version | Volatile live set; historical removals retained and snapshots pinned |
| `GearLogisticsFacts` | `gearRecordId`, weight?, countryOfOrigin?, purpose values with source/type | Optional operational extension keyed to the canonical record; missing fields remain explicit readiness gaps |
| `ManifestSnapshot` | purpose, source versions, item rows, gap rows, created by/time | Immutable; source rows distinguish known, unknown, withheld and not-applicable |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`CollectionProjection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `partyId`, record refs, ownership lifecycle, per-item visibility, private aggregate | Derived view; former ownership remains; aggregate never enters public projection.
- **`PublicGearProjection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `gearRecordId`, safe label/media, audience, publication version | Omits serial, exact location, private value and hidden-history counts.
- **`Rig`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `actingPartyId`, `contextRef?`, name, status, version | Actor-owned; context does not become owner; versions immutable after use/export.
- **`RigVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `actingPartyId`, `contextRef?`, name, status, version | Actor-owned; context does not become owner; versions immutable after use/export.
- **`RigMember`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `kind`, record/placeholder ref, order, role, connection, placement?, specs | Unowned item requires confirmed custody or non-identifying placeholder.
- **`CompatibilityRun`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: pinned rig/target/reference versions, findings, unchecked members, coverage, freshness | Immutable advisory evidence; no bare `compatible: true`.
- **`RegisterLine`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `entityId`, `mode`, `gearRecordId?`, commodity descriptor/count | Identity and quantity shapes are mutually exclusive.
- **`ConditionReport`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: line, reporter, grade, note, referent/count, observed time, supersession | Grades: `functional`, `degraded`, `faulty`, `out_for_service`; conflicts coexist.
- **`PublicBacklineProjection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: room/entity, selected lines, condition composition, source version/time | Reads register; serial, terms and price prohibited; stale age required on fallback.
- **`CustodyInterval`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: gear, owner, holder, reason, start, expected return, state, confidence | States: `pending`, `active`, `stale`, `disputed`, `ended`; no automatic return.
- **`CustodyGrant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: custody, type, scope, issuer, accepted/revoked times | Types include `public_disclosure` and `sell`; grants do not transfer title.
- **`Case`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: controlling party, label, member ref, effective interval, version | Volatile live set; historical removals retained and snapshots pinned.
- **`CaseMembership`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: controlling party, label, member ref, effective interval, version | Volatile live set; historical removals retained and snapshots pinned.
- **`GearLogisticsFacts`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: `gearRecordId`, weight?, countryOfOrigin?, purpose values with source/type | Optional operational extension keyed to the canonical record; missing fields remain explicit readiness gaps.
- **`ManifestSnapshot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: purpose, source versions, item rows, gap rows, created by/time | Immutable; source rows distinguish known, unknown, withheld and not-applicable.

## Access Control

| Capability | Owner/controller | Confirmed holder | Entity asset staff | Public |
|---|---:|---:|---:|---:|
| Read private collection/value/location | yes | own custody slice only | entity register scope | no |
| Publish personal item | yes | only with disclosure grant | no | bounded projection |
| Edit rig/case | controller role | if delegated | if entity role permits | no |
| Report condition | yes | held item if permitted | yes, near-zero-effort role | no |
| View condition projection | yes | relevant custody | yes | only selected published lines |
| Propose/dispute custody | yes | yes | delegated entity role | no |
| Grant sale/public disclosure | owner/controller only | no self-grant | only when entity owns item | no |
| Generate private manifest/readiness | controller | delegated holder | delegated entity role | no |

- Every request revalidates acting party, relationship, record visibility and current version server-side.
- Public media uses approved safe renditions. Publication blocks when serial/location exposure cannot be confidently removed or reviewed.
- Public register projections cannot suppress a known condition report; stale/conflicting state renders honestly.
- Realtime messages contain only IDs, versions and event hints; canonical authorization is re-evaluated on refetch.

### Access Escalation

- **Read private collection/value/location:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Publish personal item:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Edit rig/case:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Report condition:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **View condition projection:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Propose/dispute custody:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Grant sale/public disclosure:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Generate private manifest/readiness:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Ordered rigs expose numbered semantic lists and keyboard move controls; drag-and-drop is never the only method.
- Signal paths and compatibility findings have text equivalents; color never carries voltage, severity, coverage or stale status alone.
- Tables support row headers, captions, linear mobile reading and downloadable accessible source data.
- Condition, custody and manifest states use plain language plus timestamps and source attribution.
- Publication/exposure warnings focus predictably, identify the combined risk facts and preserve the actor’s draft on cancellation.
- Bulk packing and fault-report actions provide large targets, visible confirmation and recoverable undo where facts have not gained external reliance.
- Live updates announce concise changes without moving focus; reduced motion and 200% zoom remain fully operable.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `gear.collection_item_published.v1` | item, audience, publication/exposure versions, actor, occurredAt | profile/publication, safety audit, search |
| `gear.rig_version_saved.v1` | rig, old/new version, context, actor | compatibility invalidation, advancing |
| `gear.rig_member_unresolved.v1` | rig/version, member, reason, source event | owner notification, manifest readiness |
| `gear.compatibility_run_completed.v1` | run, pinned versions, severity counts, checked/unchecked counts | rig UI, advancing requirements |
| `gear.register_line_changed.v1` | entity, line, mode, version, actor | venue projection, condition UI |
| `gear.condition_reported.v1` | line, report, grade, referent, observedAt | public projection, booking dependency checks |
| `gear.custody_changed.v1` | custody, prior/new state, grants changed, version | theft standing, listing authority, insurance prompts |
| `gear.case_membership_changed.v1` | case, membership delta, effectiveAt, version | manifest invalidation, bulk theft draft |
| `gear.manifest_snapshot_created.v1` | snapshot, purpose, source versions, gap counts | touring/advancing, audit |
| `gear.readiness_gap_changed.v1` | subject, gap type, prior/new status, version | owner checklist, scheduled reminders |

Events include `eventId`, `schemaVersion`, `aggregateId`, `aggregateVersion`, `actorId`, `actingPartyId`, `correlationId`, `causationId` and `occurredAt`. Consumers are idempotent and refetch canonical state.

## Edge Cases

| Case | Required outcome |
|---|---|
| Public item plus public tour dates/city | Name the composed physical-safety risk before activation; never reveal private facts inside the warning |
| Serial visible in uploaded photo | Create/review a safe rendition; block public activation if safe rendering is uncertain |
| Gear sold while referenced by rig/case | Live rig becomes unresolved placeholder; case prompts reconciliation; historical snapshots remain unchanged |
| Placeholder in compatibility run | Exclude it and show equal-prominence coverage gap |
| Target register is stale or unavailable | Show source age/unavailability; no positive verdict or automatic booking decision |
| Two condition reports conflict | Keep both; public projection renders disagreement with the worse plausible grade prominent |
| Quantity stock fault affects booking | Notify booker when serviceable count falls below reserved requirement, not for irrelevant surplus faults |
| Custody requester and owner disagree | State becomes disputed; no sale/publication authority; platform does not adjudicate possession/title |
| Expected return passes silently | Mark stale, decay confidence and nudge; never auto-return |
| Held item appears in outgoing sheet | Require owner disclosure grant or mask as non-identifying placeholder |
| Case edited offline after snapshot | Snapshot remains valid for its stated version/time; live case shows divergence |
| Carnet data incomplete | Export readiness gaps and known source rows; never label output complete or issue a carnet |

## Dependency References

- Consumes canonical gear identity, transfer, theft standing, service and valuation facts from Shard 23.
- Supplies condition-aware room inventory to Shard 29 without owning price, provision posture or calendar availability.
- Supplies rig/case/manifest source versions and readiness gaps to Shard 32 without owning legal logistics documents.
- Supplies confirmed custody and scoped grants to gear commerce; commerce may not infer rights from possession.
- Uses platform privacy, governed media, notifications, audit/outbox and configurable freshness policies from the architecture.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 24.01 View collection | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.02 Publish collection item | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.03 Create rig | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.04 Add rig member | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.05 Run compatibility check | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.06 Export rig source data | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.07 Maintain org register | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.08 Report condition | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.09 Publish backline | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.10 Start custody | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.11 Confirm custody and grants | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.12 Reconcile stale custody | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.13 End or dispute custody | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.14 Maintain case membership | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.15 Generate manifest/readiness | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 24.16 Bulk theft handoff | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 23:** consume [Shard 23 Contracts](23-gear-provenance-registry.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 23 Event Schemas](23-gear-provenance-registry.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 32:** consume [Shard 32 Contracts](32-show-production-planning.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 32 Event Schemas](32-show-production-planning.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 29:** consume [Shard 29 Contracts](29-venues-spaces.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 29 Event Schemas](29-venues-spaces.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

- 2026-08-02: Initial complete interaction architecture authored from 13 source documents and 9 child capabilities.
- 2026-08-02: Locked private-by-default publication, actor-owned rigs, advisory compatibility, dual register modes, honest condition, confirmed custody grants and gap-led manifests.


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
