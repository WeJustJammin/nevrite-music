# Shard 32 — Event production planning and advancing

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 32 owns event production identity, bill projections, riders, stage/input/monitor plans, venue capability diff, advance checklist, freeze/change control, sheets and rehearsal readiness. It references accepted bookings from [[specs/ia/30-booking-contracts|Shard 30]], venue truth from [[specs/ia/29-venues-spaces|Shard 29]], gear/rig truth from [[specs/ia/24-gear-holdings-operations|Shard 24]] and project collaboration from [[specs/ia/09-projects-collaboration|Shard 09]].

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 21 |
| Child capabilities | 15 |
| Canonical form | Structured production data; sheets, plots and PDFs are versioned renders |
| Booking boundary | Event references Shard-30 deal/booking and never copies economics |
| Venue boundary | Diff reads Shard-29 typed capability/provenance and never writes venue truth |
| Gear boundary | Rider/plot reference Shard-24 assets/rigs and declare supply expectation |
| Launch exclusions | Inbound-email parsing, console session-file exports, RF coordination and full spatial CAD |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Event | Distinct production record from booking; date, venue, act, bill role and production counterparty cross boundary, while deal remains referenced. |
| Bill privacy | Private per act by default with explicit field/section sharing. Off-platform acts are name-only scheduling/technical placeholders. |
| Rider | Structured requirement layer with per-item substitution, negotiability, verification, strictness, supply expectation and provenance. PDF is export only. |
| Sensitive riders | Access rider is person-owned with per-recipient consent. Dietary data defaults to aggregate/class disclosure; severe individual instructions require explicit recipient grant and counsel-approved privacy/retention policy. |
| Diff | Typed three-way `match\|shortfall\|unknown` with qualifiers; caveated/stale hard requirements become actionable unknown/shortfall. It informs checklist and never vetoes. |
| Shared capability | Promoter/production authority explicitly allocates pooled resources across bill; no headliner-first or first-to-advance implicit rule. |
| Checklist | Generated from shortfalls, unknowns, near matches, requirements and constraints; manually extensible. Completion requires counter-confirmation. |
| External advance | Expiring scoped link can read and answer assigned items without account; email reply parsing is disabled. |
| Freeze | Advance freeze creates a versioned plan. Changes remain allowed with reason; deterministic critical changes require acknowledgment, not just delivery. |
| Stage/input | Structured positioned items and derived input rows are canonical. Patch column is venue-writable; act owns source/channel requirements. |
| Monitors | Mix is channels-to-position plus wedge/IEM/send/desk/engineer facts; relative mix levels are soundcheck detail and not modeled. |
| Rehearsal | Event subtype consuming Shard-29/30 room booking; value is readiness checklist and production-plan validation. |

## Features

- **18.01 Event Record & Lifecycle States** — [ideation source](../ideation/18-show-production-touring/18.01-event-record-lifecycle.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.02 Bill & Support Act Management** — [ideation source](../ideation/18-show-production-touring/18.02-bill-support-acts.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.03 Show Advancing** — [ideation source](../ideation/18-show-production-touring/18.03-show-advancing/18.03-show-advancing-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.04 Riders** — [ideation source](../ideation/18-show-production-touring/18.04-riders/18.04-riders-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.05 Stage Plot & Input List** — [ideation source](../ideation/18-show-production-touring/18.05-stage-plot-input-list/18.05-stage-plot-input-list-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.19 Rehearsal & Production Rehearsal Management** — [ideation source](../ideation/18-show-production-touring/18.19-rehearsal-management.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-32.01 — Create event from booking:** Given Accepted/confirmed Shard-30 booking, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create event from booking, and (6) return Event links date, room, act, role, bill and counterparty; if the flow cannot complete, Duplicate causation returns existing event.
- **AC-32.02 — Manage bill projection:** Given Authorized show producer; expected version, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Manage bill projection, and (6) return Ordered slots/TBA/off-platform placeholders update; if the flow cannot complete, Concurrent edit returns mergeable slot conflict.
- **AC-32.03 — Author rider version:** Given Producer/member scope valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Author rider version, and (6) return Structured requirement revision with provenance saves; if the flow cannot complete, Imported/unconfirmed item excluded from diff.
- **AC-32.04 — Grant access-rider disclosure:** Given Person owns requirement; recipient/purpose/date set, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Grant access-rider disclosure, and (6) return Minimal scoped disclosure becomes available; if the flow cannot complete, Revocation stops future access and raises affected item.
- **AC-32.05 — Build stage plot:** Given Act-owned sources/positions available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Build stage plot, and (6) return Structured 2D footprint plus optional height renders; if the flow cannot complete, Geometry conflict names items; list editor remains canonical.
- **AC-32.06 — Derive input list:** Given Plot sources version pinned, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Derive input list, and (6) return Channels/DI/mic/stand/power rows derive deterministically; if the flow cannot complete, Independent row edits rejected except venue patch column.
- **AC-32.07 — Author monitor needs:** Given Person/act permissions valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Author monitor needs, and (6) return Channel-to-position mixes and equipment expectations save; if the flow cannot complete, Relative-level request becomes note, never matched.
- **AC-32.08 — Run venue capability diff:** Given Rider/plot/manifest/venue snapshots available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Run venue capability diff, and (6) return Per-item match/shortfall/unknown, basis, caveats and confidence produce; if the flow cannot complete, Stale hard venue field demotes to unknown.
- **AC-32.09 — Allocate pooled capability:** Given Bill and capacity pool version current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Allocate pooled capability, and (6) return Explicit allocation version resolves per-act availability; if the flow cannot complete, Over-allocation blocks allocation commit, not event.
- **AC-32.10 — Generate advance checklist:** Given Diff and source requirements available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Generate advance checklist, and (6) return Action rows get owner, severity, lead time and resolve-by; if the flow cannot complete, Match generates no row; judgement remains explicit.
- **AC-32.11 — Answer/confirm item:** Given Assigned side or scoped external link, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Answer/confirm item, and (6) return Response, evidence and counter-confirmation append; if the flow cannot complete, Self-confirmation disclosed; no silent completion.
- **AC-32.12 — Apply rider redline:** Given Date overlay and affected owners available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply rider redline, and (6) return Bilateral production delta appends without mutating rider; if the flow cannot complete, Commercial term routes Shard 30; access change needs person.
- **AC-32.13 — Render advance sheet:** Given Authorized version/recipient projection, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Render advance sheet, and (6) return Accessible HTML/PDF/live link renders exact version; if the flow cannot complete, Old link announces supersession.
- **AC-32.14 — Freeze advance:** Given Required gate evaluated or reason supplied, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze advance, and (6) return Frozen plan hash, open items and exception reason append; if the flow cannot complete, Freeze never hides unresolved hard items.
- **AC-32.15 — Change frozen plan:** Given Authorized editor; reason and delta present, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Change frozen plan, and (6) return New version and severity-driven notifications emit; if the flow cannot complete, Critical change remains unacknowledged/at-risk until required actors respond.
- **AC-32.16 — Create rehearsal event:** Given Production plan and room booking exist, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create rehearsal event, and (6) return Rehearsal subtype links readiness scope and outcomes; if the flow cannot complete, No duplicate room calendar/booking state.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 32.01 | Create event from booking | Accepted/confirmed Shard-30 booking | Event links date, room, act, role, bill and counterparty | Duplicate causation returns existing event |
| 32.02 | Manage bill projection | Authorized show producer; expected version | Ordered slots/TBA/off-platform placeholders update | Concurrent edit returns mergeable slot conflict |
| 32.03 | Author rider version | Producer/member scope valid | Structured requirement revision with provenance saves | Imported/unconfirmed item excluded from diff |
| 32.04 | Grant access-rider disclosure | Person owns requirement; recipient/purpose/date set | Minimal scoped disclosure becomes available | Revocation stops future access and raises affected item |
| 32.05 | Build stage plot | Act-owned sources/positions available | Structured 2D footprint plus optional height renders | Geometry conflict names items; list editor remains canonical |
| 32.06 | Derive input list | Plot sources version pinned | Channels/DI/mic/stand/power rows derive deterministically | Independent row edits rejected except venue patch column |
| 32.07 | Author monitor needs | Person/act permissions valid | Channel-to-position mixes and equipment expectations save | Relative-level request becomes note, never matched |
| 32.08 | Run venue capability diff | Rider/plot/manifest/venue snapshots available | Per-item match/shortfall/unknown, basis, caveats and confidence produce | Stale hard venue field demotes to unknown |
| 32.09 | Allocate pooled capability | Bill and capacity pool version current | Explicit allocation version resolves per-act availability | Over-allocation blocks allocation commit, not event |
| 32.10 | Generate advance checklist | Diff and source requirements available | Action rows get owner, severity, lead time and resolve-by | Match generates no row; judgement remains explicit |
| 32.11 | Answer/confirm item | Assigned side or scoped external link | Response, evidence and counter-confirmation append | Self-confirmation disclosed; no silent completion |
| 32.12 | Apply rider redline | Date overlay and affected owners available | Bilateral production delta appends without mutating rider | Commercial term routes Shard 30; access change needs person |
| 32.13 | Render advance sheet | Authorized version/recipient projection | Accessible HTML/PDF/live link renders exact version | Old link announces supersession |
| 32.14 | Freeze advance | Required gate evaluated or reason supplied | Frozen plan hash, open items and exception reason append | Freeze never hides unresolved hard items |
| 32.15 | Change frozen plan | Authorized editor; reason and delta present | New version and severity-driven notifications emit | Critical change remains unacknowledged/at-risk until required actors respond |
| 32.16 | Create rehearsal event | Production plan and room booking exist | Rehearsal subtype links readiness scope and outcomes | No duplicate room calendar/booking state |

## Contracts

| Command | Required input | Output | Explicit errors |
|---|---|---|---|
| `CreateProductionEvent` | booking/show refs, act, bill role, idempotency key | event | `BOOKING_INELIGIBLE`, `EVENT_ALREADY_EXISTS` |
| `VersionRider` | rider/template parents, structured items, provenance | rider version | `ITEM_INVALID`, `SENSITIVE_DATA_MISPLACED`, `AUTHORITY_REQUIRED` |
| `GrantSensitiveDisclosure` | person, recipient, fields, purpose, expiry, consent | grant | `CONSENT_REQUIRED`, `RECIPIENT_INVALID`, `PRIVACY_GATE_DISABLED` |
| `VersionStagePlan` | sources, positions, footprint/height, expected version | plot/input version | `GEOMETRY_INVALID`, `SOURCE_MISSING`, `STALE_VERSION` |
| `EvaluateVenueDiff` | rider/plot/manifest/venue versions, bill allocation | diff | `SNAPSHOT_MISSING`, `SCHEMA_INCOMPATIBLE`, `ALLOCATION_UNRESOLVED` |
| `GenerateAdvanceItems` | diff/source versions, policy version | checklist delta | `SOURCE_STALE`, `LEAD_TIME_INVALID` |
| `RespondAdvanceItem` | item, answer/evidence, actor/link capability | response/state | `LINK_EXPIRED`, `ASSIGNMENT_FORBIDDEN`, `COUNTER_CONFIRM_REQUIRED` |
| `FreezeAdvance` | event/checklist version, exceptions, reason | freeze version | `HARD_ITEM_UNACKNOWLEDGED`, `REASON_REQUIRED`, `STALE_VERSION` |
| `ChangeFrozenAdvance` | freeze, delta, reason, expected version | successor/notifications | `CHANGE_INVALID`, `AUTHORITY_REQUIRED`, `STALE_VERSION` |

- Shard 30 remains authoritative for commercial terms and bill bookings; this shard owns production projection and running readiness.
- Shard 29 remains authoritative for room capability/condition; corrections return through provenance flow, not diff mutation.
- Shard 24 owns asset/rig identity and condition; rider owns requirement/supply expectation only.
- All callbacks, link responses, recomputations and change notifications use stable idempotency keys.

## Data Models

| Aggregate | Key invariants |
|---|---|
| `ProductionEvent` | One per eligible booking causation; references deal/room/bill and mirrors lifecycle without writing settlement |
| `ProductionBill` | Ordered slots, act refs/placeholders and per-act visibility projection |
| `RiderVersion` | Immutable layered template→act→tour→date override; redlines are separate bilateral overlays |
| `RiderItem` | Category, typed requirement, flags, supply expectation, provenance and sensitive-data prohibition |
| `AccessRequirement` | Person-owned content and recipient-specific grants; separate from hospitality |
| `StagePlanVersion` | Structured sources/positions/2D footprints/heights and render hash |
| `InputRow` | Derived source/channel facts plus venue-owned patch field |
| `MonitorMix` | Person/position, source channels and wedge/IEM/send requirements |
| `CapabilityDiff` | Pinned inputs and per-row outcome/basis/caveats/confidence/severity/judgement |
| `CapabilityAllocation` | Explicit pool-to-act assignment for one bill/version |
| `AdvanceItem` | Source, owner/counterparty, severity, lead time, resolve-by, responses and confirmation |
| `AdvanceFreeze` | Event/checklist hash, open items, exception reason and successor lineage |
| `CriticalAcknowledgment` | Change/recipient, delivered/viewed/acknowledged timestamps and escalation state |
| `AdvanceSheet` | Recipient projection/version/render/artifact hash and supersession |

- Event: `draft → advancing → frozen → show_ready → in_progress → completed|cancelled|postponed`; settlement is mirrored only.
- Advance item: `open → answered → counter_confirmed|reopened|waived_with_reason`.
- Diff is immutable per input snapshot and never writes source.
- Every timing threshold, severity/criticality rule and reminder cadence is versioned setting.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Key invariants.
- **`ProductionEvent`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: One per eligible booking causation; references deal/room/bill and mirrors lifecycle without writing settlement.
- **`ProductionBill`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Ordered slots, act refs/placeholders and per-act visibility projection.
- **`RiderVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable layered template→act→tour→date override; redlines are separate bilateral overlays.
- **`RiderItem`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Category, typed requirement, flags, supply expectation, provenance and sensitive-data prohibition.
- **`AccessRequirement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Person-owned content and recipient-specific grants; separate from hospitality.
- **`StagePlanVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Structured sources/positions/2D footprints/heights and render hash.
- **`InputRow`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Derived source/channel facts plus venue-owned patch field.
- **`MonitorMix`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Person/position, source channels and wedge/IEM/send requirements.
- **`CapabilityDiff`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Pinned inputs and per-row outcome/basis/caveats/confidence/severity/judgement.
- **`CapabilityAllocation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Explicit pool-to-act assignment for one bill/version.
- **`AdvanceItem`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source, owner/counterparty, severity, lead time, resolve-by, responses and confirmation.
- **`AdvanceFreeze`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Event/checklist hash, open items, exception reason and successor lineage.
- **`CriticalAcknowledgment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Change/recipient, delivered/viewed/acknowledged timestamps and escalation state.
- **`AdvanceSheet`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Recipient projection/version/render/artifact hash and supersession.

## Access Control

| Actor | Allowed | Denied |
|---|---|---|
| Act producer/TM | Manage act rider, plot, advance, redlines and sharing | Other acts' private sections, venue source mutation |
| Band member/crew | Contribute assigned sections and own person-level defaults | Publish/freeze whole rider unless delegated |
| Promoter/show producer | Manage bill projection, pooled allocation, checklist and freeze | Artist private access/dietary identity without grant |
| Venue production staff | Read shared plan, answer assigned items, patch input rows | Change act requirements or commercial terms |
| Person with access needs | Own requirements and recipient grants | Another person's requirement |
| Scoped external recipient | Read/respond only assigned projection until expiry | Browse event, other acts or sensitive ungranted fields |
| System worker | Diff, generate rows/renders, notify/escalate | Decide suitability, waive hard requirements or infer consent |

- Bill confidentiality and rider section sharing are enforced in query projections, exports and events.
- Critical access records require audited least privilege and counsel-approved retention/deletion.
- Same human on both sides is disclosed and cannot silently satisfy counter-confirmation.

### Access Escalation

- **Act producer/TM:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Band member/crew:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Promoter/show producer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Venue production staff:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Person with access needs:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Scoped external recipient:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Structured list/form is canonical for stage plot and bill ordering; visual canvas/drag is optional enhancement.
- Plot has textual coordinates, dimensions, source labels and collision list; input/monitor rows are keyboard-editable.
- Diff and checklist expose status, basis, confidence, age, severity and owner in text, never color alone.
- External advance link and PDFs have accessible HTML parity, tagged structure and clear expiry/supersession.
- Freeze/change screens summarize open hard items and critical recipients before commit.
- Sensitive disclosure clearly states recipient, fields, purpose, expiry and revoke effect in plain language.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `production.event.changed` | event, booking/lifecycle refs, state | Shards 33/34 |
| `production.rider.versioned` | rider/version, layer parents, changed item refs | diff, advance |
| `production.stage_plan.versioned` | plan/input versions, render hash | diff, crew |
| `production.capability_diff.completed` | diff, snapshots, outcome counts/row refs | checklist, producer |
| `production.advance.item_changed` | item, state, actor/source, resolve-by | sheets, notifications |
| `production.advance.frozen` | event, freeze hash, open/exception refs | all production parties |
| `production.advance.changed_after_freeze` | old/new, delta, critical recipients | acknowledgments, operations |
| `production.sensitive_grant_changed` | person/recipient/purpose/scope/state | access audit |

Events carry references, not private access details, dietary identities or full rider documents. Consumers dedupe and order by aggregate version.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Venue field stale on hard requirement | Diff returns unknown and creates hard checklist row |
| Pool shared across three acts | Explicit producer allocation; over-allocation named, no implicit priority |
| Imported PDF rider | Draft items remain unconfirmed and excluded from diff |
| Access requirement redlined by manager | Reject until affected person approves exact recipient/delta |
| External link forwarded | Capability remains recipient/scope/expiry bound and access is audited/revocable |
| Concurrent bill slot edits | Per-slot/version merge; conflicting reorder requires explicit resolution |
| Freeze with open hard item | Permit only with visible reason and required-party notification |
| Critical change notification delivered but unopened | Remains unacknowledged and escalates |
| Rider changes after freeze | New diff/checklist successor; prior frozen plan remains evidence |
| Rehearsal reveals shortfall | Append production outcome/change proposal; never mutate venue/gear source silently |
| Scheduled outage near show | Cached read-only sheets available; edits/acknowledgments wait for server and reconcile |

## Surface Applicability

Responsive web/PWA is the sole launch surface. Offline rider/plot/checklist drafts and cached read-only sheets are allowed; freeze, sensitive disclosure, counter-confirmation and critical acknowledgment require server confirmation. Normal-web reads target p95 ≤2 seconds; production operations run continuously except scheduled outages.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 32.01 Create event from booking | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.02 Manage bill projection | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.03 Author rider version | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.04 Grant access-rider disclosure | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.05 Build stage plot | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.06 Derive input list | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.07 Author monitor needs | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.08 Run venue capability diff | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.09 Allocate pooled capability | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.10 Generate advance checklist | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.11 Answer/confirm item | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.12 Apply rider redline | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.13 Render advance sheet | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.14 Freeze advance | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.15 Change frozen plan | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 32.16 Create rehearsal event | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/09-projects-collaboration|Shard 09]], [[specs/ia/24-gear-holdings-operations|Shard 24]], [[specs/ia/29-venues-spaces|Shard 29]], [[specs/ia/30-booking-contracts|Shard 30]]
- **Depended on by:** [[specs/ia/33-show-day-tour-operations|Shard 33]], [[specs/ia/34-event-ticketing|Shard 34]]


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 09:** consume [Shard 09 Contracts](09-projects-collaboration.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 09 Event Schemas](09-projects-collaboration.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 24:** consume [Shard 24 Contracts](24-gear-holdings-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 24 Event Schemas](24-gear-holdings-operations.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 29:** consume [Shard 29 Contracts](29-venues-spaces.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 29 Event Schemas](29-venues-spaces.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 30:** consume [Shard 30 Contracts](30-booking-contracts.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 30 Event Schemas](30-booking-contracts.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 33:** consume [Shard 33 Contracts](33-show-day-tour-operations.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 33 Event Schemas](33-show-day-tour-operations.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 34:** consume [Shard 34 Contracts](34-event-ticketing.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 34 Event Schemas](34-event-ticketing.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Authored and deepened complete IA contract | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/29-venues-spaces|Shard 29 — Venues, studios and spaces]]
- [[specs/ia/24-gear-holdings-operations|Shard 24 — Gear collections, rigs, custody and manifests]]
- [[specs/ia/09-projects-collaboration|Shard 09 — Music projects and collaboration]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
